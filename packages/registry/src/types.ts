/**
 * types.ts — the shape of the registry, and nothing else.
 *
 * This file is the registry half of a 2,209-line types module that also carried
 * an application's worth of entities (stacks, intakes, observations, inventory
 * lots, lab results, op-log kinds, achievements). Those described a consumer
 * that no longer exists, and keeping them here would have implied the registry
 * knows about a user. It does not: this is a cited reference catalog, and the
 * only things it describes are compounds, pathways and targets.
 *
 * No imports, no zod, no I/O — `schema.ts` mirrors these shapes as validators
 * and `load.ts` is the only thing that produces them.
 */

/** URL-safe compound id, e.g. "magnesium-glycinate". */
export type Slug = string;

export type Route = 'PO' | 'SL' | 'IM' | 'IV' | 'SC' | 'IN' | 'TD' | 'INH' | 'PR';
export type DoseUnit = 'mg' | 'g' | 'mcg' | 'IU';

/**
 * Body system the compound's mechanism touches.
 *
 * The standard 10 organ systems from medical anatomy. Compounds carry an array
 * (`systems[]`) — every system whose tissues / receptors / pathways the
 * compound's mechanism names is tagged. Most compounds have 2-4 tags (caffeine:
 * nervous + cardiovascular + endocrine).
 *
 * No "primary" designation: it would force a subjective dose-and-context
 * dependent decision (caffeine 50 mg vs 400 mg, aspirin low-dose chronic vs
 * high-dose acute) that no PMID anchors. Surfaces handle multi-system at the
 * rendering layer — a compound shows up on every system page it tags.
 *
 * Authoring rule: a system tag is justified when the compound's `mechanism`
 * prose names a target tissue / organ / receptor in that system. The free-text
 * `mechanism` is the ledger; `systems[]` is a derived marker, not a novel claim.
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

/** Display metadata per system. `short` is for compact UI (chips, tiles);
 *  `label` is the full name; `description` lists the tissues / organs /
 *  functions that fall under it, which is authoring guidance as much as copy. */
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
  // Dietary carbohydrates + sugar substitutes. 'sugar' = conventional
  // mono/disaccharides and carb mixtures; 'sweetener' = high-intensity
  // (synthetic + natural), polyols, and rare-sugar substitutes.
  | 'sugar'
  | 'sweetener'
  | 'other';

export interface DoseRange {
  min: number;
  max: number;
  typical: number;
  /** REQUIRED. Consumers used to default a missing unit to mg; a silent default
   *  on a dose is a hundred- or thousandfold error waiting to happen, so the
   *  registry states it on every row. */
  unit: DoseUnit;
}

/**
 * The species a PK or PK/PD value was measured in.
 *
 * Animal-derived values are ALLOWED in this registry, because for many research
 * peptides and for whole mechanism classes no human study exists and an
 * order-of-magnitude curve beats no curve at all. What is not allowed is letting
 * an animal number pass as a human one: a rat half-life and a human half-life
 * render identically unless the data says which it is. Setting this field is how
 * a value earns the right to stay.
 *
 * Omitted means human. That keeps the common case free of noise, and it is safe
 * because the field is only ever added — never removed — when a value is found
 * to be animal-derived.
 */
export type SourceSpecies =
  'rat' | 'mouse' | 'dog' | 'pig' | 'sheep' | 'rabbit' | 'monkey' | 'horse' | 'cow';

/**
 * PK parameters for a single (compound, route) pair.
 *
 * Which model a consumer can build is decided by which fields are set:
 *   - 1-comp: ka_hr, ke_hr (or derived from half_life_hr), V_L, F
 *   - 2-comp: ka_hr, alpha_hr, beta_hr, k21_hr, V_L, F
 *
 * All fields optional, which is exactly why `lint.ts` records what an ABSENT
 * field makes a consumer assume — see the DEFAULT_* constants there.
 */
