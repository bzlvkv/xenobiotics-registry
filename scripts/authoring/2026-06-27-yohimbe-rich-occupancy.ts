/**
 * 2026-06-27-yohimbe-rich-occupancy.ts
 *
 * Depth upgrade for the 2026-06-27 yohimbe wave: turns the rauwolscine skeleton
 * into a full Hill-occupancy entry, and enriches ajmalicine's mechanism with a
 * cited enzyme-inhibition fact. Idempotent (skips if already applied).
 *
 * ── rauwolscine → receptor_occupancy (GtoPdb-curated) ──────────────────────
 * Source = IUPHAR/BPS Guide to PHARMACOLOGY (ligand 136), the same curated DB the
 * registry uses for yohimbine's α₂A row. Human antagonist affinities:
 *   α₂A  pKi 8.4  → Ki 3.98 nM   PMID:7996470  (tabular antagonist value — same
 *   α₂B  pKi 8.3  → Ki 5.01 nM   PMID:7996470   paper as yohimbine's α₂A)
 *   α₂C  pKi 9.1  → Ki 0.79 nM   PMID:7996470  (rauwolscine's highest α₂ affinity)
 *   5-HT₂B pKi 7.8–8.4 (mid 8.1) → Ki 7.94 nM  PMID:9459568  (rauwolscine IS the
 *          named subject here: "[³H]Rauwolscine: an antagonist radioligand for the
 *          cloned human 5-HT2B receptor")
 * ec50_mg_l = Ki[nM] × MW(354.4) / 1e6. emax=1 + pathway 'antagonist' follow the
 * registry's antagonist-occupancy convention (cf. yohimbine α₂A). keo is a
 * documented APPROXIMATION (no measured kₑₒ) mirroring yohimbine's 2.0/h — the
 * α₂-antagonist sympathetic effect tracks plasma closely (t½kₑₒ ≈ 21 min).
 * NB: α₂A/B/C pKi are GtoPdb-curated TABLE values (not abstract-verbatim) — the
 * accepted standard for occupancy in this registry, flagged in each note; the
 * 5-HT₂B source has rauwolscine as the primary characterized ligand.
 *
 * ── ajmalicine → CYP2D6 inhibition (mechanism note only) ────────────────────
 * GtoPdb (ligand 8746) lists ajmalicine as a potent human CYP2D6 inhibitor,
 * Ki = 3.3 nM (PMID:8487254). That is enzyme inhibition, not receptor occupancy,
 * so it is added to mechanism prose + refs (not an occupancy row). A future
 * kinetic-interaction edge (ajmalicine → CYP2D6 victims) is noted in AUTHORING_GAPS.
 *
 * corynanthine: still NO authorable occupancy — GtoPdb has zero interactions for it
 * and it is absent from the modern human α₁-subtype binding papers (only qualitative
 * "α₁-preferring" statements). Stays a skeleton; logged in AUTHORING_GAPS.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  mechanism?: string;
  refs?: string[];
  effect_compartment?: { keo_per_h: number; source_pmid?: string; note?: string };
  receptor_occupancy?: Array<{ receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string }>;
  pk_unauthored?: { reason: string; note?: string };
  [k: string]: unknown;
}

const RAUWOLSCINE_OCCUPANCY: Compound['receptor_occupancy'] = [
  {
    receptor: 'alpha_2a', pathway: 'antagonist', emax: 1, ec50_mg_l: 0.001411, hill_n: 1, source_pmid: 'PMID:7996470',
    note: 'GtoPdb-curated human α2A-adrenoceptor antagonist pKi 8.4 → Ki 3.98 nM (PMID:7996470, tabular value — the same source as yohimbine’s α2A). ec50 = 3.98 nM × 354.4 / 1e6.',
  },
  {
    receptor: 'alpha_2b', pathway: 'antagonist', emax: 1, ec50_mg_l: 0.001776, hill_n: 1, source_pmid: 'PMID:7996470',
    note: 'GtoPdb-curated human α2B-adrenoceptor antagonist pKi 8.3 → Ki 5.01 nM (PMID:7996470, tabular). ec50 = 5.01 nM × 354.4 / 1e6.',
  },
  {
    receptor: 'alpha_2c', pathway: 'antagonist', emax: 1, ec50_mg_l: 0.000282, hill_n: 1, source_pmid: 'PMID:7996470',
    note: 'GtoPdb-curated human α2C-adrenoceptor antagonist pKi 9.1 → Ki 0.79 nM (PMID:7996470, tabular) — rauwolscine’s highest α2 affinity. ec50 = 0.79 nM × 354.4 / 1e6.',
  },
  {
    receptor: '5-HT2B', pathway: 'antagonist', emax: 1, ec50_mg_l: 0.002815, hill_n: 1, source_pmid: 'PMID:9459568',
    note: 'GtoPdb-curated human 5-HT2B antagonist pKi 7.8–8.4 (midpoint 8.1 → Ki 7.94 nM); PMID:9459568 characterises [³H]rauwolscine as the radioligand for the cloned human 5-HT2B receptor (rauwolscine = named subject). ec50 = 7.94 nM × 354.4 / 1e6.',
  },
];

const RAUWOLSCINE_MECHANISM =
  'A minor indole alkaloid of yohimbe bark (Pausinystalia johimbe) and a diastereomer of yohimbine on the pentacyclic yohimban skeleton. It is a selective α₂-adrenoceptor antagonist, markedly more α₂- than α₁-selective (PMID:6142941); across human α₂ subtypes its affinity ranks α₂C > α₂A ≈ α₂B (GtoPdb), and it also antagonises 5-HT₂B (it serves as the radioligand [³H]rauwolscine for that receptor). Widely used as a pharmacological α₂-antagonist tool and sold in supplements as "α-yohimbine".';

const AJMALICINE_CYP_SENTENCE =
  ' It is also a potent inhibitor of human CYP2D6 (Ki ≈ 3.3 nM; GtoPdb, PMID:8487254), a potential basis for pharmacokinetic interactions.';

function addRef(c: Compound, pmid: string): void {
  c.refs = c.refs ?? [];
  if (!c.refs.includes(pmid)) c.refs.push(pmid);
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let changed = 0;

  // ── rauwolscine: skeleton → rich ──────────────────────────────────────────
  const rau = bySlug.get('rauwolscine');
  if (!rau) {
    console.error('  [ERROR] rauwolscine not found — run the alkaloids script first');
    process.exit(1);
  }
  if (rau.receptor_occupancy && rau.receptor_occupancy.length) {
    console.log('  [skip] rauwolscine already has receptor_occupancy');
  } else {
    rau.mechanism = RAUWOLSCINE_MECHANISM;
    rau.effect_compartment = {
      keo_per_h: 2,
      note: 'Approximation; no published kₑₒ. Like yohimbine, rauwolscine’s α₂-antagonist sympathetic effects emerge within minutes and track plasma closely; 2.0/h → t½kₑₒ ≈ 21 min (mirrors the yohimbine kₑₒ).',
    };
    rau.receptor_occupancy = RAUWOLSCINE_OCCUPANCY;
    rau.pk_unauthored = {
      reason: 'research-only',
      note: 'Receptor occupancy authored from GtoPdb (α₂A/B/C, 5-HT₂B); PK (absorption/half-life) remains uncharacterised for the isolated alkaloid.',
    };
    addRef(rau, 'PMID:7996470');
    addRef(rau, 'PMID:9459568');
    console.log(`  [rich] rauwolscine + occupancy(${RAUWOLSCINE_OCCUPANCY!.map(o => o.receptor).join(',')}) + keo`);
    changed++;
  }

  // ── ajmalicine: mechanism enrichment (CYP2D6 inhibition) ──────────────────
  const ajm = bySlug.get('ajmalicine');
  if (!ajm) {
    console.error('  [ERROR] ajmalicine not found — run the alkaloids script first');
    process.exit(1);
  }
  if ((ajm.refs ?? []).includes('PMID:8487254')) {
    console.log('  [skip] ajmalicine CYP2D6 enrichment already applied');
  } else {
    ajm.mechanism = (ajm.mechanism ?? '') + AJMALICINE_CYP_SENTENCE;
    addRef(ajm, 'PMID:8487254');
    console.log('  [enr ] ajmalicine + CYP2D6 inhibition note (Ki 3.3 nM, PMID:8487254)');
    changed++;
  }

  if (changed) writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nYohimbe rich-occupancy upgrade (2026-06-27): ${changed} compound(s) updated.`);
}

main();
