/**
 * pages/classes.js - the class index (#/classes) and one class's page (#/classes/<id>).
 *
 * The classes themselves come from data/classes.js and the DM page.
 */
import { loadClasses, loadSubclasses, subclassesOf, isDM } from '../api.js';
import { replaceQuery } from '../nav.js';
import { esc, icon, paragraphs, optionTags, debounce, openDialog } from '../ui.js';
import { subclassDetail } from '../details.js';
import { ABILITIES } from '../rules/constants.js';
import * as F from '../rules/formulas.js';

const ability = (key) => ABILITIES.find((a) => a.key === key)?.name || key;
const POOL = { full: 'Full caster', partial: 'Partial caster (about 65%)', martial: 'Martial (about 40%)' };

export async function render(main, { params, query }) {
  const classes = await loadClasses();
  await loadSubclasses();
  const one = params[0] && classes.find((c) => c.id === params[0]);
  if (params[0] && !one) {
    main.innerHTML = `<div class="empty">${icon('shield')}<h2>Class not found</h2><a class="btn primary" href="#/classes">All classes</a></div>`;
    return;
  }
  return one ? renderClass(main, one, query) : renderIndex(main, classes, query);
}

// ── Index ────────────────────────────────────────────────────────────────────
function renderIndex(main, classes, query) {
  const f = { q: query.get('q') || '', pool: query.get('pool') || '', invocation: query.get('invocation') || '' };

  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">Who will you be?</p>
      <h1>Classes</h1>
      <hr class="rule">
      <p class="lead">Every class available at this table. Open one to see its features, subclasses and how it plays with Arcane Compositry.</p>
    </div>
    <form class="filters three" role="search" id="filters">
      <div class="field search"><label for="q">Search</label>
        <div class="search">${icon('search')}<input id="q" type="search" placeholder="Class, subclass or feature" value="${esc(f.q)}" autocomplete="off"></div></div>
      <div class="field"><label for="pool">Mana pool</label>
        <select id="pool"><option value="">Any</option>${optionTags(Object.entries(POOL).map(([value, label]) => ({ value, label })), f.pool)}</select></div>
      <div class="field"><label for="invocation">Invocation ability</label>
        <select id="invocation"><option value="">Any</option>${optionTags(ABILITIES.map((a) => ({ value: a.key, label: a.name })), f.invocation)}</select></div>
    </form>
    <div class="row between">
      <p class="muted" id="count" role="status" aria-live="polite"></p>
      <div class="row"><button class="btn sm ghost" id="clear" type="button">Clear filters</button>
        ${isDM() ? `<a class="btn sm" href="#/dm?tab=classes&list=classes">${icon('plus')}Add a class</a>` : ''}</div>
    </div>
    <div class="grid cols-auto" id="list"></div>`;

  const $ = (sel) => main.querySelector(sel);
  function matches(c) {
    if (f.pool && c.caster !== f.pool) return false;
    if (f.invocation && c.invocation !== f.invocation) return false;
    if (f.q) {
      const haystack = [c.name, c.role, c.description, c.primaryAbility, c.tags.join(' '), c.features.map((x) => x.name).join(' '), subclassesOf(c).map((s) => `${s.name} ${s.description} ${s.features.map((x) => x.name).join(' ')}`).join(' ')].join(' ').toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  }
  function draw() {
    const shown = classes.filter(matches);
    $('#count').textContent = `${shown.length} of ${classes.length} classes`;
    $('#list').innerHTML = shown.length
      ? shown.map((c) => `<a class="card" href="#/classes/${esc(c.id)}">
          <p class="kicker">d${c.hitDie} · ${esc(POOL[c.caster].split(' (')[0])}${c.origin === 'file' ? '' : ' · Custom'}${c.hidden ? ' · Hidden from players' : ''}</p>
          <h3>${esc(c.name)}</h3>
          <p class="muted">${esc(c.role)}</p>
          <p class="small"><b>Primary:</b> ${esc(c.primaryAbility || ability(c.invocation))}<br><b>Invocation:</b> ${esc(ability(c.invocation))}</p>
          ${subclassesOf(c).length ? `<div class="chips">${subclassesOf(c).map((s) => `<span class="chip static">${esc(s.name)}</span>`).join('')}</div>` : ''}
        </a>`).join('')
      : `<div class="empty span-all">${icon('search')}<h2>No classes match</h2><p>Try a different search or clear a filter.</p></div>`;
    replaceQuery('/classes', f);
  }
  const onFilter = () => { for (const key of Object.keys(f)) f[key] = $(`#${key}`).value.trim(); draw(); };
  $('#filters').addEventListener('submit', (e) => e.preventDefault());
  $('#filters').addEventListener('change', onFilter);
  $('#q').addEventListener('input', debounce(onFilter, 150));
  $('#clear').addEventListener('click', () => { for (const key of Object.keys(f)) { f[key] = ''; $(`#${key}`).value = ''; } draw(); });
  draw();
}

