/**
 * server/api.js - every /api/... endpoint the website talks to.
 *
 * Each route is one entry in ROUTES:  [METHOD, path pattern, who may call it, handler]
 *   who:  'public'  anyone
 *         'user'    must be logged in
 *         'member'  must be logged in and a member of the group the page is showing
 *         'dm'      must be logged in as a DM of the group the page is showing
 *         'admin'   must be logged in as the site admin
 * A handler receives ({ user, group, params, body, query, req, res }) and returns
 * the object to send back as JSON. Throw `fail(status, message)` to send an error.
 *
 * GROUPS
 *   Each campaign is a group. The browser says which group it is showing by
 *   adding ?group=<id> to every request (public/js/api.js does this). `group`
 *   is then { id, name, inviteCode, role } - but only if the user really is a
 *   member; otherwise it is null.
 *
 * To add an endpoint: write a handler, add a line to ROUTES. That's it.
 */
import crypto from 'node:crypto';
import { db, newInviteCode } from './db.js';
import * as auth from './auth.js';
import { LISTS, getList, validateEntry, saveCustom, deleteCustom, setHidden, forgetVisibility } from './catalog.js';

const MAX_BODY = 512 * 1024; // 512 KB is far more than any character sheet needs

export const fail = (status, message, fields) => Object.assign(new Error(message), { status, fields });

// ── Small brute-force guard: 10 login/register/join attempts per 5 minutes per address
const attempts = new Map();
const WINDOW = 5 * 60e3;

/**
 * The visitor's IP address. Behind a hosting service's proxy every request
 * arrives from the proxy, so set TRUST_PROXY to the number of proxies in front
 * of the site (usually 1) and the address is read from X-Forwarded-For instead.
 * Proxies append to that header, so we count from the right: the entries on
 * the left were written by the visitor and can be faked.
 */
const TRUST_PROXY = Number(process.env.TRUST_PROXY) || 0;
function clientIp(req) {
  if (TRUST_PROXY > 0) {
    const hops = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const ip = hops[hops.length - TRUST_PROXY];
    if (ip) return ip;
  }
  return req.socket.remoteAddress || 'unknown';
}

function throttle(req) {
  const key = clientIp(req);
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < WINDOW);
  if (recent.length >= 10) throw fail(429, 'Too many attempts. Wait a few minutes and try again.');
  recent.push(now);
  attempts.set(key, recent);
}

// Forget addresses with no recent attempts, so the list does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of attempts) if (times.every((t) => now - t >= WINDOW)) attempts.delete(key);
}, WINDOW).unref();

// ── Invite codes ─────────────────────────────────────────────────────────────
// INVITE_CODE (optional, set on the server) lets someone sign up without a group,
// e.g. a new DM who will create their own. When it is set, signing up needs
// either it or a group's invite code - the very first (admin) account too.
const INVITE_CODE = process.env.INVITE_CODE || '';
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const isSiteCode = (code) => !!INVITE_CODE && crypto.timingSafeEqual(sha(code), sha(INVITE_CODE));
const cleanCode = (v) => String(v ?? '').trim();
const groupByCode = (code) => (code ? db.prepare('SELECT * FROM groups WHERE invite_code = ?').get(code.toUpperCase()) : null);

function addMember(groupId, userId, role) {
  db.prepare('INSERT OR IGNORE INTO memberships (group_id, user_id, role, joined_at) VALUES (?,?,?,?)').run(groupId, userId, role, new Date().toISOString());
}

// ── Auth ─────────────────────────────────────────────────────────────────────
function register({ body, req, res }) {
  throttle(req);
  const username = String(body.username || '').trim();
  const errors = auth.validateCredentials(username, body.password);
  const code = cleanCode(body.inviteCode);
  const joining = groupByCode(code);
  if (code ? !joining && !isSiteCode(code) : INVITE_CODE) {
    errors.inviteCode = 'That invite code is not right. Ask your DM for it.';
  }
  if (Object.keys(errors).length) throw fail(400, 'Please fix the highlighted fields.', errors);
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    throw fail(409, 'That username is taken.', { username: 'That username is taken.' });
  }
  const user = auth.createUser({ username, displayName: body.displayName, password: body.password });
  if (joining) addMember(joining.id, user.id, 'player');
  res.setHeader('Set-Cookie', auth.sessionCookie(req, auth.createSession(user.id)));
  return { user: auth.publicUser(user), joinedGroup: joining?.id || null };
}

