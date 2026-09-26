/**
 * 2026-05-05-consolidate-magnesium-threonate.ts
 *
 * The catalog had two slugs for the same compound:
 *   - magnesium-l-threonate (canonical per memory + has kₑₒ + verified
 *                             PK source PMID:20152124 Slutsky 2010)
 *   - magnesium-threonate   (richer mechanism prose, suspect PK V_L=1050
 *                             with PMID:11550076 — value implausible for
 *                             Mg²⁺ extracellular distribution)
 *
 * Consolidate into magnesium-l-threonate:
 *   - Replace mechanism prose with the richer paragraph
 *   - Extend aliases to include "Magtein", "Mg L-threonate", "MgT"
 *   - Drop the suspect PK from -threonate (V_L 1050 implausible);
 *     keep the verified PK from -l-threonate (V_L 14, PMID:20152124)
 *   - Migrate the 2 outbound interactions (magnesium-threonate →
 *     magnesium and → magnesium-glycinate) to fire from magnesium-l-threonate
 *   - Migrate the 2 inbound interactions (magnesium → magnesium-threonate,
 *     magnesium-glycinate → magnesium-threonate) to point at magnesium-l-threonate
 *   - Delete magnesium-threonate
 *
 * Compound count drops 1015 → 1014.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const RICH_MECHANISM = "Mg²⁺ chelated with two L-threonate (vitamin C metabolite) molecules. The threonate moiety is proposed to facilitate CNS uptake — Slutsky 2010 showed oral MgT raised rat CSF Mg²⁺ by ~15% where other Mg forms did not, with associated upregulation of NR2B-containing NMDA receptors and improved hippocampal LTP / learning. Elemental Mg content is only ~8% by weight, so MgT is not the right form for systemic Mg repletion; it's specifically a cognition-targeted form.";

const MERGED_ALIASES = ['Magtein', 'magtein', 'Mg L-threonate', 'MgT', 'magnesium-threonate'];

interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  mechanism?: string;
  interactions?: Array<{ slug: string; name?: string; level?: string; note?: string }>;
  refs?: string[];
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  const canonical = data.find(c => c.slug === 'magnesium-l-threonate');
  const duplicate = data.find(c => c.slug === 'magnesium-threonate');

  if (!canonical) { console.warn('  [warn] magnesium-l-threonate missing — nothing to consolidate'); return; }
  if (!duplicate) { console.log('Already consolidated (magnesium-threonate not present)'); return; }

  // 1. Merge mechanism + aliases into canonical
  canonical.mechanism = RICH_MECHANISM;
  const seenAliases = new Set([...(canonical.aliases ?? []), ...MERGED_ALIASES]);
  canonical.aliases = Array.from(seenAliases);

  // 2. Migrate outbound interactions from duplicate → canonical
  for (const ix of (duplicate.interactions ?? [])) {
    const exists = (canonical.interactions ?? []).find(i => i.slug === ix.slug);
    if (!exists) {
      canonical.interactions = [...(canonical.interactions ?? []), ix];
    }
  }

  // 3. Migrate inbound interactions: any compound that points at
  //    magnesium-threonate should now point at magnesium-l-threonate.
  let inboundMigrated = 0;
  for (const c of data) {
    for (const ix of (c.interactions ?? [])) {
      if (ix.slug === 'magnesium-threonate') {
        ix.slug = 'magnesium-l-threonate';
        inboundMigrated++;
      }
    }
  }

  // 4. Delete the duplicate slug
  const idx = data.findIndex(c => c.slug === 'magnesium-threonate');
  if (idx >= 0) data.splice(idx, 1);

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Consolidated magnesium threonate: merged into magnesium-l-threonate, migrated ${inboundMigrated} inbound refs, removed duplicate slug. Compound count now ${data.length}.`);
}

main();
