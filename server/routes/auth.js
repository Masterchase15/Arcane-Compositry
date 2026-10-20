/**
 * server/routes/auth.js - signing up, in and out, changing your password, and "who am I".
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import crypto from 'node:crypto';
import { db } from '../db.js';
import * as auth from '../auth.js';
import { mailEnabled } from '../mail.js';
import { fail, throttle, checkThrottle, recordAttempt } from '../http.js';
import { cleanCode, groupByCode, addMember, groupOut } from './campaigns.js';
import { sendVerification } from './email.js';

// ── The site invite code ─────────────────────────────────────────────────────
// INVITE_CODE (optional, set on the server) lets someone sign up without a group,
// e.g. a new DM who will create their own. When it is set, signing up needs
// either it or a campaign's invite code.
const INVITE_CODE = process.env.INVITE_CODE || '';
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const isSiteCode = (code) => !!INVITE_CODE && crypto.timingSafeEqual(sha(code), sha(INVITE_CODE));

// ── Auth ─────────────────────────────────────────────────────────────────────
function register({ body, req, res }) {
  throttle(req);
  const username = String(body.username || '').trim();
  const errors = auth.validateCredentials(username, body.password, body.email);
  if (!errors.email && auth.emailTaken(body.email)) errors.email = 'That email is already used by another account.';
  const code = cleanCode(body.inviteCode);
  const joining = groupByCode(code);
  if (code ? !joining && !isSiteCode(code) : INVITE_CODE) {
    errors.inviteCode = 'That invite code is not right. Ask your DM for it.';
  }
  if (Object.keys(errors).length) throw fail(400, 'Please fix the highlighted fields.', errors);
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    throw fail(409, 'That username is taken.', { username: 'That username is taken.' });
  }
  const user = auth.createUser({ username, displayName: body.displayName, password: body.password, email: body.email });
  if (joining) addMember(joining.id, user.id, 'player');
  sendVerification(user.id, user.email);
  res.setHeader('Set-Cookie', auth.sessionCookie(req, auth.createSession(user.id)));
  return { user: auth.publicUser(user), joinedGroup: joining?.id || null };
}

/** Sign in with a username or an email address (body.username holds either). */
function login({ body, req, res }) {
  // Only WRONG passwords count toward the limit, so a whole table signing in
  // from the same Wi-Fi on game night does not lock itself out.
  checkThrottle(req);
  const row = auth.findLogin(body.username);
  if (!row || !auth.verifyPassword(String(body.password || ''), row.password_hash)) {
    recordAttempt(req);
    throw fail(401, 'Username, email or password is incorrect.');
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
  db.prepare("DELETE FROM email_tokens WHERE user_id = ? AND purpose = 'reset'").run(user.id);
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
  return { user: auth.publicUser(user), groups, inviteRequired: !!INVITE_CODE, mailEnabled };
}

export const routes = [
  ['GET',    '/api/auth/me',                 'public', me],
  ['POST',   '/api/auth/register',           'public', register],
  ['POST',   '/api/auth/login',              'public', login],
  ['POST',   '/api/auth/logout',             'public', logout],
  ['POST',   '/api/auth/password',           'user',   changePassword],
];
