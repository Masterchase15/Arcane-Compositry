/**
 * pages/guide.js - "How to make a character" (#/guide).
 *
 * Plain step-by-step directions. Each step is one entry in STEPS - edit the
 * text freely, or add a step by copying one.
 */
import { CLASSES } from '../rules/constants.js';
import * as F from '../rules/formulas.js';
import { esc, icon } from '../ui.js';

const STEPS = [
  {
    title: 'Imagine the character',
    html: `<p>Before any numbers: who are they? A river-warden who shapes Water and Ice? A soldier whose sword draw completes an Iron + Lightning circuit? Decide two things:</p>
      <ul><li><b>What do they do in a fight?</b> Project magic outward (a Compositor), or route it through body and gear (an Applied Thaumaturge)?</li>
      <li><b>What is their magic made of?</b> Pick one or two Components that feel like them. See <a href="#/codex/spell-grammar">Spell Grammar</a>.</li></ul>`,
  },
  {
    title: 'Choose a class',
    html: `<p>Your class sets your Hit Die, saving throws, how much Mana you have, and which ability controls your magic (your <b>Invocation Modifier</b>).</p>
      <div class="table-wrap"><table><thead><tr><th>Class</th><th class="c">Hit Die</th><th>Saves</th><th>Invocation</th><th>Mana pool</th><th>In Arcane Compositry</th></tr></thead><tbody>
      ${CLASSES.map((c) => `<tr><td><a href="#/classes/${esc(c.id)}"><b>${esc(c.name)}</b></a></td><td class="c">d${c.hitDie}</td><td>${c.saves.map((s) => s.toUpperCase()).join(', ')}</td><td>${c.invocation.toUpperCase()}</td><td>${{ full: 'Full', partial: '65%', martial: '40%' }[c.caster]}</td><td>${esc(c.role)}</td></tr>`).join('')}
      </tbody></table></div>
      <p>Open the <a href="#/classes">Classes page</a> to read each class's features and subclasses.</p>
      <p class="small muted">Applied Thaumaturges may use STR (force), DEX (precision) or CON (body and armor) as their Invocation ability - change it on the sheet's Arcane tab.</p>`,
  },
  {
    title: 'Choose your origin: species and background',
    html: `<p><b>Species</b> (Elf, Dwarf, Human, and so on) gives traits such as speed, size and special senses. Write them in <i>Species Traits</i> on the Features tab.</p>
      <p><b>Background</b> (Sage, Soldier, Hermit...) gives two skill proficiencies, a tool proficiency, a feat, and your ability score bonuses: <b>+2 to one score and +1 to another</b>, or <b>+1 to three</b>.</p>
      <p>You also know Common plus two other languages.</p>`,
  },
  {
    title: 'Set your ability scores',
    html: `<p>Six scores describe your character: Strength, Dexterity, Constitution, Intelligence, Wisdom and Charisma. Pick one method:</p>
      <ul><li><b>Standard array:</b> assign 15, 14, 13, 12, 10 and 8 as you like.</li>
      <li><b>Roll:</b> roll 4d6 and drop the lowest die, six times.</li>
      <li><b>Point buy:</b> spend 27 points (8 costs 0, 9 = 1, 10 = 2, 11 = 3, 12 = 4, 13 = 5, 14 = 7, 15 = 9).</li></ul>
      <p>Then add your background bonuses. Put your best score in your <b>Invocation ability</b>, and give Constitution some love - it is your Hit Points.</p>
      <div class="formula">Ability modifier = (score - 10) / 2, rounded down</div>
      <p class="small muted">The sheet shows each modifier automatically as soon as you type a score.</p>`,
  },
  {
    title: 'Fill in the core numbers',
    html: `<p>The sheet calculates these for you (shown in green as "auto"). Type over any of them if your DM rules differently; clear the box to go back to automatic.</p>
      <ul><li><b>Proficiency Bonus:</b> +2 at levels 1-4, +3 at 5-8, +4 at 9-12, +5 at 13-16, +6 at 17-20.</li>
      <li><b>Saving throws:</b> tick the two your class is proficient in.</li>
      <li><b>Skills:</b> tap the button beside a skill once for Proficient (P), twice for Expertise (E). Take two from your background plus your class picks.</li>
      <li><b>Hit Points:</b> at level 1, your full Hit Die + CON modifier. Each level after: half the die + 1, + CON modifier.</li>
      <li><b>Armor Class:</b> 10 + DEX modifier with no armor; otherwise from your armor.</li>
      <li><b>Initiative:</b> your DEX modifier. <b>Passive Perception:</b> 10 + Perception.</li></ul>`,
  },
  {
    title: 'Set up your Arcane Core',
    html: `<p>This replaces spell slots. On the sheet's <b>Arcane</b> tab:</p>
      <ul><li><b>Mana:</b> worked out from your level and class.</li></ul>
      <div class="formula">Max Mana = floor(5L + L^2 / 12 - 1) &nbsp;·&nbsp; partial casters about 65%, martials about 40%</div>
      <ul><li><b>Invocation Modifier (IM):</b> the modifier of your Invocation ability.</li>
      <li><b>Arcane attack:</b> d20 + PB + IM. <b>Save DC:</b> 8 + PB + IM.</li>
      <li><b>Max Potency:</b> the highest Potency (I-IX) you can safely invoke. Ask your DM; the site suggests half your level, rounded up.</li></ul>
      <p>See <a href="#/codex/potency-mana">Potency &amp; the Mana Formula</a> and <a href="#/codex/spell-mana-pools">Maximum Mana</a>.</p>`,
  },
  {
    title: 'Bond a Catalyst and describe your Tendril',
    html: `<p>Your <b>Catalyst</b> is the magic-bearing metal, gem or crystal that powers you. Your DM tells you its numbers:</p>
      <ul><li><b>Capacity:</b> how much Mana it can store.</li><li><b>Throughput:</b> how much Mana it can safely discharge in one invocation. The Spellcrafter warns you when a spell costs more than this.</li></ul>
      <p>Your <b>Tendril</b> is the vine-like scripture on your body. Note where its Root Node sits, what color it glows, where its Terminals are, and the gesture that closes the circuit (your Bridge). This is flavor that other characters can <i>read</i>.</p>
      <p>See <a href="#/codex/tendril-catalysts">Tendril &amp; Catalysts</a> and <a href="#/codex/invocation">Prime, Route, Bridge, Release</a>.</p>`,
  },
  {
    title: 'Record your known Arcane language',
    html: `<p>With your DM, choose which <b>Physical Components</b>, <b>Aspectual Components</b> and <b>Forms</b> your character knows. These are the building blocks you can combine on the fly.</p>
      <p>Then add your first spells:</p>
      <ul><li>Build one in the <a href="#/craft">Spellcrafter</a> and press <b>Save to character</b> (an <i>Improvised</i> Composition).</li>
      <li>Browse the <a href="#/spells/codified">Codified</a> and <a href="#/spells/compositry">Compositry</a> indexes and press <b>Add to character</b>. The site checks the spell against your class.</li></ul>`,
  },
  {
    title: 'Set up Attack Chains, Guard and Momentum',
    html: `<p>On the <b>Core &amp; Combat</b> tab, these are worked out for you:</p>
      <ul><li><b>Chain Length:</b> ${F.CHAIN_TIERS.map((t) => `${t.max} at levels ${t.from}${t.to === 20 ? '+' : `-${t.to}`}`).join(', ')}.</li>
      <li><b>Guard:</b> 2 + Proficiency Bonus. It refreshes at the start of your turn.</li>
      <li><b>Dodge</b> (DEX, + PB if proficient in DEX saves), <b>Parry</b> (STR or DEX + PB) and <b>Block</b> (PB + STR with a weapon).</li>
      <li><b>Momentum Die:</b> everyone starts at d4. Choose your Momentum Ability (STR, DEX or your Invocation ability) for your Stasis Save DC.</li></ul>
      <p>Add your weapons, with any Chain trait your DM gives them. See <a href="#/codex/attack-chains">Attack Chains</a> and <a href="#/codex/momentum-dice">Momentum Dice</a>.</p>`,
  },
  {
    title: 'Finish the story',
    html: `<p>On the <b>Features &amp; Gear</b> tab, write down class features and feats, equipment, coins, languages, and your backstory, appearance and goals. A sentence or two is plenty - you can add more as the campaign unfolds.</p>
      <p>Everything saves automatically as you type, and your sheet opens the same on your phone and your desktop.</p>`,
  },
];

