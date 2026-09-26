/**
 * 2026-05-15-compound-cross-links.ts
 *
 * Backfills `[[slug]]` cross-link markers in compounds.json mechanism +
 * notes prose. The linkify helper renders these as clickable links in
 * the UI (library detail mechanism, notes, interaction edge notes,
 * composition standardization, constituent notes).
 *
 * Strategy: hand-curated per-compound replacements. Each replacement
 * uses an anchored phrase that occurs verbatim in the prose, replacing
 * the FIRST occurrence only so the second mention reads as prose, not
 * a sea of underlined links. Skipped silently when the phrase doesn't
 * appear (the compound author may have rephrased — we don't force).
 *
 * Coverage delta: compounds.json `[[slug]]` markers 0 → ~80.
 *
 * The map deliberately targets *registry-resolvable* references only:
 * if a slug doesn't exist in pathways.json or compounds.json, the
 * marker would render as literal `[[slug]]` text — which is what the
 * linkify function falls back to and what we want to avoid for
 * high-traffic compound pages.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const PATHWAYS_PATH  = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Compound {
  slug: string;
  mechanism?: string;
  notes?: string;
  interactions?: Array<{ slug: string; note?: string; [k: string]: unknown }>;
  [k: string]: unknown;
}

interface CompoundReplacement {
  slug: string;
  /** [searchPhrase, markedReplacement] pairs. Applied in order; each
   *  replaces only the FIRST occurrence. */
  pairs: Array<[string, string]>;
}

