/**
 * app.js - the front door. Draws the navigation and shows the right page.
 *
 * The site is a "single page app": the address after the # decides which page
 * module is shown, e.g.  /#/spells/codified  ->  pages/spells.js
 *
 * Before each page is drawn, the router decides which campaign it uses (see
 * the CAMPAIGNS note in api.js): a campaign hub (#/campaign/<id>) uses that
 * campaign and shows the campaign banner; every other page uses the Homebrew
 * filter's choice, or the standard rules.
 *
 * ─── TO ADD A PAGE ─────────────────────────────────────────────────────────
 *  1. Create public/js/pages/my-page.js exporting  `export async function render(main, ctx) {...}`
 *     (fill `main.innerHTML`; you may return a function that runs when the page is left).
 *  2. Add one line to ROUTES below.
 *  3. Optionally add it to NAV so it shows in the menu.
 *  Add `homebrew: true` to its ROUTES line to give it the Homebrew filter bar
 *  (for pages that show spells, items, classes or Components).
 */
import { state, loadUser, loadClasses, loadComponents, refreshCatalog, useGroup, campaignHref, api, isDM } from './api.js';
import { esc, icon, openDialog, toast } from './ui.js';
import { homebrewBar } from './nav.js';

const ROUTES = [
  { path: /^\/$/,                               load: () => import('./pages/home.js') },
  { path: /^\/codex(?:\/([\w-]+))?$/,           load: () => import('./pages/codex.js') },
  { path: /^\/craft$/,                          load: () => import('./pages/craft.js'), homebrew: true },
  { path: /^\/tools$/,                          load: () => import('./pages/tools.js') },
  { path: /^\/spells\/components$/,              load: () => import('./pages/components.js'), homebrew: true },
  { path: /^\/spells(?:\/(codified|compositry))?$/, load: () => import('./pages/spells.js'), homebrew: true },
  { path: /^\/items$/,                          load: () => import('./pages/items.js'), homebrew: true },
  { path: /^\/classes(?:\/([\w-]+))?$/,         load: () => import('./pages/classes.js'), homebrew: true },
  { path: /^\/characters$/,                     load: () => import('./pages/characters.js') },
  { path: /^\/characters\/new$/,                load: () => import('./pages/new-character.js') },
  { path: /^\/characters\/([\w-]+)$/,           load: () => import('./pages/sheet.js') },
  { path: /^\/guide$/,                          load: () => import('./pages/guide.js') },
  { path: /^\/account$/,                        load: () => import('./pages/account.js') },
  { path: /^\/campaigns$/,                      load: () => import('./pages/campaigns.js') },
  { path: /^\/campaign\/([\w-]+)$/,             load: () => import('./pages/campaign.js') },
  // Old address of the DM page: the campaign list now leads to each campaign's DM tools.
  { path: /^\/dm$/,                             load: () => import('./pages/campaigns.js') },
];

/** Menu entries. `tab: true` also puts the entry in the phone bottom bar (keep that to 5). */
const NAV = [
  { href: '#/',           label: 'Home',       icon: 'home',       topbar: false },
  { href: '#/codex',      label: 'Codex',      icon: 'book',       tab: true },
  { href: '#/craft',      label: 'Spellcraft', icon: 'sparkles',   tab: true },
  { href: '#/tools',      label: 'Calculators', icon: 'calculator' },
  { href: '#/spells',     label: 'Spells',     icon: 'scroll',     tab: true },
  { href: '#/items',      label: 'Items & Weapons', icon: 'sword' },
  { href: '#/classes',    label: 'Classes',    icon: 'shield' },
  { href: '#/characters', label: 'Characters', icon: 'users',      tab: true },
  { href: '#/campaigns',  label: 'Campaigns',  icon: 'flag',       tab: true },
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
    </nav>
    <div class="topbar-actions">
      <button class="btn ghost icon-only" id="theme-btn" aria-label="Switch to ${isDark() ? 'light' : 'dark'} theme">${icon(isDark() ? 'sun' : 'moon')}</button>
      ${user
        ? `<button class="btn" id="account-btn">${icon('user')}<span>${esc(user.displayName)}</span></button>`
        : `<a class="btn primary" href="#/account">Sign in</a>`}
      <button class="btn ghost icon-only only-mobile" id="menu-btn" aria-label="Open menu">${icon('menu')}</button>
    </div>`;

  document.getElementById('tabbar').innerHTML = NAV.filter((n) => n.tab).map(link).join('');
  drawCampaignBar(path);
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('menu-btn').addEventListener('click', () => openMenu(false));
  document.getElementById('account-btn')?.addEventListener('click', () => openMenu(true));
}

/**
 * The campaign banner under the top bar - shown only inside a campaign hub, so
 * it is always clear whether you are browsing the site or in a campaign.
 */
function drawCampaignBar(path) {
  let bar = document.getElementById('campaign-bar');
  const g = isCampaignPath(path) ? state.group : null;
  if (!g) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'campaign-bar';
    bar.className = 'campaign-bar';
    document.getElementById('topbar').after(bar);
  }
  const others = state.groups.filter((x) => x.id !== g.id);
  bar.innerHTML = `
    <div class="campaign-bar-inner">
      <span class="campaign-bar-label">${icon('flag')}<span><span class="kicker">Campaign</span><b>${esc(g.name)}</b></span>
        <span class="badge ${g.role === 'dm' ? 'gold' : ''}">${g.role === 'dm' ? 'DM' : 'Player'}</span></span>
      <span class="row">
        ${others.length ? `<button class="btn sm ghost" id="switch-campaign">Switch</button>` : ''}
        <a class="btn sm" href="#/">${icon('back')}Exit to site</a>
      </span>
    </div>`;
  bar.querySelector('#switch-campaign')?.addEventListener('click', () => {
    const dlg = openDialog({
      title: 'Switch campaign', narrow: true,
      body: `<div class="menu-list">${others.map((x) => `<a href="${campaignHref(x.id)}" data-close>${icon(x.role === 'dm' ? 'crown' : 'flag')}${esc(x.name)}</a>`).join('')}
        <hr><a href="#/campaigns" data-close>${icon('plus')}All campaigns</a></div>`,
    });
    return dlg;
  });
}

const isCampaignPath = (path) => /^\/campaign\//.test(path);

/** The slide-up menu: everything that does not fit in the bottom bar, plus account actions. */
function openMenu(accountOnly) {
  const user = state.user;
  const pages = accountOnly ? '' : `
    ${NAV.filter((n) => !n.tab).map((n) => `<a href="${n.href}" data-close>${icon(n.icon)}${n.label}</a>`).join('')}
    <hr>`;
  const dlg = openDialog({
    title: user ? esc(user.displayName) : 'Menu',
    narrow: true,
    body: `<div class="menu-list">
      ${pages}
      ${user
        ? `<a href="#/campaigns" data-close>${icon('flag')}My campaigns</a>
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
    state.groups = [];
    state.homebrew = null;
    await useGroup(null);
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
  // Which campaign this page uses: the hub's own, else the Homebrew filter's choice.
  await useGroup(isCampaignPath(path) ? match?.m[1] : state.homebrew);
  if (id !== navId) return;
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
    if (match.r.homebrew) homebrewBar(main);
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
// The user (and so their campaigns) first: the class and Component lists depend on the campaign.
await loadUser();
await useGroup(state.homebrew);
await Promise.all([loadClasses().catch(() => {}), loadComponents().catch(() => {})]);
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
