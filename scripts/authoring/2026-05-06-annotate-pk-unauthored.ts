/**
 * 2026-05-06-annotate-pk-unauthored.ts
 *
 * Marks compounds where pk[route] authoring is either intentionally
 * misleading (gut-acting / topical / inhaled-only) or genuinely impossible
 * (research compounds with no Phase I PK). Sets the new optional
 * `pk_unauthored` field with a structured reason + free-text note.
 *
 * Triage:
 *   local-acting (13)  — systemic plasma PK is negligible by design
 *   research-only (9)  — pre-clinical SARMs / research chemicals
 *
 * Linaclotide is intentionally NOT in this list: F=0.001 is verifiable
 * from PMID:20863829 and the catalog already authors it with that value
 * + the note explaining gut-acting mechanism. Leaving its pk[PO] in place
 * is more informative than blanking it.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk_unauthored?: { reason: string; note?: string };
  [k: string]: unknown;
}

const ANNOTATIONS: Array<{ slug: string; reason: 'local-acting' | 'research-only' | 'mixture'; note: string }> = [
  // ── Local-acting (gut/topical/inhaled — systemic PK irrelevant by design) ──
  { slug: 'acarbose',              reason: 'local-acting', note: 'α-glucosidase inhibitor acting in the small intestine lumen. Oral F ≈2% per FDA label; clinical effect (postprandial glucose reduction) is gut-local, not systemic.' },
  { slug: 'bismuth-subsalicylate', reason: 'local-acting', note: 'OTC GI agent; bismuth salt acts topically on GI mucosa. Salicylate component is absorbed but bismuth itself has minimal systemic PK relevance.' },
  { slug: 'docusate',              reason: 'local-acting', note: 'Stool softener acting in the GI lumen. Minimal systemic absorption; no clinical plasma PK characterization.' },
  { slug: 'lactulose',             reason: 'local-acting', note: 'Non-absorbed disaccharide; entire mechanism (osmotic + colonic ammonia trapping in hepatic encephalopathy) is gut-luminal.' },
  { slug: 'nystatin',              reason: 'local-acting', note: 'Polyene antifungal; oral form acts on Candida in the GI lumen. F ≈0% by design — not absorbed orally.' },
  { slug: 'pancrelipase',          reason: 'mixture',      note: 'Multi-enzyme replacement (lipase + amylase + protease). Acts in the intestinal lumen on dietary substrates; not a single PK-fittable species.' },
  { slug: 'polyethylene-glycol',   reason: 'local-acting', note: 'Osmotic laxative (PEG 3350). Non-absorbed by molecular size; effect is purely intraluminal water retention.' },
  { slug: 'simethicone',           reason: 'local-acting', note: 'Antifoaming agent; surface-active silicone polymer. Not absorbed; reduces GI gas surface tension topically.' },
  { slug: 'aclidinium',            reason: 'local-acting', note: 'Inhaled long-acting muscarinic antagonist (LAMA). Lung-deposited fraction binds airway M3 receptors; swallowed fraction undergoes extensive presystemic hydrolysis. Plasma PK is not the clinically relevant compartment.' },
  { slug: 'beclomethasone',        reason: 'local-acting', note: 'Inhaled / intranasal corticosteroid. Topical airway / nasal mucosa effect; systemic exposure is minimized by design (active metabolite 17-BMP has variable systemic PK).' },
  { slug: 'bimatoprost',           reason: 'local-acting', note: 'Ophthalmic prostaglandin analog (Latisse / Lumigan). Acts locally on uveoscleral outflow / hair follicle; topical drop with negligible systemic plasma PK.' },
  { slug: 'articaine',             reason: 'local-acting', note: 'Amide local anesthetic, primarily IM/SC for dental and regional blocks. Effect is at the injection site; plasma levels reflect post-block redistribution rather than the clinically relevant compartment.' },
  { slug: 'rifaximin',             reason: 'local-acting', note: 'Gut-restricted rifamycin antibiotic. Oral F <0.4% per FDA label; effect is on enteric flora, not systemic.' },

  // ── Research compounds (no clinical Phase I PK) ──
  { slug: 'acp-105',     reason: 'research-only', note: 'SARM (selective androgen receptor modulator) in pre-clinical literature. No published Phase I human PK; circulated through grey-market supply only.' },
  { slug: 'andarine',    reason: 'research-only', note: 'SARM (S-4); GTx Inc development discontinued. Pharmacokinetics characterized only in animal toxicology; no clinical PK published.' },
  { slug: 'cardarine',   reason: 'research-only', note: 'PPARδ agonist (GW501516) — GSK development halted in Phase II for carcinogenicity in chronic-tox studies. No registered clinical PK profile.' },
  { slug: 'lgd-3303',    reason: 'research-only', note: 'SARM in pre-clinical literature (Ligand Pharmaceuticals). No clinical PK characterization published.' },
  { slug: 'rad-150',     reason: 'research-only', note: 'Synthetic anabolic steroid (TLB-150 benzoate ester); grey-market only. No clinical PK literature.' },
  { slug: 's-23',        reason: 'research-only', note: 'SARM under investigation for male contraception (GTx). Pre-clinical only; no published clinical PK.' },
  { slug: 'stenabolic',  reason: 'research-only', note: 'REV-ERBα agonist (SR9009); active in animal models but oral F essentially zero per Solt 2012. No clinical PK characterization.' },
  { slug: 'tesofensine', reason: 'research-only', note: 'Triple monoamine reuptake inhibitor; Phase III for obesity halted by Saniona. Some PK literature exists but compound is not clinically marketed.' },
  { slug: 'yk-11',       reason: 'research-only', note: 'Steroidal myostatin-pathway modulator; pre-clinical literature only. No clinical PK published.' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;
  for (const a of ANNOTATIONS) {
    const c = bySlug.get(a.slug);
    if (!c) { console.warn(`  [warn] missing: ${a.slug}`); missing++; continue; }
    if (c.pk_unauthored) { alreadyHas++; continue; }
    c.pk_unauthored = { reason: a.reason, note: a.note };
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`pk_unauthored annotation: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
