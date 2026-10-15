/**
 * ════════════════════════════════════════════════════════════════════════════
 *  CODIFIED SPELLS  -  the "normal D&D" spell list
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Every spell on the Codified index page comes from this file (plus anything
 *  added through the DM page on the website).
 *
 *  ─── TO ADD A SPELL ────────────────────────────────────────────────────────
 *  1. Copy the TEMPLATE block below.
 *  2. Paste it anywhere inside the big [ ... ] list (order does not matter -
 *     the site sorts by level, then name).
 *  3. Fill it in and save. Refresh the browser. No restart needed.
 *
 *  If you make a typo, the server prints a plain-English message in its window
 *  (for example: Skipped "Fireball": unknown class "Wizzard") and skips just
 *  that spell. You can also run  `npm run check-spells`  to check every spell.
 *
 *  ─── TEMPLATE ──────────────────────────────────────────────────────────────
 *
 *    {
 *      id: 'my-new-spell',            // unique, lowercase, dashes. Optional - made from the name if left out.
 *      name: 'My New Spell',
 *      level: 3,                      // 0 = cantrip, 1-9 = spell level. Sets the Mana cost automatically (codex p.9).
 *      school: 'Evocation',           // Abjuration, Conjuration, Divination, Enchantment,
 *                                     // Evocation, Illusion, Necromancy, Transmutation
 *      classes: ['Sorcerer', 'Wizard'],  // WHO MAY LEARN IT. Names must match the class list in
 *                                        // public/js/rules/constants.js. Use ['Any'] for every class.
 *      castingTime: 'Action',
 *      range: '120 feet',
 *      components: 'V, S, M (a pinch of sulfur)',
 *      duration: 'Instantaneous',
 *      concentration: false,          // true if the spell needs Concentration
 *      ritual: false,                 // true if it can be cast as a Ritual
 *      description: `What the spell does.
 *
 *  Leave a blank line to start a new paragraph.`,
 *      higherLevels: 'What changes when more Mana is spent.',   // optional
 *      tags: ['damage', 'fire'],      // optional - free-form search keywords
 *      source: 'SRD 5.2',             // optional - where it came from
 *      hidden: true,                  // optional - true = only the DM sees it until it is published
 *    },
 *
 *  ─── HOW THE CLASS RULE WORKS ──────────────────────────────────────────────
 *  When a player adds a spell to a character, the site compares the character's
 *  Class with the spell's `classes` list. If the class is not listed, the
 *  player sees a warning and must confirm (for multiclassing, feats, or a DM
 *  ruling). To change that behaviour see docs/ADDING_SPELLS.md.
 *
 *  The example descriptions below are short summaries of spells from the
 *  System Reference Document 5.2 (CC-BY-4.0, Wizards of the Coast).
 * ════════════════════════════════════════════════════════════════════════════
 */
