# How the site fits together

No frameworks and no build step: the files you edit are the files that run.
Change a file, refresh the browser.

## The two halves

```
 Browser (public/)                          Server (server.js + server/)
 ┌──────────────────────────┐               ┌─────────────────────────────┐
 │ app.js      which page?  │   /api/...    │ api.js    the endpoints     │
 │ pages/*.js  draw a page  │ ────────────► │ auth.js   accounts, logins  │
 │ rules/*.js  game maths   │ ◄──────────── │ catalog.js load + check     │
 │ calculators.js           │     JSON      │ db.js     storage/arcane.db │
 └──────────────────────────┘               └─────────────────────────────┘
                                             data/  spells, items, classes (files)
```

- The **server** stores accounts, characters and DM notes, and hands out the
  spell, item and class lists. It does no game maths.
- The **browser** does everything visible: pages, calculators, the sheet.

## Rules live in one place

Everything about the game is in `public/js/rules/`:

| File               | Holds                                                         |
| ------------------ | ------------------------------------------------------------- |
| `constants.js`     | Lists: schools, skills, Components, Forms, item categories.   |
| `formulas.js`      | Every table and formula from the codex, with page references. |
| `character.js`     | The shape of a character sheet and its automatic numbers.     |
| `codex-content.js` | The rules text, one entry per codex page.                     |

Pages never do arithmetic themselves; they call `formulas.js`. So tuning a
number (say, the Mana pool formula) is a one-line change that the Spellcrafter,
the calculators, the codex tables and every sheet pick up together.

Spells, Components, items, classes, subclasses and NPCs are **data**, not code. `server/catalog.js` loads
each list from its file in `data/` and merges in anything saved on the DM page.
Classes and Components are fetched once when the site starts, because they are
needed almost everywhere. The server only sends hidden entries to the DMs of the current group, and the NPC list
(`/api/npcs`) to them only - it has no public route at all.

`public/js/details.js` builds the details pop-ups and pick-lists, so a spell,
item or Component looks the same on its index page and inside a character sheet.

## Common changes

### Tune a number
`formulas.js`. Example: to make partial casters 70% instead of 65%, change
`share: 0.65` in `CASTER_TYPES`.

### Edit rules text
`codex-content.js`. Each chapter is HTML; the comment at the top lists the
building blocks (formula bars, callouts, tables, live calculators).

### Add a calculator
`calculators.js`. Copy an entry in `CALCULATORS`: list its inputs and write a
`compute()` that returns results. Show it inside a codex chapter with
`<div data-calc="your-id"></div>`; it appears on the Calculators page
automatically.

### Add a field to the character sheet
1. `rules/character.js` - add it with a default value to `blankCharacter()`.
2. `pages/sheet.js` - add `text('section.field', 'Label')` (or `area(...)`,
   `select(...)`, `check(...)`) inside the panel where it belongs.

Saving, loading and autosave need no changes. Existing characters get the new
field with its default the next time they are opened.

To make a number automatic (calculated, but overridable), compute it in
`derive()` in `character.js` and show it with `auto('key', 'Label')`.

### Add a page
1. Create `public/js/pages/my-page.js` with
   `export function render(main, ctx) { main.innerHTML = '...'; }`
2. Add a line to `ROUTES` in `app.js`, and to `NAV` if it should be in the menu.

### Add a field to spells, items or classes
1. `server/catalog.js` - add it to that list's validate function so it is kept.
2. `public/js/pages/campaign.js` - add one line to that list's `fields` in `CATALOG`.
3. Show it on the list's page (`spells.js`, `items.js` or `classes.js`).

### Add a server endpoint
`server/api.js`: write a handler function and add one line to `ROUTES`,
choosing who may call it (`'public'`, `'user'`, `'member'`, `'dm'` or `'admin'`).

### Change the look
The first block of `public/css/styles.css` holds the colour tokens (taken from
the codex PDF) for light and dark themes. Change a token and every page
follows.

