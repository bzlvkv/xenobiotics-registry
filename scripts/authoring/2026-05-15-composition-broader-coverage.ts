/**
 * 2026-05-15-composition-broader-coverage.ts — three more composite-compound parents.
 *
 * Follows panax-ginseng (authored earlier today). All three parents below
 * already have their constituents in the registry; only the parent slug
 * needs creating + composition wiring.
 *
 * Composites added:
 *   fish-oil  → epa + dha (typical 30/20 spec per gram capsule)
 *   bcaa      → leucine + isoleucine + valine (canonical 2:1:1)
 *   mct-oil   → mct-c8 + mct-c10 (typical C8/C10 60/40 commercial spec)
 *
 * Composition values are commercial-product specifications (not
 * pharmacological claims) — no PMID required for the mg_per_g values.
 * The parent compound itself carries `pk_unauthored: { reason: 'mixture' }`
 * because each constituent has its own PK and there's no meaningful
 * single-species curve for the extract as a whole.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  name: string;
  aliases?: string[];
  category: string;
  systems?: string[];
  mechanism: string;
  routes: string[];
  doses: Record<string, { min: number; max: number; typical: number; unit: string }>;
  half_life_hr?: Record<string, number>;
  pk?: Record<string, unknown>;
  pk_unauthored?: { reason: string; note?: string };
  composition?: {
    standardization?: string;
    constituents: Array<{ slug: string; mg_per_g_extract: number; note?: string; source_pmid?: string }>;
  };
  refs?: string[];
  notes?: string;
  [k: string]: unknown;
}

const NEW_PARENTS: Compound[] = [
  {
    slug: 'fish-oil',
    name: 'Fish oil',
    aliases: ['Omega-3 fish oil', 'Marine omega-3'],
    category: 'lipid',
    systems: ['cardiovascular', 'nervous', 'immune-hematologic'],
    mechanism: 'Marine triglyceride preparation rich in the long-chain omega-3 PUFAs EPA (20:5n-3) and DHA (22:6n-3). Major actions are mediated by the individual constituents: EPA → eicosanoid class switch (less PGE2/LTB4, more PGE3/LTB5 — anti-inflammatory), partial PPARα agonism (TG lowering); DHA → membrane phospholipid incorporation (synaptic + retinal), partial PPARγ agonism. CV benefit signal in REDUCE-IT (icosapent ethyl, pure EPA) at 4 g/d; mixed signal in VITAL and STRENGTH. Typical commercial product = ~30% EPA + ~20% DHA (the remaining ~50% is non-omega lipids + binders).',
    routes: ['PO'],
    doses: { PO: { min: 500, max: 4000, typical: 1000, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: { reason: 'mixture', note: 'Mixture of EPA + DHA — each has distinct phospholipid-incorporation kinetics; no single-species PK fits the bottle.' },
    composition: {
      standardization: 'Typical commercial fish oil: ~30% EPA + ~20% DHA per gram of capsule oil (varies by brand; pharmaceutical-grade concentrates run 50–85%).',
      constituents: [
        { slug: 'epa', mg_per_g_extract: 300, note: 'Eicosapentaenoic acid (20:5n-3) — canonical 30% commercial spec' },
        { slug: 'dha', mg_per_g_extract: 200, note: 'Docosahexaenoic acid (22:6n-3) — canonical 20% commercial spec' },
      ],
    },
    refs: ['PMID:30415628'],  // REDUCE-IT (Bhatt 2019)
    notes: 'For pure-EPA prescription (icosapent ethyl / Vascepa), log epa directly.',
  },

  {
    slug: 'bcaa',
    name: 'BCAA (branched-chain amino acids)',
    aliases: ['Branched-chain amino acids', 'Leu/Ile/Val'],
    category: 'amino-acid',
    systems: ['musculoskeletal', 'nervous'],
    mechanism: 'Mixture of the three branched-chain essential amino acids — leucine, isoleucine, valine — typically in a 2:1:1 ratio. Leucine is the canonical mTORC1 activator (sensed by Sestrin2 → GATOR → Rag GTPases → lysosomal mTORC1) → muscle protein synthesis stimulation; the broader BCAA pool also competes with tryptophan for LAT1 transport across BBB (theoretical effect on central serotonin during exercise, "central fatigue" hypothesis — equivocal evidence). Overall protein-anabolic effect of isolated BCAAs is now thought to be modest compared with complete-protein sources, since muscle protein synthesis is also rate-limited by other essential amino acids.',
    routes: ['PO'],
    doses: { PO: { min: 2000, max: 20000, typical: 5000, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: { reason: 'mixture', note: 'Mixture of three amino acids — each enters the body amino-acid pool independently; no single-species plasma curve makes sense.' },
    composition: {
      standardization: 'Canonical 2:1:1 (leu:ile:val) ratio used in most commercial BCAA products.',
      constituents: [
        { slug: 'leucine',    mg_per_g_extract: 500, note: 'Half of the mass — the mTORC1-driving amino acid' },
        { slug: 'isoleucine', mg_per_g_extract: 250, note: '25% of mass' },
        { slug: 'valine',     mg_per_g_extract: 250, note: '25% of mass' },
      ],
    },
    refs: ['PMID:40284200'],  // Xu 2025 Nutrients — BCAA + inflammation/endurance review
  },

  {
    slug: 'mct-oil',
    name: 'MCT oil',
    aliases: ['Medium-chain triglyceride oil', 'C8/C10 oil'],
    category: 'lipid',
    systems: ['digestive', 'nervous'],
    mechanism: 'Mixture of medium-chain triglycerides (MCTs) — primarily caprylic (C8) and capric (C10), occasionally with caproic (C6) and lauric (C12) fractions. MCTs bypass the standard chylomicron route (lymphatic + slow LPL processing) and enter portal circulation directly, reaching the liver within minutes → rapid β-oxidation → ↑ketone bodies (β-hydroxybutyrate) within 30–90 min of dosing. C8 (caprylic) is the most ketogenic; C10 (capric) less so; C12 (lauric) behaves more like a long-chain fat. Commercial "MCT oil" is typically a 60/40 C8/C10 blend; "C8 MCT" / "C8 only" products are pure C8.',
    routes: ['PO'],
    doses: { PO: { min: 5000, max: 60000, typical: 15000, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: { reason: 'mixture', note: 'Mixture of C8 + C10 (occasionally C6/C12) — each chain length has distinct β-oxidation kinetics; no single-species PK fits the bottle.' },
    composition: {
      standardization: 'Typical commercial MCT oil: ~60% C8 + ~40% C10 (some pure-C8 products exist).',
      constituents: [
        { slug: 'mct-c8',  mg_per_g_extract: 600, note: 'Caprylic acid (C8) — most ketogenic fraction; preferred for ketogenic-supplementation use' },
        { slug: 'mct-c10', mg_per_g_extract: 400, note: 'Capric acid (C10) — less ketogenic than C8 but better-tolerated GI-wise' },
      ],
    },
    refs: ['PMID:36096496'],  // Chapman-Lopez 2022 J Obes Metab Syndr — MCT systematic review
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0;
  let skipped = 0;
  for (const parent of NEW_PARENTS) {
    if (bySlug.has(parent.slug)) {
      console.log(`SKIP (already exists): ${parent.slug}`);
      skipped++;
      continue;
    }
    // Sanity: every constituent must exist
    for (const cs of parent.composition!.constituents) {
      if (!bySlug.has(cs.slug)) {
        throw new Error(`Constituent missing for ${parent.slug}: ${cs.slug}`);
      }
    }
    data.push(parent);
    added++;
    console.log(`ADD: ${parent.slug} (${parent.composition!.constituents.length} constituents)`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nDone. Total compounds: ${data.length} (added ${added}, skipped ${skipped})`);
}

main();
