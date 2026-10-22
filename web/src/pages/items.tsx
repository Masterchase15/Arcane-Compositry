/**
 * pages/items.tsx - the Items & Weapons index (/items).
 *
 * Works just like the spell indexes: search, filters kept in the address
 * (?category=Weapon&rarity=Rare), ?item=<id> opens one item, and a signed-in
 * player can add an item to a character.
 * The items themselves come from data/items.js and the campaign DM's edits.
 */
import { Link } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { ITEM_CATEGORIES, ITEM_RARITIES } from '@shared/rules/constants.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, NativeSelect, Options } from '@/components/fields';
import { DetailDialog, ItemDetail } from '@/components/details';
import { OriginBadge, RulesetsBar } from '@/components/rulesets-bar';
import { ARCANE } from '@shared/rules/rulesets.js';
import { AddToCharacter, ListRow, matchesWords, ResultBar, SearchInput, useFilters, useMyCharacters } from '@/components/list';
import { Empty, ErrorState, Loading, PageHead } from '@/components/page';
import { useItems, useScope } from '@/lib/catalog';
import { addItemToCharacter } from '@/lib/spellbook';

/** Two letters shown in the square badge at the start of each row. */
const BADGE: Record<string, string> = { Weapon: 'Wp', Armor: 'Ar', Item: 'It', 'Adventuring Gear': 'Gr', Tool: 'Tl', Consumable: 'Co', 'Magic Item': 'Mg', Catalyst: 'Ca' };
const KEYS = ['q', 'category', 'rarity', 'attunement', 'item'] as const;

/** The short line under an item's name. */
const summary = (it: any) => [it.category, it.rarity !== 'Mundane' && it.rarity, it.damage, it.armorClass && `AC ${it.armorClass}`, it.attunement && 'Attunement'].filter(Boolean).join(' · ');

export default function Items() {
  const { group, isDM, uses } = useScope();
  const arcane = uses(ARCANE);
  const { data: items, error, reload } = useItems();
  const { characters } = useMyCharacters();
  const { values: f, set } = useFilters(KEYS);

  const list = items ?? [];
  const shown = list.filter((it) => {
    if (f.category && it.category !== f.category) return false;
    if (f.rarity && it.rarity !== f.rarity) return false;
    if (f.attunement && (f.attunement === 'yes') !== it.attunement) return false;
    if (f.q && !matchesWords(f.q, [it.name, it.description, it.category, it.rarity, it.damage, it.mastery, it.chainTrait, it.properties.join(' '), it.tags.join(' ')].join(' '))) return false;
    return true;
  });
  const open = list.find((it) => it.id === f.item);

  return (
    <>
      <PageHead kicker="Gear for the road" title="Items & Weapons">
        {arcane
          ? 'Weapons, armor, adventuring gear, magic items and Catalysts. Weapons list their Attack Chain trait where they have one.'
          : 'Weapons, armor, adventuring gear and magic items.'}
      </PageHead>
      <RulesetsBar />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="surface mb-5 grid gap-4 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <Field label="Search" htmlFor="q"><SearchInput id="q" value={f.q} onChange={(v) => set({ q: v })} placeholder="Name, effect, property or tag" /></Field>
        <Field label="Category" htmlFor="category">
          <NativeSelect id="category" value={f.category} onChange={(e) => set({ category: e.target.value })}><option value="">Any category</option><Options options={ITEM_CATEGORIES.filter((c: string) => arcane || c !== 'Catalyst')} /></NativeSelect>
        </Field>
        <Field label="Rarity" htmlFor="rarity">
          <NativeSelect id="rarity" value={f.rarity} onChange={(e) => set({ rarity: e.target.value })}><option value="">Any rarity</option><Options options={ITEM_RARITIES} /></NativeSelect>
        </Field>
        <Field label="Attunement" htmlFor="attunement">
          <NativeSelect id="attunement" value={f.attunement} onChange={(e) => set({ attunement: e.target.value })}>
            <Options options={[{ value: '', label: 'Either' }, { value: 'yes', label: 'Requires attunement' }, { value: 'no', label: 'No attunement' }]} />
          </NativeSelect>
        </Field>
      </form>

      {error ? <ErrorState message={error} onRetry={reload} /> : !items ? <Loading /> : <>
        <ResultBar shown={shown.length} total={list.length} noun="items">
          <Button variant="ghost" size="sm" onClick={() => set({ q: '', category: '', rarity: '', attunement: '' })}>Clear filters</Button>
          {isDM && group && <Button asChild size="sm" variant="outline"><Link to={`/campaign/${group.id}?tab=items`}><Plus />Add an item</Link></Button>}
        </ResultBar>
        {shown.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {shown.map((it) => (
              <ListRow key={it.id} onClick={() => set({ item: it.id })}
                badge={BADGE[it.category] || 'It'} badgeSub={it.category.split(' ')[0]} title={it.name}
                meta={<>{summary(it)}<OriginBadge entry={it} className="ml-1.5" />{it.hidden && <Badge variant="outline" className="ml-1.5 border-gold-line bg-gold-soft text-gold-ink">Hidden</Badge>}</>}
                right={it.cost} />
            ))}
          </div>
        ) : <Empty icon={<Search />} title="No items match">Try a different search or clear a filter.</Empty>}
      </>}

      {open && (
        <DetailDialog open onOpenChange={(o) => { if (!o) set({ item: '' }); }} title={open.name}
          footer={<AddToCharacter noun="items" characters={characters} add={(id) => addItemToCharacter(open, id)} onDone={() => set({ item: '' })} />}>
          <ItemDetail it={open} />
        </DetailDialog>
      )}
    </>
  );
}
