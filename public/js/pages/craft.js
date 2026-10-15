/**
 * pages/craft.js - the Spellcrafter (#/craft).
 *
 * The player picks Components, a Form, a Potency and modifiers; the panel on
 * the right shows Mana, damage, attack / Save DC and warnings, live.
 * All maths comes from rules/formulas.js.
 */
import { api, state } from '../api.js';
import { esc, icon, optionTags, toast } from '../ui.js';
import { PHYSICALS, ASPECTUALS, FORMS, ROMAN } from '../rules/constants.js';
import * as F from '../rules/formulas.js';
import { derive, upgrade } from '../rules/character.js';
import { appendComposition } from '../spellbook.js';

const SAVES = ['DEX', 'STR', 'CON', 'WIS', 'INT', 'CHA'];

export async function render(main) {
  const characters = state.user ? (await api('GET', '/characters').catch(() => ({ characters: [] }))).characters : [];

  // Everything the player has chosen. The result panel is redrawn from this.
  const s = {
    name: '', concept: '', physicals: ['Geo'], aspectuals: ['Fire'], custom: [],
    form: 'Projectile', delivery: 'single', potency: 3,
    range: 'close', area: 'single', duration: 'instant', removeConcentration: false,
    effect: 'cosmetic', effectText: '', environmental: false, adjustment: 0,
    resolution: 'attack', save: 'DEX', hits: 1, pb: 2, im: 3,
    charId: '', character: null, // the chosen character's sheet + derived numbers
  };

  const costOpts = (table) => table.map((r) => ({ value: r.id, label: `${r.label}  (+${r.cost})` }));
  const chipGroup = (key, list) =>
    list.map((c) => `<button type="button" class="chip" data-toggle="${key}" data-value="${esc(c)}" aria-pressed="${s[key].includes(c)}">${esc(c)}</button>`).join('');

  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">Component(s) + Form + Potency + Modifiers = Composition</p>
      <h1>Spellcrafter</h1>
      <hr class="rule">
      <p class="lead">Describe the magic; the numbers appear on the right. Nothing is forbidden - reality just charges more Mana.</p>
    </div>
    <div class="craft">
      <form id="craft-form" novalidate>
        ${characters.length ? `
        <section class="craft-section card">
          <div class="field"><label for="charId">Crafting as</label>
            <select id="charId" data-key="charId"><option value="">No character - I'll type my own bonuses</option>
              ${optionTags(characters.map((c) => ({ value: c.id, label: `${c.name} - ${c.className || 'no class'} ${c.level}` })), '')}</select>
            <span class="hint">Uses that character's Proficiency Bonus, Invocation Modifier, Mana and Catalyst Throughput.</span></div>
        </section>` : ''}

        <section class="craft-section">
          <h3><span class="n">1</span>Components <span class="muted small">- what is the magic made of?</span></h3>
          <p class="hint" id="known-hint"></p>
          <p class="label">Physical - what exists?</p>
          <div class="chips" id="physicals"></div>
          <p class="label">Aspectual - what property is applied?</p>
          <div class="chips" id="aspectuals"></div>
          <p class="label">Other Components your DM has approved</p>
          <div class="chips" id="custom"></div>
          <div class="stepper"><input id="custom-input" aria-label="Name of another Component" placeholder="e.g. Wind" maxlength="30"><button type="button" class="btn" id="custom-add">${icon('plus')}Add</button></div>
        </section>

        <section class="craft-section">
          <h3><span class="n">2</span>Form <span class="muted small">- how does it manifest?</span></h3>
          <div class="fields wide">
            <div class="field"><label for="form">Form</label><select id="form" data-key="form">${optionTags(FORMS.map((f) => f.name), s.form)}</select></div>
            <div class="field"><label for="delivery">Damage die</label><select id="delivery" data-key="delivery">${optionTags(F.DELIVERIES.map((d) => ({ value: d.id, label: d.die ? `${d.label} (d${d.die})` : d.label })), s.delivery)}</select>
              <span class="hint">Set from the Form. Change it if the spell is riskier or lingers.</span></div>
          </div>
        </section>

        <section class="craft-section">
          <h3><span class="n">3</span>Potency <span class="muted small">- how hard do you push?</span></h3>
          <div class="seg" role="group" aria-label="Potency" id="potency">
            ${ROMAN.slice(1).map((r, i) => `<button type="button" data-potency="${i + 1}" aria-pressed="${i + 1 === s.potency}">${r}</button>`).join('')}
          </div>
          <p class="hint" id="potency-hint"></p>
        </section>

        <section class="craft-section">
          <h3><span class="n">4</span>Modifiers <span class="muted small">- what makes it expensive?</span></h3>
          <div class="fields wide">
            <div class="field"><label for="range">Maximum range</label><select id="range" data-key="range">${optionTags(costOpts(F.RANGE_COSTS), s.range)}</select></div>
            <div class="field"><label for="area">Approx. area</label><select id="area" data-key="area">${optionTags(costOpts(F.AREA_COSTS), s.area)}</select></div>
            <div class="field"><label for="duration">Duration</label><select id="duration" data-key="duration">${optionTags(costOpts(F.DURATION_COSTS), s.duration)}</select></div>
            <div class="field"><label for="effect">Extra effect</label><select id="effect" data-key="effect">${optionTags(F.EFFECT_RANKS.map((e) => ({ value: e.id, label: `${e.label}: ${e.examples}  (+${e.cost})` })), s.effect)}</select>
              <span class="hint">Each rank also trades away one damage die.</span></div>
            <div class="field"><label for="effectText">Describe the effect</label><input id="effectText" data-key="effectText" placeholder="e.g. knocks the target prone" maxlength="120"></div>
            <div class="field"><label for="adjustment">DM adjustment (Mana)</label><input id="adjustment" data-key="adjustment" type="number" inputmode="numeric" value="0" min="-10" max="20">
              <span class="hint">For "+5 or more" Composites and table rulings.</span></div>
          </div>
          <div class="row">
            <label class="check" for="removeConcentration"><input type="checkbox" id="removeConcentration" data-key="removeConcentration">Remove Concentration (+${F.REMOVE_CONCENTRATION_COST})</label>
            <label class="check" for="environmental"><input type="checkbox" id="environmental" data-key="environmental">Abundant Physical Component nearby (-1)</label>
          </div>
          <p class="hint" id="conc-hint" role="status"></p>
        </section>

        <section class="craft-section">
          <h3><span class="n">5</span>Resolve it</h3>
          <div class="fields wide">
            <div class="field"><label for="resolution">How is it resolved?</label><select id="resolution" data-key="resolution">
              ${optionTags([{ value: 'attack', label: 'Arcane attack roll' }, { value: 'save', label: 'Target makes a saving throw' }, { value: 'none', label: 'No roll (utility, self, infusion)' }], s.resolution)}</select></div>
            <div class="field" id="save-field"><label for="save">Which save?</label><select id="save" data-key="save">${optionTags(SAVES, s.save)}</select>
              <span class="hint">The danger chooses the save, not the element.</span></div>
            <div class="field"><label for="hits">Attacks in the Chain</label><input id="hits" data-key="hits" type="number" inputmode="numeric" min="1" max="5" value="1">
              <span class="hint">Split the damage pool across linked attacks.</span></div>
            <div class="field"><label for="pb">Proficiency Bonus</label><input id="pb" data-key="pb" type="number" inputmode="numeric" min="2" max="6" value="${s.pb}"></div>
            <div class="field"><label for="im">Invocation Modifier</label><input id="im" data-key="im" type="number" inputmode="numeric" min="-5" max="10" value="${s.im}"></div>
          </div>
        </section>

        <section class="craft-section">
          <h3><span class="n">6</span>Describe it</h3>
          <div class="fields wide">
            <div class="field"><label for="name">Name</label><input id="name" data-key="name" placeholder="Leave blank for an automatic name" maxlength="80" autocomplete="off"></div>
            <div class="field span-all"><label for="concept">How does it look, move and sound?</label><textarea id="concept" data-key="concept" placeholder="&quot;I condense a fist-sized chunk of molten stone and fire it at the enemy.&quot;" maxlength="600"></textarea></div>
          </div>
        </section>
      </form>

      <aside class="craft-out sticky" id="out" aria-label="Spell results"></aside>
    </div>`;

  const $ = (sel) => main.querySelector(sel);
  const components = () => [...s.physicals, ...s.aspectuals, ...s.custom];
  const autoName = () => `${components().join(' + ') || 'Raw Mana'} ${s.form}`;

  /** Works out every number for the current choices. */
  function compute() {
    const count = Math.max(1, components().length);
    const mana = F.finalMana({ potency: s.potency, componentCount: count, range: s.range, area: s.area, duration: s.duration, removeConcentration: s.removeConcentration, effect: s.effect, environmental: s.environmental, adjustment: s.adjustment });
    const dmg = F.compositionDamage({ potency: s.potency, delivery: s.delivery, effect: s.effect });
    const dc = F.arcaneSaveDC(s.pb, s.im);
    const atk = F.arcaneAttackBonus(s.pb, s.im);
    const resolve = s.resolution === 'attack' ? `d20 ${F.signed(atk)}` : s.resolution === 'save' ? `${s.save} save DC ${dc}` : 'No roll';
    const damageText = s.delivery === 'armor' ? `+${dmg.count} Reinforcement` : s.delivery === 'infusion' ? `${dmg.text} Charge Pool` : dmg.text;
    return { count, mana, dmg, dc, atk, resolve, damageText, stability: F.stabilityDC({ potency: s.potency, componentCount: count }).total, split: F.splitChain(dmg.count, s.hits) };
  }

  function warnings(r) {
    const w = [];
    const ch = s.character;
    if (!components().length) w.push('No Components chosen yet - pick at least one Physical or Aspectual.');
    if (components().length >= 4) w.push('4 Components costs "+5 or more". Ask your DM and use the DM adjustment box for the extra.');
    if (s.effect === 'extreme' && s.potency < 5) w.push('Extreme effects (stun, paralysis) usually need Potency V or higher.');
    if (r.dmg.count === 0 && r.dmg.die) w.push('The effect has traded away all of the damage dice.');
    if (ch) {
      const throughput = F.num(ch.sheet.catalyst.throughput, 0);
      if (throughput && r.mana.total > throughput) w.push(`Costs ${r.mana.total} Mana, but ${ch.name}'s Catalyst can only route ${throughput} at once (Throughput).`);
      if (r.mana.total > F.num(ch.sheet.arcane.manaCurrent)) w.push(`${ch.name} has ${F.num(ch.sheet.arcane.manaCurrent)} Mana left - not enough for this.`);
      if (s.potency > F.num(ch.sheet.arcane.maxPotency, 9)) w.push(`Potency ${ROMAN[s.potency]} is above ${ch.name}'s Max Potency (${ROMAN[F.num(ch.sheet.arcane.maxPotency, 1)]}).`);
    }
    return w;
  }

  function drawOut(rollMessage = '') {
    const r = compute();
    const title = s.name.trim() || autoName();
    const cell = (label, value, note = '') => `<div class="result"><span class="label">${label}</span><span class="big">${esc(value)}</span>${note ? `<span class="small">${esc(note)}</span>` : ''}</div>`;
    const dmgNote = s.delivery === 'infusion' ? '1d6 per hit, 2d6 on a Finisher' : s.delivery === 'armor' ? 'added to a legal Block' : `average ${r.dmg.average}`;
    $('#out').innerHTML = `
      <header><h2>${esc(title)}</h2><p>Potency ${ROMAN[s.potency]} · ${esc(F.POTENCY[s.potency].meaning)}</p></header>
      <div class="body">
        <div class="results">
          ${cell('Final Mana', r.mana.total)}
          ${cell(s.delivery === 'armor' ? 'Reinforcement' : s.delivery === 'infusion' ? 'Charge Pool' : 'Damage', s.delivery === 'armor' ? `+${r.dmg.count}` : r.dmg.text, dmgNote)}
          ${cell(s.resolution === 'save' ? 'Saving throw' : 'Arcane attack', s.resolution === 'attack' ? `d20 ${F.signed(r.atk)}` : s.resolution === 'save' ? `DC ${r.dc}` : '-', s.resolution === 'save' ? `${s.save} save` : s.resolution === 'none' ? 'No roll needed' : 'vs. AC')}
        </div>
        ${warnings(r).map((w) => `<div class="callout warn">${icon('alert')}<span>${esc(w)}</span></div>`).join('')}
        <div><p class="label">Mana breakdown</p>
          <ul class="breakdown">${r.mana.parts.map((p, i) => `<li><span>${esc(p.label)}</span><span class="num">${i && p.value >= 0 ? '+' : ''}${p.value}</span></li>`).join('')}
          <li class="total"><span>Final Mana</span><span class="num">${r.mana.total}</span></li></ul></div>
        <div><p class="label">Damage dice</p>
          <ul class="breakdown">
            <li><span>Potency ${ROMAN[s.potency]}: ${s.potency} + 2 + floor(${s.potency}/3)</span><span class="num">${r.dmg.base}</span></li>
            ${r.dmg.base !== r.dmg.count ? `<li><span>Effect rank traded away</span><span class="num">-${r.dmg.base - r.dmg.count}</span></li>` : ''}
            <li class="total"><span>${esc(F.DELIVERIES.find((d) => d.id === s.delivery).label)}</span><span class="num">${esc(r.damageText)}</span></li>
            ${s.hits > 1 && r.dmg.die ? `<li><span>Split over ${s.hits} attacks</span><span class="num">${r.split.map((n) => `${n}d${r.dmg.die}`).join(' / ')}</span></li>` : ''}
          </ul></div>
        <div><p class="label">If someone interferes</p>
          <ul class="breakdown">
            <li><span>Circuit Stability DC (before damage)</span><span class="num">${r.stability}</span></li>
            <li><span>DC to Read the Circuit</span><span class="num">${F.readCircuitDC(s.potency)}</span></li>
          </ul><p class="small muted">Stability DC rises by 1 for every 10 damage you take mid-invocation.</p></div>
        <div class="row">
          ${s.resolution === 'attack' ? `<button type="button" class="btn" data-roll="attack">${icon('dice')}Roll attack</button>` : ''}
          ${r.dmg.die && r.dmg.count ? `<button type="button" class="btn" data-roll="damage">${icon('dice')}Roll ${s.delivery === 'infusion' ? 'full pool' : 'damage'}</button>` : ''}
        </div>
        <p class="roll-out" role="status">${rollMessage}</p>
        ${state.user
          ? characters.length
            ? `<div class="field"><label for="save-to">Save to character</label><select id="save-to">${optionTags(characters.map((c) => ({ value: c.id, label: c.name })), s.charId || characters[0].id)}</select></div>
               <button type="button" class="btn primary" id="save-btn">${icon('plus')}Save as Improvised Composition</button>`
            : `<a class="btn primary" href="#/characters/new">Create a character to save spells</a>`
          : `<a class="btn primary" href="#/account?next=/craft">Sign in to save to a character</a>`}
        <button type="button" class="btn" id="copy-btn">${icon('copy')}Copy summary</button>
      </div>`;
    $('#potency-hint').textContent = `Potency ${ROMAN[s.potency]}: ${F.coreMana(s.potency)} Core Mana, ${F.damageDice(s.potency)} damage dice - ${F.POTENCY[s.potency].meaning.toLowerCase()}.`;
    $('#save-field').hidden = s.resolution !== 'save';
    // The box is always clickable. It only costs Mana when the chosen duration needs Concentration,
    // so say so when it is ticked but has nothing to remove.
    const needsConcentration = F.DURATION_COSTS.find((d) => d.id === s.duration).concentration;
    $('#conc-hint').textContent = !s.removeConcentration ? ''
      : needsConcentration ? `Concentration removed: +${F.REMOVE_CONCENTRATION_COST} Mana added.`
      : 'This duration does not use Concentration, so there is nothing to remove (+0). Choose "Up to 1 minute" or "Up to 10 minutes" for this to apply.';
  }

  /** With a character chosen, only the Components that character has learned are offered. */
  function drawChips() {
    const known = s.character ? s.character.sheet.language : null;
    const lists = { physicals: known ? known.physicals : PHYSICALS, aspectuals: known ? known.aspectuals : ASPECTUALS };
    for (const key of ['physicals', 'aspectuals']) {
      s[key] = s[key].filter((name) => lists[key].includes(name));
      $(`#${key}`).innerHTML = chipGroup(key, lists[key]) || '<span class="muted small">None known yet.</span>';
    }
    $('#known-hint').textContent = known
      ? `Showing only the Components ${s.character.name} has learned. Learn more on the character sheet's Arcane tab.`
      : '';
  }

  function drawCustom() {
    $('#custom').innerHTML = s.custom.map((c) => `<button type="button" class="chip" data-remove="${esc(c)}" aria-pressed="true" aria-label="Remove ${esc(c)}">${esc(c)} ${icon('x')}</button>`).join('');
  }

  const summary = () => {
    const r = compute();
    const find = (t, id) => t.find((x) => x.id === id).label;
    return [
      `${s.name.trim() || autoName()} - Potency ${ROMAN[s.potency]}`,
      `Components: ${components().join(' + ') || 'none'} | Form: ${s.form}`,
      `Mana: ${r.mana.total} | ${s.delivery === 'armor' ? 'Reinforcement' : 'Damage'}: ${r.damageText} | ${r.resolve}`,
      `Range: ${find(F.RANGE_COSTS, s.range)} | Area: ${find(F.AREA_COSTS, s.area)} | Duration: ${find(F.DURATION_COSTS, s.duration)}`,
      s.effect !== 'cosmetic' || s.effectText ? `Effect: ${find(F.EFFECT_RANKS, s.effect)}${s.effectText ? ` - ${s.effectText}` : ''}` : '',
      s.concept.trim(),
    ].filter(Boolean).join('\n');
  };

  // ── Events ──
  const form = $('#craft-form');
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', async (e) => {
    const key = e.target.dataset.key;
    if (!key) return;
    const el = e.target;
    s[key] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? F.num(el.value) : el.value;
    if (key === 'hits') s.hits = Math.min(5, Math.max(1, s.hits || 1));
    if (key === 'form') {
      // Each Form suggests a damage die; the player can still override it.
      s.delivery = FORMS.find((f) => f.name === s.form).delivery;
      $('#delivery').value = s.delivery;
      if (['infusion', 'armor'].includes(s.delivery)) { s.resolution = 'none'; $('#resolution').value = 'none'; }
    }
    if (key === 'charId') { await pickCharacter(); drawChips(); }
    drawOut();
  });

  async function pickCharacter() {
    s.character = null;
    if (!s.charId) return;
    try {
      const sheet = upgrade((await api('GET', `/characters/${s.charId}`)).data);
      const d = derive(sheet);
      s.character = { name: sheet.identity.name || 'This character', sheet };
      s.pb = d.profBonus; s.im = d.invocationMod;
      $('#pb').value = s.pb; $('#im').value = s.im;
    } catch (err) { toast(err.message, 'error'); }
  }

  form.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle]');
    const potency = e.target.closest('[data-potency]');
    const remove = e.target.closest('[data-remove]');
    if (toggle) {
      const listKey = toggle.dataset.toggle;
      const value = toggle.dataset.value;
      s[listKey] = s[listKey].includes(value) ? s[listKey].filter((v) => v !== value) : [...s[listKey], value];
      toggle.setAttribute('aria-pressed', String(s[listKey].includes(value)));
    } else if (potency) {
      s.potency = Number(potency.dataset.potency);
      form.querySelectorAll('[data-potency]').forEach((b) => b.setAttribute('aria-pressed', String(b === potency)));
    } else if (remove) {
      s.custom = s.custom.filter((c) => c !== remove.dataset.remove);
      drawCustom();
    } else if (e.target.closest('#custom-add')) {
      addCustom();
    } else return;
    drawOut();
  });
  $('#custom-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); drawOut(); } });
  function addCustom() {
    const input = $('#custom-input');
    const value = input.value.trim();
    if (value && !components().some((c) => c.toLowerCase() === value.toLowerCase())) s.custom.push(value);
    input.value = '';
    drawCustom();
  }

  $('#out').addEventListener('click', async (e) => {
    const rollBtn = e.target.closest('[data-roll]');
    if (rollBtn) {
      const r = compute();
      if (rollBtn.dataset.roll === 'attack') {
        const die = F.roll(1, 20).total;
        return drawOut(`Attack: d20 (<b>${die}</b>) ${F.signed(r.atk)} = <b>${die + r.atk}</b>${die === 20 ? ' - natural 20!' : die === 1 ? ' - natural 1' : ''}`);
      }
      const dmg = F.roll(r.dmg.count, r.dmg.die);
      return drawOut(`Damage: ${dmg.dice.join(' + ')} = <b>${dmg.total}</b>`);
    }
    if (e.target.closest('#copy-btn')) {
      try { await navigator.clipboard.writeText(summary()); toast('Summary copied.'); }
      catch { toast('Could not copy - your browser blocked it.', 'error'); }
    }
    if (e.target.closest('#save-btn')) {
      const btn = e.target.closest('#save-btn');
      const r = compute();
      btn.disabled = true;
      try {
        const saved = await appendComposition($('#save-to').value, {
          level: ROMAN[s.potency], name: s.name.trim() || autoName(), components: components().join(' + '), form: s.form, mana: r.mana.total,
          range: F.RANGE_COSTS.find((x) => x.id === s.range).label, atkdc: r.resolve,
          damage: [r.damageText, s.effectText.trim()].filter(Boolean).join('; '), status: 'Improvised',
        });
        toast(`Saved to ${saved.identity.name || 'character'}.`);
      } catch (err) { toast(err.message, 'error'); }
      btn.disabled = false;
    }
  });

  drawChips();
  drawCustom();
  drawOut();
}
