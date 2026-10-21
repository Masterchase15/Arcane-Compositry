/**
 * rules/codex-content.js - the full text of the Player's Field Codex.
 *
 * One entry per codex page, in reading order. The Codex page of the site
 * shows these; the character sheet's Reference tab reuses the two cheat sheets.
 *
 * ─── TO EDIT THE RULES TEXT ────────────────────────────────────────────────
 *  Find the chapter and edit the HTML in its `html`. Handy building blocks:
 *     <div class="formula">...</div>            green formula bar
 *     <div class="formula gold">...</div>       gold formula bar
 *     <div class="callout"><b>Label:</b> ...</div>   gold "rule of thumb" note
 *     <div class="dark-box">...</div>           dark green example box
 *     <div class="note-box">...</div>           cream example box
 *     <p class="pull">...</p>                   large pull quote
 *     ${table([...headers], [[...row], ...])}   a table
 *     <div data-calc="mana"></div>              a live calculator (ids are in calculators.js)
 *
 *  Tables of NUMBERS (Core Mana, damage dice, costs...) are generated from
 *  rules/formulas.js, so changing a number there updates the text here too.
 *
 * ─── TO ADD A CHAPTER ──────────────────────────────────────────────────────
 *  Add an object to CHAPTERS: { id, section, kicker, title, num?, page?, html }.
 */
import * as F from './formulas.js';
import { ROMAN } from './constants.js';

/** Builds a table. Cells may contain HTML. A header starting with "^" is centred. */
function table(headers, rows) {
  const centred = headers.map((h) => h.startsWith('^'));
  return `<div class="table-wrap"><table><thead><tr>${headers
    .map((h, i) => `<th${centred[i] ? ' class="c"' : ''}>${h.replace(/^\^/, '')}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td${centred[i] ? ' class="c"' : ''}>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}
const chips = (list, cls = '') => `<div class="chips">${list.map((c) => `<span class="chip static ${cls}">${c}</span>`).join('')}</div>`;
const costRows = (tbl) => tbl.map((r) => [r.label, `+${r.cost}`]);
const potencies = [1, 2, 3, 4, 5, 6, 7, 8, 9];
/** "+1 / +2 / +3" for a cost table, skipping its free first row. */
const costs = (tbl) => tbl.slice(1).map((r) => `+${r.cost}`).join(' / ');

export const SECTIONS = [
  { id: 'how', title: 'Section I - How It Works' },
  { id: 'lore', title: 'Section II - Lore & Combat' },
  { id: 'ref', title: 'Table Reference' },
];

