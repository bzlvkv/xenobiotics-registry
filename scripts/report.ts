/**
 * report.ts — what is authored, and what is open.
 *
 * WHY THIS EXISTS AS CODE. Four documents used to hold these numbers by hand:
 * `ROADMAP.md`, the "current state" table in the data `README.md`,
 * `DATA_QUALITY_AUDIT.md` and `DATA_QUALITY_BACKLOG.md`. All four drifted, in the
 * same way and for the same reason — a coverage number is a claim about 1,200
 * records, and nobody re-counts 1,200 records to fix a markdown table. By the end
 * they disagreed with each other AND with the data, and a stale audit is worse
 * than no audit: it gets cited.
 *
 * So the numbers are derived on demand. They cannot be stale, because nothing
 * stores them. If you want to know the state of this dataset, you run this. If
 * you want to record the state of this dataset in prose, don't — link this.
 *
 * WHAT IT IS FOR. Deciding what to author next. `unvisited` is the number that
 * must reach zero: a compound with neither authored PK nor a `pk_unauthored`
 * reason has not been looked at, which is different from — and much worse than —
 * a compound someone examined and explained. Everything else here is depth:
 * which layers are thin, which occupancy keys point at nothing, which warnings
 * may be work and which are standing caveats over audited records.
 *
 * WHAT IT CANNOT TELL YOU. Whether any of it is correct. Coverage counts fields,
 * not truth; a fully-authored, fully-cited compound can be entirely wrong. See
 * `pnpm validate` for malformedness and `pnpm verify` for dead identifiers, and
 * note that neither of those proves correctness either.
 *
 * Usage:
 *   pnpm report
 *   pnpm report --json      # the same numbers, for an agent to plan from
 *
 * Always exits 0 on any state of the DATA — a thin catalog is not a failure, it is the
 * thing being reported. The one non-zero exit is a dataset it could not read at all,
 * because a report with no input is not a report; `pnpm validate` names the bad field.
 */

import {
  PK_DEFAULTS,
  STANDING_CAVEAT_RULES,
  coverage,
  lintRegistry,
  type Finding,
  type Registry,
} from '@xeno/registry';
import { DATA_DIR, readRegistry } from '@xeno/registry/read';

const USAGE = `usage: tsx scripts/report.ts [--json]`;
// `pnpm report | head` closes stdout early; that is the reader leaving, not a
// failure, and a stack trace from `node:net` in its place is pure noise.
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

/** How many items of a long list to name before summarising the rest. */
const SAMPLE = 12;

function fatal(message: string): never {
  console.error(`report: ${message}`);
  console.error(USAGE);
  process.exit(2);
}

function pct(n: number, total: number): string {
  return total === 0 ? '—' : `${((100 * n) / total).toFixed(1)}%`;
}

function table(headers: readonly string[], rows: readonly (readonly (string | number)[])[]): void {
  if (rows.length === 0) {
    console.log('_none_');
    console.log('');
    return;
  }
  const cells = rows.map((r) => r.map((c) => String(c)));
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...cells.map((r) => (r[i] ?? '').length)),
  );
  const line = (values: readonly string[]): string =>
    `| ${values.map((v, i) => v.padEnd(widths[i]!)).join(' | ')} |`;
  console.log(line(headers));
  console.log(`| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`);
  for (const row of cells) console.log(line(row));
  console.log('');
}

/** A long list of slugs/keys, named up to SAMPLE and then counted. */
function sample(items: readonly string[]): string {
  if (items.length === 0) return '—';
  const head = items.slice(0, SAMPLE).join(', ');
  return items.length > SAMPLE ? `${head} … +${items.length - SAMPLE} more` : head;
}

function countRows(record: Readonly<Record<string, number>>): (string | number)[][] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, n]) => [key, n]);
}

interface RuleTally {
  rule: string;
  level: Finding['level'];
  count: number;
  example: string;
  /** Audited and deliberate: reported, never worked. */
  standing: boolean;
}

/**
 * Stored PK values exactly equal to a consumer default.
 *
 * Twenty-nine route rows once stored V_L 35, the default volume, under a real
 * citation: a default wearing a source. No rule can call that wrong, since some
 * drugs really do have those values, so it is listed here for a human to read
 * against the cited abstract rather than raised as a warning.
 */
