/**
 * components/sheet/arcane-tab.tsx - the sheet's "Arcane" tab (page 2 of the
 * printed sheet): Mana, Catalyst, Tendril, the known Arcane language, the
 * Compositions table, Applied Thaumaturgy, Circuit Stability and discoveries.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { Droplet, Leaf, Plus, RefreshCw, ScrollText, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { ABILITIES, COMPONENTS, findComponent, FORMS, ROMAN, SPELL_STATUSES } from '@shared/rules/constants.js';
import * as F from '@shared/rules/formulas.js';
import { Button } from '@/components/ui/button';
import { Picker } from '@/components/details';
import { Panel } from '@/components/panel';
import { cn } from '@/lib/utils';
import { AreaF, AutoF, CellF, ListRow, SelectF, SmallLabel, Stepper, TextF, getPath, setPath, useSheet } from './fields';
import { AddRow, DetailsButton, RemoveRow, useDetails } from './rows';

const grid = 'grid gap-3 sm:grid-cols-2';

export function ArcaneTab() {
  const { c, d, id, update } = useSheet();
  const details = useDetails();
  const [learning, setLearning] = useState<'Physical' | 'Aspectual' | null>(null);
  const learnPath = learning === 'Physical' ? 'language.physicals' : 'language.aspectuals';

  const cast = (i: number) => {
    const row = c.compositions[i];
    const cost = F.num(row.mana);
    if (cost > F.num(c.arcane.manaCurrent)) { toast.error(`Not enough Mana: ${row.name || 'this spell'} costs ${cost}, you have ${F.num(c.arcane.manaCurrent)}.`); return; }
    const left = F.num(c.arcane.manaCurrent) - cost;
    update((x) => { x.arcane.manaCurrent = left; });
    toast(`${row.name || 'Spell'} cast: ${cost} Mana spent, ${left} left.`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Arcane Core" bodyClassName="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1"><SmallLabel>Mana current</SmallLabel><Stepper path="arcane.manaCurrent" label="current Mana" max={d.manaMax} /></div>
          <AutoF k="manaMax" label="Mana max" />
          <SelectF path="casterType" label="Mana pool type" options={Object.entries(F.CASTER_TYPES).map(([value, t]: [string, any]) => ({ value, label: t.label }))} />
          <SelectF path="arcane.invocationAbility" label="Invocation ability" options={ABILITIES.map((a: any) => ({ value: a.key, label: a.name }))} />
          <AutoF k="invocationMod" label="Invocation mod" />
          <AutoF k="arcaneAttack" label="Arcane attack" hint="d20 + PB + IM" />
          <AutoF k="saveDC" label="Save DC" hint="8 + PB + IM" />
          <SelectF path="arcane.maxPotency" label="Max Potency" options={ROMAN.slice(1).map((r: string, i: number) => ({ value: i + 1, label: r }))} />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => { update((x) => { x.arcane.manaCurrent = d.manaMax; }); toast(`Mana restored to ${d.manaMax}.`); }}>
          <RefreshCw />Long rest: restore Mana
        </Button>
      </Panel>

      <div className="grid gap-5">
        <Panel title="Catalyst" bodyClassName={grid}>
          <TextF path="catalyst.name" label="Catalyst name / type" /><TextF path="catalyst.bond" label="Bond / location" />
          <TextF path="catalyst.capacity" label="Capacity" /><TextF path="catalyst.throughput" label="Throughput" /><TextF path="catalyst.stored" label="Stored Mana" />
        </Panel>
        <Panel title="Tendril Scripture" bodyClassName={grid}>
          <TextF path="tendril.rootNode" label="Root node" /><TextF path="tendril.color" label="Color / signature" /><TextF path="tendril.terminals" label="Terminals" />
          <AreaF path="tendril.routing" label="Routing / gesture notes" />
        </Panel>
      </div>

      <Panel title="Known Arcane Language" className="lg:col-span-2" bodyClassName="space-y-4">
        <p className="text-sm text-muted-foreground">
          What this character has learned so far. New Components are discovered during the campaign - tap a name to read about it.
          Browse them all under <Link className="font-semibold text-primary underline" to={`/spells/components?char=${id}`}>Spells &gt; Physical &amp; Aspectual</Link>.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {(['Physical', 'Aspectual'] as const).map((kind) => {
            const path = kind === 'Physical' ? 'language.physicals' : 'language.aspectuals';
            const known: string[] = getPath(c, path);
            return (
              <div key={kind} className="space-y-2">
                <SmallLabel>{kind === 'Physical' ? 'Physicals' : 'Aspectuals'} known</SmallLabel>
                <div className="flex flex-wrap gap-1.5">
                  {known.length ? known.map((name) => (
                    <span key={name} className={cn('inline-flex items-center overflow-hidden rounded-full border text-sm font-semibold',
                      kind === 'Aspectual' ? 'border-gold-line bg-gold-soft text-gold-ink' : 'border-primary/30 bg-accent text-accent-foreground')}>
                      <button type="button" className="py-0.5 pr-1 pl-3 hover:underline" aria-label={`${name} details`}
                        onClick={() => { const comp = findComponent(name); if (comp) details.show({ kind: 'component', c: comp }); else toast.error('Details for this Component are not available (it may be hidden or removed).'); }}>{name}</button>
                      <button type="button" className="px-1.5 py-0.5 opacity-70 hover:opacity-100" aria-label={`Remove ${name}`}
                        onClick={() => update((x) => setPath(x, path, known.filter((v) => v !== name)))}><X className="size-3.5" /></button>
                    </span>
                  )) : <span className="text-sm text-muted-foreground">None learned yet.</span>}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setLearning(kind)}><Plus />Learn {kind === 'Physical' ? 'a Physical' : 'an Aspectual'}</Button>
                {kind === 'Physical' && c.language.otherPhysicals && <TextF path="language.otherPhysicals" label="Other physicals (old notes)" />}
                {kind === 'Aspectual' && c.language.otherAspectuals && <TextF path="language.otherAspectuals" label="Other aspectuals (old notes)" />}
              </div>
            );
          })}
          <div className="space-y-2">
            <SmallLabel>Forms known</SmallLabel>
            <div className="flex flex-wrap gap-1.5">
              {FORMS.map((f: any) => {
                const on = c.language.forms.includes(f.name);
                return (
                  <button key={f.name} type="button" aria-pressed={on}
                    onClick={() => update((x) => { x.language.forms = on ? x.language.forms.filter((v: string) => v !== f.name) : [...x.language.forms, f.name]; })}
                    className={cn('rounded-full border px-3 py-0.5 text-sm font-semibold', on ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/30 bg-accent text-accent-foreground')}>
                    {f.name}
                  </button>
                );
              })}
            </div>
            <TextF path="language.otherForms" label="Other forms" />
          </div>
        </div>
        <AreaF path="language.compositeNotes" label="Composite notes" />
      </Panel>

      <Panel title="Compositions, Codified Spells & Improvisations" className="lg:col-span-2" bodyClassName="space-y-3">
        {c.compositions.length ? c.compositions.map((row: any, i: number) => (
          <ListRow key={row.id ?? i} actions={<>
            {row.spellId && <DetailsButton label="Spell details" onClick={() => details.show({ kind: 'spell', list: row.list, id: row.spellId })} />}
            <Button type="button" size="sm" variant="outline" onClick={() => cast(i)}><Droplet />Cast (spend {F.num(row.mana)} Mana)</Button>
            <RemoveRow list="compositions" index={i} />
          </>}>
            <CellF list="compositions" index={i} field="level" label="P / L" />
            <CellF list="compositions" index={i} field="name" label="Name" className="sm:col-span-3" />
            <CellF list="compositions" index={i} field="components" label="Components" />
            <CellF list="compositions" index={i} field="form" label="Form" />
            <CellF list="compositions" index={i} field="mana" label="Mana" />
            <CellF list="compositions" index={i} field="range" label="Range" />
            <CellF list="compositions" index={i} field="atkdc" label="Atk / DC" />
            <CellF list="compositions" index={i} field="damage" label="Damage / effect" className="sm:col-span-2" />
            <CellF list="compositions" index={i} field="status" label="Status" options={SPELL_STATUSES} />
          </ListRow>
        )) : <p className="text-sm text-muted-foreground">Nothing here yet. Build a spell in the Spellcrafter or add one from the spell lists.</p>}
        <p className="text-sm text-muted-foreground">Status: Improvised, Codified, Prepared, Signature.</p>
        <div className="flex flex-wrap gap-2">
          <AddRow list="compositions" label="Add blank row" />
          <Button asChild size="sm" variant="outline"><Link to="/craft"><Sparkles />Spellcrafter</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to={`/spells/codified?char=${id}`}><ScrollText />Codified spells</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to={`/spells/compositry?char=${id}`}><Leaf />Compositry spells</Link></Button>
        </div>
      </Panel>

      <Panel title="Applied Thaumaturgy" bodyClassName={grid}>
        <AreaF path="thaumaturgy.infusion" label="Current infusion / augmentation" />
        <TextF path="thaumaturgy.chargePool" label="Arcane Charge Pool" placeholder="6d6" />
        <TextF path="thaumaturgy.reinforcement" label="Reinforcement" placeholder="+4" />
        <TextF path="thaumaturgy.duration" label="Duration" />
      </Panel>
      <Panel title="Circuit Stability & Counter-Compositry" bodyClassName={grid}>
        <AutoF k="stabilityBonus" label="Stability bonus" hint="PB + IM" />
        <TextF path="stability.dcModifiers" label="DC modifiers" />
        <AutoF k="counterBonus" label="Counter bonus" hint="PB + IM" />
        <AreaF path="stability.notes" label="Counter / interruption notes" />
      </Panel>

      <Panel title="Arcane Discovery & Codification" className="lg:col-span-2" bodyClassName="space-y-3">
        {c.discoveries.length ? c.discoveries.map((_row: any, i: number) => (
          <ListRow key={i} actions={<RemoveRow list="discoveries" index={i} />}>
            <CellF list="discoveries" index={i} field="name" label="Discovery / working name" className="col-span-2" />
            <CellF list="discoveries" index={i} field="uses" label="Uses / research" className="col-span-2" />
            <CellF list="discoveries" index={i} field="benefit" label="Codification benefit" className="col-span-2" />
            <CellF list="discoveries" index={i} field="signature" label="Signature / route change" className="col-span-2" />
            <CellF list="discoveries" index={i} field="notes" label="Notes" className="col-span-2 sm:col-span-4" />
          </ListRow>
        )) : <p className="text-sm text-muted-foreground">Found a useful interaction? Record it here. Repeated use turns experimentation into technique.</p>}
        <AddRow list="discoveries" label="Add discovery" />
      </Panel>

      <Picker open={!!learning} onOpenChange={(o) => { if (!o) setLearning(null); }} title={`Learn ${learning === 'Physical' ? 'a Physical' : 'an Aspectual'} Component`}
        intro="Only add a Component your character has actually learned in the campaign."
        emptyText="There is nothing new to learn right now. Your DM reveals more Components as the campaign goes on."
        entries={(COMPONENTS as any[]).filter((x) => x.kind === learning && !getPath(c, learnPath).includes(x.name))}
        describe={(x: any) => x.description.split('\n')[0]}
        onPick={(x: any) => { update((ch) => setPath(ch, learnPath, [...getPath(ch, learnPath), x.name])); toast.success(`${x.name} learned.`); }} />
      {details.dialog}
    </div>
  );
}
