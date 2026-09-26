/**
 * 2026-09-26-peptide-gap-batch.ts
 *
 * Fifteen new compounds and nine patches, closing the peptide / grey-market
 * white space named by a 70-item request list. Fifty-four of the seventy names
 * already resolved to a live record (by slug, name or `aliases[]`); the eight
 * that resolved only by a spelling the app's search could not reach are patched
 * rather than duplicated, and the rest are below.
 *
 * Every PMID was fetched from NCBI E-utilities in this session and every stored
 * number is abstract-VERBATIM or a DECLARED derivation from verbatim values.
 * MWs are PubChem, re-queried here rather than taken on trust (CID in each
 * `notes`). Where the literature gives only a range, only a paraphrase, or only
 * a secondary review, the field is OMITTED and the reason is on the record.
 *
 * ── Authored PK (2 of 15) ─────────────────────────────────────────────────
 *
 *   afamelanotide  SC t½ 0.8 h + V 9.6949 L (derived from a verbatim clearance)
 *                  + F 1 + ka 9.9021 /h (from a verbatim absorption half-life).
 *                  The only compound on the list with real human PK.
 *   cagrilintide   SC t½ 159 h + ka 0.1525 /h back-derived to the verbatim
 *                  24 h median Tmax, DISCLOSED. Volume deliberately not
 *                  derived — see below, the reason is a date in the abstract.
 *
 * ── Stubs with a declared reason (10) ─────────────────────────────────────
 *
 *   cibinetide            `uncharacterized`. Six indexed human trials, zero
 *                         published PK parameters.
 *   pentosan-polysulfate  `mixture`. Enoxaparin's shape exactly: a polydisperse
 *                         polymer no human study ever measured as a parent
 *                         concentration.
 *   itpp                  `uncharacterized`. A phase Ib that COLLECTED PK as a
 *                         secondary objective and published none of it.
 *   foxo4-dri             `research-only`. No PK in any species; the dosing
 *                         regimen is in STAR Methods, which efetch cannot see.
 *   slu-pp-332            `research-only`. No EC50, no dose, no PK indexed.
 *   p021                  `research-only`. Identity and mechanism are solid;
 *                         no numeric dose appears in any of 15 abstracts.
 *   adamax                `research-only`, and the record's job is to say that
 *                         NOTHING is indexed — see the naming trap below.
 *   ovagen                `research-only`, and it CONTRADICTS the vendor story.
 *   cartalax              `uncharacterized`. The strongest of the four
 *                         Khavinson entries: brand, sequence and tissue all
 *                         verify, twice.
 *   cagrisema             `mixture` + `composition`, the fixed-dose combination.
 *
 * ── Vendor blends (3), all `mixture` + `composition` ──────────────────────
 *   wolverine-blend, klow-blend, glow-blend. Constituent ratios are from
 *   vendor pages, named as such, because there is no other source: no indexed
 *   paper studies any of the three blends, and the names never appear in
 *   PubMed beside these peptides.
 *
 * ── THE JUDGEMENT CALL WORTH READING: afamelanotide's volume ──────────────
 *
 * Ugwu 1997 (PMID:9113347) is three male volunteers, ten doses, three routes,
 * and it states four things verbatim: *"the SC dose is completely bioavailable
 * compared to the IV dose"*, *"The plasma half-lives following SC dosing ranged
 * from 0.07 to 0.79 h for the absorption phase and from 0.8 to 1.7 h for the
 * beta-phase"*, *"Clearance ranged from 0.12 to 0.19 L kg-1 h-1"*, and *"No
 * detectable drug levels were observed following PO dosing"*.
 *
 * Three of those become stored parameters without arithmetic. F is 1: complete
 * bioavailability is stated outright and corroborated by PMID:28063031
 * (*"Subcutaneous application had full bioavailability"*). The beta-phase
 * half-life is stored at its LOWER endpoint, 0.8 h, per this catalog's standing
 * rule that a midpoint is a measurement nobody made. ka is a UNIT CONVERSION,
 * not a back-derivation: an absorption-phase HALF-LIFE of 0.07 h is a rate of
 * ln2/0.07 = 9.9021 /h, and the paper states it.
 *
 * WHY THE LOWER ENDPOINT OF THE ABSORPTION RANGE, specifically. At the other
 * end, 0.79 h gives ka 0.8774 /h against a ke of 0.8664 /h — the two differ by
 * 1.3%, and the Bateman form has ka-ke in its denominator. That corner is not
 * merely less likely, it is UNREPRESENTABLE in a one-compartment model. Taking
 * both lower endpoints also keeps the record in one coherent corner rather than
 * blending two arms.
 *
 * The volume is the interesting one. It is NOT published — no Cmax, no AUC, no
 * Vd appears in any indexed abstract for this drug, by injection or by implant.
 * But CL and t½ jointly FIX it: V = CL/ke = (0.12 L/kg/h x 70 kg) / (ln2/0.8 h)
 * = 8.4 / 0.8664340 = 9.6949 L. Storing that makes the record reproduce a
 * verbatim published clearance, which is the class-12 test this catalog applies
 * to everyone else, satisfied here by construction.
 *
 * The alternative was to store nothing, and that is the trap batch 11 was
 * written about: a record with no V_L does not abstain, it asserts the solver's
 * 0.5 L/kg default of 35 L. Pair the CL range with the t½ range and the band of
 * volumes this paper permits is 9.7 to 32.6 L. The default sits ABOVE ALL OF
 * IT. Silence would have been a claim the paper contradicts, and it would have
 * run every curve up to 3.6x low.
 *
 * ROUTE AMBIGUITY, DISSOLVED RATHER THAN IGNORED. The clearance sentence does
 * not name a route, and an unattributed CL is normally the route-mismatch
 * defect waiting to happen. It cannot be here: the same abstract's finding is
 * that SC is COMPLETELY bioavailable, so CL/F and CL are the same number and
 * the pairing holds whichever arm produced it.
 *
 * ── WHY CAGRILINTIDE'S VOLUME IS *NOT* DERIVED, THOUGH A Cmax EXISTS ──────
 *
 * Enebo 2021 (PMID:33894838) publishes Cmax 6.14-170 nmol/L and AUC0-168h
 * 926-24 271 nmol*h/L, so a V/F looks one division away. It is not, and the
 * reason is a clause in the Methods rather than anything about the numbers:
 * the PK endpoints were *"assessed from day of last dose (week 19) to end of
 * treatment (week 20)"*, i.e. after 16 weeks of co-escalation and 4 weeks at
 * target. Those are STEADY-STATE values. At a 159-195 h half-life on a weekly
 * interval the accumulation ratio is about 2, so a single-dose V/F derived from
 * that Cmax would be roughly HALF the truth, and which half depends on a number
 * the abstract does not print. 4.5 mg against 170 nmol/L gives 6.0 L; the same
 * arithmetic corrected for accumulation gives about 12 L. A 2x fork is not a
 * measurement, so nothing is stored and the fork is recorded here.
 *
 * What IS stored: the lower endpoint of the half-life range, 159 h, and a ka.
 * The ka IS a back-derivation and says so on the record — 0.1525 /h reproduces
 * the verbatim lower-endpoint median Tmax of 24 h against that half-life. It is
 * authored rather than left blank because `resolvePk` would otherwise apply
 * 1.0 /h and put the peak of a ONCE-WEEKLY peptide at 5.4 h, 4 to 13x early.
 * Caveat also on the record: a steady-state median Tmax is not exactly the
 * single-dose quantity the Bateman formula inverts.
 *
 * ── WHERE THE LITERATURE CONTRADICTS THE PRODUCT (three of these) ─────────
 *
 * 1. ovagen. Vendors sell "Ovagen" as the LIVER bioregulator, the tripeptide
 *    Glu-Asp-Leu. Two separate problems. In PubMed, Ovagen is an ovine FSH
 *    superovulation preparation for sheep and goats, so five of the name's hits
 *    carry FSH doses in mg and IU that must never be read as this peptide's.
 *    And every indexed EDL study is RENAL: PMID:28744634 is nephroprotection in
 *    rats, PMID:24958378 names MMP-14 as the target. `EDL tripeptide liver` and
 *    `Glu-Asp-Leu hepatocyte` both return ZERO. The Khavinson liver preparation
 *    is HEPALIN, a polypeptide complex never equated with EDL. So the record is
 *    tagged `renal`, not `digestive`, and the liver claim is marked vendor-
 *    asserted. This is the record correcting the product, not repeating it.
 * 2. slu-pp-332 is sold for oral use and its own literature says
 *    PMID:41421047: it *"improves aerobic performance in mice but lacks oral
 *    bioavailability"*, all animal work being intraperitoneal.
 * 3. adamax has NO indexed literature whatsoever. Nine adamantane-x-Semax
 *    searches return zero while Semax alone returns 232, so this is a specific
 *    absence of the analogue rather than a failed search. `mw_g_mol` IS
 *    THEREFORE OMITTED: the structure is a vendor claim, and storing a mass
 *    would give it a precision nothing supports.
 *
 * ── Naming traps recorded so the next harvest does not step in them ───────
 *   Adamax      -> all 39 PubMed hits are the machine-learning optimizer.
 *   Ovagen      -> ovine FSH, with real mg and IU doses attached.
 *   EDL         -> extensor digitorum longus muscle (43 hits).
 *   Glu-Asp-Leu -> substring of Ala-Glu-Asp-Leu (AEDL, bronchogen), a DIFFERENT
 *                  tetrapeptide assigned to lung.
 *   AED         -> antiepileptic drug.
 *   P021        -> an abstract NUMBER in a Crit Care supplement.
 *   MGF         -> mast cell growth factor (SCF/kit ligand) in PMID:1281675,
 *                  whose mouse half-lives are a different protein entirely.
 *   PEG-IGF-I   -> PMID:28110155's human 140-200 h half-life is full-length
 *                  PEGylated rhIGF-I (RO5046013), NOT the MGF E-domain peptide.
 *                  Almost certainly the origin of the vendor claim that PEG-MGF
 *                  lasts days. It must never land on that record.
 *   GLOW        -> also a compounded GHK-Cu + glutathione + vitamin C product
 *                  with no BPC-157 or TB-500 in it.
 *
 * Run:  pnpm tsx scripts/authoring/2026-09-26-peptide-gap-batch.ts
 * Idempotent: a slug already present is skipped and every patch is guarded, so
 * a re-run is a no-op.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Both trees' seeds — see the 2026-09-18 script for why v12's JSON is still
 *  written even though its README names Postgres as the source of truth: the
 *  v12 app BOOTS on this file whenever no published bundle is cached. Neither
 *  write reaches v12's `registry.compound` table; that needs /admin. */
