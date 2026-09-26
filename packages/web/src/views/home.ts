import type { Ctx } from '../ctx';
import { card, el, frag, link, stat, table } from '../ui';

export function homeView(ctx: Ctx): Node {
  const cov = ctx.coverage;
  const c = cov.compounds;
  const errors = ctx.findings.filter((f) => f.level === 'error').length;
  const warnings = ctx.findings.length - errors;

  // Per-step and per-modulator citation counts are not in CoverageReport.
  const stepsCited = ctx.pathways.flatMap((p) => p.steps ?? []).filter((x) => x.source_pmid).length;
  const modsCited = ctx.pathways
    .flatMap((p) => p.modulators ?? [])
    .filter((x) => x.source_pmid).length;
  const n = (x: number): string => x.toLocaleString('en-US');

  const stats = el(
    'div',
    { class: 'stats' },
    stat('compounds', c.total.toLocaleString('en-US')),
    stat('with authored PK', c.withPk.toLocaleString('en-US')),
    stat('explained PK gaps', c.pkUnauthored.toLocaleString('en-US')),
    stat('unvisited', c.unvisited.length, c.unvisited.length === 0 ? 'good' : 'bad'),
    stat('PK route blocks', c.routeEntries.toLocaleString('en-US')),
    stat('of those cited', c.routeEntriesCited.toLocaleString('en-US')),
    stat('occupancy rows', c.occupancyRows.toLocaleString('en-US')),
    stat('interaction edges', c.interactionEdges.toLocaleString('en-US')),
    stat('keo fitted', c.keoFitted),
    stat('keo estimated', c.keoEstimated, 'warn'),
    stat('pathways', cov.pathways.total),
    stat('pathway steps', cov.pathways.steps.toLocaleString('en-US')),
    stat('steps cited', n(stepsCited), 'warn'),
    stat('modulator rows', cov.pathways.modulators.toLocaleString('en-US')),
    stat('modulators cited', n(modsCited), 'warn'),
    stat('GPCR targets', cov.targets.gpcrs),
    stat('non-GPCR targets', cov.targets.nonGpcr),
    stat('unique PMIDs', cov.citations.unique.toLocaleString('en-US')),
  );

  const reasons = Object.entries(c.byUnauthoredReason).sort((a, b) => b[1] - a[1]);

  return frag(
    el('h1', null, 'Registry'),
    el(
      'p',
      { class: 'lede' },
      `${n(c.total)} compounds · ${cov.pathways.total} pathways · ` +
        `${cov.targets.gpcrs + cov.targets.nonGpcr} targets · ` +
        `${cov.citations.unique.toLocaleString('en-US')} unique PMIDs`,
    ),
    el(
      'div',
      { class: 'cards' },
      link(
        '#/compounds',
        frag(
          el('b', null, 'Compounds'),
          el('span', null, `${c.total.toLocaleString('en-US')} records`),
        ),
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
    card('Coverage', `${cov.citations.total.toLocaleString('en-US')} citations in all`, stats),
    card(
      'PK not authored, by reason',
      `${c.pkUnauthored.toLocaleString('en-US')} compounds`,
      reasons.length
        ? table(
            [{ label: 'reason' }, { label: 'compounds', align: 'r' }],
            reasons.map(([reason, n]) => [el('code', null, reason), n.toLocaleString('en-US')]),
          )
        : el('p', { class: 'pad muted' }, 'None.'),
    ),
    card(
      'Gaps',
      null,
      table(
        [{ label: 'gap' }, { label: 'count', align: 'r' }, { label: 'of', align: 'r' }],
        [
          ['neither PK nor a reason', c.unvisited.length, c.total],
          ['no body system', c.untagged.length, c.total],
          ['keo reasoned, not fitted', c.keoEstimated, c.keoEstimated + c.keoFitted],
          [
            link('#/targets', 'occupancy keys with no target'),
            cov.targets.occupancyKeysUnknown.length,
            cov.targets.occupancyKeysUsed,
          ],
          ['PK route blocks with no source', c.routeEntries - c.routeEntriesCited, c.routeEntries],
          [
            'pathways with no Recon3D subsystem',
            cov.pathways.total - cov.pathways.withRecon3dSubsystem,
            cov.pathways.total,
          ],
        ],
      ),
    ),
  );
}