export function render(main) {
  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">Directions</p>
      <h1>How to make a character</h1>
      <hr class="rule">
      <p class="lead">Ten steps from a blank page to a Compositor ready for the table. It follows standard D&amp;D character creation, then adds the Arcane Compositry pieces.</p>
      <a class="btn primary" href="#/characters/new">${icon('plus')}Start a character</a>
    </div>
    <div class="sidebar-layout">
      <nav class="toc card sticky only-desktop" aria-label="Guide steps">
        ${STEPS.map((s, i) => `<a href="#/guide" data-step="${i}"><span>${i + 1}. ${esc(s.title)}</span></a>`).join('')}
      </nav>
      <div class="stack prose">
        ${STEPS.map((s, i) => `
          <section class="craft-section" id="step-${i}">
            <h2 class="row"><span class="n steps-n">${i + 1}</span>${esc(s.title)}</h2>
            ${s.html}
          </section>`).join('')}
        <div class="dark-box"><h3>Ready?</h3><p>The New character form asks for the basics and fills in every number it can.</p>
          <a class="btn primary" href="#/characters/new">${icon('plus')}Start a character</a></div>
      </div>
    </div>`;
  main.addEventListener('click', (e) => {
    const link = e.target.closest('[data-step]');
    if (!link) return;
    e.preventDefault();
    document.getElementById(`step-${link.dataset.step}`).scrollIntoView({ behavior: 'smooth' });
  });
}
