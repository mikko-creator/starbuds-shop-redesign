/* finder.js (FINDER lane, REVISION-1 R1.3): the home-page store finder. No libraries.
   - state tabs + clicks on a highlighted state animate the map viewBox to that state (instant under reduced motion)
   - a pin or a row selects a store: both highlight and its server-rendered detail card opens (Escape closes it)
   - open/closed status only for stores with captured hours, computed in the store's time zone
   - "Make this my store" is a [data-store-pick] button: site.js saves it via window.SB.setStore(slug)
   - "Street map" injects a keyless Google Maps iframe on click only (no third-party request on page load)
   - "Near me" asks for the location on click only and sorts the list in the browser; nothing is sent anywhere
   Links: internal hrefs are read from the rendered HTML, external ones are absolute; this file builds no root-absolute
   path (the Pages preview rule). */
(function () {
  'use strict';
  var root = document.querySelector('[data-finder]');
  if (!root) return;
  var $ = function (sel, el) { return (el || root).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var svg = $('[data-finder-svg]');
  var viewport = $('[data-finder-viewport]');
  var rowsList = $('[data-finder-rows]');
  var rows = $$('[data-finder-row]');
  var pins = $$('[data-finder-pin]');
  var cards = $$('[data-finder-card]');
  var tabs = $$('[data-finder-tab]');
  var input = $('[data-finder-q]');
  var countEl = $('[data-finder-count]');
  var msgEl = $('[data-finder-msg]');
  var resetBtn = $('[data-finder-reset]');
  var rockerText = $('[data-finder-rocker-text]');
  var pinLayer = pins.length ? pins[0].parentNode : null;
  var total = rows.length;
  var FULL = [0, 0, 975, 610];
  var stateNames = { all: 'All Locations', MS: 'Mississippi', OK: 'Oklahoma', MD: 'Maryland', NY: 'New York' };

  var byState = {};
  $$('[data-finder-state]').forEach(function (p) {
    byState[p.getAttribute('data-finder-state')] = { el: p, bbox: p.getAttribute('data-bbox').split(' ').map(Number) };
  });
  var pinBy = {}, rowBy = {}, cardBy = {};
  pins.forEach(function (p) { pinBy[p.getAttribute('data-finder-pin')] = p; p.setAttribute('role', 'button'); });
  rows.forEach(function (r) { rowBy[r.getAttribute('data-finder-row')] = r; });
  cards.forEach(function (c) { cardBy[c.getAttribute('data-finder-card')] = c; });

  var state = 'all', selected = null, lastTrigger = null;
  root.classList.add('finder--js');

  /* ---------- viewBox animation ---------- */
  var vb = FULL.slice(), anim = null;
  function frameSize() { var r = viewport.getBoundingClientRect(); return { w: r.width || 1, h: r.height || 1 }; }
  function cardInset() {
    // on wide screens the open card floats over the map's right side: frame the state in the space left of it
    if (!selected || innerWidth < 1000) return 0;
    var c = cardBy[selected];
    if (!c || c.hidden) return 0;
    return Math.min(c.getBoundingClientRect().width + 28, frameSize().w * 0.5);
  }
  function fit(b, padFrac, inset) {
    var f = frameSize(), availW = Math.max(80, f.w - inset), availH = f.h;
    var bw = b[2] - b[0], bh = b[3] - b[1];
    var pw = bw * (1 + padFrac * 2), ph = bh * (1 + padFrac * 2);
    var minW = 130; // never zoom closer than ~130 map units across
    if (pw < minW) { ph *= minW / pw; pw = minW; }
    var s = Math.min(availW / pw, availH / ph); // px per map unit
    var w = f.w / s, h = f.h / s;
    var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    return [cx - (availW / 2) / s, cy - (availH / 2) / s, w, h];
  }
  function target() {
    if (state === 'all' || !byState[state]) return fit(FULL, 0.01, 0);
    return fit(byState[state].bbox, 0.12, cardInset());
  }
  function apply(v) {
    vb = v;
    svg.setAttribute('viewBox', v.map(function (n) { return n.toFixed(2); }).join(' '));
    var upp = v[2] / frameSize().w; // map units per screen px
    var zoom = 975 / v[2];
    var px = Math.max(7, Math.min(11, 6 + zoom * 0.9)); // pin radius in screen px: small nationally, larger zoomed in
    var k = (upp * px) / 11;
    pins.forEach(function (p) {
      var on = p.getAttribute('data-finder-pin') === selected;
      p.setAttribute('transform', 'translate(' + p.getAttribute('data-x') + ' ' + p.getAttribute('data-y') + ') scale(' + (k * (on ? 1.3 : 1)).toFixed(4) + ')');
    });
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function animateTo(to) {
    if (anim) cancelAnimationFrame(anim.raf);
    if (reduce) { apply(to); return; }
    var from = vb.slice(), t0 = performance.now(), dur = 820;
    anim = { raf: 0 };
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur), e = ease(t);
      apply(from.map(function (a, i) { return a + (to[i] - a) * e; }));
      if (t < 1) anim.raf = requestAnimationFrame(step); else anim = null;
    })(t0);
  }
  function refit(animate) { var t = target(); if (animate) animateTo(t); else apply(t); }

  /* ---------- state + filter ---------- */
  function setState(code, opts) {
    opts = opts || {};
    state = code;
    tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-finder-tab') === code ? 'true' : 'false'); });
    svg.setAttribute('data-zoom', code);
    Object.keys(byState).forEach(function (k) { byState[k].el.classList.toggle('is-active', k === code); });
    if (rockerText) rockerText.textContent = stateNames[code] || code;
    resetBtn.hidden = code === 'all';
    if (selected && code !== 'all' && cardBy[selected] && cardBy[selected].getAttribute('data-state') !== code) closeCard(false);
    filter();
    if (opts.fit !== false) refit(true);
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function filter() {
    var q = norm(input.value), toks = q ? q.split(' ') : [], shown = 0;
    rows.forEach(function (r) {
      var hay = ' ' + norm(r.getAttribute('data-search')) + ' ';
      var okState = state === 'all' || r.getAttribute('data-state') === state;
      var okText = toks.every(function (t) { return t.length < 3 && /^[a-z]+$/.test(t) ? hay.indexOf(' ' + t + ' ') > -1 : hay.indexOf(t) > -1; });
      var on = okState && okText;
      r.hidden = !on;
      var p = pinBy[r.getAttribute('data-finder-row')];
      if (p) p.classList.toggle('is-dim', !on);
      if (on) shown++;
    });
    var word = function (n) { return n + (n === 1 ? ' location' : ' locations'); };
    if (!shown) countEl.textContent = q ? 'No store matches “' + input.value.trim() + '”. Try a city, a state or Near me.' : 'No stores here.';
    else countEl.textContent = shown === total ? word(total) : 'Showing ' + shown + ' of ' + word(total);
  }

  /* ---------- selection + card ---------- */
  function select(slug, opts) {
    opts = opts || {};
    var card = cardBy[slug];
    if (!card) return;
    if (selected && cardBy[selected] && selected !== slug) hideCard(cardBy[selected]);
    selected = slug;
    rows.forEach(function (r) { var on = r.getAttribute('data-finder-row') === slug; r.classList.toggle('is-active', on); var a = $('a', r); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    pins.forEach(function (p) { var on = p.getAttribute('data-finder-pin') === slug; p.classList.toggle('is-active', on); p.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if (pinBy[slug] && pinLayer) pinLayer.appendChild(pinBy[slug]); // draw the chosen pin on top
    card.hidden = false;
    card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in');
    updateStatus();
    var st = card.getAttribute('data-state');
    if (state !== st) setState(st, { fit: false });
    refit(true);
    if (opts.focus) { var h = $('.fcard__city', card); if (h) h.focus({ preventScroll: true }); }
    if (innerWidth < 1000 && opts.scroll !== false) {
      var r = card.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight) card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }
  }
  function hideCard(card) {
    card.hidden = true;
    card.classList.remove('is-in');
    var slot = $('[data-finder-embed]', card), btn = $('[data-finder-street]', card);
    if (slot) { slot.innerHTML = ''; slot.hidden = true; }
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  function closeCard(returnFocus) {
    if (!selected) return;
    var slug = selected;
    hideCard(cardBy[slug]);
    selected = null;
    rows.forEach(function (r) { r.classList.remove('is-active'); var a = $('a', r); a.removeAttribute('aria-current'); });
    pins.forEach(function (p) { p.classList.remove('is-active'); p.setAttribute('aria-pressed', 'false'); });
    refit(true);
    if (returnFocus && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  }

  /* ---------- open / closed (only where hours exist) ---------- */
  function mins(t) {
    var m = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(String(t).trim());
    if (!m) return null;
    var h = Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0);
    return h * 60 + Number(m[2]);
  }
  function fmt(m) { m = ((m % 1440) + 1440) % 1440; var h = Math.floor(m / 60), mm = m % 60, ap = h < 12 ? 'AM' : 'PM'; h = h % 12 || 12; return h + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function nowIn(tz) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: DAYS.indexOf(o.weekday), min: (Number(o.hour) % 24) * 60 + Number(o.minute) };
    } catch (e) { return null; }
  }
  function span(times, d) { // -> [open, close] in minutes from that day's midnight; close past midnight = +1440
    var t = times[d]; if (!t) return null;
    var p = t.split('-'), o = mins(p[0]), c = mins(p[1]);
    if (o == null || c == null) return null;
    if (c <= o) c += 1440;
    return [o, c];
  }
  function statusOf(card) {
    var tz = card.getAttribute('data-tz'), raw = card.getAttribute('data-hours');
    if (!tz || !raw) return null;
    var times; try { times = JSON.parse(raw); } catch (e) { return null; }
    var n = nowIn(tz); if (!n || n.day < 0) return null;
    var today = span(times, n.day), prev = span(times, (n.day + 6) % 7);
    if (prev && prev[1] > 1440 && n.min < prev[1] - 1440) return { open: true, text: 'Open now · until ' + fmt(prev[1]) };
    if (today && n.min >= today[0] && n.min < today[1]) return { open: true, text: 'Open now · until ' + fmt(today[1]) };
    if (today && n.min < today[0]) return { open: false, text: 'Closed · opens ' + fmt(today[0]) };
    for (var i = 1; i <= 7; i++) { var s = span(times, (n.day + i) % 7); if (s) return { open: false, text: 'Closed · opens ' + (i === 1 ? 'tomorrow ' : DAYS[(n.day + i) % 7].slice(0, 3) + ' ') + fmt(s[0]) }; }
    return null;
  }
  function updateStatus() {
    cards.forEach(function (card) {
      var slug = card.getAttribute('data-finder-card'), st = statusOf(card);
      $$('[data-finder-status="' + slug + '"]').forEach(function (el) {
        el.textContent = st ? st.text : '';
        el.classList.toggle('is-open', !!(st && st.open));
        el.classList.toggle('is-closed', !!(st && !st.open));
      });
    });
  }

  /* ---------- street map (on click only) ---------- */
  function streetMap(card, btn) {
    var slot = $('[data-finder-embed]', card);
    if (!slot) return;
    if (!slot.hidden && slot.firstChild) { slot.innerHTML = ''; slot.hidden = true; btn.setAttribute('aria-expanded', 'false'); return; }
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(card.getAttribute('data-embed-q')) + '&z=15&output=embed';
    f.title = card.getAttribute('data-embed-title') || 'Street map (Google Maps)';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.setAttribute('allowfullscreen', '');
    slot.appendChild(f);
    slot.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  /* ---------- near me (on click only; nothing leaves the browser) ---------- */
  function say(text) { msgEl.textContent = text; msgEl.hidden = !text; }
  function miles(a, b, c, d) {
    var R = 3958.8, r = Math.PI / 180, dLat = (c - a) * r, dLon = (d - b) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function nearMe(btn) {
    if (!navigator.geolocation) { say('Location is not available in this browser. Search by city, state or ZIP instead.'); return; }
    btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
    say('Finding your location…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.removeAttribute('aria-busy'); btn.disabled = false;
      var lat = pos.coords.latitude, lon = pos.coords.longitude;
      var list = rows.slice().filter(function (r) { return r.hasAttribute('data-lat'); }).map(function (r) {
        return { r: r, d: miles(lat, lon, Number(r.getAttribute('data-lat')), Number(r.getAttribute('data-lon'))) };
      }).sort(function (a, b) { return a.d - b.d; });
      list.forEach(function (x) {
        rowsList.appendChild(x.r);
        var el = $('[data-finder-dist]', x.r);
        if (el) el.textContent = (x.d < 10 ? x.d.toFixed(1) : Math.round(x.d).toLocaleString('en-US')) + ' mi';
      });
      rows = $$('[data-finder-row]');
      input.value = '';
      root.classList.add('finder--near');
      setState('all');
      if (list[0]) {
        say('Sorted by distance from you. Your location stays in this browser.');
        rowsList.scrollTop = 0;
      }
    }, function () {
      btn.removeAttribute('aria-busy'); btn.disabled = false;
      say('Location is off or unavailable. Search by city, state or ZIP instead.');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 });
  }

  /* ---------- events ---------- */
  tabs.forEach(function (t) { t.addEventListener('click', function () { setState(t.getAttribute('data-finder-tab')); }); });
  Object.keys(byState).forEach(function (k) { byState[k].el.addEventListener('click', function () { setState(k); }); });
  resetBtn.addEventListener('click', function () { closeCard(false); setState('all'); });
  input.addEventListener('input', function () {
    filter();
    // nothing in the zoomed state matches: search every state instead
    if (input.value.trim() && state !== 'all' && !rows.some(function (r) { return !r.hidden; })) setState('all');
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); var first = rows.filter(function (r) { return !r.hidden; })[0]; if (first) { lastTrigger = $('a', first); select(first.getAttribute('data-finder-row'), { focus: true }); } }
  });
  function plain(e) { return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1); }
  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (!t) return;
    var pick = t.closest('[data-finder-pick], [data-finder-pin]');
    if (pick && plain(e)) {
      e.preventDefault();
      lastTrigger = pick;
      select(pick.getAttribute('data-finder-pick') || pick.getAttribute('data-finder-pin'), { focus: e.detail === 0 });
      return;
    }
    if (t.closest('[data-finder-close]')) { closeCard(true); return; }
    var sb = t.closest('[data-finder-street]');
    if (sb) { streetMap(sb.closest('[data-finder-card]'), sb); return; }
    var nb = t.closest('[data-finder-near]');
    if (nb) nearMe(nb);
  });
  pins.forEach(function (p) {
    p.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); lastTrigger = p; select(p.getAttribute('data-finder-pin'), { focus: true }); }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && selected) {
      var a = document.activeElement;
      if (a && a.closest && a.closest('[data-switcher], [data-drawer]')) return;
      closeCard(true);
    }
  });
  // "Your store" tag on the remembered store's row (site.js fires sb:store)
  function markMine(s) { rows.forEach(function (r) { r.classList.toggle('is-mine', !!s && r.getAttribute('data-finder-row') === s.slug); }); }
  document.addEventListener('sb:store', function (e) { markMine(e.detail); });
  if (window.SB && window.SB.current) markMine(window.SB.current);

  var rT;
  addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { refit(false); }, 120); }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (!anim) refit(false); }).observe(viewport);
  setInterval(updateStatus, 60000);

  updateStatus();
  svg.setAttribute('data-zoom', 'all');
  refit(false);
})();
