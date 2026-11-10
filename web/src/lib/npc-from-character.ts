/**
 * lib/npc-from-character.ts - turns a character sheet into an NPC / enemy entry.
 *
 * Used by "Copy from Characters" on the campaign's NPCs & Enemies tab: the DM
 * picks one of their characters (or a party member's), and the NPC form opens
 * filled in from that sheet - stat block, attacks, Arcane Profile and story.
 * The character itself is not changed; the NPC is a separate copy.
 */
import { ABILITIES, SKILLS } from '@shared/rules/constants.js';
import { derive, skillKey, upgrade } from '@shared/rules/character.js';
import { signed } from '@shared/rules/formulas.js';

const text = (v: unknown) => String(v ?? '').trim();
const join = (parts: unknown[], sep = ', ') => parts.map(text).filter(Boolean).join(sep);
/** A free-text box becomes one "Name | text" trait (the NPC form keeps one line per trait). */
const flat = (v: unknown) => text(v).replace(/\s*\r?\n+\s*/g, ' ');

/** An NPC entry (same shape the NPC form and server/catalog.js validateNpc() use) built from a sheet. */
export function npcFromCharacter(saved: any) {
  const c = upgrade(saved);
  const d: any = derive(c);
  const id = c.identity;

  const scores = Object.fromEntries(ABILITIES.map((a: any) => [a.key, Number(c.abilities[a.key].score) || 10]));
  const saves = join(ABILITIES.filter((a: any) => c.abilities[a.key].save).map((a: any) => `${a.short[0]}${a.short.slice(1).toLowerCase()} ${signed(d[`save_${a.key}`])}`));
  const skills = join(Object.values(SKILLS).flat()
    .filter((s: any) => Number(c.skills[s]) > 0)
    .sort()
    .map((s: any) => `${s} ${signed(d[skillKey(s)])}`));

  // Weapons become actions; spells and Compositions become one Spellcasting trait.
  const actions = (c.weapons || []).filter((w: any) => text(w.name)).map((w: any) => ({
    name: text(w.name),
    text: join([w.atk && `${text(w.atk)} to hit`, w.damage && `Hit: ${text(w.damage)}`, w.chain && `Chain: ${text(w.chain)}`, w.notes], '. '),
  }));
  const spells = (c.compositions || []).filter((s: any) => text(s.name));
  const traits = [
    ...(spells.length ? [{
      name: 'Spellcasting',
      text: `Spell attack ${signed(d.arcaneAttack)}, save DC ${d.saveDC}. ${spells.map((s: any) => text(s.name)).join(', ')}.`,
    }] : []),
    ...(text(c.features.classFeatures) ? [{ name: 'Class features', text: flat(c.features.classFeatures) }] : []),
    ...(text(c.features.speciesTraits) ? [{ name: 'Species traits', text: flat(c.features.speciesTraits) }] : []),
    ...(text(c.features.specialRules) ? [{ name: 'Special rules', text: flat(c.features.specialRules) }] : []),
  ];
  const signatures = spells.map((s: any) => {
    const lvl = text(s.level);
    const level = !lvl ? '' : /^\d+$/.test(lvl) ? `level ${lvl}` : lvl.toUpperCase() === 'C' ? 'cantrip' : `Potency ${lvl}`;
    const parts = join([s.components, s.form, level, text(s.mana) && `${text(s.mana)} Mana`, s.damage]);
    return parts ? `${text(s.name)} (${parts}).` : `${text(s.name)}.`;
  }).join('\n');

  const lang = c.language || {};
  const classLine = join([id.species, join([id.className, id.subclass && `(${text(id.subclass)})`], ' '), id.className && `level ${d.level}`], ' ');
  const gear = join([...(c.inventory || []).map((i: any) => text(i.name)), c.gear.equipment]);

  return {
    name: text(id.name) || 'Unnamed character',
    kind: 'NPC',
    size: text(c.vitals.size) || 'Medium',
    creatureType: 'Humanoid',
    alignment: text(id.alignment),
    cr: '',
    pb: d.profBonus,
    ac: String(d.acTotal),
    initiative: signed(d.initiative),
    hp: c.hp.hitDice ? `${c.hp.max} (${text(c.hp.hitDice)})` : String(c.hp.max || ''),
    speed: text(c.vitals.speed),
    scores,
    saves, skills,
    vulnerabilities: '', resistances: '', immunities: '',
    senses: `Passive Perception ${d.passivePerception}`,
    languages: text(c.misc.languages),
    gear,
    traits, actions, bonusActions: [], reactions: [], legendary: [],
    chainLength: String(d.chainLength ?? ''),
    guard: String(d.guardMax ?? ''),
    momentum: `d${c.momentum.die}`,
    invocation: spells.length || c.casterType !== 'martial' ? c.arcane.invocationAbility : '',
    maxPotency: Number(c.arcane.maxPotency) || 0,
    mana: String(d.manaMax ?? ''),
    temperament: '',
    physicals: [...(lang.physicals || []), ...text(lang.otherPhysicals).split(',')].map(text).filter(Boolean),
    aspectuals: [...(lang.aspectuals || []), ...text(lang.otherAspectuals).split(',')].map(text).filter(Boolean),
    forms: [...(lang.forms || []), ...text(lang.otherForms).split(',')].map(text).filter(Boolean),
    signatures,
    location: '', faction: '',
    description: join([
      classLine && `${classLine}, copied from a character sheet.`,
      text(c.story.appearance),
      text(c.story.backstory),
    ], '\n\n') || 'Copied from a character sheet.',
    notes: text(c.misc.campaignNotes),
    tags: ['from character'],
    hidden: false,
  };
}
