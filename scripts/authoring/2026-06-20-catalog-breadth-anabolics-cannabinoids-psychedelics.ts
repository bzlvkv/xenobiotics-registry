/**
 * 2026-06-20-catalog-breadth-anabolics-cannabinoids-psychedelics.ts
 *
 * Breadth wave — 22 new compounds closing white space in four classes the
 * registry already represented but left internally incomplete. Each was
 * verified by parallel literature agents against NCBI E-utilities; every PMID
 * resolves and every Ki/EC50/half-life below is abstract-VERBATIM (the value
 * appears, named, for the named compound, in the cited abstract). MWs are from
 * PubChem (CID in each `notes`). Where the literature only paraphrased, the
 * field is omitted and logged in AUTHORING_GAPS.md (2026-06-20 section).
 *
 * ── New compounds (22) ────────────────────────────────────────────────────
 *
 * Anabolics / endocrine (8):
 *   nandrolone              AR agonist (19-nor). PK: decanoate depot t½ 7–12 d IM (PMID:15713722)
 *   trenbolone              high-affinity AR agonist. AR IC50 33 nM human (PMID:12441365)
 *   boldenone               AR agonist. PK: undecylenate t½ 123 h IM — EQUINE (PMID:17348894)
 *   drostanolone            DHT-class AR agonist (Masteron). stub only
 *   methandrostenolone      17αα oral AR agonist (Dianabol). stub only
 *   testosterone-propionate short testosterone ester. stub only
 *   clenbuterol             β2-agonist (NOT a steroid). PK: t½ 35 h PO human (PMID:4045696)
 *   androstenedione         testosterone precursor / prohormone. stub only
 *
 * Cannabinoids (4 — category 'alkaloid', matching thc/cbd):
 *   cbn                     CB2 Ki 96.3 nM human (PMID:8819477). stub PK
 *   thcv                    THC propyl-analog. stub only (CB1 number is antagonist)
 *   delta-8-thc             Δ9 isomer. stub only (parent Ki table-only)
 *   hhc                     hydrogenated THC. stub only
 *
 * Psychedelics (4):
 *   psilocin                psilocybin's active metabolite. 5-HT2A Ki 120 nM (PMID:36049313);
 *                           PK t½ 1.8 h PO human (PMID:36507738)
 *   2c-b                    mescaline-class phenethylamine. stub only
 *   ibogaine                anti-addiction iboga alkaloid. PK t½ 10.2 h PO human, CYP2D6-inhibited
 *                           (PMID:25651476); noribogaine 28–49 h (PMID:25279818)
 *   5-meo-dmt               fast tryptamine. PK t½ <27 min IN human (PMID:38616411)
 *
 * Endocrine / research stims (6):
 *   enclomiphene            trans-clomiphene SERM. stub only
 *   raloxifene              benzothiophene SERM. PK t½ 32.5 h PO human (PMID:11006795)
 *   dnp                     mitochondrial uncoupler. PK t½ 18 h PO human (PMID:41249632)
 *   tianeptine              MOR EC50 194 nM + DOR EC50 37.4 µM human (PMID:25026323);
 *                           PK t½ 2.5 h PO human (PMID:2341111)
 *   mitragynine             kratom alkaloid, MOR partial agonist. PK t½ 23.24 h PO human (PMID:25995615)
 *   s23                     non-steroidal SARM. AR Ki 1.7 nM, full agonist (PMID:18772237)
 *
 * ── Alias merge (1) ───────────────────────────────────────────────────────
 *   cardarine += ['GW501516', 'GW-501516']  (already in registry; was unfindable by GW name)
 *
 * ── Notable skips (logged in AUTHORING_GAPS.md) ───────────────────────────
 *   AR Ki: nandrolone/boldenone/drostanolone/methandrostenolone/androstenedione — RBA-only or
 *          paraphrase (6539197, 11252818, 4021486, 3865479). PK: trenbolone/drostanolone/
 *          methandrostenolone/testosterone-propionate/androstenedione/2c-b(human)/enclomiphene/s23.
 *   Cannabinoid occupancy: thcv (verbatim CB1 46.6 nM is an ANTAGONIST — incompatible with the
 *          agonist Hill model), delta-8-thc + hhc (parent Ki table-only / computational only),
 *          cbn CB1 (no verbatim CBN CB1 number).
 *   Psychedelic 5-HT2A: 2c-b + 5-meo-dmt (table-only); ibogaine (not a 5-HT2A drug — NMDA/σ/opioid).
 *   Mitragynine opioid Ki: all table/figure-only in the abstracts (27192616, 31834797, 33154449, …).
 *   SERM occupancy: enclomiphene + raloxifene — only verbatim value is an antagonist IC50
 *          (Fitzpatrick 1999, PMID:10465261), which the agonist Emax/EC50 occupancy model can't carry.
 *
 * keo note: no compound below has a measured keo. Where receptor_occupancy is authored, the
 * effect_compartment.keo_per_h is a documented APPROXIMATION (flagged in its note), following the
 * established registry convention (testosterone-cypionate, thc, hydrocodone). The Ki/EC50 is the
 * verified datum; the keo is an order-of-magnitude biophase timescale, not a literature value.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  routes?: string[];
  doses?: Record<string, { min: number; max: number; typical: number; unit?: string }>;
  half_life_hr?: Record<string, number>;
  pk?: Record<string, { source_pmid?: string }>;
  effect_compartment?: { keo_per_h: number; source_pmid?: string; note?: string };
  receptor_occupancy?: Array<{
    receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number;
    source_pmid?: string; note?: string;
  }>;
  mw_g_mol?: number;
  systems?: string[];
  notes?: string;
  refs?: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  // ── Anabolics / endocrine ──────────────────────────────────────────────
  {
    slug: 'nandrolone',
    name: 'Nandrolone',
    aliases: ['Deca', '19-nortestosterone', 'Deca-Durabolin'],
    category: 'hormone',
    mechanism:
      '19-nortestosterone; a potent androgen-receptor full agonist with a high anabolic-to-androgenic ratio. A poor 5α-reductase substrate (reduced to weaker dihydronandrolone), lowering androgenic action in skin/prostate, but it aromatizes to estrogenic metabolites and is also progestogenic. Suppresses the HPG axis; the decanoate depot gives a long detection window.',
    routes: ['IM'],
    doses: { IM: { min: 50, max: 600, typical: 200 } },
    half_life_hr: { IM: 240 },
    pk: { IM: { source_pmid: 'PMID:15713722' } },
    mw_g_mol: 274.4,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'cardiovascular'],
    notes:
      'PubChem CID 9904 (free base). Common form is the decanoate ester (slow IM depot); phenylpropionate (NPP) is shorter. PK is the depot-ester terminal half-life — Bagchus 2005 (PMID:15713722) verbatim "the terminal half-life was 7-12 d" after IM nandrolone decanoate in healthy men; authored as 240 h (≈10 d midrange). No verbatim absolute AR Ki in any abstract (see AUTHORING_GAPS).',
    refs: ['PMID:15713722'],
  },
  {
    slug: 'trenbolone',
    name: 'Trenbolone',
    aliases: ['Tren', '17beta-trenbolone', 'trienbolone'],
    category: 'hormone',
    mechanism:
      'Synthetic 19-nor (estrane) androgen; a very high-affinity AR full agonist (~3× testosterone) resistant to both 5α-reduction and aromatization, so it does not convert to estrogen. Strongly anabolic with marked androgenic and progestogenic activity. Veterinary growth promoter; abused for lean-mass gain with aggressive HPG suppression and no estrogenic offset.',
    routes: ['IM'],
    doses: { IM: { min: 100, max: 700, typical: 300 } },
    mw_g_mol: 270.4,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'cardiovascular'],
    effect_compartment: {
      keo_per_h: 0.01,
      note: 'Approximation; no published keo. AR genomic anabolic effect builds over weeks — mirrors the slow androgen-receptor effect timescale authored for testosterone esters (testosterone-cypionate).',
    },
    receptor_occupancy: [
      {
        receptor: 'androgen_receptor',
        pathway: 'anabolic',
        emax: 1,
        ec50_mg_l: 0.008923,
        hill_n: 1,
        source_pmid: 'PMID:12441365',
        note: 'Wilson 2002 (PMID:12441365) verbatim: "TB was a high affinity ligand for the androgen receptor (AR), with an IC(50) of about 4 nM in rat ventral prostate cytosol and about 33 nM in cells transfected with the human AR when competed with 1 nM [3H]R1881." Human AR (33 nM) used; IC50 as EC50 proxy. ec50 = 33 nM × 270.4 / 1e6.',
      },
    ],
    notes: 'PubChem CID 25015 (free base). Common forms are acetate (short) and enanthate (long); no human clinical product. No verbatim plasma half-life in any abstract (see AUTHORING_GAPS).',
    refs: ['PMID:12441365'],
  },
  {
    slug: 'boldenone',
    name: 'Boldenone',
    aliases: ['Equipoise', 'EQ', '1-dehydrotestosterone'],
    category: 'hormone',
    mechanism:
      'Δ1-dehydro analog of testosterone; a moderate AR agonist, more anabolic and less androgenic than testosterone. Aromatizes (more weakly than testosterone), so some estrogenic activity is possible. Veterinary anabolic (horses/cattle); abused for slow lean-mass gain. The undecylenate depot gives a long doping-control detection window.',
    routes: ['IM'],
    doses: { IM: { min: 200, max: 800, typical: 400 } },
    half_life_hr: { IM: 123 },
    pk: { IM: { source_pmid: 'PMID:17348894' } },
    mw_g_mol: 286.4,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'cardiovascular'],
    notes:
      'PubChem CID 13308 (free base). Common form is the undecylenate ester. PK is EQUINE, not human — Soma 2007 (PMID:17348894) verbatim "elimination (t1/2e) half-lives for BL were 8.5 h and 123.0 h, respectively" after IM boldenone in horses (1.1 mg/kg); authored as the best-available long-ester depot approximation. No human boldenone PK abstract found; no verbatim AR Ki (see AUTHORING_GAPS).',
    refs: ['PMID:17348894'],
  },
  {
    slug: 'drostanolone',
    name: 'Drostanolone',
    aliases: ['Masteron', 'drostanolone propionate', 'dromostanolone'],
    category: 'hormone',
    mechanism:
      '2α-methyl dihydrotestosterone derivative; a DHT-class AR agonist that cannot aromatize (no estrogenic activity) and is not further 5α-reduced. Moderately anabolic, distinctly androgenic, with mild anti-estrogenic action (historically used in breast cancer). Abused for a "hard/dry" cosmetic look; androgenic side effects (hair loss, virilization) are prominent.',
    routes: ['IM'],
    doses: { IM: { min: 200, max: 600, typical: 400 } },
    mw_g_mol: 304.5,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'integumentary'],
    notes: 'PubChem CID 6011 (free base). Common form is drostanolone propionate (Masteron, short ester). No verbatim plasma half-life (only urinary detection-window studies) and no verbatim AR Ki in any abstract (see AUTHORING_GAPS).',
    refs: [],
  },
  {
    slug: 'methandrostenolone',
    name: 'Methandrostenolone',
    aliases: ['Dianabol', 'Dbol', 'methandienone', 'metandienone'],
    category: 'hormone',
    mechanism:
      '17α-methylated Δ1-testosterone analog; an orally active AR agonist (the 17α-methyl resists hepatic first-pass, enabling PO use but conferring hepatotoxicity). Strongly anabolic with moderate androgenicity; aromatizes to 17α-methylestradiol (estrogenic — gynecomastia, water retention). Classic oral "kickstart" with 17αα-related liver strain and HPG suppression.',
    routes: ['PO'],
    doses: { PO: { min: 10, max: 50, typical: 30 } },
    mw_g_mol: 300.4,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'digestive'],
    notes: 'PubChem CID 6300. No primary abstract names a methandienone plasma half-life (the "3–6 h" figure traces only to secondary pages); no verbatim AR Ki (see AUTHORING_GAPS). digestive = hepatic 17αα strain.',
    refs: [],
  },
  {
    slug: 'testosterone-propionate',
    name: 'Testosterone propionate',
    aliases: ['Test Prop'],
    category: 'hormone',
    mechanism:
      'Short-chain ester prodrug of testosterone; after IM depot release it is hydrolyzed to free testosterone, the natural AR agonist, which also 5α-reduces to DHT and aromatizes to estradiol. Full androgenic + anabolic spectrum. The short ester gives a rapid rise and short duration vs the longer cypionate/enanthate esters, so it is injected more frequently.',
    routes: ['IM'],
    doses: { IM: { min: 25, max: 200, typical: 100 } },
    mw_g_mol: 344.5,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'cardiovascular'],
    notes: 'PubChem CID 5995 (propionate ester). AR affinity belongs to the released free testosterone (see testosterone / testosterone-cypionate). No testosterone-propionate half-life is abstract-verbatim — the "~19 h" figure traces only to the Behre/Nieschlag review (see AUTHORING_GAPS).',
    refs: [],
  },
  {
    slug: 'clenbuterol',
    name: 'Clenbuterol',
    aliases: ['Clen'],
    category: 'pharmacological',
    mechanism:
      'Long-acting selective β2-adrenergic receptor agonist (Gs/cAMP). Bronchodilator (approved abroad, not for human use in the US). Abused off-label for fat loss via β2-mediated lipolysis, thermogenesis, and a repartitioning/mild anabolic effect on skeletal muscle. Adverse effects: tachycardia, tremor, hypokalemia, and cardiac hypertrophy/arrhythmia risk; the long half-life prolongs toxicity.',
    routes: ['PO'],
    doses: { PO: { min: 20, max: 120, typical: 40, unit: 'mcg' } },
    half_life_hr: { PO: 35 },
    pk: { PO: { source_pmid: 'PMID:4045696' } },
    mw_g_mol: 277.19,
    systems: ['respiratory', 'cardiovascular', 'musculoskeletal', 'nervous'],
    notes:
      'PubChem CID 2783 (free base). NOT a steroid — a β2-agonist. Doses are in MICROGRAMS (20–120 µg/day). PK: Yamamoto 1985 (PMID:4045696) verbatim "The half-life of clenbuterol in plasma was estimated to be about 35 h" in man after oral clenbuterol HCl.',
    refs: ['PMID:4045696'],
  },
  {
    slug: 'androstenedione',
    name: 'Androstenedione',
    aliases: ['Andro', '4-androstenedione', '4-androstene-3,17-dione'],
    category: 'hormone',
    mechanism:
      'Endogenous C19 steroid and the immediate precursor to testosterone (via 17β-HSD) and to estrone (via aromatase). Weak direct AR activity — its supplement effect depends on peripheral conversion to testosterone/estrogens. Former OTC "prohormone" (now controlled). Oral andro often raises estrogens as much as testosterone, so the anabolic payoff is small and the estrogenic / HDL-lowering effects are a real concern.',
    routes: ['PO'],
    doses: { PO: { min: 50, max: 300, typical: 100 } },
    mw_g_mol: 286.4,
    systems: ['endocrine', 'reproductive', 'musculoskeletal'],
    notes: 'PubChem CID 6128. Weak/indirect AR ligand acting mainly via conversion to testosterone. No verbatim plasma half-life (oral-andro abstracts report serum AUC / excretion only) and no verbatim AR Ki (see AUTHORING_GAPS).',
    refs: [],
  },

  // ── Cannabinoids (category 'alkaloid', matching thc/cbd) ───────────────
  {
    slug: 'cbn',
    name: 'Cannabinol',
    aliases: ['cannabinol', 'CBN'],
    category: 'alkaloid',
    mechanism:
      'Oxidative degradation product of THC that accumulates in aged cannabis. A weak partial agonist at CB1 with notably higher relative affinity for CB2 than CB1; only mildly psychoactive vs THC. Marketed as a sleep aid, though controlled human sedation data are thin.',
    routes: ['INH', 'PO'],
    doses: { INH: { min: 1, max: 10, typical: 5 }, PO: { min: 2.5, max: 25, typical: 10 } },
    mw_g_mol: 310.4,
    systems: ['nervous'],
    effect_compartment: {
      keo_per_h: 0.5,
      note: 'Approximation; no published keo. Mirrors the cannabinoid biophase equilibration authored for THC (binding tracks brain Ce; onset route-dependent — minutes inhaled, 1–3 h oral).',
    },
    receptor_occupancy: [
      {
        receptor: 'cb2',
        pathway: 'agonist',
        emax: 1,
        ec50_mg_l: 0.029892,
        hill_n: 1,
        source_pmid: 'PMID:8819477',
        note: 'Showalter 1996 (PMID:8819477) verbatim: "The affinity of cannabinol for CB2 receptors (Ki = 96.3 +/- 14 nM) was confirmed to be in approximately the same range as that of delta 9-THC (Ki = 36.4 +/- 10 nM)." Cloned human CB2, [3H]CP-55,940. ec50 = 96.3 nM × 310.4 / 1e6.',
      },
    ],
    notes: 'PubChem CID 2543. No verbatim CBN CB1 Ki and no abstract-verbatim half-life (see AUTHORING_GAPS).',
    refs: ['PMID:8819477'],
  },
  {
    slug: 'thcv',
    name: 'Tetrahydrocannabivarin',
    aliases: ['tetrahydrocannabivarin', 'THCV', 'delta-9-THCV'],
    category: 'alkaloid',
    mechanism:
      'Propyl-side-chain analog of THC. Behaves as a CB1 antagonist / low-efficacy ligand at low doses and a CB1 partial agonist at higher doses; CB2 partial agonist. Studied for appetite suppression and metabolic effects, in contrast to THC\'s orexigenic action.',
    routes: ['INH', 'PO'],
    doses: { INH: { min: 1, max: 10, typical: 5 }, PO: { min: 5, max: 20, typical: 10 } },
    mw_g_mol: 286.4,
    systems: ['nervous', 'digestive'],
    notes: 'PubChem CID 93147. Occupancy SKIP: the only verbatim CB1 Ki for Δ9-THCV (46.6 nM, Pertwee 2007 PMID:17245367) characterizes it as a CB1 ANTAGONIST in vivo — the agonist Hill-occupancy model can\'t carry an antagonist emax (see AUTHORING_GAPS). No verbatim human half-life.',
    refs: [],
  },
  {
    slug: 'delta-8-thc',
    name: 'Delta-8-THC',
    aliases: ['delta-8', 'delta-8-tetrahydrocannabinol', 'd8-thc'],
    category: 'alkaloid',
    mechanism:
      'Double-bond positional isomer of Δ9-THC (8,9 vs 9,10). A CB1/CB2 partial agonist with psychoactivity reported as roughly half that of Δ9-THC and a somewhat milder/clearer subjective profile. Predominantly hemp-derived-synthesized, occupying a legal gray area.',
    routes: ['INH', 'PO'],
    doses: { INH: { min: 5, max: 25, typical: 10 }, PO: { min: 5, max: 40, typical: 15 } },
    mw_g_mol: 314.5,
    systems: ['nervous'],
    notes: 'PubChem CID 638026. Occupancy SKIP: every verbatim Δ8 Ki located belongs to synthetic dimethyl/1-deoxy analogs; the parent value is table-only in Compton 1993 (PMID:8474008). No verbatim half-life (see AUTHORING_GAPS).',
    refs: [],
  },
  {
    slug: 'hhc',
    name: 'Hexahydrocannabinol',
    aliases: ['hexahydrocannabinol', 'HHC'],
    category: 'alkaloid',
    mechanism:
      'Hydrogenated (saturated C9–C10) analog of THC. A psychoactive CB1/CB2 agonist; commercial products are a mixture of two C9 epimers, (9R)- and (9S)-HHC, with the (9R) epimer reported to bind CB1/CB2 more favorably. Hemp-derived semi-synthetic.',
    routes: ['INH', 'PO'],
    doses: { INH: { min: 5, max: 25, typical: 10 }, PO: { min: 10, max: 40, typical: 20 } },
    mw_g_mol: 316.5,
    systems: ['nervous'],
    notes: 'PubChem CID 16050328. Occupancy SKIP: the one direct parent-HHC receptor paper (PMID:40704858) is molecular-docking only (no Ki); all numeric values found belong to synthetic HHC derivatives. No verbatim half-life (see AUTHORING_GAPS).',
    refs: [],
  },

  // ── Psychedelics ────────────────────────────────────────────────────────
  {
    slug: 'psilocin',
    name: 'Psilocin',
    aliases: ['4-HO-DMT', '4-hydroxy-DMT', '4-hydroxy-N,N-dimethyltryptamine'],
    category: 'other',
    mechanism:
      'Active dephosphorylated metabolite of psilocybin (a prodrug, hydrolyzed by alkaline phosphatase to psilocin in vivo). A 5-HT2A receptor agonist — the classical psychedelic mechanism — with additional 5-HT2C and 5-HT1A activity. Risks: HPPD, anxiety / "bad trip," transient blood-pressure and heart-rate elevation; Schedule I.',
    routes: ['PO'],
    doses: { PO: { min: 5, max: 25, typical: 15 } },
    half_life_hr: { PO: 1.8 },
    pk: { PO: { source_pmid: 'PMID:36507738' } },
    mw_g_mol: 204.27,
    systems: ['nervous'],
    effect_compartment: {
      keo_per_h: 1.0,
      source_pmid: 'PMID:36507738',
      note: 'Approximation; no published keo. Subjective 5-HT2A effect tracks plasma psilocin with a short lag (oral Tmax ~80–105 min; effects peak shortly after and largely resolve by ~3–6 h). keo ≈1/h reflects rapid CNS equilibration.',
    },
    receptor_occupancy: [
      {
        receptor: '5-HT2A',
        pathway: 'psychedelic',
        emax: 1,
        ec50_mg_l: 0.024512,
        hill_n: 1,
        source_pmid: 'PMID:36049313',
        note: 'Erkizia-Santamaría 2022 (PMID:36049313) verbatim: "Psilocin showed similar affinities for 5HT2AR (Ki: 120-173 nM)". Human/mouse brain competition binding; 120 nM (low end) used. ec50 = 120 nM × 204.27 / 1e6.',
      },
    ],
    notes:
      'PubChem CID 4980. The active metabolite of the registry\'s psilocybin entry. PK: Holze 2023 (PMID:36507738) verbatim psilocin elimination half-life "1.8 hours (1.7-2.0)" for 15 mg oral psilocybin in healthy participants.',
    refs: ['PMID:36507738', 'PMID:36049313'],
  },
  {
    slug: '2c-b',
    name: '2C-B',
    aliases: ['2C-B', '4-bromo-2,5-dimethoxyphenethylamine', 'Nexus'],
    category: 'alkaloid',
    mechanism:
      'Psychedelic phenethylamine (mescaline analog). A partial agonist at 5-HT2A / 5-HT2C with notably low intrinsic efficacy at 5-HT2A in vitro (some assays show net antagonism). A shorter, "lighter" experience than the classical tryptamines; Schedule I. Risks: nausea, hypertension, anxiety.',
    routes: ['PO'],
    doses: { PO: { min: 10, max: 25, typical: 18 } },
    mw_g_mol: 260.13,
    systems: ['nervous'],
    notes: 'PubChem CID 98527. No human half-life in any abstract (only a rat/SC 1.1 h value, PMID:18339493). 5-HT2A Ki is table-only in every primary abstract checked (see AUTHORING_GAPS).',
    refs: [],
  },
  {
    slug: 'ibogaine',
    name: 'Ibogaine',
    aliases: ['iboga', '12-methoxyibogamine'],
    category: 'alkaloid',
    mechanism:
      'Iboga alkaloid with anti-addiction interest (suppresses opioid withdrawal and craving). Polypharmacology — NMDA-receptor antagonist, sigma-1/2, kappa- and mu-opioid, SERT, nicotinic — NOT primarily a 5-HT2A drug. CYP2D6 converts it to the long-lived active metabolite noribogaine. Major risk: QT prolongation → torsades / cardiac arrest.',
    routes: ['PO'],
    doses: { PO: { min: 200, max: 1200, typical: 1000 } },
    half_life_hr: { PO: 10.2 },
    pk: { PO: { source_pmid: 'PMID:25651476' } },
    mw_g_mol: 310.4,
    systems: ['nervous', 'cardiovascular'],
    notes:
      'PubChem CID 197060. Anti-addiction "flood" dose ~10–20 mg/kg (≈700–1400 mg/70 kg). PK: Glue 2015 (PMID:25651476) verbatim ibogaine "an elimination half-life of 10.2 hours" — measured in CYP2D6-inhibited (paroxetine-pretreated) subjects where parent accumulates; normal metabolizers convert rapidly to noribogaine (human t½ "28-49 hours", PMID:25279818). 5-HT2A occupancy not authored — it is not a primary ibogaine target.',
    refs: ['PMID:25651476', 'PMID:25279818'],
  },
  {
    slug: '5-meo-dmt',
    name: '5-MeO-DMT',
    aliases: ['5-MeO-DMT', '5-methoxy-N,N-dimethyltryptamine', 'O-methyl-bufotenin', 'toad venom'],
    category: 'alkaloid',
    mechanism:
      'Very fast, very potent tryptamine psychedelic. A serotonergic agonist with affinity rank 5-HT1A >> 5-HT2A (5-HT1A is the primary high-affinity target, ~300-fold over 5-HT2A). O-demethylated by CYP2D6 to bufotenine and an MAO substrate. Found in Bufo alvarius (Sonoran toad) venom. Risks: extreme intensity, transient hypertension, rare serotonin toxicity when MAOI-combined.',
    routes: ['INH', 'IN'],
    doses: { INH: { min: 6, max: 20, typical: 12 }, IN: { min: 1, max: 12, typical: 8 } },
    half_life_hr: { IN: 0.45 },
    pk: { IN: { source_pmid: 'PMID:38616411' } },
    mw_g_mol: 218.29,
    systems: ['nervous'],
    notes:
      'PubChem CID 1832. PK: Rucker 2024 (PMID:38616411) verbatim "the mean terminal elimination half-life was <27 min" (Tmax ~8–10 min) for intranasal BPL-003 5-MeO-DMT benzoate; authored as 0.45 h. 5-HT2A occupancy not authored — 5-HT2A is the weak target (5-HT1A primary) and its Ki is table-only (see AUTHORING_GAPS).',
    refs: ['PMID:38616411'],
  },

  // ── Endocrine / research stims ─────────────────────────────────────────
  {
    slug: 'enclomiphene',
    name: 'Enclomiphene',
    aliases: ['Androxal', 'enclomifene', '(E)-clomiphene', 'trans-clomiphene'],
    category: 'pharmacological',
    mechanism:
      'The trans-(E)-isomer of clomiphene, a selective estrogen receptor modulator (SERM). It antagonizes estrogen receptors at the hypothalamus, blocking estradiol negative feedback so GnRH pulse frequency rises, driving pituitary LH/FSH and consequently endogenous testicular testosterone. Unlike exogenous testosterone it preserves spermatogenesis, making it attractive for secondary hypogonadism and post-cycle therapy.',
    routes: ['PO'],
    doses: { PO: { min: 6.25, max: 25, typical: 12.5 } },
    mw_g_mol: 406.0,
    systems: ['endocrine', 'reproductive', 'nervous'],
    notes: 'PubChem CID 1548953 (free base, E-isomer). No abstract names an enclomiphene half-life (Ghobadi 2009 PMID:19033451 states it "could not be determined due to a very flat terminal half-life"). Occupancy SKIP — only verbatim value is an antagonist IC50 (77 nM, Fitzpatrick 1999 PMID:10465261), incompatible with the agonist model (see AUTHORING_GAPS).',
    refs: [],
  },
  {
    slug: 'raloxifene',
    name: 'Raloxifene',
    aliases: ['Evista', 'keoxifene'],
    category: 'pharmacological',
    mechanism:
      'A benzothiophene selective estrogen receptor modulator (SERM): an estrogen-receptor antagonist in breast and uterine tissue but an agonist in bone, where it reduces osteoclastic resorption and preserves bone mineral density. Approved for postmenopausal osteoporosis and breast-cancer-risk reduction; used off-label in PCT as an estrogen-antagonist alternative to aromatase inhibitors.',
    routes: ['PO'],
    doses: { PO: { min: 30, max: 120, typical: 60 } },
    half_life_hr: { PO: 32.5 },
    pk: { PO: { source_pmid: 'PMID:11006795' } },
    mw_g_mol: 473.6,
    systems: ['endocrine', 'reproductive', 'musculoskeletal'],
    notes: 'PubChem CID 5035 (free base). PK: Snyder 2000 (PMID:11006795) verbatim "the elimination half-life averages 32.5 hours." Occupancy SKIP — only verbatim value is an antagonist IC50 (1 nM, Fitzpatrick 1999 PMID:10465261), incompatible with the agonist model (see AUTHORING_GAPS).',
    refs: ['PMID:11006795'],
  },
  {
    slug: 'dnp',
    name: '2,4-Dinitrophenol',
    aliases: ['2,4-dinitrophenol', '2-4-dinitrophenol', 'DNP', 'Dinitrophenol'],
    category: 'pharmacological',
    mechanism:
      'A lipophilic protonophore that uncouples mitochondrial oxidative phosphorylation — shuttling protons across the inner membrane collapses the electrochemical gradient, so substrate oxidation continues but ATP synthesis does not and the energy dissipates as heat. This drives a large rise in metabolic rate and fat oxidation (the basis of its illicit fat-loss use) but the same mechanism produces uncontrolled hyperthermia. DNP has no antidote and no therapeutic window — effective and lethal doses overlap, and its long persistence has caused many fatalities.',
    routes: ['PO'],
    doses: { PO: { min: 100, max: 400, typical: 250 } },
    half_life_hr: { PO: 18 },
    pk: { PO: { source_pmid: 'PMID:41249632' } },
    mw_g_mol: 184.11,
    systems: ['endocrine', 'musculoskeletal'],
    notes: 'PubChem CID 1493. Protonophore, not a receptor ligand (no occupancy). The illicit weight-loss dose overlaps the lethal range. PK: an acute-overdose case (PMID:41249632) verbatim "demonstrating first order kinetics with a half-life of 18 h"; the commonly cited "~36 h" is not abstract-verifiable (see AUTHORING_GAPS).',
    refs: ['PMID:41249632'],
  },
  {
    slug: 'tianeptine',
    name: 'Tianeptine',
    aliases: ['Stablon', 'Coaxil', 'tianeptine sodium', 'Tatinol'],
    category: 'pharmacological',
    mechanism:
      'An atypical antidepressant that, unusually, acts as an efficacious agonist at the µ-opioid receptor (and a low-potency full δ-opioid agonist) — now understood to underlie both its mood effects and its abuse liability ("gas station heroin"). It also modulates glutamatergic transmission and reverses stress-induced hippocampal remodeling. At supratherapeutic doses the opioid agonism produces euphoria, tolerance, dependence, and a classic opioid withdrawal syndrome.',
    routes: ['PO'],
    doses: { PO: { min: 12.5, max: 50, typical: 37.5 } },
    half_life_hr: { PO: 2.5 },
    pk: { PO: { source_pmid: 'PMID:2341111' } },
    mw_g_mol: 437.0,
    systems: ['nervous', 'digestive'],
    effect_compartment: {
      keo_per_h: 2.0,
      note: 'Approximation; no tianeptine-specific keo. The acute µ-opioid effect is fast; order-of-magnitude from the opioid biophase timescale (cf. hydrocodone analog basis, keo ≈2/h). Distinct from the weeks-long antidepressant effect.',
    },
    receptor_occupancy: [
      {
        receptor: 'mu_opioid',
        pathway: 'analgesia',
        emax: 1,
        ec50_mg_l: 0.084778,
        hill_n: 1,
        source_pmid: 'PMID:25026323',
        note: 'Gassaway 2014 (PMID:25026323) verbatim: human MOR "EC(50 Human) of 194±70 nM ... for G-protein activation"; an "efficacious MOR agonist" (the abstract states no Emax % — emax=1 is a modeling default). ec50 = 194 nM × 437.0 / 1e6.',
      },
      {
        receptor: 'delta_opioid',
        pathway: 'opioid',
        emax: 1,
        ec50_mg_l: 16.3438,
        hill_n: 1,
        source_pmid: 'PMID:25026323',
        note: 'Gassaway 2014 (PMID:25026323) verbatim: "full δ-opioid receptor (DOR) agonist ... EC(50 Human) of 37.4±11.2 μM ... for G-protein activation". ~190× weaker than MOR, so DOR occupancy is negligible at therapeutic plasma. ec50 = 37400 nM × 437.0 / 1e6.',
      },
    ],
    notes: 'PubChem CID 68870 (free acid; marketed sodium salt ≈459 g/mol). PK: Salvadori 1990 (PMID:2341111) verbatim eliminated "with a half-life of 2.5 +/- 1.1 h". Inactive at KOR per the same paper.',
    refs: ['PMID:2341111', 'PMID:25026323'],
  },
  {
    slug: 'mitragynine',
    name: 'Mitragynine',
    aliases: ['kratom alkaloid', 'Mitragyna speciosa alkaloid'],
    category: 'alkaloid',
    mechanism:
      'The principal indole alkaloid of kratom (Mitragyna speciosa); a G-protein-biased partial agonist at the µ-opioid receptor, producing stimulant-like effects at low doses and opioid-like analgesia/sedation at higher doses. Its CYP3A-derived metabolite 7-hydroxymitragynine is a far more potent MOR agonist and contributes substantially to the in-vivo opioid effect. Reported G-protein bias is hypothesized to limit respiratory depression, though dependence and withdrawal still occur.',
    routes: ['PO'],
    doses: { PO: { min: 5, max: 80, typical: 25 } },
    half_life_hr: { PO: 23.24 },
    pk: { PO: { source_pmid: 'PMID:25995615' } },
    mw_g_mol: 398.5,
    systems: ['nervous', 'digestive'],
    notes: 'PubChem CID 3034396. Parent alkaloid of the registry\'s 7-hydroxymitragynine metabolite. PK: Trakulsrichai 2015 (PMID:25995615), first human PK study, verbatim "terminal half-life (23.24±16.07 hours)". Opioid Ki/EC50 SKIP — real but table/figure-only in every abstract (see AUTHORING_GAPS).',
    refs: ['PMID:25995615'],
  },
  {
    slug: 's23',
    name: 'S-23',
    aliases: ['S-23', 'S23 SARM'],
    category: 'pharmacological',
    mechanism:
      'A high-affinity non-steroidal selective androgen receptor modulator (SARM) that acts as a full agonist at the androgen receptor, driving anabolic effects on muscle and bone with relatively reduced prostate stimulation. Originally characterized as a candidate for hormonal male contraception (suppresses LH/FSH and spermatogenesis). A research-only compound with no approved human use or human PK.',
    routes: ['PO'],
    doses: { PO: { min: 10, max: 30, typical: 20 } },
    mw_g_mol: 416.8,
    systems: ['endocrine', 'reproductive', 'musculoskeletal'],
    effect_compartment: {
      keo_per_h: 0.01,
      note: 'Approximation; no published keo. AR genomic anabolic effect builds over weeks — mirrors the slow androgen-receptor effect timescale authored for testosterone esters (testosterone-cypionate).',
    },
    receptor_occupancy: [
      {
        receptor: 'androgen_receptor',
        pathway: 'anabolic',
        emax: 1,
        ec50_mg_l: 0.0007086,
        hill_n: 1,
        source_pmid: 'PMID:18772237',
        note: 'Jones 2009 (PMID:18772237) verbatim: "S-23 showed high binding affinity (inhibitory constant = 1.7 +/- 0.2 nm) and was identified as a full agonist in vitro". In-vitro AR binding Ki, full agonist. ec50 = 1.7 nM × 416.8 / 1e6.',
      },
    ],
    notes: 'PubChem CID 24892822. No abstract names an S-23 half-life (Jones 2009 says only "favorable pharmacokinetic properties"); circulating figures come from vendor blogs/patents that disagree (see AUTHORING_GAPS).',
    refs: ['PMID:18772237'],
  },
];

// Aliases to merge into existing entries (compound already present, just unfindable by these names).
const ALIAS_ADDITIONS: Record<string, string[]> = {
  cardarine: ['GW501516', 'GW-501516'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0;
  let skipped = 0;
  for (const c of NEW_COMPOUNDS) {
    if (bySlug.has(c.slug)) {
      console.log(`  [skip] ${c.slug} already in registry`);
      skipped++;
    } else {
      data.push(c);
      bySlug.set(c.slug, c);
      added++;
      const occ = c.receptor_occupancy?.length ? ` +occ(${c.receptor_occupancy.map(o => o.receptor).join(',')})` : '';
      const pk = c.pk ? ' +pk' : '';
      console.log(`  [add ] ${c.slug.padEnd(24)} mw=${String(c.mw_g_mol).padEnd(7)}${pk}${occ}`);
    }
  }

  let aliasMerges = 0;
  for (const [slug, aliases] of Object.entries(ALIAS_ADDITIONS)) {
    const c = bySlug.get(slug);
    if (!c) { console.log(`  [warn] alias-merge target missing: ${slug}`); continue; }
    c.aliases = c.aliases ?? [];
    for (const a of aliases) {
      if (!c.aliases.includes(a)) { c.aliases.push(a); aliasMerges++; }
    }
    console.log(`  [alias] ${slug} += ${aliases.join(', ')}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nCatalog breadth wave (2026-06-20): +${added} compounds (${skipped} already present), +${aliasMerges} aliases. Now ${data.length} compounds.`);
}

main();
