/**
 * Loader — pulls JSON files from data/ and validates them against the core
 * Compound + Pathway schemas. Throws loud on bad data so a typo in seed
 * never reaches the UI silently.
 */

import { z } from 'zod';
import type {
  Compound,
  FoodPreset,
  NonGpcrTarget,
  Pathway,
  ReceptorCatalogEntry,
} from '@xeno/core';

// Re-derive the Compound schema here. We could push this into @xeno/core,
// but Compound is registry-side data — keeping its validator local means
// op payloads (which DO need cross-tier sharing) stay the only thing in
// core/schemas.ts.

const route = z.enum(['PO', 'SL', 'IM', 'IV', 'SC', 'IN', 'TD', 'INH', 'PR']);
const doseRange = z.object({
  min: z.number().nonnegative(),
  max: z.number().positive(),
  typical: z.number().positive(),
  // REQUIRED. It was optional and 130 rows omitted it; consumers defaulted to
  // 'mg', which happened to be right for every one of them (checked against
  // every row where a different unit would have been plausible) — but a silent
  // default on a dose is a hundred- or thousandfold error waiting to happen.
  unit: z.enum(['mg', 'g', 'mcg', 'IU']),
});

// Species a value was measured in; omitted means human. Animal-derived PK is
// permitted in this registry, but it has to say so — an unlabelled rat
// half-life renders exactly like a human one. Kept in step with
// SourceSpecies in @xeno/core.
const sourceSpecies = z.enum([
  'rat',
  'mouse',
  'dog',
  'pig',
  'sheep',
  'rabbit',
  'monkey',
  'horse',
  'cow',
]);

const routePk = z.object({
  ka_hr: z.number().positive().optional(),
  ke_hr: z.number().positive().optional(),
  V_L: z.number().positive().optional(),
  F: z.number().min(0).max(1).optional(),
  alpha_hr: z.number().positive().optional(),
  beta_hr: z.number().positive().optional(),
  k21_hr: z.number().positive().optional(),
  // MM (saturable) elimination — fires when both fields set; solver
  // falls through to first-order ke otherwise. ROADMAP Wave 4a will
  // author these for phenytoin / ethanol / salicylates.
  mm_vmax_per_hr: z.number().positive().optional(),
  mm_km_mg_per_l: z.number().positive().optional(),
  // Parallel non-saturable pathway (1/hr) running alongside the MM one — e.g.
  // acetaminophen glucuronidation beside saturable sulfation. See PkParams.
  mm_linear_ke_hr: z.number().positive().optional(),
  // Zero-order absorption (transdermal patch / depot): F·dose enters at a
  // constant rate over zo_dur_hr instead of first-order ka. Optional lag_hr
  // delays the start (depot release lag). Engages the zero-order solver path.
  zo_dur_hr: z.number().positive().optional(),
  lag_hr: z.number().positive().optional(),
  source_pmid: z
    .string()
    .regex(/^PMID:\d+$/)
    .optional(),
  // Non-PubMed primary provenance (regulatory label / monograph). Either this
  // or source_pmid should be present on any route carrying params — see
  // RoutePk.source_label. Length-capped so a whole label section can't be
  // pasted in and blow up the bundle.
  source_label: z.string().min(1).max(300).optional(),
  // Non-human species this route's params came from. See RoutePk.source_species.
  source_species: sourceSpecies.optional(),
});

const interactionLevel = z.enum([
  'synergistic',
  'beneficial',
  'caution',
  'warn',
  'major',
  'contraindicated',
]);

// Per-edge kinetic interaction parameters. When present, the solver
// modulates the victim's PK in proportion to the perpetrator's plasma
// (see InteractionKinetics in @xeno/core). All fields optional; only
// the ones authored fire in the math.
const interactionKinetics = z.object({
  ki_uM: z.number().positive().optional(),
  // What ki_uM is: absent == 'in_vitro' (a published affinity). See
  // InteractionKinetics.ki_basis — 'calibrated_from_auc' means the number was
  // inverted out of a clinical AUC fold-change and is not a measurement.
  ki_basis: z.enum(['in_vitro', 'calibrated_from_auc']).optional(),
  auc_ratio: z.number().gt(1).optional(),
  assumed_perp_uM: z.number().positive().optional(),
  induction_factor: z.number().positive().optional(),
  plasma_binding_displacement: z.number().optional(),
  // Mechanism-based inhibition marker (persists past perpetrator clearance via
  // enzyme turnover). Qualitative; pairs with ki_uM. See InteractionKinetics.
  mbi: z.boolean().optional(),
});

