/**
 * 2026-09-06-citation-defects.ts
 *
 * Repairs three provable citation defects caught by the new
 * `pk.shared-source-conflict` lint rule: pairs of records that are the SAME
 * molecule under two slugs, citing the SAME PMID, while storing different
 * numbers. One of each pair necessarily misstates its source, and that is the
 * exact failure the registry's no-fabrication rule exists to prevent. It
 * survived because nothing cross-checked two compounds against one citation.
 *
 * The principle applied throughout: keep what the abstract states verbatim,
 * drop what it does not. Dropped parameters fall through to resolvePk's
 * documented defaults, which is an honest "unknown" rather than a number
 * wearing someone else's citation. This does NOT merge the duplicate slugs —
 * intakes reference slugs and there is no alias-forwarding layer, so a merge
 * would orphan logged user data. See DATA_QUALITY_BACKLOG.md §7.
 *
 * ── 1. arginine / l-arginine, both citing PMID:9833603 ────────────────────
 * Bode-Böger 1998, "L-arginine-induced vasodilation in healthy humans:
 * pharmacokinetic-pharmacodynamic relationship", Br J Clin Pharmacol 46(5).
 * Eight healthy men; 30 g IV, 6 g IV, and 6 g oral arms. Verbatim:
 *
 *   "Oral bioavailability of L-arginine was 68+/-9 (51-87)%."
 *   "Clearance was 544+/-24 (440-620), 894+/-164 (470-1190), and 1018+/-230
 *    (710-2130) ml min(-1), and elimination half-life was calculated as
 *    41.6+/-2.3 (34-55), 59.6+/-9.1 (24-98), and 79.5+/-9.3 (50-121)"
 *
 * The three arms are 30 g IV, 6 g IV, 6 g PO in that order. So the paper
 * supports F = 0.68 and t½ = 79.5 min = 1.33 h oral, 59.6 min = 0.99 h at the
 * realistic 6 g IV dose. `l-arginine` stored 1.32 h (correct); `arginine`
 * stored 1.7 h on BOTH routes, which matches none of the three arms.
 *
 * The abstract states NO volume of distribution and NO Tmax, so neither ka nor
 * V_L is authorable from it — yet the two records stored ka 1.5 vs 1.0 and
 * V_L 28 vs 116 L under this one citation. (116 L looks like V/F recorded as
 * V; 28 L is closer to the ~0.3–0.5 L/kg expected of a polar amino acid. The
 * abstract cannot settle it, so this script does not guess.) Both are dropped.
 *
 * ── 2. cdp-choline / citicoline, both citing PMID:6412727 ─────────────────
 * Dinsdale 1983, "Pharmacokinetics of 14C CDP-choline", Arzneimittelforschung
 * 33(7A). Six adult healthy subjects, single 300 mg oral dose of the labelled
 * compound. The abstract reports absorption, metabolism and excretion in prose
 * and contains NO ka, NO volume, NO bioavailability and NO half-life — only
 * that "Absorption was virtually complete with less than 1% of the dose being
 * found in the faeces" and that plasma radioactivity peaked "at 1 h, and a
 * second larger peak at 24 h post-dose".
 *
 * So the stored ka (0.8 vs 0.4), V_L (35 vs 25), F (0.99 vs 1.0) and the
 * 56 h half-life on both records are ALL uncited by the paper they point at.
 * A search of the citicoline PK literature (PMID:8709678 and PMID:17171187,
 * the Secades reviews) found only the same qualitative statement — "absorption
 * by the oral route is virtually complete, and bioavailability by the oral
 * route is therefore approximately the same as by the intravenous route" —
 * with no numeric parameter, and both are reviews rather than primaries.
 * The citation is removed from both routes; the values stay as the unsourced
 * modelling estimates they always were, now visible as such to data-lint.
 *
 * ── 3. cortisol / hydrocortisone IM, both citing PMID:23672956 ────────────
 * Hahner 2013, "Subcutaneous hydrocortisone administration for emergency use
 * in adrenal insufficiency", Eur J Endocrinol 169(2). Twelve Addison's
 * patients, 100 mg hydrocortisone s.c. vs i.m. It reports only Cmax
 * ("110+/-29 vs 97+/-28 microg/dl"), tmax ("66+/-51 vs 91+/-34 min") and time
 * to a serum-cortisol threshold. No volume, no half-life, no bioavailability,
 * and no absorption rate constant.
 *
 * A ka derived from the paper's IM tmax would be defensible, but the two
 * records derive DIFFERENT values (1.89 vs 1.58 /h) from that one tmax, which
 * proves at least one derivation is wrong; their V_L (35 vs 30 L) and t½
 * (2 vs 1.5 h) come from elsewhere entirely — each record picked up a
 * different source for one molecule. The citation is removed from both IM
 * routes and the derivation is left as a documented opportunity in
 * AUTHORING_GAPS.md rather than guessed at here.
 *
 * Idempotent: each edit checks the current value before writing.
 * Dry-run by default; pass --write to apply to compounds.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string; [k: string]: unknown }
interface Compound {
  slug: string;
  half_life_hr?: Record<string, number>;
  pk?: Record<string, RoutePk | undefined>;
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const bySlug = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];

/** Set a half-life to the value its own cited abstract states. */
function setHalfLife(slug: string, route: string, hours: number, why: string) {
  const c = bySlug.get(slug);
  if (!c) { log.push(`! ${slug} — NOT IN REGISTRY`); return; }
  const cur = c.half_life_hr?.[route];
  if (cur === hours) { log.push(`= ${slug}.${route} t½ already ${hours} h`); return; }
  c.half_life_hr = { ...(c.half_life_hr ?? {}), [route]: hours };
  log.push(`~ ${slug}.${route} t½ ${cur} → ${hours} h (${why})`);
}

