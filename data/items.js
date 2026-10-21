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

  // ─────────────────────────────── CATALYSTS ───────────────────────────────
  {
    name: 'Field Catalyst (example)', category: 'Catalyst', rarity: 'Common', capacity: '50', throughput: '5',
    description: `EXAMPLE ENTRY - replace with your own Catalysts.

A thumb-sized crystal set in a bronze clasp, the sort issued to academy apprentices. It can hold a lot of Mana but can only route a little at once - the codex's own example of why battery size does not grant mastery over high Potency.

Capacity is how much Mana a Catalyst stores; Throughput is how much it can safely discharge through Tendril in one invocation.`,
    tags: ['catalyst', 'example'], source: 'Arcane Compositry codex p.13',
  },
];
