// util.mjs - "Starlight" markup helpers (FOUNDATION-R3; signatures unchanged since revision 1). Re-exported by
// shell.mjs: import from './shell.mjs'. Every helper returns an HTML string. See docs/DESIGN.md for the API and classes.
// The Iron Star and Pop Glass helpers (patch, rocker, seal, emblem, seam, pinstripe, halftone, grain, leaves, patchCut,
// sticker, starburst) keep their signatures and now render Starlight pieces: glass pills, glowing orbs, aurora
// hairlines, star sparkles, faint star dust. New in revision 3: sky() and spark().
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
 * opts: variant 'primary' (aurora gradient fill, dark text) | 'gold' / legacy 'pop' (= primary) | 'chrome' | 'light'
 *       (light glass, dark text) | 'ghost' (glass outline; light on night, dark on pearl) | 'dark' (night glass);
 *       size 'sm' | 'lg'; icon (icon name, default 'arrow'; false for none); cls; attrs {} (e.g. data-menu-cat);
 *       html (label is raw HTML).
 * Pill-shaped; on hover a button lifts 2px, its edge glows and a soft shine passes once.
 */
export function btn(label, href, opts = {}) {
  const { variant = 'primary', size, icon: ic = 'arrow', cls, attrs: a = {}, html = false } = opts;
  const v = BTN_ALIAS[variant] || variant;
  const inner = `<span class="btn__label">${html ? label : esc(label)}</span>${ic ? icon(ic, 'btn__icon') : ''}`;
  const c = cx('btn', 'btn--' + v, size && 'btn--' + size, cls);
  return href == null ? `<button type="button" class="${c}"${attrs(a)}>${inner}</button>` : `<a class="${c}" href="${esc(href)}"${attrs(a)}>${inner}</a>`;
}

/** attributes for a live-menu link: href falls back to /dispensaries/ (revision 2; /stores/ is a redirect stub) until a
 *  store is chosen; site.js rewrites it. cat '' -> the chosen store's live menu home; 'flower' -> .../products/flower */
export const menuAttrs = (cat = '') => ({ href: '/dispensaries/', 'data-menu-cat': cat });
/** attributes for a link to the chosen store's page (falls back to /dispensaries/) */
export const storeLinkAttrs = () => ({ href: '/dispensaries/', 'data-store-link': '' });

// ---------- frosted glass ----------
/**
 * glass(innerHtml, opts) -> frosted-glass panel: --glass-fill, a 1px bright edge, a soft shine, --glass-blur, radius
 * --r-lg, light text. opts: tag ('div'), cls, tone 'smoke' (default; legacy 'dark'/'light' = smoke) | 'bone' (light
 * pearl glass, dark text), stitch / pop (accepted, no effect since revision 3), edge 'gold' (default) | 'chrome' (a
 * brighter edge), lift (true = hover lift + edge glow; links/buttons lift anyway), attrs {}.
 */
export function glass(inner, opts = {}) {
  const { tag = 'div', cls, tone, edge, lift, attrs: a = {} } = opts;
  return `<${tag} class="${cx('glass', tone === 'bone' && 'glass--bone', edge === 'chrome' && 'glass--chrome', lift && 'lift', cls)}"${attrs(a)}>${inner}</${tag}>`;
}

// ---------- glass pills (formerly embroidered patches) ----------
const TONES = ['gold', 'bone', 'green', 'red', 'leather', 'chrome'];
const LEGACY_TONE = { yellow: 'gold', lime: 'green', pink: 'red', coral: 'red', paper: 'bone', ink: 'leather' };
const tone = (t, d = 'gold') => (TONES.includes(t) ? t : LEGACY_TONE[t] || d);

/**
 * patch(text, { tone: 'gold'|'bone'|'green'|'red'|'leather'|'chrome', size: 'sm'|'md'|'lg', icon, cls, html, tag }) ->
 * a small glass pill label (Manrope 600 caps, --track-caps): gold = starlight text, green = aurora green, red = rose
 * (deals), bone = pearl text, leather/chrome = plain white. For section eyebrows and labels; it turns dark on pearl.
 */
