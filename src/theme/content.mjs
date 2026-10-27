// content.mjs - CONTENT-R1 lane: /deals/, /rewards/ and /404.html in the "Iron Star" language (REVISION-1).
// Copy: only site.json text (dealsIntro, deals[], rewards, apps, states, stores) plus neutral UI labels
// (BUILD-CONTRACT 2). Deal lines are shown verbatim; parentheticals are set as fine print and prices/percentages are
// highlighted, but no word is changed. Rewards prize tiers (prize:true, 250K-point cars) are left out on purpose.
// Local classes are prefixed dl- (deals), rw- (rewards), nf- (not found); styles live in src/styles/content.css.
// Pop-era pieces are gone: no sticker()/starburst(), no pop-* cut-outs, no g-hero/g-glass*/glass-dark media.
// Revision 2 (RESOURCES-R2): breadcrumbs (page({ crumbs })), links to /rewards/terms/ and to the state deals pages
// /dispensaries/<state>/deals/ (LOCATIONS-R2 builds them), and /dispensaries/ in place of the /stores/ redirect stub.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { page, esc, attrs, icon, btn, img, glass, patch, seal, rocker, halftone, leaves, grain, cutout, patchCut, seam, pinstripe, marquee, reveal } from './shell.mjs';

const EXT = { target: '_blank', rel: 'noopener' };
const WEEK = ['SUN', 'MON', 'TUES', 'WEDNES', 'THURS', 'FRI', 'SATUR'];
const ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const has = (rel) => fs.existsSync(path.join(ROOT, rel));

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

/** the "Today" marker: an oxblood embroidered tab, shown by the page script on the matching weekday */
const todayTag = () => `<span class="patch patch--red patch--sm dl-today" data-today hidden><span class="patch__text">Today</span></span>`;

/** background loop when its files exist (assets/media/<base>.webm + .mp4 + -poster.webp), else the generated still */
function backdrop({ cls, base, still, label, eager = false }) {
  const media = `assets/media/${base}`;
  const stillImg = img(still, { cls: `cover ${cls}__still`, alt: '', sizes: '100vw', eager });
  if (!(has(media + '.webm') && has(media + '.mp4') && has(media + '-poster.webp'))) return stillImg;
  return `${stillImg}
    <video class="cover bg-video ${cls}__video" autoplay muted loop playsinline preload="metadata" poster="/${media}-poster.webp" aria-hidden="true" tabindex="-1" data-ai="generated" title="${esc(label)}">
      <source src="/${media}.webm" type="video/webm"><source src="/${media}.mp4" type="video/mp4">
    </video>`;
}

/** split a heading so its last `n` words carry the antique-gold accent */
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

/** bone price board rows (Mississippi, Maryland) */
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

/** a bone price board: double ink frame, blackletter title, day rows, terms */
function board(deal, { tag = '', tagTone = 'leather', cls = '', small = false } = {}) {
  return `
    <article class="dl-board ${cls}"${reveal('up')}>
      <div class="dl-board__inner">
        <header class="dl-board__head">
          ${tag ? `<p class="dl-board__tag">${patch(tag, { tone: tagTone, size: 'sm' })}</p>` : ''}
          <h3 class="dl-board__title${small ? ' dl-board__title--sm' : ''}">${esc(deal.title)}</h3>
          ${deal.intro ? `<p class="dl-board__intro">${esc(deal.intro)}</p>` : ''}
          ${pinstripe({ tone: 'ink', cls: 'dl-board__rule' })}
        </header>
        ${boardRows(deal)}
        ${termsLine(deal.terms)}
      </div>
    </article>`;
}

