/**
 * server/catalog.js - loads, checks and merges the five DM-editable lists:
 *
 *   codified     normal D&D spells              data/spells/codified.js
 *   compositry   custom Compositions            data/spells/compositry.js
 *   components   Physical & Aspectual Components data/components.js
 *   items        items, magic items, weapons    data/items.js
 *   classes      character classes              data/classes.js
 *   subclasses   subclasses (each names its parent class)   data/subclasses.js
 *   npcs         NPCs & enemies - DM ONLY, never sent to players   data/npcs.js
 *
 * Every list works the same way. Entries come from two places:
 *   1. FILES    the data files above (edit by hand) - shared by every group
 *   2. DM PAGE  entries saved through the site by a group's DM, stored in the
 *               database - seen only by that group
 *
 * The two are merged when the site asks for a group's list. A DM-page entry
 * with the same `id` as a file entry REPLACES the file entry for that group
 * (that is how "edit" works for file entries); deleting it on the DM page
 * brings the file version back. Visitors who are not in a group see only the
 * files.
 *
 * HIDDEN OR PUBLIC
 *   Every entry is either public (players see it) or hidden (only the group's
 *   DMs see it). A DM flips this on the DM page; the choice is stored per group
 *   in the `group_visibility` table, so it works for file entries too. An
 *   entry in a data file can also start hidden by writing  hidden: true.
 *
 * RULESETS
 *   Every entry belongs to one ruleset (shared/rules/rulesets.js): its own
 *   `ruleset:` field, or its list's default below (Catalyst items count as
 *   Arcane Compositry). A campaign only receives entries from the rulesets its
 *   DM picked. What the DM adds on the site is the campaign's homebrew
 *   (origin 'custom'; an edited file entry is origin 'override').
 *
 * The data files are re-read automatically whenever they change on disk, so
 * you can edit a file, save, and refresh the browser - no restart needed.
 *
 * ─── TO ADD A NEW FIELD TO A LIST ──────────────────────────────────────────
 *  Add it to that list's validate function below (so it is kept when saved),
 *  then show it on the list's page and add it to the DM form in
 *  web/src/components/campaign/homebrew.tsx.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { db } from './db.js';
import { SCHOOLS, ANY_CLASS, ABILITIES, ITEM_CATEGORIES, ITEM_RARITIES, COMPONENT_KINDS, NPC_KINDS } from '../shared/rules/constants.js';
import { RULESET_IDS, BASE_RULESET, ARCANE } from '../shared/rules/rulesets.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ABILITY_KEYS = ABILITIES.map((a) => a.key);

// ── Small cleaning helpers ───────────────────────────────────────────────────
const str = (v, max = 400) => String(v ?? '').trim().slice(0, max);
const list = (v) => (Array.isArray(v) ? v : String(v ?? '').split(',')).map((s) => String(s).trim()).filter(Boolean);
const lines = (v) => String(v ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const oneOf = (options, v) => options.find((x) => x.toLowerCase() === str(v).toLowerCase());
const yes = (v) => v === true || v === 'true' || v === 'on' || v === 'hidden';
const whole = (v) => Math.max(-20, Math.min(20, Math.round(Number(v)) || 0));
export const slugify = (s) =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/** Fields every entry shares: id, name, description, tags, source, hidden. */
function common(s, errors) {
  const name = str(s.name, 80);
  if (!name) errors.push('name is required');
  const id = slugify(s.id || name);
  if (!id) errors.push('id is required (lowercase letters, numbers and dashes)');
  const description = str(s.description, 8000);
  if (!description) errors.push('description is required');
  return { id, name, description, tags: list(s.tags).map((t) => t.toLowerCase().slice(0, 30)).slice(0, 12), source: str(s.source, 80), hidden: yes(s.hidden) };
}

