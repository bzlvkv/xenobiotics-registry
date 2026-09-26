/**
 * 2026-05-06-fix-phenylephrine-naming.ts
 *
 * The `phenylephrine-otc` entry (slug + MW 167.21 match phenylephrine
 * the α1-selective decongestant) had been mis-labeled with the name
 * "Pseudoephedrine", alias "sudafed", and pseudoephedrine's mechanism
 * prose ("releases endogenous norepinephrine"). Almost certainly a
 * v7 import bug or a copy/paste error from the adjacent pseudoephedrine
 * entry.
 *
 * Restoring `phenylephrine-otc` to be actually phenylephrine:
 *   - name → "Phenylephrine"
 *   - aliases → ["Sudafed PE", "neo-synephrine"]
 *   - mechanism → α1-selective sympathomimetic
 *   - keep MW 167.21 (already correct for phenylephrine)
 *   - Note: oral phenylephrine OTC was the post-2006 (Combat
 *     Methamphetamine Epidemic Act) replacement for pseudoephedrine
 *     in OTC formulations; FDA's 2023 advisory committee voted it
 *     ineffective at standard 10 mg PO doses.
 *
 * The pseudoephedrine entry is correct and stays put.
 *
 * Other duplicate-pattern slugs surfaced in tonight's hygiene scan
 * (NOT fixed in this script — separate consolidation passes needed):
 *   beta-hydroxybutyrate / bhb
 *   carnitine / l-carnitine
 *   cholecalciferol / vitamin-d3       (vitamin-d3 canonical per memory)
 *   creatine / creatine-monohydrate    (creatine-monohydrate canonical)
 *   epa-dha / omega-3-epa-dha
 *   l-theanine / theanine              (l-theanine canonical)
 *   nad-precursor-nr / nr
 *   rhodiola / rhodiola-rosea          (rhodiola-rosea canonical)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  mechanism?: string;
  mw_g_mol?: number;
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const c = data.find(c => c.slug === 'phenylephrine-otc');
  if (!c) { console.warn('phenylephrine-otc not found'); return; }

  if (c.name === 'Phenylephrine') {
    console.log('Already fixed (name=Phenylephrine). No-op.');
    return;
  }

  c.name = 'Phenylephrine';
  c.aliases = ['Sudafed PE', 'neo-synephrine'];
  c.mechanism = 'α1-adrenergic agonist with minimal β activity. OTC oral decongestant since the 2006 Combat Methamphetamine Epidemic Act moved pseudoephedrine behind-the-counter; the active in Sudafed PE, Vicks Sinex, and most non-drowsy cold formulations. FDA Sept 2023 NDAC voted that oral phenylephrine at standard 10 mg PO doses is ineffective for nasal congestion (heavy first-pass via SULT1A3 reduces oral F to ~38%, much pre-systemic). Intranasal and IV routes work; IV used in anesthesia for hypotension.';
  c.mw_g_mol = 167.21;

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Fixed phenylephrine-otc: now named "Phenylephrine" with α1-agonist mechanism`);
}

main();
