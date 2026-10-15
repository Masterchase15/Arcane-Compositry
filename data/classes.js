/**
 * ════════════════════════════════════════════════════════════════════════════
 *  CLASSES  -  the twelve D&D (2024) classes, plus any you add
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Everything on the "Classes" page comes from this file (plus classes added
 *  through the DM page). Classes listed here can be chosen when creating a
 *  character and used in a spell's `classes` list.
 *
 *  ─── TO ADD A CUSTOM CLASS ─────────────────────────────────────────────────
 *  Easiest: DM page > Classes > New class.  Or copy this TEMPLATE into the list:
 *
 *    {
 *      id: 'runesmith',               // unique, lowercase, dashes. Optional - made from the name.
 *      name: 'Runesmith',
 *      hitDie: 8,                     // 6, 8, 10 or 12
 *      saves: ['con', 'int'],         // exactly two of: str, dex, con, int, wis, cha
 *      invocation: 'int',             // ability used as the Invocation Modifier (codex p.8)
 *      caster: 'partial',             // Mana pool (codex p.9): 'full', 'partial' (about 65%) or 'martial' (about 40%)
 *      skillPicks: 2,                 // how many skills the class chooses
 *      primaryAbility: 'Intelligence',
 *      role: 'One line that sums the class up.',
 *      description: `A paragraph or two about the class.`,
 *      skills: 'Choose 2: Arcana, History, Investigation',
 *      weapons: 'Simple weapons',
 *      armor: 'Light armor',
 *      tools: "Smith's tools",
 *      equipment: 'Starting equipment.',
 *      compositry: `How the class plays with Arcane Compositry.`,
 *      features: [                    // [level, 'Name', 'What it does']
 *        [1, 'Rune Carving', 'You can ...'],
 *        [2, 'Second Feature', '...'],
 *      ],
 *      tags: ['custom'],
 *      hidden: true,                  // optional - true = only the DM sees it until it is published
 *    },
 *
 *  SUBCLASSES live in their own file, data/subclasses.js. Each one names its
 *  parent class, and shows up on that class's page automatically.
 *
 *  ─── ABOUT THE TEXT BELOW ──────────────────────────────────────────────────
 *  These are short SUMMARIES written for quick reference at the table - enough
 *  to choose a class and remember what a feature does. They are not the full
 *  rules text; use your Player's Handbook for exact wording. Edit them freely
 *  (here, or with Edit on the DM page) to add as much detail as you like.
 *
 *  The `compositry` notes for Fighter, Barbarian, Monk and Rogue come from the
 *  optional Class Identity Hooks on codex page 23.
 * ════════════════════════════════════════════════════════════════════════════
 */

// Three entries every class shares, so they are written once here.
const ASI = (level) => [level, 'Ability Score Improvement', 'Gain the Ability Score Improvement feat or another feat you qualify for.'];
const BOON = [19, 'Epic Boon', 'Gain an Epic Boon feat or another feat of your choice.'];
const SUB = (level) => [level, 'Subclass feature', 'You gain a feature from your subclass.'];

const CASTER_NOTE = 'Mana replaces spell slots: each Codified spell costs Mana by its level (see the Codified spell list), and you can improvise Compositions with the Spellcrafter.';

