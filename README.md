# Star Buds Shop: "Pop Glass" redesign concept

A redesign concept for [shop.starbuds.us](https://shop.starbuds.us/), Star Buds' online menu for its Mississippi,
Oklahoma, Maryland and New York dispensaries. It is a complete visual overhaul that keeps the brand: the STAR★BUDS
wordmark, its greens, its friendly, confident tone, and its engraved leaves wallpaper. The new look fuses
**glassmorphism and pop art**:

- frosted glass panels over rich, moving backdrops;
- halftone dots, starbursts and sticker outlines;
- product cut-outs that break out of their frames and across sections;
- scroll-choreographed reveals and tactile hover states.

**Preview:** https://mikko-creator.github.io/starbuds-shop-redesign/ (not indexed by search engines). The age gate
remembers a "Yes" in your browser.

## What's in it

| Page | What it shows |
|---|---|
| `/` | Hero on a looping motion backdrop, location chooser, the nine shop categories, deals, rewards, the brand story |
| `/stores/` | All 12 shop locations, grouped by state |
| `/stores/<slug>/` | One page per store, on the shop's own URLs: hours with a live open/closed status, address, directions, call, categories, about |
| `/deals/`, `/rewards/` | Deals and the rewards programme, using the copy published on starbuds.us |

The online ordering itself stays on the existing Dutchie storefront. Category tiles and "Shop" buttons deep-link to the
live menu of the store the visitor chose, which the header's location switcher remembers. No product, price or offer
is invented.

## Docs

- [docs/STRUCTURE.md](docs/STRUCTURE.md): the shop's structure and architecture, how they were captured, and how the
  redesign maps them
- [docs/LOCATIONS.md](docs/LOCATIONS.md): every location, with its address, phone, hours and source
- [docs/DESIGN.md](docs/DESIGN.md): the Pop Glass design system: tokens, layers, motion, components
- [docs/MEDIA.md](docs/MEDIA.md): the generated stills (fal.ai) and motion loops (Higgsfield), and how they are labelled

## Build

A static site with no dependencies, built with Node 18+ (`cwebp` on PATH for the WebP images).

```bash
node src/build.mjs                      # -> dist/
node tools/serve.mjs --root dist --port 8080 --not-found 404.html
```

Concept work for discussion. Star Buds names, logos and photos belong to their owner.
