# Star Buds shop redesign: "Iron Star" design system

## Concept

**Iron Star** is Old English biker pop-art, kept clean and modern. It borrows from a vintage club jacket and its
patches: blackletter rocker lettering, embroidered twill patches with merrowed edges, black leather, smoked glass,
chrome and antique gold. These are printed as mature pop-art: large, low-contrast screen-print halftone dots, tattoo-flash
illustration, duotone imagery and a fine grain. The aim is premium and restrained, closer to high-end streetwear or
craft-whiskey branding than to a costume. The layout uses a lot of black space and crisp alignment, with one accent per
section.

- **Grounds:** mostly jet and leather sections. A bone "price board" section and the FAQ break up the dark, and the brand
  story sits on deep brand green.
- **Accents:** brand green and antique gold. Oxblood red is used only for deal urgency.
- **Type:** Grenze Gotisch (a legible textura) for display headings, always in mixed case and never all caps. Oswald
  is used for small uppercase UI labels (it matches the STAR BUDS wordmark) and Manrope for body text.
- **Leaves wallpaper:** the brand's engraved botanical wallpaper (`/assets/brand/pattern-buds.webp`) is used as a
  luminance mask, so it can be printed as any duotone:
  - gold on ink in the hero (visible above the fold), the drawer, the age gate and the footer;
  - bone on green in the brand story;
  - faint ink on bone in the price board section.
- **Depth:** every major section has three planes:
  - back: leather, smoke or a video loop, the wallpaper, halftone and grain;
  - mid: smoked-glass panels with stitched borders;
  - front: embroidered patches, the chrome star, tattoo flash and product cut-outs. These hang across panel edges and
    section seams and drift with scroll parallax.
- **Motion:** weighty, never bouncy.
  - Reveals are a slow fade-up with a slight blur-out.
  - Stitched borders sew themselves in on reveal, and seams stitch across.
  - A chrome sheen sweeps once across key headings.
  - Buttons get a one-pass metal sheen and a 1px press.
  - Cards lift with a deeper shadow and a gold edge glow; patch cut-outs tilt no more than 2deg.
  - The category ticker is a leather strap with stitched edges.
- **Reduced motion:** `prefers-reduced-motion` stops all of it, and the videos show their posters.

**Guardrails (non-negotiable):**
- no motorcycles or vehicles in imagery or icons;
- no "MC", "1%", club colours or real club insignia;
- no skulls, iron or Maltese crosses, eagles with symbols, weapons or anything with extremist associations;
- no copy pastiche (copy stays captured or neutral UI);
- body text at least 4.5:1 contrast, blackletter at least 3:1 at large size;
- `patch-star.png` no wider than ~140px (at a large size its star-in-circle can read as a pentacle);
- the blank ribbon on `flash-leaf.png` stays blank: never put fake text on it.

