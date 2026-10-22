/**
 * lib/books.ts - the Codex library's data: the books, their pages, search,
 * bookmarks and "continue reading". Used by pages/codex.tsx (the library) and
 * components/codex/ (reading a book).
 *
 * Every book is opened as a "source" with the same shape, wherever its text lives:
 *   { meta, toc, pages, builtIn, getPage(id), search(q) }
 *  - Rulebooks (data/books/*.md) come from the server a page at a time, and the
 *    server searches them (server/books.js).
 *  - The Arcane Compositry codex is built in (shared/rules/codex-content.js) and
 *    is searched right here in the browser.
 *
 * Bookmarks and reading progress belong to the signed-in account (stored on the
 * server). Signed out, reading progress is kept in this browser only.
 */
import { CHAPTERS, SECTIONS } from '@shared/rules/codex-content.js';
import { api } from './api';

export const BUILT_IN = 'arcane-compositry';

export interface Progress { page: string; anchor: string; title: string; updatedAt?: string }
export interface BookMeta {
  id: string; title: string; abbr: string; kind: string; year: number | null; description: string; builtIn: boolean;
  pages: number | null; chapters: number | null; progress?: Progress | null; bookmarks?: number;
}
export interface TocNode { id: string; title: string; page: string; anchor?: string; children?: TocNode[] }
export interface PageRef { id: string; title: string; label: string; part: string }
export interface Spot { title: string; page: string; anchor: string }
export interface BookPage {
  id: string; title: string; anchor: string; trail: Spot[]; html: string; sections: Spot[];
  kicker?: string; num?: string;
}
export interface SearchResult { kind: 'heading' | 'text'; page: string; pageTitle: string; anchor: string; heading: string; snippet: string }
export interface SearchResults { total: number; results: SearchResult[] }
export interface Bookmark { id: string; book: string; page: string; anchor: string; title: string; context: string; note: string; createdAt: string }

export interface BookSource {
  meta: BookMeta;
  toc: TocNode[];
  pages: PageRef[];
  builtIn: boolean;
  getPage: (id: string) => Promise<BookPage | null>;
  search: (q: string) => Promise<SearchResults>;
}

// ── Addresses ────────────────────────────────────────────────────────────────
/** '/codex/<book>/<page>?at=<heading>&q=<search words>' */
export function bookHref(book: string, page?: string | null, { at, q, search }: { at?: string | null; q?: string | null; search?: string | null } = {}) {
  const qs = new URLSearchParams();
  if (at) qs.set('at', at);
  if (q) qs.set('q', q);
  if (search) qs.set('search', search);
  const tail = qs.toString();
  return `/codex/${book}${page ? `/${page}` : ''}${tail ? `?${tail}` : ''}`;
}

// ── The library ──────────────────────────────────────────────────────────────
export async function loadLibrary(signedIn: boolean): Promise<BookMeta[]> {
  const { books } = await api<{ books: BookMeta[] }>('GET', '/books', undefined, { group: null });
  // Signed out: "continue reading" comes from this browser.
  if (!signedIn) for (const b of books) b.progress = localProgress()[b.id] ?? null;
  return books;
}

export interface LibraryHit { id: string; title: string; abbr: string; total: number; results: SearchResult[] }
/** Searches every book: the rulebooks on the server, Arcane Compositry here. */
export async function searchLibrary(q: string, titleOf: (id: string) => string): Promise<LibraryHit[]> {
  const [remote, local] = await Promise.all([
    api<{ books: LibraryHit[] }>('GET', `/books/search?q=${encodeURIComponent(q)}`, undefined, { group: null }),
    openBook(BUILT_IN).then((src) => src.search(q)).catch(() => ({ total: 0, results: [] })),
  ]);
  const ac = local.total ? [{ id: BUILT_IN, title: titleOf(BUILT_IN), abbr: 'AC', total: local.total, results: local.results.slice(0, 6) }] : [];
  return [...ac, ...remote.books];
}

// ── Opening a book ───────────────────────────────────────────────────────────
const sources = new Map<string, Promise<BookSource>>();

/** The book as a source. Kept for the visit, so moving between pages is quick. */
export function openBook(id: string): Promise<BookSource> {
  let source = sources.get(id);
  if (!source) {
    source = id === BUILT_IN ? builtInSource() : remoteSource(id);
    sources.set(id, source);
    source.catch(() => sources.delete(id));
  }
  return source;
}

