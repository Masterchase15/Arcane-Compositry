/**
 * pages/campaign.js - a campaign's hub (#/campaign/<id>). The campaign banner
 * at the top (app.js) shows you are inside it; everything here belongs to this
 * campaign alone.
 *
 * Everyone in the campaign:
 *   Party                      every character in the campaign; add one of yours
 *   Homebrew (players)         browse the site's lists with this campaign's homebrew
 * The campaign's DMs also get the DM tools:
 *   Spells / Items / Classes   add, edit and remove entries without touching code
 *   Initiative Tracker         run encounters: turn order, HP, Guard (see pages/initiative.js)
 *   NPCs & Enemies             your private roster of stat blocks - never shown to players
 *   Group                      the invite code, the campaign's name, its members (make DM, remove)
 *   Session notes / Lore       private notebooks, saved as you type
 *
 * Each tab lives in its own file: campaign-party.js (Party, Homebrew),
 * campaign-homebrew.js (the spell / item / class / NPC editors), initiative.js,
 * campaign-group.js (invite code, members) and campaign-notes.js (notes, lore).
 */
import { state, isDM } from '../api.js';
import { reloadPage, replaceQuery } from '../nav.js';
import { esc, icon } from '../ui.js';
import { catalogTab } from './campaign-homebrew.js';
import { partyTab, homebrewTab } from './campaign-party.js';
import { playersTab } from './campaign-group.js';
import { notesTab } from './campaign-notes.js';
import { initiativeTab } from './initiative.js';

// [id, label, who sees it]
const TABS = [
  ['party', 'Party', 'all'], ['homebrew', 'Homebrew', 'player'],
  ['initiative', 'Initiative Tracker', 'dm'],
  ['spells', 'Spells', 'dm'], ['items', 'Items & Weapons', 'dm'], ['classes', 'Classes', 'dm'], ['npcs', 'NPCs & Enemies', 'dm'],
  ['players', 'Group', 'dm'], ['notes', 'Session notes', 'dm'], ['lore', 'Lore', 'dm'],
];
let tab = 'party';
// Some tabs hold more than one list, chosen with the buttons at the top of the tab.
const GROUPS = {
  spells: [['codified', 'Codified (D&D)'], ['compositry', 'Compositry (custom)'], ['components', 'Physical & Aspectual']],
  classes: [['classes', 'Classes'], ['subclasses', 'Subclasses']],
};
const chosen = { spells: 'codified', classes: 'classes' }; // which list each of those tabs is showing

/** This page's own address, for keeping the open tab in the URL. */
const here = () => `/campaign/${state.group.id}`;

export async function render(main, { query }) {
  if (!state.user || !state.group) {
    main.innerHTML = `<div class="empty">${icon('flag')}<h2>Campaign not found</h2><p>You are not in this campaign, or it no longer exists.</p><a class="btn primary" href="#/campaigns">My campaigns</a></div>`;
    return;
  }
  const tabs = TABS.filter(([, , who]) => who === 'all' || (who === 'dm' ? isDM() : !isDM()));
  if (tabs.some(([id]) => id === query.get('tab'))) tab = query.get('tab');
  if (!tabs.some(([id]) => id === tab)) tab = 'party';
  if (GROUPS[tab]?.some(([id]) => id === query.get('list'))) chosen[tab] = query.get('list');
  const address = () => (GROUPS[tab] ? { tab, list: chosen[tab] } : { tab });
  main.innerHTML = `
    <div class="page-head"><p class="kicker">${isDM() ? 'Dungeon Master' : 'Player'}</p><h1>${esc(state.group.name)}</h1><hr class="rule"></div>
    <div class="tabs" role="tablist" aria-label="Campaign">
      ${tabs.map(([id, label]) => `<button role="tab" data-tab="${id}" aria-selected="${id === tab}">${label}</button>`).join('')}
    </div>
    <div id="dm-body"></div>`;
  const body = main.querySelector('#dm-body');
  main.querySelector('.tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (btn) { tab = btn.dataset.tab; replaceQuery(here(), address()); reloadPage(); }
  });
  main.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

  let cleanup;
  if (GROUPS[tab]) await catalogTab(body, chosen[tab], GROUPS[tab], tab);
  else if (tab === 'items' || tab === 'npcs') await catalogTab(body, tab, null, tab);
  else if (tab === 'initiative') cleanup = await initiativeTab(body, query);
  else if (tab === 'party') await partyTab(body);
  else if (tab === 'homebrew') homebrewTab(body);
  else if (tab === 'players') await playersTab(body);
  else cleanup = await notesTab(body, tab === 'lore' ? 'lore' : 'session');
  return cleanup;
}
