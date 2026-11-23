/**
 * pages/summons.tsx - the Summons & Familiars index (/summons).
 *
 * Every creature a spell or feature can call up, with its full stat block:
 * spirits and conjured creatures (Draconic Spirit, Giant Insect...), familiars,
 * Pact of the Chain forms, steeds and undead servants. Works like the Items
 * page: search, filters kept in the address (?category=Familiar&spell=...),
 * and ?summon=<id> opens one stat block.
 * The entries come from data/summons.js and the campaign DM's edits.
 */
import { Link } from 'react-router';
import { PawPrint, Plus } from 'lucide-react';
import { SUMMON_CATEGORIES } from '@shared/rules/constants.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, NativeSelect, Options } from '@/components/fields';
import { DetailDialog, SummonDetail } from '@/components/details';
import { OriginBadge, RulesetsBar } from '@/components/rulesets-bar';
import { ListRow, matchesWords, ResultBar, SearchInput, useFilters } from '@/components/list';
import { Empty, ErrorState, Loading, PageHead } from '@/components/page';
import { useScope, useSummons } from '@/lib/catalog';

/** Two letters shown in the square badge at the start of each row. */
const BADGE: Record<string, string> = {
  'Conjured Creature': 'Cj', Familiar: 'Fm', 'Special Familiar': 'Sf', Steed: 'St',
  'Undead Servant': 'Ud', 'Animated Object': 'Ao', Companion: 'Cp', Other: 'Ot',
};
const KEYS = ['q', 'category', 'spell', 'summon'] as const;

/** The short line under a summon's name. */
const summary = (s: any) => [
  [s.size, s.creatureType].filter(Boolean).join(' '),
  s.category === 'Companion' && (s.growth === 'dynamic' ? 'Dynamic - gains levels' : 'Static'),
  s.summonedBy.length && `from ${s.summonedBy.join(', ')}`,
  s.spellLevel > 0 && 'scales with spell level',
].filter(Boolean).join(' · ');

export default function Summons() {
  const { group, isDM } = useScope();
  const { data: summons, error, reload } = useSummons();
  const { values: f, set } = useFilters(KEYS);

  const list = summons ?? [];
  const spellNames = [...new Set(list.flatMap((s) => s.summonedBy as string[]))].sort();
  const categories = SUMMON_CATEGORIES.filter((c: string) => list.some((s) => s.category === c));
  const shown = list.filter((s) => {
    if (f.category && s.category !== f.category) return false;
    if (f.spell && !s.summonedBy.includes(f.spell)) return false;
    if (f.q && !matchesWords(f.q, [s.name, s.category, s.creatureType, s.size, s.description, s.summonedBy.join(' '), s.tags.join(' ')].join(' '))) return false;
    return true;
  });
  const open = list.find((s) => s.id === f.summon);

  return (
    <>
      <PageHead kicker="Allies on call" title="Summons & Familiars">
        Every creature a spell or feature can call up, with its full stat block - spirits, conjured creatures, familiars,
        steeds and undead servants. When a spell says &ldquo;uses the <i>Draconic Spirit</i> stat block&rdquo;, this is where it is.
      </PageHead>
      <RulesetsBar />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="surface mb-5 grid gap-4 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <Field label="Search" htmlFor="q"><SearchInput id="q" value={f.q} onChange={(v) => set({ q: v })} placeholder="Name, creature type, spell or tag" /></Field>
        <Field label="Category" htmlFor="category">
          <NativeSelect id="category" value={f.category} onChange={(e) => set({ category: e.target.value })}><option value="">Any category</option><Options options={categories} /></NativeSelect>
        </Field>
        <Field label="Summoned by" htmlFor="spell">
          <NativeSelect id="spell" value={f.spell} onChange={(e) => set({ spell: e.target.value })}><option value="">Any spell or feature</option><Options options={spellNames} /></NativeSelect>
        </Field>
      </form>

      {error ? <ErrorState message={error} onRetry={reload} /> : !summons ? <Loading /> : <>
        <ResultBar shown={shown.length} total={list.length} noun="summons">
          <Button variant="ghost" size="sm" onClick={() => set({ q: '', category: '', spell: '' })}>Clear filters</Button>
          {isDM && group && <Button asChild size="sm" variant="outline"><Link to={`/campaign/${group.id}?tab=summons`}><Plus />Add a summon</Link></Button>}
        </ResultBar>
        {shown.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {shown.map((s) => (
              <ListRow key={s.id} onClick={() => set({ summon: s.id })}
                badge={BADGE[s.category] || 'Ot'} badgeSub={s.category.split(' ')[0]} title={s.name}
                meta={<>{summary(s)}<OriginBadge entry={s} className="ml-1.5" />{s.hidden && <Badge variant="outline" className="ml-1.5 border-gold-line bg-gold-soft text-gold-ink">Hidden</Badge>}</>}
                right={s.cr ? `CR ${s.cr.split(' ')[0]}` : undefined} />
            ))}
          </div>
        ) : <Empty icon={<PawPrint />} title="No summons match">Try a different search or clear a filter.</Empty>}
      </>}

      {open && (
        <DetailDialog open wide onOpenChange={(o) => { if (!o) set({ summon: '' }); }} title={open.name}>
          <SummonDetail key={open.id} s={open} onClose={() => set({ summon: '' })} />
        </DetailDialog>
      )}
    </>
  );
}
