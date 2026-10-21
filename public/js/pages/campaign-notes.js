/**
 * pages/campaign-notes.js - the campaign hub's Session notes and Lore tabs (DMs).
 */
import { api, state } from '../api.js';
import { reloadPage } from '../nav.js';
import { esc, icon, confirmDialog, toast, debounce } from '../ui.js';

// ── Session notes & Lore ─────────────────────────────────────────────────────
let openNote = null; // the note left open after a redraw

const LORE_CATEGORIES = ['People', 'Places', 'Factions', 'History', 'Deities & Powers', 'Creatures', 'Items & Artifacts', 'Magic & Compositry', 'Plot threads', 'Other'];

/**
 * A notebook: a list of entries, each with a title and a big text box, saved
 * as you type. `kind` is 'session' (newest first) or 'lore' (grouped by category).
 * Only DM accounts can see these.
 */
export async function notesTab(body, kind) {
  const isLore = kind === 'lore';
  const { notes } = await api('GET', `/notes?kind=${kind}`);
  if (isLore) notes.sort((a, b) => (a.category || 'zz').localeCompare(b.category || 'zz') || a.title.localeCompare(b.title));
  const pending = new Map(); // note id -> debounced save, so edits can be flushed when leaving
  const when = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  body.innerHTML = `
    <div class="row between">
      <div class="field search grow"><label for="note-q" class="sr-only">Search ${isLore ? 'lore' : 'notes'}</label>
        <div class="search">${icon('search')}<input id="note-q" type="search" placeholder="Search ${isLore ? 'lore' : 'session notes'}" autocomplete="off"></div></div>
      <button class="btn primary" id="new-note">${icon('plus')}New ${isLore ? 'lore entry' : 'session note'}</button>
    </div>
    <p class="small muted">${isLore
      ? 'Your world bible: people, places, factions, history. Only DM accounts can see this. Everything saves as you type.'
      : 'One note per session works well: what happened, loose threads, what to prepare next. Only DM accounts can see this. Everything saves as you type.'}</p>
    <div class="notes" id="notes">
      ${notes.length ? notes.map((n) => `
        <details class="note" data-note="${n.id}"${n.id === openNote ? ' open' : ''}>
          <summary><span class="note-title">${esc(n.title)}</span>
            ${isLore && n.category ? `<span class="badge green note-cat">${esc(n.category)}</span>` : ''}
            <span class="small muted note-date">${when(n.updatedAt)}</span></summary>
          <div class="note-body">
            <div class="fields wide">
              <div class="field"><label for="t-${n.id}">Title</label><input id="t-${n.id}" data-f="title" value="${esc(n.title)}" maxlength="120" autocomplete="off"></div>
              ${isLore ? `<div class="field"><label for="c-${n.id}">Category</label><input id="c-${n.id}" data-f="category" value="${esc(n.category)}" list="lore-cats" maxlength="40" autocomplete="off" placeholder="People, Places, Factions..."></div>` : ''}
            </div>
            <div class="field"><label for="b-${n.id}">${isLore ? 'Lore' : 'Notes'}</label><textarea id="b-${n.id}" data-f="body" class="tall">${esc(n.body)}</textarea></div>
            <div class="row between">
              <span class="save-state saved" role="status">${icon('check')}Saved</span>
              <button type="button" class="btn sm danger" data-del-note="${n.id}">${icon('trash')}Delete</button>
            </div>
          </div>
        </details>`).join('')
      : `<div class="empty">${icon('feather')}<h2>Nothing written yet</h2><p>${isLore ? 'Start your world bible with a first entry.' : 'Start a note for your next session.'}</p></div>`}
    </div>
    <p class="muted" id="note-none" hidden>No ${isLore ? 'lore entries' : 'notes'} match that search.</p>
    ${isLore ? `<datalist id="lore-cats">${LORE_CATEGORIES.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>` : ''}`;

  const list = body.querySelector('#notes');

  list.addEventListener('input', (e) => {
    const card = e.target.closest('[data-note]');
    if (!card || !e.target.dataset.f) return;
    const id = card.dataset.note;
    const status = card.querySelector('.save-state');
    status.className = 'save-state';
    status.textContent = 'Saving...';
    if (e.target.dataset.f === 'title') card.querySelector('.note-title').textContent = e.target.value || 'Untitled';
    if (!pending.has(id)) {
      pending.set(id, debounce(async () => {
        const get = (f) => card.querySelector(`[data-f="${f}"]`)?.value ?? '';
        try {
          await api('PUT', `/notes/${id}`, { title: get('title'), category: get('category'), body: get('body') });
          status.className = 'save-state saved';
          status.innerHTML = `${icon('check')}Saved`;
        } catch (err) {
          status.className = 'save-state error';
          status.textContent = `Not saved - ${err.message}`;
        }
      }, 700));
    }
    pending.get(id)();
  });

  list.addEventListener('toggle', (e) => { if (e.target.open) openNote = e.target.dataset.note; }, true);

  body.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-note]');
    if (del) {
      const card = del.closest('[data-note]');
      const ok = await confirmDialog({ title: 'Delete this note?', message: `"${card.querySelector('.note-title').textContent}" will be permanently deleted.`, confirmLabel: 'Delete', danger: true });
      if (!ok) return;
      pending.delete(card.dataset.note);
      try { await api('DELETE', `/notes/${card.dataset.note}`); toast('Deleted.'); reloadPage(); } catch (err) { toast(err.message, 'error'); }
    }
    if (e.target.closest('#new-note')) {
      try {
        const title = isLore ? 'New lore entry' : `Session - ${when(new Date().toISOString())}`;
        openNote = (await api('POST', '/notes', { kind, title })).note.id;
        reloadPage();
      } catch (err) { toast(err.message, 'error'); }
    }
  });

  body.querySelector('#note-q').addEventListener('input', (e) => {
    const words = e.target.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    list.querySelectorAll('[data-note]').forEach((card) => {
      const text = [...card.querySelectorAll('[data-f]')].map((el) => el.value).join(' ').toLowerCase();
      card.hidden = !words.every((w) => text.includes(w));
      if (!card.hidden) shown++;
    });
    body.querySelector('#note-none').hidden = shown > 0 || !notes.length;
  });

  // Leaving the page: send any edit that is still waiting.
  return () => Promise.all([...pending.values()].map((save) => save.flush()));
}
