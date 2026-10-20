/**
 * server/routes/encounters.js - a campaign DM's initiative trackers.
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import crypto from 'node:crypto';
import { db } from '../db.js';
import { fail } from '../http.js';

// ── Initiative trackers (DM only) ────────────────────────────────────────────
const encounterOut = (r) => ({ id: r.id, name: r.name, data: JSON.parse(r.data), updatedAt: r.updated_at });
const encounterName = (v) => String(v ?? '').trim().slice(0, 80) || 'Encounter';
function encounterData(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { round: 1, firstId: null, combatants: [] };
  return v;
}

function listEncounters({ group }) {
  return { encounters: db.prepare('SELECT * FROM encounters WHERE group_id = ? ORDER BY created_at').all(group.id).map(encounterOut) };
}

function createEncounter({ group, body }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO encounters (id, group_id, name, data, created_at, updated_at) VALUES (?,?,?,?,?,?)').run(
    id, group.id, encounterName(body.name), JSON.stringify(encounterData(body.data)), now, now
  );
  return { encounter: encounterOut(db.prepare('SELECT * FROM encounters WHERE id = ?').get(id)) };
}

function updateEncounter({ group, params, body }) {
  const changed = db.prepare('UPDATE encounters SET name = ?, data = ?, updated_at = ? WHERE id = ? AND group_id = ?').run(
    encounterName(body.name), JSON.stringify(encounterData(body.data)), new Date().toISOString(), params.id, group.id
  ).changes;
  if (!changed) throw fail(404, 'Encounter not found.');
  return { ok: true };
}

function deleteEncounter({ group, params }) {
  if (!db.prepare('DELETE FROM encounters WHERE id = ? AND group_id = ?').run(params.id, group.id).changes) throw fail(404, 'Encounter not found.');
  return { ok: true };
}

export const routes = [
  ['GET',    '/api/encounters',              'dm',     listEncounters],
  ['POST',   '/api/encounters',              'dm',     createEncounter],
  ['PUT',    '/api/encounters/:id',          'dm',     updateEncounter],
  ['DELETE', '/api/encounters/:id',          'dm',     deleteEncounter],
];
