// home.mjs - the home page (FOUNDATION, Iron Star). Sections: hero, store finder (FINDER lane), categories, deals
// teaser, rewards band, FAQ (FAQ lane), brand story. Copy: captured site.json text + template phrases + neutral UI
// labels only (BUILD-CONTRACT 2).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { page, esc, attrs, icon, btn, img, glass, patch, rocker, emblem, halftone, leaves, grain, cutout, patchCut, seam, pinstripe, marquee, reveal, menuAttrs } from './shell.mjs';

// FINDER and FAQ lanes own these modules; a missing or broken module must not break the home page.
const finderMod = await import('./finder.mjs').catch((e) => { if (e && e.code !== 'ERR_MODULE_NOT_FOUND') console.warn('warning: finder.mjs failed to load: ' + e.message); return null; });
const faqMod = await import('./faq.mjs').catch((e) => { if (e && e.code !== 'ERR_MODULE_NOT_FOUND') console.warn('warning: faq.mjs failed to load: ' + e.message); return null; });

async function laneSection(mod, fn, ctx, label) {
  if (!mod || typeof mod[fn] !== 'function') return '';
  try { return String((await mod[fn](ctx)) || ''); } catch (e) { console.warn(`warning: ${label} ${fn}() threw: ${e.message}`); return ''; }
}

const listJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const STUBBY = /\bSTUB\b/;
const has = (rel) => fs.existsSync(path.join(ROOT, rel));
/** the pop-era stickers are retired: categories that still point at one get an embroidered patch instead */
const cutFor = (id) => (/^pop-/.test(id || '') ? 'patch-leaf' : id);

/** background loop when its files exist (assets/media/<base>.webm + .mp4 + -poster.webp), else the generated still */
function backdrop({ cls, base, phone, still, label, eager = false }) {
  const media = `assets/media/${base}`;
  const ready = has(media + '.webm') && has(media + '.mp4') && has(media + '-poster.webp');
  const stillImg = img(still, { cls: `cover ${cls}__still`, alt: '', sizes: '100vw', eager });
  if (!ready) return stillImg;
  const phoneSrc = phone && has(`assets/media/${phone}`) ? `<source src="/assets/media/${phone}" type="video/mp4" media="(max-width: 699px)">` : '';
  return `${stillImg}
      <video class="cover bg-video ${cls}__video" autoplay muted loop playsinline preload="metadata" poster="/${media}-poster.webp" aria-hidden="true" tabindex="-1" data-ai="generated" title="${esc(label)}">
        ${phoneSrc}<source src="/${media}.webm" type="video/webm"><source src="/${media}.mp4" type="video/mp4">
      </video>`;
}

function hero(ctx) {
  const groups = ctx.storesByState;
  const states = groups.map((g) => g.state.name);
  const n = ctx.stores.length;
  const est = ctx.site.brand?.est || '2013';
  return `
<section class="hero" aria-labelledby="hero-title">
  <div class="plane-back hero__back">
    ${backdrop({ cls: 'hero', base: 'hero-iron', phone: 'hero-iron-phone.mp4', still: 'g-hero-jacket', label: 'A leather jacket with an embroidered star-and-leaf patch in a smoky workshop (AI-generated loop)', eager: true })}
    <div class="hero__scrim"></div>
    <div class="hero__leaves">${leaves({ tone: 'gold' })}</div>
    ${halftone({ color: 'gold', at: 'bl', cls: 'hero__dots' })}
    ${grain()}
    <div class="vignette"></div>
  </div>
  <div class="wrap hero__inner">
    <div class="hero__copy">
      <p class="hero__eyebrow"${reveal('fade')}>${patch('The Star Buds Dispensary', { tone: 'gold', icon: 'star' })}</p>
      <h1 id="hero-title" class="hero__title"${reveal('up', 1)}><span class="hero__l1">Shop Premium</span> <span class="hero__l2">Cannabis</span></h1>
      <div class="hero__rule"${reveal('fade', 2)}>${pinstripe()}</div>
      <p class="hero__lead"${reveal('up', 2)}>${n} ${n === 1 ? 'location' : 'locations'} in ${esc(listJoin(states))}<span data-store-current hidden>. You're shopping at Star Buds in <strong data-store-field="city"></strong></span>. Choose your location, pick a category and open the live menu.</p>
      <div class="btn-row hero__cta"${reveal('up', 3)}>
        ${btn('Find your store', '#locations', { variant: 'gold', size: 'lg', icon: 'pin' })}
        ${btn('Shop Our Special Offers', '/deals/', { variant: 'ghost', size: 'lg', icon: 'tag' })}
      </div>
      <ul class="hero__rockers" role="list" aria-label="States"${reveal('up', 4)}>${groups.map((g) => `
        <li>${rocker(g.state.name, { tone: 'gold', radius: 260, band: 46, angle: 24, cls: 'hero__rocker' })}</li>`).join('')}
      </ul>
    </div>
  </div>
  <div class="hero__front" aria-hidden="true">
    <div class="hero__emblem" data-depth="0.06">${emblem({ top: ctx.site.brand?.name || 'Star Buds', bottom: 'Est. ' + est, star: ctx.site.brand?.star || '/assets/brand/star-on-dark.png', cls: 'hero__emblem-svg' })}</div>
    ${cutout('cut-bud', { cls: 'hero__bud', depth: 0.12, eager: true, float: 'slow', sizes: '(max-width: 700px) 34vw, 260px' })}
  </div>
  <div class="hero__strap">${marquee(ctx.categories.map((c) => c.label))}</div>
</section>`;
}

