/**
 * 2026-09-19-rimantadine.ts
 *
 * One compound, picked up from the "free for the taking" note the amantadine
 * session left in AUTHORING_GAPS. It turned out to be worth more than that note
 * promised: the plan was to transcribe the two numbers Hayden reports beside
 * amantadine's, and a second paper turned out to carry an AUC, which is a
 * VOLUME once it sits beside a half-life.
 *
 * ── Why the half-life is 27.5 h and not Hayden's 36.5 h ───────────────────
 *
 * Both are verbatim, both are healthy adults, and they disagree:
 *
 *   PMID:3834831  *"plasma elimination half-life (36.5 +/- 15 versus 16.7 +/-
 *                 7.7 h)"* — rimantadine first, n = 12 (six young, six elderly)
 *   PMID:3365917  *"The plasma half-life (43.6 vs 27.5 hours)"* — ESRD patients
 *                 first, healthy controls second, n = 7 healthy
 *
 * 27.5 h is stored, and NOT because it is the better measurement — Hayden's
 * cohort is larger and purpose-built. It is stored because the volume below is
 * derived from THAT PAPER'S AUC, and a volume built from one paper's clearance
 * and another paper's elimination rate is a number neither paper supports.
 * Keeping ke and CL in the same study is what makes the derivation checkable.
 *
 * The two are not in conflict anyway: 36.5 +/- 15 h spans 21.5-51.5 h, which
 * contains 27.5. Hayden's value is recorded in `notes` so the disagreement is
 * visible rather than quietly resolved.
 *
 * ── The volume, derived and cross-checked ─────────────────────────────────
 *
 * PMID:3365917 gives, for the healthy arm, after two 100 mg doses:
 *   AUC   *"6.0 +/- 1.6 micrograms.hr/ml"*   = 6.0 mg·h/L
 *   t½    *"27.5 hours"*
 *
 *   CL/F = 200 mg / 6.0 mg·h/L        = 33.33 L/h
 *   V/F  = (CL/F) / (ln2 / 27.5 h)    = 1322 L = 18.9 L/kg at 70 kg
 *
 * THE CROSS-CHECK IS THE POINT. 18.9 L/kg is an independently recognisable
 * number for this molecule — rimantadine is the adamantane that distributes
 * far more extensively than amantadine, which is exactly why its half-life is
 * roughly double amantadine's while its Cmax is a third of it, off the same
 * 200 mg dose in the same crossover. The derivation reproduces that
 * relationship from unrelated inputs, and the same paper's own remark that the
 * *"apparent volume of distribution"* did not differ between its two groups
 * confirms it is a quantity that study actually estimated.
 *
 * ── What this record does, MEASURED (and the pattern it confirms) ─────────
 *
 * Resolved through `resolvePk` at 200 mg:
 *
 *   AUC   5.40 mg·h/L  vs 6.0 published   — 10% low, entirely the default F of
 *                                            0.9 double-counting an apparent
 *                                            V/F that already contains F
 *   Cmax  0.124 mg/L   vs 0.250 published — 0.50x, i.e. HALF
 *
 * The AUC being right and the Cmax being half is not a defect in the numbers;
 * it is the structure. 18.9 L/kg is a DISTRIBUTION volume and Cmax is set by
 * the CENTRAL one, so a one-compartment model driven by V_z reproduces exposure
 * and terminal decay and understates the peak — by more, the more the drug
 * distributes. Amantadine (4.87 L/kg) came in at 0.71x on the same test three
 * days ago; rimantadine at 18.9 L/kg comes in at 0.50x. **Two points, same
 * direction, magnitude tracking the volume.** That upgrades the amantadine
 * session's "worth a sweep of its own" from a hunch to a measured pattern, and
 * the gaps file now says so.
 *
 * Storing it is still unambiguously right. At the 35 L default the same
 * calculation peaks at 4.68 mg/L — **18.7x the published Cmax**, and in the
 * direction that flatters the drug.
 *
 * ── Skipped ──────────────────────────────────────────────────────────────
 *   ka                    no abstract states a Tmax. PMID:3365917 mentions
 *                         *"time of maximum concentration"* only to say it did
 *                         not differ between groups.
 *   F                     no absolute bioavailability study.
 *   dose_moiety_fraction  same call as amantadine, same reason — the dosed
 *                         salt is already inside the published AUC.
 *
 * Run:  pnpm tsx scripts/authoring/2026-09-19-rimantadine.ts
 * Idempotent: the slug is skipped if present, so a re-run is a no-op.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Both trees' seeds — see 2026-09-18 for why v12's JSON is written even though
 *  its README names Postgres as the source of truth. Neither write reaches
 *  v12's `registry.compound` table; that needs /admin. */
const TARGETS = [
  join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json'),
  join(__dirname, '..', '..', '..', '..', '..', 'v12', 'packages', 'registry', 'data', 'compounds.json'),
];

