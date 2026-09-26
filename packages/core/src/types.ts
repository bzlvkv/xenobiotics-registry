/**
 * @xeno/core — domain types
 *
 * Single source of truth. The local store, op-log, registry, and surfaces all
 * derive their shapes from here. If a field exists in two places, this is the
 * authoritative one and the others must match.
 *
 * Stack-centric model: a Stack composes Compounds, fires a Schedule, consumes
 * Inventory, and is observed via Observations + Lab results. Surfaces never
 * mutate state directly — they call log.commit(kind, payload).
 */

// ─────────────────────────────────────────────────────────────────────────────
// IDs
// ─────────────────────────────────────────────────────────────────────────────

export type Ulid = string; // 26-char Crockford base32, lex-sortable
export type Slug = string; // url-safe compound id, e.g. "magnesium-glycinate"

// ─────────────────────────────────────────────────────────────────────────────
// Progression / achievements (v0.6 game-loop layer)
// ─────────────────────────────────────────────────────────────────────────────
//
// The design rule: progression and achievements are PURELY DERIVED from
// the intake op stream — no `level.up` or `achievement.unlock` ops in the
// log. This keeps replay deterministic and avoids duplicate sources of
// truth. Surfaces compute compound levels / player level / unlocked
// achievements on-demand from `state.intakes` via the helpers in
// @xeno/oplog. Cost is O(intakes) per recompute; cached at the derived
// store level so it doesn't re-run on unrelated state changes.
//
// Trade-off: no persisted unlock timestamps. The achievements page shows
// "you have it" / "you don't have it" but not "unlocked at 14:32 last
// Tuesday." A future op kind (`achievement.unlock`) could add that, but
// the derive-only approach ships v0.6 cleanly and the user-visible
// experience is otherwise complete.

export interface CompoundProgress {
  slug: Slug;
  /** Cumulative XP over all logged intakes for this compound. */
  totalXp: number;
  /** Discrete level 0..999 derived from totalXp via the level curve. */
  level: number;
  /** XP accumulated within the current level (resets to 0 at level-up). */
  xpInLevel: number;
  /** XP threshold to reach the next level. */
  xpNext: number;
  /** Total intake events for this compound, regardless of XP awarded. */
  intakeCount: number;
  /** ISO timestamp of the earliest intake (omitted when no intakes). */
  firstAt?: string;
  /** ISO timestamp of the latest intake. */
  lastAt?: string;
}

export interface PlayerProgress {
  /** Sum of every intake's XP across the entire op log. */
  totalXp: number;
  /** Player level — uncapped (uses the same curve as compounds; users
   *  who max compounds keep climbing). */
  level: number;
  xpInLevel: number;
  xpNext: number;
  /** Total intakes in the log. */
  intakeCount: number;
}

export interface StreakInfo {
  /** Consecutive days with at least one logged intake, ending today. */
  current: number;
  /** All-time best consecutive-day streak. */
  best: number;
  /** Most recent intake date in YYYY-MM-DD (user's local tz). */
  lastLogDate?: string;
}

export type AchievementKind =
  | 'compound_level' // unlock at L≥N for a specific compound
  | 'category_level' // unlock at L≥N for any compound in a category
  | 'system_level' // unlock at L≥N for any compound in a body system
  | 'receptor_level' // unlock at L≥N for any compound binding a receptor
  | 'streak' // N consecutive days
  | 'breadth' // N distinct compounds ever logged
  | 'intensity' // N intakes in a single day
  | 'first' // first time doing X (first intake, first stack fire, etc.)
  | 'special'; // hand-authored one-off unlocks

export interface AchievementDef {
  id: string;
  kind: AchievementKind;
  title: string;
  description: string;
  /** Numeric threshold the underlying metric must hit. Interpretation
   *  depends on `kind` (level, day-count, distinct-count, etc.). */
  threshold: number;
  /** Optional scope tag — compound slug for compound_level, category
   *  for category_level, etc. */
  target?: string;
}

export interface AchievementProgress {
  id: string;
  /** Whether the threshold is currently met. Re-derived per render. */
  unlocked: boolean;
  /** Current value of the underlying metric. */
  current: number;
  /** Echo of the def's threshold for convenience. */
  threshold: number;
  /** ISO timestamp of the first time the user crossed the threshold,
   *  if known. Populated from `state.achievement_unlocks`, which is
   *  written by an `achievement.unlock` op the first time the threshold
   *  is met. Missing for achievements unlocked on legacy builds before
   *  unlock-timestamp persistence shipped. */
  unlocked_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compound (registry — read-only)
// ─────────────────────────────────────────────────────────────────────────────

export type Route = 'PO' | 'SL' | 'IM' | 'IV' | 'SC' | 'IN' | 'TD' | 'INH' | 'PR';
export type DoseUnit = 'mg' | 'g' | 'mcg' | 'IU';

/**
 * Body system the compound's mechanism touches.
 *
 * The standard 10 organ systems from medical anatomy. Compounds carry an
 * array (`systems[]`) — every system whose tissues / receptors / pathways
 * the compound's mechanism names is tagged. Most compounds have 2–4 tags
 * (caffeine: nervous + cardiovascular + endocrine + metabolic-substrate).
 *
 * No "primary" designation: it would force a subjective dose-and-context
 * dependent decision (caffeine 50mg vs 400mg, aspirin low-dose chronic vs
 * high-dose acute) that no PMID anchors. Surfaces handle multi-system at
 * the rendering layer — a compound shows up on every system page it tags.
 *
 * Authoring rule: a system tag is justified when the compound's `mechanism`
 * prose names a target tissue/organ/receptor in that system. The free-text
 * `mechanism` is the ledger; `systems[]` is a derived marker, not a novel
 * claim. data-lint warns when systems[] is empty.
 */
export type SystemId =
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'endocrine'
  | 'digestive'
  | 'renal'
  | 'reproductive'
  | 'musculoskeletal'
  | 'integumentary'
  | 'immune-hematologic';

export const SYSTEM_IDS: readonly SystemId[] = [
  'nervous',
  'cardiovascular',
  'respiratory',
  'endocrine',
  'digestive',
  'renal',
  'reproductive',
  'musculoskeletal',
  'integumentary',
  'immune-hematologic',
] as const;

/** Display metadata for each system. `short` is for compact UI (chips,
 *  tiles); `label` is the full name; `description` lists the tissues /
 *  organs / functions that fall under it for authoring guidance. */
export const SYSTEM_META: Record<SystemId, { label: string; short: string; description: string }> =
  {
    nervous: {
      label: 'Nervous',
      short: 'Nervous',
      description: 'CNS + PNS — cognition, sensation, neural transmission',
    },
    cardiovascular: {
      label: 'Cardiovascular',
      short: 'Cardio',
      description: 'Heart, vasculature, blood pressure, lipid transport',
    },
    respiratory: {
      label: 'Respiratory',
      short: 'Resp',
      description: 'Lungs, airways, gas exchange',
    },
    endocrine: {
      label: 'Endocrine',
      short: 'Endo',
      description: 'Hormones — pituitary, thyroid, adrenal, gonadal, pancreatic islets',
    },
    digestive: {
      label: 'Digestive',
      short: 'GI',
      description: 'GI tract, liver, biliary, pancreas exocrine — incl. hepatic metabolism',
    },
    renal: {
      label: 'Renal',
      short: 'Renal',
      description: 'Kidneys + lower urinary — filtration, electrolytes, drug clearance',
    },
    reproductive: {
      label: 'Reproductive',
      short: 'Repro',
      description: 'Gonads + accessory tissues; uterine, prostate, etc.',
    },
    musculoskeletal: {
      label: 'Musculoskeletal',
      short: 'MSK',
      description: 'Muscle, bone, joints, connective tissue',
    },
    integumentary: { label: 'Integumentary', short: 'Skin', description: 'Skin, hair, nails' },
    'immune-hematologic': {
      label: 'Immune & hematologic',
      short: 'Immune',
      description: 'Lymphatics, white cells, RBCs, platelets, marrow',
    },
  };

// ─────────────────────────────────────────────────────────────────────────────
// FoodPreset — curated, bundled "common food" registry
// ─────────────────────────────────────────────────────────────────────────────
//
// A frozen snapshot of a common food's TRACKABLE compounds (the ones the app
// models — caffeine, vitamins, minerals, taurine…) at a defined serving, so a
// user logs a Big Mac or a sugar-free Red Bull with ZERO USDA FoodData Central
// API calls. Curated at dev-time (captured from FDC or a cited label), shipped
// validated by `foodPresetSchema`. v12 ships no curated catalog — these come
// from USDA FDC search results and the user's own saved foods.
//
// Hierarchy is a controlled top-level `category` then an arbitrary-depth `path`
// of free-text subcategory levels (… › subcategory › … › brand) ending at the
// item `name`. Stored flat per preset; the /run catalog builds a recursive tree
// from `[category, …path]`. A preset's runtime shape mirrors what the live FDC
// search returns, so picking one flows through the SAME log path — no extra code.

/** Controlled top-level grouping for the food catalog. Expand as the catalog
 *  grows; keep in sync with `foodCategorySchema` in the registry loader. */
export type FoodCategory =
  | 'fast_food'
  | 'energy_drink'
  | 'soda'
  | 'sports_drink'
  | 'coffee_tea'
  | 'juice'
  | 'snack'
  | 'supplement'
  | 'alcohol'
  | 'electrolyte'
  | 'produce'
  | 'protein'
  | 'grain'
  | 'meat_seafood'
  | 'dairy'
  | 'condiment'
  | 'other';

/** One trackable compound in a preset, dosed per the preset's `serving`. The
 *  `compound` slug MUST resolve in the compound registry (referential gate). */
export interface FoodPresetItem {
  compound: Slug;
  /** Display override; falls back to the registry compound name. */
  label?: string;
  /** Amount per serving (> 0). */
  dose: number;
  dose_unit: DoseUnit;
  /** Administration route for THIS item (default PO when absent). Lets a
   *  buccal/sublingual delivery model with mucosal PK instead of oral-
   *  swallow — e.g. nicotine gum's nicotine is 'SL', not 'PO' (swallowed
   *  nicotine is largely destroyed first-pass). */
  route?: Route;
}

/** Provenance — where a preset's values came from. Never fabricated: captured
 *  from USDA FDC (with the fdc_id), a product label, or hand-entered. */
export interface FoodPresetSource {
  /** 'fdc'/'label'/'manual' = curated (re-derivable from a cited source).
   *  'community' = user-contributed via the shared-catalog path — attested, not
   *  curated; never claims fdc/label provenance it doesn't have. */
  kind: 'fdc' | 'label' | 'manual' | 'community';
  /** FDC FoodData Central id, when captured from FDC. */
  fdc_id?: number;
  /** Canonical source URL the values are re-derivable from — the FDC food
   *  page, the manufacturer's nutrition page, or the hosted label image. */
  source_url?: string;
  /** Free-text citation when there's no stable URL (e.g. 'Front-of-pack label,
   *  500 mL bottle, US formulation'). A non-fabricated 'label'/'fdc' source
   *  carries at least one of fdc_id / source_url / label_ref. */
  label_ref?: string;
  /** ISO date the values were captured / last refreshed. */
  captured_at?: string;
}

/** One selectable ingredient in a build-your-own group — a menu choice (a
 *  protein, a salsa…) whose compound contributions ADD to the preset's base
 *  `items` when picked. `items` may be empty for picks with no trackable
 *  compounds (plain lettuce): the pick still labels the log. */
export interface FoodPresetOptionChoice {
  /** Menu label incl. portion, e.g. 'Grilled Steak (3.5 oz)'. */
  label: string;
  /** Pre-selected when the compose surface opens (the standard build). */
  default?: boolean;
  /** Compound contributions per pick, per the choice's own portion. */
  items: FoodPresetItem[];
}

/** A pick-one / pick-many ingredient group on a configurable (build-your-own)
 *  preset — e.g. Qdoba's Protein / Rice / Salsas. 'one' renders as a clearable
 *  radio (zero or one picked), 'many' as toggles. */
export interface FoodPresetOptionGroup {
  /** Group heading, e.g. 'Protein'. */
  name: string;
  pick: 'one' | 'many';
  choices: FoodPresetOptionChoice[];
}

export interface FoodPreset {
  /** url-safe unique id, e.g. 'red-bull-sugarfree'. */
  slug: Slug;
  /** the leaf Item level — e.g. 'Sugar-free'. */
  name: string;
  /** controlled top-level section. */
  category: FoodCategory;
  /** Arbitrary-depth subcategory chain BELOW the category and ABOVE the item —
   *  free-text levels, the last typically the brand. e.g. ['Red Bull'] or
   *  ['McDonald's', 'Breakfast']. Empty/absent = item sits directly under the
   *  category. The catalog tree groups on [category, …path]. */
  path?: string[];
  /** human-readable serving the doses are per — e.g. '250 mL can'. This is the
   *  BASE serving; `items` doses are per this serving (the implicit ×1 option). */
  serving: string;
  /** Alternate selectable serving sizes (captured from FDC foodPortions), e.g. a
   *  Big Mac also as 'Mac Jr' / 'Grand Mac'. Each `scale` multiplies the base
   *  `items` doses when that size is picked in /run. The base `serving` is the
   *  implicit ×1 option, shown first; absent/empty = single serving only. */
  serving_options?: { label: string; scale: number }[];
  /** Cosmetic flavor variants that share this preset's compound profile — e.g.
   *  every Reign flavor is caffeine 300 mg. The compose flavor picker stamps the
   *  chosen flavor onto the logged intake's label; it does NOT change the doses.
   *  Absent = single / unflavored. */
  flavors?: string[];

