// finder.mjs (FINDER lane, REVISION-1 R1.3): the home-page store finder, a list panel beside an inline SVG map.
// export finderSection(ctx) -> HTML string. The map data comes from src/content/vendor/us-map.json (written by
// tools/geo-build.mjs from us-atlas@3, ISC) and the store coordinates from src/content/geo.json (Nominatim, once).
// Copy: store facts from site.json; everything else is neutral UI (BUILD-CONTRACT 2).
// Every link is rendered here: internal store-page links root-absolute (the preview rewrite prefixes HTML attributes),
// external ones absolute (liveUrl, mapUrl). src/scripts/finder.js only reads them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, attrs, icon, cutout, imgUrl } from './shell.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const MAP = readJson('src/content/vendor/us-map.json');
const GEO = readJson('src/content/geo.json');

const FIPS = { MS: '28', OK: '40', MD: '24', NY: '36' };
const TZ = { MS: 'America/Chicago', OK: 'America/Chicago', MD: 'America/New_York', NY: 'America/New_York' };
// which side of the pin the city label sits on when zoomed in (keeps close neighbours apart)
const LABEL = {
  'greenwood-dispensary': 'l', 'natchez-dispensary': 'r', 'ocean-springs-dispensary': 'l', pearl: 'r',
  'oxford-dispensary': 'l', 'tupelo-saltillo-dispensary': 'r', 'lawton-dispensary': 'b', 'altus-dispensary': 'l',
  'ardmore-dispensary': 'r', 'chickasha-dispensary': 't', 'baltimore-dispensary': 'r', 'buffalo-dispensary': 'r',
};
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

const listJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const fmtTime = (t) => String(t).replace(/^(\d{1,2}:\d{2})\s*([AP]M)$/i, '$1 $2');
const fmtRange = (r) => r.split('-').map((x) => fmtTime(x.trim())).join(' – ');

/** "Open daily 8:00 AM – 12:00 AM" or "Mon–Sat 8:00 AM – 9:00 PM · Sun 8:00 AM – 7:00 PM"; '' without hours */
function hoursSummary(hours) {
  if (!hours || !hours.length) return '';
  const by = Object.fromEntries(hours.map((h) => [h.day, h.time]));
  const runs = [];
  for (const d of DAYS) {
    if (!by[d]) continue;
    const last = runs[runs.length - 1];
    if (last && last.time === by[d] && DAYS.indexOf(last.to) === DAYS.indexOf(d) - 1) last.to = d;
    else runs.push({ from: d, to: d, time: by[d] });
  }
  if (runs.length === 1 && runs[0].from === 'Monday' && runs[0].to === 'Sunday') return 'Open daily ' + fmtRange(runs[0].time);
  return runs.map((r) => (r.from === r.to ? SHORT[r.from] : SHORT[r.from] + '–' + SHORT[r.to]) + ' ' + fmtRange(r.time)).join(' · ');
}

/** a curved rocker patch (SVG textPath on an arc) with a twill fill and a stitched border */
function rocker({ id, text, cls = '', r1 = 300, thick = 46, deg = 26 }) {
  const a = (deg * Math.PI) / 180, r2 = r1 - thick, pad = 6;
  const w = Math.ceil(2 * r1 * Math.sin(a)) + pad * 2;
  const cx = w / 2, cy = r1 + pad;
  const h = Math.ceil(cy - r2 * Math.cos(a)) + pad;
  const P = (r, t) => [(cx + r * Math.sin(t)).toFixed(1), (cy - r * Math.cos(t)).toFixed(1)].join(' ');
  const band = (o, i) => `M${P(o, -a)} A${o} ${o} 0 0 1 ${P(o, a)} L${P(i, a)} A${i} ${i} 0 0 0 ${P(i, -a)}Z`;
  const s = 5; // stitch inset
  const sa = a - s / r1;
  const stitch = `M${P(r1 - s, -sa)} A${r1 - s} ${r1 - s} 0 0 1 ${P(r1 - s, sa)} L${P(r2 + s, sa)} A${r2 + s} ${r2 + s} 0 0 0 ${P(r2 + s, -sa)}Z`;
  const rt = r2 + thick * 0.3; // text baseline radius
  return `<svg class="rocker ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="${id}-twill" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" class="rocker__ground"/><path d="M0 0V5" class="rocker__twill"/></pattern>
      <path id="${id}-arc" d="M${P(rt, -a - 0.2)} A${rt} ${rt} 0 0 1 ${P(rt, a + 0.2)}"/>
    </defs>
    <path class="rocker__shadow" d="${band(r1, r2)}" transform="translate(0 3)"/>
    <path class="rocker__band" d="${band(r1, r2)}" fill="url(#${id}-twill)"/>
    <path class="rocker__stitch" d="${stitch}"/>
    <text class="rocker__text"><textPath href="#${id}-arc" startOffset="50%" text-anchor="middle" data-finder-rocker-text>${esc(text)}</textPath></text>
  </svg>`;
}

