/**
 * components/campaign/party.tsx - the campaign hub's "Party" tab (everyone) and
 * "Homebrew" tab (players).
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

/** Players do not edit homebrew; this opens the site's lists with this campaign's homebrew included. */
export function HomebrewTab({ group }: { group: Group }) {
  const { setHomebrew } = useSession();
  const navigate = useNavigate();
  const lists: [string, LucideIcon, string][] = [
    ['/spells/compositry', Leaf, 'Compositry spells'], ['/spells/codified', ScrollText, 'Codified spells'],
    ['/spells/components', Leaf, 'Physical & Aspectual Components'], ['/items', Sword, 'Items & Weapons'], ['/classes', Shield, 'Classes & subclasses'],
    ['/craft', Sparkles, 'Spellcrafter'],
  ];
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Your DM may have added or changed spells, items and classes for {group.name}. Open a list with this campaign's homebrew included:</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {lists.map(([to, Icon, label]) => (
          <button key={to} type="button" onClick={() => { setHomebrew(group.id); navigate(to); }}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition hover:border-primary">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-5" /></span>
            <b className="font-serif">{label}</b>
          </button>
        ))}
      </div>
    </div>
  );
}
