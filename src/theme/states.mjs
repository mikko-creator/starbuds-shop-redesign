// states.mjs - LOCATIONS lane (revision 3, "Starlight"): the dispensary pages of the revision 2 target architecture
// (docs/REVISION-2.md): /dispensaries/ (H1, the store finder map as "Star Buds dispensaries near you", the state
// groups of store cards, "More Star Buds"), /dispensaries/<state>/ (state hubs: store cards, deals, quick links, the
// state FAQ) and /dispensaries/<state>/deals/ (only for states with captured Star Buds deals: MS, OK, MD).
// Copy: site.json (states, stores, deals, rewards), faq.json and the store visit Q&As, verbatim, plus neutral UI glue.
// New York has no captured deals: no deals page, and its hub points to the store page and its live menu.
// Revision 3 look (docs/REVISION-3.md): glass hero panels on the night sky, frosted cards, star sparkles and floating
// cut-* product cut-outs (sky / spark / pill / line / starMark come from stores.mjs).
// Classes: sh- (state pages, hub), st- (shared store card and state groups, styled in stores.css).
import { page, esc, icon, btn, glass, patch, seal, cutout, reveal } from './shell.mjs';
import { stateHref, dealsHref, lawsHref, cardHref, dealsFor, hasDealsPage, listJoin, shortName, EXT, stateOf, crumbs, storeCard, cardGrid, stateFaq, faqList, sky, spark, pill, line, starMark } from './stores.mjs';

const finderMod = await import('./finder.mjs').catch((e) => { console.warn('warning: states: finder.mjs failed to load: ' + (e && e.message)); return null; });

const TZ = { MS: 'America/Chicago', OK: 'America/Chicago', MD: 'America/New_York', NY: 'America/New_York' };
/** per state: the product cut-out of its groups and bands */
const STATE_CUT = { MS: 'cut-bud', OK: 'cut-jar', MD: 'cut-gummies', NY: 'cut-preroll' };
/** the cut-out that floats in the state hero, inside a halo */
const HERO_ART = { MS: 'cut-bud', OK: 'cut-jar', MD: 'cut-gummies', NY: 'cut-preroll' };
/** D6: Star Buds' own sites for the states outside the shop (external links only; no store facts are carried over) */
const MORE = [
  { name: 'Star Buds Colorado', state: 'Colorado', code: 'CO', href: 'https://www.starbudscolorado.com/' },
  { name: 'Star Buds Illinois', state: 'Illinois', code: 'IL', href: 'https://starbudsillinois.us/' },
];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ---------- deal pieces (site.json deals[], verbatim; prices and percentages highlighted, no word changed) ----------
const WEEK = ['SUN', 'MON', 'TUES', 'WEDNES', 'THURS', 'FRI', 'SATUR'];
/** weekday index (0 = Sunday) named in a captured deal-day label such as "MUNCHEEZMONDAY" or "BIG SAVINGS SUNDAY" */
const weekday = (label) => { const m = /(SUN|MON|TUES|WEDNES|THURS|FRI|SATUR)DAY/i.exec(String(label).replace(/\s+/g, '')); return m ? WEEK.indexOf(m[1].toUpperCase()) : -1; };
const hl = (escaped) => escaped.replace(/(\$\d[\d,.]*|\d+%(?:\s*OFF)?)/gi, '<mark class="sh-hl">$1</mark>');
function dealText(text) {
  const m = /^(.*?)\s*(\([^)]*\))\s*$/.exec(String(text));
  return hl(esc(m ? m[1] : String(text))) + (m ? ` <span class="sh-fine">${esc(m[2])}</span>` : '');
}
const dayRows = (d) => (d.days && d.days.length ? d.days : (d.items || []).map((line) => { const m = /^([^:]{3,40}):\s*(.+)$/.exec(line); return m ? { day: m[1], deal: m[2] } : { day: '', deal: line }; }));
const terms = (t) => (t ? `<p class="sh-terms">${esc(t)}</p>` : '');

