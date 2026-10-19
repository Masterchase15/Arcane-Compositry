/**
 * pages/new-character.js - the short "New character" form (#/characters/new).
 * It collects the basics, lets rules/character.js fill in everything that can
 * be calculated, saves the sheet and opens it.
 */
import { api, state, useGroup, findGroup } from '../api.js';
import { requireUser } from '../nav.js';
import { esc, icon, optionTags, toast } from '../ui.js';
import { ABILITIES, CLASSES, findClass } from '../rules/constants.js';
import * as F from '../rules/formulas.js';
import { characterFromBasics, derive } from '../rules/character.js';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/**
 * A sensible way to place the standard array for a class: the best score goes
 * to the class's Invocation ability, then Constitution, then Dexterity, then
 * the rest in sheet order. Returns { str: 8, dex: 13, ... }.
 */
function suggestedScores(className) {
  const cls = findClass(className);
  const order = [...new Set([cls.invocation, 'con', 'dex', ...ABILITIES.map((a) => a.key)])];
  return Object.fromEntries(order.map((key, i) => [key, STANDARD_ARRAY[i]]));
}
const ALIGNMENTS = ['', 'Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];

export async function render(main, { query }) {
  if (!requireUser(main, 'create a character')) return;
  // #/characters/new?campaign=<id> makes it for that campaign, with its homebrew classes.
  const campaign = findGroup(query.get('campaign'));
  if (campaign) await useGroup(campaign.id);
  // Arriving from a class page (#/characters/new?class=Druid) pre-selects that class.
  const startClass = (findClass(query.get('class')) || findClass('Wizard') || CLASSES[0]).name;

  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">Step 1 of 1 - the rest happens on the sheet</p>
      <h1>New character</h1>
      <hr class="rule">
      <p class="lead">Fill in the basics and the sheet works out the rest. Not sure what to pick? Open the <a href="#/guide">character guide</a> in another tab.</p>
    </div>
    <form class="craft" novalidate>
      <div class="stack">
        <section class="panel"><header><h3>Who are they?</h3></header><div class="panel-body fields wide">
          ${state.groups.length ? `<div class="field span-all"><label for="campaign">Campaign</label>
            <select id="campaign">${optionTags([{ value: '', label: 'No campaign (add it to one later)' }, ...state.groups.map((g) => ({ value: g.id, label: g.name }))], campaign?.id || '')}</select>
            <span class="hint">In a campaign, its DM can see the sheet and its homebrew classes are offered below.</span></div>` : ''}
          <div class="field span-all"><label for="name">Character name <span aria-hidden="true">*</span></label><input id="name" name="name" required maxlength="80" autocomplete="off"><span class="error" id="err-name" hidden>Give your character a name.</span></div>
          <div class="field"><label for="className">Class <span aria-hidden="true">*</span></label><select id="className" name="className">${optionTags(CLASSES.map((c) => c.name), startClass)}</select><span class="hint" id="class-hint"></span><a class="small" href="#/classes">Compare the classes</a></div>
          <div class="field"><label for="level">Level</label><input id="level" name="level" type="number" inputmode="numeric" min="1" max="20" value="1"></div>
          <div class="field"><label for="species">Species</label><input id="species" name="species" placeholder="Elf, Dwarf, Human..." autocomplete="off"></div>
          <div class="field"><label for="background">Background</label><input id="background" name="background" placeholder="Sage, Soldier, Hermit..." autocomplete="off"></div>
          <div class="field"><label for="alignment">Alignment</label><select id="alignment" name="alignment">${optionTags(ALIGNMENTS.map((a) => ({ value: a, label: a || 'Decide later' })), '')}</select></div>
          <div class="field"><label for="player">Player name</label><input id="player" name="player" value="${esc(state.user.displayName)}" autocomplete="off"></div>
        </div></section>

        <section class="panel"><header><h3>Ability scores</h3></header><div class="panel-body stack">
          <p class="small muted">Type your scores, or use a button. The standard array (15, 14, 13, 12, 10, 8) starts in a sensible order for your class - move the numbers wherever you like, then add your background's bonuses (+2 and +1, or +1 to three).</p>
          <div class="row">
            <button type="button" class="btn sm" id="array">Fill standard array</button>
            <button type="button" class="btn sm" id="rollstats">${icon('dice')}Roll 4d6, drop lowest</button>
          </div>
          <div class="fields">
            ${ABILITIES.map((a) => `<div class="field"><label for="score-${a.key}">${a.name}</label>
              <input id="score-${a.key}" data-score="${a.key}" type="number" inputmode="numeric" min="1" max="30" value="${suggestedScores(startClass)[a.key]}">
              <span class="hint num" id="mod-${a.key}"></span></div>`).join('')}
          </div>
        </div></section>
      </div>

      <aside class="craft-out sticky">
        <header><h2>Starting numbers</h2><p>Worked out from the codex. You can change any of them on the sheet.</p></header>
        <div class="body">
          <div class="results" id="preview"></div>
          <button class="btn primary" type="submit">${icon('check')}Create character</button>
          <a class="btn ghost" href="#/characters">Cancel</a>
        </div>
      </aside>
    </form>`;

  const form = main.querySelector('form');
  const read = () => ({
    name: form.name.value.trim(),
    player: form.player.value.trim(),
    className: form.className.value,
    level: form.level.value,
    species: form.species.value.trim(),
    background: form.background.value.trim(),
    alignment: form.alignment.value,
    scores: Object.fromEntries(ABILITIES.map((a) => [a.key, form.querySelector(`[data-score=${a.key}]`).value])),
  });

  function preview() {
    const basics = read();
    const c = characterFromBasics(basics);
    const d = derive(c);
    const cls = findClass(basics.className);
    for (const a of ABILITIES) main.querySelector(`#mod-${a.key}`).textContent = `Modifier ${F.signed(d.mods[a.key])}${cls.saves.includes(a.key) ? ' · save proficiency' : ''}`;
    main.querySelector('#class-hint').textContent = `${cls.role} d${cls.hitDie} Hit Die. Invocation: ${cls.invocation.toUpperCase()}.`;
    const cell = (label, value, note = '') => `<div class="result"><span class="label">${label}</span><span class="big">${value}</span><span class="small">${note}</span></div>`;
    main.querySelector('#preview').innerHTML =
      cell('Hit Points', c.hp.max, c.hp.hitDice) +
      cell('Max Mana', d.manaMax, F.CASTER_TYPES[c.casterType].label) +
      cell('Proficiency', F.signed(d.profBonus)) +
      cell('Guard', d.guardMax, '2 + PB') +
      cell('Chain Length', d.chainLength) +
      cell('Arcane attack', F.signed(d.arcaneAttack), `Save DC ${d.saveDC}`);
  }

  const fillArray = () => {
    const scores = suggestedScores(form.className.value);
    for (const a of ABILITIES) form.querySelector(`[data-score=${a.key}]`).value = scores[a.key];
  };
  let scoresTouched = false; // once the player edits a score, changing class no longer rearranges them
  form.addEventListener('input', (e) => {
    if (e.target.dataset.score) scoresTouched = true;
    if (e.target === form.className && !scoresTouched) fillArray();
    preview();
  });
  main.querySelector('#array').addEventListener('click', () => { scoresTouched = false; fillArray(); preview(); });
  main.querySelector('#rollstats').addEventListener('click', () => {
    for (const a of ABILITIES) {
      const dice = F.roll(4, 6).dice.sort((x, y) => y - x).slice(0, 3);
      form.querySelector(`[data-score=${a.key}]`).value = dice.reduce((t, n) => t + n, 0);
    }
    scoresTouched = true;
    preview();
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const basics = read();
    const nameError = main.querySelector('#err-name');
    nameError.hidden = !!basics.name;
    form.name.setAttribute('aria-invalid', String(!basics.name));
    if (!basics.name) return form.name.focus();
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      const { id } = await api('POST', '/characters', { data: characterFromBasics(basics), groupId: campaign?.id || null });
      toast(`${basics.name} created.`);
      location.hash = `#/characters/${id}`;
    } catch (err) {
      toast(err.message, 'error');
      button.disabled = false;
    }
  });
  // Changing the campaign redraws the form with that campaign's classes.
  main.querySelector('#campaign')?.addEventListener('change', (e) => {
    location.hash = `#/characters/new${e.target.value ? `?campaign=${e.target.value}` : ''}`;
  });
  preview();
}
