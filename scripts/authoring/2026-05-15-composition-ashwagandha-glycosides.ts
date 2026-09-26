/**
 * 2026-05-15-composition-ashwagandha-glycosides.ts — extend ashwagandha
 * compositions to include known-but-unauthored glycowithanolides.
 *
 * Adds 2 new constituent compounds that ARE known ashwagandha bioactives
 * but have no published human PK (so they carry
 * `pk_unauthored: 'research-only'`):
 *
 *   • withanoside-iv   — major glycowithanolide; aglycone is withanolide-A.
 *                        Preclinical neurite-outgrowth + anxiolytic data.
 *   • sitoindoside-ix  — withanoside-class glycoside. Preclinical
 *                        immunomodulatory data only.
 *
 * Then extends the composition on all 4 ashwagandha parents to include
 * them. The PlasmaStrip composite folding detects these have no curve in
 * `output.plasma` and surfaces a "+N No PK" annotation on the parent row
 * + a "No PK" entry in the constituent drawer. Visible-to-user signal:
 * "we know about more constituents than we model."
 *
 * Composition ratios per gram of extract:
 *
 *   generic ashwagandha     — withanoside-IV 3 mg/g, sitoindoside-IX 1.5 mg/g
 *   ashwagandha-ksm66       — withanoside-IV 3 mg/g, sitoindoside-IX 1.5 mg/g
 *   ashwagandha-sensoril    — withanoside-IV 5 mg/g, sitoindoside-IX 2 mg/g
 *   ashwagandha-shoden      — withanoside-IV 80 mg/g, sitoindoside-IX 30 mg/g
 *                             (Shoden is glycoside-rich)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  composition?: {
    standardization?: string;
    constituents: Array<{ slug: string; mg_per_g_extract: number; note?: string }>;
  };
  [k: string]: unknown;
}

const NEW_CONSTITUENTS: Compound[] = [
  {
    slug: 'withanoside-iv',
    name: 'Withanoside IV',
    aliases: ['Withanoside-IV'],
    category: 'terpenoid',
    systems: ['nervous', 'endocrine'],
    mechanism:
      'Glycosylated withanolide — aglycone is withanolide-A linked to a sugar moiety. The dominant glycowithanolide in standardized "glycoside-rich" ashwagandha extracts (Shoden). Preclinical models show neurite-outgrowth and anxiolytic activity (likely after gut/hepatic hydrolysis to free withanolide-A). The clinical effect rationale of glycoside-standardized extracts is sustained downstream aglycone exposure.',
    routes: ['PO'],
    doses: { PO: { min: 1, max: 50, typical: 10, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'Glycoside; absorption requires gut/hepatic hydrolysis to free withanolide-A. No human plasma PK published as of 2026. Clinical effect likely mediated through downstream withanolide-A exposure.',
    },
    mw_g_mol: 782.96,
    refs: [],
    notes: 'Glycoside of withanolide-A; dominant glycowithanolide in Shoden-standardized extracts. PK not separately characterized in humans; effect likely transduced through aglycone after gut hydrolysis.',
  },

  {
    slug: 'sitoindoside-ix',
    name: 'Sitoindoside IX',
    aliases: ['Sitoindoside-IX'],
    category: 'terpenoid',
    systems: ['nervous', 'immune-hematologic'],
    mechanism:
      'Glycowithanolide of the sitoindoside class (IX + X are most-studied). Preclinical immunomodulatory + adaptogenic activity (anti-stress, anti-fatigue). Reported as a marker compound in multiple ashwagandha extract analyses. Like other glycowithanolides, requires gut/hepatic hydrolysis for systemic free-aglycone exposure.',
    routes: ['PO'],
    doses: { PO: { min: 1, max: 30, typical: 5, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'research-only',
      note: 'Marker withanolide-glycoside; no published human PK. Clinical effect likely mediated via downstream withanolide aglycone after gut hydrolysis.',
    },
    mw_g_mol: 784.97,
    refs: [],
    notes: 'Glycowithanolide; clinical effect likely transduced through aglycone exposure. Sitoindosides IX + X are the most-studied of this class.',
  },
];

const COMPOSITION_EXTENSIONS: Array<{ slug: string; add: Array<{ slug: string; mg_per_g_extract: number; note?: string }> }> = [
  {
    slug: 'ashwagandha',
    add: [
      { slug: 'withanoside-iv',  mg_per_g_extract: 3,   note: '~0.3% of generic root extract — typical glycowithanolide content' },
      { slug: 'sitoindoside-ix', mg_per_g_extract: 1.5, note: 'Minor glycowithanolide marker' },
    ],
  },
  {
    slug: 'ashwagandha-ksm66',
    add: [
      { slug: 'withanoside-iv',  mg_per_g_extract: 3,   note: 'Root-only; modest glycoside fraction' },
      { slug: 'sitoindoside-ix', mg_per_g_extract: 1.5, note: 'Minor in KSM-66' },
    ],
  },
  {
    slug: 'ashwagandha-sensoril',
    add: [
      { slug: 'withanoside-iv',  mg_per_g_extract: 5, note: 'Root + leaf — modest glycoside fraction' },
      { slug: 'sitoindoside-ix', mg_per_g_extract: 2, note: 'Moderate sitoindoside content' },
    ],
  },
  {
    slug: 'ashwagandha-shoden',
    add: [
      { slug: 'withanoside-iv',  mg_per_g_extract: 80, note: 'Dominant glycowithanolide — Shoden is specifically standardized for this fraction (≥35% glycowithanolides)' },
      { slug: 'sitoindoside-ix', mg_per_g_extract: 30, note: 'High sitoindoside content in glycoside-standardized extracts' },
    ],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let constAdded = 0;
  for (const c of NEW_CONSTITUENTS) {
    if (bySlug.has(c.slug)) {
      console.log(`SKIP constituent (already exists): ${c.slug}`);
      continue;
    }
    data.push(c);
    bySlug.set(c.slug, c);
    constAdded++;
    console.log(`ADD constituent: ${c.slug}`);
  }

  let extAdded = 0;
  for (const ext of COMPOSITION_EXTENSIONS) {
    const parent = bySlug.get(ext.slug);
    if (!parent?.composition) {
      console.warn(`  [warn] ${ext.slug} missing composition; skipping`);
      continue;
    }
    const existingSlugs = new Set(parent.composition.constituents.map(c => c.slug));
    for (const c of ext.add) {
      if (existingSlugs.has(c.slug)) {
        console.log(`  [skip] ${ext.slug} already lists ${c.slug}`);
        continue;
      }
      parent.composition.constituents.push(c);
      extAdded++;
      console.log(`  [add ] ${ext.slug.padEnd(25)} + ${c.slug} @ ${c.mg_per_g_extract} mg/g`);
    }
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nNo-PK constituents added: ${constAdded} | Composition entries extended: ${extAdded}`);
}

main();
