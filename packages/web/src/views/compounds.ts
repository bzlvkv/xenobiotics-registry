import {
  SYSTEM_IDS,
  SYSTEM_META,
  searchCompounds,
  type Compound,
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
  frag,
  link,
  search,
  select,
  tally,
  type Col,
} from '../ui';

const FACETS: [string, string][] = [
  ['', 'anything authored'],
  ['pk', 'has authored PK'],
  ['gap', 'explained PK gap'],
  ['occ', 'has receptor occupancy'],
  ['int', 'has interactions'],
  ['ec', 'has effect compartment'],
  ['nut', 'has nutrition'],
  ['lint', 'has lint findings'],
];

const COLS: Col[] = [
  { label: 'compound' },
  { label: 'category', hide: true },
  { label: 'systems', hide: true },
  { label: 'PK' },
  { label: 'cites', align: 'r', hide: true },
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

function matches(
  c: Compound,
  cat: string,
  sys: string,
  facet: string,
  linted: Set<string>,
): boolean {
  if (cat && c.category !== cat) return false;
  if (sys && !(c.systems ?? []).includes(sys as SystemId)) return false;
  switch (facet) {
    case 'pk':
      return routeCount(c) > 0;
    case 'gap':
      return Boolean(c.pk_unauthored);
    case 'occ':
      return (c.receptor_occupancy ?? []).length > 0;
    case 'int':
      return (c.interactions ?? []).length > 0;
    case 'ec':
      return Boolean(c.effect_compartment);
    case 'nut':
      return Boolean(c.nutrition);
    case 'lint':
      return linted.has(c.slug);
    default:
      return true;
  }
}

export function compoundsView(ctx: Ctx, loc: Loc): Node {
  const state = {
    q: loc.query.get('q') ?? '',
    cat: loc.query.get('cat') ?? '',
    sys: loc.query.get('sys') ?? '',
    facet: loc.query.get('facet') ?? '',
  };
  const linted = new Set(ctx.findings.map((f) => f.entity.split(/[/#:\s]/)[0] ?? ''));
  const list = el('div');
  const count = el('div', { class: 'count' });

  const apply = (): void => {
    const filtered = ctx.compounds.filter((c) =>
      matches(c, state.cat, state.sys, state.facet, linted),
    );
    const rows = state.q.trim() ? searchCompounds(filtered, state.q, 5000) : filtered;
    count.replaceChildren(
      `${rows.length.toLocaleString('en-US')} of ${ctx.compounds.length.toLocaleString('en-US')} compounds` +
        (state.q.trim() ? ` matching “${state.q.trim()}”` : ''),
    );
    list.replaceChildren(
      rows.length
        ? chunkedTable(COLS, rows, (c) =>
            cells(
              [
                frag(link(`#/compounds/${c.slug}`, c.name), el('span', { class: 'slug' }, c.slug)),
                c.category,
                el(
                  'span',
                  { class: 'chips' },
                  (c.systems ?? []).map((s) => chip(SYSTEM_META[s]?.short ?? s)),
                ),
                pkBadge(c),
                (c.refs ?? []).length || dash(),
              ],
              COLS,
            ),
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
          ([k, n]) => [k, `${k} (${n})`] as [string, string],
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
  );

  apply();
  return frag(el('h1', null, 'Compounds'), card('Catalog', null, controls, list, count));
}
