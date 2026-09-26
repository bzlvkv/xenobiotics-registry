import { readFileSync } from 'fs';
import type {
  AuditCompound,
  AuditEffectCompartment,
  AuditReceptorSite,
  AuditRoutePk,
} from './_audit-types.ts';

const compounds = JSON.parse(
  readFileSync(new URL('./compounds.json', import.meta.url), 'utf8'),
) as AuditCompound[];

interface Finding {
  slug: string;
  name: string;
  category: string;
  issue: string;
  detail: string;
  currentNotes?: string;
  pk?: Record<string, AuditRoutePk | undefined>;
  halfLife?: Record<string, number | undefined>;
  effectCompartment?: AuditEffectCompartment;
  receptors?: AuditReceptorSite[];
}

const findings: Finding[] = [];

// Keywords that indicate animal / preclinical provenance
const animalRe =
  /\b(rat|rats|rodent|rodents|mouse|mice|murine|dog|canine|monkey|primate|non-human|sheep|rabbit|bovine|porcine|pig|in vitro|ex vivo|animal|preclinical)\b/i;
const animalSpeciesExplicit =
  /\b(rat|rats|rodent|rodents|mouse|mice|dog|canine|monkey|sheep|rabbit|bovine|porcine)\b/i;

for (const c of compounds) {
  // 1. Check PK parameters
  if (c.pk) {
    for (const [route, pk] of Object.entries(c.pk) as [string, AuditRoutePk | undefined][]) {
      if (!pk) continue;
      // Check if source or notes indicate animal work
      const notes = c.notes || '';

      // Look for peptide / research chem / nootropic / supplement entries with PK
      // Let's check if the notes disclose animal provenance when notes or mechanism mention animal
      if (
        animalRe.test(notes) ||
        animalRe.test(c.mechanism ?? '') ||
        (c.notes && /canine|rodent|rat|animal/i.test(c.notes))
      ) {
        if (
          !c.notes ||
          !/animal|rodent|canine|rat|mouse|preclinical|in vitro|human/i.test(c.notes)
        ) {
          findings.push({
            slug: c.slug,
            name: c.name,
            category: c.category,
            issue: 'PK authored but animal/preclinical source not disclosed in notes',
            detail: `Route ${route}: F=${pk.F}, ka=${pk.ka_hr}, Vd=${pk.V_L}, PMID=${pk.source_pmid}`,
            currentNotes: c.notes,
            pk: c.pk,
            halfLife: c.half_life_hr,
          });
        }
      }
    }
  }

  // 2. Check receptor occupancy
  if (c.receptor_occupancy) {
    for (const rec of c.receptor_occupancy) {
      if (rec.note && animalSpeciesExplicit.test(rec.note)) {
        findings.push({
          slug: c.slug,
          name: c.name,
          category: c.category,
          issue: 'Receptor occupancy uses animal tissue / assay',
          detail: `Receptor ${rec.receptor}: ${rec.note}`,
          currentNotes: c.notes,
          receptors: [rec],
        });
      }
    }
  }

  // 3. Check effect compartment
  if (c.effect_compartment?.note && animalSpeciesExplicit.test(c.effect_compartment.note)) {
    findings.push({
      slug: c.slug,
      name: c.name,
      category: c.category,
      issue: 'Effect compartment derived from animal model',
      detail: `keo: ${c.effect_compartment.keo_per_h}/h, note: ${c.effect_compartment.note}`,
      currentNotes: c.notes,
      effectCompartment: c.effect_compartment,
    });
  }
}

console.log(`Total specific findings: ${findings.length}`);
for (const f of findings) {
  console.log(`\n[${f.slug}] (${f.category}) - ${f.issue}`);
  console.log(`Detail: ${f.detail}`);
  if (f.currentNotes) console.log(`Notes: ${f.currentNotes}`);
}
