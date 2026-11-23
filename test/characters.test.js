/**
 * test/characters.test.js - characters belong to their owner, may be in one
 * campaign, and only that campaign's DMs can open someone else's.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let server, dm, owner, stranger, camp;

before(async () => {
  server = await startServer();
  dm = await server.signUp('chardm');
  camp = (await dm.post('/groups', { name: 'The Party' })).body.group;
  owner = await server.signUp('charowner', { inviteCode: camp.inviteCode });
  stranger = await server.signUp('stranger');
});
after(() => server.stop());

const sheet = (name) => ({ data: { identity: { name, className: 'Wizard', level: 2 } } });

test('a character needs no campaign, and only its owner can open it then', async () => {
  const { id } = (await owner.post('/characters', sheet('Solo'))).body;
  const mine = (await owner.get('/characters')).body.characters;
  assert.equal(mine.find((c) => c.id === id).groupId, null);
  assert.equal((await owner.get(`/characters/${id}`)).status, 200);
  assert.equal((await dm.get(`/characters/${id}`)).status, 404, 'not in the campaign: the DM cannot open it');
  assert.equal((await stranger.get(`/characters/${id}`)).status, 404);
});

test('moving it into the campaign lets that DM open and edit it, and lists it in the party', async () => {
  const { id } = (await owner.post('/characters', sheet('Joiner'))).body;
  assert.equal((await owner.put(`/characters/${id}/campaign`, { groupId: camp.id })).status, 200);
  const party = (await owner.get('/group/characters', { group: camp.id })).body.characters;
  assert.ok(party.some((c) => c.id === id));
  assert.equal((await dm.get(`/characters/${id}`)).body.groupName, 'The Party');
  assert.equal((await dm.put(`/characters/${id}`, sheet('Joiner (edited by DM)'))).status, 200);
  assert.equal((await stranger.get(`/characters/${id}`)).status, 404, 'other people still cannot');
});

test('only the owner moves a character, and only into their own campaigns', async () => {
  const { id } = (await owner.post('/characters', sheet('Mover'), { group: camp.id })).body;
  const strangerCamp = (await stranger.post('/groups', { name: 'Elsewhere' })).body.group;
  assert.equal((await owner.put(`/characters/${id}/campaign`, { groupId: strangerCamp.id })).status, 403);
  assert.equal((await dm.put(`/characters/${id}/campaign`, { groupId: null })).status, 404, 'the DM cannot take it out');
});

test('a new character can go straight into a campaign (only one you are in)', async () => {
  const inCamp = (await owner.post('/characters', { ...sheet('Direct'), groupId: camp.id })).body.id;
  const notMine = (await stranger.post('/characters', { ...sheet('Sneak'), groupId: camp.id })).body.id;
  const party = (await dm.get('/group/characters', { group: camp.id })).body.characters.map((c) => c.id);
  assert.ok(party.includes(inCamp));
  assert.ok(!party.includes(notMine), 'joining a campaign you are not in is ignored');
});

test('leaving or being removed takes your characters out of the campaign', async () => {
  const leaver = await server.signUp('leaver', { inviteCode: camp.inviteCode });
  const { id } = (await leaver.post('/characters', { ...sheet('Leaving'), groupId: camp.id })).body;
  await dm.del(`/group/members/${leaver.user.id}`, { group: camp.id });
  const mine = (await leaver.get('/characters')).body.characters;
  assert.equal(mine.find((c) => c.id === id).groupId, null);
  assert.equal((await dm.get(`/characters/${id}`)).status, 404);
});

test('character data must be an object; deleting is owner-or-DM only', async () => {
  assert.equal((await owner.post('/characters', { data: [] })).status, 400);
  const { id } = (await owner.post('/characters', sheet('Doomed'))).body;
  assert.equal((await stranger.del(`/characters/${id}`)).status, 404);
  assert.equal((await owner.del(`/characters/${id}`)).status, 200);
  assert.equal((await owner.get(`/characters/${id}`)).status, 404);
});

test('hit points are shared live between the sheet and the DM tracker', async () => {
  const data = { identity: { name: 'Hurt', className: 'Fighter', level: 3 }, hp: { current: 30, max: 30, temp: 0 }, notes: 'a' };
  const { id } = (await owner.post('/characters', { data, groupId: camp.id })).body;
  const G = { group: camp.id };

  // The DM lands a hit from the tracker: only HP changes.
  const hit = await dm.put(`/characters/${id}/hp`, { current: 18, temp: 0 }, G);
  assert.equal(hit.status, 200);
  assert.deepEqual(hit.body.hp, { current: 18, max: 30, temp: 0 });
  assert.equal((await owner.get(`/characters/${id}/hp`)).body.hp.current, 18, 'the open sheet sees it');
  assert.equal((await owner.get(`/characters/${id}`)).body.data.notes, 'a', 'the rest of the sheet is untouched');
  assert.equal((await stranger.put(`/characters/${id}/hp`, { current: 1 })).status, 404);
  assert.equal((await dm.put(`/characters/${id}/hp`, { current: -4 }, G)).status, 400);

  // The player saves another field with a sheet that still shows 30 HP: the DM's hit is kept.
  const stale = { ...data, notes: 'b' };
  const saved = await owner.put(`/characters/${id}`, { data: stale, hpBase: { current: 30, max: 30, temp: 0 } });
  assert.equal(saved.body.hp.current, 18);
  // The player heals themselves: their own change wins.
  const healed = await owner.put(`/characters/${id}`, { data: { ...stale, hp: { current: 25, max: 30, temp: 0 } }, hpBase: { current: 18, max: 30, temp: 0 } });
  assert.equal(healed.body.hp.current, 25);

  // The tracker reads every party character's HP at once (DM only).
  const party = (await dm.get('/group/characters/hp', G)).body.characters;
  assert.deepEqual(party.find((c) => c.id === id).hp, { current: 25, max: 30, temp: 0 });
  assert.equal((await owner.get('/group/characters/hp', G)).status, 403);
});

test("a summon's hit points on the sheet are shared live with the DM tracker", async () => {
  const owl = { id: 'row-1', summonId: 'owl', name: 'Hoot', category: 'Familiar', hp: 1, hpMax: 1, tempHp: '', snapshot: { name: 'Owl' } };
  const wolf = { id: 'row-2', summonId: 'wolf', name: 'Fang', category: 'Companion', level: 3, hp: 22, hpMax: 22, tempHp: '', snapshot: { name: 'Wolf' } };
  const data = { identity: { name: 'Ranger' }, hp: { current: 20, max: 20, temp: 0 }, summons: [owl, wolf] };
  const { id } = (await owner.post('/characters', { data, groupId: camp.id })).body;
  const G = { group: camp.id };

  // The tracker lists the party's summons and their HP.
  const row = (await dm.get('/group/characters/hp', G)).body.characters.find((c) => c.id === id);
  assert.deepEqual(row.summons.map((s) => s.name), ['Hoot', 'Fang']);
  assert.equal(row.vitals['summon.row-2.hp'], 22);

  // The DM hits Fang: only Fang's HP changes; the open sheet sees it.
  const hit = await dm.put(`/characters/${id}/summons/row-2/hp`, { hp: 9 }, G);
  assert.equal(hit.status, 200);
  assert.equal(hit.body.vitals['summon.row-2.hp'], 9);
  const seen = (await owner.get(`/characters/${id}/hp`)).body.vitals;
  assert.equal(seen['summon.row-2.hp'], 9);
  assert.equal(seen['summon.row-1.hp'], 1);
  assert.equal((await dm.put(`/characters/${id}/summons/nope/hp`, { hp: 1 }, G)).status, 404);
  assert.equal((await stranger.put(`/characters/${id}/summons/row-2/hp`, { hp: 1 })).status, 404);
  assert.equal((await dm.put(`/characters/${id}/summons/row-2/hp`, { hp: -3 }, G)).status, 400);

  // The player saves with a sheet that still shows 22: the DM's hit is kept...
  const base = { 'hp.current': 20, 'hp.max': 20, 'hp.temp': 0, 'summon.row-1.hp': 1, 'summon.row-1.hpMax': 1, 'summon.row-1.tempHp': 0, 'summon.row-2.hp': 22, 'summon.row-2.hpMax': 22, 'summon.row-2.tempHp': 0 };
  const saved = await owner.put(`/characters/${id}`, { data: { ...data, identity: { name: 'Ranger 2' } }, vitalsBase: base });
  assert.equal(saved.body.vitals['summon.row-2.hp'], 9);
  // ...and their own heal wins.
  const healed = await owner.put(`/characters/${id}`, { data: { ...data, summons: [owl, { ...wolf, hp: 15 }] }, vitalsBase: { ...base, 'summon.row-2.hp': 9 } });
  assert.equal(healed.body.vitals['summon.row-2.hp'], 15);
});
