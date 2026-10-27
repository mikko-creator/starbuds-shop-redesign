// shell.mjs - page shell (FOUNDATION): head, promo bar, sticky header + Locations switcher, mobile drawer, age gate,
// footer, scripts. Page modules call page({ title, description, body, bodyClass, ctx, path }) and use the helpers
// re-exported from util.mjs. API: docs/DESIGN.md.
import { esc, attrs, cx, icon, btn, img, picture, imgUrl, glass, sticker, starburst, halftone, leaves, cutout, seam, marquee, reveal, menuAttrs, storeLinkAttrs, storeLabel, liveMenu } from './util.mjs';

export { esc, attrs, cx, icon, btn, img, picture, imgUrl, glass, sticker, starburst, halftone, leaves, cutout, seam, marquee, reveal, menuAttrs, storeLinkAttrs, storeLabel, liveMenu };

export const CSS_ORDER = ['tokens', 'base', 'components', 'motion', 'home', 'stores', 'content'];

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
  const cur = (href) => (href.split('#')[0] === path && !href.includes('#') ? ' aria-current="page"' : '');
  const navItems = (site.nav || []).map((n) => n.switcher
    ? `<li class="nav__item nav__item--switch"><a class="nav__link" href="${esc(n.href)}" data-switch-toggle aria-controls="store-switcher" aria-expanded="false" aria-haspopup="true"${cur(n.href)}>${esc(n.label)}${icon('chevron', 'nav__chev')}</a></li>`
    : `<li class="nav__item"><a class="nav__link" href="${esc(n.href)}"${cur(n.href)}>${esc(n.label)}</a></li>`).join('');
  const drawerNav = (site.nav || []).filter((n) => !n.switcher).map((n) => `<li><a class="drawer__link" href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('');
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="promo">
    <a class="promo__link" href="${esc(site.promo?.href || '/deals/')}">${icon('star', 'promo__star')}<span>${esc(site.promo?.text || 'Shop Our Special Offers')}</span>${icon('arrow', 'promo__arrow')}</a>
  </div>
  <header class="site-header" data-header>
    <div class="site-header__inner">
      <a class="brand" href="/" aria-label="${esc(site.brand?.name || 'Star Buds')} home">
        <img class="brand__logo" src="${esc(site.brand?.logo || '/assets/brand/logo.png')}" width="1417" height="430" alt="${esc(site.brand?.name || 'Star Buds')}">
      </a>
      <nav class="nav" aria-label="Main">
        <ul class="nav__list" role="list">${navItems}</ul>
      </nav>
      <div class="header-actions">
        <button type="button" class="store-chip" data-switch-toggle aria-controls="store-switcher" aria-expanded="false">${icon('pin', 'store-chip__pin')}<span class="store-chip__text" data-store-label>Choose your location</span>${icon('chevron', 'store-chip__chev')}</button>
        ${btn('Shop now', menuAttrs('').href, { variant: 'primary', size: 'sm', icon: 'bag', cls: 'header-actions__shop', attrs: { 'data-menu-cat': '' } })}
        <button type="button" class="burger" data-drawer-toggle aria-controls="drawer" aria-expanded="false"><span class="sr-only">Menu</span><span class="burger__bars" aria-hidden="true"></span></button>
      </div>
    </div>
    <div class="switcher" id="store-switcher" data-switcher hidden>
      <div class="switcher__panel glass glass--pop">
        <div class="switcher__head">
          <p class="switcher__title">Choose your location</p>
          <p class="switcher__current" data-store-current hidden>Shopping at <strong data-store-label></strong></p>
          <p class="switcher__hint" data-switcher-hint hidden>Pick a store to open its live menu.</p>
        </div>
        <div class="switcher__groups">${storeGroups(ctx)}
        </div>
        <div class="switcher__foot"><a class="switcher__all" href="/stores/">All locations${icon('arrow')}</a></div>
      </div>
    </div>
  </header>
  <div class="drawer" id="drawer" data-drawer hidden>
    <div class="drawer__panel">
      <ul class="drawer__nav" role="list">${drawerNav}<li><a class="drawer__link" href="/stores/">Locations</a></li></ul>
      <div class="drawer__stores">
        <p class="drawer__title">Choose your location</p>
        ${storeGroups(ctx, { cls: 'switcher' })}
      </div>
      ${btn('Shop now', '/stores/', { variant: 'pop', icon: 'bag', cls: 'drawer__shop', attrs: { 'data-menu-cat': '' } })}
    </div>
  </div>`;
}

function ageGate(ctx) {
  const g = ctx.site.ageGate || {};
  return `
  <div class="agegate" data-agegate role="dialog" aria-modal="true" aria-labelledby="agegate-title" aria-describedby="agegate-body">
    <div class="agegate__veil">${halftone({ color: 'yellow', at: 'tl' })}${halftone({ color: 'pink', at: 'br' })}</div>
    <div class="agegate__panel glass glass--pop">
      ${starburst({ label: '21+', color: 'yellow', cls: 'agegate__burst' })}
      <img class="agegate__logo" src="${esc(ctx.site.brand?.logo || '/assets/brand/logo.png')}" width="1417" height="430" alt="${esc(ctx.site.brand?.name || 'Star Buds')}">
      <p class="agegate__title" id="agegate-title">${esc(g.title || 'Are you 21 years of age or older?')}</p>
      <p class="agegate__body" id="agegate-body">${esc(g.body || '')}</p>
      <div class="agegate__actions">
        ${btn(g.yes || 'Yes', null, { variant: 'primary', icon: false, attrs: { 'data-age-yes': '' } })}
        ${btn(g.no || 'No', null, { variant: 'ghost', icon: false, attrs: { 'data-age-no': '' } })}
      </div>
      <p class="agegate__no" data-age-msg hidden role="status">Sorry, you can't enter this site.</p>
    </div>
  </div>`;
}

