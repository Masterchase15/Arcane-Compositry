/**
 * components/homebrew-bar.tsx - the Homebrew filter at the top of the spell,
 * item, class, Component and Spellcrafter pages: show the standard rules only,
 * or include one of your campaigns' homebrew. Only shown to people in a campaign.
 */
import { Link } from 'react-router';
import { Flag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from '@/lib/session';
import { useScope } from '@/lib/catalog';
import { cn } from '@/lib/utils';

const STANDARD = 'standard';

export function HomebrewBar() {
  const { user, groups, setHomebrew } = useSession();
  const { group } = useScope();
  if (!user || !groups.length) return null;
  return (
    <div className={cn('mb-5 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3',
      group ? 'border-gold-line bg-gold-soft' : 'border-dashed')}>
      <span className="flex items-center gap-1.5 font-semibold"><Flag className="size-4 text-gold-ink" />Homebrew</span>
      <Select value={group?.id ?? STANDARD} onValueChange={(v) => setHomebrew(v === STANDARD ? null : v)}>
        <SelectTrigger className="w-64 bg-card" aria-label="Homebrew"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={STANDARD}>Standard rules only</SelectItem>
          {groups.map((g) => <SelectItem key={g.id} value={g.id}>Include {g.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {group && (
        <span className="text-sm">
          {group.role === 'dm' ? 'You are the DM: hidden entries are shown and marked.' : `Showing ${group.name}'s homebrew too.`}{' '}
          <Link className="font-semibold underline underline-offset-4" to={`/campaign/${group.id}`}>Open campaign</Link>
        </span>
      )}
    </div>
  );
}
