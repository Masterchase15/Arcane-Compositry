/**
 * components/fields.tsx - form building blocks shared by the pages:
 * a labelled field, a plain dropdown (NativeSelect) and an error line.
 * (shadcn's <Select> is used for a few showy dropdowns; NativeSelect is
 * lighter and better for long forms and option groups.)
 */
import type { ComponentProps, ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function Field({ label, htmlFor, hint, error, className, children }: {
  label?: ReactNode; htmlFor?: string; hint?: ReactNode; error?: string | null; className?: string; children: ReactNode;
}) {
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      {label && <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground/75">{label}</Label>}
      {children}
      {hint && <p className="text-[0.8rem] text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
    </div>
  );
}

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn('h-10 w-full rounded-lg border border-input bg-card px-3 py-1 text-[0.95rem] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50', className)}
      {...props}
    />
  );
}

export interface Option { value: string | number; label: string }
/** <option> list from ['A', 'B'] or [{ value, label }]. */
export function Options({ options }: { options: (string | number | Option)[] }) {
  return (
    <>
      {options.map((o) => {
        const opt = typeof o === 'object' ? o : { value: o, label: String(o) };
        return <option key={String(opt.value)} value={opt.value}>{opt.label}</option>;
      })}
    </>
  );
}
