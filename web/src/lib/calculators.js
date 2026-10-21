/**
 * lib/calculators.js - every interactive formula on the site, as data.
 *
 * Each calculator is one entry in CALCULATORS: a list of inputs (`fields`) and
 * a `compute` function that turns the inputs into results. The maths itself
 * lives in shared/rules/formulas.js - calculators only collect inputs and show
 * answers. components/calculator.tsx draws them.
 *
 * They appear in two places:
 *   - the Calculators page (all of them, grouped)
 *   - inside Codex chapters, wherever the chapter text contains
 *       <div data-calc="the-id"></div>
 *
 * ─── TO ADD A CALCULATOR ───────────────────────────────────────────────────
 *  Copy an entry in CALCULATORS, give it a new id, list its inputs, and write
 *  compute(). Input types: 'number', 'select', 'check', 'potency'.
 *  compute() returns:
 *     results    big headline numbers        [{ label, value, note? }]
 *     breakdown  the working, line by line   [{ label, value, total? }]
 *     notes      extra HTML shown underneath (array of strings)
 *  Optional `rolls`: dice buttons, each { label, run(values) -> HTML string }.
 *  `custom: 'momentum'` draws a special widget instead (the Momentum Die tracker).
 */
import * as F from '@shared/rules/formulas.js';
import { ROMAN } from '@shared/rules/constants.js';

/** Makes text safe inside the HTML strings that notes and rolls return. */
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const POTENCY_OPTIONS = ROMAN.slice(1).map((r, i) => ({ value: i + 1, label: `${r} - ${F.POTENCY[i + 1].meaning}` }));
const opts = (table) => table.map((r) => ({ value: r.id, label: `${r.label} (+${r.cost})` }));
const pb = { key: 'pb', label: 'Proficiency Bonus', type: 'number', value: 3, min: 2, max: 6 };
const im = { key: 'im', label: 'Invocation Modifier', type: 'number', value: 4, min: -5, max: 10, hint: 'The ability modifier that controls this magic.' };
const d20 = (bonus) => {
  const r = F.roll(1, 20).total;
  return { die: r, total: r + bonus };
};
const rolled = (dice, total, extra = '') => `Rolled <b>${dice.join(' + ')}</b>${dice.length > 1 || extra ? ` = <b>${total}</b>` : ''}${extra}`;