export function patch(text, opts = {}) {
  const { size = 'md', icon: ic, cls, html = false, tag = 'span' } = opts;
  return `<${tag} class="${cx('patch', 'patch--' + tone(opts.tone), size !== 'md' && 'patch--' + size, cls)}">${ic ? icon(ic, 'patch__icon') : ''}<span class="patch__text">${html ? text : esc(text)}</span></${tag}>`;
}
/** legacy: sticker(text, { color, tilt, cls }) -> patch() (no tilt; colours map yellow->gold, lime->green, pink/coral->red, paper->bone) */
export function sticker(text, opts = {}) {
  return patch(text, { tone: opts.color || 'gold', size: 'sm', cls: opts.cls, html: opts.html });
}

/**
 * seal({ label, sub, tone, cls }) -> a round glowing orb badge (frosted disc, bright rim, soft halo in the tone's
 * colour). Size it with `--size` (default 120px). label/sub are escaped. Decorative (aria-hidden) when there is no label.
 */
export function seal(opts = {}) {
  const { label = '', sub = '', cls } = opts;
  return `<span class="${cx('seal', 'seal--' + tone(opts.tone || opts.color), cls)}"${label ? '' : ' aria-hidden="true"'}>`
    + (label ? `<span class="seal__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>` : '') + '</span>';
}
/** legacy: starburst({ label, sub, color, cls }) -> seal() */
export const starburst = (opts = {}) => seal({ label: opts.label, sub: opts.sub, tone: opts.color || 'gold', cls: opts.cls });

// ---------- labels (formerly curved rocker banners) ----------
/**
 * rocker(text, { pos, tone, radius, band, angle, cls, label, decorative }) -> a plain glass pill label carrying the
 * text (class sb-rocker; no SVG arc since revision 3). The accessible text is unchanged: the visible text, or `label`
 * (read instead of the text) when it differs; decorative = aria-hidden. radius/band/angle are accepted and ignored.
 */
export function rocker(text, opts = {}) {
  const { pos = 'top', cls, decorative = false } = opts;
  const c = cx('sb-rocker', 'sb-rocker--' + tone(opts.tone), 'sb-rocker--' + pos, cls);
  if (decorative) return `<span class="${c}" aria-hidden="true">${esc(text)}</span>`;
  const label = opts.label && opts.label !== text ? opts.label : '';
  return label
    ? `<span class="${c}"><span aria-hidden="true">${esc(text)}</span><span class="sr-only">${esc(label)}</span></span>`
    : `<span class="${c}">${esc(text)}</span>`;
}

/**
 * emblem({ top: 'Star Buds', bottom: 'Est. 2013', star: '/assets/brand/star-on-dark.png', tone, cls, label }) -> the
 * brand star mark with a soft aurora halo and a thin glass ring (<span class="emblem" role="img">). Size it with CSS
 * width (it is square). The aria-label is built from the texts, as before.
 */
export function emblem(opts = {}) {
  const { top = 'Star Buds', bottom = 'Est. 2013', star = '/assets/brand/star-on-dark.png', cls } = opts;
  return `<span class="${cx('emblem', cls)}" role="img" aria-label="${esc(opts.label || `${top} - ${bottom}`)}">`
    + `<span class="emblem__halo"></span><span class="emblem__ring"></span>`
    + `<img class="emblem__star" src="${esc(star)}" width="256" height="256" alt="" decoding="async"></span>`;
}

// ---------- the sky: star fields, aurora, sparkles (revision 3) ----------
const SPARK_SIZES = ['xs', 'sm', 'md', 'lg'];
/**
 * spark({ size: 'xs'|'sm'|'md' (default)|'lg', cls, style }) -> one CSS four-point star sparkle with a soft glow
 * (decorative, aria-hidden; twinkles slowly, still under reduced motion). Inline-block; position it with cls/style.
 */
export function spark(opts = {}) {
  const { size = 'md', cls, style } = opts;
  return `<span class="${cx('sb-spark', SPARK_SIZES.includes(size) && size !== 'md' && 'sb-spark--' + size, cls)}"${attrs({ style: style || false })} aria-hidden="true"></span>`;
}

/**
 * sky({ stars: true | 'faint' | 'dense' | false, aurora: true | 'green' | 'violet' | 'teal' | false, cls }) -> a
 * CSS-only background layer (absolute, inset 0, aria-hidden): a star field that twinkles slowly plus soft aurora blobs
 * that drift. Put it in a section's .plane-back (or any positioned box). Defaults: stars true, aurora true.
 */
