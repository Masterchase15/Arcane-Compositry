/**
 * server/routes/admin.js - the site admin's list of every account, and "Set password".
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import { db } from '../db.js';
import * as auth from '../auth.js';
import { fail } from '../http.js';

// ── Site admin: every account ────────────────────────────────────────────────
function listAccounts() {
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.is_admin, u.email, u.email_verified_at, u.email_prompted, u.created_at,
              (SELECT group_concat(g.name, ', ') FROM memberships m JOIN groups g ON g.id = m.group_id WHERE m.user_id = u.id) AS group_names
         FROM users u ORDER BY u.created_at`
    )
    .all();
  return { users: rows.map((u) => ({ ...auth.publicUser(u), createdAt: u.created_at, groups: u.group_names || '' })) };
}

/** The admin sets a temporary password for someone who forgot theirs. */
function adminSetPassword({ params, body }) {
  const problem = auth.validatePassword(body.password);
  if (problem) throw fail(400, problem);
  if (!db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(auth.hashPassword(body.password), params.id).changes) {
    throw fail(404, 'User not found.');
  }
  auth.destroyUserSessions(params.id);
  return { ok: true };
}

export const routes = [
  ['GET',    '/api/admin/users',             'admin',  listAccounts],
  // (Admins are made on the server with scripts/make-admin.js - deliberately no route for it.)
  ['PUT',    '/api/admin/users/:id/password', 'admin', adminSetPassword],
];