// ── Spells ───────────────────────────────────────────────────────────────────
function validateSpell(listName, s, errors, { classNames }) {
  const base = common(s, errors);
  const school = oneOf(SCHOOLS, s.school);
  if (!school) errors.push(`school must be one of: ${SCHOOLS.join(', ')}`);

  // Classes must be real class names (data/classes.js or added on the DM page), or "Any".
  const classes = [];
  for (const c of list(s.classes)) {
    const match = oneOf([ANY_CLASS, ...classNames], c);
    if (match) classes.push(match);
    else errors.push(`unknown class "${c}" (allowed: ${ANY_CLASS}, ${classNames.join(', ')})`);
  }
  if (!classes.length) errors.push('classes needs at least one class (or "Any")');
  const shared = { ...base, school, classes: [...new Set(classes)], range: str(s.range, 80), duration: str(s.duration, 80) };

  if (listName === 'codified') {
    const level = Number(s.level);
    if (!Number.isInteger(level) || level < 0 || level > 9) errors.push('level must be a whole number 0-9 (0 = cantrip)');
    return { ...shared, level, castingTime: str(s.castingTime, 80), components: str(s.components, 200), concentration: !!s.concentration, ritual: !!s.ritual, higherLevels: str(s.higherLevels, 2000) };
  }
  const potency = Number(s.potency);
  if (!Number.isInteger(potency) || potency < 1 || potency > 9) errors.push('potency must be a whole number 1-9');
  const mana = Number(s.mana);
  if (!Number.isFinite(mana) || mana < 0) errors.push('mana must be a number (0 or more)');
  return {
    ...shared, potency, mana, physicals: list(s.physicals), aspectuals: list(s.aspectuals), form: str(s.form, 40), area: str(s.area, 80),
    damage: str(s.damage, 80), resolution: str(s.resolution, 120), effect: str(s.effect, 200), creator: str(s.creator, 80), optimization: str(s.optimization, 200),
  };
}

// ── Physical & Aspectual Components ──────────────────────────────────────────
function validateComponent(s, errors) {
  const kind = oneOf(COMPONENT_KINDS, s.kind);
  if (!kind) errors.push(`kind must be one of: ${COMPONENT_KINDS.join(', ')}`);
  return {
    ...common(s, errors), kind,
    tendrilColor: str(s.tendrilColor, 60),   // the colour its Tendril route glows
    interactions: str(s.interactions, 1500), // known Composites and counters
  };
}

// ── Items & weapons ──────────────────────────────────────────────────────────
function validateItem(s, errors) {
  const category = oneOf(ITEM_CATEGORIES, s.category);
  if (!category) errors.push(`category must be one of: ${ITEM_CATEGORIES.join(', ')}`);
  const rarity = oneOf(ITEM_RARITIES, s.rarity || 'Mundane');
  if (!rarity) errors.push(`rarity must be one of: ${ITEM_RARITIES.join(', ')}`);
  return {
    ...common(s, errors), category, rarity,
    cost: str(s.cost, 40), weight: str(s.weight, 40), attunement: !!s.attunement,
    damage: str(s.damage, 80),          // weapons: "1d8 slashing"
    properties: list(s.properties),     // weapons: Finesse, Light, Versatile (1d10)...
    mastery: str(s.mastery, 40),        // weapons: 2024 Weapon Mastery property
    armorClass: str(s.armorClass, 80),  // armor and shields (text shown to the player)
    acBonus: whole(s.acBonus),          // added to Armor Class automatically while the item is in use
    saveBonus: whole(s.saveBonus),      // added to every saving throw automatically while the item is in use
    chainTrait: str(s.chainTrait, 300), // Arcane Compositry: what it does in an Attack Chain
    capacity: str(s.capacity, 40),      // Catalysts: Mana stored
    throughput: str(s.throughput, 40),  // Catalysts: Mana per invocation
  };
}

