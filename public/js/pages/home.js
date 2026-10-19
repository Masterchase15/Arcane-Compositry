/**
 * pages/home.js - the landing page (#/).
 */
import { state } from '../api.js';
import { esc, icon } from '../ui.js';

const FEATURES = [
  { href: '#/craft', icon: 'sparkles', title: 'Spellcrafter', text: 'Pick Components, a Form and a Potency. Mana, damage, attack and Save DC are worked out for you.' },
  { href: '#/characters', icon: 'users', title: 'Character sheets', text: 'The full Arcane Compositry sheet, saved to your account. Track HP, Mana, Guard and Momentum on the fly.' },
  { href: '#/campaigns', icon: 'flag', title: 'Campaigns', text: 'Join your DM\'s campaign with an invite code, or run your own: party roster, homebrew, notes and an initiative tracker.' },
  { href: '#/spells/codified', icon: 'scroll', title: 'Codified spells', text: 'Familiar D&D spells with their Mana costs. Filter by class and school, then add them to a character.' },
  { href: '#/spells/compositry', icon: 'leaf', title: 'Compositry spells', text: 'Compositions invented and codified at this table. The list grows as the campaign does.' },
  { href: '#/items', icon: 'sword', title: 'Items & Weapons', text: 'Weapons with their Attack Chain traits, armor, gear, magic items and Catalysts. Filter, then add to a character.' },
  { href: '#/classes', icon: 'shield', title: 'Classes', text: 'Every class and subclass at this table, with features by level and how each plays with Arcane Compositry.' },
  { href: '#/codex', icon: 'book', title: 'Field Codex', text: 'The complete rules, chapter by chapter, with a live calculator beside every formula.' },
  { href: '#/tools', icon: 'calculator', title: 'Calculators', text: 'Circuit Stability, Guard, Dodge and Parry, Stasis, Momentum Dice, enemy Compositors and more.' },
  { href: '#/guide', icon: 'compass', title: 'Character guide', text: 'Step-by-step directions for building a character, from class choice to Catalyst and Tendril.' },
];

export function render(main) {
  const user = state.user;
  main.innerHTML = `
    <section class="hero">
      <svg class="hero-vine" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">
        <path d="M100 195c0-50-40-60-40-105S100 40 100 5"/><path d="M100 150c20-10 45-12 55-40"/><path d="M82 110c-22-6-40-24-42-50"/>
        <path d="M100 60c14-8 32-10 44-30"/><circle cx="155" cy="108" r="7"/><circle cx="40" cy="58" r="7"/><circle cx="145" cy="28" r="7"/><circle cx="100" cy="5" r="4"/>
      </svg>
      <p class="kicker">Dungeons &amp; Dragons expansion companion</p>
      <h1>Arcane Compositry</h1>
      <p>Choose what the magic is made of, choose what it does, choose how it manifests, choose how hard you push it - then pay the Mana.</p>
      <div class="row">
        ${user
          ? `<a class="btn primary" href="#/characters">${icon('users')}My characters</a>`
          : `<a class="btn primary" href="#/account">Create an account</a>`}
        <a class="btn ghost" href="#/craft">${icon('sparkles')}Build a spell</a>
      </div>
    </section>

    ${user ? `<p class="lead">Welcome back, ${esc(user.displayName)}.</p>` : ''}

    <div class="grid cols-auto">
      ${FEATURES.map((f) => `
        <a class="card" href="${f.href}">
          <div class="icon-badge">${icon(f.icon)}</div>
          <h3>${f.title}</h3>
          <p class="muted">${f.text}</p>
        </a>`).join('')}
    </div>

    <section class="stack">
      <h2>How a Composition comes together</h2>
      <p class="pull">Component(s) + Form + Potency + Modifiers = Composition</p>
      <div class="formula gold">Final Mana = Core Mana + Composite + Range + Area + Duration + Effect</div>
      <div class="formula">Damage Dice = Potency + 2 + floor(Potency / 3)</div>
      <p><a href="#/codex/quick-start">Read the Quick Start</a> or go straight to the <a href="#/craft">Spellcrafter</a>.</p>
    </section>

    <p class="fine">Arcane Compositry is an unofficial fan-made expansion. Dungeons &amp; Dragons is a trademark of Wizards of the Coast; this site is not affiliated with or endorsed by them. Example spell summaries are drawn from the System Reference Document 5.2 (CC-BY-4.0).</p>`;
}
