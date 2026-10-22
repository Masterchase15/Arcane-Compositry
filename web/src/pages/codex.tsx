/**
 * pages/codex.tsx - the Codex library and the way into each book.
 *
 *   /codex                          the library: every book, search, your bookmarks
 *   /codex/<book>                   a book's first page
 *   /codex/<book>/<page>?at=<id>    reading a book (components/codex/reader.tsx), at a heading
 *
 * The list of books is data/books/index.js; books, bookmarks and reading
 * progress are loaded through lib/books.ts. Old addresses of the Arcane
 * Compositry codex (/codex/<chapter>) still work.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Bookmark as BookmarkIcon, BookOpen, ChevronRight, LibraryBig, Search } from 'lucide-react';
import { CHAPTERS } from '@shared/rules/codex-content.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/list';
import { Empty, ErrorState, Loading, PageHead } from '@/components/page';
import { BookBadge, ResultList, toneOf } from '@/components/codex/bits';
import { Reader } from '@/components/codex/reader';
import { BUILT_IN, bookHref, loadBookmarks, loadLibrary, searchLibrary, searchTerms, type BookMeta, type Bookmark, type LibraryHit } from '@/lib/books';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function Codex() {
  const { book, page } = useParams();
  if (!book) return <Library />;
  // An old link straight to an Arcane Compositry chapter: /codex/quick-start
  if (!page && (CHAPTERS as { id: string }[]).some((c) => c.id === book)) return <Navigate replace to={bookHref(BUILT_IN, book)} />;
  return <Reader bookId={book} pageId={page} />;
}

// ── The library ──────────────────────────────────────────────────────────────
function Library() {
  const { user, loaded } = useSession();
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [marks, setMarks] = useState<Bookmark[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    loadLibrary(!!user).then(setBooks).catch((err) => setError(errorMessage(err)));
    if (user) loadBookmarks().then(setMarks).catch(() => setMarks([]));
    else setMarks([]);
  };
  useEffect(() => { if (loaded) load(); }, [loaded, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ids = useMemo(() => (books ?? []).map((b) => b.id), [books]);
  const byId = useMemo(() => new Map((books ?? []).map((b) => [b.id, b])), [books]);

  return (
    <>
      <PageHead kicker="Codex" title="The Library">
        Every rulebook in one place. Open a book to read it chapter by chapter, search it, and bookmark the pages you keep coming back to.
      </PageHead>

      <LibrarySearch ids={ids} titleOf={(id) => byId.get(id)?.title ?? id} />

      {error ? <ErrorState message={error} onRetry={load} /> : !books ? <Loading label="Opening the library..." /> : <>
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2.5 text-2xl font-bold"><LibraryBig className="size-6 text-gold-ink" />Books</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {books.map((b) => <BookCard key={b.id} book={b} tone={toneOf(ids, b.id)} />)}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2.5 text-2xl font-bold"><BookmarkIcon className="size-6 text-gold-ink" />Your bookmarks</h2>
          {!user ? (
            <Empty icon={<BookmarkIcon />} title="Sign in to bookmark pages"
              action={<Button asChild><Link to="/account?next=/codex">Sign in</Link></Button>}>
              Your bookmarks are saved to your account, so they are there on any device.
            </Empty>
          ) : marks.length ? (
            <>
              <div className="grid gap-2.5 md:grid-cols-2">
                {marks.slice(0, 12).map((m) => (
                  <Link key={m.id} to={bookHref(m.book, m.page, { at: m.anchor })} className="surface flex items-start gap-3 p-3 transition-colors hover:border-primary">
                    <BookBadge small abbr={byId.get(m.book)?.abbr ?? '?'} tone={toneOf(ids, m.book)} className="mt-0.5" />
                    <span className="grid min-w-0 gap-0.5">
                      <b className="font-serif">{m.title}</b>
                      <span className="text-sm text-muted-foreground">{m.context || byId.get(m.book)?.title}</span>
                      {m.note && <span className="mt-1 border-l-2 border-gold-line pl-2 text-sm whitespace-pre-wrap text-muted-foreground italic">{m.note}</span>}
                    </span>
                  </Link>
                ))}
              </div>
              {marks.length > 12 && <p className="mt-3 text-sm text-muted-foreground">Showing your 12 newest of {marks.length}. Open a book to see all of its bookmarks.</p>}
            </>
          ) : (
            <Empty icon={<BookmarkIcon />} title="No bookmarks yet">Open a book and press the bookmark button on any page or heading.</Empty>
          )}
        </section>
      </>}
    </>
  );
}

function BookCard({ book: b, tone }: { book: BookMeta; tone: number }) {
  const stats = [b.pages ? `${b.pages} pages` : '', b.chapters ? `${b.chapters} chapters` : ''].filter(Boolean).join(' · ');
  return (
    <Card className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)]">
      <Link to={bookHref(b.id)} data-tone={tone} aria-label={`Open ${b.title}`}
        className="book-cover relative flex aspect-[3/4] flex-col justify-between rounded-[3px_8px_8px_3px] py-3 pr-2.5 pl-4 text-[#f4f1e4] shadow-md transition-transform hover:-translate-y-1 hover:-rotate-1">
        <span className="font-serif text-2xl font-bold tracking-wide text-[#ecd98f]">{b.abbr}</span>
        <span className="hidden font-serif text-xs leading-snug font-semibold sm:block">{b.title}</span>
      </Link>
      <div className="min-w-0">
        <p className="kicker">{[b.kind, b.year].filter(Boolean).join(' · ')}</p>
        <h3 className="mt-1 text-lg leading-snug font-bold"><Link to={bookHref(b.id)} className="hover:text-primary">{b.title}</Link></h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{b.description}</p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {stats}
          {!!b.bookmarks && <span className="inline-flex items-center gap-1">· <BookmarkIcon className="size-3.5 fill-current text-gold-ink" />{b.bookmarks}</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm"><Link to={bookHref(b.id)}><BookOpen />Open</Link></Button>
          {b.progress && (
            <Button asChild size="sm" variant="outline" title={b.progress.title}>
              <Link to={bookHref(b.id, b.progress.page, { at: b.progress.anchor })}>Continue</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Search every book at once. */
