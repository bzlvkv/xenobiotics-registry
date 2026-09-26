/**
 * 2026-05-07-wave-1a-session-1.ts — Wave 1a top-100 prescribed-meds PK,
 * session 1 of v1.0 push.
 *
 * Cluster: oral contraceptives (4) + thyroid (2) + antihypertensive (1)
 * + gepants (1) + breast-cancer SERD depot (1) = 9 authored.
 * + 2 skipped (minocycline, ubrogepant).
 *
 * All PMIDs verified via NCBI E-utilities efetch. Verbatim quotes captured
 * in comments per field; any field whose number is NOT in the cited
 * abstract is flagged "(convention)".
 *
 * ── Contraceptive steroids ──
 *
 * 1. ethinyl-estradiol PO (PMID:509953 — Back 1979 Contraception 20:263)
 *    F = 0.42      verbatim "the bioavailability of EE was determined to be 42%"
 *    t½ = 6.75 h   verbatim "respective half-lives for the 2 routes were .83 and 6.75 hours"
 *    ka = 1.0      (convention; Tmax not stated)
 *    V_L = 400     (convention; Vd not in abstract; ~5 L/kg textbook)
 *    half_life_hr.PO updated 24 → 6.75 to match verbatim.
 *
 * 2. levonorgestrel PO (PMID:6786829 — Back 1981 Contraception 23:229)
 *    F = 0.89      verbatim "mean systemic bioavailability of 89% after the 150 microgram dose"
 *    t½ = 11.55 h  verbatim "mean half-lives of 0.76 and 11.55 hours"
 *    ka = 1.0      (convention)
 *    V_L = 100     (convention; abstract says ~half of NET's Vd qualitatively)
 *    half_life_hr.PO updated 24 → 11.55.
 *
 * 3. norethindrone PO (PMID:436304 — Odlind 1979 Clin Endocrinol 10:29)
 *    t½ = 8-11 h   verbatim "plasma half life of NET … was 8-11 h"  → 9.5 used
 *    Tmax < 2 h    verbatim "Peak concentrations of NET were found within two hours"
 *    ka = 2.0      (derived from Tmax)
 *    F = 0.65      (convention; not in any indexed abstract — textbook ~64%)
 *    V_L = 350     (convention; textbook ~5 L/kg)
 *
 * 4. drospirenone PO (PMID:11245553 — Blode 2000 EJCRHC 5:256)
 *    t½ = 30.8-32.5 h  verbatim "mean terminal half-lives of 30.8-32.5 h"
 *    Tmax = 1.5-2.0 h  verbatim "peak concentration in serum 1.5-2.0 h after dosing"
 *    ka = 2.3          (derived from Tmax 1.75)
 *    F = 0.76          (convention; textbook ~76%)
 *    V_L = 280         (convention; ~4 L/kg textbook)
 *
 * ── Thyroid antagonists ──
 *
 * 5. methimazole PO (PMID:4042519 — Jansson 1985 Clin Pharmacokinet 10:443)
 *    F = 0.93     verbatim "absolute bioavailability ... was high, with a mean of 93%"
 *    t½ = 4.9-5.7 h  verbatim "elimination half-life (t1/2 beta) of 4.9 to 5.7 hours" → 5.3 used
 *    V_L = 40     verbatim from secondary PMID:6172233 (Kampmann 1981 review):
 *                 "total volume of distribution is about 40L for methimazole"
 *    ka = 1.0     (convention)
 *
 * 6. propylthiouracil PO (PMID:6713763 — Kampmann 1984 Clin Pharmacokinet 9:168)
 *    F = 0.80     verbatim "bioavailability of propylthiouracil (about 80%) was unchanged"
 *    t½ = 1.5 h   from PMID:6172233 verbatim "Propylthiouracil has a half-life of 1 to 2 hours"
 *    V_L = 30     from PMID:6172233 verbatim "total volume of distribution is about 30L for propylthiouracil"
 *    ka = 1.0     (convention)
 *
 * ── Antihypertensive ──
 *
 * 7. methyldopa PO (PMID:781212 — Kwan 1976 J Pharmacol Exp Ther 198:264)
 *    F = 0.25     verbatim "fraction reaching the systemic circulation as methyldopa was estimated to be 0.25"
 *    t½ = 2 h     (convention from drug label — not in abstract)
 *    V_L = 28     (convention; ~0.4 L/kg textbook)
 *    ka = 1.0     (convention; abstract notes "most of the absorption occurred within the first 5 hours")
 *
 * ── Gepant ──
 *
 * 8. rimegepant PO (PMID:40614133 — Comisar 2025 popPK + PMID:37282507 — Bertz 2023 SAD/MAD)
 *    ka = 3.86    verbatim from Comisar "absorption rate constant (ka) = 3.86 h-1 (28.4%)"
 *    V_L = 160    Vc/F + Vp/F = 114 + 46 verbatim from Comisar "apparent central volume of distribution (Vc/F) = 114.0 L (5.36%)" + "apparent peripheral volume of distribution (Vp/F) = 46.0 L (5.30%)"
 *    t½ = 11 h    verbatim from Bertz "Median terminal half-life ranged from 8-12 hours" → midpoint 10
 *    F = 0.64     (FDA label — no indexed abstract states F verbatim)
 *
 * ── Breast cancer SERD (IM depot) ──
 *
 * 9. fulvestrant IM (PMID:12867220 — Robertson 2003 + PMID:15170367 — Robertson 2004)
 *    Tmax = 7 d        verbatim "median time to maximum concentration was 6.98 ... days"
 *    t½ = 49 d         verbatim "apparent terminal phase half-life of approximately 49 days"
 *    ka = 5.89e-4 /h   derived from t½ = 49d under flip-flop kinetics (depot release is rate-limiting, terminal t½ reflects ka not ke)
 *    V_L = 200         (convention; not in abstract)
 *    F = 1.0           (convention for IM depot reference route)
 *
 * ── SKIPPED — to AUTHORING_GAPS.md ──
 *
 * - minocycline: Saivin 1988 (PMID:3072140) review abstract has only
 *   qualitative statements ("readily absorbed, distributed throughout the
 *   organism as a function of their lipophilicity"); no F/Vd/t½ verbatim.
 *   Other candidates (PMID:4199710 Macdonald, 1211910 Welling, 788583
 *   Allen, 16816396 Agwuh) lacked verbatim PK numbers in their abstracts.
 *   Logged. Re-author when full-text Saivin or Curtin 2017 surfaces.
 *
 * - ubrogepant: Blumenfeld 2020 review (PMID:32053714) is "No abstract
 *   available" on PubMed; canonical F=0.254, Vd=350 L, t½=5-7 h live in
 *   FDA label and full-text only. Verbatim Tmax 2-3 h available
 *   (PMID:31899602 Ankrom 2020) but other fields not verbatim. Logged.
 *   Re-author when Jakate 2020 SAD/MAD or NDA review surfaces.
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
  source_pmid?: string;
}
interface Compound {
  slug: string;
  pk?: Partial<Record<string, RoutePk>>;
  half_life_hr?: Record<string, number>;
  refs?: string[];
  [k: string]: unknown;
}

interface Entry {
  slug: string;
  route: string;
  pk: RoutePk;
  refs_add: string[];
  /** If provided, overwrite half_life_hr[route] (for EE / LNG where stub default was off). */
  half_life_hr_override?: number;
}

