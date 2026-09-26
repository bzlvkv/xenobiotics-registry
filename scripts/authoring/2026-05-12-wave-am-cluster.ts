/**
 * 2026-05-12-wave-am-cluster.ts — Antimicrobial cluster (AM-1..6).
 *
 *   AM-1 bacterial_translation_inhibition    macrolides + tetracyclines +
 *                                            aminoglycosides + oxazolidinones +
 *                                            lincosamides
 *   AM-2 peptidoglycan_synthesis             β-lactams + vancomycin
 *   AM-3 bacterial_dna_folate_disruption     quinolones + sulfonamides +
 *                                            trimethoprim + metronidazole +
 *                                            nitrofurantoin
 *   AM-4 mycobacterial_cell_envelope         TB Rx + rifamycins
 *   AM-5 fungal_ergosterol_biosynthesis      azoles + allylamines + hydroxypyridones
 *   AM-6 helminth_protozoa_targets           anthelmintics + antiprotozoals
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'bacterial_translation_inhibition',
    name: 'Bacterial ribosome (translation inhibition)',
    category: 'catabolism',
    systems: ['immune-hematologic'],
    description: `Bacterial 70S ribosome (30S + 50S) is the major antibiotic target — selective toxicity arises from the eukaryotic 80S ribosome's structural differences (40S + 60S). 30S inhibitors: tetracyclines block aminoacyl-tRNA A-site loading (bacteriostatic); aminoglycosides bind 16S rRNA → mistranslation + membrane permeabilization (bactericidal). 50S inhibitors: macrolides + ketolides bind 23S rRNA peptidyl-transferase loop → premature peptide chain release (bacteriostatic, partly bactericidal at high conc); lincosamides (clindamycin) bind near macrolide site → cross-resistance via MLSb mechanism; oxazolidinones (linezolid) prevent 70S initiation complex assembly; chloramphenicol blocks peptidyltransferase. Aminoglycoside-induced ototoxicity + nephrotoxicity reflects accumulation in cochlear hair cells + renal tubular cells.`,
    steps: [
      { from: 'bacterial-ribosome', to: 'peptide-elongation', via: '70S assembly + aminoacyl-tRNA loading at A-site → peptide bond formation → translocation' },
    ],
    modulators: [
      { slug: 'erythromycin', effect: 'inhibitor', target: '50S (23S rRNA, peptidyl-transferase)', note: 'first macrolide; strong CYP3A4 inhibitor (multi-DDI perpetrator); GI motility side effect via motilin agonism (used off-label for gastroparesis)' },
      { slug: 'clarithromycin', effect: 'inhibitor', target: '50S (23S rRNA)', note: 'macrolide; strong CYP3A4 inhibitor; H. pylori triple-therapy component; QT prolongation' },
      { slug: 'azithromycin', effect: 'inhibitor', target: '50S (23S rRNA)', note: 'azalide macrolide; weak CYP3A4 inhibitor (vs erythromycin/clarithromycin); long tissue half-life → short-course dosing; QT prolongation' },
      { slug: 'telithromycin', effect: 'inhibitor', target: '50S (23S rRNA)', note: 'ketolide; designed for macrolide-resistant pneumococcus; hepatotoxicity + myasthenia exacerbation withdrew it 2007' },
      { slug: 'doxycycline', effect: 'inhibitor', target: '30S (16S rRNA, A-site)', note: 'tetracycline; broad-spectrum + intracellular pathogens (Rickettsia, Chlamydia); avoid divalent cations (Ca/Mg/Fe — separate by 2h)' },
      { slug: 'minocycline', effect: 'inhibitor', target: '30S (16S rRNA, A-site)', note: 'tetracycline; CNS-penetrant (acne + neuroinflammatory off-label); divalent-cation chelation same as doxycycline' },
      { slug: 'gentamicin', effect: 'inhibitor', target: '30S (16S rRNA — mistranslation)', note: 'aminoglycoside; gram-negative bactericidal; nephrotoxicity + ototoxicity require trough monitoring' },
      { slug: 'tobramycin', effect: 'inhibitor', target: '30S (16S rRNA)', note: 'aminoglycoside; pseudomonal activity > gentamicin; inhaled form for CF airway' },
      { slug: 'linezolid', effect: 'inhibitor', target: '50S (23S rRNA, initiation complex)', note: 'oxazolidinone; MRSA + VRE active; weak MAOI → serotonin-syndrome risk with SSRIs; mitochondrial toxicity at chronic use (>28 days)' },
      { slug: 'clindamycin', effect: 'inhibitor', target: '50S (23S rRNA, near macrolide site)', note: 'lincosamide; anaerobe + gram-positive; canonical C. difficile precipitant (highest-risk antibiotic for CDI)' },
    ],
    refs: [],
  },
  {
    slug: 'peptidoglycan_synthesis',
    name: 'Bacterial cell wall (peptidoglycan synthesis)',
    category: 'biosynthesis',
    systems: ['immune-hematologic'],
    description: `Bacterial peptidoglycan is a cross-linked polymer of NAG-NAM (N-acetyl-glucosamine + N-acetyl-muramic acid) with pentapeptide cross-links forged by transpeptidase enzymes (penicillin-binding proteins, PBPs). β-lactams (penicillins, cephalosporins, carbapenems, monobactams) mimic the D-Ala-D-Ala terminus of the pentapeptide → acylate the PBP active-site serine → halt cross-linking → osmotic lysis (bactericidal in growing bacteria). β-lactamases hydrolyze the β-lactam ring; β-lactamase inhibitors (clavulanate, tazobactam, sulbactam, avibactam, vaborbactam) preserve the partner antibiotic. Vancomycin works upstream — binds the D-Ala-D-Ala terminus directly, preventing transpeptidation; resistance via D-Ala-D-Lac (VRE) or thickened cell wall (VISA).`,
    steps: [
      { from: 'd-ala-d-ala-terminus', to: 'peptidoglycan-crosslink', via: 'PBP transpeptidase forms the cross-link → mature peptidoglycan' },
    ],
    modulators: [
      { slug: 'penicillin-v', effect: 'inhibitor', target: 'PBP (β-lactam)', note: 'narrow-spectrum natural penicillin; strep + Treponema; PO well-absorbed; 4-6h t½' },
      { slug: 'ampicillin', effect: 'inhibitor', target: 'PBP (β-lactam)', note: 'aminopenicillin; broader gram-negative vs penicillin-V; Listeria coverage in meningitis combo' },
      { slug: 'amoxicillin', effect: 'inhibitor', target: 'PBP (β-lactam)', note: 'aminopenicillin; better PO F than ampicillin (~95% vs ~50%); first-line otitis media + H. pylori triple therapy' },
      { slug: 'amoxicillin-clavulanate', effect: 'inhibitor', target: 'PBP + β-lactamase inhibitor (clavulanate)', note: 'Augmentin; clavulanate suicide-inhibits class-A β-lactamases → extends amoxicillin coverage to amoxicillin-resistant H. influenzae + M. catarrhalis' },
      { slug: 'cephalexin', effect: 'inhibitor', target: 'PBP (1st-gen cephalosporin)', note: 'oral 1st-gen; skin/soft-tissue MSSA + Strep' },
      { slug: 'cefuroxime', effect: 'inhibitor', target: 'PBP (2nd-gen cephalosporin)', note: 'PO + IV; expanded gram-negative + retained gram-positive' },
      { slug: 'cefdinir', effect: 'inhibitor', target: 'PBP (3rd-gen cephalosporin)', note: 'PO 3rd-gen; pediatric otitis/pharyngitis; iron-supplement DDI (red stool from cefdinir-iron complex)' },
      { slug: 'ceftriaxone', effect: 'inhibitor', target: 'PBP (3rd-gen cephalosporin)', note: 'IV/IM; once-daily; meningitis + bacteremia + GC first-line' },
      { slug: 'cefepime', effect: 'inhibitor', target: 'PBP (4th-gen cephalosporin)', note: 'IV; pseudomonal + extended-spectrum gram-negative; neurotoxicity (encephalopathy) at renal dose-failures' },
      { slug: 'meropenem', effect: 'inhibitor', target: 'PBP (carbapenem)', note: 'broad-spectrum carbapenem; ESBL + AmpC + extended gram-negative; lower seizure risk vs imipenem' },
      { slug: 'piperacillin-tazobactam', effect: 'inhibitor', target: 'PBP + β-lactamase inhibitor', note: 'Zosyn; pseudomonal + anaerobe coverage; ESBL not reliable; first-line ICU empiric' },
      { slug: 'vancomycin', effect: 'inhibitor', target: 'D-Ala-D-Ala terminus (peptidoglycan precursor)', note: 'glycopeptide; MRSA + Clostridium; renal dose adjust + AUC-monitored; red-man syndrome (histamine release) with rapid infusion' },
    ],
    refs: [],
  },
  {
    slug: 'bacterial_dna_folate_disruption',
    name: 'Bacterial DNA replication + folate synthesis',
    category: 'catabolism',
    systems: ['immune-hematologic'],
    description: `Two distinct mechanisms grouped for clinical co-deployment. (1) DNA gyrase + topoisomerase IV — quinolones bind the enzyme-DNA complex → DNA strand breakage. (2) Bacterial folate synthesis — sulfonamides mimic PABA and competitively inhibit dihydropteroate synthase (DHPS, first step); trimethoprim inhibits dihydrofolate reductase (DHFR, downstream); the sulfonamide + trimethoprim combo (TMP-SMX) is sequential blockade → synergy. Metronidazole is activated by anaerobic ferredoxin/flavodoxin reduction → DNA-damaging nitro radicals; only anaerobes + microaerophilic protozoa can activate it. Nitrofurantoin is similarly activated by bacterial nitroreductases → multi-target damage (DNA, ribosome, metabolic enzymes); urinary concentration drives UTI activity despite low plasma levels.`,
    steps: [
      { from: 'bacterial-dna-supercoiling', to: 'bacterial-dna-replication', via: 'DNA gyrase + topoisomerase IV maintain negative supercoils + decatenate daughter chromosomes' },
      { from: 'paba', to: 'tetrahydrofolate', via: 'DHPS → DHF → DHFR → THF; sulfonamides block DHPS, trimethoprim blocks DHFR' },
    ],
    modulators: [
      { slug: 'levofloxacin', effect: 'inhibitor', target: 'DNA gyrase + topoisomerase IV', note: 'respiratory fluoroquinolone; community pneumonia + complicated UTI; QT prolongation + tendinopathy + aortic-aneurysm signal + neuropsychiatric tail' },
      { slug: 'sulfamethoxazole', effect: 'inhibitor', target: 'DHPS (folate synthesis)', note: 'sulfonamide; component of TMP-SMX (Bactrim); MRSA SSTI + PCP prophylaxis; CYP2C9 inhibitor (warfarin DDI)' },
      { slug: 'trimethoprim', effect: 'inhibitor', target: 'DHFR (folate reduction)', note: 'component of TMP-SMX; hyperkalemia via ENaC-channel-blocking activity in distal tubule' },
      { slug: 'metronidazole', effect: 'inhibitor', target: 'bacterial DNA (nitro radical via ferredoxin)', note: 'anaerobe + protozoa (Giardia, Entamoeba, Trichomonas); disulfiram-like alcohol reaction; peripheral neuropathy at chronic high-dose' },
      { slug: 'nitrofurantoin', effect: 'inhibitor', target: 'bacterial multi-target (nitroreductase-activated)', note: 'UTI-specific (urinary concentration); avoid CrCl <30 (subtherapeutic urinary levels); pulmonary fibrosis risk on chronic use' },
    ],
    refs: [],
  },
  {
    slug: 'mycobacterial_cell_envelope',
    name: 'Mycobacterial cell envelope + RNA polymerase',
    category: 'catabolism',
    systems: ['immune-hematologic', 'respiratory'],
    description: `Mycobacterial pharmacology is its own world — the waxy mycolic-acid cell envelope is impermeable to most antibiotics. The standard RIPE regimen for active TB: rifampin (RNA polymerase β-subunit, rpoB), isoniazid (KatG-activated → mycolic acid synthesis InhA inhibition), pyrazinamide (acidic-pH-dependent activation → membrane disruption), ethambutol (arabinosyl transferase, arabinogalactan synthesis). Rifampin is also a profound CYP3A4 + P-gp inducer (DDI perpetrator hot spot — authored Wave 2a v1.1 for buprenorphine + oxycodone). Rifabutin is a rifampin analog with somewhat less induction (used in HIV co-treatment when PI/INSTI DDIs are limiting). Rifaximin (gut-only rifamycin) is non-systemic and used for hepatic encephalopathy + traveler's diarrhea — local-acting despite the rifamycin class membership.`,
    steps: [
      { from: 'mycolic-acid-precursor', to: 'mycolic-acid', via: 'InhA (enoyl-ACP reductase) reduces precursor; INH-NAD adduct blocks this step' },
      { from: 'mycobacterial-rna-polymerase', to: 'mycobacterial-mrna', via: 'rifamycins bind β-subunit (rpoB) → transcription initiation arrest' },
    ],
    modulators: [
      { slug: 'isoniazid', effect: 'inhibitor', target: 'InhA (mycolic acid synthesis, KatG-activated prodrug)', note: 'TB first-line; hepatotoxicity + pyridoxine-deficiency neuropathy (B6 supplementation routine); CYP2E1 inhibitor; NAT2 polymorphic acetylation (fast/slow phenotypes)' },
      { slug: 'ethambutol', effect: 'inhibitor', target: 'arabinosyl transferase (arabinogalactan synthesis)', note: 'TB first-line; optic neuritis dose-related (color-vision testing during treatment)' },
      { slug: 'pyrazinamide', effect: 'inhibitor', target: 'membrane disruption (acidic-pH-activated)', note: 'TB first-line; uricemia (URAT1 inhibition); hepatotoxicity adds to INH risk' },
      { slug: 'rifabutin', effect: 'inhibitor', target: 'mycobacterial RNA polymerase β-subunit', note: 'rifamycin; less CYP3A4 induction vs rifampin (~40% lower); preferred with HIV PIs; uveitis at high doses' },
      { slug: 'rifaximin', effect: 'inhibitor', target: 'mycobacterial/enterobacteriaceal RNA polymerase β-subunit', note: 'non-absorbed rifamycin; hepatic encephalopathy + IBS-D + traveler diarrhea; local-acting in gut (no systemic CYP induction)' },
    ],
    refs: [],
  },
  {
    slug: 'fungal_ergosterol_biosynthesis',
    name: 'Fungal ergosterol biosynthesis + sterol-14α-demethylase',
    category: 'biosynthesis',
    systems: ['integumentary', 'immune-hematologic'],
    description: `Ergosterol is the fungal-specific membrane sterol (analog of mammalian cholesterol). Selective antifungal toxicity targets enzymes unique to fungi: azoles (fluconazole, itraconazole, voriconazole, posaconazole, ketoconazole, miconazole, clotrimazole) inhibit CYP51 (sterol-14α-demethylase) — depleting ergosterol + accumulating toxic 14α-methylsterols. Off-target hit on mammalian CYP3A4 explains the massive DDI surface for systemic azoles (itraconazole 20× midazolam AUC, etc.). Terbinafine + allylamines inhibit squalene epoxidase upstream → toxic squalene buildup. Hydroxypyridones (ciclopirox) chelate Fe/Al cofactors of multiple fungal enzymes. Polyenes (amphotericin B, nystatin) bind ergosterol directly → membrane pores.`,
    steps: [
      { from: 'lanosterol', to: 'ergosterol', via: 'CYP51 (sterol-14α-demethylase) + downstream desaturases/reductases; azole-blockade target' },
      { from: 'squalene', to: 'lanosterol', via: 'squalene epoxidase + lanosterol synthase; terbinafine blocks the epoxidase step' },
    ],
    modulators: [
      { slug: 'itraconazole', effect: 'inhibitor', target: 'fungal CYP51 (+ mammalian CYP3A4 strong)', note: 'systemic azole; canonical CYP3A4 perpetrator authored Wave 2a v1.1 (triazolam 27×, lovastatin 20× — contraindicated); HFrEF contraindication' },
      { slug: 'voriconazole', effect: 'inhibitor', target: 'fungal CYP51 (+ CYP3A4)', note: 'invasive aspergillosis first-line; CYP2C19 polymorphic clearance + CYP3A4 perpetrator (multi-DDI authored — sirolimus 11× AUC contraindicated, omeprazole 4×)' },
      { slug: 'posaconazole', effect: 'inhibitor', target: 'fungal CYP51 (+ CYP3A4)', note: 'broadest azole spectrum (Mucor + Zygomyces); food + low gastric pH required for tablet absorption (delayed-release formulation)' },
      { slug: 'terbinafine', effect: 'inhibitor', target: 'fungal squalene epoxidase', note: 'allylamine; onychomycosis first-line; CYP2D6 inhibitor (DDI authored Wave 2a v1.1: desipramine 5×); hepatotoxicity baseline LFTs' },
      { slug: 'clotrimazole', effect: 'inhibitor', target: 'fungal CYP51 (topical/oral azole)', note: 'topical for cutaneous candidiasis + tinea; oral troches for oropharyngeal thrush' },
      { slug: 'miconazole', effect: 'inhibitor', target: 'fungal CYP51', note: 'topical/intravaginal azole; minimal systemic absorption from intravaginal route (local-acting)' },
      { slug: 'ciclopirox', effect: 'inhibitor', target: 'fungal Fe/Al-cofactor enzymes (broad)', note: 'hydroxypyridone; topical nail lacquer for onychomycosis (poor PK as nail-penetration is the limit)' },
      { slug: 'efinaconazole', effect: 'inhibitor', target: 'fungal CYP51 (topical)', note: 'topical onychomycosis solution; superior nail penetration vs ciclopirox' },
    ],
    refs: [],
  },
  {
    slug: 'helminth_protozoa_targets',
    name: 'Anthelmintic + antiprotozoal targets',
    category: 'catabolism',
    systems: ['digestive', 'immune-hematologic'],
    description: `Parasites split into helminths (worms — nematodes, cestodes, trematodes) + protozoa (single-celled — Plasmodium, Trichomonas, Giardia, Entamoeba). Anthelmintic mechanisms exploit parasite-specific biology: ivermectin opens glutamate-gated chloride channels (insect/nematode-specific) → paralysis (avermectin class); benzimidazoles (albendazole, mebendazole) bind parasite β-tubulin selectively (low mammalian affinity) → microtubule disruption; praziquantel disrupts cestode/trematode tegument calcium homeostasis; pyrantel (covered as pk_unauthored local-acting) depolarizes neuromuscular junction. Antiprotozoals: artemisinin generates parasite-specific peroxide radicals in heme-rich Plasmodium digestive vacuole; hydroxychloroquine concentrates in the same acidic vacuole → heme polymerization block; quinine — historical cinchona alkaloid still used for chloroquine-resistant malaria; nitazoxanide blocks pyruvate-ferredoxin oxidoreductase (PFOR, anaerobe-specific).`,
    steps: [
      { from: 'parasite-targets', to: 'parasite-clearance', via: 'mechanism varies — ion channels, tubulin, mitochondrial function, heme polymerization' },
    ],
    modulators: [
      { slug: 'ivermectin', effect: 'activator', target: 'glutamate-gated Cl⁻ channels (invertebrate-specific)', note: 'macrocyclic lactone; onchocerciasis + strongyloides + scabies; mammalian GABA-A receptors are inaccessible due to BBB P-gp (mammalian safety margin)' },
      { slug: 'albendazole', effect: 'inhibitor', target: 'parasite β-tubulin', note: 'benzimidazole; broad anthelmintic; sulfoxide metabolite is the active species' },
      { slug: 'mebendazole', effect: 'inhibitor', target: 'parasite β-tubulin', note: 'benzimidazole; pinworm/whipworm/ascaris; minimal systemic absorption (~5%) — gut-active' },
      { slug: 'praziquantel', effect: 'activator', target: 'parasite Ca²⁺ channels (tegument)', note: 'schistosomiasis + cestodes; massive Ca²⁺ influx → tegument disruption + paralysis' },
      { slug: 'pyrantel-pamoate', effect: 'activator', target: 'parasite nAChR (depolarizing block)', note: 'pinworm/roundworm; pk_unauthored local-acting (pamoate-engineered for gut retention)' },
      { slug: 'nitazoxanide', effect: 'inhibitor', target: 'pyruvate-ferredoxin oxidoreductase (PFOR)', note: 'Cryptosporidium + Giardia; anaerobe-specific energy disruption' },
      { slug: 'artemisinin', effect: 'activator', target: 'heme-Fe radical generation (peroxide bridge)', note: 'P. falciparum; ACT (artemisinin combination therapy) gold standard for uncomplicated malaria; short t½ → combination prevents resistance' },
      { slug: 'hydroxychloroquine', effect: 'inhibitor', target: 'heme polymerization (parasite digestive vacuole)', note: 'malaria + lupus + RA; retinopathy at chronic dose (~5 mg/kg/d limit + screening); QT prolongation' },
      { slug: 'quinine', effect: 'inhibitor', target: 'heme polymerization', note: 'cinchona alkaloid; severe malaria; cinchonism (tinnitus + headache); hyperinsulinemia + hypoglycemia tail; CYP2D6 potent inhibitor' },
    ],
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p);
    added++;
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nAM cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