/** the "Today" marker, set by TODAY_JS in the state's time zone */
const TODAY_JS = `(function(){var el=document.querySelector('[data-sh-tz]');if(!el||!window.Intl)return;var wd;try{wd=new Intl.DateTimeFormat('en-US',{timeZone:el.getAttribute('data-sh-tz'),weekday:'short'}).format(new Date())}catch(e){return}var i=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(wd);if(i<0)return;[].forEach.call(document.querySelectorAll('[data-sh-dow="'+i+'"]'),function(r){r.classList.add('is-today');var t=r.querySelector('[data-sh-today]');if(t)t.hidden=false})})();`;

function board(d, tag) {
  const rows = dayRows(d);
  return `
      <article class="sh-board"${reveal('up')}>
        <header class="sh-board__head">
          ${tag ? `<p class="sh-board__tag">${patch(tag[0], { tone: tag[1], size: 'sm' })}</p>` : ''}
          <h3 class="sh-board__title">${esc(d.title)}</h3>
          ${d.intro ? `<p class="sh-board__intro">${esc(d.intro)}</p>` : ''}
        </header>
        <ol class="sh-board__rows" role="list">${rows.map((r) => `
          <li class="sh-row"${weekday(r.day) >= 0 ? ` data-sh-dow="${weekday(r.day)}"` : ''}>
            <p class="sh-row__day"><span>${esc(r.day)}</span><span class="patch patch--red patch--sm sh-row__today" data-sh-today hidden><span class="patch__text">Today</span></span></p>
            <p class="sh-row__deal">${dealText(r.deal)}</p>
          </li>`).join('')}
        </ol>
        ${terms(d.terms)}
      </article>`;
}
function dealCard(d, tag) {
  return glass(`
        ${tag ? `<p class="sh-dcard__tag">${patch(tag[0], { tone: tag[1], size: 'sm' })}</p>` : ''}
        <h3 class="sh-dcard__title">${esc(d.title)}</h3>
        ${d.intro ? `<p class="sh-dcard__intro">${hl(esc(d.intro))}</p>` : ''}
        ${(d.items || []).length ? `<ul class="sh-dcard__list" role="list">${d.items.map((i) => `<li>${dealText(i)}</li>`).join('')}</ul>` : ''}
        ${terms(d.terms)}`, { cls: 'sh-dcard', attrs: { 'data-reveal': 'up' } });
}
const TAG = { daily: null, medical: ['Medical', 'green'], 'new-medical': ['Medical', 'green'], 'early-bird': ['Morning', 'bone'], community: ['Every day', 'gold'] };
const isBoard = (d) => (d.days && d.days.length) || (d.items || []).some((l) => /^[A-Z][A-Z ]{2,40}:\s/.test(l) && weekday(l.split(':')[0]) >= 0);

/** the visit Q&A sentence on discounts, quoted from the state's store pages (OK, MD), with the stores that carry it */
function discountLine(ctx, code) {
  const SENT = 'We are happy to provide our MED card holders and veterans with a discount upon request.';
  const who = ctx.stores.filter((s) => s.state === code && (s.visit || []).some((v) => String(v.a).includes(SENT)));
  if (!who.length) return '';
  return `<blockquote class="sh-quoteblock"><p>“${esc(SENT)}”</p><footer>${esc(who.length === 1 ? shortName(who[0]) + ' store page' : 'Star Buds ' + listJoin(who.map((s) => s.city)) + ' store pages')}</footer></blockquote>`;
}

// ---------- shared: state chips and the hub's state groups ----------
function stateChip(ctx, g) {
  const n = g.stores.length;
  return `<li><a class="st-filter__chip" href="${esc(stateHref(g.state.code))}">
            <span class="st-filter__name" aria-hidden="true">${esc(g.state.name)}</span>
            <span class="sr-only">${esc(g.state.name)} dispensaries, </span><span class="st-filter__n"><span class="st-filter__num">${n}</span><span class="sr-only"> ${n === 1 ? 'location' : 'locations'}</span></span>
          </a></li>`;
}

