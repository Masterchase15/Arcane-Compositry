/**
 * rules/constants.js - the lists the whole site is built on.
 *
 * This file is shared by the browser AND the server (the server uses it to
 * check that a spell's school and classes are real). Change a list here and
 * every filter, dropdown and validator picks it up.
 *
 * ─── HOW TO ADD THINGS ──────────────────────────────────────────────────────
 *  New class ........ data/classes.js, or the DM page (not this file).
 *  New item category  add its name to ITEM_CATEGORIES.
 *  New school ....... add its name to SCHOOLS.
 *  New Component .... DM page (Spells > Physical & Aspectual) or data/components.js.
 *  New Form ......... add a line to FORMS (name + the damage die it usually uses).
 * ────────────────────────────────────────────────────────────────────────────
 */

/** The eight schools of magic, used as the "type" filter on both spell indexes. */
export const SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];

export const ABILITIES = [
  { key: 'str', name: 'Strength', short: 'STR' },
  { key: 'dex', name: 'Dexterity', short: 'DEX' },
  { key: 'con', name: 'Constitution', short: 'CON' },
  { key: 'int', name: 'Intelligence', short: 'INT' },
  { key: 'wis', name: 'Wisdom', short: 'WIS' },
  { key: 'cha', name: 'Charisma', short: 'CHA' },
];

/** Skills grouped under their ability, exactly as printed on the character sheet. */
export const SKILLS = {
  str: ['Athletics'],
  dex: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
  con: [],
  int: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
  wis: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
  cha: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
};

/**
 * Classes.
 *
 * The classes themselves are DATA, not code: they live in data/classes.js and
 * on the DM page (so you can add custom ones). The site loads them when it
 * starts and puts them in these two lists, which every page then reads.
 * To add or change a class, see docs/ADDING_ITEMS_AND_CLASSES.md.
 *
 * Each class has (among other things):
 *   hitDie      size of the class Hit Die
 *   saves       the two saving throws the class is proficient in
 *   invocation  the ability normally used as the Invocation Modifier (codex p.8)
 *   caster      which Mana pool the class uses (codex p.9): 'full', 'partial' (65%) or 'martial' (40%)
 */
export const CLASSES = [];
export const CLASS_NAMES = [];

/** Called once the class list arrives from the server (and again after the DM edits a class). */
export function setClasses(list) {
  CLASSES.splice(0, CLASSES.length, ...list);
  CLASS_NAMES.splice(0, CLASS_NAMES.length, ...list.map((c) => c.name));
}

export const findClass = (name) =>
  CLASSES.find((c) => c.name.toLowerCase() === String(name || '').trim().toLowerCase()) || null;

/** Kinds of creature on the DM's private NPCs & Enemies list. */
export const NPC_KINDS = ['NPC', 'Ally', 'Enemy', 'Boss'];

/** Categories and rarities for the Items & Weapons page. Add a name here and it appears in every filter. */
export const ITEM_CATEGORIES = ['Weapon', 'Armor', 'Item', 'Adventuring Gear', 'Tool', 'Consumable', 'Magic Item', 'Catalyst'];
export const ITEM_RARITIES = ['Mundane', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];

/** A spell whose `classes` list contains this word can be learned by every class. */
export const ANY_CLASS = 'Any';

/**
 * Physical & Aspectual Components.
 *
 * Like classes, Components are DATA: they live in data/components.js and on
 * the DM page (Spells > Physical & Aspectual), where each one can be hidden
 * from players until it is discovered. The site loads the ones the viewer is
 * allowed to see when it starts and fills these lists.
 *   Physical  - "What exists?"                 (codex p.4)
 *   Aspectual - "What property is applied?"    (codex p.4)
 * A character only KNOWS the Components recorded on their sheet.
 */
export const COMPONENT_KINDS = ['Physical', 'Aspectual'];
export const COMPONENTS = [];
export const PHYSICALS = [];
export const ASPECTUALS = [];

/** Called once the Component list arrives from the server (and again after the DM edits one). */
export function setComponents(list) {
  COMPONENTS.splice(0, COMPONENTS.length, ...list);
  PHYSICALS.splice(0, PHYSICALS.length, ...list.filter((c) => c.kind === 'Physical').map((c) => c.name));
  ASPECTUALS.splice(0, ASPECTUALS.length, ...list.filter((c) => c.kind === 'Aspectual').map((c) => c.name));
}
export const findComponent = (name) =>
  COMPONENTS.find((c) => c.name.toLowerCase() === String(name || '').trim().toLowerCase()) || null;

/**
 * Forms - "How does it manifest?" (codex p.3-4)
 *   delivery  the damage-die category this Form normally uses (see DELIVERIES in tables.js).
 *             Players can always override it in the Spellcrafter.
 */
export const FORMS = [
  { name: 'Projectile', delivery: 'single' },
  { name: 'Beam',       delivery: 'single' },
  { name: 'Strike',     delivery: 'single' },
  { name: 'Burst',      delivery: 'area' },
  { name: 'Wall',       delivery: 'area' },
  { name: 'Field',      delivery: 'persistent' },
  { name: 'Bind',       delivery: 'single' },
  { name: 'Barrier',    delivery: 'area' },
  { name: 'Infusion',   delivery: 'infusion' },
  { name: 'Armor',      delivery: 'armor' },
];

/** Status column on the sheet's Compositions table. */
export const SPELL_STATUSES = ['Improvised', 'Codified', 'Prepared', 'Signature'];

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
