/**
 * pages/tools.tsx - every calculator on one page (/tools), grouped by topic.
 * The calculators themselves are defined in lib/calculators.js.
 */
import { Link } from 'react-router';
import { Info } from 'lucide-react';
import { CALCULATORS } from '@/lib/calculators.js';
import { Badge } from '@/components/ui/badge';
import { PageHead } from '@/components/page';
import { Calculator } from '@/components/calculator';

const slug = (g: string) => `group-${g.replace(/\W+/g, '-')}`;

export default function Tools() {
  const groups = [...new Set(CALCULATORS.map((c: any) => c.group as string))];
  return (
    <>
      <PageHead kicker="Every formula, interactive" title="Calculators">
        Put in your numbers and the site does the maths from the codex. Building a whole spell? Use
        the <Link className="font-semibold text-primary underline underline-offset-4" to="/craft">Spellcrafter</Link> instead - it combines these.
      </PageHead>
      <div className="mb-6 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g} href={`#${slug(g)}`} onClick={(e) => { e.preventDefault(); document.getElementById(slug(g))?.scrollIntoView({ behavior: 'smooth' }); }}>
            <Badge variant="secondary" className="px-3 py-1 text-sm">{g}</Badge>
          </a>
        ))}
      </div>
      {groups.map((g) => (
        <section key={g} id={slug(g)} className="scroll-mt-24">
          <h2 className="mt-6 text-2xl font-bold">{g}</h2>
          <div className="grid gap-x-5 md:grid-cols-2">
            {CALCULATORS.filter((c: any) => c.group === g).map((c: any) => <Calculator key={c.id} id={c.id} />)}
          </div>
        </section>
      ))}
      <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground"><Info className="size-4" />Dice buttons roll for you, but physical dice at the table are always welcome.</p>
    </>
  );
}
