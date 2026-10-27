// resources.mjs - RESOURCES-R2 lane (docs/REVISION-2.md), reskinned by RESOURCES-R3 (docs/REVISION-3.md, "Starlight"): the
// content pages, product guides and resource hubs, with breadcrumbs, on the page types and URL patterns of the adopted
// architecture (D1). Every band is night sky (rs-sky: CSS stars + an aurora wash); long reads sit on a pearl glass sheet.
//   /about-us/ /contact/ /careers/ /community/ /media/ /cancer-relief-program/ /eula/ /rewards/terms/  (starbuds.us words, D7)
//   /products/ + /products/<slug>/                                       (product education text; Colorado-only lines dropped)
//   /dispensary-guides/ /getting-a-medical-card/(+4) /cannabis-laws-by-state/(+4) /patient-guide/ /faq/
// Content: src/content/resources/pages.json (verbatim captures, ported once), quotes.json (checked excerpts),
// laws.json + medical-card.json (official claims with URL and retrieval date), images.json (localized WebP, D8),
// products.json (guide list, read by FOUNDATION's nav); src/content/site.json and faq.json. No other facts (D3).
// Internal links live in this file only (never built from JSON in page scripts: preview rule). Classes: rs-.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { page, esc, attrs, cx, icon, btn, img, glass, reveal, menuAttrs, hubHero, cardGrid, articleCard, stateSlug } from './shell.mjs';

const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content', rel), 'utf8'));
const readOpt = (rel) => { try { return read(rel); } catch { return null; } };
const EXT = { target: '_blank', rel: 'noopener' };
const RETRIEVED = 'October 27, 2026';
const MAIN = 'https://www.starbuds.us';

// ---------------------------------------------------------------- data
let D = null;
function data() {
  if (D) return D;
  D = {
    pages: read('resources/pages.json').pages,
    quotes: read('resources/quotes.json').posts,
    laws: read('resources/laws.json'),
    med: read('resources/medical-card.json'),
    images: read('resources/images.json').images,
    products: read('resources/products.json'),
    faq: read('faq.json'),
    blog: readOpt('blog/index.json'),
  };
  return D;
}
const photo = (name, alt) => { const p = data().images[name]; if (!p) throw new Error('missing image: resources/images.json ' + name); return { src: p.src, w: p.w, h: p.h, alt: alt != null ? alt : p.alt || '' }; };
const blocksOf = (key) => (data().pages[key]?.sections || []).flatMap((s) => s.blocks || []);
const deep = (blocks) => { const out = []; const walk = (bl) => { for (const b of bl || []) { if (!b) continue; out.push(b); if (b.cols) b.cols.forEach((c) => walk(c && c.blocks)); if (b.t === 'repeater') (b.items || []).forEach((c) => walk(c && c.blocks)); } }; walk(blocks); return out; };

// ---------------------------------------------------------------- blog paths (BLOG-R2's index.json; /blog/ fallback)
export const blogFallbacks = new Set();
function blogPosts() { const b = data().blog; return b && Array.isArray(b.posts) ? b.posts.filter((p) => p && typeof p.href === 'string' && p.href.startsWith('/')) : []; }
/** the /blog/<cat>/<slug>/ path of a Star Buds post by its slug (Wix slug without the date part), else '/blog/' */
function postHref(slug) {
  const hit = blogPosts().find((p) => p.slug === slug || p.href.replace(/\/+$/, '').endsWith('/' + slug));
  if (hit) return hit.href;
  blogFallbacks.add(slug);
  return '/blog/';
}
/** related posts from the blog index by a title/category test (newest first), [] when the index is absent */
function relatedPosts(test, n = 3) {
  return blogPosts().filter((p) => test.test(`${p.title} ${p.category || ''} ${(p.tags || []).join(' ')}`)).sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, n);
}

