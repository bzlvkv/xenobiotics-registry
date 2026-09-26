/**
 * 2026-05-24-wnt-step-notes.ts
 *
 * step.note (signaling tail) for wnt_beta_catenin: 7 notes + add the
 * canonical mechanistic review (existing ref is the therapeutic-focused
 * Nusse & Clevers 2017). PMIDs verified via esummary 2026-05-24:
 *   PMID:28575679 — Nusse & Clevers 2017 Cell (existing)
 *   PMID:19619488 — MacDonald, Tamai & He 2009 Dev Cell,
 *     "Wnt/β-catenin signaling: components, mechanisms, and diseases" (added)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-wnt-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'wnt_beta_catenin';
const ADD_REFS = ['PMID:19619488'];

const NOTES: Record<string, string> = {
  'no Wnt — β-catenin destruction complex (APC + Axin + GSK-3β + CK1α)':
    'In the OFF state the destruction complex (APC, Axin, GSK-3β, CK1α) constitutively captures β-catenin: ' +
    'CK1α primes Ser45, then GSK-3β phosphorylates S33/S37/T41 for β-TrCP ubiquitination. APC mutations ' +
    '(in nearly all colorectal cancers) break this brake, driving constitutive Wnt signaling.',
  'ubiquitinated β-catenin proteasomal degradation':
    'Continuous degradation keeps cytoplasmic β-catenin’s half-life to minutes, holding the pathway off. ' +
    'β-catenin also has a separate, Wnt-independent structural role at adherens junctions (binding ' +
    'E-cadherin) — only the free cytoplasmic pool is signaling-competent.',
  'Wnt ligand binding Frizzled + LRP5/6 co-receptor signalosome':
    'Wnt ligands must be palmitoylated by porcupine (PORCN) and secreted via Wntless to bind the ' +
    'Frizzled/LRP5/6 co-receptor pair — so PORCN inhibitors are a therapeutic strategy. LRP5 gain/loss-of-' +
    'function mutations cause high-bone-mass and osteoporosis-pseudoglioma, underscoring Wnt’s role in bone.',
  'Frizzled-LRP5/6 Dishevelled (Dvl) recruitment → destruction complex disassembly':
    'Receptor engagement recruits Dishevelled and sequesters Axin to the membrane, where CK1α/GSK-3β now ' +
    'phosphorylate LRP5/6’s PPPSPxS motifs instead of β-catenin — disabling the destruction complex. This ' +
    'switch of GSK-3β’s target is the core ON mechanism.',
  'destruction complex off β-catenin stabilization + nuclear translocation':
    'With the complex disabled, β-catenin escapes degradation (half-life rises from minutes to hours), ' +
    'accumulates, and enters the nucleus. The amount of stabilized β-catenin sets the strength of the ' +
    'transcriptional response.',
  'nuclear β-catenin TCF/LEF — Groucho/TLE displacement':
    'β-catenin converts TCF/LEF from repressors to activators by displacing Groucho/TLE corepressors and ' +
    'recruiting BCL9, Pygopus, and the p300/CBP histone acetyltransferases — the molecular switch turning a ' +
    'silenced enhancer into an active one.',
  'β-catenin-TCF complex Axin2 + c-Myc + cyclin D1 + LGR5 transcription':
    'Target genes include proliferation drivers (c-Myc, cyclin D1), the stem-cell marker LGR5 (intestinal and ' +
    'cancer stem cells), and Axin2 — a negative-feedback target that rebuilds the destruction complex to limit ' +
    'the response, an off-switch that APC-loss tumors override.',
};

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }>; refs?: string[] }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));
const pw = data.find(p => p.slug === SLUG);
if (!pw) throw new Error(`pathway "${SLUG}" not found`);

const used = new Set<string>();
let added = 0;
for (const step of pw.steps) {
  const key = `${step.from} ${step.to}`;
  const note = NOTES[key];
  if (note === undefined) continue;
  used.add(key);
  if (step.note) continue;
  if (note.length > 500) throw new Error(`"${key}": note ${note.length} > 500 chars`);
  step.note = note;
  added++;
}
const missing = Object.keys(NOTES).filter(k => !used.has(k));
if (missing.length) throw new Error(`note key(s) matched no step: ${missing.join(' | ')}`);

pw.refs = pw.refs ?? [];
let refsAdded = 0;
for (const r of ADD_REFS) if (!pw.refs.includes(r)) { pw.refs.push(r); refsAdded++; }

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`${SLUG}: added ${added} notes, ${refsAdded} refs (now ${pw.refs.length} refs)`);
