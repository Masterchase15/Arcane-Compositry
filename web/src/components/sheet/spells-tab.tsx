/**
 * components/sheet/spells-tab.tsx - the sheet's "Spells" tab for campaigns that
 * play plain D&D 5e (no Arcane Compositry - see shared/rules/rulesets.js):
 * spellcasting ability, save DC and attack, spell slots, and the spell list.
 *
 * It replaces the Arcane tab there. The spell list is the same `compositions`
 * table the Arcane tab uses, so a character keeps its spells if the campaign
 * switches rulesets. Slot numbers come from F.spellSlots() (shared/rules/formulas.js)
 * and can be overridden on the sheet (e.g. for a Warlock's Pact Magic).
 */
import { Link } from 'react-router';
import { RefreshCw, ScrollText, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { ABILITIES } from '@shared/rules/constants.js';
import * as F from '@shared/rules/formulas.js';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/panel';
import { AutoF, AutoInput, CellF, ListRow, SelectF, SmallLabel, Stepper, useSheet } from './fields';
import { AddRow, DetailsButton, RemoveRow, useDetails } from './rows';

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const STATUSES = ['Prepared', 'Known', 'Always prepared', 'Ritual'];
const CASTER_TYPES = [{ value: 'full', label: 'Full caster' }, { value: 'partial', label: 'Half caster' }, { value: 'martial', label: 'Not a spellcaster' }];

export function SpellsTab() {
  const { c, d, id, update } = useSheet();
  const details = useDetails();
  const used = (i: number) => F.num(c.spellcasting.slotsUsed[i]);
  const levels = d.slotMax.map((max: number, i: number) => ({ level: i + 1, max })).filter((s: { max: number }) => s.max > 0);

  const cast = (i: number) => {
    const row = c.compositions[i];
    const level = Number.parseInt(row.level, 10);
    if (!level) { toast(`${row.name || 'Cantrip'} cast - cantrips use no slot.`); return; }
    // The lowest slot of the spell's level or higher that is still free.
    const slot = d.slotMax.findIndex((max: number, j: number) => j >= level - 1 && used(j) < max);
    if (slot < 0) { toast.error(`No spell slot of level ${level} or higher left. A long rest restores them.`); return; }
    update((x) => { x.spellcasting.slotsUsed[slot] = used(slot) + 1; });
    toast(`${row.name || 'Spell'} cast with a ${ordinal(slot + 1)}-level slot.`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Spellcasting" bodyClassName="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SelectF path="casterType" label="Caster type" options={CASTER_TYPES} />
          <SelectF path="arcane.invocationAbility" label="Spellcasting ability" options={ABILITIES.map((a: any) => ({ value: a.key, label: a.name }))} />
          <AutoF k="invocationMod" label="Ability modifier" />
          <AutoF k="spellAttack" label="Spell attack" hint="d20 + PB + mod" />
          <AutoF k="saveDC" label="Spell save DC" hint="8 + PB + mod" />
        </div>
      </Panel>

      <Panel title="Spell slots" bodyClassName="space-y-3">
        {levels.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {levels.map(({ level, max }: { level: number; max: number }) => (
              <div key={level} className="space-y-1.5 rounded-lg border bg-card p-2.5">
                <SmallLabel>{ordinal(level)} level · {Math.max(0, max - used(level - 1))} left</SmallLabel>
                <Stepper path={`spellcasting.slotsUsed.${level - 1}`} label={`${ordinal(level)}-level slots used`} max={max} />
                <AutoInput k={`slot${level}`} label={`${ordinal(level)}-level slots`} className="text-sm" />
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No spell slots at this level and caster type. Change the caster type if this character casts spells.</p>}
        <p className="text-xs text-muted-foreground">The steppers count slots <b>used</b>. The small box is the maximum - type over it for Pact Magic or a DM ruling.</p>
        <Button type="button" size="sm" variant="outline" onClick={() => { update((x) => { x.spellcasting.slotsUsed = Array(9).fill(0); }); toast('Spell slots restored.'); }}>
          <RefreshCw />Long rest: restore slots
        </Button>
      </Panel>

      <Panel title="Spells" className="lg:col-span-2" bodyClassName="space-y-3">
        {c.compositions.length ? c.compositions.map((row: any, i: number) => (
          <ListRow key={row.id ?? i} actions={<>
            {row.spellId && <DetailsButton label="Spell details" onClick={() => details.show({ kind: 'spell', list: row.list, id: row.spellId })} />}
            <Button type="button" size="sm" variant="outline" onClick={() => cast(i)}><Wand2 />Cast</Button>
            <RemoveRow list="compositions" index={i} />
          </>}>
            <CellF list="compositions" index={i} field="level" label="Level" />
            <CellF list="compositions" index={i} field="name" label="Name" className="sm:col-span-3" />
            <CellF list="compositions" index={i} field="components" label="Components" />
            <CellF list="compositions" index={i} field="range" label="Range" />
            <CellF list="compositions" index={i} field="atkdc" label="Atk / DC" />
            <CellF list="compositions" index={i} field="damage" label="Damage / effect" className="sm:col-span-2" />
            <CellF list="compositions" index={i} field="status" label="Status" options={STATUSES} />
          </ListRow>
        )) : <p className="text-sm text-muted-foreground">No spells yet. Add them from the spell list, or add a blank row.</p>}
        <div className="flex flex-wrap gap-2">
          <AddRow list="compositions" label="Add blank row" />
          <Button asChild size="sm" variant="outline"><Link to={`/spells/codified?char=${id}`}><ScrollText />Spell list</Link></Button>
        </div>
      </Panel>
    </div>
  );
}
