// home.mjs - the home page (FOUNDATION). Sections: hero, location chooser, categories, deals teaser, rewards band,
// brand story. Copy: captured site.json text + template phrases + neutral UI labels only (BUILD-CONTRACT 2).
import { page, esc, attrs, cx, icon, btn, img, glass, sticker, starburst, halftone, leaves, cutout, seam, marquee, reveal, menuAttrs, storeLinkAttrs } from './shell.mjs';

const listJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const STUBBY = /\bSTUB\b/;

function video({ cls, base, phone, poster, label }) {
  return `<img class="cover ${cls}__poster" src="${poster}" width="1600" height="890" alt="" decoding="async" fetchpriority="high" data-ai="generated">
      <video class="cover bg-video ${cls}__video" autoplay muted loop playsinline preload="metadata" poster="${poster}" aria-hidden="true" tabindex="-1" data-ai="generated" title="${esc(label)}">
        ${phone ? `<source src="${phone}" type="video/mp4" media="(max-width: 699px)">` : ''}
        <source src="${base}.webm" type="video/webm">
        <source src="${base}.mp4" type="video/mp4">
      </video>`;
}

function hero(ctx) {
  const states = ctx.storesByState.map((g) => g.state.name);
  const n = ctx.stores.length;
  return `
<section class="hero on-dark" aria-labelledby="hero-title">
  <div class="plane-back hero__back">
      ${video({ cls: 'hero', base: '/assets/media/hero-pop', phone: '/assets/media/hero-pop-phone.mp4', poster: '/assets/media/hero-pop-poster.webp', label: 'Cannabis leaves and glass bubbles drifting (AI-generated loop)' })}
    <div class="hero__scrim"></div>
    <div class="hero__leaves">${leaves({ tone: 'pop' })}</div>
    ${halftone({ color: 'yellow', at: 'tr', cls: 'hero__dots' })}
    ${halftone({ color: 'pink', at: 'bl', cls: 'hero__dots2' })}
  </div>
  <div class="wrap hero__inner">
    <div class="hero__panel glass glass--dark glass--pop"${reveal('up')}>
      <div class="hero__tags">${sticker('EST. ' + esc(ctx.site.brand?.est || '2013'), { color: 'yellow', tilt: -6 })}${ctx.storesByState.map((g, i) => sticker(g.state.code, { color: ['lime', 'pink', 'paper', 'lime'][i % 4], tilt: [4, -3, 5, -2][i % 4], cls: 'hero__state' })).join('')}</div>
      <h1 id="hero-title" class="h-display hero__title">Shop <span class="hero__pop">premium</span> cannabis</h1>
      <p class="hero__sub">at The Star Buds Dispensary<span data-store-current hidden> in <strong data-store-field="city"></strong></span></p>
      <p class="hero__lead">${n} ${n === 1 ? 'location' : 'locations'} in ${esc(listJoin(states))}. Choose your location, pick a category and open the live menu.</p>
      <div class="btn-row hero__cta">
        ${btn('Choose your location', '#locations', { variant: 'pop', size: 'lg', icon: 'pin' })}
        ${btn('Shop Our Special Offers', '/deals/', { variant: 'ghost', icon: 'tag' })}
      </div>
    </div>
  </div>
  <div class="hero__front" aria-hidden="true">
    ${cutout('cut-bud', { cls: 'hero__bud', depth: 0.14, eager: true, float: 'slow', sizes: '(max-width: 700px) 56vw, (max-width: 1100px) 40vw, 500px' })}
    ${cutout('cut-jar', { cls: 'hero__jar', depth: -0.08, float: 'fast', rotate: 8, sizes: '(max-width: 700px) 30vw, 230px' })}
    ${cutout('cut-gummies', { cls: 'hero__gummies', depth: 0.22, float: 'slow', rotate: -6, sizes: '(max-width: 700px) 40vw, 300px' })}
  </div>
  <div class="hero__ticker">${marquee(ctx.categories.map((c) => c.label))}</div>
</section>`;
}