function login({ body, req, res }) {
  throttle(req);
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(String(body.username || '').trim());
  if (!row || !auth.verifyPassword(String(body.password || ''), row.password_hash)) {
    throw fail(401, 'Username or password is incorrect.');
  }
  res.setHeader('Set-Cookie', auth.sessionCookie(req, auth.createSession(row.id)));
  return { user: auth.publicUser(row) };
}

function logout({ req, res }) {
  auth.destroySession(auth.readSessionToken(req));
  res.setHeader('Set-Cookie', auth.sessionCookie(req, null));
  return { ok: true };
}

function changePassword({ user, body }) {
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
  if (!auth.verifyPassword(String(body.current || ''), row.password_hash)) {
    throw fail(400, 'Current password is incorrect.', { current: 'Current password is incorrect.' });
  }
  const problem = auth.validatePassword(body.next);
  if (problem) throw fail(400, problem, { next: problem });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(auth.hashPassword(body.next), user.id);
  return { ok: true };
}

/** Who is signed in, and every group they belong to (DMs also get their group's invite code). */
function me({ user }) {
  const groups = user
    ? db.prepare(
        `SELECT g.id, g.name, g.invite_code, m.role FROM memberships m JOIN groups g ON g.id = m.group_id
          WHERE m.user_id = ? ORDER BY g.name COLLATE NOCASE`
      ).all(user.id).map(groupOut)
    : [];
  return { user: auth.publicUser(user), groups, inviteRequired: !!INVITE_CODE };
}

// ── Groups ───────────────────────────────────────────────────────────────────
const groupOut = (g) => ({ id: g.id, name: g.name, role: g.role, ...(g.role === 'dm' ? { inviteCode: g.invite_code } : {}) });
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

/** Takes someone out of the group. Their characters stay theirs, but the group's DMs no longer see them in the list. */
function removeMember({ user, group, params }) {
  if (params.id === user.id) throw fail(400, 'To leave the group yourself, use Account settings.');
  if (!db.prepare('DELETE FROM memberships WHERE group_id = ? AND user_id = ?').run(group.id, params.id).changes) {
    throw fail(404, 'That person is not in this group.');
  }
  return { ok: true };
}

// ── Catalog: spells, items and classes ───────────────────────────────────────
/**
 * The files plus the current group's DM-page edits. Players get only public
 * entries; the group's DMs also get the hidden ones (each marked hidden: true).
 * Not in a group (or signed out): the files only.
 */
const visibleTo = (group, listName) => getList(listName, { groupId: group?.id ?? null, includeHidden: group?.role === 'dm' });

async function listSpells({ group }) {
  return { codified: await visibleTo(group, 'codified'), compositry: await visibleTo(group, 'compositry') };
}

function checkList(name) {
  if (!LISTS.includes(name)) throw fail(404, 'Unknown list.');
  return name;
}

/** Create or update a spell, item or class from the DM page. */
async function saveEntry({ group, params, body }) {
  const listName = checkList(params.list);
  const { entry, errors } = await validateEntry(listName, { ...body, id: params.id || body.id }, group.id);
  if (errors.length) throw fail(400, `Not saved: ${errors.join('; ')}.`);
  saveCustom(group.id, listName, entry);
  setHidden(group.id, listName, entry.id, entry.hidden);
  return { entry };
}

async function removeEntry({ group, params }) {
  const listName = checkList(params.list);
  if (!deleteCustom(group.id, listName, params.id)) {
    throw fail(404, 'That entry lives in a data file. Remove it from the data/ folder instead.');
  }
  // If nothing is left under that id (it was not an edit of a file entry), drop its hidden/public choice too.
  if (!(await getList(listName, { groupId: group.id })).some((e) => e.id === params.id)) forgetVisibility(group.id, listName, params.id);
  return { ok: true };
}

/** The Hide / Publish button on the DM page. */
async function setVisibility({ group, params, body }) {
  const listName = checkList(params.list);
  if (!(await getList(listName, { groupId: group.id })).some((e) => e.id === params.id)) throw fail(404, 'Entry not found.');
  setHidden(group.id, listName, params.id, !!body.hidden);
  return { ok: true, hidden: !!body.hidden };
}

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

// ── Characters ───────────────────────────────────────────────────────────────
const charSummary = (r) => {
  const d = JSON.parse(r.data);
  return {
    id: r.id, name: r.name, updatedAt: r.updated_at,
    ownerId: r.user_id, ownerName: r.owner_name,
    className: d.identity?.className || '', subclass: d.identity?.subclass || '',
    level: d.identity?.level || 1, species: d.identity?.species || '',
  };
};