/** tattoo-flash day cards on leather (Oklahoma) */
function flashGrid(deal) {
  const rows = dayRows(deal);
  return `<ul class="dl-flash" role="list" data-stagger>${rows.map((r) => {
    const wd = weekday(r.day);
    return `
      <li class="dl-flash__card"${wd >= 0 ? ` data-weekday="${wd}"` : ''}>
        <span class="dl-flash__stitch stitch" aria-hidden="true"></span>
        <span class="dl-flash__top">${wd >= 0 ? `<span class="dl-flash__abbr numeral" aria-hidden="true">${ABBR[wd]}</span>` : ''}${todayTag()}</span>
        <p class="dl-flash__name">${esc(r.day)}</p>
        <p class="dl-flash__deal">${dealText(r.deal)}</p>
      </li>`;
  }).join('')}${rows.length % 2 ? `
      <li class="dl-flash__art" aria-hidden="true">${patchCut('flash-bud', { cls: 'dl-flash__bud', depth: 0, rotate: 3, sizes: '(max-width: 700px) 40vw, 220px' })}</li>` : ''}
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

/** state heading: embroidered eyebrow tab + blackletter state name + pinstripe */
function stateHead(ctx, code, { dark = false, extra = '' } = {}) {
  return `<div class="dl-state-head"${reveal('up')}>
      <p class="dl-state-head__eyebrow">${patch(`Deals · ${code}`, { tone: dark ? 'gold' : 'leather', icon: 'tag' })}</p>
      <h2 class="h-display dl-state-head__title sheen" id="dl-${code.toLowerCase()}-title">${esc(stateName(ctx, code))}</h2>
      ${pinstripe({ tone: dark ? 'gold' : 'ink', cls: 'dl-state-head__rule' })}
      ${extra}
    </div>`;
}

/** any other deal group: a plain card (smoked glass on dark, bone glass on light) */
function extraCard(d, dark) {
  return glass(`<h3 class="dl-card__title">${esc(d.title)}</h3>${d.intro ? `<p class="dl-card__intro">${esc(d.intro)}</p>` : ''}${(d.items || []).length ? `<ul class="dl-list" role="list">${d.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}${termsLine(d.terms)}`, { tone: dark ? 'smoke' : 'bone', stitch: true, cls: 'dl-extra' });
}

// ---------------------------------------------------------------- /deals/
function dealsHero(ctx, codes) {
  const intro = ctx.site.dealsIntro || {};
  const title = intro.title || ctx.site.promo?.text || 'Deals';
  return `
<section class="section dl-hero on-dark" aria-labelledby="dl-title">
  <div class="plane-back">
    <div class="leather-bg"></div>
    <div class="dl-hero__leaves">${leaves({ tone: 'gold' })}</div>
    ${halftone({ color: 'gold', at: 'br', cls: 'dl-hero__dots' })}
    ${grain()}
    <div class="vignette"></div>
  </div>
  <div class="wrap dl-hero__grid">
    <div class="dl-hero__copy">
      <p class="dl-hero__eyebrow"${reveal('fade')}>${patch(ctx.site.promo?.text || 'Deals', { tone: 'gold', icon: 'tag' })}</p>
      <h1 id="dl-title" class="dl-hero__title"${reveal('up', 1)}>${accentLast(title, 2, 'dl-hero__accent')}</h1>
      <div class="dl-hero__rule"${reveal('fade', 2)}>${pinstripe()}</div>
      ${intro.subtitle ? `<p class="dl-hero__sub"${reveal('up', 2)}>${esc(intro.subtitle)}</p>` : ''}
      ${(intro.paragraphs || []).map((p) => `<p class="dl-hero__p"${reveal('up', 3)}>${esc(p)}</p>`).join('')}
      <nav class="dl-jump" aria-label="Deals by state"${reveal('up', 4)}>
        ${codes.map((c) => `<a class="dl-jump__link" href="#dl-${c.toLowerCase()}">${rocker(stateName(ctx, c), { tone: 'gold', radius: 260, band: 46, angle: 24, decorative: true, cls: 'dl-jump__rocker' })}<span class="sr-only">${esc(stateName(ctx, c))}</span></a>`).join('')}
      </nav>
      <p class="dl-more"${reveal('up', 5)}>${dealLinks(ctx, codes)}<a class="link-arrow" href="/rewards/terms/">Higher Rewards terms${icon('arrow')}</a></p>
    </div>
    <div class="dl-hero__art" aria-hidden="true">
      <div class="dl-sheet" data-depth="0.05">
        ${halftone({ color: 'red', at: 'full', cls: 'dl-sheet__dots' })}
        <span class="dl-sheet__corner dl-sheet__corner--tl"></span><span class="dl-sheet__corner dl-sheet__corner--br"></span>
        ${patchCut('flash-bud', { cls: 'dl-sheet__flash', depth: 0, rotate: 0, eager: true, sizes: '(max-width: 900px) 56vw, 380px' })}
      </div>
      ${seal({ label: 'Deals', sub: 'Every day', tone: 'gold', cls: 'dl-hero__seal' })}
    </div>
  </div>
  ${cutout('cut-jar', { cls: 'dl-hero__jar', depth: 0.14, float: 'slow', rotate: -8, eager: true, sizes: '(max-width: 700px) 40vw, 280px' })}
</section>`;
}

