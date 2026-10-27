// util.mjs - "Iron Star" markup helpers (FOUNDATION, revision 1). Re-exported by shell.mjs: import from './shell.mjs'.
// Every helper returns an HTML string. See docs/DESIGN.md for the API and the class names they emit.
// Legacy Pop Glass helpers (sticker, starburst, glass({pop})) still work and now render Iron Star pieces.
import { img, picture, imgUrl, generated } from '../lib/images.mjs';

export { img, picture, imgUrl, generated };

/** escape text for HTML text and attribute values */
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** {a:1, b:true, c:false} -> ' a="1" b' (false/null/undefined dropped) */
export const attrs = (o = {}) => Object.entries(o).filter(([, v]) => v !== false && v != null).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`)).join('');

/** class list from strings / falsy values */
export const cx = (...a) => a.flat().filter(Boolean).join(' ');

let uidN = 0;
/** unique id for SVG defs (unique across the whole build, so unique on every page) */
export const uid = (p = 'sb') => `${p}${(++uidN).toString(36)}`;

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
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2"/><path d="M12 1.5V5M12 19v3.5M1.5 12H5M19 12h3.5"/>',
};
/** icon('arrow'|'pin'|'phone'|'clock'|'chevron'|'menu'|'close'|'external'|'directions'|'star'|'phoneApp'|'bag'|'tag'|'plus'|'minus'|'locate', cls?) */
export function icon(name, cls = '') {
  const d = P[name];
  if (!d) throw new Error('unknown icon: ' + name);
  const fill = name === 'star' ? 'currentColor' : 'none';
  return `<svg class="${cx('icon', cls)}" viewBox="0 0 24 24" width="24" height="24" fill="${fill}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

// ---------- buttons ----------
const BTN_ALIAS = { pop: 'gold' };
/**
 * btn(label, href, opts) -> <a class="btn btn--<variant>">. href null -> <button type="button">.
 * opts: variant 'primary' (brand green, gold edge) | 'gold' (antique gold; legacy 'pop') | 'chrome' | 'light' (bone)
 *       | 'ghost' (outline; bone on dark, ink on bone) | 'dark' (jet, gold edge); size 'sm' | 'lg';
 *       icon (icon name, default 'arrow'; false for none); cls; attrs {} (e.g. data-menu-cat); html (label is raw HTML).
 * Every button gets a one-pass metal sheen on hover and a 1px press.
 */
export function btn(label, href, opts = {}) {
  const { variant = 'primary', size, icon: ic = 'arrow', cls, attrs: a = {}, html = false } = opts;
  const v = BTN_ALIAS[variant] || variant;
  const inner = `<span class="btn__label">${html ? label : esc(label)}</span>${ic ? icon(ic, 'btn__icon') : ''}`;
  const c = cx('btn', 'btn--' + v, size && 'btn--' + size, cls);
  return href == null ? `<button type="button" class="${c}"${attrs(a)}>${inner}</button>` : `<a class="${c}" href="${esc(href)}"${attrs(a)}>${inner}</a>`;
}

/** attributes for a live-menu link: href falls back to /stores/ until a store is chosen; site.js rewrites it.
 *  cat '' -> the chosen store's live menu home; 'flower' -> .../products/flower */
export const menuAttrs = (cat = '') => ({ href: '/stores/', 'data-menu-cat': cat });
/** attributes for a link to the chosen store's page (falls back to /stores/) */
export const storeLinkAttrs = () => ({ href: '/stores/', 'data-store-link': '' });

// ---------- smoked glass ----------
/**
 * glass(innerHtml, opts) -> smoked-glass panel (blur 20px, gold hairline edge, faint top sheen, bone text).
 * opts: tag ('div'), cls, tone 'smoke' (default; legacy 'dark'/'light' = smoke) | 'bone' (light glass, ink text),
 *       stitch (true = inner stitched border that draws in on reveal; legacy name `pop`), edge 'gold' (default) | 'chrome',
 *       lift (true = hover lift + gold glow; links/buttons lift anyway), attrs {}.
 */
