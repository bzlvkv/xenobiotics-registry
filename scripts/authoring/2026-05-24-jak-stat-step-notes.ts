/**
 * 2026-05-24-jak-stat-step-notes.ts
 *
 * step.note (signaling tail) for jak_stat_signaling: 4 notes + add two
 * canonical mechanism reviews (existing ref is the clinical jakinib
 * review). PMIDs verified via esummary 2026-05-24:
 *   PMID:29999544 — Gadina et al. 2018 J Leukoc Biol (existing, clinical)
 *   PMID:25587654 — O'Shea et al. 2015 Annu Rev Med (added)
 *   PMID:28323260 — Villarino et al. 2017 Nat Immunol (added)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-jak-stat-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'jak_stat_signaling';
const ADD_REFS = ['PMID:25587654', 'PMID:28323260'];

const NOTES: Record<string, string> = {
  'cytokine-receptor-engagement jak-activation':
    'Type I/II cytokine receptors have no intrinsic kinase activity — they depend on associated JAKs (JAK1/2/3, ' +
    'TYK2), and ligand-induced dimerization juxtaposes two JAKs for trans-phosphorylation. JAK pairing is ' +
    'receptor-specific (e.g. JAK3 only with the common γ-chain), the basis of selective jakinibs and of the ' +
    'SCID caused by JAK3 loss.',
  'jak-activation stat-phosphorylation':
    'Active JAKs phosphorylate the receptor tail, creating SH2 docking sites that recruit STATs (STAT1-6), ' +
    'which JAK then phosphorylates. Which cytokine activates which STAT (IFN→STAT1, IL-6→STAT3, IL-4→STAT6) ' +
    'shapes the response — and the gain-of-function JAK2-V617F drives myeloproliferative neoplasms.',
  'stat-phosphorylation stat-dimer-nuclear':
    'Phosphorylated STATs dimerize via reciprocal SH2–phosphotyrosine bonds and translocate to the nucleus — ' +
    'a strikingly direct membrane-to-nucleus relay with no second-messenger cascade. SOCS proteins (themselves ' +
    'STAT target genes) provide the negative feedback by inhibiting JAKs.',
  'stat-dimer-nuclear transcription':
    'STAT dimers bind GAS or ISRE elements to drive cytokine, antiviral, and survival/proliferation genes. The ' +
    'pathway’s centrality to immunity is why jakinibs (tofacitinib, ruxolitinib, baricitinib) treat autoimmune ' +
    'disease and myelofibrosis — and why broad JAK inhibition raises infection and thrombosis risk.',
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
