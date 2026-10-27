// content.mjs - CONTENT lane: /deals/, /rewards/ and /404.html.
// Revision 3 (CONTENT-R3, "Starlight", docs/REVISION-3.md): night-sky grounds (a CSS star field with aurora washes),
// frosted glass price cards and panels, glass pill tabs, glowing tier orbs and floating cut-* product cut-outs. Only the
// look changed from revision 2: every word, link, id, ARIA attribute and the inline DEALS_SCRIPT are as they were.
// The Iron Star pieces are gone from these pages: no leather, stitches, patches, rockers, halftone, grain, leaves,
// seams, pinstripes, patch/flash/chrome-star cut-outs, g-smoke or the smoke-ember loop.
// Copy: only site.json text (dealsIntro, deals[], rewards, apps, states, stores) plus neutral UI labels
// (BUILD-CONTRACT 2). Deal lines are shown verbatim; parentheticals are set as fine print and prices/percentages are
// highlighted, but no word is changed. Rewards prize tiers (prize:true, 250K-point cars) are left out on purpose.
// Revision 2 (RESOURCES-R2) links stay: breadcrumbs (page({ crumbs })), /rewards/terms/, the state deals pages
// /dispensaries/<state>/deals/ and /dispensaries/.
// Local classes: dl- (deals), rw- (rewards), nf- (not found), ct- (Starlight pieces shared by these three pages);
// styles live in src/styles/content.css.
import { page, esc, attrs, icon, btn, cutout, marquee, reveal } from './shell.mjs';

const EXT = { target: '_blank', rel: 'noopener' };
const WEEK = ['SUN', 'MON', 'TUES', 'WEDNES', 'THURS', 'FRI', 'SATUR'];
const ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ---------------------------------------------------------------- Starlight pieces (decorative markup only)

/** CSS-only night sky for a section's back plane: two aurora washes (+ `extra` glow layers) in a glow plane that fades
 *  out at the section's top and bottom edges (so consecutive sections meet without a seam), and a two-layer star field
 *  (one layer twinkles) */
const starSky = (cls = '', extra = '') => `<div class="ct-sky${cls ? ' ' + cls : ''}" aria-hidden="true"><span class="ct-sky__glow"><span class="ct-sky__aurora ct-sky__aurora--a"></span><span class="ct-sky__aurora ct-sky__aurora--b"></span>${extra}</span><span class="ct-sky__stars"></span><span class="ct-sky__stars ct-sky__stars--twinkle"></span></div>`;

/** a four-point star sparkle; position it with cls */
const spark = (cls = '') => `<span class="ct-spark${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;

/** a thin aurora hairline */
const hair = (cls = '') => `<span class="ct-hair${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;

/** a small glass pill label (eyebrows and tags; the same text the revision 2 patch carried) */
const pill = (text, { icon: ic, tone = '', cls = '' } = {}) => `<span class="ct-pill${tone ? ' ct-pill--' + tone : ''}${cls ? ' ' + cls : ''}">${ic ? icon(ic) : ''}<span>${esc(text)}</span></span>`;

/** a round glass orb badge (label + small sub line; the same text the revision 2 seal carried) */
const orb = ({ label = '', sub = '', tone = '', cls = '' }) => `<span class="ct-orb${tone ? ' ct-orb--' + tone : ''}${cls ? ' ' + cls : ''}"><span class="ct-orb__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span></span>`;

/** a frosted glass panel */
const glassBox = (inner, { tag = 'div', cls = '', attrs: a = {} } = {}) => `<${tag} class="ct-glass${cls ? ' ' + cls : ''}"${attrs(a)}>${inner}</${tag}>`;

// ---------------------------------------------------------------- text helpers (unchanged from revision 2)

/** weekday index (0 = Sunday) named inside a captured deal-day label such as "MUNCHEEZMONDAY" or "SUNDAY FUNDAY" */
function weekday(label) {
  const m = /(SUN|MON|TUES|WEDNES|THURS|FRI|SATUR)DAY/i.exec(String(label).replace(/\s+/g, ''));
  return m ? WEEK.indexOf(m[1].toUpperCase()) : -1;
}

/** highlight prices / percentages in already-escaped text (presentation only; the words are unchanged) */
const hl = (escaped) => escaped.replace(/(\$\d[\d,.]*|\d+%(?:\s*OFF)?)/gi, '<mark class="dl-hl">$1</mark>');

/** a captured deal line: main text (highlighted) + a trailing "(...)" set as fine print */
function dealText(text) {
  const m = /^(.*?)\s*(\([^)]*\))\s*$/.exec(String(text));
  const main = m ? m[1] : String(text);
  return hl(esc(main)) + (m ? ` <span class="dl-fine">${esc(m[2])}</span>` : '');
}

