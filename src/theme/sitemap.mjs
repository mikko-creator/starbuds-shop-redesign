// sitemap.mjs - /site-map/ (FOUNDATION-R2): every page in ctx.pages (the pages rendered before this module; index.mjs
// renders it last), grouped by section, each titled from its own <title>. Redirect stubs (meta refresh) and the 404 page
// are left out. Starlight (HOME-R3, revision 3): a hubHero, clean frosted-glass panels on a night sky (styled in
// home.css under .page-sitemap), pill counts, blog posts by category.
import * as shell from './shell.mjs';
import { page, esc, icon, patch, hubHero, reveal } from './shell.mjs';

/** the night-sky back layer: FOUNDATION's sky() when shell.mjs exports it, else home.css's scoped .hm-sky layer */
const sky = () => (typeof shell.sky === 'function' ? shell.sky({ stars: true, aurora: false })
  : '<div class="hm-sky" aria-hidden="true"><span class="hm-sky__stars"></span><span class="hm-sky__stars hm-sky__stars--b"></span></div>');

const SECTIONS = [
  { id: 'shop', title: 'Shop and save', match: (p) => p === '/' || /^\/(deals|rewards|products)\//.test(p) },
  { id: 'dispensaries', title: 'Dispensaries', match: (p) => /^\/(dispensaries|stores)\//.test(p) },
  { id: 'resources', title: 'Resources', match: (p) => /^\/(dispensary-guides|getting-a-medical-card|cannabis-laws-by-state|patient-guide|faq)\//.test(p) },
  { id: 'about', title: 'About Star Buds', match: (p) => /^\/(about-us|contact|careers|community|media|cancer-relief-program|eula)\//.test(p) },
  { id: 'blog', title: 'Blog', match: (p) => /^\/blog\//.test(p) },
  { id: 'more', title: 'More pages', match: () => true },
];

const decode = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function titleOf(html, p) {
  const m = /<title>([\s\S]*?)<\/title>/i.exec(html || '');
  const t = m ? decode(m[1]).replace(/\s*\|\s*Star Buds\s*$/i, '').trim() : '';
  return t || p;
}
const depth = (p) => p.split('/').filter(Boolean).length;
// hierarchical order: a hub, then the pages under it ('/' sorts before letters, so /x/ precedes /x/y/)
const byPath = (a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

function list(items, cur) {
  return `<ul class="sb-map__list" role="list">${items.map((it) => `<li class="sb-map__li sb-map__li--d${Math.min(depth(it.path), 3)}"><a class="sb-map__link" href="${esc(it.path)}"${it.path === cur ? ' aria-current="page"' : ''}>${esc(it.title)}</a></li>`).join('')}</ul>`;
}

export function render(ctx) {
  const PATH = '/site-map/';
  const all = [...(ctx.pages || new Map()).values()]
    .filter((p) => p.path.endsWith('/') && !/http-equiv=["']?refresh/i.test(p.html))
    .map((p) => ({ path: p.path, title: titleOf(p.html, p.path) }));
  all.push({ path: PATH, title: 'Site Map' });
  const groups = SECTIONS.map((s) => ({ ...s, items: [] }));
  for (const it of all) groups.find((g) => g.match(it.path)).items.push(it);
  for (const g of groups) g.items.sort(byPath);
  // the blog: hubs first, then posts under their category (/blog/<cat>/<slug>/)
  const blog = groups.find((g) => g.id === 'blog');
  const cats = new Map();
  const hubs = [];
  for (const it of blog.items) {
    const seg = it.path.split('/').filter(Boolean); // ['blog', cat, slug]
    if (seg.length >= 3 && seg[1] !== 'p') { if (!cats.has(seg[1])) cats.set(seg[1], []); cats.get(seg[1]).push(it); } else hubs.push(it);
  }
  const catTitle = (c) => (hubs.find((h) => h.path === `/blog/${c}/`) || {}).title || c.replace(/-/g, ' ');
  const total = all.length;
  const panel = (g, i) => `
      <section class="sb-map__group sb-map__group--${g.id} glass" aria-labelledby="map-${g.id}"${reveal('up', i % 3)}>
        <h2 class="sb-map__title" id="map-${g.id}">${esc(g.title)}</h2>
        <p class="sb-map__count">${patch(`${g.items.length} ${g.items.length === 1 ? 'page' : 'pages'}`, { tone: 'gold', size: 'sm' })}</p>
        ${list(g.items, PATH)}
      </section>`;
  const small = groups.filter((g) => g.id !== 'blog' && g.items.length);
  const blogPanel = blog.items.length ? `
    <section class="sb-map__group sb-map__group--blog glass" aria-labelledby="map-blog"${reveal('up')}>
      <h2 class="sb-map__title" id="map-blog">Blog</h2>
      <p class="sb-map__count">${patch(`${blog.items.length} pages`, { tone: 'gold', size: 'sm' })}</p>
      ${hubs.length ? list(hubs.sort(byPath), PATH) : ''}
      <div class="sb-map__cats">${[...cats.entries()].sort((a, b) => catTitle(a[0]).localeCompare(catTitle(b[0]))).map(([c, posts]) => `
        <div class="sb-map__cat">
          <h3 class="sb-map__cat-title">${esc(catTitle(c))} <span class="sb-map__cat-n">${posts.length}</span></h3>
          ${list(posts.sort((a, b) => a.title.localeCompare(b.title)), PATH)}
        </div>`).join('')}
      </div>
    </section>` : '';
  const body = `
${hubHero({ eyebrow: 'Star Buds', title: 'Site Map', intro: `Every page of this site, by section: ${total} pages.`, art: 'cut-jar', crumbs: [{ label: 'Site Map' }], id: 'map-h1' })}
<section class="section section--ink sb-map" aria-label="All pages">
  <div class="plane-back">${sky()}<span class="sb-map__glow"></span></div>
  <div class="wrap">
    <div class="sb-map__grid">${small.map(panel).join('')}
    </div>
    ${blogPanel}
    <p class="sb-map__back"><a class="link-arrow" href="/">Back to the home page${icon('arrow')}</a></p>
  </div>
</section>`;
  return [{
    path: PATH,
    html: page({ ctx, path: PATH, bodyClass: 'page-sitemap', title: 'Site Map', description: `Every page of the Star Buds shop site, grouped by section (${total} pages).`, body }),
  }];
}
