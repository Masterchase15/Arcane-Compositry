/**
 * components/campaign/notes.tsx - the campaign hub's "Session notes" and "Lore"
 * tabs (DMs only). A notebook: entries with a title and a big text box, saved
 * as you type. Session notes are newest first; lore is grouped by category.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Feather, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/components/confirm';
import { Field } from '@/components/fields';
import { SearchInput, matchesWords } from '@/components/list';
import { Empty, ErrorState, Loading } from '@/components/page';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/catalog';
import { cn } from '@/lib/utils';

const LORE_CATEGORIES = ['People', 'Places', 'Factions', 'History', 'Deities & Powers', 'Creatures', 'Items & Artifacts', 'Magic & Compositry', 'Plot threads', 'Other'];
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

interface Note { id: string; kind: string; title: string; category: string; body: string; createdAt: string; updatedAt: string }

export function NotesTab({ kind }: { kind: 'session' | 'lore' }) {
  const isLore = kind === 'lore';
  const { data, error, reload } = useApi<{ notes: Note[] }>(`/notes?kind=${kind}`);
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const notes = [...data.notes];
  if (isLore) notes.sort((a, b) => (a.category || 'zz').localeCompare(b.category || 'zz') || a.title.localeCompare(b.title));
  const shown = q ? notes.filter((n) => matchesWords(q, `${n.title} ${n.category} ${n.body}`)) : notes;

  const create = async () => {
    try {
      const title = isLore ? 'New lore entry' : `Session - ${when(new Date().toISOString())}`;
      const { note } = await api<{ note: Note }>('POST', '/notes', { kind, title });
      setOpen(note.id);
      reload();
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (n: Note) => {
    if (!await confirm({ title: 'Delete this note?', message: `"${n.title}" will be permanently deleted.`, confirmLabel: 'Delete', danger: true })) return;
    try { await api('DELETE', `/notes/${n.id}`); toast.success('Deleted.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-56 flex-1"><SearchInput value={q} onChange={setQ} placeholder={`Search ${isLore ? 'lore' : 'session notes'}`} label={`Search ${isLore ? 'lore' : 'notes'}`} /></div>
        <Button onClick={create}><Plus />New {isLore ? 'lore entry' : 'session note'}</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {isLore
          ? "Your world bible: people, places, factions, history. Only the campaign's DMs can see this. Everything saves as you type."
          : "One note per session works well: what happened, loose threads, what to prepare next. Only the campaign's DMs can see this. Everything saves as you type."}
      </p>
      {notes.length === 0
        ? <Empty icon={<Feather />} title="Nothing written yet">{isLore ? 'Start your world bible with a first entry.' : 'Start a note for your next session.'}</Empty>
        : shown.length === 0
          ? <p className="text-muted-foreground">No {isLore ? 'lore entries' : 'notes'} match that search.</p>
          : <div className="space-y-2">{shown.map((n) => <NoteCard key={n.id} note={n} isLore={isLore} open={open === n.id} onToggle={() => setOpen(open === n.id ? null : n.id)} onDelete={() => remove(n)} />)}</div>}
      {isLore && <datalist id="lore-cats">{LORE_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>}
    </div>
  );
}

function NoteCard({ note, isLore, open, onToggle, onDelete }: { note: Note; isLore: boolean; open: boolean; onToggle: () => void; onDelete: () => void }) {
  const [form, setForm] = useState({ title: note.title, category: note.category, body: note.body });
  const [status, setStatus] = useState<'saved' | 'saving' | string>('saved');
  const latest = useRef(form);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    try { await api('PUT', `/notes/${note.id}`, latest.current); if (!dirty.current) setStatus('saved'); }
    catch (err) { dirty.current = true; setStatus(`Not saved - ${errorMessage(err)}`); }
  };
  // Leaving the tab or page: send any edit that is still waiting.
  useEffect(() => () => { void flush(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof form, v: string) => {
    const next = { ...latest.current, [k]: v };
    latest.current = next;
    setForm(next);
    dirty.current = true;
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/40">
        <ChevronRight className={cn('size-4 shrink-0 transition-transform', open && 'rotate-90')} />
        <span className="flex-1 font-serif font-semibold">{form.title || 'Untitled'}</span>
        {isLore && form.category && <Badge variant="secondary">{form.category}</Badge>}
        <span className="text-sm text-muted-foreground">{when(note.updatedAt)}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" htmlFor={`t-${note.id}`}><Input id={`t-${note.id}`} maxLength={120} autoComplete="off" value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
            {isLore && (
              <Field label="Category" htmlFor={`c-${note.id}`}>
                <Input id={`c-${note.id}`} list="lore-cats" maxLength={40} autoComplete="off" placeholder="People, Places, Factions..." value={form.category} onChange={(e) => set('category', e.target.value)} />
              </Field>
            )}
          </div>
          <Field label={isLore ? 'Lore' : 'Notes'} htmlFor={`b-${note.id}`}>
            <Textarea id={`b-${note.id}`} className="min-h-64" value={form.body} onChange={(e) => set('body', e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn('flex items-center gap-1.5 text-sm', status.startsWith('Not') ? 'font-semibold text-destructive' : 'text-muted-foreground')} role="status">
              {status === 'saving' ? <><Loader2 className="size-4 animate-spin" />Saving...</> : status === 'saved' ? <><Check className="size-4 text-ok" />Saved</> : status}
            </span>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 />Delete</Button>
          </div>
        </div>
      )}
    </div>
  );
}
