/**
 * 2026-05-24-monoamine-step-notes.ts
 *
 * step.note batch 2 (neuro cluster) — monoamine synthesis pathways,
 * continuing the GABA-A sample. Notes describe established (textbook)
 * biochemistry and complement each step's `via`; grounded by the
 * pathways' existing refs[], NO new PMIDs. Matched by from→to;
 * idempotent (skips steps that already carry a note, e.g. the PNMT
 * step in catecholamine_synthesis). Run once:
 *   tsx scripts/authoring/2026-05-24-monoamine-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  catecholamine_synthesis: {
    'l-tyrosine levodopa':
      'Tyrosine hydroxylase is the rate-limiting, committed step for all catecholamines — feedback-inhibited ' +
      'by cytosolic catecholamines and acutely activated by phosphorylation (PKA/CaMKII). Its BH4 ' +
      '(tetrahydrobiopterin) cofactor is shared with tryptophan and phenylalanine hydroxylases, coupling ' +
      'dopamine, serotonin, and phenylalanine handling.',
    'levodopa dopamine':
      'AADC (DOPA decarboxylase) is fast and non-rate-limiting, and is the same enzyme that converts 5-HTP ' +
      'to serotonin. Since peripheral AADC would convert L-DOPA to dopamine before it crosses the blood–brain ' +
      'barrier, Parkinson’s therapy pairs L-DOPA with a peripheral AADC inhibitor (carbidopa or benserazide).',
    'dopamine norepinephrine':
      'Dopamine β-hydroxylase acts inside synaptic vesicles, is copper-dependent, and consumes ascorbate ' +
      '(vitamin C) as the electron donor. It is expressed only in noradrenergic and adrenergic cells, so ' +
      'dopaminergic neurons that lack DBH stop at dopamine.',
  },
  serotonin_melatonin_axis: {
    'tryptophan 5-htp':
      'Tryptophan hydroxylase is rate-limiting for serotonin: TPH1 (peripheral — gut enterochromaffin cells ' +
      'make ~90% of body serotonin) and TPH2 (central neurons). It shares the BH4 cofactor with tyrosine ' +
      'hydroxylase, and CNS synthesis is substrate-limited by tryptophan transport across the blood–brain ' +
      'barrier, where it competes with other large neutral amino acids.',
    '5-htp serotonin':
      'The same AADC enzyme decarboxylates 5-HTP (→ serotonin) and L-DOPA (→ dopamine). Supplemental 5-HTP ' +
      'bypasses the rate-limiting TPH step and crosses the blood–brain barrier without transporter competition ' +
      '— its supplementation rationale — though peripheral AADC also converts it to serotonin outside the CNS.',
    'serotonin melatonin':
      'Melatonin synthesis takes two steps: AANAT acetylates serotonin to N-acetylserotonin, then ASMT (HIOMT) ' +
      'O-methylates it using SAMe. AANAT is the rate-limiting, circadian-gated step — driven high at night by ' +
      'the SCN and acutely suppressed by light — so melatonin output tracks the dark phase.',
  },
};

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let added = 0;
for (const [slug, stepNotes] of Object.entries(NOTES)) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = stepNotes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(stepNotes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`added ${added} step notes across ${Object.keys(NOTES).length} pathways`);