async function remoteSource(id: string): Promise<BookSource> {
  const path = `/books/${encodeURIComponent(id)}`;
  const { book, toc, pages } = await api<{ book: BookMeta; toc: TocNode[]; pages: PageRef[] }>('GET', path, undefined, { group: null });
  const cache = new Map<string, Promise<BookPage | null>>();
  return {
    meta: book, toc, pages, builtIn: false,
    getPage(pageId) {
      let page = cache.get(pageId);
      if (!page) {
        page = api<{ page: BookPage }>('GET', `${path}/pages/${encodeURIComponent(pageId)}`, undefined, { group: null }).then((r) => r.page);
        cache.set(pageId, page);
        page.catch(() => cache.delete(pageId));
      }
      return page.catch(() => null);
    },
    search: (q) => api<SearchResults>('GET', `${path}/search?q=${encodeURIComponent(q)}`, undefined, { group: null }),
  };
}

// ── Arcane Compositry (built in) ─────────────────────────────────────────────
interface Chapter { id: string; section: string; kicker: string; title: string; page: number; num?: string; html: string }
interface Section { id: string; title: string }
const chapters = CHAPTERS as Chapter[];
const sections = SECTIONS as Section[];
const shortTitle = (c: Chapter) => c.title.split(':')[0];
const sectionTitle = (c: Chapter) => sections.find((s) => s.id === c.section)?.title ?? '';

/** A chapter's HTML, parsed once, with ids on its headings - the same ids the reader gives them. */
const parsed = new Map<string, DocumentFragment>();
function chapterDom(c: Chapter) {
  let dom = parsed.get(c.id);
  if (!dom) {
    const tpl = document.createElement('template');
    tpl.innerHTML = c.html;
    assignIds(tpl.content);
    dom = tpl.content;
    parsed.set(c.id, dom);
  }
  return dom;
}

async function builtInSource(): Promise<BookSource> {
  const books = await api<{ books: BookMeta[] }>('GET', '/books', undefined, { group: null }).then((r) => r.books).catch(() => []);
  const pages: PageRef[] = [
    { id: 'overview', title: 'Overview', label: 'Overview', part: '' },
    ...chapters.map((c) => ({ id: c.id, title: c.title, label: shortTitle(c), part: sectionTitle(c) })),
  ];
  const meta: BookMeta = {
    ...(books.find((b) => b.id === BUILT_IN) ?? {
      id: BUILT_IN, title: "Arcane Compositry: Player's Field Codex", abbr: 'AC', kind: 'Expansion', year: null, description: '', builtIn: true, chapters: null,
    }),
    pages: pages.length,
  };
  const toc: TocNode[] = [
    { id: 'overview', title: 'Overview', page: 'overview', anchor: '' },
    ...sections.map((s) => ({
      id: `section-${s.id}`, title: s.title, anchor: '', page: chapters.find((c) => c.section === s.id)?.id ?? 'overview',
      children: chapters.filter((c) => c.section === s.id).map((c) => {
        const heads = [...chapterDom(c).querySelectorAll('h2[id]')].map((h) => ({ id: `${c.id}--${h.id}`, anchor: h.id, title: h.textContent!.trim(), page: c.id }));
        return { id: c.id, title: c.title, page: c.id, anchor: '', ...(heads.length ? { children: heads } : {}) };
      }),
    })),
  ];
  return {
    meta, toc, pages, builtIn: true,
    async getPage(id) {
      if (id === 'overview') return { id, title: 'Arcane Compositry', anchor: '', trail: [], kicker: 'Playtest Reference Manual', html: coverHtml(), sections: [] };
      const c = chapters.find((x) => x.id === id);
      if (!c) return null;
      return { id, title: c.title, anchor: '', trail: [{ title: sectionTitle(c), page: id, anchor: '' }], kicker: c.kicker, num: c.num, html: c.html, sections: [] };
    },
    async search(q) {
      const terms = searchTerms(q);
      if (!terms.length) return { total: 0, results: [] };
      const phrase = terms.join(' ');
      const hits: (SearchResult & { rank: number })[] = [];
      for (const c of chapters) {
        if (terms.every((t) => fold(c.title).includes(t))) hits.push({ rank: 1, kind: 'heading', page: c.id, pageTitle: c.title, anchor: '', heading: c.title, snippet: '' });
        let heading = { id: '', text: c.title };
        for (const el of chapterDom(c).querySelectorAll('h2, h3, h4, p, li, tr, .formula, .callout')) {
          if (/^H[234]$/.test(el.tagName)) {
            heading = { id: el.id, text: el.textContent!.trim() };
            if (terms.every((t) => fold(heading.text).includes(t))) hits.push({ rank: 2, kind: 'heading', page: c.id, pageTitle: c.title, anchor: el.id, heading: heading.text, snippet: '' });
            continue;
          }
          if (el.matches('li') && el.querySelector('p, h4')) continue; // its paragraphs are checked on their own
          const text = el.textContent!.replace(/\s+/g, ' ').trim();
          const lower = fold(text);
          if (text && terms.every((t) => lower.includes(t))) {
            hits.push({ rank: lower.includes(phrase) ? 3 : 4, kind: 'text', page: c.id, pageTitle: c.title, anchor: heading.id, heading: heading.text, snippet: snippet(text, lower, terms, phrase) });
          }
        }
      }
      hits.sort((a, b) => a.rank - b.rank);
      return { total: hits.length, results: hits.slice(0, 200) };
    },
  };
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

/** The Arcane Compositry cover page, as rules HTML (shown like any other page). */
function coverHtml() {
  return `
    <p class="lead">Player's Field Codex</p>
    <p class="lead">A fast-reference guide to improvised magic, Tendril circuitry, Catalysts, Applied Thaumaturgy, Counter-Compositry, and the combat systems that make magic an active exchange.</p>
    <div class="callout"><b>Core idea:</b> Choose what the magic is made of, choose what it does, choose how it manifests, choose how hard you push it - then pay the Mana.</div>
    <div class="dark-box"><p class="kicker">Designed for table use - rules first, lore second, quick reference last</p>
      <p>Use Section I while building or resolving a Composition. Use Section II when Tendrils, counters, discoveries, or combat interaction matter.</p></div>
    <div class="note-box"><h4>At the table</h4>
      <p><b>Players:</b> Section I (Quick Start through Circuit Stability) covers Arcane construction; Attack Chains through Launch &amp; Smash explain Attack Chains, active defense, and Momentum Dice. The last two chapters are table references.</p></div>
    ${sections.map((s) => `
      <h2>${escapeHtml(s.title)}</h2>
      <div class="grid cols-auto">
        ${chapters.filter((c) => c.section === s.id).map((c) => `
          <a class="card" href="${bookHref(BUILT_IN, c.id)}"><p class="kicker">${escapeHtml(c.kicker)}</p><h3>${escapeHtml(c.title)}</h3><span class="small muted">Codex page ${c.page}</span></a>`).join('')}
      </div>`).join('')}`;
}

// ── Headings and search helpers ──────────────────────────────────────────────
export const slugify = (s: string) =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'section';

/**
 * Gives every h2-h4 without an id one made from its text (unique on the page).
 * Small in-box headings (.minor) and anything inside a live calculator are skipped.
 */
export function assignIds(root: ParentNode) {
  const used = new Set([...root.querySelectorAll('[id]')].map((el) => el.id));
  for (const h of root.querySelectorAll<HTMLElement>('h2:not([id]), h3:not([id]), h4:not([id]):not(.minor)')) {
    if (h.closest('[data-calc]')) continue;
    const base = slugify(h.textContent ?? '');
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    h.id = id;
  }
}

/** Lower case with straight quotes and dashes - the same folding the server uses. */
export const fold = (s: string) => String(s).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-');
export const searchTerms = (q: string | null | undefined) => fold(String(q || '').slice(0, 120)).split(/\s+/).filter(Boolean).slice(0, 8);

function snippet(text: string, lower: string, terms: string[], phrase: string) {
  let at = lower.indexOf(phrase);
  if (at < 0) at = lower.indexOf(terms[0]);
  const start = Math.max(0, at - 70);
  const end = Math.min(text.length, at + 170);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/** A regular expression that finds any of the search words, ignoring case and curly/straight quotes. */
export function termsRegex(terms: string[]) {
  const parts = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\u2018\u2019]").replace(/"/g, '["\u201c\u201d]').replace(/-/g, '[-\u2013\u2014]'));
  return parts.length ? new RegExp(`(${parts.join('|')})`, 'gi') : null;
}

