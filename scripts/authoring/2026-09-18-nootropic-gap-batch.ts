/**
 * 2026-09-18-nootropic-gap-batch.ts
 *
 * Nine new compounds closing the nootropic white space. The trigger was one
 * request — nefiracetam — but the class turned out to be the right unit of
 * work: the catalog already carried nine racetams, the Semax/Selank peptides,
 * the cholinergics and the classic vasoactives, so the gaps left were a short,
 * enumerable list rather than a wave. Every candidate below was checked against
 * the live registry (including `aliases[]` and `retired_slugs[]`, so an entry
 * filed under a trade name could not read as missing) and then against NCBI
 * E-utilities for an indexed abstract that STATES a parameter.
 *
 * Each PMID resolves and every stored number is abstract-VERBATIM for the named
 * compound. MWs are PubChem (CID in each `notes`). Where the literature gives
 * only a range, only a paraphrase, or a corrupted string, the field is OMITTED
 * and logged in AUTHORING_GAPS.md (2026-09-18 section) — see especially
 * tolcapone, whose volume and clearance are mangled in PubMed's own record.
 *
 * ── Authored PK (5) ───────────────────────────────────────────────────────
 *
 *   nefiracetam    PO t½ 3.9 h + ka back-derived to the verbatim 1.6 h Tmax
 *                  (PMID:8484264). V/F DELIBERATELY NOT STORED — see below.
 *   tolcapone      PO F 0.60 + t½ 1.8 h + lag 0.5 h (PMID:9754991), all three
 *                  verbatim. V and CL are UNREADABLE in the indexed abstract.
 *   sarcosine      PO t½ ~1 h (PMID:25841105). Tmax is a range, so no ka.
 *   physostigmine  IV t½ 0.5 h; TD F 0.36 as a ZERO-ORDER 18 h input after a
 *                  4 h lag (PMID:7756100). Oral F 3% is verbatim but PO is not
 *                  authored — see note on the record.
 *   meldonium      IV t½ 6.46 h at the 500 mg arm (PMID:20116348). PO is a
 *                  declared dangling route: no indexed oral PK exists.
 *
 * ── Stubs, pk_unauthored with a reason (4) ────────────────────────────────
 *
 *   nicergoline          `uncharacterized` — marketed for dementia for 50 years,
 *                        and the only indexed PK is METABOLITE Cmax/AUC split by
 *                        CYP2D6 phenotype (PMID:8971425). Nothing states a
 *                        parent parameter.
 *   picamilon            `research-only`. The honest mechanism here is a
 *                        NEGATIVE result: the FDA screened it against 50 targets
 *                        and it bound none of them (PMID:36668678).
 *   pyritinol            `uncharacterized` — the only human disposition study is
 *                        a 1969 German ³⁵S abstract with no values (PMID:5819373).
 *   7,8-dihydroxyflavone `research-only`. TrkB agonist; PK is murine only
 *                        (PMID:39881861). No human exposure data.
 *
 * ── THE ONE JUDGEMENT CALL WORTH READING: nefiracetam's volume ────────────
 *
 * A V/F IS derivable here, from point values in a single abstract: Cmax 16.3
 * nmol/ml after 200 mg, Tmax 1.6 h, t½ 3.9 h (PMID:8484264). At MW 246.30 that
 * is 4.015 mg/L, so F·D/V = 4.015 · e^(0.17773·1.6) = 5.336 mg/L and V/F =
 * 37.5 L. It even cross-checks against a DIFFERENT paper: ke·V/F = 6.66 L/h =
 * 111 mL/min, inside the 94.4–140.3 mL/min apparent clearance range of
 * PMID:1360528.
 *
 * It is still not stored, for two reasons that compound.
 *
 * First, 37.5 L is 0.536 L/kg — within 7% of `resolvePk`'s own 0.5 L/kg small-
 * molecule default. The 2026-09-08 defaulted-volume sweep deleted 23 rows for
 * being the default wearing a citation; authoring a number this close to it,
 * on a brand-new record, re-creates that exact artefact from the other end.
 *
 * Second, the derived quantity is V/F and the solver wants the PAIR. F is not
 * published for nefiracetam — no intravenous arm exists — so storing V_L: 37.5
 * would silently be read against the default F of 0.9, or would force an F of 1
 * that the compound page would render as "100% bioavailable", which is a claim
 * the literature does not make. That is precisely the laundering that ccb1b42
 * and a4cb428 were written against.
 *
 * Omitting both costs almost nothing and asserts nothing: the defaults give
 * F·D/V = 0.9·200/35 = 5.14 mg/L against the observed 5.34, a 4% difference,
 * and `pk.defaulted-volume` now counts the record as the open gap it is. The
 * derivation is preserved in the record's `notes` and in AUTHORING_GAPS.md so
 * the next pass starts from it rather than redoing it.
 *
 * ── Surveyed and NOT added (logged in AUTHORING_GAPS.md) ──────────────────
 *   piribedil, ergoloid mesylates / dihydroergotoxine, uridine monophosphate,
 *   latrepirdine, propentofylline, D-serine, oroxylin A, Polygala tenuifolia,
 *   Cistanche, Celastrus paniculatus, carnosic acid, rolipram, seletracetam,
 *   nebracetam, cyclazodone, flmodafinil, amantadine. Each row in the gaps file
 *   records what was searched and what would unlock it.
 *
 * Run:  pnpm tsx scripts/authoring/2026-09-18-nootropic-gap-batch.ts
 * Idempotent: a slug already present is skipped, so a re-run is a no-op.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Both trees' seeds, because they are byte-identical today and the v12 app
 * still BOOTS on this file: `bundle-resolver` falls back to the baked-in seed
 * whenever no published bundle is cached, and the v12 registry-bundle function
 * is not deployed to prod. Writing only v8 would fork the two catalogs on the
 * first new compound. The v12 path is skipped rather than failing if absent.
 *
 * This does NOT reach v12's `registry.compound` table, which its README names
 * as the source of truth for AUTHORED edits. That write needs curator
 * credentials and goes through /admin.
 */
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
  mw_g_mol?: number;
  systems: string[];
  notes?: string;
  refs: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  // ── Authored PK ────────────────────────────────────────────────────────
  {
    slug: 'nefiracetam',
    name: 'Nefiracetam',
    aliases: ['DM-9384', 'DM 9384', 'DZL-221', 'Translon'],
    category: 'nootropic',
    mechanism:
      'Pyrrolidone (racetam-class) cognition enhancer, structurally an anilide of piracetam. Enhances acetylcholine release through modulation of L- and N-type voltage-gated calcium channels rather than through cholinesterase inhibition, and potentiates nicotinic and NMDA currents; mechanistically it groups with piracetam/aniracetam rather than with the SV2A-binding levetiracetam branch. Cleared almost entirely by hepatic oxidation — 5-hydroxylation by CYP3A4 is the principal human route — with under 10% of a dose excreted unchanged in urine.',
    routes: ['PO'],
    doses: { PO: { min: 200, max: 300, typical: 200, unit: 'mg' } },
    half_life_hr: { PO: 3.9 },
    pk: { PO: { ka_hr: 1.52, source_pmid: 'PMID:8484264' } },
    mw_g_mol: 246.3,
    systems: ['nervous', 'digestive'],
    notes:
      'PubChem CID 71157 (C14H18N2O2). PK: Fujimaki 1993 (PMID:8484264), healthy volunteers, single 200 mg oral dose — verbatim "tmax and t1/2 values of the metabolites (4.1-9.6 h and 7.8-21.9 h, respectively) were longer than those of I (1.6 h and 3.9 h respectively)", where I is nefiracetam itself. t½ 3.9 h is that point value; ka 1.52 /h is back-derived to the verbatim 1.6 h Tmax at ke = ln2/3.9, following the established Tmax-anchored ka convention. Cross-checks against the independent single/multiple-dose study Fujimaki 1992 (PMID:1360528): "declined monophasically after Cmax with half-lives of 3-5 h" and "Cmax within 2 h" both contain the stored values. VOLUME AND F DELIBERATELY ABSENT. A V/F of 37.5 L is derivable from the same abstract (Cmax 16.3 nmol/ml at 200 mg → 4.015 mg/L at MW 246.30; F·D/V = 4.015·e^(0.17773·1.6) = 5.336 mg/L; 200/5.336 = 37.5 L) and it cross-checks — ke·V/F = 111 mL/min, inside the "apparent clearance (CL) values were 94.4-140.3 mL min-1" of PMID:1360528. It is not stored because 37.5 L is 0.536 L/kg, within 7% of the solver default the 2026-09-08 sweep purged from 23 records, and because the derived quantity is V/F while no absolute bioavailability is published, so any stored pair would assert an F nobody measured. The defaults land within 4% of the observed peak, so omission costs nothing and claims nothing. Metabolism: Fujimaki 1996 (PMID:8879146) verbatim "5-OH-NEF formation by CYP3A4 is the principal metabolic pathway in humans" (human-P450-expressing microsomes). Dose range is the 200 mg three-times-daily regimen of PMID:1360528 and the 600 and 900 mg/day arms of the post-stroke apathy trial PMID:19622685, expressed per administration. Efficacy is NOT established: the Drugs review PMID:20166767 states "nefiracetam failed to improve cognition in post-stroke patients".',
    refs: [
      'PMID:8484264',
      'PMID:1360528',
      'PMID:8879146',
      'PMID:19622685',
      'PMID:20166767',
      'PMID:15991988',
    ],
  },
  {
    slug: 'tolcapone',
    name: 'Tolcapone',
    aliases: ['Tasmar', 'Ro 40-7592'],
    category: 'pharmacological',
    mechanism:
      'Reversible nitrocatechol inhibitor of catechol-O-methyltransferase (COMT), acting both peripherally and — unlike entacapone — within the CNS, which is why it is the COMT inhibitor used as a probe in prefrontal-dopamine and COMT Val158Met cognition research as well as a levodopa adjunct in Parkinson\'s disease. Erythrocyte COMT is inhibited by more than 80% at single oral doses of 200 mg and above. Carries a boxed warning for fulminant hepatic failure, so it is used with liver-enzyme monitoring.',
    routes: ['PO'],
    doses: { PO: { min: 100, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { PO: 1.8 },
    pk: { PO: { F: 0.6, lag_hr: 0.5, source_pmid: 'PMID:9754991' } },
    mw_g_mol: 273.24,
    systems: ['nervous', 'digestive'],
    notes:
      'PubChem CID 4659569 (C14H11NO5). PK: Jorga 1998 (PMID:9754991), sixteen healthy male volunteers, 200 mg oral vs 50 mg intravenous crossover — an ABSOLUTE bioavailability study. Verbatim: "The absolute bioavailability of an oral dose was approximately 60%", "resulting in a mean plasma half-life of 1.8 h", and "After an initial lag time of 0.5 h, tolcapone was rapidly absorbed". All three are stored. t½ cross-checks against the independent first-in-human study PMID:7768073: "Its mean elimination half-life was 2.0 +/- 0.8 hours (n = 42)". VOLUME AND CLEARANCE NOT STORED BECAUSE THEY ARE NOT READABLE: PubMed\'s indexed record of this abstract renders them as "the volume of distribution was approximately 9 1, and the total clearance was approximately 71.h-l" — OCR damage, present in the XML as well as the text rendering, and the three quantities as transcribed do not close (9 L at t½ 1.8 h implies 3.5 L/h, not 7). Guessing the intended units to recover a number would be transcription dressed as authoring. Logged in AUTHORING_GAPS.md; a full-text page-1 read unlocks both, and V would matter here because 35 L is the default that a 9 L central volume is nowhere near. ka NOT STORED either: the abstract says peaks were reached "within approximately 2 h" and that absorption followed "either zero- or first-order" kinetics, which is a bound and a hedge rather than a stated Tmax. PD: PMID:7768073 verbatim "At doses of 200 mg and higher, COMT activity was inhibited by more than 80%" — informational; no Hill row authored, since erythrocyte enzyme inhibition is not receptor occupancy. Dose range is the marketed 100 mg and 200 mg three-times-daily strengths; the cited studies used single 200 mg (PMID:9754991) and ascending 5-800 mg (PMID:7768073) doses.',
    refs: ['PMID:9754991', 'PMID:7768073'],
  },
  {
    slug: 'sarcosine',
    name: 'Sarcosine',
    aliases: ['N-methylglycine', 'N-methylaminoacetic acid'],
    category: 'amino-acid',
    mechanism:
      'Endogenous N-methylated glycine and an inhibitor of the type-1 glycine transporter (GlyT1). Blocking GlyT1 raises synaptic glycine at the obligatory co-agonist site of the NMDA receptor, so sarcosine acts as an indirect NMDA enhancer rather than as a direct agonist — the basis for its trial use against the NMDA-hypofunction component of schizophrenia, where it has shown improvement in processing speed alongside positive-symptom scores.',
    routes: ['PO'],
    doses: { PO: { min: 2, max: 4, typical: 2, unit: 'g' } },
    half_life_hr: { PO: 1 },
    pk: { PO: { source_pmid: 'PMID:25841105' } },
    mw_g_mol: 89.09,
    systems: ['nervous'],
    notes:
      'PubChem CID 1088 (C3H7NO2). PK: Amiaz 2015 (PMID:25841105), 22 stabilized schizophrenia patients on add-on open-label sarcosine — verbatim "Sarcosine exhibited linear kinetics, with a Tmax and t½ of ~1½- 2½ hr and ~1hr, respectively." The half-life is the point value and is stored; the Tmax is a RANGE (1.5-2.5 h), so no ka is back-derived from it — a range interior is not a measurement. Dose range is that study\'s two arms, verbatim "5 patients received 2 gm/d, and 17 received 4gm/d". No volume or bioavailability is published for oral sarcosine; both default, and the record is counted by pk.defaulted-volume. Cognitive endpoint in the same paper: "Speed of processing (MCCB subscale) improved significantly (Z=-2.13; P=0.03)". Mechanism reference PMID:16611082 (GlyT1 and its inhibitors).',
    refs: ['PMID:25841105', 'PMID:16611082'],
  },
  {
    slug: 'physostigmine',
    name: 'Physostigmine',
    aliases: ['eserine', 'Antilirium', 'Isopto Eserine'],
    category: 'alkaloid',
    mechanism:
      'Carbamate reversible acetylcholinesterase inhibitor from the Calabar bean. A tertiary amine, so unlike the quaternary neostigmine it crosses the blood-brain barrier and raises central as well as peripheral acetylcholine — which is what made it the reference cholinergic challenge agent in human memory pharmacology and the antidote for central antimuscarinic delirium. Peripheral muscarinic excess gives the dose-limiting effects: bradycardia, bronchial secretion and GI cramping.',
    routes: ['IV', 'TD'],
    doses: {
      IV: { min: 0.5, max: 2, typical: 1, unit: 'mg' },
      TD: { min: 5.7, max: 5.7, typical: 5.7, unit: 'mg' },
    },
    half_life_hr: { IV: 0.5, TD: 0.5 },
    pk: {
      IV: { F: 1, source_pmid: 'PMID:7756100' },
      TD: { F: 0.36, zo_dur_hr: 18, lag_hr: 4, source_pmid: 'PMID:7756100' },
    },
    mw_g_mol: 275.35,
    systems: ['nervous', 'cardiovascular', 'digestive'],
    notes:
      'PubChem CID 5983 (C15H21N3O2). PK: Walter 1995 (PMID:7756100), six healthy male volunteers, three-way crossover of a transdermal system (PTS), an oral solution and an i.v. infusion. Verbatim: "A mean absolute bioavailability of 36% was determined for the transdermal system and 3% for the oral solution"; "A single application of the patch over 24 h produced detectable plasma drug concentrations after a mean lag-time of 4 h"; "the drug was absorbed continuously from the PTS and putative therapeutic plasma concentrations were measured over approximately 18 h"; "After removing the PTS, the mean apparent half-life of elimination was 4.9 h, compared with 0.5 h for the i.v. infusion"; "The mean amount of physostigmine released from the transdermal system after 24 h was 5.7 mg". MODELLING NOTE — the 4.9 h is deliberately NOT stored as the transdermal half-life. The paper itself attributes it to absorption, not disposition ("This indicates continued drug absorption from a skin depot"), so storing it would model a flip-flop artefact as elimination AND then double-count it against the zero-order input. Instead TD carries the real disposition half-life (0.5 h, the i.v. value) with the patch represented as what it is: a 4 h lag then an 18 h constant-rate input at F 0.36, which is the schema\'s zo_dur_hr path. PO IS NOT AUTHORED despite its bioavailability being verbatim: at F 0.03 an oral dose is almost entirely destroyed pre-systemically, oral physostigmine is not a marketed form, and offering a PO route would invite a log that renders a near-flat curve as though it were a therapy. IV dose range is the conventional antidote range and is NOT from the cited abstract, which reports an infusion without stating its dose; the TD dose is the verbatim 24 h released amount. No volume is published in the abstract for any route — all three default, and the record is counted by pk.defaulted-volume.',
    refs: ['PMID:7756100', 'PMID:8128833'],
  },
  {
    slug: 'meldonium',
    name: 'Meldonium',
    aliases: ['mildronate', 'Mildronate', 'MET-88', 'THP', 'quaterine'],
    category: 'pharmacological',
    mechanism:
      'Structural analogue of gamma-butyrobetaine and an inhibitor of gamma-butyrobetaine hydroxylase, the last enzyme of carnitine biosynthesis. Lowering carnitine limits long-chain fatty-acid transport into mitochondria and shifts myocardial and neural metabolism toward glucose oxidation, which needs less oxygen per ATP — the basis of its anti-ischaemic use and of the cognitive/anti-fatigue claims made for it in the territories where it is marketed. Banned by WADA since 2016.',
    routes: ['IV', 'PO'],
    doses: {
      IV: { min: 250, max: 1000, typical: 500, unit: 'mg' },
      PO: { min: 250, max: 1000, typical: 500, unit: 'mg' },
    },
    half_life_hr: { IV: 6.46 },
    pk: { IV: { F: 1, source_pmid: 'PMID:20116348' } },
    mw_g_mol: 146.19,
    systems: ['cardiovascular', 'nervous', 'musculoskeletal'],
    notes:
      'PubChem CID 123868 (C6H14N2O2). PK: Peng 2010 (PMID:20116348), healthy Chinese volunteers — verbatim "After single intravenously administration of 250, 500 and 1000 mg mildronate, the elimination half-life (t(1/2)) were (5.56+/-1.55), (6.46+/-1.07) and (6.55+/-1.17) h, respectively." The 500 mg arm value is stored as the mid-strength dose; the three arms are close enough that the choice barely matters, but it is a STATED arm rather than a computed average. Multiple-dose IV 500 mg b.i.d. in the same paper gives a longer t½ (15.34+/-3.14 h) with explicit accumulation — that is a different regimen, not a better estimate of the single-dose parameter, so it is not stored. PO IS A DECLARED DANGLING ROUTE: the oral capsule is the common form and the reason the route is listed at all, but no indexed abstract states an oral half-life or bioavailability for meldonium, so authoring PO would mean inventing one. A dose logged against PO renders no curve until that is sourced; logged in AUTHORING_GAPS.md. No volume is published; IV defaults. Indication reference PMID:16007237 ("Mildronate: an antiischemic drug for neurological indications").',
    refs: ['PMID:20116348', 'PMID:16007237'],
  },

  // ── Stubs: pk_unauthored with a reason ─────────────────────────────────
  {
    slug: 'nicergoline',
    name: 'Nicergoline',
    aliases: ['Sermion', 'nicergolin'],
    category: 'alkaloid',
    mechanism:
      'Semisynthetic ergoline. An alpha-1-adrenoceptor antagonist producing cerebral vasodilation and increased arterial flow, which also enhances cholinergic and catecholaminergic transmission, inhibits platelet aggregation, raises oxygen and glucose utilisation, and has neurotrophic and antioxidant activity. Rapidly hydrolysed after absorption to the alcohol MMDL, which CYP2D6 then N-demethylates to MDL; poor CYP2D6 metabolisers accumulate MMDL roughly sixfold and form essentially no MDL. Marketed for mild-to-moderate dementia and balance disorders.',
    routes: ['PO'],
    doses: { PO: { min: 30, max: 60, typical: 30, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'uncharacterized',
      note: 'No indexed abstract states a PK parameter for the PARENT, after fifty years of daily dosing for dementia. PMID:8971425 gave a single oral 30 mg and reports only METABOLITE exposure split by CYP2D6 phenotype — no half-life, volume, bioavailability or Tmax for nicergoline itself (quoted in full in notes). The remaining hits (PMID:11274866, PMID:1783643, PMID:29403722) are assay-development papers. The exposure is real and the LITERATURE is what is missing, which is uncharacterized, not label-only.',
    },
    mw_g_mol: 484.4,
    systems: ['nervous', 'cardiovascular', 'immune-hematologic'],
    notes:
      'PubChem CID 34040 (C24H26BrN3O3). What PMID:8971425 actually reports, verbatim, after a single oral 30 mg: "mean MMDL Cmax 59 nmol l-1 and AUC (0, th) 144 nmol l-1h, mean MDL Cmax 183 nmol l-1 and AUC 2627 nmol l-1h" in extensive debrisoquine metabolisers against "mean MMDL Cmax 356 nmol l-1 and AUC 10512 nmol l-1h, MDL concentrations below limit of quantitation" in poor metabolisers — metabolite exposures only, which is why the record is pk_unauthored. Dose range is verbatim from the Winblad 2008 review (PMID:18666801): "nicergoline (30 mg twice daily)" and "commonly applied doses (60 mg/day)". immune-hematologic is tagged for the platelet-aggregation inhibition that review names. NOTE FOR ANY FUTURE PK PASS: this is a prodrug shape — if a parameter is ever sourced it will almost certainly describe MMDL or MDL, not nicergoline, so it needs pk_analyte: active-metabolite and pk_analyte_name set, and mw_g_mol switched to the analyte\'s mass per the catalog convention. The 484.4 stored here is the parent and is correct only while no PK exists.',
    refs: ['PMID:18666801', 'PMID:8971425'],
  },
  {
    slug: 'picamilon',
    name: 'Picamilon',
    aliases: ['pikamilon', 'nicotinoyl-GABA', 'N-nicotinoyl-GABA', 'Pycamilon'],
    category: 'nootropic',
    mechanism:
      'Conjugate of niacin and GABA, marketed as a nootropic on the premise that the niacin moiety carries GABA across the blood-brain barrier where hydrolysis then releases both. The premise is not supported by target data: screened by the FDA against 50 safety-related receptors, ion channels, enzymes and transporters, picamilon bound none of them, in silico or in vitro. Whatever it does is therefore not explained by any characterised receptor interaction, and it is grouped here with the other GABA analogues on structure alone.',
    routes: ['PO'],
    doses: { PO: { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'No indexed abstract states a human PK parameter. PMID:20359966 is an LC-MS/MS assay for picamilon in human plasma — a method paper that validates a measurement without publishing the disposition it was built for. The Russian clinical reports (PMID:39269299, PMID:39113452, PMID:36168693) are efficacy and safety studies with no kinetics. Sold as a dietary supplement in the US until the FDA ruled it an unapproved drug ingredient, so the dose range below is label practice, not a studied regimen.',
    },
    mw_g_mol: 208.21,
    systems: ['nervous', 'cardiovascular'],
    notes:
      'PubChem CID 60608 (C10H12N2O3). The mechanism paragraph is a NEGATIVE result and is stated as one: Santillo 2023 (PMID:36668678), an FDA screen, verbatim "picamilon exhibited weak or no binding to the targets when measured in vitro at 10 μM" and "Using two in silico tools, picamilon was not predicted to bind to the targets". This is unusually good evidence for a supplement-market compound and it argues AGAINST the marketed mechanism, so the record says so rather than repeating the vendor claim. cardiovascular is tagged for the niacin moiety\'s vasodilatory contribution, which is the part of the premise that is chemically uncontroversial. Dose range is supplement-label practice (50-200 mg), NOT from any cited trial.',
    refs: ['PMID:36668678', 'PMID:20359966'],
  },
  {
    slug: 'pyritinol',
    name: 'Pyritinol',
    aliases: ['pyrithioxine', 'pyridoxine disulfide', 'Encephabol', 'Enerbol'],
    category: 'nootropic',
    mechanism:
      'Two pyridoxine (vitamin B6) molecules joined by a disulfide bridge. The disulfide is lipophilic enough to cross the blood-brain barrier where pyridoxine itself does not, and the compound is not a B6 vitamer in action — it does not raise pyridoxal-5-phosphate-dependent activity, and its reported effects on cholinergic transmission and cerebral glucose uptake are attributed to the intact molecule and its thiol metabolites rather than to B6 repletion. Marketed in Europe for cognitive disorders; associated with cholestatic hepatitis and pancreatitis on long use.',
    routes: ['PO'],
    doses: { PO: { min: 100, max: 200, typical: 200, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'uncharacterized',
      note: 'Administered to people for over fifty years with no modern disposition study indexed. The only human work is Darge 1969 (PMID:5819373), a two-page German ³⁵S tracer report whose PubMed record carries NO ABSTRACT AT ALL, so no value can be read from it; its animal companion (PMID:5819364) is in the same state. PMID:6526537 measures urinary D-glucaric acid after repeated dosing — an enzyme-induction marker, not a kinetic parameter. Full text of the 1969 pair would unlock this.',
    },
    mw_g_mol: 368.5,
    systems: ['nervous'],
    notes:
      'PubChem CID 14190 (C16H20N2O4S2). Dose range is the marketed Encephabol regimen (100-200 mg up to three times daily) and is NOT from a cited study. Mechanism reference PMID:3217429 (effects of pyritinol metabolites on ACh release from brain slices) — in vitro and rodent, so no Hill row is authored from it. Do not fold this record into pyridoxine: the disulfide is pharmacologically distinct and the identity-collision rule should not pair them.',
    refs: ['PMID:5819373', 'PMID:3217429'],
  },
  {
    slug: '7-8-dihydroxyflavone',
    name: '7,8-Dihydroxyflavone',
    aliases: ['7,8-DHF', '7,8-dihydroxyflavone', 'tropoflavin'],
    category: 'flavonoid',
    mechanism:
      'Small-molecule agonist at TrkB, the receptor for brain-derived neurotrophic factor — it mimics BDNF signalling directly rather than raising BDNF expression, which is what distinguishes it from the exercise-and-diet interventions usually invoked for the same pathway. Orally active and brain-penetrant in rodents, where it is the standard pharmacological probe for BDNF-implicated models of depression, Alzheimer\'s disease and hypoxic-ischaemic injury. Rapidly O-methylated; the methylated metabolite retains TrkB activity.',
    routes: ['PO'],
    doses: { PO: { min: 10, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'No human exposure of any kind is published. The only PK abstract is MURINE (PMID:39881861, neonatal mice), and the development literature is still working on delivery: PMID:29295929 describes a PRODRUG built because the parent\'s own exposure is inadequate — the clearest possible statement that the parent has no established human regimen. Authoring mouse numbers under a human route would be the species error source_species exists to prevent, and there is no human route to attach them to.',
    },
    mw_g_mol: 254.24,
    systems: ['nervous'],
    notes:
      'PubChem CID 1880 (C15H10O4). Sold as a supplement under the name tropoflavin; the dose range is vendor label practice with no trial behind it, recorded so a logged intake has a plausible scale rather than because it is established. Mechanism reference PMID:26740873 (TrkB agonist, BDNF-implicated disorders); the active O-methylated metabolite is PMID:23445871. A CYP/albumin interaction screen exists (PMID:31731555) and is the place to start if kinetic edges are ever authored — not done here, since the abstract reports binding studies rather than a Ki this catalog could carry.',
    refs: ['PMID:26740873', 'PMID:39881861', 'PMID:29295929'],
  },
];

let wrote = 0;
for (const path of TARGETS) {
  if (!existsSync(path)) {
    console.log(`skip (absent): ${path}`);
    continue;
  }
  const data = JSON.parse(readFileSync(path, 'utf-8')) as Compound[];
  const bySlug = new Set(data.map((c) => c.slug));
  const alias = new Set<string>();
  for (const c of data) for (const s of c.retired_slugs as string[] | undefined ?? []) alias.add(s);

  const added: string[] = [];
  const skipped: string[] = [];
  for (const c of NEW_COMPOUNDS) {
    if (bySlug.has(c.slug) || alias.has(c.slug)) {
      skipped.push(c.slug);
      continue;
    }
    data.push(c);
    bySlug.add(c.slug);
    added.push(c.slug);
  }

  if (added.length) {
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
    wrote++;
  }
  console.log(`${path}\n  added ${added.length}: ${added.join(', ') || '(none)'}`);
  if (skipped.length) console.log(`  skipped ${skipped.length} already present: ${skipped.join(', ')}`);
  console.log(`  catalog now ${data.length} compounds`);
}
console.log(`\n${wrote} file(s) written.`);
