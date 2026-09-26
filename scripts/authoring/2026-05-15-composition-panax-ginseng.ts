/**
 * 2026-05-15-composition-panax-ginseng.ts — first composite-compound entry.
 *
 * Adds:
 *   1. composition field on panax-ginseng (2 ginsenosides: Rb1 + Rg3)
 *   2. PK on ginsenoside-rg3 (was previously pk_unauthored: research-only),
 *      from Pang 2001 (PMID:12580081 — primary clinical PK in 8 volunteers,
 *      single 3.2 mg/kg oral dose)
 *
 * Composition basis: Asian Panax ginseng root extract standardized to ~4%
 * total ginsenosides (typical commercial spec). Of the ginsenoside fraction,
 * Rb1 is the most abundant protopanaxadiol (~30% of total ginsenosides) and
 * Rg3 is a minor protopanaxadiol (~5%) — at-label content values reflect
 * the proportions commonly reported in HPLC analyses of standardized
 * extracts (e.g. Cheonji et al / Hsu 2022 American-ginseng analogue). These
 * are product-specification numbers, not pharmacological claims — no PMID
 * is required for the `mg_per_g_extract` values themselves.
 *
 * Rg3 PK from PMID:12580081 (Pang 2001 Yao Xue Xue Bao):
 *   • 20(R)-ginsenoside Rg3, single 3.2 mg/kg PO, n=8 male volunteers
 *   • t1/2(ka) = 0.28 h → ka = ln2/0.28 = 2.48 /h
 *   • t1/2(beta) = 4.9 h (elimination half-life)
 *   • Cmax 16 ng/mL, Tmax 0.66 h, AUC0-∞ = 77 ng·mL⁻¹·h
 *   • F not directly reported (no IV arm); 0.05 used per ginsenoside-class
 *     literature precedent (matches existing Rb1 authoring), with explicit
 *     note. V_L derived from CL/F = Dose/AUC = 2909 L/h, then assuming F=0.05
 *     gives CL = 145 L/h and Vd = CL × t½/ln2 ≈ 1025 L.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk?: Record<string, { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string; note?: string }>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  composition?: {
    standardization?: string;
    constituents: Array<{ slug: string; mg_per_g_extract: number; note?: string; source_pmid?: string }>;
  };
  refs?: string[];
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  // 1) Author Rg3 PK from Pang 2001
  const rg3 = bySlug.get('ginsenoside-rg3');
  if (!rg3) throw new Error('ginsenoside-rg3 missing from registry');
  rg3.pk = {
    PO: {
      ka_hr: 2.48,
      V_L: 1025,
      F: 0.05,
      source_pmid: 'PMID:12580081',
      note: 'Pang 2001 Yao Xue Xue Bao — n=8 male volunteers, single 3.2 mg/kg PO 20(R)-Rg3; t1/2,ka=0.28h → ka=2.48/h; t1/2β=4.9h; Cmax=16 ng/mL; Tmax=0.66h; AUC=77 ng·mL⁻¹·h. F=0.05 estimated per ginsenoside-class precedent (no IV reference); V_L=1025 L derived from CL/F=2909 L/h × assumed F=0.05.',
    },
  };
  rg3.half_life_hr = { PO: 4.9 };
  // Promote from research-only to authored
  delete rg3.pk_unauthored;
  rg3.refs = Array.from(new Set([...(rg3.refs || []), 'PMID:12580081']));

  // 2) Add composition to panax-ginseng
  const panax = bySlug.get('panax-ginseng');
  if (!panax) throw new Error('panax-ginseng missing from registry');
  panax.composition = {
    standardization: '4% total ginsenosides (Asian P. ginseng root extract — typical commercial spec)',
    constituents: [
      { slug: 'ginsenoside-rb1', mg_per_g_extract: 12, note: '~30% of the ginsenoside fraction in standardized Asian P. ginseng extracts (most abundant protopanaxadiol)' },
      { slug: 'ginsenoside-rg3', mg_per_g_extract: 2,  note: '~5% of the ginsenoside fraction; minor protopanaxadiol' },
    ],
  };

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log('OK — added Rg3 PK + panax-ginseng composition (2 constituents)');
}

main();
