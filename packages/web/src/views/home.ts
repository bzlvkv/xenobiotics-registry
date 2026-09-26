import type { Ctx } from '../ctx';
import { href } from '../router';
import { card, el, frag, link, stat, statLink, table } from '../ui';

/**
 * Every number on this page is a count of some subset of the data, and the
 * subset is what a reader wants next — so each one links to the list already
 * narrowed to it. The facets those links use are declared in the list views, so
 * a destination is a real filter a reader can then widen or change, never a
 * one-off page that only this view can produce.
 *
 * Four numbers are deliberately NOT links, because no filter would honestly
 * reproduce them: the citation totals (a count of PMIDs, not of records), and
 * the route-block totals (a count of pk[route] blocks, where the list's rows are
 * compounds — 796 blocks over 1,265 records do not line up, and a link that
 * quietly showed the wrong denominator would be worse than no link).
 */
export function homeView(ctx: Ctx): Node {
  const cov = ctx.coverage;
  const c = cov.compounds;
  const errors = ctx.findings.filter((f) => f.level === 'error').length;
  const warnings = ctx.findings.length - errors;

  // Per-step and per-modulator citation counts are not in CoverageReport.
  const steps = ctx.pathways.flatMap((p) => p.steps ?? []);
  const mods = ctx.pathways.flatMap((p) => p.modulators ?? []);
  const stepsCited = steps.filter((x) => x.source_pmid).length;
  const modsCited = mods.filter((x) => x.source_pmid).length;
  const n = (x: number): string => x.toLocaleString('en-US');

  /*
   * Record counts for the tiles whose coverage number is a ROW count. The list
   * views filter records, so these are what those destinations will report, and
   * a linked tile shows the number its own link produces.
   */
  const withOcc = ctx.compounds.filter((x) => (x.receptor_occupancy ?? []).length > 0).length;
  const withInt = ctx.compounds.filter((x) => (x.interactions ?? []).length > 0).length;
  const pathsUncitedSteps = ctx.pathways.filter((p) =>
    (p.steps ?? []).some((s) => !s.source_pmid),
  ).length;
  const pathsUncitedMods = ctx.pathways.filter((p) =>
    (p.modulators ?? []).some((m) => !m.source_pmid),
  ).length;

  const cmp = (q: Record<string, string>): string => href('compounds', q);
  const paths = (q: Record<string, string>): string => href('pathways', q);

  const stats = el(
    'div',
    { class: 'stats' },
    statLink(cmp({}), 'compounds', n(c.total), { title: 'every record in the catalog' }),
    statLink(cmp({ facet: 'pk' }), 'with authored PK', n(c.withPk), {
      cls: 'good',
      title: 'records carrying at least one authored pk[route] block',
    }),
    statLink(cmp({ facet: 'gap' }), 'explained PK gaps', n(c.pkUnauthored), {
      title: 'records with a declared pk_unauthored reason instead of a curve',
    }),
    statLink(cmp({ facet: 'unvisited' }), 'unvisited', c.unvisited.length, {
      cls: c.unvisited.length === 0 ? 'good' : 'bad',
      title: 'neither authored PK nor a recorded reason — the one number that must stay zero',
    }),
    // Route blocks are not records, so no compound filter reproduces these two.
    stat('PK route blocks', n(c.routeEntries)),
    stat('of those cited', n(c.routeEntriesCited)),
    /* Rows are not records, and a tile that says 302 must not open a list that
     * says 225. So a linked tile counts what its destination counts, and the row
     * total — the number the coverage report cares about — goes in the title. */
    statLink(cmp({ facet: 'occ' }), 'with occupancy', n(withOcc), {
      title: `${n(withOcc)} records carrying ${n(c.occupancyRows)} receptor_occupancy rows`,
    }),
    statLink(cmp({ facet: 'int' }), 'with interactions', n(withInt), {
      title: `${n(withInt)} records carrying ${n(c.interactionEdges)} interaction edges`,
    }),
    statLink(cmp({ facet: 'keo-fit' }), 'keo fitted', c.keoFitted, {
      title: 'effect compartment fitted from a published curve',
    }),
    statLink(cmp({ facet: 'keo-est' }), 'keo estimated', c.keoEstimated, {
      cls: 'warn',
      title: 'effect compartment declared as an estimate — a soft number',
    }),
    statLink(paths({}), 'pathways', cov.pathways.total, { title: 'every pathway' }),
    stat('pathway steps', n(cov.pathways.steps)),
    statLink(paths({ facet: 'uncited-steps' }), 'with uncited steps', n(pathsUncitedSteps), {
      cls: 'warn',
      title:
        `${n(pathsUncitedSteps)} pathways carry at least one of the ` +
        `${n(steps.length - stepsCited)} steps with no source_pmid`,
    }),
    stat('modulator rows', n(cov.pathways.modulators)),
    statLink(paths({ facet: 'uncited-mods' }), 'with uncited mods', n(pathsUncitedMods), {
      cls: 'warn',
      title:
        `${n(pathsUncitedMods)} pathways carry at least one of the ` +
        `${n(mods.length - modsCited)} modulators with no source_pmid`,
    }),
    statLink(href('targets', { kind: 'gpcr' }), 'GPCR targets', cov.targets.gpcrs, {
      title: 'IUPHAR/BPS GPCR nomenclature',
    }),
    statLink(href('targets', { kind: 'non-gpcr' }), 'non-GPCR targets', cov.targets.nonGpcr, {
      title: 'hand-curated enzymes, transporters, channels and nuclear receptors',
    }),
    // A count of PMIDs, not of records: no list of compounds has this length.
    stat('unique PMIDs', n(cov.citations.unique)),
  );

  const reasons = Object.entries(c.byUnauthoredReason).sort((a, b) => b[1] - a[1]);

  return frag(
    el('h1', null, 'Registry'),
    el(
      'p',
      { class: 'lede' },
      `${n(c.total)} compounds · ${cov.pathways.total} pathways · ` +
        `${cov.targets.gpcrs + cov.targets.nonGpcr} targets · ` +
        `${n(cov.citations.unique)} unique PMIDs`,
    ),
    el(
      'div',
      { class: 'cards' },
      link(
        '#/compounds',
        frag(el('b', null, 'Compounds'), el('span', null, `${n(c.total)} records`)),
        'tile',
      ),
      link(
        '#/pathways',
        frag(el('b', null, 'Pathways'), el('span', null, `${cov.pathways.total} mechanisms`)),
        'tile',
      ),
      link(
        '#/targets',
        frag(
          el('b', null, 'Targets'),
          el('span', null, `${cov.targets.gpcrs + cov.targets.nonGpcr} catalogued`),
        ),
        'tile',
      ),
      link(
        '#/health',
        frag(
          el('b', null, 'Health'),
          el(
            'span',
            null,
            ctx.findings.length === 0
              ? 'no lint findings'
              : `${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`,
          ),
        ),
        'tile',
      ),
    ),
    card(
      'Coverage',
      `${n(cov.citations.total)} citations in all`,
      el('p', { class: 'pad muted hint' }, 'Every count links to the records behind it.'),
      stats,
    ),
    card(
      'PK not authored, by reason',
      `${n(c.pkUnauthored)} compounds`,
      reasons.length
        ? table(
            [{ label: 'reason' }, { label: 'compounds', align: 'r' }],
            reasons.map(([reason, count]) => [
              link(cmp({ facet: 'gap', reason }), el('code', null, reason)),
              n(count),
            ]),
          )
        : el('p', { class: 'pad muted' }, 'None.'),
    ),
    card(
      'Gaps',
      null,
      table(
        [{ label: 'gap' }, { label: 'count', align: 'r' }, { label: 'of', align: 'r' }],
        [
          [
            link(cmp({ facet: 'unvisited' }), 'neither PK nor a reason'),
            c.unvisited.length,
            c.total,
          ],
          [link(cmp({ facet: 'untagged' }), 'no body system'), c.untagged.length, c.total],
          [
            link(cmp({ facet: 'keo-est' }), 'keo reasoned, not fitted'),
            c.keoEstimated,
            c.keoEstimated + c.keoFitted,
          ],
          [
            link(href('targets', { only: 'unknown' }), 'occupancy keys with no target'),
            cov.targets.occupancyKeysUnknown.length,
            cov.targets.occupancyKeysUsed,
          ],
          [
            /* The count is route blocks; the link lands on the compounds that
             * carry them, which is the nearest honest scoping of a per-block
             * number onto a per-record list. */
            link(cmp({ facet: 'uncited' }), 'PK route blocks with no source'),
            c.routeEntries - c.routeEntriesCited,
            c.routeEntries,
          ],
          [
            link(paths({ facet: 'no-recon' }), 'pathways with no Recon3D subsystem'),
            cov.pathways.total - cov.pathways.withRecon3dSubsystem,
            cov.pathways.total,
          ],
        ],
      ),
    ),
  );
}
