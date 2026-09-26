/**
 * 2026-05-24-biochem-step-notes-batch6.ts
 *
 * step.note batch 6 — the textbook tail: kynurenine + tryptophan,
 * omega-3/resolvins, phase-2 conjugation, phase-1 CYP overview,
 * warfarin metabolism, ubiquitin-proteasome, cardiac action potential,
 * renal tubular transport, riboflavin excretion, NAD/sirtuin axis.
 * Established biochem/physiology/pharmacology, complementary to each
 * `via`; grounded by existing refs[], NO new PMIDs. Exact from→to keys
 * (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-biochem-step-notes-batch6.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  kynurenine_tryptophan_pathway: {
    'dietary L-tryptophan N-formylkynurenine':
      'This is the quantitatively dominant fate of tryptophan (~95%, vs the minor serotonin branch). Hepatic ' +
      'TDO is substrate/cortisol-induced while immune-cell IDO1 is IFN-γ-induced — so inflammation diverts ' +
      'tryptophan here and depletes serotonin precursor.',
    'N-formylkynurenine kynurenine (the branch hub)':
      'Kynurenine is the branch hub, partitioning between the neurotoxic (3-HK/quinolinic) and neuroprotective ' +
      '(kynurenic) arms. It crosses the blood–brain barrier, so peripheral immune/hepatic production shapes ' +
      'CNS kynurenine metabolism.',
    'kynurenine + KMO 3-hydroxykynurenine → 3-HAA':
      'KMO commits flux toward the quinolinic (neurotoxic) arm and is rate-limiting for it; ' +
      '3-hydroxykynurenine is itself a pro-oxidant. KMO inhibition (shunting toward neuroprotective kynurenic ' +
      'acid) is studied in Huntington’s and neurodegeneration.',
    '3-HAA → ACMSD quinolinic acid (QUIN — NMDA agonist)':
      'Quinolinic acid is both the precursor for de-novo NAD⁺ synthesis (cross-link niacin_nad_synthesis) and ' +
      'an NMDA-agonist excitotoxin. ACMSD diverts substrate toward picolinic acid, setting how much goes to ' +
      'NAD versus excitotoxicity.',
    'kynurenine + KAT-I/II/III/IV kynurenic acid (KYNA — NMDA + α7-nAChR antagonist)':
      'Kynurenine aminotransferases make kynurenic acid, an NMDA and α7-nicotinic antagonist — neuroprotective ' +
      'at low levels but, when elevated, implicated in the cognitive deficits of schizophrenia. The KYNA:QUIN ' +
      'balance is the pathway’s key functional readout.',
    'IDO1 induction (tumor / Treg) local Trp depletion + Kyn accumulation':
      'IDO1 induction in tumors and regulatory T cells is an immune-checkpoint mechanism: local tryptophan ' +
      'depletion arrests effector T cells while kynurenine (an aryl-hydrocarbon-receptor ligand) drives Treg ' +
      'differentiation — the rationale for IDO-inhibitor immuno-oncology.',
  },
  tryptophan_metabolism: {
    'tryptophan n-formylkynurenine':
      'Of tryptophan’s three fates — protein, serotonin, and kynurenine — the kynurenine route consumes the ' +
      'majority (~95%). TDO (hepatic, cortisol-induced) and IDO (immune, IFN-induced) gate it, so stress and ' +
      'inflammation pull tryptophan away from serotonin synthesis.',
    'n-formylkynurenine kynurenine':
      'Kynurenine is the central branch point feeding either the NAD-synthesis/quinolinic arm or the ' +
      'kynurenic-acid arm; it is also an aryl-hydrocarbon-receptor ligand with immune-modulating effects and ' +
      'crosses into the CNS from the periphery.',
    'kynurenine 3-hydroxykynurenine':
      'KMO directs flux toward 3-hydroxykynurenine and ultimately quinolinic acid → NAD — the route by which ' +
      'dietary tryptophan can substitute for niacin (cross-link niacin_nad_synthesis). 3-HK is a pro-oxidant ' +
      'intermediate.',
    'kynurenine kynurenic-acid':
      'The alternative KAT branch yields kynurenic acid, an NMDA/α7-nicotinic antagonist — potentially ' +
      'neuroprotective, but elevated levels are linked to cognitive symptoms; the balance with the quinolinic ' +
      'arm shapes the pathway’s net CNS effect.',
  },
  omega_fatty_acid_metabolism: {
    'alpha-linolenic-acid eicosapentaenoic-acid':
      'Endogenous conversion of plant ALA to EPA is inefficient (<10%, often <5%, lower in men) — the basis ' +
      'for recommending preformed marine EPA. EPA also competes with arachidonic acid for the eicosanoid ' +
      'enzymes, shifting toward less-inflammatory mediators.',
    'eicosapentaenoic-acid docosahexaenoic-acid':
      'EPA→DHA conversion is likewise limited (and partly retroconverts), so DHA — uniquely concentrated in ' +
      'brain and retinal membranes — is best obtained preformed. Algal oil is a vegan DHA source that bypasses ' +
      'the poor conversion.',
    'eicosapentaenoic-acid resolvin-e1':
      'EPA is the substrate for E-series resolvins — specialized pro-resolving mediators that actively ' +
      'terminate inflammation rather than merely block it. Aspirin-acetylated COX-2 makes the aspirin-triggered ' +
      'forms, a proposed contributor to aspirin’s benefits.',
    'docosahexaenoic-acid resolvin-d1':
      'DHA yields D-series resolvins, protectins, and maresins — the specialized pro-resolving mediator (SPM) ' +
      'family that drives active resolution of inflammation and tissue repair, reframing omega-3 benefit as ' +
      'pro-resolution, not simple anti-inflammation.',
  },
  conjugation_phase2_overview: {
    'oxidized-or-parent-drug glucuronide-conjugate':
      'Glucuronidation (UGTs) is the highest-capacity phase-2 route, adding glucuronic acid for water-soluble ' +
      'excretion. UGT1A1 also conjugates bilirubin (Gilbert’s), and glucuronides can be recycled by gut ' +
      'β-glucuronidase (enterohepatic circulation).',
    'oxidized-or-parent-drug sulfate-conjugate':
      'Sulfotransferases are high-affinity but low-capacity (limited by the PAPS cosubstrate), so they ' +
      'saturate at higher doses — classically acetaminophen, where the sulfation route saturates and shifts ' +
      'metabolism toward the toxic CYP/NAPQI pathway.',
    'reactive-metabolite glutathione-conjugate':
      'Glutathione-S-transferases neutralize reactive electrophiles (forming mercapturates), the key defense ' +
      'against toxic CYP metabolites such as acetaminophen’s NAPQI. Depleting GSH (overdose, fasting) is what ' +
      'makes acetaminophen hepatotoxic; NAC replenishes it.',
    'arylamine-or-hydrazide n-acetyl-conjugate':
      'N-acetyltransferase 2 acetylates arylamines/hydrazides; its slow/fast-acetylator polymorphism alters ' +
      'isoniazid, hydralazine, and sulfonamide handling (slow acetylators risk drug-induced lupus and INH ' +
      'neuropathy) and modifies arylamine bladder-cancer risk.',
  },
  cyp_phase1_overview: {
    'lipophilic-drug oxidized-metabolite':
      'Cytochrome P450s perform most phase-1 oxidation, with CYP3A4 alone handling ~50% of drugs (gut + liver). ' +
      'They are the hub of pharmacokinetic interactions — inhibitors (ketoconazole, grapefruit, ritonavir) ' +
      'raise substrate levels while inducers (rifampin, carbamazepine, St John’s wort) lower them — and 2D6/' +
      '2C19 polymorphisms drive poor/ultrarapid-metabolizer phenotypes.',
  },
  warfarin_metabolism: {
    'warfarin 7-hydroxywarfarin':
      'The potent S-enantiomer is cleared mainly by CYP2C9, so CYP2C9 loss-of-function (*2,*3) plus VKORC1 ' +
      'promoter variants together explain ~40% of dose variability (the basis of pharmacogenomic dosing). Many ' +
      'interactions (azoles, amiodarone, sulfamethoxazole) act by inhibiting CYP2C9.',
    'warfarin 6-hydroxywarfarin':
      'The less-active R-enantiomer is handled by CYP1A2/CYP3A4; since warfarin is dosed as a racemate this is ' +
      'the minor contributor to anticoagulant effect, though R-pathway interactions can still nudge the INR.',
  },
  ubiquitin_proteasome: {
    'substrate-protein monoubiquitinated':
      'The cascade — activating E1, conjugating E2, substrate-specific E3 ligase — tags proteins, with the ' +
      'hundreds of E3 ligases providing specificity. This is the substrate of PROTAC/molecular-glue degraders ' +
      'and of MDM2 (p53) and VHL (HIF) ligase biology.',
    'monoubiquitinated polyubiquitinated-k48':
      'K48-linked chains are the canonical degradation signal — distinct from K63 chains, which signal ' +
      'trafficking/DNA repair. Chain topology (the “ubiquitin code”), not merely the presence of ubiquitin, ' +
      'determines the substrate’s fate.',
    'polyubiquitinated-k48 proteasomal-peptides':
      'The 26S proteasome unfolds and degrades tagged proteins (recycling ubiquitin) and is the ' +
      'bortezomib/carfilzomib target — multiple-myeloma cells, with huge immunoglobulin output, are especially ' +
      'dependent on proteasomal clearance of misfolded protein.',
  },
  cardiac_action_potential: {
    'phase-0-depolarization phase-1-early-repolarization':
      'Phase 0 is the fast upstroke from Nav1.5 sodium influx — the Class-I antiarrhythmic target, and where ' +
      'loss-of-function causes Brugada syndrome. Phase 1 is brief Ito-mediated early repolarization.',
    'phase-1-early-repolarization phase-2-plateau':
      'The plateau is the cardiac AP’s signature: inward L-type Ca²⁺ current (the Class-IV ' +
      'calcium-channel-blocker target) balances outward K⁺, sustaining depolarization to drive ' +
      'excitation–contraction coupling (Ca-induced Ca release).',
    'phase-2-plateau phase-3-repolarization':
      'Repolarization via delayed-rectifier K⁺ currents IKr (hERG) and IKs is the Class-III antiarrhythmic ' +
      'target — and hERG block by many non-cardiac drugs causes acquired long-QT/torsades, a leading reason ' +
      'drugs are withdrawn for cardiac safety.',
    'phase-3-repolarization phase-4-resting':
      'IK1 sets the resting potential; in the SA/AV nodes the funny current If drives spontaneous phase-4 ' +
      'depolarization (automaticity) — the ivabradine target, slowed by β-blockers, the basis of heart-rate ' +
      'control.',
  },
  renal_tubular_transport: {
    'glomerular-filtrate pt-reabsorption':
      'The proximal tubule reabsorbs ~65% of filtered Na⁺/water plus glucose (SGLT2), bicarbonate (carbonic ' +
      'anhydrase), and amino acids. SGLT2 inhibitors and acetazolamide act here, and it is also where most ' +
      'drugs are actively secreted (OAT/OCT).',
    'pt-reabsorption tal-reabsorption':
      'The thick ascending limb’s NKCC2 cotransporter (the loop-diuretic/furosemide target) reabsorbs Na/K/2Cl ' +
      'and powers the countercurrent concentrating mechanism. Its loss-of-function is Bartter syndrome; loop ' +
      'diuretics are the most potent natriuretics.',
    'tal-reabsorption dct-reabsorption':
      'The distal convoluted tubule’s Na/Cl cotransporter (NCC) is the thiazide target; its loss-of-function ' +
      'is Gitelman syndrome. Thiazides are weaker than loop diuretics but enhance distal Ca²⁺ reabsorption, ' +
      'reducing calcium-stone risk.',
    'dct-reabsorption ccd-fine-tuning':
      'The collecting duct fine-tunes Na⁺/K⁺ via aldosterone-controlled ENaC — the site of K⁺-sparing ' +
      'diuretics (amiloride/triamterene block ENaC; spironolactone/eplerenone block the mineralocorticoid ' +
      'receptor) and of ADH-driven water reabsorption (aquaporin-2).',
  },
  riboflavin_renal_excretion_color: {
    'riboflavin intestinal absorption via RFVT3 (SLC52A3)':
      'Riboflavin (B2) is taken up by saturable RFVT transporters, so absorption caps per dose — large ' +
      'supplemental amounts are only partly absorbed. RFVT mutations cause Brown-Vialetto-Van Laere syndrome ' +
      '(riboflavin-responsive neuropathy).',
    'intestinal absorption via RFVT3 (SLC52A3) systemic FAD / FMN pool + tissue saturation':
      'Absorbed riboflavin is converted by riboflavin kinase to FMN, then to FAD — the flavin cofactors for ' +
      'oxidoreductases (respiratory complexes I/II, fatty-acid oxidation, and the methylation enzyme MTHFR). ' +
      'Tissue flavin pools saturate at a ceiling.',
    'systemic FAD / FMN pool + tissue saturation free plasma riboflavin overflow':
      'Once tissue cofactor needs are met, surplus riboflavin is not stored — it spills over as free vitamin ' +
      'into plasma, since the body keeps no meaningful B2 reserve (hence the need for regular intake).',
    'free plasma riboflavin overflow glomerular filtration + renal excretion':
      'Free riboflavin (low MW ~376 Da, water-soluble, minimally protein-bound) is readily filtered and ' +
      'excreted — so high-dose B2 (and any B-complex/multivitamin) appears in urine within hours.',
    'glomerular filtration + renal excretion fluorescent yellow-green urine (peak emission ~525 nm)':
      'Riboflavin’s isoalloxazine ring fluoresces (peak ~525 nm), turning urine bright neon yellow-green soon ' +
      'after a B-vitamin dose — a harmless, visible “flavinuria” that simply marks intake above tissue need.',
  },
  nad_sirtuin_axis: {
    'nicotinamide nmn':
      'NAMPT is the rate-limiting enzyme of the NAD⁺ salvage pathway (recycling the nicotinamide released by ' +
      'NAD-consuming enzymes). Because sirtuins, PARPs, and CD38 all consume NAD⁺, salvage flux — and its ' +
      'age-related decline — sets cellular NAD⁺ availability.',
    'nmn nad-plus':
      'NMNAT adenylylates NMN to NAD⁺ (the step NMN/NR supplements ultimately feed). Its isoforms ' +
      'compartmentalize NAD⁺ synthesis (nuclear, cytosolic, mitochondrial); NMNAT2 loss drives axon ' +
      'degeneration via the SARM1 axon-death pathway.',
    'nad-plus nicotinamide':
      'Sirtuins (SIRT1-7) consume NAD⁺ to deacetylate targets, releasing nicotinamide (which feedback-inhibits ' +
      'them) — so they act as energy/redox sensors, coupling the NAD⁺/NADH state to deacetylation of histones, ' +
      'PGC-1α, FoxO, and p53.',
    'nad-plus sirtuin-activation':
      'Sirtuin activity tracks NAD⁺ availability — the premise behind NAD⁺-boosting (NR/NMN/niacin) and direct ' +
      'sirtuin activators (resveratrol, the debated STAC class) aimed at the metabolic/longevity benefits of ' +
      'caloric restriction.',
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
