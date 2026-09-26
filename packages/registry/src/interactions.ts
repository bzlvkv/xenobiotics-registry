/**
 * interactions.ts — pure helpers for surfacing compound interaction
 * warnings on Stack composer + Today.
 *
 * v7 stores interactions one-direction per compound (caffeine.interactions
 * lists theanine, but theanine doesn't necessarily list caffeine). To
 * give surfaces a complete view, we materialize the symmetric edge list
 * at query time — both directions count for "is there an interaction
 * between A and B."
 *
 * The math (CYP induction kinetics adjusting ke, plasma binding
 * competition shifting fraction-unbound) lands when per-edge Ki /
 * induction-rate data is authored. v7's `interactions` field is
 * informational only: surfaces show the warning, the solver doesn't
 * adjust curves.
 */

import type { Compound, InteractionRef, Slug } from '@xeno/core';

/**
 * One edge with the source compound attached, ready for rendering.
 *
 * The same logical pair can show up twice when both compounds carry the
 * other in their `interactions` array; surfaces dedup by sorted-slug
 * pair using `pairKey` if they want to render only one chip.
 */
export interface InteractionEdge {
  /** The compound whose interactions[] entry this came from. */
  fromSlug: Slug;
  fromName: string;
  /** The counterparty referenced by `slug`. May be off-registry (v7
   *  carried names of compounds we don't yet catalog like Adenosine). */
  toSlug: Slug;
  toName: string;
  level: InteractionRef['level'];
  note: string;
  timing?: string;
}

/** Stable key for a pair, ignoring direction. */
export function pairKey(a: Slug, b: Slug): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Find every interaction between any two compounds in `slugs`. Both
 * directions are checked: if A.interactions[] mentions B, that's an
 * edge; if B.interactions[] mentions A, that's also an edge. We
 * deliberately keep both — surfaces decide whether to dedupe.
 *
 * Off-registry counterparties (e.g. v7's "Adenosine" without a registry
 * entry) only fire when the compound carrying the edge is in `slugs`
 * AND the counterparty's slug ALSO is. They get dropped otherwise so
 * the surface doesn't warn about something not in the user's stack.
 */
export function interactionsAmong(compounds: Compound[], slugs: Iterable<Slug>): InteractionEdge[] {
  const set = new Set(slugs);
  if (set.size < 2) return [];

  const bySlug = new Map(compounds.map((c) => [c.slug, c]));
  const edges: InteractionEdge[] = [];

  for (const slug of set) {
    const c = bySlug.get(slug);
    if (!c?.interactions) continue;
    for (const ref of c.interactions) {
      if (!set.has(ref.slug)) continue; // counterparty not in scope
      edges.push({
        fromSlug: c.slug,
        fromName: c.name,
        toSlug: ref.slug,
        toName: ref.name,
        level: ref.level,
        note: ref.note,
        timing: ref.timing,
      });
    }
  }
  return edges;
}

/**
 * Composer-side helper: when the user is about to add `newSlug` to a
 * stack that already contains `existingSlugs`, return every interaction
 * edge involving the new compound. Surfaces show one warning chip per
 * edge.
 */
export function interactionsForCompoundAddition(
  compounds: Compound[],
  existingSlugs: Iterable<Slug>,
  newSlug: Slug,
): InteractionEdge[] {
  const all = interactionsAmong(compounds, [...existingSlugs, newSlug]);
  return all.filter((e) => e.fromSlug === newSlug || e.toSlug === newSlug);
}

/**
 * "Active intakes within the last `withinHr` hours" cohort, deduplicated
 * to unique compound slugs. Today's interactions pip uses this set as
 * input to `interactionsAmong`. The hour window is plan §08 surface 04's
 * default for observation correlation; same window works here.
 */
export function activeCompoundSlugs(
  intakes: Array<{ at: string; compound: string }>,
  withinHr: number = 12,
  now_ms: number = Date.now(),
): Slug[] {
  const cutoff = now_ms - withinHr * 60 * 60 * 1000;
  const set = new Set<Slug>();
  for (const i of intakes) {
    if (Date.parse(i.at) >= cutoff) set.add(i.compound);
  }
  return [...set];
}

/**
 * Severity ordering — surfaces sort warnings by descending severity so
 * the most important chip lands first.
 */
const SEVERITY_RANK: Record<InteractionRef['level'], number> = {
  contraindicated: 5,
  major: 4,
  warn: 3,
  caution: 2,
  beneficial: 1,
  synergistic: 0,
};

export function bySeverityDesc(a: InteractionEdge, b: InteractionEdge): number {
  return SEVERITY_RANK[b.level] - SEVERITY_RANK[a.level];
}

/** True when the level warrants a "do not combine" or "be careful" chip
 *  rather than the "useful pairing" chip. */
export function isWarning(level: InteractionRef['level']): boolean {
  return SEVERITY_RANK[level] >= SEVERITY_RANK.caution;
}

