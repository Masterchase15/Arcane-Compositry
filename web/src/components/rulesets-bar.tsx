/**
 * components/rulesets-bar.tsx - the Rulesets filter at the top of the spell,
 * item, class, Component and Spellcrafter pages, and the badges that say where
 * an entry comes from.
 *
 *   <RulesetsBar />        pick the rulesets to show (5e is always on), or use
 *                          one of your campaigns: its rulesets and its homebrew
 *   <RulesetPicker />      switches for choosing a campaign's rulesets
 *   <RulesetOff />         in place of a page whose ruleset is switched off
 *   <OriginBadge entry />  "Homebrew" / "Homebrew (edited)" on a DM's entries
 *   <OriginLine entry />   "Ruleset: D&D 5th Edition (SRD 5.2)" under a detail
 *
 * The rulesets themselves are listed in shared/rules/rulesets.js.
 */
import { Link } from 'react-router';
import { BookOpen, Check, Flag, Library, Lock } from 'lucide-react';
import { RULESETS, findRuleset } from '@shared/rules/rulesets.js';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSession } from '@/lib/session';
import { useScope } from '@/lib/catalog';
import { cn } from '@/lib/utils';

const NO_CAMPAIGN = 'none';

export function RulesetsBar() {
  const { user, groups, browse, setBrowse } = useSession();
  const { group, rulesets } = useScope();
  const toggle = (id: string) =>
    setBrowse({ rulesets: rulesets.includes(id) ? rulesets.filter((r) => r !== id) : [...rulesets, id] });

  return (
    <div className={cn('mb-5 space-y-3 rounded-xl border px-4 py-3', group ? 'border-gold-line bg-gold-soft' : 'border-dashed')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 flex items-center gap-1.5 font-semibold"><Library className="size-4 text-gold-ink" />Rulesets</span>
        {RULESETS.map((r: any) => {
          const on = rulesets.includes(r.id);
          const locked = r.base || !!group;
          return (
            <button key={r.id} type="button" disabled={locked} aria-pressed={on} onClick={() => toggle(r.id)}
              title={r.base ? `${r.name} is the base rules and always on.` : group ? `Set by ${group.name}'s DM.` : r.summary}
              className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition',
                on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:border-primary/60',
                locked ? 'cursor-default' : 'cursor-pointer')}>
              {on ? (r.base ? <Lock className="size-3.5" /> : <Check className="size-3.5" />) : null}{r.name}
            </button>
          );
        })}
        {user && groups.length > 0 && (
          <Select value={browse.campaign && group ? group.id : NO_CAMPAIGN} onValueChange={(v) => setBrowse({ campaign: v === NO_CAMPAIGN ? null : v })}>
            <SelectTrigger className="ml-auto w-64 bg-card" aria-label="Campaign"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CAMPAIGN}>No campaign</SelectItem>
              {groups.map((g) => <SelectItem key={g.id} value={g.id}>Use {g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      {group && (
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
          <Flag className="size-4 text-gold-ink" />
          {group.role === 'dm'
            ? <>Showing {group.name}'s rulesets and homebrew. You are the DM: hidden entries are shown and marked.</>
            : <>Showing {group.name}'s rulesets and homebrew, as its DM set them.</>}
          <Link className="font-semibold underline underline-offset-4" to={`/campaign/${group.id}`}>Open campaign</Link>
        </p>
      )}
    </div>
  );
}

/** Switch rulesets on and off (starting a campaign, and the DM's Group tab). The base ruleset is always on. */
export function RulesetPicker({ value, onChange, disabled }: { value: string[]; onChange: (rulesets: string[]) => void; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      {RULESETS.map((r: any) => {
        const on = r.base || value.includes(r.id);
        return (
          <label key={r.id} className={cn('flex items-start gap-3 rounded-lg border bg-card p-3', !r.base && !disabled && 'cursor-pointer hover:border-primary/60')}>
            <Switch className="mt-1" checked={on} disabled={r.base || disabled}
              onCheckedChange={(checked) => onChange(checked ? [...value, r.id] : value.filter((x) => x !== r.id))} />
            <span className="min-w-0">
              <b>{r.name}</b>{r.base && <span className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Always on</span>}
              <span className="block text-sm text-muted-foreground">{r.summary}</span>
              {r.about && <Link className="text-sm font-semibold text-primary underline underline-offset-4" to={r.about}>Read the rules</Link>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * In place of a page that needs a ruleset that is switched off here
 * (e.g. the Spellcrafter in a campaign that does not use Arcane Compositry).
 */
export function RulesetOff({ ruleset, what }: { ruleset: string; what: string }) {
  const { group } = useScope();
  const { setBrowse } = useSession();
  const r = findRuleset(ruleset);
  return (
    <div className="surface flex flex-col items-start gap-3 p-6">
      <h2 className="font-serif text-xl font-bold">{what} is part of {r?.name}</h2>
      <p className="text-muted-foreground">
        {group
          ? <>{group.name} does not use {r?.name}{group.role === 'dm' ? <>. You can turn it on in the campaign's <Link className="font-semibold underline underline-offset-4" to={`/campaign/${group.id}?tab=players`}>Group tab</Link>.</> : '. Its DM can turn it on.'}</>
          : <>{r?.name} is switched off in the Rulesets filter above.</>}
      </p>
      {!group && <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setBrowse({ rulesets: [...RULESETS.map((x: any) => x.id)] })}>Turn every ruleset on</button>}
    </div>
  );
}

/** Marks what a campaign's DM added ("Homebrew") or changed ("Homebrew (edited)"). */
export function OriginBadge({ entry, className }: { entry: { origin?: string }; className?: string }) {
  if (entry.origin !== 'custom' && entry.origin !== 'override') return null;
  return (
    <Badge variant="outline" className={cn('ml-1 border-primary/40 bg-accent text-accent-foreground', className)}>
      {entry.origin === 'custom' ? 'Homebrew' : 'Homebrew (edited)'}
    </Badge>
  );
}

/** Where an entry comes from: its ruleset and source, or the campaign's homebrew. */
export function OriginLine({ entry }: { entry: { origin?: string; ruleset?: string; source?: string } }) {
  const { group } = useScope();
  const ruleset = findRuleset(entry.ruleset);
  const homebrew = entry.origin === 'custom' || entry.origin === 'override';
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-sm italic text-muted-foreground">
      <BookOpen className="size-3.5" />
      {homebrew
        ? <>Homebrew{group ? ` from ${group.name}` : ''}{entry.origin === 'override' && ruleset ? ` (edited from ${ruleset.name})` : ''}{entry.source ? ` · ${entry.source}` : ''}</>
        : <>{ruleset ? ruleset.name : 'Ruleset'}{entry.source ? ` · ${entry.source}` : ''}</>}
    </p>
  );
}
