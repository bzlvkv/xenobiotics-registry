/**
 * 2026-05-24-nfkb-step-notes.ts
 *
 * step.note (signaling tail) for nfkb_signaling. Existing refs verified
 * via esummary 2026-05-24 — both canonical NF-κB reviews that ground
 * these notes, so notes-only, no new PMIDs:
 *   PMID:18267068 — Hayden & Ghosh 2008 Cell, "Shared principles in NF-κB signaling"
 *   PMID:16175180 — Karin et al. 2005 Nat Rev Immunol, "NF-κB: linking inflammation ... to cancer"
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-nfkb-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'nfkb_signaling';
const NOTES: Record<string, string> = {
  'tnf-alpha ikk-activation':
    'This is the canonical pathway: TNF→TNFR1 assembles a TRADD/TRAF2/RIP1 complex that activates the IKK ' +
    'complex (IKKα/IKKβ/NEMO). A parallel non-canonical pathway (NIK→IKKα, from BAFF/lymphotoxin receptors) ' +
    'instead processes p100→p52 for lymphoid-organ development; RIP1 is also the switch toward ' +
    'apoptosis/necroptosis when NF-κB fails.',
  'ikk-activation ikb-degradation':
    'IKKβ phosphorylates IκB, marking it for β-TrCP ubiquitination and proteasomal degradation — the step that ' +
    'frees NF-κB. IKKβ is the target of high-dose salicylates and many anti-inflammatories, and proteasome ' +
    'inhibitors (bortezomib) act partly by blocking IκB degradation, keeping NF-κB off.',
  'ikb-degradation nfkb-nuclear':
    'With IκB destroyed, the unmasked nuclear localization signal lets the p65/p50 (RelA) heterodimer enter ' +
    'the nucleus. NF-κB drives its own inhibitor IκBα as a target gene — a negative-feedback loop that yields ' +
    'oscillatory, pulsatile activity rather than a sustained on-state.',
  'nfkb-nuclear inflammatory-cytokines':
    'NF-κB is the master transcriptional switch of inflammation/immunity, inducing TNF, IL-6, IL-1β, COX-2, ' +
    'iNOS, and anti-apoptotic genes — a feed-forward amplifier (TNF induces more NF-κB). Its pro-survival ' +
    'output also makes constitutive NF-κB a driver of inflammation-associated cancer and chemoresistance.',
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
