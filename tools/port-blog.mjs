// port-blog.mjs - BLOG-R2: port every Star Buds blog post of the starbuds.us capture (2026-10-23) into the revision-2
// blog architecture (/blog/, /blog/p/<n>/, /blog/<category>/, /blog/<category>/<slug>/). Node builtins + cwebp on PATH.
// Deterministic and re-runnable: the same capture gives byte-identical JSON and WebP files.
//
//   node tools/port-blog.mjs [--src <dir>] [--check]
//     --src    the earlier pitch that holds the capture (default: ../starbuds-reforge next to this project). READ-ONLY
//              input: nothing is written there
//     --check  write nothing; exit 1 when the files on disk differ from what this run would write
//
// Reads:  <src>/src/content/pages/single-post__*.json (the posts), blog.json + blog__page__*.json (the live listing,
//         used as a cross-check: every listed post must exist), blog__categories__*.json + blog__tags__*.json (Wix
//         categories and tags: the 12 posts listed on EVERY such page are the sidebar widget, not members),
//         <src>/docs/data/images.json (live image URL -> downloaded original in <src>/assets/source/).
// Writes: src/content/blog/<slug>.json   { slug, category, categoryReason, title, date, dateText, updated, readTime,
//                                          excerpt, tags, hero, image, blocks, source, legacyPath }
//         src/content/blog/index.json    { categories:[{slug,label,href,blurb,count}], posts:[{slug,title,href,date,
//                                          dateText,category,categoryLabel,excerpt,image:{src,w,h,alt,srcset}}] } newest first
//         src/content/blog/vibes.json    { note, items:[{label,href,title,topic}] } ("Find your vibe": reading links only)
//         assets/photos/blog/<sha12>-<w>.webp (only the images the posts use; widths 640 and 1280, never upscaled)
//         tmp/blog-r2-flags.json         the posts to raise with the client (dated news, Colorado/Illinois-only, health
//                                        claims); tmp/ is gitignored
// Blocks are normalized to: h2, h3, p, ul, ol, quote, img, link (a heading that is only a link: "READ THE ARTICLE
// HERE"), table (one post has a table). Inline HTML keeps only <a href>, <strong>, <em>, <br>. Star Buds' words are
// kept verbatim (REVISION-2 D7): only empty blocks, whitespace-only links, empty hrefs, spacer characters and markup
// outside that list are dropped. Links to old starbuds.us pages are mapped to this site when an equivalent exists,
// otherwise they become absolute https://www.starbuds.us/ URLs; external links are kept as published.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const argOf = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1]; };
const SRC = path.resolve(argOf('src', path.join(ROOT, '..', 'starbuds-reforge')));
const CHECK = argv.includes('--check');
const PAGES = path.join(SRC, 'src/content/pages');
const OUT_JSON = path.join(ROOT, 'src/content/blog');
const OUT_IMG = path.join(ROOT, 'assets/photos/blog');
const IMG_URL = '/assets/photos/blog/';
const WIDTHS = [640, 1280];
const CWEBP = ['-quiet', '-q', '78', '-m', '5', '-metadata', 'none'];
const die = (m) => { console.error('port-blog: ' + m); process.exit(2); };
if (!fs.existsSync(PAGES)) die('capture not found: ' + PAGES);

// ---------------------------------------------------------------- categories (the adopted architecture's six; "Most
// Popular" is left out: there is no popularity data). The blurbs are neutral hub intros (REVISION-2 D3 glue copy).
const CATEGORIES = [
  { slug: 'cannabis-101', label: 'Cannabis 101', blurb: 'The basics: the plant, its compounds, how products work and how to enjoy them.' },
  { slug: 'health-and-lifestyle', label: 'Health & Lifestyle', blurb: 'Cannabis in everyday life: wellness topics, hosting, holidays, relationships and staying active.' },
  { slug: 'news-and-culture', label: 'News & Culture', blurb: 'Store news, events, laws and politics, and the people and stories around cannabis.' },
  { slug: 'recipes', label: 'Recipes', blurb: 'Infused dishes, treats and drinks.' },
  { slug: 'resources', label: 'Resources', blurb: 'Reference guides: labels, storage, dosing, product types, cannabinoids, terpenes and medical cards.' },
  { slug: 'shopping-and-reviews', label: 'Shopping & Reviews', blurb: 'Product, strain and brand picks, gift guides and how to shop.' },
];
const CAT = new Map(CATEGORIES.map((c) => [c.slug, c]));

