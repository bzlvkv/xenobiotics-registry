/**
 * schema.ts — zod mirrors of `types.ts`, and the registry's only structural gate.
 *
 * EVERY OBJECT IS STRICT: A KEY THIS FILE DOES NOT DECLARE FAILS THE LOAD. zod's
 * default is to strip unknown keys, and under that default a field that exists
 * in the JSON but not here does not exist for any consumer: nothing throws,
 * nothing warns, the value is simply gone. Two fields were lost that way before
 * anyone noticed, `receptor_occupancy[].note` (the provenance prose behind every
 * affinity) and `pk[route].note`. Stripping also meant a misspelled key passed
 * the gate: `sourse_pmid` on a PK block validated clean, and the record rendered
 * as uncited. For a registry that AI agents extend, a typo that passes silently
 * is the worst failure available, so `z.strictObject` is used throughout and
 * `test/no-field-loss.test.ts` stays as a second guard over the real data.
 *
 * So: when you add a field to the data, add it HERE in the same change. A field
 * that is not here is rejected, not ignored.
 *
 * String caps are all above the longest value in the catalog rather than snug
 * against it, because a cap that trips on legitimate prose teaches an author to
 * shorten the explanation instead of writing it.
 */

import { z } from 'zod';

const pmid = z
  .string()
  .regex(/^PMID:\d+$/)
  .optional();

/** One `refs[]` entry. Shape-checked because `pnpm verify` only resolves ids it
 *  can parse: a ref written as a bare number or a typo'd prefix was skipped by
 *  every gate, so a fabricated one would have passed them all. */
const pmidRef = z.string().regex(/^PMID:\d+$/, 'must be "PMID:" followed by digits');

const compoundSlug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/);

const route = z.enum(['PO', 'SL', 'IM', 'IV', 'SC', 'IN', 'TD', 'INH', 'PR']);

