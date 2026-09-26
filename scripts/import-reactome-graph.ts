/**
 * import-reactome-graph.ts — harvest a Reactome pathway into three layers,
 * with every PMID verified via NCBI eutils. Nothing is discarded:
 *
 *   cascade    — the core substrate→product flow (reactions NOT under a
 *                "regulation"-type sub-pathway), normalized by
 *                referenceEntity → the clean overview nodes/edges.
 *   regulators — actors from Reactome's regulation sub-pathways
 *                (the PTEN miRNA/TF regulome) + explicit `regulatedBy`,
 *                each with sign (inhibits/activates), mechanism, PMID.
 *   citations  — the verified PMID set.
 *
 *   pnpm exec tsx scripts/import-reactome-graph.ts R-HSA-1257604 [outSlug]
 *
 * Writes scripts/out/<outSlug>.layers.json + <outSlug>.review.md. Does
 * NOT touch pathways.json.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const RCS = 'https://reactome.org/ContentService';
const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const REGULATION_RX = /regulat|transcription|degrad|mirna|microrna|silencing|ubiquitin/i;

const COFACTORS = new Set([
  'atp',
  'adp',
  'amp',
  'gtp',
  'gdp',
  'gmp',
  'utp',
  'udp',
  'pi',
  'ppi',
  'orthophosphate',
  'diphosphate',
  'phosphate',
  'h2o',
  'h+',
  'o2',
  'co2',
  'hco3-',
  'nad+',
  'nadh',
  'nadp+',
  'nadph',
  'fad',
  'fadh2',
  'coa',
  'coenzyme a',
  'na+',
  'k+',
  'ca2+',
  'mg2+',
  'cl-',
  'zn2+',
  'mn2+',
  'cu2+',
]);

// Explicit, reviewed curation map for PI3K (keyed by the importer's raw
// node ids). Collapses Reactome's phosphoform/complex variants to one node
// each — every entry hand-verified to merge only genuinely-the-same species.
const PI3K_MERGE: Record<string, { id: string; label: string }> = {
  'n:akt-pip3': { id: 'akt', label: 'AKT' },
  'n:p-s-akt-pip3': { id: 'akt', label: 'AKT' },
  'n:p-t-p-s-akt': { id: 'akt', label: 'AKT' },
  'n:pdpk1-pip3': { id: 'pdk1', label: 'PDK1' },
  'n:n-m-pdpk1': { id: 'pdk1', label: 'PDK1' },
  'p:O15530': { id: 'pdk1', label: 'PDK1' },
  'n:pdpk1-pip2': { id: 'pdk1', label: 'PDK1' },
  'n:rac1-gtp-rac2-gtp-rhog-gtp-pi3k-alpha': { id: 'pi3k', label: 'PI3K (active)' },
  'n:activator-pi3k': { id: 'pi3k', label: 'PI3K (active)' },
  'n:rac1-gtp-rac2-gtp-rhog-gtp': { id: 'rac-gtp', label: 'RAC1/2·RHOG-GTP' },
  'm:58456': { id: 'pip2', label: 'PIP2' },
  'm:57836': { id: 'pip3', label: 'PIP3' },
  'n:gsk3': { id: 'gsk3', label: 'GSK-3' },
  'n:p-s9-21-gsk3': { id: 'gsk3', label: 'GSK-3' },
  'n:cdkn1a-cdkn1b': { id: 'cdkn1', label: 'p21/p27' },
  'n:p-t-cdkn1a-b': { id: 'cdkn1', label: 'p21/p27' },
  'n:foxo1-foxo3-foxo4-foxo6': { id: 'foxo', label: 'FoxO1/3/4' },
  'n:p-t24-s256-s319-foxo1-p-t32-s253-s315-foxo3-p-t32-s197-s262-': {
    id: 'foxo',
    label: 'FoxO1/3/4',
  },
  'n:mtorc2-pip3': { id: 'mtorc2', label: 'mTORC2' },
};
// Dropped: the IL33 immune complex (a mis-picked context participant, never
// part of PI3K), and the transient AKT:PDK1:PIP3 binding intermediate (mapping
// it to either protein would invent a wrong AKT↔PDK1 edge).
const PI3K_DROP = new Set([
  'n:il33-il1rl1-il1rap-1-myd88-dimer-irak1-irak4-traf6',
  'n:p-s-akt-pdpk1-pip3',
]);

async function rfetch(path: string): Promise<any> {
  const url = path.startsWith('http') ? path : `${RCS}${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const cleanLabel = (s: unknown): string =>
  String(s ?? '')
    .replace(/\s*\[[^\]]*\]\s*$/, '')
    .trim();
const isCofactor = (label: string): boolean => COFACTORS.has(String(label ?? '').toLowerCase());
const idOf = (label: unknown): string =>
  String(label ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Traverse the event hierarchy DOWNWARD from the root via /query.hasEvent
// (re-fetching each sub-pathway), recording each reaction with its ancestor
// sub-pathway names. /containedEvents is flat-with-eventOf and loses the
// clean parent→child direction, so we walk down explicitly.
async function traverse(
  stId: string,
  ancestors: string[],
  acc: Map<string, { event: any; ancestors: string[] }>,
  seen: Set<string>,
): Promise<void> {
  if (seen.has(stId)) return;
  seen.add(stId);
  const q = await rfetch(`/data/query/${stId}`);
  for (const child of q.hasEvent ?? []) {
    const sc: string = child.schemaClass || child.className || '';
    if (/Reaction|BlackBoxEvent|Polymerisation|Depolymerisation/.test(sc)) {
      if (!acc.has(child.stId)) acc.set(child.stId, { event: child, ancestors });
    } else {
      await traverse(
        child.stId,
        [...ancestors, child.displayName || child.name?.[0] || ''],
        acc,
        seen,
      );
      await sleep(30);
    }
  }
}

function canonicalize(part: any): { id: string; label: string } {
  const clean = cleanLabel(part.displayName);
  const re = part.refEntities?.[0];
  if (part.schemaClass === 'EntityWithAccessionedSequence' && re) {
    const gene =
      String(re.displayName || '')
        .split(/\s+/)
        .pop() || clean;
    return { id: 'p:' + (re.identifier || gene), label: gene };
  }
  if (part.schemaClass === 'SimpleEntity' && re) {
    return { id: 'm:' + (re.identifier || idOf(clean)), label: clean };
  }
  return { id: 'n:' + idOf(clean), label: clean };
}

async function verifyPmids(pmids: string[]): Promise<Set<string>> {
  const ok = new Set<string>();
  for (let i = 0; i < pmids.length; i += 180) {
    const batch = pmids.slice(i, i + 180);
    const j = await rfetch(`${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${batch.join(',')}`);
    const res = j.result ?? {};
    for (const id of batch) if (res[id] && !res[id].error && res[id].uid) ok.add(id);
    await sleep(350);
  }
  return ok;
}

async function main() {
  const stId = process.argv[2] || 'R-HSA-1257604';
  const outSlug = process.argv[3] || `reactome-${stId.toLowerCase()}`;

  const rxMap = new Map<string, { event: any; ancestors: string[] }>();
  await traverse(stId, [], rxMap, new Set<string>());
  console.log(`reactions under ${stId}: ${rxMap.size}`);

  const partCanon = new Map<number, { id: string; label: string }>();
  const nodeLabel = new Map<string, string>();
  const cascadeEdges = new Map<string, any>();
  const regulators: any[] = [];
  const allPmids = new Set<string>();
  let nCascadeRx = 0;
  let nRegRx = 0;

  let n = 0;
  for (const [rxStId, { ancestors }] of rxMap) {
    const isRegulation = ancestors.some((a) => REGULATION_RX.test(a));
    const [q, parts] = await Promise.all([
      rfetch(`/data/query/${rxStId}`),
      rfetch(`/data/participants/${rxStId}`),
    ]);
    for (const p of parts ?? []) {
      const c = canonicalize(p);
      partCanon.set(p.peDbId, c);
      if (c.label) nodeLabel.set(c.id, c.label);
    }
    const resolve = (e: any) =>
      partCanon.get(e.dbId) ??
      canonicalize({ schemaClass: e.className, displayName: e.displayName, refEntities: [] });
    const ins = (q.input ?? []).map(resolve).filter((c: any) => c.label && !isCofactor(c.label));
    const outs = (q.output ?? []).map(resolve).filter((c: any) => c.label && !isCofactor(c.label));
    // catalystActivity.physicalEntity is empty at /query depth. The catalyst
    // is in participants (neither input nor output) — but a reaction can have
    // several such context participants, so require the catalyst's name to be
    // referenced in the reaction TITLE ("PI3K phosphorylates…" → Activator:PI3K,
    // not the unrelated IL33 complex). No title match → no enzyme (never guess).
    const ioDb = new Set([...(q.input ?? []), ...(q.output ?? [])].map((e: any) => e.dbId));
    const rxName = String(q.displayName ?? '').toLowerCase();
    const catPart = (parts ?? []).find((p: any) => {
      if (ioDb.has(p.peDbId) || isCofactor(cleanLabel(p.displayName))) return false;
      return cleanLabel(p.displayName)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .some((tok: string) => tok.length >= 3 && rxName.includes(tok));
    });
    const catalyst = catPart ? canonicalize(catPart) : null;
    if (catalyst?.label) nodeLabel.set(catalyst.id, catalyst.label);
    const location = (q.compartment ?? []).map((c: any) => c.displayName)[0];
    const pmid = (q.literatureReference ?? [])
      .map((r: any) => String(r.pubMedIdentifier))
      .filter((p: string) => /^\d+$/.test(p))[0];
    if (pmid) allPmids.add(pmid);

    if (isRegulation) {
      nRegRx++;
      const layer =
        ancestors.find((a) => REGULATION_RX.test(a)) || ancestors[ancestors.length - 1] || '';
      const sign = /negative/i.test(layer)
        ? 'inhibits'
        : /positive/i.test(layer)
          ? 'activates'
          : 'regulates';
      const actor = ins[0]?.label;
      if (actor) regulators.push({ actor, sign, mechanism: q.displayName, layer, pmid });
    } else {
      nCascadeRx++;
      const from = ins[0];
      const to = outs[0];
      const addEdge = (f: any, t: any) => {
        if (!f || !t || f.id === t.id || !f.label || !t.label) return;
        const key = f.id + '>' + t.id;
        const cur = cascadeEdges.get(key);
        // No separate enzyme field — the reaction-title label carries the
        // mechanism, and catalyst→product edges already put the enzyme as
        // the source node. (Avoids any enzyme-label mis-attribution.)
        if (!cur)
          cascadeEdges.set(key, {
            from: f.id,
            to: t.id,
            label: q.displayName,
            location,
            role: 'signal',
            pmid,
          });
        else if (!cur.pmid && pmid) cur.pmid = pmid;
      };
      // catalyst → product (AKT → BAD) connects the hub to its effectors;
      // substrate → product carries the recruitment/metabolic backbone.
      if (catalyst && to) addEdge(catalyst, to);
      addEdge(from, to);
    }
    // Explicit regulators (signed) on any reaction.
    for (const reg of q.regulatedBy ?? []) {
      const rc = reg.regulator
        ? (partCanon.get(reg.regulator.dbId) ??
          canonicalize({
            schemaClass: reg.regulator.className,
            displayName: reg.regulator.displayName,
            refEntities: [],
          }))
        : null;
      if (rc?.label) {
        regulators.push({
          actor: rc.label,
          sign: /Negative/.test(reg.className)
            ? 'inhibits'
            : /Positive/.test(reg.className)
              ? 'activates'
              : 'regulates',
          mechanism: q.displayName,
          layer: 'regulatedBy',
          pmid,
        });
      }
    }
    if (++n % 12 === 0) console.log(`  …${n}/${rxMap.size}`);
    await sleep(40);
  }

  const verified = await verifyPmids([...allPmids]);
  for (const e of cascadeEdges.values()) if (e.pmid && !verified.has(e.pmid)) e.pmid = undefined;
  for (const r of regulators) if (r.pmid && !verified.has(r.pmid)) r.pmid = undefined;

  // Dedup regulators by actor+mechanism.
  const regSeen = new Set<string>();
  const regs = regulators.filter((r) => {
    const k = r.actor + '|' + r.mechanism;
    if (regSeen.has(k)) return false;
    regSeen.add(k);
    return true;
  });

  // Cascade nodes (only those in an edge) + kind inference.
  const edges = [...cascadeEdges.values()];
  const used = new Set<string>();
  for (const e of edges) {
    used.add(e.from);
    used.add(e.to);
  }
  const nodes: any[] = [...used].map((id) => ({
    id,
    label: nodeLabel.get(id) ?? id,
    kind: 'signal',
  }));
  const inDeg = new Map<string, number>(),
    outDeg = new Map<string, number>();
  for (const nd of nodes) {
    inDeg.set(nd.id, 0);
    outDeg.set(nd.id, 0);
  }
  for (const e of edges) {
    outDeg.set(e.from, (outDeg.get(e.from) ?? 0) + 1);
    inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
  }
  let hub: string | null = null,
    ho = -1;
  for (const nd of nodes) {
    const o = outDeg.get(nd.id) ?? 0;
    if (o > ho) {
      ho = o;
      hub = nd.id;
    }
  }
  for (const nd of nodes) {
    const i = inDeg.get(nd.id) ?? 0,
      o = outDeg.get(nd.id) ?? 0;
    nd.kind = i === 0 ? 'input' : o === 0 ? 'outcome' : nd.id === hub && ho >= 2 ? 'hub' : 'signal';
  }

  const out = { cascade: { nodes, edges }, regulators: regs, citations: [...verified] };
  const outDir = join(process.cwd(), 'scripts', 'out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${outSlug}.layers.json`), JSON.stringify(out, null, 2));
  // Apply the explicit PI3K merge/drop map → clean cascade. Edges are kept
  // only between surviving merged nodes; self-loops (intra-protein phospho
  // steps) drop out. No enzyme field, no chips — correctness over polish.
  const remap = (id: string) => PI3K_MERGE[id]?.id ?? id;
  const mergedNodes = new Map<string, any>();
  for (const nd of nodes) {
    if (PI3K_DROP.has(nd.id)) continue;
    const mid = remap(nd.id);
    if (!mergedNodes.has(mid))
      mergedNodes.set(mid, { id: mid, label: PI3K_MERGE[nd.id]?.label ?? nd.label, kind: nd.kind });
  }
  const mergedEdges = new Map<string, any>();
  for (const e of edges) {
    if (PI3K_DROP.has(e.from) || PI3K_DROP.has(e.to)) continue;
    const f = remap(e.from);
    const t = remap(e.to);
    if (f === t || !mergedNodes.has(f) || !mergedNodes.has(t)) continue;
    const key = f + '>' + t;
    if (!mergedEdges.has(key))
      mergedEdges.set(key, {
        from: f,
        to: t,
        label: e.label,
        location: e.location,
        role: e.role,
        pmid: e.pmid,
      });
    else if (!mergedEdges.get(key).pmid && e.pmid) mergedEdges.get(key).pmid = e.pmid;
  }
  const mNodes = [...mergedNodes.values()];
  const mEdges = [...mergedEdges.values()];
  const inD = new Map<string, number>();
  const outD = new Map<string, number>();
  for (const nd of mNodes) {
    inD.set(nd.id, 0);
    outD.set(nd.id, 0);
  }
  for (const e of mEdges) {
    outD.set(e.from, (outD.get(e.from) ?? 0) + 1);
    inD.set(e.to, (inD.get(e.to) ?? 0) + 1);
  }
  let mh: string | null = null;
  let mho = -1;
  for (const nd of mNodes) {
    const o = outD.get(nd.id) ?? 0;
    if (o > mho) {
      mho = o;
      mh = nd.id;
    }
  }
  for (const nd of mNodes) {
    const i = inD.get(nd.id) ?? 0;
    const o = outD.get(nd.id) ?? 0;
    nd.kind = i === 0 ? 'input' : o === 0 ? 'outcome' : nd.id === mh && mho >= 2 ? 'hub' : 'signal';
  }
  // Hub fan-out edges carry no rendered label — 13 long reaction names around
  // one node is unreadable, and the arrow + target already say "hub acts on
  // target". Spine edges (low out-degree source) keep their mechanism label.
  for (const e of mEdges) if ((outD.get(e.from) ?? 0) >= 4) delete e.label;
  const overlay = { nodes: mNodes, edges: mEdges };
  writeFileSync(join(outDir, `${outSlug}.overlay.json`), JSON.stringify(overlay, null, 2));
  console.log(`MERGED overlay: ${mNodes.length} nodes / ${mEdges.length} edges`);

  let md = `# ${outSlug} — Reactome three-layer import (${stId})\n\n`;
  md += `cascade: ${nodes.length} nodes / ${edges.length} edges (from ${nCascadeRx} reactions)\n`;
  md += `regulators: ${regs.length} (from ${nRegRx} regulation reactions + regulatedBy)\n`;
  md += `citations: ${verified.size}/${allPmids.size} PMIDs verified\n\n`;
  md += `## Cascade (the clean overview)\n\n`;
  for (const e of edges)
    md += `- ${nodeLabel.get(e.from)} → ${nodeLabel.get(e.to)}  ·  ${e.enzyme || '—'}  ·  ${e.pmid ? 'PMID ' + e.pmid : '—'}\n`;
  md += `\n## Regulators (the captured payload)\n\n`;
  for (const r of regs.slice(0, 60))
    md += `- **${r.actor}** ${r.sign} — ${r.mechanism}  ${r.pmid ? '(PMID ' + r.pmid + ')' : ''}  _[${r.layer}]_\n`;
  writeFileSync(join(outDir, `${outSlug}.review.md`), md);

  console.log(
    `\nCASCADE ${nodes.length} nodes / ${edges.length} edges | REGULATORS ${regs.length} | CITATIONS ${verified.size}/${allPmids.size}`,
  );
  console.log(
    'cascade kinds:',
    JSON.stringify(
      nodes.reduce((a: any, nd: any) => ((a[nd.kind] = (a[nd.kind] || 0) + 1), a), {}),
    ),
  );
  console.log('cascade edges:');
  for (const e of edges)
    console.log(
      `  ${nodeLabel.get(e.from)} → ${nodeLabel.get(e.to)}  [${e.enzyme || '—'}] pmid=${e.pmid || '-'}`,
    );
  console.log('sample regulators:');
  for (const r of regs.slice(0, 12))
    console.log(`  ${r.actor} ${r.sign} — ${r.mechanism} ${r.pmid ? '(pmid ' + r.pmid + ')' : ''}`);
  console.log(`\nwrote scripts/out/${outSlug}.layers.json + ${outSlug}.review.md`);
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
