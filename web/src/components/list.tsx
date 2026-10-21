/**
 * components/list.tsx - pieces shared by the spell, item, class and Component
 * indexes: filters kept in the address, a search box, list rows, the
 * "Codified / Compositry / Physical & Aspectual" switch, and "which character".
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { NativeSelect, Options } from '@/components/fields';
import { Input } from '@/components/ui/input';
import { useApi } from '@/lib/catalog';
import { useSession } from '@/lib/session';
import { errorMessage, type CharacterSummary } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Filters stored in the address (?class=Wizard&q=fire), so a filtered list can
 * be bookmarked or shared and survives a refresh.
 */
export function useFilters<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();
  const values = useMemo(() => Object.fromEntries(keys.map((k) => [k, params.get(k) ?? ''])) as Record<K, string>, [params, keys]);
  const set = (patch: Partial<Record<K | string, string>>) => setParams((p) => {
    const next = new URLSearchParams(p);
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v as string); else next.delete(k); }
    return next;
  }, { replace: true });
  return { values, set, params };
}

/** True when every word of the search is somewhere in the text. */
export const matchesWords = (query: string, text: string) => {
  const hay = text.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
};

export function SearchInput({ value, onChange, placeholder = 'Search', id, label }: { value: string; onChange: (v: string) => void; placeholder?: string; id?: string; label?: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" className="bg-card pl-9" aria-label={label} />
    </div>
  );
}

/** A clickable row: a dark badge on the left, name and details, and something on the right. */
export function ListRow({ badge, badgeSub, title, meta, right, onClick }: {
  badge?: ReactNode; badgeSub?: string; title: ReactNode; meta?: ReactNode; right?: ReactNode; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left shadow-xs transition-colors hover:border-primary hover:bg-accent/40">
      {badge !== undefined
        ? <span className="flex size-13 flex-col items-center justify-center rounded-lg bg-header text-center font-serif text-lg font-bold leading-none text-header-foreground">
            {badge}{badgeSub && <small className="mt-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-wider opacity-85">{badgeSub}</small>}
          </span>
        : <span />}
      <span className="min-w-0">
        <strong className="block font-serif text-[1.05rem] leading-snug">{title}</strong>
        {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
      </span>
      {right && <span className="whitespace-nowrap text-right font-bold text-primary">{right}</span>}
    </button>
  );
}

export function SpellListTabs({ current }: { current: 'codified' | 'compositry' | 'components' }) {
  const tabs = [['codified', 'Codified (D&D)', '/spells/codified'], ['compositry', 'Compositry (custom)', '/spells/compositry'], ['components', 'Physical & Aspectual', '/spells/components']] as const;
  return (
    <div className="mt-5 inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Spell lists">
      {tabs.map(([id, label, to]) => (
        <Link key={id} to={to} role="tab" aria-selected={id === current}
          className={cn('rounded-md px-3 py-1.5 text-sm font-semibold transition-colors', id === current ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          {label}
        </Link>
      ))}
    </div>
  );
}

/** The signed-in person's characters (empty when signed out). */
export function useMyCharacters() {
  const { user } = useSession();
  const { data, reload } = useApi<{ characters: CharacterSummary[] }>(user ? '/characters' : null);
  return { characters: data?.characters ?? [], reload };
}

/** "Wizard 3 (Curse of Strahd)" - how a character is named in pickers. */
export const characterLabel = (c: CharacterSummary, withLevel = true) =>
  `${c.name}${withLevel ? ` - ${c.className || 'no class'} ${c.level}` : ''}${c.groupName ? ` (${c.groupName})` : ''}`;

export function ResultBar({ shown, total, noun, children }: { shown: number; total: number; noun: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{shown} of {total} {noun}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * The bottom of a details dialog: "Add to character" with a character picker,
 * or a sign-in / create-a-character link. `add(characterId)` resolves true when done.
 */
export function AddToCharacter({ noun, characters, initial, add, onDone }: {
  noun: string; characters: CharacterSummary[]; initial?: string;
  add: (characterId: string) => Promise<boolean>; onDone: () => void;
}) {
  const { user } = useSession();
  const location = useLocation();
  const [target, setTarget] = useState(initial || characters[0]?.id || '');
  const [busy, setBusy] = useState(false);
  if (!user) return <Button asChild><Link to={`/account?next=${encodeURIComponent(location.pathname)}`}>Sign in to add to a character</Link></Button>;
  if (!characters.length) return <Button asChild><Link to="/characters/new">Create a character to add {noun}</Link></Button>;
  const run = async () => {
    setBusy(true);
    try { if (await add(target)) onDone(); } catch (err) { toast.error(errorMessage(err)); }
    setBusy(false);
  };
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2">
      <NativeSelect className="w-auto min-w-48" value={target} onChange={(e) => setTarget(e.target.value)} aria-label={`Character to add this to`}>
        <Options options={characters.map((x) => ({ value: x.id, label: `${x.name} (${x.className || 'no class'})` }))} />
      </NativeSelect>
      <Button onClick={run} disabled={busy}><Plus />Add to character</Button>
    </div>
  );
}
