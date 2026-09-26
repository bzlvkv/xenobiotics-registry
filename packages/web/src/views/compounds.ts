import {
  SYSTEM_IDS,
  SYSTEM_META,
  searchCompounds,
  type Compound,
  type Route,
  type SystemId,
} from '@xeno/registry';
import type { Ctx } from '../ctx';
import type { Loc } from '../router';
import { replaceQuery } from '../router';
import {
  card,
  cells,
  chip,
  chunkedTable,
  dash,
  el,
  fmt,
  frag,
  link,
  search,
  select,
  stat,
  tally,
  type Col,
} from '../ui';

/**
 * The facets exist so every count on the home page has somewhere to land. Each
 * one is a subset a coverage number reports, and a reader who clicks that number
 * arrives here with the subset already applied rather than an unfiltered list.
 */
const FACETS: [string, string][] = [
  ['', 'anything authored'],
  ['pk', 'has authored PK'],
  ['gap', 'explained PK gap'],
  ['hl', 'has a half-life'],
  ['occ', 'has receptor occupancy'],
  ['int', 'has interactions'],
  ['ec', 'has effect compartment'],
  ['keo-fit', 'keo fitted from a curve'],
  ['keo-est', 'keo is a declared estimate'],
  ['nut', 'has nutrition'],
  ['lint', 'has lint findings'],
  ['uncited', 'PK route block with no source'],
  ['untagged', 'no body system'],
  ['unvisited', 'neither PK nor a reason'],
];

/** A route block is uncited when it carries neither a PMID nor a label. */
function hasUncitedRoute(c: Compound): boolean {
  return Object.values(c.pk ?? {}).some((p) => !p?.source_pmid && !p?.source_label);
}

const COLS: Col[] = [
  { label: 'compound', sort: 'name' },
  { label: 'category', sort: 'cat', hide: true },
  { label: 'systems', hide: true },
  { label: 'routes · typical dose', hide: true, title: 'dose ranges are on the record' },
  { label: 't½', align: 'r', sort: 'hl', title: 'terminal half-life, hours, by route' },
  { label: 'PK', sort: 'pk', title: 'authored pk[route] blocks, or why there are none' },
  {
    label: 'authored',
    sort: 'depth',
    hide: true,
    title: 'receptor occupancy · interaction edges · effect compartment · nutrition · lint',
  },
  { label: 'cites', align: 'r', sort: 'refs', hide: true, title: 'compound-level PMIDs' },
];

function routeCount(c: Compound): number {
  return Object.keys(c.pk ?? {}).length;
}

/** The PK badge is the one thing a reviewer scans this list for. */
export function pkBadge(c: Compound): HTMLElement {
  const n = routeCount(c);
  if (n > 0) return chip(n === 1 ? 'PK' : `PK ×${n}`, 'accent');
  if (c.pk_unauthored) return chip(c.pk_unauthored.reason, 'est');
  return chip('unvisited', 'error');
}

/**
 * Half-lives in route order. `half_life_hr` is keyed by route and every key it
 * carries is a declared route, so the declared order is the canonical one.
 */
function halfLives(c: Compound): [Route, number][] {
  const out: [Route, number][] = [];
  for (const r of c.routes ?? []) {
    const v = c.half_life_hr?.[r];
    if (typeof v === 'number') out.push([r, v]);
  }
  return out;
}

/**
 * One number in the column, every number in the tooltip. 38 records carry more
 * than one distinct half-life and a single cell cannot honestly flatten them,
 * so the first route's value is shown with a marker saying there are others.
 */
function halfLifeCell(c: Compound): Node {
  const hl = halfLives(c);
  const first = hl[0];
  if (!first) return dash();
  const title = hl.map(([r, v]) => `${r} ${fmt(v)} h`).join(' · ');
  const distinct = new Set(hl.map(([, v]) => v)).size;
  return el(
    'span',
    { title },
    `${fmt(first[1])} h`,
    distinct > 1 ? el('span', { class: 'more' }, '+') : null,
  );
}

/** Route chips carry their own typical dose, so the number is never orphaned
 *  from the route it was authored for. */
function routeCells(c: Compound): Node {
  const routes = c.routes ?? [];
  if (!routes.length) return dash();
  return el(
    'span',
    { class: 'chips' },
    routes.map((r) => {
      const d = c.doses?.[r];
      if (!d) return chip(r, 'route');
      return el(
        'span',
        { class: 'chip route', title: `${r} ${fmt(d.min)}–${fmt(d.max)} ${d.unit}` },
        r,
        el('b', null, `${fmt(d.typical)} ${d.unit}`),
      );
    }),
  );
}

function depth(c: Compound): number {
  return (
    (c.receptor_occupancy ?? []).length +
    (c.interactions ?? []).length +
    (c.effect_compartment ? 1 : 0) +
    (c.nutrition ? 1 : 0)
  );
}

