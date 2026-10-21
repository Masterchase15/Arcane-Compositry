/**
 * pages/campaign.tsx - a campaign's hub (/campaign/<id>). The gold campaign
 * banner (components/layout.tsx) shows you are inside it; everything here
 * belongs to this campaign alone.
 *
 * Everyone in the campaign:
 *   Party                      every character in the campaign; add one of yours
 *   Homebrew (players)         browse the site's lists with this campaign's homebrew
 * The campaign's DMs also get the DM tools:
 *   Initiative Tracker         run encounters: turn order, HP, Guard
 *   Spells / Items / Classes   add, edit and remove entries without touching code
 *   NPCs & Enemies             your private roster of stat blocks - never shown to players
 *   Group                      the invite code, the campaign's name, its members
 *   Session notes / Lore       private notebooks, saved as you type
 *
 * Each tab lives in components/campaign/: party.tsx, homebrew.tsx,
 * initiative.tsx, group.tsx and notes.tsx. The open tab (and list) is kept in
 * the address: ?tab=spells&list=compositry.
 */
import { useSearchParams } from 'react-router';
import { PageHead } from '@/components/page';
import { CatalogTab } from '@/components/campaign/homebrew';
import { GroupTab } from '@/components/campaign/group';
import { InitiativeTab } from '@/components/campaign/initiative';
import { NotesTab } from '@/components/campaign/notes';
import { HomebrewTab, PartyTab } from '@/components/campaign/party';
import { useScope } from '@/lib/catalog';
import { cn } from '@/lib/utils';

// [id, label, who sees it]
const TABS: [string, string, 'all' | 'dm' | 'player'][] = [
  ['party', 'Party', 'all'], ['homebrew', 'Homebrew', 'player'],
  ['initiative', 'Initiative Tracker', 'dm'],
  ['spells', 'Spells', 'dm'], ['items', 'Items & Weapons', 'dm'], ['classes', 'Classes', 'dm'], ['npcs', 'NPCs & Enemies', 'dm'],
  ['players', 'Group', 'dm'], ['notes', 'Session notes', 'dm'], ['lore', 'Lore', 'dm'],
];
// Some tabs hold more than one list, chosen with the buttons at the top of the tab.
const LISTS: Record<string, [string, string][]> = {
  spells: [['codified', 'Codified (D&D)'], ['compositry', 'Compositry (custom)'], ['components', 'Physical & Aspectual']],
  classes: [['classes', 'Classes'], ['subclasses', 'Subclasses']],
};

export default function Campaign() {
  const { group, isDM } = useScope();
  const [params, setParams] = useSearchParams();
  if (!group) return null; // CampaignScope (App.tsx) only shows this page for a campaign you are in
  const tabs = TABS.filter(([, , who]) => who === 'all' || (who === 'dm' ? isDM : !isDM));
  const tab = tabs.find(([id]) => id === params.get('tab'))?.[0] ?? 'party';
  const lists = LISTS[tab];
  const list = lists ? (lists.find(([id]) => id === params.get('list'))?.[0] ?? lists[0][0]) : tab;
  const go = (next: Record<string, string>) => setParams(next, { replace: true });

  return (
    <>
      <PageHead kicker={isDM ? 'Dungeon Master' : 'Player'} title={group.name} />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1" role="tablist" aria-label="Campaign">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={id === tab} onClick={() => go({ tab: id })}
            className={cn('shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors', id === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'party' ? <PartyTab group={group} />
          : tab === 'homebrew' ? <HomebrewTab group={group} />
          : tab === 'initiative' ? <InitiativeTab groupId={group.id} />
          : tab === 'players' ? <GroupTab group={group} />
          : tab === 'notes' || tab === 'lore' ? <NotesTab key={tab} kind={tab === 'lore' ? 'lore' : 'session'} />
          : <CatalogTab key={list} listName={list} group={lists ?? null} onPickList={(l) => go({ tab, list: l })} />}
      </div>
    </>
  );
}