function msSection(ctx, deals) {
  const daily = deals.find((d) => d.group === 'daily');
  const others = deals.filter((d) => d !== daily);
  const scope = daily && daily.scope ? `<p class="dl-scope">${icon('pin')} As listed on the Star Buds Oxford store page</p>` : '';
  return `
<section class="section section--bone dl-ms" id="dl-ms" aria-labelledby="dl-ms-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'red', at: 'bl', cls: 'dl-dots-soft' })}${grain({ cls: 'dl-grain-bone' })}</div>
  ${seam({ kind: 'double' })}
  <div class="wrap dl-ms__grid">
    <div class="dl-ms__main">
      ${stateHead(ctx, 'MS', { extra: scope })}
      ${daily ? board(daily) : ''}
      ${others.map((d) => extraCard(d, false)).join('')}
      ${shopRow(ctx, 'MS')}
    </div>
    <div class="dl-ms__art" aria-hidden="true">
      ${patchCut('flash-leaf', { cls: 'dl-ms__flash', depth: 0.08, rotate: 4, sizes: '(max-width: 900px) 60vw, 440px' })}
    </div>
  </div>
  ${cutout('cut-bud', { cls: 'dl-ms__bud', depth: -0.1, float: 'slow', rotate: 10, sizes: '(max-width: 700px) 34vw, 240px' })}
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
  <div class="plane-back">
    <div class="leather-bg"></div>
    ${leaves({ tone: 'gold', cls: 'dl-ok__leaves' })}
    ${halftone({ color: 'gold', at: 'tr' })}
    ${grain()}
  </div>
  ${seam()}
  <div class="wrap">
    <div class="dl-ok__head">
      ${stateHead(ctx, 'OK', { dark: true })}
      ${cutout('cut-concentrate', { cls: 'dl-ok__conc', depth: 0.12, float: 'slow', rotate: -10, sizes: '(max-width: 700px) 30vw, 200px' })}
    </div>
    <div class="dl-ok__top">
      ${community ? glass(`
        ${pct ? seal({ label: pct[1], sub: 'every day', tone: 'gold', cls: 'dl-ok__pct' }) : ''}
        <h3 class="dl-card__title">${esc(community.title)}</h3>
        ${community.intro ? `<p class="dl-card__intro">${hl(esc(community.intro))}</p>` : ''}
        <ul class="dl-ticks" role="list">${community.items.map((i) => `<li>${icon('star')}<span>${esc(i)}</span></li>`).join('')}</ul>
        ${termsLine(community.terms)}`, { stitch: true, cls: 'dl-ok__community', attrs: { 'data-reveal': 'left' } }) : ''}
      ${early ? glass(`
        <p class="dl-early__tag">${patch('Morning', { tone: 'bone', size: 'sm' })}</p>
        <h3 class="dl-card__title">${esc(early.title)}</h3>
        ${early.intro ? `<p class="dl-card__intro">${esc(early.intro)}</p>` : ''}
        ${(early.items || []).length ? `<ul class="dl-list" role="list">${early.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}
        ${termsLine(early.terms)}
        ${patchCut('patch-star', { cls: 'dl-early__patch', depth: 0, rotate: 8, sizes: '120px' })}`, { edge: 'chrome', cls: 'dl-ok__early', attrs: { 'data-reveal': 'right' } }) : ''}
    </div>
    ${daily ? `
    <div class="dl-ok__daily">
      <div class="dl-ok__daily-head"${reveal('up')}>
        <h3 class="dl-ok__daily-title">${esc(daily.title)}</h3>
        ${daily.intro ? `<p class="dl-card__intro">${esc(daily.intro)}</p>` : ''}
      </div>
      ${flashGrid(daily)}
      ${termsLine(daily.terms)}
    </div>` : ''}
    ${rest.map((d) => extraCard(d, true)).join('')}
    ${shopRow(ctx, 'OK', { dark: true })}
  </div>
  ${cutout('cut-preroll', { cls: 'dl-ok__roll', depth: -0.12, float: 'slow', rotate: -20, sizes: '(max-width: 700px) 46vw, 340px' })}
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
<section class="section section--parchment dl-md" id="dl-md" aria-labelledby="dl-md-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'ink', at: 'top' })}${grain({ cls: 'dl-grain-bone' })}</div>
  ${seam({ kind: 'double' })}
  <div class="wrap">
    ${stateHead(ctx, 'MD', { extra: note })}
    <div class="dl-md__boards">
      ${daily ? board(daily, { tag: 'Adult-use 21+', tagTone: 'leather', small: true }) : ''}
      ${medical ? board(medical, { tag: 'Medical', tagTone: 'green', small: true }) : ''}
    </div>
    ${fresh ? `
    <div class="dl-new"${reveal('up')}>
      <div class="dl-new__panel">
        <span class="dl-new__stitch stitch stitch--draw" aria-hidden="true"></span>
        ${halftone({ color: 'red', at: 'tr', cls: 'dl-new__dots' })}
        <div class="dl-new__copy">
          <p class="eyebrow">${icon('star')} Medical</p>
          <h3 class="dl-new__title">${esc(fresh.title)}</h3>
          ${fresh.intro ? `<p class="dl-new__intro">${hl(esc(fresh.intro))}</p>` : ''}
          <ul class="dl-small" role="list">${(fresh.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
          ${termsLine(fresh.terms)}
        </div>
      </div>
      ${seal({ label: m ? m[1] : (fresh.intro || fresh.title), sub: m ? m[2] : '', tone: 'red', cls: 'dl-new__seal' })}
    </div>` : ''}
    ${rest.map((d) => extraCard(d, false)).join('')}
    ${shopRow(ctx, 'MD')}
  </div>
  ${cutout('cut-vape', { cls: 'dl-md__vape', depth: 0.14, float: 'slow', rotate: 16, sizes: '(max-width: 700px) 22vw, 160px' })}
