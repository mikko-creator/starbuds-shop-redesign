// stores.mjs - the STORES lane (revision 1, "Iron Star"): /stores/ (all locations, state filter) and /stores/<slug>/
// (store home) for every store in site.json. Copy = captured site.json text + template wording ("You're shopping at
// Star Buds in <City>", "Categories") + neutral UI labels only (BUILD-CONTRACT 2). Store photos are real captured
// photos, framed as a pinned print; stores without one get a leather tile with the city in blackletter (never a
// generated stand-in for a store). Live-menu links on a store page are static (that store's Dutchie menu), not the
// chosen-store rewrite, because the page already names its store.
// Iron Star pieces used: smoked glass with stitched borders, rocker patches (state names), straight embroidered patches
// (eyebrows, state codes), seals, patch cut-outs, product cut-outs, seams, pinstripes, halftone, grain, leaves duotones.
import { page, esc, icon, btn, img, glass, patch, seal, rocker, halftone, leaves, grain, cutout, patchCut, seam, pinstripe, marquee, reveal, liveMenu } from './shell.mjs';

const TZ = { MS: 'America/Chicago', OK: 'America/Chicago', MD: 'America/New_York', NY: 'America/New_York' };
/** per state: [product cut-out crossing a seam, embroidered patch / chrome / flash cut-out] */
const STATE_CUT = { MS: ['cut-bud', 'patch-leaf'], OK: ['cut-jar', 'patch-wings'], MD: ['cut-gummies', 'flash-bud'], NY: ['cut-preroll', 'chrome-star'] };
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const listJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const shortName = (s) => s.shortName || `Star Buds ${s.city}`;
const fmtTime = (t) => String(t || '').replace(/\s*-\s*/, ' – ');
const ext = { target: '_blank', rel: 'noopener' };
const hasHours = (s) => Array.isArray(s.hours) && s.hours.length > 0;
const stateOf = (ctx, code) => (ctx.states || []).find((x) => x.code === code) || { code, name: code };
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
/** the pop-era stickers are retired: a category that still points at one gets an embroidered patch (as on the home page) */
const cutFor = (id) => (/^pop-/.test(id || '') ? 'patch-leaf' : id);
const starSrc = (ctx) => ctx.site.brand?.star || '/assets/brand/star-on-dark.png';

// ---------- shared: store card ----------
function storeTile(ctx, s, sizes) {
  if (s.photo && s.photo.src) {
    return `<div class="st-card__media">${img(s.photo, { cls: 'st-card__photo', sizes })}<span class="st-card__sheen" aria-hidden="true"></span></div>`;
  }
  return `<div class="st-card__media st-tile" aria-hidden="true">
      ${leaves({ tone: 'gold', cls: 'st-tile__leaves' })}
      ${halftone({ color: 'gold', at: 'br', cls: 'st-tile__dots' })}
      ${grain()}
      <img class="st-tile__star" src="${esc(starSrc(ctx))}" width="256" height="256" alt="" loading="lazy" decoding="async">
      <span class="st-tile__city">${esc(s.city)}</span>
    </div>`;
}

function pickButton(s, cls = 'st-pick') {
  return `<button type="button" class="${cls}" data-store-pick="${esc(s.slug)}" data-no-toast aria-pressed="false">${icon('star')}<span class="st-pick__off">Make this my store</span><span class="st-pick__on">My store</span><span class="sr-only"> (${esc(shortName(s))})</span></button>`;
}

