/**
 * components/sheet/features-tab.tsx - the sheet's "Features & Gear" tab (page 3
 * of the printed sheet): features, inventory (with "In use" and attunement),
 * proficiencies, story, languages, coins and campaign notes.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import * as F from '@shared/rules/formulas.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Picker } from '@/components/details';
import { Panel } from '@/components/panel';
import { useItems } from '@/lib/catalog';
import { giveItem } from '@/lib/spellbook';
import { AreaF, CellF, CheckF, ListRow, SmallLabel, TextF, useSheet } from './fields';
import { AddRow, DetailsButton, RemoveRow, useDetails } from './rows';

const grid = 'grid gap-3 sm:grid-cols-2';

export function FeaturesTab() {
  const { c, d, update } = useSheet();
  const items = useItems();
  const details = useDetails();
  const [picking, setPicking] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Class Features & Feats"><AreaF path="features.classFeatures" label="Class features & feats" tall /></Panel>
      <div className="grid gap-5">
        <Panel title="Species Traits"><AreaF path="features.speciesTraits" label="Species traits" /></Panel>
        <Panel title="Combat / Arcane Special Rules"><AreaF path="features.specialRules" label="Combat / arcane special rules" /></Panel>
      </div>

      <Panel title="Inventory" className="lg:col-span-2" bodyClassName="space-y-3">
        <p className="text-sm text-muted-foreground">
          Tick <b>In use / worn</b> to apply an item's bonuses to your Armor Class and saving throws. Items that need attunement must also be ticked <b>Attuned</b>.{' '}
          Attuned: {d.attunedCount} of 3.{d.attunedCount > 3 ? ' That is more than the usual limit.' : ''}
        </p>
        {c.inventory.length ? c.inventory.map((row: any, i: number) => {
          const active = row.equipped && (!row.attunement || row.attuned);
          const bonus = [F.num(row.acBonus) && `${F.signed(row.acBonus)} AC`, F.num(row.saveBonus) && `${F.signed(row.saveBonus)} saves`].filter(Boolean).join(', ');
          const box = (field: string, label: string) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={!!row[field]} onCheckedChange={(v) => update((x) => { x.inventory[i][field] = v === true; })} />{label}
            </label>
          );
          return (
            <ListRow key={row.id ?? i} active={active} actions={<>
              {box('equipped', 'In use / worn')}{box('attunement', 'Needs attunement')}{row.attunement && box('attuned', 'Attuned')}
              {bonus && (active ? <Badge className="bg-ok/15 text-ok" variant="outline">Active: {bonus}</Badge>
                : row.equipped ? <Badge variant="outline" className="border-gold-line bg-gold-soft text-gold-ink">Attune it to gain: {bonus}</Badge>
                : <Badge variant="outline">Not in use: {bonus}</Badge>)}
              {row.itemId && <DetailsButton onClick={() => details.show({ kind: 'item', id: row.itemId })} />}
              <RemoveRow list="inventory" index={i} />
            </>}>
              <CellF list="inventory" index={i} field="name" label="Item" className="col-span-2" />
              <CellF list="inventory" index={i} field="qty" label="Qty" />
              <CellF list="inventory" index={i} field="acBonus" label="AC bonus" />
              <CellF list="inventory" index={i} field="saveBonus" label="Save bonus" />
              <CellF list="inventory" index={i} field="notes" label="Notes" className="col-span-2 sm:col-span-3" />
            </ListRow>
          );
        }) : <p className="text-sm text-muted-foreground">Nothing carried yet.</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setPicking(true)}><Plus />Add from Items &amp; Weapons</Button>
          <AddRow list="inventory" label="Add custom item" />
        </div>
      </Panel>

      <Panel title="Equipment, Training & Proficiencies" bodyClassName="space-y-3">
        <SmallLabel>Armor training</SmallLabel>
        <div className="flex flex-wrap gap-x-5">
          <CheckF path="gear.armorLight" label="Light" /><CheckF path="gear.armorMedium" label="Medium" />
          <CheckF path="gear.armorHeavy" label="Heavy" /><CheckF path="gear.armorShields" label="Shields" />
        </div>
        <AreaF path="gear.proficiencies" label="Weapons / tools / other proficiencies" />
        <AreaF path="gear.equipment" label="Other equipment (free text)" />
      </Panel>
      <div className="grid gap-5">
        <Panel title="Backstory & Personality"><AreaF path="story.backstory" label="Backstory & personality" /></Panel>
        <Panel title="Appearance"><AreaF path="story.appearance" label="Appearance" /></Panel>
      </div>

      <Panel title="Languages & Magic Item Attunement" bodyClassName={grid}>
        <TextF path="misc.languages" label="Languages" className="sm:col-span-2" />
        {[0, 1, 2].map((i) => <TextF key={i} path={`misc.attunement.${i}`} label={`Attunement ${i + 1}`} />)}
      </Panel>
      <Panel title="Coins & Carrying" bodyClassName="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {['cp', 'sp', 'ep', 'gp', 'pp'].map((coin) => <TextF key={coin} path={`misc.${coin}`} label={coin.toUpperCase()} type="number" />)}
        <div className="col-span-3 sm:col-span-5"><AreaF path="misc.carrying" label="Carrying / encumbrance notes" /></div>
      </Panel>
      <Panel title="Campaign Notes, Relationships & Personal Goals" className="lg:col-span-2">
        <AreaF path="misc.campaignNotes" label="Campaign notes, relationships & personal goals" tall />
      </Panel>

      <Picker open={picking} onOpenChange={setPicking} title="Add an item" intro="Weapons are added on the Core & Combat tab."
        emptyText="No items are available yet." entries={(items.data ?? []).filter((x) => x.category !== 'Weapon')}
        describe={(it: any) => [it.category, it.rarity !== 'Mundane' && it.rarity, it.attunement && 'Attunement'].filter(Boolean).join(' · ')}
        onPick={(it: any) => { update((x) => { giveItem(x, it); }); toast.success(`${it.name} added. Tick "In use" to apply it.`); }} />
      {details.dialog}
    </div>
  );
}
