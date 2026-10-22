/**
 * components/campaign/party.tsx - the campaign hub's "Party" tab (everyone) and
 * "Rules & homebrew" tab (players).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, Leaf, Plus, ScrollText, Shield, Sparkles, Sword, Users, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NativeSelect, Options } from '@/components/fields';
import { useMyCharacters } from '@/components/list';
import { Empty, ErrorState, Loading } from '@/components/page';
import { Panel } from '@/components/panel';
import { api, errorMessage, type CharacterSummary, type Group } from '@/lib/api';
import { useApi } from '@/lib/catalog';
import { useSession } from '@/lib/session';
import { useScope } from '@/lib/catalog';
import { ARCANE, RULESETS } from '@shared/rules/rulesets.js';

/** Every character in the campaign. You can open your own; DMs can open all of them. */
export function PartyTab({ group }: { group: Group }) {
  const { user } = useSession();
  const isDM = group.role === 'dm';
  const party = useApi<{ characters: CharacterSummary[] }>('/group/characters');
  const mine = useMyCharacters();
  const addable = mine.characters.filter((c) => c.groupId !== group.id);
  const [pick, setPick] = useState('');
  if (party.error) return <ErrorState message={party.error} onRetry={party.reload} />;
  if (!party.data) return <Loading />;
  const characters = party.data.characters;

  const bring = async () => {
    const id = pick || addable[0]?.id;
    if (!id) return;
    try { await api('PUT', `/characters/${id}/campaign`, { groupId: group.id }); toast.success('Character added.'); party.reload(); mine.reload(); setPick(''); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isDM ? 'Every character in this campaign. Open one to view and edit it - hand out XP, items or spells.' : 'The characters in this campaign. Your DM can open and edit the ones in it.'}
        </p>
        <Button asChild size="sm"><Link to={`/characters/new?campaign=${group.id}`}><Plus />New character for this campaign</Link></Button>
      </div>
      {characters.length ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader><TableRow className="bg-header hover:bg-header">
              {['Character', 'Player', 'Class', 'Level', 'Last saved', ''].map((h) => <TableHead key={h} className="text-header-foreground">{h}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {characters.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><b>{c.name}</b></TableCell>
                  <TableCell>{c.ownerName}{c.ownerId === user?.id && ' (you)'}</TableCell>
                  <TableCell>{c.className || '-'}</TableCell>
                  <TableCell className="tabular-nums">{c.level}</TableCell>
                  <TableCell>{new Date(c.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                  <TableCell className="text-right">
                    {(c.ownerId === user?.id || isDM) && <Button asChild size="sm" variant="outline"><Link to={`/characters/${c.id}`}><Eye />Open sheet</Link></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : <Empty icon={<Users />} title="No characters yet">Add one of yours below, or make a new one for this campaign.</Empty>}

      {addable.length > 0 && (
        <Panel title="Bring one of your characters" bodyClassName="space-y-2">
          <div className="flex flex-wrap gap-2">
            <NativeSelect className="w-auto min-w-56" value={pick || addable[0].id} onChange={(e) => setPick(e.target.value)} aria-label="Your character">
              <Options options={addable.map((c) => ({ value: c.id, label: `${c.name}${c.groupName ? ` (now in ${c.groupName})` : ''}` }))} />
            </NativeSelect>
            <Button onClick={bring}><Plus />Add to {group.name}</Button>
          </div>
          <p className="text-sm text-muted-foreground">A character is in one campaign at a time; adding it here moves it.</p>
        </Panel>
      )}
    </div>
  );
}

/**
 * Players do not edit homebrew; this shows the campaign's rulesets and opens the
 * site's lists with them and this campaign's homebrew.
 */
export function HomebrewTab({ group }: { group: Group }) {
  const { setBrowse } = useSession();
  const { uses } = useScope();
  const navigate = useNavigate();
  const lists: [string, LucideIcon, string, string?][] = [
    ['/spells/compositry', Leaf, 'Compositry spells', ARCANE], ['/spells/codified', ScrollText, uses(ARCANE) ? 'Codified spells' : 'Spells'],
    ['/spells/components', Leaf, 'Physical & Aspectual Components', ARCANE], ['/items', Sword, 'Items & Weapons'], ['/classes', Shield, 'Classes & subclasses'],
    ['/craft', Sparkles, 'Spellcrafter', ARCANE],
  ];
  return (
    <div className="space-y-4">
      <RulesetCards rulesets={group.rulesets} />
      <p className="text-muted-foreground">Your DM may also have added or changed spells, items and classes for {group.name} (marked <b>Homebrew</b>). Open a list with this campaign's rules:</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {lists.filter(([, , , needs]) => !needs || uses(needs)).map(([to, Icon, label]) => (
          <button key={to} type="button" onClick={() => { setBrowse({ campaign: group.id }); navigate(to); }}
            className="flex items-center gap-3 surface p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-5" /></span>
            <b className="font-serif">{label}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The rulesets a campaign uses, one card each (the Rules tab, and the DM's Group tab shows the same). */
export function RulesetCards({ rulesets }: { rulesets: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {RULESETS.filter((r: any) => rulesets.includes(r.id)).map((r: any) => (
        <div key={r.id} className="surface p-4">
          <p className="kicker">Ruleset{r.base ? ' · Core rules' : ' · Expansion'}</p>
          <h3 className="font-serif text-lg font-bold">{r.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{r.summary}</p>
          {r.about && <Link className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-4" to={r.about}>Read the rules in the Codex</Link>}
        </div>
      ))}
    </div>
  );
}