export function glass(inner, opts = {}) {
  const { tag = 'div', cls, tone, stitch, pop, edge, lift, attrs: a = {} } = opts;
  const st = stitch ?? pop ?? false;
  return `<${tag} class="${cx('glass', tone === 'bone' && 'glass--bone', st && 'glass--stitch stitch stitch--draw', edge === 'chrome' && 'glass--chrome', lift && 'lift', cls)}"${attrs(a)}>${inner}</${tag}>`;
}

// ---------- embroidered patches ----------
const TONES = ['gold', 'bone', 'green', 'red', 'leather', 'chrome'];
const LEGACY_TONE = { yellow: 'gold', lime: 'green', pink: 'red', coral: 'red', paper: 'bone', ink: 'leather' };
const tone = (t, d = 'gold') => (TONES.includes(t) ? t : LEGACY_TONE[t] || d);

/**
 * patch(text, { tone: 'gold'|'bone'|'green'|'red'|'leather', size: 'sm'|'md'|'lg', icon, cls, html, tag }) ->
 * a straight embroidered tab: twill fill, merrowed edge, inner stitch line, Oswald caps. For section eyebrows and labels.
 */
export function patch(text, opts = {}) {
  const { size = 'md', icon: ic, cls, html = false, tag = 'span' } = opts;
  return `<${tag} class="${cx('patch', 'patch--' + tone(opts.tone), size !== 'md' && 'patch--' + size, cls)}">${ic ? icon(ic, 'patch__icon') : ''}<span class="patch__text">${html ? text : esc(text)}</span></${tag}>`;
}
/** legacy: sticker(text, { color, tilt, cls }) -> patch() (no tilt any more; colours map yellow->gold, lime->green, pink/coral->red, paper->bone) */
export function sticker(text, opts = {}) {
  return patch(text, { tone: opts.color || 'gold', size: 'sm', cls: opts.cls, html: opts.html });
}

/**
 * seal({ label, sub, tone, cls }) -> round stitched badge (twill disc, merrowed rim, inner stitch ring). Size it with
 * `--size` (default 120px). label/sub are escaped. Decorative (aria-hidden) when there is no label.
 */
export function seal(opts = {}) {
  const { label = '', sub = '', cls } = opts;
  return `<span class="${cx('seal', 'seal--' + tone(opts.tone || opts.color), cls)}"${label ? '' : ' aria-hidden="true"'}>`
    + (label ? `<span class="seal__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>` : '') + '</span>';
}
/** legacy: starburst({ label, sub, color, cls }) -> seal() (the cartoon starburst is gone) */
export const starburst = (opts = {}) => seal({ label: opts.label, sub: opts.sub, tone: opts.color || 'gold', cls: opts.cls });