// ---------------------------------------------------------------- one category per post (key = the new slug) with the
// reason. Assigned from each post's own title and body against the category scopes above.
const ASSIGN = {
  'how-cannabis-is-grown-from-seed-to-shelf-at-a-licensed-dispensary': ['cannabis-101', 'Explains how cannabis is cultivated, cured, tested and packaged: a plant-to-shelf basics explainer.'],
  'thc-cbd-cbn-more-understanding-the-most-common-cannabinoids': ['resources', 'A reference guide to the common cannabinoids (THC, CBD, CBN, CBG).'],
  'how-to-keep-cannabis-fresh-the-best-ways-to-store-flower-edibles-and-concentrates': ['resources', 'A how-to reference on storing flower, edibles and concentrates.'],
  'why-your-edible-didn-t-kick-in-yet-understanding-cannabis-edible-timing': ['cannabis-101', 'Explains how edibles work and why their onset is slower than smoking or vaping.'],
  'what-makes-a-cannabis-product-premium-a-simple-guide-for-everyday-shoppers': ['shopping-and-reviews', 'A guide for shoppers on judging product quality before buying.'],
  'how-long-cannabis-actually-lasts-shelf-life-for-flower-edibles-and-vapes': ['resources', 'A reference on the shelf life of flower, edibles and vapes.'],
  'why-cannabis-smells-so-strong-and-what-that-aroma-actually-means': ['cannabis-101', 'Explains cannabis aroma and terpenes: plant basics.'],
  'star-buds-now-open-in-summit-illinois': ['news-and-culture', 'Store news: the opening of Star Buds Summit, Illinois.'],
  'why-your-weed-hits-differently-every-time': ['cannabis-101', 'Explains why the same strain can feel different each time: terpenes, body chemistry, freshness.'],
  'the-art-of-the-perfect-pre-roll': ['cannabis-101', 'Explains what makes a good pre-roll and how to enjoy one: product basics.'],
  'got-too-high-here-s-how-to-come-back-down-star-buds-5-step-guide': ['cannabis-101', 'Consumer basics: what to do after taking too much.'],
  'benefits-of-regulated-thc-dispensaries-vs-intoxicating-hemp-products': ['shopping-and-reviews', 'Compares buying at a licensed dispensary with hemp-derived THC products: where to shop.'],
  'the-best-cannabis-products-for-a-chill-night-in': ['shopping-and-reviews', 'Product and strain picks for a night in.'],
  'beginner-s-guide-how-to-read-a-cannabis-label-like-a-pro': ['resources', 'A reference guide to reading a cannabis label.'],
  'cannabis-and-creativity-how-certain-strains-can-spark-your-next-great-idea': ['shopping-and-reviews', 'Strain picks for creative sessions.'],
  'star-buds-westmont-is-now-open': ['news-and-culture', 'Store news: the opening of Star Buds Westmont, Illinois.'],
  'which-strain-makes-you-laugh-the-most': ['shopping-and-reviews', 'Strain picks for laugh-out-loud moments.'],
  'unlock-the-power-of-cannabis-terpenes-aroma-effects-benefits': ['resources', 'A reference guide to the common terpenes.'],
  'dab-rig-cleaning-101-keep-your-setup-fresh-and-flavorful': ['cannabis-101', 'Gear-care basics: a step-by-step dab rig cleaning guide.'],
  'star-buds-buffalo-now-open-to-serve-western-new-york': ['news-and-culture', 'Store news: the opening of Star Buds Buffalo, New York.'],
  'star-buds-cannabis-dispensary-hoffman-estates-now-open': ['news-and-culture', 'Store news: the opening of Star Buds Hoffman Estates, Illinois.'],
  'the-status-of-cannabis-rescheduling-descheduling-in-2024-what-it-means-for-the-industry-and-consume': ['news-and-culture', 'Policy news: federal rescheduling and descheduling as of 2024.'],
  'the-current-status-of-cannabis-legalization-in-new-york-a-new-era-with-star-buds-coming-to-buffalo': ['news-and-culture', 'Policy and store news: legalization in New York and the Buffalo store.'],
  'cannabis-vs-delta-9-thc-understanding-the-differences': ['resources', 'A reference on cannabis-derived and hemp-derived delta-9 THC.'],
  'the-science-of-consumption-how-cannabis-is-absorbed-into-the-body-at-the-cellular-level': ['cannabis-101', 'Explains how cannabinoids are absorbed and act in the body: science basics.'],
  'from-ancient-roots-to-modern-times-the-rich-history-and-natural-habitat-of-cannabis': ['cannabis-101', 'The history and origins of the cannabis plant: plant basics.'],
  'roll-up-and-relax-the-ultimate-movie-guide-for-your-4-20-celebration': ['health-and-lifestyle', 'A 4/20 movie-night guide: cannabis and leisure.'],
  'unlocking-the-green-divide-deciphering-cannabis-vs-hemp': ['resources', 'A reference on how cannabis and hemp differ.'],
  'the-sleepy-side-of-cannabis-exploring-its-impact-on-sleep': ['health-and-lifestyle', 'About cannabis and sleep: a wellness topic.'],
  'demystifying-cannabis-concentrates-a-journey-from-plant-to-potent-extracts': ['resources', 'A reference guide to concentrates and how they are made.'],
  'artsy-promoting-art-to-the-world': ['news-and-culture', 'A company profile: Artsy, a Denver cannabis company.'],
  'specialty-gummies-that-will-change-the-way-you-think-about-edibles': ['shopping-and-reviews', 'Product picks: Wana gummy lines.'],
  'danksgiving-recipes': ['recipes', 'Infused Thanksgiving recipes.'],
  'q-a-with-a-cannabis-grower': ['cannabis-101', 'An interview with a grower about cultivation: plant basics.'],
  'hightails-to-elevate-your-summer-beverages': ['recipes', 'Infused cocktail recipes.'],
  'how-to-get-your-medical-cannabis-card': ['resources', 'A how-to reference on getting a medical cannabis card.'],
  'the-endocannabinoid-system-everything-you-need-to-know': ['cannabis-101', 'Explains the endocannabinoid system: science basics.'],
  'southern-alberta-researchers-say-medical-cannabis-could-help-fight-covid-19': ['news-and-culture', 'A news link-out: research reported in 2020.'],
  'tale-of-two-pot-dispensaries-coping-with-covid-19': ['news-and-culture', 'A news link-out: dispensaries during COVID-19 (2020).'],
  'eleven-senators-push-to-let-marijuana-businesses-access-federal-loan-programs': ['news-and-culture', 'A news link-out: federal policy (2020).'],
  'cannabis-chain-meets-challenges-of-covid-19-csa-interviews-star-buds-founder-and-ceo-br': ['news-and-culture', 'Press: an interview with the Star Buds founder and CEO (2020).'],
  'as-cities-declare-cannabis-an-essential-business-heres-how-businesses-are-rallying-to-hel': ['news-and-culture', 'A news link-out: cannabis as an essential business (2020).'],
  'legal-marijuana-is-a-positive-amenity-for-new-colorado-residents-study': ['news-and-culture', 'A news link-out: a Colorado study (2019).'],
  'fda-says-it-is-speeding-up-the-cbd-regulation-process': ['news-and-culture', 'A news link-out: federal CBD regulation (2019).'],
  'marijuana-legalization-could-be-on-the-horizon-for-british-virgin-islands': ['news-and-culture', 'A news link-out: legalization abroad (2019).'],
  'marijuana-decriminalization-officially-takes-effect-in-new-mexico': ['news-and-culture', 'A news link-out: state law (2019).'],
  'get-to-know-the-colorado-governor-running-for-president-starbuds-talks-cannabis-with-gove': ['news-and-culture', 'Politics: an interview with the governor of Colorado (2019).'],
  '420-christmas-thanksgiving-and-the-super-bowl-all-rolled-into-one': ['shopping-and-reviews', '4/20 product picks: flower, concentrate and edibles.'],
  'meet-your-new-friend-with-benefits-1906': ['shopping-and-reviews', 'A product review: 1906 edibles.'],
  'the-new-year-s-resolution-you-can-keep-cannabis-infused-gummies-for-your-daily-routine': ['shopping-and-reviews', 'Product picks: infused gummies for a daily routine.'],
  '3-things-you-didnt-know-about-canyon-cultivation': ['news-and-culture', 'A brand profile: Canyon Cultivation.'],
  '420-survival-guide': ['news-and-culture', '4/20 culture: a guide to the day (2018).'],
  'natives-guide-to-420': ['news-and-culture', '4/20 events and culture in Denver (2018).'],
  'getting-baked-with-loves-oven-an-interview-with-executive-chef-hope-frahm': ['news-and-culture', 'An interview with the executive chef of an edibles bakery.'],
  'snoop-bloggy-blog-the-evolution-of-snoop': ['news-and-culture', 'Culture: a profile of Snoop Dogg.'],
  'munchables-danksgiving-edition-featuring-binske-edibles': ['recipes', 'Infused Thanksgiving recipes.'],
  'cannabis-101-terpenes-an-interview-with-lucidmood': ['cannabis-101', 'A terpenes explainer, told as an interview: plant basics.'],
  'munchables-mile-high-pumpkin-spice-cookies-with-ripple-dissolvable-thc': ['recipes', 'An infused cookie recipe.'],
  'vendors-days-at-starbuds': ['news-and-culture', 'Store events: vendor days (2017).'],
  'phish-fans-rejoice-fluffhead-kush-is-here': ['news-and-culture', 'Store news: a strain release timed to a concert (2017).'],
  'dope-cup-2017': ['news-and-culture', 'Events: the 2017 Dope Cup.'],
  'competing-strains-for-dope-cup': ['news-and-culture', 'Events: the strains Star Buds entered in the 2017 Dope Cup.'],
  'fire-friday-aurora': ['news-and-culture', 'Store events: Aurora (2017).'],
  'grand-opening-event-commerce-city': ['news-and-culture', 'Store news: the Commerce City grand opening (2017).'],
  'colorado-dope-cup': ['news-and-culture', 'Events: Star Buds sponsors the 2017 Colorado Dope Cup.'],
  '710-events-in-denver-co': ['news-and-culture', 'Events: 7/10 in Denver (2017).'],
  'grand-opening-party-cc': ['news-and-culture', 'Store events: the Commerce City grand opening party (2017).'],
  'starbuds-commerce-city-now-open': ['news-and-culture', 'Store news: the Commerce City opening (2017).'],
  'how-to-be-the-perfect-host-for-first-time-cannabis-users': ['health-and-lifestyle', 'Hosting first-time users: cannabis and social life.'],
  'denver-420-rally-license-banned-for-3-years': ['news-and-culture', 'Local news: the Denver 4/20 rally permit (2017).'],
  '5-tips-to-host-a-cannabis-friendly-memorial-day-party': ['health-and-lifestyle', 'Party hosting tips: cannabis and social life.'],
  'the-race-for-governor-is-heating-upsee-what-canidate-noel-ginsburg-has-to-say': ['news-and-culture', 'Politics: a Colorado governor race (2017).'],
  '6-ways-to-enjoy-cannabis-without-flower': ['cannabis-101', 'Consumption methods beyond flower: basics.'],
  'ready-for-a-weed-friendly-cinco-de-mayo': ['health-and-lifestyle', 'A holiday celebration piece: cannabis and social life.'],
  'extended-hours-for-dispensaries-in-denver-county': ['news-and-culture', 'Local news: Denver dispensary hours (2017).'],
  'starbuds-countdown-to-420': ['news-and-culture', 'Events: a 4/20 event calendar for the Front Range (2017).'],
  'what-is-the-difference-between-indica-and-sativa-marijuana-plants': ['cannabis-101', 'Explains indica, sativa and hybrid plants: plant basics.'],
  'how-to-have-a-happy-valentines-day-with-cannabis': ['health-and-lifestyle', 'Date-night ideas: cannabis and relationships.'],
  'the-trump-administration-and-marijuana-reform-inevitable': ['news-and-culture', 'Politics: the federal reform outlook (2017).'],
  '10-lesser-known-uses-for-cbd': ['cannabis-101', 'A CBD explainer: uses of the compound.'],
  'five-facts-that-you-should-know-about-cbd': ['cannabis-101', 'A CBD explainer: five basics.'],
  'which-states-legalized-marijuana-in-2016': ['news-and-culture', 'Policy news: the 2016 ballot results.'],
  'does-marijuana-cure-an-alcohol-hangover': ['health-and-lifestyle', 'About cannabis and hangovers: a wellness topic.'],
  'marijuana-edibles-101-an-infographic': ['cannabis-101', 'An edibles explainer (an infographic): product basics.'],
  '14-gift-ideas-for-that-special-cannaseur-in-your-life': ['shopping-and-reviews', 'A gift guide.'],
  'cannabis-superstitions-do-you-know-them-all': ['news-and-culture', 'Culture: cannabis folklore and superstitions.'],
  'a-starbuds-guide-to-the-spookiest-halloween': ['shopping-and-reviews', 'Halloween strain picks.'],
  '10-ways-to-spot-a-stoner': ['health-and-lifestyle', 'A lighthearted piece about cannabis consumers at work.'],
  'stiletto-stoners-yep-moms-like-cannabis-too': ['health-and-lifestyle', 'Cannabis and parenting: moms who consume.'],
  'ten-tips-and-tricks-for-the-ultimate-stoner': ['cannabis-101', 'Practical consumer tips: gear and storage basics.'],
  'cannabis-vs-caffeine': ['health-and-lifestyle', 'Compares cannabis and caffeine: a wellness topic.'],
  '5-tips-to-safely-dose-and-enjoy-cannabis-edibles': ['resources', 'A dosing how-to for edibles.'],
  'cannabis-tinctures-101-what-are-they-how-to-make-them-and-how-to-use-them': ['resources', 'A reference guide to tinctures: what they are, how to make and use them.'],
  '5-ways-runners-can-incorporate-cannabis-into-their-training': ['health-and-lifestyle', 'Cannabis and fitness: running.'],
};

