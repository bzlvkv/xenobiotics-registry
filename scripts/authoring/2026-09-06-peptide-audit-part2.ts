/**
 * 2026-09-06-peptide-audit-part2.ts
 *
 * Applies five peptide findings that the first peptide pass verified and then
 * failed to write. The agent reports for these records were complete; the
 * apply-script simply omitted them, so the records kept values already known to
 * be unsupported. Caught by re-deriving the audit's own coverage afterwards —
 * worth recording, because an audit that reports more than it applies is its
 * own kind of unreliable.
 *
 * Demonstrates `source_species` on a real case: secretin's only usable
 * pharmacokinetics are canine.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound {
  slug: string; routes?: string[]; doses?: Record<string, unknown>;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(s); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t)) c.notes = c.notes ? `${c.notes} ${t}` : t; };

// ── desmopressin: keep the two verbatim bioavailabilities, drop the rest ──
{
  const c = need('desmopressin');
  if (c.pk?.IV?.V_L === 16) {
    c.pk = {
      IN: { F: 0.08, source_pmid: 'PMID:31037429' },
      PO: { F: 0.0008, source_pmid: 'PMID:15197520' },
      IV: { F: 1, source_pmid: 'PMID:15197520' },
    };
    c.half_life_hr = { IN: 3, PO: 3, IV: 3 };
    addRefs(c, 'PMID:9868744', 'PMID:8435898');
    note(c, 'PK: the half-life is an IV value — Rembratt 2004 (PMID:15197520) verbatim "terminal half-life, which was 3.1 h at night and 2.8 h in the daytime", corroborated at "2.97 +/- 0.24" h by Callreus 1998 (PMID:9868744) — and is carried on the other two routes as an assumption, since neither cited paper reports a route-specific half-life. Oral F 0.0008 is verbatim, "The bioavailability was 0.08%", and describes the TABLET; it is fragile as a point estimate because oral concentrations exceeded the assay limit in only about half the samples. V 16 L dropped 2026-09-06 as unsourced — the best human figure is a steady-state volume of 373 mL/kg, about 26 L (PMID:9868744) — along with the ka values on both extravascular routes. CAVEAT: the intranasal F of 0.08 is specific to AV002/SER120, an emulsified microdose spray with a permeation enhancer; a conventional desmopressin nasal spray is nearer 3.4% (PMID:8435898).');
    log.push('desmopressin — V 16 L and both ka dropped as unsourced; F values kept (both verbatim)');
  } else log.push('desmopressin — already applied, skipped');
}

// ── gonadorelin: a range midpoint, documented as one ──────────────────────
{
  const c = need('gonadorelin');
  if (!(c.notes ?? '').includes('5.5 to 8 min')) {
    note(c, 'PK: Pimstone 1977 (PMID:320223), normal subjects on constant IV infusion, states a RANGE rather than a value — verbatim "The t1/2 of the first component ranged from 5.5 to 8 min in normal subjects." The stored 0.11 h (6.6 min) is the midpoint of that range, kept because no scalar exists and recorded here so the spread is visible. Note it describes only the FIRST component: the same abstract says decay "was linear for 8-10 min, after which a much slower component was observed", so this value discards the slow phase. The paper also gives a metabolic clearance rate of 1640 +/- 59.7 mL/min.');
    log.push('gonadorelin — half-life documented as a range midpoint and a first-phase value');
  } else log.push('gonadorelin — already applied, skipped');
}

// ── octreotide: drop the contradicted ka; re-source the depot IM row ──────
{
  const c = need('octreotide');
  if (c.pk?.SC?.ka_hr === 2) {
    c.pk = {
      SC: { source_pmid: 'PMID:2876508' },
      IV: { source_pmid: 'PMID:2876508' },
      IM: { source_pmid: 'PMID:10806600' },
    };
    c.half_life_hr = { SC: 1.5, IV: 1.5, IM: 169 };
    addRefs(c, 'PMID:10806600', 'PMID:8287633');
    note(c, 'PK: Kutz 1986 (PMID:2876508), 8 healthy subjects, IV and SC, supports the 1.5 h half-life as a rounded central value of the stated ranges — "second half-lives of from 72 +/- 22 min to 98 +/- 37 min" (IV) and "The disposition half-life was from 88 +/- 20 min to 102 +/- 16 min" (SC). The ka of 2 /h was dropped 2026-09-06 as CONTRADICTED rather than merely unsourced: the same abstract states subcutaneous absorption "with a half-life ranging from 5.3 +/- 2.2 min to 11.7 +/- 7.6 min", implying 3.6-7.8 /h. V 21 L dropped — no primary states an octreotide volume; the 18-30 L range comes from a review (PMID:8287633). THE IM ROW WAS THE REAL DEFECT: it cited a study of a SUBCUTANEOUS depot and carried the immediate-release half-life. Intramuscular octreotide is the LAR depot, whose half-life is 169 h — Chen 2000 (PMID:10806600), 22 subjects, single 30 mg IM, verbatim "the apparent half-life (t1/2) was 169 hours" — roughly 113 times the value stored. Beware the coincidence in that abstract: its Cmax arrives "approximately 1.5 hours after dosing", a time to peak for the initial burst, not a half-life.');
    log.push('octreotide — IM half-life 1.5 -> 169 h (it is a depot); contradicted ka and unsourced V dropped');
  } else log.push('octreotide — already applied, skipped');
}

// ── secretin: the cited record has no abstract at all; re-source to dog ───
{
  const c = need('secretin');
  if (c.pk?.IV?.source_pmid === 'PMID:755275') {
    c.pk = { IV: { F: 1, source_pmid: 'PMID:4815082', source_species: 'dog' } };
    c.half_life_hr = { IV: 0.047 };
    addRefs(c, 'PMID:4815082', 'PMID:620494');
    note(c, 'PK is CANINE and labelled as such. The previous citation (PMID:755275) is a real human secretin infusion study, but PubMed holds title and authors only — there is NO ABSTRACT — so nothing in it could be verified by this registry\'s method, and its design (a low-dose steady-state infusion measuring pancreatic response) does not yield a bolus half-life anyway. No human secretin half-life is stated verbatim in any indexed abstract. Replaced by Boden 1974 (PMID:4815082), 3 anaesthetised DOGS on constant IV infusion, verbatim "the half-life of disappearance was 2.8+/-0.1 min" (0.047 h), with a metabolic clearance rate of 730 +/- 34 mL/min and a distribution volume of 17.4% of body weight. An independent PIG estimate gives 2.6 min (PMID:620494) — not averaged, and note the two species\' volumes differ about 2.7-fold. The stored 0.067 h matched neither. Also note the usable PK is all for PORCINE secretin while the stored mass is the human peptide.');
    log.push('secretin — re-sourced to a canine study, species-labelled (its citation has no abstract at all)');
  } else log.push('secretin — already applied, skipped');
}

// ── triptorelin: every stored value unsupported, and the route is a depot ─
{
  const c = need('triptorelin');
  if (c.pk?.IM) {
    const n = 'All four stored values were unsupported. The citation (PMID:20166771) is a drug-profile review of the 6-month embonate DEPOT reporting only testosterone pharmacodynamics and no PK parameter at all. The stored 4 h half-life describes immediate-release triptorelin, not a depot; the genuine human figure is 2.8 h after IV in healthy volunteers (PMID:9354307). A depot is release-limited and no abstract quantifies that, so the marketed intramuscular product has no modelable curve.';
    if (n.length > 500) throw new Error(`triptorelin note ${n.length}`);
    delete c.pk;
    c.half_life_hr = {};
    c.pk_unauthored = { reason: 'uncharacterized', note: n };
    addRefs(c, 'PMID:9354307');
    log.push('triptorelin — pk stripped, marked uncharacterized (IR half-life on a depot row)');
  } else log.push('triptorelin — already applied, skipped');
}

// ── ghrp-2: record the route caveat the first pass verified but did not write
{
  const c = need('ghrp-2');
  if (!(c.notes ?? '').includes('dosed intravenously')) {
    note(c, 'ROUTE CAVEAT: the 0.55 h half-life is verbatim — Pihoker 1998 (PMID:9543135), "t(1/2beta) = 0.55 +/- 0.14 h" — but that study dosed intravenously in ten prepubertal children, not subcutaneously in adults, and its own closing line concedes that extravascular data do not yet exist. The same paper also gives an apparent volume of 0.32 +/- 0.14 L/kg, not stored here because the route does not match.');
    log.push('ghrp-2 — IV-derivation and paediatric-population caveat recorded');
  } else log.push('ghrp-2 — already applied, skipped');
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