// ── Classes ──────────────────────────────────────────────────────────────────
/** Accepts [3, 'Rage', 'text'], { level, name, text } or the DM form's "3 | Rage | text" lines. */
function parseFeatures(v) {
  const rows = typeof v === 'string' ? lines(v).map((l) => l.split('|').map((p) => p.trim())) : Array.isArray(v) ? v : [];
  return rows
    .map((r) => (Array.isArray(r) ? { level: r[0], name: r[1], text: r[2] } : r))
    .map((r) => ({ level: Math.min(20, Math.max(1, Math.round(Number(r?.level)) || 1)), name: str(r?.name, 80), text: str(r?.text, 1500) }))
    .filter((r) => r.name)
    .sort((a, b) => a.level - b.level)
    .slice(0, 80);
}
/** Accepts { name, text, features } or the DM form's "Name | text | 3 Frenzy; 6 Mindless Rage" lines. */
function parseSubclasses(v) {
  const rows = typeof v === 'string'
    ? lines(v).map((l) => { const [name, text, feats] = l.split('|').map((p) => p.trim()); return { name, text, features: feats }; })
    : Array.isArray(v) ? v : [];
  return rows
    .map((r) => ({
      name: str(r?.name, 80),
      text: str(r?.text, 1500),
      features: typeof r?.features === 'string'
        ? parseFeatures(r.features.split(';').map((f) => { const m = f.trim().match(/^(\d+)[:.]?\s+(.*)$/); return m ? [m[1], m[2]] : [1, f.trim()]; }))
        : parseFeatures(r?.features),
    }))
    .filter((r) => r.name)
    .slice(0, 30);
}
function validateClass(s, errors) {
  const hitDie = Number(s.hitDie);
  if (![6, 8, 10, 12].includes(hitDie)) errors.push('hitDie must be 6, 8, 10 or 12');
  const saves = [...new Set(list(s.saves).map((x) => x.toLowerCase()))];
  if (saves.length !== 2 || saves.some((x) => !ABILITY_KEYS.includes(x))) errors.push(`saves needs exactly two of: ${ABILITY_KEYS.join(', ')}`);
  const invocation = str(s.invocation).toLowerCase();
  if (!ABILITY_KEYS.includes(invocation)) errors.push(`invocation must be one of: ${ABILITY_KEYS.join(', ')}`);
  const caster = str(s.caster).toLowerCase();
  if (!['full', 'partial', 'martial'].includes(caster)) errors.push('caster must be full, partial or martial');
  return {
    ...common(s, errors), hitDie, saves, invocation, caster,
    skillPicks: Math.min(6, Math.max(0, Math.round(Number(s.skillPicks)) || 2)),
    role: str(s.role, 200), primaryAbility: str(s.primaryAbility, 80),
    skills: str(s.skills, 400), weapons: str(s.weapons, 300), armor: str(s.armor, 300), tools: str(s.tools, 300), equipment: str(s.equipment, 600),
    compositry: str(s.compositry, 1500),
    features: parseFeatures(s.features), subclasses: parseSubclasses(s.subclasses),
  };
}

// ── Subclasses ───────────────────────────────────────────────────────────────
function validateSubclass(s, errors, { classNames }) {
  const className = oneOf(classNames, s.className);
  if (!className) errors.push(`className must be an existing class (${classNames.join(', ')})`);
  return { ...common(s, errors), className, features: parseFeatures(s.features), compositry: str(s.compositry, 1500) };
}

// ── NPCs & enemies (DM only) ─────────────────────────────────────────────────
/** Accepts ['Name', 'text'], { name, text } or the DM form's "Name | text" lines. */
function parseNamed(v) {
  const rows = typeof v === 'string' ? lines(v).map((l) => { const i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0, i), l.slice(i + 1)]; }) : Array.isArray(v) ? v : [];
  return rows
    .map((r) => (Array.isArray(r) ? { name: r[0], text: r[1] } : r))
    .map((r) => ({ name: str(r?.name, 80), text: str(r?.text, 2000) }))
    .filter((r) => r.name)
    .slice(0, 40);
}
function validateNpc(s, errors) {
  const kind = oneOf(NPC_KINDS, s.kind || 'NPC');
  if (!kind) errors.push(`kind must be one of: ${NPC_KINDS.join(', ')}`);
  const scores = Object.fromEntries(ABILITY_KEYS.map((k) => [k, Math.min(30, Math.max(1, Math.round(Number(s[k] ?? s.scores?.[k])) || 10))]));
  const invocation = str(s.invocation).toLowerCase();
  return {
    ...common(s, errors), kind,
    // 2024 stat block
    size: str(s.size, 40), creatureType: str(s.creatureType, 80), alignment: str(s.alignment, 40),
    ac: str(s.ac, 80), initiative: str(s.initiative, 40), hp: str(s.hp, 80), speed: str(s.speed, 120),
    scores, pb: Math.min(9, Math.max(2, Math.round(Number(s.pb)) || 2)),
    saves: str(s.saves, 200), skills: str(s.skills, 300),
    vulnerabilities: str(s.vulnerabilities, 200), resistances: str(s.resistances, 200), immunities: str(s.immunities, 300),
    senses: str(s.senses, 200), languages: str(s.languages, 200), cr: str(s.cr, 80), gear: str(s.gear, 300),
    traits: parseNamed(s.traits), actions: parseNamed(s.actions), bonusActions: parseNamed(s.bonusActions),
    reactions: parseNamed(s.reactions), legendary: parseNamed(s.legendary),
    // Arcane Compositry combat
    guard: str(s.guard, 20), chainLength: str(s.chainLength, 20), momentum: str(s.momentum, 400),
    // Arcane Profile (codex p.18)
    invocation: ABILITY_KEYS.includes(invocation) ? invocation : '',
    maxPotency: Math.min(9, Math.max(0, Math.round(Number(s.maxPotency)) || 0)), mana: str(s.mana, 20),
    temperament: oneOf(['Disciplined', 'Adaptive', 'Experimental'], s.temperament) || '',
    physicals: list(s.physicals), aspectuals: list(s.aspectuals), forms: list(s.forms), signatures: str(s.signatures, 2000),
    // Story
    location: str(s.location, 120), faction: str(s.faction, 120), notes: str(s.notes, 8000),
  };
}

