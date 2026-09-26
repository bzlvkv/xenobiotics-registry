/**
 * 2026-05-12-wave-close-cluster.ts — Closure cluster (CLOSE-1..5).
 *
 * Final wave. Closes the remaining 261 orphan compounds across the 17
 * categories left. Mostly modulator extensions to existing pathways with
 * a few new pathways for clusters that lacked a home (SARMs, atypical
 * antidepressants, skeletal muscle relaxants, vitamin antioxidants).
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
    slug: 'sarm_androgen_modulation',
    name: 'Selective androgen receptor modulators (SARMs)',
    category: 'signaling',
    systems: ['endocrine', 'musculoskeletal'],
    description: `SARMs are non-steroidal small-molecule AR ligands designed to dissociate anabolic effects in muscle + bone from androgenic effects in prostate + sebaceous glands + scalp. Mechanism: tissue-specific coactivator/corepressor recruitment to ligand-bound AR — analogous to SERMs at ER. Phase I-II clinical data show muscle mass + bone density gains, but every late-stage trial has failed (cardiovascular signal, hepatotoxicity, fertility suppression). All SARMs in this pathway are research-only — none are FDA-approved despite open supplement-market distribution as "lifestyle" hormone modulators. WADA + military prohibited. Sometimes-confused-with: bicalutamide / enzalutamide (covered in aromatase_androgen_receptor_axis) are AR antagonists for prostate cancer — opposite mechanism.`,
    steps: [
      { from: 'sarm-binding', to: 'tissue-selective-ar-activation', via: 'AR ligand binding → tissue-specific coactivator recruitment (no enzymatic conversion to DHT or aromatization)' },
    ],
    modulators: [
      { slug: 'lgd-4033', effect: 'activator', target: 'AR (anabolic-selective, oral)', note: 'ligandrol; most-distributed SARM; phase I data on muscle/bone; suppresses HPG; not FDA-approved' },
      { slug: 'ostarine', effect: 'activator', target: 'AR (anabolic-selective)', note: 'MK-2866 enobosarm; failed phase 3 cancer cachexia trial; widely abused; WADA-banned' },
      { slug: 'rad-140', effect: 'activator', target: 'AR (anabolic, neuroprotective claim)', note: 'testolone; potent AR agonist; hepatotoxicity reports; not approved' },
      { slug: 'yk-11', effect: 'activator', target: 'AR + myostatin pathway modulation', note: 'unique SARM with myostatin-inhibitor claim; structurally a 5α-DHT analog' },
      { slug: 's-23', effect: 'activator', target: 'AR (anabolic with male contraceptive claim)', note: 'reversibly suppresses spermatogenesis in animals; not human-tested' },
      { slug: 'andarine', effect: 'activator', target: 'AR (anabolic-selective)', note: 'S-4; original SARM; vision side effect (yellow tint) at higher doses' },
      { slug: 'cardarine', effect: 'activator', target: 'PPAR-δ (not actually AR — misclassified as SARM)', note: 'GW501516; PPAR-δ agonist; halted for carcinogenicity in 5/6 organs in rodent studies' },
      { slug: 'stenabolic', effect: 'activator', target: 'Rev-erb-α (not AR — circadian)', note: 'SR9009; Rev-erb agonist; metabolic + circadian effects; not actually a SARM but bundled with them in research-supplement market' },
      { slug: 'lgd-3303', effect: 'activator', target: 'AR (anabolic with osteoporosis claim)', note: 'related to LGD-4033; less-studied; research-only' },
      { slug: 'acp-105', effect: 'activator', target: 'AR (anabolic, lower androgenic ratio)', note: 'research SARM' },
      { slug: 'rad-150', effect: 'activator', target: 'AR (TLB-150, testolone ester)', note: 'testolone ester research compound' },
    ],
    refs: [],
  },
  {
    slug: 'skeletal_muscle_relaxants',
    name: 'Skeletal muscle relaxants (centrally-acting + dantrolene + tizanidine)',
    category: 'signaling',
    systems: ['musculoskeletal', 'nervous'],
    description: `Skeletal muscle relaxants split by mechanism. Centrally-acting (act on spinal cord + brainstem to reduce reflex spasm + spasticity): cyclobenzaprine (TCA-related, 5-HT2 antagonism + central anticholinergic), methocarbamol (mechanism unclear, possibly central depressant via NMDA or carbamate effects), carisoprodol (prodrug → meprobamate, GABA-A allosteric — abuse potential), orphenadrine (NMDA + H1 + muscarinic antagonist — also covered in CNS-4), tizanidine (α2-adrenergic agonist, similar to clonidine — covered conceptually in adrenergic but distinct indication), baclofen (GABA-B agonist — covered in gaba_a_receptor_signaling). Direct-acting on muscle: dantrolene blocks RYR1 → reduces Ca²⁺ release from SR → malignant hyperthermia antidote + chronic spasticity (MS, SCI).`,
    steps: [
      { from: 'spinal-reflex-arc', to: 'reduced-muscle-tone', via: 'central depressant action OR direct ryanodine receptor block (dantrolene)' },
    ],
    modulators: [
      { slug: 'cyclobenzaprine', effect: 'inhibitor', target: '5-HT2 antagonist + central anticholinergic (TCA structure)', note: 'acute musculoskeletal pain; sedating; serotonin-syndrome risk with SSRIs (sometimes overlooked)' },
      { slug: 'methocarbamol', effect: 'inhibitor', target: 'central depressant (mechanism not well established)', note: 'carbamate; widely available OTC in some countries; weaker than other MR' },
      { slug: 'carisoprodol', effect: 'activator', target: 'GABA-A allosteric (via meprobamate metabolite)', note: 'Soma; prodrug → meprobamate; abuse + dependence; Schedule IV; restricted use' },
      { slug: 'tizanidine', effect: 'activator', target: 'α2-adrenergic (central)', note: 'spasticity in MS + SCI; sedation + hypotension shared with clonidine; CYP1A2 substrate (fluvoxamine + ciprofloxacin DDIs — 20× AUC)' },
      { slug: 'dantrolene', effect: 'inhibitor', target: 'RYR1 (ryanodine receptor)', note: 'malignant hyperthermia first-line antidote (IV) + chronic spasticity (PO); hepatotoxicity at chronic high doses' },
    ],
    refs: [],
  },
  {
    slug: 'tricyclic_atypical_antidepressants',
    name: 'Tricyclic + atypical antidepressants',
    category: 'signaling',
    systems: ['nervous'],
    description: `Antidepressant classes outside the SSRI / SNRI / MAOI groupings. TCAs (tricyclic antidepressants — amitriptyline, nortriptyline, imipramine, desipramine, clomipramine, doxepin) inhibit both SERT + NET (varying ratios) plus block H1 + muscarinic + α1 (the "dirty" pharmacology that drives sedation + dry mouth + orthostasis). Therapeutic-index narrow: lethal in overdose (Na+-channel block + QT prolongation + anticholinergic toxidrome). Atypicals: mirtazapine (α2 + 5-HT2A/2C + H1 antagonist — sedation + appetite); bupropion (NRI + DRI — smoking cessation + ADHD); vilazodone (SERT + 5-HT1A partial); vortioxetine (covered in serotonin); agomelatine (MT1/MT2 agonist + 5-HT2C antagonist — EU only); trazodone (SARI — 5-HT2A antagonist + α1 + H1 — sleep aid at low doses, antidepressant at high); dapoxetine (short-acting SSRI for PE only).`,
    steps: [
      { from: 'monoamine-reuptake-blockade-or-receptor-modulation', to: 'synaptic-monoamine-elevation', via: 'mixed SERT/NET inhibition + receptor antagonism — multi-target profile' },
    ],
    modulators: [
      { slug: 'amitriptyline', effect: 'inhibitor', target: 'SERT + NET + H1 + M1 + α1 + Na channel', note: 'sedating TCA; chronic pain + migraine prophylaxis + insomnia at low doses; depression at high; overdose-lethal narrow TI' },
      { slug: 'nortriptyline', effect: 'inhibitor', target: 'NET > SERT + H1/M1/α1', note: 'amitriptyline\'s active metabolite; cleaner profile than parent; lower anticholinergic load; therapeutic drug monitoring' },
      { slug: 'imipramine', effect: 'inhibitor', target: 'SERT + NET + H1 + M1', note: 'first TCA (1957); depression + childhood enuresis (peripheral anticholinergic on bladder)' },
      { slug: 'desipramine', effect: 'inhibitor', target: 'NET > SERT', note: 'imipramine\'s NE-selective metabolite; cleanest TCA profile; ADHD + neuropathic pain off-label; CYP2D6 substrate (DDI authored — quinidine/terbinafine)' },
      { slug: 'clomipramine', effect: 'inhibitor', target: 'SERT > NET (most serotonergic TCA)', note: 'OCD; SSRI-like serotonergic activity; canine OCD label (Clomicalm)' },
      { slug: 'doxepin', effect: 'inhibitor', target: 'SERT + H1 (potent) + NET + α1', note: 'antidepressant + chronic urticaria + insomnia at low dose (3-6 mg Silenor — H1 antagonism); CYP2D6 substrate' },
      { slug: 'doxepin-low-dose', effect: 'inhibitor', target: 'H1 (selective at low dose)', note: 'Silenor 3-6 mg insomnia; pure H1 antagonist at this dose; no anticholinergic side effects' },
      { slug: 'mirtazapine', effect: 'inhibitor', target: 'α2 + 5-HT2A/2C + 5-HT3 + H1', note: 'tetracyclic; sedation + appetite stimulation; minimal sexual side effects vs SSRIs; weight gain' },
      { slug: 'bupropion', effect: 'inhibitor', target: 'NET + DAT (NDRI)', note: 'NDRI; depression + smoking cessation (Zyban) + ADHD off-label; minimal sexual side effects; seizure risk at high doses (eating disorders contraindicated)' },
      { slug: 'vilazodone', effect: 'inhibitor', target: 'SERT + 5-HT1A partial agonist (SPARI)', note: 'serotonin partial-agonist reuptake inhibitor; modest GI side effects; lower sexual side effects vs SSRIs' },
      { slug: 'agomelatine', effect: 'activator', target: 'MT1 + MT2 + 5-HT2C antagonist', note: 'EU-only antidepressant (Valdoxan); melatonin + serotonin hybrid; LFT monitoring (hepatotoxicity)' },
      { slug: 'trazodone', effect: 'inhibitor', target: 'SARI — 5-HT2A + α1 + H1', note: 'antidepressant high-dose; sleep aid low-dose (50-100 mg); priapism rare (α1 mechanism)' },
      { slug: 'dapoxetine', effect: 'inhibitor', target: 'SERT (short-acting)', note: 'on-demand SSRI for premature ejaculation; t½ ~1h prevents chronic antidepressant exposure' },
      { slug: 'desvenlafaxine', effect: 'inhibitor', target: 'SERT + NET (venlafaxine\'s active metabolite)', note: 'pre-formed active metabolite of venlafaxine; cleaner CYP2D6 dependence' },
      { slug: 'tranylcypromine', effect: 'inhibitor', target: 'MAO-A + MAO-B (irreversible non-selective)', note: 'irreversible MAOI; treatment-resistant depression; tyramine + serotonergic DDI risk → dietary restrictions' },
      { slug: 'moclobemide', effect: 'inhibitor', target: 'MAO-A (reversible, RIMA)', note: 'reversible MAO-A inhibitor; cleaner DDI profile; tyramine reaction much less prominent; not FDA-approved (EU/Canada Rx)' },
      { slug: 'methylene-blue', effect: 'inhibitor', target: 'MAO-A inhibitor + guanylate cyclase + electron donor', note: 'IV methemoglobinemia rescue + ifosfamide-encephalopathy + cyanide; serotonin-syndrome with SSRIs (MAOI activity)' },
      { slug: 'viloxazine', effect: 'inhibitor', target: 'NRI (Qelbree, non-stimulant ADHD)', note: 'NRI ADHD; less hepatotoxicity than atomoxetine; CYP1A2 inhibitor' },
      { slug: 'lurasidone', effect: 'inhibitor', target: '5-HT2A + D2 antagonist (atypical AP)', note: 'atypical AP for schizophrenia + bipolar depression; food requirement (>350 cal) for absorption; minimal weight gain' },
    ],
    refs: [],
  },
  {
    slug: 'vitamin_antioxidant_status',
    name: 'Vitamin antioxidant axis (vitamin E + C + carotenoids)',
    category: 'biosynthesis',
    systems: ['integumentary', 'cardiovascular'],
    description: `Vitamins A, C, E + carotenoids serve as the body's "non-enzymatic" antioxidant system, complementing the enzymatic antioxidants (SOD, catalase, GPx — covered in ros_oxidative_stress). Vitamin E is a lipid-soluble chain-breaking antioxidant for polyunsaturated membrane lipids — α-tocopherol is the major preserved form (selective hepatic α-TTP). Tocotrienols (rarer in diet) have unique lipid-membrane mobility. Vitamin C is water-soluble — regenerates oxidized α-tocopheryl radical back to active α-tocopherol, plus is collagen-synthesis cofactor (proline + lysine hydroxylase). Carotenoids (lycopene, β-carotene, lutein, zeaxanthin, astaxanthin) are conjugated-polyene singlet-oxygen quenchers; lutein + zeaxanthin specifically accumulate in macular pigment (AREDS2 trial supplementation for AMD).`,
    steps: [
      { from: 'lipid-peroxyl-radical', to: 'tocopheryl-radical', via: 'α-tocopherol scavenges peroxyl → α-tocopheryl radical' },
      { from: 'tocopheryl-radical', to: 'alpha-tocopherol', via: 'vitamin C (or coenzyme Q / glutathione) reduces tocopheryl radical back to active form' },
    ],
    modulators: [
      { slug: 'alpha-tocopherol', effect: 'activator', target: 'lipid peroxyl radical scavenger', note: 'preferred vitamin E form (hepatic α-TTP selection); RRR-α-tocopherol natural > synthetic; ATBC + SELECT trial null/harm for cancer prevention' },
      { slug: 'tocotrienols', effect: 'activator', target: 'lipid peroxyl radical + Ras inhibition', note: 'tocotrienol family (α/β/γ/δ-T3); cardiovascular + neuroprotection claims; less hepatic accumulation than tocopherols' },
      { slug: 'mixed-tocopherols', effect: 'activator', target: 'broad-form vitamin E (α/β/γ/δ-tocopherols)', note: 'full-spectrum vitamin E; γ-tocopherol has unique inflammation-modulating effect; preferred over α-only' },
      { slug: 'gamma-tocopherol', effect: 'activator', target: 'reactive nitrogen species scavenger + α-tocopherol-complementary', note: 'specific γ-T form; binds RNS that α-tocopherol misses; competition with α-tocopherol for α-TTP' },
      { slug: 'tocopheryl-acetate', effect: 'activator', target: 'esterified vitamin E (hydrolyzed to free tocopherol)', note: 'common supplement + topical form; stable to oxidation; esterase activation' },
      { slug: 'ascorbic-acid', effect: 'activator', target: 'water-soluble antioxidant + collagen hydroxylase cofactor', note: 'vitamin C; collagen synthesis (proline + lysine hydroxylase Fe²⁺ cofactor); IV megadose for sepsis (debated)' },
      { slug: 'lutein', effect: 'activator', target: 'macular pigment + singlet oxygen quencher', note: 'carotenoid; AREDS2 supplementation for AMD; concentrated in macula + brain' },
      { slug: 'zeaxanthin', effect: 'activator', target: 'macular pigment', note: 'carotenoid; macular xanthophyll partner with lutein; AREDS2' },
      { slug: 'astaxanthin', effect: 'activator', target: 'singlet oxygen quencher + Nrf2', note: 'red carotenoid (salmon/algae); strong antioxidant; supplemented for skin + eye + cardiovascular claims' },
      { slug: 'lycopene', effect: 'activator', target: 'singlet oxygen quencher (most potent natural)', note: 'red carotenoid from tomatoes; epidemiologic prostate-cancer signal; RCTs mixed' },
    ],
    refs: [],
  },
  {
    slug: 'nucleoside_purine_pyrimidine_supplementation',
    name: 'Nucleoside / nucleotide supplementation',
    category: 'biosynthesis',
    systems: ['nervous', 'musculoskeletal'],
    description: `Nucleosides + nucleotides as dietary supplements rather than de novo synthesis substrates. CDP-choline (citicoline) — provides cytidine + choline; stroke recovery + cognitive enhancement; raises both phosphatidylcholine + acetylcholine biosynthesis. Uridine — converted to UMP/UDP/UTP; precursor for membrane phosphatidylcholine via Kennedy pathway; bipolar + sleep claims. NAD-precursor stack: NMN (nicotinamide mononucleotide), NR (nicotinamide riboside), NAAD, NaMN — bypass the rate-limiting NAMPT step; longevity + mitochondrial health claims; oral PK + tissue NAD+ elevation under active research. Inosine — degraded to uric acid; gout precursor + claimed performance enhancer (debated). Adenosine + adenosine-cousins (cordycepin = 3'-deoxyadenosine — covered in mushroom pathway).`,
    steps: [
      { from: 'dietary-nucleoside', to: 'cellular-nucleotide-pool', via: 'salvage pathway phosphorylation; CDP-choline directly provides Kennedy-pathway intermediate' },
    ],
    modulators: [
      { slug: 'cdp-choline', effect: 'substrate', target: 'phosphatidylcholine + acetylcholine biosynthesis', note: 'citicoline; stroke recovery + cognitive enhancement; raises CNS PC + ACh in chronic dosing' },
      { slug: 'uridine', effect: 'substrate', target: 'UMP pool + Kennedy pathway PC synthesis', note: 'OTC; mood + cognitive claims; converts to UMP via uridine kinase' },
      { slug: 'cytidine', effect: 'substrate', target: 'CMP pool + DNA/RNA precursor', note: 'pyrimidine nucleoside; complements uridine; cellular nucleotide salvage' },
      { slug: 'guanosine', effect: 'substrate', target: 'GMP pool + purine salvage', note: 'purine nucleoside; gout precursor risk at high doses' },
      { slug: 'inosine', effect: 'substrate', target: 'hypoxanthine + xanthine + urate (degraded)', note: 'OTC; performance/MS claims; degrades to urate → gout risk' },
      { slug: 'thymidine', effect: 'substrate', target: 'TMP/dTTP pool (DNA replication)', note: 'rare supplement; salvage pathway substrate' },
      { slug: 'naad', effect: 'substrate', target: 'NAD biosynthesis (de novo)', note: 'NaAD — NaMN → NAAD → NAD pathway intermediate; lab/research reagent' },
      { slug: 'nad-plus', effect: 'substrate', target: 'direct NAD+ replacement (poor oral PK)', note: 'NAD+ oral has minimal bioavailability — IV NAD+ infusions widely marketed despite limited efficacy data' },
      { slug: 'namn', effect: 'substrate', target: 'NAD biosynthesis (de novo, NaMN)', note: 'nicotinic acid mononucleotide; de novo pathway intermediate' },
    ],
    refs: [],
  },
];

// ─────────────────────────────────────────────────────────────────────
// Modulator extensions to existing pathways
// ─────────────────────────────────────────────────────────────────────

const EXTENSIONS: Record<string, PathwayModulator[]> = {
  // Vitamin pathways
  vitamin_b6_metabolism: [
    { slug: 'p5p', effect: 'cofactor', target: 'pyridoxal-5-phosphate (active B6 form)', note: 'P5P; active coenzyme form; preferred over pyridoxine in B6-deficient + transaminase reactions' },
  ],
  vitamin_b12_metabolism: [
    { slug: 'cyanocobalamin', effect: 'substrate', target: 'B12 (cyanide-stabilized synthetic)', note: 'most common supplement form; converted to methyl/adeno-cobalamin in tissues' },
    { slug: 'hydroxocobalamin', effect: 'substrate', target: 'B12 (hydroxy form)', note: 'IM B12; cyanide antidote (forms cyanocobalamin); preferred for elderly with low B12' },
    { slug: 'vitamin-b12-methylcobalamin', effect: 'substrate', target: 'B12 (methyl form — direct active)', note: 'active form; SAM methyl donor; preferred for methylation-pathway support' },
  ],
  vitamin_d_metabolism: [
    { slug: 'calcifediol', effect: 'substrate', target: '25-hydroxy-vitamin-D (intermediate)', note: '25(OH)D3; bypasses hepatic first hydroxylation; rapid 25-OH-D rise' },
    { slug: 'ergocalciferol', effect: 'substrate', target: 'vitamin D2 (plant/yeast-derived)', note: 'vitamin D2; lower 25(OH)D-raising efficiency than D3' },
  ],
  vitamin_k_cycle: [
    { slug: 'menadione', effect: 'substrate', target: 'vitamin K3 (synthetic, hemolysis risk)', note: 'synthetic K3; pediatric hemolysis risk → no longer used clinically; veterinary use' },
    { slug: 'mk4', effect: 'substrate', target: 'menaquinone-4 (vitamin K2)', note: 'short-chain MK; conversion product of K1 + supplemented form; osteocalcin γ-carboxylation' },
    { slug: 'mk7', effect: 'substrate', target: 'menaquinone-7 (long-chain K2)', note: 'long-chain MK from natto; longer t½ than MK-4; cardiovascular + bone supplementation' },
    { slug: 'vitamin-k2-mk7', effect: 'substrate', target: 'MK-7 alias', note: 'same compound as mk7 — naming variant' },
  ],
  folate_one_carbon: [
    { slug: 'methylfolate', effect: 'substrate', target: '5-methylTHF (bypasses MTHFR)', note: 'L-methylfolate; bypasses MTHFR polymorphism; depression + cardiovascular claims' },
  ],
  thiamine_metabolism: [
    { slug: 'riboflavin', effect: 'cofactor', target: 'vitamin B2 (FMN/FAD precursor)', note: 'B2; FMN + FAD coenzyme precursor; migraine prophylaxis 400 mg/d' },
    { slug: 'benfotiamine', effect: 'substrate', target: 'thiamine (S-acyl prodrug, fat-soluble)', note: 'lipophilic B1 prodrug; better tissue penetration; diabetic neuropathy supplementation' },
    { slug: 'sulbutiamine', effect: 'substrate', target: 'lipophilic B1 prodrug (CNS-penetrant)', note: 'dimerized lipophilic thiamine; cognitive/asthenia indication in some markets (not US)' },
    { slug: 'r5p', effect: 'cofactor', target: 'riboflavin-5-phosphate (active FMN)', note: 'active phosphorylated B2 form' },
  ],
  niacin_nad_synthesis: [
    { slug: 'pantethine', effect: 'substrate', target: 'pantothenic acid precursor (CoA synthesis)', note: 'B5 derivative; CoA precursor; lipid + adrenal support claims' },
    { slug: 'pantothenic-acid', effect: 'substrate', target: 'B5 (CoA precursor)', note: 'vitamin B5; CoA + acyl carrier protein; food-supplement use' },
  ],

  // Amino acid pathways
  urea_cycle: [
    { slug: 'arginine', effect: 'substrate', target: 'urea cycle + NO precursor', note: 'L-arginine; substrate for NOS → NO + ornithine; supplementation for vascular health (modest)' },
    { slug: 'l-citrulline', effect: 'substrate', target: 'urea cycle intermediate → arginine', note: 'L-citrulline; bypasses arginine GI metabolism → more bioavailable arginine elevation' },
    { slug: 'ornithine', effect: 'substrate', target: 'urea cycle (arginase product)', note: 'L-ornithine; ammonia handling claims; OKG (ornithine-α-ketoglutarate) form for ICU nutrition' },
  ],
  glutamate_glutamine_cycle: [
    { slug: 'l-glutamine', effect: 'substrate', target: 'glutamine pool (gut enterocyte fuel + nitrogen carrier)', note: 'L-glutamine; gut + immune cell fuel; supplementation for intestinal recovery + sickle cell (Endari)' },
    { slug: 'theanine', effect: 'inhibitor', target: 'glutamate receptor partial antagonist + GABA elevation', note: 'L-theanine; tea-derived amino acid; relaxation without sedation; complements caffeine' },
  ],
  bcaa_metabolism: [
    { slug: 'hmb', effect: 'substrate', target: 'leucine metabolite (β-hydroxy-β-methylbutyrate)', note: 'leucine catabolite; anti-catabolic claim; muscle preservation in aging + cancer cachexia' },
  ],
  glycine_serine_threonine_metabolism: [
    { slug: 'alanine', effect: 'substrate', target: 'alanine pool', note: 'glucose-alanine cycle substrate; gluconeogenic AA' },
    { slug: 'asparagine', effect: 'substrate', target: 'asparagine pool' },
    { slug: 'aspartate', effect: 'substrate', target: 'aspartate pool + urea cycle entry' },
    { slug: 'beta-alanine', effect: 'substrate', target: 'carnosine synthesis precursor', note: 'rate-limiting for carnosine; supplementation raises muscle carnosine → buffer for anaerobic; paresthesias' },
    { slug: 'histidine', effect: 'substrate', target: 'histidine pool + histamine precursor' },
    { slug: 'hydroxyproline', effect: 'substrate', target: 'hydroxyproline (collagen marker)', note: 'collagen-derived; collagen-supplement signaling molecule' },
    { slug: 'proline', effect: 'substrate', target: 'collagen building block' },
    { slug: 'd-aspartic-acid', effect: 'substrate', target: 'NMDA agonist + LH release claim', note: 'D-AA; testosterone-boosting supplement; mixed clinical signal' },
    { slug: 'choline-bitartrate', effect: 'substrate', target: 'phosphatidylcholine + acetylcholine precursor (bitartrate salt)', note: 'choline supplement; PC + ACh precursor; nootropic claim' },
    { slug: 'nac', effect: 'substrate', target: 'cysteine prodrug → glutathione synthesis', note: 'N-acetylcysteine; APAP overdose antidote + COPD mucolytic + psychiatric off-label' },
    { slug: 'n-acetylcysteine-amide', effect: 'substrate', target: 'cell-permeable NAC analog', note: 'NACA; lipophilic NAC; superior cellular uptake than NAC' },
    { slug: 'glynac', effect: 'substrate', target: 'glycine + NAC combination', note: 'GlyNAC; geriatric oxidative stress trial — restoration of glutathione' },
  ],
  carnitine_shuttle: [
    { slug: 'acetyl-l-carnitine', effect: 'substrate', target: 'mitochondrial + CNS-targeted carnitine (acetyl form)', note: 'ALCAR; cognitive + diabetic neuropathy claims; crosses BBB better than plain carnitine' },
    { slug: 'propionyl-l-carnitine', effect: 'substrate', target: 'carnitine + propionyl-CoA donor', note: 'propionyl-LC; peripheral vascular + cardiac claims; complementary to ALCAR' },
    { slug: 'l-carnitine-l-tartrate', effect: 'substrate', target: 'L-carnitine (tartrate salt)', note: 'LCLT; preferred sport-supplementation form' },
    { slug: 'taurine-bcaa', effect: 'substrate', target: 'taurine + BCAA combination', note: 'mixed; cellular energy + protein synthesis' },
  ],
  taurine_synthesis: [
    { slug: 'beta-alanine', effect: 'substrate', target: 'cysteine + β-alanine metabolic intersection', note: 'cross-link: glycine/serine pathway' },
  ],
  serotonin_melatonin_axis: [
    { slug: 'l-tryptophan', effect: 'substrate', target: '5-HT precursor (TPH substrate)', note: 'L-Trp supplement; rate-limited by TPH; PMS + insomnia claims' },
  ],

  // Adrenergic
  adrenergic_receptor_signaling: [
    { slug: 'nebivolol', effect: 'inhibitor', target: 'β1 + NO release', note: 'highly selective β1 + endothelial NO release → vasodilation; HTN with favorable BP + erectile function profile' },
    { slug: 'betaxolol', effect: 'inhibitor', target: 'β1 (cardioselective + ophthalmic for glaucoma)', note: 'topical glaucoma; PO HTN; cross-link: aqueous_humor_iop_regulation' },
    { slug: 'pindolol', effect: 'inhibitor', target: 'β1 + β2 with ISA (intrinsic sympathomimetic)', note: 'non-selective β-blocker with partial agonist activity; less bradycardia than pure antagonists' },
    { slug: 'esmolol', effect: 'inhibitor', target: 'β1 (ultra-short-acting IV)', note: 'IV β-blocker; t½ ~9 min via RBC esterases; OR/ICU titration' },
    { slug: 'salbutamol', effect: 'activator', target: 'β2 (SABA)', note: 'salbutamol (UK term for albuterol); short-acting β2-agonist; asthma rescue' },
    { slug: 'formoterol', effect: 'activator', target: 'β2 (LABA, fast onset)', note: 'LABA with fast onset (1-3 min); component of ICS/LABA combos (Symbicort)' },
    { slug: 'vilanterol', effect: 'activator', target: 'β2 (24-hr LABA)', note: 'once-daily LABA; component of Trelegy + Breo Ellipta' },
    { slug: 'indacaterol', effect: 'activator', target: 'β2 (24-hr LABA)', note: 'once-daily LABA; COPD; Arcapta + Utibron components' },
    { slug: 'yohimbine', effect: 'inhibitor', target: 'α2-adrenergic antagonist', note: 'pre-synaptic α2 antagonist → ↑NE release; ED + weight loss claims; anxiety + HTN risk' },
  ],
  catecholamine_synthesis: [
    { slug: 'reserpine', effect: 'inhibitor', target: 'VMAT2 (vesicular monoamine storage)', note: 'classic 1950s antihypertensive; depletes presynaptic monoamines; depression signal' },
  ],
  monoamine_oxidase_metabolism: [
    { slug: 'tranylcypromine', effect: 'inhibitor', target: 'MAO-A + MAO-B (irreversible)', note: 'covered in tricyclic_atypical_antidepressants — duplicate ref' },
    { slug: 'moclobemide', effect: 'inhibitor', target: 'MAO-A (reversible)', note: 'covered in tricyclic_atypical_antidepressants — duplicate ref' },
  ],

  // 5-HT / arachidonic
  serotonin_receptor_pharmacology: [
    { slug: 'sumatriptan-succinate', effect: 'activator', target: '5-HT1B/1D', note: 'sumatriptan salt; alias' },
  ],
  arachidonic_acid_cascade: [
    { slug: 'diclofenac', effect: 'inhibitor', target: 'COX-1 + COX-2', note: 'NSAID; potent; CV-event signal at high doses (similar to selective COX-2)' },
    { slug: 'indomethacin', effect: 'inhibitor', target: 'COX-1 + COX-2', note: 'NSAID; potent anti-inflammatory; gout + PDA closure in neonates; CNS side effects' },
    { slug: 'meloxicam', effect: 'inhibitor', target: 'COX-2 preferential', note: 'NSAID; preferential COX-2 at low dose; OA' },
    { slug: 'etoricoxib', effect: 'inhibitor', target: 'COX-2 selective', note: 'coxib; outside US; gout + OA + RA' },
  ],

  // Diabetes
  insulin_glucose_homeostasis: [
    { slug: 'alogliptin', effect: 'inhibitor', target: 'DPP-4', note: 'DPP-4-i; T2DM; renal dose-adjusted' },
    { slug: 'nateglinide', effect: 'activator', target: 'KATP channel block (SUR1)', note: 'meglitinide; very short-acting; pre-meal dosing; less hypoglycemia than glyburide' },
    { slug: 'tolbutamide', effect: 'activator', target: 'KATP channel block (SUR1)', note: 'first-gen sulfonylurea; canonical CYP2C9 probe substrate (DDIs authored: fluconazole)' },
    { slug: 'lixisenatide', effect: 'activator', target: 'GLP-1R (short-acting)', note: 'short-acting GLP-1 agonist; component of iGlarLixi (insulin glargine + lixisenatide combo)' },
  ],

  // Calcium / minerals
  calcium_phosphate_pth_axis: [
    { slug: 'cinacalcet', effect: 'activator', target: 'calcium-sensing receptor (CaSR) allosteric', note: 'calcimimetic; secondary hyperparathyroidism in dialysis + parathyroid carcinoma; lowers PTH' },
  ],

  // GABA-A
  gaba_a_receptor_signaling: [
    { slug: 'temazepam', effect: 'activator', target: 'BZD site (α1/2/3/5)', note: 'intermediate BZD; insomnia; glucuronidated (no CYP DDIs)' },
    { slug: 'oxazepam', effect: 'activator', target: 'BZD site', note: 'short BZD; phase II metabolism only (UGT) — preferred in liver disease' },
    { slug: 'triazolam', effect: 'activator', target: 'BZD site', note: 'ultra-short BZD; insomnia + procedural sedation; CYP3A4 substrate (itraconazole AUC 27× — contraindicated)' },
    { slug: 'zaleplon', effect: 'activator', target: 'α1-selective BZD site (Z-drug)', note: 'ultra-short Z-drug; t½ ~1h; mid-night dosing for sleep-maintenance issues' },
    { slug: 'flumazenil', effect: 'inhibitor', target: 'BZD site (competitive antagonist)', note: 'BZD overdose reversal; precipitated withdrawal + seizures in chronic users' },
    { slug: 'thiopental', effect: 'activator', target: 'β-subunit (barbiturate)', note: 'ultra-short barbiturate; OR induction (largely replaced by propofol); refractory status epilepticus + ICP' },
    { slug: 'phenibut', effect: 'activator', target: 'GABA-B + α2δ Ca channel', note: 'phenyl-GABA; Russian Rx; anxiolytic + nootropic; tolerance + withdrawal in chronic use' },
    { slug: 'sodium-oxybate', effect: 'activator', target: 'GABA-B + GHB-specific receptors', note: 'Xyrem; narcolepsy/cataplexy + idiopathic hypersomnia; REMS program; γ-hydroxybutyrate sodium salt' },
  ],
  voltage_gated_sodium_channels: [
    { slug: 'levetiracetam-er', effect: 'inhibitor', target: 'SV2A (extended-release form of levetiracetam)', note: 'ER formulation of levetiracetam — see CNS-3 entry; same MOA' },
  ],

  // CGRP/migraine + sleep
  cgrp_migraine_axis: [
    { slug: 'sumatriptan-succinate', effect: 'activator', target: '5-HT1B/1D (cross-link)', note: 'covered in serotonin_receptor_pharmacology — same compound' },
  ],
  orexin_arousal_axis: [
    { slug: 'ramelteon', effect: 'activator', target: 'MT1 + MT2 (melatonin agonist)', note: 'Rozerem; non-controlled insomnia option; suvorexant alternative for sleep-onset' },
    { slug: 'tasimelteon', effect: 'activator', target: 'MT1 + MT2', note: 'Hetlioz; non-24-hour sleep-wake disorder (blind individuals)' },
    { slug: 'trazodone', effect: 'inhibitor', target: '5-HT2A + H1 + α1 (low-dose sleep aid)', note: 'covered in atypical antidepressants — sleep use at low doses' },
  ],
  serotonin_melatonin_axis: [
    { slug: 'ramelteon', effect: 'activator', target: 'MT1 + MT2', note: 'melatonin-receptor agonist' },
    { slug: 'tasimelteon', effect: 'activator', target: 'MT1 + MT2', note: 'melatonin-receptor agonist' },
  ],

  // NSAIDs / arachidonic_acid_cascade already covered
  // mTOR signaling
  mtor_signaling: [
    { slug: 'tacrolimus', effect: 'inhibitor', target: 'calcineurin (FKBP12-tacrolimus complex)', note: 'cross-link: dna_damage_cytotoxic_response — transplant immunosuppression' },
    { slug: 'cyclosporine', effect: 'inhibitor', target: 'calcineurin (cyclophilin-cyclosporine)', note: 'cross-link: dna_damage_cytotoxic_response' },
  ],

  // Aprepitant (NK1) - emesis
  // No NK1 pathway exists; add to gi_motility_secretion as an antiemetic
  gi_motility_secretion: [
    { slug: 'aprepitant', effect: 'inhibitor', target: 'NK1 receptor (substance P)', note: 'chemo-induced N/V; component of triple antiemetic (5HT3-i + dex + aprepitant); CYP3A4 substrate + inhibitor + inducer authored Wave 2a v1.1' },
    { slug: 'palonosetron', effect: 'inhibitor', target: '5-HT3 (long-acting)', note: 'long-acting setron; chemo N/V; minimal QT effect vs ondansetron' },
  ],

  // Cyclosporine + tacrolimus already in onc/transplant pathway

  // Adaptogen extensions
  adaptogen_hpa_stress_modulation: [
    { slug: 'st-johns-wort', effect: 'activator', target: 'CYP3A4/2C9 induction + SERT modulation', note: 'mild antidepressant + massive CYP3A4/P-gp inducer DDI source (oral contraceptives, midazolam, etc.)' },
    { slug: 'ginkgo-biloba', effect: 'activator', target: 'cerebral blood flow + PAF antagonist', note: 'cognitive + circulation claims; bleeding risk with anticoagulants' },
    { slug: 'valerian', effect: 'activator', target: 'GABA-A modulation', note: 'mild sedative for insomnia + anxiety; valerenic acid as proposed active' },
    { slug: 'lemon-balm', effect: 'activator', target: 'GABA-T inhibition + 5-HT modulation', note: 'Melissa officinalis; anxiolytic claim; rosmarinic acid as active' },
    { slug: 'chamomile', effect: 'activator', target: 'BZD-site partial agonism (apigenin) + 5-HT', note: 'Matricaria; mild anxiolytic + GI; apigenin is the BZD-site active' },
    { slug: 'saffron', effect: 'activator', target: 'crocin/safranal antidepressant claim', note: 'Crocus sativus stigma; mild antidepressant signal in trials' },
    { slug: 'passionflower', effect: 'activator', target: 'GABA modulation', note: 'Passiflora; mild anxiolytic; chrysin/apigenin contribute' },
    { slug: 'echinacea', effect: 'activator', target: 'innate immune (mechanism mixed)', note: 'Echinacea purpurea; cold-shortening claims; mixed evidence' },
    { slug: 'elderberry', effect: 'activator', target: 'antiviral + immune modulation', note: 'Sambucus nigra; anthocyanin-rich; influenza-symptom-shortening signal' },
    { slug: 'milk-thistle', effect: 'activator', target: 'silymarin → hepatoprotection', note: 'liver protection + Amanita poisoning antidote (silibinin IV); cross-link: nrf2_keap1' },
    { slug: 'ginger', effect: 'inhibitor', target: 'COX/LOX + GI motility', note: 'Zingiber officinalis; nausea (motion sickness + pregnancy) + anti-inflammatory; gingerols + shogaols as actives' },
    { slug: 'aged-garlic', effect: 'inhibitor', target: 'platelet aggregation + NO release', note: 'Kyolic; cardiovascular claims; SAC + SAMC as actives; cross-link: platelet_aggregation' },
    { slug: 'pycnogenol', effect: 'activator', target: 'NO release + Nrf2', note: 'French maritime pine bark; cardiovascular + cognitive claims' },
    { slug: 'fenugreek', effect: 'activator', target: 'insulin sensitizer + testosterone claim', note: 'Trigonella foenum-graecum; glycemic + libido marketing' },
    { slug: 'tribulus', effect: 'activator', target: 'libido + LH claims (mechanism weak)', note: 'Tribulus terrestris; weak/null T-raising trials in humans' },
    { slug: 'spirulina', effect: 'activator', target: 'phycocyanin antioxidant + protein', note: 'Arthrospira platensis blue-green alga; food + supplement' },
    { slug: 'chlorella', effect: 'activator', target: 'heavy-metal chelation claim + nutrient', note: 'Chlorella vulgaris; detoxification claims (limited evidence)' },
    { slug: 'beetroot-extract', effect: 'activator', target: 'NO release (dietary nitrate)', note: 'NO precursor; endurance performance + BP signal' },
    { slug: 'red-yeast-rice', effect: 'inhibitor', target: 'HMG-CoA reductase (monacolin K = lovastatin)', note: 'natural statin; monacolin K is chemically lovastatin; not standardized → variable potency' },
    { slug: 'oregano-oil', effect: 'inhibitor', target: 'carvacrol antimicrobial', note: 'carvacrol + thymol; antimicrobial claims; food + supplement' },
    { slug: 'sea-buckthorn-oil', effect: 'activator', target: 'omega fatty acid + antioxidant', note: 'Hippophae rhamnoides; skin + mucosal claims' },
    { slug: 'royal-jelly', effect: 'activator', target: 'bee-derived peptides + lipids', note: 'queen-bee food; trans-10-hydroxydecenoic acid; allergy risk' },
    { slug: 'propolis', effect: 'inhibitor', target: 'antimicrobial + immune modulation (CAPE)', note: 'bee resin; caffeic acid phenethyl ester active; OTC throat + cold uses' },
    { slug: 'yerba-mate', effect: 'activator', target: 'caffeine + theobromine + theophylline', note: 'Ilex paraguariensis; xanthine-containing tea; cross-link: caffeine_demethylation' },
    { slug: 'nettle', effect: 'activator', target: 'anti-inflammatory + BPH (mechanism mixed)', note: 'Urtica dioica; histamine release inhibitor + BPH supplement' },
    { slug: 'dandelion', effect: 'activator', target: 'diuretic + liver tonic (traditional)', note: 'Taraxacum; mild diuretic; potassium-rich' },
    { slug: 'raspberry-leaf', effect: 'activator', target: 'pregnancy + uterine tonic (traditional)', note: 'late-pregnancy preparation; mechanism weak' },
    { slug: 'nigella-sativa', effect: 'activator', target: 'thymoquinone (anti-inflammatory)', note: 'black seed; thymoquinone-driven anti-inflammatory + glycemic claims' },
  ],

  // Nrf2 / antioxidant
  nrf2_keap1_antioxidant_response: [
    { slug: 'rosmarinic-acid', effect: 'activator', target: 'Nrf2 + COX-2', note: 'rosemary/lemon balm polyphenol' },
    { slug: 'hydroxytyrosol', effect: 'activator', target: 'Nrf2 + LDL protection', note: 'olive-oil phenol; cardiovascular Mediterranean-diet active' },
    { slug: 'oleocanthal', effect: 'activator', target: 'COX inhibitor (ibuprofen-like) + Nrf2', note: 'EVOO phenol; chemically related to ibuprofen pharmacology + Mediterranean cardiovascular' },
    { slug: 'oleuropein', effect: 'activator', target: 'Nrf2 + ACE inhibitor', note: 'olive-leaf glycoside; BP + glucose claims' },
    { slug: 'sesamin', effect: 'activator', target: 'tocopherol-sparing + lipid', note: 'sesame lignan; raises serum γ-tocopherol via metabolic block; lipid claim' },
    { slug: 'grape-seed-extract', effect: 'activator', target: 'OPC (oligomeric proanthocyanidins) antioxidant', note: 'OPCs; cardiovascular + skin claims; bioavailability limited' },
    { slug: 'theaflavin', effect: 'activator', target: 'Nrf2 + cholesterol modulation', note: 'black-tea fermentation phenol; lipid claims' },
    { slug: 'cyanidin', effect: 'activator', target: 'Nrf2 + anthocyanin antioxidant', note: 'red/purple anthocyanin; berry + grape skin' },
    { slug: 'daidzein', effect: 'activator', target: 'estrogen-receptor partial agonist (isoflavone)', note: 'soy isoflavone; ER-β preferential; menopausal symptom claim' },
    { slug: 'delphinidin', effect: 'activator', target: 'Nrf2 + anthocyanin', note: 'blue/purple anthocyanin' },
    { slug: 'genistein', effect: 'activator', target: 'estrogen-receptor partial agonist (isoflavone)', note: 'soy isoflavone; tyrosine kinase inhibitor activity at high doses' },
    { slug: 'procyanidin-b2', effect: 'activator', target: 'Nrf2', note: 'cacao/apple OPC; antioxidant' },
    { slug: 'icariin', effect: 'activator', target: 'PDE5 inhibitor + bone (Epimedium)', note: 'horny goat weed flavonoid; PDE5 inhibition + bone-density claims' },
    { slug: 'milk-thistle-silibinin', effect: 'activator', target: 'hepatoprotection (purified silibinin)', note: 'purified silibinin; Amanita poisoning IV antidote' },
    { slug: 'taxifolin', effect: 'activator', target: 'Nrf2 + antioxidant', note: 'dihydroquercetin; pine-bark extract' },
    { slug: 'limonene', effect: 'activator', target: 'antioxidant + chemopreventive', note: 'citrus terpene; chemoprevention research' },
    { slug: 'linalool', effect: 'activator', target: 'NMDA/GABA modulation', note: 'lavender terpene; anxiolytic claim' },
    { slug: 'myrcene', effect: 'activator', target: 'GABA-A + sedative claim', note: 'cannabis + hops terpene' },
    { slug: 'alpha-pinene', effect: 'activator', target: 'AChE inhibitor + bronchodilator', note: 'pine terpene' },
    { slug: 'beta-pinene', effect: 'activator', target: 'AChE inhibitor + antimicrobial', note: 'pine terpene' },
    { slug: 'geraniol', effect: 'activator', target: 'antimicrobial + insect repellent', note: 'rose/geranium terpene' },
    { slug: 'bisabolol', effect: 'activator', target: 'anti-inflammatory + antimicrobial', note: 'chamomile sesquiterpene' },
    { slug: 'cinnamaldehyde', effect: 'activator', target: 'TRPA1 + Nrf2 + insulin sensitivity', note: 'cinnamon active; cross-link: trp_channel_sensory_transduction' },
    { slug: 'curcumin-meriva', effect: 'activator', target: 'curcumin phospholipid complex (covered)', note: 'duplicate ref' },
  ],

  // ROS / lipids
  ros_oxidative_stress: [
    { slug: 'coq10', effect: 'activator', target: 'electron transport chain + antioxidant', note: 'coenzyme Q10; mitochondrial complex I-III electron carrier; statin co-prescription claim' },
    { slug: 'coq10-ubiquinol', effect: 'activator', target: 'reduced CoQ10 (ubiquinol)', note: 'pre-reduced active form; better bioavailability in elderly' },
    { slug: 'pqq', effect: 'activator', target: 'mitochondrial biogenesis', note: 'pyrroloquinoline quinone; antioxidant; cognitive + sleep claims' },
    { slug: 'idebenone', effect: 'activator', target: 'CoQ10 analog + ETC', note: 'synthetic CoQ; LHON (Friedreich ataxia variants) Rx in EU' },
    { slug: 'ala-r', effect: 'activator', target: 'α-lipoic acid (R-enantiomer)', note: 'natural R-ALA; mitochondrial + glutathione recycling; diabetic neuropathy Rx in some markets' },
    { slug: 'c60', effect: 'activator', target: 'fullerene antioxidant (radical sponge)', note: 'C60 in olive oil; rodent lifespan claim from Baati 2012 (controversial)' },
    { slug: 'emoxypine', effect: 'activator', target: 'antioxidant + GABA modulation', note: 'mexidol; Russian-Rx antioxidant + nootropic' },
  ],

  // sphingolipid/lipids
  glycerophospholipid_metabolism: [
    { slug: 'phosphatidylserine', effect: 'substrate', target: 'PS membrane lipid', note: 'PS supplementation; cognitive + cortisol-blunting claims' },
    { slug: 'glycerol-supplement', effect: 'substrate', target: 'glycerol as osmolyte', note: 'glycerol; sports hydration + ICP osmotic agent' },
  ],
  omega_fatty_acid_metabolism: [
    { slug: 'ala', effect: 'substrate', target: 'omega-3 ALA → EPA/DHA (low conversion)', note: 'α-linolenic acid; plant omega-3; <5% converts to EPA/DHA in humans' },
    { slug: 'epa', effect: 'substrate', target: 'omega-3 EPA → resolvins + COX-3 substrate', note: 'eicosapentaenoic acid; fish-oil active; CV outcome benefit at high purified doses (REDUCE-IT)' },
    { slug: 'dha', effect: 'substrate', target: 'omega-3 DHA → membrane fluidity + neuroprotection', note: 'docosahexaenoic acid; brain + retina enrichment; pregnancy + cognitive supplementation' },
    { slug: 'dpa', effect: 'substrate', target: 'omega-3 DPA (intermediate)', note: 'docosapentaenoic acid; EPA → DHA intermediate' },
    { slug: 'gla', effect: 'substrate', target: 'omega-6 GLA → DGLA + anti-inflammatory', note: 'γ-linolenic acid; borage/evening primrose oil; eczema + PMS claims' },
  ],

  // Metabolites
  inositol_phosphate_signaling: [
    { slug: 'd-chiro-inositol', effect: 'substrate', target: 'inositol stereoisomer (insulin sensitizer)', note: 'PCOS + insulin sensitivity claim; 40:1 myo:DCI ratio supplements common' },
  ],
  glutathione_metabolism: [
    { slug: 'msm', effect: 'substrate', target: 'sulfur donor (methylsulfonylmethane)', note: 'OA + joint claims; sulfur supplementation; mechanism mixed' },
    { slug: 'same', effect: 'substrate', target: 'SAM-e (methyl donor)', note: 'S-adenosyl methionine; depression + OA claims; methyl donor for COMT/MAO etc.' },
    { slug: 'tmg', effect: 'substrate', target: 'trimethylglycine (betaine; methyl donor)', note: 'betaine; homocysteine reduction; methyl donor adjunct to folate/B12' },
    { slug: 'spermidine', effect: 'activator', target: 'autophagy induction', note: 'polyamine; wheat germ + aged cheese; autophagy + longevity claims' },
    { slug: 'allicin', effect: 'inhibitor', target: 'HMG-CoA reductase + antimicrobial (garlic)', note: 'fresh garlic active; cardiovascular + antimicrobial' },
  ],
  histamine_axis: [
    { slug: 'agmatine', effect: 'inhibitor', target: 'NMDA + α2-adrenergic + NOS modulation', note: 'decarboxylated arginine; pain + mood claims; supplement-channel' },
    { slug: 'carnosine', effect: 'activator', target: 'pH buffer + AGE inhibitor + Zn carrier', note: 'β-Ala-His dipeptide; muscle carnosine boosted by β-alanine; anti-glycation' },
  ],
  bile_acid_synthesis: [
    { slug: 'glucosamine', effect: 'substrate', target: 'glycosaminoglycan synthesis precursor', note: 'OA + joint claims; sulfate + HCl salt forms; mixed efficacy data' },
    { slug: 'chondroitin', effect: 'substrate', target: 'GAG building block', note: 'OA + joint; often paired with glucosamine' },
    { slug: 'hyaluronic-acid', effect: 'substrate', target: 'GAG + joint + skin hydration', note: 'oral + intra-articular + topical; ha-hmw/mmw/lmw cosmetic forms (covered)' },
  ],

  // Misc
  insulin_glucose_homeostasis_misc: [], // placeholder

  // Other
  caffeine_demethylation: [
    { slug: 'theacrine', effect: 'inhibitor', target: 'adenosine A1/A2A (1,3,7,9-tetramethyluric acid)', note: 'kucha tea methylxanthine; longer t½ than caffeine; less tolerance development; CYP1A2 substrate' },
    { slug: 'mixed-amphetamine-salts', effect: 'inhibitor', target: 'DAT + NET (Adderall salts mixture)', note: 'amphetamine salt mixture; ADHD + narcolepsy; cross-link: dopamine_receptor_signaling' },
  ],

  // Alkaloids
  ampa_kainate_glutamate_extension: [
    { slug: 'centrophenoxine', effect: 'activator', target: 'DMAE prodrug → CNS choline + lipofuscin reduction', note: 'cholinergic precursor; nootropic + anti-aging claim' },
    { slug: 'dmae', effect: 'activator', target: 'dimethylaminoethanol (choline precursor)', note: 'DMAE; topical (skin firmness) + oral nootropic claims' },
    { slug: 'idebenone', effect: 'activator', target: 'synthetic CoQ + ETC (cross-link: ros pathway)' },
    { slug: 'hydrafinil', effect: 'activator', target: 'wake-promoting (modafinil analog)', note: '9-fluorenol; investigational; not FDA-approved' },
  ],

  // Other
  gnrh_pulse_generator_axis: [
    { slug: 'hormonal-contraceptives', effect: 'inhibitor', target: 'mixture (estrogen + progestin combination)', note: 'mixture entry; cross-link: hpg_axis for specific OC' },
  ],

  // Alkaloid extensions
  acetylcholine_axis: [
    { slug: 'piperine', effect: 'inhibitor', target: 'CYP3A4 + UGT inhibitor (black pepper)', note: 'black-pepper alkaloid; turmeric absorption enhancer (12x); broad CYP modulation' },
    { slug: 'vinpocetine', effect: 'inhibitor', target: 'PDE1 + Na channel (vinca alkaloid)', note: 'periwinkle alkaloid; cerebral vasodilator + neuroprotection claim; EU Rx' },
    { slug: '9-me-bc', effect: 'activator', target: 'TAAR1 + MAO modulation', note: '9-methyl-β-carboline; research compound; mood + cognition' },
    { slug: 'colchicine-low-dose-cv', effect: 'inhibitor', target: 'tubulin (low-dose cardiovascular)', note: 'low-dose colchicine; COLCOT/LoDoCo2 trials — CV-event reduction post-MI + chronic CAD' },
  ],

  // Adropin already in mitochondrial peptide
  // Misc
  dopamine_receptor_signaling: [
    { slug: 'tesofensine', effect: 'inhibitor', target: 'DAT + NET + SERT (triple monoamine reuptake)', note: 'tesofensine; obesity research compound; failed phase 3 cardiovascular signal' },
    { slug: '5-amino-1mq', effect: 'inhibitor', target: 'NNMT (nicotinamide N-methyltransferase)', note: 'research compound; preserves intracellular NMN/NAD pool; weight + insulin sensitivity claims' },
  ],

  // Misc small
  oxidative_phosphorylation: [
    { slug: 'dichloroacetate', effect: 'inhibitor', target: 'pyruvate dehydrogenase kinase (PDK)', note: 'DCA; lactic acidosis treatment + research metabolic-cancer indication; peripheral neuropathy' },
    { slug: 'trimetazidine', effect: 'inhibitor', target: 'long-chain 3-ketoacyl CoA thiolase (fatty acid oxidation block)', note: '3-KAT inhibitor; shifts cardiac metabolism from FA to glucose; chronic stable angina (EU)' },
  ],
  oral_contraceptive: [], // placeholder

  // Vitamin antioxidant
  vitamin_antioxidant_status: [], // populated via new pathway

  // Aromatase
  aromatase_androgen_receptor_axis: [
    { slug: 'hormonal-contraceptives', effect: 'inhibitor', target: 'ovulation suppression (mixture)', note: 'OC mixture; cross-link: hpg_axis' },
  ],

  // mTOR
  cell_cycle_cdk: [
    { slug: 'ibrutinib', effect: 'inhibitor', target: 'BTK (B-cell receptor signaling)', note: 'first BTK-i; CLL + MCL + WM; CYP3A4 substrate; bleeding + AF + HTN tail' },
    { slug: 'acalabrutinib', effect: 'inhibitor', target: 'BTK (more-selective second-gen)', note: 'BTK-i; less off-target than ibrutinib; CLL + MCL' },
  ],
  apoptosis_bcl2_axis: [
    { slug: 'navitoclax', effect: 'inhibitor', target: 'Bcl-2 + Bcl-xL (dual)', note: 'BH3-mimetic; phase 2 oncology; thrombocytopenia (Bcl-xL on-target) — paved way for venetoclax\'s Bcl-2 selectivity' },
  ],
  cytokine_biologic_blockade: [
    { slug: 'rituximab', effect: 'inhibitor', target: 'CD20 (B-cell depleter)', note: 'anti-CD20 mAb; CLL + lymphoma + RA + MS + ANCA vasculitis; biosimilars widely available' },
    { slug: 'trastuzumab', effect: 'inhibitor', target: 'HER2 (ERBB2)', note: 'first HER2 mAb; HER2+ breast cancer; cardiotoxicity (LVEF monitoring); biosimilars' },
  ],
};

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

  let pAdded = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p); pAdded++;
    console.log(`  [add ] ${p.slug.padEnd(48)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }

  let modsAdded = 0;
  for (const [slug, items] of Object.entries(EXTENSIONS)) {
    if (items.length === 0) continue;
    const p = bySlug.get(slug);
    if (!p) { console.log(`  [warn] target missing: ${slug}`); continue; }
    const n = addModulators(p, items);
    modsAdded += n;
    if (n > 0) console.log(`  [ext ] ${slug.padEnd(48)} +${n} (now ${p.modulators!.length})`);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nCLOSE cluster: +${pAdded} pathways, +${modsAdded} modulator entries. Total: ${data.length}.`);
}

main();
