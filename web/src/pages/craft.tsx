/**
 * pages/craft.tsx - the Spellcrafter (/craft).
 *
 * The player picks Components, a Form, a Potency and modifiers; the panel on
 * the right shows Mana, damage, attack / Save DC and warnings, live.
 * All maths comes from shared/rules/formulas.js.
 *
 * With the Homebrew filter set to a campaign, that campaign's Components are
 * offered too. A campaign's DM can also save the finished spell straight into
 * the campaign's Compositry spell list ("Save to campaign homebrew").
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, Copy, Dices, Flag, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { PHYSICALS, ASPECTUALS, FORMS, ROMAN, SCHOOLS, ANY_CLASS } from '@shared/rules/constants.js';
import * as F from '@shared/rules/formulas.js';
import { derive, upgrade } from '@shared/rules/character.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, NativeSelect, Options } from '@/components/fields';
import { HomebrewBar } from '@/components/homebrew-bar';
import { characterLabel, useMyCharacters } from '@/components/list';
import { PageHead } from '@/components/page';
import { ResultTile } from '@/components/panel';
import { api, errorMessage } from '@/lib/api';
import { invalidateLists } from '@/lib/catalog';
import { useSession } from '@/lib/session';
import { appendComposition } from '@/lib/spellbook';
import { cn } from '@/lib/utils';

const SAVES = ['DEX', 'STR', 'CON', 'WIS', 'INT', 'CHA'];
const costOpts = (table: any[]) => table.map((r) => ({ value: r.id, label: `${r.label}  (+${r.cost})` }));

const START = {
  name: '', concept: '', physicals: ['Geo'], aspectuals: ['Fire'], custom: [] as string[],
  form: 'Projectile', delivery: 'single', potency: 3,
  range: 'close', area: 'single', duration: 'instant', removeConcentration: false,
  effect: 'cosmetic', effectText: '', environmental: false, adjustment: 0,
  resolution: 'attack', save: 'DEX', hits: 1, pb: 2, im: 3, charId: '',
};
type State = typeof START;

export default function Craft() {
  const { user, groups } = useSession();
  const { characters } = useMyCharacters();
  const [s, setS] = useState<State>(START);
  const set = (patch: Partial<State>) => setS((x) => ({ ...x, ...patch }));
  const [character, setCharacter] = useState<{ name: string; sheet: any } | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [rollMessage, setRollMessage] = useState('');
  const [saveTo, setSaveTo] = useState('');
  const [toCampaign, setToCampaign] = useState(false);
  const dmCampaigns = groups.filter((g) => g.role === 'dm');

  // Choosing a character uses its PB, Invocation Modifier, Mana, Catalyst and known Components.
  useEffect(() => {
    if (!s.charId) { setCharacter(null); return; }
    let alive = true;
    api('GET', `/characters/${s.charId}`).then(({ data }) => {
      if (!alive) return;
      const sheet = upgrade(data);
      const d = derive(sheet);
      setCharacter({ name: sheet.identity.name || 'This character', sheet });
      setS((x) => ({ ...x, pb: d.profBonus, im: d.invocationMod }));
    }).catch((err) => toast.error(errorMessage(err)));
    return () => { alive = false; };
  }, [s.charId]);

  const known = character?.sheet.language;
  const lists = { physicals: (known ? known.physicals : PHYSICALS) as string[], aspectuals: (known ? known.aspectuals : ASPECTUALS) as string[] };
  // Drop chosen Components the character does not know.
  useEffect(() => {
    if (!known) return;
    setS((x) => ({ ...x, physicals: x.physicals.filter((n) => known.physicals.includes(n)), aspectuals: x.aspectuals.filter((n) => known.aspectuals.includes(n)) }));
  }, [known]);

  const components = [...s.physicals, ...s.aspectuals, ...s.custom];
  const autoName = `${components.join(' + ') || 'Raw Mana'} ${s.form}`;
  const title = s.name.trim() || autoName;

  /** Works out every number for the current choices. */
  const r = useMemo(() => {
    const count = Math.max(1, components.length);
    const mana = F.finalMana({ potency: s.potency, componentCount: count, range: s.range, area: s.area, duration: s.duration, removeConcentration: s.removeConcentration, effect: s.effect, environmental: s.environmental, adjustment: s.adjustment });
    const dmg = F.compositionDamage({ potency: s.potency, delivery: s.delivery, effect: s.effect });
    const dc = F.arcaneSaveDC(s.pb, s.im);
    const atk = F.arcaneAttackBonus(s.pb, s.im);
    const resolve = s.resolution === 'attack' ? `d20 ${F.signed(atk)}` : s.resolution === 'save' ? `${s.save} save DC ${dc}` : 'No roll';
    const damageText = s.delivery === 'armor' ? `+${dmg.count} Reinforcement` : s.delivery === 'infusion' ? `${dmg.text} Charge Pool` : dmg.text;
    return { count, mana, dmg, dc, atk, resolve, damageText, stability: F.stabilityDC({ potency: s.potency, componentCount: count }).total, split: F.splitChain(dmg.count, s.hits) as number[] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, components.length]);

  const warnings: string[] = [];
  if (!components.length) warnings.push('No Components chosen yet - pick at least one Physical or Aspectual.');
  if (components.length >= 4) warnings.push('4 Components costs "+5 or more". Ask your DM and use the DM adjustment box for the extra.');
  if (s.effect === 'extreme' && s.potency < 5) warnings.push('Extreme effects (stun, paralysis) usually need Potency V or higher.');
  if (r.dmg.count === 0 && r.dmg.die) warnings.push('The effect has traded away all of the damage dice.');
  if (character) {
    const sh = character.sheet;
    const throughput = F.num(sh.catalyst.throughput, 0);
    if (throughput && r.mana.total > throughput) warnings.push(`Costs ${r.mana.total} Mana, but ${character.name}'s Catalyst can only route ${throughput} at once (Throughput).`);
    if (r.mana.total > F.num(sh.arcane.manaCurrent)) warnings.push(`${character.name} has ${F.num(sh.arcane.manaCurrent)} Mana left - not enough for this.`);
    if (s.potency > F.num(sh.arcane.maxPotency, 9)) warnings.push(`Potency ${ROMAN[s.potency]} is above ${character.name}'s Max Potency (${ROMAN[F.num(sh.arcane.maxPotency, 1)]}).`);
  }

  const find = (t: any[], id: string) => t.find((x) => x.id === id).label;
  const summary = () => [
    `${title} - Potency ${ROMAN[s.potency]}`,
    `Components: ${components.join(' + ') || 'none'} | Form: ${s.form}`,
    `Mana: ${r.mana.total} | ${s.delivery === 'armor' ? 'Reinforcement' : 'Damage'}: ${r.damageText} | ${r.resolve}`,
    `Range: ${find(F.RANGE_COSTS, s.range)} | Area: ${find(F.AREA_COSTS, s.area)} | Duration: ${find(F.DURATION_COSTS, s.duration)}`,
    s.effect !== 'cosmetic' || s.effectText ? `Effect: ${find(F.EFFECT_RANKS, s.effect)}${s.effectText ? ` - ${s.effectText}` : ''}` : '',
    s.concept.trim(),
  ].filter(Boolean).join('\n');

  const toggle = (key: 'physicals' | 'aspectuals', value: string) =>
    setS((x) => ({ ...x, [key]: x[key].includes(value) ? x[key].filter((v) => v !== value) : [...x[key], value] }));
  const addCustom = () => {
    const v = customInput.trim();
    if (v && !components.some((c) => c.toLowerCase() === v.toLowerCase())) set({ custom: [...s.custom, v] });
    setCustomInput('');
  };
  const roll = (kind: 'attack' | 'damage') => {
    if (kind === 'attack') {
      const die = F.roll(1, 20).total;
      setRollMessage(`Attack: d20 (${die}) ${F.signed(r.atk)} = ${die + r.atk}${die === 20 ? ' - natural 20!' : die === 1 ? ' - natural 1' : ''}`);
    } else {
      const d = F.roll(r.dmg.count, r.dmg.die);
      setRollMessage(`Damage: ${d.dice.join(' + ')} = ${d.total}`);
    }
  };
  const save = async () => {
    try {
      const saved = await appendComposition(saveTo || s.charId || characters[0].id, {
        level: ROMAN[s.potency], name: title, components: components.join(' + '), form: s.form, mana: r.mana.total,
        range: find(F.RANGE_COSTS, s.range), atkdc: r.resolve,
        damage: [r.damageText, s.effectText.trim()].filter(Boolean).join('; '), status: 'Improvised',
      });
      toast.success(`Saved to ${saved.identity.name || 'character'}.`);
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const needsConcentration = F.DURATION_COSTS.find((d: any) => d.id === s.duration).concentration;
  const out = s.delivery === 'armor' ? 'Reinforcement' : s.delivery === 'infusion' ? 'Charge Pool' : 'Damage';

  return (
    <>
      <PageHead kicker="Component(s) + Form + Potency + Modifiers = Composition" title="Spellcrafter">
        Describe the magic; the numbers appear on the right. Nothing is forbidden - reality just charges more Mana.
      </PageHead>
      <HomebrewBar />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {characters.length > 0 && (
            <div className="surface p-4">
              <Field label="Crafting as" htmlFor="charId" hint="Uses that character's Proficiency Bonus, Invocation Modifier, Mana and Catalyst Throughput.">
                <NativeSelect id="charId" value={s.charId} onChange={(e) => set({ charId: e.target.value })}>
                  <option value="">No character - I'll type my own bonuses</option>
                  <Options options={characters.map((c) => ({ value: c.id, label: characterLabel(c) }))} />
                </NativeSelect>
              </Field>
            </div>
          )}

          <Step n={1} title="Components" sub="what is the magic made of?">
            {character && <p className="text-sm text-muted-foreground">Showing only the Components {character.name} has learned. Learn more on the character sheet's Arcane tab.</p>}
            <ChipGroup label="Physical - what exists?" options={lists.physicals} chosen={s.physicals} onToggle={(v) => toggle('physicals', v)} />
            <ChipGroup label="Aspectual - what property is applied?" options={lists.aspectuals} chosen={s.aspectuals} onToggle={(v) => toggle('aspectuals', v)} />
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Other Components your DM has approved</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {s.custom.map((c) => (
                  <Button key={c} type="button" size="sm" variant="secondary" aria-label={`Remove ${c}`} onClick={() => set({ custom: s.custom.filter((x) => x !== c) })}>{c}<X /></Button>
                ))}
              </div>
              <div className="flex max-w-sm gap-2">
                <Input value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="e.g. Wind" maxLength={30} aria-label="Name of another Component"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
                <Button type="button" variant="outline" onClick={addCustom}><Plus />Add</Button>
              </div>
            </div>
          </Step>

          <Step n={2} title="Form" sub="how does it manifest?">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Form" htmlFor="form">
                <NativeSelect id="form" value={s.form} onChange={(e) => {
                  const delivery = FORMS.find((f: any) => f.name === e.target.value).delivery;
                  set({ form: e.target.value, delivery, ...(['infusion', 'armor'].includes(delivery) ? { resolution: 'none' } : {}) });
                }}><Options options={FORMS.map((f: any) => f.name)} /></NativeSelect>
              </Field>
              <Field label="Damage die" htmlFor="delivery" hint="Set from the Form. Change it if the spell is riskier or lingers.">
                <NativeSelect id="delivery" value={s.delivery} onChange={(e) => set({ delivery: e.target.value })}>
                  <Options options={F.DELIVERIES.map((d: any) => ({ value: d.id, label: d.die ? `${d.label} (d${d.die})` : d.label }))} />
                </NativeSelect>
              </Field>
            </div>
          </Step>

          <Step n={3} title="Potency" sub="how hard do you push?">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Potency">
              {ROMAN.slice(1).map((rn: string, i: number) => (
                <Button key={rn} type="button" size="sm" className="min-w-11 font-serif" variant={s.potency === i + 1 ? 'default' : 'outline'} aria-pressed={s.potency === i + 1} onClick={() => set({ potency: i + 1 })}>{rn}</Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Potency {ROMAN[s.potency]}: {F.coreMana(s.potency)} Core Mana, {F.damageDice(s.potency)} damage dice - {F.POTENCY[s.potency].meaning.toLowerCase()}.
            </p>
          </Step>

          <Step n={4} title="Modifiers" sub="what makes it expensive?">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Maximum range" htmlFor="range"><NativeSelect id="range" value={s.range} onChange={(e) => set({ range: e.target.value })}><Options options={costOpts(F.RANGE_COSTS)} /></NativeSelect></Field>
              <Field label="Approx. area" htmlFor="area"><NativeSelect id="area" value={s.area} onChange={(e) => set({ area: e.target.value })}><Options options={costOpts(F.AREA_COSTS)} /></NativeSelect></Field>
              <Field label="Duration" htmlFor="duration"><NativeSelect id="duration" value={s.duration} onChange={(e) => set({ duration: e.target.value })}><Options options={costOpts(F.DURATION_COSTS)} /></NativeSelect></Field>
              <Field label="Extra effect" htmlFor="effect" hint="Each rank also trades away one damage die.">
                <NativeSelect id="effect" value={s.effect} onChange={(e) => set({ effect: e.target.value })}>
                  <Options options={F.EFFECT_RANKS.map((x: any) => ({ value: x.id, label: `${x.label}: ${x.examples}  (+${x.cost})` }))} />
                </NativeSelect>
              </Field>
              <Field label="Describe the effect" htmlFor="effectText"><Input id="effectText" value={s.effectText} onChange={(e) => set({ effectText: e.target.value })} placeholder="e.g. knocks the target prone" maxLength={120} /></Field>
              <Field label="DM adjustment (Mana)" htmlFor="adjustment" hint='For "+5 or more" Composites and table rulings.'>
                <Input id="adjustment" type="number" inputMode="numeric" min={-10} max={20} value={s.adjustment} onChange={(e) => set({ adjustment: F.num(e.target.value) })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Check checked={s.removeConcentration} onChange={(v) => set({ removeConcentration: v })}>Remove Concentration (+{F.REMOVE_CONCENTRATION_COST})</Check>
              <Check checked={s.environmental} onChange={(v) => set({ environmental: v })}>Abundant Physical Component nearby (-1)</Check>
            </div>
            {s.removeConcentration && (
              <p className="text-sm text-muted-foreground" role="status">
                {needsConcentration ? `Concentration removed: +${F.REMOVE_CONCENTRATION_COST} Mana added.`
                  : 'This duration does not use Concentration, so there is nothing to remove (+0). Choose "Up to 1 minute" or "Up to 10 minutes" for this to apply.'}
              </p>
            )}
          </Step>

          <Step n={5} title="Resolve it">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="How is it resolved?" htmlFor="resolution">
                <NativeSelect id="resolution" value={s.resolution} onChange={(e) => set({ resolution: e.target.value })}>
                  <Options options={[{ value: 'attack', label: 'Arcane attack roll' }, { value: 'save', label: 'Target makes a saving throw' }, { value: 'none', label: 'No roll (utility, self, infusion)' }]} />
                </NativeSelect>
              </Field>
              {s.resolution === 'save' && (
                <Field label="Which save?" htmlFor="save" hint="The danger chooses the save, not the element.">
                  <NativeSelect id="save" value={s.save} onChange={(e) => set({ save: e.target.value })}><Options options={SAVES} /></NativeSelect>
                </Field>
              )}
              <Field label="Attacks in the Chain" htmlFor="hits" hint="Split the damage pool across linked attacks.">
                <Input id="hits" type="number" inputMode="numeric" min={1} max={5} value={s.hits} onChange={(e) => set({ hits: Math.min(5, Math.max(1, F.num(e.target.value, 1))) })} />
              </Field>
              <Field label="Proficiency Bonus" htmlFor="pb"><Input id="pb" type="number" inputMode="numeric" min={2} max={6} value={s.pb} onChange={(e) => set({ pb: F.num(e.target.value) })} /></Field>
              <Field label="Invocation Modifier" htmlFor="im"><Input id="im" type="number" inputMode="numeric" min={-5} max={10} value={s.im} onChange={(e) => set({ im: F.num(e.target.value) })} /></Field>
            </div>
          </Step>

          <Step n={6} title="Describe it">
            <Field label="Name" htmlFor="name"><Input id="name" value={s.name} onChange={(e) => set({ name: e.target.value })} placeholder="Leave blank for an automatic name" maxLength={80} autoComplete="off" /></Field>
            <Field label="How does it look, move and sound?" htmlFor="concept">
              <Textarea id="concept" value={s.concept} onChange={(e) => set({ concept: e.target.value })} maxLength={600}
                placeholder={'"I condense a fist-sized chunk of molten stone and fire it at the enemy."'} />
            </Field>
          </Step>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Spell results">
          <div className="overflow-hidden rounded-xl border-[1.5px] border-primary/40 bg-card shadow-sm">
            <header className="bg-header px-4 py-3 text-header-foreground">
              <h2 className="font-serif text-xl font-bold text-header-foreground">{title}</h2>
              <p className="text-sm opacity-85">Potency {ROMAN[s.potency]} · {F.POTENCY[s.potency].meaning}</p>
            </header>
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-2">
                <ResultTile label="Final Mana" value={r.mana.total} />
                <ResultTile label={out} value={s.delivery === 'armor' ? `+${r.dmg.count}` : r.dmg.text}
                  note={s.delivery === 'infusion' ? '1d6 per hit, 2d6 on a Finisher' : s.delivery === 'armor' ? 'added to a legal Block' : `average ${r.dmg.average}`} />
                <div className="col-span-2">
                  <ResultTile label={s.resolution === 'save' ? 'Saving throw' : 'Arcane attack'}
                    value={s.resolution === 'attack' ? `d20 ${F.signed(r.atk)}` : s.resolution === 'save' ? `DC ${r.dc}` : '-'}
                    note={s.resolution === 'save' ? `${s.save} save` : s.resolution === 'none' ? 'No roll needed' : 'vs. AC'} />
                </div>
              </div>
              {warnings.map((w) => (
                <div key={w} className="flex gap-2 rounded-r-lg border-l-4 border-gold bg-gold-soft px-3 py-2 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold-ink" /><span>{w}</span>
                </div>
              ))}
              <Breakdown title="Mana breakdown" rows={[
                ...r.mana.parts.map((p: any, i: number) => [p.label, `${i && p.value >= 0 ? '+' : ''}${p.value}`] as [string, string]),
              ]} total={['Final Mana', String(r.mana.total)]} />
              <Breakdown title="Damage dice" rows={[
                [`Potency ${ROMAN[s.potency]}: ${s.potency} + 2 + floor(${s.potency}/3)`, String(r.dmg.base)],
                ...(r.dmg.base !== r.dmg.count ? [['Effect rank traded away', `-${r.dmg.base - r.dmg.count}`] as [string, string]] : []),
              ]} total={[F.DELIVERIES.find((d: any) => d.id === s.delivery).label, r.damageText]}
                after={s.hits > 1 && r.dmg.die ? [`Split over ${s.hits} attacks`, r.split.map((n) => `${n}d${r.dmg.die}`).join(' / ')] : undefined} />
              <div>
                <Breakdown title="If someone interferes" rows={[['Circuit Stability DC (before damage)', String(r.stability)], ['DC to Read the Circuit', String(F.readCircuitDC(s.potency))]]} />
                <p className="mt-1 text-xs text-muted-foreground">Stability DC rises by 1 for every 10 damage you take mid-invocation.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.resolution === 'attack' && <Button type="button" variant="outline" size="sm" onClick={() => roll('attack')}><Dices />Roll attack</Button>}
                {r.dmg.die > 0 && r.dmg.count > 0 && <Button type="button" variant="outline" size="sm" onClick={() => roll('damage')}><Dices />Roll {s.delivery === 'infusion' ? 'full pool' : 'damage'}</Button>}
              </div>
              <p className="min-h-6 tabular-nums" role="status">{rollMessage}</p>

              {user ? characters.length ? (
                <div className="space-y-2">
                  <Field label="Save to character" htmlFor="save-to">
                    <NativeSelect id="save-to" value={saveTo || s.charId || characters[0].id} onChange={(e) => setSaveTo(e.target.value)}>
                      <Options options={characters.map((c) => ({ value: c.id, label: c.groupName ? `${c.name} (${c.groupName})` : c.name }))} />
                    </NativeSelect>
                  </Field>
                  <Button type="button" className="w-full" onClick={save}><Plus />Save as Improvised Composition</Button>
                </div>
              ) : <Button asChild className="w-full"><Link to="/characters/new">Create a character to save spells</Link></Button>
                : <Button asChild className="w-full"><Link to="/account?next=/craft">Sign in to save to a character</Link></Button>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={async () => {
                  try { await navigator.clipboard.writeText(summary()); toast.success('Summary copied.'); } catch { toast.error('Could not copy - your browser blocked it.'); }
                }}><Copy />Copy summary</Button>
                {dmCampaigns.length > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setToCampaign(true)}><Flag />Save to campaign homebrew</Button>}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {toCampaign && (
        <SaveToCampaign title={title} onClose={() => setToCampaign(false)} entry={(school: string, hidden: boolean) => ({
          name: title, description: s.concept.trim() || summary(), school, classes: [ANY_CLASS],
          potency: s.potency, mana: r.mana.total, physicals: s.physicals, aspectuals: s.aspectuals, form: s.form,
          range: find(F.RANGE_COSTS, s.range), area: find(F.AREA_COSTS, s.area), duration: find(F.DURATION_COSTS, s.duration),
          damage: r.damageText, resolution: r.resolve,
          effect: [find(F.EFFECT_RANKS, s.effect), s.effectText.trim()].filter(Boolean).join(' - '),
          creator: user?.displayName, hidden,
        })} />
      )}
    </>
  );
}

function Step({ n, title, sub, children }: { n: number; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex flex-wrap items-center gap-2.5 text-xl font-bold">
        <span className="flex size-8 items-center justify-center rounded-full bg-header font-serif text-sm text-header-foreground">{n}</span>
        {title}{sub && <span className="font-sans text-sm font-normal text-muted-foreground">- {sub}</span>}
      </h3>
      {children}
    </section>
  );
}

function ChipGroup({ label, options, chosen, onToggle }: { label: string; options: string[]; chosen: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.length ? options.map((c) => (
          <button key={c} type="button" aria-pressed={chosen.includes(c)} onClick={() => onToggle(c)}
            className={cn('rounded-full border px-3 py-1 text-sm font-semibold transition-colors',
              chosen.includes(c) ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/30 bg-accent text-accent-foreground hover:border-primary')}>
            {c}
          </button>
        )) : <span className="text-sm text-muted-foreground">None known yet.</span>}
      </div>
    </div>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm"><Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} />{children}</label>;
}

function Breakdown({ title, rows, total, after }: { title: string; rows: [string, string][]; total?: [string, string]; after?: [string, string] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="m-0 list-none p-0 text-sm">
        {rows.map(([l, v]) => <li key={l} className="flex justify-between gap-3 border-b border-dotted py-1"><span>{l}</span><span className="tabular-nums">{v}</span></li>)}
        {total && <li className="mt-1 flex justify-between gap-3 border-t-2 border-primary/60 pt-1.5 font-bold"><span>{total[0]}</span><span className="tabular-nums">{total[1]}</span></li>}
        {after && <li className="flex justify-between gap-3 py-1"><span>{after[0]}</span><span className="tabular-nums">{after[1]}</span></li>}
      </ul>
    </div>
  );
}

/**
 * DM only: adds this spell to one of your campaigns' Compositry spell list.
 * It starts hidden from players, so you can reveal it when they discover it.
 */
function SaveToCampaign({ title, entry, onClose }: { title: string; entry: (school: string, hidden: boolean) => any; onClose: () => void }) {
  const { groups, homebrew } = useSession();
  const dm = groups.filter((g) => g.role === 'dm');
  const [groupId, setGroupId] = useState((dm.find((g) => g.id === homebrew) ?? dm[0]).id);
  const [school, setSchool] = useState<string>(SCHOOLS[0]);
  const [hidden, setHidden] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    try {
      await api('POST', '/catalog/compositry', entry(school, hidden), { group: groupId });
      invalidateLists();
      toast.success(`Saved to ${dm.find((g) => g.id === groupId)?.name}'s Compositry spells.`);
      onClose();
    } catch (err) { setError(errorMessage(err)); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Save to campaign homebrew</DialogTitle>
          <DialogDescription>Adds <b>{title}</b> to a campaign's Compositry spell list, where you can edit it later on the campaign's Spells tab.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Campaign" htmlFor="hb-campaign"><NativeSelect id="hb-campaign" value={groupId} onChange={(e) => setGroupId(e.target.value)}><Options options={dm.map((g) => ({ value: g.id, label: g.name }))} /></NativeSelect></Field>
          <Field label="School" htmlFor="hb-school"><NativeSelect id="hb-school" value={school} onChange={(e) => setSchool(e.target.value)}><Options options={SCHOOLS} /></NativeSelect></Field>
          <Check checked={hidden} onChange={setHidden}>Hidden from players until I publish it</Check>
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save to campaign</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
