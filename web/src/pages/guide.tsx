/**
 * pages/guide.tsx - "How to make a character" (/guide). The steps' text is in
 * content/guide.js.
 */
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { guideSteps } from '@/content/guide.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHead } from '@/components/page';
import { RichHtml } from '@/components/rich-html';

export default function Guide() {
  const steps: { title: string; html: string }[] = guideSteps();
  const start = <Button asChild><Link to="/characters/new"><Plus />Start a character</Link></Button>;
  return (
    <>
      <PageHead kicker="Directions" title="How to make a character" actions={start}>
        Ten steps from a blank page to a Compositor ready for the table. It follows standard D&amp;D character creation, then adds the Arcane Compositry pieces.
      </PageHead>
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="sticky top-24 hidden h-fit gap-0 p-2 lg:block">
          <nav aria-label="Guide steps" className="text-sm">
            {steps.map((s, i) => (
              <a key={i} href={`#step-${i}`} className="block rounded-md px-2.5 py-1.5 hover:bg-accent"
                onClick={(e) => { e.preventDefault(); document.getElementById(`step-${i}`)?.scrollIntoView({ behavior: 'smooth' }); }}>
                {i + 1}. {s.title}
              </a>
            ))}
          </nav>
        </Card>
        <div className="min-w-0 space-y-10">
          {steps.map((s, i) => (
            <section key={i} id={`step-${i}`} className="scroll-mt-24">
              <h2 className="mb-3 flex items-center gap-3 text-2xl font-bold">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-header font-serif text-base text-header-foreground">{i + 1}</span>
                {s.title}
              </h2>
              <RichHtml html={s.html} />
            </section>
          ))}
          <div className="rounded-xl bg-header p-5 text-header-foreground">
            <h3 className="text-xl font-bold text-[#ecd98f]">Ready?</h3>
            <p className="my-2">The New character form asks for the basics and fills in every number it can.</p>
            <Button asChild variant="secondary"><Link to="/characters/new"><Plus />Start a character</Link></Button>
          </div>
        </div>
      </div>
    </>
  );
}
