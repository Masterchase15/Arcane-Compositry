/**
 * pages/email-links.tsx - the pages opened from emails, and "Forgot password".
 *
 *   /forgot               ask for a password-reset email
 *   /reset?token=...      the link in that email: choose a new password
 *   /verify?token=...     the link in the "confirm your email" email
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/fields';
import { Loading } from '@/components/page';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function EmailLinks() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  if (pathname === '/forgot') return <Forgot />;
  if (pathname === '/reset') return <Reset token={token} />;
  return <Verify token={token} />;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-lg space-y-4 surface p-6">
      <div>
        <p className="kicker">Account</p>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        <hr className="rule-gold mt-3 max-w-xs" />
      </div>
      {children}
    </section>
  );
}

// ── /forgot ──────────────────────────────────────────────────────────────────
function Forgot() {
  const { mailEnabled } = useSession();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!mailEnabled) {
    return (
      <Card title="Forgot your password?">
        <p>Ask the site admin (or your DM, who can pass it on) to set a new one for you.</p>
        <Button asChild variant="outline"><Link to="/account">Back to sign in</Link></Button>
      </Card>
    );
  }
  if (sentTo) {
    return (
      <Card title="Check your email">
        <p>If <b>{sentTo}</b> is the confirmed email on an account, a reset link is on its way. It works once and expires in an hour.</p>
        <p className="text-sm text-muted-foreground">Nothing after a few minutes? Check your spam folder.</p>
        <Button asChild variant="outline"><Link to="/account">Back to sign in</Link></Button>
      </Card>
    );
  }
  return (
    <Card title="Forgot your password?">
      <p>Enter the email on your account. If it is confirmed, we will send you a link to choose a new password.</p>
      <form noValidate className="grid gap-3" onSubmit={async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        try { await api('POST', '/auth/forgot', { email: email.trim() }, { group: null }); setSentTo(email.trim()); }
        catch (err) { setError(errorMessage(err)); }
      }}>
        <Field label="Email" htmlFor="email" error={error}><Input id="email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Button type="submit" className="justify-self-start">Send reset link</Button>
      </form>
      <p className="text-sm text-muted-foreground">Never confirmed your email, or no longer have it? Ask the site admin to set a new password for you.</p>
    </Card>
  );
}

// ── /reset?token= ────────────────────────────────────────────────────────────
function Reset({ token }: { token: string }) {
  const { refresh } = useSession();
  const [pw, setPw] = useState('');
  const [state, setState] = useState<'form' | 'done' | 'bad'>('form');
  const [error, setError] = useState<string | null>(null);
  if (state === 'done') {
    return <Card title="Password changed"><p>You have been signed out everywhere. Sign in with your new password.</p><Button asChild><Link to="/account">Sign in</Link></Button></Card>;
  }
  if (state === 'bad') {
    return <Card title="Link not valid"><p>{error}</p><Button asChild><Link to="/forgot">Send a new link</Link></Button></Card>;
  }
  return (
    <Card title="Choose a new password">
      <form noValidate className="grid gap-3" onSubmit={async (e) => {
        e.preventDefault(); setError(null);
        try { await api('POST', '/auth/reset', { token, password: pw }, { group: null }); await refresh(); setState('done'); }
        catch (err) {
          if (err instanceof ApiError && err.fields?.password) setError(err.fields.password);
          else { setError(errorMessage(err)); setState('bad'); }
        }
      }}>
        <Field label="New password" htmlFor="password" hint="At least 8 characters." error={error}>
          <Input id="password" type="password" autoComplete="new-password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Button type="submit" className="justify-self-start">Save new password</Button>
      </form>
    </Card>
  );
}

// ── /verify?token= ───────────────────────────────────────────────────────────
function Verify({ token }: { token: string }) {
  const { user, refresh } = useSession();
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // the link works once: never send it twice
    started.current = true;
    api('POST', '/auth/verify', { token }, { group: null })
      .then(async () => { await refresh(); setResult({ ok: true }); })
      .catch((err) => setResult({ ok: false, message: errorMessage(err) }));
  }, [token, refresh]);
  if (!result) return <Card title="Confirming your email..."><Loading /></Card>;
  if (!result.ok) return <Card title="Link not valid"><p>{result.message}</p><Button asChild><Link to="/account">Account settings</Link></Button></Card>;
  return (
    <Card title="Email confirmed">
      <p className="flex items-center gap-2"><CircleCheck className="size-5 text-ok" />Thanks! You can now use this address to sign in and to reset your password.</p>
      <Button asChild><Link to={user ? '/campaigns' : '/account'}>{user ? 'Continue' : 'Sign in'}</Link></Button>
    </Card>
  );
}