// posts that are NOT ported, with the reason (reported, never silent)
const OMIT = {
  '2017-holiday-gift-guide-for-the-cannabis-lover-in-your-life': 'the live post has a title, date and read time but no body: the capture of 2026-10-23 holds 0 blocks and 0 images (the raw HTML shows only the sidebar after the date)',
};

// ---------------------------------------------------------------- "Find your vibe" (REVISION-2 D9): reading links to
// posts genuinely about the topic, in the adopted menu's order; topics with no such post are left out (pain, energy,
// appetite). Labels name the article topic and never promise an effect.
const VIBES = [
  { topic: 'sleep', slug: 'the-sleepy-side-of-cannabis-exploring-its-impact-on-sleep', label: 'Read: cannabis and sleep' },
  { topic: 'laughter', slug: 'which-strain-makes-you-laugh-the-most', label: 'Read: strains and laughter' },
  { topic: 'a night in', slug: 'the-best-cannabis-products-for-a-chill-night-in', label: 'Read: a chill night in' },
  { topic: 'creativity', slug: 'cannabis-and-creativity-how-certain-strains-can-spark-your-next-great-idea', label: 'Read: cannabis and creativity' },
  { topic: 'CBD', slug: 'thc-cbd-cbn-more-understanding-the-most-common-cannabinoids', label: 'Read: CBD and other cannabinoids' },
];
const VIBES_LEFT_OUT = ['pain relief (no post is about pain; D9)', 'energy (no post is about it)', 'appetite (no post is about it; the recipes are recipes)'];

