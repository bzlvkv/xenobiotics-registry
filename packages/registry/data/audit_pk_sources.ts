import { readFileSync } from 'fs';
import type { AuditCompound, AuditRoutePk } from './_audit-types.ts';

const compounds = JSON.parse(
  readFileSync(new URL('./compounds.json', import.meta.url), 'utf8'),
) as AuditCompound[];

console.log(`Total compounds: ${compounds.length}`);

const withPk = compounds.filter((c) => c.pk && Object.keys(c.pk).length > 0);
console.log(`Compounds with authored PK: ${withPk.length}`);

// Group by category
const catCounts: Record<string, number> = {};
for (const c of withPk) {
  catCounts[c.category] = (catCounts[c.category] || 0) + 1;
}
console.log('PK compounds by category:', catCounts);

// Let's check all peptides, adaptogens, nootropics, research compounds, supplements with PK
const suspectCategories = [
  'peptide',
  'nootropic',
  'adaptogen',
  'amino-acid',
  'lipid',
  'polyphenol',
  'alkaloid',
  'terpenoid',
];
const suspectList = withPk.filter(
  (c) =>
    suspectCategories.includes(c.category) ||
    (c.notes &&
      /animal|rodent|dog|canine|rat|mouse|in vitro|preclinical|approximate/i.test(c.notes)),
);

console.log(
  `\nInspecting ${suspectList.length} compounds in suspect categories or with animal/approximate notes:\n`,
);

for (const c of suspectList) {
  console.log(`=== [${c.slug}] ${c.name} (${c.category}) ===`);
  console.log(`Routes: ${(c.routes ?? []).join(', ')}`);
  for (const [r, pk] of Object.entries(c.pk ?? {}) as [string, AuditRoutePk][]) {
    console.log(
      `  Route ${r}: F=${pk.F}, ka=${pk.ka_hr}, Vd=${pk.V_L}, t1/2=${c.half_life_hr?.[r]}, PMID=${pk.source_pmid}`,
    );
  }
  if (c.notes) console.log(`  Notes: ${c.notes}`);
  if (c.effect_compartment)
    console.log(
      `  Effect comp: keo=${c.effect_compartment.keo_per_h}, note=${c.effect_compartment.note}`,
    );
  console.log('');
}
