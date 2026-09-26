/**
 * 2026-05-15-composites-batch-2.ts — broader composite coverage.
 *
 * Adds:
 *   1. New parent compound `mct-oil` (mixture of mct-c6 + mct-c8 + mct-c10).
 *   2. New parent compound `bcaa` (mixture of leucine + isoleucine + valine).
 *   3. New parent compound `green-tea-extract` (egcg + epicatechin + caffeine —
 *      l-theanine skipped because not yet in registry).
 *   4. Composition on existing `rhodiola-rosea` (salidroside + rosavin).
 *      Also flips the parent from authored PK → `pk_unauthored: mixture`
 *      so the today page renders the composite envelope rather than the
 *      coarse parent PK.
 *
 * Composition `mg_per_g_extract` figures are product-specification numbers
 * (typical commercial standardizations) — not PMID-backed pharmacological
 * claims. The `note` on each constituent explains the basis.
 *
 * Constituents' own PK is unchanged. After expansion, only those constituents
 * with authored PK contribute to the envelope curve; those without (e.g.
 * rosavin) appear as flat traces, surfacing the data gap honestly.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk?: unknown;
  pk_unauthored?: { reason: string; note?: string };
  composition?: {
    standardization?: string;
    constituents: Array<{ slug: string; mg_per_g_extract: number; note?: string; source_pmid?: string }>;
  };
  refs?: string[];
  [k: string]: unknown;
}

const MCT_OIL: Compound = {
  slug: 'mct-oil',
  name: 'MCT oil (medium-chain triglycerides)',
  aliases: ['Medium-chain triglyceride oil', 'C8/C10 MCT', 'Bulletproof brain octane (C8-only)'],
  category: 'lipid',
  systems: ['digestive', 'nervous', 'musculoskeletal'],
  mechanism:
    'Medium-chain triglycerides (C6–C12) are rapidly hydrolyzed in the GI tract and absorbed via the portal vein (unlike long-chain TGs which need bile acid + chylomicron packaging). In the liver they undergo rapid β-oxidation → acetyl-CoA → ketone bodies (β-hydroxybutyrate + acetoacetate). Commercial MCT oils are typically a coconut-/palm-derived blend, most often a "pure-fraction" C8/C10 product at roughly 60/40. Pure C8 (caprylic) is the most ketogenic per gram. Used clinically in MCT-supplemented ketogenic diets for refractory epilepsy + AD trials; off-label as a nutritional ergogenic.',
  routes: ['PO'],
  doses: {
    PO: { min: 5000, max: 30000, typical: 15000, unit: 'mg' },
  },
  half_life_hr: {},
  pk_unauthored: {
    reason: 'mixture',
    note: 'MCT oil is a mixture of C6 / C8 / C10 (and trace C12) triglycerides with distinct β-oxidation rates and ketogenic potencies. The constituents have individual PK; the extract as a whole has no single plasma species to fit. See composition for the per-constituent fan-out.',
  },
  composition: {
    standardization: 'Coconut-derived 60% C8 caprylic acid + 40% C10 capric acid (typical "pure-fraction" commercial MCT oil; C6 trace; C12 lauric excluded)',
    constituents: [
      { slug: 'mct-c8',  mg_per_g_extract: 600, note: 'Caprylic acid TG — most ketogenic per gram; ~60% of pure-fraction commercial MCT oils' },
      { slug: 'mct-c10', mg_per_g_extract: 400, note: 'Capric acid TG — second-most ketogenic; ~40% of pure-fraction commercial MCT oils' },
    ],
  },
  refs: [],
};

const BCAA: Compound = {
  slug: 'bcaa',
  name: 'BCAA (branched-chain amino acids)',
  aliases: ['BCAAs', '2:1:1 BCAA', 'Leucine-isoleucine-valine blend'],
  category: 'amino-acid',
  systems: ['musculoskeletal', 'endocrine', 'nervous'],
  mechanism:
    'Branched-chain amino acids — leucine, isoleucine, valine — share BCAT2 → BCKDH catabolism pathway. Leucine is the dominant mTORC1 activator (Sestrin2-mediated leucine sensing → GATOR1/2 → mTORC1) → muscle protein synthesis; isoleucine + valine provide carbon skeletons but lower-magnitude mTOR activation. Commercial BCAA supplements use the canonical 2:1:1 leucine:isoleucine:valine ratio, drawn from in vitro myocyte studies showing this matched intracellular pool composition. Doses 5–20 g/day pre/post exercise; saturable carrier transport at high doses; LNAA competition with tryptophan / tyrosine relevant for centrally-acting amino acid effects.',
  routes: ['PO'],
  doses: {
    PO: { min: 5000, max: 20000, typical: 7500, unit: 'mg' },
  },
  half_life_hr: {},
  pk_unauthored: {
    reason: 'mixture',
    note: 'BCAA is a 3-amino-acid mixture (leucine, isoleucine, valine) with separate plasma kinetics. The product as a whole has no single PK; see composition for per-amino-acid fan-out.',
  },
  composition: {
    standardization: '2:1:1 leucine : isoleucine : valine (the canonical commercial BCAA ratio; matches intracellular pool composition in muscle)',
    constituents: [
      { slug: 'leucine',    mg_per_g_extract: 500, note: '50% of the blend — the dominant mTORC1-activating BCAA' },
      { slug: 'isoleucine', mg_per_g_extract: 250, note: '25% — gluconeogenic side-chain; weaker mTOR activation than leucine' },
      { slug: 'valine',     mg_per_g_extract: 250, note: '25% — supports muscle protein synthesis without leucine\'s mTOR potency' },
    ],
  },
  refs: [],
};

const GREEN_TEA_EXTRACT: Compound = {
  slug: 'green-tea-extract',
  name: 'Green tea extract (Camellia sinensis)',
  aliases: ['GTE', 'Polyphenon E', 'Sunphenon EGCG-rich extract'],
  category: 'polyphenol',
  systems: ['cardiovascular', 'digestive', 'nervous', 'immune-hematologic'],
  mechanism:
    'Polyphenolic extract of Camellia sinensis leaves — primary bioactives are the catechins (EGCG, EGC, ECG, EC) plus l-theanine + caffeine in non-decaffeinated extracts. EGCG is the dominant antioxidant + multi-target signaling modulator (NF-κB inhibition, AMPK activation, anti-angiogenic via VEGF/MMP). Caffeine + l-theanine provide a synergistic cognitive profile (caffeine vigilance + theanine\'s α-wave dampening of jitter). Standardized extracts are typically 40–95% total polyphenols with EGCG at 25–50% of the extract by mass. Hepatotoxicity risk above ~800 mg EGCG/d (EFSA 2018) — drives caps in supplement labeling.',
  routes: ['PO'],
  doses: {
    PO: { min: 250, max: 700, typical: 400, unit: 'mg' },
  },
  half_life_hr: {},
  pk_unauthored: {
    reason: 'mixture',
    note: 'Green tea extract contains 6–8 distinct catechins + caffeine + l-theanine + minor xanthines. Each constituent has separate PK; the extract as a whole has no single plasma species. See composition for the partial constituent fan-out (l-theanine pending registry authoring).',
  },
  composition: {
    standardization: '50% EGCG · 8% epicatechin · 3% caffeine (Sunphenon 90LB-class extract; non-decaffeinated). L-theanine present in unstandardized form but not yet authored as a registry compound.',
    constituents: [
      { slug: 'egcg',        mg_per_g_extract: 500, note: 'Epigallocatechin-3-gallate — dominant catechin and the EFSA-flagged hepatotoxic component above ~800 mg/d' },
      { slug: 'epicatechin', mg_per_g_extract: 80,  note: 'Secondary catechin; cocoa flavanol overlap — flow-mediated dilation studies use higher doses' },
      { slug: 'caffeine',    mg_per_g_extract: 30,  note: 'Non-decaffeinated GTE typically 2–4% caffeine by mass; decaff variants drop to <0.5%' },
    ],
  },
  refs: [],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, modified = 0;

  for (const newC of [MCT_OIL, BCAA, GREEN_TEA_EXTRACT]) {
    if (bySlug.has(newC.slug)) {
      console.log(`SKIP (already exists): ${newC.slug}`);
      continue;
    }
    data.push(newC);
    added++;
    console.log(`ADD: ${newC.slug} (${newC.composition?.constituents.length} constituents)`);
  }

  // Update rhodiola-rosea — add composition, flip to mixture, retire parent PK
  const rh = bySlug.get('rhodiola-rosea');
  if (!rh) {
    console.error('ERROR: rhodiola-rosea not in registry');
    process.exit(1);
  }
  if (rh.composition) {
    console.log('SKIP rhodiola-rosea — already has composition');
  } else {
    delete rh.pk;
    rh.pk_unauthored = {
      reason: 'mixture',
      note: 'Rhodiola rosea root extract — two bioactive classes (salidroside + rosavins). Each constituent has distinct PK; parent extract PK was previously approximated from salidroside (PMID:24043591). Now expanded via composition; constituent PK governs the curve.',
    };
    rh.composition = {
      standardization: '3% rosavins + 1% salidroside (the SHR-5 spec — canonical Rhodiola standardization used in fatigue + adaptogen RCTs)',
      constituents: [
        { slug: 'salidroside', mg_per_g_extract: 10, note: '~1% of extract — phenylpropanoid glucoside; one of two principal active classes' },
        { slug: 'rosavin',     mg_per_g_extract: 30, note: '~3% of extract — phenylpropanoid glycoside unique to R. rosea; aggregate of rosavin + rosin + rosarin commonly reported as "rosavins"' },
      ],
    };
    modified++;
    console.log('ADD composition: rhodiola-rosea (2 constituents); retired parent PK to pk_unauthored: mixture');
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nDone. Added ${added} new composites, modified ${modified} existing.`);
}

main();