/** the chrome-star pin (drawn at 1px = 1 unit; finder.js scales it to a constant screen size) */
function starPoints(r, ri) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const t = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? ri : r; pts.push((rr * Math.cos(t)).toFixed(2) + ',' + (rr * Math.sin(t)).toFixed(2)); }
  return pts.join(' ');
}

function pin(s) {
  const [x, y] = MAP.points[s.slug];
  const side = LABEL[s.slug] || 'r';
  const lab = { l: { x: -15, y: 4, a: 'end' }, r: { x: 15, y: 4, a: 'start' }, t: { x: 0, y: -16, a: 'middle' }, b: { x: 0, y: 25, a: 'middle' } }[side];
  return `<a class="pin" href="/stores/${esc(s.slug)}/" data-finder-pin="${esc(s.slug)}" data-state="${esc(s.state)}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y}) scale(1.3)" aria-label="${esc(s.city)}, ${esc(s.state)}: ${esc(s.name)}">
          <circle class="pin__hit" r="17"/>
          <circle class="pin__badge" r="11" stroke="url(#fmap-gold)"/>
          <circle class="pin__stitch" r="8.4"/>
          <polygon class="pin__star" fill="url(#fmap-chrome)" points="${starPoints(7.2, 3)}"/>
          <text class="pin__label" x="${lab.x}" y="${lab.y}" text-anchor="${lab.a}">${esc(s.city)}</text>
        </a>`;
}

function mapSvg(ctx) {
  const sbIds = new Set(ctx.storesByState.map((g) => FIPS[g.state.code]).filter(Boolean));
  const codeOf = Object.fromEntries(Object.entries(FIPS).map(([k, v]) => [v, k]));
  const others = MAP.states.filter((s) => !sbIds.has(s.id));
  const ours = MAP.states.filter((s) => sbIds.has(s.id));
  const count = Object.fromEntries(ctx.storesByState.map((g) => [g.state.code, g.stores.length]));
  return `<svg class="fmap" viewBox="${MAP.viewBox.join(' ')}" preserveAspectRatio="xMidYMid meet" data-finder-svg role="group" aria-labelledby="finder-map-title">
      <title id="finder-map-title">Map of the ${ctx.stores.length} Star Buds locations in ${esc(listJoin(ctx.storesByState.map((g) => g.state.name)))}</title>
      <defs>
        <pattern id="fmap-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><rect width="4" height="4" class="fmap__hatch-bg"/><path d="M0 0V4" class="fmap__hatch-line"/></pattern>
        <linearGradient id="fmap-chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F7F5"/><stop offset=".38" stop-color="#B9BEC2"/><stop offset=".52" stop-color="#5D6368"/><stop offset=".7" stop-color="#E9EBEC"/><stop offset="1" stop-color="#8D9398"/></linearGradient>
        <linearGradient id="fmap-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3DD9A"/><stop offset=".34" stop-color="#D9B45E"/><stop offset=".54" stop-color="#9C7A2E"/><stop offset=".74" stop-color="#E4C273"/><stop offset="1" stop-color="#B08A3A"/></linearGradient>
        <path id="fmap-coast" d="${MAP.coast}"/>
      </defs>
      <path class="fmap__grat" d="${MAP.graticule}"/>
      <g class="fmap__water" aria-hidden="true">
        <use href="#fmap-coast" class="fmap__wl fmap__wl--3"/><use href="#fmap-coast" class="fmap__wl fmap__wl--3b"/>
        <use href="#fmap-coast" class="fmap__wl fmap__wl--2"/><use href="#fmap-coast" class="fmap__wl fmap__wl--2b"/>
        <use href="#fmap-coast" class="fmap__wl fmap__wl--1"/><use href="#fmap-coast" class="fmap__wl fmap__wl--1b"/>
      </g>
      <g class="fmap__land" aria-hidden="true">
        ${others.map((s) => `<path class="st" fill="url(#fmap-hatch)" d="${s.d}"/>`).join('')}
      </g>
      <use href="#fmap-coast" class="fmap__coast" aria-hidden="true"/>
      <g class="fmap__ours">
        ${ours.map((s) => `<path class="st st--sb" d="${s.d}" data-finder-state="${codeOf[s.id]}" data-bbox="${s.bbox.join(' ')}"><title>${esc(s.name)}: ${count[codeOf[s.id]] || 0} ${count[codeOf[s.id]] === 1 ? 'location' : 'locations'}</title></path>`).join('')}
      </g>
      <g class="fmap__pins">
        ${ctx.stores.filter((s) => MAP.points[s.slug]).map(pin).join('')}
      </g>
    </svg>`;
}

