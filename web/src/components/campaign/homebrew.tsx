/**
 * components/campaign/homebrew.tsx - a campaign DM's editors for spells, items,
 * classes, Components, subclasses and NPCs (the Spells, Items & Weapons,
 * Classes and NPCs tabs of the campaign hub, pages/campaign.tsx).
 *
 * Entries saved here go to the database, for this campaign only. Entries from
 * the data/ files are shown as "File" - editing one here saves an override;
 * "Undo edits" brings the file version back.
 *
 * Every spell, Component, item and class is either PUBLIC (players see it) or
 * HIDDEN (only the campaign's DMs see it). The Hide / Publish button flips it,
 * for file entries too - so you can prepare things ahead and reveal them later.
 *
 * ─── TO ADD A FIELD TO A DM FORM ───────────────────────────────────────────
 *  Add one line to that list's `fields` in CATALOG below, and make the server
 *  keep it (the matching validate function in server/catalog.js).
 *  Field types: text, number, select, textarea, bool (tick box),
 *               checks (several tick boxes), list (comma separated), lines.
 */
import { useState, type ReactNode } from 'react';
import { BookOpen, Check, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SCHOOLS, CLASS_NAMES, ANY_CLASS, FORMS, ROMAN, ABILITIES, ITEM_CATEGORIES, ITEM_RARITIES, COMPONENT_KINDS, NPC_KINDS } from '@shared/rules/constants.js';
import { codifiedSpellMana } from '@shared/rules/formulas.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConfirm } from '@/components/confirm';
import { DetailDialog, NpcDetail, SubclassDetail } from '@/components/details';
import { Field, NativeSelect, Options } from '@/components/fields';
import { SearchInput, matchesWords } from '@/components/list';
import { ErrorState, Loading } from '@/components/page';
import { api, errorMessage } from '@/lib/api';
import { invalidateLists, useCatalogList } from '@/lib/catalog';
import { cn } from '@/lib/utils';

interface FormField {
  key: string; label: string; type?: string; value?: any; options?: any[]; required?: boolean; wide?: boolean; tall?: boolean; short?: boolean;
  hint?: string; placeholder?: string; min?: number; suggestions?: string[]; toText?: (list: any[]) => string; get?: (e: any) => any;
}
interface ListDef {
  noun: string; file: string; dmOnly?: boolean;
  view?: (s: any) => ReactNode;
  columns: [string, (s: any) => ReactNode][];
  fields: () => FormField[];
}

// ── What the DM can edit: one entry per list ─────────────────────────────────
const classChecks = () => [ANY_CLASS, ...CLASS_NAMES].map((c: any) => ({ value: c, label: c === ANY_CLASS ? 'Any class' : c }));
const abilityOptions = ABILITIES.map((a: any) => ({ value: a.key, label: a.name }));
const VISIBILITY = {
  key: 'hidden', label: 'Visibility', type: 'select', value: false,
  options: [{ value: 'false', label: 'Public - players can see it' }, { value: 'true', label: 'Hidden - only the DM sees it (publish it later)' }],
};
const SHARED_END = [
  { key: 'tags', label: 'Tags', type: 'list', hint: 'Search keywords, separated by commas: damage, fire, area' },
  { key: 'source', label: 'Source', placeholder: 'Homebrew' },
  VISIBILITY,
];
const DESCRIPTION = { key: 'description', label: 'Description', type: 'textarea', tall: true, required: true, hint: 'Leave a blank line between paragraphs.' };

/** "3 | Rage | text" lines for the class form, and back again. */
const featureLines = (list: any) => (list || []).map((f: any) => [f.level, f.name, f.text].join(' | ')).join('\n');
const subclassLines = (list: any) => (list || []).map((s: any) => [s.name, s.text, s.features.map((f: any) => `${f.level} ${f.name}`).join('; ')].join(' | ')).join('\n');

const namedLines = (list: any) => (list || []).map((x: any) => `${x.name} | ${x.text}`).join('\n');
const NAMED_HINT = 'One per line:  Name | What it does      e.g.  Multiattack | Makes two Spear attacks.';

