/**
 * scripts/make-admin.js - the ONLY way to make an account a site admin (or take it away).
 *
 *   npm run make-admin                    list the current admins
 *   npm run make-admin <username>         make that account a site admin
 *   npm run make-admin <username> off     take the admin role away
 *
 * Run it on the server, in the app folder, with the same STORAGE_DIR the site
 * uses (on a host: open its shell first, e.g. `fly ssh console`). The account
 * must already exist - sign up on the site first.
 *
 * Admins can reset anyone's password from Account settings. Nobody is an
 * admin by default, and the website itself cannot make one. (Being a DM is
 * separate and per campaign: whoever starts a campaign is its DM.)
 */
import { db } from '../server/db.js';

const [username, flag = 'on'] = process.argv.slice(2);

if (!username) {
  const admins = db.prepare('SELECT username FROM users WHERE is_admin = 1 ORDER BY username').all();
  console.log(admins.length ? `Site admins: ${admins.map((a) => a.username).join(', ')}` : 'There are no site admins yet.');
  console.log('Usage: npm run make-admin <username> [on|off]');
  process.exit(0);
}
if (!['on', 'off'].includes(flag)) {
  console.log('Usage: npm run make-admin <username> [on|off]');
  process.exit(1);
}
const result = db.prepare('UPDATE users SET is_admin = ? WHERE username = ?').run(flag === 'on' ? 1 : 0, username);
console.log(result.changes ? `${username} is ${flag === 'on' ? 'now a site admin' : 'no longer a site admin'}.` : `No account named "${username}" was found. Sign up on the site first.`);