// ---------------------------------------------------------------- client flags (posts kept as published, D7)
const FLAGS = {
  'star-buds-now-open-in-summit-illinois': [['illinois', 'Illinois store opening; Illinois is outside the 12 shop stores (Star Buds Illinois is linked under More Star Buds)']],
  'star-buds-westmont-is-now-open': [['illinois', 'Illinois store opening (address, hours and grand-opening details of Westmont)']],
  'star-buds-cannabis-dispensary-hoffman-estates-now-open': [['illinois', 'Illinois store opening (Hoffman Estates)']],
  'star-buds-buffalo-now-open-to-serve-western-new-york': [['dated', 'store opening announcement (Dec 2024); Buffalo is one of the 12 shop stores, check the details against its store page']],
  'the-status-of-cannabis-rescheduling-descheduling-in-2024-what-it-means-for-the-industry-and-consume': [['dated', 'federal rescheduling status as of Sep 2024'], ['health', 'mentions medical benefits and treatments']],
  'the-current-status-of-cannabis-legalization-in-new-york-a-new-era-with-star-buds-coming-to-buffalo': [['dated', 'New York legalization status as of Aug 2024 and "coming to Buffalo" (the store has since opened)']],
  'southern-alberta-researchers-say-medical-cannabis-could-help-fight-covid-19': [['dated', 'COVID-19 news link-out (Apr 2020)'], ['health', 'headline says medical cannabis "could help fight COVID-19"']],
  'tale-of-two-pot-dispensaries-coping-with-covid-19': [['dated', 'COVID-19 news link-out (Apr 2020)']],
  'eleven-senators-push-to-let-marijuana-businesses-access-federal-loan-programs': [['dated', 'federal policy news link-out (Apr 2020)']],
  'cannabis-chain-meets-challenges-of-covid-19-csa-interviews-star-buds-founder-and-ceo-br': [['dated', 'COVID-19 press interview (Apr 2020)'], ['colorado', 'about the Colorado stores']],
  'as-cities-declare-cannabis-an-essential-business-heres-how-businesses-are-rallying-to-hel': [['dated', 'COVID-19 news link-out (Mar 2020)']],
  'legal-marijuana-is-a-positive-amenity-for-new-colorado-residents-study': [['dated', 'news link-out (Sep 2019)'], ['colorado', 'a Colorado study']],
  'fda-says-it-is-speeding-up-the-cbd-regulation-process': [['dated', 'federal CBD regulation news link-out (Jul 2019)']],
  'marijuana-legalization-could-be-on-the-horizon-for-british-virgin-islands': [['dated', 'news link-out (Jul 2019)']],
  'marijuana-decriminalization-officially-takes-effect-in-new-mexico': [['dated', 'state law news link-out (Jul 2019)']],
  'get-to-know-the-colorado-governor-running-for-president-starbuds-talks-cannabis-with-gove': [['dated', '2020 presidential campaign interview (Apr 2019)'], ['colorado', 'Colorado politics']],
  '420-survival-guide': [['dated', '4/20 2018 guide with a store price ($4.20)'], ['colorado', 'Denver 4/20 events and Colorado stores']],
  'natives-guide-to-420': [['dated', '4/20 2018 event guide'], ['colorado', 'Denver, Boulder and Red Rocks events']],
  'vendors-days-at-starbuds': [['dated', 'vendor-day schedule (Sep 2017)'], ['colorado', 'Colorado store events']],
  'phish-fans-rejoice-fluffhead-kush-is-here': [['dated', 'strain release tied to a 2017 concert'], ['colorado', 'Colorado concert and Commerce City store']],
  'dope-cup-2017': [['dated', '2017 competition recap'], ['colorado', 'Colorado event']],
  'competing-strains-for-dope-cup': [['dated', '2017 competition entries'], ['colorado', 'Colorado event'], ['health', 'strain notes mention pain and insomnia relief']],
  'fire-friday-aurora': [['dated', 'Aug 2017 store event with a deal'], ['colorado', 'Aurora store event']],
  'grand-opening-event-commerce-city': [['dated', 'Jul 2017 grand opening with prices'], ['colorado', 'Commerce City store']],
  'colorado-dope-cup': [['dated', 'Aug 2017 event announcement'], ['colorado', 'Colorado event']],
  '710-events-in-denver-co': [['dated', '7/10 2017 event list'], ['colorado', 'Denver events']],
  'grand-opening-party-cc': [['dated', 'Jul 2017 event announcement'], ['colorado', 'Commerce City store']],
  'starbuds-commerce-city-now-open': [['dated', 'Jun 2017 store opening'], ['colorado', 'Commerce City store']],
  'denver-420-rally-license-banned-for-3-years': [['dated', 'May 2017 local news'], ['colorado', 'Denver event']],
  'the-race-for-governor-is-heating-upsee-what-canidate-noel-ginsburg-has-to-say': [['dated', '2018 Colorado governor race (May 2017)'], ['colorado', 'Colorado politics']],
  'extended-hours-for-dispensaries-in-denver-county': [['dated', 'Apr 2017 local rule change'], ['colorado', 'Denver dispensary hours']],
  'starbuds-countdown-to-420': [['dated', '4/20 2017 event calendar with ticket prices'], ['colorado', 'Front Range events']],
  'the-trump-administration-and-marijuana-reform-inevitable': [['dated', 'federal reform outlook (Feb 2017)']],
  'which-states-legalized-marijuana-in-2016': [['dated', '2016 ballot results (Jan 2017)']],
  'five-facts-that-you-should-know-about-cbd': [['dated', 'says "CBD is still illegal" (Jan 2017)'], ['health', 'CBD medical benefits, cancer, epilepsy, anxiety and depression claims']],
  '10-lesser-known-uses-for-cbd': [['health', 'medical uses of CBD: addiction, diabetes, PTSD, insomnia, inflammation']],
  'how-to-get-your-medical-cannabis-card': [['dated', 'Missouri medical card steps and fees (Nov 2020; updated Sep 2024)'], ['state', 'Missouri is not a shop state'], ['health', 'lists qualifying medical conditions']],
  'the-endocannabinoid-system-everything-you-need-to-know': [['health', 'pain, anxiety, depression, epilepsy, glaucoma and cancer mentions']],
  'what-is-the-difference-between-indica-and-sativa-marijuana-plants': [['health', '"Benefits of Indica / Sativa" sections: pain, insomnia, anxiety, depression relief']],
  'cannabis-101-terpenes-an-interview-with-lucidmood': [['health', 'terpene effects on pain, insomnia, depression and inflammation']],
  'unlock-the-power-of-cannabis-terpenes-aroma-effects-benefits': [['health', 'terpene "benefits": pain relief, anxiety, inflammation']],
  'the-science-of-consumption-how-cannabis-is-absorbed-into-the-body-at-the-cellular-level': [['health', 'therapeutic, anti-inflammatory, anxiety and depression mentions']],
  'from-ancient-roots-to-modern-times-the-rich-history-and-natural-habitat-of-cannabis': [['health', 'historical treatment of pain, anxiety and inflammation']],
  'cannabis-vs-delta-9-thc-understanding-the-differences': [['health', 'therapeutic effects: pain, anxiety, nausea, appetite']],
  'unlocking-the-green-divide-deciphering-cannabis-vs-hemp': [['health', 'therapeutic properties: pain and anxiety relief']],
  'the-sleepy-side-of-cannabis-exploring-its-impact-on-sleep': [['health', 'cannabis as a sleep aid, insomnia and anxiety']],
  'cannabis-vs-caffeine': [['health', 'compares health effects: anxiety, insomnia, blood pressure, nausea']],
  'does-marijuana-cure-an-alcohol-hangover': [['health', 'hangover "cure", nausea and pain relief']],
  '5-ways-runners-can-incorporate-cannabis-into-their-training': [['health', 'pain, inflammation and nausea relief for runners']],
  'the-new-year-s-resolution-you-can-keep-cannabis-infused-gummies-for-your-daily-routine': [['health', 'gummies as pain reliever / therapeutic'], ['colorado', 'Colorado products']],
  'meet-your-new-friend-with-benefits-1906': [['health', 'edibles for sleep (a "sleep aid"), energy and relaxation'], ['colorado', 'Colorado brand and price']],
  'beginner-s-guide-how-to-read-a-cannabis-label-like-a-pro': [['health', 'label table lists "Pain Relief" and "Sleep Support"; anti-inflammatory mentions'], ['illinois', 'written for Star Buds Westmont, Illinois']],
  'specialty-gummies-that-will-change-the-way-you-think-about-edibles': [['colorado', 'Wana gummies for Colorado ("edibles-loving Coloradan")'], ['health', 'sleep and fitness gummy lines']],
  'got-too-high-here-s-how-to-come-back-down-star-buds-5-step-guide': [['illinois', 'mentions Star Buds Westmont, Illinois']],
  'cannabis-and-creativity-how-certain-strains-can-spark-your-next-great-idea': [['illinois', 'written for Star Buds Westmont, Illinois']],
  'the-best-cannabis-products-for-a-chill-night-in': [['illinois', 'written for Star Buds Westmont, Illinois']],
  'benefits-of-regulated-thc-dispensaries-vs-intoxicating-hemp-products': [['illinois', 'mentions Star Buds Westmont, Illinois']],
  'artsy-promoting-art-to-the-world': [['colorado', 'a Denver company']],
  'getting-baked-with-loves-oven-an-interview-with-executive-chef-hope-frahm': [['colorado', 'a Colorado bakery and its products']],
  '3-things-you-didnt-know-about-canyon-cultivation': [['colorado', 'a Colorado edibles brand']],
  'q-a-with-a-cannabis-grower': [['colorado', 'a Colorado wholesale grower']],
  'munchables-danksgiving-edition-featuring-binske-edibles': [['colorado', 'Colorado products (Binske)']],
  'a-starbuds-guide-to-the-spookiest-halloween': [['colorado', 'mentions Denver and Colorado']],
  'which-strain-makes-you-laugh-the-most': [['authorship', 'a post with the same title exists on the site whose architecture was adopted; bodies were not compared (D2): confirm Star Buds wrote it']],
};

