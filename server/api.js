/**
 * server/api.js - every /api/... endpoint the website talks to.
 *
 * Each route is one entry in ROUTES:  [METHOD, path pattern, who may call it, handler]
 *   who:  'public'  anyone
 *         'user'    must be logged in
 *         'dm'      must be logged in as a DM
 * A handler receives ({ user, params, body, query, req, res }) and returns the
 * object to send back as JSON. Throw `fail(status, message)` to send an error.
 *
 * To add an endpoint: write a handler, add a line to ROUTES. That's it.
 */
import crypto from 'node:crypto';
import { db } from './db.js';
import * as auth from './auth.js';
import { LISTS, getList, validateEntry, saveCustom, deleteCustom, setHidden, forgetVisibility } from './catalog.js';

const MAX_BODY = 512 * 1024; // 512 KB is far more than any character sheet needs

export const fail = (status, message, fields) => Object.assign(new Error(message), { status, fields });

// ── Small brute-force guard: 10 login/register attempts per 5 minutes per address
const attempts = new Map();
function throttle(req) {
  const key = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < 5 * 60e3);
  if (recent.length >= 10) throw fail(429, 'Too many attempts. Wait a few minutes and try again.');
  recent.push(now);
  attempts.set(key, recent);
}

// ── Auth ─────────────────────────────────────────────────────────────────────
function register({ body, req, res }) {
  throttle(req);
  const username = String(body.username || '').trim();
  const errors = auth.validateCredentials(username, body.password);
  if (Object.keys(errors).length) throw fail(400, 'Please fix the highlighted fields.', errors);
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    throw fail(409, 'That username is taken.', { username: 'That username is taken.' });
  }
  const user = auth.createUser({ username, displayName: body.displayName, password: body.password });
  res.setHeader('Set-Cookie', auth.sessionCookie(req, auth.createSession(user.id)));
  return { user: auth.publicUser(user) };
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

// ── Catalog: spells, items and classes ───────────────────────────────────────
/** Players get only public entries; DM accounts also get the hidden ones (each marked hidden: true). */
const visibleTo = (user, listName) => getList(listName, { includeHidden: user?.role === 'dm' });

async function listSpells({ user }) {
  return { codified: await visibleTo(user, 'codified'), compositry: await visibleTo(user, 'compositry') };
}

function checkList(name) {
  if (!LISTS.includes(name)) throw fail(404, 'Unknown list.');
  return name;
}

/** Create or update a spell, item or class from the DM page. */
async function saveEntry({ params, body }) {
  const listName = checkList(params.list);
  const { entry, errors } = await validateEntry(listName, { ...body, id: params.id || body.id });
  if (errors.length) throw fail(400, `Not saved: ${errors.join('; ')}.`);
  saveCustom(listName, entry);
  setHidden(listName, entry.id, entry.hidden);
  return { entry };
}

async function removeEntry({ params }) {
  const listName = checkList(params.list);
  if (!deleteCustom(listName, params.id)) {
    throw fail(404, 'That entry lives in a data file. Remove it from the data/ folder instead.');
  }
  // If nothing is left under that id (it was not an edit of a file entry), drop its hidden/public choice too.
  if (!(await getList(listName)).some((e) => e.id === params.id)) forgetVisibility(listName, params.id);
  return { ok: true };
}

/** The Hide / Publish button on the DM page. */
async function setVisibility({ params, body }) {
  const listName = checkList(params.list);
  if (!(await getList(listName)).some((e) => e.id === params.id)) throw fail(404, 'Entry not found.');
  setHidden(listName, params.id, !!body.hidden);
  return { ok: true, hidden: !!body.hidden };
}

// ── DM notes & lore ──────────────────────────────────────────────────────────
const NOTE_KINDS = ['session', 'lore'];
const noteOut = (r) => ({ id: r.id, kind: r.kind, title: r.title, category: r.category, body: r.body, createdAt: r.created_at, updatedAt: r.updated_at });

