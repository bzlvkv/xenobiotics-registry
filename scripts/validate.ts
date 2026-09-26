/**
 * validate.ts — the offline gate.
 *
 * WHY THIS EXISTS. Every other check in this repo costs a network round trip or
 * a human. This one costs a second, so it is the one that runs on every edit. It
 * answers two questions and no others:
 *
 *   1. Does the data still PARSE? `@xeno/registry/read` pushes all three files
 *      through the zod schemas and throws with the offending record and the field
 *      path inside it, so a compound that grew a typo'd route or lost a required
 *      unit fails here rather than in a browser three commits later.
 *   2. Does the data still obey its own RULES? `lintRegistry` is the accumulated
 *      set of invariants the schema cannot express — an occupancy key no target
 *      catalogs, a dose with no route, a citation-free PK block, a pathway
 *      modulator pointing at a slug that no longer exists.
 *
 * WHAT IT CANNOT PROVE. That any value is TRUE. Every number here could be
 * internally consistent, correctly typed, cross-referenced and cited, and still
 * wrong, because a schema cannot read a paper. `pnpm verify` proves the
 * identifiers resolve; only a human reading the abstract proves the number came
 * from it. Treat a green run as "nothing is malformed", never as "this is right".
 *
 * ERRORS fail the run. WARNINGS never do. Some are a backlog; four are standing
 * caveats over already-audited records (`STANDING_CAVEAT_RULES`), and a warning
 * that blocked the build would be closed by inventing the number an audit
 * removed. `pnpm report` separates the two.
 *
 * BASELINES. About a hundred warnings are always present, and several rules
 * report the whole catalog on one line, so a new defect often changes a count
 * inside an existing message rather than adding a line. `--save` records the
 * findings before a batch and `--since` prints only what differs after it.
 *
 * Filters (`--rule`, `--errors-only`) narrow what is PRINTED, never what counts.
 * An error hidden by a filter still fails the run and still gets announced —
 * otherwise a filter would be a way to make a red gate look green.
 *
 * Usage:
 *   pnpm validate
 *   pnpm validate --errors-only
 *   pnpm validate --rule receptor.unknown-target --rule pk.pmid
 *   pnpm validate --save /tmp/before.json      # before a batch
 *   pnpm validate --since /tmp/before.json     # after each edit: new and resolved only
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { LINT_RULES, lintRegistry, type Finding, type Registry } from '@xeno/registry';
import { DATA_DIR, readRegistry } from '@xeno/registry/read';

const USAGE =
  'usage: tsx scripts/validate.ts [--errors-only] [--rule <id>]... [--save <file>] [--since <file>]';
// `pnpm validate | head` closes stdout early; that is the reader leaving, not a
// failure, and a stack trace from `node:net` in its place is pure noise.
//
// It exits with the verdict reached so far, NOT with 0. `main` sets the failing
// code the moment it knows the data is bad and before it prints a line, so a run
// cut short mid-print still exits 1. Exiting 0 here made `set -o pipefail; pnpm
// validate | head` report a clean gate over a dataset with errors in it — the
// same lie the `--rule`/`--errors-only` filters are careful not to tell.
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(process.exitCode == null ? 0 : Number(process.exitCode));
  throw err;
});

interface Options {
  rules: Set<string>;
  errorsOnly: boolean;
  save?: string;
  since?: string;
}

function parseArgs(argv: readonly string[]): Options {
  const rules = new Set<string>();
  let errorsOnly = false;
  let save: string | undefined;
  let since: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--errors-only') {
      errorsOnly = true;
    } else if (arg === '--rule') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) fatal(`--rule needs a rule id`);
      rules.add(value);
    } else if (arg.startsWith('--rule=')) {
      const value = arg.slice('--rule='.length);
      if (!value) fatal(`--rule needs a rule id`);
      rules.add(value);
    } else if (arg === '--save' || arg === '--since') {
      const value = argv[++i];
      if (!value || value.startsWith('--')) fatal(`${arg} needs a file path`);
      if (arg === '--save') save = value;
      else since = value;
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      // A mistyped flag must not be ignored: a gate that silently drops
      // `--errors-onlyy` reports on a different question than it was asked.
      fatal(`unknown argument ${arg}`);
    }
  }
  // An unknown id used to print "no findings" and read as a clean result, which
  // is how a mistyped filter makes a broken record look fine.
  const unknown = [...rules].filter((r) => !LINT_RULES[r]);
  if (unknown.length > 0) {
    fatal(
      `not a rule id: ${unknown.join(', ')} (see LINT_RULES in packages/registry/src/rules.ts)`,
    );
  }
  return { rules, errorsOnly, ...(save ? { save } : {}), ...(since ? { since } : {}) };
}

const findingKey = (f: Finding): string => `${f.level}|${f.entity}|${f.rule}|${f.message}`;

function readBaseline(path: string): Set<string> {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Finding[];
    return new Set(raw.map(findingKey));
  } catch (err) {
    fatal(`could not read the baseline ${path}: ${message(err)}`);
  }
}

function fatal(message: string): never {
  console.error(`validate: ${message}`);
  console.error(USAGE);
  process.exit(2);
}

/** The loader's own message already names the offending record and the field
 *  path inside it, so that is the whole of what a curator needs. A stack trace
 *  here would only add frames from `node:fs` and the ESM loader. */