// ---------------------------------------------------------------- small helpers
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const ZW = /[​-‍﻿]/g;
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };
const decode = (s) => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return Object.prototype.hasOwnProperty.call(NAMED, e.toLowerCase()) ? NAMED[e.toLowerCase()] : m;
});
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escText(s).replace(/"/g, '&quot;');
/** plain text of an inline-HTML fragment */
const plain = (html) => decode(String(html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(ZW, '').replace(/\s+/g, ' ').trim();
const norm = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** the new slug: the Wix slug without its /YYYY/MM/DD/ part; percent-escaped quotes (e2-80-98/99) dropped */
function slugOf(p) {
  const seg = p.replace(/^\/single-post\//, '').replace(/^\d{4}\/\d{2}\/\d{2}\//, '');
  return seg.toLowerCase().replace(/-e2-80-9[8c]/g, '-').replace(/-e2-80-9[9d]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

/** the published date as the live page showed it: "Dec 31, 2016" (year-less "Jul 9" = this year; read from the ISO
 *  date in Mountain time, the site's zone) -> { date: '2016-12-31', dateText: 'Dec 31, 2016' } */
function pubDate(post) {
  const t = String(post.dateText || '').trim();
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})(?:,\s*(\d{4}))?$/.exec(t);
  const iso = new Date(post.date);
  if (!m) { if (isNaN(iso)) die('no date for a post'); const d = new Date(iso.getTime() - 7 * 3600e3); return { date: d.toISOString().slice(0, 10), dateText: `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}` }; }
  const mon = MON.indexOf(m[1]);
  if (mon < 0) die('bad dateText ' + t);
  const year = m[3] ? Number(m[3]) : new Date(iso.getTime() - 7 * 3600e3).getUTCFullYear();
  return { date: `${year}-${String(mon + 1).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`, dateText: `${m[1]} ${Number(m[2])}, ${year}` };
}

// ---------------------------------------------------------------- the capture
const files = fs.readdirSync(PAGES).filter((f) => /^single-post__.+\.json$/.test(f)).sort();
const posts = [];
const skipped = [];
for (const f of files) {
  const p = read(path.join(PAGES, f));
  if (p.kind === 'redirect') { skipped.push({ source: f, reason: 'redirect: ' + (p.redirect?.note || p.redirect?.to || '') }); continue; }
  if (p.kind !== 'post' || !p.post) { skipped.push({ source: f, reason: 'not a post (kind ' + p.kind + ')' }); continue; }
  posts.push({ file: f, page: p, slug: slugOf(p.path) });
}
// duplicate slugs: the later post gets its year appended (none in the 2026-10-23 capture; the check stays)
const seen = new Map();
for (const x of posts.sort((a, b) => String(a.page.post.date).localeCompare(String(b.page.post.date)) || a.file.localeCompare(b.file))) {
  if (seen.has(x.slug)) { const y = String(x.page.post.date).slice(0, 4); console.warn(`port-blog: duplicate slug ${x.slug} (${seen.get(x.slug)} and ${x.file}): using ${x.slug}-${y}`); x.slug = `${x.slug}-${y}`; }
  seen.set(x.slug, x.file);
}

// live listing cross-check: every post the live blog listed exists in the capture
const listed = new Set();
for (const f of fs.readdirSync(PAGES).filter((n) => /^blog(__page__\d+)?\.json$/.test(n))) for (const q of read(path.join(PAGES, f)).posts || []) listed.add(String(q.path).toLowerCase());
const have = new Set(posts.map((x) => x.page.path.toLowerCase()));
const notCaptured = [...listed].filter((q) => !have.has(q));
if (notCaptured.length) die('listed on the live blog but not captured: ' + notCaptured.join(', '));

// Wix categories + tags: membership = the listing minus the sidebar widget (the posts listed on every such page)
const tagPages = fs.readdirSync(PAGES).filter((n) => /^blog__(categories|tags)__.+\.json$/.test(n)).sort().map((n) => ({ n, p: read(path.join(PAGES, n)) }));
const lists = tagPages.map(({ p }) => (p.posts || []).map((q) => String(q.path).toLowerCase()));
const widget = new Set(lists.length ? lists[0].filter((q) => lists.every((l) => l.includes(q))) : []);
const tagsByPath = new Map();
for (const { p } of tagPages) {
  const name = String(p.title || '').split('|')[0].trim();
  if (!name) continue;
  for (const q of p.posts || []) { const k = String(q.path).toLowerCase(); if (widget.has(k)) continue; if (!tagsByPath.has(k)) tagsByPath.set(k, []); tagsByPath.get(k).push(name); }
}

// every post has a category (or a reason to be left out), and the tables name no unknown post
const slugs = new Set(posts.map((x) => x.slug));
for (const k of [...Object.keys(ASSIGN), ...Object.keys(OMIT), ...Object.keys(FLAGS), ...VIBES.map((v) => v.slug)]) if (!slugs.has(k)) die('table names a post that is not in the capture: ' + k);
for (const x of posts) {
  if (OMIT[x.slug]) continue;
  const a = ASSIGN[x.slug];
  if (!a) die('no category for ' + x.slug + ' (' + x.file + ')');
  if (!CAT.has(a[0])) die('unknown category ' + a[0] + ' for ' + x.slug);
}
const ported = posts.filter((x) => !OMIT[x.slug]);
const hrefOf = (x) => `/blog/${ASSIGN[x.slug][0]}/${x.slug}/`;
const POSTMAP = new Map(ported.map((x) => [x.page.path.toLowerCase().replace(/\/+$/, ''), hrefOf(x)]));

// ---------------------------------------------------------------- links
const STATES = { '/mississippi': '/dispensaries/mississippi/', '/oklahoma': '/dispensaries/oklahoma/', '/maryland': '/dispensaries/maryland/', '/newyork': '/dispensaries/new-york/', '/new-york': '/dispensaries/new-york/' };
const PAGEMAP = { '/': '/', '/locations': '/dispensaries/', '/blog': '/blog/', '/rewards': '/rewards/', '/deals': '/deals/', '/md-deals': '/dispensaries/maryland/deals/', '/ok-deals': '/dispensaries/oklahoma/deals/', '/about': '/about-us/', '/contact': '/contact/', '/careers': '/careers/', '/community': '/community/', '/media': '/media/', '/cancerreliefprogram': '/cancer-relief-program/', '/eula': '/eula/', '/products': '/products/' };
const linkLog = { mapped: 0, absolute: 0, external: 0, dropped: 0, list: [] };
/** an href from the capture -> this site's href, an absolute starbuds.us URL, the external URL as published, or null (drop the link, keep its text) */
function mapHref(raw, where) {
  const h = decode(raw).trim();
  if (!h || h === '#' || /^javascript:/i.test(h)) { linkLog.dropped++; linkLog.list.push(['dropped', h, where]); return null; }
  if (/^(mailto|tel):/i.test(h)) return h;
  let u;
  try { u = new URL(h, 'https://www.starbuds.us/'); } catch { linkLog.dropped++; linkLog.list.push(['dropped (unparseable)', h, where]); return null; }
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'starbuds.us') {
    const p = decodeURIComponent(u.pathname).toLowerCase().replace(/\/+$/, '') || '/';
    const to = POSTMAP.get(p) || STATES[p] || PAGEMAP[p];
    if (to) { linkLog.mapped++; linkLog.list.push(['mapped', h, where, to]); return to + (u.hash || ''); }
    const abs = 'https://www.starbuds.us' + u.pathname + u.search + u.hash;
    linkLog.absolute++; linkLog.list.push(['absolute', h, where, abs]);
    return abs;
  }
  linkLog.external++;
  return h;
}

/** inline HTML -> only <a href>, <strong>, <em>, <br>; every other tag dropped (its text kept); text verbatim */
function inline(html, where) {
  let s = String(html || '').replace(ZW, '').replace(/&nbsp;|&#160;| /gi, ' ');
  // anchors first (they do not nest): map the href, drop empty or whitespace-only links
  s = s.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (m, at, inner) => {
    if (!plain(inner)) return ' ';
    const hm = /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(at);
    const to = hm ? mapHref(hm[2] ?? hm[3] ?? hm[4] ?? '', where) : null;
    return to ? `\u0001a href="${escAttr(to)}"\u0002${inner}\u0001/a\u0002` : inner;
  });
  s = s
    .replace(/<br\s*\/?>/gi, '\u0001br\u0002')
    .replace(/<(\/?)(strong|b)\b[^>]*>/gi, (m, c) => `\u0001${c}strong\u0002`)
    .replace(/<(\/?)(em|i)\b[^>]*>/gi, (m, c) => `\u0001${c}em\u0002`)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');
  // anything left that looks like markup is text: escape it
  s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u0001/g, '<').replace(/\u0002/g, '>');
  // tidy: empty inline pairs, whitespace runs, edge <br>s
  for (let i = 0; i < 3; i++) s = s.replace(/<(strong|em)>\s*<\/\1>/g, ' ');
  s = s.replace(/\s+/g, ' ').replace(/^(\s*<br>\s*)+|(\s*<br>\s*)+$/g, '').replace(/(\s*<br>\s*){3,}/g, '<br><br>').trim();
  return plain(s) ? s : '';
}

// ---------------------------------------------------------------- images
const imIndex = read(path.join(SRC, 'docs/data/images.json'));
const keyOf = (u) => { let s = String(u).trim().split('#')[0].split('?')[0].replace(/^(?:https?:)?\/\/(?:www\.)?starbuds\.us/i, ''); try { s = decodeURIComponent(s); } catch { /* keep */ } return s.toLowerCase(); };
const byUrl = new Map();
for (const r of [...imIndex.images].sort((a, b) => String(a.url).localeCompare(String(b.url)))) {
  if (!r.file) continue;
  for (const u of [r.url, ...(r.aliases || [])]) if (u && !byUrl.has(keyOf(u))) byUrl.set(keyOf(u), r);
}
const jobs = new Map(); // output file -> { src, w, full }
const photoCache = new Map();
/** a live image URL -> { src, w, h, srcset: [{ src, w }] } (src = the largest variant) */
function photo(url, where) {
  if (photoCache.has(url)) return photoCache.get(url);
  const r = byUrl.get(keyOf(url));
  if (!r) die(`image not in the harvest (${where}): ${url}`);
  const file = path.join(SRC, r.file);
  if (!fs.existsSync(file)) die('downloaded original missing: ' + r.file);
  const buf = fs.readFileSync(file);
  const W = Number(r.width), H = Number(r.height);
  if (!W || !H) die('no size for ' + r.file);
  const h12 = sha(buf).slice(0, 12);
  const ws = [...new Set(WIDTHS.map((w) => Math.min(w, W)))].sort((a, b) => a - b);
  const set = ws.map((w) => { const name = `${h12}-${w}.webp`; jobs.set(name, { src: file, w, full: w >= W }); return { src: IMG_URL + name, w, h: Math.round((H * w) / W) }; });
  const big = set[set.length - 1];
  const out = { src: big.src, w: big.w, h: big.h, srcset: set.map((v) => ({ src: v.src, w: v.w })), small: set[0], ratio: W / H, origW: W };
  photoCache.set(url, out);
  return out;
}
const imgBlock = (b, where) => {
  const ph = photo(b.src, where);
  const o = { t: 'img', src: ph.src, w: ph.w, h: ph.h, srcset: ph.srcset, alt: plain(b.alt || '') };
  const cap = plain(b.caption || '');
  if (cap) o.caption = cap;
  if (b.href) { const to = mapHref(b.href, where); if (to) o.href = to; }
  return o;
};

// ---------------------------------------------------------------- blocks
const unknown = {};
const deadGallery = [];
const CAMERA_NAME = /^(P|IMG_?|DSC_?N?|_MG_)\d{4,}$/i;
/** Wix blocks -> normalized blocks */
function normalize(x) {
  const post = x.page.post;
  const title = plain(x.page.h1 || '');
  const where = x.slug;
  const levels = post.blocks.filter((b) => b && b.t === 'heading' && plain(b.html)).map((b) => Number(b.level) || 2);
  const top = levels.length ? Math.min(...levels) : 2;
  const out = [];
  for (const b of post.blocks) {
    if (!b || !b.t) continue;
    if (b.t === 'image') { if (b.src) out.push(imgBlock(b, where)); continue; }
    if (b.t === 'heading') {
      const h = inline(String(b.html || ''), where);
      if (!h) continue;
      if (norm(h) === norm(title)) continue; // the h1 again
      const only = /^\s*(?:<strong>)?<a href="([^"]*)">([\s\S]*)<\/a>(?:<\/strong>)?\s*$/.exec(h);
      if (only && !/<a\b/.test(only[2])) { out.push({ t: 'link', href: decode(only[1]), text: plain(only[2]) }); continue; }
      out.push({ t: (Number(b.level) || 2) <= top ? 'h2' : 'h3', html: h });
      continue;
    }
    if (b.t === 'list') {
      const items = (b.items || []).map((i) => inline(typeof i === 'string' ? i : (i && i.html) || '', where)).filter(Boolean);
      // the residue of a dead Wix gallery: a list of nothing but camera file names ("P1012394"), its images gone
      if (items.length && items.every((i) => CAMERA_NAME.test(plain(i)))) { deadGallery.push({ post: where, items: items.length }); continue; }
      if (items.length) out.push({ t: b.ordered ? 'ol' : 'ul', items });
      continue;
    }
    if (b.t === 'rich' || b.t === 'html') {
      const html = String(b.html || '');
      if (/<table\b/i.test(html)) {
        const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => [...m[1].matchAll(/<t([dh])\b[^>]*>([\s\S]*?)<\/t\1>/gi)].map((c) => inline(c[2], where)));
        if (rows.length) out.push({ t: 'table', head: true, rows });
        continue;
      }
      // block-level pieces in document order: blockquotes and paragraphs (headings or divs inside rich text read as p)
      const parts = [];
      const re = /<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>|<(p|h[1-6]|div)\b[^>]*>([\s\S]*?)<\/\2>/gi;
      let m, last = 0;
      while ((m = re.exec(html))) {
        const gap = html.slice(last, m.index);
        if (plain(gap)) parts.push({ t: 'p', html: inline(gap, where) });
        if (m[1] != null) {
          const q = [...m[1].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((pp) => inline(pp[1], where)).filter(Boolean);
          const qh = q.length ? q.join('<br><br>') : inline(m[1], where);
          if (qh) parts.push({ t: 'quote', html: qh });
        } else parts.push({ t: 'p', html: inline(m[3], where) });
        last = re.lastIndex;
      }
      const tail = html.slice(last);
      if (plain(tail)) parts.push({ t: 'p', html: inline(tail, where) });
      for (const pp of parts) if (pp.html) out.push(pp);
      continue;
    }
    unknown[b.t] = (unknown[b.t] || 0) + 1; // dead embeds and other widgets are dropped (none in this capture)
  }
  return out;
}

