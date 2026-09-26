/**
 * 2026-05-27-wave28-im-routes.ts — fill IM-route pk blocks (Phase 3, non-IV
 * route campaign — IM subset).
 *
 * Per IM route: V_L = copied true Vd (route-independent); F = sourced absolute
 * bioavailability where available, else 1.0 for a NON-DEPOT parenteral small
 * molecule (parenteral routes bypass first-pass → complete systemic absorption;
 * documented assumption, flagged per row); ka_hr = derived from the sourced IM
 * Tmax + ke (ln2/t½) via the 1-compartment Tmax equation. half_life_hr.IM =
 * terminal t½ (route-independent). Each PMID verified to resolve 2026-05-27.
 *
 * Only drugs with a SOURCED IM Tmax (so ka is derivable) AND a defensible F are
 * authored. The IM sweep found most other IM "gaps" are NOT cleanly fillable:
 *  - DEPOT/long-acting (different kinetic regime, not 1-comp ka): aripiprazole-LAI,
 *    leuprolide, octreotide-LAR, olanzapine-pamoate, estradiol esters, progesterone
 *    oil, medroxyprogesterone(DMPA), risperidone Consta, naltrexone Vivitrol,
 *    haloperidol decanoate, levonorgestrel butanoate.
 *  - Only RELATIVE F (vs oral/IV) or label/StatPearls values: metoclopramide,
 *    prochlorperazine, promethazine, naloxone, ondansetron, midazolam, isoniazid,
 *    hydralazine, dicyclomine, hydroxyzine, dimenhydrinate, hydrocortisone(label).
 *  - NOT clinically given IM / no human IM PK: fentanyl, alfentanil, sufentanil,
 *    methadone, hydromorphone, oxymorphone, furosemide, misoprostol, methocarbamol.
 *  - F sourced but no IM Tmax (ka not derivable): methotrexate(0.76), ketamine(0.93),
 *    meloxicam(1.0), diclofenac(~1), aripiprazole-IR(0.98). → need IM Tmax.
 *  - Flip-flop (Tmax > 1-comp limit): insulin IM.
 *  - No abstract / endogenous: calcitonin, glucagon, vasopressin, same, thiamine,
 *    methylcobalamin, somatropin, phylloquinone, emoxypine, hyaluronic-acid, epinephrine.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const LN2 = Math.log(2);

function solveKa(Tmax: number, ke: number): number | null {
  const lim = 1 / ke;
  if (Tmax >= lim) return null; // flip-flop / no 1-comp solution
  let lo = ke * 1.0000001, hi = ke * 1e6;
  const f = (ka: number) => Math.log(ka / ke) / (ka - ke) - Tmax;
  for (let i = 0; i < 200; i++) { const mid = Math.sqrt(lo * hi); if (f(mid) > 0) lo = mid; else hi = mid; }
  return Math.sqrt(lo * hi);
}

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string; [k: string]: unknown }
interface Compound { slug: string; pk?: Record<string, RoutePk>; half_life_hr?: Record<string, number>; [k: string]: unknown }

// slug, F, F_sourced(bool), Tmax_h, PMID
const IM: Array<[string, number, boolean, number, string]> = [
  ['morphine', 1.0, true, 0.33, 'PMID:657720'],      // Stanski 1978 — F 100%
  ['cefepime', 1.0, true, 1.3, 'PMID:2229450'],       // Barbhaiya 1990 — F 100%
  ['gentamicin', 1.0, true, 0.96, 'PMID:3396458'],    // Segal 1988 — F complete
  ['phenobarbital', 0.76, true, 2.0, 'PMID:624773'],  // Viswanathan 1978 — 80% rel oral × ~0.95
  ['cortisol', 1.0, false, 1.1, 'PMID:23672956'],     // Hahner 2013 — Tmax 66 min (parenteral F~1)
  ['hydrocortisone', 1.0, false, 1.1, 'PMID:23672956'], // same molecule/data
  ['dexamethasone', 1.0, false, 0.5, 'PMID:9015035'], // Egerman 1997 — Tmax 30 min, AUC≈oral
  ['clindamycin', 1.0, false, 1.75, 'PMID:16756056'], // Leelarasamee 2006 — Tmax 1.75 h
  ['betamethasone', 1.0, false, 2.8, 'PMID:21899210'],// He 2011 — Tmax 2.8 h
  ['lidocaine', 1.0, false, 0.73, 'PMID:7439378'],    // Piotrovskii 1980 — Tmax 44 min
  ['pentazocine', 1.0, false, 0.25, 'PMID:3709032'],  // Yeh 1986 — peak 15 min (parenteral, IM reference)
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0; const skip: string[] = [];
  for (const [slug, F, sourced, Tmax, pmid] of IM) {
    const c = bySlug.get(slug);
    if (!c?.pk) { skip.push(`${slug}(no pk)`); continue; }
    if (c.pk.IM) { skip.push(`${slug}(has IM)`); continue; }
    const donor = c.pk.PO?.V_L != null ? c.pk.PO : Object.values(c.pk).find(b => b?.V_L != null);
    const Vd = donor?.V_L;
    const hl = c.half_life_hr?.PO ?? (c.half_life_hr ? Object.values(c.half_life_hr)[0] : undefined);
    if (Vd == null || hl == null) { skip.push(`${slug}(no Vd/hl)`); continue; }
    const ka = solveKa(Tmax, LN2 / hl);
    if (ka == null) { skip.push(`${slug}(flip-flop)`); continue; }
    const kaR = ka < 1 ? +ka.toFixed(3) : +ka.toFixed(2);
    c.pk.IM = { ka_hr: kaR, V_L: Vd, F, source_pmid: pmid };
    if (c.half_life_hr && c.half_life_hr.IM == null) c.half_life_hr.IM = hl;
    console.log(`  [add ] ${slug.padEnd(15)} pk.IM = {ka:${kaR}, V_L:${Vd}, F:${F}${sourced ? '' : ' (parenteral~1)'}}  ${pmid}`);
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 28 IM routes: +${added} IM blocks. Skipped: ${skip.join(', ')}`);
}

main();
