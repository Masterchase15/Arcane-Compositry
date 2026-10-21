/**
 * pages/home.tsx - the landing page (/): a campaign companion for players and
 * DMs, the Arcane Compositry magic built into it, and how to get started. Signed-in people also
 * get a "pick up where you left off" strip with their characters and campaigns.
 *
 * The words live in the arrays below (STEPS, PLAYER_TOOLS, DM_TOOLS, START, FAQ),
 * so they can be edited without touching the layout.
 */
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight, BookOpen, Calculator, ChevronRight, Compass, Crown, Flag, Flame, Gem, KeyRound, Layers, NotebookPen, ScrollText,
  Shield, Skull, Smartphone, Sparkles, Swords, Sword, UserPlus, Users, Zap, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlurFade } from '@/components/ui/blur-fade';
import { BorderBeam } from '@/components/ui/border-beam';
import { DotPattern } from '@/components/ui/dot-pattern';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useMyCharacters } from '@/components/list';
import { useSession } from '@/lib/session';

/** The four questions every spell answers (the Codex's "Spell Grammar"). */
const STEPS: { icon: LucideIcon; label: string; question: string; text: string; examples: string[] }[] = [
  { icon: Gem, label: 'Components', question: 'What is it made of?', text: 'A Physical Component (a substance) and/or an Aspectual one (a property). Combine them for a Composite.', examples: ['Geo', 'Water', 'Fire', 'Lightning'] },
  { icon: Layers, label: 'Form', question: 'How does it manifest?', text: 'The shape the magic takes when it leaves you.', examples: ['Projectile', 'Burst', 'Wall', 'Armor'] },
  { icon: Zap, label: 'Potency', question: 'How hard do you push?', text: 'Potency I to IX sets the base Mana and how many damage dice it rolls.', examples: ['I', 'III', 'VI', 'IX'] },
  { icon: Flame, label: 'Mana', question: 'What does it cost?', text: 'Range, area, duration and extra effects add to the bill. Pay it and cast.', examples: ['Range', 'Area', 'Duration'] },
];

const PLAYER_TOOLS: { to: string; icon: LucideIcon; title: string; text: string }[] = [
  { to: '/characters', icon: Users, title: 'Character sheets', text: 'A full sheet saved to your account and open on any device. HP, Mana, Guard and Momentum update as you play.' },
  { to: '/campaigns', icon: Flag, title: 'Your campaign', text: "Join with your DM's invite code to see the party and the campaign's own spells, items and classes." },
  { to: '/craft', icon: Sparkles, title: 'Spellcrafter', text: 'Build a spell from parts. Mana, damage dice, attack bonus and Save DC are worked out for you.' },
  { to: '/codex', icon: BookOpen, title: 'Rules library', text: 'The full rules codex, every spell, item and class, and a calculator for every formula.' },
];

const DM_TOOLS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: KeyRound, title: 'Run your campaign', text: 'Invite players with a code, see every sheet in the party, and step in to fix a character when needed.' },
  { icon: Sword, title: 'Homebrew without code', text: 'Add spells, items, classes and Components. Keep them hidden until you choose to reveal them.' },
  { icon: Swords, title: 'Initiative tracker', text: 'Turn order, HP and Guard for every combatant, with your NPC and enemy stat blocks a click away.' },
  { icon: Skull, title: 'NPC and enemy roster', text: 'Your own stat blocks, never shown to players.' },
  { icon: NotebookPen, title: 'Session notes and lore', text: 'Private notebooks, shared with your co-DMs and saved as you type.' },
];

const START: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: UserPlus, title: 'Create an account', text: "Players: use your DM's invite code and you land in their campaign. DMs: sign up and start one." },
  { icon: Compass, title: 'Build your character', text: 'The character guide walks through it step by step, from class to Catalyst.' },
  { icon: Swords, title: 'Play', text: 'Keep the sheet open at the table. Your DM runs combat, notes and homebrew from the campaign hub.' },
];

