/**
 * pages/items.js - the Items & Weapons index (#/items).
 *
 * Works just like the spell indexes: search, filters kept in the address
 * (?category=Weapon&rarity=Rare), ?item=<id> opens one item, and a signed-in
 * player can add an item to a character.
 *
 * The items themselves come from data/items.js and the DM page.
 */
import { api, loadItems, state, isDM, campaignHref } from '../api.js';
import { replaceQuery } from '../nav.js';
import { esc, icon, openDialog, optionTags, toast, debounce } from '../ui.js';
import { ITEM_CATEGORIES, ITEM_RARITIES } from '../rules/constants.js';
import { addItemToCharacter } from '../spellbook.js';
import { itemDetail } from '../details.js';

/** Two letters shown in the square badge at the start of each row. */
const BADGE = { Weapon: 'Wp', Armor: 'Ar', Item: 'It', 'Adventuring Gear': 'Gr', Tool: 'Tl', Consumable: 'Co', 'Magic Item': 'Mg', Catalyst: 'Ca' };

export async function render(main, { query }) {
  const items = await loadItems();
  const characters = state.user ? (await api('GET', '/characters')).characters : [];

  const f = {
    q: query.get('q') || '',
    category: query.get('category') || '',
    rarity: query.get('rarity') || '',
    attunement: query.get('attunement') || '',
  };

  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">Gear for the road</p>
      <h1>Items &amp; Weapons</h1>
      <hr class="rule">
      <p class="lead">Weapons, armor, adventuring gear, magic items and Catalysts. Weapons list their Attack Chain trait where they have one.</p>
    </div>

    <form class="filters" role="search" id="filters">
      <div class="field search"><label for="q">Search</label>
        <div class="search">${icon('search')}<input id="q" type="search" placeholder="Name, effect, property or tag" value="${esc(f.q)}" autocomplete="off"></div></div>
      <div class="field"><label for="category">Category</label>
        <select id="category"><option value="">Any category</option>${optionTags(ITEM_CATEGORIES, f.category)}</select></div>
      <div class="field"><label for="rarity">Rarity</label>
        <select id="rarity"><option value="">Any rarity</option>${optionTags(ITEM_RARITIES, f.rarity)}</select></div>
      <div class="field"><label for="attunement">Attunement</label>
        <select id="attunement">${optionTags([{ value: '', label: 'Either' }, { value: 'yes', label: 'Requires attunement' }, { value: 'no', label: 'No attunement' }], f.attunement)}</select></div>
    </form>
    <div class="row between">
      <p class="muted" id="count" role="status" aria-live="polite"></p>
      <div class="row">
        <button class="btn sm ghost" id="clear" type="button">Clear filters</button>
        ${isDM() ? `<a class="btn sm" href="${campaignHref()}?tab=items">${icon('plus')}Add an item</a>` : ''}
      </div>
    </div>
    <div class="spell-list" id="list"></div>`;

  const $ = (sel) => main.querySelector(sel);

  function matches(it) {
    if (f.category && it.category !== f.category) return false;
    if (f.rarity && it.rarity !== f.rarity) return false;
    if (f.attunement && (f.attunement === 'yes') !== it.attunement) return false;
    if (f.q) {
      const haystack = [it.name, it.description, it.category, it.rarity, it.damage, it.mastery, it.chainTrait, it.properties.join(' '), it.tags.join(' ')].join(' ').toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  }

  /** The short line under an item's name. */
  const summary = (it) => [it.category, it.rarity !== 'Mundane' && it.rarity, it.damage, it.armorClass && `AC ${it.armorClass}`, it.attunement && 'Attunement'].filter(Boolean).join(' · ');

  function draw() {
    const shown = items.filter(matches);
    $('#count').textContent = `${shown.length} of ${items.length} items`;
    $('#list').innerHTML = shown.length
      ? shown.map((it) => `<button class="spell-row" data-item="${esc(it.id)}">
          <span class="spell-lvl">${BADGE[it.category] || 'It'}<small>${esc(it.category.split(' ')[0])}</small></span>
          <span><strong class="spell-name">${esc(it.name)}</strong><span class="spell-meta">${esc(summary(it))}${it.hidden ? ' <span class="badge gold">Hidden</span>' : ''}</span></span>
          <span class="spell-mana">${esc(it.cost)}</span>
        </button>`).join('')
      : `<div class="empty">${icon('search')}<h2>No items match</h2><p>Try a different search or clear a filter.</p></div>`;
    replaceQuery('/items', f);
  }

  function openItem(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const detail = itemDetail(it);
    const addUi = !state.user
      ? `<a class="btn primary" href="#/account?next=/items" data-close>Sign in to add to a character</a>`
      : !characters.length
        ? `<a class="btn primary" href="#/characters/new" data-close>Create a character to add items</a>`
        : `<select id="add-to" aria-label="Character to add this item to">${optionTags(characters.map((c) => ({ value: c.id, label: `${c.name} (${c.className || 'no class'})` })), characters[0].id)}</select>
           <button class="btn primary" id="add-btn">${icon('plus')}Add to character</button>`;

    const dlg = openDialog({
      title: detail.title,
      body: detail.body,
      footer: addUi,
    });
    dlg.querySelector('#add-btn')?.addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        if (await addItemToCharacter(it, dlg.querySelector('#add-to').value)) dlg.close();
      } catch (err) { toast(err.message, 'error'); }
      if (dlg.isConnected) dlg.querySelector('#add-btn').disabled = false;
    });
  }

  // ── Events ──
  const onFilter = () => {
    for (const key of Object.keys(f)) f[key] = $(`#${key}`).value.trim();
    draw();
  };
  $('#filters').addEventListener('submit', (e) => e.preventDefault());
  $('#filters').addEventListener('change', onFilter);
  $('#q').addEventListener('input', debounce(onFilter, 150));
  $('#clear').addEventListener('click', () => {
    for (const key of Object.keys(f)) { f[key] = ''; $(`#${key}`).value = ''; }
    draw();
  });
  $('#list').addEventListener('click', (e) => {
    const row = e.target.closest('[data-item]');
    if (row) openItem(row.dataset.item);
  });

  draw();
  if (query.get('item')) openItem(query.get('item'));
}