function storeCard(ctx, s, { level = 'h3', sizes = '(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 380px' } = {}) {
  const st = stateOf(ctx, s.state);
  const href = `/stores/${s.slug}/`;
  return `
      <article class="st-card glass glass--stitch stitch stitch--draw lift" data-tilt="2">
        ${storeTile(ctx, s, sizes)}
        ${patch(s.state, { tone: 'gold', size: 'sm', cls: 'st-card__state' })}
        ${pickButton(s)}
        <div class="st-card__body">
          <p class="st-card__eyebrow">${esc(st.name)}</p>
          <${level} class="st-card__city"><a href="${href}">${esc(s.city)}</a></${level}>
          <ul class="st-facts" role="list">
            <li>${icon('pin')}<span>${(s.address || []).map(esc).join('<br>')}</span></li>
            ${s.phone ? `<li>${icon('phone')}<a href="tel:${esc(s.tel || s.phone)}">${esc(s.phone)}</a></li>` : ''}
            <li>${icon('clock')}<span>${s.hoursSummary ? esc(fmtTime(s.hoursSummary).replace(/, /g, ' · ')) : '<span class="st-facts__soft">Hours on the live store page</span>'}</span></li>
          </ul>
          <div class="st-card__actions">
            ${btn('View store', href, { variant: 'gold', size: 'sm', cls: 'st-card__view' })}
            ${s.mapUrl ? btn('Directions', s.mapUrl, { variant: 'ghost', size: 'sm', icon: 'directions', attrs: { ...ext, 'aria-label': `Directions to ${shortName(s)}` } }) : ''}
            ${s.tel ? btn('Call', 'tel:' + s.tel, { variant: 'ghost', size: 'sm', icon: 'phone', attrs: { 'aria-label': `Call ${shortName(s)}` } }) : ''}
          </div>
        </div>
      </article>`;
}

// ---------- /stores/ ----------
function groupBlock(ctx, g, gi) {
  const st = g.state;
  const [cutA] = STATE_CUT[st.code] || ['cut-leaf'];
  const k = g.stores.length;
  return `
    <div class="st-group st-group--n${Math.min(k, 4)}" id="state-${esc(st.code.toLowerCase())}" data-st-group="${esc(st.code)}">
      <header class="st-group__head"${reveal('up')}>
        <h2 class="st-group__title"><span class="sr-only">${esc(st.name)}</span>${rocker(st.name, { tone: 'gold', radius: 300, band: 58, angle: 30, decorative: true, cls: 'st-group__rocker' })}</h2>
        <div class="st-group__meta">
          ${patch(st.code, { tone: 'green', size: 'sm' })}
          <p class="st-group__count"><span class="numeral">${k}</span> ${k === 1 ? 'location' : 'locations'}</p>
        </div>
        ${st.blurb ? `<p class="st-group__blurb">${esc(st.blurb)}</p>` : ''}
        ${cutout(cutA, { cls: 'st-group__cut', depth: 0, float: gi % 2 ? 'fast' : 'slow', rotate: gi % 2 ? 8 : -10, sizes: '(max-width: 700px) 25vw, 160px' })}
      </header>
      <ul class="st-grid${k === 4 ? ' st-grid--4' : ''}${k === 1 ? ' st-grid--1' : ''}" role="list" data-stagger>${g.stores.map((s) => `<li>${storeCard(ctx, s, k === 1 ? { sizes: '(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 600px' } : k === 4 ? { sizes: '(max-width: 700px) 88vw, (max-width: 1199px) 44vw, 290px' } : {})}</li>`).join('')}
      </ul>
    </div>`;
}
/** consecutive single-store states share a row (st-duo) so a lone card does not leave half the page empty */
function groupBlocks(ctx, groups) {
  const out = [];
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].stores.length === 1 && groups[i + 1] && groups[i + 1].stores.length === 1) {
      out.push(`<div class="st-duo">${groupBlock(ctx, groups[i], i)}${groupBlock(ctx, groups[i + 1], i + 1)}</div>`);
      i++;
    } else out.push(groupBlock(ctx, groups[i], i));
  }
  return out.join('');
}

const FILTER_JS = `(function(){var d=document,chips=[].slice.call(d.querySelectorAll('[data-st-filter]')),groups=[].slice.call(d.querySelectorAll('[data-st-group]'));if(!chips.length)return;
function set(code,scroll){chips.forEach(function(c){var on=c.getAttribute('data-st-filter')===code;c.setAttribute('aria-pressed',on?'true':'false');c.classList.toggle('is-current',on)});
groups.forEach(function(g){g.hidden=code!=='all'&&g.getAttribute('data-st-group')!==code});
var n=d.querySelector('[data-st-shown]');if(n){var c=0;groups.forEach(function(g){if(!g.hidden)c+=g.querySelectorAll('.st-card').length});n.textContent=c+(c===1?' location':' locations')}
if(scroll){var t=d.getElementById('all');if(t&&t.getBoundingClientRect().top>innerHeight*.55)t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}}
chips.forEach(function(c){c.setAttribute('role','button');c.addEventListener('click',function(e){e.preventDefault();set(c.getAttribute('data-st-filter'),true)})});
function fromHash(){var m=/^#state-(\\w+)$/.exec(location.hash);set(m?m[1].toUpperCase():'all',false)}fromHash();addEventListener('hashchange',fromHash)})();`;