// ── Bookmarks (signed in only) ───────────────────────────────────────────────
export const loadBookmarks = async (book?: string) =>
  (await api<{ bookmarks: Bookmark[] }>('GET', `/bookmarks${book ? `?book=${encodeURIComponent(book)}` : ''}`, undefined, { group: null })).bookmarks;
export const addBookmark = async (b: Omit<Bookmark, 'id' | 'note' | 'createdAt'>) =>
  (await api<{ bookmark: Bookmark }>('POST', '/bookmarks', b, { group: null })).bookmark;
export const updateBookmark = async (id: string, changes: { title?: string; note?: string }) =>
  (await api<{ bookmark: Bookmark }>('PUT', `/bookmarks/${id}`, changes, { group: null })).bookmark;
export const removeBookmark = (id: string) => api('DELETE', `/bookmarks/${id}`, undefined, { group: null });

// ── Reading progress ─────────────────────────────────────────────────────────
const PROGRESS_KEY = 'ac-reading';
function localProgress(): Record<string, Progress> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '') || {}; } catch { return {}; }
}

/** Remembers where you are in a book: on your account when signed in, else in this browser. */
export async function saveProgress(book: string, spot: Progress, signedIn: boolean) {
  if (signedIn) return api('PUT', `/reading/${encodeURIComponent(book)}`, spot, { group: null }).catch(() => {});
  try {
    const all = localProgress();
    all[book] = { ...spot, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch { /* private mode: ignore */ }
}
