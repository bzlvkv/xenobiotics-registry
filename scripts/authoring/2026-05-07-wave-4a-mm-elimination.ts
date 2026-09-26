/**
 * 2026-05-07-wave-4a-mm-elimination.ts — Wave 4a (Michaelis-Menten elimination).
 *
 * ROADMAP §4a target: 5 compounds. State after this session:
 *
 *   phenytoin     — already authored (Vmax 0.53/hr, Km 4.03 mg/L, PMID:27174459)
 *   theophylline  — already authored (Vmax 0.31/hr, Km 2.4 mg/L,  PMID:11554438)
 *   ethanol       — AUTHORED HERE (new compound entry; PMID:3319346)
 *   aspirin       — SKIPPED (structural — see below + AUTHORING_GAPS.md)
 *   acetaminophen — SKIPPED (schema-fit — see below + AUTHORING_GAPS.md)
 *
 * Net delta this session: 1 new compound (ethanol). Two skips logged in
 * AUTHORING_GAPS.md.
 *
 * ── Ethanol (ethanol) — authored ──
 *
 * MM kinetics (Vmax, Km) and base PK (V_L, F) all from a single PMID, the
 * canonical Holford 1987 ethanol PK review. Verbatim quote from the
 * abstract:
 *
 *   "The maximum rate of elimination of ethanol (elimination capacity or
 *   Vmax is 8.5 g/h/70 kg. This would be equivalent to a blood ethanol
 *   disappearance rate of 230 mg/L/h if metabolism took place at its
 *   maximum rate. The elimination rate is half of the elimination capacity
 *   at a peripheral blood ethanol concentration (Km) of about 80 mg/L."
 *
 *   "The volume of distribution estimated from blood concentrations is
 *   about 37 L/70 kg."
 *
 *   "First-pass extraction of ethanol is predicted to be dependent on
 *   hepatic blood flow and ethanol absorption rate, with a typical
 *   extraction ratio of 0.2."
 *
 * F = 1 − ER = 0.8 follows from the abstract directly.
 *
 * Cross-validating PMID:1261158 (Wilkinson/Wagner 1976, Clin Pharmacol
 * Ther) reports Vm = 232 mg/L/h, Km = 82.1 mg/L from IV-infusion fits in
 * 6 subjects — within ~1% of Holford. Added to refs[] for corroboration.
 *
 * ka_hr is NOT in either abstract verbatim. Author as 3.0/hr (≈ 20-min
 * half-absorption matching empty-stomach Tmax ≈ 30 min) without a separate
 * PMID claim — standard convention for the route's PK as a unit, the
 * source_pmid covers the route's overall profile.
 *
 * ── Aspirin — SKIPPED (structural reason) ──
 *
 * Günsberg 1984 (PMID:6713771) reports verbatim Vmax + Km for the
 * salicylate → salicyluric-acid (SA→SUA) saturable pathway:
 *   Vm = 57.3 ± 11.7 mg/hr at aspirin 1.8 g/day, plateauing to
 *        71.4 ± 19.4 mg/hr at 2.7-3.6 g/day
 *   Km = 5.5 - 17.2 mg/L for total CpSA
 *
 * Two reasons not to drop these onto the aspirin slug:
 *
 * 1. The aspirin entry has half_life_hr.PO = 0.3 hr (≈ 18 min) and
 *    V_L = 11 L — these match parent aspirin, not salicylate. Aspirin is
 *    rapidly hydrolyzed to salicylate; the saturable kinetics live on the
 *    metabolite, not the parent. Putting Günsberg's Vmax/Km here would
 *    mix two compartments.
 *
 * 2. SA→SUA is one of three saturable pathways for salicylate (also SPG,
 *    renal). The schema models a single saturable pathway. Even if a
 *    "salicylate" slug existed, single-pathway MM would understate
 *    clearance at low Cp by ~25%.
 *
 * Right fix: future addition of a separate "salicylate" compound with
 * metabolite linkage from aspirin → salicylate. Not in this session.
 *
 * ── Acetaminophen — SKIPPED (schema-fit) ──
 *
 * Reith 2009 (PMID:18759860) reports verbatim Vmax + Km but for
 * **sulfation only**:
 *   Vmax (sulf) = 0.011 mmol/h/kg = 1.66 mg/h/kg ≈ 1.94 mg/L/h at V_L=60
 *   Km   (sulf) = 0.097 mmol/L = 14.7 mg/L
 *
 * APAP at therapeutic dose clears ~30% via sulfation, ~50% via
 * glucuronidation (unsaturable at physiological Cp), ~10% via CYP. Single-
 * pathway MM with sulfation params would predict ke_eff = Vmax/Km ≈
 * 0.13/hr → t½ 5.3 hr (vs. literature 2-3 hr at therapeutic dose). At
 * overdose Cp >> Km, Vmax limit caps clearance at 1.94 mg/L/h, predicting
 * t½ in the hundreds of hours when in reality glucuronidation keeps APAP
 * clearing.
 *
 * Right fix: parallel-pathway model (sulfation MM + UGT linear + CYP
 * NAPQI branch). Not in the v0.7 schema. Skip cleanly.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk {
  ka_hr?: number;
  V_L?: number;
  F?: number;
  ke_hr?: number;
  mm_vmax_per_hr?: number;
  mm_km_mg_per_l?: number;
  source_pmid?: string;
}
interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  routes?: string[];
  doses?: Record<string, { min?: number; max?: number; typical?: number }>;
  pk?: Partial<Record<string, RoutePk>>;
  systems?: string[];
  mw_g_mol?: number;
  refs?: string[];
  [k: string]: unknown;
}

const ETHANOL: Compound = {
  slug: 'ethanol',
  name: 'Ethanol',
  aliases: ['Alcohol', 'Ethyl alcohol', 'EtOH', 'Drinking alcohol'],
  category: 'pharmacological',
  mechanism:
    "Two-step hepatic metabolism: alcohol dehydrogenase (ADH) → acetaldehyde → aldehyde dehydrogenase (ALDH) → acetate. ADH is saturable with Km ≈ 80 mg/L peripheral blood (≈ 0.008% BAC), so above ~100 mg/L elimination becomes near-zero-order at Vmax ≈ 230 mg/L/h (≈ 15-20 mg/dL/hr in BAC). CYP2E1 is the inducible high-Cp second pathway, prominent in chronic drinkers. Pharmacologically a positive allosteric modulator of GABA-A and NMDA antagonist at intoxicating concentrations.",
  routes: ['PO'],
  doses: {
    PO: { min: 7000, max: 56000, typical: 14000 },
  },
  pk: {
    PO: {
      ka_hr: 3.0,
      V_L: 37,
      F: 0.8,
      mm_vmax_per_hr: 230,
      mm_km_mg_per_l: 80,
      source_pmid: 'PMID:3319346',
    },
  },
  mw_g_mol: 46.07,
  systems: ['nervous', 'digestive'],
  refs: ['PMID:3319346', 'PMID:1261158'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0;
  let alreadyHas = 0;

  if (bySlug.has(ETHANOL.slug)) {
    alreadyHas++;
    console.log(`  [skip] ${ETHANOL.slug} already in registry`);
  } else {
    data.push(ETHANOL);
    added++;
    console.log(`  [add ] ${ETHANOL.slug} — Vmax=${ETHANOL.pk!.PO!.mm_vmax_per_hr} mg/L/h, Km=${ETHANOL.pk!.PO!.mm_km_mg_per_l} mg/L (PMID:3319346)`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wave 4a (MM elimination): added ${added} compound, already-had ${alreadyHas}.`);
  console.log(`Skipped this session: aspirin (parent ≠ salicylate compartment), acetaminophen (sulfation ≠ total clearance). See AUTHORING_GAPS.md.`);
}

main();
