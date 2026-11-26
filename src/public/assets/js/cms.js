/**
 * CMS 'Ontmoet de Oudegracht': extra gebruiksgemak voor redacteuren.
 * Alles werkt ook zonder JavaScript, behalve de kaart en de hulp bij de film.
 */
(function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  /** Seconden als m:ss, bijvoorbeeld 84 wordt "1:24". */
  const formatTime = (seconds) => {
    seconds = Math.max(0, Math.round(seconds || 0));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  };

  /** "1:24" of "84" omzetten naar seconden; null bij ongeldige invoer (zelfde regels als parse_time in PHP). */
  const parseTime = (text) => {
    const value = String(text || '').trim().replace(',', '.');
    const minutesSeconds = value.match(/^(\d{1,3}):([0-5]?\d(?:\.\d+)?)$/);
    if (minutesSeconds) return parseInt(minutesSeconds[1], 10) * 60 + parseFloat(minutesSeconds[2]);
    return /^\d+(?:\.\d+)?$/.test(value) ? parseFloat(value) : null;
  };

  /** Laat het formulier weten dat er iets is gewijzigd (voor de waarschuwing bij weggaan). */
  const markDirty = (form) => form.dispatchEvent(new Event('og-dirty'));

  /* ---------- Bevestigen voor verwijderen ---------- */
  $$('form[data-confirm]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
  });

  /* ---------- Foutoverzicht in beeld brengen ---------- */
  const errorSummary = $('[data-focus]');
  if (errorSummary) {
    errorSummary.scrollIntoView({ block: 'start' });
    errorSummary.focus();
  }

  /* ---------- Waarschuwen bij niet-opgeslagen wijzigingen ---------- */
  $$('#location-form, #settings-form, #route-form').forEach((form) => {
    let hasChanges = false;
    const note = $('#dirty-note');
    const onChange = () => { hasChanges = true; if (note) note.hidden = false; };
    form.addEventListener('input', onChange);
    form.addEventListener('change', onChange);
    form.addEventListener('og-dirty', onChange);
    form.addEventListener('submit', () => { hasChanges = false; });
    window.addEventListener('beforeunload', (event) => {
      if (hasChanges) { event.preventDefault(); event.returnValue = ''; }
    });
  });

  /* ---------- Woordenteller bij lange teksten ---------- */
  const LONG_TEXT_WORDS = 130; // langer is lastig te lezen op een digibord
  $$('textarea[data-counter]').forEach((textarea) => {
    const counter = document.createElement('p');
    counter.className = 'hint counter';
    counter.setAttribute('aria-live', 'polite');
    textarea.after(counter);
    const update = () => {
      const text = textarea.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      const tooLong = words > LONG_TEXT_WORDS;
      counter.textContent = words + ' woorden' + (tooLong ? ' — lang voor een digibord, kan het korter?' : '');
      counter.classList.toggle('counter-warn', tooLong);
    };
    textarea.addEventListener('input', update);
    update();
  });

  /* ---------- Voorbeeld van de gekozen foto ---------- */
  const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // gelijk aan uploads.max_bytes in config.php
  const uploadField = $('#upload');
  const urlField = $('#image_url');
  const preview = $('#image-preview');
  if (preview) {
    const previewImg = $('img', preview);
    const showPreview = (src) => {
      if (src) { previewImg.src = src; preview.hidden = false; } else { preview.hidden = true; }
    };
    if (uploadField) uploadField.addEventListener('change', () => {
      const file = uploadField.files && uploadField.files[0];
      if (file && file.size > MAX_UPLOAD_BYTES) {
        alert('Deze foto is groter dan 8 MB. Kies een kleinere foto.');
        uploadField.value = '';
        showPreview('');
        return;
      }
      showPreview(file ? URL.createObjectURL(file) : '');
    });
    if (urlField) {
      urlField.addEventListener('change', () => showPreview(/^https?:\/\//.test(urlField.value) ? urlField.value : ''));
      // Geuploade foto's staan in uploads/, gezien vanaf /cms/ is dat ../uploads/
      if (urlField.value) showPreview(urlField.value.startsWith('uploads/') ? '../' + urlField.value : urlField.value);
    }
    previewImg.addEventListener('error', () => { preview.hidden = true; });
  }

  /* ---------- Kaart met knoppen (plek kiezen en route) ---------- */
  function makeMap(container, onPick) {
    const map = new window.OudegrachtMap($('.map-picker-map', container), { data: window.OUDEGRACHT_MAP, onPick });
    $$('[data-map]', container).forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset.map;
      if (action === 'in') map.zoomIn();
      else if (action === 'out') map.zoomOut();
      else if (action === 'base') {
        const aerial = map.setBase(map.base === 'luchtfoto' ? 'kaart' : 'luchtfoto') === 'luchtfoto';
        button.setAttribute('aria-pressed', String(aerial));
      } else map.reset();
    }));
    return map;
  }

  /** Coordinaten leesbaar tonen, met 5 decimalen (ongeveer 1 meter). */
  const formatPosition = (lat, lng) => parseFloat(lat).toFixed(5) + ', ' + parseFloat(lng).toFixed(5);

  /* ---------- Film: moment overnemen in het formulier ---------- */
  const video = $('#picker-video');
  const timeField = $('#start_time');
  if (video && timeField) {
    $('#use-video-time').addEventListener('click', () => {
      video.pause();
      timeField.value = formatTime(video.currentTime);
      timeField.dispatchEvent(new Event('input', { bubbles: true }));
      timeField.focus();
    });
    $('#goto-video-time').addEventListener('click', () => {
      const time = parseTime(timeField.value);
      if (time == null) { alert('Vul eerst een tijd in, zoals 1:24.'); timeField.focus(); return; }
      video.currentTime = time;
      video.play().catch(() => {});
    });
  }

  /* ---------- Plek bewerken: de plek kiezen op de kaart ---------- */
  const picker = $('#map-picker');
  if (picker) {
    const latField = $('#lat'), lngField = $('#lng'), positionText = $('#position-text');
    const describePosition = () => {
      positionText.textContent = latField.value && lngField.value
        ? 'Gekozen plek: ' + formatPosition(latField.value, lngField.value)
        : 'Nog geen plek gekozen — tik op de kaart.';
    };
    const map = makeMap(picker, (lat, lng) => {
      latField.value = lat;
      lngField.value = lng;
      map.setMarker(lat, lng);
      describePosition();
      markDirty(picker.closest('form'));
    });
    // De andere plekken en de route staan grijs op de kaart, als houvast
    const otherLocations = JSON.parse(picker.dataset.others || '[]');
    const route = JSON.parse(picker.dataset.route || '[]');
    map.setRoute(route, { boat: false });
    map.setLocations(otherLocations.map((other) => Object.assign({ label: other.code }, other)), { muted: true });
    map.autoFit(route.length ? route : null);
    if (latField.value && lngField.value) {
      map.setMarker(parseFloat(latField.value), parseFloat(lngField.value));
    }
    describePosition();
  }

  /* ---------- Route van de boot: tabel met routepunten en de kaart ---------- */
  const routeMap = $('#route-map');
  if (routeMap) {
    const tableBody = $('#route-table tbody');
    const form = $('#route-form');
    let pickingRow = null; // de rij die wacht op een tik op de kaart

    const rows = () => $$('tr', tableBody);
    const field = (row, name) => $(`input[name="${name}[]"]`, row);
    const points = () => rows().map((row) => ({
      lat: parseFloat(field(row, 'lat').value),
      lng: parseFloat(field(row, 'lng').value),
      active: row === pickingRow
    })).filter((point) => !isNaN(point.lat) && !isNaN(point.lng));

    // Tik op de kaart: plek invullen in de rij die wacht (of anders de laatste rij)
    const map = makeMap(routeMap, (lat, lng) => {
      const row = pickingRow || rows()[rows().length - 1];
      if (!row) return;
      field(row, 'lat').value = lat;
      field(row, 'lng').value = lng;
      setPickingRow(null);
      refresh();
      markDirty(form);
    });
    const locations = JSON.parse(routeMap.dataset.locations || '[]');
    map.setLocations(locations.map((location) => Object.assign({ label: location.code }, location)), { muted: true });

    function setPickingRow(row) {
      pickingRow = row;
      rows().forEach((other) => other.classList.toggle('is-picking', other === row));
      routeMap.classList.toggle('is-picking', !!row);
      if (row) $('[data-pick]', row).textContent = 'Tik nu op de kaart…';
      refresh();
    }

    /** Nummers, coordinaten en knopteksten in de tabel bijwerken, en de punten op de kaart. */
    function refresh() {
      rows().forEach((row, index) => {
        $('.code-badge', row).textContent = String(index + 1);
        const lat = field(row, 'lat').value, lng = field(row, 'lng').value;
        $('[data-coords]', row).textContent = lat && lng ? formatPosition(lat, lng) : 'nog geen plek';
        field(row, 'time').setAttribute('aria-label', 'Tijd van punt ' + (index + 1));
        if (row !== pickingRow) $('[data-pick]', row).textContent = 'Kies op kaart';
      });
      map.setPoints(points());
    }

    function bindRow(row) {
      $('[data-pick]', row).addEventListener('click', () => setPickingRow(pickingRow === row ? null : row));
      $('[data-remove]', row).addEventListener('click', () => {
        if (pickingRow === row) pickingRow = null;
        row.remove();
        refresh();
        markDirty(form);
      });
      // Klik in een tijdveld: de film springt naar dat moment
      field(row, 'time').addEventListener('focus', () => {
        const time = parseTime(field(row, 'time').value);
        if (time != null && video) video.currentTime = time;
      });
    }
    rows().forEach(bindRow);

    $('#route-add').addEventListener('click', () => {
      video.pause();
      const newRow = $('#route-row').content.firstElementChild.cloneNode(true);
      field(newRow, 'time').value = formatTime(video.currentTime);
      // Op de juiste plek in de tijdvolgorde invoegen
      const now = video.currentTime;
      const nextRow = rows().find((row) => (parseTime(field(row, 'time').value) || 0) > now);
      tableBody.insertBefore(newRow, nextRow || null);
      bindRow(newRow);
      setPickingRow(newRow);
      markDirty(form);
      newRow.scrollIntoView({ block: 'nearest' });
    });

    map.autoFit(points().length ? points() : null);
    refresh();
  }
})();
