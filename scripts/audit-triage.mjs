#!/usr/bin/env node
/**
 * audit-triage.mjs — which compounds still need a PK audit, and which look riskiest.
 *
 * Run from the repo root:  node scripts/audit-triage.mjs [category]
 * Default category: pharmacological.
 *
 * ── WHY THIS LIVES IN THE REPO NOW ────────────────────────────────────────
 * For ten batches the script that decided WHAT HAD BEEN AUDITED lived in a
 * scratch directory, so it was neither reviewable nor reproducible — and it was
 * wrong. It built its "already done" set by grepping `slug: '…'` out of
 * scripts/authoring, which matches the FIXES/PATCH table style and misses every
 * record a batch reached through `need('slug')`, an inline block, or a
 * `[slug, …]` tuple. On 2026-09-08 it reported 24 pharmacological records as
 * unaudited; SEVEN already carried full audit notes from earlier batches and
 * six more had just been done in the same session. The detection was the bug.
 *
 * It now scans every authoring script for any single-quoted string that is also
 * a real slug, which over-matches slightly (a slug named in prose counts as
 * audited) — the right direction to err, because a false "done" is caught the
 * moment someone opens the record, while a false "todo" wastes a whole agent.
 *
 * The score is a RISK HEURISTIC for ordering work, not a defect count. Its
 * signals are the defect classes this audit actually found: shared citations,
 * template quartets, round/midpoint-shaped values, one half-life copied across
 * routes, label-only provenance, and occupancy authored over a low-F route.
 */
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('packages/registry/data/compounds.json', 'utf8'));

const CATEGORY = process.argv[2] ?? 'pharmacological';
const allSlugs = new Set(d.map((c) => c.slug));

// Every authoring script counts, not a hand-maintained filename pattern: a
// record audited by a pass this list forgot to name reads as unaudited forever.
const done = new Set();
for (const f of fs.readdirSync('scripts/authoring').filter((x) => /\.(ts|mjs|js)$/.test(x))) {
  const s = fs.readFileSync('scripts/authoring/' + f, 'utf8');
  for (const m of s.matchAll(/'([a-z0-9][a-z0-9-]{1,63})'/g)) {
    if (allSlugs.has(m[1])) done.add(m[1]);
  }
}

// cross-record signals
const pmidUse = new Map(); // source_pmid -> #compounds using it as PK provenance
const quartet = new Map(); // "V|F|t½" fingerprint -> slugs
for (const c of d) {
  const seen = new Set();
  for (const [r, p] of Object.entries(c.pk ?? {})) {
    if (p.source_pmid && !seen.has(p.source_pmid)) {
      seen.add(p.source_pmid);
      pmidUse.set(p.source_pmid, (pmidUse.get(p.source_pmid) ?? 0) + 1);
    }
    const t = (c.half_life_hr ?? {})[r];
    if (p.V_L != null && p.F != null && t != null) {
      const k = `${p.V_L}|${p.F}|${t}`;
      quartet.set(k, [...(quartet.get(k) ?? []), c.slug]);
    }
  }
}

const rows = [];
for (const c of d) {
  if (c.category !== CATEGORY) continue;
  if (!c.pk || !Object.keys(c.pk).length) continue;
  if (done.has(c.slug)) continue;

  let score = 0;
  const why = [];
  const routes = Object.entries(c.pk);
  const hl = c.half_life_hr ?? {};

  const kaRoutes = routes.filter(([r, p]) => r !== 'IV' && p.ka_hr != null);
  if (kaRoutes.length) {
    score += 2;
    why.push(`ka×${kaRoutes.length}`);
  }

  // one citation doing duty across an IV and an extravascular route
  const ivP = c.pk.IV?.source_pmid;
  if (ivP && routes.some(([r, p]) => r !== 'IV' && p.source_pmid === ivP)) {
    score += 3;
    why.push('IV+EV share one PMID');
  }

  // apparent volume beside an independent F
  for (const [r, p] of routes) {
    if (r !== 'IV' && p.F != null && p.F < 1 && p.V_L != null) {
      score += 2;
      why.push(`V/F pair ${r}`);
      break;
    }
  }

  // a source used as PK provenance on several unrelated compounds
  for (const [, p] of routes) {
    const n = pmidUse.get(p.source_pmid) ?? 0;
    if (n >= 3) {
      score += 2;
      why.push(`PMID on ${n} records`);
      break;
    }
  }

  // byte-identical {V,F,t½} shared with another compound
  for (const [r, p] of routes) {
    const t = hl[r];
    if (p.V_L == null || p.F == null || t == null) continue;
    const g = quartet.get(`${p.V_L}|${p.F}|${t}`) ?? [];
    const others = [...new Set(g)].filter((s) => s !== c.slug);
    if (others.length) {
      score += 3;
      why.push(`quartet shared with ${others.join('/')}`);
      break;
    }
  }

  // round numbers: midpoint / template tells
  const roundV = routes.some(([, p]) => p.V_L != null && p.V_L >= 10 && p.V_L % 10 === 0);
  const roundF = routes.some(
    ([, p]) => p.F != null && p.F < 1 && Math.round(p.F * 20) === p.F * 20,
  );
  const roundT = Object.values(hl).some((t) => Number.isInteger(t));
  if (roundV) {
    score += 1;
    why.push('round V');
  }
  if (roundF) {
    score += 1;
    why.push('round F');
  }
  if (roundT) {
    score += 1;
    why.push('integer t½');
  }

  // one half-life copied across routes
  const hs = Object.values(hl);
  if (hs.length > 1 && new Set(hs).size === 1) {
    score += 2;
    why.push('t½ identical across routes');
  }

  if (routes.length >= 3) {
    score += 1;
    why.push(`${routes.length} routes`);
  }
  if (routes.some(([, p]) => p.source_label && !p.source_pmid)) {
    score += 1;
    why.push('label-only row');
  }

  const ec = c.effect_compartment;
  if (ec) {
    score += 1;
    why.push(ec.approximated ? 'keo estimated' : 'keo fitted');
  }

  const ro = (c.receptor_occupancy ?? []).length;
  if (ro) {
    const minF = Math.min(...routes.filter(([r]) => r !== 'IV').map(([, p]) => p.F ?? 1));
    if (minF <= 0.2) {
      score += 2;
      why.push(`occupancy rows with F=${minF}`);
    } else {
      score += 1;
      why.push(`${ro} occupancy rows`);
    }
  }

  rows.push({ slug: c.slug, score, why: why.join('; ') });
}

rows.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
console.log(`${rows.length} unaudited ${CATEGORY} compounds with PK\n`);
rows
  .slice(0, 70)
  .forEach((r, i) =>
    console.log(`${String(i + 1).padStart(2)}. ${r.score}  ${r.slug.padEnd(24)} ${r.why}`),
  );
console.log(
  '\nscore distribution:',
  JSON.stringify(rows.reduce((a, r) => ((a[r.score] = (a[r.score] ?? 0) + 1), a), {})),
);
