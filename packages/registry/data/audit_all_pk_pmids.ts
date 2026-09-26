import { readFileSync } from 'fs';
import type { AuditCompound, AuditEffectCompartment, AuditRoutePk } from './_audit-types.ts';

const compounds = JSON.parse(
  readFileSync(new URL('./compounds.json', import.meta.url), 'utf8'),
) as AuditCompound[];

interface PkRow {
  slug: string;
  name: string;
  category: string;
  route: string;
  F?: number;
  ka_hr?: number;
  V_L?: number;
  t12?: number;
  pmid?: string;
  notes?: string;
  effectComp?: AuditEffectCompartment;
}

const rows: PkRow[] = [];

for (const c of compounds) {
  if (!c.pk) continue;
  for (const [r, pk] of Object.entries(c.pk) as [string, AuditRoutePk | undefined][]) {
    if (!pk) continue;
    rows.push({
      slug: c.slug,
      name: c.name,
      category: c.category,
      route: r,
      F: pk.F,
      ka_hr: pk.ka_hr,
      V_L: pk.V_L,
      t12: c.half_life_hr?.[r],
      pmid: pk.source_pmid,
      notes: c.notes,
      effectComp: c.effect_compartment,
    });
  }
}

console.log(`Total authored PK route entries: ${rows.length}`);

// Unique PMIDs cited for PK:
const pmidMap = new Map<string, string[]>();
for (const r of rows) {
  if (r.pmid) {
    const list = pmidMap.get(r.pmid) || [];
    list.push(`${r.slug} (${r.route})`);
    pmidMap.set(r.pmid, list);
  }
}
console.log(`Unique PMIDs cited for PK: ${pmidMap.size}`);

// Print out any entries where notes or mechanism or anything hints at animal or research peptide or uncharacterized human PK
const peptideOrResearchOrAnimal = rows.filter((r) => {
  const blob = `${r.notes || ''} ${r.slug} ${r.category}`;
  return (
    r.category === 'peptide' ||
    r.category === 'adaptogen' ||
    r.category === 'nootropic' ||
    /sarm|research|peptide|tuftsin|rat|rodent|animal|dog|canine/i.test(blob)
  );
});

console.log(
  `\nChecking ${peptideOrResearchOrAnimal.length} peptide/research/animal-suspect PK entries:\n`,
);
for (const r of peptideOrResearchOrAnimal) {
  console.log(
    `[${r.slug}] ${r.name} (${r.category}) - Route: ${r.route} - F: ${r.F}, ka: ${r.ka_hr}, Vd: ${r.V_L}, t1/2: ${r.t12}, PMID: ${r.pmid}`,
  );
  if (r.notes) console.log(`  Notes: ${r.notes}`);
}
