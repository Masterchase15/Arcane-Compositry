/**
 * components/details.tsx - the "details" pop-ups and the "pick one" list.
 *
 * Shared so a spell, item or Component looks the same whether it is opened from
 * its index page, a character sheet or the campaign hub. Arcane Compositry
 * details (Mana, Chain traits, Catalyst numbers) only show where that ruleset is in use.
 *
 *   <SpellDetail list s /> <ItemDetail it /> <ComponentDetail c /> <SubclassDetail sub cls />
 *   <NpcDetail n /> <CharacterSummary sheet d />        the body of a details dialog
 *   <DetailDialog title open onOpenChange footer>       the dialog around them
 *   <Picker ... />                                      a searchable list to choose one entry from
 */
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Eye, Plus, Search } from 'lucide-react';
import { ROMAN, ANY_CLASS, ABILITIES, SKILLS } from '@shared/rules/constants.js';
import { codifiedSpellMana, abilityMod, signed, guardMax, arcaneAttackBonus, arcaneSaveDC, coreMana, damageDice } from '@shared/rules/formulas.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Paragraphs } from '@/components/page';
import { cn } from '@/lib/utils';
import { useScope } from '@/lib/catalog';
import { OriginBadge, OriginLine } from '@/components/rulesets-bar';
import { ARCANE } from '@shared/rules/rulesets.js';

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const num0 = (v: unknown) => Number(v) || 0;

// ── Small pieces ─────────────────────────────────────────────────────────────
export function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="my-3 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">{children}</dl>;
}
export function Stat({ label, value }: { label: string; value?: ReactNode }) {
  if (value === undefined || value === null || value === '' || value === false) return null;
  return (
    <div className="rounded-lg border bg-card px-2.5 py-2">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
export function ChipRow({ label, list, plain }: { label: string; list: string[]; plain?: boolean }) {
  if (!list?.length) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{list.map((t) => <Badge key={t} variant={plain ? 'outline' : 'secondary'}>{t}</Badge>)}</div>
    </div>
  );
}
/** Shown to the campaign's DMs on anything the players cannot see yet. */
export const HiddenBadge = ({ entry }: { entry: { hidden?: boolean } }) =>
  entry.hidden ? <Badge className="ml-1.5 border-gold-line bg-gold-soft text-gold-ink" variant="outline">Hidden from players</Badge> : null;
const Kicker = ({ children }: { children: ReactNode }) => <p className="kicker mb-1 flex flex-wrap items-center">{children}</p>;
const Callout = ({ children }: { children: ReactNode }) => <div className="my-3 rounded-r-lg border-l-4 border-gold bg-gold-soft px-4 py-3">{children}</div>;
const NoteBox = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="my-3 rounded-lg border border-gold-line bg-gold-soft/60 px-4 py-3.5">
    <h4 className="mb-1 font-sans text-sm font-bold uppercase tracking-wide text-gold-ink">{title}</h4>{children}
  </div>
);
const DarkBox = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="my-3 space-y-2 rounded-lg bg-header px-4 py-3.5 text-header-foreground">
    <h4 className="font-serif font-bold text-[#ecd98f]">{title}</h4>{children}
  </div>
);
const SbHead = ({ children }: { children: ReactNode }) => <h4 className="mt-4 mb-2 border-b-[1.5px] border-gold-line pb-0.5 font-serif text-lg font-bold text-gold-ink">{children}</h4>;
const SbLine = ({ label, value }: { label: string; value?: ReactNode }) => (value ? <p className="mb-1.5"><b>{label}</b> {value}</p> : null);