function locations(ctx) {
  const groups = ctx.storesByState;
  return `
<section class="section locate" id="locations" aria-labelledby="locate-title">
  <div class="plane-back">
    ${leaves({ tone: 'light' })}
    <span class="blob blob--lime locate__blob1"></span><span class="blob blob--yellow locate__blob2"></span>
  </div>
  <div class="wrap locate__grid">
    <div class="locate__intro">
      <p class="eyebrow"${reveal('up')}>${icon('pin')} Locations</p>
      <h2 id="locate-title" class="h-display"${reveal('up', 1)}>Choose your <span class="swipe">location</span></h2>
      <p class="lead locate__lead"${reveal('up', 2)}>Pick a store to shop its live menu. Your choice is remembered on this device.</p>
      <div class="tabs locate__tabs" role="tablist" aria-label="States" data-tabs${reveal('up', 3)}>
        ${groups.map((g, i) => `<button type="button" class="tab" role="tab" id="loc-tab-${esc(g.state.code)}" aria-controls="loc-panel-${esc(g.state.code)}" aria-selected="${i === 0}" data-tab-state="${esc(g.state.code)}"${i ? ' tabindex="-1"' : ''}>${esc(g.state.code)}<span class="tab__count">${g.stores.length}</span><span class="sr-only"> ${esc(g.state.name)}</span></button>`).join('')}
      </div>
      ${groups.map((g, i) => `
      <div class="locate__panel" role="tabpanel" id="loc-panel-${esc(g.state.code)}" aria-labelledby="loc-tab-${esc(g.state.code)}"${i ? ' hidden' : ''}>
        <p class="locate__state">${esc(g.state.name)}</p>
        <ul class="locate__chips" role="list">${g.stores.map((s) => `
          <li><a class="chip" href="/stores/${esc(s.slug)}/" data-store-pick="${esc(s.slug)}" data-no-toast>${icon('pin')}${esc(s.city)}</a></li>`).join('')}
        </ul>
      </div>`).join('')}
      <noscript><style>.locate__panel[hidden]{display:block!important}</style></noscript>
      <a class="link-arrow locate__all" href="/stores/">All locations${icon('arrow')}</a>
    </div>
    <div class="locate__aside">
      ${glass(`
        ${starburst({ color: 'yellow', points: 16, cls: 'locate__burst' })}
        <div class="locate__none" data-store-none>
          <p class="eyebrow">Choose your location</p>
          <p class="h-display h-sub locate__card-title">Your store, your menu</p>
          <p class="muted">Select a store to see its address and phone number, and to point every Shop button at its live menu.</p>
          <ul class="locate__mini" role="list">${groups.map((g) => `<li><strong>${esc(g.state.code)}</strong> ${esc(g.state.name)} · ${g.stores.length}</li>`).join('')}</ul>
        </div>
        <div class="locate__current" data-store-current hidden>
          <p class="eyebrow">You're shopping at</p>
          <p class="h-display h-sub locate__card-title">Star Buds in <span data-store-field="city"></span></p>
          <p class="locate__line">${icon('pin')}<span data-store-field="address"></span></p>
          <p class="locate__line"><a class="locate__tel" href="/stores/" data-store-tel hidden>${icon('phone')}<span data-store-field="phone"></span></a></p>
          <div class="btn-row">
            ${btn('Shop this store', '/stores/', { variant: 'primary', icon: 'bag', attrs: { 'data-menu-cat': '' } })}
            ${btn('View store', '/stores/', { variant: 'light', size: 'sm', attrs: { 'data-store-link': '' } })}
          </div>
          <a class="link-arrow locate__map" href="/stores/" data-store-map target="_blank" rel="noopener" hidden>Get directions${icon('external')}</a>
        </div>`, { pop: true, cls: 'locate__card', attrs: { 'data-reveal': 'scale' } })}
      ${cutout('pop-star', { cls: 'locate__star', depth: 0.1, float: 'fast', rotate: 10, sizes: '(max-width: 700px) 30vw, 200px' })}
    </div>
  </div>
  ${cutout('cut-leaf', { cls: 'locate__leaf', depth: 0.2, float: 'slow', rotate: -24, sizes: '(max-width: 700px) 34vw, 260px' })}
</section>`;
}

function categories(ctx) {
  return `
<section class="section cats" id="shop" aria-labelledby="cats-title">
  <div class="plane-back">
    ${img('g-glass', { cls: 'cover cats__bg', alt: '', sizes: '100vw' })}
    <div class="cats__wash"></div>
    ${halftone({ color: 'ink', at: 'top' })}
  </div>
  <div class="wrap">
    <div class="cats__head">
      <p class="eyebrow"${reveal('up')}>${icon('bag')} Shop All</p>
      <h2 id="cats-title" class="h-display"${reveal('up', 1)}>Categories</h2>
      <p class="lead"${reveal('up', 2)}>Each category opens on the live menu<span data-store-current hidden> at <strong data-store-label></strong></span><span data-store-none> of the store you choose</span>.</p>
    </div>
    <ul class="cats__grid" role="list" data-stagger>${ctx.categories.map((c, i) => `
      <li class="cats__item">
        <a class="cat glass glass--pop cat--${i % 3}"${attrs(menuAttrs(c.slug))} data-tilt="5">
          ${cutout(c.cutout, { cls: 'cat__cut', depth: 0, float: false, sizes: '(max-width: 700px) 34vw, 190px' })}
          <span class="cat__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="cat__label">${esc(c.label)}</span>
          <span class="cat__cta"><span>Shop<span class="cat__cta-x"> ${esc(c.label)}</span></span>${icon('arrow')}</span>
        </a>
      </li>`).join('')}
    </ul>
  </div>
  ${seam({ kind: 'scallop', color: 'var(--paper)', cls: 'seam--bottom' })}
</section>`;
}

