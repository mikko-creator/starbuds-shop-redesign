// home.mjs - the home page (HOME-R3, "Starlight", docs/REVISION-3.md; section order from docs/REVISION-2.md "Home").
// Sections: hero, store finder (finder.mjs), Shop by category (its "Shop Our Brands" slot), Find your vibe (its "Shop by
// Effect" slot; src/content/blog/vibes.json from BLOG-R2, omitted when absent), deals teaser (its "Locally Grown Goods"
// slot), brand statement band (Star Buds' own words, verbatim), Flower and Vapes spotlights (its product rails; no live
// product data, so spotlight cards open the chosen store's menu), rewards band, From the blog (3 newest of
// src/content/blog/index.json, omitted when absent), FAQ (faq.mjs), brand story.
// Copy: captured site.json text, Star Buds' own words quoted verbatim from the starbuds.us capture (each cited below),
// and neutral UI labels only (BUILD-CONTRACT 2, REVISION-2 D2/D3). No text from the other operator's site.
// Revision 3 changes only the look: a night sky (CSS star field + aurora), frosted glass, star sparkles and the cut-*
// product cut-outs floating with a halo. Every text, link, id and data hook of revision 2 is kept.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import * as shell from './shell.mjs';
import { page, esc, attrs, cx, icon, btn, img, glass, patch, cutout, marquee, reveal, menuAttrs, articleCard, readContent, latestPosts } from './shell.mjs';

// FINDER and FAQ lanes own these modules; a missing or broken module must not break the home page.
const finderMod = await import('./finder.mjs').catch((e) => { if (e && e.code !== 'ERR_MODULE_NOT_FOUND') console.warn('warning: finder.mjs failed to load: ' + e.message); return null; });
const faqMod = await import('./faq.mjs').catch((e) => { if (e && e.code !== 'ERR_MODULE_NOT_FOUND') console.warn('warning: faq.mjs failed to load: ' + e.message); return null; });

async function laneSection(mod, fn, ctx, label) {
  if (!mod || typeof mod[fn] !== 'function') return '';
  try { return String((await mod[fn](ctx)) || ''); } catch (e) { console.warn(`warning: ${label} ${fn}() threw: ${e.message}`); return ''; }
}

const listJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const STUBBY = /\bSTUB\b/;

// ---------- Starlight pieces (classes hm-*, styled in home.css under .page-home / .page-sitemap) ----------
/** a CSS-only sky layer: FOUNDATION's sky() when shell.mjs exports it, else this page's own scoped layer (.hm-sky).
 *  opts: stars (true), aurora (true | false), cls. Decorative. */
function sky(opts = {}) {
  const { stars = true, aurora = true, cls } = opts;
  if (typeof shell.sky === 'function') return shell.sky({ stars, aurora, cls });
  return `<div class="${cx('hm-sky', cls)}" aria-hidden="true">${stars ? '<span class="hm-sky__stars"></span><span class="hm-sky__stars hm-sky__stars--b"></span>' : ''}${aurora ? '<span class="hm-sky__aurora"></span>' : ''}</div>`;
}
/** a four-point star sparkle; position and size it with cls (--s size, --d delay) */
const spark = (cls, style = '') => `<span class="${cx('hm-spark', cls)}"${style ? ` style="${esc(style)}"` : ''} aria-hidden="true"></span>`;
/** a constellation hairline (a few stars joined by fine lines), used sparingly */
function constellation(cls) {
  const pts = [[6, 58], [30, 44], [50, 52], [72, 24], [98, 32], [114, 8]];
  return `<svg class="${cx('hm-const', cls)}" viewBox="0 0 120 64" aria-hidden="true" focusable="false"><path class="hm-const__line" d="M${pts.map((p) => p.join(' ')).join('L')}"/>${pts.map(([x, y], i) => `<circle class="hm-const__dot" cx="${x}" cy="${y}" r="${i % 2 ? 1.2 : 1.8}"/>`).join('')}</svg>`;
}
/** a thin aurora hairline divider */
const hairline = (cls) => `<span class="${cx('hm-rule', cls)}" aria-hidden="true"></span>`;
/** the brand star image (site.json brand.star) */
const brandStar = (ctx, cls, w = 256) => `<img class="${esc(cls)}" src="${esc(ctx.site.brand?.star || '/assets/brand/star-on-dark.png')}" width="${w}" height="${w}" alt="" loading="lazy" decoding="async">`;

