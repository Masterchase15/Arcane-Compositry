/**
 * rules/formulas.js - EVERY number and formula from the Player's Field Codex.
 *
 * This is the single source of truth for the maths. The Spellcrafter, the
 * calculators, the codex tables and the character sheet all call these
 * functions - nothing else on the site does arithmetic of its own.
 *
 * Tuning the system? Change the table or function here and the whole site
 * follows. Each item notes the codex page it comes from.
 */

// ═══════════════════════════════ TABLES ═════════════════════════════════════

/** Potency I-IX -> Core Mana and what it means at the table (codex p.5). Index = Potency. */
export const POTENCY = [
  null,
  { core: 2,  meaning: 'Minor combat magic' },
  { core: 3,  meaning: 'Reliable adventuring magic' },
  { core: 5,  meaning: 'Major encounter magic' },
  { core: 6,  meaning: 'High-impact magic' },
  { core: 7,  meaning: 'Severe battlefield power' },
  { core: 9,  meaning: 'Exceptional magic' },
  { core: 10, meaning: 'Elite / legendary scale' },
  { core: 11, meaning: 'World-shaping potential' },
  { core: 13, meaning: 'Extreme reality alteration' },
];

/** Codified (normal D&D) spell level -> Mana (codex p.9). Index = spell level, 0 = cantrip. */
export const SPELL_LEVEL_MANA = [0, 2, 3, 5, 6, 7, 9, 10, 11, 13];

/** Mana modifiers (codex p.6). `cost` is added to the spell's Mana. */
export const RANGE_COSTS = [
  { id: 'close', label: 'Self / Touch / 30 ft', cost: 0 },
  { id: '60',    label: '60 ft',  cost: 1 },
  { id: '120',   label: '120 ft', cost: 2 },
  { id: '300',   label: '300 ft', cost: 3 },
];
export const AREA_COSTS = [
  { id: 'single', label: 'Single / tiny', cost: 0 },
  { id: '10',     label: '10 ft', cost: 1 },
  { id: '20',     label: '20 ft', cost: 2 },
  { id: '40',     label: '40 ft', cost: 3 },
  { id: '60',     label: '60 ft', cost: 4 },
];
export const DURATION_COSTS = [
  { id: 'instant', label: 'Instant / one Attack Chain',        cost: 0, concentration: false },
  { id: '1min',    label: 'Up to 1 minute, Concentration',     cost: 1, concentration: true },
  { id: '10min',   label: 'Up to 10 minutes, Concentration',   cost: 2, concentration: true },
  { id: '1hr',     label: 'Up to 1 hour',                      cost: 3, concentration: false },
];
/** "Remove Concentration: usually +2 more" (codex p.6). */
export const REMOVE_CONCENTRATION_COST = 2;

/** Effect ranks. `cost` is both the Mana added AND the damage dice traded away (codex p.6-7). */
export const EFFECT_RANKS = [
  { id: 'cosmetic', label: 'Cosmetic', examples: 'Light, color, sparks', cost: 0 },
  { id: 'minor',    label: 'Minor',    examples: 'Push 5 ft, -10 speed, difficult terrain', cost: 1 },
  { id: 'strong',   label: 'Strong',   examples: 'Prone, disarm, ongoing damage', cost: 2 },
  { id: 'major',    label: 'Major',    examples: 'Restrain, significant blindness, denial', cost: 3 },
  { id: 'extreme',  label: 'Extreme',  examples: 'Stun / paralysis-like control', cost: 4, note: 'Usually Potency V+' },
];

/** Which die a Composition rolls (codex p.7). `infusion` and `armor` come from Applied Thaumaturgy (p.10). */
export const DELIVERIES = [
  { id: 'single',     label: 'Precise single-target', die: 8,  reason: 'Standard focused damage' },
  { id: 'heavy',      label: 'Heavy / risky / exposed', die: 10, reason: 'Reward for a real drawback' },
  { id: 'area',       label: 'Area effect', die: 6, reason: 'Can affect several targets' },
  { id: 'persistent', label: 'Persistent damage', die: 4, reason: 'May trigger repeatedly' },
  { id: 'infusion',   label: 'Weapon infusion (Charge Pool)', die: 6, reason: 'Applied Thaumaturgy' },
  { id: 'armor',      label: 'Defensive infusion (Reinforcement)', die: 0, reason: 'Applied Thaumaturgy' },
];

