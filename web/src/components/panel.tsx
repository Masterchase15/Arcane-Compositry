/**
 * components/panel.tsx - a card with a dark title bar, like the panels on the
 * printed character sheet. Used by forms, the sheet and the Spellcrafter.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Panel({ title, actions, className, bodyClassName, children }: {
  title: ReactNode; actions?: ReactNode; className?: string; bodyClassName?: string; children: ReactNode;
}) {
  return (
    <section className={cn('overflow-hidden rounded-xl border-[1.5px] border-primary/35 bg-card shadow-xs', className)}>
      <header className="flex items-center justify-between gap-2 bg-header px-4 py-2.5 text-header-foreground">
        <h3 className="font-serif text-base font-bold text-header-foreground">{title}</h3>
        {actions && <div className="flex gap-1.5">{actions}</div>}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

/** A big number with a label, like the results of a calculator. */
export function ResultTile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-lg bg-accent px-3.5 py-3 text-accent-foreground">
      <span className="text-sm opacity-85">{label}</span>
      <span className="block font-serif text-3xl font-bold leading-tight tabular-nums">{value}</span>
      {note && <span className="text-sm">{note}</span>}
    </div>
  );
}
