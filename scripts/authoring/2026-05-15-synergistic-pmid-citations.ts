/**
 * 2026-05-15-synergistic-pmid-citations.ts
 *
 * Backfills source_pmid on synergistic-tier interaction edges where a
 * landmark clinical trial / canonical primary source exists. Each
 * mapping is verified against NCBI E-utilities `esummary` 2026-05-15
 * (title + authors + journal + year confirmed before applying).
 *
 * Synergistic edges that are pure precursor/biochemistry mechanism
 * (e.g. "ALA → DHA via desaturases", "creatine → phosphocreatine") are
 * intentionally NOT cited — they are textbook biology, not
 * clinical-trial findings, and a fabricated citation would be worse
 * than no citation. Cite only what literature actually anchors.
 *
 * Coverage delta: synergistic 0/274 → ~20/274.
 *
 * Citations applied (each handles both reciprocal directions):
 *
 *   PMID:26039521 — Cannon CP et al. 2015 NEJM (IMPROVE-IT)
 *                   Ezetimibe added to statin after ACS — LDL ↓ + CVE ↓
 *                   Applies: {atorvastatin/simvastatin/rosuvastatin/
 *                   pravastatin/pitavastatin} ↔ ezetimibe
 *
 *   PMID:18681988 — Owen GN et al. 2008 Nutr Neurosci
 *                   "The combined effects of L-theanine and caffeine
 *                   on cognitive performance and mood"
 *                   Applies: caffeine ↔ theanine
 *
 *   PMID:16531613 — Lonn E et al. 2006 NEJM (HOPE-2)
 *                   "Homocysteine lowering with folic acid and B
 *                   vitamins in vascular disease"
 *                   Applies: {folic-acid/methylfolate} ↔ {b12 forms/b6 forms}
 *
 *   PMID:16481635 — Jackson RD et al. 2006 NEJM (WHI Ca+D fracture trial)
 *                   "Calcium plus vitamin D supplementation and the risk
 *                   of fractures"
 *                   Applies: {calcium/calcium-carbonate} ↔ {cholecalciferol/
 *                   calcifediol/calcitriol}
 *
 *   PMID:2507689 — Hallberg L, Brune M, Rossander L 1989 Int J Vitam
 *                  Nutr Res Suppl. "The role of vitamin C in iron
 *                  absorption"
 *                  Applies: ascorbic-acid ↔ iron
 *
 *   PMID:16868650 — Hill CA et al. 2007 Amino Acids
 *                   "Influence of beta-alanine supplementation on
 *                   skeletal muscle carnosine concentrations and high
 *                   intensity cycling capacity"
 *                   Applies: beta-alanine ↔ carnosine
 *
 *   PMID:18442638 — Yin J, Xing H, Ye J 2008 Metabolism
 *                   "Efficacy of berberine in patients with type 2
 *                   diabetes mellitus"
 *                   Applies: berberine ↔ metformin
 *
 *   PMID:20685496 — Mehlisch DR et al. 2010 Clin Ther
 *                   "Comparison of the analgesic efficacy of concurrent
 *                   ibuprofen and paracetamol with ibuprofen or
 *                   paracetamol alone…"
 *                   Applies: acetaminophen ↔ ibuprofen
 *
 *   PMID:17662090 — Schwedhelm E et al. 2008 Br J Clin Pharmacol
 *                   "Pharmacokinetic and pharmacodynamic properties of
 *                   oral L-citrulline and L-arginine: impact on nitric
 *                   oxide metabolism"
 *                   Applies: {citrulline/l-citrulline} ↔ {arginine/l-arginine}
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Edge {
  slug: string;
  name?: string;
  level: string;
  note?: string;
  timing?: string;
  kinetics?: unknown;
  source_pmid?: string;
}
interface Compound {
  slug: string;
  interactions?: Edge[];
  [k: string]: unknown;
}

const STATIN = ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'pitavastatin'];
const EZET   = ['ezetimibe'];
const CF     = ['caffeine'];
const TH     = ['theanine', 'l-theanine'];
const FOLATE = ['folic-acid', 'methylfolate'];
const B12    = ['methylcobalamin', 'cyanocobalamin', 'adenosylcobalamin', 'hydroxocobalamin'];
const B6     = ['pyridoxine', 'p5p', 'pyridoxal-5-phosphate'];
const CA     = ['calcium', 'calcium-carbonate', 'calcium-citrate'];
const D      = ['cholecalciferol', 'calcifediol', 'calcitriol', 'vitamin-d3', 'vitamin-d'];
const ASC    = ['ascorbic-acid', 'vitamin-c'];
const FE     = ['iron', 'ferrous-sulfate', 'ferrous-gluconate', 'ferrous-bisglycinate'];
const BA     = ['beta-alanine'];
const CAR    = ['carnosine'];
const BER    = ['berberine'];
const METF   = ['metformin'];
const APAP   = ['acetaminophen'];
const IBU    = ['ibuprofen'];
const CIT    = ['citrulline', 'l-citrulline'];
const ARG    = ['arginine', 'l-arginine'];

interface CanonicalRule {
  groupA: string[];
  groupB: string[];
  pmid: string;
  label: string;
}
const RULES: CanonicalRule[] = [
  { groupA: STATIN, groupB: EZET, pmid: 'PMID:26039521', label: 'Cannon 2015 IMPROVE-IT (statin + ezetimibe)' },
  { groupA: CF,     groupB: TH,   pmid: 'PMID:18681988', label: 'Owen 2008 (caffeine + L-theanine)' },
  { groupA: FOLATE, groupB: B12,  pmid: 'PMID:16531613', label: 'Lonn 2006 HOPE-2 (folate + B12)' },
  { groupA: FOLATE, groupB: B6,   pmid: 'PMID:16531613', label: 'Lonn 2006 HOPE-2 (folate + B6)' },
  { groupA: B12,    groupB: B6,   pmid: 'PMID:16531613', label: 'Lonn 2006 HOPE-2 (B12 + B6)' },
  { groupA: CA,     groupB: D,    pmid: 'PMID:16481635', label: 'Jackson 2006 WHI (Ca + vit D)' },
  { groupA: ASC,    groupB: FE,   pmid: 'PMID:2507689',  label: 'Hallberg 1989 (vit C + iron)' },
  { groupA: BA,     groupB: CAR,  pmid: 'PMID:16868650', label: 'Hill 2007 (β-alanine → carnosine)' },
  { groupA: BER,    groupB: METF, pmid: 'PMID:18442638', label: 'Yin 2008 (berberine + metformin)' },
  { groupA: APAP,   groupB: IBU,  pmid: 'PMID:20685496', label: 'Mehlisch 2010 (APAP + ibuprofen)' },
  { groupA: CIT,    groupB: ARG,  pmid: 'PMID:17662090', label: 'Schwedhelm 2008 (citrulline + arginine)' },
];

function main(): void {
  const cs = JSON.parse(readFileSync(PATH, 'utf-8')) as Compound[];

  // Build reciprocal lookup map for fast edge-keying.
  const pmidFor = new Map<string, { pmid: string; label: string }>();
  for (const r of RULES) {
    for (const a of r.groupA) for (const b of r.groupB) {
      pmidFor.set(`${a}|${b}`, { pmid: r.pmid, label: r.label });
      pmidFor.set(`${b}|${a}`, { pmid: r.pmid, label: r.label });
    }
  }

  let patched = 0;
  let alreadyCited = 0;
  let scanned = 0;
  const perPmid = new Map<string, number>();

  for (const c of cs) {
    for (const e of c.interactions ?? []) {
      if (e.level !== 'synergistic') continue;
      scanned++;
      const hit = pmidFor.get(`${c.slug}|${e.slug}`);
      if (!hit) continue;
      if (e.source_pmid) { alreadyCited++; continue; }
      e.source_pmid = hit.pmid;
      patched++;
      perPmid.set(hit.pmid, (perPmid.get(hit.pmid) ?? 0) + 1);
      console.log(`  [patch] ${c.slug.padEnd(28)} → ${e.slug.padEnd(28)}  ${hit.pmid}  (${hit.label})`);
    }
  }

  writeFileSync(PATH, JSON.stringify(cs, null, 2) + '\n');

  console.log('\nSynergistic citation pass complete.');
  console.log(`  Scanned: ${scanned}`);
  console.log(`  Patched: ${patched}`);
  console.log(`  Already cited (skipped): ${alreadyCited}`);
  console.log('  Per-PMID totals:');
  for (const [pmid, n] of [...perPmid.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${pmid}: ${n} edge${n === 1 ? '' : 's'}`);
  }
}

main();
