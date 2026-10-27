// faq.mjs - home-page FAQ section (REVISION-1 R1.4, FAQ lane). Exports faqSection(ctx); FOUNDATION's home.mjs
// imports it with a tolerant dynamic import and places it after the rewards band.
// Content: src/content/faq.json (captured Star Buds copy with per-answer sources, plus neutral general answers).
// Markup: <details>/<summary> accordions (work without JS), one exclusive accordion per group (the `name`
// attribute), FAQPage JSON-LD. Styles: src/styles/faq.css ("Iron Star": leather panel, rocker-patch group
// headings, stitched dividers, chrome plus/minus toggles).
import fs from 'node:fs';
import { esc, attrs, imgUrl, cutout, reveal, menuAttrs } from './shell.mjs';

const FAQ_FILE = new URL('../content/faq.json', import.meta.url);

/** faq.json, parsed fresh on each call (one build = one call). */
export function faqData() {
  return JSON.parse(fs.readFileSync(FAQ_FILE, 'utf8'));
}

/**
 * Resolve a ref path such as `stores[slug=lawton-dispensary].visit[0].a`, `deals[state=OK,group=daily].intro` or
 * `rewards.paragraphs[0]` against an object. Returns undefined when any step is missing.
 */
export function resolveRef(root, p) {
  let cur = root;
  for (const seg of String(p).split('.')) {
    const m = seg.match(/^([^[\]]+)((?:\[[^\]]+\])*)$/);
    if (!m) return undefined;
    cur = cur == null ? undefined : cur[m[1]];
    for (const [, sel] of m[2].matchAll(/\[([^\]]+)\]/g)) {
      if (/^\d+$/.test(sel)) cur = cur == null ? undefined : cur[Number(sel)];
      else {
        const conds = sel.split(',').map((c) => c.split('='));
        cur = Array.isArray(cur) ? cur.find((o) => conds.every(([k, v]) => o && String(o[k]) === v)) : undefined;
      }
    }
  }
  return cur;
}

/**
 * Build-time guard for refs into site.json: each captured quote must appear verbatim in its answer and in the value
 * its path resolves to. Returns a list of problems (empty = fine). Refs into other files are checked by the lane's
 * proof script, not here (the build must not depend on the read-only capture workspace).
 */
export function checkSiteQuotes(site, data = faqData()) {
  const problems = [];
  for (const g of data.groups || []) {
    for (const it of g.items || []) {
      const src = it.source || {};
      if (src.type !== 'captured') continue;
      const answer = (it.answer || []).join(' ');
      if (!(src.refs || []).length) problems.push(`${it.id}: captured answer without refs`);
      for (const r of src.refs || []) {
        if (!answer.includes(r.quote)) problems.push(`${it.id}: quote not in answer: ${r.quote.slice(0, 60)}`);
        if (r.file !== 'src/content/site.json') continue;
        const v = resolveRef(site, r.path);
        if (typeof v !== 'string') problems.push(`${it.id}: ${r.path} does not resolve to text`);
        else if (!v.includes(r.quote)) problems.push(`${it.id}: quote not in ${r.path}: ${r.quote.slice(0, 60)}`);
      }
    }
  }
  return problems;
}

// Link keys used in faq.json -> rendered attributes (internal paths live here, never in JSON).
const LINKS = {
  stores: () => ({ href: '/stores/' }),
  deals: () => ({ href: '/deals/' }),
  rewards: () => ({ href: '/rewards/' }),
  menu: () => menuAttrs(''),
};

// Escaped text with captured quotations (“...”) wrapped for styling.
const rich = (s) => esc(s).replace(/“([^”]+)”/g, '<span class="faq__quote">“$1”</span>');


/** Curved rocker patch (SVG): twill fill, merrowed gold edge, bone stitching, blackletter text on an arc. */
function rocker(label) {
  const L = [...label].length;
  const size = Math.max(22, Math.min(34, Math.round(345 / (L * 0.5))));
  return `<svg class="faq__rocker" viewBox="0 0 400 110" aria-hidden="true" focusable="false">
        <path class="faq__rocker-band" d="M10 58 Q200 -18 390 58 L384 104 Q200 36 16 104 Z"/>
        <path class="faq__rocker-sheen" d="M10 58 Q200 -18 390 58 L384 104 Q200 36 16 104 Z"/>
        <path class="faq__rocker-stitch" d="M22 63 Q200 -11 378 63"/>
        <path class="faq__rocker-stitch" d="M26 98 Q200 30 374 98"/>
        <text class="faq__rocker-shadow" style="font-size:${size}px"><textPath href="#faq-arc" startOffset="50%" text-anchor="middle">${esc(label)}</textPath></text>
        <text class="faq__rocker-text" style="font-size:${size}px"><textPath href="#faq-arc" startOffset="50%" text-anchor="middle">${esc(label)}</textPath></text>
      </svg>`;
}