const TARGETS = [
  join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json'),
  join(__dirname, '..', '..', '..', '..', '..', 'v12', 'packages', 'registry', 'data', 'compounds.json'),
];

interface Compound {
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  mechanism: string;
  routes: string[];
  doses: Record<string, { min: number; max: number; typical: number; unit: string }>;
  half_life_hr: Record<string, number>;
  pk?: Record<string, Record<string, unknown>>;
  pk_unauthored?: { reason: string; note?: string };
  composition?: {
    standardization?: string;
    constituents: Array<{ slug: string; mg_per_g_extract: number; note?: string }>;
  };
  interactions?: Array<{ slug: string; name: string; level: string; note: string }>;
  mw_g_mol?: number;
  systems: string[];
  notes?: string;
  refs: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  // ── 1. afamelanotide — the one record with real human PK ────────────────
  {
    slug: 'afamelanotide',
    name: 'Afamelanotide',
    aliases: ['Melanotan I', 'Melanotan-1', 'MT-I', 'NDP-MSH', '[Nle4,D-Phe7]-alpha-MSH', 'CUV1647', 'Scenesse'],
    category: 'peptide',
    mechanism:
      'Linear 13-residue alpha-MSH analogue (Ac-Ser-Tyr-Ser-Nle-Glu-His-D-Phe-Arg-Trp-Gly-Lys-Pro-Val-NH2). The Nle4 and D-Phe7 substitutions resist enzymatic degradation and raise potency far above the native hormone, while keeping MC1R as the dominant target — so unlike melanotan-ii next door this is a SELECTIVE melanocortin-1 agonist, not a pan-MCR agonist. MC1R signalling increases eumelanin synthesis, induces antioxidant activity, enhances DNA repair and modulates inflammation. Approved by the EMA in 2014 as a 16 mg controlled-release subcutaneous implant for preventing phototoxicity in erythropoietic protoporphyria, which makes it the only approved drug in the melanotan family and the reason it must not be confused with the grey-market MT-II.',
    routes: ['SC'],
    doses: { SC: { min: 5.6, max: 14.7, typical: 11.2, unit: 'mg' } },
    half_life_hr: { SC: 0.8 },
    pk: { SC: { ka_hr: 9.9021, V_L: 9.6949, F: 1, source_pmid: 'PMID:9113347' } },
    mw_g_mol: 1646.8,
    systems: ['integumentary', 'endocrine'],
    interactions: [
      {
        slug: 'melanotan-ii',
        name: 'Melanotan II',
        level: 'caution',
        note: 'Constantly confused with each other and routinely mis-sold under each other\'s names. MT-I is MC1R-selective and EMA-approved; MT-II is a non-selective MC1R/MC3R/MC4R agonist with the appetite and sexual-response effects and the priapism case reports. Do not stack: the shared MC1R activity is additive and nothing about one substitutes for the other.',
      },
    ],
    notes:
      'PubChem CID 16197727 (C78H111N21O19). ALL FOUR PK PARAMETERS COME FROM ONE PAPER, Ugwu 1997 (PMID:9113347), three male volunteers given ten doses by three routes in a randomised crossover. F = 1 is verbatim: "the SC dose is completely bioavailable compared to the IV dose", corroborated by Minder 2017 (PMID:28063031), "Subcutaneous application had full bioavailability". HALF-LIFE 0.8 h is the LOWER ENDPOINT of "from 0.8 to 1.7 h for the beta-phase" — an endpoint rather than the midpoint, per this catalog\'s standing rule; the upper endpoint would roughly double the exposure duration. ka 9.9021 /h is a UNIT CONVERSION, not a back-derivation: the paper states an absorption-phase half-life "from 0.07 to 0.79 h", and ln2/0.07 = 9.9021. The LOWER endpoint is used there for a reason worth keeping: 0.79 h gives ka 0.8774 /h against this record\'s ke of 0.8664 /h, a 1.3% difference, and ka-ke sits in the Bateman denominator — that corner of the range is not representable in a one-compartment model at all. VOLUME IS A DECLARED DERIVATION. No Cmax, AUC or Vd is published for this drug by any route, but the abstract states "Clearance ranged from 0.12 to 0.19 L kg-1 h-1", and CL with t-half fixes V: (0.12 x 70) / (ln2/0.8) = 8.4 / 0.8664340 = 9.6949 L. The record therefore reproduces a verbatim published clearance by construction. Storing nothing was the alternative and it is worse: a missing V_L asserts the solver default of 0.5 L/kg = 35 L, and the band this paper permits is 9.7-32.6 L across the two ranges, so the default sits above ALL of it and would have run every curve up to 3.6x low. The clearance sentence does not name a route, which is normally where route mismatch creeps in; it cannot here, because complete SC bioavailability makes CL and CL/F the same number. Resolved through resolvePk at 11.2 mg this record peaks at 0.915 mg/L (555 nmol/L) at 16 min — a disclosed prediction, not a measurement, since no Cmax exists to check it against. DOSE BLOCK IS THE INJECTION, NOT THE IMPLANT. The cited study dosed 0.08-0.21 mg/kg SC with a 0.16 mg/kg point dose in the IV and PO arms; those are stored as 70 kg equivalents (5.6-14.7 mg, typical 11.2) because DoseUnit has no weight-based member and the solver never weight-scales. THE MARKETED PRODUCT IS A DIFFERENT KINETIC OBJECT: a 16 mg controlled-release implant every 60 days (PMID:26132941, two phase III trials), whose release profile is zero-order over weeks and is NOT published. Melanin density after one implant "increased by day 7, peaked at day 15 and remained elevated at day 60" (PMID:20969564) — pharmacodynamics, not kinetics. Logging 16 mg against this record renders the INJECTION curve and will be wrong by orders of magnitude in duration; that is in AUTHORING_GAPS as the open item. ORAL IS DEAD ON PURPOSE: "No detectable drug levels were observed following PO dosing", so PO is not a listed route. Mechanism references PMID:11237737 and PMID:8605020 (MC1R binding and signalling).',
    refs: ['PMID:9113347', 'PMID:28063031', 'PMID:26132941', 'PMID:20969564', 'PMID:11237737', 'PMID:8605020'],
  },

  // ── 2. cagrilintide ─────────────────────────────────────────────────────
  {
    slug: 'cagrilintide',
    name: 'Cagrilintide',
    aliases: ['NN9838', 'AM833', 'NN0174-0833'],
    category: 'peptide',
    mechanism:
      'Long-acting acylated amylin analogue — a 37-residue peptide with a cyclic 3-to-8 disulfide, a C-terminal prolinamide, and a C20 fatty diacid on a gamma-Glu/Lys linker that binds albumin and is the designed half-life mechanism. Acts as a dual agonist at the amylin receptors (AMY1-3, calcitonin receptor core plus a RAMP) and at the calcitonin receptor itself, a class its developers call a DACRA. Amylin signalling slows gastric emptying and drives satiation through the area postrema, a mechanism ORTHOGONAL to GLP-1 — which is why it is developed as a partner for semaglutide rather than a competitor, and why the combination is more than additive on weight.',
    routes: ['SC'],
    doses: { SC: { min: 0.16, max: 4.5, typical: 2.4, unit: 'mg' } },
    half_life_hr: { SC: 159 },
    pk: { SC: { ka_hr: 0.1525, source_pmid: 'PMID:33894838' } },
    mw_g_mol: 4409,
    systems: ['endocrine', 'digestive'],
    interactions: [
      {
        slug: 'semaglutide',
        name: 'Semaglutide',
        level: 'synergistic',
        note: 'The pairing cagrilintide was built for, and the only setting its human PK has ever been measured in. Amylin and GLP-1 agonism are distinct satiety mechanisms and the weight effect is greater than semaglutide alone (PMID:33894838). Exposure is non-interacting in one direction at least: "Exposure was proportional to cagrilintide dose and did not affect semaglutide exposure or elimination." Co-formulated as CagriSema.',
      },
    ],
    notes:
      'PubChem CID 171397054 (C194H312N54O59S2). ALL HUMAN PK IS COMBINATION PK — there is no cagrilintide monotherapy dataset in any indexed abstract. Enebo 2021 (PMID:33894838), phase 1b, six cohorts of 12 (11 at 4.5 mg), BMI 27.0-39.9, dosed once-weekly SC together with semaglutide 2.4 mg. HALF-LIFE 159 h is the LOWER ENDPOINT of the verbatim "Cagrilintide 0.16-4.5 mg had a half-life of 159-195 h", a range across dose groups; the endpoint rather than the midpoint, per the standing rule. ka 0.1525 /h IS A BACK-DERIVATION AND SAYS SO: it reproduces the verbatim lower-endpoint "median tmax of 24-72 h" against that half-life, by solving tmax = ln(ka/ke)/(ka-ke) with ke = ln2/159. It is authored rather than omitted because resolvePk would otherwise substitute 1.0 /h and put the peak of a once-weekly peptide at 5.4 h, 4 to 13x early. Two caveats travel with it: the Tmax is a median across dose groups, and it is a STEADY-STATE median, which is not exactly the single-dose quantity that formula inverts. NO VOLUME, AND THE REASON IS A DATE. The abstract prints Cmax 6.14-170 nmol/L and AUC0-168h 926-24 271 nmol*h/L, which look like one division from a V/F, but the PK endpoints were "assessed from day of last dose (week 19) to end of treatment (week 20)" — after 16 weeks of co-escalation and 4 weeks at target, so they are steady-state. At this half-life on a weekly interval the accumulation ratio is about 2, so the naive single-dose arithmetic (4.5 mg / 0.7495 mg/L = 6.0 L) and the accumulation-corrected version (about 12 L) differ twofold, and the abstract does not print what would settle it. A 2x fork is not a measurement. The record therefore runs on the 0.5 L/kg default of 35 L, which for an albumin-bound acylated peptide is likely 3-6x too high (semaglutide\'s measured total volume is 7.7 L) and makes concentrations read low; full text of the phase 1b would close it. MEASURED THROUGH THE SOLVER RATHER THAN ASSUMED: resolved through pkParamsForRoute and evaluated at a single 4.5 mg dose, this record peaks at 24 nmol/L at t = 24.006 h. The tmax confirms the ka does what it was derived to do. The peak is 7.1x below the 170 nmol/L the paper reports at that dose — but that published figure is STEADY-STATE, so roughly 2x of the gap is accumulation a single-dose curve is correct to omit, leaving about 3.5x attributable to the defaulted volume. That is the measured size of the missing V_L, and it points the same way as the 6-12 L estimate above. Clearance and volume are reported only as "similar across treatment groups", with no numbers. The renal and hepatic impairment study (PMID:42228334) publishes AUC RATIOS only. Kruse 2021 (PMID:34288673) is the discovery paper and its abstract carries no numeric cagrilintide PK at all — its only half-life belongs to pramlintide. SEARCH TRAP: PubMed auto-translates AM833 to fleroxacin and does not index NN9838; use the INN. Mechanism reference PMID:40847076 (cryo-EM of the AMY1R-Gs and CTR-Gs complexes).',
    refs: ['PMID:33894838', 'PMID:34288673', 'PMID:40847076', 'PMID:42228334'],
  },

