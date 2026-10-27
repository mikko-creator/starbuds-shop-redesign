# shop.starbuds.us: structure and architecture capture (2026-10-27)

## What could and could not be read

- **shop.starbuds.us refuses this network.** Every request returned `403 Forbidden`, including the home page, robots.txt,
  the sitemap and the store pages, whether sent by a script or opened in a normal desktop Chrome. Nothing was done to get
  around the refusal: no proxy, no VPN, no disguised user agent. Its Internet Archive copies (home page captured
  2026-07-13, store pages around 2026-05-20) could not be opened from here either, and the Common Crawl index timed out.
  So the shop's own HTML, copy and imagery were not captured.
- **What the architecture rests on instead (all read live on 2026-10-27, or from the 2026-10-23 crawl of the main site):**
  1. **www.starbuds.us** (the brand's main site). Its *Order Online* and state pages link the shop's 12 store pages, and
     its store and state pages carry the stores' addresses, phone numbers, hours and descriptions. Those facts are used as
     captured.
  2. **starbudsillinois.us**, the Illinois storefront in the same family. Its footer links its legal pages to
     shop.starbuds.us (EULA, Privacy Policy, Terms Of Use). It is a WordPress site with a LeafBridge location switcher and
     a Dutchie-powered menu. It was read in Chrome to model the shop's template (page types, navigation, categories, age
     gate, colours).
  3. **The brand assets**: the logo, the star, and the engraved botanical leaves wallpaper, all from www.starbuds.us.

## The shop's architecture (modelled on the shared storefront template)

```
shop.starbuds.us
├── age gate: "Are you 21 years of age or older?" (21+, or 18+ with a valid medical card)
├── header: promo bar "Shop Our Special Offers" · logo · Shop All · Deals · Locations (switcher) · Higher Rewards · Merch
├── /stores/<slug>/                     store home: Choose Your Location · "You're Shopping at Star Buds in <City>"
│   ├── /specials                       deals for that store
│   ├── /brands                         brands carried
│   ├── /info                           dispensary info: address, map, hours, phone, open/closed status
│   └── /products/<category>            flower · pre-rolls · vaporizers · concentrates · edibles · tinctures ·
│                                       topicals · accessories · apparel
├── /eula/  /privacy-policy/  /terms-of-use/
└── footer: Quick Links (Shop All, Deals, Higher Rewards) · App Store + Google Play · Shop (categories) · store info · legal
```

## All locations on the shop (12)

| State | Store page on the shop |
|---|---|
| Mississippi | `/stores/greenwood-dispensary/` · `/stores/natchez-dispensary/` · `/stores/ocean-springs-dispensary/` · `/stores/pearl/` · `/stores/oxford-dispensary/` · `/stores/tupelo-saltillo-dispensary/` |
| Oklahoma | `/stores/lawton-dispensary/` · `/stores/altus-dispensary/` · `/stores/ardmore-dispensary/` · `/stores/chickasha-dispensary/` |
| Maryland | `/stores/baltimore-dispensary/` |
| New York | `/stores/buffalo-dispensary/` |

Addresses, phone numbers and hours per store: [LOCATIONS.md](LOCATIONS.md). Sister storefronts outside the shop:
Illinois (5 stores, starbudsillinois.us) and Colorado (starbudscolorado.com).

## How the redesign maps it

| Live shop | Redesign |
|---|---|
| store chooser + header switcher | home-page location chooser, a `/stores/` index (added), and a header switcher that remembers the store |
| `/stores/<slug>/` | `/stores/<slug>/`, same slugs |
| `/stores/<slug>/info` | the store page's `#info` section |
| `/stores/<slug>/specials` | `/deals/` (deals copy captured from the main site) |
| Higher Rewards | `/rewards/` (rewards copy captured from the main site) |
| `/stores/<slug>/products/<category>`, `/brands` | category tiles deep-link to the live Dutchie menu for the chosen store (no product data was readable, and none is invented) |
| legal pages | linked to the live shop pages |