export function sky(opts = {}) {
  const { stars = true, aurora = true, cls } = opts;
  const st = stars
    ? `<span class="${cx('sb-sky__stars', typeof stars === 'string' && 'sb-sky__stars--' + stars)}"></span>${stars === 'faint' ? '' : '<span class="sb-sky__stars sb-sky__stars--twinkle"></span>'}`
    : '';
  const au = aurora ? `<span class="${cx('sb-sky__aurora', typeof aurora === 'string' && 'sb-sky__aurora--' + aurora)}"></span>` : '';
  return `<span class="${cx('sb-sky', cls)}" aria-hidden="true">${au}${st}</span>`;
}

// ---------- retired texture layers ----------
/** halftone(opts) -> '' since revision 3 (no textures). Kept so older calls still build. */
export const halftone = () => '';

/** leaves({ tone, cls }) -> a faint star dust layer since revision 3 (absolute, inset 0, aria-hidden; the class
 *  names leaves / leaves--<tone> / cls stay, so section CSS that sizes or masks it keeps working) */
const LEAF_LEGACY = { pop: 'gold', lime: 'gold' };
export const leaves = (opts = {}) => `<span class="${cx('leaves', 'leaves--' + (LEAF_LEGACY[opts.tone] || opts.tone || 'gold'), opts.cls)}" aria-hidden="true"></span>`;

/** grain(opts) -> '' since revision 3 (no textures). */
export const grain = () => '';

// ---------- cut-outs ----------
/** generated ids retired in revision 3 (the biker patch, chrome and flash art, and the older pop art): cutout() and
 *  patchCut() render a small CSS star cluster in their place, and the shell never shows them */
export const RETIRED_ART = /^(patch-(wings|leaf|star)|chrome-star|flash-(leaf|bud)|pop-)/;
export const isRetiredArt = (id) => typeof id === 'string' && RETIRED_ART.test(id);
function sparkCluster({ cls, depth, style, alt }) {
  return `<span class="${cx('cutout', 'cutout--spark', cls)}"${attrs({ 'data-depth': depth || false, style: style || false, role: alt ? 'img' : false, 'aria-label': alt || false, 'aria-hidden': alt ? false : 'true' })}>`
    + '<span class="sb-spark sb-spark--lg cutout__spark cutout__spark--a"></span><span class="sb-spark sb-spark--sm cutout__spark cutout__spark--b"></span><span class="sb-spark sb-spark--xs cutout__spark cutout__spark--c"></span></span>';
}
/**
 * cutout(id, opts) -> front-plane cut-out: <span class="cutout ..." data-depth><img class="cutout__img"></span>, a
 * product cut-out ('cut-bud', 'cut-vape', ...) that floats gently (bob 8px) inside a soft aurora halo.
 * opts: cls (position it in your CSS), depth (parallax factor, e.g. 0.15 = drifts against scroll; negative = with it),
 *       float ('slow' 9s | 'fast' 6.5s | false), alt ('' = decorative, the default), sizes (rendered width), eager,
 *       rotate (deg), style.
 * A retired id (RETIRED_ART: patch-*, chrome-star, flash-*) renders a square cluster of three star sparkles instead
 * (class cutout--spark, same positioning classes; role="img" + aria-label when alt is given).
 */
export function cutout(id, opts = {}) {
  const { cls, depth = 0.12, float = 'slow', alt = '', sizes = '(max-width: 700px) 45vw, 420px', eager = false, rotate, style = '' } = opts;
  const st = (rotate != null ? `--rot:${Number(rotate)}deg;` : '') + style;
  if (isRetiredArt(id)) return sparkCluster({ cls, depth, style: st, alt });
  return `<span class="${cx('cutout', cls)}"${attrs({ 'data-depth': depth || false, style: st || false, 'aria-hidden': alt ? false : 'true' })}>`
    + img(id, { alt, sizes, eager, cls: cx('cutout__img', float && 'float', float && 'float--' + float) }) + '</span>';
}
/**
 * patchCut(id, opts) -> legacy name for the patch cut-outs. The patch ids are retired, so it renders the star cluster
 * (see cutout()); a cut-* id renders that cut-out (no float unless opts.float). Same options as cutout().
 */
export function patchCut(id, opts = {}) {
  return cutout(id, { float: false, ...opts, cls: cx('cutout--patch', opts.cls) });
}

// ---------- hairlines ----------
/**
 * seam({ kind: 'stitch'|'double'|'pinstripe', tone: 'gold'|'bone', cls }) -> a thin aurora hairline across the section
 * edge that draws out from the centre when it scrolls into view. Default: at the section TOP; cls 'seam--bottom' puts
 * it at the bottom. kind 'pinstripe' adds a star sparkle at the centre; 'double' = 'stitch'; tone 'bone' = a dark
 * hairline for pearl grounds. Legacy kinds zig/wave/scallop = 'stitch'; `color` is ignored.
 */