const interactionRef = z.object({
  slug: z.string().min(1).max(80), // looser than compound slug — v7 carries names of off-registry compounds (Adenosine, etc.)
  name: z.string().min(1).max(120),
  level: interactionLevel,
  note: z.string().min(1).max(500),
  timing: z.string().max(120).optional(),
  kinetics: interactionKinetics.optional(),
  source_pmid: z
    .string()
    .regex(/^PMID:\d+$/)
    .optional(),
});

const effectCompartment = z.object({
  keo_per_h: z.number().positive(),
  source_pmid: z
    .string()
    .regex(/^PMID:\d+$/)
    .optional(),
  // Marks keo as a reasoned estimate rather than a published model fit, so
  // surfaces can label it instead of showing an unexplained blank source.
  // See EffectCompartment.approximated.
  approximated: z.boolean().optional(),
  // Non-human species the keo was fitted in. See EffectCompartment.source_species.
  source_species: sourceSpecies.optional(),
  note: z.string().max(500).optional(),
});

const receptorSite = z.object({
  receptor: z.string().min(1).max(80),
  pathway: z.string().max(80).optional(),
  emax: z.number().min(0).max(1),
  ec50_mg_l: z.number().positive(),
  hill_n: z.number().positive(),
  action: z
    .enum([
      'agonist',
      'partial_agonist',
      'inverse_agonist',
      'antagonist',
      'inhibitor',
      'blocker',
      'neutralizer',
      'pam',
      'nam',
      'substrate',
      'modulator',
      'unknown',
    ])
    .optional(),
  source_pmid: z
    .string()
    .regex(/^PMID:\d+$/)
    .optional(),
  // Provenance prose — species / tissue / radioligand / verbatim quote, or
  // an "approximation" caveat. Authored on most rows; previously stripped at
  // load (schema omitted it) so surfaces never saw it. Kept so /library and
  // the receptors view can show the data-quality detail behind each value.
  note: z.string().max(600).optional(),
  // What ec50_mg_l is referenced to. Absent == 'in_vitro_ki', which is a FREE-
  // drug affinity and must be compared against Cp x fu rather than against the
  // total plasma curve. See Compound.fraction_unbound.
  basis: z.enum(['in_vitro_ki', 'in_vivo_plasma_ec50', 'whole_blood_ic50']).optional(),
});

const systemId = z.enum([
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
]);

