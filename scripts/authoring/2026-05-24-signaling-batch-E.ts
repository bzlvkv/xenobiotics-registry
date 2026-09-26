/**
 * 2026-05-24-signaling-batch-E.ts
 *
 * step.note grind, batch E — 6 pathways. Refs title-checked via esummary
 * 2026-05-24; notes-only except cd4 (existing ref was GATA-3/Th2-only, so a
 * canonical CD4-differentiation review is added, PMID confirmed via esearch):
 *   cd4_helper_th1_th2_th17_treg  PMID:16467870 (GATA-3) + ADD 20192806 (Zhu/Paul 2010 ARI)
 *   mineralocorticoid_receptor    PMID:30678864, 10639017
 *   muscarinic_receptor_subtypes  PMID:17073660
 *   nicotinic_ach_receptor_pharmacology  PMID:30137518
 *   progesterone_receptor_signaling  PMID:28651856, 15714387, 29544630 (neurosteroid/GABA-A)
 *   klotho_fgf23_phosphate_axis   PMID:30455427 (Nat Rev Nephrol), 32982966
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-E.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; addRefs?: string[]; notes: Record<string, string> }> = [
  {
    slug: 'cd4_helper_th1_th2_th17_treg',
    addRefs: ['PMID:20192806'],
    notes: {
      'naive CD4+ T cell + TCR + IL-12 Th1 polarization (T-bet+)':
        'Naive CD4 T cells differentiate by the cytokines present at activation. IL-12 (from dendritic cells ' +
        'sensing intracellular microbes) with IFN-γ drives Th1 via the master factor T-bet. Th1 cells make IFN-γ ' +
        'to activate macrophages against intracellular pathogens — and when dysregulated drive organ-specific ' +
        'autoimmunity.',
      'naive CD4+ + IL-4 Th2 polarization (GATA3+)':
        'IL-4 polarizes naive CD4 cells to Th2 via the master regulator GATA-3 in a self-amplifying, ' +
        'STAT6-dependent loop. Th2 cells produce IL-4/IL-5/IL-13 to drive antibody and eosinophil responses ' +
        'against helminths — and, when misdirected, allergy and asthma.',
      'naive CD4+ + TGF-β + IL-6 + IL-23 Th17 polarization (RORγt+)':
        'TGF-β with the inflammatory cytokines IL-6 and IL-23 induces Th17 via RORγt. Th17 cells make IL-17/IL-22 ' +
        'to recruit neutrophils against extracellular bacteria and fungi at barriers — and are central to ' +
        'psoriasis, IBD, and other autoimmunity, the target of anti-IL-17/IL-23 biologics.',
      'naive CD4+ + TGF-β + IL-2 (no IL-6) iTreg polarization (FoxP3+)':
        'The same TGF-β, but with IL-2 and without IL-6, instead induces peripheral FoxP3+ regulatory T cells ' +
        '(iTreg). The IL-6 switch between an inflammatory Th17 fate and a tolerogenic Treg fate from a shared ' +
        'TGF-β signal is a pivotal decision point — explaining how inflammation can tip the balance toward ' +
        'autoimmunity.',
      'Th17 ↔ iTreg lineage plasticity (TGF-β / IL-6 balance)':
        'Th17 and iTreg are not fixed: they show plasticity, interconverting as the TGF-β/IL-6 balance shifts, and ' +
        'Th17 cells can acquire pathogenic features. This flexibility — once thought impossible for differentiated ' +
        'helper cells — complicates the classical lineage model and is therapeutically relevant.',
      'effector Th1/Th17 glycolytic metabolic state (mTORC1-driven)':
        'Fate is coupled to metabolism: effector Th1/Th17 cells adopt aerobic glycolysis driven by mTORC1, whereas ' +
        'Tregs rely more on oxidative/fatty-acid metabolism. This divergence means mTOR inhibitors (rapamycin) ' +
        'preferentially spare and expand Tregs — linking immunometabolism to immunosuppressive strategy.',
    },
  },
  {
    slug: 'mineralocorticoid_receptor',
    notes: {
      'angiotensin II + ↑[K⁺] + ACTH aldosterone synthesis (zona glomerulosa)':
        'Aldosterone is made in the adrenal zona glomerulosa, driven chiefly by angiotensin II (via the ' +
        'renin-angiotensin system) and by rising plasma K⁺, with ACTH only a minor acute stimulus. This dual ' +
        'control lets aldosterone serve both volume/blood-pressure regulation (via AngII) and potassium ' +
        'homeostasis.',
      'aldosterone MR (cytoplasmic → nuclear)':
        'Aldosterone, being lipophilic, enters cells and binds the cytoplasmic mineralocorticoid receptor, which ' +
        'sheds chaperones and translocates to the nucleus as a ligand-activated transcription factor. As a steroid ' +
        'receptor, the MR works over hours — the “genomic” phase of aldosterone action.',
      'MR-aldosterone SGK1 induction (early)':
        'An early MR target is SGK1, a kinase that stabilizes ENaC at the membrane (by phosphorylating the ' +
        'ubiquitin ligase Nedd4-2). SGK1 induction is among the fastest transcriptional responses, giving the ' +
        'rapid arm of aldosterone’s effect on sodium transport before slower channel synthesis.',
      'MR-aldosterone ENaC αβγ + ROMK transcription':
        'MR drives transcription of the epithelial sodium channel (ENaC α/β/γ) and the potassium channel ROMK in ' +
        'the distal nephron, increasing Na⁺ reabsorption and K⁺ secretion. This is the core action that expands ' +
        'volume and raises blood pressure — and the step blocked by amiloride (ENaC) and by MR antagonists.',
      'cortisol + 11β-HSD2 deficiency / licorice MR over-activation (AME)':
        'The MR is not aldosterone-selective: cortisol binds it equally, and selectivity depends on 11β-HSD2 ' +
        'converting cortisol to inactive cortisone in MR cells. When this enzyme fails (genetic AME) or is ' +
        'inhibited (licorice/glycyrrhetinic acid), cortisol floods the MR — causing hypertension and hypokalemia ' +
        'from apparent mineralocorticoid excess.',
      'extra-renal MR (heart, vessels) fibrosis + endothelial dysfunction':
        'MR is also expressed in heart, vasculature, and immune cells, where chronic activation drives fibrosis, ' +
        'inflammation, and endothelial dysfunction independent of blood pressure. This is the rationale for MR ' +
        'antagonists (spironolactone, eplerenone, finerenone) in heart failure and diabetic kidney disease.',
    },
  },
  {
    slug: 'muscarinic_receptor_subtypes',
    notes: {
      'ACh release at parasympathetic terminal muscarinic receptor binding (M1–M5)':
        'Muscarinic receptors are the metabotropic (GPCR) arm of cholinergic signaling, activated by ACh from ' +
        'parasympathetic and some CNS terminals. The five subtypes M1–M5 share ACh but differ in G-protein ' +
        'coupling and tissue distribution — the basis for the broad, system-wide effects of muscarinic drugs.',
      'M1 / M3 / M5 (Gq) PLC → IP3 + DAG → Ca²⁺ + PKC':
        'The odd-numbered receptors M1/M3/M5 couple to Gq, activating PLC to make IP3 and DAG — raising ' +
        'intracellular Ca²⁺ and activating PKC. This excitatory/secretory branch drives smooth-muscle contraction ' +
        'and glandular secretion, the classic “rest-and-digest” parasympathetic outputs.',
      'M2 / M4 (Gi) ↓cAMP + ↑GIRK K⁺ → hyperpolarization':
        'The even-numbered M2/M4 couple to Gi, lowering cAMP and opening GIRK potassium channels to hyperpolarize ' +
        'the cell. In the heart, M2 slows rate and conduction — the vagal brake that atropine blocks — making this ' +
        'the inhibitory branch of muscarinic signaling.',
      'M3 endothelial eNOS → NO → vasodilation':
        'On vascular endothelium, M3 raises Ca²⁺ to stimulate eNOS, generating nitric oxide that relaxes the ' +
        'underlying smooth muscle — vasodilation. This is why infused muscarinic agonists dilate vessels despite ' +
        'M3 contracting other smooth muscle: the effect requires an intact endothelium.',
      'M3 bronchial smooth muscle bronchoconstriction':
        'In airway smooth muscle, M3 (Gq) drives bronchoconstriction — the target of inhaled antimuscarinic ' +
        'bronchodilators (ipratropium, tiotropium) in COPD and asthma. Vagal cholinergic tone is a major ' +
        'reversible component of airway narrowing.',
      'M1 CNS (cortex / hippocampus) cognitive function + memory':
        'In cortex and hippocampus, M1 supports learning and memory — why the cholinergic deficit of Alzheimer’s ' +
        'is treated with cholinesterase inhibitors and why antimuscarinic (“anticholinergic”) drugs impair ' +
        'cognition. M1-selective agonists and PAMs have long been pursued as cognitive enhancers.',
    },
  },
  {
    slug: 'nicotinic_ach_receptor_pharmacology',
    notes: {
      'ACh release at synaptic cleft nAChR binding (2 ACh per pentamer required)':
        'Nicotinic receptors are pentameric ligand-gated ion channels — the fast, ionotropic arm of cholinergic ' +
        'signaling. Two ACh molecules must bind at subunit interfaces to open the pore, giving a steep, ' +
        'cooperative response. The varied subunit combinations generate subtypes with distinct pharmacology.',
      'nAChR open state (ms) Na⁺/Ca²⁺/K⁺ influx → depolarization':
        'Agonist binding opens the channel for milliseconds, letting Na⁺ and Ca²⁺ in and K⁺ out — a depolarizing ' +
        'cation current. The Ca²⁺ permeability matters: it lets nAChRs trigger downstream signaling (transmitter ' +
        'release, gene expression) beyond simple electrical excitation.',
      'sustained ACh / agonist exposure desensitized state (slow recovery)':
        'With sustained agonist exposure, nAChRs enter a desensitized, non-conducting state that recovers slowly. ' +
        'This is pharmacologically central: it explains nicotine tolerance, the depolarizing block of ' +
        'succinylcholine, and why a steady agonist (a nicotine patch) behaves very differently from phasic ACh.',
      'NMJ nAChR (α1β1δε) end-plate depolarization → muscle contraction':
        'The muscle-type receptor (α1β1δε) at the neuromuscular junction converts motor-nerve ACh into end-plate ' +
        'depolarization and contraction. It is the target of non-depolarizing blockers (rocuronium, vecuronium) ' +
        'used for surgical paralysis, and the autoantigen in myasthenia gravis.',
      'α7 nAChR (CNS / immune) cognitive + anti-inflammatory cholinergic pathway':
        'The homomeric α7 receptor, highly Ca²⁺-permeable, is found in CNS (cognition) and on macrophages, where ' +
        'it mediates the cholinergic anti-inflammatory pathway — vagal ACh suppressing cytokine release. This ' +
        'links nervous and immune systems and makes α7 a target for cognition and inflammatory disease.',
      'α4β2 nAChR (CNS) nicotine reward circuit → addiction':
        'The α4β2 subtype is the high-affinity nicotine receptor in the brain’s reward circuitry; nicotine acting ' +
        'here drives dopamine release and addiction. It is the target of smoking-cessation drugs — varenicline is ' +
        'a partial agonist that both relieves craving and blunts nicotine’s reward.',
    },
  },
  {
    slug: 'progesterone_receptor_signaling',
    notes: {
      'pregnenolone → progesterone (corpus luteum, placenta, adrenal) circulating progesterone':
        'Progesterone is synthesized from pregnenolone (itself from cholesterol) in the corpus luteum, placenta, ' +
        'and adrenal cortex. Luteal progesterone maintains early pregnancy until the placenta takes over — the ' +
        'basis for progesterone support in assisted reproduction and the target of antiprogestins (mifepristone).',
      'progesterone PR (cytoplasm, HSP90-bound) → activated PR':
        'Like other steroids, progesterone enters cells and binds the progesterone receptor, displacing HSP90 to ' +
        'yield an activated, dimerizing receptor. PR is itself an estrogen-induced gene, so PR expression marks ' +
        'estrogen-primed tissue — the logic behind PR status as a breast-cancer biomarker.',
      'PR-A vs PR-B isoforms differential PRE binding + tissue-specific transcription':
        'PR exists as two isoforms from one gene — PR-B (a strong activator) and the shorter PR-A (often a ' +
        'repressor of PR-B and other steroid receptors). Their ratio varies by tissue and sets the net response, ' +
        'explaining progesterone’s opposite effects in, e.g., uterus versus mammary gland.',
      'PR-PRE complex target gene transcription':
        'The activated PR binds progesterone response elements and recruits coactivators to drive genes that, in ' +
        'the uterus, oppose estrogen-driven proliferation and prepare the endometrium for implantation. This ' +
        'anti-estrogenic, differentiating action underlies the endometrial protection from progestins in hormone ' +
        'therapy.',
      'progesterone (rapid) membrane mPR (PAQR family) → Gi/o':
        'Progesterone also acts rapidly through membrane progesterone receptors (mPRs, the PAQR family) coupled to ' +
        'Gi/o — too fast for transcription. These non-classical receptors mediate effects in sperm, oocytes, and ' +
        'smooth muscle (e.g. myometrial quiescence), broadening signaling beyond the nuclear receptor.',
      'progesterone (peripheral) allopregnanolone (5α-reductase + 3α-HSD)':
        'In peripheral tissues and brain, progesterone is reduced by 5α-reductase and 3α-HSD to allopregnanolone, ' +
        'a potent positive allosteric modulator of GABA-A receptors. This anxiolytic/sedative neurosteroid links ' +
        'progesterone fluctuations to mood (PMDD, postpartum) and is the basis of brexanolone for postpartum ' +
        'depression.',
    },
  },
  {
    slug: 'klotho_fgf23_phosphate_axis',
    notes: {
      '↑serum Pi + ↑calcitriol osteocyte FGF23 secretion':
        'FGF23 is a bone-derived hormone secreted by osteocytes in response to rising serum phosphate and ' +
        'calcitriol (1,25-D). It is the body’s principal phosphate-lowering signal — the afferent limb of a ' +
        'feedback loop against phosphate excess, which is why FGF23 rises early and markedly in chronic kidney ' +
        'disease.',
      'FGF23 + αKlotho (PT cell) FGFR1c high-affinity activation':
        'FGF23 binds FGF receptors only weakly on its own; it requires the co-receptor αKlotho to activate FGFR1c ' +
        'with high affinity. Because Klotho is expressed in only a few tissues (notably kidney), it confers tissue ' +
        'specificity — restricting FGF23’s action to Klotho-expressing organs despite ubiquitous FGFRs.',
      'FGF23-Klotho-FGFR1c (kidney PT) ↓NaPi-2a / NaPi-2c brush-border transporters':
        'In the proximal tubule, FGF23-Klotho-FGFR1c signaling downregulates the brush-border phosphate ' +
        'transporters NaPi-2a/NaPi-2c, reducing phosphate reabsorption and promoting phosphaturia. This is the ' +
        'central phosphate-excreting action of the axis, opposing dietary phosphate loading.',
      'FGF23 (kidney) ↓CYP27B1 + ↑CYP24A1':
        'FGF23 also suppresses calcitriol: it inhibits CYP27B1 (1α-hydroxylase) and induces CYP24A1 (the catabolic ' +
        '24-hydroxylase), lowering active vitamin D. This dampens intestinal phosphate and calcium absorption — ' +
        'coordinating renal and intestinal handling, and contributing to the low calcitriol of CKD.',
      'FGF23 (parathyroid) ↓PTH (acute)':
        'Acutely, FGF23 acts on the parathyroid to suppress PTH — an additional feedback arm. In advanced CKD, ' +
        'however, the parathyroid becomes FGF23-resistant (Klotho is downregulated), which together with low ' +
        'calcitriol drives the secondary hyperparathyroidism of kidney disease.',
      'membrane Klotho soluble Klotho (sKL) by ADAM10/17 + γ-secretase shedding':
        'The Klotho ectodomain is shed by ADAM10/17 and γ-secretase to release soluble Klotho (sKL), a ' +
        'circulating, FGF23-independent factor acting on ion channels, growth-factor signaling, and ' +
        'anti-aging/anti-fibrotic processes. Declining Klotho with age and in CKD makes it a biomarker and ' +
        'therapeutic target.',
    },
  },
];

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }>; refs?: string[] }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let totalAdded = 0;
let totalRefs = 0;
for (const { slug, notes, addRefs } of BATCH) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  let added = 0;
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = notes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(notes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
  if (addRefs?.length) {
    pw.refs = pw.refs ?? [];
    for (const r of addRefs) if (!pw.refs.includes(r)) { pw.refs.push(r); totalRefs++; }
  }
  console.log(`${slug}: added ${added} step notes${addRefs?.length ? ` (+${addRefs.length} ref)` : ''}`);
  totalAdded += added;
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`batch E total: ${totalAdded} notes, ${totalRefs} refs`);
