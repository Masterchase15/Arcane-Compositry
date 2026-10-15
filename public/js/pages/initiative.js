/**
 * pages/initiative.js - the DM's Initiative Tracker (a tab on the DM page).
 *
 * One "encounter" = one tracker. You can keep several going at once (a split
 * party), each with its own name. Everything is saved to the server as you
 * work, so a refresh or a second device picks up where you left off.
 *
 * ─── HOW AN ENCOUNTER IS STORED ────────────────────────────────────────────
 *   enc.name                       the tracker's name
 *   enc.data.round                 current round number
 *   enc.data.firstId               who acted first this round (when they come up again, the round ticks over)
 *   enc.data.combatants            everyone in the fight, IN TURN ORDER. The first living one is "up".
 *     { id, source: 'npc' | 'character' | 'custom', sourceId, name, kind,
 *       initiative, initBonus, hp, hpMax, tempHp, ac, guard, guardMax, mana, manaMax,
 *       conditions, notes, dead, snapshot }
 *   `snapshot` is a copy of an NPC's stat block taken when it was added, so the
 *   Details pop-up works even if the NPC is edited or deleted later.
 *
 * The numbers on a combatant are the tracker's OWN copy. Changing a player
 * character's HP here does not change their sheet (use "Refresh from sheet" to
 * pull their current numbers in).
 *
 * ─── TO ADD SOMETHING TO TRACK ─────────────────────────────────────────────
 *  1. Give it a default in blankCombatant().
 *  2. Add it to FIELDS (shown on each card) or to the details pop-up in openDetails().
 */
import { api } from '../api.js';
import { reloadPage, replaceQuery } from '../nav.js';
import { esc, icon, openDialog, confirmDialog, toast, debounce } from '../ui.js';
import { npcDetail, characterSummary, openPicker } from '../details.js';
import * as F from '../rules/formulas.js';
import { derive, upgrade } from '../rules/character.js';

let currentId = null; // which encounter is showing (kept while you move between DM tabs)

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
/** The first whole number in a piece of text: "52 (8d8 + 16)" -> 52, "+2" -> 2. Blank when there is none. */
const leadingNumber = (text) => { const m = String(text ?? '').match(/-?\d+/); return m ? Number(m[0]) : ''; };

function blankCombatant(extra = {}) {
  return {
    id: newId(), source: 'custom', sourceId: '', name: 'Combatant', kind: 'Enemy',
    initiative: '', initBonus: 0, hp: '', hpMax: '', tempHp: '', ac: '',
    guard: '', guardMax: '', mana: '', manaMax: '', conditions: '', notes: '', dead: false, snapshot: null,
    ...extra,
  };
}

/** Builds a combatant from an entry on the NPCs & Enemies list, carrying its numbers over. */
function fromNpc(n) {
  const hp = leadingNumber(n.hp);
  const guard = Number(n.guard) || F.guardMax(n.pb);
  const mana = leadingNumber(n.mana);
  const typedInit = /[+-]?\d/.test(n.initiative) ? leadingNumber(n.initiative) : '';
  return blankCombatant({
    source: 'npc', sourceId: n.id, name: n.name, kind: n.kind,
    initBonus: typedInit === '' ? F.abilityMod(n.scores.dex) : typedInit,
    hp, hpMax: hp, ac: leadingNumber(n.ac), guard, guardMax: guard, mana, manaMax: mana, snapshot: n,
  });
}

/** The numbers the tracker copies from a player's sheet. Also used by "Refresh from sheet". */
function sheetNumbers(sheet) {
  const d = derive(sheet);
  return {
    name: sheet.identity.name || 'Unnamed Character', initBonus: d.initiative,
    hp: F.num(sheet.hp.current), hpMax: F.num(sheet.hp.max), tempHp: F.num(sheet.hp.temp) || '', ac: d.acTotal,
    guard: F.num(sheet.chain.guardCurrent), guardMax: d.guardMax, mana: F.num(sheet.arcane.manaCurrent), manaMax: d.manaMax,
  };
}

