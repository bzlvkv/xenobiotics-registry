/**
 * 2026-05-24-pi3k-akt-step-notes.ts
 *
 * First citation-coupled step.note batch (signaling tail). Authors the
 * 8 steps of pi3k_akt_signaling AND adds two canonical reviews to
 * refs[] (it previously carried only Manning 2007). All PMIDs verified
 * via NCBI esummary 2026-05-24:
 *   PMID:17604717 — Manning & Cantley 2007 Cell, "AKT/PKB signaling:
 *     navigating downstream" (already present)
 *   PMID:28431241 — Manning & Toker 2017 Cell, "AKT/PKB Signaling:
 *     Navigating the Network" (added)
 *   PMID:28802037 — Fruman et al. 2017 Cell, "The PI3K Pathway in
 *     Human Disease" (added)
 *
 * Notes complement each `via`; exact from→to keys (mismatch throws);
 * idempotent. Run once:
 *   tsx scripts/authoring/2026-05-24-pi3k-akt-step-notes.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'pi3k_akt_signaling';
const ADD_REFS = ['PMID:28431241', 'PMID:28802037'];

const NOTES: Record<string, string> = {
  'insulin / IGF-1 / RTK-ligand IRS-1/2 phosphorylation or SH2 of p85':
    'Receptor tyrosine kinases recruit class IA PI3K either directly (p85 SH2 domains binding ' +
    'phosphotyrosines) or via IRS-1/2 adaptors (the insulin/IGF route). This is the most frequently activated ' +
    'oncogenic node in cancer — PIK3CA (p110α) is among the commonest mutated oncogenes.',
  'PI3K active PIP2 → PIP3 at plasma membrane':
    'PI3K phosphorylates PIP2 to the lipid second messenger PIP3 at the membrane; PTEN is the phosphatase ' +
    'that reverses this and is one of the most commonly lost tumor suppressors. PIP3 is the on-switch — its ' +
    'level, set by the PI3K/PTEN balance, gates everything downstream.',
  'PIP3 AKT + PDK1 PH-domain recruitment':
    'PIP3 recruits AKT and PDK1 to the membrane via their PH domains, and PDK1 phosphorylates AKT at Thr308. ' +
    'Membrane co-localization is the key activation event, which is why PTEN loss (sustained PIP3) drives ' +
    'constitutive AKT signaling.',
  'AKT-Thr308 + mTORC2 AKT-Ser473 (fully active AKT)':
    'Full AKT activation needs a second phosphorylation at Ser473 by mTORC2 (the rapamycin-insensitive, ' +
    'RICTOR-containing complex) — distinct from mTORC1. So mTOR sits both upstream of AKT (as mTORC2) and ' +
    'downstream (as mTORC1), creating feedback loops that complicate PI3K-pathway drug responses.',
  'AKT active TSC2 phosphorylation':
    'AKT phosphorylates and inhibits TSC2, releasing Rheb to switch on mTORC1 → protein synthesis and ' +
    'lipogenesis. mTORC1 then feeds back to suppress IRS-1, so rapalogs can paradoxically relieve this brake ' +
    'and re-activate upstream AKT — an important resistance mechanism.',
  'AKT active GSK-3β phosphorylation → inhibition':
    'AKT phosphorylates and inhibits GSK-3β, which both activates glycogen synthase (insulin’s ' +
    'glycogen-storage effect) and stabilizes β-catenin and other GSK-3 substrates — a node where the ' +
    'insulin/growth-factor and Wnt pathways intersect.',
  'AKT active FoxO1/3/4 phosphorylation → cytoplasmic sequestration':
    'AKT phosphorylates FoxO transcription factors, sequestering them in the cytoplasm (14-3-3-bound). In ' +
    'liver this shuts off FoxO1-driven gluconeogenesis (insulin’s glucose-lowering action); broadly it ' +
    'suppresses the FoxO apoptosis, autophagy, and stress-resistance program — a key pro-growth output.',
  'AKT active BAD / MDM2 / eNOS / p21 phosphorylation':
    'AKT’s pro-survival/growth signature comes from phosphorylating many substrates: BAD (blocks apoptosis), ' +
    'MDM2 (promotes p53 degradation), eNOS (vasodilation), and p21/p27 (cell cycle). This breadth is why ' +
    'constitutive PI3K/AKT activation is so oncogenic and so heavily drug-targeted (PI3K/AKT/mTOR inhibitors).',
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
