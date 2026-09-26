/**
 * 2026-05-24-mtor-step-notes.ts
 *
 * step.note batch 5 — first signaling-cluster pathway (mTOR). Per the
 * shift to specialized pathways, the claims were checked against the
 * pathway's existing refs before authoring: both are canonical Cell
 * reviews (verified via esummary 2026-05-24) that fully ground these
 * notes, so this stays notes-only (no new PMIDs):
 *   PMID:28283069 — Saxton & Sabatini 2017 Cell, "mTOR Signaling in
 *     Growth, Metabolism, and Disease"
 *   PMID:22500797 — Laplante & Sabatini 2012 Cell, "mTOR signaling in
 *     growth control and disease"
 *
 * Matched by from→to; idempotent. Run once:
 *   tsx scripts/authoring/2026-05-24-mtor-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'mtor_signaling';
const NOTES: Record<string, string> = {
  'igf-1 pi3k-activation':
    'Growth-factor receptors (IGF-1R, insulin-R, RTKs) recruit class I PI3K via IRS adaptors — the input ' +
    'node where growth and nutrient signals converge. PI3K is among the most frequently amplified/mutated ' +
    'oncogenic nodes, and PTEN (which reverses its product downstream) is a major tumor suppressor, making ' +
    'this axis central in cancer.',
  'pi3k-activation akt-activation':
    'PI3K generates PIP3, recruiting AKT and PDK1 to the membrane via their PH domains; PDK1 phosphorylates ' +
    'AKT at Thr308. Full activation additionally needs Ser473 from mTORC2 — so mTOR sits both upstream of AKT ' +
    '(as mTORC2) and downstream (as mTORC1), a feedback-rich topology.',
  'akt-activation mtorc1-activation':
    'AKT activates mTORC1 indirectly: it phosphorylates and inhibits the TSC1/2 complex (a GAP for Rheb), so ' +
    'relieved inhibition lets Rheb-GTP switch on mTORC1 at the lysosome. mTORC1 also demands amino-acid ' +
    'sufficiency signaled through the Rag GTPases — integrating growth factors with nutrient availability ' +
    'before committing to growth.',
  'mtorc1-activation protein-synthesis':
    'Active mTORC1 phosphorylates S6K1 and 4E-BP1 to drive cap-dependent translation and ribosome biogenesis ' +
    'while suppressing autophagy (via ULK1). Rapamycin, complexed with FKBP12, acutely inhibits the S6K1 arm; ' +
    'chronic dosing also disrupts mTORC2 (the glucose-intolerance side effect), and this growth-vs-autophagy ' +
    'switch underlies mTOR’s role in aging.',
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
