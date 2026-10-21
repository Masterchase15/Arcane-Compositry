/**
 * components/sheet/core-tab.tsx - the sheet's "Core & Combat" tab (page 1 of the
 * printed sheet): identity, vitals, abilities and skills, hit points, Attack
 * Chains, Momentum Dice and weapons.
 */
import { useState } from 'react';
import { RefreshCw, Sword } from 'lucide-react';
import { toast } from 'sonner';
import { ABILITIES, SKILLS, CLASS_NAMES, findClass } from '@shared/rules/constants.js';
import * as F from '@shared/rules/formulas.js';
import { skillKey } from '@shared/rules/character.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/fields';
import { Panel } from '@/components/panel';
import { MomentumTracker } from '@/components/calculator';
import { Picker } from '@/components/details';
import { subclassesOf, useItems, useSubclasses } from '@/lib/catalog';
import { weaponRow } from '@/lib/spellbook';
import { AreaF, AutoF, AutoInput, CellF, CheckF, ListRow, Pips, SelectF, SmallLabel, Stepper, TextF, getPath, setPath, useSheet } from './fields';
import { AddRow, DetailsButton, RemoveRow, useDetails } from './rows';
import { cn } from '@/lib/utils';

const grid = 'grid gap-3 sm:grid-cols-2';
const grid3 = 'grid grid-cols-2 gap-3 sm:grid-cols-3';

export function CoreTab() {
  const { c, d, update } = useSheet();
  const subclasses = useSubclasses();
  const items = useItems();
  const details = useDetails();
  const [picking, setPicking] = useState(false);
  const cls = findClass(c.identity.className);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Character" bodyClassName={grid}>
        <TextF path="identity.name" label="Character name" className="sm:col-span-2" />
        <ListInput path="identity.className" label="Class" options={CLASS_NAMES} />
        <ListInput path="identity.subclass" label="Subclass" options={subclassesOf(cls, subclasses.data).map((x: any) => x.name)} />
        <TextF path="identity.level" label="Level" type="number" min={1} max={20} />
        <TextF path="identity.xp" label="XP" />
        <TextF path="identity.background" label="Background" />
        <TextF path="identity.species" label="Species" />
        <TextF path="identity.player" label="Player" />
        <TextF path="identity.alignment" label="Alignment" />
      </Panel>

      <Panel title="Core Vitals" bodyClassName={grid3}>
        <AutoF k="profBonus" label="Prof. bonus" />
        <AutoF k="initiative" label="Initiative" />
        <TextF path="vitals.speed" label="Speed" />
        <TextF path="vitals.size" label="Size" />
        <AutoF k="passivePerception" label="Passive Perception" />
        <TextF path="vitals.ac" label="Armor Class (base)" type="number" />
        <Field label="Total AC" hint={d.itemAc ? `${F.num(c.vitals.ac)} base ${F.signed(d.itemAc)} from items in use` : 'Base AC + items in use'}>
          <span className="font-serif text-3xl font-bold tabular-nums">{d.acTotal}</span>
        </Field>
        <TextF path="vitals.shieldOtherAc" label="Shield / other AC" />
        <Field label="Heroic Insp."><CheckF path="vitals.heroicInspiration" label="Inspired" /></Field>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 xl:grid-cols-3">
        {ABILITIES.map((a: any) => <AbilityCard key={a.key} a={a} />)}
      </div>

      <Panel title="Hit Points, Hit Dice & Death" bodyClassName={grid3}>
        <Field label="HP current" className="col-span-2 sm:col-span-1"><Stepper path="hp.current" label="current hit points" max={F.num(c.hp.max, Infinity) || Infinity} /></Field>
        <TextF path="hp.max" label="HP max" type="number" />
        <TextF path="hp.temp" label="Temp HP" type="number" />
        <TextF path="hp.hitDice" label="Hit Dice" placeholder="3d8" />
        <TextF path="hp.hitDiceSpent" label="Spent" type="number" />
        <Field label="Death saves - successes"><Pips path="hp.deathSuccess" label="Death save success" /></Field>
        <Field label="Death saves - failures"><Pips path="hp.deathFail" label="Death save failure" fail /></Field>
      </Panel>

      <Panel title="Attack Chains & Active Defense" bodyClassName="space-y-3">
        <div className={grid3}>
          <AutoF k="chainLength" label="Chain length" />
          <AutoF k="guardMax" label="Guard max" hint="2 + PB" />
          <Field label="Guard cur." className="col-span-2 sm:col-span-1"><Stepper path="chain.guardCurrent" label="current Guard" max={d.guardMax} /></Field>
          <AutoF k="dodge" label="Dodge" />
          <AutoF k="parry" label="Parry" />
          <TextF path="chain.blockFormula" label="Block value / formula" placeholder={`PB + STR = ${d.blockValue}`} />
          <AutoF k="counterCost" label="Counter cost" />
          <TextF path="chain.finisher" label="Finisher" />
        </div>
        <Field label={<>Chain Momentum <span className="normal-case">({F.signed(d.chainBonus)} to Chain attacks)</span></>}>
          <div className="flex gap-1" role="group" aria-label="Chain Momentum">
            {[0, 1, 2, 3].map((n) => (
              <Button key={n} type="button" size="sm" className="min-w-10" variant={Number(c.chain.momentum) === n ? 'default' : 'outline'} aria-pressed={Number(c.chain.momentum) === n}
                onClick={() => update((x) => { x.chain.momentum = n; })}>{n}</Button>
            ))}
          </div>
        </Field>
        <div className="grid gap-3">
          <AreaF path="chain.posture" label="Defensive posture / special" />
          <AreaF path="chain.counterNotes" label="Counter-attack / interruption notes" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => { update((x) => { x.chain.guardCurrent = d.guardMax; }); toast(`Guard refreshed to ${d.guardMax}.`); }}><RefreshCw />Start of turn: refresh Guard</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { update((x) => { x.chain.momentum = 0; }); toast('Chain ended. Chain Momentum reset to 0.'); }}>End Chain</Button>
        </div>
      </Panel>

      <Panel title="Momentum Dice" bodyClassName="space-y-3">
        <p className="text-sm text-muted-foreground">Build: d4 &gt; d6 &gt; d8 &gt; d10 &gt; d12. Each successful hit advances one step. Spending the die or taking direct enemy damage resets it to d4.</p>
        <MomentumTracker die={Number(c.momentum.die) || 4} onChange={(die) => update((x) => { x.momentum.die = die; })} />
        <div className={grid}>
          <SelectF path="momentum.ability" label="Momentum ability" options={[...ABILITIES.map((a: any) => ({ value: a.key, label: a.name })), { value: 'invocation', label: 'Invocation Modifier (Arcane attack)' }]} />
          <AutoF k="stasisDC" label="Stasis DC" hint="8 + PB + Momentum ability" />
          <TextF path="momentum.modifiers" label="Spend / special modifiers" className="sm:col-span-2" />
        </div>
        <p className="text-sm"><b>d6</b> Break 5-6 | <b>d8</b> Topple 7-8 | <b>d10</b> Daze 9-10 | <b>d12</b> Launch/Smash 11-12</p>
      </Panel>

      <Panel title="Weapons & Attacks" className="lg:col-span-2" bodyClassName="space-y-3">
        {c.weapons.length ? c.weapons.map((w: any, i: number) => (
          <ListRow key={i} actions={<>{w.itemId && <DetailsButton onClick={() => details.show({ kind: 'item', id: w.itemId })} />}<RemoveRow list="weapons" index={i} /></>}>
            <CellF list="weapons" index={i} field="name" label="Name" />
            <CellF list="weapons" index={i} field="atk" label="Atk" />
            <CellF list="weapons" index={i} field="damage" label="Damage / type" />
            <CellF list="weapons" index={i} field="chain" label="Chain" />
            <CellF list="weapons" index={i} field="notes" label="Notes" className="col-span-2 sm:col-span-4" />
          </ListRow>
        )) : <p className="text-sm text-muted-foreground">No weapons yet.</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setPicking(true)}><Sword />Add from Items &amp; Weapons</Button>
          <AddRow list="weapons" label="Add blank weapon" />
        </div>
      </Panel>

      <Picker open={picking} onOpenChange={setPicking} title="Add a weapon" emptyText="No weapons are available yet."
        entries={(items.data ?? []).filter((x) => x.category === 'Weapon')}
        describe={(w: any) => [w.damage, w.properties.join(', '), w.rarity !== 'Mundane' && w.rarity].filter(Boolean).join(' · ')}
        onPick={(w: any) => { update((x) => { x.weapons.push(weaponRow(w)); }); toast.success(`${w.name} added.`); }} />
      {details.dialog}
    </div>
  );
}