/** Your characters in the current group; with ?all=1 a DM gets every member's. Not in a group: none. */
function listCharacters({ user, group, query }) {
  if (!group) return { characters: [] };
  const all = query.get('all') === '1' && group.role === 'dm';
  const rows = db
    .prepare(
      `SELECT c.*, u.display_name AS owner_name FROM characters c JOIN users u ON u.id = c.user_id
        WHERE c.group_id = ? ${all ? 'AND c.user_id IN (SELECT user_id FROM memberships WHERE group_id = c.group_id)' : 'AND c.user_id = ?'}
        ORDER BY c.updated_at DESC`
    )
    .all(...(all ? [group.id] : [group.id, user.id]));
  return { characters: rows.map(charSummary) };
}

/**
 * Loads a character and checks the caller may touch it: its owner, or a DM of
 * the group it belongs to (while its owner is still in that group).
 */
function loadCharacter(user, id) {
  const row = db
    .prepare('SELECT c.*, u.display_name AS owner_name FROM characters c JOIN users u ON u.id = c.user_id WHERE c.id = ?')
    .get(id);
  if (row && row.user_id === user.id) return row;
  const roleIn = (uid) => db.prepare('SELECT role FROM memberships WHERE group_id = ? AND user_id = ?').get(row.group_id, uid)?.role;
  if (!row || !row.group_id || roleIn(user.id) !== 'dm' || !roleIn(row.user_id)) throw fail(404, 'Character not found.');
  return row;
}

function cleanCharacterData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail(400, 'Character data is missing.');
  const name = String(data.identity?.name || '').trim().slice(0, 80) || 'Unnamed Character';
  return { name, json: JSON.stringify(data) };
}

function createCharacter({ user, group, body }) {
  const { name, json } = cleanCharacterData(body.data);
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO characters (id, user_id, group_id, name, data, updated_at) VALUES (?,?,?,?,?,?)').run(
    id, user.id, group.id, name, json, new Date().toISOString()
  );
  return { id };
}

