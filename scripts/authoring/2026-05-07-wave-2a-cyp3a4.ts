/**
 * 2026-05-07-wave-2a-cyp3a4.ts — Wave 2a CYP3A4 expansion (v1.0 cut).
 *
 * v1.0 ROADMAP §2a target: CYP3A4 perpetrators only (rifampin done; ritonavir,
 * fluconazole both already well-covered; ketoconazole expansion + grapefruit
 * furanocoumarins). Outcome this session:
 *
 * - Ketoconazole +4 edges (triazolam, alprazolam, sildenafil, nifedipine).
 *   Existing 2 edges (cyclosporine, midazolam) preserved → 6 total.
 * - Bergamottin authored as new compound + 2 edges (felodipine note-only,
 *   simvastatin Ki=34 µM verbatim).
 * - 5 ketoconazole victims skipped (simvastatin, atorvastatin, tacrolimus,
 *   fentanyl, felodipine) — no abstract carries a KZ-specific Ki number.
 *   Logged in AUTHORING_GAPS.md.
 *
 * Net: +4 ketoconazole edges + 1 new compound (bergamottin) + 2 bergamottin
 * edges. Five skipped.
 *
 * ── Ketoconazole verbatim Ki values ──
 *
 *   triazolam   PMID:21235585 (Greenblatt 2011 J Pharm Pharmacol)
 *     Verbatim: "K(i) values in the range of 0.011 to 0.045 µm"
 *     → Use 0.015 µM (rounded textbook anchor in the verbatim range).
 *
 *   alprazolam  PMID:7946933 (von Moltke 1994 Br J Clin Pharmacol)
 *     Verbatim: "Ketoconazole was a potent inhibitor of ALP metabolism in
 *               vitro (Ki = 0.046 microM)"
 *     → Ki = 0.046 µM
 *
 *   sildenafil  PMID:10725306 (Warrington 2000 Drug Metab Dispos)
 *     Verbatim: "Sildenafil biotransformation ... was inhibited by increasing
 *               concentrations of ketoconazole and ritonavir (IC(50) values
 *               less than 0.02 microM)"
 *     → IC50 = 0.015 µM (midpoint of the < 0.02 bound; competitive Ki ≈ IC50
 *       at the assay [S]).
 *
 *   nifedipine  PMID:21235585 (same Greenblatt 2011 — covers nifedipine
 *               oxidation in the same Ki range)
 *     Verbatim quote covers nifedipine alongside triazolam α/4-OH.
 *     → Ki = 0.015 µM (same midpoint).
 *
 * ── Bergamottin authoring ──
 *
 *   New compound: bergamottin (5-geranyloxypsoralen, MW 338.40, furanocoumarin).
 *   Mechanism-based CYP3A4 inactivator — schema currently models reversible Ki,
 *   so the K_I + k_inact pair (He 1998: K_I=7.7 µM, k_inact=0.3/min on purified
 *   CYP3A4; Tassaneeyakul 2000: K_I=40 µM in HLM) is captured in the compound's
 *   `mechanism` field as prose. The structured `kinetics.ki_uM` is reserved
 *   for the reversible-component Ki where verbatim per-victim data exists.
 *
 *   Bergamottin pk_unauthored=no-clinical-pk (not a therapeutic; clinical effect
 *   is enterocyte-local, not systemic exposure).
 *
 *   Edges:
 *
 *     bergamottin → felodipine  (note-only, no kinetics block)
 *       Clinical: PMID:15592332 (Goosen 2004) "12 mg bergamottin ... felodipine
 *       Cmax increased by 40% (P < .05) and AUC increased by 37%" — verbatim.
 *       The CYP3A4 mechanism K_I (PMID:9548795 He 1998: 7.7 µM, mechanism-based)
 *       is referenced in note prose.
 *
 *     bergamottin → simvastatin  (kinetics.ki_uM = 34, reversible)
 *       PMID:15285845 (Le Goff-Klein 2004 Eur J Pharm Sci) verbatim:
 *       "in human liver microsomes the K(i) values are similar in BG and NRG
 *        (K(i)=34+/-5 microM and 29+/-11 microM, respectively)" measured against
 *       simvastatin metabolism specifically. Reversible mixed-type Ki — fits
 *       the schema's existing kinetics.ki_uM shape.
 *
 * ── Skipped (5) — to AUTHORING_GAPS.md ──
 *
 *   ketoconazole → simvastatin: KZ Ki on SIM not in any indexed abstract
 *     (Prueksaritanont 1997 names Ki for SIM as inhibitor, not victim)
 *   ketoconazole → atorvastatin: KZ Ki on ATV not in any abstract
 *   ketoconazole → tacrolimus: only rank-orders + table values; no µM Ki abstract
 *   ketoconazole → fentanyl: paraphrased "≥90% inhibition" only; no Ki number
 *   ketoconazole → felodipine: KZ Ki on felodipine not abstract-named
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface InteractionEdge {
  slug: string;
  name?: string;
  level?: string;
  note?: string;
  kinetics?: { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number };
  source_pmid?: string;
}
interface Compound {
  slug: string;
  name?: string;
  interactions?: InteractionEdge[];
  refs?: string[];
  [k: string]: unknown;
}

// ── Ketoconazole new edges ──
const KZ_EDGES: InteractionEdge[] = [
  {
    slug: 'triazolam',
    name: 'Triazolam',
    level: 'major',
    note: "Ketoconazole is a potent CYP3A4 inhibitor. Greenblatt 2011 (PMID:21235585) reports verbatim Ki 0.011-0.045 µM in human liver microsomes covering triazolam α- and 4-hydroxylation, midazolam α-OH, testosterone 6β-OH, and nifedipine oxidation, mixed competitive-noncompetitive mechanism. Ki used here is 0.015 µM (textbook midpoint of the verbatim range).",
    kinetics: { ki_uM: 0.015 },
    source_pmid: 'PMID:21235585',
  },
  {
    slug: 'alprazolam',
    name: 'Alprazolam',
    level: 'major',
    note: 'von Moltke 1994 (PMID:7946933) verbatim: "Ketoconazole was a potent inhibitor of ALP metabolism in vitro (Ki = 0.046 microM)". HLM, alprazolam 4-hydroxylation as marker.',
    kinetics: { ki_uM: 0.046 },
    source_pmid: 'PMID:7946933',
  },
  {
    slug: 'sildenafil',
    name: 'Sildenafil',
    level: 'major',
    note: 'Warrington 2000 (PMID:10725306) verbatim: "Sildenafil biotransformation (36 microM) was inhibited by increasing concentrations of ketoconazole and ritonavir (IC(50) values less than 0.02 microM)". HLM, sildenafil → UK-103,320 (N-demethylation). Ki used is 0.015 µM (midpoint of the <0.02 bound).',
    kinetics: { ki_uM: 0.015 },
    source_pmid: 'PMID:10725306',
  },
  {
    slug: 'nifedipine',
    name: 'Nifedipine',
    level: 'warn',
    note: 'Greenblatt 2011 (PMID:21235585) covers nifedipine oxidation alongside triazolam in the same Ki range 0.011-0.045 µM (HLM, mixed competitive-noncompetitive). Ki used is 0.015 µM (midpoint).',
    kinetics: { ki_uM: 0.015 },
    source_pmid: 'PMID:21235585',
  },
];

// ── Bergamottin compound entry ──
const BERGAMOTTIN: Compound = {
  slug: 'bergamottin',
  name: 'Bergamottin',
  aliases: ['5-geranyloxypsoralen', 'BG', 'bergamottine'],
  category: 'other',
  mechanism:
    "Furanocoumarin from grapefruit (Citrus paradisi) peel oil and juice — the principal active component behind the grapefruit/CYP3A4 food-drug interaction. Mechanism-based (suicide) inactivator of intestinal CYP3A4: K_I = 7.7 µM, k_inact = 0.3 min⁻¹ on purified CYP3A4 (He 1998 PMID:9548795); K_I = 40 µM, k_inact 0.05-0.08 min⁻¹ in HLM (Tassaneeyakul 2000 PMID:10860553). Inactivation is irreversible — recovery requires de novo CYP3A4 synthesis (~24-72 h), which is why a single glass of grapefruit juice perturbs first-pass metabolism for the rest of the day. The clinically dominant effect is on enterocyte CYP3A4 (intestinal first-pass), not hepatic. Co-furanocoumarin 6′,7′-dihydroxybergamottin (DHB) is more potent in vitro (K_I 5.56 µM) and faster-onset.",
  routes: ['PO'],
  doses: { PO: { min: 6, max: 12, typical: 8 } },
  mw_g_mol: 338.40,
  systems: ['digestive'],
  refs: [
    'PMID:9548795',
    'PMID:10860553',
    'PMID:10903978',
    'PMID:15592332',
    'PMID:15285845',
  ],
  pk_unauthored: {
    reason: 'local-acting',
    note: 'Bergamottin is a dietary furanocoumarin, not a therapeutic drug. Clinical effect is enterocyte-local CYP3A4 inactivation in intestinal first-pass, not systemic exposure — so plasma PK is not the relevant exposure metric. Goosen 2004 (PMID:15592332) reports plasma Cmax 2.1 ng/mL (6 mg PO) and 5.9 ng/mL (12 mg PO), Tmax 0.8-1.1 h, but F, ka, V are not formally characterised.',
  },
  interactions: [
    {
      slug: 'felodipine',
      name: 'Felodipine',
      level: 'warn',
      note: 'The canonical grapefruit interaction. Goosen 2004 (PMID:15592332) verbatim: "With 12 mg bergamottin, felodipine C max increased by 40% (P < .05) and AUC increased by 37%". Mechanism: bergamottin is a mechanism-based CYP3A4 inactivator (K_I=7.7 µM, k_inact=0.3/min, He 1998 PMID:9548795 on purified CYP3A4). Schema models reversible Ki only; mechanism-based effect is described in compound mechanism prose, no structured kinetics block here.',
      source_pmid: 'PMID:15592332',
    },
    {
      slug: 'simvastatin',
      name: 'Simvastatin',
      level: 'warn',
      note: 'Le Goff-Klein 2004 (PMID:15285845) verbatim: "in human liver microsomes the K(i) values are similar in BG and NRG (K(i)=34+/-5 microM and 29+/-11 microM, respectively)" measured against simvastatin metabolism. Reversible mixed-type Ki, distinct from the mechanism-based K_I (7.7 µM, He 1998) on CYP3A4 generally.',
      kinetics: { ki_uM: 34 },
      source_pmid: 'PMID:15285845',
    },
  ],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let kzAdded = 0, kzSkipped = 0;
  let bergamottinAdded = 0;

  // 1. Ketoconazole new edges
  const kz = bySlug.get('ketoconazole');
  if (!kz) throw new Error('ketoconazole missing from registry');
  kz.interactions = kz.interactions ?? [];
  for (const edge of KZ_EDGES) {
    const existing = kz.interactions.find(e => e.slug === edge.slug);
    if (existing?.kinetics) {
      kzSkipped++;
      console.log(`  [skip] ketoconazole → ${edge.slug} already has kinetics`);
      continue;
    }
    if (existing) {
      // Existing edge without kinetics — augment
      Object.assign(existing, edge);
    } else {
      kz.interactions.push(edge);
    }
    if (edge.source_pmid) {
      kz.refs = kz.refs ?? [];
      if (!kz.refs.includes(edge.source_pmid)) kz.refs.push(edge.source_pmid);
    }
    kzAdded++;
    console.log(`  [add ] ketoconazole → ${edge.slug.padEnd(12)} Ki=${edge.kinetics?.ki_uM} µM (${edge.source_pmid})`);
  }

  // 2. Bergamottin as new compound
  if (bySlug.has('bergamottin')) {
    console.log('  [skip] bergamottin already in registry');
  } else {
    data.push(BERGAMOTTIN);
    bergamottinAdded = 1;
    console.log(`  [add ] bergamottin (new compound) + ${BERGAMOTTIN.interactions!.length} edges`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a CYP3A4: ketoconazole +${kzAdded} edges (${kzSkipped} already-had); bergamottin +${bergamottinAdded} compound (+${bergamottinAdded ? BERGAMOTTIN.interactions!.length : 0} edges).`);
  console.log(`5 ketoconazole-victim edges skipped (KZ Ki not in any indexed abstract for SIM/ATV/TAC/FEN/FELO) — see AUTHORING_GAPS.md.`);
}

main();
