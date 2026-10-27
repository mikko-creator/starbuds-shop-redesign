// util.mjs - Pop Glass markup helpers (FOUNDATION). Re-exported by shell.mjs: import from './shell.mjs'.
// Every helper returns an HTML string. See docs/DESIGN.md for the API and the class names they emit.
import { img, picture, imgUrl, generated } from '../lib/images.mjs';

export { img, picture, imgUrl, generated };

/** escape text for HTML text and attribute values */
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** {a:1, b:true, c:false} -> ' a="1" b' (false/null/undefined dropped) */
export const attrs = (o = {}) => Object.entries(o).filter(([, v]) => v !== false && v != null).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`)).join('');

/** class list from strings / falsy values */
export const cx = (...a) => a.flat().filter(Boolean).join(' ');

// ---------- icons (inline SVG, currentColor, aria-hidden) ----------
const P = {
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M6.6 3h3l1.5 4.5-2 1.3a12 12 0 0 0 6.1 6.1l1.3-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  directions: '<path d="M12 2l10 10-10 10L2 12z"/><path d="M9 13v-2h5l-2-2m2 2-2 2"/>',
  star: '<path d="M12 2.8l2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.8l-5.8 3.3 1.5-6.4-4.9-4.3 6.5-.6z"/>',
  phoneApp: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
};
/** icon('arrow' | 'pin' | 'phone' | 'clock' | 'chevron' | 'menu' | 'close' | 'external' | 'directions' | 'star' | 'phoneApp' | 'bag' | 'tag', cls?) */
export function icon(name, cls = '') {
  const d = P[name];
  if (!d) throw new Error('unknown icon: ' + name);
  const fill = name === 'star' ? 'currentColor' : 'none';
  return `<svg class="${cx('icon', cls)}" viewBox="0 0 24 24" width="24" height="24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

// ---------- buttons ----------
/**
 * btn(label, href, opts) -> <a class="btn btn--<variant>">. href null -> <button type="button">.
 * opts: variant 'primary' (deep green pill, hard shadow) | 'pop' (yellow, ink outline) | 'light' (white) | 'ghost' (outline)
 *       | 'dark' (ink); size 'sm' | 'lg'; icon (icon name, default 'arrow'; false for none); cls; attrs {} (e.g. data-menu-cat).
 * label is escaped; pass opts.html = true to insert label as raw HTML.
 */
export function btn(label, href, opts = {}) {
  const { variant = 'primary', size, icon: ic = 'arrow', cls, attrs: a = {}, html = false } = opts;
  const inner = `<span class="btn__label">${html ? label : esc(label)}</span>${ic ? icon(ic, 'btn__icon') : ''}`;
  const c = cx('btn', 'btn--' + variant, size && 'btn--' + size, cls);
  return href == null ? `<button type="button" class="${c}"${attrs(a)}>${inner}</button>` : `<a class="${c}" href="${esc(href)}"${attrs(a)}>${inner}</a>`;
}

/** attributes for a live-menu link: href falls back to /stores/ until a store is chosen; site.js rewrites it.
 *  cat '' -> the chosen store's live menu home; 'flower' -> .../products/flower */
export const menuAttrs = (cat = '') => ({ href: '/stores/', 'data-menu-cat': cat });
/** attributes for a link to the chosen store's page (falls back to /stores/) */
export const storeLinkAttrs = () => ({ href: '/stores/', 'data-store-link': '' });

// ---------- glass ----------
/**
 * glass(innerHtml, opts) -> translucent panel. opts: tag ('div'), cls, pop (ink outline + hard offset shadow),
 * tone 'light' (default, for light grounds) | 'dark' (for dark grounds), shadow 'ink' | 'yellow' | 'pink' (pop only), attrs {}.
 */
export function glass(inner, opts = {}) {
  const { tag = 'div', cls, pop = false, tone = 'light', shadow, attrs: a = {} } = opts;
  return `<${tag} class="${cx('glass', tone === 'dark' && 'glass--dark', pop && 'glass--pop', pop && shadow && 'glass--shadow-' + shadow, cls)}"${attrs(a)}>${inner}</${tag}>`;
}

// ---------- stickers, starburst, layers ----------
/** sticker('EST. 2013', { color: 'yellow'|'pink'|'lime'|'coral'|'green'|'paper', tilt: -6, cls }) -> pop badge */
export function sticker(text, opts = {}) {
  const { color = 'yellow', tilt = -4, cls, html = false } = opts;
  return `<span class="${cx('sticker', 'sticker--' + color, cls)}" style="--tilt:${Number(tilt)}deg">${html ? text : esc(text)}</span>`;
}

