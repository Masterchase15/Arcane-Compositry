/**
 * components/codex/side-panel.tsx - the reader's left column (a slide-in panel
 * on phones): the book's contents, filterable, and your bookmarks in this book.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Bookmark as BookmarkIcon, ChevronRight, List, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/fields';
import { SearchInput } from '@/components/list';
import { useConfirm } from '@/components/confirm';
import { bookHref, fold, removeBookmark, updateBookmark, type BookPage, type BookSource, type Bookmark, type TocNode } from '@/lib/books';
import { errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

const TAB_KEY = 'ac-reader-side';
const store = {
  get: () => { try { return localStorage.getItem(TAB_KEY) === 'marks' ? 'marks' : 'toc'; } catch { return 'toc'; } },
  set: (v: string) => { try { localStorage.setItem(TAB_KEY, v); } catch { /* private mode */ } },
};

export function SidePanel({ src, page, marks, setMarks, onNavigate, className }: {
  src: BookSource; page: BookPage; marks: Bookmark[]; setMarks: (fn: (m: Bookmark[]) => Bookmark[]) => void;
  onNavigate?: () => void; className?: string;
}) {
  const [tab, setTabState] = useState<'toc' | 'marks'>(store.get);
  const setTab = (t: 'toc' | 'marks') => { setTabState(t); store.set(t); };
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="tab-tray mb-3 shrink-0" role="tablist" aria-label="Contents or bookmarks">
        <button type="button" role="tab" aria-selected={tab === 'toc'} className="tab-pill flex flex-1 items-center justify-center gap-1.5" onClick={() => setTab('toc')}>
          <List className="size-4" />Contents
        </button>
        <button type="button" role="tab" aria-selected={tab === 'marks'} className="tab-pill flex flex-1 items-center justify-center gap-1.5" onClick={() => setTab('marks')}>
          <BookmarkIcon className="size-4" />Bookmarks
          {marks.length > 0 && <Badge variant="outline" className="border-gold-line bg-gold-soft px-1.5 text-gold-ink">{marks.length}</Badge>}
        </button>
      </div>
      {tab === 'toc'
        ? <Contents src={src} page={page} onNavigate={onNavigate} />
        : <Marks src={src} page={page} marks={marks} setMarks={setMarks} onNavigate={onNavigate} />}
      <p className="mt-3 hidden shrink-0 flex-wrap items-center gap-1 text-xs text-muted-foreground lg:flex">
        <Kbd>/</Kbd> search · <Kbd>←</Kbd><Kbd>→</Kbd> pages · <Kbd>b</Kbd> bookmark
      </p>
    </div>
  );
}

export const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded border border-b-2 bg-card px-1.5 font-mono text-[0.7rem] font-semibold text-muted-foreground">{children}</kbd>
);

// ── Contents ─────────────────────────────────────────────────────────────────
/** The entries that match the filter, plus the chapters they are in (those shown open). */
function filterTree(nodes: TocNode[], term: string): TocNode[] {
  const out: TocNode[] = [];
  for (const n of nodes) {
    const kids = n.children ? filterTree(n.children, term) : [];
    if (fold(n.title).includes(term) || kids.length) out.push({ ...n, children: kids.length ? kids : undefined });
  }
  return out;
}

