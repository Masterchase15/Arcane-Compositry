/**
 * rules/character.js - the shape of a character sheet and its automatic numbers.
 *
 * A character is one plain object (saved to the database as JSON). It mirrors
 * the four-page "Arcane Compositry Character Sheet":
 *   page 1  identity, vitals, abilities, HP, Attack Chains, Momentum Dice, weapons
 *   page 2  Arcane Core, Catalyst, Tendril, known language, compositions, thaumaturgy,
 *           circuit stability, discoveries
 *   page 3  features, proficiencies, equipment, story, languages, coins, notes
 *   page 4  quick reference + custom table rulings
 *
 * ─── ADDING A NEW FIELD TO THE SHEET ───────────────────────────────────────
 *  1. Add it (with a default) to blankCharacter() below.
 *  2. Show it on the sheet: add  <TextF path="section.field" label="Label" />  to the right tab in web/src/components/sheet/.
 *  Old saved characters pick up the new field automatically (see upgrade()).
 *
 * ─── AUTOMATIC NUMBERS ─────────────────────────────────────────────────────
 *  derive() works out everything the rules can calculate (modifiers, saves,
 *  Guard, Mana, DCs...). A player can type over any of them; that typed value
 *  is stored in `overrides` and wins until the box is cleared again.
 */
import { ABILITIES, SKILLS, findClass } from './constants.js';
import * as F from './formulas.js';

export const SHEET_VERSION = 1;