export const compoundSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  category: z.enum([
    'stimulant',
    'nootropic',
    'mineral',
    'vitamin',
    'adaptogen',
    'amino-acid',
    'lipid',
    'hormone',
    'sleep',
    'alkaloid',
    'polyphenol',
    'metabolite',
    'neurotransmitter',
    'nucleotide',
    'nucleoside',
    'biologic',
    'peptide',
    'terpenoid',
    'flavonoid',
    'ketone',
    'pharmacological',
    'topical',
    // Dietary carbohydrates + sugar substitutes. 'sugar' = conventional
    // mono/disaccharides and carb mixtures; 'sweetener' = high-intensity
    // (synthetic + natural), polyols, and rare-sugar sugar substitutes.
    'sugar',
    'sweetener',
    'other',
  ]),
  systems: z.array(systemId).optional(),
  mechanism: z.string(),
  routes: z.array(route).min(1),
  doses: z.record(route, doseRange),
  half_life_hr: z.record(route, z.number().positive()).default({}),
  pk: z.record(route, routePk).optional(),
  effect_compartment: effectCompartment.optional(),
  receptor_occupancy: z.array(receptorSite).optional(),
  interactions: z.array(interactionRef).optional(),
  // Molecular weight in g/mol — needed for µM↔mg/L conversion when this
  // compound is the perpetrator of a kinetic interaction. data-lint
  // errors on a kinetics edge whose perpetrator lacks this.
  mw_g_mol: z.number().positive().optional(),
  // Fraction of the DOSED mass that is the species pk[] describes — for a
  // salt-form dose against free-base/ion PK. Absent means 1.0. See
  // Compound.dose_moiety_fraction; data-lint requires the note alongside it.
  dose_moiety_fraction: z.number().gt(0).max(1).optional(),
  dose_moiety_note: z.string().max(600).optional(),
  // Fraction unbound in plasma, (0, 1]. Absent means 1.0 (no correction), so a
  // record without it keeps its pre-correction occupancy curve.
  fraction_unbound: z.number().gt(0).max(1).optional(),
  // Provenance + caveats for fraction_unbound: the verbatim quote, species and
  // population, and any concentration-dependence or range limitation that makes
  // the scalar an approximation rather than a measurement.
  fu_note: z.string().max(600).optional(),
  // Which molecule pk[] / half_life_hr[] describe. Required in practice for any
  // compound that converts to an active species — data-lint warns
  // (pk.prodrug-analyte-unstated) when one is missing.
  pk_analyte: z
    .enum(['parent', 'active-metabolite', 'active-moiety', 'total-drug-related'])
    .optional(),
  pk_analyte_name: z.string().min(1).max(80).optional(),
  pk_unauthored: z
    .object({
      reason: z.enum([
        'local-acting',
        'research-only',
        'mixture',
        'homeostatic',
        'uncharacterized',
        'label-only',
      ]),
      note: z.string().max(500).optional(),
    })
    .optional(),
  // Composition for multi-constituent products (plant extracts, fixed-dose
  // combinations, mixed isomers). When present, the solver expands a dose of
  // the parent into per-constituent doses at solve time. The parent itself
  // usually carries pk_unauthored: { reason: 'mixture' } since there's no
  // meaningful single-species PK for the extract as a whole.
  composition: z
    .object({
      standardization: z.string().max(200).optional(),
      constituents: z
        .array(
          z.object({
            slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
            mg_per_g_extract: z.number().positive(),
            note: z.string().max(300).optional(),
            source_pmid: z.string().optional(),
          }),
        )
        .min(1),
    })
    .optional(),
  // Active metabolites formed in vivo (parent → metabolite). fraction is the
  // molar fraction of the parent's elimination forming each. See Compound.metabolites.
  metabolites: z
    .array(
      z.object({
        slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
        fraction: z.number().positive().max(1),
        note: z.string().max(300).optional(),
        source_pmid: z.string().optional(),
      }),
    )
    .min(1)
    .optional(),
  // Nutritional dosing model — drives Today's "Daily intake" card. RDI is
  // the recommended daily intake; UL the tolerable upper limit (optional).
  // Authored only for compounds where cumulative intake is the right axis
  // (minerals, fat-soluble vitamins, essential cofactors) — most
  // psychoactives leave this empty.
  nutrition: z
    .object({
      rdi: z.number().positive(),
      ul: z.number().positive().optional(),
      unit: z.enum(['mg', 'mcg', 'IU', 'g']),
      source_pmid: z.string().optional(),
      note: z.string().max(300).optional(),
    })
    .optional(),
  notes: z.string().optional(),
  refs: z.array(z.string()).default([]),
  // Cross-reference to the BiGG metabolite ID in Recon3D (e.g. "atp",
  // "glc__D", "5htrp"). Lets the v8 compound page link to the matching
  // metabolite node in vmh.life. NOT a slug — BiGG IDs use underscores
  // and double underscores for compartment qualifiers per the BiGG
  // namespace convention.
  recon3d_metabolite_id: z.string().max(40).optional(),
  // Cross-reference to the HGNC gene symbol when this "compound" entry
  // actually represents an enzyme protein (e.g. "TPH2", "DBH"). Recon3D
  // gene IDs follow the Entrez integer convention; we store the HGNC
  // symbol because it's more stable for cross-references.
  recon3d_gene_symbol: z.string().max(40).optional(),
  // Slugs merged into this compound and retired. Lookups resolve through
  // these so intakes logged under the old slug keep working — see
  // Compound.retired_slugs.
  retired_slugs: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/)).optional(),
});

