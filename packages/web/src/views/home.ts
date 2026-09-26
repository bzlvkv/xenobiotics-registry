import type { Ctx } from '../ctx';
import { card, chip, el, frag, link, stat, table } from '../ui';

export function homeView(ctx: Ctx): Node {
  const cov = ctx.coverage;
  const c = cov.compounds;
  const errors = ctx.findings.filter((f) => f.level === 'error').length;
  const warnings = ctx.findings.length - errors;

  /*
   * Per-step and per-modulator citations are NOT in CoverageReport, and the
   * pathway layer is the one place the "everything is cited" story is untrue —
   * so count them here rather than let the lede claim otherwise. Counted, not
   * written into the prose, so the sentence cannot drift from the files.
   */
  const steps = ctx.pathways.flatMap((p) => p.steps ?? []);
  const mods = ctx.pathways.flatMap((p) => p.modulators ?? []);
  const stepsCited = steps.filter((s) => s.source_pmid).length;
  const modsCited = mods.filter((m) => m.source_pmid).length;
  const occRows = ctx.compounds.flatMap((x) => x.receptor_occupancy ?? []);
  const occCited = occRows.filter((r) => r.source_pmid).length;
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
    stat('steps cited per step', n(stepsCited), 'warn'),
    stat('modulator rows', cov.pathways.modulators.toLocaleString('en-US')),
    stat('modulators cited per row', n(modsCited), 'warn'),
    stat('GPCR targets', cov.targets.gpcrs),
    stat('non-GPCR targets', cov.targets.nonGpcr),
    stat('unique PMIDs', cov.citations.unique.toLocaleString('en-US')),
  );

  const reasons = Object.entries(c.byUnauthoredReason).sort((a, b) => b[1] - a[1]);

  return frag(
    el('h1', null, 'A cited pharmacology registry'),
    el(
      'p',
      { class: 'lede' },
      `${n(c.total)} compounds, ${cov.pathways.total} pathways and ` +
        `${cov.targets.gpcrs + cov.targets.nonGpcr} receptor and non-GPCR targets. The compound side is where ` +
        `the sourcing is strongest — ${n(c.routeEntriesCited)} of ${n(c.routeEntries)} PK route blocks cite a ` +
        `paper or a named regulatory label, ${n(occCited)} of ${n(occRows.length)} occupancy rows name a PMID — ` +
        `and the ${n(c.pkUnauthored)} ` +
        'compounds with no PK state a reason instead of leaving the cell empty. ',
      `The pathway layer is thinner: ${n(stepsCited)} of ${n(cov.pathways.steps)} steps and ${n(modsCited)} of ` +
        `${n(cov.pathways.modulators)} modulator rows carry a citation of their own, the rest resting on their ` +
        "pathway's record-level refs. ",
      'This client is the reader for that work: find a record, see exactly what it stores, follow every ' +
        'citation, and see what the linter says about it.',
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
      'Explained PK gaps',
      `${c.pkUnauthored.toLocaleString('en-US')} compounds`,
      el(
        'p',
        { class: 'pad sub' },
        'A compound with no PK is not an oversight when it says why. These are the declared reasons; ',
        el(
          'a',
          { href: `${import.meta.env.BASE_URL}GAPS.md`, target: '_blank', rel: 'noreferrer' },
          'GAPS.md',
        ),
        ' carries the per-cell ledger with the PMIDs that were chased.',
      ),
      reasons.length
        ? table(
            [{ label: 'reason' }, { label: 'compounds', align: 'r' }],
            reasons.map(([reason, n]) => [el('code', null, reason), n.toLocaleString('en-US')]),
          )
        : el('p', { class: 'pad muted' }, 'None.'),
    ),
    card(
      'Where the data is thin',
      null,
      table(
        [{ label: 'gap' }, { label: 'count', align: 'r' }, { label: '' }],
        [
          [
            'compounds with neither PK nor a reason',
            c.unvisited.length,
            c.unvisited.length ? chip('must be 0', 'error') : chip('clear', 'accent'),
          ],
          [
            'compounds with no body system',
            c.untagged.length,
            // Not null: a blank third cell reads as an unfinished row rather than
            // as the clean result it is. Same shape as the two rows around it.
            c.untagged.length ? chip('untagged', 'warn') : chip('all tagged', 'accent'),
          ],
          [
            'effect compartments reasoned, not fitted',
            c.keoEstimated,
            `of ${c.keoEstimated + c.keoFitted} — flagged as estimates throughout`,
          ],
          [
            'occupancy keys with no catalogued target',
            cov.targets.occupancyKeysUnknown.length,
            link('#/targets', 'see targets'),
          ],
          [
            'PK route blocks with no citation',
            c.routeEntries - c.routeEntriesCited,
            c.routeEntries === c.routeEntriesCited
              ? chip('every block cited', 'accent')
              : chip('needs a source_pmid or source_label', 'warn'),
          ],
          [
            'pathways mapped to a Recon3D subsystem',
            cov.pathways.withRecon3dSubsystem,
            `of ${cov.pathways.total}`,
          ],
        ],
      ),
    ),
  );
}
