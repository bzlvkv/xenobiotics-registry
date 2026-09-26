/**
 * 2026-05-04-wave-3b-occupancy-session-3.ts — Wave 3b session 3.
 *
 * 3 verified BZD GABA-A occupancy entries on compounds whose kₑₒ
 * landed in Wave 3a session 5 (and lorazepam from earlier).
 * Plus 1 kₑₒ for pregabalin from a parallel agent (Wave 3a addendum).
 *
 *   ── GABA-A BZD site (sedation) ──
 *     - midazolam   Kd 59.25 nM  human cortex, [123I]iomazenil SPECT (PMID:8282018, Videbaek 1993)
 *     - diazepam    Ki 10    nM  rat brain BZD sites (PMID:3017047, Saano 1986)
 *     - lorazepam   IC50 5  nM  cerebral [3H]diazepam displacement (PMID:6246535, Braestrup 1980)
 *
 *   ── kₑₒ addendum ──
 *     - pregabalin  kₑₒ 0.552 /h  rat brain ECF microdialysis, anticonvulsant
 *                                 endpoint (PMID:11554426). Abstract verbatim
 *                                 "ECe50 and Keo values were 95.3 ng/mL and
 *                                 0.0092 min-1". 0.0092 × 60 = 0.552 /h.
 *
 * Skipped this round:
 *  - alfentanil μ-opioid Ki upgrade (Cox 1998 PMID:9495871 reports a true
 *    radioligand Ki of 47.4 nM at rat brain MOR — higher quality than the
 *    GPI functional EC50 already authored in session 2). Deferred to avoid
 *    duplicate entries; will replace in a future cleanup pass once a
 *    receptor-edit primitive lands.
 *  - haloperidol, risperidone, olanzapine, aripiprazole, quetiapine,
 *    atorvastatin, rosuvastatin, ezetimibe, methylphenidate, amphetamine,
 *    gabapentin, bupropion, mirtazapine — abstracts paraphrase or report
 *    only EC50 / Cmax / kon-koff. No verbatim kₑₒ.
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

const OCCUPANCY_ENTRIES: Array<{ slug: string; site: Occupancy }> = [
  {
    slug: 'midazolam',
    site: {
      receptor: 'gaba_a_bzd', pathway: 'sedation', emax: 1, hill_n: 1,
      ec50_mg_l: 0.0193, source_pmid: 'PMID:8282018',
      note: 'Videbaek 1993 — abstract verbatim "Kd … for midazolam, 73, 76, 58 and 30 nmol/l plasma water"; mean 59.25 nM. Human cortex, [123I]iomazenil SPECT. MW 325.77',
    },
  },
  {
    slug: 'diazepam',
    site: {
      receptor: 'gaba_a_bzd', pathway: 'sedation', emax: 1, hill_n: 1,
      ec50_mg_l: 0.00285, source_pmid: 'PMID:3017047',
      note: 'Saano 1986 — abstract verbatim "Diazepam exhibited the highest affinity for all binding sites (Ki values at 0.01 microM level)" = 10 nM, rat brain BZD sites. MW 284.74',
    },
  },
  {
    slug: 'lorazepam',
    site: {
      receptor: 'gaba_a_bzd', pathway: 'sedation', emax: 1, hill_n: 1,
      ec50_mg_l: 0.00161, source_pmid: 'PMID:6246535',
      note: 'Braestrup 1980 PNAS — abstract verbatim "ca. 5 nM for the potent benzodiazepine lorazepam"; cerebral [3H]diazepam displacement. MW 321.16',
    },
  },
];

const KEO_UPDATES = [
  { slug: 'pregabalin', ec: { keo_per_h: 0.552, source_pmid: 'PMID:11554426', note: 'Rat brain ECF microdialysis, anticonvulsant; abstract verbatim "ECe50 and Keo values were 95.3 ng/mL and 0.0092 min-1"' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let occAdded = 0, occAlreadyHas = 0, kEoAdded = 0, kEoAlreadyHas = 0, missing = 0;

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as { keo_per_h?: number; source_pmid?: string } | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { kEoAlreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    kEoAdded++;
  }

  for (const e of OCCUPANCY_ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c['receptor_occupancy'] as Occupancy[] | undefined) ?? [];
    if (existing.some(s => s.receptor === e.site.receptor && s.source_pmid === e.site.source_pmid)) {
      occAlreadyHas++; continue;
    }
    existing.push(e.site);
    c['receptor_occupancy'] = existing;
    occAdded++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 3: occupancy +${occAdded} (already-had ${occAlreadyHas}), kₑₒ +${kEoAdded} (already-had ${kEoAlreadyHas}), missing ${missing}`);
}

main();
