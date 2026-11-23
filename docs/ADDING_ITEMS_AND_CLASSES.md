# Adding items, weapons, classes, subclasses, summons and NPCs

Items and classes work the same way spells do (see
[ADDING_SPELLS.md](ADDING_SPELLS.md)): use your **campaign's DM tabs**, or edit a **data
file**. Both combine.

| List              | Campaign DM tab   | Data file         |
| ----------------- | ----------------- | ----------------- |
| Items & Weapons   | Items & Weapons   | `data/items.js`   |
| Classes           | Classes > Classes | `data/classes.js` |
| Subclasses        | Classes > Subclasses | `data/subclasses.js` |
| Summons & Familiars | Summons & Familiars | `data/summons.js` |
| NPCs & Enemies    | NPCs & Enemies (DM only) | `data/npcs.js` |

In your campaign's DM tabs, **Edit** works on any entry. Editing an entry that comes from a
file saves your version on top ("Edited here"); **Undo edits** brings the file
version back. **Delete** removes entries added in your campaign's DM tabs.

After editing a data file by hand, check it:

```bash
node scripts/check-spells.js
```

## Items & weapons

Only **name**, **category** and **description** are required.

| Field        | Used for                                                         |
| ------------ | ---------------------------------------------------------------- |
| `category`   | Weapon, Armor, Item, Adventuring Gear, Tool, Consumable, Magic Item, Catalyst (use **Item** for anything that fits nowhere else) |
| `rarity`     | Mundane (default), Common, Uncommon, Rare, Very Rare, Legendary, Artifact |
| `cost`, `weight` | Free text: `'15 GP'`, `'3 lb.'`                              |
| `attunement` | `true` if it needs attunement                                    |
| `damage`, `properties`, `mastery` | Weapons                                     |
| `armorClass` | Armor and shields (text shown to the player)                     |
| `acBonus`    | Number added to Armor Class automatically while the item is in use (Shield 2, Cloak of Protection 1) |
| `saveBonus`  | Number added to every saving throw automatically while the item is in use |
| `hidden`     | `true` to hide it from players until you publish it (see ADDING_SPELLS.md, "Hidden or public") |
| `chainTrait` | What the weapon does in an Attack Chain (codex p.23)             |
| `capacity`, `throughput` | Catalysts                                            |
| `tags`       | Search keywords                                                  |

To add a new category or rarity, add its name to `ITEM_CATEGORIES` or
`ITEM_RARITIES` in `shared/rules/constants.js`.

**How items work on a character sheet**

- A **Weapon** becomes a row in *Weapons & Attacks* (Core & Combat tab), with
  its damage, properties and Chain trait filled in. Players can also add one
  from inside the sheet with **Add from Items & Weapons**.
- Everything else goes into the sheet's **Inventory** (Features & Gear tab).
  Each row has:
  - **In use / worn** - tick it to apply the item's `acBonus` and `saveBonus`.
  - **Needs attunement** / **Attuned** - an item that needs attunement only
    counts once it is both in use and attuned.
  - **Item details** - opens the item's full description without leaving the
    sheet.
- The sheet shows **Total AC** = the base AC the player typed + items in use,
  and saving throws include the save bonus.
- A **Catalyst** also fills the sheet's *Catalyst* panel if it is empty.
- The numbers on an inventory row are a copy, so a player (or you) can adjust
  them on that one sheet without changing the item for everyone.

Base armor (Leather, Chain Mail...) is not applied automatically - the player
types their armor's AC into *Armor Class (base)*. Only flat bonuses are added.

## Classes

The twelve D&D (2024) classes ship in `data/classes.js`, each with its features
by level. Their subclasses live in their own list (see **Subclasses** below). The text is a short summary for table reference;
edit any class to add as much detail as you want.

### Add a custom class in your campaign's DM tabs

Your campaign (as DM) > **Classes** > **New class**. The form asks for:

- **Name**, **Hit Die**, the **two saving throws**, and how many skills it picks.
- **Invocation ability** - the ability used for Arcane attacks and Save DC.
- **Mana pool** - Full (100%), Partial (about 65%) or Martial (about 40%).
- A one-line summary, a description, proficiencies and starting equipment.
- **In Arcane Compositry** - how the class plays with Mana, Chains and
  Applied Thaumaturgy.
- **Class features**, one per line:

  ```
  1 | Rune Carving | You can inscribe a rune on a weapon or shield.
  2 | Mana Etching | Store Mana in a rune.
  3 | Runesmith Subclass | Choose a forge.
  ```

Then add its subclasses under **Classes > Subclasses** (below).

As soon as it is saved, the class:

- appears on the **Classes** page with its own page,
- can be chosen on the **New character** form (Hit Points, saving throws,
  Invocation ability and Mana pool are set from it),
- appears in the class filter on the spell pages, and
- can be ticked on a spell's "Classes that may learn it" list.

### Or add it to the data file

Copy the template at the top of `data/classes.js`. Features are written as
`[level, 'Name', 'What it does']`.

### Changing a class's numbers

Hit Die, saving throws, Invocation ability and Mana pool type are fields on the
class, so change them with **Edit** in your campaign's DM tabs (or in the data file). The
Mana pool *percentages* themselves (65% and 40%) are in
`shared/rules/formulas.js` under `CASTER_TYPES`.

A class's `id` is made from its name. Do not rename a class that characters and
spells already use - they remember it by name. Add a new class instead.

## Subclasses

All 48 subclasses from the 2024 Player's Handbook ship in
`data/subclasses.js`. Each has its features at the right levels with a short
summary of what each one does (check exact wording against your book).

On a class's page, the **Subclasses** section lists every subclass whose parent
is that class. Clicking one opens its details: the description, a level-by-level
table of what it adds to the parent class, and an optional Arcane Compositry
note.