function hero(ctx) {
  const groups = ctx.storesByState;
  const states = groups.map((g) => g.state.name);
  const n = ctx.stores.length;
  const est = ctx.site.brand?.est || '2013';
  return `
<section class="hero" aria-labelledby="hero-title">
  <div class="plane-back hero__back">
    ${sky({ stars: true, aurora: true, cls: 'hero__sky' })}
    <span class="hero__glow" aria-hidden="true"></span>
  </div>
  <div class="wrap hero__inner">
    <div class="hero__copy">
      <p class="hero__eyebrow"${reveal('fade')}>${patch('The Star Buds Dispensary', { tone: 'gold', icon: 'star' })}</p>
      <h1 id="hero-title" class="hero__title"${reveal('up', 1)}><span class="hero__l1">Shop Premium</span> <span class="hero__l2">Cannabis</span></h1>
      <div class="hero__panel"${reveal('up', 2)}>
        <p class="hero__lead">${n} ${n === 1 ? 'location' : 'locations'} in ${esc(listJoin(states))}<span data-store-current hidden>. You're shopping at Star Buds in <strong data-store-field="city"></strong></span>. Choose your location, pick a category and open the live menu.</p>
        <div class="btn-row hero__cta">
          ${btn('Find your store', '#locations', { variant: 'gold', size: 'lg', icon: 'pin' })}
          ${btn('Shop Our Special Offers', '/deals/', { variant: 'ghost', size: 'lg', icon: 'tag' })}
        </div>
        <ul class="hero__states" role="list" aria-label="States">${groups.map((g) => `
          <li><span class="hero__state">${icon('star')}${esc(g.state.name)}</span></li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="hero__art" aria-hidden="true">
      <span class="hero__halo"></span>
      <svg class="hero__orbit" viewBox="0 0 400 400" focusable="false"><ellipse cx="200" cy="200" rx="194" ry="66" transform="rotate(-14 200 200)"/><ellipse class="hero__orbit-2" cx="200" cy="200" rx="160" ry="150" transform="rotate(20 200 200)"/></svg>
      ${cutout('cut-bud', { cls: 'hero__bud', depth: 0.06, eager: true, float: 'slow', sizes: '(max-width: 899px) 60vw, 400px' })}
      ${spark('hero__spark hero__spark--1')}${spark('hero__spark hero__spark--2')}${spark('hero__spark hero__spark--3')}
      <p class="hero__mark">${brandStar(ctx, 'hero__mark-star', 64)}<span>${esc(ctx.site.brand?.name || 'Star Buds')}</span><span class="hero__mark-dot"></span><span>Est. ${esc(est)}</span></p>
    </div>
  </div>
  <div class="hero__strap">${marquee(ctx.categories.map((c) => c.label), { strap: false, cls: 'hero__ticker' })}</div>
</section>`;
}

/** fallback when the FINDER lane's module is absent: a plain state-grouped store list */
function locations(ctx) {
  return `
<section class="section locate" id="locations" aria-labelledby="locate-title">
  <div class="plane-back">${sky({ stars: true, aurora: false })}</div>
  <div class="wrap">
    <p class="eyebrow">${icon('pin')} Locations</p>
    <h2 id="locate-title" class="h-display">Choose your location</h2>
    <p class="lead">Pick a store to shop its live menu. Your choice is remembered on this device.</p>
    <div class="locate__groups">${ctx.storesByState.map((g) => `
      <div class="locate__group">
        <p class="locate__state">${esc(g.state.name)}</p>
        <ul class="locate__chips" role="list">${g.stores.map((s) => `<li><a class="chip" href="/stores/${esc(s.slug)}/" data-store-pick="${esc(s.slug)}" data-no-toast>${icon('pin')}${esc(s.city)}</a></li>`).join('')}</ul>
      </div>`).join('')}
    </div>
    <a class="link-arrow" href="/dispensaries/">All locations${icon('arrow')}</a>
  </div>
</section>`;
}

/** Find your vibe (the large operator's "Shop by Effect" slot, REVISION-2 D9): reading from the Star Buds blog grouped
 *  by BLOG-R2 (src/content/blog/vibes.json {items:[{label,href,title}]}). Never a promise of effects: each tile is an
 *  article link. Omitted when the file is absent or empty. */
/** the topic for the big tile label: BLOG-R2's "Read: cannabis and sleep" -> "Cannabis and sleep" (the tile's own "Read"
 *  call to action and the article title keep it labelled as reading, D9) */
const vibeLabel = (l) => { const t = String(l).replace(/^read:\s*/i, ''); return t.charAt(0).toUpperCase() + t.slice(1); };
function vibes(ctx) {
  const v = readContent('blog/vibes.json');
  const items = (v && Array.isArray(v.items) ? v.items : []).filter((x) => x && x.label && /^\/(?!\/)/.test(x.href || ''));
  if (!items.length) return '';
  return `
<section class="section sb-vibes" aria-labelledby="vibes-title">
  <div class="plane-back">${sky({ stars: true, aurora: false })}<span class="sb-vibes__glow"></span></div>
  <div class="wrap">
    <div class="sb-vibes__head">
      <p class="sb-vibes__eyebrow"${reveal('fade')}>${patch('Star Buds blog', { tone: 'green', icon: 'star' })}</p>
      <h2 id="vibes-title" class="h-display sb-vibes__title"${reveal('up', 1)}>Find your vibe</h2>
      <p class="lead sb-vibes__lead"${reveal('up', 2)}>Reading from the Star Buds blog, sorted by topic.</p>
    </div>
    <ul class="sb-vibes__grid" role="list" data-stagger>${items.map((it) => `
      <li class="sb-vibes__item">
        <a class="sb-vibe" href="${esc(it.href)}">
          <span class="sb-vibe__orb" aria-hidden="true">${spark('sb-vibe__spark')}</span>
          <span class="sb-vibe__label">${esc(vibeLabel(it.label))}</span>
          ${it.title ? `<span class="sb-vibe__title">${esc(it.title)}</span>` : ''}
          <span class="sb-vibe__cta">Read${icon('arrow')}</span>
        </a>
      </li>`).join('')}
    </ul>
    <p class="sb-vibes__more"${reveal('fade')}><a class="link-arrow" href="/blog/">All articles${icon('arrow')}</a></p>
  </div>
</section>`;
}

/** Brand statement band (the large operator's statement slot): Star Buds' own words, quoted verbatim from
 *  C:/Users/Dell/starbuds-reforge/src/content/pages/about.json (the starbuds.us /about capture of 2026-10-23), section s2,
 *  the "rich" block under "The Star Buds Difference". The second quote keeps the capture's no-break space. */
const STATEMENT = {
  quote: 'From the moment you step into our dispensaries, you\'ll feel the difference.',
  line: 'At Star Buds, we pride ourselves on\u00a0Shining High Above the Rest.',
};
function statement(ctx) {
  return `
<section class="section on-dark sb-statement" aria-labelledby="statement-title">
  <div class="plane-back">${sky({ stars: true, aurora: false })}<span class="sb-statement__glow"></span>${constellation('sb-statement__const')}${constellation('sb-statement__const sb-statement__const--b')}</div>
  <div class="wrap sb-statement__inner">
    <p class="sb-statement__eyebrow"${reveal('fade')}>${patch('In our words', { tone: 'gold', icon: 'star' })}</p>
    <blockquote class="sb-statement__quote" cite="https://www.starbuds.us/about"${reveal('up', 1)}>
      <h2 id="statement-title" class="sb-statement__text">${esc(STATEMENT.quote)}</h2>
    </blockquote>
    <div class="sb-statement__rule"${reveal('fade', 2)}>${hairline()}</div>
    <p class="sb-statement__line"${reveal('up', 2)}>${esc(STATEMENT.line)}</p>
    <p class="sb-statement__cite"${reveal('fade', 3)}>Star Buds, <a href="/about-us/">About Us</a></p>
  </div>
  ${spark('sb-statement__spark sb-statement__spark--1')}${spark('sb-statement__spark sb-statement__spark--2')}
</section>`;
}

/** Flower and Vapes spotlights (the large operator's two product rails). No live product data, so each card opens the
 *  chosen store's flower / vape menu (data-menu-cat). Copy: products.json of the starbuds.us capture
 *  (C:/Users/Dell/starbuds-reforge/src/content/pages/products.json): the intro and the availability line verbatim (the
 *  latter case-tidied from all caps), the STRAINS and VAPES tile lines case-tidied; the STRAINS line stops before
 *  ", including our Cannabis Cup-winning Pootie Tang", a Colorado strain the shop stores do not list. */
const SPOT = {
  title: 'What are you in the mood for?',
  intro: 'Flower? Concentrates? Edibles? At Star Buds, we have all those products and more!',
  note: 'Product selection and availability varies by location.',
  cards: [
    { cat: 'flower', patch: 'Flower', title: 'Flower', text: 'We have a variety of strains to meet your specific needs.', cta: 'Shop flower', cut: 'cut-bud', rot: -8 },
    { cat: 'vaporizers', patch: 'Vaporizers', title: 'Vapes', text: 'Vape pens are a discreet and convenient way to consume marijuana and cannabis products.', cta: 'Shop vapes', cut: 'cut-vape', rot: 10 },
  ],
};
function spotlights(ctx) {
  const cats = new Set(ctx.categories.map((c) => c.slug));
  const cards = SPOT.cards.filter((c) => cats.has(c.cat));
  if (!cards.length) return '';
  return `
<section class="section sb-spot" aria-labelledby="spot-title">
  <div class="plane-back">${sky({ stars: true, aurora: false })}</div>
  <div class="wrap">
    <div class="sb-spot__head">
      <p class="sb-spot__eyebrow"${reveal('fade')}>${patch('Spotlight', { tone: 'gold', icon: 'star' })}</p>
      <h2 id="spot-title" class="h-display sb-spot__title"${reveal('up', 1)}>${esc(SPOT.title)}</h2>
      <p class="lead sb-spot__lead"${reveal('up', 2)}>${esc(SPOT.intro)}</p>
    </div>
    <div class="sb-spot__grid">${cards.map((c, i) => `
      <article class="sb-spot__card sb-spot__card--${esc(c.cat)} glass" aria-labelledby="spot-${esc(c.cat)}"${reveal('up', i + 1)}>
        <div class="sb-spot__copy">
          <p class="sb-spot__patch">${patch(c.patch, { tone: i ? 'chrome' : 'green', size: 'sm' })}</p>
          <h3 class="sb-spot__name" id="spot-${esc(c.cat)}">${esc(c.title)}</h3>
          <p class="sb-spot__text">${esc(c.text)}</p>
          <p class="sb-spot__store"><span data-store-current hidden>On the live menu at <strong data-store-label></strong></span><span data-store-none>Choose your location to open its menu</span></p>
          <div class="btn-row">${btn(c.cta, menuAttrs(c.cat).href, { variant: i ? 'chrome' : 'gold', icon: 'bag', attrs: { 'data-menu-cat': c.cat } })}</div>
        </div>
        <div class="sb-spot__art" aria-hidden="true">
          <span class="sb-spot__halo"></span>
          <span class="sb-spot__ring"></span>
          ${cutout(c.cut, { cls: 'sb-spot__cut', depth: 0.06, float: 'slow', rotate: c.rot, sizes: '(max-width: 700px) 52vw, 360px' })}
          ${spark('sb-spot__spark')}
        </div>
      </article>`).join('')}
    </div>
    <p class="sb-spot__note"${reveal('fade')}>${icon('star')}<span>${esc(SPOT.note)}</span>${icon('star')}</p>
  </div>
</section>`;
}

/** From the blog: the 3 newest posts of src/content/blog/index.json (BLOG-R2); a post whose image file is not there
 *  yet gets the brand panel (and a warning) instead of failing the build. Omitted when the index is absent. */
function fromBlog(ctx) {
  const posts = latestPosts(3);
  if (!posts.length) return '';
  const cards = posts.map((p) => {
    let image = p.image && p.image.src ? p.image : null;
    if (image && !fs.existsSync(path.join(ROOT, String(image.src).replace(/^\//, '')))) { console.warn(`warning: home From the blog: image not found ${image.src} (${p.href}); brand panel used`); image = null; }
    return { ...p, image };
  });
  return `
<section class="section sb-news" aria-labelledby="news-title">
  <div class="plane-back">${sky({ stars: true, aurora: false })}</div>
  <div class="wrap">
    <div class="sb-news__head">
      <div>
        <p class="sb-news__eyebrow"${reveal('fade')}>${patch('Star Buds blog', { tone: 'red', icon: 'star', size: 'sm' })}</p>
        <h2 id="news-title" class="h-display sb-news__title"${reveal('up', 1)}>From the blog</h2>
      </div>
      <p class="sb-news__all"${reveal('fade', 2)}>${btn('All articles', '/blog/', { variant: 'ghost' })}</p>
    </div>
    <ul class="sb-news__grid" role="list" data-stagger>${cards.map((p) => `
      <li class="sb-news__item">${articleCard(p)}</li>`).join('')}
    </ul>
  </div>
</section>`;
}

/** category tile art: the cut-* product cut-out floating out of the card; a retired id (site.json still names
 *  'patch-leaf' for Apparel, and any 'pop-*' sticker) gets the glowing brand star instead */
function catArt(ctx, id) {
  if (/^cut-/.test(id || '')) return cutout(id, { cls: 'cat__cut', depth: 0, float: 'slow', sizes: '(max-width: 700px) 30vw, 180px' });
  return `<span class="cat__star" aria-hidden="true">${brandStar(ctx, 'cat__star-img', 128)}</span>`;
}

function categories(ctx) {
  return `
<section class="section cats" id="shop" aria-labelledby="cats-title">
  <div class="plane-back">${sky({ stars: true, aurora: false })}<span class="cats__glow"></span></div>
  <div class="wrap">
    <div class="cats__head">
      <p class="cats__eyebrow"${reveal('fade')}>${patch('Shop All', { tone: 'gold', icon: 'bag' })}</p>
      <h2 id="cats-title" class="h-display cats__title"${reveal('up', 1)}>Shop by category</h2>
      <p class="lead cats__lead"${reveal('up', 2)}>Each category opens on the live menu<span data-store-current hidden> at <strong data-store-label></strong></span><span data-store-none> of the store you choose</span>.</p>
    </div>
    <ul class="cats__grid" role="list" data-stagger>${ctx.categories.map((c, i) => `
      <li class="cats__item">
        <a class="cat glass"${attrs(menuAttrs(c.slug))}>
          <span class="cat__halo" aria-hidden="true"></span>
          ${catArt(ctx, c.cutout)}
          <span class="cat__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
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
<section class="section deals-teaser" aria-labelledby="deals-title">
  <div class="plane-back">${sky({ stars: true, aurora: false })}<span class="deals-teaser__glow"></span></div>
  <div class="wrap deals-teaser__grid">
    <div class="deals-teaser__art" aria-hidden="true">
      <span class="deals-teaser__halo"></span>
      ${cutout('cut-preroll', { cls: 'deals-teaser__roll', depth: 0.06, float: 'slow', rotate: -16, sizes: '(max-width: 700px) 40vw, 300px' })}
      ${spark('deals-teaser__spark')}
    </div>
    <div class="board"${reveal('up')}>
      <div class="board__inner">
        <div class="board__head">
          <p class="board__eyebrow">${patch(ctx.site.promo?.text || 'Deals', { tone: 'red', icon: 'tag', size: 'sm' })}</p>
          <h2 id="deals-title" class="h-display board__title">${esc(head)}</h2>
          ${intro.subtitle ? `<p class="board__sub">${esc(intro.subtitle)}</p>` : ''}
        </div>
        ${picks.length ? `<ul class="board__rows" role="list">${picks.map((d) => { const [day, deal] = splitDeal(d.items[0]); return `
          <li class="board__row">
            <span class="board__state"><span class="board__code">${esc(d.state)}</span><span class="board__state-name">${esc(stateName(d.state))}</span></span>
            <span class="board__deal">${day ? `<strong class="board__day">${esc(day)}</strong>` : ''}<span class="board__line">${esc(deal)}</span><span class="board__group">${esc(d.title)}</span></span>
          </li>`; }).join('')}
        </ul>` : ''}
        <div class="btn-row board__cta">${btn('See all deals', '/deals/', { variant: 'ghost' })}</div>
      </div>
    </div>
  </div>
</section>`;
}

function rewardsBand(ctx) {
  const r = ctx.site.rewards || {};
  const apps = ctx.site.apps || {};
  const paras = (r.paragraphs || []).slice(0, 2);
  return `
<section class="section rewards-band on-dark" aria-labelledby="rewards-title">
  <div class="plane-back">
    <span class="rewards-band__aurora"></span>
    ${sky({ stars: true, aurora: false })}
  </div>
  <div class="wrap rewards-band__grid">
    ${glass(`
      <p class="rewards-band__eyebrow">${patch(r.programName || 'Higher Rewards', { tone: 'green', size: 'sm' })}</p>
      <h2 id="rewards-title" class="h-display rewards-band__title">${esc(r.title || 'Higher Rewards')}</h2>
      ${paras.map((p) => `<p class="rewards-band__p">${esc(p)}</p>`).join('')}
      <div class="btn-row rewards-band__cta">${btn('Higher Rewards', '/rewards/', { variant: 'gold' })}${r.joinHref ? btn('Join Higher Rewards', r.joinHref, { variant: 'ghost', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}</div>`, { cls: 'rewards-band__panel', attrs: { 'data-reveal': 'up' } })}
    ${apps.ios || apps.android ? glass(`
      <p class="eyebrow rewards-band__app-eyebrow">${icon('phoneApp')} Get the app</p>
      <p class="rewards-band__app-title">App Store &amp; Google Play</p>
      <div class="btn-row">
        ${apps.ios ? btn('App Store', apps.ios, { variant: 'chrome', size: 'sm', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}
        ${apps.android ? btn('Google Play', apps.android, { variant: 'chrome', size: 'sm', icon: 'external', attrs: { target: '_blank', rel: 'noopener' } }) : ''}
      </div>`, { cls: 'rewards-band__app', attrs: { 'data-reveal': 'up', style: '--i:2' } }) : ''}
  </div>
  ${spark('rewards-band__spark rewards-band__spark--1')}${spark('rewards-band__spark rewards-band__spark--2')}${spark('rewards-band__spark rewards-band__spark--3')}
</section>`;
}

function story(ctx) {
  const a = ctx.site.about || {};
  const paras = (a.paragraphs || []).slice(0, 3);
  const photo = a.photo && a.photo.src ? a.photo : null;
  const est = ctx.site.brand?.est || '2013';
  const media = photo
    ? `<figure class="story__frame"${reveal('left')}>
        <div class="story__mat">${img(photo, { cls: 'story__photo', sizes: '(max-width: 900px) 86vw, 520px' })}</div>
        ${photo.caption || photo.alt ? `<figcaption class="story__cap">${esc(photo.caption || photo.alt)}</figcaption>` : ''}
      </figure>`
    : `<div class="story__frame story__frame--brand"${reveal('left')}>
        ${brandStar(ctx, 'story__star')}
      </div>`;
  return `
<section class="section story on-dark" aria-labelledby="story-title">
  <div class="plane-back">
    ${sky({ stars: true, aurora: true, cls: 'story__sky' })}
    <p class="story__est" aria-hidden="true">Est. ${esc(est)}</p>
  </div>
  <div class="wrap story__grid">
    <div class="story__media">
      ${media}
      ${photo ? `<span class="story__glowstar" aria-hidden="true">${brandStar(ctx, 'story__glowstar-img', 128)}</span>` : ''}
    </div>
    <div class="story__copy"${reveal('right')}>
      ${ctx.site.brand?.tagline ? `<p class="story__eyebrow">${patch(ctx.site.brand.tagline, { tone: 'gold', icon: 'star', size: 'sm' })}</p>` : ''}
      <h2 id="story-title" class="h-display story__title">${esc(a.title || ctx.site.brand?.name || 'Star Buds')}</h2>
      ${hairline('story__rule')}
      ${paras.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="btn-row story__cta">${btn('Find a store', '/dispensaries/', { variant: 'gold', icon: 'pin' })}${btn('Higher Rewards', '/rewards/', { variant: 'ghost' })}</div>
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
  // revision 2 order (docs/REVISION-2.md "Home"): hero, finder, categories, vibes, deals, statement, spotlights, rewards,
  // blog, FAQ, story. vibes and blog are omitted while BLOG-R2's data files do not exist.
  const body = [hero(ctx), finder || locations(ctx), categories(ctx), vibes(ctx), dealsTeaser(ctx), statement(ctx), spotlights(ctx), rewardsBand(ctx), fromBlog(ctx), faq, story(ctx)].filter(Boolean).join('\n');
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
