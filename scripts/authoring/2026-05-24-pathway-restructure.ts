/**
 * 2026-05-24-pathway-restructure.ts
 *
 * Fixes the 6 data-smell pathways flagged after the step.note grind — the
 * only remaining note-less steps, all degenerate edges (self-loops /
 * back-edges) that needed restructuring, not annotation.
 *
 * Part A — 5 loop edges fixed IN PLACE (same index + `from`; the junk `to`
 *   is rewritten to the pathway's real missing downstream/termination node,
 *   plus a note). In-place keeps step indices stable, so the 31 step-0 pins
 *   on adrenergic_receptor_signaling stay valid. Idempotent: applies the
 *   junk→correct rewrite if present, skips if already corrected, else throws.
 *
 * Part B — insulin_glucose_homeostasis fully rebuilt from a degenerate
 *   slug-node skeleton (insulin-receptor-activation→glucose back-edge,
 *   glp-1→glp-1 self-loop) into a coherent 9-step T2D pathway with notes,
 *   and all 26 modulators pinned to their mechanistic step. Adds the
 *   verified ADA-EASD 2022 consensus (PMID:36151309) for the drug-target steps.
 *   esummary-verified 2026-05-24: 3056758 (Reaven), 11742412 (Saltiel-Kahn),
 *   36151309 (Davies ADA-EASD 2022).
 *   tsx scripts/authoring/2026-05-24-pathway-restructure.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Step = { from: string; to: string; via?: string; note?: string };
type Mod = { slug: string; effect?: string; target?: string; step?: number; note?: string; source_pmid?: string };
type Pathway = { slug: string; steps: Step[]; modulators?: Mod[]; refs?: string[] };

// ---- Part A: in-place loop-edge fixes -------------------------------------
const EDGE_FIXES: Array<{ slug: string; from: string; oldTo: string; newTo: string; note: string }> = [
  {
    slug: 'adrenergic_receptor_signaling',
    from: 'adrenergic-receptor-activation',
    oldTo: 'norepinephrine',
    newTo: 'G-protein second-messenger response (β→Gs/cAMP, α1→Gq/Ca²⁺, α2→Gi)',
    note:
      'Adrenergic receptors are GPCRs whose downstream signal depends on subtype: β (Gs) raise cAMP/PKA, α1 (Gq) ' +
      'drive PLC→IP3/Ca²⁺, and α2 (Gi) lower cAMP. This subtype-to-G-protein coupling converts one transmitter ' +
      'into opposite tissue effects — and is exactly what subtype-selective agonists and blockers exploit.',
  },
  {
    slug: 'dopamine_receptor_signaling',
    from: 'dopamine-receptor-activation',
    oldTo: 'dopamine',
    newTo: 'cAMP second-messenger shift (D1-like ↑ / D2-like ↓)',
    note:
      'Dopamine receptors signal through cAMP: the D1-like family (D1, D5; Gs) raises it and the D2-like family ' +
      '(D2, D3, D4; Gi) lowers it. This opposing coupling means a dopaminergic drug’s net effect depends on which ' +
      'family it engages — the basis of antipsychotic (D2-blocking) versus Parkinson’s (D1/D2-boosting) pharmacology.',
  },
  {
    slug: 'serotonin_receptor_pharmacology',
    from: '5ht-receptor-activation',
    oldTo: 'serotonin',
    newTo: 'downstream GPCR / ion-channel signaling',
    note:
      'The 5-HT receptor families transduce differently: most are GPCRs (5-HT1 Gi→↓cAMP, 5-HT2 Gq→IP3/Ca²⁺, ' +
      '5-HT4/6/7 Gs→↑cAMP), while 5-HT3 is a ligand-gated cation channel. This signaling diversity is why ' +
      'serotonergic drugs are so varied — and why subtype selectivity (triptans at 5-HT1B/1D, setrons at 5-HT3) matters.',
  },
  {
    slug: 'camp_pka_second_messenger',
    from: 'adenylate-cyclase-activation',
    oldTo: 'adenylate-cyclase-activation',
    newTo: 'cAMP degraded by phosphodiesterase (signal termination)',
    note:
      'The signal is switched off by phosphodiesterases (PDEs), which hydrolyze cAMP back to 5′-AMP — setting the ' +
      'duration and amplitude of the response. This off-switch is itself a major drug target: PDE inhibitors ' +
      '(caffeine/theophylline non-selectively, milrinone PDE3, apremilast/roflumilast PDE4) raise cAMP by blocking ' +
      'its degradation.',
  },
  {
    slug: 'pde5_no_cgmp_axis',
    from: 'cgmp-rise',
    oldTo: 'cgmp-rise',
    newTo: 'cGMP degraded by PDE5 (signal termination)', // ≤80, loader-safe
    note:
      'PDE5 hydrolyzes cGMP back to 5′-GMP, terminating the relaxation signal — most prominently in the corpus ' +
      'cavernosum and pulmonary vasculature. Blocking PDE5 (sildenafil, tadalafil, vardenafil) sustains cGMP, which ' +
      'is why these drugs amplify an NO-initiated signal but still require NO/arousal to start it.',
  },
];

// ---- Part B: insulin_glucose_homeostasis rebuild --------------------------
const INSULIN_STEPS: Step[] = [
  {
    from: '↑ blood glucose (post-meal)',
    to: 'β-cell glucose sensing — GLUT2 + glucokinase → ↑ ATP/ADP',
    via: 'glucokinase is the rate-setting glucose sensor of the pancreatic β-cell',
    note:
      'Glucose entering the pancreatic β-cell is phosphorylated by glucokinase — the low-affinity “glucose sensor” ' +
      'whose rate sets the threshold for insulin release. Rising glucose lifts the ATP/ADP ratio; inactivating ' +
      'glucokinase mutations cause MODY2 and activating ones cause hyperinsulinism, proving its gatekeeper role.',
  },
  {
    from: 'β-cell glucose sensing — GLUT2 + glucokinase → ↑ ATP/ADP',
    to: 'KATP closure → depolarization → Ca²⁺ influx → insulin exocytosis',
    via: 'ATP closes the KATP channel (Kir6.2/SUR1); sulfonylureas & glinides close it pharmacologically',
    note:
      'The ATP/ADP rise closes the KATP channel (Kir6.2 pore + SUR1 subunit), depolarizing the β-cell to open ' +
      'voltage-gated Ca²⁺ channels and trigger insulin-granule exocytosis. Sulfonylureas and meglitinides bind SUR1 ' +
      'to force this closure — raising insulin regardless of glucose, hence their hypoglycemia risk.',
  },
  {
    from: 'KATP closure → depolarization → Ca²⁺ influx → insulin exocytosis',
    to: 'secreted insulin → insulin receptor (IR) activation (muscle/fat/liver)',
    via: 'insulin and its analogs bind the IR, a receptor tyrosine kinase; autophosphorylation recruits IRS-1',
    note:
      'Secreted insulin binds the insulin receptor (IR), a receptor tyrosine kinase that autophosphorylates and ' +
      'recruits IRS adaptors on target tissues. Injected insulin and engineered analogs (glargine, lispro) act here, ' +
      'differing mainly in absorption kinetics — the basis of basal versus prandial insulin dosing.',
  },
  {
    from: 'secreted insulin → insulin receptor (IR) activation (muscle/fat/liver)',
    to: 'IRS-1 → PI3K → AKT (metabolic arm)',
    via: 'the PI3K/AKT branch carries insulin’s metabolic actions; PPAR-γ tunes peripheral sensitivity',
    note:
      'The IR signals through IRS-1/PI3K/AKT — the metabolic arm that drives glucose uptake and suppresses hepatic ' +
      'output. Insulin resistance is a blunting of this arm; thiazolidinediones (pioglitazone, rosiglitazone) ' +
      'activate adipocyte PPAR-γ to improve peripheral insulin sensitivity, indirectly restoring AKT signaling.',
  },
  {
    from: 'IRS-1 → PI3K → AKT (metabolic arm)',
    to: 'GLUT4 translocation → peripheral glucose uptake (muscle, fat)',
    via: 'AKT drives GLUT4 vesicles to the membrane; exercise does this insulin-independently',
    note:
      'AKT triggers translocation of GLUT4 transporters to the cell membrane, letting muscle and fat take up ' +
      'glucose — the main route of postprandial glucose disposal. Exercise recruits GLUT4 by an insulin-independent ' +
      '(AMPK) route, which is why physical activity lowers glucose even in insulin resistance.',
  },
  {
    from: 'IRS-1 → PI3K → AKT (metabolic arm)',
    to: 'liver: ↓ gluconeogenesis + ↑ glycogen synthesis (↓ hepatic glucose output)',
    via: 'insulin restrains hepatic glucose output; metformin & berberine lower it via AMPK',
    note:
      'In the liver, insulin signaling suppresses gluconeogenesis and promotes glycogen synthesis, cutting hepatic ' +
      'glucose output — the main driver of fasting hyperglycemia in type 2 diabetes. Metformin (mild complex-I ' +
      'inhibition → AMPK) and berberine lower output here, which is why metformin is first-line and rarely causes ' +
      'hypoglycemia.',
  },
  {
    from: 'gut L/K-cells (incretin response to a meal)',
    to: 'GLP-1/GIP → β-cell GLP-1R/GIP-R → glucose-dependent insulin release',
    via: 'incretins amplify glucose-stimulated secretion only when glucose is high',
    note:
      'Nutrients trigger gut L- and K-cells to release the incretins GLP-1 and GIP, which act on β-cell Gs-coupled ' +
      'receptors (raising cAMP) to potentiate insulin secretion — but only when glucose is high, keeping ' +
      'hypoglycemia risk low. GLP-1 agonists (semaglutide, liraglutide) and the dual GIP/GLP-1 agonist tirzepatide ' +
      'exploit this, adding weight loss via central appetite effects.',
  },
  {
    from: 'gut L/K-cells (incretin response to a meal)',
    to: 'DPP-4 rapid degradation of GLP-1/GIP (incretin termination)',
    via: 'DPP-4 inactivates incretins within minutes; gliptins block it',
    note:
      'The incretin signal is short-lived because the enzyme DPP-4 cleaves and inactivates GLP-1/GIP within ' +
      'minutes. DPP-4 inhibitors (“gliptins”: sitagliptin, linagliptin) block this degradation to raise endogenous ' +
      'incretin levels — a weight-neutral, oral, glucose-dependent way to enhance insulin secretion.',
  },
  {
    from: 'renal proximal tubule — filtered glucose',
    to: 'SGLT2 reabsorption (insulin-independent glucose handling)',
    via: 'SGLT2 reclaims ~90% of filtered glucose; inhibitors dump it in urine',
    note:
      'Independently of insulin, the kidney reclaims filtered glucose via SGLT2 in the proximal tubule. SGLT2 ' +
      'inhibitors (empagliflozin, dapagliflozin, canagliflozin) block reabsorption to excrete glucose in urine, ' +
      'lowering glycemia without insulin — and they deliver cardiovascular and renal protection that made them ' +
      'guideline-preferred beyond glucose control.',
  },
];

const INSULIN_PINS: Record<string, number> = {
  glipizide: 1, glyburide: 1, glimepiride: 1, repaglinide: 1, nateglinide: 1, tolbutamide: 1,
  insulin: 2, 'insulin-glargine': 2,
  pioglitazone: 3, rosiglitazone: 3,
  metformin: 5, berberine: 5,
  semaglutide: 6, tirzepatide: 6, liraglutide: 6, dulaglutide: 6, exenatide: 6, lixisenatide: 6, 'glp-1': 6,
  sitagliptin: 7, saxagliptin: 7, linagliptin: 7, alogliptin: 7,
  canagliflozin: 8, dapagliflozin: 8, empagliflozin: 8,
};
const INSULIN_ADD_REF = 'PMID:36151309';

// ---------------------------------------------------------------------------
const data: Pathway[] = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));
const find = (slug: string) => {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  return pw;
};
// Mirror the runtime Zod loader (loader.ts pathwayStep): from/to ≤80,
// via ≤120, note ≤500. registry:lint does NOT enforce these, so guard here.
const check = (note: string, ctx: string) => {
  if (note.length > 500) throw new Error(`${ctx}: note ${note.length} > 500 chars`);
};
const checkNode = (s: string, field: string, ctx: string) => {
  if (s.length > 80) throw new Error(`${ctx}: ${field} ${s.length} > 80 chars — "${s}"`);
};
const checkStep = (s: Step, ctx: string) => {
  checkNode(s.from, 'from', ctx);
  checkNode(s.to, 'to', ctx);
  if (s.via && s.via.length > 120) throw new Error(`${ctx}: via ${s.via.length} > 120 chars`);
  if (s.note) check(s.note, ctx);
};

// Part A
let edgesFixed = 0;
for (const f of EDGE_FIXES) {
  const pw = find(f.slug);
  const junk = pw.steps.find(s => s.from === f.from && s.to === f.oldTo);
  if (junk) {
    check(f.note, `${f.slug}`);
    checkNode(f.newTo, 'newTo', f.slug);
    junk.to = f.newTo;
    junk.note = f.note;
    edgesFixed++;
    console.log(`${f.slug}: loop edge fixed → "${f.newTo}"`);
  } else if (pw.steps.some(s => s.from === f.from && s.to === f.newTo)) {
    console.log(`${f.slug}: already fixed (skip)`);
  } else {
    throw new Error(`${f.slug}: neither junk edge "${f.from} -> ${f.oldTo}" nor fixed edge found`);
  }
}

// Part B
const ins = find('insulin_glucose_homeostasis');
INSULIN_STEPS.forEach((s, i) => checkStep(s, `insulin step ${i}`));
ins.steps = INSULIN_STEPS;
ins.refs = ins.refs ?? [];
let refAdded = 0;
if (!ins.refs.includes(INSULIN_ADD_REF)) { ins.refs.push(INSULIN_ADD_REF); refAdded = 1; }

const mods = ins.modulators ?? [];
const pinSlugs = new Set(Object.keys(INSULIN_PINS));
let pinned = 0;
for (const m of mods) {
  const step = INSULIN_PINS[m.slug];
  if (step === undefined) throw new Error(`insulin modulator "${m.slug}" has no pin assignment`);
  if (step >= INSULIN_STEPS.length) throw new Error(`insulin pin for "${m.slug}" = ${step} out of range`);
  m.step = step;
  pinned++;
  pinSlugs.delete(m.slug);
}
if (pinSlugs.size) throw new Error(`pin-map slug(s) not found among modulators: ${[...pinSlugs].join(', ')}`);
console.log(`insulin_glucose_homeostasis: rebuilt ${INSULIN_STEPS.length} steps, pinned ${pinned}/${mods.length} modulators, +${refAdded} ref`);

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`\nrestructure: ${edgesFixed} edges fixed + insulin rebuilt`);
