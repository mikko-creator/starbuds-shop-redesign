# Star Buds shop redesign: "Pop Glass" design system

## Concept

**Pop Glass** fuses two languages. The first is **pop art**: punchy condensed uppercase type (Oswald, close to the
condensed STAR BUDS wordmark), Ben-Day halftone dots, starburst stickers, ink outlines and hard offset shadows in
yellow and pink. The second is clean, modern **glassmorphism**: frosted translucent panels with a sheen and an inner
highlight. Glass always sits on a rich backdrop (video loop, photo, the brand wallpaper, gradient blobs) and never on a
flat colour. The brand greens (`#006937`, `#11432B`), ink and warm paper carry every page. Yellow and pink are accents
only, and coral is used only for deal urgency.

The brand's **engraved botanical wallpaper** (`/assets/brand/pattern-buds.webp`, from www.starbuds.us) is the texture
that ties the system together. It is used as a *luminance mask*, so it can be printed in any single colour as a
duotone: lime lines on the dark hero (visible above the fold), faint green lines on paper sections, and green on ink
in the footer.

Every major section is built in **three depth planes**:

- back: a video, photo, wallpaper or halftone layer
- mid: glass panels holding the content
- front: AI-generated product cut-outs and pop stickers that overlap panel edges and hang across section seams

Front-plane pieces drift with scroll parallax at different speeds and float gently. Content reveals once on scroll.
Buttons and cards lift on hover and press flat on click. Under `prefers-reduced-motion` all of that stops, and the
videos are replaced by their posters.

## Tokens (`src/styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--green` | `#006937` | brand green (template), links/accents on light |
| `--green-deep` | `#11432B` | primary buttons, dark grounds |
| `--green-ink` | `#0B2A1C` | darkest ground (hero base, rewards, footer) |
| `--ink` | `#101512` | text, outlines, hard shadows |
| `--charcoal` | `#231F20` | template charcoal (spare) |
| `--paper` | `#FFF8EA` | warm light ground |
| `--white` / `--mist` | `#fff` / `#F2F6F8` | surfaces |
| `--coral` | `#DA5347` | deal urgency only |
| `--pop-yellow` / `--pop-pink` / `--pop-lime` | `#FFD23F` / `#FF5FA2` / `#C7F45A` | pop accents (stickers, shadows, highlights) |
| `--font-display` / `--font-body` | Oswald / Manrope (+ metric-adjusted Arial fallbacks) | headings / body + UI |
| `--fs-hero`, `--fs-h2`, `--fs-h3`, `--fs-lead`, `--fs-body`, `--fs-small` | fluid `clamp()` scale | type sizes |
| `--maxw` 1280px, `--gutter` clamp(16px, 4vw, 56px), `--section-y` | | layout |
| `--promo-h` 36/32px, `--header-h` 76/64px (desktop/<1000px) | | sticky header offsets |
| `--r-sm/md/lg/xl/pill` | 10/18/28/40/999px | radii |
| `--shadow-pop` / `--shadow-pop-hover` | `6px 6px 0 ink` / `9px 9px 0 ink` | pop shadows |
| `--shadow-soft`, `--shadow-cut` | soft panel shadow; `drop-shadow` for cut-outs | depth |
| `--glass-light` / `--glass-dark` / `--glass-blur` | .55 / .14 white; `blur(18px) saturate(160%)` | glass |
| `--ease-out`, `--ease-pop`, `--t-fast/med/slow` | | motion |
| `--z-back 0 < --z-mid 2 < --z-front 6 < --z-header 50 < --z-drawer 60 < --z-gate 100` | | stacking |

## Page API (for the STORES and CONTENT lanes)

A page module exports `render(ctx)` and returns `[{ path, html }]`. Paths end in `/` (written as `index.html`), except
`'/404.html'`. Import everything from `./shell.mjs`.

```js
import { page, esc, attrs, cx, icon, btn, img, picture, imgUrl, glass, sticker, starburst, halftone, leaves,
  cutout, seam, marquee, reveal, menuAttrs, storeLinkAttrs, storeLabel, liveMenu } from './shell.mjs';

export function render(ctx) {
  return [{ path: '/deals/', html: page({ ctx, path: '/deals/', title: 'Deals', description: '...', bodyClass: 'page-deals', body: `<section class="section">...<h1>...</h1></section>` }) }];
}
```