function row(s, state) {
  const g = GEO[s.slug];
  const search = [s.city, s.name, s.state, state ? state.name : '', ...s.address].join(' ').toLowerCase();
  return `<li class="frow" data-finder-row="${esc(s.slug)}" data-state="${esc(s.state)}" data-search="${esc(search)}"${g ? ` data-lat="${g.lat}" data-lon="${g.lon}"` : ''}>
          <a class="frow__link" href="/stores/${esc(s.slug)}/" data-finder-pick="${esc(s.slug)}">
            <span class="frow__code" aria-hidden="true">${esc(s.state)}</span>
            <span class="frow__body">
              <span class="frow__city">${esc(s.city)}<span class="sr-only">, ${esc(state ? state.name : s.state)}</span></span>
              <span class="frow__addr">${esc(s.address.join(', '))}</span>
              <span class="frow__meta"><span class="frow__status" data-finder-status="${esc(s.slug)}"></span><span class="frow__mine">Your store</span><span class="frow__dist" data-finder-dist></span></span>
            </span>
            ${icon('chevron', 'frow__chev')}
          </a>
        </li>`;
}

function card(s, state) {
  const hrs = hoursSummary(s.hours);
  const g = GEO[s.slug];
  const hoursData = s.hours && s.hours.length ? JSON.stringify(DAYS.map((d) => { const h = s.hours.find((x) => x.day === d); return h ? h.time : ''; })) : '';
  const embedQ = s.address.join(', ');
  return `<article class="fcard" id="fcard-${esc(s.slug)}" data-finder-card="${esc(s.slug)}" data-state="${esc(s.state)}"${attrs({ 'data-tz': TZ[s.state] || false, 'data-hours': hoursData || false, 'data-embed-q': embedQ, 'data-embed-title': `Street map of ${s.name} (Google Maps)` })} aria-labelledby="fcard-${esc(s.slug)}-title" hidden>
          <button type="button" class="fcard__close" data-finder-close aria-label="Close store details">${icon('close')}</button>
          <p class="fcard__eyebrow"><span class="fcard__code">${esc(s.state)}</span> ${esc(state ? state.name : s.state)}</p>
          <h3 class="fcard__city" id="fcard-${esc(s.slug)}-title" tabindex="-1">${esc(s.city)}</h3>
          <p class="fcard__name">${esc(s.name)}</p>
          <p class="fcard__addr">${icon('pin')}<span>${esc(s.address[0])}<br>${esc(s.address.slice(1).join(', '))}</span></p>
          ${s.tel ? `<p class="fcard__line">${icon('phone')}<a href="tel:${esc(s.tel)}">${esc(s.phone)}</a></p>` : ''}
          <p class="fcard__line fcard__hours">${icon('clock')}<span>${hrs ? `${esc(hrs)}${hoursData ? `<span class="fcard__status" data-finder-status="${esc(s.slug)}"></span>` : ''}` : 'Hours: see the store page'}</span></p>
          ${g && g.precision === 'city' ? '<p class="fcard__note">Map pin shows the town centre; use Directions for the exact address.</p>' : ''}
          <div class="fcard__actions">
            <a class="fbtn fbtn--gold" href="${esc(s.liveUrl)}" target="_blank" rel="noopener" data-finder-live>Shop the live menu${icon('external')}</a>
            <a class="fbtn" href="/stores/${esc(s.slug)}/" data-finder-storepage>View store${icon('arrow')}</a>
            <a class="fbtn" href="${esc(s.mapUrl)}" target="_blank" rel="noopener">Directions${icon('directions')}</a>
          </div>
          <div class="fcard__tools">
            <button type="button" class="fcard__pick" data-store-pick="${esc(s.slug)}" data-no-toast aria-pressed="false"><span class="fcard__pick-off">${icon('star')}Make this my store</span><span class="fcard__pick-on">${icon('star')}Your store</span></button>
            <button type="button" class="fcard__street" data-finder-street aria-expanded="false" aria-controls="fcard-${esc(s.slug)}-street">${icon('pin')}Street map</button>
          </div>
          <div class="fcard__embed" id="fcard-${esc(s.slug)}-street" data-finder-embed hidden></div>
        </article>`;
}

/**
 * finderSection(ctx, opts?) -> the finder section (render it at most once per page: its ids are fixed).
 * opts (revision 2, LOCATIONS: the same finder on /dispensaries/): eyebrow ('Store finder'), title ('Find your store'),
 * lead (default: the store count line), cls (extra class on the section). No opts = the home-page output, unchanged.
 */
