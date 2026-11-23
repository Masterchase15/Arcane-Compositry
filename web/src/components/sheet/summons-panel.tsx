/**
 * components/sheet/summons-panel.tsx - the "Summons & Familiars" panel on the sheet's
 * Core & Combat tab.
 *
 * Each row is a creature from the Summons & Familiars list (c.summons, shape in
 * shared/rules/character.js). A row keeps a copy of its stat block (`snapshot`), its
 * own hit points, and - when its stat block changes with them - the spell level it was
 * cast at or a Dynamic companion's level (lib/summons.ts works out the numbers).
 *
 * Its HP is shared live with the DM's Initiative Tracker, like the character's own
 * (pages/sheet.tsx and server/routes/characters.js): a hit in the tracker shows here
 * within a few seconds, and a change here reaches the tracker.
 */
import { useState } from 'react';
import { BookOpen, Heart, PawPrint } from 'lucide-react';
import { toast } from 'sonner';
import * as F from '@shared/rules/formulas.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, NativeSelect } from '@/components/fields';
import { Panel } from '@/components/panel';
import { DetailDialog, Picker, SummonDetail } from '@/components/details';
import { useSummons } from '@/lib/catalog';
import { isDynamic, passivePerception, sheetSummonRow, summonStats } from '@/lib/summons';
import { CellF, ListRow, Stepper, TextF, useSheet } from './fields';
import { RemoveRow } from './rows';

export function SummonsPanel() {
  const { c, d, update } = useSheet();
  const summons = useSummons();
  const [picking, setPicking] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const rows: any[] = c.summons || [];

  /** Changes a row's spell or companion level; its max HP follows and current HP moves by the same amount. */
  const relevel = (i: number, patch: { castLevel?: number; level?: number }) => update((x) => {
    const row = x.summons[i];
    Object.assign(row, patch);
    const st = summonStats(row.snapshot, { castLevel: row.castLevel, level: row.level });
    if (st.hpN === '') return;
    const before = F.num(row.hpMax);
    row.hpMax = st.hpN;
    row.hp = Math.max(0, Math.min(st.hpN, F.num(row.hp) + st.hpN - before));
  });

  const open = viewing !== null ? rows[viewing] : null;
  return (
    <Panel title="Summons & Familiars" bodyClassName="space-y-3">
      {rows.length ? rows.map((row, i) => {
        const s = row.snapshot;
        const st = summonStats(s, { castLevel: row.castLevel, level: row.level });
        const low = row.hpMax !== '' && F.num(row.hp) <= F.num(row.hpMax) / 2;
        const pp = passivePerception(s.senses);
        return (
          <ListRow key={row.id} active={!low} actions={<>
            <Button type="button" size="sm" variant="outline" onClick={() => setViewing(i)}><BookOpen />Details</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => update((x) => { x.summons[i].hp = x.summons[i].hpMax; })}><Heart />Full HP</Button>
            <span className="ml-auto" /><RemoveRow list="summons" index={i} />
          </>}>
            <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-4">
              <Badge variant="outline">{row.category}{st.dynamic ? ' · Dynamic' : ''}</Badge>
              {row.name !== s.name && <span className="text-xs text-muted-foreground">{s.name}</span>}
              {F.num(row.hp) === 0 && row.hpMax !== '' ? <Badge variant="outline" className="text-destructive">0 HP</Badge>
                : low && <Badge variant="outline" className="text-destructive">Bloodied</Badge>}
            </div>
            <CellF list="summons" index={i} field="name" label="Name" className="col-span-2" />
            {s.spellLevel > 0 && (
              <Field label="Cast at level" htmlFor={`sum-cast-${row.id}`}>
                <NativeSelect id={`sum-cast-${row.id}`} value={String(st.castLevel)} onChange={(e) => relevel(i, { castLevel: Number(e.target.value) })}>
                  {Array.from({ length: 10 - s.spellLevel }, (_, k) => s.spellLevel + k).map((n) => <option key={n} value={n}>Level {n}</option>)}
                </NativeSelect>
              </Field>
            )}
            {st.dynamic && (
              <Field label="Level" htmlFor={`sum-lvl-${row.id}`} hint={st.level !== d.level ? `You are level ${d.level}` : undefined}>
                <div className="flex gap-1">
                  <Input id={`sum-lvl-${row.id}`} type="number" inputMode="numeric" min={1} max={20} value={row.level}
                    onChange={(e) => relevel(i, { level: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })} />
                  {st.level !== d.level && <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => relevel(i, { level: d.level })} title="Set to your level">= {d.level}</Button>}
                </div>
              </Field>
            )}
            <Field label="HP" className="col-span-2"><Stepper path={`summons.${i}.hp`} label={`${row.name} hit points`} max={row.hpMax === '' ? Infinity : F.num(row.hpMax)} /></Field>
            <TextF path={`summons.${i}.hpMax`} label="Max HP" type="number" />
            <TextF path={`summons.${i}.tempHp`} label="Temp HP" type="number" />
            <dl className="col-span-2 grid grid-cols-3 gap-2 text-center sm:col-span-4 sm:grid-cols-6">
              {[['AC', st.ac], ['Init.', st.initiative], ['Speed', s.speed], ['Passive Perc.', pp], ['PB', st.dynamic ? F.signed(st.pb) : ''], ['CR', st.dynamic ? '' : s.cr?.split(' ')[0]]]
                .filter(([, v]) => v).map(([label, v]) => (
                  <div key={label} className="rounded-md border bg-card px-1.5 py-1">
                    <dt className="text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-semibold">{v}</dd>
                  </div>
                ))}
            </dl>
            <CellF list="summons" index={i} field="notes" label="Notes" className="col-span-2 sm:col-span-4" />
          </ListRow>
        );
      }) : <p className="text-sm text-muted-foreground">No summons, familiars or companions yet. Add one when a spell or feature calls it up.</p>}
      <Button type="button" size="sm" onClick={() => setPicking(true)}><PawPrint />Add from Summons &amp; Familiars</Button>
      <p className="text-xs text-muted-foreground">Their HP stays in step with the DM&apos;s Initiative Tracker when they fight alongside you.</p>

      <Picker open={picking} onOpenChange={setPicking} title="Add a summon, familiar or companion" emptyText="The Summons & Familiars list is empty."
        entries={summons.data ?? []}
        describe={(s: any) => [s.category === 'Companion' ? `Companion (${isDynamic(s) ? 'Dynamic' : 'Static'})` : s.category, s.summonedBy.length && `from ${s.summonedBy.join(', ')}`, s.ac && `AC ${s.ac}`, s.hp && `HP ${s.hp}`].filter(Boolean).join(' · ')}
        onPick={(s: any) => { update((x) => { (x.summons ??= []).push(sheetSummonRow(s, d.level)); }); toast.success(`${s.name} added.`); }} />
      {open && (
        <DetailDialog open wide onOpenChange={(o) => { if (!o) setViewing(null); }} title={open.name} footer={<Button onClick={() => setViewing(null)}>Back to sheet</Button>}>
          <SummonDetail key={`${open.id}-${open.castLevel}-${open.level}`} s={open.snapshot} castLevel={open.castLevel} level={open.level} fixed onClose={() => setViewing(null)} />
        </DetailDialog>
      )}
    </Panel>
  );
}
