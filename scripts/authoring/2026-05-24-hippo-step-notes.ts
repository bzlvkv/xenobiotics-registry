/**
 * 2026-05-24-hippo-step-notes.ts
 *
 * step.note (signaling tail) for hippo_yap_taz_signaling: 6 notes + add
 * the canonical drug-targeting review to back the therapeutic claims
 * (existing ref is the Ma 2019 mechanism/pathophysiology review). PMIDs
 * verified via esummary 2026-05-24:
 *   PMID:30566373 — Ma et al. 2019 Annu Rev Biochem (existing, mechanism)
 *   PMID:32555376 — Dey et al. 2020 Nat Rev Drug Discov (added, therapeutics)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-hippo-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'hippo_yap_taz_signaling';
const ADD_REFS = ['PMID:32555376'];

const NOTES: Record<string, string> = {
  'contact / mechanical / GPCR inputs NF2 / AMOT / Crumbs signal integration':
    'The Hippo pathway is unusual in lacking a single dedicated ligand/receptor — it integrates diffuse cues. ' +
    'Cell-cell contact (via NF2/Merlin, the angiomotins, Crumbs/Scribble polarity complexes) and mechanical ' +
    'signals (stiff ECM, tension, F-actin state) converge on the core kinases, while LPA/S1P GPCRs can switch ' +
    'it off — making YAP/TAZ central sensors of tissue architecture and mechanotransduction.',
  'MST1/2 (STK4/3) active LATS1/2 + MOB1 activation (phosphorylation)':
    'The core kinase cassette: MST1/2 (the STK4/3 mammalian Hippo orthologs), scaffolded by SAV1, ' +
    'phosphorylate and activate LATS1/2 together with the MOB1 adaptor. This relay amplifies upstream ' +
    'growth-suppressive signals — loss of NF2 or the core kinases (as in mesothelioma and NF2-mutant tumors) ' +
    'leaves the brake off.',
  'LATS1/2 active YAP-Ser127 + TAZ-Ser89 phosphorylation':
    'Active LATS1/2 phosphorylate YAP (Ser127) and the paralog TAZ (Ser89). Phospho-YAP/TAZ are caught by ' +
    '14-3-3 proteins for cytoplasmic retention, and further phosphorylation flags them for β-TrCP–mediated ' +
    'proteasomal degradation — a two-step shutoff (sequester, then destroy) that keeps the coactivators out ' +
    'of the nucleus.',
  'YAP / TAZ cytoplasmic + degraded tissue growth restrained (Hippo ON)':
    'When the cascade is ON (high cell density, confluent epithelium), YAP/TAZ stay cytoplasmic and degraded, ' +
    'so their target genes are silent and proliferation is restrained — the molecular basis of contact ' +
    'inhibition and organ-size control. Genetic inactivation of Hippo causes massive tissue overgrowth, first ' +
    'shown in Drosophila.',
  'Hippo cascade OFF (low cell density, soft substrate) YAP / TAZ nuclear translocation':
    'At low cell density or on a soft/remodeling matrix the kinases are inactive, so unphosphorylated YAP/TAZ ' +
    'accumulate and enter the nucleus. Because the OFF (growth-driving) state powers regeneration after injury, ' +
    'its persistent activation — e.g. via mechanical stiffening — is a driver of fibrosis.',
  'YAP / TAZ + TEAD1–4 CTGF + CYR61 + ANKRD1 + MYC transcription':
    'In the nucleus YAP/TAZ have no DNA-binding domain — they partner with TEAD1-4 transcription factors to ' +
    'switch on proliferation/survival/stemness genes (CTGF, CYR61, ANKRD1, MYC). YAP/TAZ-TEAD activity is ' +
    'oncogenic across many cancers, making the interaction a drug target — verteporfin disrupts YAP-TEAD, and ' +
    'TEAD palmitoylation-pocket inhibitors are in trials.',
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
