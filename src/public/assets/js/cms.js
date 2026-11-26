/**
 * CMS 'Ontmoet de Oudegracht' — gebruiksgemak voor redacteuren.
 * Alles werkt ook zonder JavaScript (behalve de kaart- en filmhulp).
 */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const fmt = (sec) => {
    sec = Math.max(0, Math.round(sec || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };
  const parse = (text) => {
    const v = String(text || '').trim().replace(',', '.');
    let m = v.match(/^(\d{1,3}):([0-5]?\d(?:\.\d+)?)$/);
    if (m) return parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    m = v.match(/^\d+(?:\.\d+)?$/);
    return m ? parseFloat(v) : null;
  };

  /* ---------- Bevestigen voor verwijderen ---------- */
  $$('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!window.confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

  /* ---------- Foutoverzicht in beeld brengen ---------- */
  const summary = $('[data-focus]');
  if (summary) {
    summary.scrollIntoView({ block: 'start' });
    summary.focus();
  }

  /* ---------- Waarschuwen bij niet-opgeslagen wijzigingen ---------- */
  $$('#location-form, #settings-form, #route-form').forEach((form) => {
    let dirty = false;
    const note = $('#dirty-note');
    const mark = () => { dirty = true; if (note) note.hidden = false; };
    form.addEventListener('input', mark);
    form.addEventListener('change', mark);
    form.addEventListener('og-dirty', mark);
    form.addEventListener('submit', () => { dirty = false; });
    window.addEventListener('beforeunload', (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  });

  /* ---------- Tekentellers bij lange teksten ---------- */
  $$('textarea[data-counter]').forEach((ta) => {
    const out = document.createElement('p');
    out.className = 'hint counter';
    out.setAttribute('aria-live', 'polite');
    ta.after(out);
    const update = () => {
      const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
      out.textContent = words + ' woorden' + (words > 130 ? ' — lang voor een digibord, kan het korter?' : '');
      out.classList.toggle('counter-warn', words > 130);
    };
    ta.addEventListener('input', update);
    update();
  });

  /* ---------- Voorbeeld van gekozen foto ---------- */
  const upload = $('#upload');
  const urlField = $('#image_url');
  const preview = $('#image-preview');
  if (preview) {
    const img = $('img', preview);
    const show = (src) => { if (src) { img.src = src; preview.hidden = false; } else { preview.hidden = true; } };
    if (upload) upload.addEventListener('change', () => {
      const f = upload.files && upload.files[0];
      if (f && f.size > 8 * 1024 * 1024) {
        alert('Deze foto is groter dan 8 MB. Kies een kleinere foto.');
        upload.value = '';
        show('');
        return;
      }
      show(f ? URL.createObjectURL(f) : '');
    });
    if (urlField) {
      urlField.addEventListener('change', () => show(/^https?:\/\//.test(urlField.value) ? urlField.value : ''));
      if (urlField.value) show(urlField.value.startsWith('uploads/') ? '../' + urlField.value : urlField.value);
    }
    img.addEventListener('error', () => { preview.hidden = true; });
  }

  /* ---------- Kaarthulp ---------- */
  function makeMap(container, onPick) {
    const map = new window.OudegrachtMap($('.map-picker-map', container), { data: window.OUDEGRACHT_MAP, onPick });
    $$('[data-map]', container).forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.map;
      if (a === 'in') map.zoomIn();
      else if (a === 'out') map.zoomOut();
      else if (a === 'base') {
        const on = map.setBase(map.base === 'luchtfoto' ? 'kaart' : 'luchtfoto') === 'luchtfoto';
        b.setAttribute('aria-pressed', String(on));
      } else map.reset();
    }));
    return map;
  }

  /* ---------- Film: tijd overnemen ---------- */
  const video = $('#picker-video');
  const timeField = $('#start_time');
  if (video && timeField) {
    $('#use-video-time').addEventListener('click', () => {
      video.pause();
      timeField.value = fmt(video.currentTime);
      timeField.dispatchEvent(new Event('input', { bubbles: true }));
      timeField.focus();
    });
    $('#goto-video-time').addEventListener('click', () => {
      const t = parse(timeField.value);
      if (t == null) { alert('Vul eerst een tijd in, zoals 1:24.'); timeField.focus(); return; }
      video.currentTime = t;
      video.play().catch(() => {});
    });
  }

  /* ---------- Locatie: plek kiezen op de kaart ---------- */
  const picker = $('#map-picker');
  if (picker) {
    const lat = $('#lat'), lng = $('#lng'), text = $('#position-text');
    const describe = () => {
      text.textContent = lat.value && lng.value
        ? 'Gekozen plek: ' + parseFloat(lat.value).toFixed(5) + ', ' + parseFloat(lng.value).toFixed(5)
        : 'Nog geen plek gekozen — tik op de kaart.';
    };
    const map = makeMap(picker, (la, ln) => {
      lat.value = la; lng.value = ln;
      map.setMarker(la, ln);
      describe();
      picker.closest('form').dispatchEvent(new Event('og-dirty'));
    });
    const others = JSON.parse(picker.dataset.others || '[]');
    const route = JSON.parse(picker.dataset.route || '[]');
    map.setRoute(route, { boat: false });
    map.setLocations(others.map((o) => Object.assign({ label: o.code }, o)), { muted: true });
    map.autoFit(route.length ? route : null);
    if (lat.value && lng.value) {
      map.setMarker(parseFloat(lat.value), parseFloat(lng.value));
    }
    describe();
  }

  /* ---------- Route-editor ---------- */
  const routeMap = $('#route-map');
  if (routeMap) {
    const tbody = $('#route-table tbody');
    const form = $('#route-form');
    let picking = null; // rij die op een plek wacht

    const rows = () => $$('tr', tbody);
    const points = () => rows().map((tr) => ({
      lat: parseFloat($('input[name="lat[]"]', tr).value),
      lng: parseFloat($('input[name="lng[]"]', tr).value),
      active: tr === picking
    })).filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

    const map = makeMap(routeMap, (la, ln) => {
      const tr = picking || rows()[rows().length - 1];
      if (!tr) return;
      $('input[name="lat[]"]', tr).value = la;
      $('input[name="lng[]"]', tr).value = ln;
      setPicking(null);
      refresh();
      form.dispatchEvent(new Event('og-dirty'));
    });
    const locs = JSON.parse(routeMap.dataset.locations || '[]');
    map.setLocations(locs.map((o) => Object.assign({ label: o.code }, o)), { muted: true });

    function setPicking(tr) {
      picking = tr;
      rows().forEach((r) => r.classList.toggle('is-picking', r === tr));
      routeMap.classList.toggle('is-picking', !!tr);
      if (tr) $('[data-pick]', tr).textContent = 'Tik nu op de kaart…';
      refresh();
    }

    function refresh() {
      rows().forEach((tr, i) => {
        $('.code-badge', tr).textContent = String(i + 1);
        const la = $('input[name="lat[]"]', tr).value, ln = $('input[name="lng[]"]', tr).value;
        $('[data-coords]', tr).textContent = la && ln ? parseFloat(la).toFixed(5) + ', ' + parseFloat(ln).toFixed(5) : 'nog geen plek';
        $('input[name="time[]"]', tr).setAttribute('aria-label', 'Tijd van punt ' + (i + 1));
        if (tr !== picking) $('[data-pick]', tr).textContent = 'Kies op kaart';
      });
      map.setPoints(points());
    }

    function bindRow(tr) {
      $('[data-pick]', tr).addEventListener('click', () => setPicking(picking === tr ? null : tr));
      $('[data-remove]', tr).addEventListener('click', () => {
        if (picking === tr) picking = null;
        tr.remove();
        refresh();
        form.dispatchEvent(new Event('og-dirty'));
      });
      $('input[name="time[]"]', tr).addEventListener('focus', () => {
        const t = parse($('input[name="time[]"]', tr).value);
        const v = $('#picker-video');
        if (t != null && v) v.currentTime = t;
      });
    }
    rows().forEach(bindRow);

    $('#route-add').addEventListener('click', () => {
      const v = $('#picker-video');
      v.pause();
      const tpl = $('#route-row').content.firstElementChild.cloneNode(true);
      $('input[name="time[]"]', tpl).value = fmt(v.currentTime);
      // op de juiste plek in de tijdvolgorde invoegen
      const t = v.currentTime;
      const after = rows().find((tr) => (parse($('input[name="time[]"]', tr).value) || 0) > t);
      tbody.insertBefore(tpl, after || null);
      bindRow(tpl);
      setPicking(tpl);
      form.dispatchEvent(new Event('og-dirty'));
      tpl.scrollIntoView({ block: 'nearest' });
    });

    map.autoFit(points().length ? points() : null);
    refresh();
  }
})();