/** The boxes shown on every combatant card. `key` is the combatant property it edits. */
const FIELDS = [
  { key: 'initiative', label: 'Initiative' },
  { key: 'hp', label: 'HP' },
  { key: 'hpMax', label: 'Max HP' },
  { key: 'tempHp', label: 'Temp HP' },
  { key: 'ac', label: 'AC' },
  { key: 'guard', label: 'Guard', of: 'guardMax' },
  { key: 'mana', label: 'Mana', of: 'manaMax', onlyIfSet: true },
];

export async function initiativeTab(body, query) {
  const { encounters } = await api('GET', '/encounters');
  if (query.get('enc')) currentId = query.get('enc');
  const enc = encounters.find((e) => e.id === currentId) || encounters[0] || null;
  currentId = enc?.id || null;

  const tabs = `
    <div class="row between">
      <div class="seg" role="group" aria-label="Encounters">
        ${encounters.map((e) => `<button data-enc="${e.id}" aria-pressed="${e.id === currentId}">${esc(e.name)}${e.data.combatants?.length ? ` (${e.data.combatants.filter((c) => !c.dead).length})` : ''}</button>`).join('')}
      </div>
      <button class="btn primary" id="new-enc">${icon('plus')}New encounter</button>
    </div>`;

  const openEncounter = (id) => { currentId = id; replaceQuery('/dm', { tab: 'initiative', enc: id }); reloadPage(); };
  const createEncounter = async () => {
    try { openEncounter((await api('POST', '/encounters', { name: `Encounter ${encounters.length + 1}` })).encounter.id); }
    catch (err) { toast(err.message, 'error'); }
  };

  if (!enc) {
    body.innerHTML = `${tabs}<div class="empty">${icon('sword')}<h2>No encounters yet</h2>
      <p>Start a tracker, add the enemies and player characters in the fight, and roll initiative.</p>
      <button class="btn primary" id="first-enc">${icon('plus')}Start an encounter</button></div>`;
    body.addEventListener('click', (e) => { if (e.target.closest('#new-enc, #first-enc')) createEncounter(); });
    return undefined;
  }

  const data = { round: 1, firstId: null, combatants: [], ...enc.data };
  data.combatants = data.combatants.map((c) => blankCombatant(c));
  const find = (id) => data.combatants.find((c) => c.id === id);
  const living = () => data.combatants.filter((c) => !c.dead);
  const fallen = () => data.combatants.filter((c) => c.dead);
  /** Keeps the list as: everyone alive (in turn order), then the fallen. */
  const tidy = () => { data.combatants = [...living(), ...fallen()]; };

  body.innerHTML = `${tabs}
    <div class="tracker-bar">
      <div class="field"><label for="enc-name">Encounter name</label><input id="enc-name" value="${esc(enc.name)}" maxlength="80" autocomplete="off"></div>
      <span class="round-pill" id="round" role="status"></span>
      <span class="save-state saved" id="enc-save" role="status">${icon('check')}Saved</span>
    </div>
    <div class="row">
      <button class="btn primary" data-act="add-npc">${icon('plus')}Add enemy / NPC</button>
      <button class="btn primary" data-act="add-pc">${icon('users')}Add player character</button>
      <button class="btn" data-act="add-custom">${icon('plus')}Add custom</button>
      <button class="btn" data-act="roll-all">${icon('dice')}Roll initiative for all</button>
      <button class="btn" data-act="sort">Sort by initiative</button>
    </div>
    <p class="small muted">The combatant at the top is up. Press <b>Turn done</b> and they move to the bottom; Guard refreshes for whoever is up next. Type an initiative yourself if you roll real dice. HP and other numbers here are the tracker's own copy.</p>
    <div class="combatants" id="combatants"></div>
    <div class="row between">
      <button class="btn sm" data-act="reset">${icon('refresh')}Clear initiative &amp; restart rounds</button>
      <button class="btn sm danger" data-act="end">${icon('trash')}End encounter</button>
    </div>`;

  const list = body.querySelector('#combatants');
  const saveState = body.querySelector('#enc-save');

  // ── Saving ──
  const save = debounce(async () => {
    try {
      await api('PUT', `/encounters/${enc.id}`, { name: body.querySelector('#enc-name').value, data });
      saveState.className = 'save-state saved';
      saveState.innerHTML = `${icon('check')}Saved`;
    } catch (err) {
      saveState.className = 'save-state error';
      saveState.textContent = `Not saved - ${err.message}`;
    }
  }, 500);
  const changed = () => { saveState.className = 'save-state'; saveState.textContent = 'Saving...'; save(); };

  // ── Drawing ──
  function card(c, position) {
    const current = position === 0 && !c.dead;
    const low = c.hp !== '' && c.hpMax !== '' && F.num(c.hp) <= F.num(c.hpMax) / 2;
    const box = (f) => {
      if (f.onlyIfSet && c[f.key] === '' && c[f.of] === '') return '';
      const id = `${c.id}-${f.key}`;
      return `<div class="field"><label for="${id}">${f.label}${f.of && c[f.of] !== '' ? ` / ${esc(c[f.of])}` : ''}</label>
        <input id="${id}" data-c="${c.id}" data-f="${f.key}" type="number" inputmode="numeric" value="${esc(c[f.key])}"></div>`;
    };
    return `<article class="combatant${current ? ' current' : ''}${c.dead ? ' dead' : ''}${low && !c.dead ? ' hp-low' : ''}" data-card="${c.id}">
      <div class="c-head">
        <span class="c-pos" aria-hidden="true">${c.dead ? icon('x') : position + 1}</span>
        <span class="c-name">${esc(c.name)}</span>
        <span class="badge ${c.kind === 'Player' || c.kind === 'Ally' ? 'green' : c.kind === 'NPC' ? '' : 'gold'}">${esc(c.kind)}</span>
        ${current ? '<span class="badge gold">Up now</span>' : ''}${c.dead ? '<span class="badge">Dead</span>' : ''}${low && !c.dead ? '<span class="badge">Bloodied</span>' : ''}
        ${current ? `<button class="btn primary" data-act="done" data-id="${c.id}">${icon('check')}Turn done</button>` : ''}
      </div>
      ${c.dead ? '' : `<div class="c-fields">
        ${FIELDS.map(box).join('')}
        <div class="field wide"><label for="${c.id}-amt">Damage / healing</label>
          <div class="stepper"><input id="${c.id}-amt" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Amount of damage or healing for ${esc(c.name)}">
            <button class="btn" data-act="hit" data-id="${c.id}">Hit</button><button class="btn" data-act="heal" data-id="${c.id}">Heal</button></div></div>
        <div class="field wide"><label for="${c.id}-cond">Conditions</label><input id="${c.id}-cond" data-c="${c.id}" data-f="conditions" type="text" value="${esc(c.conditions)}" placeholder="Prone, Dazed..." autocomplete="off"></div>
      </div>`}
      <div class="c-actions">
        <button class="btn sm" data-act="details" data-id="${c.id}">${icon('book')}Details</button>
        ${c.dead
          ? `<button class="btn sm" data-act="revive" data-id="${c.id}">${icon('heart')}Revive</button>`
          : `<button class="btn sm" data-act="roll" data-id="${c.id}" aria-label="Roll initiative for ${esc(c.name)}">${icon('dice')}Roll (${F.signed(c.initBonus)})</button>
             <button class="btn sm" data-act="up" data-id="${c.id}" aria-label="Move ${esc(c.name)} up">Up</button>
             <button class="btn sm" data-act="down" data-id="${c.id}" aria-label="Move ${esc(c.name)} down">Down</button>
             <button class="btn sm" data-act="dead" data-id="${c.id}">${icon('x')}Dead</button>`}
        <span class="spacer"></span>
        <button class="btn sm danger" data-act="remove" data-id="${c.id}">${icon('trash')}Remove</button>
      </div>
    </article>`;
  }

  function draw() {
    tidy();
    body.querySelector('#round').textContent = `Round ${data.round}`;
    list.innerHTML = data.combatants.length
      ? living().map(card).join('') + (fallen().length ? `<h3>Fallen</h3>${fallen().map(card).join('')}` : '')
      : `<div class="empty"><p>Nobody is in this encounter yet. Use the buttons above to add enemies, NPCs and player characters.</p></div>`;
  }

  // ── Turn order ──
  /** Highest initiative first; ties go to the higher bonus. Anyone without a number goes last. */
  function sortByInitiative() {
    const value = (c) => (c.initiative === '' ? -Infinity : F.num(c.initiative));
    const order = living().sort((a, b) => value(b) - value(a) || F.num(b.initBonus) - F.num(a.initBonus));
    data.combatants = [...order, ...fallen()];
    data.firstId = order[0]?.id || null;
  }
  const rollFor = (c) => { c.initiative = F.roll(1, 20).total + F.num(c.initBonus); };
  /** Guard refreshes at the beginning of a creature's turn (codex p.20). */
  const startTurn = (c) => { if (c && c.guardMax !== '') c.guard = c.guardMax; };

  function nextTurn() {
    const order = living();
    if (order.length < 2) { data.round += 1; startTurn(order[0]); return; }
    data.combatants = [...order.slice(1), order[0], ...fallen()];
    const up = living()[0];
    if (!living().some((c) => c.id === data.firstId)) data.firstId = up.id;
    else if (up.id === data.firstId) data.round += 1;
    startTurn(up);
  }

  function setDead(c, dead) {
    if (dead && data.firstId === c.id) {
      // The round was counted from this combatant: hand that job to whoever follows them.
      const order = living();
      data.firstId = order[(order.indexOf(c) + 1) % order.length]?.id || null;
    }
    c.dead = dead;
    if (dead && c.hp !== '') c.hp = 0;
    tidy();
  }

  function move(c, step) {
    const order = living();
    const i = order.indexOf(c);
    const j = i + step;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    data.combatants = [...order, ...fallen()];
  }

  /** "Bramble Wolf" -> "Bramble Wolf 2" when one is already in the fight. */
  function uniqueName(name) {
    const taken = data.combatants.map((c) => c.name);
    if (!taken.includes(name)) return name;
    let n = 2;
    while (taken.includes(`${name} ${n}`)) n++;
    return `${name} ${n}`;
  }
  function add(c) {
    c.name = uniqueName(c.name);
    data.combatants = [...living(), c, ...fallen()];
    if (!data.firstId) data.firstId = living()[0].id;
  }

  // ── Adding from the site's lists ──
  async function addNpc() {
    const { npcs } = await api('GET', '/npcs');
    openPicker({
      title: 'Add an enemy or NPC', entries: npcs,
      intro: 'From your NPCs & Enemies list. You will be asked how many.',
      emptyText: 'Your NPCs & Enemies list is empty. Add some on the NPCs & Enemies tab, or use "Add custom".',
      describe: (n) => [n.kind, n.cr && `CR ${n.cr}`, n.ac && `AC ${n.ac}`, n.hp && `HP ${n.hp}`].filter(Boolean).join(' · '),
      onPick: (n) => {
        const dlg = openDialog({
          title: `Add ${esc(n.name)}`, narrow: true,
          body: `<div class="field"><label for="how-many">How many?</label><input id="how-many" type="number" inputmode="numeric" min="1" max="20" value="1"></div>
                 <label class="check"><input type="checkbox" id="roll-now" checked>Roll their initiative now (d20 ${F.signed(fromNpc(n).initBonus)})</label>`,
          footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="add-go">${icon('plus')}Add</button>`,
        });
        dlg.querySelector('#add-go').addEventListener('click', () => {
          const count = Math.min(20, Math.max(1, Math.round(Number(dlg.querySelector('#how-many').value)) || 1));
          const rollNow = dlg.querySelector('#roll-now').checked;
          for (let i = 0; i < count; i++) { const c = fromNpc(n); if (rollNow) rollFor(c); add(c); }
          if (rollNow) sortByInitiative();
          dlg.close();
          draw(); changed();
          toast(`${count} x ${n.name} added.`);
        });
      },
    });
  }

  async function addCharacter() {
    const { characters } = await api('GET', '/characters?all=1');
    const already = data.combatants.filter((c) => c.source === 'character').map((c) => c.sourceId);
    openPicker({
      title: 'Add a player character', entries: characters.filter((ch) => !already.includes(ch.id)),
      intro: 'Every character at the table. Their current HP, AC, Guard and Mana are copied from their sheet.',
      emptyText: characters.length ? 'Every character is already in this encounter.' : 'No characters have been created yet.',
      describe: (ch) => `Level ${ch.level} ${ch.className || 'Adventurer'} · played by ${ch.ownerName}`,
      onPick: async (ch) => {
        try {
          const sheet = upgrade((await api('GET', `/characters/${ch.id}`)).data);
          add(blankCombatant({ source: 'character', sourceId: ch.id, kind: 'Player', ...sheetNumbers(sheet) }));
          draw(); changed();
          toast(`${ch.name} added. Roll or type their initiative.`);
        } catch (err) { toast(err.message, 'error'); }
      },
    });
  }

  // ── The Details pop-up: tracker numbers you can edit + the full stat block / sheet ──
  async function openDetails(c) {
    let reference = '';
    try {
      if (c.source === 'npc' && c.snapshot) reference = npcDetail(c.snapshot).body;
      if (c.source === 'character') {
        const loaded = await api('GET', `/characters/${c.sourceId}`);
        const sheet = upgrade(loaded.data);
        reference = characterSummary(sheet, derive(sheet), { id: c.sourceId, ownerName: loaded.ownerName }).body;
      }
    } catch { reference = '<p class="muted">Their sheet could not be loaded (it may have been deleted).</p>'; }

    const input = (key, label, type = 'number') => `<div class="field"><label for="d-${key}">${label}</label>
      <input id="d-${key}" data-f="${key}" type="${type}" ${type === 'number' ? 'inputmode="numeric"' : 'autocomplete="off"'} value="${esc(c[key])}"></div>`;
    const dlg = openDialog({
      title: esc(c.name),
      body: `
        <div class="plain-box"><h4>In this encounter</h4>
          <p class="small muted">Change anything here to keep track during the fight. It is saved with the encounter${c.source === 'character' ? ' and does not change the player\'s own sheet' : ''}.</p>
          <div class="fields">
            ${input('name', 'Name', 'text')}${input('initiative', 'Initiative')}${input('initBonus', 'Init. bonus')}
            ${input('hp', 'HP')}${input('hpMax', 'Max HP')}${input('tempHp', 'Temp HP')}${input('ac', 'AC')}
            ${input('guard', 'Guard')}${input('guardMax', 'Guard max')}${input('mana', 'Mana')}${input('manaMax', 'Mana max')}
          </div>
          <div class="fields wide">
            ${input('conditions', 'Conditions', 'text')}
            <div class="field span-all"><label for="d-notes">Notes for this fight</label><textarea id="d-notes" data-f="notes">${esc(c.notes)}</textarea></div>
          </div>
          ${c.source === 'character' ? `<button class="btn sm" id="d-refresh">${icon('refresh')}Refresh from sheet</button>` : ''}
        </div>
        ${reference ? `<h3>${c.source === 'character' ? 'Character sheet' : 'Stat block'}</h3>${reference}` : '<p class="muted small">A custom combatant - there is no stat block to show.</p>'}`,
      footer: '<button class="btn primary" data-close>Back to the tracker</button>',
      onClose: () => draw(),
    });
    dlg.addEventListener('input', (e) => {
      const key = e.target.dataset.f;
      if (!key) return;
      c[key] = e.target.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
      changed();
    });
    dlg.querySelector('#d-refresh')?.addEventListener('click', async () => {
      try {
        const sheet = upgrade((await api('GET', `/characters/${c.sourceId}`)).data);
        Object.assign(c, sheetNumbers(sheet));
        changed();
        dlg.close();
        toast(`${c.name} refreshed from their sheet.`);
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  // ── Events ──
  body.querySelector('#enc-name').addEventListener('input', (e) => {
    const tabBtn = body.querySelector(`[data-enc="${enc.id}"]`);
    if (tabBtn) tabBtn.textContent = e.target.value || 'Encounter';
    changed();
  });

  // Typing in a box on a card.
  list.addEventListener('input', (e) => {
    const c = find(e.target.dataset.c);
    if (!c) return;
    c[e.target.dataset.f] = e.target.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
    changed();
  });
  // Leaving an initiative box re-sorts the list; leaving an HP box updates the "Bloodied" mark.
  list.addEventListener('change', (e) => {
    if (e.target.dataset.f === 'initiative') { sortByInitiative(); draw(); changed(); }
    else if (['hp', 'hpMax'].includes(e.target.dataset.f)) draw();
  });

  body.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.enc) return openEncounter(btn.dataset.enc);
    if (btn.id === 'new-enc') return createEncounter();
    const act = btn.dataset.act;
    if (!act) return;
    const c = find(btn.dataset.id);

    if (act === 'add-npc') return addNpc().catch((err) => toast(err.message, 'error'));
    if (act === 'add-pc') return addCharacter().catch((err) => toast(err.message, 'error'));
    if (act === 'details') return openDetails(c);
    if (act === 'add-custom') add(blankCombatant({ name: 'Combatant' }));
    else if (act === 'roll-all') {
      const order = living();
      if (!order.length) return;
      order.forEach(rollFor);
      sortByInitiative();
      data.round = 1;
      startTurn(living()[0]);
      toast(`Initiative rolled. ${living()[0].name} is up first.`);
    } else if (act === 'sort') sortByInitiative();
    else if (act === 'roll') { rollFor(c); sortByInitiative(); toast(`${c.name} rolled ${c.initiative}.`); }
    else if (act === 'done') nextTurn();
    else if (act === 'up') move(c, -1);
    else if (act === 'down') move(c, 1);
    else if (act === 'dead') { setDead(c, true); toast(`${c.name} is down.`); }
    else if (act === 'revive') { setDead(c, false); if (c.hp === 0) c.hp = 1; }
    else if (act === 'hit' || act === 'heal') {
      const amount = Math.max(0, F.num(btn.closest('.stepper').querySelector('input').value));
      if (!amount) return;
      if (act === 'hit') {
        // Damage comes off Temporary Hit Points first.
        const soaked = Math.min(F.num(c.tempHp), amount);
        c.tempHp = F.num(c.tempHp) - soaked || '';
        c.hp = Math.max(0, F.num(c.hp) - (amount - soaked));
        if (c.hp === 0) toast(`${c.name} is at 0 HP. Press "Dead" if they are out of the fight.`);
      } else {
        c.hp = c.hpMax === '' ? F.num(c.hp) + amount : Math.min(F.num(c.hpMax), F.num(c.hp) + amount);
      }
    } else if (act === 'remove') {
      if (data.firstId === c.id) { const order = living(); data.firstId = order[(order.indexOf(c) + 1) % order.length]?.id || null; }
      data.combatants = data.combatants.filter((x) => x !== c);
      if (data.firstId === c.id) data.firstId = living()[0]?.id || null;
    } else if (act === 'reset') {
      data.combatants.forEach((x) => { x.initiative = ''; });
      data.round = 1;
      data.firstId = living()[0]?.id || null;
    } else if (act === 'end') {
      const ok = await confirmDialog({ title: 'End this encounter?', message: `"${body.querySelector('#enc-name').value}" and everyone in it will be removed from the tracker. NPCs and characters themselves are not affected.`, confirmLabel: 'End encounter', danger: true });
      if (!ok) return;
      try { await api('DELETE', `/encounters/${enc.id}`); currentId = null; replaceQuery('/dm', { tab: 'initiative' }); toast('Encounter ended.'); reloadPage(); }
      catch (err) { toast(err.message, 'error'); }
      return;
    } else return;

    draw();
    changed();
  });

  draw();
  // Leaving the page: send any change that is still waiting.
  return () => save.flush();
}