// ── The lists ────────────────────────────────────────────────────────────────
const byName = (a, b) => a.name.localeCompare(b.name);
// `ruleset`: the ruleset an entry of this list belongs to unless it names its own.
const LIST_DEFS = {
  codified:   { file: 'data/spells/codified.js',   ruleset: BASE_RULESET, sort: (a, b) => a.level - b.level || byName(a, b),     validate: (s, e, ctx) => validateSpell('codified', s, e, ctx) },
  compositry: { file: 'data/spells/compositry.js', ruleset: ARCANE, sort: (a, b) => a.potency - b.potency || byName(a, b), validate: (s, e, ctx) => validateSpell('compositry', s, e, ctx) },
  components: { file: 'data/components.js',        ruleset: ARCANE, sort: (a, b) => b.kind.localeCompare(a.kind) || byName(a, b), validate: validateComponent },
  items:      { file: 'data/items.js',             ruleset: BASE_RULESET, sort: byName, validate: validateItem },
  classes:    { file: 'data/classes.js',           ruleset: BASE_RULESET, sort: byName, validate: validateClass },
  subclasses: { file: 'data/subclasses.js',        ruleset: BASE_RULESET, sort: (a, b) => a.className.localeCompare(b.className) || byName(a, b), validate: validateSubclass },
  npcs:       { file: 'data/npcs.js',              ruleset: BASE_RULESET, sort: byName, validate: validateNpc, dmOnly: true },
};
/** True for lists that players must never receive (the route that serves them is DM-only). */
export const isDmOnly = (listName) => !!LIST_DEFS[listName]?.dmOnly;
export const LISTS = Object.keys(LIST_DEFS);
export const listFile = (listName) => path.join(ROOT, LIST_DEFS[listName].file);

/** The ruleset an entry belongs to: its own `ruleset` field, or its list's default. */
export function rulesetOf(listName, entry) {
  if (RULESET_IDS.includes(entry?.ruleset)) return entry.ruleset;
  if (listName === 'items' && entry?.category === 'Catalyst') return ARCANE;
  return LIST_DEFS[listName].ruleset;
}

/**
 * Checks one entry and returns a cleaned-up copy.
 * @returns {Promise<{ entry: object, errors: string[] }>}  errors is empty when the entry is valid
 */
export async function validateEntry(listName, raw, groupId = null) {
  const errors = [];
  const needsClasses = ['codified', 'compositry', 'subclasses'].includes(listName);
  const ctx = { classNames: needsClasses ? (await getList('classes', { groupId })).map((c) => c.name) : [] };
  const input = raw && typeof raw === 'object' ? raw : {};
  const entry = LIST_DEFS[listName].validate(input, errors, ctx);
  entry.ruleset = rulesetOf(listName, { ...entry, ruleset: input.ruleset });
  return { entry, errors };
}

// ── File entries (cached, reloaded when the file changes) ────────────────────
// Each list remembers the file's last-modified time and a promise for its entries, so
// several requests arriving at once all wait for the same single load.
const cache = Object.fromEntries(LISTS.map((l) => [l, { mtime: 0, loading: Promise.resolve([]) }]));