function filterChip({ href, code, label, rockerText, count }) {
  return `<li><a class="st-filter__chip" href="${href}" data-st-filter="${esc(code)}">
            ${rocker(rockerText, { tone: 'gold', radius: 260, band: 46, angle: 24, decorative: true, cls: 'st-filter__rocker' })}
            <span class="sr-only">${esc(label)}, </span><span class="st-filter__n"><span class="numeral">${count}</span><span class="sr-only"> ${count === 1 ? 'location' : 'locations'}</span></span>
          </a></li>`;
}

function storesIndex(ctx) {
  const groups = ctx.storesByState;
  const n = ctx.stores.length;
  const states = groups.map((g) => g.state.name);
  const hero = `
<section class="section st-hero on-dark" aria-labelledby="st-title">
  <div class="plane-back">
    <div class="leather-bg"></div>
    ${img('g-smoke', { cls: 'cover st-hero__smoke', alt: '', sizes: '100vw', eager: true })}
    <div class="st-hero__shade"></div>
    <div class="st-hero__leaves">${leaves({ tone: 'gold' })}</div>
    ${halftone({ color: 'gold', at: 'bl', cls: 'st-hero__dots' })}
    ${grain()}
    <div class="vignette"></div>
  </div>
  <div class="wrap st-hero__grid">
    ${glass(`
      <p class="st-hero__eyebrow">${patch('Locations', { tone: 'gold', icon: 'pin' })}</p>
      <h1 id="st-title" class="st-hero__title">Find your <span class="gold-text st-hero__brand">Star Buds</span></h1>
      ${pinstripe({ cls: 'st-hero__rule' })}
      <p class="lead st-hero__lead">${n} locations in ${esc(listJoin(states))}. Choose your location to open its store page, live menu and directions.</p>
      <nav class="st-filter" aria-label="Filter locations by state">
        <p class="st-filter__label">Filter by state</p>
        <ul class="st-filter__list" role="list">
          ${filterChip({ href: '#all', code: 'all', label: 'All states', rockerText: 'All states', count: n })}
          ${groups.map((g) => filterChip({ href: `#state-${esc(g.state.code.toLowerCase())}`, code: g.state.code, label: g.state.name, rockerText: g.state.name, count: g.stores.length })).join('')}
        </ul>
      </nav>`, { stitch: true, cls: 'st-hero__panel', attrs: { 'data-reveal': 'up' } })}
    <div class="st-hero__art" aria-hidden="true">
      ${patchCut('patch-wings', { cls: 'st-hero__wings', depth: 0.06, rotate: -2, eager: true, sizes: '(max-width: 900px) 60vw, 420px' })}
      ${seal({ label: String(n), sub: 'Locations', tone: 'gold', cls: 'st-hero__seal' })}
    </div>
  </div>
  <div class="st-hero__front" aria-hidden="true">
    ${cutout('cut-vape', { cls: 'st-hero__bud', depth: 0.12, eager: true, float: 'slow', rotate: 14, sizes: '(max-width: 700px) 36vw, 280px' })}
  </div>
</section>`;

  const list = `
<section class="section section--leather st-list" id="all" aria-label="All locations">
  <div class="plane-back">
    <div class="st-ground"></div>
    ${leaves({ tone: 'gold', cls: 'st-ground__leaves' })}
    ${halftone({ color: 'gold', at: 'tr', cls: 'st-list__dots' })}
    ${halftone({ color: 'green', at: 'bl', cls: 'st-list__dots2' })}
    ${grain()}
  </div>
  ${seam({ kind: 'pinstripe' })}
  <div class="wrap">
    <p class="st-list__shown" aria-live="polite">${icon('star')}<span data-st-shown>${n} locations</span></p>
    ${groupBlocks(ctx, groups)}
  </div>
</section>
<script>${FILTER_JS}</script>`;

  return {
    path: '/stores/',
    html: page({
      ctx, path: '/stores/', bodyClass: 'page-stores', title: 'Locations',
      description: `All ${n} Star Buds locations in ${listJoin(states)}: addresses, phone numbers, hours and the live menu for each store.`,
      body: hero + list,
    }),
  };
}

