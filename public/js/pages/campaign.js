/**
 * pages/campaign.js - a campaign's hub (#/campaign/<id>). The campaign banner
 * at the top (app.js) shows you are inside it; everything here belongs to this
 * campaign alone.
 *
 * Everyone in the campaign:
 *   Party                      every character in the campaign; add one of yours
 *   Homebrew (players)         browse the site's lists with this campaign's homebrew
 * The campaign's DMs also get the DM tools:
 *   Spells / Items / Classes   add, edit and remove entries without touching code
 *   Initiative Tracker         run encounters: turn order, HP, Guard (see pages/initiative.js)
 *   NPCs & Enemies             your private roster of stat blocks - never shown to players
 *   Group                      the invite code, the campaign's name, its members (make DM, remove)
 *   Session notes / Lore       private notebooks, saved as you type
 *
 * Entries saved here go to the database. Entries from the data/ files are
 * shown as "File" - editing one here saves an override; "Undo edits" brings
 * the file version back.
 *
 * Every spell, Component, item and class is either PUBLIC (players see it) or
 * HIDDEN (only DM accounts see it). The Hide / Publish button flips it, for
 * file entries too - so you can prepare things ahead and reveal them later.
 *
 * ─── TO ADD A FIELD TO A DM FORM ───────────────────────────────────────────
 *  Add one line to that list's `fields` in CATALOG below, and make the server
 *  keep it (the matching validate function in server/catalog.js).
 *  Field types: text, number, select, textarea, bool (tick box),
 *               checks (several tick boxes), list (comma separated), lines.
 */
import { api, state, isDM, loadUser, setHomebrew, campaignHref, loadSpells, loadItems, loadClasses, loadComponents, loadSubclasses } from '../api.js';
import { reloadPage, replaceQuery } from '../nav.js';
import { esc, icon, openDialog, confirmDialog, optionTags, toast, debounce } from '../ui.js';
import { SCHOOLS, CLASS_NAMES, ANY_CLASS, FORMS, ROMAN, ABILITIES, ITEM_CATEGORIES, ITEM_RARITIES, COMPONENT_KINDS, NPC_KINDS } from '../rules/constants.js';
import { codifiedSpellMana } from '../rules/formulas.js';
import { npcDetail, subclassDetail } from '../details.js';
import { initiativeTab } from './initiative.js';

// [id, label, who sees it]
const TABS = [
  ['party', 'Party', 'all'], ['homebrew', 'Homebrew', 'player'],
  ['initiative', 'Initiative Tracker', 'dm'],
  ['spells', 'Spells', 'dm'], ['items', 'Items & Weapons', 'dm'], ['classes', 'Classes', 'dm'], ['npcs', 'NPCs & Enemies', 'dm'],
  ['players', 'Group', 'dm'], ['notes', 'Session notes', 'dm'], ['lore', 'Lore', 'dm'],
];
let tab = 'party';
// Some tabs hold more than one list, chosen with the buttons at the top of the tab.
const GROUPS = {
  spells: [['codified', 'Codified (D&D)'], ['compositry', 'Compositry (custom)'], ['components', 'Physical & Aspectual']],
  classes: [['classes', 'Classes'], ['subclasses', 'Subclasses']],
};
const chosen = { spells: 'codified', classes: 'classes' }; // which list each of those tabs is showing
let openNote = null;        // the note left open after a redraw

// ── What the DM can edit: one entry per list ─────────────────────────────────
const classChecks = () => [ANY_CLASS, ...CLASS_NAMES].map((c) => ({ value: c, label: c === ANY_CLASS ? 'Any class' : c }));
const abilityOptions = ABILITIES.map((a) => ({ value: a.key, label: a.name }));
const VISIBILITY = {
  key: 'hidden', label: 'Visibility', type: 'select', value: false,
  options: [{ value: 'false', label: 'Public - players can see it' }, { value: 'true', label: 'Hidden - only the DM sees it (publish it later)' }],
};
const SHARED_END = [
  { key: 'tags', label: 'Tags', type: 'list', hint: 'Search keywords, separated by commas: damage, fire, area' },
  { key: 'source', label: 'Source', placeholder: 'Homebrew' },
  VISIBILITY,
];
const DESCRIPTION = { key: 'description', label: 'Description', type: 'textarea', tall: true, required: true, hint: 'Leave a blank line between paragraphs.' };

/** "3 | Rage | text" lines for the class form, and back again. */
const featureLines = (list) => (list || []).map((f) => [f.level, f.name, f.text].join(' | ')).join('\n');
const subclassLines = (list) => (list || []).map((s) => [s.name, s.text, s.features.map((f) => `${f.level} ${f.name}`).join('; ')].join(' | ')).join('\n');

const namedLines = (list) => (list || []).map((x) => `${x.name} | ${x.text}`).join('\n');
const NAMED_HINT = 'One per line:  Name | What it does      e.g.  Multiattack | Makes two Spear attacks.';

