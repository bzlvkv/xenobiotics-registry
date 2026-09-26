/**
 * 2026-07-11-mbi-perpetrator-tag.ts
 *
 * DDI1 (MBI half) — tag the interaction edges whose PERPETRATOR is a well-
 * established MECHANISM-BASED (time-dependent, "irreversible") CYP inhibitor with
 * `kinetics.mbi = true`, so the solver applies the enzyme-recovery persistence
 * tail (`mbiActivityEnvelope`) instead of the memoryless reversible form.
 *
 * WHAT THIS IS — and is NOT — authoring:
 *   `mbi` is a QUALITATIVE mechanism marker, not a fitted constant. It records a
 *   documented, textbook property of the perpetrator's mechanism (it inactivates
 *   the enzyme covalently → inhibition outlasts its plasma presence). It does NOT
 *   change the interaction DEPTH: that stays the already-cited `ki_uM` (the edge's
 *   existing `source_pmid` still anchors the magnitude, so the registry verifier's
 *   "kinetics needs a citation" rule remains satisfied). No k_inact / K_I is
 *   invented. We therefore do NOT write any new PMIDs into compounds.json — the
 *   change is purely the boolean, and this script + its review CSV are the
 *   provenance record for WHICH perpetrators were tagged and WHY.
 *
 * SCOPE — mechanism is a property of the perpetrator × enzyme, so we tag by
 * perpetrator, and only edges that already carry `ki_uM` (mbi pairs with a
 * reversible-depth Ki). The tagged set is the canonical mechanism-based CYP
 * inhibitors present in the registry:
 *
 *   CYP3A4:  clarithromycin, erythromycin (metabolite-intermediate complex),
 *            diltiazem, verapamil, bergamottin (grapefruit furanocoumarin),
 *            ritonavir, cobicistat (a purpose-built MBI)
 *   CYP2D6:  paroxetine
 *   CYP2C8:  gemfibrozil (via gemfibrozil-glucuronide)
 *
 * DELIBERATELY EXCLUDED (documented so the omission is a decision, not an oversight):
 *   - Azoles (itraconazole, ketoconazole, fluconazole, voriconazole, posaconazole)
 *     and fluvoxamine: potent but predominantly REVERSIBLE (tight-binding) — their
 *     long clinical duration comes from their own PK + tight Ki, not enzyme kill.
 *   - amiodarone: persistence is dominated by its own multi-week half-life; adding
 *     an enzyme-turnover tail on top would double-count.
 *   - fluoxetine, bupropion: predominantly reversible CYP2D6 inhibition.
 *
 * Idempotent: only sets `mbi` on a ki_uM edge from a listed perpetrator when it's
 * currently absent; re-run is a no-op and never clobbers a human edit.
 * Dry-run by default; pass --write to apply to compounds.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const CSV_PATH = join(__dirname, '..', 'out', 'mbi-perpetrator-review.csv');

interface Kinetics { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number; mbi?: boolean; }
interface InteractionRef { slug: string; name?: string; kinetics?: Kinetics; source_pmid?: string; [k: string]: unknown; }
interface Compound { slug: string; interactions?: InteractionRef[]; [k: string]: unknown; }

/** Perpetrator slug → the enzyme its mechanism-based inhibition targets (the
 *  enzyme is documentation only — the solver keys off the `mbi` flag + ki_uM). */
const MBI_PERPETRATORS: Record<string, string> = {
  clarithromycin: 'CYP3A4',
  erythromycin: 'CYP3A4',
  diltiazem: 'CYP3A4',
  verapamil: 'CYP3A4',
  bergamottin: 'CYP3A4',
  ritonavir: 'CYP3A4',
  cobicistat: 'CYP3A4',
  paroxetine: 'CYP2D6',
  gemfibrozil: 'CYP2C8',
};

const csvCell = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

function main(): void {
  const write = process.argv.includes('--write');
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  let tagged = 0, already = 0, skippedNoKi = 0;
  const perPerp: Record<string, number> = {};
  const csv: string[] = ['perpetrator,enzyme,victim,ki_uM,source_pmid,outcome'];

  for (const c of data) {
    const enzyme = MBI_PERPETRATORS[c.slug];
    if (!enzyme || !Array.isArray(c.interactions)) continue;
    for (const ref of c.interactions) {
      const k = ref.kinetics;
      if (!k || k.ki_uM == null) { if (k) skippedNoKi++; continue; } // mbi pairs with a Ki
      let outcome: string;
      if (k.mbi === true) { already++; outcome = 'already'; }
      else { if (write) k.mbi = true; tagged++; outcome = 'tagged'; perPerp[c.slug] = (perPerp[c.slug] || 0) + 1; }
      csv.push([c.slug, enzyme, ref.slug, String(k.ki_uM), ref.source_pmid ?? '', outcome].map(csvCell).join(','));
    }
  }

  writeFileSync(CSV_PATH, csv.join('\n') + '\n');
  console.log(`MBI perpetrators in scope: ${Object.keys(MBI_PERPETRATORS).length}`);
  console.log(`  ki_uM edges tagged mbi:true: ${tagged}`);
  console.log(`  already tagged:              ${already}`);
  console.log(`  non-ki edges skipped:        ${skippedNoKi}`);
  console.log('  per perpetrator:', JSON.stringify(perPerp));
  console.log(`review CSV → ${CSV_PATH}`);

  if (!write) {
    console.log('\nDRY-RUN — pass --write to apply `mbi` to compounds.json.');
    return;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWROTE ${tagged} mbi flags to compounds.json.`);
}

main();
