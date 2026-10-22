/**
 * shared/rules/rulesets.js - the rulesets (published rules and expansions) a
 * campaign can use. Used by the server (which entries a campaign receives) and
 * the browser (which pages, panels and sheet sections to show).
 *
 * Every spell, item, class, Component... belongs to one ruleset (its `ruleset`
 * field; each data file has a default - see LIST_DEFS in server/catalog.js).
 * A campaign's DM picks its rulesets; the campaign then only sees entries from
 * those, plus its own **homebrew** (what the DM adds or edits on the site).
 *
 * ─── TO ADD A RULESET ──────────────────────────────────────────────────────
 *  1. Add an entry to RULESETS below (id: short, lowercase, never changed later).
 *  2. Give its entries `ruleset: '<id>'` - in their own data file (add the file
 *     to LIST_DEFS in server/catalog.js) or on single entries in an existing one.
 *  3. Only add content you are allowed to publish (the SRD is CC-BY-4.0;
 *     most official books are not).
 */

export const RULESETS = [
  {
    id: 'dnd5e',
    name: 'D&D 5th Edition',
    short: '5e',
    base: true, // always on: every other ruleset builds on it
    summary: 'The core rules: spells, weapons, armor, magic items, classes and subclasses, from the System Reference Document 5.2.',
    credit: 'SRD 5.2, CC-BY-4.0',
  },
  {
    id: 'arcane',
    name: 'Arcane Compositry',
    short: 'Arcane Compositry',
    summary: 'A magic system for 5e: build spells from Components, a Form and a Potency, and cast them with Mana instead of spell slots. Adds Catalysts, Attack Chains, Guard and Momentum Dice.',
    about: '/codex', // the Codex explains it
  },
];

export const RULESET_IDS = RULESETS.map((r) => r.id);
export const BASE_RULESET = 'dnd5e';
export const ARCANE = 'arcane';
/** What a campaign uses if nothing was chosen (and what campaigns made before rulesets existed got). */
export const DEFAULT_RULESETS = [...RULESET_IDS];

export const findRuleset = (id) => RULESETS.find((r) => r.id === id) ?? null;

/** A clean list of ruleset ids, in RULESETS order, always including the base ruleset. */
export function cleanRulesets(value) {
  const ids = Array.isArray(value) ? value.map(String) : [];
  return RULESETS.filter((r) => r.base || ids.includes(r.id)).map((r) => r.id);
}

/** Reads the JSON stored in the database (bad or missing = the defaults). */
export function parseRulesets(json) {
  if (!json) return [...DEFAULT_RULESETS];
  try { return cleanRulesets(JSON.parse(json)); } catch { return [...DEFAULT_RULESETS]; }
}
