/**
 * server/routes/characters.js - character sheets: yours, the party list, and moving one
 * into or out of a campaign.
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import crypto from 'node:crypto';
import { db } from '../db.js';
import { fail } from '../http.js';

// ── Characters ───────────────────────────────────────────────────────────────
// A character belongs to its owner. It can also be in ONE campaign (group_id),
// where the campaign's DMs can open and edit it and the party can see it listed.
const CHAR_SELECT = `SELECT c.*, u.display_name AS owner_name, g.name AS group_name
  FROM characters c JOIN users u ON u.id = c.user_id LEFT JOIN groups g ON g.id = c.group_id`;

const charSummary = (r) => {
  const d = JSON.parse(r.data);
  return {
    id: r.id, name: r.name, updatedAt: r.updated_at,
    ownerId: r.user_id, ownerName: r.owner_name,
    groupId: r.group_id || null, groupName: r.group_name || '',
    className: d.identity?.className || '', subclass: d.identity?.subclass || '',
    level: d.identity?.level || 1, species: d.identity?.species || '',
  };
};

/** All your characters, in a campaign or not. */
function listCharacters({ user }) {
  const rows = db.prepare(`${CHAR_SELECT} WHERE c.user_id = ? ORDER BY c.updated_at DESC`).all(user.id);
  return { characters: rows.map(charSummary) };
}

/** The party: every member's characters in the current campaign. Anyone in it may see the list. */
function listPartyCharacters({ group }) {
  const rows = db
    .prepare(`${CHAR_SELECT} WHERE c.group_id = ? AND c.user_id IN (SELECT user_id FROM memberships WHERE group_id = c.group_id) ORDER BY u.display_name COLLATE NOCASE, c.name`)
    .all(group.id);
  return { characters: rows.map(charSummary) };
}

/** Is this user in that group? Returns their role, or undefined. */
const roleIn = (groupId, userId) => db.prepare('SELECT role FROM memberships WHERE group_id = ? AND user_id = ?').get(groupId, userId)?.role;

/** The owner puts a character into one of their campaigns, moves it, or (groupId: null) takes it out. */
function setCharacterCampaign({ user, params, body }) {
  const row = db.prepare('SELECT user_id FROM characters WHERE id = ?').get(params.id);
  if (!row || row.user_id !== user.id) throw fail(404, 'Character not found.');
  const groupId = body.groupId || null;
  if (groupId && !roleIn(groupId, user.id)) throw fail(403, 'You are not in that campaign.');
  db.prepare('UPDATE characters SET group_id = ? WHERE id = ?').run(groupId, params.id);
  return { ok: true, groupId };
}

/**
 * Loads a character and checks the caller may touch it: its owner, or a DM of
 * the group it belongs to (while its owner is still in that group).
 */
function loadCharacter(user, id) {
  const row = db
    .prepare(`${CHAR_SELECT} WHERE c.id = ?`)
    .get(id);
  if (row && row.user_id === user.id) return row;
  if (!row || !row.group_id || roleIn(row.group_id, user.id) !== 'dm' || !roleIn(row.group_id, row.user_id)) throw fail(404, 'Character not found.');
  return row;
}

function cleanCharacterData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail(400, 'Character data is missing.');
  const name = String(data.identity?.name || '').trim().slice(0, 80) || 'Unnamed Character';
  return { name, json: JSON.stringify(data) };
}

/** A new character, optionally straight into one of your campaigns (body.groupId). */
function createCharacter({ user, body }) {
  const { name, json } = cleanCharacterData(body.data);
  const groupId = body.groupId && roleIn(body.groupId, user.id) ? body.groupId : null;
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO characters (id, user_id, group_id, name, data, updated_at) VALUES (?,?,?,?,?,?)').run(
    id, user.id, groupId, name, json, new Date().toISOString()
  );
  return { id };
}

function getCharacter({ user, params }) {
  const row = loadCharacter(user, params.id);
  return { id: row.id, ownerId: row.user_id, ownerName: row.owner_name, groupId: row.group_id || null, groupName: row.group_name || '', updatedAt: row.updated_at, data: JSON.parse(row.data) };
}

function updateCharacter({ user, params, body }) {
  loadCharacter(user, params.id);
  const { name, json } = cleanCharacterData(body.data);
  const updatedAt = new Date().toISOString();
  db.prepare('UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?').run(name, json, updatedAt, params.id);
  return { ok: true, updatedAt };
}

function deleteCharacter({ user, params }) {
  loadCharacter(user, params.id);
  db.prepare('DELETE FROM characters WHERE id = ?').run(params.id);
  return { ok: true };
}

export const routes = [
  ['GET',    '/api/characters',              'user',   listCharacters],
  ['GET',    '/api/group/characters',        'member', listPartyCharacters],
  ['POST',   '/api/characters',              'user',   createCharacter],
  ['PUT',    '/api/characters/:id/campaign', 'user',   setCharacterCampaign],
  ['GET',    '/api/characters/:id',          'user',   getCharacter],
  ['PUT',    '/api/characters/:id',          'user',   updateCharacter],
  ['DELETE', '/api/characters/:id',          'user',   deleteCharacter],
];
