/**
 * OudegrachtMap: echte, interactieve kaart van de Oudegracht (Leaflet en PDOK).
 *
 * Wordt gebruikt in de bezoekers-app (boot volgen, hotspots, zoom, minimap,
 * kaart of luchtfoto) en in het CMS (plek kiezen door op de kaart te tikken).
 *
 * Ondergrond: de BRT Achtergrondkaart en de actuele luchtfoto van PDOK
 * (de kaartdienst van de Nederlandse overheid). Is er geen internet, dan
 * tekent de component zelf een eenvoudige noodkaart uit window.OUDEGRACHT_MAP,
 * zodat de route, de boot en de plekken altijd zichtbaar blijven.
 *
 * Begrip: 's' is in deze code steeds de afstand in meters langs de gracht,
 * gemeten vanaf het begin van de lijn in map-data.js.
 */
(function () {
  'use strict';

  const L = window.L;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // Aantal meters per graad. Voor zo'n klein gebied is deze benadering nauwkeurig genoeg.
  const METERS_PER_DEGREE_LAT = 110574;
  const METERS_PER_DEGREE_LNG = 111320;

  // Bronvermelding zonder links: op het digibord mag een tik de app niet verlaten.
  const BASES = {
    kaart: {
      url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png',
      attribution: 'Kaart: PDOK / Kadaster (CC BY 4.0)',
      maxNativeZoom: 19
    },
    luchtfoto: {
      url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg',
      attribution: 'Luchtfoto: PDOK / Beeldmateriaal Nederland (CC BY 4.0)',
      maxNativeZoom: 20
    }
  };

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Een HTML-element maken, met een class en (veilige) tekst. */
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  /** Kaartlaag met tegels van PDOK ('kaart' of 'luchtfoto'). */
  function tileLayer(name) {
    const base = BASES[name];
    return L.tileLayer(base.url, {
      attribution: base.attribution,
      maxNativeZoom: base.maxNativeZoom, // daarboven worden de tegels vergroot
      maxZoom: 21,
      crossOrigin: true,
      keepBuffer: 4
    });
  }

  class OudegrachtMap {
    /**
     * @param {HTMLElement} container  element waarin de kaart komt
     * @param {object} options
     *   data        kaartgegevens (window.OUDEGRACHT_MAP): grenzen, gracht en noodkaart
     *   minimap     element voor de minimap (optioneel)
     *   minimapWrap element dat getoond of verborgen wordt (optioneel)
     *   onHotspot   functie(location) bij tikken op een hotspot
     *   onPick      functie(lat, lng) bij tikken op de kaart (CMS)
     *   maxZoom     maximale zoom (standaard 20)
     *   base        'kaart' of 'luchtfoto'
     *   labels      { boat: 'Boot' }
     */
    constructor(container, options) {
      if (!L) throw new Error('Leaflet is niet geladen');
      this.container = container;
      this.options = Object.assign({ maxZoom: 20, base: 'kaart', labels: {} }, options);
      this.data = this.options.data;
      this.pinNodes = new Map();     // id van een plek -> Leaflet-marker
      this.visited = new Set();      // ids van plekken waar de boot al is geweest
      this.activeId = null;
      this.follow = false;           // houdt de kaart de boot in beeld?
      this.boatLatLng = null;
      this.zooming = false;          // tijdens een zoomanimatie niet verschuiven

      const bounds = this.data.bounds;
      // Een graad lengte is hier korter dan aan de evenaar: factor cos(breedtegraad)
      this.cosLat = Math.cos(((bounds.minLat + bounds.maxLat) / 2) * Math.PI / 180);
      this.focus = L.latLngBounds([bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]); // gebied voor 'Hele kaart'
      this.homeZoom = 16;            // zoom van 'Hele kaart', wordt berekend in autoFit()

      this.map = L.map(container, {
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.25,
        zoomDelta: 1,
        wheelPxPerZoomLevel: 90,
        minZoom: 14,
        maxZoom: this.options.maxZoom,
        maxBounds: this.focus.pad(2),    // niet ver weg kunnen schuiven van de gracht
        maxBoundsViscosity: 0.9,
        bounceAtZoomLimits: false,
        zoomAnimation: !reducedMotion,
        fadeAnimation: !reducedMotion,
        markerZoomAnimation: !reducedMotion,
        tapHold: false
      });
      this.map.attributionControl.setPrefix(false);
      this.map.createPane('boat').style.zIndex = 650; // boot boven de plekken (600)
      this.map.fitBounds(this.focus, { animate: false });

      this.fallback = this.buildFallback();
      this.routeLayer = L.layerGroup().addTo(this.map);
      this.pinLayer = L.layerGroup().addTo(this.map);
      this.setBase(this.options.base);

      this.prepareCanal();
      if (this.options.minimap) this.buildMinimap();
      this.bindEvents();
    }

    /* ---------- ondergrond ---------- */

    /**
     * Kiest de ondergrond ('kaart' of 'luchtfoto') en geeft de gekozen naam terug.
     * Laden er geen tegels (3 fouten en nog geen enkele gelukt), dan verschijnt de noodkaart.
     */
    setBase(name) {
      if (!BASES[name]) name = 'kaart';
      if (this.tiles) this.map.removeLayer(this.tiles);
      this.base = name;
      this.tiles = tileLayer(name).addTo(this.map);
      this.tiles.bringToBack();
      this.tilesOk = false;
      this.tileErrors = 0;
      this.tiles.on('tileload', () => {
        if (this.tilesOk) return;
        this.tilesOk = true;
        this.setOffline(false);
      });
      this.tiles.on('tileerror', () => {
        this.tileErrors++;
        if (!this.tilesOk && this.tileErrors >= 3) this.setOffline(true);
      });
      this.container.classList.toggle('is-aerial', name === 'luchtfoto');
      return name;
    }

    setOffline(offline) {
      if (offline === this.offline) return;
      this.offline = offline;
      if (offline) this.fallback.addTo(this.map); else this.fallback.remove();
      this.container.classList.toggle('is-offline', offline);
      this.emit('og-offline', offline);
    }

    /** Eenvoudige noodkaart uit de eigen kaartgegevens (gracht, straten, namen). */
    buildFallback() {
      const data = this.data;
      // map-data.js gebruikt [lengtegraad, breedtegraad], Leaflet wil [breedtegraad, lengtegraad]
      const toLatLngs = (line) => line.map((coord) => [coord[1], coord[0]]);
      const layer = L.layerGroup();
      const lineStyle = (className, weight) => ({ className, weight, interactive: false, lineCap: 'round', lineJoin: 'round' });

      for (const square of data.squares || []) L.polygon(toLatLngs(square.poly), lineStyle('og-fb-square', 1)).addTo(layer);
      // Straten: eerst een bredere rand, daarover de straat zelf
      for (const street of data.streets || []) L.polyline(toLatLngs(street.line), lineStyle('og-fb-street-casing', 14)).addTo(layer);
      for (const street of data.streets || []) L.polyline(toLatLngs(street.line), lineStyle('og-fb-street', 10)).addTo(layer);
      L.polyline(toLatLngs(data.canal), lineStyle('og-fb-canal-edge', 26)).addTo(layer);
      L.polyline(toLatLngs(data.canal), lineStyle('og-fb-canal', 20)).addTo(layer);

      const addLabel = (at, text, className) => L.marker([at[1], at[0]], {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'og-fb-label ' + className, html: node('span', '', text), iconSize: null })
      }).addTo(layer);
      for (const landmark of data.landmarks || []) addLabel(landmark.at, landmark.name, 'is-landmark');
      for (const bridge of data.bridges || []) addLabel(bridge.at, bridge.name, 'is-bridge');
      return layer;
    }

    /* ---------- lokale projectie in meters, voor afstanden langs de gracht ---------- */

    /** Lengte- en breedtegraad naar meters (x naar het oosten, y naar het zuiden). */
    project(lng, lat) {
      const bounds = this.data.bounds;
      return {
        x: (lng - bounds.minLng) * this.cosLat * METERS_PER_DEGREE_LNG,
        y: (bounds.maxLat - lat) * METERS_PER_DEGREE_LAT
      };
    }

    /** Meters terug naar een Leaflet-coordinaat (omgekeerde van project). */
    unproject(x, y) {
      const bounds = this.data.bounds;
      return L.latLng(bounds.maxLat - y / METERS_PER_DEGREE_LAT, bounds.minLng + x / (this.cosLat * METERS_PER_DEGREE_LNG));
    }

    /** Punten van de gracht in meters, en per punt de afstand vanaf het begin. */
    prepareCanal() {
      this.canalPoints = this.data.canal.map((coord) => this.project(coord[0], coord[1]));
      this.canalDistances = [0];
      for (let i = 1; i < this.canalPoints.length; i++) {
        const a = this.canalPoints[i - 1], b = this.canalPoints[i];
        this.canalDistances.push(this.canalDistances[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
      }
    }

    /** Afstand langs de gracht (s) van het punt op de gracht dat het dichtst bij (x, y) ligt. */
    distanceAlongCanal(x, y) {
      let closest = Infinity, closestS = 0;
      // Per stukje gracht (van a naar b) het dichtstbijzijnde punt zoeken
      for (let i = 0; i < this.canalPoints.length - 1; i++) {
        const a = this.canalPoints[i], b = this.canalPoints[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, lengthSquared = dx * dx + dy * dy || 1;
        // t = 0 bij a, t = 1 bij b
        const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / lengthSquared, 0, 1);
        const distance = Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
        if (distance < closest) {
          closest = distance;
          closestS = this.canalDistances[i] + t * Math.sqrt(lengthSquared);
        }
      }
      return closestS;
    }

    /** Punt en richting (graden, 0 = oost, met de klok mee) op afstand s langs de gracht. */
    pointAt(s) {
      const distances = this.canalDistances;
      s = clamp(s, 0, distances[distances.length - 1]);
      // Het stukje gracht zoeken waar s in valt
      let i = 1;
      while (i < distances.length - 1 && distances[i] < s) i++;
      const a = this.canalPoints[i - 1], b = this.canalPoints[i];
      const t = (s - distances[i - 1]) / ((distances[i] - distances[i - 1]) || 1);
      const x = a.x + t * (b.x - a.x), y = a.y + t * (b.y - a.y);
      return { x, y, latlng: this.unproject(x, y), angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }

    /* ---------- route en boot ---------- */

    /**
     * Tekent de route van de boot en zet de boot op de kaart.
     * Elk routepunt wordt naar de gracht 'getrokken', zodat de boot altijd op het water vaart.
     * @param {Array<{t:number,lat:number,lng:number}>} route  t = seconden in de film
     * @param {{boat?: boolean}} [options]  boat: false voor een route zonder boot (CMS)
     */
    setRoute(route, options) {
      const showBoat = !options || options.boat !== false;
      this.route = (route || []).slice().sort((a, b) => a.t - b.t).map((point) => {
        const meters = this.project(point.lng, point.lat);
        return { t: point.t, s: this.distanceAlongCanal(meters.x, meters.y) };
      });
      this.routeLayer.clearLayers();
      this.lastS = null;
      if (this.boat) { this.boat.remove(); this.boat = null; }
      if (this.route.length < 2) return;

      // De boot kan de lijn van de gracht ook achterstevoren volgen (direction -1)
      const sFrom = this.route[0].s, sTo = this.route[this.route.length - 1].s;
      const direction = sTo >= sFrom ? 1 : -1;
      this.routeFrom = sFrom;
      this.routeTo = sTo;
      // Elke 4 meter een punt, zodat de lijn de bochten van de gracht volgt
      this.routePath = [];
      for (let s = sFrom; direction * (sTo - s) > 0; s += direction * 4) this.routePath.push({ s, latlng: this.pointAt(s).latlng });
      this.routePath.push({ s: sTo, latlng: this.pointAt(sTo).latlng });

      const latlngs = this.routePath.map((point) => point.latlng);
      L.polyline(latlngs, { className: 'og-route-casing', weight: 11, interactive: false, lineCap: 'round' }).addTo(this.routeLayer);
      L.polyline(latlngs, { className: 'og-route-line', weight: 4, interactive: false, lineCap: 'round' }).addTo(this.routeLayer);
      this.sailed = L.polyline([], { className: 'og-route-sailed', weight: 7, interactive: false, lineCap: 'round' }).addTo(this.routeLayer);
      this.forward = direction > 0 ? 0 : 180; // bootje omdraaien als de route achterstevoren loopt

      if (showBoat) {
        const icon = node('div', 'og-boat');
        icon.innerHTML =
          '<span class="og-boat-halo"></span>' +
          '<svg class="og-boat-shape" viewBox="-24 -24 48 48" aria-hidden="true">' +
          '<path class="og-boat-hull" d="M-18 -8 L10 -8 L20 0 L10 8 L-18 8 Z"/>' +
          '<rect class="og-boat-cabin" x="-12" y="-4" width="14" height="8" rx="1.5"/></svg>';
        this.boat = L.marker(this.routePath[0].latlng, {
          pane: 'boat', interactive: false, keyboard: false,
          title: this.options.labels.boat || 'Boot',
          icon: L.divIcon({ className: 'og-boat-icon', html: icon, iconSize: [56, 56], iconAnchor: [28, 28] })
        }).addTo(this.map);
        this.boatShape = icon.querySelector('.og-boat-shape');
      }
      this.setTime(0);
    }

    /** Zet het bootje op de juiste plek voor tijd t (seconden in de film). */
    setTime(t) {
      if (!this.route || this.route.length < 2) return;
      const route = this.route;
      let s;
      if (t <= route[0].t) s = route[0].s;
      else if (t >= route[route.length - 1].t) s = route[route.length - 1].s;
      else {
        // Tussen twee routepunten: de afstand evenredig verdelen over de tijd
        let i = 1;
        while (route[i].t < t) i++;
        const a = route[i - 1], b = route[i];
        s = a.s + (b.s - a.s) * ((t - a.t) / ((b.t - a.t) || 1));
      }
      if (s === this.lastS) return; // niets veranderd (bijvoorbeeld bij pauze)
      this.lastS = s;

      const position = this.pointAt(s);
      this.boatLatLng = position.latlng;
      if (this.boat) {
        this.boat.setLatLng(position.latlng);
        this.boatShape.style.transform = `rotate(${(position.angle + this.forward).toFixed(1)}deg)`;
      }
      if (this.minimapBoat) this.minimapBoat.setLatLng(position.latlng);

      // Het gevaren stuk: alle routepunten tot hier, plus de boot zelf
      const direction = this.routeTo >= this.routeFrom ? 1 : -1;
      const sailed = [];
      for (const point of this.routePath) {
        if (direction * (s - point.s) < 0) break;
        sailed.push(point.latlng);
      }
      sailed.push(position.latlng);
      this.sailed.setLatLngs(sailed);

      if (this.follow && !this.zooming && this.isZoomedIn()) this.map.panTo(position.latlng, { animate: false });
    }

    /* ---------- hotspots ---------- */

    /**
     * @param {Array} locations  {id, code, lat, lng, label}
     * @param {{muted?: boolean}} [options]  muted: alle punten grijs (CMS)
     */
    setLocations(locations, options) {
      const muted = options && options.muted;
      const clickable = !!this.options.onHotspot;
      this.pinLayer.clearLayers();
      this.pinNodes = new Map();
      for (const location of locations || []) {
        if (location.lat == null || location.lng == null) continue;
        const grey = muted || this.visited.has(location.id);
        const marker = L.marker([location.lat, location.lng], {
          keyboard: false,               // met het toetsenbord gebruik je de lijst met plekken
          interactive: clickable,
          title: location.label || location.code,
          riseOnHover: false,
          // 56 px groot: een goed aanraakdoel op het digibord
          icon: L.divIcon({
            className: 'og-pin' + (grey ? ' is-visited' : ''),
            html: node('span', 'og-pin-dot', location.code),
            iconSize: [56, 56], iconAnchor: [28, 28]
          })
        });
        if (clickable) marker.on('click', () => this.options.onHotspot(location));
        marker.addTo(this.pinLayer);
        this.pinNodes.set(location.id, marker);
      }
      this.setActive(this.activeId);
    }

    /** De plek met dit id rood en bovenop tekenen. */
    setActive(id) {
      this.activeId = id;
      this.pinNodes.forEach((marker, pinId) => {
        const active = pinId === id;
        const element = marker.getElement();
        if (element) element.classList.toggle('is-active', active);
        marker.setZIndexOffset(active ? 1000 : 0);
      });
    }

    /** Een plek waar de boot is geweest, krijgt een andere kleur (ook na het wisselen van taal). */
    markVisited(id) {
      this.visited.add(id);
      const marker = this.pinNodes.get(id);
      const element = marker && marker.getElement();
      if (element) element.classList.add('is-visited');
    }

    /* ---------- CMS: gekozen plek en losse routepunten ---------- */

    /** Rode stip op de gekozen plek; zonder geldige coordinaten verdwijnt de stip. */
    setMarker(lat, lng) {
      if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
        if (this.marker) { this.marker.remove(); this.marker = null; }
        return;
      }
      if (!this.marker) {
        this.marker = L.marker([lat, lng], {
          pane: 'boat', interactive: false, keyboard: false,
          icon: L.divIcon({ className: 'og-marker', html: '<span class="og-marker-halo"></span><span class="og-marker-dot"></span>', iconSize: [60, 60], iconAnchor: [30, 30] })
        }).addTo(this.map);
      } else {
        this.marker.setLatLng([lat, lng]);
      }
    }

    /** Genummerde routepunten tonen (CMS-routepagina). Klikken gaat door naar de kaart. */
    setPoints(points) {
      this.routeLayer.clearLayers();
      if (points.length > 1) {
        L.polyline(points.map((point) => [point.lat, point.lng]), { className: 'og-route-line', weight: 4, interactive: false }).addTo(this.routeLayer);
      }
      points.forEach((point, index) => {
        L.marker([point.lat, point.lng], {
          interactive: false, keyboard: false,
          icon: L.divIcon({
            className: 'og-pin og-pin-small' + (point.active ? ' is-active' : ''),
            html: node('span', 'og-pin-dot', String(index + 1)), iconSize: [34, 34], iconAnchor: [17, 17]
          })
        }).addTo(this.routeLayer);
      });
    }

    /* ---------- zoomen en schuiven ---------- */

    /** Is de kaart verder ingezoomd dan 'Hele kaart'? */
    isZoomedIn() { return this.map.getZoom() > this.homeZoom + 0.2; }

    /** 'Hele kaart': het hele focusgebied in beeld. */
    reset(animate) {
      this.map.fitBounds(this.focus, { padding: [24, 24], animate: animate !== false && !reducedMotion });
    }

    /** Ingezoomd op de boot. */
    focusBoat() {
      if (this.boatLatLng) this.focusOn(this.boatLatLng.lat, this.boatLatLng.lng);
    }

    /** Ingezoomd op een punt; is de kaart al ingezoomd, dan blijft de zoom gelijk. */
    focusOn(lat, lng) {
      const zoom = this.isZoomedIn() ? this.map.getZoom() : this.homeZoom + 1.25;
      this.map.setView([lat, lng], zoom, { animate: !reducedMotion });
    }

    /** Inzoomen; als de boot gevolgd wordt, rond de boot. */
    zoomIn() {
      if (this.follow && this.boatLatLng) this.map.setView(this.boatLatLng, this.map.getZoom() + 1, { animate: !reducedMotion });
      else this.map.zoomIn();
    }

    zoomOut() { this.map.zoomOut(); }

    /**
     * Houdt de kaart passend in het kader en bewaart het gebied voor 'Hele kaart'.
     * @param {Array<{lat:number,lng:number}>} [focusPoints]
     */
    autoFit(focusPoints) {
      const points = (focusPoints || []).filter((point) => point && !isNaN(point.lat) && !isNaN(point.lng));
      if (points.length) this.focus = L.latLngBounds(points.map((point) => [point.lat, point.lng])).pad(0.12);
      const refit = () => {
        const wasHome = !this.isZoomedIn();
        this.map.invalidateSize({ animate: false });
        this.homeZoom = this.map.getBoundsZoom(this.focus, false, L.point(48, 48));
        if (wasHome) this.reset(false);
        this.updateMinimap();
      };
      refit();
      if ('ResizeObserver' in window) {
        // Hooguit een keer per frame opnieuw passen, ook als het formaat vaak verandert
        let frame = 0;
        new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(refit); }).observe(this.container);
      } else {
        window.addEventListener('resize', refit);
      }
    }

    bindEvents() {
      const map = this.map;
      // Zelf de kaart verschuiven zet 'Volg de boot' uit
      map.on('dragstart', () => {
        if (!this.follow) return;
        this.follow = false;
        this.emit('og-follow', false);
      });
      map.on('zoomstart', () => { this.zooming = true; });
      map.on('zoomend', () => { this.zooming = false; });
      map.on('moveend zoomend', () => this.updateMinimap());
      if (this.options.onPick) {
        // Coordinaten afgerond op 6 decimalen (ongeveer 10 cm), zoals in de database
        map.on('click', (event) => this.options.onPick(+event.latlng.lat.toFixed(6), +event.latlng.lng.toFixed(6)));
      }
    }

    /** Een gebeurtenis doorgeven aan de pagina (bijvoorbeeld 'og-follow' of 'og-offline'). */
    emit(name, detail) {
      this.container.dispatchEvent(new CustomEvent(name, { detail }));
    }

    /* ---------- minimap ---------- */

    /** Kleine overzichtskaart met een rood kader om het stuk dat je bekijkt. Tik erop om daarheen te gaan. */
    buildMinimap() {
      this.minimapMap = L.map(this.options.minimap, {
        zoomControl: false, attributionControl: false, dragging: false, touchZoom: false,
        scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false,
        zoomSnap: 0.25, fadeAnimation: false, zoomAnimation: false, inertia: false
      });
      this.minimapMap.setView(this.focus.getCenter(), 15); // Leaflet heeft een beginpositie nodig
      tileLayer('kaart').addTo(this.minimapMap);
      L.polyline(this.data.canal.map((coord) => [coord[1], coord[0]]), { className: 'og-mm-canal', weight: 5, interactive: false }).addTo(this.minimapMap);
      this.minimapFrame = L.rectangle(this.map.getBounds(), { className: 'og-minimap-frame', weight: 3, interactive: false }).addTo(this.minimapMap);
      this.minimapBoat = L.circleMarker(this.focus.getCenter(), { className: 'og-mm-boat', radius: 5, interactive: false }).addTo(this.minimapMap);
      this.minimapMap.on('click', (event) => {
        this.follow = false;
        this.emit('og-follow', false);
        this.map.panTo(event.latlng, { animate: !reducedMotion });
      });
    }

    /** Minimap alleen tonen als je bent ingezoomd, en het rode kader bijwerken. */
    updateMinimap() {
      if (!this.minimapMap) return;
      const show = this.isZoomedIn();
      const wrap = this.options.minimapWrap;
      if (wrap && wrap.hidden === show) {
        wrap.hidden = !show;
        if (show) {
          this.minimapMap.invalidateSize({ animate: false });
          this.minimapMap.fitBounds(this.focus, { animate: false });
        }
      }
      if (show) this.minimapFrame.setBounds(this.map.getBounds());
    }
  }

  window.OudegrachtMap = OudegrachtMap;
})();