function dealsTeaser(ctx) {
  const deals = (ctx.site.deals || []).filter((d) => d && (d.items || []).length);
  const intro = ctx.site.dealsIntro || {};
  const head = intro.title || ctx.site.promo?.text || 'Shop Our Special Offers';
  // one group per state, daily deals first
  const seen = new Set();
  const picks = [...deals.filter((d) => d.group === 'daily'), ...deals].filter((d) => (seen.has(d.state) ? false : seen.add(d.state))).slice(0, 3);
  const splitDeal = (line) => { const m = /^([^:]{3,32}):\s*(.+)$/.exec(line); return m ? [m[1], m[2]] : ['', line]; };
  return `
<section class="section deals-teaser" aria-labelledby="deals-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'pink', at: 'tl' })}</div>
  <div class="wrap">
    <div class="comic"${reveal('up')}>
      <div class="comic__panel halftone-host">
        ${halftone({ color: 'pink', at: 'full', cls: 'comic__dots' })}
        <div class="comic__copy">
          <p class="eyebrow">${icon('tag')} ${esc(ctx.site.promo?.text || 'Deals')}</p>
          <h2 id="deals-title" class="h-display comic__title">${esc(head)}</h2>
          ${intro.subtitle ? `<p class="comic__sub">${esc(intro.subtitle)}</p>` : ''}
          ${picks.length ? `<ul class="comic__list" role="list">${picks.map((d) => { const [day, deal] = splitDeal(d.items[0]); return `
            <li class="comic__item">${sticker(d.state, { color: 'paper', tilt: -3 })}<div><p class="comic__item-title">${esc(d.title)}</p><p class="comic__item-line">${day ? `<strong>${esc(day)}:</strong> ` : ''}${esc(deal)}</p></div></li>`; }).join('')}
          </ul>` : ''}
          <div class="btn-row">${btn('See all deals', '/deals/', { variant: 'dark' })}</div>
        </div>
      </div>
      ${starburst({ label: 'Deals', sub: 'Every day', color: 'coral', cls: 'comic__burst' })}
    </div>
  </div>
  ${seam({ kind: 'zig', color: 'var(--green-ink)', cls: 'seam--bottom' })}
  ${cutout('pop-bud', { cls: 'deals-teaser__bud', depth: 0.12, float: 'fast', rotate: 8, sizes: '(max-width: 700px) 38vw, 280px' })}
  ${cutout('cut-preroll', { cls: 'deals-teaser__roll', depth: -0.14, float: 'slow', rotate: -18, sizes: '(max-width: 700px) 46vw, 380px' })}
</section>`;
}