  /** Retired: the brand no longer sells this item. The row STAYS in the catalog
   *  — it was sold, people logged it, and its last published panel is the best
   *  record of it — but search ranks it below everything still on sale so it
   *  cannot be mistaken for a current product. */
  retired?: boolean;
  /** Build-your-own ingredient groups (assemble-line chains: Qdoba, Chipotle…).
   *  The compose surface adds each picked choice's `items` onto the base
   *  `items` (which stay the always-included part — the tortilla, the eggs).
   *  Absent = fixed recipe. A preset with `options` may have EMPTY base items
   *  (a bowl is nothing until you build it). */
  options?: FoodPresetOptionGroup[];
  /** Per-serving compound panel. Non-empty for fixed recipes; may be empty on
   *  a build-your-own preset (see `options`). */
  items: FoodPresetItem[];
  source: FoodPresetSource;
}

export interface Compound {
  slug: Slug;
  name: string;
  aliases: string[];
  category: CompoundCategory;
  /**
   * Body systems the compound's mechanism touches. Multi-tag (typically
   * 2–4 entries). Empty / missing means "not yet tagged" — surfaces show
   * the compound under an "untagged" bucket until the field is authored.
   * Order is non-significant; SYSTEM_IDS gives the canonical display order.
   */
  systems?: SystemId[];
  /** primary mechanism, free-text. */
  mechanism: string;
  /** routes for which we have at least dose info. */
  routes: Route[];
  /** typical doses by route, mg unless route says otherwise. */
  doses: Partial<Record<Route, DoseRange>>;
  /** half-lives in hours by route; missing = unknown. */
  half_life_hr: Partial<Record<Route, number>>;
  /**
   * Per-route PK parameters. Optional — compounds without literature-anchored
   * values fall through to resolvePk defaults at solve time, and surfaces
   * mark them with a "no PK data" affordance. Authoring rule: a route's pk
   * entry must have a verified source_pmid OR a top-level half_life_hr that
   * the solver can derive ke from; ka and V remain conservatively defaulted.
   */
  pk?: Partial<Record<Route, RoutePk>>;
  /**
   * Effect compartment — molecules whose perceived effect lags plasma. The
   * solver computes Ce(t) by integrating dCe/dt = keo (Cp − Ce); Ce trails
   * plasma when keo is small (slow equilibration → effect persists past
   * plasma decay) and tracks it tightly when keo is large.
   *
   * Intrinsic to the molecule + dominant receptor compartment, NOT route-
   * dependent (route changes Cp; once Cp is known, keo to the effect site
   * is the same regardless of how Cp got there). Authoring rule: keo_per_h
   * must carry a source_pmid; surfaces show "no PD on file" affordance when
   * absent so dropouts aren't silent.
   */
  effect_compartment?: EffectCompartment;
  /**
   * Per-receptor Hill–Langmuir occupancy parameters. Drives the receptor
   * occupancy curve in /library detail and (eventually) interaction-pair
   * competition math. Each entry is one receptor binding site; a compound
   * can declare multiple if its action is multi-receptor (e.g. caffeine on
   * adenosine A1 AND A2A). Empty array means no PD authoring yet — UI
   * shows the plasma + Ce curves only.
   */
  receptor_occupancy?: ReceptorSite[];
  /**
   * Known interactions with other compounds. Each entry is from THIS
   * compound's perspective — the `slug` references the counterparty.
   * Surfaces consume this for stack-composer warnings and the
   * "interactions" pip on Today. The math (CYP induction kinetics,
   * plasma binding competition) lands when per-edge Ki / induction-rate
   * data is authored — current v7 data is informational only.
   */
  interactions?: InteractionRef[];
  /**
   * Molecular weight in g/mol. Required to convert µM concentrations
   * (which is how literature reports Ki, EC50, plasma binding affinity)
   * into mg/L (which is how the solver's plasma curves are denominated).
   * Unit-conversion factor: mg/L = µM × mw_g_mol / 1000.
   *
   * Optional because most compounds don't yet need it — it only matters
   * when this compound is the perpetrator of a kinetic interaction
   * (`InteractionKinetics.ki_uM`) or a receptor with µM-stated EC50. The
   * registry verifier will start requiring it for any compound carrying
   * an `interactions[].kinetics` block in v0.7+.
   *
   * WHICH SPECIES: this field names ONE molecule, and a prodrug record
   * describes TWO. It must be the mass of the species `pk_analyte` declares —
   * i.e. the one that actually circulates and that `pk[]` / `half_life_hr[]`
   * already describe — NOT the dosed parent. Both consumers want that species:
   * the µM→mg/L conversion runs against the perpetrator's plasma curve, and
   * `affinityLabel()` in the app back-converts a stored `receptor_occupancy[]
   * .ec50_mg_l` for display, where the row was authored from an affinity
   * measured on the ACTIVE species. A parent mass here makes that round trip
   * fail to close, so the screen shows a number the cited source does not
   * contain. Ten records carried the parent mass and were corrected on
   * 2026-09-08 (`v8 scripts/authoring/2026-09-08-analyte-mass-convention.ts`).
   */
  mw_g_mol?: number;
  /**
   * Fraction of the DOSED mass that is the species `pk[]` / `half_life_hr[]`
   * describe. Absent means 1.0 — the dose and the modelled species are the
   * same molecule, which is the usual case.
   *
   * WHY THIS EXISTS. `doses[]` holds what a person actually takes, which is
   * routinely a SALT, while `pk[]` describes the free base or the ion. The
   * solver divides dose by volume, so without this field it divides a salt
   * mass by a free-base volume and overstates every concentration by the
   * counter-ion's share of the molecular weight. The catalog's stated
   * convention — free-base `mw_g_mol` beside salt-form doses — is harmless
   * while the mass is only used to convert µM affinities, and NOT harmless
   * once the dose feeds the plasma curve.
   *
   * lithium is the case that forced it: 900 mg of lithium CARBONATE is 169 mg
   * of lithium, so the curve ran 5.32× high and rendered a standard dose at
   * 2.32 mmol/L against a therapeutic band of 0.6–1.2 — above the toxicity
   * threshold, i.e. wrong in the direction that matters. Brompheniramine is
   * the same shape at 1.36×.
   *
   * DO NOT use this to paper over a bad volume or a bad bioavailability. It is
   * a stoichiometric constant — the analyte's share of the dosed salt's
   * formula mass — and nothing else. If you cannot write the arithmetic in
   * `dose_moiety_note`, the number does not belong here.
   *
   * The displayed dose is unaffected: a user who takes a 900 mg tablet still
   * logs and sees 900 mg. Only the mass entering the solver changes.
   */
  dose_moiety_fraction?: number;
  /**
   * Provenance for `dose_moiety_fraction`: the salt actually dosed, the
   * analyte, and the arithmetic. data-lint warns when the fraction is set
   * without one, because a bare stoichiometric constant is unreviewable.
   */
  dose_moiety_note?: string;
  /**
   * FRACTION UNBOUND IN PLASMA (fu), in (0, 1] — the share of the plasma
   * concentration that is not bound to albumin or alpha-1-acid glycoprotein
   * and is therefore available to reach a receptor.
   *
   * The solver's plasma curve is TOTAL drug, while a `receptor_occupancy` row
   * whose `basis` is `in_vitro_ki` is a FREE-drug affinity. Comparing the two
   * directly overstates occupancy by roughly 1/fu, which for the 90-99%-bound
   * molecules that dominate the catalog is one to two orders of magnitude.
   * This field is the correction: occupancy is driven by `Cp x fu`.
   *
   * Optional, and ABSENT MEANS 1.0 — i.e. the pre-correction behaviour, so a
   * record without it is unchanged rather than silently re-scaled. data-lint
   * warns (`pd.occupancy-needs-fu`) on any compound carrying an in-vitro
   * occupancy row without one.
   */
  fraction_unbound?: number;
  /**
   * Provenance and caveat prose for `fraction_unbound` — the verbatim quote it
   * was read from, the species and population, and any reason the scalar is an
   * approximation rather than a measurement.
   *
   * That last part is not optional politeness. Binding is CONCENTRATION-
   * DEPENDENT for some drugs (acetazolamide's own source says so), rises
   * substantially in renal failure, hypoalbuminaemia, pregnancy and old age,
   * and for the most extensively bound molecules a point value may not be
   * measurable at all — montelukast's methods literature states that "only a
   * range of fu can be reported with confidence". Storing a scalar for those
   * imports a known approximation, and the note is where that is admitted.
   *
   * MAY BE SET WITHOUT `fraction_unbound`, and that combination is meaningful:
   * it records that a free fraction was LOOKED FOR AND DELIBERATELY NOT
   * AUTHORED — because binding is concentration-dependent across the
   * therapeutic range, because only a range is published, or because the
   * occupancy rows are not free-drug affinities. Without this state the only
   * place to record such a decision was a compound's prose `notes`, where
   * data-lint cannot read it, so `pd.occupancy-needs-fu` kept re-reporting
   * questions that had already been answered. The rule now treats a note with
   * no value as examined and stays quiet.
   */
  fu_note?: string;
  /**
   * WHICH MOLECULE `pk[]` AND `half_life_hr[]` ACTUALLY DESCRIBE.
   *
   * For a compound that converts to an active species, "the half-life" is not
   * a well-formed quantity until this is said. The audit passes kept finding
   * records where it differed by an order of magnitude or more — sofosbuvir
   * stored the half-life of an INACTIVE metabolite carrying >90% of systemic
   * exposure while its active species never enters plasma at all; risperidone
   * stored the parent's bioavailability beside the active moiety's half-life,
   * which is neither of the two rows its own abstract offers.
   *
   * - `parent` — the dosed molecule, measured as itself.
   * - `active-metabolite` — the species the parent converts to. Name it in
   *   `pk_analyte_name` when it is not this compound (valganciclovir's oral
   *   bioavailability measures GANCICLOVIR appearing in plasma, and the two
   *   molecular weights differ by 1.39x, so molar work must know).
   * - `active-moiety` — parent plus active metabolite summed, which is what
   *   most clinical papers report for drugs like risperidone.
   * - `total-drug-related` — total radiolabelled material, which is what a
   *   mass-balance study measures and is rarely what should be modelled.
   */
  pk_analyte?: 'parent' | 'active-metabolite' | 'active-moiety' | 'total-drug-related';
  /** The named species when `pk_analyte` is not this compound itself, e.g.
   *  "ganciclovir" on valganciclovir, "morphine" on codeine. */
  pk_analyte_name?: string;
  /**
   * Marks a compound where pk[route] is intentionally unauthored because
   * authoring is either misleading (gut-acting / topical) or impossible
   * (no clinical PK published). Drives the UI's "no PK on file"
   * affordance to render an explanation instead of "data missing".
   *
   *   local-acting   — gut/inhaled/topical/ophthalmic where systemic
   *                    plasma PK is negligible by design
   *                    (e.g. acarbose, lactulose, rifaximin, simethicone,
   *                    bimatoprost ophthalmic, beclomethasone INH)
   *   research-only  — research / pre-clinical / unscheduled compounds
   *                    that haven't gone through Phase I PK
   *                    characterization (e.g. SARMs: andarine, lgd-3303)
   *   mixture        — multi-component or class-mixture entry where no
   *                    single plasma species can be PK-fitted
   *   uncharacterized — genuinely administered to people (clinically,
   *                    historically, or recreationally) but no indexed primary
   *                    source publishes a modeled PK parameter for it. Distinct
   *                    from research-only: the human exposure is real and often
   *                    long-standing, the LITERATURE is what is missing. Older
   *                    agents that predate modern PK methodology land here
   *                    (testosterone propionate, methandrostenolone), as do
   *                    substances studied only for their effects
   *                    (salvinorin A, harmine).
   *   label-only     — thoroughly characterized, but ONLY where this project
   *                    cannot cite: the approved label and the registration
   *                    dossier. Every candidate PubMed abstract reports ratios,
   *                    percentage changes or subgroup contrasts and no absolute
   *                    parameter. Distinct from uncharacterized, where the
   *                    science itself is missing: here the science exists and
   *                    the INDEXING is what fails, so the honest record says so
   *                    rather than implying the drug is poorly understood
   *                    (desvenlafaxine).
   *   homeostatic    — an endogenous substrate whose plasma level is held
   *                    by active regulation rather than by absorption and
   *                    first-order clearance (glucose, fructose). A Bateman
   *                    curve here would not be merely unsourced, it would be
   *                    the wrong model: the body defends the concentration,
   *                    so dose does not set the peak and t-half does not set
   *                    the decay.
   */
  pk_unauthored?: {
    reason:
      | 'local-acting'
      | 'research-only'
      | 'mixture'
      | 'homeostatic'
      | 'uncharacterized'
      | 'label-only';
    note?: string;
  };
  /**
   * Composition for multi-constituent products (plant extracts, fixed-dose
   * combinations, mixed isomers). When present, the solver expands a dose of
   * this parent into per-constituent doses at solve time, scaled by
   * `mg_per_g_extract`. The parent itself typically has
   * `pk_unauthored: { reason: 'mixture' }` because no single species PK fits
   * the whole extract.
   *
   * Example — Panax ginseng (200 mg standardized to 4% ginsenosides):
   *   constituents: [
   *     { slug: 'ginsenoside-rb1', mg_per_g_extract: 12 },   // → 2.4 mg
   *     { slug: 'ginsenoside-rg3', mg_per_g_extract: 2 },    // → 0.4 mg
   *   ]
   */
  composition?: {
    standardization?: string;
    constituents: Array<{
      slug: Slug;
      mg_per_g_extract: number;
      note?: string;
      source_pmid?: string;
    }>;
  };
  /**
   * Active metabolites this compound forms in vivo. Distinct from `composition`
   * (a physical mixture dosed together): a metabolite is TRANSFORMED from this
   * parent as it's eliminated, then cleared by its own PK. Each entry names the
   * metabolite compound (which must exist with its own PK) and the MOLAR fraction
   * of the parent's elimination that forms it (fm ∈ (0,1]). The solver couples
   * them via formation-rate-limited kinetics (see solver metabolite.ts). Example:
   * aspirin → salicylate (fraction ≈ 1). Requires `mw_g_mol` on both compounds.
   */
  metabolites?: Array<{
    slug: Slug;
    fraction: number;
    note?: string;
    source_pmid?: string;
  }>;
  /**
   * Nutritional dosing model — for compounds where plasma PK is the wrong
   * question (homeostatically-regulated minerals, fat-soluble vitamins,
   * essential cofactors). Instead of a Cmax/AUC curve, the relevant axes
   * are cumulative daily intake vs. RDI (recommended daily intake) and UL
   * (tolerable upper limit). Today's "Daily intake" card surfaces a per-
   * compound progress bar against these. Authored only where it applies —
   * caffeine and most psychoactives leave this empty.
   *
   *   rdi  — typical adult daily target, in `unit`
   *   ul   — tolerable upper limit (optional; missing = no formal UL)
   *   unit — 'mg' | 'mcg' | 'IU' | 'g' — must match the compound's typical
   *          dose unit so summing intakes is meaningful (cross-unit
   *          conversion handled mg↔mcg↔g; IU stays IU-only).
   */
  nutrition?: {
    rdi: number;
    ul?: number;
    unit: 'mg' | 'mcg' | 'IU' | 'g';
    source_pmid?: string;
    note?: string;
  };
  /** quick reference notes for the UI; full text in `data`. */
  notes?: string;
  /** PMIDs cited for this compound. */
  refs: string[];
  /**
   * BiGG metabolite ID in Recon3D — Brunk 2018 PMID:29457794. Stored
   * without compartment suffix (e.g. "atp", not "atp_c"). Lets a v8
   * compound page deep-link to the matching metabolite node in
   * vmh.life. Optional — only present where a v8 compound corresponds
   * to a metabolite in the reconstruction (i.e. small molecules, not
   * drugs/biologics).
   */
  recon3d_metabolite_id?: string;
  /**
   * HGNC gene symbol when this compound entry actually represents an
   * enzyme protein (e.g. "TPH2" for tryptophan hydroxylase 2). Lets
   * pathway-step "via" enzymes cross-reference into Recon3D's
   * gene-protein-reaction (GPR) relationships.
   */
  recon3d_gene_symbol?: string;
  /**
   * Slugs this compound has ABSORBED — earlier records for the same molecule
   * that were merged into this one and retired.
   *
   * Slug uniqueness never guaranteed identity uniqueness, so the catalog
   * accumulated pairs of records describing one substance under two names: an
   * international name beside a national one, a stereochemical prefix beside
   * the bare form, a spelling variant. Each side was authored independently,
   * so the registry could publish two different half-lives for one molecule
   * and two intakes of one substance never summed into one exposure.
   *
   * Merging fixes that, but a slug is not private to the registry: `Intake.compound`
   * stores one, and the op log is append-only, so intakes logged years ago
   * still name the retired slug. Deleting the record without a forwarding
   * path would silently strip those intakes of their PK. So the surviving
   * compound keeps the retired names here and every slug lookup resolves
   * through them (see `compoundIndex`), which makes an old intake resolve to
   * the merged record with no rewrite of user history.
   *
   * Registry-internal references (pathway steps, food items, interaction
   * edges) are rewritten to the canonical slug at merge time and must NOT
   * rely on this — forwarding exists for user data alone, and data-lint
   * enforces that internal references point at live slugs.
   *
   * A retired slug must be globally unique and must never equal a live slug.
   */
  retired_slugs?: Slug[];
}

/**
 * One directed interaction edge from a compound to a counterparty.
 * `level` controls how surfaces render the warning:
 *   - synergistic / beneficial — informational (cyan / lime chip)
 *   - caution                  — yellow chip ("worth knowing")
 *   - warn                     — orange chip ("avoid concurrent")
 *   - major / contraindicated  — red chip ("do not combine")
 *
 * Optional `kinetics` block makes the edge mathematically active in the
 * solver. When present, the perpetrator (this compound, the `from` of the
 * edge) modifies the victim's (the `slug` counterparty's) PK during the
 * window both are on board:
 *
 *   - inhibition: shrinks the victim's `ke_hr` proportional to perpetrator
 *     plasma versus the inhibition constant (Cp/Ki + 1)⁻¹
 *   - induction: grows the victim's `ke_hr` proportional to a steady-state
 *     induction multiplier when perpetrator exposure exceeds a soft floor
 *   - displacement: scales the victim's effective F (free fraction) when
 *     plasma protein binding competition pushes more drug unbound
 *
 * All three are first-order approximations — full PBPK would need
 * enzyme/protein abundance dynamics. They're enough for the surfaces to
 * say "caffeine + amphetamine: ke ↓ 18%, plasma ↑ 22%" with honest math
 * underneath. Authoring is sparse: most edges remain informational.
 */
export interface InteractionRef {
  /** Counterparty compound slug. */
  slug: Slug;
  /** Display name; sometimes diverges from the registry's display
   *  (e.g. v7 carried "Adenosine" for caffeine even though we don't
   *  catalog adenosine as a tracked compound). */
  name: string;
  level: 'synergistic' | 'beneficial' | 'caution' | 'warn' | 'major' | 'contraindicated';
  /** Free-text rationale. Shown verbatim in the warning chip's tooltip. */
  note: string;
  /** Optional timing hint, e.g. "8h apart", "evening only". */
  timing?: string;
  /** Optional quantitative interaction kinetics — when present, the
   *  solver modulates the counterparty's PK in proportion to this
   *  compound's plasma. Absent → edge is informational only. */
  kinetics?: InteractionKinetics;
  /** PMID anchoring the kinetics numbers. Required when kinetics is set —
   *  unsourced potency values shouldn't drive curve adjustments. */
  source_pmid?: string;
}

/**
 * Per-edge interaction kinetics. All fields optional; only the ones
 * authored fire. The solver applies (in order, multiplicatively):
 *
 *   ke_factor = (1 / (1 + Cp_perpetrator / ki_uM_in_mass_units))    if ki_uM authored
 *               × induction_factor                                  if induction_factor authored
 *   F_factor  = 1 + plasma_binding_displacement                     if displacement authored
 *
 * Units note: Ki is reported in literature as µM (micromolar). The solver
 * converts to mass units (mg/L) using the perpetrator's molecular weight.
 * Compounds without `mw_g_mol` authored skip the inhibition adjustment
 * with a console warning rather than guessing.
 */
export interface InteractionKinetics {
  /**
   * Reversible-inhibition constant in µM. The fractional drop in the
   * victim's clearance is Cp_perp / (Cp_perp + Ki); at Cp_perp = Ki the
   * victim's ke_hr halves. Use for known competitive inhibitors with a
   * published Ki against the dominant clearance enzyme of the victim.
   * Skipped if the perpetrator lacks `mw_g_mol` (we can't convert to
   * mg/L without it).
   */
  ki_uM?: number;
  /**
   * What `ki_uM` actually IS. Absent means `'in_vitro'` — the contract the
   * field above describes, a published affinity against the victim's dominant
   * clearance enzyme.
   *
   * `'calibrated_from_auc'` says the number is NOT an affinity. It was
   * inverted out of an observed clinical AUC fold-change through an assumed
   * perpetrator concentration:
   *
   *     ki_uM = assumed_perp_uM / (auc_ratio − 1)
   *
   * which is exactly the value that makes the solver's `1 + Cp/Ki` reproduce
   * the published ratio WHEN Cp equals that assumed concentration. That is a
   * defensible way to carry a clinical interaction whose in-vitro constant is
   * unpublished or unusable — the fold-change is what the papers actually
   * report — but it is a calibration, not a measurement, and it must say so:
   * the dose-response away from the assumed exposure is then unanchored, and
   * the cited PMID contains no Ki for anyone checking it to find.
   *
   * Discovered 2026-09-08 by algebra rather than by reading: across whole
   * perpetrator blocks the implied `assumed_perp_uM` was a single shared
   * constant to two decimals — itraconazole 0.5 µM, trimethoprim 3.0,
   * aprepitant 1.5, cimetidine 5.0, paroxetine 0.2, gemfibrozil 35.
   */
  ki_basis?: 'in_vitro' | 'calibrated_from_auc';
  /**
   * The verbatim published exposure fold-change this edge was calibrated
   * from (2.5 = "AUC increased 2.5-fold"). Required alongside
   * `ki_basis: 'calibrated_from_auc'`. This is the honest primary quantity —
   * the one the source actually measured — and storing it makes the
   * calibration reconstructible instead of mysterious.
   */
  auc_ratio?: number;
  /**
   * The perpetrator concentration (µM) assumed when inverting `auc_ratio`
   * into `ki_uM`. Required alongside `ki_basis: 'calibrated_from_auc'`.
   * data-lint checks that the three numbers agree to within 2%.
   */
  assumed_perp_uM?: number;
  /**
   * Steady-state induction multiplier on the victim's ke_hr at typical
   * therapeutic perpetrator exposure. 1.0 = no effect; 1.4 = 40% faster
   * clearance; 0.6 = 40% slower clearance (rare — induction is usually
   * positive, but the signed multiplier shape is convenient). The solver
   * ramps from 1.0 toward this value via a one-week first-order fill,
   * since enzyme induction takes days to develop in vivo.
   */
  induction_factor?: number;
  /**
   * Plasma-protein-binding displacement: fractional bump in the victim's
   * effective free fraction when perpetrator plasma is at typical
   * therapeutic levels. 0.10 = 10% more drug unbound. Mostly relevant
   * for highly-bound drugs (warfarin, valproate) where small fu shifts
   * cause large plasma-active swings.
   */
  plasma_binding_displacement?: number;
  /**
   * Mechanism-based (time-dependent, "irreversible") inhibition marker — a
   * qualitative property of the PERPETRATOR's mechanism, set alongside `ki_uM`.
   * A mechanism-based inhibitor inactivates the enzyme covalently, so its effect
   * OUTLASTS its plasma presence: recovery is rate-limited by enzyme resynthesis
   * (a multi-day CYP-turnover timescale), not by the perpetrator clearing. When
   * set, the solver holds the Ki-calibrated inhibition depth and lets it recover
   * on the enzyme-turnover time constant after the perpetrator falls, instead of
   * snapping back with instantaneous Cp (the reversible default). The DEPTH is
   * unchanged (still the published `ki_uM`); only the persistence tail is added,
   * so no new continuous parameter (k_inact / K_I) is fabricated. Classic cases:
   * grapefruit furanocoumarins, clarithromycin/erythromycin, diltiazem/verapamil,
   * ritonavir/cobicistat (CYP3A4); paroxetine (CYP2D6); gemfibrozil (CYP2C8).
   */
  mbi?: boolean;
}

/**
 * PK parameters for a single (compound, route) pair.
 *
 * The solver picks one-vs-two-compartment based on which fields are set:
 *   - 1-comp: ka_hr, ke_hr (or derived from half_life), V_L, F → Bateman
 *   - 2-comp: ka_hr, alpha_hr, beta_hr, k21_hr, V_L, F → bi-exponential
 *             distribution + first-order absorption (3-exponential PO,
 *             2-exponential IV)
 *
 * All fields optional. Missing 1-comp pieces fall through to resolvePk
 * defaults; if any 2-comp piece is missing, the compound stays on 1-comp.
 *
 * 2-comp authoring uses the standard textbook PK parameterization:
 *   α (alpha_hr) — fast disposition rate, 1/hr
 *   β (beta_hr)  — terminal elimination rate, 1/hr
 *   k₂₁ (k21_hr) — peripheral → central rate, 1/hr
 * The solver derives A/B coefficients of the bi-exponential from these.
 */
/**
 * Effect compartment — Cp ↔ Ce equilibration.
 *
 * The lag between plasma concentration and the felt effect is captured by
 * the rate constant keo (per hour). Small keo (e.g. 0.05/hr) means slow
 * equilibration and a long PD tail past plasma; large keo (e.g. 5/hr) means
 * Ce tracks plasma tightly. The math is a simple first-order linear ODE
 * solved analytically by superposition of unit-impulse responses (see
 * solver/effect-compartment.ts).
 */
/**
 * The species a PK or PK/PD value was measured in.
 *
 * Animal-derived values are ALLOWED in this registry, because for many
 * research peptides and for whole mechanism classes no human study exists and
 * an order-of-magnitude curve beats no curve at all. What is not allowed is
 * letting an animal number pass as a human one: a rat half-life and a human
 * half-life render identically on a compound page unless the data says which
 * it is. Setting this field is how a value earns the right to stay.
 *
 * Omitted means human. That keeps the common case free of noise, and it is
 * safe because the field is only ever added — never removed — when a value is
 * found to be animal-derived.
 */
export type SourceSpecies =
  'rat' | 'mouse' | 'dog' | 'pig' | 'sheep' | 'rabbit' | 'monkey' | 'horse' | 'cow';

export interface EffectCompartment {
  /** Plasma → effect-site equilibration rate, 1/hr. */
  keo_per_h: number;
  /** PMID anchoring keo's value. */
  source_pmid?: string;
  /**
   * Species the keo was fitted in, when not human. See {@link SourceSpecies}.
   * Several keo values here are honest animal fits — GHB's comes from a rat
   * EEG hysteresis model, oxycodone's from sheep brain:blood equilibration —
   * and those are worth keeping, but the compound page must say so rather
   * than presenting them as human measurements.
   */
  source_species?: SourceSpecies;
  /**
   * True when keo_per_h is a reasoned estimate rather than a value fitted
   * from a published PK/PD model. Roughly a third of the registry's keo
   * values are estimates: for whole mechanism classes (nuclear-receptor
   * agonists, therapeutic antibodies, orexin antagonists) no effect-
   * compartment model has ever been published, yet the effect demonstrably
   * lags plasma and a keo of 0 would be a worse lie than an order-of-
   * magnitude one.
   *
   * Set it alongside a `note` giving the reasoning (observed clinical onset,
   * or the class analogue the value mirrors). It exists so surfaces can say
   * "estimated" out loud instead of showing the same blank source cell as a
   * value whose citation was simply never recorded. NEVER set this on a
   * value that does have a primary source, and never use it to launder a
   * number nobody reasoned about.
   */
  approximated?: boolean;
  /** Optional human-readable note describing the relevant effect site. */
  note?: string;
}

/** Ligand mode of action at a receptor site. Direction (activates / blocks /
 *  modulates) is derived from this in apps/app receptors/direction.ts. Orthogonal
 *  to emax, which is occupancy magnitude only. */
export type ReceptorAction =
  | 'agonist'
  | 'partial_agonist'
  | 'inverse_agonist'
  | 'antagonist'
  | 'inhibitor'
  | 'blocker'
  | 'neutralizer'
  | 'pam'
  | 'nam'
  | 'substrate'
  | 'modulator'
  | 'unknown';

/**
 * Hill–Langmuir occupancy for a single receptor binding site.
 *
 *   occupancy(Ce) = emax · Ceⁿ / (ec50ⁿ + Ceⁿ)
 *
 * Multiple sites are summed only at the consumer level (e.g. when computing
 * a composite "load" against several pathways). Each site carries its own
 * provenance.
 */
export interface ReceptorSite {
  /** Free-text receptor key, e.g. "adenosine_A1". Surfaces don't enumerate;
   *  this is informational. */
  receptor: string;
  /** Optional pathway tag — "wakefulness", "anxiolytic", etc. Multiple
   *  receptors can share a pathway; surfaces group by pathway when set. */
  pathway?: string;
  /** Maximum occupancy fraction at saturating Ce, in [0, 1]. Usually 1. */
  emax: number;
  /** Concentration giving half-maximum occupancy, in mg/L (== µg/mL).
   *  Author values converted from ng/mL × 0.001. */
  ec50_mg_l: number;
  /** Hill coefficient. n = 1 is hyperbolic; n > 1 is sigmoidal (cooperativity). */
  hill_n: number;
  /** Ligand mode of action at this site. Optional; absent → direction falls back
   *  to parsing `pathway` (the legacy heuristic). Orthogonal to emax. */
  action?: ReceptorAction;
  /** PMID anchoring the binding parameters. */
  source_pmid?: string;
  /** Optional provenance prose: species / tissue / radioligand / verbatim
   *  quote, or an "approximation" caveat. Surfaces show it as the
   *  data-quality detail behind the value (e.g. in the receptors view). */
  note?: string;
  /**
   * WHICH CONCENTRATION `ec50_mg_l` IS REFERENCED TO. This is not a nuance —
   * getting it wrong biases every occupancy percentage in one direction.
   *
   * - `in_vitro_ki` (the default, and what almost all authored rows are): a
   *   binding affinity measured in a buffer or membrane prep, i.e. against
   *   FREE drug. It must be compared against free plasma — `Cp x fu` — not
   *   against the total plasma curve. For a 99%-bound drug the difference is
   *   a hundredfold.
   * - `in_vivo_plasma_ec50`: a concentration-occupancy relationship fitted in
   *   a living subject, already referenced to TOTAL plasma. Apply no free
   *   fraction to it. Rarer, but real and publishable — duloxetine's 5-HTT
   *   occupancy ED50 of "3.7 ng/ml for plasma concentration" is one.
   * - `whole_blood_ic50`: measured in a HUMAN WHOLE-BLOOD assay, which already
   *   contains albumin and AAG at physiological concentration. The potency is
   *   therefore already expressed against a total concentration in a
   *   protein-containing matrix, so it is the correct comparator for the
   *   solver's total plasma curve AS IT STANDS. Applying fu to one of these
   *   DOUBLE-CORRECTS: the COX assays that dominate the NSAID rows are all of
   *   this kind, and diclofenac's fu of 0.003 against a whole-blood COX IC50
   *   would shift the comparison 333-fold in the wrong direction — worse than
   *   the uncorrected error the free-fraction work exists to fix.
   *
   * Absent is treated as `in_vitro_ki`.
   */
  basis?: 'in_vitro_ki' | 'in_vivo_plasma_ec50' | 'whole_blood_ic50';
}

/**
 * A receptor in the GPCR reference catalog (registry data/receptors.json),
 * sourced from IUPHAR/BPS Guide to PHARMACOLOGY. This is reference
 * nomenclature — name / family / gene — NOT a pharmacodynamic measurement;
 * `ReceptorSite` (above) is the per-compound authored Hill curve. The
 * receptors view renders this catalog and joins authored occupancy onto it
 * by `key`.
 */
export interface ReceptorCatalogEntry {
  /** Canonical key — HGNC gene symbol when known (e.g. "HTR2A"), else `gtp<id>`. */
  key: string;
  /** Display name, e.g. "5-HT2A receptor". */
  name: string;
  /** IUPHAR family / grouping, e.g. "5-Hydroxytryptamine receptors". */
  family: string;
  /** HGNC gene symbol; null for orphan / non-human entries. */
  gene: string | null;
  /** HGNC descriptive name — the identity / function line. */
  full_name: string;
  /** GtoPdb target id — provenance anchor back to the source record. */
  gtp_id: number;
}

/** Target class for a non-GPCR authored target — drives the UI label. */
export type TargetClass =
  | 'enzyme'
  | 'transporter'
  | 'ion_channel'
  | 'nuclear_receptor'
  | 'catalytic_receptor'
  | 'immune'
  | 'other';

/**
 * Reference entry for a NON-GPCR authored target (enzyme, transporter, ion
 * channel, nuclear receptor, cytokine/immune). The GPCR catalog
 * (ReceptorCatalogEntry) is GtoPdb GPCRs only; these are the other target
 * classes that compounds' receptor_occupancy[] bind, given the same
 * nomenclature treatment so every authored occupancy key resolves to real
 * metadata (gene / family / identity) rather than a bare key.
 *
 * Keyed by the authored OCCUPANCY KEY (e.g. "cox_1", "SERT", "nav1_5") so the
 * receptor view can look it up directly. Generated by build-receptor-catalog.ts
 * from the same GtoPdb table (allow-listed by gene), plus a small curated
 * supplement for ligand/subunit targets GtoPdb doesn't enumerate as target rows
 * (cytokines, the Ca-channel α2δ subunit, IgE) — those carry gtp_id 0.
 */
export interface NonGpcrTarget {
  /** Authored occupancy key (the receptor_occupancy[].receptor value). */
  key: string;
  /** Display name, e.g. "Cyclooxygenase-1". */
  name: string;
  /** IUPHAR family / grouping, e.g. "Cyclooxygenase". */
  family: string;
  /** HGNC gene symbol; null if not a single gene. */
  gene: string | null;
  /** HGNC descriptive name — the identity / function line. */
  full_name: string;
  /** Target class — Enzyme / Transporter / Ion channel / Nuclear receptor / … */
  class: TargetClass;
  /** GtoPdb target id, or 0 for curated entries GtoPdb doesn't list. */
  gtp_id: number;
}

export interface RoutePk {
  /** Absorption rate constant, 1/hr. Ignored for IV. */
  ka_hr?: number;
  /** Elimination rate constant, 1/hr (1-comp). Overrides half_life_hr. */
  ke_hr?: number;
  /** Volume of distribution / central compartment volume, liters. */
  V_L?: number;
  /** Bioavailability, fraction in [0, 1]. */
  F?: number;
  /** Fast disposition rate, 1/hr (2-comp only). When set alongside
   *  beta_hr + k21_hr, the solver switches to bi-exponential math. */
  alpha_hr?: number;
  /** Terminal elimination rate, 1/hr (2-comp only). Replaces ke_hr. */
  beta_hr?: number;
  /** Peripheral → central rate, 1/hr (2-comp only). */
  k21_hr?: number;
  /** Michaelis-Menten Vmax, mg/L/hr. Setting this AND mm_km_mg_per_l
   *  switches the compound to numerical MM integration (saturable
   *  elimination — phenytoin, ethanol, salicylates). Linear ke_hr is
   *  ignored when MM fires. */
  mm_vmax_per_hr?: number;
  /** Michaelis constant Km in mg/L — concentration at which elimination
   *  rate is half-max. Required alongside mm_vmax_per_hr to engage MM. */
  mm_km_mg_per_l?: number;
  /** Parallel non-saturable elimination, 1/hr — a first-order pathway running
   *  ALONGSIDE the saturable MM one (only used when MM is engaged). Models a
   *  high-capacity route (e.g. acetaminophen glucuronidation) that keeps clearing
   *  the drug after the saturable route (sulfation) plateaus. Absent → single
   *  saturable pathway. */
  mm_linear_ke_hr?: number;
  /** Zero-order absorption duration, hr. When set (instead of ka_hr), F·dose
   *  is delivered at a CONSTANT input rate over this window — the right model
   *  for transdermal patches and depot/long-acting injections (which release
   *  at ~constant rate, not first-order). Engages the zero-order solver path. */
  zo_dur_hr?: number;
  /** Absorption lag, hr. Delays the start of input — plasma is 0 until lag_hr,
   *  then absorption (first- or zero-order) begins. For depots with a release
   *  lag (e.g. risperidone Consta ~3 weeks). Applies to any absorption mode. */
  lag_hr?: number;
  /** PubMed ID for the source study. Required for production data. */
  source_pmid?: string;
  /**
   * Non-PubMed primary provenance — a regulatory label or pharmacopoeia
   * monograph that states the PK verbatim but carries no PMID. Free text
   * naming the document precisely enough to re-derive the numbers, e.g.
   * "FDA label: Zepatier (elbasvir/grazoprevir), DailyMed setid 8d6e...".
   *
   * A label is a legitimate primary source — for many modern agents the
   * approval package's clinical-pharmacology section is the only public
   * place Cmax / t-half / F appear together, because the popPK paper
   * reserves them for full-text tables. What is NOT legitimate is leaving
   * such a route looking unsourced: before this field existed, label-derived
   * PK and PK with no provenance at all both rendered as an em-dash, so no
   * surface could tell a reader which was which.
   *
   * Authoring rule: every pk[route] carrying params sets EITHER source_pmid
   * OR source_label. data-lint's `pk.pmid` warns only when neither is set.
   */
  source_label?: string;
  /**
   * Species this route's parameters were measured in, when not human. See
   * {@link SourceSpecies}. Authoring rule: if the cited paper dosed an animal,
   * set this — do not drop the value and do not leave it looking human.
   */
  source_species?: SourceSpecies;
}

export type CompoundCategory =
  | 'stimulant'
  | 'nootropic'
  | 'mineral'
  | 'vitamin'
  | 'adaptogen'
  | 'amino-acid'
  | 'lipid'
  | 'hormone'
  | 'sleep'
  // v7 import additions — these expand the taxonomy to round-trip the
  // legacy registry without losing per-compound classification.
  | 'alkaloid'
  | 'polyphenol'
  | 'metabolite'
  | 'neurotransmitter'
  | 'nucleotide'
  | 'nucleoside'
  | 'biologic'
  | 'peptide'
  | 'terpenoid'
  | 'flavonoid'
  | 'ketone'
  | 'pharmacological'
  | 'topical'
  // Dietary carbohydrates + sugar substitutes (registry sugars/sweeteners
  // expansion). 'sugar' = conventional mono/disaccharides + carb mixtures;
  // 'sweetener' = high-intensity (synthetic + natural), polyols, rare sugars.
  | 'sugar'
  | 'sweetener'
  | 'other';

export interface DoseRange {
  min: number;
  max: number;
  typical: number;
  /** REQUIRED. Consumers used to default a missing unit to mg; a silent
   *  default on a dose is a hundred- or thousandfold error waiting to
   *  happen, so the registry now states it on every row. */
  unit: DoseUnit;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pathway (registry — read-only; v1.2 Wave 5a target 30+ hand-authored)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * High-level grouping for pathways. Mirrors the bucketing used in the
 * v8.1 plan §16.3 ("Pathways 33 → 80+"). Each value frames a distinct
 * authoring discipline:
 *
 *  - biosynthesis: precursor → product transformations (catecholamines,
 *    serotonin synthesis, heme, bile acids)
 *  - catabolism: degradation paths (purine catabolism via xanthine
 *    oxidase, fatty acid β-oxidation)
 *  - drug_metabolism: CYP/UGT-driven xenobiotic clearance (caffeine
 *    demethylation, warfarin hydroxylation)
 *  - signaling: signal-transduction cascades (mTOR, NF-κB, IGF-1)
 *  - transport: active transport / efflux loops (P-gp, OATP family)
 *  - membrane: membrane trafficking / receptor turnover
 *  - endocrine_axis: HPA / HPG / RAAS / HPT
 */
export type PathwayCategory =
  | 'biosynthesis'
  | 'catabolism'
  | 'drug_metabolism'
  | 'signaling' // general signal-transduction cascades
  | 'receptor_pharmacology' // specific-receptor systems (opioid, GABA-A, …)
  | 'transport'
  | 'membrane' // ion channels + membrane lipid composition
  | 'endocrine_axis'
  | 'immune_innate' // innate immunity (TLR, cGAS-STING, NLRP3, …)
  | 'cell_death' // apoptosis / ferroptosis / pyroptosis / etc.
  | 'disease_cascade'; // chronic-disease progression models

/**
 * Therapeutic / clinical domain — the third orthogonal axis on a pathway,
 * alongside `category` (mechanism) and `systems` (organ system).
 * Answers "which medical area cares about this pathway?". A pathway
 * can belong to several (atherosclerosis = cardiometabolic +
 * immune_inflammation). Optional on Pathway — rare pathways with no
 * dominant clinical home stay untagged.
 */
export type PathwayDomain =
  | 'metabolic' // energy + nutrition + mineral + diabetes (non-CV)
  | 'cardiometabolic' // lipid + atherosclerosis + hemostasis + BP
  | 'neuropsychiatric' // CNS pharmacology, mood, cognition, sleep, addiction
  | 'pain_analgesia' // opioid, NSAID, neuropathic, migraine
  | 'endocrine_reproductive' // hormones, sex steroids, bone-Ca-Pi, fertility
  | 'immune_inflammation' // innate + adaptive immunity, autoimmunity, allergy
  | 'infectious_disease' // antibacterial, antifungal, antiviral, antiparasitic
  | 'oncology' // cancer biology, chemotherapy mechanisms
  | 'dermatology' // skin-specific pharmacology
  | 'gi_hepatic' // GI motility/secretion, liver, microbiome
  | 'respiratory' // asthma, COPD, allergy-pulm
  | 'aging_regenerative'; // senescence, telomere, mitophagy, wound healing

/**
 * One transformation in a pathway. `from` and `to` are compound slugs
 * — referenced compounds SHOULD exist in the registry, but the lint
 * surfaces a warning (not an error) when a step references an
 * unregistered node. This lets pathway authoring run ahead of compound
 * stubbing for biochemistry intermediates that are not dosable drugs
 * (paraxanthine, sphinganine, ornithine, etc.).
 *
 * `via` carries the catalyst (enzyme / transporter name) as free text
 * since most enzymes are not registered compounds. `via_slug` is
 * present when the catalyst itself is in the registry (e.g. a target
 * of a drug — VKORC1 isn't, but if it were authored it would link
 * here).
 */
export interface PathwayStep {
  /**
   * Display label for the step's input. FREE TEXT by design — most pathway
   * endpoints are processes and states ("5-HT2A -> Gq -> PLC", "cortical
   * pyramidal glutamate release"), not molecules, and those will never be
   * registry compounds. Use `from_slug` to claim a compound.
   */
  from: Slug | string;
  /** Display label for the step's output. Free text; see `from`. */
  to: Slug | string;
  /**
   * The compound this step's input IS, when it is one. Mirrors the existing
   * `via` / `via_slug` split: prose in `from`, a checkable claim here. When
   * set it must resolve — data-lint errors otherwise, exactly as for
   * `via_slug` — and surfaces prefer it over string-matching `from`.
   *
   * Absent means "this endpoint is not a registry compound", which is the
   * common case and NOT a defect. It replaces a `pathway.step-from` warning
   * that fired on 777 free-text endpoints it could never have resolved.
   */
  from_slug?: Slug;
  /** The compound this step's output IS, when it is one. See `from_slug`. */
  to_slug?: Slug;
  via?: string;
  via_slug?: Slug;
  note?: string;
  source_pmid?: string;
  /**
   * Cross-reference to Recon3D reaction IDs (BiGG-style identifiers,
   * e.g. "HEX1", "PGI") that implement this step in the canonical
   * metabolic reconstruction. Multiple IDs allowed because v8 steps
   * are often coarser-grained than Recon3D reactions (one v8 step
   * may collapse 2-3 Recon3D entries).
   */
  recon3d_reaction_ids?: string[];
}

/**
 * A drug (or other compound in the registry) that modulates the
 * pathway. Used to surface "what changes if I take X?" on a pathway
 * detail page — distinct from `interactions[]` on a Compound, which
 * is one-perpetrator-one-victim. A pathway modulator points at the
 * whole pathway.
 */
export interface PathwayModulator {
  slug: Slug;
  effect: 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
  target?: string;
  /**
   * Explicit step pin — index into the pathway's `steps[]` that this
   * modulator acts on. Authoring escape-hatch for cases the automatic
   * matcher (apps/app `buildModulatorMap`) can't reach by text:
   * receptor-pharmacology pathways name subtypes ("β1 + β2", "BZD
   * site") in `target` that don't string-match the receptor-activation
   * step's `via`/nodes. When set, the matcher honors it before any text
   * heuristic; the registry lint checks it is in range.
   */
  step?: number;
  note?: string;
  /**
   * Primary-literature citation for this specific modulator claim
   * (e.g. "PMID:23077038"). Distinct from the pathway's overall
   * `refs[]` — refs answer "where does the whole pathway come from?",
   * while this answers "what's the evidence that *this* compound
   * acts as *this* effect on *this* target?". Especially load-
   * bearing for phenomenon pathways where the modulator IS the
   * thing being explained (e.g. β-alanine — substrate @ MrgprD).
   */
  source_pmid?: string;
}

export interface Pathway {
  slug: string;
  name: string;
  /**
   * Secondary descriptor pulled out of the formal `name` so the title
   * stays short. Holds the specific actors / subtypes / scope that used
   * to live in the name's trailing parenthetical or em-dash clause —
   * e.g. name "Bone remodeling" + subtitle "RANK/RANKL/OPG +
   * PTH/Wnt-sclerostin + bisphosphonates", or name "Parkinson disease" +
   * subtitle "α-synuclein aggregation". Rendered as a muted second line in
   * the pathway list and as the accent tail of the detail-page title.
   * Indexed for free-text search alongside name + description. Left unset
   * on pathways whose name needs no qualifier.
   */
  subtitle?: string;
  /**
   * Short, plain-language hook for the *user-felt phenomenon* this
   * pathway explains — separated from the formal `name` so the title
   * stays scientific while the searchable/displayable hook stays
   * colloquial. Examples: "the tingle" (β-alanine MrgprD), "the flush"
   * (niacin GPR109A), "neon-yellow pee" (riboflavin), "skipped beats"
   * (caffeine A1). Only set on phenomenon-pathways that anchor a
   * specific observable; left blank for ordinary biosynthesis /
   * signaling pathways. Surfaced in pathway list as a tagline under
   * the title, on the detail page as an eyebrow, and indexed for
   * free-text search alongside name + description + modulator notes.
   */
  sensation?: string;
  category: PathwayCategory;
  systems: SystemId[];
  /** Therapeutic / clinical domains. Orthogonal to category + systems.
   *  Multiple allowed; optional when no clinical domain dominates. */
  domains?: PathwayDomain[];
  description: string;
  steps: PathwayStep[];
  modulators?: PathwayModulator[];
  refs?: string[];
  /**
   * Cross-reference to the canonical Recon3D subsystem name (v1.2 Wave
   * 5a ETL). When present, indicates the pathway aligns with one of
   * the 111 metabolic subsystems in the Recon3D human metabolic
   * reconstruction (Brunk 2018 PMID:29457794). Useful for navigating
   * between v8's hand-authored pathway view and the broader Recon3D
   * reaction network. NULL/undefined for signaling / endocrine-axis /
   * hemostasis pathways that don't map to Recon3D's metabolism focus.
   */
  recon3d_subsystem?: string;
  /**
   * Optional authored diagram overlay for the top-down DAG view on the
   * pathway detail page. When present, the graph deriver uses it
   * verbatim (hand-tuned coordinates, cross-talk satellites, side chips,
   * feedback arc, per-node prose); when absent — the vast majority of
   * pathways — the deriver projects `steps` into a graph and runs an
   * auto-layout. Purely presentational: the linear step list and
   * modulator matching continue to read `steps` / `modulators`.
   */
  diagram?: PathwayDiagram;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pathway diagram overlay (optional authored DAG presentation)
// ─────────────────────────────────────────────────────────────────────────────
//
// Authored, hand-tuned graph for the pathway DAG diagram. Lives on
// `Pathway.diagram` and is the single source of truth when present.
// Coordinates are on a 1500 × 1060 design canvas (scaled to fit). All
// of this is optional registry data — only flagship/showcase pathways
// carry it; everything else derives a graph from `steps` + auto-layout.

export type PathwayNodeKind = 'input' | 'signal' | 'hub' | 'effector' | 'outcome' | 'crosstalk';

export interface PathwayNodeDetails {
  /** one-line summary */
  role: string;
  /** longer mechanism prose */
  function: string;
  /** disease / clinical bullets */
  clinical?: string[];
  /** free-form drug-target names */
  targets?: string[];
}

export interface PathwayDiagramNode {
  id: string;
  label: string;
  sub?: string;
  kind: PathwayNodeKind;
  /** Layout layer: 0..N top-down, or 'crosstalk' for side satellites. */
  layer?: number | 'crosstalk';
  /** Design-canvas center coordinates + box size; auto-laid-out when absent. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  details?: PathwayNodeDetails;
}

export interface PathwayDiagramEdge {
  from: string;
  to: string;
  /** short via-prose, shown mid-edge */
  label?: string;
  /** enzyme chip mid-edge, e.g. "PIK3CA (p110α)" */
  enzyme?: string;
  role?: 'signal' | 'regulatory' | 'transport' | 'neutral';
  /** cellular compartment */
  location?: string;
  pmid?: string;
  /** warm-amber "RL" marker on the edge midpoint */
  rateLimiting?: boolean;
  /** dashed amber stroke + crosstalk arrow marker */
  crosstalk?: boolean;
}

export interface PathwayDiagramChip {
  id: string;
  /** node id this chip docks to */
  target: string;
  side: 'left' | 'right' | 'below';
  label: string;
  sub?: string;
  kind: 'native-inhibitor' | 'enzyme' | 'drug-inhibitor' | 'drug-activator';
  x?: number;
  y?: number;
  landingDx?: number;
}

export interface PathwayDiagramFeedback {
  from: string;
  to: string;
  label: string;
  pmid?: string;
}

export interface PathwayDiagram {
  nodes: PathwayDiagramNode[];
  edges: PathwayDiagramEdge[];
  chips?: PathwayDiagramChip[];
  /** single negative-feedback arc (e.g. mTORC1 → IRS-1) */
  feedback?: PathwayDiagramFeedback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stack & Intake (the core daily-loop entities)
// ─────────────────────────────────────────────────────────────────────────────

export interface Stack {
  id: Ulid;
  name: string;
  /** what the stack is for, free-text — also the key the /stacks "by goal"
   *  layout groups on */
  intent?: string;
  /** when it usually fires */
  schedule: StackSchedule;
  items: StackItem[];
  /** ulid of last fire, if any */
  last_fired_at?: string; // ISO 8601
  /** lifecycle phase (planning/active/paused/archived) */
  status: StackStatus;
  /** Optional inventory facet — present when this stack is also a stocked
   *  product (e.g. a multivitamin you both schedule and hold N of). Mirrors
   *  `Item.stock`; the lens (`itemToStack`) surfaces it so /stacks can show
   *  servings and StackEditor can edit them. */
  stock?: ItemStock;
  created_at: string;
  updated_at: string;
}

/**
 * Stack lifecycle phase.
 *
 *   planning    — user is still composing; not yet in rotation
 *   active      — fires on its schedule, surfaces in Today's Now & Next + Plan
 *   conditional — fires only on user demand (PRN). Has a stack and items
 *                 like any other, but is excluded from auto-scheduling and
 *                 the Today plan rows. Useful for as-needed protocols
 *                 (allergy meds, pre-workout, sleep aid) where the user
 *                 picks the day. The schedule field, when set, is treated
 *                 as a soft hint only ("around 8am when I take it").
 *   paused      — temporarily silenced; same as archived for scheduling
 *                 but keeps the stack visible in default lists
 *   archived    — hidden from active lists; data + history retained
 */
export type StackStatus = 'planning' | 'active' | 'conditional' | 'paused' | 'archived';

/** Days of week, lowercased 3-letter abbrevs. ISO order; sun is the 7th
 *  intentionally so loops can iterate mon..sun for week-starts-monday
 *  layouts and JS Date.getDay() (sun=0) gets remapped at the boundary. */
export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * Stack firing cadence. Discriminated by `kind`:
 *
 *   manual         — user fires by hand from Today / Run.
 *   time           — daily at one or more clock times. `times` carries each
 *                    "HH:mm" entry; a single-time stack is just `times: ["08:00"]`.
 *                    Per-time dose overrides live in StackItem.per_time_doses.
 *   weekly         — one or more weekdays. `days` carries each weekday;
 *                    a single-day stack is just `days: ["mon"]`. By
 *                    default every day fires at the shared `hhmm`; when
 *                    `day_times` is set it overrides the time for the
 *                    named days (the "different time per day" mode), with
 *                    `hhmm` the fallback for any day not listed.
 *                    Per-day dose overrides live in StackItem.per_day_doses.
 *   every_n_days   — interval cadence anchored at a YYYY-MM-DD start. Fires
 *                    at `hhmm` every `n` days from the anchor.
 *   every_n_hours  — interval cadence anchored at an ISO timestamp. Fires
 *                    every `n` hours from the anchor; useful for q4h, q8h,
 *                    q12h regimens.
 *   cron           — escape hatch for user-supplied cron expressions.
 *                    Surfaces don't resolve next-fire for cron yet.
 */
export type StackSchedule =
  | { kind: 'manual' }
  | { kind: 'time'; times: string[] }
  | { kind: 'weekly'; days: WeekDay[]; hhmm: string; day_times?: Partial<Record<WeekDay, string>> }
  | { kind: 'every_n_days'; n: number; hhmm: string; anchor_date: string } // YYYY-MM-DD
  | { kind: 'every_n_hours'; n: number; anchor_at: string } // ISO 8601
  | { kind: 'cron'; expr: string };

export type StackItemRole = 'lead' | 'support' | 'cofactor';

export interface StackItem {
  id: Ulid;
  compound: Slug;
  /** Human-readable name for a freeform / not-in-registry item. When the
   *  `compound` slug isn't a registry entry (e.g. a `custom:` slug staged
   *  from an OCR'd label the matcher couldn't resolve), display surfaces
   *  fall back to this instead of showing the raw slug. Undefined for
   *  normal registry items — their name comes from `bySlug(...).name`. */
  label?: string;
  dose: number;
  dose_unit: DoseUnit;
  route: Route;
  /** lead / support / cofactor — purely informational, drives badge color */
  role?: StackItemRole;
  /** optional offset from stack fire time, minutes. negative = take before */
  offset_min?: number;
  /** optional note shown on run sheet */
  note?: string;
  /** Per-time dose overrides for `kind: 'time'` schedules with multiple
   *  slots. Length must equal the schedule's `times.length` when set;
   *  each entry replaces `dose` for the matching time slot. Undefined
   *  means the same `dose` fires at every slot. */
  per_time_doses?: number[];
  /** Per-day dose overrides for `kind: 'weekly'` schedules with multiple
   *  days. Keyed by weekday (robust to day reordering); each entry
   *  replaces `dose` on that day. Undefined means the same `dose` fires
   *  on every day. */
  per_day_doses?: Partial<Record<WeekDay, number>>;
}

export interface Intake {
  id: Ulid;
  /** ulid of the firing stack, if this came from a stack.fire op */
  stack_id?: Ulid;
  compound: Slug;
  /** Display name for a freeform / not-in-registry intake. Carried over
   *  from the StackItem on fire so the logged intake keeps its name when
   *  the `compound` slug has no registry entry. See StackItem.label. */
  label?: string;
  dose: number;
  dose_unit: DoseUnit;
  route: Route;
  at: string; // ISO 8601
  note?: string;
  /** Slug of the bundled food preset this intake was logged from, if it
   *  came from the /run food catalog (not an FDC search or a scan). All
   *  intakes from one preset fire share this slug AND a `created_at`, so a
   *  usage count = distinct `created_at` values per `source_food` (counts
   *  fires, not the per-compound intakes a single fire expands into).
   *  Drives the catalog's "✦ N" usage badges. */
  source_food?: Slug;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fire mode — how a stack.fire decomposes into intakes
// ─────────────────────────────────────────────────────────────────────────────
//
// The /run page's stack-fire surface lets the user pick one of three commit
// strategies. Default is `instant` (the v0.1 behavior). The other two split
// the dose across time:
//
//   instant — every item's full dose lands at the fire moment (existing).
//   rate    — admin-rate. The chosen preset's `steps` intakes per item
//             are committed at-fire-time, spread evenly across the preset's
//             `duration_min`. The user sees N small intakes on Today,
//             approximating a continuous administration (a slow sip, an
//             extended IV, etc.). No Today-page interaction needed after
//             the fire — everything is recorded upfront with future
//             timestamps. Past steps appear as logged intakes; future steps
//             appear as scheduled markers until their `at` is reached.
//   trigger — defers commits. The fire records a `trigger.create` (not a
//             stack.fire) holding the per-step intake template. A Today
//             card surfaces the trigger with "X / N taken" + a tap-to-
//             advance button; each tap emits a `trigger.step` op that
//             both records the partial intakes AND bumps the counter.
//             The card disappears once the counter hits `steps_total`
//             (or the user cancels via `trigger.cancel`).
//
// The data path:
//
//   instant → stack.fire { mode: { kind: 'instant' }, intakes: [...] }
//   rate    → stack.fire { mode: { kind: 'rate', preset_id }, intakes: [...] }
//             where intakes is the pre-expanded set with shifted `at`
//             values and per-step doses.
//   trigger → trigger.create { id, stack_id, template_intakes, steps_total }
//             + subsequent trigger.step ops as the user taps.

/** Admin-rate quick-fill preset. Presets are UI helpers only — they
 *  set the duration + step inputs to a recognizable starting shape
 *  (slow sip, loading dose, steady, extended). The op stores the
 *  resolved `duration_min` + `steps` directly, NOT the preset id, so
 *  retuning a preset later doesn't retroactively change past fires'
 *  timing. The UI matches user-edited values back to a preset only
 *  when they happen to land exactly on one; otherwise the chip row
 *  shows nothing selected (custom). */
export interface RatePreset {
  id: string;
  label: string;
  duration_min: number;
  steps: number;
}

export const RATE_PRESETS: readonly RatePreset[] = [
  { id: 'slow_sip', label: 'Slow sip', duration_min: 30, steps: 6 },
  { id: 'loading', label: 'Loading', duration_min: 60, steps: 4 },
  { id: 'steady', label: 'Steady', duration_min: 120, steps: 8 },
  { id: 'extended', label: 'Extended', duration_min: 240, steps: 8 },
];

/** Clamps applied to user-tuned duration + steps. The picker enforces
 *  these in the UI; the schema enforces them at commit time. */
export const RATE_DURATION_MIN_RANGE = { min: 1, max: 720 } as const; // 1 min — 12 h
export const RATE_STEPS_RANGE = { min: 2, max: 48 } as const;

/**
 * Discriminated union of the three fire-modes. Stored on `stack.fire`
 * op payloads as an optional `mode` field — when absent (pre-existing
 * ops) the surfaces treat the fire as `{ kind: 'instant' }`.
 *
 * Rate mode carries the resolved duration + step count directly (not
 * a preset id), so a UI retune of presets doesn't change replay
 * output for past fires.
 *
 * The `trigger` variant never appears on `stack.fire` ops since trigger
 * mode dispatches to `trigger.create` instead. It's included here only
 * for the UI-side discriminator that picks which op to emit.
 */
export type FireMode =
  | { kind: 'instant' }
  | { kind: 'rate'; duration_min: number; steps: number }
  | { kind: 'trigger'; steps_total: number };

// ─────────────────────────────────────────────────────────────────────────────
// Trigger — deferred stack-fire that the user advances by tapping on Today
// ─────────────────────────────────────────────────────────────────────────────

export interface TriggerTemplateItem {
  compound: Slug;
  /** Display name for a freeform / not-in-registry item, carried so the
   *  per-step intakes a trigger commits keep their name. See StackItem.label. */
  label?: string;
  /** Per-step dose (already divided by `steps_total`). Storing the
   *  per-step value (rather than the full per-item dose) means the
   *  Today-side step handler doesn't need to know steps_total to
   *  compute the intake — it just commits this dose verbatim. */
  dose: number;
  dose_unit: DoseUnit;
  route: Route;
  /** Optional offset from each step time, in minutes. Same semantics
   *  as StackItem.offset_min — supports stacks whose items fire a few
   *  minutes apart. Usually unset for trigger-mode since each step is
   *  already short. */
  offset_min?: number;
  note?: string;
}

export type TriggerStatus = 'active' | 'completed' | 'cancelled';

export interface Trigger {
  id: Ulid;
  stack_id: Ulid;
  /** Display name for the Today trigger card. Set when the trigger has
   *  no real backing stack (e.g. a one-off food log fired in trigger
   *  mode, whose `stack_id` is a synthetic ulid that resolves to no
   *  Stack). When unset the card falls back to the stack's name. */
  label?: string;
  /** Per-step intake template. Each step (tap-to-advance) emits one
   *  intake.create per entry, with `at = step-time` and `dose` taken
   *  verbatim from this template. */
  template_intakes: TriggerTemplateItem[];
  steps_total: number;
  steps_taken: number;
  status: TriggerStatus;
  /** Original "fire moment" — what time the user intended the trigger
   *  to start. Used for ordering on Today and for cleanup heuristics
   *  (a 24-hour-stale active trigger reads as abandoned). */
  scheduled_at: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Observation — structured signal log (was "Signal" in v0.1)
// ─────────────────────────────────────────────────────────────────────────────
//
// The Observe surface (plan §08, surface 04) replaces v7's free-text Journal
// with a multi-dimensional signal entry. Each Observation carries 0..n typed
// dimensions; users slide what's relevant and skip the rest.
//
// `sleep_hours` is kept distinct from `sleep_quality` — one is a numeric
// duration, the other a 0..10 self-score.

export interface Observation {
  id: Ulid;
  at: string; // ISO 8601
  /** 0..10 unless noted. all optional — log only what's relevant */
  mood?: number;
  energy?: number;
  focus?: number;
  sleep_quality?: number;
  anxiety?: number;
  libido?: number;
  /** numeric duration, in hours */
  sleep_hours?: number;
  /** free-text severity tags */
  side_effects?: SideEffect[];
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface SideEffect {
  label: string; // free-text, e.g. "headache"
  severity: 1 | 2 | 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// CompoundNote — freeform user notes attached to a registry compound
// ─────────────────────────────────────────────────────────────────────────────
//
// Compounds are read-only registry data, so user notes can't live on the
// compound record. They're their own op-logged entity, keyed by id with a
// `compound` slug backref. Multiple notes per compound are allowed — a
// running journal ("200mg felt jittery", "better with food"), newest-first
// in the UI.

export interface CompoundNote {
  id: Ulid;
  compound: Slug;
  body: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UserFood — a food the user added when their product wasn't in the catalog
// ─────────────────────────────────────────────────────────────────────────────
//
// The bundled food catalog is read-only registry data, so a food a user adds
// (a specialty matcha, a local brand, a homemade mix) can't live there. It's
// its own op-logged, E2E-synced entity holding a FoodPreset-shaped record (with
// a generated unique `slug`), merged into the /run catalog alongside the bundled
// presets so search / browse / fire treat it identically. This is the demand-pull
// coverage the supply-side catalog can't reach — the long tail a user owns.
export interface UserFood {
  id: Ulid;
  /** Generated url-safe unique slug (e.g. 'u-01jc…'). Stamped on fired intakes
   *  as `source_food`, so it must satisfy the Slug regex. */
  slug: Slug;
  name: string;
  category: FoodCategory;
  /** Subcategory chain below the category (… › brand), like FoodPreset.path. */
  path?: string[];
  /** Serving the `items` doses are per — e.g. '1 tsp (2 g)'. */
  serving: string;
  items: FoodPresetItem[];
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MaudLens — a saved, named starting point for the Maud assistant
// ─────────────────────────────────────────────────────────────────────────────
//
// ONE op-logged, E2E-synced entity (mirrors CompoundNote's create/update/delete
// lifecycle) with a `kind` discriminator. The three kinds are facets of one idea
// — "save this so I can come back to it / start fresh from it":
//   conversation — a frozen snapshot of a chat thread (messages + timestamps)
//   context      — a saved data/consent scope (what data Maud may see)
//   perspective  — a saved framing (mode + an optional system-prompt addendum)
//
// Message content blocks are stored opaque (unknown[]) — the same trust model the
// localStorage thread uses — so @xeno/core stays free of app-side Anthropic types.
export type MaudLensKind = 'conversation' | 'context' | 'perspective';

export interface MaudLensConversationBody {
  messages: unknown[];
  timestamps: string[];
}
export interface MaudLensContextBody {
  dataAccess: boolean;
  windowDays?: number;
  compounds?: Slug[];
}
export interface MaudLensPerspectiveBody {
  mode: 'ask' | 'review' | 'author';
  systemPromptExtra?: string;
}

interface MaudLensCommon {
  id: Ulid;
  /** User-editable label shown in the nav. */
  name: string;
  created_at: string;
  updated_at: string;
}
/** Discriminated on `kind` so `lens.kind` narrows `lens.body` at the call site. */
export type MaudLens =
  | (MaudLensCommon & { kind: 'conversation'; body: MaudLensConversationBody })
  | (MaudLensCommon & { kind: 'context'; body: MaudLensContextBody })
  | (MaudLensCommon & { kind: 'perspective'; body: MaudLensPerspectiveBody });

// ─────────────────────────────────────────────────────────────────────────────
// Inventory (v0.4 surface, but data model locked now)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Physical form of a stored lot. Drives shelf-life heuristics in the
 * UI: a reconstituted peptide is good for ~30 days from open, while
 * the same compound in lyophilized form keeps for 12-18 months in the
 * fridge. Surfaces use this to auto-suggest an `expires_at` when the
 * user enters `opened_at` and leaves expiry blank — never overwriting
 * an explicit value the user already typed.
 *
 *   lyophilized  — dry peptide vial; fridge life ~18 months from open
 *   reconstituted — peptide vial mixed with BAC water; ~30 days from open
 *   capsule      — pre-formed capsules (oral)
 *   tablet       — pressed tablets
 *   powder       — bulk loose powder (creatine, magnesium, etc.)
 *   liquid       — pre-mixed solution / drops
 *   oil          — oil-based suspension (vitamin D drops, etc.)
 *   other        — fall-through; no shelf-life heuristic applied
 */
export type LotStorageForm =
  'lyophilized' | 'reconstituted' | 'capsule' | 'tablet' | 'powder' | 'liquid' | 'oil' | 'other';

export interface InventoryLot {
  id: Ulid;
  compound: Slug;
  brand?: string;
  /** lot number / batch id, free-text */
  lot_id?: string;
  /** mg per dose unit (e.g. "1 capsule = 200mg") */
  mg_per_unit: number;
  /** dose units currently on hand. decremented by inventory.consume. */
  units_on_hand: number;
  /** optional total cost paid for this lot, for cost-per-dose roll-up */
  cost_total?: number;
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'BTC' | 'ETH' | 'XMR';
  opened_at?: string; // ISO 8601, date opened
  expires_at?: string; // ISO 8601, manufacturer expiry
  source_url?: string; // where it was bought
  /** units below this threshold trigger reorder flag */
  reorder_at?: number;
  /** Physical form — drives auto-expiry heuristics; optional so legacy
   *  lots (created before this field existed) keep working unchanged. */
  storage_form?: LotStorageForm;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Item — the unified entity (supersedes InventoryLot + Stack)
// ─────────────────────────────────────────────────────────────────────────────
//
// One thing you hold and/or take. It always has a composition (≥1
// compound+dose component); it OPTIONALLY carries a `stock` facet (you
// hold a countable quantity of it → it shows in Inventory) and/or a
// `protocol` facet (you take it on a schedule → it shows in /stacks):
//
//   single-compound lot   components:[1], stock set,  no protocol
//   product (Red Bull)    components:[N], stock set,  no protocol
//   protocol (TRT)        components:[N], protocol set, stock optional
//
// Inventory and /stacks are two lenses over the same `Item`s. Legacy
// `InventoryLot` / `Stack` are retained only as the shapes the lens
// selectors reconstruct and the legacy op payloads carry; the live
// projection is keyed on `Item` (see @xeno/oplog state.items).

/** Stock facet — present ⇒ the item is tracked in Inventory. Mirrors the
 *  cost/expiry/reorder fields of a lot, with `units_on_hand` counting
 *  whole units (pills) or servings (cans). The per-unit/per-serving mass
 *  lives on each component's `dose`, so this carries no compound/dose. */
export interface ItemStock {
  /** dose-units / servings currently on hand; decremented by item.consume */
  units_on_hand: number;
  cost_total?: number;
  currency?: InventoryLot['currency'];
  /** units below this threshold trigger a reorder flag */
  reorder_at?: number;
  opened_at?: string; // ISO 8601
  expires_at?: string; // ISO 8601
  source_url?: string;
  /** lot number / batch id, free-text */
  lot_id?: string;
  /** physical form — drives auto-expiry heuristics */
  storage_form?: LotStorageForm;
}

/** Protocol facet — present ⇒ the item is a recipe surfaced in /stacks
 *  (scheduled or PRN). Carries everything that distinguished a Stack from
 *  its item list. */
export interface ItemProtocol {
  schedule: StackSchedule;
  status: StackStatus;
  /** what the protocol is for, free-text */
  intent?: string;
  /** ulid/iso of last fire, if any */
  last_fired_at?: string;
}

export interface Item {
  id: Ulid;
  /** Display name. Optional: a bare single-compound lot has none (display
   *  falls back to the component's registry name); products + protocols
   *  set it. */
  name?: string;
  brand?: string;
  /** composition — one entry per compound. Length 1 = a single-compound
   *  lot; length >1 = a multi-ingredient product/protocol. Reuses the
   *  StackItem shape (compound, dose, dose_unit, route, role, offset, …). */
  components: StackItem[];
  /** present ⇒ Inventory lens */
  stock?: ItemStock;
  /** present ⇒ /stacks lens */
  protocol?: ItemProtocol;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lab results (v0.5 surface, but data model locked now)
// ─────────────────────────────────────────────────────────────────────────────

export interface LabResult {
  id: Ulid;
  /** when the blood was drawn (not when entered) */
  drawn_at: string; // ISO 8601
  /** "Men's Hormone + Metabolic", "CMP14", etc. */
  panel?: string;
  /** lab provider — "Quest", "LabCorp", "self-entered" */
  source?: string;
  /** ordering clinician (optional) */
  ordered_by?: string;
  markers: LabMarker[];
  /** attachment id pointing at the source PDF, if any */
  attachment_id?: Ulid;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface LabMarker {
  /** canonical marker key, e.g. "total_testosterone", "ldl_c", "hscrp" */
  key: string;
  value: number;
  unit: string; // "ng/dL", "mg/dL", "mIU/L", ...
  ref_low?: number;
  ref_high?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Attachment (image / PDF blobs — pointer here, bytes in storage)
// ─────────────────────────────────────────────────────────────────────────────

export interface Attachment {
  id: Ulid;
  /** path inside the user's encrypted storage bucket */
  storage_path: string;
  size_bytes: number;
  mime: string;
  /** optional caption — survives sync */
  caption?: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile + settings
// ─────────────────────────────────────────────────────────────────────────────

export interface Profile {
  user_id?: string; // unset until they create an account
  display_name?: string;
  /** Body mass in kg — optional; unset until entered. Feeds allometric PK
   *  scaling (V ∝ WT, clearance ∝ WT^0.75) in the solver. */
  weight_kg?: number;
  timezone: string;
  /** small free-form key/value bag for theme, lane, density, etc. */
  tweaks: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Device (sync identity — v0.3+)
// ─────────────────────────────────────────────────────────────────────────────

export interface Device {
  id: Ulid;
  /** human label — "iPhone", "MacBook", "Linux desktop" */
  label?: string;
  /** Ed25519 public key, base64 */
  pubkey?: string;
  last_seen?: string; // ISO 8601
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Op log
// ─────────────────────────────────────────────────────────────────────────────
//
// The full set of mutations the system understands. Surfaces never mutate
// state directly; they call log.commit(kind, payload). Adding a new op kind
// is a one-place change here, paired with a Zod schema in schemas.ts and an
// applier branch in @xeno/oplog.
//
// Verb naming: `noun.verb`. `create` includes the full entity; `update` is
// upsert-shaped (partial allowed). `consume`/`restock`/`fire` are
// domain-specific verbs that read better than nesting under update.

export type OpKind =
  | 'intake.create'
  | 'intake.update'
  | 'intake.delete'
  | 'intake.createMany'
  | 'stack.create'
  | 'stack.update'
  | 'stack.delete'
  | 'stack.fire'
  | 'trigger.create'
  | 'trigger.step'
  | 'trigger.cancel'
  | 'observation.create'
  | 'observation.update'
  | 'observation.delete'
  | 'compound_note.create'
  | 'compound_note.update'
  | 'compound_note.delete'
  | 'maud_lens.create'
  | 'maud_lens.update'
  | 'maud_lens.delete'
  | 'user_food.create'
  | 'user_food.update'
  | 'user_food.delete'
  | 'inventory.create'
  | 'inventory.update'
  | 'inventory.delete'
  | 'inventory.consume'
  | 'inventory.restock'
  // item.* — the unified successor to inventory.* + stack.*. Legacy ops
  // above still replay (folded into the same `items` projection); new
  // writes use these.
  | 'item.create'
  | 'item.update'
  | 'item.delete'
  | 'item.consume'
  | 'item.restock'
  | 'item.fire'
  | 'lab.create'
  | 'lab.update'
  | 'lab.delete'
  | 'attachment.attach'
  | 'attachment.detach'
  | 'profile.update'
  | 'tweaks.set'
  | 'schedule.skip'
  | 'achievement.unlock';

export interface Op<P = unknown> {
  id: Ulid;
  device_id: string;
  seq: number;
  ts: string; // ISO 8601 client wall-clock
  kind: OpKind;
  payload: P;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isUlid(s: string): s is Ulid {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(s);
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Resolve the dose for a stack item at a given fire moment. When the stack
 * has a `time` schedule with multiple slots AND the item carries a
 * `per_time_doses` array, pick the slot whose HH:mm is closest to the fire
 * time and use that dose. Otherwise fall back to the item's default `dose`.
 *
 * Used by every stack.fire path (Today's quick-fire, /run, /stacks fire) so
 * the right dose lands when a user has authored "5mg AM, 10mg PM" style
 * regimens. Comparison is done in pure clock-minutes mod 24h, so DST and
 * timezones don't matter — both sides are interpreted in the user's local
 * day.
 */
export function doseForFire(schedule: StackSchedule, item: StackItem, fired_at_ms: number): number {
  // Weekly per-day override — pick the dose for the weekday the fire
  // lands on. Keyed by weekday, so day order doesn't matter.
  if (schedule.kind === 'weekly' && item.per_day_doses) {
    const JS_TO_WEEKDAY: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const day = JS_TO_WEEKDAY[new Date(fired_at_ms).getDay()];
    const v = day ? item.per_day_doses[day] : undefined;
    return typeof v === 'number' && v > 0 ? v : item.dose;
  }
  if (
    schedule.kind !== 'time' ||
    schedule.times.length === 0 ||
    !Array.isArray(item.per_time_doses) ||
    item.per_time_doses.length === 0
  ) {
    return item.dose;
  }
  const d = new Date(fired_at_ms);
  const fireMin = d.getHours() * 60 + d.getMinutes();
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < schedule.times.length; i++) {
    const t = schedule.times[i]!;
    const [h, m] = t.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
    const slotMin = (h ?? 0) * 60 + (m ?? 0);
    const raw = Math.abs(fireMin - slotMin);
    const diff = Math.min(raw, 1440 - raw);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  const v = item.per_time_doses[bestIdx];
  return typeof v === 'number' && v > 0 ? v : item.dose;
}

/**
 * Estimated shelf life in days for a freshly-opened lot of the given
 * storage form. Returns null when there's no good heuristic (oral
 * capsules, tablets, oils — these are bound by the manufacturer's
 * expiry date, not how long since opened, so we don't fabricate one).
 *
 * Rough numbers, in days, picked to be conservative:
 *   reconstituted — 30 (BAC-water peptide vials in fridge)
 *   lyophilized   — 540 (~18 months in fridge for dry peptide)
 *   powder        — 365 (bulk powders kept dry)
 *   liquid        — 180 (pre-mixed solutions once opened)
 *   capsule/tablet/oil/other — null (use manufacturer expiry)
 */
export function shelfLifeDaysForForm(form: LotStorageForm): number | null {
  switch (form) {
    case 'reconstituted':
      return 30;
    case 'lyophilized':
      return 540;
    case 'powder':
      return 365;
    case 'liquid':
      return 180;
    default:
      return null;
  }
}

/**
 * Normalize a dose to milligrams. Used for plotting + cost-per-dose math —
 * never persisted (the canonical dose stays in its declared unit).
 */
export function doseToMg(dose: number, unit: DoseUnit): number {
  switch (unit) {
    case 'mg':
      return dose;
    case 'g':
      return dose * 1000;
    case 'mcg':
      return dose / 1000;
    case 'IU':
      return dose; // unit-specific; caller should treat IU as opaque
  }
}
