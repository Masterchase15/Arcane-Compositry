/**
 * pages/campaign-group.js - the campaign hub's Group tab (DMs): invite code, name, members.
 */
import { api, state, loadUser } from '../api.js';
import { reloadPage } from '../nav.js';
import { esc, icon, confirmDialog, toast } from '../ui.js';

// ── Group: invite code, name, members ────────────────────────────────────────
export async function playersTab(body) {
  const { members } = await api('GET', '/group/members');
  const g = state.group;
  body.innerHTML = `
    <div class="grid cols-2">
      <section class="card stack">
        <h3>Invite code</h3>
        <p class="small muted">Give this to your players. They enter it when they create an account, or under Account settings if they already have one.</p>
        <div class="row"><code class="invite-code">${esc(g.inviteCode)}</code>
          <button class="btn sm" id="copy-code">${icon('copy')}Copy</button>
          <button class="btn sm ghost" id="new-code">${icon('refresh')}New code</button></div>
      </section>
      <section class="card stack">
        <h3>Group name</h3>
        <form class="inline-form" id="rename"><input name="name" maxlength="60" value="${esc(g.name)}" aria-label="Group name"><button class="btn" type="submit">Rename</button></form>
      </section>
    </div>
    <h3 class="gap-above">Members</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Player</th><th>Username</th><th>Role</th><th class="c">Characters</th><th>Actions</th></tr></thead>
      <tbody>${members.map((u) => `<tr>
        <td><b>${esc(u.displayName)}</b>${u.id === state.user.id ? ' (you)' : ''}</td><td>${esc(u.username)}</td>
        <td><span class="badge ${u.role === 'dm' ? 'gold' : ''}">${u.role === 'dm' ? 'DM' : 'Player'}</span></td><td class="c">${u.characters}</td>
        <td><div class="row">${u.id === state.user.id ? '' : `
          <button class="btn sm" data-role="${u.role === 'dm' ? 'player' : 'dm'}" data-id="${u.id}" data-name="${esc(u.displayName)}">${u.role === 'dm' ? 'Make player' : 'Make DM'}</button>
          <button class="btn sm ghost" data-remove="${u.id}" data-name="${esc(u.displayName)}">Remove</button>`}</div></td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">Forgot a password? The site admin can set a new one${state.user.isAdmin ? ' (that is you: see Account settings)' : ''}.</p>`;

  const refreshGroups = async () => { await loadUser(); reloadPage(); };
  body.querySelector('#copy-code').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(g.inviteCode); toast('Invite code copied.'); } catch { toast('Could not copy. Select the code and copy it by hand.', 'error'); }
  });
  body.querySelector('#rename').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('PUT', '/group', { name: e.target.name.value }); toast('Group renamed.'); await refreshGroups(); } catch (err) { toast(err.message, 'error'); }
  });

  body.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'new-code') {
      const ok = await confirmDialog({ title: 'Make a new invite code?', message: 'The current code stops working. People already in the group stay in.', confirmLabel: 'New code' });
      if (!ok) return;
      try { await api('POST', '/group/invite-code'); toast('New invite code made.'); await refreshGroups(); } catch (err) { toast(err.message, 'error'); }
    }
    if (btn.dataset.role) {
      const ok = await confirmDialog({ title: 'Change role?', message: `${btn.dataset.name} will become a ${btn.dataset.role === 'dm' ? 'DM of this group (can edit its homebrew, notes and every character in it)' : 'player'}.`, confirmLabel: 'Change role' });
      if (!ok) return;
      try { await api('PUT', `/group/members/${btn.dataset.id}/role`, { role: btn.dataset.role }); reloadPage(); } catch (err) { toast(err.message, 'error'); }
    }
    if (btn.dataset.remove) {
      const ok = await confirmDialog({ title: 'Remove from group?', message: `${btn.dataset.name} will leave this group. Their account and characters are kept; they can rejoin with the invite code.`, confirmLabel: 'Remove', danger: true });
      if (!ok) return;
      try { await api('DELETE', `/group/members/${btn.dataset.remove}`); toast('Removed.'); reloadPage(); } catch (err) { toast(err.message, 'error'); }
    }
  });
}