function listNotes({ query }) {
  const kind = query.get('kind');
  if (!NOTE_KINDS.includes(kind)) throw fail(400, 'kind must be "session" or "lore".');
  return { notes: db.prepare('SELECT * FROM dm_notes WHERE kind = ? ORDER BY created_at DESC').all(kind).map(noteOut) };
}

function cleanNote(body) {
  return {
    title: String(body.title ?? '').trim().slice(0, 120) || 'Untitled',
    category: String(body.category ?? '').trim().slice(0, 40),
    body: String(body.body ?? '').slice(0, 100000),
  };
}

function createNote({ body }) {
  if (!NOTE_KINDS.includes(body.kind)) throw fail(400, 'kind must be "session" or "lore".');
  const n = cleanNote(body);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO dm_notes (id, kind, title, category, body, created_at, updated_at) VALUES (?,?,?,?,?,?,?)').run(id, body.kind, n.title, n.category, n.body, now, now);
  return { note: noteOut(db.prepare('SELECT * FROM dm_notes WHERE id = ?').get(id)) };
}

function updateNote({ params, body }) {
  const n = cleanNote(body);
  const updatedAt = new Date().toISOString();
  if (!db.prepare('UPDATE dm_notes SET title = ?, category = ?, body = ?, updated_at = ? WHERE id = ?').run(n.title, n.category, n.body, updatedAt, params.id).changes) {
    throw fail(404, 'Note not found.');
  }
  return { ok: true, updatedAt };
}

function deleteNote({ params }) {
  if (!db.prepare('DELETE FROM dm_notes WHERE id = ?').run(params.id).changes) throw fail(404, 'Note not found.');
  return { ok: true };
}

// ── Initiative trackers (DM only) ────────────────────────────────────────────
const encounterOut = (r) => ({ id: r.id, name: r.name, data: JSON.parse(r.data), updatedAt: r.updated_at });
const encounterName = (v) => String(v ?? '').trim().slice(0, 80) || 'Encounter';
function encounterData(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { round: 1, firstId: null, combatants: [] };
  return v;
}

function listEncounters() {
  return { encounters: db.prepare('SELECT * FROM encounters ORDER BY created_at').all().map(encounterOut) };
}

function createEncounter({ body }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO encounters (id, name, data, created_at, updated_at) VALUES (?,?,?,?,?)').run(
    id, encounterName(body.name), JSON.stringify(encounterData(body.data)), now, now
  );
  return { encounter: encounterOut(db.prepare('SELECT * FROM encounters WHERE id = ?').get(id)) };
}

function updateEncounter({ params, body }) {
  const changed = db.prepare('UPDATE encounters SET name = ?, data = ?, updated_at = ? WHERE id = ?').run(
    encounterName(body.name), JSON.stringify(encounterData(body.data)), new Date().toISOString(), params.id
  ).changes;
  if (!changed) throw fail(404, 'Encounter not found.');
  return { ok: true };
}

function deleteEncounter({ params }) {
  if (!db.prepare('DELETE FROM encounters WHERE id = ?').run(params.id).changes) throw fail(404, 'Encounter not found.');
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

function listCharacters({ user, query }) {
  const all = query.get('all') === '1' && user.role === 'dm';
  const rows = db
    .prepare(
      `SELECT c.*, u.display_name AS owner_name FROM characters c JOIN users u ON u.id = c.user_id
        ${all ? '' : 'WHERE c.user_id = ?'} ORDER BY c.updated_at DESC`
    )
    .all(...(all ? [] : [user.id]));
  return { characters: rows.map(charSummary) };
}

/** Loads a character and checks the caller may touch it (owner, or any DM). */
function loadCharacter(user, id) {
  const row = db
    .prepare('SELECT c.*, u.display_name AS owner_name FROM characters c JOIN users u ON u.id = c.user_id WHERE c.id = ?')
    .get(id);
  if (!row || (row.user_id !== user.id && user.role !== 'dm')) throw fail(404, 'Character not found.');
  return row;
}

function cleanCharacterData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail(400, 'Character data is missing.');
  const name = String(data.identity?.name || '').trim().slice(0, 80) || 'Unnamed Character';
  return { name, json: JSON.stringify(data) };
}