function groupBlock(ctx, g, gi) {
  const st = g.state;
  const cutA = STATE_CUT[st.code] || 'cut-leaf';
  const k = g.stores.length;
  return `
    <div class="st-group st-group--n${Math.min(k, 4)}" id="state-${esc(st.code.toLowerCase())}">
      <header class="st-group__head"${reveal('up')}>
        <h3 class="st-group__title"><a class="st-group__link" href="${esc(stateHref(st.code))}"><span class="sr-only">${esc(st.name)} dispensaries</span><span class="st-group__name" aria-hidden="true">${esc(st.name)}</span></a></h3>
        <div class="st-group__meta">
          ${patch(st.code, { tone: 'green', size: 'sm' })}
          <p class="st-group__count"><span class="st-group__num">${k}</span> ${k === 1 ? 'location' : 'locations'}</p>
        </div>
        ${st.blurb ? `<p class="st-group__blurb">${esc(st.blurb)}</p>` : ''}
        <p class="st-group__more"><a class="link-arrow" href="${esc(stateHref(st.code))}">${esc(st.name)} dispensaries${icon('arrow')}</a></p>
        ${cutout(cutA, { cls: 'st-group__cut', depth: 0, float: gi % 2 ? 'fast' : 'slow', rotate: gi % 2 ? 8 : -10, sizes: '(max-width: 700px) 25vw, 160px' })}
      </header>
      <ul class="st-grid${k === 4 ? ' st-grid--4' : ''}${k === 1 ? ' st-grid--1' : ''}" role="list" data-stagger>${g.stores.map((s) => `<li>${storeCard(ctx, s, { level: 'h4', ...(k === 1 ? { sizes: '(max-width: 700px) 88vw, (max-width: 1100px) 44vw, 600px' } : k === 4 ? { sizes: '(max-width: 700px) 88vw, (max-width: 1199px) 44vw, 290px' } : {}) })}</li>`).join('')}
      </ul>
    </div>`;
}
/** consecutive single-store states share a row (st-duo) so a lone card does not leave half the page empty */
function groupBlocks(ctx, groups) {
  const out = [];
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].stores.length === 1 && groups[i + 1] && groups[i + 1].stores.length === 1) {
      out.push(`<div class="st-duo">${groupBlock(ctx, groups[i], i)}${groupBlock(ctx, groups[i + 1], i + 1)}</div>`);
      i++;
    } else out.push(groupBlock(ctx, groups[i], i));
  }
  return out.join('');
}

function moreStarBuds({ level = 'h2', cls = '' } = {}) {
  const h = level;
  const sub = level === 'h2' ? 'h3' : 'h4';
  return `
<section class="section sh-more on-dark${cls ? ' ' + cls : ''}" aria-labelledby="sh-more-title">
  <div class="plane-back">${sky('teal')}</div>
  <div class="wrap sh-more__grid">
    <div class="sh-more__head"${reveal('up')}>
      <p class="sh-more__eyebrow">${patch('Beyond the shop', { tone: 'gold', icon: 'star', size: 'sm' })}</p>
      <${h} id="sh-more-title" class="h-display sh-more__title">More <span class="gold-text">Star Buds</span></${h}>
      <p class="lead sh-more__lead">Star Buds Colorado and Star Buds Illinois have their own websites.</p>
    </div>
    <ul class="sh-more__list" role="list" data-stagger>${MORE.map((m) => `
      <li>${glass(`
        ${pill(m.state, { hidden: true, cls: 'sh-more__rocker' })}
        <${sub} class="sh-more__name">${esc(m.name)}</${sub}>
        <p class="sh-more__url">${esc(m.href.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''))}</p>
        ${btn(`Visit ${m.name}`, m.href, { variant: 'gold', size: 'sm', icon: 'external', attrs: EXT })}`, { lift: true, cls: 'sh-more__card' })}</li>`).join('')}
    </ul>
  </div>
  ${spark('sh-more__patch', 30)}
</section>`;
}

