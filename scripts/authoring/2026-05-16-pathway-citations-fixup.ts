/**
 * 2026-05-16-pathway-citations-fixup.ts
 *
 * Post-hoc fix-up for 7 pathways where the previous batch citations
 * verified to a real paper but the paper was a narrow or off-topic
 * anchor for what the pathway page actually describes. This script
 * removes the weak refs and substitutes (or supplements with)
 * topically-anchored ones.
 *
 * Each replacement PMID was verified via NCBI E-utilities `esummary`
 * 2026-05-16. The audit + replacement rationale per pathway:
 *
 *   cholesterol_synthesis:
 *     REMOVE PMID:19299327 — Goldstein/Brown 2009 "The LDL receptor"
 *       (great paper but about LDL-R biology, not the
 *       mevalonate-pathway / HMG-CoA reductase / SREBP-2 content
 *       this pathway actually describes)
 *     ADD    PMID:1967820  — Goldstein JL, Brown MS 1990 Nature.
 *       "Regulation of the mevalonate pathway" (canonical paper
 *       anchoring the exact synthesis-side cascade the pathway
 *       describes — Nobel-team review of the rate-limiting
 *       HMG-CoA reductase + SREBP feedback loop)
 *
 *   acetylcholine_axis:
 *     REMOVE PMID:16530842 — Sarter 2006 "More attention must be
 *       paid: neurobiology of attentional effort" (relevant to
 *       cholinergic cognition but the pathway is about ACh
 *       synthesis + breakdown enzymes, not attention)
 *     ADD    PMID:11283752 — Soreq H, Seidman S 2001
 *       Nat Rev Neurosci. "Acetylcholinesterase — new roles for
 *       an old actor" (direct AChE biology + drug interaction
 *       anchor matching the pathway's ChAT/AChE/BChE content)
 *
 *   apoptosis_bcl2_axis:
 *     ADD    PMID:24355989 — Czabotar PE, Lessene G, Strasser A,
 *       Adams JM 2014 Nat Rev Mol Cell Biol. "Control of apoptosis
 *       by the BCL-2 protein family: implications for physiology
 *       and therapy" (canonical BCL-2 family review — anchors
 *       the broader BAX/BAK/BH3-only/anti-apoptotic biology the
 *       pathway describes, supplementing the two existing
 *       venetoclax-specific cites)
 *
 *   tryptophan_metabolism:
 *     ADD    PMID:22248239 — Stone TW, Stoy N, Darlington LG 2012
 *       FEBS J. "Kynurenine pathway inhibition as a therapeutic
 *       strategy for neuroprotection" (broader IDO/TDO/kynurenine
 *       pathway anchor, supplementing the Zwilling KMO-specific cite)
 *
 *   gi_endocrine_peptides_misc:
 *     ADD    PMID:17167473 — Murphy KG, Bloom SR 2006 Nature.
 *       "Gut hormones and the regulation of energy homeostasis"
 *       (canonical review covering the full peptide family —
 *       SST/VIP/CCK/secretin/glucagon — beyond just incretins;
 *       supplements the Drucker incretin cite)
 *
 *   posterior_pituitary_oxt_vp:
 *     ADD    PMID:18509340 — Bourque CW 2008 Nat Rev Neurosci.
 *       "Central mechanisms of osmosensation and systemic
 *       osmoregulation" (anchors AVP osmoregulation + V2 aquaporin
 *       physiology — the systemic side of the pathway. Stoop's
 *       OXT/AVP-in-amygdala paper still covers the behavioral arm)
 *
 *   hpg_axis:
 *     ADD    PMID:29562364 — Bhasin S et al. 2018
 *       J Clin Endocrinol Metab. "Testosterone Therapy in Men
 *       With Hypogonadism: An Endocrine Society Clinical Practice
 *       Guideline" (clinical-guideline anchor for the LH→T axis
 *       + therapeutic content, alongside the existing Veldhuis
 *       aging-male pulsatility cite)
 *
 * Net coverage change: -2 refs (the two replacements remove the
 * weak cite) +7 adds = +5 net. Same idempotent merge-via-Set logic
 * as the other batches; removals are explicit.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway {
  slug: string;
  refs?: string[];
  [k: string]: unknown;
}

/** Per-pathway ops. `remove` is applied first, then `add` is merged
 *  via Set so re-runs are idempotent. */
const FIXUPS: Record<string, { remove?: string[]; add: string[] }> = {
  cholesterol_synthesis: {
    remove: ['PMID:19299327'],
    add: ['PMID:1967820'],
  },
  acetylcholine_axis: {
    remove: ['PMID:16530842'],
    add: ['PMID:11283752'],
  },
  apoptosis_bcl2_axis: {
    add: ['PMID:24355989'],
  },
  tryptophan_metabolism: {
    add: ['PMID:22248239'],
  },
  gi_endocrine_peptides_misc: {
    add: ['PMID:17167473'],
  },
  posterior_pituitary_oxt_vp: {
    add: ['PMID:18509340'],
  },
  hpg_axis: {
    add: ['PMID:29562364'],
  },
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const summary: Array<{ slug: string; before: number; after: number; removed: number; added: number }> = [];
  const missing: string[] = [];

  for (const [slug, op] of Object.entries(FIXUPS)) {
    const path = data.find(p => p.slug === slug);
    if (!path) {
      missing.push(slug);
      continue;
    }
    const before = (path.refs ?? []).length;
    const removeSet = new Set(op.remove ?? []);
    const filtered = (path.refs ?? []).filter(r => !removeSet.has(r));
    const merged = Array.from(new Set([...filtered, ...op.add]));
    path.refs = merged;
    summary.push({
      slug,
      before,
      after: merged.length,
      removed: (op.remove ?? []).length,
      added: op.add.length,
    });
  }

  if (missing.length > 0) {
    console.error('FAIL — pathways not found in registry:');
    for (const s of missing) console.error('  -', s);
    process.exit(1);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Fixed refs[] on ${summary.length} pathways:`);
  for (const r of summary) {
    const delta = `(-${r.removed} +${r.added})`;
    console.log(`  ${r.slug.padEnd(40)}  refs: ${r.before} → ${r.after}  ${delta}`);
  }
}

main();
