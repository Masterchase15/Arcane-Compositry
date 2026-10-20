/**
 * server/migrations.js - every change ever made to the database's tables, in order.
 *
 * db.js runs the ones a database has not had yet when the server starts (the
 * number done so far is kept in the schema_version table). This file opens no
 * database itself, so tests can run the migrations on a scratch copy.
 *
 * Adding a column or table later? Append a new entry to MIGRATIONS - never edit
 * an existing one. An entry is SQL, or a function (db) => {...} for changes
 * that need code (see 5).
 */
import crypto from 'node:crypto';

/** Each entry runs once, in order. Append only. */
export const MIGRATIONS = [
  `CREATE TABLE users (
     id            TEXT PRIMARY KEY,
     username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
     display_name  TEXT NOT NULL,
     password_hash TEXT NOT NULL,
     role          TEXT NOT NULL DEFAULT 'player',
     created_at    TEXT NOT NULL
   );
   CREATE TABLE sessions (
     token_hash TEXT PRIMARY KEY,
     user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at INTEGER NOT NULL
   );
   CREATE TABLE characters (
     id         TEXT PRIMARY KEY,
     user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name       TEXT NOT NULL,
     data       TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   CREATE INDEX characters_user ON characters(user_id);
   CREATE TABLE custom_spells (
     list       TEXT NOT NULL,          -- 'codified' or 'compositry'
     id         TEXT NOT NULL,          -- same id as a file spell = overrides that file spell
     data       TEXT NOT NULL,          -- the spell as JSON
     updated_at TEXT NOT NULL,
     PRIMARY KEY (list, id)
   );`,

  // 2 - DM session notes and lore entries (shared by every DM account).
  `CREATE TABLE dm_notes (
     id         TEXT PRIMARY KEY,
     kind       TEXT NOT NULL,          -- 'session' or 'lore'
     title      TEXT NOT NULL,
     category   TEXT NOT NULL DEFAULT '',  -- lore only: People, Places, Factions...
     body       TEXT NOT NULL DEFAULT '',
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );`,

  // 3 - Hidden / public choice for any spell, Component, item or class (file entries included).
  `CREATE TABLE catalog_visibility (
     list   TEXT NOT NULL,
     id     TEXT NOT NULL,
     hidden INTEGER NOT NULL,           -- 1 = only DM accounts see it, 0 = everyone
     PRIMARY KEY (list, id)
   );`,

  // 4 - Initiative trackers (DM only). Each row is one encounter; `data` holds its combatants as JSON.
  `CREATE TABLE encounters (
     id         TEXT PRIMARY KEY,
     name       TEXT NOT NULL,
     data       TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );`,

  // 5 - Groups. Each campaign is a group with its own DM(s), players, characters,
  //     notes, encounters and DM-page edits. A site that existed before this keeps
  //     everything: it all moves into one group, with everyone keeping their role.
  (db) => {
    db.exec(`
      CREATE TABLE groups (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        invite_code TEXT NOT NULL UNIQUE,
        created_at  TEXT NOT NULL
      );
      CREATE TABLE memberships (
        group_id  TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role      TEXT NOT NULL DEFAULT 'player',   -- 'dm' or 'player'
        joined_at TEXT NOT NULL,
        PRIMARY KEY (group_id, user_id)
      );
      CREATE INDEX memberships_user ON memberships(user_id);
      ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE characters ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE SET NULL;
      ALTER TABLE dm_notes   ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE CASCADE;
      ALTER TABLE encounters ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE CASCADE;
      CREATE TABLE custom_entries (
        group_id   TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        list       TEXT NOT NULL,
        id         TEXT NOT NULL,
        data       TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (group_id, list, id)
      );
      CREATE TABLE group_visibility (
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        list     TEXT NOT NULL,
        id       TEXT NOT NULL,
        hidden   INTEGER NOT NULL,
        PRIMARY KEY (group_id, list, id)
      );`);

    const first = db.prepare("SELECT id FROM users ORDER BY (role = 'dm') DESC, created_at LIMIT 1").get();
    if (first) {
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(first.id);
      const groupId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO groups (id, name, invite_code, created_at) VALUES (?,?,?,?)').run(groupId, 'Our campaign', newInviteCode(), now);
      db.prepare('INSERT INTO memberships (group_id, user_id, role, joined_at) SELECT ?, id, role, ? FROM users').run(groupId, now);
      for (const table of ['characters', 'dm_notes', 'encounters']) db.prepare(`UPDATE ${table} SET group_id = ?`).run(groupId);
      db.prepare('INSERT INTO custom_entries SELECT ?, list, id, data, updated_at FROM custom_spells').run(groupId);
      db.prepare('INSERT INTO group_visibility SELECT ?, list, id, hidden FROM catalog_visibility').run(groupId);
    }
    db.exec('DROP TABLE custom_spells; DROP TABLE catalog_visibility;');
  },

  // 6 - Email addresses. Stored lowercase; unique when present (older accounts may have none).
  //     email_tokens holds the one-time links sent by email: 'verify' (confirm the
  //     address) and 'reset' (choose a new password). Only a hash of each token is kept.
  `ALTER TABLE users ADD COLUMN email TEXT;
   ALTER TABLE users ADD COLUMN email_verified_at TEXT;
   ALTER TABLE users ADD COLUMN email_prompted INTEGER NOT NULL DEFAULT 0;  -- 1 = already asked to add one
   CREATE UNIQUE INDEX users_email ON users(email) WHERE email IS NOT NULL;
   CREATE TABLE email_tokens (
     token_hash TEXT PRIMARY KEY,
     user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     purpose    TEXT NOT NULL,          -- 'verify' or 'reset'
     email      TEXT NOT NULL,          -- the address it was sent to
     created_at INTEGER NOT NULL,
     expires_at INTEGER NOT NULL
   );
   CREATE INDEX email_tokens_user ON email_tokens(user_id);`,
];

/** A group's invite code: 8 letters and digits, leaving out ones that look alike (0/O, 1/I/L). */
export function newInviteCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(8), (b) => alphabet[b % alphabet.length]).join('');
}

/**
 * Brings a database up to date: runs every migration it has not had yet (or only
 * up to number `upTo`). Each runs in a transaction - all or nothing.
 */
export function migrate(db, upTo = MIGRATIONS.length) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const row = db.prepare('SELECT MAX(version) AS v FROM schema_version').get();
  for (let i = row.v ?? 0; i < upTo; i++) {
    db.exec('BEGIN');
    try {
      const step = MIGRATIONS[i];
      if (typeof step === 'function') step(db); else db.exec(step);
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(i + 1);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