function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

/** What the run read, printed before any verdict. A gate that does not say what
 *  it read is a gate you cannot trust twice. */
function describeInput(registry: Registry): string {
  const { compounds, pathways, receptors } = registry;
  return (
    `validate: read ${compounds.length} compounds · ${pathways.length} pathways · ` +
    `${receptors.receptors.length} GPCRs + ${receptors.nonGpcrTargets.length} non-GPCR targets\n` +
    `          from ${DATA_DIR}`
  );
}

function printFindings(findings: readonly Finding[]): void {
  if (findings.length === 0) return;
  const levelWidth = Math.max(...findings.map((f) => f.level.length));
  const entityWidth = Math.min(38, Math.max(...findings.map((f) => f.entity.length)));
  const ruleWidth = Math.min(32, Math.max(...findings.map((f) => f.rule.length)));
  console.log('');
  for (const f of findings) {
    const level = f.level.toUpperCase().padEnd(levelWidth);
    const entity = f.entity.padEnd(entityWidth);
    const rule = f.rule.padEnd(ruleWidth);
    console.log(`${level}  ${entity}  ${rule}  ${f.message}`);
  }
}

function main(): void {
  const started = performance.now();
  const opts = parseArgs(process.argv.slice(2));

  let registry: Registry;
  try {
    registry = readRegistry();
  } catch (err) {
    console.error(`validate: could not load the registry from ${DATA_DIR}`);
    console.error(indent(message(err)));
    console.error(`\nvalidate: FAIL — the data did not parse, so nothing was linted.`);
    process.exitCode = 1;
    return;
  }

  console.log(describeInput(registry));

  const all = lintRegistry(registry);
  const errors = all.filter((f) => f.level === 'error');
  const warnings = all.filter((f) => f.level === 'warning');
  // Set the verdict BEFORE printing anything, so a reader who closes the pipe
  // (see the EPIPE handler above) still gets the failing code.
  if (errors.length > 0) process.exitCode = 1;

  if (opts.save) {
    writeFileSync(opts.save, JSON.stringify(all, null, 2) + '\n');
    console.log(`validate: saved ${all.length} findings to ${opts.save}`);
  }
  const baseline = opts.since ? readBaseline(opts.since) : null;
  const shown = all.filter(
    (f) =>
      (opts.rules.size === 0 || opts.rules.has(f.rule)) &&
      (!opts.errorsOnly || f.level === 'error') &&
      (!baseline || !baseline.has(findingKey(f))),
  );
  printFindings(shown);
  if (baseline) {
    const now = new Set(all.map(findingKey));
    const resolved = [...baseline].filter((k) => !now.has(k)).length;
    console.log('');
    console.log(
      `validate: since ${opts.since}: ${shown.length} new or changed finding` +
        `${shown.length === 1 ? '' : 's'} shown above, ${resolved} no longer reported. ` +
        `A changed catalog-level count shows up here as a new line.`,
    );
  }

  const hiddenErrors = errors.length - shown.filter((f) => f.level === 'error').length;
  if (hiddenErrors > 0) {
    console.log('');
    console.log(
      `validate: ${hiddenErrors} error${hiddenErrors === 1 ? '' : 's'} not shown by your ` +
        `filters — they still fail this run. Re-run without --rule/--errors-only to see them.`,
    );
  }
  if (opts.rules.size > 0) {
    const clean = [...opts.rules].filter((r) => !all.some((f) => f.rule === r));
    if (clean.length > 0) {
      console.log(`validate: no findings for ${clean.join(', ')}; the rule passes.`);
    }
  }

  const ms = Math.round(performance.now() - started);
  const verdict = errors.length === 0 ? 'PASS' : 'FAIL';
  console.log('');
  console.log(
    `validate: ${errors.length} error${errors.length === 1 ? '' : 's'} · ` +
      `${warnings.length} warning${warnings.length === 1 ? '' : 's'} over ` +
      `${registry.compounds.length} compounds, ${registry.pathways.length} pathways and ` +
      `${registry.receptors.receptors.length + registry.receptors.nonGpcrTargets.length} targets ` +
      `(${ms} ms) — ${verdict}`,
  );
  if (warnings.length > 0 && errors.length === 0) {
    console.log(
      `validate: warnings do not fail the gate. \`pnpm report\` groups them by rule and marks the standing caveats.`,
    );
  }
  if (errors.length > 0 && opts.rules.size === 0 && !opts.errorsOnly) {
    console.log(`validate: \`--errors-only\` prints just the ${errors.length} above the warnings.`);
  }
}

main();
