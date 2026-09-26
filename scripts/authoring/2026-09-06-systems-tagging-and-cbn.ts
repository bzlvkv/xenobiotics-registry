/**
 * 2026-09-06-systems-tagging-and-cbn.ts
 *
 * ── Part A: body-system tags for the last 27 untagged compounds ───────────
 * Every compound carries `systems[]` so it appears on /library's per-system
 * surfaces; an untagged compound is reachable only under the "Untagged"
 * filter. The 2026-05 bulk pass tagged 1,204 of 1,231 by mechanism-prose
 * pattern match and left a residue its patterns could not read: individual
 * dietary fatty acids, phytosterols, minor carotenoids and tocopherol
 * vitamers, and three loose dietary anions/pigments. They are the entries the
 * food catalog resolves nutrition panels against, so being invisible on the
 * system surfaces is a real navigational hole rather than a cosmetic one.
 *
 * Each assignment below is justified from that compound's OWN mechanism prose
 * (quoted in the comment), not from its category. With these 27, systems
 * tagging reaches 1,231/1,231 and data-lint's `systems.tagged` rule can be
 * escalated from warning to error to stop future drift.
 *
 * ── Part B: cannabinol (CBN) inhaled half-life ────────────────────────────
 * CBN carried a kₑₒ and a CB2 occupancy row but NO solvable route, so its
 * Ce(t) and its occupancy curve both rendered identically zero — the compound
 * page showed a populated Pharmacodynamics section that silently meant
 * nothing. This is the `pd.needs-solvable-pk` rule added alongside this
 * script. A literature pass found exactly one primary carrying a verbatim
 * human value:
 *
 *   Johansson, Ohlsson, Lindgren, Agurell, Gillespie, Hollister (1987),
 *   "Single-dose kinetics of deuterium-labelled cannabinol in man after
 *   intravenous administration and smoking", Biomed Environ Mass Spectrom
 *   14(9):495-9, PMID:2960395. Six male subjects, deuterium-labelled CBN,
 *   plasma sampled to 72 h by GC/MS.
 *
 *   Verbatim, all four values from this one abstract:
 *     "The apparent terminal half lives for CBN were 32 +/- 17 h and 43 +/- 29
 *      h after intravenous administration and smoking, respectively."
 *     "The systemic availability of smoked CBN was found to be 39 +/- 26%"
 *     "the volume of distribution was determined to 50 +/- 23 l kg-1"
 *     "The mean plasma clearance was 19.1 +/- 2.6 ml min-1 kg-1"
 *
 * We author the SMOKING values onto the INH route, which is the route the
 * paper actually dosed: t½ 43 h, F 0.39, V 50 L/kg = 3500 L at the 70 kg
 * reference weight. The volume is startling but is what a very lipophilic
 * cannabinoid gives, and the abstract's own numbers are internally consistent
 * — ln2 · V / CL = 0.693 × 3500 L / 80.2 L·h⁻¹ ≈ 30 h, which reproduces the
 * paper's IV half-life of 32 h without any back-fitting on our part.
 *
 * CBN's PO route is deliberately left unauthored: this study never gave CBN
 * orally, and oral cannabinoid first-pass makes an inhaled half-life a poor
 * stand-in. Seven sibling compounds investigated in
 * the same pass yielded no authorable human value and are logged as skips in
 * AUTHORING_GAPS.md with the PMIDs chased.
 *
 * Idempotent: skips any compound already tagged / already carrying the value.
 * Dry-run by default; pass --write to apply to compounds.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

/** slug → [systems], with the mechanism-prose basis for each assignment. */
const SYSTEMS: Record<string, string[]> = {
  // "~85% resides in bone as hydroxyapatite. Absorbed via sodium-dependent…"
  // — a structural bone mineral, absorbed enterally, renally regulated.
  phosphorus: ['musculoskeletal', 'digestive', 'renal'],

  // ── Saturated fatty acids: dietary lipids read out on the lipid panel ──
  // "most abundant saturated fat in diet and human tissue… high intake…"
  'palmitic-acid': ['cardiovascular', 'digestive'],
  // "Largely converted to oleic acid by SCD1; considered roughly LDL-neutral"
  'stearic-acid': ['cardiovascular', 'digestive'],
  // "dominant SCFA produced by colonic fermentation of fibre… Primary energy
  //  substrate for [colonocytes]" — a gut-luminal fuel with immune signalling.
  'butyric-acid': ['digestive', 'immune-hematologic'],
  // "Partly metabolised like an MCT (portal transport)" + LDL effect.
  'lauric-acid': ['cardiovascular', 'digestive'],
  // "Per gram the most potent LDL-cholesterol-raising saturated fat"
  'myristic-acid': ['cardiovascular', 'digestive'],
  // "a widely used plasma biomarker of dairy intake… candidate [cardiometabolic]"
  'pentadecanoic-acid': ['cardiovascular', 'digestive'],
  // "derived from ruminant fat and partly from gut-microbial synthesis"
  'heptadecanoic-acid': ['cardiovascular', 'digestive'],
  // "Minor dietary component; very-long-chain SFAs are absorbed [poorly]"
  'arachidic-acid': ['digestive', 'cardiovascular'],
  // "Notably poorly absorbed (≈30%), so it contributes fewer calories per g"
  'behenic-acid': ['digestive', 'cardiovascular'],
  // "as an acyl component of sphingolipids and myelin"
  'lignoceric-acid': ['nervous', 'digestive'],

  // ── Unsaturated fatty acids ──
  // "dominant fat in olive oil… Ligand for PPAR-alpha and FFAR1; associated
  //  with a favorable LDL/H[DL ratio]" — PPAR/FFAR1 is endocrine signalling.
  'oleic-acid': ['cardiovascular', 'digestive', 'endocrine'],
  // "essential… Precursor to arachidonic acid… and thus to series-[2 eicosanoids]"
  'linoleic-acid': ['cardiovascular', 'immune-hematologic'],
  // "synthesised endogenously by stearoyl-CoA desaturase-1 (SCD1)" — a lipokine.
  'palmitoleic-acid': ['cardiovascular', 'endocrine'],
  // "the elongation product of oleic acid… found in fish oils"
  'gondoic-acid': ['cardiovascular', 'digestive'],
  // "Food-grade canola is bred to keep erucic acid low because very [high
  //  intakes caused cardiac lipidosis in rodents]"
  'erucic-acid': ['cardiovascular', 'digestive'],
  // "direct precursor of the anti-inflammatory series-1 prostaglandins (PGE[1])"
  dgla: ['immune-hematologic', 'cardiovascular'],

  // ── Phytosterols: all three act at intestinal cholesterol absorption ──
  // "Competes with cholesterol for incorporation into mixed micelles and
  //  inhibits NPC1L1-media[ted uptake]"
  'beta-sitosterol': ['cardiovascular', 'digestive'],
  // "serum campesterol is used as a marker of fractional cholesterol-absor[ption]"
  campesterol: ['cardiovascular', 'digestive'],
  // "Reduces intestinal cholesterol absorption"
  stigmasterol: ['cardiovascular', 'digestive'],

  // ── Provitamin-A carotenoids: matches the beta-carotene precedent ──
  // "Cleaved by β-carotene oxygenase to retinal but yields roughly half the
  //  vitamin-A [activity]"
  'alpha-carotene': ['digestive'],
  // "Provides modest vitamin-A activity and is studied for bo[ne health]"
  'beta-cryptoxanthin': ['digestive', 'musculoskeletal'],

  // ── Minor tocopherol vitamers: matches the alpha-tocopherol precedent ──
  // "Lipid-phase chain-breaking antioxidant"
  'beta-tocopherol': ['digestive'],
  // "abundant in soybean and other vegetable oils, where it is a major
  //  natural antioxidant preservative. Strong radical-scavengi[ng]"
  'delta-tocopherol': ['digestive'],

  // ── Loose dietary anions and pigments ──
  // "Incorporates into the hydroxyapatite of bone and enamel as fluorapatite"
  fluoride: ['musculoskeletal', 'digestive'],
  // "Reduced by oral commensal bacteria to nitrite and then to nitric oxide
  //  via the entero[-salivary pathway]" — the nitrate-nitrite-NO vasodilation axis.
  nitrate: ['cardiovascular', 'digestive'],
  // "Poorly absorbed intact and largely converted in the g[ut]"
  chlorophyll: ['digestive'],
};