/** the excerpt: the opening paragraph text (verbatim words), clipped at a word boundary */
function excerptOf(blocks, max = 190) {
  let s = '';
  for (const b of blocks) {
    if (b.t !== 'p' && b.t !== 'quote') continue;
    s = (s ? s + ' ' : '') + plain(b.html);
    if (s.length >= 120) break;
  }
  if (!s) for (const b of blocks) { if (b.t === 'h2' || b.t === 'h3' || b.t === 'ul' || b.t === 'ol' || b.t === 'link') { s = plain(b.html || b.text || (b.items || []).join(' ')); if (s) break; } }
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, '').replace(/[\s,;:.\-–—]+$/, '') + '…';
}

// ---------------------------------------------------------------- build the records
const records = [];
for (const x of ported) {
  const post = x.page.post;
  const [category, categoryReason] = ASSIGN[x.slug];
  let blocks = normalize(x);
  const { date, dateText } = pubDate(post);
  // the hero: the Wix cover image when it is photo-sized (>= 800 px wide, not taller than 3:2 portrait) and the first
  // image of the body with at most two paragraphs before it; it is then shown in the article header and taken out of
  // the body (shown once). Otherwise it stays where the post put it.
  let hero = null;
  if (post.hero && post.hero.src) {
    const ph = photo(post.hero.src, x.slug);
    const firstImgAt = blocks.findIndex((b) => b.t === 'img');
    const textBefore = blocks.slice(0, Math.max(0, firstImgAt)).filter((b) => b.t === 'p').length;
    if (firstImgAt >= 0 && blocks[firstImgAt].src === ph.src && ph.origW >= 800 && ph.ratio >= 0.66 && textBefore <= 2) {
      const b = blocks[firstImgAt];
      hero = { src: b.src, w: b.w, h: b.h, srcset: b.srcset, alt: b.alt || '' };
      if (b.caption) hero.caption = b.caption;
      blocks = blocks.filter((_, i) => i !== firstImgAt);
    }
  }
  // the card image: the Wix cover, else the first body image, else none (the card shows the brand panel)
  let image = null;
  const coverUrl = post.hero && post.hero.src ? post.hero.src : (post.blocks.find((b) => b && b.t === 'image' && b.src) || {}).src;
  if (coverUrl) { const ph = photo(coverUrl, x.slug); image = { src: ph.small.src, w: ph.small.w, h: ph.small.h, alt: '', srcset: ph.srcset.map((v) => `${v.src} ${v.w}w`).join(', ') }; }
  const tagNames = [...new Set([...(post.categories || []).map((c) => plain(c.name)), ...(tagsByPath.get(x.page.path.toLowerCase()) || [])].filter(Boolean))];
  const tags = [];
  for (const t of tagNames) if (!tags.some((u) => u.toLowerCase() === t.toLowerCase())) tags.push(t);
  const updated = post.updatedText ? String(post.updatedText).replace(/^Updated:\s*/i, '').trim() : '';
  records.push({
    slug: x.slug,
    category,
    categoryReason,
    title: plain(x.page.h1),
    date,
    dateText,
    ...(updated ? { updated } : {}),
    ...(post.readTime ? { readTime: plain(post.readTime) } : {}),
    excerpt: excerptOf(blocks),
    tags,
    hero,
    image,
    blocks,
    source: x.file,
    legacyPath: x.page.path,
  });
}
records.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

