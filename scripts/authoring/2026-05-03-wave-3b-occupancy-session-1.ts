/**
 * 2026-05-03-wave-3b-occupancy-session-1.ts — Wave 3b Hill occupancy.
 *
 * Hill occupancy entries require a published kₑₒ on the same compound
 * (so the solver can compute Ce(t) from plasma). Lint enforces that
 * dependency. Result of this session's literature pass:
 *
 *   ── Verified BOTH Ki/Kd AND kₑₒ in abstracts ──
 *     - escitalopram   Ki  1.1  nM at hSERT (PMID:11543737)
 *                      kₑₒ 0.365 /h, QTc t½kₑₒ 1.9 h (PMID:33647579)
 *     - carvedilol     Kd  4.5  nM at hβ1 ventricle (PMID:1350478)
 *                      kₑₒ 0.35  /h, MAP endpoint (PMID:19545060)
 *
 *   ── Verified Ki only (no abstract-verbatim kₑₒ) — DEFERRED ──
 *     - duloxetine, venlafaxine, vortioxetine (SERT)
 *     - nebivolol, bisoprolol (β1)
 *
 * SSRI/SNRI mood endpoints unfold over weeks, so kₑₒ for serotonin-
 * mediated effects is rarely measured. Cardiac endpoints (QTc) do
 * occur and surfaced for escitalopram. β-blocker kₑₒ is plausible for
 * HR/MAP endpoints but only carvedilol had an abstract carrying the
 * number. Documented in AUTHORING_GAPS.md.
 *
 * Antagonists are encoded with emax=1 + pathway "*_blockade" — the
 * Hill curve still describes fractional occupancy of the blocked
 * receptor; emax must remain in (0, 1] per lint.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Occupancy = {
  receptor: string;
  pathway: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid: string;
  note?: string;
};

type EffectCompartment = {
  keo_per_h: number;
  source_pmid: string;
  note?: string;
};

const KEO_UPDATES: Array<{ slug: string; ec: EffectCompartment }> = [
  { slug: 'escitalopram', ec: { keo_per_h: 0.365, source_pmid: 'PMID:33647579', note: 'QTc prolongation TQT study; t½kₑₒ 1.9 h adult human' } },
  { slug: 'carvedilol',   ec: { keo_per_h: 0.35,  source_pmid: 'PMID:19545060', note: 'MAP endpoint, 20 mg PO, n=20 healthy male; abstract verbatim "Ke0 was (0.35 ± 0.27) h⁻¹"' } },
];

const OCCUPANCY_ENTRIES: Array<{ slug: string; site: Occupancy }> = [
  {
    slug: 'escitalopram',
    site: {
      receptor: 'sert',
      pathway: 'serotonin_reuptake_inhibition',
      emax: 1,
      ec50_mg_l: 0.000357,
      hill_n: 1,
      source_pmid: 'PMID:11543737',
      note: 'Owens 2001 Biol Psych — abstract "K(i) = 1.1 nmol/L" hSERT; emax=1 + blockade-style pathway',
    },
  },
  {
    slug: 'carvedilol',
    site: {
      receptor: 'beta_1',
      pathway: 'beta1_blockade',
      emax: 1,
      ec50_mg_l: 0.001829,
      hill_n: 1,
      source_pmid: 'PMID:1350478',
      note: 'Bristow 1992 — abstract "KD ≈ 4-5 nM" human ventricular myocardium',
    },
  },
];

// Slugs whose occupancy entries from a prior session-1 run must be
// reverted because no abstract-verbatim kₑₒ could be found.
const REVERT_OCCUPANCY = new Set([
  'duloxetine', 'venlafaxine', 'vortioxetine',
  'nebivolol', 'bisoprolol',
]);
const REVERT_PMIDS = new Set([
  'PMID:11750180', // duloxetine + venlafaxine
  'PMID:21486038', // vortioxetine
  'PMID:1681809',  // nebivolol
  'PMID:1691366',  // bisoprolol
]);

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let kEoAdded = 0, kEoSkipped = 0, occAdded = 0, occAlreadyHas = 0, reverted = 0, missing = 0;

  // 1. Add kₑₒ first (needs-keo lint check enforces this dependency).
  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as EffectCompartment | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { kEoSkipped++; continue; }
    c['effect_compartment'] = u.ec;
    kEoAdded++;
  }

  // 2. Revert occupancy entries that lack kₑₒ support.
  for (const slug of REVERT_OCCUPANCY) {
    const c = bySlug.get(slug);
    if (!c) continue;
    const sites = c['receptor_occupancy'] as Occupancy[] | undefined;
    if (!sites) continue;
    const filtered = sites.filter(s => !REVERT_PMIDS.has(s.source_pmid));
    if (filtered.length !== sites.length) {
      reverted += sites.length - filtered.length;
      if (filtered.length === 0) delete c['receptor_occupancy'];
      else c['receptor_occupancy'] = filtered;
    }
  }

  // 3. Add (or upgrade) occupancy entries that have kₑₒ support.
  for (const e of OCCUPANCY_ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c['receptor_occupancy'] as Occupancy[] | undefined) ?? [];
    const idx = existing.findIndex(s => s.receptor === e.site.receptor);
    if (idx >= 0) {
      // Idempotent upgrade: replace if same receptor + same source_pmid + emax differs.
      if (existing[idx].source_pmid === e.site.source_pmid && existing[idx].emax === e.site.emax) {
        occAlreadyHas++; continue;
      }
      existing[idx] = e.site;
    } else {
      existing.push(e.site);
    }
    c['receptor_occupancy'] = existing;
    occAdded++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 1: kₑₒ +${kEoAdded} (skipped ${kEoSkipped}), occupancy +${occAdded} (already-had ${occAlreadyHas}), reverted ${reverted}, missing ${missing}`);
}

main();
