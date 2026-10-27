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

## Revision 2 (2026-10-27): a multi-state operator's architecture

The site now follows the information architecture of a large multi-state dispensary operator's site. Its structure was
adopted: menu order and mega menus, footer columns, page types, section order and URL patterns. Its words and facts
were not. Every page is filled with Star Buds' own content: the starbuds.us blog, company pages, programme terms and
product guides captured on 2026-10-23, plus the shop data. The law and medical-card statements each link to the
official state page that states them.

**Header:** promo bar and "Pick up at" store switcher; main nav in the adopted order: Shop (the chosen store's live
menu), Explore, Rewards, Resources, Dispensaries.
- Explore (mega menu): Deals; the shop's 9 categories (live-menu links); Product guides (in the slot the model uses for
  house brands, which Star Buds does not publish); Find your vibe (Star Buds articles, labelled as reading: Star Buds
  menus cannot filter by effect).
- Resources (mega menu): Dispensary Guide, Getting a Medical Card, State Laws, Blog, Recipes, Patient Guide.
- Dispensaries (mega menu): Mississippi, Oklahoma, Maryland and New York with their stores; "More Star Buds" (Star Buds
  Colorado and Star Buds Illinois, their own sites); All locations.

**Footer:** Home, Shop, Rewards, Blog, Dispensaries | More information: Getting a Medical Card, About Us, Contact Us,
FAQ, Careers, Community, In the Press, Cancer Relief Program, EULA, Higher Rewards Terms, Site Map.

**Page types and URLs:**

| Section | Star Buds pages | Source |
|---|---|---|
| Locations hub | `/dispensaries/` (with the finder map) | site.json stores, geo.json |
| State hubs | `/dispensaries/{mississippi,oklahoma,maryland,new-york}/` | site.json, starbuds.us state pages |
| State deals | `/dispensaries/{mississippi,oklahoma,maryland}/deals/` | site.json deals, starbuds.us deals pages |
| Location pages | `/stores/<slug>/` (the shop's own URLs, kept) in the model's section order | site.json stores and visit Q&As |
| Rewards | `/rewards/`, `/rewards/terms/` | starbuds.us rewards pages and Higher Rewards terms |
| Blog | `/blog/`, `/blog/p/<n>/`, `/blog/<category>/`, `/blog/<category>/<slug>/` (94 posts, 6 categories) | starbuds.us blog posts, verbatim with their dates |
| Resources | `/dispensary-guides/`, `/getting-a-medical-card/` + 4 states, `/cannabis-laws-by-state/` + 4 states, `/patient-guide/`, `/faq/` | site.json, faq.json, Star Buds posts, official state program sites |
| Company | `/about-us/`, `/contact/`, `/careers/`, `/community/`, `/media/`, `/cancer-relief-program/`, `/eula/` | starbuds.us pages, verbatim |
| Products | `/products/` + 5 guides | starbuds.us product pages (Colorado-only deal lines dropped) |
| Site map | `/site-map/` | every built page |

`/stores/` now redirects to `/dispensaries/`.

**Left out, because Star Buds publishes nothing for them:** delivery, customer accounts, chat, house-brand menus, a
"most popular" blog category, customer reviews on store pages, licence numbers, privacy and accessibility pages, a
parent-company link, live product rails (replaced by category spotlights) and a New York deals page.
