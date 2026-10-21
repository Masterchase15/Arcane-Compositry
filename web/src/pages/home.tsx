/**
 * pages/home.tsx - the landing page (/).
 */
import { Link, useNavigate } from 'react-router';
import { ArrowRight, BookOpen, Calculator, Compass, Flag, Leaf, ScrollText, Shield, Sparkles, Sword, Users, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlurFade } from '@/components/ui/blur-fade';
import { BorderBeam } from '@/components/ui/border-beam';
import { DotPattern } from '@/components/ui/dot-pattern';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { useSession } from '@/lib/session';

const FEATURES: { to: string; icon: LucideIcon; title: string; text: string }[] = [
  { to: '/craft', icon: Sparkles, title: 'Spellcrafter', text: 'Pick Components, a Form and a Potency. Mana, damage, attack and Save DC are worked out for you.' },
  { to: '/characters', icon: Users, title: 'Character sheets', text: 'The full Arcane Compositry sheet, saved to your account. Track HP, Mana, Guard and Momentum on the fly.' },
  { to: '/campaigns', icon: Flag, title: 'Campaigns', text: "Join your DM's campaign with an invite code, or run your own: party roster, homebrew, notes and an initiative tracker." },
  { to: '/spells/codified', icon: ScrollText, title: 'Codified spells', text: 'Familiar D&D spells with their Mana costs. Filter by class and school, then add them to a character.' },
  { to: '/spells/compositry', icon: Leaf, title: 'Compositry spells', text: 'Compositions invented and codified at this table. The list grows as the campaign does.' },
  { to: '/items', icon: Sword, title: 'Items & Weapons', text: 'Weapons with their Attack Chain traits, armor, gear, magic items and Catalysts. Filter, then add to a character.' },
  { to: '/classes', icon: Shield, title: 'Classes', text: 'Every class and subclass at this table, with features by level and how each plays with Arcane Compositry.' },
  { to: '/codex', icon: BookOpen, title: 'Field Codex', text: 'The complete rules, chapter by chapter, with a live calculator beside every formula.' },
  { to: '/tools', icon: Calculator, title: 'Calculators', text: 'Circuit Stability, Guard, Dodge and Parry, Stasis, Momentum Dice, enemy Compositors and more.' },
  { to: '/guide', icon: Compass, title: 'Character guide', text: 'Step-by-step directions for building a character, from class choice to Catalyst and Tendril.' },
];

export default function Home() {
  const { user } = useSession();
  const navigate = useNavigate();
  return (
    <>
      <section className="relative mb-12 overflow-hidden rounded-xl border border-gold/25 bg-header px-6 py-12 text-header-foreground sm:px-12 sm:py-20">
        {/* A field of faint gold dots, fading out towards the edges, and a light that runs round the border. */}
        <DotPattern width={22} height={22} cr={1.3} className="text-gold/55 [mask-image:radial-gradient(520px_circle_at_75%_40%,white,transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_380px_at_85%_110%,rgb(201_168_81/0.18),transparent_60%)]" aria-hidden />
        <svg className="pointer-events-none absolute -right-4 -bottom-8 size-72 text-gold/30 sm:size-96" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M100 195c0-50-40-60-40-105S100 40 100 5" /><path d="M100 150c20-10 45-12 55-40" /><path d="M82 110c-22-6-40-24-42-50" />
          <path d="M100 60c14-8 32-10 44-30" /><circle cx="155" cy="108" r="7" /><circle cx="40" cy="58" r="7" /><circle cx="145" cy="28" r="7" /><circle cx="100" cy="5" r="4" />
        </svg>
        <BorderBeam size={140} duration={9} colorFrom="#ecd98f" colorTo="#8fc4a6" />
        <div className="relative">
          <BlurFade delay={0.05}><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e5cf85]">Dungeons &amp; Dragons expansion companion</p></BlurFade>
          <BlurFade delay={0.12}><h1 className="mt-4 text-4xl font-bold tracking-tight text-header-foreground sm:text-6xl">Arcane Compositry</h1></BlurFade>
          <BlurFade delay={0.2}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-header-foreground/80 sm:text-xl">
              Choose what the magic is made of, choose what it does, choose how it manifests, choose how hard you push it - then pay the Mana.
            </p>
          </BlurFade>
          <BlurFade delay={0.28} className="mt-9 flex flex-wrap items-center gap-3">
            <ShimmerButton onClick={() => navigate('/craft')} background="#ecd98f" shimmerColor="#ffffff" borderRadius="6px"
              className="h-11 px-5 text-sm font-semibold text-[#1b2a22] [&_svg]:size-4">
              <span className="flex items-center gap-2"><Sparkles />Build a spell</span>
            </ShimmerButton>
            {user
              ? <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-header-foreground hover:bg-white/10 hover:text-header-foreground"><Link to="/characters"><Users />My characters</Link></Button>
              : <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-header-foreground hover:bg-white/10 hover:text-header-foreground"><Link to="/account">Create an account</Link></Button>}
          </BlurFade>
        </div>
      </section>

      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="kicker mb-1.5">{user ? `Welcome back, ${user.displayName}` : 'Everything at the table'}</p>
          <h2 className="text-2xl font-bold tracking-tight">Tools for players and DMs</h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {FEATURES.map((f, i) => (
          <BlurFade key={f.to} delay={0.04 * i} inView className="h-full">
            <Link to={f.to} className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
              <MagicCard className="h-full rounded-lg" gradientSize={240} gradientColor="var(--accent)" gradientOpacity={0.7} gradientFrom="var(--gold)" gradientTo="var(--primary)">
                <div className="flex h-full flex-col p-5">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-muted/60 text-primary"><f.icon className="size-5" /></div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">{f.text}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">Open<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
                </div>
              </MagicCard>
            </Link>
          </BlurFade>
        ))}
      </div>

      <section className="prose-ac surface mt-14 p-6 sm:p-8">
        <h2 className="!mt-0">How a Composition comes together</h2>
        <p className="pull">Component(s) + Form + Potency + Modifiers = Composition</p>
        <div className="formula gold">Final Mana = Core Mana + Composite + Range + Area + Duration + Effect</div>
        <div className="formula">Damage Dice = Potency + 2 + floor(Potency / 3)</div>
        <p><Link to="/codex/quick-start">Read the Quick Start</Link> or go straight to the <Link to="/craft">Spellcrafter</Link>.</p>
      </section>

      <p className="mt-10 text-sm italic text-muted-foreground">
        Arcane Compositry is an unofficial fan-made expansion. Dungeons &amp; Dragons is a trademark of Wizards of the Coast; this site is not affiliated with or endorsed by them.
        Example spell summaries are drawn from the System Reference Document 5.2 (CC-BY-4.0).
      </p>
    </>
  );
}
