/**
 * author-kinetics.ts — apply verified Ki / induction_factor / receptor
 * occupancy / PK source_pmid data to the registry.
 *
 * Every value below has a verified PMID + verbatim quote captured in
 * the agent verification reports. No fabricated citations. Run once
 * with `tsx scripts/author-kinetics.ts`.
 *
 * Why a script instead of hand-editing JSON:
 *   - 8 kinetic edges × 4 PK PMIDs × 2 receptor entries — applying
 *     them as 14 separate Edit calls is fragile.
 *   - The verifier's PMID set is downstream of compounds.json. Adding
 *     all citations atomically and re-running verify-registry catches
 *     any typos in PMIDs in one round-trip.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', 'packages', 'registry', 'data', 'compounds.json');

interface Kinetics {
  ki_uM?: number;
  induction_factor?: number;
  plasma_binding_displacement?: number;
}

interface InteractionRef {
  slug: string;
  name: string;
  level: string;
  note: string;
  timing?: string;
  kinetics?: Kinetics;
  source_pmid?: string;
}

interface Compound {
  slug: string;
  interactions?: InteractionRef[];
  pk?: Record<string, { source_pmid?: string; [k: string]: unknown } | undefined>;
  receptor_occupancy?: Array<{
    receptor: string;
    pathway?: string;
    emax: number;
    ec50_mg_l: number;
    hill_n: number;
    source_pmid?: string;
  }>;
  [k: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Authoring data — every entry verified per the agent reports
// ─────────────────────────────────────────────────────────────────────────────

interface KineticEdgeAuthoring {
  from: string;             // perpetrator slug
  to: string;               // victim slug — must match an existing edge in `from.interactions[]`
  kinetics: Kinetics;
  source_pmid: string;
  /** Replaces the existing edge's note. Should explain the math + caveat. */
  note: string;
}

