/**
 * 2026-05-11-wave-5a-pathway-stubs.ts — Compound stubs for nodes
 * referenced by the v1.2 Wave 5a pathway scaffolding (v1.2 staging).
 *
 * The initial 3 pathways in data/pathways.json reference 2 biochemistry
 * intermediates that aren't in the compound catalog because they're not
 * dosable drugs in their own right. The pathway loader allows free-text
 * step references, but data-lint surfaces a warning when nodes don't
 * resolve. Adding minimal stubs eliminates those warnings.
 *
 * ── Stubs added ───────────────────────────────────────────────────
 *
 *   paraxanthine    1,7-dimethylxanthine — major CYP1A2 metabolite of
 *                   caffeine (~84% of caffeine clearance). Stimulant +
 *                   adenosine receptor antagonist in its own right;
 *                   responsible for late-half-life caffeine effects.
 *                   Endogenous via caffeine; pure paraxanthine has been
 *                   trialed as a nootropic with cleaner side-effect
 *                   profile than caffeine.
 *
 *   epinephrine     Adrenaline. Endogenous catecholamine produced in
 *                   the adrenal medulla + brainstem PNMT-expressing
 *                   neurons. Clinically used as IV/IM bolus for
 *                   anaphylaxis, ACLS cardiac arrest (1 mg q3-5 min),
 *                   septic shock, and as local-anesthetic vasoconstrictor.
 *                   Distinct slug from "norepinephrine" — same precursor
 *                   chain.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  routes?: string[];
  doses?: Record<string, { min: number; max: number; typical: number }>;
  mw_g_mol?: number;
  systems?: string[];
  [k: string]: unknown;
}

const PARAXANTHINE: Compound = {
  slug: 'paraxanthine',
  name: 'Paraxanthine',
  aliases: ['1,7-dimethylxanthine', '17X', '17DMX'],
  category: 'alkaloid',
  mechanism: 'Major (≈84%) CYP1A2 metabolite of caffeine — N3-demethylated to 1,7-dimethylxanthine. A non-selective adenosine receptor antagonist (Ki at A1/A2A within 2-3× of caffeine itself) and a phosphodiesterase inhibitor. Responsible for a substantial fraction of caffeine\'s late-half-life CNS effects since paraxanthine accumulates in plasma while caffeine drops. Trialed as a stand-alone supplement / nootropic with claims of cleaner subjective tolerability than caffeine — less anxiogenic effect at equivalent A2A occupancy.',
  routes: ['PO'],
  doses: { PO: { min: 50, max: 300, typical: 100 } },
  mw_g_mol: 180.16,
  systems: ['nervous'],
};

const EPINEPHRINE: Compound = {
  slug: 'epinephrine',
  name: 'Epinephrine',
  aliases: ['adrenaline', 'EpiPen'],
  category: 'pharmacological',
  mechanism: 'Endogenous catecholamine and emergency drug. Mixed α1/α2/β1/β2/β3 agonist (with higher β-affinity than norepinephrine due to the N-methyl group added by PNMT). Endogenously synthesized in adrenal medulla + brainstem PNMT-expressing neurons under sympathetic activation. Clinical use: IM anaphylaxis (0.3-0.5 mg adult / 0.15 mg pediatric), ACLS cardiac arrest (1 mg IV q3-5 min), septic shock vasopressor, local-anesthetic vasoconstrictor (with lidocaine to extend block + reduce systemic absorption), nebulized for upper-airway croup. Extremely short t½ (~2-3 min IV) due to rapid MAO/COMT degradation — bolus or infusion only.',
  routes: ['IM', 'IV', 'SC', 'INH'],
  doses: { IM: { min: 0.15, max: 0.5, typical: 0.3 }, IV: { min: 0.05, max: 1.0, typical: 1.0 } },
  mw_g_mol: 183.20,
  systems: ['cardiovascular', 'nervous', 'endocrine'],
};

const RASAGILINE: Compound = {
  slug: 'rasagiline',
  name: 'Rasagiline',
  aliases: ['Azilect', 'TVP-1012'],
  category: 'pharmacological',
  mechanism: 'Selective irreversible MAO-B inhibitor for Parkinson disease (monotherapy in early disease or adjunct to levodopa). Propargylamine class — same pharmacophore family as selegiline but no amphetamine-like metabolites (rasagiline metabolizes to 1-aminoindan, which is neuroprotective in some preclinical models — vs selegiline → methamphetamine + amphetamine). Once-daily 0.5-1 mg PO. CYP1A2 substrate (fluvoxamine + ciprofloxacin DDIs documented in label, but no abstract-verbatim AUC ratio per v1.1 GAPS). Selectivity for MAO-B is dose-dependent — at supratherapeutic doses loses selectivity, raises tyramine hypertensive crisis risk.',
  routes: ['PO'],
  doses: { PO: { min: 0.5, max: 1, typical: 1 } },
  mw_g_mol: 171.24,
  systems: ['nervous'],
};

const TRANEXAMIC_ACID: Compound = {
  slug: 'tranexamic-acid',
  name: 'Tranexamic acid',
  aliases: ['TXA', 'Lysteda', 'Cyklokapron'],
  category: 'pharmacological',
  mechanism: 'Antifibrinolytic — synthetic lysine analog that competitively inhibits the lysine-binding sites on plasminogen, blocking its conversion to plasmin + plasmin-mediated fibrin degradation. Clinical use: heavy menstrual bleeding (PO), surgical bleeding (IV — orthopedic, cardiac, trauma; CRASH-2 + CRASH-3 trials showed mortality reduction in trauma + TBI when given within 3 hours), postpartum hemorrhage (WOMAN trial), epistaxis (topical), hereditary angioedema. T½ ~2 h, renally cleared. Contraindicated in active intravascular clotting + acquired defective color vision. Distinct from the topical cosmetic application (tranexamic-acid-topical slug) which targets PAR-2 in melanocytes for hyperpigmentation.',
  routes: ['PO', 'IV'],
  doses: { PO: { min: 500, max: 1500, typical: 1300 }, IV: { min: 10, max: 1000, typical: 1000 } },
  mw_g_mol: 157.21,
  systems: ['immune-hematologic'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0;
  for (const c of [PARAXANTHINE, EPINEPHRINE, TRANEXAMIC_ACID, RASAGILINE]) {
    if (bySlug.has(c.slug)) {
      console.log(`  [skip] ${c.slug} already in registry`);
    } else {
      data.push(c);
      added++;
      console.log(`  [add ] ${c.slug.padEnd(16)} (new, mw=${c.mw_g_mol})`);
    }
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 5a pathway-node stubs: +${added} compounds.`);
}

main();
