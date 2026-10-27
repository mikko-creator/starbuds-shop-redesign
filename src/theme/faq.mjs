// faq.mjs - home-page FAQ section (REVISION-1 R1.4, FAQ lane). Exports faqSection(ctx); FOUNDATION's home.mjs
// imports it with a tolerant dynamic import and places it after the rewards band.
// Content: src/content/faq.json (captured Star Buds copy with per-answer sources, plus neutral general answers).
// Markup: <details>/<summary> accordions (work without JS), one exclusive accordion per group (the `name`
// attribute), FAQPage JSON-LD. Styles: src/styles/faq.css (revision 3 "Starlight": a calm night ground, frosted
// glass accordion panels, plain group headings, aurora hairline dividers, thin glowing plus/minus lines).
import fs from 'node:fs';
import { esc, attrs, cutout, reveal, menuAttrs } from './shell.mjs';

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
          <h3 class="faq__group-title">${esc(g.title)}</h3>
          <p class="faq__count" aria-hidden="true">${count} question${count === 1 ? '' : 's'}</p>
        </div>
        <div class="faq__list">${items}
        </div>
      </div>`;
  }).join('');

  return `
<section class="section faq" id="faq" aria-labelledby="faq-title">
  <div class="faq__back" aria-hidden="true">
    <span class="faq__aurora"></span>
    <span class="faq__stars"></span>
    <span class="faq__stars faq__stars--b"></span>
  </div>
  <div class="wrap faq__wrap">
    <header class="faq__head"${reveal('up')}>
      <p class="faq__tab"><span>${esc(data.eyebrow || 'FAQ')}</span></p>
      <h2 id="faq-title" class="faq__title">${esc(data.title)}</h2>
      ${data.lede ? `<p class="faq__lede">${esc(data.lede)}</p>` : ''}
    </header>
    <div class="faq__frame">
      <div class="faq__panel">
        ${groups}
        <p class="faq__disclaimer">${STAR}<span>${esc(data.disclaimer)}</span></p>
      </div>
      ${cutout('cut-leaf', { cls: 'faq__leaf', depth: 0.1, float: 'slow', rotate: 12, sizes: '(max-width: 700px) 84px, 150px' })}
    </div>
  </div>
  <script type="application/ld+json">${jsonLd(data)}</script>
</section>`;
}
