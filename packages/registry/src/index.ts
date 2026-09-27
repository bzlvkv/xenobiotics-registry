/**
 * @xeno/registry — the compounds, pathways and targets, the schema that admits
 * them, the queries over them, and the rules that decide whether they are good
 * enough to publish.
 *
 * BROWSER-SAFE BY CONSTRUCTION. Nothing reachable from this file imports
 * `node:fs` or anything else Node-only, so the thin web client imports the same
 * module a gate does and gets the same answers. Reading the JSON off disk lives
 * behind `@xeno/registry/read`, which is deliberately NOT re-exported here.
 */

// The shapes.
export type {
  Compound,
  Composition,
  CompoundCategory,
  DoseRange,
  DoseUnit,
  EffectCompartment,
  InteractionKinetics,
  InteractionRef,
  NonGpcrTarget,
  Nutrition,
  Pathway,
  PathwayCategory,
  PathwayDiagram,
  PathwayDiagramChip,
  PathwayDiagramEdge,
  PathwayDiagramFeedback,
  PathwayDiagramNode,
  PathwayDomain,
  PathwayModulator,
  PathwayNodeDetails,
  PathwayNodeKind,
  PathwayStep,
  ReceptorAction,
  ReceptorCatalog,
  ReceptorCatalogEntry,
  ReceptorSite,
  Registry,
  Route,
  RoutePk,
  Slug,
  SourceSpecies,
  SystemId,
  TargetClass,
} from './types';
export { SYSTEM_IDS, SYSTEM_META } from './types';

// The structural gate.
export { compoundSchema, pathwaySchema, receptorCatalogSchema } from './schema';
export { loadCompounds, loadPathways, loadReceptors, loadRegistry } from './load';

// The reads.
export {
  allCitations,
  allTargets,
  citationsIn,
  compoundIndex,
  compoundsForPathway,
  compoundsForTarget,
  coverage,
  findCompound,
  interactionsOf,
  pubmedUrl,
  searchCompounds,
  searchPathways,
  searchTargets,
} from './query';
export type { Citation, CoverageReport, ReceptorTarget } from './query';

// What a route's stored numbers imply, with every input labelled stored or default.
export { impliedExposure, PK_DEFAULTS } from './exposure';
export type { ExposureInput, ImpliedExposure, InputSource, NoExposure } from './exposure';

// The PD half of the same spot-check: what a record's affinity, keo and unbound
// fraction jointly imply. The first code here to apply the R13 free-drug correction.
export { impliedOccupancy, impliedOccupancies } from './occupancy';
export type { ImpliedOccupancy, NoOccupancy, OccupancyBasis } from './occupancy';

// The semantic gate.
export {
  OCCUPANCY_TARGET_KEYS,
  RECEPTOR_ALIASES,
  canonicalReceptor,
  lintRegistry,
  targetKeyFor,
} from './lint';
export type { Finding } from './lint';
export { LINT_RULES, STANDING_CAVEAT_RULES } from './rules';
export type { RuleInfo } from './rules';

// PubMed verdicts, without the fetching.
export {
  apiKeyParam,
  describePubmed,
  esummaryUrl,
  ESUMMARY_BATCH,
  ESUMMARY_URL,
  resolved,
} from './pubmed';
export type { EsummaryRecord, EsummaryResponse, PubmedDetail } from './pubmed';

// The one provenance claim a machine can check: a note's quote against its abstract.
export {
  citesFullText,
  efetchUrl,
  EFETCH_BATCH,
  EFETCH_URL,
  normalizeForMatch,
  quoteFound,
  quotesIn,
  verbatimClaimsWithOrphans,
  quotedClaimsIn,
  splitAbstracts,
  verbatimClaims,
} from './quotes';
export type { QuoteClaim, QuoteVerdict, OrphanQuote } from './quotes';
