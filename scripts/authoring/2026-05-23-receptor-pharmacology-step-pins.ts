/**
 * 2026-05-23-receptor-pharmacology-step-pins.ts
 *
 * Scale-up of the PathwayModulator.step escape-hatch (see the
 * adrenergic pilot) to four receptor_pharmacology pathways whose
 * subtype-named modulators don't string-match their receptor step.
 * Per-modulator mapping (reviewed) — NOT a blanket "all → step 0";
 * each pathway leaves off modulators that act on targets it doesn't
 * model (other receptors / transporters / enzymes), exactly as the
 * adrenergic pilot left atomoxetine (NET) to text matching.
 *
 *  gaba_a_receptor_signaling — receptor = step 1 (gaba → GABA-A activation)
 *    pinned: BZD-site, Z-drugs, barbiturates, propofol/etomidate,
 *            alcohol/ethanol, flumazenil, withanolide-a, gaba.
 *    NOT pinned: valproate/vigabatrin (GABA-T → step 3 via text),
 *      baclofen/phenibut/sodium-oxybate (GABA-B — not modelled here),
 *      tiagabine (GAT-1 transporter — not modelled).
 *  muscarinic_receptor_subtypes — receptor = step 0 (ACh → mAChR binding)
 *    pinned: all M-subtype agonists/antagonists.
 *    NOT pinned: mirabegron (β3-AR comparator, not muscarinic).
 *  aromatase_androgen_receptor_axis — two targets
 *    step 0 (aromatase): anastrozole/letrozole/exemestane;
 *    step 1 (AR): enzalutamide/bicalutamide.
 *    NOT pinned: ER SERM/SERDs, CYP17 (abiraterone), PR/GR
 *      (mifepristone), contraceptives — no matching step.
 *  adenosine_receptor_signaling — splits across steps
 *    step 6 (A1/A2A antagonism): caffeine/theophylline/theobromine/
 *      pentoxifylline; step 5 (ENT1 uptake): dipyridamole/ticagrelor.
 *    NOT pinned: adenosine (spans A1/A2A/A2B), clopidogrel/prasugrel
 *      (P2Y12, not adenosine).
 *
 * mglur_metabotropic_glutamate is deliberately excluded — its
 * modulators are glutamate-system-wide with only indirect mGluR
 * effects; left to manual authoring.
 *
 * No citations touched — structural step↔modulator mapping only.
 * Idempotent; validates every slug/step before writing. Run once:
 *   tsx scripts/authoring/2026-05-23-receptor-pharmacology-step-pins.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Modulator { slug: string; step?: number; [k: string]: unknown }
interface Pathway { slug: string; steps: unknown[]; modulators?: Modulator[]; [k: string]: unknown }

// pathway slug → step index → modulator slugs pinned to that step.
const PINS: Record<string, Record<number, string[]>> = {
  gaba_a_receptor_signaling: {
    1: [
      'diazepam', 'alprazolam', 'clonazepam', 'lorazepam', 'midazolam', 'temazepam', 'oxazepam',
      'triazolam', 'zolpidem', 'zopiclone', 'eszopiclone', 'zaleplon', 'phenobarbital', 'butalbital',
      'thiopental', 'propofol', 'etomidate', 'alcohol', 'ethanol', 'flumazenil', 'withanolide-a', 'gaba',
    ],
  },
  muscarinic_receptor_subtypes: {
    0: ['atropine', 'scopolamine', 'ipratropium', 'tiotropium', 'umeclidinium', 'aclidinium',
        'oxybutynin', 'tolterodine', 'dicyclomine', 'orphenadrine'],
  },
  aromatase_androgen_receptor_axis: {
    0: ['anastrozole', 'letrozole', 'exemestane'],
    1: ['enzalutamide', 'bicalutamide'],
  },
  adenosine_receptor_signaling: {
    5: ['dipyridamole', 'ticagrelor'],
    6: ['caffeine', 'theophylline', 'theobromine', 'pentoxifylline'],
  },
};

const data: Pathway[] = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));
let total = 0;
for (const [pwSlug, stepMap] of Object.entries(PINS)) {
  const pw = data.find(p => p.slug === pwSlug);
  if (!pw) throw new Error(`pathway "${pwSlug}" not found`);
  const slugToStep = new Map<string, number>();
  for (const [stepStr, slugs] of Object.entries(stepMap)) {
    const step = Number(stepStr);
    if (!Number.isInteger(step) || step < 0 || step >= pw.steps.length) {
      throw new Error(`${pwSlug}: step ${step} out of range (0..${pw.steps.length - 1})`);
    }
    for (const s of slugs) slugToStep.set(s, step);
  }
  const found = new Set<string>();
  let pinned = 0;
  for (const m of pw.modulators ?? []) {
    const step = slugToStep.get(m.slug);
    if (step === undefined) continue;
    found.add(m.slug);
    if (m.step !== step) { m.step = step; pinned++; }
  }
  const missing = [...slugToStep.keys()].filter(s => !found.has(s));
  if (missing.length) throw new Error(`${pwSlug}: listed slug(s) not in modulators: ${missing.join(', ')}`);
  total += pinned;
  console.log(`${pwSlug}: pinned ${pinned}/${slugToStep.size}`);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`done — ${total} pins written`);
