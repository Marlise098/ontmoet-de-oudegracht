/**
 * OudegrachtMap — echte, interactieve kaart van de Oudegracht (Leaflet + PDOK).
 *
 * Wordt gebruikt in de bezoekers-app (boot volgen, hotspots, zoom, minimap,
 * kaart/luchtfoto) én in het CMS (plek kiezen door op de kaart te tikken).
 *
 * Ondergrond: de BRT Achtergrondkaart en de actuele luchtfoto van PDOK
 * (de kaartdienst van de Nederlandse overheid). Is er geen internet, dan
 * tekent de component zelf een eenvoudige noodkaart uit window.OUDEGRACHT_MAP,
 * zodat de route, de boot en de plekken altijd zichtbaar blijven.
 */
(function () {
  'use strict';

  const L = window.L;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const M_PER_DEG_LAT = 110574;
  const M_PER_DEG_LNG = 111320;

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

  function node(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function tileLayer(name) {
    const b = BASES[name];
    return L.tileLayer(b.url, {
      attribution: b.attribution,
      maxNativeZoom: b.maxNativeZoom,
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
     *   minimapWrap element dat getoond/verborgen wordt (optioneel)
     *   onHotspot   functie(location) bij tikken op een hotspot
     *   onPick      functie(lat, lng) bij tikken op de kaart (CMS)
     *   maxZoom     maximale zoom (standaard 20)
     *   base        'kaart' of 'luchtfoto'
     *   labels      { boat: 'Boot' }
     */
    constructor(container, options) {
      if (!L) throw new Error('Leaflet is niet geladen');
      this.el = container;
      this.opt = Object.assign({ maxZoom: 20, base: 'kaart', labels: {} }, options);
      this.data = this.opt.data;
      this.locations = [];
      this.pinNodes = new Map();
      this.visited = new Set();
      this.activeId = null;
      this.follow = false;
      this.boatLatLng = null;
      this.zooming = false;

      const b = this.data.bounds;
      this.cos = Math.cos(((b.minLat + b.maxLat) / 2) * Math.PI / 180);
      this.focus = L.latLngBounds([b.minLat, b.minLng], [b.maxLat, b.maxLng]);
      this.homeZoom = 16;

      this.map = L.map(container, {
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.25,
        zoomDelta: 1,
        wheelPxPerZoomLevel: 90,
        minZoom: 14,
        maxZoom: this.opt.maxZoom,
        maxBounds: this.focus.pad(2),
        maxBoundsViscosity: 0.9,
        bounceAtZoomLimits: false,
        zoomAnimation: !reducedMotion,
        fadeAnimation: !reducedMotion,
        markerZoomAnimation: !reducedMotion,
        tapHold: false
      });
      this.map.attributionControl.setPrefix(false);
      this.map.createPane('boat').style.zIndex = 650;
      this.map.fitBounds(this.focus, { animate: false });

      this.fallback = this.buildFallback();
      this.routeLayer = L.layerGroup().addTo(this.map);
      this.pinLayer = L.layerGroup().addTo(this.map);
      this.setBase(this.opt.base);

      this.prepareCanal();
      if (this.opt.minimap) this.buildMinimap();
      this.bindEvents();
    }

    /* ---------- ondergrond ---------- */

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
      this.el.classList.toggle('is-aerial', name === 'luchtfoto');
      return name;
    }

    setOffline(offline) {
      if (offline === this.offline) return;
      this.offline = offline;
      if (offline) this.fallback.addTo(this.map); else this.fallback.remove();
      this.el.classList.toggle('is-offline', offline);
      this.emit('og-offline', offline);
    }

    /** Eenvoudige noodkaart uit de eigen kaartgegevens (gracht, straten, namen). */
    buildFallback() {
      const d = this.data;
      const ll = (line) => line.map((c) => [c[1], c[0]]);
      const g = L.layerGroup();
      const opts = (className, weight) => ({ className, weight, interactive: false, lineCap: 'round', lineJoin: 'round' });
      for (const sq of d.squares || []) L.polygon(ll(sq.poly), opts('og-fb-square', 1)).addTo(g);
      for (const s of d.streets || []) L.polyline(ll(s.line), opts('og-fb-street-casing', 14)).addTo(g);
      for (const s of d.streets || []) L.polyline(ll(s.line), opts('og-fb-street', 10)).addTo(g);
      L.polyline(ll(d.canal), opts('og-fb-canal-edge', 26)).addTo(g);
      L.polyline(ll(d.canal), opts('og-fb-canal', 20)).addTo(g);
      const label = (at, text, cls) => L.marker([at[1], at[0]], {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'og-fb-label ' + cls, html: node('span', '', text), iconSize: null })
      }).addTo(g);
      for (const lm of d.landmarks || []) label(lm.at, lm.name, 'is-landmark');
      for (const br of d.bridges || []) label(br.at, br.name, 'is-bridge');
      return g;
    }

    /* ---------- lokale projectie (meters) voor afstanden langs de gracht ---------- */

    project(lng, lat) {
      const b = this.data.bounds;
      return { x: (lng - b.minLng) * this.cos * M_PER_DEG_LNG, y: (b.maxLat - lat) * M_PER_DEG_LAT };
    }

    unproject(x, y) {
      const b = this.data.bounds;
      return L.latLng(b.maxLat - y / M_PER_DEG_LAT, b.minLng + x / (this.cos * M_PER_DEG_LNG));
    }

    prepareCanal() {
      this.canalPts = this.data.canal.map((c) => this.project(c[0], c[1]));
      this.canalLen = [0];
      for (let i = 1; i < this.canalPts.length; i++) {
        const a = this.canalPts[i - 1], b = this.canalPts[i];
        this.canalLen.push(this.canalLen[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
      }
    }

    /** Afstand langs de gracht van het punt dat het dichtst bij (x, y) ligt. */
    arcOf(x, y) {
      let best = Infinity, bestArc = 0;
      for (let i = 0; i < this.canalPts.length - 1; i++) {
        const a = this.canalPts[i], b = this.canalPts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy || 1;
        const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / len2, 0, 1);
        const d = Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
        if (d < best) { best = d; bestArc = this.canalLen[i] + t * Math.sqrt(len2); }
      }
      return bestArc;
    }

    /** Punt en richting (graden, 0 = oost, met de klok mee) op afstand s langs de gracht. */
    pointAt(s) {
      const L2 = this.canalLen;
      s = clamp(s, 0, L2[L2.length - 1]);
      let i = 1;
      while (i < L2.length - 1 && L2[i] < s) i++;
      const a = this.canalPts[i - 1], b = this.canalPts[i];
      const t = (s - L2[i - 1]) / ((L2[i] - L2[i - 1]) || 1);
      const x = a.x + t * (b.x - a.x), y = a.y + t * (b.y - a.y);
      return { x, y, latlng: this.unproject(x, y), angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }

    /* ---------- route en boot ---------- */

    /**
     * @param {Array<{t:number,lat:number,lng:number}>} route
     * @param {{boat?: boolean}} [options]
     */
    setRoute(route, options) {
      const showBoat = !options || options.boat !== false;
      this.route = (route || []).slice().sort((a, b) => a.t - b.t).map((p) => {
        const q = this.project(p.lng, p.lat);
        return { t: p.t, s: this.arcOf(q.x, q.y) };
      });
      this.routeLayer.clearLayers();
      this.lastS = null;
      if (this.boat) { this.boat.remove(); this.boat = null; }
      if (this.route.length < 2) return;

      const sFrom = this.route[0].s, sTo = this.route[this.route.length - 1].s;
      const dir = sTo >= sFrom ? 1 : -1;
      this.routeFrom = sFrom;
      this.routeTo = sTo;
      this.routePath = [];
      for (let s = sFrom; dir * (sTo - s) > 0; s += dir * 4) this.routePath.push({ s, latlng: this.pointAt(s).latlng });
      this.routePath.push({ s: sTo, latlng: this.pointAt(sTo).latlng });

      const latlngs = this.routePath.map((p) => p.latlng);
      L.polyline(latlngs, { className: 'og-route-casing', weight: 11, interactive: false, lineCap: 'round' }).addTo(this.routeLayer);
      L.polyline(latlngs, { className: 'og-route-line', weight: 4, interactive: false, lineCap: 'round' }).addTo(this.routeLayer);
      this.sailed = L.polyline([], { className: 'og-route-sailed', weight: 7, interactive: false, lineCap: 'round' }).addTo(this.routeLayer);
      this.forward = dir > 0 ? 0 : 180;

      if (showBoat) {
        const icon = node('div', 'og-boat');
        icon.innerHTML =
          '<span class="og-boat-halo"></span>' +
          '<svg class="og-boat-shape" viewBox="-24 -24 48 48" aria-hidden="true">' +
          '<path class="og-boat-hull" d="M-18 -8 L10 -8 L20 0 L10 8 L-18 8 Z"/>' +
          '<rect class="og-boat-cabin" x="-12" y="-4" width="14" height="8" rx="1.5"/></svg>';
        this.boat = L.marker(this.routePath[0].latlng, {
          pane: 'boat', interactive: false, keyboard: false,
          title: this.opt.labels.boat || 'Boot',
          icon: L.divIcon({ className: 'og-boat-icon', html: icon, iconSize: [56, 56], iconAnchor: [28, 28] })
        }).addTo(this.map);
        this.boatShape = icon.querySelector('.og-boat-shape');
      }
      this.setTime(0);
    }

    /** Zet het bootje op de juiste plek voor tijd t (seconden). */
    setTime(t) {
      if (!this.route || this.route.length < 2) return;
      const r = this.route;
      let s;
      if (t <= r[0].t) s = r[0].s;
      else if (t >= r[r.length - 1].t) s = r[r.length - 1].s;
      else {
        let i = 1;
        while (r[i].t < t) i++;
        const a = r[i - 1], b = r[i];
        s = a.s + (b.s - a.s) * ((t - a.t) / ((b.t - a.t) || 1));
      }
      if (s === this.lastS) return;
      this.lastS = s;

      const p = this.pointAt(s);
      this.boatLatLng = p.latlng;
      if (this.boat) {
        this.boat.setLatLng(p.latlng);
        this.boatShape.style.transform = `rotate(${(p.angle + this.forward).toFixed(1)}deg)`;
      }
      if (this.mmBoat) this.mmBoat.setLatLng(p.latlng);

      // Het gevaren stuk: alle routepunten tot hier, plus de boot zelf
      const dir = this.routeTo >= this.routeFrom ? 1 : -1;
      const sailed = [];
      for (const q of this.routePath) {
        if (dir * (s - q.s) < 0) break;
        sailed.push(q.latlng);
      }
      sailed.push(p.latlng);
      this.sailed.setLatLngs(sailed);

      if (this.follow && !this.zooming && this.isZoomedIn()) this.map.panTo(p.latlng, { animate: false });
    }

    /* ---------- hotspots ---------- */

    /**
     * @param {Array} locations  {id, code, lat, lng, label}
     * @param {{muted?: boolean}} [options]  muted: alle punten grijs (CMS)
     */
    setLocations(locations, options) {
      const muted = options && options.muted;
      this.locations = locations || [];
      this.pinLayer.clearLayers();
      this.pinNodes = new Map();
      for (const loc of this.locations) {
        if (loc.lat == null || loc.lng == null) continue;
        const dot = node('span', 'og-pin-dot', loc.code);
        const marker = L.marker([loc.lat, loc.lng], {
          keyboard: false,               // toetsenbord gebruikt de lijst met plekken
          interactive: !!this.opt.onHotspot,
          title: loc.label || loc.code,
          riseOnHover: false,
          icon: L.divIcon({ className: 'og-pin' + (muted || this.visited.has(loc.id) ? ' is-visited' : ''), html: dot, iconSize: [56, 56], iconAnchor: [28, 28] })
        });
        if (this.opt.onHotspot) marker.on('click', () => this.opt.onHotspot(loc));
        marker.addTo(this.pinLayer);
        this.pinNodes.set(loc.id, marker);
      }
      this.setActive(this.activeId);
    }

    setActive(id) {
      this.activeId = id;
      this.pinNodes.forEach((marker, key) => {
        const on = key === id;
        const elem = marker.getElement();
        if (elem) elem.classList.toggle('is-active', on);
        marker.setZIndexOffset(on ? 1000 : 0);
      });
    }

    markVisited(id) {
      this.visited.add(id);
      const marker = this.pinNodes.get(id);
      const elem = marker && marker.getElement();
      if (elem) elem.classList.add('is-visited');
    }

    /* ---------- CMS: gekozen plek en losse routepunten ---------- */

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
        L.polyline(points.map((p) => [p.lat, p.lng]), { className: 'og-route-line', weight: 4, interactive: false }).addTo(this.routeLayer);
      }
      points.forEach((p, i) => {
        L.marker([p.lat, p.lng], {
          interactive: false, keyboard: false,
          icon: L.divIcon({
            className: 'og-pin og-pin-small' + (p.active ? ' is-active' : ''),
            html: node('span', 'og-pin-dot', String(i + 1)), iconSize: [34, 34], iconAnchor: [17, 17]
          })
        }).addTo(this.routeLayer);
      });
    }

    /* ---------- zoomen en schuiven ---------- */

    isZoomedIn() { return this.map.getZoom() > this.homeZoom + 0.2; }

    /** Thuisweergave: het hele focusgebied in beeld. */
    reset(animate) {
      this.map.fitBounds(this.focus, { padding: [24, 24], animate: animate !== false && !reducedMotion });
    }

    /** Ingezoomd op de boot. */
    focusBoat() {
      if (this.boatLatLng) this.focusOn(this.boatLatLng.lat, this.boatLatLng.lng);
    }

    /** Ingezoomd op een punt; is de kaart al ingezoomd, dan blijft de zoom gelijk. */
    focusOn(lat, lng) {
      const z = this.isZoomedIn() ? this.map.getZoom() : this.homeZoom + 1.25;
      this.map.setView([lat, lng], z, { animate: !reducedMotion });
    }

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
      const pts = (focusPoints || []).filter((p) => p && !isNaN(p.lat) && !isNaN(p.lng));
      if (pts.length) this.focus = L.latLngBounds(pts.map((p) => [p.lat, p.lng])).pad(0.12);
      const refit = () => {
        const wasHome = !this.isZoomedIn();
        this.map.invalidateSize({ animate: false });
        this.homeZoom = this.map.getBoundsZoom(this.focus, false, L.point(48, 48));
        if (wasHome) this.reset(false);
        this.updateMinimap();
      };
      refit();
      if ('ResizeObserver' in window) {
        let raf = 0;
        new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(refit); }).observe(this.el);
      } else {
        window.addEventListener('resize', refit);
      }
    }

    bindEvents() {
      const m = this.map;
      m.on('dragstart', () => {
        if (!this.follow) return;
        this.follow = false;
        this.emit('og-follow', false);
      });
      m.on('zoomstart', () => { this.zooming = true; });
      m.on('zoomend', () => { this.zooming = false; });
      m.on('moveend zoomend', () => {
        this.el.classList.toggle('is-zoomed', this.isZoomedIn());
        this.updateMinimap();
        this.emit('og-view', { zoom: m.getZoom() });
      });
      if (this.opt.onPick) {
        m.on('click', (e) => this.opt.onPick(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)));
      }
    }

    emit(name, detail) {
      this.el.dispatchEvent(new CustomEvent(name, { detail }));
    }

    /* ---------- minimap ---------- */

    buildMinimap() {
      const mm = this.opt.minimap;
      this.mm = L.map(mm, {
        zoomControl: false, attributionControl: false, dragging: false, touchZoom: false,
        scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false,
        zoomSnap: 0.25, fadeAnimation: false, zoomAnimation: false, inertia: false
      });
      this.mm.setView(this.focus.getCenter(), 15);
      tileLayer('kaart').addTo(this.mm);
      L.polyline(this.data.canal.map((c) => [c[1], c[0]]), { className: 'og-mm-canal', weight: 5, interactive: false }).addTo(this.mm);
      this.mmFrame = L.rectangle(this.map.getBounds(), { className: 'og-minimap-frame', weight: 3, interactive: false }).addTo(this.mm);
      this.mmBoat = L.circleMarker(this.focus.getCenter(), { className: 'og-mm-boat', radius: 5, interactive: false }).addTo(this.mm);
      this.mm.on('click', (e) => {
        this.follow = false;
        this.emit('og-follow', false);
        this.map.panTo(e.latlng, { animate: !reducedMotion });
      });
    }

    updateMinimap() {
      if (!this.mm) return;
      const show = this.isZoomedIn();
      const wrap = this.opt.minimapWrap;
      if (wrap && wrap.hidden === show) {
        wrap.hidden = !show;
        if (show) {
          this.mm.invalidateSize({ animate: false });
          this.mm.fitBounds(this.focus, { animate: false });
        }
      }
      if (show) this.mmFrame.setBounds(this.map.getBounds());
    }
  }

  window.OudegrachtMap = OudegrachtMap;
})();
