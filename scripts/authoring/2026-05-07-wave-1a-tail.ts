/**
 * 2026-05-07-wave-1a-tail.ts — closes the 4-compound v1.0 Wave 1a gap.
 *
 * Audit on 2026-05-07 found 11 of the canonical top-prescribed list missing
 * from the registry. After excluding correctly-handled cases (4 inhaled/
 * topical compounds already pk_unauthored=local-acting, 1 already-skipped
 * butalbital, 2 combo/formulation variants), 4 real gaps remained:
 *
 *   - albuterol           — inhaled β2-agonist (Ventolin/ProAir/Proventil)
 *   - amphetamine         — psychostimulant (Adderall component)
 *   - testosterone        — base hormone (distinct from ester formulations)
 *   - potassium-chloride  — electrolyte supplement
 *
 * All four added as stubs with pk_unauthored. None are good single-PK-author
 * targets:
 *   - albuterol: inhaled route is local-acting (lung); systemic PK is not
 *     the relevant exposure metric.
 *   - amphetamine: the registered ester-free compound; clinically logged
 *     as Adderall (mixed amphetamine salts) or Vyvanse (lisdexamfetamine
 *     prodrug). Route+salt formulation drives PK.
 *   - testosterone: parent compound; clinically logged as testosterone-
 *     cypionate (IM depot, authored), -enanthate, -undecanoate (PO with
 *     lymphatic absorption — already skipped to AUTHORING_GAPS), or
 *     transdermal gel/patch. Each ester/formulation has its own PK.
 *   - potassium-chloride: electrolyte; PK is not the right model (plasma
 *     K+ is homeostatically regulated, not dose-AUC-driven).
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
  [k: string]: unknown;
}

const ENTRIES: Compound[] = [
  {
    slug: 'albuterol',
    name: 'Albuterol',
    aliases: ['Salbutamol', 'Ventolin', 'ProAir', 'Proventil'],
    category: 'pharmacological',
    mechanism:
      'Short-acting β2-adrenergic agonist (SABA). Activates β2 receptors on bronchial smooth muscle → cAMP rise → relaxation, used for acute bronchospasm in asthma/COPD. Onset ~5 min via MDI, peak ~30-90 min, duration 3-6 h. Inhaled is the dominant route; oral has higher systemic exposure but slower onset and more β1 cross-effect.',
    routes: ['IN', 'PO'],
    doses: { IN: { min: 90, max: 720, typical: 180 }, PO: { min: 2000, max: 8000, typical: 4000 } },
    mw_g_mol: 239.32,
    systems: ['respiratory'],
    pk_unauthored: {
      reason: 'local-acting',
      note: 'Inhaled (MDI/nebulizer) is the dominant clinical route — drug acts locally on bronchial smooth muscle. Systemic absorption from inhaled dose is ~10-20% but the relevant exposure is airway-deposited, not plasma. PO route exists but is rarely used (slow onset, more cardiac side effects).',
    },
    refs: [],
  },
  {
    slug: 'amphetamine',
    name: 'Amphetamine',
    aliases: ['DL-amphetamine', 'racemic amphetamine', 'Adderall component'],
    category: 'stimulant',
    mechanism:
      'CNS stimulant; releases dopamine and norepinephrine from presynaptic vesicles via VMAT2 reversal + reuptake inhibition (DAT/NET). Used for ADHD and narcolepsy. Clinically logged as mixed amphetamine salts (Adderall: 75% d-, 25% l-amphetamine) or lisdexamfetamine prodrug (Vyvanse → d-amphetamine).',
    routes: ['PO'],
    doses: { PO: { min: 5, max: 30, typical: 20 } },
    mw_g_mol: 135.21,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'mixture',
      note: 'Parent slug; clinical use is via formulation-specific entries. d- and l-amphetamine have distinct PK (d- has 3-4× higher CNS potency at DAT). Mixed amphetamine salts (Adderall) and lisdexamfetamine prodrug (Vyvanse) should be authored as separate slugs with formulation-specific PK rather than aggregating onto this parent.',
    },
    refs: [],
  },
  {
    slug: 'testosterone',
    name: 'Testosterone',
    aliases: ['T', 'androgen', 'free testosterone'],
    category: 'hormone',
    mechanism:
      'Primary male androgen, agonist at androgen receptor (AR). Endogenous gonadal hormone; therapeutically used as testosterone replacement (TRT) via various ester / formulation routes since the free hormone has near-zero PO F (extensive first-pass).',
    routes: ['IM', 'TD', 'SC', 'IN', 'PO'],
    doses: { IM: { min: 50, max: 200, typical: 100 }, TD: { min: 20, max: 100, typical: 50 } },
    mw_g_mol: 288.42,
    systems: ['endocrine', 'reproductive', 'musculoskeletal'],
    pk_unauthored: {
      reason: 'mixture',
      note: 'Parent hormone slug; clinical TRT uses formulation-specific entries: testosterone-cypionate (IM depot, authored), -enanthate, -undecanoate (PO lymphatic-absorbed, skipped — AUTHORING_GAPS), transdermal gel (Androgel), patch (Androderm), pellet (Testopel). PO route has near-zero F (first-pass) — TRT is never given as free PO testosterone. Author formulation-specific PK on each ester/route slug rather than this parent.',
    },
    refs: [],
  },
  {
    slug: 'potassium-chloride',
    name: 'Potassium chloride',
    aliases: ['KCl', 'K-Dur', 'Klor-Con', 'potassium replacement'],
    category: 'mineral',
    mechanism:
      'Electrolyte replacement for hypokalemia (loop/thiazide diuretic-induced, vomiting, hyperaldosteronism). Plasma K+ is homeostatically regulated by renin-aldosterone-distal nephron and Na+/K+ ATPase — total-body K+ is intracellular, plasma reflects only ~2%. Therapeutic range narrow (3.5-5.0 mmol/L); toxicity above ~6 causes cardiac arrhythmia.',
    routes: ['PO', 'IV'],
    doses: { PO: { min: 600, max: 3000, typical: 1500 }, IV: { min: 10, max: 40, typical: 20 } },
    mw_g_mol: 74.55,
    systems: ['cardiovascular', 'renal'],
    pk_unauthored: {
      reason: 'mixture',
      note: 'Plasma [K+] is homeostatically regulated; PK in the sense of dose→Cmax→AUC doesn\'t apply. Therapeutic monitoring is by serum potassium concentration vs. reference range, not Cp(t) curve modeling. Solver should treat as a "monitor target," not a kinetic compartment.',
    },
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0;
  for (const e of ENTRIES) {
    if (bySlug.has(e.slug)) {
      alreadyHas++;
      console.log(`  [skip] ${e.slug} already exists`);
      continue;
    }
    data.push(e);
    added++;
    console.log(`  [add ] ${e.slug.padEnd(22)} cat=${e.category} pk_unauthored=${(e.pk_unauthored as { reason: string }).reason}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 1a tail: added ${added} compounds, already-had ${alreadyHas}.`);
  console.log(`Top-prescribed coverage now: 91/98 (was 87/98). Remaining 7 gaps are correctly handled (local-acting topicals/inhalants + butalbital skip + combo/formulation variants).`);
}

main();
