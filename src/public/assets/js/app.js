/**
 * Ontmoet de Oudegracht — bezoekers-app
 * Film + meelopende kaart + informatie per plek, in het Nederlands en Engels.
 */
(function () {
  'use strict';

  const DATA = window.OUDEGRACHT;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ------------------------------------------------------------------
   *  Vaste teksten van de interface
   * ------------------------------------------------------------------ */
  const UI = {
    nl: {
      help: 'Uitleg', colofon: 'Colofon', filmHeading: 'Film van de Oudegracht uit 1929',
      nowPassing: 'Je vaart nu langs', videoError: 'De film kan nu niet worden geladen. Vraag een medewerker om hulp.',
      prevStop: 'Vorige plek', nextStop: 'Volgende plek', back10: '10 seconden terug', fwd10: '10 seconden vooruit',
      play: 'Afspelen', pause: 'Pauzeren', sound: 'Geluid aan of uit', volume: 'Volume', position: 'Positie in de film',
      mapHeading: 'Waar vaart de boot?', follow: 'Volg de boot', zoomIn: 'Inzoomen', zoomOut: 'Uitzoomen',
      zoomReset: 'Hele kaart tonen', mapHint: 'Tik op een nummer om erheen te varen',
      mapDesc: 'Kaart van de Oudegracht met de route van de boot en de plekken uit de film. Tik op een genummerd punt om daarheen te gaan.',
      aboutThisPlace: 'Over deze plek', startEyebrow: 'Klaar voor vertrek', viewNow: 'Zo ziet het er nu uit',
      step1: 'Start de film en vaar mee', step2: 'Tik op een nummer op de kaart', step3: 'Tik op een foto om in te zoomen',
      start: 'Start de boottocht', close: 'Sluiten', aboutHua: 'Over Het Utrechts Archief', aboutApp: 'Over deze applicatie',
      makers: 'Gemaakt door', client: 'Opdrachtgever', film: 'Film', photos: "Foto's", mapData: 'Kaart', contact: 'Contact',
      photosCredit: 'Beeldbank Het Utrechts Archief. Bij elke foto staan de maker en het catalogusnummer.',
      prevPhoto: 'Vorige foto', nextPhoto: 'Volgende foto', mapsNote: 'Satellietbeeld van Google Maps. Wil je de plek in 3D zien?',
      open3d: 'Open in 3D', catalog: 'cat.nr.', photoOf: 'Foto {n} van {total}', viewPhoto: 'Bekijk foto: {caption}',
      goTo: 'Ga naar {code}: {title}', noPhotos: 'Bij deze plek zijn nog geen foto\'s.', boat: 'De boot',
      startTitle: 'Vaar mee over de Oudegracht',
      startText: 'Start de film. Zodra de boot bij een bijzondere plek komt, lees je hier het verhaal en zie je oude foto\'s uit het archief.',
      nowTitle: 'De plek nu: {title}'
    },
    en: {
      help: 'Help', colofon: 'Credits', filmHeading: 'Film of the Oudegracht from 1929',
      nowPassing: 'You are now passing', videoError: 'The film cannot be loaded right now. Please ask a member of staff.',
      prevStop: 'Previous stop', nextStop: 'Next stop', back10: 'Back 10 seconds', fwd10: 'Forward 10 seconds',
      play: 'Play', pause: 'Pause', sound: 'Sound on or off', volume: 'Volume', position: 'Position in the film',
      mapHeading: 'Where is the boat?', follow: 'Follow the boat', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
      zoomReset: 'Show whole map', mapHint: 'Tap a number to sail there',
      mapDesc: 'Map of the Oudegracht showing the route of the boat and the places in the film. Tap a numbered point to go there.',
      aboutThisPlace: 'About this place', startEyebrow: 'Ready to set sail', viewNow: 'What it looks like today',
      step1: 'Start the film and sail along', step2: 'Tap a number on the map', step3: 'Tap a photo to zoom in',
      start: 'Start the boat trip', close: 'Close', aboutHua: 'About Het Utrechts Archief', aboutApp: 'About this application',
      makers: 'Made by', client: 'Client', film: 'Film', photos: 'Photos', mapData: 'Map', contact: 'Contact',
      photosCredit: 'Image bank of Het Utrechts Archief. Each photo shows its maker and catalogue number.',
      prevPhoto: 'Previous photo', nextPhoto: 'Next photo', mapsNote: 'Satellite image from Google Maps. Want to see the place in 3D?',
      open3d: 'Open in 3D', catalog: 'cat. no.', photoOf: 'Photo {n} of {total}', viewPhoto: 'View photo: {caption}',
      goTo: 'Go to {code}: {title}', noPhotos: 'There are no photos for this place yet.', boat: 'The boat',
      startTitle: 'Sail along the Oudegracht',
      startText: 'Start the film. When the boat reaches a special place, you can read its story here and see old photos from the archive.',
      nowTitle: 'The place today: {title}'
    }
  };

  const state = {
    lang: 'nl',
    current: null,       // actieve locatie
    lightboxIndex: 0,
    duration: 0,
    lastInteraction: Date.now()
  };

  const locations = (DATA.locations || []).slice().sort((a, b) => a.time - b.time);

  const t = (key, vars) => {
    let s = (UI[state.lang] && UI[state.lang][key]) || UI.nl[key] || key;
    for (const k in vars || {}) s = s.replace('{' + k + '}', vars[k]);
    return s;
  };
  const tr = (obj) => (obj && (obj[state.lang] || obj.nl)) || '';

  /** Tekst met lege regels omzetten naar veilige alinea's. */
  function paragraphs(container, text) {
    container.textContent = '';
    String(text || '').split(/\n\s*\n/).forEach((block) => {
      if (!block.trim()) return;
      const p = document.createElement('p');
      p.textContent = block.trim();
      container.appendChild(p);
    });
  }

  const fmt = (sec) => {
    sec = Math.max(0, Math.floor(sec || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };

  /* ------------------------------------------------------------------
   *  Elementen
   * ------------------------------------------------------------------ */
  const video = $('#film');
  const btnPlay = $('#btn-play');
  const bigPlay = $('#big-play');
  const btnMute = $('#btn-mute');
  const volume = $('#volume');
  const scrubber = $('#scrubber');
  const progress = $('#timeline-progress');
  const markersEl = $('#timeline-markers');
  const clock = $('#clock');
  const hotspot = $('#video-hotspot');
  const dialogs = { intro: $('#intro'), colofon: $('#colofon'), lightbox: $('#lightbox'), maps: $('#maps') };

  /* ------------------------------------------------------------------
   *  Kaart
   * ------------------------------------------------------------------ */
  const mapSvg = $('#map');
  const followBtn = $('#map-follow');
  const map = new window.OudegrachtMap(mapSvg, {
    data: window.OUDEGRACHT_MAP,
    minimap: $('#minimap-svg'),
    minimapWrap: $('#minimap'),
    labels: { boat: t('boat') },
    onHotspot: (loc) => goToLocation(loc)
  });
  map.follow = true;
  map.setRoute(DATA.route || []);
  // Startweergave: de hele route met alle plekken in beeld, passend in het kader
  map.autoFit((DATA.route || []).concat(locations));
  /** Startweergave: ingezoomd op de boot, die gevolgd wordt. */
  function homeMap() {
    map.reset();
    if (map.boatXY) map.zoomAt(2, map.boatXY.x, map.boatXY.y);
  }
  homeMap();
  map.setLocations(locations.map(l => Object.assign({}, l, { label: l.code + ' ' + tr(l.title) })));

  mapSvg.addEventListener('og-follow', (e) => setFollow(e.detail));
  function setFollow(on) {
    map.follow = on;
    followBtn.setAttribute('aria-pressed', String(on));
    if (on && map.boatXY && map.zoomLevel() > 1.05) map.centerOn(map.boatXY.x, map.boatXY.y);
  }
  followBtn.addEventListener('click', () => {
    setFollow(!map.follow);
    if (map.follow && map.zoomLevel() <= 1.05 && map.boatXY) map.zoomAt(2.2, map.boatXY.x, map.boatXY.y);
  });
  $('#map-zoom-in').addEventListener('click', () => map.zoomIn());
  $('#map-zoom-out').addEventListener('click', () => map.zoomOut());
  $('#map-reset').addEventListener('click', () => map.reset());

  /* Toegankelijke lijst van plekken (voor schermlezers en toetsenbord) */
  function renderStopList() {
    const list = $('#stop-list');
    list.textContent = '';
    locations.forEach((loc) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t('goTo', { code: loc.code, title: tr(loc.title) }) + ' (' + fmt(loc.time) + ')';
      b.addEventListener('click', () => goToLocation(loc));
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------
   *  Tijdlijn met hotspots
   * ------------------------------------------------------------------ */
  function renderMarkers() {
    markersEl.textContent = '';
    const dur = state.duration || 1;
    locations.forEach((loc) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'marker';
      b.style.left = Math.min(100, (loc.time / dur) * 100) + '%';
      b.dataset.id = loc.id;
      b.textContent = loc.code;
      b.setAttribute('aria-label', t('goTo', { code: loc.code, title: tr(loc.title) }));
      b.title = tr(loc.title);
      b.addEventListener('click', () => goToLocation(loc));
      markersEl.appendChild(b);
    });
    highlightMarker();
  }

  function highlightMarker() {
    $$('.marker', markersEl).forEach((m) => {
      const active = state.current && m.dataset.id === String(state.current.id);
      m.classList.toggle('is-active', !!active);
      if (active) m.setAttribute('aria-current', 'true'); else m.removeAttribute('aria-current');
    });
  }

  /* ------------------------------------------------------------------
   *  Film
   * ------------------------------------------------------------------ */
  function setDuration() {
    if (isFinite(video.duration) && video.duration > 0) {
      state.duration = video.duration;
      renderMarkers();
      updateClock();
    }
  }
  video.addEventListener('loadedmetadata', setDuration);
  video.addEventListener('durationchange', setDuration);
  video.addEventListener('error', () => { $('#video-error').hidden = false; });
  $('source', video).addEventListener('error', () => { $('#video-error').hidden = false; });

  function togglePlay() {
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      const p = video.play();
      if (p && p.catch) p.catch(() => { /* autoplay geweigerd: gebruiker tikt opnieuw */ });
    } else {
      video.pause();
    }
  }

  function updatePlayState() {
    const playing = !video.paused && !video.ended;
    document.body.classList.toggle('is-playing', playing);
    btnPlay.setAttribute('aria-label', playing ? t('pause') : t('play'));
    bigPlay.hidden = playing;
  }
  video.addEventListener('play', updatePlayState);
  video.addEventListener('pause', updatePlayState);
  video.addEventListener('ended', updatePlayState);
  video.addEventListener('click', togglePlay);
  btnPlay.addEventListener('click', togglePlay);
  bigPlay.addEventListener('click', togglePlay);

  const seek = (time) => {
    const max = state.duration || video.duration || 0;
    video.currentTime = Math.max(0, Math.min(max ? max - 0.05 : time, time));
    onTime();
  };
  $('#btn-back').addEventListener('click', () => seek(video.currentTime - 10));
  $('#btn-fwd').addEventListener('click', () => seek(video.currentTime + 10));
  $('#btn-prev').addEventListener('click', () => {
    // Als je net bij een plek bent, ga naar de plek daarvóór
    const now = video.currentTime;
    const before = locations.filter(l => l.time < now - 2);
    const target = before.length ? before[before.length - 1] : null;
    target ? goToLocation(target) : seek(0);
  });
  $('#btn-next').addEventListener('click', () => {
    const target = locations.find(l => l.time > video.currentTime + 0.5);
    if (target) goToLocation(target);
  });

  // Geluid
  function updateMute() {
    const muted = video.muted || video.volume === 0;
    btnMute.setAttribute('aria-pressed', String(muted));
    btnMute.classList.toggle('is-muted', muted);
  }
  btnMute.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) { video.volume = 0.6; volume.value = '0.6'; }
    updateMute();
  });
  volume.addEventListener('input', () => {
    video.volume = parseFloat(volume.value);
    video.muted = video.volume === 0;
    updateMute();
  });
  video.volume = parseFloat(volume.value);

  // Schuifbalk
  let scrubbing = false;
  scrubber.addEventListener('input', () => {
    scrubbing = true;
    const dur = state.duration || video.duration || 0;
    seek((scrubber.value / 1000) * dur);
  });
  scrubber.addEventListener('change', () => { scrubbing = false; });

  function updateClock() {
    clock.textContent = fmt(video.currentTime) + ' / ' + fmt(state.duration);
  }

  /** Wordt vaak aangeroepen tijdens het afspelen. */
  function onTime() {
    const now = video.currentTime;
    const dur = state.duration || 1;
    const pct = Math.min(100, (now / dur) * 100);
    progress.style.width = pct + '%';
    if (!scrubbing) scrubber.value = String(Math.round((now / dur) * 1000));
    scrubber.setAttribute('aria-valuetext', fmt(now) + ' / ' + fmt(dur));
    updateClock();
    map.setTime(now);

    let current = null;
    for (const loc of locations) if (loc.time <= now + 0.05) current = loc;
    if ((current && current.id) !== (state.current && state.current.id)) setCurrent(current);
  }
  video.addEventListener('timeupdate', onTime);
  video.addEventListener('seeked', onTime);

  // Vloeiend bootje: tijdens afspelen elke frame bijwerken
  (function tick() {
    if (!video.paused) map.setTime(video.currentTime);
    requestAnimationFrame(tick);
  })();

  /** Naar een locatie springen (vanuit kaart, tijdlijn of knoppen). */
  function goToLocation(loc) {
    seek(loc.time + 0.05);
    setCurrent(loc);
    if (video.paused) {
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    }
    if (window.matchMedia('(max-width: 1000px)').matches) {
      $('#info-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ------------------------------------------------------------------
   *  Informatie over de huidige plek
   * ------------------------------------------------------------------ */
  function setCurrent(loc) {
    state.current = loc;
    map.setActive(loc ? loc.id : null);
    if (loc) map.markVisited(loc.id);
    highlightMarker();
    renderInfo();

    if (loc) {
      $('#video-hotspot-code').textContent = loc.code;
      $('#video-hotspot-title').textContent = tr(loc.title);
      hotspot.hidden = false;
      hotspot.classList.remove('is-new');
      void hotspot.offsetWidth; // animatie opnieuw starten
      hotspot.classList.add('is-new');
    } else {
      hotspot.hidden = true;
    }
  }

  function renderInfo() {
    const loc = state.current;
    const card = $('#info-card');
    card.classList.remove('is-updated');
    void card.offsetWidth;
    card.classList.add('is-updated');

    const codeEl = $('#info-code');
    const gallery = $('#gallery');
    gallery.textContent = '';

    if (!loc) {
      codeEl.textContent = '▶';
      $('#info-eyebrow').textContent = t('startEyebrow');
      $('#info-title').textContent = t('startTitle');
      paragraphs($('#info-body'), t('startText'));
      $('#btn-maps').hidden = true;
      return;
    }

    codeEl.textContent = loc.code;
    $('#info-eyebrow').textContent = t('aboutThisPlace');
    $('#info-title').textContent = tr(loc.title);
    paragraphs($('#info-body'), tr(loc.text));
    $('#btn-maps').hidden = false;

    if (!loc.images.length) {
      const p = document.createElement('p');
      p.className = 'gallery-empty';
      p.textContent = t('noPhotos');
      gallery.appendChild(p);
      return;
    }
    loc.images.forEach((img, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'thumb';
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', t('viewPhoto', { caption: tr(img.caption) }));
      const im = document.createElement('img');
      im.src = img.src;
      im.alt = '';
      im.loading = 'lazy';
      im.decoding = 'async';
      im.addEventListener('error', () => b.classList.add('is-broken'));
      const zoom = document.createElement('span');
      zoom.className = 'thumb-zoom';
      zoom.setAttribute('aria-hidden', 'true');
      zoom.textContent = '⤢';
      b.append(im, zoom);
      b.addEventListener('click', () => openLightbox(i));
      gallery.appendChild(b);
    });
  }

  /* ------------------------------------------------------------------
   *  Foto groot bekijken met zoom (knoppen, knijpen, scrollen, dubbeltikken)
   * ------------------------------------------------------------------ */
  const lb = { scale: 1, x: 0, y: 0 };
  const lbImg = $('#lightbox-img');
  const lbStage = $('#lightbox-stage');

  function applyLb() {
    lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
    lbStage.classList.toggle('is-zoomed', lb.scale > 1.01);
  }
  function zoomLb(factor) {
    lb.scale = Math.min(5, Math.max(1, lb.scale * factor));
    if (lb.scale === 1) { lb.x = 0; lb.y = 0; }
    applyLb();
  }

  /** Grotere versie van een archieffoto proberen; terugvallen op het origineel. */
  function largeVersion(src) {
    return /images\.memorix\.nl\/.+\/thumb\/\d+x\d+\//.test(src) ? src.replace(/\/thumb\/\d+x\d+\//, '/thumb/1600x1200/') : src;
  }

  function showLightboxImage() {
    const images = state.current ? state.current.images : [];
    const img = images[state.lightboxIndex];
    if (!img) return;
    lb.scale = 1; lb.x = 0; lb.y = 0; applyLb();
    lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = img.src; };
    lbImg.src = largeVersion(img.src);
    lbImg.alt = tr(img.caption);
    $('#lightbox-caption').textContent = tr(img.caption);
    const credit = [img.credit, img.catalog ? t('catalog') + ' ' + img.catalog : '', img.license].filter(Boolean).join(' · ');
    $('#lightbox-credit').textContent = (images.length > 1 ? t('photoOf', { n: state.lightboxIndex + 1, total: images.length }) + ' — ' : '') + credit;
    $('#lb-prev').disabled = images.length < 2;
    $('#lb-next').disabled = images.length < 2;
  }

  function openLightbox(index) {
    state.lightboxIndex = index;
    showLightboxImage();
    openDialog('lightbox');
  }
  const stepLightbox = (dir) => {
    const n = state.current ? state.current.images.length : 0;
    if (n < 2) return;
    state.lightboxIndex = (state.lightboxIndex + dir + n) % n;
    showLightboxImage();
  };
  $('#lb-prev').addEventListener('click', () => stepLightbox(-1));
  $('#lb-next').addEventListener('click', () => stepLightbox(1));
  $('#lb-zoom-in').addEventListener('click', () => zoomLb(1.5));
  $('#lb-zoom-out').addEventListener('click', () => zoomLb(1 / 1.5));

  (function lightboxGestures() {
    const pts = new Map();
    let start = null, pinch = null, lastTap = 0, swipe = null;
    lbStage.addEventListener('pointerdown', (e) => {
      lbStage.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      start = { x: e.clientX, y: e.clientY, lx: lb.x, ly: lb.y };
      swipe = { x: e.clientX, time: Date.now() };
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: lb.scale };
      }
    });
    lbStage.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        lb.scale = Math.min(5, Math.max(1, pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / (pinch.d || 1)));
        if (lb.scale === 1) { lb.x = 0; lb.y = 0; }
        applyLb();
      } else if (start && lb.scale > 1) {
        lb.x = start.lx + (e.clientX - start.x);
        lb.y = start.ly + (e.clientY - start.y);
        applyLb();
      }
    });
    const end = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (e.type === 'pointerup' && pts.size === 0) {
        const dx = e.clientX - (swipe ? swipe.x : e.clientX);
        if (lb.scale === 1 && swipe && Math.abs(dx) > 60 && Date.now() - swipe.time < 600) {
          stepLightbox(dx < 0 ? 1 : -1);
        } else if (Math.abs(dx) < 10) {
          const now = Date.now();
          if (now - lastTap < 300) { lb.scale > 1 ? (lb.scale = 1, lb.x = 0, lb.y = 0, applyLb()) : zoomLb(2.2); }
          lastTap = now;
        }
      }
    };
    lbStage.addEventListener('pointerup', end);
    lbStage.addEventListener('pointercancel', end);
    lbStage.addEventListener('wheel', (e) => { e.preventDefault(); zoomLb(e.deltaY < 0 ? 1.2 : 1 / 1.2); }, { passive: false });
  })();

  /* ------------------------------------------------------------------
   *  De plek nu (Google Maps satelliet + link naar 3D)
   * ------------------------------------------------------------------ */
  $('#btn-maps').addEventListener('click', () => {
    const loc = state.current;
    if (!loc) return;
    const lat = loc.lat.toFixed(6), lng = loc.lng.toFixed(6);
    $('#maps-title').textContent = t('nowTitle', { title: tr(loc.title) });
    const frame = $('#maps-frame');
    frame.textContent = '';
    const iframe = document.createElement('iframe');
    iframe.title = tr(loc.title) + ' — Google Maps';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.src = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=19&hl=${state.lang}&output=embed`;
    frame.appendChild(iframe);
    $('#maps-3d').href = `https://www.google.com/maps/@${lat},${lng},90a,35y,0h,65t/data=!3m1!1e3?hl=${state.lang}`;
    openDialog('maps');
  });

  /* ------------------------------------------------------------------
   *  Dialogen (welkom, colofon, foto, kaart)
   * ------------------------------------------------------------------ */
  let resumeAfterDialog = false;
  function openDialog(name) {
    const d = dialogs[name];
    if (!d || d.open) return;
    if (name === 'intro' || name === 'colofon') {
      resumeAfterDialog = !video.paused;
      video.pause();
    }
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  function closeDialog(d) {
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }
  Object.entries(dialogs).forEach(([name, d]) => {
    d.addEventListener('close', () => {
      if (name === 'maps') $('#maps-frame').textContent = '';
      if ((name === 'colofon') && resumeAfterDialog) video.play().catch(() => {});
    });
    // Tik buiten het venster sluit het (behalve het welkomstscherm)
    d.addEventListener('click', (e) => {
      if (e.target === d && name !== 'intro') closeDialog(d);
    });
  });
  dialogs.intro.addEventListener('cancel', (e) => { e.preventDefault(); startTour(); });
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => closeDialog(b.closest('dialog'))));
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => openDialog(b.dataset.open)));

  function startTour() {
    closeDialog(dialogs.intro);
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  }
  $('#intro-start').addEventListener('click', startTour);

  /* ------------------------------------------------------------------
   *  Taal
   * ------------------------------------------------------------------ */
  function setLang(lang) {
    state.lang = UI[lang] ? lang : 'nl';
    document.documentElement.lang = state.lang;
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $$('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    $$('[data-i18n-label]').forEach((n) => n.setAttribute('aria-label', t(n.dataset.i18nLabel)));
    $$('[data-i18n-content]').forEach((n) => { n.textContent = tr(DATA.texts[n.dataset.i18nContent]); });
    paragraphs($('#intro-text'), tr(DATA.texts.introText));
    document.title = tr(DATA.texts.title) + ' · Het Utrechts Archief';
    map.setLocations(locations.map(l => Object.assign({}, l, { label: l.code + ' ' + tr(l.title) })));
    renderMarkers();
    renderStopList();
    updatePlayState();
    if (state.current) {
      $('#video-hotspot-title').textContent = tr(state.current.title);
    }
    renderInfo();
    if (dialogs.lightbox.open) showLightboxImage();
  }
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  /* ------------------------------------------------------------------
   *  Hotspot in beeld
   * ------------------------------------------------------------------ */
  hotspot.addEventListener('click', () => {
    const card = $('#info-card');
    card.classList.remove('is-pointed');
    void card.offsetWidth;
    card.classList.add('is-pointed');
    if (state.current && state.current.images.length) openLightbox(0);
    else card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ------------------------------------------------------------------
   *  Toetsenbord
   * ------------------------------------------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (dialogs.lightbox.open) {
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === '+' || e.key === '=') zoomLb(1.5);
      if (e.key === '-') zoomLb(1 / 1.5);
      return;
    }
    if (document.querySelector('dialog[open]')) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === ' ' && tag !== 'button') { e.preventDefault(); togglePlay(); }
    if (e.key === 'k') togglePlay();
    if (e.key === 'm') btnMute.click();
    if (e.key === 'j' || (e.key === 'ArrowLeft' && tag !== 'button')) seek(video.currentTime - 10);
    if (e.key === 'l' || (e.key === 'ArrowRight' && tag !== 'button')) seek(video.currentTime + 10);
  });

  /* ------------------------------------------------------------------
   *  Digibord: na een tijd zonder aanraking terug naar het begin
   * ------------------------------------------------------------------ */
  const idleMs = (DATA.idleTimeout || 0) * 1000;
  ['pointerdown', 'keydown', 'wheel'].forEach((ev) =>
    document.addEventListener(ev, () => { state.lastInteraction = Date.now(); }, { passive: true, capture: true }));

  if (idleMs > 0) {
    setInterval(() => {
      const idle = Date.now() - state.lastInteraction;
      // Tijdens het afspelen kijkt er waarschijnlijk iemand: pas resetten na afloop
      if (idle < idleMs || (!video.paused && !video.ended) || dialogs.intro.open) return;
      resetApp();
    }, 5000);
  }

  function resetApp() {
    Object.values(dialogs).forEach((d) => { if (d.open) closeDialog(d); });
    video.pause();
    video.currentTime = 0;
    setCurrent(null);
    setLang('nl');
    homeMap();
    setFollow(true);
    onTime();
    openDialog('intro');
  }

  /* ------------------------------------------------------------------
   *  Start
   * ------------------------------------------------------------------ */
  setLang('nl');
  setCurrent(null);
  setDuration();
  updateMute();
  updatePlayState();
  openDialog('intro');
})();
