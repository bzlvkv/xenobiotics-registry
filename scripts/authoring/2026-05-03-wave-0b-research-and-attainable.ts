/**
 * 2026-05-03-wave-0b-research-and-attainable.ts — Wave 0b sub-batch 7.
 *
 * Steered by user feedback: catalog should focus on what real people
 * actually obtain — commercial supplements, research-chem grey-market
 * peptides + SARMs, and pharmacy prescriptions. Skipping vaccines,
 * hospital-only mAbs, infusion-only biologics.
 *
 * Clusters covered:
 *   - Research peptides (cosmetic + nootropic + thymic)
 *   - SARMs + research PEDs (YK-11, S-23, S-4, GW-501516, SR-9009)
 *   - Biohacker / longevity research compounds (17α-estradiol,
 *     telmisartan, navitoclax, C60)
 *   - Cosmetic active peptides + topicals (argireline, matrixyl,
 *     bisabolol)
 *   - Sports nutrition (HMB, sodium bicarbonate, glycerol, ALCAR, PLC)
 *   - Smart drugs (adrafinil, hydrafinil, coluracetam, sunifiram)
 *   - Common attainable Rx: muscle relaxants, TCAs, OTC GI, allergy eye
 *     drops, hormonal contraceptives, naloxone
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

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
  refs: string[];
};

const STUBS: Stub[] = [
  // ── RESEARCH PEPTIDES (cosmetic + nootropic) ──────────────────────
  {
    slug: 'argireline',
    name: 'Argireline',
    aliases: ['Acetyl Hexapeptide-3', 'Acetyl Hexapeptide-8'],
    category: 'peptide',
    mechanism: 'Synthetic hexapeptide modeled on the SNAP-25 N-terminus — competes with SNAP-25 for SNARE-complex assembly, weakly inhibiting facial-muscle acetylcholine release. Topical "Botox-in-a-jar" cosmetic claim with modest evidence; benefit confined to expression-line softening.',
    routes: ['TD'],
    doses: { 'TD': { min: 2, max: 10, typical: 5, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    mw_g_mol: 888.99,
    refs: [],
  },
  {
    slug: 'matrixyl',
    name: 'Matrixyl',
    aliases: ['Palmitoyl Pentapeptide-4', 'Pal-KTTKS'],
    category: 'peptide',
    mechanism: 'Lipid-conjugated KTTKS pentapeptide — mimics the procollagen-I C-terminal cleavage fragment; signals dermal fibroblasts to upregulate collagen + fibronectin synthesis. Topical anti-aging actives at 2–10 mg/g formulations.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.5, max: 5, typical: 2, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    mw_g_mol: 802.05,
    refs: [],
  },
  {
    slug: 'n-acetyl-semax',
    name: 'N-Acetyl Semax Amidate',
    aliases: ['NA Semax'],
    category: 'peptide',
    mechanism: 'Acetylated + amidated derivative of semax — improved metabolic stability of the heptapeptide BPC neurotrophic / nootropic. Russian research-chemical market; intranasal route. Putatively raises BDNF, NGF; modulates dopaminergic + serotonergic CNS pathways.',
    routes: ['IN', 'SC'],
    doses: { 'IN': { min: 0.1, max: 1, typical: 0.4, unit: 'mg' } },
    half_life_hr: { 'IN': 3 },
    refs: [],
  },
  {
    slug: 'n-acetyl-selank',
    name: 'N-Acetyl Selank Amidate',
    aliases: ['NA Selank'],
    category: 'peptide',
    mechanism: 'Acetylated + amidated selank analog — anxiolytic neuropeptide derived from tuftsin. Indirect GABAergic + serotonergic modulation without GABA-A direct binding. Russian research-chemical market; IN/SC routes.',
    routes: ['IN', 'SC'],
    doses: { 'IN': { min: 0.1, max: 1.5, typical: 0.5, unit: 'mg' } },
    half_life_hr: { 'IN': 3 },
    refs: [],
  },
  {
    slug: 'cerebrolysin',
    name: 'Cerebrolysin',
    aliases: [],
    category: 'peptide',
    mechanism: 'Porcine-brain-derived peptide mixture (named multi-component biologic). Marketed for stroke + Alzheimer cognitive support; mixed clinical evidence. Acts via BDNF / NGF / GDNF mimicry across the BBB. IM/IV in clinical use; not FDA-approved (available in EU + Russia).',
    routes: ['IV', 'IM'],
    doses: { 'IV': { min: 5, max: 50, typical: 20, unit: 'mg' } },
    half_life_hr: { 'IV': 6 },
    refs: [],
  },
  {
    slug: 'pinealon',
    name: 'Pinealon',
    aliases: ['Glu-Asp-Arg', 'EDR'],
    category: 'peptide',
    mechanism: 'Tripeptide (Glu-Asp-Arg) marketed by Khavinson group for pineal-axis support. Putative geroprotective effect via DNA-binding and selective gene regulation in neural cells. Limited rigorous clinical evidence; widely sold via biohacker channels.',
    routes: ['IN', 'SC', 'PO'],
    doses: { 'IN': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'IN': 4 },
    refs: [],
  },

  // ── SARMs / RESEARCH PEDs ─────────────────────────────────────────
  {
    slug: 'yk-11',
    name: 'YK-11',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Steroidal AR partial agonist + putative myostatin pathway inhibitor (follistatin upregulation). Banned by WADA. Hepatotoxicity signal at high doses; testosterone suppression similar to other SARMs at multi-week cycles.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 15, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 430.54,
    refs: [],
  },
  {
    slug: 's-23',
    name: 'S-23',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Selective androgen receptor modulator with strong AR full-agonist activity in muscle + bone but suppression of LH/FSH severe enough to be studied as a male contraceptive. Strong testosterone suppression on cycle; not WADA-approved for any use.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 30, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 416.31,
    refs: [],
  },
  {
    slug: 'andarine',
    name: 'Andarine',
    aliases: ['S-4'],
    category: 'pharmacological',
    mechanism: 'Earliest non-steroidal SARM — partial AR agonist. Yellow-tinted vision is the signature side effect (the diarylpropionamide scaffold inhibits retinal arrestin-1). Substantial testosterone suppression at active doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 75, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 441.36,
    refs: [],
  },
  {
    slug: 'cardarine',
    name: 'Cardarine',
    aliases: ['GW-501516', 'GW-1516'],
    category: 'pharmacological',
    mechanism: 'PPARδ agonist — activates fatty-acid oxidation programs in skeletal muscle, increasing endurance capacity. NOT a SARM despite being grouped with them. GSK halted development after rodent carcinogenicity at multiple sites; banned by WADA.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 453.50,
    refs: [],
  },
  {
    slug: 'stenabolic',
    name: 'Stenabolic',
    aliases: ['SR-9009'],
    category: 'pharmacological',
    mechanism: 'REV-ERB-α agonist — circadian-rhythm transcription factor activator that increases mitochondrial biogenesis + glucose oxidation in muscle. Marketed in research-chem space as "exercise mimetic"; oral bioavailability poor (<1% in rodents). Banned by WADA.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 30, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 437.94,
    refs: [],
  },
  {
    slug: 'lgd-3303',
    name: 'LGD-3303',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Quinolinone non-steroidal SARM — full AR agonist in muscle + bone, partial in prostate. Originally developed for postmenopausal osteoporosis. Less widespread than LGD-4033 in research-chem markets.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 15, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 322.30,
    refs: [],
  },
  {
    slug: 'acp-105',
    name: 'ACP-105',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Non-steroidal SARM with reported preferential CNS activity beyond muscle anabolism — investigated for cognitive effects in older models. Limited human pharmacology; common in research-chem cycles paired with other SARMs.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 297.18,
    refs: [],
  },
  {
    slug: 'rad-150',
    name: 'RAD-150',
    aliases: ['TLB-150', 'TLB-150 Benzoate'],
    category: 'pharmacological',
    mechanism: 'Benzoate ester of RAD-140 — research-chem prodrug variant marketed as a more bioavailable form. Same AR partial-agonist mechanism as RAD-140; cleaved by esterases in vivo. Liver enzyme elevations reported.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 497.89,
    refs: [],
  },

  // ── BIOHACKER / LONGEVITY RESEARCH ────────────────────────────────
  {
    slug: '17a-estradiol',
    name: '17α-Estradiol',
    aliases: ['Alfatradiol'],
    category: 'hormone',
    mechanism: '17α-epimer of estradiol — non-feminizing isomer with ~100× lower ER affinity but extended-lifespan effect in male mice (NIH ITP, 2017). Mechanism distinct from feminizing estrogens; possibly via metabolic / inflammatory pathways. Topical formulation marketed in EU for androgenetic alopecia (Pantostin).',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 1, max: 14.4, typical: 7, unit: 'mg' } },
    half_life_hr: { 'PO': 13 },
    mw_g_mol: 272.38,
    refs: [],
  },
  {
    slug: 'telmisartan',
    name: 'Telmisartan',
    aliases: ['Micardis'],
    category: 'pharmacological',
    mechanism: 'AT1 receptor blocker + partial PPAR-γ agonist — unique among ARBs in modest insulin-sensitizing activity. Long half-life supports once-daily dosing. Research interest as a longevity / metabolic compound goes beyond standard ARB use.',
    routes: ['PO'],
    doses: { 'PO': { min: 20, max: 80, typical: 40, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 514.62,
    refs: [],
  },
  {
    slug: 'navitoclax',
    name: 'Navitoclax',
    aliases: ['ABT-263'],
    category: 'pharmacological',
    mechanism: 'BH3-mimetic Bcl-2 / Bcl-xL inhibitor — induces apoptosis in senescent cells (senolytic). Major dose-limiting platelet drop from Bcl-xL on megakaryocytes. Original oncology indications largely abandoned for venetoclax (Bcl-2 selective); senolytic research interest persists.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 425, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 16 },
    mw_g_mol: 974.61,
    refs: [],
  },
  {
    slug: 'c60',
    name: 'C60',
    aliases: ['Buckminsterfullerene', 'C60 olive oil'],
    category: 'other',
    mechanism: 'Buckminsterfullerene cage — strong free-radical sponge. Olive-oil suspension extended median lifespan in rats by ~90% in a controversial 2012 Baati paper that has not reproduced cleanly. Sold via biohacker channels with no human safety data.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.05, max: 0.2, typical: 0.1, unit: 'mg' } },
    half_life_hr: { 'PO': 168 },
    mw_g_mol: 720.66,
    refs: [],
  },

  // ── COSMETIC TOPICAL ACTIVES ──────────────────────────────────────
  {
    slug: 'bisabolol',
    name: 'α-Bisabolol',
    aliases: ['Levomenol'],
    category: 'terpenoid',
    mechanism: 'Sesquiterpene alcohol — primary anti-inflammatory active in chamomile + candeia tree. Inhibits NF-κB + reduces inflammatory cytokine release in keratinocytes. Common cosmetic ingredient at 0.1–1% for soothing irritated / sensitive skin.',
    routes: ['TD'],
    doses: { 'TD': { min: 1, max: 10, typical: 5, unit: 'mg' } },
    half_life_hr: { 'TD': 8 },
    mw_g_mol: 222.37,
    refs: [],
  },
  {
    slug: 'l-ascorbic-acid-topical',
    name: 'L-Ascorbic Acid (topical)',
    aliases: ['Vitamin C serum'],
    category: 'topical',
    mechanism: 'Topical vitamin C at 10–20% pH < 3.5 (the pH where the protonated form penetrates stratum corneum). Cofactor for prolyl/lysyl hydroxylases → collagen synthesis support; antioxidant on UV-induced ROS. Stabilization (oxidation to dehydroascorbate) is the formulation challenge.',
    routes: ['TD'],
    doses: { 'TD': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'TD': 24 },
    mw_g_mol: 176.12,
    refs: [],
  },

  // ── SPORTS NUTRITION ──────────────────────────────────────────────
  {
    slug: 'hmb',
    name: 'β-Hydroxy β-Methylbutyrate',
    aliases: ['HMB'],
    category: 'amino-acid',
    mechanism: 'Leucine metabolite (~5% of leucine flux) — anti-catabolic in skeletal muscle, slowing protein degradation. Most clinical benefit in catabolic states (cachexia, immobilization, very-detrained subjects); minimal in trained athletes. Calcium-HMB and free-acid HMB formulations differ in absorption.',
    routes: ['PO'],
    doses: { 'PO': { min: 1500, max: 3000, typical: 3000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 118.13,
    refs: [],
  },
  {
    slug: 'sodium-bicarbonate',
    name: 'Sodium Bicarbonate',
    aliases: ['Baking soda', 'NaHCO3'],
    category: 'mineral',
    mechanism: 'Extracellular buffer raising blood pH and bicarbonate buffering capacity → delays muscle acidosis during high-intensity anaerobic exercise. ~2–3% performance gain in 1–7 minute events at 0.3 g/kg. GI distress at this dose limits practical use; gradual loading or enteric-coated forms reduce.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 5000, max: 25000, typical: 20000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 84.01,
    refs: [],
  },
  {
    slug: 'glycerol-supplement',
    name: 'Glycerol (supplement)',
    aliases: ['Hyperhydration glycerol'],
    category: 'lipid',
    mechanism: 'Three-carbon polyol osmotic agent — when ingested with water expands plasma volume by ~600 mL via increased renal water reabsorption. Endurance hyperhydration before heat-stress events. WADA-banned 2010–2018 (reinstated as legal in 2018).',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 1500, typical: 1200, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 92.09,
    refs: [],
  },
  {
    slug: 'acetyl-l-carnitine',
    name: 'Acetyl-L-Carnitine',
    aliases: ['ALCAR', 'ALC'],
    category: 'amino-acid',
    mechanism: 'Acetylated L-carnitine — more readily crosses the BBB than free carnitine, providing CNS acetyl-CoA precursor + neuronal carnitine. Modest cognitive support evidence in mild cognitive impairment + diabetic neuropathy.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 500, max: 2000, typical: 1500, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 203.24,
    refs: [],
  },
  {
    slug: 'propionyl-l-carnitine',
    name: 'Propionyl-L-Carnitine',
    aliases: ['PLC'],
    category: 'amino-acid',
    mechanism: 'Propionyl ester of L-carnitine — peripheral-tissue-preferring isomer; supports cardiac + skeletal muscle fatty-acid β-oxidation. Trialed for intermittent claudication + ED with modest effect sizes; popular in cardiovascular biohacker stacks.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 2000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 217.27,
    refs: [],
  },
  {
    slug: 'd-aspartic-acid',
    name: 'D-Aspartic Acid',
    aliases: ['DAA', 'D-aspartate'],
    category: 'amino-acid',
    mechanism: 'D-enantiomer of aspartate — accumulates in pituitary + testes where it stimulates GnRH / LH / testosterone release acutely. Modest short-term testosterone bump (~30%) in untrained men attenuates / reverses by week 3+. Weak ergogenic / libido effect.',
    routes: ['PO'],
    doses: { 'PO': { min: 2000, max: 3120, typical: 3000, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 133.10,
    refs: [],
  },

  // ── SMART DRUGS / NOOTROPICS ──────────────────────────────────────
  {
    slug: 'adrafinil',
    name: 'Adrafinil',
    aliases: ['Olmifon'],
    category: 'nootropic',
    mechanism: 'Modafinil prodrug — hepatic conversion to modafinil + a sulfone metabolite. Wakefulness-promoting via the same DAT inhibition + histaminergic / orexinergic effects as modafinil. Slower onset; hepatotoxicity at chronic high doses (modafinil itself is preferred where prescription-available).',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 900, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 289.35,
    refs: [],
  },
  {
    slug: 'hydrafinil',
    name: 'Hydrafinil',
    aliases: ['Fluorenol', '9-Hydroxyfluorene'],
    category: 'nootropic',
    mechanism: 'Modafinil-like wakefulness compound — not a modafinil analog structurally; partial DAT inhibition + histamine/orexin modulation. Marketed as a non-prescription nootropic with shorter half-life than modafinil; sparse human pharmacology.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 182.22,
    refs: [],
  },
  {
    slug: 'coluracetam',
    name: 'Coluracetam',
    aliases: ['BCI-540'],
    category: 'nootropic',
    mechanism: 'Racetam — high-affinity choline uptake (HACU) enhancer. Trialed by BrainCells Inc for major depressive disorder (failed Phase 2). Reported subjective effects on color / visual perception in nootropic communities; sparse pharmacology.',
    routes: ['PO', 'SL'],
    doses: { 'PO': { min: 8, max: 35, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 333.39,
    refs: [],
  },
  {
    slug: 'sunifiram',
    name: 'Sunifiram',
    aliases: ['DM-235'],
    category: 'nootropic',
    mechanism: 'Piperazine ampakine — positive allosteric modulator at AMPA glutamate receptor. Animal cognitive enhancement at sub-mg/kg doses (~1000× racetam potency). No human RCT; sold via research-chem channels.',
    routes: ['PO'],
    doses: { 'PO': { min: 4, max: 10, typical: 6, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 232.28,
    refs: [],
  },

  // ── MUSCLE RELAXANTS ──────────────────────────────────────────────
  {
    slug: 'cyclobenzaprine',
    name: 'Cyclobenzaprine',
    aliases: ['Flexeril'],
    category: 'pharmacological',
    mechanism: 'Centrally-acting muscle relaxant — TCA-class structure; 5-HT2 antagonism + anticholinergic effect at brainstem reticular formation reduces tonic muscle activity. Sedating; used for acute musculoskeletal pain. Anticholinergic burden = Beers-list problematic in elderly.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 30, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 275.39,
    refs: [],
  },
  {
    slug: 'baclofen',
    name: 'Baclofen',
    aliases: ['Lioresal'],
    category: 'pharmacological',
    mechanism: 'GABA-B receptor agonist — pre- and post-synaptic K+ conductance activation reduces spinal cord motor neuron excitability. First-line for spasticity in MS, spinal cord injury, cerebral palsy. Intrathecal pump for severe cases. Withdrawal seizures + rebound spasticity if abruptly stopped.',
    routes: ['PO', 'IT'],
    doses: { 'PO': { min: 5, max: 80, typical: 40, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 213.66,
    refs: [],
  },
  {
    slug: 'tizanidine',
    name: 'Tizanidine',
    aliases: ['Zanaflex'],
    category: 'pharmacological',
    mechanism: 'Centrally-acting α2-adrenergic agonist — reduces presynaptic excitatory neurotransmitter release in spinal cord interneurons → less muscle tone. Used for spasticity. CYP1A2 substrate — ciprofloxacin / fluvoxamine + tizanidine = severe hypotension (boxed warning).',
    routes: ['PO'],
    doses: { 'PO': { min: 2, max: 36, typical: 8, unit: 'mg' } },
    half_life_hr: { 'PO': 2.5 },
    mw_g_mol: 253.71,
    refs: [],
  },
  {
    slug: 'methocarbamol',
    name: 'Methocarbamol',
    aliases: ['Robaxin'],
    category: 'pharmacological',
    mechanism: 'Centrally-acting muscle relaxant — exact mechanism not well-defined; CNS depression contributes. Lower anticholinergic burden than cyclobenzaprine; preferred in elderly. Used for acute musculoskeletal pain.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 500, max: 1500, typical: 1500, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 241.24,
    refs: [],
  },

  // ── TCA / OLD-LINE ANTIDEPRESSANTS ────────────────────────────────
  {
    slug: 'amitriptyline',
    name: 'Amitriptyline',
    aliases: ['Elavil'],
    category: 'pharmacological',
    mechanism: 'Tertiary-amine TCA — strong serotonin + norepinephrine reuptake inhibition + H1 + muscarinic + α1 antagonism. Now used mainly off-label for chronic pain, migraine prophylaxis, neuropathic pain at low doses (10–50 mg). High anticholinergic burden in elderly.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 150, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 20 },
    mw_g_mol: 277.41,
    refs: [],
  },
  {
    slug: 'nortriptyline',
    name: 'Nortriptyline',
    aliases: ['Pamelor'],
    category: 'pharmacological',
    mechanism: 'Secondary-amine TCA — active metabolite of amitriptyline. Stronger NE reuptake / weaker serotonergic + lower anticholinergic burden vs amitriptyline. Better-tolerated TCA for chronic pain, depression-with-pain, smoking cessation.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 150, typical: 75, unit: 'mg' } },
    half_life_hr: { 'PO': 30 },
    mw_g_mol: 263.38,
    refs: [],
  },
  {
    slug: 'doxepin',
    name: 'Doxepin (antidepressant doses)',
    aliases: ['Sinequan'],
    category: 'pharmacological',
    mechanism: 'Tertiary-amine TCA — at antidepressant doses (75–300 mg) acts as a non-selective serotonin + NE reuptake inhibitor + H1 antagonist + muscarinic antagonist. Distinct from doxepin-low-dose-for-sleep entry which uses just the H1 effect at 3–6 mg.',
    routes: ['PO'],
    doses: { 'PO': { min: 75, max: 300, typical: 150, unit: 'mg' } },
    half_life_hr: { 'PO': 15 },
    mw_g_mol: 279.38,
    refs: [],
  },

  // ── OTC / OUTPATIENT GI ───────────────────────────────────────────
  {
    slug: 'nitrofurantoin',
    name: 'Nitrofurantoin',
    aliases: ['Macrobid'],
    category: 'pharmacological',
    mechanism: 'Nitrofuran antibiotic — bacteria reduce the nitro group to reactive radicals that damage DNA + ribosomes. Concentrates in urine; used almost exclusively for uncomplicated UTIs. Pulmonary fibrosis + hepatotoxicity at chronic suppressive use.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 100, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 238.16,
    refs: [],
  },
  {
    slug: 'bismuth-subsalicylate',
    name: 'Bismuth Subsalicylate',
    aliases: ['Pepto-Bismol'],
    category: 'pharmacological',
    mechanism: 'OTC GI agent — anti-secretory + anti-inflammatory + mild antimicrobial via bismuth + salicylate moieties. Used for traveler\'s diarrhea, acute gastroenteritis, H. pylori eradication regimens. Black tongue / stool from bismuth sulfide; salicylate burden contraindicates with anticoagulants.',
    routes: ['PO'],
    doses: { 'PO': { min: 525, max: 4200, typical: 525, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 362.09,
    refs: [],
  },
  {
    slug: 'docusate',
    name: 'Docusate',
    aliases: ['Colace'],
    category: 'pharmacological',
    mechanism: 'OTC stool softener — surfactant that lets water + fat enter stool, easing passage. Modest efficacy; some guidelines (American Gastroenterological Association) recommend against it as ineffective. PEG / lactulose preferred.',
    routes: ['PO', 'PR'],
    doses: { 'PO': { min: 50, max: 360, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 444.56,
    refs: [],
  },
  {
    slug: 'polyethylene-glycol',
    name: 'Polyethylene Glycol',
    aliases: ['PEG', 'Miralax'],
    category: 'pharmacological',
    mechanism: 'Osmotic laxative — non-absorbed polymer pulls water into the colon by osmosis. Workhorse of chronic constipation management; safe in pregnancy. Bowel-prep formulation for colonoscopy is the same molecule at higher doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 17000, max: 34000, typical: 17000, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'lactulose',
    name: 'Lactulose',
    aliases: ['Constulose', 'Enulose'],
    category: 'pharmacological',
    mechanism: 'Synthetic disaccharide laxative — non-absorbable; bacterial fermentation in colon produces short-chain fatty acids → osmotic + mild prokinetic effect. Also used in hepatic encephalopathy: lowers gut pH, traps NH4+ for fecal excretion → drops blood ammonia.',
    routes: ['PO'],
    doses: { 'PO': { min: 10000, max: 60000, typical: 30000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 342.30,
    refs: [],
  },
  {
    slug: 'simethicone',
    name: 'Simethicone',
    aliases: ['Gas-X'],
    category: 'pharmacological',
    mechanism: 'OTC anti-foaming silicone polymer — disrupts gas-bubble surface tension in GI tract, allowing trapped gas to coalesce + pass. Inert; not absorbed. Colicky-infant + adult-bloating relief; modest benefit in clinical trials.',
    routes: ['PO'],
    doses: { 'PO': { min: 40, max: 250, typical: 80, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    refs: [],
  },
  {
    slug: 'calcium-carbonate',
    name: 'Calcium Carbonate',
    aliases: ['Tums'],
    category: 'mineral',
    mechanism: 'OTC antacid + dietary calcium supplement — neutralizes gastric acid (CaCO3 + 2HCl → CaCl2 + H2O + CO2). Also used to bind dietary phosphorus in chronic kidney disease. Acid rebound after chronic use; constipation common.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 3000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 100.09,
    refs: [],
  },

  // ── ALLERGY EYE DROPS / MAST CELL STABILIZERS ────────────────────
  {
    slug: 'ketotifen',
    name: 'Ketotifen',
    aliases: ['Zaditor'],
    category: 'pharmacological',
    mechanism: 'Combined H1 antihistamine + mast cell stabilizer — dual mechanism makes it useful for allergic conjunctivitis. Oral form approved in some countries for asthma + chronic urticaria; OTC in the US as eye drops only.',
    routes: ['TD', 'PO'],
    doses: { 'TD': { min: 0.025, max: 0.025, typical: 0.025, unit: 'mg' } },
    half_life_hr: { 'TD': 22 },
    mw_g_mol: 309.43,
    refs: [],
  },
  {
    slug: 'olopatadine',
    name: 'Olopatadine',
    aliases: ['Pataday', 'Patanol'],
    category: 'pharmacological',
    mechanism: 'Selective H1 antihistamine + mast cell stabilizer — preferred over ketotifen for allergic conjunctivitis due to less sedation + no rebound. Once-daily dosing in 0.7% formulation.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.1, max: 0.7, typical: 0.7, unit: 'mg' } },
    half_life_hr: { 'TD': 3 },
    mw_g_mol: 337.41,
    refs: [],
  },

  // ── CONTRACEPTIVES / EMERGENCY ────────────────────────────────────
  {
    slug: 'levonorgestrel',
    name: 'Levonorgestrel',
    aliases: ['Plan B', 'Mirena IUD'],
    category: 'hormone',
    mechanism: 'Synthetic progestin — strong progestational + weak androgenic activity. Backbone of combined oral contraceptives, the LNG-IUD (Mirena), and emergency contraception (Plan B One-Step) where high-dose interferes with ovulation timing. CYP3A4 substrate (induction lowers efficacy).',
    routes: ['PO', 'IM'],
    doses: { 'PO': { min: 0.03, max: 1.5, typical: 0.15, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 312.45,
    refs: [],
  },
  {
    slug: 'norethindrone',
    name: 'Norethindrone',
    aliases: ['Norethisterone', 'Aygestin'],
    category: 'hormone',
    mechanism: 'Synthetic progestin — weak androgenic + estrogenic activity (partly via metabolic conversion to ethinyl estradiol). Used in combined oral contraceptives + progestin-only "mini-pill" + menstrual disorders. Preferred progestin in some breast-cancer history pills.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.35, max: 5, typical: 1, unit: 'mg' } },
    half_life_hr: { 'PO': 9 },
    mw_g_mol: 298.42,
    refs: [],
  },
  {
    slug: 'drospirenone',
    name: 'Drospirenone',
    aliases: ['Yaz', 'Yasmin'],
    category: 'hormone',
    mechanism: 'Spironolactone-derived progestin — anti-mineralocorticoid + anti-androgenic activity makes it preferred in patients with PCOS, premenstrual dysphoria, hirsutism. Hyperkalemia risk with renal impairment + ACEi. Slightly higher VTE signal than older progestins.',
    routes: ['PO'],
    doses: { 'PO': { min: 3, max: 4, typical: 3, unit: 'mg' } },
    half_life_hr: { 'PO': 30 },
    mw_g_mol: 366.49,
    refs: [],
  },

  // ── OPIOID REVERSAL ───────────────────────────────────────────────
  {
    slug: 'naloxone',
    name: 'Naloxone',
    aliases: ['Narcan'],
    category: 'pharmacological',
    mechanism: 'Pure µ-opioid receptor antagonist — competitive blockade with no agonist activity. Reverses opioid overdose in seconds (IV) to minutes (IN). OTC nasal spray (Narcan) available in most US states without prescription; precipitates opioid withdrawal in opioid-dependent users.',
    routes: ['IV', 'IM', 'IN', 'SC'],
    doses: { 'IV': { min: 0.4, max: 4, typical: 0.4, unit: 'mg' } },
    half_life_hr: { 'IV': 1 },
    mw_g_mol: 327.37,
    refs: [],
  },

  // ── ATTAINABLE ANTI-MIGRAINE ──────────────────────────────────────
  {
    slug: 'butalbital',
    name: 'Butalbital',
    aliases: ['Component of Fioricet'],
    category: 'pharmacological',
    mechanism: 'Short-acting barbiturate — GABA-A receptor positive allosteric modulator. Combined with acetaminophen + caffeine (Fioricet) for tension-type headache + migraine in legacy use. Schedule III; medication-overuse headache + dependence concerns limit current guidelines\' enthusiasm.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 100, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 35 },
    mw_g_mol: 224.26,
    refs: [],
  },

  // ── ATTAINABLE TOPICAL HAIR LOSS ──────────────────────────────────
  {
    slug: 'minoxidil',
    name: 'Minoxidil (topical)',
    aliases: ['Rogaine'],
    category: 'topical',
    mechanism: 'Topical vasodilator — opens K-ATP channels, prolongs anagen phase + thickens follicle miniaturization in androgenetic alopecia. OTC at 2% (women) and 5% (men) topical. Oral form (originally for severe hypertension) at low dose 0.625–5 mg has gained off-label hair-loss use with stronger results than topical.',
    routes: ['TD', 'PO'],
    doses: { 'TD': { min: 1, max: 5, typical: 5, unit: 'mg' } },
    half_life_hr: { 'TD': 4 },
    mw_g_mol: 209.25,
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0;
  let skipped = 0;
  for (const stub of STUBS) {
    if (bySlug.has(stub.slug)) {
      skipped++;
      continue;
    }
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log('\nWave 0b sub-batch 7 — research + attainable focus:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