</section>`;
}

/** a state with stores but no captured deals: show its captured blurb and its live menu, no invented offers */
function quietState(ctx, code) {
  const st = ctx.states.find((s) => s.code === code) || { name: code };
  return glass(`
      <p class="dl-quiet__tag">${patch(code, { tone: 'gold', icon: 'pin', size: 'sm' })}</p>
      <h2 class="dl-quiet__title" id="dl-${code.toLowerCase()}-title">${esc(st.name)}</h2>
      ${st.blurb ? `<p>${esc(st.blurb)}</p>` : ''}
      ${shopRow(ctx, code, { dark: true })}`, { stitch: true, cls: 'dl-quiet', attrs: { id: `dl-${code.toLowerCase()}`, 'aria-labelledby': `dl-${code.toLowerCase()}-title`, 'data-reveal': 'up' }, tag: 'section' });
}

function dealsOutro(ctx, quietCodes) {
  const r = ctx.site.rewards || {};
  return `
<section class="section dl-outro on-dark" aria-label="More from Star Buds">
  <div class="plane-back">${img('g-smoke', { cls: 'cover dl-outro__smoke', alt: '', sizes: '100vw' })}<div class="dl-outro__shade"></div>${leaves({ tone: 'gold', cls: 'dl-outro__leaves' })}${halftone({ color: 'green', at: 'br' })}${grain()}</div>
  ${seam()}
  <div class="wrap dl-outro__grid">
    ${quietCodes.map((c) => quietState(ctx, c)).join('')}
    ${glass(`
      <p class="dl-quiet__tag">${patch(r.programName || 'Higher Rewards', { tone: 'green', size: 'sm' })}</p>
      <h2 class="dl-quiet__title">${esc(r.title || 'Higher Rewards')}</h2>
      ${(r.paragraphs || [])[0] ? `<p>${esc(sentences(r.paragraphs[0])[0])}</p>` : ''}
      <div class="btn-row">${btn('Higher Rewards', '/rewards/', { variant: 'gold' })}${btn('Find a store', '/dispensaries/', { variant: 'ghost', icon: 'pin' })}</div>
      <p class="dl-outro__terms"><a class="link-arrow" href="/rewards/terms/">Higher Rewards terms${icon('arrow')}</a></p>`, { edge: 'chrome', cls: 'dl-outro__rewards', attrs: { 'data-reveal': 'up', style: '--i:1' } })}
  </div>
  ${patchCut('patch-wings', { cls: 'dl-outro__wings', depth: 0.05, rotate: -4, sizes: '(max-width: 700px) 50vw, 300px' })}
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
  // any state with deals but no bespoke section falls back to the Maryland-style boards
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
  return `
<section class="section rw-hero on-dark" aria-labelledby="rw-title">
  <div class="plane-back">
    ${backdrop({ cls: 'rw-hero', base: 'smoke-ember', still: 'g-smoke', label: 'Smoke and golden embers drifting in darkness (AI-generated loop)', eager: true })}
    <div class="rw-hero__shade"></div>
    ${leaves({ tone: 'gold', cls: 'rw-hero__leaves' })}
    ${halftone({ color: 'gold', at: 'bl', cls: 'rw-hero__dots' })}
    ${grain()}
    <div class="vignette"></div>
  </div>
  <div class="wrap rw-hero__grid">
    ${glass(`
      <p class="rw-hero__eyebrow">${patch(r.programName || 'Higher Rewards', { tone: 'green', size: 'sm', icon: 'star' })}</p>
      <h1 id="rw-title" class="rw-hero__title">${accentLast(r.title || 'Higher Rewards', 1, 'rw-hero__accent')}</h1>
      ${pinstripe({ cls: 'rw-hero__rule' })}
      ${lead ? `<p class="rw-hero__lead">${esc(lead)}</p>` : ''}
      <div class="btn-row">
        ${r.joinHref ? btn('Join Higher Rewards', r.joinHref, { variant: 'gold', size: 'lg', icon: 'external', attrs: EXT }) : ''}
        ${r.loginHref ? btn('Log in', r.loginHref, { variant: 'ghost', icon: 'external', attrs: EXT }) : ''}
      </div>`, { stitch: true, cls: 'rw-hero__panel', attrs: { 'data-reveal': 'up' } })}
    <div class="rw-hero__art" aria-hidden="true">
      ${patchCut('patch-wings', { cls: 'rw-hero__wings', depth: 0.08, rotate: -3, eager: true, sizes: '(max-width: 900px) 70vw, 460px' })}
      ${seal({ label: 'Free', sub: 'to sign up', tone: 'green', cls: 'rw-hero__seal' })}
    </div>
  </div>
  ${cutout('chrome-star', { cls: 'rw-hero__star', depth: -0.1, float: 'slow', rotate: 12, sizes: '(max-width: 700px) 26vw, 150px' })}
</section>`;
}

