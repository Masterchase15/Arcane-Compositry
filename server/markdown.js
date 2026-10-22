/**
 * server/markdown.js - turns the rulebook Markdown in data/books/ into safe HTML.
 *
 * Small on purpose: it understands what the rulebooks use and nothing more.
 *   paragraphs (every line is its own paragraph), **bold**, *italic*,
 *   ***bold italic***, - lists (nested by indent), 1. numbered lists,
 *   | tables |, --- / ___ rules, > blockquotes, ##### small headings.
 *
 * Boxes: a blockquote that starts with a heading is a box - a monster stat
 * block when it has "Armor Class" in it, otherwise a sidebar. A quote inside a
 * quote (>>) is an epigraph. Other blockquotes are plain quotes.
 *
 * Dropped: images (the books' image files are not on the site), links (their
 * text is kept), raw HTML tags (their text is kept) and the 5etools
 * {@tag text|source} markers (their text is kept).
 *
 * Headings # to #### are NOT handled here: server/books.js turns those into
 * chapters and sections and calls renderBlocks() for the text under each one.
 *
 * Links: a list item, or the first cell of a table row, whose whole text is the
 * name of a heading in the book (a list of spells, conditions, backgrounds...)
 * becomes a link to that heading - when most of the list (or column) does, so
 * a lone "Slow" in a travel-pace table is not linked to the Slow weapon
 * mastery. books.js finds the headings through ctx.xref().
 */

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Ids for headings: "Aboleth Lairs" -> "aboleth-lairs". */
export const slugify = (s) =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'section';

/** Makes a function that hands out ids, adding -2, -3... when one is already taken. */
export function idMaker(prefix = '') {
  const used = new Map();
  return (text) => {
    const base = prefix + slugify(text);
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

/** Strips what the site does not show: images, links, raw HTML, {@tags}. Leaves ** and * in place. */
export function cleanInline(s) {
  return String(s)
    .replace(/!\[(?:[^\]\[]|\[[^\]]*\])*\]\([^)]*\)/g, '')
    .replace(/\{@\w+\s([^{}]*)\}/g, (_, body) => {
      const parts = body.split('|');
      return parts[2] || parts[0];
    })
    .replace(/\{@\w+\}/g, '')
    // 5etools dice prompts: "d100 + #$prompt_number:title=Enter Lifestyle Modifier$#" -> "d100 + Lifestyle Modifier"
    .replace(/#\$prompt_\w+:title=(?:Enter )?([^$]*)\$#/g, '$1')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\\([|*_#>[\]-])/g, '$1');
}

/** Plain text, for headings in the contents and for search. */
export function plain(s) {
  return cleanInline(s).replace(/\*+|(^|\W)_+|_+(?=\W|$)/g, '$1').replace(/\s+/g, ' ').trim();
}

/** One line of Markdown to HTML (text is escaped first, so nothing in a book can run as code). */
export function inline(s) {
  return esc(cleanInline(s).trim())
    .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])/g, '$1<i>$2</i>')
    .replace(/(^|[^\w])_(?=\S)(.+?)(?<=\S)_(?!\w)/g, '$1<i>$2</i>');
}

const HR = /^\s*(?:_{3,}|-{3,}|\*{3,})\s*$/;
const LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const QUOTE = /^\s*>/;
const TABLE = /^\s*\|/;
const SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const ABILITY_HEADS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * Renders lines of Markdown (no # - #### chapter headings) to HTML.
 * ctx.id(text) gives ids to the names on stat blocks so "On this page" can list them.
 */
export function renderBlocks(lines, ctx = {}) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (QUOTE.test(line)) {
      const inner = [];
      while (i < lines.length && QUOTE.test(lines[i])) inner.push(lines[i++].replace(/^\s*> ?/, ''));
      out.push(renderQuote(inner, ctx));
      continue;
    }
    if (TABLE.test(line)) {
      const rows = [];
      while (i < lines.length && TABLE.test(lines[i])) rows.push(lines[i++]);
      out.push(renderTable(rows, ctx));
      continue;
    }
    if (HR.test(line)) { out.push('<hr>'); i++; continue; }
    const h = HEADING.exec(line);
    if (h) {
      const text = inline(h[2]);
      if (text) {
        const level = ctx.inBox ? (h[1].length <= 3 ? 4 : 5) : 5;
        out.push(`<h${level} class="minor">${text}</h${level}>`);
      }
      i++;
      continue;
    }
    if (LIST.test(line)) {
      const items = [];
      while (i < lines.length) {
        const m = LIST.exec(lines[i]);
        if (m && !HR.test(lines[i])) {
          items.push({ indent: m[1].replace(/\t/g, '    ').length, ordered: /\d/.test(m[2]), text: m[3] });
          i++;
        } else if (!lines[i].trim() && LIST.test(lines[i + 1] || '') && !HR.test(lines[i + 1])) {
          i++; // a blank line between two items keeps the list going
        } else break;
      }
      out.push(renderList(items, ctx));
      continue;
    }
    const text = inline(line);
    if (text) out.push(`<p>${text}</p>`);
    i++;
  }
  return out.join('\n');
}

