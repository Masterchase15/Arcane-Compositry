/**
 * pages/characters.js - "My characters" (#/characters).
 */
import { api } from '../api.js';
import { requireUser, requireGroup, reloadPage } from '../nav.js';
import { esc, icon, confirmDialog, toast } from '../ui.js';

export async function render(main) {
  if (!requireUser(main, 'see your characters') || !requireGroup(main)) return;
  const { characters } = await api('GET', '/characters');

  main.innerHTML = `
    <div class="page-head">
      <div class="row between">
        <div><p class="kicker">Saved to your account</p><h1>My characters</h1></div>
        <a class="btn primary" href="#/characters/new">${icon('plus')}New character</a>
      </div>
      <hr class="rule">
    </div>
    ${characters.length
      ? `<div class="grid cols-auto">${characters.map((c) => `
          <article class="card">
            <p class="kicker">Level ${c.level} ${esc(c.className || 'Adventurer')}</p>
            <h3>${esc(c.name)}</h3>
            <p class="muted small">${esc([c.species, c.subclass].filter(Boolean).join(' · ') || 'No species set')}<br>
              Last saved ${new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <div class="row">
              <a class="btn primary" href="#/characters/${c.id}">Open sheet</a>
              <button class="btn danger icon-only" data-delete="${c.id}" data-name="${esc(c.name)}" aria-label="Delete ${esc(c.name)}">${icon('trash')}</button>
            </div>
          </article>`).join('')}</div>`
      : `<div class="empty">${icon('users')}<h2>No characters yet</h2>
          <p>Create your first Compositor. The <a href="#/guide">character guide</a> walks through every step.</p>
          <a class="btn primary" href="#/characters/new">${icon('plus')}Create a character</a></div>`}`;

  main.addEventListener('click', async (e) => {
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
