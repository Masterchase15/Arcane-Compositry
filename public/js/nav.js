/**
 * nav.js - small navigation helpers shared by the pages.
 */
import { state } from './api.js';
import { esc, icon } from './ui.js';

/** The part of the address after the #, split into path and ?query. */
export function currentPath() {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  return { path: path || '/', query: new URLSearchParams(query) };
}

/** Changes the address without adding a history entry (used for filters, so links stay shareable). */
export function replaceQuery(path, params) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  history.replaceState(null, '', `#${path}${qs ? `?${qs}` : ''}`);
}

/** Shows a "please sign in" message to signed-out visitors. Returns true when someone is signed in. */
export function requireUser(main, what) {
  if (state.user) return true;
  main.innerHTML = `<div class="empty">${icon('user')}<h2>Sign in to ${esc(what)}</h2>
    <p>Characters are saved to your account so you can open them on any device.</p>
    <a class="btn primary" href="#/account?next=${encodeURIComponent(currentPath().path)}">Sign in or create an account</a></div>`;
  return false;
}

/**
 * For pages that need a group (characters belong to one). Shows a "join or
 * create a group" message and returns false when the user is not in any.
 */
export function requireGroup(main) {
  if (state.group) return true;
  main.innerHTML = `<div class="empty">${icon('users')}<h2>Join a group first</h2>
    <p>Characters belong to a campaign group. Ask your DM for their group's invite code, or start your own group.</p>
    <a class="btn primary" href="#/account">Join or create a group</a></div>`;
  return false;
}

/** Redraws the current page from scratch (after deleting something, for example). */
export function reloadPage() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
