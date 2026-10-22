/**
 * components/codex/reader.tsx - reading one Codex book (/codex/<book>/<page>).
 *
 * The screen: the book's contents and your bookmarks on the left (a slide-in
 * panel on phones), a toolbar (search, chapter list, text size, bookmark), the
 * page, and previous / next. Data comes from lib/books.ts.
 *
 * Address options (after the ?):
 *   at=<heading id>   scroll to that heading
 *   q=<words>         highlight those words on the page (opened from a search result)
 *   search=<words>    open the search box with those words
 *
 * Keys: / or Ctrl+K search · ← → previous / next page · b bookmark this page
 *       n / Shift+N next / previous highlighted word
 *
 * The page text is rules HTML shown with <RichHtml> (so Arcane Compositry's
 * live calculators work). After it is in the page, the reader adds heading ids,
 * a bookmark button beside each heading, and the search highlights.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, ArrowUp, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight, List, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NativeSelect } from '@/components/fields';
import { RichHtml } from '@/components/rich-html';
import { Empty, ErrorState, Loading } from '@/components/page';
import { Kbd, SidePanel } from '@/components/codex/side-panel';
import { SearchDialog } from '@/components/codex/search-dialog';
import {
  addBookmark, assignIds, bookHref, loadBookmarks, openBook, removeBookmark, saveProgress, searchTerms, termsRegex,
  type BookPage, type BookSource, type Bookmark, type PageRef,
} from '@/lib/books';
import { ApiError, errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

const SIZE_KEY = 'ac-reader-size';
const savedSize = () => { try { return Math.min(5, Math.max(1, Number(localStorage.getItem(SIZE_KEY)) || 3)); } catch { return 3; } };

/** Loads the book, the page and your bookmarks, then shows the reader. */
export function Reader({ bookId, pageId }: { bookId: string; pageId?: string }) {
  const { user, loaded } = useSession();
  const [params] = useSearchParams();
  const [src, setSrc] = useState<BookSource | null>(null);
  const [failed, setFailed] = useState<{ message: string; missing: boolean } | null>(null);
  const [page, setPage] = useState<BookPage | null | undefined>(undefined); // undefined = loading, null = not found
  const [marks, setMarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    let live = true;
    openBook(bookId).then((s) => { if (live) setSrc(s); })
      .catch((err) => { if (live) setFailed({ message: errorMessage(err), missing: err instanceof ApiError && err.status === 404 }); });
    return () => { live = false; };
  }, [bookId]);

  useEffect(() => {
    if (!src || !pageId) return;
    let live = true;
    setPage(undefined);
    src.getPage(pageId).then((p) => { if (live) setPage(p); });
    return () => { live = false; };
  }, [src, pageId]);

  useEffect(() => {
    if (!loaded) return;
    if (!user) { setMarks([]); return; }
    let live = true;
    loadBookmarks(bookId).then((m) => { if (live) setMarks(m); }).catch(() => { if (live) setMarks([]); });
    return () => { live = false; };
  }, [loaded, user?.id, bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) {
    return failed.missing
      ? <Empty title="That book is not in the library" action={<Button asChild><Link to="/codex"><ArrowLeft />Back to the library</Link></Button>}>{failed.message}</Empty>
      : <ErrorState message={failed.message} onRetry={() => location.reload()} />;
  }
  if (!src) return <Loading label="Opening the book..." />;
  if (!pageId) return <Navigate replace to={bookHref(bookId, src.pages[0]?.id, { search: params.get('search') })} />;
  if (page === undefined) return <Loading label="Opening the page..." />;
  if (!page) {
    return (
      <Empty title="Page not found" action={<Button asChild><Link to={bookHref(bookId, src.pages[0]?.id)}>Go to the start of the book</Link></Button>}>
        This book has no page called "{pageId}". It may have moved.
      </Empty>
    );
  }
  return <ReaderView key={page.id} src={src} page={page} marks={marks} setMarks={setMarks} />;
}

interface Head { id: string; title: string; level: number; box: boolean }

