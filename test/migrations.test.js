/**
 * test/migrations.test.js - an existing site keeps its data when upgraded.
 * Builds a database the way the original version (migrations 1-4) left it,
 * then starts today's server on it.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { MIGRATIONS, migrate } from '../server/migrations.js';
import { startServer, tempDir } from './helpers.js';

let server;
after(() => server?.stop());

/** The same password format server/auth.js writes. */
function hash(password) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

test('a database from the original version upgrades without losing anything', async () => {
  const dir = tempDir();
  const old = new DatabaseSync(path.join(dir, 'arcane.db'));
  migrate(old, 4); // the original version's tables
  const add = (id, username, role, at) =>
    old.prepare('INSERT INTO users (id, username, display_name, password_hash, role, created_at) VALUES (?,?,?,?,?,?)').run(id, username, username, hash('password123'), role, at);
  add('u-player', 'oldplayer', 'player', '2024-01-01');
  add('u-dm', 'olddm', 'dm', '2024-01-02');
  old.prepare("INSERT INTO characters (id, user_id, name, data, updated_at) VALUES ('c1','u-player','Oldchar','{\"identity\":{\"name\":\"Oldchar\"}}','2024')").run();
  old.prepare("INSERT INTO dm_notes (id, kind, title, created_at, updated_at) VALUES ('n1','lore','Old lore','2024','2024')").run();
  old.prepare("INSERT INTO custom_spells (list, id, data, updated_at) VALUES ('items','old-sword','{\"name\":\"Old Sword\",\"description\":\"x\",\"category\":\"Weapon\",\"rarity\":\"Common\"}','2024')").run();
  old.close();

  server = await startServer({ storageDir: dir });
  const dm = server.client();
  assert.equal((await dm.post('/auth/login', { username: 'olddm', password: 'password123' })).status, 200);
  const me = (await dm.get('/auth/me')).body;

  assert.equal(me.groups.length, 1, 'everything moved into one campaign');
  const camp = me.groups[0];
  assert.equal(camp.name, 'Our campaign');
  assert.equal(camp.role, 'dm', 'the DM is still the DM');
  assert.equal(me.user.isAdmin, true, 'the old DM became the site admin');
  assert.equal(me.user.askForEmail, true, 'and is asked for an email');

  const opts = { group: camp.id };
  const party = (await dm.get('/group/characters', opts)).body.characters;
  assert.deepEqual(party.map((c) => c.name), ['Oldchar']);
  assert.deepEqual((await dm.get('/notes?kind=lore', opts)).body.notes.map((n) => n.title), ['Old lore']);
  assert.ok((await dm.get('/items', opts)).body.items.some((i) => i.name === 'Old Sword'), 'homebrew kept');

  const player = server.client();
  await player.post('/auth/login', { username: 'oldplayer', password: 'password123' });
  const pme = (await player.get('/auth/me')).body;
  assert.equal(pme.groups[0].role, 'player');
  assert.equal(pme.user.isAdmin, false);
});

test('every migration runs on an empty database, and running again changes nothing', () => {
  const db = new DatabaseSync(':memory:');
  migrate(db);
  migrate(db);
  assert.equal(db.prepare('SELECT MAX(version) AS v FROM schema_version').get().v, MIGRATIONS.length);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_version').get().n, MIGRATIONS.length);
});