const CATALOG = {
  codified: {
    noun: 'Codified spell', file: 'data/spells/codified.js', reload: async () => (await loadSpells(true)).codified,
    columns: [['Lvl', (s) => s.level || 'C'], ['Name', (s) => `<b>${esc(s.name)}</b>`], ['School', (s) => esc(s.school)], ['Classes', (s) => esc(s.classes.join(', '))], ['Mana', (s) => codifiedSpellMana(s.level)]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'level', label: 'Level', type: 'select', value: 1, options: [...Array(10).keys()].map((n) => ({ value: n, label: n ? `Level ${n} (${codifiedSpellMana(n)} Mana)` : 'Cantrip (0 Mana)' })) },
      { key: 'school', label: 'School (type)', type: 'select', value: 'Evocation', options: SCHOOLS },
      { key: 'classes', label: 'Classes that may learn it', type: 'checks', required: true, options: classChecks() },
      { key: 'castingTime', label: 'Casting time', placeholder: 'Action' },
      { key: 'range', label: 'Range', placeholder: '60 feet' },
      { key: 'components', label: 'Components', placeholder: 'V, S, M (...)' },
      { key: 'duration', label: 'Duration', placeholder: 'Instantaneous' },
      { key: 'concentration', label: 'Concentration', type: 'bool' },
      { key: 'ritual', label: 'Ritual', type: 'bool' },
      DESCRIPTION,
      { key: 'higherLevels', label: 'Using more Mana (higher levels)', type: 'textarea' },
      ...SHARED_END,
    ],
  },
  compositry: {
    noun: 'Compositry spell', file: 'data/spells/compositry.js', reload: async () => (await loadSpells(true)).compositry,
    columns: [['Pot.', (s) => ROMAN[s.potency]], ['Name', (s) => `<b>${esc(s.name)}</b>`], ['School', (s) => esc(s.school)], ['Classes', (s) => esc(s.classes.join(', '))], ['Mana', (s) => s.mana]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'potency', label: 'Potency', type: 'select', value: 1, options: ROMAN.slice(1).map((r, i) => ({ value: i + 1, label: r })) },
      { key: 'mana', label: 'Final Mana', type: 'number', required: true, hint: 'After any codification discount. The Spellcrafter gives this number.' },
      { key: 'school', label: 'School (type)', type: 'select', value: 'Evocation', options: SCHOOLS },
      { key: 'classes', label: 'Classes that may learn it', type: 'checks', required: true, options: classChecks() },
      { key: 'physicals', label: 'Physical Components', type: 'list', hint: 'Separate with commas: Geo, Water' },
      { key: 'aspectuals', label: 'Aspectual Components', type: 'list', hint: 'Separate with commas: Fire' },
      { key: 'form', label: 'Form', suggestions: FORMS.map((f) => f.name) },
      { key: 'range', label: 'Range', placeholder: '60 feet' },
      { key: 'area', label: 'Area', placeholder: '20-foot burst' },
      { key: 'duration', label: 'Duration', placeholder: 'Instantaneous' },
      { key: 'damage', label: 'Damage / main effect', placeholder: '6d6 fire' },
      { key: 'resolution', label: 'Resolution', placeholder: 'DEX save for half' },
      { key: 'effect', label: 'Extra effect' },
      { key: 'creator', label: 'Created by' },
      { key: 'optimization', label: 'Codification benefit', placeholder: 'Reduce Mana cost by 1' },
      DESCRIPTION,
      ...SHARED_END,
    ],
  },
  components: {
    noun: 'Component', file: 'data/components.js', reload: () => loadComponents(true),
    columns: [['Name', (s) => `<b>${esc(s.name)}</b>`], ['Kind', (s) => esc(s.kind)], ['Tendril glow', (s) => esc(s.tendrilColor)]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'kind', label: 'Kind', type: 'select', value: 'Physical', options: COMPONENT_KINDS, hint: 'Physical = what exists. Aspectual = what property is applied.' },
      { key: 'tendrilColor', label: 'Tendril glow', placeholder: 'ember orange' },
      DESCRIPTION,
      { key: 'interactions', label: 'Composites & counters', type: 'textarea', hint: 'What it combines with, and what it counters or is countered by.' },
      ...SHARED_END,
    ],
  },
  items: {
    noun: 'item', file: 'data/items.js', reload: () => loadItems(true),
    columns: [['Name', (s) => `<b>${esc(s.name)}</b>`], ['Category', (s) => esc(s.category)], ['Rarity', (s) => esc(s.rarity)], ['Cost', (s) => esc(s.cost)]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'category', label: 'Category', type: 'select', value: 'Weapon', options: ITEM_CATEGORIES },
      { key: 'rarity', label: 'Rarity', type: 'select', value: 'Mundane', options: ITEM_RARITIES },
      { key: 'cost', label: 'Cost', placeholder: '15 GP' },
      { key: 'weight', label: 'Weight', placeholder: '3 lb.' },
      { key: 'attunement', label: 'Requires attunement', type: 'bool' },
      { key: 'damage', label: 'Damage (weapons)', placeholder: '1d8 slashing' },
      { key: 'properties', label: 'Properties (weapons)', type: 'list', hint: 'Separate with commas: Finesse, Light' },
      { key: 'mastery', label: 'Weapon Mastery', placeholder: 'Sap' },
      { key: 'armorClass', label: 'Armor Class (armor)', placeholder: '16' },
      { key: 'acBonus', label: 'AC bonus while in use', type: 'number', min: -20, value: 0, hint: 'Added to Armor Class automatically when ticked "In use" on a sheet. Cloak of Protection = 1, Shield = 2.' },
      { key: 'saveBonus', label: 'Save bonus while in use', type: 'number', min: -20, value: 0, hint: 'Added to every saving throw automatically.' },
      { key: 'chainTrait', label: 'Attack Chain trait', wide: true, placeholder: '+1 maximum Chain Length.', hint: 'What it does in an Attack Chain (codex p.23). Copied to the sheet when a player adds the weapon.' },
      { key: 'capacity', label: 'Capacity (Catalysts)', placeholder: '50' },
      { key: 'throughput', label: 'Throughput (Catalysts)', placeholder: '5' },
      DESCRIPTION,
      ...SHARED_END,
    ],
  },
  classes: {
    noun: 'class', file: 'data/classes.js', reload: () => loadClasses(true),
    columns: [['Name', (s) => `<b>${esc(s.name)}</b>`], ['Hit Die', (s) => `d${s.hitDie}`], ['Invocation', (s) => s.invocation.toUpperCase()], ['Mana pool', (s) => esc(s.caster)], ['Subclasses', (s) => s.subclasses.length]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'hitDie', label: 'Hit Die', type: 'select', value: 8, options: [6, 8, 10, 12].map((n) => ({ value: n, label: `d${n}` })) },
      { key: 'invocation', label: 'Invocation ability', type: 'select', value: 'int', options: abilityOptions, hint: 'The ability used for Arcane attacks and Save DC.' },
      { key: 'caster', label: 'Mana pool', type: 'select', value: 'full', options: [{ value: 'full', label: 'Full caster (100%)' }, { value: 'partial', label: 'Partial caster (about 65%)' }, { value: 'martial', label: 'Martial (about 40%)' }] },
      { key: 'skillPicks', label: 'Skills chosen', type: 'number', value: 2 },
      { key: 'saves', label: 'Saving throw proficiencies (pick two)', type: 'checks', required: true, options: abilityOptions },
      { key: 'primaryAbility', label: 'Primary ability', placeholder: 'Intelligence' },
      { key: 'role', label: 'One-line summary', wide: true, placeholder: 'A scholarly magic-user of arcane power.' },
      DESCRIPTION,
      { key: 'skills', label: 'Skill choices', wide: true, placeholder: 'Choose 2: Arcana, History, Insight' },
      { key: 'weapons', label: 'Weapon proficiencies', placeholder: 'Simple weapons' },
      { key: 'armor', label: 'Armor training', placeholder: 'Light armor' },
      { key: 'tools', label: 'Tool proficiencies' },
      { key: 'equipment', label: 'Starting equipment', wide: true },
      { key: 'compositry', label: 'In Arcane Compositry', type: 'textarea', hint: 'How the class plays with Mana, Attack Chains and Applied Thaumaturgy.' },
      { key: 'features', label: 'Class features', type: 'lines', toText: featureLines, hint: 'One per line:  Level | Feature name | What it does      e.g.  1 | Rune Carving | You can inscribe...' },
      { key: 'subclasses', label: 'Quick subclass list (optional)', type: 'lines', toText: subclassLines, hint: 'Better: add subclasses under Classes > Subclasses, where each feature gets its own description. This box is only a quick list - one per line:  Name | Description | 3 Feature; 6 Another feature' },
      ...SHARED_END,
    ],
  },
  subclasses: {
    noun: 'subclass', file: 'data/subclasses.js', reload: () => loadSubclasses(true),
    view: (s) => subclassDetail(s, null),
    columns: [['Name', (s) => `<b>${esc(s.name)}</b>`], ['Parent class', (s) => esc(s.className)], ['Features', (s) => s.features.length]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'className', label: 'Parent class', type: 'select', value: CLASS_NAMES[0], options: [...CLASS_NAMES], hint: 'The subclass appears in the Subclasses section of this class\'s page.' },
      DESCRIPTION,
      { key: 'features', label: 'What it adds to the class', type: 'lines', toText: featureLines, hint: 'One feature per line:  Level | Feature name | What it does      e.g.  3 | Bramble Hide | While raging, attackers take 1d4 Piercing damage.' },
      { key: 'compositry', label: 'In Arcane Compositry (optional)', type: 'textarea', hint: 'How it plays with Mana, Attack Chains or Applied Thaumaturgy.' },
      ...SHARED_END,
    ],
  },
  npcs: {
    noun: 'NPC / enemy', file: 'data/npcs.js', dmOnly: true, reload: async () => (await api('GET', '/npcs')).npcs,
    view: npcDetail,
    columns: [['Name', (s) => `<b>${esc(s.name)}</b>`], ['Kind', (s) => esc(s.kind)], ['CR', (s) => esc(s.cr)], ['AC', (s) => esc(s.ac)], ['HP', (s) => esc(s.hp)], ['Where', (s) => esc(s.location)]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'kind', label: 'Kind', type: 'select', value: 'Enemy', options: NPC_KINDS },
      { key: 'size', label: 'Size', type: 'select', value: 'Medium', options: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'] },
      { key: 'creatureType', label: 'Creature type', placeholder: 'Humanoid', suggestions: ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'] },
      { key: 'alignment', label: 'Alignment', placeholder: 'Neutral' },
      { key: 'cr', label: 'Challenge Rating', placeholder: '3 (XP 700)' },
      { key: 'pb', label: 'Proficiency Bonus', type: 'number', min: 2, value: 2, hint: 'Guard is worked out as 2 + PB.' },
      { key: 'ac', label: 'Armor Class', placeholder: '16 (hide armor, shield)' },
      { key: 'initiative', label: 'Initiative', placeholder: '+2' },
      { key: 'hp', label: 'Hit Points', placeholder: '58 (9d8 + 18)' },
      { key: 'speed', label: 'Speed', placeholder: '30 ft., Climb 30 ft.' },
      ...ABILITIES.map((a) => ({ key: a.key, label: a.name, type: 'number', min: 1, value: 10, get: (e) => e.scores?.[a.key] })),
      { key: 'saves', label: 'Saving throws', placeholder: 'Con +5, Wis +6' },
      { key: 'skills', label: 'Skills', placeholder: 'Perception +6, Stealth +4' },
      { key: 'vulnerabilities', label: 'Vulnerabilities' },
      { key: 'resistances', label: 'Resistances' },
      { key: 'immunities', label: 'Immunities', placeholder: 'Poison; Poisoned' },
      { key: 'senses', label: 'Senses', placeholder: 'Darkvision 60 ft., Passive Perception 16' },
      { key: 'languages', label: 'Languages' },
      { key: 'gear', label: 'Gear', wide: true },
      { key: 'traits', label: 'Traits', type: 'lines', toText: namedLines, hint: NAMED_HINT },
      { key: 'actions', label: 'Actions', type: 'lines', toText: namedLines, hint: NAMED_HINT },
      { key: 'bonusActions', label: 'Bonus actions', type: 'lines', short: true, toText: namedLines, hint: NAMED_HINT },
      { key: 'reactions', label: 'Reactions', type: 'lines', short: true, toText: namedLines, hint: NAMED_HINT },
      { key: 'legendary', label: 'Legendary actions', type: 'lines', short: true, toText: namedLines, hint: NAMED_HINT },
      { key: 'chainLength', label: 'Max Chain Length', placeholder: '3', hint: 'Baseline: 2 at CR 0-4, 3 at 5-10, 4 at 11-16, 5 at 17+.' },
      { key: 'guard', label: 'Guard (blank = 2 + PB)' },
      { key: 'momentum', label: 'Momentum Die / combat habits', wide: true, placeholder: 'Builds to d8, then spends on Topple.' },
      { key: 'invocation', label: 'Invocation ability (casters)', type: 'select', value: '', options: [{ value: '', label: 'None - not a Compositor' }, ...abilityOptions], hint: 'Arcane attack and Save DC are worked out from this and PB.' },
      { key: 'maxPotency', label: 'Maximum Potency', type: 'select', value: 0, options: [{ value: 0, label: 'None' }, ...ROMAN.slice(1).map((r, i) => ({ value: i + 1, label: r }))] },
      { key: 'mana', label: 'Mana', placeholder: '26' },
      { key: 'temperament', label: 'Temperament', type: 'select', value: '', options: [{ value: '', label: 'Not set' }, 'Disciplined', 'Adaptive', 'Experimental'], hint: 'How often it improvises (codex p.18).' },
      { key: 'physicals', label: 'Known Physicals', type: 'list', hint: 'Separate with commas.' },
      { key: 'aspectuals', label: 'Known Aspects', type: 'list', hint: 'Separate with commas.' },
      { key: 'forms', label: 'Known Forms', type: 'list', hint: 'Separate with commas.' },
      { key: 'signatures', label: 'Signature Compositions', type: 'textarea' },
      { key: 'location', label: 'Location' },
      { key: 'faction', label: 'Faction' },
      { ...DESCRIPTION, label: 'Description & roleplay', hint: 'Appearance, voice, how to play them. Leave a blank line between paragraphs.' },
      { key: 'notes', label: 'Private DM notes', type: 'textarea', hint: 'Secrets, plans, what they want.' },
      { key: 'tags', label: 'Tags', type: 'list', hint: 'Search keywords, separated by commas.' },
    ],
  },
};