function loadFile(listName) {
  const file = listFile(listName);
  const mtime = fs.statSync(file).mtimeMs;
  if (cache[listName].mtime !== mtime) {
    const previous = cache[listName].loading;
    cache[listName] = { mtime, loading: readFile(listName, file, mtime, previous) };
  }
  return cache[listName].loading;
}

async function readFile(listName, file, mtime, previous) {
  let raw = [];
  try {
    // The ?v= part makes Node re-read the file after it has been edited.
    raw = (await import(`${pathToFileURL(file).href}?v=${mtime}`)).default;
  } catch (err) {
    console.error(`\n[data] Could not read ${path.basename(file)} - ${err.message}\n       Fix the typo and save again. Keeping the last good version.\n`);
    return previous;
  }
  const seen = new Set();
  const entries = [];
  for (const item of raw) {
    const { entry, errors } = await validateEntry(listName, item);
    if (seen.has(entry.id)) errors.push(`duplicate id "${entry.id}"`);
    if (errors.length) {
      console.warn(`[data] Skipped "${item?.name || item?.id || '(unnamed)'}" in ${path.basename(file)}: ${errors.join('; ')}`);
      continue;
    }
    seen.add(entry.id);
    entries.push({ ...entry, origin: 'file' });
  }
  console.log(`[data] Loaded ${entries.length} entries from ${path.basename(file)}`);
  return entries;
}

/**
 * File entries + one group's DM-page entries, merged and sorted.
 * @param {{ groupId?: string|null, includeHidden?: boolean, rulesets?: string[]|null }} options
 *   groupId: whose DM-page edits to merge in (null = the files only)
 *   includeHidden: false for what players may see
 *   rulesets: only entries from these rulesets (null = every ruleset)
 */
export async function getList(listName, { groupId = null, includeHidden = true, rulesets = null } = {}) {
  const merged = new Map((await loadFile(listName)).map((s) => [s.id, s]));
  const rows = db.prepare('SELECT id, data FROM custom_entries WHERE group_id = ? AND list = ?').all(groupId, listName);
  for (const row of rows) {
    const entry = JSON.parse(row.data);
    // Saved before rulesets existed? An edit keeps the ruleset of the entry it replaces.
    const ruleset = RULESET_IDS.includes(entry.ruleset) ? entry.ruleset : merged.get(row.id)?.ruleset ?? rulesetOf(listName, entry);
    merged.set(row.id, { ...entry, ruleset, id: row.id, origin: merged.has(row.id) ? 'override' : 'custom' });
  }
  // The DM's hidden/public choice (if any) wins over what the entry itself says.
  const visibility = new Map(db.prepare('SELECT id, hidden FROM group_visibility WHERE group_id = ? AND list = ?').all(groupId, listName).map((r) => [r.id, !!r.hidden]));
  const all = [...merged.values()].map((e) => ({ ...e, hidden: visibility.has(e.id) ? visibility.get(e.id) : !!e.hidden }));
  return all
    .filter((e) => (includeHidden || !e.hidden) && (!rulesets || rulesets.includes(e.ruleset)))
    .sort(LIST_DEFS[listName].sort);
}

// DM-page entries for every list share one table; the `list` column says which list a row belongs to.
export function saveCustom(groupId, listName, entry) {
  db.prepare(
    `INSERT INTO custom_entries (group_id, list, id, data, updated_at) VALUES (?,?,?,?,?)
     ON CONFLICT(group_id, list, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(groupId, listName, entry.id, JSON.stringify(entry), new Date().toISOString());
}

export function deleteCustom(groupId, listName, id) {
  return db.prepare('DELETE FROM custom_entries WHERE group_id = ? AND list = ? AND id = ?').run(groupId, listName, id).changes > 0;
}

/** Marks one entry hidden (the group's DMs only) or public (the whole group). Works for file entries too. */
export function setHidden(groupId, listName, id, hidden) {
  db.prepare(
    `INSERT INTO group_visibility (group_id, list, id, hidden) VALUES (?,?,?,?)
     ON CONFLICT(group_id, list, id) DO UPDATE SET hidden = excluded.hidden`
  ).run(groupId, listName, id, hidden ? 1 : 0);
}

export function forgetVisibility(groupId, listName, id) {
  db.prepare('DELETE FROM group_visibility WHERE group_id = ? AND list = ? AND id = ?').run(groupId, listName, id);
}
