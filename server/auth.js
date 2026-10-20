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
 * - Every account has a username (shown to others) and an email (private;
 *   only the person and site admins see it). Either one signs you in. Older
 *   accounts may have no email yet; they are asked once to add one.
 * - Emailed links ("confirm your email", "reset your password") are one-time
 *   tokens: only a hash is stored, each works once and expires (see TOKEN_HOURS).
 *   A password reset is only ever sent to a CONFIRMED address.
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
export function validateCredentials(username, password, email) {
  const errors = {};
  if (!/^[A-Za-z0-9_-]{3,24}$/.test(username || '')) {
    errors.username = 'Use 3-24 letters, numbers, dashes or underscores.';
  }
  const em = validateEmail(email);
  if (em) errors.email = em;
  const pw = validatePassword(password);
  if (pw) errors.password = pw;
  return errors;
}

/** Emails are stored trimmed and lowercase, so "Ann@X.com" and "ann@x.com" are the same account. */
export const normalizeEmail = (v) => String(v ?? '').trim().toLowerCase();

export function validateEmail(email) {
  const e = normalizeEmail(email);
  // Deliberately simple: something@something.something, no spaces. The confirmation email proves the rest.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) return 'Enter a valid email address.';
  return null;
}

export const emailTaken = (email, exceptUserId = '') =>
  !!db.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?').get(normalizeEmail(email), exceptUserId);

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 200) return 'That password is too long.';
  return null;
}

export function createUser({ username, displayName, password, email }) {
  const user = {
    id: crypto.randomUUID(),
    username,
    display_name: (displayName || username).trim().slice(0, 40),
    email: normalizeEmail(email),
    email_verified_at: null,
    email_prompted: 1,
    is_admin: 0, // admins are made with scripts/make-admin.js only
  };
  db.prepare(
    'INSERT INTO users (id, username, display_name, email, email_prompted, password_hash, is_admin, created_at) VALUES (?,?,?,?,?,?,?,?)'
  ).run(user.id, user.username, user.display_name, user.email, 1, hashPassword(password), user.is_admin, new Date().toISOString());
  return user;
}

/** The account for a sign-in name: an email if it has an @, otherwise a username. */
export function findLogin(identifier) {
  const id = String(identifier ?? '').trim();
  return id.includes('@')
    ? db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(id))
    : db.prepare('SELECT * FROM users WHERE username = ?').get(id);
}

/** Sets (or changes) the account's email. It starts unconfirmed; older links stop working. */
export function setEmail(userId, email) {
  db.prepare('UPDATE users SET email = ?, email_verified_at = NULL, email_prompted = 1 WHERE id = ?').run(normalizeEmail(email), userId);
  db.prepare('DELETE FROM email_tokens WHERE user_id = ?').run(userId);
}

// ── One-time email links ─────────────────────────────────────────────────────
export const TOKEN_HOURS = { verify: 48, reset: 1 };

/** Makes a link token for this user and address. Returns the token itself (only its hash is stored). */
export function createEmailToken(userId, purpose, email) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare('DELETE FROM email_tokens WHERE expires_at < ?').run(now);
  db.prepare('INSERT INTO email_tokens (token_hash, user_id, purpose, email, created_at, expires_at) VALUES (?,?,?,?,?,?)')
    .run(sha(token), userId, purpose, email, now, now + TOKEN_HOURS[purpose] * 3600e3);
  return token;
}

/** When the last link of this kind was sent to this user (ms), or 0. Used to stop email floods. */
export const lastTokenAt = (userId, purpose) =>
  db.prepare('SELECT MAX(created_at) AS t FROM email_tokens WHERE user_id = ? AND purpose = ?').get(userId, purpose).t || 0;

/**
 * Uses up a link token: returns { user_id, email } if it is valid, unexpired,
 * of this purpose and still for the account's current email - otherwise null.
 * Either way it cannot be used again.
 */
export function consumeEmailToken(token, purpose) {
  const hash = sha(String(token ?? ''));
  const row = db.prepare('SELECT * FROM email_tokens WHERE token_hash = ?').get(hash);
  if (!row) return null;
  db.prepare('DELETE FROM email_tokens WHERE token_hash = ?').run(hash);
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(row.user_id);
  if (row.purpose !== purpose || row.expires_at < Date.now() || !user || user.email !== row.email) return null;
  return row;
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
      `SELECT u.id, u.username, u.display_name, u.is_admin, u.email, u.email_verified_at, u.email_prompted
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

/** What the browser is told about the signed-in user (their own email included). */
export const publicUser = (u) => u && {
  id: u.id, username: u.username, displayName: u.display_name, isAdmin: !!u.is_admin,
  email: u.email || '', emailVerified: !!u.email_verified_at,
  // Older accounts without an email are asked once to add one.
  askForEmail: !u.email && !u.email_prompted,
};
