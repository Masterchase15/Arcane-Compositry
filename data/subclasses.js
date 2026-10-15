/**
 * ════════════════════════════════════════════════════════════════════════════
 *  SUBCLASSES  -  the 48 D&D (2024) subclasses, plus any you add
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Each subclass names its parent class in `className`. On a class's page the
 *  "Subclasses" section lists every subclass whose className matches - so a
 *  custom subclass appears under its parent automatically.
 *
 *  ─── TO ADD A CUSTOM SUBCLASS ──────────────────────────────────────────────
 *  Easiest: DM page > Classes > Subclasses > New subclass.
 *  Or copy this TEMPLATE into the list below:
 *
 *    {
 *      id: 'path-of-the-thornheart',  // unique, lowercase, dashes. Optional - made from the name.
 *      name: 'Path of the Thornheart',
 *      className: 'Barbarian',        // the parent class - must match a class name exactly
 *      hidden: true,                  // optional - true = only the DM sees it until it is published
 *      description: `What the subclass is about.`,
 *      features: [                    // [level, 'Name', 'What it adds']
 *        [3, 'Bramble Hide', 'While raging, creatures that hit you with a melee attack take 1d4 Piercing damage.'],
 *        [6, 'Rooted Fury', '...'],
 *      ],
 *      compositry: `Optional: how it plays with Mana, Attack Chains or Applied Thaumaturgy.`,
 *      tags: ['custom'],
 *    },
 *
 *  ─── ABOUT THE TEXT BELOW ──────────────────────────────────────────────────
 *  These follow the 2024 (5.5e) Player's Handbook: the right features at the
 *  right levels, each with a short SUMMARY of what it does, written for quick
 *  table reference. They are not the full rules text - check exact numbers and
 *  wording against your book, and edit anything here or on the DM page.
 * ════════════════════════════════════════════════════════════════════════════
 */
