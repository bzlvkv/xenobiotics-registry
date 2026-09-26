/**
 * registry-glue.ts — convert registry-shaped data into solver inputs.
 *
 * Surfaces work with Compound objects + Intake[] and want to call solve()
 * with a PkParamMap. Keeping that conversion inside @xeno/solver means the
 * surface only imports one package for "do PK", and registry stays purely
 * about loading + querying the dataset.
 *
 * Resolution order for a (compound, route)'s PK params:
 *   1. compound.pk?[route] — authored values (preferred)
 *   2. compound.half_life_hr[route] — gives ke; ka, V, F come from defaults
 *   3. nothing — that (compound, route) pair gets no params; the slug
 *      lands in `defaulted` so the UI can mark "no PK data"
 *
 * `defaulted` is a strict superset of "compounds rendered with low-confidence
 * defaults" — it includes both the partially-authored and the fully-defaulted.
 * Authoring rule (see Compound.pk doc): a route's pk must carry source_pmid
 * to count as fully authored; everything else is "needs more work."
 *
 * Route discipline: PK is keyed by (slug, route) — same compound at PO vs SL
 * has different ka, F, and apparent Vd, so the map enumerates every route
 * the user actually used. A compound is in `defaulted` if ANY of its routes
 * fell through to defaults; the slug is the smallest unit of "this curve's
 * confidence is uneven" the surfaces care about.
 */

import {
  type Compound,
  type EffectCompartment,
  type Intake,
  type ReceptorSite,
  type Route,
  type Slug,
} from '@xeno/core';
import { compoundIndex } from '@xeno/core';
import { resolvePk } from './pk';
import { analyteDoseMg } from './dose';
import { scalePkForWeight } from './mc';
import type { PkParamMap, PkParams } from './types';

/**
 * Slug→Compound index, cached on the Compound[] identity. Both `buildPkMap`
 * and `expandComposites` were rebuilding `new Map(compounds.map(...))` — a
 * fresh ~1100-entry Map — on *every* call. Those calls fire on each op
 * commit and on the 30s now-tick across four derived stores, so the rebuild
 * was steady per-tick churn for a Map whose contents never change (the
 * catalog is immutable post-load). Keying the cache on the array identity
 * means the common callers (all passing the same `bundledCompounds`
 * reference) build it once and reuse it; a distinct array gets its own
 * entry, a throwaway array costs one build (no regression). Mirrors the
 * `bySlug` index in @xeno/registry — kept local here to avoid a
 * solver→registry dependency. The map is read-only at both call sites.
 *
 * Length-tagged so the in-place lazy fill of `bundledCompounds`
 * (ensureBundledCompounds pushes the catalog in after export) can't leave a
 * stale partial index: a solve that raced ahead of the fill would otherwise
 * mark every later-loaded compound `defaulted` (no curve) and skip composite
 * expansion. Rebuild when the array length changes — same fix as @xeno/registry
 * `bySlug`.
 */
const slugIndexCache = new WeakMap<Compound[], { len: number; idx: Map<Slug, Compound> }>();

function slugIndex(compounds: Compound[]): Map<Slug, Compound> {
  let cached = slugIndexCache.get(compounds);
  if (!cached || cached.len !== compounds.length) {
    // Retired slugs resolve to the compound that absorbed them, so a logged
    // intake naming a merged-away slug still gets PK params instead of
    // silently dropping to "no PK on file". See Compound.retired_slugs.
    cached = { len: compounds.length, idx: compoundIndex(compounds) };
    slugIndexCache.set(compounds, cached);
  }
  return cached.idx;
}

/**
 * Build PK params for a single (compound, route) pair. Returns null when the
 * route offers no way to derive an elimination rate at all. ka / V / F fall
 * through to resolvePk's defaults silently when missing on the route.
 *
 * There are FOUR authoring paths to an elimination rate, and this gate has to
 * admit all of them because resolvePk itself does:
 *   1. pk[route].ke_hr                      — explicit rate constant
 *   2. half_life_hr[route]                   — the usual authoring path
 *   3. mm_vmax_per_hr + mm_km_mg_per_l       — saturable (Michaelis-Menten)
 *   4. alpha_hr + beta_hr + k21_hr           — two-compartment (beta is terminal)
 *
 * Paths 3 and 4 used to be rejected here before resolvePk was ever consulted,
 * so a compound authored PURELY on MM or 2-comp params reported "no PK on
 * file" even though the solver could model it perfectly. That silently hit
 * ethanol, whose whole point is saturable elimination (zero-order clearance is
 * why the fifth drink hurts disproportionately) and which carries no half-life
 * because a Michaelis-Menten compound does not have one constant. data-lint's
 * `pk.elimination` rule has always accepted MM params as sufficient, so the
 * gate here also contradicted the gate in CI: lint passed, the app showed
 * nothing. Keep these four conditions in sync with resolvePk.
 */
