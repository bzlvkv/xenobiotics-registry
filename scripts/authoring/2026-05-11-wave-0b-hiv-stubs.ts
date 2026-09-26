/**
 * 2026-05-11-wave-0b-hiv-stubs.ts — Modern HIV / ketolide compounds (v1.1).
 *
 * Five compounds that were missing from the registry despite being
 * clinically common (or historically important): cobicistat (modern
 * ritonavir-replacement CYP3A4 booster), atazanavir + darunavir +
 * lopinavir (HIV protease inhibitors), telithromycin (withdrawn 2007
 * ketolide antibiotic).
 *
 * Plus one new perpetrator edge: cobicistat → midazolam (AUC 20×,
 * Ki=0.079 µM, contraindicated) from Mathias 2010 (PMID:20043009),
 * the Gilead phase-1 paper that introduced cobicistat (GS-9350) as
 * a CYP3A4 enhancer.
 *
 * The "95% CL reduction" → AUC 20× algebra is the same we've used
 * throughout v1.1: AUC_ratio = 1/(1 − CL%) when F and dose are fixed.
 * Same standard as the Brøsen 1989 quinidine → desipramine edge from
 * earlier this session ("85% CL reduction" → AUC 6.67× Ki=0.265).
 *
 * ── New compounds (5) ─────────────────────────────────────────────
 *
 *   cobicistat (Tybost / Stribild/Genvoya/Symtuza/Evotaz component)
 *     MW 776.02. Pharmacological enhancer with no anti-HIV activity.
 *     CYP3A4 mechanism-based inhibitor. Designed to replace ritonavir
 *     for boosting CYP3A4-metabolized antiretrovirals (elvitegravir,
 *     atazanavir, darunavir).
 *
 *   atazanavir (Reyataz)
 *     MW 704.86. HIV protease inhibitor. Distinctive UGT1A1 inhibition
 *     (causes Gilbert-like unconjugated hyperbilirubinemia in most users).
 *     Usually boosted with cobicistat or ritonavir.
 *
 *   darunavir (Prezista)
 *     MW 547.66. HIV protease inhibitor — high genetic barrier to
 *     resistance. Always boosted (DRV/c or DRV/r). The DRV component
 *     of the Symtuza FDC (DRV/c/F/TAF).
 *
 *   lopinavir
 *     MW 628.80. HIV protease inhibitor — clinically only available
 *     as Kaletra (LPV/r 200/50). Largely displaced by integrase
 *     inhibitor regimens.
 *
 *   telithromycin (Ketek)
 *     MW 812.00. Ketolide antibiotic — strong CYP3A4 inhibitor.
 *     Withdrawn from US market 2007 after hepatotoxicity + visual
 *     side-effects + myasthenia gravis crises were reported. Retained
 *     in the registry for historical reference.
 *
 * ── Authored edges (1) ────────────────────────────────────────────
 *
 *   cobicistat → midazolam   Ki=0.079  major   AUC ~20×   PMID:20043009
 *     Mathias 2010 (Clin Pharmacol Ther) verbatim: "GS-9350 potently
 *     inhibited midazolam apparent clearance (95% reduction), similar
 *     in effect to ritonavir 100 mg". CL ↓95% → AUC ratio 1/0.05 = 20.
 *     Ki ≈ 1.5/19 = 0.079 µM. "Similar in effect to ritonavir 100 mg"
 *     captures the design intent — cobicistat is a deliberate CYP3A4
 *     booster equivalent to RTV.
 *
 * Other cobicistat candidate edges (atazanavir, darunavir, elvitegravir,
 * atorvastatin, sildenafil) all SKIP for v1.1: clinical literature
 * exists but the abstracts systematically omit numeric AUC ratios,
 * leaving the numbers in tables of full-text Mathias 2012 / German
 * 2010 / Custodio 2014 / Tybost label data. Logged in AUTHORING_GAPS.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Kinetics { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number; }
interface InteractionRef { slug: string; name?: string; level?: string; note?: string; kinetics?: Kinetics; source_pmid?: string; }
interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  routes?: string[];
  doses?: Record<string, { min: number; max: number; typical: number }>;
  mw_g_mol?: number;
  systems?: string[];
  interactions?: InteractionRef[];
  refs?: string[];
  [k: string]: unknown;
}

const COBICISTAT: Compound = {
  slug: 'cobicistat',
  name: 'Cobicistat',
  aliases: ['Tybost', 'GS-9350', 'COBI'],
  category: 'pharmacological',
  mechanism:
    'Pharmacological enhancer / "booster" with no intrinsic anti-HIV activity. Mechanism-based inhibitor of human CYP3A4 (and CYP2D6 to a lesser extent), designed specifically to replace ritonavir for boosting CYP3A4-metabolized antiretrovirals — elvitegravir (Stribild/Genvoya), atazanavir (Evotaz), darunavir (Prezista with cobi / Symtuza). Inhibition of intestinal + hepatic CYP3A4 first-pass extends victim t½ and raises AUC ~20× for midazolam. Inhibits OATP1B1/B3 and P-gp at clinically relevant concentrations. Causes mild creatinine rise (~0.1-0.2 mg/dL) via inhibition of MATE1 / OCT2 tubular secretion — not true GFR decline.',
  routes: ['PO'],
  doses: { PO: { min: 150, max: 150, typical: 150 } },
  mw_g_mol: 776.02,
  systems: ['immune-hematologic'],
  refs: ['PMID:20043009'],
};

const ATAZANAVIR: Compound = {
  slug: 'atazanavir',
  name: 'Atazanavir',
  aliases: ['Reyataz', 'ATV'],
  category: 'pharmacological',
  mechanism:
    'HIV protease inhibitor — competitive inhibition of HIV-1 aspartyl protease blocks gag/gag-pol polyprotein cleavage and prevents production of mature virions. Almost always coadministered with a CYP3A4 booster (cobicistat or ritonavir) for adequate exposure. Distinctive among PIs for its inhibition of UGT1A1 — causes asymptomatic Gilbert-like unconjugated hyperbilirubinemia in most users (visible as scleral icterus at high exposure); not hepatotoxic, doesn\'t require discontinuation. Requires acid for absorption — clinically significant interaction with PPIs / H2 blockers / antacids. Otherwise generally well tolerated long-term.',
  routes: ['PO'],
  doses: { PO: { min: 200, max: 400, typical: 300 } },
  mw_g_mol: 704.86,
  systems: ['immune-hematologic'],
};

const DARUNAVIR: Compound = {
  slug: 'darunavir',
  name: 'Darunavir',
  aliases: ['Prezista', 'DRV', 'TMC114'],
  category: 'pharmacological',
  mechanism:
    'HIV protease inhibitor with the highest genetic barrier to resistance among current-era PIs — designed to retain potency against viruses with multiple PI-resistance mutations. Mechanism: competitive HIV-1 aspartyl protease inhibition. Always coadministered with a CYP3A4 booster (cobicistat as DRV/c in Prezcobix/Symtuza; ritonavir as DRV/r). Substrate of CYP3A4 — own clearance is dominated by oxidative metabolism. The DRV component of the Symtuza single-tablet regimen (DRV 800 / cobi 150 / FTC 200 / TAF 10 mg). Common AE: rash (sulfa moiety; rare SJS), GI intolerance.',
  routes: ['PO'],
  doses: { PO: { min: 600, max: 800, typical: 800 } },
  mw_g_mol: 547.66,
  systems: ['immune-hematologic'],
};

const LOPINAVIR: Compound = {
  slug: 'lopinavir',
  name: 'Lopinavir',
  aliases: ['ABT-378', 'LPV', 'Kaletra (with ritonavir)'],
  category: 'pharmacological',
  mechanism:
    'HIV protease inhibitor — clinically available only as the Kaletra co-formulation with ritonavir (LPV/r 200/50 mg). Ritonavir component is sub-therapeutic for HIV but boosts lopinavir AUC ~80× via CYP3A4 inhibition. Largely displaced by integrase-inhibitor-based first-line regimens (DTG, BIC, RAL); retained for second-line use, pediatric HIV, and post-exposure prophylaxis in some settings. Investigated and rejected for COVID-19 (Recovery trial 2020 — no mortality benefit). Common AE: hyperlipidemia, insulin resistance, GI intolerance (worse than DRV/c).',
  routes: ['PO'],
  doses: { PO: { min: 400, max: 800, typical: 400 } },
  mw_g_mol: 628.80,
  systems: ['immune-hematologic'],
};

const TELITHROMYCIN: Compound = {
  slug: 'telithromycin',
  name: 'Telithromycin',
  aliases: ['Ketek', 'HMR-3647'],
  category: 'pharmacological',
  mechanism:
    'First-in-class ketolide antibiotic — semi-synthetic erythromycin derivative for community-acquired respiratory infections. Strong CYP3A4 inhibitor (more potent than clarithromycin) with predictable QT prolongation. Withdrawn from the US market 2007 after post-marketing reports of severe hepatotoxicity (including fulminant hepatic failure), transient visual disturbances (cycloplegia / diplopia), syncope, and myasthenia gravis exacerbation. Retained in the registry for historical reference and as the textbook example of "post-market signal forced withdrawal" alongside cerivastatin and rofecoxib.',
  routes: ['PO'],
  doses: { PO: { min: 800, max: 800, typical: 800 } },
  mw_g_mol: 812.00,
  systems: ['immune-hematologic'],
};

const COBICISTAT_EDGES: InteractionRef[] = [
  {
    slug: 'midazolam',
    name: 'Midazolam',
    level: 'major',
    note: 'CYP3A4 inhibition (mechanism-based). Mathias 2010 (PMID:20043009) verbatim: "GS-9350 potently inhibited midazolam apparent clearance (95% reduction), similar in effect to ritonavir 100 mg". Phase-1 single- + multiple-dose escalation, 50-400 mg cobicistat (GS-9350) + PO midazolam probe. CL ↓95% → AUC ratio 1/0.05 = 20×; Ki ≈ 1.5/19 = 0.079 µM. Cobicistat was DESIGNED as a CYP3A4 booster equivalent to RTV — the midazolam DDI is the design-intent test.',
    kinetics: { ki_uM: 0.079 },
    source_pmid: 'PMID:20043009',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  if (existing?.kinetics?.ki_uM === edge.kinetics?.ki_uM && existing?.source_pmid === edge.source_pmid) {
    return 'already';
  }
  if (existing) {
    Object.assign(existing, edge);
    return 'updated';
  }
  perp.interactions.push(edge);
  return 'added';
}

function addRef(perp: Compound, pmid: string | undefined): void {
  if (!pmid) return;
  perp.refs = perp.refs ?? [];
  if (!perp.refs.includes(pmid)) perp.refs.push(pmid);
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let compoundsAdded = 0;
  for (const c of [COBICISTAT, ATAZANAVIR, DARUNAVIR, LOPINAVIR, TELITHROMYCIN]) {
    if (bySlug.has(c.slug)) {
      console.log(`  [skip] ${c.slug} already in registry`);
    } else {
      data.push(c);
      bySlug.set(c.slug, c);
      compoundsAdded++;
      console.log(`  [add ] ${c.slug} (new compound, mw=${c.mw_g_mol})`);
    }
  }

  let edgesAdded = 0;
  const cob = bySlug.get('cobicistat');
  if (!cob) throw new Error('cobicistat missing (should have been added)');
  for (const edge of COBICISTAT_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(cob, edge);
    addRef(cob, edge.source_pmid);
    if (r === 'added') edgesAdded++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] cobicistat → ${edge.slug.padEnd(15)} Ki=${edge.kinetics?.ki_uM} µM ${edge.source_pmid}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nHIV/ketolide stubs (v1.1): +${compoundsAdded} compounds, +${edgesAdded} cobicistat edges. 5 cobicistat-tail skips logged.`);
}

main();
