/**
 * pages/sheet.js - the character sheet (#/characters/<id>).
 *
 * Mirrors the four-page "Arcane Compositry Character Sheet":
 *   Core & Combat tab ... page 1      Arcane tab ......... page 2
 *   Features & Gear ..... page 3      Reference .......... page 4
 *
 * ─── HOW IT WORKS ──────────────────────────────────────────────────────────
 *  `c` is the character object (shape defined in rules/character.js).
 *  Every input carries a data- attribute saying which part of `c` it edits:
 *     data-path="hp.current"      a normal field
 *     data-override="guardMax"    an automatic number the player may type over
 *     data-list="weapons" data-index="0" data-field="name"   a row in a list
 *  One `input` listener writes the change into `c`, recalculates the automatic
 *  numbers (derive) and saves to the server about half a second later.
 *
 * ─── TO ADD A FIELD ────────────────────────────────────────────────────────
 *  1. Give it a default in blankCharacter() (rules/character.js).
 *  2. Add  text('section.field', 'Label')  to the right panel below.
 */
import { api, state, useGroup, campaignHref, loadSpells, loadItems, loadSubclasses, subclassesOf } from '../api.js';
import { requireUser } from '../nav.js';
import { esc, icon, optionTags, toast, debounce, getPath, setPath, confirmDialog, openDialog } from '../ui.js';
import { ABILITIES, SKILLS, CLASS_NAMES, COMPONENTS, findComponent, findClass, FORMS, SPELL_STATUSES, ROMAN } from '../rules/constants.js';
import * as F from '../rules/formulas.js';
import { derive, upgrade, skillKey } from '../rules/character.js';
import { findChapter } from '../rules/codex-content.js';
import { momentumTracker } from '../calculators.js';
import { blankComposition, weaponRow, inventoryRow, giveItem } from '../spellbook.js';
import { spellDetail, itemDetail, componentDetail, openPicker } from '../details.js';

const TABS = [
  { id: 'core', label: 'Core & Combat' },
  { id: 'arcane', label: 'Arcane' },
  { id: 'features', label: 'Features & Gear' },
  { id: 'reference', label: 'Reference' },
];

/** Blank rows for the three lists on the sheet. */
const NEW_ROW = {
  weapons: () => ({ name: '', atk: '', damage: '', chain: '', notes: '' }),
  inventory: () => inventoryRow(null),
  compositions: blankComposition,
  discoveries: () => ({ name: '', uses: '', benefit: '', signature: '', notes: '' }),
};

