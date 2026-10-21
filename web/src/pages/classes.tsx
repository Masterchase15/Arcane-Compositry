/**
 * pages/classes.tsx - the class index (/classes) and one class's page (/classes/<id>).
 * The classes themselves come from data/classes.js and the campaign DM's edits.
 * A link such as /classes/fighter?subclass=champion opens that subclass straight away.
 */
import { Link, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, ChevronRight, Pencil, Plus, ScrollText, Search, Shield } from 'lucide-react';
import { ABILITIES } from '@shared/rules/constants.js';
import * as F from '@shared/rules/formulas.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, NativeSelect, Options } from '@/components/fields';
import { DetailDialog, FeatureTable, Stat, SubclassDetail } from '@/components/details';
import { HomebrewBar } from '@/components/homebrew-bar';
import { matchesWords, ResultBar, SearchInput, useFilters } from '@/components/list';
import { Empty, ErrorState, Loading, PageHead, Paragraphs } from '@/components/page';
import { subclassesOf, useClasses, useScope, useSubclasses } from '@/lib/catalog';

const ability = (key: string) => ABILITIES.find((a: any) => a.key === key)?.name || key;
const POOL: Record<string, string> = { full: 'Full caster', partial: 'Partial caster (about 65%)', martial: 'Martial (about 40%)' };

export default function Classes() {
  const { id } = useParams();
  const classes = useClasses();
  const subs = useSubclasses();
  if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;
  if (!classes.data || !subs.data) return <Loading />;
  if (!id) return <ClassIndex classes={classes.data} subclasses={subs.data} />;
  const one = classes.data.find((c) => c.id === id);
  if (!one) return <Empty icon={<Shield />} title="Class not found" action={<Button asChild><Link to="/classes">All classes</Link></Button>} />;
  return <ClassPage c={one} subclasses={subclassesOf(one, subs.data)} />;
}

// ── Index ────────────────────────────────────────────────────────────────────
const KEYS = ['q', 'pool', 'invocation'] as const;

function ClassIndex({ classes, subclasses }: { classes: any[]; subclasses: any[] }) {
  const { group, isDM } = useScope();
  const { values: f, set } = useFilters(KEYS);
  const shown = classes.filter((c) => {
    if (f.pool && c.caster !== f.pool) return false;
    if (f.invocation && c.invocation !== f.invocation) return false;
    if (f.q && !matchesWords(f.q, [c.name, c.role, c.description, c.primaryAbility, c.tags.join(' '), c.features.map((x: any) => x.name).join(' '),
      subclassesOf(c, subclasses).map((s: any) => `${s.name} ${s.description} ${s.features.map((x: any) => x.name).join(' ')}`).join(' ')].join(' '))) return false;
    return true;
  });
  return (
    <>
      <PageHead kicker="Who will you be?" title="Classes">
        Every class available at this table. Open one to see its features, subclasses and how it plays with Arcane Compositry.
      </PageHead>
      <HomebrewBar />
      <form role="search" onSubmit={(e) => e.preventDefault()} className="surface mb-5 grid gap-4 p-4 sm:p-5 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="Search" htmlFor="q"><SearchInput id="q" value={f.q} onChange={(v) => set({ q: v })} placeholder="Class, subclass or feature" /></Field>
        <Field label="Mana pool" htmlFor="pool">
          <NativeSelect id="pool" value={f.pool} onChange={(e) => set({ pool: e.target.value })}>
            <option value="">Any</option><Options options={Object.entries(POOL).map(([value, label]) => ({ value, label }))} />
          </NativeSelect>
        </Field>
        <Field label="Invocation ability" htmlFor="invocation">
          <NativeSelect id="invocation" value={f.invocation} onChange={(e) => set({ invocation: e.target.value })}>
            <option value="">Any</option><Options options={ABILITIES.map((a: any) => ({ value: a.key, label: a.name }))} />
          </NativeSelect>
        </Field>
      </form>
      <ResultBar shown={shown.length} total={classes.length} noun="classes">
        <Button variant="ghost" size="sm" onClick={() => set({ q: '', pool: '', invocation: '' })}>Clear filters</Button>
        {isDM && group && <Button asChild size="sm" variant="outline"><Link to={`/campaign/${group.id}?tab=classes&list=classes`}><Plus />Add a class</Link></Button>}
      </ResultBar>
      {shown.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {shown.map((c) => {
            const subs = subclassesOf(c, subclasses);
            return (
              <Link key={c.id} to={`/classes/${c.id}`} className="group surface p-5 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg">
                <p className="kicker">d{c.hitDie} · {POOL[c.caster].split(' (')[0]}{c.origin === 'file' ? '' : ' · Custom'}{c.hidden ? ' · Hidden from players' : ''}</p>
                <h3 className="mt-1 text-xl font-semibold group-hover:text-primary">{c.name}</h3>
                <p className="mt-1 text-muted-foreground">{c.role}</p>
                <p className="mt-2 text-sm"><b>Primary:</b> {c.primaryAbility || ability(c.invocation)}<br /><b>Invocation:</b> {ability(c.invocation)}</p>
                {subs.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{subs.map((s: any) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}</div>}
              </Link>
            );
          })}
        </div>
      ) : <Empty icon={<Search />} title="No classes match">Try a different search or clear a filter.</Empty>}
    </>
  );
}