function storedDefaults(registry: Registry): string[] {
  const vDefaults = [PK_DEFAULTS.vLPerKg, PK_DEFAULTS.vLPerKgProtein].map(
    (perKg) => perKg * PK_DEFAULTS.referenceWeightKg,
  );
  const out: string[] = [];
  for (const c of registry.compounds) {
    for (const [route, pk] of Object.entries(c.pk ?? {})) {
      if (!pk) continue;
      const hits: string[] = [];
      if (pk.V_L != null && vDefaults.some((v) => Math.abs(pk.V_L! - v) < 1e-9)) {
        hits.push(`V_L ${pk.V_L}`);
      }
      if (route !== 'IV' && pk.F === PK_DEFAULTS.F) hits.push(`F ${pk.F}`);
      if (route !== 'IV' && pk.ka_hr === PK_DEFAULTS.kaPerHr) hits.push(`ka ${pk.ka_hr}`);
      if (hits.length) out.push(`${c.slug}.${route} (${hits.join(', ')})`);
    }
  }
  return out;
}

function tallyByRule(findings: readonly Finding[]): RuleTally[] {
  const byRule = new Map<string, RuleTally>();
  for (const f of findings) {
    const key = `${f.level}\u0000${f.rule}`;
    const hit = byRule.get(key);
    if (hit) hit.count += 1;
    else {
      byRule.set(key, {
        rule: f.rule,
        level: f.level,
        count: 1,
        example: f.entity,
        standing: STANDING_CAVEAT_RULES.has(f.rule),
      });
    }
  }
  const order = { error: 0, warning: 1 } as const;
  return [...byRule.values()].sort(
    (a, b) => order[a.level] - order[b.level] || b.count - a.count || a.rule.localeCompare(b.rule),
  );
}