// Shared SVG defs: the twill fill, the gold thread gradient and the text arc.
const DEFS = `<svg class="faq__defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="faq-twill" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="5" height="5" fill="#0E3B25"/><rect width="2.2" height="5" fill="#13492E"/>
      </pattern>
      <linearGradient id="faq-thread" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F3DD98"/><stop offset=".5" stop-color="#E8CB7A"/><stop offset="1" stop-color="#B38A35"/>
      </linearGradient>
      <linearGradient id="faq-sheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
      </linearGradient>
      <path id="faq-arc" d="M13 88 Q200 20 387 88"/>
    </defs>
  </svg>`;

const STAR = '<svg class="faq__star" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1.8l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9l7.1-.6z"/></svg>';

function item(it, n, group, data) {
  const links = (it.links || []).filter((l) => LINKS[l.to]).map((l) => `<a class="faq__link"${attrs(LINKS[l.to]())}>${esc(l.label)}<span class="faq__link-arrow" aria-hidden="true">&rarr;</span></a>`).join('');
  return `
          <details class="faq__item" name="faq-${esc(group.id)}" id="faq-${esc(it.id)}">
            <summary class="faq__q">
              <span class="faq__num" aria-hidden="true">${String(n).padStart(2, '0')}</span>
              <span class="faq__qtext">${esc(it.q)}</span>
              <span class="faq__toggle" aria-hidden="true"></span>
            </summary>
            <div class="faq__a">
              ${(it.answer || []).map((p) => `<p>${rich(p)}</p>`).join('\n              ')}
              ${it.disclaimer && data.disclaimer ? `<p class="faq__note">${esc(data.disclaimer)}</p>` : ''}
              ${it.cite ? `<p class="faq__cite">${esc(it.cite)}</p>` : ''}
              ${links ? `<p class="faq__links">${links}</p>` : ''}
            </div>
          </details>`;
}

function jsonLd(data) {
  const qs = (data.groups || []).flatMap((g) => g.items || []).map((it) => ({
    '@type': 'Question',
    name: it.q,
    acceptedAnswer: { '@type': 'Answer', text: (it.answer || []).join(' ') + (it.disclaimer && data.disclaimer ? ' ' + data.disclaimer : '') },
  }));
  // "<" escaped so no answer text can close the script element.
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qs }).replace(/</g, '\\u003c');
}

export function faqSection(ctx) {
  const data = faqData();
  const problems = checkSiteQuotes(ctx.site, data);
  if (problems.length) console.warn('warning: faq.json quote check:\n  ' + problems.join('\n  '));
  let n = 0;
  const groups = (data.groups || []).map((g, gi) => {
    const items = (g.items || []).map((it) => item(it, ++n, g, data)).join('');
    const count = (g.items || []).length;
    return `${gi ? `
      <div class="faq__divider" aria-hidden="true"><span class="faq__divider-line"></span>${STAR}<span class="faq__divider-line"></span></div>` : ''}
      <div class="faq__group" id="faq-group-${esc(g.id)}"${reveal('up')}>
        <div class="faq__group-head">
          <h3 class="faq__group-title"><span class="faq__sr">${esc(g.title)}</span>${rocker(g.title)}</h3>
          <p class="faq__count" aria-hidden="true">${count} question${count === 1 ? '' : 's'}</p>
        </div>
        <div class="faq__list">${items}
        </div>
      </div>`;
  }).join('');

  return `
<section class="section faq" id="faq" aria-labelledby="faq-title">
  <div class="faq__back" aria-hidden="true">
    <span class="faq__dots faq__dots--tl"></span>
    <span class="faq__dots faq__dots--br"></span>
    <span class="faq__grain"></span>
  </div>
  ${DEFS}
  <div class="wrap faq__wrap">
    <header class="faq__head"${reveal('up')}>
      <p class="faq__tab"><span>${esc(data.eyebrow || 'FAQ')}</span></p>
      <h2 id="faq-title" class="faq__title">${esc(data.title)}</h2>
      ${data.lede ? `<p class="faq__lede">${esc(data.lede)}</p>` : ''}
    </header>
    <div class="faq__frame">
      <div class="faq__panel" style="--faq-leather:url('${esc(imgUrl('g-leather', 1280))}')">
        <span class="faq__stitch" aria-hidden="true"></span>
        ${groups}
        <p class="faq__disclaimer">${STAR}<span>${esc(data.disclaimer)}</span></p>
      </div>
      ${cutout('patch-leaf', { cls: 'faq__patch', depth: 0.1, float: 'slow', rotate: 8, sizes: '(max-width: 700px) 96px, 168px' })}
      ${cutout('chrome-star', { cls: 'faq__chrome', depth: -0.08, float: false, rotate: -12, sizes: '(max-width: 700px) 56px, 92px' })}
    </div>
  </div>
  ${cutout('flash-leaf', { cls: 'faq__flash', depth: 0.16, float: 'slow', rotate: -10, sizes: '(max-width: 700px) 150px, 250px' })}
  <script type="application/ld+json">${jsonLd(data)}</script>
</section>`;
}
