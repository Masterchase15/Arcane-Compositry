/**
 * pages/account.tsx - sign in, create an account (/account). Once signed in:
 * your email (add, change, confirm), change password, and - for the site
 * admin - every account on the site, with "Set password" for anyone locked
 * out. Campaigns are on pages/campaigns.tsx; the pages opened from emailed
 * links (and "Forgot password") are in pages/email-links.tsx.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AlertTriangle, Eye, EyeOff, Flag, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Field } from '@/components/fields';
import { Loading, PageHead } from '@/components/page';
import { Panel } from '@/components/panel';
import { Stat, StatGrid } from '@/components/details';
import { api, ApiError, errorMessage } from '@/lib/api';
import { invalidateLists, useApi } from '@/lib/catalog';
import { useSession } from '@/lib/session';

export default function Account() {
  const { user, loaded } = useSession();
  if (!loaded) return <Loading />;
  return user ? <Profile /> : <SignIn />;
}

/** Field errors from the server ({ fields: { email: '...' } }) plus one message for the form. */
function useFormErrors() {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  return {
    fields, message,
    clear: () => { setFields({}); setMessage(null); },
    show: (err: unknown) => {
      if (err instanceof ApiError && err.fields) { setFields(err.fields); setMessage(err.message); }
      else { setFields({}); setMessage(errorMessage(err)); }
    },
  };
}

