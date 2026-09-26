/**
 * 2026-09-06-peptide-audit.ts
 *
 * Verification pass over the peptide category: 38 records with authored PK,
 * checked route by route against their own citations by eight agents reading
 * abstracts through NCBI E-utilities.
 *
 * ── The policy this pass introduces ───────────────────────────────────────
 * Animal-derived PK may be KEPT, provided the species is declared in
 * `source_species` (added in the previous commit, with loader schema, a
 * round-trip test, lint rules and a compound-page chip). For research peptides
 * there is often no human study at all, and a rat curve labelled as a rat curve
 * is worth more than a blank. What is not allowed is an animal value passing as
 * human. hexarelin is the case in point: its human 77% is a PD-derived
 * "biological bioavailability" from GH release, not a plasma measurement, while
 * the rat study gives a true PK half-life and bioavailability from one fit.
 * The rat pair is adopted, labelled rat.
 *
 * ── How stated RANGES are handled ────────────────────────────────────────
 * Several abstracts state a range where the registry needs a scalar. Earlier
 * passes deleted undocumented midpoints (fluconazole's 34 h out of "31 to 37
 * hours"), and rightly: those presented an arithmetic artefact as a
 * measurement. The rule applied here is narrower — a midpoint may stand only
 * when the note quotes the full range verbatim and says it is a midpoint, so a
 * reader can see the spread the single number hides. Where a scalar exists
 * elsewhere it wins over any midpoint.
 *
 * ── The default that ran through the whole category ──────────────────────
 * `V_L: 7` is not a measurement. It is plasma volume, and it sits on 13
 * unrelated compounds under 13 different citations — five monoclonal
 * antibodies, enoxaparin, and six peptides. A 63 kDa antibody dimer and a
 * 3.4 kDa GHRH analogue do not share a volume of distribution. `ka_hr: 0.02`
 * is the same story across four weekly peptides. Every instance audited here is
 * removed or replaced; the antibody rows are logged for a later pass.
 *
 * Molecular weights are backfilled from PubChem CIDs (or, for dulaglutide and
 * setmelanotide, the approval document's own DESCRIPTION section). 65 of 76
 * peptide records lacked one, which is what blocks receptor-occupancy authoring
 * — the µM-to-mg/L conversion needs it.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound {
  slug: string;
  mw_g_mol?: number;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  refs?: string[];
  notes?: string;
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (slug: string) => { const c = by.get(slug); if (!c) throw new Error(`${slug} not in registry`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t)) c.notes = c.notes ? `${c.notes} ${t}` : t; };

/** Molecular weights, PubChem CID unless noted. Backfills the occupancy blocker. */
const MW: Record<string, number> = {
  'bpc-157': 1419.5,          // CID 9941957
  lanreotide: 1096.3,         // CID 6918011, free base
  teriparatide: 4118,         // CID 16133850
  calcitonin: 3431.9,         // CID 16220016 — SALMON calcitonin, which the citation studies
  'ghrp-6': 873.0,            // CID 4345065; abstract states "MW=872.44 Da"
  leuprolide: 1269.4,         // CID 657180, acetate — the salt the cited studies dose
  secretin: 3039.4,           // CID 71306891, human; cross-checked to UniProt P09683
  tesamorelin: 5136,          // CID 16137828
  'cjc-1295': 3647.2,         // CID 91971820, the DAC form this record models
  glucagon: 3482.7,           // CID 16132283
  lixisenatide: 4858.5,       // CID 90472060
  gonadorelin: 1182.3,        // CID 638793
  octreotide: 1019.2,         // CID 448601, free peptide
  sermorelin: 3357.9,         // CID 16132413 — matches the Geref label's 3358
  triptorelin: 1311.4,        // CID 25074470
  dulaglutide: 63000,         // Trulicity label §11, "approximately 63 kilodaltons"; homodimer, 2 GLP-1 moieties
  hexarelin: 887.0,           // CID 6918297
  oxytocin: 1007.2,           // CID 439302
  vasopressin: 1084.2,        // CID 644077 "argipressin"; PubChem does not resolve the bare name
  ipamorelin: 711.9,          // CID 9831659; sequence stated verbatim in PMID:9849822
  pramlintide: 3949,          // CID 70691388
  somatostatin: 1637.9,       // CID 16129706, somatostatin-14
  cetrorelix: 1431.0,         // CID 25074887, free base (acetate is 1491.1)
  'glp-1': 3297.7,            // GLP-1(7-36)amide, UniProt P01275 residues 98-127, C-terminally amidated
  selank: 751.9,              // CID 11765600; sequence TKPRPGP stated verbatim in PMID:16637290
  'thymosin-alpha-1': 3108.3, // CID 16130571; PMID:9278175 states "a molecular weight of 3108"
  ganirelix: 1570.3,          // CID 16130957, free base
  kisspeptin: 5798.4,         // kisspeptin-54, UniProt Q15726 residues 68-121, C-terminal amide
  'kisspeptin-10': 1302.4,    // CID 25240297
  'pt-141': 1025.2,           // CID 9941379; PMID:40513668 states "bremelanotide (1.03 kDa)"
  somatropin: 22125,          // UniProt P01241 chain 27-217, 191 aa, two disulfides
};