export function blankCharacter() {
  return {
    version: SHEET_VERSION,
    identity: { name: '', className: '', subclass: '', level: 1, xp: '', background: '', species: '', player: '', alignment: '' },
    casterType: 'full',
    abilities: Object.fromEntries(ABILITIES.map((a) => [a.key, { score: 10, save: false }])),
    skills: {}, // { 'Athletics': 1 }   0/absent = untrained, 1 = Proficient, 2 = Expertise
    vitals: { speed: '30 ft', size: 'Medium', heroicInspiration: false, ac: 10, shieldOtherAc: '' },
    hp: { current: 0, max: 0, temp: 0, hitDice: '', hitDiceSpent: 0, deathSuccess: 0, deathFail: 0 },
    chain: { guardCurrent: 4, momentum: 0, blockFormula: '', finisher: '', posture: '', counterNotes: '' },
    momentum: { die: 4, ability: 'str', modifiers: '' },
    weapons: [],
    // Items carried. Each: { id, itemId, name, category, qty, equipped, attunement, attuned, acBonus, saveBonus, notes }
    inventory: [],
    arcane: { manaCurrent: 0, invocationAbility: 'int', maxPotency: 1 }, // invocationAbility = the spellcasting ability in plain 5e too
    // Plain 5e (campaigns without Arcane Compositry): spell slots spent, for spell levels 1-9.
    spellcasting: { slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    catalyst: { name: '', bond: '', capacity: '', throughput: '', stored: '' },
    tendril: { rootNode: '', color: '', terminals: '', routing: '' },
    language: { physicals: [], aspectuals: [], forms: [], otherPhysicals: '', otherAspectuals: '', otherForms: '', compositeNotes: '' },
    compositions: [],
    thaumaturgy: { infusion: '', chargePool: '', reinforcement: '', duration: '' },
    stability: { dcModifiers: '', notes: '' },
    discoveries: [],
    features: { classFeatures: '', speciesTraits: '', specialRules: '' },
    gear: { armorLight: false, armorMedium: false, armorHeavy: false, armorShields: false, proficiencies: '', equipment: '' },
    story: { backstory: '', appearance: '' },
    misc: { languages: '', attunement: ['', '', ''], cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, carrying: '', campaignNotes: '', tableRulings: '' },
    overrides: {},
  };
}

/** Fills in any fields a saved character is missing (after the sheet gains new fields). */
export function upgrade(saved) {
  const merge = (base, extra) => {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return extra ?? base;
    const out = { ...base };
    for (const key of Object.keys(extra || {})) {
      out[key] = key in base ? merge(base[key], extra[key]) : extra[key];
    }
    return out;
  };
  return merge(blankCharacter(), saved || {});
}

/** Builds a ready-to-play sheet from the answers given in the "New character" form. */
export function characterFromBasics({ name, player, className, level, species, background, alignment, scores }) {
  const c = blankCharacter();
  const cls = findClass(className);
  const lvl = Math.min(20, Math.max(1, Number(level) || 1));
  Object.assign(c.identity, { name, player, className, level: lvl, species, background, alignment });
  for (const a of ABILITIES) c.abilities[a.key].score = Number(scores?.[a.key]) || 10;
  if (cls) {
    for (const key of cls.saves) c.abilities[key].save = true;
    c.casterType = cls.caster;
    c.arcane.invocationAbility = cls.invocation;
    c.momentum.ability = ['str', 'dex'].includes(cls.invocation) ? cls.invocation : 'str';
    const con = F.abilityMod(c.abilities.con.score);
    // Level 1: full Hit Die + CON. Each later level: the fixed average (half the die + 1) + CON.
    c.hp.max = Math.max(1, cls.hitDie + con + (lvl - 1) * (cls.hitDie / 2 + 1 + con));
    c.hp.current = c.hp.max;
    c.hp.hitDice = `${lvl}d${cls.hitDie}`;
  }
  c.vitals.ac = 10 + F.abilityMod(c.abilities.dex.score);
  const d = derive(c);
  c.chain.guardCurrent = d.guardMax;
  c.arcane.manaCurrent = d.manaMax;
  c.arcane.maxPotency = Math.min(9, Math.max(1, Math.ceil(lvl / 2)));
  return c;
}

/** Names of every number derive() can calculate (used to build the override boxes). */
export const skillKey = (skill) => `skill_${skill.replace(/\s+/g, '')}`;

/**
 * Calculates every automatic number on the sheet.
 * Returns an object where each key holds the value in play (override if typed, else the rule),
 * and `auto` holds what the rules alone would give.
 */
export function derive(c) {
  const o = c.overrides || {};
  const auto = {};
  const level = Math.min(20, Math.max(1, Number(c.identity.level) || 1));

  auto.profBonus = F.proficiencyBonus(level);
  const pb = pick(o.profBonus, auto.profBonus);

  const mods = {};
  for (const a of ABILITIES) mods[a.key] = F.abilityMod(c.abilities[a.key].score);

  // Item bonuses count only while the item is in use - and attuned, if it needs attunement.
  const inUse = (c.inventory || []).filter((i) => i.equipped && (!i.attunement || i.attuned));
  const itemAc = inUse.reduce((t, i) => t + F.num(i.acBonus), 0);
  const itemSave = inUse.reduce((t, i) => t + F.num(i.saveBonus), 0);

  for (const a of ABILITIES) {
    auto[`save_${a.key}`] = mods[a.key] + (c.abilities[a.key].save ? pb : 0) + itemSave;
    for (const skill of SKILLS[a.key]) {
      auto[skillKey(skill)] = mods[a.key] + pb * (Number(c.skills[skill]) || 0);
    }
  }

  auto.initiative = mods.dex;
  auto.passivePerception = 10 + pick(o[skillKey('Perception')], auto[skillKey('Perception')]);

  // Attack Chains & active defense (codex p.19-20)
  auto.chainLength = F.maxChainLength(level);
  auto.guardMax = F.guardMax(pb);
  auto.dodge = F.dodgeBonus(mods.dex, pb, c.abilities.dex.save);
  auto.parry = F.parryBonus(mods.str, mods.dex, pb, true);
  auto.blockValue = pb + mods.str;
  auto.counterCost = 2;

  // Arcane Core (codex p.8-9)
  auto.invocationMod = mods[c.arcane.invocationAbility] ?? 0;
  const im = pick(o.invocationMod, auto.invocationMod);
  auto.arcaneAttack = F.arcaneAttackBonus(pb, im);
  auto.saveDC = F.arcaneSaveDC(pb, im);
  auto.manaMax = F.maxMana(level, c.casterType);

  // Plain 5e spellcasting (when Arcane Compositry is not in play): same ability, slots instead of Mana.
  auto.spellAttack = F.spellAttackBonus(pb, im);
  F.spellSlots(level, c.casterType).forEach((n, i) => { auto[`slot${i + 1}`] = n; });

  // Momentum Dice (codex p.27): the Invocation Modifier can power an Arcane attack.
  const momentumMod = c.momentum.ability === 'invocation' ? im : mods[c.momentum.ability] ?? 0;
  auto.stasisDC = F.stasisSaveDC(pb, momentumMod);

  // Circuit Stability & Counter-Compositry (codex p.12, p.15): both are d20 + PB + IM.
  auto.stabilityBonus = pb + im;
  auto.counterBonus = pb + im;

  const out = {
    auto, level, mods, chainBonus: F.chainAttackBonus(c.chain.momentum),
    itemAc, itemSave,
    acTotal: F.num(c.vitals.ac) + itemAc, // the base AC typed on the sheet + items in use
    attunedCount: (c.inventory || []).filter((i) => i.attunement && i.attuned).length,
  };
  for (const key of Object.keys(auto)) out[key] = pick(o[key], auto[key]);
  out.slotMax = Array.from({ length: 9 }, (_, i) => out[`slot${i + 1}`]); // spell slots of level 1-9
  return out;
}

/** A typed override wins; a blank box falls back to the automatic value. */
function pick(override, fallback) {
  return override === '' || override === undefined || override === null || Number.isNaN(Number(override))
    ? fallback
    : Number(override);
}

/** True when the character's class may learn the spell (the spell lists "Any" or the class). */
export function classAllowed(spell, className) {
  const cls = String(className || '').trim().toLowerCase();
  return spell.classes.some((c) => c === 'Any' || c.toLowerCase() === cls);
}