/** This page's own address, for keeping the open tab in the URL. */
const here = () => `/campaign/${state.group.id}`;

export async function render(main, { query }) {
  if (!state.user || !state.group) {
    main.innerHTML = `<div class="empty">${icon('flag')}<h2>Campaign not found</h2><p>You are not in this campaign, or it no longer exists.</p><a class="btn primary" href="#/campaigns">My campaigns</a></div>`;
    return;
  }
  const tabs = TABS.filter(([, , who]) => who === 'all' || (who === 'dm' ? isDM() : !isDM()));
  if (tabs.some(([id]) => id === query.get('tab'))) tab = query.get('tab');
  if (!tabs.some(([id]) => id === tab)) tab = 'party';
  if (GROUPS[tab]?.some(([id]) => id === query.get('list'))) chosen[tab] = query.get('list');
  const address = () => (GROUPS[tab] ? { tab, list: chosen[tab] } : { tab });
  main.innerHTML = `
    <div class="page-head"><p class="kicker">${isDM() ? 'Dungeon Master' : 'Player'}</p><h1>${esc(state.group.name)}</h1><hr class="rule"></div>
    <div class="tabs" role="tablist" aria-label="Campaign">
      ${tabs.map(([id, label]) => `<button role="tab" data-tab="${id}" aria-selected="${id === tab}">${label}</button>`).join('')}
    </div>
    <div id="dm-body"></div>`;
  const body = main.querySelector('#dm-body');
  main.querySelector('.tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (btn) { tab = btn.dataset.tab; replaceQuery(here(), address()); reloadPage(); }
  });
  main.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

  let cleanup;
  if (GROUPS[tab]) await catalogTab(body, chosen[tab], GROUPS[tab]);
  else if (tab === 'items' || tab === 'npcs') await catalogTab(body, tab, null);
  else if (tab === 'initiative') cleanup = await initiativeTab(body, query);
  else if (tab === 'party') await partyTab(body);
  else if (tab === 'homebrew') homebrewTab(body);
  else if (tab === 'players') await playersTab(body);
  else cleanup = await notesTab(body, tab === 'lore' ? 'lore' : 'session');
  return cleanup;
}