function rwSteps(ctx) {
  const r = ctx.site.rewards || {};
  const s = sentences((r.paragraphs || [])[0]);
  const steps = [
    { n: '01', label: 'Join', text: s[0], cut: 'patch-leaf', patch: true, cta: r.joinHref ? btn('Join', r.joinHref, { variant: 'gold', size: 'sm', icon: 'external', attrs: EXT }) : '' },
    { n: '02', label: 'Earn', text: (r.points || [])[0], cut: 'cut-bud' },
    { n: '03', label: 'Redeem', text: (r.points || [])[1], cut: 'patch-star', patch: true },
  ].filter((x) => x.text);
  if (!steps.length) return '';
  return `
<section class="section section--bone rw-steps" aria-labelledby="rw-steps-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'ink', at: 'tr' })}${grain({ cls: 'dl-grain-bone' })}</div>
  ${seam({ kind: 'double' })}
  <div class="wrap">
    <div class="rw-head">
      <p class="rw-head__eyebrow"${reveal('fade')}>${patch(r.programName || 'Higher Rewards', { tone: 'leather', icon: 'star' })}</p>
      <h2 id="rw-steps-title" class="h-display rw-head__title sheen"${reveal('up', 1)}>How it works</h2>
      ${pinstripe({ tone: 'ink', cls: 'rw-head__rule' })}
    </div>
    <ol class="rw-steps__list" role="list" data-stagger>${steps.map((x, i) => `
      <li class="rw-step rw-step--${i}">
        <span class="rw-step__stitch stitch" aria-hidden="true"></span>
        ${x.patch ? patchCut(x.cut, { cls: `rw-step__cut rw-step__cut--patch rw-step__cut--${x.cut}`, depth: 0, rotate: 4, sizes: '(max-width: 700px) 30vw, 140px' }) : cutout(x.cut, { cls: 'rw-step__cut', depth: 0, float: false, sizes: '(max-width: 700px) 30vw, 170px' })}
        <span class="rw-step__n numeral" aria-hidden="true">${x.n}</span>
        <h3 class="rw-step__label">${esc(x.label)}</h3>
        <p class="rw-step__text">${esc(x.text)}</p>
        ${x.cta || ''}
      </li>`).join('')}
    </ol>
  </div>
</section>`;
}

