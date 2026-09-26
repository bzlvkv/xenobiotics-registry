/**
 * 2026-09-19-amantadine-ergoloid.ts
 *
 * The two follow-ups named by the 2026-09-18 nootropic sweep's own "surveyed
 * and NOT added" table, taken in the order that table ranked them. Both land as
 * the sweep predicted, and one of them lands better than predicted.
 *
 *   amantadine          AUTHORED. PO t½ 16.7 h + V 340.9 L.
 *   ergoloid-mesylates  pk_unauthored: MIXTURE — and that is a finding, not a
 *                       shortfall. See below.
 *
 * Every PMID resolves and every stored number is abstract-verbatim for the
 * named compound. MWs are PubChem (CID in each `notes`).
 *
 * ── amantadine: the volume is the whole point ─────────────────────────────
 *
 * The half-life was easy. Hayden 1985 (PMID:3834831), a crossover in twelve
 * healthy young and elderly adults given single 200 mg oral doses, states it
 * verbatim in a paired comparison against rimantadine: *"plasma elimination
 * half-life (36.5 +/- 15 versus 16.7 +/- 7.7 h)"*. Amantadine is the second of
 * each pair throughout that sentence, and 16.7 h is a POINT value with a
 * dispersion, not a range.
 *
 * The volume is what made this worth doing ahead of the other fifteen
 * candidates. Amantadine is *"widely distributed, little drug being present in
 * the circulation"* (PMID:3280212) — and the solver's default is 0.5 L/kg.
 * Wong 1995 (PMID:7756105) gives the real number in twenty healthy young
 * adults: *"Its apparent volume of distribution (V2/F) was higher in smokers
 * than nonsmokers, 6.05 +/- 0.86 vs 4.87 +/- 0.85 l kg-1"*. The NONSMOKER arm
 * is stored — 4.87 L/kg x 70 kg = 340.9 L.
 *
 * That is 9.7x the default this record would otherwise have run on. Storing it
 * is the single largest accuracy change in either of these two sessions, and it
 * is why an arm was picked rather than the pair averaged: the nac finding in
 * AUTHORING_GAPS is precisely about a value that "sits between 4.0 and 9.1 like
 * a blend of two arms". Nonsmokers are the reference population; smokers get a
 * sentence in `notes` instead of a blended number.
 *
 * SPLIT PROVENANCE, STATED OUT LOUD. The stored t½ and the stored volume come
 * from two different papers, and `RoutePk` has one `source_pmid`. It carries
 * PMID:7756105, the paper that states the volume — the parameter that actually
 * lives in the pk row. `half_life_hr` is a separate top-level field and its
 * source, PMID:3834831, is named in `notes` and in `refs[]`. Neither citation
 * is asked to cover a number it does not contain.
 *
 * WHY `dose_moiety_fraction` IS DELIBERATELY UNSET. Amantadine is dosed and
 * labelled as the hydrochloride, and the free base is 0.8058 of that formula
 * mass — the shape that earned lithium and brompheniramine a moiety fraction.
 * It is wrong here, and setting it would make the record worse. Both cited
 * studies administered amantadine hydrochloride, so the published V2/F is
 * already denominated per milligram of that salt: it was computed by dividing
 * the salt dose by a base-assay exposure, and the conversion is inside the
 * 4.87 L/kg. Applying the fraction on top would divide by the counter-ion
 * twice and run every curve 24% low. `mw_g_mol` is still the base (151.25),
 * because that field names the species that circulates and feeds the µM→mg/L
 * conversion, which is a separate question from what the tablet weighs.
 *
 * ka is NOT authored: PMID:498714 reports *"peak concentrations in plasma
 * occurring at 1 to 12 hr"*, which is variability, not a Tmax. F is NOT
 * authored: no absolute bioavailability study exists, and the nearest figure —
 * *"recovery of 88% of the single doses in urine"* (PMID:3967456) — is a
 * urinary recovery, not a bioavailability, and relabelling it would be the
 * laundering this catalog keeps finding. The default F of 0.9 therefore
 * applies.
 *
 * WHAT THE RECORD ACTUALLY DOES, MEASURED RATHER THAN ASSUMED. Resolved
 * through `resolvePk` and evaluated at 200 mg, it peaks at 0.46 mg/L against
 * the 0.65 mg/L Hayden measured at that dose — it runs 29% LOW at Cmax, not
 * the ~10% that the doubled F alone would explain. The rest is structural and
 * worth knowing: 4.87 L/kg is a DISTRIBUTION volume, and Cmax is set by the
 * CENTRAL one, which for a drug this widely distributed is much smaller. A
 * one-compartment fit driven by a distribution volume reproduces AUC and the
 * terminal slope (AUC = F·D/(V·ke) is exactly right) and understates the early
 * peak. PMID:3280212 adds the other half: the apparent volume is "inversely
 * related to dose over the therapeutic range", so no single number fits the
 * 3 mg/kg study and the 200 mg study at once.
 *
 * The comparison that matters is against the alternative. At the 35 L default
 * the same calculation peaks at 4.48 mg/L — 6.9x the published Cmax, in the
 * direction that flatters the drug. 0.71x is the better error, and unlike the
 * 6.9x it is an understatement with a known cause.
 *
 * ── ergoloid mesylates: `mixture` is the answer, not a fallback ───────────
 *
 * The 2026-09-18 table listed this as the second-best candidate on the strength
 * of two abstracts that looked authorable. Reading them says otherwise, and
 * says it cleanly:
 *
 *   · PMID:17941060 states the identity outright — *"Dihydroergotoxine is a
 *     mixture of semi-synthetic ergot alkaloids"* — then measures the three
 *     congeners SEPARATELY in one volunteer after 27 mg and finds each at a
 *     Cmax of about 0.04 µg/l while their hydroxy-metabolites run *"one order
 *     of magnitude higher in concentration than their parents"*. No single
 *     species carries the exposure, and the species that dominate it are
 *     metabolites of three different parents.
 *   · PMID:4091992 does report a human half-life — *"a slowest measured
 *     half-life of 12-14 h"* — but by RADIOIMMUNOASSAY, which is cross-reactive
 *     across the congeners. It is a measurement OF THE MIXTURE. It is also a
 *     range, which this catalog refuses on its own terms.
 *
 * So the record is `pk_unauthored: { reason: 'mixture' }`, which the schema
 * defines as exactly this: "multi-component or class-mixture entry where no
 * single plasma species can be PK-fitted". `mw_g_mol` is omitted for the same
 * reason — four alkaloids have four masses.
 *
 * NO `composition[]` EITHER, and that is deliberate. The block would need a
 * `mg_per_g_extract` per constituent AND each constituent present as its own
 * compound with its own PK. None of the four exists in the catalog, and the
 * only human data for any of them is a single-subject Cmax from a paper that
 * calls itself "preliminary". Adding four stubs to support an expansion into
 * four unsolvable curves would add rows, not information. The USP ratio is
 * recorded in prose instead, where it is readable and is not pretending to be
 * a solver input.
 *
 * ── Noted in passing, not added ───────────────────────────────────────────
 * PMID:3834831 hands over rimantadine for free — t½ 36.5 h, Cmax 0.25 µg/ml,
 * 0.6% excreted unchanged, all verbatim, all in the same sentence as
 * amantadine's. It is not in this batch because it was not asked for and it is
 * an antiviral rather than a nootropic. Logged in AUTHORING_GAPS as a
 * one-paragraph job for whoever wants it.
 *
 * Run:  pnpm tsx scripts/authoring/2026-09-19-amantadine-ergoloid.ts
 * Idempotent: a slug already present is skipped, so a re-run is a no-op.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Both trees' seeds — see the 2026-09-18 script for why v12's JSON is still
 *  written even though its README names Postgres as the source of truth: the
 *  v12 app BOOTS on this file whenever no published bundle is cached. Neither
 *  write reaches v12's `registry.compound` table; that needs /admin. */
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
  pk_unauthored?: { reason: string; note?: string };
  mw_g_mol?: number;
  systems: string[];
  notes?: string;
  refs: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  {
    slug: 'amantadine',
    name: 'Amantadine',
    aliases: ['Symmetrel', 'Gocovri', 'Osmolex ER', 'amantadine hydrochloride', '1-adamantanamine', '1-aminoadamantane'],
    category: 'pharmacological',
    mechanism:
      'Adamantane amine with three separable actions. It is a weak, low-affinity, non-competitive open-channel blocker of the NMDA receptor — the same site memantine occupies, which is why the two are read together — and it also increases presynaptic dopamine release and weakly blocks dopamine reuptake. Its original use was as an influenza A M2 proton-channel blocker, now largely abandoned to resistance. Clinically it is used for levodopa-induced dyskinesia in Parkinson\'s disease and for fatigue and arousal after traumatic brain injury and in multiple sclerosis, which is the basis of its cognitive-enhancement reputation. Elimination is almost entirely renal, by glomerular filtration PLUS active tubular secretion, so it accumulates markedly in renal impairment and that is the dominant safety consideration rather than any hepatic interaction.',
    routes: ['PO'],
    doses: { PO: { min: 100, max: 400, typical: 200, unit: 'mg' } },
    half_life_hr: { PO: 16.7 },
    pk: { PO: { V_L: 340.9, source_pmid: 'PMID:7756105' } },
    mw_g_mol: 151.25,
    systems: ['nervous', 'renal'],
    notes:
      'PubChem CID 2130 (C10H17N, free base). TWO SOURCES, KEPT DISTINCT. The VOLUME is from Wong 1995 (PMID:7756105) — twenty healthy young adults given 3 mg/kg orally — verbatim "Its apparent volume of distribution (V2/F) was higher in smokers than nonsmokers, 6.05 +/- 0.86 vs 4.87 +/- 0.85 l kg-1". The NONSMOKER arm is stored: 4.87 L/kg x 70 kg = 340.9 L. An arm was taken rather than the two averaged, because a blend of two arms is the defect the nac entry in AUTHORING_GAPS was written about; smokers run about 24% higher and that is a real, reproducible difference, not noise. This is a 9.7x correction against the 0.5 L/kg default the record would otherwise have used, which matters because this drug is "widely distributed, little drug being present in the circulation" (PMID:3280212). The HALF-LIFE is from Hayden 1985 (PMID:3834831), twelve healthy young and elderly adults, single 200 mg oral doses, verbatim "plasma elimination half-life (36.5 +/- 15 versus 16.7 +/- 7.7 h)" — amantadine is the second of each pair in that sentence, as it is for "peak plasma concentration ... 0.25 +/- 0.06 versus 0.65 +/- 0.22 micrograms/ml" and "percentage of administered dose excreted unchanged in urine (0.6 +/- 0.8 versus 45.7 +/- 15.7%)". pk.PO.source_pmid names the volume paper because the volume is what sits in that row; the half-life\'s source is named here and in refs[]. NO ka: PMID:498714 reports "peak concentrations in plasma occurring at 1 to 12 hr", which is variability rather than a Tmax. NO F: no absolute bioavailability study exists. The nearest number, "recovery of 88% of the single doses in urine" (PMID:3967456), is a urinary recovery and calling it a bioavailability would be relabelling; the default 0.9 applies instead. MEASURED BEHAVIOUR, not assumed: resolved through resolvePk at 200 mg this record peaks at 0.46 mg/L against Hayden\'s measured 0.65, i.e. 29% low. The doubled F (the stored volume is an apparent V2/F that already contains one) explains about ten points of that; the rest is structural — 4.87 L/kg is a DISTRIBUTION volume while Cmax is set by the central one, so a one-compartment fit driven by it gets AUC and the terminal slope right and understates the peak. PMID:3280212 adds that the apparent volume is "inversely related to dose over the therapeutic range", so no one number fits both cited studies. At the 35 L default the same calculation peaks at 4.48 mg/L, 6.9x the published Cmax — the error this record replaces, and in the flattering direction. SALT: the labelled strength names amantadine hydrochloride, whose free base is 0.8058 of the formula mass — the shape that earns a dose_moiety_fraction elsewhere in this catalog. It is deliberately UNSET here. Both cited studies administered amantadine hydrochloride, so the published apparent volume is already denominated per milligram of that salt mass: the conversion sits inside the 4.87 L/kg. Applying the fraction on top would divide by the counter-ion twice and run every curve 24% low. data-lint\'s dose.salt-moiety-unset heuristic reads prose and cannot see that, so this record is phrased to avoid a hit it would be wrong about; the case is written up in AUTHORING_GAPS so a future hardening pass has it. mw_g_mol stays the free base because that field names the circulating species for µM conversions, which is a different question. Dose range spans the 100 mg/day starting dose, the 200 mg/day influenza-prophylaxis and single-dose studies cited here, and the 400 mg/day ceiling used in Parkinson\'s.',
    refs: ['PMID:7756105', 'PMID:3834831', 'PMID:3280212', 'PMID:498714', 'PMID:3967456'],
  },
  {
    slug: 'ergoloid-mesylates',
    name: 'Ergoloid mesylates',
    aliases: ['Hydergine', 'dihydroergotoxine', 'dihydroergotoxine mesylate', 'co-dergocrine', 'codergocrine mesylate', 'ergoloid mesilates'],
    category: 'alkaloid',
    mechanism:
      'Fixed mixture of four dihydrogenated ergot alkaloids — dihydroergocornine, dihydroergocristine, and the alpha and beta isomers of dihydroergocryptine — in a 3:3:2:1 ratio by the USP monograph. As a class they are partial agonists and antagonists at alpha-adrenergic, dopaminergic and serotonergic receptors, with the hydrogenation removing the vasoconstrictor action of the parent ergots. This was the first agent approved in the United States for "idiopathic decline in mental capacity" in the elderly and is the archetype of the cerebral-insufficiency class that nicergoline and the racetams followed; its mechanism of benefit was never established, and the indication itself is a diagnosis modern practice does not use.',
    routes: ['PO'],
    doses: { PO: { min: 3, max: 12, typical: 4.5, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: {
      reason: 'mixture',
      note: 'PMID:17941060: "Dihydroergotoxine is a mixture of semi-synthetic ergot alkaloids". It measures the three congeners separately in one volunteer, each near 0.04 µg/l, while their hydroxy-metabolites run "one order of magnitude higher in concentration than their parents" — no single species carries the exposure. The one human half-life, "a slowest measured half-life of 12-14 h" (PMID:4091992), is by RADIOIMMUNOASSAY, cross-reactive across congeners: it measures the mixture, not a molecule.',
    },
    systems: ['nervous', 'cardiovascular'],
    notes:
      'No mw_g_mol: four alkaloids have four masses, and PubChem CID 6420006 (679.8) is the mesylate of one congener rather than the product. NO composition[] EITHER, deliberately. That block needs a mg_per_g_extract per constituent and each constituent present as its own compound with its own PK; none of the four is in this catalog, and the only human data for any of them is a single-subject Cmax from a paper that calls itself "preliminary results". Four stubs expanding into four unsolvable curves would add rows without adding information, so the USP ratio is recorded in the mechanism prose instead, where it reads as what it is rather than as a solver input. Revisit if any congener ever gets its own PK — dihydroergocristine is the likeliest, since it is marketed alone in some markets. What PMID:4091992 does establish, and what is worth keeping even without a stored number: twelve healthy males, three oral formulations, plasma "exceeded 200 pg ml-1 for approximately 5 h and decayed in a biphasic manner", with the retard capsule reaching half the solution\'s Cmax at similar overall bioavailability — so this is a low-concentration, biphasic, formulation-sensitive drug, none of which a one-compartment curve would have represented honestly. Dose range is the marketed 1 mg three times daily up to the 12 mg/day used in the older dementia trials; PMID:17941060 used a single 27 mg dose to get measurable concentrations at all, which is itself a comment on the exposure.',
    refs: ['PMID:17941060', 'PMID:4091992'],
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