## Tokens (`src/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0B0A` | jet: page ground, text on bone |
| `--leather` / `--oil` | `#15120E` / `#1D1A16` | dark sections / raised dark surfaces |
| `--bone` / `--parchment` | `#EFE6D2` / `#E3D4B5` | light sections, text on dark |
| `--green` / `--green-deep` / `--green-glow` | `#006937` / `#0E3B25` / `#2E9B5A` | brand green; deep ground; glow lines (sparingly) |
| `--gold` / `--gold-hi` | `#C9A24A` / `#E8CB7A` | rules, stitches, eyebrows, accents |
| `--red` | `#9E2A22` | oxblood: deal urgency only |
| `--chrome` / `--gold-grad` | 5-stop gradients | metal fills: numerals, the chrome button, gold text and buttons |
| `--text-dark` / `--text-dark-soft` | `#1A1712` / 74% | body text on bone |
| `--text-light` / `--text-light-soft` | bone / 74% | body text on dark |
| `--rule-dark` / `--rule-light` | hairlines on dark / on bone | |
| `--font-black` | "Grenze Gotisch" plus a metric-matched Georgia fallback | display headings only |
| `--font-display` / `--font-body` | Oswald / Manrope (plus metric-adjusted Arial fallbacks) | uppercase UI / body |
| `--fs-hero`, `--fs-h2`, `--fs-h3`, `--fs-lead`, `--fs-body`, `--fs-small` | fluid `clamp()` scale | type sizes |
| `--maxw` 1280px, `--gutter` clamp(16px, 4vw, 56px), `--section-y` | | layout |
| `--promo-h` 34/32px, `--header-h` 76/64px (desktop / below 1000px) | | sticky header offsets |
| `--r-sm/md/lg/xl/pill` | 3/6/10/14/999px | tailored corners (no bubbles) |
| `--shadow-leather` / `--shadow-leather-hover` / `--shadow-soft` / `--shadow-cut` / `--glow-gold` | | depth |
| `--glass-smoke` / `--glass-smoke-strong` / `--glass-bone` / `--glass-blur` / `--glass-edge` / `--glass-edge-chrome` | rgba .62 / .78 / bone .72; `blur(20px) saturate(125%)`; gold / chrome edges | smoked glass |
| `--stitch` / `--stitch-bone` | gold thread .75 / bone thread .55 | dashed stitch lines |
| `--ease-out`, `--ease-heavy`, `--t-fast/med/slow` (.2/.5/1.1s) | | motion |
| `--z-back 0 < --z-mid 2 < --z-front 6 < --z-header 50 < --z-drawer 60 < --z-gate 100` | | stacking |

**Legacy aliases.** The Pop Glass token names still resolve, so older markup keeps working, but new code must not use
them:
- `--paper` = bone, `--mist` = parchment, `--green-ink` = leather, `--charcoal` = oil, `--coral` = red;
- `--pop-yellow` = gold, `--pop-pink` = red, `--pop-lime` = gold-hi;
- `--shadow-pop` = leather shadow, `--glass-light` / `--glass-dark` = bone / smoke glass.

## Page API (for the STORES-R1 and CONTENT-R1 lanes)

A page module exports `render(ctx)` and returns `[{ path, html }]`. Paths end in `/` (written as `index.html`), except
`'/404.html'`. Import everything from `./shell.mjs`:

```js
import { page, esc, attrs, cx, uid, icon, btn, img, picture, imgUrl, glass, patch, seal, rocker, emblem,
  halftone, leaves, grain, cutout, patchCut, seam, pinstripe, marquee, reveal, menuAttrs, storeLinkAttrs,
  storeLabel, liveMenu } from './shell.mjs';

export function render(ctx) {
  return [{ path: '/deals/', html: page({ ctx, path: '/deals/', title: 'Deals', description: '...', bodyClass: 'page-deals', body: `<section class="section section--leather">...<h1>...</h1></section>` }) }];
}
```

`page({ title, description, body, bodyClass, ctx, path, head, scripts })` returns the whole document: the head (with
`noindex`), skip link, promo bar, sticky header with the Locations switcher, mobile drawer, `<main id="main">` wrapping
`body`, the footer, the age gate and `#sb-data` (store JSON for site.js).

- `title`: " | Star Buds" is appended unless the title already contains "Star Buds".
- `body`: must contain exactly one `<h1>`. The build warns otherwise.
- `path`: marks the matching nav link with `aria-current`.
- `scripts`: extra deferred files from `src/scripts/` (every `src/scripts/*.js` is copied to `/assets/js/`). The home
  page passes `['finder.js']`.

**`ctx`:** `site` (the whole site.json), `stores`, `states`, `storesByState` (`[{ state, stores }]`, only states that
have stores, in site.json order), `categories`, `dataSource`, `cssFiles`.

**Stylesheet order:** tokens, base, components, motion, home, finder, faq, stores, content. A file outside that list
is not linked; the build prints a warning.

### Helpers (all return HTML strings)

