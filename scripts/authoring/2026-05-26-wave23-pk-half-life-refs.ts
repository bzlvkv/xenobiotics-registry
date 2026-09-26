/**
 * 2026-05-26-wave23-pk-half-life-refs.ts — attach a primary PK reference to
 * mainstream drugs that had an authored half_life_hr but EMPTY refs.
 *
 * Provenance gap fix (not occupancy): 79 authored compounds carried a
 * half_life_hr with no citation. This wave sources ONE primary PK reference
 * per drug whose abstract states an elimination half-life consistent (within
 * ~2×) with the registry value, verified against PubMed 2026-05-26 (a 12-drug
 * spot-check independently re-confirmed author/year/value). The PMID is added
 * to refs[]; the value+author+route is documented per row below.
 *
 * ── HELD for review (citation would contradict the stored value) ────────────
 *  tranexamic-acid — registry 11 h vs well-established ~2 h plasma t½
 *    (Pilbrant 1981, PMID:7308275 "apparent elimination half-life of
 *    approximately two hours"). The 11 h appears only in tertiary labels and
 *    looks like a wrong stored value — flagged for correction, NOT cited.
 *  allopurinol — registry 2 h (PO) vs measured 0.8 h elimination (IV,
 *    Breithaupt 1982 PMID:7094977). Parent vs absorption-extended ambiguity;
 *    flagged, not cited.
 *
 * ── SKIPPED (no PubMed abstract states the value verbatim) ──────────────────
 *  hydrochlorothiazide (reCAPTCHA-blocked), dexlansoprazole, dicyclomine,
 *  amoxicillin, doxycycline, minocycline (foundational paper has no abstract),
 *  desipramine, phenelzine, butalbital, ibrutinib (review w/o abstract),
 *  upadacitinib (value only in StatPearls), progesterone & prednisone
 *  (FDA-label-sourced). Plus 10 supplements/peptides not yet swept (semax,
 *  n-acetyl-semax/-selank, ala, l-glutamine, l-citrulline, insulin-glargine,
 *  setmelanotide, testosterone-undecanoate, paraxanthine).
 *
 *  Flags within-2× but registry value at an edge (cited anyway): famotidine
 *  (3.6 h vs primary 2.6 h — high), everolimus (17.5 h vs 30 h — low),
 *  amitriptyline (21 h vs 36 h — low), clopidogrel (6 h = inactive metabolite
 *  SR26334, parent ~1.7 h).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound { slug: string; refs?: string[]; [k: string]: unknown; }

// slug → primary PK reference PMID (verified abstract states the elimination half-life)
const PK_REFS: Record<string, string> = {
  // cardiovascular / renal
  lisinopril: 'PMID:2844083',        // Beermann 1988 — accumulation t½ 12.6 h
  furosemide: 'PMID:3370062',        // Lesne 1988 — 0.8 h PO
  chlorthalidone: 'PMID:971715',     // Collste 1976 — 51–89 h
  flecainide: 'PMID:6437721',        // Gillis 1984 — 14 h
  mexiletine: 'PMID:6662176',        // Pentikäinen 1983 — 11.8–15 h
  lithium: 'PMID:365541',            // Thornhill 1978 — 26.8 h
  epinephrine: 'PMID:19622169',      // Abboud 2009 — 3.5 min
  // GI / antihistamine
  omeprazole: 'PMID:2315973',        // Regårdh 1990 — 39 min PO
  pantoprazole: 'PMID:8405016',      // Pue 1993 — 1.9 h
  lansoprazole: 'PMID:8803522',      // Gerloff 1996 — ~1 h
  esomeprazole: 'PMID:11286324',     // Hasselgren 2001 — 1.7 h
  famotidine: 'PMID:2892544',        // Yeh 1987 — 2.6 h (registry 3.6 high)
  loratadine: 'PMID:12852841',       // Zhang 2003 — 6 h parent
  rizatriptan: 'PMID:11680669',      // Musson 2001 — 1.8 h
  prochlorperazine: 'PMID:1768559',  // Isah 1991 — 8 h
  // antibiotics / antiparasitics
  azithromycin: 'PMID:8913468',      // Luke 1996 — 69 h terminal
  telithromycin: 'PMID:16122280',    // Shi 2005 — ~10 h
  ivermectin: 'PMID:8839664',        // Baraka 1996 — 35 h
  hydroxychloroquine: 'PMID:2757893',// Tett 1989 — >40 days
  sulfasalazine: 'PMID:2864155',     // Klotz 1985 — 5–10 h parent
  // CNS / psych / AED
  lamotrigine: 'PMID:8119045',       // Rambeck 1993 — 22.8–37.4 h
  gabapentin: 'PMID:8022536',        // McLean 1994 — 5–9 h
  pregabalin: 'PMID:20147618',       // Bockbrader 2010 — ~6 h
  levetiracetam: 'PMID:15301575',    // Patsalos 2004 — 6–8 h
  amitriptyline: 'PMID:711927',      // Ziegler 1978 — 36.1 h (registry 21 low)
  nortriptyline: 'PMID:7366812',     // Overø 1980 — 39 h
  imipramine: 'PMID:8333005',        // Spina 1993 — 22.8 h baseline
  rasagiline: 'PMID:29159774',       // Zhou 2018 — 2.32 h oral tablet
  methadone: 'PMID:9354306',         // Wolff 1997 — 33–46 h
  // anesthesia / IV
  remifentanil: 'PMID:7902033',      // Westmoreland 1993 — 10–21 min terminal
  alfentanil: 'PMID:17112806',       // Saari 2006 — 1.5 h baseline
  sufentanil: 'PMID:6238552',        // Bovill 1984 — 164 min
  thiopental: 'PMID:7235274',        // Morgan 1981 — 11.5 h
  atracurium: 'PMID:3674472',        // Tsui 1987 — 20.6 min
  vecuronium: 'PMID:2875724',        // Lebrault 1986 — 58 min
  // HIV / HCV antivirals
  atazanavir: 'PMID:19043924',       // Boffito 2008 — 9.91 h (boosted)
  darunavir: 'PMID:17713972',        // Rittweger 2007 — 15 h (boosted)
  lopinavir: 'PMID:19043924',        // Boffito 2008 — ~7 h interval
  daclatasvir: 'PMID:29353349',      // Gandhi 2018 — 10–14 h
  elbasvir: 'PMID:32104104',         // Li 2020 — 18 h
  grazoprevir: 'PMID:32104104',      // Li 2020 — 30 h
  elvitegravir: 'PMID:21348537',     // Ramanathan 2011 — ~9.5 h (boosted)
  // oncology / immunology
  acalabrutinib: 'PMID:30442651',    // Podoll 2019 — <2 h
  venetoclax: 'PMID:27558232',       // Salem 2017 — 14.1–18.2 h
  navitoclax: 'PMID:21282543',       // Gandhi 2011 — ~15 h
  ruxolitinib: 'PMID:37000342',      // Appeldoorn 2023 — 3.8–4.1 h
  everolimus: 'PMID:18332470',       // O'Donnell 2008 — 30 h (registry 17.5 low)
  temsirolimus: 'PMID:17020981',     // Hidalgo 2006 — 13–25 h
  rituximab: 'PMID:20555126',        // Tran 2010 — 19.2 days
  trastuzumab: 'PMID:15868146',      // Bruno 2005 — 28.5 days
  mycophenolate: 'PMID:8728345',     // Bullingham 1996 — ~17 h (MPA)
  tolbutamide: 'PMID:9068933',       // Tremaine 1997 — 6.9 h
  clopidogrel: 'PMID:10440419',      // Caplain 1999 — 7.2–7.6 h (metabolite)
  methylprednisolone: 'PMID:2655680',// Al-Habet 1989 — 1.93 h (IV)
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, already = 0, missing = 0;
  for (const [slug, pmid] of Object.entries(PK_REFS)) {
    const c = bySlug.get(slug);
    if (!c) { console.log(`  [MISS] ${slug} not in registry`); missing++; continue; }
    c.refs = c.refs ?? [];
    if (c.refs.includes(pmid)) { console.log(`  [skip] ${slug.padEnd(20)} already has ${pmid}`); already++; continue; }
    c.refs.push(pmid);
    console.log(`  [add ] ${slug.padEnd(20)} refs += ${pmid}`);
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 23 PK refs: +${added} citations (${already} already present, ${missing} missing).`);
}

main();
