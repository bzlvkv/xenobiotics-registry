/**
 * 2026-05-12-wave-gi-cluster.ts — GI cluster (GI-1..3).
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
    slug: 'gastric_acid_secretion',
    name: 'Gastric acid secretion (H+/K+-ATPase + H2 + M3 + gastrin)',
    category: 'biosynthesis',
    systems: ['digestive'],
    description: `Parietal cells secrete HCl via the H+/K+-ATPase (proton pump) on the apical canalicular membrane. Three converging stimuli ramp the pump's activity: histamine (H2R, Gs → cAMP), acetylcholine (M3R, Gq → IP3 → Ca²⁺), gastrin (CCK2R, Gq). PPIs (omeprazole, pantoprazole, esomeprazole, lansoprazole, dexlansoprazole, rabeprazole) are acid-activated prodrugs that covalently inactivate the proton pump cysteine; effect outlasts plasma exposure. H2 blockers (famotidine, ranitidine — withdrawn 2020 for NDMA contamination, but slug retained) compete at H2R. M3 antagonists no longer used (broad anticholinergic side effects). Misoprostol is a PGE1 analog → mucosal cytoprotection + acid suppression; abortifacient at higher doses.`,
    steps: [
      { from: 'parietal-cell-stimulation', to: 'h-k-atpase-activation', via: 'histamine-H2/Gs, ACh-M3/Gq, gastrin-CCK2/Gq converge on apical pump' },
      { from: 'h-k-atpase-activation', to: 'gastric-hcl-secretion', via: 'H+ pumped into lumen → 1-4 M HCl in cannaliculi' },
    ],
    modulators: [
      { slug: 'omeprazole', effect: 'inhibitor', target: 'H+/K+-ATPase (PPI, covalent)', note: 'first PPI; racemic; CYP2C19 substrate (PMs ~2× exposure); CYP2C19-mediated DDI with clopidogrel (clinical impact debated); modafinil DDI Wave 2a v1.1' },
      { slug: 'esomeprazole', effect: 'inhibitor', target: 'H+/K+-ATPase (S-enantiomer of omeprazole)', note: 'S-enantiomer; slightly less CYP2C19-mediated variability; Nexium' },
      { slug: 'pantoprazole', effect: 'inhibitor', target: 'H+/K+-ATPase', note: 'PPI; less CYP-mediated DDI than omeprazole; IV form available for acute GI bleed' },
      { slug: 'lansoprazole', effect: 'inhibitor', target: 'H+/K+-ATPase', note: 'PPI; faster onset than omeprazole; ODT formulation' },
      { slug: 'dexlansoprazole', effect: 'inhibitor', target: 'H+/K+-ATPase (R-enantiomer with dual-release coating)', note: 'dual-delayed-release pellets → extended plasma profile → longer acid suppression' },
      { slug: 'rabeprazole', effect: 'inhibitor', target: 'H+/K+-ATPase', note: 'PPI; minimal CYP2C19 dependence (mostly non-enzymatic activation); cleaner DDI profile' },
      { slug: 'famotidine', effect: 'inhibitor', target: 'H2 receptor (gastric parietal)', note: 'H2 blocker; OTC; faster onset than PPIs but lower potency; tolerance develops on continuous use; no NDMA contamination (unlike ranitidine 2020 withdrawal)' },
      { slug: 'ranitidine', effect: 'inhibitor', target: 'H2 receptor', note: 'H2 blocker; withdrawn 2020 worldwide for NDMA contamination; slug retained for historical authoring' },
      { slug: 'misoprostol', effect: 'activator', target: 'PGE1 receptor (EP3 + EP4)', note: 'PGE1 analog; mucosal protection from NSAID gastropathy; uterotonic activity → abortion + labor induction off-label' },
      { slug: 'bismuth-subsalicylate', effect: 'inhibitor', target: 'multi-mechanism (mucosal coating + antimicrobial + antisecretory)', note: 'OTC for diarrhea + dyspepsia; component of H. pylori quadruple therapy; tongue/stool blackening from bismuth sulfide' },
    ],
    refs: [],
  },
  {
    slug: 'gi_motility_secretion',
    name: 'GI motility + secretion (CFTR / opioid / 5HT3 / 5HT4 / guanylate cyclase)',
    category: 'signaling',
    systems: ['digestive'],
    description: `Gut motility + secretion under multiple receptor controls. μ-opioid receptors on enteric neurons slow transit (constipating side effect of opioids; therapeutic for diarrhea via loperamide which is P-gp-extruded from brain). 5HT3 antagonism slows motility + reduces secretion; 5HT4 agonism (prucalopride — not in registry) increases motility. CFTR + guanylate cyclase C activators (lubiprostone — ClC-2; linaclotide + plecanatide — GC-C) increase intestinal chloride/water secretion → laxation. Osmotic laxatives (PEG, lactulose) draw water in by oncotic gradient. Bulk laxatives (psyllium not in registry). Antispasmodics (dicyclomine, hyoscyamine — anticholinergic) reduce smooth-muscle tone. Anti-emetics covered in serotonin (5-HT3) + dopamine (D2) pathways.`,
    steps: [
      { from: 'gut-receptor-stimulation', to: 'gi-motility-or-secretion', via: 'multiple receptors converge on neuronal + smooth-muscle + epithelial outputs' },
    ],
    modulators: [
      { slug: 'loperamide', effect: 'activator', target: 'μ-opioid receptor (gut-restricted via P-gp efflux)', note: 'OTC antidiarrheal; P-gp efflux at BBB → minimal CNS opioid effect at therapeutic doses; abuse case reports at supra-therapeutic doses (cardiotoxicity)' },
      { slug: 'diphenoxylate-atropine', effect: 'activator', target: 'μ-opioid + muscarinic antagonist (combo)', note: 'Lomotil; atropine sub-therapeutic dose discourages abuse; controlled-substance schedule V' },
      { slug: 'eluxadoline', effect: 'activator', target: 'μ-opioid agonist + δ-opioid antagonist (gut-restricted)', note: 'IBS-D; minimal systemic absorption; pancreatitis risk in cholecystectomized patients (boxed warning)' },
      { slug: 'lubiprostone', effect: 'activator', target: 'ClC-2 chloride channels (intestinal apical)', note: 'chronic idiopathic constipation + IBS-C; opioid-induced constipation; minimal systemic absorption' },
      { slug: 'linaclotide', effect: 'activator', target: 'guanylate cyclase-C (GC-C)', note: 'IBS-C + CIC; raises intestinal cGMP → CFTR activation + visceral analgesia; gut-restricted (minimal systemic exposure)' },
      { slug: 'polyethylene-glycol', effect: 'activator', target: 'osmotic laxative (no receptor target)', note: 'PEG 3350 (MiraLAX); inert polymer; binds water + transit unchanged through gut; chronic use safe; colonoscopy prep at higher volumes' },
      { slug: 'lactulose', effect: 'activator', target: 'osmotic + colonic bacterial metabolism (NH3 trap)', note: 'osmotic laxative + hepatic encephalopathy (bacterial conversion to lactate + acetate traps NH4+); flatulence from gas production' },
      { slug: 'docusate', effect: 'activator', target: 'surfactant stool softener (mechanism debated)', note: 'sodium docusate; widely used despite weak evidence for chronic constipation' },
      { slug: 'orlistat', effect: 'inhibitor', target: 'pancreatic + gastric lipase (gut-restricted)', note: 'Xenical/Alli; reduces dietary fat absorption ~30%; steatorrhea + flatulence; fat-soluble vitamin malabsorption' },
      { slug: 'simethicone', effect: 'activator', target: 'surface tension reducer (no receptor)', note: 'OTC anti-gas; coalesces small bubbles; pk_unauthored:local-acting (zero systemic absorption)' },
      { slug: 'acarbose', effect: 'inhibitor', target: 'α-glucosidase (gut-restricted)', note: 'T2DM; delays carbohydrate absorption → blunts postprandial glucose excursion; flatulence + diarrhea common' },
      { slug: 'pancrelipase', effect: 'activator', target: 'exocrine pancreatic enzyme replacement (lipase + protease + amylase)', note: 'CF + chronic pancreatitis; enzyme-replacement therapy taken with meals; enteric-coated to survive gastric acid' },
    ],
    refs: [],
  },
  {
    slug: 'ibd_mucosal_immunomodulation',
    name: 'IBD mucosal immunomodulation',
    category: 'signaling',
    systems: ['digestive', 'immune-hematologic'],
    description: `Inflammatory bowel disease (Crohn's, UC) is driven by dysregulated mucosal immunity — TNF-α + IL-12/23 + IL-17 + α4β7 integrin trafficking + IL-23/Th17. Treatment escalates from local-acting (5-ASA — mesalamine, sulfasalazine in UC) to budesonide (ileal-targeted GR — covered in END-1) to systemic immunosuppression (thiopurines azathioprine + methotrexate — covered in ONC-3) to biologics (TNF-α: infliximab/adalimumab/golimumab/certolizumab; IL-12/23: ustekinumab; IL-23: risankizumab; integrin: vedolizumab — α4β7-selective gut-restricted; S1P modulator: ozanimod). Mesalamine + sulfasalazine (5-ASA prodrug release in colon) dominate maintenance for UC; the active 5-aminosalicylic acid is locally anti-inflammatory via PPAR-γ + NF-κB + COX inhibition.`,
    steps: [
      { from: 'gut-luminal-antigens', to: 'mucosal-immune-activation', via: 'breach of barrier + dysbiosis → IL-23/Th17 + TNF-α-dominant inflammation' },
    ],
    modulators: [
      { slug: 'mesalamine', effect: 'inhibitor', target: '5-aminosalicylic acid (PPAR-γ + COX + NF-κB locally)', note: 'UC maintenance; delayed-release / pH-targeted / colonic-release formulations; topical effect — minimal systemic absorption' },
      { slug: 'sulfasalazine', effect: 'inhibitor', target: '5-ASA delivery (azoreductase-cleaved in colon)', note: 'colon bacterial azoreductase cleaves into 5-ASA (active) + sulfapyridine (side effects + DDIs); UC + RA + AS' },
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
    data.push(p); bySlug.set(p.slug, p); added++;
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nGI cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
