// blog.mjs - BLOG-R3: the Star Buds blog in the revision 3 "Starlight" look (docs/REVISION-3.md); the structure is
// revision 2's (docs/REVISION-2.md, D1/D2/D7).
//   /blog/                    hub: hero (h1), category pills with counts, featured post, latest articles, pagination,
//                             recommended resources, store band
//   /blog/p/<n>/              hub pages 2..N (12 articles per page)
//   /blog/<cat>/ (+ p/<n>/)   category hubs, 12 per page (Recipes = /blog/recipes/)
//   /blog/<cat>/<slug>/       articles: a night header (breadcrumbs, category pill, date, light headline), the post
//                             body (Star Buds' words verbatim) on a pearl reading sheet, related (3 from the same
//                             category), store band
// Content: src/content/blog/*.json, written by tools/port-blog.mjs from the starbuds.us capture. The photos are Star
// Buds' own (assets/photos/blog/, no data-ai). Classes are prefixed bl-; styles in src/styles/blog.css. The star field
// behind each section is this file's own CSS-only sky (.bl-sky). Shared pieces come from FOUNDATION (hubHero,
// articleCard, crumbs, patch, btn, glass, img, cutout). No page script.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { page, esc, cx, icon, btn, img, glass, patch, reveal, cutout, crumbs, hubHero, articleCard } from './shell.mjs';

const DIR = path.join(ROOT, 'src/content/blog');
const PER = 12;
/** the floating product cut-out of each hub and article header (revision 3: cut-* only; the patch and flash art is retired) */
const ART = { blog: 'cut-bud', 'cannabis-101': 'cut-leaf', 'health-and-lifestyle': 'cut-tincture', 'news-and-culture': 'cut-preroll', recipes: 'cut-gummies', resources: 'cut-vape', 'shopping-and-reviews': 'cut-jar' };
const EXT = /^https?:\/\//i;

// ---------------------------------------------------------------- data
function load() {
  const f = path.join(DIR, 'index.json');
  if (!fs.existsSync(f)) return null;
  const index = JSON.parse(fs.readFileSync(f, 'utf8'));
  const posts = (index.posts || []).map((p) => {
    const file = path.join(DIR, p.slug + '.json');
    if (!fs.existsSync(file)) throw new Error('blog: index.json lists ' + p.slug + ' but src/content/blog/' + p.slug + '.json is missing (run node tools/port-blog.mjs)');
    return { ...p, rec: JSON.parse(fs.readFileSync(file, 'utf8')) };
  });
  return { index, posts, cats: (index.categories || []).filter((c) => c.count > 0) };
}

// ---------------------------------------------------------------- small helpers
const plain = (html) => String(html || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
/** mostly upper-case text (such titles and headings get a smaller, tracked size) */
function capsy(text) {
  const letters = String(text).replace(/[^A-Za-z]/g, '');
  if (letters.length < 4) return false;
  return letters.replace(/[^A-Z]/g, '').length / letters.length > 0.6;
}
/** external links in the post HTML open in a new tab */
const links = (html) => String(html || '').replace(/<a href="([^"]*)">/g, (m, h) => (EXT.test(h.replace(/&amp;/g, '&')) ? `<a href="${h}" target="_blank" rel="noopener">` : m));
const clip = (s, n) => { s = String(s || ''); if (s.length <= n) return s; return s.slice(0, n).replace(/\s+\S*$/, '').replace(/[\s,;:.\-–—…]+$/, '') + '…'; };
const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