## Two rules to keep in mind when editing pages

1. **Wrap anything a person typed in `esc()`** before putting it in HTML
   (names, notes, spell text). This keeps the site safe from pasted code.
2. **No `style="..."` attributes.** The server's security policy blocks them.
   Add a class to `styles.css` instead.

## How a character is saved

The whole sheet is one object, stored as JSON in the `characters` table. When
a player types, `sheet.js` updates the object, recalculates the automatic
numbers, and sends the object to the server about half a second after the last
keystroke. The header shows *Saving...* then *Saved*.

A character belongs to its owner and needs no campaign. It can also be in one
campaign (the "Campaign" button on My characters, or picked when it is
created); then that campaign's DMs can open and edit it, and the sheet uses the
campaign's homebrew. Leaving or being removed from a campaign takes your
characters out of it.

## DM notes and lore

Session notes and lore entries are rows in the `dm_notes` table. Only the
DMs of a group can read or write that group's notebook; every DM of the same
group sees the same one. They save as you type, like the sheet.

## Accounts

- Usernames and passwords only - no email is collected.
- Passwords are hashed with scrypt; logins use an HttpOnly cookie.
- The first account created is the **site admin**. The admin can set a new
  password for anyone who forgot theirs, and make other admins (Account
  settings > All accounts). `npm run make-admin NAME` does the same from the
  command line.

## Campaigns ("groups" in the code)

Several campaigns can share one site. Each campaign is a **group**:

- Anyone signed in can start a campaign (Campaigns page) and becomes its DM.
  A DM can make other members DM, remove members, rename the campaign and make
  a new invite code (campaign hub > Group tab).
- Players join with the invite code - when they sign up, or later on the
  Campaigns page. One account can be in several campaigns (a DM in one, a
  player in another).

The site has two modes, and the address decides which:

- **Browsing** - every page except `#/campaign/...`. The Codex, Spellcrafter,
  calculators and the spell, item and class lists show the standard rules. Those
  lists (and the Spellcrafter) have a **Homebrew** filter to include one of your
  campaigns' homebrew; a DM sees that campaign's hidden entries there too.
- **Inside a campaign** - `#/campaign/<id>` (`public/js/pages/campaign.js`), with
  a gold campaign banner under the top bar. Tabs: Party (everyone), Homebrew
  (players: opens the lists with this campaign's homebrew), and the DM tools
  (DMs only): Initiative, Spells, Items, Classes, NPCs, Group, Notes, Lore.

Applying the tools to a campaign: the spell and item lists and the Spellcrafter
save to any of your characters (the picker shows each one's campaign), and a DM
can save a crafted spell straight into a campaign's Compositry list ("Save to
campaign homebrew").
- What belongs to a group: its members and their roles, characters, session
  notes and lore, encounters, NPCs added on the DM page, and every DM-page edit
  and Hide / Publish choice for spells, items, classes and Components.
- What is shared by every group: the data files in `data/`. A group's DM-page
  edits sit on top of them for that group only.

Before drawing each page, the router (`public/js/app.js`) sets `state.group`:
the hub's campaign, or the Homebrew filter's choice; the character sheet then
switches to its character's campaign. The browser adds `?group=<id>` of it to
every API request (`public/js/api.js`). The server checks the user is a member
before using it (`currentGroup()` in `server/api.js`); routes marked
`'member'` or `'dm'` need such a group. `state.user.role` in the browser is
the user's role in that campaign.

A site that existed before groups were added keeps everything: the database
upgrade puts every account, character, note and DM-page edit into one group
called "Our campaign", with everyone keeping their DM or player role.

## Initiative trackers

Each encounter is one row in the `encounters` table, with its combatants
stored as JSON. Only the group's DMs can read or write them. The page code is
`public/js/pages/initiative.js`; its opening comment describes the shape of an
encounter and how to add another thing to track.
