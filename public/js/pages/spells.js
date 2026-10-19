/**
 * pages/spells.js - the two spell indexes:
 *   #/spells/codified     normal D&D spells
 *   #/spells/compositry   custom Compositions codified at the table
 *
 * Filters are kept in the address (?class=Wizard&school=Evocation...) so a
 * filtered list can be bookmarked or shared, and ?spell=<id> opens one spell.
 *
 * The spells themselves come from data/spells/*.js and the DM page.
 */
import { api, loadSpells, state, isDM, campaignHref } from '../api.js';
import { replaceQuery } from '../nav.js';
import { esc, icon, paragraphs, openDialog, optionTags, toast, debounce } from '../ui.js';
import { SCHOOLS, CLASS_NAMES, ROMAN, ANY_CLASS } from '../rules/constants.js';
import { codifiedSpellMana } from '../rules/formulas.js';
import { classAllowed } from '../rules/character.js';
import { addSpellToCharacter } from '../spellbook.js';
import { spellDetail } from '../details.js';

const LIST_INFO = {
  codified: { title: 'Codified Spells', kicker: 'Ancient codifications', blurb: 'Existing D&D spells are already-optimized magical formulas. They keep their normal statistics and replace spell slots with Mana.' },
  compositry: { title: 'Compositry Spells', kicker: 'Invented at this table', blurb: 'Compositions that have been refined and codified during the campaign. The list grows as players make Arcane Discoveries.' },
};
const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;

