/**
 * 2026-05-27-wave32-missing-compounds.ts — add 11 common drugs missing from the
 * registry (audit gap): 5 NSAIDs, 4 antipsychotics, 2 depot hormones.
 *
 * Each is a full entry: mechanism, routes, doses, half_life_hr, pk (ka derived
 * from a sourced Tmax via the 1-comp relationship; zero-order for depot routes),
 * mw_g_mol (PubChem), refs, systems — plus receptor_occupancy + effect_compartment
 * where a clean Ki exists (antipsychotic D2/5-HT2A; NSAID whole-blood COX from
 * Warner 1999 PMID:10377455). Every PK PMID verified to resolve 2026-05-27.
 *
 * Notes:
 *  - ketorolac: COX occupancy SKIPPED — Warner's COX-1 IC50 (0.00019 µM) is an
 *    anomalous outlier that would saturate the donut; PK-only.
 *  - sulindac, nabumetone: PRODRUGS — PK half-life + COX are authored on the
 *    ACTIVE metabolite (sulindac sulfide / 6-MNA); mw_g_mol is the parent.
 *  - nabumetone PK is FDA-label-derived (no clean PK PMID) — pk.source omitted.
 *  - depot routes (paliperidone-IM, fluphenazine-IM, asenapine-TD, goserelin-SC,
 *    MPA-IM) use the zero-order model; ke from the molecular t½.
 *  - some Vd values are label/estimated (paliperidone 487 L, fluphenazine/asenapine
 *    large, MPA) — the pk.source_pmid is the compound's primary PK paper.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const LN2 = Math.log(2);

function ka(Tmax: number, hl: number): number {
  const ke = LN2 / hl;
  if (Tmax >= 1 / ke) return +ke.toFixed(4); // flip-flop guard (shouldn't trigger here)
  let lo = ke * 1.0000001, hi = ke * 1e6;
  const f = (k: number) => Math.log(k / ke) / (k - ke) - Tmax;
  for (let i = 0; i < 200; i++) { const m = Math.sqrt(lo * hi); if (f(m) > 0) lo = m; else hi = m; }
  const k = Math.sqrt(lo * hi);
  return k < 1 ? +k.toFixed(3) : +k.toFixed(2);
}
const dose = (min: number, max: number, typical: number, unit = 'mg') => ({ min, max, typical, unit });
const occ = (receptor: string, pathway: string, ec50: number, pmid: string, note: string) =>
  ({ receptor, pathway, emax: 1, ec50_mg_l: ec50, hill_n: 1, source_pmid: pmid, note });

const NEW: Record<string, unknown>[] = [
  // ── NSAIDs ────────────────────────────────────────────────────────────────
  {
    slug: 'ketorolac', name: 'Ketorolac', aliases: ['Toradol', 'ketorolac tromethamine'], category: 'pharmacological',
    systems: ['musculoskeletal'],
    mechanism: 'Non-selective COX inhibitor; an exceptionally potent short-term analgesic given IM/IV (opioid-level acute-pain relief). Use limited to ≤5 days (all routes combined) due to GI, renal, and bleeding risk.',
    routes: ['IV', 'IM', 'PO'],
    doses: { IV: dose(15, 30, 30), IM: dose(15, 60, 30), PO: dose(10, 40, 10) },
    half_life_hr: { IV: 5.09, IM: 5.09, PO: 5.09 },
    pk: {
      IV: { V_L: 13, F: 1.0, source_pmid: 'PMID:3264245' },
      IM: { ka_hr: ka(0.6, 5.09), V_L: 13, F: 1.0, source_pmid: 'PMID:3264245' },
      PO: { ka_hr: ka(0.85, 5.09), V_L: 13, F: 0.9, source_pmid: 'PMID:3264245' },
    },
    mw_g_mol: 255.27, refs: ['PMID:3264245', 'PMID:10377455'],
  },
  {
    slug: 'ketoprofen', name: 'Ketoprofen', aliases: ['Orudis', 'Oruvail'], category: 'pharmacological',
    systems: ['musculoskeletal'],
    mechanism: 'Non-selective (COX-1-preferential in whole blood) propionic-acid NSAID; short t½, dosed TID (IR) or once-daily (ER). Analgesic/anti-inflammatory.',
    routes: ['PO'], doses: { PO: dose(25, 75, 50) }, half_life_hr: { PO: 1.9 },
    pk: { PO: { ka_hr: ka(1.0, 1.9), V_L: 15, F: 0.95, source_pmid: 'PMID:7262174' } },
    mw_g_mol: 254.28, refs: ['PMID:7262174', 'PMID:10377455'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:10377455', note: 'Approximation; no published kₑₒ. COX inhibition tracks plasma; analgesic effect downstream.' },
    receptor_occupancy: [
      occ('cox_1', 'antiinflammatory', 0.011951, 'PMID:10377455', 'Warner 1999 human whole-blood assay (PNAS, PMC22126 Table 1): ketoprofen COX-1 IC50 0.047 µM. ec50 = 0.047 µM × 254.28 / 1000.'),
      occ('cox_2', 'antiinflammatory', 0.737412, 'PMID:10377455', 'Warner 1999 WBA: ketoprofen COX-2 IC50 2.9 µM. ec50 = 2.9 µM × 254.28 / 1000.'),
    ],
  },
  {
    slug: 'piroxicam', name: 'Piroxicam', aliases: ['Feldene'], category: 'pharmacological',
    systems: ['musculoskeletal'],
    mechanism: 'Non-selective COX inhibitor (oxicam/enolic-acid NSAID). Very long t½ (~38 h) enables once-daily dosing; substantial accumulation, steady state in 1–2 weeks.',
    routes: ['PO'], doses: { PO: dose(10, 20, 20) }, half_life_hr: { PO: 37.5 },
    pk: { PO: { ka_hr: ka(4, 37.5), V_L: 10, F: 0.95, source_pmid: 'PMID:512843' } },
    mw_g_mol: 331.35, refs: ['PMID:512843', 'PMID:10377455'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:10377455', note: 'Approximation; no published kₑₒ. COX inhibition tracks plasma.' },
    receptor_occupancy: [
      occ('cox_1', 'antiinflammatory', 0.795120, 'PMID:10377455', 'Warner 1999 WBA: piroxicam COX-1 IC50 2.4 µM. ec50 = 2.4 µM × 331.35 / 1000.'),
      occ('cox_2', 'antiinflammatory', 2.617665, 'PMID:10377455', 'Warner 1999 WBA: piroxicam COX-2 IC50 7.9 µM. ec50 = 7.9 µM × 331.35 / 1000.'),
    ],
  },
  {
    slug: 'sulindac', name: 'Sulindac', aliases: ['Clinoril'], category: 'pharmacological',
    systems: ['musculoskeletal'],
    mechanism: 'Prodrug NSAID (sulfoxide) reversibly reduced to the active sulindac sulfide (non-selective COX inhibitor) and irreversibly oxidized to inactive sulfone. The long-lived active sulfide drives efficacy; BID dosing.',
    routes: ['PO'], doses: { PO: dose(150, 200, 150) }, half_life_hr: { PO: 18 },
    pk: { PO: { ka_hr: ka(3, 18), V_L: 15, F: 0.88, source_pmid: 'PMID:300048' } },
    mw_g_mol: 356.41, refs: ['PMID:300048', 'PMID:10377455'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:300048', note: 'Approximation; no published kₑₒ. PD driven by the active metabolite sulindac sulfide (t½ ~18 h).' },
    receptor_occupancy: [
      occ('cox_1', 'antiinflammatory', 0.646760, 'PMID:10377455', 'Warner 1999 WBA values are for the ACTIVE sulindac sulfide: COX-1 IC50 1.9 µM. ec50 = 1.9 µM × 340.40 (sulfide MW) / 1000.'),
      occ('cox_2', 'antiinflammatory', 18.722000, 'PMID:10377455', 'Warner 1999 WBA: sulindac sulfide COX-2 IC50 55 µM. ec50 = 55 µM × 340.40 / 1000.'),
    ],
  },
  {
    slug: 'nabumetone', name: 'Nabumetone', aliases: ['Relafen'], category: 'pharmacological',
    systems: ['musculoskeletal'],
    mechanism: 'Prodrug NSAID — undetectable in plasma; rapidly biotransformed to the active 6-MNA (6-methoxy-2-naphthylacetic acid), a relatively COX-2-preferential inhibitor. Long 6-MNA t½ (~24 h) → once-daily dosing.',
    routes: ['PO'], doses: { PO: dose(1000, 2000, 1000) }, half_life_hr: { PO: 24 },
    pk: { PO: { ka_hr: ka(3, 24), V_L: 55, F: 0.8 } }, // FDA-label-derived PK (no clean PMID); 6-MNA active species
    mw_g_mol: 228.29, refs: ['PMID:10377455'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:10377455', note: 'Approximation; no published kₑₒ. PD driven by the active metabolite 6-MNA (t½ ~24 h).' },
    receptor_occupancy: [
      occ('cox_1', 'antiinflammatory', 9.081660, 'PMID:10377455', 'Warner 1999 WBA values are for the ACTIVE 6-MNA: COX-1 IC50 42 µM. ec50 = 42 µM × 216.23 (6-MNA MW) / 1000.'),
      occ('cox_2', 'antiinflammatory', 31.569580, 'PMID:10377455', 'Warner 1999 WBA: 6-MNA COX-2 IC50 146 µM (weak; mild COX-2 preference). ec50 = 146 µM × 216.23 / 1000.'),
    ],
  },
  // ── Antipsychotics ──────────────────────────────────────────────────────────
  {
    slug: 'paliperidone', name: 'Paliperidone', aliases: ['Invega', '9-hydroxyrisperidone', 'paliperidone palmitate'], category: 'pharmacological',
    systems: ['nervous'],
    mechanism: 'Atypical antipsychotic; D2 / 5-HT2A antagonist. It is the major active metabolite of risperidone (9-OH-risperidone) and is largely renally cleared. Oral ER tablet + 1-/3-month palmitate depot.',
    routes: ['PO', 'IM'],
    doses: { PO: dose(3, 12, 6), IM: dose(39, 234, 117) },
    half_life_hr: { PO: 24, IM: 24 },
    pk: {
      PO: { ka_hr: ka(20, 24), V_L: 487, F: 0.28, source_pmid: 'PMID:19713555' },
      IM: { zo_dur_hr: 672, V_L: 487, F: 1.0, source_pmid: 'PMID:18227146' }, // palmitate depot, ~monthly release
    },
    mw_g_mol: 426.48, refs: ['PMID:19713555', 'PMID:18227146', 'PMID:8935801'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:19713555', note: 'Approximation; no published kₑₒ. D2 occupancy lags plasma modestly (PET).' },
    receptor_occupancy: [
      occ('dopamine_d2', 'antagonist', 0.0011942, 'PMID:8935801', 'Schotte 1996 human cloned receptors: 9-OH-risperidone (= paliperidone) D2 Ki ≈ 2.8 nM. ec50 = 2.8 nM × 426.48 / 1e6.'),
      occ('5-HT2A', 'antagonist', 0.00010662, 'PMID:8935801', 'Schotte 1996: paliperidone 5-HT2A Ki ≈ 0.25 nM. ec50 = 0.25 nM × 426.48 / 1e6.'),
    ],
  },
  {
    slug: 'fluphenazine', name: 'Fluphenazine', aliases: ['Prolixin', 'Modecate', 'fluphenazine decanoate'], category: 'pharmacological',
    systems: ['nervous'],
    mechanism: 'High-potency phenothiazine (typical) antipsychotic; predominantly a D2 antagonist, also blocks 5-HT2A. Oral form has very low bioavailability (~3%, heavy first-pass); long-acting decanoate depot dosed q2–5 weeks.',
    routes: ['PO', 'IM'],
    doses: { PO: dose(2.5, 40, 10), IM: dose(12.5, 100, 25) },
    half_life_hr: { PO: 16.4, IM: 16.4 },
    pk: {
      PO: { ka_hr: ka(2.8, 16.4), V_L: 1500, F: 0.027, source_pmid: 'PMID:8911886' },
      IM: { zo_dur_hr: 504, V_L: 1500, F: 1.0, source_pmid: 'PMID:2286711' }, // decanoate depot
    },
    mw_g_mol: 437.52, refs: ['PMID:8911886', 'PMID:6787637', 'PMID:2286711', 'PMID:17826096', 'PMID:12629531'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:6787637', note: 'Approximation; no published kₑₒ. D2 occupancy lags plasma (PET).' },
    receptor_occupancy: [
      occ('dopamine_d2', 'antagonist', 0.00063, 'PMID:17826096', 'Per IUPHAR/GtoPdb (human D2, pKi 8.8 → Ki 1.44 nM); primary Sasse 2007. ec50 = 1.44 nM × 437.52 / 1e6.'),
      occ('5-HT2A', 'antagonist', 0.014, 'PMID:12629531', 'Per IUPHAR/GtoPdb (human 5-HT2A, pKi 7.5 → Ki 32 nM); primary Kroeze 2003. ec50 = 32 nM × 437.52 / 1e6.'),
    ],
  },
  {
    slug: 'ziprasidone', name: 'Ziprasidone', aliases: ['Geodon', 'Zeldox'], category: 'pharmacological',
    systems: ['nervous'],
    mechanism: 'Atypical antipsychotic; potent D2 / 5-HT2A antagonist. Notable for a clinically significant food effect (oral absorption ~doubles with a ≥500 kcal meal) and QT prolongation (hERG block). Oral + IM (acute agitation).',
    routes: ['PO', 'IM'],
    doses: { PO: dose(40, 160, 80), IM: dose(10, 40, 20) },
    half_life_hr: { PO: 7, IM: 3 },
    pk: {
      PO: { ka_hr: ka(6, 7), V_L: 105, F: 0.6, source_pmid: 'PMID:10771448' },
      IM: { ka_hr: ka(0.5, 3), V_L: 105, F: 1.0, source_pmid: 'PMID:16231965' },
    },
    mw_g_mol: 412.94, refs: ['PMID:10771448', 'PMID:16231965', 'PMID:9430133', 'PMID:12176106'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:10771448', note: 'Approximation; no published kₑₒ. D2 occupancy lags plasma (PET).' },
    receptor_occupancy: [
      occ('dopamine_d2', 'antagonist', 0.00115612, 'PMID:9430133', 'Per IUPHAR/GtoPdb (human D2, pKi 8.6 → Ki 2.8 nM); primary Arnt 1998. ec50 = 2.8 nM × 412.94 / 1e6.'),
      occ('5-HT2A', 'antagonist', 0.00028493, 'PMID:12176106', 'Per IUPHAR/GtoPdb (human 5-HT2A, pKi 8.8–9.5 range → geometric-mean Ki 0.69 nM); primary Kongsamut 2002. ec50 = 0.69 nM × 412.94 / 1e6.'),
    ],
  },
  {
    slug: 'asenapine', name: 'Asenapine', aliases: ['Saphris', 'Secuado'], category: 'pharmacological',
    systems: ['nervous'],
    mechanism: 'Atypical antipsychotic; very high-affinity D2 / 5-HT2A antagonist with a broad multireceptor profile. Given SUBLINGUALLY because swallowed oral bioavailability is near-zero (<2%, extensive first-pass); SL F ~35%. Also a once-daily transdermal patch.',
    routes: ['SL', 'TD'],
    doses: { SL: dose(5, 10, 5), TD: dose(3.8, 7.6, 5.7) },
    half_life_hr: { SL: 24, TD: 33 },
    pk: {
      SL: { ka_hr: ka(1, 24), V_L: 1500, F: 0.35, source_pmid: 'PMID:22936407' },
      TD: { zo_dur_hr: 24, V_L: 1500, F: 0.35, source_pmid: 'PMID:33734167' },
    },
    mw_g_mol: 285.79, refs: ['PMID:22936407', 'PMID:24793403', 'PMID:33734167', 'PMID:18308814'],
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:24793403', note: 'Approximation; no published kₑₒ. D2 occupancy lags plasma (PET).' },
    receptor_occupancy: [
      occ('dopamine_d2', 'antagonist', 0.00035986, 'PMID:18308814', 'Shahid 2009 verbatim: asenapine D2 pKi 8.9 (→ Ki 1.26 nM), human. ec50 = 1.26 nM × 285.79 / 1e6.'),
      occ('5-HT2A', 'antagonist', 0.00001803, 'PMID:18308814', 'Shahid 2009 verbatim: asenapine 5-HT2A pKi 10.2 (→ Ki 0.063 nM), human — among the most potent. ec50 = 0.063 nM × 285.79 / 1e6.'),
    ],
  },
  // ── Depot hormones ──────────────────────────────────────────────────────────
  {
    slug: 'goserelin', name: 'Goserelin', aliases: ['Zoladex'], category: 'hormone',
    systems: ['endocrine', 'reproductive'],
    mechanism: 'Synthetic decapeptide GnRH/LHRH agonist. Continuous depot exposure first causes a transient gonadotropin/sex-steroid surge ("flare"), then desensitizes pituitary GnRH receptors → castrate-level testosterone (men) or estradiol (women). Prostate/breast cancer, endometriosis.',
    routes: ['SC'], doses: { SC: dose(3.6, 10.8, 3.6) }, half_life_hr: { SC: 4.2 },
    pk: { SC: { zo_dur_hr: 672, V_L: 15, F: 1.0, source_pmid: 'PMID:10926349' } }, // 1-month depot; ke from 4.2 h elimination
    mw_g_mol: 1269.4, refs: ['PMID:10926349'],
  },
  {
    slug: 'medroxyprogesterone', name: 'Medroxyprogesterone', aliases: ['Provera', 'Depo-Provera', 'MPA', 'medroxyprogesterone acetate'], category: 'hormone',
    systems: ['endocrine', 'reproductive'],
    mechanism: 'Synthetic progestin (17α-hydroxyprogesterone derivative). Agonizes the progesterone receptor; suppresses pituitary LH/FSH to inhibit ovulation, thickens cervical mucus, transforms endometrium. Oral (HRT/amenorrhea/oncology) + IM depot (q3-month contraception).',
    routes: ['PO', 'IM'],
    doses: { PO: dose(2.5, 10, 5), IM: dose(150, 150, 150) },
    half_life_hr: { PO: 50, IM: 50 },
    pk: {
      PO: { ka_hr: ka(2, 50), V_L: 1000, F: 0.9, source_pmid: 'PMID:2943134' },
      IM: { zo_dur_hr: 2880, V_L: 1000, F: 1.0, source_pmid: 'PMID:2943134' }, // Depo-Provera; release ~120 d (label), molecular ke from 50 h
    },
    mw_g_mol: 386.52, refs: ['PMID:2943134', 'PMID:1388093', 'PMID:2971841'],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Record<string, unknown>[];
  const have = new Set(data.map(c => c.slug));
  let added = 0; const skip: string[] = [];
  for (const c of NEW) {
    if (have.has(c.slug)) { skip.push(c.slug as string); continue; }
    data.push(c);
    console.log(`  [add ] ${(c.slug as string).padEnd(20)} ${(c.routes as string[]).join('/')}  ${(c.receptor_occupancy as unknown[] | undefined)?.length ?? 0} occ`);
    added++;
  }
  data.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 32: +${added} compounds (${skip.length ? 'skipped ' + skip.join(', ') : 'none skipped'}).`);
}

main();
