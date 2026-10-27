/* site.js - Pop Glass behaviour (FOUNDATION). No libraries. Content works without it.
   - store memory: localStorage "sbshop-store" (a store slug); rewrites a[data-menu-cat] (live menu) and a[data-store-link]
     (store page), fills [data-store-label] ("MS: Pearl") and [data-store-field], unhides [data-store-current],
     marks [data-store-pick] / .chip of the current store with .is-current, fires document event "sb:store" {detail: store}.
   - [data-store-pick="<slug>"] click = choose that store (stays on the page); a live-menu link clicked before any store
     is chosen opens the Locations chooser and continues to the menu after the pick.
   - header switcher ([data-switch-toggle] / [data-switcher]), mobile drawer ([data-drawer-toggle] / [data-drawer]),
     age gate (localStorage "sbshop-age-ok" = "1"), reveals ([data-reveal], [data-stagger]), parallax ([data-depth]),
     tilt ([data-tilt]), tabs ([data-tabs]), background videos (.bg-video). */
(function () {
  'use strict';
  window.SB_READY = true;
  var d = document, html = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); };
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };

  var DATA = { shop: 'https://shop.starbuds.us', stores: [] };
  try { DATA = JSON.parse(d.getElementById('sb-data').textContent); } catch (e) {}
  var bySlug = {};
  DATA.stores.forEach(function (s) { bySlug[s.slug] = s; });
  var SB = window.SB = { data: DATA, current: null, pendingCat: null };

  function menuUrl(s, cat) {
    if (!cat) return s.liveUrl || (DATA.shop + '/stores/' + s.slug + '/');
    return DATA.shop + '/stores/' + s.slug + '/products/' + cat;
  }
  SB.menuUrl = menuUrl;

  /* ---------- store memory ---------- */
  function applyStore(s) {
    SB.current = s || null;
    $$('a[data-menu-cat]').forEach(function (a) {
      if (!a.hasAttribute('data-default-href')) a.setAttribute('data-default-href', a.getAttribute('href'));
      if (s) { a.href = menuUrl(s, a.getAttribute('data-menu-cat')); a.target = '_blank'; a.rel = 'noopener'; }
      else { a.setAttribute('href', a.getAttribute('data-default-href')); a.removeAttribute('target'); }
    });
    $$('a[data-store-link]').forEach(function (a) {
      if (!a.hasAttribute('data-default-href')) a.setAttribute('data-default-href', a.getAttribute('href'));
      a.setAttribute('href', s ? '/stores/' + s.slug + '/' : a.getAttribute('data-default-href'));
    });
    $$('[data-store-label]').forEach(function (el) {
      if (!el.hasAttribute('data-default-text')) el.setAttribute('data-default-text', el.textContent);
      el.textContent = s ? s.state + ': ' + s.city : el.getAttribute('data-default-text');
    });
    $$('[data-store-field]').forEach(function (el) {
      var f = el.getAttribute('data-store-field');
      var v = s ? s[f] : '';
      el.textContent = Array.isArray(v) ? v.join(', ') : (v || '');
    });
    $$('a[data-store-tel]').forEach(function (a) { if (s && s.tel) { a.href = 'tel:' + s.tel; a.hidden = false; } else a.hidden = true; });
    $$('a[data-store-map]').forEach(function (a) { if (s && s.mapUrl) { a.href = s.mapUrl; a.hidden = false; } else a.hidden = true; });
    $$('[data-store-current]').forEach(function (el) { el.hidden = !s; });
    $$('[data-store-none]').forEach(function (el) { el.hidden = !!s; });
    $$('[data-store-pick]').forEach(function (el) {
      var on = !!s && el.getAttribute('data-store-pick') === s.slug;
      el.classList.toggle('is-current', on);
      if (el.tagName === 'BUTTON') el.setAttribute('aria-pressed', on ? 'true' : 'false');
      else if (on) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
    });
    try { d.dispatchEvent(new CustomEvent('sb:store', { detail: s || null })); } catch (e) {}
  }
  SB.setStore = function (slug) {
    var s = bySlug[slug];
    if (!s) return;
    store('sbshop-store', slug);
    applyStore(s);
  };
  var saved = store('sbshop-store');
  applyStore(saved && bySlug[saved] ? bySlug[saved] : null);

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(htmlStr) {
    var t = d.querySelector('.toast');
    if (!t) { t = d.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); d.body.appendChild(t); }
    t.innerHTML = htmlStr;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 4200);
  }
  var escH = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- switcher + drawer ---------- */
  var switcher = d.querySelector('[data-switcher]');
  var drawer = d.querySelector('[data-drawer]');
  var hint = d.querySelector('[data-switcher-hint]');
  function setExpanded(sel, on) { $$(sel).forEach(function (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); }); }
  function openSwitcher(focus) {
    if (!switcher) return;
    switcher.hidden = false; setExpanded('[data-switch-toggle]', true);
    if (hint) hint.hidden = SB.pendingCat === null;
    if (focus) { var f = switcher.querySelector('.is-current') || switcher.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
  }
  function closeSwitcher() { if (!switcher || switcher.hidden) return; switcher.hidden = true; setExpanded('[data-switch-toggle]', false); }
  function placeDrawer() { var h = d.querySelector('[data-header]'); if (h) html.style.setProperty('--drawer-top', Math.max(0, h.getBoundingClientRect().bottom) + 'px'); }
  function openDrawer() { if (!drawer) return; placeDrawer(); drawer.hidden = false; html.classList.add('drawer-open'); setExpanded('[data-drawer-toggle]', true); }
  function closeDrawer() { if (!drawer || drawer.hidden) return; drawer.hidden = true; html.classList.remove('drawer-open'); setExpanded('[data-drawer-toggle]', false); }
  function openChooser() { if (innerWidth < 1000) openDrawer(); else openSwitcher(true); }
  SB.openChooser = openChooser;

  d.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (!t) return;
    var tog = t.closest('[data-switch-toggle]');
    if (tog) {
      e.preventDefault();
      if (innerWidth < 1000) { openDrawer(); return; }
      if (switcher && switcher.hidden) { SB.pendingCat = null; openSwitcher(false); } else closeSwitcher();
      return;
    }
    if (t.closest('[data-drawer-toggle]')) { e.preventDefault(); if (drawer && drawer.hidden) openDrawer(); else closeDrawer(); return; }
    var pick = t.closest('[data-store-pick]');
    if (pick && !(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) {
      e.preventDefault();
      var slug = pick.getAttribute('data-store-pick');
      SB.setStore(slug);
      closeSwitcher(); closeDrawer();
      var s = bySlug[slug];
      if (SB.pendingCat !== null && s) { var url = menuUrl(s, SB.pendingCat); SB.pendingCat = null; window.open(url, '_blank', 'noopener'); return; }
      if (s && !pick.hasAttribute('data-no-toast')) toast('<span>You’re shopping at <strong>Star Buds in ' + escH(s.city) + '</strong></span><a href="/stores/' + escH(s.slug) + '/">View store</a>');
      return;
    }
    var menu = t.closest('a[data-menu-cat]');
    if (menu && !SB.current) { e.preventDefault(); SB.pendingCat = menu.getAttribute('data-menu-cat') || ''; openChooser(); return; }
    if (switcher && !switcher.hidden && !t.closest('[data-switcher]')) closeSwitcher();
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (switcher && !switcher.hidden) { closeSwitcher(); var b = d.querySelector('.nav [data-switch-toggle]'); if (b) b.focus(); }
      closeDrawer();
    }
  });
  addEventListener('resize', function () { if (innerWidth >= 1000) closeDrawer(); else closeSwitcher(); }, { passive: true });

  /* ---------- age gate ---------- */
  var gate = d.querySelector('[data-agegate]');
  if (gate) {
    if (html.classList.contains('age-pending')) { var y = gate.querySelector('[data-age-yes]'); if (y) setTimeout(function () { y.focus({ preventScroll: true }); }, 60); }
    gate.addEventListener('click', function (e) {
      if (e.target.closest('[data-age-yes]')) { store('sbshop-age-ok', '1'); html.classList.remove('age-pending'); var m = d.getElementById('main'); if (m) m.focus({ preventScroll: true }); }
      if (e.target.closest('[data-age-no]')) { var msg = gate.querySelector('[data-age-msg]'); if (msg) msg.hidden = false; }
    });
    gate.addEventListener('keydown', function (e) { // keep focus inside the dialog while it is open
      if (e.key !== 'Tab' || !html.classList.contains('age-pending')) return;
      var f = $$('button, a[href]', gate); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- tabs ---------- */
  $$('[data-tabs]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = d.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0];
        if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    if (SB.current) { var match = tabs.filter(function (t) { return t.getAttribute('data-tab-state') === SB.current.state; })[0]; if (match) initial = match; }
    if (initial) select(initial);
  });

  /* ---------- reveals ---------- */
  var revealEls = $$('[data-reveal], [data-stagger]');
  $$('[data-stagger]').forEach(function (p) { Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); }); });
  if (!('IntersectionObserver' in window) || reduce) revealEls.forEach(function (el) { el.classList.add('is-in'); });
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting || en.boundingClientRect.bottom < 0) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { if (el.getBoundingClientRect().bottom < 0) el.classList.add('is-in'); else io.observe(el); });
  }

  /* ---------- parallax ---------- */
  var layers = reduce ? [] : $$('[data-depth]').map(function (el) { return { el: el, depth: parseFloat(el.getAttribute('data-depth')) || 0, base: 0, h: 0 }; });
  function measure() {
    var sy = scrollY;
    layers.forEach(function (l) {
      var cur = parseFloat(l.el.style.getPropertyValue('--py')) || 0;
      var r = l.el.getBoundingClientRect();
      l.base = r.top + sy - cur; l.h = r.height;
    });
  }
  var ticking = false;
  function frame() {
    ticking = false;
    var sy = scrollY, vh = innerHeight, mid = sy + vh / 2;
    layers.forEach(function (l) {
      if (l.base + l.h < sy - 300 || l.base > sy + vh + 300) return;
      var y = (l.base + l.h / 2 - mid) * -l.depth;
      y = Math.max(-80, Math.min(80, y));
      l.el.style.setProperty('--py', y.toFixed(1) + 'px');
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    var h = d.querySelector('[data-header]');
    if (h) h.classList.toggle('is-scrolled', scrollY > 8);
  }
  if (layers.length) {
    measure(); frame();
    addEventListener('resize', function () { measure(); frame(); }, { passive: true });
    addEventListener('load', function () { measure(); frame(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- tilt ---------- */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 6;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * max * 2).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- background videos: paused off-screen, never under reduced motion ---------- */
  $$('video.bg-video').forEach(function (v) {
    if (reduce) { v.pause(); v.removeAttribute('autoplay'); return; }
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) play(); else v.pause(); }); }, { threshold: 0.01 }).observe(v);
    } else play();
  });
})();