export function pkParamsForRoute(
  compound: Compound,
  route: Route,
  weight_kg = 70,
): PkParams | null {
  const partial = compound.pk?.[route] ?? {};
  const half_life_hr = compound.half_life_hr[route];
  const hasMm = partial.mm_vmax_per_hr != null && partial.mm_km_mg_per_l != null;
  const has2Comp = partial.alpha_hr != null && partial.beta_hr != null && partial.k21_hr != null;
  if (!partial.ke_hr && !half_life_hr && !hasMm && !has2Comp) return null;
  try {
    // resolvePk yields reference-weight (70 kg) params; scalePkForWeight then
    // applies the user's allometric scaling uniformly to authored AND defaulted
    // params. Passing no weight to resolvePk keeps its default-V at the 70 kg
    // reference so weight isn't applied twice — the 70 below is that reference
    // stated explicitly, not the user's weight.
    // The moiety fraction is a property of the DOSE, not of disposition, so it
    // is attached here — at the one place a registry Compound becomes solver
    // params — rather than inside resolvePk, which never sees the compound.
    // mw_g_mol is handed over for ONE purpose: picking the volume default when
    // the record authors none (resolvePk's defaultVolumeL). It is a property of
    // the compound, not of this route's disposition, so like
    // dose_moiety_fraction it is attached here rather than inside resolvePk,
    // which never sees a Compound.
    const resolved = scalePkForWeight(
      resolvePk({ ...partial, half_life_hr, mw_g_mol: compound.mw_g_mol }, 70),
      weight_kg,
    );
    if (compound.dose_moiety_fraction != null) {
      resolved.dose_moiety_fraction = compound.dose_moiety_fraction;
    }
    return resolved;
  } catch {
    return null;
  }
}

/**
 * `unmodelled` and `defaulted` are disjoint, and the distinction matters to
 * the surfaces: `unmodelled` gets no curve at all, `defaulted` gets a curve
 * whose absolute scale is a generic default wearing the confidence of an
 * authored one. They used to be one list, which meant the only copy a surface
 * could write ("shown without a curve rather than with a guessed one") was
 * false for exactly the members that needed the warning most.
 *
 * `effect` and `receptors` are passthroughs from the registry's per-compound
 * PD authoring. The solver consumes them to emit Ce(t) and occupancy
 * curves. Surfaces with no PD overlay can ignore both fields.
 */
export interface BuiltPkMap {
  params: PkParamMap;
  /** Slugs that produced NO params at all — unknown to the registry, or with
   *  no derivable elimination rate on any route they were used at. These get
   *  no curve, so a surface should say the intake is unmodelled rather than
   *  draw a flat line and let it read as "cleared". */
  unmodelled: Slug[];
  /** Slugs that DO get a curve, but whose concentration SCALE rests on
   *  resolvePk's generic defaults rather than on the citation. Surfaces must
   *  mark these: the shape is meaningful, the absolute number is not. */
  defaulted: Slug[];
  effect: Map<Slug, EffectCompartment>;
  receptors: Map<Slug, ReceptorSite[]>;
  /** Fraction unbound in plasma, for compounds that author one. Absent slugs
   *  are treated as fu = 1 by the occupancy path. */
  fractionUnbound: Map<Slug, number>;
}

/**
 * Build a PkParamMap from a registry + intake set. For each compound that
 * appears in `intakes`, populates an entry for every distinct route the
 * user actually used. A user dosing melatonin PO at bedtime + SL at 3 AM
 * will get both `melatonin.PO` and `melatonin.SL` PK in the map, and the
 * pipeline picks the right one per intake at solve time.
 *
 * If a compound lacks PK for a particular route entirely, that (slug, route)
 * is omitted and the slug lands in `defaulted`. Surfaces drop the affected
 * intakes from the mathematical projection but can still display the intake
 * row (just without a curve contribution).
 */