/** fallback when the FINDER lane's module is absent: a plain state-grouped store list */
function locations(ctx) {
  return `
<section class="section section--leather locate" id="locations" aria-labelledby="locate-title">
  <div class="plane-back"><div class="leather-bg"></div>${grain()}</div>
  ${seam()}
  <div class="wrap">
    <p class="eyebrow">${icon('pin')} Locations</p>
    <h2 id="locate-title" class="h-display sheen">Choose your location</h2>
    <p class="lead">Pick a store to shop its live menu. Your choice is remembered on this device.</p>
    <div class="locate__groups">${ctx.storesByState.map((g) => `
      <div class="locate__group">
        <p class="locate__state">${esc(g.state.name)}</p>
        <ul class="locate__chips" role="list">${g.stores.map((s) => `<li><a class="chip" href="/stores/${esc(s.slug)}/" data-store-pick="${esc(s.slug)}" data-no-toast>${icon('pin')}${esc(s.city)}</a></li>`).join('')}</ul>
      </div>`).join('')}
    </div>
    <a class="link-arrow" href="/stores/">All locations${icon('arrow')}</a>
  </div>
</section>`;
}

function categories(ctx) {
  return `
<section class="section section--leather cats" id="shop" aria-labelledby="cats-title">
  <div class="plane-back">
    <div class="leather-bg"></div>
    ${halftone({ color: 'gold', at: 'tr', cls: 'cats__dots' })}
    ${grain()}
  </div>
  ${seam({ kind: 'pinstripe' })}
  <div class="wrap">
    <div class="cats__head">
      <p class="cats__eyebrow"${reveal('fade')}>${patch('Shop All', { tone: 'gold', icon: 'bag' })}</p>
      <h2 id="cats-title" class="h-display cats__title sheen"${reveal('up', 1)}>Categories</h2>
      <p class="lead cats__lead"${reveal('up', 2)}>Each category opens on the live menu<span data-store-current hidden> at <strong data-store-label></strong></span><span data-store-none> of the store you choose</span>.</p>
    </div>
    <ul class="cats__grid" role="list" data-stagger>${ctx.categories.map((c, i) => `
      <li class="cats__item">
        <a class="cat glass"${attrs(menuAttrs(c.slug))} data-tilt="3">
          <span class="cat__stitch stitch" aria-hidden="true"></span>
          ${cutout(cutFor(c.cutout), { cls: 'cat__cut', depth: 0, float: false, sizes: '(max-width: 700px) 30vw, 180px' })}
          <span class="cat__num numeral" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="cat__label">${esc(c.label)}</span>
          <span class="cat__cta"><span>Shop<span class="cat__cta-x"> ${esc(c.label)}</span></span>${icon('arrow')}</span>
        </a>
      </li>`).join('')}
    </ul>
  </div>
</section>`;
}