// ---------- rocker patches (curved banners, SVG textPath) ----------
const f1 = (n) => +n.toFixed(1);
function arcBand(R, r, a, pos) {
  const s = Math.sin(a), c = Math.cos(a), k = pos === 'bottom' ? 1 : -1;
  const pt = (rad, side) => `${f1(side * rad * s)} ${f1(k * rad * c)}`;
  const sw = pos === 'bottom' ? [0, 1] : [1, 0];
  return `M${pt(R, -1)}A${R} ${R} 0 0 ${sw[0]} ${pt(R, 1)}L${pt(r, 1)}A${r} ${r} 0 0 ${sw[1]} ${pt(r, -1)}Z`;
}
function arcLine(rad, a, pos) {
  const s = Math.sin(a), c = Math.cos(a), k = pos === 'bottom' ? 1 : -1;
  return `M${f1(-rad * s)} ${f1(k * rad * c)}A${f1(rad)} ${f1(rad)} 0 0 ${pos === 'bottom' ? 0 : 1} ${f1(rad * s)} ${f1(k * rad * c)}`;
}
function twill(id) {
  return `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect class="tw1" width="5" height="5"/><rect class="tw2" width="2.2" height="5"/></pattern>`;
}
/** rocker band + stitch + text, centred on (0,0) (the circle centre); returns SVG children */
function rockerParts(text, { R, band, a, pos, fs }) {
  const r = R - band, m = R - band / 2;
  const id = uid('rk'), tw = uid('tw');
  const len = 2 * a * m;
  const size = f1(fs || Math.min(band * 0.64, (len * 0.84) / Math.max(4, String(text).length * 0.5)));
  const tr = pos === 'bottom' ? m + size * 0.3 : m - size * 0.3;
  const inA = a - 7 / m;
  return {
    defs: twill(tw),
    body: `<path class="sb-rocker__band" d="${arcBand(R, r, a, pos)}" fill="url(#${tw})"/>`
      + `<path class="sb-rocker__stitch" d="${arcBand(R - 6, r + 6, inA, pos)}"/>`
      + `<path id="${id}" d="${arcLine(tr, a + 0.2, pos)}" fill="none" stroke="none"/>`
      + `<text class="sb-rocker__text" font-size="${size}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(text)}</textPath></text>`,
  };
}
/**
 * rocker(text, { pos: 'top'|'bottom', tone: 'gold'|'bone'|'green'|'red', radius 300, band 58, angle 34 (half-angle, deg),
 *   cls, label (aria-label; default = text), decorative }) -> curved embroidered banner (SVG, blackletter on twill,
 *   merrowed edge + stitch). Width follows CSS (it scales); height follows the viewBox.
 */
export function rocker(text, opts = {}) {
  const { pos = 'top', radius: R = 300, band = 58, angle = 34, cls, decorative = false } = opts;
  const a = (angle * Math.PI) / 180, r = R - band, pad = 6;
  const minX = -R * Math.sin(a) - pad, w = 2 * R * Math.sin(a) + 2 * pad;
  const y0 = pos === 'bottom' ? r * Math.cos(a) - pad : -R - pad;
  const h = (pos === 'bottom' ? R : -r * Math.cos(a)) - (pos === 'bottom' ? r * Math.cos(a) : -R) + 2 * pad;
  const p = rockerParts(text, { R, band, a, pos });
  const aria = decorative ? ' aria-hidden="true"' : ` role="img" aria-label="${esc(opts.label || text)}"`;
  return `<svg class="${cx('sb-rocker', 'sb-rocker--' + tone(opts.tone), 'sb-rocker--' + pos, cls)}" viewBox="${f1(minX)} ${f1(y0)} ${f1(w)} ${f1(h)}"${aria} focusable="false"><defs>${p.defs}</defs>${p.body}</svg>`;
}

/**
 * emblem({ top: 'Star Buds', bottom: 'Est. 2013', star: '/assets/brand/star-on-dark.png', tone: 'gold', cls, label })
 * -> the three-piece patch: top rocker, a round centre patch carrying the brand star, bottom rocker (one SVG, 400x400).
 * Size it with CSS width. role="img" with an aria-label built from the texts.
 */
export function emblem(opts = {}) {
  const { top = 'Star Buds', bottom = 'Est. 2013', star = '/assets/brand/star-on-dark.png', cls } = opts;
  const R = 190, band = 58, a = (62 * Math.PI) / 180;
  const t = rockerParts(top, { R, band, a, pos: 'top' });
  const b = rockerParts(bottom, { R, band, a, pos: 'bottom' });
  const tw = uid('tw');
  return `<svg class="${cx('emblem', 'sb-rocker--' + tone(opts.tone), cls)}" viewBox="-200 -200 400 400" role="img" aria-label="${esc(opts.label || `${top} - ${bottom}`)}" focusable="false"><defs>${t.defs}${b.defs}${twill(tw)}</defs>`
    + `<g class="emblem__top">${t.body}</g>`
    + `<g class="emblem__centre"><circle class="emblem__disc" r="112" fill="url(#${tw})"/><circle class="emblem__ring" r="103"/><circle class="emblem__inner" r="92"/>`
    + `<image href="${esc(star)}" x="-74" y="-78" width="148" height="148" preserveAspectRatio="xMidYMid meet"/></g>`
    + `<g class="emblem__bottom">${b.body}</g></svg>`;
}

