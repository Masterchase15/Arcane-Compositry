/**
 * components/campaign/group.tsx - the campaign hub's "Group" tab (DMs only):
 * the invite code, the campaign's name, its rulesets, and its members (make DM, remove).
 */
import { useState } from 'react';
import { Copy, Crown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConfirm } from '@/components/confirm';
import { ErrorState, Loading } from '@/components/page';
import { Panel } from '@/components/panel';
import { api, errorMessage, type Group } from '@/lib/api';
import { invalidateLists, useApi } from '@/lib/catalog';
import { RulesetPicker } from '@/components/rulesets-bar';
import { findRuleset } from '@shared/rules/rulesets.js';
import { useSession } from '@/lib/session';

interface Member { id: string; username: string; displayName: string; role: 'dm' | 'player'; characters: number }

export function GroupTab({ group }: { group: Group }) {
  const { user, refresh } = useSession();
  const confirm = useConfirm();
  const { data, error, reload } = useApi<{ members: Member[] }>('/group/members');
  const [name, setName] = useState(group.name);
  const [savingRules, setSavingRules] = useState(false);

  const setRulesets = async (rulesets: string[]) => {
    const off = group.rulesets.filter((r) => !rulesets.includes(r)).map((r) => findRuleset(r)?.name);
    if (off.length && !await confirm({ title: `Turn off ${off.join(', ')}?`, confirmLabel: 'Turn off',
      message: `Its spells, items and rules disappear from this campaign, and characters in it stop showing them. Nothing is deleted - turning it back on brings everything back, homebrew included.` })) return;
    setSavingRules(true);
    try { await api('PUT', '/group/rulesets', { rulesets }); await refresh(); invalidateLists(); toast.success('Rulesets saved.'); }
    catch (err) { toast.error(errorMessage(err)); }
    setSavingRules(false);
  };

  const newCode = async () => {
    if (!await confirm({ title: 'Make a new invite code?', message: 'The current code stops working. People already in the campaign stay in.', confirmLabel: 'New code' })) return;
    try { await api('POST', '/group/invite-code'); toast.success('New invite code made.'); await refresh(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const setRole = async (m: Member, role: 'dm' | 'player') => {
    const ok = await confirm({ title: 'Change role?', confirmLabel: 'Change role',
      message: `${m.displayName} will become a ${role === 'dm' ? 'DM of this campaign (can edit its homebrew, notes and every character in it)' : 'player'}.` });
    if (!ok) return;
    try { await api('PUT', `/group/members/${m.id}/role`, { role }); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (m: Member) => {
    const ok = await confirm({ title: 'Remove from campaign?', confirmLabel: 'Remove', danger: true,
      message: `${m.displayName} will leave this campaign. Their account and characters are kept; they can rejoin with the invite code.` });
    if (!ok) return;
    try { await api('DELETE', `/group/members/${m.id}`); toast.success('Removed.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Invite code" bodyClassName="space-y-3">
          <p className="text-sm text-muted-foreground">Give this to your players. They enter it when they create an account, or on the Campaigns page if they already have one.</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md border bg-muted px-3 py-1.5 font-mono text-2xl font-bold tracking-[0.15em]">{group.inviteCode}</code>
            <Button size="sm" variant="outline" onClick={async () => {
              try { await navigator.clipboard.writeText(group.inviteCode ?? ''); toast.success('Invite code copied.'); }
              catch { toast.error('Could not copy. Select the code and copy it by hand.'); }
            }}><Copy />Copy</Button>
            <Button size="sm" variant="ghost" onClick={newCode}><RefreshCw />New code</Button>
          </div>
        </Panel>
        <Panel title="Campaign name">
          <form className="flex gap-2" onSubmit={async (e) => {
            e.preventDefault();
            try { await api('PUT', '/group', { name }); toast.success('Campaign renamed.'); await refresh(); } catch (err) { toast.error(errorMessage(err)); }
          }}>
            <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-label="Campaign name" />
            <Button type="submit" variant="outline">Rename</Button>
          </form>
        </Panel>
      </div>

      <Panel title="Rulesets" bodyClassName="space-y-3">
        <p className="text-sm text-muted-foreground">
          The rules this campaign plays with. Players only see spells, items, classes and sheet sections from these, plus your homebrew.
        </p>
        <RulesetPicker value={group.rulesets} onChange={setRulesets} disabled={savingRules} />
      </Panel>

      <section>
        <h3 className="mb-3 text-xl font-semibold">Members</h3>
        {error ? <ErrorState message={error} onRetry={reload} /> : !data ? <Loading /> : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader><TableRow className="bg-header hover:bg-header">
                {['Player', 'Username', 'Role', 'Characters', ''].map((h) => <TableHead key={h} className="text-header-foreground">{h}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {data.members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell><b>{m.displayName}</b>{m.id === user?.id && ' (you)'}</TableCell>
                    <TableCell>{m.username}</TableCell>
                    <TableCell>{m.role === 'dm' ? <Badge><Crown />DM</Badge> : <Badge variant="secondary">Player</Badge>}</TableCell>
                    <TableCell className="tabular-nums">{m.characters}</TableCell>
                    <TableCell className="text-right">
                      {m.id !== user?.id && (
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setRole(m, m.role === 'dm' ? 'player' : 'dm')}>{m.role === 'dm' ? 'Make player' : 'Make DM'}</Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(m)}>Remove</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-2 text-sm text-muted-foreground">Forgot a password? The site admin can set a new one{user?.isAdmin ? ' (that is you: see Account settings)' : ''}.</p>
      </section>
    </div>
  );
}