const FAQ: { icon: LucideIcon; q: string; a: string }[] = [
  { icon: Users, q: 'Can one site hold several campaigns?', a: 'Yes. Each campaign has its own DM, party, homebrew and notes, and one account can play in several.' },
  { icon: BookOpen, q: 'Do I need to know Arcane Compositry first?', a: 'No. Read the two-minute Quick Start, then let the Spellcrafter and the sheet do the maths while you learn.' },
  { icon: Smartphone, q: 'Can I use it at the table on my phone?', a: 'Yes. Every page works on a phone, and you can install the site as an app from your browser menu.' },
];

export default function Home() {
  const { user } = useSession();
  const navigate = useNavigate();
  const cta = 'border-white/20 bg-white/5 text-header-foreground hover:bg-white/10 hover:text-header-foreground';
  return (
    <>
      {/* ── Hero: what this is, in two sentences ─────────────────────────── */}
      <section className="relative mb-10 overflow-hidden rounded-xl border border-gold/25 bg-header px-6 py-12 text-header-foreground sm:px-12 sm:py-20">
        <DotPattern width={22} height={22} cr={1.3} className="text-gold/55 [mask-image:radial-gradient(520px_circle_at_75%_40%,white,transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_380px_at_85%_110%,rgb(201_168_81/0.18),transparent_60%)]" aria-hidden />
        <svg className="pointer-events-none absolute -right-4 -bottom-8 size-72 text-gold/30 sm:size-96" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M100 195c0-50-40-60-40-105S100 40 100 5" /><path d="M100 150c20-10 45-12 55-40" /><path d="M82 110c-22-6-40-24-42-50" />
          <path d="M100 60c14-8 32-10 44-30" /><circle cx="155" cy="108" r="7" /><circle cx="40" cy="58" r="7" /><circle cx="145" cy="28" r="7" /><circle cx="100" cy="5" r="4" />
        </svg>
        <BorderBeam size={140} duration={9} colorFrom="#ecd98f" colorTo="#8fc4a6" />
        <div className="relative max-w-3xl">
          <BlurFade delay={0.05}><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e5cf85]">Dungeons &amp; Dragons campaign companion</p></BlurFade>
          <BlurFade delay={0.12}><h1 className="mt-4 text-4xl font-bold tracking-tight text-header-foreground sm:text-6xl">Everything your campaign needs, in one place.</h1></BlurFade>
          <BlurFade delay={0.2}>
            <p className="mt-6 text-lg leading-relaxed text-header-foreground/80 sm:text-xl">
              Players get character sheets that do the maths, the rules at their fingertips and a place to follow the party.
              DMs get a campaign hub: invites, homebrew, an initiative tracker, an enemy roster and private notes.
              And it all runs on <b className="font-semibold text-header-foreground">Arcane Compositry</b>, a magic system where you build spells instead of picking them from a list.
            </p>
          </BlurFade>
          <BlurFade delay={0.28} className="mt-9 flex flex-wrap items-center gap-3">
            <ShimmerButton onClick={() => navigate(user ? '/campaigns' : '/account')} background="#ecd98f" shimmerColor="#ffffff" borderRadius="6px"
              className="h-11 px-5 text-sm font-semibold text-[#1b2a22] [&_svg]:size-4">
              <span className="flex items-center gap-2">{user ? <><Flag />My campaigns</> : <><UserPlus />Get started</>}</span>
            </ShimmerButton>
            {user
              ? <Button asChild size="lg" variant="outline" className={cta}><Link to="/characters"><Users />My characters</Link></Button>
              : <Button asChild size="lg" variant="outline" className={cta}><Link to="/craft"><Sparkles />Try the Spellcrafter</Link></Button>}
            <Button asChild size="lg" variant="ghost" className="text-header-foreground/80 hover:bg-white/10 hover:text-header-foreground">
              <a href="#features">See what it does<ArrowRight /></a>
            </Button>
          </BlurFade>
        </div>
      </section>

      {user && <ContinueStrip />}

      {/* ── What the site does ───────────────────────────────────────────── */}
      <Section id="features" kicker="What you can do here" title="One home for the players and the DM">
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Users className="size-5 text-primary" />For players</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLAYER_TOOLS.map((f, i) => (
                <BlurFade key={f.to} delay={0.04 * i} inView className="h-full">
                  <Link to={f.to} className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
                    <MagicCard className="h-full rounded-lg" gradientSize={240} gradientColor="var(--accent)" gradientOpacity={0.7} gradientFrom="var(--gold)" gradientTo="var(--primary)">
                      <div className="flex h-full flex-col p-5">
                        <span className="mb-3 flex size-10 items-center justify-center rounded-md border bg-muted/60 text-primary"><f.icon className="size-5" /></span>
                        <h4 className="font-serif text-lg font-semibold">{f.title}</h4>
                        <p className="mt-1.5 flex-1 text-[0.95rem] leading-relaxed text-muted-foreground">{f.text}</p>
                        <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">Open<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
                      </div>
                    </MagicCard>
                  </Link>
                </BlurFade>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Crown className="size-5 text-gold-ink" />For Dungeon Masters</h3>
            <BlurFade inView className="h-[calc(100%-2.5rem)]">
              <div className="surface relative flex h-full flex-col overflow-hidden border-gold-line bg-gold-soft/40 p-5">
                <ul className="flex-1 space-y-4">
                  {DM_TOOLS.map((t) => (
                    <li key={t.title} className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-gold-line bg-card text-gold-ink"><t.icon className="size-4" /></span>
                      <div>
                        <p className="font-semibold">{t.title}</p>
                        <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{t.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-5 self-start"><Link to="/campaigns"><Flag />Start a campaign</Link></Button>
              </div>
            </BlurFade>
          </div>
        </div>
      </Section>

      {/* ── The magic system built in ───────────────────────────────────── */}
      <Section kicker="Built-in magic system" title="Arcane Compositry: every spell answers four questions"
        intro="Instead of memorising a spell list, a Compositor builds each spell from parts. The rules set its power; you decide how it looks, moves and sounds. Familiar D&D spells are here too, with their Mana cost.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <BlurFade key={s.label} delay={0.05 * i} inView className="h-full">
              <div className="surface relative h-full p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-md border bg-muted/60 text-primary"><s.icon className="size-5" /></span>
                  <span className="font-serif text-3xl font-bold text-gold/50 tabular-nums" aria-hidden>{i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold">{s.label}</h3>
                <p className="font-medium text-gold-ink">{s.question}</p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{s.text}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.examples.map((x) => <span key={x} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium">{x}</span>)}
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
        <BlurFade inView>
          <figure className="surface mt-4 flex flex-col gap-4 border-l-4 border-l-gold p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <figcaption className="kicker mb-1.5">Example: Geo + Fire Projectile, Potency III</figcaption>
              <blockquote className="font-serif text-lg italic">"I condense a fist-sized chunk of molten stone and fire it at the enemy."</blockquote>
              <p className="mt-1 text-sm text-muted-foreground">Potency III gives the starting Mana and damage; the Geo + Fire Composite adds a little to the cost.</p>
            </div>
            <Button asChild variant="outline" className="shrink-0"><Link to="/craft">Build it yourself<ArrowRight /></Link></Button>
          </figure>
        </BlurFade>
      </Section>

      {/* ── Getting started ──────────────────────────────────────────────── */}
      {!user && (
        <Section kicker="New here?" title="Get started in three steps">
          <ol className="grid gap-3 md:grid-cols-3">
            {START.map((s, i) => (
              <BlurFade key={s.title} delay={0.05 * i} inView className="h-full">
                <li className="surface flex h-full gap-4 p-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-header font-serif font-bold text-[#ecd98f]">{i + 1}</span>
                  <div>
                    <p className="flex items-center gap-2 font-semibold"><s.icon className="size-4 text-primary" />{s.title}</p>
                    <p className="mt-1 text-[0.95rem] leading-relaxed text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              </BlurFade>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild><Link to="/account"><UserPlus />Create an account</Link></Button>
            <Button asChild variant="outline"><Link to="/guide"><Compass />Read the character guide</Link></Button>
          </div>
        </Section>
      )}

      {/* ── Questions ────────────────────────────────────────────────────── */}
      <Section kicker="Questions" title="Good to know">
        <div className="grid gap-3 md:grid-cols-3">
          {FAQ.map((f) => (
            <div key={f.q} className="surface p-5">
              <p className="flex items-start gap-2 font-semibold"><f.icon className="mt-0.5 size-4 shrink-0 text-primary" />{f.q}</p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link className="flex items-center gap-1 font-medium text-primary hover:underline" to="/tools"><Calculator className="size-4" />All calculators</Link>
          <Link className="flex items-center gap-1 font-medium text-primary hover:underline" to="/items"><Sword className="size-4" />Items &amp; weapons</Link>
          <Link className="flex items-center gap-1 font-medium text-primary hover:underline" to="/classes"><Shield className="size-4" />Classes</Link>
        </div>
      </Section>

      <p className="mt-14 border-t pt-6 text-sm text-muted-foreground">
        Arcane Compositry is an unofficial fan-made expansion. Dungeons &amp; Dragons is a trademark of Wizards of the Coast; this site is not affiliated with or endorsed by them.
        Example spell summaries are drawn from the System Reference Document 5.2 (CC-BY-4.0).
      </p>
    </>
  );
}

function Section({ id, kicker, title, intro, children }: { id?: string; kicker: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-24 first:mt-0">
      <p className="kicker mb-2">{kicker}</p>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {intro && <p className="mt-2 max-w-3xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Signed in: jump back to your latest characters and your campaigns. */
function ContinueStrip() {
  const { user, groups } = useSession();
  const { characters } = useMyCharacters();
  const recent = [...characters].filter((c) => c.ownerId === user?.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  return (
    <section className="mb-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight">Welcome back, {user!.displayName}</h2>
        <Link to="/characters" className="text-sm font-medium text-primary hover:underline">All characters</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {recent.map((c) => (
          <Link key={c.id} to={`/characters/${c.id}`} className="surface group flex items-center gap-3 p-3.5 transition-colors hover:border-primary/60">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-header font-serif font-bold text-[#ecd98f]" aria-hidden>
              {(c.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate font-semibold group-hover:text-primary">{c.name}</b>
              <span className="block truncate text-sm text-muted-foreground">Level {c.level} {c.className || 'Adventurer'}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
        {groups.slice(0, 4 - Math.max(recent.length, 1)).map((g) => (
          <Link key={g.id} to={`/campaign/${g.id}`} className="surface group flex items-center gap-3 border-gold-line bg-gold-soft/40 p-3.5 transition-colors hover:border-gold">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-gold-line bg-card text-gold-ink" aria-hidden>{g.role === 'dm' ? <Crown className="size-5" /> : <Flag className="size-5" />}</span>
            <span className="min-w-0 flex-1">
              <b className="block truncate font-semibold">{g.name}</b>
              <span className="block text-sm text-muted-foreground">{g.role === 'dm' ? 'You are the DM' : 'Campaign'}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
        {!recent.length && (
          <Link to="/characters/new" className="group flex items-center gap-3 rounded-lg border border-dashed p-3.5 transition-colors hover:border-primary/60">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary"><UserPlus className="size-5" /></span>
            <span><b className="block font-semibold group-hover:text-primary">Create your first character</b><span className="text-sm text-muted-foreground">It takes about five minutes</span></span>
          </Link>
        )}
      </div>
    </section>
  );
}
