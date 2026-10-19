/**
 * pages/campaigns.js - "My campaigns" (#/campaigns): every campaign you are in,
 * with a button into each one's hub (pages/campaign.js), plus joining one with
 * an invite code, starting a new one (you become its DM) and leaving one.
 */
import { api, state, loadUser, campaignHref } from '../api.js';
import { requireUser, reloadPage } from '../nav.js';
import { esc, icon, toast, confirmDialog } from '../ui.js';

export function render(main) {
  if (!requireUser(main, 'see your campaigns')) return;
  main.innerHTML = `
    <div class="page-head"><p class="kicker">Play together</p><h1>My campaigns</h1><hr class="rule"></div>
    <p class="lead">A campaign is one group at one table: its DM, the party's characters, session notes and the DM's homebrew.
      Everything else on the site - the Codex, Spellcrafter, spells and calculators - works without one.</p>
    ${state.groups.length
      ? `<div class="grid cols-auto">${state.groups.map((g) => `
          <article class="card stack">
            <p class="kicker">${g.role === 'dm' ? 'You are the DM' : 'Player'}</p>
            <h3>${esc(g.name)}</h3>
            <div class="row">
              <a class="btn primary" href="${campaignHref(g.id)}">${icon('flag')}Enter campaign</a>
              <button class="btn ghost sm" data-leave="${g.id}" data-name="${esc(g.name)}">Leave</button>
            </div>
          </article>`).join('')}</div>`
      : `<div class="empty">${icon('flag')}<h2>No campaigns yet</h2><p>Join your DM's campaign with their invite code, or start your own.</p></div>`}
    <div class="grid cols-2 gap-above">
      <form class="card stack" id="join-form" novalidate>
        <h2>Join a campaign</h2>
        <div class="field"><label for="join-code">Invite code from your DM</label>
          <div class="inline-form"><input id="join-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn primary" type="submit">Join</button></div>
          <span class="error" id="err-code" hidden></span></div>
      </form>
      <form class="card stack" id="create-form" novalidate>
        <h2>Start a campaign</h2>
        <div class="field"><label for="group-name">Campaign name</label>
          <div class="inline-form"><input id="group-name" name="name" maxlength="60" autocomplete="off"><button class="btn primary" type="submit">Create</button></div>
          <span class="hint">You will be its DM, and get an invite code to give your players.</span>
          <span class="error" id="err-name" hidden></span></div>
      </form>
    </div>`;

  const showError = (form, error) => {
    const key = Object.keys(error.fields || {})[0];
    const slot = key && form.querySelector(`#err-${key}`);
    if (slot) { slot.textContent = error.fields[key]; slot.hidden = false; form.querySelector(`[name=${key}]`)?.focus(); } else toast(error.message, 'error');
  };
  const enter = async (group, message) => {
    await loadUser();
    toast(message);
    location.hash = campaignHref(group.id);
  };

  main.querySelector('#join-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { group } = await api('POST', '/groups/join', { code: e.target.code.value }, { group: null });
      await enter(group, `You joined ${group.name}.`);
    } catch (error) { showError(e.target, error); }
  });
  main.querySelector('#create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { group } = await api('POST', '/groups', { name: e.target.name.value }, { group: null });
      await enter(group, `${group.name} created. Its invite code is on the Group tab.`);
    } catch (error) { showError(e.target, error); }
  });
  main.addEventListener('click', async (e) => {
    const leave = e.target.closest('[data-leave]');
    if (!leave) return;
    const ok = await confirmDialog({
      title: 'Leave campaign?',
      message: `You will leave "${leave.dataset.name}". Your characters in it stay on your account, outside any campaign. If you are the last member, the campaign and its notes, encounters and homebrew are deleted.`,
      confirmLabel: 'Leave campaign',
      danger: true,
    });
    if (!ok) return;
    try {
      const { deleted } = await api('DELETE', `/groups/${leave.dataset.leave}/membership`, undefined, { group: null });
      await loadUser();
      toast(deleted ? 'Campaign deleted.' : 'You left the campaign.');
      reloadPage();
    } catch (error) { toast(error.message, 'error'); }
  });
}
