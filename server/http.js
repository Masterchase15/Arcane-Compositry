/**
 * server/http.js - small tools every route file shares: fail() for errors, and
 * the attempt limit (throttle) that slows down password guessing.
 */

/** Throw this from a handler to send an error: fail(404, 'Not found.') or with field messages. */
export const fail = (status, message, fields) => Object.assign(new Error(message), { status, fields });

// ── Small brute-force guard: 10 attempts per 5 minutes per address (wrong passwords,
//    sign-ups, joins, password-reset requests)
const attempts = new Map();
const WINDOW = 5 * 60e3;

/**
 * The visitor's IP address. Behind a hosting service's proxy every request
 * arrives from the proxy, so set TRUST_PROXY to the number of proxies in front
 * of the site (usually 1) and the address is read from X-Forwarded-For instead.
 * Proxies append to that header, so we count from the right: the entries on
 * the left were written by the visitor and can be faked.
 */
const TRUST_PROXY = Number(process.env.TRUST_PROXY) || 0;
export function clientIp(req) {
  if (TRUST_PROXY > 0) {
    const hops = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const ip = hops[hops.length - TRUST_PROXY];
    if (ip) return ip;
  }
  return req.socket.remoteAddress || 'unknown';
}

/** Refuses the request if this address made too many attempts lately. */
export function checkThrottle(req) {
  const now = Date.now();
  const recent = (attempts.get(clientIp(req)) || []).filter((t) => now - t < WINDOW);
  if (recent.length >= 10) throw fail(429, 'Too many attempts. Wait a few minutes and try again.');
  attempts.set(clientIp(req), recent);
}
export const recordAttempt = (req) => attempts.get(clientIp(req)).push(Date.now());

/** Counts this request as an attempt (sign-ups, joins, resets), refusing it if there were too many. */
export function throttle(req) {
  checkThrottle(req);
  recordAttempt(req);
}

// Forget addresses with no recent attempts, so the list does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of attempts) if (times.every((t) => now - t >= WINDOW)) attempts.delete(key);
}, WINDOW).unref();
