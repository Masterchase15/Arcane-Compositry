/**
 * pages/new-character.tsx - the short "New character" form (/characters/new).
 * It collects the basics, lets shared/rules/character.js fill in everything that
 * can be calculated, saves the sheet and opens it.
 *
 *   ?class=Druid         pre-selects a class (links from the class pages)
 *   ?campaign=<id>       makes it for that campaign, with its homebrew classes
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Check, Dices } from 'lucide-react';
import { toast } from 'sonner';
import { ABILITIES, CLASSES, findClass } from '@shared/rules/constants.js';
import * as F from '@shared/rules/formulas.js';
import { characterFromBasics, derive } from '@shared/rules/character.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, NativeSelect, Options } from '@/components/fields';
import { PageHead, RequireUser } from '@/components/page';
import { Panel, ResultTile } from '@/components/panel';
import { api, errorMessage } from '@/lib/api';
import { GroupScope } from '@/lib/catalog';
import { useSession } from '@/lib/session';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ALIGNMENTS = ['', 'Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];

/**
 * A sensible way to place the standard array for a class: the best score goes
 * to the class's Invocation ability, then Constitution, then Dexterity, then
 * the rest in sheet order.
 */
function suggestedScores(className: string): Record<string, number> {
  const cls = findClass(className);
  const order = [...new Set([cls?.invocation, 'con', 'dex', ...ABILITIES.map((a: any) => a.key)].filter(Boolean))];
  return Object.fromEntries(order.map((key, i) => [key, STANDARD_ARRAY[i] ?? 10]));
}

export default function NewCharacter() {
  const [params] = useSearchParams();
  const { findGroup, homebrew } = useSession();
  const campaign = findGroup(params.get('campaign'));
  return (
    <RequireUser what="create a character">
      {/* The form uses the campaign's classes (its homebrew), so it sits in that campaign's scope. */}
      <GroupScope groupId={campaign?.id ?? homebrew}>
        <Form key={campaign?.id ?? 'none'} campaignId={campaign?.id ?? null} startClassName={params.get('class')} />
      </GroupScope>
    </RequireUser>
  );
}

