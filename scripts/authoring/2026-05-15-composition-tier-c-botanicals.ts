/**
 * 2026-05-15-composition-tier-c-botanicals.ts — Tier-C composite coverage
 *
 * 8 plant + mushroom extracts with composition pointing to their named
 * bioactive constituents. Most constituents have no published human PK
 * (pre-clinical only) — flagged `pk_unauthored: 'research-only'`. They
 * surface in the today-page composite parent row's "No PK · ..." summary
 * line (the dedicated UI we built for ashwagandha) so the user sees
 * that the registry recognizes more constituents than it models.
 *
 * Composites:
 *   bacopa          → bacoside-a, bacoside-b, bacopaside-i
 *   lions-mane      → hericenone-a, hericenone-b, erinacine-a
 *   milk-thistle    → silybin, silychristin, silydianin
 *   ginkgo-biloba   → ginkgolide-a, ginkgolide-b, bilobalide
 *   valerian        → valerenic-acid, valepotriates (mix)
 *   saffron         → crocin, crocetin, safranal
 *   reishi          → ganoderic-acid-a, ergosterol-peroxide
 *   chaga           → betulinic-acid, inotodiol
 *
 * Standardization % are from typical commercial spec sheets — these
 * vary by manufacturer + extract method; treat as approximate.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  [k: string]: unknown;
}

// ── New constituents (all `pk_unauthored: 'research-only'`) ──────────
const NEW_CONSTITUENTS: Compound[] = [
  // BACOPA — triterpenoid saponins of the dammarane class
  {
    slug: 'bacoside-a', name: 'Bacoside A',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Mixture of four dammarane triterpenoid saponins (bacoside A3, bacopaside II, bacopasaponin C, bacopaside X) — the dominant bioactive fraction in Bacopa monnieri. Preclinical neuroprotective + anxiolytic + memory-enhancement activity attributed to this fraction. Crosses blood-brain barrier; modulates BDNF, monoamines (serotonin, dopamine), and antioxidant enzymes. Most "bacopa standardized to 55% bacosides" extracts target this fraction.',
    routes: ['PO'],
    doses: { PO: { min: 1, max: 100, typical: 30, unit: 'mg' } },
    half_life_hr: {},
    pk_unauthored: { reason: 'research-only', note: 'Bacoside A is a saponin mixture; individual saponin PK not published in humans. Rat oral bioavailability ~5%; clinical effect inferred from extract studies.' },
    mw_g_mol: 929.13,
    refs: [], notes: 'Dominant saponin fraction; clinical effect mediated through this group as a whole rather than individual saponins.',
  },
  {
    slug: 'bacoside-b', name: 'Bacoside B',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Second bacoside fraction (jujubogenin-type dammarane saponins). Less abundant than bacoside A; similar pharmacology but distinct stereochemistry at the C-20 position.',
    routes: ['PO'], doses: { PO: { min: 1, max: 50, typical: 15, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Preclinical only; minor component in standardized Bacopa extracts.' },
    mw_g_mol: 929.13, refs: [],
  },
  {
    slug: 'bacopaside-i', name: 'Bacopaside I',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Triterpenoid glycoside; structurally related to bacosides. Preclinical anxiolytic + nootropic activity. Marker compound for HPLC quantitation of Bacopa extracts.',
    routes: ['PO'], doses: { PO: { min: 0.5, max: 30, typical: 10, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Preclinical; serves mostly as a chromatographic marker for extract standardization.' },
    mw_g_mol: 929.0, refs: [],
  },

  // LION'S MANE — meroterpenoids
  {
    slug: 'hericenone-a', name: 'Hericenone A',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Hericenone-class meroterpenoid from the Hericium erinaceus fruiting body. Promotes NGF synthesis in cultured astrocytes (Kawagishi 1991+). The fruiting-body fraction (vs. erinacines in mycelium) is the dominant source of nootropic activity.',
    routes: ['PO'], doses: { PO: { min: 0.1, max: 10, typical: 2, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Preclinical only; NGF-stimulating activity in cultured astrocytes; no human plasma PK published.' },
    mw_g_mol: 524.74, refs: [],
  },
  {
    slug: 'hericenone-b', name: 'Hericenone B',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Companion hericenone; similar NGF-stimulating activity to hericenone A. Both are present in fruiting-body extracts in low single-digit % by weight.',
    routes: ['PO'], doses: { PO: { min: 0.1, max: 10, typical: 2, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Preclinical; co-isolated with hericenone A.' },
    mw_g_mol: 540.74, refs: [],
  },
  {
    slug: 'erinacine-a', name: 'Erinacine A',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Cyathane-class diterpenoid from the mycelium of Hericium erinaceus. Strong NGF inducer (more potent than hericenones in vitro). Mycelium-based supplements (vs. fruiting-body) are the dominant source. Erinacine-enriched products target this constituent.',
    routes: ['PO'], doses: { PO: { min: 0.1, max: 10, typical: 1, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Preclinical NGF induction studies; clinical PK not characterized in humans.' },
    mw_g_mol: 502.61, refs: [],
  },

  // MILK THISTLE — flavonolignan complex (silymarin)
  {
    slug: 'silybin', name: 'Silybin',
    category: 'flavonoid', systems: ['digestive'],
    mechanism: 'Principal flavonolignan in the silymarin complex from Silybum marianum. Hepatoprotective via free-radical scavenging, hepatocyte membrane stabilization, inhibition of CYP3A4/P-gp (clinical DDI risk), and Amanita phalloides poisoning antidote (IV silibinin = Legalon SIL). Mixed silybin A + B diastereomers in extracts.',
    routes: ['PO', 'IV'],
    doses: { PO: { min: 60, max: 600, typical: 280, unit: 'mg' }, IV: { min: 100, max: 1000, typical: 500, unit: 'mg' } },
    half_life_hr: { PO: 6 },
    pk: { PO: { ka_hr: 0.5, V_L: 100, F: 0.04, source_pmid: 'PMID:17125289' } },
    mw_g_mol: 482.44, refs: ['PMID:17125289'],
    notes: 'Loram 2007 + others — oral F is very low (~1-4%); silybin-phytosome (Siliphos) and silibinin meglumine improve absorption ~10x.',
  },
  {
    slug: 'silychristin', name: 'Silychristin',
    category: 'flavonoid', systems: ['digestive'],
    mechanism: 'Flavonolignan in the silymarin complex; second-most abundant after silybin. Inhibits MCT8 (monocarboxylate transporter 8) → thyroid hormone uptake interference (Johannes 2016 — potentially relevant for AHDS patients). Otherwise similar hepatoprotective profile to silybin.',
    routes: ['PO'], doses: { PO: { min: 10, max: 100, typical: 30, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Lower bioavailability than silybin; preclinical hepatoprotective + MCT8 inhibition studies.' },
    mw_g_mol: 482.44, refs: [],
  },
  {
    slug: 'silydianin', name: 'Silydianin',
    category: 'flavonoid', systems: ['digestive'],
    mechanism: 'Minor flavonolignan in silymarin (~10% of complex). Hepatoprotective activity similar to silybin but less studied. Marker compound for chromatographic quantitation of extract authenticity.',
    routes: ['PO'], doses: { PO: { min: 5, max: 50, typical: 15, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Minor flavonolignan; minimal independent PK studies.' },
    mw_g_mol: 482.44, refs: [],
  },

  // GINKGO BILOBA — terpene lactones
  {
    slug: 'ginkgolide-a', name: 'Ginkgolide A',
    category: 'terpenoid', systems: ['nervous', 'cardiovascular'],
    mechanism: 'Cage-structure C20 diterpene lactone from Ginkgo biloba. Weak PAF (platelet-activating factor) antagonist relative to ginkgolide B. Component of standardized EGb 761 extract (24%/6% flavonoid/terpene spec).',
    routes: ['PO'], doses: { PO: { min: 1, max: 20, typical: 5, unit: 'mg' } },
    half_life_hr: { PO: 4 }, pk_unauthored: { reason: 'research-only', note: 'Modest oral bioavailability (~80% in rats); human PK overlaps with ginkgolide B + bilobalide in standardized extracts.' },
    mw_g_mol: 408.4, refs: [],
  },
  {
    slug: 'ginkgolide-b', name: 'Ginkgolide B',
    category: 'terpenoid', systems: ['nervous', 'cardiovascular'],
    mechanism: 'Most potent PAF receptor antagonist in the ginkgolide family. Primary mechanism for the platelet-aggregation + antithrombotic effects of Ginkgo extracts. Investigated for ischemic-stroke neuroprotection.',
    routes: ['PO'], doses: { PO: { min: 1, max: 20, typical: 5, unit: 'mg' } },
    half_life_hr: { PO: 4 }, pk_unauthored: { reason: 'research-only', note: 'Higher PAF-antagonist potency than other ginkgolides; principal antithrombotic component.' },
    mw_g_mol: 424.4, refs: [],
  },
  {
    slug: 'bilobalide', name: 'Bilobalide',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Sesquiterpene lactone (C15) unique to Ginkgo biloba; structurally distinct from ginkgolides. Neuroprotective via GABA-A modulation + mitochondrial protection. Often the most abundant terpene lactone in EGb 761.',
    routes: ['PO'], doses: { PO: { min: 1, max: 20, typical: 8, unit: 'mg' } },
    half_life_hr: { PO: 3 }, pk_unauthored: { reason: 'research-only', note: 'Oral F ~70% in animal models; component-specific human PK limited.' },
    mw_g_mol: 326.3, refs: [],
  },

  // VALERIAN — sesquiterpenoid + iridoid valepotriate mix
  {
    slug: 'valerenic-acid', name: 'Valerenic acid',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Sesquiterpenoid; positive allosteric modulator at GABA-A β3 subunit. Primary anxiolytic + sleep-promoting bioactive in Valeriana officinalis root extracts. Standardized supplements often target ≥0.8% valerenic acid as a marker.',
    routes: ['PO'], doses: { PO: { min: 1, max: 20, typical: 6, unit: 'mg' } },
    half_life_hr: { PO: 1.1 }, pk_unauthored: { reason: 'research-only', note: 'Anderson 2005 — rat PK; human PK studies report ~1 h half-life and rapid absorption but full primary-source numerics in body text only.' },
    mw_g_mol: 234.34, refs: [],
  },
  {
    slug: 'valepotriates', name: 'Valepotriates (mix)',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Iridoid epoxide mixture (valtrate, didrovaltrate, isovaltrate, acevaltrate) found mostly in fresh / unfermented valerian root. Unstable on storage and during alcohol extraction; modern aqueous + dry-root extracts contain little. Cytotoxic in vitro — historic concern but not seen at typical supplement doses.',
    routes: ['PO'], doses: { PO: { min: 0.1, max: 50, typical: 5, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Unstable epoxide mixture; not detected in most aqueous extracts; cytotoxic in vitro at high doses.' },
    refs: [],
  },

  // SAFFRON — apocarotenoids
  {
    slug: 'crocin', name: 'Crocin',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Glycosylated apocarotenoid (crocin-1 = trans-crocetin di(β-D-gentiobiosyl) ester). The dominant water-soluble pigment in Crocus sativus stigma. Antidepressant signal in clinical trials (typical dose 30 mg saffron extract standardized to ≥2% crocins). Mechanism via 5-HT + NMDA + BDNF modulation.',
    routes: ['PO'], doses: { PO: { min: 1, max: 30, typical: 6, unit: 'mg' } },
    half_life_hr: { PO: 6.5 }, pk_unauthored: { reason: 'research-only', note: 'Asai 2005 — rapidly hydrolyzed to crocetin in gut; crocin itself not detected in plasma at appreciable levels; clinical effect attributed to crocetin (the aglycone).' },
    mw_g_mol: 976.96, refs: [],
  },
  {
    slug: 'crocetin', name: 'Crocetin',
    category: 'terpenoid', systems: ['nervous', 'cardiovascular'],
    mechanism: 'Apocarotenoid aglycone of crocin — hydrolyzed from crocin by intestinal microbial + brush-border glycosidases. The actually-absorbed species after oral crocin intake. Reaches plasma µM range. BBB-penetrant; central effects on mood + cognition + retinal blood flow.',
    routes: ['PO'], doses: { PO: { min: 0.5, max: 20, typical: 3, unit: 'mg' } },
    half_life_hr: { PO: 7 }, pk_unauthored: { reason: 'research-only', note: 'Umigai 2011 — human PK after oral crocin (Tmax ~4 h, t½ ~7 h). Conversion ratio crocin → crocetin ~10-15% by molar AUC.' },
    mw_g_mol: 328.4, refs: [],
  },
  {
    slug: 'safranal', name: 'Safranal',
    category: 'terpenoid', systems: ['nervous'],
    mechanism: 'Volatile monoterpene aldehyde; primary aroma compound of saffron. Anxiolytic in animal models (GABA-A modulation suspected). Lower bioavailability than crocin/crocetin; rapidly metabolized.',
    routes: ['PO'], doses: { PO: { min: 0.1, max: 5, typical: 1, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Volatile + rapidly metabolized; preclinical anxiolytic activity; component-specific human PK limited.' },
    mw_g_mol: 150.22, refs: [],
  },

  // REISHI — triterpenes + polysaccharides
  {
    slug: 'ganoderic-acid-a', name: 'Ganoderic acid A',
    category: 'terpenoid', systems: ['immune-hematologic', 'digestive'],
    mechanism: 'Lanostane-type triterpene from Ganoderma lucidum. Representative of the ganoderic-acid family (A through Z, plus T-derivatives). Anti-cancer, anti-inflammatory, hepatoprotective preclinical activity. Used as HPLC standardization marker for "high-triterpene" reishi extracts.',
    routes: ['PO'], doses: { PO: { min: 0.5, max: 30, typical: 5, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Low oral bioavailability; preclinical apoptosis + immune-modulation studies; component-specific human PK not characterized.' },
    mw_g_mol: 516.66, refs: [],
  },
  {
    slug: 'ergosterol-peroxide', name: 'Ergosterol peroxide',
    category: 'terpenoid', systems: ['immune-hematologic'],
    mechanism: 'Steroidal oxidation product of ergosterol; isolated from medicinal mushrooms (reishi, chaga, lion\'s mane). Anti-inflammatory + immune-modulatory + anti-tumor preclinical activity. Marker compound for high-quality mushroom extracts.',
    routes: ['PO'], doses: { PO: { min: 0.1, max: 10, typical: 1, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Preclinical; not separately quantified in plasma after mushroom-extract dosing.' },
    mw_g_mol: 428.65, refs: [],
  },

  // CHAGA — pentacyclic triterpenes + melanin polymers
  {
    slug: 'betulinic-acid', name: 'Betulinic acid',
    category: 'terpenoid', systems: ['immune-hematologic', 'integumentary'],
    mechanism: 'Pentacyclic lupane triterpenoid; derived in chaga from birch-bark betulin via fungal oxidation. Anti-tumor (selective induction of apoptosis in cancer cells via mitochondrial pathway), anti-HIV (gp120-gp41 fusion inhibition; bevirimat is a derivative), anti-inflammatory.',
    routes: ['PO'], doses: { PO: { min: 1, max: 50, typical: 10, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Low oral bioavailability (poor water solubility); preclinical anti-tumor activity is well-established but clinical PK lacking.' },
    mw_g_mol: 456.7, refs: [],
  },
  {
    slug: 'inotodiol', name: 'Inotodiol',
    category: 'terpenoid', systems: ['immune-hematologic'],
    mechanism: 'Lanostane-type triterpenoid unique to Inonotus obliquus (chaga). Preclinical anti-tumor activity (lung + cervical cancer cell lines), anti-allergic (mast cell stabilization). Marker compound for chaga authentication.',
    routes: ['PO'], doses: { PO: { min: 0.5, max: 20, typical: 2, unit: 'mg' } },
    half_life_hr: {}, pk_unauthored: { reason: 'research-only', note: 'Chaga-specific marker; preclinical anti-tumor + anti-allergic activity.' },
    mw_g_mol: 444.7, refs: [],
  },
];

// ── Composition wiring on existing parent compounds ──────────────────
const COMPOSITION_PATCHES: Array<{ slug: string; standardization: string; constituents: Array<{ slug: string; mg_per_g_extract: number; note?: string }> }> = [
  {
    slug: 'bacopa',
    standardization: 'Typical "55% bacosides" Bacopa monnieri leaf extract; bacopaside-I serves as marker',
    constituents: [
      { slug: 'bacoside-a',    mg_per_g_extract: 300, note: 'Dominant saponin fraction in 55%-bacosides extracts' },
      { slug: 'bacoside-b',    mg_per_g_extract: 150, note: 'Secondary saponin fraction' },
      { slug: 'bacopaside-i',  mg_per_g_extract: 50,  note: 'Marker compound for HPLC quantitation' },
    ],
  },
  {
    slug: 'lions-mane',
    standardization: 'Fruiting-body + mycelium extracts vary; this represents a balanced commercial standardization (~1% hericenones + 0.1% erinacine A)',
    constituents: [
      { slug: 'hericenone-a', mg_per_g_extract: 5, note: 'Fruiting-body NGF stimulator' },
      { slug: 'hericenone-b', mg_per_g_extract: 5, note: 'Companion to hericenone A' },
      { slug: 'erinacine-a',  mg_per_g_extract: 1, note: 'Mycelium-only; absent in pure fruiting-body extracts' },
    ],
  },
  {
    slug: 'milk-thistle',
    standardization: '80% silymarin (the standard "milk thistle silymarin" spec) — silybin is the dominant flavonolignan',
    constituents: [
      { slug: 'silybin',       mg_per_g_extract: 480, note: '~60% of the silymarin fraction (silybin A + B)' },
      { slug: 'silychristin',  mg_per_g_extract: 160, note: '~20% of silymarin' },
      { slug: 'silydianin',    mg_per_g_extract: 80,  note: '~10% of silymarin' },
    ],
  },
  {
    slug: 'ginkgo-biloba',
    standardization: 'EGb 761-style extract: 24% flavone glycosides + 6% terpene lactones (ginkgolides + bilobalide)',
    constituents: [
      { slug: 'ginkgolide-a', mg_per_g_extract: 10, note: '~1% of standardized extract (terpene fraction)' },
      { slug: 'ginkgolide-b', mg_per_g_extract: 10, note: '~1%; principal PAF antagonist' },
      { slug: 'bilobalide',   mg_per_g_extract: 30, note: '~3%; most abundant terpene lactone in EGb 761' },
    ],
  },
  {
    slug: 'valerian',
    standardization: 'Typical "≥0.8% valerenic acid" dry-root extract; aqueous + ethanolic preparations differ in valepotriate content',
    constituents: [
      { slug: 'valerenic-acid', mg_per_g_extract: 8, note: 'Marker compound for extract standardization' },
      { slug: 'valepotriates',  mg_per_g_extract: 5, note: 'Unstable epoxide mixture; mostly absent in modern aqueous extracts' },
    ],
  },
  {
    slug: 'saffron',
    standardization: 'Affron-style standardized saffron stigma extract (≥3.5% lepticrosalides — crocins + safranal)',
    constituents: [
      { slug: 'crocin',    mg_per_g_extract: 25, note: 'Dominant glycosylated pigment; hydrolyzed to crocetin in gut' },
      { slug: 'crocetin',  mg_per_g_extract: 3,  note: 'Free aglycone; actually-absorbed species' },
      { slug: 'safranal',  mg_per_g_extract: 5,  note: 'Volatile aroma compound; anxiolytic in animal models' },
    ],
  },
  {
    slug: 'reishi',
    standardization: 'Dual-extracted (water + ethanol) reishi extract; ~30% polysaccharides + ~5% triterpenes is a common commercial spec',
    constituents: [
      { slug: 'ganoderic-acid-a',   mg_per_g_extract: 8, note: 'Representative of the broader ganoderic-acid family (A–Z)' },
      { slug: 'ergosterol-peroxide', mg_per_g_extract: 3, note: 'Cross-mushroom marker; immune-modulatory' },
    ],
  },
  {
    slug: 'chaga',
    standardization: 'Hot-water + ethanol dual-extracted chaga; ~3% betulin / betulinic acid is a common commercial spec',
    constituents: [
      { slug: 'betulinic-acid', mg_per_g_extract: 15, note: 'Lupane triterpenoid; preclinical anti-tumor + anti-HIV' },
      { slug: 'inotodiol',      mg_per_g_extract: 5,  note: 'Chaga-specific lanostane; preclinical anti-tumor' },
    ],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  // Part 1 — add new constituents
  let constAdded = 0;
  for (const c of NEW_CONSTITUENTS) {
    if (bySlug.has(c.slug)) { console.log(`  [skip] constituent exists: ${c.slug}`); continue; }
    data.push(c);
    bySlug.set(c.slug, c);
    constAdded++;
    console.log(`  [add ] ${c.slug}`);
  }

  // Part 2 — wire composition onto each parent
  let parentsPatched = 0;
  let totalConstituentLinks = 0;
  for (const patch of COMPOSITION_PATCHES) {
    const parent = bySlug.get(patch.slug) as { composition?: unknown } | undefined;
    if (!parent) { console.warn(`  [warn] parent missing: ${patch.slug}`); continue; }
    parent.composition = {
      standardization: patch.standardization,
      constituents: patch.constituents,
    };
    parentsPatched++;
    totalConstituentLinks += patch.constituents.length;
    console.log(`  [comp] ${patch.slug.padEnd(18)} → [${patch.constituents.map(c => c.slug).join(', ')}]`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nNew constituents: ${constAdded} | Parents wired: ${parentsPatched} | Links: ${totalConstituentLinks}`);
  console.log(`Total compounds: ${data.length}`);
}

main();