export const CALCULATORS = [
  // ───────────────────────────── ARCANE ──────────────────────────────
  {
    id: 'mana', group: 'Arcane', title: 'Final Mana cost',
    formula: 'Final Mana = Core Mana + Composite + Range + Area + Duration + Effect',
    fields: [
      { key: 'potency', label: 'Potency', type: 'potency', value: 3 },
      { key: 'components', label: 'Components', type: 'select', value: 2, options: [1, 2, 3, 4].map((n) => ({ value: n, label: `${n} Component${n > 1 ? 's' : ''} (+${F.compositeCost(n)}${n === 4 ? ' or more' : ''})` })) },
      { key: 'range', label: 'Maximum range', type: 'select', value: '60', options: opts(F.RANGE_COSTS) },
      { key: 'area', label: 'Approx. area', type: 'select', value: '20', options: opts(F.AREA_COSTS) },
      { key: 'duration', label: 'Duration', type: 'select', value: 'instant', options: opts(F.DURATION_COSTS) },
      { key: 'effect', label: 'Effect rank', type: 'select', value: 'cosmetic', options: opts(F.EFFECT_RANKS) },
      { key: 'removeConcentration', label: 'Remove Concentration (+2)', type: 'check', value: false },
      { key: 'environmental', label: 'Abundant Physical Component nearby (-1)', type: 'check', value: false },
    ],
    compute(v) {
      const m = F.finalMana({ potency: v.potency, componentCount: v.components, range: v.range, area: v.area, duration: v.duration, effect: v.effect, removeConcentration: v.removeConcentration, environmental: v.environmental });
      return { results: [{ label: 'Final Mana', value: m.total }], breakdown: [...m.parts, { label: 'Final Mana', value: m.total, total: true }] };
    },
  },
  {
    id: 'damage', group: 'Arcane', title: 'Damage dice',
    formula: 'Damage Dice = P + 2 + floor(P / 3)   ·   Final Dice = Normal Dice - Effect Rank',
    fields: [
      { key: 'potency', label: 'Potency', type: 'potency', value: 3 },
      { key: 'delivery', label: 'Delivery', type: 'select', value: 'single', options: F.DELIVERIES.filter((d) => d.die).map((d) => ({ value: d.id, label: `${d.label} (d${d.die})` })) },
      { key: 'effect', label: 'Effect rank carried', type: 'select', value: 'cosmetic', options: F.EFFECT_RANKS.map((e) => ({ value: e.id, label: `${e.label} (-${e.cost} dice)` })) },
    ],
    compute(v) {
      const d = F.compositionDamage(v);
      return {
        results: [{ label: 'Damage', value: d.text, note: `average ${d.average}` }],
        breakdown: [
          { label: `Potency ${ROMAN[v.potency]}`, value: v.potency }, { label: 'Flat bonus', value: 2 },
          { label: `floor(${v.potency} / 3)`, value: Math.floor(v.potency / 3) }, { label: 'Effect rank traded away', value: -(d.base - d.count) },
          { label: 'Final dice', value: d.count, total: true },
        ],
      };
    },
    rolls: [{ label: 'Roll damage', run(v) { const d = F.compositionDamage(v); const r = F.roll(d.count, d.die); return rolled(r.dice, r.total, ' damage'); } }],
  },
  {
    id: 'attack-dc', group: 'Arcane', title: 'Arcane attack & Save DC',
    formula: 'Attack = d20 + PB + IM   ·   Save DC = 8 + PB + IM',
    fields: [pb, im],
    compute: (v) => ({
      results: [
        { label: 'Arcane attack', value: `d20 ${F.signed(F.arcaneAttackBonus(v.pb, v.im))}` },
        { label: 'Arcane Save DC', value: F.arcaneSaveDC(v.pb, v.im) },
      ],
    }),
    rolls: [{ label: 'Roll attack', run(v) { const r = d20(F.arcaneAttackBonus(v.pb, v.im)); return `d20 (<b>${r.die}</b>) ${F.signed(F.arcaneAttackBonus(v.pb, v.im))} = <b>${r.total}</b>${r.die === 20 ? ' - natural 20!' : r.die === 1 ? ' - natural 1' : ''}`; } }],
  },
  {
    id: 'spell-mana', group: 'Arcane', title: 'Codified spell Mana',
    formula: 'Existing D&D spells keep their statistics and replace spell slots with Mana.',
    fields: [{ key: 'level', label: 'Spell level', type: 'select', value: 3, options: F.SPELL_LEVEL_MANA.map((m, i) => ({ value: i, label: i ? `Level ${i}` : 'Cantrip' })) }],
    compute: (v) => ({ results: [{ label: 'Mana cost', value: F.codifiedSpellMana(v.level) }] }),
  },
  {
    id: 'mana-pool', group: 'Arcane', title: 'Maximum Mana pool',
    formula: 'Max Mana = floor(5L + L^2 / 12 - 1)',
    fields: [
      { key: 'level', label: 'Character level', type: 'number', value: 10, min: 1, max: 20 },
      { key: 'type', label: 'Caster type', type: 'select', value: 'full', options: Object.entries(F.CASTER_TYPES).map(([value, t]) => ({ value, label: t.label })) },
    ],
    compute(v) {
      const L = Math.min(20, Math.max(1, v.level));
      const raw = 5 * L + (L * L) / 12 - 1;
      return {
        results: [{ label: 'Max Mana', value: F.maxMana(L, v.type) }],
        breakdown: [
          { label: `5 x ${L}`, value: 5 * L }, { label: `${L}^2 / 12`, value: ((L * L) / 12).toFixed(2) }, { label: 'Minus 1', value: -1 },
          { label: 'Round down', value: Math.floor(raw), total: v.type === 'full' },
          ...(v.type === 'full' ? [] : [{ label: `x ${F.CASTER_TYPES[v.type].share}, round down`, value: F.maxMana(L, v.type), total: true }]),
        ],
      };
    },
  },
  {
    id: 'thaumaturgy', group: 'Arcane', title: 'Applied Thaumaturgy: Charge Pool & Reinforcement',
    formula: 'Charge Dice = Potency Damage Dice (d6s)   ·   Reinforcement = number of Potency Damage Dice',
    fields: [{ key: 'potency', label: 'Infusion Potency', type: 'potency', value: 3 }],
    compute: (v) => ({
      results: [
        { label: 'Arcane Charge Pool', value: F.chargePool(v.potency).text, note: '1d6 per hit, 2d6 on a Finisher' },
        { label: 'Reinforcement', value: `+${F.reinforcement(v.potency)}`, note: 'added to a legal Block' },
      ],
    }),
    rolls: [
      { label: 'Discharge 1d6', run() { const r = F.roll(1, 6); return rolled(r.dice, r.total, ' bonus damage'); } },
      { label: 'Finisher 2d6', run() { const r = F.roll(2, 6); return rolled(r.dice, r.total, ' bonus damage'); } },
    ],
  },
  {
    id: 'arcane-chain', group: 'Arcane', title: 'Arcane Attack Chain split',
    formula: "Divide one spell's damage pool across several linked attack rolls.",
    fields: [
      { key: 'potency', label: 'Potency', type: 'potency', value: 3 },
      { key: 'delivery', label: 'Delivery', type: 'select', value: 'single', options: F.DELIVERIES.filter((d) => d.die).map((d) => ({ value: d.id, label: `${d.label} (d${d.die})` })) },
      { key: 'hits', label: 'Attacks in the Chain', type: 'number', value: 3, min: 1, max: 5 },
    ],
    compute(v) {
      const d = F.compositionDamage({ potency: v.potency, delivery: v.delivery });
      const split = F.splitChain(d.count, v.hits);
      return {
        results: [{ label: 'Total pool', value: d.text }, { label: 'Per attack', value: split.map((n) => `${n}d${d.die}`).join(' / ') }],
        breakdown: split.map((n, i) => ({ label: `Attack ${i + 1}${i === split.length - 1 && split.length > 1 ? ' - Finisher' : ''}`, value: `${n}d${d.die}` })),
        notes: ['For a saving-throw Finisher, prefer <b>disadvantage on the save</b> rather than automatic failure.'],
      };
    },
  },
  {
    id: 'stability', group: 'Arcane', title: 'Circuit Stability',
    formula: 'Stability DC = 10 + floor(P/2) + Additional Components + floor(Damage Taken/10)   ·   Check = d20 + PB + IM',
    fields: [
      { key: 'potency', label: 'Spell Potency', type: 'potency', value: 4 },
      { key: 'components', label: 'Total Components', type: 'number', value: 2, min: 1, max: 6, hint: 'Geo = 1; Geo + Fire = 2.' },
      { key: 'damage', label: 'Damage taken', type: 'number', value: 12, min: 0, max: 500 },
      pb, im,
    ],
    compute(v) {
      const dc = F.stabilityDC({ potency: v.potency, componentCount: v.components, damageTaken: v.damage });
      const bonus = v.pb + v.im;
      return {
        results: [
          { label: 'Stability DC', value: dc.total },
          { label: 'Your check', value: `d20 ${F.signed(bonus)}`, note: `${F.chanceToMeet(bonus, dc.total)}% to hold (need ${Math.max(1, dc.total - bonus)}+)` },
        ],
        breakdown: [...dc.parts, { label: 'Stability DC', value: dc.total, total: true }],
        notes: ['On a failure choose <b>Ground</b>, <b>Force Closure</b>, <b>Backwash</b> or <b>Collapse</b>.'],
      };
    },
    rolls: [{ label: 'Roll Stability Check', run(v) {
      const dc = F.stabilityDC({ potency: v.potency, componentCount: v.components, damageTaken: v.damage }).total;
      const r = d20(v.pb + v.im);
      return `d20 (<b>${r.die}</b>) ${F.signed(v.pb + v.im)} = <b>${r.total}</b> vs DC ${dc} - <b>${r.total >= dc ? 'the circuit holds' : 'the circuit fails'}</b>`;
    } }],
  },
  {
    id: 'read-circuit', group: 'Arcane', title: 'Read the Circuit',
    formula: 'Arcana or Perception vs. DC 10 + Potency',
    fields: [
      { key: 'potency', label: 'Potency being prepared', type: 'potency', value: 3 },
      { key: 'bonus', label: 'Your Arcana / Perception bonus', type: 'number', value: 5, min: -5, max: 20 },
    ],
    compute: (v) => ({
      results: [{ label: 'DC to read', value: F.readCircuitDC(v.potency), note: `${F.chanceToMeet(v.bonus, F.readCircuitDC(v.potency))}% with ${F.signed(v.bonus)}` }],
      notes: ['A success can reveal a Component, Form, approximate Potency, or target. A strong success may reveal the entire Composition.'],
    }),
    rolls: [{ label: 'Roll check', run(v) { const dc = F.readCircuitDC(v.potency); const r = d20(v.bonus); return `d20 (<b>${r.die}</b>) ${F.signed(v.bonus)} = <b>${r.total}</b> vs DC ${dc} - <b>${r.total >= dc ? 'success' : 'failure'}</b>`; } }],
  },
  {
    id: 'counter', group: 'Arcane', title: 'Counter-Compositry check',
    formula: "Counter Check = Invocation Check (d20 + PB + IM) vs. Attacker's Arcane Save DC",
    fields: [
      pb, im,
      { key: 'logical', label: 'Especially logical counter (+2)', type: 'check', value: false },
      { key: 'dc', label: "Attacker's Arcane Save DC", type: 'number', value: 15, min: 5, max: 30 },
    ],
    compute(v) {
      const bonus = v.pb + v.im + (v.logical ? 2 : 0);
      return {
        results: [{ label: 'Counter check', value: `d20 ${F.signed(bonus)}`, note: `${F.chanceToMeet(bonus, v.dc)}% vs DC ${v.dc} (need ${Math.max(1, v.dc - bonus)}+)` }],
        notes: ['Success: <b>Cancel</b>, <b>Redirect</b> or <b>Transform</b> the incoming Composition.'],
      };
    },
    rolls: [{ label: 'Roll counter', run(v) { const b = v.pb + v.im + (v.logical ? 2 : 0); const r = d20(b); return `d20 (<b>${r.die}</b>) ${F.signed(b)} = <b>${r.total}</b> vs DC ${v.dc} - <b>${r.total >= v.dc ? 'countered' : 'the spell gets through'}</b>`; } }],
  },

  // ───────────────────────────── COMBAT ──────────────────────────────
  {
    id: 'guard', group: 'Combat', title: 'Guard',
    formula: 'Guard = 2 + Proficiency Bonus',
    fields: [pb],
    compute: (v) => ({
      results: [{ label: 'Guard', value: F.guardMax(v.pb), note: 'refreshes at the start of your turn' }],
      notes: ['Dodge, Parry or Block costs <b>1 Guard</b>. A Counter-attack costs <b>2 Guard</b>. At 0 Guard you are <b>Broken</b>.'],
    }),
  },
  {
    id: 'chain', group: 'Combat', title: 'Chain Length, Chain Momentum & Escalation',
    formula: 'Chain Attack Bonus = +1 per Chain Momentum (max +3)   ·   Defensive Penalty = -1 per 2 attacks attempted',
    fields: [
      { key: 'level', label: 'Character level', type: 'number', value: 5, min: 1, max: 20 },
      { key: 'hits', label: 'Hits landed this Chain', type: 'number', value: 2, min: 0, max: 6 },
      { key: 'attempts', label: 'Attacks attempted this Chain', type: 'number', value: 2, min: 0, max: 6 },
    ],
    compute(v) {
      const max = F.maxChainLength(v.level);
      const nextIsFinisher = v.attempts === max - 1;
      return {
        results: [
          { label: 'Max Chain Length', value: max, note: F.CHAIN_TIERS.find((t) => t.max === max).feel },
          { label: 'Chain attack bonus', value: F.signed(F.chainAttackBonus(v.hits)) },
          { label: 'Escalation (optional)', value: F.escalationPenalty(v.attempts) || '0', note: 'to your active defense' },
        ],
        notes: [nextIsFinisher ? 'Your next attack is the <b>Finisher</b>: it cannot miss from AC alone.' : v.attempts >= max ? 'The Chain has reached its maximum length.' : `${max - v.attempts} attack(s) left in this Chain.`],
      };
    },
  },
  {
    id: 'defense', group: 'Combat', title: 'Dodge, Parry & Block',
    formula: 'Dodge = d20 + DEX + PB if proficient in DEX saves   ·   Parry = d20 + STR or DEX + PB if proficient with the weapon',
    fields: [
      { key: 'attack', label: 'Incoming attack total', type: 'number', value: 19, min: 1, max: 40 },
      pb,
      { key: 'str', label: 'STR modifier', type: 'number', value: 3, min: -5, max: 10 },
      { key: 'dex', label: 'DEX modifier', type: 'number', value: 2, min: -5, max: 10 },
      { key: 'dexSave', label: 'Proficient in DEX saves', type: 'check', value: false },
      { key: 'weapon', label: 'Proficient with parrying weapon', type: 'check', value: true },
      { key: 'reinforcement', label: 'Reinforcement (infusion)', type: 'number', value: 0, min: 0, max: 14 },
    ],
    compute(v) {
      const dodge = F.dodgeBonus(v.dex, v.pb, v.dexSave);
      const parry = F.parryBonus(v.str, v.dex, v.pb, v.weapon);
      const need = (bonus, margin) => Math.max(1, v.attack + margin - bonus);
      const line = (bonus) => `need ${need(bonus, 0)}+ to stop it, ${need(bonus, 5)}+ for Perfect`;
      return {
        results: [
          { label: 'Dodge', value: `d20 ${F.signed(dodge)}`, note: `${line(dodge)} (${F.chanceToMeet(dodge, v.attack)}%)` },
          { label: 'Parry', value: `d20 ${F.signed(parry)}`, note: `${line(parry)}, ${need(parry, 10)}+ for Masterful (${F.chanceToMeet(parry, v.attack)}%)` },
        ],
        breakdown: F.blockOptions(v.pb, v.str, v.reinforcement).map((b) => ({ label: `Block - ${b.tool}`, value: `reduce ${b.text}` })),
        notes: ['Each active defense costs <b>1 Guard</b>. Perfect Dodge: move 5 ft. Perfect Parry: the Chain ends. Block to 0 damage: the Chain ends.'],
      };
    },
    rolls: [
      { label: 'Roll Dodge', run(v) { return defenseRoll('Dodge', F.dodgeBonus(v.dex, v.pb, v.dexSave), v.attack, false); } },
      { label: 'Roll Parry', run(v) { return defenseRoll('Parry', F.parryBonus(v.str, v.dex, v.pb, v.weapon), v.attack, true); } },
    ],
  },
  {
    id: 'degrees', group: 'Combat', title: 'Hit or miss? (Degrees of Miss)',
    formula: 'Attack Total = d20 + Attack Bonus, compared with AC',
    fields: [
      { key: 'attack', label: 'Attack total', type: 'number', value: 14, min: 1, max: 40 },
      { key: 'ac', label: 'Target AC', type: 'number', value: 17, min: 1, max: 40 },
      { key: 'finisher', label: 'This attack is the Finisher', type: 'check', value: false },
    ],
    compute(v) {
      const d = F.attackDegree(v.attack, v.ac);
      if (v.finisher) {
        return { results: [{ label: 'Result', value: 'Finisher' }], notes: [`The Finisher does not fail from AC alone. Attack Total <b>${v.attack}</b> is what the defender must meet to Dodge or Parry.`] };
      }
      return { results: [{ label: 'Result', value: d.label, note: `${v.attack - v.ac >= 0 ? 'beat' : 'missed'} AC by ${Math.abs(v.attack - v.ac)}` }], notes: [esc(d.text)] };
    },
  },
  {
    id: 'stasis-dc', group: 'Combat', title: 'Stasis Save DC',
    formula: 'Stasis Save DC = 8 + Proficiency Bonus + Momentum Ability Modifier',
    fields: [pb, { key: 'mod', label: 'Momentum Ability Modifier', type: 'number', value: 4, min: -5, max: 10, hint: 'STR for heavy melee, DEX for finesse/ranged, or your Invocation Modifier for an Arcane attack.' }],
    compute: (v) => ({ results: [{ label: 'Stasis Save DC', value: F.stasisSaveDC(v.pb, v.mod) }] }),
  },
  { id: 'momentum', group: 'Combat', title: 'Momentum Die tracker', formula: 'd4 > d6 > d8 > d10 > d12', custom: 'momentum' },

  // ───────────────────────────── DM ──────────────────────────────────
  {
    id: 'enemy', group: 'DM toolkit', title: 'Enemy Compositor roller',
    formula: 'Roll Arcane Intent · Will they improvise? · Choose Potency',
    fields: [
      { key: 'max', label: "NPC's Maximum Potency", type: 'potency', value: 5 },
      { key: 'temperament', label: 'Temperament', type: 'select', value: 'adaptive', options: Object.entries(F.TEMPERAMENTS).map(([value, t]) => ({ value, label: `${t.label} (improvises on d6 ${t.improvisesOn === 6 ? '= 6' : `${t.improvisesOn}-6`})` })) },
      { key: 'aggressive', label: 'Bloodied, desperate, enraged or protecting something', type: 'check', value: false },
    ],
    compute: () => ({ notes: ['Press <b>Roll the NPC\'s turn</b> to roll all three d6 tables at once.'] }),
    rolls: [{ label: "Roll the NPC's turn", run(v) {
      const [a, b, c] = [F.roll(1, 6).total, F.roll(1, 6).total, F.roll(1, 6).total];
      const t = F.TEMPERAMENTS[v.temperament];
      const p = F.npcPotency(c, v.max, v.aggressive);
      return `<b>Intent</b> (d6 = ${a}): ${F.ARCANE_INTENT[a]}<br>
              <b>Improvises?</b> (d6 = ${b}): ${b >= t.improvisesOn ? 'Yes - invents a new Composition' : 'No - uses a Signature or known spell'}<br>
              <b>Potency</b> (d6 = ${c}${v.aggressive ? ', one step more aggressive' : ''}): ${p.label} - <b>Potency ${ROMAN[p.potency]}</b> (${F.coreMana(p.potency)} Core Mana, ${F.damageDice(p.potency)} dice)`;
    } }],
  },
];

function defenseRoll(name, bonus, attack, isParry) {
  const r = d20(bonus);
  const result = F.defenseResult(r.total, attack);
  const text = {
    fail: `${name} fails - the hit lands`,
    success: `${name} succeeds`,
    perfect: `Perfect ${name}!`,
    masterful: isParry ? 'Masterful Parry - free Counter-attack once per round' : `Perfect ${name}!`,
  }[result];
  return `d20 (<b>${r.die}</b>) ${F.signed(bonus)} = <b>${r.total}</b> vs ${attack} - <b>${text}</b>`;
}