export function finderSection(ctx, opts = {}) {
  const { eyebrow = 'Store finder', title = 'Find your store', lead = null, cls = '' } = opts;
  const stateBy = Object.fromEntries(ctx.states.map((s) => [s.code, s]));
  const groups = ctx.storesByState;
  const n = ctx.stores.length;
  const missing = ctx.stores.filter((s) => !MAP.points[s.slug]).map((s) => s.slug);
  if (missing.length) console.warn('warning: finder: no map point for ' + missing.join(', ') + ' (run node tools/geo-build.mjs)');
  const tab = (code, label, count, pressed) => `<button type="button" class="ftab" data-finder-tab="${esc(code)}" aria-pressed="${pressed}"><span class="ftab__label">${esc(label)}</span><span class="ftab__n">${count}</span>${code !== 'all' && stateBy[code] ? `<span class="sr-only"> ${esc(stateBy[code].name)}</span>` : ''}</button>`;
  return `
<section class="section finder on-dark${cls ? ' ' + esc(cls) : ''}" id="locations" aria-labelledby="finder-title" data-finder>
  <div class="plane-back finder__back">
    <span class="finder__leather" style="background-image:url('${imgUrl('g-leather', 1440)}')"></span>
    <span class="finder__dots"></span>
    <span class="finder__grain"></span>
  </div>
  <div class="wrap finder__wrap">
    <header class="finder__head">
      <p class="finder__tab" data-reveal="up"><span>${esc(eyebrow)}</span></p>
      <h2 class="finder__title" id="finder-title" data-reveal="up" style="--i:1">${esc(title)}</h2>
      <p class="finder__lead" data-reveal="up" style="--i:2">${lead != null ? esc(lead) : `${n} ${n === 1 ? 'location' : 'locations'} in ${esc(listJoin(groups.map((g) => g.state.name)))}. Pick a pin or a store for its hours, directions and live menu.`}</p>
    </header>
    <div class="finder__grid">
      <div class="finder__list" data-reveal="up" style="--i:1">
        <div class="finder__search" role="search">
          <label class="finder__label" for="finder-q">City, state or ZIP</label>
          <div class="finder__field">
            <input id="finder-q" class="finder__input" type="search" autocomplete="off" spellcheck="false" placeholder="e.g. Pearl, OK or 21206" data-finder-q>
            <button type="button" class="finder__near" data-finder-near>${icon('locate')}Near me</button>
          </div>
        </div>
        <div class="finder__tabs" role="group" aria-label="Filter by state">
          ${tab('all', 'All', n, true)}
          ${groups.map((g) => tab(g.state.code, g.state.code, g.stores.length, false)).join('')}
        </div>
        <p class="finder__count" aria-live="polite" data-finder-count>${n} ${n === 1 ? 'location' : 'locations'}</p>
        <p class="finder__msg" role="status" data-finder-msg hidden></p>
        <ol class="finder__rows" role="list" data-finder-rows>
        ${ctx.stores.map((s) => row(s, stateBy[s.state])).join('')}
        </ol>
      </div>
      <div class="finder__mapcol" data-reveal="up" style="--i:2">
        <div class="finder__frame" data-finder-frame>
          <span class="finder__corner finder__corner--tl" aria-hidden="true"></span><span class="finder__corner finder__corner--tr" aria-hidden="true"></span>
          <span class="finder__corner finder__corner--bl" aria-hidden="true"></span><span class="finder__corner finder__corner--br" aria-hidden="true"></span>
          <div class="finder__viewport" data-finder-viewport>
            ${mapSvg(ctx)}
          </div>
          <div class="finder__cartouche">${rocker({ id: 'frk', text: 'All Locations', cls: 'finder__rocker' })}</div>
          <button type="button" class="finder__reset" data-finder-reset hidden>${icon('arrow')}All states</button>
          <svg class="finder__compass" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="27" class="cmp__ring"/><circle cx="32" cy="32" r="22.5" class="cmp__stitch"/><polygon class="cmp__star" points="32,9 36,28 55,32 36,36 32,55 28,36 9,32 28,28"/><polygon class="cmp__n" points="32,9 36,28 32,32 28,28"/><text x="32" y="7" class="cmp__label">N</text></svg>
          <p class="finder__credit">Map: U.S. Census Bureau shapes via us-atlas · pins: OpenStreetMap Nominatim</p>
          ${cutout('patch-wings', { cls: 'finder__wings', depth: 0.08, float: 'slow', sizes: '(max-width: 700px) 150px, 230px' })}
        </div>
        <div class="finder__cards" data-finder-cards>
        ${ctx.stores.map((s) => card(s, stateBy[s.state])).join('')}
        </div>
      </div>
    </div>
  </div>
  ${cutout('flash-leaf', { cls: 'finder__flash', depth: -0.1, float: 'slow', sizes: '(max-width: 700px) 120px, 210px' })}
</section>`;
}