  // ── 3. cibinetide ───────────────────────────────────────────────────────
  {
    slug: 'cibinetide',
    name: 'Cibinetide',
    aliases: ['ARA-290', 'ARA290', 'pHBSP', 'pyroglutamate helix B surface peptide'],
    category: 'peptide',
    mechanism:
      'An 11-residue peptide modelled on the helix-B region of erythropoietin, which is the face of the hormone that does NOT contact the erythropoietic receptor. It therefore activates only the innate repair receptor — a heterodimer of the EPO receptor and the beta common receptor, expressed not in healthy tissue but induced by injury and inflammation — while leaving the EPOR homodimer alone. That split is the whole point of the molecule: recombinant EPO cannot be used for tissue protection because it raises haematocrit and activates platelets, and this peptide separates the protective signal from the erythropoietic one. Studied for sarcoidosis-associated small-fibre neuropathy, diabetic neuropathy and diabetic macular oedema.',
    routes: ['SC', 'IV'],
    doses: {
      SC: { min: 1, max: 8, typical: 4, unit: 'mg' },
      IV: { min: 2, max: 2, typical: 2, unit: 'mg' },
    },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'uncharacterized',
      note: 'Six indexed human trials dose this peptide and not one reports a PK parameter. The only half-life statements are secondary and non-specific: PMID:25728128, a review by the molecule\'s own developers, says "Despite a short plasma half-life (~2min), pHBSP activates a molecular switch". Approximate, with no species, route, dose or n — and a 2-min plasma figure is an IV observation, so storing it on SC would be the route-mismatch defect. No phase-1 paper is indexed.',
    },
    mw_g_mol: 1257.3,
    systems: ['nervous', 'immune-hematologic'],
    notes:
      'PubChem CID 91810664 (C51H84N16O21); sequence pGlu-Glu-Gln-Leu-Glu-Arg-Ala-Leu-Asn-Ser-Ser. A 54-record title screen of everything PubMed indexes under the INN found no PK-dedicated paper, and the six human trials (PMID:23168581 sarcoidosis, PMID:28475703 dose-ranging, PMID:25387363 type 2 diabetic neuropathy, PMID:32674280 diabetic macular oedema, PMID:26431906, PMID:24136731) report efficacy, safety and pharmacodynamics only. THE "~2 min" HALF-LIFE IS DELIBERATELY NOT STORED and the reasoning is worth keeping, because thymosin-alpha-1 in this catalog DID take a half-life from a narrative review and carries a provenance caveat for it: that precedent predates the 2026-09-08 standard ("accuracy, and if accuracy is not possible dont do it") and should not be extended. Three reviews repeat the figure (PMID:25728128, PMID:27634443 as "HBSP", PMID:38943972 with no number at all) and the primary measurement behind it is not in PubMed. Worth noting the pharmacology makes the number nearly irrelevant to a curve anyway: the molecule\'s entire premise, stated in its own review\'s title, is that a short-lived peptide flips a switch whose effects far outlast plasma, so a two-minute Bateman curve would model the wrong quantity even if it were sourced. DOSES are from the trials: IV 2 mg three times weekly (PMID:23168581, 12 active / 10 placebo), SC 1, 4 or 8 mg daily for 28 days in 64 subjects (PMID:28475703), SC 4 mg daily (PMID:25387363, PMID:32674280). Mechanism references PMID:25728128 (innate repair receptor, verbatim) and PMID:38488446, a mouse knockdown showing the neuroprotective effect is "significantly suppressed following the injection of siRNA against betaCR".',
    refs: ['PMID:25728128', 'PMID:38488446', 'PMID:23168581', 'PMID:28475703', 'PMID:25387363', 'PMID:32674280'],
  },

  // ── 4. pentosan polysulfate sodium ──────────────────────────────────────
  {
    slug: 'pentosan-polysulfate',
    name: 'Pentosan polysulfate sodium',
    aliases: ['Elmiron', 'PPS', 'SP54', 'pentosan polysulphate sodium', 'xylan polysulfate'],
    category: 'pharmacological',
    mechanism:
      'Semi-synthetic glycosaminoglycan mimetic, made by chemically sulfonating a plant-derived beta-(1,4)-xylan. Orally it is the only drug approved for interstitial cystitis, where the proposed action is local: replenishing a defective glycosaminoglycan layer on the bladder urothelium so that urinary solutes stop reaching the underlying tissue. Parenterally it behaves as a heparin-like polyanion, raising APTT and anti-Xa activity and releasing lipases, and in that form it has been used for osteoarthritis and studied in Kaposi sarcoma. Long-term oral use is now associated with a distinctive pigmentary maculopathy, which is the dominant safety consideration.',
    routes: ['PO', 'IM', 'SC', 'IV'],
    doses: {
      PO: { min: 300, max: 900, typical: 300, unit: 'mg' },
      IM: { min: 50, max: 100, typical: 100, unit: 'mg' },
      SC: { min: 35, max: 50, typical: 50, unit: 'mg' },
      IV: { min: 10, max: 100, typical: 50, unit: 'mg' },
    },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'mixture',
      note: 'A polydisperse polymer, "an average molecular weight ranging from 4000 to 6000 Da" (PMID:31287456), that no human study has measured as a parent concentration: "since specific assays for PPS do not exist" (PMID:10192753), so that study used clotting-time and lipase surrogates and PMID:16278190 a tritium label. Enoxaparin sits here for the same shape — activity, not concentration, so a mass-based curve models a quantity nobody measured.',
    },
    systems: ['renal', 'musculoskeletal', 'immune-hematologic'],
    notes:
      'NO mw_g_mol ON PURPOSE. PubChem CID 92043424 gives 1705.1 for a single defined decasodium oligomer, which is not the drug; the drug is a distribution, "4000 to 6000 Da" verbatim (PMID:31287456). Storing either number would misdescribe it, and a µM conversion on a polydisperse polyanion is meaningless anyway. REJECTED MW: PMID:32088260 contains "average molecular weight (MW) up to 4000-8000 Dalton" and that sentence is about HEPARIN, not PPS. THE ASSAY GOVERNS EVERYTHING HERE, which is why this is a mixture rather than a gap. Faaij 1999 (PMID:10192753), 18 healthy young men, three-way crossover of 1500 mg PO against 50 mg IV: "Point estimates for the oral bioavailability of PPS were in the range of 0% with small confidence intervals" and "The oral bioavailability of PPS is negligible in young healthy males" — measured through APTT, anti-Xa, hepatic triglyceride lipase, lipoprotein lipase, t-PA and fibrin plate lysis, because no specific assay exists. Simon 2005 (PMID:16278190), 16 healthy women given [3H]PPS orally: "Most of the administered dose (84%) was excreted in faeces as intact PPS, and a smaller percentage (6%) was excreted in urine", the urinary material being "low molecular weight and desulfated PPS" — a metabolite, not the drug. That near-zero oral bioavailability is the single most decision-relevant fact about the oral product and it has no field to live in: F must be a fraction the solver multiplies a dose by, and this record has no curve to multiply. AN F OF 0 WOULD BE THE WRONG SHAPE, not a smaller number. The IV data are detectability, not kinetics: "PPS was still detectable 8 h after 50 and 100 mg IV and 6 h after 35 mg SC" (PMID:2436330, three subjects, one per level), measured by covalent complex formation with heparin cofactor II on SDS-PAGE. TWO MORE TRAPS: PMID:2433788\'s only Tmax-like figure ("maximal plasma concentrations reached 2-3 h after injection") is UNFRACTIONATED HEPARIN\'s, not SP54\'s; and PMID:1690285\'s rabbit "approximately 1 h 24 min" is stated jointly for "dextran sulfate and pentosan polysulfate ... these compounds", so it is not PPS-specific. PMID:1726041 is titled as the IV human PK study and HAS NO ABSTRACT IN PUBMED — full text is the unlock, and it is in AUTHORING_GAPS. Doses: oral 300/600/900 mg daily in the interstitial-cystitis RCT (PMID:11378052, 376 analysed) with the marketed regimen 100 mg three times daily; IV MTD 3 mg/kg/day in Kaposi sarcoma (PMID:7692072); IM and SC regimens from PMID:2422778. Mechanism reference PMID:9679938 (rabbit bladder permeability barrier).',
    refs: ['PMID:10192753', 'PMID:16278190', 'PMID:31287456', 'PMID:2436330', 'PMID:11378052', 'PMID:9679938'],
  },

  // ── 5. ITPP ─────────────────────────────────────────────────────────────
  {
    slug: 'itpp',
    name: 'ITPP',
    aliases: ['Myo-inositol trispyrophosphate', 'OXY111A', 'OXY-111A', 'myo-inositoltrispyrophosphate'],
    category: 'pharmacological',
    mechanism:
      'A small polyanion — myo-inositol bridged by three cyclic pyrophosphates — that enters red cells through the band 3 anion transporter and binds haemoglobin as an allosteric effector, LOWERING its oxygen affinity and shifting the dissociation curve to higher oxygen partial pressures. The intent is the opposite of most oncology drugs: not to kill tissue but to re-oxygenate it, normalising tumour vasculature so that subsequent chemotherapy works better, and in the endurance-doping market to increase oxygen offloading to muscle. Not a peptide despite the company it keeps on supplement lists.',
    routes: ['IV'],
    doses: { IV: { min: 3.23, max: 25.09, typical: 21.43, unit: 'g' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'uncharacterized',
      note: 'The phase Ib in 28 patients (PMID:34155211) lists PK among its secondary objectives — "secondary objectives include assessment of pharmacokinetics" — and publishes none of it in the abstract; the only numeric human result is the maximum tolerated dose. No half-life, Cmax, AUC, volume or clearance exists for this compound in any indexed abstract, in any species. The one animal report is a single horse and gives detection windows rather than parameters.',
    },
    mw_g_mol: 605.99,
    systems: ['immune-hematologic', 'cardiovascular'],
    notes:
      'PubChem CID 10439981 (C6H12O21P6), CAS 802590-64-3. Schneider 2021 (PMID:34155211), an open-label 3+3 dose escalation in 28 patients with hepatopancreatobiliary malignancy and colorectal liver metastases: "nine 8h-infusions of ITPP over three weeks across eight dose levels (1\'866-14\'500 mg/m2/dose)" and "The maximum tolerated dose is 12,390 mg/m2". DOSES ARE BSA-CONVERTED AND THAT IS A WORKAROUND, NOT A MEASUREMENT: DoseUnit has no per-square-metre member and the solver never scales a dose by body size, so the stored figures are the published mg/m2 multiplied by a conventional 1.73 m2 — min 1866 -> 3.23 g, max 14500 -> 25.09 g, typical at the MTD 12390 -> 21.43 g. This is the same schema gap as the eleven per-kilogram records in AUTHORING_GAPS, one dimension over. THE ROUTE IS AN 8-HOUR INFUSION, which is a zero-order input the record cannot express either, since zo_dur_hr needs a curve to attach to and this record has none. ANIMAL DATA, LABELLED AND NOT STORED: PMID:23733541 is a doping-control study in a single Standardbred mare given 200 mg IV, reporting that "ITPP was detected in post administration plasma samples up to 6 hours. The peak concentration was detected at 5 min post administration" with urine detectable to 24 h — detection windows and a Tmax, no half-life, n of one, and a species the schema would need source_species for if any of it were storable. In-vitro constants exist and are not PK: maximum intracellular concentration 5.5e-3 M and a dissociation constant of 1.72e-5 M for binding to RBC ghosts (PMID:21086482). Mechanism references PMID:15745806 (oxy-haemoglobin dissociation curves "significantly shifted towards higher values of oxygen partial pressures") and PMID:21086482 (band 3 as the entry route, shown by DIDS and NAP-taurine inhibition). The protocol paper is PMID:27756258.',
    refs: ['PMID:34155211', 'PMID:15745806', 'PMID:21086482', 'PMID:23733541', 'PMID:27756258'],
  },

  // ── 6. CagriSema — the fixed-dose combination ───────────────────────────
  {
    slug: 'cagrisema',
    name: 'CagriSema',
    aliases: ['cagrilintide-semaglutide', 'cagrilintide/semaglutide'],
    category: 'peptide',
    mechanism:
      'Fixed-dose co-formulation of cagrilintide and semaglutide in equal masses, delivered once weekly from a dual-chamber pen as a single subcutaneous injection. The rationale is two non-overlapping satiety mechanisms in one product: amylin-receptor agonism acting through the area postrema and slowing gastric emptying, plus GLP-1 receptor agonism. Phase 3 (REDEFINE 1 and 2, REDEFINE 5, REIMAGINE 2) tests it against each component alone, which is the comparison that matters for a combination.',
    routes: ['SC'],
    doses: { SC: { min: 2, max: 4.8, typical: 4.8, unit: 'mg' } },
    half_life_hr: {},
    composition: {
      standardization: 'Fixed 1:1 by mass — cagrilintide 2.4 mg + semaglutide 2.4 mg weekly; REIMAGINE 2 also used 1.0 mg of each.',
      constituents: [
        { slug: 'cagrilintide', mg_per_g_extract: 500, note: 'Half the mass — the amylin analogue.' },
        { slug: 'semaglutide', mg_per_g_extract: 500, note: 'Half the mass — the GLP-1 analogue.' },
      ],
    },
    pk_unauthored: {
      reason: 'mixture',
      note: 'Two peptides dosed as one product, so no single plasma species describes it — the solver expands a logged dose into its constituents instead. No indexed abstract publishes any PK for the co-formulation: 41 CagriSema abstracts were screened for half-life, Cmax, AUC, Tmax, clearance and volume, with zero matches. The one human PK dataset for these two peptides together (PMID:33894838) studied CONCOMITANT administration of two separate injections, which is not this product.',
    },
    systems: ['endocrine', 'digestive', 'nervous', 'cardiovascular'],
    notes:
      'COMPOSITION IS VERBATIM, twice over: "a fixed-dose combination of cagrilintide 2.4 mg and semaglutide 2.4 mg" (PMID:42009015) and REIMAGINE 2\'s arm list naming "cagrilintide-semaglutide [2.4 mg each]" and "cagrilintide 1.0 mg plus semaglutide 1.0 mg (hereafter cagrilintide-semaglutide [1.0 mg each])" (PMID:42251859), which is where the 2 mg lower bound of the dose range comes from. ONE INJECTION, NOT TWO, and this is the distinction the record exists to hold: PMID:42366647 describes "the CagriSema dual-chamber pen, a single-dose, single-use, pre-filled autoinjector for once-weekly subcutaneous administration of a fixed-dose combination of cagrilintide and semaglutide". The phase 1b that produced the only human PK for the pair (PMID:33894838) was explicitly "concomitant administration" of separate injections, and REDEFINE 1 still titles it coadministration — so that trial\'s exposure numbers must NOT be attributed to the pen. WHAT THE EXPANSION ACTUALLY DOES: semaglutide carries authored PK, cagrilintide now carries a half-life and a ka, so a logged 4.8 mg dose splits into 2.4 mg of each and renders two curves. That is the honest behaviour and it is better than a single invented curve, but note the cagrilintide half is only as good as its own record, whose volume is defaulted. Phase 3 references PMID:40544433 (REDEFINE 1, NEJM, NCT05567796), PMID:40544432 (REDEFINE 2, NCT05394519), PMID:42009015 (REDEFINE 5, east Asian population, NCT05813925) and PMID:42251859 (REIMAGINE 2, NCT06065540).',
    refs: ['PMID:42009015', 'PMID:42251859', 'PMID:42366647', 'PMID:40544433', 'PMID:40544432', 'PMID:33894838'],
  },

  // ── 7. FOXO4-DRI ────────────────────────────────────────────────────────
  {
    slug: 'foxo4-dri',
    name: 'FOXO4-DRI',
    aliases: ['FOXO4 D-retro-inverso peptide', 'FOXO4-p53 interfering peptide', 'Proxofim'],
    category: 'peptide',
    mechanism:
      'A retro-inverso peptide — D-amino acids in reversed sequence, which resists proteolysis while presenting a similar side-chain surface — designed to disrupt the interaction between FOXO4 and p53. Senescent cells depend on that interaction to sequester p53 in the nucleus and so avoid apoptosis; blocking it causes p53 nuclear exclusion and cell-intrinsic apoptosis SELECTIVELY in senescent cells, leaving proliferating cells alone. That selectivity is the design, and it makes this the archetype of the peptide senolytics.',
    routes: ['SC'],
    doses: {},
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'No pharmacokinetic value exists for this peptide in any species: all 19 indexed records were fetched and screened for mg/kg, half-life and pharmacokinetic terms, with zero hits, and targeted searches for murine PK and half-life return nothing. A 2026 review says it "has shown senolytic activity in preclinical models ... but has not been clinically validated" and translation "requires ... pharmacokinetic and delivery studies". No human study is indexed; human work is on cultured cells.',
    },
    mw_g_mol: 5358,
    systems: ['renal', 'integumentary'],
    notes:
      'PubChem CID 167312269 (C228H388N86O64), CAS 2460055-10-9. NO SEQUENCE IS STORED because no indexed abstract prints one and PubChem returns only formula and mass; the retro-inverso construction is described in the primary paper rather than specified residue by residue in any abstract. Baar 2017 (PMID:28340339, Cell) is the primary: "we identify FOXO4 as a pivot in senescent cell viability. We designed a FOXO4 peptide that perturbs the FOXO4 interaction with p53. In senescent cells, this selectively causes p53 nuclear exclusion and cell-intrinsic apoptosis." SYSTEMS COME FROM THAT ABSTRACT\'S OWN OUTCOMES rather than from the mechanism\'s generality: "it restored fitness, fur density, and renal function in both fast aging XpdTTD/TTD and naturally aged mice". THE DOSING REGIMEN IS NOT IN ANY ABSTRACT — no mg/kg, no route, no schedule. It lives in the paper\'s STAR Methods, which E-utilities does not return, so full text is the unlock and the dose block is deliberately empty rather than filled from a vendor page. ROUTE CAVEAT: all published administration is intraperitoneal, which `Route` cannot express; SC is listed because that is how the research-chemical market sells it, and no PK depends on the choice since none exists. "PROXOFIM" IS CARRIED AS AN ALIAS FOR FINDABILITY ONLY — the name appears in no PubMed record and PubChem returns nothing for it, so it must not be cited to a source. TRAP: PMID:42024235 mentions "preliminary human studies involving FOXO4-axis modulators, such as high-dose fisetin", which is fisetin and not this peptide; that sentence is the likeliest source of a claim that FOXO4-DRI has human data. Mechanism corroboration PMID:40593617 (NMR: "the disordered FOXO4-DRI binds to the disordered p53TAD2").',
    refs: ['PMID:28340339', 'PMID:40593617', 'PMID:42510573'],
  },

  // ── 8. SLU-PP-332 ───────────────────────────────────────────────────────
  {
    slug: 'slu-pp-332',
    name: 'SLU-PP-332',
    aliases: ['SR9861', 'ERR pan-Agonist 332'],
    category: 'pharmacological',
    mechanism:
      'Synthetic acylhydrazone agonist of the estrogen-related receptors, a family of orphan nuclear receptors that sit upstream of mitochondrial biogenesis and oxidative metabolism. It activates all three (ERR-alpha, -beta, -gamma) with the greatest potency at ERR-alpha, reproducing part of the transcriptional program exercise induces — which is why it is described as an exercise mimetic, and why its published effects are aerobic performance, mitochondrial function and metabolic phenotype in obese and aged mice rather than anything receptor-selective.',
    routes: ['PO'],
    doses: {},
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'No PK value in any species and no human data: `pan-ERR agonist clinical trial` returns nothing, and the closest human work treats primary myoblasts in vitro. All ten indexed abstracts were screened and none states a mg/kg dose or a kinetic parameter. Its own literature says the compound "improves aerobic performance in mice but lacks oral bioavailability" (PMID:41421047) and is administered intraperitoneally, so the route this is sold for is the one route the literature says does not work.',
    },
    mw_g_mol: 290.3,
    systems: ['musculoskeletal', 'endocrine'],
    notes:
      'PubChem CID 5338394 (C18H14N2O2), CAS 303760-60-3 — 4-hydroxy-N\'-[(E)-naphthalen-2-ylmethylidene]benzohydrazide. A small molecule, not a peptide, despite the company it keeps on peptide vendor lists. NO EC50 IS STORED: `SLU-PP-332 EC50` returns zero hits and the only potency statement in any abstract is qualitative — it "targets all three ERRs but has the highest potency for ERRalpha" (PMID:36988910). Authoring a receptor_occupancy row would need a number, so none is authored. NO DOSE: none of the ten abstracts states mg/kg; what they state is species and schedule, 21-month-old mice for 8 weeks (PMID:37717940), diet-induced-obese and ob/ob mice (PMID:37739806), a pressure-overload heart-failure model (PMID:37961903). THE ROUTE IS THE FINDING. PMID:41421047 says the compound "improves aerobic performance in mice but lacks oral bioavailability" and is given "when administered intraperitoneally"; PO is listed because that is the form sold, and the record says the literature contradicts it rather than quietly modelling an absorbed oral dose. PMID:36988910 offers only "has sufficient pharmacokinetic properties to be used as an in vivo chemical tool", which is an assertion with no parameter. REGISTRY HAZARD: SLU-PP-915 is a DIFFERENT compound from the same programme that IS orally bioavailable; that property must not migrate onto this record, which states the opposite. Human liver S9 and microsome metabolite identifications exist (PMID:41688415 reporting 22 metabolites, PMID:41588687 reporting 9 — the two labs disagree on the count) and are metabolite IDs, not kinetics.',
    refs: ['PMID:36988910', 'PMID:37739806', 'PMID:41421047', 'PMID:37717940'],
  },

  // ── 9. P021 ─────────────────────────────────────────────────────────────
  {
    slug: 'p021',
    name: 'P021',
    aliases: ['P21', 'Peptide 021', 'P-21'],
    category: 'peptide',
    mechanism:
      'A ciliary-neurotrophic-factor peptide mimetic: the most active region of CNTF was located by epitope mapping, and an adamantylated glycine was added at the C-terminus to raise blood-brain-barrier permeability and blunt exopeptidase degradation. It enhances dentate-gyrus neurogenesis by inhibiting leukemia inhibitory factor signalling and increasing BDNF expression, and through that BDNF increase it lowers GSK-3-beta activity, which is the major tau kinase — so one compound acts on both the neurogenic and the tau arms of Alzheimer pathology. All efficacy is preclinical, largely in 3xTg-AD mice and aged rats fed the compound in the diet.',
    routes: ['PO'],
    doses: {},
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'No numeric PK and no numeric dose appear in any of the 15 indexed abstracts, which were screened for mg/kg, nmol, half-life, plasma, bioavailability, Cmax and AUC with zero hits — the figures are in full texts only. The single PK-adjacent sentence is an assertion by the originating group: "P021 is a small molecular weight, BBB permeable compound with suitable pharmacokinetics for oral administration" (PMID:27400746), which names no parameter. No human study is indexed.',
    },
    mw_g_mol: 578.7,
    systems: ['nervous'],
    notes:
      'PubChem CID 56599151 (C27H42N6O8), CAS 1246751-68-7. Sequence Ac-DGGL(A)G-NH2, where (A) is the adamantylated glycine; the same group writes it Ac-DGGLAG-NH2 elsewhere, and PMID:28655344 calls it a "tetra-peptide" while printing six residues — RECORD THE SEQUENCE, NOT THE RESIDUE COUNT. Derivation verbatim from PMID:28655344: "Peptide 021 (P021) is a neurotrophic/neurogenic tetra-peptide that was derived from the most active region of the ciliary neurotrophic factor (CNTF) by epitope mapping. Admantylated glycine was added to its C-terminal to increase its blood-brain barrier permeability and decrease its degradation by exopeptidases to make it druggable." Brain penetration is asserted with evidence but no number (PMID:26401692, rat): "we show that P021 is blood-brain-barrier-permeable, and chronic oral treatment with this compound can reduce the brain level of total tau in the aged rats", plus "P021 does not induce any detectable immune reaction in rats". DOSING IS ROUTE AND DURATION ONLY across the whole literature — "treated for 12months with P021 or vehicle diet starting at 9-10months of age" (PMID:25046994), "administered in the diet at 3 months ... continued until 21 months" (PMID:28655344), "from prenatal day 8 to postnatal day 21 with a custom-made diet containing P021" (PMID:32854771) — so the dose block is empty rather than guessed. NAMING TRAP: PMID:27885969 is a Critical Care supplement where "P021" is an ABSTRACT NUMBER, which is why a PK search on the token returns one more hit than it should.',
    refs: ['PMID:27400746', 'PMID:28655344', 'PMID:26401692', 'PMID:25046994'],
  },

  // ── 10. Adamax — a record whose content is an absence ───────────────────
  {
    slug: 'adamax',
    name: 'Adamax',
    aliases: ['adamantyl-Semax', 'Ad-Semax'],
    category: 'peptide',
    mechanism:
      'Sold as Semax (the ACTH(4-7) fragment Met-Glu-His-Phe with a C-terminal Pro-Gly-Pro) carrying an adamantane substituent, by analogy with P021 where an adamantyl group was added to a neurotrophic peptide to improve brain penetration and resist exopeptidases. THAT DESCRIPTION IS A VENDOR CLAIM AND NOTHING MORE: no indexed paper describes an adamantane-modified Semax, so neither the structure nor any pharmacology attributed to it has a source. Semax itself is well published and is a separate record; anything read across from it is an assumption about a molecule whose identity is unverified.',
    routes: ['IN', 'SC'],
    doses: {},
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'Nothing about this compound is indexed — not PK, not pharmacology, not a structure. Nine searches pairing adamantane with Semax return ZERO each (adamantyl semax, adamantane semax, semax analog adamantane, Semax adamantyl derivative, and five more listed in notes) while `Semax` alone returns 232, so this is a specific absence of the analogue rather than a failed search. PubChem has no record for the name.',
    },
    systems: ['nervous'],
    interactions: [
      {
        slug: 'semax',
        name: 'Semax',
        level: 'caution',
        note: 'Adamax is sold as a modified Semax, so stacking the two would double the same claimed pharmacology. Note the asymmetry in what is known: Semax has 232 indexed papers and a clinical history in Russia, while the adamantane analogue has none, so nothing about Semax\'s dose or effect profile transfers with any confidence.',
      },
    ],
    notes:
      'NO mw_g_mol, DELIBERATELY. The parent Semax is PubChem CID 9811102 (C37H51N9O10S, 813.9) and its SMILES confirms Met-Glu-His-Phe-Pro-Gly-Pro, but the adamantane modification is uncorroborated by any indexed source, so there is no verifiable formula to take a mass from. Storing one — Semax\'s, or Semax plus an adamantyl increment — would give a vendor claim the appearance of a measurement, and mw_g_mol feeds real arithmetic elsewhere in this catalog. THE NINE ZERO-HIT SEARCHES, in full, so the next pass does not repeat them: adamantyl semax, adamantane semax, semax analog adamantane, Semax adamantyl derivative, Met-Glu-His-Phe-Pro-Gly-Pro adamantane, Pro-Gly-Pro adamantane, adamantylated peptide nootropic, ACTH(4-10) adamantane, adamantane ACTH fragment peptide — all zero, against 232 for `Semax`, 189 for `Semax derivatives` and 186 for `Semax analogues`, none of which overlap the adamantane set. NAMING TRAP, THE STRONGEST ON THIS LIST: all 39 PubMed hits for "Adamax" are the Adamax gradient-descent optimizer from machine learning (verified: PMID:42236259 "Adamax optimization for feature selection", PMID:42151246 "RMSPROP, and ADAMAX", PMID:41803168 "Adam, SGD, Adamax, AdamW, and Adadelta"), so any automated harvest on this token returns only ML papers and a citation-count heuristic would rate this the best-evidenced compound in the batch. WHY THE RECORD EXISTS AT ALL rather than being logged as a skip: the substance is sold and taken, and a catalog that omits it leaves a user who logs it with nothing, while a record that states plainly that no literature exists is itself the useful fact. The dose block is empty for the same reason it is empty on FOXO4-DRI — vendor label practice is not a studied regimen, and here there is not even a structure to anchor it to. Revisit if any indexed paper ever describes an adamantylated ACTH fragment.',
    refs: [],
  },

  // ── 11. Ovagen — the record contradicts the product ─────────────────────
  {
    slug: 'ovagen',
    name: 'Ovagen',
    aliases: ['Glu-Asp-Leu', 'EDL', 'EDL peptide', 'T-35'],
    category: 'peptide',
    mechanism:
      'Synthetic tripeptide Glu-Asp-Leu from the Khavinson short-peptide programme, where each sequence is assigned to a tissue and proposed to act by entering the nucleus and binding DNA to regulate gene expression. THE TISSUE ASSIGNMENT HERE IS DISPUTED BY THE LITERATURE: the peptide is marketed as a LIVER bioregulator, and every indexed study of it is RENAL — nephroprotection against gentamicin nephropathy and ischaemia/reperfusion injury in rats, with matrix metalloproteinase MMP-14 named as its target. The Khavinson liver preparation is a different thing entirely, the polypeptide complex Hepalin, which no source equates with this tripeptide.',
    routes: ['PO', 'SC'],
    doses: {},
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'No pharmacokinetics in any species — `Glu-Asp-Leu pharmacokinetics` returns zero — and no indexed abstract states a dose, a route or a schedule for the peptide. The in-vivo work reports fold-changes without the dose that produced them: "Administration of PKC, peptides AED and EDL increased diuresis by 1,2-1,4 times" (PMID:30607912). All of it is rat.',
    },
    mw_g_mol: 375.37,
    systems: ['renal'],
    notes:
      'PubChem CID 444128 (C15H25N3O8); Khavinson internal code T-35 (PMID:26033601, "Short peptides T-31 (AED) and T-35 (EDL)"). TWO FINDINGS THAT CONTRADICT THE VENDOR FRAMING, both worth keeping because the product is sold on the liver claim. (1) THE TISSUE IS WRONG. Every indexed EDL study is renal: PMID:28744634 verbatim, "EDL peptide produced a nephroprotective effect on experimental models gentamycin-induced nephropathy and ischemia/reperfusion kidney injury in rats", and PMID:24958378 names the target, "gelatinase MMP-14 is the target of T-35 peptide". The liver searches return nothing — `EDL tripeptide liver`, `Glu-Asp-Leu hepatocyte` and `hepatoprotective tripeptide Khavinson` are all zero hits. The Khavinson liver cytomedin is HEPALIN, listed as a separate preparation among the organ complexes (PMID:12096446, PMID:11213728) and never equated with this sequence. So systems[] says renal, and the marketed indication is recorded as vendor-asserted. (2) THE NAME COLLIDES WITH A VETERINARY DRUG. In PubMed, "Ovagen" is an ovine FSH superovulation preparation for sheep and goats, with real doses attached — "4.4 mg of Ovagen (n = 6) on day 3 of the estrous cycle" (PMID:20399062), "(Ovagen(TM), 0.44 iu/ml)" (PMID:18325004), also PMID:20036087, PMID:17126896, PMID:12785682. THOSE FSH DOSES MUST NEVER BE IMPORTED HERE. `Ovagen Khavinson` and `EDL Ovagen` both return zero, so nothing links the brand name to this sequence in the indexed literature either. TWO MORE SUBSTRING HAZARDS: "EDL" matches extensor digitorum longus muscle (43 hits, e.g. PMID:33540821), and "Glu-Asp-Leu" is contained in "Ala-Glu-Asp-Leu" (AEDL, bronchogen), a DIFFERENT tetrapeptide assigned to lung (PMID:22117547). MECHANISM: two docking papers from the same group DISAGREE about the DNA site — PMID:27909961 puts "peptides AEDL and EDL to ctcc sequence" while PMID:25946838 has AED and EDL forming "most energetically favorable complexes with d(ATATATATAT)2 sequences in minor groove of DNA". Both are recorded and neither is asserted; both are in-silico. The class claim that these peptides enter the nucleus and bind DNA has experimental support (PMID:22117547, FITC-labelled peptides imaged in HeLa nuclei) but NOT FOR THIS SEQUENCE — the peptides actually imaged were epithalon, pinealon, testagen and bronchogen, so the claim reaches EDL only by extrapolation.',
    refs: ['PMID:28744634', 'PMID:24958378', 'PMID:26033601', 'PMID:27909961', 'PMID:25946838', 'PMID:30607912'],
  },

  // ── 12. Cartalax ────────────────────────────────────────────────────────
  {
    slug: 'cartalax',
    name: 'Cartalax',
    aliases: ['Kartalax', 'Ala-Glu-Asp', 'AED', 'AED peptide', 'T-31'],
    category: 'peptide',
    mechanism:
      'Synthetic tripeptide Ala-Glu-Asp from the Khavinson short-peptide programme, assigned to cartilage and studied against the ageing-associated secretory phenotype of chondrocytes. In that phenotype the cells raise synthesis of p16, p21, p53, TNF-alpha and IL-1-alpha and lower sirtuin-1; the peptide is reported to normalise those molecules, which is the proposed basis for peptide chondroprotection in osteoarthritis. Unlike the other entries in this family the tissue attribution is corroborated, by both the cartilage cell work and the review that names the brand beside the sequence.',
    routes: ['PO', 'SC'],
    doses: {},
    half_life_hr: {},
    pk_unauthored: {
      reason: 'uncharacterized',
      note: 'Given to people — a review reports the tripeptide has shown efficacy "in animal models of OA and oral administration in patients with OA of older age groups" (PMID:37782637) — with no dose, n or trial identifier, and no kinetic parameter anywhere. The only number published for the sequence is in vitro: "AED peptide at the concentration of 200 ng/ml activates gene expression and protein synthesis during aging of MSCs" (PMID:37782646).',
    },
    mw_g_mol: 333.29,
    systems: ['musculoskeletal'],
    notes:
      'PubChem CID 87815447 (C12H19N3O8), CAS 85806-95-7. THE IDENTITY VERIFIES TWICE, INDEPENDENTLY, which makes this the strongest of the four grey-market peptides in this batch: PubChem lists both "Cartalax" and "T-31 peptide" as synonyms of Ala-Glu-Asp, and PMID:37782637 carries brand, sequence, tissue and route in one sentence — "Sigumir, a polypeptide complex of cartilage and bone tissues of young animals, and the AED tripeptide (Kartalax) have shown high efficacy in animal models of OA and oral administration in patients with OA of older age groups." NOTE THE INDEXED SPELLING IS KARTALAX; `Cartalax` returns 6 hits and `Kartalax` 1, so both belong in aliases[]. The internal code is confirmed by PMID:26033601 ("Short peptides T-31 (AED) and T-35 (EDL)") and PMID:18306703 studies "T-31 substance" in an ovariectomy osteoporosis model in rats. PUBCHEM DATA-QUALITY CAVEAT: that CID\'s synonym list contains two entries wrong for the structure, "H-Asp-Glu-Asp-OH" and "alanyl-glutamyl-aspartic acid". Trust the formula and SMILES over them — Ala + Glu + Asp less two waters is C12H19N3O8 at 333.29, which is what is stored. MECHANISM verbatim from PMID:37356100: chondrocyte SASP "is characterized by an increase of the synthesis of p16, p21, p53 pro-apoptotic proteins, TNF-alpha, IL-1alpha pro-inflammatory cytokines and a decrease of Sirt1 synthesis. Peptides AED and CPC normalize the synthesis of molecules that form SASP of chondrocytes." Human-cell gene data in PMID:32399807 ("IGF1 gene expression levels ... being enhanced by 3.5-5.6 fold upon the addition of the peptides", at nanomolar concentrations). A NEGATIVE RESULT WORTH RECORDING: PMID:22238759 tested T-31 on aged thymocytes and found "Only AB-9 peptide exhibited a complex geroprotective effect" — i.e. negative for AED, so that paper is not supporting evidence. SEARCH TRAP: "AED" alone collides with antiepileptic drug. The DNA-binding class claim shares Ovagen\'s limitation: the peptides imaged entering nuclei in PMID:22117547 were epithalon, pinealon, testagen and bronchogen, not AED, so the mechanism reaches this sequence by extrapolation.',
    refs: ['PMID:37782637', 'PMID:37356100', 'PMID:25946838', 'PMID:26033601', 'PMID:32399807', 'PMID:37782646'],
  },

  // ── 13. Wolverine blend ─────────────────────────────────────────────────
  {
    slug: 'wolverine-blend',
    name: 'Wolverine Blend',
    aliases: ['Wolverine Stack', 'BPC-157 / TB-500 blend'],
    category: 'peptide',
    mechanism:
      'Market name for BPC-157 and TB-500 sold in one vial for injury recovery, the pairing being justified by two unrelated proposed mechanisms — VEGF upregulation and nitric-oxide pathway modulation for the pentadecapeptide, G-actin sequestration and cell migration for the thymosin fragment. The name is a nickname rather than an acronym, and the combination has essentially no evidence: the one controlled animal test of the pair found no additive benefit over either peptide alone.',
    routes: ['SC'],
    doses: {},
    half_life_hr: {},
    composition: {
      standardization: 'Vendor-defined. Research vendors state 1:1 by mass (10 mg + 10 mg, or 5 + 5, per vial); compounding pharmacies use 1:2.',
      constituents: [
        { slug: 'bpc-157', mg_per_g_extract: 500, note: 'Half the mass at the 1:1 ratio research vendors state.' },
        { slug: 'tb-500', mg_per_g_extract: 500, note: 'Half the mass. Note the vialled peptide is the 7-residue fragment, not full-length thymosin beta-4.' },
      ],
    },
    pk_unauthored: {
      reason: 'mixture',
      note: 'Two peptides in one vial, each with its own disposition and neither with any authored PK of its own, so no single plasma species describes the product. The ratio itself is vendor-defined rather than a specification: research vendors state 1:1 while compounding pharmacies use 1:2, so the composition below is what the market sells and not a property of the substance.',
    },
    systems: ['musculoskeletal'],
    notes:
      'COMPOSITION IS FROM VENDOR PAGES, NAMED AS SUCH, because there is no other source. The 1:1 split is stated consistently — royal-peptides.com "Each vial contains a total of 20 mg of research material: 10 mg BPC-157 and 10 mg TB-500", oathresearch.com "BPC-157 (5mg) and TB-500 (5mg) in a balanced 1:1 ratio, totaling 10mg", pspeptides.com "10mg BPC-157 + 10mg TB-500 (20mg vial) or 5mg + 5mg (10mg vial)", plus americanpeptides.us and prohealthsolutionsfl.com. A COMPOUNDED ROUTE DIVERGES: moonshotmp.com states "roughly 5mg BPC-157 and 10mg TB-500 per vial", i.e. 1:2, so a user\'s actual ratio depends on where it came from. THE DOSE BLOCK IS EMPTY ON PURPOSE. Every source states a VIAL TOTAL, not a per-injection amount; a vial is reconstituted and split across many doses, so storing 20 mg as a dose would overstate a single administration by an order of magnitude. EVIDENCE FOR THE COMBINATION, such as it is: PMID:42542926 is the only controlled test, a rat Achilles model with four arms including "combined BPC-157 + TB-500", administered intraperitoneally for four weeks at 10 and 60 micrograms/kg/day — a 1:6 ratio, not the vendor 1:1 — and its finding is negative, "Combined BPC-157 and TB-500 treatment did not confer additional benefits compared to either agent alone". PMID:34324435 is a retrospective chart review in which "The other 4 patients received a combination of 2 peptide injections of BPC 157 and TB4", uncontrolled, with "No specific tools ... used to measure their improvement" and separate injections rather than a blend. No indexed paper studies a branded blend or a vendor ratio, and "Wolverine" never appears in PubMed beside these peptides.',
    refs: ['PMID:42542926', 'PMID:34324435'],
  },

  // ── 14. KLOW blend ──────────────────────────────────────────────────────
  {
    slug: 'klow-blend',
    name: 'KLOW Blend',
    aliases: ['KLOW', 'KLOW Stack'],
    category: 'peptide',
    mechanism:
      'Market name for a four-peptide vial: GHK-Cu, BPC-157, TB-500 and KPV. It is the GLOW blend with KPV added, which is where the K comes from — the name is not a letter-by-letter acronym and L, O and W expand to nothing. The intended combination is tissue repair plus an anti-inflammatory tripeptide, and no indexed study tests any two of these four together except BPC-157 with TB-500.',
    routes: ['SC'],
    doses: {},
    half_life_hr: {},
    composition: {
      standardization: 'Vendor-defined 80 mg vial: GHK-Cu 50 mg + BPC-157 10 mg + TB-500 10 mg + KPV 10 mg.',
      constituents: [
        { slug: 'ghk-cu', mg_per_g_extract: 625, note: 'Five eighths of the mass — the copper tripeptide dominates the blend.' },
        { slug: 'bpc-157', mg_per_g_extract: 125, note: 'One eighth of the mass.' },
        { slug: 'tb-500', mg_per_g_extract: 125, note: 'One eighth of the mass.' },
        { slug: 'kpv', mg_per_g_extract: 125, note: 'One eighth of the mass — the letter K in the name.' },
      ],
    },
    pk_unauthored: {
      reason: 'mixture',
      note: 'Four peptides in one vial, none of which carries authored PK, so there is no single species to fit a curve to. The 50/10/10/10 split is what vendors state rather than a specification: explainer pages for the same product note that two suppliers can both sell an 80 mg KLOW with different splits, so the composition below describes the commonest offering and not the substance.',
    },
    systems: ['integumentary', 'musculoskeletal', 'digestive', 'immune-hematologic'],
    notes:
      'THE RATIO IS UNUSUALLY CONSISTENT ACROSS VENDORS — every page that states a split gives 50/10/10/10 in an 80 mg vial: biolongevitylabs.com "50 mg GHK-Cu, 10 mg BPC-157, 10 mg TB-500, and KPV 10 mg", verifiedpeptides.com, medicadepot.com, cenexalabs.com "Total Blend: 80mg per vial", alphaomegapeptide.com, profoundaminos.com. Two vendors name the four peptides without a split. That consistency is still not a specification: my-peptides.co.uk says "The name does not guarantee the ratio ... two suppliers can both sell \'KLOW 80mg\' with different splits". THE ACRONYM DOES NOT EXPAND, and this is worth recording because it looks like it should: no product page expands it, and the explainer consensus is that KLOW is GLOW with KPV prefixed — "KLOW is not a traditional acronym. Instead, the name comes from the popular three-peptide GLOW stack (GHK-Cu, BPC-157, and TB-500) with the fourth peptide, KPV, added to the beginning." So aliases carry the string itself and no expansion is invented for L, O or W. DOSE BLOCK EMPTY for the same reason as the other two blends: vendors state a vial total, never a per-injection dose. EVIDENCE FOR THE FOUR-WAY COMBINATION IS ZERO: a PubMed search for all four together returns nothing, `KPV AND BPC-157` returns one record that is not a combination study, and the names KLOW and GLOW never appear beside these peptides at all. ROUTE NOTE: GHK-Cu is also sold topically and its own record lists TD, but the blend is sold for injection, so SC is the only route here.',
    refs: ['PMID:42542926', 'PMID:34324435'],
  },

  // ── 15. GLOW blend ──────────────────────────────────────────────────────
  {
    slug: 'glow-blend',
    name: 'GLOW Blend',
    aliases: ['GLOW', 'GLOW Stack'],
    category: 'peptide',
    mechanism:
      'Market name for a three-peptide vial: GHK-Cu, BPC-157 and TB-500 — the KLOW blend without KPV. Marketed for skin and recovery, the G being read as GHK-Cu while L, O and W expand to nothing; vendors describe the name as a nickname for the cosmetic effect rather than an acronym. No indexed study tests the three-way combination.',
    routes: ['SC'],
    doses: {},
    half_life_hr: {},
    composition: {
      standardization: 'Vendor-defined 70 mg vial: GHK-Cu 50 mg + BPC-157 10 mg + TB-500 10 mg. A 90 mg variant uses 70/10/10.',
      constituents: [
        { slug: 'ghk-cu', mg_per_g_extract: 714.2857, note: 'Five sevenths of the mass at the modal 70 mg vial; a 90 mg variant raises this share.' },
        { slug: 'bpc-157', mg_per_g_extract: 142.8571, note: 'One seventh of the mass.' },
        { slug: 'tb-500', mg_per_g_extract: 142.8571, note: 'One seventh of the mass.' },
      ],
    },
    pk_unauthored: {
      reason: 'mixture',
      note: 'Three peptides in one vial, none with authored PK, so no single plasma species describes the product. The GHK-Cu share is the part that varies between vendors — 50 mg in the modal 70 mg vial, 70 mg in a 90 mg variant, 27 mg in a compounded 42 mg version — so the composition below is the commonest offering rather than a specification.',
    },
    systems: ['integumentary', 'musculoskeletal'],
    notes:
      'COMPOSITION FROM VENDOR PAGES. The modal 70 mg vial at 50/10/10 is stated by bioedgeresearchlabs.com ("BPC-157 (10mg) / TB-500 (10mg) / GHK-Cu (50mg) | Total: 70mg"), adaptpeptides.com, biolongevitylabs.com, peptide.partners, simplepeptide.com and medicadepot.com. TWO DOCUMENTED VARIANTS, which is why the standardization line names the vial: orosresearch.com sells "GHK-Cu 70mg, BPC-157 10mg, TB-500 (TB4) 10mg (90mg Blend)" and umbrellalabs.is offers both the 70 mg (50/10/10) and 90 mg (70/10/10) forms, while a clinic version at revolutionhealth.org is "BPC-157 (5mg) / TB-500 (10mg) / GHK-Cu (27mg)". So the BPC-157 and TB-500 masses are stable and the copper peptide is the variable. A DIFFERENT PRODUCT SHARES THE NAME, and it matters for the alias list: superpower.com describes a compounded "GLOW" containing "GHK-Cu ..., glutathione ..., and ascorbic acid (vitamin C)" with no BPC-157 or TB-500 in it, adding that the "exact composition ... vary by compounding pharmacy". A user logging GLOW may mean either, and the two share only one constituent. THE ACRONYM DOES NOT EXPAND: no page expands G-L-O-W, and vendors describe it as a nickname — goholistiq.com "We call it the Glow Stack because it\'s aimed at how you look, feel, and recover", adaptpeptides "The name \'GLOW\' reflects the visible improvements noted in skin regeneration research". Dose block empty: vial totals only, as with the other blends. No indexed paper studies the three-way combination; the only combination evidence for any subset is the BPC-157 plus TB-500 pair recorded on the Wolverine record, whose controlled rat test was negative.',
    refs: ['PMID:42542926', 'PMID:34324435'],
  },
];

