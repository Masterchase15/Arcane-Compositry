/**
 * test/server.test.js - the server keeps running whatever a visitor (or bot) sends.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let server;
before(async () => { server = await startServer(); });
after(() => server.stop());

test('broken addresses get an error answer and never stop the server', async () => {
  for (const bad of ['/%E0%A4%A', '/%', '/api/characters/%E0', '/..%2f..%2fserver.js']) {
    const res = await fetch(`${server.base}${bad}`);
    assert.ok(res.status >= 400 && res.status < 500, `${bad} answered ${res.status}`);
  }
  const api = await fetch(`${server.base}/api/auth/me`);
  assert.equal(api.status, 200, 'the site still answers afterwards');
});

test('files outside dist/ are never served', async () => {
  for (const path of ['/../server.js', '/..%2fserver.js', '/%2e%2e/package.json']) {
    const res = await fetch(`${server.base}${path}`);
    assert.notEqual(res.status, 200, `${path} must not be served`);
  }
});