// ── One class ────────────────────────────────────────────────────────────────
function ClassPage({ c, subclasses }: { c: any; subclasses: any[] }) {
  const { group, isDM } = useScope();
  const [params, setParams] = useSearchParams();
  const openSub = subclasses.find((s) => s.id === params.get('subclass'));
  const close = () => setParams((p) => { p.delete('subclass'); return p; }, { replace: true });
  const levelsOf = (s: any) => [...new Set(s.features.map((x: any) => x.level))];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/classes"><ArrowLeft />All classes</Link></Button>
      <PageHead kicker={`Class${c.origin === 'file' ? '' : ' · Custom'}${c.hidden ? ' · Hidden from players' : ''}`} title={c.name}>
        <p className="font-serif">{c.role}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild><Link to={`/characters/new?class=${encodeURIComponent(c.name)}`}><Plus />Create a {c.name}</Link></Button>
          <Button asChild variant="outline"><Link to={`/spells/codified?class=${encodeURIComponent(c.name)}`}><ScrollText />{c.name} spells</Link></Button>
          {isDM && group && <Button asChild variant="outline"><Link to={`/campaign/${group.id}?tab=classes&list=classes`}><Pencil />Edit in the campaign</Link></Button>}
        </div>
      </PageHead>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <Paragraphs text={c.description} className="text-[1.05rem]" />
          {c.compositry && (
            <section className="space-y-2 rounded-xl bg-header p-5 text-header-foreground">
              <h3 className="text-xl font-bold text-[#ecd98f]">In Arcane Compositry</h3>
              <Paragraphs text={c.compositry} />
            </section>
          )}
          {c.features.length > 0 && (
            <section><h2 className="mb-3 text-2xl font-bold">Class features</h2><FeatureTable features={c.features} /></section>
          )}
          <section>
            <h2 className="text-2xl font-bold">Subclasses</h2>
            <p className="mt-1 mb-3 text-muted-foreground">
              Tap a subclass to see everything it adds to the {c.name}.{' '}
              {isDM && group && <Link className="font-semibold text-primary underline" to={`/campaign/${group.id}?tab=classes&list=subclasses`}>Add a custom subclass</Link>}
            </p>
            {subclasses.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {subclasses.map((s) => (
                  <button key={s.id} type="button" onClick={() => setParams((p) => { p.set('subclass', s.id); return p; }, { replace: true })}
                    className="group grid gap-1.5 surface p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg">
                    <span className="kicker">
                      {s.features.length ? `Features at level${levelsOf(s).length > 1 ? 's' : ''} ${levelsOf(s).join(', ')}` : 'Subclass'}
                      {s.quick || s.origin === 'file' ? '' : ' · Custom'}{s.hidden ? ' · Hidden from players' : ''}
                    </span>
                    <strong className="font-serif text-lg group-hover:text-primary">{s.name}</strong>
                    <span className="text-muted-foreground">{s.description}</span>
                    {s.features.length > 0 && <span className="text-sm">{s.features.map((x: any) => x.name).join(' · ')}</span>}
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary">View details<ChevronRight className="size-4" /></span>
                  </button>
                ))}
              </div>
            ) : <Empty title="No subclasses yet">No subclasses have been added for this class yet.</Empty>}
          </section>
          {c.source && <p className="text-sm italic text-muted-foreground">Source: {c.source}. Feature text is a short summary - see your rulebook for exact wording.</p>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <TraitCard title="Core traits">
            <Stat label="Primary ability" value={c.primaryAbility} />
            <Stat label="Hit Die" value={`d${c.hitDie} per level`} />
            <Stat label="Saving throws" value={c.saves.map(ability).join(', ')} />
            <Stat label="Skills" value={c.skills || `Choose ${c.skillPicks}`} />
            <Stat label="Weapons" value={c.weapons} /><Stat label="Armor" value={c.armor} /><Stat label="Tools" value={c.tools} />
            <Stat label="Starting equipment" value={c.equipment} />
          </TraitCard>
          <TraitCard title="Arcane numbers">
            <Stat label="Invocation ability" value={ability(c.invocation)} />
            <Stat label="Mana pool" value={POOL[c.caster]} />
            <Stat label="Max Mana at level 1 / 5 / 10 / 20" value={[1, 5, 10, 20].map((l) => F.maxMana(l, c.caster)).join(' / ')} />
          </TraitCard>
        </aside>
      </div>

      {openSub && (
        <DetailDialog open wide onOpenChange={(o) => { if (!o) close(); }} title={openSub.name}
          footer={<>
            <Button asChild variant="outline"><Link to={`/characters/new?class=${encodeURIComponent(c.name)}`}><Plus />Create a {c.name}</Link></Button>
            <Button onClick={close}>Back to {c.name}</Button>
          </>}>
          <SubclassDetail sub={openSub} cls={c} />
        </DetailDialog>
      )}
    </>
  );
}

function TraitCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="bg-header py-2.5 text-header-foreground"><CardTitle className="font-serif text-header-foreground">{title}</CardTitle></CardHeader>
      <CardContent className="p-3"><dl className="grid gap-2">{children}</dl></CardContent>
    </Card>
  );
}
