/**
 * ════════════════════════════════════════════════════════════════════════════
 *  NPCs & ENEMIES  -  the DM's private roster
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  ONLY DM ACCOUNTS CAN SEE THIS LIST. It is never sent to players, and this
 *  file is not inside the public/ folder, so it cannot be opened from a browser.
 *
 *  Everything on the DM page's "NPCs & Enemies" tab comes from this file (plus
 *  anything added on that tab).
 *
 *  ─── TO ADD ONE ────────────────────────────────────────────────────────────
 *  Easiest: DM page > NPCs & Enemies > New NPC / enemy.
 *  Or copy this TEMPLATE into the list below. It follows the 2024 (5.5e) stat
 *  block layout, with an Arcane Compositry section added. Only name, kind and
 *  description are required - leave out anything you don't need.
 *
 *    {
 *      id: 'thorn-warden',            // unique, lowercase, dashes. Optional - made from the name.
 *      name: 'Thorn Warden',
 *      kind: 'Enemy',                 // NPC, Ally, Enemy or Boss
 *      size: 'Medium', creatureType: 'Humanoid', alignment: 'Neutral',
 *      ac: '16 (hide armor, shield)', initiative: '+2', hp: '58 (9d8 + 18)', speed: '30 ft.',
 *      str: 14, dex: 14, con: 14, int: 10, wis: 16, cha: 10,
 *      pb: 3,                         // Proficiency Bonus. Guard (2 + PB) is worked out from it.
 *      saves: 'Con +5, Wis +6', skills: 'Nature +3, Perception +6',
 *      resistances: 'Poison', immunities: '', vulnerabilities: 'Fire',
 *      senses: 'Passive Perception 16', languages: 'Common, Druidic', cr: '4 (XP 1,100)',
 *      gear: 'Spear, shield',
 *      traits:       [['Rooted', 'Has Advantage on saves against being moved or knocked Prone.']],
 *      actions:      [['Multiattack', 'Makes two Spear attacks.'], ['Spear', 'Melee Attack Roll: +5, reach 5 ft. Hit: 6 (1d8 + 2) Piercing damage.']],
 *      bonusActions: [], reactions: [], legendary: [],
 *      // Arcane Compositry combat (leave guard blank to use 2 + PB)
 *      guard: '', chainLength: '3', momentum: 'Spends its Momentum Die for Topple.',
 *      // Arcane Profile (codex p.18) - for spellcasting NPCs
 *      invocation: 'wis', maxPotency: 4, mana: '26', temperament: 'Adaptive',
 *      physicals: ['Flora', 'Geo'], aspectuals: ['Poison'], forms: ['Bind', 'Wall'],
 *      signatures: `Thornwall (Flora + Wall, Potency II).`,
 *      // Story
 *      location: 'The Old Wood', faction: 'Verdant Court',
 *      description: `Appearance, voice and how to play them.`,
 *      notes: `Private DM notes: secrets, plans, what they want.`,
 *      tags: ['forest'],
 *    },
 *
 *  The two below are EXAMPLES. Edit or delete them freely.
 * ════════════════════════════════════════════════════════════════════════════
 */
export default [
  {
    name: 'Elite Knight (example)',
    kind: 'Enemy',
    size: 'Medium', creatureType: 'Humanoid', alignment: 'Lawful Neutral',
    ac: '17 (half plate, shield)', initiative: '+0', hp: '52 (8d8 + 16)', speed: '30 ft.',
    str: 16, dex: 11, con: 14, int: 11, wis: 11, cha: 15,
    pb: 3,
    saves: 'Con +5, Wis +3', skills: 'Athletics +6, Perception +3',
    senses: 'Passive Perception 13', languages: 'Common', cr: '3 (XP 700)',
    gear: 'Longsword, shield, half plate',
    traits: [['Shield Wall', 'When the knight Blocks with its shield, it reduces the damage by 1d8 + 3.']],
    actions: [
      ['Multiattack', 'The knight makes two Longsword attacks. In an Attack Chain these are its first two links.'],
      ['Longsword', 'Melee Attack Roll: +6, reach 5 ft. Hit: 7 (1d8 + 3) Slashing damage. Chain trait: reroll one failed Parry per enemy Chain.'],
    ],
    reactions: [['Parry', 'Spends 1 Guard. d20 + 6 against the attack total; beat it by 5 or more for a Perfect Parry that ends the Chain.']],
    chainLength: '3',
    momentum: 'Prefers to build to d8 and spend on Topple to pin a mobile target.',
    description: `The elite knight from the worked combat example in the codex (page 25): AC 17 and 5 Guard. A disciplined duelist who waits for a Perfect Parry, then Counter-attacks.`,
    notes: `Example entry. Use it to see how a stat block looks, then replace it.`,
    tags: ['example', 'martial'],
  },
  {
    name: 'Academy Compositor (example)',
    kind: 'NPC',
    size: 'Medium', creatureType: 'Humanoid', alignment: 'Any',
    ac: '12 (15 with Geo Armor)', initiative: '+2', hp: '40 (9d8)', speed: '30 ft.',
    str: 9, dex: 14, con: 11, int: 17, wis: 12, cha: 11,
    pb: 3,
    saves: 'Int +6, Wis +4', skills: 'Arcana +6, History +6',
    senses: 'Passive Perception 11', languages: 'Common plus two others', cr: '4 (XP 1,100)',
    gear: 'Quarterstaff with a mounted Catalyst (Capacity 50, Throughput 6)',
    actions: [
      ['Quarterstaff', 'Melee Attack Roll: +2, reach 5 ft. Hit: 3 (1d6) Bludgeoning damage.'],
      ['Improvised Composition', 'Roll Arcane Intent, whether they improvise, and Potency (codex p.18), then build the spell from the Arcane Profile below. Arcane attack +6, Save DC 14.'],
    ],
    reactions: [['Counter-Compositry', 'Invocation check (d20 + 6) against the attacker\'s Arcane Save DC to cancel, redirect or transform an incoming Composition.']],
    chainLength: '2',
    invocation: 'int', maxPotency: 4, mana: '26', temperament: 'Disciplined',
    physicals: ['Geo', 'Water'], aspectuals: ['Ice'], forms: ['Projectile', 'Wall', 'Armor'],
    signatures: `Ice Spear (Ice + Projectile, Potency III, 6 Mana, 6d8).
Geo Armor (Geo + Armor, Potency II, 4 Mana, +4 Reinforcement).`,
    description: `A conservative academy mage: precise gestures, pale blue Tendrils along both forearms, and a habit of naming each Composition before releasing it. Disciplined temperament - improvises only on a 6.`,
    notes: `Example entry showing the Arcane Profile. Replace with your own NPCs.`,
    tags: ['example', 'caster'],
  },
];
