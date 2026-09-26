/**
 * 2026-05-12-wave-p123-cluster.ts — Three additional pathways (P1/P2/P3).
 *
 *   P1 pde5_no_cgmp_axis          erectile + pulmonary vascular cGMP axis
 *   P2 nad_sirtuin_axis           NAD+ precursors + sirtuin activators
 *   P3 camp_pka_second_messenger  cAMP / PKA integrative pathway
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'pde5_no_cgmp_axis',
    name: 'PDE5 / NO-cGMP axis (erectile + pulmonary vascular)',
    category: 'signaling',
    systems: ['cardiovascular', 'reproductive'],
    description: `Nitric oxide → sGC → cGMP → PKG smooth-muscle relaxation cascade is the molecular basis of erection (cavernosal sinusoid filling) + pulmonary vasodilation (PAH treatment) + selected antiplatelet activity. PDE5 (phosphodiesterase type 5) is the cGMP-hydrolyzing enzyme concentrated in corpus cavernosum + pulmonary vascular smooth muscle. PDE5 inhibitors (sildenafil, tadalafil, vardenafil, avanafil) preserve cGMP → potentiated NO-dependent vasodilation; nitric oxide is the obligate upstream signal (no NO, no PDE5-i benefit). Riociguat is a sGC stimulator that works NO-independently — synergistic with low endogenous NO. Critical safety: ANY PDE5 inhibitor + organic nitrate is contraindicated (life-threatening hypotension). PDE5 inhibitors also have hearing-loss + NAION (non-arteritic anterior ischemic optic neuropathy) signals. Cross-link: vasodilator_no_endothelin (NO + endothelin antagonists) + nitric_oxide_synthesis (upstream NO production).`,
    steps: [
      { from: 'nitric-oxide', to: 'cgmp-rise', via: 'sGC activation by NO → cGMP from GTP (cross-link: nitric_oxide_synthesis)' },
      { from: 'cgmp-rise', to: 'smooth-muscle-relaxation', via: 'PKG → myosin light-chain phosphatase → relaxation' },
      { from: 'cgmp-rise', to: 'cgmp-rise', via: 'PDE5 hydrolyzes cGMP → 5′-GMP — PDE5 inhibitors block this step → cGMP accumulates' },
    ],
    modulators: [
      { slug: 'sildenafil', effect: 'inhibitor', target: 'PDE5 (selective)', note: 'Viagra; first PDE5-i (1998); short t½ ~4h; food + alcohol delay absorption; PAH indication (Revatio, 20 mg tid)' },
      { slug: 'tadalafil', effect: 'inhibitor', target: 'PDE5 (long-acting)', note: 'Cialis; long t½ ~17.5h enables daily low-dose + on-demand options; PAH (Adcirca 40 mg/d) + BPH indication; less food effect than sildenafil' },
      { slug: 'vardenafil', effect: 'inhibitor', target: 'PDE5 (selective)', note: 'Levitra/Staxyn; intermediate t½ ~4-5h; QT prolongation greater than sildenafil — caution with class III antiarrhythmics' },
      { slug: 'riociguat', effect: 'activator', target: 'sGC (NO-independent stimulator)', note: 'Adempas; PAH + CTEPH; works at low NO (where PDE5-i fails); pregnancy contraindicated; nitrate combination prohibited' },
      { slug: 'dipyridamole', effect: 'inhibitor', target: 'PDE3 + PDE5 (broad) + adenosine reuptake', note: 'antiplatelet + coronary vasodilator; pharmacologic stress testing (coronary steal); cross-link: platelet_aggregation' },
      { slug: 'nitroglycerin', effect: 'activator', target: 'NO release (cross-link: vasodilator_no_endothelin)', note: 'organic nitrate; ABSOLUTE contraindication with any PDE5-i (24h sildenafil/vardenafil, 48h tadalafil) — life-threatening hypotension' },
      { slug: 'isosorbide-mononitrate', effect: 'activator', target: 'NO release', note: 'long-acting organic nitrate; same PDE5-i contraindication' },
    ],
    refs: [],
  },
  {
    slug: 'nad_sirtuin_axis',
    name: 'NAD+ / sirtuin / longevity axis',
    category: 'biosynthesis',
    systems: ['endocrine', 'musculoskeletal'],
    description: `NAD+ is the central redox + signaling cofactor whose tissue levels decline with aging. Synthesis routes: (1) de novo from tryptophan via kynurenine → quinolinate → NaMN → NAAD → NAD+; (2) Preiss-Handler pathway from nicotinic acid (vitamin B3) → NaMN → NAAD → NAD+; (3) salvage from nicotinamide via NAMPT → NMN → NAD+ (rate-limiting NAMPT is the major target of pharmacologic NAD+ raising); (4) supplemental nicotinamide riboside (NR) → NMN → NAD+. Sirtuins (SIRT1-7) are NAD+-dependent class III HDACs that deacetylate transcription factors + metabolic enzymes; require NAD+ as obligate cofactor (releases nicotinamide + 2'-O-acetyl-ADP-ribose). Sirtuin activators (resveratrol, pterostilbene) allosterically enhance SIRT1; mechanism debated as direct vs indirect via PGC-1α / AMPK. PARP1 is a major NAD+ consumer (DNA damage); CD38 + SARM1 are others. Cross-link: niacin_nad_synthesis (synthesis pathway in detail) + nrf2_keap1_antioxidant_response (sirtuin-mediated antioxidant gene expression).`,
    steps: [
      { from: 'nicotinamide', to: 'nmn', via: 'NAMPT — rate-limiting step in NAD+ salvage' },
      { from: 'nmn', to: 'nad-plus', via: 'NMNAT (1/2/3) adenylylation' },
      { from: 'nad-plus', to: 'nicotinamide', via: 'sirtuin (SIRT1-7) deacetylation reaction releases NAM + O-acetyl-ADP-ribose' },
      { from: 'nad-plus', to: 'sirtuin-activation', via: 'NAD+-dependent class III HDAC activity — substrate availability gates sirtuin function' },
    ],
    modulators: [
      { slug: 'nmn', effect: 'substrate', target: 'NAD+ salvage (bypasses NAMPT)', note: 'nicotinamide mononucleotide; oral NMN supplements raise plasma NAD+ in human trials (Yoshino 2021); aging + metabolic claims' },
      { slug: 'nad-plus', effect: 'substrate', target: 'NAD+ pool (direct, poor oral PK)', note: 'oral NAD+ has minimal bioavailability — IV NAD+ infusions widely marketed despite limited efficacy data' },
      { slug: 'namn', effect: 'substrate', target: 'NAD+ de novo + Preiss-Handler intermediate', note: 'nicotinic acid mononucleotide; rare direct supplement; lab/research reagent' },
      { slug: 'naad', effect: 'substrate', target: 'NAD+ biosynthesis (NaMN → NAAD → NAD+)', note: 'NaAD; de novo + Preiss-Handler intermediate just before NAD synthase step' },
      { slug: 'niacin', effect: 'substrate', target: 'NAD+ (Preiss-Handler precursor)', note: 'nicotinic acid; OG NAD+ raiser; flushing dose-limiting (prostaglandin-mediated); historical lipid Rx (LDL ↓, HDL ↑) — AIM-HIGH + HPS2-THRIVE null for CV outcomes' },
      { slug: 'resveratrol', effect: 'activator', target: 'SIRT1 + AMPK + Nrf2', note: 'red-grape stilbenoid; original sirtuin-activator claim; clinical results mixed; cross-link: nrf2_keap1_antioxidant_response' },
      { slug: 'pterostilbene', effect: 'activator', target: 'SIRT1 + Nrf2 (dimethyl-resveratrol)', note: 'resveratrol analog with better PK; cross-link: nrf2_keap1_antioxidant_response' },
      { slug: 'rapamycin', effect: 'inhibitor', target: 'mTORC1 (downstream of NAD+/sirtuin axis)', note: 'rapamycin/sirolimus; the canonical "geroprotector"; cross-link: mtor_signaling for direct mTOR mechanism' },
      { slug: 'metformin', effect: 'activator', target: 'AMPK (downstream NAD+/AMPK convergence node)', note: 'AMPK activator + complex I inhibitor; longevity claim; cross-link: insulin_glucose_homeostasis + oxidative_phosphorylation' },
      { slug: 'spermidine', effect: 'activator', target: 'autophagy + EP300 acetyltransferase', note: 'polyamine; autophagy induction; aging biomarker correlation in humans; cross-link: autophagy_lc3_axis' },
      { slug: 'urolithin-a', effect: 'activator', target: 'mitophagy + Nrf2', note: 'ellagitannin microbiome metabolite; Mitopure (Amazentis) bypasses microbiome variability; cross-link: nrf2_keap1_antioxidant_response' },
      { slug: 'fisetin', effect: 'activator', target: 'senolytic + SIRT1', note: 'flavonoid senolytic; mouse-model lifespan benefit; cross-link: nrf2_keap1_antioxidant_response' },
      { slug: 'l-tryptophan', effect: 'substrate', target: 'de novo NAD+ synthesis precursor (kynurenine pathway)', note: 'tryptophan → kynurenine → quinolinate → NaMN; minor NAD+ route in humans' },
    ],
    refs: [],
  },
  {
    slug: 'camp_pka_second_messenger',
    name: 'cAMP / PKA second-messenger signaling',
    category: 'signaling',
    systems: ['cardiovascular', 'endocrine', 'nervous'],
    description: `Cyclic AMP is the canonical Gs-coupled second messenger. Adenylate cyclase converts ATP → cAMP on Gs activation; cAMP activates PKA (protein kinase A) → phosphorylates downstream targets (CREB transcription factor, voltage-gated Ca²⁺ channels, ion pumps, contractile proteins, lipases). cAMP is degraded by phosphodiesterases (PDE1-11 isoforms): PDE3 in cardiac + smooth muscle (cilostazol target); PDE4 in inflammatory cells (apremilast, roflumilast targets); PDE5 in vascular + cavernosal smooth muscle (own pathway pde5_no_cgmp_axis — cGMP-specific). Many Rx classes converge here as Gs-coupled receptor agonists: β-agonists, glucagon, GLP-1 agonists, PTH analogs (intermittent pulse), calcitonin, V2 vasopressin. Caffeine + theophylline raise cAMP indirectly via non-selective PDE inhibition + adenosine antagonism. This integrative pathway is mostly for pathway-convergence detection — "any Gs-coupled or PDE-modulating drug" pile-on shows up here.`,
    steps: [
      { from: 'gs-coupled-receptor-activation', to: 'adenylate-cyclase-activation', via: 'Gαs binds + activates membrane AC1-9 isoforms → ATP → cAMP' },
      { from: 'adenylate-cyclase-activation', to: 'pka-activation', via: 'cAMP binds regulatory subunits → releases catalytic PKA subunits' },
      { from: 'pka-activation', to: 'creb-phosphorylation', via: 'PKA phosphorylates Ser133 of CREB → transcription of cAMP-responsive genes' },
      { from: 'adenylate-cyclase-activation', to: 'adenylate-cyclase-activation', via: 'PDE3/4 hydrolyze cAMP → 5′-AMP; PDE inhibitors preserve cAMP' },
    ],
    modulators: [
      { slug: 'caffeine', effect: 'inhibitor', target: 'PDE (non-selective) + adenosine A1/A2A antagonism', note: 'methylxanthine; raises cAMP via PDE inhibition + indirectly via removing adenosine-mediated AC inhibition; cross-link: caffeine_demethylation' },
      { slug: 'theophylline', effect: 'inhibitor', target: 'PDE (non-selective)', note: 'methylxanthine asthma + COPD; narrow therapeutic index; CYP1A2 substrate (DDIs: ciprofloxacin/fluvoxamine 2× AUC authored Wave 2a v1.1)' },
      { slug: 'theacrine', effect: 'inhibitor', target: 'adenosine A1/A2A + PDE (mild)', note: 'kucha-tea methylxanthine; longer t½ than caffeine; cross-link: caffeine_demethylation' },
      { slug: 'cilostazol', effect: 'inhibitor', target: 'PDE3', note: 'intermittent claudication; PDE3 inhibition raises cAMP in platelets + vascular smooth muscle; cross-link: platelet_aggregation' },
      { slug: 'dipyridamole', effect: 'inhibitor', target: 'PDE3 + PDE5 + adenosine reuptake', note: 'broad PDE-i + adenosine reuptake; cross-link: pde5_no_cgmp_axis + platelet_aggregation' },
      { slug: 'pentoxifylline', effect: 'inhibitor', target: 'PDE (non-selective)', note: 'xanthine; intermittent claudication; raises cAMP in RBCs + platelets' },
      { slug: 'apremilast', effect: 'inhibitor', target: 'PDE4', note: 'oral PDE4-i for psoriasis + PsA + Behçet; raises cAMP in immune cells → reduces TNF/IL-17/IL-23; cross-link: mast_cell_leukotriene_axis' },
      { slug: 'roflumilast', effect: 'inhibitor', target: 'PDE4', note: 'oral PDE4-i for severe COPD with chronic bronchitis phenotype; weight loss + GI side effects' },
      { slug: 'glucagon', effect: 'activator', target: 'glucagon receptor (Gs)', note: 'severe hypoglycemia rescue + β-blocker poisoning (raises cardiac cAMP → bypass β-blockade); cross-link: gi_endocrine_peptides_misc' },
      { slug: 'semaglutide', effect: 'activator', target: 'GLP-1R (Gs)', note: 'GLP-1 agonist; raises β-cell cAMP → glucose-dependent insulin release; cross-link: insulin_glucose_homeostasis' },
      { slug: 'tirzepatide', effect: 'activator', target: 'GLP-1R + GIP-R (both Gs)', note: 'dual incretin; both receptors Gs-coupled in target tissues' },
      { slug: 'exenatide', effect: 'activator', target: 'GLP-1R (Gs)', note: 'GLP-1 agonist; cross-link: insulin_glucose_homeostasis' },
      { slug: 'liraglutide', effect: 'activator', target: 'GLP-1R (Gs)', note: 'GLP-1 agonist; cross-link: insulin_glucose_homeostasis' },
      { slug: 'dulaglutide', effect: 'activator', target: 'GLP-1R (Gs)', note: 'weekly GLP-1 agonist; cross-link: insulin_glucose_homeostasis' },
      { slug: 'salmeterol', effect: 'activator', target: 'β2-adrenergic (Gs)', note: 'LABA; raises airway smooth muscle cAMP → bronchodilation; cross-link: adrenergic_receptor_signaling' },
      { slug: 'albuterol', effect: 'activator', target: 'β2-adrenergic (Gs)', note: 'SABA; same mechanism as salmeterol, faster onset/offset' },
      { slug: 'formoterol', effect: 'activator', target: 'β2-adrenergic (Gs)', note: 'fast-onset LABA' },
      { slug: 'vilanterol', effect: 'activator', target: 'β2-adrenergic (Gs)', note: '24-hr LABA' },
      { slug: 'indacaterol', effect: 'activator', target: 'β2-adrenergic (Gs)', note: '24-hr LABA' },
      { slug: 'epinephrine', effect: 'activator', target: 'α + β-adrenergic (Gs for β-receptors)', note: 'anaphylaxis; β-coupled cAMP rise dominates at low doses; cross-link: adrenergic_receptor_signaling' },
      { slug: 'norepinephrine', effect: 'activator', target: 'α + β1 (Gs for β1)', note: 'septic shock vasopressor; predominant α1 effect but β1 contributes via cAMP' },
      { slug: 'isoproterenol', effect: 'activator', target: 'β1 + β2 full agonist (Gs)', note: 'IV bradycardia rescue; pure β-agonist; raises cardiac + airway cAMP' },
      { slug: 'calcitonin', effect: 'activator', target: 'calcitonin receptor (Gs)', note: 'osteoclast cAMP rise → resorption inhibition; cross-link: bone_remodeling_rank_rankl' },
      { slug: 'teriparatide', effect: 'activator', target: 'PTH-R1 (Gs/Gq)', note: 'pulsatile PTH → osteoblast cAMP → anabolic bone formation; cross-link: bone_remodeling_rank_rankl + calcium_phosphate_pth_axis' },
      { slug: 'desmopressin', effect: 'activator', target: 'V2 vasopressin (Gs)', note: 'V2 → renal collecting-duct cAMP → AQP2 trafficking → water reabsorption; cross-link: posterior_pituitary_oxt_vp' },
      { slug: 'vasopressin', effect: 'activator', target: 'V1A + V2 (V2 is Gs)', note: 'V2-mediated renal cAMP; V1A is Gq vasoconstriction' },
    ],
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p); added++;
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nP1/P2/P3 cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
