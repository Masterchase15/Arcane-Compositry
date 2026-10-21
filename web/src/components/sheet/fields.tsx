/**
 * components/sheet/fields.tsx - the character sheet's shared state and its inputs.
 *
 * The sheet page (pages/sheet.tsx) holds the character object `c` and puts it
 * in <SheetContext>. Every input here reads and writes `c` by a dotted path:
 *
 *   <TextF path="hp.max" label="HP max" type="number" />   a normal field
 *   <AutoF k="guardMax" label="Guard max" />               an automatic number the player may type over
 *   <CellF list="weapons" index={0} field="name" label="Name" />   a field in a list row
 *
 * Changing any of them recalculates the automatic numbers (derive) and saves
 * the sheet about half a second later.
 *
 * ─── TO ADD A FIELD ────────────────────────────────────────────────────────
 *  1. Give it a default in blankCharacter() (shared/rules/character.js).
 *  2. Add  <TextF path="section.field" label="Label" />  to the right tab
 *     (components/sheet/*-tab.tsx).
 */
import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import * as F from '@shared/rules/formulas.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, NativeSelect, Options, type Option } from '@/components/fields';
import { cn } from '@/lib/utils';

export interface Sheet {
  c: any;              // the character (shared/rules/character.js shape)
  d: any;              // its automatic numbers: derive(c)
  id: string;
  /** Change the character: update((c) => { c.hp.current = 3 }). */
  update: (fn: (c: any) => void) => void;
}
export const SheetContext = createContext<Sheet | null>(null);
export function useSheet() {
  const s = useContext(SheetContext);
  if (!s) throw new Error('useSheet must be inside the character sheet');
  return s;
}

/** Reads a nested value: getPath(obj, 'hp.current'). */
export const getPath = (obj: any, path: string) => path.split('.').reduce((o, key) => (o == null ? undefined : o[key]), obj);
/** Writes a nested value: setPath(obj, 'hp.current', 12). */
export function setPath(obj: any, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((o, key) => (o[key] ??= {}), obj);
  target[last] = value;
}
/** What a number box holds: '' while empty, otherwise the number. */
const asTyped = (value: string, isNumber: boolean) => (isNumber ? (value === '' ? '' : Number(value)) : value);

const labelClass = 'text-sm font-semibold text-foreground/75';

export function TextF({ path, label, type, placeholder, className, min, max }: {
  path: string; label: string; type?: 'number'; placeholder?: string; className?: string; min?: number; max?: number;
}) {
  const { c, update } = useSheet();
  const id = useId();
  const number = type === 'number';
  return (
    <Field label={label} htmlFor={id} className={className}>
      <Input id={id} value={getPath(c, path) ?? ''} placeholder={placeholder}
        {...(number ? { type: 'number', inputMode: 'numeric' as const, min: min ?? 0, max } : { type: 'text', autoComplete: 'off' })}
        onChange={(e) => update((x) => setPath(x, path, asTyped(e.target.value, number)))} />
    </Field>
  );
}

export function AreaF({ path, label, tall }: { path: string; label: string; tall?: boolean }) {
  const { c, update } = useSheet();
  const id = useId();
  return (
    <Field label={label} htmlFor={id} className="sm:col-span-full">
      <Textarea id={id} className={cn('min-h-24', tall && 'min-h-56')} value={getPath(c, path) ?? ''}
        onChange={(e) => update((x) => setPath(x, path, e.target.value))} />
    </Field>
  );
}

export function SelectF({ path, label, options }: { path: string; label: string; options: (string | number | Option)[] }) {
  const { c, update } = useSheet();
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <NativeSelect id={id} value={getPath(c, path) ?? ''} onChange={(e) => update((x) => setPath(x, path, e.target.value))}>
        <Options options={options} />
      </NativeSelect>
    </Field>
  );
}

export function CheckF({ path, label }: { path: string; label: ReactNode }) {
  const { c, update } = useSheet();
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={!!getPath(c, path)} onCheckedChange={(v) => update((x) => setPath(x, path, v === true))} />{label}
    </label>
  );
}

/** Numbers derive() calculates that read better without a + sign. */
const PLAIN = ['passivePerception', 'guardMax', 'chainLength', 'counterCost', 'manaMax', 'saveDC', 'stasisDC'];

/**
 * An automatic number. Blank = use the rule (shown in green as the placeholder);
 * typed = the player's override. Clearing the box goes back to automatic.
 */
