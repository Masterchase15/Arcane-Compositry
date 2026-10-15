# Dungeons & Dragons: Arcane Compositry - companion site

A companion website for the Arcane Compositry expansion: the full rules codex,
a Spellcrafter and calculators for every formula, searchable indexes for
spells, items and classes, saved character sheets, and DM notebooks. Works on
desktop and phones and can be installed as a web app.

## Start it

You need [Node.js](https://nodejs.org) 22.13 or newer. Nothing else to install.

```bash
node server.js
```

Then open <http://localhost:3000>. On Windows you can also double-click
`start.bat`. To stop it, press Ctrl+C in its window (or close the window).

**Restart it after changing anything in the `server/` folder or `server.js`.**
Changes under `public/` and `data/` only need a browser refresh.

**The first account you create becomes the DM.** Create yours before sharing
the address with players.

## What is where

| You want to...                              | Go to                                              |
| ------------------------------------------- | -------------------------------------------------- |
| **Change a Mana cost, damage number or any formula** | `public/js/rules/formulas.js` - see [Tuning the numbers](#tuning-the-numbers) below |
| **Edit, add to or re-table the Codex**      | `public/js/rules/codex-content.js` - see [Editing the Codex](#editing-the-codex) below |
| Add or edit a spell                         | DM page, or `data/spells/` - [docs/ADDING_SPELLS.md](docs/ADDING_SPELLS.md) |
| Add or edit a Physical / Aspectual Component | DM page (Spells > Physical & Aspectual), or `data/components.js` - [docs/ADDING_SPELLS.md](docs/ADDING_SPELLS.md) |
| Add a custom subclass to any class          | DM page (Classes > Subclasses), or `data/subclasses.js` - [docs/ADDING_ITEMS_AND_CLASSES.md](docs/ADDING_ITEMS_AND_CLASSES.md#subclasses) |
| Add an NPC or enemy (DM only)               | DM page (NPCs & Enemies), or `data/npcs.js` - [docs/ADDING_ITEMS_AND_CLASSES.md](docs/ADDING_ITEMS_AND_CLASSES.md#npcs--enemies-dm-only) |
| Run a fight (turn order, HP, Guard)         | DM page > **Initiative Tracker** - [docs/INITIATIVE_TRACKER.md](docs/INITIATIVE_TRACKER.md) |
| Hide something from players, or publish it  | DM page: the **Hide / Publish** button on any row - [docs/ADDING_SPELLS.md](docs/ADDING_SPELLS.md#hidden-or-public) |
| Add or edit an item, weapon or class        | DM page, or `data/items.js` / `data/classes.js` - [docs/ADDING_ITEMS_AND_CLASSES.md](docs/ADDING_ITEMS_AND_CLASSES.md) |
| Add a school, Form or item category         | `public/js/rules/constants.js`                     |
| Add a field to the character sheet          | `public/js/rules/character.js` + `public/js/pages/sheet.js` |
| Add a calculator                            | `public/js/calculators.js`                         |
| Change colours or fonts                     | top of `public/css/styles.css`                     |
| Put it online / install it as an app        | [docs/DEPLOYING.md](docs/DEPLOYING.md)             |
| Understand how the pieces fit               | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)       |

Every file starts with a comment explaining what it does and how to extend it.

After any edit: **save the file and refresh the browser.** There is no build
step and (for everything under `public/` and `data/`) no restart.

---

## Tuning the numbers

Every number the site calculates lives in **one file**:

```
public/js/rules/formulas.js
```

The Spellcrafter, all the calculators, the character sheet's automatic values
and most Codex tables read from it. Change a number there and all of them
follow.

### Spellcraft page - what to change for each number

| What you see on the Spellcraft page        | Name in `formulas.js`          | What it looks like |
| ------------------------------------------ | ------------------------------ | ------------------ |
| Core Mana for each Potency (I-IX)          | `POTENCY`                      | `{ core: 5, meaning: 'Major encounter magic' }` - one line per Potency |
| Cost of 2, 3, 4 Components                 | `compositeCost()`              | `if (n === 2) return 1;` |
| Range options and their cost               | `RANGE_COSTS`                  | `{ id: '60', label: '60 ft', cost: 1 }` |
| Area options and their cost                | `AREA_COSTS`                   | same shape |
| Duration options and their cost            | `DURATION_COSTS`               | same, plus `concentration: true/false` |
| "Remove Concentration (+2)"                | `REMOVE_CONCENTRATION_COST`    | `= 2` |
| Effect ranks: Mana cost and dice traded away | `EFFECT_RANKS`               | `{ id: 'strong', label: 'Strong', examples: '...', cost: 2 }` |
| Environmental discount (-1, minimum 1)     | inside `finalMana()`           | `{ label: 'Environmental discount', value: -1 }` and `Math.max(1, sum)` |
| How many damage dice a Potency gives       | `damageDice()`                 | `p + 2 + Math.floor(p / 3)` |
| Which die each delivery rolls (d8/d10/d6/d4) | `DELIVERIES`                 | `{ id: 'area', label: 'Area effect', die: 6 }` |
| Arcane attack bonus                        | `arcaneAttackBonus()`          | `pb + im` |
| Save DC                                    | `arcaneSaveDC()`               | `8 + pb + im` |
| Circuit Stability DC                       | `stabilityDC()`                | base 10, `floor(Potency / 2)`, `floor(Damage / 10)` |
| DC to Read the Circuit                     | `readCircuitDC()`              | `10 + potency` |
| How a damage pool splits over a Chain      | `splitChain()`                 | |
| Which die each **Form** suggests           | `FORMS` in `constants.js`      | `{ name: 'Burst', delivery: 'area' }` |

### Everything else

| Number                                     | Name in `formulas.js`          |
| ------------------------------------------ | ------------------------------ |
| Mana cost of Codified spells by level      | `SPELL_LEVEL_MANA`             |
| Maximum Mana pool                          | `maxMana()`                    |
| Partial-caster and martial share (65% / 40%) | `CASTER_TYPES`               |
| Charge Pool and Reinforcement              | `chargePool()`, `reinforcement()` |
| Guard                                      | `guardMax()`                   |
| Maximum Chain Length by level              | `CHAIN_TIERS`                  |
| Chain Momentum bonus and its cap           | `chainAttackBonus()`           |
| Escalation penalty                         | `escalationPenalty()`          |
| Dodge, Parry and Block                     | `dodgeBonus()`, `parryBonus()`, `blockOptions()` |
| Perfect (5+) and Masterful (10+) margins   | `defenseResult()`              |
| Degrees of Miss                            | `attackDegree()`               |
| Stasis Save DC                             | `stasisSaveDC()`               |
| Momentum Die ladder and Stasis thresholds  | `MOMENTUM_LADDER`              |
| Enemy Compositor tables                    | `ARCANE_INTENT`, `TEMPERAMENTS`, `npcPotency()` |
| Proficiency Bonus and ability modifiers    | `proficiencyBonus()`, `abilityMod()` |

Each one has a comment with its codex page number.

### Three examples

**Make Potency III cheaper.** In `POTENCY`, change the third line:

```js
{ core: 5,  meaning: 'Major encounter magic' },   // before
{ core: 4,  meaning: 'Major encounter magic' },   // after
```

**Add a longer range option.** Add a line to `RANGE_COSTS`:

```js
{ id: '600', label: '600 ft', cost: 4 },
```

It appears in the Spellcrafter and the Mana calculator dropdowns straight away.

**Change the damage formula.** Edit the one line in `damageDice()`:

```js
return p + 2 + Math.floor(p / 3);   // before
return p + 3 + Math.floor(p / 2);   // after: hits harder at every Potency
```

### After changing a number, check three things

Most of the site updates itself, but a few things are written-out text:

1. **Worked examples in the Codex** ("5 Core + 1 Composite ... = 9 Mana").
   These are sentences, not calculations. Search `codex-content.js` for the
   old number and retype the example.
2. **Formula lines shown as text** (for example "Guard = 2 + Proficiency
   Bonus"). If you change the formula itself, update its text in
   `codex-content.js` and the `formula:` line of its calculator in
   `calculators.js`.
3. **Compositry spells you already saved.** Each stores its own `mana` and
   `damage` text (so a codified spell can keep a discount). Update them on the
   DM page or in `data/spells/compositry.js`.

Characters need no fixing: their automatic numbers are recalculated every time
a sheet is opened.

---

## Editing the Codex

All of the Codex text lives in **one file**:

```
public/js/rules/codex-content.js
```

It is a list called `CHAPTERS`, one entry per codex page, in reading order:

```js
{
  id: 'active-defense',            // the address: #/codex/active-defense
  section: 'lore',                 // which heading it sits under: 'how', 'lore' or 'ref'
  kicker: 'Active Defense',        // small gold line above the title
  title: 'Guard, Dodge, Parry & Block',
  num: '15',                       // optional big chapter number
  page: 20,                        // page in the PDF (shown in the menu)
  html: ` ...the chapter... `,
},
```

### Change some text

Find the chapter and edit the words inside its `html`. It is ordinary HTML:
`<p>` paragraphs, `<h3>` headings, `<b>` bold, `<ul><li>` bullet lists.

### Change or add a table

Tables are written with a small helper - headers first, then one list per row:

```js
${table(['Recovery', 'Effect'], [
  ['<b>Recover</b>', 'End the Chain safely and regain 1 Guard.'],
  ['<b>Press the Attack</b>', 'Continue the Chain. Your next attack is -2.'],
  ['<b>My New Option</b>', 'Whatever it does.'],          // <- add a row like this
])}
```

Put `^` in front of a header to centre that column: `'^Cost'`.

Some tables have no rows typed out because they are **built from
`formulas.js`** - for example:

```js
${table(['Maximum range', '^Cost'], costRows(F.RANGE_COSTS))}
```

Those change when you change the numbers; you do not edit them here. The
tables built this way are: Potency and Core Mana, the Composite, Range, Area,
Duration and Effect costs, damage dice, damage die by delivery, Codified spell
Mana, Mana pool by level, Chain Length, the Momentum ladder and Stasis chances,
Arcane Intent, and the two cheat-sheet tables.

### The building blocks

| To get...                          | Write...                                             |
| ---------------------------------- | ---------------------------------------------------- |
| Green formula bar                  | `<div class="formula">Guard = 2 + PB</div>`          |
| Gold formula bar                   | `<div class="formula gold">...</div>`                |
| Gold "rule of thumb" note          | `<div class="callout"><b>Design rule:</b> ...</div>` |
| Dark green example box             | `<div class="dark-box"><h3>Example</h3><p>...</p></div>` |
| Cream example box                  | `<div class="note-box"><h4>Example</h4><p>...</p></div>` |
| Plain bordered box                 | `<div class="plain-box"><h4>Title</h4><p>...</p></div>` |
| Large pull quote                   | `<p class="pull">...</p>`                            |
| Small italic footnote              | `<p class="fine">...</p>`                            |
| Two columns side by side           | `<div class="grid cols-2"><div>left</div><div>right</div></div>` |
| A live calculator                  | `<div data-calc="guard"></div>` (ids are in `calculators.js`) |
| A link to another chapter          | `<a href="#/codex/momentum-dice">Momentum Dice</a>`  |

### Add a new chapter

Copy an existing entry in `CHAPTERS`, give it a new `id`, and place it where it
should appear in the reading order. It shows up in the Codex menu, the
overview page and the Previous / Next buttons automatically.

```js
{
  id: 'grappling-chains', section: 'lore', kicker: 'Combat', title: 'Grapples in an Attack Chain', page: 31,
  html: `
    <p class="lead">A short introduction.</p>
    <div class="formula">Grapple DC = 8 + PB + STR modifier</div>
    <div class="callout"><b>Design rule:</b> why it works this way.</div>`,
},
```

### Add a new section heading

Add a line to `SECTIONS` at the top of the same file, then use its `id` as a
chapter's `section`.

### Two cautions

- The text sits between backticks (`` ` ``). If your own text needs a backtick
  or the characters `${`, put a backslash in front: `` \` `` and `\${`.
- If the Codex page goes blank after an edit, a bracket or backtick is
  unbalanced. Press F12 in the browser and look at the Console tab - it names
  the line. Undo your last change and try again.

The character sheet's **Reference** tab reuses the two cheat-sheet chapters, so
editing those updates the sheet too.

---

## Folder map

```
server.js            starts the site
server/              accounts, characters, notes and data loading (the "backend")
data/                the lists you can edit by hand
  spells/codified.js     normal D&D spells
  spells/compositry.js   custom Compositions
  components.js          Physical & Aspectual Components
  items.js               items, magic items, weapons, Catalysts
  classes.js             classes
  subclasses.js          subclasses (each names its parent class)
  npcs.js                NPCs & enemies - DM only, never sent to players
public/              everything the browser loads
  index.html
  css/styles.css     the whole look
  js/app.js          navigation + which page to show
  js/pages/          one file per page
  js/rules/          the game rules: formulas, tables, codex text, sheet shape
  js/calculators.js  every interactive formula
scripts/             small helper commands
storage/             the database (created on first run - back this up!)
docs/                guides for you
```

## Handy commands

```bash
node server.js                  # run the site
node --watch server.js          # run it and restart automatically when server files change
node scripts/check-spells.js    # check everything in data/ for typos
node scripts/make-dm.js NAME    # give the account NAME the DM role
```

(`npm start`, `npm run check-data` and `npm run make-dm NAME` do the same
things. If PowerShell refuses to run `npm` with a "running scripts is disabled"
message, use the `node ...` forms above or type `npm.cmd` instead of `npm`.)

## Your data

Accounts, characters, DM notes and lore, initiative trackers, and anything added on the DM page all
live in one file: `storage/arcane.db`. Copy that file somewhere safe to back
everything up. Passwords are stored only as salted hashes.

## Credits

Arcane Compositry is an unofficial, fan-made expansion. Dungeons & Dragons is a
trademark of Wizards of the Coast; this project is not affiliated with or
endorsed by them. The example Codified spells and item statistics are drawn
from the System Reference Document 5.2, used under CC-BY-4.0. Class and
subclass entries are brief original summaries for table reference.
