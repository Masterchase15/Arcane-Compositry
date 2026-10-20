/**
 * test/helpers.js - shared tools for the tests. Run all tests with:  npm test
 *
 * startServer() runs the real server (server.js) on a free port with its own
 * empty database in a temporary folder, so tests never touch storage/. Emails
 * are printed (MAIL_LOG=1) and read back with server.lastLink().
 *
 * server.client() is one browser: it keeps its own sign-in cookie, and its own
 * made-up IP address, so the sign-in attempt limit treats each one as a
 * different person (the server trusts X-Forwarded-For because TRUST_PROXY=1).
 */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let nextIp = 1;

/** A fresh scratch folder for one server's database. */
export const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ac-test-'));

/**
 * Starts the site. Options: env (extra settings), storageDir (reuse a database).
 * Remember to `await server.stop()` (an `after(() => server.stop())` does it).
 */
export async function startServer({ env = {}, storageDir = tempDir() } = {}) {
  let output = '';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: '0', HOST: '127.0.0.1', STORAGE_DIR: storageDir,
      TRUST_PROXY: '1', MAIL_LOG: '1', SITE_URL: 'http://site.test',
      RESEND_API_KEY: '', INVITE_CODE: '',
      ...env,
    },
  });
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });

  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server did not start:\n${output}`)), 10000);
    const check = () => {
      const m = output.match(/http:\/\/localhost:(\d+)/);
      if (m) { clearTimeout(timer); resolve(Number(m[1])); }
    };
    child.stdout.on('data', check);
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Server exited (${code}):\n${output}`)); });
  });
  const base = `http://127.0.0.1:${port}`;

  return {
    base, storageDir,
    output: () => output,
    /** The newest emailed link of a kind ('verify' or 'reset'), as its token. Waits briefly for the email. */
    async lastLink(kind) {
      for (let i = 0; i < 20; i++) {
        const all = [...output.matchAll(new RegExp(`#/${kind}\\?token=([0-9a-f]+)`, 'g'))];
        if (all.length) return all.at(-1)[1];
        await new Promise((r) => setTimeout(r, 50));
      }
      return null;
    },
    /** How many emails of a kind have been "sent" so far. */
    countLinks: (kind) => [...output.matchAll(new RegExp(`#/${kind}\\?token=`, 'g'))].length,
    client(ip) { return new Client(base, ip || `10.0.${Math.floor(nextIp / 250)}.${(nextIp++ % 250) + 1}`); },
    /** Signs up a new account (with an email) and returns its signed-in client. */
    async signUp(username, extra = {}, client = this.client()) {
      const r = await client.post('/auth/register', { username, email: `${username}@example.com`, password: 'password123', ...extra });
      if (r.status !== 200) throw new Error(`Sign-up of ${username} failed: ${JSON.stringify(r.body)}`);
      client.user = r.body.user;
      return client;
    },
    /** Runs scripts/make-admin.js against this server's database. */
    makeAdmin(username, flag = 'on') {
      return execFileSync(process.execPath, ['scripts/make-admin.js', username, flag], {
        cwd: ROOT, env: { ...process.env, STORAGE_DIR: storageDir }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      });
    },
    async stop() {
      if (child.exitCode === null) {
        const exited = new Promise((r) => child.once('exit', r));
        child.kill();
        await exited;
      }
      try { fs.rmSync(storageDir, { recursive: true, force: true }); } catch { /* Windows may still hold the file a moment */ }
    },
  };
}

/** One browser: a cookie jar and an IP address. Every call returns { status, body }. */
class Client {
  constructor(base, ip) { this.base = base; this.ip = ip; this.cookie = ''; }

  async request(method, path, body, { group } = {}) {
    const url = new URL(`/api${path}`, this.base);
    if (group) url.searchParams.set('group', group);
    const headers = { 'X-Forwarded-For': this.ip };
    if (this.cookie) headers.Cookie = this.cookie;
    if (method !== 'GET') headers['Content-Type'] = 'application/json';
    const res = await fetch(url, { method, headers, body: method === 'GET' ? undefined : JSON.stringify(body ?? {}) });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const value = setCookie.split(';')[0];
      this.cookie = value.endsWith('=') ? '' : value; // an empty value = signed out
    }
    return { status: res.status, body: await res.json().catch(() => null) };
  }

  get(path, opts) { return this.request('GET', path, undefined, opts); }
  post(path, body, opts) { return this.request('POST', path, body, opts); }
  put(path, body, opts) { return this.request('PUT', path, body, opts); }
  del(path, opts) { return this.request('DELETE', path, undefined, opts); }
}
