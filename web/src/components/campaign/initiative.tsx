/**
 * components/campaign/initiative.tsx - the DM's Initiative Tracker (a tab of the
 * campaign hub).
 *
 * One "encounter" = one tracker. You can keep several going at once (a split
 * party), each with its own name. Everything is saved to the server as you
 * work, so a refresh or a second device picks up where you left off.
 *
 * ─── HOW AN ENCOUNTER IS STORED ────────────────────────────────────────────
 *   enc.name                       the tracker's name
 *   enc.data.round                 current round number
 *   enc.data.firstId               who acted first this round (when they come up again, the round ticks over)
 *   enc.data.combatants            everyone in the fight, IN TURN ORDER. The first living one is "up".
 *     { id, source: 'npc' | 'character' | 'custom', sourceId, name, kind,
 *       initiative, initBonus, hp, hpMax, tempHp, ac, guard, guardMax, mana, manaMax,
 *       conditions, notes, dead, snapshot }
 *   `snapshot` is a copy of an NPC's stat block taken when it was added, so the
 *   Details pop-up works even if the NPC is edited or deleted later.
 *
 * The numbers on a combatant are the tracker's OWN copy. Changing a player
 * character's HP here does not change their sheet (use "Refresh from sheet" to
 * pull their current numbers in).
 *
 * ─── TO ADD SOMETHING TO TRACK ─────────────────────────────────────────────
 *  1. Give it a default in blankCombatant().
 *  2. Add it to FIELDS (shown on each card) or to DETAIL_FIELDS (the Details pop-up).
 */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowDown, ArrowUp, BookOpen, Check, Dices, Heart, Loader2, Plus, RefreshCw, Skull, Sword, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import * as F from '@shared/rules/formulas.js';
import { derive, upgrade } from '@shared/rules/character.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/components/confirm';
import { CharacterSummary, DetailDialog, NpcDetail, Picker } from '@/components/details';
import { Field } from '@/components/fields';
import { Empty, ErrorState, Loading } from '@/components/page';
import { api, errorMessage, type CharacterSummary as CharRow } from '@/lib/api';
import { useApi, useNpcs } from '@/lib/catalog';
import { cn } from '@/lib/utils';

type Num = number | '';
interface Combatant {
  id: string; source: 'npc' | 'character' | 'custom'; sourceId: string; name: string; kind: string;
  initiative: Num; initBonus: number; hp: Num; hpMax: Num; tempHp: Num; ac: Num;
  guard: Num; guardMax: Num; mana: Num; manaMax: Num; conditions: string; notes: string; dead: boolean; snapshot: any;
}
interface Data { round: number; firstId: string | null; combatants: Combatant[] }
interface Encounter { id: string; name: string; data: Data; updatedAt: string }

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
/** The first whole number in a piece of text: "52 (8d8 + 16)" -> 52, "+2" -> 2. Blank when there is none. */
const leadingNumber = (text: unknown): Num => { const m = String(text ?? '').match(/-?\d+/); return m ? Number(m[0]) : ''; };
const typed = (value: string, isNumber: boolean) => (isNumber ? (value === '' ? '' : Number(value)) : value);

function blankCombatant(extra: Partial<Combatant> = {}): Combatant {
  return {
    id: newId(), source: 'custom', sourceId: '', name: 'Combatant', kind: 'Enemy',
    initiative: '', initBonus: 0, hp: '', hpMax: '', tempHp: '', ac: '',
    guard: '', guardMax: '', mana: '', manaMax: '', conditions: '', notes: '', dead: false, snapshot: null,
    ...extra,
  };
}

