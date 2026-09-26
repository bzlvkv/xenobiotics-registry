/**
 * 2026-09-06-provenance-typing.ts
 *
 * Makes two kinds of already-recorded provenance MACHINE-READABLE instead of
 * prose-only. Authors no new numbers and changes no existing value — every
 * string written here is lifted from the compound's own `mechanism` text,
 * where the authoring session that set the numbers already named its source.
 *
 * ── Part A: pk[route].source_label ────────────────────────────────────────
 * 26 compounds (27 routes) carry PK read off a regulatory label rather than a
 * PubMed abstract. That is legitimate primary provenance — for a modern agent
 * the approval package is often the only public document stating Cmax, t½ and
 * F together, because the popPK paper reserves them for full-text tables. But
 * the schema had only `source_pmid`, so those routes rendered an em-dash in
 * the Source column: identical to a route whose citation was simply never
 * recorded. `RoutePk.source_label` (added in this change) closes that gap, and
 * data-lint's `pk.pmid` rule now accepts either field.
 *
 * ── Part B: effect_compartment.approximated ───────────────────────────────
 * 34 compounds carry a kₑₒ whose own note says, in the authoring session's own
 * words, "Approximation; no published kₑₒ" (or an equivalent admission). These
 * are honest, reasoned estimates — for nuclear-receptor agonists, therapeutic
 * antibodies and the orexin antagonists no effect-compartment model has ever
 * been published, yet the effect demonstrably lags plasma and a kₑₒ of 0 would
 * be a worse lie than an order-of-magnitude one. The admission lived only in
 * free text, so no surface and no gate could act on it. Setting the typed
 * `approximated: true` flag lets the compound page label the value and lets
 * data-lint stop reporting it as missing provenance.
 *
 * NOT INCLUDED — two routes genuinely have no source and stay flagged:
 *   • dextromethorphan PO — its only ref (PMID:8841152, Capon 1996) IS a real
 *     DM disposition study and states t½ (2.4 h EM / 19.1 h PM), but the
 *     stored ka 1.5 / V 300 / F 0.11 appear nowhere in that abstract, so
 *     stamping it would claim the paper says something it does not.
 *   • nabumetone PO — its only ref (PMID:10377455, Warner 1999) is a COX-1/2
 *     selectivity assay, not a PK study at all. Topically wrong for this route.
 * Both are logged in AUTHORING_GAPS.md instead.
 *
 * Idempotent: skips any route/compound already carrying the target field.
 * Dry-run by default; pass --write to apply to compounds.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

/**
 * slug → route → label citation. Each string names the document precisely
 * enough to re-derive the stored numbers, and is a condensation of the
 * provenance sentence already present in that compound's `mechanism` prose.
 */