const index = {
  note: 'Generated by tools/port-blog.mjs from the starbuds.us capture of 2026-10-23. Newest first.',
  categories: CATEGORIES.map((c) => ({ slug: c.slug, label: c.label, href: `/blog/${c.slug}/`, blurb: c.blurb, count: records.filter((r) => r.category === c.slug).length })),
  posts: records.map((r) => ({ slug: r.slug, title: r.title, href: `/blog/${r.category}/${r.slug}/`, date: r.date, dateText: r.dateText, category: r.category, categoryLabel: CAT.get(r.category).label, excerpt: r.excerpt, image: r.image })),
};
const bySlug = new Map(records.map((r) => [r.slug, r]));
const vibes = {
  note: 'Find your vibe: Star Buds articles by topic. Reading links only (the live menus cannot filter by feeling), and no label promises an effect. Left out for lack of a post on the topic: ' + VIBES_LEFT_OUT.join('; ') + '.',
  items: VIBES.map((v) => { const r = bySlug.get(v.slug); return { label: v.label, href: `/blog/${r.category}/${r.slug}/`, title: r.title, topic: v.topic }; }),
};

// ---------------------------------------------------------------- write (or check)
const outputs = new Map();
const json = (o) => JSON.stringify(o, null, 2) + '\n';
for (const r of records) outputs.set(path.join(OUT_JSON, r.slug + '.json'), json(r));
outputs.set(path.join(OUT_JSON, 'index.json'), json(index));
outputs.set(path.join(OUT_JSON, 'vibes.json'), json(vibes));