function printMarkdown(registry: Registry, findings: readonly Finding[]): void {
  const cov = coverage(registry);
  const c = cov.compounds;
  const p = cov.pathways;
  const t = cov.targets;

  console.log(`# Registry coverage`);
  console.log('');
  console.log(
    `Read ${c.total} compounds · ${p.total} pathways · ${t.gpcrs + t.nonGpcr} targets from ` +
      `\`${DATA_DIR}\` on ${new Date().toISOString().slice(0, 10)}. Derived on demand — ` +
      `these numbers cannot be stale, and nothing else should restate them.`,
  );
  console.log('');

  console.log(`## Catalog`);
  console.log('');
  table(
    ['entity', 'count'],
    [
      ['compounds', c.total],
      ['pathways', p.total],
      ['pathway steps', p.steps],
      ['pathway modulators', p.modulators],
      ['GPCR targets', t.gpcrs],
      ['non-GPCR targets', t.nonGpcr],
      ['target families', t.families],
      ['citations (total)', cov.citations.total],
      ['citations (unique PMIDs)', cov.citations.unique],
    ],
  );

  console.log(`## PK: authored, explained, or unvisited`);
  console.log('');
  console.log(
    `\`unvisited\` is the only number here that must be zero: neither authored PK nor a ` +
      `recorded reason for its absence means nobody has looked at the compound.`,
  );
  console.log('');
  table(
    ['state', 'compounds', 'share'],
    [
      ['authored PK (>=1 route)', c.withPk, pct(c.withPk, c.total)],
      ['explained (pk_unauthored)', c.pkUnauthored, pct(c.pkUnauthored, c.total)],
      ['unvisited', c.unvisited.length, pct(c.unvisited.length, c.total)],
    ],
  );
  if (c.unvisited.length > 0) console.log(`Unvisited: ${sample(c.unvisited)}\n`);

  console.log(`## Why PK is unauthored`);
  console.log('');
  table(['reason', 'compounds'], countRows(c.byUnauthoredReason));

  console.log(`## Depth by layer`);
  console.log('');
  table(
    ['layer', 'compounds', 'share'],
    [
      ['molecular weight', c.withMw, pct(c.withMw, c.total)],
      ['half-life', c.withHalfLife, pct(c.withHalfLife, c.total)],
      ['receptor occupancy', c.withOccupancy, pct(c.withOccupancy, c.total)],
      ['effect compartment', c.withEffectCompartment, pct(c.withEffectCompartment, c.total)],
      ['interactions', c.withInteractions, pct(c.withInteractions, c.total)],
      ['nutrition', c.withNutrition, pct(c.withNutrition, c.total)],
    ],
  );
  table(
    ['row-level', 'count', 'note'],
    [
      ['pk route blocks', c.routeEntries, ''],
      [
        'route blocks cited',
        c.routeEntriesCited,
        `${pct(c.routeEntriesCited, c.routeEntries)} of route blocks`,
      ],
      ['occupancy rows', c.occupancyRows, ''],
      ['interaction edges', c.interactionEdges, ''],
      ['ke0 fitted', c.keoFitted, 'from a measured effect curve'],
      ['ke0 estimated', c.keoEstimated, 'approximated: true — soft number'],
    ],
  );

  console.log(`## Compounds by category`);
  console.log('');
  table(['category', 'compounds'], countRows(c.byCategory));

  console.log(`## Compounds by body system`);
  console.log('');
  console.log(
    `A compound may carry several systems, so these sum above the catalog total. ` +
      `${c.untagged.length} compound${c.untagged.length === 1 ? ' carries' : 's carry'} none.`,
  );
  console.log('');
  table(['system', 'compounds'], countRows(c.bySystem));
  if (c.untagged.length > 0) console.log(`Untagged: ${sample(c.untagged)}\n`);

  console.log(`## Pathways`);
  console.log('');
  table(['category', 'pathways'], countRows(p.byCategory));
  console.log(
    `${p.withRecon3dSubsystem} of ${p.total} pathways (${pct(p.withRecon3dSubsystem, p.total)}) ` +
      `map to a Recon3D subsystem, across ${Object.keys(p.subsystems).length} subsystems.`,
  );
  console.log('');
  table(
    ['Recon3D subsystem', 'pathways', 'slugs'],
    Object.entries(p.subsystems)
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .map(([subsystem, slugs]) => [subsystem, slugs.length, sample(slugs)]),
  );

  console.log(`## Targets`);
  console.log('');
  table(
    ['metric', 'count'],
    [
      ['GPCRs catalogued', t.gpcrs],
      ['non-GPCR targets catalogued', t.nonGpcr],
      ['families', t.families],
      ['occupancy keys used by compounds', t.occupancyKeysUsed],
      ['occupancy keys no target catalogs', t.occupancyKeysUnknown.length],
    ],
  );
  if (t.occupancyKeysUnknown.length > 0) {
    console.log(
      `Uncatalogued occupancy keys — each is a receptor view that cannot resolve: ` +
        `${sample(t.occupancyKeysUnknown)}\n`,
    );
  }

  const tally = tallyByRule(findings);
  const errors = findings.filter((f) => f.level === 'error').length;
  const work = tally.filter((r) => !r.standing);
  const standing = tally.filter((r) => r.standing);
  console.log(`## Open lint findings by rule`);
  console.log('');
  console.log(
    `${errors} error${errors === 1 ? '' : 's'} · ${findings.length - errors} warning` +
      `${findings.length - errors === 1 ? '' : 's'}. Errors fail \`pnpm validate\`. Read a ` +
      `warning's rule before acting on it: authoring/HYGIENE.md R16 says to suspect the rule first.`,
  );
  console.log('');
  console.log(`### Findings that may be work`);
  console.log('');
  table(
    ['level', 'rule', 'findings', 'e.g.'],
    work.map((r) => [r.level, r.rule, r.count, r.example]),
  );
  if (standing.length > 0) {
    console.log(`### Standing caveats: audited, not a backlog`);
    console.log('');
    console.log(
      `Every record these rules name was already audited, and the value is absent BECAUSE ` +
        `no source stated it. Closing one means inventing the number the audit removed. ` +
        `They stay visible so a reader knows the record rests on a default.`,
    );
    console.log('');
    table(
      ['level', 'rule', 'findings', 'e.g.'],
      standing.map((r) => [r.level, r.rule, r.count, r.example]),
    );
  }

  const defaults = storedDefaults(registry);
  console.log(`## Stored values equal to a default`);
  console.log('');
  console.log(
    `${defaults.length} route rows store a value exactly equal to a consumer default ` +
      `(F ${PK_DEFAULTS.F}, V ${PK_DEFAULTS.vLPerKg} L/kg, ka ${PK_DEFAULTS.kaPerHr}/h). Some are ` +
      `real measurements; check each against its cited abstract (HYGIENE R6).`,
  );
  if (defaults.length > 0) console.log(`\n${defaults.join(', ')}\n`);
}

function main(): void {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return;
  }
  for (const arg of argv) if (arg !== '--json') fatal(`unknown argument ${arg}`);

  let registry: Registry;
  try {
    registry = readRegistry();
  } catch (err) {
    // A report is not a gate, but it cannot report on data it could not read.
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`report: could not load the registry from ${DATA_DIR}\n  ${detail}`);
    console.error(`report: run \`pnpm validate\` for the field-level detail.`);
    process.exitCode = 1;
    return;
  }

  const findings = lintRegistry(registry);

  if (json) {
    console.log(
      JSON.stringify(
        {
          read: {
            dir: DATA_DIR,
            compounds: registry.compounds.length,
            pathways: registry.pathways.length,
            generated: new Date().toISOString(),
          },
          coverage: coverage(registry),
          lint: {
            errors: findings.filter((f) => f.level === 'error').length,
            warnings: findings.filter((f) => f.level === 'warning').length,
            byRule: tallyByRule(findings),
          },
          storedDefaults: storedDefaults(registry),
        },
        null,
        2,
      ),
    );
    return;
  }

  printMarkdown(registry, findings);
}

main();
