/**
 * 2026-05-24-signaling-batch-G.ts
 *
 * step.note grind, batch G — 5 pathways, notes-only. Existing refs
 * title-checked via esummary 2026-05-24 and topically ground these notes:
 *   cholesterol_absorption_efflux  PMID:26039521 (IMPROVE-IT), 22508840 (RCT/efflux)
 *   tlr_innate_signaling           PMID:16497588 (Akira, Cell), 14751757
 *   upr_er_stress_perk_ire1_atf6   PMID:22013210 (Physiol Rev UPR)
 *   telomere_shelterin_maintenance PMID:16166375 (Genes Dev), 18680434 (ARG)
 *   necroptosis_ripk_mlkl          PMID:25592536 (Nature), 38110635 (NRMCB)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-G.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'cholesterol_absorption_efflux',
    notes: {
      'intestinal lumen cholesterol enterocyte cholesterol':
        'Dietary and biliary cholesterol is taken up from the intestinal lumen into enterocytes by the ' +
        'transporter NPC1L1 — the rate-limiting absorption step and the target of ezetimibe. The IMPROVE-IT trial ' +
        'showed that adding ezetimibe to a statin further lowers LDL and cuts cardiovascular events.',
      'enterocyte plant sterols lumen plant sterols':
        'Enterocytes discriminate against plant sterols: the ABCG5/ABCG8 heterodimer pumps absorbed phytosterols ' +
        '(and excess cholesterol) back into the lumen, so almost none enters the body. Loss-of-function mutations ' +
        'cause sitosterolemia, with sterol accumulation and premature atherosclerosis.',
      'macrophage free cholesterol nascent HDL (apoA-I particle)':
        'Reverse cholesterol transport begins when lipid-laden macrophages efflux free cholesterol to lipid-poor ' +
        'apoA-I via ABCA1, forming nascent (discoidal) HDL. This is the key anti-atherogenic step — unloading ' +
        'arterial foam cells; ABCA1 loss causes Tangier disease with near-absent HDL.',
      'macrophage cholesterol mature HDL particle':
        'Macrophages also efflux cholesterol to larger, mature HDL particles through the transporter ABCG1, ' +
        'complementing the ABCA1 route. Together they unload the cholesterol that would otherwise build up in the ' +
        'artery wall — the basis of HDL’s protective “efflux capacity”, which tracks risk better than HDL level.',
      'HDL-free cholesterol HDL-cholesteryl ester':
        'On the HDL particle, the enzyme LCAT esterifies free cholesterol to cholesteryl ester. Being hydrophobic, ' +
        'the ester moves into the particle core, maturing discoidal HDL into spherical HDL and keeping the surface ' +
        'gradient favorable for continued efflux — a “cholesterol sink” mechanism.',
      'HDL cholesteryl ester LDL/VLDL cholesteryl ester':
        'Cholesteryl-ester transfer protein (CETP) swaps HDL cholesteryl ester for triglyceride from apoB ' +
        'lipoproteins (LDL/VLDL), redistributing cholesterol away from HDL. This is why CETP inhibitors raise HDL ' +
        '— yet most failed to cut events, clarifying that LDL lowering, not HDL raising, drives benefit.',
      'HDL hepatocyte cholesterol pool':
        'HDL delivers its cholesterol to the liver largely via the scavenger receptor SR-BI, which selectively ' +
        'extracts cholesteryl ester without degrading the whole particle. This completes reverse cholesterol ' +
        'transport — returning peripheral cholesterol to the one organ able to excrete it.',
      'hepatocyte cholesterol biliary cholesterol':
        'Hepatocytes excrete cholesterol into bile (again via ABCG5/G8), directly or after conversion to bile ' +
        'acids — the body’s only quantitatively important route for eliminating cholesterol. Biliary secretion is ' +
        'the final common exit of reverse cholesterol transport.',
      'intestinal bile acids bile acid-sequestrant complex (excreted)':
        'Most bile acids are reabsorbed (enterohepatic circulation), but bile-acid sequestrants bind them in the ' +
        'lumen to force fecal excretion. The liver then consumes cholesterol to replace the lost bile acids, ' +
        'lowering LDL — the mechanism of resins like cholestyramine.',
    },
  },
  {
    slug: 'tlr_innate_signaling',
    notes: {
      'PAMP / DAMP (LPS, dsRNA, CpG, flagellin, etc.) TLR ligand binding + receptor dimerization':
        'TLRs are the prototypical pattern-recognition receptors, each detecting a conserved microbial molecule ' +
        '(LPS, dsRNA, CpG DNA, flagellin) or host danger signal. Ligand binding dimerizes the receptor; surface ' +
        'TLRs sense membrane PAMPs while endosomal TLRs (3/7/8/9) sense nucleic acids — the basis of self/non-self ' +
        'discrimination.',
      'TLR-TIR domain MyD88 (all but TLR3) recruitment':
        'Dimerization juxtaposes the cytoplasmic TIR domains, creating a platform that recruits adaptor proteins. ' +
        'All TLRs except TLR3 signal through MyD88, which assembles the “Myddosome” with IRAK kinases — the trunk ' +
        'of the pathway leading to NF-κB and MAPK activation.',
      'TRIF (TLR3 + TLR4) TBK1 → IRF3 phosphorylation':
        'TLR3 (and TLR4 from the endosome) instead use the adaptor TRIF, which activates TBK1 to phosphorylate ' +
        'IRF3, driving type-I interferon. This MyD88-independent branch is how TLRs mount antiviral interferon ' +
        'responses — the same IRF3/IFN output used by the cytosolic nucleic-acid sensors.',
      'TAK1 IKKβ → IκB phosphorylation → degradation':
        'Downstream of MyD88, the kinase TAK1 activates the IKK complex: IKKβ phosphorylates IκB, marking it for ' +
        'degradation and freeing NF-κB to enter the nucleus. This is the convergence point shared with TNF and ' +
        'IL-1 signaling — the central inflammatory transcription switch.',
      'TAK1 p38 + JNK → AP-1':
        'TAK1 also activates the MAP kinases p38 and JNK, which drive the AP-1 transcription factor. The ' +
        'MAPK/AP-1 arm cooperates with NF-κB to shape the inflammatory gene program and links innate sensing to ' +
        'cell-stress and proliferation responses.',
      'NF-κB + AP-1 + IRF3 cytokine + chemokine release':
        'The combined activation of NF-κB, AP-1, and IRF3 transcribes pro-inflammatory cytokines (TNF, IL-6, ' +
        'IL-1β), chemokines, and interferons — the innate output that triggers inflammation and instructs ' +
        'adaptive immunity. Excess or chronic TLR signaling underlies sepsis and inflammatory/autoimmune disease.',
    },
  },
  {
    slug: 'upr_er_stress_perk_ire1_atf6',
    notes: {
      'misfolded protein accumulation in ER lumen BiP/GRP78 displacement from PERK / IRE1α / ATF6':
        'The UPR fires when misfolded proteins accumulate in the ER and titrate the chaperone BiP/GRP78 away from ' +
        'the three sensors PERK, IRE1α, and ATF6. Losing BiP activates all three arms — making BiP occupancy the ' +
        'master gauge of ER folding load and the UPR a homeostatic response to restore it.',
      'PERK active eIF2α phosphorylation → global translation arrest':
        'The PERK arm phosphorylates eIF2α, halting most cap-dependent translation — rapidly reducing the protein ' +
        'load entering the stressed ER. This is the same eIF2α node used by the integrated stress response, ' +
        'linking ER stress to amino-acid, heme, and viral stress signals.',
      'ATF4 CHOP + GADD34 + amino-acid response genes':
        'Paradoxically, eIF2α phosphorylation favors translation of ATF4, which induces amino-acid/redox genes, ' +
        'GADD34 (a feedback phosphatase reversing the eIF2α block), and CHOP. ATF4-CHOP thus both aids recovery ' +
        'and, if stress persists, primes cell death.',
      'IRE1α RNase XBP1 splicing (26-nt intron removal)':
        'The IRE1α arm is an endoribonuclease that excises a 26-nt intron from XBP1 mRNA; the spliced form encodes ' +
        'a potent transcription factor driving chaperone and ER-associated degradation (ERAD) genes. This most ' +
        'conserved UPR arm expands folding and disposal capacity to clear the backlog.',
      'ATF6 (ER) Golgi → S1P/S2P cleavage → ATF6f':
        'When released, the ATF6 arm traffics to the Golgi, where S1P/S2P proteases cleave it to liberate the ' +
        'active transcription factor ATF6f. ATF6f induces chaperones and ERAD components, complementing XBP1 — ' +
        'together expanding the ER’s capacity to fold and degrade proteins.',
      'sustained UPR (chronic) CHOP-driven apoptosis':
        'If stress is unresolvable, the UPR switches from adaptive to terminal: sustained CHOP tips the balance to ' +
        'apoptosis (lowering BCL-2, raising pro-apoptotic BH3 proteins, and driving oxidative ER stress). This ' +
        'life/death switch links chronic ER stress to neurodegeneration, diabetes, and other diseases.',
    },
  },
  {
    slug: 'telomere_shelterin_maintenance',
    notes: {
      'TTAGGG telomeric tandem repeats shelterin complex binding (TRF1/2, POT1, TIN2, TPP1, RAP1)':
        'Chromosome ends are capped by tandem TTAGGG repeats bound by the six-protein shelterin complex (TRF1, ' +
        'TRF2, POT1, TIN2, TPP1, RAP1). Shelterin folds the end into a protective t-loop and hides it from repair ' +
        'machinery — solving the “end-protection problem” so telomeres aren’t mistaken for double-strand breaks.',
      'lagging-strand DNA polymerase incomplete 3′ end replication → 50–100 bp loss per division':
        'The end-replication problem: lagging-strand synthesis cannot copy the very 3′ end, so telomeres lose ' +
        '~50-100 bp each division. This progressive shortening is the molecular clock that limits how many times a ' +
        'somatic cell can divide, counting down toward senescence.',
      'TERT (catalytic) + TERC (RNA template) telomerase ribonucleoprotein assembly':
        'Telomerase counters shortening: it is a ribonucleoprotein combining the catalytic reverse transcriptase ' +
        'TERT with the RNA template TERC, used to add new TTAGGG repeats. Mutations in TERT/TERC cause ' +
        'telomere-biology disorders (dyskeratosis congenita, pulmonary fibrosis) from premature telomere failure.',
      'telomerase active telomere extension → cellular replicative lifespan extended':
        'When active, telomerase extends telomeres and lifts the replicative limit — which is why it is expressed ' +
        'in germline and stem cells but silenced in most somatic cells. Telomerase reactivation is a ' +
        'near-universal hallmark of cancer, granting malignant cells unlimited proliferation.',
      'telomere shortening past critical threshold DDR activation (ATM/ATR + p53/p21)':
        'Once a telomere shortens past a critical length, shelterin can no longer cap it; the exposed end is read ' +
        'as DNA damage, activating ATM/ATR and the p53/p21 response. So telomere attrition is transduced into a ' +
        'growth-arrest signal through the standard DNA-damage machinery.',
      'replicative senescence (Hayflick limit) permanent cell-cycle arrest + SASP':
        'The result is replicative senescence — the Hayflick limit — a permanent cell-cycle arrest with the ' +
        'senescence-associated secretory phenotype (SASP). This caps proliferative lifespan as a tumor-suppressive ' +
        'barrier, but the accumulation of senescent cells also contributes to organismal aging.',
    },
  },
  {
    slug: 'necroptosis_ripk_mlkl',
    notes: {
      'TNF-α + TNFR1 complex I (TRADD/TRAF/RIPK1-Ub) → NF-κB survival':
        'TNF binding TNFR1 first assembles membrane “complex I” (TRADD, TRAF2/5, RIPK1, cIAPs), where ' +
        'polyubiquitinated RIPK1 signals to NF-κB for survival and inflammation. The default TNF outcome is thus ' +
        'survival — death pathways open only if this checkpoint is disabled, making complex I a life/death ' +
        'gatekeeper.',
      'CYLD / A20 deubiquitination complex II (RIPK1 + FADD + caspase-8)':
        'If RIPK1 is deubiquitinated (by CYLD/A20), it dissociates into cytosolic “complex II” with FADD and ' +
        'caspase-8. This is the apoptotic complex — active caspase-8 drives apoptosis and, crucially, also cleaves ' +
        'and inactivates RIPK1/RIPK3 to keep necroptosis suppressed.',
      'caspase-8 inhibition / loss complex IIb / necrosome (RIPK1 + RIPK3 via RHIM)':
        'When caspase-8 is inhibited or absent (some viral infections, or pharmacologic caspase blockade), RIPK1 ' +
        'and RIPK3 instead associate through their RHIM domains into the necrosome. So caspase-8 activity is what ' +
        'normally keeps necroptosis off — its loss reroutes death from apoptosis to necroptosis.',
      'RIPK3 active MLKL phosphorylation at T357/S358':
        'Within the necrosome, RIPK3 phosphorylates the pseudokinase MLKL at T357/S358. MLKL has no enzymatic ' +
        'activity of its own — it is purely an executioner substrate, and this phosphorylation is the committed, ' +
        'defining step of necroptosis (and a key biomarker of the pathway).',
      'pMLKL trimerization + plasma membrane translocation → pore':
        'Phosphorylated MLKL oligomerizes (trimerizes) and translocates to the plasma membrane, inserting to form ' +
        'pores that rupture the cell. Unlike apoptosis, this lytic death spills DAMPs to drive inflammation — why ' +
        'necroptosis matters in ischemic injury and inflammatory disease, and is a target (RIPK1 inhibitors).',
    },
  },
];

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let totalAdded = 0;
for (const { slug, notes } of BATCH) {
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
  console.log(`${slug}: added ${added} step notes`);
  totalAdded += added;
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`batch G total: ${totalAdded} notes`);
