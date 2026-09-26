/**
 * 2026-05-23-adrenergic-step-pins.ts
 *
 * Pilot of the PathwayModulator.step authoring escape-hatch (added the
 * same day) on adrenergic_receptor_signaling. The pathway's 3 steps:
 *   [0] norepinephrine → adrenergic-receptor-activation   (THE receptor)
 *   [1] adrenergic-receptor-activation → norepinephrine    (NET reuptake)
 *   [2] norepinephrine → metanephrine                      (COMT / MAO)
 *
 * All 30 receptor-subtype modulators (β1/β2/α1/α2 agonists + blockers)
 * act on the receptor — step 0 — but their `target` text ("β1 + β2",
 * "α1", "β2 (LABA)" …) shares no token with step 0's via ("cross-link:
 * catecholamine_synthesis…"), so the automatic matcher left them
 * unmatched (≈1/31 matched). Pin them to step 0.
 *
 * Deliberately NOT pinned:
 *   • atomoxetine ("NET (norepinephrine transporter)") — acts on the
 *     transporter (step 1) and already text-matches step 1 via "NET
 *     reuptake". Pins are only for what the matcher cannot reach.
 *
 * No citations touched — this is a structural step↔modulator mapping,
 * not a literature claim. Idempotent. Run once:
 *   tsx scripts/authoring/2026-05-23-adrenergic-step-pins.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Modulator { slug: string; target?: string; step?: number; [k: string]: unknown }
interface Pathway { slug: string; steps: unknown[]; modulators?: Modulator[]; [k: string]: unknown }

const SLUG = 'adrenergic_receptor_signaling';
const RECEPTOR_STEP = 0;
const SKIP = new Set(['atomoxetine']); // NET transporter → step 1 (text-matched already)

const data: Pathway[] = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));
const pw = data.find(p => p.slug === SLUG);
if (!pw) throw new Error(`pathway ${SLUG} not found`);

let pinned = 0;
for (const m of pw.modulators ?? []) {
  if (SKIP.has(m.slug)) continue;
  if (m.step === RECEPTOR_STEP) continue; // idempotent
  m.step = RECEPTOR_STEP;
  pinned++;
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`${SLUG}: pinned ${pinned} modulators to step ${RECEPTOR_STEP} (skipped ${[...SKIP].join(', ')})`);
