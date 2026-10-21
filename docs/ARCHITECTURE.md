# How the site fits together

Two parts: a small Node.js **server** (no packages - only what ships with
Node) and a **React** front end in `web/`, written in TypeScript and styled
with Tailwind and shadcn/ui. The front end is built into `dist/`
(`npm run build`), which the server hands to browsers.

## The two halves

```
 Browser (web/ -> built into dist/)              Server (server.js + server/)
 ┌───────────────────────────────────┐            ┌──────────────────────────────────┐
 │ App.tsx             pages + routes│  /api/...  │ api.js       checks, then routes │
 │ pages/*.tsx         one per page  │ ─────────► │ routes/*.js  the endpoints       │
 │ components/         shared pieces │ ◄───────── │ auth.js      accounts, logins    │
 │ lib/                api, session, │    JSON    │ catalog.js   load + check lists  │
 │                     campaign scope│            │ db.js        storage/arcane.db   │
 └───────────────┬───────────────────┘            │ migrations.js  table changes     │
                 │                                └───────────────┬──────────────────┘
                 └──── shared/rules/  the game maths & rules text ┘
                                           data/  spells, items, classes (files)
```

- The **server** stores accounts, characters, campaigns and DM notes, and hands
  out the spell, item and class lists. It does no game maths.
- The **browser** does everything visible: pages, calculators, the sheet.
- **`shared/rules/`** is used by both: the server checks homebrew against it,
  the browser does all its maths with it.

## Running it while you work

```bash
npm install          # once: the front end's packages (React, Vite, Tailwind...)
npm run dev          # the server on :3000, restarting when server files change
npm run dev:web      # the React app on :5173 with live reload (use this one in the browser)
```

`npm run dev:web` sends every `/api/...` request to the server on :3000, so run
both. Edit anything under `web/` or `shared/` and the browser updates at once.
For production, `npm run build` makes `dist/` and `node server.js` serves it on
:3000 by itself.

`npm run typecheck` checks the TypeScript; `npm test` runs the server tests.

## Where things are in web/src

| Folder / file              | Holds |
| -------------------------- | ----- |
| `App.tsx`                  | Every page and its address (React Router). |
| `pages/`                   | One file per page. |
| `components/layout.tsx`    | Top bar, phone menu and tab bar, gold campaign banner. `NAV` = the menu. |
| `components/sheet/`        | The character sheet: one file per tab, plus `fields.tsx` (its inputs). |
| `components/campaign/`     | The campaign hub's tabs: party, homebrew editors, initiative, group, notes. |
| `components/details.tsx`   | Details pop-ups (spell, item, Component, subclass, NPC, character) and the pick-list. |
| `components/ui/`           | shadcn/ui components (buttons, dialogs, menus...) - copied in, yours to edit. |
| `lib/api.ts`               | Talking to the server. |
| `lib/session.tsx`          | Who is signed in, their campaigns, the Homebrew filter. |
| `lib/catalog.tsx`          | Which campaign a page uses (`<GroupScope>`), and the cached list hooks. |
| `lib/calculators.js`       | Every calculator, as data. |
| `index.css`                | Tailwind, the colour tokens (light and dark), and the styles for rules text. |

## Rules live in one place

Everything about the game is in `shared/rules/`:

| File               | Holds                                                         |
| ------------------ | ------------------------------------------------------------- |
| `constants.js`     | Lists: schools, skills, Components, Forms, item categories.   |
| `formulas.js`      | Every table and formula from the codex, with page references. |
| `character.js`     | The shape of a character sheet and its automatic numbers.     |
| `codex-content.js` | The rules text, one entry per codex page.                     |

Pages never do arithmetic themselves; they call `formulas.js`. So tuning a
number (say, the Mana pool formula) is a one-line change that the Spellcrafter,
the calculators, the codex tables and every sheet pick up together.

These files stay plain JavaScript because the server uses them too. Each has a
small generated `.d.ts` beside it so TypeScript treats its exports as untyped;
after adding an export to one, run `npm run js-types`.

