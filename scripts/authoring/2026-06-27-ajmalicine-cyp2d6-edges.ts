/**
 * 2026-06-27-ajmalicine-cyp2d6-edges.ts
 *
 * Kinetic-interaction edges for ajmalicine (raubasine) as a CYP2D6 inhibitor.
 * GtoPdb (ligand 8746) curates ajmalicine's human CYP2D6 inhibition at Ki 3.3 nM
 * (= 0.0033 µM), primary ref PMID:8487254. ajmalicine carries mw_g_mol 352.4
 * (required for the solver's µM→mg/L conversion), and PMID:8487254 is already in
 * its refs (added in the rich-occupancy script).
 *
 * Victims: CYP2D6 *clearance* substrates only (CYP2D6 is an elimination pathway →
 * inhibition raises exposure, the direction the ki model captures). PRODRUGS whose
 * CYP2D6 step is bioACTIVATION (codeine, tramadol, tamoxifen) are deliberately
 * EXCLUDED — for them inhibition lowers the active metabolite, which a ki-on-parent-
 * clearance edge would model backwards.
 *
 * level = 'caution' with an explicit caveat: the Ki is an in-vitro potency, most
 * relevant at raubasine drug doses; in yohimbe ajmalicine is a trace constituent
 * (and currently has no authored PK, so the edge is documentary until PK lands).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Edge { slug: string; name: string; level: string; note: string; kinetics?: { ki_uM?: number }; source_pmid?: string }
interface Compound { slug: string; name?: string; interactions?: Edge[]; refs?: string[]; mw_g_mol?: number; [k: string]: unknown }

const KI_UM = 0.0033;              // 3.3 nM
const SRC = 'PMID:8487254';
const VICTIMS = [
  'dextromethorphan', 'metoprolol', 'atomoxetine', 'desipramine',
  'nortriptyline', 'risperidone', 'aripiprazole', 'nebivolol',
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  const ajm = bySlug.get('ajmalicine');
  if (!ajm) { console.error('  [ERROR] ajmalicine not found'); process.exit(1); }
  if (!ajm.mw_g_mol) { console.error('  [ERROR] ajmalicine lacks mw_g_mol — kinetic edges would be inert'); process.exit(1); }

  ajm.interactions = ajm.interactions ?? [];
  const already = new Set(ajm.interactions.filter(e => e.kinetics && e.source_pmid === SRC).map(e => e.slug));

  let added = 0, missing = 0;
  for (const v of VICTIMS) {
    const victim = bySlug.get(v);
    if (!victim) { console.log(`  [warn] victim missing in registry: ${v}`); missing++; continue; }
    if (already.has(v)) { console.log(`  [skip] ajmalicine→${v} already authored`); continue; }
    const vName = victim.name ?? v;
    ajm.interactions.push({
      slug: v,
      name: vName,
      level: 'caution',
      note: `${vName} is a CYP2D6 substrate; ajmalicine (raubasine) is a potent in-vitro CYP2D6 inhibitor (Ki 3.3 nM), so co-exposure could raise ${vName} levels. In-vitro potency — clinically relevant at raubasine drug doses; from yohimbe, ajmalicine is a trace constituent.`,
      kinetics: { ki_uM: KI_UM },
      source_pmid: SRC,
    });
    console.log(`  [edge] ajmalicine → ${v}  (Ki ${KI_UM} µM, ${SRC})`);
    added++;
  }

  if (added) writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nAjmalicine CYP2D6 edges (2026-06-27): +${added} edges${missing ? `, ${missing} victim(s) absent` : ''}.`);
}

main();