export interface RoutePk {
  /** Absorption rate constant, 1/hr. Meaningless for IV. */
  ka_hr?: number;
  /** Elimination rate constant, 1/hr (1-comp). Overrides half_life_hr. */
  ke_hr?: number;
  /** Volume of distribution / central compartment volume, litres. */
  V_L?: number;
  /** Bioavailability, fraction in [0, 1]. */
  F?: number;
  /** Fast disposition rate, 1/hr (2-comp only, alongside beta_hr + k21_hr). */
  alpha_hr?: number;
  /** Terminal elimination rate, 1/hr (2-comp only). Replaces ke_hr. */
  beta_hr?: number;
  /** Peripheral → central rate, 1/hr (2-comp only). */
  k21_hr?: number;
  /** Michaelis-Menten Vmax, mg/L/hr. Set alongside mm_km_mg_per_l to declare
   *  saturable elimination (phenytoin, ethanol, salicylates); linear ke is then
   *  not the model. */
  mm_vmax_per_hr?: number;
  /** Michaelis constant Km, mg/L — the concentration at which elimination is
   *  half-max. Required alongside mm_vmax_per_hr to mean anything. */
  mm_km_mg_per_l?: number;
  /** Parallel non-saturable elimination, 1/hr — a first-order pathway running
   *  ALONGSIDE the saturable one (acetaminophen glucuronidation beside
   *  saturable sulfation). Only meaningful when MM params are set. */
  mm_linear_ke_hr?: number;
  /** Zero-order absorption duration, hr. When set instead of ka_hr, F·dose
   *  enters at a CONSTANT rate over this window — the right model for
   *  transdermal patches and depot injections, which release at ~constant rate
   *  rather than first-order. */
  zo_dur_hr?: number;
  /** Absorption lag, hr. Plasma is 0 until lag_hr, then absorption begins. For
   *  depots with a release lag (risperidone Consta, ~3 weeks). */
  lag_hr?: number;
  /** PubMed ID for the source study, "PMID:12345678". */
  source_pmid?: string;
  /**
   * Non-PubMed primary provenance — a regulatory label or pharmacopoeia
   * monograph that states the PK verbatim but carries no PMID. Free text naming
   * the document precisely enough to re-derive the numbers, e.g. "FDA label:
   * Zepatier (elbasvir/grazoprevir), DailyMed setid 8d6e…".
   *
   * A label is a legitimate primary source — for many modern agents the approval
   * package's clinical-pharmacology section is the only public place Cmax /
   * t-half / F appear together, because the popPK paper reserves them for
   * full-text tables. What is NOT legitimate is leaving such a route looking
   * unsourced: before this field existed, label-derived PK and PK with no
   * provenance at all both rendered as an em-dash.
   *
   * Authoring rule: every pk[route] carrying params sets EITHER source_pmid OR
   * source_label. `pk.pmid` warns only when neither is set.
   */
  source_label?: string;
  /** Species this route's parameters were measured in, when not human. See
   *  {@link SourceSpecies}: if the cited paper dosed an animal, set this — do
   *  not drop the value and do not leave it looking human. */
  source_species?: SourceSpecies;
  /**
   * Per-route provenance prose — which of the row's numbers came from where.
   *
   * A route row is a BUNDLE of three or four values and they can legitimately
   * come from different documents (a primary for most of the row, the label for
   * the one value no abstract states). Until provenance is per-field, saying so
   * here is the contract, and five records rely on it. The field is authored on
   * only a handful of rows but it must survive the loader: a schema that omits
   * it deletes the sentence that explains an apparent citation mismatch.
   */
  note?: string;
}

/**
 * Effect compartment — Cp ↔ Ce equilibration.
 *
 * The lag between plasma concentration and the felt effect is captured by the
 * rate constant keo (per hour). Small keo (0.05/hr) means slow equilibration and
 * a long tail past plasma; large keo (5/hr) means Ce tracks plasma tightly.
 *
 * Intrinsic to the molecule and its dominant receptor compartment, NOT
 * route-dependent: route changes Cp, and once Cp is known the equilibration to
 * the effect site is the same however Cp got there.
 */
export interface EffectCompartment {
  /** Plasma → effect-site equilibration rate, 1/hr. */
  keo_per_h: number;
  /** PMID anchoring keo's value. */
  source_pmid?: string;
  /** Species the keo was fitted in, when not human. Several values here are
   *  honest animal fits — GHB's from a rat EEG hysteresis model, oxycodone's
   *  from sheep brain:blood equilibration — and they are worth keeping, but a
   *  surface has to be able to say so rather than presenting them as human. */
  source_species?: SourceSpecies;
  /**
   * True when keo_per_h is a reasoned estimate rather than a value fitted from a
   * published PK/PD model. Roughly a third of the registry's keo values are
   * estimates: for whole mechanism classes (nuclear-receptor agonists,
   * therapeutic antibodies, orexin antagonists) no effect-compartment model has
   * ever been published, yet the effect demonstrably lags plasma and a keo of 0
   * would be a worse lie than an order-of-magnitude one.
   *
   * Set it alongside a `note` giving the reasoning. It exists so surfaces can
   * say "estimated" out loud instead of showing the same blank source cell as a
   * value whose citation was simply never recorded. NEVER set it on a value that
   * does have a primary source, and never use it to launder a number nobody
   * reasoned about.
   */
  approximated?: boolean;
  /** Prose describing the effect site and the value's provenance. */
  note?: string;
}

/** Ligand mode of action at a receptor site. Orthogonal to emax, which is
 *  occupancy magnitude only. */
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
 * Hill-Langmuir occupancy for a single receptor binding site.
 *
 *   occupancy(Ce) = emax · Ceⁿ / (ec50ⁿ + Ceⁿ)
 *
 * Multiple sites are summed only at the consumer level. Each site carries its
 * own provenance, because each is a separate published measurement.
 */