Spells, Components, items, classes, subclasses and NPCs are **data**, not code.
`server/catalog.js` loads each list from its file in `data/` and merges in a
campaign's DM edits. The server only sends hidden entries to that campaign's
DMs, and the NPC list (`/api/npcs`) to them only - it has no public route.

## Common changes

### Tune a number
`shared/rules/formulas.js`. Example: to make partial casters 70% instead of 65%,
change `share: 0.65` in `CASTER_TYPES`.

### Edit rules text
`shared/rules/codex-content.js`. Each chapter is HTML; the comment at the top
lists the building blocks (formula bars, callouts, tables, live calculators).
It is shown by `components/rich-html.tsx`, and its look is the `.prose-ac`
section at the bottom of `web/src/index.css`.

### Add a calculator
`web/src/lib/calculators.js`. Copy an entry in `CALCULATORS`: list its inputs
and write a `compute()` that returns results. Show it inside a codex chapter
with `<div data-calc="your-id"></div>`; it appears on the Calculators page
automatically.

### Add a field to the character sheet
1. `shared/rules/character.js` - add it with a default value to `blankCharacter()`.
2. The right tab in `web/src/components/sheet/` - add
   `<TextF path="section.field" label="Label" />` (or `AreaF`, `SelectF`,
   `CheckF`) inside the panel where it belongs.

Saving, loading and autosave need no changes. Existing characters get the new
field with its default the next time they are opened. To make a number
automatic (calculated, but overridable), compute it in `derive()` in
`character.js` and show it with `<AutoF k="key" label="Label" />`.

### Add a page
1. Create `web/src/pages/my-page.tsx` with `export default function MyPage() { ... }`.
2. Add a lazy import and a `<Route>` in `App.tsx`, and an entry in `NAV`
   (`components/layout.tsx`) if it should be in the menu.

### Add a field to spells, items or classes
1. `server/catalog.js` - add it to that list's validate function so it is kept.
2. `web/src/components/campaign/homebrew.tsx` - add one line to that list's
   `fields` in `CATALOG`.
3. Show it in the details pop-up (`components/details.tsx`) or the list page.

### Add a server endpoint
Pick the file in `server/routes/` for that feature (auth, email, campaigns,
catalog, notes, encounters, characters, admin), write a handler function and
add one line to its `routes`, choosing who may call it (`'public'`, `'user'`,
`'member'`, `'dm'` or `'admin'`). `server/api.js` checks those before the
handler runs. A brand-new routes file also needs adding to `ROUTE_FILES` in
`server/api.js`. Then add a test (below).

### Change the database tables
Append a migration to `MIGRATIONS` in `server/migrations.js` - never edit an
existing one. It runs once, by itself, the next time the server starts.

### Add a tab to the campaign hub
Write it as a component in `web/src/components/campaign/`, then add it to
`TABS` and the list of tabs in `web/src/pages/campaign.tsx`.

### Add a shadcn/ui component
`npx shadcn@latest add <name>` puts it in `web/src/components/ui/`. Check its
first lines import `cn` from `@/lib/utils`.

### Change the look
The colour tokens at the top of `web/src/index.css` (taken from the codex PDF)
drive every component, in light and dark. Change a token and every page
follows. Fonts are loaded in `web/index.html`.

## Tests

`npm test` (or `node --test "test/*.test.js"`) runs every test in `test/`, in a
second or two. Each test file starts the real server on a free port with an
empty database in a temporary folder - your `storage/` is never touched - and
talks to it like a browser would (`test/helpers.js`). They cover signing up and
in, the attempt limit, invite codes, admins, the email links, keeping
campaigns apart, character ownership, upgrading an old database, and that bad
addresses cannot crash the server.

Run them before every commit. When you add an endpoint or change a rule about
who may do what, add a test next to the similar ones - that is what keeps one
campaign's secrets from leaking into another as the site grows.

## Safety rules for front-end code

1. **Never put text a person typed into `dangerouslySetInnerHTML`.** React
   shows `{text}` safely by itself. `<RichHtml>` is only for the site's own
   rules text; show players' text with `<Paragraphs>` or `{text}`.