export default [
  // ─────────────────────────────── CANTRIPS ────────────────────────────────
  {
    id: 'fire-bolt',
    name: 'Fire Bolt',
    level: 0,
    school: 'Evocation',
    classes: ['Sorcerer', 'Wizard'],
    castingTime: 'Action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: `You hurl a mote of fire at a creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d10 Fire damage. A flammable object hit by the spell starts burning if it isn't being worn or carried.`,
    higherLevels: 'The damage increases by 1d10 at character levels 5 (2d10), 11 (3d10) and 17 (4d10).',
    tags: ['damage', 'fire', 'attack roll'],
    source: 'SRD 5.2',
  },
  {
    id: 'mage-hand',
    name: 'Mage Hand',
    level: 0,
    school: 'Conjuration',
    classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: '30 feet',
    components: 'V, S',
    duration: '1 minute',
    description: `A spectral, floating hand appears at a point you choose within range. It lasts for the duration, and vanishes if it is ever more than 30 feet from you or if you cast the spell again.

When you cast the spell, and as a Magic action on later turns, you can control the hand: manipulate an object, open an unlocked door or container, stow or retrieve an item, or pour out a vial. The hand can move up to 30 feet each time you use it. It can't attack, activate magic items, or carry more than 10 pounds.`,
    tags: ['utility'],
    source: 'SRD 5.2',
  },
  {
    id: 'guidance',
    name: 'Guidance',
    level: 0,
    school: 'Divination',
    classes: ['Cleric', 'Druid'],
    castingTime: 'Action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Up to 1 minute',
    concentration: true,
    description: `You touch a willing creature and choose a skill. Until the spell ends, the creature adds 1d4 to any ability check that uses the chosen skill.`,
    tags: ['buff', 'support'],
    source: 'SRD 5.2',
  },
  {
    id: 'sacred-flame',
    name: 'Sacred Flame',
    level: 0,
    school: 'Evocation',
    classes: ['Cleric'],
    castingTime: 'Action',
    range: '60 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: `Flame-like radiance descends on a creature you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 Radiant damage. The target gains no benefit from Half Cover or Three-Quarters Cover for this save.`,
    higherLevels: 'The damage increases by 1d8 at character levels 5 (2d8), 11 (3d8) and 17 (4d8).',
    tags: ['damage', 'radiant', 'saving throw'],
    source: 'SRD 5.2',
  },
  {
    id: 'minor-illusion',
    name: 'Minor Illusion',
    level: 0,
    school: 'Illusion',
    classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: '30 feet',
    components: 'S, M (a bit of fleece)',
    duration: '1 minute',
    description: `You create a sound or an image of an object within range that lasts for the duration.

Sound: the volume can range from a whisper to a scream, and can be any sound you choose.

Image: the image must fit inside a 5-foot cube and can't create sound, light, smell or any other sensory effect. Physical interaction reveals it as an illusion, since things pass through it.

A creature that uses a Study action to examine the illusion can identify it with a successful Intelligence (Investigation) check against your spell save DC.`,
    tags: ['utility', 'deception'],
    source: 'SRD 5.2',
  },
  {
    id: 'chill-touch',
    name: 'Chill Touch',
    level: 0,
    school: 'Necromancy',
    classes: ['Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Instantaneous',
    description: `Channeling the chill of the grave, make a melee spell attack against a target within reach. On a hit, the target takes 1d10 Necrotic damage, and it can't regain Hit Points until the end of your next turn.`,
    higherLevels: 'The damage increases by 1d10 at character levels 5 (2d10), 11 (3d10) and 17 (4d10).',
    tags: ['damage', 'necrotic', 'attack roll'],
    source: 'SRD 5.2',
  },

  // ─────────────────────────────── 1ST LEVEL ───────────────────────────────
  {
    id: 'magic-missile',
    name: 'Magic Missile',
    level: 1,
    school: 'Evocation',
    classes: ['Sorcerer', 'Wizard'],
    castingTime: 'Action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: `You create three glowing darts of magical force. Each dart strikes a creature of your choice that you can see within range, dealing 1d4 + 1 Force damage. The darts all strike at once, and you can direct them at one creature or several.`,
    higherLevels: 'The spell creates one more dart for each spell level above 1.',
    tags: ['damage', 'force', 'auto-hit'],
    source: 'SRD 5.2',
  },
  {
    id: 'shield',
    name: 'Shield',
    level: 1,
    school: 'Abjuration',
    classes: ['Sorcerer', 'Wizard'],
    castingTime: 'Reaction, taken when you are hit by an attack roll or targeted by Magic Missile',
    range: 'Self',
    components: 'V, S',
    duration: '1 round',
    description: `An invisible barrier of magical force protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from Magic Missile.`,
    tags: ['defense', 'reaction'],
    source: 'SRD 5.2',
  },
  {
    id: 'cure-wounds',
    name: 'Cure Wounds',
    level: 1,
    school: 'Abjuration',
    classes: ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger'],
    castingTime: 'Action',
    range: 'Touch',
    components: 'V, S',
    duration: 'Instantaneous',
    description: `A creature you touch regains Hit Points equal to 2d8 plus your spellcasting ability modifier.`,
    higherLevels: 'The healing increases by 2d8 for each spell level above 1.',
    tags: ['healing', 'support'],
    source: 'SRD 5.2',
  },
  {
    id: 'detect-magic',
    name: 'Detect Magic',
    level: 1,
    school: 'Divination',
    classes: ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action or Ritual',
    range: 'Self',
    components: 'V, S',
    duration: 'Up to 10 minutes',
    concentration: true,
    ritual: true,
    description: `For the duration, you sense the presence of magical effects within 30 feet of yourself. If you sense such effects, you can take the Magic action to see a faint aura around any visible creature or object in the area that bears magic, and if an effect was created by a spell, you learn the spell's school of magic.

The spell is blocked by 1 foot of stone, dirt or wood, 1 inch of metal, or a thin sheet of lead.`,
    tags: ['utility', 'detection'],
    source: 'SRD 5.2',
  },
  {
    id: 'charm-person',
    name: 'Charm Person',
    level: 1,
    school: 'Enchantment',
    classes: ['Bard', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: '30 feet',
    components: 'V, S',
    duration: '1 hour',
    description: `One Humanoid you can see within range makes a Wisdom saving throw. It does so with Advantage if you or your allies are fighting it. On a failed save, the target has the Charmed condition until the spell ends or until you or your allies damage it. The Charmed creature is Friendly to you. When the spell ends, the target knows it was Charmed by you.`,
    higherLevels: 'You can target one additional creature for each spell level above 1.',
    tags: ['control', 'social', 'saving throw'],
    source: 'SRD 5.2',
  },
  {
    id: 'entangle',
    name: 'Entangle',
    level: 1,
    school: 'Conjuration',
    classes: ['Druid', 'Ranger'],
    castingTime: 'Action',
    range: '90 feet',
    components: 'V, S',
    duration: 'Up to 1 minute',
    concentration: true,
    description: `Grasping plants sprout from the ground in a 20-foot square within range. For the duration, these plants turn the ground in the area into Difficult Terrain. They disappear when the spell ends.

Each creature (other than you) in the area when you cast the spell must succeed on a Strength saving throw or have the Restrained condition until the spell ends. A Restrained creature can take an action to make a Strength (Athletics) check against your spell save DC. On a success, it frees itself from the plants.`,
    tags: ['control', 'nature', 'saving throw'],
    source: 'SRD 5.2',
  },

  // ─────────────────────────────── 2ND LEVEL ───────────────────────────────
  {
    id: 'misty-step',
    name: 'Misty Step',
    level: 2,
    school: 'Conjuration',
    classes: ['Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Bonus Action',
    range: 'Self',
    components: 'V',
    duration: 'Instantaneous',
    description: `Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see.`,
    tags: ['movement', 'teleport'],
    source: 'SRD 5.2',
  },
  {
    id: 'hold-person',
    name: 'Hold Person',
    level: 2,
    school: 'Enchantment',
    classes: ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: '60 feet',
    components: 'V, S, M (a straight piece of iron)',
    duration: 'Up to 1 minute',
    concentration: true,
    description: `Choose a Humanoid that you can see within range. The target must succeed on a Wisdom saving throw or have the Paralyzed condition for the duration. At the end of each of its turns, the target repeats the save, ending the spell on itself on a success.`,
    higherLevels: 'You can target one additional Humanoid for each spell level above 2.',
    tags: ['control', 'saving throw'],
    source: 'SRD 5.2',
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    level: 2,
    school: 'Illusion',
    classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: 'Touch',
    components: 'V, S, M (an eyelash in gum arabic)',
    duration: 'Up to 1 hour',
    concentration: true,
    description: `A creature you touch has the Invisible condition until the spell ends. The spell ends early immediately after the target makes an attack roll, deals damage, or casts a spell.`,
    higherLevels: 'You can target one additional creature for each spell level above 2.',
    tags: ['stealth', 'buff'],
    source: 'SRD 5.2',
  },

  // ─────────────────────────────── 3RD LEVEL ───────────────────────────────
  {
    id: 'fireball',
    name: 'Fireball',
    level: 3,
    school: 'Evocation',
    classes: ['Sorcerer', 'Wizard'],
    castingTime: 'Action',
    range: '150 feet',
    components: 'V, S, M (a ball of bat guano and sulfur)',
    duration: 'Instantaneous',
    description: `A bright streak flashes from you to a point you choose within range and then blossoms with a low roar into a fiery explosion. Each creature in a 20-foot-radius Sphere centered on that point makes a Dexterity saving throw, taking 8d6 Fire damage on a failed save or half as much damage on a successful one.

Flammable objects in the area that aren't being worn or carried start burning.

In the world of Arcane Compositry, Fireball is not merely "Fire + Volatility + Burst" - it is a heavily optimized circuit refined by generations of magical researchers.`,
    higherLevels: 'The damage increases by 1d6 for each spell level above 3.',
    tags: ['damage', 'fire', 'area', 'saving throw'],
    source: 'SRD 5.2',
  },
  {
    id: 'counterspell',
    name: 'Counterspell',
    level: 3,
    school: 'Abjuration',
    classes: ['Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Reaction, taken when you see a creature within 60 feet casting a spell with Verbal, Somatic or Material components',
    range: '60 feet',
    components: 'S',
    duration: 'Instantaneous',
    description: `You attempt to interrupt a creature in the process of casting a spell. The creature makes a Constitution saving throw. On a failed save, the spell dissipates with no effect, and the action, Bonus Action or Reaction used to cast it is wasted. If that spell was cast with a spell slot, the slot isn't expended.

At an Arcane Compositry table, also see Counter-Compositry (codex chapter 11) for countering magic with material logic instead.`,
    tags: ['counter', 'reaction'],
    source: 'SRD 5.2',
  },
  {
    id: 'revivify',
    name: 'Revivify',
    level: 3,
    school: 'Necromancy',
    classes: ['Cleric', 'Druid', 'Paladin', 'Ranger'],
    castingTime: 'Action',
    range: 'Touch',
    components: 'V, S, M (a diamond worth 300+ GP, which the spell consumes)',
    duration: 'Instantaneous',
    description: `You touch a creature that has died within the last minute. That creature revives with 1 Hit Point. This spell can't revive a creature that has died of old age, nor does it restore any missing body parts.`,
    tags: ['healing', 'resurrection'],
    source: 'SRD 5.2',
  },
  {
    id: 'fly',
    name: 'Fly',
    level: 3,
    school: 'Transmutation',
    classes: ['Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: 'Touch',
    components: 'V, S, M (a feather)',
    duration: 'Up to 10 minutes',
    concentration: true,
    description: `You touch a willing creature. For the duration, the target gains a Fly Speed of 60 feet and can hover. When the spell ends, the target falls if it is still aloft, unless it can stop the fall.`,
    higherLevels: 'You can target one additional creature for each spell level above 3.',
    tags: ['movement', 'buff'],
    source: 'SRD 5.2',
  },

  // ─────────────────────────────── 4TH LEVEL ───────────────────────────────
  {
    id: 'polymorph',
    name: 'Polymorph',
    level: 4,
    school: 'Transmutation',
    classes: ['Bard', 'Druid', 'Sorcerer', 'Wizard'],
    castingTime: 'Action',
    range: '60 feet',
    components: 'V, S, M (a caterpillar cocoon)',
    duration: 'Up to 1 hour',
    concentration: true,
    description: `You attempt to transform a creature that you can see within range into a Beast. The target must succeed on a Wisdom saving throw or shape-shift into a Beast form for the duration. That form can be any Beast you choose that has a Challenge Rating equal to or less than the target's (or the target's level if it has no Challenge Rating).

The target's game statistics are replaced by the stat block of the chosen Beast, but it keeps its alignment, personality, creature type, Hit Points and Hit Point Dice. The target gains Temporary Hit Points equal to the Hit Points of the Beast form. The spell ends early on the target if it has no Temporary Hit Points left.

The target is limited in the actions it can perform by the anatomy of its new form, and it can't speak or cast spells. Its gear melds into the new form.`,
    tags: ['control', 'buff', 'saving throw'],
    source: 'SRD 5.2',
  },
  {
    id: 'dimension-door',
    name: 'Dimension Door',
    level: 4,
    school: 'Conjuration',
    classes: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: '500 feet',
    components: 'V',
    duration: 'Instantaneous',
    description: `You teleport to a location within range. You arrive at exactly the spot desired. It can be a place you can see, one you can visualize, or one you can describe by stating distance and direction.

You can also teleport one willing creature. The creature must be within 5 feet of you when you teleport, and it teleports to a space within 5 feet of your destination space.

If you, the other creature, or both would arrive in a space occupied by a creature or completely filled by objects, you and any creature traveling with you each take 4d6 Force damage, and the teleportation fails.`,
    tags: ['movement', 'teleport'],
    source: 'SRD 5.2',
  },

  // ─────────────────────────────── 5TH LEVEL ───────────────────────────────
  {
    id: 'cone-of-cold',
    name: 'Cone of Cold',
    level: 5,
    school: 'Evocation',
    classes: ['Druid', 'Sorcerer', 'Wizard'],
    castingTime: 'Action',
    range: 'Self (60-foot Cone)',
    components: 'V, S, M (a small crystal or glass cone)',
    duration: 'Instantaneous',
    description: `You unleash a blast of cold air. Each creature in a 60-foot Cone originating from you makes a Constitution saving throw, taking 8d8 Cold damage on a failed save or half as much damage on a successful one. A creature killed by this spell becomes a frozen statue until it thaws.`,
    higherLevels: 'The damage increases by 1d8 for each spell level above 5.',
    tags: ['damage', 'cold', 'area', 'saving throw'],
    source: 'SRD 5.2',
  },
  {
    id: 'scrying',
    name: 'Scrying',
    level: 5,
    school: 'Divination',
    classes: ['Bard', 'Cleric', 'Druid', 'Warlock', 'Wizard'],
    castingTime: '10 minutes',
    range: 'Self',
    components: 'V, S, M (a focus worth 1,000+ GP, such as a crystal ball or mirror)',
    duration: 'Up to 10 minutes',
    concentration: true,
    description: `You can see and hear a creature you choose that is on the same plane of existence as you. The target makes a Wisdom saving throw, which is modified by how well you know the target and the sort of physical connection you have to it. The target doesn't know what it is making the save against, only that it feels uneasy.

On a failed save, the spell creates an Invisible, intangible sensor within 10 feet of the target. You can see and hear through the sensor as if you were there. The sensor moves with the target. On a successful save, you can't use this spell on that target again for 24 hours.

Instead of a creature, you can target a location you have seen; the sensor appears there and doesn't move.`,
    tags: ['utility', 'detection'],
    source: 'SRD 5.2',
  },

  // ─────────────────────────────── 6TH+ LEVEL ──────────────────────────────
  {
    id: 'true-seeing',
    name: 'True Seeing',
    level: 6,
    school: 'Divination',
    classes: ['Bard', 'Cleric', 'Sorcerer', 'Warlock', 'Wizard'],
    castingTime: 'Action',
    range: 'Touch',
    components: 'V, S, M (mushroom powder worth 25+ GP, which the spell consumes)',
    duration: '1 hour',
    description: `For the duration, the willing creature you touch has Truesight with a range of 120 feet.`,
    tags: ['buff', 'detection'],
    source: 'SRD 5.2',
  },
  {
    id: 'wish',
    name: 'Wish',
    level: 9,
    school: 'Conjuration',
    classes: ['Sorcerer', 'Wizard'],
    castingTime: 'Action',
    range: 'Self',
    components: 'V',
    duration: 'Instantaneous',
    description: `Wish is the mightiest spell a mortal can cast. By simply speaking aloud, you can alter reality itself.

The basic use of this spell is to duplicate any other spell of level 8 or lower. If you use it this way, you don't need to meet any requirements to cast that spell, including costly components. The spell simply takes effect.

Alternatively, you can state a wish to the DM as precisely as possible. The DM has great latitude in ruling what occurs in such an instance; the greater the wish, the greater the likelihood that something goes wrong. Wishing for anything beyond duplicating a spell places great stress on the caster.`,
    tags: ['utility', 'reality'],
    source: 'SRD 5.2',
  },
];
