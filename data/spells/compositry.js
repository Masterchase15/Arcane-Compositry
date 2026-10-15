/**
 * ════════════════════════════════════════════════════════════════════════════
 *  COMPOSITRY SPELLS  -  custom Compositions codified at your table
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  "The spell list can grow because of what the players actually invent during
 *   the campaign."  - codex chapter 12
 *
 *  Every spell on the Compositry index page comes from this file (plus anything
 *  added through the DM page on the website).
 *
 *  ─── TO ADD A SPELL ────────────────────────────────────────────────────────
 *  1. Copy the TEMPLATE block below.
 *  2. Paste it anywhere inside the big [ ... ] list.
 *  3. Fill it in and save. Refresh the browser. No restart needed.
 *
 *  Tip: build the spell in the site's Spellcrafter first. It shows the Mana and
 *  damage numbers to type in here.
 *
 *  ─── TEMPLATE ──────────────────────────────────────────────────────────────
 *
 *    {
 *      id: 'my-composition',          // unique, lowercase, dashes. Optional - made from the name if left out.
 *      name: 'My Composition',
 *      potency: 3,                    // 1-9 (Potency I-IX)
 *      mana: 9,                       // final Mana cost AFTER any codification discount
 *      school: 'Evocation',           // the closest school of magic - used by the "type" filter
 *      classes: ['Any'],              // WHO MAY LEARN IT: ['Any'], or a list such as ['Druid', 'Wizard']
 *      physicals: ['Geo'],            // Physical Components  (may be empty: [])
 *      aspectuals: ['Fire'],          // Aspectual Components (may be empty: [])
 *      form: 'Burst',                 // Projectile, Burst, Wall, Field, Infusion, Armor, ...
 *      range: '60 feet',
 *      area: '20-foot burst',         // optional
 *      duration: 'Instantaneous',
 *      damage: '6d6 fire/bludgeoning',  // optional - damage or main effect
 *      resolution: 'DEX save for half', // optional - attack roll, or which save
 *      effect: 'Leaves hot terrain',    // optional - extra condition / free minor consequence
 *      description: `How it looks and what it does.`,
 *      creator: 'Seraphine',          // optional - who invented it (magic has lineage!)
 *      optimization: 'Reduce Mana cost by 1',  // optional - the benefit chosen at codification (codex p.16)
 *      tags: ['damage', 'area'],      // optional - free-form search keywords
 *      hidden: true,                  // optional - true = only the DM sees it until it is published
 *    },
 *
 *  The eight spells below are EXAMPLES built from the worked examples in the
 *  Player's Field Codex. Edit or delete them freely.
 * ════════════════════════════════════════════════════════════════════════════
 */
