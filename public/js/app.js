/**
 * app.js - the front door. Draws the navigation and shows the right page.
 *
 * The site is a "single page app": the address after the # decides which page
 * module is shown, e.g.  /#/spells/codified  ->  pages/spells.js
 *
 * ─── TO ADD A PAGE ─────────────────────────────────────────────────────────
 *  1. Create public/js/pages/my-page.js exporting  `export async function render(main, ctx) {...}`
 *     (fill `main.innerHTML`; you may return a function that runs when the page is left).
 *  2. Add one line to ROUTES below.
 *  3. Optionally add it to NAV so it shows in the menu.
 */
import { state, loadUser, loadClasses, loadComponents, refreshCatalog, api, isDM } from './api.js';
import { esc, icon, openDialog, toast } from './ui.js';

const ROUTES = [
  { path: /^\/$/,                               load: () => import('./pages/home.js') },
  { path: /^\/codex(?:\/([\w-]+))?$/,           load: () => import('./pages/codex.js') },
  { path: /^\/craft$/,                          load: () => import('./pages/craft.js') },
  { path: /^\/tools$/,                          load: () => import('./pages/tools.js') },
  { path: /^\/spells\/components$/,              load: () => import('./pages/components.js') },
  { path: /^\/spells(?:\/(codified|compositry))?$/, load: () => import('./pages/spells.js') },
  { path: /^\/items$/,                          load: () => import('./pages/items.js') },
  { path: /^\/classes(?:\/([\w-]+))?$/,         load: () => import('./pages/classes.js') },
  { path: /^\/characters$/,                     load: () => import('./pages/characters.js') },
  { path: /^\/characters\/new$/,                load: () => import('./pages/new-character.js') },
  { path: /^\/characters\/([\w-]+)$/,           load: () => import('./pages/sheet.js') },
  { path: /^\/guide$/,                          load: () => import('./pages/guide.js') },
  { path: /^\/account$/,                        load: () => import('./pages/account.js') },
  { path: /^\/dm$/,                             load: () => import('./pages/dm.js') },
];

/** Menu entries. `tab: true` also puts the entry in the phone bottom bar (keep that to 5). */
const NAV = [
  { href: '#/',           label: 'Home',       icon: 'home',       tab: true, topbar: false },
  { href: '#/codex',      label: 'Codex',      icon: 'book',       tab: true },
  { href: '#/craft',      label: 'Spellcraft', icon: 'sparkles',   tab: true },
  { href: '#/tools',      label: 'Calculators', icon: 'calculator' },
  { href: '#/spells',     label: 'Spells',     icon: 'scroll',     tab: true },
  { href: '#/items',      label: 'Items & Weapons', icon: 'sword' },
  { href: '#/classes',    label: 'Classes',    icon: 'shield' },
  { href: '#/characters', label: 'Characters', icon: 'users',      tab: true },
  { href: '#/guide',      label: 'Guide',      icon: 'compass' },
];

// ── Theme (light / dark) ─────────────────────────────────────────────────────
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode: ignore */ } },
};
function applyTheme() {
  const saved = storage.get('ac-theme');
  if (saved) document.documentElement.dataset.theme = saved;
}
function isDark() {
  const set = document.documentElement.dataset.theme;
  return set ? set === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  storage.set('ac-theme', next);
  drawShell();
}

// ── Navigation chrome ────────────────────────────────────────────────────────
function currentPath() {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  return { path: path || '/', query: new URLSearchParams(query) };
}
const isCurrent = (href, path) => (href === '#/' ? path === '/' : path.startsWith(href.slice(1)));