/** Suggested maximum Chain Length by character level (codex p.19). */
export const CHAIN_TIERS = [
  { from: 1,  to: 4,  max: 2, feel: 'Short exchanges' },
  { from: 5,  to: 10, max: 3, feel: 'Skilled combinations' },
  { from: 11, to: 16, max: 4, feel: 'Veteran pressure' },
  { from: 17, to: 20, max: 5, feel: 'Master-level flurries' },
];

/** The Momentum Die ladder and its Stasis options (codex p.26-28). */
export const MOMENTUM_LADDER = [
  { die: 4,  stasis: null,             threshold: null, chance: null },
  { die: 6,  stasis: 'Break',          threshold: 5,  chance: '33.3%' },
  { die: 8,  stasis: 'Topple',         threshold: 7,  chance: '25%' },
  { die: 10, stasis: 'Daze',           threshold: 9,  chance: '20%' },
  { die: 12, stasis: 'Launch or Smash', threshold: 11, chance: '16.7%' },
];

/** Mana-pool share by caster type (codex p.9). These are the playtest "tuning knobs". */
export const CASTER_TYPES = {
  full:    { label: 'Full caster', share: 1 },
  partial: { label: 'Partial caster (about 65%)', share: 0.65 },
  martial: { label: 'Primarily martial Catalyst user (about 40%)', share: 0.4 },
};

// ═══════════════════════════ CORE D&D NUMBERS ═══════════════════════════════

/** Ability modifier from a score: (score - 10) / 2, rounded down. */
export const abilityMod = (score) => Math.floor((num(score, 10) - 10) / 2);

/** Proficiency Bonus from character level: +2 at 1-4, +3 at 5-8, ... +6 at 17-20. */
export const proficiencyBonus = (level) => 2 + Math.floor((clamp(level, 1, 20) - 1) / 4);

// ═══════════════════════════ ARCANE COMPOSITRY ══════════════════════════════

/** Core Mana for a Potency (codex p.5). */
export const coreMana = (potency) => POTENCY[clamp(potency, 1, 9)].core;

/** Composite cost: 1 Component +0, 2 -> +1, 3 -> +3, 4 -> "+5 or more" (codex p.6). */
export function compositeCost(componentCount) {
  const n = Math.max(1, num(componentCount, 1));
  if (n <= 1) return 0;
  if (n === 2) return 1;
  if (n === 3) return 3;
  return 5; // 4+: the codex says "+5 or more" - the Spellcrafter has a DM-adjustment box for the "or more".
}

/**
 * MASTER MANA FORMULA (codex p.5)
 *   Final Mana = Core Mana + Composite + Range + Area + Duration + Effect
 * plus the optional pieces from p.6-7:
 *   + Remove Concentration (usually +2)
 *   - Environmental discount (1, when an abundant Physical Component is nearby; minimum total 1)
 *   + any DM adjustment
 *
 * @returns {{ total:number, parts:{label:string,value:number}[] }}  parts = the line-by-line breakdown
 */
export function finalMana({
  potency, componentCount = 1, range = 'close', area = 'single', duration = 'instant',
  removeConcentration = false, effect = 'cosmetic', environmental = false, adjustment = 0,
}) {
  const find = (table, id) => table.find((r) => r.id === String(id)) || table[0];
  const dur = find(DURATION_COSTS, duration);
  const parts = [
    { label: 'Core Mana', value: coreMana(potency) },
    { label: 'Composite', value: compositeCost(componentCount) },
    { label: 'Range', value: find(RANGE_COSTS, range).cost },
    { label: 'Area', value: find(AREA_COSTS, area).cost },
    { label: 'Duration', value: dur.cost },
    { label: 'Effect', value: find(EFFECT_RANKS, effect).cost },
  ];
  if (removeConcentration && dur.concentration) parts.push({ label: 'Remove Concentration', value: REMOVE_CONCENTRATION_COST });
  if (environmental) parts.push({ label: 'Environmental discount', value: -1 });
  if (num(adjustment)) parts.push({ label: 'DM adjustment', value: num(adjustment) });
  const sum = parts.reduce((t, p) => t + p.value, 0);
  return { total: Math.max(1, sum), parts };
}

