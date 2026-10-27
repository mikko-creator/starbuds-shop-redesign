// build.mjs - Star Buds shop redesign pitch ("Pop Glass"): src/content/site.json -> static site (FOUNDATION).
//   node src/build.mjs [--out dist]        (lanes: --out tmp/build-<lane>)
// Node builtins + cwebp (and webpmux, optional) on PATH. Reads src/content/site.json, or src/content/site.stub.json
// when the real data does not exist yet. Exit 1 on a missing image, an unknown template, a duplicate page path or a
// render error. Writes every page at <path>/index.html (or the .html path given), assets under /assets/, robots.txt
// (Disallow: /), .nojekyll.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/paths.mjs';
import { loadSite } from './lib/data.mjs';
import { scanGenerated, writeVariants, imageErrors } from './lib/images.mjs';
import { MODULES } from './theme/index.mjs';
import { CSS_ORDER } from './theme/shell.mjs';

const argv = process.argv.slice(2);
const argOf = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1]; };
const OUT = path.resolve(ROOT, argOf('out', 'dist'));
if (!OUT.startsWith(ROOT + path.sep)) { console.error('refusing --out outside the project: ' + OUT); process.exit(2); }
const t0 = Date.now();
const fail = (msg) => { console.error('BUILD FAILED: ' + msg); process.exit(1); };

// ---------- data ----------
const { site, source } = loadSite();
console.log('data: ' + source);

// ---------- output dir ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

function copyDir(src, dst, filter = () => true) {
  const s = path.join(ROOT, src);
  if (!fs.existsSync(s)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(s, { withFileTypes: true })) {
    if (e.isDirectory()) { n += copyDir(path.join(src, e.name), path.join(dst, e.name), filter); continue; }
    if (!filter(e.name)) continue;
    fs.mkdirSync(path.join(OUT, dst), { recursive: true });
    fs.copyFileSync(path.join(s, e.name), path.join(OUT, dst, e.name));
    n++;
  }
  return n;
}

// ---------- static assets ----------
const cssFiles = CSS_ORDER.filter((f) => fs.existsSync(path.join(ROOT, 'src/styles', f + '.css')));
fs.mkdirSync(path.join(OUT, 'assets/css'), { recursive: true });
for (const f of cssFiles) fs.copyFileSync(path.join(ROOT, 'src/styles', f + '.css'), path.join(OUT, 'assets/css', f + '.css'));
const extraCss = fs.readdirSync(path.join(ROOT, 'src/styles')).filter((f) => f.endsWith('.css') && !CSS_ORDER.includes(f.replace(/\.css$/, '')));
if (extraCss.length) console.warn('warning: stylesheets not in the fixed order are not linked: ' + extraCss.join(', '));
fs.mkdirSync(path.join(OUT, 'assets/js'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/scripts/site.js'), path.join(OUT, 'assets/js/site.js'));
const copied = {
  brand: copyDir('assets/brand', 'assets/brand', (n) => /\.(png|webp|svg|jpg)$/i.test(n)),
  fonts: copyDir('assets/fonts', 'assets/fonts', (n) => /\.(woff2?|txt)$/i.test(n)),
  media: copyDir('assets/media', 'assets/media', (n) => /\.(mp4|webm|webp|jpg|png)$/i.test(n)),
  photos: copyDir('assets/photos', 'assets/photos', (n) => /\.(webp|jpe?g|png|avif)$/i.test(n)),
};
fs.copyFileSync(path.join(ROOT, 'assets/brand/favicon.png'), path.join(OUT, 'favicon.png'));
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// ---------- images ----------
scanGenerated();

// ---------- context ----------
const byState = new Map((site.states || []).map((s) => [s.code, { state: s, stores: [] }]));
for (const s of site.stores || []) {
  if (!byState.has(s.state)) byState.set(s.state, { state: { code: s.state, name: s.state, blurb: '' }, stores: [] });
  byState.get(s.state).stores.push(s);
}
const ctx = {
  site,
  dataSource: source,
  stores: site.stores || [],
  states: site.states || [],
  storesByState: [...byState.values()].filter((g) => g.stores.length),
  categories: site.categories || [],
  cssFiles,
  out: OUT,
};

// ---------- render ----------
const pages = new Map();
for (const name of MODULES) {
  const file = path.join(ROOT, 'src/theme', name + '.mjs');
  if (!fs.existsSync(file)) fail('unknown template module: ' + name);
  let mod;
  try { mod = await import('./theme/' + name + '.mjs'); } catch (e) { fail(`template ${name} failed to load: ${e.stack || e}`); }
  if (typeof mod.render !== 'function') fail('template ' + name + ' exports no render(ctx)');
  let out;
  try { out = await mod.render(ctx); } catch (e) { fail(`template ${name} threw: ${e.message}${/missing image/.test(e.message) ? '' : '\n' + e.stack}`); }
  for (const p of out || []) {
    if (!p || typeof p.path !== 'string' || typeof p.html !== 'string') fail('template ' + name + ' returned a page without path/html');
    if (pages.has(p.path)) fail(`duplicate page path ${p.path} (${pages.get(p.path).from} and ${name})`);
    pages.set(p.path, { ...p, from: name });
  }
}
const errs = imageErrors();
if (errs.length) fail([...new Set(errs)].join('\n  '));

const warnings = [];
for (const [p, { html, from }] of pages) {
  const rel = p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1);
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) warnings.push(`${p} (${from}): ${h1} <h1>`);
  if (!/<main id="main"/.test(html)) warnings.push(`${p} (${from}): no <main id="main">`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) warnings.push(`${p} (${from}): empty meta description`);
}
if (!pages.has('/404.html')) warnings.push('no /404.html page rendered');

// ---------- encode / copy image variants ----------
const iv = await writeVariants(OUT);
const errs2 = imageErrors();
if (errs2.length) fail([...new Set(errs2)].join('\n  '));

for (const w of warnings) console.warn('warning: ' + w);
console.log(`built ${pages.size} pages -> ${path.relative(ROOT, OUT) || '.'} | css ${cssFiles.join(',')} | brand ${copied.brand}, fonts ${copied.fonts}, media ${copied.media}, photos ${copied.photos} | img variants ${iv.copied} (encoded ${iv.encoded}, xmp ai-label ${iv.labelled ? 'yes' : 'no'}) | ${((Date.now() - t0) / 1000).toFixed(1)}s`);