export function seam(opts = {}) {
  const kind = ['double', 'pinstripe'].includes(opts.kind) ? opts.kind : 'stitch';
  const t = opts.tone === 'bone' ? 'bone' : 'gold';
  return `<div class="${cx('seam', 'seam--' + kind, 'seam--' + t, opts.cls)}" aria-hidden="true"><span class="seam__line"></span>${kind === 'pinstripe' ? '<span class="sb-spark sb-spark--sm seam__star"></span>' : ''}</div>`;
}

/** pinstripe({ tone: 'gold'|'bone'|'ink', cls }) -> a short divider: two fading aurora hairlines with a star sparkle
 *  between them (<span class="pinstripe">, 240px wide by default, 12px tall; width follows CSS) */
export function pinstripe(opts = {}) {
  return `<span class="${cx('pinstripe', 'pinstripe--' + (opts.tone || 'gold'), opts.cls)}" aria-hidden="true"><span class="pinstripe__line"></span><span class="sb-spark sb-spark--sm pinstripe__star"></span><span class="pinstripe__line pinstripe__line--end"></span></span>`;
}

/** marquee(items[], { cls, sep: '★', strap: true }) -> infinite ticker: a clean frosted-glass band (strap) with light
 *  Manrope names; the default separator renders as a star sparkle (content duplicated for the loop; the copy is
 *  aria-hidden) */
export function marquee(items, opts = {}) {
  const { cls, sep = '★', strap = true } = opts;
  const sp = sep === '★' ? '<span class="sb-spark sb-spark--sm"></span>' : esc(sep);
  const run = items.map((t) => `<span class="marquee__item">${esc(t)}</span><span class="marquee__sep" aria-hidden="true">${sp}</span>`).join('');
  return `<div class="${cx('marquee', strap && 'marquee--strap', cls)}"><div class="marquee__track"><div class="marquee__run">${run}</div><div class="marquee__run" aria-hidden="true">${run}</div></div></div>`;
}

/** data-reveal attributes: reveal('up'|'left'|'right'|'scale'|'wipe'|'fade', delayIndex?) -> ' data-reveal="up" style="--i:2"'
 *  (legacy 'pop' = 'scale'). Reveals fade up while a soft blur clears. */
export const reveal = (kind = 'up', i) => ` data-reveal="${esc(kind === 'pop' ? 'scale' : kind)}"${i != null ? ` style="--i:${Number(i)}"` : ''}`;

/** "MS: Pearl" (template switcher label) */
export const storeLabel = (s) => `${s.state}: ${s.city}`;
/** live menu URL for a store (+ category) */
export const liveMenu = (ctx, slug, cat = '') => `${ctx.site.shopOrigin || 'https://shop.starbuds.us'}/stores/${slug}/${cat ? 'products/' + cat : ''}`;

// ---------- revision 2 shared page helpers (FOUNDATION-R2; classes prefixed sb-) ----------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** '2024-03-05' (or an ISO date-time) -> 'March 5, 2024'; anything unparseable is returned as given */
export function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : String(iso || '');
}

/** state name -> URL slug used by /dispensaries/<state>/ ('New York' -> 'new-york') */
export const stateSlug = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * crumbs(items, { cls }) -> visual breadcrumb trail (no BreadcrumbList JSON-LD: the pitch has no production origin).
 * items: [{ label, href }]; the LAST item is the current page (plain text, aria-current="page"; its href is ignored).
 * "Home" (/) is prepended unless items[0].href is '/'. Works on dark grounds; inside .section--bone / .on-light it turns ink.
 */
export function crumbs(items = [], opts = {}) {
  const list = items.length && items[0].href === '/' ? items : [{ label: 'Home', href: '/' }, ...items];
  return `<nav class="${cx('sb-crumbs', opts.cls)}" aria-label="Breadcrumb"><ol class="sb-crumbs__list" role="list">${list.map((it, i) => {
    const last = i === list.length - 1;
    const inner = last || !it.href
      ? `<span class="sb-crumbs__here"${last ? ' aria-current="page"' : ''}>${esc(it.label)}</span>`
      : `<a class="sb-crumbs__link" href="${esc(it.href)}">${esc(it.label)}</a>`;
    return `<li class="sb-crumbs__item">${inner}${last ? '' : icon('star', 'sb-crumbs__sep')}</li>`;
  }).join('')}</ol></nav>`;
}