export const CHAPTERS = [
  // ══════════════════════ SECTION I - HOW IT WORKS ══════════════════════════
  {
    id: 'quick-start', section: 'how', kicker: 'Section I - How It Works', title: 'Quick Start: Build a Spell in 6 Steps', page: 3,
    html: `
      <p class="pull">Component(s) + Form + Potency + Modifiers = Composition</p>
      <ol class="steps">
        <li><span class="n">1</span><div><h4>Choose Components</h4><p>What is the magic made of? A spell may use a <b>Physical</b>, an <b>Aspectual</b>, or both.</p></div></li>
        <li><span class="n">2</span><div><h4>Choose Form</h4><p>How does it appear? Projectile, burst, wall, field, infusion, armor, bind, beam, and so on.</p></div></li>
        <li><span class="n">3</span><div><h4>Choose Potency</h4><p>Potency I-IX sets the spell's base Mana and damage scale.</p></div></li>
        <li><span class="n">4</span><div><h4>Add Modifiers</h4><p>Extra Components, range, area, duration, and conditions raise Mana cost.</p></div></li>
        <li><span class="n">5</span><div><h4>Resolve It</h4><p>Direct attacks roll d20 + PB + Invocation Modifier. Saving throws use DC 8 + PB + Invocation Modifier.</p></div></li>
        <li><span class="n">6</span><div><h4>Describe It</h4><p>The rules decide power. The player decides how the Composition looks, moves, sounds, and interacts with the scene.</p></div></li>
      </ol>
      <div class="dark-box"><h3>Two-Minute Explanation for New Players</h3>
        <p>"Tell me what material or magical property you want, what shape the spell takes, and how much power you want to put into it. We use Potency to get the base numbers, then add Mana for anything extra. If it attacks, roll your normal Arcane attack. If it forces a save, I tell the target what save makes sense."</p></div>
      <h3>Fast Example</h3>
      <div class="note-box">
        <div class="chips"><span class="chip static">Geo</span><span class="chip static">Fire</span><span class="chip static gold">Projectile</span><span class="chip static gold">Potency III</span></div>
        <p><b>Concept:</b> "I condense a fist-sized chunk of molten stone and fire it at the enemy."</p>
        <p><b>Result:</b> Potency III gives the starting Mana and damage pool. Geo + Fire adds a Composite cost. The projectile is single-target, so it normally uses d8 damage dice.</p>
      </div>
      <p><a class="btn primary" href="#/craft">Open the Spellcrafter</a></p>`,
  },
  {
    id: 'spell-grammar', section: 'how', kicker: 'Foundations', num: '01', title: 'Spell Grammar: What Am I Actually Building?', page: 4,
    html: `
      <div class="grid cols-3">
        <div class="plain-box"><h3>Physical</h3><p><b>Question:</b> What exists?</p><p>Physical Components create or manipulate tangible substances.</p>${chips(['Geo', 'Water', 'Iron', 'Flora', 'Fiber', 'Sand', 'Celestial'])}</div>
        <div class="plain-box"><h3>Aspectual</h3><p><b>Question:</b> What property is applied?</p><p>Aspectual Components add a magical state, force, or behavior.</p>${chips(['Fire', 'Ice', 'Lightning', 'Poison', 'Volatility'], 'gold')}</div>
        <div class="plain-box"><h3>Form</h3><p><b>Question:</b> How does it manifest?</p><p>Form controls delivery rather than magical substance.</p>${chips(['Projectile', 'Burst', 'Wall', 'Field', 'Infusion', 'Armor'])}</div>
      </div>
      <h3>Components Can Stand Alone</h3>
      ${table(['Build', 'What it might mean'], [
        ['<b>Geo + Projectile</b>', 'Conjure or tear loose a stone and launch it.'],
        ['<b>Fire + Burst</b>', 'A pure magical flare or explosion; no Physical Component required.'],
        ['<b>Water + Field</b>', 'Flood or saturate an area.'],
        ['<b>Iron + Armor</b>', 'Reinforce existing armor or sheath the body in conjured metal.'],
      ])}
      <h3>Composites Combine Behaviors</h3>
      ${table(['Composite', 'Natural interpretation', 'Possible free minor consequence'], [
        ['Geo + Fire', 'Molten stone, burning rock, volcanic plating', 'Leaves hot terrain or ignites fragile material'],
        ['Water + Ice', 'Flash-freezing water, ice growth', 'Slippery or frozen surface'],
        ['Water + Lightning', 'Conductive current through liquid', 'Electricity follows wet pathways'],
        ['Sand + Fire', 'Heated sand, glass formation at sufficient power', 'Sharp or brittle terrain'],
      ])}
      <div class="callout"><b>Rule of thumb:</b> small effects that logically emerge from the material may be free. Strong mechanical conditions still cost Mana.</div>`,
  },
  {
    id: 'potency-mana', section: 'how', kicker: 'Power Scaling', num: '02', title: 'Potency & the Mana Formula', page: 5,
    html: `
      <p class="lead"><b>Potency</b> is how hard the user pushes reality. It is the anchor for both Mana and damage.</p>
      <div class="grid cols-2">
        ${table(['^Potency', '^Core Mana', 'Table meaning'], potencies.map((p) => [ROMAN[p], F.coreMana(p), F.POTENCY[p].meaning]))}
        <div>
          <h3>Master Mana Formula</h3>
          <div class="formula gold">Final Mana = Core Mana + Composite + Range + Area + Duration + Effect</div>
          <h4>Where do the inputs come from?</h4>
          <p><b>Core Mana:</b> look up the chosen Potency in the table.</p>
          <p><b>Composite:</b> count how many Components are synchronized.</p>
          <p><b>Range:</b> choose the farthest distance the spell can reach.</p>
          <p><b>Area:</b> estimate the space affected.</p>
          <p><b>Duration:</b> how long the effect remains active.</p>
          <p><b>Effect:</b> any extra mechanical condition beyond straightforward damage or utility.</p>
        </div>
      </div>
      <div class="dark-box"><h3>Worked Example - Molten Stone Burst</h3>
        <p><b>Goal:</b> Geo + Fire, Potency III, 60-foot range, 20-foot burst, instantaneous, no added condition.</p>
        <p><b>Math:</b> 5 Core + 1 Composite + 1 Range + 2 Area + 0 Duration + 0 Effect = <b>9 Mana</b>.</p></div>
      <div data-calc="mana"></div>`,
  },
  {
    id: 'mana-modifiers', section: 'how', kicker: 'Cost Modifiers', num: '03', title: 'Mana Modifiers: What Makes a Spell Expensive?', page: 6,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Composite Cost</h3>
          ${table(['Components', '^Cost'], [1, 2, 3, 4].map((n) => [`${n} Component${n > 1 ? 's' : ''}`, `+${F.compositeCost(n)}${n === 4 ? ' or more' : ''}`]))}
          <h3>Range Cost</h3>
          ${table(['Maximum range', '^Cost'], costRows(F.RANGE_COSTS))}
          <h3>Area Cost</h3>
          ${table(['Approx. area', '^Cost'], costRows(F.AREA_COSTS))}
        </div>
        <div>
          <h3>Duration Cost</h3>
          ${table(['Duration', '^Cost'], [...costRows(F.DURATION_COSTS), ['Remove Concentration', `Usually +${F.REMOVE_CONCENTRATION_COST} more`]])}
          <h3>Effect Cost</h3>
          ${table(['Rank', 'Examples', '^Cost'], F.EFFECT_RANKS.map((e) => [e.label, e.examples, `+${e.cost}${e.note ? `; ${e.note.toLowerCase()}` : ''}`]))}
          <div class="callout"><b>Design rule:</b> the system rarely says "you cannot." It usually says "yes, but reality charges more Mana."</div>
        </div>
      </div>
      <div data-calc="mana"></div>`,
  },
  {
    id: 'damage', section: 'how', kicker: 'Damage', num: '04', title: 'Damage Formula: How Hard Does It Hit?', page: 7,
    html: `
      <div class="formula">Damage Dice = P + 2 + floor(P / 3)</div>
      <p><b>P</b> means Potency. <b>floor</b> means divide, then always round down.</p>
      <div class="grid cols-2">
        ${table(['^P', 'Calculation', '^Dice'], potencies.map((p) => [ROMAN[p], `${p} + 2 + floor(${p}/3)`, F.damageDice(p)]))}
        <div>
          <h3>Then choose the die by Form</h3>
          ${table(['Delivery', '^Die', 'Reason'], F.DELIVERIES.filter((d) => ['single', 'heavy', 'area', 'persistent'].includes(d.id)).map((d) => [d.label, `d${d.die}`, d.reason]))}
          <div class="note-box"><h4>Example</h4><p>Potency III gives <b>6 dice</b>. A single-target Ice Spear becomes <b>6d8</b>. A 20-foot Ice Burst becomes <b>6d6</b>.</p></div>
        </div>
      </div>
      <h3>Conditions Trade Away Damage</h3>
      <div class="formula gold">Final Damage Dice = Normal Dice - Effect Rank</div>
      <p>A Potency III spell normally has 6 dice. If it also carries a Rank II control effect, it deals <b>4 dice + the condition</b>. This keeps control magic from also being the best raw damage.</p>
      <div class="callout"><b>Environmental discount:</b> if an abundant Physical Component already exists nearby, reduce the spell's Mana by 1 (minimum total cost 1). The battlefield becomes part of the spellbook.</div>
      <div data-calc="damage"></div>`,
  },
  {
    id: 'attacks-saves', section: 'how', kicker: 'Resolution', num: '05', title: 'Attack Rolls, Save DCs & Every Formula Input', page: 8,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Direct Spell Attack</h3>
          <div class="formula">d20 + PB + IM</div>
          <p><b>PB - Proficiency Bonus:</b> the normal proficiency bonus on the character sheet, determined by character level.</p>
          <p><b>IM - Invocation Modifier:</b> the ability modifier used to control this particular magical technique.</p>
          ${table(['User / technique', 'Typical IM'], [
            ['Wizard', 'Intelligence'], ['Cleric', 'Wisdom'], ['Sorcerer', 'Charisma'],
            ['Applied Thaumaturgy: force / impact', 'Strength'],
            ['Applied Thaumaturgy: speed / precision', 'Dexterity'],
            ['Applied Thaumaturgy: body / armor', 'Constitution'],
          ])}
        </div>
        <div>
          <h3>Arcane Save DC</h3>
          <div class="formula">8 + PB + IM</div>
          <p>Use this when the Composition forces the target to resist rather than when the caster aims an attack roll.</p>
          <div class="note-box"><h4>Example</h4><p>Level 5 character: PB +3. Invocation ability modifier +4.</p><p><b>Save DC = 8 + 3 + 4 = 15.</b></p></div>
          <h3>Which Saving Throw?</h3>
          ${table(['What the target must do', 'Save'], [
            ['Leap away / avoid an explosion', 'DEX'], ['Resist shove, crushing, restraint', 'STR'],
            ['Endure poison, freezing, body effect', 'CON'], ['Resist perception / mental manipulation', 'WIS / INT'],
            ['Resist soul / identity manipulation', 'CHA'],
          ])}
        </div>
      </div>
      <div class="callout"><b>Important:</b> the element does not choose the save. The danger does. A Geo projectile might be DEX; a closing stone prison might be STR.</div>
      <div data-calc="attack-dc"></div>`,
  },
  {
    id: 'spell-mana-pools', section: 'how', kicker: 'Compatibility', num: '06', title: 'Existing D&D Spells & Maximum Mana', page: 9,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Codified Spell Mana</h3>
          <p>Existing D&amp;D spells are already-optimized magical formulas. Keep their normal statistics and replace spell slots with Mana.</p>
          ${table(['^Spell level', '^Mana'], F.SPELL_LEVEL_MANA.map((m, i) => [i || 'Cantrip', m]))}
          <p class="fine">Example: Fireball = 3rd-level = 5 Mana. Misty Step = 2nd-level = 3 Mana.</p>
          <div data-calc="spell-mana"></div>
        </div>
        <div>
          <h3>Suggested Full-Caster Mana Pool</h3>
          <div class="formula">Max Mana = floor(5L + L^2 / 12 - 1)</div>
          <p><b>L</b> is character level, found directly on the character sheet. Calculate the expression, then round down.</p>
          ${table(['^Level', '^Approx. Mana'], [1, 5, 10, 15, 20].map((l) => [l, F.maxMana(l)]))}
          <p><b>Partial caster:</b> roughly 65% of this value.<br><b>Primarily martial Catalyst user:</b> roughly 40%.</p>
          <div data-calc="mana-pool"></div>
        </div>
      </div>
      <div class="dark-box"><h3>Example - Level 10</h3><p>5(10) + 10^2/12 - 1 = 50 + 8.33 - 1 = 57.33. Round down: <b>57 Mana</b>.</p></div>
      <div class="callout"><b>Playtest flag:</b> Mana-pool totals are tuning knobs. They are intentionally easy to change without rewriting the rest of Arcane Compositry.</div>`,
  },
  {
    id: 'applied-thaumaturgy', section: 'how', kicker: 'Martial Magic', num: '07', title: 'Applied Thaumaturgy: Magic Through Body & Gear', page: 10,
    html: `
      <p class="lead">Traditional Compositors project magic outward. Applied Thaumaturges route it through weapons, armor, movement, stance, and the body itself.</p>
      <div class="grid cols-2">
        <div>
          <h3>Weapon Infusion</h3>
          <p>Do <b>not</b> add a full spell's damage to every Attack Chain strike. Instead, create an <b>Arcane Charge Pool</b>.</p>
          <div class="formula">Charge Dice = Potency Damage Dice</div>
          <p>For weapon infusions, those dice are usually <b>d6s</b>.</p>
          <div class="note-box"><h4>Potency III Lightning Infusion</h4>
            <p>Potency III = 6 dice, so the weapon gains <b>6d6 Charge</b>.</p>
            <p>Each successful weapon hit may discharge <b>1d6</b>. A completed Attack Chain Finisher may discharge <b>2d6</b>.</p></div>
        </div>
        <div>
          <h3>Defensive Infusion</h3>
          <p>Armor magic should strengthen your active defense rather than simply granting blanket resistance.</p>
          <div class="formula">Reinforcement = Number of Potency Damage Dice</div>
          <p>Potency II has 4 damage dice, so a Potency II Geo Armor grants <b>+4 Reinforcement</b> to your Block system.</p>
          <h3>Why STR / DEX / CON?</h3>
          <p>Applied Thaumaturgy treats the body as part of the circuit:</p>
          <ul><li><b>STR:</b> force, impact, heavy weapon augmentation.</li><li><b>DEX:</b> speed, precision, delicate weapon routing.</li><li><b>CON:</b> armor, endurance, bodily reinforcement.</li></ul>
        </div>
      </div>
      <div class="callout"><b>Identity rule:</b> martials are not "bad wizards." They are specialists at <i>integrating</i> magic into physical action.</div>
      <div data-calc="thaumaturgy"></div>`,
  },
  {
    id: 'arcane-chains', section: 'how', kicker: 'Active Combat', num: '08', title: 'Arcane Attack Chains & What Happens on a Miss', page: 11,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Arcane Attack Chain</h3>
          <p>A caster can split one spell's damage pool across several linked attack rolls.</p>
          <div class="note-box"><h4>Example</h4><p>Potency III single-target Composition = <b>6d8</b>.</p><p>Three-projectile chain:</p>
            <p><b>Attack 1:</b> 2d8<br><b>Attack 2:</b> 2d8<br><b>Attack 3:</b> 2d8 Finisher</p></div>
          <p>For a saving-throw Finisher, prefer <b>disadvantage on the save</b> rather than automatic failure.</p>
          <h3>Design Goal</h3>
          <p>Longer magical attacks feel like sustained pressure without multiplying a full spell's damage several times.</p>
        </div>
        <div>
          <h3>Missing Should Create a Choice</h3>
          ${table(['Recovery', 'What it does'], [
            ['<b>Revector</b>', 'Spend 1 Mana to reroll once.'],
            ['<b>Redirect</b>', 'Send the projectile toward another legal nearby target, usually with a penalty.'],
            ['<b>Collapse</b>', 'Detonate early for reduced effect.'],
            ['<b>Seed</b>', 'Sacrifice direct damage so the Physical Component remains in the scene.'],
            ['<b>Ground</b>', 'Safely terminate the magic.'],
          ])}
          <div class="dark-box"><p><b>Missed Geo projectile?</b> It may create cover.<br><b>Missed Water?</b> The floor becomes wet.<br><b>Missed Ice?</b> A slick patch forms.</p></div>
        </div>
      </div>
      <p class="pull">A bad roll should create a complication, not erase a player's turn.</p>
      <div data-calc="arcane-chain"></div>`,
  },
  {
    id: 'circuit-stability', section: 'how', kicker: 'Interruption', num: '09', title: 'Circuit Stability: When a Spell Is Hit Mid-Invocation', page: 12,
    html: `
      <div class="formula">Stability Check = d20 + PB + IM</div>
      <div class="formula gold">Stability DC = 10 + floor(P/2) + Additional Components + floor(Damage Taken/10)</div>
      <div class="grid cols-2">
        <div>
          <h3>What each input means</h3>
          <p><b>P:</b> current spell Potency.</p>
          <p><b>Additional Components:</b> number of Components beyond the first. Geo = 0; Geo + Fire = 1; Geo + Fire + Volatility = 2.</p>
          <p><b>Damage Taken:</b> damage from the interrupting hit. Divide by 10 and round down.</p>
          <p><b>PB / IM:</b> same Proficiency Bonus and Invocation Modifier used for Arcane attacks.</p>
        </div>
        <div class="note-box"><h4>Worked Example</h4>
          <p><b>Spell:</b> Potency IV Geo + Fire.<br><b>Damage taken:</b> 12.</p>
          <p>10 base<br>+ floor(4/2) = 2<br>+ 1 additional Component<br>+ floor(12/10) = 1</p>
          <p><b>DC = 14.</b></p><p>The caster rolls d20 + PB + IM against 14.</p></div>
      </div>
      <h3>If the Stability Check Fails</h3>
      <div class="grid cols-2">
        <div class="plain-box"><h4>Ground</h4><p>Safely cancel; recover part of the Mana if your table uses that option.</p></div>
        <div class="plain-box"><h4>Force Closure</h4><p>Spend extra Mana and complete the spell under a drawback such as disadvantage.</p></div>
        <div class="plain-box"><h4>Backwash</h4><p>The spell completes, but the caster suffers Arcane backlash.</p></div>
        <div class="plain-box"><h4>Collapse</h4><p>The spell releases early at reduced Potency or in an altered position.</p></div>
      </div>
      <div class="callout"><b>Combat purpose:</b> Counter-attacks against casters can now break or distort magic instead of merely removing hit points.</div>
      <div data-calc="stability"></div>`,
  },

  // ══════════════════════ SECTION II - LORE & COMBAT ════════════════════════
  {
    id: 'tendril-catalysts', section: 'lore', kicker: 'Section II - Lore & Combat Integration', title: 'Tendril & Catalysts: The Body as Arcane Circuitry', page: 13,
    html: `
      <p class="pull">Catalyst = power source. Tendril = circuit. Body and mind = processor. Gesture = switch. Composition = output.</p>
      <div class="grid cols-2">
        <div>
          <h3>Tendril</h3>
          <p>Tendril is magic scripture bonded to the body in vine-like lines. It is not merely a tattoo: it is functional Arcane circuitry.</p>
          <p>When dormant, Tendril may resemble ink, scar tissue, metallic filigree, or faintly colored veins. When invoked, Mana moves visibly through it and the lines glow in colors corresponding to the routed Components.</p>
          <h3>Functional Anatomy</h3>
          <ul>
            <li><b>Root Nodes:</b> where Catalyst energy enters the network.</li>
            <li><b>Branches:</b> distribute Mana around the body.</li>
            <li><b>Gates:</b> deliberately incomplete sections of circuit.</li>
            <li><b>Terminals:</b> points joined by gestures.</li>
            <li><b>Confluence Nodes:</b> places where Components combine.</li>
          </ul>
        </div>
        <div>
          <h3>Catalysts</h3>
          <p>Catalysts are magic-bearing metals, gems, crystals, or similar materials bound to the user. They act like Arcane batteries but are also status symbols, weapons technology, infrastructure, and cultural artifacts.</p>
          <div class="note-box"><h4>Capacity</h4><p>How much total Mana the Catalyst can store.</p><h4>Throughput</h4><p>How much Mana it can safely discharge through Tendril in one invocation.</p></div>
          <p>A Catalyst might hold 50 Mana but safely route only 5 at once. This prevents raw battery size from automatically granting mastery over extreme Potency.</p>
        </div>
      </div>
      <div class="callout"><b>Visual language:</b> knowledgeable people can often recognize the type of magic being prepared by watching where Tendrils light and what colors converge.</div>`,
  },
  {
    id: 'invocation', section: 'lore', kicker: 'Invocation', num: '10', title: 'Prime -> Route -> Bridge -> Release', page: 14,
    html: `
      <div class="grid cols-2">
        <ol class="steps">
          <li><span class="n">P</span><div><h4>Prime</h4><p>The user draws Mana from the Catalyst. Root Tendrils light first.</p></div></li>
          <li><span class="n">R</span><div><h4>Route</h4><p>Mana is sent through the Branches associated with the selected Component or Components.</p></div></li>
          <li><span class="n">B</span><div><h4>Bridge</h4><p>A gesture joins open Terminals and closes the circuit. This is where Components synchronize.</p></div></li>
          <li><span class="n">R</span><div><h4>Release</h4><p>The completed circuit produces the Composition: projectile, armor, field, strike, barrier, and so on.</p></div></li>
        </ol>
        <div>
          <h3>Gestures Are Circuit Architecture</h3>
          <p>Touching two fingers may close one Gate. Pressing palms together may combine two Component branches. Gripping a weapon, drawing a blade, crossing forearms, or planting both feet can be a martial Bridge.</p>
          <h3>Read the Circuit</h3>
          <div class="formula">Arcana or Perception vs. DC 10 + Potency</div>
          <p>A success can reveal a Component, Form, approximate Potency, or target. A strong success may reveal the entire Composition.</p>
          <h3>False Route / Arcane Feint</h3>
          <p>A skilled Compositor can deliberately light the wrong route before switching at the last moment. A simple version costs <b>1 Mana</b> and makes the Composition harder to read or defend against.</p>
        </div>
      </div>
      <div class="dark-box"><p><b>Martial flavor:</b> the Fighter does not stop to "cast." Their fighting motion completes the circuit. The sword draw, stance, grip, or strike can be the Bridge.</p></div>
      <div data-calc="read-circuit"></div>`,
  },
  {
    id: 'counter-compositry', section: 'lore', kicker: 'Reactive Magic', num: '11', title: 'Counter-Compositry: Magic Should Collide', page: 15,
    html: `
      <p class="lead">Instead of every counter being "your spell disappears," Arcane Compositry lets defenders oppose the actual material, force, and route being used.</p>
      <div class="formula">Counter Check = Invocation Check vs. Attacker's Arcane Save DC</div>
      <p>If the proposed counter is especially logical or effective, a simple starting bonus is <b>+2</b>.</p>
      <div class="grid cols-2">
        <div><h3>Examples</h3>
          ${table(['Attack', 'Counter', 'Possible result'], [
            ['Fire', 'Water', 'Steam, suppression, obscured sight'], ['Lightning', 'Geo', 'Grounded discharge into terrain'],
            ['Wind', 'Sand', 'Blinding airborne grit'], ['Lightning', 'Iron', 'Conducted current through metal'],
            ['Fire', 'Ice / Water', 'Steam or thermal shock'],
          ])}</div>
        <div><h3>Three Possible Outcomes</h3>
          <div class="stack">
            <div class="plain-box"><h4>Cancel</h4><p>The defending Composition neutralizes the incoming effect.</p></div>
            <div class="plain-box"><h4>Redirect</h4><p>The defender changes the destination, path, or target.</p></div>
            <div class="plain-box"><h4>Transform</h4><p>The two spells create a third battlefield condition.</p></div>
          </div></div>
      </div>
      <div class="callout"><b>Avoid a rigid weakness chart.</b> Judge physical and magical logic. The same counter can behave differently depending on terrain, Form, scale, and creativity.</div>
      <h3>Environmental Compositry</h3>
      <p>Wet floors conduct. Sand can become glass. Vegetation can burn or grow. Metal can channel electricity. Stone can ground or obstruct. The environment is not set dressing; it is a resource and a consequence engine.</p>
      <div data-calc="counter"></div>`,
  },
  {
    id: 'discovery', section: 'lore', kicker: 'Progression', num: '12', title: 'Arcane Discovery & Codifying Player-Made Spells', page: 16,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Improvised Composition</h3>
          <p>A new idea begins as an improvised formula. The player chooses Components, Form, Potency, and modifiers using the normal construction rules.</p>
          <h3>Arcane Discovery</h3>
          <p>When a character finds a useful interaction - perhaps Sand + Fire becoming glass, or Water + Lightning creating a conductive trap - record it. Repeated use turns experimentation into technique.</p>
          <h3>Refinement</h3>
          <p>Downtime, research, mentors, diagrams, Catalyst testing, and repeated combat use can stabilize the exact Tendril route and timing.</p>
        </div>
        <div>
          <h3>Codification</h3>
          <p>Once reliable, the player may <b>Codify</b> the Composition. It becomes a named, repeatable spell with a precise circuit and established notation.</p>
          <div class="note-box"><h4>Choose an Optimization</h4>
            <ul><li>Reduce Mana cost by 1.</li><li>Increase range one category.</li><li>Increase area slightly.</li><li>Improve Circuit Stability.</li><li>Reduce a specific effect penalty.</li><li>Make Revector cheaper.</li><li>Hide part of the Tendril route.</li></ul></div>
        </div>
      </div>
      <p class="pull">The spell list can grow because of what the players actually invent during the campaign.</p>
      <div class="dark-box"><h3>Example</h3><p>A character repeatedly creates radiant fragments of heated Celestial material. After research and refinement, the technique becomes a formal spell: <b>Seraphine's Shattered Sun</b>. It did not exist before that character created it.</p></div>
      <p>Codified player spells appear in the <a href="#/spells/compositry">Compositry spell index</a>. Track discoveries in progress on your character sheet's Arcane tab.</p>`,
  },
  {
    id: 'world', section: 'lore', kicker: 'Worldbuilding', num: '13', title: 'How Arcane Compositry Lives in the World', page: 17,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Existing D&amp;D Spells Are Ancient Codifications</h3>
          <p>Fireball is not merely "Fire + Volatility + Burst." It is a heavily optimized circuit refined by generations of magical researchers. The same explanation applies to Shield, Misty Step, Magic Missile, and other established spells.</p>
          <p>This is why Codified spells may keep familiar D&amp;D statistics even when an improvised spell with similar ingredients would use the generic construction formulas.</p>
          <h3>Magic Has Lineage</h3>
          <p>A famous technique may carry the name of its inventor. Academies teach it. Armies adapt it. Rivals build counters. Scholars argue over attribution. A player's invention can become part of history.</p>
        </div>
        <div>
          <h3>Magical Identity</h3>
          <p>Compositors develop recognizable styles: Water + Ice duelists, Geo + Volatility siege casters, Iron + Lightning Applied Thaumaturges, or specialists in a single Physical Component.</p>
          <p>Their preferred routes, gestures, Tendril colors, and spell shapes become signatures. A veteran may recognize an opponent before seeing their face simply by watching their Tendril pattern ignite.</p>
          <h3>Catalysts as Culture</h3>
          <p>Because Catalysts store and regulate Mana, they can be heirlooms, licenses, religious objects, military hardware, black-market goods, political symbols, or proof of social rank.</p>
        </div>
      </div>
      <div class="note-box"><h3>Long-Term Consequence</h3><p>If a player invents a new Composition, the world can respond: apprentices ask to learn it, an academy offers to purchase the notation, enemies develop an anti-circuit, or a nation tries to weaponize the discovery.</p></div>
      <div class="callout"><b>Tendril is visible magic.</b> Magic use leaves social information on the body. That can affect law, status, suspicion, fashion, religion, and identity far outside combat.</div>`,
  },
  {
    id: 'enemy-compositors', section: 'lore', kicker: 'DM Toolkit', num: '14', title: 'Enemy Compositors Without Giant Spell Lists', page: 18,
    html: `
      <p>Give each spellcasting NPC an <b>Arcane Profile</b>: Known Physicals, Known Aspects, Known Forms, Maximum Potency, Mana, temperament, and one or two Signature Compositions.</p>
      <div class="grid cols-2">
        <div>
          <h3>Roll Arcane Intent</h3>
          ${table(['^d6', 'Intent'], F.ARCANE_INTENT.slice(1).map((t, i) => [i + 1, t]))}
          <h3>Will They Improvise?</h3>
          ${table(['Temperament', 'Improvises on...'], [['Disciplined', 'd6 = 6'], ['Adaptive', 'd6 = 5-6'], ['Experimental', 'd6 = 3-6']])}
        </div>
        <div>
          <h3>Choose Potency</h3>
          ${table(['^d6', 'Power used'], [['1', 'About one-third maximum'], ['2-3', 'About two-thirds maximum'], ['4-5', 'Maximum minus 1'], ['6', 'Maximum Potency']])}
          <p>If the NPC is bloodied, desperate, enraged, or protecting something important, treat the Potency result as one category more aggressive.</p>
          <div class="dark-box"><h4>Why this works</h4><p>The NPC "invents" from the same Components the players use. The DM only needs a small profile, but combat still feels adaptive and personal.</p></div>
        </div>
      </div>
      <div class="callout"><b>Personality through rules:</b> a conservative academy mage behaves differently from a reckless battlefield researcher before you write a single line of dialogue.</div>
      <div data-calc="enemy"></div>`,
  },
  {
    id: 'attack-chains', section: 'lore', kicker: 'Combat Integration', num: '15', title: 'Attack Chains: The Core Loop', page: 19,
    html: `
      <p class="lead">An Attack Chain is one sustained offensive sequence. A hit creates pressure, pressure creates another attack, and the defender decides when to spend resources to stop the exchange.</p>
      <div class="grid cols-2">
        <div>
          <h3>1. Start the Chain</h3>
          <p>Make a normal attack roll against the target's AC.</p>
          <div class="formula">Attack Total = d20 + Attack Bonus</div>
          <p><b>If the roll misses AC:</b> use a Miss Recovery option (see <a href="#/codex/misses-finishers">Misses &amp; Finishers</a>). A miss does not automatically mean "your turn is over."</p>
          <p><b>If the roll meets or beats AC:</b> the target may take the hit or spend Guard on an active defense.</p>
          <h3>2. Resolve the Hit</h3>
          <p>If no defense stops it, deal damage. The attacker gains <b>1 Chain Momentum</b> and may make the next attack in the Chain, up to their maximum Chain Length.</p>
          <h3>3. Continue or Stop</h3>
          <p>The attacker may keep pressing, or voluntarily end the Chain after a successful hit to take a safer stance.</p>
          <div class="callout"><b>Design goal:</b> the attacker keeps making decisions, but the defender also keeps playing during the attacker's turn.</div>
        </div>
        <div>
          <h3>Suggested Maximum Chain Length</h3>
          ${table(['Character tier', '^Max Chain', 'Feel'], F.CHAIN_TIERS.map((t) => [t.to === 20 ? `Levels ${t.from}+` : `Levels ${t.from}-${t.to}`, t.max, t.feel]))}
          <p class="fine">This is a baseline, not a class lock. Weapons, class features, monsters, and techniques can raise or lower Chain Length.</p>
          <h3>Momentum</h3>
          <p>Each successful strike in the current Chain grants <b>1 Chain Momentum</b>.</p>
          <div class="formula">Chain Attack Bonus = +1 per Chain Momentum (max +3)</div>
          <p>Chain Momentum exists only for the current Chain. It ends when the Chain is broken or voluntarily stopped.</p>
          <h3>Melee Pressure Rule</h3>
          <p>After a defender <b>takes damage from a melee hit</b> in the current Chain, they normally cannot Dodge later melee attacks in that same Chain. They may still Parry or Block.</p>
          <p class="small">Dodge becomes legal again if the defender creates meaningful distance, uses a feature that explicitly permits it, or the attacker loses pressure.</p>
        </div>
      </div>
      <p class="pull">Hit -> defender reacts -> damage -> Chain Momentum -> next attack -> interruption or Finisher.</p>
      <div data-calc="chain"></div>`,
  },
  {
    id: 'active-defense', section: 'lore', kicker: 'Active Defense', title: 'Guard, Dodge, Parry & Block', page: 20,
    html: `
      <p class="lead">Active defense is optional. The normal attack roll still checks AC first; only an attack that would hit asks the defender whether the hit is worth spending Guard on.</p>
      <div class="grid cols-2">
        <div>
          <h3>Guard</h3>
          <div class="formula gold">Guard = 2 + Proficiency Bonus</div>
          <p><b>PB</b> is the creature's normal proficiency bonus. Guard refreshes at the <b>beginning of that creature's turn</b>.</p>
          ${table(['Spend', 'Use'], [['1 Guard', 'Dodge, Parry, or Block'], ['2 Guard', 'Counter-attack']])}
          <h3>Broken Guard</h3>
          <p>At <b>0 Guard</b>, a creature can still benefit from normal AC, but it cannot actively Dodge, Parry, Block, Counter-attack, or interrupt a Finisher until Guard returns.</p>
          <div class="callout"><b>Why this matters:</b> several weaker allies can wear down a powerful defender's Guard so a heavy hitter can exploit the opening.</div>
          <div data-calc="guard"></div>
        </div>
        <div class="stack">
          <div class="plain-box"><h3>Dodge - Avoid the attack</h3>
            <div class="formula">Dodge = d20 + DEX modifier + PB if proficient in DEX saves</div>
            <p>Spend 1 Guard. If the Dodge total <b>meets or exceeds the attack total</b>, the attack misses completely.</p>
            <p class="small"><b>Perfect Dodge:</b> beat the attack total by 5+. You may move 5 feet without provoking an opportunity attack. If that carries you outside the attacker's reach, the Chain ends.</p></div>
          <div class="note-box"><h3>Parry - Redirect the attack</h3>
            <div class="formula">Parry = d20 + STR or DEX modifier + PB if proficient with the parrying weapon</div>
            <p>Spend 1 Guard. Meet or beat the attack total to stop the hit.</p>
            <p class="small"><b>Perfect Parry:</b> beat the attack total by 5+. The Attack Chain immediately ends. <b>Masterful Parry:</b> beat it by 10+. Once per round, you may make the resulting Counter-attack without paying its additional 2 Guard cost.</p></div>
          <div class="plain-box"><h3>Block - Absorb the attack</h3>
            <p>Spend 1 Guard. The attack connects, but reduce its damage. Suggested baselines:</p>
            ${table(['Blocking tool', 'Damage reduction'], [['Weapon block', 'PB + STR modifier'], ['Shield', '1d8 + STR modifier'], ['Heavy shield / equivalent', '1d10 + STR modifier']])}
            <p class="small"><b>Perfect Block:</b> if damage is reduced to 0, the Chain ends.</p></div>
        </div>
      </div>
      <p class="fine">A defense must make physical sense. You cannot normally parry a wall of flame with an ordinary dagger, but you might parry a conjured iron spear or block fire with an appropriate magical ward.</p>
      <div data-calc="defense"></div>`,
  },
  {
    id: 'interruptions', section: 'lore', kicker: 'Interruptions', title: 'Breaking Chains & Counter-attacking', page: 21,
    html: `
      <p class="lead">The defender's goal is not merely to reduce damage. Good defense can seize control of the exchange and turn defense into offense.</p>
      <div class="grid cols-2">
        <div>
          <h3>What Breaks a Chain?</h3>
          ${table(['Event', 'Result'], [
            ['Perfect Parry', 'Chain ends immediately.'], ['Perfect Dodge exits reach', 'Chain ends.'], ['Block reduces damage to 0', 'Chain ends.'],
            ['Recover / Reposition / Feint', 'Chain ends safely.'],
            ['Attacker is knocked away, restrained, disarmed, or otherwise unable to continue', 'Chain ends if the interruption meaningfully breaks the sequence.'],
            ['Counter-attack lands', 'Original Chain ends; control may reverse.'],
          ])}
          <h3>Counter-attack</h3>
          <p><b>Once per round</b>, a defender may spend <b>2 Guard</b> to Counter-attack when a clear opening occurs.</p>
          <p>Common triggers:</p>
          <ul><li>The attacker misses by 5 or more.</li><li>The attacker rolls a natural 1.</li><li>The defender scores a Perfect Parry.</li><li>A Block reduces the attack's damage to 0.</li><li>A special feature creates an opening.</li></ul>
        </div>
        <div>
          <div class="dark-box"><h3>Resolving a Counter</h3>
            <ol><li>The opening occurs.</li><li>The defender spends 2 Guard.</li><li>The defender makes one immediate attack.</li><li>If it lands, the original Chain ends.</li><li>If the countering creature is allowed to Chain, that hit may become the first hit of its own Attack Chain.</li></ol></div>
          <h3>Interrupting Without Damage</h3>
          <ul><li>Shove the attacker outside weapon reach.</li><li>Grapple or bind the weapon arm.</li><li>Disarm the weapon needed for the Chain.</li><li>Raise terrain or cover between combatants.</li><li>Teleport or force-move either combatant.</li><li>Use a Composition that physically disrupts stance or footing.</li></ul>
          <h3>Ally Interventions</h3>
          <p>For a highly reactive table, you may allow a creature to spend a Reaction plus Guard to protect an adjacent ally with a Block, Parry, shove, ward, or Counter-Compositry attempt.</p>
          <div class="callout"><b>Keep it readable:</b> limit most creatures to one Counter-attack each round. Otherwise two skilled duelists can recursively counter each other for too long.</div>
        </div>
      </div>
      <p class="pull">A strong defense does not simply say "no." It creates a chance for momentum to change hands.</p>`,
  },
  {
    id: 'misses-finishers', section: 'lore', kicker: 'Pressure & Recovery', title: 'Misses, Finishers & Voluntary Endings', page: 22,
    html: `
      <p class="lead">A bad roll should create a problem to solve, not erase a player's turn. Attack Chains therefore give the attacker several ways to recover from a miss.</p>
      <div class="grid cols-2">
        <div>
          <h3>When an Attack Misses</h3>
          ${table(['Recovery', 'Effect'], [
            ['<b>Recover</b>', 'End the Chain safely and regain 1 Guard, up to your normal maximum.'],
            ['<b>Press the Attack</b>', 'Continue the Chain. Your next attack is -2, and the defender gains +2 on an active defense against it.'],
            ['<b>Reposition</b>', 'Move 5 feet without provoking from the current target; the Chain ends.'],
            ['<b>Feint</b>', 'End the Chain and force the target to lose 1 Guard if it has any.'],
            ['<b>Wild Recovery</b>', 'Spend 1 Guard and reroll the missed attack once. If the reroll also misses, you become Exposed: -2 to your next active defense before your next turn.'],
          ])}
          <h3>Voluntarily Ending a Chain</h3>
          <p>After a successful hit, the attacker can stop instead of pressing onward.</p>
          <div class="formula">Defensive Posture = +2 to your first active defense before your next turn</div>
          <p>This makes "always use the longest possible Chain" a choice rather than an automatic answer.</p>
        </div>
        <div>
          <h3>The Finisher</h3>
          <p>If an attacker reaches the <b>last attack of their maximum Chain</b> without the Chain being broken, that strike becomes a Finisher.</p>
          <div class="note-box"><p><b>Finisher rule:</b> make the attack roll normally, but the Finisher does not fail merely because it falls below AC. The roll still establishes the <b>Attack Total</b> for Dodge, Parry, Block, Counterplay, critical results, and other reactions.</p></div>
          <p>If the defender cannot or chooses not to spend Guard on a legal defense, the Finisher hits. This represents the defender being worn down by the sustained sequence.</p>
          <p>A Finisher can still be stopped by:</p>
          <ul><li>a successful active defense;</li><li>a legal Counter-attack trigger;</li><li>an ally intervention;</li><li>forced movement or other interruption;</li><li>a class, monster, or magical feature.</li></ul>
          <h3>Why Roll the Finisher?</h3>
          <p>The attack roll preserves interaction even though normal AC no longer cancels the strike. A high result makes the Finisher difficult to Parry or Dodge; a low result gives the defender a realistic chance to interrupt it.</p>
          <div class="callout"><b>Saving-throw magic:</b> never make a target automatically fail a save just because a magical Chain reached its Finisher. Use disadvantage on that save instead.</div>
        </div>
      </div>`,
  },
  {
    id: 'optional-modules', section: 'lore', kicker: 'Optional Playtest Modules', title: 'Escalation, Near Misses, Weapons & Class Identity', page: 23,
    html: `
      <p class="lead">These modules add texture after the basic Chain system is comfortable. They are intentionally optional so the core rules stay fast.</p>
      <div class="grid cols-2">
        <div>
          <h3>Escalation: Offense Has a Cost</h3>
          <div class="formula">Defensive Penalty = -1 per 2 attacks attempted in the current Chain</div>
          <p>After attempting four attacks, the attacker is at -2 on active defense until the Chain ends. Use this only if Momentum feels too safe or snowballs too easily.</p>
          <h3>Degrees of Miss</h3>
          ${table(['Result', 'Optional treatment'], [
            ['Miss by 5+', 'Clean Miss; normal recovery options.'],
            ['Miss by 1-4', 'Near Miss; choose a lesser outcome such as continue at -2, move the target 5 ft, force 1 Guard, or gain a small setup benefit.'],
            ['Hit', 'Normal hit; Chain continues.'],
            ['Beat AC by 5+', 'Strong Hit; optionally gain 1 extra Momentum, respecting the +3 cap.'],
          ])}
          <p class="fine">Do not give every Near Miss every benefit. Choose one modest consequence.</p>
          <h3>Weapon Identity Examples</h3>
          ${table(['Weapon', 'Possible Chain trait'], [
            ['Dagger', '+1 maximum Chain Length.'], ['Rapier', '+2 on attempts to achieve a Perfect Parry.'],
            ['Greatsword', '+2 damage for each previous hit in the current Chain.'], ['Greataxe', 'Halve mundane Block reduction against its strikes.'],
          ])}
        </div>
        <div>
          <h3>More Weapon Hooks</h3>
          ${table(['Weapon', 'Possible Chain trait'], [
            ['Longsword', 'Reroll one failed Parry per enemy Chain.'], ['Spear', 'A 5-ft Perfect Dodge does not automatically escape its reach.'],
            ['Warhammer', 'Blocking its heaviest strikes may cost +1 Guard.'], ['Shield', '+1 maximum Guard and improved Block options.'],
          ])}
          <h3>Class Identity Hooks</h3>
          <div class="plain-box">
            <h4>Fighter - Master of Chains</h4><p class="small">Reliable continuation, better Parry thresholds, weapon-specific techniques, or one miss per turn that does not immediately break rhythm.</p>
            <h4>Barbarian - Savage Momentum</h4><p class="small">Consecutive hits build damage rapidly, but long Chains create larger defensive penalties.</p>
            <h4>Monk - Chain Specialist</h4><p class="small">Longer Chains with moderate individual damage; specific sequences can unlock trips, pushes, or stance changes.</p>
            <h4>Rogue - Opening Hunter</h4><p class="small">Shorter Chains, but excellent Perfect Dodge/Parry payoffs, counters, and large rewards for exploiting openings.</p>
            <h4>Spellcaster - Distributed Barrage</h4><p class="small">Split one Composition's damage pool across several attacks instead of repeating full spell damage.</p>
          </div>
        </div>
      </div>
      <div class="callout"><b>Balance principle:</b> longer Chains should not simply mean more free damage. Classes and weapons should trade Chain length, reliability, damage, Guard pressure, and defensive risk.</div>
      <div data-calc="degrees"></div>`,
  },
  {
    id: 'arcane-integration', section: 'lore', kicker: 'Arcane Integration', title: 'Attack Chains + Arcane Compositry', page: 24,
    html: `
      <p class="lead">Compositry should plug into the same exchange: magic can strengthen a Chain, defend against one, or become vulnerable to interruption while it is being invoked.</p>
      <div class="grid cols-2">
        <div>
          <h3>Weapon Infusions</h3>
          <p>Do not add a full spell's damage to every hit. Create an <b>Arcane Charge Pool</b>.</p>
          <div class="formula">Charge Dice = Potency + 2 + floor(Potency / 3)</div>
          <p>Weapon infusions normally use d6s. A Potency III infusion creates <b>6d6</b> of Charge.</p>
          <ul><li>On a hit, spend 1 Charge Die for bonus damage.</li><li>On a Chain Finisher, spend up to 2 Charge Dice.</li><li>Unused dice last only as long as the paid duration allows.</li></ul>
          <h3>Defensive Infusions</h3>
          <div class="formula">Reinforcement Value = number of Potency damage dice</div>
          <p>Potency II has 4 damage dice, so a Geo armor infusion could add <b>+4</b> to a legal Block's damage reduction.</p>
          <h3>Arcane Attack Chains</h3>
          <p>For a multi-projectile Composition, divide the spell's normal damage pool across the Chain.</p>
          <p>Example: Potency III focused magic = 6d8. A three-hit barrage could deal <b>2d8 / 2d8 / 2d8</b>.</p>
        </div>
        <div>
          <h3>Which Defense Is Legal?</h3>
          ${table(['Arcane attack', 'Likely defenses'], [
            ['Stone projectile', 'Dodge, Parry, Block'], ['Molten stone', 'Dodge, Parry, Block; heat may leak through'],
            ['Pure fire wave', 'Dodge or magical / appropriate Block'], ['Iron spear', 'Dodge, Parry, Block'],
            ['Lightning', 'Dodge, specialized Block, grounding, Counter-Compositry'],
          ])}
          <h3>Interrupting a Caster</h3>
          <ol><li>The caster Primes and begins Routing.</li><li>An enemy gains a Counter-attack or other legal interruption.</li><li>The interruption hits or physically disrupts the Bridge.</li><li>The caster makes a Circuit Stability Check.</li><li>Failure leads to Ground, Force Closure, Backwash, or Collapse.</li></ol>
          <div class="formula">Stability DC = 10 + floor(P/2) + Extra Components + floor(Damage/10)</div>
          <p class="small">A shove, grapple, disarm, severed stance, raised wall, or Counter-Composition can interrupt even without HP damage if it genuinely breaks the circuit.</p>
        </div>
      </div>
      <div class="callout"><b>Counter-Compositry:</b> magical defense can also interrupt a Chain by changing the battlefield - freezing water underfoot, raising stone between duelists, grounding lightning, or transforming the incoming Composition.</div>`,
  },
  {
    id: 'worked-example', section: 'lore', kicker: 'Worked Combat Example', title: 'A Complete Attack Chain Exchange', page: 25,
    html: `
      <p class="lead">Kael is a Fighter with Attack +7, maximum Chain 3, and 5 Guard. An elite knight has AC 17 and 5 Guard.</p>
      <div class="grid cols-2">
        <div>
          <h3>Attack 1</h3>
          <p><b>Kael rolls 14 + 7 = 21.</b> The attack beats AC 17.</p>
          <p>The knight spends 1 Guard to <b>Parry</b>, but rolls only 17. The Parry fails.</p>
          <p>Kael deals 9 damage, gains <b>1 Chain Momentum</b>, and continues.</p>
          <h3>Attack 2</h3>
          <p>Kael now has +1 from Chain Momentum. He rolls <b>11 + 7 + 1 = 19</b>.</p>
          <p>Because the knight already took melee damage in this Chain, ordinary Dodge is unavailable. The knight spends 1 Guard to <b>Block</b>.</p>
          <p>Kael would deal 10 damage. The shield reduces 7, so the knight takes 3. Damage got through, so the Chain continues. Kael reaches <b>2 Momentum</b>.</p>
          <h3>Attack 3 - Finisher</h3>
          <p>This is Kael's final allowed attack. He still rolls to establish an Attack Total, but normal AC alone cannot make the Finisher miss.</p>
          <p>The knight spends 1 Guard on a Parry and rolls high enough to beat Kael's total by 5+. <b>Perfect Parry.</b> The Chain ends.</p>
        </div>
        <div>
          <h3>Control Reverses</h3>
          <p>The Perfect Parry creates a Counter-attack opening. The knight has enough Guard remaining and spends <b>2 Guard</b> to Counter.</p>
          <p>The Counter lands. Kael's offense is over, and the knight may now begin its own Chain if its rules allow.</p>
          <h3>Why This Is Interactive</h3>
          <ul><li>Kael chooses whether to keep pressing after every successful hit.</li><li>The knight chooses whether each incoming hit is worth Guard.</li><li>Dodge becomes less available once melee pressure is established.</li><li>Block is reliable but may still allow the Chain to continue.</li><li>Parry is riskier, but a Perfect Parry can reverse momentum.</li><li>The Finisher is threatening without removing defensive agency.</li></ul>
          <div class="note-box"><h3>Fast Table Procedure</h3>
            <ol><li>Attack roll vs. AC.</li><li>If it would hit: defender may spend Guard.</li><li>Resolve Dodge, Parry, or Block.</li><li>If damage lands: gain Chain Momentum.</li><li>Continue, voluntarily stop, or reach Finisher.</li><li>If an opening appears: eligible defender may Counter.</li></ol></div>
        </div>
      </div>
      <p class="pull">Do not narrate five isolated swings. Narrate one duel whose control is changing hand by hand.</p>`,
  },
  {
    id: 'momentum-dice', section: 'lore', kicker: 'Combat Resource', title: 'Momentum Dice: Build the Combo, Then Cash It Out', page: 26,
    html: `
      <p class="pull">Momentum Die: d4 > d6 > d8 > d10 > d12</p>
      <div class="grid cols-2">
        <div>
          <h3>The Core Loop</h3>
          <ol class="steps">
            <li><span class="n">1</span><div><h4>Begin at d4</h4><p>The d4 is your baseline state. It cannot be spent; it represents a combo that has not built enough force yet.</p></div></li>
            <li><span class="n">2</span><div><h4>Land a hit</h4><p>Each successful attack that hits an enemy can step your Momentum Die up one size, to a maximum of d12.</p></div></li>
            <li><span class="n">3</span><div><h4>Build or spend</h4><p>Once you are at d6 or higher, after a hit is confirmed you may either <b>build</b> one step higher or <b>spend</b> your current die on Damage or Stasis.</p></div></li>
            <li><span class="n">4</span><div><h4>Reset</h4><p>After you spend the die - whether the Stasis roll succeeds or fails - return to d4. A direct enemy hit that deals damage also resets you to d4.</p></div></li>
          </ol>
        </div>
        <div>
          <h3>What Does Not Reset It?</h3>
          <ul><li>Missing an attack: your die stays where it is.</li><li>An enemy attack missing you.</li><li>A successful Dodge or Parry.</li><li>A Block that reduces the incoming damage to 0.</li><li>Ending an Attack Chain normally.</li></ul>
          <div class="note-box"><h4>Direct Hit Rule</h4><p><b>Recommended:</b> reset Momentum Dice when a hostile attack directly deals damage to you. Passive damage already ticking from poison, fire, terrain, or another lingering effect does not normally reset it unless the DM rules that the effect meaningfully breaks your rhythm.</p></div>
          <div class="dark-box"><h4>Do not confuse the two Momentums</h4>
            <p><b>Chain Momentum</b> is the temporary +1-per-hit Attack Chain bonus, capped at +3, and disappears when that Chain ends.</p>
            <p><b>Momentum Die</b> is your persistent combo resource. It can survive between turns and Attack Chains until it is spent or broken by an enemy hit.</p></div>
        </div>
      </div>
      <h3>Momentum Ladder</h3>
      ${table(['^Current die', '^On a build hit', '^Damage spend', 'Stasis option'], F.MOMENTUM_LADDER.map((s) => [
        `<b>d${s.die}</b>`, s.die === 12 ? 'Remain at d12' : `Advance to d${s.die + 2}`, s.stasis ? `+1d${s.die} damage` : '-',
        s.stasis ? `<b>${s.stasis}</b> on ${s.threshold}-${s.die}` : 'Baseline only; cannot be spent.',
      ]))}
      <div class="callout"><b>Spend timing:</b> confirm that the attack hit first. Then choose Damage or Stasis before resolving the Momentum effect. If you spend for Damage, roll the current die and add the result to that hit. If you spend for Stasis, roll the die against its Stasis threshold. Either way, the Momentum Die returns to d4 afterward.</div>
      <p class="fine">Recommended anti-farming rule: one distinct successful attack roll can advance Momentum only one step, regardless of how many targets or damage packets it affects. Save-only area effects do not build Momentum by default.</p>
      <div data-calc="momentum"></div>`,
  },
  {
    id: 'stasis', section: 'lore', kicker: 'Momentum Dice - Stasis', title: 'Stasis: Trade Reliable Damage for a Powerful Opening', page: 27,
    html: `
      <p class="lead">At d6 or higher, a successful hit can cash out the current Momentum Die as a Stasis attempt instead of rolling it for bonus damage. The stronger the die becomes, the stronger - and less likely - the Stasis result becomes.</p>
      ${table(['^Die', '^Success', '^Chance', 'Stasis'], F.MOMENTUM_LADDER.filter((s) => s.stasis).map((s) => [`d${s.die}`, `${s.threshold}-${s.die}`, s.chance, s.stasis]))}
      <div class="stack">
        <div class="note-box"><h3>d6 - Break</h3><p><b>Stasis roll:</b> 5 or 6.</p>
          <p>The hit briefly <b>Breaks the target's posture</b>, creating a sharp opening until the start of its next turn.</p>
          <ul><li>Melee attacks against the target have <b>advantage</b>.</li><li>Every successful melee or ranged hit against it deals an additional <b>1d6 bludgeoning or force damage</b>.</li><li>The bonus applies once to each qualifying hit while Break lasts.</li></ul>
          <p class="small"><b>Use case:</b> cash out early to create a team damage window rather than saving for a rarer high-tier Stasis.</p></div>
        <div class="plain-box"><h3>d8 - Topple</h3><p><b>Stasis roll:</b> 7 or 8.</p>
          <p>The target is forced down to a kneel or similarly compromised stance.</p>
          <ul><li>Melee attacks against it have <b>advantage</b>.</li><li>It <b>cannot Dodge or Parry</b>, but it may still <b>Block</b>.</li><li>At the start of its next turn it regains its feet, but its <b>speed is halved for that turn</b>.</li></ul>
          <p class="small"><b>Use case:</b> Topple is excellent for keeping a slippery defender inside melee pressure while still leaving Block as a defensive answer.</p></div>
        <div class="note-box"><h3>d10 - Daze</h3><p><b>Stasis roll:</b> 9 or 10.</p>
          <p>The target stumbles and loses the stable posture needed for weapon defenses.</p>
          <ul><li>Until the start of its next turn, it <b>cannot Parry or Block</b>.</li><li>It may still <b>Dodge</b>, because it remains mobile enough to evade.</li><li>At the beginning of its next turn, it makes a <b>Wisdom saving throw</b>. On a failure, it <b>cannot attack that turn</b> and its <b>speed is halved</b>.</li></ul></div>
      </div>
      <div class="formula">Stasis Save DC = 8 + Proficiency Bonus + Momentum Ability Modifier</div>
      <p class="small"><b>Momentum Ability Modifier:</b> use the ability that powered the triggering attack - normally STR for heavy melee, DEX for finesse/ranged attacks, or the relevant Invocation Modifier for an Arcane attack. If a feature already provides its own save DC, use that instead.</p>
      <div class="callout"><b>Failed Stasis roll:</b> the triggering attack still deals its normal damage, but the Stasis effect does not occur and no Momentum bonus damage is added. The Momentum Die is still spent and resets to d4.</div>
      <div data-calc="stasis-dc"></div>`,
  },
  {
    id: 'launch-smash', section: 'lore', kicker: 'Momentum Dice - Apex Stasis', title: 'd12 Stasis: Launch, Smash & Combat Integration', page: 28,
    html: `
      <p class="lead">Reaching d12 means the attacker has maintained an extended combo without allowing an enemy to land a damaging hit. A d12 Stasis succeeds only on 11-12. On success, choose Launch or Smash if the triggering attack can physically or magically justify it.</p>
      <div class="grid cols-2">
        <div class="note-box"><h3>Launch</h3><p><b>On Stasis success:</b></p>
          <ul><li>The triggering hit deals an additional <b>2d6 bludgeoning or force damage</b>.</li>
            <li>Launch the target <b>15 feet horizontally</b> in the direction of impact, or <b>15 feet upward</b> if the attack could reasonably lift it.</li>
            <li>If a horizontal Launch drives it into a hard obstacle or comparable hazardous collision - a sturdy wall, boulder, pit edge, and so on - it takes an additional <b>1d12 damage</b>. Other fall or hazard damage may also apply when appropriate.</li>
            <li>If launched upward, it becomes <b>Airborne</b>, opening a brief window for ranged attacks or thrown weapons, then takes <b>1d6 fall damage</b> when it lands.</li></ul></div>
        <div class="plain-box"><h3>Smash</h3><p><b>On Stasis success:</b></p>
          <ul><li>The target is violently driven into the ground as though gravity suddenly multiplied around it.</li>
            <li>It takes an additional <b>3d6 bludgeoning or force damage</b>.</li>
            <li>Its <b>speed becomes 0</b> until it recovers at the start of its next turn.</li>
            <li><b>All attacks against it have advantage</b> until it recovers.</li></ul>
          <div class="callout"><b>Fiction gate:</b> Smash must make sense. A downward hammer blow, overhead strike, gravity-infused attack, slam, or similar vector can Smash. A light stab or ordinary punch to the stomach cannot simply declare Smash without a feature that explains the force.</div></div>
      </div>
      <h3>Airborne Timing</h3>
      <p>To make Launch usable at the table, do not resolve an upward Launch and its fall as the same instant. Keep the target Airborne until the end of the current Attack Chain or until immediate reactions are resolved. Creatures that have a legal reaction, readied attack, or other reactive feature may use eligible ranged or thrown attacks during that window. Then the target falls.</p>
      <h3>How Momentum Dice Interact With the Rest of Combat</h3>
      ${table(['System', 'Interaction'], [
        ['<b>Attack Chains</b>', 'Every landed Chain attack can build the Momentum Die. Spending a Momentum Die does <b>not</b> automatically end the Attack Chain; only the die resets.'],
        ['<b>Guard / Defense</b>', 'Dodge, Parry, or a Block that reduces damage to 0 protects your Momentum Die. If a Block still lets direct enemy damage through, your Momentum Die resets to d4.'],
        ['<b>Counter-attacks</b>', "A landed Counter-attack can both reset the original attacker's Momentum Die and build the countering creature's own die one step."],
        ['<b>Finishers</b>', 'After a Finisher lands, the attacker may spend an available Momentum Die normally. Stasis still requires its die threshold; the Finisher does not guarantee Stasis.'],
        ['<b>Applied Thaumaturgy</b>', 'Arcane Charge Dice and Momentum Dice are separate resources and may affect the same hit if both are legally spent.'],
        ['<b>Ranged / Arcane Attacks</b>', 'Successful attack rolls can build Momentum unless a feature says otherwise. Save-only area effects normally do not build it.'],
      ])}
      <div class="dark-box"><h3>Example: Building Into Topple</h3><p>Kael starts at <b>d4</b>. His first hit advances him to <b>d6</b>. His second hit could spend d6, but he chooses to build and advances to <b>d8</b>. On his next successful hit he chooses <b>Stasis: Topple</b> instead of advancing. He rolls the d8 and gets an <b>8</b>: Topple succeeds, and his Momentum Die returns to d4.</p></div>`,
  },

  // ═══════════════════════════ TABLE REFERENCE ══════════════════════════════
  {
    id: 'chain-cheat-sheet', section: 'ref', kicker: 'Table Reference', title: 'One-Page Attack Chain Cheat Sheet', page: 29,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Core Loop</h3>
          <ol><li>Roll <b>d20 + Attack Bonus</b> vs. AC.</li><li>If it would hit, defender may take it or spend Guard.</li><li>Resolve Dodge, Parry, or Block.</li><li>If damage lands, attacker gains 1 Chain Momentum.</li><li>Continue until stopped, voluntarily ending, or reaching Finisher.</li><li>When an opening appears, an eligible defender may Counter-attack.</li></ol>
          <div class="formula gold">Guard = 2 + Proficiency Bonus</div>
          <div class="formula">Chain Momentum = +1 to later Chain attacks per hit (max +3)</div>
          <h3>Maximum Chain Baseline</h3>
          ${table(['Level', 'Max Chain'], F.CHAIN_TIERS.map((t) => [t.to === 20 ? `${t.from}+` : `${t.from}-${t.to}`, t.max]))}
          <h3>Active Defenses - 1 Guard</h3>
          ${table(['Defense', 'Resolution'], [
            ['<b>Dodge</b>', 'd20 + DEX + PB if DEX-save proficient. Meet attack total. Beat by 5+ = move 5 ft safely.'],
            ['<b>Parry</b>', 'd20 + STR/DEX + PB if weapon proficient. Beat by 5+ = Chain ends.'],
            ['<b>Block</b>', 'Reduce damage. Reduce to 0 = Chain ends.'],
          ])}
        </div>
        <div>
          <h3>Counter-attack - 2 Guard</h3>
          <p>Once per round when an opening appears: miss by 5+, natural 1, Perfect Parry, Perfect Block, or a special feature. Make one immediate attack; if it lands, the original Chain ends and your own Chain may begin.</p>
          <h3>Miss Recovery</h3>
          ${table(['Choice', 'Effect'], [
            ['Recover', 'End Chain; regain 1 Guard.'], ['Press', 'Continue; next attack -2, defense against it +2.'],
            ['Reposition', 'Move 5 ft safely; Chain ends.'], ['Feint', 'Chain ends; target loses 1 Guard.'],
            ['Wild Recovery', 'Spend 1 Guard; reroll. Miss again = Exposed (-2 next defense).'],
          ])}
          <h3>Finisher</h3>
          <p>The final attack of an uninterrupted maximum Chain <b>cannot miss from AC alone</b>. Roll anyway to establish the Attack Total. A legal active defense, counter, forced movement, ally intervention, or special feature can still stop it.</p>
          <h3>Melee Pressure</h3>
          <p>After taking melee damage in a Chain, the defender normally cannot Dodge later melee hits in that Chain unless distance or a feature restores the option.</p>
          <div class="callout"><b>Voluntary stop:</b> after a successful hit, end the Chain for Defensive Posture: +2 to your first active defense before your next turn.</div>
        </div>
      </div>
      <div class="dark-box"><p><b>Remember:</b> Guard is a choice. Do not roll a defense against every hit automatically.</p></div>
      <div class="callout"><b>Momentum Dice are separate:</b> your persistent combo die runs d4 > d6 > d8 > d10 > d12. It survives between Chains until spent or a direct enemy hit deals damage. See <a href="#/codex/momentum-dice">Momentum Dice</a>.</div>`,
  },
  {
    id: 'arcane-cheat-sheet', section: 'ref', kicker: 'Table Reference', title: 'One-Page Arcane Compositry Cheat Sheet', page: 30,
    html: `
      <div class="grid cols-2">
        <div>
          <h3>Build a Composition</h3>
          <p><b>1.</b> Component(s) &nbsp; <b>2.</b> Form &nbsp; <b>3.</b> Potency &nbsp; <b>4.</b> Modifiers &nbsp; <b>5.</b> Resolve</p>
          <div class="formula gold">Mana = Core + Composite + Range + Area + Duration + Effect</div>
          ${table(['Potency', 'Core Mana', 'Damage dice'], potencies.map((p) => [ROMAN[p], F.coreMana(p), F.damageDice(p)]))}
          <p><b>Damage die:</b> d8 focused, d10 risky/heavy, d6 area, d4 persistent.</p>
          <div class="formula">Attack = d20 + PB + IM</div>
          <div class="formula">Save DC = 8 + PB + IM</div>
        </div>
        <div>
          <h3>Common Costs</h3>
          ${table(['Modifier', 'Cost'], [
            ['2 Components', `+${F.compositeCost(2)}`], ['3 Components', `+${F.compositeCost(3)}`],
            ['60 / 120 / 300 ft', costs(F.RANGE_COSTS)], ['10 / 20 / 40 / 60 ft area', costs(F.AREA_COSTS)],
            ['1 min / 10 min / 1 hr', costs(F.DURATION_COSTS)], ['Minor / Strong / Major effect', costs(F.EFFECT_RANKS).split(' / ').slice(0, 3).join(' / ')],
          ])}
          <h3>Interruption</h3>
          <div class="formula">Stability DC = 10 + floor(P/2) + Extra Components + floor(Damage/10)</div>
          <p><b>Fail:</b> Ground, Force Closure, Backwash, or Collapse.</p>
          <h3>Miss Recovery</h3>
          ${chips(['Revector', 'Redirect', 'Collapse', 'Seed', 'Ground'])}
          <h3>Tendril Invocation</h3>
          <p><b>Prime -> Route -> Bridge -> Release</b></p>
          <h3>System Philosophy</h3>
          <p>Use logic, let the environment matter, reward creative Composites, and turn failure into a new decision rather than a dead turn.</p>
        </div>
      </div>
      <div class="dark-box"><p><b>When unsure:</b> choose the closest existing cost, resolve the moment quickly, and tune the exact rule after the session.</p></div>`,
  },
];

export const findChapter = (id) => CHAPTERS.find((c) => c.id === id) || null;
