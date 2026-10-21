/**
 * components/tab-bar.tsx - underlined tabs for a page's sections (character
 * sheet, campaign hub, spell lists). The gold line slides to the chosen tab.
 *
 *   <TabBar label="Sheet sections" current={tab} onSelect={setTab}
 *     items={[{ id: 'core', label: 'Core' }, { id: 'arcane', label: 'Arcane' }]} />
 *
 * Give an item `to` to make it a link instead (the spell lists).
 */
import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface TabItem { id: string; label: ReactNode; to?: string }

export function TabBar({ items, current, onSelect, label, className }: {
  items: TabItem[]; current: string; onSelect?: (id: string) => void; label: string; className?: string;
}) {
  const lineId = useId();
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1 overflow-x-auto border-b [scrollbar-width:none]', className)}>
      {items.map((t) => {
        const active = t.id === current;
        const cls = cn('relative shrink-0 rounded-t-md px-3 pt-2 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted/60',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground');
        const inner = <>
          {t.label}
          {active && <motion.span layoutId={lineId} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold" transition={{ type: 'spring', stiffness: 520, damping: 42 }} />}
        </>;
        return t.to
          ? <Link key={t.id} to={t.to} role="tab" aria-selected={active} className={cls}>{inner}</Link>
          : <button key={t.id} type="button" role="tab" aria-selected={active} className={cls} onClick={() => onSelect?.(t.id)}>{inner}</button>;
      })}
    </div>
  );
}
