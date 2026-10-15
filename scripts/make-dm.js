/**
 * scripts/make-dm.js - give an account the DM role (or take it away).
 *
 *   npm run make-dm <username>            make that account a DM
 *   npm run make-dm <username> player     turn it back into a player
 *
 * The first account ever created is a DM automatically, so you only need this
 * if you want a second DM or locked yourself out.
 */
import { db } from '../server/db.js';

const [username, role = 'dm'] = process.argv.slice(2);
if (!username || !['dm', 'player'].includes(role)) {
  console.log('Usage: npm run make-dm <username> [dm|player]');
  process.exit(1);
}
const result = db.prepare('UPDATE users SET role = ? WHERE username = ?').run(role, username);
console.log(result.changes ? `${username} is now a ${role === 'dm' ? 'DM' : 'player'}.` : `No account named "${username}" was found.`);
