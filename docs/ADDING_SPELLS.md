# Adding spells

There are two spell lists:

- **Codified** - normal D&D spells. They keep their usual statistics and cost
  Mana by spell level (cantrip 0, then 2 / 3 / 5 / 6 / 7 / 9 / 10 / 11 / 13).
- **Compositry** - custom Compositions your table has invented and codified.

And two ways to add to either list. Use whichever you like; they combine.

## Way 1 - the DM page (no code)

1. Sign in with your DM account and open **DM** in the menu.
2. On the **Spells** tab choose *Codified* or *Compositry*, then **New spell**.
3. Fill in the form and tick the classes that may learn it. Save.

The spell appears in the index straight away for everyone.

- **Edit** works on any spell. Editing a spell that comes from a file saves
  your version on top of it ("Edited here"); **Undo edits** brings the file
  version back.
- **Delete** removes spells added on the DM page. Characters that already have
  the spell keep their copy on their sheet.

Spells added this way are stored in the database (`storage/arcane.db`), so
they are included when you back that file up.

## Way 2 - the data files

Open `data/spells/codified.js` or `data/spells/compositry.js`. Each file starts
with a template. Copy it, paste it inside the list, fill it in, save, refresh
the browser. No restart needed.

```js
{
  name: 'Thorn Whip',
  level: 0,                       // 0 = cantrip
  school: 'Transmutation',
  classes: ['Druid'],
  castingTime: 'Action',
  range: '30 feet',
  components: 'V, S, M (the stem of a plant with thorns)',
  duration: 'Instantaneous',
  description: `You create a vine-like whip covered in thorns...`,
  tags: ['damage', 'nature'],
},
```

Then check your work:

```bash
node scripts/check-spells.js
```

It lists any mistake in plain English, for example
`unknown class "Wizzard"`. A spell with a mistake is skipped (the others still
load) and the same message is printed in the server window.

### Rules for the fields

| Field         | Rule                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `name`        | Required.                                                            |
| `id`          | Optional. Lowercase with dashes, unique in its list. Made from the name if left out. Do not change it later - characters remember spells by id. |
| `school`      | One of: Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation. |
| `classes`     | At least one class name, or `['Any']` for everyone.                  |
| `description` | Required. Leave a blank line between paragraphs.                     |
| `tags`        | Optional search keywords.                                            |
| `level`       | Codified only. 0-9.                                                  |
| `potency`     | Compositry only. 1-9.                                                |
| `mana`        | Compositry only. The final cost after any codification discount. Build the spell in the Spellcrafter to get the number. |

Write the text using backticks (`` ` ``) so it can span several lines. If your
text itself contains a backtick or `${`, put a backslash in front of it.

## Hidden or public

Every spell, Component, item and class is either **public** (players see it)
or **hidden** (only DM accounts see it). Use it to prepare things ahead of
time - an enemy's weapon, an undiscovered Component - and reveal them when the
players earn them.

- On the DM page every row shows **Public** or **Hidden**, with a **Hide** /
  **Publish** button. It works on everything, including the entries that
  shipped with the site.
- The add / edit form has a **Visibility** box, so a new entry can start hidden.
- In a data file, write `hidden: true` to make an entry start hidden. The
  button on the DM page still overrides it.
- DM accounts see hidden entries everywhere (marked "Hidden"), so you can still
  add a hidden item or spell to a player's sheet. The player keeps the row on
  their sheet, but cannot open its details until you publish it.

## Physical & Aspectual Components

The third tab on the Spells page lists the Components that Compositions are
built from. They are added like spells: DM page > Spells > **Physical &
Aspectual**, or `data/components.js`.

| Field          | Rule                                                        |
| -------------- | ----------------------------------------------------------- |
| `name`         | Required. This is what players pick in the Spellcrafter.    |
| `kind`         | `Physical` (what exists?) or `Aspectual` (what property is applied?) |
| `description`  | Required.                                                   |
| `tendrilColor` | Optional: the colour its Tendril route glows.               |
| `interactions` | Optional: known Composites and counters.                    |
| `hidden`       | `true` to keep it secret until it is discovered.            |

A character does **not** know every Component. Each sheet's *Known Arcane
Language* panel lists what that character has learned; players add one with
**Learn a Physical / Aspectual** on the sheet, or **Add to character** on the
Components tab. When a player crafts *as a character*, the Spellcrafter offers
only that character's Components.

Do not rename a Component that characters already know - sheets remember it by
name. Add a new one instead.

## Filters and tags

The spell pages filter on:

- **Class** - the `classes` list (spells marked `Any` match every class).
- **School (type)** - the `school`.
- **Level / Potency** - `level` or `potency`.
- **Search** - looks in the name, description, tags, school, classes, and for
  Compositry spells the Components, Form and creator.

So to make a spell easy to find, give it good `tags`.

## The class rule

When a player presses **Add to character**, the site compares the character's
class with the spell's `classes`:

- class is listed (or the spell says `Any`) - added.
- class is not listed - the player sees a warning naming the allowed classes
  and must confirm. This covers multiclassing, feats and DM rulings.

To make it strict instead, open `public/js/spellbook.js` and change

```js
export const CLASS_RULE = 'warn';
```

to `'block'`. Players can then only add spells on their class list; DM
accounts can still add anything to anyone.

## Adding a new school, Component or Form

Open `public/js/rules/constants.js`. Each list has a comment explaining its
entries. Add a line and it appears in every filter, dropdown and the spell
checker.

## Adding a new class

Classes are added on the DM page (Classes tab) or in `data/classes.js` - see
[ADDING_ITEMS_AND_CLASSES.md](ADDING_ITEMS_AND_CLASSES.md). Once a class
exists, it can be ticked on any spell.
