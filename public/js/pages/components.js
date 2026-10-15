/**
 * pages/components.js - the "Physical & Aspectual" tab of the Spells page (#/spells/components).
 *
 * Components are the building blocks of Compositions. Players only see the
 * ones the DM has made public, and a character only KNOWS the ones recorded on
 * their sheet - "Add to character" here is how a character learns one.
 *
 * The Components themselves come from data/components.js and the DM page.
 */
import { api, loadComponents, state, isDM } from '../api.js';
import { replaceQuery } from '../nav.js';
import { esc, icon, openDialog, optionTags, toast, debounce } from '../ui.js';
import { COMPONENT_KINDS } from '../rules/constants.js';
import { componentDetail } from '../details.js';
import { learnComponent } from '../spellbook.js';

export async function render(main, { query }) {
  const components = await loadComponents();
  const characters = state.user ? (await api('GET', '/characters')).characters : [];
  // Which Components the chosen character already knows (to mark them in the list).
  let known = null;

  const f = { q: query.get('q') || '', kind: query.get('kind') || '', char: query.get('char') || '' };
  if (!characters.some((c) => c.id === f.char)) f.char = '';

  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">The Arcane language</p>
      <h1>Physical &amp; Aspectual Components</h1>
      <hr class="rule">
      <p class="lead">What magic is made of. Physical Components are substances; Aspectual Components are properties applied to them. Characters learn them over the campaign - more are out there to be discovered.</p>
      <div class="tabs" role="tablist" aria-label="Spell lists">
        <button role="tab" aria-selected="false" data-list="codified">Codified (D&amp;D)</button>
        <button role="tab" aria-selected="false" data-list="compositry">Compositry (custom)</button>
        <button role="tab" aria-selected="true" data-list="components">Physical &amp; Aspectual</button>
      </div>
    </div>

    <form class="filters three" role="search" id="filters">
      <div class="field search"><label for="q">Search</label>
        <div class="search">${icon('search')}<input id="q" type="search" placeholder="Name, behaviour or tag" value="${esc(f.q)}" autocomplete="off"></div></div>
      <div class="field"><label for="kind">Kind</label>
        <select id="kind"><option value="">Physical and Aspectual</option>${optionTags(COMPONENT_KINDS, f.kind)}</select></div>
      ${characters.length ? `<div class="field"><label for="char">Check against my character</label>
        <select id="char"><option value="">No character selected</option>${optionTags(characters.map((c) => ({ value: c.id, label: c.name })), f.char)}</select></div>` : '<span></span>'}
    </form>
    <div class="row between">
      <p class="muted" id="count" role="status" aria-live="polite"></p>
      <div class="row">
        <button class="btn sm ghost" id="clear" type="button">Clear filters</button>
        ${isDM() ? `<a class="btn sm" href="#/dm?tab=spells&list=components">${icon('plus')}Add a Component</a>` : ''}
      </div>
    </div>
    <div class="spell-list" id="list"></div>`;

  const $ = (sel) => main.querySelector(sel);

  async function loadKnown() {
    known = null;
    if (!f.char) return;
    try {
      const lang = (await api('GET', `/characters/${f.char}`)).data.language || {};
      known = [...(lang.physicals || []), ...(lang.aspectuals || [])];
    } catch { /* the list still works without the "known" marks */ }
  }

  function matches(c) {
    if (f.kind && c.kind !== f.kind) return false;
    if (f.q) {
      const haystack = [c.name, c.kind, c.description, c.interactions, c.tendrilColor, c.tags.join(' ')].join(' ').toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  }

  function draw() {
    const shown = components.filter(matches);
    $('#count').textContent = `${shown.length} of ${components.length} Components`;
    $('#list').innerHTML = shown.length
      ? shown.map((c) => `<button class="spell-row" data-component="${esc(c.id)}">
          <span class="spell-lvl">${c.kind === 'Physical' ? 'Ph' : 'As'}<small>${esc(c.kind)}</small></span>
          <span><strong class="spell-name">${esc(c.name)}</strong>
            <span class="spell-meta">${esc(c.description.split('\n')[0])}
            ${known ? (known.includes(c.name) ? ' <span class="badge green">Known</span>' : ' <span class="badge">Not learned</span>') : ''}${c.hidden ? ' <span class="badge gold">Hidden</span>' : ''}</span></span>
          <span class="spell-mana">${esc(c.tendrilColor)}</span>
        </button>`).join('')
      : `<div class="empty">${icon('search')}<h2>No Components match</h2><p>Try a different search or clear a filter.</p></div>`;
    replaceQuery('/spells/components', f);
  }

  function openComponent(id) {
    const c = components.find((x) => x.id === id);
    if (!c) return;
    const addUi = !state.user
      ? `<a class="btn primary" href="#/account?next=/spells/components" data-close>Sign in to add to a character</a>`
      : !characters.length
        ? `<a class="btn primary" href="#/characters/new" data-close>Create a character first</a>`
        : `<select id="add-to" aria-label="Character who learns this Component">${optionTags(characters.map((ch) => ({ value: ch.id, label: ch.name })), f.char || characters[0].id)}</select>
           <button class="btn primary" id="add-btn">${icon('plus')}Add to character</button>`;
    const dlg = openDialog({ ...componentDetail(c), footer: addUi });
    dlg.querySelector('#add-btn')?.addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        if (await learnComponent(c, dlg.querySelector('#add-to').value)) {
          dlg.close();
          await loadKnown();
          draw();
        }
      } catch (err) { toast(err.message, 'error'); }
      if (dlg.isConnected) dlg.querySelector('#add-btn').disabled = false;
    });
  }

  // ── Events ──
  const onFilter = async () => {
    const before = f.char;
    for (const key of Object.keys(f)) { const el = $(`#${key}`); if (el) f[key] = el.value.trim(); }
    if (f.char !== before) await loadKnown();
    draw();
  };
  $('#filters').addEventListener('submit', (e) => e.preventDefault());
  $('#filters').addEventListener('change', onFilter);
  $('#q').addEventListener('input', debounce(onFilter, 150));
  $('#clear').addEventListener('click', () => { for (const key of ['q', 'kind']) { f[key] = ''; $(`#${key}`).value = ''; } draw(); });
  $('#list').addEventListener('click', (e) => {
    const row = e.target.closest('[data-component]');
    if (row) openComponent(row.dataset.component);
  });
  main.querySelector('.tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-list]');
    if (tab && tab.dataset.list !== 'components') location.hash = `#/spells/${tab.dataset.list}`;
  });

  await loadKnown();
  draw();
  if (query.get('component')) openComponent(query.get('component'));
}
