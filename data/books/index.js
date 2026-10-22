/**
 * ════════════════════════════════════════════════════════════════════════════
 *  CODEX LIBRARY  -  the rulebooks on the Codex page
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Every book on the Codex page is one entry below, shown in this order.
 *  The book itself is a Markdown (.md) file in this folder. The server splits
 *  it into chapters and pages by its headings (# Chapter, ## Section, ...),
 *  builds the table of contents and the search index, and re-reads the file
 *  whenever it changes - edit, save, refresh the browser.
 *
 *  ─── TO ADD A BOOK ─────────────────────────────────────────────────────────
 *  1. Put the .md file in this folder (data/books/), named in lowercase with
 *     dashes, e.g.  tashas-cauldron-of-everything.md
 *  2. Copy an entry below and change it. Refresh the browser.
 *
 *    {
 *      id: 'tashas-cauldron',         // unique, lowercase, dashes. Used in addresses and bookmarks -
 *                                     //   do not change it later or saved bookmarks for the book are lost.
 *      file: 'tashas-cauldron-of-everything.md',
 *      title: "Tasha's Cauldron of Everything",
 *      abbr: 'TCE',                   // 2-4 letters for the book's badge
 *      kind: 'Expansion',             // a short label: Core rulebook, Expansion, Bestiary...
 *      year: 2020,                    // optional
 *      description: 'One or two sentences for the library card.',
 *      // Optional. Top-level (#) headings that match start a new part of the
 *      // book; other # headings until the next match are filed inside it.
 *      // Leave it out and every # heading is its own part.
 *      parts: /^(Introduction|Chapter \d+|Appendix|Credits)\b/,
 *    },
 *
 *  `builtIn: true` (Arcane Compositry only) means the text lives in
 *  public/js/rules/codex-content.js instead of a .md file.
 */
export const BOOKS = [
  {
    id: 'arcane-compositry',
    builtIn: true,
    title: "Arcane Compositry: Player's Field Codex",
    abbr: 'AC',
    kind: 'Expansion',
    description: 'Improvised magic, Tendril circuitry, Catalysts, Counter-Compositry and the combat systems that make magic an active exchange - with a live calculator beside every formula.',
  },
  {
    id: 'players-handbook-2024',
    file: 'players-handbook-2024.md',
    title: "Player's Handbook",
    abbr: 'PHB',
    kind: 'Core rulebook',
    year: 2024,
    description: 'How to play: character creation, the classes, origins and feats, equipment, the spell list and the rules glossary.',
    parts: /^(Introduction|Chapter \d+|Appendix|Rules Glossary|Credits)\b/,
  },
  {
    id: 'dungeon-masters-guide-2024',
    file: 'dungeon-masters-guide-2024.md',
    title: "Dungeon Master's Guide",
    abbr: 'DMG',
    kind: 'Core rulebook',
    year: 2024,
    description: "Running the game: the DM's toolbox, adventures and campaigns, cosmology, treasure and magic items, and Bastions.",
    parts: /^(Introduction|Chapter \d+|Appendix|Credits)\b/,
  },
  {
    id: 'monster-manual-2025',
    file: 'monster-manual-2025.md',
    title: 'Monster Manual',
    abbr: 'MM',
    kind: 'Bestiary',
    year: 2025,
    description: 'Hundreds of monsters from A to Z with full stat blocks, lairs and lore, plus animals and monster lists for building encounters.',
    parts: /^(How to Use a Monster|Monsters A to Z|Monsters \([A-Z]\)|Animals|Monster Lists|Credits)$/,
  },
  {
    id: 'xanathars-guide-to-everything',
    file: 'xanathars-guide-to-everything.md',
    title: "Xanathar's Guide to Everything",
    abbr: 'XGE',
    kind: 'Expansion',
    year: 2017,
    description: 'New subclasses and character options, DM tools, downtime, magic item rewards, spells and shared campaigns.',
  },
  {
    id: 'arcana-unleashed',
    file: 'arcana-unleashed.md',
    title: 'Arcana Unleashed',
    abbr: 'AU',
    kind: 'Expansion',
    description: "Alustriel Silverhand's arcana: backgrounds and feats, new spells, magical worlds and factions, evolving magic items and magical creatures.",
    parts: /^(Introduction|Chapter \d+|Appendix|Credits)\b/,
  },
];