/** DAMAGE DICE = P + 2 + floor(P / 3)   (codex p.7) */
export const damageDice = (potency) => {
  const p = clamp(potency, 1, 9);
  return p + 2 + Math.floor(p / 3);
};

/**
 * FINAL DAMAGE DICE = Normal Dice - Effect Rank   (codex p.7, "Conditions Trade Away Damage")
 * @returns {{ count:number, die:number, text:string, average:number, base:number }}
 */
export function compositionDamage({ potency, delivery = 'single', effect = 'cosmetic' }) {
  const base = damageDice(potency);
  const rank = (EFFECT_RANKS.find((e) => e.id === effect) || EFFECT_RANKS[0]).cost;
  const die = (DELIVERIES.find((d) => d.id === delivery) || DELIVERIES[0]).die;
  const count = Math.max(0, base - rank);
  return { base, count, die, text: die ? `${count}d${die}` : `+${count}`, average: die ? (count * (die + 1)) / 2 : 0 };
}

/** ARCANE ATTACK = d20 + PB + IM   (codex p.8). Returns the bonus added to the d20. */
export const arcaneAttackBonus = (pb, im) => num(pb) + num(im);

/** ARCANE SAVE DC = 8 + PB + IM   (codex p.8) */
export const arcaneSaveDC = (pb, im) => 8 + num(pb) + num(im);

/** Codified spell Mana by spell level (codex p.9). */
export const codifiedSpellMana = (level) => SPELL_LEVEL_MANA[clamp(level, 0, 9)];

/**
 * MAX MANA = floor(5L + L^2 / 12 - 1), then scaled for partial casters and martials (codex p.9).
 * Level 1 = 4, level 5 = 26, level 10 = 57, level 15 = 92, level 20 = 132.
 */
export function maxMana(level, casterType = 'full') {
  const L = clamp(level, 1, 20);
  const full = Math.floor(5 * L + (L * L) / 12 - 1);
  return Math.floor(full * (CASTER_TYPES[casterType] || CASTER_TYPES.full).share);
}

/** Applied Thaumaturgy (codex p.10, p.24): Charge Dice = Potency damage dice, as d6s. */
export const chargePool = (potency) => ({ dice: damageDice(potency), die: 6, text: `${damageDice(potency)}d6` });

/** Applied Thaumaturgy (codex p.10, p.24): Reinforcement = number of Potency damage dice. */
export const reinforcement = (potency) => damageDice(potency);

/**
 * Arcane Attack Chain (codex p.11, p.24): split one damage pool across several attacks.
 * Dice are shared evenly; any left over go to the last attack (the Finisher).
 * Example: 6 dice over 3 hits -> [2, 2, 2].  7 dice over 3 hits -> [2, 2, 3].
 */
export function splitChain(diceCount, hits) {
  const n = clamp(hits, 1, 9);
  const each = Math.floor(diceCount / n);
  const out = Array(n).fill(each);
  out[n - 1] += diceCount - each * n;
  return out;
}

/**
 * CIRCUIT STABILITY DC = 10 + floor(P/2) + Additional Components + floor(Damage Taken / 10)   (codex p.12)
 * Additional Components = Components beyond the first.
 */
export function stabilityDC({ potency, componentCount = 1, damageTaken = 0 }) {
  const parts = [
    { label: 'Base', value: 10 },
    { label: 'floor(Potency / 2)', value: Math.floor(clamp(potency, 1, 9) / 2) },
    { label: 'Additional Components', value: Math.max(0, num(componentCount, 1) - 1) },
    { label: 'floor(Damage / 10)', value: Math.floor(Math.max(0, num(damageTaken)) / 10) },
  ];
  return { total: parts.reduce((t, p) => t + p.value, 0), parts };
}

