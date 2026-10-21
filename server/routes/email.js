/**
 * server/routes/email.js - confirming an email address, "forgot password" and the
 * reset link, and adding or changing an email. Sending itself is in server/mail.js.
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import { db } from '../db.js';
import * as auth from '../auth.js';
import { sendMail, mailEnabled, siteUrl } from '../mail.js';
import { fail, throttle } from '../http.js';

// ── Email: confirm the address, forgotten password, change address ───────────
/** Emails a "confirm your email" link. Does not wait for the email to go out. */
export function sendVerification(userId, email) {
  if (!mailEnabled || !email) return;
  const token = auth.createEmailToken(userId, 'verify', email);
  void sendMail({
    to: email,
    subject: 'Confirm your email for Arcane Compositry',
    text: `Confirm this address for your Arcane Compositry account by opening this link:\n\n${siteUrl()}/verify?token=${token}\n\n`
      + `The link works once and expires in ${auth.TOKEN_HOURS.verify} hours. If you did not sign up, ignore this email.`,
  });
}

/** Opening the link from the confirmation email. */
function verifyEmail({ body }) {
  const row = auth.consumeEmailToken(body.token, 'verify');
  if (!row) throw fail(400, 'This link has expired or was already used. Sign in and send a new one from Account settings.');
  db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(new Date().toISOString(), row.user_id);
  return { ok: true };
}

/** "Send the confirmation email again". At most one a minute. */
function resendVerification({ user, req }) {
  throttle(req);
  if (!mailEnabled) throw fail(400, 'This site cannot send email.');
  if (!user.email) throw fail(400, 'Add an email address first.');
  if (user.email_verified_at) return { ok: true, alreadyVerified: true };
  if (Date.now() - auth.lastTokenAt(user.id, 'verify') < 60e3) throw fail(429, 'An email was just sent. Wait a minute before asking again.');
  sendVerification(user.id, user.email);
  return { ok: true };
}

/**
 * "Forgot password": emails a reset link - but only to a CONFIRMED address.
 * The answer is the same whether or not the address has an account, so this
 * cannot be used to find out who has one.
 */
function forgotPassword({ body, req }) {
  throttle(req);
  if (!mailEnabled) throw fail(400, 'This site cannot send email. Ask a site admin to set a new password for you.');
  const email = auth.normalizeEmail(body.email);
  const user = email ? db.prepare('SELECT id, email, email_verified_at FROM users WHERE email = ?').get(email) : null;
  if (user?.email_verified_at && Date.now() - auth.lastTokenAt(user.id, 'reset') > 60e3) {
    const token = auth.createEmailToken(user.id, 'reset', user.email);
    void sendMail({
      to: user.email,
      subject: 'Reset your Arcane Compositry password',
      text: `Someone (hopefully you) asked to reset the password for your Arcane Compositry account. Choose a new one here:\n\n`
        + `${siteUrl()}/reset?token=${token}\n\nThe link works once and expires in ${auth.TOKEN_HOURS.reset} hour. `
        + 'If you did not ask for this, ignore this email - your password stays the same.',
    });
  }
  return { ok: true };
}

/** Opening the reset link: sets the new password and signs the account out everywhere. */
function resetPassword({ body, req }) {
  throttle(req);
  const problem = auth.validatePassword(body.password);
  if (problem) throw fail(400, problem, { password: problem });
  const row = auth.consumeEmailToken(body.token, 'reset');
  if (!row) throw fail(400, 'This link has expired or was already used. Ask for a new one.');
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(auth.hashPassword(body.password), row.user_id);
  db.prepare('DELETE FROM email_tokens WHERE user_id = ?').run(row.user_id);
  auth.destroyUserSessions(row.user_id);
  return { ok: true };
}

/**
 * Add or change your email. Changing an existing one needs your password,
 * so someone at an unlocked computer cannot redirect your reset emails.
 */
function changeEmail({ user, body }) {
  const problem = auth.validateEmail(body.email);
  if (problem) throw fail(400, problem, { email: problem });
  if (user.email) {
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
    if (!auth.verifyPassword(String(body.password || ''), row.password_hash)) {
      throw fail(400, 'Password is incorrect.', { password: 'Password is incorrect.' });
    }
  }
  if (auth.emailTaken(body.email, user.id)) throw fail(409, 'That email is already used by another account.', { email: 'That email is already used by another account.' });
  if (auth.normalizeEmail(body.email) === user.email) return { ok: true, email: user.email };
  auth.setEmail(user.id, body.email);
  sendVerification(user.id, auth.normalizeEmail(body.email));
  return { ok: true, email: auth.normalizeEmail(body.email) };
}

/** "Not now" on the add-your-email prompt: do not ask again. */
function skipEmailPrompt({ user }) {
  db.prepare('UPDATE users SET email_prompted = 1 WHERE id = ?').run(user.id);
  return { ok: true };
}

export const routes = [
  ['PUT',    '/api/auth/email',              'user',   changeEmail],
  ['POST',   '/api/auth/email/skip',         'user',   skipEmailPrompt],
  ['POST',   '/api/auth/verify',             'public', verifyEmail],
  ['POST',   '/api/auth/verify/resend',      'user',   resendVerification],
  ['POST',   '/api/auth/forgot',             'public', forgotPassword],
  ['POST',   '/api/auth/reset',              'public', resetPassword],
];
