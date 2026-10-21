/**
 * components/ask-for-email.tsx - asks an account made before emails were
 * collected to add one. Shown once: "Not now" stops it for good.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/fields';
import { api, errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';

export function AskForEmail() {
  const { user, mailEnabled, refresh } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (!user?.askForEmail || dismissed) return null;

  const skip = async () => {
    setDismissed(true);
    await api('POST', '/auth/email/skip', {}, { group: null }).catch(() => {});
    toast('You can add one any time under Account settings.');
  };
  const save = async () => {
    try {
      await api('PUT', '/auth/email', { email }, { group: null });
      setDismissed(true);
      await refresh();
      toast.success(mailEnabled ? 'Saved. Check your inbox for a link to confirm it.' : 'Email saved.');
    } catch (err) { setError(errorMessage(err)); }
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open) setDismissed(true); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Add your email</DialogTitle>
          <DialogDescription>
            Accounts now have an email address. It is private (only you and the site admin see it), lets you sign in with it,{' '}
            {mailEnabled ? 'and lets you reset your password yourself if you forget it.' : 'and will be used for password resets.'}
          </DialogDescription>
        </DialogHeader>
        <Field label="Email" htmlFor="prompt-email" error={error}>
          <Input id="prompt-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <DialogFooter><Button variant="outline" onClick={skip}>Not now</Button><Button onClick={save}>Add email</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
