// extract.mjs - audit/raw (Wix SSR) -> src/content/pages/<key>.json + src/content/site.json + audit/extract-report.json.
//   node tools/extract.mjs [--min 0.95] [--control]
// Exit 1 when a page's text recall is below --min and the page is not listed in ALLOW_LOW with a reason.
// --control: positive control for the recall check (drops one paragraph from a copy of a model; must fall below --min).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/lib/site.mjs';
import { PageExtractor, ORIGIN, linkOut, isExternal, recall, mainText, findAll, findFirst, byId, textOf, squash, isEl, hasCls, elChildren, htmlText, CHROME_STRINGS } from '../src/lib/extract.mjs';
import { stableJson } from '../src/lib/html-util.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const MIN = Number(args.min || 0.95);
const crawl = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/crawl.json'), 'utf8'));
const OUTDIR = path.join(ROOT, 'src/content/pages');
fs.mkdirSync(OUTDIR, { recursive: true });
for (const f of fs.readdirSync(OUTDIR)) if (f.endsWith('.json')) fs.rmSync(path.join(OUTDIR, f));

// pages allowed below the recall threshold, with the reason (filled after inspection)
const ALLOW_LOW = {};

const STATES = { CO: 'Colorado', IL: 'Illinois', MD: 'Maryland', MS: 'Mississippi', NY: 'New York', OK: 'Oklahoma', SD: 'South Dakota', CA: 'California', NM: 'New Mexico' };
const HUBS = { '/illinois': 'IL', '/maryland': 'MD', '/mississippi': 'MS', '/oklahoma': 'OK' };
const PATH_STATE = [[/^\/(colorado|co-)|coloradorewards/, 'CO'], [/illinois/, 'IL'], [/maryland|^\/md-/, 'MD'], [/mississippi/, 'MS'], [/oklahoma|^\/ok-/, 'OK'], [/new-?york|buffalo/, 'NY']];
const BLOG_CHROME = ['Featured Posts', 'Recent Posts', 'Archive', 'Search By Tags', 'Follow Us'];
const PRODUCTS = new Set(['/products', '/cbd', '/vapes', '/edibles', '/topicals', '/concentrates']);
const LEGAL = new Set(['/eula', '/consent', '/age', '/hr-tc', '/co-delivery-tc', '/gratify-rewards-terms-conditions', '/privacy']);
const DAY_RE = /^((?:MON|TUE|WED|THU|FRI|SAT|SUN)[A-Z]*(?:\s*[-–&]\s*(?:MON|TUE|WED|THU|FRI|SAT|SUN)[A-Z]*)?|EVERY\s?DAY|DAILY)\s*:?\s*(.*)$/i;
const PHONE_RE = /\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const FULL_STATE = { OKLAHOMA: 'OK', ILLINOIS: 'IL', MISSISSIPPI: 'MS', MARYLAND: 'MD', COLORADO: 'CO', 'SOUTH DAKOTA': 'SD', 'NEW YORK': 'NY' };
const ADDR_FULL_RE = /\b(OKLAHOMA|ILLINOIS|MISSISSIPPI|MARYLAND|COLORADO|SOUTH DAKOTA|NEW YORK)\.?,?\s+\d{5}\b/i;
const ADDR_RE = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\.?,?\s+\d{5}\b/;

const allBlocks = (bs) => { const out = []; const rec = (b) => { out.push(b); for (const k of ['cols', 'items', 'slides']) if (Array.isArray(b[k])) for (const x of b[k]) if (x && Array.isArray(x.blocks)) x.blocks.forEach(rec); if (Array.isArray(b.blocks)) b.blocks.forEach(rec); }; bs.forEach(rec); return out; };
const paras = (html) => String(html || '').split(/<\/p>\s*/).map((s) => s.replace(/^\s*<p>/, '')).filter((s) => htmlText(s));