/**
 * Patches to records that already exist.
 *
 * Eight of the seventy requested names DID resolve to a live record, but only
 * by a spelling `aliases[]` did not carry — and the app's search is a plain
 * lowercase ladder over name, slug and aliases, so a user typing the vendor
 * spelling found nothing. Those are alias additions, not new compounds, and
 * creating a record for any of them would have been a duplicate identity.
 *
 * Two are substantive. `mechano-growth-factor` carries an UNCITED half-life in
 * its mechanism prose and the number does not exist anywhere in the literature
 * — see the note. And two interaction edges are added reciprocally, matching
 * how this catalog already stores pairs (bpc-157 and tb-500 each list the
 * other).
 *
 * Every patch is guarded: it checks for its own effect first, so a re-run
 * changes nothing, and a patch whose target prose has DRIFTED reports itself
 * rather than failing silently.
 */
const MGF_OLD_SENTENCE = 'Very short plasma t½ (<10 min) — must be injected locally to matter.';
const MGF_NEW_SENTENCE =
  'No plasma half-life has ever been published for the E-domain peptide: the only sourced statement is qualitative, Goldspink 2001 (PMID:11915923) reporting that MGF "is not glycosylated, is smaller, and has a shorter half-life in the unbound state than the systemic liver type IGF-1". Local injection is the vendor rationale rather than a measured constraint.';