function rewardsBand(ctx) {
  const r = ctx.site.rewards || {};
  const apps = ctx.site.apps || {};
  const paras = (r.paragraphs || []).slice(0, 2);
  return `
<section class="section rewards-band on-dark" aria-labelledby="rewards-title">
  <div class="plane-back">
      ${video({ cls: 'rewards-band', base: '/assets/media/glass-dark', poster: '/assets/media/glass-dark-poster.webp', label: 'Dark glass bubbles and leaves drifting (AI-generated loop)' })}
    <div class="rewards-band__shade"></div>
    ${leaves({ tone: 'lime', cls: 'rewards-band__leaves' })}
    ${halftone({ color: 'lime', at: 'br' })}
  </div>
  <div class="wrap rewards-band__grid">
    ${glass(`
      ${sticker(r.programName || 'Higher Rewards', { color: 'lime', tilt: -4 })}
      <h2 id="rewards-title" class="h-display rewards-band__title">${esc(r.title || 'Higher Rewards')}</h2>
      ${paras.map((p) => `<p class="rewards-band__p">${esc(p)}</p>`).join('')}
      <div class="btn-row rewards-band__cta">${btn('Higher Rewards', '/rewards/', { variant: 'pop' })}${r.joinHref ? btn('Join Higher Rewards', r.joinHref, { variant: 'ghost', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}</div>`, { pop: true, tone: 'dark', cls: 'rewards-band__panel', attrs: { 'data-reveal': 'up' } })}
    ${apps.ios || apps.android ? glass(`
      <p class="eyebrow">${icon('phoneApp')} Get the app</p>
      <p class="rewards-band__app-title h-display">App Store &amp; Google Play</p>
      <div class="btn-row">
        ${apps.ios ? btn('App Store', apps.ios, { variant: 'light', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}
        ${apps.android ? btn('Google Play', apps.android, { variant: 'light', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}
      </div>`, { tone: 'dark', cls: 'rewards-band__app', attrs: { 'data-reveal': 'up', style: '--i:2' } }) : ''}
  </div>
  ${seam({ kind: 'wave', color: 'var(--paper)', cls: 'seam--bottom' })}
  ${cutout('cut-vape', { cls: 'rewards-band__vape', depth: 0.16, float: 'slow', rotate: 14, sizes: '(max-width: 700px) 26vw, 200px' })}
  ${cutout('cut-tincture', { cls: 'rewards-band__tincture', depth: -0.1, float: 'fast', rotate: -8, sizes: '(max-width: 700px) 30vw, 230px' })}
</section>`;
}

function story(ctx) {
  const a = ctx.site.about || {};
  const paras = (a.paragraphs || []).slice(0, 3);
  const photo = a.photo && a.photo.src ? a.photo : null;
  const media = photo
    ? `<figure class="story__frame"${reveal('left')}>
        ${img(photo, { cls: 'story__photo', sizes: '(max-width: 900px) 92vw, 560px' })}
        <span class="story__tape" aria-hidden="true"></span>
        ${photo.caption || photo.alt ? `<figcaption class="story__cap">${esc(photo.caption || photo.alt)}</figcaption>` : ''}
      </figure>`
    : `<div class="story__frame story__frame--brand"${reveal('left')}>
        ${leaves({ tone: 'dark' })}
        <img class="story__star" src="${esc(ctx.site.brand?.star || '/assets/brand/star-on-dark.png')}" width="256" height="256" alt="" loading="lazy" decoding="async">
      </div>`;
  return `
<section class="section story" aria-labelledby="story-title">
  <div class="plane-back">
    ${leaves({ tone: 'light' })}
    <p class="story__est outline-type" aria-hidden="true">EST. ${esc(ctx.site.brand?.est || '2013')}</p>
    ${halftone({ color: 'yellow', at: 'tr' })}
  </div>
  <div class="wrap story__grid">
    <div class="story__media">
      ${media}
      ${cutout('cut-leaf', { cls: 'story__leaf', depth: 0.18, float: 'slow', rotate: 30, sizes: '(max-width: 700px) 30vw, 220px' })}
    </div>
    ${glass(`
      ${sticker('EST. ' + (ctx.site.brand?.est || '2013'), { color: 'yellow', tilt: -5, cls: 'story__sticker' })}
      ${ctx.site.brand?.tagline ? `<p class="eyebrow story__tagline">${icon('star')} ${esc(ctx.site.brand.tagline)}</p>` : ''}
      <h2 id="story-title" class="h-display story__title">${esc(a.title || ctx.site.brand?.name || 'Star Buds')}</h2>
      ${paras.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="btn-row">${btn('Find a store', '/stores/', { variant: 'primary', icon: 'pin' })}${btn('Higher Rewards', '/rewards/', { variant: 'ghost' })}</div>`, { pop: true, cls: 'story__copy', attrs: { 'data-reveal': 'right' } })}
  </div>
  ${seam({ kind: 'zig', color: 'var(--green-ink)', cls: 'seam--bottom' })}
</section>`;
}

export function render(ctx) {
  const stub = STUBBY.test(JSON.stringify(ctx.site.about || '')) ? ' (stub data)' : '';
  const states = ctx.storesByState.map((g) => g.state.name);
  const body = [hero(ctx), locations(ctx), categories(ctx), dealsTeaser(ctx), rewardsBand(ctx), story(ctx)].join('\n');
  return [{
    path: '/',
    html: page({
      ctx, path: '/', bodyClass: 'page-home',
      title: 'Star Buds: Shop Premium Cannabis' + stub,
      description: `Shop premium cannabis at The Star Buds Dispensary: choose your location in ${listJoin(states)} and open its live menu.`,
      body,
    }),
  }];
}