// ── Spells / Items / Classes / NPCs ──────────────────────────────────────────
/**
 * One editable list. `group` is the set of lists sharing this tab (shown as
 * buttons at the top), or null when the tab holds just this list.
 */
async function catalogTab(body, listName, group) {
  const def = CATALOG[listName];
  const entries = await def.reload();
  const ORIGIN = { file: ['File', ''], custom: ['Added here', 'green'], override: ['Edited here', 'gold'] };
  const canHide = !def.dmOnly; // a DM-only list has nothing to hide: players never get it

  body.innerHTML = `
    <div class="row between">
      ${group ? `<div class="seg" role="group" aria-label="Which list">
        ${group.map(([id, label]) => `<button data-list="${id}" aria-pressed="${listName === id}">${esc(label)}</button>`).join('')}
      </div>` : '<span></span>'}
      <button class="btn primary" id="new-entry">${icon('plus')}New ${def.noun}</button>
    </div>
    <p class="small muted">${def.dmOnly
      ? `${entries.length} entries. <b>Only DM accounts can see this list</b> - it is never sent to players.`
      : `${entries.length} entries, ${entries.filter((x) => x.hidden).length} hidden from players. Use <b>Hide</b> to prepare something in secret and <b>Publish</b> when the players find it.`}
      "File" entries live in <code>${def.file}</code>; you can also add entries there by hand (see the docs folder).</p>
    ${entries.length > 8 ? `<div class="search picker-search">${icon('search')}<input type="search" id="row-q" placeholder="Search this list" autocomplete="off" aria-label="Search this list"></div>` : ''}
    <div class="table-wrap"><table>
      <thead><tr>${def.columns.map(([label]) => `<th>${label}</th>`).join('')}${canHide ? '<th>Players see it?</th>' : ''}<th>Source</th><th>Actions</th></tr></thead>
      <tbody>${entries.map((s) => `<tr${s.hidden && canHide ? ' class="is-hidden"' : ''}>
        ${def.columns.map(([, cell]) => `<td>${cell(s)}</td>`).join('')}
        ${canHide ? `<td><span class="badge ${s.hidden ? 'gold' : 'green'}">${s.hidden ? 'Hidden' : 'Public'}</span></td>` : ''}
        <td><span class="badge ${ORIGIN[s.origin][1]}">${ORIGIN[s.origin][0]}</span></td>
        <td><div class="row">
          ${def.view ? `<button class="btn sm primary" data-view="${esc(s.id)}">${icon('book')}View</button>` : ''}
          ${canHide ? `<button class="btn sm" data-vis="${esc(s.id)}">${icon('eye')}${s.hidden ? 'Publish' : 'Hide'}</button>` : ''}
          <button class="btn sm" data-edit="${esc(s.id)}">${icon('edit')}Edit</button>
          ${s.origin === 'file' ? '' : `<button class="btn sm danger" data-del="${esc(s.id)}">${icon('trash')}${s.origin === 'override' ? 'Undo edits' : 'Delete'}</button>`}
        </div></td></tr>`).join('')}</tbody></table></div>`;

  body.querySelector('#row-q')?.addEventListener('input', (e) => {
    const words = e.target.value.toLowerCase().split(/\s+/).filter(Boolean);
    body.querySelectorAll('tbody tr').forEach((row) => { row.hidden = !words.every((w) => row.textContent.toLowerCase().includes(w)); });
  });

  body.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.list) { chosen[tab] = btn.dataset.list; replaceQuery(here(), { tab, list: chosen[tab] }); return reloadPage(); }
    if (btn.dataset.view) {
      const s = entries.find((x) => x.id === btn.dataset.view);
      const dlg = openDialog({ ...def.view(s), footer: `<button class="btn" id="view-edit">${icon('edit')}Edit</button><button class="btn primary" data-close>Close</button>` });
      dlg.querySelector('#view-edit').addEventListener('click', () => { dlg.close(); entryForm(listName, s); });
      return;
    }
    if (btn.dataset.vis) {
      const s = entries.find((x) => x.id === btn.dataset.vis);
      try {
        await api('PUT', `/catalog/${listName}/${encodeURIComponent(s.id)}/visibility`, { hidden: !s.hidden });
        toast(s.hidden ? `${s.name} is now public - players can see it.` : `${s.name} is now hidden from players.`);
        reloadPage();
      } catch (err) { toast(err.message, 'error'); }
      return;
    }
    if (btn.id === 'new-entry') return entryForm(listName, null);
    if (btn.dataset.edit) return entryForm(listName, entries.find((s) => s.id === btn.dataset.edit));
    if (btn.dataset.del) {
      const s = entries.find((x) => x.id === btn.dataset.del);
      const undo = s.origin === 'override';
      const ok = await confirmDialog({
        title: undo ? 'Undo your edits?' : `Delete ${def.noun}?`,
        message: undo ? `"${s.name}" will go back to the version in the data file.` : `"${s.name}" will be removed from the list.${def.dmOnly ? '' : ' Characters that already use it keep what is on their sheet.'}`,
        confirmLabel: undo ? 'Undo edits' : 'Delete', danger: true,
      });
      if (!ok) return;
      try { await api('DELETE', `/catalog/${listName}/${encodeURIComponent(s.id)}`); toast('Done.'); reloadPage(); }
      catch (err) { toast(err.message, 'error'); }
    }
  });
}

