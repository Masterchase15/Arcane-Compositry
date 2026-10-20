/**
 * server/routes/campaigns.js - starting, joining and leaving campaigns ("groups"), and the
 * DM's Group tab: invite code, name, members.
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import crypto from 'node:crypto';
import { db, newInviteCode } from '../db.js';
import { fail, throttle } from '../http.js';

// ── Campaign invite codes ─────────────────────────────────────────────────────
export const cleanCode = (v) => String(v ?? '').trim();
export const groupByCode = (code) => (code ? db.prepare('SELECT * FROM groups WHERE invite_code = ?').get(code.toUpperCase()) : null);

export function addMember(groupId, userId, role) {
  db.prepare('INSERT OR IGNORE INTO memberships (group_id, user_id, role, joined_at) VALUES (?,?,?,?)').run(groupId, userId, role, new Date().toISOString());
}

// ── Campaigns ("groups" in the code) ───────────────────────────────────────────────────────────────────
export const groupOut = (g) => ({ id: g.id, name: g.name, role: g.role, ...(g.role === 'dm' ? { inviteCode: g.invite_code } : {}) });
const groupName = (v) => String(v ?? '').trim().slice(0, 60);

/** Anyone signed in can start a group; they become its DM. */
function createGroup({ user, body }) {
  const name = groupName(body.name);
  if (!name) throw fail(400, 'Give the group a name.', { name: 'Give the group a name.' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO groups (id, name, invite_code, created_at) VALUES (?,?,?,?)').run(id, name, newInviteCode(), new Date().toISOString());
  addMember(id, user.id, 'dm');
  return { group: groupOut({ ...db.prepare('SELECT * FROM groups WHERE id = ?').get(id), role: 'dm' }) };
}

function joinGroup({ user, body, req }) {
  throttle(req);
  const found = groupByCode(cleanCode(body.code));
  if (!found) throw fail(404, 'No group has that invite code.', { code: 'No group has that invite code.' });
  addMember(found.id, user.id, 'player');
  const role = db.prepare('SELECT role FROM memberships WHERE group_id = ? AND user_id = ?').get(found.id, user.id).role;
  return { group: groupOut({ ...found, role }) };
}

/**
 * Leave a group. The last DM cannot leave while others are still in it (make
 * someone else DM first). The last person leaving deletes the group and its
 * notes, encounters and DM-page edits; their characters are kept.
 */
function leaveGroup({ user, params }) {
  const mine = db.prepare('SELECT role FROM memberships WHERE group_id = ? AND user_id = ?').get(params.id, user.id);
  if (!mine) throw fail(404, 'You are not in that group.');
  const others = db.prepare('SELECT role FROM memberships WHERE group_id = ? AND user_id != ?').all(params.id, user.id);
  if (!others.length) {
    db.prepare('DELETE FROM groups WHERE id = ?').run(params.id);
    return { ok: true, deleted: true };
  }
  if (mine.role === 'dm' && !others.some((m) => m.role === 'dm')) {
    throw fail(400, 'You are the only DM. Make another member DM before you leave.');
  }
  db.prepare('DELETE FROM memberships WHERE group_id = ? AND user_id = ?').run(params.id, user.id);
  db.prepare('UPDATE characters SET group_id = NULL WHERE group_id = ? AND user_id = ?').run(params.id, user.id);
  return { ok: true, deleted: false };
}

function renameGroup({ group, body }) {
  const name = groupName(body.name);
  if (!name) throw fail(400, 'Give the group a name.');
  db.prepare('UPDATE groups SET name = ? WHERE id = ?').run(name, group.id);
  return { ok: true, name };
}

/** A new invite code; the old one stops working. People already in the group stay in. */
function newGroupCode({ group }) {
  const inviteCode = newInviteCode();
  db.prepare('UPDATE groups SET invite_code = ? WHERE id = ?').run(inviteCode, group.id);
  return { inviteCode };
}

function listMembers({ group }) {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, m.role, m.joined_at,
              (SELECT COUNT(*) FROM characters c WHERE c.user_id = u.id AND c.group_id = m.group_id) AS characters
         FROM memberships m JOIN users u ON u.id = m.user_id
        WHERE m.group_id = ? ORDER BY m.joined_at`
    )
    .all(group.id);
  return { members: rows.map((u) => ({ id: u.id, username: u.username, displayName: u.display_name, role: u.role, joinedAt: u.joined_at, characters: u.characters })) };
}

function setMemberRole({ user, group, params, body }) {
  if (!['player', 'dm'].includes(body.role)) throw fail(400, 'Role must be "player" or "dm".');
  if (params.id === user.id) throw fail(400, 'You cannot change your own role.');
  if (!db.prepare('UPDATE memberships SET role = ? WHERE group_id = ? AND user_id = ?').run(body.role, group.id, params.id).changes) {
    throw fail(404, 'That person is not in this group.');
  }
  return { ok: true };
}

/** Takes someone out of the group. Their characters stay theirs, outside the campaign. */
function removeMember({ user, group, params }) {
  if (params.id === user.id) throw fail(400, 'To leave the campaign yourself, use the Campaigns page.');
  if (!db.prepare('DELETE FROM memberships WHERE group_id = ? AND user_id = ?').run(group.id, params.id).changes) {
    throw fail(404, 'That person is not in this group.');
  }
  db.prepare('UPDATE characters SET group_id = NULL WHERE group_id = ? AND user_id = ?').run(group.id, params.id);
  return { ok: true };
}

export const routes = [
  ['POST',   '/api/groups',                  'user',   createGroup],
  ['POST',   '/api/groups/join',             'user',   joinGroup],
  ['DELETE', '/api/groups/:id/membership',   'user',   leaveGroup],
  // These act on the current campaign (the ?group= the page sent).
  ['PUT',    '/api/group',                   'dm',     renameGroup],
  ['POST',   '/api/group/invite-code',       'dm',     newGroupCode],
  ['GET',    '/api/group/members',           'dm',     listMembers],
  ['PUT',    '/api/group/members/:id/role',  'dm',     setMemberRole],
  ['DELETE', '/api/group/members/:id',       'dm',     removeMember],
];