function storeFrom(model) {
  const blocks = model.sections.flatMap((s) => allBlocks(s.blocks));
  const lines = [];
  for (const b of blocks) {
    if (b.t === 'rich' || b.t === 'html') for (const p of paras(b.html)) lines.push({ html: p, text: htmlText(p) });
    if (b.t === 'list') for (const it of b.items) lines.push({ html: it, text: htmlText(it) });
  }
  const hours = [];
  const address = [];
  let phone = '';
  const notes = [];
  let inHours = false;
  for (const l of lines) {
    const t = l.text;
    if (/^hours:?$/i.test(t)) { inHours = true; continue; }
    const m = DAY_RE.exec(t);
    if (m && m[2] && /\d|closed/i.test(m[2])) { hours.push({ day: m[1].trim().replace(/:$/, ''), time: m[2].trim() }); continue; }
    if (!address.length && (ADDR_RE.test(t) || ADDR_FULL_RE.test(t)) && t.length < 120) { address.push(t); continue; }
    if (!phone && PHONE_RE.test(t) && t.replace(PHONE_RE, '').replace(/[^a-z]/gi, '').length < 12) { phone = PHONE_RE.exec(t)[0]; continue; }
    if (inHours && t.length < 60) { notes.push(l.html); continue; }
    notes.push(l.html);
  }
  const links = blocks.filter((b) => b.t === 'button' && b.href).map((b) => ({ text: b.text, href: b.href }));
  const image = (blocks.find((b) => b.t === 'image' && b.role !== 'background') || {}).src || null;
  const map = blocks.find((b) => b.t === 'embed' && b.kind === 'map') ? { kind: 'map', src: '' } : null;
  const nameH = blocks.find((b) => b.t === 'heading' && /star\s?buds/i.test(htmlText(b.html)));
  return { name: nameH ? htmlText(nameH.html) : model.h1, address, phone, tel: phone ? '+1' + phone.replace(/\D/g, '').slice(-10) : '', hours, notes: notes.filter((n) => htmlText(n) !== model.h1), links, image, map };
}

