/**
 * pages/home.tsx - the landing page (/).
 */
import { Link } from 'react-router';
import { BookOpen, Calculator, Compass, Flag, Leaf, ScrollText, Shield, Sparkles, Sword, Users, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return (
    <>
      <section className="relative mb-10 overflow-hidden rounded-3xl bg-header bg-[radial-gradient(900px_400px_at_85%_120%,rgb(201_168_81/0.22),transparent_60%),radial-gradient(700px_380px_at_0%_0%,rgb(143_196_166/0.16),transparent_60%)] px-6 py-12 text-header-foreground shadow-xl ring-1 ring-gold/25 sm:px-12 sm:py-16">
        <svg className="pointer-events-none absolute -right-4 -bottom-8 size-72 text-gold/30 sm:size-96" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
          <path d="M100 195c0-50-40-60-40-105S100 40 100 5" /><path d="M100 150c20-10 45-12 55-40" /><path d="M82 110c-22-6-40-24-42-50" />
          <path d="M100 60c14-8 32-10 44-30" /><circle cx="155" cy="108" r="7" /><circle cx="40" cy="58" r="7" /><circle cx="145" cy="28" r="7" /><circle cx="100" cy="5" r="4" />
        </svg>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5cf85]">Dungeons &amp; Dragons expansion companion</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-header-foreground sm:text-6xl">Arcane Compositry</h1>
        <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed opacity-90 sm:text-xl">
          Choose what the magic is made of, choose what it does, choose how it manifests, choose how hard you push it - then pay the Mana.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user
            ? <Button asChild size="lg" variant="secondary"><Link to="/characters"><Users />My characters</Link></Button>
            : <Button asChild size="lg" variant="secondary"><Link to="/account">Create an account</Link></Button>}
          <Button asChild size="lg" variant="ghost" className="text-header-foreground hover:bg-white/10 hover:text-header-foreground">
            <Link to="/craft"><Sparkles />Build a spell</Link>
          </Button>
        </div>
      </section>

      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-2xl font-bold">{user ? `Welcome back, ${user.displayName}` : 'Everything at the table'}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="surface group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground ring-1 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><f.icon className="size-5" /></div>
            <h3 className="text-xl font-semibold group-hover:text-primary">{f.title}</h3>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">{f.text}</p>
          </Link>
        ))}
      </div>

      <section className="prose-ac surface mt-12 p-6 sm:p-8">
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