export const CATALOG: Record<string, ListDef> = {
  codified: {
    noun: 'Codified spell', file: 'data/spells/codified.js',
    columns: [['Lvl', (s: any) => s.level || 'C'], ['Name', (s: any) => <b>{s.name}</b>], ['School', (s: any) => s.school], ['Classes', (s: any) => s.classes.join(', ')], ['Mana', (s: any) => codifiedSpellMana(s.level)]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'level', label: 'Level', type: 'select', value: 1, options: [...Array(10).keys()].map((n: any) => ({ value: n, label: n ? `Level ${n} (${codifiedSpellMana(n)} Mana)` : 'Cantrip (0 Mana)' })) },
      { key: 'school', label: 'School (type)', type: 'select', value: 'Evocation', options: SCHOOLS },
      { key: 'classes', label: 'Classes that may learn it', type: 'checks', required: true, options: classChecks() },
      { key: 'castingTime', label: 'Casting time', placeholder: 'Action' },
      { key: 'range', label: 'Range', placeholder: '60 feet' },
      { key: 'components', label: 'Components', placeholder: 'V, S, M (...)' },
      { key: 'duration', label: 'Duration', placeholder: 'Instantaneous' },
      { key: 'concentration', label: 'Concentration', type: 'bool' },
      { key: 'ritual', label: 'Ritual', type: 'bool' },
      DESCRIPTION,
      { key: 'higherLevels', label: 'Using more Mana (higher levels)', type: 'textarea' },
      ...SHARED_END,
    ],
  },
  compositry: {
    noun: 'Compositry spell', file: 'data/spells/compositry.js',
    columns: [['Pot.', (s: any) => ROMAN[s.potency]], ['Name', (s: any) => <b>{s.name}</b>], ['School', (s: any) => s.school], ['Classes', (s: any) => s.classes.join(', ')], ['Mana', (s: any) => s.mana]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'potency', label: 'Potency', type: 'select', value: 1, options: ROMAN.slice(1).map((r: any, i: any) => ({ value: i + 1, label: r })) },
      { key: 'mana', label: 'Final Mana', type: 'number', required: true, hint: 'After any codification discount. The Spellcrafter gives this number.' },
      { key: 'school', label: 'School (type)', type: 'select', value: 'Evocation', options: SCHOOLS },
      { key: 'classes', label: 'Classes that may learn it', type: 'checks', required: true, options: classChecks() },
      { key: 'physicals', label: 'Physical Components', type: 'list', hint: 'Separate with commas: Geo, Water' },
      { key: 'aspectuals', label: 'Aspectual Components', type: 'list', hint: 'Separate with commas: Fire' },
      { key: 'form', label: 'Form', suggestions: FORMS.map((f: any) => f.name) },
      { key: 'range', label: 'Range', placeholder: '60 feet' },
      { key: 'area', label: 'Area', placeholder: '20-foot burst' },
      { key: 'duration', label: 'Duration', placeholder: 'Instantaneous' },
      { key: 'damage', label: 'Damage / main effect', placeholder: '6d6 fire' },
      { key: 'resolution', label: 'Resolution', placeholder: 'DEX save for half' },
      { key: 'effect', label: 'Extra effect' },
      { key: 'creator', label: 'Created by' },
      { key: 'optimization', label: 'Codification benefit', placeholder: 'Reduce Mana cost by 1' },
      DESCRIPTION,
      ...SHARED_END,
    ],
  },
  components: {
    noun: 'Component', file: 'data/components.js',
    columns: [['Name', (s: any) => <b>{s.name}</b>], ['Kind', (s: any) => s.kind], ['Tendril glow', (s: any) => s.tendrilColor]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'kind', label: 'Kind', type: 'select', value: 'Physical', options: COMPONENT_KINDS, hint: 'Physical = what exists. Aspectual = what property is applied.' },
      { key: 'tendrilColor', label: 'Tendril glow', placeholder: 'ember orange' },
      DESCRIPTION,
      { key: 'interactions', label: 'Composites & counters', type: 'textarea', hint: 'What it combines with, and what it counters or is countered by.' },
      ...SHARED_END,
    ],
  },
  items: {
    noun: 'item', file: 'data/items.js',
    columns: [['Name', (s: any) => <b>{s.name}</b>], ['Category', (s: any) => s.category], ['Rarity', (s: any) => s.rarity], ['Cost', (s: any) => s.cost]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'category', label: 'Category', type: 'select', value: 'Weapon', options: ITEM_CATEGORIES },
      { key: 'rarity', label: 'Rarity', type: 'select', value: 'Mundane', options: ITEM_RARITIES },
      { key: 'cost', label: 'Cost', placeholder: '15 GP' },
      { key: 'weight', label: 'Weight', placeholder: '3 lb.' },
      { key: 'attunement', label: 'Requires attunement', type: 'bool' },
      { key: 'damage', label: 'Damage (weapons)', placeholder: '1d8 slashing' },
      { key: 'properties', label: 'Properties (weapons)', type: 'list', hint: 'Separate with commas: Finesse, Light' },
      { key: 'mastery', label: 'Weapon Mastery', placeholder: 'Sap' },
      { key: 'armorClass', label: 'Armor Class (armor)', placeholder: '16' },
      { key: 'acBonus', label: 'AC bonus while in use', type: 'number', min: -20, value: 0, hint: 'Added to Armor Class automatically when ticked "In use" on a sheet. Cloak of Protection = 1, Shield = 2.' },
      { key: 'saveBonus', label: 'Save bonus while in use', type: 'number', min: -20, value: 0, hint: 'Added to every saving throw automatically.' },
      { key: 'chainTrait', label: 'Attack Chain trait', wide: true, placeholder: '+1 maximum Chain Length.', hint: 'What it does in an Attack Chain (codex p.23). Copied to the sheet when a player adds the weapon.' },
      { key: 'capacity', label: 'Capacity (Catalysts)', placeholder: '50' },
      { key: 'throughput', label: 'Throughput (Catalysts)', placeholder: '5' },
      DESCRIPTION,
      ...SHARED_END,
    ],
  },
  classes: {
    noun: 'class', file: 'data/classes.js',
    columns: [['Name', (s: any) => <b>{s.name}</b>], ['Hit Die', (s: any) => `d${s.hitDie}`], ['Invocation', (s: any) => s.invocation.toUpperCase()], ['Mana pool', (s: any) => s.caster], ['Subclasses', (s: any) => s.subclasses.length]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'hitDie', label: 'Hit Die', type: 'select', value: 8, options: [6, 8, 10, 12].map((n: any) => ({ value: n, label: `d${n}` })) },
      { key: 'invocation', label: 'Invocation ability', type: 'select', value: 'int', options: abilityOptions, hint: 'The ability used for Arcane attacks and Save DC.' },
      { key: 'caster', label: 'Mana pool', type: 'select', value: 'full', options: [{ value: 'full', label: 'Full caster (100%)' }, { value: 'partial', label: 'Partial caster (about 65%)' }, { value: 'martial', label: 'Martial (about 40%)' }] },
      { key: 'skillPicks', label: 'Skills chosen', type: 'number', value: 2 },
      { key: 'saves', label: 'Saving throw proficiencies (pick two)', type: 'checks', required: true, options: abilityOptions },
      { key: 'primaryAbility', label: 'Primary ability', placeholder: 'Intelligence' },
      { key: 'role', label: 'One-line summary', wide: true, placeholder: 'A scholarly magic-user of arcane power.' },
      DESCRIPTION,
      { key: 'skills', label: 'Skill choices', wide: true, placeholder: 'Choose 2: Arcana, History, Insight' },
      { key: 'weapons', label: 'Weapon proficiencies', placeholder: 'Simple weapons' },
      { key: 'armor', label: 'Armor training', placeholder: 'Light armor' },
      { key: 'tools', label: 'Tool proficiencies' },
      { key: 'equipment', label: 'Starting equipment', wide: true },
      { key: 'compositry', label: 'In Arcane Compositry', type: 'textarea', hint: 'How the class plays with Mana, Attack Chains and Applied Thaumaturgy.' },
      { key: 'features', label: 'Class features', type: 'lines', toText: featureLines, hint: 'One per line:  Level | Feature name | What it does      e.g.  1 | Rune Carving | You can inscribe...' },
      { key: 'subclasses', label: 'Quick subclass list (optional)', type: 'lines', toText: subclassLines, hint: 'Better: add subclasses under Classes > Subclasses, where each feature gets its own description. This box is only a quick list - one per line:  Name | Description | 3 Feature; 6 Another feature' },
      ...SHARED_END,
    ],
  },
  subclasses: {
    noun: 'subclass', file: 'data/subclasses.js',
    view: (s: any) => <SubclassDetail sub={s} />,
    columns: [['Name', (s: any) => <b>{s.name}</b>], ['Parent class', (s: any) => s.className], ['Features', (s: any) => s.features.length]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'className', label: 'Parent class', type: 'select', value: CLASS_NAMES[0], options: [...CLASS_NAMES], hint: 'The subclass appears in the Subclasses section of this class\'s page.' },
      DESCRIPTION,
      { key: 'features', label: 'What it adds to the class', type: 'lines', toText: featureLines, hint: 'One feature per line:  Level | Feature name | What it does      e.g.  3 | Bramble Hide | While raging, attackers take 1d4 Piercing damage.' },
      { key: 'compositry', label: 'In Arcane Compositry (optional)', type: 'textarea', hint: 'How it plays with Mana, Attack Chains or Applied Thaumaturgy.' },
      ...SHARED_END,
    ],
  },
  npcs: {
    noun: 'NPC / enemy', file: 'data/npcs.js', dmOnly: true,
    view: (s: any) => <NpcDetail n={s} />,
    columns: [['Name', (s: any) => <b>{s.name}</b>], ['Kind', (s: any) => s.kind], ['CR', (s: any) => s.cr], ['AC', (s: any) => s.ac], ['HP', (s: any) => s.hp], ['Where', (s: any) => s.location]],
    fields: () => [
      { key: 'name', label: 'Name', required: true, wide: true },
      { key: 'kind', label: 'Kind', type: 'select', value: 'Enemy', options: NPC_KINDS },
      { key: 'size', label: 'Size', type: 'select', value: 'Medium', options: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'] },
      { key: 'creatureType', label: 'Creature type', placeholder: 'Humanoid', suggestions: ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'] },
      { key: 'alignment', label: 'Alignment', placeholder: 'Neutral' },
      { key: 'cr', label: 'Challenge Rating', placeholder: '3 (XP 700)' },
      { key: 'pb', label: 'Proficiency Bonus', type: 'number', min: 2, value: 2, hint: 'Guard is worked out as 2 + PB.' },
      { key: 'ac', label: 'Armor Class', placeholder: '16 (hide armor, shield)' },
      { key: 'initiative', label: 'Initiative', placeholder: '+2' },
      { key: 'hp', label: 'Hit Points', placeholder: '58 (9d8 + 18)' },
      { key: 'speed', label: 'Speed', placeholder: '30 ft., Climb 30 ft.' },
      ...ABILITIES.map((a: any) => ({ key: a.key, label: a.name, type: 'number', min: 1, value: 10, get: (e: any) => e.scores?.[a.key] })),
      { key: 'saves', label: 'Saving throws', placeholder: 'Con +5, Wis +6' },
      { key: 'skills', label: 'Skills', placeholder: 'Perception +6, Stealth +4' },
      { key: 'vulnerabilities', label: 'Vulnerabilities' },
      { key: 'resistances', label: 'Resistances' },
      { key: 'immunities', label: 'Immunities', placeholder: 'Poison; Poisoned' },
      { key: 'senses', label: 'Senses', placeholder: 'Darkvision 60 ft., Passive Perception 16' },
      { key: 'languages', label: 'Languages' },
      { key: 'gear', label: 'Gear', wide: true },
      { key: 'traits', label: 'Traits', type: 'lines', toText: namedLines, hint: NAMED_HINT },
      { key: 'actions', label: 'Actions', type: 'lines', toText: namedLines, hint: NAMED_HINT },
      { key: 'bonusActions', label: 'Bonus actions', type: 'lines', short: true, toText: namedLines, hint: NAMED_HINT },
      { key: 'reactions', label: 'Reactions', type: 'lines', short: true, toText: namedLines, hint: NAMED_HINT },
      { key: 'legendary', label: 'Legendary actions', type: 'lines', short: true, toText: namedLines, hint: NAMED_HINT },
      { key: 'chainLength', label: 'Max Chain Length', placeholder: '3', hint: 'Baseline: 2 at CR 0-4, 3 at 5-10, 4 at 11-16, 5 at 17+.' },
      { key: 'guard', label: 'Guard (blank = 2 + PB)' },
      { key: 'momentum', label: 'Momentum Die / combat habits', wide: true, placeholder: 'Builds to d8, then spends on Topple.' },
      { key: 'invocation', label: 'Invocation ability (casters)', type: 'select', value: '', options: [{ value: '', label: 'None - not a Compositor' }, ...abilityOptions], hint: 'Arcane attack and Save DC are worked out from this and PB.' },
      { key: 'maxPotency', label: 'Maximum Potency', type: 'select', value: 0, options: [{ value: 0, label: 'None' }, ...ROMAN.slice(1).map((r: any, i: any) => ({ value: i + 1, label: r }))] },
      { key: 'mana', label: 'Mana', placeholder: '26' },
      { key: 'temperament', label: 'Temperament', type: 'select', value: '', options: [{ value: '', label: 'Not set' }, 'Disciplined', 'Adaptive', 'Experimental'], hint: 'How often it improvises (codex p.18).' },
      { key: 'physicals', label: 'Known Physicals', type: 'list', hint: 'Separate with commas.' },
      { key: 'aspectuals', label: 'Known Aspects', type: 'list', hint: 'Separate with commas.' },
      { key: 'forms', label: 'Known Forms', type: 'list', hint: 'Separate with commas.' },
      { key: 'signatures', label: 'Signature Compositions', type: 'textarea' },
      { key: 'location', label: 'Location' },
      { key: 'faction', label: 'Faction' },
      { ...DESCRIPTION, label: 'Description & roleplay', hint: 'Appearance, voice, how to play them. Leave a blank line between paragraphs.' },
      { key: 'notes', label: 'Private DM notes', type: 'textarea', hint: 'Secrets, plans, what they want.' },
      { key: 'tags', label: 'Tags', type: 'list', hint: 'Search keywords, separated by commas.' },
    ],
  },
};

// ── One editable list ────────────────────────────────────────────────────────
const ORIGIN: Record<string, [string, string]> = { file: ['File', ''], custom: ['Added here', 'bg-ok/15 text-ok'], override: ['Edited here', 'border-gold-line bg-gold-soft text-gold-ink'] };

/**
 * One editable list. `group` is the set of lists sharing this tab (shown as
 * buttons at the top), or null when the tab holds just this list.
 */
export function CatalogTab({ listName, group, onPickList }: { listName: string; group: [string, string][] | null; onPickList: (list: string) => void }) {
  const def = CATALOG[listName];
  const { data: entries, error, reload } = useCatalogList(listName);
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<any | null | undefined>(undefined); // undefined = closed, null = new
  const [viewing, setViewing] = useState<any>(null);
  const canHide = !def.dmOnly; // a DM-only list has nothing to hide: players never get it
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!entries) return <Loading />;

  const cellText = (s: any) => def.columns.map(([, cell]) => { const v = cell(s); return typeof v === 'string' || typeof v === 'number' ? v : ''; }).join(' ');
  const shown = q ? entries.filter((s) => matchesWords(q, `${s.name} ${cellText(s)}`)) : entries;

  const toggleVisibility = async (s: any) => {
    try {
      await api('PUT', `/catalog/${listName}/${encodeURIComponent(s.id)}/visibility`, { hidden: !s.hidden });
      toast.success(s.hidden ? `${s.name} is now public - players can see it.` : `${s.name} is now hidden from players.`);
      invalidateLists();
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (s: any) => {
    const undo = s.origin === 'override';
    const ok = await confirm({
      title: undo ? 'Undo your edits?' : `Delete ${def.noun}?`,
      message: undo ? `"${s.name}" will go back to the version in the data file.` : `"${s.name}" will be removed from the list.${def.dmOnly ? '' : ' Characters that already use it keep what is on their sheet.'}`,
      confirmLabel: undo ? 'Undo edits' : 'Delete', danger: true,
    });
    if (!ok) return;
    try { await api('DELETE', `/catalog/${listName}/${encodeURIComponent(s.id)}`); toast.success('Done.'); invalidateLists(); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {group ? (
          <div className="tab-tray inline-flex flex-wrap" role="group" aria-label="Which list">
            {group.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={listName === id} onClick={() => onPickList(id)}
                className="tab-pill">{label}</button>
            ))}
          </div>
        ) : <span />}
        <Button onClick={() => setEditing(null)}><Plus />New {def.noun}</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {def.dmOnly
          ? <>{entries.length} entries. <b>Only the campaign's DMs can see this list</b> - it is never sent to players.</>
          : <>{entries.length} entries, {entries.filter((x) => x.hidden).length} hidden from players. Use <b>Hide</b> to prepare something in secret and <b>Publish</b> when the players find it.</>}
        {' '}"File" entries live in <code className="rounded bg-muted px-1">{def.file}</code>; you can also add entries there by hand (see the docs folder).
      </p>
      {entries.length > 8 && <SearchInput value={q} onChange={setQ} placeholder="Search this list" label="Search this list" />}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-header hover:bg-header">
              {def.columns.map(([label]) => <TableHead key={label} className="text-header-foreground">{label}</TableHead>)}
              {canHide && <TableHead className="text-header-foreground">Players see it?</TableHead>}
              <TableHead className="text-header-foreground">Source</TableHead>
              <TableHead className="text-header-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((s) => (
              <TableRow key={s.id} className={cn(s.hidden && canHide && 'bg-gold-soft/40')}>
                {def.columns.map(([label, cell]) => <TableCell key={label}>{cell(s)}</TableCell>)}
                {canHide && <TableCell>{s.hidden ? <Badge variant="outline" className="border-gold-line bg-gold-soft text-gold-ink">Hidden</Badge> : <Badge variant="outline" className="bg-ok/15 text-ok">Public</Badge>}</TableCell>}
                <TableCell><Badge variant="outline" className={ORIGIN[s.origin][1]}>{ORIGIN[s.origin][0]}</Badge></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {def.view && <Button size="sm" onClick={() => setViewing(s)}><BookOpen />View</Button>}
                    {canHide && <Button size="sm" variant="outline" onClick={() => toggleVisibility(s)}><Eye />{s.hidden ? 'Publish' : 'Hide'}</Button>}
                    <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil />Edit</Button>
                    {s.origin !== 'file' && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(s)}><Trash2 />{s.origin === 'override' ? 'Undo edits' : 'Delete'}</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {viewing && def.view && (
        <DetailDialog open wide onOpenChange={(o) => { if (!o) setViewing(null); }} title={viewing.name}
          footer={<><Button variant="outline" onClick={() => { setEditing(viewing); setViewing(null); }}><Pencil />Edit</Button><Button onClick={() => setViewing(null)}>Close</Button></>}>
          {def.view(viewing)}
        </DetailDialog>
      )}
      {editing !== undefined && <EntryForm listName={listName} entry={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

/** The add / edit dialog, built from the list's `fields`. `entry` is null for a new one. */
function EntryForm({ listName, entry, onClose }: { listName: string; entry: any | null; onClose: () => void }) {
  const def = CATALOG[listName];
  const fields = def.fields();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = (f: FormField) => (entry && f.get ? f.get(entry) : entry?.[f.key]) ?? f.value ?? (f.type === 'checks' || f.type === 'list' ? [] : '');
  const star = (f: FormField) => (f.required ? ' *' : '');

  const save = async (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const data: Record<string, any> = {};
    for (const f of fields) {
      if (f.type === 'bool') data[f.key] = fd.has(f.key);
      else if (f.type === 'checks') data[f.key] = fd.getAll(f.key);
      else data[f.key] = fd.get(f.key);
    }
    setBusy(true); setError(null);
    try {
      if (entry) await api('PUT', `/catalog/${listName}/${encodeURIComponent(entry.id)}`, data);
      else await api('POST', `/catalog/${listName}`, data);
      toast.success(`${data.name} saved.`);
      invalidateLists();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const control = (f: FormField) => {
    const id = `en-${f.key}`;
    const value = current(f);
    if (f.type === 'checks') {
      return (
        <fieldset key={f.key} className="rounded-lg border p-3 sm:col-span-2">
          <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{f.label}{star(f)}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {f.options!.map((o: any) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={f.key} value={o.value} defaultChecked={value.includes(o.value)} className="size-4 accent-primary" />{o.label}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    if (f.type === 'textarea' || f.type === 'lines') {
      const text = f.type === 'lines' ? f.toText!(entry?.[f.key]) : value;
      return (
        <Field key={f.key} label={`${f.label}${star(f)}`} htmlFor={id} hint={f.hint} className="sm:col-span-2">
          <Textarea id={id} name={f.key} defaultValue={text} className={cn('min-h-24', (f.tall || (f.type === 'lines' && !f.short)) && 'min-h-48')} />
        </Field>
      );
    }
    if (f.type === 'select') {
      return (
        <Field key={f.key} label={f.label} htmlFor={id} hint={f.hint}>
          <NativeSelect id={id} name={f.key} defaultValue={String(value)}><Options options={f.options!} /></NativeSelect>
        </Field>
      );
    }
    const shown = f.type === 'list' ? value.join(', ') : value;
    return (
      <Field key={f.key} label={`${f.label}${star(f)}`} htmlFor={id} hint={f.hint} className={f.wide ? 'sm:col-span-2' : undefined}>
        <Input id={id} name={f.key} defaultValue={shown} placeholder={f.placeholder} list={f.suggestions ? `${id}-list` : undefined}
          {...(f.type === 'number' ? { type: 'number', inputMode: 'numeric' as const, min: f.min ?? 0 } : { autoComplete: 'off' })} />
        {f.suggestions && <datalist id={`${id}-list`}>{f.suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
      </Field>
    );
  };

  // Tick boxes that sit next to each other are grouped onto one row.
  const bools = fields.filter((f) => f.type === 'bool');
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{entry ? `Edit ${entry.name}` : `New ${def.noun}`}</DialogTitle>
          <DialogDescription>Fields marked * are required.</DialogDescription>
        </DialogHeader>
        <form id="entry-form" noValidate onSubmit={(e) => { e.preventDefault(); void save(e.currentTarget); }}>
          {error && <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 font-semibold text-destructive" role="alert">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">{fields.filter((f) => f.type !== 'bool').map(control)}</div>
          {bools.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-5">
              {bools.map((f) => (
                <label key={f.key} className="flex min-h-9 items-center gap-2 text-sm">
                  <input type="checkbox" name={f.key} defaultChecked={!!current(f)} className="size-4 accent-primary" />{f.label}
                </label>
              ))}
            </div>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="entry-form" disabled={busy}><Check />Save {def.noun}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
