/**
 * 2026-07-11-receptor-action-backfill.ts
 *
 * PD1b — promote receptor-binding DIRECTION from the overloaded `pathway` tag to
 * a first-class typed `action` field on receptor_occupancy sites.
 *
 * Layer 1 (this pass): the 18 `pathway` values that LITERALLY name the mode of
 * action (agonist / antagonist / inhibitor / partial-agonist / neutralizer, and
 * the explicit *_block(ade) / *_(re)uptake_inhibition tags) → a mechanical
 * re-typing of already-authored, already-sourced info. Zero fabrication: the
 * action is exactly what the pathway word already states, and for every mapping
 * the implied direction is IDENTICAL to today's apps/app receptors/direction.ts
 * heuristic — so pointing direction.ts at `action` causes no display regression.
 *
 * Layer 2 (deferred): the ~81 PHENOTYPIC sites (antiinflammatory / sedation /
 * analgesia / anesthesia / parasympatholysis / local_anesthesia / …) name an
 * EFFECT, not a mode. Inferring the mode needs the per-site note/mechanism prose,
 * so they are left UNAUTHORED (action absent) here — direction.ts keeps falling
 * back to the pathway heuristic (unchanged behavior) — and every one is written
 * to a review CSV for a later human authoring pass.
 *
 * Idempotent: only fills sites whose `action` is currently absent, so a re-run is
 * a no-op and a human-authored Layer-2 value is never clobbered.
 * Dry-run by default; pass --write to apply to compounds.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const CSV_PATH = join(__dirname, '..', 'out', 'receptor-action-review.csv');

type Action =
  | 'agonist' | 'partial_agonist' | 'inverse_agonist' | 'antagonist'
  | 'inhibitor' | 'blocker' | 'neutralizer' | 'pam' | 'nam'
  | 'substrate' | 'modulator' | 'unknown';

interface Site {
  receptor: string; pathway?: string; emax: number; ec50_mg_l: number;
  hill_n: number; action?: Action; source_pmid?: string; note?: string;
}
interface Compound { slug: string; receptor_occupancy?: Site[]; [k: string]: unknown; }

// Layer 1 — pathway word literally names the mode. Each entry's implied direction
// MATCHES receptors/direction.ts deriveDirection(pathway), so no display change.
const PATHWAY_ACTION: Record<string, Action> = {
  agonist: 'agonist',
  'partial-agonist': 'partial_agonist',
  'partial agonist': 'partial_agonist',
  antagonist: 'antagonist',
  inhibitor: 'inhibitor',
  neutralizer: 'neutralizer',
  serotonin_reuptake_inhibition: 'inhibitor',
  norepinephrine_reuptake_inhibition: 'inhibitor',
  dopamine_reuptake_inhibition: 'inhibitor',
  gaba_uptake_inhibition: 'inhibitor',
  neuromuscular_blockade: 'antagonist',
  neuromuscular_block: 'antagonist',
  angiotensin_blockade: 'antagonist',
  beta1_blockade: 'antagonist',
  mu_opioid_blockade: 'antagonist',
  ikr_block_qt: 'blocker',
  na_channel_block: 'blocker',
  ina_block_class_ia: 'blocker',
};

const norm = (p?: string) => (p ?? '').toLowerCase().trim();
const csvCell = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

function main(): void {
  const write = process.argv.includes('--write');
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  let sites = 0, filled = 0, already = 0, deferred = 0;
  const byAction: Record<string, number> = {};
  const csv: string[] = ['slug,receptor,pathway,note_snippet,assigned_action,layer'];

  for (const c of data) {
    const ro = c.receptor_occupancy;
    if (!Array.isArray(ro)) continue;
    for (const s of ro) {
      sites++;
      const mapped = PATHWAY_ACTION[norm(s.pathway)];
      let assigned = '', layer = '';
      if (s.action != null) {
        already++; assigned = s.action; layer = 'preexisting';
      } else if (mapped) {
        if (write) s.action = mapped;
        filled++; assigned = mapped; layer = 'direct';
        byAction[mapped] = (byAction[mapped] || 0) + 1;
      } else {
        deferred++; layer = 'DEFERRED(phenotypic)';
      }
      const noteSnip = (s.note ?? '').slice(0, 60).replace(/\s+/g, ' ');
      csv.push([c.slug, s.receptor, s.pathway ?? '', noteSnip, assigned, layer].map(csvCell).join(','));
    }
  }

  writeFileSync(CSV_PATH, csv.join('\n') + '\n');
  console.log(`receptor_occupancy sites: ${sites}`);
  console.log(`  Layer 1 filled (action authored): ${filled}`);
  console.log(`  already had action:               ${already}`);
  console.log(`  Layer 2 deferred (phenotypic):    ${deferred}  → unauthored, listed in CSV`);
  console.log('  actions assigned:', JSON.stringify(byAction));
  console.log(`review CSV → ${CSV_PATH}`);

  if (!write) {
    console.log('\nDRY-RUN — pass --write to apply `action` to compounds.json.');
    return;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWROTE ${filled} action values to compounds.json.`);
}

main();
