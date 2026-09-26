/**
 * 2026-05-24-metabolism-batch2-step-notes.ts
 *
 * step.note batch 4 — more core metabolism (pentose-phosphate,
 * gluconeogenesis, oxidative phosphorylation, fatty-acid synthesis,
 * ketone bodies). Textbook biochemistry complementary to each `via`;
 * grounded by existing refs[], NO new PMIDs. Matched by from→to;
 * idempotent. Run once:
 *   tsx scripts/authoring/2026-05-24-metabolism-batch2-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  pentose_phosphate_pathway: {
    'glucose-6-phosphate 6-phosphogluconolactone':
      'G6PD is the rate-limiting, NADPH-producing step and the cell’s main defense against oxidative stress ' +
      '(NADPH regenerates reduced glutathione). Its X-linked deficiency is the commonest human enzymopathy, ' +
      'causing hemolysis on oxidant exposure — fava beans, primaquine, sulfa drugs, infection.',
    '6-phosphogluconolactone ribulose-5-phosphate':
      '6-phosphogluconate dehydrogenase yields a second NADPH (and releases CO₂). With G6PD, this oxidative ' +
      'branch supplies NADPH for reductive biosynthesis (fatty acids, cholesterol) and antioxidant defense — ' +
      'distinct from the ATP-generating role of glycolysis.',
    'ribulose-5-phosphate ribose-5-phosphate':
      'Phosphopentose isomerase makes ribose-5-phosphate for nucleotide and NAD/FAD/CoA synthesis. The ' +
      'non-oxidative branch (transketolase/transaldolase, transketolase needing thiamine/TPP) reversibly ' +
      'interconverts these pentoses with glycolytic intermediates, balancing NADPH vs ribose demand.',
  },
  gluconeogenesis: {
    'pyruvate oxaloacetate':
      'Pyruvate carboxylase (mitochondrial, biotin-dependent) is allosterically activated by acetyl-CoA — ' +
      'high acetyl-CoA from fat oxidation signals fasting and diverts pyruvate toward glucose. The step also ' +
      'replenishes TCA oxaloacetate (anaplerosis).',
    'oxaloacetate phosphoenolpyruvate':
      'PEPCK (cytosolic) is transcriptionally induced by glucagon/cortisol and suppressed by insulin. ' +
      'Oxaloacetate must first leave the mitochondrion as malate or aspartate, since the inner membrane has ' +
      'no OAA transporter.',
    'phosphoenolpyruvate fructose-1-6-bisphosphate':
      'The seven near-equilibrium glycolytic enzymes simply run in reverse here; only the three irreversible ' +
      'glycolytic steps need dedicated gluconeogenic bypasses (this PEP step, FBPase, and ' +
      'glucose-6-phosphatase).',
    'fructose-1-6-bisphosphate fructose-6-phosphate':
      'Fructose-1,6-bisphosphatase is the rate-limiting control point and the direct counter to PFK-1: ' +
      'inhibited by AMP and by fructose-2,6-bisphosphate — the same insulin/glucagon signal that activates ' +
      'PFK-1 — so the two are reciprocally regulated to avoid a futile cycle.',
    'glucose-6-phosphate glucose':
      'Glucose-6-phosphatase (ER lumen) releases free glucose to the blood and is expressed only in liver, ' +
      'kidney, and intestine — so muscle, lacking it, cannot export glucose. Deficiency causes von Gierke ' +
      'disease (glycogen storage disease type I).',
  },
  oxidative_phosphorylation: {
    'nadh coenzyme-q10':
      'Complex I (NADH:ubiquinone oxidoreductase) pumps 4 H⁺ and is the largest ETC complex. It is a major ' +
      'site of superoxide generation and the target of metformin (partial inhibition raises AMP → AMPK) and ' +
      'rotenone.',
    'succinate coenzyme-q10':
      'Complex II is succinate dehydrogenase — the only ETC complex that does NOT pump protons — funnelling ' +
      'TCA-derived FADH₂ electrons into the ubiquinone pool, which is why FADH₂ ultimately yields less ATP ' +
      'than NADH.',
    'coenzyme-q10 cytochrome-c':
      'Complex III runs the Q-cycle, pumping 4 H⁺ while passing electrons from ubiquinol to cytochrome c. It ' +
      'is the second major superoxide source and the target of antimycin A.',
    'cytochrome-c water':
      'Cytochrome c oxidase reduces O₂ to water (the terminal electron acceptor) and pumps 2 H⁺. It is ' +
      'irreversibly blocked by cyanide, carbon monoxide, azide, and H₂S at the heme-a₃/Cu_B center.',
    'proton-gradient atp':
      'ATP synthase (F₁F₀) uses the proton-motive force to phosphorylate ADP (~3 ATP per rotation). ' +
      'Oligomycin blocks the F₀ proton channel; uncouplers (DNP, thermogenin/UCP1) dissipate the gradient as ' +
      'heat instead of ATP.',
  },
  fatty_acid_biosynthesis: {
    'acetyl-coa malonyl-coa':
      'Acetyl-CoA carboxylase is the rate-limiting, biotin-dependent committed step — activated by citrate, ' +
      'inhibited by phosphorylation (AMPK) and long-chain acyl-CoA. Its product malonyl-CoA also inhibits ' +
      'CPT1, shutting off β-oxidation so synthesis and breakdown don’t run at once.',
    'malonyl-coa palmitate':
      'Fatty acid synthase is a multi-domain megaenzyme that iteratively condenses C2 units from malonyl-CoA, ' +
      'using NADPH (from the pentose-phosphate pathway) as reductant, to build palmitate (C16) — the ' +
      'cytosolic counterpart to mitochondrial β-oxidation.',
  },
  ketone_body_metabolism_supplementation: {
    'acetyl-coa beta-hydroxybutyrate':
      'Hepatic ketogenesis (HMG-CoA synthase → HMG-CoA lyase → BDH1) runs when fasting/low-carb states flood ' +
      'mitochondria with acetyl-CoA while oxaloacetate is diverted to gluconeogenesis. The liver lacks SCOT, ' +
      'so it exports but cannot itself use ketones.',
    'beta-hydroxybutyrate acetyl-coa':
      'Extrahepatic tissues (brain, heart, muscle) reactivate ketones via BDH1 then SCOT ' +
      '(succinyl-CoA:3-ketoacid CoA transferase) to acetyl-CoA for the TCA cycle. The brain shifts to ketones ' +
      'for most of its fuel in prolonged fasting, sparing glucose and muscle protein.',
  },
};

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let added = 0;
for (const [slug, stepNotes] of Object.entries(NOTES)) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = stepNotes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(stepNotes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`added ${added} step notes across ${Object.keys(NOTES).length} pathways`);