/** Records that keep a curve. pk replaces the block wholesale. */
interface Fix { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }

const FIXES: Fix[] = [
  { slug: 'lanreotide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { V_L: 18.3, F: 1, source_pmid: 'PMID:15099442' } }, hl: { SC: 519 },
    refs: ['PMID:26416534', 'PMID:10579475'],
    note: 'PK describes the AUTOGEL DEPOT, not immediate-release — the two are different drug products. Antonijoan 2004 (PMID:15099442), 24 healthy volunteers, deep SC Autogel 40 mg, verbatim "mean apparent elimination half-life was 21.63 +/- 9.42 and 22.01 +/- 9.87 days" (40 mg arm = 519 h; the stored 600 h appears in no paper). V/F 18.3 L from Buil-Bruna 2016 (PMID:26416534), 290 GEP-NET patients, verbatim "The estimated apparent volume of distribution was 18.3 L"; F is pinned to 1 because that volume is apparent. ka and the stored F 0.75 dropped 2026-09-06: no absorption constant is published, and the cited paper reports only RELATIVE bioavailability (0.93/0.82 vs immediate-release SC), not the absolute F a model consumes. For contrast, the immediate-release IV profile is t1/2 1.32 h and Vss 0.172 L/kg (PMID:10579475) — do not mix it with these depot values.',
    summary: 'lanreotide — half-life 600->519 h (Autogel), V 14->18.3 L apparent; ka/F dropped' },

  { slug: 'retatrutide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:36354040' } }, hl: { SC: 144 },
    refs: ['PMID:36354040'],
    note: 'PK: half-life re-cited 2026-09-06. The value is unchanged and correct — Urva 2022 (PMID:36354040), 72 adults with type 2 diabetes, SC once weekly, verbatim "its half-life was approximately 6 days" = 144 h — but it had been attributed to PMID:37366315, the phase 2 EFFICACY trial, whose abstract reports body-weight change and adverse events and no PK parameter at all. ka 0.02 /h and V 7 L dropped: neither appears in any abstract, and both are registry-wide defaults (V 7 L is plasma volume, shared by 13 unrelated compounds).',
    summary: 'retatrutide — half-life re-cited to the PK trial; ka/V defaults dropped' },

  { slug: 'teriparatide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:20953593' } }, hl: { SC: 1 },
    refs: ['PMID:18065105'],
    note: 'PK: Satterwhite 2010 (PMID:20953593), 360 postmenopausal women, SC 20 µg daily, verbatim "rapid absorption (maximum concentration achieved within 30 min) and rapid elimination (half-life of 1 h)". The citation is correct and the half-life stands as stored. ka 2.5 /h, V 8.4 L and F 0.95 dropped 2026-09-06 — all three are approval-document figures that appear in no indexed abstract, and the cited paper states none of them. Chu 2007 (PMID:18065105), 9 healthy volunteers, corroborates at 53.9-64.1 min.',
    summary: 'teriparatide — half-life kept as stored and confirmed; ka/V/F dropped' },

  { slug: 'ghrp-6', guard: (c) => c.pk?.SC?.F != null,
    pk: { SC: { source_pmid: 'PMID:23099431' } }, hl: { SC: 2.5 },
    note: 'PK: Cabrales 2013 (PMID:23099431), 9 healthy male volunteers, verbatim "the distribution and elimination half-life of GHRP-6 were 7.6 +/- 1.9 min and 2.5 +/- 1.1h, respectively". ROUTE CAVEAT: that study dosed a single IV bolus; the value is a systemic elimination half-life so it transfers, but no SC study exists for this peptide. F 0.7 dropped 2026-09-06 — it appears in no source. The only subcutaneous bioavailability on record is animal and spans two species, 89-103% in rat and dog (PMID:8149896), which cannot be reduced to one number.',
    summary: 'ghrp-6 — half-life kept (human, IV-derived); F dropped' },

  { slug: 'leuprolide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { V_L: 37.1, F: 0.94, source_pmid: 'PMID:3083092' } }, hl: { SC: 3.6 },
    refs: ['PMID:3083092', 'PMID:1553349'],
    note: 'PK describes IMMEDIATE-RELEASE leuprolide, not a depot. Sennello 1986 (PMID:3083092), 6 healthy men, 1 mg SC and IV crossover, verbatim "The mean beta half-life after the intravenous dosings was 2.9 h and after the subcutaneous dosings was 3.6 h" and "The mean volume of distribution at steady state from the intravenous and subcutaneous doses were 26.5 and 37.1 L, respectively". F 0.94 from Adjei 1992 (PMID:1553349), healthy men, verbatim "The s.c. injection was 94% bioavailable compared with i.v." The previous citation (PMID:12083977) is a review of DEPOT leuprorelin whose own numbers are 3.6 h and 37 L for immediate-release and 27 L for the 15 mg depot — the stored 28 L sat between the two formulations. ka 0.05 /h dropped: it implies a 14 h absorption half-life, which is neither immediate-release nor depot.',
    summary: 'leuprolide — re-sourced to the immediate-release primary; depot/IR blend resolved' },

  { slug: 'tesamorelin', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { V_L: 200, F: 1, source_pmid: 'PMID:25358450' } }, hl: { SC: 0.13 },
    note: 'PK: Gonzalez-Sales 2015 (PMID:25358450), 38 HIV-infected patients and healthy subjects, SC 1-2 mg daily for 14 days, verbatim "Volume of distribution was calculated to be 200 L (17.7 %)" and "Plasma clearance ... 1,060 L/h (33.6 %)". The half-life is that fit\'s own ln2 x V/CL = 0.13 h, which is where the stored value came from — but the record had kept the derived half-life while storing V as 7 L, a registry default, so the set contradicted itself. V is restored to the paper\'s 200 L and F pinned to 1, since both parameters are apparent after SC-only dosing. ka 2 /h and F 0.04 dropped: neither is stated anywhere. The nearest half-life in any other source is 26 min in DOG (PMID:15113616), and that paper\'s 13% is an INHALED bioavailability, not subcutaneous.',
    summary: 'tesamorelin — V 7->200 L (its own paper\'s figure), F pinned; ka/F 0.04 dropped' },

  { slug: 'cjc-1295', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:16352683' } }, hl: { SC: 168 },
    note: 'PK: Teichman 2006 (PMID:16352683), healthy adults, SC ascending doses, verbatim "The estimated half-life of CJC-1295 was 5.8-8.1 d" = 139-194 h. The stored 168 h (7 days) is the MIDPOINT of that stated range, kept because no scalar exists in any source and the range is quoted here so the spread is visible. This record models the DAC form (albumin-conjugated), which is what that paper studies; the unconjugated peptide is the separate mod-grf-1-29 record. ka 0.02 /h and V 7 L dropped 2026-09-06 — both are registry-wide defaults appearing in no abstract, V 7 L being plasma volume shared across 13 unrelated compounds.',
    summary: 'cjc-1295 — half-life kept as a documented range midpoint; ka/V defaults dropped' },

  { slug: 'glucagon', guard: (c) => (c.half_life_hr?.IV ?? 0) === 0.07,
    pk: { IV: { source_pmid: 'PMID:773949' } }, hl: { IV: 0.08 },
    note: 'PK: Alford 1976 (PMID:773949), 9 normal subjects, constant IV infusion, verbatim "t1/2 4.8 +/- 0.2 min" — 0.08 h. The stored 0.07 h (4.2 min) matched neither that nor the diabetic arm\'s 6.6 min; a rounding correction, same citation. The same abstract gives a metabolic clearance rate of 9.0 +/- 0.6 mL/kg/min in controls if a clearance term is ever wanted.',
    summary: 'glucagon — half-life 0.07->0.08 h, its own paper\'s figure' },

  { slug: 'semaglutide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { V_L: 7.7, source_pmid: 'PMID:30788808' } }, hl: { SC: 168 },
    refs: ['PMID:29536338', 'PMID:30788808'],
    note: 'PK: volume re-sourced 2026-09-06. Overgaard 2019 (PMID:30788808), 353 subjects across nine trials with both SC and IV data, verbatim "the central and peripheral volumes were estimated to be 3.59 L ... and 4.10 L ... (i.e. a total volume of distribution of 7.7 L)" — a true volume, not apparent. The stored 7 L was the registry default and happened to land near it; the approval document\'s 12.5 L is an apparent V/F and does not contradict this. Half-life 168 h stands on Ikushima 2018 (PMID:29536338), verbatim "the half-life (t1/2, ~ 1 week)", though note Enebo 2021 measured 145-165 h, so 168 h sits just outside a measured interval. ka 0.02 /h and F 0.89 dropped: neither appears in any human abstract, and the only verbatim bioavailability is 76.65-82.85% in RAT (PMID:36989942), not imported because species-mixing an otherwise-human record would degrade it.',
    summary: 'semaglutide — V 7 (default) -> 7.7 L measured; ka/F dropped' },

  { slug: 'tirzepatide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:38356317' } }, hl: { SC: 120 },
    refs: ['PMID:34647404'],
    note: 'PK: Schneck 2024 (PMID:38356317), population model over 19 pooled studies, verbatim "The half-life of tirzepatide was ~5 days" = 120 h; the stored 116 h appears nowhere. Corroborated independently by Furihata 2022 (PMID:34647404), 48 Japanese participants, "approximately 5 days". V 9.1 L and ka 0.04 /h dropped 2026-09-06 — no PubMed abstract states a tirzepatide volume of distribution at all, so there is nothing to re-source to.',
    summary: 'tirzepatide — half-life 116->120 h; V/ka dropped (no volume exists in the literature)' },

  { slug: 'sermorelin', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:7962295' } }, hl: { SC: 0.07 },
    note: 'PK: Soule 1994 (PMID:7962295), 10 normal men, verbatim "that of GHRH-(1-29)-NH2 was 4.3 +/- 1.4 min" = 0.07 h. ROUTE CAVEAT: that study used constant IV infusion, not subcutaneous dosing. ka 3 /h and V 7 L dropped 2026-09-06, confirming a finding first logged in July: both were unsourced estimates, and V 7 L is refuted by the paper\'s own arithmetic — its metabolic clearance rate of 39.7 mL/kg/min with a 4.3 min half-life implies roughly 17 L, the same order as the Geref label\'s ~24 L. The only subcutaneous data for this peptide are RAT (PMID:2866222, SC bioavailability ~4%).',
    summary: 'sermorelin — half-life kept; ka/V unsourced estimates dropped (confirms July finding)' },

  { slug: 'dulaglutide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:26507721' } }, hl: { SC: 120 },
    refs: ['PMID:34787823'],
    note: 'PK: Geiser 2016 (PMID:26507721), pooled population analysis in type 2 diabetes, verbatim "had a terminal elimination half-life of 5 days" = 120 h; the stored 113 h appears nowhere. Corroborated by Xu 2022 (PMID:34787823), "half-life of 4-5 days". V 21 L, F 0.55 and ka 0.02 /h dropped 2026-09-06: the cited abstract states none of them, and the approval document gives apparent volumes of 3.09 L central plus 5.98 L peripheral, roughly 9 L in total rather than 21. Bioavailability is also dose-dependent there — 65% at 0.75 mg against 47% at 1.5 mg — so a single scalar F is structurally wrong for this drug.',
    summary: 'dulaglutide — half-life 113->120 h; V/F/ka dropped (F is dose-dependent)' },

  { slug: 'hexarelin', guard: (c) => c.pk?.SC?.ka_hr != null,
    // Animal values KEPT under the new policy, labelled rat, taken from one fit.
    pk: { SC: { F: 0.64, source_pmid: 'PMID:10611139', source_species: 'rat' } }, hl: { SC: 1.27 },
    refs: ['PMID:10611139', 'PMID:8126144'],
    note: 'PK is RAT and labelled as such. Roumi 2000 (PMID:10611139), male Sprague-Dawley rats, IV and SC, verbatim "a half-life of 75.9 +/- 9.3 min" (1.27 h) and "Hexarelin bioavailability given s.c. was 64%" — a true plasma bioavailability, and both values come from one study so they stay mutually consistent. The human figure previously stored, 0.77 from Ghigo 1994 (PMID:8126144), is a BIOLOGICAL bioavailability derived from growth-hormone release, a pharmacodynamic ratio rather than a plasma measurement, and is not interchangeable with a PK F. The stored half-life of 0.6 h matched no species: rat is 75.9 min, dog 120 min (PMID:8545255). V 14 L and ka 2 /h dropped — the rat volume is 744 mL/kg, roughly 52 L at 70 kg, and no absorption constant is published in any species.',
    summary: 'hexarelin — rat half-life 1.27 h + rat F 0.64, labelled species; human PD-derived F removed' },

  { slug: 'oxytocin', guard: (c) => (c.half_life_hr?.IV ?? 0) === 0.07,
    pk: { IV: { V_L: 15, F: 1, source_pmid: 'PMID:28679021' } }, hl: { IV: 1.2 },
    refs: ['PMID:2375427'],
    note: 'PK: Nielsen 2017 (PMID:28679021), 33 postmenopausal women, IV 10 IU, verbatim "The clearance, volume of distribution at steady state, distribution half-life, and terminal half-life were estimated to be 27 L/h, 15 L, 5.5 minutes, and 1.2 hours, respectively". The stored 0.07 h matched neither phase and appears to have been a mis-rounding of the 5.5 min DISTRIBUTION half-life; elimination is governed by the terminal 1.2 h, and the volume the same abstract states was never stored. CAVEAT: clearance rises about fourfold in late pregnancy through placental oxytocinase — 5.7 vs 1.3 L/min (PMID:2375427) — so a fixed value is wrong for any obstetric use. Infusion rate, by contrast, does not change clearance (PMID:3793853).',
    summary: 'oxytocin — half-life 0.07->1.2 h terminal; V 15 L added from the same fit' },

  { slug: 'setmelanotide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { V_L: 75.2, F: 1, source_label: 'FDA label: Imcivree (setmelanotide), clinical pharmacology — 3 mg SC qd at steady state: apparent V/F 75.2 L, effective t½ ~11 h, CL/F 7.15 L/h in a typical 120 kg patient.' } },
    hl: { SC: 11 },
    note: 'PK stays on the approval document, which is legitimate primary provenance here: no PubMed-indexed study reports a setmelanotide half-life, volume, absorption rate or bioavailability, so there is nothing to re-source to. Corrections applied 2026-09-06: the stored volume was 75 against the document\'s stated 75.2, a silent rounding of a cited figure; F 0.85 is removed because no bioavailability appears in that document at all, and pairing it with an explicitly APPARENT V/F double-counted absorption; F is pinned to 1 for that reason. ka 0.2 /h removed — the only absorption statement is a median time to peak of 8 h.',
    summary: 'setmelanotide — V 75->75.2 L, F 0.85 removed (absent from the label), ka removed' },

  { slug: 'vasopressin', guard: (c) => c.pk?.IV?.V_L != null,
    pk: { IV: { source_pmid: 'PMID:1262458' } }, hl: { IV: 0.4 },
    note: 'PK: Baumann 1976 (PMID:1262458), 10 hydrated normal subjects, IV radioiodinated tracer, verbatim "the mean plasma half-life 24.1 min" = 0.4 h. The half-life stands as stored. V 14 L dropped 2026-09-06: the abstract gives only the qualitative "rapidly distributed into a space approximating the extracellular fluid volume", so 14 L was an inference from that phrase rather than a cited value, and no human numeric volume for vasopressin appears in any indexed abstract. CAVEAT: this is a tracer study at physiological concentrations, not vasopressor dosing, and clearance is infusion-rate dependent in dog (PMID:216270).',
    summary: 'vasopressin — half-life kept; V 14 L dropped (was inferred from prose)' },

  { slug: 'exenatide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { V_L: 28.3, F: 1, source_pmid: 'PMID:16484515' } }, hl: { SC: 2.4 },
    refs: ['PMID:16484515', 'PMID:18793576'],
    note: 'PK describes the twice-daily IMMEDIATE-RELEASE product, not the weekly formulation. Bray 2006 (PMID:16484515), verbatim "The mean apparent volume of distribution after administration of a single subcutaneous dose is 28.3 L" and "The terminal half-life of the drug is 2.4 hours". F is pinned to 1 because that volume is explicitly apparent. The previous citation (PMID:28085521) is a review whose abstract carries no numbers and covers both formulations. F 0.7 dropped: its only source says "Based on animal studies ... between 65% and 75%" without naming a species, so it cannot be labelled under the species policy, and 0.7 was a range midpoint besides. ka 0.3 /h dropped — no source, and inconsistent with the 2.1 h time to peak. Note Zhao 2008 (PMID:18793576) measured a materially lower 0.99-1.25 h and 19.2-22.3 L in 24 volunteers; not averaged.',
    summary: 'exenatide — re-sourced to a paper with numbers; V apparent with F pinned; ka/F dropped' },

  { slug: 'ipamorelin', guard: (c) => c.pk?.SC?.V_L != null,
    pk: { SC: { source_pmid: 'PMID:10496658' } }, hl: { SC: 2 },
    note: 'PK: Gobburu 1999 (PMID:10496658), 40 healthy male volunteers across five dose levels, verbatim "a short terminal half-life of 2 hours". ROUTE CAVEAT: that study used a 15-minute IV infusion, not subcutaneous dosing. V 4.9 L dropped 2026-09-06 — the paper states "a volume of distribution at steady-state of 0.22 L/kg", about 15 L at 70 kg, so the stored value was roughly threefold too small and would require a 22 kg subject. F 0.75 dropped: an IV study cannot yield a bioavailability, and the only figure for this peptide in any species is roughly 20% INTRANASAL in rat (PMID:9879640). Human ipamorelin PK does exist, contrary to an earlier note that conflated this trial with the rat pharmacology paper.',
    summary: 'ipamorelin — half-life kept (human, IV-derived); V refuted by its own paper, F dropped' },

  { slug: 'pramlintide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_label: 'FDA label: Symlin (pramlintide acetate), clinical pharmacology — absolute bioavailability of a single subcutaneous dose approximately 30-40%.' } },
    hl: { SC: 0.67 },
    refs: ['PMID:16278328'],
    note: 'PK: McQueen 2005 (PMID:16278328) states "a mean elimination half-life of 30-50 minutes" in humans dosed subcutaneously. The stored 0.8 h (48 min) sat inside that range without being stated; 0.67 h is the midpoint, kept with the range quoted here so the spread is visible. ka 2 /h and V 21 L dropped 2026-09-06 — the abstract states neither, and no PubMed abstract gives a pramlintide volume. F is now carried as a LABEL citation rather than a PMID: the commonly used 30-40% comes from the approval document, and no indexed abstract states an absolute bioavailability for this peptide.',
    summary: 'pramlintide — half-life as a documented midpoint; F moved to a label citation; ka/V dropped' },

  { slug: 'somatostatin', guard: (c) => c.pk?.IV?.ka_hr != null,
    pk: { IV: { source_pmid: 'PMID:422706' } }, hl: { IV: 0.034 },
    note: 'PK: Sheppard 1979 (PMID:422706), normal volunteers, IV infusion, verbatim "In normal subjects, the t 1/2 of the first component varied from 1.1-3.0 min". The stored 0.033 h is the midpoint of that range; 0.034 h (2.05 min) is the exact midpoint, kept with the range quoted so the spread is visible, and the abstract is explicit that decay is biphasic. The ka of 60 /h was removed: it was the registry sentinel for instantaneous input, which the solver ignores on IV routes anyway, and it was sitting on a citation that says nothing about absorption. The same paper gives a metabolic clearance rate of 1949 +/- 250 mL/min if a clearance term is wanted.',
    summary: 'somatostatin — half-life documented as a range midpoint; the meaningless IV ka removed' },

  { slug: 'cetrorelix', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { F: 0.85, source_pmid: 'PMID:10709155' } }, hl: { SC: 56.9 },
    refs: ['PMID:11180022', 'PMID:10709155'],
    note: 'PK: bioavailability re-cited and half-life re-sourced 2026-09-06. F 0.85 is correct but belonged to Pechstein 2000 (PMID:10709155), IV n=5 and SC n=6, verbatim "Average absolute bioavailability after SC administration was 85%" — a true absolute value against an IV arm. The half-life 56.9 h comes from Nagaraja 2000 (PMID:11180022), 36 healthy premenopausal women, verbatim "a terminal half-life of 56.9 +/- 27.1 hours"; the stored 63 h appears in no paper, and the previous citation (PMID:9806255) reports only ranges, 5-10 h single-dose and 20-80 h multiple-dose. V 70 L and ka 0.7 /h dropped: no abstract states either, and the 63 h / 70 L pair looks label-derived.',
    summary: 'cetrorelix — half-life 63->56.9 h, F re-cited to the study that measured it; V/ka dropped' },

  { slug: 'liraglutide', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:11935150' } }, hl: { SC: 12.6 },
    refs: ['PMID:11935150'],
    note: 'PK: Agersø 2002 (PMID:11935150), 30 healthy men, SC, verbatim "the half-life of NN2211 was found to be 12.6 +/- 1.1 h" — a point estimate replacing the stored 13 h, which was the midpoint of the previous citation\'s "11-15 h" range. NN2211 is liraglutide\'s pre-approval code name. V 7 L dropped: it was the registry-wide plasma-volume default and is wrong in direction, but the approval document\'s ~13 L could not be substituted because no indexed abstract states a liraglutide volume — Watson 2010 (PMID:20133507) describes the model structure and publishes no parameters. ka 0.1 /h and F 0.55 dropped for the same reason. This class keeps its parameter estimates in labels and full-text tables rather than abstracts.',
    summary: 'liraglutide — half-life 13 (a midpoint) -> 12.6 h; V/ka/F dropped' },

  { slug: 'thymosin-alpha-1', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { source_pmid: 'PMID:11381492' } }, hl: { SC: 2 },
    note: 'PK: Ancell 2001 (PMID:11381492), verbatim "the serum half-life is approximately 2 hours". PROVENANCE CAVEAT: that is a narrative review rather than a primary study, and its abstract never states a species — human by clinical context only. No primary human PK for this peptide exists in any indexed abstract; the literature is formulation and half-life-extension work on modified variants. ka 1 /h, V 24.5 L and F 1 dropped 2026-09-06: none appears in the source, and ka 1 /h contradicts the same abstract\'s statement that peak concentrations arrive within two hours.',
    summary: 'thymosin-alpha-1 — half-life kept with a review-source caveat; ka/V/F dropped' },

  { slug: 'ganirelix', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { F: 0.91, source_pmid: 'PMID:10593371' } }, hl: { SC: 12.8 },
    note: 'PK: Oberyé 1999 (PMID:10593371), 15 healthy women evaluated, 0.25 mg SC and IV crossover, verbatim "The mean (+/- SD) half-lives after IV administration and SC administration were highly similar (12.7+/-3.7 hours and 12.8+/-4.3 hours, respectively)" and "resulting in an absolute mean (+/- SD) bioavailability of 91.3%+/-6.7%". Both stored values are supported as stored, and because that study has a real IV arm the bioavailability is genuinely absolute. V 35 L and ka 0.5 /h dropped 2026-09-06: the paper states neither, and a search of the ganirelix literature returns no volume of distribution at all — so pairing an unprovenanced volume with a measured absolute F was the double-count this registry has been removing elsewhere.',
    summary: 'ganirelix — half-life and absolute F confirmed as stored; V/ka dropped' },

  { slug: 'kisspeptin', guard: (c) => (c.pk?.IV != null) && c.pk?.IV?.V_L == null,
    pk: { IV: { V_L: 9, F: 1, source_pmid: 'PMID:16174713' } }, hl: { IV: 0.46 },
    note: 'PK is KISSPEPTIN-54 specific. Dhillo 2005 (PMID:16174713), 6 male volunteers, 90-minute IV infusion, verbatim "The plasma half-life of kisspeptin-54 was calculated to be 27.6 +/- 1.1 min" (0.46 h) and "the volume of distribution was 128.9 +/- 12.5 ml/kg" — 9 L at 70 kg, added 2026-09-06 along with the clearance figure of 3.2 mL/kg/min. Both are absolute, from an IV infusion, so they pair safely. IDENTITY CAVEAT: this record carries an unqualified name while every value describes the 54-residue form; the separate kisspeptin-10 record is correctly marked as having no PK of its own, and a consumer must not apply these numbers to the 10-mer.',
    summary: 'kisspeptin — V 9 L added from its own paper; flagged as kisspeptin-54 specific' },

  { slug: 'somatropin', guard: (c) => c.pk?.SC?.ka_hr != null,
    pk: { SC: { F: 0.495, source_pmid: 'PMID:8890721' }, IV: { V_L: 3.46, F: 1, source_pmid: 'PMID:10487702' } },
    hl: { SC: 3.23, IV: 0.2 },
    refs: ['PMID:8890721', 'PMID:17634080'],
    note: 'PK: the SC block is re-sourced entirely. Its previous citation (PMID:33864240) is the right drug in the right species but its abstract is purely qualitative and states none of the four stored values. Bioavailability 0.495 is Laursen 1996 (PMID:8890721), 16 GH-deficient patients in an SC-versus-IV crossover, verbatim "The absolute bioavailability of GH following s.c. relative to i.v. administration was 49.5%" — the stored 0.75 was roughly 50% too high against the only measured human value. Half-life 3.23 h is Langbakke 2007 (PMID:17634080), verbatim "2.28 +/- 00.43 h vs. 3.23 +/- 00.75 h" for dialysis patients against 10 matched healthy individuals; the healthy figure is stored. ka 0.2 /h and V 28 L dropped — neither is established anywhere, and a time to peak of 3.5-4 h (PMID:12412826) contradicts that absorption rate. IV: Bright 1999 (PMID:10487702), 15 subjects under somatostatin suppression, verbatim "terminal half-life, 12.3 min" and "volume of distribution, 3.46 L". CAVEAT: that 3.46 L behaves as a CENTRAL compartment volume — the same abstract\'s clearance of 0.236 L/min with a 12.3 min half-life implies 4.19 L for a true one-compartment fit — so this route understates exposure duration. The IV ka of 60 /h was removed as an abstract-silent sentinel.',
    summary: 'somatropin — SC re-sourced (F 0.75->0.495, half-life 2.6->3.23 h); IV ka sentinel removed' },
];

