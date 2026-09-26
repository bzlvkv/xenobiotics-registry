/**
 * 2026-05-24-core-metabolism-step-notes.ts
 *
 * step.note batch 3 — core energy metabolism (glycolysis, TCA cycle,
 * urea cycle, β-oxidation). Pure textbook biochemistry, complementary
 * to each step's `via`; grounded by the pathways' existing refs[], NO
 * new PMIDs. Matched by from→to; idempotent. Run once:
 *   tsx scripts/authoring/2026-05-24-core-metabolism-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  glycolysis: {
    'glucose glucose-6-phosphate':
      'Hexokinase (HK1–3) has low Km and is product-inhibited by glucose-6-phosphate, clamping uptake; the ' +
      'liver/β-cell isoform glucokinase (HK4) has high Km and no G6P inhibition, acting as a glucose sensor ' +
      'that scales flux with blood glucose. Phosphorylation also traps glucose in the cell — charged G6P ' +
      'cannot cross the membrane.',
    'glucose-6-phosphate fructose-1-6-bisphosphate':
      'PFK-1 is the committed, rate-limiting and principal regulatory step: allosterically inhibited by ATP and ' +
      'citrate (energy/carbon abundance) and activated by AMP and fructose-2,6-bisphosphate — the latter set ' +
      'by insulin/glucagon via PFK-2 — integrating glycolysis with the cell’s energy state and hormones.',
    'fructose-1-6-bisphosphate pyruvate':
      'Payoff phase: aldolase splits F1,6BP into two triose phosphates (interconverted by TPI), then ' +
      'GAPDH→PGK→PGM→enolase→pyruvate kinase produce 4 ATP and 2 NADH (net 2 ATP per glucose after the ' +
      'priming phase). Pyruvate kinase is the third regulated step; GAPDH couples flux to NAD⁺ regeneration.',
  },
  tca_cycle: {
    'acetyl-coa citrate':
      'Citrate synthase condenses acetyl-CoA with oxaloacetate — the irreversible entry step, paced by ' +
      'oxaloacetate supply and inhibited by ATP, NADH, and citrate. Each acetyl-CoA turn ultimately yields ' +
      '3 NADH, 1 FADH₂, and 1 GTP.',
    'citrate isocitrate':
      'Aconitase isomerizes citrate to isocitrate via cis-aconitate. Its iron–sulfur cluster is poisoned by ' +
      'fluoroacetate (→ fluorocitrate) and, when the cluster is lost, the apoprotein moonlights as the ' +
      'cytosolic iron-regulatory protein IRP1.',
    'isocitrate alpha-ketoglutarate':
      'Isocitrate dehydrogenase is the rate-limiting, NAD⁺-linked step (mitochondrial IDH3), activated by ' +
      'ADP/Ca²⁺ and inhibited by ATP/NADH. The NADP⁺ isoforms IDH1/2, when mutated in gliomas and AML, ' +
      'produce the oncometabolite 2-hydroxyglutarate.',
    'alpha-ketoglutarate succinyl-coa':
      'The α-ketoglutarate dehydrogenase complex mirrors PDH — same five cofactors (thiamine/TPP, lipoate, ' +
      'FAD, NAD⁺, CoA) — and is a second NADH-yielding, irreversible control point inhibited by NADH and ' +
      'succinyl-CoA. Thiamine deficiency throttles it.',
    'succinyl-coa succinate':
      'Succinyl-CoA synthetase performs the cycle’s only substrate-level phosphorylation, capturing the ' +
      'thioester bond energy as GTP (or ATP). Succinyl-CoA also branches off to heme synthesis and to ' +
      'ketone-body activation.',
    'succinate fumarate':
      'Succinate dehydrogenase is the only TCA enzyme embedded in the inner membrane and doubles as ' +
      'electron-transport-chain Complex II, feeding FADH₂ electrons straight to ubiquinone. SDH-subunit ' +
      'mutations cause hereditary paraganglioma/pheochromocytoma.',
    'fumarate malate':
      'Fumarase hydrates fumarate to L-malate. Fumarate also arrives here from the urea cycle ' +
      '(argininosuccinate lyase) and purine synthesis, linking those pathways into the TCA pool; fumarase ' +
      'loss is a recognized tumor-suppressor defect.',
    'malate oxaloacetate':
      'Malate dehydrogenase regenerates oxaloacetate and a third NADH, closing the cycle. The reaction is ' +
      'endergonic but pulled forward by citrate synthase consuming OAA; the malate–aspartate shuttle uses ' +
      'this couple to ferry cytosolic NADH equivalents into mitochondria.',
  },
  urea_cycle: {
    'ammonia carbamoyl-phosphate':
      'CPS1 is the rate-limiting, mitochondrial entry step and absolutely requires N-acetylglutamate (NAG) as ' +
      'an allosteric activator — so NAG-synthase activity (stimulated by arginine) gates the whole cycle. It ' +
      'fixes the first nitrogen from free ammonia.',
    'carbamoyl-phosphate citrulline':
      'Ornithine transcarbamylase condenses carbamoyl-phosphate with ornithine; the citrulline product is ' +
      'exported to the cytosol. OTC deficiency is X-linked and the most common urea-cycle disorder, causing ' +
      'hyperammonemia with orotic aciduria.',
    'citrulline argininosuccinate':
      'Argininosuccinate synthetase joins citrulline with aspartate (the second nitrogen source), consuming ' +
      'ATP (→ AMP + PPi). This cytosolic step is also how citrulline supplementation raises arginine and ' +
      'nitric-oxide substrate more effectively than arginine itself.',
    'argininosuccinate l-arginine':
      'Argininosuccinate lyase cleaves argininosuccinate into arginine plus fumarate — the fumarate links the ' +
      'urea cycle to the TCA cycle (the aspartate–argininosuccinate shunt), recovering the carbon skeleton.',
    'l-arginine urea':
      'Arginase hydrolyzes arginine to urea and regenerates ornithine (re-imported to mitochondria to ' +
      'continue the cycle). Arginase competes with nitric-oxide synthase for arginine, coupling ureagenesis ' +
      'to vascular NO availability.',
  },
  beta_oxidation: {
    'fatty-acyl-coa enoyl-coa':
      'The first oxidation, by chain-length-specific acyl-CoA dehydrogenases (VLCAD/MCAD/SCAD), passes ' +
      'electrons via FAD → ETF → ubiquinone. MCAD deficiency is a common inborn error causing hypoketotic ' +
      'hypoglycemia during fasting.',
    'enoyl-coa 3-hydroxyacyl-coa':
      'Enoyl-CoA hydratase adds water across the trans double bond to give L-3-hydroxyacyl-CoA — the ' +
      'hydration step of each β-oxidation spiral.',
    '3-hydroxyacyl-coa 3-ketoacyl-coa':
      '3-hydroxyacyl-CoA dehydrogenase oxidizes the hydroxyl to a keto group, generating the cycle’s NADH ' +
      '(its second oxidation).',
    '3-ketoacyl-coa acetyl-coa':
      'β-ketothiolase cleaves the bond with CoA, releasing acetyl-CoA plus a fatty-acyl-CoA shortened by two ' +
      'carbons that re-enters the spiral. Acetyl-CoA feeds the TCA cycle — or ketogenesis when oxaloacetate ' +
      'is scarce; each spiral nets 1 FADH₂ + 1 NADH + 1 acetyl-CoA.',
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