export function drawShell() {
  const { path } = currentPath();
  const link = (n) =>
    `<a href="${n.href}"${isCurrent(n.href, path) ? ' aria-current="page"' : ''}>${icon(n.icon)}<span>${n.label}</span></a>`;
  const user = state.user;

  document.getElementById('topbar').innerHTML = `
    <a class="brand" href="#/" aria-label="Arcane Compositry home">
      <span class="brand-mark" aria-hidden="true">AC</span>
      <span class="brand-text"><b>Arcane Compositry</b><span>Dungeons &amp; Dragons</span></span>
    </a>
    <nav class="nav-links" aria-label="Main">
      ${NAV.filter((n) => n.topbar !== false).map(link).join('')}
      ${isDM() ? link({ href: '#/dm', label: 'DM', icon: 'crown' }) : ''}
    </nav>
    <div class="topbar-actions">
      <button class="btn ghost icon-only" id="theme-btn" aria-label="Switch to ${isDark() ? 'light' : 'dark'} theme">${icon(isDark() ? 'sun' : 'moon')}</button>
      ${user
        ? `<button class="btn" id="account-btn">${icon('user')}<span>${esc(user.displayName)}</span></button>`
        : `<a class="btn primary" href="#/account">Sign in</a>`}
      <button class="btn ghost icon-only only-mobile" id="menu-btn" aria-label="Open menu">${icon('menu')}</button>
    </div>`;

  document.getElementById('tabbar').innerHTML = NAV.filter((n) => n.tab).map(link).join('');
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('menu-btn').addEventListener('click', () => openMenu(false));
  document.getElementById('account-btn')?.addEventListener('click', () => openMenu(true));
}

/** The slide-up menu: everything that does not fit in the bottom bar, plus account actions. */
function openMenu(accountOnly) {
  const user = state.user;
  const pages = accountOnly ? '' : `
    ${NAV.filter((n) => !n.tab).map((n) => `<a href="${n.href}" data-close>${icon(n.icon)}${n.label}</a>`).join('')}
    ${isDM() ? `<a href="#/dm" data-close>${icon('crown')}DM tools</a>` : ''}
    <hr>`;
  const dlg = openDialog({
    title: user ? esc(user.displayName) : 'Menu',
    narrow: true,
    body: `<div class="menu-list">
      ${pages}
      ${user
        ? `${accountOnly && isDM() ? `<a href="#/dm" data-close>${icon('crown')}DM tools</a>` : ''}
           <a href="#/characters" data-close>${icon('users')}My characters</a>
           <a href="#/account" data-close>${icon('user')}Account settings</a>
           <hr>
           <button id="signout">${icon('logout')}Sign out</button>`
        : `<a href="#/account" data-close>${icon('user')}Sign in or create an account</a>`}
    </div>`,
  });
  dlg.querySelector('#signout')?.addEventListener('click', async () => {
    await api('POST', '/auth/logout').catch(() => {});
    state.user = null;
    await refreshCatalog();
    dlg.close();
    toast('Signed out.');
    if (location.hash === '#/') route(); else location.hash = '#/';
  });
}

// ── Router ───────────────────────────────────────────────────────────────────
let leavePage = null;
let navId = 0;

async function route() {
  const id = ++navId;
  const { path, query } = currentPath();
  const match = ROUTES.map((r) => ({ r, m: path.match(r.path) })).find((x) => x.m);

  // Let the page being left tidy up (the sheet uses this to save pending edits).
  try { await leavePage?.(); } catch { /* never block navigation */ }
  leavePage = null;
  drawShell();

  // Start every page with a brand-new <main>, so click handlers from the
  // previous page can never linger.
  const old = document.getElementById('main');
  const main = old.cloneNode(false);
  old.replaceWith(main);

  if (!match) {
    main.innerHTML = `<div class="empty"><h1>Page not found</h1><p>That page does not exist.</p><a class="btn primary" href="#/">Back to home</a></div>`;
    return;
  }
  try {
    const page = await match.r.load();
    if (id !== navId) return; // the person already moved on
    const cleanup = await page.render(main, { params: match.m.slice(1), query, path });
    if (id !== navId) return void cleanup?.();
    leavePage = cleanup || null;
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="empty">${icon('alert')}<h2>This page could not be loaded</h2><p>${esc(err.message)}</p>
      <button class="btn primary" id="retry">${icon('refresh')}Try again</button></div>`;
    main.querySelector('#retry').addEventListener('click', route);
  }
  // Only jump to the top when moving to a different page, not when a filter changes the address.
  if (route.lastPath !== path) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
  route.lastPath = path;
}

// ── Start ────────────────────────────────────────────────────────────────────
applyTheme();
drawShell();
await Promise.all([loadUser(), loadClasses().catch(() => {}), loadComponents().catch(() => {})]);
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
