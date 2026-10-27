// finder.mjs (FINDER lane, REVISION-1 R1.3): the home-page store finder, a list panel beside an inline SVG map.
// export finderSection(ctx) -> HTML string. The map data comes from src/content/vendor/us-map.json (written by
// tools/geo-build.mjs from us-atlas@3, ISC) and the store coordinates from src/content/geo.json (Nominatim, once).
// Copy: store facts from site.json; everything else is neutral UI (BUILD-CONTRACT 2).
// Every link is rendered here: internal store-page links root-absolute (the preview rewrite prefixes HTML attributes),
// external ones absolute (liveUrl, mapUrl). src/scripts/finder.js only reads them.
// Revision 3 ("Starlight", docs/REVISION-3.md): a night map (dark glass states, the Star Buds states glowing aurora
// green, glowing star pins), frosted glass list and card; decorative markup only, every hook finder.js reads is kept.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, attrs, icon, cutout } from './shell.mjs';

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

/** the glowing star pin (drawn at 1px = 1 unit; finder.js scales it to a constant screen size). Revision 3: a soft
 *  starlight halo that twinkles (desynced per pin by --tw), a small night-glass disc and a pale-gold star. */
function starPoints(r, ri) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const t = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? ri : r; pts.push((rr * Math.cos(t)).toFixed(2) + ',' + (rr * Math.sin(t)).toFixed(2)); }
  return pts.join(' ');
}

function pin(s, i) {
  const [x, y] = MAP.points[s.slug];
  const side = LABEL[s.slug] || 'r';
  const lab = { l: { x: -15, y: 4, a: 'end' }, r: { x: 15, y: 4, a: 'start' }, t: { x: 0, y: -16, a: 'middle' }, b: { x: 0, y: 25, a: 'middle' } }[side];
  return `<a class="pin" href="/stores/${esc(s.slug)}/" data-finder-pin="${esc(s.slug)}" data-state="${esc(s.state)}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y}) scale(1.3)" style="--tw:${((i * 0.83) % 4.2).toFixed(2)}s" aria-label="${esc(s.city)}, ${esc(s.state)}: ${esc(s.name)}">
          <circle class="pin__hit" r="17"/>
          <circle class="pin__halo" r="16" fill="url(#fmap-halo)"/>
          <circle class="pin__badge" r="7.8"/>
          <polygon class="pin__star" fill="url(#fmap-star)" points="${starPoints(6.2, 2.6)}"/>
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
        <linearGradient id="fmap-glass" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="975" y2="610"><stop offset="0" stop-color="#8D7BFF" stop-opacity=".2"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity=".055"/><stop offset="1" stop-color="#38E1D0" stop-opacity=".12"/></linearGradient>
        <radialGradient id="fmap-halo"><stop offset="0" stop-color="#FFF8E1" stop-opacity=".85"/><stop offset=".3" stop-color="#FFE9A8" stop-opacity=".34"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
        <linearGradient id="fmap-star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFF1C9"/><stop offset="1" stop-color="#FFE9A8"/></linearGradient>
        <path id="fmap-coast" d="${MAP.coast}" vector-effect="non-scaling-stroke"/>
        ${ours.map((s) => `<path id="fmap-d-${codeOf[s.id]}" d="${s.d}" vector-effect="non-scaling-stroke"/>`).join('')}
      </defs>
      <path class="fmap__grat" d="${MAP.graticule}"/>
      <g class="fmap__water" aria-hidden="true">
        <use href="#fmap-coast" class="fmap__wl fmap__wl--3"/><use href="#fmap-coast" class="fmap__wl fmap__wl--2"/><use href="#fmap-coast" class="fmap__wl fmap__wl--1"/>
      </g>
      <g class="fmap__land" aria-hidden="true">
        ${others.map((s) => `<path class="st" fill="url(#fmap-glass)" d="${s.d}"/>`).join('')}
      </g>
      <use href="#fmap-coast" class="fmap__coast" aria-hidden="true"/>
      <g class="fmap__halo" aria-hidden="true">
        ${ours.map((s) => `<use href="#fmap-d-${codeOf[s.id]}" class="fmap__halo-u fmap__halo-u--wide"/><use href="#fmap-d-${codeOf[s.id]}" class="fmap__halo-u"/>`).join('')}
      </g>
      <g class="fmap__ours">
        ${ours.map((s) => `<use href="#fmap-d-${codeOf[s.id]}" class="st st--sb" data-finder-state="${codeOf[s.id]}" data-bbox="${s.bbox.join(' ')}"><title>${esc(s.name)}: ${count[codeOf[s.id]] || 0} ${count[codeOf[s.id]] === 1 ? 'location' : 'locations'}</title></use>`).join('')}
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
    <span class="finder__aurora"></span>
    <span class="finder__stars"></span>
    <span class="finder__stars finder__stars--b"></span>
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
          <div class="finder__viewport" data-finder-viewport>
            ${mapSvg(ctx)}
          </div>
          <div class="finder__cartouche" aria-hidden="true"><span class="finder__place"><span data-finder-rocker-text>All Locations</span></span></div>
          <button type="button" class="finder__reset" data-finder-reset hidden>${icon('arrow')}All states</button>
          <p class="finder__credit">Map: U.S. Census Bureau shapes via us-atlas · pins: OpenStreetMap Nominatim</p>
          ${cutout('cut-jar', { cls: 'finder__bud', depth: 0.08, float: 'slow', rotate: 10, sizes: '(max-width: 700px) 110px, 190px' })}
        </div>
        <div class="finder__cards" data-finder-cards>
        ${ctx.stores.map((s) => card(s, stateBy[s.state])).join('')}
        </div>
      </div>
    </div>
  </div>
</section>`;
}
