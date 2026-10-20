/**
 * pages/campaign-party.js - the campaign hub's Party tab (everyone) and Homebrew tab (players).
 */
import { api, state, isDM, setHomebrew } from '../api.js';
import { reloadPage } from '../nav.js';
import { esc, icon, toast } from '../ui.js';

// ── Party ────────────────────────────────────────────────────────────────────
/** Every character in the campaign. You can open your own; DMs can open all of them. */
export async function partyTab(body) {
  const [{ characters }, mine] = await Promise.all([
    api('GET', '/group/characters'),
    api('GET', '/characters').then((r) => r.characters),
  ]);
  const g = state.group;
  const canOpen = (c) => c.ownerId === state.user.id || isDM();
  const addable = mine.filter((c) => c.groupId !== g.id);
  body.innerHTML = `
    <div class="row between">
      <p class="small muted">${isDM() ? 'Every character in this campaign. Open one to view and edit it - hand out XP, items or spells.' : 'The characters in this campaign. Your DM can open and edit the ones in it.'}</p>
      <a class="btn primary sm" href="#/characters/new?campaign=${g.id}">${icon('plus')}New character for this campaign</a>
    </div>
    ${characters.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Character</th><th>Player</th><th>Class</th><th class="c">Level</th><th>Last saved</th><th></th></tr></thead>
      <tbody>${characters.map((c) => `<tr>
        <td><b>${esc(c.name)}</b></td><td>${esc(c.ownerName)}${c.ownerId === state.user.id ? ' (you)' : ''}</td><td>${esc(c.className || '-')}</td><td class="c">${c.level}</td>
        <td>${new Date(c.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
        <td>${canOpen(c) ? `<a class="btn sm" href="#/characters/${c.id}">${icon('eye')}Open sheet</a>` : ''}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty">${icon('users')}<h2>No characters yet</h2><p>Add one of yours below, or make a new one for this campaign.</p></div>`}
    ${addable.length ? `<form class="card stack gap-above" id="add-char">
        <h3>Bring one of your characters</h3>
        <div class="inline-form"><select name="char" aria-label="Your character">${addable.map((c) => `<option value="${c.id}">${esc(c.name)}${c.groupName ? ` (now in ${esc(c.groupName)})` : ''}</option>`).join('')}</select>
          <button class="btn" type="submit">${icon('plus')}Add to ${esc(g.name)}</button></div>
        <p class="small muted">A character is in one campaign at a time; adding it here moves it.</p>
      </form>` : ''}`;
  body.querySelector('#add-char')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('PUT', `/characters/${e.target.char.value}/campaign`, { groupId: g.id }); toast('Character added.'); reloadPage(); } catch (err) { toast(err.message, 'error'); }
  });
}


// ── Homebrew (players) ───────────────────────────────────────────────────────
/** Players do not edit homebrew; this opens the site's lists with this campaign's homebrew included. */
export function homebrewTab(body) {
  const g = state.group;
  const lists = [
    ['#/spells/compositry', 'scroll', 'Compositry spells'], ['#/spells/codified', 'scroll', 'Codified spells'],
    ['#/spells/components', 'leaf', 'Physical & Aspectual Components'], ['#/items', 'sword', 'Items & Weapons'], ['#/classes', 'shield', 'Classes & subclasses'],
    ['#/craft', 'sparkles', 'Spellcrafter'],
  ];
  body.innerHTML = `
    <p class="muted">Your DM may have added or changed spells, items and classes for ${esc(g.name)}. Open a list with this campaign's homebrew included:</p>
    <div class="grid cols-auto">${lists.map(([href, ic, label]) => `<a class="card" href="${href}" data-homebrew>${icon(ic)}<h3>${label}</h3></a>`).join('')}</div>`;
  body.addEventListener('click', async (e) => {
    const link = e.target.closest('[data-homebrew]');
    if (!link) return;
    e.preventDefault();
    await setHomebrew(g.id);
    location.hash = link.getAttribute('href');
  });
}