export function buildPkMap(compounds: Compound[], intakes: Intake[], weight_kg = 70): BuiltPkMap {
  const params: PkParamMap = new Map();
  const defaulted: Slug[] = [];
  const defaultedSet = new Set<Slug>();
  const unmodelled: Slug[] = [];
  const unmodelledSet = new Set<Slug>();
  const effect: Map<Slug, EffectCompartment> = new Map();
  const receptors: Map<Slug, ReceptorSite[]> = new Map();
  const fractionUnbound: Map<Slug, number> = new Map();
  const bySlug = slugIndex(compounds);

  // Collect every (slug, route) pair that appears in intakes.
  const routesPerSlug = new Map<Slug, Set<Route>>();
  for (const i of intakes) {
    let routes = routesPerSlug.get(i.compound);
    if (!routes) {
      routes = new Set();
      routesPerSlug.set(i.compound, routes);
    }
    routes.add(i.route);
  }

  for (const [slug, routes] of routesPerSlug) {
    const compound = bySlug.get(slug);
    if (!compound) {
      if (!unmodelledSet.has(slug)) {
        unmodelled.push(slug);
        unmodelledSet.add(slug);
      }
      continue;
    }
    let routeMap: Partial<Record<Route, PkParams>> | undefined;
    let anyAdded = false;
    let anyDefaulted = false;
    for (const route of routes) {
      const pk = pkParamsForRoute(compound, route, weight_kg);
      if (!pk) {
        anyDefaulted = true;
        continue;
      }
      if (!routeMap) {
        routeMap = {};
        params.set(slug, routeMap);
      }
      routeMap[route] = pk;
      anyAdded = true;
      // "Authored" has to mean the parameters the displayed NUMBER rests on,
      // not merely the presence of a citation. V_L divides every concentration
      // this curve will ever report and F multiplies it, so a route missing
      // either is rendering resolvePk's generic 0.5 L/kg and 0.9 — a small-
      // molecule shape — at whatever confidence the surface affords an
      // authored curve. This test used to be `source_pmid != null` alone,
      // which a half-life citation satisfies on its own: that is how
      // retatrutide, a 4.7 kDa albumin-bound peptide whose only sourced
      // number is its 6-day half-life, came to be drawn at 35 L unmarked,
      // roughly 4x low, next to semaglutide's measured 7.7 L.
      //
      // ka is deliberately NOT part of this test. It moves the peak, not the
      // scale, and cancels out of AUC entirely; the pk.defaulted-ka-slow lint
      // already covers it. Keep the fields here in sync with resolvePk's
      // defaults — anything resolvePk substitutes that multiplies or divides
      // the result belongs in this condition.
      const authored = compound.pk?.[route];
      const scaleAuthored = authored?.V_L != null && (route === 'IV' || authored?.F != null);
      if (authored?.source_pmid == null || !scaleAuthored) anyDefaulted = true;
    }
    if (!anyAdded) {
      if (!unmodelledSet.has(slug)) {
        unmodelled.push(slug);
        unmodelledSet.add(slug);
      }
    } else if (anyDefaulted) {
      if (!defaultedSet.has(slug)) {
        defaulted.push(slug);
        defaultedSet.add(slug);
      }
    }

    // PD authoring is independent of route — compounds with effect-
    // compartment + receptor data carry it once at the compound level.
    if (compound.effect_compartment) {
      effect.set(slug, compound.effect_compartment);
    }
    if (compound.receptor_occupancy && compound.receptor_occupancy.length > 0) {
      receptors.set(slug, compound.receptor_occupancy);
    }
    if (compound.fraction_unbound != null) {
      fractionUnbound.set(slug, compound.fraction_unbound);
    }
  }

  // Formed-only metabolites: an on-board parent's metabolite is never in the
  // intake list, so the loop above skips it — but the solver needs its PK (+ any
  // PD) to integrate the formed curve. Add it here for every on-board parent that
  // declares metabolites, unless the metabolite is itself dosed (already built).
  for (const slug of routesPerSlug.keys()) {
    const parent = bySlug.get(slug);
    if (!parent?.metabolites || !params.has(slug)) continue;
    for (const m of parent.metabolites) {
      if (params.has(m.slug)) continue;
      const mc = bySlug.get(m.slug);
      if (!mc) continue;
      const routeMap: Partial<Record<Route, PkParams>> = {};
      for (const route of mc.routes) {
        const pk = pkParamsForRoute(mc, route, weight_kg);
        if (pk) routeMap[route] = pk;
      }
      if (Object.keys(routeMap).length === 0) continue;
      params.set(m.slug, routeMap);
      if (mc.effect_compartment) effect.set(m.slug, mc.effect_compartment);
      if (mc.receptor_occupancy && mc.receptor_occupancy.length > 0) {
        receptors.set(m.slug, mc.receptor_occupancy);
      }
      if (mc.fraction_unbound != null) fractionUnbound.set(m.slug, mc.fraction_unbound);
    }
  }

  return { params, unmodelled, defaulted, effect, receptors, fractionUnbound };
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite expansion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-parent metadata produced by `expandComposites` so the UI can group
 * constituent rows back under their parent. A parent's constituents
 * inherit the route + time + note of the original intake; their dose is
 * derived from `parent_dose_mg × constituent.mg_per_g_extract / 1000`.
 */
export interface CompositeGroup {
  /** Parent compound slug (the thing the user logged). */
  parent_slug: Slug;
  /** Constituent slugs the parent fanned out into. */
  constituent_slugs: Slug[];
  /** Original intake IDs that produced this expansion (multiple if the
   *  user logged the same parent more than once). */
  parent_intake_ids: string[];
}

export interface ExpandedIntakes {
  /** Intakes after composite fan-out — pass these to `buildPkMap` + `solve`. */
  intakes: Intake[];
  /** Map from parent slug → grouping info; empty if no composites in input. */
  groups: Map<Slug, CompositeGroup>;
  /** Reverse index: constituent slug → parent slug (for fast row lookup). */
  parentOf: Map<Slug, Slug>;
}

/**
 * Expand composite-compound intakes into per-constituent intakes.
 *
 * For each intake whose compound has a `composition` field, this function
 * emits one synthetic intake per constituent with dose scaled by
 * `mg_per_g_extract`. The original parent intake is *not* preserved in the
 * output — the solver will simulate plasma curves for the constituents,
 * not the parent — but the parent's identity is recorded in `groups` so
 * the UI can render a parent row that aggregates them.
 *
 * Non-composite intakes pass through unchanged.
 *
 * Synthetic intake IDs use the form `${originalId}::${constituentSlug}`
 * to be unique and traceable back to their source. Route, time, and
 * stack_id are inherited from the parent. The note field is preserved on
 * each child so the dose-marker tooltip continues to show what was logged.
 */
export function expandComposites(compounds: Compound[], intakes: Intake[]): ExpandedIntakes {
  const bySlug = slugIndex(compounds);
  const out: Intake[] = [];
  const groups = new Map<Slug, CompositeGroup>();
  const parentOf = new Map<Slug, Slug>();

  for (const intake of intakes) {
    const parent = bySlug.get(intake.compound);
    if (!parent?.composition) {
      out.push(intake);
      continue;
    }

    const parentDoseMg = analyteDoseMg(intake.dose, intake.dose_unit, parent);
    if (!Number.isFinite(parentDoseMg) || parentDoseMg <= 0) {
      // Skip degenerate doses but keep tracking in groups for UI
      out.push(intake);
      continue;
    }
    const parentDoseG = parentDoseMg / 1000;

    for (const cs of parent.composition.constituents) {
      const constituentMg = parentDoseG * cs.mg_per_g_extract;
      if (!Number.isFinite(constituentMg) || constituentMg <= 0) continue;
      out.push({
        ...intake,
        id: `${intake.id}::${cs.slug}`,
        compound: cs.slug,
        dose: constituentMg,
        dose_unit: 'mg',
      });
      parentOf.set(cs.slug, parent.slug);
    }

    let group = groups.get(parent.slug);
    if (!group) {
      group = {
        parent_slug: parent.slug,
        constituent_slugs: parent.composition.constituents.map((c) => c.slug),
        parent_intake_ids: [],
      };
      groups.set(parent.slug, group);
    }
    group.parent_intake_ids.push(intake.id);
  }

  return { intakes: out, groups, parentOf };
}

/**
 * One-shot composite-aware PK preparation. Equivalent to
 * `expandComposites()` followed by `buildPkMap()` but returns both
 * results bundled so callers don't have to thread two variables.
 *
 * Use this in every solver call site that operates on user-facing
 * intakes (Today, Run, Library preview, StackCard, StackEditor,
 * widePlasma). The returned `intakes` are the *expanded* set that
 * must be passed to `solve()`; `compositeGroups` is the metadata
 * UI components need to render parent rows.
 */
export function buildPkMapWithComposites(
  compounds: Compound[],
  rawIntakes: Intake[],
  weight_kg = 70,
): BuiltPkMap & { intakes: Intake[]; compositeGroups: Map<Slug, CompositeGroup> } {
  const expanded = expandComposites(compounds, rawIntakes);
  const built = buildPkMap(compounds, expanded.intakes, weight_kg);
  return {
    ...built,
    intakes: expanded.intakes,
    compositeGroups: expanded.groups,
  };
}