function dealsTeaser(ctx) {
  const deals = (ctx.site.deals || []).filter((d) => d && (d.items || []).length);
  const intro = ctx.site.dealsIntro || {};
  const head = intro.title || ctx.site.promo?.text || 'Shop Our Special Offers';
  const stateName = (code) => (ctx.states.find((s) => s.code === code) || {}).name || code;
  // one group per state, daily deals first
  const seen = new Set();
  const picks = [...deals.filter((d) => d.group === 'daily'), ...deals].filter((d) => (seen.has(d.state) ? false : seen.add(d.state))).slice(0, 3);
  const splitDeal = (line) => { const m = /^([^:]{3,32}):\s*(.+)$/.exec(line); return m ? [m[1], m[2]] : ['', line]; };
  return `
<section class="section section--bone deals-teaser" aria-labelledby="deals-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'ink', at: 'tr' })}${grain({ cls: 'deals-teaser__grain' })}</div>
  ${seam({ kind: 'double' })}
  <div class="wrap deals-teaser__grid">
    <div class="board"${reveal('up')}>
      <div class="board__inner">
        <div class="board__head">
          <p class="board__eyebrow">${patch(ctx.site.promo?.text || 'Deals', { tone: 'red', icon: 'tag', size: 'sm' })}</p>
          <h2 id="deals-title" class="board__title">${esc(head)}</h2>
          ${intro.subtitle ? `<p class="board__sub">${esc(intro.subtitle)}</p>` : ''}
          ${pinstripe({ tone: 'ink', cls: 'board__rule' })}
        </div>
        ${picks.length ? `<ul class="board__rows" role="list">${picks.map((d) => { const [day, deal] = splitDeal(d.items[0]); return `
          <li class="board__row">
            <span class="board__state"><span class="board__code">${esc(d.state)}</span><span class="board__state-name">${esc(stateName(d.state))}</span></span>
            <span class="board__deal">${day ? `<strong class="board__day">${esc(day)}</strong>` : ''}<span class="board__line">${esc(deal)}</span><span class="board__group">${esc(d.title)}</span></span>
          </li>`; }).join('')}
        </ul>` : ''}
        <div class="btn-row board__cta">${btn('See all deals', '/deals/', { variant: 'dark' })}</div>
      </div>
    </div>
    <div class="deals-teaser__art" aria-hidden="true">
      ${patchCut('flash-leaf', { cls: 'deals-teaser__flash', depth: 0.08, rotate: 4, sizes: '(max-width: 900px) 50vw, 420px' })}
    </div>
  </div>
  ${cutout('cut-preroll', { cls: 'deals-teaser__roll', depth: -0.1, float: 'slow', rotate: -16, sizes: '(max-width: 700px) 46vw, 360px' })}
</section>`;
}

