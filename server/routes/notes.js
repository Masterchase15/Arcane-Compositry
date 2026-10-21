/**
 * server/routes/notes.js - a campaign DM's session notes and lore.
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import crypto from 'node:crypto';
import { db } from '../db.js';
import { fail } from '../http.js';

// ── DM notes & lore ──────────────────────────────────────────────────────────
const NOTE_KINDS = ['session', 'lore'];
const noteOut = (r) => ({ id: r.id, kind: r.kind, title: r.title, category: r.category, body: r.body, createdAt: r.created_at, updatedAt: r.updated_at });

function listNotes({ group, query }) {
  const kind = query.get('kind');
  if (!NOTE_KINDS.includes(kind)) throw fail(400, 'kind must be "session" or "lore".');
  return { notes: db.prepare('SELECT * FROM dm_notes WHERE group_id = ? AND kind = ? ORDER BY created_at DESC').all(group.id, kind).map(noteOut) };
}

function cleanNote(body) {
  return {
    title: String(body.title ?? '').trim().slice(0, 120) || 'Untitled',
    category: String(body.category ?? '').trim().slice(0, 40),
    body: String(body.body ?? '').slice(0, 100000),
  };
}

function createNote({ group, body }) {
  if (!NOTE_KINDS.includes(body.kind)) throw fail(400, 'kind must be "session" or "lore".');
  const n = cleanNote(body);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO dm_notes (id, group_id, kind, title, category, body, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)').run(id, group.id, body.kind, n.title, n.category, n.body, now, now);
  return { note: noteOut(db.prepare('SELECT * FROM dm_notes WHERE id = ?').get(id)) };
}

function updateNote({ group, params, body }) {
  const n = cleanNote(body);
  const updatedAt = new Date().toISOString();
  if (!db.prepare('UPDATE dm_notes SET title = ?, category = ?, body = ?, updated_at = ? WHERE id = ? AND group_id = ?').run(n.title, n.category, n.body, updatedAt, params.id, group.id).changes) {
    throw fail(404, 'Note not found.');
  }
  return { ok: true, updatedAt };
}

function deleteNote({ group, params }) {
  if (!db.prepare('DELETE FROM dm_notes WHERE id = ? AND group_id = ?').run(params.id, group.id).changes) throw fail(404, 'Note not found.');
  return { ok: true };
}

export const routes = [
  ['GET',    '/api/notes',                   'dm',     listNotes],
  ['POST',   '/api/notes',                   'dm',     createNote],
  ['PUT',    '/api/notes/:id',               'dm',     updateNote],
  ['DELETE', '/api/notes/:id',               'dm',     deleteNote],
];
