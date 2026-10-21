/**
 * pages/codex.tsx - the rules reference (/codex and /codex/<chapter-id>).
 * The text itself lives in shared/rules/codex-content.js.
 */
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CHAPTERS, SECTIONS, findChapter } from '@shared/rules/codex-content.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/fields';
import { RichHtml } from '@/components/rich-html';
import { cn } from '@/lib/utils';

interface Chapter { id: string; section: string; kicker: string; title: string; page: number; num?: string; html: string }
const chapters = CHAPTERS as Chapter[];

/** "Quick Start: Build a Spell in 6 Steps" -> "Quick Start" for menus. */
const shortTitle = (c: Chapter) => c.title.split(':')[0];

export default function Codex() {
  const { chapter: chapterId } = useParams();
  const navigate = useNavigate();
  const chapter = findChapter(chapterId) as Chapter | null;
  const index = chapter ? chapters.indexOf(chapter) : -1;
  const prev = chapter ? chapters[index - 1] : undefined;
  const next = chapter ? chapters[index + 1] : chapters[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] gap-0 overflow-y-auto p-2 lg:block">
        <nav aria-label="Codex chapters" className="text-sm">
          <TocLink to="/codex" current={!chapter}>Overview</TocLink>
          {SECTIONS.map((s: any) => (
            <div key={s.id}>
              <h4 className="mx-2.5 mt-4 mb-1 font-sans text-xs font-bold uppercase tracking-widest text-gold-ink">{s.title}</h4>
              {chapters.filter((c) => c.section === s.id).map((c) => (
                <TocLink key={c.id} to={`/codex/${c.id}`} current={c === chapter} page={c.page}>{shortTitle(c)}</TocLink>
              ))}
            </div>
          ))}
        </nav>
      </Card>

      <div className="min-w-0">
        <label className="mb-4 grid gap-1.5 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jump to chapter</span>
          <NativeSelect value={chapter?.id ?? ''} onChange={(e) => navigate(e.target.value ? `/codex/${e.target.value}` : '/codex')}>
            <option value="">Codex overview</option>
            {SECTIONS.map((s: any) => (
              <optgroup key={s.id} label={s.title}>
                {chapters.filter((c) => c.section === s.id).map((c) => <option key={c.id} value={c.id}>{shortTitle(c)}</option>)}
              </optgroup>
            ))}
          </NativeSelect>
        </label>

        <article className="relative">
          {chapter ? <ChapterView c={chapter} /> : <Cover />}
        </article>

        <div className="mt-10 flex flex-wrap justify-between gap-3">
          {prev ? <Button asChild variant="outline"><Link to={`/codex/${prev.id}`}><ArrowLeft />{shortTitle(prev)}</Link></Button>
            : chapter ? <Button asChild variant="outline"><Link to="/codex"><ArrowLeft />Overview</Link></Button> : <span />}
          {next && <Button asChild><Link to={`/codex/${next.id}`}>{shortTitle(next)}<ArrowRight /></Link></Button>}
        </div>
      </div>
    </div>
  );
}

function TocLink({ to, current, page, children }: { to: string; current: boolean; page?: number; children: React.ReactNode }) {
  return (
    <Link to={to} aria-current={current ? 'page' : undefined}
      className={cn('flex justify-between gap-2 rounded-md px-2.5 py-1.5 hover:bg-accent', current && 'bg-accent font-semibold text-accent-foreground')}>
      <span>{children}</span>{page != null && <span className="text-muted-foreground tabular-nums">{page}</span>}
    </Link>
  );
}

function ChapterView({ c }: { c: Chapter }) {
  return (
    <>
      {c.num && <span className="pointer-events-none absolute -top-4 right-0 select-none font-serif text-8xl font-bold text-gold/15" aria-hidden>{c.num}</span>}
      <p className="kicker mb-1">{c.kicker}</p>
      <h1 className="text-3xl font-bold sm:text-4xl">{c.title}</h1>
      <hr className="rule-gold mt-3 mb-6 max-w-md" />
      <RichHtml key={c.id} html={c.html} />
    </>
  );
}

function Cover() {
  return (
    <div className="prose-ac">
      <p className="kicker">Playtest Reference Manual</p>
      <h1 className="text-4xl font-bold">Arcane Compositry</h1>
      <p className="lead">Player's Field Codex</p>
      <hr className="rule-gold max-w-md" />
      <p className="lead">A fast-reference guide to improvised magic, Tendril circuitry, Catalysts, Applied Thaumaturgy, Counter-Compositry, and the combat systems that make magic an active exchange.</p>
      <div className="callout"><b>Core idea:</b> Choose what the magic is made of, choose what it does, choose how it manifests, choose how hard you push it - then pay the Mana.</div>
      <div className="dark-box">
        <p className="kicker">Designed for table use - rules first, lore second, quick reference last</p>
        <p>Use Section I while building or resolving a Composition. Use Section II when Tendrils, counters, discoveries, or combat interaction matter.</p>
      </div>
      <div className="note-box">
        <h4>At the table</h4>
        <p><b>Players:</b> Section I (Quick Start through Circuit Stability) covers Arcane construction; Attack Chains through Launch &amp; Smash explain Attack Chains, active defense, and Momentum Dice. The last two chapters are table references.</p>
      </div>
      {SECTIONS.map((s: any) => (
        <section key={s.id}>
          <h2>{s.title}</h2>
          <div className="grid cols-auto">
            {chapters.filter((c) => c.section === s.id).map((c) => (
              <Link key={c.id} className="card" to={`/codex/${c.id}`}>
                <p className="kicker">{c.kicker}</p><h3>{c.title}</h3><span className="small muted">Codex page {c.page}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
