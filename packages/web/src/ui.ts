/**
 * ui.ts — the whole rendering vocabulary: ~10 DOM helpers, no templating.
 *
 * Nothing here ever touches innerHTML. Every string reaches the document as a
 * text node or textContent, so the data's angle brackets, quotes and ampersands
 * (the prose fields are full of all three) are escaped by construction rather
 * than by remembering to call an escape function.
 */
import { pubmedUrl } from '@xeno/registry';

export type Child = Node | string | number | null | undefined | false;
type Kids = (Child | Child[])[];
type Attrs = Record<string, unknown>;

const EM = '—';

function appendKids(parent: Node, kids: Kids): void {
  for (const k of kids) {
    if (k === null || k === undefined || k === false || k === '') continue;
    if (Array.isArray(k)) appendKids(parent, k);
    else parent.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export function el(tag: string, attrs: Attrs | null = null, ...kids: Kids): HTMLElement {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') node.className = String(v);
      else if (typeof v === 'function')
        node.addEventListener(k.replace(/^on/, ''), v as EventListener);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
  }
  appendKids(node, kids);
  return node;
}

export function frag(...kids: Kids): DocumentFragment {
  const f = document.createDocumentFragment();
  appendKids(f, kids);
  return f;
}

/** An absent value must never look like a zero or an oversight. */
export function dash(label = EM): HTMLElement {
  return el('span', { class: 'dash', title: 'not authored' }, label);
}

/** Compact, honest number formatting: no invented precision, no lost magnitude. */
export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return EM;
  const abs = Math.abs(n);
  if (Number.isInteger(n) && abs < 1e7) return n.toLocaleString('en-US');
  if (abs >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (abs >= 1) return String(Number(n.toFixed(3)));
  if (abs >= 1e-4) return String(Number(n.toPrecision(3)));
  return n.toExponential(2);
}

export function num(n: number | null | undefined): Child {
  return n === null || n === undefined || !Number.isFinite(n) ? dash() : fmt(n);
}

export function link(href: string, label: Child, cls?: string): HTMLElement {
  return el('a', { href, class: cls }, label);
}

export function ext(href: string, label: Child): HTMLElement {
  return el('a', { href, target: '_blank', rel: 'noreferrer noopener' }, label);
}

export function chip(label: Child, cls = ''): HTMLElement {
  return el('span', { class: `chip ${cls}`.trim() }, label);
}

export function chipLink(href: string, label: Child, cls = ''): HTMLElement {
  return el('a', { href, class: `chip ${cls}`.trim() }, label);
}

export function chips(items: Child[]): HTMLElement | null {
  return items.length ? el('span', { class: 'chips' }, items) : null;
}

/**
 * The GtoPdb catalog stores three receptor names with HTML entities in them
 * ("&mu; receptor"). Decoding a FIXED map of character entities is not parsing
 * markup — the result still reaches the page as a text node — and it is the
 * difference between "\u03bc receptor" and a name that reads like a bug.
 */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  alpha: '\u03b1',
  beta: '\u03b2',
  gamma: '\u03b3',
  delta: '\u03b4',
  epsilon: '\u03b5',
  zeta: '\u03b6',
  eta: '\u03b7',
  theta: '\u03b8',
  iota: '\u03b9',
  kappa: '\u03ba',
  lambda: '\u03bb',
  mu: '\u03bc',
  nu: '\u03bd',
  xi: '\u03be',
  pi: '\u03c0',
  rho: '\u03c1',
  sigma: '\u03c3',
  tau: '\u03c4',
  upsilon: '\u03c5',
  phi: '\u03c6',
  chi: '\u03c7',
  psi: '\u03c8',
  omega: '\u03c9',
};

export function decodeEntities(s: string): string {
  return s.replace(/&([a-zA-Z]+);/g, (whole, name: string) => ENTITIES[name] ?? whole);
}

/* ---------------------------------------------------------------- citations */

const PMID_RE = /PMID:?\s*(\d{4,9})|\b(\d{7,8})\b/g;

/** "PMID:12345", "pmid 12345" and a bare 7-8 digit id all normalise to digits. */
export function pmidDigits(raw: unknown): string | null {
  const m = /(\d{4,9})/.exec(String(raw ?? ''));
  return m && m[1] ? m[1] : null;
}

/** One cell holding however many PMIDs a field carries. */
export function pmidLinks(raw: unknown): Child {
  const ids = String(raw ?? '').match(/\d{4,9}/g);
  if (!ids || !ids.length) return dash();
  const out: Child[] = [];
  ids.forEach((id, i) => {
    if (i) out.push(', ');
    out.push(ext(pubmedUrl(id), id));
  });
  return frag(...out);
}

export function refList(refs: readonly string[] | undefined): Child {
  if (!refs || !refs.length) return dash();
  const out: Child[] = [];
  refs.forEach((r, i) => {
    if (i) out.push(' ');
    const id = pmidDigits(r);
    out.push(id ? chipLink(pubmedUrl(id), id) : chip(r));
  });
  return el('span', { class: 'chips' }, out);
}

