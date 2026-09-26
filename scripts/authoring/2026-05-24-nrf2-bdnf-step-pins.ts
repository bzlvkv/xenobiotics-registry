/**
 * 2026-05-24-nrf2-bdnf-step-pins.ts
 *
 * Conservative step-pins for two non-receptor signaling pathways —
 * ONLY the modulators whose own target text supports the step. The
 * broader "unmatched modulator" tail on these pathways is left
 * pathway-level on purpose (varied-mechanism / weak cross-lists that
 * shouldn't be force-attributed to one step).
 *
 *  nrf2_keap1_antioxidant_response — step 0 (stress → keap1-cysteine-
 *    modification = the Nrf2-activation trigger; the 27 already-matched
 *    activators sit here too). Pinned: only the unmatched activators
 *    whose target explicitly names Nrf2. NOT pinned: geraniol, pinenes,
 *    sesamin, isoflavones, silibinin, linalool, myrcene, icariin —
 *    their target text describes non-Nrf2 primary actions.
 *
 *  bdnf_trkb_neurotrophic — step 0 (BDNF gene → proBDNF; i.e. BDNF
 *    expression). Pinned: the SSRIs/SNRIs + nootropics all tagged
 *    "BDNF/TrkB (chronic)" — they upregulate BDNF expression.
 *
 * No citations touched. Idempotent; validates slug/step before write.
 *   tsx scripts/authoring/2026-05-24-nrf2-bdnf-step-pins.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Modulator { slug: string; step?: number; [k: string]: unknown }
interface Pathway { slug: string; steps: unknown[]; modulators?: Modulator[]; [k: string]: unknown }

const PINS: Record<string, Record<number, string[]>> = {
  nrf2_keap1_antioxidant_response: {
    0: ['resveratrol', 'urolithin-a', 'urolithin-b', 'fisetin', 'chlorogenic-acid', 'oleocanthal', 'cinnamaldehyde'],
  },
  bdnf_trkb_neurotrophic: {
    0: ['fluoxetine', 'sertraline', 'paroxetine', 'citalopram', 'escitalopram', 'venlafaxine',
        'duloxetine', 'vortioxetine', 'lions-mane', 'cerebrolysin', 'semax', 'noopept'],
  },
};

const data: Pathway[] = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));
let total = 0;
for (const [pwSlug, stepMap] of Object.entries(PINS)) {
  const pw = data.find(p => p.slug === pwSlug);
  if (!pw) throw new Error(`pathway "${pwSlug}" not found`);
  const slugToStep = new Map<string, number>();
  for (const [stepStr, slugs] of Object.entries(stepMap)) {
    const step = Number(stepStr);
    if (!Number.isInteger(step) || step < 0 || step >= pw.steps.length) {
      throw new Error(`${pwSlug}: step ${step} out of range (0..${pw.steps.length - 1})`);
    }
    for (const s of slugs) slugToStep.set(s, step);
  }
  const found = new Set<string>();
  let pinned = 0;
  for (const m of pw.modulators ?? []) {
    const step = slugToStep.get(m.slug);
    if (step === undefined) continue;
    found.add(m.slug);
    if (m.step !== step) { m.step = step; pinned++; }
  }
  const missing = [...slugToStep.keys()].filter(s => !found.has(s));
  if (missing.length) throw new Error(`${pwSlug}: listed slug(s) not in modulators: ${missing.join(', ')}`);
  total += pinned;
  console.log(`${pwSlug}: pinned ${pinned}/${slugToStep.size}`);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`done — ${total} pins written`);