/** READ THE CIRCUIT: Arcana or Perception vs DC 10 + Potency   (codex p.14) */
export const readCircuitDC = (potency) => 10 + clamp(potency, 1, 9);

// ═════════════════════════ ATTACK CHAINS & DEFENSE ══════════════════════════

/** GUARD = 2 + Proficiency Bonus   (codex p.20) */
export const guardMax = (pb) => 2 + num(pb);

/** Suggested maximum Chain Length for a level (codex p.19). */
export const maxChainLength = (level) =>
  (CHAIN_TIERS.find((t) => clamp(level, 1, 20) >= t.from && clamp(level, 1, 20) <= t.to) || CHAIN_TIERS[0]).max;

/** CHAIN ATTACK BONUS = +1 per Chain Momentum, max +3   (codex p.19) */
export const chainAttackBonus = (momentum) => clamp(momentum, 0, 3);

/** Optional Escalation: Defensive Penalty = -1 per 2 attacks attempted in the current Chain (codex p.23). */
export const escalationPenalty = (attacksAttempted) => -Math.floor(Math.max(0, num(attacksAttempted)) / 2);

/** DODGE = d20 + DEX modifier + PB if proficient in DEX saves   (codex p.20). Returns the bonus. */
export const dodgeBonus = (dexMod, pb, proficientDexSave) => num(dexMod) + (proficientDexSave ? num(pb) : 0);

/** PARRY = d20 + STR or DEX modifier + PB if proficient with the parrying weapon   (codex p.20). */
export const parryBonus = (strMod, dexMod, pb, proficientWeapon = true) =>
  Math.max(num(strMod), num(dexMod)) + (proficientWeapon ? num(pb) : 0);

/** BLOCK baselines (codex p.20). Returns the three suggested damage reductions as text + flat part. */
export function blockOptions(pb, strMod, reinforcementBonus = 0) {
  const r = num(reinforcementBonus);
  const flat = (n) => (n + r >= 0 ? `+ ${n + r}` : `- ${Math.abs(n + r)}`);
  return [
    { tool: 'Weapon block', text: `${num(pb) + num(strMod) + r}`, average: num(pb) + num(strMod) + r },
    { tool: 'Shield', text: `1d8 ${flat(num(strMod))}`, average: 4.5 + num(strMod) + r },
    { tool: 'Heavy shield / equivalent', text: `1d10 ${flat(num(strMod))}`, average: 5.5 + num(strMod) + r },
  ];
}

/**
 * How an active defense roll compares to the attack (codex p.20).
 * @returns {'fail'|'success'|'perfect'|'masterful'}  masterful only applies to Parry (beat by 10+)
 */
export function defenseResult(defenseTotal, attackTotal) {
  const margin = num(defenseTotal) - num(attackTotal);
  if (margin >= 10) return 'masterful';
  if (margin >= 5) return 'perfect';
  if (margin >= 0) return 'success';
  return 'fail';
}

/** Optional Degrees of Miss (codex p.23). */
export function attackDegree(attackTotal, ac) {
  const margin = num(attackTotal) - num(ac);
  if (margin <= -5) return { id: 'clean-miss', label: 'Clean Miss', text: 'Miss by 5+: normal recovery options. Also a Counter-attack trigger.' };
  if (margin < 0) return { id: 'near-miss', label: 'Near Miss', text: 'Miss by 1-4: choose ONE lesser outcome - continue at -2, move the target 5 ft, force 1 Guard, or gain a small setup benefit.' };
  if (margin >= 5) return { id: 'strong-hit', label: 'Strong Hit', text: 'Beat AC by 5+: optionally gain 1 extra Chain Momentum (still capped at +3).' };
  return { id: 'hit', label: 'Hit', text: 'Normal hit: the Chain continues.' };
}

// ══════════════════════════════ MOMENTUM DICE ═══════════════════════════════

/** STASIS SAVE DC = 8 + Proficiency Bonus + Momentum Ability Modifier   (codex p.27) */
export const stasisSaveDC = (pb, abilityModifier) => 8 + num(pb) + num(abilityModifier);