// ---------- screen-print layers ----------
const HT_LEGACY = { yellow: 'gold', lime: 'gold', pink: 'green', paper: 'bone', coral: 'red' };
/** halftone({ color: 'gold'|'green'|'bone'|'ink'|'red', at: 'tr'|'tl'|'br'|'bl'|'top'|'bottom'|'full', cls }) -> large, low-contrast screen-print dots (absolute; put it in a back plane) */
export const halftone = (opts = {}) => `<span class="${cx('halftone', 'halftone--' + (HT_LEGACY[opts.color] || opts.color || 'gold'), 'halftone--' + (opts.at || 'tr'), opts.cls)}" aria-hidden="true"></span>`;

const LEAF_LEGACY = { pop: 'gold', lime: 'gold' };
/** brand leaves wallpaper (pattern-buds.webp as a duotone): leaves({ tone: 'gold' (gold on ink) | 'dark' (green on ink) | 'bone' (bone lines, for green grounds) | 'light' (faint ink on bone), cls }) */
export const leaves = (opts = {}) => `<span class="${cx('leaves', 'leaves--' + (LEAF_LEGACY[opts.tone] || opts.tone || 'gold'), opts.cls)}" aria-hidden="true"></span>`;

/** grain({ cls }) -> film/print grain overlay (absolute, inset 0) */
export const grain = (opts = {}) => `<span class="${cx('grain', opts.cls)}" aria-hidden="true"></span>`;

// ---------- cut-outs ----------
/**
 * cutout(id, opts) -> front-plane cut-out: <span class="cutout ..." data-depth><img class="cutout__img"></span>.
 * opts: cls (position it in your CSS), depth (parallax factor, e.g. 0.15 = drifts against scroll; negative = with it),
 *       float ('slow'|'fast'|false: a slow, heavy drift), alt ('' = decorative, the default), sizes (rendered width),
 *       eager, rotate (deg), style.
 */
export function cutout(id, opts = {}) {
  const { cls, depth = 0.12, float = 'slow', alt = '', sizes = '(max-width: 700px) 45vw, 420px', eager = false, rotate, style = '' } = opts;
  const st = (rotate != null ? `--rot:${Number(rotate)}deg;` : '') + style;
  return `<span class="${cx('cutout', cls)}"${attrs({ 'data-depth': depth || false, style: st || false, 'aria-hidden': alt ? false : 'true' })}>`
    + img(id, { alt, sizes, eager, cls: cx('cutout__img', float && 'float', float && 'float--' + float) }) + '</span>';
}
/**
 * patchCut(id, opts) -> an embroidered patch cut-out ('patch-wings', 'patch-leaf', 'patch-star' (keep <= 140px wide),
 * 'chrome-star', 'flash-leaf', 'flash-bud') with a sewn-on shadow and a slight resting tilt (opts.rotate, default -3).
 * Same options as cutout(); float defaults to false.
 */
export function patchCut(id, opts = {}) {
  return cutout(id, { float: false, rotate: -3, ...opts, cls: cx('cutout--patch', opts.cls) });
}

// ---------- stitching and flourishes ----------
/**
 * seam({ kind: 'stitch'|'double'|'pinstripe', tone: 'gold'|'bone', cls }) -> a stitched seam across the section edge
 * (a welt line plus a dashed thread that draws in when it scrolls into view). Default: at the section TOP;
 * cls 'seam--bottom' puts it at the bottom. Legacy kinds zig/wave/scallop = 'stitch'; `color` is ignored.
 */
