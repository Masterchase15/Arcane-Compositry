/**
 * server/books.js - the Codex library: loads the rulebooks in data/books/,
 * splits each into pages, and searches them.
 *
 * The list of books is data/books/index.js. Each book is one Markdown file;
 * its headings become the table of contents:
 *
 *   #     a chapter (or, with the book's `parts` pattern, a part of the book
 *         when it matches and a chapter inside the part when it does not)
 *   ##    a section            ###  a subsection          ####  a topic
 *
 * PAGES. A chapter is shown as one page when it is short. A long one (more
 * than PAGE_LIMIT characters) is split: its opening text becomes a page and
 * each section becomes a page of its own - and so on down, so the 400-spell
 * chapter becomes one page per letter. (A glossary of many short entries is
 * kept as one page.) Every heading keeps an id (its
 * "anchor"), unique within the book, and knows which page it is on; bookmarks
 * store the page and anchor.
 *
 * LINKS. A list item or first table cell that is exactly the name of a heading
 * elsewhere in the book ("Blinded", "Acid Splash", "Acolyte") links to it, and a
 * search hit on such an item leads to the heading, not to the list.
 *
 * Each file is read once and kept in memory, and read again whenever it
 * changes on disk (edit, save, refresh the browser).
 *
 * The Arcane Compositry codex (builtIn: true in index.js) is not a file: its
 * text lives in public/js/rules/codex-content.js and the browser shows it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderBlocks, textBlocks, statblockNames, plain, idMaker, esc } from './markdown.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'books');
const INDEX = path.join(DIR, 'index.js');

/** A chapter longer than this many characters of Markdown is split into one page per section. */
const PAGE_LIMIT = 45000;
/** Headings this deep and shallower appear in the table of contents (0 part, 1 #, 2 ##, 3 ###). */
const TOC_DEPTH = 3;

// ── The list of books ────────────────────────────────────────────────────────
let index = { mtime: 0, books: [] };

/** Every book in data/books/index.js: { id, title, abbr, kind, year, description, builtIn, file, parts }. */
export async function listBooks() {
  const mtime = fs.statSync(INDEX).mtimeMs;
  if (mtime !== index.mtime) {
    const mod = await import(`${pathToFileURL(INDEX).href}?v=${mtime}`);
    index = { mtime, books: (mod.BOOKS || []).filter((b) => b && b.id && (b.builtIn || b.file)) };
  }
  return index.books;
}

export async function findBook(id) {
  return (await listBooks()).find((b) => b.id === id) || null;
}

/** What the library card shows. */
export function bookMeta(meta, book) {
  return {
    id: meta.id, title: meta.title, abbr: meta.abbr || '', kind: meta.kind || '', year: meta.year || null,
    description: meta.description || '', builtIn: !!meta.builtIn,
    pages: book ? book.pages.length : null, chapters: book ? book.toc.length : null,
  };
}

// ── Loading and splitting a book ─────────────────────────────────────────────
const loaded = new Map(); // id -> { mtime, meta, book }

/** The parsed book, or null (unknown id, built-in book, or missing file). */
export async function loadBook(id) {
  const meta = await findBook(id);
  if (!meta || meta.builtIn) return null;
  const file = path.join(DIR, meta.file);
  let mtime;
  try { mtime = fs.statSync(file).mtimeMs; } catch { return null; }
  const hit = loaded.get(id);
  if (hit && hit.mtime === mtime && hit.meta === meta) return hit.book;
  const book = parseBook(meta, fs.readFileSync(file, 'utf8'));
  loaded.set(id, { mtime, meta, book });
  return book;
}

