/**
 * ctx.ts — everything the views read, derived once at boot.
 *
 * The client is a reader, so all of this is immutable after boot: the indexes,
 * the target catalog flattened, the lint findings, and the coverage report. One
 * pass over 1,244 compounds at startup beats recomputing per navigation.
 */
import {
  allTargets,
  targetKeyFor,
  compoundIndex,
  coverage,
  lintRegistry,
  type Compound,
  type CoverageReport,
  type Finding,
  type Pathway,
  type ReceptorCatalog,
  type ReceptorTarget,
  type Registry,
  type Slug,
} from '@xeno/registry';
import { decodeEntities, el, link } from './ui';

export interface Ctx {
  registry: Registry;
  compounds: Compound[];
  pathways: Pathway[];
  receptors: ReceptorCatalog;
  byCompound: Map<Slug, Compound>;
  byPathway: Map<string, Pathway>;
  targets: ReceptorTarget[];
  byTarget: Map<string, ReceptorTarget>;
  /** canonical occupancy key -> number of compounds with an authored row there */
  occupancyCount: Map<string, number>;
  findings: Finding[];
  coverage: CoverageReport;
}

export function build(registry: Registry): Ctx {
  const targets = allTargets(registry.receptors);
  const occupancyCount = new Map<string, number>();
  for (const c of registry.compounds) {
    const seen = new Set<string>();
    for (const row of c.receptor_occupancy ?? []) {
      const key = targetKeyFor(row.receptor);
      if (seen.has(key)) continue;
      seen.add(key);
      occupancyCount.set(key, (occupancyCount.get(key) ?? 0) + 1);
    }
  }
  return {
    registry,
    compounds: registry.compounds,
    pathways: registry.pathways,
    receptors: registry.receptors,
    byCompound: compoundIndex(registry.compounds),
    byPathway: new Map(registry.pathways.map((p) => [p.slug, p])),
    targets,
    byTarget: new Map(targets.map((t) => [t.key, t])),
    occupancyCount,
    findings: lintRegistry(registry),
    coverage: coverage(registry),
  };
}

/** A record's own findings. Entities are slugs, sometimes with a sub-path. */
export function findingsFor(ctx: Ctx, entity: string): Finding[] {
  return ctx.findings.filter(
    (f) =>
      f.entity === entity ||
      f.entity.startsWith(`${entity}/`) ||
      f.entity.startsWith(`${entity}#`) ||
      f.entity.startsWith(`${entity}:`),
  );
}

/** Resolve a lint finding's entity back to whichever record it names. */
export function entityLink(ctx: Ctx, entity: string): HTMLElement {
  const base = entity.split(/[/#:\s]/)[0] ?? entity;
  if (ctx.byCompound.has(base)) return link(`#/compounds/${base}`, entity, 'mono');
  if (ctx.byPathway.has(base)) return link(`#/pathways/${base}`, entity, 'mono');
  return el('code', null, entity);
}

export function compoundLink(ctx: Ctx, slug: string, label?: string): HTMLElement {
  const c = ctx.byCompound.get(slug);
  if (!c) return el('span', { title: 'not in this registry' }, el('code', null, slug));
  return link(`#/compounds/${c.slug}`, label ?? c.name);
}

export function pathwayLink(ctx: Ctx, slug: string): HTMLElement {
  const p = ctx.byPathway.get(slug);
  if (!p) return el('span', { title: 'no such pathway' }, el('code', null, slug));
  return link(`#/pathways/${p.slug}`, p.name);
}

/**
 * Occupancy keys are free text; `targetKeyFor` maps them onto catalog keys, and the
 * two class-level keys it cannot map (`alpha_1`, `muscarinic`) have no catalog entry
 * (`OPRM1` is catalogued, `mu_opioid` is what the rows say). The target route
 * accepts any key so these rows stay clickable, and says plainly when the
 * catalog has nothing for it.
 */
export function targetLink(ctx: Ctx, key: string): HTMLElement {
  const canon = targetKeyFor(key);
  const t = ctx.byTarget.get(canon);
  return link(`#/targets/${encodeURIComponent(canon)}`, t ? targetName(t) : key);
}

/** Catalog names carry HTML entities for the Greek letters; see decodeEntities. */
export function targetName(t: ReceptorTarget): string {
  return decodeEntities(t.name);
}

export function gtopdbUrl(gtpId: number | undefined): string | null {
  return gtpId && gtpId > 0
    ? `https://www.guidetopharmacology.org/GRAC/ObjectDisplayForward?objectId=${gtpId}`
    : null;
}