/**
 * Prose, linkified: inline `PMID:123456` citations become PubMed links and the
 * wiki-style `[[pathway_slug]]` cross-links that pathway descriptions use become
 * real links. Built from split() + text nodes, so it stays escape-safe.
 */
export function prose(textIn: string | null | undefined, cls = 'pad prose'): HTMLElement {
  const box = el('div', { class: cls });
  const raw = textIn ?? '';
  if (!raw.trim()) {
    box.appendChild(dash());
    return box;
  }
  for (const para of raw.split(/\n{2,}/)) {
    const p = el('p');
    appendKids(p, [inline(para)]);
    box.appendChild(p);
  }
  return box;
}

/**
 * Pathway descriptions cross-link each other as `[[slug]]`. main() hands this the
 * registry's own lookup at boot so those links read as names rather than slugs;
 * without it they still work, they just read as the slug.
 */
let pathwayNameOf: (slug: string) => string | undefined = () => undefined;

export function setPathwayNames(fn: (slug: string) => string | undefined): void {
  pathwayNameOf = fn;
}

export function inline(raw: string): DocumentFragment {
  const out: Child[] = [];
  // [[slug]] first, then PMIDs inside each remaining text run.
  for (const part of raw.split(/(\[\[[A-Za-z0-9_-]+\]\])/g)) {
    const wiki = /^\[\[([A-Za-z0-9_-]+)\]\]$/.exec(part);
    if (wiki && wiki[1]) {
      const slug = wiki[1];
      out.push(link(`#/pathways/${slug}`, pathwayNameOf(slug) ?? slug.replace(/_/g, ' ')));
      continue;
    }
    out.push(linkifyPmids(part));
  }
  return frag(...out);
}

function linkifyPmids(run: string): DocumentFragment {
  const out: Child[] = [];
  let last = 0;
  PMID_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PMID_RE.exec(run)) !== null) {
    const id = m[1] ?? m[2];
    if (!id) continue;
    if (m.index > last) out.push(run.slice(last, m.index));
    out.push(ext(pubmedUrl(id), m[0]));
    last = m.index + m[0].length;
  }
  if (last < run.length) out.push(run.slice(last));
  return frag(...out);
}

/* -------------------------------------------------------------- structures */

export interface Col {
  label: string;
  align?: 'r';
  /** Secondary: dropped at phone width so the columns that matter stay visible. */
  hide?: boolean;
  /** Sort key. Set it and the header becomes the button that sorts by this
   *  column; the caller owns the comparator, so the table stays data-agnostic. */
  sort?: string;
  /** Header tooltip — what the column's abbreviation means. */
  title?: string;
}

/** Who is sorting, which way, and what to call when a header is clicked. */
export interface Sorting {
  key: string;
  dir: 1 | -1;
  on: (key: string) => void;
}

function cellClass(col: Col | undefined): string | null {
  const cls = `${col?.align === 'r' ? 'r' : ''} ${col?.hide ? 'opt' : ''}`.trim();
  return cls || null;
}

/**
 * One header cell. A sortable column renders a button rather than bare text:
 * the sort is reachable by keyboard and announced, and the arrow says which way
 * the rows are running without a legend.
 */
function headCell(col: Col, sorting?: Sorting): HTMLElement {
  const active = Boolean(sorting && col.sort && sorting.key === col.sort);
  const th = el('th', {
    class: cellClass(col),
    title: col.title,
    'aria-sort': active ? (sorting?.dir === 1 ? 'ascending' : 'descending') : null,
  });
  if (!sorting || !col.sort) {
    th.appendChild(document.createTextNode(col.label));
    return th;
  }
  const key = col.sort;
  th.appendChild(
    el(
      'button',
      { class: `sort${active ? ' on' : ''}`, type: 'button', onclick: () => sorting.on(key) },
      col.label,
      el(
        'span',
        { class: 'arrow', 'aria-hidden': 'true' },
        active ? (sorting.dir === 1 ? '\u2191' : '\u2193') : '\u2195',
      ),
    ),
  );
  return th;
}
/** A row is either cells, or one full-width row (used for long notes). */
export type Row = Child[] | { full: Child };

export function table(cols: Col[], rows: Row[]): HTMLElement {
  const head = el(
    'tr',
    null,
    cols.map((c) => headCell(c)),
  );
  const body = el('tbody');
  for (const row of rows) {
    if (!Array.isArray(row)) {
      body.appendChild(
        el('tr', { class: 'noterow' }, el('td', { class: 'note', colspan: cols.length }, row.full)),
      );
      continue;
    }
    body.appendChild(
      el(
        'tr',
        null,
        row.map((cell, i) => el('td', { class: cellClass(cols[i]) }, cell)),
      ),
    );
  }
  return el('div', { class: 'tw' }, el('table', null, el('thead', null, head), body));
}