export type RegistrySource = Record<string, unknown>[];

/**
 * Load a registry from raw JSON records.
 *
 * The app passes whatever it imports (Vite glob, fetch, fs, etc.) — this
 * function only cares that each record validates and slugs are unique.
 */
export function loadRegistry(records: RegistrySource): Compound[] {
  const out: Compound[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    const parsed = compoundSchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(
        `[registry] invalid compound:\n${JSON.stringify(r, null, 2)}\n` +
          parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n'),
      );
    }
    if (seen.has(parsed.data.slug)) {
      throw new Error(`[registry] duplicate slug: ${parsed.data.slug}`);
    }
    seen.add(parsed.data.slug);
    out.push(parsed.data as Compound);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// ─────────────────────────────────────────────────────────────────────────────
// FoodPreset shape (v12 ships no curated catalog; these are FDC-derived and
// user-authored foods — the schema is unchanged, captured from USDA
// FDC / labels at dev-time so logging a common food costs no API calls). This
// loader checks SHAPE + slug-uniqueness; the referential gate (every
// items[].compound ∈ the compound registry) lives in scripts/data-lint.ts,
// which has both registries loaded.
// ─────────────────────────────────────────────────────────────────────────────

const foodSlug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/);

export const foodCategorySchema = z.enum([
  'fast_food',
  'energy_drink',
  'soda',
  'sports_drink',
  'coffee_tea',
  'juice',
  'snack',
  'supplement',
  'alcohol',
  'electrolyte',
  'produce',
  'protein',
  'grain',
  'meat_seafood',
  'dairy',
  'condiment',
  'other',
]);

const foodPresetItem = z.object({
  compound: foodSlug,
  label: z.string().min(1).max(80).optional(),
  dose: z.number().positive(),
  dose_unit: z.enum(['mg', 'g', 'mcg', 'IU']),
  // Optional per-item route (default PO at fire time) — buccal/sublingual
  // delivery like nicotine gum models with mucosal PK instead of oral-swallow.
  route: route.optional(),
});

/** One selectable build-your-own ingredient. `items` may be empty — a pick
 *  with no trackable compounds (plain lettuce) still labels the log. */
const foodPresetOptionChoice = z.object({
  label: z.string().min(1).max(60),
  default: z.boolean().optional(),
  items: z.array(foodPresetItem).max(128), // FDC-enriched ingredient panels reach ~70 compounds (SR Legacy produce is the deepest)
});

/** A pick-one / pick-many ingredient group on a configurable preset. */
const foodPresetOptionGroup = z
  .object({
    name: z.string().min(1).max(40),
    pick: z.enum(['one', 'many']),
    choices: z.array(foodPresetOptionChoice).min(2).max(16),
  })
  .superRefine((g, ctx) => {
    if (g.pick === 'one' && g.choices.filter((c) => c.default).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['choices'],
        message: `pick-one group "${g.name}" marks more than one default choice`,
      });
    }
  });

