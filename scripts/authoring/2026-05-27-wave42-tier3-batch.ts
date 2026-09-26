/**
 * 2026-05-27-wave42-tier3-batch.ts — four new compounds (solifenacin,
 * pitolisant, prucalopride, zolmitriptan). Label-tier PK (DailyMed) + GtoPdb
 * human affinity, same provenance approach as wave40/41. Each introduces a
 * receptor to the covered set: M3 (OAB), H3 (narcolepsy), 5-HT4 (constipation),
 * 5-HT1B/1D/1F (migraine). Bridges H3/5-HT4/5-HT1F added in receptors.ts.
 *
 * Deferred (label lacks absolute PK — won't invent F/Vd): cabergoline (F
 * "unknown" per label) and bromocriptine ("extensive first-pass", no F number).
 *
 * ec50_mg_l = Ki(nM) × MW / 1e6. emax 1.0, hill_n 1. kₑₒ = documented
 * approximations (label-based) → expected benign pk.pmid + effect.pmid warns.
 * Idempotent per slug.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const COMPOUNDS = [
  {
    slug: 'solifenacin', name: 'Solifenacin', aliases: ['VESIcare'], category: 'pharmacological', systems: ['nervous'],
    mechanism: 'Competitive muscarinic receptor antagonist (M3-preferring) for overactive bladder — reduces detrusor overactivity. Hepatic CYP3A4 metabolism.',
    routes: ['PO'], doses: { PO: { min: 5, max: 10, typical: 5, unit: 'mg' } },
    half_life_hr: { PO: 55 }, pk: { PO: { F: 0.9, V_L: 600, ka_hr: 0.85 } }, mw_g_mol: 362.5,
    effect_compartment: { keo_per_h: 0.5, note: 'Approximation; no published kₑₒ. Antimuscarinic bladder effect tracks plasma closely given the long t½ (~55 h). 0.5/h.' },
    receptor_occupancy: [{ receptor: 'muscarinic', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.005122, hill_n: 1, source_pmid: 'PMID:12122494', note: 'GtoPdb-curated human M3 (CHRM3) binding: pKi range 7.7–8.0 (PMID:12122494, PMID:20590605); midpoint pKi 7.85 → Ki ≈ 14 nM, antagonist. Keyed muscarinic (M3, the bladder-relevant subtype). ec50 = 14 nM × 362.5 / 1e6.' }],
    notes: 'PK from FDA prescribing information (DailyMed setid 1d8e8f6f-0a59-479f-8415-c5c5f19e1977): absolute bioavailability ~90% (F 0.9), steady-state Vd ~600 L, terminal t½ ~45–68 h, Tmax 3–8 h, CYP3A4. ka_hr 0.85 derived from Tmax ~5 h (ke from t½ 55 h).',
    refs: ['PMID:12122494'],
  },
  {
    slug: 'pitolisant', name: 'Pitolisant', aliases: ['Wakix'], category: 'pharmacological', systems: ['nervous'],
    mechanism: 'Histamine H3 receptor antagonist / inverse agonist; raises central histamine to promote wakefulness (narcolepsy). CYP2D6 + CYP3A4 metabolism.',
    routes: ['PO'], doses: { PO: { min: 17.8, max: 35.6, typical: 17.8, unit: 'mg' } },
    half_life_hr: { PO: 20 }, pk: { PO: { F: 0.9, V_L: 700, ka_hr: 1.0 } }, mw_g_mol: 295.8,
    effect_compartment: { keo_per_h: 0.5, note: 'Approximation; no published kₑₒ. Wakefulness effect builds over hours as central histamine rises. 0.5/h.' },
    receptor_occupancy: [{ receptor: 'H3', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.000799, hill_n: 1, source_pmid: 'PMID:26084539', note: 'GtoPdb-curated human H3 (HRH3) binding: pKi range 8.06–8.57 (PMID:26084539, PMID:19329325), antagonist / inverse agonist; GtoPdb median Ki 2.7 nM. ec50 = 2.7 nM × 295.8 / 1e6.' }],
    notes: 'PK from FDA prescribing information (DailyMed setid 8daa5562-824e-476c-9652-26ceef3d4b0e): oral absorption ~90% (F 0.9), Vd 5–10 L/kg (~700 L), terminal t½ ~20 h, Tmax 3.5 h, CYP2D6/3A4. ka_hr 1.0 derived from Tmax 3.5 h (ke from t½ 20 h).',
    refs: ['PMID:26084539'],
  },
  {
    slug: 'prucalopride', name: 'Prucalopride', aliases: ['Motegrity'], category: 'pharmacological', systems: ['digestive'],
    mechanism: 'Selective serotonin 5-HT4 receptor agonist; prokinetic for chronic idiopathic constipation. Largely excreted unchanged in urine.',
    routes: ['PO'], doses: { PO: { min: 1, max: 2, typical: 2, unit: 'mg' } },
    half_life_hr: { PO: 24 }, pk: { PO: { F: 0.9, V_L: 567, ka_hr: 1.5 } }, mw_g_mol: 367.9,
    effect_compartment: { keo_per_h: 0.5, note: 'Approximation; no published kₑₒ. Prokinetic effect onset within hours. 0.5/h.' },
    receptor_occupancy: [{ receptor: '5-HT4', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.005831, hill_n: 1, source_pmid: 'PMID:10646498', note: 'GtoPdb-curated human 5-HT4 binding: pKi range 7.0–8.6 (PMID:10646498, PMID:11438309), (partial) agonist; midpoint pKi 7.8 → Ki ≈ 16 nM. ec50 = 16 nM × 367.9 / 1e6.' }],
    notes: 'PK from FDA prescribing information (DailyMed setid af559917-802b-486c-9f7b-b770115acac8): absolute bioavailability >90% (F 0.9), steady-state Vd 567 L, terminal t½ ~1 day (24 h), Tmax 2–3 h, 60–65% excreted unchanged in urine. ka_hr 1.5 derived from Tmax ~2.5 h (ke from t½ 24 h).',
    refs: ['PMID:10646498'],
  },
  {
    slug: 'zolmitriptan', name: 'Zolmitriptan', aliases: ['Zomig'], category: 'pharmacological', systems: ['nervous'],
    mechanism: 'Selective 5-HT1B/1D receptor agonist (triptan) for acute migraine — cranial vasoconstriction and trigeminal inhibition; also binds 5-HT1F. Active N-desmethyl metabolite.',
    routes: ['PO'], doses: { PO: { min: 1.25, max: 5, typical: 2.5, unit: 'mg' } },
    half_life_hr: { PO: 3 }, pk: { PO: { F: 0.4, V_L: 490, ka_hr: 1.5 } }, mw_g_mol: 287.36,
    effect_compartment: { keo_per_h: 2.0, note: 'Approximation; no published kₑₒ. Acute migraine relief onset ~0.5–1 h. 2.0/h → t½kₑₒ ≈ 21 min.' },
    receptor_occupancy: [
      { receptor: '5-HT1D', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.000362, hill_n: 1, source_pmid: 'PMID:10193663', note: 'GtoPdb-curated human 5-HT1D binding: pKi 8.9 (Ki 1.26 nM), full agonist, ref PMID:10193663 (Napier 1999). ec50 = 1.26 nM × 287.36 / 1e6.' },
      { receptor: '5-HT1B', pathway: 'partial-agonist', emax: 1.0, ec50_mg_l: 0.005747, hill_n: 1, source_pmid: 'PMID:10193663', note: 'GtoPdb-curated human 5-HT1B binding: pKi 7.7 (Ki 20 nM), partial agonist, ref PMID:10193663. ec50 = 20 nM × 287.36 / 1e6.' },
      { receptor: '5-HT1F', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.010196, hill_n: 1, source_pmid: 'PMID:15900510', note: 'GtoPdb-curated human 5-HT1F binding: pKi range 7.4–7.5 (PMID:15900510, PMID:10193663), full agonist; midpoint pKi 7.45 → Ki ≈ 35 nM. ec50 = 35 nM × 287.36 / 1e6.' },
    ],
    notes: 'PK from FDA prescribing information (DailyMed setid 333caafc-2e63-49f8-a0c6-534e528d228d): mean absolute bioavailability ~40% (F 0.4), apparent Vd 7 L/kg (~490 L), elimination t½ ~3 h, Tmax ~1.5 h (tablet). ka_hr 1.5 derived from Tmax 1.5 h (ke from t½ 3 h).',
    refs: ['PMID:10193663', 'PMID:15900510'],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as { slug: string }[];
  const have = new Set(data.map(c => c.slug));
  let added = 0;
  for (const c of COMPOUNDS) {
    if (have.has(c.slug)) { console.log(`[skip] ${c.slug} already in registry`); continue; }
    data.push(c as unknown as { slug: string });
    added++;
    const occ = (c.receptor_occupancy ?? []).map(r => r.receptor).join('+');
    console.log(`[add ] ${c.slug.padEnd(13)} PO F=${c.pk.PO.F} Vd=${c.pk.PO.V_L} t½=${c.half_life_hr.PO}h  [${occ}]`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave42: +${added} new compounds.`);
}

main();
