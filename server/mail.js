/**
 * server/mail.js - sends the site's emails (confirm your email, reset your password).
 *
 * Uses Resend's web API (https://resend.com) through Node's built-in fetch, so
 * there is nothing to install. Settings (environment variables):
 *
 *   RESEND_API_KEY=re_...      turns sending on
 *   MAIL_FROM="Arcane Compositry <noreply@your-domain>"   a sender on a domain verified in Resend
 *   SITE_URL=https://your-site the address put in the links (required when sending)
 *   MAIL_LOG=1                 no key? print each email to this console instead
 *                              (for trying it out locally - never on a real server)
 *
 * With neither RESEND_API_KEY nor MAIL_LOG set, no email is sent: "Forgot
 * password" is hidden and a site admin resets passwords instead.
 *
 * To use another provider, change send() below - the rest of the site only
 * calls sendMail().
 */
const KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.MAIL_FROM || '';
const LOG = process.env.MAIL_LOG === '1';

/** True when the site can send email (for real, or into the console). */
export const mailEnabled = !!KEY || LOG;

if (KEY && (!FROM || !process.env.SITE_URL)) {
  console.warn('[mail] RESEND_API_KEY is set but MAIL_FROM or SITE_URL is missing - emails will fail.');
}

/**
 * The site's own address for links in emails. Taken from SITE_URL, never from
 * the request, so nobody can make a reset email point at another website.
 */
export function siteUrl() {
  return (process.env.SITE_URL || `http://localhost:${Number(process.env.PORT) || 3000}`).replace(/\/+$/, '');
}

async function send({ to, subject, text }) {
  if (!KEY) {
    console.log(`\n[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`);
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Resend answered ${response.status}: ${await response.text()}`);
}

/**
 * Sends one email. Never throws: a failed email is logged, and the person can
 * ask for another one, so it must not break sign-up or the page they are on.
 */
export async function sendMail(message) {
  if (!mailEnabled) return false;
  try {
    await send(message);
    return true;
  } catch (err) {
    console.error(`[mail] Could not send "${message.subject}" to ${message.to}: ${err.message}`);
    return false;
  }
}