// ---------- /stores/<slug>/ ----------
const HOURS_JS = `(function(){var d=document,el=d.querySelector('[data-sp-hours]');if(!el||!window.Intl)return;var cfg;try{cfg=JSON.parse(el.getAttribute('data-sp-hours'))}catch(e){return}
var DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],by={};(cfg.hours||[]).forEach(function(h){by[h.day]=h.time});
function mins(t){var m=/^(\\d{1,2}):(\\d{2})\\s*([AP])M$/i.exec(String(t).trim());if(!m)return null;var h=(+m[1])%12;if(/p/i.test(m[3]))h+=12;return h*60+(+m[2])}
function span(r){var p=String(r||'').split(/\\s*[-\\u2013]\\s*/);if(p.length!==2)return null;var o=mins(p[0]),c=mins(p[1]);if(o==null||c==null)return null;if(c<=o)c+=1440;return{o:o,c:c,open:p[0],close:p[1]}}
var parts;try{parts=new Intl.DateTimeFormat('en-US',{timeZone:cfg.tz,weekday:'long',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date())}catch(e){return}
function get(t){for(var i=0;i<parts.length;i++)if(parts[i].type===t)return parts[i].value;return''}
var wd=DAYS.indexOf(get('weekday'));if(wd<0)return;var now=((+get('hour'))%24)*60+(+get('minute'));
var today=span(by[DAYS[wd]]),yest=span(by[DAYS[(wd+6)%7]]),open=false,msg='';
if(yest&&yest.c>1440&&now+1440<yest.c){open=true;msg='until '+yest.close}else if(today&&now>=today.o&&now<today.c){open=true;msg='until '+today.close}
else if(today&&now<today.o){msg='opens '+today.open+' today'}else{for(var k=1;k<=7;k++){var nx=span(by[DAYS[(wd+k)%7]]);if(nx){msg='opens '+(k===1?'tomorrow':DAYS[(wd+k)%7])+' '+nx.open;break}}}
[].forEach.call(d.querySelectorAll('[data-sp-status]'),function(s){s.hidden=false;s.classList.add(open?'is-open':'is-closed');var t=s.querySelector('[data-sp-status-text]');if(t)t.textContent=open?'Open now':'Closed now';var m=s.querySelector('[data-sp-status-msg]');if(m)m.textContent=msg?' \\u00b7 '+msg:''});
var tt=by[DAYS[wd]];[].forEach.call(d.querySelectorAll('[data-sp-today]'),function(s){if(tt)s.textContent='Today ('+DAYS[wd]+'): '+tt.replace(/\\s*-\\s*/,' \\u2013 ')});
[].forEach.call(d.querySelectorAll('tr[data-day]'),function(r){if(r.getAttribute('data-day')===DAYS[wd]){r.classList.add('is-today');var b=r.querySelector('[data-today-badge]');if(b)b.hidden=false}})})();`;

function statusBlock(s) {
  if (!hasHours(s)) return '';
  return `<p class="sp-status" data-sp-status hidden><span class="sp-status__dot" aria-hidden="true"></span><strong data-sp-status-text></strong><span data-sp-status-msg></span></p>`;
}

function hoursTable(s) {
  if (!hasHours(s)) {
    return `<p class="sp-hours__none">${icon('clock')}<span>See today's hours on the <a href="${esc(s.liveUrl)}" target="_blank" rel="noopener">live store page</a>.</span></p>`;
  }
  const rows = [...s.hours].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
  return `<table class="sp-hours">
          <caption class="sr-only">Store hours</caption>
          <tbody>${rows.map((h) => `
            <tr data-day="${esc(h.day)}"><th scope="row">${esc(h.day)} <span class="sp-hours__badge" data-today-badge hidden>Today</span></th><td>${esc(fmtTime(h.time))}</td></tr>`).join('')}
          </tbody>
        </table>`;
}

