/**
 * _gtp-affinity.ts — pull human binding affinities from GtoPdb's bulk
 * interactions.csv (the REST endpoint truncates + ignores filters; the bulk
 * file is the reliable source). Prints a review table; authoring is a
 * separate, explicit step once values are eyeballed.
 *
 *   pnpm tsx scripts/authoring/_gtp-affinity.ts
 *
 * GtoPdb interactions.csv carries p-affinities (pKi/pKd/pIC50…) in
 * affinity_{low,median,high} and the raw nM in original_affinity_*_nm.
 * We surface both so the p→nM conversion can be sanity-checked.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL = 'https://www.guidetopharmacology.org/DATA/interactions.csv';
const CACHE = join(tmpdir(), 'gtp-interactions.csv');

// ligand name (lowercase, as GtoPdb lists it) → receptor genes we want to fill.
const WANT: Record<string, string[]> = {
  // Corticosteroids @ glucocorticoid receptor (NR3C1) / mineralocorticoid (NR3C2)
  hydrocortisone: ['NR3C1', 'NR3C2'],
  cortisol: ['NR3C1', 'NR3C2'],
  prednisolone: ['NR3C1'],
  methylprednisolone: ['NR3C1'],
  dexamethasone: ['NR3C1'],
  fludrocortisone: ['NR3C1', 'NR3C2'],
  budesonide: ['NR3C1'],
  fluticasone: ['NR3C1'],
  triamcinolone: ['NR3C1'],
  betamethasone: ['NR3C1'],
  mometasone: ['NR3C1'],
  beclomethasone: ['NR3C1'],
  // Sex-steroid receptor ligands
  tamoxifen: ['ESR1', 'ESR2'],
  fulvestrant: ['ESR1', 'ESR2'],
  'ethinyl-estradiol': ['ESR1', 'ESR2'],
  progesterone: ['PGR'],
  levonorgestrel: ['PGR'],
  mifepristone: ['PGR', 'NR3C1'],
  // Orexin antagonists
  suvorexant: ['HCRTR1', 'HCRTR2'],
  lemborexant: ['HCRTR1', 'HCRTR2'],
  daridorexant: ['HCRTR1', 'HCRTR2'],
  // M-antagonist inhalers + GI
  umeclidinium: ['CHRM3', 'CHRM2', 'CHRM1'],
  aclidinium: ['CHRM3', 'CHRM2', 'CHRM1'],
  dicyclomine: ['CHRM3', 'CHRM1'],
  // NMDA antagonist
  memantine: ['GRIN1', 'GRIN2B'],
  // VDR ligand
  calcitriol: ['VDR'],
  // Typical antipsychotic D2
  prochlorperazine: ['DRD2'],
};

function parseRow(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur); return out;
}

async function main(): Promise<void> {
  let raw: string;
  if (existsSync(CACHE)) {
    raw = readFileSync(CACHE, 'utf-8');
    console.log(`(cached ${(raw.length / 1e6).toFixed(1)} MB from ${CACHE})`);
  } else {
    console.log(`Fetching ${URL} …`);
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    raw = await res.text();
    mkdirSync(tmpdir(), { recursive: true });
    writeFileSync(CACHE, raw);
    console.log(`Fetched ${(raw.length / 1e6).toFixed(1)} MB → cached.`);
  }

  const lines = raw.split(/\r?\n/).filter(l => l.length && !l.startsWith('"#'));
  const header = parseRow(lines[0]!);
  const c = (n: string) => header.indexOf(n);
  const iGene = c('Target Gene Symbol'), iSpec = c('Target Species'), iLig = c('Ligand'),
        iType = c('Type'), iAction = c('Action'), iUnits = c('Affinity Units'),
        iLo = c('Affinity Low'), iMed = c('Affinity Median'), iHi = c('Affinity High'),
        iNm = c('Original Affinity Median nm'), iPmid = c('PubMed ID');
  if ([iGene, iSpec, iLig, iUnits, iMed].some(x => x < 0)) {
    console.error('Unexpected header:', header.join(' | ')); process.exit(1);
  }

  const wantLig = new Set(Object.keys(WANT));
  type Hit = { lig: string; gene: string; spec: string; type: string; action: string; units: string; lo: string; med: string; hi: string; nm: string; pmid: string };
  const hits: Hit[] = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseRow(lines[i]!);
    const lig = (f[iLig] ?? '').toLowerCase();
    if (!wantLig.has(lig)) continue;
    if ((f[iSpec] ?? '') !== 'Human') continue;
    const gene = f[iGene] ?? '';
    if (!WANT[lig]!.includes(gene)) continue;
    hits.push({
      lig, gene, spec: f[iSpec]!, type: f[iType] ?? '', action: f[iAction] ?? '',
      units: f[iUnits] ?? '', lo: f[iLo] ?? '', med: f[iMed] ?? '', hi: f[iHi] ?? '',
      nm: f[iNm] ?? '', pmid: f[iPmid] ?? '',
    });
  }

  hits.sort((a, b) => a.lig.localeCompare(b.lig) || a.gene.localeCompare(b.gene));
  console.log(`\n${hits.length} human rows for the requested ligand×gene pairs:\n`);
  let lastKey = '';
  for (const h of hits) {
    const key = `${h.lig} @ ${h.gene}`;
    if (key !== lastKey) { console.log(`\n── ${key} ──`); lastKey = key; }
    const pNum = parseFloat(h.med);
    const nmFromP = isFinite(pNum) ? (10 ** (9 - pNum)).toPrecision(3) : '?';
    console.log(`   ${h.units.padEnd(6)} med=${h.med.padEnd(5)} [${h.lo}–${h.hi}]  ≈${nmFromP} nM  origNm=${h.nm || '—'}  ${h.type}/${h.action}  PMID:${h.pmid || '—'}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
