/**
 * 2026-05-12-wave-sp-cluster.ts — Sensory / Specialty cluster (SP-1..4).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'aqueous_humor_iop_regulation',
    name: 'Aqueous humor / IOP regulation (glaucoma pharmacology)',
    category: 'transport',
    systems: ['nervous'],
    description: `Intraocular pressure (IOP) reflects aqueous humor production (ciliary body) - outflow (trabecular meshwork + uveoscleral). Glaucoma Rx classes attack both arms. (1) Decrease production: β-blockers (timolol, betaxolol) — block ciliary β-receptors that drive aqueous secretion; α2-agonists (brimonidine, apraclonidine) — Gi-coupled inhibition of cAMP-driven production; carbonic anhydrase inhibitors (dorzolamide topical, acetazolamide systemic). (2) Increase outflow: prostaglandin F2α analogs (latanoprost, bimatoprost, travoprost, tafluprost) — uveoscleral outflow facilitation by remodeling extracellular matrix; rho-kinase inhibitors (netarsudil) — trabecular meshwork; cholinergic miotics (pilocarpine — older) — open trabecular meshwork via ciliary muscle contraction.`,
    steps: [
      { from: 'ciliary-body', to: 'aqueous-humor-production', via: 'β-adrenergic + CA-mediated bicarbonate secretion drives net fluid' },
      { from: 'aqueous-humor', to: 'trabecular-meshwork-outflow', via: 'majority outflow via canal of Schlemm; minor via uveoscleral pathway (PGF2α target)' },
    ],
    modulators: [
      { slug: 'latanoprost', effect: 'activator', target: 'FP prostaglandin receptor (uveoscleral outflow)', note: 'first PGF2α analog (Xalatan); once-nightly drops; iris pigmentation + eyelash growth + periorbital changes' },
      { slug: 'bimatoprost', effect: 'activator', target: 'FP prostaglandin receptor', note: 'PGF2α analog; same MOA + side effects as latanoprost; cosmetic eyelash form (Latisse)' },
      { slug: 'timolol-eye', effect: 'inhibitor', target: 'β1 + β2 (ciliary body — reduces aqueous production)', note: 'topical β-blocker; systemic absorption can cause bradycardia/bronchoconstriction; punctal occlusion reduces' },
      { slug: 'brimonidine', effect: 'activator', target: 'α2-adrenergic (reduces aqueous production + increases uveoscleral outflow)', note: 'α2-agonist eye drops; pediatric CNS depression risk (BBB-permeant in young kids)' },
      { slug: 'dorzolamide', effect: 'inhibitor', target: 'carbonic anhydrase II (topical CAI)', note: 'topical CAI; reduces bicarbonate-driven aqueous production; metallic taste even from topical' },
      { slug: 'acetazolamide', effect: 'inhibitor', target: 'carbonic anhydrase (systemic)', note: 'systemic CAI; acute glaucoma + altitude sickness + epilepsy adjunct; cross-link: renal_tubular_transport for diuretic role' },
    ],
    refs: [],
  },
  {
    slug: 'bladder_detrusor_pharmacology',
    name: 'Bladder detrusor pharmacology (M3 / β3 / α1A / 5α-reductase)',
    category: 'signaling',
    systems: ['renal'],
    description: `Detrusor (bladder smooth muscle) contracts via M3 muscarinic activation (parasympathetic, mediates voiding); relaxes via β3-adrenergic (sympathetic, mediates storage). Bladder neck + prostatic urethra contract via α1A-adrenergic (impedes voiding in BPH). Overactive bladder (OAB) Rx blocks the contraction signal: muscarinic antagonists (oxybutynin, tolterodine, solifenacin, darifenacin, fesoterodine) or activates the relaxation signal (β3-agonist mirabegron, vibegron). BPH Rx removes urethral resistance: α1-blockers (tamsulosin α1A-selective uroselective; alfuzosin, silodosin uroselective; doxazosin, terazosin non-selective also useful for BP). Long-term BPH: 5α-reductase inhibitors (finasteride, dutasteride — covered in END-1 HPG axis) shrink prostate over months.`,
    steps: [
      { from: 'detrusor-m3-activation', to: 'detrusor-contraction', via: 'parasympathetic ACh → M3/Gq → IP3 → Ca²⁺ → contraction → voiding' },
      { from: 'detrusor-b3-activation', to: 'detrusor-relaxation', via: 'sympathetic NE → β3/Gs → cAMP → relaxation → storage' },
      { from: 'urethral-a1a-activation', to: 'urethral-contraction', via: 'NE → α1A/Gq → contraction → outlet resistance (BPH urinary obstruction)' },
    ],
    modulators: [
      { slug: 'mirabegron', effect: 'activator', target: 'β3-adrenergic (detrusor)', note: 'OAB; relaxation-by-β3 alternative to antimuscarinics; less anticholinergic burden in elderly' },
      { slug: 'terazosin', effect: 'inhibitor', target: 'α1 (non-selective)', note: 'BPH + HTN; first-dose syncope; non-uroselective → BP effect more prominent than tamsulosin' },
    ],
    refs: [],
  },
];

// Modulator extensions
const ENDOCANNABINOID_EXT = [
  { slug: 'thc', effect: 'activator' as const, target: 'CB1 (partial agonist) + CB2', note: 'Δ9-tetrahydrocannabinol; cannabis psychoactive; analgesic + appetite + intraocular pressure + anti-emetic' },
  { slug: 'cbd', effect: 'activator' as const, target: 'CB2 weak + GPR55 + 5-HT1A + TRPV1 (multi-target)', note: 'cannabidiol; non-psychoactive; Epidiolex for Dravet/Lennox-Gastaut + tuberous sclerosis; CYP3A4/2C19 inhibitor' },
  { slug: 'cbg', effect: 'activator' as const, target: 'CB1/CB2 weak + α2-adrenergic + 5-HT1A', note: 'cannabigerol; non-intoxicating; research-stage for IBD + glaucoma + appetite' },
  { slug: 'dronabinol', effect: 'activator' as const, target: 'CB1 + CB2 (synthetic Δ9-THC)', note: 'Marinol; FDA-approved synthetic THC for chemo N/V + AIDS-wasting' },
  { slug: 'beta-caryophyllene', effect: 'activator' as const, target: 'CB2 (selective)', note: 'terpene; CB2-selective (avoids CB1 psychoactive effects); anti-inflammatory + analgesic claims' },
  { slug: '7-hydroxymitragynine', effect: 'activator' as const, target: 'μ-opioid + CB1 partial', note: 'kratom active metabolite; partial μ-agonist + CB1 — kratom\'s opioid-like effects' },
];

const OPIOID_EXT = [
  { slug: 'hydrocodone', effect: 'activator' as const, target: 'μ-opioid receptor (semisynthetic)', note: 'most-prescribed US opioid; CYP2D6 → hydromorphone active metabolite (poor metabolizers reduced efficacy)' },
  { slug: 'codeine', effect: 'activator' as const, target: 'μ-opioid receptor (prodrug → morphine via CYP2D6)', note: 'CYP2D6 PMs have minimal effect; ultra-rapid metabolizers have severe respiratory depression risk (pediatric deaths)' },
  { slug: 'hydromorphone', effect: 'activator' as const, target: 'μ-opioid receptor', note: '5-10× more potent than morphine; preferred in renal impairment (no active metabolites)' },
  { slug: 'oxymorphone', effect: 'activator' as const, target: 'μ-opioid receptor', note: 'oxycodone\'s O-demethylated active metabolite; PO + IV; CV instability + drug abuse signal' },
  { slug: 'fentanyl', effect: 'activator' as const, target: 'μ-opioid receptor', note: '~100× morphine potency; TD + IV + buccal; primary illicit overdose driver post-2014' },
  { slug: 'methadone', effect: 'activator' as const, target: 'μ-opioid receptor + NMDA antagonist', note: 'opioid use disorder + chronic pain; long + variable t½ → accumulation risk; QT prolongation' },
  { slug: 'tramadol', effect: 'activator' as const, target: 'μ-opioid (weak) + SNRI', note: 'dual mechanism; CYP2D6 → O-desmethyltramadol active metabolite; serotonin-syndrome risk with SSRIs' },
  { slug: 'tapentadol', effect: 'activator' as const, target: 'μ-opioid + NRI', note: 'dual mechanism; less constipation than pure μ-agonists; class II controlled' },
  { slug: 'pentazocine', effect: 'activator' as const, target: 'κ-agonist + μ partial agonist/antagonist', note: 'mixed agonist-antagonist; ceiling effect on respiratory depression; can precipitate withdrawal in opioid-dependent users' },
  { slug: 'butorphanol', effect: 'activator' as const, target: 'κ-agonist + μ partial agonist/antagonist', note: 'mixed agonist-antagonist; intranasal for migraine; psychomimetic effects via κ' },
  { slug: 'remifentanil', effect: 'activator' as const, target: 'μ-opioid receptor', note: 'ultra-short-acting μ-agonist; esterase metabolism → context-insensitive half-life ~3 min; OR anesthesia adjunct' },
  { slug: 'alfentanil', effect: 'activator' as const, target: 'μ-opioid receptor', note: 'short-acting μ-agonist; fast onset (small Vd) + offset; OR/ICU' },
  { slug: 'sufentanil', effect: 'activator' as const, target: 'μ-opioid receptor', note: '~5-10× fentanyl potency; OR + chronic intrathecal; sublingual SDT for breakthrough cancer pain' },
  { slug: 'naltrexone', effect: 'inhibitor' as const, target: 'μ-opioid (competitive antagonist) + κ', note: 'opioid + alcohol use disorder; PO daily or monthly depot IM; precipitated withdrawal in opioid-dependent' },
  { slug: 'ldn', effect: 'inhibitor' as const, target: 'μ-opioid (low-dose, paradoxical microglial modulation)', note: 'low-dose naltrexone; off-label for chronic pain + autoimmune; paradoxical anti-inflammatory mechanism debated' },
];

function addModulators(p: Pathway, items: PathwayModulator[]): number {
  p.modulators = p.modulators ?? [];
  const have = new Set(p.modulators.map(m => m.slug));
  let added = 0;
  for (const m of items) {
    if (have.has(m.slug)) continue;
    p.modulators.push(m); have.add(m.slug); added++;
  }
  return added;
}

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p); added++;
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  const ec = bySlug.get('endocannabinoid_system');
  if (ec) console.log(`  [ext ] endocannabinoid_system            +${addModulators(ec, ENDOCANNABINOID_EXT)} (now ${ec.modulators!.length})`);
  const op = bySlug.get('opioid_receptor_signaling');
  if (op) console.log(`  [ext ] opioid_receptor_signaling         +${addModulators(op, OPIOID_EXT)} (now ${op.modulators!.length})`);
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nSP cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
