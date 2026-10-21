/**
 * server.js - start here.  Run with:  npm start   (or: node server.js)
 *
 * This one small server does two jobs:
 *   1. /api/...      accounts, characters and spells      -> server/api.js
 *   2. everything else   the website files in /public     -> served as-is
 *
 * No packages to install: it only uses what ships with Node.js (22.13+).
 *
 * Settings (all optional, set as environment variables):
 *   PORT=3000          which port to listen on
 *   HOST=0.0.0.0       which network interface (0.0.0.0 = reachable from other devices)
 *   STORAGE_DIR=...    where the database file lives (default ./storage)
 *   COOKIE_SECURE=1    set when the site is served over https
 *   INVITE_CODE=...    code players need to create an account (unset = anyone can sign up)
 *   TRUST_PROXY=1      number of proxies in front of the site (set on hosting services)
 *   RESEND_API_KEY, MAIL_FROM, SITE_URL, MAIL_LOG   email - see server/mail.js
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './server/api.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
};

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  // Never serve anything outside /public.
  if (!file.startsWith(PUBLIC + path.sep)) return notFound(res);
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      // "no-cache" = the browser re-checks each time, so edits show up on refresh.
      'Cache-Control': 'no-cache',
      'Last-Modified': stat.mtime.toUTCString(),
    });
    if (req.method === 'HEAD') return res.end();
    // A read error (file removed mid-request...) must end this response, not crash the server.
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

const server = http.createServer((req, res) => {
  // Once the site is public, bots send all sorts of broken addresses (e.g. "/%E0").
  // Anything that throws here answers that one request with 400 - it must never
  // stop the server for everyone else.
  try {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return notFound(res);
    serveStatic(req, res, url);
  } catch {
    if (!res.headersSent) res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Arcane Compositry companion is running.`);
  // The real port (PORT=0 lets the system pick a free one - the tests do that).
  console.log(`  Open  http://localhost:${server.address().port}  in your browser.`);
  console.log(`  (Press Ctrl+C to stop.)\n`);
});
