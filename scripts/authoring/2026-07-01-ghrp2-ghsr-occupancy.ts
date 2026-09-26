/**
 * 2026-07-01-ghrp2-ghsr-occupancy.ts
 *
 * Data-quality-remediation track #2 (occupancy receptor-vocabulary extension):
 * wire the GHSR (ghrelin receptor) occupancy slug and author GHRP-2's row —
 * the ONE compound in the track that survives independent verification.
 *
 * Companion code change (same commit): `ghsr: 'GHSR'` added to
 * OCCUPANCY_TO_CATALOG in apps/app/src/lib/receptors.ts. GHSR already exists in
 * receptors.json (gtp_id 246), so no catalog edit is needed; GHRP-2 is an
 * agonist, so direction.ts (ACTIVATES_RE handles "agonist") needs no edit.
 *
 * ── Provenance (each value re-verified against source, not trusted from log) ──
 * mw_g_mol = 818.0            PubChem CID 6918245 (pralmorelin / GHRP-2),
 *                             C45H55N9O6 — "pralmorelin" + "GHRP-2" both resolve
 *                             to this CID.
 *
 * affinity: GtoPdb-curated rat GHS-R full-agonist pKi 9.3 → Ki 0.501 nM
 *   (GtoPdb ligand 1092, interaction 2832; primary McKee 1997, PMID:9092793).
 *   This is a competition-binding TABLE value — McKee 1997's ABSTRACT reports
 *   only the [35S]MK-0677 radioligand KD (0.7 nM), NOT a GHRP-2 Ki. GtoPdb-
 *   curated table values are the registry's accepted occupancy standard (cf.
 *   the rauwolscine α2 rows); flagged as rat + table-derived in the note. No
 *   human GHRP-2 affinity is published.
 *   ec50_mg_l = 0.501 nM × 818.0 / 1e6 = 0.00041.  emax 1 (full agonist), hill 1.
 *
 * keo = 1.13/h             Human PK-PD, VERBATIM in the abstract of Pihoker 1998
 *                          (PMID:9543135): "PD parameters for GHRP-2 were: Ke0 =
 *                          1.13 +/- 0.94 h(-1)" — a paediatric phase-I IV study,
 *                          sigmoid-Emax link model on the GH-release endpoint.
 *                          Same study already anchors the SC t½ 0.55 h / pk.SC.
 *
 * NB — sermorelin (the track's other supposed win) was investigated the same
 * pass and NOT authored: its keo (PMID:7586605) is absent from that abstract
 * (peak-GH/AUC bolus comparison, no PK-PD model) and its affinity (Gaudreau
 * 1992, PMID:1534126) is a RELATIVE-affinity (RA %) analogue study with no
 * absolute pIC50 for sermorelin itself; GtoPdb lists no numeric GHRHR affinity.
 * Both blockers recorded in AUTHORING_GAPS.md. Idempotent (skips if applied).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  mw_g_mol?: number;
  refs?: string[];
  effect_compartment?: { keo_per_h: number; source_pmid?: string; note?: string };
  receptor_occupancy?: Array<{ receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string }>;
  [k: string]: unknown;
}

const GHRP2_KEO: Compound['effect_compartment'] = {
  keo_per_h: 1.13,
  source_pmid: 'PMID:9543135',
  note: 'Human PK-PD keo, Ke0 = 1.13 ± 0.94 /h (sigmoid-Emax link model on the GH-release endpoint), verbatim in the abstract of the paediatric phase-I i.v. study Pihoker 1998 (PMID:9543135) — the same study that anchors the SC t½ 0.55 h.',
};

const GHRP2_OCCUPANCY: Compound['receptor_occupancy'] = [
  {
    receptor: 'ghsr',
    pathway: 'agonist',
    emax: 1,
    ec50_mg_l: 0.00041,
    hill_n: 1,
    source_pmid: 'PMID:9092793',
    note: 'GtoPdb-curated rat GHS-R (ghrelin receptor) full-agonist pKi 9.3 → Ki 0.501 nM (GtoPdb ligand 1092 / interaction 2832; primary McKee 1997, PMID:9092793). The value is a competition-binding table entry — McKee’s abstract quotes only the [35S]MK-0677 radioligand KD (0.7 nM). Rat affinity; no human GHRP-2 Ki is published. ec50 = 0.501 nM × 818.0 g/mol / 1e6 = 0.00041 mg/L.',
  },
];

function addRef(c: Compound, pmid: string): void {
  c.refs = c.refs ?? [];
  if (!c.refs.includes(pmid)) c.refs.push(pmid);
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let changed = 0;

  const g = bySlug.get('ghrp-2');
  if (!g) {
    console.error('  [ERROR] ghrp-2 not found');
    process.exit(1);
  }
  if (g.receptor_occupancy && g.receptor_occupancy.length) {
    console.log('  [skip] ghrp-2 already has receptor_occupancy');
  } else {
    g.mw_g_mol = 818.0;
    g.effect_compartment = GHRP2_KEO;
    g.receptor_occupancy = GHRP2_OCCUPANCY;
    addRef(g, 'PMID:9092793');
    addRef(g, 'PMID:9543135');
    console.log('  [rich] ghrp-2 + occupancy(ghsr) + keo 1.13/h + mw 818.0');
    changed++;
  }

  if (changed) writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nGHRP-2 GHSR occupancy (2026-07-01): ${changed} compound(s) updated.`);
}

main();