const HEADING = /^(#{1,4})\s+(.*?)\s*#*\s*$/;
const hasText = (lines) => lines.some((l) => l.trim() && !/^!\[.*\]\(.*\)\s*$/.test(l.trim()));

function parseBook(meta, source) {
  const anchor = idMaker();
  const root = { level: -1, title: meta.title, id: 'start', lines: [], children: [], parent: null };
  const stack = [root];
  const nodes = [];
  let current = root;
  let onlyBlank = true; // nothing but blank lines since the last heading
  let fence = false;

  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    const m = !fence && HEADING.exec(line);
    if (m && plain(m[2])) {
      const title = plain(m[2]);
      // Some books repeat a heading straight away (# Aboleth / ## Aboleth / # Aboleth): keep the first.
      if (current !== root && onlyBlank && title.toLowerCase() === current.title.toLowerCase()) continue;
      let level = m[1].length;
      if (level === 1 && meta.parts instanceof RegExp && meta.parts.test(title)) level = 0;
      while (stack.at(-1).level >= level) stack.pop();
      const node = { level, title, id: anchor(title), lines: [], children: [], parent: stack.at(-1) };
      node.parent.children.push(node);
      stack.push(node);
      nodes.push(node);
      current = node;
      onlyBlank = true;
      continue;
    }
    current.lines.push(line);
    if (line.trim()) onlyBlank = false;
  }

  // Sizes, then pages.
  const size = (n) => (n.size = n.lines.reduce((s, l) => s + l.length + 1, 0) + n.children.reduce((s, c) => s + size(c), 0));
  size(root);

  const pages = [];
  const addPage = (node, whole) => {
    const page = { id: node.id, node, whole, html: null };
    pages.push(page);
    const mark = (n) => { n.page = node.id; if (whole) n.children.forEach(mark); };
    mark(node);
  };
  // A long chapter made of many short entries (a glossary) stays one page rather than becoming dozens of tiny ones.
  const shortEntries = (node) => node.size <= PAGE_LIMIT * 2.5 && node.size / node.children.length < 2500;
  const paginate = (node) => {
    if (node.size <= PAGE_LIMIT || !node.children.length || shortEntries(node)) return addPage(node, true);
    if (hasText(node.lines)) addPage(node, false);
    node.children.forEach(paginate);
    node.page ??= node.children[0].page;
  };
  if (hasText(root.lines)) addPage(root, false);
  root.children.forEach(paginate);
  if (!pages.length) addPage(root, true);

  // Headings by name, for the links in lists and tables.
  const byName = new Map();
  for (const n of nodes) {
    const key = nameKey(n.title);
    if (key.length >= 3) byName.set(key, [...(byName.get(key) || []), n]);
  }
  // Stat blocks too ("Adult Red Dragon" has a stat block but no heading). Their ids are
  // made page by page in reading order, exactly as getPage() makes them.
  for (const p of pages) {
    const sbId = idMaker('sb-');
    const visit = (n) => {
      for (const name of statblockNames(n.lines)) {
        const key = nameKey(name);
        const entry = { title: name, page: p.id, id: sbId(name), statblock: true };
        if (key.length >= 3) byName.set(key, [...(byName.get(key) || []), entry]);
      }
      if (p.whole) n.children.forEach(visit);
    };
    visit(p.node);
  }
  /** The heading (or stat block) a list item names, other than the one the item sits under. Headings win. */
  const target = (text, from) => {
    const found = (byName.get(nameKey(text)) || []).filter((n) => n !== from && !(n.statblock && n.page === from.page && from.title === n.title));
    return found.find((n) => !n.statblock) || found[0] || null;
  };

  // Search index: one entry per paragraph / list item / table row, under its heading.
  const blocks = [];
  for (const n of [root, ...nodes]) {
    if (n === root && !hasText(root.lines)) continue;
    for (const { text, name } of textBlocks(n.lines)) {
      blocks.push({ node: n, text, lower: fold(text), target: name ? target(name, n) : null, nameLower: name ? fold(name) : '' });
    }
  }
  for (const n of nodes) n.lower = fold(n.title);

  const tocNode = (n) => ({
    id: n.id, title: n.title, page: n.page,
    ...(n.children.some((c) => c.level <= TOC_DEPTH) ? { children: n.children.filter((c) => c.level <= TOC_DEPTH).map(tocNode) } : {}),
  });

  return {
    id: meta.id, title: meta.title, root, nodes, pages, blocks, target,
    toc: root.children.map(tocNode),
    pageList: pages.map((p) => {
      const part = partOf(p.node);
      const parent = p.node.parent;
      // "Spell Descriptions: A" reads better in the chapter list than "A".
      const label = parent && parent !== part && parent.level >= 0 && p.node.title.length <= 3 ? `${parent.title}: ${p.node.title}` : p.node.title;
      return { id: p.id, title: p.node.title, label, part: part?.title || '' };
    }),
  };
}

/** "Blinded [Condition]", "blinded." and "Blinded" all name the same thing. */
const nameKey = (s) => fold(s).replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/[*_]/g, '').replace(/[.:;,]+$/, '').replace(/\s+/g, ' ').trim();

/** Address of a heading: '/codex/<book>/<page>?at=<heading>' (the same shape as bookHref() in web/src/lib/books.ts). */
const headingHref = (bookId, n) => `/codex/${bookId}/${n.page}${n.page === n.id ? '' : `?at=${n.id}`}`;