const REPLACEMENTS: CompoundReplacement[] = [
  {
    slug: 'caffeine',
    pairs: [
      ['Non-selective adenosine A1/A2A receptor antagonist', 'Non-selective [[adenosine_receptor_signaling]] A1/A2A antagonist'],
      ['A2A is the higher-affinity arousal receptor', '[[orexin_arousal_axis]] — A2A is the higher-affinity arousal receptor'],
    ],
  },
  {
    slug: 'melatonin',
    pairs: [
      ['MT1/MT2 agonist; entrains circadian rhythm', 'MT1/MT2 agonist; entrains the [[circadian_clock_bmal1_per_cry]] circadian rhythm'],
    ],
  },
  {
    slug: 'magnesium',
    pairs: [
      ['Voltage-dependent block of NMDA receptor', 'Voltage-dependent block of [[nmda_receptor_signaling]] receptor'],
      ['glycolytic/TCA/oxidative-phosphorylation steps', 'glycolytic/TCA/[[oxidative_phosphorylation]] steps'],
    ],
  },
  {
    slug: 'theanine',
    pairs: [
      ['modulates GABA and glycine release', 'modulates [[gaba_a_receptor_signaling]] and [[glycine]] release'],
      ['Partial NMDA / AMPA receptor activity', 'Partial [[nmda_receptor_signaling]] / [[ampa_kainate_glutamate_extension]] receptor activity'],
      ["dampens caffeine's sympathetic overshoot", "dampens [[caffeine]]'s sympathetic overshoot"],
    ],
  },
  {
    slug: 'creatine',
    pairs: [
      ['synthesised from arginine + glycine + methionine', 'synthesised from [[arginine]] + [[glycine]] + [[methionine]]'],
      ['Stored in skeletal muscle + brain primarily as phosphocreatine', 'Stored in skeletal muscle + brain via the [[creatine_phosphocreatine_energy]] system primarily as phosphocreatine'],
    ],
  },
  {
    slug: 'cholecalciferol',
    pairs: [
      ['25-OH-D / calcifediol', '25-OH-D / [[calcifediol]]'],
      ['1,25-(OH)₂D / calcitriol', '1,25-(OH)₂D / [[calcitriol]]'],
      ['Magnesium is a cofactor', '[[magnesium]] is a cofactor'],
      ['Sequentially hydroxylated', 'Sequentially hydroxylated (see [[vitamin_d_metabolism]])'],
    ],
  },
  {
    slug: 'ascorbic-acid',
    pairs: [
      ['dopamine β-hydroxylase (noradrenaline synthesis)', '[[dopamine]] β-hydroxylase ([[norepinephrine]] synthesis — see [[catecholamine_synthesis]])'],
      ['recycles vitamin E from tocopheroxyl', 'recycles [[d-alpha-tocopherol]] from tocopheroxyl'],
    ],
  },
  {
    slug: 'acetaminophen',
    pairs: [
      ['Central COX-2 inhibition', 'Central [[arachidonic_acid_cascade]] COX-2 inhibition'],
      ['acting on endocannabinoid + TRPV1 systems', 'acting on [[endocannabinoid_system]] + TRPV1 systems'],
      ['detoxified by glutathione', 'detoxified by [[glutathione]]'],
      ['N-acetylcysteine is the antidote', '[[n-acetyl-cysteine]] is the antidote'],
    ],
  },
  {
    slug: 'ibuprofen',
    pairs: [
      ['Reversible non-selective COX inhibitor', 'Reversible non-selective [[arachidonic_acid_cascade]] COX inhibitor'],
      ['(unlike aspirin', '(unlike [[aspirin]]'],
    ],
  },
  {
    slug: 'aspirin',
    pairs: [
      ['Irreversibly acetylates COX-1', 'Irreversibly acetylates [[arachidonic_acid_cascade]] COX-1'],
      ['→ platelet TxA2 suppression → antiplatelet', '→ [[platelet_aggregation]] TxA2 suppression → antiplatelet'],
    ],
  },
  {
    slug: 'metformin',
    pairs: [
      ['Mitochondrial complex I inhibition', 'Mitochondrial complex I inhibition (see [[oxidative_phosphorylation]])'],
      ['AMPK activation', '[[ampk_signaling]] activation'],
      ['reduced hepatic gluconeogenesis', 'reduced hepatic [[gluconeogenesis]]'],
    ],
  },
  {
    slug: 'berberine',
    pairs: [
      ['AMPK activation', '[[ampk_signaling]] activation'],
      ['PCSK9 modulation', '[[ldl_receptor_pcsk9_axis]] modulation'],
      ['insulin sensitivity', '[[insulin_glucose_homeostasis]] insulin sensitivity'],
    ],
  },
  {
    slug: 'atorvastatin',
    pairs: [
      ['Competitively inhibits HMG-CoA reductase', 'Competitively inhibits HMG-CoA reductase ([[cholesterol_synthesis]])'],
      ['Hepatic LDLR upregulation', '[[ldl_receptor_pcsk9_axis]] LDLR upregulation'],
      ['(vs simvastatin', '(vs [[simvastatin]]'],
    ],
  },
  {
    slug: 'modafinil',
    pairs: [
      ['Weak DAT inhibitor; orexin and histamine modulation', 'Weak DAT inhibitor ([[catecholamine_synthesis]]); [[orexin_arousal_axis]] and [[histamine_receptor_pharmacology]] modulation'],
    ],
  },
  {
    slug: 'nicotine',
    pairs: [
      ['nAChR agonist', '[[nicotinic_ach_receptor_pharmacology]] agonist'],
      ['releases ACh, dopamine, norepinephrine', 'releases [[acetylcholine]], [[dopamine]], [[norepinephrine]]'],
    ],
  },
  {
    slug: '5-htp',
    pairs: [
      ['Direct serotonin precursor', 'Direct [[serotonin]] precursor (see [[serotonin_melatonin_axis]])'],
      ['bypasses tryptophan hydroxylase', 'bypasses [[tryptophan]] hydroxylase'],
    ],
  },
  {
    slug: 'tryptophan',
    pairs: [
      ['Trp → 5-HTP (tryptophan hydroxylase) → serotonin', 'Trp → [[5-htp]] (tryptophan hydroxylase) → [[serotonin]] (see [[serotonin_melatonin_axis]])'],
      ['→ melatonin', '→ [[melatonin]]'],
      ['Parallel kynurenine pathway', 'Parallel [[kynurenine_tryptophan_pathway]]'],
    ],
  },
  {
    slug: 'tyrosine',
    pairs: [
      ['Tyr → L-DOPA (tyrosine hydroxylase, rate-limiting) → dopamine', 'Tyr → L-DOPA (tyrosine hydroxylase, rate-limiting; see [[catecholamine_synthesis]]) → [[dopamine]]'],
      ['→ norepinephrine', '→ [[norepinephrine]]'],
    ],
  },
  {
    slug: 'phenylalanine',
    pairs: [
      ['PAH, BH4-dependent', 'PAH, [[bh4_cycle]]-dependent'],
      ['catecholamine precursor', '[[catecholamine_synthesis]] precursor'],
      ['Precursor to adrenaline, noradrenaline, dopamine', 'Precursor to adrenaline, [[norepinephrine]], [[dopamine]]'],
    ],
  },
  {
    slug: 'dopamine',
    pairs: [
      ['Catecholamine synthesised from tyrosine', '[[catecholamine_synthesis]] synthesised from [[tyrosine]]'],
      ['Acts at D1-like', 'Acts at [[dopamine_receptor_signaling]] D1-like'],
    ],
  },
  {
    slug: 'serotonin',
    pairs: [
      ['Synthesised from 5-HTP', 'Synthesised from [[5-htp]] (see [[serotonin_melatonin_axis]])'],
      ['5-HT1–7 families', '[[serotonin_receptor_pharmacology]] 5-HT1–7 families'],
    ],
  },
  {
    slug: 'norepinephrine',
    pairs: [
      ['Catecholamine synthesised from dopamine', '[[catecholamine_synthesis]] synthesised from [[dopamine]]'],
      ['Dominant α₁ vasoconstrictor', 'Dominant [[adrenergic_receptor_signaling]] α₁ vasoconstrictor'],
    ],
  },
  {
    slug: 'arginine',
    pairs: [
      ['Substrate for nitric oxide synthase (NOS) → endothelial NO', 'Substrate for [[nitric_oxide_synthesis]] NOS → endothelial NO'],
      ['Intermediate in the urea cycle', 'Intermediate in the [[urea_cycle]]'],
      ['Precursor to creatine (with glycine and methionine)', 'Precursor to [[creatine]] (with [[glycine]] and [[methionine]])'],
    ],
  },
  {
    slug: 'citrulline',
    pairs: [
      ['Clinically superior to oral arginine', 'Clinically superior to oral [[arginine]]'],
      ['supports endothelial NOS → NO', 'supports endothelial NOS → NO (see [[nitric_oxide_synthesis]])'],
    ],
  },
  {
    slug: 'methionine',
    pairs: [
      ['converts to S-adenosyl-methionine (SAMe)', 'converts to [[s-adenosyl-methionine]] (SAMe)'],
      ['→ homocysteine → back to methionine', '→ [[homocysteine]] → back to methionine'],
      ['B12-dependent methionine synthase', '[[methionine_sam_cycle]] B12-dependent methionine synthase'],
      ['or to cysteine', 'or to [[cysteine]]'],
    ],
  },
  {
    slug: 'curcumin',
    pairs: [
      ['Inhibits NF-κB, COX-2', 'Inhibits [[nfkb_signaling]], [[arachidonic_acid_cascade]] COX-2'],
      ['Nrf2 activation', '[[keap1_nrf2_antioxidant_response]] Nrf2 activation'],
      ['(piperine inhibits glucuronidation)', '([[piperine]] inhibits glucuronidation)'],
    ],
  },
  {
    slug: 'quercetin',
    pairs: [
      ['NLRP3 inflammasome suppression', '[[nlrp3_inflammasome]] inflammasome suppression'],
      ['CD38 inhibitor — preserves cellular NAD⁺', 'CD38 inhibitor — preserves cellular [[nad-plus]] (see [[niacin_nad_synthesis]])'],
    ],
  },
  {
    slug: 'resveratrol',
    pairs: [
      ['Direct SIRT1 activator', 'Direct [[sirtuin_nad_signaling]] SIRT1 activator'],
      ['activates AMPK', 'activates [[ampk_signaling]]'],
      ['Commonly paired with NMN', 'Commonly paired with [[nmn]]'],
    ],
  },
  {
    slug: 'egcg',
    pairs: [
      ['COMT inhibitor (extends catecholamine action', 'COMT inhibitor (extends [[catecholamine_synthesis]] action'],
      ['rationale for combined fat-oxidation protocols with caffeine', 'rationale for combined fat-oxidation protocols with [[caffeine]]'],
    ],
  },
  {
    slug: 'folic-acid',
    pairs: [
      ['Reduced in vivo by DHFR to tetrahydrofolate', 'Reduced in vivo by DHFR to tetrahydrofolate (see [[folate_one_carbon]])'],
      ['rationale for methylfolate supplementation', 'rationale for [[methylfolate]] supplementation'],
    ],
  },
  {
    slug: 'methylfolate',
    pairs: [
      ['Active folate; methyl donor for homocysteine remethylation', 'Active folate (see [[folate_one_carbon]]); methyl donor for [[homocysteine]] remethylation'],
    ],
  },
  {
    slug: 'methylcobalamin',
    pairs: [
      ['remethylation of homocysteine → methionine', 'remethylation of [[homocysteine]] → [[methionine]] (see [[methionine_sam_cycle]])'],
      ['requires adenosylcobalamin', 'requires [[adenosylcobalamin]]'],
      ['head-to-head clinical superiority over cyanocobalamin', 'head-to-head clinical superiority over [[cyanocobalamin]]'],
    ],
  },
  {
    slug: 'pyridoxine',
    pairs: [
      ["Converted in liver to pyridoxal-5'-phosphate", "Converted in liver (see [[vitamin_b6_metabolism]]) to pyridoxal-5'-phosphate"],
      ['decarboxylases (GABA, dopamine, serotonin synthesis)', 'decarboxylases ([[gaba]], [[dopamine]], [[serotonin]] synthesis)'],
      ['δ-ALA synthase (heme)', 'δ-ALA synthase ([[heme_biosynthesis]])'],
      ['cystathionine β-synthase (homocysteine clearance)', 'cystathionine β-synthase ([[homocysteine]] clearance)'],
    ],
  },
];

