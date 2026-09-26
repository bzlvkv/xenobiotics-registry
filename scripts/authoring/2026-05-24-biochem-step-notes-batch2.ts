/**
 * 2026-05-24-biochem-step-notes-batch2.ts
 *
 * step.note LARGE batch 2 — 10 more textbook metabolic pathways (BCAA,
 * creatine, fructose, galactose, bile-acid synthesis, niacin/NAD,
 * retinol/vitamin A, transsulfuration, serine one-carbon, glutamate–
 * glutamine cycle). Established biochemistry, complementary to each
 * `via`; grounded by existing refs[], NO new PMIDs. Matched by exact
 * from→to (a mismatch throws — fail-safe); idempotent. Run once:
 *   tsx scripts/authoring/2026-05-24-biochem-step-notes-batch2.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  bcaa_metabolism: {
    'leucine alpha-ketoisocaproate':
      'BCAT reversibly transaminates the branched-chain amino acids and is expressed mainly in muscle, not ' +
      'liver — so BCAAs largely escape first-pass hepatic metabolism and are catabolized peripherally, part ' +
      'of their appeal as a muscle supplement.',
    'valine alpha-ketoisovalerate':
      'Valine’s carbon skeleton is glucogenic (→ propionyl-CoA → succinyl-CoA), unlike purely ketogenic ' +
      'leucine — so the three BCAAs share the first two steps but diverge in metabolic fate afterward.',
    'isoleucine alpha-keto-3-methylvalerate':
      'Isoleucine is both glucogenic and ketogenic, yielding succinyl-CoA and acetyl-CoA. All three ' +
      'branched-chain α-keto acids converge on the single BCKDH complex for their committed oxidative ' +
      'decarboxylation.',
    'alpha-ketoisocaproate acetyl-coa':
      'The branched-chain α-ketoacid dehydrogenase complex is the rate-limiting, irreversible step — ' +
      'analogous to PDH and sharing thiamine/lipoate/FAD/NAD/CoA. Its deficiency causes maple syrup urine ' +
      'disease; it is switched off by kinase (BDK) phosphorylation and on by the phosphatase PPM1K.',
  },
  creatine_phosphocreatine_energy: {
    'glycine-and-arginine guanidinoacetate':
      'AGAT (kidney/pancreas) transfers arginine’s amidino group to glycine — the committed, rate-limiting ' +
      'step of creatine synthesis, feedback-inhibited by creatine.',
    'guanidinoacetate creatine':
      'GAMT (liver) methylates guanidinoacetate using SAM; creatine synthesis is one of the body’s largest ' +
      'consumers of SAM methyl groups, so dietary creatine spares methylation capacity and lowers ' +
      'homocysteine generation.',
    'creatine phosphocreatine':
      'Creatine kinase reversibly stores high-energy phosphate as phosphocreatine, rapidly regenerating ATP ' +
      'during bursts of demand (the phosphagen system). Isoenzymes (CK-MM muscle, CK-MB heart, CK-BB brain) ' +
      'are clinical markers; creatine slowly cyclizes to creatinine for renal excretion.',
  },
  fructose_metabolism: {
    'fructose fructose-1-phosphate':
      'Hepatic fructokinase (KHK) phosphorylates fructose without the feedback that governs glucose, ' +
      'bypassing rate-limiting PFK-1 — so a fructose load floods downstream glycolysis/lipogenesis unchecked ' +
      'and transiently depletes ATP/Pi, raising uric acid. Central to fructose’s metabolic effects.',
    'fructose-1-phosphate glyceraldehyde-dhap':
      'Aldolase B cleaves fructose-1-phosphate; its deficiency causes hereditary fructose intolerance, where ' +
      'fructose-1-phosphate accumulates, sequesters phosphate, and triggers hypoglycemia and liver injury ' +
      'on fructose ingestion.',
    'glyceraldehyde-dhap glyceraldehyde-3-phosphate':
      'Triokinase phosphorylates glyceraldehyde to join glycolysis below PFK-1; the DHAP produced is also a ' +
      'precursor for glycerol-3-phosphate and triglyceride synthesis — the lipogenic exit linking high ' +
      'fructose intake to hepatic fat.',
  },
  galactose_metabolism: {
    'galactose galactose-1-phosphate':
      'Galactokinase phosphorylates galactose (from lactose digestion). GALK1 deficiency is a milder ' +
      'galactosemia whose main feature is cataracts, from galactose diverted to galactitol by aldose ' +
      'reductase in the lens.',
    'galactose-1-phosphate glucose-1-phosphate':
      'GALT (galactose-1-phosphate uridyltransferase) deficiency is classic galactosemia — toxic ' +
      'galactose-1-phosphate accumulation causes liver failure, E. coli sepsis, and intellectual disability, ' +
      'managed by lifelong galactose/lactose restriction.',
  },
  bile_acid_synthesis: {
    'cholesterol 7alpha-hydroxycholesterol':
      'CYP7A1 is the rate-limiting step of the classic (neutral) pathway and the body’s principal route for ' +
      'eliminating cholesterol. It is feedback-repressed by bile acids via FXR→SHP and intestinal FGF15/19 — ' +
      'the mechanism behind bile-acid sequestrants and FXR agonists.',
    '7alpha-hydroxycholesterol cholic-acid':
      '12α-hydroxylation by CYP8B1 commits flux toward cholic acid; CYP8B1 activity sets the ' +
      'cholic:chenodeoxycholic ratio, which tunes intestinal cholesterol/fat absorption and is an emerging ' +
      'metabolic drug target.',
    '7alpha-hydroxycholesterol chenodeoxycholic-acid':
      'Skipping CYP8B1 yields chenodeoxycholic acid, the most potent endogenous FXR ligand. The alternative ' +
      '(acidic) pathway initiated by mitochondrial CYP27A1 predominates in the fetus and contributes more ' +
      'when CYP7A1 is limited.',
  },
  niacin_nad_synthesis: {
    'tryptophan quinolinic-acid':
      'The de-novo route makes NAD from tryptophan via the kynurenine pathway (TDO/IDO-initiated); ~60 mg ' +
      'tryptophan substitutes for ~1 mg niacin. Its intermediate quinolinic acid is also an NMDA-receptor ' +
      'excitotoxin, linking NAD synthesis to neuroinflammation.',
    'quinolinic-acid nicotinic-acid-mononucleotide':
      'Quinolinate phosphoribosyltransferase (QPRT) channels quinolinic acid into the NAD pool. B6 and ' +
      'riboflavin deficiencies upstream in the kynurenine pathway impair de-novo NAD synthesis and can ' +
      'precipitate pellagra despite adequate tryptophan.',
    'nicotinic-acid nicotinamide-adenine-dinucleotide':
      'The Preiss–Handler salvage builds NAD from dietary niacin via NaPRT → NMNAT → NAD synthetase. ' +
      'Pharmacologic nicotinic acid (but not nicotinamide) also lowers lipids and causes flushing via ' +
      'GPR109A — a role distinct from its vitamin function.',
    'nr nicotinamide-adenine-dinucleotide':
      'Nicotinamide riboside is salvaged via NRK → NMNAT (and NMN similarly) — the basis of NR/NMN ' +
      '“NAD-boosting” supplements that target the age-related decline in NAD⁺ and sirtuin activity.',
  },
  retinol_vitamin_a_metabolism: {
    'beta-carotene retinol':
      'BCO1 centrally cleaves provitamin-A carotenoids (β-carotene) to retinal; conversion efficiency varies ' +
      'widely by genotype, so plant carotenoids are a less reliable vitamin-A source than preformed retinyl ' +
      'esters from animal foods.',
    'retinol retinaldehyde':
      'Retinol dehydrogenase reversibly oxidizes retinol to retinaldehyde, which is also the visual ' +
      'chromophore (11-cis-retinal in rhodopsin) — the basis of vitamin-A-deficiency night blindness.',
    'retinaldehyde retinoic-acid':
      'RALDH irreversibly makes retinoic acid, the active transcriptional ligand, only in restricted tissues ' +
      '(limb buds, immune cells). This irreversible, localized production keeps retinoic-acid signaling ' +
      'tightly compartmentalized and underlies retinoid teratogenicity.',
    'retinoic-acid rar-rxr-binding':
      'Retinoic acid binds nuclear RAR (with an RXR partner) at RARE elements to drive differentiation genes ' +
      '— exploited by isotretinoin (acne) and by ATRA, which forces differentiation in acute promyelocytic ' +
      'leukemia.',
  },
  transsulfuration_cysteine_glutathione: {
    'homocysteine + serine cystathionine':
      'Cystathionine β-synthase commits homocysteine to disposal (transsulfuration) rather than ' +
      'remethylation; it needs P5P (B6) and is activated by SAM, so a high methyl state routes homocysteine ' +
      'to catabolism. CBS deficiency causes classic homocystinuria.',
    'cystathionine cysteine + α-ketobutyrate':
      'Cystathionine γ-lyase (also P5P-dependent) releases cysteine — making cysteine only conditionally ' +
      'non-essential, dependent on adequate methionine/homocysteine. This is how dietary methionine ' +
      'ultimately yields cysteine, taurine, and glutathione.',
    'cysteine γ-glutamylcysteine':
      'γ-glutamylcysteine ligase is the rate-limiting step of glutathione synthesis, feedback-inhibited by ' +
      'GSH; the cysteine supplied by transsulfuration is usually the limiting substrate, tying methionine/B6 ' +
      'status to antioxidant capacity.',
    'γ-glutamylcysteine + glycine glutathione (GSH)':
      'Glutathione synthetase adds glycine to complete the tripeptide. Transsulfuration thus feeds the ' +
      'body’s main thiol antioxidant, and oxidative demand for GSH pulls homocysteine toward this route and ' +
      'away from remethylation.',
    'cysteine hypotaurine → taurine':
      'An alternative cysteine fate: cysteine dioxygenase then CSAD make hypotaurine → taurine, among the ' +
      'most abundant free amino acids (bile-salt conjugation, osmoregulation, membrane stabilization) and ' +
      'conditionally essential in infants.',
    'cysteine H₂S (gasotransmitter)':
      'The same CBS/CSE enzymes (with 3-MST) also generate hydrogen sulfide, a gasotransmitter causing ' +
      'vasorelaxation and neuromodulation — placing the transsulfuration enzymes at the heart of H₂S ' +
      'signaling alongside their metabolic role.',
    'GSH GSSG (consumed)':
      'Glutathione peroxidase (a selenoenzyme) spends two GSH to reduce H₂O₂ and lipid peroxides to water — ' +
      'the antioxidant payoff of the cysteine supplied by transsulfuration.',
    'GSSG GSH (regenerated)':
      'Glutathione reductase regenerates GSH from GSSG using NADPH (from the pentose-phosphate pathway), ' +
      'closing the redox cycle; the GSH:GSSG ratio reports cellular oxidative state.',
  },
  serine_one_carbon_biosynthesis: {
    '3-phosphoglycerate (3-PG, glycolysis) 3-phosphohydroxypyruvate':
      'PHGDH diverts the glycolytic intermediate 3-phosphoglycerate into serine synthesis and is ' +
      'rate-limiting; it is amplified in several cancers (breast, melanoma), an oncology target because ' +
      'tumors lean on serine/one-carbon flux for nucleotides and methylation.',
    '3-phosphohydroxypyruvate + glutamate 3-phosphoserine + α-KG':
      'PSAT1 transaminates using glutamate, coupling serine synthesis to nitrogen and α-ketoglutarate ' +
      'balance — a route by which proliferating cells also generate one-carbon units and NADPH.',
    '3-phosphoserine serine':
      'Phosphoserine phosphatase completes de-novo serine synthesis. Serine is both proteinogenic and the ' +
      'principal donor of one-carbon units (via SHMT) for thymidylate, purines, and methylation, so its ' +
      'supply gates nucleotide synthesis.',
    'serine + THF glycine + N5,N10-methylene-THF':
      'Serine hydroxymethyltransferase is the major one-carbon source, making 5,10-methylene-THF and glycine. ' +
      'Cytosolic SHMT1 and mitochondrial SHMT2 compartmentalize one-carbon flux, with SHMT2 frequently ' +
      'upregulated in tumors.',
    'glycine + THF CO₂ + NH₃ + N5,N10-methylene-THF':
      'The mitochondrial glycine cleavage system is a second one-carbon source, degrading glycine into the ' +
      'folate pool. Its defect causes nonketotic hyperglycinemia; with SHMT it balances serine/glycine and ' +
      'one-carbon supply.',
    'methylene-THF + dUMP dTMP + DHF':
      'Thymidylate synthase uses 5,10-methylene-THF to make dTMP for DNA, oxidizing folate to DHF (which DHFR ' +
      'must re-reduce) — the node hit by 5-fluorouracil, and indirectly by antifolates that starve it of ' +
      'reduced folate.',
    'methylene-THF methyl-THF (for SAM regeneration)':
      'MTHFR irreversibly commits one-carbon units to the remethylation arm (homocysteine → methionine → ' +
      'SAM), trading nucleotide-synthesis folate for methylation capacity — the branch point shifted by the ' +
      'common C677T variant.',
  },
  glutamate_glutamine_cycle: {
    'glutamate glutamine':
      'Astrocytic glutamine synthetase fixes ammonia onto glutamate, both detoxifying NH4⁺ and recycling the ' +
      'glutamate taken up after synaptic release. This astrocyte–neuron glutamate–glutamine cycle refills ' +
      'releasable transmitter while clearing brain ammonia.',
    'glutamine glutamate':
      'Neuronal glutaminase regenerates transmitter glutamate (releasing ammonia). Tumors also upregulate ' +
      'glutaminase for “glutamine addiction” (anaplerosis), the rationale for glutaminase-inhibitor ' +
      'oncology drugs.',
    'alpha-ketoglutarate glutamate':
      'Glutamate dehydrogenase reversibly links the TCA cycle (α-ketoglutarate) to amino-acid nitrogen, ' +
      'providing anaplerosis and nitrogen disposal; activating GDH mutations cause the ' +
      'hyperinsulinism–hyperammonemia syndrome.',
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