/** The top-level chapter or part a heading is in. */
function partOf(node) {
  let n = node;
  while (n.parent && n.parent.level >= 0) n = n.parent;
  return n.level >= 0 ? n : null;
}

/** The headings above this one, for the "Chapter 3 > Doors" line over a page. */
function trailOf(node) {
  const trail = [];
  for (let n = node.parent; n && n.level >= 0; n = n.parent) trail.unshift({ title: n.title, page: n.page, anchor: n.id });
  return trail;
}

// ── One page ─────────────────────────────────────────────────────────────────
/** A page's HTML (made the first time it is asked for, then kept). */
export function getPage(book, pageId) {
  const page = book.pages.find((p) => p.id === pageId);
  if (!page) return null;
  if (page.html == null) {
    const ctx = { id: idMaker('sb-') };
    const out = [];
    const draw = (n, depth) => {
      ctx.xref = (text) => { const t = book.target(text, n); return t ? headingHref(book.id, t) : null; };
      if (depth > 0) {
        const tag = `h${Math.min(depth + 1, 4)}`;
        out.push(`<${tag} id="${n.id}">${esc(n.title)}</${tag}>`);
      }
      out.push(renderBlocks(n.lines, ctx));
      if (page.whole) for (const c of n.children) draw(c, depth + 1);
    };
    draw(page.node, 0);
    page.html = out.join('\n');
  }
  const n = page.node;
  return {
    id: page.id,
    title: n.title,
    anchor: n.id,
    trail: trailOf(n),
    html: page.html,
    // A page that is only a chapter's opening text lists the chapter's sections after it.
    sections: page.whole ? [] : n.children.map((c) => ({ title: c.title, page: c.page, anchor: c.id })),
  };
}

// ── Search ───────────────────────────────────────────────────────────────────
/** Lower case, with curly quotes made straight, so "Xanathar's" finds "Xanathar’s". */
const fold = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-');

export function searchTerms(q) {
  return fold(String(q || '').slice(0, 120)).split(/\s+/).filter(Boolean).slice(0, 8);
}

/**
 * Finds every paragraph, list item, table row or heading that contains all the
 * words of the search. Headings come first, then text where the words appear
 * together as typed, then the rest, in book order.
 */
export function searchBook(book, q, limit = 200) {
  const terms = searchTerms(q);
  if (!terms.length) return { total: 0, results: [] };
  const phrase = terms.join(' ');
  const hits = [];
  for (const n of book.nodes) {
    if (terms.every((t) => n.lower.includes(t))) {
      hits.push({ rank: n.lower === phrase ? 0 : n.lower.startsWith(phrase) ? 1 : 2, kind: 'heading', node: n, text: '' });
    }
  }
  for (const b of book.blocks) {
    if (!terms.every((t) => b.lower.includes(t))) continue;
    // A list item that names a heading ("Acid Splash" in the list of spells) leads to that heading.
    if (b.target && terms.every((t) => b.nameLower.includes(t))) hits.push({ rank: 2, kind: 'heading', node: b.target, text: '' });
    else hits.push({ rank: b.lower.includes(phrase) ? 3 : 4, kind: 'text', node: b.node, text: b.text, lower: b.lower });
  }
  const seen = new Set();
  const unique = hits.filter((h) => h.kind === 'text' || (!seen.has(h.node) && seen.add(h.node)));
  unique.sort((a, b) => a.rank - b.rank);
  const labels = new Map(book.pageList.map((p) => [p.id, p.label]));
  return {
    total: unique.length,
    results: unique.slice(0, limit).map((h) => ({
      kind: h.kind,
      page: h.node.page,
      pageTitle: labels.get(h.node.page) || '',
      anchor: h.node.id,
      heading: h.node.title,
      snippet: h.kind === 'text' ? snippet(h.text, h.lower, terms, phrase) : '',
    })),
  };
}

function snippet(text, lower, terms, phrase) {
  let at = lower.indexOf(phrase);
  if (at < 0) at = lower.indexOf(terms[0]);
  const start = Math.max(0, at - 70);
  const end = Math.min(text.length, at + 170);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

// Read the books in the background shortly after the server starts, so the first visitor does not wait.
setTimeout(async () => {
  try { for (const b of await listBooks()) await loadBook(b.id); } catch (err) { console.error('Could not load the Codex books:', err.message); }
}, 500).unref();
