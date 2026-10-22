/**
 * server/api.js - receives every /api/... request and sends it to the right handler.
 *
 * The endpoints live in server/routes/, one file per feature (auth, email,
 * campaigns, catalog, notes, encounters, characters, books, admin). Each exports
 * `routes`, a list of lines:  [METHOD, path pattern, who may call it, handler]
 *   who:  'public'  anyone
 *         'user'    must be logged in
 *         'member'  must be logged in and a member of the campaign the page is showing
 *         'dm'      must be logged in as a DM of the campaign the page is showing
 *         'admin'   must be logged in as the site admin
 * A handler receives ({ user, group, params, body, query, req, res }) and returns
 * the object to send back as JSON. Throw `fail(status, message)` (server/http.js)
 * to send an error. Those checks all happen here, in handleApi(), before a
 * handler runs.
 *
 * CAMPAIGNS ("groups")
 *   The browser says which campaign it is showing by adding ?group=<id> to every
 *   request (web/src/lib/api.ts does this). `group` is then { id, name,
 *   inviteCode, role } - but only if the user really is a member; otherwise null.
 *
 * To add an endpoint: write a handler in the right routes file and add a line to
 * its `routes`. A new routes file also needs adding to ROUTE_FILES below.
 */
import { db } from './db.js';
import * as auth from './auth.js';
import { fail } from './http.js';
import { parseRulesets } from '../shared/rules/rulesets.js';
import * as authRoutes from './routes/auth.js';
import * as emailRoutes from './routes/email.js';
import * as campaignRoutes from './routes/campaigns.js';
import * as catalogRoutes from './routes/catalog.js';
import * as noteRoutes from './routes/notes.js';
import * as encounterRoutes from './routes/encounters.js';
import * as characterRoutes from './routes/characters.js';
import * as bookRoutes from './routes/books.js';
import * as adminRoutes from './routes/admin.js';

const MAX_BODY = 512 * 1024; // 512 KB is far more than any character sheet needs

const ROUTE_FILES = [authRoutes, emailRoutes, campaignRoutes, catalogRoutes, noteRoutes, encounterRoutes, characterRoutes, bookRoutes, adminRoutes];

const ROUTES = ROUTE_FILES.flatMap((file) => file.routes).map(([method, pattern, access, handler]) => ({
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
    .prepare('SELECT g.id, g.name, g.invite_code, g.rulesets, m.role FROM memberships m JOIN groups g ON g.id = m.group_id WHERE m.group_id = ? AND m.user_id = ?')
    .get(id, user.id);
  return row ? { id: row.id, name: row.name, inviteCode: row.invite_code, role: row.role, rulesets: parseRulesets(row.rulesets) } : null;
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
