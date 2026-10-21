/**
 * pages/sheet.tsx - the character sheet (/characters/<id>).
 *
 * Mirrors the four-page "Arcane Compositry Character Sheet":
 *   Core & Combat tab ... page 1      Arcane tab ......... page 2
 *   Features & Gear ..... page 3      Reference .......... page 4
 * Each tab is in components/sheet/; the inputs they use (and how to add a
 * field) are in components/sheet/fields.tsx.
 *
 * HOW IT WORKS
 *  The character object `c` (shape: shared/rules/character.js) lives here.
 *  Every change recalculates the automatic numbers (derive) and saves the whole
 *  sheet about half a second after the last change. Anything not yet saved is
 *  sent when you leave the page or close the tab.
 *  A character in a campaign uses that campaign's homebrew.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { AlertTriangle, ArrowLeft, Check, Droplet, Flag, Heart, Loader2, Shield } from 'lucide-react';
import * as F from '@shared/rules/formulas.js';
import { derive, upgrade } from '@shared/rules/character.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState, Loading, RequireUser } from '@/components/page';
import { SheetContext, Stepper, type Sheet as SheetState } from '@/components/sheet/fields';
import { CoreTab } from '@/components/sheet/core-tab';
import { ArcaneTab } from '@/components/sheet/arcane-tab';
import { FeaturesTab } from '@/components/sheet/features-tab';
import { ReferenceTab } from '@/components/sheet/reference-tab';
import { api, errorMessage } from '@/lib/api';
import { GroupScope, useApi } from '@/lib/catalog';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'core', label: 'Core & Combat', Tab: CoreTab },
  { id: 'arcane', label: 'Arcane', Tab: ArcaneTab },
  { id: 'features', label: 'Features & Gear', Tab: FeaturesTab },
  { id: 'reference', label: 'Reference', Tab: ReferenceTab },
];

interface Loaded { id: string; ownerId: string; ownerName: string; groupId: string | null; groupName: string; data: any }

export default function SheetPage() {
  const { id } = useParams();
  return <RequireUser what="open this character"><Load id={id!} /></RequireUser>;
}

function Load({ id }: { id: string }) {
  const { data, error, reload } = useApi<Loaded>(`/characters/${id}`);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  return (
    // A character in a campaign uses that campaign's homebrew (classes, spells, items).
    <GroupScope groupId={data.groupId}>
      <Sheet key={data.id} loaded={data} />
    </GroupScope>
  );
}

type SaveState = { state: 'saved' | 'saving' } | { state: 'error'; message: string };

function Sheet({ loaded }: { loaded: Loaded }) {
  const { user } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('tab')) ?? TABS[0];
  const [c, setC] = useState(() => upgrade(loaded.data));
  const d = useMemo(() => derive(c), [c]);
  const [save, setSave] = useState<SaveState>({ state: 'saved' });

  // ── Saving ────────────────────────────────────────────────────────────────
  const latest = useRef(c);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    try {
      await api('PUT', `/characters/${loaded.id}`, { data: latest.current });
      if (!dirty.current) setSave({ state: 'saved' });
    } catch (err) {
      dirty.current = true;
      setSave({ state: 'error', message: errorMessage(err) });
    }
  }, [loaded.id]);

  const update = useCallback((fn: (c: any) => void) => {
    setC((prev: any) => {
      const next = structuredClone(prev);
      fn(next);
      latest.current = next;
      return next;
    });
    dirty.current = true;
    setSave({ state: 'saving' });
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  }, [flush]);

  // Leaving the page: send what is waiting. Closing the tab: send it with keepalive.
  useEffect(() => {
    const onUnload = () => {
      if (!dirty.current) return;
      fetch(`/api/characters/${loaded.id}`, { method: 'PUT', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: latest.current }) });
    };
    window.addEventListener('beforeunload', onUnload);
    return () => { window.removeEventListener('beforeunload', onUnload); void flush(); };
  }, [flush, loaded.id]);

  const sheet: SheetState = { c, d, id: loaded.id, update };
  const isOwner = loaded.ownerId === user?.id;
  const subtitle = [`Level ${d.level}`, c.identity.species, c.identity.className, c.identity.subclass && `(${c.identity.subclass})`].filter(Boolean).join(' ');

  return (
    <SheetContext.Provider value={sheet}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={isOwner ? '/characters' : `/campaign/${loaded.groupId}?tab=party`}><ArrowLeft />{isOwner ? 'My characters' : 'Back to the party'}</Link>
        </Button>
        {loaded.groupId
          ? <Link to={`/campaign/${loaded.groupId}`}><Badge variant="outline" className="border-gold-line bg-gold-soft px-2.5 py-1 text-gold-ink"><Flag />{loaded.groupName}</Badge></Link>
          : <Badge variant="outline">Not in a campaign</Badge>}
      </div>
      {!isOwner && (
        <p className="mb-3 flex items-center gap-2 rounded-lg border border-gold-line bg-gold-soft px-3 py-2 text-sm">
          <Shield className="size-4 shrink-0 text-gold-ink" />You are editing <b>{loaded.ownerName}</b>'s character as DM. Changes save to their sheet.
        </p>
      )}

      <header className="surface mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:mb-5 sm:p-5">
        <span className="flex size-12 shrink-0 items-center sm:size-16 justify-center rounded-2xl bg-header font-serif text-2xl font-bold text-[#ecd98f] ring-1 ring-gold/40" aria-hidden>
          {initials(c.identity.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight break-words sm:text-4xl">{c.identity.name || 'Unnamed Character'}</h1>
          <p className="mt-0.5 text-muted-foreground">{subtitle}</p>
        </div>
        <SaveBadge save={save} retry={flush} />
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Vital icon={<Heart />} label="Hit Points" tone="bg-hp text-hp" value={F.num(c.hp.current)} max={F.num(c.hp.max)}
          of={<>of {c.hp.max}{F.num(c.hp.temp) ? ` (+${F.num(c.hp.temp)} temp)` : ''}</>}>
          <Stepper path="hp.current" label="current hit points" max={F.num(c.hp.max, Infinity) || Infinity} />
        </Vital>
        <Vital icon={<Droplet />} label="Mana" tone="bg-mana text-mana" value={F.num(c.arcane.manaCurrent)} max={d.manaMax} of={<>of {d.manaMax}</>}>
          <Stepper path="arcane.manaCurrent" label="current Mana" max={d.manaMax} />
        </Vital>
        <Vital icon={<Shield />} label="Guard" tone="bg-gold text-gold-ink" value={F.num(c.chain.guardCurrent)} max={d.guardMax}
          of={<>of {d.guardMax}{F.num(c.chain.guardCurrent) <= 0 && <b className="text-destructive"> - Broken</b>}</>}>
          <Stepper path="chain.guardCurrent" label="current Guard" max={d.guardMax} />
        </Vital>
        <div className="surface grid grid-cols-2 gap-px overflow-hidden bg-border p-0">
          {([['Armor Class', d.acTotal], ['Prof. bonus', F.signed(d.profBonus)], ['Save DC', d.saveDC], ['Momentum', `d${c.momentum.die}`]] as const).map(([label, value]) => (
            <div key={label} className="flex flex-col items-center justify-center bg-card px-2 py-3 text-center">
              <span className="font-serif text-2xl font-bold tabular-nums">{value}</span>
              <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky top-[calc(4rem+1px)] z-20 -mx-4 mb-6 bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="tab-tray" role="tablist" aria-label="Sheet sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === tab.id} className="tab-pill flex-1"
              onClick={() => setParams((p) => { p.set('tab', t.id); return p; }, { replace: true })}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel"><tab.Tab /></div>
    </SheetContext.Provider>
  );
}

const initials = (name: string) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';

/** A resource you spend in play: label, a bar showing how full it is, and [-] n [+]. */
function Vital({ icon, label, tone, value, max, of, children }: {
  icon: React.ReactNode; label: string; tone: string; value: number; max: number; of: React.ReactNode; children: React.ReactNode;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const [bar, text] = tone.split(' ');
  return (
    <div className="surface p-3 sm:p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-2">
        <p className={cn('flex items-center gap-1.5 text-sm font-bold [&_svg]:size-4', text)}>{icon}{label}</p>
        <p className="text-sm text-muted-foreground tabular-nums">{of}</p>
      </div>
      {children}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={cn('h-full rounded-full transition-[width] duration-300', bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SaveBadge({ save, retry }: { save: SaveState; retry: () => void }) {
  if (save.state === 'error') {
    return (
      <span className="flex items-center gap-2 text-sm font-semibold text-destructive" role="status">
        <AlertTriangle className="size-4" />Not saved - {save.message}<Button size="sm" variant="outline" onClick={retry}>Retry</Button>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status" aria-live="polite">
      {save.state === 'saving' ? <><Loader2 className="size-4 animate-spin" />Saving...</> : <><Check className="size-4 text-ok" />Saved</>}
    </span>
  );
}
