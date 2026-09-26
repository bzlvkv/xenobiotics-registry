import { targetKeyFor, searchTargets, type ReceptorTarget } from '@xeno/registry';
import { gtopdbUrl, targetName, type Ctx } from '../ctx';
import type { Loc } from '../router';
import { replaceQuery } from '../router';
import {
  card,
  cells,
  chip,
  chunkedTable,
  dash,
  el,
  ext,
  frag,
  inline,
  kv,
  link,
  search,
  select,
  tally,
  type Col,
} from '../ui';

/**
 * receptors.json opens with a `meta` block — which GtoPdb release these 428
 * names were cut from, when it was fetched, and what the two lists mean. Nothing
 * else in the client showed it, so the version behind every target name was
 * invisible. Rendered from the file rather than restated in prose, so it cannot
 * drift from what is stored.
 */
function provenance(ctx: Ctx): HTMLElement {
  const m = ctx.receptors.meta;
  return card(
    'Catalog provenance',
    `version ${m.version}`,
    kv([
      ['source', m.url ? ext(m.url, m.source) : m.source],
      ['version', m.version],
      ['fetched', m.fetched],
    ]),
    m.note ? el('div', { class: 'pad note' }, inline(m.note)) : null,
  );
}

const COLS: Col[] = [
  { label: 'target' },
  { label: 'gene' },
  { label: 'family', hide: true },
  { label: 'class', hide: true },
  { label: 'GtoPdb', hide: true },
  { label: 'compounds', align: 'r' },
];

export function targetsView(ctx: Ctx, loc: Loc): Node {
  const state = {
    q: loc.query.get('q') ?? '',
    kind: loc.query.get('kind') ?? '',
    fam: loc.query.get('fam') ?? '',
  };
  const list = el('div');
  const count = el('div', { class: 'count' });
  const countFor = (t: ReceptorTarget): number => ctx.occupancyCount.get(targetKeyFor(t.key)) ?? 0;

  const apply = (): void => {
    const base = state.q.trim() ? searchTargets(ctx.receptors, state.q, 1000) : ctx.targets;
    const rows = base.filter(
      (t) =>
        (!state.kind || (state.kind === 'bound' ? countFor(t) > 0 : t.kind === state.kind)) &&
        (!state.fam || t.family === state.fam),
    );
    count.replaceChildren(`${rows.length} of ${ctx.targets.length} catalogued targets`);
    list.replaceChildren(
      rows.length
        ? chunkedTable(COLS, rows, (t) => {
            const n = countFor(t);
            const url = gtopdbUrl(t.gtp_id);
            return cells(
              [
                frag(
                  link(`#/targets/${encodeURIComponent(t.key)}`, targetName(t)),
                  el('span', { class: 'slug' }, t.key),
                ),
                t.gene ? el('code', null, t.gene) : dash(),
                el('span', { class: 'sub' }, t.family ?? dash()),
                chip(t.class ?? (t.kind === 'gpcr' ? 'GPCR' : t.kind)),
                url ? ext(url, String(t.gtp_id)) : dash(),
                n ? link(`#/targets/${encodeURIComponent(t.key)}`, String(n)) : dash(),
              ],
              COLS,
            );
          })
        : el('p', { class: 'pad muted' }, 'No target matches those filters.'),
    );
  };
  const push = (): void => {
    replaceQuery('targets', state);
    apply();
  };

  const unknown = ctx.coverage.targets.occupancyKeysUnknown;
  const families = tally(ctx.targets.map((t) => t.family).filter((f): f is string => Boolean(f)));

  apply();
  return frag(
    el('h1', null, 'Targets'),
    el(
      'p',
      { class: 'lede' },
      `${ctx.coverage.targets.gpcrs} GPCRs · ${ctx.coverage.targets.nonGpcr} non-GPCR targets · ` +
        `${ctx.receptors.meta.source} ${ctx.receptors.meta.version}`,
    ),
    card(
      'Catalog',
      `${ctx.coverage.targets.occupancyKeysUsed} keys carry authored occupancy`,
      el(
        'div',
        { class: 'controls' },
        search(state.q, 'Search name, gene or key…', (v) => {
          state.q = v;
          push();
        }),
        select(
          'kind',
          state.kind,
          [
            ['', 'every target'],
            ['gpcr', 'GPCRs'],
            ['non-gpcr', 'non-GPCR targets'],
            ['bound', 'with authored occupancy'],
          ],
          (v) => {
            state.kind = v;
            push();
          },
        ),
        select(
          'family',
          state.fam,
          [
            ['', `all families (${families.length})`],
            ...families.map(([k, n]) => [k, `${k} (${n})`] as [string, string]),
          ],
          (v) => {
            state.fam = v;
            push();
          },
        ),
      ),
      list,
      count,
    ),
    unknown.length
      ? card(
          'Occupancy keys with no catalogued target',
          unknown.length,
          el(
            'div',
            { class: 'pad chips' },
            unknown.map((k) =>
              el(
                'a',
                { href: `#/targets/${encodeURIComponent(k)}`, class: 'chip' },
                `${k} · ${ctx.occupancyCount.get(targetKeyFor(k)) ?? 0}`,
              ),
            ),
          ),
        )
      : null,
    provenance(ctx),
  );
}