function storeHero(ctx, s) {
  const st = stateOf(ctx, s.state);
  const [cutA, cutB] = STATE_CUT[s.state] || ['cut-bud', 'patch-leaf'];
  const photo = s.photo && s.photo.src ? s.photo : null;
  const patchEl = patchCut(cutB, { cls: `sp-print__patch sp-print__patch--${esc(cutB)}`, depth: 0.06, rotate: 4, sizes: '(max-width: 700px) 30vw, 220px' });
  const pin = cutout('chrome-star', { cls: 'sp-print__pin', depth: 0, float: false, rotate: 8, eager: true, sizes: '80px' });
  const frame = photo
    ? `<figure class="sp-print"${reveal('right')}>
          <div class="sp-print__paper">
            <div class="sp-print__window">${img(photo, { cls: 'sp-print__photo', eager: true, sizes: '(max-width: 900px) 84vw, 540px' })}${halftone({ color: 'ink', at: 'full', cls: 'sp-print__dots' })}</div>
            <figcaption class="sp-print__cap">${esc(photo.alt)}</figcaption>
          </div>
          ${pin}
          ${patchEl}
        </figure>`
    : `<div class="sp-print sp-print--tile" aria-hidden="true"${reveal('right')}>
          <div class="sp-print__tile stitch stitch--draw">
            ${leaves({ tone: 'gold' })}
            ${halftone({ color: 'gold', at: 'br' })}
            ${grain()}
            <img class="sp-print__star" src="${esc(starSrc(ctx))}" width="256" height="256" alt="" decoding="async">
            <span class="sp-print__mark"><span class="sp-print__city">${esc(s.city)}</span>${rocker(st.name, { pos: 'bottom', tone: 'gold', radius: 260, band: 46, angle: 26, decorative: true, cls: 'sp-print__rocker' })}</span>
          </div>
          ${pin}
          ${patchEl}
        </div>`;
  const nameLine = s.name && s.name !== shortName(s) ? `<p class="sp-hero__name">${esc(s.name)}</p>` : '';
  const ticker = [s.city, st.name, 'Star Buds', 'Est. ' + (ctx.site.brand?.est || '2013'), ...ctx.categories.slice(0, 5).map((c) => c.label)];
  return `
<section class="section sp-hero on-dark" aria-labelledby="sp-title">
  <div class="plane-back">
    <div class="leather-bg"></div>
    ${img('g-smoke', { cls: 'cover sp-hero__smoke', alt: '', sizes: '100vw', eager: true })}
    <div class="sp-hero__scrim"></div>
    <div class="sp-hero__leaves">${leaves({ tone: 'gold' })}</div>
    ${halftone({ color: 'gold', at: 'tr', cls: 'sp-hero__dots' })}
    ${grain()}
    <div class="vignette"></div>
  </div>
  <div class="wrap sp-hero__grid">
    <div class="sp-hero__copy"${reveal('up')}>
      <div class="sp-hero__tags">${rocker(st.name, { tone: 'gold', radius: 260, band: 46, angle: 24, cls: 'sp-hero__rocker' })}${patch(s.state, { tone: 'green', size: 'sm', cls: 'sp-hero__code' })}</div>
      <h1 id="sp-title" class="sp-hero__title">You're shopping at Star Buds in <span class="gold-text sp-hero__city">${esc(s.city)}</span></h1>
      ${nameLine}
      ${pinstripe({ cls: 'sp-hero__rule' })}
      <div class="btn-row sp-hero__cta">
        ${btn('Shop this store', s.liveUrl || liveMenu(ctx, s.slug), { variant: 'gold', size: 'lg', icon: 'bag', attrs: ext })}
        ${btn(`${icon('star', 'sp-pick__star')}<span class="st-pick__off">Make this my store</span><span class="st-pick__on">This is my store</span>`, null, { variant: 'ghost', icon: false, html: true, cls: 'sp-pick', attrs: { 'data-store-pick': s.slug, 'data-no-toast': true, 'aria-pressed': 'false' } })}
      </div>
      <a class="link-arrow sp-hero__info" href="#info">Store info and hours${icon('arrow')}</a>
    </div>
    <div class="sp-hero__visual">
      ${frame}
      ${glass(`
        ${statusBlock(s)}
        <p class="sp-card__title">${esc(shortName(s))}</p>
        <ul class="st-facts sp-card__facts" role="list">
          ${hasHours(s) ? `<li>${icon('clock')}<span data-sp-today>${esc(fmtTime(s.hoursSummary).replace(/, /g, ' · '))}</span></li>` : ''}
          <li>${icon('pin')}<span>${(s.address || []).map(esc).join('<br>')}</span></li>
          ${s.phone ? `<li>${icon('phone')}<a href="tel:${esc(s.tel || s.phone)}">${esc(s.phone)}</a></li>` : ''}
        </ul>
        ${s.mapUrl ? `<a class="link-arrow sp-card__map" href="${esc(s.mapUrl)}" target="_blank" rel="noopener">Get directions${icon('external')}</a>` : ''}`, { stitch: true, cls: 'sp-card', attrs: { 'data-reveal': 'up', style: '--i:2' } })}
    </div>
  </div>
  <div class="sp-hero__front" aria-hidden="true">
    ${cutout(cutA, { cls: 'sp-hero__cut', depth: 0.14, float: 'slow', rotate: -8, eager: true, sizes: '(max-width: 700px) 34vw, 260px' })}
  </div>
  <div class="sp-ticker" aria-hidden="true">${marquee(ticker)}</div>
</section>`;
}