/** A text box with suggestions (class names, subclass names) that still accepts anything. */
function ListInput({ path, label, options }: { path: string; label: string; options: string[] }) {
  const { c, update } = useSheet();
  const id = `${path.replace('.', '-')}-input`;
  return (
    <Field label={label} htmlFor={id}>
      <Input id={id} list={`${id}-list`} autoComplete="off" value={getPath(c, path) ?? ''} onChange={(e) => update((x) => setPath(x, path, e.target.value))} />
      <datalist id={`${id}-list`}>{options.map((n) => <option key={n} value={n} />)}</datalist>
    </Field>
  );
}

const LEVELS = ['untrained', 'proficient', 'expertise'];
function AbilityCard({ a }: { a: any }) {
  const { c, d, update } = useSheet();
  return (
    <Panel title={a.name} bodyClassName="space-y-1.5">
      <div className="mb-2 flex items-end gap-3">
        <div className="text-center">
          <SmallLabel>Mod</SmallLabel>
          <div className="flex size-14 items-center justify-center rounded-lg border-2 border-primary/40 font-serif text-2xl font-bold tabular-nums">{F.signed(d.mods[a.key])}</div>
        </div>
        <TextF path={`abilities.${a.key}.score`} label="Score" type="number" min={1} max={30} className="flex-1" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1">
        <Checkbox checked={!!c.abilities[a.key].save} aria-label={`${a.name} saving throw proficiency`}
          onCheckedChange={(v) => update((x) => { x.abilities[a.key].save = v === true; })} />
        <span className="flex-1 text-sm font-semibold">Saving Throw</span>
        <AutoInput k={`save_${a.key}`} label={`${a.name} saving throw bonus`} className="h-8 w-16" />
      </div>
      {SKILLS[a.key].map((skill: string) => {
        const level = Number(c.skills[skill]) || 0;
        return (
          <div key={skill} className="flex items-center gap-2 px-2 py-0.5">
            <button type="button" aria-label={`${skill} training: ${LEVELS[level]}`} title="Tap: none, Proficient, Expertise"
              onClick={() => update((x) => { x.skills[skill] = (level + 1) % 3; })}
              className={cn('size-7 shrink-0 rounded-md border text-xs font-bold', level ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground')}>
              {['-', 'P', 'E'][level]}
            </button>
            <span className="flex-1 text-sm">{skill}</span>
            <AutoInput k={skillKey(skill)} label={`${skill} bonus`} className="h-8 w-16" />
          </div>
        );
      })}
    </Panel>
  );
}
