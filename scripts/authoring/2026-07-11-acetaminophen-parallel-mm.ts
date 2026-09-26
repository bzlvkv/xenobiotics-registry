/**
 * 2026-07-11-acetaminophen-parallel-mm.ts
 *
 * E6 (Piece A data) — author acetaminophen (APAP) onto the parallel-pathway
 * elimination model now that the solver supports it (mm_vmax + mm_km saturable
 * pathway running IN PARALLEL with mm_linear_ke_hr first-order pathway).
 *
 * WHY the old flat 2.5 h linear model was a mis-fit: APAP sulfation SATURATES
 * within the therapeutic range (sulfation Km ≈ 14.7 mg/L; therapeutic Cmax after
 * 1 g ≈ 10–20 mg/L), so a single linear ke can't represent the real dose-
 * dependence (Slattery 1987, PMID:3829578: sulfate formation clearance falls 41%
 * from 0.5 g → 3 g). Single-pathway MM on the sulfation params alone would
 * over-predict t½ (~5 h) because it ignores the high-capacity glucuronidation
 * route that keeps clearing the drug.
 *
 * ALL PARAMETERS ARE PRIMARY-SOURCED — nothing back-calibrated:
 *   Reith 2009, PMID:18759860 (in vivo, 13 volunteers, simultaneous MM fit of
 *   BOTH conjugation pathways) reports, verbatim from the abstract:
 *     • sulphation:      Vmax 0.011 mmol/h/kg,  Km 0.097 mmol/L
 *     • glucuronidation: Vmax 0.97  mmol/h/kg,  Km 6.89  mmol/L
 *   Glucuronidation Km (6.89 mmol/L ≈ 1041 mg/L) is far above any realistic APAP
 *   Cp (even overdose ~300 mg/L), so it is ~first-order: its linear-equivalent
 *   rate kL = Vmax_gluc / Km_gluc. We author sulphation as the saturable MM
 *   pathway and glucuronidation as the parallel first-order pathway.
 *
 * INTERNAL CONSISTENCY CHECK (independent primaries — NOT used to fit anything):
 *   low-Cp total ke = Vmax_sulf/Km_sulf + kL ≈ 0.132 + 0.164 = 0.297 /h
 *     → t½ ≈ 2.34 h            (cf. literature 2–2.5 h)
 *     → CL = ke·V ≈ 17.8 L/h   (cf. Allegaert 2014 PMID:25342929: 16.7 L/h/70 kg;
 *                               Rawlins 1977 PMID:862649: 352 mL/min ≈ 21 L/h)
 *   The two Reith pathways reproduce the cited therapeutic half-life on their own.
 *
 * Unit conversion (per-kg body weight → per-L of distribution volume):
 *   Vmax[mg/L/h] = Vmax[mmol/h/kg] · REF_KG · MW[mg/mmol] / V_L[L]
 *   Km[mg/L]     = Km[mmol/L] · MW
 *   at REF_KG = 70 (REFERENCE_WEIGHT_KG) and the compound's authored V_L = 60 L.
 *   Body-weight allometry (scalePkForWeight) then scales Vmax + kL by w^−0.25.
 *
 * Provenance note: V_L/F/ka retain their prior source (PMID:7039926); the route
 * `source_pmid` is set to Reith (18759860) since the elimination MODEL — the
 * substantive change — is his. The schema carries one PMID per route; this script
 * is the full provenance record.
 *
 * Idempotent: only writes when the PO route has no mm_vmax yet (re-run = no-op).
 * Dry-run by default; pass --write to apply to compounds.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const REITH = 'PMID:18759860';
const MW = 151.16;        // g/mol (== mg/mmol)
const REF_KG = 70;        // REFERENCE_WEIGHT_KG
const V_L = 60;           // APAP authored central volume (L)

// Reith 2009 abstract primaries.
const VMAX_SULF_MMOL_H_KG = 0.011;
const KM_SULF_MMOL_L = 0.097;
const VMAX_GLUC_MMOL_H_KG = 0.97;
const KM_GLUC_MMOL_L = 6.89;

const round = (x: number, dp: number) => Number(x.toFixed(dp));

// Saturable sulphation → MM pathway.
const mm_vmax_per_hr = round((VMAX_SULF_MMOL_H_KG * REF_KG * MW) / V_L, 2);       // ≈ 1.94 mg/L/h
const mm_km_mg_per_l = round(KM_SULF_MMOL_L * MW, 2);                              // ≈ 14.66 mg/L
// High-capacity glucuronidation → first-order (Km ≫ Cp): kL = Vmax_gluc/Km_gluc.
const vmax_gluc_mg_l_h = (VMAX_GLUC_MMOL_H_KG * REF_KG * MW) / V_L;                // ≈ 171 mg/L/h
const km_gluc_mg_l = KM_GLUC_MMOL_L * MW;                                          // ≈ 1041 mg/L
const mm_linear_ke_hr = round(vmax_gluc_mg_l_h / km_gluc_mg_l, 3);                 // ≈ 0.164 /h

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; mm_vmax_per_hr?: number; mm_km_mg_per_l?: number; mm_linear_ke_hr?: number; source_pmid?: string; [k: string]: unknown; }
interface Compound { slug: string; pk?: Record<string, RoutePk>; [k: string]: unknown; }

function main(): void {
  const write = process.argv.includes('--write');
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  const keLow = mm_vmax_per_hr / mm_km_mg_per_l + mm_linear_ke_hr;
  console.log('Derived APAP parallel-MM params (from Reith 2009 PMID:18759860):');
  console.log(`  sulphation MM : Vmax=${mm_vmax_per_hr} mg/L/h, Km=${mm_km_mg_per_l} mg/L`);
  console.log(`  glucuronidation (first-order): kL=${mm_linear_ke_hr} /h  (Vmax_gluc≈${vmax_gluc_mg_l_h.toFixed(0)}/Km_gluc≈${km_gluc_mg_l.toFixed(0)})`);
  console.log(`  → low-Cp ke=${keLow.toFixed(3)}/h  t½=${(Math.LN2 / keLow).toFixed(2)} h  CL=${(keLow * V_L).toFixed(1)} L/h`);

  const apap = data.find(c => c.slug === 'acetaminophen');
  if (!apap?.pk) { console.log('acetaminophen not found or has no pk block — aborting.'); return; }

  let changed = 0;
  for (const route of ['PO', 'IV'] as const) {
    const r = apap.pk[route];
    if (!r) continue;
    if (r.mm_vmax_per_hr != null) { console.log(`  ${route}: already MM (skip)`); continue; }
    if (write) {
      r.mm_vmax_per_hr = mm_vmax_per_hr;
      r.mm_km_mg_per_l = mm_km_mg_per_l;
      r.mm_linear_ke_hr = mm_linear_ke_hr;
      r.source_pmid = REITH; // elimination model source; V/F/ka retain PMID:7039926
    }
    changed++;
    console.log(`  ${route}: ${write ? 'wrote' : 'would write'} MM + parallel-linear elimination`);
  }

  if (!write) { console.log('\nDRY-RUN — pass --write to apply to compounds.json.'); return; }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWROTE parallel-MM elimination to acetaminophen (${changed} route(s)).`);
}

main();
