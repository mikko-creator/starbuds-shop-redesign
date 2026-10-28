// shell.mjs - page shell (FOUNDATION; revision 2 architecture, revision 3 "Starlight" look): head, promo bar with
// "Pick up at" (the store switcher), a frosted-glass sticky header with the main nav in that site's order (Shop, Explore,
// Rewards, Resources, Dispensaries) and three frosted mega menus, the phone drawer (the megas as accordions) over the
// night sky, age gate (a glass card over the sky), footer (its column structure, Star Buds items), scripts. The nav and
// footer data live in src/content/ia.json (docs/REVISION-2.md).
// Page modules call page({ title, description, body, bodyClass, ctx, path, head, scripts, crumbs }) and use the helpers
// re-exported from util.mjs. API: docs/DESIGN.md.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { esc, attrs, cx, uid, icon, btn, img, picture, imgUrl, glass, patch, sticker, seal, starburst, rocker, emblem, halftone, leaves, grain, cutout, patchCut, seam, pinstripe, marquee, reveal, menuAttrs, storeLinkAttrs, storeLabel, liveMenu, crumbs, hubHero, cardGrid, articleCard, fmtDate, stateSlug, sky, spark, RETIRED_ART, isRetiredArt } from './util.mjs';

export { esc, attrs, cx, uid, icon, btn, img, picture, imgUrl, glass, patch, sticker, seal, starburst, rocker, emblem, halftone, leaves, grain, cutout, patchCut, seam, pinstripe, marquee, reveal, menuAttrs, storeLinkAttrs, storeLabel, liveMenu, crumbs, hubHero, cardGrid, articleCard, fmtDate, stateSlug, sky, spark, RETIRED_ART, isRetiredArt };

export const CSS_ORDER = ['tokens', 'base', 'components', 'motion', 'home', 'finder', 'faq', 'stores', 'states', 'content', 'resources', 'blog', 'mobile'];