// ── Sign in / create an account ──────────────────────────────────────────────
function SignIn() {
  const { inviteRequired, mailEnabled, refresh } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/characters';
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', displayName: '', password: '', inviteCode: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const errors = useFormErrors();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { errors.clear(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [creating]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); errors.clear();
    try {
      const body = creating ? form : { username: form.username, password: form.password };
      const { joinedGroup } = await api<{ joinedGroup?: string }>('POST', `/auth/${creating ? 'register' : 'login'}`, body, { group: null });
      const me = await refresh();
      invalidateLists();
      toast.success(creating
        ? (mailEnabled ? `Welcome, ${me.user?.displayName}! Check your email to confirm your address.` : `Welcome, ${me.user?.displayName}!`)
        : 'Signed in.');
      // An invite code took them into a campaign: go straight to it.
      navigate(joinedGroup ? `/campaign/${joinedGroup}` : next.startsWith('/') ? next : '/characters');
    } catch (err) { errors.show(err); setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="surface p-6">
        <p className="kicker">{creating ? 'New here?' : 'Welcome back'}</p>
        <h1 className="mt-1 text-3xl font-bold">{creating ? 'Create an account' : 'Sign in'}</h1>
        <hr className="rule-gold mt-3 mb-5 max-w-xs" />
        {errors.message && (
          <p className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 font-semibold text-destructive" role="alert">
            <AlertTriangle className="size-4" />{errors.message}
          </p>
        )}
        <form noValidate onSubmit={submit} className="grid gap-4">
          <Field label={creating ? 'Username *' : 'Username or email *'} htmlFor="username" error={errors.fields.username}
            hint={creating ? '3-24 letters, numbers, dashes or underscores. Other players see this.' : undefined}>
            <Input id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={form.username} onChange={set('username')} aria-invalid={!!errors.fields.username} />
          </Field>
          {creating && <>
            <Field label="Email *" htmlFor="email" error={errors.fields.email} hint="Private - only you and the site admin see it. You can sign in with it, and reset your password if you forget it.">
              <Input id="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={form.email} onChange={set('email')} aria-invalid={!!errors.fields.email} />
            </Field>
            <Field label="Display name" htmlFor="displayName" hint="How your name appears to the DM. Optional.">
              <Input id="displayName" autoComplete="nickname" maxLength={40} value={form.displayName} onChange={set('displayName')} />
            </Field>
          </>}
          <Field label="Password *" htmlFor="password" error={errors.fields.password} hint={creating ? 'At least 8 characters. Your password manager can save it.' : undefined}>
            <div className="flex gap-1.5">
              <Input id="password" type={showPw ? 'text' : 'password'} autoComplete={creating ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} aria-invalid={!!errors.fields.password} />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}>
                {showPw ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </Field>
          {creating && (
            <Field label={`Invite code${inviteRequired ? ' *' : ''}`} htmlFor="inviteCode" error={errors.fields.inviteCode}
              hint={inviteRequired ? 'Your DM gives this to their players. It also adds you to their campaign.' : "Optional. Your DM's campaign invite code adds you to their campaign straight away."}>
              <Input id="inviteCode" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={form.inviteCode} onChange={set('inviteCode')} aria-invalid={!!errors.fields.inviteCode} />
            </Field>
          )}
          <Button type="submit" disabled={busy}>{busy ? 'One moment...' : creating ? 'Create account' : 'Sign in'}</Button>
        </form>
        <p className="mt-4 text-muted-foreground">
          {creating ? 'Already have an account?' : 'No account yet?'}{' '}
          <Button variant="link" className="px-1" onClick={() => setCreating((c) => !c)}>{creating ? 'Sign in instead' : 'Create one'}</Button>
        </p>
        {!creating && (mailEnabled
          ? <p className="text-sm"><Link className="font-semibold text-primary underline underline-offset-4" to="/forgot">Forgot your password?</Link></p>
          : <p className="text-sm text-muted-foreground">Forgot your password? Ask the site admin (or your DM, who can pass it on) to set a new one for you.</p>)}
      </section>
      <aside className="space-y-4">
        <div className="rounded-xl border border-gold-line bg-gold-soft/60 p-4">
          <h4 className="font-sans text-sm font-bold uppercase tracking-wide text-gold-ink">Why an account?</h4>
          <p className="mt-1">Your characters are saved to your account, so the sheet you edit on your phone at the table is the same one on your desktop at home.</p>
        </div>
        <div className="surface p-4">
          <h4 className="font-sans text-sm font-bold uppercase tracking-wide text-gold-ink">No account needed for</h4>
          <ul className="mt-1 list-disc pl-5">
            <li>Reading the <Link className="underline" to="/codex">Field Codex</Link></li>
            <li>Using the <Link className="underline" to="/craft">Spellcrafter</Link> and <Link className="underline" to="/tools">calculators</Link></li>
            <li>Browsing the <Link className="underline" to="/spells">spell lists</Link></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ── Account settings ─────────────────────────────────────────────────────────
function Profile() {
  const { user, groups, mailEnabled, refresh } = useSession();
  const u = user!;
  return (
    <>
      <PageHead kicker="Account" title={u.displayName} />
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Details" bodyClassName="space-y-3">
          <StatGrid>
            <Stat label="Username" value={u.username} />
            <Stat label="Email" value={u.email
              ? <span className="flex flex-wrap items-center gap-1.5 break-all">{u.email}{u.emailVerified ? <Badge variant="secondary">Confirmed</Badge> : <Badge variant="outline" className="border-gold-line bg-gold-soft text-gold-ink">Not confirmed</Badge>}</span>
              : <span className="text-muted-foreground">None</span>} />
            <Stat label="Campaigns" value={String(groups.length)} />
            {u.isAdmin && <Stat label="Site role" value="Admin" />}
          </StatGrid>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link to="/characters"><Users />My characters</Link></Button>
            <Button asChild variant="outline"><Link to="/campaigns"><Flag />My campaigns</Link></Button>
          </div>
        </Panel>

        <EmailPanel hasEmail={!!u.email} email={u.email} verified={u.emailVerified} mailEnabled={mailEnabled} onSaved={refresh} />
        <PasswordPanel />
      </div>
      {u.isAdmin && <AdminAccounts />}
    </>
  );
}

function EmailPanel({ hasEmail, email, verified, mailEnabled, onSaved }: { hasEmail: boolean; email: string; verified: boolean; mailEnabled: boolean; onSaved: () => void }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const errors = useFormErrors();
  const [sent, setSent] = useState(false);
  const resend = async () => {
    setSent(true);
    try { await api('POST', '/auth/verify/resend', {}, { group: null }); toast.success('Sent. Check your inbox (and spam folder).'); }
    catch (err) { toast.error(errorMessage(err)); }
  };
  const save = async (e: FormEvent) => {
    e.preventDefault(); errors.clear();
    try {
      await api('PUT', '/auth/email', { email: form.email, password: form.password }, { group: null });
      setForm({ email: '', password: '' });
      toast.success(mailEnabled ? 'Saved. Check that inbox for a link to confirm it.' : 'Email saved.');
      onSaved();
    } catch (err) { errors.show(err); }
  };
  return (
    <Panel title={hasEmail ? 'Change email' : 'Add an email'} bodyClassName="space-y-3">
      {hasEmail && !verified && mailEnabled && (
        <p className="text-sm">
          We sent a link to <b>{email}</b>. Open it to confirm the address - until then it cannot be used to reset your password.{' '}
          <Button variant="outline" size="sm" disabled={sent} onClick={resend}>Send it again</Button>
        </p>
      )}
      <form noValidate onSubmit={save} className="grid gap-3">
        <Field label={hasEmail ? 'New email' : 'Email'} htmlFor="new-email" error={errors.fields.email}>
          <Input id="new-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>
        {hasEmail && (
          <Field label="Your password" htmlFor="email-pw" error={errors.fields.password}>
            <Input id="email-pw" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </Field>
        )}
        {errors.message && !Object.keys(errors.fields).length && <p className="text-sm font-semibold text-destructive">{errors.message}</p>}
        <Button type="submit" variant="outline" className="justify-self-start">{hasEmail ? 'Change email' : 'Add email'}</Button>
      </form>
    </Panel>
  );
}

function PasswordPanel() {
  const [form, setForm] = useState({ current: '', next: '' });
  const errors = useFormErrors();
  const save = async (e: FormEvent) => {
    e.preventDefault(); errors.clear();
    try { await api('POST', '/auth/password', form, { group: null }); setForm({ current: '', next: '' }); toast.success('Password updated.'); }
    catch (err) { errors.show(err); }
  };
  return (
    <Panel title="Change password">
      <form noValidate onSubmit={save} className="grid gap-3">
        <Field label="Current password" htmlFor="current" error={errors.fields.current}>
          <Input id="current" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} />
        </Field>
        <Field label="New password" htmlFor="next" hint="At least 8 characters." error={errors.fields.next}>
          <Input id="next" type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} />
        </Field>
        {errors.message && !Object.keys(errors.fields).length && <p className="text-sm font-semibold text-destructive">{errors.message}</p>}
        <Button type="submit" className="justify-self-start">Update password</Button>
      </form>
    </Panel>
  );
}