interface Patch {
  slug: string;
  what: string;
  /** True when the patch has already been applied. */
  done: (c: Compound) => boolean;
  apply: (c: Compound) => void;
}

const addAliases = (slug: string, aliases: string[], what: string): Patch => ({
  slug,
  what,
  done: (c) => aliases.every((a) => (c.aliases ?? []).includes(a)),
  apply: (c) => {
    c.aliases = [...(c.aliases ?? [])];
    for (const a of aliases) if (!c.aliases.includes(a)) c.aliases.push(a);
  },
});

const PATCHES: Patch[] = [
  // ── Vendor spellings the search could not reach ────────────────────────
  addAliases('tb-500', ['TB-500 Fragment'],
    'the fragment spelling — this record IS the 7-residue fragment, so a separate record would be a duplicate identity'),
  addAliases('nad-plus', ['NAD+'],
    'the ASCII spelling; the name uses a superscript plus, which no typed query matches'),
  addAliases('des-igf-1', ['IGF-1 DES'],
    'the word order vendors use'),
  addAliases('somatropin', ['HGH', 'HGH (Somatropin)'],
    'the common abbreviation; note aod-9604 already carries "HGH Frag 176-191 analog", which is a different molecule'),
  addAliases('mod-grf-1-29', ['Mod GRF 1-29', 'CJC-1295 no DAC'],
    'space-separated spellings. NOT "CJC-1295 (no DAC)": data-lint strips a TRAILING parenthetical before comparing identities, so that spelling would reduce to "CJC-1295" and raise a false identity collision against the DAC record'),
  addAliases('bpc-157', ['BPC-157 Stable', 'BPC-157 arginate'],
    'the arginate-salt product names. Alias, not a record: zero indexed abstracts mention an arginate or any salt form of this peptide, and "stable" in the primary literature means >24 h stability in human gastric juice, not a counter-ion'),
  addAliases('mechano-growth-factor', ['PEG-MGF', 'PEGylated mechano growth factor'],
    'the PEGylated product name. Alias, not a record: the only indexed abstract naming PEG-MGF lists it in passing among grey-market products and states nothing about what the PEGylation does'),

  // ── The uncited half-life ──────────────────────────────────────────────
  {
    slug: 'mechano-growth-factor',
    what: 'strike an UNCITED half-life from mechanism prose and replace it with the one sourced, qualitative statement that exists',
    done: (c) => !c.mechanism.includes(MGF_OLD_SENTENCE),
    apply: (c) => {
      c.mechanism = c.mechanism.replace(MGF_OLD_SENTENCE, MGF_NEW_SENTENCE);
      const add = [
        'PubChem has no entry for the PEGylated form. THE STRUCK NUMBER: this record\'s mechanism used to assert a plasma half-life under 10 minutes with no citation, and that number is not in the literature — `"mechano growth factor"[tiab] AND half-life` returns exactly one record, PMID:11915923, which is qualitative, and a further sweep of eleven MGF papers turned up no half-life sentence and no minute-scale value at all. Those eleven are deliberately NOT listed here: the sweep is a negative result reported by a search agent rather than something re-read value by value, and eleven bare identifiers in a note would read as a citation trail this record has not earned.',
        'PEG-MGF IS AN ALIAS, NOT A MOLECULE WITH ITS OWN DISPOSITION, on the evidence available: field-restricted searches (`"PEG-MGF"[tiab]`, `pegylated[tiab] AND "mechano growth factor"[tiab]`) return ONE record between them, PMID:42395176, a clinical-guidance review of grey-market performance products that names it in a bare parenthetical list and states no stability claim, no half-life, no species, no dose and no mechanism specific to the PEGylated form. MGF-Ct24E searches return nine records, none mentioning PEG.',
        'TWO TRAPS THAT WOULD PUT A HALF-LIFE ON THIS RECORD WRONGLY. PMID:28110155 reports a human half-life of 140-200 h for PEGylated rhIGF-I (RO5046013), which is FULL-LENGTH IGF-I and not the 24-residue E-domain peptide — almost certainly the origin of the vendor claim that PEG-MGF lasts days. And PMID:1281675 gives mouse half-lives for "recombinant mast cell growth factor (rMGF)", where MGF is SCF / kit ligand, a different protein sharing the abbreviation. Neither belongs here.',
        'What "stabilized" MGF means in the literature is biomaterials, never PEG: microencapsulation (PMID:24768406) and covalent grafting to modified poly(D,L-lactic acid) (PMID:22941771, PMID:23594073). Note also PMID:24253050, which failed to reproduce MGF activity at all and concludes that the results "call in to question whether there is a physiological role for MGF".',
      ].join(' ');
      c.notes = c.notes ? `${c.notes} ${add}` : add;
      c.refs = [...(c.refs ?? [])];
      for (const r of ['PMID:11915923', 'PMID:42395176', 'PMID:28110155']) {
        if (!c.refs.includes(r)) c.refs.push(r);
      }
    },
  },

  // ── Reciprocal interaction edges ───────────────────────────────────────
  {
    slug: 'melanotan-ii',
    what: 'the reciprocal edge to afamelanotide, the approved MC1R-selective analogue it is constantly confused with',
    done: (c) => (c.interactions ?? []).some((i) => i.slug === 'afamelanotide'),
    apply: (c) => {
      c.interactions = [
        ...(c.interactions ?? []),
        {
          slug: 'afamelanotide',
          name: 'Afamelanotide',
          level: 'caution',
          note: 'Melanotan I. Routinely mis-sold as this compound and vice versa, and the difference matters: afamelanotide is MC1R-SELECTIVE and EMA-approved as a 16 mg implant, while MT-II is non-selective across MC1R/MC3R/MC4R, which is where the appetite, sexual-response and priapism effects come from. Do not stack — the shared MC1R activity is additive.',
        },
      ];
    },
  },
  {
    slug: 'semaglutide',
    what: 'the reciprocal edge to cagrilintide, the amylin analogue it is co-formulated with as CagriSema',
    done: (c) => (c.interactions ?? []).some((i) => i.slug === 'cagrilintide'),
    apply: (c) => {
      c.interactions = [
        ...(c.interactions ?? []),
        {
          slug: 'cagrilintide',
          name: 'Cagrilintide',
          level: 'synergistic',
          note: 'Co-formulated with this drug as CagriSema and co-administered in the phase 1b that produced cagrilintide\'s only human PK. Amylin and GLP-1 agonism are distinct satiety mechanisms and weight loss is greater than with semaglutide alone. Directional PK finding, verbatim: cagrilintide exposure "did not affect semaglutide exposure or elimination" (PMID:33894838); the converse was not tested.',
        },
      ];
    },
  },
];