// ---------- /dispensaries/ ----------
function hub(ctx) {
  const groups = ctx.storesByState;
  const n = ctx.stores.length;
  const states = groups.map((g) => g.state.name);
  const hero = `
<section class="section st-hero sh-hero on-dark" aria-labelledby="sh-title">
  <div class="plane-back">${sky('hero')}</div>
  <div class="wrap sh-hero__crumbs">${crumbs([{ label: 'Home', href: '/' }, { label: 'Dispensaries' }])}</div>
  <div class="wrap st-hero__grid">
    ${glass(`
      <p class="st-hero__eyebrow">${patch('Dispensaries', { tone: 'gold', icon: 'pin' })}</p>
      <h1 id="sh-title" class="st-hero__title">Star Buds <span class="gold-text st-hero__brand">Dispensaries</span></h1>
      ${line('st-hero__rule')}
      <p class="lead st-hero__lead">${n} Star Buds dispensaries in ${esc(listJoin(states))}. Pick a state for its stores, deals and questions, or find a store on the map.</p>
      <nav class="st-filter" aria-label="Dispensaries by state">
        <p class="st-filter__label">Dispensaries by state</p>
        <ul class="st-filter__list" role="list">
          ${groups.map((g) => stateChip(ctx, g)).join('')}
        </ul>
      </nav>
      <p class="sh-hero__map"><a class="link-arrow" href="#locations">Find a store on the map${icon('arrow')}</a></p>`, { cls: 'st-hero__panel', attrs: { 'data-reveal': 'up' } })}
    <div class="st-hero__art" aria-hidden="true">
      <span class="st-hero__ring"></span>
      ${starMark(ctx, 'st-hero__wings', { eager: true })}
      ${seal({ label: String(n), sub: 'Locations', tone: 'gold', cls: 'st-hero__seal' })}
      ${spark('st-hero__spark st-hero__spark--a', 26)}${spark('st-hero__spark st-hero__spark--b', 16)}${spark('st-hero__spark st-hero__spark--c', 12)}
    </div>
  </div>
  <div class="st-hero__front" aria-hidden="true">
    ${cutout('cut-vape', { cls: 'st-hero__bud', depth: 0.12, eager: true, float: 'slow', rotate: 14, sizes: '(max-width: 700px) 36vw, 280px' })}
  </div>
</section>`;

  let finder = '';
  if (finderMod && typeof finderMod.finderSection === 'function') {
    try {
      finder = finderMod.finderSection(ctx, { eyebrow: 'Store finder', title: 'Star Buds dispensaries near you', cls: 'sh-finder' });
    } catch (e) { console.warn('warning: states: finderSection threw: ' + e.message); }
  }

  const list = `
<section class="section st-list sh-states on-dark" id="by-state" aria-label="Star Buds dispensaries by state">
  <div class="plane-back">${sky('dusk')}</div>
  <div class="wrap">
    <p class="st-list__shown">${icon('star')}<span>${plural(n, 'dispensary', 'dispensaries')} in ${groups.length} states</span></p>
    ${groupBlocks(ctx, groups)}
  </div>
</section>`;

  return {
    path: '/dispensaries/',
    html: page({
      ctx, path: '/dispensaries/', bodyClass: 'page-dispensaries', title: 'Dispensaries',
      description: `All ${n} Star Buds dispensaries in ${listJoin(states)}: a store map, addresses, phone numbers, hours and the live menu for each store.`,
      body: hero + finder + list + moreStarBuds(),
      scripts: finder ? ['finder.js'] : [],
    }),
  };
}