/** "1,000 POINTS" -> numeral + unit spans (text content unchanged) */
function tierPoints(p) {
  const m = /^([\d,.]+K?)\s+(.+)$/i.exec(String(p));
  return m ? `<span class="rw-tier__num numeral">${esc(m[1])}</span> <span class="rw-tier__unit">${esc(m[2])}</span>` : `<span class="rw-tier__unit">${esc(p)}</span>`;
}

function rwTiers(ctx) {
  const r = ctx.site.rewards || {};
  const groups = (r.byState || []).filter((g) => g && g.state);
  if (!groups.length) return '';
  return `
<section class="section rw-tiers on-dark" aria-labelledby="rw-tiers-title">
  <div class="plane-back">
    <div class="leather-bg"></div>
    ${img('g-smoke', { cls: 'cover rw-tiers__smoke', alt: '', sizes: '100vw' })}
    <div class="rw-tiers__shade"></div>
    ${leaves({ tone: 'gold', cls: 'rw-tiers__leaves' })}
    ${halftone({ color: 'green', at: 'br' })}
    ${grain()}
  </div>
  ${seam()}
  <div class="wrap">
    <div class="rw-head rw-head--split">
      <div>
        <p class="rw-head__eyebrow"${reveal('fade')}>${patch('By state', { tone: 'gold', icon: 'pin' })}</p>
        <h2 id="rw-tiers-title" class="h-display rw-head__title"${reveal('up', 1)}>Points <span class="rw-amp">&amp;</span> rewards</h2>
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
      ${glass(`
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
        </ol>` : ''}`, { stitch: true, cls: `rw-panel__glass${tiers.length ? '' : ' rw-panel__glass--solo'}` })}
    </div>`;
    }).join('')}
    <noscript><style>.rw-panel[hidden]{display:block!important;margin-top:28px}</style></noscript>
  </div>
  ${cutout('cut-tincture', { cls: 'rw-tiers__tincture', depth: 0.14, float: 'slow', rotate: 10, sizes: '(max-width: 700px) 26vw, 190px' })}
</section>`;
}