function kindOf(p, model, ex) {
  if (p === '/') return 'home';
  if (/^\/single-post\//.test(p)) return 'post';
  if (p === '/blog' || /^\/blog\/page\/\d+$/.test(p)) return 'blog';
  if (/^\/blog\/(categories|tags|archive|hashtags)\//.test(p)) return 'blog-category';
  if (HUBS[p]) return 'state';
  if (p === '/locations') return 'locations';
  if (/deals$/.test(p)) return 'deals';
  if (LEGAL.has(p)) return 'legal';
  if (/rewards$/.test(p)) return 'rewards';
  if (p === '/order-online') return 'order';
  if (/delivery$/.test(p)) return 'delivery';
  if (p === '/contact') return 'contact';
  const txt = model.sections.map((s) => allBlocks(s.blocks).map((b) => htmlText(b.html || b.text || '')).join(' ')).join(' ');
  if (/\bHOURS\b/.test(txt) && /MONDAY|SUNDAY|DAILY/i.test(txt) && PHONE_RE.test(txt)) return 'store';
  if (PRODUCTS.has(p)) return 'products';
  return 'page';
}

function stateOf(p, kind, model) {
  if (HUBS[p]) return HUBS[p];
  if (kind === 'store' && model.store) { for (const a of model.store.address) { const m = /\b([A-Z]{2})\.?,?\s+\d{5}\b/.exec(a); if (m) return m[1]; const f = ADDR_FULL_RE.exec(a); if (f) return FULL_STATE[f[1].toUpperCase()]; } }
  for (const [re, c] of PATH_STATE) if (re.test(p)) return c;
  return null;
}

// ---------- pages ----------
const report = { generated: new Date().toISOString(), min: MIN, pages: [], dropped: {}, images: {} };
const models = [];
const imageRefs = new Map(); // original -> { aliases:Set, pages:Set }
const seenFiles = new Map();
const recs = crawl.records.filter((r) => r.status === 200 && r.file);
let firstEx = null;
for (const rec of recs) {
  const u = new URL(rec.url);
  const p = u.pathname.replace(/\/+$/, '') || '/';
  const key = path.basename(rec.file, '.html');
  if (seenFiles.has(rec.file)) {
    // same raw file under a second URL (case variant): a redirect model to the first path (identical page)
    const first = seenFiles.get(rec.file);
    models.push({ path: p, url: rec.url, key: key + '--' + p.split('/').pop().toLowerCase() + '-case', kind: 'redirect', state: null, title: '', h1: '', redirect: { to: ORIGIN + first, status: 301, offOrigin: false, note: 'case variant of ' + first + ' (the live site answers 200 with the same page)' } });
    continue;
  }
  seenFiles.set(rec.file, p);
  const html = fs.readFileSync(path.join(ROOT, rec.file), 'utf8');
  const ex = new PageExtractor(html, rec);
  if (!firstEx) firstEx = ex;
  const head = ex.head();
  const main = ex.main();
  const model = { path: p, url: rec.url, key, kind: null, state: null, title: head.title, h1: '', head, crumbs: [], sections: [] };
  let skip = null;
  let rawSkip = null;
  if (/^\/single-post\//.test(p)) {
    const po = ex.post();
    model.post = po.post;
    model.h1 = po.title;
    // the article goes to post.blocks; the rest of main (blog widgets) is chrome
    const art = findFirst(main, (n) => n.attrs['data-hook'] === 'post-description');
    const postRoot = findFirst(main, (n) => n.attrs['data-hook'] === 'post-page-root') || findFirst(main, (n) => n.attrs['data-hook'] === 'post-page');
    skip = (n) => (n === postRoot ? 'post-article (kept in post.blocks)' : (n.attrs['data-hook'] || '') === 'post-list-root' || (n.attrs['data-hook'] || '') === 'post-list-item' ? 'blog widget: post list (Recent/Featured Posts)' : null);
    // recall denominator: the article only (title, meta, body); everything else on the post page is the blog's chrome
    rawSkip = (n) => { if (!postRoot) return null; if (n === postRoot || isAnc(n, postRoot) || isAnc(postRoot, n)) return null; return 'outside article'; };
    model.sections = ex.sections(main, (n) => (n === postRoot ? 'post-article (kept in post.blocks)' : (n.attrs['data-hook'] || '') === 'post-list-root' ? 'blog widget: post list (Recent/Featured Posts)' : null));
    void art;
  } else if (p === '/blog' || /^\/blog\//.test(p)) {
    model.posts = ex.posts();
    const listSkip = (n) => { const h = n.attrs['data-hook'] || ''; return h === 'post-list-root' || h === 'feed-page-root' || h === 'post-list-item' || h === 'item-link-wrapper' || h === 'post-list-pro-gallery-container' ? 'blog listing (kept in posts[])' : null; };
    model.sections = ex.sections(main, listSkip);
  } else {
    model.sections = ex.sections(main);
  }
  // h1: the live h1, else the first heading
  if (!model.h1) {
    const h1 = findFirst(main, (n) => n.tag === 'h1');
    if (h1) model.h1 = squash(textOf(h1));
    else { const hb = model.sections.flatMap((s) => allBlocks(s.blocks)).find((b) => b.t === 'heading'); model.h1 = hb ? htmlText(hb.html) : ''; }
  }
  // blog sidebar widget headings (Featured Posts / Recent Posts / Archive / Search By Tags) and the divider after each:
  // chrome on blog pages (BUILD-CONTRACT 4.3); the widgets themselves are already dropped by data-hook
  let blogChromeLines = null;
  if (/^\/(single-post|blog)(\/|$)/.test(p)) {
    blogChromeLines = BLOG_CHROME;
    for (const s of model.sections) {
      const keep = [];
      for (let i = 0; i < s.blocks.length; i++) {
        const b = s.blocks[i];
        if (b.t === 'heading' && BLOG_CHROME.includes(htmlText(b.html))) {
          report.droppedBlog = (report.droppedBlog || 0) + 1;
          if (s.blocks[i + 1] && s.blocks[i + 1].t === 'divider') i++;
          // "Follow Us": the Wix template's own social links (facebook.com/wix, twitter.com/wix, plus.google.com), no text
          if (htmlText(b.html) === 'Follow Us' && s.blocks[i + 1] && s.blocks[i + 1].t === 'list' && s.blocks[i + 1].items.every((it) => !htmlText(it))) i++;
          continue;
        }
        keep.push(b);
      }
      s.blocks = keep;
    }
    model.sections = model.sections.filter((s) => s.blocks.length || s.bg);
  }
  model.kind = kindOf(p, model, ex);
  if (model.kind === 'store') model.store = storeFrom(model);
  model.state = stateOf(p, model.kind, model);
  // crumbs
  const crumbs = [{ name: 'Home', path: '/' }];
  if (model.kind === 'post' || model.kind === 'blog-category' || (model.kind === 'blog' && p !== '/blog')) crumbs.push({ name: 'Blog', path: '/blog' });
  if (model.kind === 'store' && model.state) { const hub = Object.entries(HUBS).find(([, c]) => c === model.state); crumbs.push(hub ? { name: STATES[model.state], path: hub[0] } : { name: 'Locations', path: '/locations' }); }
  if (model.kind === 'state') crumbs.push({ name: 'Locations', path: '/locations' });
  if (p !== '/') crumbs.push({ name: model.h1 || head.title, path: p });
  model.crumbs = crumbs;
  // recall
  let rawText = mainText(ex, main, rawSkip);
  if (blogChromeLines) rawText = rawText.split('\n').filter((l) => !blogChromeLines.includes(squash(l))).join('\n');
  const rc = recall(rawText, model);
  const imgs = [...ex.images.keys()];
  for (const [o, al] of ex.images) { const r = imageRefs.get(o) || { aliases: new Set(), pages: new Set() }; for (const a of al) r.aliases.add(a); r.pages.add(p); imageRefs.set(o, r); }
  for (const [k, v] of ex.dropped) { const d = report.dropped[k] || { count: 0, pages: 0, sample: v.sample }; d.count += v.count; d.pages++; report.dropped[k] = d; }
  const blocksN = model.sections.reduce((a, s) => a + allBlocks(s.blocks).length, 0) + (model.post ? allBlocks(model.post.blocks).length : 0);
  report.pages.push({ path: p, key, kind: model.kind, recall: Number(rc.recall.toFixed(4)), words: rc.words, blocks: blocksN, images: imgs.length, missing: rc.missing.slice(0, 30) });
  models.push(model);
}
function isAnc(a, b) { for (let x = b && b.parent; x; x = x.parent) if (x === a) return true; return false; }

// blog listing dates from the post models
const postDate = new Map(models.filter((m) => m.kind === 'post').map((m) => [m.path.toLowerCase(), m.post.date]));
for (const m of models) if (m.posts) for (const x of m.posts) x.date = postDate.get(String(x.path).replace(/\/$/, '').toLowerCase()) || null;

// ---------- redirect models ----------
for (const r of crawl.records.filter((x) => x.chain && x.chain.length)) {
  const u = new URL(r.url);
  const p = u.pathname.replace(/\/+$/, '') || '/';
  const hop = r.chain[0];
  const to = hop.to;
  const off = !/^https?:\/\/(www\.)?starbuds\.us(\/|$)/i.test(to);
  let state = null;
  if (/starbudscolorado\.com/.test(to)) state = 'CO';
  else for (const [re, c] of PATH_STATE) if (re.test(p)) state = c;
  const key = 'redirect__' + p.replace(/^\//, '').replace(/\//g, '__').toLowerCase();
  const m = { path: p, url: r.url, key, kind: 'redirect', state, title: '', h1: '', redirect: { to, status: hop.status || r.status, offOrigin: off } };
  if (r.status === 404) m.redirect.finalStatus = 404;
  models.push(m);
}

// ---------- site.json ----------
const homeHtml = fs.readFileSync(path.join(ROOT, 'audit/raw/index.html'), 'utf8');
const hx = new PageExtractor(homeHtml, {});
const header = byId(hx.root, 'SITE_HEADER');
const footer = byId(hx.root, 'SITE_FOOTER');
const nav = [];
const logoImg = findFirst(header, (n) => n.tag === 'img');
const orderBtn = findAll(header, (n) => n.attrs['data-testid'] === 'linkElement' && n.tag === 'a' && !findFirst(n, (x) => x.tag === 'img') && !findFirst(n, (x) => x.tag === 'p') && !(n.parent && n.parent.tag === 'li'));
for (const a of orderBtn) nav.push({ text: squash(textOf(a)), href: linkOut(a.attrs.href), cta: true });
const menu = findFirst(header, (n) => n.attrs.id && /itemsContainer$/.test(n.attrs.id));
const droppedNav = [];
for (const li of elChildren(menu).filter((x) => x.tag === 'li')) {
  const a = elChildren(li).find((x) => x.attrs['data-testid'] === 'linkElement');
  const text = a ? squash(textOf(a)) : '';
  if (!a || !a.attrs.href) { droppedNav.push(text); continue; } // the Wix overflow "More" (empty)
  const sub = elChildren(li).find((x) => x.tag === 'ul');
  const item = { text, href: linkOut(a.attrs.href) };
  if (sub) item.children = elChildren(sub).map((l) => findFirst(l, (x) => x.tag === 'a')).filter(Boolean).map((x) => ({ text: squash(textOf(x)), href: linkOut(x.attrs.href), external: isExternal(linkOut(x.attrs.href)) || undefined }));
  nav.push(item);
}
const flinks = [];
let copyright = '';
const legal = [];
for (const a of findAll(footer, (n) => n.tag === 'a')) {
  const text = squash(textOf(a));
  if (!text || CHROME_STRINGS.includes(text)) continue;
  if (/privacy|terms/i.test(text)) legal.push({ text, href: linkOut(a.attrs.href) }); else flinks.push({ text, href: linkOut(a.attrs.href) });
}
for (const r of findAll(footer, (n) => n.attrs['data-testid'] === 'richTextElement')) for (const p of findAll(r, (n) => n.tag === 'p')) { const t = squash(textOf(p)); if (/©|all rights reserved/i.test(t)) copyright = t; }
const footLogo = findFirst(footer, (n) => n.tag === 'img');
const wo = (img) => { const u = String(img.attrs.src).match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/); return u ? u[1] : null; };
for (const img of [logoImg, footLogo].filter(Boolean)) { const o = wo(img); if (o) { const r = imageRefs.get(o) || { aliases: new Set(), pages: new Set() }; r.aliases.add(img.attrs.src); for (const s of String(img.attrs.srcset || '').split(',')) if (s.trim()) r.aliases.add(s.trim().split(/\s+/)[0]); r.pages.add('site.json'); imageRefs.set(o, r); } }

const storeObj = (m) => ({ name: m.store.name, path: m.path, city: m.path.slice(1).split('-').map((w) => (w === 'cbd' ? 'CBD' : w[0].toUpperCase() + w.slice(1))).join(' '), address: m.store.address, phone: m.store.phone, tel: m.store.tel, hours: m.store.hours, state: m.state });
const stores = models.filter((m) => m.kind === 'store').map(storeObj).sort((a, b) => (a.state || '').localeCompare(b.state || '') || a.name.localeCompare(b.name));
// stores listed on the state hubs (cards: NAME / street / city, ST zip / phone, then a button); a hub store with its own
// store page is replaced by that page's object (it carries the hours)
for (const hub of models.filter((m) => m.kind === 'state')) {
  const lines = [];
  for (const s of hub.sections) for (const b of allBlocks(s.blocks)) {
    if (b.t === 'heading' || b.t === 'rich' || b.t === 'html') for (const part of String(b.html).split(/<br>|<\/p>\s*<p>|<\/p>|<p>/)) { const t = htmlText(part); if (t) lines.push({ t }); }
    if (b.t === 'button' && b.href) lines.push({ btn: b });
  }
  let cur = null;
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.btn) { if (cur && !cur.href) cur.href = l.btn.href; continue; }
    if (ADDR_RE.test(l.t) && l.t.length < 80) {
      // walk back to the name line (no digits) collecting the street lines
      const addr = [l.t];
      let j = i - 1;
      while (j >= 0 && lines[j].t && /\d/.test(lines[j].t) && !PHONE_RE.test(lines[j].t) && addr.length < 3) { addr.unshift(lines[j].t); j--; }
      const name = j >= 0 && lines[j].t && !/\d/.test(lines[j].t) ? lines[j].t : '';
      const ph = lines.slice(i + 1, i + 3).find((x) => x.t && PHONE_RE.test(x.t));
      cur = { name, address: addr, phone: ph ? PHONE_RE.exec(ph.t)[0] : '', href: null };
      found.push(cur);
    }
  }
  for (const f of found) {
    const city = f.name.replace(/^Star Buds( Marijuana Dispensary)?\s*/i, '').trim();
    const digits = (x) => String(x || '').replace(/\D/g, '').slice(-10);
    const page = stores.find((s) => f.phone && digits(s.phone) === digits(f.phone) && (!s.state || s.state === hub.state));
    if (page && !page.state) page.state = hub.state;
    if (page) { page.listedOn = hub.path; page.shop = f.href || undefined; continue; }
    const href = f.href || null;
    stores.push({ name: f.name, path: href && !isExternal(href) ? href : null, city: city.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), address: f.address, phone: f.phone, tel: f.phone ? '+1' + f.phone.replace(/\D/g, '').slice(-10) : '', hours: [], state: hub.state, offOrigin: href && isExternal(href) ? href : undefined, listedOn: hub.path });
  }
}
stores.sort((a, b) => (a.state || '').localeCompare(b.state || '') || a.name.localeCompare(b.name));
const locNav = nav.find((n) => /^LOCATIONS$/i.test(n.text));
const states = [];
for (const c of (locNav && locNav.children) || []) {
  const code = Object.entries(STATES).find(([, v]) => v.toUpperCase() === c.text.toUpperCase());
  const cc = code ? code[0] : null;
  const st = { code: cc, name: code ? code[1] : c.text, path: c.href, stores: stores.filter((s) => s.state === cc) };
  if (isExternal(c.href)) st.offOrigin = c.href;
  states.push(st);
}
for (const s of stores) if (!states.some((st) => st.code === s.state)) states.push({ code: s.state, name: STATES[s.state] || s.state, path: null, stores: stores.filter((x) => x.state === s.state) });
const site = {
  name: 'Star Buds', origin: ORIGIN,
  logo: { src: wo(logoImg), alt: squash(logoImg.attrs.alt || ''), footer: footLogo ? wo(footLogo) : null, footerAlt: footLogo ? squash(footLogo.attrs.alt || '') : '' },
  nav,
  footer: { links: flinks, copyright, legal, social: [] },
  ageGate: { title: 'You must be over 21 years old to visit this site.', text: 'Please verify your age by entering your birthday below.', fields: ['MM', 'DD', 'YYYY'], button: 'Enter', note: 'By entering our website, you also consent to our use of essential cookies. We do not collect or sell any personal data.', source: 'live render (lightbox is client-side; its copy is not in the SSR harvest)' },
  states, stores,
};
report.nav = { droppedOverflowItems: droppedNav };

