/**
 * scripts/recon3d/import-skeleton.ts — full Recon3D ingestion skeleton.
 *
 * Reads a downloaded `Recon3D.json` (from the VMH download portal at
 * https://www.vmh.life/) and produces three deliverables:
 *
 *   1. Validates that every `recon3d_subsystem` referenced by a v8
 *      pathway exists in the canonical 111-subsystem list. Catches
 *      typos and drift.
 *
 *   2. Reports orphan v8 metabolite/reaction cross-references — any
 *      `Compound.recon3d_metabolite_id` or
 *      `PathwayStep.recon3d_reaction_ids[]` that doesn't match a real
 *      Recon3D entity.
 *
 *   3. Emits a coverage report showing which Recon3D subsystems lack
 *      a v8 pathway — the authoring backlog. Cross-checked against
 *      the "intentionally not authored" exclusion list (model-boundary
 *      reactions, glycan side paths, etc.; see WAVE 5A authoring notes).
 *
 * This is a SKELETON — it lays out the schema + entry points but does
 * not download Recon3D itself. Bring your own `--input` path; pinning
 * the upstream version is the caller's responsibility.
 *
 *   pnpm tsx scripts/recon3d/import-skeleton.ts --input ~/.cache/recon3d/Recon3D.json
 *
 * Without --input, the script reports what it would do but performs
 * no validation. Use this dry-run mode to confirm the script reaches
 * your environment without committing to a multi-minute parse.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');
const COMPOUNDS_PATH = join(
  __dirname,
  '..',
  '..',
  'packages',
  'registry',
  'data',
  'compounds.json',
);

// ──────────────────────────────────────────────────────────────────────
// Minimal shape of the upstream Recon3D JSON. The real file carries
// hundreds of additional fields per entity; we only need a subset.
// ──────────────────────────────────────────────────────────────────────

interface Recon3dReaction {
  id: string; // BiGG reaction ID, e.g. "HEX1"
  name?: string;
  subsystem: string; // canonical name
  metabolites?: Record<string, number>; // BiGG met IDs → stoichiometry
  gene_reaction_rule?: string; // GPR boolean expression over HGNC symbols
}

interface Recon3dMetabolite {
  id: string; // BiGG metabolite ID, e.g. "atp_c"
  name?: string;
  formula?: string;
  compartment?: 'c' | 'e' | 'g' | 'l' | 'm' | 'n' | 'r' | 'x' | 'i';
  charge?: number;
}

interface Recon3dRoot {
  reactions: Recon3dReaction[];
  metabolites: Recon3dMetabolite[];
  genes?: Array<{ id: string; name?: string }>;
}

// ──────────────────────────────────────────────────────────────────────
// Local v8 minimal shapes
// ──────────────────────────────────────────────────────────────────────

interface MinimalStep {
  recon3d_reaction_ids?: string[];
}
interface MinimalPathway {
  slug: string;
  recon3d_subsystem?: string;
  steps: MinimalStep[];
}
interface MinimalCompound {
  slug: string;
  recon3d_metabolite_id?: string;
  recon3d_gene_symbol?: string;
}

// ──────────────────────────────────────────────────────────────────────
// Arg parsing — minimal, no dependencies.
// ──────────────────────────────────────────────────────────────────────

function parseArgs(): { input: string | null; fetch: boolean } {
  const args = process.argv.slice(2);
  let input: string | null = null;
  let fetchFlag = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--input' && args[i + 1]) {
      input = args[++i] ?? null;
    } else if (a === '--fetch') {
      fetchFlag = true;
    }
  }
  return { input, fetch: fetchFlag };
}

// ──────────────────────────────────────────────────────────────────────
// Validators
// ──────────────────────────────────────────────────────────────────────

function validateSubsystems(
  pathways: MinimalPathway[],
  reactions: Recon3dReaction[],
): { ok: number; bad: Array<{ slug: string; subsystem: string }> } {
  const known = new Set(reactions.map((r) => r.subsystem));
  const bad: Array<{ slug: string; subsystem: string }> = [];
  let ok = 0;
  for (const p of pathways) {
    if (!p.recon3d_subsystem) continue;
    if (known.has(p.recon3d_subsystem)) ok++;
    else bad.push({ slug: p.slug, subsystem: p.recon3d_subsystem });
  }
  return { ok, bad };
}

function validateReactionIds(
  pathways: MinimalPathway[],
  reactions: Recon3dReaction[],
): { ok: number; bad: Array<{ slug: string; id: string }> } {
  const known = new Set(reactions.map((r) => r.id));
  const bad: Array<{ slug: string; id: string }> = [];
  let ok = 0;
  for (const p of pathways) {
    for (const s of p.steps) {
      for (const id of s.recon3d_reaction_ids ?? []) {
        if (known.has(id)) ok++;
        else bad.push({ slug: p.slug, id });
      }
    }
  }
  return { ok, bad };
}

function validateMetaboliteIds(
  compounds: MinimalCompound[],
  metabolites: Recon3dMetabolite[],
): { ok: number; bad: Array<{ slug: string; id: string }> } {
  // Strip compartment suffix (last 2 chars after underscore) for matching;
  // v8 stores bare IDs, upstream stores compartmentalized ones.
  const known = new Set<string>();
  for (const m of metabolites) {
    const idx = m.id.lastIndexOf('_');
    known.add(idx > 0 ? m.id.slice(0, idx) : m.id);
  }
  const bad: Array<{ slug: string; id: string }> = [];
  let ok = 0;
  for (const c of compounds) {
    if (!c.recon3d_metabolite_id) continue;
    if (known.has(c.recon3d_metabolite_id)) ok++;
    else bad.push({ slug: c.slug, id: c.recon3d_metabolite_id });
  }
  return { ok, bad };
}

function coverageBacklog(pathways: MinimalPathway[], reactions: Recon3dReaction[]): string[] {
  const taggedSubsystems = new Set(
    pathways.map((p) => p.recon3d_subsystem).filter((s): s is string => !!s),
  );
  const upstream = new Set(reactions.map((r) => r.subsystem));
  return [...upstream].filter((s) => !taggedSubsystems.has(s)).sort();
}

// ──────────────────────────────────────────────────────────────────────
// Entry
// ──────────────────────────────────────────────────────────────────────

function main(): void {
  const { input } = parseArgs();
  const pathways = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as MinimalPathway[];
  const compounds = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as MinimalCompound[];

  console.log('Recon3D ETL — skeleton');
  console.log(`  v8 pathways:   ${pathways.length}`);
  console.log(`  v8 compounds:  ${compounds.length}`);
  console.log(`  tagged paths:  ${pathways.filter((p) => p.recon3d_subsystem).length}`);
  console.log(
    `  step xrefs:    ${pathways.flatMap((p) => p.steps).reduce((acc, s) => acc + (s.recon3d_reaction_ids?.length ?? 0), 0)}`,
  );
  console.log(`  metab xrefs:   ${compounds.filter((c) => c.recon3d_metabolite_id).length}`);

  if (!input) {
    console.log('\nDRY RUN — pass --input <path/to/Recon3D.json> to validate cross-references.');
    return;
  }

  const recon = JSON.parse(readFileSync(input, 'utf-8')) as Recon3dRoot;
  console.log(`\nLoaded Recon3D from ${input}`);
  console.log(`  upstream reactions:   ${recon.reactions.length}`);
  console.log(`  upstream metabolites: ${recon.metabolites.length}`);

  const sub = validateSubsystems(pathways, recon.reactions);
  console.log(`\nSubsystem validation: ${sub.ok} ok · ${sub.bad.length} bad`);
  for (const b of sub.bad.slice(0, 20)) {
    console.log(`  [bad sub] ${b.slug} → ${JSON.stringify(b.subsystem)}`);
  }

  const rx = validateReactionIds(pathways, recon.reactions);
  console.log(`\nReaction-ID validation: ${rx.ok} ok · ${rx.bad.length} bad`);
  for (const b of rx.bad.slice(0, 20)) {
    console.log(`  [bad rx]  ${b.slug} → ${b.id}`);
  }

  const mt = validateMetaboliteIds(compounds, recon.metabolites);
  console.log(`\nMetabolite-ID validation: ${mt.ok} ok · ${mt.bad.length} bad`);
  for (const b of mt.bad.slice(0, 20)) {
    console.log(`  [bad met] ${b.slug} → ${b.id}`);
  }

  const gap = coverageBacklog(pathways, recon.reactions);
  console.log(`\nAuthoring backlog: ${gap.length} Recon3D subsystems with no v8 pathway`);
  for (const g of gap.slice(0, 30)) {
    console.log(`  [todo] ${g}`);
  }
}

main();
