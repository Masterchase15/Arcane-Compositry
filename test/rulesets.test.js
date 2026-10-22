/**
 * test/rulesets.test.js - each campaign plays with the rulesets its DM picked
 * (shared/rules/rulesets.js): it only receives entries from those, plus its own
 * homebrew. 5e is always on; Arcane Compositry can be switched off and on.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let server, dm, player, full, plain;

before(async () => {
  server = await startServer();
  dm = await server.signUp('rulesdm');
  full = (await dm.post('/groups', { name: 'Full rules' })).body.group;
  plain = (await dm.post('/groups', { name: 'Plain 5e', rulesets: ['arcane-typo'] })).body.group;
  player = await server.signUp('rulesplayer', { inviteCode: plain.inviteCode });
});
after(() => server.stop());

const F = () => ({ group: full.id });
const P = () => ({ group: plain.id });

test('a new campaign gets every ruleset unless told otherwise; 5e is always on and unknown ids are dropped', async () => {
  assert.deepEqual(full.rulesets, ['dnd5e', 'arcane']);
  assert.deepEqual(plain.rulesets, ['dnd5e']);
  const mine = (await dm.get('/auth/me')).body.groups;
  assert.deepEqual(mine.find((g) => g.id === plain.id).rulesets, ['dnd5e']);
});

test('every entry says which ruleset it belongs to', async () => {
  const spells = (await server.client().get('/spells')).body;
  assert.ok(spells.codified.length && spells.codified.every((s) => s.ruleset === 'dnd5e'));
  assert.ok(spells.compositry.length && spells.compositry.every((s) => s.ruleset === 'arcane'));
  const items = (await server.client().get('/items')).body.items;
  assert.ok(items.filter((i) => i.category === 'Catalyst').every((i) => i.ruleset === 'arcane'), 'Catalysts are Arcane Compositry');
  assert.ok(items.some((i) => i.ruleset === 'dnd5e'));
});

test('a campaign without Arcane Compositry never receives its entries', async () => {
  const spells = (await player.get('/spells', P())).body;
  assert.ok(spells.codified.length > 0, '5e spells still come through');
  assert.equal(spells.compositry.length, 0);
  assert.equal((await player.get('/components', P())).body.components.length, 0);
  assert.ok((await player.get('/items', P())).body.items.every((i) => i.ruleset === 'dnd5e'));
  assert.ok((await dm.get('/components', F())).body.components.length > 0, 'the other campaign still has them');
});

test('homebrew for a ruleset the campaign does not use is refused', async () => {
  const spell = { name: 'Stray Composition', description: 'x', school: 'Evocation', classes: ['Any'], potency: 1, mana: 3 };
  const r = await dm.post('/catalog/compositry', spell, P());
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Arcane Compositry/);
  const item = { name: 'Plain Blade', description: 'Homebrew', category: 'Weapon', rarity: 'Rare' };
  const saved = await dm.post('/catalog/items', item, P());
  assert.equal(saved.status, 200);
  assert.equal(saved.body.entry.ruleset, 'dnd5e');
});

test('only the DM changes the rulesets; switching one back on brings its entries back', async () => {
  assert.equal((await player.put('/group/rulesets', { rulesets: ['dnd5e', 'arcane'] }, P())).status, 403);
  assert.equal((await dm.put('/group/rulesets', { rulesets: 'arcane' }, P())).status, 400);
  const on = await dm.put('/group/rulesets', { rulesets: ['arcane'] }, P());
  assert.deepEqual(on.body.rulesets, ['dnd5e', 'arcane'], '5e stays on');
  assert.ok((await player.get('/components', P())).body.components.length > 0);

  // Homebrew made while it was on is kept while it is off, and comes back with it.
  const spell = { name: 'Table Composition', description: 'x', school: 'Evocation', classes: ['Any'], potency: 1, mana: 3 };
  assert.equal((await dm.post('/catalog/compositry', spell, P())).status, 200);
  await dm.put('/group/rulesets', { rulesets: [] }, P());
  assert.equal((await dm.get('/spells', P())).body.compositry.length, 0);
  await dm.put('/group/rulesets', { rulesets: ['arcane'] }, P());
  assert.ok((await dm.get('/spells', P())).body.compositry.some((s) => s.name === 'Table Composition'));
});

test('editing a ruleset entry keeps its ruleset and marks it as an edit', async () => {
  const catalyst = (await dm.get('/items', F())).body.items.find((i) => i.category === 'Catalyst');
  const r = await dm.put(`/catalog/items/${catalyst.id}`, { ...catalyst, name: `${catalyst.name} (ours)` }, F());
  assert.equal(r.status, 200);
  const edited = (await dm.get('/items', F())).body.items.find((i) => i.id === catalyst.id);
  assert.equal(edited.ruleset, 'arcane');
  assert.equal(edited.origin, 'override');
});

test('a DM can switch on a library expansion and file homebrew under it', async () => {
  const camp = (await dm.post('/groups', { name: 'Xanathar table', rulesets: ['arcane', 'xge'] })).body.group;
  assert.deepEqual(camp.rulesets, ['dnd5e', 'arcane', 'xge']);
  const opts = { group: camp.id };
  const sub = { name: 'Table Scout', className: 'Ranger', description: 'From our copy of the book.', ruleset: 'xge' };
  const saved = await dm.post('/catalog/subclasses', sub, opts);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.entry.ruleset, 'xge');
  const has = async () => (await dm.get('/subclasses', opts)).body.subclasses.some((s) => s.name === 'Table Scout');
  assert.equal(await has(), true);
  await dm.put('/group/rulesets', { rulesets: ['arcane'] }, opts);
  assert.equal(await has(), false, 'hidden while the expansion is off');
  assert.equal((await dm.post('/catalog/subclasses', { ...sub, name: 'Another' }, opts)).status, 400, 'and nothing new can be filed under it');
});