function Contents({ src, page, onNavigate }: { src: BookSource; page: BookPage; onNavigate?: () => void }) {
  const [filter, setFilter] = useState('');
  const term = fold(filter.trim());
  const nodes = useMemo(() => (term ? filterTree(src.toc, term) : src.toc), [src.toc, term]);
  const box = useRef<HTMLElement>(null);

  // Keep the current chapter in view inside the list.
  useLayoutEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && box.current) box.current.scrollTop = Math.max(0, el.offsetTop - box.current.clientHeight / 3);
  }, [page.id]);

  const containsPage = (n: TocNode): boolean => n.page === page.id || !!n.children?.some(containsPage);
  const tree = (list: TocNode[], depth: number) => (
    <ul className={cn(depth > 0 && 'ml-2.5 border-l pl-2.5')}>
      {list.map((n) => {
        const at = n.anchor !== undefined ? n.anchor : n.id === n.page ? '' : n.id;
        const current = n.page === page.id && (n.id === page.id || (!!page.anchor && n.id === page.anchor));
        const here = !current && n.page === page.id && !!at;
        const match = !!term && fold(n.title).includes(term);
        const link = (
          <Link to={bookHref(src.meta.id, n.page, { at })} onClick={onNavigate} aria-current={current ? 'page' : undefined}
            className={cn('block min-w-0 flex-1 rounded-md px-2 py-1.5 leading-snug hover:bg-muted',
              depth === 0 && 'font-semibold', current && 'bg-accent font-semibold text-accent-foreground', here && 'text-primary', match && 'bg-gold-soft')}>
            {n.title}
          </Link>
        );
        if (!n.children) return <li key={n.id}>{link}</li>;
        return (
          <li key={n.id}>
            <details open={!!term || containsPage(n)} className="group">
              <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
                <ChevronRight className="mx-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
                {link}
              </summary>
              {tree(n.children, depth + 1)}
            </details>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <div className="mb-2 shrink-0"><SearchInput value={filter} onChange={setFilter} placeholder="Find a chapter or heading" label="Filter the contents" /></div>
      <nav ref={box} aria-label="Contents" className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain text-sm">
        {nodes.length ? tree(nodes, 0) : <p className="px-2 py-3 text-muted-foreground">Nothing in the contents matches.</p>}
      </nav>
    </>
  );
}

// ── Bookmarks ────────────────────────────────────────────────────────────────
function Marks({ src, page, marks, setMarks, onNavigate }: {
  src: BookSource; page: BookPage; marks: Bookmark[]; setMarks: (fn: (m: Bookmark[]) => Bookmark[]) => void; onNavigate?: () => void;
}) {
  const { user } = useSession();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Bookmark | null>(null);

  if (!user) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        <BookmarkIcon className="mx-auto mb-2 size-6" />
        <p>Sign in to bookmark pages. Bookmarks are saved to your account and follow you to any device.</p>
        <Button asChild size="sm" className="mt-3"><Link to="/account">Sign in</Link></Button>
      </div>
    );
  }
  if (!marks.length) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        <BookmarkIcon className="mx-auto mb-2 size-6" />
        <p>No bookmarks in this book yet. Use the <b>Bookmark</b> button at the top, or the bookmark beside any heading.</p>
      </div>
    );
  }

  const order = (m: Bookmark) => { const i = src.pages.findIndex((p) => p.id === m.page); return i < 0 ? 1e9 : i; };
  const sorted = [...marks].sort((a, b) => order(a) - order(b) || a.createdAt.localeCompare(b.createdAt));
  const remove = async (m: Bookmark) => {
    if (!(await confirm({ title: 'Remove bookmark?', message: `"${m.title}" will be removed from your bookmarks.`, confirmLabel: 'Remove', danger: true }))) return;
    try {
      await removeBookmark(m.id);
      setMarks((all) => all.filter((x) => x.id !== m.id));
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain text-sm">
        {sorted.map((m) => (
          <li key={m.id} className={cn('relative rounded-md py-2 pr-18 pl-2', m.page === page.id && 'bg-accent/50')}>
            <Link to={bookHref(src.meta.id, m.page, { at: m.anchor })} onClick={onNavigate} className="group grid gap-0.5">
              <b className="group-hover:text-primary group-hover:underline">{m.title}</b>
              <span className="text-xs text-muted-foreground">{m.context}</span>
            </Link>
            {m.note && <p className="mt-1 border-l-2 border-gold-line pl-2 text-xs whitespace-pre-wrap text-muted-foreground italic">{m.note}</p>}
            <span className="absolute top-1.5 right-0 flex">
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(m)} aria-label={`Note for ${m.title}`} title="Add or edit a note"><Pencil /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => remove(m)} aria-label={`Remove bookmark ${m.title}`} title="Remove"><Trash2 /></Button>
            </span>
          </li>
        ))}
      </ul>
      <EditNote mark={editing} onClose={() => setEditing(null)} onSaved={(saved) => setMarks((all) => all.map((x) => (x.id === saved.id ? saved : x)))} />
    </>
  );
}

function EditNote({ mark, onClose, onSaved }: { mark: Bookmark | null; onClose: () => void; onSaved: (b: Bookmark) => void }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  if (mark && shown !== mark.id) { setShown(mark.id); setTitle(mark.title); setNote(mark.note); }

  const save = async () => {
    if (!mark) return;
    setBusy(true);
    try {
      onSaved(await updateBookmark(mark.id, { title, note }));
      onClose();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={!!mark} onOpenChange={(open) => { if (!open) { onClose(); setShown(null); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Bookmark</DialogTitle></DialogHeader>
        <Field label="Title" htmlFor="bm-title"><Input id="bm-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Note" htmlFor="bm-note" hint={mark?.context}>
          <Textarea id="bm-note" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why you saved it, a page to compare with..." />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
