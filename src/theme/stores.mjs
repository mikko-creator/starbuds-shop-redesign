// stores.mjs - LOCATIONS lane (revision 2, "Iron Star"): the 12 store pages /stores/<slug>/ in the location-page order
// of the revision 2 target architecture (docs/REVISION-2.md: H1 store name; rewards sign-up strip; dispensary details;
// more information; visiting the state's stores (visit Q&As + an amenities grid); state deals; state FAQs; dispensaries
// nearby), plus /stores/ as a redirect stub to /dispensaries/. Shared location pieces (store card, breadcrumbs, state
// FAQ, deals lookup, state URLs) are exported for states.mjs, which renders /dispensaries/ and the state pages.
// Copy: site.json / faq.json text and the captured Star Buds pages (www.starbuds.us, 2026-10-23) only, plus neutral
// UI labels. Reviews and lounges are omitted (no Star Buds source). Store photos are real captured photos; stores
// without one get a leather tile with the city in blackletter (never a generated stand-in for a store).
// Classes: st- (shared store card), sp- (store page), sh- (breadcrumbs and the state FAQ, shared with states.mjs).
import { page, esc, attrs, icon, btn, img, glass, patch, seal, rocker, halftone, leaves, grain, cutout, patchCut, seam, pinstripe, marquee, reveal, menuAttrs, liveMenu } from './shell.mjs';
import * as SHELL from './shell.mjs';
import { faqData } from './faq.mjs';

const TZ = { MS: 'America/Chicago', OK: 'America/Chicago', MD: 'America/New_York', NY: 'America/New_York' };
/** per state: [product cut-out crossing a seam, embroidered patch / chrome / flash cut-out] */
const STATE_CUT = { MS: ['cut-bud', 'patch-leaf'], OK: ['cut-jar', 'patch-wings'], MD: ['cut-gummies', 'flash-bud'], NY: ['cut-preroll', 'chrome-star'] };
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const STATE_SLUG = { MS: 'mississippi', OK: 'oklahoma', MD: 'maryland', NY: 'new-york' };
export const stateHref = (code) => `/dispensaries/${STATE_SLUG[code] || String(code).toLowerCase()}/`;
export const dealsHref = (code) => stateHref(code) + 'deals/';
export const lawsHref = (code) => `/cannabis-laws-by-state/${STATE_SLUG[code] || String(code).toLowerCase()}/`;
export const cardHref = (code) => `/getting-a-medical-card/${STATE_SLUG[code] || String(code).toLowerCase()}/`;
export const dealsFor = (ctx, code) => (ctx.site.deals || []).filter((d) => d && d.state === code);
export const hasDealsPage = (ctx, code) => dealsFor(ctx, code).length > 0;

export const listJoin = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
export const shortName = (s) => s.shortName || `Star Buds ${s.city}`;
const fmtTime = (t) => String(t || '').replace(/\s*-\s*/, ' – ');
export const EXT = { target: '_blank', rel: 'noopener' };
const hasHours = (s) => Array.isArray(s.hours) && s.hours.length > 0;
export const stateOf = (ctx, code) => (ctx.states || []).find((x) => x.code === code) || { code, name: code };
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
/** the pop-era stickers are retired: a category that still points at one gets an embroidered patch (as on the home page) */
const cutFor = (id) => (/^pop-/.test(id || '') ? 'patch-leaf' : id);
const starSrc = (ctx) => ctx.site.brand?.star || '/assets/brand/star-on-dark.png';
/** "Star Buds <gold>Lawton</gold>": the brand words plain, the rest in antique gold */
const nameHtml = (name, cls) => {
  const m = /^(Star Buds)\s+(.+)$/.exec(name);
  return m ? `${esc(m[1])} <span class="gold-text ${cls}">${esc(m[2])}</span>` : `<span class="gold-text ${cls}">${esc(name)}</span>`;
};
/** escaped text with captured quotations (“...”) wrapped for styling */
const rich = (s) => esc(s).replace(/“([^”]+)”/g, '<q class="sh-quote">$1</q>');

// ---------- shared: breadcrumbs ----------
/** crumbs([{ label, href }, ...]) -> breadcrumb trail; the last item is the current page (no link). FOUNDATION's
 *  shared crumbs() (sb-crumbs) when shell.mjs exports it, else the same markup rendered here. */
export function crumbs(items) {
  if (typeof SHELL.crumbs === 'function') return SHELL.crumbs(items);
  return `<nav class="sb-crumbs" aria-label="Breadcrumb"><ol class="sb-crumbs__list" role="list">${items.map((it, i) => {
    const last = i === items.length - 1;
    return `<li class="sb-crumbs__item">${last || !it.href ? `<span class="sb-crumbs__here"${last ? ' aria-current="page"' : ''}>${esc(it.label)}</span>` : `<a class="sb-crumbs__link" href="${esc(it.href)}">${esc(it.label)}</a>`}${last ? '' : icon('star', 'sb-crumbs__sep')}</li>`;
  }).join('')}</ol></nav>`;
}

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

export function pickButton(s, cls = 'st-pick') {
  return `<button type="button" class="${cls}" data-store-pick="${esc(s.slug)}" data-no-toast aria-pressed="false">${icon('star')}<span class="st-pick__off">Make this my store</span><span class="st-pick__on">My store</span><span class="sr-only"> (${esc(shortName(s))})</span></button>`;
}