const KINETIC_EDGES: KineticEdgeAuthoring[] = [
  // ── CYP induction (St John's Wort cluster + alcohol) ────────────────
  {
    from: 'st-johns-wort',
    to: 'cyclosporine',
    kinetics: { induction_factor: 2.08 },
    source_pmid: 'PMID:15470332',
    note: 'CYP3A4 + P-gp induction by hyperforin. Mai 2004 (n=10 renal transplant, crossover): cyclosporine AUC ↓52% after 2 weeks SJW → ke ratio ≈ 2.08. Acute transplant rejection documented; combination is contraindicated in transplant patients.',
  },
  {
    from: 'st-johns-wort',
    to: 'tacrolimus',
    kinetics: { induction_factor: 1.55 },
    source_pmid: 'PMID:14681346',
    note: 'CYP3A4 + P-gp induction. Hebert 2004 (n=10 healthy, 18 d SJW 300 mg TID): tacrolimus AUC 306.9 → 198.7 µg·h/L (ratio 0.647) → ke ratio ≈ 1.55. Sub-therapeutic levels → rejection risk; contraindicated in transplant.',
  },
  {
    from: 'st-johns-wort',
    to: 'warfarin',
    kinetics: { induction_factor: 1.29 },
    source_pmid: 'PMID:15089812',
    note: 'CYP2C9 + CYP3A4 induction. Jiang 2004 (n=12, 14 d SJW): S-warfarin apparent CL ratio 1.29 (90% CI 1.16–1.46). Monitor INR; expect modest reduction in effect.',
  },
  {
    from: 'st-johns-wort',
    to: 'hormonal-contraceptives',
    kinetics: { induction_factor: 1.16 },
    source_pmid: 'PMID:15914127',
    note: 'CYP3A4 induction reduces ethinylestradiol exposure. Murphy 2005 (n=16, 2 cycles SJW 300 mg TID): EE AUC ↓~14% → ke ratio ≈ 1.16. Kinetic effect is small; the clinical contraceptive failure is driven more by progestin trough loss + breakthrough ovulation than AUC alone — backup contraception still required.',
  },
  {
    from: 'alcohol',
    to: 'acetaminophen',
    // CYP2E1 induction by chronic ethanol raises CL of CYP2E1 substrates by
    // ~73% (Girre 1994 chlorzoxazone probe). APAP is only ~5–10% cleared
    // via CYP2E1 (the NAPQI / toxicity pathway), so the effective bump on
    // total APAP clearance is much smaller — author conservatively at 1.07.
    // The dominant clinical concern is glutathione depletion + NAPQI rise,
    // not total-AUC kinetics; the kinetic adjustment here is incidental.
    kinetics: { induction_factor: 1.07 },
    source_pmid: 'PMID:7910460',
    note: 'Chronic ethanol induces CYP2E1 (CL ↑73% in alcoholics, Girre 1994 chlorzoxazone probe). APAP is only ~5–10% cleared by CYP2E1 (the NAPQI/toxic pathway), so the total-clearance bump is small (~7%). The clinical concern is glutathione depletion + raised NAPQI causing hepatotoxicity at lower APAP doses — not kinetic AUC shift. Limit APAP ≤2 g/d in heavy drinkers.',
  },
  // ── CYP inhibition (Ki-based) ────────────────────────────────────────
  {
    from: 'gemfibrozil',
    to: 'simvastatin',
    // Ogilvie 2006: gemfibrozil glucuronide is the actual CYP2C8
    // inactivator (TDI), with K_I 20–52 µM and k_inact 0.21/min. We
    // approximate as a competitive Ki at the midpoint (35 µM) since
    // the solver doesn't model time-dependent inactivation — caveat
    // in the note. Real-world clinical effect is bigger than this
    // Ki suggests because TDI accumulates over repeated dosing.
    kinetics: { ki_uM: 35 },
    source_pmid: 'PMID:16299161',
    note: 'Gemfibrozil glucuronide is a mechanism-based CYP2C8 inactivator (Ogilvie 2006: K_I 20–52 µM, k_inact 0.21/min in HLM). Solver approximates as competitive Ki = 35 µM (midpoint); time-dependent inactivation accumulates over repeated dosing, so real clinical AUC effect is larger than this static approximation. FDA explicitly warns against this combination — use is contraindicated.',
  },
  {
    from: 'piperine',
    to: 'colchicine',
    kinetics: { ki_uM: 5.4 },
    source_pmid: 'PMID:18480186',
    note: 'Piperine is a noncompetitive CYP3A4 inhibitor in HLM. Volak 2008: Ki 5.4 ± 0.3 µM (IC50 5.5 µM). Raises colchicine exposure toward toxic range; concurrent dosing with high-piperine spices (black pepper, "BioPerine" supplements) is worth flagging in patients on chronic colchicine.',
  },
  {
    from: 'schisandra',
    to: 'tacrolimus',
    kinetics: { ki_uM: 5 },
    source_pmid: 'PMID:20448858',
    // Li 2010 reports rat liver microsome Ki for the two main lignans;
    // the solver treats schisandra as a single perpetrator with the
    // average Ki of the two actives (5.83 µM and 4.24 µM → ~5 µM).
    // Species caveat: rat HLM, not human. Clinical reports of 2–3×
    // tacrolimus AUC bumps are consistent with strong CYP3A4
    // inhibition.
    note: 'Schisandrin A + B inhibit CYP3A in rat liver microsomes (Li 2010: Ki 5.83 + 4.24 µM respectively; solver uses average ≈ 5 µM). Species caveat: human Ki not yet published in abstract. Schisandra raises tacrolimus AUC 2–3× clinically — paradoxical "natural drug-interaction enhancer" pattern.',
  },
];

interface PkPmidAuthoring {
  slug: string;
  route: string;
  source_pmid: string;
}

const PK_PMIDS: PkPmidAuthoring[] = [
  { slug: 'ala', route: 'PO', source_pmid: 'PMID:22193379' },
  { slug: 'dichloroacetate', route: 'PO', source_pmid: 'PMID:16611621' },
  { slug: 'epa-dha', route: 'PO', source_pmid: 'PMID:22242645' },
  { slug: 'trimetazidine', route: 'PO', source_pmid: 'PMID:21899207' },
];

interface ReceptorAuthoring {
  slug: string;
  receptor: string;
  pathway: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid: string;
  /** Documentation only — captured in a `note` field on the entry if the
   *  schema allowed; for now we trust the source_pmid trail + comment here. */
  provenance: string;
}

