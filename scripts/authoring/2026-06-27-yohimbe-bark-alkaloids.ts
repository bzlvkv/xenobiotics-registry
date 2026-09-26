/**
 * 2026-06-27-yohimbe-bark-alkaloids.ts
 *
 * Breadth wave — the minor indole alkaloids (and the tannin fraction) of yohimbe
 * bark, Pausinystalia johimbe (syn. Corynanthe johimbe). The registry already had
 * `yohimbine`; this adds its co-occurring congeners.
 *
 * Discovery + verification was done by a parallel literature workflow (6-angle
 * phytochemistry sweep → canonicalize → per-compound PubChem identity + adversarial
 * NCBI/PubChem verification), then EVERY surviving entry was re-verified
 * deterministically here: each PubChem CID was re-fetched for MolecularWeight /
 * MolecularFormula / Title (all match below, ±0.2), and every PMID was confirmed
 * to resolve at NCBI esummary (titles checked). MWs are PubChem (CID in each
 * `notes`). No receptor_occupancy / keo is authored for any entry — see "Receptor
 * occupancy" note below.
 *
 * ── New compounds (13) ─────────────────────────────────────────────────────
 *
 * Abstract-NAMED in a yohimbe paper (presence directly cited):
 *   corynanthine        C-16 epimer of yohimbine; α₁-preferring antagonist (qual., PMID:6111465).
 *                       Present: PMID:22221902, PMID:26391406.
 *   rauwolscine         α-yohimbine; selective α₂ antagonist (qual., PMID:6142941).
 *                       Present: PMID:26391406. (PubChem syn: corynanthidine / isoyohimbine.)
 *   ajmalicine          raubasine / δ-yohimbine; α₁-preferring antagonist (pithed rat, PMID:3021076).
 *                       Present: PMID:23657953, PMID:25905738.
 *   yohimbinic-acid     free-acid analog of yohimbine. Present: PMID:25905738.
 *   hydroxyyohimbine    generic monohydroxy-yohimbine ("hydroxyl yohimbine"). Present: PMID:25905738.
 *
 * Reported in a yohimbe-bark LC-MS/isolation PROFILE (class named in-abstract,
 * the individual species enumerated in the paper's tables — cited as such):
 *   beta-yohimbine          (= amsonine)            PMID:30059216
 *   pseudoyohimbine         (ψ-yohimbine)           PMID:23657953
 *   alloyohimbine                                    PMID:30059216
 *   corynantheine           (genus-namesake)        PMID:23657953
 *   dihydrocorynantheine                             PMID:23657953
 *   corynantheidine         (also a kratom alkaloid) PMID:23657953
 *   dihydrositsirikine                               PMID:23657953, PMID:30059216
 *
 * Tannin fraction (class-mixture entry, cf. valepotriates):
 *   yohimbe-tannins     condensed tannins / proanthocyanidins. No single MW
 *                       (pk_unauthored: mixture). No PubMed-indexed primary abstract
 *                       names specific P. johimbe proanthocyanidins (pharmacognosy +
 *                       EFSA describe them generically) → refs left empty rather than
 *                       cite a non-primary source. Building-block flavan-3-ols
 *                       (catechin, epicatechin, procyanidin-b2) already in registry.
 *
 * ── Investigated & SKIPPED (logged in AUTHORING_GAPS.md, 2026-06-27) ────────
 *   methyl-yohimbine                no resolvable PubChem record (name ambiguous: "methyl
 *                                   yohimbine" in PMID:25905738 not tied to a CID/MW).
 *   19-dehydroyohimbine             no PubChem record; NCBI pccompound esearch Count=0.
 *   tetrahydromethylcorynantheine   no PubChem record (control names resolved; this did not)
 *                                   — likely a mis-parsed LC-MS label, not a real entity.
 *   calycanthine                    identity real (CID 5392245) but a dimeric NON-yohimbane
 *                                   tryptamine; presence in P. johimbe not verifiable.
 *   ajmaline                        identity real (CID 6100671) but a Rauwolfia alkaloid;
 *                                   presence in P. johimbe not verifiable.
 *   epicatechocorynantheine-a/-b,   real flavoalkaloids (CIDs 146035642 / 146035632 /
 *   epicatechocorynantheidine       146035606) but isolated from Corynanthe pachyceras,
 *                                   NOT Pausinystalia johimbe (PMID:32517373) — out of scope
 *                                   for a yohimbe-constituent wave.
 *
 * ── Receptor occupancy — none authored (the tables-vs-abstracts ceiling) ────
 * The famous selectivity contrasts (corynanthine α₁ vs yohimbine α₂; rauwolscine
 * α₂; ajmalicine α₁) are real but QUALITATIVE in their abstracts — no verbatim
 * Ki/IC50/EC50 for the named minor alkaloid appears in any accessible abstract
 * (PMID:6111465, PMID:6142941, PMID:3021076 give selectivity/dose-response, not a
 * named number). PMID:35224877 uses [³H]rauwolscine as a radioligand and reports a
 * saturation Kd only in figures/body text. Under the no-fabrication rule every
 * entry lands as a verified skeleton (PubChem identity + sourced presence-in-yohimbe
 * + mechanism), with pk_unauthored:'research-only'. Re-author targets in
 * AUTHORING_GAPS.md (need full-text affinity tables).
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
  category?: string;
  mechanism?: string;
  routes?: string[];
  doses?: Record<string, { min: number; max: number; typical: number; unit?: string }>;
  half_life_hr?: Record<string, number>;
  mw_g_mol?: number;
  systems?: string[];
  pk_unauthored?: { reason: string; note?: string };
  interactions?: Array<{ slug: string; name: string; level: string; note: string }>;
  notes?: string;
  refs?: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  // ── Yohimbine stereoisomers / congeners (presence abstract-named) ─────────
  {
    slug: 'corynanthine',
    name: 'Corynanthine',
    aliases: ['Rauhimbine', 'Corynanthin'],
    category: 'alkaloid',
    mechanism:
      'A minor indole alkaloid of yohimbe bark (Pausinystalia johimbe) and the C-16 epimer of yohimbine. Unlike yohimbine’s α₂ selectivity, corynanthine preferentially antagonises α₁-adrenoceptors — it has higher affinity for α₁ than α₂, the reverse of yohimbine (qualitative rat cerebral-membrane binding, PMID:6111465). Its human clinical pharmacology and PK are not characterised.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 354.4,
    systems: ['nervous', 'cardiovascular'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Minor yohimbe-bark alkaloid (yohimbine C-16 epimer); no clinical PK. α₁-preferring selectivity is qualitative (PMID:6111465) — no verbatim Ki in any abstract.',
    },
    notes:
      'PubChem CID 92766 (C21H26N2O3, MW 354.4). Present in yohimbe bark: PMID:22221902 (chromatographic method separating corynanthine from yohimbine in bark extract) + PMID:26391406 (one of three P. johimbe alkaloids quantified in US supplements).',
    refs: ['PMID:22221902', 'PMID:26391406', 'PMID:6111465'],
  },
  {
    slug: 'rauwolscine',
    name: 'Rauwolscine',
    aliases: ['α-Yohimbine', 'alpha-Yohimbine', 'Isoyohimbine', 'Corynanthidine'],
    category: 'alkaloid',
    mechanism:
      'A minor indole alkaloid of yohimbe bark (Pausinystalia johimbe) and a diastereomer of yohimbine on the pentacyclic yohimban skeleton. It is a selective α₂-adrenoceptor antagonist, markedly more potent and selective at α₂ than at α₁ adrenoceptors (PMID:6142941). Widely used as a pharmacological α₂-antagonist tool and sold in supplements as "α-yohimbine".',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 354.4,
    systems: ['nervous', 'cardiovascular'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Minor yohimbe-bark alkaloid (α-yohimbine); no clinical PK. α₂ selectivity is qualitative (PMID:6142941) — no verbatim Ki in the abstract.',
    },
    notes:
      'PubChem CID 643606 (C21H26N2O3, MW 354.4). Present in yohimbe bark: PMID:26391406 quantifies it as one of three P. johimbe alkaloids in US supplements. PubChem synonyms confirm α-yohimbine / isoyohimbine / corynanthidine (NB: "corynanthidine" = rauwolscine, distinct from the separate alkaloid corynantheidine).',
    refs: ['PMID:26391406', 'PMID:6142941'],
  },
  {
    slug: 'ajmalicine',
    name: 'Ajmalicine',
    aliases: ['Raubasine', 'δ-Yohimbine', 'delta-Yohimbine', 'Tetrahydroserpentine'],
    category: 'alkaloid',
    mechanism:
      'A corynanthe-type indole alkaloid present in yohimbe bark (Pausinystalia johimbe) that shares the pentacyclic indole core of yohimbine. Functional studies in pithed rats show it acts as a preferential α₁-adrenoceptor antagonist (PMID:3021076). Marketed elsewhere (as raubasine) as a cerebral vasodilator; quantitative human receptor pharmacology and clinical PK are not characterised.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 352.4,
    systems: ['nervous', 'cardiovascular'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Yohimbe/Rauwolfia corynanthe alkaloid (raubasine); α₁-preferring antagonism is functional rat data (PMID:3021076), no verbatim human Ki.',
    },
    notes:
      'PubChem CID 441975 (C21H24N2O3, MW 352.4). Present in yohimbe bark: PMID:23657953 (UPLC-IM-QTOF profile; "yohimbine or ajmalicine core structure") + PMID:25905738.',
    refs: ['PMID:23657953', 'PMID:3021076', 'PMID:25905738'],
  },
  {
    slug: 'yohimbinic-acid',
    name: 'Yohimbinic acid',
    aliases: ['Yohimbic acid'],
    category: 'alkaloid',
    mechanism:
      'A minor indole alkaloid of yohimbe bark (Pausinystalia johimbe) — the free-carboxylic-acid analog of yohimbine (yohimbine is its methyl ester). Its own pharmacology is not characterised and no validated receptor-affinity data for the isolated compound were found.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 340.4,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'De-esterified analog / hydrolysis product of yohimbine; trace bark constituent, no clinical PK.',
    },
    notes:
      'PubChem CID 72131 (C20H24N2O3, MW 340.4; PubChem Title "Yohimbic Acid"). Present in yohimbe bark/extracts: PMID:25905738 lists "yohimbic acid" among yohimbine analogs detected by LC/QTOF-MS.',
    refs: ['PMID:25905738'],
  },
  {
    slug: 'hydroxyyohimbine',
    name: 'Hydroxyyohimbine',
    aliases: ['Hydroxyl yohimbine', '11-Hydroxyyohimbine'],
    category: 'alkaloid',
    mechanism:
      'A minor monohydroxylated indole alkaloid of yohimbe bark (Pausinystalia johimbe) — a "hydroxyl yohimbine" analog detected in bark extracts. The name covers positional isomers (e.g. 10- and 11-hydroxyyohimbine, also oxidative metabolites of yohimbine); all share the formula C21H26N2O4. Pharmacology of the isolated constituent is not characterised.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 370.4,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Generic monohydroxy-yohimbine constituent/metabolite; position not resolved by the source. No isolated-compound PK or affinity.',
    },
    notes:
      'Representative structure PubChem CID 183814 (11-hydroxyyohimbine, C21H26N2O4, MW 370.4); MW is identical for any monohydroxy positional isomer. Present in yohimbe bark: PMID:25905738 lists "hydroxyl yohimbine" among yohimbine analogs.',
    refs: ['PMID:25905738'],
  },

  // ── Reported in a yohimbe-bark LC-MS / isolation profile ──────────────────
  {
    slug: 'beta-yohimbine',
    name: 'β-Yohimbine',
    aliases: ['beta-Yohimbine', 'Amsonine'],
    category: 'alkaloid',
    mechanism:
      'A minor indole alkaloid of yohimbe bark (Pausinystalia johimbe) and a stereoisomer of yohimbine differing in configuration at the C-17 carbinol centre. Its own pharmacology is not characterised; by analogy to yohimbine it is presumed to interact with α-adrenoceptors, but this is not established for β-yohimbine specifically.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 354.4,
    systems: ['nervous', 'cardiovascular'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Yohimbine stereoisomer (= amsonine); trace bark constituent, no isolated-compound pharmacology or PK.',
    },
    notes:
      'PubChem CID 3058605 (C21H26N2O3, MW 354.4; PubChem lists "amsonine"). Present in yohimbe bark: PMID:30059216 (alkaloids isolated from P. yohimbe bark).',
    refs: ['PMID:30059216'],
  },
  {
    slug: 'pseudoyohimbine',
    name: 'Pseudoyohimbine',
    aliases: ['ψ-Yohimbine', 'psi-Yohimbine'],
    category: 'alkaloid',
    mechanism:
      'A minor indole alkaloid of yohimbe bark (Pausinystalia johimbe) and a stereoisomer of yohimbine (a 3-epi configuration of the pentacyclic yohimban ring system). Its own pharmacology is not characterised; affinity for adrenergic or serotonergic receptors has not been quantified for this isomer.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 354.4,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Yohimbine stereoisomer; trace bark constituent, no isolated-compound pharmacology or PK.',
    },
    notes:
      'PubChem CID 251562 (C21H26N2O3, MW 354.4). Present in yohimbe bark: PMID:23657953 (UPLC-IM-QTOF indole-alkaloid profile of yohimbe bark).',
    refs: ['PMID:23657953'],
  },
  {
    slug: 'alloyohimbine',
    name: 'Alloyohimbine',
    aliases: ['allo-Yohimbine'],
    category: 'alkaloid',
    mechanism:
      'A minor indole alkaloid of yohimbe bark (Pausinystalia johimbe) and a stereoisomer of yohimbine sharing the yohimban carboxylate skeleton (C21H26N2O3), differing in stereochemistry at the ring junctions. Its pharmacology is not characterised; no primary affinity or activity data specific to alloyohimbine were identified.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 354.4,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Yohimbine stereoisomer; trace bark constituent, no isolated-compound pharmacology or PK.',
    },
    notes:
      'PubChem CID 120716 (C21H26N2O3, MW 354.4). Present in yohimbe bark: PMID:30059216 (alkaloids isolated from P. yohimbe bark).',
    refs: ['PMID:30059216'],
  },
  {
    slug: 'corynantheine',
    name: 'Corynantheine',
    aliases: ['(+)-Corynantheine'],
    category: 'alkaloid',
    mechanism:
      'A corynanthe-type indole alkaloid of yohimbe bark (Pausinystalia johimbe) — the structural class named for the genus Corynanthe (yohimbe’s historical genus). It has a seco (ring-opened) corynanthe skeleton with a vinyl group and a methoxy-acrylate side chain, distinguishing it from the pentacyclic yohimbine. Its pharmacology is not well characterised.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 366.5,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Corynanthe-type bark alkaloid; no isolated-compound receptor or PK data.',
    },
    notes:
      'PubChem CID 3037997 (C22H26N2O3, MW 366.5). Reported among the corynanthe-type indole alkaloids characterised in yohimbe-bark profiling (PMID:23657953).',
    refs: ['PMID:23657953'],
  },
  {
    slug: 'dihydrocorynantheine',
    name: 'Dihydrocorynantheine',
    aliases: ['(+)-Dihydrocorynantheine'],
    category: 'alkaloid',
    mechanism:
      'A corynanthe-type indole alkaloid of yohimbe bark (Pausinystalia johimbe) — the vinyl-reduced (ethyl) congener of corynantheine. Its pharmacology as an isolated compound is not well characterised, and no reliable human receptor-affinity or efficacy data are established.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 368.5,
    systems: ['nervous', 'cardiovascular'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Corynanthe-type bark alkaloid; no isolated-compound receptor or PK data.',
    },
    notes:
      'PubChem CID 3039336 (C22H28N2O3, MW 368.5). Reported among the corynanthe-type indole alkaloids characterised in yohimbe-bark profiling (PMID:23657953).',
    refs: ['PMID:23657953'],
  },
  {
    slug: 'corynantheidine',
    name: 'Corynantheidine',
    aliases: ['(-)-Corynantheidine'],
    category: 'alkaloid',
    mechanism:
      'A corynanthe-type indole alkaloid reported among the alkaloids of yohimbe bark (Pausinystalia johimbe); a stereoisomer of dihydrocorynantheine and better known as a minor Mitragyna (kratom) alkaloid. Its pharmacology as a yohimbe constituent is not characterised, and no verified receptor-affinity data for the named compound were identified.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 368.5,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Corynanthe-type alkaloid (also a kratom alkaloid); no isolated-compound receptor or PK data for the yohimbe constituent.',
    },
    notes:
      'PubChem CID 6540753 (C22H28N2O3, MW 368.5). NB: distinct from "corynanthidine" (a synonym of rauwolscine). Reported among the corynanthe-type alkaloids characterised in yohimbe-bark profiling (PMID:23657953).',
    refs: ['PMID:23657953'],
  },
  {
    slug: 'dihydrositsirikine',
    name: 'Dihydrositsirikine',
    aliases: ['(16R)-Dihydrositsirikine'],
    category: 'alkaloid',
    mechanism:
      'A minor monoterpene (corynanthe-type) indole alkaloid reported in yohimbe bark (Pausinystalia johimbe) — the dihydro (vinyl-reduced) congener of sitsirikine, with an open seco-corynanthe skeleton bearing a hydroxymethyl and a methyl ester. Its pharmacology is not characterised; it is reported only as a trace bark constituent in chemical profiling, not as a dosed agent.',
    routes: ['PO'],
    doses: {},
    mw_g_mol: 356.5,
    systems: ['nervous'],
    pk_unauthored: {
      reason: 'research-only',
      note: 'Trace corynanthe-type bark constituent; no isolated-compound receptor or PK data.',
    },
    notes:
      'PubChem CID 5316739 (C21H28N2O3, MW 356.5). Reported among the indole alkaloids characterised in yohimbe-bark profiling (PMID:23657953, PMID:30059216).',
    refs: ['PMID:23657953', 'PMID:30059216'],
  },

  // ── Tannin fraction (class-mixture entry, cf. valepotriates) ──────────────
  {
    slug: 'yohimbe-tannins',
    name: 'Yohimbe condensed tannins',
    aliases: ['Proanthocyanidins (yohimbe)', 'Condensed tannins'],
    category: 'polyphenol',
    mechanism:
      'The astringent condensed-tannin (proanthocyanidin) fraction of yohimbe bark (Pausinystalia johimbe) — oligo/polymeric flavan-3-ols built from catechin and epicatechin units. Pharmacognosy describes the bark as tannin-rich and notes the tannins precipitate the bark alkaloids. As a polymeric, ill-defined mixture it has no single molecular weight and no characterised receptor pharmacology.',
    routes: ['PO'],
    doses: {},
    systems: ['digestive'],
    pk_unauthored: {
      reason: 'mixture',
      note: 'Polymeric proanthocyanidin class — no single molecular weight or species-level PK. No PubMed-indexed primary abstract names/quantifies specific P. johimbe proanthocyanidins (pharmacognosy + EFSA describe them generically). Building-block flavan-3-ols catechin / epicatechin / procyanidin-b2 are authored separately.',
    },
    interactions: [
      { slug: 'catechin', name: '(+)-Catechin', level: 'synergistic', note: 'Flavan-3-ol building block of the condensed-tannin fraction.' },
      { slug: 'epicatechin', name: 'Epicatechin', level: 'synergistic', note: 'Flavan-3-ol building block of the condensed-tannin fraction.' },
    ],
    notes:
      'Class-mixture entry (cf. valepotriates). Yohimbe-bark tannins are documented in pharmacognosy monographs and the EFSA yohimbe assessment but not in a PubMed-indexed primary abstract; refs left empty rather than cite a non-primary source.',
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0;
  let skipped = 0;
  for (const c of NEW_COMPOUNDS) {
    if (bySlug.has(c.slug)) {
      console.log(`  [skip] ${c.slug} already in registry`);
      skipped++;
    } else {
      data.push(c);
      bySlug.set(c.slug, c);
      added++;
      const mw = c.mw_g_mol != null ? `mw=${c.mw_g_mol}` : 'mw=(mixture)';
      console.log(`  [add ] ${c.slug.padEnd(24)} ${mw.padEnd(14)} ${c.category}`);
    }
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nYohimbe-bark alkaloids wave (2026-06-27): +${added} compounds (${skipped} already present). Now ${data.length} compounds.`);
}

main();