function rwApps(ctx) {
  const r = ctx.site.rewards || {};
  const apps = ctx.site.apps || {};
  const star = ctx.site.brand?.star || '/assets/brand/star-on-dark.png';
  return `
<section class="section section--parchment rw-apps" aria-labelledby="rw-apps-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'ink', at: 'tl' })}${grain({ cls: 'dl-grain-bone' })}</div>
  ${seam({ kind: 'double' })}
  <div class="wrap rw-apps__grid">
    <div class="rw-plaque" aria-hidden="true"${reveal('left')}>
      <div class="rw-plaque__plate">
        <span class="rw-plaque__stitch stitch stitch--draw"></span>
        <span class="rw-plaque__rivet rw-plaque__rivet--tl"></span><span class="rw-plaque__rivet rw-plaque__rivet--tr"></span><span class="rw-plaque__rivet rw-plaque__rivet--bl"></span><span class="rw-plaque__rivet rw-plaque__rivet--br"></span>
        <img class="rw-plaque__star" src="${esc(star)}" width="256" height="256" alt="" loading="lazy" decoding="async">
        <span class="rw-plaque__name">${esc(r.title || 'Higher Rewards')}</span>
        ${pinstripe({ cls: 'rw-plaque__rule' })}
        <span class="rw-plaque__sub">${esc(r.programName || '')}</span>
      </div>
      ${cutout('cut-vape', { cls: 'rw-plaque__vape', depth: 0.1, float: 'slow', rotate: 18, sizes: '(max-width: 700px) 22vw, 150px' })}
    </div>
    <div class="rw-apps__copy"${reveal('right')}>
      <p class="rw-head__eyebrow">${patch('Get the app', { tone: 'leather', icon: 'phoneApp' })}</p>
      <h2 id="rw-apps-title" class="h-display rw-apps__title">App Store &amp; Google Play</h2>
      <div class="btn-row">
        ${apps.ios ? btn('App Store', apps.ios, { variant: 'dark', icon: 'external', attrs: EXT }) : ''}
        ${apps.android ? btn('Google Play', apps.android, { variant: 'dark', icon: 'external', attrs: EXT }) : ''}
      </div>
      <hr class="rule-stitch">
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
    <div class="leather-bg"></div>
    ${leaves({ tone: 'gold', cls: 'nf__leaves' })}
    ${halftone({ color: 'gold', at: 'tr' })}
    ${grain()}
    <div class="vignette"></div>
    <p class="nf__big" aria-hidden="true">404</p>
  </div>
  <div class="wrap nf__grid">
    ${glass(`
      <p class="nf__eyebrow">${patch('Error 404', { tone: 'gold', icon: 'star', size: 'sm' })}</p>
      <h1 id="nf-title" class="nf__title">Page not <span class="nf__accent">found</span></h1>
      ${pinstripe({ cls: 'nf__rule' })}
      <p class="nf__lead">This page isn't here. Head back home, or choose your location and open its live menu.</p>
      <div class="btn-row">
        ${btn('Back to home', '/', { variant: 'gold', size: 'lg' })}
        ${btn('Find a store', '/dispensaries/', { variant: 'ghost', icon: 'pin' })}
      </div>
      <p class="nf__more"><a class="link-arrow" href="/deals/">Deals${icon('arrow')}</a> <a class="link-arrow" href="/rewards/">Higher Rewards${icon('arrow')}</a></p>`, { stitch: true, cls: 'nf__panel', attrs: { 'data-reveal': 'up' } })}
    <div class="nf__art" aria-hidden="true">
      ${patchCut('patch-leaf', { cls: 'nf__patch', depth: 0.08, rotate: 5, eager: true, sizes: '(max-width: 900px) 40vw, 300px' })}
      ${cutout('chrome-star', { cls: 'nf__star', depth: -0.1, float: 'slow', rotate: -12, eager: true, sizes: '(max-width: 700px) 22vw, 140px' })}
    </div>
  </div>
  ${cutout('cut-bud', { cls: 'nf__bud', depth: 0.16, float: 'slow', rotate: 8, eager: true, sizes: '(max-width: 700px) 36vw, 260px' })}
  <div class="nf__ticker">${marquee(ctx.categories.map((c) => c.label))}</div>
</section>`;
  return { path: '/404.html', html: page({ ctx, path: '/404.html', bodyClass: 'page-404', title: 'Page not found', description: 'This page could not be found. Go back to the Star Buds home page or choose a store.', body }) };
}

export function render(ctx) {
  return [dealsPage(ctx), rewardsPage(ctx), notFoundPage(ctx)];
}
