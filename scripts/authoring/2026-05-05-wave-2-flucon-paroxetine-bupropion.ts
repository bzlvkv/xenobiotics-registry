/**
 * 2026-05-05-wave-2-flucon-paroxetine-bupropion.ts — Wave 2 session 12.
 *
 * 17 verified perpetrator → victim CYP inhibition edges across three
 * potent CYP-isoform-specific inhibitors. Every PMID verified verbatim.
 * Ki back-calculated from observed in-vivo AUC ratio.
 *
 * Fluconazole (Cp_perp ≈ 30 µM at 200–400 mg/d steady-state) — 9 edges
 * spanning CYP2C9 / CYP2C19 / CYP3A4:
 *   phenytoin     CYP2C9   AUC 1.33×  ki 89.8  warn   PMID:1633070
 *   losartan      CYP2C9   AUC 1.66×  ki 45.5  warn   PMID:9357393   (E-3174 cut 43% — efficacy concern)
 *   ibuprofen     CYP2C9   AUC 1.82×  ki 36.6  warn   PMID:16723553  (S-enantiomer)
 *   celecoxib     CYP2C9   AUC 2.61×  ki 18.6  warn   PMID:39730940  (CYP2C9 *1/*1)
 *   fluvastatin   CYP2C9   AUC 1.84×  ki 35.7  warn   PMID:10952477
 *   omeprazole    CYP2C19  AUC 6.29×  ki 5.67  major  PMID:11932962
 *   diazepam      CYP2C19  AUC 2.50×  ki 20.0  warn   PMID:17676319
 *   midazolam     CYP3A4   AUC 2.50×  ki 20.0  major  PMID:9049584   (oral; route-dependent)
 *   triazolam     CYP3A4   AUC 4.40×  ki 8.82  major  PMID:8904618   (200 mg dose)
 *
 * Paroxetine (Cp_perp ≈ 0.2 µM at 20 mg/d steady-state) — 6 CYP2D6 edges.
 * Paroxetine is a TDI/MBI; competitive Ki is a lower-bound:
 *   metoprolol    AUC 5.08×  ki 0.05   major  PMID:10741632  (S-enant; β-active)
 *   atomoxetine   AUC 2.30×  ki 0.15   warn   PMID:33245517  (CYP2D6 *wt/*wt)
 *   desipramine   AUC 5×     ki 0.05   major  PMID:8513845   (Brøsen 1993)
 *   risperidone   AUC 1.45×  ki 0.44   warn   PMID:11360029  (active-moiety basis)
 *   aripiprazole  AUC 2.38×  ki 0.15   warn   PMID:21739267  (CL/F −58% in EMs)
 *   tramadol      AUC 1.37×  ki 0.54   warn   PMID:15903129  (parent ↑37%, M1 ↓67% — analgesia loss)
 *
 * Bupropion (combined parent + OH-bupropion Cp_perp ≈ 1 µM) — 2 CYP2D6 edges:
 *   atomoxetine   AUC 5.10×  ki 0.24   major  PMID:27518170
 *   desipramine   AUC 5×     ki 0.25   major  PMID:18420781  (Reese mechanistic; 5-fold verbatim from clinical lit)
 *
 * Also: paroxetine had a duplicate `tamoxifen` interaction entry (both
 * empty-kinetics). This script dedupes it (keep first, drop second).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Edge = {
  perpetrator: string;
  victim: string;
  victim_name: string;
  level: 'caution' | 'warn' | 'major' | 'contraindicated';
  ki_uM: number;
  source_pmid: string;
  note: string;
};

const EDGES: Edge[] = [
  // ── Fluconazole cluster (9) ────────────────────────────────────────
  {
    perpetrator: 'fluconazole', victim: 'phenytoin', victim_name: 'Phenytoin',
    level: 'warn', ki_uM: 89.8, source_pmid: 'PMID:1633070',
    note: 'CYP2C9 inhibition. Touchette 1992 (PMID:1633070) n=9 healthy males, fluconazole 400 mg/d × 6d, single 250 mg phenytoin: AUC0-48 195.2 vs 146.3 µg·h/mL (ratio 1.33×). Ki ≈ 30/0.33 = 89.8 µM. Phenytoin TDM advised — narrow therapeutic index.',
  },
  {
    perpetrator: 'fluconazole', victim: 'losartan', victim_name: 'Losartan',
    level: 'warn', ki_uM: 45.5, source_pmid: 'PMID:9357393',
    note: 'CYP2C9 inhibition (reduces E-3174 conversion). Kazierad 1997 (PMID:9357393) n=16 males, losartan 100 mg + fluconazole 200 mg/d days 11-20: parent AUC +66%, Cmax +30%; active E-3174 AUC −43%, Cmax −56%. Ki ≈ 30/0.66 = 45.5 µM. Efficacy concern (active metabolite cut), not toxicity.',
  },
  {
    perpetrator: 'fluconazole', victim: 'ibuprofen', victim_name: 'Ibuprofen',
    level: 'warn', ki_uM: 36.6, source_pmid: 'PMID:16723553',
    note: 'CYP2C9 inhibition. Hynninen 2006 (PMID:16723553) n=12 males, fluconazole 400 mg d1 + 200 mg d2, single 400 mg racemic ibuprofen: S-(+)-AUC ratio 1.82 (90% CI 1.72-1.91). Ki ≈ 30/0.82 = 36.6 µM. Consider dose reduction at high ibuprofen doses.',
  },
  {
    perpetrator: 'fluconazole', victim: 'celecoxib', victim_name: 'Celecoxib',
    level: 'warn', ki_uM: 18.6, source_pmid: 'PMID:39730940',
    note: 'CYP2C9 inhibition. Cho 2025 (PMID:39730940) n=39 Korean males by CYP2C9 genotype, fluconazole 150 mg/d + 200 mg celecoxib day 6: in *1/*1 EMs AUCinf increased 2.61×, CL/F −60.4%. Ki ≈ 30/1.61 = 18.6 µM. FDA label: halve celecoxib dose with fluconazole.',
  },
  {
    perpetrator: 'fluconazole', victim: 'fluvastatin', victim_name: 'Fluvastatin',
    level: 'warn', ki_uM: 35.7, source_pmid: 'PMID:10952477',
    note: 'CYP2C9 inhibition. Kantola 2000 (PMID:10952477) n=12, fluconazole 400 mg d1 + 200 mg/d d2-4, single 40 mg fluvastatin d4: AUC0-∞ +84%, t½ +80%, Cmax +44%. Ki ≈ 30/0.84 = 35.7 µM. Pravastatin unaffected (different transport).',
  },
  {
    perpetrator: 'fluconazole', victim: 'omeprazole', victim_name: 'Omeprazole',
    level: 'major', ki_uM: 5.67, source_pmid: 'PMID:11932962',
    note: 'CYP2C19 inhibition (strong). Kang 2002 (PMID:11932962) n=18 males, fluconazole 100 mg/d × 4d then 20 mg omeprazole + 100 mg fluconazole d5: AUC 491→3090 ng·h/mL (6.29×), t½ 0.85→2.59 h, Cmax 311→746 ng/mL. Ki ≈ 30/5.29 = 5.67 µM. >5× AUC = strong CYP2C19 inhibition by FDA criteria.',
  },
  {
    perpetrator: 'fluconazole', victim: 'diazepam', victim_name: 'Diazepam',
    level: 'warn', ki_uM: 20.0, source_pmid: 'PMID:17676319',
    note: 'CYP2C19 inhibition (N-demethylation). Saari 2007 (PMID:17676319) n=12, fluconazole 400 mg d1 + 200 mg d2, single 5 mg PO diazepam: AUC0-∞ 2.5× (90% CI 1.94-3.40), t½ 31→73 h. Ki ≈ 30/1.5 = 20 µM. Sedation prolonged; t½ doubled.',
  },
  {
    perpetrator: 'fluconazole', victim: 'midazolam', victim_name: 'Midazolam',
    level: 'major', ki_uM: 20.0, source_pmid: 'PMID:9049584',
    note: 'CYP3A4 inhibition. Ahonen 1997 (PMID:9049584) n=9 crossover, fluconazole 400 mg PO or IV + oral midazolam 7.5 mg 60 min later: AUC0-3, AUC0-17 increased 2-3×, t½ 2.5×, Cmax 2-2.5×. Ki ≈ 30/1.5 = 20 µM. Oral midazolam route-dependent (more affected than IV).',
  },
  {
    perpetrator: 'fluconazole', victim: 'triazolam', victim_name: 'Triazolam',
    level: 'major', ki_uM: 8.82, source_pmid: 'PMID:8904618',
    note: 'CYP3A4 inhibition. Varhe 1996 (PMID:8904618) n=8, 4-phase crossover, fluconazole 50/100/200 mg/d × 4d + 0.25 mg PO triazolam d4: AUC 1.6×/2.1×/4.4× (P<0.001), dose-dependent. Ki ≈ 30/3.4 = 8.82 µM at 200 mg fluconazole. Label avoidance with high-dose fluconazole.',
  },
  // ── Paroxetine cluster (6) ─────────────────────────────────────────
  {
    perpetrator: 'paroxetine', victim: 'metoprolol', victim_name: 'Metoprolol',
    level: 'major', ki_uM: 0.05, source_pmid: 'PMID:10741632',
    note: 'CYP2D6 inhibition (TDI). Hemeryck 2000 (PMID:10741632) n=8 healthy male EMs, metoprolol 100 mg single ± paroxetine 20 mg/d × 6d: (R)-AUC 169→1340 ng·h/mL (7.93×), (S)-AUC 279→1418 (5.08×). Ki ≈ 0.2/4.08 = 0.049 µM (S-enant basis). Loss of cardioselectivity, bradycardia.',
  },
  {
    perpetrator: 'paroxetine', victim: 'atomoxetine', victim_name: 'Atomoxetine',
    level: 'warn', ki_uM: 0.15, source_pmid: 'PMID:33245517',
    note: 'CYP2D6 inhibition. Jung 2020 (PMID:33245517) n=10 CYP2D6*wt/*wt, atomoxetine 20 mg single ± paroxetine 20 mg/d × 6d: AUC0-24 increased 2.3× (in *wt/*wt EMs; 1.7× in *wt/*10, 1.3× in *10/*10). Ki ≈ 0.2/1.3 = 0.15 µM. FDA label recommends dose reduction.',
  },
  {
    perpetrator: 'paroxetine', victim: 'desipramine', victim_name: 'Desipramine',
    level: 'major', ki_uM: 0.05, source_pmid: 'PMID:8513845',
    note: 'CYP2D6 inhibition (TDI). Brøsen 1993 (PMID:8513845) n=9 EMs + 8 PMs, desipramine 100 mg single ± paroxetine 20 mg/d: 5-fold CL decrease in EMs (median CL 22→4.4 L/h). AUC ratio ~5×. Ki ≈ 0.2/4 = 0.05 µM. TCA narrow therapeutic index — dose reduction required. Corroborated by Laine 2004 (PMID:14730412): 4.8× AUC.',
  },
  {
    perpetrator: 'paroxetine', victim: 'risperidone', victim_name: 'Risperidone',
    level: 'warn', ki_uM: 0.44, source_pmid: 'PMID:11360029',
    note: 'CYP2D6 inhibition (parent → 9-OH conversion). Spina 2001 (PMID:11360029) n=10 schizophrenia patients, risperidone 4-8 mg/d + paroxetine 20 mg/d × 4 wk: active-moiety (risperidone + 9-OH) +45% (P<0.05); EPS in 1/10. Ki ≈ 0.2/0.45 = 0.44 µM (active-moiety basis underestimates parent shift).',
  },
  {
    perpetrator: 'paroxetine', victim: 'aripiprazole', victim_name: 'Aripiprazole',
    level: 'warn', ki_uM: 0.15, source_pmid: 'PMID:21739267',
    note: 'CYP2D6 inhibition. Azuma 2012 (PMID:21739267) n=14 EMs + 14 IMs Japanese, aripiprazole 3 mg single + paroxetine 20 mg/d × 6-7d: CL/F −58% in EMs (AUC ratio 2.38×), −23% in IMs. Ki ≈ 0.2/1.38 = 0.145 µM. US label: halve aripiprazole dose with strong CYP2D6 inhibitors.',
  },
  {
    perpetrator: 'paroxetine', victim: 'tramadol', victim_name: 'Tramadol',
    level: 'warn', ki_uM: 0.54, source_pmid: 'PMID:15903129',
    note: 'CYP2D6 inhibition (reduces M1 activation). Laugesen 2005 (PMID:15903129) n=16 EMs, tramadol 150 mg ± paroxetine 20 mg/d × 3d: parent (+)-AUC +37% (P=.001), (-)-AUC +32%; active M1 (+)-AUC −67% (P=.0004), (-)-AUC −40%. Ki ≈ 0.2/0.37 = 0.54 µM (parent basis). Reduced opioid analgesia is the dominant clinical concern.',
  },
  // ── Bupropion cluster (2) ──────────────────────────────────────────
  {
    perpetrator: 'bupropion', victim: 'atomoxetine', victim_name: 'Atomoxetine',
    level: 'major', ki_uM: 0.24, source_pmid: 'PMID:27518170',
    note: 'CYP2D6 inhibition (bupropion + OH-bupropion). Todor 2016 (PMID:27518170) sequential open-label, atomoxetine 25 mg single ± bupropion 300 mg × 7d: AUC0-∞ 1580→8060 ng·h/mL (5.1×); main metabolite −1.5×. Ki ≈ 1/4.1 = 0.244 µM at combined Cp_perp ≈ 1 µM. >5× AUC qualifies as strong CYP2D6 inhibition.',
  },
  {
    perpetrator: 'bupropion', victim: 'desipramine', victim_name: 'Desipramine',
    level: 'major', ki_uM: 0.25, source_pmid: 'PMID:18420781',
    note: 'CYP2D6 inhibition (mechanistic). Reese 2008 (PMID:18420781) DMD mechanistic abstract verbatim "marked (5-fold) increases in desipramine exposure" (refers to clinical DDI). Threohydro/erythrohydrobupropion in-vitro Ki 1.7-5.4 µM at CYP2D6 explains the 5-fold clinical bump. Ki ≈ 1/4 = 0.25 µM. TCA cardiac/CNS toxicity — dose reduction.',
  },
];

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
  refs?: string[];
  [k: string]: unknown;
}

function dedupeInteractions(perp: Compound): number {
  const ints = (perp.interactions ?? []) as InteractionRef[];
  const seen = new Map<string, InteractionRef>();
  let removed = 0;
  for (const ix of ints) {
    if (seen.has(ix.slug)) {
      // Keep the entry with kinetics if there's a tie
      const existing = seen.get(ix.slug)!;
      if (!existing.kinetics && ix.kinetics) {
        seen.set(ix.slug, ix);
      }
      removed++;
    } else {
      seen.set(ix.slug, ix);
    }
  }
  if (removed > 0) perp.interactions = Array.from(seen.values());
  return removed;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, updated = 0, alreadyHas = 0, missing = 0;

  for (const e of EDGES) {
    const perp = bySlug.get(e.perpetrator);
    if (!perp) { console.warn(`  [warn] perpetrator missing: ${e.perpetrator}`); missing++; continue; }
    if (!bySlug.has(e.victim)) { console.warn(`  [warn] victim missing: ${e.victim}`); missing++; continue; }

    const ints = (perp.interactions ?? []) as InteractionRef[];
    const existing = ints.find(i => i.slug === e.victim);

    const newEdge: InteractionRef = {
      slug: e.victim, name: e.victim_name, level: e.level, note: e.note,
      kinetics: { ki_uM: e.ki_uM }, source_pmid: e.source_pmid,
    };

    if (existing) {
      if (existing.kinetics?.ki_uM === e.ki_uM && existing.source_pmid === e.source_pmid) {
        alreadyHas++; continue;
      }
      Object.assign(existing, newEdge);
      updated++;
    } else {
      ints.push(newEdge);
      perp.interactions = ints;
      added++;
    }

    const refs = (perp.refs ?? []) as string[];
    if (!refs.includes(e.source_pmid)) refs.push(e.source_pmid);
    perp.refs = refs;
  }

  // Dedupe known existing-duplicate interactions on paroxetine + sweep all perpetrators
  let dedupedTotal = 0;
  for (const slug of ['paroxetine', 'fluconazole', 'bupropion']) {
    const perp = bySlug.get(slug);
    if (perp) dedupedTotal += dedupeInteractions(perp);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2 session 12 (fluconazole + paroxetine + bupropion): added ${added}, updated ${updated}, already-had ${alreadyHas}, missing ${missing}, deduped ${dedupedTotal}`);
}

main();