export function AutoInput({ k, label, className }: { k: string; label: string; className?: string }) {
  const { c, d, update } = useSheet();
  const saved = c.overrides[k];
  const [text, setText] = useState(saved == null ? '' : String(saved));
  const [focused, setFocused] = useState(false);
  // Follow outside changes (another tab, a reload) while the box is not being typed in.
  useEffect(() => { if (!focused) setText(saved == null ? '' : String(saved)); }, [saved, focused]);
  const value = d.auto[k];
  return (
    <Input value={text} inputMode="numeric" autoComplete="off" aria-label={label}
      title="Calculated automatically. Type to override; clear to go back to automatic."
      placeholder={PLAIN.includes(k) ? String(value) : F.signed(value)}
      className={cn('text-center font-semibold tabular-nums placeholder:font-bold placeholder:text-ok', className)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onChange={(e) => {
        setText(e.target.value);
        const v = e.target.value.trim().replace(/^\+/, '');
        update((x) => { if (v === '' || Number.isNaN(Number(v))) delete x.overrides[k]; else x.overrides[k] = Number(v); });
      }} />
  );
}
export function AutoF({ k, label, hint }: { k: string; label: string; hint?: string }) {
  return <Field label={label} hint={hint}><AutoInput k={k} label={label} /></Field>;
}

/** [-] number [+] for a value that changes during play. Stays between 0 and its maximum. */
export function Stepper({ path, label, max }: { path: string; label: string; max?: number }) {
  const { c, update } = useSheet();
  const step = (delta: number) => update((x) => setPath(x, path, Math.min(max ?? Infinity, Math.max(0, F.num(getPath(x, path)) + delta))));
  return (
    <div className="flex items-stretch gap-1">
      <Button type="button" variant="outline" size="icon" onClick={() => step(-1)} aria-label={`Decrease ${label}`}><Minus /></Button>
      <Input type="number" inputMode="numeric" className="min-w-0 text-center font-serif text-xl font-bold tabular-nums md:text-xl" aria-label={label} value={getPath(c, path) ?? ''}
        onChange={(e) => update((x) => setPath(x, path, asTyped(e.target.value, true)))} />
      <Button type="button" variant="outline" size="icon" onClick={() => step(1)} aria-label={`Increase ${label}`}><Plus /></Button>
    </div>
  );
}

/** Three tappable circles (death saves). Tapping the highest filled one clears it. */
export function Pips({ path, label, fail }: { path: string; label: string; fail?: boolean }) {
  const { c, update } = useSheet();
  const value = Number(getPath(c, path)) || 0;
  return (
    <span className="flex gap-2" role="group" aria-label={label}>
      {[1, 2, 3].map((n) => (
        <button key={n} type="button" aria-pressed={value >= n} aria-label={`${label} ${n}`}
          onClick={() => update((x) => setPath(x, path, value === n ? n - 1 : n))}
          className={cn('size-7 rounded-full border-2 transition-colors', fail ? 'border-destructive' : 'border-primary',
            value >= n && (fail ? 'bg-destructive' : 'bg-primary'))} />
      ))}
    </span>
  );
}

/** A field inside a list row (weapons, compositions, inventory...). */
export function CellF({ list, index, field, label, options, className }: {
  list: string; index: number; field: string; label: string; options?: (string | Option)[]; className?: string;
}) {
  const { c, update } = useSheet();
  const id = useId();
  const value = c[list][index]?.[field] ?? '';
  const set = (v: unknown) => update((x) => { x[list][index][field] = v; });
  return (
    <Field label={label} htmlFor={id} className={className}>
      {options
        ? <NativeSelect id={id} value={value} onChange={(e) => set(e.target.value)}><Options options={options} /></NativeSelect>
        : <Input id={id} value={value} autoComplete="off" onChange={(e) => set(e.target.value)} />}
    </Field>
  );
}

/** A row in one of the sheet's lists: fields, then the row's buttons underneath. */
export function ListRow({ children, actions, active }: { children: ReactNode; actions: ReactNode; active?: boolean }) {
  return (
    <div className={cn('rounded-xl border bg-background/50 p-3.5', active && 'border-ok/60 bg-ok/5')}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{children}</div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

export const SmallLabel = ({ children }: { children: ReactNode }) => <span className={labelClass}>{children}</span>;
