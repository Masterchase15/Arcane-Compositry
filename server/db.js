/**
 * server/db.js - the database.
 *
 * Uses SQLite through Node's built-in `node:sqlite` module, so there is nothing
 * to install. Everything lives in ONE file: storage/arcane.db
 * Back that file up and you have backed up every account and character.
 *
 * Tables
 *   users          one row per account            (role is 'player' or 'dm')
 *   sessions       one row per logged-in browser
 *   characters     one row per character sheet    (the whole sheet is stored as JSON in `data`)
 *   custom_spells  spells, items and classes added/edited through the DM page (the `list` column says which)
 *   dm_notes       the DM's session notes and lore entries
 *   encounters     the DM's initiative trackers (one row per encounter)
 *   catalog_visibility  which spells, Components, items and classes are hidden from players
 *
 * Adding a column later? Add an `ALTER TABLE` line to the MIGRATIONS list at the
 * bottom - never edit an existing migration, only append new ones.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(ROOT, 'storage');
fs.mkdirSync(STORAGE_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(STORAGE_DIR, 'arcane.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

/** Each entry runs once, in order. Append only. */
const MIGRATIONS = [
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
];

db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
const row = db.prepare('SELECT MAX(version) AS v FROM schema_version').get();
for (let i = row.v ?? 0; i < MIGRATIONS.length; i++) {
  db.exec(MIGRATIONS[i]);
  db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(i + 1);
}
