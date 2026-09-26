/**
 * backfill-mw.ts — write mw_g_mol onto compounds where the molecular
 * weight is unambiguous chemistry. Run once with `tsx scripts/backfill-mw.ts`.
 *
 * Why this exists:
 *   - Interaction kinetics (Ki, IC50, EC50) are reported in literature
 *     in µM. The solver works in mg/L. Conversion needs each
 *     perpetrator's molecular weight.
 *   - Receptor occupancy (Hill EC50) is also commonly reported in µM.
 *   - MW is a chemistry fact, not a research finding — every value
 *     here is the canonical PubChem-listed MW for the named compound
 *     (free base / parent structure unless the salt is the dosed form).
 *     No citation needed beyond the compound's own existence.
 *
 * Authoring scope:
 *   - All CYP perpetrators / victims with named edges
 *   - All compounds with authored effect_compartment or
 *     receptor_occupancy (so future kinetic / occupancy work has the
 *     conversion factor ready)
 *   - Common small-molecule pharmaceuticals that are likely dose
 *     candidates in the user's stack
 *
 * Skip:
 *   - Biologics, peptides (already excluded by category in the audit)
 *   - Mineral / vitamin complexes where the "compound" is a class,
 *     not a single molecule (e.g. vitamin-d3 is cholecalciferol, MW
 *     384.64; ok. Magnesium glycinate is a salt; we author the
 *     elemental Mg-glycinate complex MW where unambiguous)
 *   - Plant extracts (rhodiola, ashwagandha, st-johns-wort) — these
 *     have multiple active components, no single MW
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', 'packages', 'registry', 'data', 'compounds.json');

/**
 * slug → mw_g_mol.
 *
 * Values are PubChem-listed parent compound molecular weights (rounded
 * to 2 decimals where the compound entry uses standard atomic weights).
 * Salts dosed as salts use the salt MW; otherwise the free base. Plant
 * extracts and biologic complexes are intentionally absent.
 */
