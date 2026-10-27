# Star Buds Shop: "Starlight" redesign concept

A redesign concept for [shop.starbuds.us](https://shop.starbuds.us/), Star Buds' online menu for its Mississippi,
Oklahoma, Maryland and New York dispensaries. It is a complete visual overhaul that keeps the brand: the STAR★BUDS
wordmark, its greens and its friendly, confident tone. The look is **ethereal glassmorphism that plays on the name**:
simple, clean and modern.

- a deep night sky with soft star fields and aurora glows in the brand greens, teal and violet;
- frosted glass panels with fine bright edges, on night, or on light pearl glass for long reads;
- the brand star as a glowing mark, and the products floating like stars with a gentle halo;
- one clean typeface, generous space, gentle reveals and soft hover glows.

The site's structure follows a large multi-state dispensary operator's site: its menu order and mega menus, footer,
page types, section order and URL patterns. Every word and fact on it is Star Buds' own, taken from starbuds.us and the
shop, except the law and medical-card summaries, which cite official state sources.

**Preview:** https://mikko-creator.github.io/starbuds-shop-redesign/ (not indexed by search engines). The age gate
remembers a "Yes" in your browser.

## What's in it

| Page | What it shows |
|---|---|
| `/` | Hero on a looping motion backdrop; a store finder with a map of the four states; shop by category; "Find your vibe" (Star Buds articles); deals; the brand statement; flower and vape spotlights; rewards; the latest articles; a cannabis FAQ; the brand story |
| `/dispensaries/` and a page per state | All 12 shop locations with the map, then each state's stores, deals and questions |
| `/stores/<slug>/` | One page per store, on the shop's own URLs: details, directions, call, hours with a live open/closed status where starbuds.us lists hours (6 of the 12), visiting tips, deals, FAQs and nearby stores |
| `/deals/`, `/dispensaries/<state>/deals/`, `/rewards/` | Deals by state and the Higher Rewards programme with its terms, using the copy published on starbuds.us |
| `/blog/` | 94 Star Buds articles from starbuds.us in six categories: Cannabis 101, Health & Lifestyle, News & Culture, Recipes, Resources, Shopping & Reviews |
| `/dispensary-guides/`, `/getting-a-medical-card/`, `/cannabis-laws-by-state/`, `/patient-guide/`, `/faq/` | Resources: visiting guides, a medical-card page and a law page for each state, a patient guide and the full FAQ |
| `/about-us/`, `/careers/`, `/community/`, `/media/`, `/cancer-relief-program/`, `/products/` | Star Buds' company pages and product guides |

The online ordering itself stays on the existing Dutchie storefront. Category tiles and "Shop" buttons deep-link to the
live menu of the store the visitor chose, which the header's location switcher and the store finder remember. No
product, price or offer is invented. The FAQ's shop answers quote starbuds.us; its cannabis-basics answers are general
information written for this concept, not medical advice. The law and medical-card pages are general information, not
legal advice, and link each statement to its official source.

## Docs

- [docs/STRUCTURE.md](docs/STRUCTURE.md): the shop's structure and architecture, how they were captured, how the
  redesign maps them, and the architecture adopted in revision 2
- [docs/LOCATIONS.md](docs/LOCATIONS.md): every location, with its address, phone, hours and source
- [docs/DESIGN.md](docs/DESIGN.md): the Starlight design system: tokens, glass, motion, components
- [docs/MEDIA.md](docs/MEDIA.md): the generated stills (fal.ai) and motion loops (Higgsfield), and how they are labelled
- [src/content/vendor/README.md](src/content/vendor/README.md): the map data and its licence

## Build

A static site with no dependencies, built with Node 18+ (`cwebp` on PATH for the WebP images).

```bash
node src/build.mjs                      # -> dist/
node tools/serve.mjs --root dist --port 8080 --not-found 404.html
```

Concept work for discussion. Star Buds names, logos and photos belong to their owner.