let drift = 0;
if (CHECK) {
  for (const [f, s] of outputs) if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== s) { drift++; console.log('differs: ' + path.relative(ROOT, f)); }
  for (const f of fs.existsSync(OUT_JSON) ? fs.readdirSync(OUT_JSON) : []) if (!outputs.has(path.join(OUT_JSON, f))) { drift++; console.log('stale: src/content/blog/' + f); }
  for (const n of jobs.keys()) if (!fs.existsSync(path.join(OUT_IMG, n))) { drift++; console.log('missing image: ' + n); }
  for (const f of fs.existsSync(OUT_IMG) ? fs.readdirSync(OUT_IMG) : []) if (!jobs.has(f)) { drift++; console.log('stale image: ' + f); }
} else {
  fs.mkdirSync(OUT_JSON, { recursive: true });
  for (const f of fs.readdirSync(OUT_JSON)) if (f.endsWith('.json') && !outputs.has(path.join(OUT_JSON, f))) fs.rmSync(path.join(OUT_JSON, f));
  for (const [f, s] of outputs) if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== s) fs.writeFileSync(f, s);
  fs.mkdirSync(OUT_IMG, { recursive: true });
  for (const f of fs.readdirSync(OUT_IMG)) if (!jobs.has(f)) fs.rmSync(path.join(OUT_IMG, f));
  const todo = [...jobs].filter(([n]) => !fs.existsSync(path.join(OUT_IMG, n))).sort((a, b) => a[0].localeCompare(b[0]));
  const run = (args) => new Promise((res) => { const p = spawn('cwebp', args, { stdio: ['ignore', 'ignore', 'pipe'] }); let e = ''; p.stderr.on('data', (d) => { e += d; }); p.on('error', (er) => res({ code: -1, e: String(er) })); p.on('close', (code) => res({ code, e })); });
  let i = 0; const failed = [];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < todo.length) {
      const [name, j] = todo[i++];
      const tmp = path.join(OUT_IMG, name + '.part');
      const r = await run([...CWEBP, ...(j.full ? [] : ['-resize', String(j.w), '0']), j.src, '-o', tmp]);
      if (r.code === 0 && fs.existsSync(tmp)) fs.renameSync(tmp, path.join(OUT_IMG, name)); else { fs.rmSync(tmp, { force: true }); failed.push(name + ': ' + r.e.trim().slice(0, 160)); }
    }
  }));
  if (failed.length) die('cwebp failed:\n  ' + failed.join('\n  '));
  console.log(`images: ${jobs.size} WebP files (${todo.length} encoded now) in assets/photos/blog/`);
}

// ---------------------------------------------------------------- flags + report
const flagged = records.filter((r) => FLAGS[r.slug]).map((r) => ({ title: r.title, date: r.dateText, href: `/blog/${r.category}/${r.slug}/`, flags: FLAGS[r.slug].map(([kind, why]) => ({ kind, why })) }));
const report = { generated: 'tools/port-blog.mjs', posts: records.length, omitted: Object.entries(OMIT).map(([slug, why]) => ({ slug, why })), skipped, flagged, links: linkLog.list.filter((l) => l[0] !== 'external'), unknownBlocks: unknown, deadGallery };
if (!CHECK) { fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'tmp/blog-r2-flags.json'), json(report)); }
const count = {}; for (const r of records) count[r.category] = (count[r.category] || 0) + 1;
const types = {}; for (const r of records) for (const b of r.blocks) types[b.t] = (types[b.t] || 0) + 1;
console.log(`port-blog: capture ${files.length} files -> ${posts.length} posts (${skipped.length} skipped: ${skipped.map((s) => s.reason).join('; ')}) -> ${records.length} ported, ${Object.keys(OMIT).length} omitted`);
console.log('categories: ' + CATEGORIES.map((c) => `${c.slug} ${count[c.slug] || 0}`).join(', '));
console.log('blocks: ' + Object.entries(types).map(([k, v]) => `${k} ${v}`).join(', ') + (Object.keys(unknown).length ? ' | dropped unknown: ' + JSON.stringify(unknown) : '') + (deadGallery.length ? ' | dropped dead-gallery file-name lists: ' + deadGallery.map((d) => `${d.post} (${d.items})`).join(', ') : ''));
console.log(`heroes ${records.filter((r) => r.hero).length}, card images ${records.filter((r) => r.image).length}, tags on ${records.filter((r) => r.tags.length).length} posts | links mapped ${linkLog.mapped}, absolute ${linkLog.absolute}, external ${linkLog.external}, dropped ${linkLog.dropped} | vibes ${vibes.items.length} | flagged ${flagged.length}`);
if (CHECK) { console.log(drift ? `check: ${drift} difference(s)` : 'check: up to date'); process.exit(drift ? 1 : 0); }
