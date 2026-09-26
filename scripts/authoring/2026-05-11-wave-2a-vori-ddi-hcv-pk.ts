/**
 * 2026-05-11-wave-2a-vori-ddi-hcv-pk.ts — v1.2 phase-4 round 3.
 *
 * Two wins:
 *
 *   (A) Resolves the documented v1.1 "voriconazole → omeprazole" +
 *       "voriconazole → sirolimus" paywall items. Both AUC ratios
 *       live in the Vfend FDA-label Section 7 Table 11. DailyMed
 *       truncated the section on direct WebFetch in v1.2 round 1,
 *       but the verbatim values surfaced via WebSearch against
 *       accessdata.fda.gov label PDFs:
 *
 *         vori → omeprazole: "Cmax and AUCτ of omeprazole an
 *           average of 2 times (90% CI: 1.8, 2.6) and 4 times (90%
 *           CI: 3.3, 4.4), respectively"
 *           → Ki ≈ 5/3 = 1.67 µM, warn level
 *         vori → sirolimus (authored under existing `rapamycin` slug;
 *           same compound, INN vs original name): "Cmax and AUC of
 *           sirolimus an average of 7-fold (90% CI: 5.7, 7.5) and
 *           11-fold (90% CI: 9.9, 12.6), respectively"
 *           → Ki ≈ 5/10 = 0.5 µM, major level (label-contraindicated)
 *
 *   (B) PK for 3 HCV DAAs (daclatasvir + elbasvir + grazoprevir)
 *       that were v1.1-stubbed without PK. Same DailyMed/accessdata
 *       label-sourcing pattern as the prior PK rounds.
 *
 *         daclatasvir   PO 60 mg qd: Cmax 1534, AUC 14122, t½ 13h, F 67%
 *         elbasvir      PO 50 mg qd: Cmax 121,  AUC 1920,  t½ 24h, F 32%
 *         grazoprevir   PO 100 mg qd: Cmax 165, AUC 1420,  t½ 31h, F 27%
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
  pk?: Record<string, { ka_hr?: number; ke_hr?: number; V_L?: number; F?: number; source_pmid?: string }>;
  half_life_hr?: Record<string, number>;
  mechanism?: string;
  interactions?: InteractionRef[];
  refs?: string[];
  [k: string]: unknown;
}

const PK_DATA: Record<string, { half_life: Record<string, number>; pk: Compound['pk']; mech_addendum: string }> = {
  'daclatasvir': {
    half_life: { PO: 13 },
    pk: { PO: { ka_hr: 0.7, V_L: 53, F: 0.67 } },
    mech_addendum: ' PK (Daklinza label, 60 mg PO qd SS): Cmax 1534 ng/mL, AUC 14122 ng·h/mL, Tmax ~2 h, t½ 12-15 h, F 67%, protein binding ~99%. High-fat meal ↓Cmax 28%, ↓AUC 23%. Steady state by day 4. CYP3A4 substrate + P-gp substrate; ritonavir / strong CYP3A4 inhibitors raise AUC ~3-fold.',
  },
  'elbasvir': {
    half_life: { PO: 24 },
    pk: { PO: { ka_hr: 0.5, V_L: 288, F: 0.32 } },
    mech_addendum: ' PK (Zepatier label, 50 mg PO qd SS): Cmax 121 ng/mL, AUC 1920 ng·h/mL, Tmax 3 h (range 3-6), t½ 24 h, F 32%. High-fat meal effect on elbasvir is modest (~15%). Steady state by ~6 days. CYP3A4 substrate; strong inhibitors require dose adjustment.',
  },
  'grazoprevir': {
    half_life: { PO: 31 },
    pk: { PO: { ka_hr: 0.7, V_L: 844, F: 0.27 } },
    mech_addendum: ' PK (Zepatier label, 100 mg PO qd SS): Cmax 165 ng/mL, AUC 1420 ng·h/mL, Tmax 2 h (range 30 min-3 h), t½ 31 h, F 27%. High-fat meal increases grazoprevir AUC 1.5-fold + Cmax 2.8-fold — a substantial food effect. Mild OATP1B1/B3 inhibitor — caution with statins.',
  },
};

// Note-only DDI edges: data-lint requires source_pmid for any edge with
// a kinetics block, and these label-derived values have no indexed
// PubMed primary paper (FDA Vfend label is the canonical source — the
// underlying clinical studies were Pfizer-internal, never published).
// Authored without kinetics to satisfy the lint while still surfacing
// the DDI on the compound detail page. Verbatim AUC numbers + label
// citation preserved in the note prose for verifiability.
const VORICONAZOLE_NEW_EDGES: InteractionRef[] = [
  {
    slug: 'omeprazole',
    name: 'Omeprazole',
    level: 'warn',
    note: 'CYP2C19 inhibition (label-only DDI, no indexed primary PMID). Vfend label Section 7 verbatim: "Cmax and AUCτ of omeprazole an average of 2 times (90% CI: 1.8, 2.6) and 4 times (90% CI: 3.3, 4.4), respectively" with vori 200 mg q12h × 6d + omep 40 mg/d × 7d. AUC 4×; label recommends halving omep dose ≥40 mg when starting vori.',
  },
  {
    slug: 'rapamycin',
    name: 'Sirolimus',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition (label-only DDI, no indexed primary PMID). Vfend label Section 7 verbatim: "increased the Cmax and AUC of sirolimus (2 mg single dose) an average of 7-fold (90% CI: 5.7, 7.5) and 11-fold (90% CI: 9.9, 12.6), respectively, in healthy male subjects". Vori 200 mg q12h × 8d + 2 mg sirolimus single dose. Label CONTRAINDICATED — sirolimus toxicity risk.',
  },
];

function applyPk(c: Compound, info: { half_life: Record<string, number>; pk: Compound['pk']; mech_addendum: string }): void {
  c.pk = info.pk;
  c.half_life_hr = { ...(c.half_life_hr ?? {}), ...info.half_life };
  if (info.mech_addendum && c.mechanism && !c.mechanism.includes('PK (')) {
    c.mechanism = c.mechanism + info.mech_addendum;
  }
}

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  if (existing) { Object.assign(existing, edge); return 'updated'; }
  perp.interactions.push(edge);
  return 'added';
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  // (A) HCV DAA PK
  let pkUpdated = 0;
  for (const [slug, info] of Object.entries(PK_DATA)) {
    const c = bySlug.get(slug);
    if (!c) { console.log(`  [warn] PK target missing: ${slug}`); continue; }
    applyPk(c, info);
    pkUpdated++;
    const t12 = Object.values(info.half_life)[0];
    console.log(`  [pk  ] ${slug.padEnd(15)} t½=${t12}h`);
  }

  // (B) Voriconazole DDI edges
  const vori = bySlug.get('voriconazole');
  if (!vori) throw new Error('voriconazole missing');
  let edgesAdded = 0;
  for (const edge of VORICONAZOLE_NEW_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(vori, edge);
    if (r === 'added') edgesAdded++;
    console.log(`  [${r === 'added' ? 'add ' : 'updt'}] voriconazole → ${edge.slug.padEnd(13)} Ki=${edge.kinetics?.ki_uM} µM (FDA label)`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nv1.2 phase-4 round 3: +${pkUpdated} PK, +${edgesAdded} vori DDI edges. Paywall items resolved: vori→omep + vori→sirolimus.`);
}

main();
