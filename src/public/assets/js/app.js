/**
 * Ontmoet de Oudegracht: bezoekers-app.
 * De film, een kaart die meeloopt en informatie per plek, in het Nederlands en Engels.
 *
 * Alle inhoud staat in window.OUDEGRACHT (gevuld door PHP, zie ContentService).
 */
(function () {
  'use strict';

  const DATA = window.OUDEGRACHT;
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

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
      nowTitle: 'De plek nu: {title}',
      aerial: 'Luchtfoto', mapOffline: 'Geen internet: je ziet een eenvoudige kaart.',
      mapCredit: 'Achtergrondkaart en luchtfoto van PDOK (Kadaster en Beeldmateriaal Nederland, CC BY 4.0). Loop van de gracht: © OpenStreetMap-bijdragers.'
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
      nowTitle: 'The place today: {title}',
      aerial: 'Aerial photo', mapOffline: 'No internet: showing a simple map.',
      mapCredit: 'Base map and aerial photo from PDOK (Kadaster and Beeldmateriaal Nederland, CC BY 4.0). Course of the canal: © OpenStreetMap contributors.'
    }
  };

  const state = {
    lang: 'nl',
    current: null,       // de plek waar de boot nu is (of null voor de eerste plek)
    lightboxIndex: 0,    // welke foto groot in beeld is
    duration: 0,         // lengte van de film in seconden
    lastInteraction: Date.now()
  };

  const locations = (DATA.locations || []).slice().sort((a, b) => a.time - b.time);

  /** Vaste tekst van de interface in de gekozen taal. {naam} wordt vervangen door vars.naam. */
  const uiText = (key, vars) => {
    let text = (UI[state.lang] && UI[state.lang][key]) || UI.nl[key] || key;
    for (const name in vars || {}) text = text.replace('{' + name + '}', vars[name]);
    return text;
  };

  /** Tekst uit het CMS ({ nl, en }) in de gekozen taal, met Nederlands als reserve. */
  const translated = (texts) => (texts && (texts[state.lang] || texts.nl)) || '';

  /** Tekst met lege regels omzetten naar losse alinea's (via textContent, dus veilig). */
  function paragraphs(container, text) {
    container.textContent = '';
    String(text || '').split(/\n\s*\n/).forEach((block) => {
      if (!block.trim()) return;
      const paragraph = document.createElement('p');
      paragraph.textContent = block.trim();
      container.appendChild(paragraph);
    });
  }

  /** Seconden als m:ss, bijvoorbeeld 84 wordt "1:24". */
  const formatTime = (seconds) => {
    seconds = Math.max(0, Math.floor(seconds || 0));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  };

  /** Film starten. Weigert de browser dat (autoplay), dan tikt de bezoeker zelf op afspelen. */
  function playVideo() {
    const promise = video.play();
    if (promise && promise.catch) promise.catch(() => {});
  }

  /** Een CSS-animatie opnieuw laten afspelen door de class even weg te halen. */
  function restartAnimation(element, className) {
    element.classList.remove(className);
    void element.offsetWidth; // forceert een herberekening, anders ziet de browser geen verschil
    element.classList.add(className);
  }

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
  const mapElement = $('#map');
  const followButton = $('#map-follow');
  const baseButton = $('#map-base');
  const map = new window.OudegrachtMap(mapElement, {
    data: window.OUDEGRACHT_MAP,
    minimap: $('#minimap-map'),
    minimapWrap: $('#minimap'),
    labels: { boat: uiText('boat') },
    onHotspot: (location) => { goToLocation(location); setFollow(true, location); }
  });
  map.follow = true;
  map.setRoute(DATA.route || []);
  showLocationsOnMap();
  // Voor 'Hele kaart': de hele route met alle plekken in beeld, passend in het kader
  map.autoFit((DATA.route || []).concat(locations));
  // Startweergave: ingezoomd op de boot, die gevolgd wordt
  map.reset(false);
  map.focusBoat();

  /** Plekken op de kaart zetten, met de titel in de gekozen taal (voor de tooltip). */
  function showLocationsOnMap() {
    map.setLocations(locations.map((location) =>
      Object.assign({}, location, { label: location.code + ' ' + translated(location.title) })));
  }

  mapElement.addEventListener('og-follow', (event) => setFollow(event.detail));
  mapElement.addEventListener('og-offline', (event) => { $('#map-offline').hidden = !event.detail; });

  /** Boot volgen aan of uit. Met `at` zoomt de kaart in op die plek (bijvoorbeeld een aangetikte hotspot). */
  function setFollow(on, at) {
    map.follow = on;
    followButton.setAttribute('aria-pressed', String(on));
    if (on && at) map.focusOn(at.lat, at.lng);
    else if (on) map.focusBoat();
  }
  followButton.addEventListener('click', () => setFollow(!map.follow));
  $('#map-zoom-in').addEventListener('click', () => map.zoomIn());
  $('#map-zoom-out').addEventListener('click', () => map.zoomOut());
  $('#map-reset').addEventListener('click', () => { setFollow(false); map.reset(); });

  /** Wisselen tussen de gewone kaart en de luchtfoto. */
  baseButton.addEventListener('click', () => {
    const next = map.base === 'luchtfoto' ? 'kaart' : 'luchtfoto';
    map.setBase(next);
    baseButton.setAttribute('aria-pressed', String(next === 'luchtfoto'));
  });

  /** Verborgen lijst met plekken, zodat de kaart ook met toetsenbord en schermlezer werkt. */
  function renderStopList() {
    const list = $('#stop-list');
    list.textContent = '';
    locations.forEach((location) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = uiText('goTo', { code: location.code, title: translated(location.title) }) + ' (' + formatTime(location.time) + ')';
      button.addEventListener('click', () => goToLocation(location));
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  /* ------------------------------------------------------------------
   *  Tijdlijn met hotspots
   * ------------------------------------------------------------------ */
  function renderMarkers() {
    markersEl.textContent = '';
    const duration = state.duration || 1;
    locations.forEach((location) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'marker';
      button.style.left = Math.min(100, (location.time / duration) * 100) + '%';
      button.dataset.id = location.id;
      button.textContent = location.code;
      button.setAttribute('aria-label', uiText('goTo', { code: location.code, title: translated(location.title) }));
      button.title = translated(location.title);
      button.addEventListener('click', () => goToLocation(location));
      markersEl.appendChild(button);
    });
    highlightMarker();
  }

  /** De hotspot van de huidige plek in de tijdlijn rood maken. */
  function highlightMarker() {
    $$('.marker', markersEl).forEach((marker) => {
      const active = state.current && marker.dataset.id === String(state.current.id);
      marker.classList.toggle('is-active', !!active);
      if (active) marker.setAttribute('aria-current', 'true'); else marker.removeAttribute('aria-current');
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
      playVideo();
    } else {
      video.pause();
    }
  }

  function updatePlayState() {
    const playing = !video.paused && !video.ended;
    document.body.classList.toggle('is-playing', playing);
    btnPlay.setAttribute('aria-label', playing ? uiText('pause') : uiText('play'));
    bigPlay.hidden = playing;
  }
  video.addEventListener('play', updatePlayState);
  video.addEventListener('pause', updatePlayState);
  video.addEventListener('ended', updatePlayState);
  video.addEventListener('click', togglePlay);
  btnPlay.addEventListener('click', togglePlay);
  bigPlay.addEventListener('click', togglePlay);

  /** Naar een tijd in de film springen, maar niet voorbij het einde. */
  const seek = (time) => {
    const end = state.duration || video.duration || 0;
    video.currentTime = Math.max(0, Math.min(end ? end - 0.05 : time, time));
    onTime();
  };
  $('#btn-back').addEventListener('click', () => seek(video.currentTime - 10));
  $('#btn-fwd').addEventListener('click', () => seek(video.currentTime + 10));
  $('#btn-prev').addEventListener('click', () => {
    // Ben je net bij een plek (minder dan 2 seconden), dan ga je naar de plek daarvoor
    const now = video.currentTime;
    const earlier = locations.filter((location) => location.time < now - 2);
    if (earlier.length) goToLocation(earlier[earlier.length - 1]);
    else seek(0);
  });
  $('#btn-next').addEventListener('click', () => {
    const next = locations.find((location) => location.time > video.currentTime + 0.5);
    if (next) goToLocation(next);
  });

  /* Geluid */
  function updateMute() {
    const muted = video.muted || video.volume === 0;
    btnMute.setAttribute('aria-pressed', String(muted));
    btnMute.classList.toggle('is-muted', muted);
  }
  btnMute.addEventListener('click', () => {
    video.muted = !video.muted;
    // Geluid aanzetten terwijl het volume op 0 staat: dan een hoorbaar volume kiezen
    if (!video.muted && video.volume === 0) { video.volume = 0.6; volume.value = '0.6'; }
    updateMute();
  });
  volume.addEventListener('input', () => {
    video.volume = parseFloat(volume.value);
    video.muted = video.volume === 0;
    updateMute();
  });
  video.volume = parseFloat(volume.value);

  /* Schuifbalk onder de film (waarde 0 tot 1000) */
  let scrubbing = false; // true zolang iemand de schuifbalk vasthoudt
  scrubber.addEventListener('input', () => {
    scrubbing = true;
    const duration = state.duration || video.duration || 0;
    seek((scrubber.value / 1000) * duration);
  });
  scrubber.addEventListener('change', () => { scrubbing = false; });

  function updateClock() {
    clock.textContent = formatTime(video.currentTime) + ' / ' + formatTime(state.duration);
  }

  /** Tijdlijn, klok, boot en huidige plek bijwerken. Wordt vaak aangeroepen tijdens het afspelen. */
  function onTime() {
    const now = video.currentTime;
    const duration = state.duration || 1;
    progress.style.width = Math.min(100, (now / duration) * 100) + '%';
    if (!scrubbing) scrubber.value = String(Math.round((now / duration) * 1000));
    scrubber.setAttribute('aria-valuetext', formatTime(now) + ' / ' + formatTime(duration));
    updateClock();
    map.setTime(now);

    // De huidige plek is de laatste plek waar de film al voorbij is
    let current = null;
    for (const location of locations) if (location.time <= now + 0.05) current = location;
    if ((current && current.id) !== (state.current && state.current.id)) setCurrent(current);
  }
  video.addEventListener('timeupdate', onTime);
  video.addEventListener('seeked', onTime);

  // 'timeupdate' komt maar een paar keer per seconde. Voor een vloeiend bootje elke frame bijwerken.
  (function moveBoatEveryFrame() {
    if (!video.paused) map.setTime(video.currentTime);
    requestAnimationFrame(moveBoatEveryFrame);
  })();

  /** Naar een plek springen (vanuit de kaart, de tijdlijn of de knoppen) en de film starten. */
  function goToLocation(location) {
    seek(location.time + 0.05);
    setCurrent(location);
    if (video.paused) playVideo();
    // Op kleine schermen staat de informatie onder de film: daarheen scrollen
    if (window.matchMedia('(max-width: 1000px)').matches) {
      $('#info-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ------------------------------------------------------------------
   *  Informatie over de huidige plek
   * ------------------------------------------------------------------ */
  function setCurrent(location) {
    state.current = location;
    map.setActive(location ? location.id : null);
    if (location) map.markVisited(location.id);
    highlightMarker();
    renderInfo();

    // Het label "Je vaart nu langs ..." in beeld
    if (location) {
      $('#video-hotspot-code').textContent = location.code;
      $('#video-hotspot-title').textContent = translated(location.title);
      hotspot.hidden = false;
      restartAnimation(hotspot, 'is-new');
    } else {
      hotspot.hidden = true;
    }
  }

  /** De informatiekaart vullen: tekst en foto's van de huidige plek, of een welkomsttekst. */
  function renderInfo() {
    const location = state.current;
    restartAnimation($('#info-card'), 'is-updated');

    const codeBadge = $('#info-code');
    const gallery = $('#gallery');
    gallery.textContent = '';

    if (!location) {
      codeBadge.textContent = '▶';
      $('#info-eyebrow').textContent = uiText('startEyebrow');
      $('#info-title').textContent = uiText('startTitle');
      paragraphs($('#info-body'), uiText('startText'));
      $('#btn-maps').hidden = true;
      return;
    }

    codeBadge.textContent = location.code;
    $('#info-eyebrow').textContent = uiText('aboutThisPlace');
    $('#info-title').textContent = translated(location.title);
    paragraphs($('#info-body'), translated(location.text));
    $('#btn-maps').hidden = false;

    if (!location.images.length) {
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = uiText('noPhotos');
      gallery.appendChild(empty);
      return;
    }
    location.images.forEach((image, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb';
      button.setAttribute('role', 'listitem');
      button.setAttribute('aria-label', uiText('viewPhoto', { caption: translated(image.caption) }));
      const thumbnail = document.createElement('img');
      thumbnail.src = image.src;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      thumbnail.decoding = 'async';
      thumbnail.addEventListener('error', () => button.classList.add('is-broken'));
      const zoomIcon = document.createElement('span');
      zoomIcon.className = 'thumb-zoom';
      zoomIcon.setAttribute('aria-hidden', 'true');
      zoomIcon.textContent = '⤢';
      button.append(thumbnail, zoomIcon);
      button.addEventListener('click', () => openLightbox(index));
      gallery.appendChild(button);
    });
  }

  /* ------------------------------------------------------------------
   *  Foto groot bekijken met zoom (knoppen, knijpen, scrollen, dubbeltikken)
   * ------------------------------------------------------------------ */
  const MAX_PHOTO_ZOOM = 5;
  const zoom = { scale: 1, x: 0, y: 0 }; // zoomfactor en verschuiving in pixels
  const lightboxImg = $('#lightbox-img');
  const lightboxStage = $('#lightbox-stage');

  function applyZoom() {
    lightboxImg.style.transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`;
    lightboxStage.classList.toggle('is-zoomed', zoom.scale > 1.01);
  }

  /** Zoomfactor instellen (tussen 1 en MAX_PHOTO_ZOOM). Helemaal uitgezoomd staat de foto weer in het midden. */
  function setZoom(scale) {
    zoom.scale = Math.min(MAX_PHOTO_ZOOM, Math.max(1, scale));
    if (zoom.scale === 1) { zoom.x = 0; zoom.y = 0; }
    applyZoom();
  }
  const zoomBy = (factor) => setZoom(zoom.scale * factor);
  const resetZoom = () => setZoom(1);

  /** Foto's uit de beeldbank (Memorix) bestaan ook in groot formaat; die gebruiken we in de fotoviewer. */
  function largeVersion(src) {
    return /images\.memorix\.nl\/.+\/thumb\/\d+x\d+\//.test(src) ? src.replace(/\/thumb\/\d+x\d+\//, '/thumb/1600x1200/') : src;
  }

  function showLightboxImage() {
    const images = state.current ? state.current.images : [];
    const image = images[state.lightboxIndex];
    if (!image) return;
    resetZoom();
    // Lukt de grote versie niet, dan alsnog de gewone foto tonen
    lightboxImg.onerror = () => { lightboxImg.onerror = null; lightboxImg.src = image.src; };
    lightboxImg.src = largeVersion(image.src);
    lightboxImg.alt = translated(image.caption);
    $('#lightbox-caption').textContent = translated(image.caption);
    const credit = [image.credit, image.catalog ? uiText('catalog') + ' ' + image.catalog : '', image.license].filter(Boolean).join(' · ');
    const counter = images.length > 1 ? uiText('photoOf', { n: state.lightboxIndex + 1, total: images.length }) + ' — ' : '';
    $('#lightbox-credit').textContent = counter + credit;
    $('#lb-prev').disabled = images.length < 2;
    $('#lb-next').disabled = images.length < 2;
  }

  function openLightbox(index) {
    state.lightboxIndex = index;
    showLightboxImage();
    openDialog('lightbox');
  }

  /** Naar de vorige (-1) of volgende (+1) foto; na de laatste komt weer de eerste. */
  const stepLightbox = (direction) => {
    const count = state.current ? state.current.images.length : 0;
    if (count < 2) return;
    state.lightboxIndex = (state.lightboxIndex + direction + count) % count;
    showLightboxImage();
  };
  $('#lb-prev').addEventListener('click', () => stepLightbox(-1));
  $('#lb-next').addEventListener('click', () => stepLightbox(1));
  $('#lb-zoom-in').addEventListener('click', () => zoomBy(1.5));
  $('#lb-zoom-out').addEventListener('click', () => zoomBy(1 / 1.5));

  /**
   * Aanraken in de fotoviewer:
   * - twee vingers knijpen = zoomen
   * - slepen (als ingezoomd) = verschuiven
   * - snel vegen (niet ingezoomd) = vorige of volgende foto
   * - dubbeltikken = in- of uitzoomen
   */
  (function lightboxGestures() {
    const pointers = new Map(); // vingers of muis die nu het scherm raken
    let dragStart = null, pinchStart = null, swipeStart = null, lastTap = 0;
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    lightboxStage.addEventListener('pointerdown', (event) => {
      lightboxStage.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragStart = { x: event.clientX, y: event.clientY, zoomX: zoom.x, zoomY: zoom.y };
      swipeStart = { x: event.clientX, time: Date.now() };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { distance: distance(a, b), scale: zoom.scale };
      }
    });

    lightboxStage.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()];
        setZoom(pinchStart.scale * distance(a, b) / (pinchStart.distance || 1));
      } else if (dragStart && zoom.scale > 1) {
        zoom.x = dragStart.zoomX + (event.clientX - dragStart.x);
        zoom.y = dragStart.zoomY + (event.clientY - dragStart.y);
        applyZoom();
      }
    });

    const onPointerEnd = (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (event.type !== 'pointerup' || pointers.size > 0) return;

      const dx = event.clientX - (swipeStart ? swipeStart.x : event.clientX);
      const isSwipe = zoom.scale === 1 && swipeStart && Math.abs(dx) > 60 && Date.now() - swipeStart.time < 600;
      if (isSwipe) {
        stepLightbox(dx < 0 ? 1 : -1);
      } else if (Math.abs(dx) < 10) {
        const now = Date.now();
        if (now - lastTap < 300) {
          if (zoom.scale > 1) resetZoom(); else zoomBy(2.2);
        }
        lastTap = now;
      }
    };
    lightboxStage.addEventListener('pointerup', onPointerEnd);
    lightboxStage.addEventListener('pointercancel', onPointerEnd);
    lightboxStage.addEventListener('wheel', (event) => {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 1.2 : 1 / 1.2);
    }, { passive: false });
  })();

  /* ------------------------------------------------------------------
   *  De plek nu (satellietbeeld van Google Maps en een link naar 3D)
   * ------------------------------------------------------------------ */
  $('#btn-maps').addEventListener('click', () => {
    const location = state.current;
    if (!location) return;
    const lat = location.lat.toFixed(6), lng = location.lng.toFixed(6);
    $('#maps-title').textContent = uiText('nowTitle', { title: translated(location.title) });
    const frame = $('#maps-frame');
    frame.textContent = '';
    const iframe = document.createElement('iframe');
    iframe.title = translated(location.title) + ' — Google Maps';
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
  // De film pauzeert bij het welkomstscherm en het colofon, en gaat na het colofon verder
  let resumeAfterDialog = false;
  function openDialog(name) {
    const dialog = dialogs[name];
    if (!dialog || dialog.open) return;
    if (name === 'intro' || name === 'colofon') {
      resumeAfterDialog = !video.paused;
      video.pause();
    }
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }
  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  }
  Object.entries(dialogs).forEach(([name, dialog]) => {
    dialog.addEventListener('close', () => {
      if (name === 'maps') $('#maps-frame').textContent = ''; // Google Maps stoppen
      if (name === 'colofon' && resumeAfterDialog) playVideo();
    });
    // Tik buiten het venster sluit het (behalve het welkomstscherm)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && name !== 'intro') closeDialog(dialog);
    });
  });
  // Escape op het welkomstscherm start de tour, in plaats van het scherm leeg te sluiten
  dialogs.intro.addEventListener('cancel', (event) => { event.preventDefault(); startTour(); });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
  $$('[data-open]').forEach((button) => button.addEventListener('click', () => openDialog(button.dataset.open)));

  function startTour() {
    closeDialog(dialogs.intro);
    playVideo();
  }
  $('#intro-start').addEventListener('click', startTour);

  /* ------------------------------------------------------------------
   *  Taal
   * ------------------------------------------------------------------ */
  /** Alle teksten op de pagina omzetten naar 'nl' of 'en'. */
  function setLang(lang) {
    state.lang = UI[lang] ? lang : 'nl';
    document.documentElement.lang = state.lang;
    $$('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === state.lang)));
    // data-i18n: vaste tekst, data-i18n-label: aria-label, data-i18n-content: tekst uit het CMS
    $$('[data-i18n]').forEach((element) => { element.textContent = uiText(element.dataset.i18n); });
    $$('[data-i18n-label]').forEach((element) => element.setAttribute('aria-label', uiText(element.dataset.i18nLabel)));
    $$('[data-i18n-content]').forEach((element) => { element.textContent = translated(DATA.texts[element.dataset.i18nContent]); });
    paragraphs($('#intro-text'), translated(DATA.texts.introText));
    document.title = translated(DATA.texts.title) + ' · Het Utrechts Archief';
    showLocationsOnMap();
    renderMarkers();
    renderStopList();
    updatePlayState();
    if (state.current) {
      $('#video-hotspot-title').textContent = translated(state.current.title);
    }
    renderInfo();
    if (dialogs.lightbox.open) showLightboxImage();
  }
  $$('[data-lang]').forEach((button) => button.addEventListener('click', () => setLang(button.dataset.lang)));

  /* ------------------------------------------------------------------
   *  Label "Je vaart nu langs ..." in beeld: tik toont de foto's of de informatie
   * ------------------------------------------------------------------ */
  hotspot.addEventListener('click', () => {
    const card = $('#info-card');
    restartAnimation(card, 'is-pointed');
    if (state.current && state.current.images.length) openLightbox(0);
    else card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ------------------------------------------------------------------
   *  Toetsenbord (sneltoetsen zoals op YouTube: k, j, l, m)
   * ------------------------------------------------------------------ */
  document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (dialogs.lightbox.open) {
      if (key === 'ArrowRight') stepLightbox(1);
      if (key === 'ArrowLeft') stepLightbox(-1);
      if (key === '+' || key === '=') zoomBy(1.5);
      if (key === '-') zoomBy(1 / 1.5);
      return;
    }
    if (document.querySelector('dialog[open]')) return;
    const tag = (event.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    // Op een knop doen spatie en de pijltjes hun gewone werk
    const onButton = tag === 'button';
    if (key === ' ' && !onButton) { event.preventDefault(); togglePlay(); }
    if (key === 'k') togglePlay();
    if (key === 'm') btnMute.click();
    if (key === 'j' || (key === 'ArrowLeft' && !onButton)) seek(video.currentTime - 10);
    if (key === 'l' || (key === 'ArrowRight' && !onButton)) seek(video.currentTime + 10);
  });

  /* ------------------------------------------------------------------
   *  Digibord: na een tijd zonder aanraking terug naar het begin
   * ------------------------------------------------------------------ */
  const idleLimitMs = (DATA.idleTimeout || 0) * 1000; // 0 = uit
  ['pointerdown', 'keydown', 'wheel'].forEach((eventName) =>
    document.addEventListener(eventName, () => { state.lastInteraction = Date.now(); }, { passive: true, capture: true }));

  if (idleLimitMs > 0) {
    setInterval(() => {
      const idleFor = Date.now() - state.lastInteraction;
      // Tijdens het afspelen kijkt er waarschijnlijk iemand: pas resetten na afloop
      if (idleFor < idleLimitMs || (!video.paused && !video.ended) || dialogs.intro.open) return;
      resetApp();
    }, 5000);
  }

  /**
   * Terug naar het begin. De pagina wordt opnieuw geladen, zodat wijzigingen
   * uit het CMS meteen op het digibord staan.
   */
  function resetApp() {
    video.pause();
    window.location.reload();
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
