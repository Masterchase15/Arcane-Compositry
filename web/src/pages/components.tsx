/**
 * pages/components.tsx - the "Physical & Aspectual" tab of the Spells page (/spells/components).
 *
 * Components are the building blocks of Compositions. Players only see the
 * ones the DM has made public, and a character only KNOWS the ones recorded on
 * their sheet - "Add to character" here is how a character learns one.
 * The Components themselves come from data/components.js and the campaign DM's edits.
 */
import { Link } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { COMPONENT_KINDS } from '@shared/rules/constants.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, NativeSelect, Options } from '@/components/fields';
import { ComponentDetail, DetailDialog } from '@/components/details';
import { OriginBadge, RulesetOff, RulesetsBar } from '@/components/rulesets-bar';
import { ARCANE } from '@shared/rules/rulesets.js';
import { AddToCharacter, characterLabel, ListRow, matchesWords, ResultBar, SearchInput, SpellListTabs, useFilters, useMyCharacters } from '@/components/list';
import { Empty, ErrorState, Loading, PageHead } from '@/components/page';
import { useApi, useComponents, useScope } from '@/lib/catalog';
import { learnComponent } from '@/lib/spellbook';

const KEYS = ['q', 'kind', 'char', 'component'] as const;

export default function ComponentsPage() {
  const { uses } = useScope();
  if (uses(ARCANE)) return <ComponentList />;
  return (
    <>
      <PageHead kicker="The Arcane language" title="Physical & Aspectual Components"><div><SpellListTabs current="components" /></div></PageHead>
      <RulesetsBar />
      <RulesetOff ruleset={ARCANE} what="Physical & Aspectual Components" />
    </>
  );
}

function ComponentList() {
  const { group, isDM } = useScope();
  const { data: components, error, reload } = useComponents();
  const { characters } = useMyCharacters();
  const { values: f, set } = useFilters(KEYS);
  const char = characters.find((c) => c.id === f.char);
  // Which Components the chosen character already knows (to mark them in the list).
  const sheet = useApi<{ data: any }>(char ? `/characters/${char.id}` : null);
  const lang = sheet.data?.data?.language;
  const known: string[] | null = char && lang ? [...(lang.physicals || []), ...(lang.aspectuals || [])] : null;

  const list = components ?? [];
  const shown = list.filter((c) => {
    if (f.kind && c.kind !== f.kind) return false;
    if (f.q && !matchesWords(f.q, [c.name, c.kind, c.description, c.interactions, c.tendrilColor, c.tags.join(' ')].join(' '))) return false;
    return true;
  });
  const open = list.find((c) => c.id === f.component);

  return (
    <>
      <PageHead kicker="The Arcane language" title="Physical & Aspectual Components">
        What magic is made of. Physical Components are substances; Aspectual Components are properties applied to them. Characters learn them over the campaign - more are out there to be discovered.
        <div><SpellListTabs current="components" /></div>
      </PageHead>
      <RulesetsBar />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="surface mb-5 grid gap-4 p-4 sm:p-5 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="Search" htmlFor="q"><SearchInput id="q" value={f.q} onChange={(v) => set({ q: v })} placeholder="Name, behaviour or tag" /></Field>
        <Field label="Kind" htmlFor="kind">
          <NativeSelect id="kind" value={f.kind} onChange={(e) => set({ kind: e.target.value })}><option value="">Physical and Aspectual</option><Options options={COMPONENT_KINDS} /></NativeSelect>
        </Field>
        {characters.length > 0 && (
          <Field label="Check against my character" htmlFor="char">
            <NativeSelect id="char" value={char ? f.char : ''} onChange={(e) => set({ char: e.target.value })}>
              <option value="">No character selected</option><Options options={characters.map((c) => ({ value: c.id, label: characterLabel(c, false) }))} />
            </NativeSelect>
          </Field>
        )}
      </form>

      {error ? <ErrorState message={error} onRetry={reload} /> : !components ? <Loading /> : <>
        <ResultBar shown={shown.length} total={list.length} noun="Components">
          <Button variant="ghost" size="sm" onClick={() => set({ q: '', kind: '' })}>Clear filters</Button>
          {isDM && group && <Button asChild size="sm" variant="outline"><Link to={`/campaign/${group.id}?tab=spells&list=components`}><Plus />Add a Component</Link></Button>}
        </ResultBar>
        {shown.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {shown.map((c) => (
              <ListRow key={c.id} onClick={() => set({ component: c.id })}
                badge={c.kind === 'Physical' ? 'Ph' : 'As'} badgeSub={c.kind} title={c.name}
                meta={<>
                  {c.description.split('\n')[0]}{' '}
                  {known && (known.includes(c.name)
                    ? <Badge variant="outline" className="bg-ok/15 text-ok">Known</Badge>
                    : <Badge variant="outline">Not learned</Badge>)}
                  <OriginBadge entry={c} />
                  {c.hidden && <Badge variant="outline" className="ml-1 border-gold-line bg-gold-soft text-gold-ink">Hidden</Badge>}
                </>}
                right={c.tendrilColor} />
            ))}
          </div>
        ) : <Empty icon={<Search />} title="No Components match">Try a different search or clear a filter.</Empty>}
      </>}

      {open && (
        <DetailDialog open onOpenChange={(o) => { if (!o) set({ component: '' }); }} title={open.name}
          footer={<AddToCharacter noun="Components" characters={characters} initial={char?.id}
            add={async (id) => { const ok = await learnComponent(open, id); if (ok) sheet.reload(); return ok; }}
            onDone={() => set({ component: '' })} />}>
          <ComponentDetail c={open} />
        </DetailDialog>
      )}
    </>
  );
}
