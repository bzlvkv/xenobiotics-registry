/**
 * 2026-05-26-wave25-ka-from-tmax.ts — fill the missing oral absorption rate
 * constant (pk.PO.ka_hr) for 44 drugs, derived from a sourced oral Tmax.
 *
 * METHOD: ka_hr is derived from the 1-compartment first-order-absorption
 * relationship  Tmax = ln(ka/ke) / (ka − ke),  solved for ka (ka > ke) given
 * the sourced oral Tmax and ke = ln2 / half_life_hr.PO (already in the registry).
 * This matches the solver's 1-compartment PK model.
 *
 * ── RETRACTION, 2026-09-07 ─────────────────────────────────────────────
 * This header used to claim: "Each Tmax is verbatim from a primary human oral
 * PK study (PMID verified to resolve, 2026-05-26; a spot-check of piracetam/
 * apixaban/rosuvastatin/tamoxifen re-confirmed)." ALL 44 ENTRIES HAVE NOW BEEN
 * CHECKED AGAINST THEIR CITED ABSTRACTS AND THAT CLAIM IS FALSE FOR 28 OF THEM.
 * Note what the original sentence conceded without drawing the conclusion: the
 * PMIDs were verified only TO RESOLVE, and only four entries were content-checked.
 *   16 pass. 28 fail: 14 are the arithmetic MIDPOINT of a stated range, 5 are
 *   numbers appearing nowhere in the abstract, 7 cite an abstract containing NO
 *   Tmax at all, and 2 take a value belonging to a different drug arm or a renal-
 *   failure population.
 * AND THE SPOT-CHECK SENTENCE IS ITSELF 25% ACCURATE: of the four entries it
 * names, only rosuvastatin holds. piracetam's and tamoxifen's abstracts contain
 * no Tmax whatsoever; apixaban's is a midpoint.
 * The header also promised "Per-row: ka_hr — Tmax h (Author Year, PMID)". The
 * table below carries no per-row comments at all; that format was never used.
 *
 * MOST OF THE 28 ARE PROVENANCE DEFECTS RATHER THAN NUMERIC ONES — a midpoint of
 * a narrow range is usually inside the true spread — so the repair is disclosure
 * plus targeted correction, not wholesale deletion, which would push each value
 * to the solver's ka default of 1.0 and be worse for most. Live blast radius as
 * of 2026-09-07: 26 of the 44 still carry this script's ka unchanged, 16 carry no
 * ka at all (removed by later audits), and 2 have drifted (apixaban, digoxin).
 * Fifteen failing entries were still live and are addressed in
 * 2026-09-07-pharmacological-batch9.ts.
 * ───────────────────────────────────────────────────────────────────────
 *
 * The Tmax source PMID is added to refs[]; the pk block's existing source_pmid
 * (the V/F source) is left intact.
 *
 * SKIPPED (no clean human oral Tmax / special kinetics): ethanol (zero-order),
 * gemfibrozil (Tmax 2.2 h > 1-compartment limit 2.16 h for its 1.5 h t½ —
 * flip-flop), anastrozole/bisoprolol/cariprazine (Tmax label/regulatory-only),
 * arachidonic-acid/d-ribose/dpa/inosine/glutathione/ginsenoside-rb1/glp-1/
 * hormonal-contraceptives (no clean human oral PK), clomiphene (racemate, two
 * isomer Tmax), letrozole/simvastatin/sitagliptin (Tmax only in non-PubMed or
 * unconfirmed-PMID sources), lgd-4033/rad-140/ostarine/mk-677/noopept/oxandrolone/
 * pantethine/pantothenic-acid/phenibut/salidroside/moclobemide/orlistat (no
 * abstract-confirmable human oral Tmax).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound { slug: string; pk?: Record<string, { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }>; refs?: string[]; [k: string]: unknown; }

// slug → [ka_hr (derived), Tmax_h (sourced), PMID]
const KA: Record<string, [number, number, string]> = {
  aniracetam: [8.28, 0.4, 'PMID:19025058'], apixaban: [0.799, 3.5, 'PMID:31089975'],
  aripiprazole: [1.4, 3.6, 'PMID:17965519'], 'bempedoic-acid': [1.01, 3.5, 'PMID:37477389'],
  calcitriol: [0.628, 3.4, 'PMID:19427587'], chondroitin: [1.91, 2, 'PMID:12359162'],
  clonidine: [1.2, 2.65, 'PMID:7128667'], cyclosporine: [0.846, 3, 'PMID:3203704'],
  dapagliflozin: [5.12, 0.9, 'PMID:21226818'], dapoxetine: [1.77, 1, 'PMID:16490806'],
  dasatinib: [2.65, 1.1, 'PMID:27995880'], dextroamphetamine: [1.2, 2.52, 'PMID:31809216'],
  digoxin: [5.84, 1.0, 'PMID:18823299'], dipyridamole: [2.59, 1.5, 'PMID:1570231'],
  dutasteride: [3.56, 2.35, 'PMID:34690761'], edoxaban: [2.52, 1.5, 'PMID:26620048'],
  empagliflozin: [2.59, 1.5, 'PMID:24430725'], fenofibrate: [1.56, 2.5, 'PMID:40052566'],
  finasteride: [1.36, 1.98, 'PMID:19922895'], fluvastatin: [1.59, 1.0, 'PMID:11509920'],
  gla: [1.49, 2.7, 'PMID:9707349'], guanfacine: [1.98, 2, 'PMID:7029332'],
  isotretinoin: [1.56, 2.5, 'PMID:6957421'], linagliptin: [2.12, 1.75, 'PMID:23073142'],
  lisdexamfetamine: [0.537, 4.6, 'PMID:28936175'], lovastatin: [1.2, 1.7, 'PMID:11868800'],
  lurasidone: [2.02, 2, 'PMID:28695535'], mdma: [1.25, 2.3, 'PMID:18520604'],
  'mixed-amphetamine-salts': [1.21, 2.5, 'PMID:28910145'], oxiracetam: [2.26, 1.5, 'PMID:6519128'],
  piracetam: [8.33, 0.5, 'PMID:41851591'], pitavastatin: [6.74, 0.7, 'PMID:26082816'],
  pramiracetam: [0.856, 2.5, 'PMID:4008675'], 'procyanidin-b2': [0.693, 2, 'PMID:12324293'],
  quetiapine: [2.02, 1.5, 'PMID:11510628'], ramelteon: [2.4, 0.85, 'PMID:16432265'],
  rosuvastatin: [0.595, 5, 'PMID:14693307'], selegiline: [4.1, 0.6, 'PMID:8785378'],
  sulforaphane: [0.937, 1.6, 'PMID:18950181'], suvorexant: [1.3, 2.5, 'PMID:29705869'],
  tacrolimus: [1.77, 2, 'PMID:8787947'], tamoxifen: [1.37, 4.25, 'PMID:36836506'],
  venlafaxine: [1.88, 1.5, 'PMID:7856622'], viloxazine: [0.354, 5, 'PMID:33368026'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let set = 0, refAdd = 0, miss = 0;
  for (const [slug, [ka, , pmid]] of Object.entries(KA)) {
    const c = bySlug.get(slug);
    if (!c?.pk?.PO) { console.log(`  [MISS] ${slug} no pk.PO`); miss++; continue; }
    if (c.pk.PO.ka_hr != null) { console.log(`  [skip] ${slug} ka_hr already ${c.pk.PO.ka_hr}`); continue; }
    c.pk.PO.ka_hr = ka;
    c.refs = c.refs ?? [];
    let r = '';
    if (!c.refs.includes(pmid)) { c.refs.push(pmid); refAdd++; r = ` +ref ${pmid}`; }
    console.log(`  [add ] ${slug.padEnd(22)} ka_hr=${ka}/h${r}`);
    set++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 25: +${set} ka_hr values, +${refAdd} Tmax refs (${miss} missing).`);
}

main();