// ---------- IA data (src/content/ia.json + the files other lanes write), read once per build ----------
/** read src/content/<rel> as JSON; null when it does not exist (other lanes write some of these files) */
export function readContent(rel) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content', rel), 'utf8')); } catch (e) {
    if (e.code !== 'ENOENT') console.warn(`warning: src/content/${rel} unreadable: ${e.message}`);
    return null;
  }
}
const assetExists = (src) => typeof src === 'string' && src.startsWith('/assets/') && fs.existsSync(path.join(ROOT, src.slice(1).split(/[?#]/)[0]));
const internal = (h) => typeof h === 'string' && /^\/(?!\/)/.test(h);

/** the newest posts of src/content/blog/index.json (BLOG-R2), newest first; [] when absent */
export function latestPosts(n = 3) {
  const idx = readContent('blog/index.json');
  const posts = (idx && Array.isArray(idx.posts) ? idx.posts : []).filter((p) => p && p.title && internal(p.href));
  return posts.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, n);
}

let IA = null;
/** the resolved navigation: ia.json with its "from" groups filled (categories, product guides, vibes, stores, latest post) */
export function navData(ctx) {
  if (IA) return IA;
  const raw = readContent('ia.json');
  if (!raw) throw new Error('src/content/ia.json is missing (FOUNDATION-R2 nav data)');
  const site = ctx.site;
  const products = readContent('resources/products.json');
  const vibes = readContent('blog/vibes.json');
  const latest = latestPosts(1)[0] || null;
  const fill = (g) => {
    if (g.from === 'site.categories') return { ...g, items: (site.categories || []).map((c) => ({ label: c.label, menuCat: c.slug, cutout: c.cutout })) };
    if (g.from === 'resources/products.json') {
      const guides = (products && Array.isArray(products.guides) ? products.guides : []).filter((x) => x && x.label && internal(x.href) && x.href !== '/products/');
      return { ...g, items: [...(g.lead ? [g.lead] : []), ...guides.map((x) => ({ label: x.label, href: x.href }))], live: !!products };
    }
    if (g.from === 'blog/vibes.json') {
      const items = (vibes && Array.isArray(vibes.items) ? vibes.items : []).filter((x) => x && x.label && internal(x.href));
      return { ...g, items: items.length ? items.map((x) => ({ label: x.label, href: x.href, note: x.title || '' })) : (g.fallback || []), note: items.length ? g.note : '', live: items.length > 0 };
    }
    if (g.from === 'site.storesByState') {
      return { ...g, states: ctx.storesByState.map(({ state, stores }) => ({ name: state.name, code: state.code, hub: (g.hubHref || '/dispensaries/{state}/').replace('{state}', stateSlug(state.name)), stores: stores.map((s) => ({ label: s.city, href: `/stores/${s.slug}/`, slug: s.slug })) })) };
    }
    return { ...g, items: g.items || [] };
  };
  const feature = (f) => {
    if (!f) return null;
    if (f.from === 'blog/index.json') {
      if (!latest) return { ...f, ...f.fallback, eyebrow: f.eyebrow };
      const image = latest.image && assetExists(latest.image.src) ? latest.image : null;
      return { ...f, title: latest.title, href: latest.href, text: latest.categoryLabel ? `${latest.categoryLabel}${latest.date ? ' · ' + fmtDate(latest.date) : ''}` : fmtDate(latest.date), image };
    }
    const out = { ...f };
    if (f.titleFrom === 'site.promo.text') out.title = site.promo?.text || 'Shop Our Special Offers';
    if (f.textFrom === 'site.dealsIntro.subtitle') out.text = site.dealsIntro?.subtitle || '';
    if (f.id === undefined && f.href === '/dispensaries/' && !f.text) {
      const n = ctx.stores.length, st = ctx.storesByState.map((g) => g.state.name);
      out.text = `${n} ${n === 1 ? 'store' : 'stores'} in ${st.length < 2 ? st.join('') : st.slice(0, -1).join(', ') + ' and ' + st[st.length - 1]}`;
    }
    return out;
  };
  IA = {
    promo: raw.promo || {},
    nav: (raw.nav || []).map((n) => (n.mega ? { ...n, mega: { feature: feature(n.mega.feature), groups: (n.mega.groups || []).map(fill) } } : n)),
    footer: raw.footer || {},
    sources: { products: !!products, vibes: !!(vibes && (vibes.items || []).length), blogIndex: !!latest },
  };
  return IA;
}

/** which top-level nav entry a path belongs to (for the active state of the mega buttons) */
const SECTION_OF = [
  ['explore', /^\/(deals|products)\//],
  ['rewards', /^\/rewards\//],
  ['resources', /^\/(dispensary-guides|getting-a-medical-card|cannabis-laws-by-state|blog|patient-guide)\//],
  ['dispensaries', /^\/(dispensaries|stores)\//],
];
const sectionOf = (p) => (SECTION_OF.find(([, re]) => re.test(p || '')) || [''])[0];

// ---------- link + group renderers (shared by the desktop megas and the phone accordions) ----------
function linkAttrs(it, path) {
  const a = it.menuCat != null ? menuAttrs(it.menuCat) : { href: it.href };
  if (it.external) Object.assign(a, { target: '_blank', rel: 'noopener' });
  if (!it.external && it.href && it.href === path) a['aria-current'] = 'page';
  return a;
}
function mmLink(it, path, { thumbs = false } = {}) {
  // a category whose cut-out is retired art (Apparel = 'patch-leaf' in site.json) shows a star sparkle in the halo
  const thumb = thumbs && it.cutout ? `<span class="${cx('mm-link__thumb', isRetiredArt(it.cutout) && 'mm-link__thumb--spark')}" aria-hidden="true">${isRetiredArt(it.cutout) ? spark({ size: 'sm', cls: 'mm-link__spark' }) : img(it.cutout, { alt: '', sizes: '44px', cls: 'mm-link__img' })}</span>` : '';
  return `<a class="${cx('mm-link', thumb && 'mm-link--thumb')}"${attrs(linkAttrs(it, path))}>${thumb}<span class="mm-link__text"><span class="mm-link__label">${esc(it.label)}</span>${it.note ? `<span class="mm-link__note">${esc(it.note)}</span>` : ''}</span>${it.external ? icon('external', 'mm-link__ext') : ''}</a>`;
}
function mmGroup(g, idp, path) {
  if (g.states) {
    return g.states.map((s) => `
          <div class="mm-group mm-group--state">
            <a class="mm-state" href="${esc(s.hub)}"${s.hub === path ? ' aria-current="page"' : ''}><span class="mm-state__name" aria-hidden="true">${spark({ size: 'xs', cls: 'mm-state__spark' })}${esc(s.name)}</span><span class="mm-state__label"><span class="sr-only">${esc(s.name)} </span>Dispensaries${icon('arrow')}</span></a>
            <ul class="mm-group__list" role="list" aria-label="${esc(s.name)} stores">${s.stores.map((it) => `<li>${mmLink(it, path)}</li>`).join('')}</ul>
          </div>`).join('');
  }
  if (!g.items.length) return '';
  const hid = `${idp}-${g.id}`;
  return `
          <div class="${cx('mm-group', 'mm-group--' + g.id)}">
            <p class="mm-group__head" id="${hid}">${spark({ size: 'xs', cls: 'mm-group__spark' })}<span class="mm-group__label">${esc(g.heading)}</span></p>
            ${g.note ? `<p class="mm-group__note">${esc(g.note)}</p>` : ''}
            <ul class="${cx('mm-group__list', g.id === 'categories' && 'mm-group__list--cats')}" role="list" aria-labelledby="${hid}">${g.items.map((it) => `<li>${mmLink(it, path, { thumbs: g.id === 'categories' })}</li>`).join('')}</ul>
          </div>`;
}
function mmFeature(f) {
  if (!f || !f.href) return '';
  const retired = isRetiredArt(f.art || '');
  // a tile that shows a post photo carries no extra art (it would sit on the title); retired art = a star cluster
  const art = f.art && !f.image
    ? (retired
      ? `<span class="mm-feature__art mm-feature__art--spark" aria-hidden="true">${spark({ size: 'lg', cls: 'mm-feature__spark mm-feature__spark--a' })}${spark({ size: 'sm', cls: 'mm-feature__spark mm-feature__spark--b' })}${spark({ size: 'xs', cls: 'mm-feature__spark mm-feature__spark--c' })}</span>`
      : `<span class="mm-feature__art" aria-hidden="true">${img(f.art, { alt: '', sizes: '200px', cls: 'mm-feature__art-img float float--slow' })}</span>`)
    : '';
  const photo = f.image ? `<span class="mm-feature__photo">${img(f.image, { alt: '', sizes: '320px', cls: 'mm-feature__photo-img' })}</span>` : '';
  return `
          <a class="${cx('mm-feature', photo && 'mm-feature--photo')}" href="${esc(f.href)}">
            <span class="mm-feature__glow" aria-hidden="true"></span>
            ${photo}${art}
            <span class="mm-feature__body">
              ${f.eyebrow ? `<span class="mm-feature__eyebrow">${patch(f.eyebrow, { tone: f.eyebrow === 'Deals' ? 'red' : 'green', size: 'sm', icon: f.eyebrow === 'Deals' ? 'tag' : undefined })}</span>` : ''}
              <span class="mm-feature__title">${esc(f.title || '')}</span>
              ${f.text ? `<span class="mm-feature__text">${esc(f.text)}</span>` : ''}
              <span class="mm-feature__cta">${esc(f.cta || 'Open')}${icon('arrow')}</span>
            </span>
          </a>`;
}
/** the desktop mega panel of one nav entry */
function megaPanel(n, path) {
  const idp = 'mm-' + n.id;
  const feat = mmFeature(n.mega.feature);
  const groups = n.mega.groups.map((g) => mmGroup(g, idp, path)).join('');
  const first = n.id === 'explore'; // the large operator's Explore opens on Deals: the feature tile leads there
  return `
      <div class="${cx('mm-menu', 'mm-menu--' + n.id)}" id="${idp}" data-mega-panel hidden>
        <div class="mm-menu__panel">
          ${sky({ stars: 'faint', aurora: n.id === 'explore' ? 'green' : n.id === 'resources' ? 'violet' : 'teal', cls: 'mm-menu__sky' })}
          <div class="mm-menu__grid">${first ? feat : ''}
            <div class="mm-menu__groups">${groups}
            </div>${first ? '' : feat}
          </div>
          ${n.href ? `<div class="mm-menu__foot"><a class="mm-menu__all" href="${esc(n.href)}">${n.id === 'dispensaries' ? 'All locations' : 'All ' + esc(n.label)}${icon('arrow')}</a></div>` : ''}
        </div>
      </div>`;
}
/** the phone accordion body of one nav entry (same items, compact) */
function accPanel(n, path) {
  const idp = 'dr-' + n.id;
  const f = n.mega.feature;
  const lead = f && f.href ? `<a class="mm-acc__lead" href="${esc(f.href)}">${esc(n.id === 'explore' ? 'Deals' : n.id === 'dispensaries' ? 'All locations' : f.title || f.cta)}${icon('arrow')}</a>` : '';
  const groups = n.mega.groups.map((g) => {
    if (g.states) {
      return g.states.map((s) => `
            <div class="mm-acc__group">
              <p class="mm-acc__head"><a href="${esc(s.hub)}">${esc(s.name)}${icon('arrow')}</a></p>
              <ul class="mm-acc__list mm-acc__list--cols" role="list" aria-label="${esc(s.name)} stores">${s.stores.map((it) => `<li><a${attrs(linkAttrs(it, path))}>${esc(it.label)}</a></li>`).join('')}</ul>
            </div>`).join('');
    }
    if (!g.items.length) return '';
    const hid = `${idp}-${g.id}`;
    return `
            <div class="mm-acc__group">
              <p class="mm-acc__head" id="${hid}">${esc(g.heading)}</p>
              <ul class="${cx('mm-acc__list', g.items.length > 4 && g.id !== 'vibes' && 'mm-acc__list--cols')}" role="list" aria-labelledby="${hid}">${g.items.map((it) => `<li><a${attrs(linkAttrs(it, path))}>${esc(it.label)}${it.external ? icon('external') : ''}</a></li>`).join('')}</ul>
            </div>`;
  }).join('');
  return `<div class="mm-acc__panel" id="${idp}" hidden>${n.id === 'dispensaries' ? '' : lead}${groups}${n.id === 'dispensaries' ? lead : ''}</div>`;
}

function storeGroups(ctx, { cls = 'switcher', pick = true } = {}) {
  return ctx.storesByState.map(({ state, stores }) => `
      <div class="${cls}__group">
        <p class="${cls}__state">${esc(state.name)}</p>
        <ul class="${cls}__list" role="list">${stores.map((s) => `
          <li><a class="${cls}__store" href="/stores/${esc(s.slug)}/"${pick ? ` data-store-pick="${esc(s.slug)}"` : ''}><span class="${cls}__code">${esc(s.state)}:</span> ${esc(s.city)}</a></li>`).join('')}
        </ul>
      </div>`).join('');
}

function header(ctx, path) {
  const site = ctx.site;
  const I = navData(ctx);
  const sec = sectionOf(path);
  const navItems = I.nav.map((n) => {
    if (n.mega) {
      return `
        <li class="nav__item mm-item" data-mega-item>
          <button type="button" class="${cx('nav__link', 'mm-toggle', sec === n.id && 'is-active')}" aria-expanded="false" aria-controls="mm-${esc(n.id)}" data-mega-toggle>${esc(n.label)}${icon('chevron', 'nav__chev')}</button>${megaPanel(n, path)}
        </li>`;
    }
    const a = n.menuCat != null ? menuAttrs(n.menuCat) : { href: n.href };
    if (n.href && n.href === path) a['aria-current'] = 'page';
    return `
        <li class="nav__item"><a class="${cx('nav__link', sec === n.id && n.menuCat == null && 'is-active')}"${attrs(a)}>${esc(n.label)}</a></li>`;
  }).join('');
  const drawerNav = I.nav.map((n) => {
    if (n.mega) {
      return `
        <li class="mm-acc"><button type="button" class="drawer__link mm-acc__btn" aria-expanded="false" aria-controls="dr-${esc(n.id)}" data-acc>${esc(n.label)}<span class="mm-acc__sign" aria-hidden="true"></span></button>${accPanel(n, path)}</li>`;
    }
    const a = n.menuCat != null ? menuAttrs(n.menuCat) : { href: n.href };
    return `
        <li><a class="drawer__link"${attrs(a)}>${esc(n.label)}</a></li>`;
  }).join('');
  const pickLabel = I.promo.pickLabel || 'Pick up at';
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="promo">
    <div class="sb-promo">
      <a class="promo__link" href="${esc(I.promo.href || site.promo?.href || '/deals/')}"><span class="promo__rule" aria-hidden="true"></span>${icon('star', 'promo__star')}<span>${esc(I.promo.text || site.promo?.text || 'Shop Our Special Offers')}</span>${icon('star', 'promo__star')}<span class="promo__rule" aria-hidden="true"></span></a>
      <button type="button" class="sb-pick" data-switch-toggle aria-controls="store-switcher" aria-expanded="false">${icon('pin', 'sb-pick__pin')}<span class="sb-pick__label">${esc(pickLabel)}</span><span class="sb-pick__store" data-store-label>Choose your location</span>${icon('chevron', 'sb-pick__chev')}</button>
    </div>
  </div>
  <header class="site-header" data-header>
    <div class="site-header__inner">
      <a class="brand" href="/" aria-label="${esc(site.brand?.name || 'Star Buds')} home">
        <img class="brand__logo" src="${esc(site.brand?.logoOnDark || '/assets/brand/logo-on-dark.png')}" width="1417" height="430" alt="${esc(site.brand?.name || 'Star Buds')}">
      </a>
      <nav class="nav" aria-label="Main">
        <ul class="nav__list" role="list">${navItems}
        </ul>
      </nav>
      <div class="header-actions">
        <button type="button" class="store-chip" data-switch-toggle aria-controls="store-switcher" aria-expanded="false">${icon('pin', 'store-chip__pin')}<span class="store-chip__text" data-store-label>Choose your location</span>${icon('chevron', 'store-chip__chev')}</button>
        ${btn('Shop now', menuAttrs('').href, { variant: 'gold', size: 'sm', icon: 'bag', cls: 'header-actions__shop', attrs: { 'data-menu-cat': '' } })}
        <button type="button" class="burger" data-drawer-toggle aria-controls="drawer" aria-expanded="false"><span class="sr-only">Menu</span><span class="burger__bars" aria-hidden="true"></span></button>
      </div>
    </div>
    <div class="switcher" id="store-switcher" data-switcher hidden>
      <div class="switcher__panel glass">
        <div class="switcher__head">
          <p class="switcher__title">${esc(pickLabel)}</p>
          <p class="switcher__current" data-store-current hidden>Shopping at <strong data-store-label></strong></p>
          <p class="switcher__hint" data-switcher-hint hidden>Pick a store to open its live menu.</p>
        </div>
        <div class="switcher__groups">${storeGroups(ctx)}
        </div>
        <div class="switcher__foot"><a class="switcher__all" href="/dispensaries/">All locations${icon('arrow')}</a></div>
      </div>
    </div>
  </header>
  <div class="drawer" id="drawer" data-drawer hidden>
    ${sky({ stars: true, aurora: true, cls: 'drawer__sky' })}
    <div class="drawer__panel">
      <nav aria-label="Main (menu)"><ul class="drawer__nav" role="list">${drawerNav}
      </ul></nav>
      <div class="drawer__stores">
        <p class="drawer__title">${esc(pickLabel)}</p>
        ${storeGroups(ctx, { cls: 'switcher' })}
      </div>
      ${btn('Shop now', menuAttrs('').href, { variant: 'gold', icon: 'bag', cls: 'drawer__shop', attrs: { 'data-menu-cat': '' } })}
    </div>
  </div>`;
}

function ageGate(ctx) {
  const g = ctx.site.ageGate || {};
  const est = ctx.site.brand?.est || '2013';
  return `
  <div class="agegate" data-agegate role="dialog" aria-modal="true" aria-labelledby="agegate-title" aria-describedby="agegate-body">
    <div class="agegate__veil">${sky({ stars: true, aurora: true, cls: 'agegate__sky' })}</div>
    <div class="agegate__panel glass">
      ${emblem({ top: ctx.site.brand?.name || 'Star Buds', bottom: 'Est. ' + est, star: ctx.site.brand?.star || '/assets/brand/star-on-dark.png', cls: 'agegate__emblem' })}
      <p class="agegate__title" id="agegate-title">${esc(g.title || 'Are you 21 years of age or older?')}</p>
      ${pinstripe({ cls: 'agegate__rule' })}
      <p class="agegate__body" id="agegate-body">${esc(g.body || '')}</p>
      <div class="agegate__actions">
        ${btn(g.yes || 'Yes', null, { variant: 'gold', icon: false, attrs: { 'data-age-yes': '' } })}
        ${btn(g.no || 'No', null, { variant: 'ghost', icon: false, attrs: { 'data-age-no': '' } })}
      </div>
      <p class="agegate__no" data-age-msg hidden role="status">Sorry, you can't enter this site.</p>
    </div>
  </div>`;
}

function footer(ctx, path) {
  const site = ctx.site;
  const I = navData(ctx);
  const est = site.brand?.est || '2013';
  const F = I.footer;
  const col = (c, cls) => (c && (c.items || []).length ? `
      <nav class="${cx('footer-col', cls)}" aria-label="${esc(c.heading)}">
        <p class="footer__heading">${esc(c.heading)}</p>
        <ul role="list">${c.items.map((it) => `<li><a${attrs(linkAttrs(it, path))}>${esc(it.label)}</a></li>`).join('')}</ul>
      </nav>` : '');
  const social = (F.social || []).filter((s) => s && s.href && s.label);
  const legal = (site.legal || []).filter((l) => !/eula/i.test(l.label)); // EULA is a page of its own now (/eula/)
  return `
  <footer class="site-footer">
    ${sky({ stars: 'faint', aurora: true, cls: 'site-footer__sky' })}
    ${seam({ cls: 'site-footer__seam' })}
    <div class="site-footer__inner sb-foot">
      <div class="footer-brand">
        <a href="/" class="footer-brand__logo"><img src="${esc(site.brand?.logoOnDark || '/assets/brand/logo-on-dark.png')}" width="1417" height="430" alt="${esc(site.brand?.name || 'Star Buds')}" loading="lazy" decoding="async"></a>
        ${site.brand?.tagline ? `<p class="footer-brand__tag">${esc(site.brand.tagline)}</p>` : ''}
        <div class="footer-apps">
          <p class="footer__heading">Get the app</p>
          ${site.apps?.ios ? btn('App Store', site.apps.ios, { variant: 'ghost', size: 'sm', icon: 'phoneApp', attrs: { rel: 'noopener', target: '_blank' } }) : ''}
          ${site.apps?.android ? btn('Google Play', site.apps.android, { variant: 'ghost', size: 'sm', icon: 'phoneApp', attrs: { rel: 'noopener', target: '_blank' } }) : ''}
        </div>
      </div>
      <div class="footer-col sb-foot__store">
        <p class="footer__heading">${esc(I.promo.pickLabel || 'Pick up at')}</p>
        <div class="sb-foot__card" data-store-current hidden>
          <p class="sb-foot__name" data-store-field="name"></p>
          <p class="sb-foot__addr" data-store-field="address"></p>
          <p class="sb-foot__links"><a data-store-tel hidden href="#main">${icon('phone')}<span data-store-field="phone"></span></a><a data-store-map hidden href="#main" target="_blank" rel="noopener">${icon('directions')}Directions</a></p>
          <p class="sb-foot__links"><a href="/dispensaries/" data-store-link>${icon('pin')}View store</a><button type="button" class="sb-foot__change" data-switch-toggle aria-controls="store-switcher" aria-expanded="false">Change store</button></p>
        </div>
        <div class="sb-foot__none" data-store-none>
          <p class="sb-foot__hint">Choose your location to see its address and open its live menu.</p>
          ${btn('Choose your location', null, { variant: 'ghost', size: 'sm', icon: 'pin', attrs: { 'data-switch-toggle': '', 'aria-controls': 'store-switcher', 'aria-expanded': 'false' } })}
        </div>
      </div>
      ${col(F.main, 'sb-foot__main')}
      ${col(F.more, 'sb-foot__more')}
      ${social.length ? `<div class="footer-col sb-foot__social"><p class="footer__heading">Follow</p><ul role="list">${social.map((s) => `<li><a href="${esc(s.href)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul></div>` : ''}
    </div>
    <div class="site-footer__mark" aria-hidden="true"><span class="site-footer__flourish"></span><img class="site-footer__star" src="${esc(site.brand?.star || '/assets/brand/star-on-dark.png')}" width="256" height="256" alt="" loading="lazy" decoding="async"><span class="site-footer__est">Est. ${esc(est)}</span><span class="site-footer__flourish site-footer__flourish--end"></span></div>
    <div class="site-footer__legal">
      <div class="sb-foot__fine">
        ${site.ageGate?.body ? `<p class="sb-foot__age">${patch('21+', { tone: 'red', size: 'sm' })}<span>${esc(site.ageGate.body)}</span></p>` : ''}
        <p class="site-footer__fine">${esc(site.brand?.name || 'Star Buds')} · EST. ${esc(est)} · Redesign concept: menus and checkout open the live Star Buds shop. Product and backdrop imagery on this site is AI-generated and illustrative.</p>
      </div>
      <ul class="site-footer__legal-links" role="list">${legal.map((l) => `<li><a href="${esc(l.href)}" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>
    </div>
  </footer>`;
}

/** JSON the client script needs on every page (store list for the switcher and live-menu rewriting) */
function clientData(ctx) {
  const data = {
    shop: ctx.site.shopOrigin || 'https://shop.starbuds.us',
    stores: ctx.stores.map((s) => ({ slug: s.slug, state: s.state, city: s.city, name: s.name, address: s.address || [], phone: s.phone || '', tel: s.tel || '', mapUrl: s.mapUrl || '', liveUrl: s.liveUrl || '', menuNoCats: !!s.menuNoCats })),
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const HEAD_SCRIPT = `(function(d){var h=d.documentElement;h.classList.add('js');try{if(localStorage.getItem('sbshop-age-ok')!=='1')h.classList.add('age-pending')}catch(e){h.classList.add('age-pending')}setTimeout(function(){if(!window.SB_READY)h.classList.add('reveal-all')},2500)})(document);`;

/**
 * page({ title, description, body, bodyClass, ctx, path, head, scripts, crumbs }) -> full HTML document.
 *  title: page title (" | Star Buds" is appended unless it already contains "Star Buds"); description: meta description;
 *  body: the <main> inner HTML (must contain exactly one <h1>); bodyClass: e.g. 'page-store'; path: the page URL path;
 *  head: extra raw HTML for <head> (optional); scripts: extra deferred files from src/scripts, e.g. ['finder.js'];
 *  crumbs (optional, revision 2): crumbs() items, rendered in a thin bar at the top of <main> (pages built on hubHero()
 *  pass them to hubHero instead).
 */
export function page({ title, description = '', body, bodyClass = '', ctx, path = '/', head = '', scripts = [], crumbs: trail = null }) {
  if (!ctx) throw new Error('page(): ctx is required');
  const full = /star buds/i.test(title) ? title : `${title} | ${ctx.site.brand?.name || 'Star Buds'}`;
  const css = ctx.cssFiles.map((f) => `<link rel="stylesheet" href="/assets/css/${f}.css">`).join('\n  ');
  const bar = trail && trail.length ? `<div class="sb-crumbbar"><div class="wrap">${crumbs(trail)}</div></div>\n` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(full)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#060918">
  <meta name="color-scheme" content="dark">
  <meta property="og:title" content="${esc(full)}">
  <meta property="og:description" content="${esc(description)}">
  <link rel="icon" type="image/png" href="/assets/brand/favicon.png">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/Manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  ${css}
  <script>${HEAD_SCRIPT}</script>
  <script src="/assets/js/site.js" defer></script>
  ${scripts.map((f) => `<script src="/assets/js/${esc(f)}" defer></script>`).join('\n  ')}
  ${head}
</head>
<body class="${esc(cx('pg', bodyClass))}">
  <div class="sb-meteors" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  ${header(ctx, path)}
  <main id="main" tabindex="-1">
${bar}${body}
  </main>
  ${footer(ctx, path)}
  ${ageGate(ctx)}
  <script type="application/json" id="sb-data">${clientData(ctx)}</script>
</body>
</html>
`;
}
