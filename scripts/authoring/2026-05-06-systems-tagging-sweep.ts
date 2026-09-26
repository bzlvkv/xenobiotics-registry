/**
 * 2026-05-06-systems-tagging-sweep.ts — assign systems[] to the 61
 * compounds flagged by data-lint as "no systems[] tagged".
 *
 * Each tag is justified by the compound's already-authored mechanism
 * prose. systems[] is a derived marker, not a new claim. Source of
 * truth is the existing mechanism field.
 *
 * Categories:
 *   - B-vitamins (B1/B2/B7/B9/B12 + folate forms): nervous + immune-hematologic
 *   - Ketone bodies (BHB salts, AcAc, BD-AcAc-diester): nervous + musculoskeletal
 *   - GH-axis peptides (sermorelin, hexarelin, mod-grf, aod-9604): endocrine + musculoskeletal
 *   - NAD+ precursors (NMN, NR): endocrine + musculoskeletal
 *   - Anti-myostatin biologics (ace-031, follistatin-344): musculoskeletal
 *   - Senolytics / longevity (rapamycin, fisetin, resveratrol): immune-hematologic / endocrine
 *   - Adaptogens (ashwagandha-shoden, rosavin): nervous + endocrine
 *   - Antiseizure (lacosamide, vigabatrin): nervous
 *   - Antidepressants/nootropics (imipramine, oxiracetam, prl-8-53, dexmethylphenidate): nervous
 *   - Antiemetics (dimenhydrinate, palonosetron): nervous + digestive
 *   - Anticoagulant (rivaroxaban): immune-hematologic + cardiovascular
 *   - NSAID (naproxen): musculoskeletal + cardiovascular
 *   - Hepatoprotective (silymarin): digestive
 *   - Trace minerals (molybdenum, selenium-methionine): digestive / endocrine
 *   - Vitamin K2 (mk7): cardiovascular + musculoskeletal
 *   - α-lipoic acid (ala-r): nervous + endocrine
 *   - Polyphenols (caffeic-acid): cardiovascular + immune-hematologic
 *   - Carnitine salts (l-carnitine-l-tartrate): musculoskeletal + cardiovascular
 *   - Pyrimidines/purines (cytidine, ump, inosine, amp, r5p, ribose-5-phosphate): nervous / musculoskeletal
 *   - Pineal peptide (epitalon): endocrine
 *   - SARM (stenabolic): endocrine + musculoskeletal
 *   - Research compound (c60): immune-hematologic
 *   - Mitochondrial peptide (humanin): nervous + endocrine
 *   - CoQ10 (coq10-ubiquinol): cardiovascular + musculoskeletal + nervous
 *   - Cordycepin: immune-hematologic + nervous
 *   - Yerba mate: nervous + cardiovascular
 *   - Amino acids (methionine, proline, valine): digestive / musculoskeletal / integumentary
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type SystemId =
  | 'nervous' | 'cardiovascular' | 'respiratory' | 'endocrine' | 'digestive'
  | 'renal' | 'reproductive' | 'musculoskeletal' | 'integumentary' | 'immune-hematologic';

interface Compound {
  slug: string;
  systems?: SystemId[];
  [k: string]: unknown;
}

const TAGS: Record<string, SystemId[]> = {
  // Anti-myostatin / GH-axis
  'ace-031':                     ['musculoskeletal'],
  'follistatin-344':             ['musculoskeletal'],
  'aod-9604':                    ['endocrine', 'musculoskeletal'],
  'sermorelin':                  ['endocrine', 'musculoskeletal'],
  'hexarelin':                   ['endocrine', 'musculoskeletal'],
  'mod-grf-1-29':                ['endocrine', 'musculoskeletal'],

  // Ketone bodies / exogenous ketones
  'acetoacetate':                ['nervous', 'musculoskeletal'],
  'bd-acetoacetate-diester':     ['nervous', 'musculoskeletal'],
  'bhb-salt':                    ['nervous', 'musculoskeletal'],
  'calcium-bhb':                 ['nervous', 'musculoskeletal'],
  'l-bhb':                       ['nervous', 'musculoskeletal'],
  'magnesium-bhb':               ['nervous', 'musculoskeletal'],
  'sodium-bhb':                  ['nervous', 'musculoskeletal'],

  // Mitochondrial / energy
  'ala-r':                       ['nervous', 'endocrine'],
  'amp':                         ['endocrine', 'musculoskeletal'],
  'coq10-ubiquinol':             ['cardiovascular', 'musculoskeletal', 'nervous'],
  'humanin':                     ['nervous', 'endocrine'],
  'l-carnitine-l-tartrate':      ['musculoskeletal', 'cardiovascular'],

  // NAD+ precursors
  'nmn':                         ['endocrine', 'musculoskeletal'],
  'nr':                          ['endocrine', 'musculoskeletal'],

  // B-vitamins
  'cyanocobalamin':              ['nervous', 'immune-hematologic'],
  'methylcobalamin':             ['nervous', 'immune-hematologic'],
  'hydroxocobalamin':            ['nervous', 'immune-hematologic'],
  'vitamin-b12-methylcobalamin': ['nervous', 'immune-hematologic'],
  'folic-acid':                  ['immune-hematologic', 'nervous'],
  'methylfolate':                ['immune-hematologic', 'nervous'],
  'thiamine':                    ['nervous'],
  'riboflavin':                  ['nervous', 'musculoskeletal'],

  // Nucleosides / nucleotides
  'cytidine':                    ['nervous'],
  'ump':                         ['nervous'],
  'inosine':                     ['nervous', 'immune-hematologic'],
  'r5p':                         ['musculoskeletal'],
  'ribose-5-phosphate':          ['musculoskeletal'],

  // Senolytics / longevity / sirtuin
  'rapamycin':                   ['immune-hematologic', 'musculoskeletal'],
  'fisetin':                     ['musculoskeletal', 'immune-hematologic'],
  'resveratrol':                 ['cardiovascular', 'endocrine'],

  // Adaptogens
  'ashwagandha-shoden':          ['endocrine', 'nervous'],
  'rosavin':                     ['nervous', 'endocrine'],

  // Trace minerals / vitamins
  'mk7':                         ['cardiovascular', 'musculoskeletal'],
  'molybdenum':                  ['digestive', 'immune-hematologic'],
  'selenium-methionine':         ['endocrine', 'immune-hematologic'],

  // Polyphenols
  'caffeic-acid':                ['cardiovascular', 'immune-hematologic'],

  // Anti-inflammatory / NSAID
  'naproxen':                    ['musculoskeletal', 'cardiovascular'],

  // Anticoagulant
  'rivaroxaban':                 ['immune-hematologic', 'cardiovascular'],

  // Hepatoprotective
  'silymarin':                   ['digestive'],

  // Antiseizure (CNS)
  'lacosamide':                  ['nervous'],
  'vigabatrin':                  ['nervous'],

  // Psychiatric / nootropic / stimulant
  'imipramine':                  ['nervous'],
  'oxiracetam':                  ['nervous'],
  'prl-8-53':                    ['nervous'],
  'dexmethylphenidate':          ['nervous'],

  // Antiemetics
  'dimenhydrinate':              ['nervous', 'digestive'],
  'palonosetron':                ['digestive', 'nervous'],

  // Amino acids
  'methionine':                  ['digestive', 'nervous'],
  'proline':                     ['integumentary', 'musculoskeletal'],
  'valine':                      ['musculoskeletal'],

  // Pineal peptide
  'epitalon':                    ['endocrine'],

  // Misc.
  'stenabolic':                  ['endocrine', 'musculoskeletal'],
  'c60':                         ['immune-hematologic'],
  'cordycepin':                  ['immune-hematologic', 'nervous'],
  'yerba-mate':                  ['nervous', 'cardiovascular'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let updated = 0, alreadyHas = 0, missing = 0;

  for (const [slug, systems] of Object.entries(TAGS)) {
    const c = bySlug.get(slug);
    if (!c) { console.warn(`  [warn] missing: ${slug}`); missing++; continue; }
    if (c.systems && c.systems.length > 0) { alreadyHas++; continue; }
    c.systems = systems;
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Systems tagging sweep: tagged ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
