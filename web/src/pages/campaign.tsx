/**
 * pages/campaign.tsx - a campaign's hub (/campaign/<id>). The gold campaign
 * banner (components/layout.tsx) shows you are inside it; everything here
 * belongs to this campaign alone.
 *
 * Everyone in the campaign:
 *   Party                      every character in the campaign; add one of yours
 *   Rules (players)            the campaign's rulesets; browse the lists with its homebrew
 * The campaign's DMs also get the DM tools:
 *   Initiative Tracker         run encounters: turn order, HP, Guard
 *   Spells / Items / Classes   add, edit and remove entries without touching code
 *   NPCs & Enemies             your private roster of stat blocks - never shown to players
 *   Group                      the invite code, the campaign's name, its rulesets, its members
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
import { TabBar } from '@/components/tab-bar';
import { useScope } from '@/lib/catalog';
import { ARCANE } from '@shared/rules/rulesets.js';

// [id, label, who sees it]
const TABS: [string, string, 'all' | 'dm' | 'player'][] = [
  ['party', 'Party', 'all'], ['homebrew', 'Rules & homebrew', 'player'],
  ['initiative', 'Initiative Tracker', 'dm'],
  ['spells', 'Spells', 'dm'], ['items', 'Items & Weapons', 'dm'], ['classes', 'Classes', 'dm'], ['npcs', 'NPCs & Enemies', 'dm'],
  ['players', 'Group', 'dm'], ['notes', 'Session notes', 'dm'], ['lore', 'Lore', 'dm'],
];
// Some tabs hold more than one list, chosen with the buttons at the top of the tab.
// [list, label, ruleset it needs (if any)]
const LISTS: Record<string, [string, string, string?][]> = {
  spells: [['codified', 'Codified (D&D)'], ['compositry', 'Compositry (custom)', ARCANE], ['components', 'Physical & Aspectual', ARCANE]],
  classes: [['classes', 'Classes'], ['subclasses', 'Subclasses']],
};

export default function Campaign() {
  const { group, isDM, uses } = useScope();
  const [params, setParams] = useSearchParams();
  if (!group) return null; // CampaignScope (App.tsx) only shows this page for a campaign you are in
  const tabs = TABS.filter(([, , who]) => who === 'all' || (who === 'dm' ? isDM : !isDM));
  const tab = tabs.find(([id]) => id === params.get('tab'))?.[0] ?? 'party';
  const lists = LISTS[tab]?.filter(([, , needs]) => !needs || uses(needs)).map(([id, label]) => [id, label] as [string, string]);
  const list = lists ? (lists.find(([id]) => id === params.get('list'))?.[0] ?? lists[0][0]) : tab;
  // With only one list left (no Arcane Compositry), there is nothing to choose between.
  const choices = lists && lists.length > 1 ? lists : null;
  const go = (next: Record<string, string>) => setParams(next, { replace: true });

  return (
    <>
      <PageHead kicker={isDM ? 'Dungeon Master' : 'Player'} title={group.name} />
      <TabBar className="mb-6" label="Campaign" current={tab} items={tabs.map(([id, label]) => ({ id, label }))} onSelect={(id) => go({ tab: id })} />
      <div role="tabpanel">
        {tab === 'party' ? <PartyTab group={group} />
          : tab === 'homebrew' ? <HomebrewTab group={group} />
          : tab === 'initiative' ? <InitiativeTab groupId={group.id} />
          : tab === 'players' ? <GroupTab group={group} />
          : tab === 'notes' || tab === 'lore' ? <NotesTab key={tab} kind={tab === 'lore' ? 'lore' : 'session'} />
          : <CatalogTab key={list} listName={list} group={choices} onPickList={(l) => go({ tab, list: l })} />}
      </div>
    </>
  );
}
