/**
 * components/confirm.tsx - "Are you sure?" dialogs.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Delete character?', message: '...', danger: true })) { ... }
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';

interface Ask { title: string; message: string; confirmLabel?: string; danger?: boolean }
type Confirm = (ask: Ask) => Promise<boolean>;

const ConfirmContext = createContext<Confirm>(async () => false);
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(Ask & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback<Confirm>((ask) => new Promise((resolve) => setState({ ...ask, resolve })), []);
  const finish = (ok: boolean) => { state?.resolve(ok); setState(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={!!state} onOpenChange={(open) => { if (!open) finish(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.title}</AlertDialogTitle>
            <AlertDialogDescription>{state?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={state?.danger ? buttonVariants({ variant: 'destructive' }) : undefined} onClick={() => finish(true)}>
              {state?.confirmLabel ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
