/**
 * load.ts — parsed JSON in, validated registry out. Throws loud.
 *
 * These functions take `unknown` and do no I/O, so the same code path validates
 * a file read from disk by `read.ts` and a hand-built record in a test, and any
 * future consumer that receives the JSON another way can use it unchanged. The
 * loader is the gate: `pnpm validate` runs every committed byte through it.
 *
 * WHY THE ERRORS ARE LOUD AND FIELD-LEVEL. A typo must fail here rather than
 * degrade downstream. zod's default posture is to strip and continue, which for a
 * catalog of cited numbers is the worst possible behaviour: `ka_hr: "1.2"` as a
 * string, or `sourse_pmid`, would silently become a record with no absorption
 * rate and no citation, and the surface would render it as a deliberate absence.
 * So every failure names the record, and every issue gets its path and the value
 * found there. The whole record is NOT printed: a compound runs to a hundred
 * lines of JSON, and the one line that matters scrolled off above it.
 */

import { compoundSchema, pathwaySchema, receptorCatalogSchema } from './schema';
import type { Compound, Pathway, ReceptorCatalog, Registry } from './types';
import type { z } from 'zod';

/** Which record failed: its position, and its slug and name when they parsed. A
 *  path alone ("pk.PO.F: expected number") does not say which of 1,244 compounds
 *  is broken. */
function identify(r: unknown, index: number): string {
  const rec = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
  const slug = typeof rec.slug === 'string' ? rec.slug : '(no slug)';
  const name = typeof rec.name === 'string' ? ` "${rec.name}"` : '';
  return `#${index} ${slug}${name}`;
}

/** The value sitting at an issue's path, clipped so one bad field cannot flood
 *  the output. */
function valueAt(root: unknown, path: (string | number)[]): string {
  let node: unknown = root;
  for (const k of path) {
    if (node == null || typeof node !== 'object') return '(absent)';
    node = (node as Record<string | number, unknown>)[k];
  }
  if (node === undefined) return '(absent)';
  const text = JSON.stringify(node) ?? String(node);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

/** One line per issue: path, message, and what was actually there. */
function detail(issues: z.ZodIssue[], record: unknown): string {
  return issues
    .map((i) => {
      const at = i.path.join('.') || '(root)';
      // An unknown key's message already names the key; the value at the path is
      // the whole enclosing object, which adds nothing but length.
      if (i.code === 'unrecognized_keys') return `  • ${at}: ${i.message}`;
      return `  • ${at}: ${i.message} (found ${valueAt(record, i.path)})`;
    })
    .join('\n');
}

function expectArray(records: unknown, what: string): unknown[] {
  if (!Array.isArray(records)) {
    throw new Error(
      `[registry] ${what} must be a JSON array, got ${records === null ? 'null' : typeof records}`,
    );
  }
  return records;
}

/**
 * Validate compound records, sorted by display name, slugs unique.
 *
 * Sorted at load rather than at every call site: the order is a property of the
 * catalog, and a consumer that forgets to sort should not render a different list
 * from one that remembers.
 */
export function loadCompounds(records: unknown): Compound[] {
  const out: Compound[] = [];
  const seen = new Set<string>();
  for (const [i, r] of expectArray(records, 'compounds').entries()) {
    const parsed = compoundSchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(
        `[registry] invalid compound ${identify(r, i)}:\n${detail(parsed.error.issues, r)}`,
      );
    }
    if (seen.has(parsed.data.slug)) {
      throw new Error(`[registry] duplicate slug: ${parsed.data.slug}`);
    }
    seen.add(parsed.data.slug);
    // zod types a record keyed by an enum as having EVERY key present, while the
    // data has only the routes it authored. The runtime shape is right; only the
    // inferred type is over-strong, so the cast narrows it back to the Partial
    // that `Compound` declares.
    out.push(parsed.data as Compound);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validate pathway records, sorted by name, slugs unique.
 *
 * Cross-references (steps[].from_slug / to_slug / via_slug, modulators[].slug)
 * are NOT checked here — they need the compound set, so they are `lintRegistry`'s
 * job. This function only answers "is each record well-formed on its own".
 */
export function loadPathways(records: unknown): Pathway[] {
  const out: Pathway[] = [];
  const seen = new Set<string>();
  for (const [i, r] of expectArray(records, 'pathways').entries()) {
    const parsed = pathwaySchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(
        `[registry] invalid pathway ${identify(r, i)}:\n${detail(parsed.error.issues, r)}`,
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

/** Validate the target catalog. Unlike compounds and pathways this is a single
 *  document with a `meta` provenance block, not an array. */
export function loadReceptors(doc: unknown): ReceptorCatalog {
  const parsed = receptorCatalogSchema.safeParse(doc);
  if (!parsed.success) {
    throw new Error(`[registry] invalid receptors.json:\n${detail(parsed.error.issues, doc)}`);
  }
  const keys = new Map<string, string>();
  for (const t of [...parsed.data.receptors, ...parsed.data.nonGpcrTargets]) {
    // A duplicated key would make `receptor_occupancy[].receptor` resolve to
    // whichever entry happened to be indexed last — one target wearing another's
    // gene and family. Nothing downstream could detect that, so it fails here.
    const prior = keys.get(t.key);
    if (prior) {
      throw new Error(`[registry] duplicate target key "${t.key}" (${prior} and ${t.name})`);
    }
    keys.set(t.key, t.name);
  }
  return parsed.data as ReceptorCatalog;
}

/** The whole registry from the three raw documents. The one entry point a gate
 *  or a consumer should use, so nothing can load two of the three and reason
 *  about cross-references it cannot see. */
export function loadRegistry(raw: {
  compounds: unknown;
  pathways: unknown;
  receptors: unknown;
}): Registry {
  return {
    compounds: loadCompounds(raw.compounds),
    pathways: loadPathways(raw.pathways),
    receptors: loadReceptors(raw.receptors),
  };
}
