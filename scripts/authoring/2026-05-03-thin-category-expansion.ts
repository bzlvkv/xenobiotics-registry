/**
 * 2026-05-03-thin-category-expansion.ts — fix the catalog's category
 * imbalance.
 *
 * Two passes in one script:
 *
 *   1. Reclassify ~31 compounds that the v7 import defaulted to
 *      `pharmacological` but fit a more specific bucket. Pure category
 *      string changes — no other field touched.
 *
 *   2. Author ~50 new compound stubs in the under-represented buckets
 *      (sleep, hormone, stimulant, nootropic, terpenoid, polyphenol,
 *      alkaloid). Stubs carry slug + name + aliases + category +
 *      mechanism (short, names organ/receptor for the systems tagger to
 *      pick up on next pass) + routes + doses + half_life_hr + mw_g_mol
 *      + refs:[]. PK params are deliberately absent; Wave 1 PK authoring
 *      fills them.
 *
 * Idempotent: existing slugs are skipped. Re-running is safe.
 *
 * After running, re-run the systems-tagging script to pick up the new
 * compounds' system tags from their mechanism prose.
 *
 * Run:  pnpm tsx scripts/authoring/2026-05-03-thin-category-expansion.ts
 *       pnpm tsx scripts/authoring/2026-05-02-systems-tagging.ts
 *       pnpm registry:lint
 *       pnpm -r test
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

// ────────────────────────────────────────────────────────────────────
// Pass 1 — reclassification map. Only category changes; all other
// fields untouched. The schema's `category` enum allows all targets.
// ────────────────────────────────────────────────────────────────────
const RECLASSIFY: Record<string, string> = {
  // → sleep
  'eszopiclone':              'sleep',
  'ramelteon':                'sleep',
  'suvorexant':               'sleep',
  'trazodone':                'sleep',
  'zolpidem':                 'sleep',

  // → hormone (steroid hormones, thyroid hormones, 5α-reductase
  // inhibitors that act ON hormones — DHEA, cortisol, T3/T4, AAS)
  'cortisol':                 'hormone',
  'dexamethasone':            'hormone',
  'dhea':                     'hormone',
  'dutasteride':              'hormone',
  'finasteride':              'hormone',
  'levothyroxine':            'hormone',
  'liothyronine':             'hormone',
  'nandrolone-decanoate':     'hormone',
  'oxandrolone':              'hormone',
  'stanozolol':               'hormone',
  'testosterone-enanthate':   'hormone',

  // → stimulant (psychomotor stimulants + ADHD agents)
  'atomoxetine':              'stimulant',
  'dexmethylphenidate':       'stimulant',
  'dextroamphetamine':        'stimulant',
  'guanfacine':               'stimulant',
  'lisdexamfetamine':         'stimulant',
  'mdma':                     'stimulant',
  'methylphenidate':          'stimulant',
  'mixed-amphetamine-salts':  'stimulant',

  // → nootropic (racetams + nootropic-class molecules)
  'aniracetam':               'nootropic',
  'bromantane':               'nootropic',
  'centrophenoxine':          'nootropic',
  'noopept':                  'nootropic',
  'oxiracetam':               'nootropic',
  'piracetam':                'nootropic',
  'pramiracetam':             'nootropic',
};

// ────────────────────────────────────────────────────────────────────
// Pass 2 — new compound stubs.
// ────────────────────────────────────────────────────────────────────

type Stub = {
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  mechanism: string;
  routes: string[];
  doses: Record<string, { min: number; max: number; typical: number; unit?: string }>;
  half_life_hr: Record<string, number>;
  mw_g_mol?: number;
  notes?: string;
  refs: string[];
};

const NEW_STUBS: Stub[] = [
  // ── SLEEP (target: thin category at 1) ────────────────────────────
  {
    slug: 'zopiclone',
    name: 'Zopiclone',
    aliases: ['Imovane'],
    category: 'sleep',
    mechanism: 'Cyclopyrrolone GABA-A α1-preferring positive allosteric modulator. Sedative-hypnotic; ~5h half-life so longer-acting than zolpidem. Withdrawn in US (eszopiclone is the marketed S-enantiomer); used internationally.',
    routes: ['PO'],
    doses: { 'PO': { min: 3.75, max: 7.5, typical: 7.5, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 388.81,
    refs: [],
  },
  {
    slug: 'lemborexant',
    name: 'Lemborexant',
    aliases: ['Dayvigo'],
    category: 'sleep',
    mechanism: 'Dual orexin receptor antagonist (DORA) — competitive antagonist at OX1R and OX2R. Suppresses wakefulness without GABA-A activation, so morning hangover is milder than benzodiazepines. ~17h half-life with active metabolite.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 10, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 17 },
    mw_g_mol: 410.42,
    refs: [],
  },
  {
    slug: 'daridorexant',
    name: 'Daridorexant',
    aliases: ['Quviviq'],
    category: 'sleep',
    mechanism: 'Dual orexin receptor antagonist; shorter half-life (~8h) than suvorexant or lemborexant — designed to minimize next-day residual sedation. FDA approved 2022 for chronic insomnia.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 50, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 450.92,
    refs: [],
  },
  {
    slug: 'doxepin-low-dose',
    name: 'Doxepin (low-dose for sleep)',
    aliases: ['Silenor'],
    category: 'sleep',
    mechanism: 'At low doses (3–6 mg) acts as a selective histamine H1 antagonist with minimal anticholinergic / antiadrenergic activity — sleep-maintenance hypnotic. Higher antidepressant doses (75–300 mg) lose the H1 selectivity.',
    routes: ['PO'],
    doses: { 'PO': { min: 3, max: 6, typical: 6, unit: 'mg' } },
    half_life_hr: { 'PO': 15 },
    mw_g_mol: 279.38,
    refs: [],
  },
  {
    slug: 'tasimelteon',
    name: 'Tasimelteon',
    aliases: ['Hetlioz'],
    category: 'sleep',
    mechanism: 'Melatonin MT1/MT2 dual receptor agonist with ~2× preference for MT2 (the SCN circadian receptor). FDA approved for non-24-hour sleep-wake disorder in totally blind patients.',
    routes: ['PO'],
    doses: { 'PO': { min: 20, max: 20, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 1.3 },
    mw_g_mol: 245.32,
    refs: [],
  },
  {
    slug: 'doxylamine',
    name: 'Doxylamine',
    aliases: ['Unisom', 'Restavit'],
    category: 'sleep',
    mechanism: 'First-generation H1 antihistamine (ethanolamine class) with strong sedative effect. OTC sleep aid; significant anticholinergic burden — not preferred long-term in elderly.',
    routes: ['PO'],
    doses: { 'PO': { min: 12.5, max: 25, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 10 },
    mw_g_mol: 270.37,
    refs: [],
  },
  {
    slug: 'diphenhydramine',
    name: 'Diphenhydramine',
    aliases: ['Benadryl', 'ZzzQuil'],
    category: 'sleep',
    mechanism: 'First-generation H1 antihistamine; crosses the blood-brain barrier and produces sedation via H1 blockade. Strong anticholinergic — Beers-list problematic in elderly. OTC for allergy + sleep.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 25, max: 50, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 255.36,
    refs: [],
  },

  // ── HORMONE (currently 2; bringing in net-new on top of reclassifications) ──
  {
    slug: 'estradiol',
    name: 'Estradiol',
    aliases: ['17β-estradiol', 'E2'],
    category: 'hormone',
    mechanism: 'Primary endogenous estrogen. Activates ER-α and ER-β nuclear receptors → transcriptional regulation. Also rapid non-genomic membrane signaling. Therapeutic in menopausal HRT, gender-affirming care, and certain cancers (oral, transdermal, IM ester forms).',
    routes: ['PO', 'TD', 'IM', 'SC'],
    doses: { 'PO': { min: 0.5, max: 4, typical: 2, unit: 'mg' }, 'TD': { min: 0.025, max: 0.1, typical: 0.05, unit: 'mg' } },
    half_life_hr: { 'PO': 13, 'TD': 24 },
    mw_g_mol: 272.38,
    refs: [],
  },
  {
    slug: 'progesterone',
    name: 'Progesterone (micronized)',
    aliases: ['Prometrium', 'Utrogestan'],
    category: 'hormone',
    mechanism: 'Endogenous C21 progestogen. Activates progesterone receptor (PR-A, PR-B); GABA-A allosteric modulation by the metabolite allopregnanolone explains the sedative effect at oral micronized dosing. Used in menopausal HRT alongside estradiol to oppose endometrial proliferation.',
    routes: ['PO', 'PR', 'IM'],
    doses: { 'PO': { min: 100, max: 300, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 314.46,
    refs: [],
  },
  {
    slug: 'hydrocortisone',
    name: 'Hydrocortisone',
    aliases: ['Cortef', 'Cortisone analog'],
    category: 'hormone',
    mechanism: 'Synthetic cortisol — same molecule as endogenous cortisol. Used as physiologic replacement in adrenal insufficiency at lower doses; pharmacologic anti-inflammatory at higher. Mineralocorticoid activity is non-trivial (unlike dexamethasone).',
    routes: ['PO', 'IV', 'IM', 'TD'],
    doses: { 'PO': { min: 10, max: 30, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 362.46,
    refs: [],
  },
  {
    slug: 'prednisone',
    name: 'Prednisone',
    aliases: [],
    category: 'hormone',
    mechanism: 'Synthetic glucocorticoid prodrug — converted to active prednisolone by hepatic 11β-HSD1. ~4× the glucocorticoid potency of cortisol with reduced mineralocorticoid effect. Workhorse of inflammatory + autoimmune therapy.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 60, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 3.5 },
    mw_g_mol: 358.43,
    refs: [],
  },
  {
    slug: 'methylprednisolone',
    name: 'Methylprednisolone',
    aliases: ['Medrol', 'Solu-Medrol'],
    category: 'hormone',
    mechanism: 'Synthetic 6α-methyl glucocorticoid; ~5× cortisol potency. Used in pulse therapy for severe inflammation (auto-immune flares, transplant rejection, MS exacerbations) where rapid IV onset matters.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 4, max: 48, typical: 16, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 374.47,
    refs: [],
  },
  {
    slug: 'fludrocortisone',
    name: 'Fludrocortisone',
    aliases: ['Florinef'],
    category: 'hormone',
    mechanism: 'Potent mineralocorticoid (~125× cortisol at MR) with secondary glucocorticoid activity. Used to replace aldosterone in adrenal insufficiency and to treat orthostatic hypotension via Na+ retention in renal collecting duct.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.05, max: 0.2, typical: 0.1, unit: 'mg' } },
    half_life_hr: { 'PO': 3.5 },
    mw_g_mol: 380.45,
    refs: [],
  },
  {
    slug: 'dhea-sulfate',
    name: 'DHEA-Sulfate',
    aliases: ['DHEA-S'],
    category: 'hormone',
    mechanism: 'Sulfated DHEA — the dominant circulating form (DHEA-S:DHEA ratio ~300:1). Long half-life acts as a stable reservoir; tissues desulfate locally via STS to access free DHEA → androstenedione → testosterone / estradiol.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 200, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 10 },
    mw_g_mol: 368.49,
    refs: [],
  },
  {
    slug: 'ethinyl-estradiol',
    name: 'Ethinyl Estradiol',
    aliases: ['EE'],
    category: 'hormone',
    mechanism: '17α-ethinyl estradiol — synthetic estrogen designed to resist hepatic first-pass metabolism. Binds ER with similar affinity to endogenous estradiol but ~50× longer plasma half-life. Backbone of combined oral contraceptives.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.02, max: 0.05, typical: 0.03, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 296.40,
    refs: [],
  },
  {
    slug: 'testosterone-undecanoate',
    name: 'Testosterone Undecanoate',
    aliases: ['Aveed', 'Nebido'],
    category: 'hormone',
    mechanism: 'C11 fatty-acid ester of testosterone — long-acting depot androgen. IM dosing every 10–14 weeks (vs cypionate every 1–2 weeks). Lymphatic absorption when oral, minimizing first-pass.',
    routes: ['IM', 'PO'],
    doses: { 'IM': { min: 750, max: 1000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'IM': 720 },
    mw_g_mol: 456.70,
    refs: [],
  },

  // ── STIMULANT (currently 4) ────────────────────────────────────────
  {
    slug: 'armodafinil',
    name: 'Armodafinil',
    aliases: ['Nuvigil'],
    category: 'stimulant',
    mechanism: 'R-enantiomer of modafinil — the longer-acting active stereoisomer. Wakefulness-promoting via dopamine reuptake inhibition + histaminergic / orexinergic effects. Half-life ~15h vs modafinil racemate ~12h.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 250, typical: 150, unit: 'mg' } },
    half_life_hr: { 'PO': 15 },
    mw_g_mol: 273.35,
    refs: [],
  },
  {
    slug: 'synephrine',
    name: 'Synephrine',
    aliases: ['p-Synephrine', 'bitter orange extract'],
    category: 'stimulant',
    mechanism: 'β3-adrenergic agonist with weaker α1 activity. Naturally in bitter orange (Citrus aurantium). Mild sympathomimetic — cardiovascular effect smaller than ephedrine because of the para-OH; thermogenic in supplement formulations.',
    routes: ['PO'],
    doses: { 'PO': { min: 20, max: 50, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 167.21,
    refs: [],
  },
  {
    slug: 'theacrine',
    name: 'Theacrine',
    aliases: ['1,3,7,9-tetramethyluric acid', 'TeaCrine'],
    category: 'stimulant',
    mechanism: 'Purine alkaloid found in Camellia assamica (kucha tea). Adenosine A1/A2A antagonism similar to caffeine but with slower tolerance development reported. Often co-formulated with caffeine for extended stimulation.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 300, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 10 },
    mw_g_mol: 224.22,
    refs: [],
  },
  {
    slug: 'ephedrine',
    name: 'Ephedrine',
    aliases: ['Ma huang alkaloid'],
    category: 'stimulant',
    mechanism: 'Sympathomimetic amine — direct α/β-adrenergic agonist + indirect catecholamine releaser via VMAT reversal. Bronchodilator, vasoconstrictor, pressor. Banned from supplements in US 2004; medical use as IV pressor + cold/asthma agent persists.',
    routes: ['PO', 'IV', 'IM', 'SC'],
    doses: { 'PO': { min: 12.5, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 165.23,
    refs: [],
  },
  {
    slug: 'pseudoephedrine',
    name: 'Pseudoephedrine',
    aliases: ['Sudafed'],
    category: 'stimulant',
    mechanism: 'Stereoisomer of ephedrine; weaker β2 / cardiovascular activity but retained α-adrenergic vasoconstriction. OTC nasal decongestant; precursor to illicit methamphetamine drives behind-the-counter restrictions.',
    routes: ['PO'],
    doses: { 'PO': { min: 30, max: 60, typical: 60, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 165.23,
    refs: [],
  },

  // ── NOOTROPIC (currently 3) ────────────────────────────────────────
  {
    slug: 'phenylpiracetam',
    name: 'Phenylpiracetam',
    aliases: ['Phenotropil', 'Carphedon'],
    category: 'nootropic',
    mechanism: 'Phenylated piracetam derivative — adds dopamine reuptake inhibition and NMDA modulation to the racetam scaffold. Banned by WADA as a stimulant; subjective effect is psychomotor activation rather than the cognitive subtlety of piracetam.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 218.25,
    refs: [],
  },
  {
    slug: 'idebenone',
    name: 'Idebenone',
    aliases: ['Raxone'],
    category: 'nootropic',
    mechanism: 'Synthetic CoQ10 analog — short benzoquinone tail enables better mitochondrial penetration vs CoQ10. Bypasses defective Complex I in Leber\'s hereditary optic neuropathy (FDA-approved for LHON in EU); marketed off-label for cognitive support.',
    routes: ['PO'],
    doses: { 'PO': { min: 90, max: 270, typical: 270, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 338.44,
    refs: [],
  },
  {
    slug: 'memantine',
    name: 'Memantine',
    aliases: ['Namenda'],
    category: 'nootropic',
    mechanism: 'Uncompetitive NMDA receptor antagonist with low-to-moderate affinity — preferentially blocks pathologically over-activated channels while sparing physiologic glutamate signaling. FDA-approved for moderate-to-severe Alzheimer\'s disease.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 20, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 70 },
    mw_g_mol: 179.30,
    refs: [],
  },
  {
    slug: 'donepezil',
    name: 'Donepezil',
    aliases: ['Aricept'],
    category: 'nootropic',
    mechanism: 'Reversible centrally-active acetylcholinesterase inhibitor — raises CNS ACh. FDA-approved for all stages of Alzheimer\'s disease. Dose-dependent GI side effects (nausea, diarrhea) from peripheral cholinergic activity.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 23, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 70 },
    mw_g_mol: 379.50,
    refs: [],
  },
  {
    slug: 'galantamine',
    name: 'Galantamine',
    aliases: ['Razadyne', 'Reminyl'],
    category: 'nootropic',
    mechanism: 'Phenanthrene-class AChE inhibitor + nicotinic ACh receptor positive allosteric modulator. Naturally derived from Galanthus / Lycoris bulbs. Dual mechanism — ACh elevation plus nAChR sensitization — distinguishes it from donepezil/rivastigmine.',
    routes: ['PO'],
    doses: { 'PO': { min: 8, max: 24, typical: 16, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 287.35,
    refs: [],
  },
  {
    slug: 'rivastigmine',
    name: 'Rivastigmine',
    aliases: ['Exelon'],
    category: 'nootropic',
    mechanism: 'Pseudo-irreversible carbamate inhibitor of both AChE AND BuChE — broader cholinergic effect than donepezil. Approved for Alzheimer\'s and Parkinson\'s dementia; transdermal patch reduces GI burden vs oral.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 1.5, max: 6, typical: 6, unit: 'mg' }, 'TD': { min: 4.6, max: 13.3, typical: 9.5, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5, 'TD': 3 },
    mw_g_mol: 250.34,
    refs: [],
  },
  {
    slug: 'huperzine-a',
    name: 'Huperzine A',
    aliases: ['HupA'],
    category: 'nootropic',
    mechanism: 'Sesquiterpene alkaloid from Huperzia serrata. Reversible AChE inhibitor; also a weak NMDA antagonist. Marketed as a supplement for cognition; not FDA-approved for Alzheimer\'s but trialed in China.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.05, max: 0.4, typical: 0.2, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 242.32,
    refs: [],
  },

  // ── TERPENOID (currently 3) ────────────────────────────────────────
  {
    slug: 'menthol',
    name: 'Menthol',
    aliases: ['(-)-menthol'],
    category: 'terpenoid',
    mechanism: 'Cyclic monoterpene from Mentha species. Activates TRPM8 cold-receptor channels → cooling sensation; also weak Ca²⁺-channel modulation. Topical analgesic, decongestant, GI antispasmodic.',
    routes: ['PO', 'TD', 'INH'],
    doses: { 'PO': { min: 90, max: 270, typical: 180, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 156.27,
    refs: [],
  },
  {
    slug: 'eucalyptol',
    name: 'Eucalyptol',
    aliases: ['1,8-cineole'],
    category: 'terpenoid',
    mechanism: 'Monoterpene oxide; main active in eucalyptus oil. Mucolytic and bronchodilator via TRPM8 + reduced airway inflammation. Used in respiratory formulations and OTC topicals.',
    routes: ['PO', 'INH', 'TD'],
    doses: { 'PO': { min: 100, max: 300, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 154.25,
    refs: [],
  },
  {
    slug: 'linalool',
    name: 'Linalool',
    aliases: ['(R)-(-)-linalool', '(S)-(+)-linalool'],
    category: 'terpenoid',
    mechanism: 'Acyclic monoterpene alcohol — major component of lavender, basil, coriander oils. Anxiolytic activity via partial GABA-A modulation + nicotinic ACh inhibition; sedative in inhalation studies.',
    routes: ['PO', 'INH', 'TD'],
    doses: { 'PO': { min: 25, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 154.25,
    refs: [],
  },
  {
    slug: 'thymol',
    name: 'Thymol',
    aliases: ['2-isopropyl-5-methylphenol'],
    category: 'terpenoid',
    mechanism: 'Monoterpenoid phenol; main active in thyme oil. Antimicrobial via membrane disruption; weak antioxidant. GRAS food preservative; topical antiseptic component (Listerine).',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 150.22,
    refs: [],
  },
  {
    slug: 'myrcene',
    name: 'Myrcene',
    aliases: ['β-myrcene'],
    category: 'terpenoid',
    mechanism: 'Acyclic monoterpene — common in hops, cannabis, lemongrass. Modest GABA-A modulation contributes to the "couch-lock" indica cannabis effect. Anti-inflammatory in animal models.',
    routes: ['PO', 'INH'],
    doses: { 'PO': { min: 25, max: 100, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 136.23,
    refs: [],
  },
  {
    slug: 'alpha-pinene',
    name: 'α-Pinene',
    aliases: ['(+)-α-pinene'],
    category: 'terpenoid',
    mechanism: 'Bicyclic monoterpene — dominant in pine and rosemary essential oils. Acetylcholinesterase inhibition supports memory in animal studies; bronchodilator at low inhalation doses.',
    routes: ['PO', 'INH'],
    doses: { 'PO': { min: 50, max: 150, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 136.23,
    refs: [],
  },
  {
    slug: 'beta-pinene',
    name: 'β-Pinene',
    aliases: [],
    category: 'terpenoid',
    mechanism: 'Bicyclic monoterpene isomer of α-pinene — found in pine, hops, cumin. Anti-inflammatory and antimicrobial; weak AChE inhibition like α-pinene but less potent.',
    routes: ['PO', 'INH'],
    doses: { 'PO': { min: 50, max: 150, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 136.23,
    refs: [],
  },
  {
    slug: 'camphor',
    name: 'Camphor',
    aliases: ['(+)-camphor'],
    category: 'terpenoid',
    mechanism: 'Bicyclic ketone monoterpene. TRPV1 + TRPV3 + TRPM8 modulation produces both warming and cooling sensations. Topical analgesic / antipruritic in liniments. Toxic at oral doses > 30 mg/kg in children.',
    routes: ['TD'],
    doses: { 'TD': { min: 100, max: 1000, typical: 500, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    mw_g_mol: 152.23,
    refs: [],
  },
  {
    slug: 'geraniol',
    name: 'Geraniol',
    aliases: [],
    category: 'terpenoid',
    mechanism: 'Acyclic monoterpene alcohol — rose oil, citronella. Anti-inflammatory via NF-κB inhibition; antimicrobial. Used as fragrance and food flavoring; modest insect repellent.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 154.25,
    refs: [],
  },

  // ── POLYPHENOL (currently 6) ───────────────────────────────────────
  {
    slug: 'chlorogenic-acid',
    name: 'Chlorogenic Acid',
    aliases: ['CGA', '5-O-caffeoylquinic acid'],
    category: 'polyphenol',
    mechanism: 'Caffeoylquinic ester — most abundant polyphenol in coffee + green coffee bean extract. Inhibits hepatic glucose-6-phosphatase → modest fasting glucose lowering. Antioxidant; the metabolite caffeic acid contributes to cardiovascular benefit.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 354.31,
    refs: [],
  },
  {
    slug: 'caffeic-acid',
    name: 'Caffeic Acid',
    aliases: ['3,4-dihydroxycinnamic acid'],
    category: 'polyphenol',
    mechanism: 'Hydroxycinnamic acid — dietary phenolic in coffee, fruits. Strong antioxidant; inhibits 5-lipoxygenase reducing leukotriene synthesis. Hepatoprotective in animal toxicology models.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 500, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 180.16,
    refs: [],
  },
  {
    slug: 'ferulic-acid',
    name: 'Ferulic Acid',
    aliases: ['4-hydroxy-3-methoxycinnamic acid'],
    category: 'polyphenol',
    mechanism: 'Hydroxycinnamic acid abundant in whole grain bran. Antioxidant + skin photoprotectant — stabilizes vitamin C/E in topical formulations and dampens UV-induced ROS. Improves vascular function in metabolic syndrome trials.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 250, max: 1000, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 194.18,
    refs: [],
  },
  {
    slug: 'rosmarinic-acid',
    name: 'Rosmarinic Acid',
    aliases: [],
    category: 'polyphenol',
    mechanism: 'Caffeic-acid ester of 3,4-dihydroxyphenyllactic acid — major active in rosemary, lemon balm, sage. Anti-inflammatory via COX-2 / LOX inhibition; antiviral and antiallergic activity in vitro.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 400, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 360.32,
    refs: [],
  },
  {
    slug: 'hydroxytyrosol',
    name: 'Hydroxytyrosol',
    aliases: ['HT', '3,4-dihydroxyphenylethanol'],
    category: 'polyphenol',
    mechanism: 'Olive-oil ortho-diphenol — most bioavailable olive polyphenol. Direct ROS scavenger + Nrf2 activator. EFSA-approved health claim for LDL cholesterol oxidation protection at ≥5 mg/day.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 50, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 0.5 },
    mw_g_mol: 154.16,
    refs: [],
  },
  {
    slug: 'oleocanthal',
    name: 'Oleocanthal',
    aliases: [],
    category: 'polyphenol',
    mechanism: 'Phenolic dialdehyde unique to extra-virgin olive oil. Ibuprofen-like COX-1 / COX-2 inhibition — gives EVOO its anti-inflammatory peppery throat catch. Implicated in Mediterranean diet cardiovascular benefit.',
    routes: ['PO'],
    doses: { 'PO': { min: 1, max: 9, typical: 4, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 304.34,
    refs: [],
  },
  {
    slug: 'oleuropein',
    name: 'Oleuropein',
    aliases: [],
    category: 'polyphenol',
    mechanism: 'Iridoid secoglycoside — main bitter phenolic in olive leaves. Hydrolyzed in gut to hydroxytyrosol + elenolic acid. Antihypertensive (modest, ~5 mmHg) + LDL-protective in clinical trials.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 500, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 540.51,
    refs: [],
  },
  {
    slug: 'sesamin',
    name: 'Sesamin',
    aliases: [],
    category: 'polyphenol',
    mechanism: 'Furofuran lignan from sesame seed oil. Inhibits Δ5-desaturase shifting fatty-acid balance toward DGLA; modest tocopherol-sparing effect. Trialed for blood pressure + lipid effects.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 354.35,
    refs: [],
  },

  // ── ALKALOID (currently 10) ────────────────────────────────────────
  {
    slug: 'codeine',
    name: 'Codeine',
    aliases: ['Methylmorphine'],
    category: 'alkaloid',
    mechanism: 'Methylated morphine prodrug — analgesic effect requires hepatic CYP2D6 demethylation to morphine (~10% of dose). CYP2D6 ultrarapid metabolizers risk respiratory depression; poor metabolizers get little analgesia.',
    routes: ['PO'],
    doses: { 'PO': { min: 15, max: 60, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 299.36,
    refs: [],
  },
  {
    slug: 'mescaline',
    name: 'Mescaline',
    aliases: ['3,4,5-trimethoxyphenethylamine'],
    category: 'alkaloid',
    mechanism: 'Phenethylamine alkaloid from peyote (Lophophora williamsii) and San Pedro cactus. 5-HT2A receptor agonist — classical psychedelic; longer trip duration than psilocybin (~10–12 h). Schedule I in US.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 500, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 211.26,
    refs: [],
  },
  {
    slug: 'atropine',
    name: 'Atropine',
    aliases: [],
    category: 'alkaloid',
    mechanism: 'Tropane alkaloid from Atropa belladonna. Competitive muscarinic receptor antagonist (M1–M5). Used for bradycardia (IV), pupillary dilation (ophthalmic), and nerve agent / organophosphate poisoning.',
    routes: ['IV', 'IM', 'SC', 'PO'],
    doses: { 'IV': { min: 0.5, max: 1, typical: 1, unit: 'mg' } },
    half_life_hr: { 'IV': 4 },
    mw_g_mol: 289.37,
    refs: [],
  },
  {
    slug: 'scopolamine',
    name: 'Scopolamine',
    aliases: ['Hyoscine'],
    category: 'alkaloid',
    mechanism: 'Tropane alkaloid; muscarinic receptor antagonist with stronger CNS penetration than atropine. Transdermal patch for motion sickness; rapid antidepressant effects in trials at IV doses.',
    routes: ['TD', 'PO', 'IV'],
    doses: { 'TD': { min: 0.5, max: 1.5, typical: 1, unit: 'mg' } },
    half_life_hr: { 'TD': 9 },
    mw_g_mol: 303.35,
    refs: [],
  },
  {
    slug: 'quinine',
    name: 'Quinine',
    aliases: [],
    category: 'alkaloid',
    mechanism: 'Cinchona-bark alkaloid; antimalarial via heme polymerization inhibition in Plasmodium digestive vacuole. Cardiac sodium-channel blockade explains the QT prolongation + nocturnal-leg-cramps off-label use.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 600, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 11 },
    mw_g_mol: 324.42,
    refs: [],
  },
  {
    slug: 'reserpine',
    name: 'Reserpine',
    aliases: [],
    category: 'alkaloid',
    mechanism: 'Indole alkaloid from Rauwolfia serpentina. Irreversible VMAT2 inhibitor — depletes catecholamines and serotonin from synaptic vesicles. Antihypertensive (largely abandoned for SSRI-precipitated depression risk); historical interest for the "monoamine hypothesis" of depression.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.05, max: 0.25, typical: 0.1, unit: 'mg' } },
    half_life_hr: { 'PO': 33 },
    mw_g_mol: 608.69,
    refs: [],
  },
  {
    slug: 'hydromorphone',
    name: 'Hydromorphone',
    aliases: ['Dilaudid'],
    category: 'alkaloid',
    mechanism: 'Hydrogenated ketone of morphine — μ-opioid agonist with ~5× morphine potency. Less histamine release → less itching and hypotension than morphine. Used for severe pain when morphine is poorly tolerated.',
    routes: ['PO', 'IV', 'IM', 'SC'],
    doses: { 'PO': { min: 2, max: 8, typical: 4, unit: 'mg' } },
    half_life_hr: { 'PO': 2.5 },
    mw_g_mol: 285.34,
    refs: [],
  },
  {
    slug: 'oxymorphone',
    name: 'Oxymorphone',
    aliases: ['Opana'],
    category: 'alkaloid',
    mechanism: 'Semi-synthetic μ-opioid agonist; ~10× morphine potency PO, ~2× IV. Active metabolite of oxycodone via CYP2D6. Reformulated extended-release version (2017) reduces IV abuse but didn\'t prevent pivot to other agents.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 5, max: 40, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 9 },
    mw_g_mol: 301.34,
    refs: [],
  },
  {
    slug: 'fentanyl',
    name: 'Fentanyl',
    aliases: ['Sublimaze', 'Duragesic'],
    category: 'alkaloid',
    mechanism: 'Synthetic phenylpiperidine μ-opioid agonist; ~100× morphine potency. Lipophilic — fast onset and short duration after single dose; depot via TD patch enables 72h analgesia. Illicit fentanyl analogs drive most US opioid overdose deaths.',
    routes: ['IV', 'IM', 'TD', 'SL', 'IN'],
    doses: { 'TD': { min: 0.0125, max: 0.1, typical: 0.025, unit: 'mg' } },
    half_life_hr: { 'IV': 4 },
    mw_g_mol: 336.47,
    refs: [],
  },
  {
    slug: 'methadone',
    name: 'Methadone',
    aliases: [],
    category: 'alkaloid',
    mechanism: 'Synthetic μ-opioid agonist + NMDA antagonist + monoamine reuptake inhibition. Long, variable half-life (8–60 h) supports once-daily dosing for opioid use disorder. QT prolongation requires baseline ECG.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 2.5, max: 120, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 309.45,
    refs: [],
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply
// ────────────────────────────────────────────────────────────────────

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  // Pass 1 — reclassify
  let reclassified = 0;
  let reclassifyMissed = 0;
  let reclassifyAlready = 0;
  for (const [slug, newCat] of Object.entries(RECLASSIFY)) {
    const c = bySlug.get(slug);
    if (!c) {
      console.warn(`  [warn] reclassify: slug "${slug}" not in registry`);
      reclassifyMissed++;
      continue;
    }
    if (c['category'] === newCat) {
      reclassifyAlready++;
      continue;
    }
    c['category'] = newCat;
    reclassified++;
  }

  // Pass 2 — append new stubs (idempotent on slug)
  let added = 0;
  let stubAlready = 0;
  for (const stub of NEW_STUBS) {
    if (bySlug.has(stub.slug)) {
      stubAlready++;
      continue;
    }
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  // Distribution after
  const dist: Record<string, number> = {};
  for (const c of data) {
    const cat = c['category'] as string;
    dist[cat] = (dist[cat] ?? 0) + 1;
  }

  console.log('\nThin-category expansion complete:');
  console.log(`  Reclassified: ${reclassified}  (already-correct: ${reclassifyAlready}, missing: ${reclassifyMissed})`);
  console.log(`  New stubs added: ${added}  (already-present: ${stubAlready})`);
  console.log(`  Total compounds: ${data.length}`);
  console.log('\nCategory distribution after:');
  const order = Object.entries(dist).sort((a, b) => a[1] - b[1]);
  for (const [k, v] of order) console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}`);
}

main();