export const foodPresetSchema = z
  .object({
    slug: foodSlug,
    name: z.string().min(1).max(120),
    category: foodCategorySchema,
    /** Subcategory chain below the category; arbitrary depth, capped to keep the
     *  tree (and its indentation) sane. */
    path: z.array(z.string().min(1).max(60)).max(5).optional(),
    serving: z.string().min(1).max(80),
    /** Alternate selectable serving sizes (from FDC foodPortions); each `scale`
     *  multiplies the base `items` doses. Base serving is the implicit ×1 option. */
    serving_options: z
      .array(
        z.object({
          label: z.string().min(1).max(40),
          scale: z.number().positive(),
        }),
      )
      .max(8)
      .optional(),
    /** Cosmetic flavor variants sharing this preset's compound profile (the
     *  compose flavor picker labels the intake; doses unchanged). */
    flavors: z.array(z.string().min(1).max(60)).max(64).optional(),
    /** Brand no longer sells it. Kept loggable (history references it) but
     *  demoted in search so it never reads as a current menu item. */
    retired: z.boolean().optional(),
    /** Build-your-own ingredient groups; each picked choice's items ADD to the
     *  base items. Presence of options is what licenses EMPTY base items. */
    options: z.array(foodPresetOptionGroup).max(8).optional(),
    items: z.array(foodPresetItem).max(128), // rich whole foods (SR Legacy panels + full FA breakdown) reach ~75 mapped nutrients; empty only with options (superRefine)
    source: z.object({
      kind: z.enum(['fdc', 'label', 'manual', 'community']),
      fdc_id: z.number().int().positive().optional(),
      source_url: z.string().url().max(500).optional(),
      label_ref: z.string().min(1).max(200).optional(),
      captured_at: z.string().optional(),
    }),
  })
  .superRefine((f, ctx) => {
    // A fixed-recipe preset must carry at least one item; only a build-your-own
    // preset (options present) may start empty — its panel comes from the picks.
    if (f.items.length === 0 && !(f.options && f.options.length > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'Array must contain at least 1 element(s) (empty items allowed only with options)',
      });
    }
  });

export function loadFoods(records: RegistrySource): FoodPreset[] {
  const out: FoodPreset[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    const parsed = foodPresetSchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(
        `[registry] invalid food preset:\n${JSON.stringify(r, null, 2)}\n` +
          parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n'),
      );
    }
    if (seen.has(parsed.data.slug)) {
      throw new Error(`[registry] duplicate food slug: ${parsed.data.slug}`);
    }
    seen.add(parsed.data.slug);
    out.push(parsed.data as FoodPreset);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// ─────────────────────────────────────────────────────────────────────────────
// Receptor catalog (GPCR reference — data/receptors.json, generated by
// scripts/build-receptor-catalog.ts from IUPHAR/BPS Guide to PHARMACOLOGY)
// ─────────────────────────────────────────────────────────────────────────────

const receptorCatalogEntry = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  family: z.string().min(1),
  gene: z.string().nullable(),
  full_name: z.string(),
  gtp_id: z.number().int().positive(),
});

const nonGpcrTarget = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  family: z.string().min(1),
  gene: z.string().nullable(),
  full_name: z.string(),
  class: z.enum([
    'enzyme',
    'transporter',
    'ion_channel',
    'nuclear_receptor',
    'catalytic_receptor',
    'immune',
    'other',
  ]),
  gtp_id: z.number().int().min(0),
});

const receptorCatalogDoc = z.object({
  meta: z.object({
    source: z.string(),
    url: z.string(),
    version: z.string(),
    fetched: z.string(),
    note: z.string().optional(),
  }),
  receptors: z.array(receptorCatalogEntry),
  // Non-GPCR authored targets (enzymes, transporters, ion channels, nuclear
  // receptors, immune) — keyed by occupancy key. Optional for back-compat.
  nonGpcrTargets: z.array(nonGpcrTarget).optional(),
});

export interface ReceptorCatalog {
  meta: { source: string; url: string; version: string; fetched: string; note?: string };
  receptors: ReceptorCatalogEntry[];
  nonGpcrTargets: NonGpcrTarget[];
}

/** Load + validate the receptor reference catalog. Unlike compounds, this is
 *  a single document with a `meta` provenance block and a `receptors` array. */