export function storeCard(ctx, s, { level = 'h3', sizes = '(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 380px' } = {}) {
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
            ${s.mapUrl ? btn('Directions', s.mapUrl, { variant: 'ghost', size: 'sm', icon: 'directions', attrs: { ...EXT, 'aria-label': `Directions to ${shortName(s)}` } }) : ''}
            ${s.tel ? btn('Call', 'tel:' + s.tel, { variant: 'ghost', size: 'sm', icon: 'phone', attrs: { 'aria-label': `Call ${shortName(s)}` } }) : ''}
          </div>
        </div>
      </article>`;
}

/** grid modifiers and image sizes for a list of k store cards */
export function cardGrid(ctx, list, { cls = '' } = {}) {
  const k = list.length;
  const opts = k === 1 ? { sizes: '(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 600px' } : k === 4 ? { sizes: '(max-width: 700px) 88vw, (max-width: 1199px) 44vw, 290px' } : {};
  return `<ul class="st-grid${k === 4 ? ' st-grid--4' : ''}${k === 1 ? ' st-grid--1' : ''}${k === 2 ? ' st-grid--2' : ''}${cls ? ' ' + cls : ''}" role="list" data-stagger>${list.map((s) => `<li>${storeCard(ctx, s, opts)}</li>`).join('')}
      </ul>`;
}

// ---------- shared: state FAQ (Star Buds sources only) ----------
/**
 * stateFaq(ctx, code, { visit }) -> [{ id, q, answer[], cite, disclaimer, links[] }]
 *  visit: true = lead with the visit Q&As of the state's stores (site.json stores[].visit, verbatim). For each question
 *  the answer most stores share is quoted, citing those stores. "Is your dispensary open late?" is left to each store
 *  page (hours differ by store). Then the faq.json items that apply to the state, verbatim: medical card, ordering
 *  online, daily deals (only where the state has deals), Higher Rewards. Link targets are rendered here, never in JSON.
 */
export function stateFaq(ctx, code, { visit = true } = {}) {
  const st = stateOf(ctx, code);
  const out = [];
  if (visit) {
    const stores = ctx.stores.filter((s) => s.state === code && Array.isArray(s.visit));
    const byQ = new Map();
    for (const s of stores) for (const v of s.visit) {
      if (/open late/i.test(v.q)) continue;
      const k = v.q.trim();
      if (!byQ.has(k)) byQ.set(k, new Map());
      const answers = byQ.get(k);
      if (!answers.has(v.a)) answers.set(v.a, []);
      answers.get(v.a).push(s);
    }
    let i = 0;
    for (const [q, answers] of byQ) {
      const [a, who] = [...answers.entries()].sort((x, y) => y[1].length - x[1].length)[0];
      const names = who.map((s) => s.city);
      out.push({ id: `visit-${++i}`, q, answer: [`“${a}”`], cite: `Quoted from the ${who.length === 1 ? shortName(who[0]) + ' store page' : 'Star Buds ' + listJoin(names) + ' store pages'} on starbuds.us` });
    }
  }
  const data = faqData();
  const items = Object.fromEntries((data.groups || []).flatMap((g) => g.items || []).map((it) => [it.id, it]));
  const pick = (id, links) => { const it = items[id]; if (it) out.push({ id, q: it.q, answer: it.answer || [], cite: it.cite || '', disclaimer: it.disclaimer ? data.disclaimer : '', links }); };
  pick('medical-card', [{ label: `Getting a medical card in ${st.name}`, href: cardHref(code) }, { label: `Cannabis laws in ${st.name}`, href: lawsHref(code) }]);
  pick('order-online', [{ label: 'Shop the live menu', menu: true }]);
  if (hasDealsPage(ctx, code)) pick('deals', [{ label: `${st.name} deals`, href: dealsHref(code) }]);
  pick('rewards', [{ label: 'Higher Rewards', href: '/rewards/' }]);
  return out;
}

/** the FAQ list markup (details/summary, works without JS) + FAQPage JSON-LD; menuHref: a static live-menu URL or null */
export function faqList(items, { name = 'sh-faq', menuHref = null } = {}) {
  const link = (l) => (l.menu
    ? (menuHref ? `<a class="sh-faq__link" href="${esc(menuHref)}" target="_blank" rel="noopener">${esc(l.label)}${icon('external')}</a>` : `<a class="sh-faq__link"${attrs(menuAttrs(''))}>${esc(l.label)}${icon('arrow')}</a>`)
    : `<a class="sh-faq__link" href="${esc(l.href)}">${esc(l.label)}${icon('arrow')}</a>`);
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.answer.join(' ') + (it.disclaimer ? ' ' + it.disclaimer : '') } })) }).replace(/</g, '\\u003c');
  return `<div class="sh-faq__list" data-stagger>${items.map((it, i) => `
        <details class="sh-faq__item" name="${esc(name)}"${i === 0 ? ' open' : ''}>
          <summary class="sh-faq__q"><span class="sh-faq__n numeral numeral--gold" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="sh-faq__qt">${esc(it.q)}</span><span class="sh-faq__tog" aria-hidden="true">${icon('plus', 'sh-faq__plus')}${icon('minus', 'sh-faq__minus')}</span></summary>
          <div class="sh-faq__a">
            ${it.answer.map((p) => `<p>${rich(p)}</p>`).join('\n            ')}
            ${it.disclaimer ? `<p class="sh-faq__note">${esc(it.disclaimer)}</p>` : ''}
            ${it.cite ? `<p class="sh-faq__cite">${esc(it.cite)}</p>` : ''}
            ${(it.links || []).length ? `<p class="sh-faq__links">${it.links.map(link).join('')}</p>` : ''}
          </div>
        </details>`).join('')}
      </div>
      <script type="application/ld+json">${ld}</script>`;
}

// ---------- amenities: ONLY items a Star Buds source states for that store ----------
// Icons are drawn here (line icons on a 24px grid, currentColor); no vehicle, cross or club imagery (DESIGN guardrails).
const AM_ICON = {
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.4c.7-1.5 1.8-2.3 3.2-2.3s2.5.8 3.2 2.3M14 10h4M14 13h3"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 16.5v-4M12 12.5c-2.4 0-3.8-1.5-3.8-4.1 2.4 0 3.8 1.5 3.8 4.1zm0 0c2.4 0 3.8-1.5 3.8-4.1-2.4 0-3.8 1.5-3.8 4.1z"/>',
  age: '<circle cx="12" cy="12" r="9"/><path d="M7.6 10.2a1.9 1.9 0 0 1 3.6.6c0 1.3-3.6 2.6-3.6 4.4h3.7M13.6 9.2l1.6-1v7"/><path d="M18 9.6v3M16.5 11.1h3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.4 3 14.6 0 18M12 3c-3 3.4-3 14.6 0 18"/>',
  cash: '<rect x="2.5" y="6.5" width="19" height="11" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  debit: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  atm: '<rect x="3" y="4" width="18" height="9" rx="1.5"/><path d="M7 13v7h10v-7M9.5 16.5h5M7 8.5h10"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  star: '<path d="M12 2.8l2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.8l-5.8 3.3 1.5-6.4-4.9-4.3 6.5-.6z"/>',
  medal: '<path d="M8 3l4 6 4-6"/><circle cx="12" cy="15" r="5.5"/><path d="M12 12.4l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
  pct: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  leaf: '<path d="M12 21v-7"/><path d="M12 14c-4.5 0-7-3-7-8 4.5 0 7 3 7 8zm0 0c4.5 0 7-3 7-8-4.5 0-7 3-7 8z"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  loupe: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
};
const amIcon = (k) => `<svg class="sp-amen__svg" viewBox="0 0 24 24" width="24" height="24" fill="${k === 'star' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${AM_ICON[k]}</svg>`;
const G_STORE = 'In store', G_PAY = 'Payment', G_SAVE = 'Savings';
const A = (icon, label, group, note = '') => ({ icon, label, group, note });
const OK_COMMUNITY = 'Veterans and active military, tribal members and cannabis industry employees';
const AMENITIES = {
  'lawton-dispensary': [
    A('card', '18+ with a medical card', G_STORE), // visit[0]: "at least 18 years of age with a valid medical card"
    A('id', 'Valid photo ID', G_STORE), // visit[0]: "must provide a valid photo ID"
    A('bag', 'Order online, pick up in store', G_STORE), // about[1]: "place your order online to pick up in store!"; order-online.json ORDER NOW
    A('moon', 'Open until midnight', G_STORE), // visit[1]: "open Monday through Sunday from 8:00 am to 12:00 am"; hours[] 8:00AM-12:00AM
    A('debit', 'Cash and debit cards', G_PAY), // visit[0]: "We take cash and debit cards"
    A('atm', 'ATM inside', G_PAY), // visit[0]: "there is also an ATM inside our dispensary"
    A('tag', 'Specials seven days a week', G_SAVE), // visit[2]: "We run product specials seven days a week"
    A('star', 'Loyalty rewards', G_SAVE), // visit[2]: "our loyalty rewards program offers even more savings"
    A('medal', 'Veteran and MED card discount on request', G_SAVE), // visit[2]: "MED card holders and veterans with a discount upon request"
    A('pct', '10% community discount every day', G_SAVE, OK_COMMUNITY), // ok-deals.json = site.json deals[state=OK,group=community]
  ],
  'altus-dispensary': [
    A('card', '18+ with a medical card', G_STORE), // visit[0]: "at least 18 years of age with a valid medical card"
    A('id', 'Valid photo ID', G_STORE), // visit[0]: "must provide a valid photo ID"
    A('bag', 'Order online, pick up in store', G_STORE), // about[1]: "place your order online to pick up in store!"; order-online.json ORDER NOW
    A('moon', 'Open until midnight', G_STORE), // visit[1]: "open every day from 8:00 am to 12:00 am"; hours[] 8:00AM-12:00AM
    A('debit', 'Cash and debit cards', G_PAY), // visit[0]: "We take cash and debit cards"
    A('atm', 'ATM inside', G_PAY), // visit[0]: "there is also an ATM inside our dispensary"
    A('tag', 'Specials seven days a week', G_SAVE), // visit[2]: "We run product specials seven days a week"
    A('star', 'Loyalty rewards', G_SAVE), // visit[2]: "our loyalty rewards program offers even more savings"
    A('medal', 'Veteran and MED card discount on request', G_SAVE), // visit[2]
    A('pct', '10% community discount every day', G_SAVE, OK_COMMUNITY), // ok-deals.json = site.json deals[state=OK,group=community]
  ],
  'ardmore-dispensary': [
    A('card', '18+ with an Oklahoma medical card', G_STORE), // visit[0]: "at least 18 years of age with a valid Oklahoma Medical Marijuana card"
    A('id', 'Valid photo ID', G_STORE), // visit[0]: "must provide a valid photo ID"
    A('bag', 'Order online', G_STORE), // order-online.json: ORDER NOW -> shop.starbuds.us/stores/ardmore-dispensary/
    A('moon', 'Open until midnight', G_STORE), // visit[1]: "open every day from 8:00 AM to 12:00 AM"; hours[] 8:00AM-12:00AM
    A('loupe', 'Smell and inspect the flower', G_STORE), // about[0]: "smell the aroma of every premium cannabis strain, inspect the trichomes"
    A('chat', 'Budtender advice', G_STORE), // about[1]: "Each budtender is knowledgeable and prepared to provide you with ... expert advice"
    A('debit', 'Cash and debit cards', G_PAY), // visit[0]: "We take cash and debit cards"
    A('atm', 'ATM inside', G_PAY), // visit[0]: "there is also an ATM inside our dispensary"
    A('tag', 'Specials seven days a week', G_SAVE), // visit[2]: "We run product specials 7 days a week"
    A('star', 'Loyalty rewards', G_SAVE), // visit[2]: "our loyalty rewards program offers even more savings"
    A('medal', 'Veteran and MED card discount on request', G_SAVE), // visit[2]
    A('pct', '10% community discount every day', G_SAVE, OK_COMMUNITY), // ok-deals.json = site.json deals[state=OK,group=community]
  ],
  'chickasha-dispensary': [
    A('card', '18+ with a medical card', G_STORE), // visit[0]: "at least 18 years of age with a valid medical card"
    A('id', 'Valid photo ID', G_STORE), // visit[0]: "must provide a valid photo ID"
    A('bag', 'Order online, pick up in store', G_STORE), // about[1]: "place your order online to pick up in store!"; order-online.json ORDER NOW
    // no "open late": the page's own answer (12:00 am) contradicts its hours list (10:00 PM); site.json left it out
    A('debit', 'Cash and debit cards', G_PAY), // visit[0]: "We take cash and debit cards"
    A('atm', 'ATM inside', G_PAY), // visit[0]: "there is also an ATM inside our dispensary"
    A('tag', 'Specials seven days a week', G_SAVE), // visit[1]: "We run product specials seven days a week"
    A('star', 'Loyalty rewards', G_SAVE), // visit[1]: "our loyalty rewards program offers even more savings"
    A('medal', 'Veteran and MED card discount on request', G_SAVE), // visit[1]
    A('pct', '10% community discount every day', G_SAVE, OK_COMMUNITY), // ok-deals.json = site.json deals[state=OK,group=community]
  ],
  'baltimore-dispensary': [
    A('age', 'Adults 21+', G_STORE), // visit[0]: "at least 21 years of age"; md-deals.json: "NOW SERVING ADULTS 21+"
    A('globe', 'Valid photo ID from any state', G_STORE), // visit[0]: "valid photo ID"; md-deals.json: "W/ VALID ID FROM ANY STATE"
    A('bag', 'Order online, pick up in store', G_STORE), // maryland.json: "an online ordering system that allows you to ... pick them up in-store!"; order-online.json ORDER NOW
    A('chat', 'Budtenders to help you choose', G_STORE), // maryland.json: "our expert budtenders are available to help you choose the right cannabis product"
    A('cash', 'Cash', G_PAY), // visit[0]: "We take cash"
    A('atm', 'ATM inside', G_PAY), // visit[0]: "there is also an ATM inside our dispensary"
    A('tag', 'Specials seven days a week', G_SAVE), // visit[2]: "We run product specials seven days a week"
    A('card', 'Medical patient deals', G_SAVE), // md-deals.json = site.json deals[state=MD,group=medical]: "available for Maryland medical patients"
    A('star', 'Loyalty rewards', G_SAVE), // visit[2]: "our loyalty rewards program offers even more savings"
    A('medal', 'Veteran and MED card discount on request', G_SAVE), // visit[2]
  ],
  'oxford-dispensary': [
    A('leaf', 'Medical cannabis dispensary', G_STORE), // about[0]: "a medical cannabis dispensary serving the community of Oxford, Mississippi"
    A('bag', 'Order online', G_STORE), // oxford.json: "ORDER ONLINE" button; order-online.json ORDER NOW
    A('chat', 'Knowledgeable staff to help', G_STORE), // oxford.json: "Our compassionate and knowledgeable staff is here to help you"
    A('tag', 'Daily deals', G_SAVE), // oxford.json = site.json deals[state=MS,group=daily]: "You save seven days a week with our daily deals!"
  ],
  'buffalo-dispensary': [
    A('leaf', 'Adult-use cannabis', G_STORE), // Buffalo opening post (2024-12-02): "looking for recreational cannabis in Buffalo, NY"
    A('bag', 'Order online', G_STORE), // order-online.json: ORDER NOW -> shop.starbuds.us/stores/buffalo-dispensary/
    A('chat', 'Staff on hand to guide you', G_STORE), // Buffalo post: "The knowledgeable staff is always on hand to guide you through the selection process"
    A('loupe', 'Questions welcome', G_STORE), // Buffalo post: "customers can feel comfortable asking questions, learning about cannabis"
    A('home', 'Locally owned and operated', G_STORE), // Buffalo post: "Star Buds Buffalo is proudly locally owned and operated"
  ],
  // Greenwood, Natchez, Ocean Springs, Pearl, Tupelo: only "ORDER NOW" (order-online.json) and the hub card's
  // "VIEW HOURS & SHOP" are captured -> fewer than 3 items -> no grid.
};
export const amenitiesFor = (slug) => AMENITIES[slug] || [];

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

// 1. H1 store name, live menu, "Make this my store", photo (or leather tile) and the status card
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
  <div class="wrap sp-hero__crumbs">${crumbs([{ label: 'Home', href: '/' }, { label: 'Dispensaries', href: '/dispensaries/' }, { label: st.name, href: stateHref(s.state) }, { label: shortName(s) }])}</div>
  <div class="wrap sp-hero__grid">
    <div class="sp-hero__copy"${reveal('up')}>
      <div class="sp-hero__tags">${rocker(st.name, { tone: 'gold', radius: 260, band: 46, angle: 24, cls: 'sp-hero__rocker' })}${patch(s.state, { tone: 'green', size: 'sm', cls: 'sp-hero__code' })}</div>
      <h1 id="sp-title" class="sp-hero__title">${nameHtml(shortName(s), 'sp-hero__city')}</h1>
      ${nameLine}
      ${pinstripe({ cls: 'sp-hero__rule' })}
      <div class="btn-row sp-hero__cta">
        ${btn('Shop this store', s.liveUrl || liveMenu(ctx, s.slug), { variant: 'gold', size: 'lg', icon: 'bag', attrs: EXT })}
        ${btn(`${icon('star', 'sp-pick__star')}<span class="st-pick__off">Make this my store</span><span class="st-pick__on">This is my store</span>`, null, { variant: 'ghost', icon: false, html: true, cls: 'sp-pick', attrs: { 'data-store-pick': s.slug, 'data-no-toast': true, 'aria-pressed': 'false' } })}
      </div>
      <a class="link-arrow sp-hero__info" href="#details">Dispensary details and hours${icon('arrow')}</a>
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

// 2. Higher Rewards sign-up strip (site.json rewards.byState; New York has only its join link, so the programme's
//    own first sentence stands in for the state intro)
function rewardsStrip(ctx, s) {
  const r = ctx.site.rewards || {};
  const st = stateOf(ctx, s.state);
  const bs = (r.byState || []).find((x) => x.state === s.state) || {};
  const intro = bs.intro || (String((r.paragraphs || [])[0] || '').split(/(?<=[.!?])\s+/)[0]) || '';
  const join = bs.joinHref || r.joinHref;
  const title = bs.intro ? `${st.name} Higher Rewards` : (r.title || 'Higher Rewards');
  return `
<section class="section sp-rw on-dark" aria-labelledby="sp-rw-title">
  <div class="plane-back">${leaves({ tone: 'gold', cls: 'sp-rw__leaves' })}${halftone({ color: 'gold', at: 'br', cls: 'sp-rw__dots' })}${grain()}</div>
  <div class="wrap">
    <div class="sp-rw__inner"${reveal('up')}>
      <div class="sp-rw__copy">
        <p class="sp-rw__eyebrow">${patch(r.programName || 'Higher Rewards', { tone: 'green', size: 'sm', icon: 'star' })}</p>
        <h2 id="sp-rw-title" class="sp-rw__title">${esc(title)}</h2>
        ${intro ? `<p class="sp-rw__lead">${esc(intro)}</p>` : ''}
      </div>
      <div class="sp-rw__actions">
        ${join ? btn('Join Higher Rewards', join, { variant: 'gold', icon: 'external', attrs: EXT }) : ''}
        ${btn('How it works', '/rewards/', { variant: 'ghost', icon: 'arrow' })}
      </div>
      ${seal({ label: 'Higher', sub: 'Rewards', tone: 'gold', cls: 'sp-rw__seal' })}
    </div>
  </div>
</section>`;
}

// 3. "<Store> dispensary details": address, directions, phone, hours with open/closed, live menu
function storeDetails(ctx, s) {
  return `
<section class="section section--bone sp-info" id="details" aria-labelledby="sp-info-title">
  <div class="plane-back">
    ${leaves({ tone: 'light', cls: 'sp-info__leaves' })}
    ${halftone({ color: 'ink', at: 'br' })}
    ${grain({ cls: 'sp-info__grain' })}
  </div>
  ${seam({ kind: 'double' })}
  <div class="wrap">
    <div class="sp-info__panel stitch stitch--draw"${reveal('up')}>
      <p class="sp-info__eyebrow">${patch('Dispensary details', { tone: 'gold', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sp-info-title" class="h-display sp-info__title">${esc(shortName(s))} dispensary details</h2>
      ${statusBlock(s)}
      <div class="sp-info__cols">
        <div class="sp-info__contact">
          <p class="sp-info__label">Address</p>
          <p class="sp-info__address">${(s.address || []).map(esc).join('<br>')}</p>
          ${s.phone ? `<p class="sp-info__label">Phone</p><p class="sp-info__phone"><a href="tel:${esc(s.tel || s.phone)}">${esc(s.phone)}</a></p>` : ''}
          <div class="sp-info__actions">
            ${s.mapUrl ? btn('Directions', s.mapUrl, { variant: 'gold', icon: 'directions', attrs: EXT }) : ''}
            ${s.tel ? btn('Call', 'tel:' + s.tel, { variant: 'ghost', icon: 'phone', attrs: { 'aria-label': `Call ${shortName(s)}` } }) : ''}
            ${btn('Live menu', s.liveUrl || liveMenu(ctx, s.slug), { variant: 'ghost', icon: 'bag', attrs: { ...EXT, 'aria-label': `Live menu of ${shortName(s)}` } })}
          </div>
          <a class="link-arrow sp-info__live" href="${esc(s.liveUrl || liveMenu(ctx, s.slug))}" target="_blank" rel="noopener">Open the live store page${icon('external')}</a>
        </div>
        <div class="sp-info__hours">
          <p class="sp-info__label">Hours</p>
          ${hoursTable(s)}
        </div>
      </div>
    </div>
  </div>
  ${cutout('cut-tincture', { cls: 'sp-info__cut', depth: -0.08, float: 'fast', rotate: -8, sizes: '(max-width: 700px) 24vw, 180px' })}
</section>`;
}

// 4. More information: the store's own about text (if any), its social links, and links into the state's pages
function storeMore(ctx, s) {
  const about = (s.about || []).filter(Boolean);
  const social = Array.isArray(s.social) ? s.social : [];
  const st = stateOf(ctx, s.state);
  const links = [
    hasDealsPage(ctx, s.state) ? [`${st.name} deals`, dealsHref(s.state), 'tag'] : null,
    ['Higher Rewards', '/rewards/', 'star'],
    [`${st.name} dispensary FAQs`, stateHref(s.state) + '#state-faq', 'chat'],
    [`Getting a medical card in ${st.name}`, cardHref(s.state), 'card'],
    [`Cannabis laws in ${st.name}`, lawsHref(s.state), 'id'],
    [`${st.name} dispensaries`, stateHref(s.state), 'pin'],
  ].filter(Boolean);
  const list = `<ul class="sp-more__links" role="list" data-stagger>${links.map(([l, h, ic]) => `<li><a class="sp-more__link" href="${esc(h)}"><span class="sp-more__ic">${amIcon(ic)}</span><span class="sp-more__lt">${esc(l)}</span>${icon('arrow', 'sp-more__arrow')}</a></li>`).join('')}</ul>`;
  return `
<section class="section section--green sp-about on-dark${about.length ? '' : ' sp-about--links'}" aria-labelledby="sp-about-title">
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
      <p class="sp-about__eyebrow"${reveal('fade')}>${patch(shortName(s), { tone: 'gold', icon: 'star', size: 'sm' })}</p>
      <h2 id="sp-about-title" class="h-display sp-about__title"${reveal('up', 1)}>More <span class="gold-text">information</span></h2>
      ${pinstripe({ cls: 'sp-about__rule' })}
      <div class="sp-about__rocker"${reveal('up', 2)}>${rocker(st.name, { pos: 'bottom', tone: 'gold', radius: 260, band: 46, angle: 26, decorative: true })}</div>
    </div>
    <div class="sp-about__body">
      ${about.length ? glass(`
        ${about.map((p) => `<p>${esc(p)}</p>`).join('')}
        ${social.length ? `<div class="btn-row sp-about__social">${social.map((x) => btn(x.label, x.href, { variant: 'chrome', size: 'sm', icon: 'external', attrs: EXT })).join('')}</div>` : ''}`, { stitch: true, cls: 'sp-about__copy', attrs: { 'data-reveal': 'right' } }) : ''}
      ${list}
    </div>
  </div>
  ${patchCut('patch-star', { cls: 'sp-about__patch', depth: 0.1, rotate: -4, sizes: '140px' })}
</section>`;
}

// 5. Categories: each opens the live menu of this store (kept from revision 1)
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
    <div class="sp-shop__head">
      <p class="sp-shop__eyebrow"${reveal('fade')}>${patch(`Shop ${s.city}`, { tone: 'gold', icon: 'bag' })}</p>
      <h2 id="sp-shop-title" class="h-display sp-shop__title sheen"${reveal('up', 1)}>Categories</h2>
      <p class="lead sp-shop__lead"${reveal('up', 2)}>Each category opens on the live menu at Star Buds in ${esc(s.city)}.</p>
    </div>
    <ul class="sp-cats" role="list" data-stagger>${ctx.categories.map((c, i) => `
      <li class="sp-cats__item">
        <a class="sp-cat glass" href="${esc(liveMenu(ctx, s.slug, c.slug))}" target="_blank" rel="noopener" data-tilt="3">
          <span class="sp-cat__stitch stitch" aria-hidden="true"></span>
          ${cutout(cutFor(c.cutout), { cls: 'sp-cat__cut', depth: 0, float: false, sizes: '(max-width: 700px) 30vw, 180px' })}
          <span class="sp-cat__num numeral" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="sp-cat__label">${esc(c.label)}</span>
          <span class="sp-cat__cta"><span>Shop<span class="sp-cat__cta-x"> ${esc(c.label)}</span></span>${icon('arrow')}</span>
        </a>
      </li>`).join('')}
    </ul>
    <div class="btn-row sp-shop__all">${btn('Open the live menu', s.liveUrl || liveMenu(ctx, s.slug), { variant: 'chrome', icon: 'external', attrs: EXT })}</div>
  </div>
  ${cutout('cut-leaf', { cls: 'sp-shop__leaf', depth: 0.12, float: 'slow', rotate: -24, sizes: '(max-width: 700px) 26vw, 200px' })}
</section>`;
}

// 6. Visiting a Star Buds <State> dispensary: the store's visit Q&As (verbatim) + the amenities grid (3+ items only)
function storeVisit(ctx, s) {
  const st = stateOf(ctx, s.state);
  const visit = Array.isArray(s.visit) ? s.visit : [];
  const am = amenitiesFor(s.slug);
  const grid = am.length >= 3;
  if (!visit.length && !grid) return '';
  const groups = [G_STORE, G_PAY, G_SAVE].map((g) => [g, am.filter((x) => x.group === g)]).filter(([, l]) => l.length);
  const qa = visit.length ? `
    <div class="sp-faq"${reveal('up', 1)}>
      <h3 class="sp-visit__h3">${patch('Know before you go', { tone: 'green', icon: 'star', size: 'sm' })}</h3>
      ${visit.map((v, i) => `
      <details class="sp-faq__item"${i === 0 ? ' open' : ''}>
        <summary class="sp-faq__q"><span class="sp-faq__n numeral numeral--gold" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="sp-faq__qt">${esc(v.q)}</span><span class="sp-faq__tog" aria-hidden="true">${icon('plus', 'sp-faq__plus')}${icon('minus', 'sp-faq__minus')}</span></summary>
        <p class="sp-faq__a">${esc(v.a)}</p>
      </details>`).join('')}
    </div>` : '';
  const amen = grid ? `
    <div class="sp-amen"${reveal('up', 2)}>
      <h3 class="sp-visit__h3">${patch('Amenities', { tone: 'leather', icon: 'pin', size: 'sm' })}</h3>
      ${groups.map(([g, list]) => `
      <p class="sp-amen__group">${esc(g)}</p>
      <ul class="sp-amen__grid" role="list">${list.map((x) => `
        <li class="sp-amen__item"><span class="sp-amen__icon">${amIcon(x.icon)}</span><span class="sp-amen__text"><span class="sp-amen__label">${esc(x.label)}</span>${x.note ? `<span class="sp-amen__note">${esc(x.note)}</span>` : ''}</span></li>`).join('')}
      </ul>`).join('')}
      <p class="sp-amen__src">From the ${esc(shortName(s))} pages on starbuds.us.</p>
    </div>` : '';
  return `
<section class="section section--parchment sp-visit" aria-labelledby="sp-visit-title">
  <div class="plane-back">${leaves({ tone: 'light', cls: 'sp-visit__leaves' })}${halftone({ color: 'ink', at: 'tl' })}${grain({ cls: 'sp-info__grain' })}</div>
  ${seam({ kind: 'stitch', tone: 'gold' })}
  <div class="wrap">
    <div class="sp-visit__head">
      <p class="sp-visit__eyebrow"${reveal('fade')}>${patch(`Visiting · ${s.state}`, { tone: 'leather', size: 'sm' })}</p>
      <h2 id="sp-visit-title" class="h-display sp-visit__title"${reveal('up', 1)}>Visiting a Star Buds ${esc(st.name)} dispensary</h2>
    </div>
    <div class="sp-visit__grid${qa && amen ? '' : ' sp-visit__grid--solo'}">
      ${qa}
      ${amen}
    </div>
  </div>
  ${patchCut('patch-leaf', { cls: 'sp-visit__patch', depth: 0.08, rotate: 6, sizes: '(max-width: 700px) 80px, 140px' })}
</section>`;
}

// 7. State deals: a pointer to the state deals page (New York: none captured, so the live menu)
function storeDeals(ctx, s) {
  const st = stateOf(ctx, s.state);
  const deals = dealsFor(ctx, s.state);
  const daily = deals.find((d) => d.group === 'daily');
  const scope = daily && daily.scope ? `<p class="sp-deals__scope">${icon('pin')}<span>As listed on the Star Buds Oxford store page</span></p>` : '';
  const inner = deals.length ? `
      <h2 id="sp-deals-title" class="h-display sp-deals__title">${esc(st.name)} <span class="gold-text">deals</span></h2>
      ${daily && daily.intro ? `<p class="sp-deals__lead">${esc(daily.intro)}</p>` : ''}
      ${scope}
      <ul class="sp-deals__groups" role="list">${deals.map((d) => `<li>${patch(d.title, { tone: d.group === 'medical' || d.group === 'new-medical' ? 'green' : 'bone', size: 'sm' })}</li>`).join('')}</ul>
      <div class="btn-row sp-deals__cta">${btn(`See ${st.name} deals`, dealsHref(s.state), { variant: 'gold', icon: 'tag' })}${btn('All deals', '/deals/', { variant: 'ghost' })}</div>` : `
      <h2 id="sp-deals-title" class="h-display sp-deals__title">${esc(st.name)} <span class="gold-text">deals</span></h2>
      <p class="sp-deals__lead">See the ${esc(shortName(s))} live menu for current offers.</p>
      <div class="btn-row sp-deals__cta">${btn('Open the live menu', s.liveUrl || liveMenu(ctx, s.slug), { variant: 'gold', icon: 'external', attrs: EXT })}${btn('All deals', '/deals/', { variant: 'ghost' })}</div>`;
  return `
<section class="section sp-deals on-dark" aria-labelledby="sp-deals-title">
  <div class="plane-back">${img('g-smoke', { cls: 'cover sp-deals__smoke', alt: '', sizes: '100vw' })}<div class="sp-deals__shade"></div>${halftone({ color: 'red', at: 'tr', cls: 'sp-deals__dots' })}${grain()}</div>
  ${seam()}
  <div class="wrap sp-deals__grid">
    <div class="sp-deals__copy"${reveal('up')}>
      <p class="sp-deals__eyebrow">${patch('Deals', { tone: 'red', icon: 'tag', size: 'sm' })}</p>
      ${inner}
    </div>
    <div class="sp-deals__art" aria-hidden="true">${seal({ label: s.state, sub: deals.length ? 'Deals' : 'Live menu', tone: 'red', cls: 'sp-deals__seal' })}</div>
  </div>
</section>`;
}

// 8. "<State> dispensary FAQs" (faq.json items for the state; the store's own visit Q&As are in section 6)
function storeFaq(ctx, s) {
  const st = stateOf(ctx, s.state);
  const items = stateFaq(ctx, s.state, { visit: false });
  if (!items.length) return '';
  return `
<section class="section section--bone sh-faq sp-sfaq" id="faqs" aria-labelledby="sp-faq-title">
  <div class="plane-back">${leaves({ tone: 'light', cls: 'sp-info__leaves' })}${halftone({ color: 'ink', at: 'br' })}${grain({ cls: 'sp-info__grain' })}</div>
  ${seam({ kind: 'double' })}
  <div class="wrap sh-faq__wrap">
    <div class="sh-faq__head">
      <p class="sh-faq__eyebrow"${reveal('fade')}>${patch('FAQ', { tone: 'leather', size: 'sm' })}</p>
      <h2 id="sp-faq-title" class="h-display sh-faq__title"${reveal('up', 1)}>${esc(st.name)} dispensary <span class="sh-acr">FAQs</span></h2>
      <p class="sh-faq__more"${reveal('up', 2)}><a class="link-arrow" href="${esc(stateHref(s.state))}#state-faq">More ${esc(st.name)} questions${icon('arrow')}</a></p>
    </div>
    ${faqList(items, { name: 'sp-sfaq', menuHref: s.liveUrl || liveMenu(ctx, s.slug) })}
  </div>
</section>`;
}

// 9. Dispensaries nearby: the other stores in the state, or (single-store states) the other states' stores
function storeNearby(ctx, s) {
  const st = stateOf(ctx, s.state);
  const others = ctx.stores.filter((x) => x.state === s.state && x.slug !== s.slug);
  let inner;
  if (others.length) {
    inner = `
    <div class="sp-near__head">
      <p class="sp-near__eyebrow"${reveal('fade')}>${patch(st.name, { tone: 'gold', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sp-near-title" class="h-display sp-near__title sheen"${reveal('up', 1)}>Dispensaries nearby</h2>
      <p class="lead sp-near__lead"${reveal('up', 2)}>Other Star Buds stores in ${esc(st.name)}.</p>
    </div>
    <ul class="st-grid sp-near__grid" role="list" data-stagger>${others.map((x) => `<li>${storeCard(ctx, x)}</li>`).join('')}
    </ul>`;
  } else {
    const groups = ctx.storesByState.filter((g) => g.state.code !== s.state);
    inner = `
    <div class="sp-near__head">
      <p class="sp-near__eyebrow"${reveal('fade')}>${patch('Dispensaries', { tone: 'gold', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sp-near-title" class="h-display sp-near__title sheen"${reveal('up', 1)}>Dispensaries nearby</h2>
      <p class="lead sp-near__lead"${reveal('up', 2)}>More Star Buds locations.</p>
    </div>
    <div class="sp-near__states" data-stagger>${groups.map((g) => glass(`
      <h3 class="sp-near__state"><a class="sp-near__statelink" href="${esc(stateHref(g.state.code))}"><span class="sr-only">${esc(g.state.name)}</span>${rocker(g.state.name, { tone: 'gold', radius: 260, band: 46, angle: 24, decorative: true, cls: 'sp-near__rocker' })}</a></h3>
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
    <div class="btn-row sp-near__all">${btn(`${st.name} dispensaries`, stateHref(s.state), { variant: 'gold', icon: 'pin' })}${btn('All dispensaries', '/dispensaries/', { variant: 'ghost', icon: 'arrow' })}</div>
  </div>
  ${patchCut(others.length ? 'flash-bud' : 'chrome-star', { cls: 'sp-near__cut' + (others.length ? '' : ' sp-near__cut--chrome'), depth: 0.1, rotate: others.length ? 4 : 10, sizes: '(max-width: 700px) 26vw, 180px' })}
</section>`;
}

function storePage(ctx, s) {
  const p = `/stores/${s.slug}/`;
  const st = stateOf(ctx, s.state);
  const hoursAttr = hasHours(s) ? ` data-sp-hours="${esc(json({ tz: TZ[s.state] || 'America/Chicago', hours: s.hours }))}"` : '';
  const body = `<div class="sp"${hoursAttr}>
${storeHero(ctx, s)}
${rewardsStrip(ctx, s)}
${storeDetails(ctx, s)}
${storeMore(ctx, s)}
${storeShop(ctx, s)}
${storeVisit(ctx, s)}
${storeDeals(ctx, s)}
${storeFaq(ctx, s)}
${storeNearby(ctx, s)}
</div>${hasHours(s) ? `\n<script>${HOURS_JS}</script>` : ''}`;
  const addr = (s.address || []).join(', ');
  return {
    path: p,
    html: page({
      ctx, path: p, bodyClass: 'page-store',
      title: `${shortName(s)}, ${s.state}: dispensary and live menu`,
      description: `${shortName(s)}, a Star Buds dispensary in ${s.city}, ${st.name}: ${addr}${s.phone ? ', ' + s.phone : ''}. Dispensary details${hasHours(s) ? ', hours' : ''}, directions, deals and the live menu.`,
      body,
    }),
  };
}

// ---------- /stores/ -> /dispensaries/ (redirect stub; every URL in an attribute so the preview prefixes it) ----------
function storesStub(ctx) {
  const name = ctx.site.brand?.name || 'Star Buds';
  return {
    path: '/stores/',
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dispensaries | ${esc(name)}</title>
  <meta name="description" content="The ${esc(name)} store list has moved to the Dispensaries page.">
  <meta name="robots" content="noindex, nofollow">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="/dispensaries/">
  <meta http-equiv="refresh" content="0; url=/dispensaries/">
  <link rel="icon" type="image/png" href="/assets/brand/favicon.png">
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0B0A;color:#EFE6D2;font:16px/1.5 system-ui,sans-serif;text-align:center}a{color:#E8CB7A}h1{font-size:1.4rem;font-weight:600}</style>
</head>
<body>
  <main id="main">
    <h1>${esc(name)} dispensaries</h1>
    <p>This page has moved: <a href="/dispensaries/">see all ${esc(name)} dispensaries</a>.</p>
  </main>
</body>
</html>
`,
  };
}

export function render(ctx) {
  return [storesStub(ctx), ...ctx.stores.map((s) => storePage(ctx, s))];
}