/** The add / edit dialog, built from the list's `fields`. `entry` is null for a new one. */
function entryForm(listName, entry) {
  const def = CATALOG[listName];
  const fields = def.fields();
  const current = (f) => (entry && f.get ? f.get(entry) : entry?.[f.key]) ?? f.value ?? (f.type === 'checks' || f.type === 'list' ? [] : '');
  const star = (f) => (f.required ? ' <span aria-hidden="true">*</span>' : '');
  const hint = (f) => (f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '');

  const html = (f) => {
    const id = `en-${f.key}`;
    const value = current(f);
    if (f.type === 'bool') return `<label class="check"><input type="checkbox" name="${f.key}"${value ? ' checked' : ''}>${f.label}</label>`;
    if (f.type === 'checks') {
      return `<fieldset class="plain-box span-all"><legend class="label">${f.label}${star(f)}</legend><div class="row">
        ${f.options.map((o) => `<label class="check"><input type="checkbox" name="${f.key}" value="${esc(o.value)}"${value.includes(o.value) ? ' checked' : ''}>${esc(o.label)}</label>`).join('')}</div></fieldset>`;
    }
    if (f.type === 'textarea' || f.type === 'lines') {
      const text = f.type === 'lines' ? f.toText(entry?.[f.key]) : value;
      return `<div class="field span-all"><label for="${id}">${f.label}${star(f)}</label><textarea id="${id}" name="${f.key}" class="${f.tall || (f.type === 'lines' && !f.short) ? 'tall' : ''}">${esc(text)}</textarea>${hint(f)}</div>`;
    }
    if (f.type === 'select') {
      return `<div class="field"><label for="${id}">${f.label}</label><select id="${id}" name="${f.key}">${optionTags(f.options, value)}</select>${hint(f)}</div>`;
    }
    const shown = f.type === 'list' ? value.join(', ') : value;
    return `<div class="field ${f.wide ? 'span-all' : ''}"><label for="${id}">${f.label}${star(f)}</label>
      <input id="${id}" name="${f.key}" value="${esc(shown)}" ${f.type === 'number' ? `type="number" inputmode="numeric" min="${f.min ?? 0}"` : 'autocomplete="off"'}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}${f.suggestions ? ` list="${id}-list"` : ''}>
      ${f.suggestions ? `<datalist id="${id}-list">${f.suggestions.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>` : ''}${hint(f)}</div>`;
  };

  // Tick boxes that sit next to each other are grouped onto one row.
  const bools = fields.filter((f) => f.type === 'bool');
  const dlg = openDialog({
    title: entry ? `Edit ${esc(entry.name)}` : `New ${def.noun}`,
    body: `<form id="entry-form" novalidate>
      <p class="error" id="en-error" role="alert" tabindex="-1" hidden></p>
      <div class="fields wide">${fields.filter((f) => f.type !== 'bool').map(html).join('')}</div>
      ${bools.length ? `<div class="row">${bools.map(html).join('')}</div>` : ''}
    </form>`,
    footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="en-save">${icon('check')}Save ${def.noun}</button>`,
  });

  dlg.querySelector('#en-save').addEventListener('click', async (e) => {
    const form = dlg.querySelector('#entry-form');
    const fd = new FormData(form);
    const data = {};
    for (const f of fields) {
      if (f.type === 'bool') data[f.key] = fd.has(f.key);
      else if (f.type === 'checks') data[f.key] = fd.getAll(f.key);
      else data[f.key] = fd.get(f.key);
    }
    e.currentTarget.disabled = true;
    try {
      if (entry) await api('PUT', `/catalog/${listName}/${encodeURIComponent(entry.id)}`, data);
      else await api('POST', `/catalog/${listName}`, data);
      dlg.close();
      toast(`${data.name} saved.`);
      reloadPage();
    } catch (err) {
      const box = dlg.querySelector('#en-error');
      box.textContent = err.message;
      box.hidden = false;
      box.scrollIntoView({ block: 'nearest' });
      box.focus();
      dlg.querySelector('#en-save').disabled = false;
    }
  });
}

// ── Party ────────────────────────────────────────────────────────────────────
/** Every character in the campaign. You can open your own; DMs can open all of them. */
async function partyTab(body) {
  const [{ characters }, mine] = await Promise.all([
    api('GET', '/group/characters'),
    api('GET', '/characters').then((r) => r.characters),
  ]);
  const g = state.group;
  const canOpen = (c) => c.ownerId === state.user.id || isDM();
  const addable = mine.filter((c) => c.groupId !== g.id);
  body.innerHTML = `
    <div class="row between">
      <p class="small muted">${isDM() ? 'Every character in this campaign. Open one to view and edit it - hand out XP, items or spells.' : 'The characters in this campaign. Your DM can open and edit the ones in it.'}</p>
      <a class="btn primary sm" href="#/characters/new?campaign=${g.id}">${icon('plus')}New character for this campaign</a>
    </div>
    ${characters.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Character</th><th>Player</th><th>Class</th><th class="c">Level</th><th>Last saved</th><th></th></tr></thead>
      <tbody>${characters.map((c) => `<tr>
        <td><b>${esc(c.name)}</b></td><td>${esc(c.ownerName)}${c.ownerId === state.user.id ? ' (you)' : ''}</td><td>${esc(c.className || '-')}</td><td class="c">${c.level}</td>
        <td>${new Date(c.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
        <td>${canOpen(c) ? `<a class="btn sm" href="#/characters/${c.id}">${icon('eye')}Open sheet</a>` : ''}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty">${icon('users')}<h2>No characters yet</h2><p>Add one of yours below, or make a new one for this campaign.</p></div>`}
    ${addable.length ? `<form class="card stack gap-above" id="add-char">
        <h3>Bring one of your characters</h3>
        <div class="inline-form"><select name="char" aria-label="Your character">${addable.map((c) => `<option value="${c.id}">${esc(c.name)}${c.groupName ? ` (now in ${esc(c.groupName)})` : ''}</option>`).join('')}</select>
          <button class="btn" type="submit">${icon('plus')}Add to ${esc(g.name)}</button></div>
        <p class="small muted">A character is in one campaign at a time; adding it here moves it.</p>
      </form>` : ''}`;
  body.querySelector('#add-char')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('PUT', `/characters/${e.target.char.value}/campaign`, { groupId: g.id }); toast('Character added.'); reloadPage(); } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Homebrew (players) ───────────────────────────────────────────────────────
/** Players do not edit homebrew; this opens the site's lists with this campaign's homebrew included. */
function homebrewTab(body) {
  const g = state.group;
  const lists = [
    ['#/spells/compositry', 'scroll', 'Compositry spells'], ['#/spells/codified', 'scroll', 'Codified spells'],
    ['#/spells/components', 'leaf', 'Physical & Aspectual Components'], ['#/items', 'sword', 'Items & Weapons'], ['#/classes', 'shield', 'Classes & subclasses'],
    ['#/craft', 'sparkles', 'Spellcrafter'],
  ];
  body.innerHTML = `
    <p class="muted">Your DM may have added or changed spells, items and classes for ${esc(g.name)}. Open a list with this campaign's homebrew included:</p>
    <div class="grid cols-auto">${lists.map(([href, ic, label]) => `<a class="card" href="${href}" data-homebrew>${icon(ic)}<h3>${label}</h3></a>`).join('')}</div>`;
  body.addEventListener('click', async (e) => {
    const link = e.target.closest('[data-homebrew]');
    if (!link) return;
    e.preventDefault();
    await setHomebrew(g.id);
    location.hash = link.getAttribute('href');
  });
}

// ── Group: invite code, name, members ────────────────────────────────────────
async function playersTab(body) {
  const { members } = await api('GET', '/group/members');
  const g = state.group;
  body.innerHTML = `
    <div class="grid cols-2">
      <section class="card stack">
        <h3>Invite code</h3>
        <p class="small muted">Give this to your players. They enter it when they create an account, or under Account settings if they already have one.</p>
        <div class="row"><code class="invite-code">${esc(g.inviteCode)}</code>
          <button class="btn sm" id="copy-code">${icon('copy')}Copy</button>
          <button class="btn sm ghost" id="new-code">${icon('refresh')}New code</button></div>
      </section>
      <section class="card stack">
        <h3>Group name</h3>
        <form class="inline-form" id="rename"><input name="name" maxlength="60" value="${esc(g.name)}" aria-label="Group name"><button class="btn" type="submit">Rename</button></form>
      </section>
    </div>
    <h3 class="gap-above">Members</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Player</th><th>Username</th><th>Role</th><th class="c">Characters</th><th>Actions</th></tr></thead>
      <tbody>${members.map((u) => `<tr>
        <td><b>${esc(u.displayName)}</b>${u.id === state.user.id ? ' (you)' : ''}</td><td>${esc(u.username)}</td>
        <td><span class="badge ${u.role === 'dm' ? 'gold' : ''}">${u.role === 'dm' ? 'DM' : 'Player'}</span></td><td class="c">${u.characters}</td>
        <td><div class="row">${u.id === state.user.id ? '' : `
          <button class="btn sm" data-role="${u.role === 'dm' ? 'player' : 'dm'}" data-id="${u.id}" data-name="${esc(u.displayName)}">${u.role === 'dm' ? 'Make player' : 'Make DM'}</button>
          <button class="btn sm ghost" data-remove="${u.id}" data-name="${esc(u.displayName)}">Remove</button>`}</div></td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">Forgot a password? The site admin can set a new one${state.user.isAdmin ? ' (that is you: see Account settings)' : ''}.</p>`;

  const refreshGroups = async () => { await loadUser(); reloadPage(); };
  body.querySelector('#copy-code').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(g.inviteCode); toast('Invite code copied.'); } catch { toast('Could not copy. Select the code and copy it by hand.', 'error'); }
  });
  body.querySelector('#rename').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('PUT', '/group', { name: e.target.name.value }); toast('Group renamed.'); await refreshGroups(); } catch (err) { toast(err.message, 'error'); }
  });

  body.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'new-code') {
      const ok = await confirmDialog({ title: 'Make a new invite code?', message: 'The current code stops working. People already in the group stay in.', confirmLabel: 'New code' });
      if (!ok) return;
      try { await api('POST', '/group/invite-code'); toast('New invite code made.'); await refreshGroups(); } catch (err) { toast(err.message, 'error'); }
    }
    if (btn.dataset.role) {
      const ok = await confirmDialog({ title: 'Change role?', message: `${btn.dataset.name} will become a ${btn.dataset.role === 'dm' ? 'DM of this group (can edit its homebrew, notes and every character in it)' : 'player'}.`, confirmLabel: 'Change role' });
      if (!ok) return;
      try { await api('PUT', `/group/members/${btn.dataset.id}/role`, { role: btn.dataset.role }); reloadPage(); } catch (err) { toast(err.message, 'error'); }
    }
    if (btn.dataset.remove) {
      const ok = await confirmDialog({ title: 'Remove from group?', message: `${btn.dataset.name} will leave this group. Their account and characters are kept; they can rejoin with the invite code.`, confirmLabel: 'Remove', danger: true });
      if (!ok) return;
      try { await api('DELETE', `/group/members/${btn.dataset.remove}`); toast('Removed.'); reloadPage(); } catch (err) { toast(err.message, 'error'); }
    }
  });
}