// ---------- write ----------
for (const m of models) fs.writeFileSync(path.join(OUTDIR, m.key + '.json'), stableJson(m));
fs.writeFileSync(path.join(ROOT, 'src/content/site.json'), stableJson(site));
for (const [o, r] of [...imageRefs].sort()) report.images[o] = { aliases: [...r.aliases].sort(), pages: [...r.pages].sort() };
const rs = report.pages.map((x) => x.recall).sort((a, b) => a - b);
report.summary = { pages: report.pages.length, redirects: models.filter((m) => m.kind === 'redirect').length, min: rs[0], median: rs[Math.floor(rs.length / 2)], below: report.pages.filter((x) => x.recall < MIN).map((x) => x.path), images: imageRefs.size, kinds: models.reduce((a, m) => ((a[m.kind] = (a[m.kind] || 0) + 1), a), {}) };
fs.writeFileSync(path.join(ROOT, 'audit/extract-report.json'), JSON.stringify(report, null, 1));
console.log('extract: models', models.length, '| pages', report.pages.length, '| redirects', report.summary.redirects, '| images', imageRefs.size, '| recall min', rs[0], 'median', report.summary.median);
console.log('kinds', JSON.stringify(report.summary.kinds));
const bad = report.pages.filter((x) => x.recall < MIN && !ALLOW_LOW[x.path]);
for (const b of bad.slice(0, 40)) console.log('  LOW', b.recall, b.path, b.missing.slice(0, 12).join(' '));

