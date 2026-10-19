/**
 * nav.js - small navigation helpers shared by the pages.
 */
import { state, setHomebrew, campaignHref } from './api.js';
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
 * The Homebrew filter at the top of the spell, item, class and Spellcrafter
 * pages: show the standard rules only, or include one of your campaigns'
 * homebrew. Only shown to people in at least one campaign.
 */
export function homebrewBar(main) {
  if (!state.user || !state.groups.length) return;
  const g = state.group;
  const bar = document.createElement('div');
  bar.className = `homebrew-bar${g ? ' active' : ''}`;
  bar.innerHTML = `
    <label for="homebrew-select">${icon('flag')}Homebrew</label>
    <select id="homebrew-select">
      <option value="">Standard rules only</option>
      ${state.groups.map((x) => `<option value="${x.id}"${x.id === g?.id ? ' selected' : ''}>Include ${esc(x.name)}</option>`).join('')}
    </select>
    ${g ? `<span class="small">${g.role === 'dm' ? 'You are the DM: hidden entries are shown and marked.' : `Showing ${esc(g.name)}'s homebrew too.`}
      <a href="${campaignHref(g.id)}">Open campaign</a></span>` : ''}`;
  bar.querySelector('select').addEventListener('change', async (e) => {
    await setHomebrew(e.target.value || null);
    reloadPage();
  });
  const head = main.querySelector('.page-head');
  if (head) head.after(bar); else main.prepend(bar);
}

/** Redraws the current page from scratch (after deleting something, for example). */
export function reloadPage() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
