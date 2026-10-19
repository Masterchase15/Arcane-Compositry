/**
 * pages/characters.js - "My characters" (#/characters).
 *
 * Characters belong to you and work without a campaign. Each can also be in one
 * campaign, where its DM can open it and its homebrew applies; the
 * "Campaign" button on a card moves it in, between or out of campaigns.
 */
import { api, state, campaignHref } from '../api.js';
import { requireUser, reloadPage } from '../nav.js';
import { esc, icon, confirmDialog, openDialog, toast } from '../ui.js';

export async function render(main) {
  if (!requireUser(main, 'see your characters')) return;
  const { characters } = await api('GET', '/characters');

  // Sections: one per campaign you have characters in, then the ones in no campaign.
  const sections = [
    ...state.groups.map((g) => ({ g, list: characters.filter((c) => c.groupId === g.id) })).filter((x) => x.list.length),
    { g: null, list: characters.filter((c) => !c.groupId || !state.groups.some((g) => g.id === c.groupId)) },
  ].filter((x) => x.list.length);

  const card = (c) => `
    <article class="card">
      <p class="kicker">Level ${c.level} ${esc(c.className || 'Adventurer')}</p>
      <h3>${esc(c.name)}</h3>
      <p class="muted small">${esc([c.species, c.subclass].filter(Boolean).join(' · ') || 'No species set')}<br>
        Last saved ${new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      <div class="row">
        <a class="btn primary" href="#/characters/${c.id}">Open sheet</a>
        ${state.groups.length ? `<button class="btn sm" data-campaign="${c.id}" data-name="${esc(c.name)}" data-current="${c.groupId || ''}">${icon('flag')}Campaign</button>` : ''}
        <button class="btn danger icon-only" data-delete="${c.id}" data-name="${esc(c.name)}" aria-label="Delete ${esc(c.name)}">${icon('trash')}</button>
      </div>
    </article>`;

  main.innerHTML = `
    <div class="page-head">
      <div class="row between">
        <div><p class="kicker">Saved to your account</p><h1>My characters</h1></div>
        <a class="btn primary" href="#/characters/new">${icon('plus')}New character</a>
      </div>
      <hr class="rule">
    </div>
    ${sections.length
      ? sections.map(({ g, list }) => `
          <section class="stack gap-above">
            <div class="row between">
              <h2>${g ? `${icon('flag')} ${esc(g.name)}` : 'Not in a campaign'}</h2>
              ${g ? `<a class="btn sm ghost" href="${campaignHref(g.id)}">Enter campaign</a>` : ''}
            </div>
            <div class="grid cols-auto">${list.map(card).join('')}</div>
          </section>`).join('')
      : `<div class="empty">${icon('users')}<h2>No characters yet</h2>
          <p>Create your first Compositor. The <a href="#/guide">character guide</a> walks through every step.
          You do not need a campaign; you can add the character to one later.</p>
          <a class="btn primary" href="#/characters/new">${icon('plus')}Create a character</a></div>`}`;

  main.addEventListener('click', async (e) => {
    const move = e.target.closest('[data-campaign]');
    if (move) return chooseCampaign(move.dataset.campaign, move.dataset.name, move.dataset.current);
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    const ok = await confirmDialog({
      title: 'Delete character?',
      message: `"${btn.dataset.name}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api('DELETE', `/characters/${btn.dataset.delete}`);
      toast('Character deleted.');
      reloadPage();
    } catch (err) { toast(err.message, 'error'); }
  });
}

/** Put a character into one of your campaigns, move it, or take it out. */
function chooseCampaign(id, name, current) {
  const dlg = openDialog({
    title: `Campaign for ${esc(name)}`, narrow: true,
    body: `<p>In a campaign, its DM can open and edit the sheet, and the campaign's homebrew applies to it. A character is in one campaign at a time.</p>
      <div class="field"><label for="pick-campaign">Campaign</label>
        <select id="pick-campaign"><option value="">No campaign</option>
          ${state.groups.map((g) => `<option value="${g.id}"${g.id === current ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>`,
    footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="pick-save">Save</button>`,
  });
  dlg.querySelector('#pick-save').addEventListener('click', async () => {
    try {
      await api('PUT', `/characters/${id}/campaign`, { groupId: dlg.querySelector('#pick-campaign').value || null });
      dlg.close();
      toast('Saved.');
      reloadPage();
    } catch (err) { toast(err.message, 'error'); }
  });
}