/** the day rows of a daily-style deal group: [{ day, deal }] (falls back to splitting "DAY: deal" items) */
function dayRows(deal) {
  if (deal.days && deal.days.length) return deal.days;
  return (deal.items || []).map((line) => { const m = /^([^:]{3,40}):\s*(.+)$/.exec(line); return m ? { day: m[1], deal: m[2] } : { day: '', deal: line }; });
}

/** the "Today" marker: a small rose pill (the only urgency accent), shown by the page script on the matching weekday */
const todayTag = () => `<span class="dl-today" data-today hidden>Today</span>`;

/** split a heading so its last `n` words carry the aurora accent */
function accentLast(text, n, cls) {
  const words = String(text).split(' ');
  if (words.length <= n) return `<span class="${cls}">${esc(text)}</span>`;
  return `${esc(words.slice(0, -n).join(' '))} <span class="${cls}">${esc(words.slice(-n).join(' '))}</span>`;
}

const stateName = (ctx, code) => (ctx.states.find((s) => s.code === code) || {}).name || code;
const stateSlugOf = (ctx, code) => String(stateName(ctx, code)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DEAL_PAGES = new Set(['MS', 'OK', 'MD']); // states with a /dispensaries/<state>/deals/ page (LOCATIONS-R2)
const dealLinks = (ctx, codes) => codes.filter((c) => DEAL_PAGES.has(c)).map((c) => `<a class="link-arrow" href="/dispensaries/${stateSlugOf(ctx, c)}/deals/">${esc(stateName(ctx, c))} deals${icon('arrow')}</a>`).join('');
const termsLine = (t) => (t ? `<p class="dl-terms">${esc(t)}</p>` : '');
const sentences = (p) => String(p || '').split(/(?<=[.!?])\s+/).filter(Boolean);

// ---------------------------------------------------------------- deal pieces

/** price card rows (Mississippi, Maryland) */
function boardRows(deal) {
  const rows = dayRows(deal);
  return `<ul class="dl-board__rows" role="list" data-stagger>${rows.map((r) => {
    const wd = weekday(r.day);
    return `
        <li class="dl-row"${wd >= 0 ? ` data-weekday="${wd}"` : ''}>
          <span class="dl-row__abbr" aria-hidden="true">${wd >= 0 ? ABBR[wd] : icon('star')}</span>
          <div class="dl-row__body"><p class="dl-row__name"><span>${esc(r.day)}</span>${todayTag()}</p><p class="dl-row__deal">${dealText(r.deal)}</p></div>
        </li>`;
  }).join('')}
      </ul>`;
}

/** a frosted price card: tag pill, light display title, intro, day rows, terms */
function board(deal, { tag = '', tagTone = '', cls = '', small = false } = {}) {
  return `
    <article class="ct-glass dl-board${cls ? ' ' + cls : ''}"${reveal('up')}>
      <header class="dl-board__head">
        ${tag ? `<p class="dl-board__tag">${pill(tag, { tone: tagTone })}</p>` : ''}
        <h3 class="dl-board__title${small ? ' dl-board__title--sm' : ''}">${esc(deal.title)}</h3>
        ${deal.intro ? `<p class="dl-board__intro">${esc(deal.intro)}</p>` : ''}
      </header>
      ${boardRows(deal)}
      ${termsLine(deal.terms)}
    </article>`;
}

/** glass day tiles (Oklahoma); an odd count gets a floating cut-out tile to close the grid */
function dayGrid(deal) {
  const rows = dayRows(deal);
  return `<ul class="dl-days" role="list" data-stagger>${rows.map((r) => {
    const wd = weekday(r.day);
    return `
      <li class="dl-day"${wd >= 0 ? ` data-weekday="${wd}"` : ''}>
        <span class="dl-day__top">${wd >= 0 ? `<span class="dl-day__abbr" aria-hidden="true">${ABBR[wd]}</span>` : ''}${todayTag()}</span>
        <p class="dl-day__name">${esc(r.day)}</p>
        <p class="dl-day__deal">${dealText(r.deal)}</p>
      </li>`;
  }).join('')}${rows.length % 2 ? `
      <li class="dl-day dl-day--art" aria-hidden="true">${spark('dl-day__spark')}${cutout('cut-preroll', { cls: 'dl-day__cut', depth: 0, float: 'slow', rotate: -18, sizes: '(max-width: 700px) 40vw, 220px' })}</li>` : ''}
    </ul>`;
}

/** store-aware "Shop the deals" button + the state's store chips (static links to each live shop store page) */
function shopRow(ctx, code, { dark = false } = {}) {
  const group = ctx.storesByState.find((g) => g.state.code === code);
  if (!group) return '';
  const stores = group.stores;
  const single = stores.length === 1 ? stores[0] : null;
  const live = (s) => s.liveUrl || `${ctx.site.shopOrigin || 'https://shop.starbuds.us'}/stores/${s.slug}/`;
  const variant = dark ? 'gold' : 'dark';
  const button = single
    ? btn(`Shop the deals in ${single.city}`, live(single), { variant, icon: 'bag', attrs: { ...EXT, 'data-deals-shop': code, 'data-ext': '' } })
    : btn('Shop the deals', `#dl-stores-${code.toLowerCase()}`, { variant, icon: 'bag', attrs: { 'data-deals-shop': code } });
  return `
    <div class="dl-shop${dark ? ' dl-shop--dark' : ''}">
      ${button}
      <div class="dl-shop__stores" id="dl-stores-${code.toLowerCase()}">
        <p class="dl-shop__label">${stores.length > 1 ? `Live menus in ${esc(group.state.name)}` : 'Live menu'}</p>
        <ul class="dl-shop__chips" role="list">${stores.map((s) => `
          <li><a class="chip" href="${esc(live(s))}"${attrs(EXT)}>${icon('pin')}${esc(s.city)}${icon('external', 'dl-shop__ext')}</a></li>`).join('')}
        </ul>
      </div>
    </div>`;
}

/** state heading: glass eyebrow pill + light display state name + aurora hairline */
function stateHead(ctx, code, { extra = '' } = {}) {
  return `<div class="dl-state-head"${reveal('up')}>
      <p class="dl-state-head__eyebrow">${pill(`Deals · ${code}`, { icon: 'tag' })}</p>
      <h2 class="dl-state-head__title" id="dl-${code.toLowerCase()}-title">${esc(stateName(ctx, code))}</h2>
      ${hair('dl-state-head__rule')}
      ${extra}
    </div>`;
}

/** any other deal group: a plain frosted card */
function extraCard(d) {
  return glassBox(`<h3 class="dl-card__title">${esc(d.title)}</h3>${d.intro ? `<p class="dl-card__intro">${esc(d.intro)}</p>` : ''}${(d.items || []).length ? `<ul class="dl-list" role="list">${d.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}${termsLine(d.terms)}`, { cls: 'dl-extra' });
}

// ---------------------------------------------------------------- /deals/
function dealsHero(ctx, codes) {
  const intro = ctx.site.dealsIntro || {};
  const title = intro.title || ctx.site.promo?.text || 'Deals';
  return `
<section class="section dl-hero on-dark" aria-labelledby="dl-title">
  <div class="plane-back">${starSky('dl-hero__sky')}</div>
  <div class="wrap dl-hero__grid">
    <div class="dl-hero__copy">
      <p class="dl-hero__eyebrow"${reveal('fade')}>${pill(ctx.site.promo?.text || 'Deals', { icon: 'tag' })}</p>
      <h1 id="dl-title" class="dl-hero__title"${reveal('up', 1)}>${accentLast(title, 2, 'dl-hero__accent')}</h1>
      ${hair('dl-hero__rule')}
      ${intro.subtitle ? `<p class="dl-hero__sub"${reveal('up', 2)}>${esc(intro.subtitle)}</p>` : ''}
      ${(intro.paragraphs || []).map((p) => `<p class="dl-hero__p"${reveal('up', 3)}>${esc(p)}</p>`).join('')}
      <nav class="dl-jump" aria-label="Deals by state"${reveal('up', 4)}>
        ${codes.map((c) => `<a class="dl-jump__link" href="#dl-${c.toLowerCase()}"><span class="dl-jump__dot" aria-hidden="true"></span>${esc(stateName(ctx, c))}</a>`).join('')}
      </nav>
      <p class="dl-more"${reveal('up', 5)}>${dealLinks(ctx, codes)}<a class="link-arrow" href="/rewards/terms/">Higher Rewards terms${icon('arrow')}</a></p>
    </div>
    <div class="dl-hero__art" aria-hidden="true">
      <span class="dl-hero__halo"></span>
      <span class="dl-hero__orbit"></span>
      <span class="dl-hero__moon"></span>
      ${cutout('cut-jar', { cls: 'dl-hero__jar', depth: 0.05, float: 'slow', rotate: -8, eager: true, sizes: '(max-width: 700px) 50vw, 300px' })}
      ${orb({ label: 'Deals', sub: 'Every day', cls: 'dl-hero__orb' })}
      ${spark('dl-hero__spark dl-hero__spark--a')}${spark('dl-hero__spark dl-hero__spark--b')}${spark('dl-hero__spark dl-hero__spark--c')}
    </div>
  </div>
</section>`;
}

function msSection(ctx, deals) {
  const daily = deals.find((d) => d.group === 'daily');
  const others = deals.filter((d) => d !== daily);
  const scope = daily && daily.scope ? `<p class="dl-scope">${icon('pin')} As listed on the Star Buds Oxford store page</p>` : '';
  return `
<section class="section dl-ms on-dark" id="dl-ms" aria-labelledby="dl-ms-title">
  <div class="plane-back">${starSky('dl-ms__sky')}</div>
  <div class="wrap dl-ms__grid">
    <div class="dl-ms__main">
      ${stateHead(ctx, 'MS', { extra: scope })}
      ${daily ? board(daily) : ''}
      ${others.map((d) => extraCard(d)).join('')}
      ${shopRow(ctx, 'MS', { dark: true })}
    </div>
    <div class="dl-ms__art" aria-hidden="true">
      <span class="dl-ms__halo"></span>
      ${cutout('cut-bud', { cls: 'dl-ms__bud', depth: -0.05, float: 'slow', rotate: 10, sizes: '(max-width: 700px) 44vw, 300px' })}
      ${spark('dl-ms__spark dl-ms__spark--a')}${spark('dl-ms__spark dl-ms__spark--b')}
    </div>
  </div>
</section>`;
}

function okSection(ctx, deals) {
  const community = deals.find((d) => d.group === 'community');
  const daily = deals.find((d) => d.group === 'daily');
  const early = deals.find((d) => d.group === 'early-bird');
  const rest = deals.filter((d) => ![community, daily, early].includes(d));
  const pct = community && /(\d+%)/.exec(community.intro || '');
  return `
<section class="section dl-ok on-dark" id="dl-ok" aria-labelledby="dl-ok-title">
  <div class="plane-back">${starSky('dl-ok__sky')}</div>
  <div class="wrap">
    <div class="dl-ok__head">
      ${stateHead(ctx, 'OK')}
      ${cutout('cut-concentrate', { cls: 'dl-ok__conc', depth: 0.08, float: 'slow', rotate: -10, sizes: '(max-width: 700px) 30vw, 200px' })}
    </div>
    <div class="dl-ok__top">
      ${community ? glassBox(`
        ${pct ? orb({ label: pct[1], sub: 'every day', cls: 'dl-ok__pct' }) : ''}
        <h3 class="dl-card__title">${esc(community.title)}</h3>
        ${community.intro ? `<p class="dl-card__intro">${hl(esc(community.intro))}</p>` : ''}
        <ul class="dl-ticks" role="list">${community.items.map((i) => `<li>${icon('star')}<span>${esc(i)}</span></li>`).join('')}</ul>
        ${termsLine(community.terms)}`, { cls: 'dl-ok__community', attrs: { 'data-reveal': 'left' } }) : ''}
      ${early ? glassBox(`
        <p class="dl-early__tag">${pill('Morning')}</p>
        <h3 class="dl-card__title">${esc(early.title)}</h3>
        ${early.intro ? `<p class="dl-card__intro">${esc(early.intro)}</p>` : ''}
        ${(early.items || []).length ? `<ul class="dl-list" role="list">${early.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}
        ${termsLine(early.terms)}
        ${spark('dl-early__spark')}`, { cls: 'dl-ok__early', attrs: { 'data-reveal': 'right' } }) : ''}
    </div>
    ${daily ? `
    <div class="dl-ok__daily">
      <div class="dl-ok__daily-head"${reveal('up')}>
        <h3 class="dl-ok__daily-title">${esc(daily.title)}</h3>
        ${daily.intro ? `<p class="dl-card__intro">${esc(daily.intro)}</p>` : ''}
      </div>
      ${dayGrid(daily)}
      ${termsLine(daily.terms)}
    </div>` : ''}
    ${rest.map((d) => extraCard(d)).join('')}
    ${shopRow(ctx, 'OK', { dark: true })}
  </div>
</section>`;
}

function mdSection(ctx, deals) {
  const daily = deals.find((d) => d.group === 'daily');
  const medical = deals.find((d) => d.group === 'medical');
  const fresh = deals.find((d) => d.group === 'new-medical');
  const rest = deals.filter((d) => ![daily, medical, fresh].includes(d));
  const note = daily && daily.note ? `<p class="dl-md__note">${icon('star')}<span>${esc(daily.note)}</span></p>` : '';
  const m = fresh && /^(\d+%\s*OFF)\s+(.+)$/i.exec(fresh.intro || '');
  return `
<section class="section dl-md on-dark" id="dl-md" aria-labelledby="dl-md-title">
  <div class="plane-back">${starSky('dl-md__sky')}</div>
  <div class="wrap">
    ${stateHead(ctx, 'MD', { extra: note })}
    <div class="dl-md__boards">
      ${daily ? board(daily, { tag: 'Adult-use 21+', small: true }) : ''}
      ${medical ? board(medical, { tag: 'Medical', tagTone: 'green', small: true }) : ''}
    </div>
    ${fresh ? `
    <div class="dl-new"${reveal('up')}>
      <div class="ct-glass dl-new__panel">
        <div class="dl-new__copy">
          <p class="dl-new__eyebrow">${icon('star')} Medical</p>
          <h3 class="dl-new__title">${esc(fresh.title)}</h3>
          ${fresh.intro ? `<p class="dl-new__intro">${hl(esc(fresh.intro))}</p>` : ''}
          <ul class="dl-small" role="list">${(fresh.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
          ${termsLine(fresh.terms)}
        </div>
      </div>
      ${orb({ label: m ? m[1] : (fresh.intro || fresh.title), sub: m ? m[2] : '', tone: 'rose', cls: 'dl-new__orb' })}
    </div>` : ''}
    ${rest.map((d) => extraCard(d)).join('')}
    ${shopRow(ctx, 'MD', { dark: true })}
  </div>
</section>`;
}

/** a state with stores but no captured deals: show its captured blurb and its live menu, no invented offers */
function quietState(ctx, code) {
  const st = ctx.states.find((s) => s.code === code) || { name: code };
  return glassBox(`
      <p class="dl-quiet__tag">${pill(code, { icon: 'pin' })}</p>
      <h2 class="dl-quiet__title" id="dl-${code.toLowerCase()}-title">${esc(st.name)}</h2>
      ${st.blurb ? `<p>${esc(st.blurb)}</p>` : ''}
      ${shopRow(ctx, code, { dark: true })}`, { tag: 'section', cls: 'dl-quiet', attrs: { id: `dl-${code.toLowerCase()}`, 'aria-labelledby': `dl-${code.toLowerCase()}-title`, 'data-reveal': 'up' } });
}

function dealsOutro(ctx, quietCodes) {
  const r = ctx.site.rewards || {};
  return `
<section class="section dl-outro on-dark" aria-label="More from Star Buds">
  <div class="plane-back">${starSky('dl-outro__sky')}</div>
  <div class="wrap dl-outro__grid">
    ${quietCodes.map((c) => quietState(ctx, c)).join('')}
    ${glassBox(`
      <p class="dl-quiet__tag">${pill(r.programName || 'Higher Rewards', { tone: 'green' })}</p>
      <h2 class="dl-quiet__title">${esc(r.title || 'Higher Rewards')}</h2>
      ${(r.paragraphs || [])[0] ? `<p>${esc(sentences(r.paragraphs[0])[0])}</p>` : ''}
      <div class="btn-row">${btn('Higher Rewards', '/rewards/', { variant: 'gold' })}${btn('Find a store', '/dispensaries/', { variant: 'ghost', icon: 'pin' })}</div>
      <p class="dl-outro__terms"><a class="link-arrow" href="/rewards/terms/">Higher Rewards terms${icon('arrow')}</a></p>
      ${spark('dl-outro__spark')}`, { cls: 'dl-outro__rewards', attrs: { 'data-reveal': 'up', style: '--i:1' } })}
  </div>
</section>`;
}

const DEALS_SCRIPT = `(function(d){var t=new Date().getDay();
d.querySelectorAll('[data-weekday="'+t+'"]').forEach(function(el){el.classList.add('is-today');var s=el.querySelector('[data-today]');if(s)s.hidden=false;});
function sync(){var s=window.SB&&window.SB.current;d.querySelectorAll('a[data-deals-shop]').forEach(function(a){var st=a.getAttribute('data-deals-shop'),lab=a.querySelector('.btn__label');
if(!a.hasAttribute('data-def-href')){a.setAttribute('data-def-href',a.getAttribute('href'));a.setAttribute('data-def-label',lab.textContent);}
if(s&&s.state===st){a.href=s.liveUrl||window.SB.menuUrl(s,'');a.target='_blank';a.rel='noopener';lab.textContent='Shop the deals in '+s.city;}
else{a.setAttribute('href',a.getAttribute('data-def-href'));if(!a.hasAttribute('data-ext'))a.removeAttribute('target');lab.textContent=a.getAttribute('data-def-label');}});}
d.addEventListener('sb:store',sync);d.addEventListener('DOMContentLoaded',sync);})(document);`;

function dealsPage(ctx) {
  const all = (ctx.site.deals || []).filter(Boolean);
  const by = (c) => all.filter((d) => d.state === c);
  const order = ctx.storesByState.map((g) => g.state.code);
  const withDeals = order.filter((c) => by(c).length);
  const quiet = order.filter((c) => !by(c).length);
  const sections = { MS: msSection, OK: okSection, MD: mdSection };
  // any state with deals but no bespoke section falls back to the Maryland-style cards
  const body = [
    dealsHero(ctx, order),
    ...withDeals.map((c) => (sections[c] || mdSection)(ctx, by(c))),
    dealsOutro(ctx, quiet),
    `<script>${DEALS_SCRIPT}</script>`,
  ].join('\n');
  return {
    path: '/deals/',
    html: page({
      ctx, path: '/deals/', bodyClass: 'page-deals', crumbs: [{ label: 'Deals' }],
      title: 'Deals',
      description: `${ctx.site.dealsIntro?.subtitle || 'Daily deals at Star Buds.'} Daily deals by state: ${withDeals.map((c) => stateName(ctx, c)).join(', ')}.`,
      body,
    }),
  };
}

// ---------------------------------------------------------------- /rewards/
function rwHero(ctx) {
  const r = ctx.site.rewards || {};
  const s = sentences((r.paragraphs || [])[0]);
  const lead = s.slice(1).join(' ');
  const star = ctx.site.brand?.star || '/assets/brand/star-on-dark.png';
  return `
<section class="section rw-hero on-dark" aria-labelledby="rw-title">
  <div class="plane-back">${starSky('rw-hero__sky', '<span class="rw-hero__aurora"></span>')}</div>
  <div class="wrap rw-hero__grid">
    ${glassBox(`
      <p class="rw-hero__eyebrow">${pill(r.programName || 'Higher Rewards', { icon: 'star', tone: 'green' })}</p>
      <h1 id="rw-title" class="rw-hero__title">${accentLast(r.title || 'Higher Rewards', 1, 'rw-hero__accent')}</h1>
      ${hair('rw-hero__rule')}
      ${lead ? `<p class="rw-hero__lead">${esc(lead)}</p>` : ''}
      <div class="btn-row">
        ${r.joinHref ? btn('Join Higher Rewards', r.joinHref, { variant: 'gold', size: 'lg', icon: 'external', attrs: EXT }) : ''}
        ${r.loginHref ? btn('Log in', r.loginHref, { variant: 'ghost', icon: 'external', attrs: EXT }) : ''}
      </div>`, { cls: 'rw-hero__panel', attrs: { 'data-reveal': 'up' } })}
    <div class="rw-hero__art" aria-hidden="true">
      <span class="rw-hero__halo"></span>
      <span class="rw-hero__ring rw-hero__ring--a"></span><span class="rw-hero__ring rw-hero__ring--b"></span>
      <img class="rw-hero__star" src="${esc(star)}" width="256" height="256" alt="" decoding="async">
      ${cutout('cut-bud', { cls: 'rw-hero__bud', depth: -0.05, float: 'slow', rotate: -12, eager: true, sizes: '(max-width: 700px) 30vw, 170px' })}
      ${orb({ label: 'Free', sub: 'to sign up', cls: 'rw-hero__orb' })}
      ${spark('rw-hero__spark rw-hero__spark--a')}${spark('rw-hero__spark rw-hero__spark--b')}
    </div>
  </div>
</section>`;
}

function rwSteps(ctx) {
  const r = ctx.site.rewards || {};
  const s = sentences((r.paragraphs || [])[0]);
  const steps = [
    { n: '01', label: 'Join', text: s[0], cta: r.joinHref ? btn('Join', r.joinHref, { variant: 'gold', size: 'sm', icon: 'external', attrs: EXT }) : '' },
    { n: '02', label: 'Earn', text: (r.points || [])[0], cut: 'cut-gummies' },
    { n: '03', label: 'Redeem', text: (r.points || [])[1] },
  ].filter((x) => x.text);
  if (!steps.length) return '';
  return `
<section class="section rw-steps on-dark" aria-labelledby="rw-steps-title">
  <div class="plane-back">${starSky('rw-steps__sky')}</div>
  <div class="wrap">
    <div class="rw-head">
      <p class="rw-head__eyebrow"${reveal('fade')}>${pill(r.programName || 'Higher Rewards', { icon: 'star' })}</p>
      <h2 id="rw-steps-title" class="rw-head__title"${reveal('up', 1)}>How it works</h2>
      ${hair('rw-head__rule')}
    </div>
    <ol class="rw-steps__list" role="list" data-stagger>${steps.map((x, i) => `
      <li class="ct-glass rw-step rw-step--${i}">
        ${x.cut ? cutout(x.cut, { cls: 'rw-step__cut', depth: 0, float: 'slow', rotate: 8, sizes: '(max-width: 700px) 30vw, 160px' }) : spark('rw-step__spark')}
        <span class="rw-step__n" aria-hidden="true">${x.n}</span>
        <h3 class="rw-step__label">${esc(x.label)}</h3>
        <p class="rw-step__text">${esc(x.text)}</p>
        ${x.cta || ''}
      </li>`).join('')}
    </ol>
  </div>
</section>`;
}

/** "1,000 POINTS" -> number + unit spans (text content unchanged) */
function tierPoints(p) {
  const m = /^([\d,.]+K?)\s+(.+)$/i.exec(String(p));
  return m ? `<span class="rw-tier__num">${esc(m[1])}</span> <span class="rw-tier__unit">${esc(m[2])}</span>` : `<span class="rw-tier__unit">${esc(p)}</span>`;
}

function rwTiers(ctx) {
  const r = ctx.site.rewards || {};
  const groups = (r.byState || []).filter((g) => g && g.state);
  if (!groups.length) return '';
  return `
<section class="section rw-tiers on-dark" aria-labelledby="rw-tiers-title">
  <div class="plane-back">${starSky('rw-tiers__sky')}</div>
  <div class="wrap">
    <div class="rw-head rw-head--split">
      <div>
        <p class="rw-head__eyebrow"${reveal('fade')}>${pill('By state', { icon: 'pin' })}</p>
        <h2 id="rw-tiers-title" class="rw-head__title"${reveal('up', 1)}>Points <span class="rw-amp">&amp;</span> rewards</h2>
      </div>
      <div class="tabs rw-tabs" role="tablist" aria-label="Rewards by state" data-tabs${reveal('up', 2)}>
        ${groups.map((g, i) => `<button type="button" class="tab rw-tab" role="tab" id="rw-tab-${esc(g.state)}" aria-controls="rw-panel-${esc(g.state)}" aria-selected="${i === 0}" data-tab-state="${esc(g.state)}"${i ? ' tabindex="-1"' : ''}><span class="rw-tab__code">${esc(g.state)}</span><span class="rw-tab__name">${esc(stateName(ctx, g.state))}</span></button>`).join('')}
      </div>
    </div>
    ${groups.map((g, i) => {
      const tiers = (g.tiers || []).filter((t) => !t.prize);
      const name = stateName(ctx, g.state);
      return `
    <div class="rw-panel" role="tabpanel" id="rw-panel-${esc(g.state)}" aria-labelledby="rw-tab-${esc(g.state)}"${i ? ' hidden' : ''}>
      ${glassBox(`
        <div class="rw-panel__copy">
          ${String(g.title || name).toLowerCase() === name.toLowerCase()
            ? `<h3 class="rw-panel__state">${esc(name)}</h3>`
            : `<p class="rw-panel__state" aria-hidden="true">${esc(name)}</p>
          <h3 class="rw-panel__title">${esc(g.title)}</h3>`}
          ${g.intro ? `<p class="rw-panel__intro">${hl(esc(g.intro))}</p>` : ''}
          ${g.outro ? `<p class="rw-panel__outro">${esc(g.outro)}</p>` : ''}
          ${g.joinHref ? `<div class="btn-row">${btn(`Join in ${name}`, g.joinHref, { variant: 'gold', icon: 'external', attrs: EXT })}</div>` : ''}
        </div>
        ${tiers.length ? `<ol class="rw-ladder" role="list" style="--n:${tiers.length}">${tiers.map((t, k) => `
          <li class="rw-tier" style="--k:${k}">
            <span class="rw-tier__badge">${tierPoints(t.points)}</span>
            <span class="rw-tier__reward"><span>${hl(esc(t.reward))}</span></span>
          </li>`).join('')}
        </ol>` : ''}`, { cls: `rw-panel__glass${tiers.length ? '' : ' rw-panel__glass--solo'}` })}
    </div>`;
    }).join('')}
    <noscript><style>.rw-panel[hidden]{display:block!important;margin-top:28px}</style></noscript>
  </div>
  ${cutout('cut-tincture', { cls: 'rw-tiers__tincture', depth: 0.1, float: 'slow', rotate: 10, sizes: '(max-width: 700px) 24vw, 170px' })}
</section>`;
}

function rwApps(ctx) {
  const r = ctx.site.rewards || {};
  const apps = ctx.site.apps || {};
  const star = ctx.site.brand?.star || '/assets/brand/star-on-dark.png';
  return `
<section class="section rw-apps on-dark" aria-labelledby="rw-apps-title">
  <div class="plane-back">${starSky('rw-apps__sky')}</div>
  <div class="wrap rw-apps__grid">
    <div class="rw-plaque" aria-hidden="true"${reveal('left')}>
      <div class="ct-glass rw-plaque__plate">
        <span class="rw-plaque__halo"></span>
        <img class="rw-plaque__star" src="${esc(star)}" width="256" height="256" alt="" loading="lazy" decoding="async">
        <span class="rw-plaque__name">${esc(r.title || 'Higher Rewards')}</span>
        ${hair('rw-plaque__rule')}
        <span class="rw-plaque__sub">${esc(r.programName || '')}</span>
      </div>
      ${cutout('cut-vape', { cls: 'rw-plaque__vape', depth: 0.1, float: 'slow', rotate: 18, sizes: '(max-width: 700px) 22vw, 130px' })}
      ${spark('rw-plaque__spark')}
    </div>
    <div class="rw-apps__copy"${reveal('right')}>
      <p class="rw-head__eyebrow">${pill('Get the app', { icon: 'phoneApp' })}</p>
      <h2 id="rw-apps-title" class="rw-apps__title">App Store &amp; Google Play</h2>
      <div class="btn-row">
        ${apps.ios ? btn('App Store', apps.ios, { variant: 'dark', icon: 'external', attrs: EXT }) : ''}
        ${apps.android ? btn('Google Play', apps.android, { variant: 'dark', icon: 'external', attrs: EXT }) : ''}
      </div>
      <hr class="rw-apps__rule">
      <p class="rw-apps__terms-title">${icon('tag')} Terms</p>
      <div class="rw-apps__links">
        <a class="link-arrow" href="/rewards/terms/">Terms and conditions${icon('arrow')}</a>
        ${r.loginHref ? `<a class="link-arrow" href="${esc(r.loginHref)}"${attrs(EXT)}>Log in${icon('external')}</a>` : ''}
        <a class="link-arrow" href="/deals/">Deals${icon('arrow')}</a>
        ${dealLinks(ctx, (ctx.storesByState || []).map((g) => g.state.code))}
      </div>
    </div>
  </div>
</section>`;
}

function rewardsPage(ctx) {
  const r = ctx.site.rewards || {};
  const s = sentences((r.paragraphs || [])[0]);
  return {
    path: '/rewards/',
    html: page({
      ctx, path: '/rewards/', bodyClass: 'page-rewards', crumbs: [{ label: 'Higher Rewards' }],
      title: r.title || 'Higher Rewards',
      description: s[0] || 'Higher Rewards at Star Buds.',
      body: [rwHero(ctx), rwSteps(ctx), rwTiers(ctx), rwApps(ctx)].join('\n'),
    }),
  };
}

// ---------------------------------------------------------------- /404.html
function notFoundPage(ctx) {
  const body = `
<section class="section nf on-dark" aria-labelledby="nf-title">
  <div class="plane-back">
    ${starSky('nf__sky')}
    <p class="nf__big" aria-hidden="true">404</p>
  </div>
  <div class="wrap nf__grid">
    ${glassBox(`
      <p class="nf__eyebrow">${pill('Error 404', { icon: 'star' })}</p>
      <h1 id="nf-title" class="nf__title">Page not <span class="nf__accent">found</span></h1>
      ${hair('nf__rule')}
      <p class="nf__lead">This page isn't here. Head back home, or choose your location and open its live menu.</p>
      <div class="btn-row">
        ${btn('Back to home', '/', { variant: 'gold', size: 'lg' })}
        ${btn('Find a store', '/dispensaries/', { variant: 'ghost', icon: 'pin' })}
      </div>
      <p class="nf__more"><a class="link-arrow" href="/deals/">Deals${icon('arrow')}</a> <a class="link-arrow" href="/rewards/">Higher Rewards${icon('arrow')}</a></p>`, { cls: 'nf__panel', attrs: { 'data-reveal': 'up' } })}
    <div class="nf__art" aria-hidden="true">
      <span class="nf__halo"></span>
      <span class="nf__orbit"></span>
      ${cutout('cut-bud', { cls: 'nf__bud', depth: 0.06, float: 'slow', rotate: 8, eager: true, sizes: '(max-width: 700px) 44vw, 240px' })}
      ${spark('nf__spark nf__spark--a')}${spark('nf__spark nf__spark--b')}${spark('nf__spark nf__spark--c')}
    </div>
  </div>
  <div class="nf__ticker">${marquee(ctx.categories.map((c) => c.label), { strap: false })}</div>
</section>`;
  return { path: '/404.html', html: page({ ctx, path: '/404.html', bodyClass: 'page-404', title: 'Page not found', description: 'This page could not be found. Go back to the Star Buds home page or choose a store.', body }) };
}

export function render(ctx) {
  return [dealsPage(ctx), rewardsPage(ctx), notFoundPage(ctx)];
}
