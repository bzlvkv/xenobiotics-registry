/**
 * 2026-05-05-wave-2a-macrolide-cyp3a4.ts — Wave 2a session 10.
 *
 * 7 verified macrolide → CYP3A4 victim edges. Each entry's source_pmid
 * is a primary clinical PK study with verbatim AUC or clearance fold-
 * change in the abstract. ki_uM back-calculated from observed in-vivo
 * AUC ratio at therapeutic perpetrator Cp ≈ 3 µM for both perpetrators:
 *
 *   Ki = Cp_perp / (AUC_ratio − 1)
 *
 * Cross-pair consistency check: clarithromycin Ki across midazolam /
 * triazolam / colchicine / atorvastatin clusters at 0.5–1.2 µM (median
 * ~1.0 µM). Erythromycin Ki across triazolam / sildenafil clusters at
 * 1.6–1.7 µM. Alfentanil IV Ki (8.8 µM) is the route-driven outlier
 * since IV alfentanil sees only hepatic CL, not the larger oral first-
 * pass effect — flagged in note.
 *
 *   - clarithromycin → midazolam     AUC ~6.8×  ki 0.5  major          PMID:9728893
 *   - clarithromycin → triazolam     AUC 4.35×  ki 0.9  major          PMID:9757151
 *   - clarithromycin → atorvastatin  AUC 3.0–3.6× ki 1.2 warn          PMID:21950641
 *   - clarithromycin → colchicine    AUC 3.82×  ki 1.1  contraindicated PMID:23462027
 *   - erythromycin   → triazolam     AUC 2.83×  ki 1.6  major          PMID:9757151
 *   - erythromycin   → sildenafil    AUC 2.8×   ki 1.7  warn           PMID:11879258
 *   - erythromycin   → alfentanil(IV) CL 1.34×  ki 8.8  major          PMID:2501060
 *
 * Skipped (no abstract-verbatim AUC fold-change in any clinical PK
 * primary; logged in AUTHORING_GAPS):
 *   - clarithromycin → lovastatin / cyclosporine / alfentanil /
 *                       quetiapine / carbamazepine
 *   - erythromycin   → atorvastatin / lovastatin / colchicine /
 *                       fentanyl / quetiapine / carbamazepine
 *
 * Many of the skipped pairs have the data in full-text body but not
 * in PubMed-indexed abstracts (e.g. erythromycin→atorvastatin in
 * PBPK/review papers; clarithromycin→cyclosporine in case reports).
 * Author from full-text PDF when available.
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
  {
    perpetrator: 'clarithromycin',
    victim: 'midazolam',
    victim_name: 'Midazolam',
    level: 'major',
    ki_uM: 0.5,
    source_pmid: 'PMID:9728893',
    note: 'CYP3A4 inhibition (canonical probe). Gorski 1998 (PMID:9728893) n=16 healthy, clarithromycin 500 mg BID × 7d: midazolam systemic CL 28→10 L/h; oral F 0.31→0.75. Combined oral AUC ratio ≈ 6.8. Ki ≈ 3/(6.8−1) = 0.5 µM at Cp_perp ~3 µM. Strong CYP3A inhibitor by FDA criteria.',
  },
  {
    perpetrator: 'clarithromycin',
    victim: 'triazolam',
    victim_name: 'Triazolam',
    level: 'major',
    ki_uM: 0.9,
    source_pmid: 'PMID:9757151',
    note: 'CYP3A4 inhibition. Greenblatt 1998 (PMID:9757151) n=12 healthy, 5-arm: oral CL of triazolam 413 (placebo/azithro) → 95 mL/min with clarithromycin → AUC ratio 4.35. Ki ≈ 3/(4.35−1) = 0.9 µM. PD effects (sedation, psychomotor) also enhanced.',
  },
  {
    perpetrator: 'clarithromycin',
    victim: 'atorvastatin',
    victim_name: 'Atorvastatin',
    level: 'warn',
    ki_uM: 1.2,
    source_pmid: 'PMID:21950641',
    note: 'CYP3A4 inhibition; SLCO1B1 genotype-modulated. Shin 2011 (PMID:21950641) n=23 healthy, 2-phase crossover, clarithromycin 500 mg BID × 5d + atorvastatin 20 mg single: lactone AUC₀₋∞ ratio ≈ 2.62 (nonexpressors) to 3.59 (SLCO1B1 expressors). Use AUC_R ≈ 3.0 → Ki ≈ 3/(3−1) = 1.5; AUC_R ≈ 3.6 → 1.15; encoded at 1.2. Limit atorvastatin dose with strong CYP3A inhibitors per FDA label.',
  },
  {
    perpetrator: 'clarithromycin',
    victim: 'colchicine',
    victim_name: 'Colchicine',
    level: 'contraindicated',
    ki_uM: 1.1,
    source_pmid: 'PMID:23462027',
    note: 'CYP3A4 + P-gp inhibition. Davis/Wason 2013 (PMID:23462027) by URL Pharma (NDA holder) reports verbatim "Cmax and AUC of colchicine are increased by 277% and 282%" with clarithromycin coadministration → AUC ratio 3.82. Ki ≈ 3/(3.82−1) = 1.06 µM. FDA boxed warning; reported fatalities from severe GI tox + bone marrow suppression + multiorgan failure.',
  },
  {
    perpetrator: 'erythromycin',
    victim: 'triazolam',
    victim_name: 'Triazolam',
    level: 'major',
    ki_uM: 1.6,
    source_pmid: 'PMID:9757151',
    note: 'CYP3A4 inhibition. Greenblatt 1998 (PMID:9757151) same 5-arm study: oral CL of triazolam 413 → 146 mL/min with erythromycin → AUC ratio 2.83. Ki ≈ 3/(2.83−1) = 1.64 µM. Cross-check vs erythromycin→sildenafil Ki 1.67 — internally consistent.',
  },
  {
    perpetrator: 'erythromycin',
    victim: 'sildenafil',
    victim_name: 'Sildenafil',
    level: 'warn',
    ki_uM: 1.7,
    source_pmid: 'PMID:11879258',
    note: 'CYP3A4 inhibition. Muirhead 2002 (PMID:11879258) n=26 male, erythromycin 500 mg BID × 5d, single 100 mg sildenafil: "AUC and Cmax of sildenafil (2.8-fold and 2.6-fold, respectively)". AUC_R = 2.8 → Ki ≈ 3/(2.8−1) = 1.67 µM. Pfizer recommended starting at 25 mg sildenafil with erythromycin.',
  },
  {
    perpetrator: 'erythromycin',
    victim: 'alfentanil',
    victim_name: 'Alfentanil',
    level: 'major',
    ki_uM: 8.8,
    source_pmid: 'PMID:2501060',
    note: 'CYP3A4 inhibition (anesthesia DDI). Bartkowski 1989 (PMID:2501060) n=6 IV alfentanil ± erythromycin × 7d: t½ 84.0→131.4 min, CL 3.9→2.9 mL/kg/min → ratio 1.34. Ki ≈ 3/(1.34−1) = 8.8 µM. NB: IV bypasses first-pass CYP3A; hepatic-only Ki here is higher than the oral-derived value. Authors recommend reduced alfentanil dose or avoidance with erythromycin.',
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
      slug: e.victim,
      name: e.victim_name,
      level: e.level,
      note: e.note,
      kinetics: { ki_uM: e.ki_uM },
      source_pmid: e.source_pmid,
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

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a session 10 (macrolide CYP3A4): added ${added}, updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