### Add a custom subclass

Your campaign (as DM) > **Classes** > **Subclasses** > **New subclass**:

- **Name** and **Parent class** (any class, including your custom ones).
- **Description**.
- **What it adds to the class**, one feature per line:

  ```
  3 | Bramble Hide | While raging, attackers take 1d4 Piercing damage.
  6 | Rooted Fury | You cannot be moved while raging.
  10 | Thorn Burst | Spend a Rage use: 15-foot burst, 4d6 Piercing.
  ```

- **In Arcane Compositry** (optional) and **Visibility** (Public or Hidden).

It appears under its parent class straight away, marked "Custom", and is offered
as a suggestion in the Subclass box on character sheets of that class. Hide it
to keep it secret until a player unlocks it.

To move a subclass to a different parent, edit it and change **Parent class**.

## Summons & Familiars

The **Summons & Familiars** page (`/summons`) lists every creature a spell or
feature can call up, with its full stat block - so when a spell says "uses the
*Draconic Spirit* stat block", players can look it up. It is public, like Items.
The SRD 5.2 entries ship in `data/summons.js`: the spell summons (Draconic
Spirit, Giant Insect, Otherworldly Steed, Animated Object), the Find Familiar
forms, the Pact of the Chain forms, Phantom Steed's Riding Horse, and the undead
from Animate Dead and Create Undead.

Your campaign (as DM) > **Summons & Familiars** > **New summon**. The form is the
NPC stat block (below) plus:

| Field | Used for |
| ----- | -------- |
| Category | Conjured Creature, Familiar, Special Familiar, Steed, Undead Servant, Animated Object, Companion, Other (`SUMMON_CATEGORIES` in `shared/rules/constants.js`) |
| Summoned by | Spells or features that call it, comma separated. A name that matches a spell links to it, and that spell shows a link back to the stat block. |
| Scales with spell level from | The spell's lowest level, when AC or HP mention "the spell's level". The page then has a **Cast at spell level** picker, and the Initiative Tracker asks for the level. |

AC and HP like `14 + the spell's level`, `10 + 1 per spell level`,
`5 + 10 per spell level` or `50 + 10 for each spell level above 5` are worked out
for the chosen level (`scaleBySpellLevel()` in `shared/rules/formulas.js`).
Hide / Publish works as for items.

### Companions: Static or Dynamic

Choosing the **Companion** category shows **Companion type**:

- **Static** - a standard stat block, like every other category.
- **Dynamic** - a permanent pet that gains levels with its owner. The stat block
  you enter is its **level 1**, and these boxes appear:

  | Field | At level L |
  | ----- | ---------- |
  | HP gained per level | Hit Points = level-1 HP + this x (L - 1) |
  | +1 AC every ... levels | e.g. 4: +1 AC at levels 5, 9, 13, 17 |
  | Ability scores that grow, +1 every ... levels | e.g. STR and DEX every 2: +1 each at 3, 5, 7... (max 30) |
  | Features gained by level | `Level \| Name \| What it does`, one per line; each appears once it reaches that level |

  Its Proficiency Bonus follows its level automatically. The numbers are worked
  out in `web/src/lib/summons.ts` (`summonStats`), so the Summons & Familiars
  page (with a **Companion level** picker), the character sheet and the
  Initiative Tracker all agree.

### On a character sheet

Core & Combat > **Summons & Familiars** > **Add from Summons & Familiars**. A
character can keep several at once. Each row shows its name (rename it - "Hoot
the Owl"), HP with +/- buttons, Max HP, Temp HP, AC, Initiative, Speed, Passive
Perception and PB / CR, plus **Details** (the full stat block), **Full HP** and
**Remove**. A spell summon that scales has a **Cast at level** box; a Dynamic
companion has a **Level** box (it starts at the character's level, with a
button to match it again). Changing either recalculates Max HP, and current HP
moves by the same amount.

The row keeps a copy of the stat block, so a later DM edit does not change a
summon already on a sheet - remove it and add it again to pick the edit up.

## NPCs & Enemies (DM only)

Your campaign (as DM) > **NPCs & Enemies**. This list is **never sent to players**: the
server only answers the group's DMs, and `data/npcs.js` is outside the public
folder. There is no Hide / Publish button because nothing here is ever public.

**View** opens a 2024-style stat block; **Edit** opens the form. The form
follows the 2024 Monster Manual layout, plus Arcane Compositry sections:

| Section            | Fields                                                           |
| ------------------ | ---------------------------------------------------------------- |
| Identity           | Name, Kind (NPC / Ally / Enemy / Boss), Size, Creature type, Alignment, Challenge Rating, Proficiency Bonus |
| Defenses           | Armor Class, Initiative, Hit Points, Speed                       |
| Abilities          | The six scores (modifiers are worked out), Saving throws, Skills |
| Damage & senses    | Vulnerabilities, Resistances, Immunities, Senses, Languages, Gear |
| What it does       | Traits, Actions, Bonus actions, Reactions, Legendary actions - one per line: `Name \| What it does` |
| Attack Chains      | Max Chain Length, Guard (blank = 2 + PB), Momentum Die habits    |
| Arcane Profile     | Invocation ability, Maximum Potency, Mana, Temperament, known Physicals / Aspects / Forms, Signature Compositions (codex page 18) |
| Story              | Location, Faction, Description & roleplay, private DM notes, Tags |

Only the name and description are required. For a spellcasting NPC, choosing an
**Invocation ability** makes the stat block show its Arcane attack bonus and
Save DC, worked out from that ability score and the Proficiency Bonus. Roll its
turns with the Enemy Compositor roller on the Calculators page.

Two example entries ship with the site; edit or delete them.