interface Compound {
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  mechanism: string;
  routes: string[];
  doses: Record<string, { min: number; max: number; typical: number; unit: string }>;
  half_life_hr: Record<string, number>;
  pk?: Record<string, Record<string, unknown>>;
  mw_g_mol?: number;
  systems: string[];
  notes?: string;
  refs: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  {
    slug: 'rimantadine',
    name: 'Rimantadine',
    aliases: ['Flumadine', 'rimantadine hydrochloride', 'alpha-methyl-1-adamantanemethylamine'],
    category: 'pharmacological',
    mechanism:
      'Alpha-methyl analogue of amantadine and, like it, a blocker of the influenza A M2 proton channel — it prevents the pH-dependent uncoating step that releases viral RNA into the cytoplasm, so it acts on influenza A only and not influenza B, which has no M2. Widespread M2 resistance has made both adamantanes clinically obsolete against circulating strains. It differs from amantadine in disposition rather than in target: it distributes far more extensively, is cleared by hepatic hydroxylation and conjugation rather than by the kidney, and reaches the respiratory mucosa at a higher fraction of its plasma concentration. Lower CNS exposure gives it the milder neurological side-effect profile that made it the preferred adamantane where it was available — and, unlike amantadine, it is not used for parkinsonism or fatigue.',
    routes: ['PO'],
    doses: { PO: { min: 100, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { PO: 27.5 },
    pk: { PO: { V_L: 1322, source_pmid: 'PMID:3365917' } },
    mw_g_mol: 179.3,
    systems: ['respiratory', 'digestive', 'nervous'],
    notes:
      'PubChem CID 5071 (C12H21N, free base). PK IS A DERIVATION FROM TWO VERBATIM VALUES IN ONE PAPER. Capparelli 1988 (PMID:3365917), seven healthy subjects given two 100 mg doses, states "The plasma half-life (43.6 vs 27.5 hours) and AUC (9.9 +/- 2.1 vs 6.0 +/- 1.6 micrograms.hr/ml)" for end-stage renal disease versus healthy controls. The HEALTHY arm is taken: t½ 27.5 h, AUC 6.0 mg·h/L at 200 mg, giving CL/F = 200/6.0 = 33.33 L/h and V/F = 33.33/(ln2/27.5) = 1322 L, which is 18.9 L/kg at the 70 kg reference. CROSS-CHECK: 18.9 L/kg is the recognisable value for this molecule, and it is what makes rimantadine\'s own comparison with amantadine cohere — in one crossover at one 200 mg dose (PMID:3834831) rimantadine has roughly double amantadine\'s half-life and roughly a third of its Cmax, which only a much larger distribution volume produces. The same abstract also notes the apparent volume of distribution did not differ between its groups, so it is a quantity that study estimated. WHY NOT HAYDEN\'S HALF-LIFE: PMID:3834831 states "plasma elimination half-life (36.5 +/- 15 versus 16.7 +/- 7.7 h)" with rimantadine first, and that is a fine number — but the volume here is built from PMID:3365917\'s AUC, and pairing one paper\'s clearance with another paper\'s elimination rate yields a volume neither supports. The two agree within Hayden\'s own dispersion (36.5 +/- 15 spans 21.5-51.5 h). MEASURED BEHAVIOUR, not assumed: resolved through resolvePk at 200 mg this record gives AUC 5.40 mg·h/L against the published 6.0 (10% low, the default F of 0.9 double-counting an apparent V/F that already contains F) and Cmax 0.124 mg/L against the published 0.250 — half. The Cmax gap is structural and expected: 18.9 L/kg is a distribution volume while Cmax is set by the central one, so a one-compartment fit driven by it gets exposure and terminal decay right and understates the peak. Amantadine scored 0.71x on the same test at 4.87 L/kg; the error tracks the volume. At the 35 L default this record would instead peak at 4.68 mg/L, 18.7x the published Cmax. EXCRETION, two figures, both verbatim and not reconciled here: PMID:3834831 gives "0.6 +/- 0.8%" of the dose excreted unchanged in 24 h and 19% as unchanged drug plus hydroxylated metabolites; PMID:3365917 gives 16% unchanged over its own collection. Different windows and assays; both say the same thing qualitatively, which is that unlike amantadine this drug is metabolised rather than renally excreted. SALT: labelled strength names rimantadine hydrochloride, whose free base is 0.8310 of the formula mass, but dose_moiety_fraction is deliberately UNSET for the same reason as amantadine — the cited studies administered the hydrochloride, so the published AUC is already denominated per milligram of that salt mass and the conversion sits inside the derived volume. NO ka: no abstract states a Tmax; PMID:3365917 mentions "time of maximum concentration" only to report that it did not differ between groups. Dose range is the 100 mg twice-daily adult regimen of PMID:3606083 and the 200 mg single doses of the two cited PK studies.',
    refs: ['PMID:3365917', 'PMID:3834831', 'PMID:3606083', 'PMID:7606077'],
  },
];

for (const path of TARGETS) {
  if (!existsSync(path)) {
    console.log(`skip (absent): ${path}`);
    continue;
  }
  const data = JSON.parse(readFileSync(path, 'utf-8')) as Compound[];
  const live = new Set(data.map((c) => c.slug));
  for (const c of data) for (const s of (c.retired_slugs as string[] | undefined) ?? []) live.add(s);

  const added: string[] = [];
  const skipped: string[] = [];
  for (const c of NEW_COMPOUNDS) {
    if (live.has(c.slug)) {
      skipped.push(c.slug);
      continue;
    }
    data.push(c);
    live.add(c.slug);
    added.push(c.slug);
  }
  if (added.length) writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  console.log(`${path}\n  added ${added.length}: ${added.join(', ') || '(none)'}`);
  if (skipped.length) console.log(`  skipped ${skipped.length} already present: ${skipped.join(', ')}`);
  console.log(`  catalog now ${data.length} compounds`);
}