// ── One class ────────────────────────────────────────────────────────────────
function renderClass(main, c, query) {
  const subclasses = subclassesOf(c);
  const stat = (label, value) => (value ? `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>` : '');
  // Group features by level. Every row of one level shares a background (class "alt" on
  // every other level), so the tall Level cell always matches the rows beside it.
  const levels = [...new Set(c.features.map((x) => x.level))];

  main.innerHTML = `
    <a class="btn ghost sm" href="#/classes">${icon('back')}All classes</a>
    <div class="page-head">
      <p class="kicker">Class${c.origin === 'file' ? '' : ' · Custom'}${c.hidden ? ' · Hidden from players' : ''}</p>
      <h1>${esc(c.name)}</h1>
      <hr class="rule">
      <p class="lead">${esc(c.role)}</p>
      <div class="row">
        <a class="btn primary" href="#/characters/new?class=${encodeURIComponent(c.name)}">${icon('plus')}Create a ${esc(c.name)}</a>
        <a class="btn" href="#/spells/codified?class=${encodeURIComponent(c.name)}">${icon('scroll')}${esc(c.name)} spells</a>
        ${isDM() ? `<a class="btn" href="#/dm?tab=classes&list=classes">${icon('edit')}Edit on the DM page</a>` : ''}
      </div>
    </div>

    <div class="sidebar-layout wide-side">
      <div class="stack">
        <section class="prose">${paragraphs(c.description)}</section>

        ${c.compositry ? `<section class="dark-box"><h3>In Arcane Compositry</h3>${paragraphs(c.compositry)}</section>` : ''}

        ${c.features.length ? `<section><h2>Class features</h2>
          <div class="table-wrap"><table class="grouped">
            <thead><tr><th class="c">Level</th><th>Feature</th><th>What it does</th></tr></thead>
            <tbody>${levels.map((lvl, group) => c.features.filter((x) => x.level === lvl).map((x, i, all) => `<tr${group % 2 ? '' : ' class="alt"'}>
              ${i === 0 ? `<td class="c" rowspan="${all.length}"><b>${lvl}</b></td>` : ''}
              <td><b>${esc(x.name)}</b></td><td>${esc(x.text)}</td></tr>`).join('')).join('')}</tbody>
          </table></div></section>` : ''}

        <section id="subclasses"><h2>Subclasses</h2>
          <p class="muted">Tap a subclass to see everything it adds to the ${esc(c.name)}.
            ${isDM() ? `<a href="#/dm?tab=classes&list=subclasses">Add a custom subclass</a>` : ''}</p>
          ${subclasses.length ? `<div class="grid cols-2">${subclasses.map((s) => `<button type="button" class="card subclass-card" data-subclass="${esc(s.id)}">
            <span class="kicker">${s.features.length ? `Features at level${new Set(s.features.map((x) => x.level)).size > 1 ? 's' : ''} ${[...new Set(s.features.map((x) => x.level))].join(', ')}` : 'Subclass'}${s.quick || s.origin === 'file' ? '' : ' · Custom'}${s.hidden ? ' · Hidden from players' : ''}</span>
            <strong class="spell-name">${esc(s.name)}</strong>
            <span class="muted">${esc(s.description)}</span>
            ${s.features.length ? `<span class="small">${esc(s.features.map((x) => x.name).join(' · '))}</span>` : ''}
            <span class="subclass-more">View details ${icon('chevron')}</span>
          </button>`).join('')}</div>` : `<div class="empty"><p>No subclasses have been added for this class yet.</p></div>`}
        </section>

        ${c.source ? `<p class="fine">Source: ${esc(c.source)}. Feature text is a short summary - see your rulebook for exact wording.</p>` : ''}
      </div>

      <aside class="stack sticky">
        <section class="panel"><header><h3>Core traits</h3></header><div class="panel-body">
          <dl class="stat-grid one">
            ${stat('Primary ability', c.primaryAbility)}
            ${stat('Hit Die', `d${c.hitDie} per level`)}
            ${stat('Saving throws', c.saves.map(ability).join(', '))}
            ${stat('Skills', c.skills || `Choose ${c.skillPicks}`)}
            ${stat('Weapons', c.weapons)}${stat('Armor', c.armor)}${stat('Tools', c.tools)}
            ${stat('Starting equipment', c.equipment)}
          </dl></div></section>
        <section class="panel"><header><h3>Arcane numbers</h3></header><div class="panel-body">
          <dl class="stat-grid one">
            ${stat('Invocation ability', ability(c.invocation))}
            ${stat('Mana pool', POOL[c.caster])}
            ${stat('Max Mana at level 1 / 5 / 10 / 20', [1, 5, 10, 20].map((l) => F.maxMana(l, c.caster)).join(' / '))}
          </dl></div></section>
      </aside>
    </div>`;

  const openSubclass = (id) => {
    const sub = subclasses.find((x) => x.id === id);
    if (!sub) return;
    openDialog({
      ...subclassDetail(sub, c),
      footer: `<a class="btn" href="#/characters/new?class=${encodeURIComponent(c.name)}" data-close>${icon('plus')}Create a ${esc(c.name)}</a><button class="btn primary" data-close>Back to ${esc(c.name)}</button>`,
    });
  };
  main.addEventListener('click', (e) => {
    const card = e.target.closest('[data-subclass]');
    if (card) openSubclass(card.dataset.subclass);
  });
  // A link such as #/classes/fighter?subclass=champion opens that subclass straight away.
  if (query.get('subclass')) openSubclass(query.get('subclass'));
}
