/**
 * 2026-05-25-wave11-missed-gpcr.ts — GPCR classes missed by earlier probes.
 *
 * A registry gap-audit (cited-PK, no-occupancy) surfaced whole GPCR classes
 * never probed: ARBs (AT1), leukotriene (CysLT1), endothelin (ETA), P2Y12,
 * vasopressin (V2), prostaglandin (EP3). 9 of 15 authorable from verified
 * abstracts. New catalog pages: CysLT1, ETA, P2Y12, V2, EP3.
 *
 * ec50_mg_l = Kᵢ/IC50(nM) · MW / 1e6. emax 1.0, hill_n 1.
 *
 * ── Skipped (logged) ───────────────────────────────────────────────────────
 *  suvorexant/lemborexant/daridorexant (orexin OX1/OX2 Kᵢ table-only — JPET
 *  paywalled), zafirlukast (only functional pKB), macitentan (qualitative
 *  "nanomolar range"). Clopidogrel/prasugrel are irreversible prodrugs (not
 *  attempted).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Authoring { slug: string; effect_compartment: EffectCompartment; receptor_occupancy: ReceptorOccupancy[]; }

const mk = (slug: string, keo: number, kpmid: string, knote: string, receptor: string, path: string, ec50: number, pmid: string, note: string): Authoring => ({
  slug, effect_compartment: { keo_per_h: keo, source_pmid: kpmid, note: knote },
  receptor_occupancy: [{ receptor, pathway: path, emax: 1.0, ec50_mg_l: ec50, hill_n: 1, source_pmid: pmid, note }],
});

const ENTRIES: Authoring[] = [
  mk('losartan', 0.5, 'PMID:8242249', 'Approximation; no published kₑₒ. ARB BP effect over hours (losartan onset 2–24 h per PMID 8242249).',
     'at1', 'antagonist', 0.022837, 'PMID:1625192', 'verbatim: "DuP-753 (IC50 = 54 nM) and EXP3174 (IC50 = 6 nM)". Parent losartan 54 nM; rabbit aortic AT1, [125I]Sar1Ile8-AII (species flag; active metabolite EXP3174 is 9× more potent). ec50 = 54 nM × 422.91 / 1e6.'),
  mk('valsartan', 0.5, 'PMID:8242249', 'Approximation; no published kₑₒ. ARB BP effect; valsartan onset ~1 h (PMID 8242249).',
     'at1', 'antagonist', 0.001037, 'PMID:8242249', 'Criscione 1993 verbatim: "Valsartan competed with [125I]-AII at its specific binding sites in rat aortic smooth muscle cell membranes (AT1-receptor subtype) with a Ki of 2.38 nM". Rat (species flag). ec50 = 2.38 nM × 435.52 / 1e6.'),
  mk('candesartan', 0.5, 'PMID:8331552', 'Approximation; no published kₑₒ. Long-acting ARB; BP effect over hours.',
     'at1', 'antagonist', 0.012597, 'PMID:8331552', 'verbatim: "CV-11974 inhibited the binding of [125I] AII to the ... rabbit aortic membrane with IC50 values of ... 2.86 x 10(-8) M". Active acid CV-11974, rabbit aorta (species flag). ec50 = 28.6 nM × 440.45 / 1e6.'),
  mk('olmesartan', 0.5, 'PMID:8566137', 'Approximation; no published kₑₒ. Long-acting ARB; BP effect over hours.',
     'at1', 'antagonist', 0.003438, 'PMID:8566137', 'verbatim: "RNH-6270 inhibited [125I]angiotensin II binding to bovine adrenal cortical membranes (angiotensin AT1 receptors) with an IC50 value of 7.7 nM". Active acid RNH-6270, bovine (species flag). ec50 = 7.7 nM × 446.5 / 1e6.'),
  mk('montelukast', 0.5, 'PMID:7621356', 'Approximation; no published kₑₒ. Anti-leukotriene asthma/rhinitis effect; CysLT1 antagonism.',
     'cyslt1', 'antagonist', 0.000305, 'PMID:7621356', 'Jones 1995 verbatim: "potent and selective inhibitor of [3H]leukotriene D4 specific binding in ... U937 cell plasma membrane preparations (Ki 0.52 +/- 0.23 nM)". Human U937 cells. ec50 = 0.52 nM × 586.18 / 1e6.'),
  mk('bosentan', 0.3, 'PMID:8035319', 'Approximation; no published kₑₒ. Endothelin antagonist; pulmonary vascular effect over hours–days.',
     'eta', 'antagonist', 0.002593, 'PMID:8035319', 'Clozel 1994 verbatim: "Bosentan ... antagonized the specific binding of [125I]-labeled ET-1 on human smooth muscle cells (ETA receptors) with a Ki of 4.7 nM". Human (ETB Ki 95 nM not authored here). ec50 = 4.7 nM × 551.62 / 1e6.'),
  mk('ticagrelor', 1.0, 'PMID:19552634', 'Approximation; no published kₑₒ. Antiplatelet onset within ~2 h (reversible P2Y12 antagonist).',
     'p2y12', 'antagonist', 0.002247, 'PMID:19552634', 'van Giezen 2009 verbatim: "binds competitively with [(33)P]2MeS-ADP (K(i) = 4.3 +/- 1.3 nm) ... apparent non-competitive inhibition of ADP-induced signaling". Recombinant human P2Y12 (allosteric/reversible; radioligand-dependent). ec50 = 4.3 nM × 522.57 / 1e6.'),
  mk('desmopressin', 1.0, 'PMID:10780976', 'Approximation; no published kₑₒ. V2 antidiuretic effect onset ~1 h.',
     'v2', 'agonist', 0.003336, 'PMID:10780976', 'verbatim: "dDAVP displaced [(3)H]-AVP binding to human V(2)- ... receptors with K(i) values of ... 3.12+/-0.38 nM ... for V(2)-receptors". Human V2 in HeLa. ec50 = 3.12 nM × 1069.22 / 1e6.'),
  mk('misoprostol', 1.0, 'PMID:15005878', 'Approximation; no published kₑₒ. EP3 agonist; GI/uterine effect.',
     'ep3', 'agonist', 0.047435, 'PMID:15005878', 'verbatim: "misoprostol = 124 +/- 15 nM" at EP3 ([3H]-PGE2 competition). Hamster uterus (species flag; validated r=0.94 vs human EP3). ec50 = 124 nM × 382.54 / 1e6.'),
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function apply(c: Compound, a: Authoring): { keo: boolean; occ: number; skip: number } {
  let keo = false;
  if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(13)} keo already authored`);
  else { c.effect_compartment = a.effect_compartment; addRef(c, a.effect_compartment.source_pmid); keo = true; console.log(`  [add ] ${c.slug.padEnd(13)} keo=${a.effect_compartment.keo_per_h}/h  ${a.effect_compartment.source_pmid}`); }
  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let occ = 0, skip = 0;
  for (const row of a.receptor_occupancy) {
    if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { skip++; console.log(`  [skip] ${c.slug.padEnd(13)} @ ${row.receptor} already authored`); continue; }
    c.receptor_occupancy.push(row); addRef(c, row.source_pmid); occ++;
    console.log(`  [add ] ${c.slug.padEnd(13)} @ ${row.receptor.padEnd(7)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
  }
  return { keo, occ, skip };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let keoAdded = 0, occAdded = 0, occSkipped = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    const r = apply(c, a);
    if (r.keo) keoAdded++; occAdded += r.occ; occSkipped += r.skip;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 11 missed GPCRs: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