export function loadReceptors(doc: unknown): ReceptorCatalog {
  const parsed = receptorCatalogDoc.safeParse(doc);
  if (!parsed.success) {
    throw new Error(
      `[registry] invalid receptors.json:\n` +
        parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }
  return {
    ...parsed.data,
    nonGpcrTargets: (parsed.data.nonGpcrTargets ?? []) as NonGpcrTarget[],
  } as ReceptorCatalog;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pathway schema (v1.2 Wave 5a)
// ─────────────────────────────────────────────────────────────────────────────

const pathwayCategory = z.enum([
  'biosynthesis',
  'catabolism',
  'drug_metabolism',
  'signaling', // general signal-transduction cascades
  'receptor_pharmacology', // specific-receptor pharmacology (opioid, GABA-A, …)
  'transport',
  'membrane', // ion channels, membrane-lipid composition
  'endocrine_axis',
  'immune_innate', // innate immunity (TLR, cGAS-STING, NLRP3, complement, …)
  'cell_death', // apoptosis / ferroptosis / pyroptosis / necroptosis / senescence / autophagy
  'disease_cascade', // chronic-disease progression models (AD, PD, atherosclerosis, …)
]);

/**
 * Therapeutic / clinical domain — the third orthogonal axis on a
 * pathway, alongside `category` (mechanism) and `systems` (organ
 * system). Answers "which medical area cares about this pathway?".
 * A pathway can belong to several (e.g. atherosclerosis = cardiometabolic
 * + immune_inflammation). Optional — leaves rare pathways untagged
 * when no domain dominates.
 */
const pathwayDomain = z.enum([
  'metabolic', // energy + nutrition + mineral + diabetes (non-CV)
  'cardiometabolic', // lipid + atherosclerosis + hemostasis + BP
  'neuropsychiatric', // CNS pharmacology, mood, cognition, sleep, addiction
  'pain_analgesia', // opioid, NSAID, neuropathic, migraine
  'endocrine_reproductive', // hormones, sex steroids, bone-Ca-Pi, fertility
  'immune_inflammation', // innate + adaptive immunity, autoimmunity, allergy
  'infectious_disease', // antibacterial, antifungal, antiviral, antiparasitic
  'oncology', // cancer biology, chemotherapy mechanisms
  'dermatology', // skin-specific pharmacology
  'gi_hepatic', // GI motility/secretion, liver, microbiome
  'respiratory', // asthma, COPD, allergy-pulm
  'aging_regenerative', // senescence, telomere, mitophagy, wound healing
]);

// `from` / `to` reference compound slugs but allow free-text fallback for
// biochemistry intermediates that aren't dosable drugs (paraxanthine,
// glucose-6-phosphate, etc.). data-lint surfaces cross-reference warnings
// when these don't resolve to a compound — soft check, not a hard error.
const pathwayStep = z.object({
  // from/to are FREE TEXT: most endpoints are processes and states, not
  // molecules. from_slug/to_slug carry the checkable compound claim, mirroring
  // the via/via_slug split directly below.
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
  from_slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,63}$/)
    .optional(),
  to_slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,63}$/)
    .optional(),
  via: z.string().max(120).optional(),
  via_slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,63}$/)
    .optional(),
  note: z.string().max(500).optional(),
  source_pmid: z
    .string()
    .regex(/^PMID:\d+$/)
    .optional(),
  // Cross-reference to specific Recon3D reaction IDs (BiGG identifiers,
  // e.g. "HEX1", "PGI", "FBA"). Lets us bidirectionally navigate from a
  // v8 step to the matching Recon3D reaction(s) in the metabolic model.
  recon3d_reaction_ids: z.array(z.string().min(1).max(40)).optional(),
});

const pathwayModulator = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
  effect: z.enum(['inhibitor', 'activator', 'substrate', 'cofactor']),
  target: z.string().max(120).optional(),
  // Explicit step pin (index into steps[]) — authoring override for the
  // matcher when the target text can't reach the right step. Range is
  // checked against steps.length by the data lint (zod can't see it here).
  step: z.number().int().nonnegative().optional(),
  note: z.string().max(500).optional(),
  // Per-modulator citation for the specific claim (compound × effect ×
  // target). Same shape as pathwayStep.source_pmid. Optional because
  // most modulators are documented via the pathway-level refs[]; only
  // load-bearing claims (e.g. the perpetrator in a phenomenon pathway)
  // need a per-row pin.
  source_pmid: z
    .string()
    .regex(/^PMID:\d+$/)
    .optional(),
});