function LibrarySearch({ ids, titleOf }: { ids: string[]; titleOf: (id: string) => string }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<LibraryHit[] | null>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');

  useEffect(() => {
    const words = q.trim();
    if (words.length < 2) { setHits(null); setState('idle'); return; }
    let live = true;
    setState('busy');
    const timer = setTimeout(() => {
      searchLibrary(words, titleOf)
        .then((found) => { if (live) { setHits(found); setState('idle'); } })
        .catch(() => { if (live) setState('error'); });
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const terms = searchTerms(q);
  return (
    <div role="search">
      <SearchInput value={q} onChange={setQ} placeholder="Search every book - a spell, a monster, a rule..." label="Search every book" />
      <div aria-live="polite" className="mt-3">
        {state === 'busy' && !hits && <p className="text-sm text-muted-foreground">Searching...</p>}
        {state === 'error' && <p className="text-sm font-semibold text-destructive">The search did not work. Try again.</p>}
        {hits && (hits.length ? (
          <div className="grid gap-3">
            {hits.map((g) => (
              <section key={g.id} className="surface p-3 sm:p-4">
                <header className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2.5 text-lg font-bold"><BookBadge small abbr={g.abbr} tone={toneOf(ids, g.id)} />{g.title}</h3>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={bookHref(g.id, null, { search: q.trim() })}>All {g.total} result{g.total === 1 ? '' : 's'}<ChevronRight /></Link>
                  </Button>
                </header>
                <ResultList bookId={g.id} results={g.results} q={q.trim()} terms={terms} />
              </section>
            ))}
          </div>
        ) : <Empty icon={<Search />} title="Nothing found">No book mentions "{q.trim()}".</Empty>)}
      </div>
    </div>
  );
}
