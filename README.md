# Star Buds Shop: "Iron Star" redesign concept

A redesign concept for [shop.starbuds.us](https://shop.starbuds.us/), Star Buds' online menu for its Mississippi,
Oklahoma, Maryland and New York dispensaries. It is a complete visual overhaul that keeps the brand: the STAR★BUDS
wordmark, its greens, its friendly, confident tone, and its engraved leaves wallpaper. The look is **Old English
biker pop art over smoked glass**:

- blackletter rockers and embroidered patches, leather, chrome and gold;
- smoked-glass panels with stitched edges over slow-moving smoke and leather backdrops;
- tattoo-flash illustrations, screen-print halftone, and the leaves wallpaper in gold;
- patches and product cut-outs that break out of their frames and across sections;
- scroll-choreographed reveals and tactile hover states.

**Preview:** https://mikko-creator.github.io/starbuds-shop-redesign/ (not indexed by search engines). The age gate
remembers a "Yes" in your browser.

## What's in it

| Page | What it shows |
|---|---|
| `/` | Hero on a looping motion backdrop; a store finder with a map of the four states (search, state tabs, "Near me", a card for each store); the nine shop categories; deals; rewards; a cannabis FAQ; the brand story |
| `/stores/` | All 12 shop locations, grouped by state |
| `/stores/<slug>/` | One page per store, on the shop's own URLs: address, directions, call, categories, about, and hours with a live open/closed status where starbuds.us lists hours (6 of the 12) |
| `/deals/`, `/rewards/` | Deals and the rewards programme, using the copy published on starbuds.us |

The online ordering itself stays on the existing Dutchie storefront. Category tiles and "Shop" buttons deep-link to the
live menu of the store the visitor chose, which the header's location switcher and the store finder remember. No
product, price or offer is invented. The FAQ's shop answers quote starbuds.us; its cannabis-basics answers are general
information written for this concept, not medical advice.

## Docs

- [docs/STRUCTURE.md](docs/STRUCTURE.md): the shop's structure and architecture, how they were captured, and how the
  redesign maps them
- [docs/LOCATIONS.md](docs/LOCATIONS.md): every location, with its address, phone, hours and source
- [docs/DESIGN.md](docs/DESIGN.md): the Iron Star design system: tokens, layers, motion, components
- [docs/MEDIA.md](docs/MEDIA.md): the generated stills (fal.ai) and motion loops (Higgsfield), and how they are labelled
- [src/content/vendor/README.md](src/content/vendor/README.md): the map data and its licence

## Build

A static site with no dependencies, built with Node 18+ (`cwebp` on PATH for the WebP images).

```bash
node src/build.mjs                      # -> dist/
node tools/serve.mjs --root dist --port 8080 --not-found 404.html
```

Concept work for discussion. Star Buds names, logos and photos belong to their owner.