// ── Session notes & Lore ─────────────────────────────────────────────────────
const LORE_CATEGORIES = ['People', 'Places', 'Factions', 'History', 'Deities & Powers', 'Creatures', 'Items & Artifacts', 'Magic & Compositry', 'Plot threads', 'Other'];

/**
 * A notebook: a list of entries, each with a title and a big text box, saved
 * as you type. `kind` is 'session' (newest first) or 'lore' (grouped by category).
 * Only DM accounts can see these.
 */
async function notesTab(body, kind) {
  const isLore = kind === 'lore';
  const { notes } = await api('GET', `/notes?kind=${kind}`);
  if (isLore) notes.sort((a, b) => (a.category || 'zz').localeCompare(b.category || 'zz') || a.title.localeCompare(b.title));
  const pending = new Map(); // note id -> debounced save, so edits can be flushed when leaving
  const when = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  body.innerHTML = `
    <div class="row between">
      <div class="field search grow"><label for="note-q" class="sr-only">Search ${isLore ? 'lore' : 'notes'}</label>
        <div class="search">${icon('search')}<input id="note-q" type="search" placeholder="Search ${isLore ? 'lore' : 'session notes'}" autocomplete="off"></div></div>
      <button class="btn primary" id="new-note">${icon('plus')}New ${isLore ? 'lore entry' : 'session note'}</button>
    </div>
    <p class="small muted">${isLore
      ? 'Your world bible: people, places, factions, history. Only DM accounts can see this. Everything saves as you type.'
      : 'One note per session works well: what happened, loose threads, what to prepare next. Only DM accounts can see this. Everything saves as you type.'}</p>
    <div class="notes" id="notes">
      ${notes.length ? notes.map((n) => `
        <details class="note" data-note="${n.id}"${n.id === openNote ? ' open' : ''}>
          <summary><span class="note-title">${esc(n.title)}</span>
            ${isLore && n.category ? `<span class="badge green note-cat">${esc(n.category)}</span>` : ''}
            <span class="small muted note-date">${when(n.updatedAt)}</span></summary>
          <div class="note-body">
            <div class="fields wide">
              <div class="field"><label for="t-${n.id}">Title</label><input id="t-${n.id}" data-f="title" value="${esc(n.title)}" maxlength="120" autocomplete="off"></div>
              ${isLore ? `<div class="field"><label for="c-${n.id}">Category</label><input id="c-${n.id}" data-f="category" value="${esc(n.category)}" list="lore-cats" maxlength="40" autocomplete="off" placeholder="People, Places, Factions..."></div>` : ''}
            </div>
            <div class="field"><label for="b-${n.id}">${isLore ? 'Lore' : 'Notes'}</label><textarea id="b-${n.id}" data-f="body" class="tall">${esc(n.body)}</textarea></div>
            <div class="row between">
              <span class="save-state saved" role="status">${icon('check')}Saved</span>
              <button type="button" class="btn sm danger" data-del-note="${n.id}">${icon('trash')}Delete</button>
            </div>
          </div>
        </details>`).join('')
      : `<div class="empty">${icon('feather')}<h2>Nothing written yet</h2><p>${isLore ? 'Start your world bible with a first entry.' : 'Start a note for your next session.'}</p></div>`}
    </div>
    <p class="muted" id="note-none" hidden>No ${isLore ? 'lore entries' : 'notes'} match that search.</p>
    ${isLore ? `<datalist id="lore-cats">${LORE_CATEGORIES.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>` : ''}`;

  const list = body.querySelector('#notes');

  list.addEventListener('input', (e) => {
    const card = e.target.closest('[data-note]');
    if (!card || !e.target.dataset.f) return;
    const id = card.dataset.note;
    const status = card.querySelector('.save-state');
    status.className = 'save-state';
    status.textContent = 'Saving...';
    if (e.target.dataset.f === 'title') card.querySelector('.note-title').textContent = e.target.value || 'Untitled';
    if (!pending.has(id)) {
      pending.set(id, debounce(async () => {
        const get = (f) => card.querySelector(`[data-f="${f}"]`)?.value ?? '';
        try {
          await api('PUT', `/notes/${id}`, { title: get('title'), category: get('category'), body: get('body') });
          status.className = 'save-state saved';
          status.innerHTML = `${icon('check')}Saved`;
        } catch (err) {
          status.className = 'save-state error';
          status.textContent = `Not saved - ${err.message}`;
        }
      }, 700));
    }
    pending.get(id)();
  });

  list.addEventListener('toggle', (e) => { if (e.target.open) openNote = e.target.dataset.note; }, true);

  body.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-note]');
    if (del) {
      const card = del.closest('[data-note]');
      const ok = await confirmDialog({ title: 'Delete this note?', message: `"${card.querySelector('.note-title').textContent}" will be permanently deleted.`, confirmLabel: 'Delete', danger: true });
      if (!ok) return;
      pending.delete(card.dataset.note);
      try { await api('DELETE', `/notes/${card.dataset.note}`); toast('Deleted.'); reloadPage(); } catch (err) { toast(err.message, 'error'); }
    }
    if (e.target.closest('#new-note')) {
      try {
        const title = isLore ? 'New lore entry' : `Session - ${when(new Date().toISOString())}`;
        openNote = (await api('POST', '/notes', { kind, title })).note.id;
        reloadPage();
      } catch (err) { toast(err.message, 'error'); }
    }
  });

  body.querySelector('#note-q').addEventListener('input', (e) => {
    const words = e.target.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    list.querySelectorAll('[data-note]').forEach((card) => {
      const text = [...card.querySelectorAll('[data-f]')].map((el) => el.value).join(' ').toLowerCase();
      card.hidden = !words.every((w) => text.includes(w));
      if (!card.hidden) shown++;
    });
    body.querySelector('#note-none').hidden = shown > 0 || !notes.length;
  });

  // Leaving the page: send any edit that is still waiting.
  return () => Promise.all([...pending.values()].map((save) => save.flush()));
}