/** Everything else the record carries, in one column of countable chips —
 *  the same four facets the filter offers, plus whatever lint says. */
function authoredCell(c: Compound, findings: Map<string, { errors: number; warns: number }>): Node {
  const out: HTMLElement[] = [];
  const occ = (c.receptor_occupancy ?? []).length;
  const int = (c.interactions ?? []).length;
  if (occ) {
    const targets = new Set(c.receptor_occupancy?.map((r) => r.receptor)).size;
    out.push(
      el('span', { class: 'chip', title: `${targets} receptor sites` }, 'occ', el('b', null, occ)),
    );
  }
  if (int)
    out.push(el('span', { class: 'chip', title: 'interaction edges' }, 'int', el('b', null, int)));
  const ec = c.effect_compartment;
  if (ec) {
    out.push(
      el(
        'span',
        {
          class: `chip${ec.approximated ? ' est' : ''}`,
          title: `keo ${fmt(ec.keo_per_h)} /hr${ec.approximated ? ', estimated' : ''}`,
        },
        'keo',
        el('b', null, fmt(ec.keo_per_h)),
      ),
    );
  }
  if (c.nutrition) {
    out.push(
      el(
        'span',
        { class: 'chip', title: `RDI ${fmt(c.nutrition.rdi)} ${c.nutrition.unit}` },
        'RDI',
      ),
    );
  }
  const f = findings.get(c.slug);
  if (f?.errors) out.push(chip(`lint ${f.errors}`, 'error'));
  else if (f?.warns) out.push(chip(`lint ${f.warns}`, 'warn'));
  return out.length ? el('span', { class: 'chips' }, out) : dash();
}

const SORTS: Record<string, (a: Compound, b: Compound) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  cat: (a, b) => a.category.localeCompare(b.category),
  hl: (a, b) => (halfLives(a)[0]?.[1] ?? -1) - (halfLives(b)[0]?.[1] ?? -1),
  pk: (a, b) => routeCount(a) - routeCount(b),
  depth: (a, b) => depth(a) - depth(b),
  refs: (a, b) => (a.refs ?? []).length - (b.refs ?? []).length,
};

function matches(
  c: Compound,
  cat: string,
  sys: string,
  facet: string,
  reason: string,
  linted: Set<string>,
): boolean {
  if (cat && c.category !== cat) return false;
  if (sys && !(c.systems ?? []).includes(sys as SystemId)) return false;
  if (reason && c.pk_unauthored?.reason !== reason) return false;
  switch (facet) {
    case 'pk':
      return routeCount(c) > 0;
    case 'gap':
      return Boolean(c.pk_unauthored);
    case 'hl':
      return halfLives(c).length > 0;
    case 'occ':
      return (c.receptor_occupancy ?? []).length > 0;
    case 'int':
      return (c.interactions ?? []).length > 0;
    case 'ec':
      return Boolean(c.effect_compartment);
    case 'keo-fit':
      return Boolean(c.effect_compartment && !c.effect_compartment.approximated);
    case 'keo-est':
      return Boolean(c.effect_compartment?.approximated);
    case 'nut':
      return Boolean(c.nutrition);
    case 'lint':
      return linted.has(c.slug);
    case 'uncited':
      return hasUncitedRoute(c);
    case 'untagged':
      return (c.systems ?? []).length === 0;
    case 'unvisited':
      return routeCount(c) === 0 && !c.pk_unauthored;
    default:
      return true;
  }
}

const n = (x: number): string => x.toLocaleString('en-US');

