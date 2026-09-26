/**
 * 2026-05-24-mapk-erk-step-notes.ts
 *
 * step.note (signaling tail) for mapk_erk_cascade. Claims checked
 * against the pathway's existing refs first (verified via esummary
 * 2026-05-24) — both are canonical cancer reviews that fully ground
 * these notes, so notes-only, no new PMIDs:
 *   PMID:30794926 — Roskoski 2019 Pharmacol Res, "Targeting ERK1/2 ... in human cancers"
 *   PMID:33992782 — Ullah et al. 2022 Semin Cancer Biol, "RAF-MEK-ERK pathway in cancer ..."
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-mapk-erk-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'mapk_erk_cascade';
const NOTES: Record<string, string> = {
  'RTK ligand (EGF, FGF, PDGF, etc.) receptor dimerization + autophosphorylation':
    'Ligand-induced receptor dimerization creates phosphotyrosine docking sites that recruit GRB2-SOS, ' +
    'converting an extracellular growth signal into RAS activation. EGFR/HER2 amplification or activating ' +
    'mutations feed this step — the basis of anti-EGFR/HER2 therapy.',
  'RAS-GDP RAS-GTP':
    'SOS (a GEF) loads RAS with GTP; RAS-GAPs such as NF1 switch it off. Oncogenic mutations at G12/G13/Q61 ' +
    'cripple the GTPase, locking RAS on — KRAS is the most frequently mutated oncogene in human cancer, long ' +
    '“undruggable” until the recent KRAS-G12C covalent inhibitors (sotorasib).',
  'RAS-GTP RAF dimerization + activation':
    'Active RAS drives RAF (A/B/C-RAF) dimerization. BRAF-V600E activates RAF as a monomer (bypassing RAS), ' +
    'driving melanoma and thyroid cancer; paradoxically, first-generation RAF inhibitors can transactivate ' +
    'RAF dimers in RAS-mutant cells — the basis of paradoxical MAPK activation.',
  'RAF active MEK1/2 dual phosphorylation':
    'RAF phosphorylates MEK1/2, dual-specificity kinases with an unusually narrow substrate range ' +
    '(essentially only ERK1/2). That bottleneck makes MEK a clean drug target — MEK inhibitors (trametinib) ' +
    'are paired with BRAF inhibitors to delay resistance in melanoma.',
  'MEK1/2 active ERK1/2 TEY motif phosphorylation':
    'MEK dual-phosphorylates the ERK1/2 TEY motif. ERK is the cascade’s effector hub with ~200 substrates ' +
    'spanning cytoplasm and nucleus — the convergence point that amplifies and diversifies the signal, which ' +
    'is why ERK-pathway output is so pleiotropic.',
  'ERK1/2 active Elk-1 / c-Fos / c-Myc / RSK / MNK phosphorylation':
    'Nuclear ERK drives immediate-early transcription (Elk-1→c-Fos, c-Myc) toward cyclin D1 and proliferation, ' +
    'while the RSK/MNK branches boost cap-dependent translation (eIF4E). This proliferative gene program is ' +
    'the oncogenic payload of constitutive RAS-RAF-MEK-ERK signaling.',
  'ERK1/2 active negative feedback on RAF / MEK / SOS':
    'ERK phosphorylates upstream RAF, MEK, and SOS to dampen the cascade, normally giving transient, ' +
    'pulsatile activation. Oncogenic mutations override this feedback for sustained signaling — and relieving ' +
    'the feedback is itself a mechanism of adaptive resistance to RAF/MEK inhibitors.',
};

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
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

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`${SLUG}: added ${added} step notes`);
