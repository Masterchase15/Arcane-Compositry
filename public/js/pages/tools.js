/**
 * pages/tools.js - every calculator on one page (#/tools), grouped by topic.
 * The calculators themselves are defined in calculators.js.
 */
import { CALCULATORS, mountAll } from '../calculators.js';
import { esc, icon } from '../ui.js';

export function render(main) {
  const groups = [...new Set(CALCULATORS.map((c) => c.group))];
  main.innerHTML = `
    <div class="page-head">
      <p class="kicker">Every formula, interactive</p>
      <h1>Calculators</h1>
      <hr class="rule">
      <p class="lead">Put in your numbers and the site does the maths from the codex. Building a whole spell? Use the <a href="#/craft">Spellcrafter</a> instead - it combines these.</p>
      <div class="chips">${groups.map((g) => `<a class="chip" href="#/tools" data-jump="${esc(g)}">${esc(g)}</a>`).join('')}</div>
    </div>
    ${groups.map((g) => `
      <section id="group-${esc(g.replace(/\W+/g, '-'))}">
        <h2>${esc(g)}</h2>
        <div class="grid cols-2">${CALCULATORS.filter((c) => c.group === g).map((c) => `<div data-calc="${c.id}"></div>`).join('')}</div>
      </section>`).join('')}
    <p class="muted small">${icon('info')} Dice buttons roll for you, but physical dice at the table are always welcome.</p>`;

  mountAll(main);
  main.addEventListener('click', (e) => {
    const jump = e.target.closest('[data-jump]');
    if (!jump) return;
    e.preventDefault();
    document.getElementById(`group-${jump.dataset.jump.replace(/\W+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth' });
  });
}
