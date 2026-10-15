/**
 * ════════════════════════════════════════════════════════════════════════════
 *  PHYSICAL & ASPECTUAL COMPONENTS  -  the building blocks of Compositions
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Everything on the Spells > "Physical & Aspectual" tab comes from this file
 *  (plus Components added through the DM page).
 *
 *  A character does NOT know every Component. Each character sheet records the
 *  ones that character has learned; the Spellcrafter only offers those when a
 *  player crafts as that character.
 *
 *  ─── TO ADD A COMPONENT ────────────────────────────────────────────────────
 *  Easiest: DM page > Spells > Physical & Aspectual > New Component.
 *  Or copy this TEMPLATE into the list below:
 *
 *    {
 *      id: 'wind',                    // unique, lowercase, dashes. Optional - made from the name.
 *      name: 'Wind',
 *      kind: 'Aspectual',             // 'Physical' (what exists?) or 'Aspectual' (what property is applied?)
 *      hidden: true,                  // true = only the DM sees it until it is published on the DM page
 *      tendrilColor: 'pale silver',   // optional - the colour its Tendril route glows
 *      description: `What it is and how it behaves.`,
 *      interactions: `Known Composites and counters.`,   // optional
 *      tags: ['movement'],            // optional search keywords
 *    },
 *
 *  The twelve below are the Components named in the Player's Field Codex
 *  (page 4). Their Composite and counter notes come from codex pages 4 and 15;
 *  the short descriptions and Tendril colours are suggestions - edit freely.
 * ════════════════════════════════════════════════════════════════════════════
 */
export default [
  // ─────────────────────────── PHYSICAL - what exists? ─────────────────────
  {
    name: 'Geo', kind: 'Physical', tendrilColor: 'ochre',
    description: `Stone, earth and rock. Conjure it or tear it loose from the ground.

Geo + Projectile: conjure or tear loose a stone and launch it. A missed Geo projectile may remain in the scene as cover.`,
    interactions: `Geo + Fire: molten stone, burning rock, volcanic plating - leaves hot terrain or ignites fragile material.
Counters Lightning: a grounded discharge into terrain. Stone can ground or obstruct.`,
    tags: ['earth', 'stone'], source: 'Codex p.4',
  },
  {
    name: 'Water', kind: 'Physical', tendrilColor: 'deep blue',
    description: `Liquid water: flood, saturate, or shape it.

Water + Field: flood or saturate an area. A missed Water Composition leaves the floor wet.`,
    interactions: `Water + Ice: flash-freezing water, ice growth - slippery or frozen surface.
Water + Lightning: conductive current through liquid - electricity follows wet pathways.
Counters Fire: steam, suppression, obscured sight. Wet floors conduct.`,
    tags: ['liquid'], source: 'Codex p.4',
  },
  {
    name: 'Iron', kind: 'Physical', tendrilColor: 'steel grey',
    description: `Worked and raw metal.

Iron + Armor: reinforce existing armor or sheath the body in conjured metal. A conjured iron spear can be Dodged, Parried or Blocked like a weapon.`,
    interactions: `Counters Lightning: conducted current through metal. Metal can channel electricity.`,
    tags: ['metal'], source: 'Codex p.4',
  },
  {
    name: 'Flora', kind: 'Physical', tendrilColor: 'leaf green',
    description: `Living plants: vines, roots, bark and bloom.`,
    interactions: `Vegetation can burn or grow.`,
    tags: ['plant', 'nature'], source: 'Codex p.4',
  },
  {
    name: 'Fiber', kind: 'Physical', tendrilColor: 'pale straw',
    description: `Thread, cord, cloth and woven material.`,
    tags: ['cloth', 'rope'], source: 'Codex p.4',
  },
  {
    name: 'Sand', kind: 'Physical', tendrilColor: 'tan',
    description: `Loose grit and dust.`,
    interactions: `Sand + Fire: heated sand, glass formation at sufficient power - sharp or brittle terrain.
Counters Wind: blinding airborne grit. Sand can become glass.`,
    tags: ['grit', 'glass'], source: 'Codex p.4',
  },
  {
    name: 'Celestial', kind: 'Physical', tendrilColor: 'white gold',
    description: `Radiant star-stuff. Heated Celestial fragments are the heart of Seraphine's Shattered Sun.`,
    tags: ['radiant'], source: 'Codex p.4',
  },

  // ───────────────── ASPECTUAL - what property is applied? ─────────────────
  {
    name: 'Fire', kind: 'Aspectual', tendrilColor: 'ember orange',
    description: `Heat and flame.

Fire + Burst: a pure magical flare or explosion; no Physical Component required. A pure fire wave can be Dodged, or Blocked only with a magical or otherwise appropriate ward.`,
    interactions: `Geo + Fire: molten stone. Sand + Fire: glass.
Countered by Water (steam, suppression, obscured sight) and by Ice or Water (steam or thermal shock).`,
    tags: ['heat'], source: 'Codex p.4',
  },
  {
    name: 'Ice', kind: 'Aspectual', tendrilColor: 'frost blue',
    description: `Cold and freezing. A missed Ice Composition leaves a slick patch.`,
    interactions: `Water + Ice: flash-freezing water, ice growth - slippery or frozen surface.
Counters Fire: steam or thermal shock.`,
    tags: ['cold'], source: 'Codex p.4',
  },
  {
    name: 'Lightning', kind: 'Aspectual', tendrilColor: 'violet-white',
    description: `Electrical current. Lightning can be Dodged, stopped with a specialized Block, grounded, or met with Counter-Compositry.`,
    interactions: `Water + Lightning: conductive current through liquid.
Countered by Geo (grounded discharge into terrain) and Iron (conducted current through metal).`,
    tags: ['electric'], source: 'Codex p.4',
  },
  {
    name: 'Poison', kind: 'Aspectual', tendrilColor: 'sickly green',
    description: `Toxin and corrosion of the body. Targets usually endure it with a Constitution save.`,
    tags: ['toxin'], source: 'Codex p.4',
  },
  {
    name: 'Volatility', kind: 'Aspectual', tendrilColor: 'flickering red',
    description: `Instability: the property that makes a Composition burst, detonate or expand violently. Geo + Volatility is the mark of a siege caster.`,
    tags: ['explosive'], source: 'Codex p.4',
  },
];