// ── Loader caps, asserted before anything is written ──────────────────────
// The Zod loader silently REJECTS a record whose note overruns, and the failure
// surfaces at app boot rather than here. Cheaper to fail loudly now.
const CAPS: Array<[string, number, (c: Compound) => string | undefined]> = [
  ['pk_unauthored.note', 500, (c) => c.pk_unauthored?.note],
  ['composition.standardization', 200, (c) => c.composition?.standardization],
];
const violations: string[] = [];
for (const c of NEW_COMPOUNDS) {
  for (const [field, cap, get] of CAPS) {
    const v = get(c);
    if (v != null && v.length > cap) violations.push(`${c.slug}.${field} is ${v.length} chars, cap ${cap}`);
  }
  for (const cs of c.composition?.constituents ?? []) {
    if (cs.note && cs.note.length > 300) violations.push(`${c.slug}.composition[${cs.slug}].note is ${cs.note.length} chars, cap 300`);
  }
  for (const i of c.interactions ?? []) {
    if (i.note.length > 500) violations.push(`${c.slug}.interactions[${i.slug}].note is ${i.note.length} chars, cap 500`);
  }
  if (!c.systems.length) violations.push(`${c.slug} has no systems[] — data-lint errors on this`);
}
if (violations.length) {
  console.error('ABORTED — loader caps would reject these:\n  ' + violations.join('\n  '));
  process.exit(1);
}

