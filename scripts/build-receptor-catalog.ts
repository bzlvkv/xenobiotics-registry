/**
 * build-receptor-catalog.ts — generate the GPCR receptor reference catalog.
 *
 *   pnpm tsx scripts/build-receptor-catalog.ts
 *
 * Fetches the IUPHAR/BPS Guide to PHARMACOLOGY "targets and families" table
 * (the canonical, curated receptor list), keeps the non-olfactory /
 * non-taste GPCRs, and writes packages/registry/data/receptors.json.
 *
 * This is a reference catalog — nomenclature facts (name / family / gene),
 * not pharmacodynamic measurements — so it carries no per-row PMID, the same
 * way the MW backfill carries none. Provenance is the GtoPdb version + each
 * row's GtoPdb target id, recorded in the file's `meta` block.
 *
 * Re-runnable: overwrites receptors.json with the current GtoPdb release.
 * Olfactory receptors aren't individually catalogued by GtoPdb; the only
 * sensory families present are Taste 1/2, which we drop (not drug targets).
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'packages', 'registry', 'data', 'receptors.json');
const GTP_URL = 'https://www.guidetopharmacology.org/DATA/targets_and_families.csv';

/** Minimal RFC-4180-ish CSV row parser (quoted fields, "" escapes). */
function parseRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&beta;/g, 'β')
    .replace(/&alpha;/g, 'α')
    .trim();

interface ReceptorRow {
  key: string;
  name: string;
  family: string;
  gene: string | null;
  full_name: string;
  gtp_id: number;
}

type TargetClass =
  | 'enzyme'
  | 'transporter'
  | 'ion_channel'
  | 'nuclear_receptor'
  | 'catalytic_receptor'
  | 'immune'
  | 'other';
interface NonGpcrTarget extends ReceptorRow {
  class: TargetClass;
}

// Authored non-GPCR occupancy key → [HGNC gene in the GtoPdb table, class].
// These genes ARE in targets_and_families.csv (just not Type 'gpcr'); we pull
// their nomenclature row by gene. The `key` stays the occupancy key so the
// receptor view resolves it directly.
const NONGPCR: Record<string, [string, TargetClass]> = {
  // enzymes
  cox_1: ['PTGS1', 'enzyme'],
  cox_2: ['PTGS2', 'enzyme'],
  dpp4: ['DPP4', 'enzyme'],
  pde3: ['PDE3A', 'enzyme'],
  pde4: ['PDE4B', 'enzyme'],
  pde5: ['PDE5A', 'enzyme'],
  hmgcr: ['HMGCR', 'enzyme'],
  aromatase: ['CYP19A1', 'enzyme'],
  carbonic_anhydrase: ['CA2', 'enzyme'],
  xanthine_oxidase: ['XDH', 'enzyme'],
  jak1: ['JAK1', 'enzyme'],
  bcr_abl: ['ABL1', 'enzyme'],
  factor_xa: ['F10', 'enzyme'],
  thrombin: ['F2', 'enzyme'],
  srd5a2: ['SRD5A2', 'enzyme'],
  egfr: ['EGFR', 'catalytic_receptor'],
  // transporters
  na_k_atpase: ['ATP1A1', 'transporter'],
  SERT: ['SLC6A4', 'transporter'],
  dat: ['SLC6A3', 'transporter'],
  net: ['SLC6A2', 'transporter'],
  gat1: ['SLC6A1', 'transporter'],
  sglt2: ['SLC5A2', 'transporter'],
  // ion channels
  nav: ['SCN2A', 'ion_channel'],
  nav1_5: ['SCN5A', 'ion_channel'],
  cav1_2: ['CACNA1C', 'ion_channel'],
  herg: ['KCNH2', 'ion_channel'],
  nmda: ['GRIN1', 'ion_channel'],
  gaba_a: ['GABRA1', 'ion_channel'],
  gaba_a_bzd: ['GABRA1', 'ion_channel'],
  '5ht3': ['HTR3A', 'ion_channel'],
  glycine_receptor: ['GLRA1', 'ion_channel'],
  glycine_receptor_alpha1: ['GLRA1', 'ion_channel'],
  nachr_a4b2: ['CHRNA4', 'ion_channel'],
  nachr_muscle: ['CHRNA1', 'ion_channel'],
  // nuclear receptors
  androgen_receptor: ['AR', 'nuclear_receptor'],
  estrogen_receptor: ['ESR1', 'nuclear_receptor'],
  glucocorticoid: ['NR3C1', 'nuclear_receptor'],
  mineralocorticoid: ['NR3C2', 'nuclear_receptor'],
  ppar_alpha: ['PPARA', 'nuclear_receptor'],
  progesterone_receptor: ['PGR', 'nuclear_receptor'],
  // immune checkpoint
  pd_1: ['PDCD1', 'immune'],
};

