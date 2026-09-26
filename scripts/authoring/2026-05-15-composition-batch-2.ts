/**
 * 2026-05-15-composition-batch-2.ts — broader composite coverage.
 *
 * Adds 4 new parent-compound entries, each with composition pointing to
 * already-authored constituents:
 *
 *   fish-oil          → epa, dha
 *   mct-oil           → mct-c8, mct-c10, mct-c6
 *   bcaa              → leucine, isoleucine, valine
 *   green-tea-extract → egcg, caffeine, epicatechin
 *
 * All parents are pk_unauthored: 'mixture' — the solver expands a parent
 * dose into per-constituent intakes at solve time (see
 * @xeno/solver:expandComposites). Composition ratios reflect typical
 * commercial standardized formulations:
 *
 *   • Fish oil — 30% combined omega-3 standardization: 180 mg/g EPA + 120 mg/g DHA
 *   • MCT oil — premium C8/C10 blend: 60% C8 + 35% C10 + 5% C6
 *   • BCAA   — standard 2:1:1 leucine : isoleucine : valine
 *   • GTE    — ~50% polyphenols, EGCG-dominant: 30% EGCG + 5% caffeine + 5% epicatechin
 *
 * Composition values are product-specification figures, not pharmacological
 * claims — no PMID is required for `mg_per_g_extract`. Constituent PK is
 * sourced separately on each constituent entry.
 *
 * Rhodiola-rosea NOT touched in this batch: it has an authored parent PK
 * (single-species approximation) and only 2 of its key constituents
 * (salidroside, rosavin) have PK in the registry, one of which has none.
 * Adding composition would override the working parent PK with a
 * partially-flat envelope — not a net win. Deferred to a separate decision.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  {
    slug: 'fish-oil',
    name: 'Fish oil (EPA + DHA)',
    aliases: ['Omega-3 fish oil', 'EPA/DHA', 'Marine omega-3'],
    category: 'lipid',
    systems: ['cardiovascular', 'nervous', 'immune-hematologic'],
    mechanism:
      'Concentrated marine omega-3 supplement supplying eicosapentaenoic acid (EPA, 20:5n-3) and docosahexaenoic acid (DHA, 22:6n-3). EPA → series-3 prostaglandins (PGE3) + series-5 leukotrienes (LTB5) — anti-inflammatory eicosanoid profile, displacing arachidonic-acid–derived PGE2/LTB4. DHA → membrane-structural lipid, especially retinal + cortical synaptic phospholipids. CV-event benefit demonstrated at high-dose pure EPA (REDUCE-IT, icosapent ethyl 4 g/d); combined EPA+DHA mixed (STRENGTH, VITAL — null at lower dose). Effects via SPMs (specialized pro-resolving mediators — resolvins, protectins, maresins), PPARα partial agonism, and direct membrane fluidity changes. See [[ppar_alpha_gamma_delta]] (PUFA endogenous ligands) and [[arachidonic_acid_cascade]] (counter-regulatory).',
    routes: ['PO'],
    doses: { PO: { min: 1000, max: 4000, typical: 2000, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'mixture',
      note: 'Fish oil is a product, not a single chemical — its PK is the PK of its constituents (EPA + DHA). Logging this as a composite expands to constituent intakes for the solver; the parent row aggregates them on the today page.',
    },
    composition: {
      standardization: '30% combined omega-3 (typical concentrate spec: 18% EPA + 12% DHA by weight)',
      constituents: [
        { slug: 'epa', mg_per_g_extract: 180, note: '18% of typical fish-oil concentrate (300 mg EPA per 1000 mg softgel matches common label "EPA 300 mg / DHA 200 mg")' },
        { slug: 'dha', mg_per_g_extract: 120, note: '12% of typical concentrate' },
      ],
    },
    refs: [],
  },

  {
    slug: 'mct-oil',
    name: 'MCT oil',
    aliases: ['Medium-chain triglycerides', 'MCT', 'C8/C10 oil'],
    category: 'lipid',
    systems: ['digestive', 'nervous', 'endocrine'],
    mechanism:
      'Refined medium-chain-triglyceride oil — saturated fatty acids with C6 (caproic), C8 (caprylic), C10 (capric) chain lengths (commercial MCT typically excludes C12 lauric to maximize ketogenicity). Absorbed directly into portal venous circulation without chylomicron packaging; rapidly β-oxidized in liver mitochondria → acetyl-CoA → ketone bodies (β-hydroxybutyrate, acetoacetate). C8 is the most ketogenic; C10 milder + better tolerated; C6 unstable + odorous (minor component). Used in ketogenic diet adjunct, refractory epilepsy (medium-chain ketogenic regimen), cognitive-aging trials, GI malabsorption / short-bowel. Cross-link [[ketone_body_synthesis]] (downstream), [[beta_oxidation]] (mitochondrial path).',
    routes: ['PO'],
    doses: { PO: { min: 5000, max: 30000, typical: 15000, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'mixture',
      note: 'MCT oil is a mixture of C6 + C8 + C10 saturated fatty acids; each has distinct absorption + β-oxidation kinetics. Solver expands a logged MCT dose into the three constituent intakes.',
    },
    composition: {
      standardization: 'Premium C8/C10 blend (60% C8 + 35% C10 + 5% C6 — typical "MCT oil" spec; pure-C8 products differ)',
      constituents: [
        { slug: 'mct-c8',  mg_per_g_extract: 600, note: 'Caprylic acid — primary ketogenic component; >95% in pure-C8 premium products' },
        { slug: 'mct-c10', mg_per_g_extract: 350, note: 'Capric acid — secondary, better-tolerated' },
        { slug: 'mct-c6',  mg_per_g_extract: 50,  note: 'Caproic acid — minor component; some products strip it for palatability' },
      ],
    },
    refs: [],
  },

  {
    slug: 'bcaa',
    name: 'BCAA (branched-chain amino acids)',
    aliases: ['BCAAs', 'Leucine + Isoleucine + Valine', '2:1:1 BCAA'],
    category: 'amino-acid',
    systems: ['musculoskeletal', 'endocrine', 'digestive'],
    mechanism:
      'Free-form mixture of the three branched-chain amino acids — leucine, isoleucine, valine — sold in a standard 2:1:1 ratio (leucine-weighted) for resistance-training support. Leucine is the dominant anabolic signal: leucyl-tRNA synthetase → Sestrin2 disinhibition → GATOR2 → Rag GTPases → mTORC1 → muscle protein synthesis (MPS). Isoleucine + valine share the BCAT (branched-chain amino transferase) + BCKDC (BCKD complex) catabolic pathway with leucine; deficiency = MSUD. Clinical: resistance training (MPS), hepatic encephalopathy adjunct (compete with aromatic AAs for blood-brain transport), critical illness. Cross-link [[mtor_signaling]] (downstream leucine target), [[bcaa_metabolism]] (catabolic path).',
    routes: ['PO'],
    doses: { PO: { min: 3000, max: 10000, typical: 5000, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'mixture',
      note: 'BCAA powders are 3 distinct amino acids with related but distinct PK (each enters circulation and is partly consumed by liver vs muscle). Solver expands a logged BCAA dose into the three constituent intakes.',
    },
    composition: {
      standardization: 'Standard 2:1:1 leucine : isoleucine : valine',
      constituents: [
        { slug: 'leucine',    mg_per_g_extract: 500, note: 'Dominant mTOR activator; 50% by weight in 2:1:1 mix' },
        { slug: 'isoleucine', mg_per_g_extract: 250, note: '25% in 2:1:1' },
        { slug: 'valine',     mg_per_g_extract: 250, note: '25% in 2:1:1' },
      ],
    },
    refs: [],
  },

  {
    slug: 'green-tea-extract',
    name: 'Green tea extract (GTE)',
    aliases: ['GTE', 'Camellia sinensis extract', 'Standardized green tea'],
    category: 'polyphenol',
    systems: ['cardiovascular', 'digestive', 'nervous'],
    mechanism:
      'Standardized extract of Camellia sinensis leaves — primary bioactives are the catechins (EGCG, EGC, ECG, EC) and the methylxanthine alkaloid caffeine, plus the amino-acid L-theanine (when included). EGCG is the dominant catechin (≈50-60% of total catechins); broad pleiotropy via 67-kDa laminin receptor binding, anti-inflammatory (NF-κB ↓), antioxidant + mild iron chelation, modest 5α-reductase + aromatase inhibition. Caffeine + L-theanine combination is the canonical "calm focus" pairing. Idiosyncratic hepatotoxicity at high EGCG doses (>800 mg/d) — fasted-state intake amplifies risk; EFSA warns on chronic use. Cross-links [[ferroptosis_gpx4_lipid_peroxidation]] (catechin lipid antioxidant role), [[adenosine_receptor_signaling]] (caffeine).',
    routes: ['PO'],
    doses: { PO: { min: 200, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'mixture',
      note: 'GTE is a multi-catechin extract with associated caffeine. Solver expands a logged GTE dose into the constituent intakes; the parent row aggregates them. L-theanine is intentionally omitted here because the registry does not yet include it; can be added when authored.',
    },
    composition: {
      standardization: '~50% total polyphenols, EGCG-dominant (30% EGCG by weight); residual caffeine 5%, epicatechin 5%',
      constituents: [
        { slug: 'egcg',        mg_per_g_extract: 300, note: 'Dominant catechin — 30% by weight in a "50% polyphenol" extract' },
        { slug: 'caffeine',    mg_per_g_extract: 50,  note: '~5% caffeine in standardized (non-decaf) GTE; decaf products near zero' },
        { slug: 'epicatechin', mg_per_g_extract: 50,  note: 'Minor catechin component, ~5%' },
      ],
    },
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0;
  for (const c of NEW_COMPOUNDS) {
    if (bySlug.has(c.slug)) {
      console.log(`SKIP (already exists): ${c.slug}`);
      continue;
    }
    data.push(c);
    added++;
    const constituents = ((c.composition as { constituents: Array<{ slug: string }> }).constituents).map(x => x.slug).join(', ');
    console.log(`ADD: ${c.slug} → [${constituents}]`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nTotal compounds: ${data.length} (added ${added})`);
}

main();
