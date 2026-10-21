/**
 * components/panel.tsx - a card with a dark title bar, like the panels on the
 * printed character sheet. Used by forms, the sheet and the Spellcrafter.
 */
import type { ReactNode } from 'react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

export function Panel({ title, actions, className, bodyClassName, children }: {
  title: ReactNode; actions?: ReactNode; className?: string; bodyClassName?: string; children: ReactNode;
}) {
  return (
    <section className={cn('surface overflow-hidden', className)}>
      <header className="flex min-h-13 items-center justify-between gap-2 border-b bg-muted/40 px-5 py-2.5">
        <h3 className="flex items-center gap-2.5 font-serif text-lg font-semibold">
          <span className="h-4.5 w-1 rounded-full bg-gold" aria-hidden />{title}
        </h3>
        {actions && <div className="flex gap-1.5">{actions}</div>}
      </header>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** A big number with a label, like the results of a calculator. */
export function ResultTile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-accent px-4 py-3 text-accent-foreground">
      <span className="text-sm font-semibold opacity-85">{label}</span>
      <span className="block font-serif text-3xl font-bold leading-tight tabular-nums"><RollingNumber value={value} /></span>
      {note && <span className="text-sm">{note}</span>}
    </div>
  );
}

/** A whole number rolls smoothly to its new value when it changes; anything else ("6d8", "+3") is shown as it is. */
export function RollingNumber({ value }: { value: ReactNode }) {
  const n = typeof value === 'number' && Number.isInteger(value) ? value
    : typeof value === 'string' && /^-?\d+$/.test(value) ? Number(value) : null;
  return n === null ? <>{value}</> : <NumberTicker value={n} startValue={n} />;
}
