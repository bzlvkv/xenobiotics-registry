/**
 * 2026-09-06-pk-resourcing.ts
 *
 * Closes the five `pk.pmid` warnings data-lint has carried since the morning's
 * citation-defects pass stripped citations that did not support their values,
 * and repairs the four "both carry authored PK" identity collisions the
 * `compound.identity-collision` rule flagged. Six parallel literature agents
 * fetched every candidate abstract through NCBI E-utilities; every number
 * written here is quoted verbatim in the cited abstract, and every number
 * removed here was found to be absent from — or contradicted by — the paper
 * it was attributed to. The dead-end PMIDs each agent chased are logged in
 * AUTHORING_GAPS.md §2026-09-06 so nobody re-runs those searches.
 *
 * The principle is the same one the citation-defects script applied: keep
 * what the abstract states, drop what it does not, and let resolvePk's
 * documented defaults stand in for an unknown rather than a number wearing
 * someone else's citation.
 *
 * ── Re-sourced routes ─────────────────────────────────────────────────────
 * dextromethorphan PO — Capon 1996 (PMID:8841152): "The median dextromethorphan
 *   half-life was 19.1 hours in poor metabolizers, 5.6 hours in extensive
 *   metabolizers given quinidine, and 2.4 hours in extensive metabolizers."
 *   Stored 2.5 h → 2.4 h (EM arm). The stored ka 1.5, V 300 L and F 0.11 are
 *   in no human abstract; F 0.11 and V ≈ 5.1 L/kg × 59 kg are exactly the DOG
 *   values of KuKanich 2004 (PMID:15500572). Dropped as species misattribution.
 * nabumetone PO — Daigneault 1987 (PMID:3687999), 24 healthy men, 1 g oral,
 *   6-MNA: "absorption half-life = 1.04:0.83 hour; elimination half-life =
 *   27.16:25.15 hours … time to peak concentration = 4.99:4.17 hours" (tablet:
 *   suspension). Stored 24 h → 27.16 h (tablet). ka = ln2 / 1.04 h = 0.67 /h —
 *   the same identity the registry uses for kₑₒ from t½kₑₒ. V 55 L and F 0.8
 *   dropped: the only human V is a 23–60 L range across a renal-impairment
 *   population (Brier 1995, PMID:7781261) and "at least 80% absorbed"
 *   (PMID:1474531) is parent absorption, not systemic availability of 6-MNA.
 *   The curve models 6-MNA, the circulating active species; noted on the record.
 * brompheniramine PO — Simons 1982 (PMID:6128358): "mean serum half-life value
 *   was 24.9 +/- 9.3 hr … mean volume of distribution was 11.7 +/- 3.1 L/kg",
 *   Tmax 3.1 h. Stored 25 h → 24.9 h; V 820 L kept as 11.7 L/kg × 70 kg. The
 *   stored ka 2 /h implies Tmax under an hour and contradicts the paper's 3.1 h;
 *   F 0.7 appears nowhere (no IV arm). Both dropped.
 * cortisol PO/IV — Derendorf 1991 (PMID:2050835), 20 mg IV/PO crossover: "total
 *   body clearance of 18 L/hr and a half-life of 1.7 hr. The volume of
 *   distribution was 34 L. Oral bioavailability averaged 96%." Replaces a
 *   citation (PMID:15634032, a review) whose abstract holds no number at all.
 *   Johnson 2018 (PMID:29795974) corroborates F: "1.00 (0.89-1.14)". The IM
 *   route is dropped: no human abstract states an IM absorption parameter, and
 *   the two records' IM ka values (1.89 vs 1.58 /h) had no source.
 * ghb PO — Brenneisen 2004 (PMID:15538955) already cited for t½ 0.51 h, and
 *   also states "the distribution volume 52.7 +/- 15.0 L". V added.
 *
 * ── Marked as having no modelable PK ──────────────────────────────────────
 * cdp-choline — the stored 56 h half-life is the midpoint of "2.0 to 2.6 days"
 *   in Paroni 1985 (PMID:4059318): RAT total-radioactivity kinetics, every
 *   labelled metabolite including phospholipid-bound choline. No human abstract
 *   states a half-life, F, Tmax or V for citicoline; in humans the tracked
 *   species are plasma choline and uridine (Wurtman 2000, PMID:10974208).
 *   → pk_unauthored: uncharacterized.
 * calcium, calcium-carbonate, zinc, zinc-picolinate — each carried a t½/ka/V/F
 *   quartet; the cited abstracts state only calcium's two absorption fractions
 *   (TFCA 0.26, PMID:2816495; CaCO3 14.7%, PMID:22254052). Every half-life and
 *   volume was unsourced (calcium V 560 L vs 25 L; zinc t½ 6 h vs 50 h for one
 *   ion). Plasma calcium and zinc are defended by regulation, so a Bateman
 *   curve is the wrong model — the same reasoning that marked glucose.
 *   → pk_unauthored: homeostatic, verbatim absorption facts kept in `notes`.
 *
 * ── PD moved ahead of the ghb / sodium-oxybate merge ──────────────────────
 * The kₑₒ (Van Sassenbroeck 2001, PMID:11804399, rat EEG: "t1/2k(e,0) of 5.6
 * +/- 0.3 min" → 7.43 /h) and the GABA-B row (Lingenhoehl 1999, PMID:10587082:
 * "EC50 of approximately 5 mM … maximal stimulation of 69%") move from
 * sodium-oxybate to ghb, which the merge script would otherwise discard with
 * the retired record. Two corrections on the way across: emax 1 → 0.69 (the
 * row's own note said "set emax ~= 0.69 (NOT 1)" and it was never applied) and
 * EC50 re-derived at the free-acid MW 104.1 → 520.5 mg/L, because the surviving
 * record doses GHB, not its sodium salt.
 *
 * Run BEFORE 2026-09-06-merge-duplicate-slugs.ts (which retires hydrocortisone
 * and sodium-oxybate). Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

type Route = string;
interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string; source_label?: string; [k: string]: unknown }
interface Compound {
  slug: string;
  routes?: Route[];
  doses?: Record<Route, unknown>;
  half_life_hr?: Record<Route, number>;
  pk?: Record<Route, RoutePk>;
  pk_unauthored?: { reason: string; note?: string };
  effect_compartment?: Record<string, unknown>;
  receptor_occupancy?: Record<string, unknown>[];
  refs?: string[];
  notes?: string;
  mw_g_mol?: number;
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (slug: string) => { const c = by.get(slug); if (!c) throw new Error(`${slug} not in registry`); return c; };
const addRefs = (c: Compound, ...pmids: string[]) => { c.refs ??= []; for (const p of pmids) if (!c.refs.includes(p)) c.refs.push(p); };
const appendNote = (c: Compound, text: string) => { if (!(c.notes ?? '').includes(text)) c.notes = c.notes ? `${c.notes} ${text}` : text; };

// ── 1. dextromethorphan PO ─────────────────────────────────────────────────
{
  const c = need('dextromethorphan');
  if (c.pk?.PO && !c.pk.PO.source_pmid) {
    c.pk.PO = { source_pmid: 'PMID:8841152' };
    c.half_life_hr = { ...c.half_life_hr, PO: 2.4 };
    appendNote(c, 'PK: Capon 1996 (PMID:8841152), 30 mg single dose, verbatim "2.4 hours in extensive metabolizers" (median; 19.1 h in poor metabolizers). No human abstract states ka, V or F; the formerly stored F 0.11 / V 300 L match the canine values of KuKanich 2004 (PMID:15500572) and were removed as a species misattribution.');
    log.push('dextromethorphan.PO — t½ 2.5→2.4 h cited; ka/V/F dropped (dog-derived)');
  } else log.push('dextromethorphan.PO — already sourced, skipped');
}

// ── 2. nabumetone PO ───────────────────────────────────────────────────────
{
  const c = need('nabumetone');
  if (c.pk?.PO && !c.pk.PO.source_pmid) {
    c.pk.PO = { ka_hr: 0.67, source_pmid: 'PMID:3687999' };
    c.half_life_hr = { ...c.half_life_hr, PO: 27.16 };
    addRefs(c, 'PMID:3687999', 'PMID:6526543', 'PMID:7781261');
    appendNote(c, 'PK models 6-MNA, the circulating active metabolite (nabumetone is a prodrug). Daigneault 1987 (PMID:3687999), 24 healthy men, 1 g tablet: verbatim "absorption half-life = 1.04 … elimination half-life = 27.16 … hours", Tmax 4.99 h; ka = ln2/1.04 h = 0.67 /h. Steady-state t½ 22.77/22.0 h (PMID:6526543) corroborates. V and F are not stated for healthy subjects in any abstract (Brier 1995, PMID:7781261, gives an apparent V of 23–60 L across a renal-impairment population) and are left to solver defaults.');
    log.push('nabumetone.PO — t½ 24→27.16 h + ka 0.67 cited; V/F dropped');
  } else log.push('nabumetone.PO — already sourced, skipped');
}

// ── 3. brompheniramine PO ──────────────────────────────────────────────────
{
  const c = need('brompheniramine');
  if (c.pk?.PO && c.pk.PO.ka_hr != null) {
    c.pk.PO = { V_L: 820, source_pmid: 'PMID:6128358' };
    c.half_life_hr = { ...c.half_life_hr, PO: 24.9 };
    appendNote(c, 'PK: Simons 1982 (PMID:6128358), 7 adults, racemate: verbatim "mean serum half-life value was 24.9 +/- 9.3 hr … mean volume of distribution was 11.7 +/- 3.1 L/kg" (× 70 kg = 820 L; apparent V/F since no IV arm), Tmax 3.1 h. The formerly stored ka 2 /h implied Tmax under an hour and F 0.7 was unsourced; both removed. H1 affinity remains unauthored — no abstract names a brompheniramine H1 Ki (see AUTHORING_GAPS).');
    log.push('brompheniramine.PO — t½ 25→24.9 h; V kept (11.7 L/kg×70); ka/F dropped');
  } else log.push('brompheniramine.PO — already re-sourced, skipped');
}

// ── 4. cortisol PO / IV re-sourced, IM dropped ─────────────────────────────
{
  const c = need('cortisol');
  if (c.pk?.PO?.source_pmid !== 'PMID:2050835') {
    c.pk = {
      PO: { F: 0.96, V_L: 34, source_pmid: 'PMID:2050835' },
      IV: { V_L: 34, F: 1, source_pmid: 'PMID:2050835' },
    };
    c.half_life_hr = { PO: 1.7, IV: 1.7 };
    c.routes = (c.routes ?? []).filter((r) => r !== 'IM');
    if (c.doses && 'IM' in c.doses) delete c.doses.IM;
    addRefs(c, 'PMID:2050835', 'PMID:29795974', 'PMID:7143223');
    appendNote(c, 'PK: Derendorf 1991 (PMID:2050835), 20 mg IV/PO crossover in dexamethasone-suppressed subjects, verbatim "half-life of 1.7 hr. The volume of distribution was 34 L. Oral bioavailability averaged 96%", Tmax 1 h; ka not stated. Johnson 2018 (PMID:29795974) corroborates F "1.00 (0.89-1.14)". Half-life is dose-conditional through CBG saturation — 1.2 h at 5 mg rising to 1.7 h at 40 mg (Toothaker 1982, PMID:7143223); the 20 mg value is stored. IM route removed 2026-09-06: no human abstract states an IM absorption parameter. hydrocortisone is the same molecule and was merged into this record.');
    log.push('cortisol — PO/IV re-sourced to Derendorf 1991; IM route dropped');
  } else log.push('cortisol — already re-sourced, skipped');
}

// ── 5. ghb: V from its own citation; PD moved across from sodium-oxybate ───
{
  const g = need('ghb');
  const so = by.get('sodium-oxybate');
  if (g.pk?.PO && g.pk.PO.V_L == null) {
    g.pk.PO = { V_L: 52.7, source_pmid: 'PMID:15538955' };
    appendNote(g, 'Same paper states "the distribution volume 52.7 +/- 15.0 L" (V added 2026-09-06). Brailsford 2012 (PMID:22337777), 12 volunteers, 25 mg/kg PO: Tmax 24.6 min whole blood; no t½, V or F in the abstract.');
    addRefs(g, 'PMID:22337777');
    log.push('ghb.PO — V 52.7 L added from PMID:15538955');
  }
  if (!g.effect_compartment && so?.effect_compartment) {
    g.effect_compartment = { ...so.effect_compartment };
    delete so.effect_compartment;
    addRefs(g, 'PMID:11804399');
    log.push('ghb — kₑₒ 7.43 /h moved from sodium-oxybate (rat surrogate flag intact)');
  }
  if (!(g.receptor_occupancy?.length) && so?.receptor_occupancy?.length) {
    const mw = g.mw_g_mol ?? 104.1;
    const row = { ...so.receptor_occupancy[0] } as Record<string, unknown>;
    row.emax = 0.69;
    row.ec50_mg_l = Number((5e6 * mw / 1e6).toFixed(1)); // 5 mM × 104.1 g/mol
    row.note = `Lingenhoehl 1999 (PMID:10587082) — GHB is the paper SUBJECT. Recombinant GABA(B)R1/R2 + Kir3 in Xenopus oocytes; functional EC50 verbatim "approximately 5 mM" → 5 mM × ${mw} g/mol (free acid, the dosed and circulating species here) = ${row.ec50_mg_l} mg/L. PARTIAL AGONIST: verbatim "a maximal stimulation of 69% when compared to the GABA(B) receptor agonist L-baclofen" → emax 0.69; the pre-merge sodium-oxybate row stored 1 against its own note. hill_n 1 is a modelling default, not stated.`;
    g.receptor_occupancy = [row];
    delete so.receptor_occupancy;
    addRefs(g, 'PMID:10587082');
    log.push(`ghb — GABA-B row moved from sodium-oxybate; emax 1→0.69, EC50 630.45→${row.ec50_mg_l} mg/L at free-acid MW`);
  }
}

// ── 6. Homeostatic minerals ────────────────────────────────────────────────
const HOMEOSTATIC: Record<string, { note: string; refs: string[] }> = {
  calcium: {
    refs: ['PMID:2816495'],
    note: 'Plasma calcium is held within a narrow band by PTH, calcitriol and calcitonin; an oral load changes absorption and renal handling, not a first-order plasma curve. The formerly stored t½ 5 h / ka 0.8 / V 560 L were unsourced. What the citation does state: true fractional calcium absorption of habitual dietary calcium was 0.26 (Eastell 1989, PMID:2816495, 12 subjects, stable-isotope method) — and it falls as intake rises.',
  },
  'calcium-carbonate': {
    refs: ['PMID:22254052'],
    note: 'Calcium is homeostatically regulated (see calcium). The formerly stored t½ 4 h / ka 0.4 / V 25 L were unsourced. What the citation does state: fractional absorption of carrier-free CaCO3 was 14.7 ± 6.4% in 10 vitamin-D-insufficient postmenopausal women (Uenishi 2010, PMID:22254052) — a population-specific figure, not a constant.',
  },
  zinc: {
    refs: ['PMID:18271278'],
    note: 'Plasma zinc is defended by intestinal absorption and endogenous secretion responding to zinc status; a supplemental dose does not trace a Bateman curve. The formerly stored t½ 6 h / ka 1 / V 14 L / F 0.25 were unsourced: Gandia 2007 (PMID:18271278, 12 women, 15 mg) reports only a relative result, bis-glycinate "+43.4%" bioavailability over gluconate, with no absolute value.',
  },
  'zinc-picolinate': {
    refs: ['PMID:3630857'],
    note: 'Zinc is homeostatically regulated (see zinc). The formerly stored t½ 50 h / ka 0.3 / V 35 L / F 0.3 were unsourced: Barrie 1987 (PMID:3630857, 15 volunteers, 50 mg/day for 4 weeks each of picolinate, citrate, gluconate, placebo) is a static-endpoint trial with no concentration-time sampling; it reports that hair, urine and erythrocyte zinc rose significantly on picolinate and on none of the others — a qualitative absorption advantage, not a parameter.',
  },
};
for (const [slug, { note, refs }] of Object.entries(HOMEOSTATIC)) {
  const c = need(slug);
  if (c.pk_unauthored) { log.push(`${slug} — already pk_unauthored, skipped`); continue; }
  delete c.pk;
  c.half_life_hr = {};
  c.pk_unauthored = { reason: 'homeostatic', note };
  addRefs(c, ...refs);
  if (c.notes) c.notes = c.notes.replace(/\s*Picolinate form ~30% bioavailable\.?/i, '');
  // A declared-estimate kₑₒ with no PK to drive it renders nothing; drop it
  // rather than leave a Pharmacodynamics section that means nothing.
  if (c.effect_compartment && c.effect_compartment.approximated && !(c.receptor_occupancy?.length)) {
    delete c.effect_compartment;
    log.push(`${slug} — approximated kₑₒ dropped (no PK to drive it)`);
  }
  log.push(`${slug} — pk stripped, marked homeostatic`);
}

// ── 7. cdp-choline: no modelable PK ────────────────────────────────────────
{
  const c = need('cdp-choline');
  if (!c.pk_unauthored) {
    delete c.pk;
    c.half_life_hr = {};
    c.pk_unauthored = {
      reason: 'uncharacterized',
      note:
        'No human abstract states a half-life, bioavailability, Tmax or volume for oral citicoline. The stored 56 h was the midpoint of "2.0 to 2.6 days" in Paroni 1985 (PMID:4059318) — rat total-radioactivity kinetics, not a human parameter — and F 0.99 read "less than 1% of the dose being found in the faeces" (PMID:6412727) as systemic availability of a compound hydrolysed in the gut wall. Humans track plasma choline and uridine, elevated 5–10 h by dose (PMID:10974208).',
    };
    addRefs(c, 'PMID:6412727', 'PMID:10974208');
    log.push('cdp-choline — pk stripped (rat-derived), marked uncharacterized');
  } else log.push('cdp-choline — already pk_unauthored, skipped');
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