/**
 * Collapse the symmetric edge list to one entry per unordered pair.
 *
 * `interactionsAmong` returns one edge per direction — when both
 * compounds carry an `interactions[]` reference to the other (e.g.
 * caffeine and theobromine reciprocally cite the receptor competition),
 * the surface ends up rendering the same warning twice. This helper
 * keeps a single representative edge per pair, choosing the
 * higher-severity direction. On equal severity the first occurrence
 * wins, which preserves a stable render order across re-runs.
 *
 * Kinetic adjustments (the math chips on Today) are looked up
 * separately by direction and remain independent — collapsing the
 * display list does not collapse the underlying solver effects.
 */
export function dedupeByPair(edges: InteractionEdge[]): InteractionEdge[] {
  const out = new Map<string, InteractionEdge>();
  for (const e of edges) {
    const k = pairKey(e.fromSlug, e.toSlug);
    const prev = out.get(k);
    if (!prev || bySeverityDesc(e, prev) < 0) {
      out.set(k, e);
    }
  }
  return [...out.values()];
}

/**
 * Pre-filtered interaction edges in the form the solver expects. Each
 * entry carries a kinetics block (informational edges are dropped) and
 * the perpetrator's molecular weight (when authored on the compound),
 * which the solver needs to convert µM Ki to mg/L.
 *
 * Surfaces use this to feed `solve({ interactions })` and to render
 * "active math" chips on Today's interactions panel — every entry here
 * corresponds to a curve adjustment, every dropped edge is just a label.
 */
export interface KineticInteractionEdge {
  from: Slug;
  fromName: string;
  to: Slug;
  toName: string;
  /** From the registry's InteractionKinetics block. */
  kinetics: NonNullable<InteractionRef['kinetics']>;
  /** Perpetrator's mw_g_mol, propagated for unit conversion. May be
   *  absent — the solver will skip µM → mg/L conversion in that case. */
  perpetrator_mw_g_mol?: number;
  /** Citation anchoring the kinetics numbers. Required by the registry
   *  verifier whenever a kinetics block is set. */
  source_pmid?: string;
}

/**
 * Walk every compound's `interactions[]`, keep only edges whose
 * counterparty is also on board AND that carry a `kinetics` block.
 * Returns one entry per directional edge — the same logical pair can
 * show up twice if both compounds carry a kinetics edge against the
 * other (each direction modulates the other's PK independently).
 */
/**
 * One parent → metabolite formation link in the shape the solver's
 * `SolveInput.metabolites` expects. `fraction` is the molar fraction of the
 * parent's elimination that forms the metabolite; the MWs convert parent mass
 * eliminated to metabolite mass formed.
 */
export interface MetaboliteFormationLink {
  parent: Slug;
  metabolite: Slug;
  fraction: number;
  mw_parent_g_mol: number;
  mw_metabolite_g_mol: number;
  source_pmid?: string;
}

/**
 * Materialize parent → metabolite links for every on-board parent (`slugs`) that
 * declares `metabolites`. The metabolite need NOT be on board — it's formed — but
 * both compounds must carry `mw_g_mol` (needed to convert parent→metabolite mass)
 * and the metabolite must exist in the registry. Feeds `solve({ metabolites })`.
 */
export function metaboliteLinksAmong(
  compounds: Compound[],
  slugs: Iterable<Slug>,
): MetaboliteFormationLink[] {
  const set = new Set(slugs);
  if (set.size === 0) return [];
  const bySlug = new Map(compounds.map((c) => [c.slug, c]));
  const out: MetaboliteFormationLink[] = [];
  for (const slug of set) {
    const parent = bySlug.get(slug);
    if (!parent?.metabolites || parent.mw_g_mol == null) continue;
    for (const m of parent.metabolites) {
      if (!(m.fraction > 0)) continue;
      const met = bySlug.get(m.slug);
      if (!met || met.mw_g_mol == null) continue; // need both MWs to convert mass
      out.push({
        parent: slug,
        metabolite: m.slug,
        fraction: m.fraction,
        mw_parent_g_mol: parent.mw_g_mol,
        mw_metabolite_g_mol: met.mw_g_mol,
        source_pmid: m.source_pmid,
      });
    }
  }
  return out;
}

export function kineticInteractionsAmong(
  compounds: Compound[],
  slugs: Iterable<Slug>,
): KineticInteractionEdge[] {
  const set = new Set(slugs);
  if (set.size < 2) return [];

  const bySlug = new Map(compounds.map((c) => [c.slug, c]));
  const edges: KineticInteractionEdge[] = [];

  for (const slug of set) {
    const c = bySlug.get(slug);
    if (!c?.interactions) continue;
    for (const ref of c.interactions) {
      if (!ref.kinetics) continue;
      if (!set.has(ref.slug)) continue;
      edges.push({
        from: c.slug,
        fromName: c.name,
        to: ref.slug,
        toName: ref.name,
        kinetics: ref.kinetics,
        perpetrator_mw_g_mol: c.mw_g_mol,
        source_pmid: ref.source_pmid,
      });
    }
  }
  return edges;
}