export async function render(main, { params, query }) {
  const listName = params[0] || 'codified';
  const info = LIST_INFO[listName];
  const isCodified = listName === 'codified';
  const spells = (await loadSpells())[listName];
  const characters = state.user ? (await api('GET', '/characters')).characters : [];

  // Current filter values (read from the address so they survive a refresh).
  const f = {
    q: query.get('q') || '',
    class: query.get('class') || '',
    school: query.get('school') || '',
    level: query.get('level') || '',
    char: query.get('char') || '',
  };
  if (!characters.some((c) => c.id === f.char)) f.char = '';

  const levels = [...new Set(spells.map((s) => (isCodified ? s.level : s.potency)))].sort((a, b) => a - b);
  const levelLabel = (n) => (isCodified ? (n === 0 ? 'Cantrip' : `${ordinal(n)} level`) : `Potency ${ROMAN[n]}`);

  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">${info.kicker}</p>
      <h1>${info.title}</h1>
      <hr class="rule">
      <p class="lead">${info.blurb}</p>
      <div class="tabs" role="tablist" aria-label="Spell lists">
        <button role="tab" aria-selected="${isCodified}" data-list="codified">Codified (D&amp;D)</button>
        <button role="tab" aria-selected="${!isCodified}" data-list="compositry">Compositry (custom)</button>
        <button role="tab" aria-selected="false" data-list="components">Physical &amp; Aspectual</button>
      </div>
    </div>

    <form class="filters" role="search" id="filters">
      <div class="field search"><label for="q">Search</label>
        <div class="search">${icon('search')}<input id="q" type="search" placeholder="Name, effect or tag" value="${esc(f.q)}" autocomplete="off"></div></div>
      <div class="field"><label for="class">Class</label>
        <select id="class"><option value="">Any class</option>${optionTags(CLASS_NAMES, f.class)}</select></div>
      <div class="field"><label for="school">School (type)</label>
        <select id="school"><option value="">Any school</option>${optionTags(SCHOOLS, f.school)}</select></div>
      <div class="field"><label for="level">${isCodified ? 'Level' : 'Potency'}</label>
        <select id="level"><option value="">Any</option>${optionTags(levels.map((n) => ({ value: n, label: levelLabel(n) })), f.level)}</select></div>
      ${characters.length ? `<div class="field span-all"><label for="char">Check against my character</label>
        <select id="char"><option value="">No character selected</option>${optionTags(characters.map((c) => ({ value: c.id, label: `${c.name} - ${c.className || 'no class'} ${c.level}${c.groupName ? ` (${c.groupName})` : ''}` })), f.char)}</select>
        <span class="hint">Shows which spells that character's class can learn, and where "Add" will put them.</span></div>` : ''}
    </form>
    <div class="row between">
      <p class="muted" id="count" role="status" aria-live="polite"></p>
      <div class="row">
        <button class="btn sm ghost" id="clear" type="button">Clear filters</button>
        ${isDM() ? `<a class="btn sm" href="${campaignHref(undefined, { tab: 'spells' })}">${icon('plus')}Add a spell</a>` : ''}
      </div>
    </div>
    <div class="spell-list" id="list"></div>`;

  const $ = (sel) => main.querySelector(sel);
  const selectedCharacter = () => characters.find((c) => c.id === f.char);

  function matches(s) {
    if (f.class && !s.classes.includes(f.class) && !s.classes.includes(ANY_CLASS)) return false;
    if (f.school && s.school !== f.school) return false;
    if (f.level !== '' && String(isCodified ? s.level : s.potency) !== String(f.level)) return false;
    if (f.q) {
      const haystack = [s.name, s.description, s.school, s.tags.join(' '), s.classes.join(' '), s.form, s.creator, ...(s.physicals || []), ...(s.aspectuals || [])].join(' ').toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  }

  function draw() {
    const shown = spells.filter(matches);
    const ch = selectedCharacter();
    $('#count').textContent = `${shown.length} of ${spells.length} spells`;
    $('#list').innerHTML = shown.length
      ? shown.map((s) => {
          const mana = isCodified ? codifiedSpellMana(s.level) : s.mana;
          const badge = isCodified ? (s.level === 0 ? '0' : s.level) : ROMAN[s.potency];
          const allowed = ch ? classAllowed(s, ch.className) : null;
          return `<button class="spell-row" data-spell="${esc(s.id)}">
            <span class="spell-lvl">${badge}<small>${isCodified ? (s.level === 0 ? 'Cantrip' : 'Level') : 'Potency'}</small></span>
            <span><strong class="spell-name">${esc(s.name)}</strong>
              <span class="spell-meta">${esc(s.school)}${isCodified ? '' : ` · ${esc([...s.physicals, ...s.aspectuals].join(' + ') || 'No Components')} · ${esc(s.form)}`} · ${esc(s.classes.join(', '))}
              ${allowed === null ? '' : allowed ? ` <span class="badge green">${esc(ch.className)} can learn</span>` : ` <span class="badge">Not on ${esc(ch.className || 'class')} list</span>`}${s.hidden ? ' <span class="badge gold">Hidden</span>' : ''}</span></span>
            <span class="spell-mana">${mana} Mana</span>
          </button>`;
        }).join('')
      : `<div class="empty">${icon('search')}<h2>No spells match</h2><p>Try a different search or clear a filter.</p></div>`;
    replaceQuery(`/spells/${listName}`, f);
  }

  function openSpell(id) {
    const s = spells.find((x) => x.id === id);
    if (!s) return;
    const detail = spellDetail(listName, s);

    const addUi = !state.user
      ? `<a class="btn primary" href="#/account?next=${encodeURIComponent(`/spells/${listName}`)}" data-close>Sign in to add to a character</a>`
      : !characters.length
        ? `<a class="btn primary" href="#/characters/new" data-close>Create a character to add spells</a>`
        : `<select id="add-to" aria-label="Character to add this spell to">${optionTags(characters.map((c) => ({ value: c.id, label: `${c.name} (${c.className || 'no class'})` })), f.char || characters[0].id)}</select>
           <button class="btn primary" id="add-btn">${icon('plus')}Add to character</button>`;

    const dlg = openDialog({
      title: detail.title,
      body: `${detail.body}<p class="small muted" id="class-note"></p>`,
      footer: addUi,
    });

    const select = dlg.querySelector('#add-to');
    const note = () => {
      const c = characters.find((x) => x.id === select?.value);
      if (!c) return;
      dlg.querySelector('#class-note').textContent = classAllowed(s, c.className)
        ? `${c.name}'s class (${c.className}) can learn this spell.`
        : `Heads up: this spell is not on the ${c.className || 'class'} list. You will be asked to confirm.`;
    };
    select?.addEventListener('change', note);
    note();
    dlg.querySelector('#add-btn')?.addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        if (await addSpellToCharacter(listName, s, select.value)) dlg.close();
      } catch (err) { toast(err.message, 'error'); }
      if (dlg.isConnected) dlg.querySelector('#add-btn').disabled = false;
    });
  }

  // ── Events ──
  const onFilter = () => {
    for (const key of Object.keys(f)) { const el = $(`#${key}`); if (el) f[key] = el.value.trim(); }
    draw();
  };
  $('#filters').addEventListener('submit', (e) => e.preventDefault());
  $('#filters').addEventListener('change', onFilter);
  $('#q').addEventListener('input', debounce(onFilter, 150));
  $('#clear').addEventListener('click', () => {
    for (const key of ['q', 'class', 'school', 'level']) { f[key] = ''; $(`#${key}`).value = ''; }
    draw();
  });
  $('#list').addEventListener('click', (e) => {
    const row = e.target.closest('[data-spell]');
    if (row) openSpell(row.dataset.spell);
  });
  main.querySelector('.tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-list]');
    if (tab) location.hash = `#/spells/${tab.dataset.list}`;
  });

  draw();
  if (query.get('spell')) openSpell(query.get('spell'));
}
