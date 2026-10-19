/**
 * api.js - how the pages talk to the server (see server/api.js for the other side).
 *
 * Also holds the tiny bit of shared state: who is signed in, which group
 * (campaign) they are looking at, and the spell lists.
 *
 * Every request carries ?group=<id> of the current group, so the server knows
 * whose characters, notes and DM-page edits to use. `state.user.role` is the
 * user's role in that group ('dm' or 'player'), so isDM() means "DM of this group".
 */
import { setClasses, setComponents } from './rules/constants.js';

/** Sends a request to /api/... and returns the JSON answer. Throws an Error with .fields on failure. */
export async function api(method, path, body) {
  let response;
  const url = state.group ? `/api${path}${path.includes('?') ? '&' : '?'}group=${encodeURIComponent(state.group.id)}` : `/api${path}`;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined && method === 'GET' ? {} : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
      credentials: 'same-origin',
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: response.status, fields: data.fields });
  }
  return data;
}

/**
 * Shared state. `user` is null when signed out. `groups` = every group the user
 * is in; `group` = the one being shown (null if none). `inviteRequired` = sign-up
 * needs an invite code.
 */
export const state = { user: null, groups: [], group: null, inviteRequired: false, spells: null, items: null, classes: null, components: null, subclasses: null };

const GROUP_KEY = 'ac-group';
const remember = {
  get() { try { return localStorage.getItem(GROUP_KEY); } catch { return null; } },
  set(id) { try { if (id) localStorage.setItem(GROUP_KEY, id); else localStorage.removeItem(GROUP_KEY); } catch { /* private mode: ignore */ } },
};

/** Loads who is signed in and their groups, and picks the group to show (the last one used, else the first). */
export async function loadUser() {
  try {
    const me = await api('GET', '/auth/me');
    state.user = me.user;
    state.groups = me.groups || [];
    state.inviteRequired = !!me.inviteRequired;
  } catch { state.user = null; state.groups = []; }
  pickGroup(remember.get());
  return state.user;
}

function pickGroup(id) {
  state.group = state.groups.find((g) => g.id === id) || state.groups[0] || null;
  if (state.user) state.user.role = state.group?.role || 'player';
  if (state.group) remember.set(state.group.id);
}

/** Switches to another group, then re-fetches the lists (each group has its own edits and hidden entries). */
export async function setGroup(id) {
  pickGroup(id);
  await refreshCatalog();
}

/** Spell lists are fetched once and reused; pass true to force a fresh copy (after a DM edit). */
export async function loadSpells(force = false) {
  if (!state.spells || force) state.spells = await api('GET', '/spells');
  return state.spells;
}

/** Items & weapons, fetched once and reused; pass true after a DM edit. */
export async function loadItems(force = false) {
  if (!state.items || force) state.items = (await api('GET', '/items')).items;
  return state.items;
}

/**
 * Classes. Loaded when the site starts, because class names are needed almost
 * everywhere (filters, the sheet, the new-character form).
 */
export async function loadClasses(force = false) {
  if (!state.classes || force) {
    state.classes = (await api('GET', '/classes')).classes;
    setClasses(state.classes);
  }
  return state.classes;
}

/** Subclasses the viewer is allowed to see, fetched once and reused; pass true after a DM edit. */
export async function loadSubclasses(force = false) {
  if (!state.subclasses || force) state.subclasses = (await api('GET', '/subclasses')).subclasses;
  return state.subclasses;
}

/**
 * Every subclass that belongs to a class: the ones from the Subclasses list whose
 * `className` matches, plus any quick ones typed straight onto the class itself.
 * Call loadSubclasses() first.
 */
export function subclassesOf(cls) {
  if (!cls) return [];
  const listed = (state.subclasses || []).filter((s) => s.className.toLowerCase() === cls.name.toLowerCase());
  const quick = (cls.subclasses || [])
    .filter((q) => !listed.some((s) => s.name.toLowerCase() === q.name.toLowerCase()))
    .map((q, i) => ({ id: `quick-${i}`, name: q.name, className: cls.name, description: q.text, features: q.features, compositry: '', tags: [], source: '', hidden: false, quick: true }));
  return [...listed, ...quick];
}

/**
 * Physical & Aspectual Components the viewer is allowed to see. Loaded when the
 * site starts (the Spellcrafter and the sheet both need them).
 */
export async function loadComponents(force = false) {
  if (!state.components || force) {
    state.components = (await api('GET', '/components')).components;
    setComponents(state.components);
  }
  return state.components;
}

/**
 * Signing in or out changes what may be seen (DMs see hidden entries), so
 * every cached list is fetched again.
 */
export async function refreshCatalog() {
  state.spells = null;
  state.items = null;
  state.subclasses = null;
  await Promise.all([loadClasses(true), loadComponents(true)]).catch(() => {});
}

export const isDM = () => state.user?.role === 'dm';
