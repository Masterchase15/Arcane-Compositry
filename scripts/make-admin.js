/**
 * scripts/make-admin.js - make an account the site admin (or take it away).
 *
 *   npm run make-admin <username>         make that account a site admin
 *   npm run make-admin <username> off     take the admin role away
 *
 * The first account ever created is the admin automatically, so you only need
 * this if you want a second admin or locked yourself out. The admin can reset
 * anyone's password from Account settings. (Being a DM is per group: whoever
 * creates a group is its DM, and a DM can make other members DM.)
 */
import { db } from '../server/db.js';

const [username, flag = 'on'] = process.argv.slice(2);
if (!username || !['on', 'off'].includes(flag)) {
  console.log('Usage: npm run make-admin <username> [on|off]');
  process.exit(1);
}
const result = db.prepare('UPDATE users SET is_admin = ? WHERE username = ?').run(flag === 'on' ? 1 : 0, username);
console.log(result.changes ? `${username} is ${flag === 'on' ? 'now a site admin' : 'no longer a site admin'}.` : `No account named "${username}" was found.`);
