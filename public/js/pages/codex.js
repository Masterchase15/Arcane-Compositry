/**
 * pages/codex.js - the rules reference (#/codex and #/codex/<chapter-id>).
 * The text itself lives in rules/codex-content.js.
 */
import { CHAPTERS, SECTIONS, findChapter } from '../rules/codex-content.js';
import { mountAll } from '../calculators.js';
import { esc, icon } from '../ui.js';

export function render(main, { params }) {
  const chapter = findChapter(params[0]);
  const index = CHAPTERS.indexOf(chapter);
  const prev = CHAPTERS[index - 1];
  const next = chapter ? CHAPTERS[index + 1] : CHAPTERS[0];

  const toc = SECTIONS.map(
    (s) => `<h4>${esc(s.title)}</h4>${CHAPTERS.filter((c) => c.section === s.id)
      .map((c) => `<a href="#/codex/${c.id}"${c === chapter ? ' aria-current="true"' : ''}><span>${esc(shortTitle(c))}</span><span class="pg">${c.page}</span></a>`)
      .join('')}`
  ).join('');

  const jump = `<div class="field only-mobile"><label for="jump">Jump to chapter</label>
    <select id="jump"><option value="">Codex overview</option>
      ${SECTIONS.map((s) => `<optgroup label="${esc(s.title)}">${CHAPTERS.filter((c) => c.section === s.id)
        .map((c) => `<option value="${c.id}"${c === chapter ? ' selected' : ''}>${esc(shortTitle(c))}</option>`).join('')}</optgroup>`).join('')}
    </select></div>`;

  main.innerHTML = `
    <div class="sidebar-layout">
      <nav class="toc card sticky only-desktop" aria-label="Codex chapters">
        <a href="#/codex"${chapter ? '' : ' aria-current="true"'}><span>Overview</span></a>
        ${toc}
      </nav>
      <div>
        ${jump}
        <article class="chapter">${chapter ? chapterHtml(chapter) : coverHtml()}</article>
        <div class="row between">
          ${prev ? `<a class="btn" href="#/codex/${prev.id}">${icon('back')}<span>${esc(shortTitle(prev))}</span></a>` : chapter ? `<a class="btn" href="#/codex">${icon('back')}Overview</a>` : '<span></span>'}
          ${next ? `<a class="btn primary" href="#/codex/${next.id}"><span>${esc(shortTitle(next))}</span>${icon('chevron')}</a>` : ''}
        </div>
      </div>
    </div>`;

  mountAll(main);
  main.querySelector('#jump').addEventListener('change', (e) => {
    location.hash = e.target.value ? `#/codex/${e.target.value}` : '#/codex';
  });
}

/** "Quick Start: Build a Spell in 6 Steps" -> "Quick Start" for menus. */
const shortTitle = (c) => c.title.split(':')[0];

function chapterHtml(c) {
  return `
    ${c.num ? `<span class="chapter-num" aria-hidden="true">${c.num}</span>` : ''}
    <p class="kicker">${esc(c.kicker)}</p>
    <h1>${esc(c.title)}</h1>
    <hr class="rule">
    ${c.html}`;
}

function coverHtml() {
  return `
    <p class="kicker">Playtest Reference Manual</p>
    <h1>Arcane Compositry</h1>
    <p class="lead">Player's Field Codex</p>
    <hr class="rule">
    <p class="lead">A fast-reference guide to improvised magic, Tendril circuitry, Catalysts, Applied Thaumaturgy, Counter-Compositry, and the combat systems that make magic an active exchange.</p>
    <div class="callout"><b>Core idea:</b> Choose what the magic is made of, choose what it does, choose how it manifests, choose how hard you push it - then pay the Mana.</div>
    <div class="dark-box"><p class="kicker">Designed for table use - rules first, lore second, quick reference last</p>
      <p>Use Section I while building or resolving a Composition. Use Section II when Tendrils, counters, discoveries, or combat interaction matter.</p></div>
    <div class="note-box"><h4>At the table</h4>
      <p><b>Players:</b> Section I (Quick Start through Circuit Stability) covers Arcane construction; Attack Chains through Launch &amp; Smash explain Attack Chains, active defense, and Momentum Dice. The last two chapters are table references.</p></div>
    ${SECTIONS.map((s) => `
      <h2>${esc(s.title)}</h2>
      <div class="grid cols-auto">
        ${CHAPTERS.filter((c) => c.section === s.id).map((c) => `
          <a class="card" href="#/codex/${c.id}"><p class="kicker">${esc(c.kicker)}</p><h3>${esc(c.title)}</h3><span class="small muted">Codex page ${c.page}</span></a>`).join('')}
      </div>`).join('')}
    <p></p>`;
}