function storeShop(ctx, s) {
  return `
<section class="section section--leather sp-shop" id="shop" aria-labelledby="sp-shop-title">
  <div class="plane-back">
    <div class="st-ground"></div>
    ${leaves({ tone: 'gold', cls: 'st-ground__leaves' })}
    ${halftone({ color: 'gold', at: 'tr', cls: 'sp-shop__dots' })}
    ${grain()}
  </div>
  <div class="wrap">
    <div class="cats__head sp-shop__head">
      <p class="cats__eyebrow"${reveal('fade')}>${patch(`Shop ${s.city}`, { tone: 'gold', icon: 'bag' })}</p>
      <h2 id="sp-shop-title" class="h-display cats__title sheen"${reveal('up', 1)}>Categories</h2>
      <p class="lead cats__lead"${reveal('up', 2)}>Each category opens on the live menu at Star Buds in ${esc(s.city)}.</p>
    </div>
    <ul class="cats__grid sp-shop__grid" role="list" data-stagger>${ctx.categories.map((c, i) => `
      <li class="cats__item">
        <a class="cat glass" href="${esc(liveMenu(ctx, s.slug, c.slug))}" target="_blank" rel="noopener" data-tilt="3">
          <span class="cat__stitch stitch" aria-hidden="true"></span>
          ${cutout(cutFor(c.cutout), { cls: 'cat__cut', depth: 0, float: false, sizes: '(max-width: 700px) 30vw, 180px' })}
          <span class="cat__num numeral" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="cat__label">${esc(c.label)}</span>
          <span class="cat__cta"><span>Shop<span class="cat__cta-x"> ${esc(c.label)}</span></span>${icon('arrow')}</span>
        </a>
      </li>`).join('')}
    </ul>
    <div class="btn-row sp-shop__all">${btn('Open the live menu', s.liveUrl || liveMenu(ctx, s.slug), { variant: 'chrome', icon: 'external', attrs: ext })}</div>
  </div>
  ${cutout('cut-leaf', { cls: 'sp-shop__leaf', depth: 0.12, float: 'slow', rotate: -24, sizes: '(max-width: 700px) 26vw, 200px' })}
</section>`;
}