function footer(ctx) {
  const site = ctx.site;
  const quick = [['Shop All', '/#shop'], ['Deals', '/deals/'], ['Higher Rewards', '/rewards/'], ['Locations', '/stores/']];
  return `
  <footer class="site-footer">
    ${leaves({ tone: 'dark', cls: 'site-footer__leaves' })}
    ${halftone({ color: 'lime', at: 'tr' })}
    <div class="site-footer__inner">
      <div class="footer-brand">
        <a href="/" class="footer-brand__logo"><img src="${esc(site.brand?.logoOnDark || '/assets/brand/logo-on-dark.png')}" width="1417" height="430" alt="${esc(site.brand?.name || 'Star Buds')}" loading="lazy" decoding="async"></a>
        ${sticker('EST. ' + (site.brand?.est || '2013'), { color: 'yellow', tilt: -5, cls: 'footer-brand__est' })}
        <p class="footer-brand__store" data-store-current hidden>${icon('pin')} Shopping at <strong data-store-label></strong> <a href="/stores/" data-store-link>View store</a></p>
        <div class="footer-apps">
          <p class="footer__heading">Get the app</p>
          ${site.apps?.ios ? btn('App Store', site.apps.ios, { variant: 'light', size: 'sm', icon: 'phoneApp', attrs: { rel: 'noopener', target: '_blank' } }) : ''}
          ${site.apps?.android ? btn('Google Play', site.apps.android, { variant: 'light', size: 'sm', icon: 'phoneApp', attrs: { rel: 'noopener', target: '_blank' } }) : ''}
        </div>
      </div>
      <nav class="footer-col" aria-label="Quick links">
        <p class="footer__heading">Quick Links</p>
        <ul role="list">${quick.map(([l, h]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ul>
      </nav>
      <nav class="footer-col" aria-label="Shop categories">
        <p class="footer__heading">Shop</p>
        <ul role="list">${(site.categories || []).map((c) => `<li><a${attrs(menuAttrs(c.slug))}>${esc(c.label)}</a></li>`).join('')}</ul>
      </nav>
      <div class="footer-col footer-col--stores">
        <p class="footer__heading">Locations</p>
        ${ctx.storesByState.map(({ state, stores }) => `<div class="footer-state"><p class="footer-state__name">${esc(state.name)}</p><ul role="list">${stores.map((s) => `<li><a href="/stores/${esc(s.slug)}/">${esc(s.city)}</a></li>`).join('')}</ul></div>`).join('')}
      </div>
    </div>
    <div class="site-footer__legal">
      <p class="site-footer__fine">${esc(site.brand?.name || 'Star Buds')} · EST. ${esc(site.brand?.est || '2013')} · Redesign concept: menus and checkout open the live Star Buds shop. Product and backdrop imagery on this site is AI-generated and illustrative.</p>
      <ul class="site-footer__legal-links" role="list">${(site.legal || []).map((l) => `<li><a href="${esc(l.href)}" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>
    </div>
  </footer>`;
}

/** JSON the client script needs on every page (store list for the switcher and live-menu rewriting) */
function clientData(ctx) {
  const data = {
    shop: ctx.site.shopOrigin || 'https://shop.starbuds.us',
    stores: ctx.stores.map((s) => ({ slug: s.slug, state: s.state, city: s.city, name: s.name, address: s.address || [], phone: s.phone || '', tel: s.tel || '', mapUrl: s.mapUrl || '', liveUrl: s.liveUrl || '' })),
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const HEAD_SCRIPT = `(function(d){var h=d.documentElement;h.classList.add('js');try{if(localStorage.getItem('sbshop-age-ok')!=='1')h.classList.add('age-pending')}catch(e){h.classList.add('age-pending')}setTimeout(function(){if(!window.SB_READY)h.classList.add('reveal-all')},2500)})(document);`;

/**
 * page({ title, description, body, bodyClass, ctx, path, head }) -> full HTML document.
 *  title: page title (" | Star Buds" is appended unless it already contains "Star Buds"); description: meta description;
 *  body: the <main> inner HTML (must contain exactly one <h1>); bodyClass: e.g. 'page-store'; path: the page URL path;
 *  head: extra raw HTML for <head> (optional).
 */
export function page({ title, description = '', body, bodyClass = '', ctx, path = '/', head = '' }) {
  if (!ctx) throw new Error('page(): ctx is required');
  const full = /star buds/i.test(title) ? title : `${title} | ${ctx.site.brand?.name || 'Star Buds'}`;
  const css = ctx.cssFiles.map((f) => `<link rel="stylesheet" href="/assets/css/${f}.css">`).join('\n  ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(full)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#11432B">
  <meta property="og:title" content="${esc(full)}">
  <meta property="og:description" content="${esc(description)}">
  <link rel="icon" type="image/png" href="/assets/brand/favicon.png">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/Oswald-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/Manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  ${css}
  <script>${HEAD_SCRIPT}</script>
  <script src="/assets/js/site.js" defer></script>
  ${head}
</head>
<body class="${esc(cx('pg', bodyClass))}">
  ${header(ctx, path)}
  <main id="main" tabindex="-1">
${body}
  </main>
  ${footer(ctx)}
  ${ageGate(ctx)}
  <script type="application/json" id="sb-data">${clientData(ctx)}</script>
</body>
</html>
`;
}
