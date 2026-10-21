/**
 * server/db.js - the database.
 *
 * Uses SQLite through Node's built-in `node:sqlite` module, so there is nothing
 * to install. Everything lives in ONE file: storage/arcane.db
 * Back that file up and you have backed up every account and character.
 *
 * Tables
 *   users          one row per account            (is_admin = site admin; the old `role` column is unused)
 *   email_tokens   one-time "confirm your email" and "reset your password" links
 *   sessions       one row per logged-in browser
 *   groups         one row per campaign           (each has its own invite code)
 *   memberships    who is in which group, and as 'dm' or 'player'
 *   characters     one row per character sheet    (may be in one campaign; the whole sheet is JSON in `data`)
 *   custom_entries spells, items, classes... added/edited through a group's DM page (the `list` column says which)
 *   dm_notes       each group's session notes and lore entries
 *   encounters     each group's initiative trackers (one row per encounter)
 *   group_visibility    which spells, Components, items and classes a group's DM has hidden or published
 *
 * Changing the tables? Add a migration to server/migrations.js - never edit an
 * existing one, only append new ones.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './migrations.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(ROOT, 'storage');
fs.mkdirSync(STORAGE_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(STORAGE_DIR, 'arcane.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

migrate(db);

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
  () => {
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

db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
const row = db.prepare('SELECT MAX(version) AS v FROM schema_version').get();
for (let i = row.v ?? 0; i < MIGRATIONS.length; i++) {
  // All or nothing: a migration that fails part-way leaves the database as it was.
  db.exec('BEGIN');
  try {
    const step = MIGRATIONS[i];
    if (typeof step === 'function') step(); else db.exec(step);
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(i + 1);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
