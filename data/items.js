/**
 * ════════════════════════════════════════════════════════════════════════════
 *  ITEMS & WEAPONS  -  weapons, armor, gear, magic items and Catalysts
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Everything on the "Items & Weapons" page comes from this file (plus
 *  anything added through the DM page on the website).
 *
 *  ─── TO ADD AN ITEM ────────────────────────────────────────────────────────
 *  1. Copy the TEMPLATE block below.
 *  2. Paste it anywhere inside the big [ ... ] list (the site sorts by name).
 *  3. Fill it in and save. Refresh the browser. No restart needed.
 *  4. Optional: run  `npm run check-data`  to check for typos.
 *
 *  ─── TEMPLATE ──────────────────────────────────────────────────────────────
 *  Only name, category and description are required. Leave out what you don't need.
 *
 *    {
 *      id: 'my-item',                 // unique, lowercase, dashes. Optional - made from the name.
 *      name: 'My Item',
 *      category: 'Weapon',            // Weapon, Armor, Item, Adventuring Gear, Tool, Consumable, Magic Item, Catalyst
 *      hidden: true,                  // true = only the DM sees it until it is published on the DM page
 *      rarity: 'Mundane',             // Mundane, Common, Uncommon, Rare, Very Rare, Legendary, Artifact
 *      cost: '15 GP',
 *      weight: '3 lb.',
 *      attunement: false,             // true if it needs attunement
 *      damage: '1d8 slashing',        // weapons
 *      properties: ['Versatile (1d10)'],   // weapons
 *      mastery: 'Sap',                // weapons: 2024 Weapon Mastery
 *      armorClass: '16',              // armor and shields (text shown to the player)
 *      acBonus: 1,                    // added to Armor Class automatically while the item is in use
 *      saveBonus: 1,                  // added to every saving throw automatically while the item is in use
 *      chainTrait: '+1 maximum Chain Length.',   // Arcane Compositry: what it does in an Attack Chain (codex p.23)
 *      capacity: '50',                // Catalysts: Mana it can store
 *      throughput: '5',               // Catalysts: Mana it can route in one invocation
 *      description: `What it is and what it does.`,
 *      tags: ['martial', 'melee'],    // free-form search keywords
 *      source: 'SRD 5.2',
 *    },
 *
 *  (The categories and rarities are listed in shared/rules/constants.js -
 *   add a new one there and it appears in the filters.)
 *
 *  When a player presses "Add to character": weapons go into the sheet's
 *  Weapons & Attacks table (with their Chain trait); everything else goes into
 *  the sheet's Inventory, where it can be ticked "In use" (and "Attuned" if it
 *  needs attunement). acBonus and saveBonus only count while the item is in use.
 *
 *  The examples below use statistics from the System Reference Document 5.2
 *  (CC-BY-4.0). The "chainTrait" lines are the optional weapon hooks from
 *  codex page 23. Edit or delete anything freely.
 * ════════════════════════════════════════════════════════════════════════════
 */