/** front-plane art for hubHero / cardGrid: a generated id ('cut-bud', 'cut-vape', ... ; a retired patch/chrome/flash id
 *  renders the star cluster) or { id, rotate, cls, sizes, depth } */
function heroArt(art, cls) {
  if (!art) return '';
  const a = typeof art === 'string' ? { id: art } : art;
  const o = { cls: cx(cls, isRetiredArt(a.id) && 'sb-art--small', a.cls), depth: a.depth ?? 0.1, sizes: a.sizes || '(max-width: 700px) 34vw, 300px' };
  if (a.rotate != null) o.rotate = a.rotate;
  return isRetiredArt(a.id) ? patchCut(a.id, o) : cutout(a.id, { float: 'slow', ...o });
}

/**
 * hubHero({ eyebrow, title, intro, art, crumbs, actions, tone, id, cls, eyebrowTone, eyebrowIcon }) -> the hero band of a
 * hub or landing page, carrying the page's ONE <h1> (do not add another h1 to the body).
 *  eyebrow: pill text (escaped) ; title: the h1 text (escaped) ; intro: a string, an array of strings (escaped
 *  paragraphs) or { html } (raw) ; art: a generated image id or { id, rotate, cls, sizes } floating in the front plane
 *  ('cut-bud', 'cut-vape', ... ; a retired patch/chrome/flash id becomes a small star cluster) ; crumbs: crumbs()
 *  items, rendered above the eyebrow ; actions: raw HTML (e.g. btn() calls) ; tone: 'leather' (default: star field +
 *  aurora) | 'green' (a greener aurora) | 'ink' (faint stars) ; id: the h1 id (default 'page-title').
 * The section has z-index 7 so its art can float across the hairline into the next section.
 */
export function hubHero(o = {}) {
  const { eyebrow, title = '', intro, art, actions = '', tone: tn = 'leather', id = 'page-title', cls, eyebrowTone = 'gold', eyebrowIcon = 'star' } = o;
  const t = ['leather', 'green', 'ink'].includes(tn) ? tn : 'leather';
  const paras = intro == null ? '' : typeof intro === 'object' && !Array.isArray(intro) ? (intro.html || '') : [].concat(intro).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
  const back = sky({ stars: t === 'ink' ? 'faint' : true, aurora: t === 'green' ? 'green' : true, cls: 'sb-hub-hero__sky' });
  return `
<section class="${cx('section', 'on-dark', 'sb-hub-hero', 'sb-hub-hero--' + t, art && 'sb-hub-hero--art', cls)}" aria-labelledby="${esc(id)}">
  <div class="plane-back">${back}</div>
  ${seam({ cls: 'seam--bottom' })}
  <div class="wrap sb-hub-hero__inner">
    ${o.crumbs ? crumbs(o.crumbs, { cls: 'sb-hub-hero__crumbs' }) : ''}
    <div class="sb-hub-hero__copy">
      ${eyebrow ? `<p class="sb-hub-hero__eyebrow"${reveal('fade')}>${patch(eyebrow, { tone: eyebrowTone, icon: eyebrowIcon || undefined })}</p>` : ''}
      <h1 id="${esc(id)}" class="h-display sb-hub-hero__title sheen"${reveal('up', 1)}>${esc(title)}</h1>
      <div class="sb-hub-hero__rule"${reveal('fade', 2)}>${pinstripe()}</div>
      ${paras ? `<div class="sb-hub-hero__intro lead"${reveal('up', 2)}>${paras}</div>` : ''}
      ${actions ? `<div class="btn-row sb-hub-hero__actions"${reveal('up', 3)}>${actions}</div>` : ''}
    </div>
  </div>
  ${heroArt(art, 'sb-hub-hero__art')}
</section>`;
}

/**
 * cardGrid(items, { cls, cols: 2|3|4 (default 3), level: 2|3|4 (heading level, default 3), stagger: true }) -> a responsive
 * grid of frosted-glass link cards (<ul class="sb-cards">). Each item:
 *  { title, href, text, eyebrow, eyebrowTone, meta, image (photo object { src, w, h, alt } or a generated id), art (a
 *    generated cut-out id floating over the card's top-right corner; a retired id = a star cluster), cta (default 'Read more'; false = none),
 *    external (true = new tab + external icon), menuCat ('flower' ... = a live-menu link handled by site.js; href is then
 *    the /stores/ fallback), attrs {} }.
 * A card without href renders as a plain panel (no link). Text is escaped; `html: true` on an item takes text as raw HTML.
 */
