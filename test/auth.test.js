/**
 * test/auth.test.js - signing up and in, the attempt limit, invite codes and site admins.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let server;
before(async () => { server = await startServer(); });
after(() => server.stop());

test('sign-up needs a valid username, email and password', async () => {
  const c = server.client();
  let r = await c.post('/auth/register', { username: 'ab', email: 'x@example.com', password: 'password123' });
  assert.equal(r.status, 400);
  assert.ok(r.body.fields.username);
  r = await c.post('/auth/register', { username: 'nomail', password: 'password123' });
  assert.ok(r.body.fields.email);
  r = await c.post('/auth/register', { username: 'shortpw', email: 'shortpw@example.com', password: 'short' });
  assert.ok(r.body.fields.password);
});

test('usernames and emails are unique (emails ignore case)', async () => {
  await server.signUp('unique1');
  let r = await server.client().post('/auth/register', { username: 'UNIQUE1', email: 'other@example.com', password: 'password123' });
  assert.equal(r.status, 409);
  r = await server.client().post('/auth/register', { username: 'unique2', email: 'Unique1@Example.COM', password: 'password123' });
  assert.equal(r.status, 400);
  assert.match(r.body.fields.email, /already used/);
});

test('sign in with username or email; wrong password fails', async () => {
  await server.signUp('signer');
  const c = server.client();
  assert.equal((await c.post('/auth/login', { username: 'signer', password: 'password123' })).status, 200);
  assert.equal((await c.post('/auth/login', { username: 'SIGNER@example.com', password: 'password123' })).status, 200);
  assert.equal((await c.post('/auth/login', { username: 'signer', password: 'wrong-password' })).status, 401);
  const me = await c.get('/auth/me');
  assert.equal(me.body.user.username, 'signer');
  await c.post('/auth/logout');
  assert.equal((await c.get('/auth/me')).body.user, null);
});

test('only wrong passwords count toward the limit, per address', async () => {
  await server.signUp('limited');
  const table = server.client('192.0.2.50');
  for (let i = 0; i < 12; i++) {
    assert.equal((await table.post('/auth/login', { username: 'limited', password: 'password123' })).status, 200, 'good sign-ins never count');
  }
  for (let i = 0; i < 10; i++) await table.post('/auth/login', { username: 'limited', password: 'wrong-password' });
  assert.equal((await table.post('/auth/login', { username: 'limited', password: 'password123' })).status, 429);
  // Someone else (another address) is not affected.
  assert.equal((await server.client('192.0.2.51').post('/auth/login', { username: 'limited', password: 'password123' })).status, 200);
});

test('the limit uses the right X-Forwarded-For entry (the left ones can be faked)', async () => {
  await server.signUp('spoofed');
  const attacker = server.client('192.0.2.60');
  for (let i = 0; i < 10; i++) await attacker.post('/auth/login', { username: 'spoofed', password: 'wrong-password' });
  // Adding a fake address in front does not escape the limit.
  attacker.ip = '1.2.3.4, 192.0.2.60';
  assert.equal((await attacker.post('/auth/login', { username: 'spoofed', password: 'password123' })).status, 429);
});

test('new accounts are never site admins; admin comes only from the script', async () => {
  const c = await server.signUp('wouldbeadmin');
  assert.equal(c.user.isAdmin, false);
  assert.equal((await c.get('/admin/users')).status, 403);
  assert.match(server.makeAdmin('wouldbeadmin'), /now a site admin/);
  assert.equal((await c.get('/admin/users')).status, 200);
  server.makeAdmin('wouldbeadmin', 'off');
  assert.equal((await c.get('/admin/users')).status, 403);
});

test('an admin can set a password, which signs that person out', async () => {
  const admin = await server.signUp('theadmin');
  server.makeAdmin('theadmin');
  const victim = await server.signUp('forgetful');
  const r = await admin.put(`/admin/users/${victim.user.id}/password`, { password: 'temporary1' });
  assert.equal(r.status, 200);
  assert.equal((await victim.get('/auth/me')).body.user, null);
  assert.equal((await server.client().post('/auth/login', { username: 'forgetful', password: 'temporary1' })).status, 200);
});

test('changing data needs a JSON request (blocks forged form posts)', async () => {
  const res = await fetch(`${server.base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'username=x&password=y',
  });
  assert.equal(res.status, 415);
});

test('with INVITE_CODE set, sign-up needs it or a campaign code', async () => {
  const gated = await startServer({ env: { INVITE_CODE: 'letmein' } });
  try {
    const signUp = (username, inviteCode) =>
      gated.client().post('/auth/register', { username, email: `${username}@example.com`, password: 'password123', inviteCode });
    assert.equal((await signUp('nocode')).status, 400);
    assert.equal((await signUp('badcode', 'nope')).status, 400);
    const dm = await gated.signUp('gateddm', { inviteCode: 'letmein' });
    const { group } = (await dm.post('/groups', { name: 'Gated' })).body;
    const r = await signUp('gatedplayer', group.inviteCode.toLowerCase());
    assert.equal(r.status, 200);
    assert.equal(r.body.joinedGroup, group.id);
  } finally {
    await gated.stop();
  }
});
