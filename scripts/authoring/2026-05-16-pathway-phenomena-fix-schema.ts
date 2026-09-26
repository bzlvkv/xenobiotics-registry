/**
 * One-shot schema-fixup for the 10 phenomenon pathways added on
 * 2026-05-16. Two registry-validation failures surfaced after the
 * initial insert:
 *
 *   - `systems` enum: I used 'immune', 'urinary', 'gi'. Valid values
 *     are 'immune-hematologic', 'renal', 'digestive'.
 *   - `steps.via` max-length 120 chars: ~50 strings exceeded.
 *
 * This script rewrites systems[] and steps[].via in place to pass
 * the loader.ts zod schema in @xeno/registry. PMIDs unchanged.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SYSTEM_FIX: Record<string, string[]> = {
  niacin_gpr109a_skin_flush: ['integumentary', 'immune-hematologic'],
  riboflavin_renal_excretion_color: ['renal', 'digestive'],
  glp1_central_appetite_food_noise: ['endocrine', 'digestive', 'nervous'],
  carbonic_anhydrase_paresthesia: ['nervous', 'renal'],
};

const VIA_FIX: Record<string, string[]> = {
  niacin_gpr109a_skin_flush: [
    'niacin binds Gi-coupled HCA2 / GPR109A / HM74A on Langerhans cells + keratinocytes (Tunaru 2003)',
    'Gi/o βγ → PLA2 activation → arachidonic acid mobilization from membrane phospholipids',
    'arachidonic acid → COX-1 (Langerhans) / COX-2 (keratinocytes) → PGH2 → PGD2 synthase; aspirin blunts this step',
    'paracrine PGD2 → Gs-coupled DP1 on cutaneous arterioles → ↑cAMP → vasodilation',
    'DP1-mediated arteriolar dilation of face/neck/upper trunk; laropiprant (DP1 antagonist) specifically blocks flush',
  ],
  caffeine_a1_cardiac_ectopy: [
    'competitive antagonism at A1 (cardiac nodal) and A2A (vascular + cortical) at intake-relevant concentrations',
    'A1 normally slows SA pacemaking + AV conduction via Gi → ↓cAMP → ↓If, ↓ICa-L (mirror of IV adenosine in SVT)',
    'central A1 antagonism + peripheral sympathetic outflow rise → mild β1 stimulation → ↑pacemaker automaticity',
    'CRAVE trial day-on/day-off: coffee days had more PVCs; atrial ectopy direction less consistent (Marcus 2023)',
    'conscious detection of post-ectopic compensatory pause + stronger contraction; benign in normal hearts',
  ],
  riboflavin_renal_excretion_color: [
    'apical enterocyte RFVT3 / RFVT1 / RFVT2 — facilitated transport, saturable at ~27 mg single dose (Zempleni 1996)',
    'absorbed riboflavin → FMN via riboflavin kinase → FAD; tissue holocoenzyme pools fill at ~1.3-1.6 mg/d',
    'beyond tissue-storage requirement, free riboflavin accumulates in plasma — basis of saturation kinetics',
    'low MW (376 Da), water-soluble, minimal protein binding → freely filtered; renal RFVT2/3 reabsorb to a ceiling',
    'isoalloxazine ring fluoresces (peak ~525 nm) → bright yellow-green urine 1-2 h post-dose, fades by 4-6 h',
  ],
  glp1_central_appetite_food_noise: [
    'GLP-1R on hypothalamic POMC/AgRP, NTS, β cells, gastric smooth muscle; long t½ via albumin binding',
    'peripheral Gs → ↑cAMP slows gastric emptying (→ early fullness + sulfur burps); β-cell glucose-dependent insulin',
    'central GLP-1R on arcuate POMC → α-MSH release → MC4R activation; concurrent AgRP suppression',
    'reward-circuit dampening — fMRI shows NAc / VTA / OFC ↓ activation to palatable food cues (van Bloemendaal 2014)',
    'STEP 1: semaglutide 14.9% loss at 68 wk; SURMOUNT-1: tirzepatide 20.9% at 72 wk; food-noise precedes weight loss',
  ],
  pde5_pde6_blue_tint_vision: [
    'PDE5 inhibition drives erectogenic effect; PDE6 is closest homolog and cross-inhibited (sildenafil selectivity ~10×)',
    'PDE6 is the phototransduction PDE; partial inhibition raises baseline cGMP and delays dark-current recovery',
    'cGMP-gated cation channel remains partially open longer; greatest spectral effect on S-cones (blue), least on red',
    'cyanopsia perceived during Tmax (~1 h); Jagle 2004 documented dose-dependent transient color-discrimination shift',
    'fully reversible PK-driven phenomenon; Laties 2009 review found no permanent visual change; RP patients should avoid',
  ],
  ssri_discontinuation_brain_zaps: [
    'chronic SSRI → SERT occupancy ~80% therapeutic → adaptive ↓5-HT1A autoreceptors + ↓5-HT2A postsynaptic over weeks',
    'half-life dictates fall: paroxetine/venlafaxine ~21 h; fluoxetine effective t½ 7-15 d self-tapers (Haddad 1997)',
    'cholinergic rebound + glutamatergic disinhibition hypothesized; mechanism remains incomplete (Black 2000)',
    'oculomotor coupling — saccades trigger zaps; proposed brief cortical event linked to brainstem GABA/5-HT shift',
    'remits as receptors re-equilibrate; mitigation = hyperbolic taper or fluoxetine bridge; ~56% incidence (Davies 2019)',
  ],
  carbonic_anhydrase_paresthesia: [
    'sulfamate group binds zinc active site of CA; topiramate inhibits more isoforms than acetazolamide (Dodgson 2000)',
    'CA IV (apical) + CA II (cytosolic) normally regenerate HCO3⁻; inhibition → urinary HCO3⁻ loss → mild acidosis',
    'plasma HCO3⁻ falls 2-4 mEq/L; acidosis perturbs Ca²⁺ binding to albumin; Schwann pH micro-environment disrupted',
    'Schwann CA II/IV inhibition perturbs nodal pH + Ca²⁺ shifts → low-threshold afferent firing in long fibers',
    'dose-dependent; topiramate incidence 30-50%; attenuates by weeks 4-8; severe cases respond to KHCO3 / citrate',
  ],
  melatonin_rem_rebound_grogginess: [
    'Gi/Gq-coupled GPCRs — MT1 sleep-promoting (↓SCN firing); MT2 phase-shifting (Brzezinski 1997)',
    'PRC: evening melatonin advances, morning delays; 0.5 vs 3.0 mg comparable phase-shift magnitude (Burgess 2010)',
    'MT2 in pontine REM generators consolidates REM bouts; reduced fragmentation → more uninterrupted REM cycles',
    'more total REM + later-night REM overlapping waking transition; dose-dependent — worse at 3-10 mg vs 0.3 mg',
    'high-OTC doses (3-10 mg) push plasma 10-100× physiologic; persists into morning → grogginess (Zhdanova 2001)',
  ],
  creatine_intracellular_water_pump: [
    'CRT1 cotransports 2 Na+ + 1 Cl⁻ + 1 creatine; rate-limiting for muscle creatine pool; insulin upregulates CRT1',
    'cytosolic creatine kinase phosphorylates creatine to PCr; loading 20 g/d × 5-7 d raises muscle total Cr ~20%',
    'creatine + PCr osmotically active (~120-160 mmol/L after loading); aquaporin-mediated water shift across sarcolemma',
    'Powers 2003: TBW + ICW rise; ICW:ECW ratio preserved; characteristic 1-3 kg scale jump — fluid, not fat or protein',
    'persistent pumped feel, rounder muscle bellies, firmer at rest; saturates at plateau; non-responders ~20-30%',
  ],
  minoxidil_anagen_synchronization: [
    'outer root sheath SULT1A1 converts minoxidil → minoxidil sulfate (active); 20-30× inter-individual activity variance',
    'minoxidil sulfate opens K-ATP → hyperpolarization → ↑VEGF, PGE2 release, dermal papilla β-catenin (Messenger 2004)',
    'follicle cycle re-synchronization — many follicles pushed late-telogen → anagen simultaneously (Buhl 1989)',
    'the falling hairs are the old miniaturized telogen hairs being displaced by new anagen; reversible but alarming',
    'dose-response in Olsen 1986 (topical, MPB); oral 0.25-5 mg shows similar phenomenology; shed is a positive sign',
  ],
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Array<{
    slug: string;
    systems?: string[];
    steps?: Array<{ via?: string }>;
  }>;
  let systemEdits = 0;
  let viaEdits = 0;
  let overrun = 0;

  for (const p of data) {
    if (SYSTEM_FIX[p.slug]) {
      p.systems = SYSTEM_FIX[p.slug];
      systemEdits++;
    }
    if (VIA_FIX[p.slug] && p.steps) {
      const vias = VIA_FIX[p.slug];
      p.steps.forEach((st, i) => {
        if (vias[i] && st.via !== vias[i]) {
          st.via = vias[i];
          viaEdits++;
        }
        if (st.via && st.via.length > 120) {
          console.error(`STILL TOO LONG: ${p.slug}.steps[${i}].via len=${st.via.length}`);
          overrun++;
        }
      });
    }
  }

  if (overrun > 0) {
    console.error(`ABORTING: ${overrun} via strings still over 120 chars`);
    process.exit(1);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`System enum fixes: ${systemEdits}`);
  console.log(`Via shortening fixes: ${viaEdits}`);
}

main();
