/**
 * 2026-05-03-mw-backfill-wave-0a.ts — second MW backfill pass.
 *
 * Wave 0a per packages/registry/data/ROADMAP.md: author mw_g_mol for
 * the small-molecule "perpetrator universe" — every compound with a
 * single, unambiguous molecular weight that could plausibly appear as
 * a CYP / UGT / transporter perpetrator or victim. This is the hard
 * prereq for Wave 2 DDI authoring (data-lint blocks any kinetics edge
 * whose perpetrator lacks mw_g_mol).
 *
 * MW is pure chemistry — every value below is the PubChem-listed
 * parent / free-base molecular weight (rounded to 2 decimals where
 * standard atomic weights apply). Salts use the salt MW only when the
 * drug is universally dosed as that salt; otherwise the active moiety
 * (free base / free acid) is the canonical value. No PMID needed.
 *
 * Skipped (deliberately, not gaps to fix later):
 *   - Polymers (cholestyramine, colesevelam, hyaluronic-acid sizes)
 *   - Antibodies / proteins / siRNA (insulin, inclisiran, all 21
 *     biologics, all 62 peptides)
 *   - Plant extracts with multiple actives (adaptogens, shilajit,
 *     curcumin-meriva, tocotrienols mix, silymarin, omega-3-epa-dha)
 *   - Class entries (bhb-salt, hormonal-contraceptives)
 *
 * Idempotent: re-running on already-MW'd compounds is a no-op.
 *
 * Run:  pnpm tsx scripts/authoring/2026-05-03-mw-backfill-wave-0a.ts
 * Then: pnpm registry:lint  (warning count drops; no new errors)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const MW: Record<string, number> = {
  // ── Pharmacological / drugs (free base unless noted) ──────────────
  'dapoxetine':              305.41,
  'dasatinib':               488.01,
  'dipyridamole':            504.62,
  'dutasteride':             528.53,
  'edoxaban':                548.06,    // free base; tosylate is 720.20
  'emoxypine':               137.18,    // mexidol; free base
  'fenofibrate':             360.83,
  'finasteride':             372.55,
  'fluvastatin':             411.47,    // free acid; sodium salt is 433.45
  'guanfacine':              246.09,    // free base; HCl salt 282.55
  'hydrocodone':             299.36,
  'isotretinoin':            300.44,
  'letrozole':               285.30,
  'levodopa':                197.19,
  'levothyroxine':           776.87,    // T4 free acid; Na salt is 798.85 (the dosed form)
  'lgd-4033':                338.25,
  'linagliptin':             472.54,
  'liothyronine':            650.97,    // T3
  'lovastatin':              404.55,
  'lurasidone':              492.68,    // free base; HCl 529.14
  'methotrexate':            454.45,
  'mixed-amphetamine-salts': 135.21,    // d-amphetamine free base as the active moiety
  'mk-677':                  528.66,    // ibutamoren
  'moclobemide':             268.74,
  'nandrolone-decanoate':    428.65,
  'nitroglycerin':           227.09,
  'orlistat':                495.74,
  'ostarine':                389.33,    // enobosarm / MK-2866
  'oxandrolone':             306.44,
  'oxycodone':               315.36,
  'phenytoin':               252.27,    // free acid; Na salt 274.25
  'pitavastatin':            421.46,    // free acid; Ca salt 880.97
  'pramiracetam':            269.39,
  'rad-140':                 393.79,    // testolone
  'ramelteon':               259.34,
  'ru-58841':                369.39,
  'selegiline':              187.28,    // free base; HCl 223.74
  'stanozolol':              328.50,
  'sulbutiamine':            702.94,
  'suvorexant':              450.92,
  'tramadol':                263.38,    // free base; HCl 299.84
  'viloxazine':              237.30,
  'vortioxetine':            298.45,
  'ldn':                     341.41,    // low-dose naltrexone — same molecule as naltrexone

  // ── Alkaloids ──────────────────────────────────────────────────────
  'morphine':                285.34,
  'vinpocetine':             350.45,
  'yohimbine':               354.44,

  // ── Stimulants / sympathomimetics ─────────────────────────────────
  'phenylephrine-otc':       167.21,    // free base; HCl 203.67

  // ── Lipids (single fatty-acid molecules) ──────────────────────────
  'gla':                     278.43,    // gamma-linolenic acid
  'mct-c6':                  116.16,    // caproic acid
  'mct-c8':                  144.22,    // caprylic acid
  'mct-c10':                 172.27,    // capric acid

  // ── Topicals (single small-molecule actives) ──────────────────────
  'adapalene':               412.52,
  'avobenzone':              310.39,
  'azelaic-acid':            188.22,
  'bakuchiol':               256.39,
  'glycolic-acid':           76.05,
  'kojic-acid':              142.11,
  'lactic-acid-topical':     90.08,
  'mandelic-acid':           152.15,
  'niacinamide':             122.13,    // also a B3 form
  'octinoxate':              290.40,    // octyl methoxycinnamate
  'salicylic-acid-topical':  138.12,
  'tazarotene':              351.46,
  'tranexamic-acid-topical': 157.21,
  'tretinoin':               300.44,    // all-trans retinoic acid
  'trifarotene':             459.55,
  'zinc-oxide':              81.38,

  // ── Vitamins (single-molecule forms) ──────────────────────────────
  'adenosylcobalamin':       1579.58,   // coenzyme B12
  'benfotiamine':            466.46,    // S-acyl thiamine derivative
  'calcifediol':             400.64,    // 25-OH-D3
  'calcitriol':              416.64,    // 1,25-(OH)₂-D3
  'ergocalciferol':          396.65,    // vitamin D2
  'folic-acid':              441.40,
  'hydroxocobalamin':        1346.37,
  'menadione':               172.18,    // vitamin K3
  'mk4':                     444.65,    // menaquinone-4
  'mk7':                     649.0,     // menaquinone-7
  'niacin':                  123.11,
  'p5p':                     247.14,    // pyridoxal 5'-phosphate
  'pantethine':              554.72,
  'pantothenic-acid':        219.23,
  'r5p':                     230.11,    // ribose-5-phosphate (when in vitamin context)
  'retinol':                 286.45,    // vitamin A1 alcohol
  'vitamin-b12-methylcobalamin': 1344.40,
  'vitamin-k2-mk7':          649.0,     // alias for mk7

  // ── Amino acids (free α-amino acid form) ──────────────────────────
  'alanine':                 89.09,
  'asparagine':              132.12,
  'aspartate':               133.10,    // aspartic acid
  'glutamate':               147.13,    // glutamic acid
  'histidine':               155.15,
  'homocysteine':            135.18,
  'hydroxyproline':          131.13,
  'hypotaurine':             109.15,
  'n-acetylcysteine-amide':  178.21,    // NACA
  'ornithine':               132.16,
  'proline':                 115.13,
  'serine':                  105.09,
  'theanine':                174.20,    // L-theanine
  'tryptophan':              204.23,
  'tyrosine':                181.19,    // L-tyrosine

  // ── Metabolites (single-molecule, exclude polymers) ───────────────
  'bhb':                     104.10,    // β-hydroxybutyrate free acid
  'ergothioneine':           229.30,
  'glucosamine':             179.17,
  'glutathione':             307.32,
  'l-carnitine':             161.20,
  'pqq':                     330.21,    // pyrroloquinoline quinone
  'pyruvate':                88.06,     // pyruvic acid
  'ribose-5-phosphate':      230.11,
  'same':                    398.44,    // S-adenosyl-methionine
  'spermidine':              145.25,

  // ── Flavonoids (single-molecule, exclude silymarin mix) ───────────
  'epicatechin':             290.27,
  'fisetin':                 286.24,
  'genistein':               270.24,
  'hesperidin':              610.56,
  'kaempferol':              286.24,
  'luteolin':                286.24,
  'naringenin':              272.25,
  'procyanidin-b2':          578.52,
  'rutin':                   610.52,

  // ── Polyphenols ────────────────────────────────────────────────────
  'ellagic-acid':            302.19,
  'urolithin-a':             244.20,

  // ── Nucleotides ────────────────────────────────────────────────────
  'amp':                     347.22,    // adenosine 5'-monophosphate
  'naad':                    664.42,    // nicotinic acid adenine dinucleotide
  'nad-plus':                663.43,    // NAD+
  'nadh':                    665.45,
  'namn':                    335.20,    // nicotinic acid mononucleotide
  'peak-atp':                507.18,    // branded ATP — same MW as ATP
  'ump':                     324.18,

  // ── Nucleosides ────────────────────────────────────────────────────
  'cordycepin':              251.24,    // 3'-deoxyadenosine
  'cytidine':                243.22,
  'guanosine':               283.24,
  'nr':                      255.25,    // nicotinamide riboside (free base)
  'thymidine':               242.23,
  'uridine':                 244.20,

  // ── Ketones / ketone bodies and esters ────────────────────────────
  'acetoacetate':            102.09,
  'acetone':                 58.08,
  'beta-hydroxybutyrate':    104.10,    // alias of bhb
  'l-bhb':                   104.10,    // R-isomer, same MW
  'butanediol-1-3':          90.12,
  'butanediol-ester':        176.21,    // R,S-1,3-BD ester of BHB
  'bd-acetoacetate-diester': 246.26,    // Veech AcAc diester of BD
  'bis-hexanoyl-bd':         314.42,    // C6 diester of 1,3-BD
  'ketone-ester-deltag':     176.21,    // (R)-1,3-BD-(R)-3-HB ester (DeltaG)
  'sodium-bhb':              126.09,    // Na salt of BHB
  'potassium-bhb':           142.20,    // K salt
  'calcium-bhb':             246.27,    // Ca(C4H7O3)2
  'magnesium-bhb':           230.49,    // Mg(C4H7O3)2

  // ── Minerals (single elements + named salts) ──────────────────────
  // Elements list the elemental atomic weight; this is what the solver
  // would convert µM → mg/L for ions in plasma. For dosed salts the
  // formula MW is given.
  'boron':                   10.81,
  'calcium':                 40.08,
  'chromium':                52.00,
  'copper':                  63.55,
  'iodine':                  126.90,
  'iron':                    55.85,
  'magnesium':               24.31,
  'manganese':               54.94,
  'molybdenum':              95.95,
  'potassium':               39.10,
  'selenium':                78.96,
  'zinc':                    65.38,
  // Common dosed salts
  'iodine-potassium-iodide': 166.00,    // KI
  'iron-bisglycinate':       203.97,    // Fe(C2H4NO2)2
  'magnesium-citrate':       451.12,    // Mg3(C6H5O7)2 anhydrous
  'magnesium-glycinate':     172.42,    // Mg(C2H4NO2)2
  'magnesium-l-threonate':   294.49,    // Mg(C4H7O5)2
  'magnesium-threonate':     294.49,    // alias
  'magnesium-malate':        156.38,    // Mg(C4H4O5)
  'magnesium-taurate':       272.51,    // Mg(C2H6NO3S)2
  'selenium-methionine':     196.11,    // L-selenomethionine
  'zinc-picolinate':         309.62,

  // ── Neurotransmitter ───────────────────────────────────────────────
  'acetylcholine':           146.21,    // free cation; chloride 181.66

  // ── Terpenoids ─────────────────────────────────────────────────────
  'beta-caryophyllene':      204.36,
  'coq10':                   863.34,    // ubiquinone-10
  'limonene':                136.24,    // (R)- or (S)-limonene; same formula

  // ── Other (single-molecule) ───────────────────────────────────────
  'ala-r':                   206.32,    // R-α-lipoic acid
  'coq10-ubiquinol':         865.36,    // reduced form (ubiquinone +2H)
  'nad-precursor-nr':        255.25,    // alias of nicotinamide riboside
  'nmn':                     334.22,    // β-nicotinamide mononucleotide
  'rapamycin':               914.17,    // sirolimus
};

function main(): void {
  const raw = readFileSync(COMPOUNDS_PATH, 'utf-8');
  const data = JSON.parse(raw) as Array<Record<string, unknown>>;
  let added = 0;
  let alreadyHad = 0;
  let unknownInRegistry = 0;

  // Build the slug set once for the "specified-but-not-in-registry" check.
  const registrySlugs = new Set(data.map(c => c['slug'] as string));

  for (const c of data) {
    const slug = c['slug'] as string;
    if (slug in MW) {
      if (c['mw_g_mol'] != null) {
        alreadyHad++;
      } else {
        c['mw_g_mol'] = MW[slug];
        added++;
      }
    }
  }

  for (const slug of Object.keys(MW)) {
    if (!registrySlugs.has(slug)) {
      unknownInRegistry++;
      console.warn(`  [warn] script lists "${slug}" but it's not in the registry`);
    }
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  const stillMissing = data.filter(c => c['mw_g_mol'] == null).length;

  console.log('\nMW backfill (Wave 0a) complete:');
  console.log(`  ${added} compounds gained mw_g_mol`);
  console.log(`  ${alreadyHad} compounds already had it (no-op)`);
  console.log(`  ${unknownInRegistry} script entries not in registry (warned above)`);
  console.log(`  ${stillMissing} compounds still without mw_g_mol`);
  console.log(`  ${data.length - stillMissing} / ${data.length} now have mw_g_mol (${(100 * (data.length - stillMissing) / data.length).toFixed(0)}%)`);
}

main();
