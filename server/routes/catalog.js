/**
 * server/routes/catalog.js - the spell, item, class, Component, subclass and NPC lists,
 * and a campaign DM's edits to them (the merging itself is in server/catalog.js).
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import { LISTS, getList, validateEntry, saveCustom, deleteCustom, setHidden, forgetVisibility } from '../catalog.js';
import { fail } from '../http.js';

// ── Catalog: spells, items and classes ───────────────────────────────────────
/**
 * The files plus the current group's DM-page edits. Players get only public
 * entries; the group's DMs also get the hidden ones (each marked hidden: true).
 * Not in a group (or signed out): the files only.
 */
const visibleTo = (group, listName) => getList(listName, { groupId: group?.id ?? null, includeHidden: group?.role === 'dm' });

async function listSpells({ group }) {
  return { codified: await visibleTo(group, 'codified'), compositry: await visibleTo(group, 'compositry') };
}

function checkList(name) {
  if (!LISTS.includes(name)) throw fail(404, 'Unknown list.');
  return name;
}

/** Create or update a spell, item or class from the DM page. */
async function saveEntry({ group, params, body }) {
  const listName = checkList(params.list);
  const { entry, errors } = await validateEntry(listName, { ...body, id: params.id || body.id }, group.id);
  if (errors.length) throw fail(400, `Not saved: ${errors.join('; ')}.`);
  saveCustom(group.id, listName, entry);
  setHidden(group.id, listName, entry.id, entry.hidden);
  return { entry };
}

async function removeEntry({ group, params }) {
  const listName = checkList(params.list);
  if (!deleteCustom(group.id, listName, params.id)) {
    throw fail(404, 'That entry lives in a data file. Remove it from the data/ folder instead.');
  }
  // If nothing is left under that id (it was not an edit of a file entry), drop its hidden/public choice too.
  if (!(await getList(listName, { groupId: group.id })).some((e) => e.id === params.id)) forgetVisibility(group.id, listName, params.id);
  return { ok: true };
}

/** The Hide / Publish button on the DM page. */
async function setVisibility({ group, params, body }) {
  const listName = checkList(params.list);
  if (!(await getList(listName, { groupId: group.id })).some((e) => e.id === params.id)) throw fail(404, 'Entry not found.');
  setHidden(group.id, listName, params.id, !!body.hidden);
  return { ok: true, hidden: !!body.hidden };
}

export const routes = [
  ['GET',    '/api/spells',                  'public', listSpells],
  ['GET',    '/api/items',                   'public', async ({ group }) => ({ items: await visibleTo(group, 'items') })],
  ['GET',    '/api/classes',                 'public', async ({ group }) => ({ classes: await visibleTo(group, 'classes') })],
  ['GET',    '/api/components',              'public', async ({ group }) => ({ components: await visibleTo(group, 'components') })],
  ['GET',    '/api/subclasses',              'public', async ({ group }) => ({ subclasses: await visibleTo(group, 'subclasses') })],
  // NPCs & enemies: the group's DMs only. There is no public route for this list.
  ['GET',    '/api/npcs',                    'dm',     async ({ group }) => ({ npcs: await getList('npcs', { groupId: group.id }) })],
  // :list is one of: codified, compositry, components, items, classes, subclasses, npcs
  ['PUT',    '/api/catalog/:list/:id/visibility', 'dm', setVisibility],
  ['POST',   '/api/catalog/:list',           'dm',     saveEntry],
  ['PUT',    '/api/catalog/:list/:id',       'dm',     saveEntry],
  ['DELETE', '/api/catalog/:list/:id',       'dm',     removeEntry],
];
