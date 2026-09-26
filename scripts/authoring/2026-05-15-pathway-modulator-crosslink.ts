/**
 * 2026-05-15-pathway-bdnf-trkb.ts — cross-pollinate new compounds onto
 * existing pathways.
 *
 * Today added 5 compounds (3 with PK, 2 research-only) that aren't yet
 * listed as modulators on any pathway except adaptogen_hpa_stress_modulation
 * (where ginsenoside-rg3 was already authored). Adds them to mechanism-
 * appropriate pathways so the registry's compound ↔ pathway graph is
 * complete after today's authoring.
 *
 * New compound → pathway additions:
 *
 *   withaferin-A (cytotoxic / anti-inflammatory withanolide, leaf-dominant):
 *     • nfkb_signaling                  — direct NF-κB inhibitor (well-cited)
 *     • ubiquitin_proteasome            — covalent inhibitor of select 26S subunits
 *     • apoptosis_bcl2_axis             — sensitizes to apoptosis in cancer cells
 *     • senescence_sasp_senolytics      — preclinical senolytic activity
 *     • pyroptosis_gasdermin            — NLRP3 inflammasome inhibition
 *     • adaptogen_hpa_stress_modulation — ashwagandha bioactive
 *
 *   withanolide-A (neurotrophic / anxiolytic withanolide, root-dominant):
 *     • bdnf_trkb_neurotrophic          — promotes neurite outgrowth
 *     • gaba_a_receptor_signaling       — GABA-A modulator
 *     • adaptogen_hpa_stress_modulation — ashwagandha bioactive
 *     • catecholamine_synthesis         — DA/NE modulation in preclinical
 *
 *   withanoside-IV (glycowithanolide; aglycone = withanolide-A):
 *     • bdnf_trkb_neurotrophic          — indirect via aglycone hydrolysis
 *
 *   sitoindoside-IX (glycowithanolide; immunomodulatory marker):
 *     • adaptogen_hpa_stress_modulation — anti-stress preclinical
 *
 *   ginsenoside-Rg3 (now has authored PK; cardioprotective + anti-cancer):
 *     • pi3k_akt_signaling              — PI3K-AKT axis inhibition
 *     • nfkb_signaling                  — anti-inflammatory
 *     • apoptosis_bcl2_axis             — promotes apoptosis in cancer
 *
 * Composite parent compounds (fish-oil, mct-oil, bcaa, green-tea-extract,
 * ashwagandha-{ksm66,sensoril,shoden}) are NOT added as pathway modulators —
 * the convention is that pathways list molecular chemicals, not labeled
 * products. The composite UX surfaces the product-level mapping on the
 * today page; pathways stay at the chemical level. Their constituents
 * (epa, dha, mct-c8, leucine, egcg, withaferin-A, withanolide-A) are or
 * will be the modulator entries instead.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Modulator {
  slug: string;
  effect: 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
  target?: string;
  note?: string;
}

interface Pathway {
  slug: string;
  modulators?: Modulator[];
  [k: string]: unknown;
}

type Addition = { pathway: string; modulator: Modulator };

const ADDITIONS: Addition[] = [
  // ── withaferin-A ────────────────────────────────────────────────
  { pathway: 'nfkb_signaling', modulator: {
      slug: 'withaferin-a', effect: 'inhibitor',
      target: 'IKKβ + p65 (covalent Michael acceptor)',
      note: 'Direct NF-κB inhibitor — binds and inhibits IKKβ kinase activity + alkylates p65 Cys38. The most-studied anti-inflammatory mechanism of ashwagandha leaf extracts (Sensoril enriched).',
  }},
  { pathway: 'ubiquitin_proteasome', modulator: {
      slug: 'withaferin-a', effect: 'inhibitor',
      target: '26S proteasome (covalent — Mitogen-1/Y/RPN13 subunits)',
      note: 'Cancer-context proteasome inhibition; preclinical synergy with bortezomib-class agents.',
  }},
  { pathway: 'apoptosis_bcl2_axis', modulator: {
      slug: 'withaferin-a', effect: 'activator',
      target: 'pro-apoptotic shift (↓Bcl-2 / Mcl-1, ↑Bax, mitochondrial pathway)',
      note: 'Sensitizes cancer cells to mitochondrial apoptosis; preclinical (no clinical anti-cancer indication).',
  }},
  { pathway: 'senescence_sasp_senolytics', modulator: {
      slug: 'withaferin-a', effect: 'inhibitor',
      target: 'SASP (NF-κB-driven cytokine cascade)',
      note: 'Preclinical senolytic activity in some senescent cell types — mechanism overlaps with anti-inflammatory NF-κB inhibition.',
  }},
  { pathway: 'pyroptosis_gasdermin', modulator: {
      slug: 'withaferin-a', effect: 'inhibitor',
      target: 'NLRP3 priming (NF-κB) → ↓pyroptosis',
      note: 'NLRP3 inflammasome inhibition via NF-κB priming block; preclinical in inflammatory disease models.',
  }},
  { pathway: 'adaptogen_hpa_stress_modulation', modulator: {
      slug: 'withaferin-a', effect: 'inhibitor',
      target: 'HPA cortisol (indirect, via anti-inflammatory + glucocorticoid axis modulation)',
      note: 'Dominant bioactive in Sensoril ashwagandha (leaf-enriched); contributes to the anti-stress profile of leaf-containing extracts.',
  }},

  // ── withanolide-A ───────────────────────────────────────────────
  { pathway: 'bdnf_trkb_neurotrophic', modulator: {
      slug: 'withanolide-a', effect: 'activator',
      target: 'BDNF / TrkB (preclinical neurite outgrowth)',
      note: 'Root-dominant withanolide; promotes neurite outgrowth + synaptic reconstruction in preclinical models. Mechanism for the KSM-66 cognitive / anxiolytic profile.',
  }},
  { pathway: 'gaba_a_receptor_signaling', modulator: {
      slug: 'withanolide-a', effect: 'activator',
      target: 'GABA-A (positive modulation)',
      note: 'Preclinical anxiolytic activity via GABA-A modulation; partially explains the ashwagandha anxiolytic signal.',
  }},
  { pathway: 'adaptogen_hpa_stress_modulation', modulator: {
      slug: 'withanolide-a', effect: 'inhibitor',
      target: 'HPA cortisol (via GABA-A + NF-κB pathways)',
      note: 'Root-enriched bioactive in KSM-66 standardized extracts; primary mediator of the cortisol-lowering effect of ashwagandha root.',
  }},
  { pathway: 'catecholamine_synthesis', modulator: {
      slug: 'withanolide-a', effect: 'modulator' as never, // will retry as 'activator' below
      target: 'DA / NE turnover (preclinical)',
      note: 'Modest DA/NE modulation in preclinical models.',
  }},

  // ── withanoside-IV ──────────────────────────────────────────────
  { pathway: 'bdnf_trkb_neurotrophic', modulator: {
      slug: 'withanoside-iv', effect: 'activator',
      target: 'BDNF / TrkB (indirect, via aglycone after gut hydrolysis)',
      note: 'Glycowithanolide; clinical effect mediated through hydrolysis to free withanolide-A by gut + hepatic glycosidases. Dominant glycowithanolide in Shoden-standardized extracts.',
  }},

  // ── sitoindoside-IX ─────────────────────────────────────────────
  { pathway: 'adaptogen_hpa_stress_modulation', modulator: {
      slug: 'sitoindoside-ix', effect: 'inhibitor',
      target: 'HPA cortisol (preclinical anti-stress)',
      note: 'Marker glycowithanolide; preclinical immunomodulatory + anti-stress activity. Most-studied of the sitoindoside class.',
  }},

  // ── ginsenoside-Rg3 ─────────────────────────────────────────────
  { pathway: 'pi3k_akt_signaling', modulator: {
      slug: 'ginsenoside-rg3', effect: 'inhibitor',
      target: 'PI3K / AKT (cancer-context anti-proliferative)',
      note: 'Anti-cancer mechanism in preclinical models; suppresses PI3K-AKT to reduce proliferation + angiogenesis.',
  }},
  { pathway: 'nfkb_signaling', modulator: {
      slug: 'ginsenoside-rg3', effect: 'inhibitor',
      target: 'NF-κB',
      note: 'Anti-inflammatory; contributes to cardiovascular benefit signal in Asian ginseng preparations.',
  }},
  { pathway: 'apoptosis_bcl2_axis', modulator: {
      slug: 'ginsenoside-rg3', effect: 'activator',
      target: 'pro-apoptotic shift (cancer-cell selective)',
      note: 'Promotes apoptosis in cancer cells via mitochondrial pathway; preclinical anti-cancer signal.',
  }},
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));

  let added = 0;
  let skipped = 0;
  let missing = 0;
  for (const a of ADDITIONS) {
    const p = bySlug.get(a.pathway);
    if (!p) {
      console.warn(`  [warn] missing pathway: ${a.pathway}`);
      missing++;
      continue;
    }
    p.modulators = p.modulators ?? [];
    // Dedup — silently skip if already there for this slug.
    if (p.modulators.some(m => m.slug === a.modulator.slug)) {
      console.log(`  [skip] ${a.pathway} already lists ${a.modulator.slug}`);
      skipped++;
      continue;
    }
    // Cast away the temporary 'modulator' effect on withanolide-a /
    // catecholamine_synthesis (schema only accepts the 4-enum).
    const eff = (a.modulator.effect as string);
    const valid = (['inhibitor', 'activator', 'substrate', 'cofactor'] as const);
    const final: Modulator = {
      ...a.modulator,
      effect: (valid as readonly string[]).includes(eff) ? a.modulator.effect : 'activator',
    };
    p.modulators.push(final);
    added++;
    console.log(`  [add ] ${a.pathway.padEnd(38)} ← ${a.modulator.slug} (${final.effect})`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nModulator additions: added ${added}, skipped ${skipped}, missing ${missing}`);
}

main();
