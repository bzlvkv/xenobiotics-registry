/**
 * 2026-05-05-wave-3a-keo-session-18-groenendaal.ts — Wave 3a session 18.
 *
 * Full-text PDF retrieval of PMID:18467078 (Groenendaal 2008, Eur J
 * Pharm Sci) unlocked the per-compound k₁ₑ values flagged in Wave-3a
 * session 17 / opioid round 3 as the highest-yield re-author target.
 * The paper's abstract gave only a pooled range (0.04–0.47 min⁻¹);
 * Table 4 + Section 3.4 prose name the per-compound values verbatim.
 *
 *   - butorphanol  k₁ₑ = kₑ₀ = 0.21 ± 0.03 min⁻¹  → kₑₒ 12.6 /h
 *   - nalbuphine   k₁ₑ = kₑ₀ = 0.20 ± 0.04 min⁻¹  → kₑₒ 12.0 /h
 *
 * Verbatim sources (PMID:18467078):
 *   Table 4 row "Butorphanol": k₁ₑ 0.21 ± 0.03, kₑ₁ 0.21 ± 0.03
 *   Table 4 row "Nalbuphine":  k₁ₑ 0.20 ± 0.04, kₑ₁ 0.20 ± 0.04
 *   Section 3.4: "(0.47 min−1) > butorphanol (0.21 min−1) > nalbuphine
 *               (0.20 min−1) > sufentanil (0.17 min−1) > morphine
 *               (0.04 min−1)."
 *
 * Both compounds were modelled with a one-compartment biophase
 * distribution (k₁ₑ = kₑ₁), so kₑ₀ ≡ k₁ₑ — the value in min⁻¹ × 60
 * gives the per-hour kₑₒ. EEG-effect (delta-frequency amplitude) was
 * the PD endpoint; rat IV infusions (butorphanol 2.5/5/10 mg/kg in
 * 10 min, nalbuphine 5/10 mg/kg in 10 min). Species: rat — flagged
 * in note (consistent with morphine/sufentanil/fentanyl entries
 * already in catalog at species:rat from same paper family).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  {
    slug: 'butorphanol',
    ec: {
      keo_per_h: 12.6,
      source_pmid: 'PMID:18467078',
      note: 'Rat IV PK/EEG (Groenendaal 2008); Table 4 verbatim k1e=ke1=0.21±0.03 min⁻¹ (one-compartment biophase). 0.21 × 60 = 12.6 /h. EEG delta-frequency amplitude endpoint, IV 2.5/5/10 mg/kg over 10 min. Species: rat.',
    },
  },
  {
    slug: 'nalbuphine',
    ec: {
      keo_per_h: 12.0,
      source_pmid: 'PMID:18467078',
      note: 'Rat IV PK/EEG (Groenendaal 2008); Table 4 verbatim k1e=ke1=0.20±0.04 min⁻¹ (one-compartment biophase). 0.20 × 60 = 12.0 /h. EEG delta-frequency amplitude endpoint, IV 5/10 mg/kg over 10 min. Species: rat.',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let updated = 0, alreadyHas = 0, missing = 0;

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as { keo_per_h?: number; source_pmid?: string } | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { alreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    const refs = (c['refs'] as string[] | undefined) ?? [];
    if (!refs.includes(u.ec.source_pmid)) refs.push(u.ec.source_pmid);
    c['refs'] = refs;
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 18 (Groenendaal full-text): kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