for (const path of TARGETS) {
  if (!existsSync(path)) {
    console.log(`skip (absent): ${path}`);
    continue;
  }
  const data = JSON.parse(readFileSync(path, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map((c) => [c.slug, c]));
  const live = new Set(data.map((c) => c.slug));
  for (const c of data) for (const s of (c.retired_slugs as string[] | undefined) ?? []) live.add(s);

  const added: string[] = [];
  const skipped: string[] = [];
  for (const c of NEW_COMPOUNDS) {
    if (live.has(c.slug)) {
      skipped.push(c.slug);
      continue;
    }
    data.push(c);
    live.add(c.slug);
    bySlug.set(c.slug, c);
    added.push(c.slug);
  }

  const patched: string[] = [];
  const alreadyPatched: string[] = [];
  const missing: string[] = [];
  for (const p of PATCHES) {
    const target = bySlug.get(p.slug);
    if (!target) {
      missing.push(`${p.slug} (absent)`);
      continue;
    }
    if (p.done(target)) {
      alreadyPatched.push(p.slug);
      continue;
    }
    p.apply(target);
    patched.push(`${p.slug}: ${p.what}`);
  }

  // Every constituent a composition names must exist, or the solver expands a
  // dose into a slug nothing resolves. Checked after the additions so the
  // blends can reference cagrilintide, which this same run creates.
  const dangling: string[] = [];
  for (const c of NEW_COMPOUNDS) {
    for (const cs of c.composition?.constituents ?? []) {
      if (!live.has(cs.slug)) dangling.push(`${c.slug} -> ${cs.slug}`);
    }
    for (const i of c.interactions ?? []) {
      if (!live.has(i.slug)) dangling.push(`${c.slug} -> ${i.slug} (interaction)`);
    }
  }
  if (dangling.length) {
    console.error(`ABORTED — composition/interaction targets missing in ${path}:\n  ${dangling.join('\n  ')}`);
    process.exit(1);
  }

  if (added.length || patched.length) writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n${path}`);
  console.log(`  added ${added.length}: ${added.join(', ') || '(none)'}`);
  if (skipped.length) console.log(`  skipped ${skipped.length} already present: ${skipped.join(', ')}`);
  console.log(`  patched ${patched.length}${patched.length ? ':' : ''}`);
  for (const p of patched) console.log(`    - ${p}`);
  if (alreadyPatched.length) console.log(`  patches already applied: ${alreadyPatched.join(', ')}`);
  if (missing.length) console.log(`  PATCH TARGETS MISSING: ${missing.join(', ')}`);
  console.log(`  catalog now ${data.length} compounds`);
}