export default [
  // ─────────────────────────────── BARBARIAN ───────────────────────────────
  { name: 'Path of the Berserker', className: 'Barbarian', description: 'Channel Rage into violent fury, trading safety for raw damage.', features: [
    [3, 'Frenzy', 'When you use Reckless Attack while raging, your first Strength-based hit each turn deals extra damage: a number of d6s equal to your Rage Damage bonus.'],
    [6, 'Mindless Rage', 'You are immune to the Charmed and Frightened conditions while raging, and entering a Rage ends them.'],
    [10, 'Retaliation', 'When a creature within 5 feet damages you, use your Reaction to make a melee attack against it.'],
    [14, 'Intimidating Presence', 'As a Bonus Action, creatures of your choice within 30 feet make a Wisdom save or are Frightened for 1 minute. Once per Long Rest, or spend a Rage use.'],
  ] },
  { name: 'Path of the Wild Heart', className: 'Barbarian', description: 'Walk in kinship with animals and take on their aspects while raging.', features: [
    [3, 'Animal Speaker', 'Cast Beast Sense and Speak with Animals as Rituals, using Wisdom.'],
    [3, 'Rage of the Wilds', 'Each time you rage choose Bear (resistance to most damage types), Eagle (Dash and Disengage as part of the Bonus Action, and each turn after) or Wolf (allies have Advantage on attacks against enemies within 5 feet of you).'],
    [6, 'Aspect of the Wilds', 'Choose Owl (Darkvision), Panther (Climb Speed) or Salmon (Swim Speed). You can change it after a Long Rest.'],
    [10, 'Nature Speaker', 'Cast Commune with Nature as a Ritual, using Wisdom.'],
    [14, 'Power of the Wilds', 'Each time you rage choose Falcon (Fly Speed without armor), Lion (enemies within 5 feet have Disadvantage attacking anyone but you) or Ram (knock a Large or smaller creature Prone on a melee hit).'],
  ] },
  { name: 'Path of the World Tree', className: 'Barbarian', description: 'Draw on the cosmic tree Yggdrasil for vitality, reach and teleportation.', features: [
    [3, 'Vitality of the Tree', 'Entering a Rage gives you Temporary Hit Points equal to your Barbarian level, and each turn while raging you can give an ally within 10 feet Temporary Hit Points (d6s equal to your Rage Damage bonus).'],
    [6, 'Branches of the Tree', 'While raging, when a creature within 30 feet starts its turn, use your Reaction: it makes a Strength save or is teleported next to you, and you can reduce its Speed to 0 for the turn.'],
    [10, 'Battering Roots', 'On your turn your reach with Heavy or Versatile melee weapons is 10 feet longer, and a hit can apply the Push or Topple mastery in addition to the weapon\'s own.'],
    [14, 'Travel along the Tree', 'When you rage, and as a Bonus Action while raging, teleport up to 60 feet. Once per Rage the range is 150 feet and you can bring up to six willing creatures.'],
  ] },
  { name: 'Path of the Zealot', className: 'Barbarian', description: 'Rage in ecstatic union with a god, striking with divine power.', features: [
    [3, 'Divine Fury', 'While raging, your first hit each turn deals extra Necrotic or Radiant damage: 1d6 + half your Barbarian level.'],
    [3, 'Warrior of the Gods', 'A pool of d12s (four, growing with level) that you spend as a Bonus Action to heal yourself. Refills on a Long Rest.'],
    [6, 'Fanatical Focus', 'Once per Rage, reroll a failed saving throw with a bonus equal to your Rage Damage.'],
    [10, 'Zealous Presence', 'As a Bonus Action, up to ten creatures within 60 feet gain Advantage on attack rolls and saving throws until your next turn. Once per Long Rest, or spend a Rage use.'],
    [14, 'Rage of the Gods', 'When you rage, take a divine form for 1 minute: Fly Speed, resistance to Necrotic, Psychic and Radiant damage, and a Reaction to stop an ally dropping to 0 Hit Points by spending a Rage use. Once per Long Rest.'],
  ] },

  // ───────────────────────────────── BARD ──────────────────────────────────
  { name: 'College of Dance', className: 'Bard', description: 'Move in harmony with the cosmos: unarmored agility and inspiring footwork.', features: [
    [3, 'Dazzling Footwork', 'While unarmored: Advantage on Performance checks that involve dancing, AC of 10 + Dexterity + Charisma, Dexterity-based Unarmed Strikes that use your Bardic Inspiration die for damage, and a free Unarmed Strike when you spend Bardic Inspiration.'],
    [6, 'Inspiring Movement', 'When an enemy ends its turn within 5 feet of you, use your Reaction and a Bardic Inspiration die: you move half your Speed and an ally within 30 feet moves too, without provoking Opportunity Attacks.'],
    [6, 'Tandem Footwork', 'When you roll Initiative, spend a Bardic Inspiration die: you and allies within 30 feet add it to Initiative.'],
    [14, 'Leading Evasion', 'On a Dexterity save for half damage you take none on a success and half on a failure, and creatures within 5 feet of you share the benefit.'],
  ] },
  { name: 'College of Glamour', className: 'Bard', description: 'Weave beguiling Feywild magic that charms and commands.', features: [
    [3, 'Beguiling Magic', 'Always have Charm Person and Mirror Image prepared. After you cast an Enchantment or Illusion spell, force a creature within 60 feet to make a Wisdom save or be Charmed or Frightened for 1 minute. Once per Long Rest, or spend Bardic Inspiration.'],
    [3, 'Mantle of Inspiration', 'As a Bonus Action spend Bardic Inspiration: several creatures within 60 feet gain Temporary Hit Points (twice the die) and can move with their Reaction without provoking Opportunity Attacks.'],
    [6, 'Mantle of Majesty', 'Always have Command prepared. As a Bonus Action cast it without a spell slot and take on an unearthly appearance for 1 minute, casting Command free as a Bonus Action each turn; creatures Charmed by you fail the save.'],
    [14, 'Unbreakable Majesty', 'As a Bonus Action, for 1 minute any creature that hits you with an attack roll must make a Charisma save or the attack misses.'],
  ] },
  { name: 'College of Lore', className: 'Bard', description: 'Collect knowledge and magical secrets from everywhere.', features: [
    [3, 'Bonus Proficiencies', 'Gain proficiency in three skills of your choice.'],
    [3, 'Cutting Words', 'When a creature within 60 feet makes an attack roll, ability check or damage roll, use your Reaction and a Bardic Inspiration die to subtract the roll from it.'],
    [6, 'Magical Discoveries', 'Learn two spells from the Cleric, Druid or Wizard lists. They are always prepared.'],
    [14, 'Peerless Skill', 'When you fail an ability check or miss an attack, spend Bardic Inspiration and add the die. If you still fail, the die is not spent.'],
  ] },
  { name: 'College of Valor', className: 'Bard', description: 'Sing the deeds of heroes and fight beside them with weapon and spell.', features: [
    [3, 'Combat Inspiration', 'A creature holding your Bardic Inspiration can add the die to a weapon damage roll, or use its Reaction to add it to its AC against one attack.'],
    [3, 'Martial Training', 'Proficiency with Martial weapons, Medium armor and Shields. You can use a weapon as a spellcasting focus.'],
    [6, 'Extra Attack', 'Attack twice when you take the Attack action, and you can replace one of those attacks with a cantrip.'],
    [14, 'Battle Magic', 'After you cast a spell with a casting time of an action, make one weapon attack as a Bonus Action.'],
  ] },

  // ──────────────────────────────── CLERIC ─────────────────────────────────
  { name: 'Life Domain', className: 'Cleric', description: 'Soothe the hurts of the world with unmatched healing.', features: [
    [3, 'Disciple of Life', 'When a spell you cast with a spell slot restores Hit Points, the target regains an extra 2 + the slot\'s level.'],
    [3, 'Life Domain Spells', 'Always prepared: Aid, Bless, Cure Wounds and Lesser Restoration, with more at Cleric levels 5, 7 and 9.'],
    [3, 'Preserve Life', 'Use Channel Divinity to restore Hit Points equal to five times your Cleric level, divided among Bloodied creatures within 30 feet (up to half their maximum).'],
    [6, 'Blessed Healer', 'When a spell slot spell of yours heals another creature, you regain 2 + the slot\'s level Hit Points.'],
    [17, 'Supreme Healing', 'When you would roll dice to restore Hit Points, use the highest number instead of rolling.'],
  ] },
  { name: 'Light Domain', className: 'Cleric', description: 'Bring light to banish darkness: radiance, fire and protective flares.', features: [
    [3, 'Light Domain Spells', 'Always prepared: Burning Hands, Faerie Fire, Scorching Ray and See Invisibility, with more at Cleric levels 5, 7 and 9.'],
    [3, 'Radiance of the Dawn', 'Use Channel Divinity to dispel magical darkness within 30 feet; creatures of your choice there make a Constitution save, taking 2d10 + Cleric level Radiant damage, or half on a success.'],
    [3, 'Warding Flare', 'When a creature within 30 feet attacks, use your Reaction to impose Disadvantage on the roll. Uses equal to your Wisdom modifier per Long Rest.'],
    [6, 'Improved Warding Flare', 'Warding Flare recharges on a Short Rest too, and the creature you protect gains Temporary Hit Points.'],
    [17, 'Corona of Light', 'As a Magic action, shed sunlight in a 60-foot aura for 1 minute. Enemies in it have Disadvantage on saves against your Radiance of the Dawn and spells that deal Fire or Radiant damage.'],
  ] },
  { name: 'Trickery Domain', className: 'Cleric', description: 'Make mischief and challenge authority with illusion and duplicity.', features: [
    [3, 'Blessing of the Trickster', 'As a Magic action, give yourself or a willing creature Advantage on Stealth checks until you finish a Long Rest.'],
    [3, 'Invoke Duplicity', 'Use Channel Divinity as a Bonus Action to create an illusory double within 30 feet for 1 minute. Cast spells from its space, move it as a Bonus Action, and gain Advantage on attacks when you and it are both near the target.'],
    [3, 'Trickery Domain Spells', 'Always prepared: Charm Person, Disguise Self, Invisibility and Pass without Trace, with more at Cleric levels 5, 7 and 9.'],
    [6, "Trickster's Transposition", 'When you create or move your double, you can teleport, swapping places with it.'],
    [17, 'Improved Duplicity', 'You and your allies have Advantage on attacks against creatures within 5 feet of the double, and when it ends a creature within 5 feet of it regains Hit Points equal to your Cleric level.'],
  ] },
  { name: 'War Domain', className: 'Cleric', description: 'Inspire valor and smite foes as a priest of battle.', features: [
    [3, 'Guided Strike', 'When you or an ally within 30 feet misses an attack, use Channel Divinity to add +10 to the roll (your Reaction, if it is an ally).'],
    [3, 'War Domain Spells', 'Always prepared: Guiding Bolt, Magic Weapon, Shield of Faith and Spiritual Weapon, with more at Cleric levels 5, 7 and 9.'],
    [3, 'War Priest', 'Make one weapon attack or Unarmed Strike as a Bonus Action. Uses equal to your Wisdom modifier per Short or Long Rest.'],
    [6, "War God's Blessing", 'Spend Channel Divinity to cast Shield of Faith or Spiritual Weapon without a spell slot and without Concentration, lasting 1 minute.'],
    [17, 'Avatar of Battle', 'Resistance to Bludgeoning, Piercing and Slashing damage.'],
  ] },

  // ───────────────────────────────── DRUID ─────────────────────────────────
  { name: 'Circle of the Land', className: 'Druid', description: 'Celebrate connection to the natural world, drawing magic from a chosen terrain.', features: [
    [3, 'Circle of the Land Spells', 'After each Long Rest choose Arid, Polar, Temperate or Tropical land. That land\'s spells are always prepared.'],
    [3, "Land's Aid", 'As a Magic action spend a Wild Shape use: a 10-foot sphere within 60 feet deals 2d6 Necrotic damage (Constitution save for half) to creatures you choose and heals one creature you choose 2d6. Grows with level.'],
    [6, 'Natural Recovery', 'Once per Long Rest cast one of your Circle spells without a slot, and on a Short Rest recover spell power (levels totalling up to half your Druid level).'],
    [10, "Nature's Ward", 'Immunity to the Poisoned condition, and resistance to a damage type set by your current land.'],
    [14, "Nature's Sanctuary", 'As a Magic action spend a Wild Shape use: a 15-foot cube of spectral trees and vines for 1 minute gives you and allies Half Cover and your Nature\'s Ward resistance.'],
  ] },
  { name: 'Circle of the Moon', className: 'Druid', description: 'Adopt powerful animal forms to guard the wilds.', features: [
    [3, 'Circle Forms', 'Your Wild Shape is stronger: Challenge Rating up to your Druid level divided by 3, AC of 13 + Wisdom modifier if that is higher, and Temporary Hit Points equal to three times your Druid level.'],
    [3, 'Circle of the Moon Spells', 'Always-prepared spells (including Cure Wounds, Moonbeam and Starry Wisp) that you can cast while in Wild Shape.'],
    [6, 'Improved Circle Forms', 'Your Wild Shape attacks can deal Radiant damage, and you add your Wisdom modifier to Constitution saves in beast form.'],
    [10, 'Moonlight Step', 'As a Bonus Action teleport up to 30 feet and gain Advantage on your next attack. Uses equal to your Wisdom modifier per Long Rest.'],
    [14, 'Lunar Form', 'Once per turn a Wild Shape attack deals an extra 2d10 Radiant damage, and Moonlight Step can bring one willing creature along.'],
  ] },
  { name: 'Circle of the Sea', className: 'Druid', description: 'Become one with tides and storms.', features: [
    [3, 'Circle of the Sea Spells', 'Always prepared: Fog Cloud, Gust of Wind, Ray of Frost, Shatter and Thunderwave, with more at Druid levels 5, 7 and 9.'],
    [3, 'Wrath of the Sea', 'As a Bonus Action spend a Wild Shape use: a 5-foot emanation of ocean spray surrounds you for 10 minutes. When it appears, and as a Bonus Action after, a creature in it makes a Constitution save or takes Cold damage and is pushed up to 15 feet.'],
    [6, 'Aquatic Affinity', 'The emanation grows to 10 feet and you gain a Swim Speed equal to your Speed.'],
    [10, 'Stormborn', 'While Wrath of the Sea is active you gain a Fly Speed and resistance to Cold, Lightning and Thunder damage.'],
    [14, 'Oceanic Gift', 'Place the emanation on a willing creature within 60 feet instead of yourself - or on both of you by spending two Wild Shape uses.'],
  ] },
  { name: 'Circle of the Stars', className: 'Druid', description: 'Harness secrets hidden in constellations.', features: [
    [3, 'Star Map', 'A star chart that serves as your focus. Guidance and Guiding Bolt are always prepared, and you cast Guiding Bolt without a slot a number of times equal to your Wisdom modifier per Long Rest.'],
    [3, 'Starry Form', 'As a Bonus Action spend a Wild Shape use to become luminous for 10 minutes and choose a constellation: Archer (a radiant ranged attack as a Bonus Action), Chalice (extra healing to a second creature when you heal with a slot) or Dragon (treat 9 or lower as 10 on Intelligence and Wisdom checks and Concentration saves).'],
    [6, 'Cosmic Omen', 'After a Long Rest roll a die for Weal or Woe. Use your Reaction to add (Weal) or subtract (Woe) 1d6 from a d20 Test made within 30 feet. Uses equal to your Wisdom modifier per Long Rest.'],
    [10, 'Twinkling Constellations', 'Archer and Chalice improve to 2d8, Dragon grants a hovering Fly Speed, and you can change constellation at the start of each turn.'],
    [14, 'Full of Stars', 'While in Starry Form you have resistance to Bludgeoning, Piercing and Slashing damage.'],
  ] },

  // ──────────────────────────────── FIGHTER ────────────────────────────────
  { name: 'Battle Master', className: 'Fighter', description: 'Master sophisticated battle maneuvers fueled by Superiority Dice.', features: [
    [3, 'Combat Superiority', 'Learn three maneuvers and gain four d8 Superiority Dice to fuel them, regained on a Short or Long Rest. You learn more maneuvers and gain more dice as you level.'],
    [3, 'Student of War', 'Proficiency with one type of Artisan\'s Tools and one more Fighter skill.'],
    [7, 'Know Your Enemy', 'As a Bonus Action learn a creature\'s Immunities, Resistances and Vulnerabilities. Once per Long Rest, or spend a Superiority Die.'],
    [10, 'Improved Combat Superiority', 'Your Superiority Dice become d10s.'],
    [15, 'Relentless', 'Once per turn use a maneuver by rolling a d8 instead of spending a Superiority Die.'],
    [18, 'Ultimate Combat Superiority', 'Your Superiority Dice become d12s.'],
  ], compositry: 'Maneuvers slot naturally into an Attack Chain: a Trip or Pushing attack can break a defender\'s ability to Dodge, and Riposte is a ready-made Counter-attack.' },
  { name: 'Champion', className: 'Fighter', description: 'Pursue physical excellence in combat: more critical hits and raw athleticism.', features: [
    [3, 'Improved Critical', 'Your weapon attacks and Unarmed Strikes score a Critical Hit on a roll of 19 or 20.'],
    [3, 'Remarkable Athlete', 'Advantage on Initiative rolls and Strength (Athletics) checks, and after a Critical Hit you can move half your Speed without provoking Opportunity Attacks.'],
    [7, 'Additional Fighting Style', 'Gain another Fighting Style feat.'],
    [10, 'Heroic Warrior', 'At the start of each of your turns in combat, gain Heroic Inspiration if you do not have it.'],
    [15, 'Superior Critical', 'You score a Critical Hit on a roll of 18, 19 or 20.'],
    [18, 'Survivor', 'Advantage on Death Saving Throws, and at the start of each turn you regain 5 + Constitution modifier Hit Points while Bloodied.'],
  ] },
  { name: 'Eldritch Knight', className: 'Fighter', description: 'Support combat skills with arcane magic.', features: [
    [3, 'Spellcasting', 'Cast Wizard spells using Intelligence.'],
    [3, 'War Bond', 'Bond with up to two weapons: you cannot be disarmed of them and can summon one to your hand as a Bonus Action.'],
    [7, 'War Magic', 'When you take the Attack action, replace one attack with a Wizard cantrip.'],
    [10, 'Eldritch Strike', 'A creature you hit with a weapon has Disadvantage on its next save against a spell you cast before the end of your next turn.'],
    [15, 'Arcane Charge', 'When you use Action Surge you can teleport up to 30 feet.'],
    [18, 'Improved War Magic', 'When you take the Attack action, replace two attacks with a level 1 or 2 Wizard spell.'],
  ], compositry: 'The natural Applied Thaumaturge. Treat the Eldritch Knight as a partial caster for Mana if your table wants its spellcasting to matter more.' },
  { name: 'Psi Warrior', className: 'Fighter', description: 'Augment physical might with psionic power.', features: [
    [3, 'Psionic Power', 'A pool of Psionic Energy Dice that fuel Protective Field (Reaction: reduce damage to you or an ally), Psionic Strike (extra Force damage once per turn) and Telekinetic Movement (move an object or creature up to 30 feet).'],
    [7, 'Telekinetic Adept', 'Psi-Powered Leap (a Bonus Action Fly Speed for the turn) and Telekinetic Thrust (a Psionic Strike target makes a Strength save or is knocked Prone or pushed 10 feet).'],
    [10, 'Guarded Mind', 'Resistance to Psychic damage, and spend a die at the start of your turn to end Charmed or Frightened on yourself.'],
    [15, 'Bulwark of Force', 'As a Bonus Action give several creatures within 30 feet Half Cover for 1 minute.'],
    [18, 'Telekinetic Master', 'Cast Telekinesis without a spell slot, and make one weapon attack as a Bonus Action each turn while concentrating on it.'],
  ] },

  // ───────────────────────────────── MONK ──────────────────────────────────
  { name: 'Warrior of Mercy', className: 'Monk', description: 'Manipulate the forces of life and death to heal or harm.', features: [
    [3, 'Hand of Harm', 'Once per turn when you hit with an Unarmed Strike, spend 1 Focus Point to deal extra Necrotic damage: one Martial Arts die + Wisdom modifier.'],
    [3, 'Hand of Healing', 'As a Magic action spend 1 Focus Point to restore one Martial Arts die + Wisdom modifier Hit Points. It can replace one strike of Flurry of Blows.'],
    [3, 'Implements of Mercy', 'Proficiency in Insight, Medicine and the Herbalism Kit.'],
    [6, "Physician's Touch", 'Hand of Harm can also Poison the target, and Hand of Healing can end Blinded, Deafened, Paralyzed, Poisoned or Stunned.'],
    [11, 'Flurry of Healing and Harm', 'Each Flurry of Blows strike can become a Hand of Healing at no Focus cost, and one Hand of Harm per Flurry is free. Uses equal to your Wisdom modifier per Long Rest.'],
    [17, 'Hand of Ultimate Mercy', 'As a Magic action spend 5 Focus Points to return a creature that died within 24 hours to life with 4d10 + Wisdom modifier Hit Points. Once per Long Rest.'],
  ] },
  { name: 'Warrior of Shadow', className: 'Monk', description: 'Harness shadow power for stealth and subterfuge.', features: [
    [3, 'Shadow Arts', 'Cast Darkness for 1 Focus Point (you can see through it and move it), gain Darkvision, and learn Minor Illusion.'],
    [6, 'Shadow Step', 'While in Dim Light or Darkness, teleport up to 60 feet to another dim or dark space as a Bonus Action and gain Advantage on your next melee attack.'],
    [11, 'Improved Shadow Step', 'Spend 1 Focus Point to use Shadow Step in any light, and make an Unarmed Strike right after teleporting.'],
    [17, 'Cloak of Shadows', 'As a Magic action spend 3 Focus Points: for 1 minute in Dim Light or Darkness you are Invisible, can move through occupied spaces, and use Flurry of Blows without spending Focus.'],
  ] },
  { name: 'Warrior of the Elements', className: 'Monk', description: 'Wield strikes and bursts of elemental power.', features: [
    [3, 'Elemental Attunement', 'Spend 1 Focus Point at the start of your turn: for 10 minutes your Unarmed Strikes reach 10 feet further, can deal Acid, Cold, Fire, Lightning or Thunder damage, and can push or pull the target 10 feet on a failed Strength save.'],
    [3, 'Manipulate Elements', 'You know the Elementalism cantrip.'],
    [6, 'Elemental Burst', 'As a Magic action spend 2 Focus Points: a 20-foot sphere within 120 feet deals three Martial Arts dice of elemental damage (Dexterity save for half).'],
    [11, 'Stride of the Elements', 'While Elemental Attunement is active you have a Fly Speed and Swim Speed equal to your Speed.'],
    [17, 'Elemental Epitome', 'While attuned: resistance to one elemental damage type, faster and damaging Step of the Wind, and once per turn an extra Martial Arts die of elemental damage.'],
  ], compositry: 'A close cousin of Applied Thaumaturgy: an elemental Unarmed Strike reads naturally as an Aspectual Component routed through the body.' },
  { name: 'Warrior of the Open Hand', className: 'Monk', description: 'Master unarmed combat techniques: push, topple and deny reactions.', features: [
    [3, 'Open Hand Technique', 'When a Flurry of Blows strike hits, impose one effect: Addle (no Opportunity Attacks until its next turn), Push (Strength save or pushed 15 feet) or Topple (Dexterity save or Prone).'],
    [6, 'Wholeness of Body', 'As a Bonus Action regain one Martial Arts die + Wisdom modifier Hit Points. Uses equal to your Wisdom modifier per Long Rest.'],
    [11, 'Fleet Step', 'When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind.'],
    [17, 'Quivering Palm', 'Spend 4 Focus Points when you hit with an Unarmed Strike to set lethal vibrations. Later, end them with an action: the target makes a Constitution save, taking 10d12 Force damage, or half on a success.'],
  ] },

  // ──────────────────────────────── PALADIN ────────────────────────────────
  { name: 'Oath of Devotion', className: 'Paladin', description: 'Uphold the ideals of justice and order.', features: [
    [3, 'Oath of Devotion Spells', 'Always prepared: Protection from Evil and Good and Shield of Faith, with more at Paladin levels 5, 9, 13 and 17.'],
    [3, 'Sacred Weapon', 'When you take the Attack action spend Channel Divinity: for 10 minutes one weapon adds your Charisma modifier to attack rolls, sheds light, and can deal Radiant damage.'],
    [7, 'Aura of Devotion', 'You and allies in your Aura of Protection are immune to the Charmed condition.'],
    [15, 'Smite of Protection', 'When you cast Divine Smite, you and allies in your aura have Half Cover until the start of your next turn.'],
    [20, 'Holy Nimbus', 'As a Bonus Action, for 10 minutes: Advantage on saves forced by Fiends and Undead, enemies that start their turn in your aura take Radiant damage, and the aura is sunlight. Once per Long Rest, or spend a level 5 slot.'],
  ] },
  { name: 'Oath of Glory', className: 'Paladin', description: 'Strive for the heights of heroism.', features: [
    [3, 'Inspiring Smite', 'After casting Divine Smite, spend Channel Divinity as a Bonus Action to share out 2d8 + Paladin level Temporary Hit Points among creatures within 30 feet.'],
    [3, 'Oath of Glory Spells', 'Always prepared: Guiding Bolt and Heroism, with more at Paladin levels 5, 9, 13 and 17.'],
    [3, 'Peerless Athlete', 'Spend Channel Divinity as a Bonus Action: for 1 hour, Advantage on Athletics and Acrobatics checks and longer jumps.'],
    [7, 'Aura of Alacrity', 'Your Speed increases by 10 feet, and allies who start their turn in your aura gain the same until the end of their next turn.'],
    [15, 'Glorious Defense', 'When you or an ally within 10 feet is hit, use your Reaction to add your Charisma modifier to AC; if the attack then misses, you can attack the attacker. Uses equal to your Charisma modifier per Long Rest.'],
    [20, 'Living Legend', 'As a Bonus Action, for 10 minutes: Advantage on Charisma checks, turn one missed attack per turn into a hit, and reroll failed saves with your Reaction. Once per Long Rest, or spend a level 5 slot.'],
  ] },
  { name: 'Oath of the Ancients', className: 'Paladin', description: 'Preserve life and light in the world.', features: [
    [3, "Nature's Wrath", 'As a Magic action spend Channel Divinity: spectral vines Restrain creatures of your choice within 15 feet for 1 minute on a failed Strength save.'],
    [3, 'Oath of the Ancients Spells', 'Always prepared: Ensnaring Strike and Speak with Animals, with more at Paladin levels 5, 9, 13 and 17.'],
    [7, 'Aura of Warding', 'You and allies in your Aura of Protection have resistance to Necrotic, Psychic and Radiant damage.'],
    [15, 'Undying Sentinel', 'When you would drop to 0 Hit Points and are not killed outright, drop to 1 instead and regain Hit Points equal to three times your Paladin level. Once per Long Rest.'],
    [20, 'Elder Champion', 'As a Bonus Action, for 1 minute: regain 10 Hit Points each turn, cast Paladin spells that take an action as a Bonus Action, and enemies within 10 feet have Disadvantage on saves against your spells. Once per Long Rest, or spend a level 5 slot.'],
  ], compositry: 'A natural fit for a nature-rooted campaign: Flora Components and defensive infusions suit the oath.' },
  { name: 'Oath of Vengeance', className: 'Paladin', description: 'Punish evildoers at any cost.', features: [
    [3, 'Oath of Vengeance Spells', 'Always prepared: Bane and Hunter\'s Mark, with more at Paladin levels 5, 9, 13 and 17.'],
    [3, 'Vow of Enmity', 'When you take the Attack action spend Channel Divinity: Advantage on attack rolls against one creature within 30 feet for 1 minute. You can transfer the vow if it drops to 0 Hit Points.'],
    [7, 'Relentless Avenger', 'When you hit with an Opportunity Attack, reduce the target\'s Speed to 0 and move up to half your Speed without provoking.'],
    [15, 'Soul of Vengeance', 'When the target of your Vow of Enmity makes an attack, use your Reaction to make a melee attack against it.'],
    [20, 'Avenging Angel', 'As a Bonus Action, for 10 minutes: a Fly Speed of 60 feet and an aura that Frightens enemies on a failed Wisdom save. Once per Long Rest, or spend a level 5 slot.'],
  ] },

  // ──────────────────────────────── RANGER ─────────────────────────────────
  { name: 'Beast Master', className: 'Ranger', description: 'Bond with a primal beast that fights beside you.', features: [
    [3, 'Primal Companion', 'Summon a Beast of the Land, Sea or Sky. It acts on your turn and obeys your commands (a Bonus Action, or give up one of your attacks). You can revive it with a spell slot.'],
    [7, 'Exceptional Training', 'When you command the beast it can also Dash, Disengage, Dodge or Help as a Bonus Action, and its attacks can deal Force damage.'],
    [11, 'Bestial Fury', 'The beast attacks twice when commanded, and once per turn deals your Hunter\'s Mark bonus damage.'],
    [15, 'Share Spells', 'When you cast a spell on yourself, it can also affect the beast if it is within 30 feet.'],
  ] },
  { name: 'Fey Wanderer', className: 'Ranger', description: 'Wield fey mirth and fury.', features: [
    [3, 'Dreadful Strikes', 'Once per turn a weapon hit deals an extra 1d4 Psychic damage (1d6 from level 11).'],
    [3, 'Fey Wanderer Spells', 'Always prepared: Charm Person, with Misty Step and more at Ranger levels 5, 9, 13 and 17.'],
    [3, 'Otherworldly Glamour', 'Add your Wisdom modifier to Charisma checks, and gain proficiency in Deception, Performance or Persuasion.'],
    [7, 'Beguiling Twist', 'Advantage on saves against Charmed and Frightened. When a creature within 120 feet succeeds on such a save, use your Reaction to Charm or Frighten a different creature on a failed Wisdom save.'],
    [11, 'Fey Reinforcements', 'Summon Fey is always prepared; cast it once per Long Rest without a slot, optionally for 1 minute without Concentration.'],
    [15, 'Misty Wanderer', 'Cast Misty Step without a slot a number of times equal to your Wisdom modifier per Long Rest, bringing one willing creature along.'],
  ] },
  { name: 'Gloom Stalker', className: 'Ranger', description: 'Draw on shadow magic to fight in the dark.', features: [
    [3, 'Dread Ambusher', 'Add your Wisdom modifier to Initiative, move 10 feet faster on your first turn, and deal an extra 2d6 Psychic damage on a weapon hit (once per turn, Wisdom modifier times per Long Rest).'],
    [3, 'Gloom Stalker Spells', 'Always prepared: Disguise Self, with Rope Trick and more at Ranger levels 5, 9, 13 and 17.'],
    [3, 'Umbral Sight', 'Gain or extend Darkvision, and you are Invisible to creatures that rely on Darkvision to see you in Darkness.'],
    [7, 'Iron Mind', 'Proficiency in Wisdom saving throws.'],
    [11, "Stalker's Flurry", 'Dread Ambusher\'s damage becomes 2d8, and using it also grants Sudden Strike (another attack against a different nearby creature) or Mass Fear (creatures within 10 feet of the target are Frightened on a failed Wisdom save).'],
    [15, 'Shadowy Dodge', 'When a creature attacks you, use your Reaction to impose Disadvantage, then teleport up to 30 feet.'],
  ] },
  { name: 'Hunter', className: 'Ranger', description: 'Protect nature and people from destruction with focused hunting techniques.', features: [
    [3, "Hunter's Lore", 'While a creature is marked by your Hunter\'s Mark, you know its Immunities, Resistances and Vulnerabilities.'],
    [3, "Hunter's Prey", 'Choose Colossus Slayer (once per turn, +1d8 damage to a creature missing Hit Points) or Horde Breaker (once per turn, another attack against a different creature within 5 feet of the first). Swap on a rest.'],
    [7, 'Defensive Tactics', 'Choose Escape the Horde (Opportunity Attacks against you have Disadvantage) or Multiattack Defense (a creature that hits you has Disadvantage on its other attacks against you this turn).'],
    [11, "Superior Hunter's Prey", 'Once per turn when you deal Hunter\'s Mark damage, deal the same extra damage to a second creature within 30 feet.'],
    [15, "Superior Hunter's Defense", 'When you take damage, use your Reaction to gain resistance to that damage type until the end of the turn.'],
  ] },

  // ───────────────────────────────── ROGUE ─────────────────────────────────
  { name: 'Arcane Trickster', className: 'Rogue', description: 'Enhance stealth with arcane spells.', features: [
    [3, 'Spellcasting', 'Cast Wizard spells using Intelligence.'],
    [3, 'Mage Hand Legerdemain', 'Your Mage Hand is Invisible, is controlled with a Bonus Action, and can perform Sleight of Hand tasks.'],
    [9, 'Magical Ambush', 'If you are hidden from a creature when you cast a spell on it, it has Disadvantage on its save.'],
    [13, 'Versatile Trickster', 'When you use the Trip option of Cunning Strike, you can also trip another creature within 5 feet of your Mage Hand.'],
    [17, 'Spell Thief', 'When a spell targets you, use your Reaction to force the caster to make an Intelligence save. On a failure the spell has no effect on you and you steal it for 8 hours. Once per Long Rest.'],
  ] },
  { name: 'Assassin', className: 'Rogue', description: 'Practice the grim art of death.', features: [
    [3, 'Assassinate', 'Advantage on Initiative rolls. In the first round you have Advantage against creatures that have not acted yet, and a Sneak Attack hit then deals extra damage equal to your Rogue level.'],
    [3, "Assassin's Tools", 'A Disguise Kit and a Poisoner\'s Kit, and proficiency with both.'],
    [9, 'Infiltration Expertise', 'Mimic another person\'s speech and handwriting after an hour of study, and Steady Aim no longer reduces your Speed to 0.'],
    [13, 'Envenom Weapons', 'When the Poison option of Cunning Strike succeeds, the target also takes 2d6 Poison damage that ignores Resistance.'],
    [17, 'Death Strike', 'When your first-round Sneak Attack hits, the target makes a Constitution save or the attack\'s damage is doubled.'],
  ] },
  { name: 'Soulknife', className: 'Rogue', description: 'Strike foes with blades of psionic energy.', features: [
    [3, 'Psionic Power', 'A pool of Psionic Energy Dice that fuel Psi-Bolstered Knack (add a die to a failed check) and Psychic Whispers (telepathy with several creatures for hours).'],
    [3, 'Psychic Blades', 'Manifest a blade of psychic energy when you attack: 1d6 Psychic damage, Finesse, Thrown (60/120). A second blade as a Bonus Action deals 1d4.'],
    [9, 'Soul Blades', 'Homing Strikes (add a die to a missed attack) and Psychic Teleportation (throw a blade and teleport to it as a Bonus Action).'],
    [13, 'Psychic Veil', 'As a Magic action become Invisible for 1 hour or until you deal damage or force a save. Once per Long Rest, or spend a die.'],
    [17, 'Rend Mind', 'When your Psychic Blades deal Sneak Attack damage, force a Wisdom save or the target is Stunned for 1 minute. Once per Long Rest, or spend three dice.'],
  ] },
  { name: 'Thief', className: 'Rogue', description: 'Hunt for treasure as a classic adventurer and burglar.', features: [
    [3, 'Fast Hands', 'As a Bonus Action make a Sleight of Hand check, use Thieves\' Tools, or take the Utilize action.'],
    [3, 'Second-Story Work', 'A Climb Speed equal to your Speed, and your jump distance uses Dexterity.'],
    [9, 'Supreme Sneak', 'A new Cunning Strike option, Stealth Attack: stay hidden after attacking if you end the turn behind cover.'],
    [13, 'Use Magic Device', 'Attune to four magic items, sometimes use an item without spending its charges, and use any Spell Scroll.'],
    [17, "Thief's Reflexes", 'Take two turns in the first round of combat: one at your Initiative and one at your Initiative minus 10.'],
  ] },

  // ─────────────────────────────── SORCERER ────────────────────────────────
  { name: 'Aberrant Sorcery', className: 'Sorcerer', description: 'Wield unnatural psionic power.', features: [
    [3, 'Psionic Spells', 'Always prepared: Arms of Hadar, Calm Emotions, Detect Thoughts, Dissonant Whispers and Mind Sliver, with more at Sorcerer levels 5, 7 and 9.'],
    [3, 'Telepathic Speech', 'As a Bonus Action form a telepathic link with a creature within 30 feet; you can speak mind to mind over miles for a number of minutes equal to your Sorcerer level.'],
    [6, 'Psionic Sorcery', 'Cast your Psionic Spells by spending Sorcery Points equal to the spell\'s level, with no Verbal or Somatic components.'],
    [6, 'Psychic Defenses', 'Resistance to Psychic damage and Advantage on saves against Charmed and Frightened.'],
    [14, 'Revelation in Flesh', 'As a Bonus Action spend Sorcery Points for 10 minutes each: a hovering Fly Speed, a Swim Speed and water breathing, sight of Invisible creatures, or the ability to squeeze through tiny gaps.'],
    [18, 'Warping Implosion', 'As a Magic action teleport up to 120 feet; creatures within 30 feet of where you left take 3d10 Force damage and are pulled in (Strength save for half). Once per Long Rest, or spend 5 Sorcery Points.'],
  ] },
  { name: 'Clockwork Sorcery', className: 'Sorcerer', description: 'Channel cosmic forces of order.', features: [
    [3, 'Clockwork Spells', 'Always prepared: Aid, Alarm, Lesser Restoration and Protection from Evil and Good, with more at Sorcerer levels 5, 7 and 9.'],
    [3, 'Restore Balance', 'When a creature within 60 feet is about to roll with Advantage or Disadvantage, use your Reaction to cancel it. Uses equal to your Charisma modifier per Long Rest.'],
    [6, 'Bastion of Law', 'As a Magic action spend 1 to 5 Sorcery Points to ward a creature with that many d8s, which it can spend to reduce damage it takes.'],
    [14, 'Trance of Order', 'As a Bonus Action, for 1 minute attacks against you cannot have Advantage and you treat a roll of 9 or lower as 10 on d20 Tests. Once per Long Rest, or spend 5 Sorcery Points.'],
    [18, 'Clockwork Cavalcade', 'As a Magic action, in a 30-foot cube: restore 100 Hit Points divided as you choose, repair damaged objects, and end spells of level 6 or lower. Once per Long Rest, or spend 7 Sorcery Points.'],
  ] },
  { name: 'Draconic Sorcery', className: 'Sorcerer', description: 'Breathe the magic of dragons.', features: [
    [3, 'Draconic Resilience', 'Your Hit Point maximum increases by 3, and by 1 more at each Sorcerer level. Without armor your AC is 10 + Dexterity modifier + Charisma modifier.'],
    [3, 'Draconic Spells', 'Always prepared: Alter Self, Chromatic Orb, Command and Dragon\'s Breath, with more at Sorcerer levels 5, 7 and 9.'],
    [6, 'Elemental Affinity', 'Choose Acid, Cold, Fire, Lightning or Poison: you have resistance to it, and add your Charisma modifier to one damage roll of spells that deal it.'],
    [14, 'Dragon Wings', 'As a Bonus Action sprout wings for 1 hour: a Fly Speed of 60 feet. Once per Long Rest, or spend 3 Sorcery Points.'],
    [18, 'Dragon Companion', 'Summon Dragon is always prepared; cast it once per Long Rest without a slot, optionally for 1 minute without Concentration.'],
  ] },
  { name: 'Wild Magic Sorcery', className: 'Sorcerer', description: 'Unleash chaotic magic.', features: [
    [3, 'Wild Magic Surge', 'Once per turn after you cast a Sorcerer spell with a spell slot, roll a d20. On a 20, roll on the Wild Magic Surge table.'],
    [3, 'Tides of Chaos', 'Gain Advantage on one d20 Test. Once per Long Rest - but your next slot spell then surges automatically and restores this feature.'],
    [6, 'Bend Luck', 'When another creature makes a d20 Test, use your Reaction and 1 Sorcery Point to add or subtract 1d4.'],
    [14, 'Controlled Chaos', 'When you roll on the Wild Magic Surge table, roll twice and choose.'],
    [18, 'Tamed Surge', 'After casting a Sorcerer spell with a spell slot, choose a Wild Magic Surge effect instead of rolling. Once per Long Rest.'],
  ], compositry: 'Pairs well with Circuit Stability: a failed Stability Check is a ready excuse for a surge instead of a plain Backwash.' },

  // ──────────────────────────────── WARLOCK ────────────────────────────────
  { name: 'Archfey Patron', className: 'Warlock', description: 'Bargain with whimsical fey.', features: [
    [3, 'Archfey Spells', 'Always prepared: Calm Emotions, Faerie Fire, Misty Step, Phantasmal Force and Sleep, with more at Warlock levels 5, 7 and 9.'],
    [3, 'Steps of the Fey', 'Cast Misty Step without a slot a number of times equal to your Charisma modifier per Long Rest, adding Refreshing Step (Temporary Hit Points) or Taunting Step (nearby creatures have Disadvantage attacking anyone but you).'],
    [6, 'Misty Escape', 'Cast Misty Step as a Reaction when you take damage. New options: Disappearing Step (Invisible until your next turn) and Dreadful Step (Psychic damage to creatures near where you left or arrive).'],
    [10, 'Beguiling Defenses', 'Immunity to Charmed. When an attack hits you, use your Reaction to halve the damage and force the attacker to make a Wisdom save or take Psychic damage equal to what you took.'],
    [14, 'Bewitching Magic', 'After you cast an Enchantment or Illusion spell with an action and a spell slot, cast Misty Step for free as part of the same action.'],
  ] },
  { name: 'Celestial Patron', className: 'Warlock', description: 'Call on the power of the heavens.', features: [
    [3, 'Celestial Spells', 'Always prepared: Aid, Cure Wounds, Guiding Bolt, Lesser Restoration, Light and Sacred Flame, with more at Warlock levels 5, 7 and 9.'],
    [3, 'Healing Light', 'A pool of d6s equal to 1 + your Warlock level. As a Bonus Action heal a creature within 60 feet, spending up to your Charisma modifier in dice.'],
    [6, 'Radiant Soul', 'Resistance to Radiant damage, and once per turn add your Charisma modifier to the Radiant or Fire damage a spell deals to one target.'],
    [10, 'Celestial Resilience', 'Gain Temporary Hit Points when you use Magical Cunning or finish a rest, and give up to five other creatures half as many.'],
    [14, 'Searing Vengeance', 'When you or an ally within 60 feet would make a Death Saving Throw, they instead regain half their Hit Points, stand, and blast enemies within 30 feet with Radiant damage and the Blinded condition. Once per Long Rest.'],
  ] },
  { name: 'Fiend Patron', className: 'Warlock', description: 'Make a deal with the Lower Planes.', features: [
    [3, "Dark One's Blessing", 'When you reduce an enemy to 0 Hit Points, gain Temporary Hit Points equal to your Charisma modifier + Warlock level.'],
    [3, 'Fiend Spells', 'Always prepared: Burning Hands, Command, Scorching Ray and Suggestion, with more at Warlock levels 5, 7 and 9.'],
    [6, "Dark One's Own Luck", 'Add 1d10 to an ability check or saving throw. Uses equal to your Charisma modifier per Long Rest.'],
    [10, 'Fiendish Resilience', 'After a rest choose one damage type other than Force: you have resistance to it.'],
    [14, 'Hurl Through Hell', 'Once per turn when you hit with an attack, the target makes a Charisma save or vanishes through the Lower Planes until the end of your next turn, taking 8d10 Psychic damage. Once per Long Rest, or spend a spell slot.'],
  ] },
  { name: 'Great Old One Patron', className: 'Warlock', description: 'Unearth forbidden lore of ineffable beings.', features: [
    [3, 'Awakened Mind', 'As a Bonus Action form a telepathic link with a creature within 30 feet, lasting minutes equal to your Warlock level over a range of miles.'],
    [3, 'Great Old One Spells', 'Always prepared: Detect Thoughts, Dissonant Whispers, Phantasmal Force and Tasha\'s Hideous Laughter, with more at Warlock levels 5, 7 and 9.'],
    [3, 'Psychic Spells', 'Change the damage type of your Warlock spells to Psychic, and cast your Enchantment and Illusion spells without Verbal or Somatic components.'],
    [6, 'Clairvoyant Combatant', 'When you form an Awakened Mind bond, force a Wisdom save: on a failure the creature has Disadvantage on attacks against you and you have Advantage against it.'],
    [10, 'Eldritch Hex', 'Hex is always prepared, and its target has Disadvantage on saving throws of the ability you chose.'],
    [10, 'Thought Shield', 'Your thoughts cannot be read, you have resistance to Psychic damage, and a creature that deals Psychic damage to you takes the same amount.'],
    [14, 'Create Thrall', 'Summon Aberration is always prepared; cast it without Concentration, and the Aberration gains Temporary Hit Points and deals extra Psychic damage to your Hex target.'],
  ] },

  // ──────────────────────────────── WIZARD ─────────────────────────────────
  { name: 'Abjurer', className: 'Wizard', description: 'Shield companions and banish foes.', features: [
    [3, 'Abjuration Savant', 'Add two Abjuration spells of level 2 or lower to your spellbook for free, and one more each time you gain a new level of spell slots.'],
    [3, 'Arcane Ward', 'When you cast an Abjuration spell with a slot, create a ward with Hit Points equal to twice your Wizard level + Intelligence modifier. It absorbs damage you take and recharges when you cast Abjuration spells.'],
    [6, 'Projected Ward', 'When a creature within 30 feet takes damage, use your Reaction to have your Arcane Ward absorb it.'],
    [10, 'Spell Breaker', 'Counterspell and Dispel Magic are always prepared. Cast Dispel Magic as a Bonus Action, add your Proficiency Bonus to its check, and keep the slot if either spell fails.'],
    [14, 'Spell Resistance', 'Advantage on saving throws against spells, and resistance to the damage of spells.'],
  ], compositry: 'Arcane Ward works like a standing defensive infusion - a good model for Reinforcement that protects others.' },
  { name: 'Diviner', className: 'Wizard', description: 'Learn the secrets of the multiverse.', features: [
    [3, 'Divination Savant', 'Add two Divination spells of level 2 or lower to your spellbook for free, and one more each time you gain a new level of spell slots.'],
    [3, 'Portent', 'After a Long Rest roll two d20s and keep the results. Once per turn, replace any d20 Test made by a creature you can see with one of them, before the roll.'],
    [6, 'Expert Divination', 'When you cast a Divination spell of level 2 or higher with a slot, regain a lower-level slot (level 5 at most).'],
    [10, 'The Third Eye', 'As a Bonus Action gain one benefit until your next rest: Darkvision out to 120 feet, the ability to read any language, or casting See Invisibility without a slot.'],
    [14, 'Greater Portent', 'Roll three d20s for Portent instead of two.'],
  ], compositry: 'A Diviner excels at Read the Circuit (Arcana vs. DC 10 + Potency) and can spend a Portent die on an enemy\'s Circuit Stability Check.' },
  { name: 'Evoker', className: 'Wizard', description: 'Create explosive elemental effects.', features: [
    [3, 'Evocation Savant', 'Add two Evocation spells of level 2 or lower to your spellbook for free, and one more each time you gain a new level of spell slots.'],
    [3, 'Potent Cantrip', 'Your damaging cantrips deal half damage on a miss or a successful save.'],
    [6, 'Sculpt Spells', 'When you cast an Evocation spell, choose 1 + the spell\'s level creatures: they automatically succeed on the save and take no damage.'],
    [10, 'Empowered Evocation', 'Add your Intelligence modifier to one damage roll of any Wizard Evocation spell you cast.'],
    [14, 'Overchannel', 'When you cast a Wizard spell of level 1-5 with a slot, deal maximum damage. Using it again before a Long Rest deals Necrotic damage to you.'],
  ] },
  { name: 'Illusionist', className: 'Wizard', description: 'Weave subtle spells of deception.', features: [
    [3, 'Illusion Savant', 'Add two Illusion spells of level 2 or lower to your spellbook for free, and one more each time you gain a new level of spell slots.'],
    [3, 'Improved Illusions', 'Cast Illusion spells without Verbal components and at 60 feet greater range. You know Minor Illusion, can create a sound and an image with one casting, and cast it as a Bonus Action.'],
    [6, 'Phantasmal Creatures', 'Summon Beast and Summon Fey are always prepared. Cast each once per Long Rest without a slot as an illusory creature with half the usual Hit Points.'],
    [10, 'Illusory Self', 'When an attack roll hits you, use your Reaction to make it miss with an illusory duplicate. Once per Short or Long Rest, or spend a level 2+ slot.'],
    [14, 'Illusory Reality', 'When you cast an Illusion spell with a slot, make one inanimate, nonmagical object in it real for 1 minute as a Bonus Action.'],
  ], compositry: 'False Route (the Arcane Feint, 1 Mana) is the Illusionist\'s home ground: lighting the wrong Tendril route before switching.' },
];