function getCharacter({ user, params }) {
  const row = loadCharacter(user, params.id);
  return { id: row.id, ownerId: row.user_id, ownerName: row.owner_name, groupId: row.group_id, updatedAt: row.updated_at, data: JSON.parse(row.data) };
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

// ── Site admin: every account ────────────────────────────────────────────────
function listAccounts() {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.is_admin, u.created_at,
              (SELECT group_concat(g.name, ', ') FROM memberships m JOIN groups g ON g.id = m.group_id WHERE m.user_id = u.id) AS group_names
         FROM users u ORDER BY u.created_at`
    )
    .all();
  return { users: rows.map((u) => ({ ...auth.publicUser(u), createdAt: u.created_at, groups: u.group_names || '' })) };
}

function setAdmin({ user, params, body }) {
  if (params.id === user.id) throw fail(400, 'You cannot change your own admin status.');
  if (!db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(body.isAdmin ? 1 : 0, params.id).changes) throw fail(404, 'User not found.');
  return { ok: true };
}

/** The admin sets a temporary password for someone who forgot theirs. */
function resetPassword({ params, body }) {
  const problem = auth.validatePassword(body.password);
  if (problem) throw fail(400, problem);
  if (!db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(auth.hashPassword(body.password), params.id).changes) {
    throw fail(404, 'User not found.');
  }
  auth.destroyUserSessions(params.id);
  return { ok: true };
}

// ── Route table ──────────────────────────────────────────────────────────────
const ROUTES = [
  ['GET',    '/api/auth/me',                 'public', me],
  ['POST',   '/api/auth/register',           'public', register],
  ['POST',   '/api/auth/login',              'public', login],
  ['POST',   '/api/auth/logout',             'public', logout],
  ['POST',   '/api/auth/password',           'user',   changePassword],

  ['POST',   '/api/groups',                  'user',   createGroup],
  ['POST',   '/api/groups/join',             'user',   joinGroup],
  ['DELETE', '/api/groups/:id/membership',   'user',   leaveGroup],
  // The routes below act on the current group (the ?group= the page sent).
  ['PUT',    '/api/group',                   'dm',     renameGroup],
  ['POST',   '/api/group/invite-code',       'dm',     newGroupCode],
  ['GET',    '/api/group/members',           'dm',     listMembers],
  ['PUT',    '/api/group/members/:id/role',  'dm',     setMemberRole],
  ['DELETE', '/api/group/members/:id',       'dm',     removeMember],

  ['GET',    '/api/spells',                  'public', listSpells],
  ['GET',    '/api/items',                   'public', async ({ group }) => ({ items: await visibleTo(group, 'items') })],
  ['GET',    '/api/classes',                 'public', async ({ group }) => ({ classes: await visibleTo(group, 'classes') })],
  ['GET',    '/api/components',              'public', async ({ group }) => ({ components: await visibleTo(group, 'components') })],
  ['GET',    '/api/subclasses',              'public', async ({ group }) => ({ subclasses: await visibleTo(group, 'subclasses') })],
  // NPCs & enemies: the group's DMs only. There is no public route for this list.
  ['GET',    '/api/npcs',                    'dm',     async ({ group }) => ({ npcs: await getList('npcs', { groupId: group.id }) })],
  // :list is one of: codified, compositry, components, items, classes, subclasses, npcs
  ['PUT',    '/api/catalog/:list/:id/visibility', 'dm', setVisibility],
  ['POST',   '/api/catalog/:list',           'dm',     saveEntry],
  ['PUT',    '/api/catalog/:list/:id',       'dm',     saveEntry],
  ['DELETE', '/api/catalog/:list/:id',       'dm',     removeEntry],

  ['GET',    '/api/encounters',              'dm',     listEncounters],
  ['POST',   '/api/encounters',              'dm',     createEncounter],
  ['PUT',    '/api/encounters/:id',          'dm',     updateEncounter],
  ['DELETE', '/api/encounters/:id',          'dm',     deleteEncounter],

  ['GET',    '/api/notes',                   'dm',     listNotes],
  ['POST',   '/api/notes',                   'dm',     createNote],
  ['PUT',    '/api/notes/:id',               'dm',     updateNote],
  ['DELETE', '/api/notes/:id',               'dm',     deleteNote],

  ['GET',    '/api/characters',              'user',   listCharacters],
  ['POST',   '/api/characters',              'member', createCharacter],
  ['GET',    '/api/characters/:id',          'user',   getCharacter],
  ['PUT',    '/api/characters/:id',          'user',   updateCharacter],
  ['DELETE', '/api/characters/:id',          'user',   deleteCharacter],

  ['GET',    '/api/admin/users',             'admin',  listAccounts],
  ['PUT',    '/api/admin/users/:id/admin',   'admin',  setAdmin],
  ['PUT',    '/api/admin/users/:id/password', 'admin', resetPassword],
].map(([method, pattern, access, handler]) => ({
  method, access, handler,
  regex: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`),
}));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(fail(413, 'That is too much data.')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(fail(400, 'Request was not valid JSON.')); }
    });
    req.on('error', reject);
  });
}

/** The group named in ?group=, if the user is a member of it. */
function currentGroup(user, url) {
  const id = url.searchParams.get('group');
  if (!user || !id) return null;
  const row = db
    .prepare('SELECT g.id, g.name, g.invite_code, m.role FROM memberships m JOIN groups g ON g.id = m.group_id WHERE m.group_id = ? AND m.user_id = ?')
    .get(id, user.id);
  return row ? { id: row.id, name: row.name, inviteCode: row.invite_code, role: row.role } : null;
}

export async function handleApi(req, res, url) {
  const send = (status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(payload));
  };
  try {
    const route = ROUTES.find((r) => r.method === req.method && r.regex.test(url.pathname));
    if (!route) throw fail(404, 'Not found.');
    // Changing data requires a JSON request, which other websites cannot forge.
    if (req.method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) {
      throw fail(415, 'Send JSON.');
    }
    const user = auth.currentUser(req);
    const group = currentGroup(user, url);
    if (route.access !== 'public' && !user) throw fail(401, 'Please sign in.');
    if ((route.access === 'member' || route.access === 'dm') && !group) throw fail(403, 'Join or pick a group first.');
    if (route.access === 'dm' && group.role !== 'dm') throw fail(403, 'Only the DM can do that.');
    if (route.access === 'admin' && !user.is_admin) throw fail(403, 'Only the site admin can do that.');
    const params = Object.fromEntries(
      Object.entries(url.pathname.match(route.regex).groups || {}).map(([k, v]) => [k, decodeURIComponent(v)])
    );
    const body = req.method === 'GET' ? {} : await readBody(req);
    send(200, await route.handler({ user, group, params, body, query: url.searchParams, req, res }));
  } catch (err) {
    if (!err.status) console.error(err);
    send(err.status || 500, { error: err.status ? err.message : 'Something went wrong on the server.', fields: err.fields });
  }
}
