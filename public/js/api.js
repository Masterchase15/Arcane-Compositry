/**
 * api.js - how the pages talk to the server (see server/api.js for the other side).
 *
 * Also holds the tiny bit of shared state: who is signed in, their campaigns,
 * and the spell lists.
 *
 * ─── CAMPAIGNS ("groups" in the code) ───────────────────────────────────────
 *  The site has two modes, and the page you are on decides which:
 *   - BROWSING (every page except #/campaign/...): the standard rules. The
 *     spell, item and class lists may also include one campaign's homebrew if
 *     you pick it in the "Homebrew" filter (state.homebrew, remembered).
 *   - INSIDE A CAMPAIGN (#/campaign/<id>): that campaign's hub, with a banner.
 *  `state.group` is the campaign the current page is using (null = standard
 *  rules only). app.js sets it before each page is drawn; the character sheet
 *  switches it to the character's campaign. Every request carries
 *  ?group=<id> of it, so the server knows whose homebrew, notes and party to
 *  use. `state.user.role` is the user's role there, so isDM() means "DM of
 *  the campaign this page is using".
 */
import { setClasses, setComponents } from './rules/constants.js';

/**
 * Sends a request to /api/... and returns the JSON answer. Throws an Error with .fields on failure.
 * options.group: send this campaign id instead of the current one (null = none).
 */
export async function api(method, path, body, options = {}) {
  let response;
  const groupId = 'group' in options ? options.group : state.group?.id;
  const url = groupId ? `/api${path}${path.includes('?') ? '&' : '?'}group=${encodeURIComponent(groupId)}` : `/api${path}`;
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
 * Shared state. `user` is null when signed out. `groups` = every campaign the
 * user is in. `group` = the campaign the current page is using (see above).
 * `homebrew` = the campaign id picked in the browsing pages' Homebrew filter.
 * `inviteRequired` = sign-up needs an invite code.
 */
export const state = { user: null, groups: [], group: null, homebrew: null, inviteRequired: false, spells: null, items: null, classes: null, components: null, subclasses: null };

const HOMEBREW_KEY = 'ac-homebrew';
const remember = {
  get() { try { return localStorage.getItem(HOMEBREW_KEY); } catch { return null; } },
  set(id) { try { if (id) localStorage.setItem(HOMEBREW_KEY, id); else localStorage.removeItem(HOMEBREW_KEY); } catch { /* private mode: ignore */ } },
};

/** Loads who is signed in and their campaigns. */
export async function loadUser() {
  try {
    const me = await api('GET', '/auth/me', undefined, { group: null });
    state.user = me.user;
    state.groups = me.groups || [];
    state.inviteRequired = !!me.inviteRequired;
  } catch { state.user = null; state.groups = []; }
  // Forget a Homebrew choice for a campaign you are no longer in.
  state.homebrew = state.groups.some((g) => g.id === remember.get()) ? remember.get() : null;
  if (state.group) state.group = state.groups.find((g) => g.id === state.group.id) || null;
  if (state.user) state.user.role = state.group?.role || 'player';
  return state.user;
}

export const findGroup = (id) => state.groups.find((g) => g.id === id) || null;

/**
 * Makes the current page use this campaign (or none: null). When that changes,
 * the cached lists are fetched again, since each campaign has its own homebrew.
 */
export async function useGroup(id) {
  const next = findGroup(id);
  if (state.user) state.user.role = next?.role || 'player';
  if (next?.id === state.group?.id) { state.group = next; return; }
  state.group = next;
  await refreshCatalog();
}

/** The browsing pages' Homebrew filter: include this campaign's homebrew (null = standard rules only). */
export async function setHomebrew(id) {
  state.homebrew = findGroup(id)?.id || null;
  remember.set(state.homebrew);
  await useGroup(state.homebrew);
}

/** Address of a campaign's hub page, e.g. campaignHref('abc', { tab: 'items' }) -> '#/campaign/abc?tab=items'. */
export function campaignHref(id = state.group?.id, params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  return `#/campaign/${id}${qs ? `?${qs}` : ''}`;
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