export default [
  {
    name: 'Barbarian', hitDie: 12, saves: ['str', 'con'], invocation: 'str', caster: 'martial', skillPicks: 2,
    primaryAbility: 'Strength', role: 'A fierce warrior of primal Rage.',
    description: `Barbarians are mighty warriors powered by primal forces that manifest as a Rage. They shrug off blows that would fell others and hit back harder.`,
    skills: 'Choose 2: Animal Handling, Athletics, Intimidation, Nature, Perception, Survival',
    weapons: 'Simple and Martial weapons', armor: 'Light and Medium armor, Shields',
    equipment: 'Greataxe, 4 Handaxes, Explorer\'s Pack and 15 GP; or 75 GP.',
    compositry: `Savage Momentum: consecutive hits build damage rapidly, but long Chains create larger defensive penalties.

As a primarily martial Catalyst user you have about 40% of the full Mana pool. Applied Thaumaturgy through Strength (force and impact) suits you: weapon infusions and Smash-capable heavy blows.`,
    features: [
      [1, 'Rage', 'As a Bonus Action enter a Rage: resistance to Bludgeoning, Piercing and Slashing damage, bonus damage on Strength attacks, and Advantage on Strength checks and saves. You cannot cast spells or concentrate while raging.'],
      [1, 'Unarmored Defense', 'Without armor, your AC is 10 + Dexterity modifier + Constitution modifier. You can use a Shield.'],
      [1, 'Weapon Mastery', 'Use the mastery properties of two kinds of weapons you choose.'],
      [2, 'Danger Sense', 'Advantage on Dexterity saving throws unless you are Incapacitated.'],
      [2, 'Reckless Attack', 'Gain Advantage on Strength attack rolls this turn; attacks against you have Advantage until your next turn.'],
      [3, 'Barbarian Subclass', 'Choose a Path.'],
      [3, 'Primal Knowledge', 'Gain another skill, and while raging use Strength for certain skill checks.'],
      ASI(4),
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'],
      [5, 'Fast Movement', 'Speed increases by 10 feet while not wearing Heavy armor.'],
      SUB(6),
      [7, 'Feral Instinct', 'Advantage on Initiative rolls.'],
      [7, 'Instinctive Pounce', 'Move up to half your Speed as part of entering a Rage.'],
      ASI(8),
      [9, 'Brutal Strike', 'Give up Advantage from Reckless Attack to deal extra damage and a push or slow effect.'],
      SUB(10),
      [11, 'Relentless Rage', 'While raging, a Constitution save lets you drop to a few Hit Points instead of 0.'],
      ASI(12),
      [13, 'Improved Brutal Strike', 'New Brutal Strike effects.'],
      SUB(14),
      [15, 'Persistent Rage', 'Regain all Rage uses when you roll Initiative (once per Long Rest), and your Rage is harder to end.'],
      ASI(16),
      [17, 'Improved Brutal Strike', 'More Brutal Strike damage, and two effects at once.'],
      [18, 'Indomitable Might', 'Your Strength checks and saves cannot total less than your Strength score.'],
      BOON,
      [20, 'Primal Champion', 'Strength and Constitution each increase by 4, to a maximum of 25.'],
    ],
    tags: ['martial', 'melee', 'tank'], source: 'D&D 2024',
  },
  {
    name: 'Bard', hitDie: 8, saves: ['dex', 'cha'], invocation: 'cha', caster: 'full', skillPicks: 3,
    primaryAbility: 'Charisma', role: 'An inspiring performer of music, dance and magic.',
    description: `Bards are expert at inspiring others, soothing hurts, disheartening foes and creating illusions. Their magic flows from words, music and motion.`,
    skills: 'Choose any 3 skills', weapons: 'Simple weapons', armor: 'Light armor', tools: 'Three Musical Instruments',
    equipment: 'Leather Armor, 2 Daggers, a Musical Instrument, Entertainer\'s Pack and 19 GP; or 90 GP.',
    compositry: `${CASTER_NOTE}

A Bard's Bridge gesture is performance: a struck chord, a dance step or a spoken line can close the circuit.`,
    features: [
      [1, 'Bardic Inspiration', 'As a Bonus Action give a creature a die (d6, growing with level) to add to a failed d20 Test.'],
      [1, 'Spellcasting', 'Cast Bard spells using Charisma.'],
      [2, 'Expertise', 'Double your proficiency bonus in two skills.'],
      [2, 'Jack of All Trades', 'Add half your Proficiency Bonus to skill checks you are not proficient in.'],
      [3, 'Bard Subclass', 'Choose a College.'],
      ASI(4),
      [5, 'Font of Inspiration', 'Regain Bardic Inspiration on a Short Rest, and trade spell power for more uses.'],
      SUB(6),
      [7, 'Countercharm', 'Use your Reaction to let a creature reroll a failed save against Charmed or Frightened.'],
      ASI(8),
      [9, 'Expertise', 'Expertise in two more skills.'],
      [10, 'Magical Secrets', 'Your prepared spells can come from the Cleric, Druid and Wizard lists too.'],
      ASI(12), SUB(14), ASI(16),
      [18, 'Superior Inspiration', 'Regain Bardic Inspiration up to two uses when you roll Initiative.'],
      BOON,
      [20, 'Words of Creation', 'Always have Power Word Heal and Power Word Kill prepared, and affect a second target with them.'],
    ],
    tags: ['caster', 'support', 'skills'], source: 'D&D 2024',
  },
  {
    name: 'Cleric', hitDie: 8, saves: ['wis', 'cha'], invocation: 'wis', caster: 'full', skillPicks: 2,
    primaryAbility: 'Wisdom', role: 'A miraculous priest of divine power.',
    description: `Clerics draw power from the realms of the gods and harness it to work miracles: healing, protection and holy wrath.`,
    skills: 'Choose 2: History, Insight, Medicine, Persuasion, Religion',
    weapons: 'Simple weapons', armor: 'Light and Medium armor, Shields',
    equipment: 'Chain Shirt, Shield, Mace, Holy Symbol, Priest\'s Pack and 7 GP; or 110 GP.',
    compositry: `${CASTER_NOTE}

Clerics use Wisdom as their Invocation Modifier. Celestial is a natural Physical Component for divine Compositions.`,
    features: [
      [1, 'Spellcasting', 'Cast Cleric spells using Wisdom.'],
      [1, 'Divine Order', 'Choose Protector (Martial weapons and Heavy armor) or Thaumaturge (an extra cantrip and better Arcana or Religion).'],
      [2, 'Channel Divinity', 'Channel divine energy: Divine Spark to heal or harm, or Turn Undead.'],
      [3, 'Cleric Subclass', 'Choose a Domain.'],
      ASI(4),
      [5, 'Sear Undead', 'Turn Undead also deals Radiant damage.'],
      SUB(6),
      [7, 'Blessed Strikes', 'Choose Divine Strike (extra weapon damage) or Potent Spellcasting (add Wisdom to cantrip damage).'],
      ASI(8),
      [10, 'Divine Intervention', 'As a Magic action, cast any Cleric spell of level 5 or lower without cost, once per Long Rest.'],
      ASI(12),
      [14, 'Improved Blessed Strikes', 'Your Blessed Strikes option grows stronger.'],
      ASI(16), SUB(17), BOON,
      [20, 'Greater Divine Intervention', 'Divine Intervention can produce a Wish.'],
    ],
    tags: ['caster', 'healer', 'support'], source: 'D&D 2024',
  },
  {
    name: 'Druid', hitDie: 8, saves: ['int', 'wis'], invocation: 'wis', caster: 'full', skillPicks: 2,
    primaryAbility: 'Wisdom', role: 'A nature priest of primal magic and shapeshifting.',
    description: `Druids belong to ancient orders that call on the forces of nature. They heal, shape the elements and take the forms of animals.`,
    skills: 'Choose 2: Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, Survival',
    weapons: 'Simple weapons', armor: 'Light armor, Shields', tools: 'Herbalism Kit',
    equipment: 'Leather Armor, Shield, Sickle, Druidic Focus (Quarterstaff), Explorer\'s Pack, Herbalism Kit and 9 GP; or 50 GP.',
    compositry: `${CASTER_NOTE}

In a nature-rooted campaign the Druid is at home: Flora, Geo and Water are everywhere, so the Environmental discount (-1 Mana when an abundant Physical Component is nearby) applies often.`,
    features: [
      [1, 'Spellcasting', 'Cast Druid spells using Wisdom.'],
      [1, 'Druidic', 'You know the secret language of Druids and always have Speak with Animals prepared.'],
      [1, 'Primal Order', 'Choose Magician (an extra cantrip and better Arcana or Nature) or Warden (Martial weapons and Medium armor).'],
      [2, 'Wild Shape', 'As a Bonus Action take the form of a Beast you know, gaining Temporary Hit Points.'],
      [2, 'Wild Companion', 'Spend a Wild Shape use to cast Find Familiar.'],
      [3, 'Druid Subclass', 'Choose a Circle.'],
      ASI(4),
      [5, 'Wild Resurgence', 'Trade spell power for Wild Shape uses, and the reverse once per Long Rest.'],
      SUB(6),
      [7, 'Elemental Fury', 'Choose Potent Spellcasting (add Wisdom to cantrip damage) or Primal Strike (extra elemental damage on hits).'],
      ASI(8), SUB(10), ASI(12), SUB(14),
      [15, 'Improved Elemental Fury', 'Your Elemental Fury option grows stronger.'],
      ASI(16),
      [18, 'Beast Spells', 'Cast spells while in Wild Shape.'],
      BOON,
      [20, 'Archdruid', 'Regain Wild Shape on Initiative, convert Wild Shape into spell power, and age very slowly.'],
    ],
    tags: ['caster', 'nature', 'shapeshifter'], source: 'D&D 2024',
  },
  {
    name: 'Fighter', hitDie: 10, saves: ['str', 'con'], invocation: 'str', caster: 'martial', skillPicks: 2,
    primaryAbility: 'Strength or Dexterity', role: 'A master of all arms and armor.',
    description: `Fighters rule many battlefields. They share an unparalleled prowess with weapons and armor and a thorough knowledge of combat.`,
    skills: 'Choose 2: Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Persuasion, Perception, Survival',
    weapons: 'Simple and Martial weapons', armor: 'Light, Medium and Heavy armor, Shields',
    equipment: 'Chain Mail, Greatsword, Flail, 8 Javelins, Dungeoneer\'s Pack and 4 GP; or Studded Leather, Scimitar, Shortsword, Longbow, 20 Arrows, Quiver, Dungeoneer\'s Pack and 11 GP; or 155 GP.',
    compositry: `Master of Chains: reliable continuation, better Parry thresholds, weapon-specific techniques, or one miss per turn that does not immediately break rhythm.

The Fighter does not stop to "cast". The sword draw, stance, grip or strike is the Bridge. Use Strength (force), Dexterity (precision) or Constitution (armor) as your Invocation ability for Applied Thaumaturgy.`,
    features: [
      [1, 'Fighting Style', 'Gain a Fighting Style feat of your choice.'],
      [1, 'Second Wind', 'As a Bonus Action regain 1d10 + Fighter level Hit Points. Limited uses.'],
      [1, 'Weapon Mastery', 'Use the mastery properties of three kinds of weapons you choose.'],
      [2, 'Action Surge', 'Take one additional action on your turn, once per Short or Long Rest.'],
      [2, 'Tactical Mind', 'Spend Second Wind to add 1d10 to a failed ability check.'],
      [3, 'Fighter Subclass', 'Choose a subclass.'],
      ASI(4),
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'],
      [5, 'Tactical Shift', 'Using Second Wind lets you move half your Speed without provoking Opportunity Attacks.'],
      ASI(6), SUB(7), ASI(8),
      [9, 'Indomitable', 'Reroll a failed saving throw with a bonus equal to your Fighter level.'],
      [9, 'Tactical Master', 'Swap a weapon mastery for Push, Sap or Slow when you attack.'],
      SUB(10),
      [11, 'Two Extra Attacks', 'Attack three times when you take the Attack action.'],
      ASI(12),
      [13, 'Studied Attacks', 'After missing a creature, gain Advantage on your next attack against it.'],
      ASI(14), SUB(15), ASI(16),
      [17, 'Action Surge (two uses)', 'Use Action Surge twice per rest, once per turn.'],
      SUB(18), BOON,
      [20, 'Three Extra Attacks', 'Attack four times when you take the Attack action.'],
    ],
    tags: ['martial', 'melee', 'ranged'], source: 'D&D 2024',
  },
  {
    name: 'Monk', hitDie: 8, saves: ['str', 'dex'], invocation: 'dex', caster: 'martial', skillPicks: 2,
    primaryAbility: 'Dexterity and Wisdom', role: 'A martial artist of supernatural focus.',
    description: `Monks use rigorous combat training and mental discipline to align themselves with the multiverse and focus their internal reservoirs of power.`,
    skills: 'Choose 2: Acrobatics, Athletics, History, Insight, Religion, Stealth',
    weapons: 'Simple weapons and Martial weapons that have the Light property', armor: 'None', tools: 'One type of Artisan\'s Tools or Musical Instrument',
    equipment: 'Spear, 5 Daggers, Artisan\'s Tools or Musical Instrument, Explorer\'s Pack and 11 GP; or 50 GP.',
    compositry: `Chain Specialist: longer Chains with moderate individual damage; specific sequences can unlock trips, pushes or stance changes.

The body is the circuit. Monks route Applied Thaumaturgy through Dexterity (speed and precision); a stance change or strike is the Bridge.`,
    features: [
      [1, 'Martial Arts', 'Use Dexterity for Unarmed Strikes and Monk weapons, roll a Martial Arts die for their damage, and make an Unarmed Strike as a Bonus Action.'],
      [1, 'Unarmored Defense', 'Without armor or a Shield, your AC is 10 + Dexterity modifier + Wisdom modifier.'],
      [2, "Monk's Focus", 'Spend Focus Points on Flurry of Blows, Patient Defense and Step of the Wind.'],
      [2, 'Unarmored Movement', 'Speed increases while you wear no armor or Shield.'],
      [2, 'Uncanny Metabolism', 'When you roll Initiative, regain all Focus Points and some Hit Points, once per Long Rest.'],
      [3, 'Deflect Attacks', 'Use your Reaction to reduce damage from an attack, and redirect it if reduced to 0.'],
      [3, 'Monk Subclass', 'Choose a Warrior tradition.'],
      ASI(4),
      [4, 'Slow Fall', 'Use your Reaction to reduce falling damage.'],
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'],
      [5, 'Stunning Strike', 'Spend a Focus Point on a hit to force a Constitution save or Stun the target.'],
      [6, 'Empowered Strikes', 'Your Unarmed Strikes can deal Force damage.'],
      SUB(6),
      [7, 'Evasion', 'Take no damage on a successful Dexterity save for half, and half on a failure.'],
      ASI(8),
      [9, 'Acrobatic Movement', 'Move along vertical surfaces and across liquids on your turn.'],
      [10, 'Heightened Focus', 'Flurry of Blows, Patient Defense and Step of the Wind improve.'],
      [10, 'Self-Restoration', 'End Charmed, Frightened or Poisoned on yourself at the end of your turn.'],
      SUB(11), ASI(12),
      [13, 'Deflect Energy', 'Deflect Attacks works against any damage type.'],
      [14, 'Disciplined Survivor', 'Proficiency in all saving throws, and spend a Focus Point to reroll a failed save.'],
      [15, 'Perfect Focus', 'Regain Focus Points up to 4 when you roll Initiative with few remaining.'],
      ASI(16), SUB(17),
      [18, 'Superior Defense', 'Spend Focus Points for Resistance to all damage except Force for 1 minute.'],
      BOON,
      [20, 'Body and Mind', 'Dexterity and Wisdom each increase by 4, to a maximum of 25.'],
    ],
    tags: ['martial', 'melee', 'mobile'], source: 'D&D 2024',
  },
  {
    name: 'Paladin', hitDie: 10, saves: ['wis', 'cha'], invocation: 'cha', caster: 'partial', skillPicks: 2,
    primaryAbility: 'Strength and Charisma', role: 'A devout warrior of sacred oaths.',
    description: `Paladins are united by their oaths to stand against the forces of annihilation and corruption. They heal, protect and smite.`,
    skills: 'Choose 2: Athletics, Insight, Intimidation, Medicine, Persuasion, Religion',
    weapons: 'Simple and Martial weapons', armor: 'Light, Medium and Heavy armor, Shields',
    equipment: 'Chain Mail, Shield, Longsword, 6 Javelins, Holy Symbol, Priest\'s Pack and 9 GP; or 150 GP.',
    compositry: `A partial caster with about 65% of the full Mana pool. ${CASTER_NOTE}

Paladins pair well with Applied Thaumaturgy: defensive infusions add Reinforcement to a Block, and a smite is naturally a weapon infusion discharged on a hit or Finisher.`,
    features: [
      [1, 'Lay on Hands', 'A pool of healing (5 x Paladin level) you can spend as a Bonus Action; it can also cure Poisoned.'],
      [1, 'Spellcasting', 'Cast Paladin spells using Charisma.'],
      [1, 'Weapon Mastery', 'Use the mastery properties of two kinds of weapons you choose.'],
      [2, 'Fighting Style', 'Gain a Fighting Style feat, or Blessed Warrior for Cleric cantrips.'],
      [2, "Paladin's Smite", 'Always have Divine Smite prepared, and cast it once per Long Rest without cost.'],
      [3, 'Channel Divinity', 'Channel divine energy, starting with Divine Sense.'],
      [3, 'Paladin Subclass', 'Choose an Oath.'],
      ASI(4),
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'],
      [5, 'Faithful Steed', 'Always have Find Steed prepared, and cast it once per Long Rest without cost.'],
      [6, 'Aura of Protection', 'You and allies within 10 feet add your Charisma modifier to saving throws.'],
      SUB(7), ASI(8),
      [9, 'Abjure Foes', 'Use Channel Divinity to Frighten several foes and limit their actions.'],
      [10, 'Aura of Courage', 'You and allies in your aura are immune to Frightened.'],
      [11, 'Radiant Strikes', 'Your melee weapon and Unarmed Strike hits deal an extra 1d8 Radiant damage.'],
      ASI(12),
      [14, 'Restoring Touch', 'Lay on Hands can also remove several conditions.'],
      SUB(15), ASI(16),
      [18, 'Aura Expansion', 'Your auras extend to 30 feet.'],
      BOON, SUB(20),
    ],
    tags: ['martial', 'half-caster', 'tank', 'support'], source: 'D&D 2024',
  },
  {
    name: 'Ranger', hitDie: 10, saves: ['str', 'dex'], invocation: 'wis', caster: 'partial', skillPicks: 3,
    primaryAbility: 'Dexterity and Wisdom', role: 'A wandering warrior imbued with primal magic.',
    description: `Rangers are honed with deadly focus and harness primal powers to protect the world from the ravages of monsters and tyrants.`,
    skills: 'Choose 3: Animal Handling, Athletics, Insight, Investigation, Nature, Perception, Stealth, Survival',
    weapons: 'Simple and Martial weapons', armor: 'Light and Medium armor, Shields',
    equipment: 'Studded Leather Armor, Scimitar, Shortsword, Longbow, 20 Arrows, Quiver, Druidic Focus, Explorer\'s Pack and 7 GP; or 150 GP.',
    compositry: `A partial caster with about 65% of the full Mana pool. ${CASTER_NOTE}

Successful ranged attack rolls build the Momentum Die, so a Ranger can build a combo from a distance and stay out of reach of the hits that would reset it.`,
    features: [
      [1, 'Spellcasting', 'Cast Ranger spells using Wisdom.'],
      [1, 'Favored Enemy', "Always have Hunter's Mark prepared, and cast it a few times per Long Rest without cost."],
      [1, 'Weapon Mastery', 'Use the mastery properties of two kinds of weapons you choose.'],
      [2, 'Deft Explorer', 'Expertise in one skill and two extra languages.'],
      [2, 'Fighting Style', 'Gain a Fighting Style feat, or Druidic Warrior for Druid cantrips.'],
      [3, 'Ranger Subclass', 'Choose a subclass.'],
      ASI(4),
      [5, 'Extra Attack', 'Attack twice when you take the Attack action.'],
      [6, 'Roving', 'Speed increases by 10 feet, and you gain Climb and Swim Speeds.'],
      SUB(7), ASI(8),
      [9, 'Expertise', 'Expertise in two more skills.'],
      [10, 'Tireless', 'Gain Temporary Hit Points as a Magic action, and Short Rests reduce Exhaustion.'],
      SUB(11), ASI(12),
      [13, 'Relentless Hunter', "Taking damage cannot break your Concentration on Hunter's Mark."],
      [14, "Nature's Veil", 'As a Bonus Action become Invisible until the end of your next turn.'],
      SUB(15), ASI(16),
      [17, 'Precise Hunter', "Advantage on attacks against the target of your Hunter's Mark."],
      [18, 'Feral Senses', 'Gain Blindsight with a range of 30 feet.'],
      BOON,
      [20, 'Foe Slayer', "Your Hunter's Mark damage die becomes a d10."],
    ],
    tags: ['martial', 'half-caster', 'ranged', 'nature'], source: 'D&D 2024',
  },
  {
    name: 'Rogue', hitDie: 8, saves: ['dex', 'int'], invocation: 'dex', caster: 'martial', skillPicks: 4,
    primaryAbility: 'Dexterity', role: 'A dexterous expert in stealth and subterfuge.',
    description: `Rogues rely on cunning, stealth and their foes' vulnerabilities to get the upper hand in any situation.`,
    skills: 'Choose 4: Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Persuasion, Sleight of Hand, Stealth',
    weapons: 'Simple weapons and Martial weapons that have the Finesse or Light property', armor: 'Light armor', tools: "Thieves' Tools",
    equipment: 'Leather Armor, 2 Daggers, Shortsword, Shortbow, 20 Arrows, Quiver, Thieves\' Tools, Burglar\'s Pack and 8 GP; or 100 GP.',
    compositry: `Opening Hunter: shorter Chains, but excellent Perfect Dodge and Parry payoffs, counters, and large rewards for exploiting openings.

Rogues are proficient in Dexterity saves, so they add their Proficiency Bonus to Dodge. Spend Guard on Counter-attacks when an enemy misses badly.`,
    features: [
      [1, 'Expertise', 'Double your proficiency bonus in two skills.'],
      [1, 'Sneak Attack', 'Once per turn deal extra damage (1d6, growing with level) when you have Advantage or an ally is next to the target.'],
      [1, "Thieves' Cant", "You know Thieves' Cant and one other language."],
      [1, 'Weapon Mastery', 'Use the mastery properties of two kinds of weapons you choose.'],
      [2, 'Cunning Action', 'Dash, Disengage or Hide as a Bonus Action.'],
      [3, 'Rogue Subclass', 'Choose a subclass.'],
      [3, 'Steady Aim', 'As a Bonus Action give yourself Advantage on your next attack if you have not moved.'],
      ASI(4),
      [5, 'Cunning Strike', 'Give up Sneak Attack dice to poison, trip or withdraw.'],
      [5, 'Uncanny Dodge', 'Use your Reaction to halve the damage of an attack that hits you.'],
      [6, 'Expertise', 'Expertise in two more skills.'],
      [7, 'Evasion', 'Take no damage on a successful Dexterity save for half, and half on a failure.'],
      [7, 'Reliable Talent', 'Treat a roll of 9 or lower as a 10 on checks you are proficient in.'],
      ASI(8), SUB(9), ASI(10),
      [11, 'Improved Cunning Strike', 'Use two Cunning Strike effects at once.'],
      ASI(12), SUB(13),
      [14, 'Devious Strikes', 'New Cunning Strike options: Daze, Knock Out and Obscure.'],
      [15, 'Slippery Mind', 'Proficiency in Wisdom and Charisma saving throws.'],
      ASI(16), SUB(17),
      [18, 'Elusive', 'No attack roll has Advantage against you unless you are Incapacitated.'],
      BOON,
      [20, 'Stroke of Luck', 'Turn a failed d20 Test into a 20, once per Short or Long Rest.'],
    ],
    tags: ['martial', 'skills', 'stealth'], source: 'D&D 2024',
  },
  {
    name: 'Sorcerer', hitDie: 6, saves: ['con', 'cha'], invocation: 'cha', caster: 'full', skillPicks: 2,
    primaryAbility: 'Charisma', role: 'A dazzling mage filled with innate magic.',
    description: `Sorcerers wield innate magic that is stamped into their being. They do not learn magic; the raw, roiling power is part of them.`,
    skills: 'Choose 2: Arcana, Deception, Insight, Intimidation, Persuasion, Religion',
    weapons: 'Simple weapons', armor: 'None',
    equipment: 'Spear, 2 Daggers, Arcane Focus (crystal), Dungeoneer\'s Pack and 28 GP; or 50 GP.',
    compositry: `${CASTER_NOTE}

Sorcerers use Charisma as their Invocation Modifier. Spellcaster identity hook: Distributed Barrage - split one Composition's damage pool across several attacks instead of repeating full spell damage.`,
    features: [
      [1, 'Spellcasting', 'Cast Sorcerer spells using Charisma.'],
      [1, 'Innate Sorcery', 'As a Bonus Action, for 1 minute raise your spell save DC by 1 and gain Advantage on Sorcerer spell attacks.'],
      [2, 'Font of Magic', 'Gain Sorcery Points you can convert to and from spell power.'],
      [2, 'Metamagic', 'Choose two Metamagic options that reshape your spells.'],
      [3, 'Sorcerer Subclass', 'Choose a source of power.'],
      ASI(4),
      [5, 'Sorcerous Restoration', 'Regain some Sorcery Points on a Short Rest.'],
      SUB(6),
      [7, 'Sorcery Incarnate', 'Spend Sorcery Points to use Innate Sorcery again, and apply two Metamagic options to one spell while it is active.'],
      ASI(8),
      [10, 'Metamagic', 'Learn two more Metamagic options.'],
      ASI(12), SUB(14), ASI(16),
      [17, 'Metamagic', 'Learn two more Metamagic options.'],
      SUB(18), BOON,
      [20, 'Arcane Apotheosis', 'While Innate Sorcery is active, use one Metamagic option each turn without spending Sorcery Points.'],
    ],
    tags: ['caster', 'damage'], source: 'D&D 2024',
  },
  {
    name: 'Warlock', hitDie: 8, saves: ['wis', 'cha'], invocation: 'cha', caster: 'full', skillPicks: 2,
    primaryAbility: 'Charisma', role: 'An occultist empowered by otherworldly pacts.',
    description: `Warlocks quest for knowledge that lies hidden in the fabric of the multiverse. Through pacts with mysterious beings they unlock magical effects both subtle and spectacular.`,
    skills: 'Choose 2: Arcana, Deception, History, Intimidation, Investigation, Nature, Religion',
    weapons: 'Simple weapons', armor: 'Light armor',
    equipment: 'Leather Armor, Sickle, 2 Daggers, Arcane Focus (orb), Book (occult lore), Scholar\'s Pack and 15 GP; or 100 GP.',
    compositry: `${CASTER_NOTE}

Pact Magic normally gives a few slots that return on a Short Rest. With Mana, treat the Warlock as a full caster by default - or have your DM choose a smaller pool that refreshes on a Short Rest. The Mana pool type can be changed on the character sheet's Arcane tab.`,
    features: [
      [1, 'Eldritch Invocations', 'Gain fragments of forbidden knowledge that grant lasting magical abilities; you learn more as you level.'],
      [1, 'Pact Magic', 'Cast Warlock spells using Charisma.'],
      [2, 'Magical Cunning', 'Spend 1 minute to regain half your spell power, once per Long Rest.'],
      [3, 'Warlock Subclass', 'Choose a Patron.'],
      ASI(4), SUB(6), ASI(8),
      [9, 'Contact Patron', 'Always have Contact Other Plane prepared, and cast it once per Long Rest to reach your patron safely.'],
      SUB(10),
      [11, 'Mystic Arcanum (level 6)', 'Choose one level 6 Warlock spell to cast once per Long Rest.'],
      ASI(12),
      [13, 'Mystic Arcanum (level 7)', 'Choose one level 7 Warlock spell to cast once per Long Rest.'],
      SUB(14),
      [15, 'Mystic Arcanum (level 8)', 'Choose one level 8 Warlock spell to cast once per Long Rest.'],
      ASI(16),
      [17, 'Mystic Arcanum (level 9)', 'Choose one level 9 Warlock spell to cast once per Long Rest.'],
      BOON,
      [20, 'Eldritch Master', 'Magical Cunning restores all of your spell power.'],
    ],
    tags: ['caster', 'damage'], source: 'D&D 2024',
  },
  {
    name: 'Wizard', hitDie: 6, saves: ['int', 'wis'], invocation: 'int', caster: 'full', skillPicks: 2,
    primaryAbility: 'Intelligence', role: 'A scholarly magic-user of arcane power.',
    description: `Wizards are defined by their exhaustive study of magic's inner workings. They cast spells of explosive fire, arcing lightning, subtle deception and spectacular transformation.`,
    skills: 'Choose 2: Arcana, History, Insight, Investigation, Medicine, Nature, Religion',
    weapons: 'Simple weapons', armor: 'None',
    equipment: '2 Daggers, Arcane Focus (Quarterstaff), Robe, Spellbook, Scholar\'s Pack and 5 GP; or 55 GP.',
    compositry: `${CASTER_NOTE}

Wizards use Intelligence as their Invocation Modifier and are the natural scholars of circuits: Read the Circuit (Arcana vs. DC 10 + Potency), Arcane Discovery and Codification are where they shine.`,
    features: [
      [1, 'Spellcasting', 'Cast Wizard spells using Intelligence, recorded in a spellbook.'],
      [1, 'Ritual Adept', 'Cast any Ritual spell in your spellbook as a Ritual without preparing it.'],
      [1, 'Arcane Recovery', 'Recover some spell power on a Short Rest, once per Long Rest.'],
      [2, 'Scholar', 'Expertise in one academic skill.'],
      [3, 'Wizard Subclass', 'Choose a school of study.'],
      ASI(4),
      [5, 'Memorize Spell', 'Swap one prepared spell on a Short Rest.'],
      SUB(6), ASI(8), SUB(10), ASI(12), SUB(14), ASI(16),
      [18, 'Spell Mastery', 'Cast one chosen level 1 and one level 2 spell at their lowest level without cost.'],
      BOON,
      [20, 'Signature Spells', 'Two level 3 spells are always prepared and can each be cast once per rest without cost.'],
    ],
    tags: ['caster', 'utility', 'damage'], source: 'D&D 2024',
  },
];
