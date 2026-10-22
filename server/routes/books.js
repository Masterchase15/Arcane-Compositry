/**
 * server/routes/books.js - the Codex library: rulebooks, bookmarks and
 * "continue reading".
 *
 * The books themselves are files (data/books/, read and searched by
 * server/books.js) and anyone may read them. Bookmarks and reading progress
 * belong to the signed-in account, so they follow it to any device and nobody
 * else sees them.
 *
 * Route lines: [METHOD, path, who may call it, handler] - see server/api.js.
 */
import crypto from 'node:crypto';
import { db } from '../db.js';
import { fail } from '../http.js';
import { listBooks, findBook, loadBook, bookMeta, getPage, searchBook } from '../books.js';

// ── Books ────────────────────────────────────────────────────────────────────
/** Every book, plus (when signed in) where you left off and how many bookmarks you have in it. */
async function listLibrary({ user }) {
  const books = [];
  for (const meta of await listBooks()) books.push(bookMeta(meta, meta.builtIn ? null : await loadBook(meta.id)));
  if (user) {
    const progress = Object.fromEntries(db.prepare('SELECT * FROM reading_progress WHERE user_id = ?').all(user.id)
      .map((r) => [r.book, { page: r.page, anchor: r.anchor, title: r.title, updatedAt: r.updated_at }]));
    const counts = Object.fromEntries(db.prepare('SELECT book, COUNT(*) AS n FROM bookmarks WHERE user_id = ? GROUP BY book').all(user.id).map((r) => [r.book, r.n]));
    for (const b of books) Object.assign(b, { progress: progress[b.id] || null, bookmarks: counts[b.id] || 0 });
  }
  return { books };
}

async function bookOrFail(id) {
  const book = await loadBook(id);
  if (!book) throw fail(404, 'That book is not in the library.');
  return book;
}

/** A book's table of contents and its list of pages (the text comes a page at a time). */
async function getBook({ params }) {
  const book = await bookOrFail(params.id);
  return { book: bookMeta(await findBook(params.id), book), toc: book.toc, pages: book.pageList };
}

async function getBookPage({ params }) {
  const page = getPage(await bookOrFail(params.id), params.page);
  if (!page) throw fail(404, 'That page is not in this book.');
  return { page };
}

async function searchOneBook({ params, query }) {
  return searchBook(await bookOrFail(params.id), query.get('q'));
}

/** Search every rulebook at once (the library page). Built-in books are searched in the browser. */
async function searchLibrary({ query }) {
  const books = [];
  for (const meta of await listBooks()) {
    const book = meta.builtIn ? null : await loadBook(meta.id);
    if (!book) continue;
    const found = searchBook(book, query.get('q'), 6);
    if (found.total) books.push({ id: meta.id, title: meta.title, abbr: meta.abbr || '', ...found });
  }
  return { books };
}

// ── Bookmarks ────────────────────────────────────────────────────────────────
const MAX_BOOKMARKS = 2000;
const bookmarkOut = (r) => ({ id: r.id, book: r.book, page: r.page, anchor: r.anchor, title: r.title, context: r.context, note: r.note, createdAt: r.created_at });
const pageRef = (v) => String(v ?? '').trim().slice(0, 120);

async function checkBookId(id) {
  if (!(await findBook(id))) throw fail(400, 'Unknown book.');
  return id;
}

/** Your bookmarks: in one book (?book=) or in all of them, newest first. */
function listBookmarks({ user, query }) {
  const book = query.get('book');
  const rows = book
    ? db.prepare('SELECT * FROM bookmarks WHERE user_id = ? AND book = ? ORDER BY created_at DESC').all(user.id, book)
    : db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  return { bookmarks: rows.map(bookmarkOut) };
}

/** Bookmark a page (anchor '') or a heading on it. Bookmarking the same spot twice keeps the first. */
async function createBookmark({ user, body }) {
  const book = await checkBookId(String(body.book || ''));
  const page = pageRef(body.page);
  const anchor = pageRef(body.anchor);
  const title = String(body.title ?? '').trim().slice(0, 200);
  if (!page || !title) throw fail(400, 'A bookmark needs a page and a title.');
  const existing = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? AND book = ? AND page = ? AND anchor = ?').get(user.id, book, page, anchor);
  if (existing) return { bookmark: bookmarkOut(existing) };
  if (db.prepare('SELECT COUNT(*) AS n FROM bookmarks WHERE user_id = ?').get(user.id).n >= MAX_BOOKMARKS) {
    throw fail(400, `You have ${MAX_BOOKMARKS} bookmarks. Remove some before adding more.`);
  }
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO bookmarks (id, user_id, book, page, anchor, title, context, note, created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(
    id, user.id, book, page, anchor, title, String(body.context ?? '').trim().slice(0, 200), String(body.note ?? '').slice(0, 2000), new Date().toISOString()
  );
  return { bookmark: bookmarkOut(db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id)) };
}

/** Change a bookmark's note (or its title). */
function updateBookmark({ user, params, body }) {
  const row = db.prepare('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?').get(params.id, user.id);
  if (!row) throw fail(404, 'Bookmark not found.');
  const title = body.title === undefined ? row.title : String(body.title).trim().slice(0, 200) || row.title;
  const note = body.note === undefined ? row.note : String(body.note).slice(0, 2000);
  db.prepare('UPDATE bookmarks SET title = ?, note = ? WHERE id = ?').run(title, note, row.id);
  return { bookmark: bookmarkOut({ ...row, title, note }) };
}

function deleteBookmark({ user, params }) {
  if (!db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?').run(params.id, user.id).changes) throw fail(404, 'Bookmark not found.');
  return { ok: true };
}

// ── Reading progress ─────────────────────────────────────────────────────────
/** Remembers where you are in a book, for "Continue reading". */
async function saveProgress({ user, params, body }) {
  const book = await checkBookId(params.book);
  const page = pageRef(body.page);
  if (!page) throw fail(400, 'Which page?');
  db.prepare(
    `INSERT INTO reading_progress (user_id, book, page, anchor, title, updated_at) VALUES (?,?,?,?,?,?)
     ON CONFLICT (user_id, book) DO UPDATE SET page = excluded.page, anchor = excluded.anchor, title = excluded.title, updated_at = excluded.updated_at`
  ).run(user.id, book, page, pageRef(body.anchor), String(body.title ?? '').trim().slice(0, 200), new Date().toISOString());
  return { ok: true };
}

export const routes = [
  // The search route comes before /api/books/:id so "search" is not read as a book id.
  ['GET',    '/api/books',                   'public', listLibrary],
  ['GET',    '/api/books/search',            'public', searchLibrary],
  ['GET',    '/api/books/:id',               'public', getBook],
  ['GET',    '/api/books/:id/search',        'public', searchOneBook],
  ['GET',    '/api/books/:id/pages/:page',   'public', getBookPage],
  ['GET',    '/api/bookmarks',               'user',   listBookmarks],
  ['POST',   '/api/bookmarks',               'user',   createBookmark],
  ['PUT',    '/api/bookmarks/:id',           'user',   updateBookmark],
  ['DELETE', '/api/bookmarks/:id',           'user',   deleteBookmark],
  ['PUT',    '/api/reading/:book',           'user',   saveProgress],
];