export interface ReceptorSite {
  /** Free-text receptor key, e.g. "adenosine_A1". `canonicalReceptor()` maps
   *  known spelling variants onto one key; `receptor.unknown-target` reports
   *  keys the receptor catalog does not describe. */
  receptor: string;
  /** Optional phenotype tag — "wakefulness", "beta1_blockade", "analgesia".
   *  A LABEL, not a foreign key: none of the 40 tags in use is a `Pathway.slug`,
   *  and the naming similarity has misled readers into treating it as a join. */
  pathway?: string;
  /** Maximum occupancy fraction at saturating Ce, in (0, 1]. Usually 1. */
  emax: number;
  /** Concentration giving half-maximum occupancy, in mg/L (== µg/mL). */
  ec50_mg_l: number;
  /** Hill coefficient. n = 1 is hyperbolic; n > 1 is sigmoidal. */
  hill_n: number;
  /** Ligand mode of action at this site. */
  action?: ReceptorAction;
  /** PMID anchoring the binding parameters. */
  source_pmid?: string;
  /**
   * Non-PubMed primary provenance: a regulatory label or monograph, named the
   * way `RoutePk.source_label` requires — product, set id and effective date,
   * because a label is revised in place and "the FDA label" points at whatever
   * it says today.
   *
   * Here for the same reason it exists on a route, and discovered the same way.
   * Ziprasidone's 5-HT2A, 5-HT2C and H1 affinities are stated verbatim in GEODON
   * section 12.2 and in no paper this project can fetch: the two candidate
   * primaries (Schmidt 2001, Seeger 1995) have abstracts containing no numbers
   * at all and full text in neither PMC nor Europe PMC. Without this field the
   * only honest options were a midpoint off a curation database, which is what
   * those rows held, or deleting real pharmacology. A label is a primary
   * document; what it is not is a PubMed id, and that is a property of the
   * citation, not of the evidence.
   *
   * `receptor.pmid` accepts either this or `source_pmid`, and refuses a row with
   * neither. What a label does NOT carry is a species, a tissue or a
   * radioligand — it prints the number and nothing around it — so a
   * label-sourced row must say that in its `note` rather than let a reader
   * assume a cloned-human assay.
   */
  source_label?: string;
  /** Provenance prose: species / tissue / radioligand / verbatim quote, or an
   *  "approximation" caveat. This is the data-quality detail behind the value
   *  and was once stripped at load, so no surface could show it. */
  note?: string;
  /**
   * WHICH CONCENTRATION `ec50_mg_l` IS REFERENCED TO. Not a nuance — getting it
   * wrong biases every occupancy percentage in one direction.
   *
   * - `in_vitro_ki` (the default, and what almost all rows are): a binding
   *   affinity measured in buffer or membrane prep, i.e. against FREE drug. It
   *   must be compared against free plasma (Cp × fu), not total plasma. For a
   *   99%-bound drug the difference is a hundredfold.
   * - `in_vivo_plasma_ec50`: a concentration-occupancy relationship fitted in a
   *   living subject, already referenced to TOTAL plasma. Apply no free fraction.
   * - `whole_blood_ic50`: measured in a human whole-blood assay, which already
   *   contains albumin and AAG at physiological concentration, so it is already
   *   the right comparator for a total plasma curve. Applying fu to one of these
   *   DOUBLE-CORRECTS: the COX assays that dominate the NSAID rows are all of
   *   this kind, and diclofenac's fu of 0.003 against a whole-blood COX IC50
   *   would shift the comparison 333-fold in the wrong direction.
   *
   * Absent is treated as `in_vitro_ki`.
   */
  basis?: 'in_vitro_ki' | 'in_vivo_plasma_ec50' | 'whole_blood_ic50';
}

/**
 * Per-edge interaction kinetics. All fields optional; only the ones authored say
 * anything. Ki is reported in the literature as µM while plasma curves are in
 * mg/L, so a consumer needs the perpetrator's `mw_g_mol` to use `ki_uM` at all —
 * which is why `interactions.ki-needs-mw` is an error.
 */
export interface InteractionKinetics {
  /** Reversible-inhibition constant in µM. The fractional drop in the victim's
   *  clearance is Cp_perp / (Cp_perp + Ki); at Cp_perp = Ki the victim's
   *  elimination halves. */
  ki_uM?: number;
  /**
   * What `ki_uM` actually IS. Absent means `'in_vitro'` — a published affinity
   * against the victim's dominant clearance enzyme.
   *
   * `'calibrated_from_auc'` says the number is NOT an affinity. It was inverted
   * out of an observed clinical AUC fold-change through an assumed perpetrator
   * concentration:
   *
   *     ki_uM = assumed_perp_uM / (auc_ratio − 1)
   *
   * which is the value that makes a `1 + Cp/Ki` model reproduce the published
   * ratio WHEN Cp equals that assumed concentration. That is a defensible way to
   * carry a clinical interaction whose in-vitro constant is unpublished — the
   * fold-change is what the papers actually report — but it is a calibration,
   * not a measurement, and it must say so: the dose-response away from the
   * assumed exposure is then unanchored, and the cited PMID contains no Ki for
   * anyone checking it to find.
   *
   * Discovered by algebra rather than by reading: across whole perpetrator
   * blocks the implied `assumed_perp_uM` was a single shared constant to two
   * decimals — itraconazole 0.5 µM, trimethoprim 3.0, aprepitant 1.5,
   * cimetidine 5.0, paroxetine 0.2, gemfibrozil 35.
   */
  ki_basis?: 'in_vitro' | 'calibrated_from_auc';
  /** The verbatim published exposure fold-change this edge was calibrated from
   *  (2.5 = "AUC increased 2.5-fold"). Required alongside
   *  `ki_basis: 'calibrated_from_auc'` — it is the honest primary quantity, and
   *  storing it is what makes the calibration reconstructible. */
  auc_ratio?: number;
  /** The perpetrator concentration (µM) assumed when inverting `auc_ratio` into
   *  `ki_uM`. Required alongside `ki_basis: 'calibrated_from_auc'`;
   *  `interactions.ki-calibration-mismatch` checks the three agree to 2%. */
  assumed_perp_uM?: number;
  /** Steady-state induction multiplier on the victim's elimination at typical
   *  therapeutic perpetrator exposure. 1.0 = no effect; 1.4 = 40% faster
   *  clearance. */
  induction_factor?: number;
  /** Plasma-protein-binding displacement: fractional bump in the victim's free
   *  fraction at typical perpetrator exposure. 0.10 = 10% more drug unbound.
   *  Matters for highly-bound drugs (warfarin, valproate). */
  plasma_binding_displacement?: number;
  /**
   * Mechanism-based ("irreversible") inhibition marker — a qualitative property
   * of the PERPETRATOR's mechanism, set alongside `ki_uM`. Such an inhibitor
   * inactivates the enzyme covalently, so its effect OUTLASTS its plasma
   * presence: recovery is rate-limited by enzyme resynthesis on a multi-day
   * timescale, not by the perpetrator clearing. Marking it adds a persistence
   * tail without fabricating a new continuous parameter (k_inact / K_I) — the
   * depth stays the published `ki_uM`. Classic cases: grapefruit
   * furanocoumarins, clarithromycin, diltiazem/verapamil, ritonavir/cobicistat
   * (CYP3A4); paroxetine (CYP2D6); gemfibrozil (CYP2C8).
   */
  mbi?: boolean;
}

