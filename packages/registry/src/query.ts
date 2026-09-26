/**
 * query.ts — pure reads over a loaded Registry.
 *
 * Everything here is a function of its arguments with no cache and no module
 * state. The previous version of `bySlug` carried a WeakMap index keyed on array
 * identity, plus a length tag to survive an array that was filled in place after
 * export — machinery that existed because one consumer exported an empty array
 * and populated it later. Nothing does that now: the registry is loaded once and
 * handed over whole. A consumer that needs a hot point-lookup builds
 * `compoundIndex` once itself, which is both faster than the cache was and
 * visible in the calling code.
 */

import { targetKeyFor } from './lint';
import type {
  Compound,
  InteractionRef,
  Pathway,
  ReceptorCatalog,
  Registry,
  Slug,
  SystemId,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Lookup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a lookup keyed by every name a compound answers to: its canonical slug
 * plus any slug it absorbed in a merge.
 *
 * Canonical slugs are written LAST so that if a retired slug ever collides with a
 * live one, the LIVE record wins the key. `compound.retired-collision` rejects
 * that collision outright, so this is belt-and-braces ordering rather than an
 * expected case — but the failure it prevents (a live compound shadowed by
 * another's tombstone) would be completely silent.
 *
 * See `Compound.retired_slugs` for why forwarding is needed at all.
 */
export function compoundIndex(compounds: readonly Compound[]): Map<Slug, Compound> {
  const idx = new Map<Slug, Compound>();
  for (const c of compounds) {
    for (const retired of c.retired_slugs ?? []) idx.set(retired, c);
  }
  for (const c of compounds) idx.set(c.slug, c);
  return idx;
}

/** Resolve one slug to the compound that now owns it, following a retirement if
 *  there was one. Build the index once with `compoundIndex` when resolving many —
 *  this rebuilds it per call. */
export function findCompound(compounds: readonly Compound[], slug: Slug): Compound | undefined {
  return compoundIndex(compounds).get(slug);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Substring + alias search, case-insensitive.
 *
 * Ranked rather than alphabetical because typing "mag" should surface
 * "magnesium-*" before "ergothioneine" even though both contain the substring. An
 * exact alias hit outranks a name PREFIX hit: someone typing a brand or an old
 * name in full knows exactly what they want.
 */
export function searchCompounds(compounds: readonly Compound[], q: string, limit = 25): Compound[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return compounds.slice(0, limit);

  const scored: Array<{ c: Compound; score: number }> = [];
  for (const c of compounds) {
    const score = scoreCompound(c, needle);
    if (score > 0) scored.push({ c, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
    .slice(0, limit)
    .map((s) => s.c);
}

function scoreCompound(c: Compound, needle: string): number {
  const name = c.name.toLowerCase();
  const slug = c.slug.toLowerCase();
  if (name === needle || slug === needle) return 100;
  if (name.startsWith(needle) || slug.startsWith(needle)) return 60;
  for (const a of c.aliases) {
    const al = a.toLowerCase();
    if (al === needle) return 80;
    if (al.startsWith(needle)) return 50;
    if (al.includes(needle)) return 20;
  }
  if (name.includes(needle) || slug.includes(needle)) return 30;
  return 0;
}

/**
 * Pathway search over name, subtitle, sensation, slug and description.
 *
 * `sensation` is scored HIGH — above a description match and level with a
 * subtitle — because it is the one field written in the words a reader would
 * actually use. Someone searching "the tingle" or "skipped beats" is not going to
 * find `beta_alanine_mrgprd_paresthesia` any other way.
 */
export function searchPathways(pathways: readonly Pathway[], q: string, limit = 25): Pathway[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return pathways.slice(0, limit);

  const scored: Array<{ p: Pathway; score: number }> = [];
  for (const p of pathways) {
    const name = p.name.toLowerCase();
    const slug = p.slug.toLowerCase();
    let score = 0;
    if (name === needle || slug === needle) score = 100;
    else if (name.startsWith(needle)) score = 70;
    else if ((p.sensation ?? '').toLowerCase().includes(needle)) score = 60;
    else if ((p.subtitle ?? '').toLowerCase().includes(needle)) score = 55;
    else if (name.includes(needle) || slug.replace(/_/g, ' ').includes(needle)) score = 40;
    else if (p.description.toLowerCase().includes(needle)) score = 15;
    if (score > 0) scored.push({ p, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((s) => s.p);
}

/**
 * One row of the target catalog, GPCR or not, in a single shape.
 *
 * The catalog stores the two classes in separate arrays because they come from
 * different GtoPdb tables and only the non-GPCR half carries a `class`. Every
 * consumer wants one list, so flattening happens here rather than in each of
 * them — and `kind` keeps the distinction that the arrays were carrying.
 */
export interface ReceptorTarget {
  key: string;
  name: string;
  family?: string;
  gene?: string;
  full_name?: string;
  gtp_id?: number;
  class?: string;
  kind: 'gpcr' | 'non-gpcr';
}

/** Every catalogued target as one list, GPCRs first. */
export function allTargets(receptors: ReceptorCatalog): ReceptorTarget[] {
  const out: ReceptorTarget[] = [];
  for (const r of receptors.receptors) {
    out.push({
      key: r.key,
      name: r.name,
      family: r.family,
      // `gene` is nullable in the catalog (orphan and non-human entries) while
      // this shape uses absence for the same thing, so a consumer has one check
      // to make instead of two.
      ...(r.gene != null ? { gene: r.gene } : {}),
      full_name: r.full_name,
      gtp_id: r.gtp_id,
      kind: 'gpcr',
    });
  }
  for (const t of receptors.nonGpcrTargets) {
    out.push({
      key: t.key,
      name: t.name,
      family: t.family,
      ...(t.gene != null ? { gene: t.gene } : {}),
      full_name: t.full_name,
      gtp_id: t.gtp_id,
      class: t.class,
      kind: 'non-gpcr',
    });
  }
  return out;
}

/** Target search over key, name, gene, full name and family. */
export function searchTargets(receptors: ReceptorCatalog, q: string, limit = 25): ReceptorTarget[] {
  const needle = q.trim().toLowerCase();
  const all = allTargets(receptors);
  if (!needle) return all.slice(0, limit);

  const scored: Array<{ t: ReceptorTarget; score: number }> = [];
  for (const t of all) {
    const key = t.key.toLowerCase();
    const name = t.name.toLowerCase();
    let score = 0;
    if (key === needle || name === needle || (t.gene ?? '').toLowerCase() === needle) score = 100;
    else if (key.startsWith(needle) || name.startsWith(needle)) score = 60;
    else if (key.includes(needle) || name.includes(needle)) score = 40;
    else if ((t.full_name ?? '').toLowerCase().includes(needle)) score = 20;
    else if ((t.family ?? '').toLowerCase().includes(needle)) score = 10;
    if (score > 0) scored.push({ t, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name))
    .slice(0, limit)
    .map((s) => s.t);
}

// ─────────────────────────────────────────────────────────────────────────────
// Joins
// ─────────────────────────────────────────────────────────────────────────────

/** Every compound with an authored occupancy row at this target. Both sides go
 *  through `targetKeyFor`, so `5-HT2A`, its gene key `HTR2A` and any alias
 *  spelling all find the same rows. */
export function compoundsForTarget(
  compounds: readonly Compound[],
  occupancyKey: string,
): Compound[] {
  const want = targetKeyFor(occupancyKey);
  return compounds.filter((c) =>
    (c.receptor_occupancy ?? []).some((r) => targetKeyFor(r.receptor) === want),
  );
}

/**
 * Every compound connected to a pathway, from both directions the data could
 * record one: a `modulators[].slug` entry on the pathway, and a
 * `receptor_occupancy[].pathway` tag on the compound.
 *
 * It takes the pathway RECORD, not its slug, because only the record reaches the
 * half that has data. All 1,919 modulator entries resolve to live compounds,
 * while none of the 40 distinct `receptor_occupancy[].pathway` values is a
 * pathway slug: they are phenotype labels ("wakefulness", "beta1_blockade") that
 * only look like slugs. An earlier signature took a slug with the record
 * optional, and the client called it with the slug alone, so 212 of 230 pathway
 * pages announced that no compound touched them. The tag arm is kept because the
 * field is free text and a future batch could start writing real slugs there.
 */
export function compoundsForPathway(compounds: readonly Compound[], pathway: Pathway): Compound[] {
  const hits = new Map<Slug, Compound>();
  for (const c of compounds) {
    if ((c.receptor_occupancy ?? []).some((r) => r.pathway === pathway.slug)) hits.set(c.slug, c);
  }
  const idx = compoundIndex(compounds);
  for (const m of pathway.modulators ?? []) {
    const c = idx.get(m.slug);
    if (c) hits.set(c.slug, c);
  }
  return [...hits.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Both directions of every interaction edge touching `slug`.
 *
 * Interactions are stored ONE-DIRECTIONAL — caffeine lists theanine, theanine
 * need not list caffeine — so reading only `compound.interactions` shows half the
 * picture, and which half depends on which record you happened to open. This
 * materializes the symmetric view: `direction: 'out'` is an edge this compound
 * authored, `'in'` is one authored against it.
 *
 * `other` is undefined when the counterparty is off-registry, which is legal and
 * deliberate: the catalog carries informational edges against substances it does
 * not yet catalog, and dropping them would silently lose the warning. A KINETIC
 * edge to an unknown slug is a different matter and is an error
 * (`interactions.target-exists`).
 *
 * BOTH SIDES RESOLVE THROUGH THE INDEX. An in-edge used to be matched by string
 * equality against the requested slug, which meant an edge authored against a
 * RETIRED slug was found only when the caller asked by that retired name — and a
 * page routes by the canonical one. Two real edges were invisible that way
 * (`epa-dha → ala` on `alpha-linolenic-acid`, `riboflavin → r5p` on
 * `riboflavin-5-phosphate`): the record forwarded correctly, so the compound
 * resolved and rendered, and only its incoming interaction was missing.
 */
export function interactionsOf(
  compounds: readonly Compound[],
  slug: Slug,
): Array<{ other: Compound | undefined; ref: InteractionRef; direction: 'out' | 'in' }> {
  const idx = compoundIndex(compounds);
  const self = idx.get(slug);
  const out: Array<{ other: Compound | undefined; ref: InteractionRef; direction: 'out' | 'in' }> =
    [];
  for (const ref of self?.interactions ?? []) {
    out.push({ other: idx.get(ref.slug), ref, direction: 'out' });
  }
  for (const c of compounds) {
    if (self && c.slug === self.slug) continue;
    for (const ref of c.interactions ?? []) {
      // Resolve the ref through the same index rather than comparing strings, so
      // any name the compound answers to matches. When the requested slug is
      // off-registry there is nothing to resolve against, so fall back to literal
      // equality — that is how an edge to an uncatalogued substance is still found.
      const incoming = self ? idx.get(ref.slug) === self : ref.slug === slug;
      if (incoming) out.push({ other: c, ref, direction: 'in' });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Citations
// ─────────────────────────────────────────────────────────────────────────────

export type Citation = {
  pmid: string;
  /** Where the citation sits, as a JSON-ish path. Printed beside a verdict so a
   *  curator can go straight to the field rather than grep for the number. */
  origin: string;
};

/**
 * A PMID out of a `refs[]` entry, which is free-form and must therefore carry the
 * prefix. A bare number there could be anything, and `refs` does also hold the
 * occasional DOI.
 */
function parseRef(s: string): string | null {
  const m = s.match(/^PMID:?\s*(\d+)$/i);
  return m ? m[1]! : null;
}

/**
 * A PMID out of a field literally NAMED `pmid` or `source_pmid`, where the key
 * has already asserted what the value is. Both spellings are accepted because the
 * catalog genuinely uses both: `refs[]` and `source_pmid` write "PMID:17604717",
 * while `diagram.edges[].pmid` writes a bare "8645157".
 *
 * That difference is why the twenty citations on the PI3K/Akt diagram had never
 * been verified. A strict parser rejected every bare id and returned null, which
 * reads identically to "this field holds no citation" — so they were not reported
 * as unparseable, they were simply not counted.
 */
function parsePmidField(s: string): string | null {
  const m = s.match(/^(?:PMID:?\s*)?(\d+)$/i);
  return m ? m[1]! : null;
}

/**
 * Every PMID cited anywhere in a document, found by WALKING it.
 *
 * This used to enumerate the shapes it knew about — `refs[]`, `pk[route]`,
 * `interactions[]`, `receptor_occupancy[]`, `effect_compartment`, and for
 * pathways `refs[]` and `steps[]`. Which meant it silently skipped every citation
 * hung anywhere else, and it was already skipping some: the twenty papers cited by
 * `pi3k_akt_signaling.diagram.edges[].pmid` had never been checked and on an
 * enumerate-the-shapes design never would be. They are exactly the citations a
 * reader is most likely to click, since they sit on the arrows of a rendered
 * diagram.
 *
 * So it walks. A citation shape someone adds next year is covered by construction
 * rather than by remembering to come back here.
 */
export function citationsIn(node: unknown, label: string): Citation[] {
  const out: Citation[] = [];
  const walk = (n: unknown, path: string): void => {
    if (n == null || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      n.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
      const here = `${path}.${k}`;
      if ((k === 'source_pmid' || k === 'pmid') && typeof v === 'string') {
        const pmid = parsePmidField(v);
        if (pmid) out.push({ pmid, origin: here });
      } else if (k === 'refs' && Array.isArray(v)) {
        v.forEach((r, i) => {
          if (typeof r !== 'string') return;
          const pmid = parseRef(r);
          if (pmid) out.push({ pmid, origin: `${here}[${i}]` });
        });
      } else {
        walk(v, here);
      }
    }
  };
  walk(node, label);
  return out;
}

/** Every citation in the whole registry, origins labelled by the record they sit
 *  in. Pathway labels are suffixed because compound and pathway slug namespaces
 *  overlap in spirit even where they do not collide in fact. */
export function allCitations(registry: Registry): Citation[] {
  return [
    ...registry.compounds.flatMap((c) => citationsIn(c, c.slug)),
    ...registry.pathways.flatMap((p) => citationsIn(p, `${p.slug} (pathway)`)),
  ];
}

export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid.replace(/^PMID:?\s*/i, '')}/`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Coverage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What the catalog actually contains, counted.
 *
 * This is the report that tells an authoring session where to go next, so it
 * counts DECISIONS rather than fields. The number that matters most is
 * `compounds.unvisited`: a compound with neither authored PK nor a `pk_unauthored`
 * reason is one nobody has looked at. A compound with `pk_unauthored` has been
 * looked at and deliberately left alone, which is a finished state, not a gap —
 * conflating the two is what makes a coverage number go down when the data gets
 * more honest. `unvisited` reached empty and must stay empty; every other count
 * here is allowed to move in either direction.
 */
export interface CoverageReport {
  compounds: {
    total: number;
    /** At least one authored `pk[route]` block. */
    withPk: number;
    /** Deliberately unauthored, with a reason. */
    pkUnauthored: number;
    /** NEITHER — the number that must stay 0. */
    unvisited: string[];
    byUnauthoredReason: Record<string, number>;
    withMw: number;
    withHalfLife: number;
    withOccupancy: number;
    withEffectCompartment: number;
    withInteractions: number;
    withNutrition: number;
    byCategory: Record<string, number>;
    bySystem: Record<string, number>;
    untagged: string[];
    /** Total `pk[route]` blocks across the catalog. */
    routeEntries: number;
    /** Those carrying a source_pmid or a source_label. */
    routeEntriesCited: number;
    occupancyRows: number;
    interactionEdges: number;
    /** `effect_compartment` values fitted from a published model. */
    keoFitted: number;
    /** `effect_compartment` values openly marked as estimates. */
    keoEstimated: number;
  };
  pathways: {
    total: number;
    steps: number;
    modulators: number;
    byCategory: Record<string, number>;
    withRecon3dSubsystem: number;
    /** Recon3D subsystem → the pathway slugs claiming it. More than one slug
     *  under a subsystem is not a defect: a 111-subsystem reconstruction is
     *  coarser than a hand-authored pathway. */
    subsystems: Record<string, string[]>;
  };
  targets: {
    gpcrs: number;
    nonGpcr: number;
    families: number;
    occupancyKeysUsed: number;
    /** Keys in `receptor_occupancy` that no catalog entry describes — see
     *  `receptor.unknown-target`. */
    occupancyKeysUnknown: string[];
  };
  citations: { total: number; unique: number };
}

function bump(into: Record<string, number>, key: string): void {
  into[key] = (into[key] ?? 0) + 1;
}

export function coverage(registry: Registry): CoverageReport {
  const { compounds, pathways, receptors } = registry;

  const unvisited: string[] = [];
  const untagged: string[] = [];
  const byUnauthoredReason: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySystem: Record<string, number> = {};
  const occupancyKeys = new Set<string>();
  let withPk = 0;
  let pkUnauthored = 0;
  let withMw = 0;
  let withHalfLife = 0;
  let withOccupancy = 0;
  let withEffectCompartment = 0;
  let withInteractions = 0;
  let withNutrition = 0;
  let routeEntries = 0;
  let routeEntriesCited = 0;
  let occupancyRows = 0;
  let interactionEdges = 0;
  let keoFitted = 0;
  let keoEstimated = 0;

  for (const c of compounds) {
    bump(byCategory, c.category);
    for (const s of c.systems ?? []) bump(bySystem, s as SystemId);
    if (!c.systems || c.systems.length === 0) untagged.push(c.slug);

    const routes = Object.values(c.pk ?? {}).filter((pk) => pk != null);
    if (routes.length > 0) withPk++;
    if (c.pk_unauthored) {
      pkUnauthored++;
      bump(byUnauthoredReason, c.pk_unauthored.reason);
    }
    if (routes.length === 0 && !c.pk_unauthored) unvisited.push(c.slug);

    routeEntries += routes.length;
    for (const pk of routes) {
      if (pk.source_pmid || pk.source_label) routeEntriesCited++;
    }

    if (c.mw_g_mol != null) withMw++;
    if (Object.keys(c.half_life_hr).length > 0) withHalfLife++;
    if ((c.receptor_occupancy ?? []).length > 0) withOccupancy++;
    if ((c.interactions ?? []).length > 0) withInteractions++;
    if (c.nutrition) withNutrition++;
    occupancyRows += (c.receptor_occupancy ?? []).length;
    interactionEdges += (c.interactions ?? []).length;
    for (const r of c.receptor_occupancy ?? []) occupancyKeys.add(targetKeyFor(r.receptor));

    if (c.effect_compartment) {
      withEffectCompartment++;
      // `approximated` is the whole distinction between a fitted keo and a
      // reasoned one, so the report keeps them apart rather than reporting a
      // single "has PD" count that hides the difference.
      if (c.effect_compartment.approximated) keoEstimated++;
      else keoFitted++;
    }
  }

  const pathwayByCategory: Record<string, number> = {};
  const subsystems: Record<string, string[]> = {};
  let steps = 0;
  let modulators = 0;
  let withRecon3dSubsystem = 0;
  for (const p of pathways) {
    bump(pathwayByCategory, p.category);
    steps += p.steps.length;
    modulators += (p.modulators ?? []).length;
    if (p.recon3d_subsystem) {
      withRecon3dSubsystem++;
      (subsystems[p.recon3d_subsystem] ??= []).push(p.slug);
    }
  }

  const catalogued = new Set(allTargets(receptors).map((t) => t.key));
  const families = new Set(
    allTargets(receptors)
      .map((t) => t.family)
      .filter(Boolean),
  );
  const citations = allCitations(registry);

  return {
    compounds: {
      total: compounds.length,
      withPk,
      pkUnauthored,
      unvisited,
      byUnauthoredReason,
      withMw,
      withHalfLife,
      withOccupancy,
      withEffectCompartment,
      withInteractions,
      withNutrition,
      byCategory,
      bySystem,
      untagged,
      routeEntries,
      routeEntriesCited,
      occupancyRows,
      interactionEdges,
      keoFitted,
      keoEstimated,
    },
    pathways: {
      total: pathways.length,
      steps,
      modulators,
      byCategory: pathwayByCategory,
      withRecon3dSubsystem,
      subsystems,
    },
    targets: {
      gpcrs: receptors.receptors.length,
      nonGpcr: receptors.nonGpcrTargets.length,
      families: families.size,
      occupancyKeysUsed: occupancyKeys.size,
      occupancyKeysUnknown: [...occupancyKeys].filter((k) => !catalogued.has(k)).sort(),
    },
    citations: { total: citations.length, unique: new Set(citations.map((c) => c.pmid)).size },
  };
}
