/**
 * pages/campaigns.tsx - "My campaigns" (/campaigns): every campaign you are in,
 * with a button into each one's hub (pages/campaign.tsx), plus joining one with
 * an invite code, starting a new one (you become its DM) and leaving one.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Crown, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/fields';
import { useConfirm } from '@/components/confirm';
import { Empty, PageHead, RequireUser } from '@/components/page';
import { Panel } from '@/components/panel';
import { api, ApiError, errorMessage, type Group } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function Campaigns() {
  return <RequireUser what="see your campaigns"><CampaignList /></RequireUser>;
}

function CampaignList() {
  const { groups, refresh } = useSession();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const enter = async (group: Group, message: string) => {
    await refresh();
    toast.success(message);
    navigate(`/campaign/${group.id}`);
  };
  const leave = async (g: Group) => {
    const ok = await confirm({
      title: 'Leave campaign?', confirmLabel: 'Leave campaign', danger: true,
      message: `You will leave "${g.name}". Your characters in it stay on your account, outside any campaign. If you are the last member, the campaign and its notes, encounters and homebrew are deleted.`,
    });
    if (!ok) return;
    try {
      const { deleted } = await api<{ deleted: boolean }>('DELETE', `/groups/${g.id}/membership`, {}, { group: null });
      await refresh();
      toast.success(deleted ? 'Campaign deleted.' : 'You left the campaign.');
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <>
      <PageHead kicker="Play together" title="My campaigns">
        A campaign is one group at one table: its DM, the party's characters, session notes and the DM's homebrew.
        Everything else on the site - the Codex, Spellcrafter, spells and calculators - works without one.
      </PageHead>
      {groups.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {groups.map((g) => (
            <article key={g.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <p className="kicker flex items-center gap-1">{g.role === 'dm' ? <><Crown className="size-3.5" />You are the DM</> : 'Player'}</p>
              <h3 className="mt-1 text-xl font-semibold">{g.name}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm"><Link to={`/campaign/${g.id}`}><Flag />Enter campaign</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => leave(g)}>Leave</Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty icon={<Flag />} title="No campaigns yet">Join your DM's campaign with their invite code, or start your own.</Empty>
      )}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <CodeForm title="Join a campaign" label="Invite code from your DM" button="Join" field="code" upper
          submit={async (code) => { const { group } = await api<{ group: Group }>('POST', '/groups/join', { code }, { group: null }); await enter(group, `You joined ${group.name}.`); }} />
        <CodeForm title="Start a campaign" label="Campaign name" button="Create" field="name" hint="You will be its DM, and get an invite code to give your players."
          submit={async (name) => { const { group } = await api<{ group: Group }>('POST', '/groups', { name }, { group: null }); await enter(group, `${group.name} created. Its invite code is on the Group tab.`); }} />
      </div>
    </>
  );
}

function CodeForm({ title, label, button, field, hint, upper, submit }: {
  title: string; label: string; button: string; field: string; hint?: string; upper?: boolean; submit: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Panel title={title}>
      <form noValidate onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setError(null);
        try { await submit(value); }
        catch (err) { setError(err instanceof ApiError ? err.fields?.[field] ?? err.message : errorMessage(err)); }
        setBusy(false);
      }}>
        <Field label={label} htmlFor={`f-${field}`} hint={hint} error={error}>
          <div className="flex gap-2">
            <Input id={`f-${field}`} value={value} maxLength={60} autoComplete="off" autoCapitalize={upper ? 'characters' : undefined} spellCheck={false}
              onChange={(e) => setValue(e.target.value)} aria-invalid={!!error} />
            <Button type="submit" disabled={busy}>{button}</Button>
          </div>
        </Field>
      </form>
    </Panel>
  );
}