function storeInfo(ctx, s) {
  const visit = Array.isArray(s.visit) ? s.visit : [];
  const panel = `
    <div class="sp-info__panel stitch stitch--draw"${reveal('up')}>
      <p class="sp-info__eyebrow">${patch('Dispensary info', { tone: 'gold', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sp-info-title" class="h-display sp-info__title">Visit Star Buds ${esc(s.city)}</h2>
      ${statusBlock(s)}
      <div class="sp-info__cols">
        <div class="sp-info__contact">
          <p class="sp-info__label">Address</p>
          <p class="sp-info__address">${(s.address || []).map(esc).join('<br>')}</p>
          ${s.phone ? `<p class="sp-info__label">Phone</p><p class="sp-info__phone"><a href="tel:${esc(s.tel || s.phone)}">${esc(s.phone)}</a></p>` : ''}
          <div class="sp-info__actions">
            ${s.mapUrl ? btn('Directions', s.mapUrl, { variant: 'gold', icon: 'directions', attrs: ext }) : ''}
            ${s.tel ? btn('Call', 'tel:' + s.tel, { variant: 'ghost', icon: 'phone', attrs: { 'aria-label': `Call ${shortName(s)}` } }) : ''}
          </div>
          <a class="link-arrow sp-info__live" href="${esc(s.liveUrl || liveMenu(ctx, s.slug))}" target="_blank" rel="noopener">Open the live store page${icon('external')}</a>
        </div>
        <div class="sp-info__hours">
          <p class="sp-info__label">Hours</p>
          ${hoursTable(s)}
        </div>
      </div>
    </div>`;
  const faq = visit.length ? `
    <div class="sp-faq"${reveal('up', 2)}>
      <p class="sp-faq__eyebrow">${patch('Know before you go', { tone: 'green', icon: 'star', size: 'sm' })}</p>
      ${visit.map((v, i) => `
      <details class="sp-faq__item"${i === 0 ? ' open' : ''}>
        <summary class="sp-faq__q"><span class="sp-faq__n numeral numeral--gold" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="sp-faq__qt">${esc(v.q)}</span><span class="sp-faq__tog" aria-hidden="true">${icon('plus', 'sp-faq__plus')}${icon('minus', 'sp-faq__minus')}</span></summary>
        <p class="sp-faq__a">${esc(v.a)}</p>
      </details>`).join('')}
    </div>` : '';
  return `
<section class="section section--bone sp-info" id="info" aria-labelledby="sp-info-title">
  <div class="plane-back">
    ${leaves({ tone: 'light', cls: 'sp-info__leaves' })}
    ${halftone({ color: 'ink', at: 'br' })}
    ${grain({ cls: 'sp-info__grain' })}
  </div>
  ${seam({ kind: 'double' })}
  <div class="wrap sp-info__grid${faq ? '' : ' sp-info__grid--solo'}">
    ${panel}
    ${faq}
  </div>
  ${cutout('cut-tincture', { cls: 'sp-info__cut', depth: -0.08, float: 'fast', rotate: -8, sizes: '(max-width: 700px) 24vw, 180px' })}
</section>`;
}