function applyFirstOnly(src: string, find: string, repl: string): { out: string; hit: boolean } {
  const idx = src.indexOf(find);
  if (idx < 0) return { out: src, hit: false };
  return { out: src.slice(0, idx) + repl + src.slice(idx + find.length), hit: true };
}

function main(): void {
  const cs = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const ps = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Array<{ slug: string }>;

  const pathwaySlugs = new Set(ps.map(p => p.slug));
  const compoundSlugs = new Set(cs.map(c => c.slug));

  let totalHits = 0;
  let totalMisses = 0;
  const perCompound: Array<{ slug: string; hits: number; misses: number; unresolved: string[] }> = [];

  for (const rep of REPLACEMENTS) {
    const c = cs.find(x => x.slug === rep.slug);
    if (!c) {
      console.log(`  [skip] ${rep.slug} — not in registry`);
      continue;
    }
    let hits = 0;
    let misses = 0;
    const unresolvedHere: string[] = [];
    for (const [find, repl] of rep.pairs) {
      const fieldOrder: Array<'mechanism' | 'notes'> = ['mechanism', 'notes'];
      let applied = false;
      for (const field of fieldOrder) {
        const txt = c[field];
        if (typeof txt !== 'string') continue;
        const { out, hit } = applyFirstOnly(txt, find, repl);
        if (hit) {
          c[field] = out;
          applied = true;
          hits++;
          break;
        }
      }
      if (!applied) misses++;
      // Validate every marker emitted by `repl` resolves to a real slug.
      const markers = repl.match(/\[\[([a-z0-9][a-z0-9_-]*)\]\]/g) ?? [];
      for (const m of markers) {
        const slug = m.slice(2, -2);
        if (!pathwaySlugs.has(slug) && !compoundSlugs.has(slug)) {
          unresolvedHere.push(slug);
        }
      }
    }
    totalHits += hits;
    totalMisses += misses;
    perCompound.push({ slug: rep.slug, hits, misses, unresolved: unresolvedHere });
  }

  // Aggregate unresolved across all targets (de-duped). Surface them so
  // a typo or missing pathway slug doesn't ship as a literal [[xxx]].
  const allUnresolved = new Set<string>();
  for (const p of perCompound) for (const u of p.unresolved) allUnresolved.add(u);

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(cs, null, 2) + '\n');

  console.log('\nCompound cross-link pass:');
  for (const p of perCompound) {
    const tag = p.unresolved.length ? '⚠' : ' ';
    console.log(`  ${tag} ${p.slug.padEnd(22)} +${p.hits.toString().padStart(2)} hits · ${p.misses.toString().padStart(2)} miss${p.unresolved.length ? ` · UNRESOLVED: ${[...new Set(p.unresolved)].join(', ')}` : ''}`);
  }
  console.log(`\nTotals: ${totalHits} markers added · ${totalMisses} phrase-misses · ${allUnresolved.size} unresolved slug${allUnresolved.size === 1 ? '' : 's'}`);
  if (allUnresolved.size > 0) {
    console.log('Unresolved slugs (will render as literal [[xxx]] — investigate):');
    for (const u of [...allUnresolved].sort()) console.log(`  ✗ ${u}`);
  }
}

main();
