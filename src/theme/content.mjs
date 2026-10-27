// content.mjs - CONTENT lane: /deals/, /rewards/ and /404.html.
// Copy: only site.json text (dealsIntro, deals[], rewards, apps, states, stores) plus neutral UI labels
// (BUILD-CONTRACT 2). Deal lines are shown verbatim; parentheticals are set as fine print and prices/percentages are
// highlighted, but no word is changed. Rewards prize tiers (prize:true, 250K-point cars) are left out on purpose.
// Local helpers are prefixed dl- (deals), rw- (rewards), nf- (not found); styles live in src/styles/content.css.
import { page, esc, attrs, icon, btn, img, glass, sticker, starburst, halftone, leaves, cutout, seam, marquee, reveal } from './shell.mjs';

const EXT = { target: '_blank', rel: 'noopener' };
const WEEK = ['SUN', 'MON', 'TUES', 'WEDNES', 'THURS', 'FRI', 'SATUR'];
const ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

const todayTag = () => `<span class="sticker sticker--coral dl-today" style="--tilt:-6deg" data-today hidden>Today</span>`;

/** glass card grid (used on the dark Oklahoma band) */
function weekGrid(deal) {
  const rows = dayRows(deal);
  return `<ul class="dl-week" role="list" data-count="${rows.length}" data-stagger>${rows.map((r) => {
    const wd = weekday(r.day);
    return `
      <li class="dl-day glass glass--dark glass--pop lift"${wd >= 0 ? ` data-weekday="${wd}"` : ''} data-tilt="4">
        ${wd >= 0 ? `<span class="dl-day__abbr" aria-hidden="true">${ABBR[wd]}</span>` : ''}${todayTag()}
        <p class="dl-day__name">${esc(r.day)}</p>
        <p class="dl-day__deal">${dealText(r.deal)}</p>
      </li>`;
  }).join('')}
    </ul>`;
}

/** menu-board rows (used inside the comic panels) */
function weekBoard(deal) {
  const rows = dayRows(deal);
  return `<ul class="dl-board" role="list" data-stagger>${rows.map((r) => {
    const wd = weekday(r.day);
    return `
      <li class="dl-row"${wd >= 0 ? ` data-weekday="${wd}"` : ''}>
        <span class="dl-row__abbr" aria-hidden="true">${wd >= 0 ? ABBR[wd] : '★'}</span>
        <div class="dl-row__body"><p class="dl-row__name">${esc(r.day)} ${todayTag()}</p><p class="dl-row__deal">${dealText(r.deal)}</p></div>
      </li>`;
  }).join('')}
    </ul>`;
}