// ---------- /dispensaries/<state>/ ----------
function stateHero(ctx, g, { deals = false } = {}) {
  const st = g.state;
  const code = st.code;
  const n = g.stores.length;
  const cutB = HERO_ART[code] || 'cut-bud';
  const trail =[{ label: 'Home', href: '/' }, { label: 'Dispensaries', href: '/dispensaries/' }, { label: st.name, href: stateHref(code) }];
  if (deals) trail.push({ label: 'Deals' });
  else trail[2] = { label: st.name };
  const capturedH1 = { OK: 'Marijuana Deals at Star Buds Oklahoma', MD: 'Marijuana Deals at Star Buds Baltimore' }[code];
  const daily = dealsFor(ctx, code).find((d) => d.group === 'daily');
  const title = deals
    ? `${esc(st.name)} <span class="gold-text sh-shero__accent">deals</span> and discounts`
    : `${esc(st.name)} <span class="gold-text sh-shero__accent">Dispensaries</span>`;
  const lead = deals
    ? [capturedH1 ? `<p class="sh-shero__kicker">${esc(capturedH1)}</p>` : '', daily && daily.scope ? `<p class="sh-shero__scope">${icon('pin')}<span>As listed on the Star Buds Oxford store page; ask your store whether a deal applies there.</span></p>` : '', daily && daily.note ? `<p class="sh-shero__note">${icon('star')}<span>${esc(daily.note)}</span></p>` : ''].join('')
    : `${st.blurb ? `<p class="lead sh-shero__lead">${esc(st.blurb)}</p>` : ''}<p class="sh-shero__count">${plural(n, 'Star Buds dispensary', 'Star Buds dispensaries')} in ${esc(st.name)}.</p>`;
  const ctas = deals
    ? `${btn(`${st.name} dispensaries`, stateHref(code), { variant: 'gold', icon: 'pin' })}${btn('All deals', '/deals/', { variant: 'ghost', icon: 'tag' })}`
    : `${hasDealsPage(ctx, code) ? btn(`${st.name} deals`, dealsHref(code), { variant: 'gold', icon: 'tag' }) : ''}${btn('Find a store on the map', '/dispensaries/#locations', { variant: 'ghost', icon: 'pin' })}`;
  return `
<section class="section sh-shero on-dark${deals ? ' sh-shero--deals' : ''}" aria-labelledby="sh-title">
  <div class="plane-back">${sky(deals ? 'rose' : 'hero')}</div>
  <div class="wrap sh-shero__crumbs">${crumbs(trail)}</div>
  <div class="wrap sh-shero__grid">
    <div class="sh-shero__copy"${reveal('up')}>
      <div class="sh-shero__tags">${pill(st.name, { cls: 'sh-shero__rocker' })}${patch(deals ? `Deals · ${code}` : code, { tone: deals ? 'red' : 'green', size: 'sm', icon: deals ? 'tag' : undefined })}</div>
      <h1 id="sh-title" class="sh-shero__title">${title}</h1>
      ${line('sh-shero__rule')}
      ${lead}
      <div class="btn-row sh-shero__cta">${ctas}</div>
    </div>
    <div class="sh-shero__art" aria-hidden="true">
      <span class="sh-shero__ring"></span>
      ${cutout(cutB, { cls: 'sh-shero__patch', depth: 0.06, float: 'slow', rotate: -6, eager: true, sizes: '(max-width: 900px) 50vw, 360px' })}
      ${seal({ label: deals ? String(dealsFor(ctx, code).length) : String(n), sub: deals ? (dealsFor(ctx, code).length === 1 ? 'Deal group' : 'Deal groups') : (n === 1 ? 'Location' : 'Locations'), tone: deals ? 'red' : 'gold', cls: 'sh-shero__seal' })}
      ${spark('sh-shero__spark sh-shero__spark--a', 24)}${spark('sh-shero__spark sh-shero__spark--b', 14)}
    </div>
  </div>
</section>`;
}

function stateStores(ctx, g) {
  const st = g.state;
  return `
<section class="section sh-sstores on-dark" aria-labelledby="sh-stores-title">
  <div class="plane-back">${sky('dusk')}</div>
  <div class="wrap">
    <div class="sh-sec__head">
      <p class="sh-sec__eyebrow"${reveal('fade')}>${patch(st.code, { tone: 'green', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sh-stores-title" class="h-display sh-sec__title sheen"${reveal('up', 1)}>Star Buds dispensaries in ${esc(st.name)}</h2>
    </div>
    ${cardGrid(ctx, g.stores, { cls: 'sh-sstores__grid' })}
  </div>
</section>`;
}

