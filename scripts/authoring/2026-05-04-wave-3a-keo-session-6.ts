/**
 * 2026-05-04-wave-3a-keo-session-6.ts — Wave 3a session 6.
 *
 * 3 verified kₑₒ values from a 20-compound opioid / cardiovascular /
 * triptan / vasopressin pass. Hit rate ~15%.
 *
 *   - naloxone       kₑₒ 6.4   /h  resp-depression reversal of buprenorphine
 *                                  in volunteers; t½kₑₒ 6.5 min (PMID:17922561)
 *   - buprenorphine  kₑₒ 0.552 /h  resp-depression endpoint (isohypercapnic);
 *                                  t½kₑₒ 75.3 min (PMID:17185999)
 *   - methadone      kₑₒ 2.6   /h  miosis (pupil) after oral, placebo arm of
 *                                  quinidine-interaction study (PMID:15089813)
 *
 * Skipped: naltrexone, oxycodone, hydromorphone, tramadol, tapentadol,
 * esmolol, metoprolol, labetalol, nitroglycerin, isosorbide-mononitrate,
 * alprostadil, ergotamine, sumatriptan, rizatriptan, naratriptan,
 * vasopressin, desmopressin — abstracts describe PK/PD qualitatively
 * or only Emax/IC50, no verbatim kₑₒ.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'naloxone',       ec: { keo_per_h: 6.4,   source_pmid: 'PMID:17922561', note: 'Resp-depression reversal endpoint; abstract verbatim t½kₑₒ 6.5 min' } },
  { slug: 'buprenorphine',  ec: { keo_per_h: 0.552, source_pmid: 'PMID:17185999', note: 'Resp-depression isohypercapnic ventilation; abstract verbatim t½kₑₒ 75.3 min' } },
  { slug: 'methadone',      ec: { keo_per_h: 2.6,   source_pmid: 'PMID:15089813', note: 'Miosis endpoint, oral methadone, placebo arm; abstract verbatim "k(e0) … 2.6 ± 2.6 h⁻¹"' } },
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
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 6: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
