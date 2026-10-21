/**
 * components/page.tsx - small pieces every page uses: the page heading, loading
 * and empty states, "please sign in", and text with paragraphs.
 */
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { AlertTriangle, Loader2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

/** Page title with the small gold label above and the gold rule below. */
export function PageHead({ kicker, title, children, actions, className }: {
  kicker?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string;
}) {
  return (
    <header className={cn('mb-8', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {kicker && <p className="kicker mb-2">{kicker}</p>}
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-[2.6rem]">{title}</h1>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <hr className="rule-gold mt-4 w-24" />
      {children && <div className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{children}</div>}
    </header>
  );
}

export function Loading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden /> {label}
    </div>
  );
}

/** A friendly empty or info state in a dashed box. */
export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      {icon && <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground ring-8 ring-accent/40 [&_svg]:size-6">{icon}</div>}
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <div className="mx-auto mt-2 max-w-md text-muted-foreground">{children}</div>}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Empty icon={<AlertTriangle />} title="This could not be loaded" action={onRetry && <Button onClick={onRetry}>Try again</Button>}>
      {message}
    </Empty>
  );
}

/** Shows "sign in to ..." instead of the page when nobody is signed in. */
export function RequireUser({ what, children }: { what: string; children: ReactNode }) {
  const { user, loaded } = useSession();
  const location = useLocation();
  if (!loaded) return <Loading />;
  if (user) return <>{children}</>;
  return (
    <Empty icon={<UserRound />} title={`Sign in to ${what}`}
      action={<Button asChild><Link to={`/account?next=${encodeURIComponent(location.pathname)}`}>Sign in or create an account</Link></Button>}>
      Characters and campaigns are saved to your account so you can open them on any device.
    </Empty>
  );
}

/** Plain text with blank lines between paragraphs, shown safely as paragraphs. */
export function Paragraphs({ text, className }: { text?: string | null; className?: string }) {
  const parts = String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={cn('space-y-3', className)}>
      {parts.map((p, i) => (
        <p key={i}>{p.split('\n').map((line, j) => <span key={j}>{j > 0 && <br />}{line}</span>)}</p>
      ))}
    </div>
  );
}