function stateDealsBand(ctx, g) {
  const st = g.state;
  const code = st.code;
  const deals = dealsFor(ctx, code);
  const community = deals.find((d) => d.group === 'community');
  const disc = discountLine(ctx, code);
  let body;
  if (deals.length) {
    const daily = deals.find((d) => d.group === 'daily');
    body = `
      <ul class="sh-dgroups" role="list" data-stagger>${deals.filter((d) => d.group !== 'community').map((d) => {
        const rows = isBoard(d) ? dayRows(d).length : (d.items || []).length;
        return `<li>${glass(`
        ${TAG[d.group] ? `<p class="sh-dcard__tag">${patch(TAG[d.group][0], { tone: TAG[d.group][1], size: 'sm' })}</p>` : ''}
        <h3 class="sh-dgroups__title">${esc(d.title)}</h3>
        ${d.intro ? `<p class="sh-dgroups__intro">${hl(esc(d.intro))}</p>` : ''}
        ${rows ? `<p class="sh-dgroups__n"><span class="sh-dgroups__num">${rows}</span> ${isBoard(d) ? (rows === 1 ? 'day' : 'days') : (rows === 1 ? 'line' : 'lines')}</p>` : ''}`, { cls: 'sh-dgroups__card' })}</li>`;
      }).join('')}
      </ul>
      ${daily && daily.scope ? `<p class="sh-scope">${icon('pin')}<span>The Mississippi daily deals are listed on the Star Buds Oxford store page.</span></p>` : ''}
      <div class="btn-row sh-dband__cta">${btn(`See ${st.name} deals`, dealsHref(code), { variant: 'gold', icon: 'tag' })}${btn('All deals', '/deals/', { variant: 'ghost' })}</div>`;
  } else {
    const one = g.stores.length === 1 ? g.stores[0] : null;
    body = `
      <p class="lead sh-dband__none">${one ? `Check the ${esc(shortName(one))} store page and its live menu for current offers.` : `Check your store's page and its live menu for current offers.`}</p>
      <div class="btn-row sh-dband__cta">${one ? `${btn(`${shortName(one)} store page`, `/stores/${one.slug}/`, { variant: 'gold', icon: 'pin' })}${btn('Live menu', one.liveUrl, { variant: 'ghost', icon: 'external', attrs: EXT })}` : ''}${btn('All deals', '/deals/', { variant: 'ghost' })}</div>`;
  }
  const groupDisc = community || disc ? `
    <div class="sh-gdisc"${reveal('up', 1)}>
      <h3 class="sh-gdisc__title">Group discounts</h3>
      ${community ? `<div class="sh-gdisc__row">${seal({ label: (/(\d+%)/.exec(community.intro || '') || [])[1] || '%', sub: 'Every day', tone: 'gold', cls: 'sh-gdisc__seal' })}<div><p class="sh-gdisc__intro">${hl(esc(community.intro))}</p><ul class="sh-ticks" role="list">${community.items.map((i) => `<li>${icon('star')}<span>${esc(i)}</span></li>`).join('')}</ul></div></div>` : ''}
      ${disc}
    </div>` : '';
  return `
<section class="section sh-dband on-dark" aria-labelledby="sh-dband-title">
  <div class="plane-back">${sky('rose')}</div>
  <div class="wrap">
    <div class="sh-sec__head">
      <p class="sh-sec__eyebrow"${reveal('fade')}>${patch(`Deals · ${code}`, { tone: 'red', icon: 'tag', size: 'sm' })}</p>
      <h2 id="sh-dband-title" class="h-display sh-sec__title"${reveal('up', 1)}>Dispensary deals</h2>
    </div>
    <div class="sh-dband__grid${groupDisc ? '' : ' sh-dband__grid--solo'}">
      <div class="sh-dband__main">${body}</div>
      ${groupDisc}
    </div>
  </div>
  ${cutout(STATE_CUT[code] || 'cut-bud', { cls: 'sh-dband__cut', depth: 0.1, float: 'slow', rotate: 12, sizes: '(max-width: 700px) 28vw, 200px' })}
</section>`;
}

function stateLinks(ctx, g) {
  const st = g.state;
  const code = st.code;
  const tiles = [
    [`Cannabis laws in ${st.name}`, lawsHref(code), 'State laws'],
    [`Getting a medical card in ${st.name}`, cardHref(code), 'Medical card'],
    hasDealsPage(ctx, code) ? [`${st.name} deals`, dealsHref(code), 'Deals'] : null,
    ['Higher Rewards', '/rewards/', 'Rewards'],
    ['Dispensary guide', '/dispensary-guides/', 'Guide'],
    ['Frequently asked questions', '/faq/', 'FAQ'],
  ].filter(Boolean);
  const others = ctx.storesByState.filter((x) => x.state.code !== code);
  return `
<section class="section sh-links on-dark" aria-labelledby="sh-links-title">
  <div class="plane-back">${sky('green')}</div>
  <div class="wrap">
    <div class="sh-sec__head">
      <p class="sh-sec__eyebrow"${reveal('fade')}>${patch(st.name, { tone: 'leather', size: 'sm' })}</p>
      <h2 id="sh-links-title" class="h-display sh-sec__title"${reveal('up', 1)}>Quick links</h2>
    </div>
    <ul class="sh-tiles" role="list" data-stagger>${tiles.map(([label, href, kicker], i) => `
      <li><a class="sh-tile" href="${esc(href)}"><span class="sh-tile__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="sh-tile__kicker">${esc(kicker)}</span><span class="sh-tile__label">${esc(label)}</span>${icon('arrow', 'sh-tile__arrow')}</a></li>`).join('')}
    </ul>
    <div class="sh-others"${reveal('up')}>
      <p class="sh-others__label">Other Star Buds states</p>
      <ul class="sh-others__list" role="list">${others.map((x) => `<li><a class="chip" href="${esc(stateHref(x.state.code))}">${icon('pin')}${esc(x.state.name)}</a></li>`).join('')}<li><a class="chip" href="/dispensaries/">${icon('star')}All dispensaries</a></li></ul>
    </div>
  </div>
</section>`;
}

function stateFaqSection(ctx, g) {
  const st = g.state;
  const items = stateFaq(ctx, st.code, { visit: true });
  if (!items.length) return '';
  return `
<section class="section sh-faq sh-faq--dark on-dark" id="state-faq" aria-labelledby="sh-faq-title">
  <div class="plane-back">${sky('dusk')}</div>
  <div class="wrap sh-faq__wrap">
    <div class="sh-faq__head">
      <p class="sh-faq__eyebrow"${reveal('fade')}>${patch('FAQ', { tone: 'gold', size: 'sm' })}</p>
      <h2 id="sh-faq-title" class="h-display sh-faq__title"${reveal('up', 1)}>${esc(st.name)} dispensary <span class="sh-acr">FAQs</span></h2>
      <p class="sh-faq__more"${reveal('up', 2)}><a class="link-arrow" href="/faq/">All questions${icon('arrow')}</a></p>
    </div>
    ${faqList(items, { name: 'sh-faq-' + st.code.toLowerCase() })}
  </div>
  ${cutout('cut-leaf', { cls: 'sh-faq__flash', depth: 0.1, float: 'slow', rotate: -8, sizes: '(max-width: 700px) 110px, 200px' })}
</section>`;
}

function statePage(ctx, g) {
  const st = g.state;
  const p = stateHref(st.code);
  const body = [stateHero(ctx, g), stateStores(ctx, g), stateDealsBand(ctx, g), stateLinks(ctx, g), stateFaqSection(ctx, g)].join('\n');
  return {
    path: p,
    html: page({
      ctx, path: p, bodyClass: 'page-state',
      title: `${st.name} Dispensaries`,
      description: `${plural(g.stores.length, 'Star Buds dispensary', 'Star Buds dispensaries')} in ${st.name}: ${listJoin(g.stores.map((s) => s.city))}. Addresses, hours, deals and answers to common questions.`,
      body,
    }),
  };
}

// ---------- /dispensaries/<state>/deals/ ----------
function dealsPage(ctx, g) {
  const st = g.state;
  const code = st.code;
  const p = dealsHref(code);
  const deals = dealsFor(ctx, code);
  const community = deals.find((d) => d.group === 'community');
  const rest = deals.filter((d) => d !== community);
  const disc = discountLine(ctx, code);
  const boards = rest.filter(isBoard);
  const cards = rest.filter((d) => !isBoard(d));
  const main = `
<section class="section sh-deals on-dark" aria-labelledby="sh-deals-title" data-sh-tz="${esc(TZ[code] || 'America/Chicago')}">
  <div class="plane-back">${sky('dusk')}</div>
  <div class="wrap">
    <div class="sh-sec__head">
      <p class="sh-sec__eyebrow"${reveal('fade')}>${patch(st.name, { tone: 'leather', icon: 'tag', size: 'sm' })}</p>
      <h2 id="sh-deals-title" class="h-display sh-sec__title"${reveal('up', 1)}>Dispensary deals</h2>
    </div>
    <div class="sh-boards${boards.length === 1 ? ' sh-boards--1' : ''}">${boards.map((d) => board(d, TAG[d.group])).join('')}</div>
    ${cards.length ? `<div class="sh-dcards">${cards.map((d) => dealCard(d, TAG[d.group])).join('')}</div>` : ''}
  </div>
  ${cutout(STATE_CUT[code] || 'cut-bud', { cls: 'sh-deals__cut', depth: -0.1, float: 'slow', rotate: 10, sizes: '(max-width: 700px) 30vw, 220px' })}
</section>`;
  const groupDisc = community || disc ? `
<section class="section sh-gsec on-dark" aria-labelledby="sh-gsec-title">
  <div class="plane-back">${sky('green')}</div>
  <div class="wrap sh-gsec__grid">
    <div class="sh-sec__head">
      <p class="sh-sec__eyebrow"${reveal('fade')}>${patch('Discounts', { tone: 'gold', icon: 'star', size: 'sm' })}</p>
      <h2 id="sh-gsec-title" class="h-display sh-sec__title"${reveal('up', 1)}>Group discounts</h2>
    </div>
    <div class="sh-gsec__body"${reveal('up', 2)}>
      ${community ? glass(`${seal({ label: (/(\d+%)/.exec(community.intro || '') || [])[1] || '%', sub: 'Every day', tone: 'gold', cls: 'sh-gdisc__seal' })}<h3 class="sh-dcard__title">${esc(community.title)}</h3><p class="sh-gdisc__intro">${hl(esc(community.intro))}</p><ul class="sh-ticks" role="list">${community.items.map((i) => `<li>${icon('star')}<span>${esc(i)}</span></li>`).join('')}</ul>${terms(community.terms)}`, { cls: 'sh-gsec__card' }) : ''}
      ${disc}
    </div>
  </div>
</section>` : '';
  const shops = `
<section class="section sh-wshop on-dark" aria-labelledby="sh-wshop-title">
  <div class="plane-back">${sky()}</div>
  <div class="wrap">
    <div class="sh-sec__head">
      <p class="sh-sec__eyebrow"${reveal('fade')}>${patch(code, { tone: 'green', icon: 'pin', size: 'sm' })}</p>
      <h2 id="sh-wshop-title" class="h-display sh-sec__title"${reveal('up', 1)}>Star Buds dispensaries in ${esc(st.name)}</h2>
    </div>
    ${cardGrid(ctx, g.stores, { cls: 'sh-wshop__grid' })}
    <div class="btn-row sh-wshop__all">${btn(`${st.name} dispensaries`, stateHref(code), { variant: 'gold', icon: 'pin' })}${btn('Higher Rewards', '/rewards/', { variant: 'ghost', icon: 'star' })}</div>
  </div>
</section>`;
  return {
    path: p,
    html: page({
      ctx, path: p, bodyClass: 'page-state-deals',
      title: `${st.name} deals and discounts`,
      description: `Star Buds ${st.name} deals as published by Star Buds: ${deals.map((d) => d.title).join('; ')}.`,
      body: [stateHero(ctx, g, { deals: true }), main, groupDisc, shops].join('\n') + `\n<script>${TODAY_JS}</script>`,
    }),
  };
}

export function render(ctx) {
  const out = [hub(ctx)];
  for (const g of ctx.storesByState) {
    out.push(statePage(ctx, g));
    if (hasDealsPage(ctx, g.state.code)) out.push(dealsPage(ctx, g));
  }
  return out;
}