/** Builds a combatant from an entry on the NPCs & Enemies list, carrying its numbers over. */
function fromNpc(n: any) {
  const hp = leadingNumber(n.hp);
  const guard = Number(n.guard) || F.guardMax(n.pb);
  const mana = leadingNumber(n.mana);
  const typedInit = /[+-]?\d/.test(n.initiative) ? leadingNumber(n.initiative) : '';
  return blankCombatant({
    source: 'npc', sourceId: n.id, name: n.name, kind: n.kind,
    initBonus: typedInit === '' ? F.abilityMod(n.scores.dex) : typedInit,
    hp, hpMax: hp, ac: leadingNumber(n.ac), guard, guardMax: guard, mana, manaMax: mana, snapshot: n,
  });
}

/** The numbers the tracker copies from a player's sheet. Also used by "Refresh from sheet". */
function sheetNumbers(sheet: any): Partial<Combatant> {
  const d = derive(sheet);
  return {
    name: sheet.identity.name || 'Unnamed Character', initBonus: d.initiative,
    hp: F.num(sheet.hp.current), hpMax: F.num(sheet.hp.max), tempHp: F.num(sheet.hp.temp) || '', ac: d.acTotal,
    guard: F.num(sheet.chain.guardCurrent), guardMax: d.guardMax, mana: F.num(sheet.arcane.manaCurrent), manaMax: d.manaMax,
  };
}

/** The boxes shown on every combatant card. `key` is the combatant property it edits. */
const FIELDS: { key: keyof Combatant; label: string; of?: keyof Combatant; onlyIfSet?: boolean }[] = [
  { key: 'initiative', label: 'Initiative' },
  { key: 'hp', label: 'HP' },
  { key: 'hpMax', label: 'Max HP' },
  { key: 'tempHp', label: 'Temp HP' },
  { key: 'ac', label: 'AC' },
  { key: 'guard', label: 'Guard', of: 'guardMax' },
  { key: 'mana', label: 'Mana', of: 'manaMax', onlyIfSet: true },
];
/** The boxes in the Details pop-up. */
const DETAIL_FIELDS: [keyof Combatant, string, ('text' | 'number')?][] = [
  ['name', 'Name', 'text'], ['initiative', 'Initiative'], ['initBonus', 'Init. bonus'],
  ['hp', 'HP'], ['hpMax', 'Max HP'], ['tempHp', 'Temp HP'], ['ac', 'AC'],
  ['guard', 'Guard'], ['guardMax', 'Guard max'], ['mana', 'Mana'], ['manaMax', 'Mana max'], ['conditions', 'Conditions', 'text'],
];

// ── Turn order (all work on a copy of the encounter's data) ─────────────────
const living = (d: Data) => d.combatants.filter((c) => !c.dead);
const fallen = (d: Data) => d.combatants.filter((c) => c.dead);
/** Keeps the list as: everyone alive (in turn order), then the fallen. */
const tidy = (d: Data) => { d.combatants = [...living(d), ...fallen(d)]; };
/** Highest initiative first; ties go to the higher bonus. Anyone without a number goes last. */
function sortByInitiative(d: Data) {
  const value = (c: Combatant) => (c.initiative === '' ? -Infinity : F.num(c.initiative));
  const order = living(d).sort((a, b) => value(b) - value(a) || F.num(b.initBonus) - F.num(a.initBonus));
  d.combatants = [...order, ...fallen(d)];
  d.firstId = order[0]?.id || null;
}
const rollFor = (c: Combatant) => { c.initiative = F.roll(1, 20).total + F.num(c.initBonus); };
/** Guard refreshes at the beginning of a creature's turn (codex p.20). */
const startTurn = (c?: Combatant) => { if (c && c.guardMax !== '') c.guard = c.guardMax; };
function nextTurn(d: Data) {
  const order = living(d);
  if (order.length < 2) { d.round += 1; startTurn(order[0]); return; }
  d.combatants = [...order.slice(1), order[0], ...fallen(d)];
  const up = living(d)[0];
  if (!living(d).some((c) => c.id === d.firstId)) d.firstId = up.id;
  else if (up.id === d.firstId) d.round += 1;
  startTurn(up);
}
function setDead(d: Data, c: Combatant, dead: boolean) {
  if (dead && d.firstId === c.id) {
    // The round was counted from this combatant: hand that job to whoever follows them.
    const order = living(d);
    d.firstId = order[(order.indexOf(c) + 1) % order.length]?.id || null;
  }
  c.dead = dead;
  if (dead && c.hp !== '') c.hp = 0;
  tidy(d);
}
function move(d: Data, c: Combatant, step: number) {
  const order = living(d);
  const i = order.indexOf(c);
  const j = i + step;
  if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  d.combatants = [...order, ...fallen(d)];
}
/** "Bramble Wolf" -> "Bramble Wolf 2" when one is already in the fight. */
function uniqueName(d: Data, name: string) {
  const taken = d.combatants.map((c) => c.name);
  if (!taken.includes(name)) return name;
  let n = 2;
  while (taken.includes(`${name} ${n}`)) n++;
  return `${name} ${n}`;
}
function add(d: Data, c: Combatant) {
  c.name = uniqueName(d, c.name);
  d.combatants = [...living(d), c, ...fallen(d)];
  if (!d.firstId) d.firstId = living(d)[0].id;
}

