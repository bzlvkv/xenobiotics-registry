/**
 * 2026-05-24-signaling-batch-B.ts
 *
 * step.note grind, batch B — 5 pathways, notes-only. Existing refs
 * title-checked via esummary 2026-05-24 and topically ground these notes:
 *   mitophagy_pink1_parkin        PMID:21179058 (Mechanisms of mitophagy), 39358449
 *   circadian_clock_bmal1_per_cry PMID:27990019, 23916625, 35577675 (clock reviews)
 *   ppar_alpha_gamma_delta        PMID:11818483 (Mechanisms of action of PPARs)
 *   pyroptosis_gasdermin          PMID:27932073 (Gasdermin review), 38110635
 *   senescence_sasp_senolytics    PMID:32686219 (senolytics), 28416161 (senescence)
 * (insulin_glucose_homeostasis skipped — thin skeleton, needs restructuring.)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-B.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'mitophagy_pink1_parkin',
    notes: {
      'healthy mitochondrion (intact Δψm) PINK1 imported + degraded by MPP':
        'PINK1 is constantly made and constantly destroyed on healthy mitochondria: imported across the intact ' +
        'membrane potential (Δψm), cleaved by the matrix protease MPP and then PARL, and retro-translocated for ' +
        'proteasomal degradation. This futile import-and-destroy cycle keeps PINK1 near zero — a built-in timer ' +
        'that reports membrane health.',
      'damaged mitochondrion (Δψm loss) PINK1 accumulation on outer membrane':
        'When a mitochondrion is damaged and loses Δψm, PINK1 can no longer be imported and cleaved, so it ' +
        'stabilizes and accumulates on the outer membrane (OMM). This conditional stabilization is the core ' +
        'sensing step — converting loss of membrane potential into a localized “eat me” signal only on defective ' +
        'organelles.',
      'PINK1 active (OMM) Ub-Ser65 phosphorylation + Parkin activation':
        'Stabilized PINK1 phosphorylates ubiquitin at Ser65 and the Parkin Ubl domain, recruiting and switching ' +
        'on the E3 ligase Parkin. Phospho-ubiquitin and Parkin form a feed-forward loop that amplifies the ' +
        'ubiquitin signal on the damaged organelle. Loss-of-function mutations in PINK1 or Parkin cause ' +
        'autosomal-recessive Parkinson’s disease.',
      'Parkin E3 ligase OMM protein polyubiquitination (Mfn1/2, MIRO, TOM20)':
        'Activated Parkin polyubiquitinates many OMM proteins (Mfn1/2, MIRO, TOM20). Tagging mitofusins blocks ' +
        'fusion to isolate the damaged unit, and MIRO loss halts its transport — quarantining the organelle ' +
        'before disposal. The dense ubiquitin coat is the platform that autophagy receptors then read.',
      'polyubiquitinated mitochondrion OPTN / NDP52 / TAX1BP1 / p62 binding → LC3 recruitment':
        'Autophagy receptors (OPTN, NDP52, TAX1BP1, p62) bind the poly-Ub coat and simultaneously bind LC3 via ' +
        'LIR motifs, tethering the mitochondrion to the forming autophagosome. TBK1 phosphorylates these ' +
        'receptors to strengthen binding — linking the same kinase used in innate immunity to organelle clearance.',
      'mitochondrion in autophagosome lysosomal degradation':
        'The engulfed mitochondrion is delivered to the lysosome, where acid hydrolases degrade it and recycle ' +
        'its components. This completes mitochondrial quality control; failure to clear damaged mitochondria ' +
        'leaves a source of ROS and pro-apoptotic factors, contributing to neurodegeneration and aging.',
      'developmental mitophagy (no Ub step) BNIP3 / NIX / FUNDC1 → direct LC3 binding':
        'A ubiquitin-independent route also exists: receptor-mediated mitophagy uses the OMM proteins BNIP3, NIX ' +
        '(BNIP3L), and FUNDC1, which bind LC3 directly via their own LIR motifs. This drives programmed ' +
        'mitochondrial clearance during development — e.g. NIX in red-blood-cell maturation — and responds to ' +
        'hypoxia.',
    },
  },
  {
    slug: 'circadian_clock_bmal1_per_cry',
    notes: {
      'light → SCN ipRGCs (melanopsin) SCN clock entrainment':
        'The master clock sits in the hypothalamic SCN, entrained to the light-dark cycle by intrinsically ' +
        'photosensitive retinal ganglion cells (ipRGCs) using the pigment melanopsin. This light input aligns the ' +
        'otherwise ~24-h self-sustaining oscillator to external time, and the SCN then synchronizes peripheral ' +
        'clocks throughout the body.',
      'BMAL1 + CLOCK / NPAS2 E-box binding → Per1/2/3, Cry1/2, Rev-erbα/β, Rorα transcription':
        'The positive limb: BMAL1 heterodimerizes with CLOCK (or NPAS2) and binds E-box elements to transcribe ' +
        'the clock’s own repressors (Per1/2/3, Cry1/2) plus the nuclear receptors Rev-erbα/β and Rorα. This single ' +
        'activator complex drives both arms of the feedback loops that generate the rhythm.',
      'PER + CRY accumulating cytoplasm PER-CRY nuclear translocation → BMAL1-CLOCK repression':
        'The negative limb: PER and CRY accumulate in the cytoplasm, dimerize, and re-enter the nucleus to inhibit ' +
        'BMAL1-CLOCK — shutting off their own transcription. The built-in delay between transcription and this ' +
        'repression (set by protein accumulation and phosphorylation) is what gives the loop its ~24-h period.',
      'Rev-erbα/β + Rorα Bmal1 transcription rhythmic':
        'A second, interlocked loop tunes the clock: Rev-erbα/β repress and Rorα activates Bmal1 transcription, ' +
        'generating the antiphase rhythm of BMAL1 itself. The Rev-erbs are heme-sensing, druggable nuclear ' +
        'receptors — linking the clock to metabolism and making this loop a target for chronotherapy.',
      'CK1δ/ε PER phosphorylation → β-TrCP ubiquitination → degradation':
        'Timing is set post-translationally: casein kinase CK1δ/ε phosphorylates PER, creating a phosphodegron for ' +
        'β-TrCP-mediated ubiquitination and proteasomal degradation. The speed of PER turnover sets the period — ' +
        'the CK1 mutation behind familial advanced sleep-phase syndrome shortens it.',
      'AMPK CRY1 phosphorylation → degradation':
        'Metabolism feeds back onto the clock: AMPK (the cellular energy sensor) phosphorylates CRY1 to promote ' +
        'its degradation, thereby advancing the clock. This is one molecular link by which nutrient state and ' +
        'feeding time entrain peripheral clocks, sometimes uncoupling them from the SCN’s light-driven rhythm.',
      'SCN clock pineal melatonin synthesis (night)':
        'As an output, the SCN drives nighttime melatonin synthesis by the pineal gland (via a multisynaptic ' +
        'sympathetic relay that light suppresses). Melatonin is the body’s hormonal “darkness” signal and a ' +
        'feedback cue to the SCN — the basis for its use in jet lag and circadian sleep disorders.',
    },
  },
  {
    slug: 'ppar_alpha_gamma_delta',
    notes: {
      'free PUFA / eicosanoid / nitro-fatty acid PPAR ligand-binding domain':
        'The PPARs are lipid-sensing nuclear receptors: their large hydrophobic pockets are activated by free ' +
        'polyunsaturated fatty acids, eicosanoids, and nitro-fatty acids — making them direct transcriptional ' +
        'sensors of the cell’s lipid milieu. This endogenous-lipid logic is why dietary and metabolic fatty acids ' +
        'tune their target genes.',
      'PPAR-ligand PPAR-RXR heterodimer on PPRE':
        'Like other type-II nuclear receptors, a ligand-bound PPAR acts as an obligate heterodimer with RXR, ' +
        'binding PPAR response elements (PPREs). Ligand swaps corepressors for coactivators; because RXR is the ' +
        'shared partner, PPAR signaling intersects with retinoid and other RXR-partnered pathways.',
      'PPARα-RXR on PPRE CPT1A / ACOX1 / FABP1 transcription':
        'PPARα (liver-enriched) drives fatty-acid catabolism — CPT1A for mitochondrial uptake, ACOX1 for ' +
        'peroxisomal β-oxidation, FABP1 for intracellular transport — the program switched on during fasting. It ' +
        'is the molecular target of the fibrate drugs used to lower triglycerides.',
      'PPARα-RXR on PPRE apoA-I / apoA-II / LPL transcription':
        'PPARα also reshapes plasma lipoproteins, inducing apoA-I/apoA-II (raising HDL) and lipoprotein lipase ' +
        '(LPL) while repressing apoC-III to speed triglyceride clearance. These transcriptional effects explain ' +
        'the lipid-profile changes produced by fibrates.',
      'PPARγ-RXR on PPRE aP2 / adiponectin / GLUT4 transcription':
        'PPARγ is the master regulator of adipogenesis and insulin sensitivity, inducing aP2, adiponectin, and ' +
        'GLUT4 to promote fat storage and glucose uptake. It is the direct receptor for the thiazolidinedione ' +
        '(glitazone) insulin sensitizers — whose side effects (weight gain, fluid retention) also trace to PPARγ.',
      'PPARγ + p65 NF-κB transrepression of NF-κB targets':
        'Beyond gene activation, ligand-bound PPARγ transrepresses inflammation: it is SUMOylated and tethered to ' +
        'NF-κB (p65) target promoters, keeping corepressor complexes in place. This ligand-dependent ' +
        'transrepression underlies the anti-inflammatory action of PPARγ agonists, independent of PPRE binding.',
      'PPARδ-RXR on PPRE muscle FA oxidation genes + slow-twitch fiber programme':
        'PPARδ (ubiquitous) drives fatty-acid oxidation genes and the oxidative, slow-twitch muscle-fiber ' +
        'program — in effect an “exercise-mimetic” transcriptional output. Its agonists boost endurance and lipid ' +
        'handling in models, which is also why they have been abused as doping agents.',
    },
  },
  {
    slug: 'pyroptosis_gasdermin',
    notes: {
      'DAMP / PAMP (cholesterol crystals, β-amyloid, ATP, MSU, LPS) NLRP3 / NLRC4 / AIM2 / pyrin inflammasome assembly':
        'Pyroptosis starts when cytosolic sensors detect danger: NLRP3 (broad DAMPs — cholesterol crystals, ' +
        'β-amyloid, ATP, urate), NLRC4 (bacterial flagellin/T3SS), AIM2 (cytosolic dsDNA), or pyrin assemble into ' +
        'inflammasomes. NLRP3’s two-signal requirement makes it the central hub of sterile inflammation and a ' +
        'major drug target.',
      'inflammasome ASC oligomerization → caspase-1 activation':
        'Inflammasome assembly nucleates the adaptor ASC into a single micron-scale speck, which clusters ' +
        'pro-caspase-1 to drive its proximity-induced autoactivation. The ASC speck is both an amplifier and a ' +
        'visible hallmark of an active inflammasome, and it can be released to propagate inflammation between cells.',
      'caspase-1 GSDMD cleavage at Asp275 → N-terminal fragment':
        'Active caspase-1 has two jobs: it matures the cytokines IL-1β/IL-18, and it cleaves gasdermin D at ' +
        'Asp275, freeing its pore-forming N-terminal domain from the autoinhibitory C-terminus. This cleavage is ' +
        'the committing step that turns an inflammasome signal into membrane-lytic death.',
      'GSDMD-N (cytosolic) plasma membrane oligomerization → 10–16-mer pores':
        'Freed GSDMD-N targets the inner leaflet’s acidic lipids, oligomerizes, and punches large (10–16-subunit) ' +
        'plasma-membrane pores. These release IL-1β/IL-18 and cause osmotic lysis — the lytic, pro-inflammatory ' +
        'death that distinguishes pyroptosis from apoptosis; NINJ1 then drives the final membrane rupture.',
      'cytosolic LPS (gram-negative) caspase-4/5/11 → GSDMD cleavage':
        'A non-canonical route bypasses the inflammasome: cytosolic LPS from gram-negative bacteria binds ' +
        'caspase-4/5 (human) or caspase-11 (mouse) directly, which then cleave GSDMD themselves. This lets cells ' +
        'sense intracellular gram-negative infection and is central to LPS-driven sepsis.',
      'caspase-3 (apoptosis) + GSDME expression switch to pyroptosis':
        'The death programs cross-talk: when apoptotic caspase-3 is active in a cell expressing gasdermin E ' +
        '(GSDME/DFNA5), caspase-3 cleaves GSDME to open pores — converting “silent” apoptosis into lytic ' +
        'pyroptosis. GSDME is silenced in many tumors, so its re-expression shapes chemotherapy-induced ' +
        'inflammation.',
    },
  },
  {
    slug: 'senescence_sasp_senolytics',
    notes: {
      'genotoxic stress (telomere erosion, ROS, oncogene) DDR + p53-p21 / p16-Rb activation':
        'Senescence is triggered by diverse genotoxic stresses — telomere erosion (replicative senescence), ' +
        'oxidative damage, and oncogene activation (OIS) — which converge on the DNA-damage response and engage ' +
        'the two tumor-suppressor arms, p53-p21 and p16-Rb. It evolved as an anti-cancer brake but accumulates ' +
        'with age.',
      'p16^INK4a^ ↑ Rb hypophosphorylation → stable G1 arrest':
        'p16 (the INK4a CDK4/6 inhibitor) rises and keeps Rb hypophosphorylated, so Rb stays bound to E2F and ' +
        'blocks cell-cycle entry — locking in a stable G1 arrest that, unlike quiescence, resists mitogens. p16 ' +
        'is the most widely used biomarker of senescent-cell burden in aging tissue.',
      'persistent DNA damage / cytosolic DNA cGAS-STING + NF-κB activation':
        'Senescence becomes inflammatory partly via nucleic-acid sensing: persistent DNA damage and cytoplasmic ' +
        'chromatin fragments (and leaked mitochondrial DNA) activate cGAS-STING, which with NF-κB launches the ' +
        'secretory response. This links the genome-surveillance machinery to the senescent secretome.',
      'NF-κB + C/EBPβ + GATA4 SASP transcription (IL-6, IL-8, MCP-1, MMPs, GDF15)':
        'The SASP is driven transcriptionally by NF-κB with C/EBPβ and GATA4, producing IL-6, IL-8, MCP-1, matrix ' +
        'metalloproteinases, and GDF15. The SASP reinforces arrest and recruits immune clearance, but when ' +
        'chronic it spreads senescence to neighbors and fuels age-related “inflammaging”.',
      'BCL-2 / BCL-xL upregulation (SCAP) apoptosis resistance':
        'Senescent cells resist their own apoptosis by upregulating BCL-2-family survival proteins (BCL-2, ' +
        'BCL-xL) through senescent-cell anti-apoptotic pathways (SCAPs). This survival dependence is the ' +
        'therapeutic Achilles’ heel — precisely what senolytics exploit.',
      'senolytic drug (D+Q, fisetin, navitoclax) selective apoptosis of senescent cells':
        'Senolytics selectively kill senescent cells by disabling those survival pathways: dasatinib+quercetin ' +
        '(D+Q), the flavonoid fisetin, and the BCL-2/BCL-xL inhibitor navitoclax. Clearing senescent cells ' +
        'improves healthspan in animal models, and translational trials are now testing this in age-related disease.',
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
console.log(`batch B total: ${totalAdded} notes`);
