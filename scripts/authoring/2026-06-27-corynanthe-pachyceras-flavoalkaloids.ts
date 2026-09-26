/**
 * 2026-06-27-corynanthe-pachyceras-flavoalkaloids.ts
 *
 * Three corynanthean–epicatechin FLAVOALKALOIDS — hybrid molecules joining a
 * corynantheine/corynantheidine-type indole (indoloquinolizidine) alkaloid core to
 * an epicatechin (flavan-3-ol) unit. They are the alkaloid↔tannin bridge of the
 * Corynanthe/Pausinystalia alkaloid complex.
 *
 * IMPORTANT scope note: these were isolated from the stem bark of *Corynanthe
 * pachyceras* (PMID:32517373), a botanical RELATIVE of yohimbe — their occurrence
 * in *Pausinystalia johimbe* itself is NOT established. Authored here as
 * C. pachyceras constituents (accurate), not as yohimbe constituents.
 *
 * Identity re-verified at PubChem (CID + MW + formula). The source abstract reports
 * the three "exerted moderate antiplasmodial activities" but gives NO verbatim IC50
 * — so only the qualitative activity is stated; no number is fabricated. Whole-cell
 * antiplasmodial activity is not a receptor target, so no receptor_occupancy.
 *
 *   epicatechocorynantheine-a    CID 146035642  C37H40N2O9  MW 656.7
 *   epicatechocorynantheine-b    CID 146035632  C37H40N2O9  MW 656.7
 *   epicatechocorynantheidine    CID 146035606  C37H38N2O9  MW 654.7
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  routes?: string[];
  doses?: Record<string, unknown>;
  mw_g_mol?: number;
  systems?: string[];
  pk_unauthored?: { reason: string; note?: string };
  notes?: string;
  refs?: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  {
    slug: 'epicatechocorynantheine-a',
    name: 'Epicatechocorynantheine A',
    aliases: [],
    category: 'alkaloid',
    mechanism:
      'A corynanthean–epicatechin flavoalkaloid — a corynantheine-type indole (indoloquinolizidine) alkaloid covalently linked to an epicatechin (flavan-3-ol) unit, in the same monoterpene-indole-alkaloid class as yohimbine. Isolated from the stem bark of Corynanthe pachyceras, a botanical relative of yohimbe (Pausinystalia johimbe); occurrence in P. johimbe itself is not established. Reported to have moderate antiplasmodial activity; its receptor pharmacology is uncharacterised.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 656.7,
    systems: ['immune-hematologic'],
    pk_unauthored: { reason: 'research-only', note: 'Flavoalkaloid from Corynanthe pachyceras; no isolated-compound PK; only qualitative antiplasmodial activity reported.' },
    notes:
      'PubChem CID 146035642 (C37H40N2O9, MW 656.7). Isolated from Corynanthe pachyceras stem bark (PMID:32517373) — NOT confirmed in Pausinystalia johimbe. Abstract reports "moderate antiplasmodial activities" without a verbatim IC50.',
    refs: ['PMID:32517373'],
  },
  {
    slug: 'epicatechocorynantheine-b',
    name: 'Epicatechocorynantheine B',
    aliases: [],
    category: 'alkaloid',
    mechanism:
      'A corynanthean–epicatechin flavoalkaloid: a corynantheine-type indole (indoloquinolizidine) alkaloid conjugated to an epicatechin flavan-3-ol unit — the same monoterpene-indole-alkaloid class as yohimbine. Isolated from the stem bark of Corynanthe pachyceras, a relative of yohimbe (Pausinystalia johimbe); occurrence in P. johimbe itself is not established. Reported to have moderate antiplasmodial activity; its receptor pharmacology is uncharacterised.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 656.7,
    systems: ['immune-hematologic'],
    pk_unauthored: { reason: 'research-only', note: 'Flavoalkaloid from Corynanthe pachyceras; no isolated-compound PK; only qualitative antiplasmodial activity reported.' },
    notes:
      'PubChem CID 146035632 (C37H40N2O9, MW 656.7). Isolated from Corynanthe pachyceras stem bark (PMID:32517373) — NOT confirmed in Pausinystalia johimbe. Abstract reports "moderate antiplasmodial activities" without a verbatim IC50.',
    refs: ['PMID:32517373'],
  },
  {
    slug: 'epicatechocorynantheidine',
    name: 'Epicatechocorynantheidine',
    aliases: [],
    category: 'alkaloid',
    mechanism:
      'A corynanthean–epicatechin flavoalkaloid joining a corynantheidine-type monoterpene indole alkaloid unit (the same corynanthean skeleton class as yohimbine) to an epicatechin (flavan-3-ol) unit. Isolated from the stem bark of Corynanthe pachyceras, a relative of yohimbe (Pausinystalia johimbe); occurrence in P. johimbe itself is not established. Reported to have moderate antiplasmodial activity; its receptor pharmacology is uncharacterised.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 654.7,
    systems: ['immune-hematologic'],
    pk_unauthored: { reason: 'research-only', note: 'Flavoalkaloid from Corynanthe pachyceras; no isolated-compound PK; only qualitative antiplasmodial activity reported.' },
    notes:
      'PubChem CID 146035606 (C37H38N2O9, MW 654.7). Isolated from Corynanthe pachyceras stem bark (PMID:32517373) — NOT confirmed in Pausinystalia johimbe. Abstract reports "moderate antiplasmodial activities" without a verbatim IC50.',
    refs: ['PMID:32517373'],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, skipped = 0;
  for (const c of NEW_COMPOUNDS) {
    if (bySlug.has(c.slug)) { console.log(`  [skip] ${c.slug} already in registry`); skipped++; }
    else { data.push(c); bySlug.set(c.slug, c); added++; console.log(`  [add ] ${c.slug.padEnd(28)} mw=${c.mw_g_mol}`); }
  }
  if (added) writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nCorynanthe pachyceras flavoalkaloids (2026-06-27): +${added} (${skipped} present). Now ${data.length} compounds.`);
}

main();
