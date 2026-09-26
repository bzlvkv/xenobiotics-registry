/**
 * 2026-05-16-pathway-expansion-three-new.ts
 *
 * Adds 3 new pathways that fill out the singleton-subsystem gap on the
 * pathways list — these three subsystems had only 1 pathway each and
 * the audit showed substantial library-compound coverage available to
 * seed at least one more distinct pathway per subsystem.
 *
 * After this batch, three subsystems move from 1 → 2 (or 3) pathways
 * each, materially reducing the "wall of singletons" problem in the
 * Subsystem grouping view:
 *
 *   Androgen and estrogen synthesis and metabolism: 1 → 2
 *   Methionine and cysteine metabolism:             1 → 2
 *   Linoleate metabolism:                           1 → 2
 *
 * Refs verified via NCBI E-utilities `esummary` 2026-05-16. Every
 * modulator slug below was verified against compounds.json before
 * authoring.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway {
  slug: string;
  name: string;
  category: string;
  systems: string[];
  domains?: string[];
  description: string;
  steps: Array<{ from: string; to: string; via?: string }>;
  modulators?: Array<{ slug: string; effect: string; target?: string; note?: string }>;
  refs?: string[];
  recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'estrogen_phase2_clearance_phytochemical',
    name: 'Estrogen phase-2 clearance + phytochemical modulation',
    category: 'drug_metabolism',
    systems: ['endocrine', 'digestive', 'reproductive'],
    domains: ['endocrine_reproductive', 'oncology'],
    description:
      'Distinct from estrogen biosynthesis (see steroid_hormone_biosynthesis + aromatase_androgen_receptor_axis): this pathway covers the *clearance* arm — how circulating estradiol is hydroxylated, conjugated, and excreted. Step 1: CYP1A1 / CYP1A2 / CYP1B1 hydroxylate estradiol at C2 (2-OH-E2, weakly estrogenic, anti-proliferative metabolite) or C4 (4-OH-E2, genotoxic/quinone-forming metabolite — the carcinogenicity branch). Step 2: COMT methylates 2-OH-E2 → 2-MeO-E2 (anti-angiogenic, inactivated). Step 3: UGT (UGT1A1, UGT2B7) glucuronidates hydroxylated estrogens → biliary + renal excretion. Step 4: SULT (SULT1E1) sulfates estrogens for inactivation. Step 5: Enterohepatic recycling — gut β-glucuronidase deconjugates biliary estrogen-glucuronides → reabsorption (raised by constipation + dysbiosis). Phytochemical modulators: sulforaphane (broccoli) is a canonical Nrf2 activator → induces phase-2 enzymes (UGT, GST, COMT) → shifts 2-OH/4-OH ratio favorably; EGCG (green tea catechins) competitively inhibits COMT but induces phase-2 conjugation; resveratrol modulates ERα/β + induces phase-2 enzymes; curcumin upregulates phase-2 conjugation via Nrf2; genistein (soy isoflavone) is a partial ER agonist competing for ERα binding, also induces phase-2 enzymes; milk-thistle/silymarin upregulates hepatic phase-2 and antioxidant defenses. Clinical importance: chronic estrogen excess + skewed 2-OH/4-OH ratios are mechanistically linked to estrogen-driven cancers (breast, endometrial). Phytochemical induction of the 2-OH + glucuronidation arms is the molecular basis of cruciferous-vegetable + green-tea anti-cancer epidemiology. Cross-links: [[conjugation_phase2_overview]], [[nrf2_keap1_antioxidant_response]], [[steroid_hormone_biosynthesis]], [[estrogen_receptor_genomic_nongenomic]].',
    steps: [
      { from: 'estradiol (17β-E2)', to: '2-OH-estradiol', via: 'CYP1A1 / CYP1A2 (favorable branch; weakly estrogenic, anti-proliferative)' },
      { from: 'estradiol (17β-E2)', to: '4-OH-estradiol', via: 'CYP1B1 (genotoxic branch; semiquinone/quinone → DNA adducts in carcinogenesis)' },
      { from: '2-OH-estradiol', to: '2-methoxyestradiol (2-MeO-E2)', via: 'COMT methylation — anti-angiogenic + anti-proliferative inactivation' },
      { from: 'hydroxyestrogens', to: 'estrogen-glucuronides', via: 'UGT1A1 + UGT2B7 — biliary + renal excretion' },
      { from: 'estradiol', to: 'estradiol-3-sulfate', via: 'SULT1E1 — circulating sulfated reservoir, inactivated form' },
      { from: 'biliary estrogen-glucuronide', to: 'reabsorbed free estradiol', via: 'gut β-glucuronidase deconjugation + enterohepatic recycling — raised by constipation/dysbiosis' },
    ],
    modulators: [
      { slug: 'sulforaphane',        effect: 'activator',  target: 'Nrf2 → phase-2 induction (UGT, GST, COMT)', note: 'Broccoli sprout — canonical phase-2 inducer; shifts 2-OH/4-OH ratio favorably' },
      { slug: 'egcg',                effect: 'inhibitor',  target: 'COMT (competitive) + phase-2 induction',     note: 'Green tea catechin — dual effect on COMT methylation kinetics' },
      { slug: 'green-tea-extract',   effect: 'inhibitor',  target: 'COMT + phase-2 modulation',                   note: 'Standardized EGCG-bearing extract' },
      { slug: 'resveratrol',         effect: 'activator',  target: 'phase-2 enzymes + ERα/β partial modulation',  note: 'Polyphenol; SIRT1 + phase-2 + aryl-hydrocarbon receptor crosstalk' },
      { slug: 'curcumin',            effect: 'activator',  target: 'Nrf2 → phase-2 induction',                    note: 'Polyphenol; hepatic + intestinal phase-2 induction' },
      { slug: 'genistein',           effect: 'substrate',  target: 'ERα partial agonist + phase-2 induction',     note: 'Soy isoflavone — phytoestrogen competing at ER + inducing clearance' },
      { slug: 'milk-thistle',        effect: 'activator',  target: 'phase-2 + antioxidant defenses',              note: 'Silymarin-bearing extract; hepatoprotective' },
      { slug: 'silymarin',           effect: 'activator',  target: 'phase-2 + GSH-S-transferase induction' },
    ],
    refs: [
      'PMID:17515958',
    ],
    recon3d_subsystem: 'Androgen and estrogen synthesis and metabolism',
  },

  {
    slug: 'transsulfuration_cysteine_glutathione',
    name: 'Transsulfuration → cysteine → glutathione',
    category: 'biosynthesis',
    systems: ['digestive', 'immune-hematologic'],
    domains: ['metabolic'],
    description:
      'The "right turn" off the methionine cycle. Where methionine_sam_cycle covers the methylation arm (SAM → SAH → homocysteine → re-methylation), this pathway covers the *transsulfuration* arm: homocysteine → cystathionine → cysteine → downstream sulfur metabolism (taurine, H₂S, glutathione). Step 1: cystathionine β-synthase (CBS, B6-dependent) condenses homocysteine + serine → cystathionine — the committed step away from re-methylation toward sulfur excretion / antioxidant pool. CBS deficiency causes classic homocystinuria. Step 2: cystathionine γ-lyase (CSE / CTH, B6-dependent) cleaves cystathionine → cysteine + α-ketobutyrate + NH3. Step 3: cysteine has three fates — (a) γ-glutamylcysteine synthetase (γ-GCS, rate-limiting for GSH; feedback-inhibited by GSH) → GSH (via γ-GC + glycine by GSS); (b) cysteine dioxygenase (CDO) → cysteine sulfinate → hypotaurine → taurine; (c) CBS/CSE catalyzed H₂S production (gasotransmitter; vasorelaxant). Step 4: GSH redox cycling — GSH → GSSG by GPx (selenoenzyme) consuming peroxide; GSSG → GSH by GR + NADPH. The transsulfuration arm is the primary path for converting dietary methionine into the antioxidant + xenobiotic-conjugating GSH pool. Therapeutic relevance: NAC bypasses CBS/CSE by directly providing cysteine; SAMe supplementation pushes methionine cycle flux that ultimately replenishes GSH precursor; B6 is the obligate CBS/CSE cofactor (deficiency mimics CBS deficiency biochemically). Cross-links: [[methionine_sam_cycle]], [[glutathione_metabolism]], [[ros_oxidative_stress]], [[conjugation_phase2_overview]] (GST-driven xenobiotic conjugation depends on GSH availability).',
    steps: [
      { from: 'homocysteine + serine', to: 'cystathionine', via: 'CBS (cystathionine β-synthase, P5P cofactor) — RATE-LIMITING, deficiency = homocystinuria' },
      { from: 'cystathionine', to: 'cysteine + α-ketobutyrate', via: 'CSE / CTH (cystathionine γ-lyase, P5P cofactor)' },
      { from: 'cysteine', to: 'γ-glutamylcysteine', via: 'γ-GCS / GCLC — rate-limiting for GSH; feedback-inhibited by GSH' },
      { from: 'γ-glutamylcysteine + glycine', to: 'glutathione (GSH)', via: 'glutathione synthetase (GSS)' },
      { from: 'cysteine', to: 'hypotaurine → taurine', via: 'CDO + CSAD — taurine biosynthesis branch' },
      { from: 'cysteine', to: 'H₂S (gasotransmitter)', via: 'CBS / CSE / 3-MST — vasorelaxant + neuromodulator' },
      { from: 'GSH', to: 'GSSG (consumed)', via: 'glutathione peroxidase (selenoenzyme; reduces H₂O₂ + lipid peroxides)' },
      { from: 'GSSG', to: 'GSH (regenerated)', via: 'glutathione reductase + NADPH' },
    ],
    modulators: [
      { slug: 'nac',                       effect: 'substrate', target: 'cysteine direct precursor — bypasses CBS/CSE', note: 'N-acetylcysteine; canonical Rx for acetaminophen toxicity (replenishes hepatic GSH)' },
      { slug: 'n-acetylcysteine-amide',    effect: 'substrate', target: 'cysteine precursor — improved BBB penetration vs NAC' },
      { slug: 'cysteine',                  effect: 'substrate', target: 'direct cysteine pool' },
      { slug: 'glutathione',               effect: 'substrate', target: 'GSH pool (oral bioavailability limited)' },
      { slug: 'glycine',                   effect: 'substrate', target: 'GSH second amino acid (often rate-limiting in elderly + chronic disease)' },
      { slug: 'taurine',                   effect: 'substrate', target: 'CDO branch downstream product (also clinical Rx for cholestasis + cardiac)' },
      { slug: 'same',                      effect: 'activator', target: 'methionine cycle upstream — increases homocysteine flux into CBS' },
      { slug: 'p5p',                       effect: 'cofactor',  target: 'CBS + CSE B6-dependent cofactor', note: 'B6 deficiency biochemically mimics CBS deficiency' },
      { slug: 'methylfolate',              effect: 'cofactor',  target: 'methionine remethylation (competing arm); affects homocysteine flux into transsulfuration' },
      { slug: 'methylcobalamin',           effect: 'cofactor',  target: 'methionine synthase (remethylation arm)' },
      { slug: 'homocysteine',              effect: 'substrate', target: 'primary input — elevated in MTHFR / B12 / B6 deficiency' },
      { slug: 'milk-thistle',              effect: 'activator', target: 'hepatic GSH (silymarin)' },
      { slug: 'curcumin',                  effect: 'activator', target: 'Nrf2 → γ-GCS upregulation' },
      { slug: 'sulforaphane',              effect: 'activator', target: 'Nrf2 → γ-GCS + GPx upregulation' },
    ],
    refs: [
      'PMID:15497768',
      'PMID:18601945',
    ],
    recon3d_subsystem: 'Methionine and cysteine metabolism',
  },

  {
    slug: 'essential_fatty_acid_n3_n6_conversion',
    name: 'Essential fatty acid conversion (Δ6/Δ5 desaturase, ALA → EPA → DHA, LA → AA)',
    category: 'biosynthesis',
    systems: ['cardiovascular', 'nervous', 'digestive'],
    domains: ['cardiometabolic', 'neuropsychiatric'],
    description:
      'Where omega_fatty_acid_metabolism covers the clinical-effect arm (cardio outcomes, anti-inflammation), this pathway covers the *biosynthetic* arm — how the two essential 18-carbon precursors (ALA, n-3; LA, n-6) elongate + desaturate into the bioactive long-chain PUFAs (EPA, DHA, AA). The key kinetic insight: ALA + LA SHARE the same Δ6-desaturase (FADS2) + elongase (ELOVL5) + Δ5-desaturase (FADS1) enzymes — they compete competitively. High dietary LA (modern Western diet, seed-oil heavy) saturates Δ6-desaturase → very low ALA → EPA conversion (typically <5% in humans, <0.5% to DHA). Step 1: ALA → 18:4n-3 via FADS2 (Δ6-desaturase, the rate-limiting step for both arms). Step 2: 18:4n-3 → 20:4n-3 via ELOVL5 elongation. Step 3: 20:4n-3 → EPA (20:5n-3) via FADS1 (Δ5-desaturase). Step 4: EPA → DPA (22:5n-3) → 24:6n-3 → DHA (22:6n-3) via Sprecher pathway (further elongation + Δ6-desaturation + peroxisomal β-oxidation chain shortening). Step 5 (parallel n-6): LA → GLA → DGLA → AA via the same Δ6, ELOVL5, Δ5 enzymes. Therapeutic implication: direct EPA/DHA supplementation bypasses the rate-limiting Δ6 step → much more efficient than ALA supplementation for raising tissue n-3 content; GLA supplementation (borage, evening primrose) bypasses Δ6 on the n-6 side → raises DGLA → PGE1 (anti-inflammatory) without raising AA (most of the AA flux goes via 1-series prostaglandin precursor anyway). FADS1/FADS2 SNPs (rs174537, rs174546) explain large interindividual variation in conversion efficiency — populations with high-LA dietary history (most Western Europeans) carry "fast" variants; populations with marine diet (Inuit, Greenland) carry "slow" variants. Cross-links: [[omega_fatty_acid_metabolism]], [[arachidonic_acid_cascade]], [[nrf2_keap1_antioxidant_response]] (PUFA peroxidation produces electrophiles that activate Nrf2).',
    steps: [
      { from: 'α-linolenic acid (ALA, 18:3n-3)', to: '18:4n-3', via: 'FADS2 / Δ6-desaturase — RATE-LIMITING for both n-3 and n-6 arms' },
      { from: '18:4n-3', to: 'eicosatetraenoic acid (20:4n-3)', via: 'ELOVL5 elongation' },
      { from: 'eicosatetraenoic acid (20:4n-3)', to: 'EPA (20:5n-3)', via: 'FADS1 / Δ5-desaturase' },
      { from: 'EPA (20:5n-3)', to: 'DHA (22:6n-3)', via: 'Sprecher pathway: ELOVL5 → 24:5n-3 → FADS2 → 24:6n-3 → peroxisomal β-oxidation → DHA' },
      { from: 'linoleic acid (LA, 18:2n-6)', to: 'γ-linolenic acid (GLA, 18:3n-6)', via: 'FADS2 / Δ6-desaturase (same enzyme as n-3 arm; competitive)' },
      { from: 'GLA (18:3n-6)', to: 'dihomo-γ-linolenic acid (DGLA, 20:3n-6)', via: 'ELOVL5 elongation; DGLA → series-1 (anti-inflammatory) prostaglandins' },
      { from: 'DGLA (20:3n-6)', to: 'arachidonic acid (AA, 20:4n-6)', via: 'FADS1 / Δ5-desaturase — AA enters arachidonic_acid_cascade as PG/LT substrate' },
    ],
    modulators: [
      { slug: 'ala',                effect: 'substrate', target: 'n-3 arm entry — Δ6-desaturase substrate', note: 'Endogenous conversion to EPA <5%, to DHA <0.5% — direct supplementation poorly efficient' },
      { slug: 'epa',                effect: 'substrate', target: 'bypasses Δ6 + Δ5 desaturase — preferred for tissue n-3 loading' },
      { slug: 'dha',                effect: 'substrate', target: 'bypasses Δ6 + Δ5 + Sprecher path — preferred for neural + retinal n-3 loading' },
      { slug: 'epa-dha',             effect: 'substrate', target: 'combined EPA/DHA ester' },
      { slug: 'fish-oil',             effect: 'substrate', target: 'EPA + DHA cocktail (variable ratio)' },
      { slug: 'gla',                effect: 'substrate', target: 'bypasses Δ6-desaturase on n-6 arm — raises DGLA/PGE1 without raising AA' },
      { slug: 'arachidonic-acid',   effect: 'substrate', target: 'n-6 arm endpoint — substrate for arachidonic_acid_cascade (PG/LT synthesis)' },
      { slug: 'sea-buckthorn-oil',  effect: 'substrate', target: 'mixed n-3/n-6/n-7/n-9 source' },
    ],
    refs: [
      'PMID:19269799',
      'PMID:35908848',
    ],
    recon3d_subsystem: 'Linoleate metabolism',
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];

  const conflicts: string[] = [];
  for (const p of NEW_PATHWAYS) {
    if (data.find(x => x.slug === p.slug)) conflicts.push(p.slug);
  }
  if (conflicts.length > 0) {
    console.error('CONFLICT — pathways already exist:');
    for (const s of conflicts) console.error('  -', s);
    process.exit(1);
  }

  for (const p of NEW_PATHWAYS) data.push(p);

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ${NEW_PATHWAYS.length} pathways; total: ${data.length}`);
  for (const p of NEW_PATHWAYS) {
    console.log(`  + ${p.slug.padEnd(50)}  recon3d: ${p.recon3d_subsystem}`);
  }
}

main();