/** store-aware "Shop the deals" button + the state's store chips (static links to each live shop store page) */
function shopRow(ctx, code, { dark = false } = {}) {
  const group = ctx.storesByState.find((g) => g.state.code === code);
  if (!group) return '';
  const stores = group.stores;
  const single = stores.length === 1 ? stores[0] : null;
  const live = (s) => s.liveUrl || `${ctx.site.shopOrigin || 'https://shop.starbuds.us'}/stores/${s.slug}/`;
  const button = single
    ? btn(`Shop the deals in ${single.city}`, live(single), { variant: dark ? 'pop' : 'primary', icon: 'bag', attrs: { ...EXT, 'data-deals-shop': code, 'data-ext': '' } })
    : btn('Shop the deals', `#dl-stores-${code.toLowerCase()}`, { variant: dark ? 'pop' : 'primary', icon: 'bag', attrs: { 'data-deals-shop': code } });
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

const termsLine = (t) => (t ? `<p class="dl-terms">${esc(t)}</p>` : '');
const stateName = (ctx, code) => (ctx.states.find((s) => s.code === code) || {}).name || code;

// ---------------------------------------------------------------- /deals/
function dealsHero(ctx, codes) {
  const intro = ctx.site.dealsIntro || {};
  const title = intro.title || ctx.site.promo?.text || 'Deals';
  // pop accent on the last two words of the captured title
  const words = esc(title).split(' ');
  const h1 = words.length > 3 ? `${words.slice(0, -2).join(' ')} <span class="dl-hero__pop">${words.slice(-2).join(' ')}</span>` : esc(title);
  return `
<section class="section dl-hero" aria-labelledby="dl-title">
  <div class="plane-back">
    ${img('g-hero', { cls: 'cover dl-hero__bg', alt: '', sizes: '100vw', eager: true })}
    <div class="dl-hero__wash"></div>
    ${halftone({ color: 'yellow', at: 'tr', cls: 'dl-hero__dots' })}
    ${leaves({ tone: 'lime', cls: 'dl-hero__leaves' })}
  </div>
  <div class="wrap dl-hero__grid">
    ${glass(`
      <p class="eyebrow">${icon('tag')} ${esc(ctx.site.promo?.text || 'Deals')}</p>
      <h1 id="dl-title" class="h-display dl-hero__title">${h1}</h1>
      ${intro.subtitle ? `<p class="dl-hero__sub">${esc(intro.subtitle)}</p>` : ''}
      ${(intro.paragraphs || []).map((p) => `<p class="dl-hero__p">${esc(p)}</p>`).join('')}
      <nav class="dl-jump" aria-label="Deals by state">
        ${codes.map((c, i) => `<a class="dl-jump__link" href="#dl-${c.toLowerCase()}" style="--tilt:${[-3, 2, -2, 3][i % 4]}deg"><strong>${esc(c)}</strong> ${esc(stateName(ctx, c))}</a>`).join('')}
      </nav>`, { pop: true, shadow: 'yellow', cls: 'dl-hero__panel', attrs: { 'data-reveal': 'up' } })}
    ${starburst({ label: 'Deals', sub: 'Every day', color: 'coral', cls: 'dl-hero__burst' })}
  </div>
  <div class="dl-hero__front" aria-hidden="true">
    ${cutout('pop-star', { cls: 'dl-hero__star', depth: 0.1, float: 'fast', rotate: 12, eager: true, sizes: '(max-width: 700px) 28vw, 220px' })}
    ${cutout('cut-gummies', { cls: 'dl-hero__gummies', depth: 0.18, float: 'slow', rotate: -8, eager: true, sizes: '(max-width: 700px) 40vw, 320px' })}
  </div>
  ${seam({ kind: 'zig', color: 'var(--paper)', cls: 'seam--bottom' })}
</section>`;
}

function stateHead(ctx, code, color, extra = '') {
  return `<div class="dl-state-head"${reveal('up')}>
      ${sticker(code, { color, tilt: -5, cls: 'dl-state-head__code' })}
      <div><p class="eyebrow">${icon('tag')} Deals</p><h2 class="h-display dl-state-head__title" id="dl-${code.toLowerCase()}-title">${esc(stateName(ctx, code))}</h2>${extra}</div>
    </div>`;
}

function msSection(ctx, deals) {
  const daily = deals.find((d) => d.group === 'daily');
  const others = deals.filter((d) => d !== daily);
  const scope = daily && daily.scope ? `<p class="dl-scope">${icon('pin')} As listed on the Star Buds Oxford store page</p>` : '';
  return `
<section class="section dl-ms" id="dl-ms" aria-labelledby="dl-ms-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'pink', at: 'bl' })}<span class="blob blob--yellow dl-ms__blob"></span></div>
  <div class="wrap">
    ${stateHead(ctx, 'MS', 'yellow', scope)}
    ${daily ? `
    <div class="dl-comic dl-comic--yellow"${reveal('up', 1)}>
      <div class="dl-comic__panel halftone-host">
        ${halftone({ color: 'pink', at: 'tr', cls: 'dl-comic__dots' })}
        <div class="dl-comic__head">
          <h3 class="h-display dl-comic__title">${esc(daily.title)}</h3>
          ${daily.intro ? `<p class="dl-comic__intro">${esc(daily.intro)}</p>` : ''}
        </div>
        ${weekBoard(daily)}
        ${termsLine(daily.terms)}
      </div>
      ${starburst({ label: '7 days', sub: 'a week', color: 'yellow', cls: 'dl-comic__burst' })}
    </div>` : ''}
    ${others.map((d) => `<div class="dl-extra">${glass(`<h3 class="h-display h-sub">${esc(d.title)}</h3>${d.intro ? `<p>${esc(d.intro)}</p>` : ''}${(d.items || []).length ? `<ul class="dl-list" role="list">${d.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}${termsLine(d.terms)}`, { pop: true })}</div>`).join('')}
    ${shopRow(ctx, 'MS')}
  </div>
  ${cutout('pop-bud', { cls: 'dl-ms__bud', depth: 0.14, float: 'fast', rotate: 10, sizes: '(max-width: 700px) 34vw, 270px' })}
  ${seam({ kind: 'wave', color: 'var(--green-ink)', cls: 'seam--bottom' })}
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
    ${img('g-glass-dark', { cls: 'cover dl-ok__bg', alt: '', sizes: '100vw' })}
    <div class="dl-ok__shade"></div>
    ${leaves({ tone: 'lime', cls: 'dl-ok__leaves' })}
    ${halftone({ color: 'lime', at: 'tr' })}
  </div>
  <div class="wrap">
    ${stateHead(ctx, 'OK', 'lime')}
    <div class="dl-ok__top">
      ${community ? glass(`
        ${pct ? starburst({ label: pct[1], sub: 'every day', color: 'lime', cls: 'dl-ok__pct' }) : ''}
        <h3 class="h-display h-sub dl-card__title">${esc(community.title)}</h3>
        ${community.intro ? `<p class="dl-card__intro">${hl(esc(community.intro))}</p>` : ''}
        <ul class="dl-ticks" role="list">${community.items.map((i) => `<li>${icon('star')}<span>${esc(i)}</span></li>`).join('')}</ul>
        ${termsLine(community.terms)}`, { tone: 'dark', pop: true, cls: 'dl-ok__community', attrs: { 'data-reveal': 'left' } }) : ''}
      ${early ? glass(`
        ${sticker('Morning', { color: 'yellow', tilt: 4, cls: 'dl-early__tag' })}
        <h3 class="h-display h-sub dl-card__title">${esc(early.title)}</h3>
        ${early.intro ? `<p class="dl-card__intro">${esc(early.intro)}</p>` : ''}
        ${(early.items || []).length ? `<ul class="dl-list" role="list">${early.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}
        ${termsLine(early.terms)}`, { tone: 'dark', cls: 'dl-ok__early', attrs: { 'data-reveal': 'right' } }) : ''}
      ${cutout('cut-concentrate', { cls: 'dl-ok__conc', depth: 0.12, float: 'slow', rotate: -10, sizes: '(max-width: 700px) 30vw, 220px' })}
    </div>
    ${daily ? `
    <div class="dl-ok__daily">
      <div class="dl-ok__daily-head"${reveal('up')}>
        <h3 class="h-display dl-ok__daily-title">${esc(daily.title)}</h3>
        ${daily.intro ? `<p class="dl-card__intro">${esc(daily.intro)}</p>` : ''}
      </div>
      ${weekGrid(daily)}
      ${termsLine(daily.terms)}
    </div>` : ''}
    ${rest.map((d) => glass(`<h3 class="h-display h-sub">${esc(d.title)}</h3>${d.intro ? `<p>${esc(d.intro)}</p>` : ''}${(d.items || []).length ? `<ul class="dl-list" role="list">${d.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}${termsLine(d.terms)}`, { tone: 'dark', cls: 'dl-extra' })).join('')}
    ${shopRow(ctx, 'OK', { dark: true })}
  </div>
  ${cutout('cut-preroll', { cls: 'dl-ok__roll', depth: -0.12, float: 'slow', rotate: -20, sizes: '(max-width: 700px) 46vw, 380px' })}
  ${seam({ kind: 'scallop', color: 'var(--paper)', cls: 'seam--bottom' })}
</section>`;
}

function mdSection(ctx, deals) {
  const daily = deals.find((d) => d.group === 'daily');
  const medical = deals.find((d) => d.group === 'medical');
  const fresh = deals.find((d) => d.group === 'new-medical');
  const rest = deals.filter((d) => ![daily, medical, fresh].includes(d));
  const note = daily && daily.note ? sticker(daily.note, { color: 'pink', tilt: -2, cls: 'dl-md__note' }) : '';
  const board = (d, mod, tag) => `
      <div class="dl-comic dl-comic--${mod}"${reveal('up')}>
        <div class="dl-comic__panel halftone-host">
          ${halftone({ color: mod === 'pink' ? 'paper' : 'pink', at: 'tr', cls: 'dl-comic__dots' })}
          <div class="dl-comic__head">
            ${sticker(tag, { color: mod === 'pink' ? 'paper' : 'pink', tilt: -4, cls: 'dl-comic__tag' })}
            <h3 class="h-display dl-comic__title dl-comic__title--sm">${esc(d.title)}</h3>
            ${d.intro ? `<p class="dl-comic__intro">${esc(d.intro)}</p>` : ''}
          </div>
          ${weekBoard(d)}
          ${termsLine(d.terms)}
        </div>
      </div>`;
  return `
<section class="section dl-md" id="dl-md" aria-labelledby="dl-md-title">
  <div class="plane-back">
    ${img('g-glass', { cls: 'cover dl-md__bg', alt: '', sizes: '100vw' })}
    <div class="dl-md__wash"></div>
    ${leaves({ tone: 'light' })}
    ${halftone({ color: 'ink', at: 'top' })}
  </div>
  <div class="wrap">
    ${stateHead(ctx, 'MD', 'pink', note ? `<p class="dl-md__note-row">${note}</p>` : '')}
    <div class="dl-md__boards">
      ${daily ? board(daily, 'pink', 'Adult-use 21+') : ''}
      ${medical ? board(medical, 'white', 'Medical') : ''}
    </div>
    ${fresh ? `
    <div class="dl-new"${reveal('up')}>
      ${(() => { const m = /^(\d+%\s*OFF)\s+(.+)$/i.exec(fresh.intro || ''); return starburst({ label: m ? m[1] : (fresh.intro || fresh.title), sub: m ? m[2] : '', color: 'coral', points: 22, cls: 'dl-new__burst' }); })()}
      ${glass(`
        <p class="eyebrow">${icon('star')} Medical</p>
        <h3 class="h-display dl-new__title">${esc(fresh.title)}</h3>
        ${fresh.intro ? `<p class="dl-new__intro">${hl(esc(fresh.intro))}</p>` : ''}
        <ul class="dl-small" role="list">${(fresh.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        ${termsLine(fresh.terms)}`, { pop: true, cls: 'dl-new__panel' })}
    </div>` : ''}
    ${rest.map((d) => `<div class="dl-extra">${glass(`<h3 class="h-display h-sub">${esc(d.title)}</h3>${d.intro ? `<p>${esc(d.intro)}</p>` : ''}${(d.items || []).length ? `<ul class="dl-list" role="list">${d.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}`, { pop: true })}</div>`).join('')}
    ${shopRow(ctx, 'MD')}
  </div>
  ${cutout('cut-vape', { cls: 'dl-md__vape', depth: 0.16, float: 'slow', rotate: 16, sizes: '(max-width: 700px) 22vw, 170px' })}
  ${seam({ kind: 'zig', color: 'var(--green-deep)', cls: 'seam--bottom' })}
</section>`;
}

/** a state with stores but no captured deals: show its captured blurb and its live menu, no invented offers */
function quietState(ctx, code) {
  const st = ctx.states.find((s) => s.code === code) || { name: code };
  return glass(`
      ${sticker(code, { color: 'lime', tilt: -5 })}
      <h2 class="h-display h-sub dl-quiet__title" id="dl-${code.toLowerCase()}-title">${esc(st.name)}</h2>
      ${st.blurb ? `<p>${esc(st.blurb)}</p>` : ''}
      ${shopRow(ctx, code, { dark: true })}`, { tone: 'dark', pop: true, cls: 'dl-quiet', attrs: { id: `dl-${code.toLowerCase()}`, 'aria-labelledby': `dl-${code.toLowerCase()}-title`, 'data-reveal': 'up' }, tag: 'section' });
}

function dealsOutro(ctx, quietCodes) {
  const r = ctx.site.rewards || {};
  return `
<section class="section dl-outro on-dark" aria-label="More from Star Buds">
  <div class="plane-back">${leaves({ tone: 'dark', cls: 'dl-outro__leaves' })}${halftone({ color: 'yellow', at: 'br' })}</div>
  <div class="wrap dl-outro__grid">
    ${quietCodes.map((c) => quietState(ctx, c)).join('')}
    ${glass(`
      ${sticker(r.programName || 'Higher Rewards', { color: 'yellow', tilt: 3 })}
      <h2 class="h-display h-sub dl-quiet__title">${esc(r.title || 'Higher Rewards')}</h2>
      ${(r.paragraphs || [])[0] ? `<p>${esc(r.paragraphs[0].split(/(?<=[.!?])\s+/)[0])}</p>` : ''}
      <div class="btn-row">${btn('Higher Rewards', '/rewards/', { variant: 'pop' })}${btn('Find a store', '/stores/', { variant: 'ghost', icon: 'pin' })}</div>`, { tone: 'dark', pop: true, cls: 'dl-outro__rewards', attrs: { 'data-reveal': 'up', style: '--i:1' } })}
  </div>
  ${cutout('cut-jar', { cls: 'dl-outro__jar', depth: 0.12, float: 'fast', rotate: 8, sizes: '(max-width: 700px) 28vw, 200px' })}
  ${cutout('cut-leaf', { cls: 'dl-outro__leaf', depth: -0.1, float: 'slow', rotate: -30, sizes: '(max-width: 700px) 26vw, 180px' })}
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
      ctx, path: '/deals/', bodyClass: 'page-deals',
      title: 'Deals',
      description: `${ctx.site.dealsIntro?.subtitle || 'Daily deals at Star Buds.'} Daily deals by state: ${withDeals.map((c) => stateName(ctx, c)).join(', ')}.`,
      body,
    }),
  };
}

// ---------------------------------------------------------------- /rewards/
const sentences = (p) => String(p || '').split(/(?<=[.!?])\s+/).filter(Boolean);

function rwHero(ctx) {
  const r = ctx.site.rewards || {};
  const s = sentences((r.paragraphs || [])[0]);
  const lead = s.slice(1).join(' ');
  return `
<section class="section rw-hero on-dark" aria-labelledby="rw-title">
  <div class="plane-back">
    <img class="cover rw-hero__poster" src="/assets/media/glass-dark-poster.webp" width="1600" height="890" alt="" decoding="async" fetchpriority="high" data-ai="generated">
    <video class="cover bg-video rw-hero__video" autoplay muted loop playsinline preload="metadata" poster="/assets/media/glass-dark-poster.webp" aria-hidden="true" tabindex="-1" data-ai="generated" title="Dark glass bubbles and leaves drifting (AI-generated loop)">
      <source src="/assets/media/glass-dark.webm" type="video/webm">
      <source src="/assets/media/glass-dark.mp4" type="video/mp4">
    </video>
    <div class="rw-hero__shade"></div>
    ${leaves({ tone: 'lime', cls: 'rw-hero__leaves' })}
    ${halftone({ color: 'pink', at: 'bl', cls: 'rw-hero__dots' })}
  </div>
  <div class="wrap rw-hero__grid">
    ${glass(`
      ${sticker(r.programName || 'Higher Rewards', { color: 'lime', tilt: -4 })}
      <h1 id="rw-title" class="h-display rw-hero__title">${esc(r.title || 'Higher Rewards')}</h1>
      ${lead ? `<p class="rw-hero__lead">${esc(lead)}</p>` : ''}
      <div class="btn-row">
        ${r.joinHref ? btn('Join Higher Rewards', r.joinHref, { variant: 'pop', size: 'lg', icon: 'external', attrs: EXT }) : ''}
        ${r.loginHref ? btn('Log in', r.loginHref, { variant: 'ghost', icon: 'external', attrs: EXT }) : ''}
      </div>`, { tone: 'dark', pop: true, cls: 'rw-hero__panel', attrs: { 'data-reveal': 'up' } })}
    ${starburst({ label: 'Free', sub: 'to sign up', color: 'lime', cls: 'rw-hero__burst' })}
  </div>
  <div class="rw-hero__front" aria-hidden="true">
    ${cutout('cut-jar', { cls: 'rw-hero__jar', depth: 0.14, float: 'slow', rotate: -6, eager: true, sizes: '(max-width: 700px) 36vw, 300px' })}
    ${cutout('pop-star', { cls: 'rw-hero__star', depth: -0.08, float: 'fast', rotate: 14, eager: true, sizes: '(max-width: 700px) 26vw, 200px' })}
  </div>
  ${seam({ kind: 'wave', color: 'var(--paper)', cls: 'seam--bottom' })}
</section>`;
}

function rwSteps(ctx) {
  const r = ctx.site.rewards || {};
  const s = sentences((r.paragraphs || [])[0]);
  const steps = [
    { n: '01', label: 'Join', text: s[0], cut: 'cut-preroll', cta: r.joinHref ? btn('Join', r.joinHref, { variant: 'primary', size: 'sm', icon: 'external', attrs: EXT }) : '' },
    { n: '02', label: 'Earn', text: (r.points || [])[0], cut: 'cut-bud' },
    { n: '03', label: 'Redeem', text: (r.points || [])[1], cut: 'cut-gummies' },
  ].filter((x) => x.text);
  if (!steps.length) return '';
  return `
<section class="section rw-steps" aria-labelledby="rw-steps-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'yellow', at: 'tr' })}<span class="blob blob--lime rw-steps__blob"></span></div>
  <div class="wrap">
    <div class="rw-head">
      <p class="eyebrow"${reveal('up')}>${icon('star')} ${esc(r.programName || 'Higher Rewards')}</p>
      <h2 id="rw-steps-title" class="h-display"${reveal('up', 1)}>How it <span class="swipe">works</span></h2>
    </div>
    <ol class="rw-steps__list" role="list" data-stagger>${steps.map((x, i) => `
      <li class="rw-step glass glass--pop lift rw-step--${i}" data-tilt="4">
        ${cutout(x.cut, { cls: 'rw-step__cut', depth: 0, float: false, sizes: '(max-width: 700px) 30vw, 170px' })}
        <span class="rw-step__n" aria-hidden="true">${x.n}</span>
        <h3 class="h-display rw-step__label">${esc(x.label)}</h3>
        <p class="rw-step__text">${esc(x.text)}</p>
        ${x.cta || ''}
      </li>`).join('')}
    </ol>
  </div>
  ${seam({ kind: 'scallop', color: 'var(--green-deep)', cls: 'seam--bottom' })}
</section>`;
}

function rwTiers(ctx) {
  const r = ctx.site.rewards || {};
  const groups = (r.byState || []).filter((g) => g && g.state);
  if (!groups.length) return '';
  return `
<section class="section rw-tiers on-dark" aria-labelledby="rw-tiers-title">
  <div class="plane-back">
    ${img('g-glass-dark', { cls: 'cover rw-tiers__bg', alt: '', sizes: '100vw' })}
    <div class="rw-tiers__shade"></div>
    ${leaves({ tone: 'dark', cls: 'rw-tiers__leaves' })}
    ${halftone({ color: 'lime', at: 'br' })}
  </div>
  <div class="wrap">
    <div class="rw-head rw-head--split">
      <div>
        <p class="eyebrow"${reveal('up')}>${icon('pin')} By state</p>
        <h2 id="rw-tiers-title" class="h-display"${reveal('up', 1)}>Points <span class="rw-pop">&amp;</span> rewards</h2>
      </div>
      <div class="tabs rw-tabs" role="tablist" aria-label="Rewards by state" data-tabs${reveal('up', 2)}>
        ${groups.map((g, i) => `<button type="button" class="tab" role="tab" id="rw-tab-${esc(g.state)}" aria-controls="rw-panel-${esc(g.state)}" aria-selected="${i === 0}" data-tab-state="${esc(g.state)}"${i ? ' tabindex="-1"' : ''}>${esc(g.state)}<span class="sr-only"> ${esc(stateName(ctx, g.state))}</span></button>`).join('')}
      </div>
    </div>
    ${groups.map((g, i) => {
      const tiers = (g.tiers || []).filter((t) => !t.prize);
      return `
    <div class="rw-panel" role="tabpanel" id="rw-panel-${esc(g.state)}" aria-labelledby="rw-tab-${esc(g.state)}"${i ? ' hidden' : ''}>
      ${glass(`
        <div class="rw-panel__copy">
          ${String(g.title || '').toLowerCase() === stateName(ctx, g.state).toLowerCase() ? '' : `<p class="rw-panel__state">${esc(stateName(ctx, g.state))}</p>`}
          <h3 class="h-display rw-panel__title">${esc(g.title || stateName(ctx, g.state))}</h3>
          ${g.intro ? `<p class="rw-panel__intro">${hl(esc(g.intro))}</p>` : ''}
          ${g.outro ? `<p class="rw-panel__outro">${esc(g.outro)}</p>` : ''}
          ${g.joinHref ? `<div class="btn-row">${btn(`Join in ${stateName(ctx, g.state)}`, g.joinHref, { variant: 'pop', icon: 'external', attrs: EXT })}</div>` : ''}
        </div>
        ${tiers.length ? `<ol class="rw-ladder${tiers.length > 4 ? ' rw-ladder--many' : ''}" role="list" style="--n:${tiers.length}">${tiers.map((t, k) => `
          <li class="rw-tier" style="--k:${k}">
            <span class="rw-tier__pts">${esc(t.points)}</span>
            <span class="rw-tier__reward">${hl(esc(t.reward))}</span>
          </li>`).join('')}
        </ol>` : ''}`, { tone: 'dark', pop: true, cls: `rw-panel__glass${tiers.length ? '' : ' rw-panel__glass--solo'}` })}
    </div>`;
    }).join('')}
    <noscript><style>.rw-panel[hidden]{display:block!important;margin-top:28px}</style></noscript>
  </div>
  ${cutout('cut-tincture', { cls: 'rw-tiers__tincture', depth: 0.14, float: 'slow', rotate: 10, sizes: '(max-width: 700px) 26vw, 200px' })}
  ${seam({ kind: 'zig', color: 'var(--paper)', cls: 'seam--bottom' })}
</section>`;
}

function rwApps(ctx) {
  const r = ctx.site.rewards || {};
  const apps = ctx.site.apps || {};
  return `
<section class="section rw-apps" aria-labelledby="rw-apps-title">
  <div class="plane-back">${leaves({ tone: 'light' })}${halftone({ color: 'pink', at: 'tl' })}<span class="blob blob--yellow rw-apps__blob"></span></div>
  <div class="wrap rw-apps__grid">
    <div class="rw-apps__panel halftone-host"${reveal('up')}>
      ${halftone({ color: 'pink', at: 'full', cls: 'rw-apps__dots' })}
      <p class="eyebrow">${icon('phoneApp')} Get the app</p>
      <h2 id="rw-apps-title" class="h-display rw-apps__title">App Store &amp; Google Play</h2>
      <div class="btn-row">
        ${apps.ios ? btn('App Store', apps.ios, { variant: 'dark', icon: 'external', attrs: EXT }) : ''}
        ${apps.android ? btn('Google Play', apps.android, { variant: 'dark', icon: 'external', attrs: EXT }) : ''}
      </div>
      ${cutout('cut-vape', { cls: 'rw-apps__vape', depth: 0.1, float: 'fast', rotate: 18, sizes: '(max-width: 700px) 22vw, 160px' })}
    </div>
    ${glass(`
      <p class="eyebrow">${icon('tag')} Terms</p>
      <p class="h-display h-sub rw-apps__terms-title">${esc(r.programName || 'Higher Rewards')}</p>
      <div class="rw-apps__links">
        ${r.termsHref ? `<a class="link-arrow" href="${esc(r.termsHref)}"${attrs(EXT)}>Terms and conditions${icon('external')}</a>` : ''}
        ${r.loginHref ? `<a class="link-arrow" href="${esc(r.loginHref)}"${attrs(EXT)}>Log in${icon('external')}</a>` : ''}
        <a class="link-arrow" href="/deals/">Deals${icon('arrow')}</a>
      </div>`, { pop: true, cls: 'rw-apps__terms', attrs: { 'data-reveal': 'up', style: '--i:1' } })}
  </div>
</section>`;
}

function rewardsPage(ctx) {
  const r = ctx.site.rewards || {};
  const s = sentences((r.paragraphs || [])[0]);
  return {
    path: '/rewards/',
    html: page({
      ctx, path: '/rewards/', bodyClass: 'page-rewards',
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
    ${img('g-glass-dark', { cls: 'cover nf__bg', alt: '', sizes: '100vw', eager: true })}
    <div class="nf__shade"></div>
    ${leaves({ tone: 'lime', cls: 'nf__leaves' })}
    ${halftone({ color: 'pink', at: 'tr' })}
    <p class="nf__big outline-type" aria-hidden="true">404</p>
  </div>
  <div class="wrap nf__grid">
    ${glass(`
      ${sticker('Error 404', { color: 'pink', tilt: -5 })}
      <h1 id="nf-title" class="h-display nf__title">Page not <span class="nf__pop">found</span></h1>
      <p class="nf__lead">This page isn't here. Head back home, or choose your location and open its live menu.</p>
      <div class="btn-row">
        ${btn('Back to home', '/', { variant: 'pop', size: 'lg' })}
        ${btn('Find a store', '/stores/', { variant: 'ghost', icon: 'pin' })}
      </div>
      <p class="nf__more"><a class="link-arrow" href="/deals/">Deals${icon('arrow')}</a> <a class="link-arrow" href="/rewards/">Higher Rewards${icon('arrow')}</a></p>`, { tone: 'dark', pop: true, cls: 'nf__panel', attrs: { 'data-reveal': 'up' } })}
    ${starburst({ label: 'Oops', color: 'yellow', cls: 'nf__burst' })}
  </div>
  <div class="nf__front" aria-hidden="true">
    ${cutout('pop-star', { cls: 'nf__star', depth: 0.12, float: 'fast', rotate: -10, eager: true, sizes: '(max-width: 700px) 30vw, 240px' })}
    ${cutout('cut-bud', { cls: 'nf__bud', depth: 0.2, float: 'slow', rotate: 8, eager: true, sizes: '(max-width: 700px) 44vw, 380px' })}
    ${cutout('cut-leaf', { cls: 'nf__leaf', depth: -0.1, float: 'slow', rotate: -28, sizes: '(max-width: 700px) 30vw, 220px' })}
  </div>
  <div class="nf__ticker">${marquee(ctx.categories.map((c) => c.label))}</div>
</section>`;
  return { path: '/404.html', html: page({ ctx, path: '/404.html', bodyClass: 'page-404', title: 'Page not found', description: 'This page could not be found. Go back to the Star Buds home page or choose a store.', body }) };
}

export function render(ctx) {
  return [dealsPage(ctx), rewardsPage(ctx), notFoundPage(ctx)];
}
