/**
 * 2026-05-27-wave33-respiratory-pathways.ts — add 3 airway/lung-specific
 * pathways to fill the under-covered respiratory system (was 11, mostly
 * general pathways tagged respiratory).
 *
 *   pulmonary_arterial_hypertension — the 3 PAH drug axes (NO–sGC–cGMP / PDE5,
 *     endothelin–ETA, prostacyclin–IP). Modulators: sildenafil, tadalafil,
 *     riociguat, macitentan, bosentan (all in registry).
 *   airway_smooth_muscle_tone — bronchodilation (β2→cAMP) vs bronchoconstriction
 *     (M3, CysLT1), + PDE and ICS. 11 registry modulators (SABA/LABA, SAMA/LAMA,
 *     theophylline, roflumilast, montelukast, budesonide, fluticasone).
 *   cough_reflex — the cough arc + central antitussives (dextromethorphan, codeine).
 *
 * Mechanistic/educational pathways (standard pharmacology) — described in prose,
 * no per-step PMIDs (the notes-only convention); refs left empty rather than
 * cite fabricated reviews. Steps use free-text biology nodes (soft data-lint
 * cross-ref warnings, as for all pathways). Modulators reference real slugs.
 *
 * CFTR and mucolytic pathways were considered but SKIPPED — their modulators
 * (ivacaftor/lumacaftor/tezacaftor; dornase/carbocisteine) aren't in the
 * registry yet, so the pathways would have no compound links.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const mod = (slug: string, effect: string, target: string) => ({ slug, effect, target });

const NEW = [
  {
    slug: 'pulmonary_arterial_hypertension',
    name: 'Pulmonary arterial hypertension — vasodilator axes',
    category: 'disease_cascade',
    systems: ['respiratory', 'cardiovascular'],
    description:
      'PAH is progressive pulmonary vascular remodeling + vasoconstriction → ↑pulmonary vascular resistance → right-ventricular failure. Three endothelial imbalances are the therapeutic targets. (1) NO–sGC–cGMP: endothelial dysfunction lowers nitric oxide → less soluble guanylate cyclase (sGC) activity → less cGMP (a vasodilator second messenger). PDE5 — highly expressed in lung — degrades cGMP, so PDE5 inhibitors (sildenafil, tadalafil) and the direct sGC stimulator riociguat raise cGMP. (2) Endothelin-1: overexpressed in PAH, drives ETA-mediated vasoconstriction + smooth-muscle proliferation → endothelin receptor antagonists (bosentan, macitentan, ambrisentan). (3) Prostacyclin (PGI2): deficient; IP-receptor activation raises cAMP → vasodilation + antiproliferation → prostacyclin analogs (epoprostenol, treprostinil, iloprost) and the IP agonist selexipag. Cross-links: pde5, eta, cyclic-nucleotide signaling.',
    steps: [
      { from: 'endothelial-dysfunction', to: 'reduced-NO-cGMP', via: '↓eNOS → ↓NO → ↓sGC activity → ↓cGMP', note: 'Pulmonary endothelial dysfunction lowers nitric oxide, reducing soluble guanylate cyclase activity and the vasodilator cGMP — promoting pulmonary vasoconstriction and remodeling.' },
      { from: 'cGMP', to: 'pulmonary-vasodilation', via: 'PKG → ↓cytosolic Ca²⁺ → ASM relaxation; PDE5 degrades cGMP', note: 'cGMP relaxes pulmonary arterial smooth muscle via PKG. PDE5 degrades it — so PDE5 inhibitors (sildenafil, tadalafil) and the sGC stimulator riociguat both raise cGMP to vasodilate. Cross-link: pde5.' },
      { from: 'endothelin-1', to: 'pulmonary-vasoconstriction', via: 'ET-1 → ETA receptor → Gq → vasoconstriction + proliferation', note: 'Endothelin-1 is overexpressed in PAH; via the ETA receptor it drives vasoconstriction and vascular remodeling. Endothelin receptor antagonists (bosentan, macitentan) block it. Cross-link: eta.' },
      { from: 'prostacyclin-PGI2', to: 'pulmonary-vasodilation', via: 'PGI2 → IP receptor → Gs → cAMP → relaxation + antiproliferation', note: 'Prostacyclin is deficient in PAH; IP-receptor activation raises cAMP → vasodilation, antiproliferation, and antiplatelet effects. Prostacyclin analogs and the IP agonist selexipag supplement this axis (those agents not yet in the registry).' },
      { from: 'elevated-pulmonary-vascular-resistance', to: 'right-ventricular-failure', via: 'chronic ↑PVR → RV pressure overload → hypertrophy → failure', note: 'The combined deficits (↓NO/cGMP, ↑ET-1, ↓PGI2) raise pulmonary vascular resistance and overload the right ventricle — the usual cause of death in PAH. The three drug classes each correct one axis and are often combined.' },
    ],
    modulators: [
      mod('sildenafil', 'inhibitor', 'PDE5 → ↑cGMP → pulmonary vasodilation'),
      mod('tadalafil', 'inhibitor', 'PDE5 → ↑cGMP (once-daily PAH dosing)'),
      mod('riociguat', 'activator', 'soluble guanylate cyclase (sGC) → ↑cGMP directly'),
      mod('macitentan', 'inhibitor', 'endothelin ETA receptor → blocks ET-1 vasoconstriction'),
      mod('bosentan', 'inhibitor', 'endothelin ETA/ETB receptor → blocks ET-1 vasoconstriction'),
    ],
    refs: [],
    domains: ['respiratory', 'cardiometabolic'],
  },
  {
    slug: 'airway_smooth_muscle_tone',
    name: 'Airway smooth-muscle tone (bronchodilation ↔ bronchoconstriction)',
    category: 'signaling',
    systems: ['respiratory'],
    description:
      'Bronchial smooth-muscle tone balances bronchoconstriction against bronchodilation. CONSTRICTORS: vagal acetylcholine → M3 muscarinic → Gq → PLC → IP3/Ca²⁺ → contraction + mucus; cysteinyl-leukotrienes (LTD4) → CysLT1; histamine. DILATORS: β2-adrenoceptor → Gs → adenylate cyclase → cAMP → PKA → relaxation. Therapeutics map onto these: β2 agonists — short-acting salbutamol (rescue), long-acting salmeterol / formoterol / vilanterol (maintenance); antimuscarinics — short-acting ipratropium, long-acting tiotropium (COPD mainstay); methylxanthine theophylline + PDE4 inhibitor roflumilast raise cAMP / cut inflammation; CysLT1 antagonist montelukast; and inhaled corticosteroids (budesonide, fluticasone) suppress the upstream eosinophilic inflammation that drives bronchial hyperreactivity. Cross-links: beta_2, muscarinic, cyslt1, pde4, asthma_th2_eosinophil_inflammation.',
    steps: [
      { from: 'beta2-adrenoceptor', to: 'bronchodilation', via: 'β2 → Gs → adenylate cyclase → cAMP → PKA → ASM relaxation', note: 'β2-agonists raise airway smooth-muscle cAMP, relaxing it. SABA (salbutamol) for rescue; LABA (salmeterol, formoterol, vilanterol) for maintenance, always paired with an ICS in asthma. Cross-link: beta_2.' },
      { from: 'M3-muscarinic-receptor', to: 'bronchoconstriction', via: 'ACh → M3 → Gq → PLC → IP3/Ca²⁺ → ASM contraction + mucus secretion', note: 'Vagal acetylcholine constricts airways via M3. Antimuscarinics block it — short-acting ipratropium and long-acting tiotropium (a COPD mainstay). Cross-link: muscarinic.' },
      { from: 'cysteinyl-leukotriene-LTD4', to: 'bronchoconstriction', via: 'LTD4 → CysLT1 → bronchoconstriction + mucus + microvascular leak', note: 'Cysteinyl-leukotrienes are potent bronchoconstrictors; the CysLT1 antagonist montelukast blocks them (asthma, exercise-induced bronchoconstriction, allergic rhinitis). Cross-links: cyslt1, mast_cell_leukotriene_axis.' },
      { from: 'airway-cAMP', to: 'bronchodilation', via: 'PDE3/4 degrade cAMP; theophylline (non-selective PDE-i + adenosine antagonist) + roflumilast (PDE4-i) inhibit → ↑cAMP', note: 'Phosphodiesterases degrade airway cAMP. Theophylline raises cAMP and antagonizes bronchoconstrictor adenosine; roflumilast (PDE4 inhibitor) reduces inflammation in severe COPD. Cross-link: pde4.' },
      { from: 'airway-eosinophilic-inflammation', to: 'reduced-bronchial-hyperreactivity', via: 'inhaled corticosteroid → glucocorticoid receptor → ↓Th2 cytokine transcription', note: 'Inhaled corticosteroids (budesonide, fluticasone) suppress the eosinophilic inflammation underlying bronchial hyperreactivity — the controller backbone of asthma. Cross-link: asthma_th2_eosinophil_inflammation.' },
    ],
    modulators: [
      mod('salbutamol', 'activator', 'β2-adrenoceptor → ↑cAMP → bronchodilation (SABA, rescue)'),
      mod('salmeterol', 'activator', 'β2-adrenoceptor (LABA, maintenance)'),
      mod('formoterol', 'activator', 'β2-adrenoceptor (LABA, fast-onset)'),
      mod('vilanterol', 'activator', 'β2-adrenoceptor (ultra-LABA, once-daily)'),
      mod('ipratropium', 'inhibitor', 'M3 muscarinic receptor → ↓bronchoconstriction (SAMA)'),
      mod('tiotropium', 'inhibitor', 'M3 muscarinic receptor (LAMA, COPD mainstay)'),
      mod('theophylline', 'inhibitor', 'phosphodiesterase + adenosine receptor → ↑cAMP, bronchodilation'),
      mod('roflumilast', 'inhibitor', 'PDE4 → ↑cAMP, anti-inflammatory (severe COPD)'),
      mod('montelukast', 'inhibitor', 'CysLT1 → blocks leukotriene bronchoconstriction'),
      mod('budesonide', 'inhibitor', 'GR (ICS) → ↓airway inflammation'),
      mod('fluticasone', 'inhibitor', 'GR (ICS) → ↓airway inflammation'),
    ],
    refs: [],
    domains: ['respiratory'],
  },
  {
    slug: 'cough_reflex',
    name: 'Cough reflex arc + central antitussives',
    category: 'signaling',
    systems: ['respiratory', 'nervous'],
    description:
      'The cough reflex protects the airway. AFFERENT limb: irritants, mucus, or inflammation activate vagal sensory afferents — C-fibers (via TRPV1/TRPA1) and rapidly-adapting receptors — which relay through the nucleus tractus solitarius to a medullary cough-generating network. EFFERENT limb: the cough center drives a coordinated deep inspiration, glottic closure, and forced expiration. Central antitussives suppress the brainstem cough network: dextromethorphan (sigma-1 / NMDA modulator, non-opioid) and codeine (μ-opioid agonist; also a morphine prodrug). Peripheral protussives/mucolytics act on the airway side instead. Cross-link: mu_opioid.',
    steps: [
      { from: 'airway-irritant', to: 'sensory-afferent-activation', via: 'irritant/mechanical → TRPV1 / TRPA1 on vagal C-fibers + rapidly-adapting receptors', note: 'Irritants, mucus, or airway inflammation activate vagal sensory afferents — the trigger limb of the cough reflex.' },
      { from: 'sensory-afferent', to: 'medullary-cough-center', via: 'vagus → nucleus tractus solitarius → brainstem cough-generating network', note: 'Afferents relay through the NTS to a medullary network that organizes the motor cough.' },
      { from: 'cough-center', to: 'cough-motor-output', via: 'efferent → inspiration + glottic closure + forced expiration', note: 'The cough center coordinates the cough. Central antitussives dampen this network: dextromethorphan (sigma-1/NMDA, non-opioid) and codeine (μ-opioid). Cross-link: mu_opioid.' },
    ],
    modulators: [
      mod('dextromethorphan', 'inhibitor', 'central cough center (sigma-1 / NMDA) → ↓cough, non-opioid antitussive'),
      mod('codeine', 'inhibitor', 'central cough center via μ-opioid agonism → ↓cough'),
    ],
    refs: [],
    domains: ['respiratory'],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Record<string, unknown>[];
  const have = new Set(data.map(p => p.slug));
  let added = 0; const skip: string[] = [];
  for (const p of NEW) {
    if (have.has(p.slug)) { skip.push(p.slug); continue; }
    data.push(p);
    console.log(`  [add ] ${p.slug.padEnd(34)} ${p.steps.length} steps · ${p.modulators.length} modulators`);
    added++;
  }
  data.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 33: +${added} respiratory pathways (${skip.length ? 'skipped ' + skip.join(', ') : 'none skipped'}).`);
}

main();
