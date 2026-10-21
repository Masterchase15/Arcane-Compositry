/**
 * components/rich-html.tsx - shows hand-written rules HTML (Codex chapters, the
 * character guide, class features) inside the React app.
 *
 *   <RichHtml html={chapter.html} />
 *
 * - Old-style links (#/codex/x) become normal addresses (/codex/x), and clicks
 *   on them move inside the app instead of reloading the page.
 * - Each <div data-calc="id"></div> in the text becomes a live <Calculator>,
 *   right where it sits (even inside a grid or box in the text).
 *
 * ONLY use this for text that is part of the site (shared/rules, page code) -
 * never for anything a person typed. Show their text with <Paragraphs>.
 */
import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { Calculator } from '@/components/calculator';
import { cn } from '@/lib/utils';

export function RichHtml({ html, className }: { html: string; className?: string }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const markup = useMemo(() => ({ __html: html.replace(/href="#\//g, 'href="/') }), [html]);
  const [slots, setSlots] = useState<HTMLElement[]>([]);

  // After the text is in the page, find the calculator markers to fill.
  useLayoutEffect(() => {
    setSlots(Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-calc]') ?? []));
  }, [markup]);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    if (!a || !href?.startsWith('/') || a.target || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    navigate(href);
  };

  return (
    <>
      <div ref={ref} className={cn('prose-ac', className)} onClick={onClick} dangerouslySetInnerHTML={markup} />
      {slots.map((el, i) => createPortal(<Calculator id={el.dataset.calc!} />, el, `${i}-${el.dataset.calc}`))}
    </>
  );
}