export default [
  {
    id: 'stone-shot',
    name: 'Stone Shot',
    potency: 1,
    mana: 2,
    school: 'Conjuration',
    classes: ['Any'],
    physicals: ['Geo'],
    aspectuals: [],
    form: 'Projectile',
    range: '30 feet',
    duration: 'Instantaneous',
    damage: '3d8 bludgeoning',
    resolution: 'Arcane attack roll',
    effect: 'On a miss the stone may remain as cover (Seed).',
    description: `You conjure or tear loose a fist-sized stone and launch it at a target. The simplest Geo + Projectile Composition, and the first circuit most apprentices learn.

Math: Potency I = 2 Core Mana, 3 damage dice. Single target, so d8s.`,
    tags: ['damage', 'starter'],
  },
  {
    id: 'ice-spear',
    name: 'Ice Spear',
    potency: 3,
    mana: 6,
    school: 'Evocation',
    classes: ['Druid', 'Ranger', 'Sorcerer', 'Wizard'],
    physicals: [],
    aspectuals: ['Ice'],
    form: 'Projectile',
    range: '60 feet',
    duration: 'Instantaneous',
    damage: '6d8 cold',
    resolution: 'Arcane attack roll',
    effect: 'On a miss a slick patch forms where it lands.',
    description: `A lance of dense, razor-edged ice condenses along your forearm Tendrils and fires in a straight line.

Math: 5 Core + 0 Composite + 1 Range (60 ft) = 6 Mana. Potency III gives 6 dice; a precise single-target attack uses d8s.

As an Arcane Attack Chain it can be split into three shards of 2d8 / 2d8 / 2d8.`,
    tags: ['damage', 'cold'],
  },
  {
    id: 'molten-stone-burst',
    name: 'Molten Stone Burst',
    potency: 3,
    mana: 9,
    school: 'Evocation',
    classes: ['Druid', 'Sorcerer', 'Wizard'],
    physicals: ['Geo'],
    aspectuals: ['Fire'],
    form: 'Burst',
    range: '60 feet',
    area: '20-foot burst',
    duration: 'Instantaneous',
    damage: '6d6 fire / bludgeoning',
    resolution: 'DEX save for half',
    effect: 'Leaves hot terrain or ignites fragile material (free minor consequence).',
    description: `You condense a mass of molten stone and detonate it at a point within range. This is the worked example from codex chapter 2.

Math: 5 Core + 1 Composite + 1 Range + 2 Area + 0 Duration + 0 Effect = 9 Mana. Potency III gives 6 dice; an area effect uses d6s.`,
    tags: ['damage', 'area', 'fire'],
  },
  {
    id: 'geo-armor',
    name: 'Geo Armor',
    potency: 2,
    mana: 4,
    school: 'Abjuration',
    classes: ['Any'],
    physicals: ['Geo'],
    aspectuals: [],
    form: 'Armor',
    range: 'Self',
    duration: 'Up to 1 minute (Concentration)',
    damage: '+4 Reinforcement to Block',
    resolution: 'No roll',
    description: `Plates of conjured stone lock over your guard. Applied Thaumaturgy: instead of blanket resistance, the armor strengthens your active defense.

Math: 3 Core + 1 Duration = 4 Mana. Potency II has 4 damage dice, so a legal Block reduces 4 more damage.`,
    tags: ['defense', 'applied thaumaturgy'],
  },
  {
    id: 'lightning-infusion',
    name: 'Lightning Infusion',
    potency: 3,
    mana: 6,
    school: 'Transmutation',
    classes: ['Barbarian', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue'],
    physicals: [],
    aspectuals: ['Lightning'],
    form: 'Infusion',
    range: 'Touch',
    duration: 'Up to 1 minute (Concentration)',
    damage: '6d6 Arcane Charge Pool',
    resolution: 'Rides your weapon attacks',
    description: `Current crawls up the blade as you draw it - the draw itself is the Bridge. The weapon gains an Arcane Charge Pool of 6d6.

Each successful weapon hit may discharge 1d6. A completed Attack Chain Finisher may discharge 2d6. Unused dice fade when the duration ends.

Math: 5 Core + 1 Duration = 6 Mana.`,
    tags: ['applied thaumaturgy', 'weapon'],
  },
  {
    id: 'conductive-snare',
    name: 'Conductive Snare',
    potency: 2,
    mana: 7,
    school: 'Conjuration',
    classes: ['Druid', 'Sorcerer', 'Wizard'],
    physicals: ['Water'],
    aspectuals: ['Lightning'],
    form: 'Field',
    range: '30 feet',
    area: '10-foot field',
    duration: 'Up to 1 minute (Concentration)',
    damage: '3d4 lightning each turn',
    resolution: 'CON save',
    effect: 'Minor: -10 speed while in the water. Electricity follows wet pathways.',
    description: `You flood a patch of ground and thread a current through it. Anything standing in the water when the circuit closes is caught.

Math: 3 Core + 1 Composite + 1 Area + 1 Duration + 1 Effect = 7 Mana. Potency II gives 4 dice, minus Effect Rank 1 = 3 dice; persistent damage uses d4s.`,
    tags: ['control', 'area', 'trap'],
  },
  {
    id: 'glassfall',
    name: 'Glassfall',
    potency: 4,
    mana: 9,
    school: 'Transmutation',
    classes: ['Sorcerer', 'Wizard'],
    physicals: ['Sand'],
    aspectuals: ['Fire'],
    form: 'Burst',
    range: '30 feet',
    area: '20-foot burst',
    duration: 'Instantaneous',
    damage: '7d6 fire / piercing',
    resolution: 'DEX save for half',
    effect: 'Leaves sharp, brittle terrain.',
    description: `Superheated sand fuses mid-air and rains down as glass. An Arcane Discovery: Sand + Fire becomes glass at sufficient power.

Math: 6 Core + 1 Composite + 0 Range + 2 Area = 9 Mana. Potency IV gives 7 dice; area uses d6s.`,
    tags: ['damage', 'area', 'discovery'],
  },
  {
    id: 'seraphines-shattered-sun',
    name: "Seraphine's Shattered Sun",
    potency: 5,
    mana: 10,
    school: 'Evocation',
    classes: ['Cleric', 'Sorcerer', 'Wizard'],
    physicals: ['Celestial'],
    aspectuals: ['Fire'],
    form: 'Burst',
    range: '60 feet',
    area: '20-foot burst',
    duration: 'Instantaneous',
    damage: '8d6 radiant / fire',
    resolution: 'DEX save for half',
    effect: 'Radiant fragments linger as bright light until the end of your next turn.',
    description: `Radiant fragments of heated Celestial material burst outward like a broken star. The technique did not exist until the character who created it refined it through research - now it carries her name.

Math: 7 Core + 1 Composite + 1 Range + 2 Area = 11 Mana, minus 1 for the codification benefit = 10 Mana.`,
    creator: 'Seraphine',
    optimization: 'Reduce Mana cost by 1',
    tags: ['damage', 'area', 'signature'],
  },
];