export default [
  // ─────────────────────────────── WEAPONS ─────────────────────────────────
  {
    name: 'Dagger', category: 'Weapon', cost: '2 GP', weight: '1 lb.',
    damage: '1d4 piercing', properties: ['Finesse', 'Light', 'Thrown (20/60)'], mastery: 'Nick',
    chainTrait: '+1 maximum Chain Length.',
    description: `A simple melee weapon. Quick enough to keep a Chain going one strike longer than heavier blades.`,
    tags: ['simple', 'melee', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'Quarterstaff', category: 'Weapon', cost: '2 SP', weight: '4 lb.',
    damage: '1d6 bludgeoning', properties: ['Versatile (1d8)'], mastery: 'Topple',
    description: `A simple melee weapon, and a common mount for a Catalyst.`,
    tags: ['simple', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Spear', category: 'Weapon', cost: '1 GP', weight: '3 lb.',
    damage: '1d6 piercing', properties: ['Thrown (20/60)', 'Versatile (1d8)'], mastery: 'Sap',
    chainTrait: 'A 5-ft Perfect Dodge does not automatically escape its reach.',
    description: `A simple melee weapon with the reach to keep pressure on a retreating defender.`,
    tags: ['simple', 'melee', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'Shortbow', category: 'Weapon', cost: '25 GP', weight: '2 lb.',
    damage: '1d6 piercing', properties: ['Ammunition (80/320; Arrow)', 'Two-Handed'], mastery: 'Vex',
    description: `A simple ranged weapon. Successful ranged attack rolls can build your Momentum Die.`,
    tags: ['simple', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Rapier', category: 'Weapon', cost: '25 GP', weight: '2 lb.',
    damage: '1d8 piercing', properties: ['Finesse'], mastery: 'Vex',
    chainTrait: '+2 on attempts to achieve a Perfect Parry.',
    description: `A martial melee weapon favored by duelists who turn defense into Counter-attacks.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Longsword', category: 'Weapon', cost: '15 GP', weight: '3 lb.',
    damage: '1d8 slashing', properties: ['Versatile (1d10)'], mastery: 'Sap',
    chainTrait: 'Reroll one failed Parry per enemy Chain.',
    description: `A martial melee weapon: balanced, reliable, and forgiving in defense.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Warhammer', category: 'Weapon', cost: '15 GP', weight: '5 lb.',
    damage: '1d8 bludgeoning', properties: ['Versatile (1d10)'], mastery: 'Push',
    chainTrait: 'Blocking its heaviest strikes may cost +1 Guard.',
    description: `A martial melee weapon whose weight drains a defender's Guard.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Greatsword', category: 'Weapon', cost: '50 GP', weight: '6 lb.',
    damage: '2d6 slashing', properties: ['Heavy', 'Two-Handed'], mastery: 'Graze',
    chainTrait: '+2 damage for each previous hit in the current Chain.',
    description: `A martial melee weapon that hits harder the longer a Chain runs.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Greataxe', category: 'Weapon', cost: '30 GP', weight: '7 lb.',
    damage: '1d12 slashing', properties: ['Heavy', 'Two-Handed'], mastery: 'Cleave',
    chainTrait: 'Halve mundane Block reduction against its strikes.',
    description: `A martial melee weapon that shears through shields and raised guards.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },

  // ─────────────────────────────── ARMOR ───────────────────────────────────
  {
    name: 'Leather Armor', category: 'Armor', cost: '10 GP', weight: '10 lb.', armorClass: '11 + Dex modifier',
    description: `Light armor. One minute to don or doff.`,
    tags: ['light armor'], source: 'SRD 5.2',
  },
  {
    name: 'Chain Shirt', category: 'Armor', cost: '50 GP', weight: '20 lb.', armorClass: '13 + Dex modifier (max 2)',
    description: `Medium armor worn between layers of clothing or leather.`,
    tags: ['medium armor'], source: 'SRD 5.2',
  },
  {
    name: 'Chain Mail', category: 'Armor', cost: '75 GP', weight: '55 lb.', armorClass: '16',
    description: `Heavy armor. Requires Strength 13. Disadvantage on Dexterity (Stealth) checks.`,
    tags: ['heavy armor'], source: 'SRD 5.2',
  },
  {
    name: 'Plate Armor', category: 'Armor', cost: '1,500 GP', weight: '65 lb.', armorClass: '18',
    description: `Heavy armor. Requires Strength 15. Disadvantage on Dexterity (Stealth) checks.`,
    tags: ['heavy armor'], source: 'SRD 5.2',
  },
  {
    name: 'Shield', category: 'Armor', cost: '10 GP', weight: '6 lb.', armorClass: '+2', acBonus: 2,
    chainTrait: '+1 maximum Guard and improved Block options (Block reduces 1d8 + STR modifier).',
    description: `Carried in one hand. Adds +2 to Armor Class, and in Arcane Compositry it is the best tool for the Block active defense.`,
    tags: ['shield', 'block'], source: 'SRD 5.2',
  },

  // ─────────────────────────── GEAR & CONSUMABLES ──────────────────────────
  {
    name: 'Rope (50 feet)', category: 'Adventuring Gear', cost: '1 GP', weight: '5 lb.',
    description: `As a Utilize action, you can tie a knot with a successful DC 10 Dexterity (Sleight of Hand) check. The rope can be burst with a successful DC 20 Strength (Athletics) check.

A natural source of the Fiber Component when you want the Environmental discount.`,
    tags: ['utility', 'fiber'], source: 'SRD 5.2',
  },
  {
    name: 'Torch', category: 'Adventuring Gear', cost: '1 CP', weight: '1 lb.',
    description: `Burns for 1 hour, shedding Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. An attack with a burning torch deals 1 Fire damage.`,
    tags: ['light', 'fire'], source: 'SRD 5.2',
  },
  {
    name: "Healer's Kit", category: 'Adventuring Gear', cost: '5 GP', weight: '3 lb.',
    description: `Ten uses. As a Utilize action, you can expend one use to stabilize an Unconscious creature that has 0 Hit Points without needing a Wisdom (Medicine) check.`,
    tags: ['healing'], source: 'SRD 5.2',
  },
  {
    name: "Thieves' Tools", category: 'Tool', cost: '25 GP', weight: '1 lb.',
    description: `Ability: Dexterity. Utilize: pick a lock (DC 15) or disarm a trap (DC 15).`,
    tags: ['tool'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Healing', category: 'Consumable', rarity: 'Common', cost: '50 GP', weight: '0.5 lb.',
    description: `As a Bonus Action, you can drink this potion or administer it to another creature within 5 feet. The creature regains 2d4 + 2 Hit Points.`,
    tags: ['healing', 'potion'], source: 'SRD 5.2',
  },

  // ─────────────────────────────── MAGIC ITEMS ─────────────────────────────
  {
    name: 'Weapon, +1', category: 'Magic Item', rarity: 'Uncommon',
    description: `Any weapon. You have a +1 bonus to attack rolls and damage rolls made with this magic weapon.`,
    tags: ['weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Bag of Holding', category: 'Magic Item', rarity: 'Uncommon', weight: '5 lb.',
    description: `This bag has an interior space considerably larger than its outside dimensions - roughly 2 feet square and 4 feet deep. It can hold up to 500 pounds, not exceeding a volume of 64 cubic feet, and always weighs 5 pounds.

Retrieving an item from the bag requires a Utilize action. If the bag is overloaded, pierced or torn, it is destroyed and its contents are scattered in the Astral Plane.`,
    tags: ['wondrous', 'storage'], source: 'SRD 5.2',
  },
  {
    name: 'Cloak of Protection', category: 'Magic Item', rarity: 'Uncommon', attunement: true, acBonus: 1, saveBonus: 1,
    description: `You gain a +1 bonus to Armor Class and saving throws while you wear this cloak.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Magic Missiles', category: 'Magic Item', rarity: 'Uncommon',
    description: `This wand has 7 charges. While holding it, you can expend 1 to 3 charges to cast Magic Missile from it. For 1 charge you cast the level 1 version; each additional charge raises the spell level by 1.

The wand regains 1d6 + 1 expended charges daily at dawn. If you expend its last charge, roll 1d20; on a 1 the wand crumbles to ash.`,
    tags: ['wand'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Protection', category: 'Magic Item', rarity: 'Rare', attunement: true, acBonus: 1, saveBonus: 1,
    description: `You gain a +1 bonus to Armor Class and saving throws while wearing this ring.`,
    tags: ['ring', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Flame Tongue', category: 'Magic Item', rarity: 'Rare', attunement: true, damage: '+2d6 fire while ablaze',
    description: `Any melee weapon. While holding it, you can take a Bonus Action and use a command word to cause flames to engulf the damage-dealing part of the weapon. The flames shed Bright Light in a 40-foot radius and Dim Light for an additional 40 feet. While ablaze, the weapon deals an extra 2d6 Fire damage on a hit.`,
    tags: ['weapon', 'fire'], source: 'SRD 5.2',
  },

  // ── SRD 5.2: WEAPONS ─────────────────────────────────────────────────────
  {
    name: 'Battleaxe', category: 'Weapon', cost: '10 GP', weight: '4 lb.',
    damage: '1d8 slashing', properties: ['Versatile (1d10)'], mastery: 'Topple',
    description: `Martial melee weapon. Mastery (Topple): when you hit, the creature makes a Constitution save (DC 8 + your attack ability modifier + Proficiency Bonus) or falls Prone.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Blowgun', category: 'Weapon', cost: '10 GP', weight: '1 lb.',
    damage: '1 piercing', properties: ['Ammunition (25/100; Needle)', 'Loading'], mastery: 'Vex',
    description: `Martial ranged weapon. It fires needles and deals just 1 Piercing damage, often as a way to deliver poison. Mastery (Vex): when you hit and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn.`,
    tags: ['martial', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Club', category: 'Weapon', cost: '1 SP', weight: '2 lb.',
    damage: '1d4 bludgeoning', properties: ['Light'], mastery: 'Slow',
    description: `Simple melee weapon. Mastery (Slow): when you hit and deal damage, the creature's Speed drops by 10 feet until the start of your next turn (this doesn't stack).`,
    tags: ['simple', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Dart', category: 'Weapon', cost: '5 CP', weight: '0.25 lb.',
    damage: '1d4 piercing', properties: ['Finesse', 'Thrown (20/60)'], mastery: 'Vex',
    description: `Simple melee weapon. Mastery (Vex): when you hit and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn.`,
    tags: ['simple', 'melee', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'Flail', category: 'Weapon', cost: '10 GP', weight: '2 lb.',
    damage: '1d8 bludgeoning', properties: [], mastery: 'Sap',
    description: `Martial melee weapon. Mastery (Sap): when you hit, the creature has Disadvantage on its next attack roll before the start of your next turn.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Glaive', category: 'Weapon', cost: '20 GP', weight: '6 lb.',
    damage: '1d10 slashing', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Graze',
    description: `Martial melee weapon. Mastery (Graze): when you miss a creature, it still takes damage equal to the ability modifier you used for the attack, of the weapon's damage type.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Greatclub', category: 'Weapon', cost: '2 SP', weight: '10 lb.',
    damage: '1d8 bludgeoning', properties: ['Two-Handed'], mastery: 'Push',
    description: `Simple melee weapon. Mastery (Push): when you hit, you can push a Large or smaller creature up to 10 feet straight away from you.`,
    tags: ['simple', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Halberd', category: 'Weapon', cost: '20 GP', weight: '6 lb.',
    damage: '1d10 slashing', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Cleave',
    description: `Martial melee weapon. Mastery (Cleave): when you hit a creature with a melee attack, you can make one more attack with this weapon against a different creature within 5 feet of the first and within your reach (once per turn; add your ability modifier to its damage only if it is negative).`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Hand Crossbow', category: 'Weapon', cost: '75 GP', weight: '3 lb.',
    damage: '1d6 piercing', properties: ['Ammunition (30/120; Bolt)', 'Light', 'Loading'], mastery: 'Vex',
    description: `Martial ranged weapon. Mastery (Vex): when you hit and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn.`,
    tags: ['martial', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Handaxe', category: 'Weapon', cost: '5 GP', weight: '2 lb.',
    damage: '1d6 slashing', properties: ['Light', 'Thrown (20/60)'], mastery: 'Vex',
    description: `Simple melee weapon. Mastery (Vex): when you hit and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn.`,
    tags: ['simple', 'melee', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'Heavy Crossbow', category: 'Weapon', cost: '50 GP', weight: '18 lb.',
    damage: '1d10 piercing', properties: ['Ammunition (100/400; Bolt)', 'Heavy', 'Loading', 'Two-Handed'], mastery: 'Push',
    description: `Martial ranged weapon. Mastery (Push): when you hit, you can push a Large or smaller creature up to 10 feet straight away from you.`,
    tags: ['martial', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Javelin', category: 'Weapon', cost: '5 SP', weight: '2 lb.',
    damage: '1d6 piercing', properties: ['Thrown (30/120)'], mastery: 'Slow',
    description: `Simple melee weapon. Mastery (Slow): when you hit and deal damage, the creature's Speed drops by 10 feet until the start of your next turn (this doesn't stack).`,
    tags: ['simple', 'melee', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'Lance', category: 'Weapon', cost: '10 GP', weight: '6 lb.',
    damage: '1d10 piercing', properties: ['Heavy', 'Reach', 'Two-Handed (unless mounted)'], mastery: 'Topple',
    description: `Martial melee weapon. It needs two hands unless you are mounted. Mastery (Topple): when you hit, the creature makes a Constitution save (DC 8 + your attack ability modifier + Proficiency Bonus) or falls Prone.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Light Crossbow', category: 'Weapon', cost: '25 GP', weight: '5 lb.',
    damage: '1d8 piercing', properties: ['Ammunition (80/320; Bolt)', 'Loading', 'Two-Handed'], mastery: 'Slow',
    description: `Simple ranged weapon. Mastery (Slow): when you hit and deal damage, the creature's Speed drops by 10 feet until the start of your next turn (this doesn't stack).`,
    tags: ['simple', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Light Hammer', category: 'Weapon', cost: '2 GP', weight: '2 lb.',
    damage: '1d4 bludgeoning', properties: ['Light', 'Thrown (20/60)'], mastery: 'Nick',
    description: `Simple melee weapon. Mastery (Nick): the extra attack from the Light property can be made as part of the Attack action instead of as a Bonus Action (once per turn).`,
    tags: ['simple', 'melee', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'Longbow', category: 'Weapon', cost: '50 GP', weight: '2 lb.',
    damage: '1d8 piercing', properties: ['Ammunition (150/600; Arrow)', 'Heavy', 'Two-Handed'], mastery: 'Slow',
    description: `Martial ranged weapon. Mastery (Slow): when you hit and deal damage, the creature's Speed drops by 10 feet until the start of your next turn (this doesn't stack).`,
    tags: ['martial', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Mace', category: 'Weapon', cost: '5 GP', weight: '4 lb.',
    damage: '1d6 bludgeoning', properties: [], mastery: 'Sap',
    description: `Simple melee weapon. Mastery (Sap): when you hit, the creature has Disadvantage on its next attack roll before the start of your next turn.`,
    tags: ['simple', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Maul', category: 'Weapon', cost: '10 GP', weight: '10 lb.',
    damage: '2d6 bludgeoning', properties: ['Heavy', 'Two-Handed'], mastery: 'Topple',
    description: `Martial melee weapon. Mastery (Topple): when you hit, the creature makes a Constitution save (DC 8 + your attack ability modifier + Proficiency Bonus) or falls Prone.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Morningstar', category: 'Weapon', cost: '15 GP', weight: '4 lb.',
    damage: '1d8 piercing', properties: [], mastery: 'Sap',
    description: `Martial melee weapon. Mastery (Sap): when you hit, the creature has Disadvantage on its next attack roll before the start of your next turn.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Musket', category: 'Weapon', cost: '500 GP', weight: '10 lb.',
    damage: '1d12 piercing', properties: ['Ammunition (40/120; Bullet)', 'Loading', 'Two-Handed'], mastery: 'Slow',
    description: `Martial ranged weapon. A firearm; each shot needs gunpowder and a bullet. Mastery (Slow): when you hit and deal damage, the creature's Speed drops by 10 feet until the start of your next turn (this doesn't stack).`,
    tags: ['martial', 'ranged', 'firearm'], source: 'SRD 5.2',
  },
  {
    name: 'Pike', category: 'Weapon', cost: '5 GP', weight: '18 lb.',
    damage: '1d10 piercing', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Push',
    description: `Martial melee weapon. Mastery (Push): when you hit, you can push a Large or smaller creature up to 10 feet straight away from you.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Pistol', category: 'Weapon', cost: '250 GP', weight: '3 lb.',
    damage: '1d10 piercing', properties: ['Ammunition (30/90; Bullet)', 'Loading'], mastery: 'Vex',
    description: `Martial ranged weapon. A firearm; each shot needs gunpowder and a bullet. Mastery (Vex): when you hit and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn.`,
    tags: ['martial', 'ranged', 'firearm'], source: 'SRD 5.2',
  },
  {
    name: 'Scimitar', category: 'Weapon', cost: '25 GP', weight: '3 lb.',
    damage: '1d6 slashing', properties: ['Finesse', 'Light'], mastery: 'Nick',
    description: `Martial melee weapon. Mastery (Nick): the extra attack from the Light property can be made as part of the Attack action instead of as a Bonus Action (once per turn).`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Shortsword', category: 'Weapon', cost: '10 GP', weight: '2 lb.',
    damage: '1d6 piercing', properties: ['Finesse', 'Light'], mastery: 'Vex',
    description: `Martial melee weapon. Mastery (Vex): when you hit and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Sickle', category: 'Weapon', cost: '1 GP', weight: '2 lb.',
    damage: '1d4 slashing', properties: ['Light'], mastery: 'Nick',
    description: `Simple melee weapon. Mastery (Nick): the extra attack from the Light property can be made as part of the Attack action instead of as a Bonus Action (once per turn).`,
    tags: ['simple', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Sling', category: 'Weapon', cost: '1 SP',
    damage: '1d4 bludgeoning', properties: ['Ammunition (30/120; Bullet)'], mastery: 'Slow',
    description: `Simple ranged weapon. Mastery (Slow): when you hit and deal damage, the creature's Speed drops by 10 feet until the start of your next turn (this doesn't stack).`,
    tags: ['simple', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Trident', category: 'Weapon', cost: '5 GP', weight: '4 lb.',
    damage: '1d8 piercing', properties: ['Thrown (20/60)', 'Versatile (1d10)'], mastery: 'Topple',
    description: `Martial melee weapon. Mastery (Topple): when you hit, the creature makes a Constitution save (DC 8 + your attack ability modifier + Proficiency Bonus) or falls Prone.`,
    tags: ['martial', 'melee', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'War Pick', category: 'Weapon', cost: '5 GP', weight: '2 lb.',
    damage: '1d8 piercing', properties: ['Versatile (1d10)'], mastery: 'Sap',
    description: `Martial melee weapon. Mastery (Sap): when you hit, the creature has Disadvantage on its next attack roll before the start of your next turn.`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },
  {
    name: 'Whip', category: 'Weapon', cost: '2 GP', weight: '3 lb.',
    damage: '1d4 slashing', properties: ['Finesse', 'Reach'], mastery: 'Slow',
    description: `Martial melee weapon. Mastery (Slow): when you hit and deal damage, the creature's Speed drops by 10 feet until the start of your next turn (this doesn't stack).`,
    tags: ['martial', 'melee'], source: 'SRD 5.2',
  },

  // ── SRD 5.2: ARMOR ───────────────────────────────────────────────────────
  {
    name: 'Padded Armor', category: 'Armor', cost: '5 GP', weight: '8 lb.', armorClass: '11 + Dex modifier',
    description: `Light armor. Takes 1 minute to put on and 1 minute to take off. Disadvantage on Dexterity (Stealth) checks.`,
    tags: ['light armor'], source: 'SRD 5.2',
  },
  {
    name: 'Hide Armor', category: 'Armor', cost: '10 GP', weight: '12 lb.', armorClass: '12 + Dex modifier (max 2)',
    description: `Medium armor. Takes 5 minutes to put on and 1 minute to take off.`,
    tags: ['medium armor'], source: 'SRD 5.2',
  },
  {
    name: 'Studded Leather Armor', category: 'Armor', cost: '45 GP', weight: '13 lb.', armorClass: '12 + Dex modifier',
    description: `Light armor. Takes 1 minute to put on and 1 minute to take off.`,
    tags: ['light armor'], source: 'SRD 5.2',
  },
  {
    name: 'Breastplate', category: 'Armor', cost: '400 GP', weight: '20 lb.', armorClass: '14 + Dex modifier (max 2)',
    description: `Medium armor. Takes 5 minutes to put on and 1 minute to take off.`,
    tags: ['medium armor'], source: 'SRD 5.2',
  },
  {
    name: 'Ring Mail', category: 'Armor', cost: '30 GP', weight: '40 lb.', armorClass: '14',
    description: `Heavy armor. Takes 10 minutes to put on and 5 minutes to take off. Disadvantage on Dexterity (Stealth) checks.`,
    tags: ['heavy armor'], source: 'SRD 5.2',
  },
  {
    name: 'Scale Mail', category: 'Armor', cost: '50 GP', weight: '45 lb.', armorClass: '14 + Dex modifier (max 2)',
    description: `Medium armor. Takes 5 minutes to put on and 1 minute to take off. Disadvantage on Dexterity (Stealth) checks.`,
    tags: ['medium armor'], source: 'SRD 5.2',
  },
  {
    name: 'Half Plate Armor', category: 'Armor', cost: '750 GP', weight: '40 lb.', armorClass: '15 + Dex modifier (max 2)',
    description: `Medium armor. Takes 5 minutes to put on and 1 minute to take off. Disadvantage on Dexterity (Stealth) checks.`,
    tags: ['medium armor'], source: 'SRD 5.2',
  },
  {
    name: 'Splint Armor', category: 'Armor', cost: '200 GP', weight: '60 lb.', armorClass: '17',
    description: `Heavy armor. Takes 10 minutes to put on and 5 minutes to take off. Requires Strength 15; otherwise your Speed drops by 10 feet. Disadvantage on Dexterity (Stealth) checks.`,
    tags: ['heavy armor'], source: 'SRD 5.2',
  },

  // ── SRD 5.2: MAGIC ITEMS ─────────────────────────────────────────────────
  {
    name: 'Adamantine Armor', category: 'Magic Item', rarity: 'Uncommon',
    description: `Any Medium or Heavy armor (not hide) laced with adamantine. While you wear it, Critical Hits against you count as normal hits.`,
    tags: ['armor'], source: 'SRD 5.2',
  },
  {
    name: 'Ammunition of Slaying', category: 'Magic Item', rarity: 'Very Rare',
    description: `Each piece is keyed to one creature type (Dragons, Undead, Fiends and so on). A creature of that type damaged by it makes a DC 17 Constitution save, taking an extra 6d10 Force damage on a failure or half on a success. The piece then becomes ordinary.`,
    tags: ['ammunition', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Ammunition, +1', category: 'Magic Item', rarity: 'Uncommon',
    description: `Magic arrows, bolts, bullets or needles, usually found in bundles of 10 or 20. Each piece adds +1 to attack and damage rolls and loses its magic once it hits.`,
    tags: ['ammunition', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Ammunition, +2', category: 'Magic Item', rarity: 'Rare',
    description: `As Ammunition, +1, but the bonus to attack and damage rolls is +2.`,
    tags: ['ammunition', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Ammunition, +3', category: 'Magic Item', rarity: 'Very Rare',
    description: `As Ammunition, +1, but the bonus to attack and damage rolls is +3.`,
    tags: ['ammunition', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Amulet of Health', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Your Constitution is 19 while you wear it. No effect if your Constitution is already 19 or more.`,
    tags: ['wondrous', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Amulet of Proof against Detection and Location', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `While worn, Divination spells can't target you and magical scrying sensors can't perceive you unless you allow it.`,
    tags: ['wondrous', 'stealth'], source: 'SRD 5.2',
  },
  {
    name: 'Amulet of the Planes', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `As a Magic action, name a place you know on another plane and make a DC 15 Intelligence (Arcana) check. Success casts Plane Shift to it. Failure flings you, and everything within 15 feet, to a random location - usually somewhere on the plane you named, but possibly anywhere in the multiverse.`,
    tags: ['wondrous', 'travel'], source: 'SRD 5.2',
  },
  {
    name: 'Animated Shield', category: 'Armor', rarity: 'Very Rare', attunement: true,
    armorClass: '+2', acBonus: 2,
    description: `As a Bonus Action, set this Shield to hover and guard you as if you were holding it, leaving your hands free, for up to 1 minute. It drops when the time is up, when you end it as a Bonus Action, or if you die or are Incapacitated.`,
    tags: ['shield'], source: 'SRD 5.2',
  },
  {
    name: 'Armor of Etherealness', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Plate or half plate. Once per dawn, as a Magic action, you gain the effect of the Etherealness spell, which ends early if you remove the armor or repeat the command word.`,
    tags: ['armor', 'planar'], source: 'SRD 5.2',
  },
  {
    name: 'Armor of Invulnerability', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Plate armor that gives you Resistance to Bludgeoning, Piercing and Slashing damage. Once per dawn, as a Magic action, you become immune to those damage types for 10 minutes or until you take it off.`,
    tags: ['armor', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Armor of Resistance', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Any armor. While you wear it you have Resistance to one damage type set when it was made (Acid, Cold, Fire, Force, Lightning, Necrotic, Poison, Psychic, Radiant or Thunder).`,
    tags: ['armor', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Armor of Vulnerability', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Grants Resistance to one of Bludgeoning, Piercing or Slashing damage - but it is cursed. Attuning curses you until Remove Curse or similar magic, and while cursed you have Vulnerability to the other two of those damage types. Identify or attuning reveals the curse.`,
    tags: ['armor', 'cursed'], source: 'SRD 5.2',
  },
  {
    name: 'Armor, +1', category: 'Magic Item', rarity: 'Rare',
    armorClass: 'Base armor +1', acBonus: 1,
    description: `Any armor. You gain +1 to Armor Class while wearing it.`,
    tags: ['armor'], source: 'SRD 5.2',
  },
  {
    name: 'Armor, +2', category: 'Magic Item', rarity: 'Very Rare',
    armorClass: 'Base armor +2', acBonus: 2,
    description: `Any armor. You gain +2 to Armor Class while wearing it.`,
    tags: ['armor'], source: 'SRD 5.2',
  },
  {
    name: 'Armor, +3', category: 'Magic Item', rarity: 'Legendary',
    armorClass: 'Base armor +3', acBonus: 3,
    description: `Any armor. You gain +3 to Armor Class while wearing it.`,
    tags: ['armor'], source: 'SRD 5.2',
  },
  {
    name: 'Arrow-Catching Shield', category: 'Armor', rarity: 'Rare', attunement: true,
    armorClass: '+2 (+4 against ranged attacks)', acBonus: 2,
    description: `While you wield it, you gain an extra +2 to AC against ranged attack rolls on top of the Shield's normal bonus. When a ranged attack targets a creature within 5 feet of you, you can use your Reaction to become the target instead.`,
    tags: ['shield'], source: 'SRD 5.2',
  },
  {
    name: 'Bag of Beans', category: 'Magic Item', rarity: 'Rare', weight: '0.5 lb.',
    description: `Holds 3d4 magic beans. Dumping beans out makes them explode in a 10-foot-radius Sphere (DC 15 Dexterity save, 5d4 Force damage, half on a success). A single bean planted and watered produces a random effect a minute later, from harmless oddities to monsters, treasure or a giant beanstalk.`,
    tags: ['wondrous', 'random'], source: 'SRD 5.2',
  },
  {
    name: 'Bag of Devouring', category: 'Magic Item', rarity: 'Very Rare',
    description: `Looks like a Bag of Holding but is the mouth of an extradimensional creature. Plant or animal matter put inside is eaten. Anyone reaching in has a 50 percent chance of being pulled in; escaping takes a DC 15 Strength (Athletics) check (DC 20 to pull someone out), and a creature that starts its turn inside is devoured. Turning it inside out closes it.`,
    tags: ['wondrous', 'cursed'], source: 'SRD 5.2',
  },
  {
    name: 'Bag of Tricks', category: 'Magic Item', rarity: 'Uncommon',
    description: `As a Magic action you pull out a fuzzy ball and throw it up to 20 feet, where it becomes a random animal determined by the bag's colour (grey, rust or tan). The creature is Friendly, acts after you, and follows your Bonus Action commands until it drops to 0 Hit Points or the next dawn. Three uses, then it recharges at dawn.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Bead of Force', category: 'Magic Item', rarity: 'Rare',
    description: `Usually found in groups of 1d4 + 4. Throw one up to 60 feet as a Magic action: it bursts in a 10-foot-radius Sphere, and creatures there make a DC 15 Dexterity save or take 5d4 Force damage and are trapped inside a sphere of force for 1 minute. Creatures who saved are pushed out. Nothing but air passes the wall; a trapped creature can roll the sphere at half Speed.`,
    tags: ['wondrous', 'force'], source: 'SRD 5.2',
  },
  {
    name: 'Belt of Dwarvenkind', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `While worn, your Constitution rises by 2 (max 20), you know Dwarvish, and you have Advantage on Charisma (Persuasion) checks with dwarves. A non-dwarf also gains 60-foot Darkvision, Resistance to Poison damage and Advantage on saves against being Poisoned. It may also grow you a beard.`,
    tags: ['wondrous', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Belt of Giant Strength', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Your Strength becomes the belt's score while you wear it (no effect if yours is already that high): hill giant 21 (Rare), frost or stone giant 23 (Very Rare), fire giant 25 (Very Rare), cloud giant 27 (Legendary), storm giant 29 (Legendary).`,
    tags: ['wondrous', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Berserker Axe', category: 'Magic Item', rarity: 'Rare', attunement: true,
    damage: '+1 to attack and damage',
    description: `Any axe. +1 to attack and damage rolls, and your Hit Point maximum rises by 1 per level while attuned. Cursed: you won't part with it, have Disadvantage with other weapons, and when damaged must pass a DC 15 Wisdom save or go berserk, attacking the nearest creature you can see or hear until none is within 60 feet at the start of your turn.`,
    tags: ['weapon', 'cursed'], source: 'SRD 5.2',
  },
  {
    name: 'Boots of Elvenkind', category: 'Magic Item', rarity: 'Uncommon',
    description: `Your steps are silent on any surface, and you have Advantage on Dexterity (Stealth) checks.`,
    tags: ['wondrous', 'stealth'], source: 'SRD 5.2',
  },
  {
    name: 'Boots of Levitation', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `While wearing them, you can cast Levitate on yourself at will.`,
    tags: ['wondrous', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Boots of Speed', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Click the heels as a Bonus Action to double your Speed, and Opportunity Attacks against you have Disadvantage; click again to stop. After 10 minutes of total use, they don't work for you until you finish a Long Rest.`,
    tags: ['wondrous', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Boots of Striding and Springing', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Your Speed is at least 30 feet and isn't reduced by heavy loads or Heavy armor. Once per turn you can jump up to 30 feet for just 10 feet of movement.`,
    tags: ['wondrous', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Boots of the Winterlands', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You have Resistance to Cold damage, are comfortable down to 0 degrees Fahrenheit or lower, and ignore Difficult Terrain made of ice or snow.`,
    tags: ['wondrous', 'cold'], source: 'SRD 5.2',
  },
  {
    name: 'Bowl of Commanding Water Elementals', category: 'Magic Item', rarity: 'Rare',
    description: `Filled with water and within 5 feet of you, it lets you summon a Water Elemental as a Magic action, once per dawn. It obeys you and acts after you for 1 hour, until it dies, or until you dismiss it as a Bonus Action.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Bracers of Archery', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You are proficient with Longbows and Shortbows and deal +2 damage with them.`,
    tags: ['wondrous', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Bracers of Defense', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `+2 to Armor Class while you wear no armor and use no Shield.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Brazier of Commanding Fire Elementals', category: 'Magic Item', rarity: 'Rare',
    description: `Within 5 feet of it, you can summon a Fire Elemental as a Magic action, once per dawn. It obeys you and acts after you for 1 hour, until it dies, or until you dismiss it as a Bonus Action.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Brooch of Shielding', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You have Resistance to Force damage and are immune to damage from Magic Missile.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Broom of Flying', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Stand astride it and take a Magic action to ride it through the air at a Fly Speed of 50 feet (30 feet if carrying over 200 pounds; 400 pounds max). As a Magic action you can send it alone to a familiar place within 1 mile, and call it back from within a mile.`,
    tags: ['wondrous', 'flight'], source: 'SRD 5.2',
  },
  {
    name: 'Candle of Invocation', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Burns for 4 hours in total, shedding Dim Light in a 30-foot radius. Within the light you have Advantage on D20 Tests, and Clerics and Druids can cast prepared level 1 spells without slots. Alternatively, the first time you light it you can use it to cast Gate to a random Outer Plane, destroying the candle.`,
    tags: ['wondrous', 'divine'], source: 'SRD 5.2',
  },
  {
    name: 'Cape of the Mountebank', category: 'Magic Item', rarity: 'Rare',
    description: `Once per dawn you can cast Dimension Door from it as a Magic action, leaving behind a puff of smoke that Lightly Obscures your old space until the end of your next turn.`,
    tags: ['wondrous', 'teleport'], source: 'SRD 5.2',
  },
  {
    name: 'Carpet of Flying', category: 'Magic Item', rarity: 'Very Rare',
    description: `A Magic action and command word make it fly at your direction while you're within 30 feet. Sizes range from 3 by 5 feet (200 pounds, 80-foot Fly Speed) to 6 by 9 feet (800 pounds, 30 feet); it can carry double its capacity at half speed.`,
    tags: ['wondrous', 'flight'], source: 'SRD 5.2',
  },
  {
    name: 'Censer of Controlling Air Elementals', category: 'Magic Item', rarity: 'Rare',
    description: `While swinging it, you can summon an Air Elemental as a Magic action, once per dawn. It obeys you and acts after you for 1 hour, until it dies, or until you dismiss it as a Bonus Action.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Chime of Opening', category: 'Magic Item', rarity: 'Rare', weight: '1 lb.',
    description: `Strike it as a Magic action to cast Knock; the knock becomes a clear chime heard 300 feet away. It cracks and becomes useless after ten uses.`,
    tags: ['wondrous', 'utility'], source: 'SRD 5.2',
  },
  {
    name: 'Circlet of Blasting', category: 'Magic Item', rarity: 'Uncommon',
    description: `Once per dawn you can cast Scorching Ray from it (+5 to hit).`,
    tags: ['wondrous', 'fire'], source: 'SRD 5.2',
  },
  {
    name: 'Cloak of Arachnida', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `You have Resistance to Poison damage, a Climb Speed equal to your Speed with spider-like wall and ceiling walking, and can't be caught in webs (they are just Difficult Terrain to you). Once per dawn you can cast Web (DC 13) covering double the normal area.`,
    tags: ['wondrous'], source: 'SRD 5.2',
  },
  {
    name: 'Cloak of Displacement', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `An illusion shows you slightly off from where you really are, so attack rolls against you have Disadvantage. Taking damage switches it off until the start of your next turn, and it doesn't work while your Speed is 0.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Cloak of Elvenkind', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Wisdom (Perception) checks to notice you have Disadvantage, and you have Advantage on Dexterity (Stealth) checks.`,
    tags: ['wondrous', 'stealth'], source: 'SRD 5.2',
  },
  {
    name: 'Cloak of the Bat', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Advantage on Dexterity (Stealth) checks. In Dim Light or Darkness you can hold its edges to fly at 40 feet, and once per dawn you can cast Polymorph on yourself to become a Bat, keeping your mental scores.`,
    tags: ['wondrous', 'flight'], source: 'SRD 5.2',
  },
  {
    name: 'Cloak of the Manta Ray', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You can breathe underwater and have a Swim Speed of 60 feet.`,
    tags: ['wondrous', 'water'], source: 'SRD 5.2',
  },
  {
    name: 'Crystal Ball', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `While touching it you can cast Scrying (DC 17).`,
    tags: ['wondrous', 'divination'], source: 'SRD 5.2',
  },
  {
    name: 'Crystal Ball of Mind Reading', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Cast Scrying (DC 17) through it, and Detect Thoughts (DC 17) on creatures within 30 feet of the sensor without needing Concentration for it; it ends when the Scrying does.`,
    tags: ['wondrous', 'divination'], source: 'SRD 5.2',
  },
  {
    name: 'Crystal Ball of Telepathy', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Cast Scrying (DC 17) through it and speak telepathically with creatures within 30 feet of the sensor. Once per dawn you can also cast Suggestion (DC 17) on one of them, needing no Concentration while the Scrying lasts.`,
    tags: ['wondrous', 'divination'], source: 'SRD 5.2',
  },
  {
    name: 'Crystal Ball of True Seeing', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Cast Scrying (DC 17) through it, and you have 120-foot Truesight centred on the sensor.`,
    tags: ['wondrous', 'divination'], source: 'SRD 5.2',
  },
  {
    name: 'Cube of Force', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Has 10 charges and regains 1d6 at dawn. Press a face to cast a spell (DC 17): Mage Armor or Shield (1 charge), Tiny Hut (3), Private Sanctum or Resilient Sphere (4), or Wall of Force (5).`,
    tags: ['wondrous', 'force'], source: 'SRD 5.2',
  },
  {
    name: 'Cubic Gate', category: 'Magic Item', rarity: 'Legendary',
    description: `Each face is keyed to a plane, one of them the Material Plane. It has 3 charges, regaining 1d3 at dawn. Spend a charge as a Magic action to cast Gate to a face's plane, or Plane Shift there by pressing it twice.`,
    tags: ['wondrous', 'planar'], source: 'SRD 5.2',
  },
  {
    name: 'Dagger of Venom', category: 'Magic Item', rarity: 'Rare',
    damage: '1d4+1 piercing',
    description: `A +1 dagger. Once per dawn, as a Bonus Action, you coat it in poison for up to 1 minute; the next creature it hits makes a DC 15 Constitution save or takes 2d10 Poison damage and is Poisoned for 1 minute.`,
    tags: ['weapon', 'poison'], source: 'SRD 5.2',
  },
  {
    name: 'Dancing Sword', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Any sword. As a Bonus Action, toss it into the air: it flies up to 30 feet and attacks a creature within 5 feet of it, using your attack roll and damage modifier. Each later Bonus Action moves it up to 30 feet (staying within 30 feet of you) and attacks again. After the fourth attack it returns to your hand.`,
    tags: ['weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Decanter of Endless Water', category: 'Magic Item', rarity: 'Uncommon', weight: '2 lb.',
    description: `As a Magic action, unstopper it and pour fresh or salt water: 1 gallon, 5 gallons, or a 30-gallon geyser in a 30-foot Line that can knock one creature Prone (DC 13 Strength save, 1d4 Bludgeoning damage).`,
    tags: ['wondrous', 'water'], source: 'SRD 5.2',
  },
  {
    name: 'Deck of Illusions', category: 'Magic Item', rarity: 'Uncommon',
    description: `Draw a random card as a Magic action and throw it up to 30 feet; it becomes a harmless illusion of a creature that lasts until dispelled, and you can move it as a Magic action while within 120 feet. Touch reveals it. A full deck has 34 cards; found decks are often missing some.`,
    tags: ['wondrous', 'illusion'], source: 'SRD 5.2',
  },
  {
    name: 'Defender', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    damage: '+3 to attack and damage',
    description: `Any sword with +3 to attack and damage rolls. The first time you attack with it each turn, you can move some or all of that bonus to your Armor Class until the start of your next turn (while you hold it).`,
    tags: ['weapon', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Dimensional Shackles', category: 'Magic Item', rarity: 'Rare',
    description: `Placed on an Incapacitated Small-to-Large creature with a Utilize action, they block teleportation and planar travel (but not portals). Only you and those you name can remove them. Every 30 days the prisoner can try a DC 30 Strength (Athletics) check to break them.`,
    tags: ['wondrous', 'restraint'], source: 'SRD 5.2',
  },
  {
    name: 'Dragon Scale Mail', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    armorClass: 'Scale mail +1', acBonus: 1,
    description: `Scale mail made from dragon scales: +1 to AC, Advantage on saves against Dragons' breath weapons, and Resistance to the damage type of the dragon it came from. Once per dawn, as a Magic action, you sense the nearest dragon of that kind within 30 miles.`,
    tags: ['armor', 'dragon'], source: 'SRD 5.2',
  },
  {
    name: 'Dragon Slayer', category: 'Magic Item', rarity: 'Rare',
    damage: '+1 to attack and damage',
    description: `A +1 weapon that deals an extra 3d6 damage of its type to Dragons.`,
    tags: ['weapon', 'dragon'], source: 'SRD 5.2',
  },
  {
    name: 'Dust of Disappearance', category: 'Consumable', rarity: 'Uncommon',
    description: `One use. Throw it into the air as a Utilize action: you and everything within 10 feet become Invisible for 2d4 minutes. A creature's invisibility ends when it attacks, deals damage or casts a spell.`,
    tags: ['wondrous', 'invisibility'], source: 'SRD 5.2',
  },
  {
    name: 'Dust of Dryness', category: 'Consumable', rarity: 'Uncommon',
    description: `Holds 1d6 + 4 pinches. A pinch turns up to a 15-foot Cube of water into a marble-sized pellet that releases the water when smashed. Sprinkled on a watery Elemental within 5 feet, it forces a DC 13 Constitution save against 10d6 Necrotic damage (half on a success).`,
    tags: ['wondrous', 'water'], source: 'SRD 5.2',
  },
  {
    name: 'Dust of Sneezing and Choking', category: 'Consumable', rarity: 'Uncommon',
    description: `Looks and identifies as Dust of Disappearance. Thrown into the air, it forces you and every creature in a 30-foot Emanation to make a DC 15 Constitution save (Constructs, Elementals, Oozes, Plants and Undead are immune) or be Incapacitated and suffocating, repeating the save each turn. Lesser Restoration also ends it.`,
    tags: ['wondrous', 'trap'], source: 'SRD 5.2',
  },
  {
    name: 'Dwarven Plate', category: 'Magic Item', rarity: 'Very Rare',
    armorClass: 'Base armor +2', acBonus: 2,
    description: `Plate or half plate. You gain +2 to AC, and when something moves you against your will along the ground, you can use your Reaction to cut the distance by up to 10 feet.`,
    tags: ['armor'], source: 'SRD 5.2',
  },
  {
    name: 'Dwarven Thrower', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    damage: '1d8+3 bludgeoning', properties: ['Thrown (20/60)'],
    description: `Attunement by a dwarf or someone attuned to a Belt of Dwarvenkind. A +3 warhammer with the Thrown property. Its ranged hits deal an extra 1d8 Force damage (2d8 against Giants), and it flies back to your hand after each throw.`,
    tags: ['weapon', 'thrown'], source: 'SRD 5.2',
  },
  {
    name: 'Efficient Quiver', category: 'Magic Item', rarity: 'Uncommon', weight: '2 lb.',
    description: `Never weighs more than 2 pounds. Its three compartments hold up to 60 arrows or bolts, 18 javelins, and 6 long items such as bows, staffs or spears, all drawn as easily as from a normal quiver.`,
    tags: ['wondrous', 'storage'], source: 'SRD 5.2',
  },
  {
    name: 'Efreeti Bottle', category: 'Magic Item', rarity: 'Very Rare',
    description: `Unstoppering it releases an efreeti. The first time, roll: it may attack you, serve you for an hour (and do so twice more on later openings), or grant three wishes before leaving.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Elemental Gem', category: 'Consumable', rarity: 'Uncommon',
    description: `Break it with a Utilize action to summon an elemental that obeys you for 1 hour: blue sapphire (air), yellow diamond (earth), red corundum (fire) or emerald (water). The gem is then mundane.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Elven Chain', category: 'Magic Item', rarity: 'Rare',
    armorClass: 'Base armor +1', acBonus: 1,
    description: `A chain shirt or chain mail. You gain +1 to AC and count as trained with it even without training in its armor category.`,
    tags: ['armor'], source: 'SRD 5.2',
  },
  {
    name: 'Eversmoking Bottle', category: 'Magic Item', rarity: 'Uncommon',
    description: `Open it as a Magic action and thick smoke fills a 60-foot Emanation (Heavily Obscured), growing 10 feet per minute up to 120 feet. Closing it leaves the cloud in place for 10 minutes; strong wind clears it in 1 minute.`,
    tags: ['wondrous', 'obscure'], source: 'SRD 5.2',
  },
  {
    name: 'Eyes of Charming', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Three charges, all regained at dawn. Spend charges to cast Charm Person (DC 13); each charge beyond the first raises the spell level by one.`,
    tags: ['wondrous', 'charm'], source: 'SRD 5.2',
  },
  {
    name: 'Eyes of Minute Seeing', category: 'Magic Item', rarity: 'Uncommon',
    description: `Within 1 foot you have Darkvision and Advantage on Intelligence (Investigation) checks to examine things.`,
    tags: ['wondrous', 'investigation'], source: 'SRD 5.2',
  },
  {
    name: 'Eyes of the Eagle', category: 'Magic Item', rarity: 'Uncommon',
    description: `Advantage on sight-based Wisdom (Perception) checks, and in clear conditions you can pick out details as small as 2 feet across at extreme distances.`,
    tags: ['wondrous', 'perception'], source: 'SRD 5.2',
  },
  {
    name: 'Feather Token', category: 'Consumable', rarity: 'Uncommon',
    description: `A single-use feather of one of several kinds: Anchor (holds a ship in place for 24 hours), Bird (a giant bird that carries you), Fan (a wind that drives a ship), Swan Boat (a swan-shaped boat for a day), Tree (an instant oak) or Whip (a floating whip of force that fights for you). Rarity varies by kind.`,
    tags: ['wondrous'], source: 'SRD 5.2',
  },
  {
    name: 'Figurine of Wondrous Power', category: 'Magic Item', rarity: 'Rare',
    description: `A pocket statuette. Throw it within 60 feet as a Magic action and it becomes a living creature that is Friendly, obeys you and acts after you, for a set time before reverting and needing to recharge. Kinds include the bronze griffon, ebony fly, golden lions, ivory goats, marble elephant, obsidian steed, onyx dog, serpentine owl and silver raven; rarity varies.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Folding Boat', category: 'Magic Item', rarity: 'Rare', weight: '4 lb.',
    description: `A small wooden box with three command words: unfold into a rowboat, unfold into a keelboat, or fold back into a box (only if no one is aboard).`,
    tags: ['wondrous', 'vehicle'], source: 'SRD 5.2',
  },
  {
    name: 'Frost Brand', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    damage: '+1d6 cold',
    description: `Any weapon that deals Slashing damage. Hits deal an extra 1d6 Cold damage, and you have Resistance to Fire damage while holding it. It glows in freezing weather, and once an hour, when you draw it, you can put out every nonmagical flame within 30 feet.`,
    tags: ['weapon', 'cold'], source: 'SRD 5.2',
  },
  {
    name: 'Gauntlets of Ogre Power', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Your Strength is 19 while you wear them. No effect if your Strength is already 19 or more.`,
    tags: ['wondrous', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Gem of Brightness', category: 'Magic Item', rarity: 'Uncommon',
    description: `Has 50 charges. Command words make it glow like a lantern (free), fire a beam that Blinds a creature within 60 feet unless it passes a DC 15 Constitution save (1 charge), or flare in a 30-foot Cone that can Blind everyone in it (5 charges). It becomes a mundane gem when empty.`,
    tags: ['wondrous', 'light'], source: 'SRD 5.2',
  },
  {
    name: 'Gem of Seeing', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Three charges, regaining 1d3 at dawn. As a Magic action spend one to gain 120-foot Truesight while looking through it, for 10 minutes.`,
    tags: ['wondrous', 'divination'], source: 'SRD 5.2',
  },
  {
    name: 'Giant Slayer', category: 'Magic Item', rarity: 'Rare',
    damage: '+1 to attack and damage',
    description: `A +1 weapon. When it hits a Giant, the Giant takes an extra 2d6 damage of the weapon's type and must pass a DC 15 Strength save or fall Prone.`,
    tags: ['weapon', 'giant'], source: 'SRD 5.2',
  },
  {
    name: 'Glamoured Studded Leather', category: 'Magic Item', rarity: 'Rare',
    armorClass: '12 + Dex modifier, +1', acBonus: 1,
    description: `+1 to AC while worn. As a Bonus Action you can make it look like ordinary clothes or any other armor, though it keeps its real bulk and weight.`,
    tags: ['armor', 'disguise'], source: 'SRD 5.2',
  },
  {
    name: 'Gloves of Missile Snaring', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `When a Ranged or Thrown weapon attack hits you and you have a free hand, your Reaction reduces the damage by 1d10 + your Dexterity modifier. Reduce it to 0 and you can catch the missile if it fits in your hand.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Gloves of Swimming and Climbing', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You have Climb and Swim Speeds equal to your Speed and +5 to Strength (Athletics) checks to climb or swim.`,
    tags: ['wondrous', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Goggles of Night', category: 'Magic Item', rarity: 'Uncommon',
    description: `You have Darkvision out to 60 feet, or 60 feet more if you already have it.`,
    tags: ['wondrous', 'senses'], source: 'SRD 5.2',
  },
  {
    name: 'Hammer of Thunderbolts', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    damage: '2d6+1 bludgeoning',
    description: `A +1 maul or warhammer with 5 charges (regains 1d4 + 1 at dawn). Spend a charge to throw it (20/60 feet); on a hit, a thunderclap forces the target and everyone within 30 feet of it except you to pass a DC 17 Constitution save or be Stunned until the end of your next turn, and the hammer returns to your hand. While also attuned to a Belt of Giant Strength or Gauntlets of Ogre Power, it gains a deadly power against Giants.`,
    tags: ['weapon', 'thunder'], source: 'SRD 5.2',
  },
  {
    name: 'Handy Haversack', category: 'Magic Item', rarity: 'Rare', weight: '5 lb.',
    description: `A backpack whose two side pouches each hold 200 pounds (25 cubic feet) and whose central pouch holds 500 pounds (64 cubic feet); it always weighs 5 pounds. The item you want is always on top, retrievable with a Utilize action or a Bonus Action. Overloading, piercing or tearing it destroys it and loses its contents. Placing it in another extradimensional space is disastrous.`,
    tags: ['wondrous', 'storage'], source: 'SRD 5.2',
  },
  {
    name: 'Hat of Disguise', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `While wearing it you can cast Disguise Self at will; the spell ends if the hat comes off.`,
    tags: ['wondrous', 'disguise'], source: 'SRD 5.2',
  },
  {
    name: 'Headband of Intellect', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Your Intelligence is 19 while you wear it. No effect if your Intelligence is already 19 or more.`,
    tags: ['wondrous', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Helm of Brilliance', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Studded with diamonds, rubies, fire opals and opals, each gem a spell or power: radiant light that burns nearby Undead, flaming weapons, Prismatic Spray, Daylight, Fireball, Wall of Fire and more, plus Resistance to Fire damage. Gems used up crumble; the helm is mundane once all are gone, and it can explode if you take Fire damage and fail a save.`,
    tags: ['wondrous', 'fire'], source: 'SRD 5.2',
  },
  {
    name: 'Helm of Comprehending Languages', category: 'Magic Item', rarity: 'Uncommon',
    description: `While wearing it you can cast Comprehend Languages at will.`,
    tags: ['wondrous', 'language'], source: 'SRD 5.2',
  },
  {
    name: 'Helm of Telepathy', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You have 30-foot telepathy, and once per dawn each you can cast Detect Thoughts or Suggestion (DC 13) from it.`,
    tags: ['wondrous', 'telepathy'], source: 'SRD 5.2',
  },
  {
    name: 'Helm of Teleportation', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Three charges, regaining 1d3 at dawn. Spend one to cast Teleport.`,
    tags: ['wondrous', 'teleport'], source: 'SRD 5.2',
  },
  {
    name: 'Holy Avenger', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    damage: '+3 to attack and damage',
    description: `Attunement by a Paladin. A +3 weapon that deals an extra 2d10 Radiant damage to Fiends and Undead. While you hold it drawn, you and Friendly creatures within a 10-foot Emanation (30 feet at Paladin level 17) have Advantage on saves against spells and magical effects.`,
    tags: ['weapon', 'radiant', 'paladin'], source: 'SRD 5.2',
  },
  {
    name: 'Horn of Blasting', category: 'Magic Item', rarity: 'Rare',
    description: `Blow it as a Magic action: a 30-foot Cone of sound forces a DC 15 Constitution save, dealing 5d8 Thunder damage and Deafening for a minute on a failure (half damage only on a success), and wrecks unattended glass and crystal. Each use has a 20 percent chance to explode the horn for 10d6 Force damage to you.`,
    tags: ['wondrous', 'thunder'], source: 'SRD 5.2',
  },
  {
    name: 'Horn of Valhalla', category: 'Magic Item', rarity: 'Legendary',
    description: `Once every 7 days, blowing it summons warrior spirits (Berserker stat blocks) from Ysgard for an hour. Silver, brass, bronze and iron horns summon more spirits but have stricter requirements to use safely; if you don't meet them, the spirits attack you.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Horseshoes of a Zephyr', category: 'Magic Item', rarity: 'Very Rare',
    description: `A set of four. On all four hooves of a horse or similar creature, it floats 4 inches off the ground - over water, lava or other unstable surfaces - leaves no tracks, ignores Difficult Terrain and can travel 12 hours a day without Exhaustion.`,
    tags: ['wondrous', 'mount'], source: 'SRD 5.2',
  },
  {
    name: 'Horseshoes of Speed', category: 'Magic Item', rarity: 'Rare',
    description: `A set of four. On all four hooves of one creature, they raise its Speed by 30 feet.`,
    tags: ['wondrous', 'mount'], source: 'SRD 5.2',
  },
  {
    name: 'Immovable Rod', category: 'Magic Item', rarity: 'Uncommon',
    description: `Press its button (a Utilize action) and it locks in place, even in midair, holding up to 8,000 pounds; press again to release. A DC 30 Strength (Athletics) check can shift a fixed rod up to 10 feet.`,
    tags: ['rod', 'utility'], source: 'SRD 5.2',
  },
  {
    name: 'Instant Fortress', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `A 1-inch adamantine statuette that, on command, grows into a 20-foot-square, 30-foot-tall adamantine tower with two floors, arrow slits, a battlement and a door that opens only for you. Creatures and objects in the way are pushed aside. A second command shrinks it back (only when empty). The tower is extremely hard to damage.`,
    tags: ['wondrous', 'shelter'], source: 'SRD 5.2',
  },
  {
    name: 'Iron Bands', category: 'Magic Item', rarity: 'Rare', weight: '1 lb.',
    description: `Throw the sphere at a Huge or smaller creature within 60 feet as a Magic action, making a ranged attack with your Dexterity modifier + Proficiency Bonus. On a hit it is Restrained until you release it with a Bonus Action. A DC 20 Strength (Athletics) check (one try per creature) breaks and destroys the bands.`,
    tags: ['wondrous', 'restraint'], source: 'SRD 5.2',
  },
  {
    name: 'Iron Flask', category: 'Magic Item', rarity: 'Legendary',
    description: `As a Magic action, target a creature within 60 feet that isn't native to your plane: it makes a DC 17 Wisdom save or is sucked into the flask, where it doesn't age or need to eat or breathe. Releasing it makes it serve you for 1 hour before it is free. The flask holds one creature at a time.`,
    tags: ['wondrous', 'prison'], source: 'SRD 5.2',
  },
  {
    name: 'Javelin of Lightning', category: 'Magic Item', rarity: 'Uncommon',
    damage: '1d6 piercing or lightning', properties: ['Thrown (30/120)'],
    description: `Its hits can deal Lightning damage instead of Piercing. Once per dawn, throw it at a target within 120 feet to become a 5-foot-wide lightning Line: the target and everyone else in the Line make a DC 13 Dexterity save against 4d6 Lightning damage (half on a success), and the javelin reappears in your hand.`,
    tags: ['weapon', 'lightning'], source: 'SRD 5.2',
  },
  {
    name: 'Lantern of Revealing', category: 'Magic Item', rarity: 'Uncommon',
    description: `Burns 6 hours on a pint of oil, shedding Bright Light 30 feet and Dim Light 30 feet beyond. Invisible creatures and objects in its Bright Light are visible. Lower the hood with a Utilize action to dim it to a 5-foot glow.`,
    tags: ['wondrous', 'light'], source: 'SRD 5.2',
  },
  {
    name: 'Luck Blade', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    damage: '+1 to attack and damage', saveBonus: 1,
    description: `Any sword. +1 to attack and damage rolls and +1 to saving throws while carried. Once per dawn you can reroll a failed D20 Test (taking the new roll). It also holds 1d3 charges of Wish, usable once per dawn.`,
    tags: ['weapon', 'luck'], source: 'SRD 5.2',
  },
  {
    name: 'Mace of Disruption', category: 'Magic Item', rarity: 'Rare', attunement: true,
    damage: '1d6 bludgeoning, +2d6 radiant vs Fiends and Undead',
    description: `Fiends and Undead it hits take an extra 2d6 Radiant damage; one left at 25 Hit Points or fewer must pass a DC 15 Wisdom save or be destroyed (on a success it's Frightened until the end of your next turn). It sheds Bright Light 20 feet and Dim Light 20 feet beyond while held.`,
    tags: ['weapon', 'radiant'], source: 'SRD 5.2',
  },
  {
    name: 'Mace of Smiting', category: 'Magic Item', rarity: 'Rare',
    damage: '1d6+1 bludgeoning',
    description: `A +1 mace, +3 against Constructs. On a 20, the target takes an extra 7 Bludgeoning damage (14 against a Construct), and a Construct left at 25 Hit Points or fewer is destroyed.`,
    tags: ['weapon', 'construct'], source: 'SRD 5.2',
  },
  {
    name: 'Mace of Terror', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Three charges, regaining 1d3 at dawn. As a Magic action spend one to terrify creatures you choose within 30 feet: a DC 15 Wisdom save or Frightened for a minute, fleeing from you, unable to make Opportunity Attacks and only able to Dash, repeating the save each turn.`,
    tags: ['weapon', 'fear'], source: 'SRD 5.2',
  },
  {
    name: 'Mantle of Spell Resistance', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `You have Advantage on saving throws against spells.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Manual of Bodily Health', category: 'Magic Item', rarity: 'Very Rare',
    description: `Study it for 48 hours over 6 days or fewer and your Constitution rises by 2 (max 30). It then loses its magic for a century.`,
    tags: ['wondrous', 'book', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Manual of Gainful Exercise', category: 'Magic Item', rarity: 'Very Rare',
    description: `Study it for 48 hours over 6 days or fewer and your Strength rises by 2 (max 30). It then loses its magic for a century.`,
    tags: ['wondrous', 'book', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Manual of Golems', category: 'Magic Item', rarity: 'Very Rare',
    description: `Instructions for building one kind of golem (clay, flesh, iron or stone). A spellcaster with two level 5 slots who spends the listed time and money can build the golem, which obeys its maker; the book burns up in the process. Anyone else who reads it takes 6d6 Psychic damage.`,
    tags: ['wondrous', 'book', 'construct'], source: 'SRD 5.2',
  },
  {
    name: 'Manual of Quickness of Action', category: 'Magic Item', rarity: 'Very Rare',
    description: `Study it for 48 hours over 6 days or fewer and your Dexterity rises by 2 (max 30). It then loses its magic for a century.`,
    tags: ['wondrous', 'book', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Marvelous Pigments', category: 'Magic Item', rarity: 'Very Rare', weight: '1 lb.',
    description: `1d4 pots of paint and a brush. Spend 10 minutes (with Concentration) and one pot to paint objects and terrain within a 20-foot Cube - doors, bridges, pits, trees - and they become real. Painted items worth money are obviously fake, and you can't paint creatures.`,
    tags: ['wondrous', 'creation'], source: 'SRD 5.2',
  },
  {
    name: 'Medallion of Thoughts', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Five charges, regaining 1d4 at dawn. Spend one to cast Detect Thoughts (DC 13).`,
    tags: ['wondrous', 'telepathy'], source: 'SRD 5.2',
  },
  {
    name: 'Mirror of Life Trapping', category: 'Magic Item', rarity: 'Very Rare', weight: '50 lb.',
    description: `Hung on a wall and activated, it traps any creature other than you that sees its reflection within 30 feet and fails a DC 15 Charisma save, in one of twelve extradimensional cells. You can talk to and release prisoners. Breaking the mirror frees everyone.`,
    tags: ['wondrous', 'prison'], source: 'SRD 5.2',
  },
  {
    name: 'Mithral Armor', category: 'Magic Item', rarity: 'Uncommon',
    description: `Any Medium or Heavy armor made of light, flexible mithral: it can be worn under clothing and has no Strength requirement or Stealth Disadvantage.`,
    tags: ['armor'], source: 'SRD 5.2',
  },
  {
    name: 'Mysterious Deck', category: 'Magic Item', rarity: 'Legendary',
    description: `A deck of 13 or 22 cards. You announce how many to draw, then each card drawn has an immediate, often life-changing effect: wealth, a wish, a powerful foe, lost possessions, a level of experience, imprisonment or death. Notoriously dangerous.`,
    tags: ['wondrous', 'random'], source: 'SRD 5.2',
  },
  {
    name: 'Necklace of Adaptation', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You can breathe normally in any environment and have Advantage on saves against being Poisoned.`,
    tags: ['wondrous', 'survival'], source: 'SRD 5.2',
  },
  {
    name: 'Necklace of Fireballs', category: 'Magic Item', rarity: 'Rare',
    description: `Has 1d6 + 3 beads. As a Magic action, throw a bead up to 60 feet to detonate a level 3 Fireball (DC 15). Throwing several at once adds 1d6 per extra bead (max 12d6).`,
    tags: ['wondrous', 'fire'], source: 'SRD 5.2',
  },
  {
    name: 'Necklace of Prayer Beads', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a Cleric, Druid or Paladin. Holds 1d4 + 2 magic beads, each casting one spell as a Bonus Action once per dawn: blessing (Bless), curing (Cure Wounds or Lesser Restoration), favor (Greater Restoration), smiting (a smite spell), summons (Planar Ally) or wind walking (Wind Walk), depending on the bead.`,
    tags: ['wondrous', 'divine'], source: 'SRD 5.2',
  },
  {
    name: 'Nine Lives Stealer', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    damage: '+2 to attack and damage',
    description: `Any sword with +2 to attack and damage rolls and 1d8 + 1 charges. Rolling a 20 against a creature with under 100 Hit Points forces a DC 15 Constitution save or it dies instantly (Constructs and Undead are immune), using a charge.`,
    tags: ['weapon', 'death'], source: 'SRD 5.2',
  },
  {
    name: 'Oathbow', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    damage: '1d8 piercing', properties: ['Ammunition (150/600'],
    description: `A longbow. Speak its oath when you shoot to make the target your sworn enemy for 7 days or until it dies (one at a time). Against it you have Advantage, ignore Half and Three-Quarters Cover and long-range Disadvantage, and hits deal an extra 3d6 Piercing damage; while it lives you have Disadvantage with all other weapons.`,
    tags: ['weapon', 'ranged'], source: 'SRD 5.2',
  },
  {
    name: 'Oil of Etherealness', category: 'Consumable', rarity: 'Rare',
    description: `Takes 10 minutes to apply to a Medium or smaller creature and its gear (one more vial per size above Medium). The creature then gains the effect of Etherealness for 1 hour.`,
    tags: ['potion', 'oil', 'planar'], source: 'SRD 5.2',
  },
  {
    name: 'Oil of Sharpness', category: 'Consumable', rarity: 'Very Rare',
    description: `One vial coats a nonmagical Slashing or Piercing melee weapon or twenty such pieces of ammunition in a minute, turning them into +3 weapons or +3 ammunition.`,
    tags: ['potion', 'oil', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Oil of Slipperiness', category: 'Consumable', rarity: 'Uncommon',
    description: `Applied over 10 minutes to a Medium or smaller creature, it grants Freedom of Movement for 8 hours. Or pour it on the ground as a Magic action to make a 10-foot square of Grease for 8 hours.`,
    tags: ['potion', 'oil'], source: 'SRD 5.2',
  },
  {
    name: 'Pearl of Power', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Attunement by a spellcaster. Once per dawn, as a Magic action, regain one expended spell slot of level 3 or lower.`,
    tags: ['wondrous', 'spellcasting'], source: 'SRD 5.2',
  },
  {
    name: 'Periapt of Health', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Once per dawn, as a Magic action, regain 2d4 + 2 Hit Points. You also have Advantage on saves against being Poisoned.`,
    tags: ['wondrous', 'healing'], source: 'SRD 5.2',
  },
  {
    name: 'Periapt of Proof against Poison', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `You are immune to Poison damage and the Poisoned condition while wearing it.`,
    tags: ['wondrous', 'poison'], source: 'SRD 5.2',
  },
  {
    name: 'Periapt of Wound Closure', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Death Saving Throws of 9 or lower count as 10, and Hit Point Dice you spend to heal restore double.`,
    tags: ['wondrous', 'healing'], source: 'SRD 5.2',
  },
  {
    name: 'Philter of Love', category: 'Consumable', rarity: 'Uncommon',
    description: `The first creature you see within 10 minutes of drinking it Charms you for 1 hour.`,
    tags: ['potion', 'charm'], source: 'SRD 5.2',
  },
  {
    name: 'Pipes of Haunting', category: 'Magic Item', rarity: 'Uncommon',
    description: `Three charges, regaining 1d3 at dawn. Play them as a Magic action and spend a charge: creatures you choose within 30 feet make a DC 15 Wisdom save or are Frightened for a minute (saving again each turn). Those who succeed are immune for 24 hours.`,
    tags: ['wondrous', 'fear'], source: 'SRD 5.2',
  },
  {
    name: 'Pipes of the Sewers', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Ordinary and giant rats leave you alone. Three charges (1d3 at dawn): while playing, spend 1-3 charges to call that many Swarms of Rats from within half a mile, and you can try to bring nearby swarms under your command (DC 15 Wisdom save resists).`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Portable Hole', category: 'Magic Item', rarity: 'Rare',
    description: `A 6-foot black cloth circle. Spread it on a surface as a Magic action to open a 10-foot-deep extradimensional hole; fold it up to close it, contents and all, weighing nothing. A creature trapped inside folded hole can escape in time but risks suffocating. Putting it inside a Bag of Holding or similar is catastrophic.`,
    tags: ['wondrous', 'storage'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Animal Friendship', category: 'Consumable', rarity: 'Uncommon',
    description: `Drinking it lets you cast the level 3 version of Animal Friendship (DC 13).`,
    tags: ['potion'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Clairvoyance', category: 'Consumable', rarity: 'Rare',
    description: `You gain the effect of Clairvoyance, without needing Concentration.`,
    tags: ['potion', 'divination'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Climbing', category: 'Consumable', rarity: 'Common',
    description: `For 1 hour you have a Climb Speed equal to your Speed and Advantage on Strength (Athletics) checks to climb.`,
    tags: ['potion', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Diminution', category: 'Consumable', rarity: 'Rare',
    description: `You gain the shrinking effect of Enlarge/Reduce for 1d4 hours, without needing Concentration.`,
    tags: ['potion'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Flying', category: 'Consumable', rarity: 'Very Rare',
    description: `For 1 hour you have a Fly Speed equal to your Speed and can hover. If you're aloft when it wears off, you fall.`,
    tags: ['potion', 'flight'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Gaseous Form', category: 'Consumable', rarity: 'Rare',
    description: `You gain the effect of Gaseous Form for 1 hour without Concentration, and can end it early as a Bonus Action.`,
    tags: ['potion'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Growth', category: 'Consumable', rarity: 'Uncommon',
    description: `You gain the enlarging effect of Enlarge/Reduce for 10 minutes, without needing Concentration.`,
    tags: ['potion'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Healing (Greater)', category: 'Consumable', rarity: 'Uncommon', cost: '150 GP', weight: '0.5 lb.',
    description: `As a Bonus Action, drink it or give it to a creature within 5 feet; the creature regains 4d4 + 4 Hit Points.`,
    tags: ['potion', 'healing'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Healing (Superior)', category: 'Consumable', rarity: 'Rare', cost: '500 GP', weight: '0.5 lb.',
    description: `As a Bonus Action, drink it or give it to a creature within 5 feet; the creature regains 8d4 + 8 Hit Points.`,
    tags: ['potion', 'healing'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Healing (Supreme)', category: 'Consumable', rarity: 'Very Rare', cost: '5,000 GP', weight: '0.5 lb.',
    description: `As a Bonus Action, drink it or give it to a creature within 5 feet; the creature regains 10d4 + 20 Hit Points.`,
    tags: ['potion', 'healing'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Heroism', category: 'Consumable', rarity: 'Rare',
    description: `For 1 hour you have 10 Temporary Hit Points and the benefit of Bless, without needing Concentration.`,
    tags: ['potion'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Invisibility', category: 'Consumable', rarity: 'Rare',
    description: `You are Invisible for 1 hour, or until you attack, deal damage or cast a spell.`,
    tags: ['potion', 'invisibility'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Mind Reading', category: 'Consumable', rarity: 'Rare',
    description: `You gain the effect of Detect Thoughts (DC 13) for 10 minutes, without needing Concentration.`,
    tags: ['potion', 'telepathy'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Poison', category: 'Consumable', rarity: 'Uncommon',
    description: `Disguised by illusion as a helpful potion (Identify reveals it). The drinker takes 4d6 Poison damage and must pass a DC 13 Constitution save or be Poisoned for 1 hour.`,
    tags: ['potion', 'poison'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Resistance', category: 'Consumable', rarity: 'Uncommon',
    description: `You have Resistance to one damage type (set by the potion: Acid, Cold, Fire, Force, Lightning, Necrotic, Poison, Psychic, Radiant or Thunder) for 1 hour.`,
    tags: ['potion', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Speed', category: 'Consumable', rarity: 'Very Rare',
    description: `You gain the effect of Haste for 1 minute without Concentration, and without the lethargy when it ends.`,
    tags: ['potion'], source: 'SRD 5.2',
  },
  {
    name: 'Potion of Water Breathing', category: 'Consumable', rarity: 'Uncommon',
    description: `You can breathe underwater for 24 hours.`,
    tags: ['potion', 'water'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Animal Influence', category: 'Magic Item', rarity: 'Rare',
    description: `Three charges, regaining 1d3 at dawn. Spend one to cast Animal Friendship, Speak with Animals, or Fear affecting only Beasts (DC 13).`,
    tags: ['ring', 'beast'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Djinni Summoning', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `As a Magic action, summon a particular djinni within 120 feet. It is Friendly and obeys you for as long as you concentrate (up to 1 hour), then can't be called again for 24 hours. If the djinni dies, the ring loses its magic.`,
    tags: ['ring', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Elemental Command', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Linked to one elemental plane. You have Advantage on attacks against Elementals and they have Disadvantage against you, and as a Magic action you can try to command one within 60 feet (DC 18 Wisdom save). Each ring also grants its element's language, resistances, movement and several spells.`,
    tags: ['ring', 'elemental'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Evasion', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Three charges, regaining 1d3 at dawn. When you fail a Dexterity save, you can use your Reaction and a charge to succeed instead.`,
    tags: ['ring', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Feather Falling', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `When you fall, you drift down at 60 feet per round and take no falling damage.`,
    tags: ['ring', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Free Action', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Difficult Terrain costs you no extra movement, and magic can't reduce your Speeds or make you Paralyzed or Restrained.`,
    tags: ['ring', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Invisibility', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `As a Magic action you turn Invisible, staying so until you take the ring off or become visible again as a Bonus Action.`,
    tags: ['ring', 'invisibility'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Jumping', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You can cast Jump on yourself from it at will.`,
    tags: ['ring', 'movement'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Mind Shielding', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Magic can't read your thoughts, tell if you're lying, or learn your alignment or creature type, and telepathy reaches you only if you allow it. You can make the ring invisible as a Magic action. If you die wearing it, your soul can take up residence in it and speak to later wearers.`,
    tags: ['ring', 'mind'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Regeneration', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `While you have at least 1 Hit Point, you regain 1d6 Hit Points every 10 minutes, and lost body parts regrow in 1d6 + 1 days.`,
    tags: ['ring', 'healing'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Resistance', category: 'Magic Item', rarity: 'Rare',
    description: `You have Resistance to one damage type, shown by its gem: pearl Acid, tourmaline Cold, garnet Fire, sapphire Force, citrine Lightning, jet Necrotic, amethyst Poison, jade Psychic, topaz Radiant, spinel Thunder.`,
    tags: ['ring', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Shooting Stars', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Cast Dancing Lights or Light at will. Six charges (1d6 at dawn) power Faerie Fire (1), up to four lightning spheres that zap creatures they approach (2), or a burst of up to fifteen shooting stars dealing Fire damage around a point (1-3).`,
    tags: ['ring', 'lightning'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Spell Storing', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Stores up to 5 levels of spells cast into it by anyone touching it (levels 1-5). The wearer can cast a stored spell, using the original caster's slot level, save DC, attack bonus and spellcasting ability, which frees the space.`,
    tags: ['ring', 'spellcasting'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Spell Turning', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Advantage on saves against spells. If you succeed against a spell of level 7 or lower, it has no effect on you, and if it targeted only you with no area, your Reaction can bounce it back at its caster, who must save against their own DC.`,
    tags: ['ring', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Swimming', category: 'Magic Item', rarity: 'Uncommon',
    description: `You have a Swim Speed of 40 feet.`,
    tags: ['ring', 'water'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Telekinesis', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `You can cast Telekinesis from it at will.`,
    tags: ['ring'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of the Ram', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Three charges, regaining 1d3 at dawn. As a Magic action spend 1-3 charges for a spectral ram's head attack (+7) at a creature within 60 feet: each charge deals 2d10 Force damage and pushes it 5 feet. Or spend charges to batter an unattended object, making a Strength check with +5 per charge.`,
    tags: ['ring', 'force'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Three Wishes', category: 'Magic Item', rarity: 'Legendary',
    description: `Holds 3 charges; spend one to cast Wish. It becomes mundane after the last.`,
    tags: ['ring', 'wish'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Warmth', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Cold damage to you is reduced by 2d8, and you and your gear are unharmed by temperatures of 0 degrees Fahrenheit or lower.`,
    tags: ['ring', 'cold'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of Water Walking', category: 'Magic Item', rarity: 'Uncommon',
    description: `You can cast Water Walk on yourself at will.`,
    tags: ['ring', 'water'], source: 'SRD 5.2',
  },
  {
    name: 'Ring of X-ray Vision', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `As a Magic action, see through solid matter within 30 feet for 1 minute (up to 1 foot of stone, 1 inch of metal or 3 feet of wood or earth; lead blocks it). Each extra use before a Long Rest needs a DC 15 Constitution save or you gain an Exhaustion level.`,
    tags: ['ring', 'senses'], source: 'SRD 5.2',
  },
  {
    name: 'Robe of Eyes', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Advantage on sight-based Wisdom (Perception) checks, and 120-foot Darkvision and Truesight. A Light spell cast on it, or Daylight within 5 feet, Blinds you for up to a minute (Constitution save DC 11 or 15 each turn to recover).`,
    tags: ['wondrous', 'senses'], source: 'SRD 5.2',
  },
  {
    name: 'Robe of Scintillating Colors', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Three charges, regaining 1d3 at dawn. As a Magic action, spend one to blaze with colour until the end of your next turn: Bright Light 30 feet, attack rolls against you have Disadvantage, and creatures in the light that can see you when it starts make a DC 15 Wisdom save or are Stunned for the effect's duration.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Robe of Stars', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    saveBonus: 1,
    description: `+1 to saving throws. Pull one of its six large stars as a Magic action to cast level 5 Magic Missile; 1d6 used stars return each dusk. As a Magic action you can also step into the Astral Plane with your gear, and return the same way.`,
    tags: ['wondrous', 'force', 'planar'], source: 'SRD 5.2',
  },
  {
    name: 'Robe of the Archmagi', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Attunement by a Sorcerer, Warlock or Wizard. Without armor your base AC is 15 + Dexterity modifier, you have Advantage on saves against spells and magical effects, and your spell save DC and spell attack bonus each rise by 2.`,
    tags: ['wondrous', 'spellcasting'], source: 'SRD 5.2',
  },
  {
    name: 'Robe of Useful Items', category: 'Magic Item', rarity: 'Uncommon',
    description: `Covered with patches that become real objects when torn off as a Magic action: two each of a lit lantern, dagger, mirror, pole, coiled rope and sack, plus 4d4 random extras such as coins, a door, a rowboat, a ladder, a pit, potions or war dogs. It's an ordinary robe once all are used.`,
    tags: ['wondrous', 'utility'], source: 'SRD 5.2',
  },
  {
    name: 'Rod of Absorption', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Your Reaction absorbs a spell that targets only you (no area), cancelling it and storing its level as energy - up to 50 levels over the rod's whole life. A spellcaster can spend the stored energy to cast spells using their own slots' worth of levels.`,
    tags: ['rod', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Rod of Alertness', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `While held: Advantage on Wisdom (Perception) checks and Initiative, and you can cast Detect Evil and Good, Detect Magic, Detect Poison and Disease and See Invisibility. Once per dawn, plant it in the ground for 10 minutes of Bright Light (60 feet) that grants you and allies +1 AC and saves and reveals invisible creatures within it.`,
    tags: ['rod', 'detection'], source: 'SRD 5.2',
  },
  {
    name: 'Rod of Lordly Might', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    damage: '1d6+3 bludgeoning',
    description: `A +3 mace with six buttons that turn it into a flaming sword, a battleaxe, a spear, a climbing pole or a battering ram, or lock it in place. It also has three once-per-dawn powers: drain life on a hit, paralyse on a hit, or terrify all nearby enemies.`,
    tags: ['rod', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Rod of Rulership', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Once per dawn, as a Magic action, creatures you choose within 120 feet make a DC 15 Wisdom save or are Charmed for 8 hours, treating you as their trusted leader. Harm or orders against their nature break it.`,
    tags: ['rod', 'charm'], source: 'SRD 5.2',
  },
  {
    name: 'Rod of Security', category: 'Magic Item', rarity: 'Very Rare',
    description: `As a Magic action, take yourself and up to 199 willing creatures you can see to a safe demiplane of your design with food and water. Visitors heal each hour, don't age, and can stay up to 200 days divided by their number.`,
    tags: ['rod', 'shelter'], source: 'SRD 5.2',
  },
  {
    name: 'Rope of Climbing', category: 'Magic Item', rarity: 'Uncommon',
    description: `A 60-foot rope holding up to 3,000 pounds. As a Magic action, command its free end to snake toward a spot (10 feet per turn), tie or untie itself, knot itself into a 50-foot climbing rope (Advantage on climbing checks) or coil up. AC 20, 20 Hit Points, regrows 1 Hit Point every 5 minutes.`,
    tags: ['wondrous', 'climbing'], source: 'SRD 5.2',
  },
  {
    name: 'Rope of Entanglement', category: 'Magic Item', rarity: 'Rare',
    description: `A 30-foot rope. As a Magic action, its end lashes a creature within 20 feet: DC 15 Dexterity save or Restrained. The target can use an action on a DC 15 Strength (Athletics) or Dexterity (Acrobatics) check to escape. AC 20, 20 Hit Points.`,
    tags: ['wondrous', 'restraint'], source: 'SRD 5.2',
  },
  {
    name: 'Scarab of Protection', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    acBonus: 1,
    description: `+1 AC and Advantage on saves against spells. Its 12 charges let your Reaction turn a failed save against Necromancy or an Undead's harmful effect into a success; it crumbles after the last.`,
    tags: ['wondrous', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Shield of Missile Attraction', category: 'Armor', rarity: 'Rare', attunement: true,
    armorClass: '+2', acBonus: 2,
    description: `Resistance to damage from Ranged weapon attacks - but cursed: any Ranged weapon attack aimed at a creature within 10 feet of you is redirected at you. Removing it doesn't end the curse; Remove Curse does.`,
    tags: ['shield', 'cursed'], source: 'SRD 5.2',
  },
  {
    name: 'Shield, +1', category: 'Armor', rarity: 'Uncommon',
    armorClass: '+3', acBonus: 3,
    description: `A magic Shield that gives +1 AC on top of the normal Shield bonus (+3 in total).`,
    tags: ['shield'], source: 'SRD 5.2',
  },
  {
    name: 'Shield, +2', category: 'Armor', rarity: 'Rare',
    armorClass: '+4', acBonus: 4,
    description: `A magic Shield that gives +2 AC on top of the normal Shield bonus (+4 in total).`,
    tags: ['shield'], source: 'SRD 5.2',
  },
  {
    name: 'Shield, +3', category: 'Armor', rarity: 'Very Rare',
    armorClass: '+5', acBonus: 5,
    description: `A magic Shield that gives +3 AC on top of the normal Shield bonus (+5 in total).`,
    tags: ['shield'], source: 'SRD 5.2',
  },
  {
    name: 'Slippers of Spider Climbing', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `You can walk up walls and across ceilings with your hands free and have a Climb Speed equal to your Speed, except on slick surfaces like ice or oil.`,
    tags: ['wondrous', 'climbing'], source: 'SRD 5.2',
  },
  {
    name: 'Sovereign Glue', category: 'Consumable', rarity: 'Legendary',
    description: `1d6 + 1 ounces of glue, kept in a flask lined with Oil of Slipperiness. An ounce covers a 1-foot square and sets in a minute into a bond only Universal Solvent, Oil of Etherealness or Wish can break.`,
    tags: ['wondrous', 'utility'], source: 'SRD 5.2',
  },
  {
    name: 'Spell Scroll', category: 'Consumable', rarity: 'Common',
    description: `A single spell written on a scroll. If the spell is on your class's spell list you can read it to cast it without components; a spell above the level you can cast requires an ability check (DC 10 + the spell's level) or it's wasted. Rarity, save DC and attack bonus rise with the spell's level, from Common (cantrip or level 1) to Legendary (level 9). A Wizard can copy it into a spellbook.`,
    tags: ['scroll', 'spellcasting'], source: 'SRD 5.2',
  },
  {
    name: 'Spellguard Shield', category: 'Armor', rarity: 'Very Rare', attunement: true,
    armorClass: '+2', acBonus: 2,
    description: `While you hold it you have Advantage on saves against spells and magical effects, and spell attack rolls against you have Disadvantage.`,
    tags: ['shield', 'defense'], source: 'SRD 5.2',
  },
  {
    name: 'Sphere of Annihilation', category: 'Magic Item', rarity: 'Legendary',
    description: `A 2-foot sphere of nothingness that destroys any matter it engulfs (Artifacts excepted) and deals 8d10 Force damage to anything that only touches it. A creature within 60 feet can try to steer it with a DC 25 Intelligence (Arcana) check; failure may send it toward the would-be controller.`,
    tags: ['wondrous', 'dangerous'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Charming', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a Bard, Cleric, Druid, Sorcerer, Warlock or Wizard. Ten charges (1d8 + 2 at dawn): cast Charm Person, Command or Comprehend Languages for 1 charge each. Once per dawn turn a failed save against a single-target Enchantment into a success, and spend a charge to reflect such a spell you resist back at its caster.`,
    tags: ['staff', 'charm'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Fire', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Attunement by a Druid, Sorcerer, Warlock or Wizard. Resistance to Fire damage while held. Ten charges (1d6 + 4 at dawn): Burning Hands (1), Fireball (3) or Wall of Fire (4). Spending the last charge risks destroying it.`,
    tags: ['staff', 'fire'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Frost', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Attunement by a Druid, Sorcerer, Warlock or Wizard. Resistance to Cold damage while held. Ten charges (1d6 + 4 at dawn): Fog Cloud (1), Ice Storm (4), Wall of Ice (4) or Cone of Cold (5).`,
    tags: ['staff', 'cold'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Healing', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a Bard, Cleric or Druid. Ten charges (1d6 + 4 at dawn): Cure Wounds (1 charge per spell level, up to 4), Lesser Restoration (2) or Mass Cure Wounds (5).`,
    tags: ['staff', 'healing'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Power', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    damage: '1d6+2 bludgeoning', acBonus: 2, saveBonus: 2,
    description: `Attunement by a Sorcerer, Warlock or Wizard. A +2 quarterstaff that also grants +2 to AC, saving throws and spell attack rolls. Twenty charges (2d8 + 4 at dawn) cast Magic Missile, Ray of Enfeeblement, Levitate, Hold Monster, Cone of Cold, level 5 Fireball or Lightning Bolt, Wall of Force or Globe of Invulnerability. It can deal extra Force damage on hits, and can be broken for a devastating retributive blast.`,
    tags: ['staff', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Striking', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    damage: '1d6+3 bludgeoning',
    description: `A +3 quarterstaff with 10 charges (1d6 + 4 at dawn). On a melee hit, spend up to 3 charges for an extra 1d6 Force damage each.`,
    tags: ['staff', 'weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Swarming Insects', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a Bard, Cleric, Druid, Sorcerer, Warlock or Wizard. Ten charges (1d6 + 4 at dawn): fill a 30-foot Emanation with harmless insects that Heavily Obscure it for others (1), Giant Insect (4) or Insect Plague (5).`,
    tags: ['staff', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of the Magi', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    damage: '1d6+2 bludgeoning',
    description: `Attunement by a Sorcerer, Warlock or Wizard. A +2 quarterstaff granting +2 to spell attacks and Advantage on saves against spells, with 50 charges. Your Reaction can absorb spells that target only you, gaining charges. It casts a long list of spells, from Light and Knock to Fireball, Wall of Fire, Passwall, Telekinesis and Plane Shift. Breaking it unleashes a cataclysmic retributive strike.`,
    tags: ['staff', 'weapon', 'spellcasting'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of the Python', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Throw it within 10 feet as a Magic action and it becomes a Giant Constrictor Snake under your mental command (within 60 feet), acting after you. A Bonus Action turns it back; you then can't use it for an hour. If the snake dies, the staff is destroyed.`,
    tags: ['staff', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of the Woodlands', category: 'Magic Item', rarity: 'Rare', attunement: true,
    damage: '1d6+2 bludgeoning',
    description: `Attunement by a Druid. A +2 quarterstaff giving +2 to spell attacks, with 6 charges for Animal Friendship, Speak with Animals, Barkskin, Locate Animals or Plants, Pass without Trace, Speak with Plants, Awaken or Wall of Thorns. Spend a charge to plant it and become a 60-foot tree, which turns back on command.`,
    tags: ['staff', 'nature'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Thunder and Lightning', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    damage: '1d6+2 bludgeoning',
    description: `A +2 quarterstaff with five powers, each once per dawn: extra 2d6 Lightning damage on a hit; a thunderclap that Stuns the target (DC 17 Constitution); both together; a Lightning Bolt-style strike; and a Thunderclap that Deafens and damages creatures around you.`,
    tags: ['staff', 'lightning', 'thunder'], source: 'SRD 5.2',
  },
  {
    name: 'Staff of Withering', category: 'Magic Item', rarity: 'Rare', attunement: true,
    damage: '1d6 bludgeoning',
    description: `A magic quarterstaff with 3 charges (1d3 at dawn). On a hit, spend one to deal an extra 2d10 Necrotic damage and force a DC 15 Constitution save; on a failure the target has Disadvantage on Strength and Constitution checks and saves for 1 hour.`,
    tags: ['staff', 'necrotic'], source: 'SRD 5.2',
  },
  {
    name: 'Stone of Controlling Earth Elementals', category: 'Magic Item', rarity: 'Rare', weight: '5 lb.',
    description: `Once per dawn, touching it to the ground, summon an Earth Elemental within 30 feet as a Magic action. It obeys you and acts after you for 1 hour, until it dies, or until you dismiss it as a Bonus Action.`,
    tags: ['wondrous', 'summon'], source: 'SRD 5.2',
  },
  {
    name: 'Stone of Good Luck', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `While carried, it gives +1 to your ability checks and saving throws.`,
    tags: ['wondrous', 'luck'], source: 'SRD 5.2',
  },
  {
    name: 'Sun Blade', category: 'Magic Item', rarity: 'Rare', attunement: true,
    damage: '1d8+2 radiant', properties: ['Finesse', 'Versatile (1d10)'],
    description: `A sword hilt that sprouts a blade of radiance as a Bonus Action. It counts as a +2 finesse longsword dealing Radiant damage, with an extra 1d8 Radiant against Undead. Its blade sheds sunlight, Bright Light 15 feet and Dim Light 15 feet beyond, adjustable up to 30 feet each.`,
    tags: ['weapon', 'radiant'], source: 'SRD 5.2',
  },
  {
    name: 'Talisman of Pure Good', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Attunement by a Cleric or Paladin. A Holy Symbol giving +2 to spell attacks; Fiends and Undead that touch it take 8d6 Radiant damage. Seven charges let you open a fiery fissure under a creature within 120 feet: a DC 20 Dexterity save (Fiends and Undead with Disadvantage) or it is destroyed utterly; on a success it takes 4d6 Psychic damage.`,
    tags: ['wondrous', 'radiant', 'divine'], source: 'SRD 5.2',
  },
  {
    name: 'Talisman of the Sphere', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `Advantage on Intelligence (Arcana) checks to control a Sphere of Annihilation, and you can move a sphere you control 10 feet plus 10 times your Intelligence modifier as a Magic action.`,
    tags: ['wondrous'], source: 'SRD 5.2',
  },
  {
    name: 'Talisman of Ultimate Evil', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    description: `A Holy Symbol of evil giving +2 to spell attacks; anyone but a Fiend or Undead who touches it takes 8d6 Necrotic damage. Six charges let you open a fiery fissure under a creature within 120 feet: a DC 20 Dexterity save (Celestials with Disadvantage) or it is destroyed utterly; on a success it takes 4d6 Psychic damage.`,
    tags: ['wondrous', 'necrotic'], source: 'SRD 5.2',
  },
  {
    name: 'Tome of Clear Thought', category: 'Magic Item', rarity: 'Very Rare',
    description: `Study it for 48 hours over 6 days or fewer and your Intelligence rises by 2 (max 30). It then loses its magic for a century.`,
    tags: ['wondrous', 'book', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Tome of Leadership and Influence', category: 'Magic Item', rarity: 'Very Rare',
    description: `Study it for 48 hours over 6 days or fewer and your Charisma rises by 2 (max 30). It then loses its magic for a century.`,
    tags: ['wondrous', 'book', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Tome of Understanding', category: 'Magic Item', rarity: 'Very Rare',
    description: `Study it for 48 hours over 6 days or fewer and your Wisdom rises by 2 (max 30). It then loses its magic for a century.`,
    tags: ['wondrous', 'book', 'ability score'], source: 'SRD 5.2',
  },
  {
    name: 'Trident of Fish Command', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    damage: '1d8 piercing', properties: ['Thrown (20/60)', 'Versatile (1d10)'],
    description: `Three charges, regaining 1d3 at dawn. Spend one to cast Dominate Beast (DC 15) on a Beast with a Swim Speed.`,
    tags: ['weapon', 'water'], source: 'SRD 5.2',
  },
  {
    name: 'Universal Solvent', category: 'Consumable', rarity: 'Legendary',
    description: `A tube holding 1d6 + 1 ounces. Each ounce, poured as a Utilize action, dissolves a square foot of any adhesive, even Sovereign Glue.`,
    tags: ['wondrous', 'utility'], source: 'SRD 5.2',
  },
  {
    name: 'Vicious Weapon', category: 'Magic Item', rarity: 'Rare',
    description: `Any weapon. When you roll a 20 on an attack roll with it, the target takes an extra 7 damage of the weapon's type.`,
    tags: ['weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Vorpal Sword', category: 'Magic Item', rarity: 'Legendary', attunement: true,
    damage: '+3 to attack and damage',
    description: `A +3 slashing sword that ignores Resistance to Slashing damage. Rolling a 20 against a creature with a head cuts one off, killing it if it can't live without it. Creatures immune to Slashing damage, headless or too huge take an extra 30 Slashing damage instead, and Legendary Resistance can be spent to avoid decapitation.`,
    tags: ['weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Binding', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a spellcaster. Seven charges (1d6 + 1 at dawn): Hold Person (2) or Hold Monster (5), DC 17. Spending the last charge risks destroying it.`,
    tags: ['wand', 'restraint'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Enemy Detection', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Seven charges (1d6 + 1 at dawn). As a Magic action, spend one: for a minute you know the direction (not distance) of the nearest Hostile creature within 60 feet, even if it's invisible, ethereal, disguised or hidden.`,
    tags: ['wand', 'detection'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Fear', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Seven charges (1d6 + 1 at dawn), DC 15: Command limited to "flee" or "grovel" (1) or Fear in a 60-foot Cone (3).`,
    tags: ['wand', 'fear'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Fireballs', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a spellcaster. Seven charges (1d6 + 1 at dawn). Spend 1-3 to cast Fireball (DC 15) at level 3, plus one level per extra charge.`,
    tags: ['wand', 'fire'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Lightning Bolts', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a spellcaster. Seven charges (1d6 + 1 at dawn). Spend 1-3 to cast Lightning Bolt (DC 15) at level 3, plus one level per extra charge.`,
    tags: ['wand', 'lightning'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Magic Detection', category: 'Magic Item', rarity: 'Uncommon',
    description: `Three charges, regaining 1d3 at dawn. Spend one to cast Detect Magic.`,
    tags: ['wand', 'detection'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Paralysis', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Attunement by a spellcaster. Seven charges (1d6 + 1 at dawn). As a Magic action, a blue ray hits a creature within 60 feet: DC 15 Constitution save or Paralyzed for a minute, saving again each turn.`,
    tags: ['wand', 'paralysis'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Polymorph', category: 'Magic Item', rarity: 'Very Rare', attunement: true,
    description: `Attunement by a spellcaster. Seven charges (1d6 + 1 at dawn). Spend one to cast Polymorph (DC 15).`,
    tags: ['wand', 'transmutation'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Secrets', category: 'Magic Item', rarity: 'Uncommon',
    description: `Three charges (1d3 at dawn). As a Magic action, spend one: if a secret door or trap is within 60 feet, the wand points to the nearest.`,
    tags: ['wand', 'detection'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of the War Mage', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Attunement by a spellcaster. +1 to spell attack rolls (+2 Rare, +3 Very Rare), and your spell attacks ignore Half Cover.`,
    tags: ['wand', 'spellcasting'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Web', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Attunement by a spellcaster. Seven charges (1d6 + 1 at dawn). Spend one to cast Web (DC 15).`,
    tags: ['wand', 'restraint'], source: 'SRD 5.2',
  },
  {
    name: 'Wand of Wonder', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `Seven charges (1d6 + 1 at dawn). As a Magic action, spend one and pick a point within 120 feet: a random effect erupts there, from Fireball or Lightning Bolt to a rain of butterflies, a sudden rhinoceros, grass sprouting, or the wielder turning blue. Spells use DC 15.`,
    tags: ['wand', 'random'], source: 'SRD 5.2',
  },
  {
    name: 'Weapon of Warning', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `While it's within your reach, you and allies within 30 feet have Advantage on Initiative, and anyone naturally asleep wakes when combat begins.`,
    tags: ['weapon', 'initiative'], source: 'SRD 5.2',
  },
  {
    name: 'Weapon, +2', category: 'Magic Item', rarity: 'Rare',
    damage: '+2 to attack and damage',
    description: `Any weapon. +2 to attack and damage rolls made with it.`,
    tags: ['weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Weapon, +3', category: 'Magic Item', rarity: 'Very Rare',
    damage: '+3 to attack and damage',
    description: `Any weapon. +3 to attack and damage rolls made with it.`,
    tags: ['weapon'], source: 'SRD 5.2',
  },
  {
    name: 'Well of Many Worlds', category: 'Magic Item', rarity: 'Legendary',
    description: `Unfold the cloth on a surface as a Magic action to open a two-way, 6-foot portal to another world or plane of the DM's choosing, until someone folds it up. It can't open again for 1d8 hours.`,
    tags: ['wondrous', 'planar'], source: 'SRD 5.2',
  },
  {
    name: 'Wind Fan', category: 'Magic Item', rarity: 'Uncommon',
    description: `Cast Gust of Wind (DC 13) from it. Each further use before dawn has a cumulative 20 percent chance of tearing it to useless shreds.`,
    tags: ['wondrous', 'air'], source: 'SRD 5.2',
  },
  {
    name: 'Winged Boots', category: 'Magic Item', rarity: 'Uncommon', attunement: true,
    description: `Four charges, regaining 1d4 at dawn. As a Magic action, spend one to fly at 30 feet for 1 hour, descending gently at 30 feet per round when it ends.`,
    tags: ['wondrous', 'flight'], source: 'SRD 5.2',
  },
  {
    name: 'Wings of Flying', category: 'Magic Item', rarity: 'Rare', attunement: true,
    description: `As a Magic action the cloak becomes wings granting a 60-foot Fly Speed for up to 1 hour. If you're aloft when they vanish, you fall, and they can't be used again for 1d12 hours.`,
    tags: ['wondrous', 'flight'], source: 'SRD 5.2',
  },

  // ─────────────────────────────── CATALYSTS ───────────────────────────────
  {
    name: 'Field Catalyst (example)', category: 'Catalyst', rarity: 'Common', capacity: '50', throughput: '5',
    description: `EXAMPLE ENTRY - replace with your own Catalysts.

A thumb-sized crystal set in a bronze clasp, the sort issued to academy apprentices. It can hold a lot of Mana but can only route a little at once - the codex's own example of why battery size does not grant mastery over high Potency.

Capacity is how much Mana a Catalyst stores; Throughput is how much it can safely discharge through Tendril in one invocation.`,
    tags: ['catalyst', 'example'], source: 'Arcane Compositry codex p.13',
  },
];
