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
 *   bookmarks      each account's Codex bookmarks (book, page, heading, note)
 *   reading_progress    where each account last was in each Codex book ("Continue reading")
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

// The invite-code maker is used by the migrations and by the campaign routes.
export { newInviteCode } from './migrations.js';