2. Scripts only load from the site itself (the server's Content-Security-Policy
   in `server.js`), so no `<script>` tags from other websites.

## How a character is saved

The whole sheet is one object, stored as JSON in the `characters` table.
`pages/sheet.tsx` holds it; every change recalculates the automatic numbers and
sends the object to the server about half a second after the last change (and
straight away when you leave the page). The header shows *Saving...* then *Saved*.

A character belongs to its owner and needs no campaign. It can also be in one
campaign (the "Campaign" button on My characters, or picked when it is
created); then that campaign's DMs can open and edit it, and the sheet uses the
campaign's homebrew. Leaving or being removed from a campaign takes your
characters out of it.

## DM notes and lore

Session notes and lore entries are rows in the `dm_notes` table. Only the
DMs of a campaign can read or write its notebook; every DM of the same
campaign sees the same one. They save as you type, like the sheet.

## Accounts

- Each account has a public **username** and a private **email**; either signs
  you in. Emails are only shown to the person and site admins.
- With email turned on (`server/mail.js`, see DEPLOYING.md) the site sends a
  "confirm your email" link at sign-up and when the email changes, and a
  "reset your password" link from **Forgot password** - only ever to a
  confirmed address. Links are one-time tokens (only a hash is stored) that
  expire after 48 hours (confirm) or 1 hour (reset). Pages:
  `web/src/pages/email-links.tsx` (addresses `/verify`, `/reset`, `/forgot`).
- Accounts made before emails were collected are asked once to add one.
- Passwords are hashed with scrypt; logins use an HttpOnly cookie.
- **Site admins** can set a new password for anyone who forgot theirs (Account
  settings > All accounts). Admins are made and removed **only** on the server,
  with `npm run make-admin NAME` (`scripts/make-admin.js`); the website has no
  way to grant admin, and new accounts never start as admins.

## Campaigns ("groups" in the code)

Several campaigns can share one site. Each campaign is a **group**:

- Anyone signed in can start a campaign (Campaigns page) and becomes its DM.
  A DM can make other members DM, remove members, rename the campaign and make
  a new invite code (campaign hub > Group tab).
- Players join with the invite code - when they sign up, or later on the
  Campaigns page. One account can be in several campaigns (a DM in one, a
  player in another).
- What belongs to a campaign: its members and their roles, characters, session
  notes and lore, encounters, NPCs, and every DM edit and Hide / Publish
  choice for spells, items, classes and Components.
- What is shared by every campaign: the data files in `data/`. A campaign's DM
  edits sit on top of them for that campaign only.

The site has two modes, and the address decides which:

- **Browsing** - every page except `/campaign/...`. The Codex, Spellcrafter,
  calculators and the spell, item and class lists show the standard rules. Those
  lists (and the Spellcrafter) have a **Homebrew** filter to include one of your
  campaigns' homebrew; a DM sees that campaign's hidden entries there too.
- **Inside a campaign** - `/campaign/<id>` (`web/src/pages/campaign.tsx` and
  `components/campaign/`), with a gold campaign banner under the top bar. Tabs:
  Party (everyone), Homebrew (players), and the DM tools (DMs only):
  Initiative, Spells, Items, Classes, NPCs, Group, Notes, Lore.

Every page sits inside `<GroupScope>` (`lib/catalog.tsx`), which decides the
campaign it uses - the hub's own, the character's (on the sheet), or the
Homebrew filter's choice - loads that campaign's classes and Components into
the rules, and only then shows the page. Every API request carries
`?group=<id>` of that campaign (`lib/api.ts`); the server checks the user is a
member before using it (`currentGroup()` in `server/api.js`).

A site that existed before campaigns were added keeps everything: the database
upgrade puts every account, character, note and DM edit into one campaign
called "Our campaign", with everyone keeping their DM or player role.

## Initiative trackers

Each encounter is one row in the `encounters` table, with its combatants
stored as JSON. Only the campaign's DMs can read or write them. The code is
`web/src/components/campaign/initiative.tsx`; its opening comment describes the
shape of an encounter and how to add another thing to track.