/** a Star Buds photo with its srcset (every candidate must exist: a missing one fails the build like img() does) */
function photo(im, { cls, sizes = '100vw', eager = false, alt } = {}) {
  const set = Array.isArray(im.srcset) ? im.srcset : String(im.srcset || '').split(',').map((c) => c.trim()).filter(Boolean).map((c) => { const [src, w] = c.split(/\s+/); return { src, w: parseInt(w, 10) }; });
  for (const c of set) if (!fs.existsSync(path.join(ROOT, c.src.replace(/^\//, '')))) throw new Error('missing image: ' + c.src);
  const extra = set.length > 1 ? { srcset: set.map((c) => `${c.src} ${c.w}w`).join(', '), sizes } : {};
  return img({ src: im.src, w: im.w, h: im.h, alt: im.alt || '' }, { cls, eager, alt: alt ?? (im.alt || ''), attrs: extra });
}

/** front-plane art: a floating product cut-out (decorative) */
function art(id, cls) {
  if (!id) return '';
  return cutout(id, { cls, depth: 0.05, float: 'slow', sizes: '(max-width: 700px) 30vw, 240px' });
}

/** a CSS-only star field with soft aurora washes (decorative; .bl-sky in blog.css) */
const sky = (cls) => `<span class="${cx('bl-sky', cls)}" aria-hidden="true"></span>`;

/** a card for a listing (FOUNDATION's articleCard); all-caps titles get a smaller, tracked variant */
const card = (p, o = {}) => `<li class="bl-grid__item">${articleCard({ title: p.title, href: p.href, date: p.date, category: p.category, categoryLabel: p.categoryLabel, excerpt: p.excerpt, image: p.image ? { src: p.image.src, w: p.image.w, h: p.image.h, alt: '' } : null }, { level: o.level || 3, cls: cx('bl-card', capsy(p.title) && 'bl-card--caps') })}</li>`;
const grid = (list, o = {}) => `<ul class="${cx('bl-grid', o.cls)}" role="list" data-stagger>${list.map((p) => card(p, o)).join('')}</ul>`;

// ---------------------------------------------------------------- shared sections
function catNav(data, current, firstPage) {
  const items = [{ slug: null, label: 'All', href: '/blog/', count: data.posts.length }, ...data.cats];
  return `<nav class="bl-cats" aria-label="Blog categories"><ul class="bl-cats__list" role="list">${items.map((c) => {
    const on = (c.slug || null) === current;
    return `<li><a class="${cx('bl-cat', on && 'is-current')}" href="${esc(c.href)}"${on ? ` aria-current="${firstPage ? 'page' : 'true'}"` : ''}><span class="bl-cat__label">${esc(c.label)}</span><span class="bl-cat__n" aria-label="${c.count} articles">${c.count}</span></a></li>`;
  }).join('')}</ul></nav>`;
}

function pager(base, n, total) {
  if (total < 2) return '';
  const href = (k) => (k === 1 ? base : `${base}p/${k}/`);
  const step = (k, rel, label) => (k >= 1 && k <= total
    ? `<a class="bl-pager__step bl-pager__step--${rel}" href="${href(k)}" rel="${rel}">${rel === 'prev' ? icon('arrow', 'bl-pager__back') : ''}<span>${label}</span>${rel === 'next' ? icon('arrow') : ''}</a>`
    : `<span class="bl-pager__step is-off" aria-hidden="true"></span>`);
  const nums = Array.from({ length: total }, (_, i) => i + 1).map((k) => `<li>${k === n ? `<span class="bl-pager__num is-current" aria-current="page">${k}</span>` : `<a class="bl-pager__num" href="${href(k)}" aria-label="Page ${k}">${k}</a>`}</li>`).join('');
  return `<nav class="bl-pager" aria-label="Pagination">${step(n - 1, 'prev', 'Previous')}<ol class="bl-pager__nums" role="list">${nums}</ol>${step(n + 1, 'next', 'Next')}</nav>`;
}

/** the store call to action closing every blog page: an aurora band */
function storeStrip(ctx) {
  const states = ctx.storesByState.map((g) => g.state.name);
  return `
<section class="section on-dark bl-cta" aria-labelledby="bl-cta-title">
  <div class="wrap">
    <div class="bl-cta__band">
      ${sky('bl-sky--band')}
      <div class="bl-cta__copy"${reveal('up')}>
        <p class="bl-cta__eyebrow">${patch('Star Buds stores', { tone: 'gold', size: 'sm', icon: 'pin' })}</p>
        <h2 id="bl-cta-title" class="bl-cta__title">Find your store</h2>
        ${states.length ? `<p class="bl-cta__text">Star Buds stores in ${esc(listJoin(states))}.</p>` : ''}
      </div>
      <div class="bl-cta__actions"${reveal('up', 1)}>${btn('Find your store', '/dispensaries/', { variant: 'light', size: 'lg', icon: 'pin' })}</div>
    </div>
  </div>
</section>`;
}

function featured(p) {
  const r = p.rec;
  const im = r.hero || (p.image ? { src: p.image.src, w: p.image.w, h: p.image.h, alt: '', srcset: p.image.srcset } : null);
  const caps = capsy(p.title);
  return `
    <article class="${cx('bl-feature', !im && 'bl-feature--plain')}" aria-labelledby="bl-feature-title"${reveal('up')}>
      ${im ? `<div class="bl-feature__media">${photo(im, { cls: 'bl-feature__img', sizes: '(max-width: 899px) 92vw, 760px', eager: true, alt: '' })}</div>` : ''}
      ${glass(`
        <p class="bl-feature__kicker">${patch('Featured', { tone: 'gold', size: 'sm', icon: 'star' })}${patch(p.categoryLabel, { tone: 'green', size: 'sm' })}</p>
        <h2 id="bl-feature-title" class="${cx('bl-feature__title', caps && 'bl-feature__title--caps')}"><a class="bl-feature__link" href="${esc(p.href)}">${esc(p.title)}</a></h2>
        <p class="bl-feature__date"><time datetime="${esc(p.date)}">${esc(p.dateText)}</time>${r.readTime ? `<span aria-hidden="true">${icon('star', 'bl-dot')}</span><span>${esc(r.readTime)}</span>` : ''}</p>
        ${p.excerpt ? `<p class="bl-feature__excerpt">${esc(p.excerpt)}</p>` : ''}
        <span class="bl-feature__more" aria-hidden="true">Read the article${icon('arrow')}</span>`, { cls: 'bl-feature__panel' })}
    </article>`;
}

// ---------------------------------------------------------------- listing pages
function hubPage(ctx, data, n, pages) {
  const path0 = n === 1 ? '/blog/' : `/blog/p/${n}/`;
  const start = n === 1 ? 1 : 1 + PER + (n - 2) * PER; // page 1: the featured post + 12; then 12 per page
  const list = data.posts.slice(start, start + PER);
  const head = hubHero({
    eyebrow: 'The Star Buds blog',
    title: 'Blog',
    intro: n === 1
      ? [`Guides, news, recipes and reviews from Star Buds: ${data.posts.length} articles in ${data.cats.length} categories, newest first.`]
      : [`Page ${n} of ${pages}: older articles from Star Buds, newest first.`],
    art: ART.blog,
    cls: 'bl-hub',
    crumbs: n === 1 ? [{ label: 'Blog' }] : [{ label: 'Blog', href: '/blog/' }, { label: `Page ${n}` }],
  });
  // recommended resources: the newest Resources articles that page 1 does not already show
  const shown = new Set(data.posts.slice(0, 1 + PER).map((p) => p.slug));
  const recs = n === 1 ? data.posts.filter((p) => p.category === 'resources' && !shown.has(p.slug)).slice(0, 3) : [];
  const body = `${head}
<section class="section bl-feed" aria-labelledby="bl-feed-title">
  <div class="plane-back">${sky()}</div>
  <div class="wrap">
    ${catNav(data, null, n === 1)}
    ${n === 1 && data.posts[0] ? featured(data.posts[0]) : ''}
    <div class="bl-feed__head">
      <h2 id="bl-feed-title" class="bl-feed__title">${n === 1 ? 'Latest articles' : `Articles, page ${n}`}</h2>
      <p class="bl-feed__count">Page ${n} of ${pages}</p>
    </div>
    ${grid(list)}
    ${pager('/blog/', n, pages)}
  </div>
</section>${recs.length ? `
<section class="section bl-recs" aria-labelledby="bl-recs-title">
  <div class="plane-back">${sky('bl-sky--soft')}</div>
  <div class="wrap">
    <div class="bl-feed__head">
      <h2 id="bl-recs-title" class="bl-feed__title">Recommended resources</h2>
      <a class="bl-more" href="/blog/resources/">All resources${icon('arrow')}</a>
    </div>
    ${grid(recs)}
  </div>
</section>` : ''}
${storeStrip(ctx)}`;
  return {
    path: path0,
    html: page({ ctx, path: path0, title: n === 1 ? 'Blog' : `Blog, page ${n}`, description: n === 1 ? `The Star Buds blog: ${data.posts.length} articles on cannabis basics, health and lifestyle, news and culture, recipes, resources and shopping.` : `The Star Buds blog, page ${n} of ${pages}.`, bodyClass: 'page-blog', body }),
  };
}

function categoryPage(ctx, data, cat, n, pages, list) {
  const base = `/blog/${cat.slug}/`;
  const path0 = n === 1 ? base : `${base}p/${n}/`;
  const head = hubHero({
    eyebrow: 'Blog',
    title: cat.label,
    intro: n === 1 ? [cat.blurb, `${cat.count} ${cat.count === 1 ? 'article' : 'articles'}, newest first.`] : [cat.blurb, `Page ${n} of ${pages}.`],
    art: ART[cat.slug],
    cls: 'bl-hub',
    crumbs: n === 1 ? [{ label: 'Blog', href: '/blog/' }, { label: cat.label }] : [{ label: 'Blog', href: '/blog/' }, { label: cat.label, href: base }, { label: `Page ${n}` }],
  });
  const body = `${head}
<section class="section bl-feed" aria-labelledby="bl-feed-title">
  <div class="plane-back">${sky()}</div>
  <div class="wrap">
    ${catNav(data, cat.slug, n === 1)}
    <div class="bl-feed__head">
      <h2 id="bl-feed-title" class="bl-feed__title">Articles</h2>
      <p class="bl-feed__count">${pages > 1 ? `Page ${n} of ${pages}` : `${cat.count} ${cat.count === 1 ? 'article' : 'articles'}`}</p>
    </div>
    ${grid(list)}
    ${pager(base, n, pages)}
  </div>
</section>
${storeStrip(ctx)}`;
  return {
    path: path0,
    html: page({ ctx, path: path0, title: n === 1 ? `${cat.label} | Blog` : `${cat.label}, page ${n} | Blog`, description: `${cat.label} on the Star Buds blog: ${cat.blurb}`, bodyClass: 'page-blog page-blog-category', body }),
  };
}

// ---------------------------------------------------------------- articles
function figure(b) {
  const small = b.w < 520;
  const portrait = b.h / b.w > 1.1;
  const im = photo(b, { cls: 'bl-figure__img', sizes: small ? `${b.w}px` : '(max-width: 760px) 92vw, 720px' });
  const ext = b.href && EXT.test(b.href);
  const inner = b.href ? `<a class="bl-figure__link" href="${esc(b.href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${im}</a>` : im;
  return `<figure class="${cx('bl-figure', small && 'bl-figure--small', !small && portrait && 'bl-figure--portrait')}" style="--bl-w:${Number(b.w)}px">${inner}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
}

function table(b) {
  const rows = b.rows || [];
  const [first, ...rest] = b.head ? rows : [null, ...rows];
  return `<div class="bl-table" role="region" aria-label="Table" tabindex="0"><table>${first ? `<thead><tr>${first.map((c) => `<th scope="col">${links(c)}</th>`).join('')}</tr></thead>` : ''}<tbody>${rest.map((r) => `<tr>${r.map((c) => `<td>${links(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function blockHtml(b) {
  switch (b.t) {
    case 'h2': { const t = plain(b.html); return `<h2 class="${cx('bl-h2', capsy(t) && 'bl-h--caps', t.length > 90 && 'bl-h--long')}">${links(b.html)}</h2>`; }
    case 'h3': return `<h3 class="bl-h3">${links(b.html)}</h3>`;
    case 'p': return `<p>${links(b.html)}</p>`;
    case 'ul': case 'ol': return `<${b.t} class="bl-list">${(b.items || []).map((i) => `<li>${links(i)}</li>`).join('')}</${b.t}>`;
    case 'quote': return `<blockquote class="bl-quote"><p>${links(b.html)}</p></blockquote>`;
    case 'img': return figure(b);
    case 'link': { const ext = EXT.test(b.href); return `<p class="bl-linkout">${btn(b.text, b.href, { variant: 'dark', icon: ext ? 'external' : 'arrow', attrs: ext ? { target: '_blank', rel: 'noopener' } : {} })}</p>`; }
    case 'table': return table(b);
    default: throw new Error('blog: unknown block type ' + b.t);
  }
}

function related(p, posts) {
  const t = Date.parse(p.date);
  return posts.filter((q) => q.category === p.category && q.slug !== p.slug)
    .sort((a, b) => Math.abs(Date.parse(a.date) - t) - Math.abs(Date.parse(b.date) - t) || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
    .slice(0, 3);
}

function articlePage(ctx, data, p) {
  const r = p.rec;
  const cat = data.cats.find((c) => c.slug === p.category);
  const caps = capsy(r.title);
  const hero = r.hero;
  const more = related(p, data.posts);
  const meta = [
    `<time datetime="${esc(r.date)}">${esc(r.dateText)}</time>`,
    r.readTime ? `<span>${esc(r.readTime)}</span>` : '',
    r.updated ? `<span>Updated ${esc(r.updated)}</span>` : '',
  ].filter(Boolean).join(`<span aria-hidden="true">${icon('star', 'bl-dot')}</span>`);
  const heroHtml = hero ? `
        <figure class="bl-hero" style="--bl-ar:${(hero.w / hero.h).toFixed(4)}"${reveal('up')}>
          <div class="bl-hero__frame">${photo(hero, { cls: 'bl-hero__img', sizes: '(max-width: 1020px) 92vw, 860px', eager: true })}</div>
          ${hero.caption ? `<figcaption>${esc(hero.caption)}</figcaption>` : ''}
        </figure>` : '';
  const body = `
<article class="bl-post" aria-labelledby="bl-title">
  <header class="${cx('section', 'on-dark', 'bl-head', hero && 'bl-head--hero')}">
    <div class="plane-back">${sky('bl-sky--head')}</div>
    <div class="wrap bl-head__inner">
      ${crumbs([{ label: 'Blog', href: '/blog/' }, { label: cat.label, href: `/blog/${cat.slug}/` }, { label: r.title }], { cls: 'bl-crumbs' })}
      <p class="bl-head__meta"${reveal('fade')}><a class="bl-head__cat" href="/blog/${esc(cat.slug)}/">${patch(cat.label, { tone: 'green', icon: 'star' })}</a><span class="bl-head__date">${meta}</span></p>
      <h1 id="bl-title" class="${cx('bl-title', caps && 'bl-title--caps')}"${reveal('up', 1)}>${esc(r.title)}</h1>
      <div class="bl-head__rule" aria-hidden="true"${reveal('fade', 2)}></div>
      ${r.tags && r.tags.length ? `<ul class="bl-tags" role="list" aria-label="Tags">${r.tags.map((t) => `<li><span class="bl-tag">${esc(t)}</span></li>`).join('')}</ul>` : ''}
    </div>
    ${art(ART[p.category], 'bl-head__art')}
  </header>
  <div class="${cx('section', 'bl-body', !hero && 'bl-body--plain')}">
    <div class="wrap">
      <div class="bl-sheet on-light">${heroHtml}
        <div class="bl-prose">
${r.blocks.map(blockHtml).join('\n')}
        </div>
        <footer class="bl-end">
          <div class="bl-end__rule" aria-hidden="true"></div>
          <p class="bl-end__note">Published on the Star Buds blog on <time datetime="${esc(r.date)}">${esc(r.dateText)}</time>${r.updated ? `, updated ${esc(r.updated)}` : ''}.</p>
          <div class="btn-row bl-end__links">${btn(`More in ${cat.label}`, `/blog/${cat.slug}/`, { variant: 'primary' })}${btn('All articles', '/blog/', { variant: 'ghost' })}</div>
        </footer>
      </div>
    </div>
  </div>
</article>${more.length ? `
<section class="section bl-related" aria-labelledby="bl-related-title">
  <div class="plane-back">${sky('bl-sky--soft')}</div>
  <div class="wrap">
    <div class="bl-feed__head">
      <h2 id="bl-related-title" class="bl-feed__title">Related articles</h2>
      <a class="bl-more" href="/blog/${esc(cat.slug)}/">More in ${esc(cat.label)}${icon('arrow')}</a>
    </div>
    ${grid(more)}
  </div>
</section>` : ''}
${storeStrip(ctx)}`;
  return {
    path: p.href,
    html: page({ ctx, path: p.href, title: r.title, description: clip(r.excerpt || r.title, 155), bodyClass: cx('page-blog', 'page-article', `page-article--${p.category}`), body }),
  };
}

// ---------------------------------------------------------------- render
export function render(ctx) {
  const data = load();
  if (!data) { console.warn('warning: blog: src/content/blog/index.json not found (run node tools/port-blog.mjs): no blog pages rendered'); return []; }
  const out = [];
  // hub: page 1 = featured + 12, then 12 per page
  const rest = Math.max(0, data.posts.length - 1 - PER);
  const pages = 1 + Math.ceil(rest / PER);
  for (let n = 1; n <= pages; n++) out.push(hubPage(ctx, data, n, pages));
  for (const cat of data.cats) {
    const list = data.posts.filter((p) => p.category === cat.slug);
    const cp = Math.max(1, Math.ceil(list.length / PER));
    for (let n = 1; n <= cp; n++) out.push(categoryPage(ctx, data, cat, n, cp, list.slice((n - 1) * PER, n * PER)));
  }
  for (const p of data.posts) out.push(articlePage(ctx, data, p));
  return out;
}