function storeAbout(ctx, s) {
  const about = (s.about || []).filter(Boolean);
  if (!about.length) return '';
  const social = Array.isArray(s.social) ? s.social : [];
  const st = stateOf(ctx, s.state);
  return `
<section class="section section--green sp-about on-dark" aria-labelledby="sp-about-title">
  <div class="plane-back">
    ${leaves({ tone: 'bone' })}
    <p class="sp-about__word" aria-hidden="true">${esc(s.city)}</p>
    ${halftone({ color: 'gold', at: 'tr' })}
    ${grain()}
    <div class="vignette"></div>
  </div>
  ${seam({ kind: 'double' })}
  <div class="wrap sp-about__grid">
    <div class="sp-about__head">
      <p class="sp-about__eyebrow"${reveal('fade')}>${patch('About the store', { tone: 'gold', icon: 'star', size: 'sm' })}</p>
      <h2 id="sp-about-title" class="h-display sp-about__title"${reveal('up', 1)}>Star Buds <span class="gold-text">${esc(s.city)}</span></h2>
      ${pinstripe({ cls: 'sp-about__rule' })}
      <div class="sp-about__rocker"${reveal('up', 2)}>${rocker(st.name, { pos: 'bottom', tone: 'gold', radius: 260, band: 46, angle: 26, decorative: true })}</div>
    </div>
    ${glass(`
      ${about.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${social.length ? `<div class="btn-row sp-about__social">${social.map((x) => btn(x.label, x.href, { variant: 'chrome', size: 'sm', icon: 'external', attrs: ext })).join('')}</div>` : ''}`, { stitch: true, cls: 'sp-about__copy', attrs: { 'data-reveal': 'right' } })}
  </div>
  ${patchCut('patch-star', { cls: 'sp-about__patch', depth: 0.1, rotate: -4, sizes: '140px' })}
</section>`;
}

function storeNearby(ctx, s) {
  const st = stateOf(ctx, s.state);
  const others = ctx.stores.filter((x) => x.state === s.state && x.slug !== s.slug);
  let inner;
  if (others.length) {
    inner = `
    <div class="sp-near__head">
      <p class="sp-near__eyebrow"${reveal('fade')}>${patch(st.name, { tone: 'gold', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sp-near-title" class="h-display sp-near__title sheen"${reveal('up', 1)}>Other Star Buds stores in ${esc(st.name)}</h2>
    </div>
    <ul class="st-grid sp-near__grid" role="list" data-stagger>${others.map((x) => `<li>${storeCard(ctx, x)}</li>`).join('')}
    </ul>`;
  } else {
    const groups = ctx.storesByState.filter((g) => g.state.code !== s.state);
    inner = `
    <div class="sp-near__head">
      <p class="sp-near__eyebrow"${reveal('fade')}>${patch('Locations', { tone: 'gold', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sp-near-title" class="h-display sp-near__title sheen"${reveal('up', 1)}>More Star Buds locations</h2>
    </div>
    <div class="sp-near__states" data-stagger>${groups.map((g) => glass(`
      <h3 class="sp-near__state"><span class="sr-only">${esc(g.state.name)}</span>${rocker(g.state.name, { tone: 'gold', radius: 260, band: 46, angle: 24, decorative: true, cls: 'sp-near__rocker' })}</h3>
      <ul class="sp-near__chips" role="list">${g.stores.map((x) => `<li><a class="chip" href="/stores/${esc(x.slug)}/">${icon('pin')}${esc(x.city)}</a></li>`).join('')}</ul>`, { stitch: true, cls: 'sp-near__group' })).join('')}
    </div>`;
  }
  return `
<section class="section section--leather sp-near" aria-labelledby="sp-near-title">
  <div class="plane-back">
    <div class="st-ground"></div>
    ${leaves({ tone: 'gold', cls: 'st-ground__leaves' })}
    ${halftone({ color: 'gold', at: 'bl' })}
    ${grain()}
  </div>
  ${seam({ kind: 'pinstripe' })}
  <div class="wrap">
    ${inner}
    <div class="btn-row sp-near__all">${btn('All locations', '/stores/', { variant: 'gold', icon: 'pin' })}</div>
  </div>
  ${patchCut(others.length ? 'flash-bud' : 'chrome-star', { cls: 'sp-near__cut' + (others.length ? '' : ' sp-near__cut--chrome'), depth: 0.1, rotate: others.length ? 4 : 10, sizes: '(max-width: 700px) 26vw, 180px' })}
</section>`;
}

function storePage(ctx, s) {
  const p = `/stores/${s.slug}/`;
  const st = stateOf(ctx, s.state);
  const about = storeAbout(ctx, s);
  const hoursAttr = hasHours(s) ? ` data-sp-hours="${esc(json({ tz: TZ[s.state] || 'America/Chicago', hours: s.hours }))}"` : '';
  const body = `<div class="sp"${hoursAttr}>
${storeHero(ctx, s)}
${storeShop(ctx, s)}
${storeInfo(ctx, s)}
${about}
${storeNearby(ctx, s)}
</div>${hasHours(s) ? `\n<script>${HOURS_JS}</script>` : ''}`;
  const addr = (s.address || []).join(', ');
  return {
    path: p,
    html: page({
      ctx, path: p, bodyClass: 'page-store',
      title: `${shortName(s)}, ${s.state}: store and live menu`,
      description: `You're shopping at Star Buds in ${s.city}, ${st.name}: ${addr}${s.phone ? ', ' + s.phone : ''}. Store info${hasHours(s) ? ', hours' : ''}, directions and the live menu.`,
      body,
    }),
  };
}

export function render(ctx) {
  return [storesIndex(ctx), ...ctx.stores.map((s) => storePage(ctx, s))];
}
