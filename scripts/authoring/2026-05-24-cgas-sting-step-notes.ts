/**
 * 2026-05-24-cgas-sting-step-notes.ts
 *
 * step.note (signaling tail) for cgas_sting_type1_ifn. Existing refs
 * verified via esummary 2026-05-24 — Zhang 2020 Immunity (mechanism/
 * structure review) + Deng 2014 ground these notes, so notes-only:
 *   PMID:32668227 — Zhang et al. 2020 Immunity
 *   PMID:25517616 — Deng et al. 2014 Immunity (radiation/antitumor)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-cgas-sting-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'cgas_sting_type1_ifn';
const NOTES: Record<string, string> = {
  'cytosolic dsDNA (viral / mtDNA / micronucleus / LINE-1) cGAS dsDNA-binding + activation':
    'cGAS detects cytosolic DNA regardless of sequence (binding the backbone of two strands), flagging any ' +
    'mislocalized DNA — viral, mitochondrial, micronuclei from genome instability, or LINE-1 retroelements. ' +
    'DNA-induced liquid-liquid phase separation concentrates the reaction; leakage of self-DNA drives ' +
    'interferonopathies (e.g. AGS) and aging-associated inflammation.',
  'cGAS active + ATP + GTP 2′3′-cGAMP (unique cyclic dinucleotide)':
    'Activated cGAS makes 2′3′-cGAMP, a cyclic dinucleotide whose mixed 2′-5′/3′-5′ linkage distinguishes it ' +
    'from bacterial 3′3′ CDNs. cGAMP is the second messenger; the ectoenzyme ENPP1 degrades it — an emerging ' +
    'cancer-immunotherapy target, since clearing cGAMP dampens antitumor immunity.',
  '2′3′-cGAMP STING (ER) oligomerization + activation':
    'cGAMP binds the STING C-terminal domain and triggers oligomerization. Strikingly, cGAMP can transfer ' +
    'between cells (gap junctions, viral particles, vesicles), letting a sensing cell alert neighbors — and ' +
    'STING gain-of-function mutations cause the autoinflammatory disease SAVI.',
  'STING active ER → ER-Golgi intermediate → Golgi translocation':
    'Activated STING traffics from ER through the ERGIC to the Golgi (COPII/ARF1-dependent) — a relocation ' +
    'required for downstream signaling and the step blocked by the covalent inhibitor H-151. STING is then ' +
    'degraded (lysosomal) after signaling, giving built-in shutoff.',
  'STING (Golgi) TBK1 recruitment + activation':
    'At the Golgi, STING’s C-terminal tail recruits the kinase TBK1, which trans-autophosphorylates. STING ' +
    'acts as a scaffold concentrating TBK1 — the convergence point shared with other innate-immune ' +
    'DNA/RNA-sensing adaptors (MAVS, TRIF) that also signal through TBK1.',
  'TBK1 IRF3 Ser396 phosphorylation':
    'TBK1 phosphorylates IRF3 (Ser396), driving dimerization and nuclear entry to transcribe type-I interferon ' +
    '(IFN-β) and interferon-stimulated genes — the antiviral/antitumor output that STING agonists aim to ' +
    'harness for cancer immunotherapy.',
  'STING active NF-κB activation (parallel branch)':
    'In parallel, STING activates NF-κB (via TRAF6/IKK) for pro-inflammatory cytokines — so the pathway yields ' +
    'both interferon and inflammatory outputs. The balance between the IRF3/IFN and NF-κB arms shapes whether ' +
    'cGAS-STING drives protective immunity or chronic inflammation/autoimmunity.',
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