/**
 * One directed interaction edge from a compound to a counterparty.
 *
 * `level` grades the claim: synergistic / beneficial are informational, caution
 * is "worth knowing", warn is "avoid concurrent", major / contraindicated are
 * "do not combine". An edge is stored on ONE side only, so the symmetric view is
 * materialized at query time — see `interactionsOf`.
 */
export interface InteractionRef {
  /** Counterparty compound slug. Deliberately looser than a registry slug: the
   *  catalog carries edges against substances it does not yet catalog. */
  slug: Slug;
  /** Display name; sometimes diverges from the registry's own display name. */
  name: string;
  level: 'synergistic' | 'beneficial' | 'caution' | 'warn' | 'major' | 'contraindicated';
  /** Free-text rationale, shown verbatim. */
  note: string;
  /** Optional timing hint, e.g. "8h apart", "evening only". */
  timing?: string;
  /** Quantitative kinetics. Absent → the edge is informational only. */
  kinetics?: InteractionKinetics;
  /** PMID anchoring the kinetics numbers. Required when kinetics is set —
   *  unsourced potency values must not drive curve adjustments. */
  source_pmid?: string;
}

/**
 * Composition for a multi-constituent product (plant extract, fixed-dose
 * combination, mixed isomers). A consumer expands a dose of the parent into
 * per-constituent doses scaled by `mg_per_g_extract`. The parent itself usually
 * carries `pk_unauthored: { reason: 'mixture' }`, because no single species' PK
 * fits the whole extract.
 *
 * Example — Panax ginseng (200 mg standardized to 4% ginsenosides):
 *   constituents: [
 *     { slug: 'ginsenoside-rb1', mg_per_g_extract: 12 },   // → 2.4 mg
 *     { slug: 'ginsenoside-rg3', mg_per_g_extract: 2 },    // → 0.4 mg
 *   ]
 */
export interface Composition {
  standardization?: string;
  constituents: Array<{
    slug: Slug;
    mg_per_g_extract: number;
    note?: string;
    source_pmid?: string;
  }>;
}

/**
 * Nutritional dosing model — for compounds where a plasma curve is the wrong
 * question (homeostatically-regulated minerals, fat-soluble vitamins, essential
 * cofactors). The relevant axes are cumulative daily intake against RDI and UL.
 *
 * `unit` must match the compound's typical dose unit so that summing intakes is
 * meaningful; mg↔mcg↔g convert, IU does not convert to anything.
 */
export interface Nutrition {
  /** Typical adult daily target, in `unit`. */
  rdi: number;
  /** Tolerable upper limit; absent means no formal UL. */
  ul?: number;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  source_pmid?: string;
  note?: string;
}

