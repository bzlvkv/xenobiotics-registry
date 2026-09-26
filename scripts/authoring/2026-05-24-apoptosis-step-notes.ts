/**
 * 2026-05-24-apoptosis-step-notes.ts
 *
 * step.note (signaling tail) for apoptosis_bcl2_axis. Existing refs
 * verified via esummary 2026-05-24 — the Czabotar 2014 NRMCB review +
 * the venetoclax papers fully ground these notes, so notes-only:
 *   PMID:24355989 — Czabotar et al. 2014 Nat Rev Mol Cell Biol
 *   PMID:23291630 — Souers et al. 2013 Nat Med (ABT-199/venetoclax)
 *   PMID:27178240 — Stilgenbauer et al. 2016 Lancet Oncol (venetoclax CLL)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-apoptosis-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'apoptosis_bcl2_axis';
const NOTES: Record<string, string> = {
  'death-signal-intrinsic bax-bak-activation':
    'The intrinsic pathway is set by the BCL-2 family balance: BH3-only proteins (BIM, BID, PUMA, NOXA — ' +
    'induced by p53, DNA damage, or growth-factor withdrawal) either directly activate the effectors BAX/BAK ' +
    'or neutralize the anti-apoptotic guardians (BCL-2, BCL-XL, MCL-1). The pro- to anti-apoptotic ratio sets ' +
    'the death threshold (“priming”).',
  'bax-bak-activation cytochrome-c-release':
    'Activated BAX/BAK oligomerize to permeabilize the mitochondrial outer membrane (MOMP) — the commitment ' +
    'point of intrinsic apoptosis. Anti-apoptotic BCL-2/BCL-XL/MCL-1 block it by sequestering BAX/BAK and ' +
    'activator BH3-only proteins; BH3-mimetics (venetoclax/ABT-199 for BCL-2) free them, the basis of CLL/AML ' +
    'therapy.',
  'cytochrome-c-release apoptosome':
    'Released cytochrome c binds Apaf-1, driving oligomerization with procaspase-9 into the wheel-shaped ' +
    'apoptosome — coupling mitochondrial damage to caspase activation. IAPs (e.g. XIAP) restrain it, while ' +
    'mitochondrial SMAC/DIABLO neutralizes IAPs — the target of SMAC-mimetic drugs.',
  'apoptosome executioner-caspase-activation':
    'The apoptosome activates initiator caspase-9, which cleaves executioner caspases-3/7 to dismantle the ' +
    'cell (DNA fragmentation, PARP/cytoskeletal cleavage, phosphatidylserine exposure for phagocytic ' +
    'clearance). The extrinsic (death-receptor/caspase-8) pathway converges here and can amplify via ' +
    'BID→mitochondria.',
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
