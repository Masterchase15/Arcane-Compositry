/**
 * test/books.test.js - the Codex library: every book opens and searches, and
 * bookmarks and reading progress belong to one account only.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let server, reader, other;

before(async () => {
  server = await startServer();
  reader = await server.signUp('bookworm');
  other = await server.signUp('otherreader');
});
after(() => server.stop());

test('the library lists every book, and each rulebook opens with contents and pages', async () => {
  const { books } = (await server.client().get('/books')).body;
  assert.equal(books[0].id, 'arcane-compositry', 'the built-in codex comes first');
  for (const b of books.filter((x) => !x.builtIn)) {
    const r = await server.client().get(`/books/${b.id}`);
    assert.equal(r.status, 200, b.id);
    assert.ok(r.body.toc.length > 0, `${b.id} has contents`);
    const first = await server.client().get(`/books/${b.id}/pages/${r.body.pages[0].id}`);
    assert.equal(first.status, 200);
    assert.ok(first.body.page.html.length > 0, `${b.id} first page has text`);
  }
  assert.equal((await server.client().get('/books/arcane-compositry')).status, 404, 'the built-in book is read in the browser');
  assert.equal((await server.client().get('/books/no-such-book')).status, 404);
  assert.equal((await server.client().get('/books/players-handbook-2024/pages/no-such-page')).status, 404);
});

test('book text is escaped and never carries raw HTML from the Markdown', async () => {
  const { pages } = (await server.client().get('/books/players-handbook-2024')).body;
  for (const p of pages.slice(0, 40)) {
    const { html } = (await server.client().get(`/books/players-handbook-2024/pages/${p.id}`)).body.page;
    assert.ok(!/<(script|span|img|iframe)\b/i.test(html), `${p.id} has no raw tags`);
    assert.ok(!/<a (?!class="xref" href="\/codex\/players-handbook-2024\/)/i.test(html), `${p.id} links only within the book`);
    assert.ok(!/onmouseover|\{@/.test(html), `${p.id} has no 5etools leftovers`);
  }
});

test('search finds headings first, in one book or across the library', async () => {
  const one = (await server.client().get('/books/players-handbook-2024/search?q=fireball')).body;
  assert.ok(one.total > 0);
  assert.equal(one.results[0].heading, 'Fireball');
  assert.equal(one.results[0].kind, 'heading');
  const all = (await server.client().get('/books/search?q=gelatinous%20cube')).body;
  assert.ok(all.books.some((b) => b.id === 'monster-manual-2025'));
  assert.equal((await server.client().get('/books/players-handbook-2024/search?q=')).body.total, 0);
});

test('lists of names link to their descriptions, and only real lists do', async () => {
  const get = async (book, page) => (await server.client().get(`/books/${book}/pages/${page}`)).body.page.html;
  assert.match(await get('players-handbook-2024', 'conditions'), /<li><a class="xref" href="\/codex\/players-handbook-2024\/conditions\?at=blinded">Blinded<\/a>/);
  assert.match(await get('players-handbook-2024', 'spell-descriptions'), /<a class="xref" href="\/codex\/players-handbook-2024\/a\?at=acid-splash"><i>Acid Splash<\/i><\/a>/);
  assert.doesNotMatch(await get('players-handbook-2024', 'suffocation'), /xref[^>]*>Slow</, 'a lone match in a table (travel pace "Slow") is not linked');
});

test('a search hit on a list item leads to the description, not the list', async () => {
  const { results } = (await server.client().get('/books/players-handbook-2024/search?q=acid%20splash')).body;
  const splash = results.filter((r) => /acid splash/i.test(r.heading + r.snippet));
  assert.equal(splash.length, 1, 'one result, not one for the spell and one for the list');
  assert.deepEqual([splash[0].page, splash[0].anchor, splash[0].pageTitle], ['a', 'acid-splash', 'Spell Descriptions: A']);
});

test('bookmarks belong to their account and survive signing out and in again', async () => {
  const add = await reader.post('/bookmarks', { book: 'monster-manual-2025', page: 'aboleth', anchor: 'aboleth-lairs', title: 'Aboleth Lairs', context: 'MM › Aboleth' });
  assert.equal(add.status, 200);
  const id = add.body.bookmark.id;
  const again = await reader.post('/bookmarks', { book: 'monster-manual-2025', page: 'aboleth', anchor: 'aboleth-lairs', title: 'Aboleth Lairs' });
  assert.equal(again.body.bookmark.id, id, 'the same spot twice is one bookmark');

  assert.deepEqual((await other.get('/bookmarks')).body.bookmarks, [], "nobody else sees it");
  assert.equal((await other.put(`/bookmarks/${id}`, { note: 'mine now' })).status, 404);
  assert.equal((await other.del(`/bookmarks/${id}`)).status, 404);
  assert.equal((await server.client().get('/bookmarks')).status, 401, 'signed out: no bookmarks');

  assert.equal((await reader.put(`/bookmarks/${id}`, { note: 'Session 4 villain' })).body.bookmark.note, 'Session 4 villain');
  await reader.post('/auth/logout');
  assert.equal((await reader.post('/auth/login', { username: 'bookworm', password: 'password123' })).status, 200);
  const mine = (await reader.get('/bookmarks?book=monster-manual-2025')).body.bookmarks;
  assert.equal(mine.length, 1);
  assert.equal(mine[0].note, 'Session 4 villain');

  const lib = (await reader.get('/books')).body.books;
  assert.equal(lib.find((b) => b.id === 'monster-manual-2025').bookmarks, 1);
  assert.equal((await reader.del(`/bookmarks/${id}`)).status, 200);
  assert.deepEqual((await reader.get('/bookmarks')).body.bookmarks, []);
});

test('bookmarks need a real book, a page and a title', async () => {
  assert.equal((await reader.post('/bookmarks', { book: 'nope', page: 'x', title: 'x' })).status, 400);
  assert.equal((await reader.post('/bookmarks', { book: 'players-handbook-2024', page: '', title: 'x' })).status, 400);
  assert.equal((await reader.post('/bookmarks', { book: 'arcane-compositry', page: 'quick-start', title: 'Quick Start' })).status, 200, 'the built-in book can be bookmarked too');
});

test('"continue reading" is remembered per account', async () => {
  assert.equal((await reader.put('/reading/players-handbook-2024', { page: 'f', anchor: 'fireball', title: 'F › Fireball' })).status, 200);
  const mine = (await reader.get('/books')).body.books.find((b) => b.id === 'players-handbook-2024');
  assert.equal(mine.progress.page, 'f');
  assert.equal(mine.progress.anchor, 'fireball');
  const theirs = (await other.get('/books')).body.books.find((b) => b.id === 'players-handbook-2024');
  assert.equal(theirs.progress, null);
  assert.equal((await server.client().put('/reading/players-handbook-2024', { page: 'f' })).status, 401);
});
