/**
 * 2026-05-25-wave1-banked-ki-keo-unblock.ts — attach occupancy to compounds
 * whose Kᵢ was already verified in AUTHORING_GAPS but were blocked only on kₑₒ.
 *
 * Wave 1 of the "full PD coverage" push. Each Kᵢ here was re-verified VERBATIM
 * against its primary abstract (parallel agents, 2026-05-25); two on-file
 * citations turned out to be smells and were corrected (see below). No abstract
 * reports a measured kₑₒ for any of these — expected — so each carries a
 * documented-approximation kₑₒ in the caffeine/H1 style, anchored to a real
 * effect-onset / occupancy-time-course paper and flagged in the note.
 *
 * ec50_mg_l = Kᵢ(nM) · MW(g/mol) / 1e6. All are antagonists/blockers/inhibitors
 * or (hydrocodone) a clinically full agonist → emax 1.0, hill_n 1.
 *
 * ── Authored (9 compounds) ─────────────────────────────────────────────────
 *  SERT (transporter): duloxetine 0.8 nM, venlafaxine 82 nM, vortioxetine 1.6 nM
 *    — Kᵢ human, verbatim (Bymaster 2001 PMID:11750180 for the SNRIs; Bang-
 *    Andersen 2011 PMID:21486038 for vortioxetine). kₑₒ ≈ 0.4/h: SERT *binding*
 *    occupancy equilibrates over hours (distinct from the slow mood effect) per
 *    human [11C]DASB/[11C]MADAM PET time-courses.
 *  β1 (ADRB1): nebivolol 0.9 nM, bisoprolol 20 nM — kₑₒ ≈ 2.5/h, class-typical
 *    β-blocker HR endpoint (bisoprolol shows NO hysteresis vs plasma).
 *  µ-opioid (OPRM1): hydrocodone 19.8 nM — kₑₒ ≈ 2.0/h, opioid CNS equilibration.
 *  D2 (DRD2): haloperidol Kd 7.42 nM — kₑₒ ≈ 0.5/h, PET D2 occupancy high by 3 h.
 *  Naᵥ: lidocaine, bupivacaine — IC50 (not Kᵢ), Xenopus tonic block; curve is
 *    SYSTEMIC Nav engagement (low at therapeutic plasma). kₑₒ ≈ 4/h (cardiac
 *    effect tracks plasma, no effect compartment).
 *
 * ── Corrections to AUTHORING_GAPS provenance ───────────────────────────────
 *  • nebivolol β1: on-file PMID:1681809 does NOT state a verbatim β1 Kᵢ (it
 *    reports cAMP potencies + "sub-nanomolar"). Verbatim Kᵢ = 0.9 nM is in
 *    PMID:2462161 (rabbit lung, [3H]CGP-12177). Using that instead.
 *
 * ── Skipped ─────────────────────────────────────────────────────────────────
 *  • mepivacaine (Naᵥ): IC50 149 µM verified (PMID:9768788) but NO verifiable
 *    kₑₒ / effect-onset anchor — lint needs kₑₒ. Logged in AUTHORING_GAPS.
 *
 * Idempotent: re-running skips compounds that already carry the row.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy {
  receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string;
}
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound {
  slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown;
}
interface Authoring { slug: string; effect_compartment: EffectCompartment; receptor_occupancy: ReceptorOccupancy[]; }

const ENTRIES: Authoring[] = [
  {
    slug: 'duloxetine',
    effect_compartment: { keo_per_h: 0.4, source_pmid: 'PMID:16506079', note: 'Approximation; no published kₑₒ. Takano 2006 human [11C]DASB PET: "mean occupancies were 81.8% at 6 h ... after a single administration" — CNS SERT binding-occupancy equilibrates over hours (≈t½kₑₒ 2 h), distinct from the weeks-long mood effect.' },
    receptor_occupancy: [{ receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1.0, ec50_mg_l: 0.000238, hill_n: 1, source_pmid: 'PMID:11750180', note: 'Bymaster 2001 verbatim: "Duloxetine inhibited binding to the human NE and 5-HT transporters with K(i) values of 7.5 and 0.8 nM, respectively". Human transporter binding. ec50 = 0.8 nM × 297.41 / 1e6.' }],
  },
  {
    slug: 'venlafaxine',
    effect_compartment: { keo_per_h: 0.4, source_pmid: 'PMID:17497139', note: 'Approximation; no published kₑₒ. Voineskos 2007 human [11C]DASB PET shows ~85% striatal SERT occupancy at therapeutic dose; CNS binding occupancy equilibrates over hours. Class-typical SSRI/SNRI kₑₒ ≈ 0.4/h (cf duloxetine PET time-course).' },
    receptor_occupancy: [{ receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1.0, ec50_mg_l: 0.022747, hill_n: 1, source_pmid: 'PMID:11750180', note: 'Bymaster 2001 verbatim: "Venlafaxine inhibited binding to the human NE and 5-HT transporters with K(i) values of 2480 and 82 nM, respectively". Human transporter binding. ec50 = 82 nM × 277.4 / 1e6.' }],
  },
  {
    slug: 'vortioxetine',
    effect_compartment: { keo_per_h: 0.4, source_pmid: 'PMID:23428337', note: 'Approximation; no published kₑₒ. Stenkrona 2013 human [11C]MADAM PET: SERT occupancy 2→97% across single-dose→9-day, apparent KD(ND) 16.7 nM. CNS binding occupancy equilibrates over hours.' },
    receptor_occupancy: [{ receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1.0, ec50_mg_l: 0.000478, hill_n: 1, source_pmid: 'PMID:21486038', note: 'Bang-Andersen 2011 verbatim: "Lu AA21004 ... high affinity for recombinant human 5-HT(1A) (K(i) = 15 nM) ... and SERT (K(i) = 1.6 nM)". Recombinant human SERT. ec50 = 1.6 nM × 298.45 / 1e6.' }],
  },
  {
    slug: 'nebivolol',
    effect_compartment: { keo_per_h: 2.5, source_pmid: 'PMID:2462161', note: 'Approximation; no compound-specific kₑₒ. Class-typical β-blocker HR-endpoint kₑₒ (cf atenolol 2.52/h PMID:17420778). Anchored to the β1-binding paper; nebivolol HR/BP effect onset is rapid.' },
    receptor_occupancy: [{ receptor: 'beta_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.000365, hill_n: 1, source_pmid: 'PMID:2462161', note: 'Van de Water 1988 verbatim: "Nebivolol revealed high affinity and selectivity for beta 1-adrenergic receptor sites in the rabbit lung membrane preparation (Ki value = 0.9 nM and beta 2/beta 1 ratio = 50)". Rabbit lung, [3H]CGP-12177. (On-file PMID:1681809 lacked a verbatim β1 Kᵢ — corrected.) ec50 = 0.9 nM × 405.43 / 1e6.' }],
  },
  {
    slug: 'bisoprolol',
    effect_compartment: { keo_per_h: 2.5, source_pmid: 'PMID:7516019', note: 'Approximation; no published kₑₒ. Leopold 1986 (5 mg IV, n=10): "direct relationship (no hysteresis) between beta-blockade and plasma concentrations" — effect equilibrates essentially with plasma; class-typical β-blocker kₑₒ.' },
    receptor_occupancy: [{ receptor: 'beta_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.006509, hill_n: 1, source_pmid: 'PMID:1691366', note: 'Horinouchi 1991 verbatim: "bisoprolol revealed two binding sites ... with Ki(1) = 34.2 and 20.0 nM and Ki(2) = 3,014 and 918 nM, respectively". Rat ventricular myocytes, [3H]CGP-12177; high-affinity site Kᵢ 20 nM used. ec50 = 20 nM × 325.44 / 1e6.' }],
  },
  {
    slug: 'hydrocodone',
    effect_compartment: { keo_per_h: 2.0, source_pmid: 'PMID:17786418', note: 'Approximation; no hydrocodone-specific kₑₒ. Order-of-magnitude from the dihydrocodeine analog (Schmidt 2007: plasma→effect-site t½ ≈ 21 min for miosis → kₑₒ ≈ 2/h). Different compound — explicit analog basis.' },
    receptor_occupancy: [{ receptor: 'mu_opioid', pathway: 'analgesia', emax: 1.0, ec50_mg_l: 0.005927, hill_n: 1, source_pmid: 'PMID:1851921', note: 'Chen 1991 verbatim: "hydrocodone, Ki = 19.8 nM". Rat brain homogenate, [3H]DAMGO displacement. Clinically a full µ agonist. ec50 = 19.8 nM × 299.36 / 1e6.' }],
  },
  {
    slug: 'haloperidol',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:1533719', note: 'Approximation; no published kₑₒ. Nordström 1992 human PET: "D2-dopamine receptor occupancy was high already 3 h after administration ... and remained high for at least 27 h" — central D2 engagement fast (hours), distinct from the delayed antipsychotic response.' },
    receptor_occupancy: [{ receptor: 'dopamine_d2', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.002789, hill_n: 1, source_pmid: 'PMID:1361536', note: 'Tsuchihashi 1992 verbatim: "the Kd and Bmax values were 7.42 +/- 1.03 nM and 1.58 +/- 0.20 pmol (mg protein)-1". Rat striatum, [3H]haloperidol direct binding (Kd, not Ki). ec50 = 7.42 nM × 375.86 / 1e6.' }],
  },
  {
    slug: 'lidocaine',
    effect_compartment: { keo_per_h: 4.0, source_pmid: 'PMID:2085708', note: 'Approximation; no published kₑₒ. Isolated perfused rabbit heart (lignocaine QRS effect modelled in the central compartment, no effect-compartment lag; terminal t½ 11 min) — systemic Nav effect tracks plasma on a minutes timescale → fast kₑₒ.' },
    receptor_occupancy: [{ receptor: 'nav', pathway: 'na_channel_block', emax: 1.0, ec50_mg_l: 47.81, hill_n: 1, source_pmid: 'PMID:9768788', note: 'Bräu 1998 verbatim: "IC50 ... lidocaine 204 microM". Xenopus sciatic nerve, outside-out patch, tonic Na⁺ block — IC50 (not Kᵢ), reflects SYSTEMIC Nav engagement (low at therapeutic plasma). ec50 = 204 µM × 234.34 / 1e3.' }],
  },
  {
    slug: 'bupivacaine',
    effect_compartment: { keo_per_h: 4.0, source_pmid: 'PMID:8368546', note: 'Approximation; no published kₑₒ. Isolated perfused rabbit heart: QRS effect described by an Emax model in relation to central-compartment concentration (no effect compartment) — systemic Nav effect tracks plasma → fast kₑₒ.' },
    receptor_occupancy: [{ receptor: 'nav', pathway: 'na_channel_block', emax: 1.0, ec50_mg_l: 7.788, hill_n: 1, source_pmid: 'PMID:9768788', note: 'Bräu 1998 verbatim: "bupivacaine 27 microM" (IC50, tonic Na⁺ block). Xenopus sciatic nerve, outside-out patch — IC50 (not Kᵢ), systemic Nav engagement. ec50 = 27 µM × 288.43 / 1e3.' }],
  },
];

function addRef(c: Compound, pmid?: string): void {
  if (!pmid) return;
  c.refs = c.refs ?? [];
  if (!c.refs.includes(pmid)) c.refs.push(pmid);
}

function apply(c: Compound, a: Authoring): { keo: boolean; occ: number; skip: number } {
  let keo = false;
  if (c.effect_compartment?.keo_per_h != null) {
    console.log(`  [skip] ${c.slug.padEnd(14)} keo already authored`);
  } else {
    c.effect_compartment = a.effect_compartment;
    addRef(c, a.effect_compartment.source_pmid);
    keo = true;
    console.log(`  [add ] ${c.slug.padEnd(14)} keo=${a.effect_compartment.keo_per_h}/h  ${a.effect_compartment.source_pmid}`);
  }
  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let occ = 0, skip = 0;
  for (const row of a.receptor_occupancy) {
    if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { skip++; console.log(`  [skip] ${c.slug.padEnd(14)} @ ${row.receptor} already authored`); continue; }
    c.receptor_occupancy.push(row);
    addRef(c, row.source_pmid);
    occ++;
    console.log(`  [add ] ${c.slug.padEnd(14)} @ ${row.receptor.padEnd(12)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
  }
  return { keo, occ, skip };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let keoAdded = 0, occAdded = 0, occSkipped = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    const r = apply(c, a);
    if (r.keo) keoAdded++;
    occAdded += r.occ; occSkipped += r.skip;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 1 banked-Kᵢ unblock: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
