/**
 * components/codex/bits.tsx - small pieces the Codex library and reader share:
 * a book's coloured badge, text with the search words highlighted, and a list
 * of search results.
 */
import { Link } from 'react-router';
import { bookHref, termsRegex, type SearchResult } from '@/lib/books';
import { cn } from '@/lib/utils';

/** Each book keeps the same colour everywhere: its place in data/books/index.js (see index.css, [data-tone]). */
export const toneOf = (ids: string[], id: string) => Math.max(0, ids.indexOf(id)) % 6;

export function BookBadge({ abbr, tone, small, className }: { abbr: string; tone: number; small?: boolean; className?: string }) {
  return (
    <span data-tone={tone} aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-md bg-[var(--tone)] px-1.5 font-serif font-bold tracking-wide text-[#ecd98f]',
        small ? 'h-6 min-w-8 text-[0.68rem]' : 'h-10 min-w-10 text-sm', className)}>
      {abbr}
    </span>
  );
}

/** Text with every search word wrapped in <mark>. */
export function Marked({ text, terms }: { text: string; terms: string[] }) {
  const re = termsRegex(terms);
  if (!re) return <>{text}</>;
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
}

/** Search results as links. Used by the library and by the reader's search box. */
export function ResultList({ bookId, results, q, terms, onPick }: {
  bookId: string; results: SearchResult[]; q: string; terms: string[]; onPick?: () => void;
}) {
  return (
    <ul className="divide-y">
      {results.map((r, i) => (
        <li key={i}>
          <Link to={bookHref(bookId, r.page, { at: r.anchor, q })} onClick={onPick} className="block rounded-md px-2 py-2.5 hover:bg-muted">
            {r.kind === 'heading' ? (
              <><b className="font-semibold"><Marked text={r.heading} terms={terms} /></b>
                {r.pageTitle && r.pageTitle !== r.heading && <span className="text-sm text-muted-foreground"> · {r.pageTitle}</span>}</>
            ) : (
              <><span className="text-sm text-muted-foreground">{r.pageTitle}{r.heading !== r.pageTitle && ` › ${r.heading}`}</span>
                <span className="mt-0.5 block text-[0.95rem] text-muted-foreground"><Marked text={r.snippet} terms={terms} /></span></>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
