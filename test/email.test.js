/**
 * test/email.test.js - confirming an email, forgotten passwords, changing an email.
 * Emails are printed by the test server (MAIL_LOG=1) and their links read back.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { startServer } from './helpers.js';

let server;
before(async () => { server = await startServer(); });
after(() => server.stop());

const confirm = async (client) => {
  const token = await server.lastLink('verify');
  assert.ok(token, 'a confirmation email was sent');
  return client.post('/auth/verify', { token });
};

test('sign-up sends a confirmation link that works once', async () => {
  const c = await server.signUp('confirmer');
  assert.equal(c.user.emailVerified, false);
  const token = await server.lastLink('verify');
  assert.equal((await c.post('/auth/verify', { token })).status, 200);
  assert.equal((await c.get('/auth/me')).body.user.emailVerified, true);
  assert.equal((await c.post('/auth/verify', { token })).status, 400, 'used links stop working');
});

test('forgot password: same answer for everyone, email only to confirmed addresses', async () => {
  await server.signUp('unconfirmed');
  const before = server.countLinks('reset');
  for (const email of ['unconfirmed@example.com', 'nobody-here@example.com']) {
    const r = await server.client().post('/auth/forgot', { email });
    assert.deepEqual(r.body, { ok: true });
  }
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(server.countLinks('reset'), before, 'no reset email for an unconfirmed or unknown address');
});

test('a reset link sets a new password, signs out everywhere, and works once', async () => {
  const c = await server.signUp('resetter');
  await confirm(c);
  await server.client().post('/auth/forgot', { email: 'Resetter@Example.com' });
  const token = await server.lastLink('reset');
  assert.ok(token);
  const anon = server.client();
  assert.equal((await anon.post('/auth/reset', { token, password: 'short' })).status, 400, 'a too-short password does not use up the link');
  assert.equal((await anon.post('/auth/reset', { token, password: 'brand-new-pass' })).status, 200);
  assert.equal((await c.get('/auth/me')).body.user, null, 'old sessions are signed out');
  assert.equal((await anon.post('/auth/reset', { token, password: 'another-pass' })).status, 400);
  assert.equal((await server.client().post('/auth/login', { username: 'resetter', password: 'brand-new-pass' })).status, 200);
});

test('changing an email needs the password, and makes it unconfirmed', async () => {
  const c = await server.signUp('mover');
  await confirm(c);
  const oldToken = server.countLinks('verify');
  assert.equal((await c.put('/auth/email', { email: 'mover2@example.com', password: 'wrong' })).status, 400);
  assert.equal((await c.put('/auth/email', { email: 'mover2@example.com', password: 'password123' })).status, 200);
  const me = (await c.get('/auth/me')).body.user;
  assert.equal(me.email, 'mover2@example.com');
  assert.equal(me.emailVerified, false);
  assert.ok(server.countLinks('verify') > oldToken, 'a new confirmation email went to the new address');
  // Taken by someone else?
  await server.signUp('squatter');
  assert.equal((await c.put('/auth/email', { email: 'squatter@example.com', password: 'password123' })).status, 409);
});

test('resending the confirmation is limited to once a minute', async () => {
  const c = await server.signUp('impatient');
  const r = await c.post('/auth/verify/resend');
  assert.equal(r.status, 429);
});

test('accounts from before emails are asked once, and can add one without a password', async () => {
  // Make an account the way the old version did: no email.
  const seed = await server.signUp('template');
  const db = new DatabaseSync(path.join(server.storageDir, 'arcane.db'));
  db.prepare("INSERT INTO users (id, username, display_name, password_hash, created_at) SELECT 'old-1', 'oldtimer', 'Oldtimer', password_hash, '2020' FROM users WHERE id = ?").run(seed.user.id);
  db.close();

  const c = server.client();
  await c.post('/auth/login', { username: 'oldtimer', password: 'password123' });
  assert.equal((await c.get('/auth/me')).body.user.askForEmail, true);
  await c.post('/auth/email/skip');
  assert.equal((await c.get('/auth/me')).body.user.askForEmail, false, 'asked only once');
  assert.equal((await c.put('/auth/email', { email: 'old@example.com' })).status, 200);
});
