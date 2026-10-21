/**
 * components/calculator.tsx - draws one calculator from lib/calculators.js, and
 * the Momentum Die tracker (also used on the character sheet).
 *
 *   <Calculator id="stability" />            preset={{ pb: 4 }} overrides starting values
 */
import { useId, useMemo, useState } from 'react';
import { Calculator as CalcIcon, Dices, Plus, RefreshCw, Zap } from 'lucide-react';
import * as F from '@shared/rules/formulas.js';
import { CALCULATORS, POTENCY_OPTIONS } from '@/lib/calculators.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field, NativeSelect, Options } from '@/components/fields';
import { cn } from '@/lib/utils';

type Values = Record<string, any>;

export function Calculator({ id, preset = {} }: { id: string; preset?: Values }) {
  const calc = CALCULATORS.find((c: any) => c.id === id);
  if (!calc) return <p className="text-destructive">Unknown calculator "{id}"</p>;
  return (
    <section className="my-5 overflow-hidden rounded-xl border-[1.5px] border-primary/40 bg-card not-prose">
      <header className="flex items-center gap-2 border-b bg-muted px-3.5 py-2.5">
        <CalcIcon className="size-4 text-gold-ink" aria-hidden />
        <h4 className="m-0 font-sans text-[0.95rem] font-bold">{calc.title}</h4>
      </header>
      <div className="grid gap-3.5 p-3.5">
        {calc.custom === 'momentum' ? <MomentumTracker /> : <CalcBody calc={calc} preset={preset} />}
      </div>
    </section>
  );
}

function CalcBody({ calc, preset }: { calc: any; preset: Values }) {
  const uid = useId();
  const [values, setValues] = useState<Values>(() => Object.fromEntries(calc.fields.map((f: any) => [f.key, preset[f.key] ?? f.value])));
  const [rollOut, setRollOut] = useState('');
  const r = useMemo(() => calc.compute(values), [calc, values]);
  const set = (key: string, value: any) => setValues((v) => ({ ...v, [key]: value }));
  const inputs = calc.fields.filter((f: any) => f.type !== 'check');
  const checks = calc.fields.filter((f: any) => f.type === 'check');

  return (
    <>
      <p className="text-sm italic text-muted-foreground">{calc.formula}</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {inputs.map((f: any) => {
          const id = `${uid}-${f.key}`;
          return (
            <Field key={f.key} label={f.label} htmlFor={id} hint={f.hint}>
              {f.type === 'number' ? (
                <Input id={id} type="number" inputMode="numeric" min={f.min} max={f.max} value={values[f.key]}
                  onChange={(e) => set(f.key, F.num(e.target.value, f.value))} />
              ) : (
                <NativeSelect id={id} value={values[f.key]}
                  onChange={(e) => set(f.key, Number.isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}>
                  <Options options={f.type === 'potency' ? POTENCY_OPTIONS : f.options} />
                </NativeSelect>
              )}
            </Field>
          );
        })}
      </div>
      {checks.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {checks.map((f: any) => (
            <label key={f.key} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={!!values[f.key]} onCheckedChange={(c) => set(f.key, c === true)} />{f.label}
            </label>
          ))}
        </div>
      )}
      <Results r={r} />
      {calc.rolls && (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            {calc.rolls.map((roll: any, i: number) => (
              <Button key={i} variant="outline" size="sm" onClick={() => setRollOut(roll.run(values))}><Dices />{roll.label}</Button>
            ))}
          </div>
          {/* Roll text comes from lib/calculators.js (numbers and fixed words only). */}
          <p className="min-h-6 tabular-nums" aria-live="polite" dangerouslySetInnerHTML={{ __html: rollOut }} />
        </div>
      )}
    </>
  );
}

function Results({ r }: { r: any }) {
  return (
    <>
      {r.results?.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
          {r.results.map((x: any) => (
            <div key={x.label} className="rounded-lg bg-accent px-3.5 py-3 text-accent-foreground">
              <span className="text-sm opacity-85">{x.label}</span>
              <span className="block font-serif text-3xl font-bold leading-tight tabular-nums">{x.value}</span>
              {x.note && <span className="text-sm">{x.note}</span>}
            </div>
          ))}
        </div>
      )}
      {r.breakdown?.length > 0 && (
        <ul className="m-0 list-none p-0 text-sm">
          {r.breakdown.map((p: any, i: number) => (
            <li key={i} className={cn('flex justify-between gap-3 border-b border-dotted py-1', p.total && 'mt-1 border-b-0 border-t-2 border-t-primary/60 pt-1.5 font-bold')}>
              <span>{p.label}</span>
              <span className="tabular-nums">{typeof p.value === 'number' && p.value > 0 && i && !p.total ? `+${p.value}` : p.value}</span>
            </li>
          ))}
        </ul>
      )}
      {(r.notes || []).map((t: string, i: number) => (
        // Notes are fixed text from lib/calculators.js (with <b> tags), never something a person typed.
        <p key={i} className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t }} />
      ))}
    </>
  );
}

/** The Momentum Die is a little state machine rather than a formula. */
export function MomentumTracker({ die: controlled, onChange }: { die?: number; onChange?: (die: number) => void }) {
  const [own, setOwn] = useState(4);
  const die = controlled ?? own;
  const [message, setMessage] = useState('');
  const setDie = (d: number) => { setOwn(d); onChange?.(d); };
  const step = F.momentumStep(die);

  const spend = (kind: 'damage' | 'stasis') => {
    const r = F.roll(1, die).total;
    setMessage(kind === 'damage'
      ? `Damage Spend: rolled ${r} on the d${die} - add it to the hit. Reset to d4.`
      : r >= (step.threshold ?? Infinity)
        ? `Stasis: rolled ${r} on the d${die} - ${step.stasis}! Reset to d4.`
        : `Stasis: rolled ${r} on the d${die} (needed ${step.threshold}+) - no effect, no bonus damage. Reset to d4.`);
    setDie(4);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Current Momentum Die">
        {F.MOMENTUM_LADDER.map((s: any) => (
          <Button key={s.die} size="sm" variant={s.die === die ? 'default' : 'outline'} aria-pressed={s.die === die} onClick={() => setDie(s.die)}>d{s.die}</Button>
        ))}
      </div>
      <div className="rounded-lg bg-accent px-3.5 py-3 text-accent-foreground">
        <span className="text-sm opacity-85">Current die</span>
        <span className="block font-serif text-3xl font-bold">d{die}</span>
        <span className="text-sm">
          {step.stasis ? <>Damage Spend: +1d{die} · Stasis: <b>{step.stasis}</b> on {step.threshold}-{die} ({step.chance})</> : 'Baseline only - cannot be spent. Land a hit to build.'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={die === 12} onClick={() => { const d = F.nextMomentumDie(die); setDie(d); setMessage(`Built to d${d}.`); }}><Plus />Hit: build</Button>
        <Button variant="outline" size="sm" disabled={die === 4} onClick={() => spend('damage')}><Zap />Spend: Damage</Button>
        <Button variant="outline" size="sm" disabled={die === 4} onClick={() => spend('stasis')}><Dices />Spend: Stasis</Button>
        <Button variant="outline" size="sm" disabled={die === 4} onClick={() => { setDie(4); setMessage('Direct enemy damage: Momentum Die reset to d4.'); }}><RefreshCw />Took a direct hit</Button>
      </div>
      <p className="min-h-6" aria-live="polite">{message}</p>
    </div>
  );
}

export { Label };
