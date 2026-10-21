/**
 * pages/spells.tsx - the two spell indexes:
 *   /spells/codified     normal D&D spells
 *   /spells/compositry   custom Compositions codified at the table
 *
 * Filters are kept in the address (?class=Wizard&school=Evocation...) so a
 * filtered list can be bookmarked or shared, and ?spell=<id> opens one spell.
 * The spells themselves come from data/spells/*.js and the campaign DM's edits.
 */
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SCHOOLS, CLASS_NAMES, ROMAN, ANY_CLASS } from '@shared/rules/constants.js';
import { codifiedSpellMana } from '@shared/rules/formulas.js';
import { classAllowed } from '@shared/rules/character.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, NativeSelect, Options } from '@/components/fields';
import { DetailDialog, SpellDetail } from '@/components/details';
import { HomebrewBar } from '@/components/homebrew-bar';
import { characterLabel, ListRow, matchesWords, ResultBar, SearchInput, SpellListTabs, useFilters, useMyCharacters } from '@/components/list';
import { Empty, ErrorState, Loading, PageHead } from '@/components/page';
import { useConfirm } from '@/components/confirm';
import { useScope, useSpells } from '@/lib/catalog';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/api';
import { addSpellToCharacter } from '@/lib/spellbook';

const LIST_INFO = {
  codified: { title: 'Codified Spells', kicker: 'Ancient codifications', blurb: 'Existing D&D spells are already-optimized magical formulas. They keep their normal statistics and replace spell slots with Mana.' },
  compositry: { title: 'Compositry Spells', kicker: 'Invented at this table', blurb: 'Compositions that have been refined and codified during the campaign. The list grows as players make Arcane Discoveries.' },
};
const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const KEYS = ['q', 'class', 'school', 'level', 'char', 'spell'] as const;

export default function Spells() {
  const listName = (useParams().list === 'compositry' ? 'compositry' : 'codified') as 'codified' | 'compositry';
  const isCodified = listName === 'codified';
  const info = LIST_INFO[listName];
  const { group, isDM } = useScope();
  const { data, error, reload } = useSpells();
  const { characters } = useMyCharacters();
  const { values: f, set } = useFilters(KEYS);

  const spells: any[] = data?.[listName] ?? [];
  const char = characters.find((c) => c.id === f.char);
  const levels = [...new Set(spells.map((s) => (isCodified ? s.level : s.potency)))].sort((a, b) => a - b);
  const levelLabel = (n: number) => (isCodified ? (n === 0 ? 'Cantrip' : `${ordinal(n)} level`) : `Potency ${ROMAN[n]}`);

  const shown = spells.filter((s) => {
    if (f.class && !s.classes.includes(f.class) && !s.classes.includes(ANY_CLASS)) return false;
    if (f.school && s.school !== f.school) return false;
    if (f.level !== '' && String(isCodified ? s.level : s.potency) !== f.level) return false;
    if (f.q && !matchesWords(f.q, [s.name, s.description, s.school, s.tags.join(' '), s.classes.join(' '), s.form, s.creator, ...(s.physicals || []), ...(s.aspectuals || [])].join(' '))) return false;
    return true;
  });
  const open = spells.find((s) => s.id === f.spell);

  return (
    <>
      <PageHead kicker={info.kicker} title={info.title}>
        {info.blurb}
        <div><SpellListTabs current={listName} /></div>
      </PageHead>
      <HomebrewBar />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="surface mb-5 grid gap-4 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <Field label="Search" htmlFor="q"><SearchInput id="q" value={f.q} onChange={(v) => set({ q: v })} placeholder="Name, effect or tag" /></Field>
        <Field label="Class" htmlFor="class">
          <NativeSelect id="class" value={f.class} onChange={(e) => set({ class: e.target.value })}><option value="">Any class</option><Options options={CLASS_NAMES} /></NativeSelect>
        </Field>
        <Field label="School (type)" htmlFor="school">
          <NativeSelect id="school" value={f.school} onChange={(e) => set({ school: e.target.value })}><option value="">Any school</option><Options options={SCHOOLS} /></NativeSelect>
        </Field>
        <Field label={isCodified ? 'Level' : 'Potency'} htmlFor="level">
          <NativeSelect id="level" value={f.level} onChange={(e) => set({ level: e.target.value })}>
            <option value="">Any</option><Options options={levels.map((n) => ({ value: n, label: levelLabel(n) }))} />
          </NativeSelect>
        </Field>
        {characters.length > 0 && (
          <Field label="Check against my character" htmlFor="char" className="sm:col-span-2 lg:col-span-4"
            hint={'Shows which spells that character\'s class can learn, and where "Add" will put them.'}>
            <NativeSelect id="char" value={char ? f.char : ''} onChange={(e) => set({ char: e.target.value })}>
              <option value="">No character selected</option>
              <Options options={characters.map((c) => ({ value: c.id, label: characterLabel(c) }))} />
            </NativeSelect>
          </Field>
        )}
      </form>

      {error ? <ErrorState message={error} onRetry={reload} /> : !data ? <Loading /> : <>
        <ResultBar shown={shown.length} total={spells.length} noun="spells">
          <Button variant="ghost" size="sm" onClick={() => set({ q: '', class: '', school: '', level: '' })}>Clear filters</Button>
          {isDM && group && <Button asChild size="sm" variant="outline"><Link to={`/campaign/${group.id}?tab=spells&list=${listName}`}><Plus />Add a spell</Link></Button>}
        </ResultBar>
        {shown.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {shown.map((s) => {
              const allowed = char ? classAllowed(s, char.className) : null;
              return (
                <ListRow key={s.id} onClick={() => set({ spell: s.id })}
                  badge={isCodified ? (s.level === 0 ? '0' : s.level) : ROMAN[s.potency]}
                  badgeSub={isCodified ? (s.level === 0 ? 'Cantrip' : 'Level') : 'Potency'}
                  title={s.name}
                  meta={<>
                    {s.school}{isCodified ? '' : ` · ${[...s.physicals, ...s.aspectuals].join(' + ') || 'No Components'} · ${s.form}`} · {s.classes.join(', ')}{' '}
                    {allowed !== null && (allowed
                      ? <Badge className="bg-ok/15 text-ok" variant="outline">{char!.className} can learn</Badge>
                      : <Badge variant="outline">Not on {char!.className || 'class'} list</Badge>)}
                    {s.hidden && <Badge variant="outline" className="ml-1 border-gold-line bg-gold-soft text-gold-ink">Hidden</Badge>}
                  </>}
                  right={`${isCodified ? codifiedSpellMana(s.level) : s.mana} Mana`}
                />
              );
            })}
          </div>
        ) : <Empty icon={<Search />} title="No spells match">Try a different search or clear a filter.</Empty>}
      </>}

      {open && <SpellDialog list={listName} spell={open} characters={characters} defaultChar={char?.id} onClose={() => set({ spell: '' })} />}
    </>
  );
}