const doseRange = z.strictObject({
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
// permitted in this registry, but it has to say so — an unlabelled rat half-life
// renders exactly like a human one.
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

const routePk = z.strictObject({
  ka_hr: z.number().positive().optional(),
  ke_hr: z.number().positive().optional(),
  V_L: z.number().positive().optional(),
  F: z.number().min(0).max(1).optional(),
  alpha_hr: z.number().positive().optional(),
  beta_hr: z.number().positive().optional(),
  k21_hr: z.number().positive().optional(),
  // MM (saturable) elimination — meaningful only when both fields are set.
  mm_vmax_per_hr: z.number().positive().optional(),
  mm_km_mg_per_l: z.number().positive().optional(),
  // Parallel non-saturable pathway (1/hr) running alongside the MM one.
  mm_linear_ke_hr: z.number().positive().optional(),
  // Zero-order absorption (transdermal patch / depot): F·dose enters at a
  // constant rate over zo_dur_hr instead of first-order ka. Optional lag_hr
  // delays the start (depot release lag).
  zo_dur_hr: z.number().positive().optional(),
  lag_hr: z.number().positive().optional(),
  source_pmid: pmid,
  // Non-PubMed primary provenance (regulatory label / monograph). Either this or
  // source_pmid should be present on any route carrying params. Length-capped so
  // a whole label section cannot be pasted in.
  source_label: z.string().min(1).max(300).optional(),
  source_species: sourceSpecies.optional(),
  // Per-route provenance prose. Authored on five rows and NOT in the original
  // schema, so it was being stripped: the sentence explaining which value came
  // from the label rather than the primary was deleted at load, which made those
  // rows look like citation mismatches.
  note: z.string().max(800).optional(),
});

const interactionKinetics = z.strictObject({
  ki_uM: z.number().positive().optional(),
  // What ki_uM is: absent == 'in_vitro' (a published affinity).
  // 'calibrated_from_auc' means the number was inverted out of a clinical AUC
  // fold-change and is not a measurement.
  ki_basis: z.enum(['in_vitro', 'calibrated_from_auc']).optional(),
  auc_ratio: z.number().gt(1).optional(),
  assumed_perp_uM: z.number().positive().optional(),
  induction_factor: z.number().positive().optional(),
  plasma_binding_displacement: z.number().optional(),
  // Mechanism-based inhibition marker (persists past perpetrator clearance via
  // enzyme turnover). Qualitative; pairs with ki_uM.
  mbi: z.boolean().optional(),
});

const interactionRef = z.strictObject({
  // Looser than a registry slug on purpose — the catalog carries edges against
  // substances it does not yet catalog.
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  level: z.enum(['synergistic', 'beneficial', 'caution', 'warn', 'major', 'contraindicated']),
  note: z.string().min(1).max(500),
  timing: z.string().max(120).optional(),
  kinetics: interactionKinetics.optional(),
  source_pmid: pmid,
});

const effectCompartment = z.strictObject({
  keo_per_h: z.number().positive(),
  source_pmid: pmid,
  // Marks keo as a reasoned estimate rather than a published model fit, so
  // surfaces can label it instead of showing an unexplained blank source.
  approximated: z.boolean().optional(),
  source_species: sourceSpecies.optional(),
  note: z.string().max(600).optional(),
});

const receptorSite = z.strictObject({
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
  source_pmid: pmid,
  // Non-PubMed primary provenance (regulatory label / monograph), exactly as on
  // a pk route. For several modern agents the approved label is the ONLY public
  // document stating a receptor affinity at all: ziprasidone's 5-HT2A, 5-HT2C
  // and H1 constants are printed verbatim in GEODON section 12.2 and in no
  // fetchable paper. Length-capped so a label section cannot be pasted in.
  source_label: z.string().min(1).max(300).optional(),
  // Provenance prose — species / tissue / radioligand / verbatim quote, or an
  // "approximation" caveat. Authored on 321 of 325 rows and once omitted here,
  // which stripped it at load so no surface ever saw the data-quality detail
  // behind a number.
  note: z.string().max(600).optional(),
  // What ec50_mg_l is referenced to. Absent == 'in_vitro_ki', a FREE-drug
  // affinity that must be compared against Cp × fu rather than total plasma.
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

export const compoundSchema = z.strictObject({
  slug: compoundSlug,
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
    'sugar',
    'sweetener',
    'other',
  ]),
  systems: z.array(systemId).optional(),
  mechanism: z.string(),
  routes: z.array(route).min(1),
  // z.record with an enum key REJECTS an unlisted key rather than dropping it,
  // so a typo'd route ("OP" for "PO") fails the gate instead of vanishing.
  doses: z.record(route, doseRange),
  half_life_hr: z.record(route, z.number().positive()).default({}),
  pk: z.record(route, routePk).optional(),
  effect_compartment: effectCompartment.optional(),
  receptor_occupancy: z.array(receptorSite).optional(),
  interactions: z.array(interactionRef).optional(),
  mw_g_mol: z.number().positive().optional(),
  // Fraction of the DOSED mass that is the species pk[] describes — for a
  // salt-form dose against free-base/ion PK. Absent means 1.0; `dose.moiety-note`
  // requires the note alongside it.
  dose_moiety_fraction: z.number().gt(0).max(1).optional(),
  dose_moiety_note: z.string().max(600).optional(),
  // Milligrams per international unit, for a record whose doses[] are in IU.
  // An IU is a BIOLOGICAL potency unit and its mass equivalence is fixed by a
  // pharmacopoeial definition, per substance — 1 IU is 0.025 mcg of vitamin D3 and
  // 1 mg of dl-alpha-tocopheryl acetate, which are not the same kind of number at
  // all. So it cannot be a constant in the resolver and it cannot be inferred from
  // the molecular weight; it has to be stored per record, with the source that
  // states it, exactly as `dose_moiety_fraction` is.
  //
  // Without it an IU-dosed route renders nothing: `impliedExposure` refuses the dose
  // rather than guessing, which was right and is why 4 records with authored PK and
  // a cited half-life produced no curve at all.
  mg_per_iu: z.number().positive().optional(),
  iu_note: z.string().max(600).optional(),
  // Fraction unbound in plasma, (0, 1]. Absent means 1.0 (no correction), so a
  // record without it keeps its pre-correction occupancy curve.
  fraction_unbound: z.number().gt(0).max(1).optional(),
  fu_note: z.string().max(600).optional(),
  pk_analyte: z
    .enum(['parent', 'active-metabolite', 'active-moiety', 'total-drug-related'])
    .optional(),
  pk_analyte_name: z.string().min(1).max(80).optional(),
  pk_unauthored: z
    .strictObject({
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
  composition: z
    .strictObject({
      standardization: z.string().max(200).optional(),
      constituents: z
        .array(
          z.strictObject({
            slug: compoundSlug,
            mg_per_g_extract: z.number().positive(),
            note: z.string().max(300).optional(),
            source_pmid: pmid,
          }),
        )
        .min(1),
    })
    .optional(),
  nutrition: z
    .strictObject({
      rdi: z.number().positive(),
      ul: z.number().positive().optional(),
      unit: z.enum(['mg', 'mcg', 'IU', 'g']),
      source_pmid: pmid,
      note: z.string().max(300).optional(),
    })
    .optional(),
  notes: z.string().optional(),
  refs: z.array(pmidRef).default([]),
  // NOT a slug — BiGG IDs use underscores and double underscores for compartment
  // qualifiers per the BiGG namespace convention.
  recon3d_metabolite_id: z.string().max(40).optional(),
  retired_slugs: z.array(compoundSlug).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Pathways
// ─────────────────────────────────────────────────────────────────────────────

const pathwayCategory = z.enum([
  'biosynthesis',
  'catabolism',
  'drug_metabolism',
  'signaling',
  'receptor_pharmacology',
  'transport',
  'membrane',
  'endocrine_axis',
  'immune_innate',
  'cell_death',
  'disease_cascade',
]);

const pathwayDomain = z.enum([
  'metabolic',
  'cardiometabolic',
  'neuropsychiatric',
  'pain_analgesia',
  'endocrine_reproductive',
  'immune_inflammation',
  'infectious_disease',
  'oncology',
  'dermatology',
  'gi_hepatic',
  'respiratory',
  'aging_regenerative',
]);

// from/to are FREE TEXT: most endpoints are processes and states, not molecules.
// from_slug/to_slug carry the checkable compound claim, mirroring the via /
// via_slug split below. The length caps here are duplicated as lint ERRORS
// (`pathway.step-len`) because exceeding one makes the loader throw — a gate
// should say which field is too long before a consumer crashes on it.
const pathwayStep = z.strictObject({
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
  from_slug: compoundSlug.optional(),
  to_slug: compoundSlug.optional(),
  via: z.string().max(120).optional(),
  via_slug: compoundSlug.optional(),
  note: z.string().max(500).optional(),
  source_pmid: pmid,
  recon3d_reaction_ids: z.array(z.string().min(1).max(40)).optional(),
});

const pathwayModulator = z.strictObject({
  slug: compoundSlug,
  effect: z.enum(['inhibitor', 'activator', 'substrate', 'cofactor']),
  target: z.string().max(120).optional(),
  // Explicit step pin (index into steps[]). Range is checked by the lint, which
  // can see steps.length; zod cannot.
  step: z.number().int().nonnegative().optional(),
  note: z.string().max(500).optional(),
  source_pmid: pmid,
});

// ── Optional authored diagram overlay ────────────────────────────────────────
// Coordinates on a 1500 × 1060 design canvas. Only flagship pathways carry this;
// the rest derive a graph from `steps`. Node-id cross-references are checked by
// the lint, which sees the whole graph; zod only shape-checks here.
const pathwayNodeDetails = z.strictObject({
  role: z.string().min(1).max(300),
  function: z.string().min(1).max(2000),
  clinical: z.array(z.string().min(1).max(300)).max(12).optional(),
  targets: z.array(z.string().min(1).max(80)).max(24).optional(),
});

const pathwayDiagramNode = z.strictObject({
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

const pathwayDiagramEdge = z.strictObject({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  label: z.string().max(200).optional(),
  enzyme: z.string().max(120).optional(),
  role: z.enum(['signal', 'regulatory', 'transport', 'neutral']).optional(),
  location: z.string().max(120).optional(),
  // A BARE id here, unlike source_pmid's "PMID:n" — the catalog genuinely uses
  // both spellings and `citationsIn` accepts either.
  pmid: z.string().regex(/^\d+$/).optional(),
  rateLimiting: z.boolean().optional(),
  crosstalk: z.boolean().optional(),
});

const pathwayDiagramChip = z.strictObject({
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

const pathwayDiagramFeedback = z.strictObject({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  pmid: z.string().regex(/^\d+$/).optional(),
});

const pathwayDiagram = z.strictObject({
  nodes: z.array(pathwayDiagramNode).min(1),
  edges: z.array(pathwayDiagramEdge),
  chips: z.array(pathwayDiagramChip).optional(),
  feedback: pathwayDiagramFeedback.optional(),
});

export const pathwaySchema = z.strictObject({
  // Underscores are legal in a pathway slug and hyphens are not, which is the
  // opposite of a compound slug. That is deliberate: `receptor_occupancy[].pathway`
  // tags ("beta1_blockade") join onto these, and the two namespaces stay visibly
  // distinct.
  slug: z.string().regex(/^[a-z0-9][a-z0-9_]{1,63}$/),
  name: z.string().min(1).max(120),
  subtitle: z.string().min(1).max(160).optional(),
  // The colloquial hook for a phenomenon pathway ("the tingle", "skipped
  // beats"). Authored on 11 pathways and absent from the original schema, so it
  // was stripped at load: the one field written for a reader rather than a
  // curator never reached one.
  sensation: z.string().min(1).max(120).optional(),
  category: pathwayCategory,
  systems: z.array(systemId).min(1),
  domains: z.array(pathwayDomain).optional(),
  description: z.string().min(1).max(3000),
  steps: z.array(pathwayStep).min(1),
  modulators: z.array(pathwayModulator).optional(),
  refs: z.array(pmidRef).default([]),
  // Canonical Recon3D subsystem name when this pathway aligns with one of the
  // 111 subsystems in Brunk 2018 (PMID:29457794).
  recon3d_subsystem: z.string().max(120).optional(),
  diagram: pathwayDiagram.optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Receptor / target catalog
// ─────────────────────────────────────────────────────────────────────────────

const receptorCatalogEntry = z.strictObject({
  key: z.string().min(1),
  name: z.string().min(1),
  family: z.string().min(1),
  gene: z.string().nullable(),
  full_name: z.string(),
  gtp_id: z.number().int().positive(),
});

const nonGpcrTarget = z.strictObject({
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
  // 0 is legal here and not for a GPCR: the curated supplement covers targets
  // GtoPdb does not list as target rows, and they have no GtoPdb id to carry.
  gtp_id: z.number().int().min(0),
});

export const receptorCatalogSchema = z.strictObject({
  // The provenance block is not decoration — it is the only record of WHICH
  // release of GtoPdb the nomenclature came from, and nomenclature changes
  // between releases.
  meta: z.strictObject({
    source: z.string(),
    url: z.string(),
    version: z.string(),
    fetched: z.string(),
    note: z.string().optional(),
  }),
  receptors: z.array(receptorCatalogEntry),
  nonGpcrTargets: z.array(nonGpcrTarget).default([]),
});