for (const f of FIXES) {
  const c = need(f.slug);
  if (!f.guard(c)) { log.push(`${f.slug} — already re-sourced, skipped`); continue; }
  c.pk = f.pk;
  c.half_life_hr = f.hl;
  if (f.refs) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary);
}

// ── Records whose PK does not survive at all ──────────────────────────────
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  'bpc-157': ['uncharacterized',
    'No subcutaneous PK exists for BPC-157 in any species. Its cited paper (PMID:36588717) dosed RAT and BEAGLE DOG by IV and IM only, and states a bound rather than a value: "the elimination half-life (t1/2) of prototype BPC157 was less than 30 min". The stored 0.25 h, ka and V appear nowhere. The same paper does give IM absolute bioavailability, 14-19% in rats and 45-51% in dogs, which is species-labelled and route-specific but cannot support an SC row. Human data are limited to pilot studies.',
    ['PMID:36588717']],
  lixisenatide: ['uncharacterized',
    'None of the four stored values is supported. Raccah 2015 (PMID:25115916) reports only that "the terminal half-life was prolonged by ~1.6 times" in elderly subjects, a ratio with no baseline. A PubMed search for a lixisenatide volume of distribution returns no results at all, and the only paper stating a terminal half-life is that same one, which gives no number. The 3 h and 98 L are recognisable approval-document figures with no indexed primary behind them.',
    []],
  'glp-1': ['uncharacterized',
    'The oral route is not defensible for native GLP-1. Its cited paper (PMID:14988249) administered GLP-1 INTRAVENOUSLY — the only thing given by mouth was a 75 g glucose load — so the stored 0.038 h is that study\'s IV half-life, verbatim "2.3 +/- 0.4 min" in healthy controls. Native GLP-1 is degraded by DPP-4 within minutes and has no meaningful oral bioavailability. V 7 L was the registry plasma-volume default and falls below the only human range, 9-26 L (PMID:12519856).',
    ['PMID:12519856']],
  selank: ['uncharacterized',
    'None of the ten stored parameters across the two routes has any source. The citation (PMID:16637290) is a Russian-language radiochemical METHODS paper on tritium-labelled peptides: it reports biodegradation products, no numeric PK, no stated species, and no subcutaneous arm at all — its only in-vivo route is intranasal. The stored SC bioavailability of 1 beside an intranasal 0.06 is the signature of setting an injected route to unity and backing out the nasal fraction.',
    []],
  'pt-141': ['uncharacterized',
    'Neither stored value has a source. Rosen 2004 (PMID:14999221) is a real human bremelanotide study but its abstract reports no pharmacokinetic numbers, and it has NO IV arm, so the stored bioavailability of 0.85 cannot be absolute. A search for an absolute bremelanotide bioavailability returns nothing. The only citable human half-life is INTRANASAL, 1.85-2.09 h (PMID:14963471), which cannot support a subcutaneous row.',
    ['PMID:14963471']],
};
for (const [slug, [reason, n, refs]] of Object.entries(UNAUTHORED)) {
  const c = need(slug);
  if (c.pk_unauthored) { log.push(`${slug} — already pk_unauthored, skipped`); continue; }
  if (n.length > 500) throw new Error(`${slug} note ${n.length} chars > 500`);
  delete c.pk;
  c.half_life_hr = {};
  c.pk_unauthored = { reason, note: n };
  addRefs(c, ...refs);
  log.push(`${slug} — pk stripped, marked ${reason}`);
}

// ── Molecular-weight backfill ─────────────────────────────────────────────
let mwAdded = 0;
for (const [slug, mw] of Object.entries(MW)) {
  const c = need(slug);
  if (c.mw_g_mol) continue;
  c.mw_g_mol = mw;
  mwAdded++;
}
log.push(`molecular weight backfilled on ${mwAdded} peptide records`);

// calcitonin's citation studies SALMON calcitonin, ~40-50x more potent at the
// human receptor than the human peptide; the record must not read as generic.
{
  const c = need('calcitonin');
  note(c, 'PK is SALMON calcitonin (the marketed peptide), verbatim from Beveridge 1976 (PMID:64046), 18 patients: "the elimination half-lives 1 and 1.5 hours" (IM, SC), "The volume of distribution was 11 litres" and "The bioavailability of the intramuscular and subcutaneous forms was found to be 66 and 71% respectively". All three stored values are supported as stored. mw_g_mol 3431.9 is salmon calcitonin (PubChem CID 16220016); human calcitonin is a different peptide at 3417.9 and is not interchangeable. Note the 11 L volume was measured on the IV arm.');
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