function Form({ campaignId, startClassName }: { campaignId: string | null; startClassName: string | null }) {
  const { user, groups } = useSession();
  const navigate = useNavigate();
  const startClass = (findClass(startClassName) || findClass('Wizard') || CLASSES[0])?.name ?? '';
  const [basics, setBasics] = useState({
    name: '', player: user?.displayName ?? '', className: startClass, level: '1', species: '', background: '', alignment: '',
  });
  const [scores, setScores] = useState<Record<string, number | string>>(() => suggestedScores(startClass));
  const [touched, setTouched] = useState(false); // once the player edits a score, changing class no longer rearranges them
  const [nameError, setNameError] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof basics, value: string) => {
    setBasics((b) => ({ ...b, [key]: value }));
    if (key === 'className' && !touched) setScores(suggestedScores(value));
  };
  const { c, d, cls } = useMemo(() => {
    const ch = characterFromBasics({ ...basics, scores });
    return { c: ch, d: derive(ch), cls: findClass(basics.className) };
  }, [basics, scores]);

  const roll = () => {
    setScores(Object.fromEntries(ABILITIES.map((a: any) => [a.key, F.roll(4, 6).dice.sort((x: number, y: number) => y - x).slice(0, 3).reduce((t: number, n: number) => t + n, 0)])));
    setTouched(true);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basics.name.trim()) { setNameError(true); document.getElementById('name')?.focus(); return; }
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>('POST', '/characters', { data: characterFromBasics({ ...basics, name: basics.name.trim(), scores }), groupId: campaignId });
      toast.success(`${basics.name.trim()} created.`);
      navigate(`/characters/${id}`);
    } catch (err) { toast.error(errorMessage(err)); setBusy(false); }
  };

  return (
    <>
      <PageHead kicker="Step 1 of 1 - the rest happens on the sheet" title="New character">
        Fill in the basics and the sheet works out the rest. Not sure what to pick? Open the{' '}
        <Link className="font-semibold text-primary underline underline-offset-4" to="/guide" target="_blank">character guide</Link> in another tab.
      </PageHead>
      <form noValidate onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel title="Who are they?" bodyClassName="grid gap-4 sm:grid-cols-2">
            {groups.length > 0 && (
              <Field label="Campaign" htmlFor="campaign" className="sm:col-span-2" hint="In a campaign, its DM can see the sheet and its homebrew classes are offered below.">
                <NativeSelect id="campaign" value={campaignId ?? ''} onChange={(e) => navigate(`/characters/new${e.target.value ? `?campaign=${e.target.value}` : ''}`, { replace: true })}>
                  <Options options={[{ value: '', label: 'No campaign (add it to one later)' }, ...groups.map((g) => ({ value: g.id, label: g.name }))]} />
                </NativeSelect>
              </Field>
            )}
            <Field label="Character name *" htmlFor="name" className="sm:col-span-2" error={nameError ? 'Give your character a name.' : null}>
              <Input id="name" maxLength={80} autoComplete="off" value={basics.name} aria-invalid={nameError}
                onChange={(e) => { set('name', e.target.value); setNameError(false); }} />
            </Field>
            <Field label="Class *" htmlFor="className" hint={cls && <>{cls.role} d{cls.hitDie} Hit Die. Invocation: {cls.invocation.toUpperCase()}. <Link className="underline" to="/classes">Compare the classes</Link></>}>
              <NativeSelect id="className" value={basics.className} onChange={(e) => set('className', e.target.value)}>
                <Options options={CLASSES.map((x: any) => x.name)} />
              </NativeSelect>
            </Field>
            <Field label="Level" htmlFor="level"><Input id="level" type="number" inputMode="numeric" min={1} max={20} value={basics.level} onChange={(e) => set('level', e.target.value)} /></Field>
            <Field label="Species" htmlFor="species"><Input id="species" placeholder="Elf, Dwarf, Human..." autoComplete="off" value={basics.species} onChange={(e) => set('species', e.target.value)} /></Field>
            <Field label="Background" htmlFor="background"><Input id="background" placeholder="Sage, Soldier, Hermit..." autoComplete="off" value={basics.background} onChange={(e) => set('background', e.target.value)} /></Field>
            <Field label="Alignment" htmlFor="alignment">
              <NativeSelect id="alignment" value={basics.alignment} onChange={(e) => set('alignment', e.target.value)}>
                <Options options={ALIGNMENTS.map((a) => ({ value: a, label: a || 'Decide later' }))} />
              </NativeSelect>
            </Field>
            <Field label="Player name" htmlFor="player"><Input id="player" autoComplete="off" value={basics.player} onChange={(e) => set('player', e.target.value)} /></Field>
          </Panel>

          <Panel title="Ability scores" bodyClassName="space-y-4">
            <p className="text-sm text-muted-foreground">
              Type your scores, or use a button. The standard array (15, 14, 13, 12, 10, 8) starts in a sensible order for your class - move the numbers wherever you like,
              then add your background's bonuses (+2 and +1, or +1 to three).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setTouched(false); setScores(suggestedScores(basics.className)); }}>Fill standard array</Button>
              <Button type="button" variant="outline" size="sm" onClick={roll}><Dices />Roll 4d6, drop lowest</Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ABILITIES.map((a: any) => (
                <Field key={a.key} label={a.name} htmlFor={`score-${a.key}`}
                  hint={<span className="tabular-nums">Modifier {F.signed(d.mods[a.key])}{cls?.saves.includes(a.key) ? ' · save proficiency' : ''}</span>}>
                  <Input id={`score-${a.key}`} type="number" inputMode="numeric" min={1} max={30} value={scores[a.key]}
                    onChange={(e) => { setTouched(true); setScores((s) => ({ ...s, [a.key]: e.target.value })); }} />
                </Field>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Panel title="Starting numbers" bodyClassName="space-y-3">
            <p className="text-sm text-muted-foreground">Worked out from the codex. You can change any of them on the sheet.</p>
            <div className="grid grid-cols-2 gap-2.5">
              <ResultTile label="Hit Points" value={c.hp.max} note={c.hp.hitDice} />
              <ResultTile label="Max Mana" value={d.manaMax} note={F.CASTER_TYPES[c.casterType]?.label} />
              <ResultTile label="Proficiency" value={F.signed(d.profBonus)} />
              <ResultTile label="Guard" value={d.guardMax} note="2 + PB" />
              <ResultTile label="Chain Length" value={d.chainLength} />
              <ResultTile label="Arcane attack" value={F.signed(d.arcaneAttack)} note={`Save DC ${d.saveDC}`} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}><Check />Create character</Button>
            <Button asChild variant="ghost" className="w-full"><Link to="/characters">Cancel</Link></Button>
          </Panel>
        </aside>
      </form>
    </>
  );
}