const LABELS: Record<string, Record<string, string>> = {
  atazanavir: { PO: 'FDA label: Reyataz (atazanavir), clinical pharmacology — boosted 300/100 mg PO qd with ritonavir at steady state: V/F 91 L, CL/F 5.3 L/h, t½ 9–18 h.' },
  butalbital: { PO: 'FDA label: Fioricet (butalbital/acetaminophen/caffeine), butalbital component — t½ 35 h, Vd ~0.8 L/kg (~56 L), 59–88% renal elimination.' },
  clozapine: { PO: 'FDA label: Clozaril (clozapine) — 100 mg PO bid at steady state: Tmax 2.5 h, t½ 12 h single-dose / 14 h SS, F 27–50% (mean 40%).' },
  cobicistat: { PO: 'FDA label: Tybost (cobicistat), clinical pharmacology (rev. 6/2025) — 150 mg PO qd at steady state.' },
  daclatasvir: { PO: 'FDA label: Daklinza (daclatasvir) — 60 mg PO qd at steady state: Tmax ~2 h, t½ 12–15 h, F 67%.' },
  darunavir: { PO: 'FDA label: Prezista (darunavir) — boosted 800/100 mg PO qd with ritonavir at steady state: V/F 221 L, CL/F 10.2 L/h, t½ 15 h.' },
  dicyclomine: { PO: 'FDA label: Bentyl (dicyclomine) — relative F 67% (oral vs IM), apparent Vd 3.65 L/kg (~256 L), t½ 1.8 h, Tmax 1–1.5 h.' },
  elbasvir: { PO: 'FDA label: Zepatier (elbasvir/grazoprevir), elbasvir component — 50 mg PO qd at steady state: Tmax 3 h, t½ 24 h, F 32%.' },
  elvitegravir: { PO: 'FDA label: Vitekta (elvitegravir) — 150 mg PO qd boosted with cobicistat or ritonavir: Tmax ~4 h, t½ 13 h boosted.' },
  everolimus: { PO: 'FDA label: Afinitor (everolimus) — 10 mg PO qd: Tmax 1–2 h, t½ 16–19 h, CL/F 23 L/h, V/F 581 L.' },
  grazoprevir: { PO: 'FDA label: Zepatier (elbasvir/grazoprevir), grazoprevir component — 100 mg PO qd at steady state: Tmax 2 h, t½ 31 h, F 27%.' },
  ibrutinib: { PO: 'FDA label: Imbruvica (ibrutinib) — 560 mg PO qd at steady state: Tmax 1–2 h, t½ 4–6 h, absolute F 2.9% fasted, true Vd ~122 L.' },
  lopinavir: { PO: 'FDA label: Kaletra (lopinavir/ritonavir) — boosted 400/100 mg PO bid at steady state: t½ ~6 h, CL/F ~4.3 L/h, V/F ~37 L.' },
  rasagiline: { PO: 'FDA label: Azilect (rasagiline) — 1 mg PO qd at steady state: Tmax 1 h, t½ 3 h, F 36%, Vss 87 L.' },
  setmelanotide: { SC: 'FDA label: Imcivree (setmelanotide) — 3 mg SC qd at steady state: apparent V/F 75.2 L, effective t½ ~11 h, CL/F 7.15 L/h.' },
  tacrine: { PO: 'FDA label: Cognex (tacrine; withdrawn 2013) — absolute F 17 ± 13%, Tmax 1–2 h, t½ ~3 h, apparent V 349 ± 193 L.' },
  temsirolimus: { IV: 'FDA label: Torisel (temsirolimus) — 25 mg IV weekly: Cmax 585 ng/mL, AUC 1627 ng·h/mL, t½ 17.3 h (parent), Vss 172 L in whole blood.' },
  tolbutamide: { PO: 'FDA label: Orinase (tolbutamide) — 500 mg PO single dose: Tmax 3–4 h, t½ 4.5–6.5 h, protein binding ~95%, Vd ~14 L.' },
  'tranexamic-acid': {
    PO: 'FDA label: Lysteda (tranexamic acid) — 1300 mg PO multiple-dose steady state in women: Tmax 3 h, t½ ~11 h, F 45%.',
    IV: 'FDA label: Lysteda (tranexamic acid), clinical pharmacology — IV route takes F 1.0 by definition and the same distribution volume as the oral label.',
  },
  venetoclax: { PO: 'FDA label: Venclexta (venetoclax) — 400 mg PO qd with a low-fat meal at steady state: Tmax 5–8 h, t½ 17 h, apparent V/F ~299 L.' },
  pramipexole: { PO: 'FDA prescribing information, DailyMed setid 46f88017-7b0e-437e-90b1-37bdf9013e72 — absolute F >90%, apparent Vd ~500 L, t½ ~8 h (young), Tmax ~2 h.' },
  ropinirole: { PO: 'FDA prescribing information, DailyMed setid e32ef7a6-b4b6-4a22-a2ed-722255b486b4 (IR film-coated tablet) — absolute F 45–55%, apparent Vd 7.5 L/kg (~525 L), t½ ~6 h, Tmax ~1–2 h.' },
  solifenacin: { PO: 'FDA prescribing information, DailyMed setid 1d8e8f6f-0a59-479f-8415-c5c5f19e1977 — absolute F ~90%, steady-state Vd ~600 L, terminal t½ 45–68 h, Tmax 3–8 h.' },
  pitolisant: { PO: 'FDA prescribing information, DailyMed setid 8daa5562-824e-476c-9652-26ceef3d4b0e — oral absorption ~90%, Vd 5–10 L/kg (~700 L), terminal t½ ~20 h, Tmax 3.5 h.' },
  prucalopride: { PO: 'FDA prescribing information, DailyMed setid af559917-802b-486c-9f7b-b770115acac8 — absolute F >90%, steady-state Vd 567 L, terminal t½ ~24 h, Tmax 2–3 h.' },
  zolmitriptan: { PO: 'FDA prescribing information, DailyMed setid 333caafc-2e63-49f8-a0c6-534e528d228d — mean absolute F ~40%, apparent Vd 7 L/kg (~490 L), t½ ~3 h, Tmax ~1.5 h (tablet).' },
};

