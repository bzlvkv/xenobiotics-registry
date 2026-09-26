/**
 * 2026-05-23-receptor-nuclear-step-pins.ts
 *
 * Third batch of PathwayModulator.step pins (see adrenergic pilot +
 * receptor-pharmacology batch). Covers the nuclear/membrane-receptor
 * pathways. Per-modulator + reviewed; only the high-confidence core is
 * pinned, judgment-call modulators are left unpinned (flagged in the
 * session notes for a separate decision):
 *
 *  estrogen_receptor_genomic_nongenomic
 *    step 1 (E2 + ER → activated dimer): all ER ligands — endogenous/
 *      synthetic estrogens, SERMs/SERD (tamoxifen, clomiphene,
 *      fulvestrant), phytoestrogens (genistein, daidzein, resveratrol,
 *      curcumin, egcg). They all bind ER at step 1; genomic/nongenomic
 *      branches (steps 2–5) are the receptor's downstream action.
 *    step 0 (aromatase): anastrozole/letrozole/exemestane.
 *    NOT pinned: spironolactone (weak ER off-target; primary AR).
 *
 *  vdr_genomic_signaling
 *    step 3 (calcitriol + VDR → VDR-RXR): calcitriol, calcipotriene.
 *    step 1 (D₃/D₂ → 25-OH-D): cholecalciferol, ergocalciferol (substrates).
 *    NOT pinned: calcium (target endpoint), magnesium (CYP27B1/CYP24A1
 *      cofactor, multi-step), mk4/mk7/vitamin-k2-mk7 (K-axis crosstalk).
 *
 *  fxr_tgr5_bile_acid_receptor
 *    step 2 (CDCA binding FXR → FXR-RXR): colesevelam, cholestyramine
 *      (sequestrants modulating FXR signal), metformin (indirect FXR).
 *    NOT pinned: the 5 GLP-1R agonists tagged "TGR5 indirect"
 *      (semaglutide, liraglutide, retatrutide, tirzepatide, dulaglutide)
 *      — they act on GLP-1R, not TGR5; likely belong in a GLP-1 pathway.
 *
 * No citations touched. Idempotent; validates every slug/step before
 * writing. Run once:
 *   tsx scripts/authoring/2026-05-23-receptor-nuclear-step-pins.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Modulator { slug: string; step?: number; [k: string]: unknown }
interface Pathway { slug: string; steps: unknown[]; modulators?: Modulator[]; [k: string]: unknown }

const PINS: Record<string, Record<number, string[]>> = {
  estrogen_receptor_genomic_nongenomic: {
    0: ['anastrozole', 'letrozole', 'exemestane'],
    1: ['estradiol', 'ethinyl-estradiol', 'hormonal-contraceptives', 'tamoxifen', 'clomiphene',
        'fulvestrant', 'genistein', 'daidzein', 'resveratrol', 'curcumin', 'egcg'],
  },
  vdr_genomic_signaling: {
    1: ['cholecalciferol', 'ergocalciferol'],
    3: ['calcitriol', 'calcipotriene'],
  },
  fxr_tgr5_bile_acid_receptor: {
    2: ['colesevelam', 'cholestyramine', 'metformin'],
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