function ReaderView({ src, page, marks, setMarks }: {
  src: BookSource; page: BookPage; marks: Bookmark[]; setMarks: React.Dispatch<React.SetStateAction<Bookmark[]>>;
}) {
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const bookId = src.meta.id;
  const at = params.get('at');
  const q = params.get('q');

  const index = src.pages.findIndex((p) => p.id === page.id);
  const prev = src.pages[index - 1];
  const next = src.pages[index + 1];

  const textRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [heads, setHeads] = useState<Head[]>([]);
  const [size, setSize] = useState(savedSize);
  const [sideOpen, setSideOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(params.get('search') != null);
  const [searchText, setSearchText] = useState(params.get('search') ?? q ?? '');
  const [hits, setHits] = useState<HTMLElement[]>([]);
  const [hitAt, setHitAt] = useState(-1);
  const [showTop, setShowTop] = useState(false);

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const findMark = (anchor: string) => marks.find((m) => m.page === page.id && (m.anchor || '') === anchor);
  const pageMarked = !!findMark('');
  const toggleMark = async (anchor: string, title: string) => {
    if (!user) { toast.error('Sign in to bookmark pages - bookmarks are saved to your account.'); return; }
    const existing = findMark(anchor);
    try {
      if (existing) {
        await removeBookmark(existing.id);
        setMarks((all) => all.filter((m) => m.id !== existing.id));
        toast('Bookmark removed.');
      } else {
        const context = [src.meta.abbr, ...page.trail.map((t) => t.title), anchor ? page.title : ''].filter(Boolean).join(' › ');
        const added = await addBookmark({ book: bookId, page: page.id, anchor, title, context });
        setMarks((all) => [added, ...all]);
        toast.success(`Bookmarked "${title}".`);
      }
    } catch (err) { toast.error(errorMessage(err)); }
  };

  // ── After the text is in the page: heading ids, "On this page", bookmark buttons ─
  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return;
    assignIds(text);
    const found = [...text.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]:not(.minor)')].filter((h) => !h.closest('[data-calc]'));
    setHeads(found.map((h) => ({ id: h.id, title: h.textContent!.trim(), level: Number(h.tagName[1]), box: h.classList.contains('box-title') })));
    for (const h of found) {
      h.dataset.title = h.textContent!.trim();
      h.classList.add('hd');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hd-mark';
      b.dataset.anchor = h.id;
      b.setAttribute('aria-label', `Bookmark ${h.dataset.title}`);
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
      h.append(b);
    }
  }, []);

  useEffect(() => {
    for (const b of textRef.current?.querySelectorAll<HTMLElement>('.hd-mark') ?? []) {
      const on = !!findMark(b.dataset.anchor!);
      b.classList.toggle('is-marked', on);
      b.title = on ? 'Remove bookmark' : 'Bookmark this section';
    }
  }, [marks]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Highlighted search words (?q=) ─────────────────────────────────────────
  useLayoutEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    const found = highlight(article, searchTerms(q));
    setHits(found);
    setHitAt(-1);
    return () => {
      for (const m of found) m.replaceWith(document.createTextNode(m.textContent ?? ''));
      article.normalize();
    };
  }, [q]);

  const showHit = (i: number) => {
    if (!hits.length) return;
    const n = (i + hits.length) % hits.length;
    hits.forEach((m, j) => m.classList.toggle('current', j === n));
    hits[n].scrollIntoView({ block: 'center' });
    setHitAt(n);
  };
  const clearHits = () => setParams((p) => { p.delete('q'); return p; }, { replace: true });

  // ── Where to start: a highlighted word (after the heading asked for), the heading, or the top ─
  const goTo = (anchor: string | null) => {
    const el = anchor ? textRef.current?.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`) : null;
    if (!el) return false;
    el.scrollIntoView({ block: 'start' });
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
    return true;
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hits.length) {
        const anchorEl = at ? textRef.current?.querySelector(`#${CSS.escape(at)}`) : null;
        const first = anchorEl ? hits.findIndex((m) => anchorEl.contains(m) || anchorEl.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING) : 0;
        showHit(Math.max(0, first));
      } else {
        goTo(at);
      }
    });
    return () => clearTimeout(timer);
  }, [location.key, hits]); // eslint-disable-line react-hooks/exhaustive-deps

  // ?search= opens the search box once; then it leaves the address.
  useEffect(() => {
    if (params.get('search') != null) setParams((p) => { p.delete('search'); return p; }, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reading bar, back-to-top, remembering where you are ────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const remember = () => {
      let h: HTMLElement | null = null;
      for (const el of textRef.current?.querySelectorAll<HTMLElement>('.hd') ?? []) {
        if (el.getBoundingClientRect().top < 160) h = el; else break;
      }
      void saveProgress(bookId, { page: page.id, anchor: h?.id ?? '', title: h ? `${page.title} › ${h.dataset.title}` : page.title }, !!user);
    };
    const onScroll = () => {
      // How far down the page you are: full width exactly when you cannot scroll any further.
      const room = document.documentElement.scrollHeight - innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${room <= 1 ? 1 : Math.min(1, Math.max(0, scrollY / room))})`;
      setShowTop(scrollY > 900);
      clearTimeout(timer);
      timer = setTimeout(remember, 1500);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { removeEventListener('scroll', onScroll); clearTimeout(timer); remember(); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keys ───────────────────────────────────────────────────────────────────
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || searchOpen || sideOpen || document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
    if ((e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable="true"], .table-wrap')) return;
    if (e.key === '/') { e.preventDefault(); setSearchOpen(true); }
    else if (e.key === 'ArrowLeft' && prev) navigate(bookHref(bookId, prev.id));
    else if (e.key === 'ArrowRight' && next) navigate(bookHref(bookId, next.id));
    else if (e.key === 'b') void toggleMark('', page.title);
    else if (e.key === 'n' && hits.length) showHit(hitAt + 1);
    else if (e.key === 'N' && hits.length) showHit(hitAt - 1);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current(e);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const changeSize = (by: number) => {
    const n = Math.min(5, Math.max(1, size + by));
    setSize(n);
    try { localStorage.setItem(SIZE_KEY, String(n)); } catch { /* private mode */ }
  };

  const side = <SidePanel src={src} page={page} marks={marks} setMarks={setMarks} className="min-h-0 flex-1" />;
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
      <Card className="sticky top-22 hidden max-h-[calc(100dvh-7rem)] gap-0 p-3 lg:flex">
        <div className="mb-3 grid shrink-0 gap-0.5 px-1">
          <Link to="/codex" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />Library</Link>
          <Link to={bookHref(bookId, src.pages[0]?.id)} className="font-serif text-lg leading-snug font-bold">{src.meta.title}</Link>
        </div>
        {side}
      </Card>

      <div className="min-w-0">
        <div className="sticky top-16 z-30 -mx-1 flex flex-wrap items-center gap-2 border-b bg-background/90 px-1 py-2.5 backdrop-blur-md max-sm:static">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setSideOpen(true)} aria-label="Contents and bookmarks"><List /></Button>
          <form role="search" className="relative min-w-40 flex-1" onSubmit={(e) => { e.preventDefault(); setSearchOpen(true); }}>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search this book" aria-label={`Search ${src.meta.title}`} autoComplete="off" className="bg-card pl-9" />
            <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 lg:block"><Kbd>/</Kbd></span>
          </form>
          <NativeSelect aria-label="Go to chapter" value={page.id} onChange={(e) => navigate(bookHref(bookId, e.target.value))} className="w-auto max-w-72 basis-72 max-sm:order-last max-sm:max-w-none max-sm:basis-full">
            <ChapterOptions pages={src.pages} />
          </NativeSelect>
          <div className="tab-tray" role="group" aria-label="Text size">
            <button type="button" className="tab-pill" onClick={() => changeSize(-1)} aria-label="Smaller text">A−</button>
            <button type="button" className="tab-pill" onClick={() => changeSize(1)} aria-label="Larger text">A+</button>
          </div>
          <Button variant="outline" aria-pressed={pageMarked} onClick={() => toggleMark('', page.title)}
            className={cn(pageMarked && 'border-gold-line bg-gold-soft text-gold-ink hover:bg-gold-soft')}>
            <BookmarkIcon className={cn(pageMarked && 'fill-current')} /><span className="max-sm:sr-only">{pageMarked ? 'Bookmarked' : 'Bookmark'}</span>
          </Button>
        </div>

        {q && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold-line bg-gold-soft px-3 py-1.5 text-sm">
            <span className="flex flex-wrap items-center gap-1.5">
              <Search className="size-4" /><b>{hits.length}</b> match{hits.length === 1 ? '' : 'es'} on this page for “{q}”
              {hits.length > 0 && hitAt >= 0 && <span className="text-muted-foreground">· {hitAt + 1} of {hits.length}</span>}
            </span>
            <span className="flex gap-1">
              {hits.length > 0 && <>
                <Button size="icon-sm" variant="outline" onClick={() => showHit(hitAt - 1)} aria-label="Previous match"><ChevronLeft /></Button>
                <Button size="icon-sm" variant="outline" onClick={() => showHit(hitAt + 1)} aria-label="Next match"><ChevronRight /></Button>
              </>}
              <Button size="sm" variant="outline" onClick={() => { setSearchText(q); setSearchOpen(true); }}>All results</Button>
              <Button size="icon-sm" variant="ghost" onClick={clearHits} aria-label="Clear highlights"><X /></Button>
            </span>
          </div>
        )}

        <article ref={articleRef} className="relative pt-6">
          {page.num && <span className="pointer-events-none absolute top-2 right-0 font-serif text-7xl font-bold text-gold/15 select-none sm:text-8xl" aria-hidden>{page.num}</span>}
          <p className="kicker mb-1">{page.kicker || page.trail.map((t) => t.title).join(' › ') || src.meta.title}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{src.meta.abbr} · page {index + 1} of {src.pages.length}</p>
          <hr className="rule-gold mt-3 mb-6 max-w-md" />

          {heads.length >= 2 && (
            <details open={heads.length <= 14} className="surface group mb-6">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                <List className="size-4 text-gold-ink" />On this page
                <span className="rounded border px-1.5 text-xs text-muted-foreground">{heads.length}</span>
                <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <ul className="columns-[220px] gap-6 px-4 pb-3 text-[0.93rem]">
                {heads.map((h) => (
                  <li key={h.id} className={cn('break-inside-avoid', h.level === 3 && 'pl-3', h.level === 4 && 'pl-6 text-sm')}>
                    <Link to={bookHref(bookId, page.id, { at: h.id })} replace className="block py-0.5 text-primary hover:underline">
                      {h.box && <span className="text-gold" aria-hidden>◆ </span>}{h.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div ref={textRef} onClick={(e) => {
            const b = (e.target as HTMLElement).closest<HTMLElement>('.hd-mark');
            if (b) void toggleMark(b.dataset.anchor!, b.closest<HTMLElement>('.hd')!.dataset.title!);
          }}>
            <RichHtml html={page.html} className={`book-text fs-${size}`} />
          </div>

          {page.sections.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-2xl font-bold">In this chapter</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {page.sections.map((s) => (
                  <Link key={s.anchor} to={bookHref(bookId, s.page, { at: s.page === s.anchor ? '' : s.anchor })} className="surface p-4 transition-colors hover:border-primary">
                    <h3 className="font-semibold">{s.title}</h3>
                    <span className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">Read<ChevronRight className="size-4" /></span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <nav aria-label="Pages" className="mt-10 grid gap-3 sm:grid-cols-2">
          {prev ? <PagerLink book={bookId} page={prev} dir="prev" /> : <span />}
          {next ? <PagerLink book={bookId} page={next} dir="next" /> : <span />}
        </nav>
      </div>

      <Sheet open={sideOpen} onOpenChange={setSideOpen}>
        <SheetContent side="left" className="flex w-[min(360px,92vw)] flex-col gap-0 p-4">
          <SheetHeader className="p-0 pb-3"><SheetTitle className="pr-6 font-serif">{src.meta.title}</SheetTitle></SheetHeader>
          <SidePanel src={src} page={page} marks={marks} setMarks={setMarks} onNavigate={() => setSideOpen(false)} className="flex-1" />
        </SheetContent>
      </Sheet>

      <SearchDialog src={src} open={searchOpen} initial={searchText} onClose={() => setSearchOpen(false)} />

      {createPortal(<>
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 h-[3px]" aria-hidden>
          <span ref={barRef} className="block h-full origin-left bg-gold" style={{ transform: 'scaleX(0)' }} />
        </div>
        {showTop && (
          <Button size="icon" className="fixed right-5 bottom-20 z-40 rounded-full shadow-lg xl:bottom-6" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
            <ArrowUp />
          </Button>
        )}
      </>, document.body)}
    </div>
  );
}

function PagerLink({ book, page, dir }: { book: string; page: PageRef; dir: 'prev' | 'next' }) {
  return (
    <Link to={bookHref(book, page.id)} className={cn('surface flex items-center gap-3 p-4 transition-colors hover:border-primary', dir === 'next' && 'justify-end text-right')}>
      {dir === 'prev' && <ArrowLeft className="size-5 shrink-0 text-muted-foreground" />}
      <span className="min-w-0"><span className="kicker block">{dir === 'prev' ? 'Previous' : 'Next'}</span><span className="font-serif font-semibold">{page.label || page.title}</span></span>
      {dir === 'next' && <ArrowRight className="size-5 shrink-0 text-muted-foreground" />}
    </Link>
  );
}

/** The chapter list: every page, grouped under its part of the book. */
function ChapterOptions({ pages }: { pages: PageRef[] }) {
  const groups: { part: string; pages: PageRef[] }[] = [];
  for (const p of pages) {
    if (!groups.length || groups.at(-1)!.part !== p.part) groups.push({ part: p.part, pages: [] });
    groups.at(-1)!.pages.push(p);
  }
  return <>{groups.map((g, i) => {
    const options = g.pages.map((p) => <option key={p.id} value={p.id}>{p.label || p.title}</option>);
    return g.part ? <optgroup key={i} label={g.part}>{options}</optgroup> : options;
  })}</>;
}

/** Wraps every search word in the page's text in <mark class="hit">, and returns the marks in order. */
function highlight(root: HTMLElement, terms: string[]): HTMLElement[] {
  const re = termsRegex(terms);
  if (!re) return [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue?.trim() && !n.parentElement?.closest('button, details, [data-calc], .kicker') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const marks: HTMLElement[] = [];
  for (const node of nodes) {
    const value = node.nodeValue!;
    re.lastIndex = 0;
    if (!re.test(value)) continue;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(value))) {
      if (m.index > last) frag.append(value.slice(last, m.index));
      const mark = document.createElement('mark');
      mark.className = 'hit';
      mark.textContent = m[0];
      frag.append(mark);
      marks.push(mark);
      last = m.index + m[0].length;
    }
    frag.append(value.slice(last));
    node.replaceWith(frag);
  }
  return marks;
}
