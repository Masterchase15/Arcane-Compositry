/**
 * details.js - the "details" pop-ups and the "pick one" lists.
 *
 * These are shared so a spell, item or Component looks the same whether it is
 * opened from its index page or from inside a character sheet.
 *
 *   spellDetail / itemDetail / componentDetail / subclassDetail / npcDetail
 *                                                build the title + body of a details dialog
 *   openPicker                                   a searchable list to choose one entry from
 */
import { esc, icon, paragraphs, openDialog } from './ui.js';
import { ROMAN, ANY_CLASS, ABILITIES, SKILLS } from './rules/constants.js';
import { codifiedSpellMana, abilityMod, signed, guardMax, arcaneAttackBonus, arcaneSaveDC, coreMana, damageDice } from './rules/formulas.js';

const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10]}`;
const stat = (label, value) => (value ? `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>` : '');
const chipRow = (label, list, cls = '') => (list.length ? `<p class="label">${label}</p><div class="chips">${list.map((t) => `<span class="chip static ${cls}">${esc(t)}</span>`).join('')}</div>` : '');

/** Shown to DM accounts on anything the players cannot see yet. */
export const hiddenBadge = (entry) => (entry.hidden ? ' <span class="badge gold">Hidden from players</span>' : '');

/** @returns {{ title: string, body: string }} ready for openDialog() */
export function spellDetail(listName, s) {
  const isCodified = listName === 'codified';
  const mana = isCodified ? codifiedSpellMana(s.level) : s.mana;
  const stats = isCodified
    ? stat('Casting time', s.castingTime) + stat('Range', s.range) + stat('Components', s.components) +
      stat('Duration', `${s.duration}${s.concentration && !/concentration/i.test(s.duration) ? ' (Concentration)' : ''}`) + stat('Mana', `${mana} (replaces a ${s.level === 0 ? 'cantrip' : `level ${s.level} slot`})`)
    : stat('Components', [...s.physicals, ...s.aspectuals].join(' + ')) + stat('Form', s.form) + stat('Mana', String(mana)) + stat('Range', s.range) +
      stat('Area', s.area) + stat('Duration', s.duration) + stat('Damage / effect', s.damage) + stat('Resolution', s.resolution) + stat('Extra effect', s.effect) +
      stat('Created by', s.creator) + stat('Codification benefit', s.optimization);
  const kicker = isCodified
    ? (s.level === 0 ? `${esc(s.school)} cantrip` : `${ordinal(s.level)}-level ${esc(s.school)}`)
    : `Potency ${ROMAN[s.potency]} ${esc(s.school)} Composition`;
  return {
    title: esc(s.name),
    body: `
      <p class="kicker">${kicker}${s.ritual ? ' · Ritual' : ''}${hiddenBadge(s)}</p>
      <dl class="stat-grid">${stats}</dl>
      ${paragraphs(s.description)}
      ${s.higherLevels ? `<p><b>Using more Mana.</b> ${esc(s.higherLevels)}</p>` : ''}
      ${chipRow('Classes', s.classes.map((c) => (c === ANY_CLASS ? 'Any class' : c)))}
      ${chipRow('Tags', s.tags, 'plain')}
      ${s.source ? `<p class="fine">Source: ${esc(s.source)}</p>` : ''}`,
  };
}

export function itemDetail(it) {
  const bonus = [it.acBonus && `${it.acBonus > 0 ? '+' : ''}${it.acBonus} Armor Class`, it.saveBonus && `${it.saveBonus > 0 ? '+' : ''}${it.saveBonus} saving throws`].filter(Boolean).join(', ');
  return {
    title: esc(it.name),
    body: `
      <p class="kicker">${esc([it.category, it.rarity].join(' · '))}${it.attunement ? ' · Requires attunement' : ''}${hiddenBadge(it)}</p>
      <dl class="stat-grid">
        ${stat('Damage', it.damage)}${stat('Properties', it.properties.join(', '))}${stat('Mastery', it.mastery)}${stat('Armor Class', it.armorClass)}
        ${stat('While in use', bonus)}
        ${stat('Capacity', it.capacity && `${it.capacity} Mana`)}${stat('Throughput', it.throughput && `${it.throughput} Mana per invocation`)}
        ${stat('Cost', it.cost)}${stat('Weight', it.weight)}
      </dl>
      ${it.chainTrait ? `<div class="callout"><b>Attack Chain trait:</b> ${esc(it.chainTrait)}</div>` : ''}
      ${paragraphs(it.description)}
      ${chipRow('Tags', it.tags, 'plain')}
      ${it.source ? `<p class="fine">Source: ${esc(it.source)}</p>` : ''}`,
  };
}

export function componentDetail(c) {
  return {
    title: esc(c.name),
    body: `
      <p class="kicker">${esc(c.kind)} Component - ${c.kind === 'Physical' ? 'what exists?' : 'what property is applied?'}${hiddenBadge(c)}</p>
      ${c.tendrilColor ? `<dl class="stat-grid">${stat('Tendril glow', c.tendrilColor)}</dl>` : ''}
      ${paragraphs(c.description)}
      ${c.interactions ? `<div class="note-box"><h4>Composites &amp; counters</h4>${paragraphs(c.interactions)}</div>` : ''}
      ${chipRow('Tags', c.tags, 'plain')}
      ${c.source ? `<p class="fine">Source: ${esc(c.source)}</p>` : ''}`,
  };
}

/**
 * A subclass: what it is, and what it adds to its parent class level by level.
 * `cls` is the parent class (used for the "adds to" heading and the levels it gains features).
 */
export function subclassDetail(sub, cls) {
  const levels = [...new Set(sub.features.map((f) => f.level))];
  return {
    title: esc(sub.name),
    body: `
      <p class="kicker">${esc(sub.className)} subclass${sub.quick || sub.origin === 'file' ? '' : ' · Custom'}${hiddenBadge(sub)}</p>
      ${paragraphs(sub.description)}
      ${sub.features.length ? `
        <h3>What it adds to the ${esc(sub.className)}</h3>
        <p class="small muted">You choose a subclass at ${esc(sub.className)} level ${levels[0]}. It then grants features at level${levels.length > 1 ? 's' : ''} ${levels.join(', ')}, on top of everything the ${esc(sub.className)} already gets.</p>
        <div class="table-wrap"><table class="grouped">
          <thead><tr><th class="c">Level</th><th>Feature</th><th>What it does</th></tr></thead>
          <tbody>${levels.map((lvl, group) => sub.features.filter((f) => f.level === lvl).map((f, i, all) => `<tr${group % 2 ? '' : ' class="alt"'}>
            ${i === 0 ? `<td class="c" rowspan="${all.length}"><b>${lvl}</b></td>` : ''}
            <td><b>${esc(f.name)}</b></td><td>${esc(f.text) || '<span class="muted">See your rulebook.</span>'}</td></tr>`).join('')).join('')}</tbody>
        </table></div>` : '<p class="muted">No features have been written for this subclass yet.</p>'}
      ${sub.compositry ? `<div class="dark-box"><h4>In Arcane Compositry</h4>${paragraphs(sub.compositry)}</div>` : ''}
      ${cls ? `<dl class="stat-grid">${stat('Parent class', cls.name)}${stat('Hit Die', `d${cls.hitDie}`)}${stat('Invocation ability', ABILITIES.find((a) => a.key === cls.invocation)?.name)}</dl>` : ''}
      ${chipRow('Tags', sub.tags || [], 'plain')}
      ${sub.source ? `<p class="fine">Source: ${esc(sub.source)}</p>` : ''}`,
  };
}

/** An NPC or enemy as a 2024-style stat block, with its Arcane Compositry numbers. DM only. */
export function npcDetail(n) {
  const line = (label, value) => (value ? `<p class="sb-line"><b>${label}</b> ${esc(value)}</p>` : '');
  const block = (title, entries) => (entries.length ? `<h4 class="sb-head">${title}</h4>${entries.map((e) => `<p><b><i>${esc(e.name)}.</i></b> ${esc(e.text)}</p>`).join('')}` : '');
  const guard = n.guard || String(guardMax(n.pb));
  const im = n.invocation ? abilityMod(n.scores[n.invocation]) : null;
  const profile = n.invocation || n.maxPotency || n.physicals.length || n.aspectuals.length || n.signatures;
  return {
    title: esc(n.name),
    body: `
      <div class="statblock">
        <p class="sb-type">${esc([n.size, n.creatureType].filter(Boolean).join(' '))}${n.alignment ? `, ${esc(n.alignment)}` : ''} <span class="badge ${n.kind === 'Enemy' || n.kind === 'Boss' ? 'gold' : 'green'}">${esc(n.kind)}</span></p>
        <div class="sb-top">
          ${line('AC', n.ac)}${line('Initiative', n.initiative)}${line('HP', n.hp)}${line('Speed', n.speed)}
        </div>
        <div class="sb-scores">${ABILITIES.map((a) => `<div><span class="label">${a.short}</span><b>${n.scores[a.key]}</b><span>${signed(abilityMod(n.scores[a.key]))}</span></div>`).join('')}</div>
        ${line('Saving Throws', n.saves)}${line('Skills', n.skills)}
        ${line('Vulnerabilities', n.vulnerabilities)}${line('Resistances', n.resistances)}${line('Immunities', n.immunities)}
        ${line('Gear', n.gear)}${line('Senses', n.senses)}${line('Languages', n.languages)}
        ${line('CR', n.cr && `${n.cr}${/PB/i.test(n.cr) ? '' : `; PB ${signed(n.pb)}`}`)}
        ${block('Traits', n.traits)}${block('Actions', n.actions)}${block('Bonus Actions', n.bonusActions)}${block('Reactions', n.reactions)}${block('Legendary Actions', n.legendary)}
      </div>

      <div class="note-box"><h4>Attack Chains &amp; active defense</h4>
        <dl class="stat-grid">
          ${stat('Guard', `${guard}${n.guard ? '' : ' (2 + PB)'}`)}${stat('Max Chain Length', n.chainLength)}${stat('Proficiency Bonus', signed(n.pb))}
        </dl>
        ${n.momentum ? `<p class="small"><b>Momentum Die:</b> ${esc(n.momentum)}</p>` : ''}
      </div>

      ${profile ? `<div class="dark-box"><h4>Arcane Profile</h4>
        <p>${[
          im !== null && `<b>Invocation:</b> ${ABILITIES.find((a) => a.key === n.invocation).name} (${signed(im)})`,
          im !== null && `<b>Arcane attack:</b> ${signed(arcaneAttackBonus(n.pb, im))}`,
          im !== null && `<b>Save DC:</b> ${arcaneSaveDC(n.pb, im)}`,
          n.mana && `<b>Mana:</b> ${esc(n.mana)}`,
          n.maxPotency ? `<b>Max Potency:</b> ${ROMAN[n.maxPotency]} (${coreMana(n.maxPotency)} Core Mana, ${damageDice(n.maxPotency)} dice)` : '',
          n.temperament && `<b>Temperament:</b> ${esc(n.temperament)}`,
        ].filter(Boolean).join(' &nbsp;·&nbsp; ')}</p>
        ${n.physicals.length ? `<p><b>Known Physicals:</b> ${esc(n.physicals.join(', '))}</p>` : ''}
        ${n.aspectuals.length ? `<p><b>Known Aspects:</b> ${esc(n.aspectuals.join(', '))}</p>` : ''}
        ${n.forms.length ? `<p><b>Known Forms:</b> ${esc(n.forms.join(', '))}</p>` : ''}
        ${n.signatures ? `<p><b>Signature Compositions</b></p>${paragraphs(n.signatures)}` : ''}
        <p class="small">Roll its turn with the <a href="#/tools" data-close>Enemy Compositor roller</a> (codex chapter 14).</p>
      </div>` : ''}

      <h4 class="sb-head">Description &amp; roleplay</h4>
      ${line('Location', n.location)}${line('Faction', n.faction)}
      ${paragraphs(n.description)}
      ${n.notes ? `<div class="callout"><b>DM notes:</b></div>${paragraphs(n.notes)}` : ''}
      ${chipRow('Tags', n.tags, 'plain')}`,
  };
}

/**
 * A player character at a glance, built from their sheet. Used by the DM's Initiative Tracker.
 * @param sheet  the character object (after upgrade())
 * @param d      its automatic numbers (derive(sheet))
 */
export function characterSummary(sheet, d, { id, ownerName } = {}) {
  const who = [`Level ${d.level}`, sheet.identity.species, sheet.identity.className, sheet.identity.subclass && `(${sheet.identity.subclass})`].filter(Boolean).join(' ');
  const trained = Object.values(SKILLS).flat().filter((sk) => Number(sheet.skills[sk]) > 0)
    .map((sk) => `${sk} ${signed(d[`skill_${sk.replace(/\s+/g, '')}`])}${Number(sheet.skills[sk]) > 1 ? ' (E)' : ''}`);
  const inUse = sheet.inventory.filter((i) => i.equipped).map((i) => i.name);
  const rows = (list, cols) => (list.length ? `<ul class="breakdown">${list.map((r) => `<li><span>${esc(cols(r)[0])}</span><span>${esc(cols(r)[1])}</span></li>`).join('')}</ul>` : '<p class="muted small">None recorded.</p>');
  return {
    title: esc(sheet.identity.name || 'Unnamed Character'),
    body: `
      <p class="kicker">${esc(who)}${ownerName ? ` · played by ${esc(ownerName)}` : ''}</p>
      <div class="statblock">
        <div class="sb-top">
          <p class="sb-line"><b>AC</b> ${d.acTotal}</p><p class="sb-line"><b>HP</b> ${esc(sheet.hp.current)} / ${esc(sheet.hp.max)}${num0(sheet.hp.temp) ? ` (+${num0(sheet.hp.temp)} temp)` : ''}</p>
          <p class="sb-line"><b>Initiative</b> ${signed(d.initiative)}</p><p class="sb-line"><b>Speed</b> ${esc(sheet.vitals.speed)}</p>
        </div>
        <div class="sb-scores">${ABILITIES.map((a) => `<div><span class="label">${a.short}</span><b>${esc(sheet.abilities[a.key].score)}</b><span>${signed(d.mods[a.key])} · save ${signed(d[`save_${a.key}`])}</span></div>`).join('')}</div>
        <p class="sb-line"><b>Proficiency Bonus</b> ${signed(d.profBonus)} &nbsp;·&nbsp; <b>Passive Perception</b> ${d.passivePerception}</p>
        ${trained.length ? `<p class="sb-line"><b>Skills</b> ${esc(trained.join(', '))}</p>` : ''}
        ${inUse.length ? `<p class="sb-line"><b>Items in use</b> ${esc(inUse.join(', '))}</p>` : ''}
      </div>
      <div class="note-box"><h4>Attack Chains &amp; active defense</h4>
        <dl class="stat-grid">
          ${stat('Guard', `${num0(sheet.chain.guardCurrent)} of ${d.guardMax}`)}${stat('Max Chain Length', String(d.chainLength))}
          ${stat('Dodge / Parry', `${signed(d.dodge)} / ${signed(d.parry)}`)}${stat('Momentum Die', `d${sheet.momentum.die}`)}${stat('Stasis DC', String(d.stasisDC))}
        </dl></div>
      <div class="dark-box"><h4>Arcane Core</h4>
        <p><b>Mana:</b> ${num0(sheet.arcane.manaCurrent)} of ${d.manaMax} &nbsp;·&nbsp; <b>Arcane attack:</b> ${signed(d.arcaneAttack)} &nbsp;·&nbsp; <b>Save DC:</b> ${d.saveDC} &nbsp;·&nbsp; <b>Max Potency:</b> ${ROMAN[sheet.arcane.maxPotency] || '-'}</p>
        <p><b>Known Physicals:</b> ${esc(sheet.language.physicals.join(', ') || 'none')} &nbsp;·&nbsp; <b>Aspectuals:</b> ${esc(sheet.language.aspectuals.join(', ') || 'none')}</p>
      </div>
      <h4 class="sb-head">Weapons</h4>
      ${rows(sheet.weapons, (w) => [`${w.name}${w.chain ? ` - ${w.chain}` : ''}`, [w.atk, w.damage].filter(Boolean).join(' · ')])}
      <h4 class="sb-head">Spells &amp; Compositions</h4>
      ${rows(sheet.compositions, (r) => [`${r.name}${r.status ? ` (${r.status})` : ''}`, [r.mana !== '' && `${r.mana} Mana`, r.damage].filter(Boolean).join(' · ')])}
      ${id ? `<p><a class="btn sm" href="#/characters/${esc(id)}" data-close>${icon('eye')}Open the full sheet</a></p>` : ''}`,
  };
}
const num0 = (v) => Number(v) || 0;

/**
 * A searchable list in a dialog. The person picks one entry.
 * @param {{ title: string, intro?: string, entries: object[], describe: (e) => string,
 *           emptyText: string, onPick: (e) => (void|Promise<void>) }} options
 *   describe(entry) returns the small grey line under the entry's name.
 */
export function openPicker({ title, intro = '', entries, describe, emptyText, onPick }) {
  const dlg = openDialog({
    title: esc(title),
    body: `
      ${intro ? `<p class="small muted">${esc(intro)}</p>` : ''}
      ${entries.length > 6 ? `<div class="search picker-search">${icon('search')}<input type="search" id="pick-q" placeholder="Search" autocomplete="off" aria-label="Search the list"></div>` : ''}
      <div class="spell-list" id="pick-list">
        ${entries.length ? entries.map((e, i) => `<button type="button" class="spell-row picker-row" data-pick="${i}">
          <span><strong class="spell-name">${esc(e.name)}${hiddenBadge(e)}</strong><span class="spell-meta">${esc(describe(e))}</span></span>
          <span class="spell-mana">${icon('plus')}</span></button>`).join('') : `<div class="empty"><p>${esc(emptyText)}</p></div>`}
      </div>`,
    footer: '<button class="btn" data-close>Close</button>',
  });
  dlg.querySelector('#pick-q')?.addEventListener('input', (e) => {
    const words = e.target.value.toLowerCase().split(/\s+/).filter(Boolean);
    dlg.querySelectorAll('[data-pick]').forEach((row) => { row.hidden = !words.every((w) => row.textContent.toLowerCase().includes(w)); });
  });
  dlg.querySelector('#pick-list').addEventListener('click', async (e) => {
    const row = e.target.closest('[data-pick]');
    if (!row) return;
    dlg.close();
    await onPick(entries[Number(row.dataset.pick)]);
  });
  return dlg;
}
