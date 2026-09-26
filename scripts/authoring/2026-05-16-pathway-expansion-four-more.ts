/**
 * 2026-05-16-pathway-expansion-four-more.ts
 *
 * Second round of singleton-subsystem expansion. Four more pathways
 * across four subsystems with substantial unmapped library coverage.
 * Each subsystem moves from singleton → 2 pathways.
 *
 *   Glutathione metabolism: 1 → 2 (adds gsh_redox_cycle)
 *   Glycine/serine/alanine/threonine: 1 → 2 (adds serine_one_carbon)
 *   Glutamate metabolism: 1 → 2 (adds glutaminolysis_tca)
 *   Cholesterol metabolism: 1 → 2 (adds cholesterol_absorption_efflux)
 *
 * All refs verified via NCBI E-utilities `esummary` 2026-05-16. All
 * modulator slugs verified against compounds.json before authoring.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway {
  slug: string;
  name: string;
  category: string;
  systems: string[];
  domains?: string[];
  description: string;
  steps: Array<{ from: string; to: string; via?: string }>;
  modulators?: Array<{ slug: string; effect: string; target?: string; note?: string }>;
  refs?: string[];
  recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'gsh_redox_cycle_antioxidant',
    name: 'GSH / GSSG redox cycle (GPx + GR + NADPH)',
    category: 'signaling',
    systems: ['immune-hematologic', 'cardiovascular', 'nervous'],
    domains: ['metabolic', 'aging_regenerative'],
    description:
      'Distinct from glutathione_metabolism (synthesis arm: γ-GCS → γ-GC + glycine → GSH) and transsulfuration_cysteine_glutathione (precursor arm: homocysteine → cysteine → GSH). This pathway covers the **redox cycling** arm — how reduced GSH is consumed to neutralize peroxides and how the oxidized GSSG is regenerated to maintain antioxidant reserve. Step 1: glutathione peroxidase (GPx, selenoenzyme — selenocysteine in the active site) reduces H₂O₂ → H₂O + GSSG. Step 2: glutathione peroxidase 4 (GPx4) reduces phospholipid hydroperoxides → the canonical defense against lipid peroxidation; GPx4 deficiency drives ferroptosis. Step 3: glutathione reductase (GR, FAD-flavoenzyme) reduces GSSG → 2 GSH consuming NADPH. Step 4: NADPH is supplied by the pentose phosphate pathway (G6PD, the rate-limiting step — G6PD-deficient patients are susceptible to hemolytic crisis with oxidative stressors like sulfa drugs / fava beans because they cannot regenerate GSH). Step 5: peroxiredoxins (Prx1-6, abundant thiol-peroxidases) operate in parallel + crosstalk with GSH redox. Step 6: GSH/GSSG ratio (normally ~100:1 in cytosol, ~10:1 in mitochondria) is a master redox-state indicator — falling ratio triggers Nrf2 activation, sirtuin modulation, and apoptotic priming. Therapeutic relevance: selenium deficiency → diminished GPx capacity; vitamin E (chain-breaking lipid antioxidant) cooperates with GPx4 to prevent peroxide propagation; astaxanthin + carotenoids extend the GSH/GPx antioxidant chain. Cross-links: [[glutathione_metabolism]], [[transsulfuration_cysteine_glutathione]], [[ros_oxidative_stress]], [[nrf2_keap1_antioxidant_response]] (GSH/GSSG redox state is the canonical input to Keap1 cysteine sensing), [[pentose_phosphate_pathway]] (NADPH supply).',
    steps: [
      { from: '2 GSH + H₂O₂', to: 'GSSG + 2 H₂O', via: 'glutathione peroxidase (GPx1-3, selenocysteine-active-site selenoenzyme)' },
      { from: 'GSH + phospholipid-OOH', to: 'GSSG + phospholipid-OH', via: 'GPx4 — canonical defense against lipid peroxidation; GPx4 deficiency = ferroptosis' },
      { from: 'GSSG + NADPH + H+', to: '2 GSH + NADP+', via: 'glutathione reductase (GR) — FAD flavoenzyme; NADPH-dependent recycling' },
      { from: 'glucose-6-phosphate + NADP+', to: '6-phosphogluconolactone + NADPH', via: 'G6PD (rate-limiting NADPH supply; PPP-dependent)' },
      { from: 'GSH/GSSG ratio falls', to: 'Nrf2 release from Keap1 → ARE transcription', via: 'redox-sensing — cysteine thiols on Keap1 modified by GSSG' },
    ],
    modulators: [
      { slug: 'glutathione',          effect: 'substrate', target: 'GSH pool — oral bioavailability limited; liposomal/sublingual forms preferred' },
      { slug: 'nac',                  effect: 'substrate', target: 'cysteine precursor → upstream GSH supply' },
      { slug: 'selenium',             effect: 'cofactor',  target: 'GPx selenocysteine active site — obligate; deficiency reduces GPx capacity' },
      { slug: 'selenium-methionine',  effect: 'cofactor',  target: 'organic selenium form — bioavailable selenocysteine precursor' },
      { slug: 'alpha-tocopherol',     effect: 'activator', target: 'chain-breaking lipid antioxidant cooperating with GPx4' },
      { slug: 'astaxanthin',          effect: 'activator', target: 'carotenoid antioxidant — extends GSH/GPx peroxide chain' },
      { slug: 'melatonin',            effect: 'activator', target: 'direct radical scavenger + GPx induction in CNS' },
      { slug: 'curcumin',             effect: 'activator', target: 'Nrf2 → GPx + GR upregulation' },
      { slug: 'sulforaphane',         effect: 'activator', target: 'Nrf2 → GPx + γ-GCS upregulation' },
      { slug: 'resveratrol',          effect: 'activator', target: 'SIRT1 + Nrf2 → mitochondrial antioxidant defenses' },
    ],
    refs: [
      'PMID:23201771',
    ],
    recon3d_subsystem: 'Glutathione metabolism',
  },

  {
    slug: 'serine_one_carbon_biosynthesis',
    name: 'Serine de novo synthesis → one-carbon pool',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'nervous'],
    domains: ['metabolic', 'oncology'],
    description:
      'Distinct from glycine_serine_threonine_metabolism (catabolic + interconversion overview). This pathway covers the de novo serine biosynthesis branch — its connection to the folate one-carbon pool, and its outsized importance in proliferating cells (cancer biology). Step 1: 3-phosphoglycerate (3-PG, glycolysis intermediate) → 3-phosphohydroxypyruvate via PHGDH (phosphoglycerate dehydrogenase — rate-limiting; oncology drug target with multiple PHGDH inhibitors in trials). Step 2: 3-PHP → 3-phosphoserine via PSAT1 (phosphoserine aminotransferase; transfers amino group from glutamate). Step 3: 3-phosphoserine → serine via PSPH (phosphoserine phosphatase). Step 4: serine → glycine via SHMT1/2 (serine hydroxymethyltransferase) — donates a methylene unit to tetrahydrofolate → N5,N10-methylene-THF (the major source of one-carbon units for thymidylate synthesis, purine synthesis, and methylation reactions). Step 5: glycine cleavage system (GCS, mitochondrial) further oxidizes glycine → CO₂ + NH₃ + another methylene-THF — parallel one-carbon source. Therapeutic significance: tumors with PHGDH amplification (estrogen-receptor-negative breast cancer, melanoma) are auxotrophic for serine via this de novo pathway — dietary serine + glycine restriction has clinical anti-tumor data; PHGDH inhibitors (NCT-503, WQ-2101) are in oncology development. Methotrexate (DHFR inhibitor) blocks regeneration of THF from DHF, depleting the entire one-carbon pool downstream of this pathway. Cross-links: [[glycine_serine_threonine_metabolism]], [[folate_one_carbon]], [[methionine_sam_cycle]] (SAM cycle methyl donor depends on this one-carbon pool), [[purine_de_novo_synthesis]], [[pyrimidine_metabolism]].',
    steps: [
      { from: '3-phosphoglycerate (3-PG, glycolysis)', to: '3-phosphohydroxypyruvate', via: 'PHGDH (phosphoglycerate dehydrogenase) — RATE-LIMITING; oncology drug target' },
      { from: '3-phosphohydroxypyruvate + glutamate', to: '3-phosphoserine + α-KG', via: 'PSAT1 (phosphoserine aminotransferase)' },
      { from: '3-phosphoserine', to: 'serine', via: 'PSPH (phosphoserine phosphatase)' },
      { from: 'serine + THF', to: 'glycine + N5,N10-methylene-THF', via: 'SHMT1/2 — donates 1-carbon unit; cytosolic + mitochondrial isoforms' },
      { from: 'glycine + THF', to: 'CO₂ + NH₃ + N5,N10-methylene-THF', via: 'glycine cleavage system (GCS, mitochondrial) — parallel 1-carbon source' },
      { from: 'methylene-THF + dUMP', to: 'dTMP + DHF', via: 'thymidylate synthase — pyrimidine synthesis' },
      { from: 'methylene-THF', to: 'methyl-THF (for SAM regeneration)', via: 'MTHFR — methionine cycle remethylation arm' },
    ],
    modulators: [
      { slug: 'serine',         effect: 'substrate', target: 'direct serine supplementation — bypasses PHGDH/PSAT1/PSPH' },
      { slug: 'glycine',        effect: 'substrate', target: 'glycine pool — major sink for one-carbon units; also GSH precursor' },
      { slug: 'methylfolate',   effect: 'cofactor',  target: 'active folate downstream of methylene-THF' },
      { slug: 'folic-acid',     effect: 'cofactor',  target: 'folate substrate — reduced to DHF → THF by DHFR' },
      { slug: 'methotrexate',   effect: 'inhibitor', target: 'DHFR — depletes THF + entire one-carbon pool; oncology + RA Rx' },
      { slug: 'sulfasalazine',  effect: 'inhibitor', target: 'thymidylate synthase + DHFR (mild) + folate uptake — IBD Rx' },
      { slug: 'methylcobalamin', effect: 'cofactor', target: 'methionine synthase — releases methyl-THF back to THF cycle' },
    ],
    refs: [
      'PMID:23822983',
    ],
    recon3d_subsystem: 'Glycine, serine, alanine, and threonine metabolism',
  },

  {
    slug: 'glutaminolysis_tca_anaplerosis',
    name: 'Glutaminolysis → TCA anaplerosis (cancer metabolism)',
    category: 'catabolism',
    systems: ['immune-hematologic', 'digestive'],
    domains: ['metabolic', 'oncology'],
    description:
      'Distinct from glutamate_glutamine_cycle (the CNS astrocyte-neuron shuttle). This pathway covers the **glutaminolysis arm**: glutamine → glutamate → α-ketoglutarate → TCA cycle, which fuels biosynthetic precursors + NADPH in rapidly-proliferating cells. Step 1: glutamine import via SLC1A5 (ASCT2) — proliferating cells (cancer, activated T-cells) massively upregulate ASCT2; clinical drug target. Step 2: glutamine → glutamate + NH₃ via glutaminase (GLS1/GLS2) — GLS1 is the canonical cancer-cell isoform (Myc-driven), GLS2 is the p53-driven tumor-suppressor isoform; GLS1 inhibitors (telaglenastat / CB-839) in oncology trials. Step 3: glutamate → α-ketoglutarate via glutamate dehydrogenase (GDH) or via transamination (AST, ALT) — generates α-KG that enters TCA. Step 4: α-KG → succinate → fumarate → malate → OAA cycles through the TCA, providing citrate for fatty acid synthesis + NADPH for biosynthesis ("reductive carboxylation" of α-KG → citrate is glutamine-dependent in hypoxia). Step 5: glutamine also donates nitrogen for purine + pyrimidine + hexosamine synthesis (GFAT enzyme — HBP pathway). Therapeutic significance: cancer cells become "glutamine-addicted" once they switch from oxidative phosphorylation to Warburg-like metabolism + need glutamine to sustain TCA anaplerosis (this is the basis for GLS1 inhibitor oncology trials). Conditionally-essential amino acid in critical illness + post-surgery + cachexia. Cross-links: [[glutamate_glutamine_cycle]], [[tca_cycle]], [[purine_de_novo_synthesis]], [[pyrimidine_metabolism]] (glutamine donates N for pyrimidine ring), [[mtor_signaling]] (glutamine activates mTORC1 via Rag GTPases).',
    steps: [
      { from: 'extracellular glutamine', to: 'cytoplasmic glutamine', via: 'SLC1A5 (ASCT2) — upregulated in cancer + activated T-cells' },
      { from: 'glutamine', to: 'glutamate + NH₃', via: 'glutaminase (GLS1 cancer isoform, GLS2 tumor-suppressor isoform); CB-839 inhibitor target' },
      { from: 'glutamate', to: 'α-ketoglutarate + NH₃', via: 'glutamate dehydrogenase (GDH) — oxidative deamination' },
      { from: 'glutamate', to: 'α-ketoglutarate + amino-acceptor', via: 'AST / ALT transamination — generates aspartate + alanine respectively' },
      { from: 'α-ketoglutarate', to: 'TCA-derived citrate (lipid synthesis precursor)', via: 'reductive carboxylation pathway — glutamine-dependent under hypoxia' },
      { from: 'glutamine', to: 'glucosamine-6-phosphate', via: 'GFAT — hexosamine biosynthesis pathway (HBP); N donor for protein glycosylation' },
      { from: 'glutamine', to: 'purine + pyrimidine N donor', via: 'PRPP amidotransferase + CAD enzyme — nucleotide synthesis' },
    ],
    modulators: [
      { slug: 'glutamine',      effect: 'substrate', target: 'pathway substrate — clinical use in critical illness, athletic supplementation, GI integrity' },
      { slug: 'l-glutamine',    effect: 'substrate', target: 'L-form supplement', note: 'conditionally essential in catabolic states' },
      { slug: 'glutamate',      effect: 'substrate', target: 'glutaminase product / downstream pool' },
      { slug: 'asparagine',     effect: 'substrate', target: 'parallel anaplerotic amino acid; asparaginase (Rx) depletes ALL/leukemia cells' },
      { slug: 'aspartate',      effect: 'substrate', target: 'AST transamination product + nucleotide N donor' },
      { slug: 'taurine-bcaa',   effect: 'substrate', target: 'BCAA + taurine combo — alternative anaplerotic substrates' },
      { slug: 'bcaa',           effect: 'substrate', target: 'BCAA pool — also feeds anaplerosis via propionyl-CoA' },
    ],
    refs: [
      'PMID:27492215',
      'PMID:18032601',
    ],
    recon3d_subsystem: 'Glutamate metabolism',
  },

  {
    slug: 'cholesterol_absorption_efflux',
    name: 'Cholesterol absorption (NPC1L1) + reverse transport (HDL / ABCA1)',
    category: 'transport',
    systems: ['cardiovascular', 'digestive'],
    domains: ['cardiometabolic'],
    description:
      'Distinct from cholesterol_synthesis (mevalonate / HMG-CoA reductase / SREBP biology). This pathway covers the **whole-body cholesterol balance** arm — intestinal absorption + bile-acid recycling + macrophage cholesterol efflux + HDL reverse cholesterol transport. Step 1: intestinal cholesterol absorption — NPC1L1 (Niemann-Pick C1-Like 1) at the enterocyte brush border imports cholesterol + plant sterols; ezetimibe binds NPC1L1 → ~50% reduction in cholesterol absorption (key Rx, additive to statins per IMPROVE-IT). Step 2: enterocyte ABCG5/G8 effluxes plant sterols back into the lumen (humans are intolerant of phytosterol accumulation — gain-of-function loss causes sitosterolemia). Step 3: hepatic LDL-R clears LDL from plasma; PCSK9 binds LDL-R → lysosomal degradation (covered in ldl_receptor_pcsk9_axis). Step 4: macrophage cholesterol efflux — ABCA1 transports free cholesterol + phospholipids to apoA-I → nascent HDL; ABCG1 transfers cholesterol to mature HDL. Step 5: HDL maturation — LCAT esterifies free cholesterol → cholesteryl ester; CETP transfers CE from HDL to LDL/VLDL (CETP inhibitors anacetrapib + obicetrapib raise HDL). Step 6: hepatic cholesterol uptake from HDL via SR-BI; biliary excretion via ABCG5/G8 → bile + intestinal lumen (the "reverse cholesterol transport" loop). Step 7: bile acid sequestrants (cholestyramine, colesevelam) bind bile acids in the gut → prevent reabsorption → liver compensates by upregulating LDL-R + cholesterol → bile acid conversion → ↓ plasma LDL-C. Step 8: niacin (>1-3g/day) modestly raises HDL + lowers Lp(a) — mechanism via adipocyte HM74A (niacin receptor) and hepatic effects; flushing limits tolerability. Cross-links: [[cholesterol_synthesis]], [[ldl_receptor_pcsk9_axis]], [[bile_acid_synthesis]].',
    steps: [
      { from: 'intestinal lumen cholesterol', to: 'enterocyte cholesterol', via: 'NPC1L1 (Niemann-Pick C1-Like 1) — EZETIMIBE TARGET; ~50% absorption reduction' },
      { from: 'enterocyte plant sterols', to: 'lumen plant sterols', via: 'ABCG5/G8 efflux — prevents phytosterol accumulation' },
      { from: 'macrophage free cholesterol', to: 'nascent HDL (apoA-I particle)', via: 'ABCA1 efflux — primary atheroprotective step' },
      { from: 'macrophage cholesterol', to: 'mature HDL particle', via: 'ABCG1 efflux to spherical HDL' },
      { from: 'HDL-free cholesterol', to: 'HDL-cholesteryl ester', via: 'LCAT (lecithin-cholesterol acyltransferase) — HDL maturation' },
      { from: 'HDL cholesteryl ester', to: 'LDL/VLDL cholesteryl ester', via: 'CETP (cholesteryl ester transfer protein) — CETP inhibitor target' },
      { from: 'HDL', to: 'hepatocyte cholesterol pool', via: 'SR-BI (scavenger receptor B1) — selective uptake' },
      { from: 'hepatocyte cholesterol', to: 'biliary cholesterol', via: 'ABCG5/G8 + bile acid synthesis (CYP7A1) → intestinal excretion' },
      { from: 'intestinal bile acids', to: 'bile acid-sequestrant complex (excreted)', via: 'cholestyramine / colesevelam — interrupts enterohepatic recycling' },
    ],
    modulators: [
      { slug: 'ezetimibe',        effect: 'inhibitor', target: 'NPC1L1 — intestinal cholesterol absorption (~50% reduction); additive to statins' },
      { slug: 'cholestyramine',   effect: 'substrate', target: 'bile acid sequestrant — depletes bile acid pool → ↑ LDL-R upregulation' },
      { slug: 'colesevelam',      effect: 'substrate', target: 'bile acid sequestrant (next-gen, better tolerated than cholestyramine)' },
      { slug: 'niacin',           effect: 'activator', target: 'HM74A receptor → modest HDL raise + Lp(a) lowering; flushing limits dosing' },
      { slug: 'niacinamide',      effect: 'substrate', target: 'NAD precursor — does NOT raise HDL (lacks free carboxyl)' },
      { slug: 'red-yeast-rice',   effect: 'inhibitor', target: 'contains monacolin K (lovastatin equivalent) — HMG-CoA reductase' },
      { slug: 'fish-oil',         effect: 'activator', target: 'modest HDL effect via VLDL TG-lowering → reduced CETP-mediated HDL depletion' },
      { slug: 'epa-dha',          effect: 'activator', target: 'EPA-only IPE shown to reduce CV events (REDUCE-IT) independent of LDL' },
    ],
    refs: [
      'PMID:26039521',
      'PMID:22508840',
    ],
    recon3d_subsystem: 'Cholesterol metabolism',
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];

  const conflicts: string[] = [];
  for (const p of NEW_PATHWAYS) {
    if (data.find(x => x.slug === p.slug)) conflicts.push(p.slug);
  }
  if (conflicts.length > 0) {
    console.error('CONFLICT — pathways already exist:');
    for (const s of conflicts) console.error('  -', s);
    process.exit(1);
  }

  for (const p of NEW_PATHWAYS) data.push(p);

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ${NEW_PATHWAYS.length} pathways; total: ${data.length}`);
  for (const p of NEW_PATHWAYS) {
    console.log(`  + ${p.slug.padEnd(50)}  recon3d: ${p.recon3d_subsystem}`);
  }
}

main();