const CBN_PMID = 'PMID:2960395';
const CBN_T_HALF_INH = 43;   // h,   smoked terminal t½        (Johansson 1987)
const CBN_F_INH = 0.39;      // —,   smoked systemic availability
const CBN_V_L = 3500;        // L,   50 L/kg × 70 kg reference weight

interface Compound {
  slug: string;
  systems?: string[];
  routes?: string[];
  half_life_hr?: Record<string, number>;
  pk?: Record<string, Record<string, unknown> | undefined>;
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const bySlug = new Map(data.map((c) => [c.slug, c]));

const taggedNow: string[] = [];
const tagSkips: string[] = [];
for (const [slug, systems] of Object.entries(SYSTEMS)) {
  const c = bySlug.get(slug);
  if (!c) { tagSkips.push(`${slug} — NOT IN REGISTRY`); continue; }
  if (c.systems && c.systems.length > 0) { tagSkips.push(`${slug} — already tagged (${c.systems.join(', ')})`); continue; }
  c.systems = systems;
  taggedNow.push(`${slug} → ${systems.join(', ')}`);
}

let cbnResult: string;
const cbn = bySlug.get('cbn');
if (!cbn) {
  cbnResult = 'cbn — NOT IN REGISTRY';
} else if (cbn.half_life_hr?.INH != null) {
  cbnResult = `cbn.INH — already authored (${cbn.half_life_hr.INH} h)`;
} else if (!cbn.routes?.includes('INH')) {
  cbnResult = 'cbn — INH not in routes[]; refusing to author a route the compound does not list';
} else {
  cbn.half_life_hr = { ...(cbn.half_life_hr ?? {}), INH: CBN_T_HALF_INH };
  cbn.pk = { ...(cbn.pk ?? {}) };
  cbn.pk.INH = { ...(cbn.pk.INH ?? {}), F: CBN_F_INH, V_L: CBN_V_L, source_pmid: CBN_PMID };
  cbnResult = `cbn.INH → t½ ${CBN_T_HALF_INH} h, F ${CBN_F_INH}, V ${CBN_V_L} L, ${CBN_PMID}`;
}

console.log(`Part A — systems[] tagging: ${taggedNow.length} applied`);
for (const t of taggedNow) console.log(`   + ${t}`);
if (tagSkips.length) {
  console.log(`   ${tagSkips.length} skipped:`);
  for (const s of tagSkips) console.log(`     - ${s}`);
}
console.log(`\nPart B — cannabinol PK: ${cbnResult}`);

if (WRITE) {
  writeFileSync(COMPOUNDS_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`\nWROTE ${COMPOUNDS_PATH}`);
} else {
  console.log('\nDry run — pass --write to apply.');
}
