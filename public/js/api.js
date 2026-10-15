/**
 * api.js - how the pages talk to the server (see server/api.js for the other side).
 *
 * Also holds the tiny bit of shared state: who is signed in, and the spell lists.
 */
import { setClasses, setComponents } from './rules/constants.js';

/** Sends a request to /api/... and returns the JSON answer. Throws an Error with .fields on failure. */
export async function api(method, path, body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
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

/** Shared state. `user` is null when signed out. */
export const state = { user: null, spells: null, items: null, classes: null, components: null, subclasses: null };

export async function loadUser() {
  try { state.user = (await api('GET', '/auth/me')).user; } catch { state.user = null; }
  return state.user;
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