function rewardsBand(ctx) {
  const r = ctx.site.rewards || {};
  const apps = ctx.site.apps || {};
  const paras = (r.paragraphs || []).slice(0, 2);
  return `
<section class="section rewards-band on-dark" aria-labelledby="rewards-title">
  <div class="plane-back">
    ${backdrop({ cls: 'rewards-band', base: 'smoke-ember', still: 'g-smoke', label: 'Smoke and golden embers drifting in darkness (AI-generated loop)' })}
    <div class="rewards-band__shade"></div>
    ${leaves({ tone: 'gold', cls: 'rewards-band__leaves' })}
    ${halftone({ color: 'green', at: 'br' })}
    ${grain()}
  </div>
  ${seam()}
  <div class="wrap rewards-band__grid">
    ${glass(`
      <p class="rewards-band__eyebrow">${patch(r.programName || 'Higher Rewards', { tone: 'green', size: 'sm' })}</p>
      <h2 id="rewards-title" class="h-display rewards-band__title sheen">${esc(r.title || 'Higher Rewards')}</h2>
      ${paras.map((p) => `<p class="rewards-band__p">${esc(p)}</p>`).join('')}
      <div class="btn-row rewards-band__cta">${btn('Higher Rewards', '/rewards/', { variant: 'gold' })}${r.joinHref ? btn('Join Higher Rewards', r.joinHref, { variant: 'ghost', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}</div>`, { stitch: true, cls: 'rewards-band__panel', attrs: { 'data-reveal': 'up' } })}
    ${apps.ios || apps.android ? glass(`
      <p class="eyebrow">${icon('phoneApp')} Get the app</p>
      <p class="rewards-band__app-title">App Store &amp; Google Play</p>
      <div class="btn-row">
        ${apps.ios ? btn('App Store', apps.ios, { variant: 'chrome', size: 'sm', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}
        ${apps.android ? btn('Google Play', apps.android, { variant: 'chrome', size: 'sm', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}
      </div>`, { edge: 'chrome', cls: 'rewards-band__app', attrs: { 'data-reveal': 'up', style: '--i:2' } }) : ''}
  </div>
  ${patchCut('patch-wings', { cls: 'rewards-band__wings', depth: 0.1, rotate: -4, sizes: '(max-width: 700px) 60vw, 380px' })}
  ${cutout('chrome-star', { cls: 'rewards-band__star', depth: -0.12, float: 'slow', rotate: 12, sizes: '(max-width: 700px) 28vw, 170px' })}
</section>`;
}

function story(ctx) {
  const a = ctx.site.about || {};
  const paras = (a.paragraphs || []).slice(0, 3);
  const photo = a.photo && a.photo.src ? a.photo : null;
  const est = ctx.site.brand?.est || '2013';
  const media = photo
    ? `<figure class="story__frame"${reveal('left')}>
        <div class="story__mat stitch stitch--draw">${img(photo, { cls: 'story__photo', sizes: '(max-width: 900px) 86vw, 520px' })}</div>
        ${photo.caption || photo.alt ? `<figcaption class="story__cap">${esc(photo.caption || photo.alt)}</figcaption>` : ''}
      </figure>`
    : `<div class="story__frame story__frame--brand"${reveal('left')}>
        ${leaves({ tone: 'bone' })}
        <img class="story__star" src="${esc(ctx.site.brand?.star || '/assets/brand/star-on-dark.png')}" width="256" height="256" alt="" loading="lazy" decoding="async">
      </div>`;
  return `
<section class="section story on-dark" aria-labelledby="story-title">
  <div class="plane-back">
    ${leaves({ tone: 'bone' })}
    <p class="story__est" aria-hidden="true">Est. ${esc(est)}</p>
    ${halftone({ color: 'gold', at: 'bl' })}
    ${grain()}
    <div class="vignette"></div>
  </div>
  ${seam({ kind: 'double' })}
  <div class="wrap story__grid">
    <div class="story__media">
      ${media}
      ${patchCut('patch-leaf', { cls: 'story__patch', depth: 0.12, rotate: 6, sizes: '(max-width: 700px) 30vw, 190px' })}
    </div>
    <div class="story__copy"${reveal('right')}>
      ${ctx.site.brand?.tagline ? `<p class="story__eyebrow">${patch(ctx.site.brand.tagline, { tone: 'gold', icon: 'star', size: 'sm' })}</p>` : ''}
      <h2 id="story-title" class="h-display story__title">${esc(a.title || ctx.site.brand?.name || 'Star Buds')}</h2>
      ${pinstripe({ cls: 'story__rule' })}
      ${paras.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="btn-row story__cta">${btn('Find a store', '/stores/', { variant: 'gold', icon: 'pin' })}${btn('Higher Rewards', '/rewards/', { variant: 'ghost' })}</div>
    </div>
  </div>
</section>`;
}

export async function render(ctx) {
  const stub = STUBBY.test(JSON.stringify(ctx.site.about || '')) ? ' (stub data)' : '';
  const states = ctx.storesByState.map((g) => g.state.name);
  let finder = await laneSection(finderMod, 'finderSection', ctx, 'finder.mjs');
  if (finder && !/id="locations"/.test(finder)) finder = '<span id="locations" class="anchor-target" aria-hidden="true"></span>' + finder;
  const faq = await laneSection(faqMod, 'faqSection', ctx, 'faq.mjs');
  const body = [hero(ctx), finder || locations(ctx), categories(ctx), dealsTeaser(ctx), rewardsBand(ctx), faq, story(ctx)].filter(Boolean).join('\n');
  return [{
    path: '/',
    html: page({
      ctx, path: '/', bodyClass: 'page-home',
      title: 'Star Buds: Shop Premium Cannabis' + stub,
      description: `Shop premium cannabis at The Star Buds Dispensary: choose your location in ${listJoin(states)} and open its live menu.`,
      body,
      scripts: finder ? ['finder.js'] : [],
    }),
  }];
}
