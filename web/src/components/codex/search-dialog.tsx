/**
 * components/codex/search-dialog.tsx - "Search this book": headings first, then
 * the text that mentions the words. Picking a result opens that page with the
 * words highlighted.
 */
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchInput } from '@/components/list';
import { ResultList } from '@/components/codex/bits';
import { searchTerms, type BookSource, type SearchResults } from '@/lib/books';
import { errorMessage } from '@/lib/api';

export function SearchDialog({ src, open, initial, onClose }: { src: BookSource; open: boolean; initial: string; onClose: () => void }) {
  const [q, setQ] = useState(initial);
  const [found, setFound] = useState<SearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) setQ(initial); }, [open, initial]);

  useEffect(() => {
    const words = q.trim();
    setError(null);
    if (!open || words.length < 2) { setFound(null); return; }
    let live = true;
    const timer = setTimeout(() => {
      src.search(words).then((r) => { if (live) setFound(r); }).catch((err) => { if (live) setError(errorMessage(err)); });
    }, 220);
    return () => { live = false; clearTimeout(timer); };
  }, [q, open, src]);

  const terms = searchTerms(q);
  const titles = found?.results.filter((r) => r.kind === 'heading') ?? [];
  const texts = found?.results.filter((r) => r.kind === 'text') ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="flex max-h-[88dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Search {src.meta.title}</DialogTitle>
          <DialogDescription>All the words must appear. Headings are listed first.</DialogDescription>
        </DialogHeader>
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <SearchInput value={q} onChange={setQ} placeholder="Words to find" label="Search this book" />
        </form>
        <div aria-live="polite" className="-mx-2 min-h-48 overflow-y-auto px-2">
          {error ? <p className="font-semibold text-destructive">{error}</p>
            : q.trim().length < 2 ? <p className="text-sm text-muted-foreground">Type at least two letters.</p>
            : !found ? <p className="text-sm text-muted-foreground">Searching...</p>
            : !found.total ? <p className="text-muted-foreground">Nothing in this book matches "{q.trim()}".</p>
            : <>
              <p className="text-sm text-muted-foreground">
                {found.total} result{found.total === 1 ? '' : 's'}
                {found.total > found.results.length && ` - showing the first ${found.results.length}. Add a word to narrow it down.`}
              </p>
              {titles.length > 0 && <>
                <h3 className="kicker mt-4 mb-1 font-sans">Headings</h3>
                <ResultList bookId={src.meta.id} results={titles} q={q.trim()} terms={terms} onPick={onClose} />
              </>}
              {texts.length > 0 && <>
                <h3 className="kicker mt-4 mb-1 font-sans">In the text</h3>
                <ResultList bookId={src.meta.id} results={texts} q={q.trim()} terms={terms} onPick={onClose} />
              </>}
            </>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
