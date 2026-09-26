/**
 * 2026-05-06-consolidate-duplicate-slugs.ts
 *
 * Consolidates 8 duplicate-pattern slug pairs surfaced in tonight's
 * registry hygiene scan (commit 0858346). For each pair, picks the
 * slug with more data + more interconnections as canonical, merges
 * unique fields from the duplicate, migrates inbound interaction
 * refs, then deletes the duplicate.
 *
 * Net compound count: 1015 - 8 = 1007.
 *
 * | canonical              | delete                | merge from delete         |
 * |------------------------|-----------------------|---------------------------|
 * | beta-hydroxybutyrate   | bhb                   | (nothing unique — delete) |
 * | l-carnitine            | carnitine             | systems[] tag             |
 * | cholecalciferol        | vitamin-d3            | keo 0.001/h + 1 ref       |
 * | creatine               | creatine-monohydrate  | keo 0.005/h + MW          |
 * | epa-dha                | omega-3-epa-dha       | (nothing unique — delete) |
 * | theanine               | l-theanine            | keo 1.5/h + 1 ref         |
 * | nr                     | nad-precursor-nr      | (nothing unique — delete) |
 * | rhodiola-rosea         | rhodiola              | richer mechanism prose    |
 *
 * For every consolidation: the deleted slug is added to canonical's
 * aliases[] so search/lookup still finds it. Inbound interaction
 * refs from other compounds are remapped to canonical.
 *
 * Note: this diverges from earlier memory references on a few slugs
 * (vitamin-d3, creatine-monohydrate, l-theanine) where the data flow
 * has evolved past the v0.5 hand-authored convention. The slug with
 * more interconnections wins to minimize migration churn.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  mechanism?: string;
  systems?: string[];
  effect_compartment?: { keo_per_h?: number; source_pmid?: string; note?: string };
  refs?: string[];
  mw_g_mol?: number;
  interactions?: Array<{ slug: string; name?: string; level?: string; note?: string }>;
  [k: string]: unknown;
}

interface Consolidation {
  canonical: string;
  duplicate: string;
  // What unique fields to merge from duplicate → canonical (only set
  // ones the canonical lacks).
  mergeKeo?: boolean;          // copy effect_compartment if canonical missing
  mergeSystems?: boolean;      // union systems[]
  mergeMechanism?: boolean;    // prefer longer mechanism
  mergeMw?: boolean;           // copy mw_g_mol if canonical missing
}

const PLAN: Consolidation[] = [
  { canonical: 'beta-hydroxybutyrate', duplicate: 'bhb' },
  { canonical: 'l-carnitine',          duplicate: 'carnitine',            mergeSystems: true },
  { canonical: 'cholecalciferol',      duplicate: 'vitamin-d3',           mergeKeo: true },
  { canonical: 'creatine',             duplicate: 'creatine-monohydrate', mergeKeo: true,  mergeMw: true },
  { canonical: 'epa-dha',              duplicate: 'omega-3-epa-dha' },
  { canonical: 'theanine',             duplicate: 'l-theanine',           mergeKeo: true },
  { canonical: 'nr',                   duplicate: 'nad-precursor-nr' },
  { canonical: 'rhodiola-rosea',       duplicate: 'rhodiola',             mergeMechanism: true },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  let migratedInbound = 0, deleted = 0, mergedFields = 0;

  for (const plan of PLAN) {
    const canonical = data.find(c => c.slug === plan.canonical);
    const duplicate = data.find(c => c.slug === plan.duplicate);

    if (!canonical) { console.warn(`  [skip] canonical missing: ${plan.canonical}`); continue; }
    if (!duplicate) { console.log(`  [already-done] duplicate already absent: ${plan.duplicate}`); continue; }

    // ── Merge unique fields ─────────────────────────────────────
    if (plan.mergeKeo && duplicate.effect_compartment?.keo_per_h && !canonical.effect_compartment?.keo_per_h) {
      canonical.effect_compartment = duplicate.effect_compartment;
      mergedFields++;
    }
    if (plan.mergeSystems && Array.isArray(duplicate.systems)) {
      const existing = new Set(canonical.systems ?? []);
      for (const s of duplicate.systems) existing.add(s);
      canonical.systems = Array.from(existing);
      mergedFields++;
    }
    if (plan.mergeMechanism && duplicate.mechanism && (!canonical.mechanism || canonical.mechanism.length < duplicate.mechanism.length)) {
      canonical.mechanism = duplicate.mechanism;
      mergedFields++;
    }
    if (plan.mergeMw && duplicate.mw_g_mol && !canonical.mw_g_mol) {
      canonical.mw_g_mol = duplicate.mw_g_mol;
      mergedFields++;
    }

    // Always merge refs (union)
    const refs = new Set([...(canonical.refs ?? []), ...(duplicate.refs ?? [])]);
    canonical.refs = Array.from(refs);

    // Always extend aliases — searchability for the dropped slug
    const aliases = new Set([...(canonical.aliases ?? []), plan.duplicate]);
    if (duplicate.aliases) for (const a of duplicate.aliases) aliases.add(a);
    if (duplicate.name && duplicate.name !== canonical.name) aliases.add(duplicate.name);
    canonical.aliases = Array.from(aliases);

    // ── Migrate inbound interaction refs ────────────────────────
    for (const c of data) {
      for (const ix of (c.interactions ?? [])) {
        if (ix.slug === plan.duplicate) {
          // Skip if canonical already has this edge (avoid double-edge after merge)
          const already = (canonical.interactions ?? []).find(i => i.slug === ix.slug);
          ix.slug = plan.canonical;
          migratedInbound++;
          if (already) {
            // After remap, c may now have two interactions both pointing at canonical
            // — handled by the dedup pass below.
          }
        }
      }
    }

    // Also bring duplicate's outbound interactions onto canonical (union, dedup by victim slug)
    for (const ix of (duplicate.interactions ?? [])) {
      const already = (canonical.interactions ?? []).find(i => i.slug === ix.slug);
      if (!already) {
        canonical.interactions = [...(canonical.interactions ?? []), ix];
      }
    }

    // ── Delete the duplicate slug ───────────────────────────────
    const idx = data.findIndex(c => c.slug === plan.duplicate);
    if (idx >= 0) { data.splice(idx, 1); deleted++; }
  }

  // ── Dedupe interactions[] across all compounds ──────────────────
  // Migration may have produced two entries pointing at the same canonical
  // slug on a single compound. Keep the one with kinetics if any.
  let interactionDups = 0;
  for (const c of data) {
    const ints = c.interactions ?? [];
    const seen = new Map<string, typeof ints[number]>();
    for (const ix of ints) {
      const prev = seen.get(ix.slug);
      if (!prev) { seen.set(ix.slug, ix); continue; }
      const prevKin = (prev as { kinetics?: unknown }).kinetics;
      const curKin = (ix as { kinetics?: unknown }).kinetics;
      if (curKin && !prevKin) seen.set(ix.slug, ix);
      interactionDups++;
    }
    if (interactionDups > 0 && ints.length !== seen.size) {
      c.interactions = Array.from(seen.values());
    }
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Consolidated ${deleted} duplicate slugs, merged ${mergedFields} unique fields, migrated ${migratedInbound} inbound refs, dedupd ${interactionDups} cross-compound interactions. Compound count now ${data.length}.`);
}

main();
