/**
 * OudegrachtMap — interactieve SVG-kaart van de Oudegracht.
 *
 * Wordt gebruikt in de bezoekers-app (boot volgen, hotspots, zoom, minimap)
 * én in het CMS (plek kiezen door op de kaart te tikken).
 *
 * Geen externe bibliotheken nodig: werkt ook zonder internet.
 */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const WIDTH = 1000;

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs || {}) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  class OudegrachtMap {
    /**
     * @param {SVGSVGElement} svg
     * @param {object} options
     *   data          kaartgegevens (window.OUDEGRACHT_MAP)
     *   minimap       SVG-element voor de minimap (optioneel)
     *   minimapWrap   element dat getoond/verborgen wordt
     *   onHotspot     functie(location) bij tikken op een hotspot
     *   onPick        functie(lat, lng) bij tikken op de kaart (CMS)
     *   maxZoom       maximale zoomfactor (standaard 6)
     *   labels        { boat: 'Boot' }
     */
    constructor(svg, options) {
      this.svg = svg;
      this.opt = Object.assign({ maxZoom: 6, labels: {} }, options);
      this.data = this.opt.data;
      this.locations = [];
      this.activeId = null;
      this.follow = false;
      this.boatXY = null;

      const b = this.data.bounds;
      this.cos = Math.cos(((b.minLat + b.maxLat) / 2) * Math.PI / 180);
      this.scale = WIDTH / ((b.maxLng - b.minLng) * this.cos);
      this.height = (b.maxLat - b.minLat) * this.scale;
      this.world = { x: 0, y: 0, w: WIDTH, h: this.height };
      this.full = Object.assign({}, this.world);   // 'thuis'-weergave, wordt aangepast aan het kader
      this.view = Object.assign({}, this.full);

      svg.setAttribute('viewBox', `0 0 ${WIDTH} ${this.height.toFixed(1)}`);
      svg.classList.add('og-map');

      this.layers = {
        base: el('g', { class: 'og-base' }, svg),
        labels: el('g', { class: 'og-labels' }, svg),
        route: el('g', { class: 'og-route' }, svg),
        pins: el('g', { class: 'og-pins' }, svg),
        boat: el('g', { class: 'og-boat-layer' }, svg)
      };

      this.drawBase(this.layers.base, this.layers.labels);
      this.prepareCanal();
      if (this.opt.minimap) this.drawMinimap();
      this.bindGestures();
    }

    /* ---------- projectie ---------- */

    project(lng, lat) {
      const b = this.data.bounds;
      return { x: (lng - b.minLng) * this.cos * this.scale, y: (b.maxLat - lat) * this.scale };
    }

    unproject(x, y) {
      const b = this.data.bounds;
      return { lng: b.minLng + x / (this.cos * this.scale), lat: b.maxLat - y / this.scale };
    }

    path(points) {
      return points.map((p, i) => {
        const q = this.project(p[0], p[1]);
        return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
      }).join(' ');
    }

    /* ---------- basiskaart ---------- */

    drawBase(g, labelLayer) {
      el('rect', { x: -2000, y: -2000, width: WIDTH + 4000, height: this.height + 4000, class: 'og-land' }, g);

      for (const sq of this.data.squares) {
        el('path', { d: this.path(sq.poly) + ' Z', class: 'og-square' }, g);
      }

      // Straten: eerst een rand, dan de straat zelf
      for (const s of this.data.streets) el('path', { d: this.path(s.line), class: 'og-street-casing' }, g);
      for (const s of this.data.streets) el('path', { d: this.path(s.line), class: 'og-street' }, g);

      // De gracht
      const canal = this.path(this.data.canal);
      el('path', { d: canal, class: 'og-canal-edge' }, g);
      el('path', { d: canal, class: 'og-canal' }, g);

      // Bruggen dwars over de gracht
      for (const br of this.data.bridges) {
        const p = this.project(br.at[0], br.at[1]);
        const w = br.wide ? 46 : 22;
        el('rect', {
          x: p.x - w / 2, y: p.y - 28, width: w, height: 56, rx: 3,
          class: 'og-bridge', transform: `rotate(${br.angle} ${p.x} ${p.y})`
        }, g);
      }

      // Bezienswaardigheden
      for (const lm of this.data.landmarks) {
        const p = this.project(lm.at[0], lm.at[1]);
        if (lm.type === 'tower') {
          el('rect', { x: p.x - 14, y: p.y - 14, width: 28, height: 28, class: 'og-landmark' }, g);
          el('rect', { x: p.x - 6, y: p.y - 6, width: 12, height: 12, class: 'og-landmark-inner' }, g);
        } else {
          el('rect', { x: p.x - 26, y: p.y - 16, width: 52, height: 32, rx: 2, class: 'og-landmark' }, g);
        }
        const t = el('text', { x: p.x, y: p.y + 40, class: 'og-label og-label-landmark', 'text-anchor': 'middle' }, labelLayer);
        t.textContent = lm.name;
      }

      // Straatnamen langs de straat
      for (const s of this.data.streets) {
        const pts = s.line.map(c => this.project(c[0], c[1]));
        let best = 0, a = pts[0], z = pts[1];
        for (let i = 0; i < pts.length - 1; i++) {
          const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
          if (d > best) { best = d; a = pts[i]; z = pts[i + 1]; }
        }
        if (best < 40) continue;
        let angle = Math.atan2(z.y - a.y, z.x - a.x) * 180 / Math.PI;
        if (angle > 90) angle -= 180;
        if (angle < -90) angle += 180;
        const mx = (a.x + z.x) / 2, my = (a.y + z.y) / 2;
        const t = el('text', {
          x: mx, y: my, dy: 4, class: 'og-label og-label-street', 'text-anchor': 'middle',
          transform: `rotate(${angle.toFixed(1)} ${mx} ${my})`
        }, labelLayer);
        t.textContent = s.name;
      }

      // Brugnamen
      for (const br of this.data.bridges) {
        const p = this.project(br.at[0], br.at[1]);
        const t = el('text', { x: p.x - 34, y: p.y + 5, class: 'og-label og-label-bridge', 'text-anchor': 'end' }, labelLayer);
        t.textContent = br.name;
      }

      // Noordpijl
      const n = el('g', { class: 'og-north', transform: `translate(${WIDTH - 50} 50)` }, labelLayer);
      el('circle', { r: 26 }, n);
      el('path', { d: 'M0 -18 L8 6 L0 1 L-8 6 Z' }, n);
      const nt = el('text', { y: 20, 'text-anchor': 'middle' }, n);
      nt.textContent = 'N';
    }

    /* ---------- gracht als lijn, voor het bootje ---------- */

    prepareCanal() {
      this.canalPts = this.data.canal.map(c => this.project(c[0], c[1]));
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
        const px = a.x + t * dx, py = a.y + t * dy;
        const d = Math.hypot(x - px, y - py);
        if (d < best) { best = d; bestArc = this.canalLen[i] + t * Math.sqrt(len2); }
      }
      return bestArc;
    }

    /** Punt en richting op afstand s langs de gracht. */
    pointAt(s) {
      const L = this.canalLen;
      s = clamp(s, 0, L[L.length - 1]);
      let i = 1;
      while (i < L.length - 1 && L[i] < s) i++;
      const a = this.canalPts[i - 1], b = this.canalPts[i];
      const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
      return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
    }

    /* ---------- route en boot ---------- */

    setRoute(route) {
      this.route = (route || []).slice().sort((a, b) => a.t - b.t).map(p => {
        const q = this.project(p.lng, p.lat);
        return { t: p.t, s: this.arcOf(q.x, q.y) };
      });
      const g = this.layers.route;
      g.textContent = '';
      if (this.route.length < 2) return;

      const sFrom = this.route[0].s, sTo = this.route[this.route.length - 1].s;
      const pts = [];
      for (let s = sFrom; s <= sTo; s += 6) pts.push(this.pointAt(s));
      pts.push(this.pointAt(sTo));
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
      el('path', { d, class: 'og-route-line' }, g);
      this.sailed = el('path', { d, class: 'og-route-sailed' }, g);
      this.sailedLength = this.sailed.getTotalLength ? this.sailed.getTotalLength() : 0;
      this.sailed.style.strokeDasharray = `${this.sailedLength} ${this.sailedLength}`;
      this.sailed.style.strokeDashoffset = String(this.sailedLength);
      this.routeFrom = sFrom;
      this.routeTo = sTo;

      const boat = this.layers.boat;
      boat.textContent = '';
      this.boat = el('g', { class: 'og-boat' }, boat);
      el('circle', { r: 26, class: 'og-boat-halo' }, this.boat);
      this.boatShape = el('g', {}, this.boat);
      el('path', { d: 'M-18 -8 L10 -8 L20 0 L10 8 L-18 8 Z', class: 'og-boat-hull' }, this.boatShape);
      el('rect', { x: -12, y: -4, width: 14, height: 8, rx: 1.5, class: 'og-boat-cabin' }, this.boatShape);
      const title = el('title', {}, this.boat);
      title.textContent = this.opt.labels.boat || 'Boot';
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
      const p = this.pointAt(s);
      const forward = (r[r.length - 1].s >= r[0].s) ? 0 : 180;
      this.boat.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      this.boatShape.setAttribute('transform', `rotate(${(p.angle + forward).toFixed(1)})`);
      this.boatXY = p;

      const progress = (s - this.routeFrom) / ((this.routeTo - this.routeFrom) || 1);
      this.sailed.style.strokeDashoffset = String(this.sailedLength * (1 - clamp(progress, 0, 1)));

      if (this.follow && this.zoomLevel() > 1.05) this.centerOn(p.x, p.y, false);
    }

    /* ---------- hotspots ---------- */

    setLocations(locations) {
      this.locations = locations || [];
      const g = this.layers.pins;
      g.textContent = '';
      this.pinNodes = new Map();
      for (const loc of this.locations) {
        const p = this.project(loc.lng, loc.lat);
        const pin = el('g', {
          class: 'og-pin', transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`,
          tabindex: '-1', 'data-id': String(loc.id)
        }, g);
        el('circle', { r: 34, class: 'og-pin-hit' }, pin);
        el('circle', { r: 21, class: 'og-pin-dot' }, pin);
        const t = el('text', { class: 'og-pin-code', 'text-anchor': 'middle', dy: 6.5 }, pin);
        t.textContent = loc.code;
        const title = el('title', {}, pin);
        title.textContent = loc.label || loc.code;
        this.pinNodes.set(loc.id, pin);
      }
      this.setActive(this.activeId);
    }

    setActive(id) {
      this.activeId = id;
      if (!this.pinNodes) return;
      this.pinNodes.forEach((node, key) => node.classList.toggle('is-active', key === id));
      const active = this.pinNodes.get(id);
      if (active) this.layers.pins.appendChild(active); // bovenop tekenen
    }

    markVisited(id) {
      const node = this.pinNodes && this.pinNodes.get(id);
      if (node) node.classList.add('is-visited');
    }

    /* ---------- marker voor het CMS ---------- */

    setMarker(lat, lng) {
      if (!this.marker) {
        this.marker = el('g', { class: 'og-marker' }, this.layers.boat);
        el('circle', { r: 30, class: 'og-marker-halo' }, this.marker);
        el('circle', { r: 12, class: 'og-marker-dot' }, this.marker);
      }
      if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
        this.marker.style.display = 'none';
        return;
      }
      const p = this.project(lng, lat);
      this.marker.style.display = '';
      this.marker.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    }

    /** Losse genummerde punten tonen (CMS-routepagina). */
    setPoints(points) {
      const g = this.layers.route;
      g.textContent = '';
      if (points.length > 1) {
        el('path', { d: this.path(points.map(p => [p.lng, p.lat])), class: 'og-route-line' }, g);
      }
      points.forEach((p, i) => {
        const q = this.project(p.lng, p.lat);
        const node = el('g', { class: 'og-pin og-pin-small' + (p.active ? ' is-active' : ''), transform: `translate(${q.x} ${q.y})` }, g);
        el('circle', { r: 15, class: 'og-pin-dot' }, node);
        const t = el('text', { class: 'og-pin-code', 'text-anchor': 'middle', dy: 5 }, node);
        t.textContent = String(i + 1);
      });
    }

    /* ---------- zoomen en schuiven ---------- */

    zoomLevel() { return this.full.w / this.view.w; }

    applyView() {
      const v = this.view;
      this.svg.setAttribute('viewBox', `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
      this.svg.classList.toggle('is-zoomed', Math.abs(this.zoomLevel() - 1) > 0.05 || Math.abs(this.view.x - this.full.x) > 2);
      this.updateMinimap();
    }

    constrain() {
      const v = this.view, f = this.full, w = this.world;
      v.w = clamp(v.w, f.w / this.opt.maxZoom, Math.max(f.w, w.w));
      v.h = v.w * (f.h / f.w);
      const minX = Math.min(w.x, f.x), maxX = Math.max(w.x + w.w, f.x + f.w);
      const minY = Math.min(w.y, f.y), maxY = Math.max(w.y + w.h, f.y + f.h);
      v.x = v.w >= maxX - minX ? (minX + maxX - v.w) / 2 : clamp(v.x, minX, maxX - v.w);
      v.y = v.h >= maxY - minY ? (minY + maxY - v.h) / 2 : clamp(v.y, minY, maxY - v.h);
    }

    /**
     * Past de 'thuis'-weergave aan de vorm van het kader aan, zodat de kaart
     * het vak vult en de route goed in beeld is.
     * @param {{x:number,y:number,w:number,h:number}} [focus] gebied dat zichtbaar moet zijn
     */
    fit(focus) {
      const rect = this.svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const aspect = rect.height / rect.width;
      if (focus) this.focus = focus;
      const fb = this.focus || this.world;
      let w = fb.w, h = fb.w * aspect;
      if (h < fb.h) { h = fb.h; w = h / aspect; }
      const wasHome = !this.view || Math.abs(this.view.w - this.full.w) < 1;
      const zoom = this.zoomLevel ? this.zoomLevel() : 1;
      this.full = { x: fb.x + fb.w / 2 - w / 2, y: fb.y + fb.h / 2 - h / 2, w, h };
      this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      if (wasHome) {
        this.view = Object.assign({}, this.full);
      } else {
        const cx = this.view.x + this.view.w / 2, cy = this.view.y + this.view.h / 2;
        this.view = { w: w / zoom, h: h / zoom, x: 0, y: 0 };
        this.view.x = cx - this.view.w / 2; this.view.y = cy - this.view.h / 2;
        this.constrain();
      }
      this.applyView();
    }

    /** Gebied rond een lijst punten (lat/lng), met marge in kaarteenheden. */
    boxAround(points, margin = 70) {
      const xy = points.map(p => this.project(p.lng, p.lat));
      const xs = xy.map(p => p.x), ys = xy.map(p => p.y);
      const x = Math.min(...xs) - margin, y = Math.min(...ys) - margin;
      return { x, y, w: Math.max(...xs) - x + margin, h: Math.max(...ys) - y + margin };
    }

    /** Kaart automatisch passend houden bij het formaat van het kader. */
    autoFit(focusPoints) {
      const refit = () => this.fit(focusPoints && focusPoints.length ? this.boxAround(focusPoints) : null);
      refit();
      if ('ResizeObserver' in window) new ResizeObserver(refit).observe(this.svg);
      else window.addEventListener('resize', refit);
    }

    zoomAt(factor, cx, cy) {
      const v = this.view;
      if (cx == null) { cx = v.x + v.w / 2; cy = v.y + v.h / 2; }
      const nw = clamp(v.w / factor, this.full.w / this.opt.maxZoom, Math.max(this.full.w, this.world.w));
      const ratio = nw / v.w;
      v.x = cx - (cx - v.x) * ratio;
      v.y = cy - (cy - v.y) * ratio;
      v.w = nw;
      this.constrain();
      this.applyView();
    }

    zoomIn() {
      if (this.follow && this.boatXY) this.zoomAt(1.6, this.boatXY.x, this.boatXY.y);
      else this.zoomAt(1.6);
    }
    zoomOut() { this.zoomAt(1 / 1.6); }
    reset() { this.view = Object.assign({}, this.full); this.applyView(); }

    centerOn(x, y, constrain = true) {
      const v = this.view;
      v.x = x - v.w / 2;
      v.y = y - v.h / 2;
      if (constrain) this.constrain();
      this.applyView();
    }

    /** Scherm-coördinaten -> kaart-coördinaten. */
    toMap(clientX, clientY) {
      const pt = this.svg.createSVGPoint();
      pt.x = clientX; pt.y = clientY;
      const m = this.svg.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    }

    bindGestures() {
      const svg = this.svg;
      const pointers = new Map();
      let start = null, moved = false, pinch = null;

      svg.addEventListener('pointerdown', (e) => {
        svg.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        moved = false;
        start = { x: e.clientX, y: e.clientY, view: Object.assign({}, this.view), target: e.target };
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), view: Object.assign({}, this.view) };
        }
      });

      svg.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const rect = svg.getBoundingClientRect();
        const unit = this.view.w / Math.max(1, rect.width);

        if (pointers.size >= 2 && pinch) {
          const [a, b] = [...pointers.values()];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const mid = this.toMap((a.x + b.x) / 2, (a.y + b.y) / 2);
          const factor = (dist / (pinch.dist || 1)) * (pinch.view.w / this.view.w);
          this.zoomAt(factor, mid.x, mid.y);
          moved = true;
          this.follow = false;
          this.svg.dispatchEvent(new CustomEvent('og-follow', { detail: false }));
          return;
        }
        if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!moved && Math.hypot(dx, dy) < 8) return;
        moved = true;
        if (this.follow) {
          this.follow = false;
          this.svg.dispatchEvent(new CustomEvent('og-follow', { detail: false }));
        }
        this.view.x = start.view.x - dx * unit;
        this.view.y = start.view.y - dy * unit;
        this.constrain();
        this.applyView();
      });

      const end = (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinch = null;
        if (e.type === 'pointerup' && !moved && start && pointers.size === 0) this.handleTap(start.target, e);
        if (pointers.size === 0) start = null;
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);

      svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const p = this.toMap(e.clientX, e.clientY);
        this.zoomAt(e.deltaY < 0 ? 1.25 : 0.8, p.x, p.y);
      }, { passive: false });
    }

    handleTap(target, e) {
      const pin = target && target.closest ? target.closest('.og-pin[data-id]') : null;
      if (pin && this.opt.onHotspot) {
        const loc = this.locations.find(l => String(l.id) === pin.getAttribute('data-id'));
        if (loc) this.opt.onHotspot(loc);
        return;
      }
      if (this.opt.onPick) {
        const p = this.toMap(e.clientX, e.clientY);
        const geo = this.unproject(p.x, p.y);
        this.opt.onPick(+geo.lat.toFixed(6), +geo.lng.toFixed(6));
      }
    }

    /* ---------- minimap ---------- */

    drawMinimap() {
      const mm = this.opt.minimap;
      mm.setAttribute('viewBox', `0 0 ${WIDTH} ${this.height.toFixed(1)}`);
      const g = el('g', {}, mm);
      el('rect', { x: 0, y: 0, width: WIDTH, height: this.height, class: 'og-land' }, g);
      const canal = this.path(this.data.canal);
      el('path', { d: canal, class: 'og-canal', style: 'stroke-width:40' }, g);
      this.mmFrame = el('rect', { class: 'og-minimap-frame' }, mm);
      mm.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const pt = mm.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const p = pt.matrixTransform(mm.getScreenCTM().inverse());
        this.follow = false;
        this.svg.dispatchEvent(new CustomEvent('og-follow', { detail: false }));
        this.centerOn(p.x, p.y);
      });
    }

    updateMinimap() {
      if (!this.mmFrame) return;
      const v = this.view;
      this.mmFrame.setAttribute('x', v.x);
      this.mmFrame.setAttribute('y', v.y);
      this.mmFrame.setAttribute('width', v.w);
      this.mmFrame.setAttribute('height', v.h);
      if (this.opt.minimapWrap) this.opt.minimapWrap.hidden = this.zoomLevel() <= 1.05;
      this.svg.dispatchEvent(new CustomEvent('og-view', { detail: { zoom: this.zoomLevel() } }));
    }
  }

  window.OudegrachtMap = OudegrachtMap;
})();