export interface Compound {
  slug: Slug;
  name: string;
  aliases: string[];
  category: CompoundCategory;
  /** Body systems the mechanism touches. Order is non-significant; SYSTEM_IDS
   *  gives the canonical display order. `systems.tagged` is an ERROR when this
   *  is empty — coverage reached every compound, so the only remaining source of
   *  an untagged record is drift on a new one. */
  systems?: SystemId[];
  /** Primary mechanism, free text. This is the ledger the `systems[]` tags are
   *  derived from, and several lint rules read it for provenance the schema
   *  cannot hold. */
  mechanism: string;
  /** Routes for which there is at least dose information. */
  routes: Route[];
  /** Typical doses by route. */
  doses: Partial<Record<Route, DoseRange>>;
  /** Terminal half-life in hours by route; missing means unknown. */
  half_life_hr: Partial<Record<Route, number>>;
  /** Per-route PK parameters. Absent is a legitimate state — see
   *  `pk_unauthored`, which is how the registry says so out loud. */
  pk?: Partial<Record<Route, RoutePk>>;
  effect_compartment?: EffectCompartment;
  /** Per-receptor Hill-Langmuir occupancy. One entry per binding site; a
   *  multi-receptor ligand declares several (caffeine at adenosine A1 AND
   *  A2A). */
  receptor_occupancy?: ReceptorSite[];
  /** Known interactions, from THIS compound's perspective — `slug` references
   *  the counterparty. */
  interactions?: InteractionRef[];
  /**
   * Molecular weight in g/mol. Needed to convert the µM in which literature
   * reports Ki and EC50 into the mg/L a plasma curve is denominated in:
   * mg/L = µM × mw_g_mol / 1000.
   *
   * WHICH SPECIES: this field names ONE molecule, and a prodrug record describes
   * TWO. It must be the mass of the species `pk_analyte` declares — the one that
   * actually circulates and that `pk[]` already describes — NOT the dosed
   * parent. Both consumers want that species: the µM→mg/L conversion runs
   * against the circulating curve, and a display that back-converts a stored
   * `ec50_mg_l` was authored from an affinity measured on the ACTIVE species. A
   * parent mass here makes that round trip fail to close, so a reader is shown a
   * number the cited source does not contain. Ten records carried the parent
   * mass and were corrected on 2026-09-08.
   */
  mw_g_mol?: number;
  /**
   * Fraction of the DOSED mass that is the species `pk[]` describes. Absent
   * means 1.0 — dose and modelled species are the same molecule, the usual case.
   *
   * WHY THIS EXISTS. `doses[]` holds what a person actually takes, which is
   * routinely a SALT, while `pk[]` describes the free base or the ion. Dividing
   * dose by volume without this overstates every concentration by the
   * counter-ion's share of the formula mass. The catalog's stated convention —
   * free-base `mw_g_mol` beside salt-form doses — is harmless while the mass
   * only converts µM affinities, and not harmless once the dose feeds a curve.
   *
   * lithium is the case that forced it: 900 mg of lithium CARBONATE is 169 mg of
   * lithium, so the curve ran 5.32× high and rendered a standard dose at
   * 2.32 mmol/L against a therapeutic band of 0.6-1.2 — above the toxicity
   * threshold, i.e. wrong in the direction that matters. Brompheniramine is the
   * same shape at 1.36×.
   *
   * DO NOT use this to paper over a bad volume or a bad bioavailability. It is a
   * stoichiometric constant — the analyte's share of the dosed salt's formula
   * mass — and nothing else. If you cannot write the arithmetic in
   * `dose_moiety_note`, the number does not belong here.
   */
  dose_moiety_fraction?: number;
  /** Provenance for `dose_moiety_fraction`: the salt actually dosed, the
   *  analyte, and the arithmetic. `dose.moiety-note` warns when the fraction is
   *  set without one, because a bare stoichiometric constant is unreviewable. */
  dose_moiety_note?: string;
  /**
   * MILLIGRAMS PER INTERNATIONAL UNIT, for a record whose `doses[]` are in IU.
   *
   * An IU is a unit of BIOLOGICAL POTENCY, and its mass equivalence is fixed
   * separately for each substance by a pharmacopoeial definition: 1 IU is 0.025 mcg
   * of cholecalciferol and 1 mg of dl-alpha-tocopheryl acetate — a factor of 40,000
   * apart. It therefore cannot be a constant in the resolver, and it cannot be
   * derived from the molecular weight, because potency is not mass. It is stored per
   * record with the source that states the equivalence, exactly as
   * `dose_moiety_fraction` is.
   *
   * Until it is set, an IU-dosed route yields no curve at all: `impliedExposure`
   * refuses the dose rather than guessing a mass. That refusal is correct, and it is
   * why four records carrying authored PK and a cited half-life rendered nothing.
   */
  mg_per_iu?: number;
  /** Provenance for `mg_per_iu`: the substance, the pharmacopoeial equivalence and
   *  the arithmetic. `dose.iu-note` warns when the factor is set without one. */
  iu_note?: string;
  /**
   * FRACTION UNBOUND IN PLASMA (fu), in (0, 1] — the share of the plasma
   * concentration not bound to albumin or AAG and therefore available to reach a
   * receptor.
   *
   * A plasma curve is TOTAL drug, while a `receptor_occupancy` row whose `basis`
   * is `in_vitro_ki` is a FREE-drug affinity. Comparing the two directly
   * overstates occupancy by roughly 1/fu, which for the 90-99%-bound molecules
   * that dominate the catalog is one to two orders of magnitude. This field is
   * the correction: occupancy is driven by Cp × fu.
   *
   * ABSENT MEANS 1.0 — the pre-correction behaviour, so a record without it is
   * unchanged rather than silently re-scaled.
   */
  fraction_unbound?: number;
  /**
   * Provenance and caveat prose for `fraction_unbound` — the verbatim quote, the
   * species and population, and any reason the scalar is an approximation.
   *
   * That last part is not optional politeness. Binding is
   * CONCENTRATION-DEPENDENT for some drugs (acetazolamide's own source says so),
   * rises substantially in renal failure, hypoalbuminaemia, pregnancy and old
   * age, and for the most extensively bound molecules a point value may not be
   * measurable at all — montelukast's methods literature states that "only a
   * range of fu can be reported with confidence".
   *
   * MAY BE SET WITHOUT `fraction_unbound`, and that combination is meaningful:
   * it records that a free fraction was LOOKED FOR AND DELIBERATELY NOT
   * AUTHORED. Without this state the only place for such a decision was prose no
   * rule could read, so `pd.occupancy-needs-fu` kept re-reporting questions that
   * had already been answered.
   */
  fu_note?: string;
  /**
   * WHICH MOLECULE `pk[]` AND `half_life_hr[]` ACTUALLY DESCRIBE.
   *
   * For a compound that converts to an active species, "the half-life" is not a
   * well-formed quantity until this is said. Audit passes kept finding records
   * where it differed by an order of magnitude — sofosbuvir stored the half-life
   * of an INACTIVE metabolite carrying >90% of systemic exposure while its active
   * species never enters plasma at all; risperidone stored the parent's
   * bioavailability beside the active moiety's half-life, which is neither of the
   * two rows its own abstract offers.
   *
   * - `parent` — the dosed molecule, measured as itself.
   * - `active-metabolite` — the species the parent converts to. Name it in
   *   `pk_analyte_name` when it is not this compound (valganciclovir's oral
   *   bioavailability measures GANCICLOVIR appearing in plasma, and the two
   *   molecular weights differ by 1.39×, so molar work must know).
   * - `active-moiety` — parent plus active metabolite summed, which is what most
   *   clinical papers report for drugs like risperidone.
   * - `total-drug-related` — total radiolabelled material, which is what a
   *   mass-balance study measures and is rarely what should be modelled.
   */
  pk_analyte?: 'parent' | 'active-metabolite' | 'active-moiety' | 'total-drug-related';
  /** The named species when `pk_analyte` is not this compound itself, e.g.
   *  "ganciclovir" on valganciclovir, "morphine" on codeine. */
  pk_analyte_name?: string;
  /**
   * Marks a compound where pk[route] is intentionally unauthored, because
   * authoring it would be either misleading or impossible. A consumer renders an
   * explanation instead of "data missing", and `coverage()` counts these as
   * VISITED: a deliberate absence is a curatorial decision, not a gap.
   *
   *   local-acting    — gut / inhaled / topical / ophthalmic, where systemic
   *                     plasma PK is negligible by design (acarbose, lactulose,
   *                     rifaximin, simethicone, beclomethasone INH)
   *   research-only   — research / pre-clinical compounds that have not been
   *                     through Phase I PK characterization (SARMs: andarine,
   *                     lgd-3303)
   *   mixture         — multi-component or class entry where no single plasma
   *                     species can be fitted
   *   uncharacterized — genuinely administered to people (clinically,
   *                     historically or recreationally) but no indexed primary
   *                     source publishes a modelled parameter. Distinct from
   *                     research-only: the human exposure is real and often
   *                     long-standing, the LITERATURE is what is missing. Older
   *                     agents predating modern PK methodology land here
   *                     (testosterone propionate, methandrostenolone), as do
   *                     substances studied only for their effects (salvinorin A,
   *                     harmine).
   *   label-only      — thoroughly characterized, but ONLY where this project
   *                     cannot cite: the approved label and the registration
   *                     dossier. Every candidate abstract reports ratios or
   *                     subgroup contrasts and no absolute parameter. Distinct
   *                     from uncharacterized, where the science itself is
   *                     missing: here the science exists and the INDEXING fails,
   *                     so the honest record says so rather than implying the
   *                     drug is poorly understood (desvenlafaxine).
   *   homeostatic     — an endogenous substrate whose plasma level is held by
   *                     active regulation rather than by absorption and
   *                     first-order clearance (glucose, fructose). A Bateman
   *                     curve here would not merely be unsourced, it would be the
   *                     wrong model: the body defends the concentration, so dose
   *                     does not set the peak and t-half does not set the decay.
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
  composition?: Composition;
  nutrition?: Nutrition;
  /** Quick reference prose. Several lint rules read it for provenance claims the
   *  schema has no field for. */
  notes?: string;
  /** PMIDs cited for the compound as a whole, "PMID:12345678". */
  refs: string[];
  /** BiGG metabolite ID in Recon3D (Brunk 2018, PMID:29457794), stored without
   *  the compartment suffix ("atp", not "atp_c"). NOT a slug — BiGG IDs use
   *  underscores and double underscores per that namespace's convention. */
  recon3d_metabolite_id?: string;
  /**
   * Slugs this compound has ABSORBED — earlier records for the same molecule
   * that were merged into this one and retired.
   *
   * Slug uniqueness never guaranteed identity uniqueness, so the catalog
   * accumulated pairs of records describing one substance under two names: an
   * international name beside a national one, a stereochemical prefix beside the
   * bare form, a spelling variant. Each side was authored independently, so the
   * registry could publish two different half-lives for one molecule.
   *
   * Merging fixes that, but a slug is not private to the registry — anything
   * that recorded a slug still names the retired one. So the surviving compound
   * keeps the retired names here and every lookup resolves through them (see
   * `compoundIndex`), which makes an old reference resolve without rewriting
   * history. Registry-INTERNAL references (pathway steps, interaction edges) are
   * rewritten to the canonical slug at merge time and must NOT rely on this;
   * `lintRegistry` enforces that they point at live slugs.
   *
   * A retired slug must be globally unique and must never equal a live slug.
   */
  retired_slugs?: Slug[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pathways
// ─────────────────────────────────────────────────────────────────────────────

/**
 * High-level grouping for a pathway. Each value frames a distinct authoring
 * discipline:
 *
 *  - biosynthesis: precursor → product transformations (catecholamines, heme)
 *  - catabolism: degradation paths (purine catabolism, β-oxidation)
 *  - drug_metabolism: CYP/UGT-driven xenobiotic clearance
 *  - signaling: signal-transduction cascades (mTOR, NF-κB, IGF-1)
 *  - receptor_pharmacology: specific-receptor systems (opioid, GABA-A, …)
 *  - transport: active transport / efflux loops (P-gp, OATP)
 *  - membrane: ion channels, membrane lipid composition
 *  - endocrine_axis: HPA / HPG / RAAS / HPT
 *  - immune_innate: TLR, cGAS-STING, NLRP3, complement
 *  - cell_death: apoptosis / ferroptosis / pyroptosis / senescence / autophagy
 *  - disease_cascade: chronic-disease progression models (AD, PD, atherosclerosis)
 */
export type PathwayCategory =
  | 'biosynthesis'
  | 'catabolism'
  | 'drug_metabolism'
  | 'signaling'
  | 'receptor_pharmacology'
  | 'transport'
  | 'membrane'
  | 'endocrine_axis'
  | 'immune_innate'
  | 'cell_death'
  | 'disease_cascade';

/**
 * Therapeutic / clinical domain — the third orthogonal axis on a pathway,
 * alongside `category` (mechanism) and `systems` (organ system). Answers "which
 * medical area cares about this pathway?". A pathway can belong to several
 * (atherosclerosis = cardiometabolic + immune_inflammation). Optional: a rare
 * pathway with no dominant clinical home stays untagged rather than mistagged.
 */
export type PathwayDomain =
  | 'metabolic'
  | 'cardiometabolic'
  | 'neuropsychiatric'
  | 'pain_analgesia'
  | 'endocrine_reproductive'
  | 'immune_inflammation'
  | 'infectious_disease'
  | 'oncology'
  | 'dermatology'
  | 'gi_hepatic'
  | 'respiratory'
  | 'aging_regenerative';

/**
 * One transformation in a pathway.
 *
 * `from` / `to` are FREE TEXT by design — most pathway endpoints are processes
 * and states ("cortical pyramidal glutamate release", "5-HT2A → Gq → PLC"), not
 * molecules, and those will never be registry compounds. The CHECKABLE claim
 * lives in `from_slug` / `to_slug`, which must resolve when present. That split
 * replaced a warning that fired on 777 free-text endpoints it could never have
 * resolved.
 */
export interface PathwayStep {
  from: Slug | string;
  to: Slug | string;
  /** The compound this step's input IS, when it is one. When set it must
   *  resolve — `pathway.step-from-slug` errors otherwise. Absent means "this
   *  endpoint is not a registry compound", which is the common case and NOT a
   *  defect. */
  from_slug?: Slug;
  /** The compound this step's output IS, when it is one. See `from_slug`. */
  to_slug?: Slug;
  /** The catalyst as free text — most enzymes are not registered compounds. */
  via?: string;
  /** The catalyst when it IS a registry compound. Must resolve when present. */
  via_slug?: Slug;
  note?: string;
  source_pmid?: string;
  /** Recon3D reaction IDs (BiGG-style, e.g. "HEX1", "PGI") implementing this
   *  step. Plural because an authored step is often coarser-grained than a
   *  Recon3D reaction and collapses two or three of them. */
  recon3d_reaction_ids?: string[];
}

/**
 * A compound that modulates the pathway. Distinct from `Compound.interactions`,
 * which is one-perpetrator-one-victim: a modulator points at the whole pathway.
 */
export interface PathwayModulator {
  slug: Slug;
  effect: 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
  target?: string;
  /** Explicit step pin — an index into `steps[]`. The authoring escape hatch for
   *  cases a text matcher cannot reach: receptor-pharmacology pathways name
   *  subtypes ("β1 + β2", "BZD site") in `target` that do not string-match the
   *  step's `via`. `pathway.modulator-step` checks it is in range. */
  step?: number;
  note?: string;
  /** Citation for THIS modulator claim — compound × effect × target — as
   *  distinct from the pathway's `refs[]`, which answers "where does the whole
   *  pathway come from?". Load-bearing on phenomenon pathways where the
   *  modulator IS the thing being explained (β-alanine at MrgprD). */
  source_pmid?: string;
}

export type PathwayNodeKind = 'input' | 'signal' | 'hub' | 'effector' | 'outcome' | 'crosstalk';

export interface PathwayNodeDetails {
  /** One-line summary. */
  role: string;
  /** Longer mechanism prose. */
  function: string;
  /** Disease / clinical bullets. */
  clinical?: string[];
  /** Free-form drug-target names. */
  targets?: string[];
}

export interface PathwayDiagramNode {
  id: string;
  label: string;
  sub?: string;
  kind: PathwayNodeKind;
  /** Layout layer: 0..N top-down, or 'crosstalk' for a side satellite. */
  layer?: number | 'crosstalk';
  /** Design-canvas centre coordinates and box size; auto-laid-out when absent.
   *  The canvas is 1500 × 1060, which is what `pathway.diagram-coord` checks. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  details?: PathwayNodeDetails;
}

export interface PathwayDiagramEdge {
  from: string;
  to: string;
  /** Short via-prose, shown mid-edge. */
  label?: string;
  /** Enzyme chip mid-edge, e.g. "PIK3CA (p110α)". */
  enzyme?: string;
  role?: 'signal' | 'regulatory' | 'transport' | 'neutral';
  /** Cellular compartment. */
  location?: string;
  /** A BARE PMID, not the "PMID:n" form used elsewhere. The difference is why
   *  twenty citations on the PI3K/Akt diagram went unverified for a year — see
   *  `citationsIn`, which accepts both. */
  pmid?: string;
  rateLimiting?: boolean;
  crosstalk?: boolean;
}

export interface PathwayDiagramChip {
  id: string;
  /** Node id this chip docks to. */
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

/**
 * Authored, hand-tuned graph for a pathway diagram. The single source of truth
 * when present; when absent — the vast majority of pathways — a consumer
 * projects `steps` into a graph and auto-lays it out. Purely presentational: the
 * step list and modulator matching still read `steps` / `modulators`.
 */
export interface PathwayDiagram {
  nodes: PathwayDiagramNode[];
  edges: PathwayDiagramEdge[];
  chips?: PathwayDiagramChip[];
  /** A single negative-feedback arc (e.g. mTORC1 → IRS-1). */
  feedback?: PathwayDiagramFeedback;
}

export interface Pathway {
  slug: string;
  name: string;
  /** Secondary descriptor pulled out of the formal `name` so the title stays
   *  short — the specific actors / subtypes / scope that used to live in the
   *  name's trailing parenthetical: name "Bone remodeling" + subtitle
   *  "RANK/RANKL/OPG + PTH/Wnt-sclerostin + bisphosphonates". */
  subtitle?: string;
  /**
   * Short, plain-language hook for the USER-FELT phenomenon this pathway
   * explains, kept separate from the formal `name` so the title stays scientific
   * while the searchable hook stays colloquial: "the tingle" (β-alanine at
   * MrgprD), "the flush" (niacin at GPR109A), "neon-yellow pee" (riboflavin),
   * "skipped beats" (caffeine at A1).
   *
   * Only set on phenomenon-pathways that anchor a specific observable; ordinary
   * biosynthesis and signaling pathways leave it blank.
   */
  sensation?: string;
  category: PathwayCategory;
  systems: SystemId[];
  /** Therapeutic / clinical domains. Orthogonal to category and systems. */
  domains?: PathwayDomain[];
  description: string;
  steps: PathwayStep[];
  modulators?: PathwayModulator[];
  refs: string[];
  /** Canonical Recon3D subsystem name, when the pathway aligns with one of the
   *  111 metabolic subsystems in Brunk 2018 (PMID:29457794). Undefined for
   *  signaling / endocrine-axis / hemostasis pathways that do not map onto
   *  Recon3D's metabolism focus. */
  recon3d_subsystem?: string;
  diagram?: PathwayDiagram;
}

// ─────────────────────────────────────────────────────────────────────────────
// Receptor / target catalog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A receptor in the GPCR reference catalog, from IUPHAR/BPS Guide to
 * PHARMACOLOGY. This is reference NOMENCLATURE — name / family / gene — not a
 * pharmacodynamic measurement; `ReceptorSite` is the per-compound authored Hill
 * curve.
 */
export interface ReceptorCatalogEntry {
  /** Canonical key — the HGNC gene symbol when known (e.g. "HTR2A"), else
   *  `gtp<id>`. Note this is NOT the pharmacological shorthand
   *  `receptor_occupancy[].receptor` uses ("5-HT2A"), which is why
   *  `receptor.unknown-target` has anything to report. */
  key: string;
  /** Display name, e.g. "5-HT2A receptor". */
  name: string;
  /** IUPHAR family / grouping, e.g. "5-Hydroxytryptamine receptors". */
  family: string;
  /** HGNC gene symbol; null for orphan / non-human entries. */
  gene: string | null;
  /** HGNC descriptive name — the identity / function line. */
  full_name: string;
  /** GtoPdb target id — the provenance anchor back to the source record. */
  gtp_id: number;
}

/** Target class for a non-GPCR target. */
export type TargetClass =
  | 'enzyme'
  | 'transporter'
  | 'ion_channel'
  | 'nuclear_receptor'
  | 'catalytic_receptor'
  | 'immune'
  | 'other';

/**
 * Reference entry for a NON-GPCR target (enzyme, transporter, ion channel,
 * nuclear receptor, cytokine). The GPCR catalog is GtoPdb GPCRs only; these are
 * the other classes that `receptor_occupancy[]` binds, given the same
 * nomenclature treatment so an authored key resolves to real metadata rather
 * than staying a bare string.
 *
 * Keyed by the authored OCCUPANCY KEY ("cox_1", "SERT", "nav1_5") — which is the
 * treatment the GPCR half has not had. A small curated supplement covers ligand
 * and subunit targets GtoPdb does not enumerate as target rows (cytokines, the
 * Ca-channel α2δ subunit, IgE); those carry gtp_id 0, so the id is NOT positive
 * here the way it is for a GPCR.
 */
export interface NonGpcrTarget {
  key: string;
  name: string;
  family: string;
  gene: string | null;
  full_name: string;
  class: TargetClass;
  gtp_id: number;
}

export interface ReceptorCatalog {
  meta: { source: string; url: string; version: string; fetched: string; note?: string };
  receptors: ReceptorCatalogEntry[];
  nonGpcrTargets: NonGpcrTarget[];
}

/** The whole registry, as every gate and every consumer sees it. */
export interface Registry {
  compounds: Compound[];
  pathways: Pathway[];
  receptors: ReceptorCatalog;
}