/** Drop a stored parameter the cited abstract does not contain. */
function dropParams(slug: string, route: string, fields: (keyof RoutePk)[], why: string) {
  const c = bySlug.get(slug);
  const pk = c?.pk?.[route];
  if (!pk) { log.push(`! ${slug}.${route} — no pk entry`); return; }
  const removed: string[] = [];
  for (const f of fields) {
    if (pk[f] !== undefined) { removed.push(`${String(f)}=${String(pk[f])}`); delete pk[f]; }
  }
  log.push(removed.length
    ? `- ${slug}.${route} dropped ${removed.join(', ')} (${why})`
    : `= ${slug}.${route} nothing to drop`);
}

// ── 1. arginine / l-arginine ────────────────────────────────────────────────
// Half-lives corrected to the arms the abstract names; ka and V dropped
// because the abstract states neither.
setHalfLife('arginine', 'PO', 1.33, 'PMID:9833603 6 g oral arm, 79.5 min');
setHalfLife('arginine', 'IV', 0.99, 'PMID:9833603 6 g IV arm, 59.6 min');
setHalfLife('l-arginine', 'PO', 1.33, 'PMID:9833603 6 g oral arm, 79.5 min');
dropParams('arginine', 'PO', ['ka_hr', 'V_L'], 'no Tmax or Vd in PMID:9833603');
dropParams('arginine', 'IV', ['V_L'], 'no Vd in PMID:9833603');
dropParams('l-arginine', 'PO', ['ka_hr', 'V_L'], 'no Tmax or Vd in PMID:9833603');

// ── 2. cdp-choline / citicoline ─────────────────────────────────────────────
// The cited abstract carries no numeric PK at all, so the citation goes.
dropParams('cdp-choline', 'PO', ['source_pmid'], 'PMID:6412727 states no ka/V/F/t½');
dropParams('citicoline', 'PO', ['source_pmid'], 'PMID:6412727 states no ka/V/F/t½');

// ── 3. cortisol / hydrocortisone IM ─────────────────────────────────────────
// The cited abstract reports Cmax/tmax only; every stored IM parameter is
// from somewhere else.
dropParams('cortisol', 'IM', ['source_pmid'], 'PMID:23672956 reports only Cmax/tmax');
dropParams('hydrocortisone', 'IM', ['source_pmid'], 'PMID:23672956 reports only Cmax/tmax');

for (const line of log) console.log(`   ${line}`);

if (WRITE) {
  writeFileSync(COMPOUNDS_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`\nWROTE ${COMPOUNDS_PATH}`);
} else {
  console.log('\nDry run — pass --write to apply.');
}