| Helper | Output |
|---|---|
| `esc(s)`, `attrs({k:v})`, `cx(...classes)`, `uid(prefix)` | escaping; attribute string (false/null dropped); class join; a build-unique id for SVG defs |
| `icon(name, cls?)` | inline SVG: `arrow pin phone clock chevron menu close external directions star phoneApp bag tag plus minus locate` |
| `btn(label, href, { variant, size, icon, cls, attrs, html })` | `<a class="btn btn--gold">`, or `<button>` when href is null. Variants: `primary` (brand green, gold edge), `gold` (legacy `pop`), `chrome`, `light` (bone), `ghost` (bone outline on dark; ink outline inside `.section--bone`, `.on-light` or `.glass--bone`), `dark` (jet, gold edge). Sizes: `sm`, `lg`. `icon` defaults to `'arrow'`; `false` = none |
| `img(ref, { alt, sizes, cls, eager, attrs })` | ref = a generated id (`'cut-bud'`, `'g-leather'`, `'patch-wings'` …), which gives a WebP `srcset`, `data-ai="generated"` and the image-plan alt. Or a photo object `{ src, w, h, alt }`. Lazy unless `eager`. **A missing image fails the build.** |
| `picture(ref, opts)`, `imgUrl(id, width)` | `<picture>` wrapper; URL of the closest WebP variant (for CSS backgrounds) |
| `glass(inner, { tag, cls, tone: 'smoke'\|'bone', stitch, edge: 'gold'\|'chrome', lift, attrs })` | smoked-glass panel (bone text). `stitch: true` adds an inner stitched border that sews itself in on reveal (classes `glass--stitch stitch stitch--draw`); legacy `pop: true` does the same. `tone: 'bone'` = light glass with ink text. Links and buttons with `.glass`, and `.glass.lift`, lift on hover with a gold glow |
| `patch(text, { tone, size: 'sm'\|'md'\|'lg', icon, cls, html, tag })` | straight embroidered tab (twill, merrowed edge, inner stitch, Oswald caps). Tones: `gold` (default), `bone`, `green`, `red`, `leather`, `chrome`. Use it for section eyebrows, state codes and labels |
| `seal({ label, sub, tone, cls })` | round stitched badge. Size it with `--size` (default 120px). The label is blackletter and `sub` is Oswald caps |
| `rocker(text, { pos: 'top'\|'bottom', tone, radius: 300, band: 58, angle: 34, cls, label, decorative })` | curved rocker banner: SVG `textPath`, blackletter on twill, merrowed edge and stitch, `role="img"`. Width follows CSS; it scales |
| `emblem({ top, bottom, star, tone, cls, label })` | three-piece patch: top rocker, a round centre patch carrying the brand star, bottom rocker (one 400x400 SVG). Used in the hero and the age gate |
| `halftone({ color: 'gold'\|'green'\|'bone'\|'ink'\|'red', at: 'tr'\|'tl'\|'br'\|'bl'\|'top'\|'bottom'\|'full', cls })` | large, low-contrast screen-print dots (absolute; put it in a back plane) |
| `leaves({ tone: 'gold'\|'dark'\|'bone'\|'light', cls })` | brand wallpaper duotone: gold on ink / green on ink / bone lines (for green grounds) / faint ink on bone. Tune it with `--leaf-opacity`, `--leaf-size` or `--leaf-color` |
| `grain({ cls })` | print grain overlay (absolute, inset 0, overlay blend; use `mix-blend-mode: multiply` on bone) |
| `cutout(id, { cls, depth, float: 'slow'\|'fast'\|false, alt, sizes, eager, rotate, style })` | front-plane cut-out `<span class="cutout" data-depth><img class="cutout__img">`. Position it with your own class (it is absolute). Decorative by default |
| `patchCut(id, opts)` | `cutout()` for embroidered patches, the chrome star and tattoo flash: a sewn-on shadow, `rotate` -3 by default, no float |
| `seam({ kind: 'stitch'\|'double'\|'pinstripe', tone: 'gold'\|'bone', cls })` | stitched seam across a section edge (a welt line plus a dashed thread that stitches across on reveal). Default: the section top; `cls: 'seam--bottom'` puts it at the bottom. `pinstripe` puts the flourish in the middle (set `--seam-bg` to the section colour; `.section--*` classes set it) |
| `pinstripe({ tone: 'gold'\|'bone'\|'ink', cls })` | symmetric pinstripe flourish (SVG 240x24) for dividers |
| `marquee(items, { sep, cls, strap: true })` | infinite ticker; by default a leather strap with stitched edges and blackletter names. The duplicate run is aria-hidden |
| `reveal(kind, i?)` | attribute string `data-reveal="up"` (plus an `--i` stagger delay). Kinds: `up fade left right scale wipe` |
| `menuAttrs(cat)`, `storeLinkAttrs()`, `storeLabel(store)`, `liveMenu(ctx, slug, cat?)` | live-menu link attributes (`cat ''` = the store's menu home); chosen-store page link attributes; `"MS: Pearl"`; static live-menu URL |

**Legacy helpers** still work: `sticker(text, { color })` renders `patch()` (yellow→gold, lime→green, pink/coral→red,
paper→bone) and `starburst({ label, color })` renders `seal()`. Old halftone and leaves colour names map onto the new
ones. Do not use them in new code.

### Class names

- **Layout:** `.wrap`, `.wrap--narrow`, `.section` (+ `--ink --leather --oil --bone --parchment --green`; legacy
  `--paper --mist`), `.on-dark`, `.on-light`, `.plane-back` / `.plane-mid` / `.plane-front`, `.cover` (absolute
  object-fit cover), `.leather-bg` (darkened `g-leather` texture filling a back plane), `.vignette`.
- **Type:**
  - `h1`/`h2` and `.h-display` are blackletter; `.h-hero` and `.h-sub` are sizes. `h3`/`h4` are Oswald caps.
  - `.eyebrow` is Oswald caps in gold; `.lead` and `.muted` are body styles.
  - Metal text: `.chrome-text`, `.gold-text`, `.numeral` (+ `--gold`), `.outline-type` (set the colour with `--stroke`).
  - `.sheen` sweeps a highlight across a heading once when it scrolls in. It keeps the heading's colour; do not combine
    it with `.chrome-text` or `.gold-text`.
- **Components:**
  - panels and patches: `.glass` (+ `--bone --chrome --stitch`, `.lift`), `.patch` (+ tones, `--sm --lg`), `.seal`
    (+ tones), `.sb-rocker` (+ `--gold --bone --green --red --leather --chrome`, `--top --bottom`), `.emblem`;
  - stitching and texture: `.stitch` (inner dashed thread on any positioned element; `.stitch--draw` sews it in on
    reveal; `.stitch--bone`), `.rule-stitch`, `.seam`, `.pinstripe`, `.halftone`, `.leaves`, `.grain`;
  - controls: `.btn-row`, `.link-arrow`, `.chip` (`.is-current`), `.tabs` / `.tab` / `.tab__count`;
  - motion: `.marquee` / `.marquee--strap`, `.cutout` / `.cutout--patch`, `.float--slow` / `.float--fast`.
- **Rocker class names are prefixed `sb-rocker`**, because the FINDER lane's stylesheet defines unscoped `.rocker*`
  rules for its own SVGs. Do not add new unscoped component names that could collide; prefix lane classes with the
  lane's own block name.
- **Depth rule:** a section that has cut-outs hanging out of its bottom needs a higher `z-index` than the next section.
  Give `.section` an explicit `z-index` on your page. The home page uses hero 9, categories 6, deals 5, rewards 4,
  story 2. `.section` clips horizontal overflow (`overflow-x: clip`) but lets cut-outs cross vertically.

### Data attributes (handled by `src/scripts/site.js` on every page)

| Attribute | Behaviour |
|---|---|
| `a[data-menu-cat="flower"]` | href becomes `<store liveUrl>products/flower` (new tab). With no store chosen, a click opens the Locations chooser and continues to the menu after the pick. `""` = the live menu home |
| `a[data-store-link]` | href becomes the chosen store's page (taken from the rendered switcher links) |
| `[data-store-pick="<slug>"]` | click = choose that store (saved as localStorage `sbshop-store`; stays on the page; shows a toast unless `data-no-toast`). Gets `.is-current` and `aria-current` / `aria-pressed`. Works for elements added after load (delegated) |
| `[data-store-label]` | text = `"OK: Lawton"` (keeps its own text when no store is chosen) |
| `[data-store-field="city\|name\|address\|phone\|state"]` | text = that field of the chosen store |
| `a[data-store-tel]`, `a[data-store-map]` | `tel:` / map href of the chosen store (hidden when none) |
| `[data-store-current]` / `[data-store-none]` | shown only when a store is / is not chosen (render them with `hidden` / without) |
| `[data-reveal]`, `[data-stagger]`, `.sheen`, `.stitch--draw`, `.seam` | one-shot scroll reveal: site.js adds `.is-in` once (children of `data-stagger` are staggered) |
| `[data-depth="0.15"]` | scroll parallax (sets `--py`; clamped to ±80px; off under reduced motion) |
| `[data-tilt="3"]` | pointer 3D tilt (max degrees; fine pointers only). Pair it with `.glass`; keep patches at 2 or less |
| `[data-tabs]` + `[role=tab][aria-controls][data-tab-state]` | tabs; the initial tab follows the chosen store's state |
| `video.bg-video` | autoplays muted, pauses off-screen, never plays under reduced motion. Put a `.cover` still `<img>` beneath it |

**JS events and API:** `document` fires `sb:store` (`detail` = store or null). `window.SB` exposes `setStore(slug)`,
`openChooser()`, `menuUrl(store, cat)`, `current` and `data`.

**Preview rule:** never put a quoted JS string that starts with `/` in page scripts. Build external links from the
absolute `liveUrl` / `mapUrl`, and internal links from hrefs already rendered in the HTML.

**Reveals:**
- Reveal styles exist only under `html.js` (added by an inline head script).
- They use the individual `opacity` / `translate` / `scale` / `clip-path` / `filter` properties, never `transform`, so
  hover and tilt keep working.
- The blur clears to `filter: none`, so it never blocks a panel's backdrop blur.
- If site.js has not booted 2.5 s after load (script failure), `html.reveal-all` shows everything.
- Elements already scrolled past are revealed at once.

**Age gate:**
- It is in the shell on every page and shows while localStorage `sbshop-age-ok` is not `1` (class `html.age-pending`,
  set before first paint).
- Yes stores `1`; No shows a short message.
- The page stays in the DOM.

## Media

- **Hero:**
  - loop: `assets/media/hero-iron.webm` / `.mp4`, poster `hero-iron-poster.webp`, `hero-iron-phone.mp4` below 700px;
  - still underneath: `g-hero-jacket`.
- **Rewards band:**
  - loop: `smoke-ember.webm` / `.mp4`, poster `smoke-ember-poster.webp`;
  - still underneath: `g-smoke`.
- **Loop fallback:** home.mjs uses a loop only when its webm, mp4 and poster all exist; otherwise the still shows.
- **Backdrops:** `g-leather` (via `.leather-bg` and the strap).
- **Retired pop-era assets:** `hero-pop.*`, `glass-dark.*`, `pop-star`, `pop-bud`.
  - The build ships `hero-pop.*` and `glass-dark.*` only while a page still references them, and prints a warning that
    names the page.
  - A category that still points at a `pop-*` cut-out gets `patch-leaf` on the home page.

## Build

`node src/build.mjs [--out dir]` uses Node builtins plus `cwebp` (and `webpmux`, to attach the IPTC "AI-generated"
XMP label to every WebP variant of `assets/generated/`). Variants are cached in `tmp/img-cache/`.

- The home page imports `./finder.mjs` (`finderSection(ctx)`) and `./faq.mjs` (`faqSection(ctx)`) with a tolerant
  dynamic import. A missing module means that section is skipped (with a plain store list in place of the finder); a
  throwing one prints a warning.
- The build exits 1 on: a missing image, a template module that is missing or has no `render`, a duplicate page path,
  or a render error.
- It warns when a page does not have exactly one h1, has no `<main id="main">`, has an empty description, or uses
  retired media.
