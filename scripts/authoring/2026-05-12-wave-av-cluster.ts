/**
 * 2026-05-12-wave-av-cluster.ts — Antiviral cluster (AV-1..4).
 *
 *   AV-1 viral_polymerase_nucleoside_inhibition  NRTIs + acyclovir family +
 *                                                remdesivir + sofosbuvir +
 *                                                entecavir + ganciclovir
 *   AV-2 hiv_replication_blockade                NNRTIs + INSTIs + PIs
 *   AV-3 hcv_ns_replication                      NS3/4A + NS5A + NS5B
 *   AV-4 viral_protease_neuraminidase            flu + SARS-CoV-2
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
    slug: 'viral_polymerase_nucleoside_inhibition',
    name: 'Viral polymerase nucleoside/nucleotide analog inhibition',
    category: 'catabolism',
    systems: ['immune-hematologic'],
    description: `Nucleoside/nucleotide analogs are activated by stepwise phosphorylation (host or viral kinase) → triphosphate → incorporated by viral polymerase → chain termination (no 3'-OH) or fatal mutagenesis. Acyclovir family is selectively phosphorylated by HSV/VZV thymidine kinase (not host kinase) → herpes-specific. Tenofovir is acyclic nucleotide (already monophosphate) → fewer activation steps → HIV/HBV. NRTIs (zidovudine, abacavir, lamivudine, emtricitabine, etc.) terminate HIV RT. Sofosbuvir terminates HCV NS5B. Remdesivir + molnupiravir target the SARS-CoV-2 RdRp (different mechanisms — chain termination vs lethal mutagenesis). Entecavir terminates HBV polymerase. Ganciclovir is the CMV-active acyclovir analog (UL97 phosphorylation step).`,
    steps: [
      { from: 'nucleoside-analog', to: 'analog-triphosphate', via: 'stepwise phosphorylation by host or viral kinases — activation step' },
      { from: 'analog-triphosphate', to: 'viral-rna-dna-chain-termination', via: 'incorporated by viral polymerase → 3′-OH missing → no further elongation' },
    ],
    modulators: [
      { slug: 'acyclovir', effect: 'inhibitor', target: 'HSV/VZV DNA polymerase (TK-activated)', note: 'guanosine analog; HSV thymidine kinase phosphorylates selectively; poor PO F (~20%) — valacyclovir prodrug improves to 55%' },
      { slug: 'valacyclovir', effect: 'inhibitor', target: 'HSV/VZV DNA polymerase (prodrug → acyclovir)', note: 'L-valyl ester prodrug; 3-5× acyclovir PO F; same MOA + spectrum as parent' },
      { slug: 'famciclovir', effect: 'inhibitor', target: 'HSV/VZV DNA polymerase (prodrug → penciclovir)', note: 'penciclovir prodrug; longer intracellular t½ than acyclovir → tid dosing' },
      { slug: 'ganciclovir', effect: 'inhibitor', target: 'CMV DNA polymerase (UL97-activated)', note: 'CMV-active acyclovir analog; bone marrow + nephrotoxicity tail; ophthalmologic gel for CMV retinitis' },
      { slug: 'valganciclovir', effect: 'inhibitor', target: 'CMV DNA polymerase (prodrug → ganciclovir)', note: 'L-valyl ester prodrug; F 60% vs ganciclovir 6%; oral CMV prophylaxis in transplant' },
      { slug: 'entecavir', effect: 'inhibitor', target: 'HBV polymerase + reverse transcriptase', note: 'guanosine analog; HBV first-line; very high barrier to resistance; not effective for HIV monotherapy (chooses HBV)' },
      { slug: 'tenofovir-disoproxil', effect: 'inhibitor', target: 'HIV-1 reverse transcriptase + HBV polymerase (acyclic nucleotide)', note: 'TDF; renal + bone toxicity tail; HBV + HIV co-treatment standard' },
      { slug: 'tenofovir-alafenamide', effect: 'inhibitor', target: 'HIV/HBV reverse transcriptase/polymerase (acyclic nucleotide)', note: 'TAF; cleaner intracellular activation → lower systemic tenofovir → less renal/bone tail than TDF; HIV + HBV' },
      { slug: 'emtricitabine', effect: 'inhibitor', target: 'HIV reverse transcriptase (cytidine analog)', note: 'NRTI; bundled in TDF/TAF combos (Truvada, Descovy) for HIV + PrEP' },
      { slug: 'lamivudine', effect: 'inhibitor', target: 'HIV reverse transcriptase + HBV polymerase (cytidine analog)', note: 'older NRTI; first HBV oral; resistance develops on monotherapy' },
      { slug: 'abacavir', effect: 'inhibitor', target: 'HIV reverse transcriptase (guanosine analog)', note: 'NRTI; HLA-B*5701 mandatory pre-screen for hypersensitivity (severe reaction risk)' },
      { slug: 'sofosbuvir', effect: 'inhibitor', target: 'HCV NS5B polymerase (uridine analog)', note: 'pangenotypic HCV DAA backbone; combined with NS5A inhibitor for 8-12 week SVR cures' },
      { slug: 'remdesivir', effect: 'inhibitor', target: 'SARS-CoV-2 RdRp (delayed chain termination)', note: 'IV; broad coronavirus + Ebola; oral form not available' },
      { slug: 'molnupiravir', effect: 'inhibitor', target: 'SARS-CoV-2 RdRp (lethal mutagenesis)', note: 'oral; β-D-N⁴-hydroxycytidine analog; ambiguous base-pairing → error catastrophe; mutagenic-to-mammalian-cell signal limits chronic use' },
    ],
    refs: [],
  },
  {
    slug: 'hiv_replication_blockade',
    name: 'HIV replication cycle blockade (NNRTI / INSTI / PI)',
    category: 'catabolism',
    systems: ['immune-hematologic'],
    description: `HIV-1 replication targets beyond NRTIs (covered separately): NNRTIs bind RT in a non-competitive pocket → allosteric inhibition; INSTIs (raltegravir, dolutegravir, bictegravir, elvitegravir) inhibit integrase strand-transfer → block proviral DNA integration into host chromosome (the irreversible step); PIs (atazanavir, darunavir, lopinavir) inhibit HIV protease → immature noninfectious virions. Modern ART regimens combine 2 NRTIs + 1 anchor (INSTI preferred for safety; alternatively NNRTI or boosted PI). Cobicistat or ritonavir serve as PK boosters (CYP3A4 inhibition raises companion drug exposure — covered in CV/AM-as-perpetrator pathways).`,
    steps: [
      { from: 'hiv-rna', to: 'hiv-dna', via: 'reverse transcriptase — NRTI/NNRTI target' },
      { from: 'hiv-dna', to: 'proviral-integration', via: 'integrase strand-transfer — INSTI target' },
      { from: 'hiv-polyprotein', to: 'mature-virion', via: 'HIV protease cleaves Gag + Gag-Pol polyproteins — PI target' },
    ],
    modulators: [
      { slug: 'efavirenz', effect: 'inhibitor', target: 'HIV-1 reverse transcriptase (NNRTI, allosteric)', note: 'CNS side effects (vivid dreams) at initiation; CYP3A4 inducer + CYP2B6 polymorphic clearance' },
      { slug: 'etravirine', effect: 'inhibitor', target: 'HIV-1 reverse transcriptase (NNRTI, second-generation)', note: 'second-gen NNRTI; active against many efavirenz-resistant mutants; CYP3A4 substrate + CYP2C9/19 inhibitor' },
      { slug: 'doravirine', effect: 'inhibitor', target: 'HIV-1 reverse transcriptase (NNRTI, latest)', note: 'newer NNRTI; clean DDI profile; lipid-favorable vs efavirenz' },
      { slug: 'raltegravir', effect: 'inhibitor', target: 'HIV-1 integrase (strand transfer)', note: 'first INSTI (2007); bid; UGT1A1 substrate (rifampin AUC ↓ via UGT induction)' },
      { slug: 'dolutegravir', effect: 'inhibitor', target: 'HIV-1 integrase (second-gen INSTI)', note: 'high barrier to resistance; component of single-tablet regimen Triumeq + Dovato (dual therapy with 3TC)' },
      { slug: 'bictegravir', effect: 'inhibitor', target: 'HIV-1 integrase', note: 'in Biktarvy (BIC/FTC/TAF) single-tablet regimen; preferred first-line ART; no booster needed' },
      { slug: 'elvitegravir', effect: 'inhibitor', target: 'HIV-1 integrase', note: 'must be boosted with cobicistat — major CYP3A4 DDI surface; Stribild/Genvoya component' },
      { slug: 'darunavir', effect: 'inhibitor', target: 'HIV-1 protease', note: 'boosted PI; high genetic barrier; first-line PI when INSTI unsuitable; CYP3A4 substrate + inhibitor (boosted regimens)' },
      { slug: 'lopinavir', effect: 'inhibitor', target: 'HIV-1 protease', note: 'always co-formulated with ritonavir (Kaletra); historic CYP3A4 perpetrator workhorse' },
      { slug: 'atazanavir', effect: 'inhibitor', target: 'HIV-1 protease', note: 'PI; hyperbilirubinemia (UGT1A1 inhibition → indirect jaundice); boosted with ritonavir or cobicistat' },
      { slug: 'ritonavir', effect: 'inhibitor', target: 'HIV-1 protease + CYP3A4 (booster)', note: 'low-dose ritonavir works mainly as a CYP3A4 inhibitor → boosts companion PI/INSTI levels; cross-link: hiv_replication_blockade + many CYP DDI authored Wave 2a v1.1' },
      { slug: 'cobicistat', effect: 'inhibitor', target: 'CYP3A4 (pharmacokinetic booster)', note: 'no antiviral activity itself; same booster role as ritonavir without the antiviral baggage; midazolam 20× AUC authored Wave 2a v1.1' },
    ],
    refs: [],
  },
  {
    slug: 'hcv_ns_replication',
    name: 'HCV NS3/4A / NS5A / NS5B replication targets',
    category: 'catabolism',
    systems: ['digestive', 'immune-hematologic'],
    description: `Three antiviral targets in the HCV replication complex deliver pangenotypic 8-12 week cures: (1) NS3/4A serine protease — cleaves the HCV polyprotein into functional non-structural proteins (the -previrs); (2) NS5A protein — multifunctional in RNA replication + virion assembly (the -asvirs); (3) NS5B RNA-dependent RNA polymerase — nucleoside analog target (sofosbuvir, covered in AV-1) or non-nucleoside allosteric site (the -buvirs). Modern combinations (sofosbuvir/velpatasvir = Epclusa; sofosbuvir/ledipasvir = Harvoni; glecaprevir/pibrentasvir = Mavyret; elbasvir/grazoprevir = Zepatier) deliver >95% SVR12 across genotypes 1-6.`,
    steps: [
      { from: 'hcv-polyprotein', to: 'hcv-nonstructural-proteins', via: 'NS3/4A serine protease cleaves polyprotein; protease-inhibitor target' },
      { from: 'hcv-rna', to: 'hcv-rna-replication', via: 'NS5B RNA-dependent RNA polymerase + NS5A scaffolding' },
    ],
    modulators: [
      { slug: 'grazoprevir', effect: 'inhibitor', target: 'NS3/4A protease', note: 'protease inhibitor (-previr); Zepatier component with elbasvir; mild OATP1B1/3 inhibition' },
      { slug: 'glecaprevir', effect: 'inhibitor', target: 'NS3/4A protease', note: 'pangenotypic NS3/4A; Mavyret component with pibrentasvir; 8-week SVR in treatment-naive non-cirrhotic' },
      { slug: 'daclatasvir', effect: 'inhibitor', target: 'NS5A', note: 'first NS5A inhibitor (-asvir); pangenotypic; combined with sofosbuvir' },
      { slug: 'ledipasvir', effect: 'inhibitor', target: 'NS5A', note: 'NS5A; Harvoni component with sofosbuvir; genotype 1 dominant indication' },
      { slug: 'velpatasvir', effect: 'inhibitor', target: 'NS5A', note: 'pangenotypic NS5A; Epclusa + Vosevi component' },
      { slug: 'elbasvir', effect: 'inhibitor', target: 'NS5A', note: 'NS5A; Zepatier component with grazoprevir' },
      { slug: 'pibrentasvir', effect: 'inhibitor', target: 'NS5A', note: 'pangenotypic NS5A; Mavyret component with glecaprevir' },
    ],
    refs: [],
  },
  {
    slug: 'viral_protease_neuraminidase',
    name: 'Viral protease + neuraminidase (flu + SARS-CoV-2)',
    category: 'catabolism',
    systems: ['respiratory', 'immune-hematologic'],
    description: `Two non-polymerase viral targets with FDA-approved drugs. Influenza neuraminidase cleaves sialic acid linkages → releases progeny virions from infected cell surface; oseltamivir + zanamivir mimic the sialic-acid transition state → competitive inhibition. Effective if started within 48h of symptom onset; modest symptom-duration reduction (~1 day) + reduction in lower-respiratory complications. Baloxavir targets the influenza polymerase PA cap-dependent endonuclease — single-dose oral therapy (a different mechanism from the neuraminidase inhibitors). SARS-CoV-2 main protease (Mpro / nsp5) cleaves the polyprotein; nirmatrelvir is a covalent peptidomimetic Mpro inhibitor (always boosted with ritonavir as Paxlovid to inhibit CYP3A4 clearance of nirmatrelvir).`,
    steps: [
      { from: 'sialic-acid-on-cell-surface', to: 'flu-virion-release', via: 'influenza neuraminidase cleavage; oseltamivir competitive inhibitor target' },
      { from: 'sars-cov-2-polyprotein', to: 'sars-cov-2-functional-proteins', via: 'Mpro (nsp5) cleavage; nirmatrelvir covalent inhibitor target' },
    ],
    modulators: [
      { slug: 'oseltamivir', effect: 'inhibitor', target: 'influenza A/B neuraminidase (Tamiflu)', note: 'oral prodrug → oseltamivir carboxylate (active); 48-hour symptom-onset window for efficacy' },
      { slug: 'baloxavir', effect: 'inhibitor', target: 'influenza PA cap-dependent endonuclease', note: 'single-dose oral flu treatment; resistance mutations emerge during treatment in ~10% — combination evolution debated' },
      { slug: 'nirmatrelvir', effect: 'inhibitor', target: 'SARS-CoV-2 main protease (Mpro / nsp5)', note: 'covalent peptidomimetic; component of Paxlovid (boosted with ritonavir); 88% hospitalization reduction in EPIC-HR; CYP3A4 DDIs from the ritonavir component restrict use heavily' },
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
  console.log(`\nAV cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
