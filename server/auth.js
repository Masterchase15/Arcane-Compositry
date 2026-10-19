/**
 * server/auth.js - accounts, passwords and login sessions.
 *
 * - Passwords are never stored. We store a salted scrypt hash.
 * - Logging in creates a random session token, sent to the browser as an
 *   HttpOnly cookie (JavaScript on the page cannot read it). Only a SHA-256
 *   hash of the token is kept in the database.
 * - Every new account is an ordinary account. Site admins (who can reset
 *   anyone's password) are made ONLY from the command line on the server:
 *     npm run make-admin <username>        (see scripts/make-admin.js)
 *   Nothing on the website can grant admin, so it cannot be taken over by
 *   whoever signs up first or by a stolen admin login.
 * - Being a DM is not part of the account: it is a role inside a group (see
 *   memberships in db.js). Whoever creates a group is its DM.
 */
import crypto from 'node:crypto';
import { db } from './db.js';

const SESSION_DAYS = 30;
const COOKIE = 'ac_session';

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [, saltHex, hashHex] = stored.split('$');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  return crypto.timingSafeEqual(expected, actual);
}

/** Returns a list of problems with the sign-up details (empty = fine). */
export function validateCredentials(username, password) {
  const errors = {};
  if (!/^[A-Za-z0-9_-]{3,24}$/.test(username || '')) {
    errors.username = 'Use 3-24 letters, numbers, dashes or underscores.';
  }
  const pw = validatePassword(password);
  if (pw) errors.password = pw;
  return errors;
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 200) return 'That password is too long.';
  return null;
}

export function createUser({ username, displayName, password }) {
  const user = {
    id: crypto.randomUUID(),
    username,
    display_name: (displayName || username).trim().slice(0, 40),
    is_admin: 0, // admins are made with scripts/make-admin.js only
  };
  db.prepare(
    'INSERT INTO users (id, username, display_name, password_hash, is_admin, created_at) VALUES (?,?,?,?,?,?)'
  ).run(user.id, user.username, user.display_name, hashPassword(password), user.is_admin, new Date().toISOString());
  return user;
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 864e5;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').run(sha(token), userId, expires);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  return token;
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
}

export function destroyUserSessions(userId) {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function readSessionToken(req) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === COOKIE) return v;
  }
  return null;
}

/** The logged-in user for this request, or null. */
export function currentUser(req) {
  const token = readSessionToken(req);
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.is_admin
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(sha(token), Date.now());
  return row || null;
}

/**
 * Cookie header value. `Secure` is added when the site is served over HTTPS
 * (set COOKIE_SECURE=1, or put it behind a proxy that sends x-forwarded-proto).
 */
export function sessionCookie(req, token) {
  const secure = process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https';
  const base = `${COOKIE}=${token || ''}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
  return token ? `${base}; Max-Age=${SESSION_DAYS * 86400}` : `${base}; Max-Age=0`;
}

export const publicUser = (u) => u && { id: u.id, username: u.username, displayName: u.display_name, isAdmin: !!u.is_admin };
