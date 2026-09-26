import { searchPathways, type Pathway } from '@xeno/registry';
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

const COLS: Col[] = [
  { label: 'pathway' },
  { label: 'category', hide: true },
  { label: 'domains', hide: true },
  { label: 'steps', align: 'r' },
  { label: 'modulators', align: 'r', hide: true },
  { label: 'Recon3D subsystem', hide: true },
];

/**
 * The facets the home page's coverage rows link to. A pathway with no Recon3D
 * subsystem and one whose steps carry no PMID are both counts on that page, so
 * each needs a destination that shows exactly those records.
 */
const FACETS: [string, string][] = [
  ['', 'every pathway'],
  ['no-recon', 'no Recon3D subsystem'],
  ['uncited-steps', 'a step with no source'],
  ['uncited-mods', 'a modulator with no source'],
];

function matchesFacet(p: Pathway, facet: string): boolean {
  switch (facet) {
    case 'no-recon':
      return !p.recon3d_subsystem;
    case 'uncited-steps':
      return (p.steps ?? []).some((s) => !s.source_pmid);
    case 'uncited-mods':
      return (p.modulators ?? []).some((m) => !m.source_pmid);
    default:
      return true;
  }
}

export function pathwaysView(ctx: Ctx, loc: Loc): Node {
  const state = {
    q: loc.query.get('q') ?? '',
    cat: loc.query.get('cat') ?? '',
    sub: loc.query.get('sub') ?? '',
    facet: loc.query.get('facet') ?? '',
  };
  const list = el('div');
  const count = el('div', { class: 'count' });

  const apply = (): void => {
    const filtered = ctx.pathways.filter(
      (p: Pathway) =>
        (!state.cat || p.category === state.cat) &&
        (!state.sub || p.recon3d_subsystem === state.sub) &&
        matchesFacet(p, state.facet),
    );
    const rows = state.q.trim() ? searchPathways(filtered, state.q, 500) : filtered;
    count.replaceChildren(
      `${rows.length} of ${ctx.pathways.length} pathways` +
        (state.q.trim() ? ` matching “${state.q.trim()}”` : ''),
    );
    list.replaceChildren(
      rows.length
        ? chunkedTable(COLS, rows, (p) =>
            cells(
              [
                frag(
                  link(`#/pathways/${p.slug}`, p.name),
                  el('span', { class: 'slug' }, p.slug),
                  p.subtitle ? el('span', { class: 'sub' }, p.subtitle) : null,
                ),
                p.category,
                // 7 pathways carry no domains[]; an empty chip row reads as an
                // oversight in the cell, so the dash says "not authored" instead.
                (p.domains ?? []).length
                  ? el(
                      'span',
                      { class: 'chips' },
                      (p.domains ?? []).map((d) => chip(d.replace(/_/g, ' '))),
                    )
                  : dash(),
                (p.steps ?? []).length || dash(),
                (p.modulators ?? []).length || dash(),
                p.recon3d_subsystem ? el('span', { class: 'sub' }, p.recon3d_subsystem) : dash(),
              ],
              COLS,
            ),
          )
        : el('p', { class: 'pad muted' }, 'No pathway matches those filters.'),
    );
  };
  const push = (): void => {
    replaceQuery('pathways', state);
    apply();
  };

  const subsystems = tally(
    ctx.pathways.map((p) => p.recon3d_subsystem).filter((s): s is string => Boolean(s)),
  );

  apply();
  return frag(
    el('h1', null, 'Pathways'),
    card(
      'Catalog',
      null,
      el(
        'div',
        { class: 'controls' },
        search(state.q, 'Search pathway name or slug…', (v) => {
          state.q = v;
          push();
        }),
        select(
          'category',
          state.cat,
          [
            ['', 'all categories'],
            ...tally(ctx.pathways.map((p) => p.category)).map(
              ([k, n]) => [k, `${k.replace(/_/g, ' ')} (${n})`] as [string, string],
            ),
          ],
          (v) => {
            state.cat = v;
            push();
          },
        ),
        select(
          'Recon3D subsystem',
          state.sub,
          [
            ['', `all subsystems (${subsystems.length} mapped)`],
            ...subsystems.map(([k, n]) => [k, `${k} (${n})`] as [string, string]),
          ],
          (v) => {
            state.sub = v;
            push();
          },
        ),
        select('provenance', state.facet, FACETS, (v) => {
          state.facet = v;
          push();
        }),
      ),
      list,
      count,
    ),
  );
}