export function compoundsView(ctx: Ctx, loc: Loc): Node {
  const state = {
    q: loc.query.get('q') ?? '',
    cat: loc.query.get('cat') ?? '',
    sys: loc.query.get('sys') ?? '',
    facet: loc.query.get('facet') ?? '',
    reason: loc.query.get('reason') ?? '',
    sort: loc.query.get('sort') ?? 'name',
    dir: loc.query.get('dir') === 'd' ? 'd' : 'a',
  };
  /** slug -> its lint findings, by level. Built once: the linter has already run. */
  const findings = new Map<string, { errors: number; warns: number }>();
  for (const f of ctx.findings) {
    const slug = f.entity.split(/[/#:\s]/)[0] ?? '';
    const at = findings.get(slug) ?? { errors: 0, warns: 0 };
    if (f.level === 'error') at.errors++;
    else at.warns++;
    findings.set(slug, at);
  }
  const linted = new Set(findings.keys());
  const list = el('div');
  const count = el('span');
  const stats = el('div', { class: 'stats' });

  const apply = (): void => {
    const filtered = ctx.compounds.filter((c) =>
      matches(c, state.cat, state.sys, state.facet, state.reason, linted),
    );
    const found = state.q.trim() ? searchCompounds(filtered, state.q, 5000) : filtered;
    /*
     * Relevance is the only honest order for a search, so a query that is not
     * explicitly re-sorted keeps the order searchCompounds returned.
     */
    const cmp = SORTS[state.sort];
    const rows =
      cmp && !(state.q.trim() && state.sort === 'name')
        ? [...found].sort((a, b) => cmp(a, b) * (state.dir === 'd' ? -1 : 1))
        : found;

    count.replaceChildren(
      `${n(rows.length)} of ${n(ctx.compounds.length)}` +
        (state.q.trim() ? ` matching “${state.q.trim()}”` : ''),
    );
    const pmids = new Set(rows.flatMap((c) => c.refs ?? []));
    stats.replaceChildren(
      stat('shown', n(rows.length)),
      stat('authored PK', n(rows.filter((c) => routeCount(c) > 0).length), 'good'),
      stat('explained gaps', n(rows.filter((c) => c.pk_unauthored).length)),
      stat('half-life', n(rows.filter((c) => halfLives(c).length > 0).length)),
      stat('occupancy', n(rows.filter((c) => (c.receptor_occupancy ?? []).length).length)),
      stat('interactions', n(rows.filter((c) => (c.interactions ?? []).length).length)),
      stat('compound PMIDs', n(pmids.size)),
    );

    list.replaceChildren(
      rows.length
        ? chunkedTable(
            COLS,
            rows,
            (c) =>
              cells(
                [
                  frag(
                    link(`#/compounds/${c.slug}`, c.name),
                    /* A real space, not just the margin: it is the break
                     * opportunity the cell needs at phone width, and it is what
                     * keeps a copied row from reading "Caffeinecaffeine". */
                    ' ',
                    el('span', { class: 'slug inline', title: c.slug }, c.slug),
                  ),
                  el('span', { class: 'sub' }, c.category),
                  el(
                    'span',
                    { class: 'chips' },
                    (c.systems ?? []).map((s) =>
                      el(
                        'span',
                        { class: 'chip', title: SYSTEM_META[s]?.description },
                        SYSTEM_META[s]?.short ?? s,
                      ),
                    ),
                  ),
                  routeCells(c),
                  halfLifeCell(c),
                  pkBadge(c),
                  authoredCell(c, findings),
                  (c.refs ?? []).length || dash(),
                ],
                COLS,
              ),
            {
              cls: 'dense',
              sorting: {
                key: state.sort,
                dir: state.dir === 'd' ? -1 : 1,
                on: (key) => {
                  state.dir = state.sort === key && state.dir === 'a' ? 'd' : 'a';
                  state.sort = key;
                  push();
                },
              },
            },
          )
        : el('p', { class: 'pad muted' }, 'No compound matches those filters.'),
    );
  };

  const push = (): void => {
    replaceQuery('compounds', state);
    apply();
  };

  const controls = el(
    'div',
    { class: 'controls' },
    search(state.q, 'Search name, alias or slug…', (v) => {
      state.q = v;
      push();
    }),
    select(
      'category',
      state.cat,
      [
        ['', 'all categories'],
        ...tally(ctx.compounds.map((c) => c.category)).map(
          ([k, c]) => [k, `${k} (${c})`] as [string, string],
        ),
      ],
      (v) => {
        state.cat = v;
        push();
      },
    ),
    select(
      'body system',
      state.sys,
      [
        ['', 'all systems'],
        ...SYSTEM_IDS.map((s) => [s, SYSTEM_META[s].label] as [string, string]),
      ],
      (v) => {
        state.sys = v;
        push();
      },
    ),
    select('authored', state.facet, FACETS, (v) => {
      state.facet = v;
      push();
    }),
    /* The reason select exists so a deep link from the home page's
     * by-reason table is adjustable once you arrive, rather than a dead end. */
    select(
      'PK gap reason',
      state.reason,
      [
        ['', 'any reason'],
        ...tally(ctx.compounds.map((c) => c.pk_unauthored?.reason ?? '').filter(Boolean)).map(
          ([k, c]) => [k, `${k} (${c})`] as [string, string],
        ),
      ],
      (v) => {
        state.reason = v;
        push();
      },
    ),
  );

  const cov = ctx.coverage.compounds;
  apply();
  return frag(
    el('h1', null, 'Compounds'),
    el(
      'p',
      { class: 'lede' },
      `${n(cov.total)} records · ${n(cov.withPk)} with authored PK · ${n(cov.pkUnauthored)} with an ` +
        `explained gap · ${n(cov.routeEntries)} route blocks, ${n(cov.routeEntriesCited)} cited`,
    ),
    card('Catalog', count, controls, stats, list),
  );
}