// ---------------------------------------------------------------- text helpers
const ZW = /[​‌‍⁠﻿]/g;
export const plain = (h) => String(h ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(ZW, '').replace(/\s+/g, ' ').trim();
const ACRO = new Set(['CBD', 'THC', 'CDOT', 'D.U.I.', 'DUI', 'US', 'USA', 'MMCEU', 'PDF', 'TV', 'II']);
const PROPER = { STARBUDS: 'Starbuds', YOUTUBE: 'YouTube', COLORADO: 'Colorado' }; // names kept capitalised in any mode
/** typographic case tidy for captured ALL-CAPS labels (words unchanged; acronyms kept) */
export function tidyCaps(s, mode = 'title') {
  const t = plain(s);
  if (!t || t !== t.toUpperCase() || !/[A-Z]/.test(t)) return t;
  const SMALL = new Set(['a', 'an', 'and', 'or', 'of', 'the', 'to', 'in', 'on', 'for', 'at', 'by', 'with', 'from']);
  return t.split(' ').map((w, i) => {
    const bare = w.replace(/[,!?:;]+$/, '');
    if (ACRO.has(bare)) return w;
    const poss = /^(.+?)(['’])S$/.exec(bare); // "CBD'S" -> "CBD's"
    if (poss && ACRO.has(poss[1])) return poss[1] + poss[2] + 's' + w.slice(bare.length);
    if (PROPER[bare]) return PROPER[bare] + w.slice(bare.length);
    const lw = w.toLowerCase();
    if (mode === 'sentence') return i === 0 ? lw.charAt(0).toUpperCase() + lw.slice(1) : lw;
    return i > 0 && SMALL.has(lw) ? lw : lw.replace(/^([^a-z]*)([a-z])/, (m, p, c) => p + c.toUpperCase());
  }).join(' ');
}
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const INTERNAL = {
  '/': '/', '/rewards': '/rewards/', '/cancerreliefprogram': '/cancer-relief-program/', '/workwithus': '/careers/#business-inquiries',
  '/locations': '/dispensaries/', '/edibles': '/products/edibles/', '/cbd': '/products/cbd/', '/concentrates': '/products/concentrates/',
  '/topicals': '/products/topicals/', '/vapes': '/products/vapes/', '/products': '/products/', '/hr-tc': '/rewards/terms/', '/eula': '/eula/',
  '/about': '/about-us/', '/contact': '/contact/', '/careers': '/careers/', '/community': '/community/', '/media': '/media/', '/deals': '/deals/',
};
/** a captured href -> { href, ext } | null (dropped) */
function mapHref(href) {
  const h = String(href || '').trim();
  if (!h) return null;
  if (/^mailto:|^tel:/i.test(h)) return { href: h.replace(/ /g, '%20'), ext: false };
  if (/^https?:\/\//i.test(h)) return { href: h, ext: true };
  if (h.startsWith('/')) { const k = h.split(/[?#]/)[0].replace(/\/+$/, '') || '/'; return INTERNAL[k] ? { href: INTERNAL[k], ext: false } : { href: MAIN + k, ext: true }; }
  return null;
}
/** tidy captured Wix rich HTML: allow p/br/a/strong/em/ul/ol/li, drop empty paragraphs, rewrite links (words unchanged) */
export function tidyHtml(html) {
  let h = String(html || '').replace(ZW, '');
  h = h.replace(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, inner) => {
    const r = mapHref(href.replace(/&amp;/g, '&'));
    if (!r) return inner;
    return `<a href="${esc(r.href)}"${r.ext ? attrs(EXT) : ''}>${inner}${r.ext ? '<span class="sr-only"> (opens in a new tab)</span>' : ''}</a>`;
  });
  h = h.replace(/<(\/?)(\w+)\b[^>]*>/g, (m, close, tag) => {
    const t = tag.toLowerCase();
    if (t === 'a') return m;
    if (['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'].includes(t)) return `<${close}${t === 'br' ? 'br' : t}>`;
    if (t === 'b') return `<${close}strong>`;
    if (t === 'i') return `<${close}em>`;
    if (/^h[1-6]$/.test(t)) return close ? '</p>' : '<p>';
    return '';
  });
  h = h.replace(/<p>(?:\s|&nbsp;|&#160;|<br>)*<\/p>/gi, '');
  // a sentence split over two paragraphs by the old editor ("We work with our partners</p><p>to help them ...")
  h = h.replace(/([a-z,])<\/p>\s*<p>(?=[a-z])/g, '$1 ');
  return h.trim();
}
/** short captured lines used as sub-headings inside rich text ("Ready for the perks?") -> h3 */
const subheads = (html, tag = 'h3') => html.replace(/<p>([^<]{2,44})<\/p>/g, (m, t) => (/[.!:;,]$/.test(t.trim()) ? m : `<${tag} class="rs-prose__sub">${t}</${tag}>`));
const prose = (html, cls = '') => `<div class="${cx('rs-prose', cls)}">${html}</div>`;

// ---------------------------------------------------------------- layout pieces (revision 3, "Starlight")
// Every band is night sky. The revision-2 tone names now only pick where the aurora wash sits and its colour, so stacked
// bands read as one sky. No textures (no leather, leaves, halftone, grain, seams or pinstripes).
const SKY = { leather: 'green', ink: 'violet', green: 'teal', bone: 'violet', parchment: 'teal' };
/** CSS-only sky layer for a band's back plane: a star field (::before, slow twinkle) and an aurora wash (::after) */
const rsSky = (tone) => `<span class="rs-sky rs-sky--${SKY[tone] || 'green'}" aria-hidden="true"></span>`;
/** a section eyebrow: small caps with a glowing icon (the words unchanged) */
const eyebrow = (text, ic = 'star') => `<span class="rs-eyebrow">${ic ? icon(ic, 'rs-eyebrow__icon') : ''}<span>${esc(text)}</span></span>`;
/** a small glass pill label (replaces the embroidered patch): tone 'star' (default) | 'green' | 'violet' */
const pill = (text, { tone = 'star', icon: ic } = {}) => `<span class="${cx('rs-pill', 'rs-pill--' + tone)}">${ic ? icon(ic, 'rs-pill__icon') : ''}<span>${esc(text)}</span></span>`;
/** a round glowing orb badge (replaces the revision-2 seal); label and sub stay readable text */
const orb = ({ label = '', sub = '', cls } = {}) => `<span class="${cx('rs-orb', cls)}"${label ? '' : ' aria-hidden="true"'}>${label ? `<span class="rs-orb__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>` : ''}</span>`;
/**
 * band({ tone, id, eyebrow, eyebrowIcon, title, titleTag, intro, body, cls, narrow, z, art, sheet }) -> a content section on
 * the night sky: an eyebrow, a light display heading and a thin aurora rule. `sheet: true` (long reads: legal text, law
 * and medical-card claims, the patient guide) puts the head and body on a light pearl glass panel (.rs-sheet.on-light).
 * No reveal on the sheet itself: a very tall element never reaches the reveal threshold.
 */
function band(o) {
  const tone = SKY[o.tone] ? o.tone : 'leather';
  const tid = o.id ? `${o.id}-title` : '';
  const head = o.title ? `
    <header class="rs-head${o.center ? ' rs-head--center' : ''}">
      ${o.eyebrow ? `<p class="rs-head__eyebrow"${reveal('fade')}>${eyebrow(o.eyebrow, o.eyebrowIcon === false ? '' : (o.eyebrowIcon || 'star'))}</p>` : ''}
      <${o.titleTag || 'h2'} class="rs-head__title"${tid ? ` id="${tid}"` : ''}${reveal('up', 1)}>${esc(o.title)}</${o.titleTag || 'h2'}>
      <span class="rs-head__rule" aria-hidden="true"${reveal('fade', 2)}></span>
      ${o.intro ? `<p class="rs-head__intro"${reveal('up', 2)}>${esc(o.intro)}</p>` : ''}
    </header>` : '';
  const inner = `${head}
    ${o.body || ''}`;
  return `
<section class="${cx('section', 'section--ink', 'on-dark', 'rs-band', 'rs-band--' + SKY[tone], o.sheet && 'rs-band--sheet', o.cls)}"${o.id ? ` id="${esc(o.id)}"` : ''}${tid ? ` aria-labelledby="${tid}"` : o.label ? ` aria-label="${esc(o.label)}"` : ''}${o.z != null ? ` style="z-index:${Number(o.z)}"` : ''}>
  <div class="plane-back">${rsSky(tone)}</div>
  <div class="${cx('wrap', o.narrow && 'wrap--narrow', 'rs-band__wrap')}">${o.sheet ? `
    <div class="rs-sheet on-light">${inner}
    </div>` : inner}
  </div>
  ${o.art || ''}
</section>`;
}
/** the dated general-information note (laws, medical card, FAQ) */
function note(kind = 'legal') {
  const what = kind === 'medical' ? 'General information, not medical or legal advice.' : 'General information, not legal advice.';
  return `<aside class="rs-note" role="note"${reveal('up')}>${icon('star', 'rs-note__icon')}<p><strong>${what}</strong> Each statement on this page was checked against the official state page it links to on ${RETRIEVED}. Rules change: check the official source before you rely on it.</p></aside>`;
}
/** a source link for an official claim */
const srcLink = (url, label) => `<a class="rs-src" href="${esc(url)}"${attrs(EXT)}>${icon('external', 'rs-src__icon')}<span>${esc(label || host(url))}</span><span class="sr-only"> (official source, opens in a new tab)</span></a>`;
/** numbered claim list */
function claimList(claims, { start = 1 } = {}) {
  return `<ol class="rs-claims" role="list" data-stagger>${claims.map((c, i) => `
      <li class="rs-claim">
        <span class="rs-claim__n" aria-hidden="true">${String(start + i).padStart(2, '0')}</span>
        <div class="rs-claim__body">
          <p class="rs-claim__text">${esc(c.claim)}</p>
          <p class="rs-claim__meta">Source: ${srcLink(c.url)} <span class="rs-claim__date">retrieved ${esc(fmtIso(c.retrieved))}</span></p>
        </div>
      </li>`).join('')}
    </ol>`;
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtIso = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : String(iso || ''); };
/** a captured quote with its attribution (Star Buds' own words) */
function quoteCard(text, { title, date, href, linkLabel = 'Read the full post', cls } = {}) {
  return `<figure class="${cx('rs-quote', cls)}"${reveal('up')}>
      <span class="rs-quote__mark" aria-hidden="true">&ldquo;</span>
      <blockquote class="rs-quote__text"><p>${esc(text)}</p></blockquote>
      ${title ? `<figcaption class="rs-quote__cap"><span class="rs-quote__src">${esc(title)}</span>${date ? ` <span class="rs-quote__date">${esc(date)}</span>` : ''}</figcaption>` : ''}
      ${href ? `<p class="rs-quote__more"><a class="link-arrow" href="${esc(href)}">${esc(linkLabel)}${icon('arrow')}</a></p>` : ''}
    </figure>`;
}
const postDate = (q) => [q.dateText ? `Star Buds blog, ${q.dateText}` : '', q.updatedText ? `(${q.updatedText})` : ''].filter(Boolean).join(' ');

// ---------------------------------------------------------------- state helpers
function states(ctx) {
  return ctx.storesByState.map(({ state, stores }) => ({ code: state.code, name: state.name, slug: stateSlug(state.name), stores, hub: `/dispensaries/${stateSlug(state.name)}/` }));
}
const DEAL_STATES = new Set(['MS', 'OK', 'MD']); // the states LOCATIONS-R2 builds /dispensaries/<state>/deals/ for
const storeShort = (s) => s.city;
/** visit Q&As of a state's stores: [{ q, answers: [{ a, stores: [store] }] }] (identical answers merged, store order kept) */
function visitQas(stores) {
  const qs = [];
  for (const s of stores) for (const v of s.visit || []) {
    let q = qs.find((x) => x.q.toLowerCase() === String(v.q).toLowerCase());
    if (!q) qs.push(q = { q: v.q, answers: [] });
    let a = q.answers.find((x) => x.a === v.a);
    if (!a) q.answers.push(a = { a: v.a, stores: [] });
    a.stores.push(s);
  }
  return qs;
}
const joinNames = (arr) => (arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);
const storesLabel = (stores) => `Star Buds ${joinNames(stores.map(storeShort))}`;
function storeChips(st) {
  return `<ul class="rs-chips" role="list">${st.stores.map((s) => `<li><a class="chip" href="/stores/${esc(s.slug)}/">${icon('pin')}${esc(s.city)}</a></li>`).join('')}</ul>`;
}
const stateLinks = (st, { law = true, med = true, hub = true, deals = true, guide = false } = {}) => `<p class="rs-links">${[
  hub && `<a class="link-arrow" href="${st.hub}">${esc(st.name)} dispensaries${icon('arrow')}</a>`,
  deals && DEAL_STATES.has(st.code) && `<a class="link-arrow" href="${st.hub}deals/">${esc(st.name)} deals${icon('arrow')}</a>`,
  med && `<a class="link-arrow" href="/getting-a-medical-card/${st.slug}/">Medical card in ${esc(st.name)}${icon('arrow')}</a>`,
  law && `<a class="link-arrow" href="/cannabis-laws-by-state/${st.slug}/">${esc(st.name)} cannabis laws${icon('arrow')}</a>`,
  guide && `<a class="link-arrow" href="/dispensary-guides/#rs-guide-${st.slug}">Dispensary guide${icon('arrow')}</a>`,
].filter(Boolean).join('')}</p>`;
const lawState = (slug) => data().laws.states[slug];
const lawClaims = (slug, topics) => (lawState(slug)?.claims || []).filter((c) => topics.includes(c.topic));

// ================================================================= /dispensary-guides/
function guidesPage(ctx) {
  const sts = states(ctx);
  const tones = ['bone', 'leather', 'parchment', 'ink'];
  const groups = sts.map((st, i) => {
    const tone = tones[i % tones.length];
    const qas = visitQas(st.stores);
    const bring = qas.filter((q) => /bring/i.test(q.q));
    const tips = qas.filter((q) => !/bring/i.test(q.q));
    const qaBlock = (list) => list.map((q) => `
          <div class="rs-qa">
            <h4 class="rs-qa__q">${esc(q.q)}</h4>
            ${q.answers.map((a) => `<p class="rs-qa__a"><span class="rs-qa__who">${esc(storesLabel(a.stores))}:</span> &ldquo;${esc(a.a)}&rdquo;</p>`).join('')}
          </div>`).join('');
    const facts = lawClaims(st.slug, ['age', 'travel']);
    const bringFact = bring.length ? [] : facts.filter((c) => c.topic === 'travel').slice(0, 1);
    const stateFacts = facts.filter((c) => !bringFact.includes(c)).slice(0, 2);
    const body = `
    <div class="rs-guide">
      <div class="rs-guide__stores"${reveal('up')}>
        <h3 class="rs-guide__h">${icon('pin')} The stores</h3>
        ${storeChips(st)}
        ${stateLinks(st)}
      </div>
      <div class="rs-guide__cols">
        ${glass(`<h3 class="rs-guide__h">${icon('star')} What to bring</h3>${bring.length ? qaBlock(bring) : bringFact.length ? '<p class="rs-guide__empty">From the state:</p>' + claimList(bringFact) : '<p class="rs-guide__empty">Each store page lists the store’s address and phone number.</p>'}`, { cls: 'rs-guide__panel', attrs: { 'data-reveal': 'up' } })}
        ${glass(`<h3 class="rs-guide__h">${icon('clock')} Visiting tips</h3>${tips.length ? qaBlock(tips) : `<p class="rs-guide__empty">Hours and services are on each store page.</p>`}<h3 class="rs-guide__h rs-guide__h--gap">${icon('tag')} From the state</h3>${claimList(stateFacts)}`, { cls: 'rs-guide__panel', attrs: { 'data-reveal': 'up', style: '--i:1' } })}
      </div>
    </div>`;
    return band({ tone, id: `rs-guide-${st.slug}`, eyebrow: `${st.code} · ${st.stores.length} store${st.stores.length === 1 ? '' : 's'}`, eyebrowIcon: 'pin', title: `${st.name} dispensary guide`, body, z: 6 - i });
  }).join('');
  const body = `${hubHero({
    eyebrow: 'Resources', title: 'Dispensary Guide',
    intro: 'Visiting a Star Buds dispensary in Mississippi, Oklahoma, Maryland or New York: the stores, what to bring, visiting tips and the state rules in brief.',
    art: { id: 'cut-leaf', rotate: 4 },
    crumbs: [{ label: 'Resources' }, { label: 'Dispensary Guide' }],
    actions: sts.map((st) => btn(st.name, `#rs-guide-${st.slug}`, { variant: 'ghost', size: 'sm', icon: 'pin' })).join(''),
  })}${groups}${band({ tone: 'green', label: 'More resources', body: `${note('legal')}${cardGrid([
    { title: 'Getting a Medical Card', href: '/getting-a-medical-card/', text: 'How the medical card works in each state, from the official program pages.', eyebrow: 'Resources' },
    { title: 'State Laws', href: '/cannabis-laws-by-state/', text: 'Age, buying, possession, where use is not allowed and driving, state by state.', eyebrow: 'Resources' },
    { title: 'FAQ', href: '/faq/', text: 'Every store visit question and the cannabis basics.', eyebrow: 'Help' },
  ], { cols: 3 })}` })}`;
  return { path: '/dispensary-guides/', html: page({ ctx, path: '/dispensary-guides/', bodyClass: 'page-resources page-guides', title: 'Dispensary Guide', description: 'Star Buds dispensary guides for Mississippi, Oklahoma, Maryland and New York: the stores, what to bring, visiting tips and state rules in brief.', body }) };
}

// ================================================================= /getting-a-medical-card/
function medQuote() {
  const q = data().quotes['medical-card'];
  return quoteCard(q.quotes[0], { title: q.title, date: postDate(q), href: postHref(q.slug) });
}
function medHub(ctx) {
  const sts = states(ctx);
  const q = data().quotes['medical-card'];
  const body = `${hubHero({
    eyebrow: 'Resources', title: 'Getting a Medical Card',
    intro: 'How the medical cannabis card works in the four states with Star Buds dispensaries, from each state program’s official pages.',
    art: { id: 'cut-tincture', rotate: -4 }, crumbs: [{ label: 'Resources' }, { label: 'Getting a Medical Card' }],
  })}${band({ tone: 'bone', id: 'rs-med-states', eyebrow: 'By state', title: 'Choose your state', body: cardGrid(sts.map((st) => ({
    title: `Get Your Medical Cannabis Card in ${st.name}`, href: `/getting-a-medical-card/${st.slug}/`, eyebrow: st.code, eyebrowTone: 'green',
    text: `Benefits and how to apply, from the ${(lawState(st.slug) || {}).agency || 'state program'}.`, cta: 'How to apply',
  })), { cols: 2, level: 3 }), z: 6 })}${band({ tone: 'leather', id: 'rs-med-blog', eyebrow: 'From the Star Buds blog', title: 'Why a card matters', body: `<div class="rs-split">${medQuote()}${quoteCard(q.quotes[1], { title: q.title, date: postDate(q), cls: 'rs-quote--alt' })}</div>${note('medical')}`, z: 5 })}`;
  return { path: '/getting-a-medical-card/', html: page({ ctx, path: '/getting-a-medical-card/', bodyClass: 'page-resources page-med', title: 'Getting a Medical Card', description: 'How to get a medical cannabis card in Mississippi, Oklahoma, Maryland and New York, from each state program’s official pages.', body }) };
}
/** Star Buds' own medical-card benefits for a state, from site.json only ('' when the sources have none) */
function medBenefits(ctx, st) {
  const parts = [];
  const qas = visitQas(st.stores);
  const disc = qas.flatMap((q) => q.answers.map((a) => ({ q, a }))).filter(({ a }) => /MED card holders/i.test(a.a));
  const bySentence = new Map(); // the same sentence on several store pages is quoted once, with every store named
  for (const { a } of disc) {
    const m = /[^.]*MED card holders[^.]*\./.exec(a.a);
    const t = m ? m[0].trim() : a.a;
    if (!bySentence.has(t)) bySentence.set(t, []);
    bySentence.get(t).push(...a.stores);
  }
  for (const [t, stores] of bySentence) parts.push(quoteCard(t, { title: `${storesLabel(stores)} store page${stores.length > 1 ? 's' : ''}`, cls: 'rs-quote--short' }));
  const bring = qas.find((q) => /bring/i.test(q.q));
  if (bring && st.code === 'OK') for (const a of bring.answers) {
    const m = /[^.]*medical[^.]*card[^.]*\./i.exec(a.a);
    if (m) parts.push(quoteCard(m[0].trim(), { title: `${storesLabel(a.stores)} store page${a.stores.length > 1 ? 's' : ''}`, cls: 'rs-quote--short' }));
  }
  const deals = (ctx.site.deals || []).filter((d) => d.state === st.code);
  for (const d of deals.filter((x) => x.group === 'medical' || x.group === 'new-medical')) {
    parts.push(glass(`<p class="rs-deal__tag">${pill('Medical', { tone: 'green' })}</p><h3 class="rs-deal__title">${esc(d.title)}</h3>${d.intro ? `<p class="rs-deal__intro">${esc(d.intro)}</p>` : ''}${(d.items || []).length ? `<ul class="rs-deal__list" role="list">${d.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${d.terms ? `<p class="rs-deal__terms">${esc(d.terms)}</p>` : ''}`, { cls: 'rs-deal' }));
  }
  if (st.code === 'MS') {
    const daily = deals.find((x) => x.group === 'daily');
    const line = daily && (daily.items || []).find((x) => /MMCEU/i.test(x));
    if (line) parts.push(quoteCard(line, { title: 'Daily deal listed on the Star Buds Oxford store page', cls: 'rs-quote--short' }));
  }
  return parts.join('');
}
function medState(ctx, st) {
  const claims = data().med[st.slug] || [];
  const law = lawState(st.slug) || {};
  const q = data().quotes['medical-card'];
  const benefits = medBenefits(ctx, st);
  const body = `${hubHero({
    eyebrow: `${st.name} · Medical card`, eyebrowIcon: 'pin', title: `Get Your Medical Cannabis Card in ${st.name}`,
    intro: [`Benefits and how to apply. The steps below come from the ${law.agency || 'state program'}’s official pages, checked ${RETRIEVED}.`],
    art: { id: 'cut-bud', rotate: 6 },
    crumbs: [{ label: 'Getting a Medical Card', href: '/getting-a-medical-card/' }, { label: st.name }],
    actions: `${btn('How to apply', '#rs-med-apply', { variant: 'gold', icon: 'arrow' })}${law.official ? btn('Official program site', law.official, { variant: 'ghost', icon: 'external', attrs: EXT }) : ''}`,
  })}${benefits ? band({ tone: 'bone', id: 'rs-med-benefits', eyebrow: 'At Star Buds', title: 'Benefits for card holders', intro: 'What the Star Buds store and deals pages say about medical card holders in this state.', body: `<div class="rs-benefits">${benefits}</div>${stateLinks(st, { law: false, med: false })}`, z: 6 }) : ''}${band({ tone: 'leather', id: 'rs-med-apply', eyebrow: law.agency || 'Official program', title: 'How to apply', body: `${claimList(claims)}${note('medical')}`, z: 5, sheet: true })}${band({ tone: 'parchment', id: 'rs-med-more', eyebrow: 'From the Star Buds blog', title: 'More to read', body: `<div class="rs-split">${medQuote()}<div class="rs-stack">${glass(`<h3 class="rs-guide__h">${icon('pin')} Star Buds in ${esc(st.name)}</h3>${storeChips(st)}${stateLinks(st, { med: false, deals: false })}`, { cls: 'rs-guide__panel' })}</div></div>`, z: 4 })}`;
  return { path: `/getting-a-medical-card/${st.slug}/`, html: page({ ctx, path: `/getting-a-medical-card/${st.slug}/`, bodyClass: 'page-resources page-med-state', title: `Get Your Medical Cannabis Card in ${st.name}`, description: `How to get a medical cannabis card in ${st.name}, from the ${law.agency || 'state program'}’s official pages, and the Star Buds stores in ${st.name}.`, body }) };
}

// ================================================================= /cannabis-laws-by-state/
const TOPICS = [['status', 'Legal status'], ['age', 'Age'], ['medical', 'Medical and adult-use'], ['buying', 'Buying'], ['possession', 'Possession'], ['use', 'Where use is not allowed'], ['driving', 'Driving'], ['travel', 'Carrying and travel']];
function lawsHub(ctx) {
  const sts = states(ctx);
  const body = `${hubHero({
    eyebrow: 'Resources', title: 'Cannabis Laws by State',
    intro: 'The cannabis rules in the four states with Star Buds dispensaries, in plain statements, each linked to the official state page that says it.',
    art: { id: 'cut-jar', rotate: -8 }, crumbs: [{ label: 'Resources' }, { label: 'State Laws' }],
  })}${band({ tone: 'bone', id: 'rs-laws-states', eyebrow: 'By state', title: 'Choose your state', body: `${cardGrid(sts.map((st) => {
    const s = (lawClaims(st.slug, ['status'])[0] || {}).claim || '';
    return { title: `${st.name} cannabis laws`, href: `/cannabis-laws-by-state/${st.slug}/`, eyebrow: st.code, eyebrowTone: 'leather', text: s, cta: 'Read the rules' };
  }), { cols: 2 })}${note('legal')}`, z: 6 })}`;
  return { path: '/cannabis-laws-by-state/', html: page({ ctx, path: '/cannabis-laws-by-state/', bodyClass: 'page-resources page-laws', title: 'Cannabis Laws by State', description: 'Cannabis laws in Mississippi, Oklahoma, Maryland and New York: legal status, age, buying, possession, where use is not allowed and driving, with official sources.', body }) };
}
function lawPage(ctx, st) {
  const law = lawState(st.slug) || { claims: [] };
  let n = 1;
  const groups = TOPICS.map(([t, label]) => {
    const cs = law.claims.filter((c) => c.topic === t);
    if (!cs.length) return '';
    const html = `<div class="rs-topic"${reveal('up')}><h3 class="rs-topic__h">${esc(label)}</h3>${claimList(cs, { start: n })}</div>`;
    n += cs.length;
    return html;
  }).join('');
  const body = `${hubHero({
    eyebrow: `${st.name} · State laws`, eyebrowIcon: 'pin', title: `${st.name} Cannabis Laws`,
    intro: [`The basics from the ${law.agency || 'state'}’s official pages, checked ${RETRIEVED}. General information, not legal advice.`],
    art: { id: 'cut-leaf', rotate: -3 },
    crumbs: [{ label: 'State Laws', href: '/cannabis-laws-by-state/' }, { label: st.name }],
    actions: law.official ? btn('Official state site', law.official, { variant: 'ghost', icon: 'external', attrs: EXT }) : '',
  })}${band({ tone: 'bone', id: 'rs-law', eyebrow: law.agency || st.name, title: `The rules in ${st.name}`, body: `${note('legal')}<div class="rs-topics">${groups}</div>`, z: 6, sheet: true })}${band({ tone: 'leather', id: 'rs-law-more', eyebrow: 'Star Buds', title: `Shopping in ${st.name}`, body: `<div class="rs-split">${glass(`<h3 class="rs-guide__h">${icon('pin')} The stores</h3>${storeChips(st)}${stateLinks(st, { law: false, guide: true })}`, { cls: 'rs-guide__panel' })}${note('legal')}</div>`, z: 5 })}`;
  return { path: `/cannabis-laws-by-state/${st.slug}/`, html: page({ ctx, path: `/cannabis-laws-by-state/${st.slug}/`, bodyClass: 'page-resources page-law-state', title: `${st.name} Cannabis Laws`, description: `${st.name} cannabis laws in brief: legal status, age, buying, possession, where use is not allowed and driving, each with its official source.`, body }) };
}

// ================================================================= /patient-guide/
function patientGuide(ctx) {
  const Q = data().quotes;
  const SECTIONS = [
    { id: 'cbd', title: 'CBD', intro: 'CBD (cannabidiol) is one of the best-known compounds in the cannabis plant.', post: Q.cbd },
    { id: 'terpenes', title: 'Terpenes', intro: 'Terpenes are the aromatic compounds behind each strain’s scent.', post: Q.terpenes },
    { id: 'cannabinoids', title: 'Cannabinoids', intro: 'THC and CBD are two of the many cannabinoids found in cannabis.', post: Q.cannabinoids },
    { id: 'ecs', title: 'The endocannabinoid system', intro: 'The endocannabinoid system is the body system that cannabinoids interact with.', post: Q.ecs },
    { id: 'medical-card', title: 'Getting a medical card', intro: 'Each state sets its own rules for medical cannabis patients.', post: Q['medical-card'], extra: { label: 'Getting a Medical Card', href: '/getting-a-medical-card/' } },
    { id: 'cancer-relief', title: 'The Star Buds Cancer Relief Program', intro: 'A Star Buds programme for current cancer patients.', crp: Q['cancer-relief'] },
  ];
  const tones = ['bone', 'leather', 'parchment', 'ink', 'bone', 'green'];
  const sections = SECTIONS.map((s, i) => {
    const tone = tones[i];
    let quotes;
    if (s.post) {
      const href = postHref(s.post.slug);
      quotes = s.post.quotes.map((t, k) => quoteCard(t, { title: s.post.title, date: postDate(s.post), href: k === s.post.quotes.length - 1 ? href : null, cls: k ? 'rs-quote--alt' : '' })).join('');
    } else {
      quotes = quoteCard(s.crp.quotes[0], { title: 'Star Buds Cancer Relief Program', href: '/cancer-relief-program/', linkLabel: 'Read the programme and its terms' });
    }
    const extra = s.extra ? `<p class="rs-links"><a class="link-arrow" href="${s.extra.href}">${esc(s.extra.label)}${icon('arrow')}</a></p>` : '';
    return band({ tone, id: `rs-pg-${s.id}`, eyebrow: `Patient guide · ${String(i + 1).padStart(2, '0')}`, title: s.title, intro: s.intro, body: `<div class="rs-split rs-split--quotes">${quotes}</div>${extra}`, z: 7 - i, sheet: true });
  }).join('');
  const body = `${hubHero({
    eyebrow: 'Resources', title: 'Patient Guide',
    intro: 'Short readings from the Star Buds blog on CBD, terpenes, cannabinoids and the endocannabinoid system, plus the medical card and the Cancer Relief Program. Each links to the full post.',
    art: { id: 'cut-tincture', rotate: 5 }, crumbs: [{ label: 'Resources' }, { label: 'Patient Guide' }],
    actions: `<nav class="rs-toc" aria-label="Patient guide sections">${SECTIONS.map((s) => `<a class="chip" href="#rs-pg-${s.id}">${esc(s.title)}</a>`).join('')}</nav>`,
  })}${sections}${band({ tone: 'leather', label: 'Note', body: note('medical'), z: 0 })}`;
  return { path: '/patient-guide/', html: page({ ctx, path: '/patient-guide/', bodyClass: 'page-resources page-patient', title: 'Patient Guide', description: 'Readings from the Star Buds blog on CBD, terpenes, cannabinoids and the endocannabinoid system, the medical card and the Star Buds Cancer Relief Program.', body }) };
}

// ================================================================= /faq/
const FAQ_LINKS = { stores: () => ({ href: '/dispensaries/' }), deals: () => ({ href: '/deals/' }), rewards: () => ({ href: '/rewards/' }), menu: () => menuAttrs('') };
const richQ = (s) => esc(s).replace(/“([^”]+)”/g, '<span class="rs-faq__quote">“$1”</span>');
function faqItem(id, q, answerHtml, group) {
  return `
        <details class="rs-faq__item" name="rs-faq-${esc(group)}" id="${esc(id)}">
          <summary class="rs-faq__q"><span class="rs-faq__qtext">${esc(q)}</span><span class="rs-faq__toggle" aria-hidden="true"></span></summary>
          <div class="rs-faq__a">${answerHtml}</div>
        </details>`;
}
function faqPage(ctx) {
  const F = data().faq;
  const sts = states(ctx);
  const ld = [];
  const groups = (F.groups || []).map((g) => {
    const items = (g.items || []).map((it) => {
      const links = (it.links || []).filter((l) => FAQ_LINKS[l.to]).map((l) => `<a class="link-arrow"${attrs(FAQ_LINKS[l.to]())}>${esc(l.label)}${icon('arrow')}</a>`).join('');
      ld.push({ q: it.q, a: (it.answer || []).join(' ') + (it.disclaimer && F.disclaimer ? ' ' + F.disclaimer : '') });
      return faqItem(`rs-faq-${it.id}`, it.q, `${(it.answer || []).map((p) => `<p>${richQ(p)}</p>`).join('')}${it.disclaimer && F.disclaimer ? `<p class="rs-faq__note">${esc(F.disclaimer)}</p>` : ''}${it.cite ? `<p class="rs-faq__cite">${esc(it.cite)}</p>` : ''}${links ? `<p class="rs-links">${links}</p>` : ''}`, g.id);
    }).join('');
    return { id: g.id, title: g.title, count: (g.items || []).length, items };
  });
  // every store visit Q&A, grouped by state (identical answers merged, the stores named)
  const visit = new Map();
  const stateGroups = sts.map((st) => {
    const qas = visitQas(st.stores);
    if (!qas.length) return null;
    const items = qas.map((q, i) => {
      const key = q.q.toLowerCase();
      if (!visit.has(key)) visit.set(key, { q: q.q, parts: [] });
      for (const a of q.answers) visit.get(key).parts.push(`${storesLabel(a.stores)}: ${a.a}`);
      return faqItem(`rs-faq-${st.slug}-${i + 1}`, q.q, `${q.answers.map((a) => `<p><span class="rs-faq__who">${esc(storesLabel(a.stores))}:</span> <span class="rs-faq__quote">&ldquo;${esc(a.a)}&rdquo;</span></p>`).join('')}<p class="rs-faq__cite">From the Star Buds store page${q.answers.flatMap((a) => a.stores).length > 1 ? 's' : ''} on starbuds.us</p><p class="rs-links"><a class="link-arrow" href="${st.hub}">${esc(st.name)} dispensaries${icon('arrow')}</a><a class="link-arrow" href="/dispensary-guides/#rs-guide-${st.slug}">Dispensary guide${icon('arrow')}</a></p>`, 'visit-' + st.slug);
    }).join('');
    return { id: 'visit-' + st.slug, title: `Visiting in ${st.name}`, count: qas.length, items, st };
  }).filter(Boolean);
  for (const v of visit.values()) ld.push({ q: v.q, a: v.parts.join(' ') });
  const all = [...groups, ...stateGroups];
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: ld.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }).replace(/</g, '\\u003c');
  const groupHtml = all.map((g, i) => `
      <div class="rs-faq__group" id="rs-faq-group-${esc(g.id)}"${reveal('up')}>
        <div class="rs-faq__head">
          <p class="rs-faq__count">${pill(`${g.count} question${g.count === 1 ? '' : 's'}`, { tone: i < groups.length ? 'star' : 'green' })}</p>
          <h2 class="rs-faq__title" id="rs-faq-${esc(g.id)}-title">${esc(g.title)}</h2>
          <span class="rs-faq__rule" aria-hidden="true"></span>
        </div>
        <div class="rs-faq__list">${g.items}
        </div>
      </div>`).join('');
  const body = `${hubHero({
    eyebrow: F.eyebrow || 'FAQ', title: 'Frequently Asked Questions', intro: [F.lede || '', 'Plus every visit question from the Star Buds store pages, by state.'].filter(Boolean),
    art: { id: 'cut-preroll', rotate: -6 }, crumbs: [{ label: 'FAQ' }],
    actions: `<nav class="rs-toc" aria-label="FAQ groups">${all.map((g) => `<a class="chip" href="#rs-faq-group-${esc(g.id)}">${esc(g.title)}</a>`).join('')}</nav>`,
  })}
<section class="section section--ink on-dark rs-band rs-band--violet rs-faq" aria-label="Questions and answers" style="z-index:6">
  <div class="plane-back">${rsSky('ink')}</div>
  <div class="wrap rs-band__wrap">
    <div class="rs-faq__panel glass">${groupHtml}
      <p class="rs-faq__disclaimer">${icon('star')}<span>${esc(F.disclaimer || '')}</span></p>
    </div>
  </div>
  <script type="application/ld+json">${jsonLd}</script>
</section>`;
  return { path: '/faq/', html: page({ ctx, path: '/faq/', bodyClass: 'page-resources page-faq', title: 'FAQ', description: 'Frequently asked questions about visiting Star Buds, shopping, Higher Rewards and cannabis basics, plus the visit questions from every Star Buds store page.', body }) };
}

// ================================================================= /products/ + guides
// Dropped from the captures (Colorado-only or brand line-ups of the Colorado stores, one naming a brand on the D4 list):
// products: the Strains, Edibles and Concentrates card taglines; cbd: "TRY OUR CBD PRODUCTS / AVAILABLE AT EVERY STARBUDS"
// and its 6-brand gallery; concentrates: "KAVIAR NOW AVAILABLE IN ALL STORES", "Proudly Carrying the Most Potent
// Concentrates in Colorado" and the 9-brand gallery; edibles: the "MUNCHIE MONDAY" Colorado daily deal and the 16-brand
// gallery; topicals: the 8-brand gallery; vapes: "STARBUDS VAPE CARTRIDGES (500mg) Available at all Locations" and the
// 7-brand gallery. Kept verbatim: every product-education sentence and "PRODUCT SELECTION AND AVAILABILITY VARIES BY LOCATION".
const GUIDE = {
  cbd: { img: 'products-cbd', card: 2, faq: ['thc-cbd'], related: /\bCBD\b|cannabidiol/i, art: 'cut-tincture' },
  concentrates: { img: 'products-concentrates', card: 3, faq: [], related: /concentrat|dab|extract|rosin|wax/i, art: 'cut-concentrate' },
  edibles: { img: 'products-edibles', card: 1, faq: ['edibles', 'storage'], related: /edible|gumm/i, art: 'cut-gummies' },
  topicals: { img: 'products-topicals', card: 5, faq: [], related: /topical|lotion|balm/i, art: 'cut-leaf' },
  vapes: { img: 'products-vapes', card: 4, faq: [], related: /\bvape|vapor|cartridge/i, art: 'cut-vape' },
};
const KEEP_TAGLINE = new Set([2, 4, 5]); // CBD, vapes, topicals: product education true at any store; 0/1/3 are Colorado-specific
/** the products page cards: [{ label, tagline, href }] (tagline joined from the split heading blocks) */
function productCards() {
  const rep = deep(blocksOf('products')).find((b) => b.t === 'repeater');
  return (rep?.items || []).map((it, i) => {
    const hs = (it.blocks || []).filter((b) => b.t === 'heading').map((b) => plain(b.html)).filter(Boolean);
    const button = (it.blocks || []).find((b) => b.t === 'button');
    return { i, label: hs[0] || '', tagline: KEEP_TAGLINE.has(i) ? hs.slice(1).join(' ') : '', href: button?.href || '' };
  });
}
const AVAIL = () => { const r = deep(blocksOf('products')).find((b) => b.t === 'rich' && /AVAILABILITY VARIES/.test(plain(b.html))); return r ? plain(r.html).replace(/^-\s*|\s*-$/g, '') : ''; };
function productsHub(ctx) {
  const intro = deep(blocksOf('products')).find((b) => b.t === 'rich' && /in the mood/i.test(plain(b.html)));
  const cards = productCards();
  const guides = data().products.guides;
  const items = cards.map((c) => {
    const slug = (c.href.match(/^\/(cbd|concentrates|edibles|topicals|vapes)\//) || [])[1];
    const g = guides.find((x) => x.slug === slug);
    if (!g) return { title: 'Flower', eyebrow: tidyCaps(c.label), text: 'Open the flower menu of your Star Buds store.', menuCat: 'flower', image: photo('products-strains', ''), cta: 'Shop flower' };
    return { title: g.label, eyebrow: 'Product guide', text: c.tagline ? tidyCaps(c.tagline, 'sentence') : '', href: g.href, image: photo(GUIDE[slug].img, ''), cta: 'Read the guide' };
  });
  const body = `${hubHero({
    eyebrow: 'Explore', title: 'Product Guides', intro: { html: intro ? tidyHtml(intro.html) : '' },
    art: { id: 'cut-jar', rotate: -6 }, crumbs: [{ label: 'Product guides' }],
    actions: btn('Shop the live menu', menuAttrs('').href, { variant: 'gold', icon: 'bag', attrs: { 'data-menu-cat': '' } }),
  })}${band({ tone: 'bone', id: 'rs-products', eyebrow: 'Guides', title: 'What are you in the mood for?', intro: AVAIL(), body: cardGrid(items, { cols: 3 }), z: 6 })}`;
  return { path: '/products/', html: page({ ctx, path: '/products/', bodyClass: 'page-resources page-products', title: 'Product Guides', description: 'Star Buds product guides: CBD, concentrates, edibles, topicals and vapes, with a link to your store’s live menu.', body }) };
}
function guidePage(ctx, g) {
  const G = GUIDE[g.slug];
  const card = productCards()[G.card] || {};
  const tagline = card.tagline ? tidyCaps(card.tagline, 'sentence') : '';
  const page_ = data().pages[g.slug];
  // product-education rich text of the guide (cbd: the CANNABINOIDS paragraph); availability lines are shown once below
  const edu = deep(blocksOf(g.slug)).filter((b) => b.t === 'rich' && plain(b.html).length > 120);
  const eduHead = g.slug === 'cbd' ? (deep(blocksOf('cbd')).find((b) => b.t === 'heading' && /CANNABINOIDS/.test(plain(b.html))) || null) : null;
  const F = data().faq;
  const faqs = (F.groups || []).flatMap((x) => x.items || []).filter((it) => G.faq.includes(it.id));
  const related = relatedPosts(G.related, 3);
  const shop = btn(`Shop ${g.label.toLowerCase() === 'cbd' ? 'the live menu' : g.label.toLowerCase()}`, menuAttrs(g.menuCat).href, { variant: 'gold', icon: 'bag', attrs: { 'data-menu-cat': g.menuCat } });
  const eduHtml = edu.length ? `${eduHead ? `<h3 class="rs-prose__sub">${esc(tidyCaps(eduHead.html))}</h3>` : ''}${edu.map((b) => tidyHtml(b.html)).join('')}` : '';
  const body = `${hubHero({
    eyebrow: 'Product guide', title: g.label, intro: tagline ? [tagline] : ['From the Star Buds product pages.'],
    art: { id: G.art, rotate: 8 }, crumbs: [{ label: 'Product guides', href: '/products/' }, { label: g.label }],
    actions: `${shop}${btn('All product guides', '/products/', { variant: 'ghost', icon: 'arrow' })}`,
  })}${band({ tone: 'bone', id: 'rs-guide-main', eyebrow: g.label, title: `About ${g.label.toLowerCase() === 'cbd' ? 'CBD' : g.label.toLowerCase()}`, body: `
    <div class="rs-media">
      <figure class="rs-media__fig"${reveal('left')}>${img(photo(G.img, ''), { cls: 'rs-media__img', sizes: '(max-width: 900px) 92vw, 560px' })}</figure>
      <div class="rs-media__copy"${reveal('right')}>
        ${eduHtml ? prose(eduHtml) : ''}
        ${tagline && !eduHtml ? `<p class="rs-lead">${esc(tagline)}</p>` : ''}
        <p class="rs-avail">${icon('pin')}<span>${esc(tidyCaps(AVAIL(), 'sentence'))}.</span></p>
        <div class="btn-row">${shop}</div>
        <p class="rs-fine">The button opens the ${esc(g.menuCat ? g.label.toLowerCase() : 'live')} menu of the store you chose; with no store chosen, it asks you to pick one first.</p>
      </div>
    </div>`, z: 6 })}${faqs.length ? band({ tone: 'leather', id: 'rs-guide-faq', eyebrow: 'FAQ', title: 'Good to know', body: `<div class="rs-faq rs-faq--inline"><div class="rs-faq__list">${faqs.map((it) => faqItem(`rs-gf-${it.id}`, it.q, (it.answer || []).map((p) => `<p>${richQ(p)}</p>`).join(''), 'guide-' + g.slug)).join('')}</div></div><p class="rs-links"><a class="link-arrow" href="/faq/">All questions${icon('arrow')}</a></p>`, z: 5 }) : ''}${band({ tone: faqs.length ? 'parchment' : 'leather', id: 'rs-guide-read', eyebrow: 'Star Buds blog', title: 'Further reading', body: related.length ? `<ul class="rs-posts" role="list">${related.map((p) => `<li>${articleCard({ ...p, image: p.image && p.image.src ? p.image : null })}</li>`).join('')}</ul>` : `<p class="rs-lead">Articles about ${esc(g.label.toLowerCase() === 'cbd' ? 'CBD' : g.label.toLowerCase())} and more on the Star Buds blog.</p><p class="rs-links"><a class="link-arrow" href="/blog/">The Star Buds blog${icon('arrow')}</a>${g.slug === 'cbd' ? `<a class="link-arrow" href="/patient-guide/#rs-pg-cbd">Patient guide: CBD${icon('arrow')}</a>` : ''}</p>`, z: 4 })}`;
  return { path: g.href, html: page({ ctx, path: g.href, bodyClass: 'page-resources page-guide', title: `${g.label} Guide`, description: `${tagline || g.label + ' at Star Buds'}. Product selection and availability varies by location; open your store’s live menu.`, body }) };
}

// ================================================================= content pages (starbuds.us words, D7)
function aboutPage(ctx) {
  const b = blocksOf('about');
  const lead = b.find((x) => x.t === 'heading' && plain(x.html).length > 80);
  const diffHead = b.find((x) => x.t === 'heading' && /Difference/i.test(plain(x.html)));
  const diff = b.find((x) => x.t === 'rich');
  const award = b.find((x) => x.t === 'heading' && /PROUD WINNERS/i.test(plain(x.html)));
  const awardBtn = b.find((x) => x.t === 'button');
  const team = blocksOf('team-starbuds');
  const featured = team.find((x) => x.t === 'rich' && /FEATURED/.test(plain(x.html)));
  const featuredLines = featured ? tidyHtml(featured.html).match(/<p>([^<]+)<\/p>/g).map((p) => p.replace(/<\/?p>/g, '')) : [];
  const person = team.find((x) => x.t === 'heading' && x.level === 1 && !/team starbuds/i.test(plain(x.html)));
  const body = `${hubHero({
    eyebrow: `Est. ${ctx.site.brand?.est || '2013'}`, title: 'About Us', intro: lead ? [plain(lead.html)] : [],
    art: { id: 'cut-bud', rotate: -4 }, crumbs: [{ label: 'About Us' }],
    actions: `${btn('Product guides', '/products/', { variant: 'gold' })}${btn('Find a dispensary', '/dispensaries/', { variant: 'ghost', icon: 'pin' })}`,
  })}${band({ tone: 'bone', id: 'rs-about-diff', eyebrow: 'Star Buds', title: diffHead ? tidyCaps(diffHead.html) : 'The Star Buds Difference', body: `<div class="rs-cols">${prose(subheads(tidyHtml(diff ? diff.html : '')), 'rs-prose--lead')}</div>`, narrow: true, z: 6 })}${award ? band({ tone: 'leather', id: 'rs-about-cup', label: 'Cannabis Cup', body: `
    <div class="rs-award">
      <figure class="rs-award__plate"${reveal('left')}>${img(photo('about-cannabis-cup'), { cls: 'rs-award__img', sizes: '(max-width: 700px) 70vw, 380px' })}</figure>
      <div class="rs-award__copy"${reveal('right')}>
        <p class="rs-head__eyebrow">${pill('2015', { tone: 'star', icon: 'star' })}</p>
        <h2 class="rs-award__title">${esc(plain(award.html))}</h2>
        ${awardBtn && awardBtn.href ? btn(tidyCaps(awardBtn.text), awardBtn.href, { variant: 'ghost', icon: 'external', attrs: EXT }) : ''}
      </div>
      ${orb({ label: 'Cup', sub: 'winners', cls: 'rs-award__seal' })}
    </div>`, z: 5 }) : ''}${person ? band({ tone: 'parchment', id: 'rs-about-team', eyebrow: 'The team', title: 'Team Star Buds', body: `
    <div class="rs-team"${reveal('up')}>
      <figure class="rs-team__photo">${img(photo('team-master-grower', plain(person.html)), { cls: 'rs-team__img', sizes: '(max-width: 700px) 60vw, 300px' })}</figure>
      <div class="rs-team__copy">
        ${featuredLines[0] ? `<p class="rs-team__tag">${pill(tidyCaps(featuredLines[0]), { tone: 'green' })}</p>` : ''}
        ${featuredLines[1] ? `<p class="rs-team__role">${esc(featuredLines[1])}</p>` : ''}
        <h3 class="rs-team__name">${esc(tidyCaps(person.html))}</h3>
      </div>
    </div>`, z: 4 }) : ''}${band({ tone: 'leather', id: 'rs-about-more', eyebrow: 'More about Star Buds', title: 'Get to know us', body: cardGrid([
    { title: 'Community', href: '/community/', eyebrow: 'Giving back', text: 'Star Buds programs and partnerships in its communities.' },
    { title: 'Cancer Relief Program', href: '/cancer-relief-program/', eyebrow: 'Programme', text: 'Discounted Hash Oil for Current Cancer Patients' },
    { title: 'In the Press', href: '/media/', eyebrow: 'Media', text: 'Stories and features about Star Buds.' },
    { title: 'Careers', href: '/careers/', eyebrow: 'Jobs', text: 'Open positions and business inquiries.' },
  ], { cols: 4 }), z: 3 })}`;
  return { path: '/about-us/', html: page({ ctx, path: '/about-us/', bodyClass: 'page-resources page-about', title: 'About Us', description: lead ? plain(lead.html) : 'About Star Buds.', body }) };
}

function contactPage(ctx) {
  const b = blocksOf('contact');
  const workHead = b.find((x) => x.t === 'heading' && /WORKING WITH US/i.test(plain(x.html)));
  const workText = b.find((x) => x.t === 'rich');
  const sts = states(ctx);
  const dir = sts.map((st) => `
    <div class="rs-dir" id="rs-contact-${st.slug}"${reveal('up')}>
      <h3 class="rs-dir__state">${pill(st.code, { tone: 'green', icon: 'pin' })} <span>${esc(st.name)}</span></h3>
      <ul class="rs-dir__list" role="list">${st.stores.map((s) => `
        <li>${glass(`
          <h4 class="rs-dir__name"><a href="/stores/${esc(s.slug)}/">${esc(s.name)}</a></h4>
          <p class="rs-dir__addr">${(s.address || []).map(esc).join('<br>')}</p>
          ${s.phone ? `<p class="rs-dir__phone"><a href="tel:${esc(s.tel || s.phone)}">${icon('phone')}${esc(s.phone)}</a></p>` : ''}
          <p class="rs-dir__links">${s.mapUrl ? `<a href="${esc(s.mapUrl)}"${attrs(EXT)}>${icon('directions')}Directions</a>` : ''}<a href="/stores/${esc(s.slug)}/">${icon('arrow')}Store page</a></p>`, { cls: 'rs-dir__card' })}</li>`).join('')}
      </ul>
    </div>`).join('');
  const body = `${hubHero({
    eyebrow: 'Contact', title: 'Contact Us', intro: 'Call or visit your Star Buds store: every store’s address and phone number is below.',
    art: { id: 'cut-preroll', rotate: 10 }, crumbs: [{ label: 'Contact Us' }],
    actions: sts.map((st) => btn(st.name, `#rs-contact-${st.slug}`, { variant: 'ghost', size: 'sm', icon: 'pin' })).join(''),
  })}${band({ tone: 'bone', id: 'rs-contact-stores', eyebrow: 'Stores', title: 'Call or visit', body: dir, z: 6 })}${workHead ? band({ tone: 'leather', id: 'rs-contact-work', eyebrow: 'Business', title: tidyCaps(workHead.html, 'sentence'), body: `${prose(tidyHtml(workText ? workText.html : ''))}<div class="btn-row">${btn('Get In Touch', '/careers/#business-inquiries', { variant: 'gold' })}</div>`, narrow: true, z: 5 }) : ''}`;
  return { path: '/contact/', html: page({ ctx, path: '/contact/', bodyClass: 'page-resources page-contact', title: 'Contact Us', description: 'Contact Star Buds: the address and phone number of every Star Buds store in Mississippi, Oklahoma, Maryland and New York.', body }) };
}

function careersPage(ctx) {
  const c = deep(blocksOf('careers'));
  const hiring = c.find((x) => x.t === 'rich' && /Now Hiring/i.test(plain(x.html)));
  const posBtn = c.find((x) => x.t === 'button' && /POSITIONS/i.test(x.text));
  const looking = c.find((x) => x.t === 'rich' && /LOOKING FOR/i.test(plain(x.html)));
  const statement = c.find((x) => x.t === 'heading' && plain(x.html).length > 100);
  const joinHead = c.find((x) => x.t === 'heading' && /JOINING US/i.test(plain(x.html)));
  const joinText = c.find((x) => x.t === 'rich' && /BUDTENDERS/i.test(plain(x.html)));
  const apply = c.find((x) => x.t === 'button' && /APPLY/i.test(x.text));
  const w = deep(blocksOf('workwithus'));
  const wText = w.find((x) => x.t === 'rich' && plain(x.html).length > 200);
  const solutions = w.filter((x) => x.t === 'rich' && plain(x.html).length < 20).map((x) => tidyCaps(plain(x.html)));
  const solHead = w.find((x) => x.t === 'heading' && /SOLUTIONS/i.test(plain(x.html)));
  const applyHref = apply ? mapHref(apply.href) : null;
  const body = `${hubHero({
    eyebrow: 'Careers', title: 'Careers', intro: hiring ? [plain(hiring.html)] : [],
    art: { id: 'cut-jar', rotate: 8 }, crumbs: [{ label: 'About Us', href: '/about-us/' }, { label: 'Careers' }],
    actions: `${posBtn ? btn(tidyCaps(posBtn.text), posBtn.href, { variant: 'gold', icon: 'external', attrs: EXT }) : ''}${btn('Business inquiries', '#business-inquiries', { variant: 'ghost', icon: 'arrow' })}`,
  })}${band({ tone: 'bone', id: 'rs-careers-join', eyebrow: looking ? 'Join the team' : '', title: joinHead ? tidyCaps(joinHead.html) : 'Join us', body: `
    ${looking ? `<p class="rs-kicker">${esc(plain(looking.html))}</p>` : ''}
    ${statement ? `<p class="rs-statement"${reveal('up')}>${esc(plain(statement.html))}</p>` : ''}
    ${joinText ? `<p class="rs-lead">${esc(tidyCaps(joinText.html, 'sentence'))}</p>` : ''}
    ${applyHref ? `<div class="btn-row">${btn(tidyCaps(apply.text), applyHref.href, { variant: 'gold', icon: 'arrow' })}</div>` : ''}`, narrow: true, z: 6 })}
<section class="section section--ink on-dark rs-band rs-band--green" id="business-inquiries" aria-labelledby="business-inquiries-title" style="z-index:5">
  <div class="plane-back">${rsSky('leather')}</div>
  <div class="wrap wrap--narrow rs-band__wrap">
    <header class="rs-head">
      <p class="rs-head__eyebrow"${reveal('fade')}>${eyebrow('Work with us', 'star')}</p>
      <h2 class="rs-head__title" id="business-inquiries-title"${reveal('up', 1)}>Business Inquiries</h2>
      <span class="rs-head__rule" aria-hidden="true"></span>
    </header>
    ${prose(tidyHtml(wText ? wText.html : ''))}
    ${solutions.length ? `<h3 class="rs-solutions__h">${esc(solHead ? tidyCaps(solHead.html) : 'Brand Solutions')}</h3><ul class="rs-solutions" role="list">${solutions.map((s) => `<li>${pill(s, { tone: 'star', icon: 'star' })}</li>`).join('')}</ul>` : ''}
    <p class="rs-links"><a class="link-arrow" href="/contact/">Contact Us${icon('arrow')}</a></p>
  </div>
</section>`;
  return { path: '/careers/', html: page({ ctx, path: '/careers/', bodyClass: 'page-resources page-careers', title: 'Careers', description: 'Careers at Star Buds and business inquiries: licensing, operations and marketing.', body }) };
}

function communityPage(ctx) {
  const c = deep(blocksOf('community'));
  const intro = c.find((x) => x.t === 'rich' && /care about/i.test(plain(x.html)));
  const paras = intro ? tidyHtml(intro.html).match(/<p>[\s\S]*?<\/p>/g) || [] : [];
  const reps = blocksOf('community').filter((x) => x.t === 'repeater');
  const cards = reps.flatMap((r) => r.items || []).map((it) => {
    const h = (it.blocks || []).find((x) => x.t === 'heading');
    const rich = (it.blocks || []).find((x) => x.t === 'rich');
    const button = (it.blocks || []).find((x) => x.t === 'button');
    const href = button ? mapHref(button.href) : null;
    return { title: tidyCaps(plain(h ? h.html : '')), html: rich ? tidyHtml(rich.html) : '', href, label: button ? tidyCaps(button.text) : '' };
  });
  const linked = cards.filter((x) => x.href);
  const stories = cards.filter((x) => !x.href);
  const body = `${hubHero({
    eyebrow: 'Giving back', title: 'Community', intro: paras[0] ? [plain(paras[0])] : [],
    art: { id: 'cut-leaf', rotate: -5 }, crumbs: [{ label: 'About Us', href: '/about-us/' }, { label: 'Community' }],
  })}${band({ tone: 'bone', id: 'rs-community', eyebrow: 'Star Buds', title: 'Doing some good', body: `${paras.slice(1).length ? prose(paras.slice(1).join(''), 'rs-prose--lead') : ''}${cardGrid(linked.map((x) => ({ title: x.title, href: x.href.href, external: x.href.ext, cta: x.label || 'Learn more', eyebrow: x.href.ext ? 'starbuds.us' : 'Programme' })), { cols: 2 })}`, narrow: false, z: 6 })}${stories.length ? band({ tone: 'leather', id: 'rs-community-stories', eyebrow: 'In the community', title: 'Partnerships', body: `<ul class="rs-stories" role="list" data-stagger>${stories.map((s) => `<li>${glass(`<h3 class="rs-story__title">${esc(s.title)}</h3>${prose(s.html, 'rs-prose--card')}`, { cls: 'rs-story' })}</li>`).join('')}</ul>`, z: 5 }) : ''}`;
  return { path: '/community/', html: page({ ctx, path: '/community/', bodyClass: 'page-resources page-community', title: 'Community', description: paras[0] ? plain(paras[0]) : 'Star Buds in the community.', body }) };
}

function mediaPage(ctx) {
  const blocks = blocksOf('media');
  const rep = blocks.find((x) => x.t === 'repeater');
  const NAMES = ['press-msnbc-pot-barons', 'press-growmag', 'press-boston-globe', 'press-cannabist', 'press-msnbc', 'press-dope-magazine', 'press-forbes', 'press-ncv', 'press-rolling-stone'];
  const items = (rep?.items || []).map((it, i) => {
    const im = (it.blocks || []).find((x) => x.t === 'image');
    const h = (it.blocks || []).find((x) => x.t === 'heading');
    return { title: plain(h ? h.html : ''), href: im ? im.href : '', outlet: host(im ? im.href : ''), photo: photo(NAMES[i], '') };
  }).filter((x) => x.href);
  const heads = blocks.filter((x) => x.t === 'heading').map((x) => plain(x.html));
  const recipeHeads = heads.filter((t) => /CANNABIS INFUSED|CANNABUTTER/i.test(t));
  const recipeBtns = blocks.filter((x) => x.t === 'button' && /RECIPE/i.test(x.text));
  const kitchen = heads.find((t) => /KITCHEN/i.test(t));
  const kitchenSub = heads.find((t) => /COOKING AT HOME/i.test(t));
  const yt = heads.find((t) => /YOUTUBE/i.test(t));
  const embed = blocks.find((x) => x.t === 'embed');
  const fbHref = embed ? (() => { try { return new URL(embed.src).searchParams.get('href') || ''; } catch { return ''; } })() : '';
  const press = `<ul class="rs-press" role="list" data-stagger>${items.map((x) => `
      <li><a class="rs-press__card glass lift" href="${esc(x.href)}"${attrs(EXT)}>
        <span class="rs-press__logo">${img(x.photo, { cls: 'rs-press__img', alt: '', sizes: '216px' })}</span>
        <span class="rs-press__outlet">${esc(x.outlet)}</span>
        <h3 class="rs-press__title">${esc(x.title)}</h3>
        <span class="rs-press__cta">Read the story${icon('external')}<span class="sr-only"> on ${esc(x.outlet)} (opens in a new tab)</span></span>
      </a></li>`).join('')}
    </ul>`;
  const recipes = recipeHeads.map((t, i) => ({ title: tidyCaps(t), href: recipeBtns[i] ? recipeBtns[i].href : '' })).filter((r) => r.href);
  const body = `${hubHero({
    eyebrow: 'Media', title: 'In the Press', intro: 'Star Buds in the news: stories and features, each linked to the outlet that published it.',
    art: { id: 'cut-bud', rotate: 4 }, crumbs: [{ label: 'About Us', href: '/about-us/' }, { label: 'In the Press' }],
  })}${band({ tone: 'bone', id: 'rs-press', eyebrow: `${items.length} stories`, title: 'Press', body: press, z: 6 })}${kitchen ? band({ tone: 'leather', id: 'rs-kitchen', eyebrow: 'Recipes', title: tidyCaps(kitchen), intro: kitchenSub ? tidyCaps(kitchenSub) : '', body: cardGrid(recipes.map((r) => ({ title: r.title, href: r.href, external: true, eyebrow: 'Recipe (PDF)', cta: 'The recipe' })), { cols: 3 }), z: 5 }) : ''}${yt && fbHref ? band({ tone: 'green', id: 'rs-video', eyebrow: 'Video', title: tidyCaps(yt), body: `<p class="rs-lead">The featured video plays on facebook.com.</p><div class="btn-row">${btn('Watch the video', fbHref, { variant: 'gold', icon: 'external', attrs: EXT })}</div>`, narrow: true, z: 4 }) : ''}`;
  return { path: '/media/', html: page({ ctx, path: '/media/', bodyClass: 'page-resources page-media', title: 'In the Press', description: 'Star Buds in the press: MSNBC, Forbes, Rolling Stone, The Boston Globe and more, plus recipes from Julie’s Kitchen.', body }) };
}

function crpPage(ctx) {
  const b = deep(blocksOf('cancerreliefprogram'));
  const heads = b.filter((x) => x.t === 'heading').map((x) => plain(x.html));
  const rich = b.filter((x) => x.t === 'rich');
  const list = b.find((x) => x.t === 'list');
  const sub = heads.find((t) => /Brought to you/i.test(t));
  const lede = heads.find((t) => /Discounted/i.test(t));
  const body = `${hubHero({
    eyebrow: sub || 'Star Buds', title: 'Cancer Relief Program', intro: lede ? [lede] : [],
    art: { id: 'cut-tincture', rotate: 4 }, crumbs: [{ label: 'Community', href: '/community/' }, { label: 'Cancer Relief Program' }],
    actions: `${btn('Terms & Conditions', '#rs-crp-terms', { variant: 'gold', icon: 'arrow' })}${btn('Find a store', '/dispensaries/', { variant: 'ghost', icon: 'pin' })}`,
  })}${band({ tone: 'bone', id: 'rs-crp', eyebrow: 'The programme', title: 'Cancer Relief Program', titleTag: 'h2', body: prose(tidyHtml(rich[0] ? rich[0].html : ''), 'rs-prose--lead'), narrow: true, z: 6 })}${rich[1] ? band({ tone: 'leather', id: 'rs-crp-product', eyebrow: 'Hash oil', title: heads.find((t) => /About Our Product/i.test(t)) || 'About Our Product', body: prose(tidyHtml(rich[1].html)), narrow: true, z: 5 }) : ''}${band({ tone: 'parchment', id: 'rs-crp-terms', eyebrow: 'Eligibility', title: (heads.find((t) => /Terms/i.test(t)) || 'Terms & Conditions'), body: `${prose(tidyHtml(rich[2] ? rich[2].html : ''))}${list ? `<ul class="rs-ticks" role="list">${list.items.map((i) => `<li>${icon('star')}<span>${esc(plain(typeof i === 'string' ? i : i.html))}</span></li>`).join('')}</ul>` : ''}<p class="rs-links"><a class="link-arrow" href="/rewards/">Higher Rewards${icon('arrow')}</a><a class="link-arrow" href="/patient-guide/">Patient guide${icon('arrow')}</a></p>`, narrow: true, z: 4, sheet: true })}`;
  return { path: '/cancer-relief-program/', html: page({ ctx, path: '/cancer-relief-program/', bodyClass: 'page-resources page-crp', title: 'Cancer Relief Program', description: data().pages.cancerreliefprogram.description || 'The Star Buds Cancer Relief Program.', body }) };
}

/** re-flow a hard-wrapped plain-text legal document (one <p> per ~78-char line, "====" / "----" underlines, "* " items) */
function reflowLegal(html) {
  const lines = (String(html).match(/<p>([\s\S]*?)<\/p>/g) || []).map((p) => p.replace(/^<p>|<\/p>$/g, '').replace(ZW, '').trim());
  const out = [];
  let para = null, list = null;
  const flushP = () => { if (para) { out.push(`<p>${para}</p>`); para = null; } };
  const flushL = () => { flushP(); if (list) { out.push(`<ul>${list.map((x) => `<li>${x}</li>`).join('')}</ul>`); list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i], nx = lines[i + 1] || '';
    if (!t) { flushP(); continue; }
    if (/^=+$|^-+$/.test(t)) continue;
    if (/^=+$/.test(nx)) { flushL(); out.push(`<h2 class="rs-legal__h2">${t}</h2>`); continue; }
    if (/^-+$/.test(nx)) { flushL(); out.push(`<h3 class="rs-legal__h3">${t}</h3>`); continue; }
    if (/^\*\s+/.test(t)) { flushP(); list = list || []; list.push(t.replace(/^\*\s+/, '')); continue; }
    if (list && !para) { list[list.length - 1] += ' ' + t; if (t.length < 60) { /* item ends */ } continue; }
    if (para) para += ' ' + t; else { flushL(); para = t; }
    if (t.length < 60 || /[.:]$/.test(t) && t.length < 72) flushP();
  }
  flushL();
  return out.join('\n');
}
/** short numbered / all-caps lines of a normal legal block -> headings (words unchanged) */
const legalHeads = (html) => html.replace(/<p>((?:\d+\.\s+)?[A-Z][^<.]{2,70})<\/p>/g, (m, t) => (/[a-z]{3,}.*[.;]$/.test(t) ? m : `<h3 class="rs-legal__h3">${t}</h3>`));
function eulaPage(ctx) {
  const p = data().pages.eula;
  const r = deep(blocksOf('eula')).filter((x) => x.t === 'rich');
  const first = r[0] ? reflowLegal(tidyHtml(r[0].html)) : '';
  const second = r[1] ? legalHeads(tidyHtml(r[1].html)) : '';
  const body = `${hubHero({
    eyebrow: 'Legal', title: 'End User License Agreement', intro: [p.title],
    crumbs: [{ label: 'EULA' }], art: { id: 'cut-bud', rotate: -4 },
    actions: `${btn('License agreement', '#rs-eula-1', { variant: 'ghost', size: 'sm', icon: 'arrow' })}${btn('Terms & Conditions', '#rs-eula-2', { variant: 'ghost', size: 'sm', icon: 'arrow' })}`,
  })}${band({ tone: 'bone', id: 'rs-eula-1', label: 'End-User License Agreement', body: `<article class="rs-legal">${first}</article>`, narrow: true, z: 6, sheet: true })}${band({ tone: 'parchment', id: 'rs-eula-2', label: 'Terms and Conditions', body: `<article class="rs-legal">${second}</article>`, narrow: true, z: 5, sheet: true })}`;
  return { path: '/eula/', html: page({ ctx, path: '/eula/', bodyClass: 'page-resources page-legal', title: 'End User License Agreement', description: 'Star Buds App End User License Agreement, Terms and Conditions.', body }) };
}
function hrTermsPage(ctx) {
  const blocks = blocksOf('hr-tc');
  const parts = blocks.map((b) => {
    if (b.t === 'list') return (b.items || []).map((i) => `<h2 class="rs-legal__h2">${esc(plain(typeof i === 'string' ? i : i.html))}</h2>`).join('');
    if (b.t === 'rich' || b.t === 'html') return legalHeads(tidyHtml(b.html));
    if (b.t === 'heading') return `<h2 class="rs-legal__h2">${esc(plain(b.html))}</h2>`;
    return '';
  }).join('\n');
  const body = `${hubHero({
    eyebrow: 'Higher Rewards', title: 'Higher Rewards Terms & Conditions', intro: ['The terms of the Higher Rewards Loyalty Program, as published by Star Buds.'],
    crumbs: [{ label: 'Higher Rewards', href: '/rewards/' }, { label: 'Terms & Conditions' }], art: { id: 'cut-jar', rotate: 3 },
    actions: btn('Higher Rewards', '/rewards/', { variant: 'ghost', icon: 'arrow' }),
  })}${band({ tone: 'bone', id: 'rs-hr-terms', label: 'Terms and conditions', body: `<article class="rs-legal">${parts}</article>`, narrow: true, z: 6, sheet: true })}`;
  return { path: '/rewards/terms/', html: page({ ctx, path: '/rewards/terms/', bodyClass: 'page-resources page-legal', title: 'Higher Rewards Terms & Conditions', description: 'Higher Rewards Loyalty Program terms and conditions: how to sign up, accrue and redeem points.', body }) };
}

// ================================================================= render
export function render(ctx) {
  const sts = states(ctx);
  const out = [
    aboutPage(ctx), contactPage(ctx), careersPage(ctx), communityPage(ctx), mediaPage(ctx), crpPage(ctx), eulaPage(ctx), hrTermsPage(ctx),
    productsHub(ctx), ...data().products.guides.map((g) => guidePage(ctx, g)),
    guidesPage(ctx), medHub(ctx), ...sts.map((st) => medState(ctx, st)), lawsHub(ctx), ...sts.map((st) => lawPage(ctx, st)),
    patientGuide(ctx), faqPage(ctx),
  ];
  if (blogFallbacks.size) console.log(`resources: blog/index.json has no path for ${[...blogFallbacks].join(', ')}: linked /blog/`);
  return out;
}
