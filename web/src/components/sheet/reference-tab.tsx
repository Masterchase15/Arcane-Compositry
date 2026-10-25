/**
 * components/sheet/reference-tab.tsx - the sheet's "Reference" tab (page 4 of
 * the printed sheet): table rulings plus the two cheat-sheet chapters of the
 * Codex, so editing those chapters updates the sheet too.
 */
import { Link } from 'react-router';
import { BookOpen } from 'lucide-react';
import { findChapter } from '@shared/rules/codex-content.js';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/panel';
import { RichHtml } from '@/components/rich-html';
import { AreaF } from './fields';

export function ReferenceTab() {
  return (
    <div className="space-y-5">
      <Panel title="Custom Table Rulings / Playtest Notes"><AreaF path="misc.tableRulings" label="Custom table rulings / playtest notes" /></Panel>
      {['chain-cheat-sheet', 'arcane-cheat-sheet'].map((cid) => {
        const ch = findChapter(cid);
        return ch && <Panel key={cid} title={ch.title}><RichHtml html={ch.html} /></Panel>;
      })}
      <Button asChild variant="outline"><Link to="/codex/arcane-compositry"><BookOpen />Open the full codex</Link></Button>
    </div>
  );
}
