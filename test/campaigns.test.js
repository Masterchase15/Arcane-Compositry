/**
 * test/campaigns.test.js - campaigns stay separate: one campaign's DM can never see
 * or change another's notes, members, encounters, NPCs or homebrew.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let server, dmA, dmB, player, campA, campB;

before(async () => {
  server = await startServer();
  dmA = await server.signUp('dma');
  dmB = await server.signUp('dmb');
  campA = (await dmA.post('/groups', { name: 'Campaign A' })).body.group;
  campB = (await dmB.post('/groups', { name: 'Campaign B' })).body.group;
  player = await server.signUp('playerone', { inviteCode: campA.inviteCode });
});
after(() => server.stop());

const A = () => ({ group: campA.id });
const B = () => ({ group: campB.id });

test('whoever creates a campaign is its DM and sees its invite code; players do not', async () => {
  const meA = (await dmA.get('/auth/me')).body.groups;
  assert.equal(meA[0].role, 'dm');
  assert.ok(meA[0].inviteCode);
  const meP = (await player.get('/auth/me')).body.groups;
  assert.equal(meP[0].role, 'player');
  assert.equal(meP[0].inviteCode, undefined);
});

test("a DM cannot use another campaign's DM tools", async () => {
  for (const path of ['/notes?kind=lore', '/group/members', '/encounters', '/npcs', '/group/characters']) {
    const r = await dmB.get(path, A());
    assert.equal(r.status, 403, `${path} must be refused`);
  }
  assert.equal((await dmB.post('/notes', { kind: 'lore', title: 'Sneaky' }, A())).status, 403);
  assert.equal((await dmB.post('/group/invite-code', {}, A())).status, 403);
});

test('players cannot use their own campaign\'s DM tools', async () => {
  assert.equal((await player.get('/notes?kind=session', A())).status, 403);
  assert.equal((await player.get('/group/members', A())).status, 403);
  assert.equal((await player.post('/catalog/items', { name: 'X' }, A())).status, 403);
  assert.equal((await player.get('/group/characters', A())).status, 200, 'but they can see the party');
});

test('notes belong to one campaign, even when addressed by id', async () => {
  const note = (await dmA.post('/notes', { kind: 'lore', title: 'Secret of A' }, A())).body.note;
  const listB = (await dmB.get('/notes?kind=lore', B())).body.notes;
  assert.equal(listB.length, 0);
  assert.equal((await dmB.put(`/notes/${note.id}`, { title: 'Hijacked' }, B())).status, 404);
  assert.equal((await dmB.del(`/notes/${note.id}`, B())).status, 404);
});

test('homebrew: hidden entries only for the DM, and never in other campaigns or the standard lists', async () => {
  const item = { name: 'Blade of A', description: 'Homebrew', category: 'Weapon', rarity: 'Rare', hidden: true };
  assert.equal((await dmA.post('/catalog/items', item, A())).status, 200);
  const has = (r) => r.body.items.some((i) => i.name === 'Blade of A');
  assert.equal(has(await dmA.get('/items', A())), true, 'the DM sees it');
  assert.equal(has(await player.get('/items', A())), false, 'players do not while it is hidden');
  assert.equal(has(await dmB.get('/items', B())), false, 'other campaigns never do');
  assert.equal(has(await server.client().get('/items')), false, 'nor the standard list');
  assert.equal(has(await dmB.get('/items', A())), false, 'asking for a campaign you are not in gives the standard list');

  await dmA.put('/catalog/items/blade-of-a/visibility', { hidden: false }, A());
  assert.equal(has(await player.get('/items', A())), true, 'published: players see it');
});

test('joining with a code (any case); a wrong code fails', async () => {
  const joiner = await server.signUp('joiner');
  assert.equal((await joiner.post('/groups/join', { code: 'NOTACODE' })).status, 404);
  const r = await joiner.post('/groups/join', { code: campB.inviteCode.toLowerCase() });
  assert.equal(r.body.group.role, 'player');
  // A new code stops the old one working, but members stay.
  await dmB.post('/group/invite-code', {}, B());
  assert.equal((await server.signUp('latecomer').then((c) => c.post('/groups/join', { code: campB.inviteCode }))).status, 404);
  assert.equal((await joiner.get('/group/characters', B())).status, 200);
});

test('the only DM cannot leave while others remain; the last member leaving deletes it', async () => {
  const dm = await server.signUp('lonelydm');
  const camp = (await dm.post('/groups', { name: 'Short-lived' })).body.group;
  const p = await server.signUp('shortplayer', { inviteCode: camp.inviteCode });
  assert.equal((await dm.del(`/groups/${camp.id}/membership`)).status, 400);
  assert.equal((await p.del(`/groups/${camp.id}/membership`)).body.deleted, false);
  assert.equal((await dm.del(`/groups/${camp.id}/membership`)).body.deleted, true);
  assert.equal((await dm.get('/auth/me')).body.groups.length, 0);
});

test('a DM can promote a member, but not change their own role', async () => {
  const members = (await dmA.get('/group/members', A())).body.members;
  const p = members.find((m) => m.username === 'playerone');
  assert.equal((await dmA.put(`/group/members/${dmA.user.id}/role`, { role: 'player' }, A())).status, 400);
  assert.equal((await dmA.put(`/group/members/${p.id}/role`, { role: 'dm' }, A())).status, 200);
  assert.equal((await player.get('/notes?kind=lore', A())).status, 200, 'now a DM there');
  await dmA.put(`/group/members/${p.id}/role`, { role: 'player' }, A());
});

test('a DM runs encounters, renames the campaign and reads NPCs - only in their own campaign', async () => {
  const enc = (await dmA.post('/encounters', { name: 'Goblin ambush' }, A())).body.encounter;
  assert.equal(enc.name, 'Goblin ambush');
  assert.equal((await dmA.put(`/encounters/${enc.id}`, { name: 'Round 2', data: { round: 2, combatants: [] } }, A())).status, 200);
  const list = (await dmA.get('/encounters', A())).body.encounters;
  assert.equal(list[0].data.round, 2);
  assert.equal((await dmB.del(`/encounters/${enc.id}`, B())).status, 404, 'another campaign cannot end it');
  assert.equal((await dmA.del(`/encounters/${enc.id}`, A())).status, 200);

  assert.equal((await dmA.put('/group', { name: 'Campaign A, renamed' }, A())).body.name, 'Campaign A, renamed');
  assert.ok(Array.isArray((await dmA.get('/npcs', A())).body.npcs));
  assert.equal((await player.get('/npcs', A())).status, 403, 'NPCs are never sent to players');
});