/** Site admin only: every account, with "Set password". (Admins are made on the server: npm run make-admin.) */
function AdminAccounts() {
  const { user } = useSession();
  const { data } = useApi<{ users: any[] }>('/admin/users');
  const [target, setTarget] = useState<any>(null);
  return (
    <Panel title="All accounts" className="mt-6" bodyClassName="space-y-3">
      <p className="text-sm text-muted-foreground">
        You are the site admin. Set a temporary password for anyone who is locked out and tell them in person.
        Admins are added or removed on the server with <code className="rounded bg-muted px-1">npm run make-admin</code>.
      </p>
      {!data ? <Loading /> : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Campaigns</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {data.users.map((x) => (
                <TableRow key={x.id}>
                  <TableCell><b>{x.displayName}</b>{x.isAdmin && <Badge className="ml-1.5" variant="outline">Admin</Badge>}{x.id === user?.id && ' (you)'}</TableCell>
                  <TableCell>{x.username}</TableCell>
                  <TableCell>{x.email || '-'}{x.email && !x.emailVerified && <span className="text-xs text-muted-foreground"> (not confirmed)</span>}</TableCell>
                  <TableCell>{x.groups || '-'}</TableCell>
                  <TableCell className="text-right">{x.id !== user?.id && <Button size="sm" variant="outline" onClick={() => setTarget(x)}>Set password</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {target && <SetPassword person={target} onClose={() => setTarget(null)} />}
    </Panel>
  );
}

function SetPassword({ person, onClose }: { person: any; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    try { await api('PUT', `/admin/users/${person.id}/password`, { password: pw }, { group: null }); toast.success('Password updated.'); onClose(); }
    catch (err) { setError(errorMessage(err)); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">New password for {person.displayName}</DialogTitle>
          <DialogDescription>Set a temporary password and tell them in person. They are signed out everywhere and can change it under Account settings.</DialogDescription>
        </DialogHeader>
        <Field label="Temporary password" htmlFor="temp-pw" hint="At least 8 characters." error={error}>
          <Input id="temp-pw" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Set password</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
