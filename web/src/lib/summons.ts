/**
 * lib/summons.ts - a summon's numbers at the level it is used, and sheet rows for them.
 *
 * Used by the Summons & Familiars page (the stat block), the character sheet's
 * Summons & Familiars panel and the DM's Initiative Tracker, so all three agree.
 *
 * TWO WAYS A STAT BLOCK CHANGES
 *  - Spell summons (`spellLevel` set): AC and HP like "14 + the spell's level"
 *    are worked out for the level it was cast at (scaleBySpellLevel in formulas.js).
 *  - Dynamic companions (category Companion, growth 'dynamic'): the stat block is
 *    level 1. At level L it has
 *      HP     base HP + hpPerLevel x (L - 1)
 *      AC     base AC + 1 for every `acEvery` levels after 1st
 *      scores each of `growAbilities` + 1 for every `abilityEvery` levels after 1st (max 30)
 *      PB     the usual proficiency bonus for level L
 *      and every `levelFeatures` entry of level L or lower.
 */
import { abilityMod, proficiencyBonus, scaleBySpellLevel, signed } from '@shared/rules/formulas.js';

/** A Companion the DM marked Dynamic: it gains levels. */
export const isDynamic = (s: any) => s?.category === 'Companion' && s?.growth === 'dynamic';

const leading = (text: unknown): number | null => { const m = String(text ?? '').match(/-?\d+/); return m ? Number(m[0]) : null; };
const clampLevel = (n: unknown) => Math.min(20, Math.max(1, Math.round(Number(n)) || 1));

export interface SummonStats {
  ac: string; hp: string;            // as shown in the stat block
  acN: number | ''; hpN: number | ''; // the numbers, for the sheet and the tracker
  scores: Record<string, number>; pb: number; initiative: string;
  castLevel: number;                 // 0 when it does not scale with a spell
  level: number;                     // 0 unless it is a Dynamic companion
  features: { level: number; name: string; text: string; unlocked: boolean }[];
  dynamic: boolean;
}

/** Everything that depends on the spell level (castLevel) or the companion's level. */
export function summonStats(s: any, opts: { castLevel?: number; level?: number } = {}): SummonStats {
  const dynamic = isDynamic(s);
  const castLevel = s.spellLevel ? Math.max(s.spellLevel, Math.min(9, Math.round(Number(opts.castLevel)) || s.spellLevel)) : 0;
  const level = dynamic ? clampLevel(opts.level) : 0;
  let ac = String(s.ac ?? '');
  let hp = String(s.hp ?? '');
  const scores = { ...s.scores };
  let pb = Number(s.pb) || 2;
  let initiative = String(s.initiative ?? '');

  if (castLevel) {
    const a = scaleBySpellLevel(ac, castLevel); if (a !== null) ac = String(a);
    const h = scaleBySpellLevel(hp, castLevel); if (h !== null) hp = String(h);
  }
  if (dynamic) {
    const steps = (every: number) => (every > 0 ? Math.floor((level - 1) / every) : 0);
    const baseHp = leading(hp);
    if (baseHp !== null) hp = String(baseHp + (Number(s.hpPerLevel) || 0) * (level - 1));
    const baseAc = leading(ac);
    if (baseAc !== null && steps(s.acEvery)) ac = ac.replace(/-?\d+/, String(baseAc + steps(s.acEvery)));
    const boost = steps(s.abilityEvery);
    for (const k of s.growAbilities || []) scores[k] = Math.min(30, (Number(scores[k]) || 10) + boost);
    pb = proficiencyBonus(level);
    // Initiative follows any Dexterity growth.
    const dexGain = abilityMod(scores.dex) - abilityMod(s.scores?.dex);
    if (dexGain) initiative = signed((leading(initiative) ?? abilityMod(s.scores?.dex)) + dexGain);
  }
  const features = (s.levelFeatures || []).map((f: any) => ({ ...f, unlocked: !dynamic || f.level <= level }));
  return { ac, hp, acN: leading(ac) ?? '', hpN: leading(hp) ?? '', scores, pb, initiative, castLevel, level, features, dynamic };
}

/** "Passive Perception 12" out of a senses line, or ''. */
export const passivePerception = (senses: string) => senses?.match(/Passive Perception\s+(\d+)/i)?.[1] ?? '';

/** A new row for the character sheet's Summons & Familiars panel. */
export function sheetSummonRow(s: any, characterLevel: number) {
  const castLevel = s.spellLevel || 0;
  const level = isDynamic(s) ? clampLevel(characterLevel) : 0;
  const st = summonStats(s, { castLevel, level });
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    summonId: s.id, name: s.name, category: s.category, castLevel, level,
    hp: st.hpN, hpMax: st.hpN, tempHp: '', notes: '',
    snapshot: s,
  };
}