// ── Optional authored diagram overlay (mirrors @xeno/core PathwayDiagram) ──
// Coordinates on a 1500 × 1060 design canvas. Only flagship pathways carry
// this; the rest derive a graph from `steps` + auto-layout at runtime.
const pathwayNodeDetails = z.object({
  role: z.string().min(1).max(300),
  function: z.string().min(1).max(2000),
  clinical: z.array(z.string().min(1).max(300)).max(12).optional(),
  targets: z.array(z.string().min(1).max(80)).max(24).optional(),
});
const pathwayDiagramNode = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  sub: z.string().max(200).optional(),
  kind: z.enum(['input', 'signal', 'hub', 'effector', 'outcome', 'crosstalk']),
  layer: z.union([z.number().int(), z.literal('crosstalk')]).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  w: z.number().positive().optional(),
  h: z.number().positive().optional(),
  details: pathwayNodeDetails.optional(),
});
const pathwayDiagramEdge = z.object({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  label: z.string().max(200).optional(),
  enzyme: z.string().max(120).optional(),
  role: z.enum(['signal', 'regulatory', 'transport', 'neutral']).optional(),
  location: z.string().max(120).optional(),
  pmid: z.string().regex(/^\d+$/).optional(),
  rateLimiting: z.boolean().optional(),
  crosstalk: z.boolean().optional(),
});
const pathwayDiagramChip = z.object({
  id: z.string().min(1).max(64),
  target: z.string().min(1).max(64),
  side: z.enum(['left', 'right', 'below']),
  label: z.string().min(1).max(120),
  sub: z.string().max(200).optional(),
  kind: z.enum(['native-inhibitor', 'enzyme', 'drug-inhibitor', 'drug-activator']),
  x: z.number().optional(),
  y: z.number().optional(),
  landingDx: z.number().optional(),
});
const pathwayDiagramFeedback = z.object({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  pmid: z.string().regex(/^\d+$/).optional(),
});
const pathwayDiagram = z.object({
  nodes: z.array(pathwayDiagramNode).min(1),
  edges: z.array(pathwayDiagramEdge),
  chips: z.array(pathwayDiagramChip).optional(),
  feedback: pathwayDiagramFeedback.optional(),
});

export const pathwaySchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9_]{1,63}$/), // underscores ok in pathway slugs (matches existing receptor_occupancy.pathway tag conventions like "beta1_blockade")
  name: z.string().min(1).max(120),
  // Secondary title descriptor (the actors / subtypes / scope split out of
  // the name's trailing parenthetical or em-dash clause). Optional.
  subtitle: z.string().min(1).max(160).optional(),
  category: pathwayCategory,
  systems: z.array(systemId).min(1),
  /** Therapeutic / clinical domains the pathway belongs to. Optional;
   *  pathways without a dominant clinical home stay untagged. Multiple
   *  values allowed (e.g. atherosclerosis = cardiometabolic + immune_inflammation). */
  domains: z.array(pathwayDomain).optional(),
  description: z.string().min(1).max(3000),
  steps: z.array(pathwayStep).min(1),
  modulators: z.array(pathwayModulator).optional(),
  refs: z.array(z.string()).default([]),
  // v1.2 ETL: canonical Recon3D subsystem name when this pathway aligns
  // with one of the 111 subsystems in Brunk 2018 (PMID:29457794).
  recon3d_subsystem: z.string().max(120).optional(),
  // Optional authored DAG-diagram overlay (see @xeno/core PathwayDiagram).
  // Cross-references (node ids on edges/chips/feedback) are validated by
  // data-lint, which sees the whole graph; zod only shape-checks here.
  diagram: pathwayDiagram.optional(),
});

/**
 * Load + validate pathway records. Mirrors loadRegistry's pattern —
 * slug uniqueness enforced, alpha-sorted output. Cross-referenced
 * compound slugs (steps[].from/to/via_slug, modulators[].slug) are
 * NOT checked here — that's data-lint's job, where it has access to
 * the compound set.
 */
export function loadPathways(records: RegistrySource): Pathway[] {
  const out: Pathway[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    const parsed = pathwaySchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(
        `[registry] invalid pathway:\n${JSON.stringify(r, null, 2)}\n` +
          parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n'),
      );
    }
    if (seen.has(parsed.data.slug)) {
      throw new Error(`[registry] duplicate pathway slug: ${parsed.data.slug}`);
    }
    seen.add(parsed.data.slug);
    out.push(parsed.data as Pathway);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