function burstPoints(n = 20, r1 = 98, r2 = 76, jag = 6) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 === 0 ? r1 - (i % 4 === 0 ? 0 : jag) : r2 + (i % 3 === 0 ? jag / 2 : 0);
    pts.push((100 + r * Math.cos(a)).toFixed(1) + ',' + (100 + r * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
}
/**
 * starburst({ label, sub, color: 'yellow'|'pink'|'coral'|'lime', points: 20, spin: true, cls }) -> SVG starburst sticker
 * (rotates slowly when spin; the label stays upright). label/sub are escaped.
 */
export function starburst(opts = {}) {
  const { label = '', sub = '', color = 'yellow', points = 20, spin = true, cls } = opts;
  return `<span class="${cx('starburst', 'starburst--' + color, spin && 'starburst--spin', cls)}"${label ? '' : ' aria-hidden="true"'}>`
    + `<svg class="starburst__svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><polygon class="starburst__shadow" points="${burstPoints(points)}" transform="translate(7 7)"/><polygon class="starburst__shape" points="${burstPoints(points)}"/></svg>`
    + (label ? `<span class="starburst__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>` : '') + '</span>';
}

/** halftone dot layer: halftone({ color: 'ink'|'yellow'|'pink'|'green'|'lime'|'paper', at: 'tr'|'tl'|'br'|'bl'|'top'|'bottom'|'full', cls }) */
export const halftone = (opts = {}) => `<span class="${cx('halftone', 'halftone--' + (opts.color || 'ink'), 'halftone--' + (opts.at || 'tr'), opts.cls)}" aria-hidden="true"></span>`;

/** brand leaves wallpaper layer (pattern-buds.webp as a duotone): leaves({ tone: 'dark'|'light'|'pop'|'lime', cls }) */
export const leaves = (opts = {}) => `<span class="${cx('leaves', 'leaves--' + (opts.tone || 'dark'), opts.cls)}" aria-hidden="true"></span>`;

/**
 * cutout(id, opts) -> front-plane product cut-out: <span class="cutout ..." data-depth><img class="cutout__img"></span>.
 * opts: cls (position it in your CSS), depth (parallax factor, e.g. 0.15 = drifts against scroll; negative = with it),
 *       float ('slow'|'fast'|false), alt ('' = decorative, the default), sizes (rendered width, e.g. '(max-width: 700px) 40vw, 420px'),
 *       eager, rotate (deg), style.
 */
export function cutout(id, opts = {}) {
  const { cls, depth = 0.12, float = 'slow', alt = '', sizes = '(max-width: 700px) 45vw, 420px', eager = false, rotate, style = '' } = opts;
  const st = (rotate != null ? `--rot:${Number(rotate)}deg;` : '') + style;
  return `<span class="${cx('cutout', cls)}"${attrs({ 'data-depth': depth || false, style: st || false, 'aria-hidden': alt ? false : 'true' })}>`
    + img(id, { alt, sizes, eager, cls: cx('cutout__img', float && 'float', float && 'float--' + float) }) + '</span>';
}

/** seam({ kind: 'zig'|'wave'|'scallop', color: CSS colour of the NEXT section, cls }) -> SVG edge placed at a section top */
export function seam(opts = {}) {
  const { kind = 'zig', color = 'var(--paper)', cls } = opts;
  let d;
  if (kind === 'wave') d = 'M0 40 C 240 0 480 0 720 26 S 1200 60 1440 18 V64 H0z';
  else if (kind === 'scallop') { d = 'M0 64 V36'; for (let x = 0; x < 1440; x += 60) d += ` q30 -36 60 0`; d += ' V64z'; }
  else { d = 'M0 64 V40'; for (let x = 0; x < 1440; x += 48) d += ` l24 -24 l24 24`; d += ' V64z'; }
  return `<svg class="${cx('seam', 'seam--' + kind, cls)}" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true" focusable="false" style="color:${esc(color)}"><path d="${d}" fill="currentColor"/></svg>`;
}

/** marquee(items[], { cls, sep: '★' }) -> infinite ticker (content duplicated for the loop; the copy is aria-hidden) */
export function marquee(items, opts = {}) {
  const { cls, sep = '★' } = opts;
  const run = items.map((t) => `<span class="marquee__item">${esc(t)}</span><span class="marquee__sep" aria-hidden="true">${esc(sep)}</span>`).join('');
  return `<div class="${cx('marquee', cls)}"><div class="marquee__track"><div class="marquee__run">${run}</div><div class="marquee__run" aria-hidden="true">${run}</div></div></div>`;
}

/** data-reveal attributes: reveal('up'|'wipe'|'scale'|'left'|'right', delayIndex?) -> ' data-reveal="up" style="--i:2"' */
export const reveal = (kind = 'up', i) => ` data-reveal="${esc(kind)}"${i != null ? ` style="--i:${Number(i)}"` : ''}`;

/** "MS: Pearl" (template switcher label) */
export const storeLabel = (s) => `${s.state}: ${s.city}`;
/** live menu URL for a store (+ category) */
export const liveMenu = (ctx, slug, cat = '') => `${ctx.site.shopOrigin || 'https://shop.starbuds.us'}/stores/${slug}/${cat ? 'products/' + cat : ''}`;