// ── The dialog ───────────────────────────────────────────────────────────────
export function DetailDialog({ open, onOpenChange, title, footer, wide, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; footer?: ReactNode; wide?: boolean; children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[90dvh] overflow-y-auto', wide ? 'sm:max-w-3xl' : 'sm:max-w-2xl')}>
        <DialogHeader><DialogTitle className="font-serif text-2xl">{title}</DialogTitle><DialogDescription className="sr-only">Details</DialogDescription></DialogHeader>
        <div>{children}</div>
        <DialogFooter>{footer ?? <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Spells, items, Components ────────────────────────────────────────────────
export function SpellDetail({ list, s }: { list: string; s: any }) {
  const isCodified = list === 'codified';
  const arcane = useScope().uses(ARCANE);
  const mana = isCodified ? codifiedSpellMana(s.level) : s.mana;
  return (
    <>
      <Kicker>
        {isCodified ? (s.level === 0 ? `${s.school} cantrip` : `${ordinal(s.level)}-level ${s.school}`) : `Potency ${ROMAN[s.potency]} ${s.school} Composition`}
        {s.ritual ? ' · Ritual' : ''}<OriginBadge entry={s} /><HiddenBadge entry={s} />
      </Kicker>
      <StatGrid>
        {isCodified ? <>
          <Stat label="Casting time" value={s.castingTime} /><Stat label="Range" value={s.range} /><Stat label="Components" value={s.components} />
          <Stat label="Duration" value={`${s.duration}${s.concentration && !/concentration/i.test(s.duration) ? ' (Concentration)' : ''}`} />
          {arcane && <Stat label="Mana" value={`${mana} (replaces a ${s.level === 0 ? 'cantrip' : `level ${s.level} slot`})`} />}
        </> : <>
          <Stat label="Components" value={[...s.physicals, ...s.aspectuals].join(' + ')} /><Stat label="Form" value={s.form} /><Stat label="Mana" value={String(mana)} />
          <Stat label="Range" value={s.range} /><Stat label="Area" value={s.area} /><Stat label="Duration" value={s.duration} />
          <Stat label="Damage / effect" value={s.damage} /><Stat label="Resolution" value={s.resolution} /><Stat label="Extra effect" value={s.effect} />
          <Stat label="Created by" value={s.creator} /><Stat label="Codification benefit" value={s.optimization} />
        </>}
      </StatGrid>
      <Paragraphs text={s.description} />
      {s.higherLevels && <p className="mt-3"><b>{arcane ? 'Using more Mana.' : 'Using a higher-level spell slot.'}</b> {s.higherLevels}</p>}
      <ChipRow label="Classes" list={s.classes.map((c: string) => (c === ANY_CLASS ? 'Any class' : c))} />
      <ChipRow label="Tags" list={s.tags} plain />
      <OriginLine entry={s} />
    </>
  );
}

export function ItemDetail({ it }: { it: any }) {
  const arcane = useScope().uses(ARCANE);
  const bonus = [it.acBonus && `${it.acBonus > 0 ? '+' : ''}${it.acBonus} Armor Class`, it.saveBonus && `${it.saveBonus > 0 ? '+' : ''}${it.saveBonus} saving throws`].filter(Boolean).join(', ');
  return (
    <>
      <Kicker>{[it.category, it.rarity].join(' · ')}{it.attunement ? ' · Requires attunement' : ''}<OriginBadge entry={it} /><HiddenBadge entry={it} /></Kicker>
      <StatGrid>
        <Stat label="Damage" value={it.damage} /><Stat label="Properties" value={it.properties.join(', ')} /><Stat label="Mastery" value={it.mastery} />
        <Stat label="Armor Class" value={it.armorClass} /><Stat label="While in use" value={bonus} />
        {arcane && <><Stat label="Capacity" value={it.capacity && `${it.capacity} Mana`} /><Stat label="Throughput" value={it.throughput && `${it.throughput} Mana per invocation`} /></>}
        <Stat label="Cost" value={it.cost} /><Stat label="Weight" value={it.weight} />
      </StatGrid>
      {arcane && it.chainTrait && <Callout><b className="text-gold-ink">Attack Chain trait:</b> {it.chainTrait}</Callout>}
      <Paragraphs text={it.description} />
      <ChipRow label="Tags" list={it.tags} plain />
      <OriginLine entry={it} />
    </>
  );
}

export function ComponentDetail({ c }: { c: any }) {
  return (
    <>
      <Kicker>{c.kind} Component - {c.kind === 'Physical' ? 'what exists?' : 'what property is applied?'}<OriginBadge entry={c} /><HiddenBadge entry={c} /></Kicker>
      {c.tendrilColor && <StatGrid><Stat label="Tendril glow" value={c.tendrilColor} /></StatGrid>}
      <Paragraphs text={c.description} />
      {c.interactions && <NoteBox title="Composites & counters"><Paragraphs text={c.interactions} /></NoteBox>}
      <ChipRow label="Tags" list={c.tags} plain />
      <OriginLine entry={c} />
    </>
  );
}

/** A subclass: what it is, and what it adds to its parent class level by level. */
export function SubclassDetail({ sub, cls }: { sub: any; cls?: any }) {
  const arcane = useScope().uses(ARCANE);
  const levels: number[] = [...new Set<number>(sub.features.map((f: any) => f.level))];
  return (
    <>
      <Kicker>{sub.className} subclass<OriginBadge entry={sub} /><HiddenBadge entry={sub} /></Kicker>
      <Paragraphs text={sub.description} />
      {sub.features.length ? <>
        <h3 className="mt-5 text-xl font-semibold">What it adds to the {sub.className}</h3>
        <p className="mb-2 text-sm text-muted-foreground">
          You choose a subclass at {sub.className} level {levels[0]}. It then grants features at level{levels.length > 1 ? 's' : ''} {levels.join(', ')}, on top of everything the {sub.className} already gets.
        </p>
        <FeatureTable features={sub.features} />
      </> : <p className="mt-3 text-muted-foreground">No features have been written for this subclass yet.</p>}
      {arcane && sub.compositry && <DarkBox title="In Arcane Compositry"><Paragraphs text={sub.compositry} /></DarkBox>}
      {cls && (
        <StatGrid>
          <Stat label="Parent class" value={cls.name} /><Stat label="Hit Die" value={`d${cls.hitDie}`} />
          {arcane && <Stat label="Invocation ability" value={ABILITIES.find((a: any) => a.key === cls.invocation)?.name} />}
        </StatGrid>
      )}
      <ChipRow label="Tags" list={sub.tags || []} plain />
      {!sub.quick && <OriginLine entry={sub} />}
    </>
  );
}

/** Features by level, rows of the same level grouped together. */
export function FeatureTable({ features }: { features: { level: number; name: string; text: string }[] }) {
  const levels = [...new Set(features.map((f) => f.level))];
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-[0.95rem]">
        <thead><tr className="bg-header text-left text-xs uppercase tracking-wider text-header-foreground">
          <th className="px-2.5 py-2 text-center">Level</th><th className="px-2.5 py-2">Feature</th><th className="px-2.5 py-2">What it does</th>
        </tr></thead>
        <tbody>
          {levels.map((lvl, group) => features.filter((f) => f.level === lvl).map((f, i, all) => (
            <tr key={`${lvl}-${i}`} className={cn('border-b align-top', group % 2 === 0 && 'bg-muted/50')}>
              {i === 0 && <td className="px-2.5 py-2 text-center font-bold" rowSpan={all.length}>{lvl}</td>}
              <td className="px-2.5 py-2 font-bold">{f.name}</td>
              <td className="px-2.5 py-2">{f.text || <span className="text-muted-foreground">See your rulebook.</span>}</td>
            </tr>
          )))}
        </tbody>
      </table>
    </div>
  );
}

// ── Stat blocks ──────────────────────────────────────────────────────────────
function StatBlock({ children }: { children: ReactNode }) {
  return <div className="mb-3.5 border-y-4 border-gold bg-gold-soft/55 px-3.5 py-3">{children}</div>;
}
function Scores({ cells }: { cells: { short: string; score: ReactNode; sub: ReactNode }[] }) {
  return (
    <div className="my-2.5 grid grid-cols-3 gap-1.5 text-center sm:grid-cols-6">
      {cells.map((c) => (
        <div key={c.short} className="grid rounded-md border border-gold-line bg-card px-0.5 py-1.5">
          <span className="text-xs font-bold uppercase text-muted-foreground">{c.short}</span>
          <b className="font-serif text-lg">{c.score}</b><span className="text-xs">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}

/** An NPC or enemy as a 2024-style stat block, with its Arcane Compositry numbers. DM only. */
export function NpcDetail({ n, onClose }: { n: any; onClose?: () => void }) {
  const usesArcane = useScope().uses(ARCANE);
  const block = (title: string, entries: any[]) => (entries.length ? <>
    <SbHead>{title}</SbHead>
    {entries.map((e, i) => <p key={i} className="mb-1.5"><b><i>{e.name}.</i></b> {e.text}</p>)}
  </> : null);
  const guard = n.guard || String(guardMax(n.pb));
  const im = n.invocation ? abilityMod(n.scores[n.invocation]) : null;
  const profile = n.invocation || n.maxPotency || n.physicals.length || n.aspectuals.length || n.signatures;
  const arcane = [
    im !== null && <><b>Invocation:</b> {ABILITIES.find((a: any) => a.key === n.invocation)?.name} ({signed(im)})</>,
    im !== null && <><b>Arcane attack:</b> {signed(arcaneAttackBonus(n.pb, im))}</>,
    im !== null && <><b>Save DC:</b> {arcaneSaveDC(n.pb, im)}</>,
    n.mana && <><b>Mana:</b> {n.mana}</>,
    n.maxPotency ? <><b>Max Potency:</b> {ROMAN[n.maxPotency]} ({coreMana(n.maxPotency)} Core Mana, {damageDice(n.maxPotency)} dice)</> : null,
    n.temperament && <><b>Temperament:</b> {n.temperament}</>,
  ].filter(Boolean);
  return (
    <>
      <StatBlock>
        <p className="mb-1.5 italic text-muted-foreground">
          {[n.size, n.creatureType].filter(Boolean).join(' ')}{n.alignment ? `, ${n.alignment}` : ''}{' '}
          <Badge variant={n.kind === 'Enemy' || n.kind === 'Boss' ? 'default' : 'secondary'}>{n.kind}</Badge>
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4">
          <SbLine label="AC" value={n.ac} /><SbLine label="Initiative" value={n.initiative} /><SbLine label="HP" value={n.hp} /><SbLine label="Speed" value={n.speed} />
        </div>
        <Scores cells={ABILITIES.map((a: any) => ({ short: a.short, score: n.scores[a.key], sub: signed(abilityMod(n.scores[a.key])) }))} />
        <SbLine label="Saving Throws" value={n.saves} /><SbLine label="Skills" value={n.skills} />
        <SbLine label="Vulnerabilities" value={n.vulnerabilities} /><SbLine label="Resistances" value={n.resistances} /><SbLine label="Immunities" value={n.immunities} />
        <SbLine label="Gear" value={n.gear} /><SbLine label="Senses" value={n.senses} /><SbLine label="Languages" value={n.languages} />
        <SbLine label="CR" value={n.cr && `${n.cr}${/PB/i.test(n.cr) ? '' : `; PB ${signed(n.pb)}`}`} />
        {block('Traits', n.traits)}{block('Actions', n.actions)}{block('Bonus Actions', n.bonusActions)}{block('Reactions', n.reactions)}{block('Legendary Actions', n.legendary)}
      </StatBlock>

      {usesArcane && <NoteBox title="Attack Chains & active defense">
        <StatGrid>
          <Stat label="Guard" value={`${guard}${n.guard ? '' : ' (2 + PB)'}`} /><Stat label="Max Chain Length" value={n.chainLength} /><Stat label="Proficiency Bonus" value={signed(n.pb)} />
        </StatGrid>
        {n.momentum && <p className="text-sm"><b>Momentum Die:</b> {n.momentum}</p>}
      </NoteBox>}

      {usesArcane && profile ? (
        <DarkBox title="Arcane Profile">
          <p>{arcane.map((x, i) => <span key={i}>{i > 0 && ' · '}{x}</span>)}</p>
          {n.physicals.length > 0 && <p><b>Known Physicals:</b> {n.physicals.join(', ')}</p>}
          {n.aspectuals.length > 0 && <p><b>Known Aspects:</b> {n.aspectuals.join(', ')}</p>}
          {n.forms.length > 0 && <p><b>Known Forms:</b> {n.forms.join(', ')}</p>}
          {n.signatures && <><p><b>Signature Compositions</b></p><Paragraphs text={n.signatures} /></>}
          <p className="text-sm">Roll its turn with the <Link className="underline" to="/tools" onClick={onClose}>Enemy Compositor roller</Link> (codex chapter 14).</p>
        </DarkBox>
      ) : null}

      <SbHead>Description &amp; roleplay</SbHead>
      <SbLine label="Location" value={n.location} /><SbLine label="Faction" value={n.faction} />
      <Paragraphs text={n.description} />
      {n.notes && <><Callout><b className="text-gold-ink">DM notes:</b></Callout><Paragraphs text={n.notes} /></>}
      <ChipRow label="Tags" list={n.tags} plain />
    </>
  );
}

/** A player character at a glance, built from their sheet (after upgrade()) and derive(sheet). */
export function CharacterSummary({ sheet, d, id, ownerName, onClose }: { sheet: any; d: any; id?: string; ownerName?: string; onClose?: () => void }) {
  const usesArcane = useScope().uses(ARCANE);
  const who = [`Level ${d.level}`, sheet.identity.species, sheet.identity.className, sheet.identity.subclass && `(${sheet.identity.subclass})`].filter(Boolean).join(' ');
  const trained = (Object.values(SKILLS).flat() as string[]).filter((sk) => Number(sheet.skills[sk]) > 0)
    .map((sk) => `${sk} ${signed(d[`skill_${sk.replace(/\s+/g, '')}`])}${Number(sheet.skills[sk]) > 1 ? ' (E)' : ''}`);
  const inUse = sheet.inventory.filter((i: any) => i.equipped).map((i: any) => i.name);
  const rows = (list: any[], cols: (r: any) => [string, string]) => (list.length
    ? <ul className="m-0 list-none p-0 text-sm">{list.map((r, i) => <li key={i} className="flex justify-between gap-3 border-b border-dotted py-1"><span>{cols(r)[0]}</span><span>{cols(r)[1]}</span></li>)}</ul>
    : <p className="text-sm text-muted-foreground">None recorded.</p>);
  return (
    <>
      <Kicker>{who}{ownerName ? ` · played by ${ownerName}` : ''}</Kicker>
      <StatBlock>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-4">
          <SbLine label="AC" value={String(d.acTotal)} />
          <SbLine label="HP" value={`${sheet.hp.current} / ${sheet.hp.max}${num0(sheet.hp.temp) ? ` (+${num0(sheet.hp.temp)} temp)` : ''}`} />
          <SbLine label="Initiative" value={signed(d.initiative)} /><SbLine label="Speed" value={sheet.vitals.speed} />
        </div>
        <Scores cells={ABILITIES.map((a: any) => ({ short: a.short, score: sheet.abilities[a.key].score, sub: `${signed(d.mods[a.key])} · save ${signed(d[`save_${a.key}`])}` }))} />
        <p className="mb-1.5"><b>Proficiency Bonus</b> {signed(d.profBonus)} · <b>Passive Perception</b> {d.passivePerception}</p>
        <SbLine label="Skills" value={trained.join(', ')} />
        <SbLine label="Items in use" value={inUse.join(', ')} />
      </StatBlock>
      {usesArcane ? <><NoteBox title="Attack Chains & active defense">
        <StatGrid>
          <Stat label="Guard" value={`${num0(sheet.chain.guardCurrent)} of ${d.guardMax}`} /><Stat label="Max Chain Length" value={String(d.chainLength)} />
          <Stat label="Dodge / Parry" value={`${signed(d.dodge)} / ${signed(d.parry)}`} /><Stat label="Momentum Die" value={`d${sheet.momentum.die}`} /><Stat label="Stasis DC" value={String(d.stasisDC)} />
        </StatGrid>
      </NoteBox>
      <DarkBox title="Arcane Core">
        <p><b>Mana:</b> {num0(sheet.arcane.manaCurrent)} of {d.manaMax} · <b>Arcane attack:</b> {signed(d.arcaneAttack)} · <b>Save DC:</b> {d.saveDC} · <b>Max Potency:</b> {ROMAN[sheet.arcane.maxPotency] || '-'}</p>
        <p><b>Known Physicals:</b> {sheet.language.physicals.join(', ') || 'none'} · <b>Aspectuals:</b> {sheet.language.aspectuals.join(', ') || 'none'}</p>
      </DarkBox></> : d.slotMax.some((n: number) => n > 0) && (
        <NoteBox title="Spellcasting">
          <p><b>Spell attack:</b> {signed(d.spellAttack)} · <b>Save DC:</b> {d.saveDC} · <b>Slots left:</b>{' '}
            {d.slotMax.map((max: number, i: number) => max > 0 && `${ordinal(i + 1)} ${Math.max(0, max - num0(sheet.spellcasting.slotsUsed[i]))}/${max}`).filter(Boolean).join(', ')}</p>
        </NoteBox>
      )}
      <SbHead>Weapons</SbHead>
      {rows(sheet.weapons, (w) => [`${w.name}${usesArcane && w.chain ? ` - ${w.chain}` : ''}`, [w.atk, w.damage].filter(Boolean).join(' · ')])}
      <SbHead>{usesArcane ? <>Spells &amp; Compositions</> : 'Spells'}</SbHead>
      {rows(sheet.compositions, (r) => [`${r.name}${r.status ? ` (${r.status})` : ''}`, [usesArcane && r.mana !== '' && `${r.mana} Mana`, r.damage].filter(Boolean).join(' · ')])}
      {id && <Button asChild size="sm" variant="outline" className="mt-3"><Link to={`/characters/${id}`} onClick={onClose}><Eye />Open the full sheet</Link></Button>}
    </>
  );
}

// ── Picker ───────────────────────────────────────────────────────────────────
/** A searchable list in a dialog; the person picks one entry. `describe(e)` is the grey line under each name. */
export function Picker<T extends { name: string; hidden?: boolean }>({ open, onOpenChange, title, intro, entries, describe, emptyText, onPick }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; intro?: string;
  entries: T[]; describe: (e: T) => string; emptyText: string; onPick: (e: T) => void;
}) {
  const [q, setQ] = useState('');
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = entries.filter((e) => words.every((w) => `${e.name} ${describe(e)}`.toLowerCase().includes(w)));
  return (
    <DetailDialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(''); }} title={title}>
      {intro && <p className="mb-3 text-sm text-muted-foreground">{intro}</p>}
      {entries.length > 6 && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-9" aria-label="Search the list" />
        </div>
      )}
      <div className="grid gap-2">
        {entries.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">{emptyText}</p>}
        {shown.map((e, i) => (
          <button key={i} type="button" onClick={() => { onOpenChange(false); setQ(''); onPick(e); }}
            className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-accent/40">
            <span><b className="block font-serif">{e.name}<HiddenBadge entry={e} /></b><span className="text-sm text-muted-foreground">{describe(e)}</span></span>
            <Plus className="size-4 shrink-0 text-primary" />
          </button>
        ))}
      </div>
    </DetailDialog>
  );
}