// Targets GtoPdb doesn't enumerate as target rows (cytokine ligands, the Ca-
// channel α2δ subunit, IgE). Hand-curated nomenclature; gtp_id 0 (no GtoPdb
// link). Provenance is the gene/HGNC name, stable facts.
const CURATED: NonGpcrTarget[] = [
  {
    key: 'cav_alpha2delta',
    name: 'Cavα2δ-1 subunit',
    family: 'Voltage-gated calcium channels (Cav)',
    gene: 'CACNA2D1',
    full_name: 'calcium voltage-gated channel auxiliary subunit alpha2delta 1',
    class: 'ion_channel',
    gtp_id: 0,
  },
  {
    key: 'tnf_alpha',
    name: 'TNF-α',
    family: 'Tumour necrosis factor family',
    gene: 'TNF',
    full_name: 'tumor necrosis factor',
    class: 'immune',
    gtp_id: 0,
  },
  {
    key: 'il12_23_p40',
    name: 'IL-12/23 p40',
    family: 'Interleukins',
    gene: 'IL12B',
    full_name: 'interleukin 12B (p40, shared IL-12/IL-23 subunit)',
    class: 'immune',
    gtp_id: 0,
  },
  {
    key: 'il17a',
    name: 'IL-17A',
    family: 'Interleukins',
    gene: 'IL17A',
    full_name: 'interleukin 17A',
    class: 'immune',
    gtp_id: 0,
  },
  {
    key: 'il23_p19',
    name: 'IL-23 p19',
    family: 'Interleukins',
    gene: 'IL23A',
    full_name: 'interleukin 23 subunit alpha (p19)',
    class: 'immune',
    gtp_id: 0,
  },
  {
    key: 'ige',
    name: 'IgE',
    family: 'Immunoglobulins',
    gene: 'IGHE',
    full_name: 'immunoglobulin heavy constant epsilon (free IgE)',
    class: 'immune',
    gtp_id: 0,
  },
];

async function main(): Promise<void> {
  console.log(`Fetching ${GTP_URL} …`);
  const res = await fetch(GTP_URL);
  if (!res.ok) throw new Error(`GtoPdb fetch failed: HTTP ${res.status}`);
  const raw = await res.text();

  const allLines = raw.split(/\r?\n/);
  const versionLine = allLines.find((l) => l.includes('GtoPdb Version'));
  const version = versionLine?.match(/Version:\s*([\d.]+)/)?.[1] ?? 'unknown';

  const lines = allLines.filter((l) => l.length && !l.startsWith('"# '));
  const header = parseRow(lines[0]!);
  const col = (n: string) => header.indexOf(n);
  const iType = col('Type'),
    iFam = col('Family name'),
    iTid = col('Target id'),
    iName = col('Target name'),
    iGene = col('HGNC symbol'),
    iHname = col('HGNC name');

  const wantGene = new Set(Object.values(NONGPCR).map(([g]) => g));
  const geneRow = new Map<
    string,
    { name: string; family: string; full_name: string; gtp_id: number }
  >();

  const seen = new Set<string>();
  const rows: ReceptorRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseRow(lines[i]!);
    const family = f[iFam] ?? '';
    const tid = f[iTid]!;
    const gene = (f[iGene] ?? '').trim() || null;
    if (f[iType] === 'gpcr') {
      if (/taste/i.test(family)) continue; // sensory, not a drug target
      if (seen.has(tid)) continue;
      seen.add(tid);
      rows.push({
        // Canonical key: HGNC gene symbol when known (stable, unique), else
        // the GtoPdb id. The occupancy→catalog bridge in the view keys on this.
        key: gene ?? `gtp${tid}`,
        name: stripHtml(f[iName] ?? ''),
        family: stripHtml(family),
        gene,
        full_name: (f[iHname] ?? '').trim(),
        gtp_id: Number(tid),
      });
    } else if (gene && wantGene.has(gene) && !geneRow.has(gene)) {
      // A non-GPCR target the registry binds — keep its nomenclature row.
      geneRow.set(gene, {
        name: stripHtml(f[iName] ?? ''),
        family: stripHtml(family),
        full_name: (f[iHname] ?? '').trim(),
        gtp_id: Number(tid),
      });
    }
  }

  rows.sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));

  // Assemble the non-GPCR target catalog (keyed by occupancy key).
  const nonGpcrTargets: NonGpcrTarget[] = [];
  for (const [key, [gene, cls]] of Object.entries(NONGPCR)) {
    const r = geneRow.get(gene);
    if (!r) {
      console.warn(`  [warn] non-GPCR gene ${gene} (${key}) not in GtoPdb table — skipped`);
      continue;
    }
    nonGpcrTargets.push({
      key,
      name: r.name,
      family: r.family,
      gene,
      full_name: r.full_name,
      class: cls,
      gtp_id: r.gtp_id,
    });
  }
  nonGpcrTargets.push(...CURATED);
  const clsOrder: TargetClass[] = [
    'enzyme',
    'transporter',
    'ion_channel',
    'nuclear_receptor',
    'catalytic_receptor',
    'immune',
    'other',
  ];
  nonGpcrTargets.sort(
    (a, b) => clsOrder.indexOf(a.class) - clsOrder.indexOf(b.class) || a.key.localeCompare(b.key),
  );

  const doc = {
    meta: {
      source: 'IUPHAR/BPS Guide to PHARMACOLOGY',
      url: 'https://www.guidetopharmacology.org/',
      version,
      fetched: new Date().toISOString().slice(0, 10),
      note: 'receptors = non-olfactory/non-taste GPCRs. nonGpcrTargets = the non-GPCR targets (enzymes/transporters/ion channels/nuclear receptors/immune) the registry binds, by occupancy key. Nomenclature reference (name/family/gene); no per-row PMID by design.',
    },
    receptors: rows,
    nonGpcrTargets,
  };

  writeFileSync(OUT_PATH, JSON.stringify(doc, null, 2) + '\n');
  console.log(
    `Wrote ${rows.length} GPCRs across ${new Set(rows.map((r) => r.family)).size} families + ${nonGpcrTargets.length} non-GPCR targets → ${OUT_PATH} (GtoPdb ${version}).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