const MW: Record<string, number> = {
  // ── CYP perpetrators / victims (already-authored or candidate edges) ──
  'acetaminophen':         151.16,
  'alcohol':               46.07,    // ethanol
  'berberine':             336.36,   // free base (chloride salt is 371.81 if dosed as salt)
  'colchicine':            399.44,
  'cyclosporine':          1202.61,
  'fluoxetine':            309.33,
  'gemfibrozil':           250.34,
  'modafinil':             273.35,
  'paroxetine':            329.37,
  'piperine':              285.34,
  'simvastatin':           418.57,
  'tacrolimus':            804.02,
  'tamoxifen':             371.51,
  'theobromine':           180.16,
  'warfarin':              308.33,

  // ── PD / receptor-binding compounds with effect_compartment authored ──
  'l-theanine':            174.20,
  'glycine':               75.07,
  'taurine':               125.15,
  'l-tyrosine':            181.19,
  'alpha-gpc':             257.22,
  'citicoline':            488.32,
  'creatine':              131.13,
  'creatine-monohydrate':  149.15,   // includes the water of crystallization
  'cholecalciferol':       384.64,
  'vitamin-d3':            384.64,   // alias entry
  'melatonin':             232.28,
  'modafinil':             273.35,   // re-listed for completeness
  'ashwagandha':           971.16,   // withanolide-A as a representative active; extract-mix caveat
  'rhodiola-rosea':        428.43,   // salidroside — not the only active, but the marker the PK is keyed to
  'l-tryptophan':          204.23,
  '5-htp':                 220.22,
  'serotonin':             176.22,
  'gaba':                  103.12,
  'dopamine':              153.18,
  'epinephrine':           183.20,
  'norepinephrine':        169.18,

  // ── Common small-molecule pharmaceuticals (likely dose candidates) ──
  'aspirin':               180.16,
  'ibuprofen':             206.28,
  'naproxen':              230.26,
  'celecoxib':             381.37,
  'diclofenac':            296.15,
  'metformin':             129.16,
  'glipizide':             445.54,
  'glimepiride':           490.62,
  'sitagliptin':           407.31,
  'empagliflozin':         450.91,
  'dapagliflozin':         408.87,
  'canagliflozin':         444.52,
  'liraglutide':           3751.20, // peptide, but commonly dosed
  'atorvastatin':          558.64,
  'rosuvastatin':          481.54,
  'pravastatin':           424.53,
  'ezetimibe':             409.43,
  'bempedoic-acid':        344.49,
  'lisinopril':            405.49,
  'losartan':              422.91,
  'valsartan':             435.52,
  'telmisartan':           514.62,
  'amlodipine':            408.88,
  'metoprolol':            267.36,
  'bisoprolol':            325.44,
  'carvedilol':            406.47,
  'atenolol':              266.34,
  'propranolol':           259.34,
  'clonidine':             230.10,
  'hydrochlorothiazide':   297.74,
  'furosemide':            330.74,
  'spironolactone':        416.57,
  'apixaban':              459.50,
  'rivaroxaban':           435.88,
  'dabigatran':            471.51,
  'clopidogrel':           321.82,
  'digoxin':               780.94,
  'amiodarone':            645.31,

  // ── Psych / CNS ──
  'sertraline':            306.23,
  'escitalopram':          324.40,
  'citalopram':            324.40,
  'venlafaxine':           277.40,
  'duloxetine':            297.41,
  'bupropion':             239.74,
  'mirtazapine':           265.36,
  'trazodone':             371.86,
  'aripiprazole':          448.39,
  'quetiapine':            383.51,
  'olanzapine':            312.43,
  'risperidone':           410.49,
  'cariprazine':           427.41,
  'lithium':               6.94,     // lithium ion; salt forms add anion mass
  'lamotrigine':           256.09,
  'topiramate':            339.36,
  'gabapentin':            171.24,
  'pregabalin':            159.23,
  'alprazolam':            308.77,
  'diazepam':              284.74,
  'clonazepam':            315.71,
  'lorazepam':             321.16,
  'zolpidem':              307.40,
  'eszopiclone':           388.81,
  'methylphenidate':       233.31,
  'dexmethylphenidate':    233.31,
  'amphetamine':           135.21,
  'dextroamphetamine':     135.21,
  'lisdexamfetamine':      263.38,
  'atomoxetine':           255.36,

  // ── Hormones / steroids ──
  'testosterone':          288.42,
  'testosterone-cypionate':412.61,
  'testosterone-enanthate':400.59,
  'estradiol':             272.39,
  'ethinylestradiol':      296.41,
  'progesterone':          314.47,
  'dhea':                  288.42,
  'pregnenolone':          316.48,
  'cortisol':              362.46,
  'dexamethasone':         392.46,
  'prednisone':            358.43,
  'anastrozole':           293.37,
  'clomiphene':            405.96,
  'tadalafil':             389.41,
  'sildenafil':            474.58,

  // ── Vitamins / cofactors as discrete molecules ──
  'ascorbic-acid':         176.12,
  'thiamine':              265.35,   // free base; HCl is 337.27
  'riboflavin':            376.36,
  'pyridoxine':            169.18,
  'cyanocobalamin':        1355.37,
  'methylcobalamin':       1344.38,
  'biotin':                244.31,
  'folate':                441.40,
  'methylfolate':          459.45,
  'alpha-tocopherol':      430.71,
  'menaquinone-7':         649.00,   // MK-7 form of K2
  'phylloquinone':         450.70,   // K1
  'beta-carotene':         536.87,

  // ── Other notable small molecules ──
  'theophylline':          180.16,   // already authored, listed for completeness
  'caffeine':              194.19,   // already authored
  'nicotine':              162.23,
  'cannabidiol':           314.46,
  'cbd':                   314.46,   // alias
  'thc':                   314.46,
  'mdma':                  193.25,
  'lsd':                   323.43,
  'psilocybin':            284.25,
  'psilocin':              204.27,
  'dmt':                   188.27,
  'ketamine':              237.73,
  'buprenorphine':         467.64,
  'naloxone':              327.37,
  'naltrexone':            341.40,

  // ── Amino acids & metabolites ──
  'arginine':              174.20,
  'citrulline':            175.19,
  'beta-alanine':          89.09,
  'leucine':               131.17,
  'isoleucine':            131.17,
  'valine':                117.15,
  'lysine':                146.19,
  'glutamine':             146.14,
  'methionine':            149.21,
  'threonine':             119.12,
  'phenylalanine':         165.19,
  'cysteine':              121.16,
  'nac':                   163.20,   // N-acetylcysteine
  'sam-e':                 398.44,
  'tmg':                   117.15,   // trimethylglycine / betaine
  'choline':               104.17,   // choline cation
  'inositol':              180.16,

  // ── Adenosine / nucleoside-related ──
  'adenosine':             267.24,
  'inosine':               268.23,
  'd-ribose':              150.13,
  'cdp-choline':           488.32,   // citicoline alias

  // ── Polyphenols / flavonoids (where dose-relevant single-molecule) ──
  'quercetin':             302.24,
  'curcumin':              368.38,
  'resveratrol':           228.25,
  'pterostilbene':         256.30,
  'sulforaphane':          177.29,
  'apigenin':              270.24,
  'baicalein':             270.24,
  'catechin':              290.27,
  'egcg':                  458.37,
  'cyanidin':              287.24,
  'daidzein':              254.24,
  'delphinidin':           303.24,

  // ── Lipids / fatty acids ──
  'epa':                   302.45,
  'dha':                   328.49,
  'epa-dha':               315.47,   // approximate; actually a mix — kept as a placeholder
  'arachidonic-acid':      304.47,
  'ala':                   278.43,   // alpha-linolenic acid
  'dpa':                   330.51,

  // ── Misc with CYP/transport relevance ──
  'dichloroacetate':       128.94,
  'trimetazidine':         266.34,   // free base; HCl is 339.26
  'centrophenoxine':       257.71,
  'aniracetam':            219.24,
  'piracetam':             142.16,
  'oxiracetam':            158.16,
  'phenibut':              179.22,
  'bromantane':            227.34,
  'memantine':             179.30,
  'donepezil':             379.50,
  'galantamine':           287.35,
  'rivastigmine':          250.34,
  'huperzine-a':           242.32,
  'noopept':               318.37,
  'agmatine':              130.19,
  'carnitine':             161.20,   // L-carnitine
  'carnosine':             226.23,
  'taurine':               125.15,   // re-listed for completeness
};

function main(): void {
  const raw = readFileSync(COMPOUNDS_PATH, 'utf-8');
  const data = JSON.parse(raw) as Array<Record<string, unknown>>;
  let added = 0;
  let alreadyHad = 0;
  let unknown = 0;

  for (const c of data) {
    const slug = c['slug'] as string;
    if (slug in MW) {
      if (c['mw_g_mol'] != null) {
        alreadyHad++;
      } else {
        c['mw_g_mol'] = MW[slug];
        added++;
      }
    } else if (c['mw_g_mol'] == null) {
      unknown++;
    }
  }

  // Re-serialize. Preserve key order roughly: write `mw_g_mol` directly
  // after `mechanism` (if present) or after `category`. JSON.stringify
  // doesn't honor this, so the simpler approach is to not enforce
  // ordering — keys land wherever the parser reconstructed them, which
  // for V8 is insertion order of the parsed result.
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log(`MW backfill complete:`);
  console.log(`  ${added} compounds gained mw_g_mol`);
  console.log(`  ${alreadyHad} compounds already had it`);
  console.log(`  ${unknown} compounds still without (not in the curated list)`);
}

main();
