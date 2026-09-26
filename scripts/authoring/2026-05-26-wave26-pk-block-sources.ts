/**
 * 2026-05-26-wave26-pk-block-sources.ts — attach source_pmid to pk blocks that
 * had none, using a primary PK paper VERIFIED to report the block's disposition
 * params (Vd and/or F), not merely the half-life.
 *
 * Of the 31 source-less pk blocks, only these 9 have a primary paper confirmed
 * to report Vd/F consistent with the stored values (several EXACT — strong
 * evidence they are the original source). The remaining 22 were left unsourced
 * on purpose: their candidate (wave-23) PMIDs report only the half-life, not
 * Vd/F, so attaching them would misattribute the disposition params. Each value
 * below was re-fetched/confirmed 2026-05-26.
 *
 * slug → source_pmid (what it reports vs stored):
 *  telithromycin  16122280  Shi 2005      F 57% (=stored 0.57), Vd 2.9 L/kg
 *  acalabrutinib  30442651  Podoll 2019   F 25.3% (=stored 0.25)
 *  ruxolitinib    37000342  Appeldoorn23  F 95% (=stored 0.95)
 *  sulfasalazine  2864155   Klotz 1985    F 3–12% (stored 0.15, same OoM)
 *  nadolol        3366166   Morrison 1988 Vss 147–157 L (stored 135)
 *  upadacitinib   30945116  Klünder 2019  Vss 294 L (=stored 294), relBA 76%
 *  rosiglitazone  10859151  Cox 2000      F ~99% (=stored 0.99)
 *  cerivastatin   10976657  Mück 2000     F 60% (=stored 0.6), Vss 0.3 L/kg≈21 L (=stored 21)
 *  minocycline    33168615  Lodise 2021   Vss 146 L (stored 100; IV study → sources Vd, not the oral F)
 *
 * LEFT UNSOURCED (half-life-only papers / mismatch / no source): atazanavir,
 *  lopinavir, tolbutamide, daclatasvir, elbasvir, grazoprevir, elvitegravir,
 *  venetoclax, everolimus, temsirolimus, rasagiline (wave-23 PMIDs are t½-only);
 *  darunavir & tranexamic-acid (F mismatch: papers say 0.37/0.82 and 0.34 vs
 *  stored 1.0/0.45); ibrutinib (Vss 10000 L / F mismatch); clozapine,
 *  dextromethorphan, cobicistat, dicyclomine, tacrine, butalbital, setmelanotide,
 *  phenelzine (no clean primary abstract with numeric Vd/F — label/PDF-gated).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound { slug: string; pk?: Record<string, { source_pmid?: string; [k: string]: unknown }>; refs?: string[]; [k: string]: unknown; }

// slug → [route, source_pmid]
const SRC: Record<string, [string, string]> = {
  telithromycin: ['PO', 'PMID:16122280'], acalabrutinib: ['PO', 'PMID:30442651'],
  ruxolitinib: ['PO', 'PMID:37000342'], sulfasalazine: ['PO', 'PMID:2864155'],
  nadolol: ['PO', 'PMID:3366166'], upadacitinib: ['PO', 'PMID:30945116'],
  rosiglitazone: ['PO', 'PMID:10859151'], cerivastatin: ['PO', 'PMID:10976657'],
  minocycline: ['PO', 'PMID:33168615'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let set = 0, refAdd = 0;
  for (const [slug, [route, pmid]] of Object.entries(SRC)) {
    const c = bySlug.get(slug);
    if (!c?.pk?.[route]) { console.log(`  [MISS] ${slug} no pk.${route}`); continue; }
    if (c.pk[route].source_pmid) { console.log(`  [skip] ${slug} pk.${route} already sourced`); continue; }
    c.pk[route].source_pmid = pmid;
    c.refs = c.refs ?? [];
    let r = '';
    if (!c.refs.includes(pmid)) { c.refs.push(pmid); refAdd++; r = ` +ref`; }
    console.log(`  [add ] ${slug.padEnd(16)} pk.${route}.source_pmid = ${pmid}${r}`);
    set++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 26: +${set} pk source_pmid (${refAdd} new refs).`);
}

main();