const ENTRIES: Entry[] = [
  {
    slug: 'ethinyl-estradiol', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 400, F: 0.42, source_pmid: 'PMID:509953' },
    refs_add: ['PMID:509953'],
    half_life_hr_override: 6.75,
  },
  {
    slug: 'levonorgestrel', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 100, F: 0.89, source_pmid: 'PMID:6786829' },
    refs_add: ['PMID:6786829'],
    half_life_hr_override: 11.55,
  },
  {
    slug: 'norethindrone', route: 'PO',
    pk: { ka_hr: 2.0, V_L: 350, F: 0.65, source_pmid: 'PMID:436304' },
    refs_add: ['PMID:436304'],
  },
  {
    slug: 'drospirenone', route: 'PO',
    pk: { ka_hr: 2.3, V_L: 280, F: 0.76, source_pmid: 'PMID:11245553' },
    refs_add: ['PMID:11245553'],
  },
  {
    slug: 'methimazole', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 40, F: 0.93, source_pmid: 'PMID:4042519' },
    refs_add: ['PMID:4042519', 'PMID:6172233'],
  },
  {
    slug: 'propylthiouracil', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 30, F: 0.80, source_pmid: 'PMID:6713763' },
    refs_add: ['PMID:6713763', 'PMID:6172233'],
  },
  {
    slug: 'methyldopa', route: 'PO',
    pk: { ka_hr: 1.0, V_L: 28, F: 0.25, source_pmid: 'PMID:781212' },
    refs_add: ['PMID:781212'],
  },
  {
    slug: 'rimegepant', route: 'PO',
    pk: { ka_hr: 3.86, V_L: 160, F: 0.64, source_pmid: 'PMID:40614133' },
    refs_add: ['PMID:40614133', 'PMID:37282507'],
  },
  {
    slug: 'fulvestrant', route: 'IM',
    pk: { ka_hr: 0.000589, V_L: 200, F: 1.0, source_pmid: 'PMID:12867220' },
    refs_add: ['PMID:12867220', 'PMID:15170367'],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.[e.route]?.source_pmid) {
      alreadyHas++;
      console.log(`  [skip] ${e.slug}.${e.route} already has source_pmid=${c.pk[e.route]!.source_pmid}`);
      continue;
    }
    c.pk = c.pk ?? {};
    c.pk[e.route] = e.pk;
    if (e.half_life_hr_override != null) {
      c.half_life_hr = c.half_life_hr ?? {};
      c.half_life_hr[e.route] = e.half_life_hr_override;
    }
    const refs = c.refs ?? [];
    for (const p of e.refs_add) {
      if (!refs.includes(p)) refs.push(p);
    }
    c.refs = refs;
    added++;
    console.log(`  [add ] ${e.slug}.${e.route} F=${e.pk.F} V=${e.pk.V_L} ka=${e.pk.ka_hr} src=${e.pk.source_pmid}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 1a session 1: added ${added}, already-had ${alreadyHas}, missing ${missing}.`);
  console.log(`Skipped this session (logged in AUTHORING_GAPS.md): minocycline, ubrogepant.`);
}

main();