/** A blockquote: stat block, sidebar box, epigraph or plain quote. */
function renderQuote(inner, ctx) {
  const first = inner.find((l) => l.trim()) || '';
  const heading = HEADING.exec(first);
  if (heading) {
    const isStatblock = inner.some((l) => /\bArmor Class\b/.test(l));
    const title = inline(heading[2]);
    const rest = inner.slice(inner.indexOf(first) + 1);
    const id = isStatblock && ctx.id ? ` id="${ctx.id(plain(heading[2]))}"` : '';
    const cls = isStatblock ? 'statblock book-statblock' : 'inset';
    return `<div class="${cls}"><h4 class="box-title"${id}>${title}</h4>${renderBlocks(rest, { ...ctx, inBox: true })}</div>`;
  }
  if (QUOTE.test(first)) return `<blockquote class="epigraph">${renderBlocks(inner.map((l) => l.replace(/^\s*> ?/, '')), ctx)}</blockquote>`;
  return `<blockquote>${renderBlocks(inner, ctx)}</blockquote>`;
}

function splitRow(row) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').replace(/\\\|/g, '\u0000').split('|').map((c) => c.replace(/\u0000/g, '|').trim());
}

/** The heading each text names (or null), kept only when at least half of them name one. */
function xrefs(texts, ctx) {
  const hrefs = texts.map((t) => (ctx.xref ? ctx.xref(plain(t)) : null));
  return hrefs.filter(Boolean).length * 2 >= texts.length ? hrefs : texts.map(() => null);
}
const linked = (html, href) => (href ? `<a class="xref" href="${esc(href)}">${html}</a>` : html);

function renderTable(rows, ctx) {
  let head = null;
  let aligns = [];
  let body = rows;
  if (rows.length > 1 && SEPARATOR.test(rows[1])) {
    head = splitRow(rows[0]);
    aligns = splitRow(rows[1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'c' : c.endsWith(':') ? 'r' : ''));
    body = rows.slice(2);
  }
  body = body.filter((r) => !SEPARATOR.test(r));
  const cls = (i) => (aligns[i] ? ` class="${aligns[i]}"` : '');
  const isAbilities = head && head.length === 6 && head.every((c, i) => plain(c).toLowerCase() === ABILITY_HEADS[i]);
  // A first column of short entries (dice rolls, names, levels) never wraps, so it is never squeezed thin.
  const firstCells = [head?.[0], ...body.map((r) => splitRow(r)[0])].filter(Boolean).map(plain);
  const tight = !isAbilities && firstCells.length && Math.max(...firstCells.map((c) => c.length)) <= 26;
  const classes = [isAbilities && 'abilities-table', tight && 'tight-first'].filter(Boolean).join(' ');
  const headHtml = head && head.some((c) => c) ? `<thead><tr>${head.map((c, i) => `<th${cls(i)}>${inline(c)}</th>`).join('')}</tr></thead>` : '';
  const links = xrefs(body.map((r) => splitRow(r)[0] || ''), ctx);
  const bodyHtml = body.map((r, n) => `<tr>${splitRow(r).map((c, i) => `<td${cls(i)}>${i === 0 ? linked(inline(c), links[n]) : inline(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap"><table${classes ? ` class="${classes}"` : ''}>${headHtml}<tbody>${bodyHtml}</tbody></table></div>`;
}

function renderList(items, ctx) {
  let html = '';
  const stack = [];
  const links = xrefs(items.map((it) => it.text), ctx);
  for (const [n, it] of items.entries()) {
    const tag = it.ordered ? 'ol' : 'ul';
    while (stack.length && it.indent < stack.at(-1).indent) html += `</li></${stack.pop().tag}>`;
    if (!stack.length || it.indent > stack.at(-1).indent) {
      html += `<${tag}>`;
      stack.push({ indent: it.indent, tag });
    } else {
      html += '</li>';
    }
    html += `<li>${linked(inline(it.text), links[n])}`;
  }
  while (stack.length) html += `</li></${stack.pop().tag}>`;
  return html;
}

/** The names on the stat blocks in some lines, in order (the same blocks renderQuote() gives ids). */
export function statblockNames(lines) {
  const names = [];
  for (let i = 0; i < lines.length; i++) {
    if (!QUOTE.test(lines[i])) continue;
    const inner = [];
    while (i < lines.length && QUOTE.test(lines[i])) inner.push(lines[i++].replace(/^\s*> ?/, ''));
    const first = inner.find((l) => l.trim()) || '';
    const heading = HEADING.exec(first);
    if (heading && inner.some((l) => /\bArmor Class\b/.test(l))) names.push(plain(heading[2]));
  }
  return names;
}

/**
 * The searchable text of some lines: one { text, name } per paragraph, list item
 * or table row. `name` is the text that could be a heading's name (a whole list
 * item, a row's first cell) - books.js sends a search hit there to that heading.
 */
export function textBlocks(lines) {
  const blocks = [];
  for (const raw of lines) {
    let line = raw.replace(/^(\s*>)+\s?/, '');
    if (!line.trim() || HR.test(line) || SEPARATOR.test(line)) continue;
    let name = null;
    line = line.replace(/^#{1,6}\s+/, '');
    const item = LIST.exec(line);
    if (item) name = line = item[3];
    if (TABLE.test(line)) {
      const cells = splitRow(line);
      name = cells[0];
      line = cells.filter(Boolean).join(' · ');
    }
    const text = plain(line);
    if (text) blocks.push({ text, name: name ? plain(name) : null });
  }
  return blocks;
}
