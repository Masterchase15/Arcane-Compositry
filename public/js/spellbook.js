/**
 * spellbook.js - putting spells and Compositions onto a character sheet.
 *
 * ─── THE CLASS RULE LIVES HERE ─────────────────────────────────────────────
 * When a player adds a spell, addSpellToCharacter() compares the character's
 * class with the spell's `classes` list.
 *
 *   CLASS_RULE = 'warn'   (current) the player is warned and may add it anyway
 *                         - for multiclassing, feats or a DM ruling.
 *   CLASS_RULE = 'block'  the spell cannot be added unless the class matches
 *                         (DMs can still add anything).
 *
 * Change the one word below to switch behaviour for the whole site.
 */
import { api, isDM } from './api.js';
import { confirmDialog, toast } from './ui.js';
import { ROMAN } from './rules/constants.js';
import { codifiedSpellMana } from './rules/formulas.js';
import { classAllowed, upgrade } from './rules/character.js';

export const CLASS_RULE = 'warn'; // 'warn' or 'block'

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

/** A blank row for the sheet's "Compositions, Codified Spells & Improvisations" table. */
export function blankComposition() {
  return { id: newId(), level: '', name: '', components: '', form: '', mana: '', range: '', atkdc: '', damage: '', status: 'Improvised' };
}

/** Turns a spell from either index into a row for the sheet's compositions table. */
export function spellToRow(listName, spell) {
  const base = { ...blankComposition(), name: spell.name, range: spell.range, status: 'Codified', spellId: spell.id, list: listName };
  if (listName === 'codified') {
    return { ...base, level: spell.level === 0 ? 'C' : String(spell.level), components: spell.components, form: spell.school, mana: codifiedSpellMana(spell.level) };
  }
  return {
    ...base,
    level: ROMAN[spell.potency],
    components: [...spell.physicals, ...spell.aspectuals].join(' + '),
    form: spell.form,
    mana: spell.mana,
    atkdc: spell.resolution,
    damage: spell.damage,
  };
}

/** Loads a character, adds one row to its compositions, and saves it. */
export async function appendComposition(characterId, row) {
  const { data } = await api('GET', `/characters/${characterId}`);
  const character = upgrade(data);
  character.compositions.push({ ...blankComposition(), ...row });
  await api('PUT', `/characters/${characterId}`, { data: character });
  return character;
}

/**
 * Adds a spell to a character, applying the class rule.
 * @returns {Promise<boolean>} true when the spell was added
 */
export async function addSpellToCharacter(listName, spell, characterId) {
  const { data } = await api('GET', `/characters/${characterId}`);
  const character = upgrade(data);
  const who = character.identity.name || 'this character';

  if (character.compositions.some((c) => c.spellId === spell.id && c.list === listName)) {
    toast(`${spell.name} is already on ${who}'s sheet.`);
    return false;
  }

  if (!classAllowed(spell, character.identity.className)) {
    const cls = character.identity.className || 'no class set';
    const allowed = spell.classes.join(', ');
    if (CLASS_RULE === 'block' && !isDM()) {
      toast(`${spell.name} is for ${allowed}. ${who} is a ${cls}.`, 'error');
      return false;
    }
    const ok = await confirmDialog({
      title: 'Not on this class list',
      message: `${spell.name} is normally available to: ${allowed}. ${who} is a ${cls}. Add it anyway? (Do this for multiclassing, a feat, or when your DM allows it.)`,
      confirmLabel: 'Add anyway',
    });
    if (!ok) return false;
  }

  character.compositions.push(spellToRow(listName, spell));
  await api('PUT', `/characters/${characterId}`, { data: character });
  toast(`${spell.name} added to ${who}.`);
  return true;
}

/** A row for the sheet's "Weapons & Attacks" table, filled in from a weapon on the Items page. */
export function weaponRow(item) {
  return {
    itemId: item.id, name: item.name, atk: '', damage: item.damage, chain: item.chainTrait,
    notes: [...item.properties, item.mastery && `Mastery: ${item.mastery}`].filter(Boolean).join(', '),
  };
}

/**
 * A row for the sheet's Inventory, filled in from an item (or blank when no item is given).
 * acBonus / saveBonus are copied from the item and only count while the row is ticked
 * "In use" (and "Attuned", when the item needs attunement).
 */
export function inventoryRow(item) {
  return {
    id: newId(), itemId: item?.id || '', name: item?.name || '', category: item?.category || 'Item', qty: 1,
    equipped: false, attunement: !!item?.attunement, attuned: false,
    acBonus: item?.acBonus || 0, saveBonus: item?.saveBonus || 0,
    notes: item ? [item.armorClass && `AC ${item.armorClass}`, item.weight].filter(Boolean).join(', ') : '',
  };
}

/** Puts an item onto a character object (not saved yet). Returns where it went. */
export function giveItem(character, item) {
  if (item.category === 'Weapon') {
    character.weapons.push(weaponRow(item));
    return 'Weapons & Attacks';
  }
  character.inventory.push(inventoryRow(item));
  if (item.category === 'Catalyst' && !character.catalyst.name) {
    Object.assign(character.catalyst, { name: item.name, capacity: item.capacity, throughput: item.throughput });
    return 'Inventory and the Catalyst panel';
  }
  return 'Inventory';
}

/** Adds an item from the Items & Weapons page to a character and saves it. */
export async function addItemToCharacter(item, characterId) {
  const { data } = await api('GET', `/characters/${characterId}`);
  const character = upgrade(data);
  const where = giveItem(character, item);
  await api('PUT', `/characters/${characterId}`, { data: character });
  const tip = item.acBonus || item.saveBonus || item.attunement ? ' Tick "In use" on the sheet to apply it.' : '';
  toast(`${item.name} added to ${character.identity.name || 'this character'} (${where}).${tip}`);
  return true;
}

/** Records that a character has learned a Physical or Aspectual Component. */
export async function learnComponent(component, characterId) {
  const { data } = await api('GET', `/characters/${characterId}`);
  const character = upgrade(data);
  const who = character.identity.name || 'this character';
  const known = component.kind === 'Physical' ? character.language.physicals : character.language.aspectuals;
  if (known.includes(component.name)) {
    toast(`${who} already knows ${component.name}.`);
    return false;
  }
  known.push(component.name);
  await api('PUT', `/characters/${characterId}`, { data: character });
  toast(`${who} learned ${component.name}.`);
  return true;
}
