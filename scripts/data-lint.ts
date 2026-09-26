/**
 * data-lint.ts — run the registry's semantic checks and say what they found.
 *
 * The rules themselves are in `lint-rules.ts`, pure and reusable, because
 * `build-bundle` has to run the same ones before it will publish. This file is
 * the CLI around them: pick a catalog, print the findings, set the exit code.
 *
 * Run: `pnpm registry:lint` — reads the LIVE catalog out of Postgres, which is
 * the source of truth. `--from-json` reads the frozen cutover snapshot in
 * packages/registry/data instead, which is useful for exactly one thing:
 * comparing what authoring has changed since the cutover.
 *
 * Warnings do not fail the run; errors do.
 */
import { loadCatalog, originFromArgv } from './registry-source.ts';
import { lintRegistry, type LintPathway } from './lint-rules.ts';

async function main(): Promise<void> {
  const origin = originFromArgv();
  const catalog = await loadCatalog(origin);
  console.log(`data-lint: reading ${catalog.origin}`);

  const findings = lintRegistry({
    compounds: catalog.compounds as never,
    pathways: catalog.pathways as unknown as LintPathway[],
  });

  const errors = findings.filter((f) => f.level === 'error');
  const warnings = findings.filter((f) => f.level === 'warning');
  const counted = `${catalog.compounds.length} compounds · ${catalog.pathways.length} pathways`;

  if (findings.length === 0) {
    console.log(`data-lint: ${counted} · 0 errors · 0 warnings`);
    return;
  }
  for (const f of findings) {
    const tag = f.level === 'error' ? 'ERR ' : 'WARN';
    console.log(`${tag} ${f.slug.padEnd(28)} ${f.rule.padEnd(28)} ${f.message}`);
  }
  console.log(`\ndata-lint: ${counted} · ${errors.length} errors · ${warnings.length} warnings`);
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((e: unknown) => {
  console.error(`data-lint: ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
});
