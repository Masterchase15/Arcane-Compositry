/**
 * lib/spellbook.ts - putting spells, items and Components onto a character sheet.
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
import { toast } from 'sonner';
import { ROMAN } from '@shared/rules/constants.js';
import { codifiedSpellMana } from '@shared/rules/formulas.js';
import { classAllowed, upgrade } from '@shared/rules/character.js';
import { api } from './api';

export const CLASS_RULE: 'warn' | 'block' = 'warn';

type Confirm = (ask: { title: string; message: string; confirmLabel?: string }) => Promise<boolean>;
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

/** A blank row for the sheet's "Compositions, Codified Spells & Improvisations" table. */
export function blankComposition() {
  return { id: newId(), level: '', name: '', components: '', form: '', mana: '' as number | string, range: '', atkdc: '', damage: '', status: 'Improvised' };
}

/** Turns a spell from either index into a row for the sheet's compositions table. */
export function spellToRow(listName: string, spell: any) {
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

async function load(characterId: string) {
  const { data } = await api('GET', `/characters/${characterId}`);
  return upgrade(data);
}
const save = (characterId: string, character: any) => api('PUT', `/characters/${characterId}`, { data: character });

/** Loads a character, adds one row to its compositions, and saves it. */
export async function appendComposition(characterId: string, row: Record<string, unknown>) {
  const character = await load(characterId);
  character.compositions.push({ ...blankComposition(), ...row });
  await save(characterId, character);
  return character;
}

/** Adds a spell to a character, applying the class rule. Resolves true when the spell was added. */
export async function addSpellToCharacter(listName: string, spell: any, characterId: string, { confirm, isDM }: { confirm: Confirm; isDM: boolean }) {
  const character = await load(characterId);
  const who = character.identity.name || 'this character';

  if (character.compositions.some((c: any) => c.spellId === spell.id && c.list === listName)) {
    toast(`${spell.name} is already on ${who}'s sheet.`);
    return false;
  }
  if (!classAllowed(spell, character.identity.className)) {
    const cls = character.identity.className || 'no class set';
    const allowed = spell.classes.join(', ');
    if (CLASS_RULE === 'block' && !isDM) {
      toast.error(`${spell.name} is for ${allowed}. ${who} is a ${cls}.`);
      return false;
    }
    const ok = await confirm({
      title: 'Not on this class list',
      message: `${spell.name} is normally available to: ${allowed}. ${who} is a ${cls}. Add it anyway? (Do this for multiclassing, a feat, or when your DM allows it.)`,
      confirmLabel: 'Add anyway',
    });
    if (!ok) return false;
  }
  character.compositions.push(spellToRow(listName, spell));
  await save(characterId, character);
  toast.success(`${spell.name} added to ${who}.`);
  return true;
}

/** A row for the sheet's "Weapons & Attacks" table, filled in from a weapon on the Items page. */
export function weaponRow(item: any) {
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
export function inventoryRow(item?: any) {
  return {
    id: newId(), itemId: item?.id || '', name: item?.name || '', category: item?.category || 'Item', qty: 1,
    equipped: false, attunement: !!item?.attunement, attuned: false,
    acBonus: item?.acBonus || 0, saveBonus: item?.saveBonus || 0,
    notes: item ? [item.armorClass && `AC ${item.armorClass}`, item.weight].filter(Boolean).join(', ') : '',
  };
}

/** Puts an item onto a character object (not saved yet). Returns where it went. */
export function giveItem(character: any, item: any) {
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
export async function addItemToCharacter(item: any, characterId: string) {
  const character = await load(characterId);
  const where = giveItem(character, item);
  await save(characterId, character);
  const tip = item.acBonus || item.saveBonus || item.attunement ? ' Tick "In use" on the sheet to apply it.' : '';
  toast.success(`${item.name} added to ${character.identity.name || 'this character'} (${where}).${tip}`);
  return true;
}

/** Records that a character has learned a Physical or Aspectual Component. */
export async function learnComponent(component: any, characterId: string) {
  const character = await load(characterId);
  const who = character.identity.name || 'this character';
  const known = component.kind === 'Physical' ? character.language.physicals : character.language.aspectuals;
  if (known.includes(component.name)) {
    toast(`${who} already knows ${component.name}.`);
    return false;
  }
  known.push(component.name);
  await save(characterId, character);
  toast.success(`${who} learned ${component.name}.`);
  return true;
}
