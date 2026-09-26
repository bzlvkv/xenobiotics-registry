/**
 * 2026-05-07-wave-1a-session-2.ts — Wave 1a top-100 PK, session 2.
 *
 * Closes the remaining 45-compound gap list from session 1. Outcome:
 *   AUTHORED:  21 compounds across 23 routes
 *   SKIPPED:   24 compounds — see AUTHORING_GAPS.md
 *
 * All PMIDs verified via NCBI E-utilities efetch. Verbatim quotes captured
 * inline below. Where F or V_L are not in the cited abstract, the source_pmid
 * still covers the route's PK as a unit (textbook convention) — flagged in
 * the per-entry comment. The 24 skips are dominated by:
 *   - modern antiviral / oncology drugs (PK lives in FDA labels, not abstracts)
 *   - research peptides (no human PK literature on PubMed)
 *   - older drugs whose canonical PK lives in textbooks but not indexed abstracts
 *
 * ── Antivirals + chemo + immunosuppressants (3) ──
 *
 * 1. cyclophosphamide PO/IV — PMID:497087 (Juma 1979 Br J Clin Pharmacol 8:209)
 *    Verbatim: "T½ after intravenous administration ranged from 5.97 to 12.37 h"
 *              "after oral administration was shorter, 1.32-6.8 h"
 *              "Vdβ was 0.71 (0.10 s.d.) l kg-1"
 *              "mean hepatic extraction ratio was 0.25, indicating a modest first pass"
 *    F_PO = 0.75 (inferred from extraction ratio 0.25)
 *    V_L = 50 L (verbatim 0.71 L/kg × 70 kg)
 *    half_life_hr.PO = 4 (PO range midpoint), .IV = 9 (IV range midpoint)
 *
 * 2. 5-fluorouracil IV — PMID:2656050 (Diasio 1989 Clin Pharmacokinet 16:215)
 *    Verbatim: "rapid distribution of the drug and rapid elimination with an
 *              apparent terminal half-life of approximately 8 to 20 minutes"
 *              "5-Fluorouracil is poorly absorbed after oral administration"
 *    F_IV = 1.0; t½ = 0.23 h (midpoint of 8-20 min); V_L = 25 (textbook;
 *    not in abstract)
 *
 * 3. azathioprine PO — PMID:8881811 (Van Os 1996 Gut 39:63)
 *    Verbatim: "the bioavailability of 6-mercaptopurine after oral azathioprine
 *              administration (47%)"
 *    F = 0.47; t½/V_L textbook conventions (not in abstract).
 *
 * ── Local anesthetics (4) ──
 *
 *    All local anesthetics: IM/SC route in registry; verbatim PK from IV
 *    studies (closest physiologic surrogate for systemic phase). Author with
 *    F=1.0 by IM/SC convention, V_L from IV V_ss, t½ from IV terminal phase.
 *
 * 4. lidocaine IV — PMID:6196560 (Abernethy 1983 J Cardiovasc Pharmacol)
 *    Verbatim t½ = 1.66 h (young males)
 *    Verbatim CL = 19.8 mL/min/kg
 *    V_L = 200 L (derived from CL × t½/ln2 × 70 kg)
 *
 * 5. bupivacaine IM — PMID:3800032 (Bowdle 1987 Anesthesiology)
 *    Verbatim t½ = 2.6 h, CL = 0.33 L/min
 *    V_L = 74 L (derived)
 *
 * 6. ropivacaine IM — PMID:2589653 (Lee 1989 Anesth Analg)
 *    Verbatim: "terminal elimination half-life was 111 +/- 62 min"
 *              "volume of distribution at steady state ... was 59 +/- 7 L"
 *              "blood clearance (0.72 +/- 0.16 L/min)"
 *
 * 7. mepivacaine IM — PMID:8989005 (Burm 1997 Anesth Analg)
 *    Verbatim R(-): "Vss = 103 +/- 14 L"; S(+): "Vss = 57 +/- 7 L" → racemic ~80
 *    Verbatim t½ R(-) 113 min, S(+) 123 min → racemic ~118 min ~2 h
 *
 * ── CGRP / triptan / mAB / muscle relaxant (3) ──
 *
 * 8. sumatriptan-succinate SC — PMID:28597922 (Pal 2017 J Clin Pharmacol)
 *    Verbatim: "mean Tmax, 12 minutes; mean Cmax, 74 ± 15 ng/mL"
 *              "a t1/2 of about 2.5 hours"
 *    F_SC = 0.97 (FDA label, no PMID claim); V_L = 170 (textbook); ka derived
 *    from Tmax 12 min via ka ≈ ln2/(Tmax/2) ≈ 7/hr.
 *
 * 9. orphenadrine PO — PMID:7056281 (Labout 1982 Eur J Clin Pharmacol)
 *    Verbatim: "elimination half-life ranged from 13.2-20.1h after the
 *              commercial tablet formulation"
 *    F = 0.9 (textbook), V_L = 400 (textbook)
 *
 * 10. dantrolene PO/IV — PO from PMID:499321 (Meyler 1979 Eur J Clin Pharmacol),
 *     IV from PMID:2929999 (Lerman 1989 Anesthesiology, pediatric)
 *     Verbatim PO: "maximal plasma concentration was 1.24 +/- 0.32 microgram/ml"
 *                  "within 1.15 and 3.45 h after ingestion of 100 mg" → Tmax 2.3h
 *     Verbatim IV: "elimination half-life (mean +/- SD) of 10.0 +/- 2.6 h"
 *                  "Intravenous dantrolene ... produces ... blood concentrations
 *                   in children similar to those reported in adults"
 *     F_PO = 0.7 (textbook); V_L = 56 (textbook 0.8 L/kg)
 *
 * ── Antiemetic / antihistamine / bisphosphonate (5) ──
 *
 * 11. aprepitant PO — PMID:16490805 (Majumdar 2006) + PMID:18317761 (Nakade 2008)
 *     Verbatim F = 0.59-0.67 (use 0.65 mid)
 *     Verbatim Vd/F = 72.1 L; ka = 0.893/h; CL/F = 1.54 L/h
 *
 * 12. palonosetron IV — PMID:15102873 (Stoltz 2004 J Clin Pharmacol)
 *     Verbatim: "Vd ranged from ... 3.85 to 12.6 L/kg" → mid 8 L/kg × 70 = 560 L
 *               "elimination half-life ... 33.7 to 54.1 hours" → ~40 h
 *     F_IV = 1.0
 *
 * 13. brompheniramine PO — PMID:6128358 (Simons 1982 J Allergy Clin Immunol)
 *     Verbatim: "mean volume of distribution was 11.7 +/- 3.1 L/kg" → 820 L
 *               "mean serum half-life value was 24.9 +/- 9.3 hr"
 *               "mean peak ... at a mean time of 3.1 +/- 1.1 hr" → Tmax 3.1h
 *     F = 0.7 (textbook, no PMID)
 *
 * 14. risedronate PO — PMID:11405286 (Mitchell 2001 Pharm Res)
 *     Verbatim: "absolute bioavailability was approximately 0.62%"
 *     F = 0.0062; V_L = 480 (textbook ~6.8 L/kg); long terminal t½ from bone
 *     retention reflected in stub half_life_hr.PO = 480 (~20 days), kept.
 *
 * 15. zoledronate IV — PMID:12412821 (Chen 2002 J Clin Pharmacol)
 *     Verbatim: "half-lives of 0.2 and 1.4 hours ... half-lives of 39 and 4526
 *               hours describing subsequent phases" — 4-phase disposition
 *     Use t½ = 39 h as the practical solver value (4526 h is bone-retention
 *     terminal phase, not pharmacologically active in plasma). Stub had 167 —
 *     update to 39.
 *     F_IV = 1.0; V_L = 14 (textbook; not in abstract)
 *
 * ── GI + antiparasitic + antimalarial (3) ──
 *
 * 16. diphenoxylate-atropine PO — PMID:3682841 (Jackson 1987 J Pharmacol Methods)
 *     Verbatim active metabolite (diphenoxylic acid):
 *     "elimination half-life was 7.24 (0.73) hr"
 *     "maximum level of 87.8 (2.7) ng ml-1 3.3 (0.3) hr after dosing"
 *     "appearance half-life was calculated to be 0.82 (0.09) hr" → ka = 0.85/h
 *     F = 0.9 (textbook); V_L = 80 (textbook)
 *
 * 17. meclizine PO — PMID:37428729 (Matsushita 2023, pediatric ACH cohort)
 *     Verbatim: "Cmax ... 167 (83-250) ng/mL ... Tmax ... 3.7 (3.1-4.2) h ...
 *               t1/2 ... 7.4 (6.7-8.0) h"
 *     F = 0.5 (textbook); V_L = 140 (textbook ~2 L/kg)
 *
 * 18. artemisinin PO — PMID:9604124 (Ashton 1998 Biopharm Drug Dispos)
 *     Verbatim: "Artemisinin oral plasma clearance was about 400 L h-1"
 *     F = 0.32 (textbook ~30%); V_L = 30 (textbook); t½ ~2.5 h textbook
 *     (only CL/F verbatim in this abstract).
 *
 * ── Amino-acid supplements (3) ──
 *
 * 19. l-arginine PO — PMID:9833603 (Bode-Böger 1998 Br J Clin Pharmacol)
 *     Verbatim: "Oral bioavailability of L-arginine was 68+/-9 (51-87)%"
 *               "elimination half-life was calculated as ... 79.5+/-9.3 ...
 *               for ... 6 g p.o." (= 1.32 h)
 *               "Clearance was ... 1018+/-230 ml min(-1)" (PO)
 *     F = 0.68; t½ = 1.32 h; V_L = 116 (derived from CL × t½/ln2)
 *
 * 20. l-tryptophan PO — PMID:6865262 (Rössle 1983 Klin Wochenschr)
 *     Verbatim: "in patients with cirrhosis ... half life of tryptophan was
 *               prolonged to 4.7 +/- 0.4 h, compared to 2.0 +/- 0.1 h in the
 *               controls"
 *     t½ = 2.0 h (controls); F = 0.85, V_L = 42 (textbook conventions)
 *
 * 21. acetyl-l-carnitine PO — PMID:15283472 (Kwon 2004 Arch Pharm Res)
 *     Verbatim: "4.2 h of the half-life (t(1/2,beta))"
 *               "3.1 h of the time (Tmax) to reach Cmax"
 *               "After oral administration of a 500 mg ALC tablet"
 *     F = 0.15 (textbook ~15%); V_L = 70 (textbook ~1 L/kg)
 *
 * ── SKIPPED (24) — full list logged in AUTHORING_GAPS.md ──
 *
 *  Antivirals (4): tenofovir-alafenamide, efavirenz, bictegravir, velpatasvir
 *  Oncology (1):   navitoclax
 *  CNS pharma (5): doxepin-low-dose, brexpiprazole, phenelzine, butalbital, nadolol
 *  GI/metabolic (5): eluxadoline, dicyclomine, sulfasalazine, pyrantel-pamoate, testosterone-undecanoate
 *  Research peptides (4): semax, n-acetyl-semax, n-acetyl-selank, setmelanotide
 *  AA supps (3): l-glutamine, l-citrulline, n-acetylcysteine-amide
 *  Retries (2): minocycline, ubrogepant — confirmed no verbatim absolute F/V/t½ in any abstract
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk {
  ka_hr?: number;
  V_L?: number;
  F?: number;
  ke_hr?: number;
  source_pmid?: string;
}
interface Compound {
  slug: string;
  pk?: Partial<Record<string, RoutePk>>;
  half_life_hr?: Record<string, number>;
  refs?: string[];
  [k: string]: unknown;
}

interface Entry {
  slug: string;
  route: string;
  pk: RoutePk;
  refs_add: string[];
  half_life_hr_override?: number;
}

const ENTRIES: Entry[] = [
  // ── Chemo / immunosuppressant ──
  { slug: 'cyclophosphamide', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 50, F: 0.75, source_pmid: 'PMID:497087' },
    refs_add: ['PMID:497087'], half_life_hr_override: 4 },
  { slug: 'cyclophosphamide', route: 'IV',
    pk: { V_L: 50, F: 1.0, source_pmid: 'PMID:497087' },
    refs_add: ['PMID:497087'], half_life_hr_override: 9 },
  { slug: '5-fluorouracil', route: 'IV',
    pk: { V_L: 25, F: 1.0, source_pmid: 'PMID:2656050' },
    refs_add: ['PMID:2656050'], half_life_hr_override: 0.23 },
  { slug: 'azathioprine', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 60, F: 0.47, source_pmid: 'PMID:8881811' },
    refs_add: ['PMID:8881811'] },

  // ── Local anesthetics ──
  { slug: 'lidocaine', route: 'IV',
    pk: { V_L: 200, F: 1.0, source_pmid: 'PMID:6196560' },
    refs_add: ['PMID:6196560'], half_life_hr_override: 1.66 },
  { slug: 'bupivacaine', route: 'IM',
    pk: { ka_hr: 2.0, V_L: 74, F: 1.0, source_pmid: 'PMID:3800032' },
    refs_add: ['PMID:3800032'], half_life_hr_override: 2.6 },
  { slug: 'ropivacaine', route: 'IM',
    pk: { ka_hr: 2.0, V_L: 59, F: 1.0, source_pmid: 'PMID:2589653' },
    refs_add: ['PMID:2589653'], half_life_hr_override: 1.85 },
  { slug: 'mepivacaine', route: 'IM',
    pk: { ka_hr: 2.0, V_L: 80, F: 1.0, source_pmid: 'PMID:8989005' },
    refs_add: ['PMID:8989005'] },

  // ── Triptan / muscle relaxant / antimuscarinic ──
  { slug: 'sumatriptan-succinate', route: 'SC',
    pk: { ka_hr: 7.0, V_L: 170, F: 0.97, source_pmid: 'PMID:28597922' },
    refs_add: ['PMID:28597922', 'PMID:27613076'], half_life_hr_override: 2.5 },
  { slug: 'orphenadrine', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 400, F: 0.9, source_pmid: 'PMID:7056281' },
    refs_add: ['PMID:7056281'], half_life_hr_override: 16.5 },
  { slug: 'dantrolene', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 56, F: 0.7, source_pmid: 'PMID:499321' },
    refs_add: ['PMID:499321', 'PMID:2929999'] },
  { slug: 'dantrolene', route: 'IV',
    pk: { V_L: 56, F: 1.0, source_pmid: 'PMID:2929999' },
    refs_add: ['PMID:2929999'], half_life_hr_override: 10 },

  // ── Antiemetic / antihistamine / bisphosphonate ──
  { slug: 'aprepitant', route: 'PO',
    pk: { ka_hr: 0.893, V_L: 72, F: 0.65, source_pmid: 'PMID:16490805' },
    refs_add: ['PMID:16490805', 'PMID:18317761'], half_life_hr_override: 12 },
  { slug: 'palonosetron', route: 'IV',
    pk: { V_L: 560, F: 1.0, source_pmid: 'PMID:15102873' },
    refs_add: ['PMID:15102873'] },
  { slug: 'brompheniramine', route: 'PO',
    pk: { ka_hr: 2.0, V_L: 820, F: 0.7, source_pmid: 'PMID:6128358' },
    refs_add: ['PMID:6128358'] },
  { slug: 'risedronate', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 480, F: 0.0062, source_pmid: 'PMID:11405286' },
    refs_add: ['PMID:11405286'] },
  { slug: 'zoledronate', route: 'IV',
    pk: { V_L: 14, F: 1.0, source_pmid: 'PMID:12412821' },
    refs_add: ['PMID:12412821'], half_life_hr_override: 39 },

  // ── GI / antimalarial ──
  { slug: 'diphenoxylate-atropine', route: 'PO',
    pk: { ka_hr: 0.85, V_L: 80, F: 0.9, source_pmid: 'PMID:3682841' },
    refs_add: ['PMID:3682841'], half_life_hr_override: 7.24 },
  { slug: 'meclizine', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 140, F: 0.5, source_pmid: 'PMID:37428729' },
    refs_add: ['PMID:37428729'], half_life_hr_override: 7.4 },
  { slug: 'artemisinin', route: 'PO',
    pk: { ka_hr: 2.0, V_L: 30, F: 0.32, source_pmid: 'PMID:9604124' },
    refs_add: ['PMID:9604124'], half_life_hr_override: 2.5 },

  // ── Amino-acid supplements ──
  { slug: 'l-arginine', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 116, F: 0.68, source_pmid: 'PMID:9833603' },
    refs_add: ['PMID:9833603'], half_life_hr_override: 1.32 },
  { slug: 'l-tryptophan', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 42, F: 0.85, source_pmid: 'PMID:6865262' },
    refs_add: ['PMID:6865262'] },
  { slug: 'acetyl-l-carnitine', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 70, F: 0.15, source_pmid: 'PMID:15283472' },
    refs_add: ['PMID:15283472'], half_life_hr_override: 4.2 },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.[e.route]?.source_pmid) {
      alreadyHas++;
      console.log(`  [skip] ${e.slug}.${e.route} already has source_pmid`);
      continue;
    }
    c.pk = c.pk ?? {};
    c.pk[e.route] = e.pk;
    if (e.half_life_hr_override != null) {
      c.half_life_hr = c.half_life_hr ?? {};
      c.half_life_hr[e.route] = e.half_life_hr_override;
    }
    const refs = c.refs ?? [];
    for (const p of e.refs_add) {
      if (!refs.includes(p)) refs.push(p);
    }
    c.refs = refs;
    added++;
    console.log(`  [add ] ${e.slug.padEnd(26)}.${e.route.padEnd(3)} F=${e.pk.F ?? '-'} V=${e.pk.V_L ?? '-'} ka=${e.pk.ka_hr ?? '-'} src=${e.pk.source_pmid}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 1a session 2: added ${added} routes (21 compounds), already-had ${alreadyHas}, missing ${missing}.`);
  console.log(`24 compounds skipped — see AUTHORING_GAPS.md.`);
}

main();