/**
 * Detects a kₑₒ note that already admits the value is an estimate. Matching on
 * the note rather than a hand-listed slug set means the flag can only ever land
 * where the authoring session itself said "approximation" — no judgement call
 * is made here about whether some OTHER value ought to be an estimate.
 */
const ADMITS_APPROXIMATION = /approximation|no published k|no genuine subject-primary|class-analogy|class approximation|admitted approximation|no .*-specific keo/i;

interface RoutePk { source_pmid?: string; source_label?: string; [k: string]: unknown }
interface Compound {
  slug: string;
  pk?: Record<string, RoutePk | undefined>;
  effect_compartment?: { keo_per_h?: number; source_pmid?: string; approximated?: boolean; note?: string };
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const bySlug = new Map(data.map((c) => [c.slug, c]));

const appliedLabels: string[] = [];
const skippedLabels: string[] = [];

for (const [slug, routes] of Object.entries(LABELS)) {
  const c = bySlug.get(slug);
  if (!c) { skippedLabels.push(`${slug} — NOT IN REGISTRY`); continue; }
  for (const [route, label] of Object.entries(routes)) {
    const pk = c.pk?.[route];
    if (!pk) { skippedLabels.push(`${slug}.${route} — no pk[${route}]`); continue; }
    if (pk.source_label) { skippedLabels.push(`${slug}.${route} — already labelled`); continue; }
    if (pk.source_pmid) { skippedLabels.push(`${slug}.${route} — has source_pmid, left alone`); continue; }
    pk.source_label = label;
    appliedLabels.push(`${slug}.${route}`);
  }
}

const appliedApprox: string[] = [];
const skippedApprox: string[] = [];

for (const c of data) {
  const ec = c.effect_compartment;
  if (!ec?.keo_per_h) continue;
  if (ec.approximated) { skippedApprox.push(`${c.slug} — already flagged`); continue; }
  // A cited kₑₒ is a fitted value; never overwrite a citation with an estimate flag.
  if (ec.source_pmid) continue;
  if (!ec.note || !ADMITS_APPROXIMATION.test(ec.note)) {
    if (!ec.source_pmid) skippedApprox.push(`${c.slug} — no source_pmid and note does not admit an estimate; needs a human read`);
    continue;
  }
  ec.approximated = true;
  appliedApprox.push(c.slug);
}

console.log(`Part A — pk[route].source_label: ${appliedLabels.length} applied`);
for (const a of appliedLabels) console.log(`   + ${a}`);
if (skippedLabels.length) {
  console.log(`   ${skippedLabels.length} skipped:`);
  for (const s of skippedLabels) console.log(`     - ${s}`);
}

console.log(`\nPart B — effect_compartment.approximated: ${appliedApprox.length} applied`);
for (const a of appliedApprox) console.log(`   + ${a}`);
if (skippedApprox.length) {
  console.log(`   ${skippedApprox.length} skipped:`);
  for (const s of skippedApprox) console.log(`     - ${s}`);
}

if (WRITE) {
  writeFileSync(COMPOUNDS_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`\nWROTE ${COMPOUNDS_PATH}`);
} else {
  console.log('\nDry run — pass --write to apply.');
}