const RECEPTORS: ReceptorAuthoring[] = [
  {
    slug: 'glycine',
    receptor: 'glycine_receptor_alpha1',
    pathway: 'glycine',
    emax: 1.0,
    // De Saint Jan 2001: EC50 range 25-280 µM in alpha-1 homomeric GlyR.
    // Midpoint 152.5 µM × 75.07 g/mol / 1000 = 11.45 mg/L. The abstract
    // gives a range, not a point estimate — surface should treat this
    // ec50 with a wide tolerance band when displayed (~5x range).
    ec50_mg_l: 11.45,
    hill_n: 1, // abstract states Hill "remained stable" without a value; default 1 (simple binding)
    source_pmid: 'PMID:11559772',
    provenance: 'De Saint Jan 2001 (J Physiol), Xenopus oocytes, GlyR α1 EC50 25–280 µM (midpoint).',
  },
  {
    slug: 'taurine',
    receptor: 'glycine_receptor',
    pathway: 'glycine',
    emax: 1.0,
    // Nguyen 2013: depolarization EC50 = 84.3 µM × 125.15 / 1000 = 10.55 mg/L.
    // (Inward current EC50 was higher at 723 µM = 90 mg/L; depolarization
    // is the more functionally relevant value for the user-facing
    // occupancy curve.)
    ec50_mg_l: 10.55,
    hill_n: 1, // not reported verbatim; defaulted
    source_pmid: 'PMID:24379976',
    provenance: 'Nguyen 2013 (Neural Plast), rat trigeminal SG neurons, depolarization EC50 84.3 µM.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Apply
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let kineticsApplied = 0;
  let pkApplied = 0;
  let receptorsApplied = 0;
  const skipped: string[] = [];

  // 1. Kinetic edges — find the existing edge in perpetrator.interactions[]
  //    matching the victim slug. Mutate in place, set kinetics + source_pmid
  //    + (optionally) update the note text.
  for (const edge of KINETIC_EDGES) {
    const perp = bySlug.get(edge.from);
    if (!perp) {
      skipped.push(`kinetics ${edge.from}→${edge.to}: perpetrator not found`);
      continue;
    }
    const existing = perp.interactions?.find(e => e.slug === edge.to);
    if (!existing) {
      skipped.push(`kinetics ${edge.from}→${edge.to}: edge missing in perpetrator's interactions[]`);
      continue;
    }
    if (existing.kinetics) {
      skipped.push(`kinetics ${edge.from}→${edge.to}: already has kinetics — leaving as-is`);
      continue;
    }
    existing.kinetics = edge.kinetics;
    existing.source_pmid = edge.source_pmid;
    existing.note = edge.note;
    kineticsApplied++;
  }

  // 2. PK source_pmid backfills.
  for (const p of PK_PMIDS) {
    const c = bySlug.get(p.slug);
    if (!c?.pk) {
      skipped.push(`pk pmid ${p.slug}: compound or pk missing`);
      continue;
    }
    const route = c.pk[p.route];
    if (!route) {
      skipped.push(`pk pmid ${p.slug}: route ${p.route} missing in pk`);
      continue;
    }
    if (route.source_pmid) {
      skipped.push(`pk pmid ${p.slug} ${p.route}: already has source_pmid`);
      continue;
    }
    route.source_pmid = p.source_pmid;
    pkApplied++;
  }

  // 3. Receptor occupancy entries.
  for (const r of RECEPTORS) {
    const c = bySlug.get(r.slug);
    if (!c) {
      skipped.push(`receptor ${r.slug}: compound not found`);
      continue;
    }
    if (!c.receptor_occupancy) c.receptor_occupancy = [];
    if (c.receptor_occupancy.some(x => x.receptor === r.receptor)) {
      skipped.push(`receptor ${r.slug} ${r.receptor}: already authored`);
      continue;
    }
    c.receptor_occupancy.push({
      receptor: r.receptor,
      pathway: r.pathway,
      emax: r.emax,
      ec50_mg_l: r.ec50_mg_l,
      hill_n: r.hill_n,
      source_pmid: r.source_pmid,
    });
    receptorsApplied++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log(`Authoring complete:`);
  console.log(`  ${kineticsApplied} interaction kinetics blocks applied`);
  console.log(`  ${pkApplied} PK source_pmid citations added`);
  console.log(`  ${receptorsApplied} receptor_occupancy entries added`);
  if (skipped.length > 0) {
    console.log(`\nSkipped (${skipped.length}):`);
    for (const s of skipped) console.log(`  - ${s}`);
  }
}

main();