export function kv(rows: [string, Child][]): HTMLElement {
  const body = el('tbody');
  for (const [k, v] of rows) body.appendChild(el('tr', null, el('td', null, k), el('td', null, v)));
  return el('div', { class: 'tw' }, el('table', { class: 'kv' }, body));
}

export function card(title: string, count: Child, ...body: Kids): HTMLElement {
  return el(
    'section',
    { class: 'card' },
    el(
      'h2',
      null,
      title,
      count === null || count === undefined ? null : el('span', { class: 'n' }, count),
    ),
    ...body,
  );
}

export function collapsible(summary: string, ...body: Kids): HTMLElement {
  return el('details', { class: 'prov' }, el('summary', null, summary), ...body);
}

export function statement(key: Child, value: Child): HTMLElement {
  return el(
    'div',
    { class: 'statement' },
    el('span', { class: 'k' }, key),
    el('span', null, value),
  );
}

export function stat(label: string, value: Child, cls = ''): HTMLElement {
  return el('div', { class: `stat ${cls}`.trim() }, el('b', null, value), el('span', null, label));
}

/**
 * A stat that is also its own query. Every number on the home page is a count of
 * some subset of the data, and the subset is the thing a reader wants next — so
 * the tile links to the list already narrowed to it rather than to an unfiltered
 * page the reader has to re-narrow by hand.
 *
 * Same markup as `stat` apart from the tag, so the grid does not care which it
 * gets. `title` is the sentence that says what the destination will show, which
 * matters because a bare count does not say what filter produced it.
 */
export function statLink(
  href: string,
  label: string,
  value: Child,
  opts: { cls?: string; title?: string } = {},
): HTMLElement {
  return el(
    'a',
    { href, class: `stat ${opts.cls ?? ''}`.trim(), title: opts.title },
    el('b', null, value),
    el('span', null, label),
  );
}

/** Sorted [key, count] pairs for a select's options. */
export function tally(values: readonly string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function select(
  label: string,
  value: string,
  options: [string, string][],
  onChange: (v: string) => void,
): HTMLElement {
  const sel = el('select', { 'aria-label': label });
  for (const [v, text] of options) {
    const o = el('option', { value: v }, text) as HTMLOptionElement;
    if (v === value) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => onChange((sel as HTMLSelectElement).value));
  return sel;
}

export function search(
  value: string,
  placeholder: string,
  onInput: (v: string) => void,
): HTMLInputElement {
  const input = el('input', {
    type: 'search',
    placeholder,
    value,
    'aria-label': placeholder,
  }) as HTMLInputElement;
  input.value = value;
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

/**
 * Chunked rendering. 1,244 compound rows in one pass is a visible stall on a
 * phone, so rows land 80 at a time as a sentinel scrolls into view. Cheaper and
 * far less fragile than true virtualisation, and Cmd-F still finds what is shown.
 */
export function chunked<T>(items: readonly T[], row: (item: T) => Node, step = 80): HTMLElement {
  const body = el('tbody');
  const host = el('div');
  let at = 0;
  const more = (): void => {
    const end = Math.min(at + step, items.length);
    for (; at < end; at++) {
      const item = items[at];
      if (item !== undefined) body.appendChild(row(item));
    }
    if (at >= items.length) io.disconnect();
    /*
     * A batch that does not push the sentinel off screen crosses no threshold, so
     * no further callback arrives and the list stalls part-loaded — reproducibly
     * at 160 of 1,244 rows on a viewport around 8,000 CSS px (a very tall screen,
     * or an ordinary one zoomed out). Re-observing asks for a fresh callback at
     * the sentinel's CURRENT position: still visible means load again, gone means
     * wait for the scroll. No layout read, so no forced reflow.
     */
    else if (sentinel.isConnected) {
      io.unobserve(sentinel);
      io.observe(sentinel);
    }
  };
  const sentinel = el('div', { class: 'sentinel' });
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) more();
  });
  more();
  host.appendChild(body);
  host.appendChild(sentinel);
  io.observe(sentinel);
  return host;
}

/** chunked() produces a <tbody>; this wraps it in the table it belongs to. */
export function chunkedTable<T>(
  cols: Col[],
  items: readonly T[],
  row: (item: T) => Node,
  opts: { cls?: string; sorting?: Sorting } = {},
): HTMLElement {
  const host = chunked(items, row);
  const tbody = host.firstChild as Node;
  const sentinel = host.lastChild as Node;
  const t = el(
    'table',
    { class: opts.cls },
    el(
      'thead',
      null,
      el(
        'tr',
        null,
        cols.map((c) => headCell(c, opts.sorting)),
      ),
    ),
  );
  t.appendChild(tbody);
  return el('div', null, el('div', { class: 'tw' }, t), sentinel);
}

export function cells(row: Child[], cols: Col[]): HTMLElement {
  return el(
    'tr',
    null,
    row.map((cell, i) => el('td', { class: cellClass(cols[i]) }, cell)),
  );
}