export function cardGrid(items = [], opts = {}) {
  const { cls, cols = 3, level = 3, stagger = true } = opts;
  const h = `h${[2, 3, 4].includes(level) ? level : 3}`;
  const cards = items.map((it) => {
    const link = it.menuCat != null ? menuAttrs(it.menuCat) : it.href ? { href: it.href } : null;
    const extra = { ...(it.external ? { target: '_blank', rel: 'noopener' } : {}), ...(it.attrs || {}) };
    const tag = link ? 'a' : 'div';
    const cta = it.cta === false ? '' : `<span class="sb-card__cta">${esc(it.cta || (it.menuCat != null ? 'Shop the menu' : 'Read more'))}${icon(it.external ? 'external' : 'arrow')}</span>`;
    const media = it.image ? `<span class="sb-card__media">${img(it.image, { cls: 'sb-card__img', alt: '', sizes: '(max-width: 700px) 92vw, 420px' })}</span>` : '';
    return `
    <li class="sb-cards__item">
      <${tag} class="${cx('sb-card', 'glass', link && 'lift', it.image && 'sb-card--media', it.art && 'sb-card--art')}"${link ? attrs({ ...link, ...extra }) : attrs(extra)}>
        ${media}${it.art ? heroArt({ id: it.art, depth: 0, sizes: '(max-width: 700px) 30vw, 170px' }, 'sb-card__art') : ''}
        <span class="sb-card__body">
          ${it.eyebrow ? `<span class="sb-card__eyebrow">${patch(it.eyebrow, { tone: it.eyebrowTone || 'gold', size: 'sm' })}</span>` : ''}
          <${h} class="sb-card__title">${esc(it.title)}</${h}>
          ${it.text ? `<span class="sb-card__text">${it.html ? it.text : esc(it.text)}</span>` : ''}
          ${it.meta ? `<span class="sb-card__meta">${esc(it.meta)}</span>` : ''}
          ${link ? cta : ''}
        </span>
      </${tag}>
    </li>`;
  }).join('');
  return `<ul class="${cx('sb-cards', 'sb-cards--' + ([2, 3, 4].includes(cols) ? cols : 3), cls)}" role="list"${stagger ? ' data-stagger' : ''}>${cards}
  </ul>`;
}

/**
 * articleCard(post, { level: 2|3 (default 3), cls, eager, sizes }) -> a blog post card (<article class="sb-article">):
 *  post = { title, href, date ('YYYY-MM-DD'), category, categoryLabel, excerpt, image: { src, w, h, alt } }.
 * A frosted-glass card: the photo (slightly cool at rest, full colour on hover), a category pill, the date and the
 * title, whose link is stretched over the whole card. A missing image fails the build (img()); pass image: null for a
 * card with a small night-sky panel and the brand star instead.
 */
export function articleCard(post = {}, opts = {}) {
  const { level = 3, cls, eager = false, sizes = '(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 400px' } = opts;
  const h = level === 2 ? 'h2' : 'h3';
  const media = post.image && post.image.src
    ? img(post.image, { cls: 'sb-article__img', alt: post.image.alt || '', sizes, eager, attrs: post.image.srcset ? { srcset: post.image.srcset, sizes } : {} })
    : `<span class="sb-article__blank">${sky({ stars: true, aurora: 'violet' })}<img class="sb-article__star" src="/assets/brand/star-on-dark.png" width="256" height="256" alt="" loading="lazy" decoding="async"></span>`;
  return `<article class="${cx('sb-article', 'glass', cls)}">
    <div class="sb-article__media">${media}</div>
    <div class="sb-article__body">
      <p class="sb-article__meta">${post.categoryLabel ? patch(post.categoryLabel, { tone: 'green', size: 'sm', cls: 'sb-article__cat' }) : ''}${post.date ? `<time class="sb-article__date" datetime="${esc(String(post.date).slice(0, 10))}">${esc(fmtDate(post.date))}</time>` : ''}</p>
      <${h} class="sb-article__title"><a class="sb-article__link" href="${esc(post.href || '#')}">${esc(post.title)}</a></${h}>
      ${post.excerpt ? `<p class="sb-article__excerpt">${esc(post.excerpt)}</p>` : ''}
      <span class="sb-article__more" aria-hidden="true">Read the article${icon('arrow')}</span>
    </div>
  </article>`;
}
