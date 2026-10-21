/**
 * components/sheet/rows.tsx - adding and removing rows in the sheet's lists,
 * and the details pop-ups for things added from the site's lists.
 */
import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/confirm';
import { ComponentDetail, DetailDialog, ItemDetail, SpellDetail } from '@/components/details';
import { useItems, useSpells } from '@/lib/catalog';
import { blankComposition, inventoryRow } from '@/lib/spellbook';
import { useSheet } from './fields';

/** Blank rows for the sheet's lists. */
export const NEW_ROW: Record<string, () => any> = {
  weapons: () => ({ name: '', atk: '', damage: '', chain: '', notes: '' }),
  inventory: () => inventoryRow(null),
  compositions: blankComposition,
  discoveries: () => ({ name: '', uses: '', benefit: '', signature: '', notes: '' }),
};

export function AddRow({ list, label }: { list: string; label: string }) {
  const { update } = useSheet();
  return <Button type="button" size="sm" variant="outline" onClick={() => update((c) => { c[list].push(NEW_ROW[list]()); })}><Plus />{label}</Button>;
}

/** Remove a row; asks first when it has anything filled in. */
export function RemoveRow({ list, index }: { list: string; index: number }) {
  const { c, update } = useSheet();
  const confirm = useConfirm();
  const row = c[list][index];
  const remove = async () => {
    const filled = Object.entries(row).some(([k, v]) => !['id', 'status', 'qty', 'category'].includes(k) && v !== '' && v != null && v !== false && v !== 0);
    if (filled && !await confirm({ title: 'Remove this row?', message: `"${row.name || 'This row'}" will be removed from the sheet.`, confirmLabel: 'Remove', danger: true })) return;
    update((x) => { x[list].splice(index, 1); });
  };
  return <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove} aria-label={`Remove ${row.name || 'row'}`}><Trash2 />Remove</Button>;
}

type Showing = { kind: 'spell'; list: string; id: string } | { kind: 'item'; id: string } | { kind: 'component'; c: any } | null;

/**
 * Read about a spell, item or Component without leaving the sheet.
 *   const details = useDetails();   details.show({ kind: 'item', id });   {details.dialog}
 */
export function useDetails() {
  const [showing, setShowing] = useState<Showing>(null);
  const spells = useSpells();
  const items = useItems();
  const close = () => setShowing(null);
  let title = '';
  let body: React.ReactNode = null;
  if (showing?.kind === 'spell') {
    const s = (spells.data as any)?.[showing.list]?.find((x: any) => x.id === showing.id);
    if (s) { title = s.name; body = <SpellDetail list={showing.list} s={s} />; }
  } else if (showing?.kind === 'item') {
    const it = items.data?.find((x) => x.id === showing.id);
    if (it) { title = it.name; body = <ItemDetail it={it} />; }
  } else if (showing?.kind === 'component') {
    title = showing.c.name; body = <ComponentDetail c={showing.c} />;
  }
  const loaded = showing?.kind === 'spell' ? !!spells.data : showing?.kind === 'item' ? !!items.data : true;
  const missing = !!showing && loaded && !body;
  useEffect(() => {
    if (!missing || !showing) return;
    toast.error(`Details for this ${showing.kind} are not available (it may be hidden or removed).`);
    setShowing(null);
  }, [missing, showing]);
  return {
    show: setShowing,
    dialog: body && (
      <DetailDialog open onOpenChange={(o) => { if (!o) close(); }} title={title} footer={<Button onClick={close}>Back to sheet</Button>}>{body}</DetailDialog>
    ),
  };
}

export function DetailsButton({ onClick, label = 'Item details' }: { onClick: () => void; label?: string }) {
  return <Button type="button" size="sm" variant="outline" onClick={onClick}><BookOpen />{label}</Button>;
}