/** Next step on the ladder after a build hit: d4 > d6 > d8 > d10 > d12 (stays at d12). */
export const nextMomentumDie = (die) => Math.min(12, clamp(die, 4, 12) + 2);

export const momentumStep = (die) => MOMENTUM_LADDER.find((s) => s.die === num(die, 4)) || MOMENTUM_LADDER[0];

// ══════════════════════════════ ENEMY COMPOSITORS ═══════════════════════════

/** Roll Arcane Intent (codex p.18). */
export const ARCANE_INTENT = [
  null,
  'Direct damage / pressure',
  'Battlefield control',
  'Defense / protection',
  'Positioning / movement',
  'Disruption / break Guard or circuits',
  'Signature or dramatic technique',
];

/** "Will they improvise?" - improvises when a d6 is at least this number (codex p.18). */
export const TEMPERAMENTS = {
  disciplined:  { label: 'Disciplined',  improvisesOn: 6 },
  adaptive:     { label: 'Adaptive',     improvisesOn: 5 },
  experimental: { label: 'Experimental', improvisesOn: 3 },
};

/**
 * Choose Potency (codex p.18): 1 = about one-third of maximum, 2-3 = about two-thirds,
 * 4-5 = maximum minus 1, 6 = maximum. An aggressive NPC (bloodied, desperate, enraged,
 * protecting something) is treated as one category more aggressive.
 */
export function npcPotency(d6, maxPotency, aggressive = false) {
  const max = clamp(maxPotency, 1, 9);
  let category = d6 <= 1 ? 0 : d6 <= 3 ? 1 : d6 <= 5 ? 2 : 3;
  if (aggressive) category = Math.min(3, category + 1);
  const options = [
    { label: 'About one-third maximum', potency: Math.max(1, Math.round(max / 3)) },
    { label: 'About two-thirds maximum', potency: Math.max(1, Math.round((max * 2) / 3)) },
    { label: 'Maximum minus 1', potency: Math.max(1, max - 1) },
    { label: 'Maximum Potency', potency: max },
  ];
  return options[category];
}

// ══════════════════ D&D 5e SPELL SLOTS (no Arcane Compositry) ═════════════════
// Used by the character sheet in campaigns that play without Arcane Compositry.

/** Spell slots of level 1-9 for a full caster at character level 1-20 (SRD 5.2). */
export const FULL_CASTER_SLOTS = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/**
 * Nine numbers: how many slots of each spell level. 'full' casters use the table
 * above, 'partial' (half) casters the same table at half their level (rounded
 * up), 'martial' classes have none. (A class's `caster` sets which.)
 */
export function spellSlots(level, casterType = 'full') {
  const lvl = clamp(level, 1, 20);
  const row = casterType === 'full' ? FULL_CASTER_SLOTS[lvl - 1] : casterType === 'partial' ? FULL_CASTER_SLOTS[Math.ceil(lvl / 2) - 1] : [];
  return Array.from({ length: 9 }, (_, i) => row[i] ?? 0);
}

/** Spell save DC and spell attack bonus (the same maths as the Arcane ones). */
export const spellSaveDC = (pb, abilityModifier) => 8 + num(pb) + num(abilityModifier);
export const spellAttackBonus = (pb, abilityModifier) => num(pb) + num(abilityModifier);

// ═════════════════════════════════ HELPERS ══════════════════════════════════

/** Roll `count` dice with `sides` sides. Returns each die and the total. */
export function roll(count, sides) {
  const dice = Array.from({ length: Math.max(0, count) }, () => 1 + Math.floor(Math.random() * sides));
  return { dice, total: dice.reduce((a, b) => a + b, 0) };
}

/** Chance (0-100) that d20 + bonus meets or beats a DC. */
export const chanceToMeet = (bonus, dc) => Math.round(clamp(21 - (num(dc) - num(bonus)), 0, 20) * 5);

/** "+3" / "-1" / "+0" */
export const signed = (n) => (num(n) >= 0 ? `+${num(n)}` : `${num(n)}`);

/** Turns anything into a number, falling back when it is blank or not a number. */
export function num(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(num(value, min))));
}