// ---------- positive control ----------
if (args.control) {
  const m = JSON.parse(JSON.stringify(models.find((x) => x.path === '/about') || models.find((x) => x.kind === 'page')));
  const pr = report.pages.find((x) => x.path === m.path);
  const ex2 = new PageExtractor(fs.readFileSync(path.join(ROOT, 'audit/raw', m.key + '.html'), 'utf8'), {});
  const raw = mainText(ex2, ex2.main());
  const before = recall(raw, m).recall;
  // drop the longest rich block (one paragraph group)
  let best = null;
  for (const s of m.sections) for (const b of allBlocks(s.blocks)) if (b.t === 'rich' && (!best || htmlText(b.html).length > htmlText(best.html).length)) best = b;
  const ps = paras(best.html);
  const longest = ps.sort((a, b) => htmlText(b).length - htmlText(a).length)[0];
  best.html = paras(best.html).filter((x) => x !== longest).map((x) => '<p>' + x + '</p>').join('\n');
  const after = recall(raw, m).recall;
  console.log('CONTROL', m.path, 'recall before', before.toFixed(4), 'after dropping one paragraph (' + htmlText(longest).split(' ').length + ' words)', after.toFixed(4), after < MIN ? 'FIRES (below ' + MIN + ')' : 'DOES NOT FIRE', '| report value', pr && pr.recall);
}
if (bad.length) { console.log('FAIL:', bad.length, 'page(s) below', MIN); process.exitCode = 1; }