// ── The tab ──────────────────────────────────────────────────────────────────
export function InitiativeTab({ groupId }: { groupId: string }) {
  const [params, setParams] = useSearchParams();
  const { data, error, reload } = useApi<{ encounters: Encounter[] }>('/encounters');
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading />;
  const encounters = data.encounters;
  const enc = encounters.find((e) => e.id === params.get('enc')) || encounters[0] || null;
  const open = (id: string | null) => setParams((p) => { p.set('tab', 'initiative'); if (id) p.set('enc', id); else p.delete('enc'); return p; }, { replace: true });
  const create = async () => {
    try { const { encounter } = await api<{ encounter: Encounter }>('POST', '/encounters', { name: `Encounter ${encounters.length + 1}` }); reload(); open(encounter.id); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="tab-tray inline-flex flex-wrap" role="group" aria-label="Encounters">
          {encounters.map((e) => (
            <button key={e.id} type="button" aria-pressed={e.id === enc?.id} onClick={() => open(e.id)}
              className="tab-pill">
              {e.name}{e.data.combatants?.length ? ` (${e.data.combatants.filter((c) => !c.dead).length})` : ''}
            </button>
          ))}
        </div>
        <Button onClick={create}><Plus />New encounter</Button>
      </div>
      {enc
        ? <Tracker key={enc.id} enc={enc} groupId={groupId} onEnded={() => { open(null); reload(); }} />
        : <Empty icon={<Sword />} title="No encounters yet" action={<Button onClick={create}><Plus />Start an encounter</Button>}>
            Start a tracker, add the enemies and player characters in the fight, and roll initiative.
          </Empty>}
    </div>
  );
}

function Tracker({ enc, groupId, onEnded }: { enc: Encounter; groupId: string; onEnded: () => void }) {
  const confirm = useConfirm();
  const npcs = useNpcs();
  const party = useApi<{ characters: CharRow[] }>('/group/characters');
  const [name, setName] = useState(enc.name);
  const [data, setData] = useState<Data>(() => ({ round: enc.data.round ?? 1, firstId: enc.data.firstId ?? null, combatants: (enc.data.combatants || []).map((c) => blankCombatant(c)) }));
  const [status, setStatus] = useState<'saved' | 'saving' | string>('saved');
  const [picking, setPicking] = useState<'npc' | 'pc' | null>(null);
  const [counting, setCounting] = useState<any>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // ── Saving ──
  const latest = useRef({ name, data });
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flush = async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    try { await api('PUT', `/encounters/${enc.id}`, latest.current, { group: groupId }); if (!dirty.current) setStatus('saved'); }
    catch (err) { dirty.current = true; setStatus(`Not saved - ${errorMessage(err)}`); }
  };
  useEffect(() => () => { void flush(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const changed = (next: { name?: string; data?: Data }) => {
    latest.current = { ...latest.current, ...next };
    dirty.current = true;
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  };
  /** Change the encounter: mutate(d => { ... }). Works on a copy, then saves. */
  const mutate = (fn: (d: Data) => void) => {
    const next = structuredClone(latest.current.data);
    fn(next);
    setData(next);
    changed({ data: next });
  };
  const find = (d: Data, id: string) => d.combatants.find((c) => c.id === id)!;

  const ordered = [...living(data), ...fallen(data)];
  const up = living(data)[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Encounter name" htmlFor="enc-name" className="min-w-56 flex-1">
          <Input id="enc-name" maxLength={80} autoComplete="off" value={name} onChange={(e) => { setName(e.target.value); changed({ name: e.target.value }); }} />
        </Field>
        <Badge className="px-3 py-1.5 text-base" role="status">Round {data.round}</Badge>
        <span className={cn('flex items-center gap-1.5 text-sm', status.startsWith('Not') ? 'font-semibold text-destructive' : 'text-muted-foreground')} role="status">
          {status === 'saving' ? <><Loader2 className="size-4 animate-spin" />Saving...</> : status === 'saved' ? <><Check className="size-4 text-ok" />Saved</> : status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPicking('npc')}><Plus />Add enemy / NPC</Button>
        <Button onClick={() => setPicking('pc')}><Users />Add player character</Button>
        <Button variant="outline" onClick={() => mutate((d) => add(d, blankCombatant({ name: 'Combatant' })))}><Plus />Add custom</Button>
        <Button variant="outline" onClick={() => {
          if (!living(data).length) return;
          let first = '';
          mutate((d) => { living(d).forEach(rollFor); sortByInitiative(d); d.round = 1; startTurn(living(d)[0]); first = living(d)[0].name; });
          toast(`Initiative rolled. ${first} is up first.`);
        }}><Dices />Roll initiative for all</Button>
        <Button variant="outline" onClick={() => mutate(sortByInitiative)}>Sort by initiative</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        The combatant at the top is up. Press <b>Turn done</b> and they move to the bottom; Guard refreshes for whoever is up next.
        Type an initiative yourself if you roll real dice. HP and other numbers here are the tracker's own copy.
      </p>

      {ordered.length === 0
        ? <Empty title="Nobody is here yet">Use the buttons above to add enemies, NPCs and player characters.</Empty>
        : <div className="space-y-2.5">
            {ordered.map((c) => (
              <div key={c.id}>
                {c.dead && fallen(data)[0]?.id === c.id && <h3 className="mt-4 mb-2 text-lg font-semibold">Fallen</h3>}
                <CombatantCard c={c} position={living(data).indexOf(c)} isUp={c === up} mutate={mutate} onDetails={() => setDetailsId(c.id)} />
              </div>
            ))}
          </div>}

      <div className="flex flex-wrap justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => mutate((d) => { d.combatants.forEach((x) => { x.initiative = ''; }); d.round = 1; d.firstId = living(d)[0]?.id || null; })}>
          <RefreshCw />Clear initiative &amp; restart rounds
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => {
          if (!await confirm({ title: 'End this encounter?', message: `"${name}" and everyone in it will be removed from the tracker. NPCs and characters themselves are not affected.`, confirmLabel: 'End encounter', danger: true })) return;
          try { dirty.current = false; await api('DELETE', `/encounters/${enc.id}`, undefined, { group: groupId }); toast.success('Encounter ended.'); onEnded(); }
          catch (err) { toast.error(errorMessage(err)); }
        }}><Trash2 />End encounter</Button>
      </div>

      <Picker open={picking === 'npc'} onOpenChange={(o) => { if (!o) setPicking(null); }} title="Add an enemy or NPC"
        intro="From your NPCs & Enemies list. You will be asked how many."
        emptyText='Your NPCs & Enemies list is empty. Add some on the NPCs & Enemies tab, or use "Add custom".'
        entries={npcs.data ?? []}
        describe={(n: any) => [n.kind, n.cr && `CR ${n.cr}`, n.ac && `AC ${n.ac}`, n.hp && `HP ${n.hp}`].filter(Boolean).join(' · ')}
        onPick={(n) => setCounting(n)} />
      <Picker open={picking === 'pc'} onOpenChange={(o) => { if (!o) setPicking(null); }} title="Add a player character"
        intro="Every character in this campaign. Their current HP, AC, Guard and Mana are copied from their sheet."
        emptyText={party.data?.characters.length ? 'Every character is already in this encounter.' : 'No characters are in this campaign yet.'}
        entries={(party.data?.characters ?? []).filter((ch) => !data.combatants.some((c) => c.source === 'character' && c.sourceId === ch.id))}
        describe={(ch) => `Level ${ch.level} ${ch.className || 'Adventurer'} · played by ${ch.ownerName}`}
        onPick={async (ch) => {
          try {
            const sheet = upgrade((await api('GET', `/characters/${ch.id}`)).data);
            mutate((d) => add(d, blankCombatant({ source: 'character', sourceId: ch.id, kind: 'Player', ...sheetNumbers(sheet) })));
            toast.success(`${ch.name} added. Roll or type their initiative.`);
          } catch (err) { toast.error(errorMessage(err)); }
        }} />
      {counting && <HowMany npc={counting} onClose={() => setCounting(null)} onAdd={(count, rollNow) => {
        mutate((d) => { for (let i = 0; i < count; i++) { const c = fromNpc(counting); if (rollNow) rollFor(c); add(d, c); } if (rollNow) sortByInitiative(d); });
        toast.success(`${count} x ${counting.name} added.`);
        setCounting(null);
      }} />}
      {detailsId && data.combatants.some((c) => c.id === detailsId) && (
        <CombatantDetails c={find(data, detailsId)} onClose={() => setDetailsId(null)}
          set={(key, value) => mutate((d) => { (find(d, detailsId) as any)[key] = value; })}
          refresh={(nums) => mutate((d) => { Object.assign(find(d, detailsId), nums); })} />
      )}
    </div>
  );
}

function CombatantCard({ c, position, isUp, mutate, onDetails }: {
  c: Combatant; position: number; isUp: boolean; mutate: (fn: (d: Data) => void) => void; onDetails: () => void;
}) {
  const [amount, setAmount] = useState('');
  const low = c.hp !== '' && c.hpMax !== '' && F.num(c.hp) <= F.num(c.hpMax) / 2;
  const me = (d: Data) => d.combatants.find((x) => x.id === c.id)!;
  const kindClass = c.kind === 'Player' || c.kind === 'Ally' ? 'bg-ok/15 text-ok' : c.kind === 'NPC' ? '' : 'border-gold-line bg-gold-soft text-gold-ink';
  const hitOrHeal = (heal: boolean) => {
    const n = Math.max(0, F.num(amount));
    if (!n) return;
    let downed = false;
    mutate((d) => {
      const x = me(d);
      if (heal) { x.hp = x.hpMax === '' ? F.num(x.hp) + n : Math.min(F.num(x.hpMax), F.num(x.hp) + n); return; }
      // Damage comes off Temporary Hit Points first.
      const soaked = Math.min(F.num(x.tempHp), n);
      x.tempHp = F.num(x.tempHp) - soaked || '';
      x.hp = Math.max(0, F.num(x.hp) - (n - soaked));
      downed = x.hp === 0;
    });
    if (downed) toast(`${c.name} is at 0 HP. Press "Dead" if they are out of the fight.`);
    setAmount('');
  };

  return (
    <article className={cn('surface p-3', isUp && 'border-2 border-gold bg-gold-soft/40', c.dead && 'opacity-60', low && !c.dead && 'border-l-4 border-l-destructive')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-header font-serif text-sm font-bold text-header-foreground">{c.dead ? <X className="size-4" /> : position + 1}</span>
        <span className="font-serif text-lg font-bold">{c.name}</span>
        <Badge variant="outline" className={kindClass}>{c.kind}</Badge>
        {isUp && <Badge>Up now</Badge>}{c.dead && <Badge variant="outline">Dead</Badge>}{low && !c.dead && <Badge variant="outline" className="text-destructive">Bloodied</Badge>}
        {isUp && <Button size="sm" className="ml-auto" onClick={() => mutate(nextTurn)}><Check />Turn done</Button>}
      </div>
      {!c.dead && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {FIELDS.filter((f) => !(f.onlyIfSet && c[f.key] === '' && c[f.of!] === '')).map((f) => (
            <Field key={f.key} label={`${f.label}${f.of && c[f.of] !== '' ? ` / ${c[f.of]}` : ''}`} htmlFor={`${c.id}-${f.key}`}>
              <Input id={`${c.id}-${f.key}`} type="number" inputMode="numeric" value={c[f.key] as Num} className="h-8 tabular-nums"
                onChange={(e) => mutate((d) => { (me(d) as any)[f.key] = typed(e.target.value, true); })}
                // Leaving an initiative box re-sorts the list.
                onBlur={f.key === 'initiative' ? () => mutate(sortByInitiative) : undefined} />
            </Field>
          ))}
          <Field label="Damage / healing" htmlFor={`${c.id}-amt`} className="col-span-3 sm:col-span-2">
            <div className="flex gap-1">
              <Input id={`${c.id}-amt`} type="number" inputMode="numeric" min={0} placeholder="0" className="h-8" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label={`Amount of damage or healing for ${c.name}`} />
              <Button size="sm" variant="outline" onClick={() => hitOrHeal(false)}>Hit</Button>
              <Button size="sm" variant="outline" onClick={() => hitOrHeal(true)}>Heal</Button>
            </div>
          </Field>
          <Field label="Conditions" htmlFor={`${c.id}-cond`} className="col-span-3 sm:col-span-4 lg:col-span-8">
            <Input id={`${c.id}-cond`} className="h-8" placeholder="Prone, Dazed..." autoComplete="off" value={c.conditions} onChange={(e) => mutate((d) => { me(d).conditions = e.target.value; })} />
          </Field>
        </div>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={onDetails}><BookOpen />Details</Button>
        {c.dead
          ? <Button size="sm" variant="outline" onClick={() => mutate((d) => { const x = me(d); setDead(d, x, false); if (x.hp === 0) x.hp = 1; })}><Heart />Revive</Button>
          : <>
              <Button size="sm" variant="outline" aria-label={`Roll initiative for ${c.name}`} onClick={() => { let rolled: Num = ''; mutate((d) => { const x = me(d); rollFor(x); rolled = x.initiative; sortByInitiative(d); }); toast(`${c.name} rolled ${rolled}.`); }}><Dices />Roll ({F.signed(c.initBonus)})</Button>
              <Button size="sm" variant="ghost" aria-label={`Move ${c.name} up`} onClick={() => mutate((d) => move(d, me(d), -1))}><ArrowUp />Up</Button>
              <Button size="sm" variant="ghost" aria-label={`Move ${c.name} down`} onClick={() => mutate((d) => move(d, me(d), 1))}><ArrowDown />Down</Button>
              <Button size="sm" variant="ghost" onClick={() => { mutate((d) => setDead(d, me(d), true)); toast(`${c.name} is down.`); }}><Skull />Dead</Button>
            </>}
        <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => mutate((d) => {
          const x = me(d);
          if (d.firstId === x.id) { const order = living(d); d.firstId = order[(order.indexOf(x) + 1) % order.length]?.id || null; }
          d.combatants = d.combatants.filter((y) => y.id !== x.id);
          if (d.firstId === x.id) d.firstId = living(d)[0]?.id || null;
        })}><Trash2 />Remove</Button>
      </div>
    </article>
  );
}

function HowMany({ npc, onClose, onAdd }: { npc: any; onClose: () => void; onAdd: (count: number, rollNow: boolean) => void }) {
  const [count, setCount] = useState('1');
  const [rollNow, setRollNow] = useState(true);
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="font-serif">Add {npc.name}</DialogTitle><DialogDescription>How many join the fight?</DialogDescription></DialogHeader>
        <Field label="How many?" htmlFor="how-many"><Input id="how-many" type="number" inputMode="numeric" min={1} max={20} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={rollNow} onCheckedChange={(v) => setRollNow(v === true)} />Roll their initiative now (d20 {F.signed(fromNpc(npc).initBonus)})</label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onAdd(Math.min(20, Math.max(1, Math.round(Number(count)) || 1)), rollNow)}><Plus />Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Tracker numbers you can edit, plus the full stat block (NPC) or sheet summary (player). */
function CombatantDetails({ c, onClose, set, refresh }: {
  c: Combatant; onClose: () => void; set: (key: keyof Combatant, value: unknown) => void; refresh: (nums: Partial<Combatant>) => void;
}) {
  const [sheet, setSheet] = useState<{ sheet: any; ownerName: string } | null | 'missing'>(null);
  useEffect(() => {
    if (c.source !== 'character') return;
    api('GET', `/characters/${c.sourceId}`)
      .then((loaded) => setSheet({ sheet: upgrade(loaded.data), ownerName: loaded.ownerName }))
      .catch(() => setSheet('missing'));
  }, [c.source, c.sourceId]);

  return (
    <DetailDialog open wide onOpenChange={(o) => { if (!o) onClose(); }} title={c.name} footer={<Button onClick={onClose}>Back to the tracker</Button>}>
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <h4 className="font-sans text-sm font-bold uppercase tracking-wide text-gold-ink">In this encounter</h4>
        <p className="text-sm text-muted-foreground">Change anything here to keep track during the fight. It is saved with the encounter{c.source === 'character' ? " and does not change the player's own sheet" : ''}.</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {DETAIL_FIELDS.map(([key, label, type = 'number']) => (
            <Field key={key} label={label} htmlFor={`d-${key}`} className={key === 'conditions' || key === 'name' ? 'col-span-2' : undefined}>
              <Input id={`d-${key}`} type={type} inputMode={type === 'number' ? 'numeric' : undefined} autoComplete="off" value={c[key] as any}
                onChange={(e) => set(key, typed(e.target.value, type === 'number'))} />
            </Field>
          ))}
        </div>
        <Field label="Notes for this fight" htmlFor="d-notes"><Textarea id="d-notes" value={c.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {c.source === 'character' && sheet && sheet !== 'missing' && (
          <Button size="sm" variant="outline" onClick={() => { refresh(sheetNumbers(sheet.sheet)); toast.success(`${c.name} refreshed from their sheet.`); onClose(); }}><RefreshCw />Refresh from sheet</Button>
        )}
      </div>
      <div className="mt-4">
        {c.source === 'npc' && c.snapshot ? <><h3 className="mb-2 text-xl font-semibold">Stat block</h3><NpcDetail n={c.snapshot} onClose={onClose} /></>
          : c.source === 'character'
            ? sheet === null ? <Loading />
              : sheet === 'missing' ? <p className="text-muted-foreground">Their sheet could not be loaded (it may have been deleted).</p>
              : <><h3 className="mb-2 text-xl font-semibold">Character sheet</h3><CharacterSummary sheet={sheet.sheet} d={derive(sheet.sheet)} id={c.sourceId} ownerName={sheet.ownerName} onClose={onClose} /></>
            : <p className="text-sm text-muted-foreground">A custom combatant - there is no stat block to show.</p>}
      </div>
    </DetailDialog>
  );
}
