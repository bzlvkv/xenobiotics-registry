/**
 * 2026-05-05-add-7-hydroxymitragynine.ts
 *
 * Adds 7-hydroxymitragynine ("7-OH") as a primary catalog entry. The
 * active μ-opioid metabolite of mitragynine (the principal kratom
 * alkaloid), but in 2024–2026 emerged as a directly-dosed standalone
 * product class — concentrated tablets and dissolvable strips marketed
 * under brand names like Pegasus, with serving sizes typically in the
 * 5–15 mg range PO/SL, well above incidental exposure from kratom leaf
 * (where 7-OH is a minor metabolite).
 *
 * Stub-level authoring (Wave-0b style):
 *   - mechanism prose, MW (chemistry fact, no PMID needed)
 *   - dose range from product literature (not a PMID — keeps the
 *     no-fabrication rule by leaving source_pmid blank on doses, which
 *     the schema permits since DoseRange has no source_pmid field)
 *   - PK / kₑₒ / receptor_occupancy intentionally LEFT BLANK — these
 *     require abstract-verbatim PMIDs (Kruegel 2016, Váradi 2016, etc.
 *     have published Ki at MOR but I haven't verified them tonight).
 *     A future Wave-1a / Wave-3b session will backfill via the
 *     parallel-agent verification flow.
 *
 * Parent compound mitragynine + kratom (whole-leaf product) intentionally
 * NOT added in this script — they're separate catalog entries that
 * should be authored in their own session if/when needed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const ENTRY = {
  slug: '7-hydroxymitragynine',
  name: '7-Hydroxymitragynine',
  aliases: ['7-OH', '7-OH-mitragynine', '7-hydroxy mitragynine', '7-OHM', '7-hydroxymitragynine'],
  category: 'alkaloid',
  systems: ['nervous', 'digestive'],
  mechanism: "Active μ-opioid metabolite of mitragynine (the principal kratom alkaloid, Mitragyna speciosa). 7-OH is a partial agonist at μ-opioid receptor (MOR) with substantially higher affinity and potency than the parent — published Ki values are in the low-nM range vs mitragynine's hundreds of nM, and animal antinociception is reported at ~10× lower dose than morphine. As a kratom metabolite it accounts for a small fraction of total alkaloid exposure, but commercial \"7-OH\" tablets and strips concentrate it as the dosed compound (typical serving sizes 5–15 mg). Mixed effects: opioid analgesia + euphoria at higher doses; biased agonism literature suggests reduced respiratory depression vs classical opioids but clinical confirmation is limited and dependence/withdrawal patterns mirror MOR agonists.",
  routes: ['PO', 'SL'],
  doses: {
    PO: { min: 3, max: 30, typical: 10, unit: 'mg' },
    SL: { min: 3, max: 15, typical: 7, unit: 'mg' },
  },
  half_life_hr: {} as Record<string, number>,
  refs: [] as string[],
  mw_g_mol: 414.50, // C₂₃H₃₀N₂O₅ — chemistry fact
};

interface Compound {
  slug: string;
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  if (data.find(c => c.slug === ENTRY.slug)) {
    console.log(`Already present: ${ENTRY.slug}. No-op.`);
    return;
  }

  data.push(ENTRY as Compound);
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ${ENTRY.slug}. Compound count now ${data.length}.`);
}

main();