export async function render(main, { params }) {
  if (!requireUser(main, 'open this character')) return;
  const loaded = await api('GET', `/characters/${params[0]}`);
  // A character in a campaign uses that campaign's homebrew (classes, spells, items).
  await useGroup(loaded.groupId);
  await loadSubclasses().catch(() => {}); // only used to suggest subclass names
  const c = upgrade(loaded.data);
  const id = loaded.id;
  let tab = 'core';
  let d = derive(c);

  // ── Small HTML builders ────────────────────────────────────────────────────
  let uid = 0;
  const fid = () => `f${++uid}`;
  const val = (path) => esc(getPath(c, path) ?? '');

  /** A normal text/number field. opts: { type:'number', placeholder, cls, min, max } */
  const text = (path, label, opts = {}) => {
    const i = fid();
    const number = opts.type === 'number';
    return `<div class="field ${opts.cls || ''}"><label for="${i}">${label}</label>
      <input id="${i}" data-path="${path}" value="${val(path)}" ${number ? `type="number" inputmode="numeric" min="${opts.min ?? 0}"${opts.max ? ` max="${opts.max}"` : ''}` : 'type="text" autocomplete="off"'}${opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : ''}></div>`;
  };
  /** A multi-line notes box. */
  const area = (path, label, cls = '') => {
    const i = fid();
    return `<div class="field span-all"><label for="${i}">${label}</label><textarea id="${i}" data-path="${path}" class="${cls}">${val(path)}</textarea></div>`;
  };
  /** An automatic number. Blank = use the rule (shown as green placeholder); typed = override. */
  const auto = (key, label, hint = '') => {
    const i = fid();
    return `<div class="field"><label for="${i}">${label}</label>
      <input id="${i}" class="auto num" data-override="${key}" data-auto="${key}" type="text" inputmode="numeric" value="${esc(c.overrides[key] ?? '')}" autocomplete="off" title="Calculated automatically. Type to override; clear to go back to automatic.">
      ${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  };
  const select = (path, label, options) => {
    const i = fid();
    return `<div class="field"><label for="${i}">${label}</label><select id="${i}" data-path="${path}">${optionTags(options, getPath(c, path))}</select></div>`;
  };
  const check = (path, label) => {
    const i = fid();
    return `<label class="check" for="${i}"><input type="checkbox" id="${i}" data-path="${path}"${getPath(c, path) ? ' checked' : ''}>${label}</label>`;
  };
  const panel = (title, body, cls = '', action = '') =>
    `<section class="panel ${cls}"><header><h3>${title}</h3>${action}</header><div class="panel-body">${body}</div></section>`;
  /** - [number] + control for a value that changes during play. */
  const stepper = (path, label) => {
    const i = fid();
    return `<div class="stepper">
      <button type="button" class="btn" data-step="${path}" data-delta="-1" aria-label="Decrease ${label}">${icon('minus')}</button>
      <input id="${i}" class="num" data-path="${path}" type="number" inputmode="numeric" value="${val(path)}" aria-label="${label}">
      <button type="button" class="btn" data-step="${path}" data-delta="1" aria-label="Increase ${label}">${icon('plus')}</button></div>`;
  };
  /** Three tappable circles (death saves). */
  const pips = (path, label, cls = '') =>
    `<span class="pips ${cls}" role="group" aria-label="${label}">${[1, 2, 3].map((n) => `<button type="button" data-pip="${path}" data-n="${n}" aria-pressed="${Number(getPath(c, path)) >= n}" aria-label="${label} ${n}"></button>`).join('')}</span>`;
  /** A field inside a list row. */
  const cell = (list, index, field, label, opts = {}) => {
    const i = fid();
    const value = c[list][index][field] ?? '';
    const control = opts.options
      ? `<select id="${i}" data-list="${list}" data-index="${index}" data-field="${field}">${optionTags(opts.options, value)}</select>`
      : `<input id="${i}" data-list="${list}" data-index="${index}" data-field="${field}" value="${esc(value)}" autocomplete="off">`;
    return `<div class="field ${opts.cls || ''}"><label for="${i}">${label}</label>${control}</div>`;
  };
  const addBtn = (list, label) => `<button type="button" class="btn sm" data-add="${list}">${icon('plus')}${label}</button>`;
  const removeBtn = (list, index, name) => `<button type="button" class="btn sm danger" data-remove="${list}" data-index="${index}" aria-label="Remove ${esc(name || 'row')}">${icon('trash')}Remove</button>`;
  const detailsBtn = (list, index) => `<button type="button" class="btn sm" data-item-details="${list}" data-index="${index}">${icon('book')}Item details</button>`;
  /** The Components this character has learned: tap a name for details, x to remove. */
  const knownChips = (kind) => {
    const path = kind === 'Physical' ? 'language.physicals' : 'language.aspectuals';
    return `<div class="chips">${getPath(c, path).map((name) => `<span class="chip known${kind === 'Aspectual' ? ' gold' : ''}">
        <button type="button" data-component="${esc(name)}" aria-label="${esc(name)} details">${esc(name)}</button>
        <button type="button" data-forget="${path}" data-value="${esc(name)}" aria-label="Remove ${esc(name)}">${icon('x')}</button></span>`).join('') || '<span class="muted small">None learned yet.</span>'}</div>
      <p></p><button type="button" class="btn sm" data-action="learn" data-kind="${kind}">${icon('plus')}Learn ${kind === 'Physical' ? 'a Physical' : 'an Aspectual'}</button>`;
  };
  const chipToggles = (path, list) =>
    `<div class="chips">${list.map((item) => `<button type="button" class="chip" data-chip="${path}" data-value="${esc(item)}" aria-pressed="${getPath(c, path).includes(item)}">${esc(item)}</button>`).join('')}</div>`;

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const abilityCard = (a) => `
    <section class="panel"><header><h3>${a.name}</h3></header><div class="panel-body">
      <div class="ability-top">
        <div><span class="label">Mod</span><div class="ability-mod" data-mod="${a.key}"></div></div>
        ${text(`abilities.${a.key}.score`, 'Score', { type: 'number', min: 1, max: 30 })}
      </div>
      <div class="skill-row save">
        <input type="checkbox" data-path="abilities.${a.key}.save" aria-label="${a.name} saving throw proficiency"${c.abilities[a.key].save ? ' checked' : ''}>
        <span class="name">Saving Throw</span>
        <input class="auto num" data-override="save_${a.key}" data-auto="save_${a.key}" type="text" inputmode="numeric" value="${esc(c.overrides[`save_${a.key}`] ?? '')}" aria-label="${a.name} saving throw bonus">
      </div>
      ${SKILLS[a.key].map((skill) => `
        <div class="skill-row">
          <button type="button" class="prof-toggle" data-skill="${esc(skill)}" data-level="${Number(c.skills[skill]) || 0}" aria-label="${skill} training: ${['untrained', 'proficient', 'expertise'][Number(c.skills[skill]) || 0]}">${['-', 'P', 'E'][Number(c.skills[skill]) || 0]}</button>
          <span class="name">${skill}</span>
          <input class="auto num" data-override="${skillKey(skill)}" data-auto="${skillKey(skill)}" type="text" inputmode="numeric" value="${esc(c.overrides[skillKey(skill)] ?? '')}" aria-label="${skill} bonus">
        </div>`).join('')}
    </div></section>`;

  const coreTab = () => `
    <div class="sheet-grid">
      ${panel('Character', `<div class="fields wide">
        ${text('identity.name', 'Character name', { cls: 'span-all' })}
        <div class="field"><label for="cls">Class</label><input id="cls" data-path="identity.className" value="${val('identity.className')}" list="class-list" autocomplete="off">
          <datalist id="class-list">${CLASS_NAMES.map((n) => `<option value="${n}">`).join('')}</datalist></div>
        <div class="field"><label for="subcls">Subclass</label><input id="subcls" data-path="identity.subclass" value="${val('identity.subclass')}" list="subclass-list" autocomplete="off">
          <datalist id="subclass-list">${subclassesOf(findClass(c.identity.className)).map((x) => `<option value="${esc(x.name)}">`).join('')}</datalist></div>
        ${text('identity.level', 'Level', { type: 'number', min: 1, max: 20 })}
        ${text('identity.xp', 'XP')}
        ${text('identity.background', 'Background')}
        ${text('identity.species', 'Species')}
        ${text('identity.player', 'Player')}
        ${text('identity.alignment', 'Alignment')}
      </div>`)}
      ${panel('Core Vitals', `<div class="fields">
        ${auto('profBonus', 'Prof. bonus')}
        ${auto('initiative', 'Initiative')}
        ${text('vitals.speed', 'Speed')}
        ${text('vitals.size', 'Size')}
        ${auto('passivePerception', 'Passive Perception')}
        ${text('vitals.ac', 'Armor Class (base)', { type: 'number' })}
        <div class="field"><span class="label">Total AC</span><div class="ability-mod total-ac" data-show="acTotal"></div><span class="hint" data-show="acNote"></span></div>
        ${text('vitals.shieldOtherAc', 'Shield / other AC')}
        <div class="field"><span class="label">Heroic Insp.</span>${check('vitals.heroicInspiration', 'Inspired')}</div>
      </div>`)}
      <div class="abilities">${ABILITIES.map(abilityCard).join('')}</div>
      ${panel('Hit Points, Hit Dice & Death', `<div class="fields">
        <div class="field"><span class="label">HP current</span>${stepper('hp.current', 'current hit points')}</div>
        ${text('hp.max', 'HP max', { type: 'number' })}
        ${text('hp.temp', 'Temp HP', { type: 'number' })}
        ${text('hp.hitDice', 'Hit Dice', { placeholder: '3d8' })}
        ${text('hp.hitDiceSpent', 'Spent', { type: 'number' })}
        <div class="field"><span class="label">Death saves - successes</span>${pips('hp.deathSuccess', 'Death save success')}</div>
        <div class="field"><span class="label">Death saves - failures</span>${pips('hp.deathFail', 'Death save failure', 'fail')}</div>
      </div>`, 'w6')}
      ${panel('Attack Chains & Active Defense', `<div class="fields">
        ${auto('chainLength', 'Chain length')}
        ${auto('guardMax', 'Guard max', '2 + PB')}
        <div class="field"><span class="label">Guard cur.</span>${stepper('chain.guardCurrent', 'current Guard')}</div>
        ${auto('dodge', 'Dodge')}
        ${auto('parry', 'Parry')}
        ${text('chain.blockFormula', 'Block value / formula', { placeholder: `PB + STR = ${d.blockValue}` })}
        ${auto('counterCost', 'Counter cost')}
        ${text('chain.finisher', 'Finisher')}
        <div class="field span-all"><span class="label">Chain Momentum <span data-show="chainBonus"></span></span>
          <div class="seg" role="group" aria-label="Chain Momentum">${[0, 1, 2, 3].map((n) => `<button type="button" data-set="chain.momentum" data-value="${n}" aria-pressed="${Number(c.chain.momentum) === n}">${n}</button>`).join('')}</div></div>
        ${area('chain.posture', 'Defensive posture / special')}
        ${area('chain.counterNotes', 'Counter-attack / interruption notes')}
      </div>
      <div class="row">
        <button type="button" class="btn sm" data-action="refresh-guard">${icon('refresh')}Start of turn: refresh Guard</button>
        <button type="button" class="btn sm" data-action="end-chain">End Chain</button>
      </div>`, 'w6')}
      ${panel('Momentum Dice', `
        <p class="small muted">Build: d4 > d6 > d8 > d10 > d12. Each successful hit advances one step. Spending the die or taking direct enemy damage resets it to d4.</p>
        <div id="momentum"></div>
        <div class="fields wide">
          ${select('momentum.ability', 'Momentum ability', [...ABILITIES.map((a) => ({ value: a.key, label: a.name })), { value: 'invocation', label: 'Invocation Modifier (Arcane attack)' }])}
          ${auto('stasisDC', 'Stasis DC', '8 + PB + Momentum ability')}
          ${text('momentum.modifiers', 'Spend / special modifiers')}
        </div>
        <p class="small"><b>d6</b> Break 5-6 &nbsp;|&nbsp; <b>d8</b> Topple 7-8 &nbsp;|&nbsp; <b>d10</b> Daze 9-10 &nbsp;|&nbsp; <b>d12</b> Launch/Smash 11-12</p>`)}
      ${panel('Weapons & Attacks', `
        <div class="list-rows">${c.weapons.map((w, i) => `<div class="list-row"><div class="fields">
          ${cell('weapons', i, 'name', 'Name')}${cell('weapons', i, 'atk', 'Atk')}${cell('weapons', i, 'damage', 'Damage / type')}${cell('weapons', i, 'chain', 'Chain')}${cell('weapons', i, 'notes', 'Notes')}
          </div><div class="row-actions">${w.itemId ? detailsBtn('weapons', i) : ''}${removeBtn('weapons', i, w.name)}</div></div>`).join('') || '<p class="muted small">No weapons yet.</p>'}</div>
        <p></p><div class="row">
          <button type="button" class="btn sm primary" data-action="pick-weapon">${icon('sword')}Add from Items &amp; Weapons</button>
          ${addBtn('weapons', 'Add blank weapon')}</div>`)}
    </div>`;

  const compositionRow = (row, i) => `
    <div class="list-row"><div class="fields">
      ${cell('compositions', i, 'level', 'P / L')}
      ${cell('compositions', i, 'name', 'Name', { cls: 'span-2' })}
      ${cell('compositions', i, 'components', 'Components')}
      ${cell('compositions', i, 'form', 'Form')}
      ${cell('compositions', i, 'mana', 'Mana')}
      ${cell('compositions', i, 'range', 'Range')}
      ${cell('compositions', i, 'atkdc', 'Atk / DC')}
      ${cell('compositions', i, 'damage', 'Damage / effect')}
      ${cell('compositions', i, 'status', 'Status', { options: SPELL_STATUSES })}
    </div><div class="row-actions">
      ${row.spellId ? `<button type="button" class="btn sm" data-spell-details="${i}">${icon('book')}Spell details</button>` : ''}
      <button type="button" class="btn sm" data-cast="${i}">${icon('droplet')}Cast (spend ${F.num(row.mana)} Mana)</button>
      ${removeBtn('compositions', i, row.name)}
    </div></div>`;

  const arcaneTab = () => `
    <div class="sheet-grid">
      ${panel('Arcane Core', `<div class="fields">
        <div class="field"><span class="label">Mana current</span>${stepper('arcane.manaCurrent', 'current Mana')}</div>
        ${auto('manaMax', 'Mana max')}
        ${select('casterType', 'Mana pool type', Object.entries(F.CASTER_TYPES).map(([value, t]) => ({ value, label: t.label })))}
        ${select('arcane.invocationAbility', 'Invocation ability', ABILITIES.map((a) => ({ value: a.key, label: a.name })))}
        ${auto('invocationMod', 'Invocation mod')}
        ${auto('arcaneAttack', 'Arcane attack', 'd20 + PB + IM')}
        ${auto('saveDC', 'Save DC', '8 + PB + IM')}
        ${select('arcane.maxPotency', 'Max Potency', ROMAN.slice(1).map((r, i) => ({ value: i + 1, label: r })))}
      </div>
      <div class="row"><button type="button" class="btn sm" data-action="restore-mana">${icon('refresh')}Long rest: restore Mana</button></div>`)}
      ${panel('Catalyst', `<div class="fields wide">
        ${text('catalyst.name', 'Catalyst name / type')}${text('catalyst.bond', 'Bond / location')}
        ${text('catalyst.capacity', 'Capacity')}${text('catalyst.throughput', 'Throughput')}${text('catalyst.stored', 'Stored Mana')}
      </div>`, 'w6')}
      ${panel('Tendril Scripture', `<div class="fields wide">
        ${text('tendril.rootNode', 'Root node')}${text('tendril.color', 'Color / signature')}${text('tendril.terminals', 'Terminals')}
        ${area('tendril.routing', 'Routing / gesture notes')}
      </div>`, 'w6')}
      ${panel('Known Arcane Language', `
        <p class="small muted">What this character has learned so far. New Components are discovered during the campaign - tap a name to read about it.
          Browse them all under <a href="#/spells/components?char=${id}">Spells &gt; Physical &amp; Aspectual</a>.</p>
        <div class="grid cols-3">
        <div><p class="label">Physicals known</p>${knownChips('Physical')}${c.language.otherPhysicals ? text('language.otherPhysicals', 'Other physicals (old notes)') : ''}</div>
        <div><p class="label">Aspectuals known</p>${knownChips('Aspectual')}${c.language.otherAspectuals ? text('language.otherAspectuals', 'Other aspectuals (old notes)') : ''}</div>
        <div><p class="label">Forms known</p>${chipToggles('language.forms', FORMS.map((f) => f.name))}${text('language.otherForms', 'Other forms')}</div>
      </div><div class="fields">${area('language.compositeNotes', 'Composite notes')}</div>`)}
      ${panel('Compositions, Codified Spells & Improvisations', `
        <div class="list-rows">${c.compositions.map(compositionRow).join('') || '<p class="muted small">Nothing here yet. Build a spell in the Spellcrafter or add one from the spell lists.</p>'}</div>
        <p class="small muted">Status: Improvised, Codified, Prepared, Signature.</p>
        <div class="row">${addBtn('compositions', 'Add blank row')}
          <a class="btn sm" href="#/craft">${icon('sparkles')}Spellcrafter</a>
          <a class="btn sm" href="#/spells/codified?char=${id}">${icon('scroll')}Codified spells</a>
          <a class="btn sm" href="#/spells/compositry?char=${id}">${icon('leaf')}Compositry spells</a></div>`)}
      ${panel('Applied Thaumaturgy', `<div class="fields wide">
        ${area('thaumaturgy.infusion', 'Current infusion / augmentation')}
        ${text('thaumaturgy.chargePool', 'Arcane Charge Pool', { placeholder: '6d6' })}${text('thaumaturgy.reinforcement', 'Reinforcement', { placeholder: '+4' })}${text('thaumaturgy.duration', 'Duration')}
      </div>`, 'w6')}
      ${panel('Circuit Stability & Counter-Compositry', `<div class="fields wide">
        ${auto('stabilityBonus', 'Stability bonus', 'PB + IM')}${text('stability.dcModifiers', 'DC modifiers')}${auto('counterBonus', 'Counter bonus', 'PB + IM')}
        ${area('stability.notes', 'Counter / interruption notes')}
      </div>`, 'w6')}
      ${panel('Arcane Discovery & Codification', `
        <div class="list-rows">${c.discoveries.map((row, i) => `<div class="list-row"><div class="fields wide">
          ${cell('discoveries', i, 'name', 'Discovery / working name')}${cell('discoveries', i, 'uses', 'Uses / research')}
          ${cell('discoveries', i, 'benefit', 'Codification benefit')}${cell('discoveries', i, 'signature', 'Signature / route change')}
          ${cell('discoveries', i, 'notes', 'Notes', { cls: 'span-all' })}
          </div><div class="row-actions">${removeBtn('discoveries', i, row.name)}</div></div>`).join('') || '<p class="muted small">Found a useful interaction? Record it here. Repeated use turns experimentation into technique.</p>'}</div>
        <p></p>${addBtn('discoveries', 'Add discovery')}`)}
    </div>`;

  const inventoryRowHtml = (row, i) => {
    const active = row.equipped && (!row.attunement || row.attuned);
    const bonus = [F.num(row.acBonus) && `${F.signed(row.acBonus)} AC`, F.num(row.saveBonus) && `${F.signed(row.saveBonus)} saves`].filter(Boolean).join(', ');
    const box = (field, label) => {
      const b = fid();
      return `<label class="check" for="${b}"><input type="checkbox" id="${b}" data-list="inventory" data-index="${i}" data-field="${field}"${row[field] ? ' checked' : ''}>${label}</label>`;
    };
    const status = !bonus ? '' : active ? `<span class="badge green">Active: ${bonus}</span>`
      : row.equipped ? `<span class="badge gold">Attune it to gain: ${bonus}</span>` : `<span class="badge">Not in use: ${bonus}</span>`;
    return `<div class="list-row${active ? ' in-use' : ''}"><div class="fields">
        ${cell('inventory', i, 'name', 'Item', { cls: 'span-2' })}
        ${cell('inventory', i, 'qty', 'Qty')}
        ${cell('inventory', i, 'acBonus', 'AC bonus')}
        ${cell('inventory', i, 'saveBonus', 'Save bonus')}
        ${cell('inventory', i, 'notes', 'Notes', { cls: 'span-2' })}
      </div><div class="row-actions">
        ${box('equipped', 'In use / worn')}${box('attunement', 'Needs attunement')}${row.attunement ? box('attuned', 'Attuned') : ''}
        ${status}
        ${row.itemId ? detailsBtn('inventory', i) : ''}${removeBtn('inventory', i, row.name)}
      </div></div>`;
  };

  const featuresTab = () => `
    <div class="sheet-grid">
      ${panel('Class Features & Feats', `<div class="fields">${area('features.classFeatures', 'Class features & feats', 'tall')}</div>`, 'w6')}
      <div class="w6 stack">
        ${panel('Species Traits', `<div class="fields">${area('features.speciesTraits', 'Species traits')}</div>`)}
        ${panel('Combat / Arcane Special Rules', `<div class="fields">${area('features.specialRules', 'Combat / arcane special rules')}</div>`)}
      </div>
      ${panel('Inventory', `
        <p class="small muted">Tick <b>In use / worn</b> to apply an item's bonuses to your Armor Class and saving throws. Items that need attunement must also be ticked <b>Attuned</b>.
          <span data-show="attuneNote"></span></p>
        <div class="list-rows">${c.inventory.map(inventoryRowHtml).join('') || '<p class="muted small">Nothing carried yet.</p>'}</div>
        <p></p><div class="row">
          <button type="button" class="btn sm primary" data-action="pick-item">${icon('plus')}Add from Items &amp; Weapons</button>
          ${addBtn('inventory', 'Add custom item')}</div>`)}
      ${panel('Equipment, Training & Proficiencies', `
        <p class="label">Armor training</p>
        <div class="row">${check('gear.armorLight', 'Light')}${check('gear.armorMedium', 'Medium')}${check('gear.armorHeavy', 'Heavy')}${check('gear.armorShields', 'Shields')}</div>
        <div class="fields">${area('gear.proficiencies', 'Weapons / tools / other proficiencies')}${area('gear.equipment', 'Other equipment (free text)')}</div>`, 'w6')}
      <div class="w6 stack">
        ${panel('Backstory & Personality', `<div class="fields">${area('story.backstory', 'Backstory & personality')}</div>`)}
        ${panel('Appearance', `<div class="fields">${area('story.appearance', 'Appearance')}</div>`)}
      </div>
      ${panel('Languages & Magic Item Attunement', `<div class="fields wide">
        ${text('misc.languages', 'Languages', { cls: 'span-all' })}
        ${[0, 1, 2].map((i) => text(`misc.attunement.${i}`, `Attunement ${i + 1}`)).join('')}
      </div>`, 'w6')}
      ${panel('Coins & Carrying', `<div class="fields">
        ${['cp', 'sp', 'ep', 'gp', 'pp'].map((coin) => text(`misc.${coin}`, coin.toUpperCase(), { type: 'number' })).join('')}
        ${area('misc.carrying', 'Carrying / encumbrance notes')}
      </div>`, 'w6')}
      ${panel('Campaign Notes, Relationships & Personal Goals', `<div class="fields">${area('misc.campaignNotes', 'Campaign notes, relationships & personal goals', 'tall')}</div>`)}
    </div>`;

  const referenceTab = () => `
    <div class="stack">
      ${panel('Custom Table Rulings / Playtest Notes', `<div class="fields">${area('misc.tableRulings', 'Custom table rulings / playtest notes')}</div>`)}
      ${['chain-cheat-sheet', 'arcane-cheat-sheet'].map((cid) => {
        const ch = findChapter(cid);
        return panel(esc(ch.title), ch.html);
      }).join('')}
      <p><a class="btn" href="#/codex">${icon('book')}Open the full codex</a></p>
    </div>`;

  // ── Page shell ─────────────────────────────────────────────────────────────
  const isOwner = loaded.ownerId === state.user.id;
  main.innerHTML = `
    <div class="row between">
      <a class="btn ghost sm" href="${isOwner ? '#/characters' : campaignHref(loaded.groupId, { tab: 'party' })}">${icon('back')}${isOwner ? 'My characters' : 'Back to the party'}</a>
      ${loaded.groupId ? `<a class="badge gold" href="${campaignHref(loaded.groupId)}">${icon('flag')} ${esc(loaded.groupName)}</a>` : '<span class="badge">Not in a campaign</span>'}
    </div>
    ${isOwner ? '' : `<div class="readonly-banner">${icon('shield')}<span>You are editing <b>${esc(loaded.ownerName)}</b>'s character as DM. Changes save to their sheet.</span></div>`}
    <div class="sheet-head">
      <div>
        <h1 data-show="name"></h1>
        <p class="muted" data-show="subtitle"></p>
      </div>
      <span class="save-state saved" id="save-state" role="status" aria-live="polite">${icon('check')}Saved</span>
    </div>
    <div class="vitals-bar">
      <div class="vital"><span class="label">${icon('heart')}Hit Points</span>${stepper('hp.current', 'current hit points')}<div class="of">of <span data-show="hpMax"></span><span data-show="hpTemp"></span></div></div>
      <div class="vital"><span class="label">${icon('droplet')}Mana</span>${stepper('arcane.manaCurrent', 'current Mana')}<div class="of">of <span data-show="manaMax"></span></div></div>
      <div class="vital"><span class="label">${icon('shield')}Guard</span>${stepper('chain.guardCurrent', 'current Guard')}<div class="of">of <span data-show="guardMax"></span><span data-show="broken"></span></div></div>
      <div class="vital"><span class="label">${icon('zap')}At a glance</span><div class="of" data-show="glance"></div></div>
    </div>
    <div class="tabs" role="tablist" aria-label="Sheet sections">
      ${TABS.map((t) => `<button role="tab" id="tab-${t.id}" data-tab="${t.id}" aria-selected="${t.id === tab}" aria-controls="tab-body">${t.label}</button>`).join('')}
    </div>
    <div id="tab-body" role="tabpanel"></div>`;

  const body = main.querySelector('#tab-body');
  const saveState = main.querySelector('#save-state');

  function drawTab() {
    body.innerHTML = { core: coreTab, arcane: arcaneTab, features: featuresTab, reference: referenceTab }[tab]();
    body.setAttribute('aria-labelledby', `tab-${tab}`);
    const m = body.querySelector('#momentum');
    if (m) momentumTracker(m, (die) => { c.momentum.die = die; changed(); }, Number(c.momentum.die) || 4);
    refresh();
  }

  /** Recalculates the automatic numbers and updates everything that displays them. */
  function refresh() {
    d = derive(c);
    const show = {
      name: c.identity.name || 'Unnamed Character',
      subtitle: [`Level ${d.level}`, c.identity.species, c.identity.className, c.identity.subclass && `(${c.identity.subclass})`].filter(Boolean).join(' '),
      hpMax: c.hp.max,
      hpTemp: F.num(c.hp.temp) ? ` (+${F.num(c.hp.temp)} temp)` : '',
      manaMax: d.manaMax,
      guardMax: d.guardMax,
      broken: F.num(c.chain.guardCurrent) <= 0 ? ' - Broken' : '',
      glance: `AC ${d.acTotal} · PB ${F.signed(d.profBonus)} · Save DC ${d.saveDC} · d${c.momentum.die}`,
      acTotal: d.acTotal,
      acNote: d.itemAc ? `${F.num(c.vitals.ac)} base ${F.signed(d.itemAc)} from items in use` : 'Base AC + items in use',
      attuneNote: `Attuned: ${d.attunedCount} of 3.${d.attunedCount > 3 ? ' That is more than the usual limit.' : ''}`,
      chainBonus: `(${F.signed(d.chainBonus)} to Chain attacks)`,
    };
    main.querySelectorAll('[data-show]').forEach((el) => { el.textContent = show[el.dataset.show] ?? ''; });
    main.querySelectorAll('[data-auto]').forEach((el) => {
      const value = d.auto[el.dataset.auto];
      const plain = ['passivePerception', 'guardMax', 'chainLength', 'counterCost', 'manaMax', 'saveDC', 'stasisDC'].includes(el.dataset.auto);
      el.placeholder = plain ? String(value) : F.signed(value);
    });
    main.querySelectorAll('[data-mod]').forEach((el) => { el.textContent = F.signed(d.mods[el.dataset.mod]); });
  }

  /** Copies values from `c` back into the inputs (after a button changed them). */
  function syncInputs() {
    main.querySelectorAll('[data-path]').forEach((el) => {
      if (el === document.activeElement) return;
      const value = getPath(c, el.dataset.path);
      if (el.type === 'checkbox') el.checked = !!value; else el.value = value ?? '';
    });
  }

  // ── Saving ─────────────────────────────────────────────────────────────────
  let dirty = false;
  const save = debounce(async () => {
    if (!dirty) return;
    dirty = false;
    try {
      await api('PUT', `/characters/${id}`, { data: c });
      if (!dirty) { saveState.className = 'save-state saved'; saveState.innerHTML = `${icon('check')}Saved`; }
    } catch (err) {
      dirty = true;
      saveState.className = 'save-state error';
      saveState.innerHTML = `${icon('alert')}Not saved - ${esc(err.message)} <button type="button" class="btn sm" id="retry-save">Retry</button>`;
    }
  }, 600);
  function changed() {
    dirty = true;
    saveState.className = 'save-state';
    saveState.textContent = 'Saving...';
    refresh();
    save();
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  main.addEventListener('input', (e) => {
    const el = e.target;
    const typed = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
    if (el.dataset.path) {
      setPath(c, el.dataset.path, typed);
      // The HP / Mana / Guard boxes appear twice (top bar and panel): keep them in step.
      main.querySelectorAll(`[data-path="${el.dataset.path}"]`).forEach((other) => { if (other !== el && other.type !== 'checkbox') other.value = el.value; });
    } else if (el.dataset.override) {
      const value = el.value.trim().replace(/^\+/, '');
      if (value === '' || Number.isNaN(Number(value))) delete c.overrides[el.dataset.override]; else c.overrides[el.dataset.override] = Number(value);
    } else if (el.dataset.list) {
      c[el.dataset.list][Number(el.dataset.index)][el.dataset.field] = typed;
      // Ticking "In use" or "Attuned" changes the row's badge and tick boxes, so redraw.
      if (el.type === 'checkbox') { changed(); return drawTab(); }
    } else return;
    changed();
  });

  main.addEventListener('click', async (e) => {
    const t = e.target.closest('button, [data-tab]');
    if (!t) return;
    const ds = t.dataset;

    if (ds.tab) {
      tab = ds.tab;
      main.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === t)));
      return drawTab();
    }
    if (t.id === 'retry-save') return save.flush();

    // ── Details pop-ups: read about a spell, item or Component without leaving the sheet ──
    const back = '<button class="btn primary" data-close>Back to sheet</button>';
    const missing = (what) => toast(`Details for this ${what} are not available (it may be hidden or removed).`, 'error');
    if (ds.spellDetails !== undefined) {
      const row = c.compositions[Number(ds.spellDetails)];
      const spell = (await loadSpells())[row.list]?.find((x) => x.id === row.spellId);
      return void (spell ? openDialog({ ...spellDetail(row.list, spell), footer: back }) : missing('spell'));
    }
    if (ds.itemDetails) {
      const row = c[ds.itemDetails][Number(ds.index)];
      const item = (await loadItems()).find((x) => x.id === row.itemId);
      return void (item ? openDialog({ ...itemDetail(item), footer: back }) : missing('item'));
    }
    if (ds.component) {
      const comp = findComponent(ds.component);
      return void (comp ? openDialog({ ...componentDetail(comp), footer: back }) : missing('Component'));
    }

    // ── Pick-lists: add things from the site's lists straight onto the sheet ──
    if (ds.action === 'pick-weapon') {
      const weapons = (await loadItems()).filter((x) => x.category === 'Weapon');
      return void openPicker({
        title: 'Add a weapon', entries: weapons, emptyText: 'No weapons are available yet.',
        describe: (w) => [w.damage, w.properties.join(', '), w.rarity !== 'Mundane' && w.rarity].filter(Boolean).join(' · '),
        onPick: (w) => { c.weapons.push(weaponRow(w)); changed(); drawTab(); toast(`${w.name} added.`); },
      });
    }
    if (ds.action === 'pick-item') {
      const items = (await loadItems()).filter((x) => x.category !== 'Weapon');
      return void openPicker({
        title: 'Add an item', intro: 'Weapons are added on the Core & Combat tab.', entries: items, emptyText: 'No items are available yet.',
        describe: (it) => [it.category, it.rarity !== 'Mundane' && it.rarity, it.attunement && 'Attunement'].filter(Boolean).join(' · '),
        onPick: (it) => { giveItem(c, it); changed(); drawTab(); toast(`${it.name} added. Tick "In use" to apply it.`); },
      });
    }
    if (ds.action === 'learn') {
      const path = ds.kind === 'Physical' ? 'language.physicals' : 'language.aspectuals';
      const unknown = COMPONENTS.filter((x) => x.kind === ds.kind && !getPath(c, path).includes(x.name));
      return void openPicker({
        title: `Learn ${ds.kind === 'Physical' ? 'a Physical' : 'an Aspectual'} Component`, entries: unknown,
        intro: 'Only add a Component your character has actually learned in the campaign.',
        emptyText: 'There is nothing new to learn right now. Your DM reveals more Components as the campaign goes on.',
        describe: (x) => x.description.split('\n')[0],
        onPick: (x) => { setPath(c, path, [...getPath(c, path), x.name]); changed(); drawTab(); toast(`${x.name} learned.`); },
      });
    }
    if (ds.forget) {
      setPath(c, ds.forget, getPath(c, ds.forget).filter((v) => v !== ds.value));
      changed();
      return drawTab();
    }

    if (ds.step) {
      const limits = { 'hp.current': F.num(c.hp.max, Infinity) || Infinity, 'arcane.manaCurrent': d.manaMax, 'chain.guardCurrent': d.guardMax };
      const next = Math.min(limits[ds.step] ?? Infinity, Math.max(0, F.num(getPath(c, ds.step)) + Number(ds.delta)));
      setPath(c, ds.step, next);
    } else if (ds.pip) {
      // Tapping the highest filled circle clears it; otherwise fill up to the tapped one.
      const n = Number(ds.n);
      setPath(c, ds.pip, Number(getPath(c, ds.pip)) === n ? n - 1 : n);
      main.querySelectorAll(`[data-pip="${ds.pip}"]`).forEach((b) => b.setAttribute('aria-pressed', String(Number(getPath(c, ds.pip)) >= Number(b.dataset.n))));
    } else if (ds.set) {
      setPath(c, ds.set, Number(ds.value));
      main.querySelectorAll(`[data-set="${ds.set}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
    } else if (ds.skill) {
      const level = ((Number(c.skills[ds.skill]) || 0) + 1) % 3;
      c.skills[ds.skill] = level;
      t.dataset.level = level;
      t.textContent = ['-', 'P', 'E'][level];
      t.setAttribute('aria-label', `${ds.skill} training: ${['untrained', 'proficient', 'expertise'][level]}`);
    } else if (ds.chip) {
      const list = getPath(c, ds.chip);
      const on = !list.includes(ds.value);
      setPath(c, ds.chip, on ? [...list, ds.value] : list.filter((v) => v !== ds.value));
      t.setAttribute('aria-pressed', String(on));
    } else if (ds.add) {
      c[ds.add].push(NEW_ROW[ds.add]());
      changed();
      return drawTab();
    } else if (ds.remove) {
      const row = c[ds.remove][Number(ds.index)];
      if (Object.entries(row).some(([k, v]) => !['id', 'status', 'qty', 'category'].includes(k) && v !== '' && v != null && v !== false && v !== 0)) {
        const ok = await confirmDialog({ title: 'Remove this row?', message: `"${row.name || 'This row'}" will be removed from the sheet.`, confirmLabel: 'Remove', danger: true });
        if (!ok) return;
      }
      c[ds.remove].splice(Number(ds.index), 1);
      changed();
      return drawTab();
    } else if (ds.cast !== undefined) {
      const row = c.compositions[Number(ds.cast)];
      const cost = F.num(row.mana);
      if (cost > F.num(c.arcane.manaCurrent)) return toast(`Not enough Mana: ${row.name || 'this spell'} costs ${cost}, you have ${F.num(c.arcane.manaCurrent)}.`, 'error');
      c.arcane.manaCurrent = F.num(c.arcane.manaCurrent) - cost;
      toast(`${row.name || 'Spell'} cast: ${cost} Mana spent, ${c.arcane.manaCurrent} left.`);
    } else if (ds.action === 'refresh-guard') {
      c.chain.guardCurrent = d.guardMax;
      toast(`Guard refreshed to ${d.guardMax}.`);
    } else if (ds.action === 'end-chain') {
      c.chain.momentum = 0;
      main.querySelectorAll('[data-set="chain.momentum"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === '0')));
      toast('Chain ended. Chain Momentum reset to 0.');
    } else if (ds.action === 'restore-mana') {
      c.arcane.manaCurrent = d.manaMax;
      toast(`Mana restored to ${d.manaMax}.`);
    } else return;

    syncInputs();
    changed();
  });

  drawTab();

  // When the player leaves the page, send any edit that is still waiting.
  return () => save.flush();
}