export function seam(opts = {}) {
  const kind = ['double', 'pinstripe'].includes(opts.kind) ? opts.kind : 'stitch';
  const t = opts.tone === 'bone' ? 'bone' : 'gold';
  const rows = kind === 'double'
    ? '<line class="seam__thread" x1="0" y1="7" x2="1440" y2="7"/><line class="seam__thread" x1="0" y1="17" x2="1440" y2="17"/>'
    : '<line class="seam__thread" x1="0" y1="12" x2="1440" y2="12"/>';
  const mid = kind === 'pinstripe' ? `<span class="seam__flourish">${pinstripe({ tone: t })}</span>` : '';
  return `<div class="${cx('seam', 'seam--' + kind, 'seam--' + t, opts.cls)}" aria-hidden="true"><svg class="seam__svg" viewBox="0 0 1440 24" preserveAspectRatio="none" focusable="false"><line class="seam__welt" x1="0" y1="1" x2="1440" y2="1"/>${rows}</svg>${mid}</div>`;
}

/** pinstripe({ tone: 'gold'|'bone'|'ink', cls }) -> a symmetric hand-lettering flourish (SVG, 240x24) for dividers */
export function pinstripe(opts = {}) {
  const half = 'M106 12C95 4 82 3 74 9.5C67 15 73 21.5 80 17.5C85 14.5 81 8.5 75 11.5C66 16 56 12 50 12H6';
  const half2 = 'M100 15.5C92 19 86 19.5 83 18';
  return `<svg class="${cx('pinstripe', 'pinstripe--' + (opts.tone || 'gold'), opts.cls)}" viewBox="0 0 240 24" aria-hidden="true" focusable="false"><g class="pinstripe__line"><path d="${half}"/><path d="${half2}"/><path d="${half}" transform="matrix(-1 0 0 1 240 0)"/><path d="${half2}" transform="matrix(-1 0 0 1 240 0)"/></g><path class="pinstripe__gem" d="M120 4.5L124.5 12L120 19.5L115.5 12Z"/><circle class="pinstripe__dot" cx="4" cy="12" r="1.6"/><circle class="pinstripe__dot" cx="236" cy="12" r="1.6"/></svg>`;
}

/** marquee(items[], { cls, sep: '★', strap: true }) -> infinite ticker; by default a leather strap with stitched edges
 *  and blackletter names (content duplicated for the loop; the copy is aria-hidden) */
export function marquee(items, opts = {}) {
  const { cls, sep = '★', strap = true } = opts;
  const run = items.map((t) => `<span class="marquee__item">${esc(t)}</span><span class="marquee__sep" aria-hidden="true">${esc(sep)}</span>`).join('');
  return `<div class="${cx('marquee', strap && 'marquee--strap', cls)}"><div class="marquee__track"><div class="marquee__run">${run}</div><div class="marquee__run" aria-hidden="true">${run}</div></div></div>`;
}

/** data-reveal attributes: reveal('up'|'left'|'right'|'scale'|'wipe'|'fade', delayIndex?) -> ' data-reveal="up" style="--i:2"'
 *  (legacy 'pop' = 'scale'). Reveals are a weighty fade-up with a slight blur-out. */
export const reveal = (kind = 'up', i) => ` data-reveal="${esc(kind === 'pop' ? 'scale' : kind)}"${i != null ? ` style="--i:${Number(i)}"` : ''}`;

/** "MS: Pearl" (template switcher label) */
export const storeLabel = (s) => `${s.state}: ${s.city}`;
/** live menu URL for a store (+ category) */
export const liveMenu = (ctx, slug, cat = '') => `${ctx.site.shopOrigin || 'https://shop.starbuds.us'}/stores/${slug}/${cat ? 'products/' + cat : ''}`;