`page({ title, description, body, bodyClass, ctx, path, head })` returns the whole document: the head (with
`noindex`), skip link, promo bar, sticky header with the Locations switcher, mobile drawer, `<main id="main">` wrapping
`body`, the footer, the age gate and `#sb-data` (store JSON for site.js).

- `title`: " | Star Buds" is appended unless the title already contains "Star Buds".
- `body`: must contain exactly one `<h1>`. The build warns otherwise.
- `path`: marks the matching nav link with `aria-current`.

**`ctx`:** `site` (the whole site.json), `stores`, `states`, `storesByState` (`[{ state, stores }]`, only states that
have stores, in site.json order), `categories`, `dataSource`, `cssFiles`.

### Helpers (all return HTML strings)

| Helper | Output |
|---|---|
| `esc(s)`, `attrs({k:v})`, `cx(...classes)` | escaping, attribute string (false/null dropped), class join |
| `icon(name, cls?)` | inline SVG: `arrow pin phone clock chevron menu close external directions star phoneApp bag tag` |
| `btn(label, href, { variant, size, icon, cls, attrs, html })` | `<a class="btn btn--primary">` (or `<button>` when href is null). Variants: `primary` (deep green), `pop` (yellow), `light`, `ghost`, `dark` (ink + yellow shadow). Sizes: `sm`, `lg`. `icon` defaults to `'arrow'`; `false` = none |
| `img(ref, { alt, sizes, cls, eager, attrs })` | ref = generated id (`'cut-bud'`, `'g-glass'` …) gives a WebP `srcset` + `data-ai="generated"` + the image-plan alt. Or a photo object `{ src, w, h, alt }` / `'/assets/photos/x.webp'`. Lazy unless `eager`. **A missing image fails the build.** |
| `picture(ref, opts)` | `<picture>` around `img()` (`opts.pictureCls`) |
| `imgUrl(id, width)` | URL of the closest WebP variant (for CSS backgrounds) |
| `glass(inner, { tag, cls, pop, tone: 'light'\|'dark', shadow: 'yellow'\|'pink', attrs })` | frosted panel. `pop` adds the ink outline + hard shadow; links and buttons with `.glass--pop`, or `.glass--pop.lift`, lift on hover and press on click |
| `sticker(text, { color: yellow\|pink\|lime\|coral\|green\|paper, tilt, cls })` | tilted pop badge |
| `starburst({ label, sub, color: yellow\|pink\|coral\|lime, points, spin, cls })` | SVG starburst sticker (slow spin; set the size with `--size`) |
| `halftone({ color: ink\|yellow\|pink\|green\|lime\|paper, at: tr\|tl\|br\|bl\|top\|bottom\|full, cls })` | Ben-Day dot layer (absolute). Put it in a positioned back plane |
| `leaves({ tone: dark\|light\|pop\|lime, cls })` | brand wallpaper layer (absolute, inset 0). Tune it with `--leaf-opacity` / `--leaf-size` / `--leaf-color` |
| `cutout(id, { cls, depth, float: 'slow'\|'fast'\|false, alt, sizes, eager, rotate, style })` | front-plane cut-out `<span class="cutout" data-depth><img class="cutout__img">`. Position it with your own class (it is absolute). Decorative by default (`alt ''`, aria-hidden) |
| `seam({ kind: zig\|wave\|scallop, color, cls })` | SVG edge. Default: sticks up out of the section top (colour = this section). With `cls: 'seam--bottom'`: sits inside the section bottom (colour = the NEXT section) |
| `marquee(items, { sep, cls })` | infinite ticker; the duplicate run is aria-hidden |
| `reveal(kind, i?)` | attribute string `data-reveal="up"` (+ `--i` stagger delay). Kinds: `up left right scale wipe pop` |
| `menuAttrs(cat)` | `{ href: '/stores/', 'data-menu-cat': cat }`. Use it as `<a${attrs(menuAttrs('flower'))}>`. `cat ''` = the store's live menu home |
| `storeLinkAttrs()` | `{ href: '/stores/', 'data-store-link': '' }` (goes to the chosen store's page) |
| `storeLabel(store)` | `"MS: Pearl"` |
| `liveMenu(ctx, slug, cat?)` | `https://shop.starbuds.us/stores/<slug>/[products/<cat>]` (static links for a known store) |

### Class names

- **Layout:** `.wrap`, `.wrap--narrow`, `.section` (+ `--paper --mist --ink --green`), `.on-dark` (light text and
  buttons on dark), `.plane-back` / `.plane-mid` / `.plane-front`, `.cover` (absolute object-fit cover).
- **Type:** `.h-display`, `.h-hero`, `.h-sub`, `.eyebrow`, `.lead`, `.muted`. Pop accents: `.pop-shadow`
  (`--pink`, `--ink`), `.swipe` (`--pink`, `--lime`) highlighter, and `.outline-type` (set the colour with `--stroke`).
- **Components:** `.glass`, `.glass--dark`, `.glass--pop`, `.btn-row`, `.link-arrow`, `.chip` (`.is-current`),
  `.tabs` / `.tab` / `.tab__count`, `.sticker`, `.starburst`, `.halftone`, `.leaves`, `.marquee`, `.cutout`,
  `.float--slow` / `.float--fast`, `.wiggle`, `.blob` (`--lime --yellow --pink`, defined in home.css).
- **Depth rule:** a section that has cut-outs hanging out of its bottom needs a higher `z-index` than the next
  section. Give `.section` an explicit `z-index` on your page. The home page uses 7, 6, 5 … from top to bottom.
  `.section` clips horizontal overflow (`overflow-x: clip`) but lets cut-outs cross vertically.

### Data attributes (handled by `src/scripts/site.js` on every page)

| Attribute | Behaviour |
|---|---|
| `a[data-menu-cat="flower"]` | href becomes `https://shop.starbuds.us/stores/<chosen>/products/flower` (new tab). With no store chosen, a click opens the Locations chooser and continues to the menu after the pick. `""` = the live menu home |
| `a[data-store-link]` | href becomes `/stores/<chosen>/` |
| `[data-store-pick="<slug>"]` | click = choose that store (saved as localStorage `sbshop-store`; stays on the page; shows a toast unless `data-no-toast`). Gets `.is-current` + `aria-current` / `aria-pressed` |
| `[data-store-label]` | text = `"OK: Lawton"` (keeps its own text when no store is chosen) |
| `[data-store-field="city\|name\|address\|phone\|state"]` | text = that field of the chosen store |
| `a[data-store-tel]`, `a[data-store-map]` | `tel:` / map href of the chosen store (hidden when none) |
| `[data-store-current]` / `[data-store-none]` | shown only when a store is / is not chosen (render them with `hidden` / without) |
| `[data-reveal]`, `[data-stagger]` | one-shot scroll reveal (children of `data-stagger` are staggered) |
| `[data-depth="0.15"]` | scroll parallax (sets `--py`; clamped to ±80px; off under reduced motion) |
| `[data-tilt="5"]` | pointer 3D tilt (max degrees; fine pointers only). Pair it with `.glass--pop` |
| `[data-tabs]` + `[role=tab][aria-controls][data-tab-state]` | tabs; the initial tab follows the chosen store's state |
| `video.bg-video` | autoplays muted, pauses off-screen, never plays under reduced motion. Put a `.cover` poster `<img>` beneath it |

JS events and API: `document` fires `sb:store` (`detail` = store or null). `window.SB` exposes `setStore(slug)`,
`openChooser()`, `menuUrl(store, cat)`, `current` and `data`.

**Reveals:** reveal styles exist only under `html.js` (added by an inline head script) and use the individual
`opacity` / `translate` / `scale` / `clip-path` properties, never `transform`, so hover and tilt keep working. If
site.js has not booted 2.5 s after load (script failure), `html.reveal-all` shows everything. Elements already
scrolled past are revealed at once.

**Age gate:** in the shell on every page. It shows while localStorage `sbshop-age-ok` is not `1` (class
`html.age-pending`, set before first paint). Yes stores `1`; No shows a short message. The page stays in the DOM.

## Build

`node src/build.mjs [--out dir]`. It uses Node builtins plus `cwebp` (and `webpmux` to attach the IPTC "AI-generated"
XMP label to every WebP variant of `assets/generated/`). Variants are cached in `tmp/img-cache/`.

- Stylesheets are linked in this fixed order: tokens, base, components, motion, home, stores, content. A file outside
  that list is not linked (a warning is printed).
- The build exits 1 on: a missing image, a template module that is missing or has no `render`, a duplicate page path,
  or a render error.
- It warns when a page does not have exactly one h1, has no `<main id="main">` or has an empty description.
