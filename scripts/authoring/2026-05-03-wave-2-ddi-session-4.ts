/**
 * 2026-05-03-wave-2-ddi-session-4.ts — Wave 2 fourth DDI session.
 *
 * 7 quantitative edges authored:
 *   - Midazolam victim axis (4 edges):
 *     ketoconazole → midazolam (Ki 0.43 µM)
 *     itraconazole → midazolam (Ki 0.13 µM)
 *     ritonavir → midazolam (Ki 0.11 µM)
 *     erythromycin → midazolam (Ki 1.67 µM)
 *   - Fluvoxamine CYP1A2 (2 edges):
 *     fluvoxamine → caffeine (Ki 0.039 µM)
 *     fluvoxamine → theophylline (Ki 0.07 µM)
 *   - Inducer:
 *     carbamazepine → cyclosporine (induction_factor 2.0, Cav <50%)
 *
 * Skipped: TMP-SMX → warfarin (no abstract AUC verbatim despite well-
 * known clinical interaction), allopurinol → azathioprine (presystemic
 * XO mostly; PO-AZA AUC fold-change not in any verifiable abstract),
 * fluoxetine → tamoxifen (Binkhorst pooled paroxetine+fluoxetine arm
 * can\'t isolate fluoxetine alone).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type InteractionRef = {
  slug: string;
  name: string;
  level: string;
  note: string;
  timing?: string;
  kinetics?: { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number };
  source_pmid?: string;
};

type Edge = {
  perpetrator: string;
  victim_slug: string;
  victim_name: string;
  level: string;
  note: string;
  kinetics?: { ki_uM?: number; induction_factor?: number };
  source_pmid?: string;
};

const EDGES: Edge[] = [
  {
    perpetrator: 'ketoconazole',
    victim_slug: 'midazolam',
    victim_name: 'Midazolam',
    level: 'major',
    note: 'CYP3A4 inhibition. Olkkola 1994 (PMID:8181191): ketoconazole 400 mg/d × 4 d raised midazolam AUC 10-15× and Cmax 3-4× (n=9 healthy). Avoid combination; if essential, drastically reduce midazolam dose.',
    kinetics: { ki_uM: 0.43 },
    source_pmid: 'PMID:8181191',
  },
  {
    perpetrator: 'itraconazole',
    victim_slug: 'midazolam',
    victim_name: 'Midazolam',
    level: 'major',
    note: 'CYP3A4 inhibition. Olkkola 1994 (PMID:8181191): itraconazole 200 mg/d × 4 d raised midazolam AUC 10-15× and Cmax 3-4× (same study as ketoconazole arm). Avoid combination.',
    kinetics: { ki_uM: 0.13 },
    source_pmid: 'PMID:8181191',
  },
  {
    perpetrator: 'ritonavir',
    victim_slug: 'midazolam',
    victim_name: 'Midazolam',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition (most potent oral inhibitor). Greenblatt 2009 (PMID:20002087): low-dose ritonavir 100 mg × 3 raised midazolam AUC 28.4× and reduced oral CL to 4.2% of control (n=13 healthy). Combination contraindicated.',
    kinetics: { ki_uM: 0.11 },
    source_pmid: 'PMID:20002087',
  },
  {
    perpetrator: 'erythromycin',
    victim_slug: 'midazolam',
    victim_name: 'Midazolam',
    level: 'major',
    note: 'CYP3A4 inhibition. Olkkola 1993 (PMID:8453848): erythromycin 500 mg TID × 7 d raised oral midazolam AUC >4× and reduced IV midazolam CL by 54% (n=12 healthy). Avoid; choose azithromycin if a macrolide is needed.',
    kinetics: { ki_uM: 1.67 },
    source_pmid: 'PMID:8453848',
  },
  {
    perpetrator: 'fluvoxamine',
    victim_slug: 'caffeine',
    victim_name: 'Caffeine',
    level: 'major',
    note: 'Strong CYP1A2 inhibition. Jeppesen 1996 (PMID:8807660): fluvoxamine 100 mg/d × 8 d dropped caffeine total CL from 107 to 21 mL/min (5.1× reduction); t½ rose 5 to 31 h. Restrict caffeine on fluvoxamine to avoid jitteriness / insomnia.',
    kinetics: { ki_uM: 0.039 },
    source_pmid: 'PMID:8807660',
  },
  {
    perpetrator: 'fluvoxamine',
    victim_slug: 'theophylline',
    victim_name: 'Theophylline',
    level: 'major',
    note: 'CYP1A2 inhibition. Rasmussen 1997 (PMID:9029748): fluvoxamine 100 mg/d × 7 d dropped theophylline CL 80→24 mL/min (3.3× reduction); t½ rose 6.6→22 h (n=12 healthy). Reduce theophylline dose ~⅔ + monitor levels.',
    kinetics: { ki_uM: 0.07 },
    source_pmid: 'PMID:9029748',
  },
  {
    perpetrator: 'carbamazepine',
    victim_slug: 'cyclosporine',
    victim_name: 'Cyclosporine',
    level: 'major',
    note: 'CYP3A4 induction. Cooney 1995 (PMID:7667170): carbamazepine reduced cyclosporine dose-normalized average steady-state concentration to <50% of control in pediatric renal transplant patients. Increase cyclosporine dose ~2× and monitor trough.',
    kinetics: { induction_factor: 2.0 },
    source_pmid: 'PMID:7667170',
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0;
  let alreadyHas = 0;
  let missing = 0;

  for (const e of EDGES) {
    const c = bySlug.get(e.perpetrator);
    if (!c) { console.warn(`  [warn] missing perpetrator: ${e.perpetrator}`); missing++; continue; }
    if (!bySlug.has(e.victim_slug)) { console.warn(`  [warn] missing victim: ${e.victim_slug}`); missing++; continue; }

    const interactions = (c['interactions'] as InteractionRef[] | undefined) ?? [];
    const existing = interactions.find(i =>
      i.slug === e.victim_slug && i.kinetics != null);
    if (existing) { alreadyHas++; continue; }

    const newRef: InteractionRef = {
      slug: e.victim_slug,
      name: e.victim_name,
      level: e.level,
      note: e.note,
    };
    if (e.kinetics) newRef.kinetics = e.kinetics;
    if (e.source_pmid) newRef.source_pmid = e.source_pmid;
    interactions.push(newRef);
    c['interactions'] = interactions;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2 session 4: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