function createCharacter({ user, body }) {
  const { name, json } = cleanCharacterData(body.data);
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO characters (id, user_id, name, data, updated_at) VALUES (?,?,?,?,?)').run(
    id, user.id, name, json, new Date().toISOString()
  );
  return { id };
}

function getCharacter({ user, params }) {
  const row = loadCharacter(user, params.id);
  return { id: row.id, ownerId: row.user_id, ownerName: row.owner_name, updatedAt: row.updated_at, data: JSON.parse(row.data) };
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

// ── DM: players ──────────────────────────────────────────────────────────────
function listUsers() {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.role, u.created_at,
              (SELECT COUNT(*) FROM characters c WHERE c.user_id = u.id) AS characters
         FROM users u ORDER BY u.created_at`
    )
    .all();
  return { users: rows.map((u) => ({ ...auth.publicUser(u), createdAt: u.created_at, characters: u.characters })) };
}

function setRole({ user, params, body }) {
  if (!['player', 'dm'].includes(body.role)) throw fail(400, 'Role must be "player" or "dm".');
  if (params.id === user.id) throw fail(400, 'You cannot change your own role.');
  if (!db.prepare('UPDATE users SET role = ? WHERE id = ?').run(body.role, params.id).changes) throw fail(404, 'User not found.');
  return { ok: true };
}

/** DM sets a temporary password for a player who forgot theirs. */
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
  ['GET',    '/api/auth/me',                 'public', ({ user }) => ({ user: auth.publicUser(user) })],
  ['POST',   '/api/auth/register',           'public', register],
  ['POST',   '/api/auth/login',              'public', login],
  ['POST',   '/api/auth/logout',             'public', logout],
  ['POST',   '/api/auth/password',           'user',   changePassword],

  ['GET',    '/api/spells',                  'public', listSpells],
  ['GET',    '/api/items',                   'public', async ({ user }) => ({ items: await visibleTo(user, 'items') })],
  ['GET',    '/api/classes',                 'public', async ({ user }) => ({ classes: await visibleTo(user, 'classes') })],
  ['GET',    '/api/components',              'public', async ({ user }) => ({ components: await visibleTo(user, 'components') })],
  ['GET',    '/api/subclasses',              'public', async ({ user }) => ({ subclasses: await visibleTo(user, 'subclasses') })],
  // NPCs & enemies: DM accounts only. There is no public route for this list.
  ['GET',    '/api/npcs',                    'dm',     async () => ({ npcs: await getList('npcs') })],
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
  ['POST',   '/api/characters',              'user',   createCharacter],
  ['GET',    '/api/characters/:id',          'user',   getCharacter],
  ['PUT',    '/api/characters/:id',          'user',   updateCharacter],
  ['DELETE', '/api/characters/:id',          'user',   deleteCharacter],

  ['GET',    '/api/users',                   'dm',     listUsers],
  ['PUT',    '/api/users/:id/role',          'dm',     setRole],
  ['PUT',    '/api/users/:id/password',      'dm',     resetPassword],
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
    if (route.access !== 'public' && !user) throw fail(401, 'Please sign in.');
    if (route.access === 'dm' && user.role !== 'dm') throw fail(403, 'Only the DM can do that.');
    const params = Object.fromEntries(
      Object.entries(url.pathname.match(route.regex).groups || {}).map(([k, v]) => [k, decodeURIComponent(v)])
    );
    const body = req.method === 'GET' ? {} : await readBody(req);
    send(200, await route.handler({ user, params, body, query: url.searchParams, req, res }));
  } catch (err) {
    if (!err.status) console.error(err);
    send(err.status || 500, { error: err.status ? err.message : 'Something went wrong on the server.', fields: err.fields });
  }
}