function SpellDialog({ list, spell, characters, defaultChar, onClose }: {
  list: string; spell: any; characters: ReturnType<typeof useMyCharacters>['characters']; defaultChar?: string; onClose: () => void;
}) {
  const { user } = useSession();
  const { isDM } = useScope();
  const confirm = useConfirm();
  const location = useLocation();
  const [target, setTarget] = useState(defaultChar || characters[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const c = characters.find((x) => x.id === target);

  const add = async () => {
    setBusy(true);
    try { if (await addSpellToCharacter(list, spell, target, { confirm, isDM })) onClose(); }
    catch (err) { toast.error(errorMessage(err)); }
    setBusy(false);
  };

  const footer = !user
    ? <Button asChild><Link to={`/account?next=${encodeURIComponent(location.pathname)}`}>Sign in to add to a character</Link></Button>
    : !characters.length
      ? <Button asChild><Link to="/characters/new">Create a character to add spells</Link></Button>
      : <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <NativeSelect className="w-auto min-w-48" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Character to add this spell to">
            <Options options={characters.map((x) => ({ value: x.id, label: `${x.name} (${x.className || 'no class'})` }))} />
          </NativeSelect>
          <Button onClick={add} disabled={busy}><Plus />Add to character</Button>
        </div>;

  return (
    <DetailDialog open onOpenChange={(o) => { if (!o) onClose(); }} title={spell.name} footer={footer}>
      <SpellDetail list={list} s={spell} />
      {c && (
        <p className="mt-3 text-sm text-muted-foreground">
          {classAllowed(spell, c.className)
            ? `${c.name}'s class (${c.className}) can learn this spell.`
            : `Heads up: this spell is not on the ${c.className || 'class'} list. You will be asked to confirm.`}
        </p>
      )}
    </DetailDialog>
  );
}
