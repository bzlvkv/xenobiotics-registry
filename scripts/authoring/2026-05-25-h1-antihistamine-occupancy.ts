/**
 * 2026-05-25-h1-antihistamine-occupancy.ts — H1 antagonist PD (pilot).
 *
 * Unblocks 3 of the 6 H1 antihistamines previously parked in
 * AUTHORING_GAPS.md ("H1 — Ki verified, kₑₒ missing"). The original skip
 * was strict: no abstract reports an effect-compartment kₑₒ for any
 * antihistamine, and lint requires kₑₒ before a receptor_occupancy row
 * can land. This session applies the *documented-approximation* kₑₒ
 * convention already used for caffeine / alpha-gpc / ashwagandha
 * (a defensible kₑₒ reasoned from a cited effect-onset paper, with an
 * explicit "approximation" note) — pairing it with the three compounds
 * whose H1 Kᵢ is a clean, HUMAN, abstract-verbatim value.
 *
 * Each Kᵢ → ec50_mg_l via ec50_mg_l = Kᵢ(M) · MW(g/mol) · 1000.
 * All are functional antagonists → emax = 1.0, hill_n = 1 (no abstract
 * reports cooperativity for H1 binding).
 *
 * ── Authored rows (3 compounds, 3 occupancy + 3 keo) ───────────────
 *
 * cetirizine (MW 388.89) — H1 Kᵢ 6 nM, Gillard 2002 (PMID:11809864),
 *   human recombinant H1, [³H]mepyramine competition.
 *     ec50 = 6e-9 · 388.89 · 1000 = 0.002333 mg/L
 *   kₑₒ 0.35/h ≈ approximation: Urien 1999 (PMID:10543317) PK/PD of the
 *   skin wheal/flare effect shows Cmax at ~1 h but maximal effect at
 *   ~6 h — a multi-hour plasma→effect lag. (Urien's own fit is an
 *   indirect-response model, which reports no kₑₒ; 0.35/h, t½ₖₑₒ ≈ 2 h,
 *   captures the observed lag as an effect compartment.)
 *
 * desloratadine (MW 310.82) — H1 Kᵢ 0.9 nM, Anthes 2002 (PMID:12167464),
 *   human recombinant H1 in CHO cells, [³H]desloratadine competition.
 *     ec50 = 0.9e-9 · 310.82 · 1000 = 0.000280 mg/L
 *   kₑₒ 0.30/h ≈ approximation: Meltzer & Gillman 2007 (PMID:17390761)
 *   wheal/flare crossover shows desloratadine flare suppression building
 *   across the 2–6 h window. Long-acting, slow equilibration; 0.30/h
 *   (t½ₖₑₒ ≈ 2.3 h). No abstract reports a fitted kₑₒ.
 *
 * promethazine (MW 284.42) — H1 Kᵢ 1.4 nM, Nakai 1991 (PMID:1912125),
 *   human frontal-cortex membranes (native tissue), [³H]mepyramine.
 *     ec50 = 1.4e-9 · 284.42 · 1000 = 0.000398 mg/L
 *   kₑₒ 1.0/h ≈ approximation: Hindmarch 2001 (PMID:11922397) confirms
 *   promethazine's marked central (CNS-penetrant) H1 effect on psychomotor
 *   /cognitive endpoints, with sedation onset within ~1 h — faster
 *   equilibration than the peripheral second-gen agents. 1.0/h
 *   (t½ₖₑₒ ≈ 42 min). No abstract reports a fitted kₑₒ.
 *
 * ── Skipped (6) — remain in AUTHORING_GAPS.md ──────────────────────
 *
 *   loratadine        — only guinea-pig Kᵢ 35/118 nM (PMID:2875889); no
 *                       human abstract value (its active metabolite
 *                       desloratadine is authored here instead).
 *   diphenhydramine   — Kᵢ ~44 nM is GUINEA-PIG cerebellum (PMID:20493137),
 *                       not human; functional guinea-pig KB 7.4 nM
 *                       (PMID:12866807). No human abstract Kᵢ.
 *   chlorpheniramine  — only guinea-pig functional KB 0.87 nM
 *                       (PMID:12866807); PMID:17099293 is a placental-
 *                       localization paper, not a clean competition Kᵢ.
 *   doxylamine        — no abstract reports any H1 Kᵢ/Kd.
 *   fexofenadine      — binding confirmed (PMID:28040476) but no abstract
 *                       names a Kᵢ; the number lives in full-text tables.
 *   hydroxyzine       — no abstract names a Kᵢ (Leysen PMID:1677249 lists
 *                       other antihistamines, not hydroxyzine).
 *
 * Idempotent: re-running skips compounds that already carry the row.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy {
  receptor: string;
  pathway?: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid?: string;
  note?: string;
}
interface EffectCompartment {
  keo_per_h: number;
  source_pmid?: string;
  note?: string;
}
interface Compound {
  slug: string;
  name?: string;
  effect_compartment?: EffectCompartment;
  receptor_occupancy?: ReceptorOccupancy[];
  refs?: string[];
  [k: string]: unknown;
}

interface Authoring {
  slug: string;
  effect_compartment: EffectCompartment;
  receptor_occupancy: ReceptorOccupancy[];
}

const ENTRIES: Authoring[] = [
  {
    slug: 'cetirizine',
    effect_compartment: {
      keo_per_h: 0.35,
      source_pmid: 'PMID:10543317',
      note: 'Approximation; no published kₑₒ. Urien 1999 (Int J Clin Pharmacol Ther) PK/PD of the histamine-induced skin reaction: "The peak plasma concentration (>500 ng/ml) was rapidly reached in 1 h and the maximal effects were observed later at approximately 6 h." 0.35/h (t½kₑₒ ≈ 2 h) renders that plasma→effect lag as an effect compartment; Urien fits an indirect-response model and reports no kₑₒ.',
    },
    receptor_occupancy: [
      {
        receptor: 'H1',
        pathway: 'antagonist',
        emax: 1.0,
        ec50_mg_l: 0.002333,
        hill_n: 1,
        source_pmid: 'PMID:11809864',
        note: 'Gillard 2002 (Mol Pharmacol) verbatim: "cetirizine and its enantiomers, levocetirizine and (S)-cetirizine, bound with high affinity and stereoselectivity to human H(1) histamine receptors (K(i) values of 6, 3, and 100 nM, respectively)". Human recombinant H1, [³H]mepyramine competition. Racemic Kᵢ 6 nM. ec50_mg_l = 6 nM × 388.89 / 1e6.',
      },
    ],
  },
  {
    slug: 'desloratadine',
    effect_compartment: {
      keo_per_h: 0.30,
      source_pmid: 'PMID:17390761',
      note: 'Approximation; no published kₑₒ. Meltzer & Gillman 2007 (Allergy Asthma Proc) wheal/flare crossover shows desloratadine flare suppression building across the 2–6 h window (vs plasma Cmax ~3 h). Long-acting, slow equilibration → 0.30/h (t½kₑₒ ≈ 2.3 h). No abstract reports a fitted kₑₒ.',
    },
    receptor_occupancy: [
      {
        receptor: 'H1',
        pathway: 'antagonist',
        emax: 1.0,
        ec50_mg_l: 0.000280,
        hill_n: 1,
        source_pmid: 'PMID:12167464',
        note: 'Anthes 2002 (Eur J Pharmacol) verbatim: "Desloratadine had a K(i) of 0.9+/-0.1 nM in these competition studies." Human recombinant H1 in CHO cells (CHO-H1), [³H]desloratadine competition (Kd 1.1 nM by saturation). ec50_mg_l = 0.9 nM × 310.82 / 1e6.',
      },
    ],
  },
  {
    slug: 'promethazine',
    effect_compartment: {
      keo_per_h: 1.0,
      source_pmid: 'PMID:11922397',
      note: 'Approximation; no published kₑₒ. Hindmarch 2001 (Curr Med Res Opin) confirms promethazine\'s marked central (CNS-penetrant) H1 effect on psychomotor/cognitive endpoints — sedation onset within ~1 h, faster than the peripheral second-gen agents. 1.0/h (t½kₑₒ ≈ 42 min). No abstract reports a fitted kₑₒ.',
    },
    receptor_occupancy: [
      {
        receptor: 'H1',
        pathway: 'antagonist',
        emax: 1.0,
        ec50_mg_l: 0.000398,
        hill_n: 1,
        source_pmid: 'PMID:1912125',
        note: 'Nakai 1991 (Biol Psychiatry) verbatim: "Specific H1 antagonists, mepyramine (Ki = 1.4 nM), promethazine (Ki = 1.4 nM) … strongly inhibited the 3H-mepyramine binding." Human frontal-cortex membranes (native tissue), [³H]mepyramine. ec50_mg_l = 1.4 nM × 284.42 / 1e6.',
      },
    ],
  },
];

function addRef(c: Compound, pmid?: string): void {
  if (!pmid) return;
  c.refs = c.refs ?? [];
  if (!c.refs.includes(pmid)) c.refs.push(pmid);
}

function apply(c: Compound, a: Authoring): { keo: 'add' | 'skip'; occ: number; occSkip: number } {
  let keo: 'add' | 'skip' = 'skip';
  if (c.effect_compartment?.keo_per_h != null) {
    console.log(`  [skip] ${c.slug.padEnd(14)} keo already authored (${c.effect_compartment.keo_per_h}/h)`);
  } else {
    c.effect_compartment = a.effect_compartment;
    addRef(c, a.effect_compartment.source_pmid);
    keo = 'add';
    console.log(`  [add ] ${c.slug.padEnd(14)} keo=${a.effect_compartment.keo_per_h}/h  ${a.effect_compartment.source_pmid}`);
  }

  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let occ = 0, occSkip = 0;
  for (const row of a.receptor_occupancy) {
    if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) {
      occSkip++;
      console.log(`  [skip] ${c.slug.padEnd(14)} @ ${row.receptor} already authored`);
      continue;
    }
    c.receptor_occupancy.push(row);
    addRef(c, row.source_pmid);
    occ++;
    console.log(`  [add ] ${c.slug.padEnd(14)} @ ${row.receptor.padEnd(4)} ec50=${row.ec50_mg_l} mg/L emax=${row.emax}  ${row.source_pmid}`);
  }
  return { keo, occ, occSkip };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let keoAdded = 0, occAdded = 0, occSkipped = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found in registry`);
    const r = apply(c, a);
    if (r.keo === 'add') keoAdded++;
    occAdded += r.occ;
    occSkipped += r.occSkip;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nH1 antihistamine occupancy pilot: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} occupancy already authored).`);
}

main();
