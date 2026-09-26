/**
 * 2026-06-20-wave2-enrichment.ts — flagship PK/receptor enrichment for the
 * wave-2 breadth stubs, where a verbatim abstract value was confirmed inline
 * (the parallel literature agents were knocked out by an API overload, so this
 * pass covers only the values re-verified by hand; the rest stay stubs).
 *
 *   ghb   — PK: terminal plasma t½ 30.4 ± 2.45 min (=0.51 h) after oral 25 mg/kg
 *           in 8 healthy volunteers. Brenneisen 2004 (PMID:15538955) verbatim:
 *           "The terminal plasma elimination half-life was 30.4 +/- 2.45 min".
 *   mdpv  — occupancy: DAT/NET/SERT uptake-blockade IC50s. Baumann 2013
 *           (PMID:23072836) verbatim: "blocks uptake of [3H]dopamine
 *           (IC(50)=4.1 nM) and [3H]norepinephrine (IC(50)=26 nM) with high
 *           potency" and serotonin "IC(50)=3349 nM". emax=1 (full blockade);
 *           keo=2/h documented-approximation, mirroring methylphenidate (PMID
 *           :17228864) — a stimulant reuptake blocker with fast IR onset.
 *
 * Idempotent: re-running is a no-op once the fields are present.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound { slug: string; refs?: string[]; [k: string]: unknown; }

function addRef(c: Compound, pmid: string): void {
  c.refs = c.refs ?? [];
  if (!c.refs.includes(pmid)) c.refs.push(pmid);
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  const changed: string[] = [];

  // ── ghb: oral PK ────────────────────────────────────────────────────────
  const ghb = bySlug.get('ghb');
  if (ghb && !ghb.pk) {
    ghb.half_life_hr = { PO: 0.51 };
    ghb.pk = { PO: { source_pmid: 'PMID:15538955' } };
    ghb.notes = 'PubChem CID 10413. PK: Brenneisen 2004 (PMID:15538955) verbatim "The terminal plasma elimination half-life was 30.4 +/- 2.45 min" after a single oral 25 mg/kg dose in 8 healthy volunteers (=0.51 h). GABA-B occupancy deferred.';
    addRef(ghb, 'PMID:15538955');
    changed.push('ghb (+pk)');
  }

  // ── mdpv: DAT/NET/SERT uptake-blockade occupancy + keo ──────────────────
  const mdpv = bySlug.get('mdpv');
  if (mdpv && !mdpv.receptor_occupancy) {
    mdpv.effect_compartment = {
      keo_per_h: 2.0,
      note: 'Approximation; no published keo. Stimulant reuptake blocker with fast onset — mirrors methylphenidate (PMID:17228864, keo ≈2/h).',
    };
    mdpv.receptor_occupancy = [
      { receptor: 'dat', pathway: 'dopamine_reuptake_inhibition', emax: 1, ec50_mg_l: 0.001129, hill_n: 1, source_pmid: 'PMID:23072836',
        note: 'Baumann 2013 (PMID:23072836) verbatim: "MDPV blocks uptake of [3H]dopamine (IC(50)=4.1 nM) ... with high potency". Rat brain synaptosomes; IC50 as EC50 proxy. ec50 = 4.1 nM × 275.34 / 1e6.' },
      { receptor: 'net', pathway: 'norepinephrine_reuptake_inhibition', emax: 1, ec50_mg_l: 0.007159, hill_n: 1, source_pmid: 'PMID:23072836',
        note: 'Baumann 2013 (PMID:23072836) verbatim: "[3H]norepinephrine (IC(50)=26 nM) with high potency". ec50 = 26 nM × 275.34 / 1e6.' },
      { receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1, ec50_mg_l: 0.922114, hill_n: 1, source_pmid: 'PMID:23072836',
        note: 'Baumann 2013 (PMID:23072836) verbatim: MDPV "weak effects on uptake of [3H]serotonin (IC(50)=3349 nM)" — ~800× weaker than DAT, so serotonergic occupancy is negligible. ec50 = 3349 nM × 275.34 / 1e6.' },
    ];
    mdpv.notes = 'PubChem CID 20111961 (free base). Potent, selective catecholamine reuptake blocker (no release). DAT/NET/SERT IC50s from Baumann 2013. Plasma t½ deferred.';
    addRef(mdpv, 'PMID:23072836');
    changed.push('mdpv (+occ dat/net/SERT)');
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(changed.length ? `Enriched: ${changed.join(', ')}` : 'No changes (already enriched).');
}

main();
