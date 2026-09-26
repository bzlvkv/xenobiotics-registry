/**
 * 2026-05-12-wave-derm-cluster.ts — Dermatology cluster (DERM-1..3).
 *
 * DERM-1 retinoic_acid_rar_rxr_signaling           retinoids
 * DERM-2 epidermal_keratinization_melanogenesis    AHA/BHA + pigmentation
 * DERM-3 batch pk_unauthored:local-acting          mostly-topical compounds
 *        where systemic PK isn't clinically meaningful
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}
interface Compound {
  slug: string; pk_unauthored?: { reason: 'local-acting' | 'research-only' | 'mixture'; note?: string };
  [k: string]: unknown;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'retinoic_acid_rar_rxr_signaling',
    name: 'Retinoic acid signaling (RAR/RXR nuclear receptors)',
    category: 'signaling',
    systems: ['integumentary', 'endocrine'],
    description: `Retinoic acid (all-trans + 9-cis) is the bioactive form of vitamin A; binds nuclear RAR (α/β/γ) + RXR (α/β/γ) heterodimers that bind RARE/RXRE on DNA → modulate transcription of genes governing keratinocyte differentiation, sebum production, melanocyte function, and epidermal cell-cycle. Therapeutic retinoids: tretinoin (all-trans RA — topical acne + photoaging; APL induction agent in oncology); isotretinoin (13-cis RA — oral severe nodulocystic acne + sebaceous-gland atrophy; iPLEDGE pregnancy program for teratogenicity); adapalene (RARβ/γ-selective — Differin OTC); tazarotene (RARβ/γ — psoriasis + acne); trifarotene (RARγ-selective — Aklief, truncal acne); bexarotene (RXR-selective — CTCL). Mechanism crosses both DERM + ONC use cases.`,
    steps: [
      { from: 'retinol', to: 'retinoic-acid', via: 'retinol → retinal (ADH) → retinoic acid (RALDH); cross-link: retinol_vitamin_a_metabolism' },
      { from: 'retinoic-acid', to: 'rar-rxr-heterodimer-activation', via: 'cytoplasmic CRABP transport → nuclear RAR/RXR → RARE binding → transcription change' },
    ],
    modulators: [
      { slug: 'tretinoin', effect: 'activator', target: 'RAR α/β/γ (all-trans RA)', note: 'topical acne + photoaging; oral for APL (PML-RARα fusion target) — Sanz APL protocol' },
      { slug: 'isotretinoin', effect: 'activator', target: 'RAR (13-cis RA — isomerization in vivo)', note: 'oral severe nodulocystic acne; sebaceous-gland atrophy → cure-like effect; iPLEDGE teratogenicity program; mood-effect surveillance' },
      { slug: 'adapalene', effect: 'activator', target: 'RARβ + RARγ (selective)', note: 'OTC topical retinoid (Differin); less irritation than tretinoin; comedolytic + anti-inflammatory' },
      { slug: 'tazarotene', effect: 'activator', target: 'RARβ + RARγ', note: 'topical psoriasis + acne; can also be used for photodamage' },
      { slug: 'trifarotene', effect: 'activator', target: 'RARγ-selective', note: 'first RARγ-selective topical retinoid; Aklief; designed for truncal + facial acne' },
    ],
    refs: [],
  },
  {
    slug: 'epidermal_keratinization_melanogenesis',
    name: 'Epidermal keratinization + melanogenesis',
    category: 'biosynthesis',
    systems: ['integumentary'],
    description: `Skin barrier renewal: basal keratinocytes proliferate, differentiate upward through stratum spinosum + granulosum, mature into anucleate corneocytes of stratum corneum, shed (~28-day turnover). Hyperkeratosis (acne, psoriasis, ichthyosis) reflects dysregulated terminal differentiation. AHAs/BHAs accelerate corneocyte shedding (chemical exfoliation): AHAs (glycolic, lactic, mandelic) — water-soluble, surface; BHAs (salicylic) — lipid-soluble, penetrate sebaceous follicles. Melanogenesis in melanocytes: tyrosinase oxidizes tyrosine → DOPA → dopaquinone → eumelanin (brown/black, MC1R-driven) or pheomelanin (red/yellow). Hyperpigmentation Rx blocks tyrosinase (hydroquinone, kojic acid, arbutin) or inhibits melanin transfer (azelaic acid, niacinamide) or downregulates MITF/PAR-2 (tranexamic acid topical, bakuchiol).`,
    steps: [
      { from: 'keratinocyte-basal', to: 'corneocyte-shedding', via: '~28-day differentiation cascade; AHA/BHA accelerate the desquamation step' },
      { from: 'tyrosine', to: 'eumelanin', via: 'tyrosinase oxidation → dopaquinone → polymerization (tyrosinase = melanogenesis target)' },
    ],
    modulators: [
      { slug: 'glycolic-acid', effect: 'activator', target: 'desquamation (AHA, surface)', note: 'smallest AHA; deepest penetration of AHAs; chemical peel + OTC anti-aging' },
      { slug: 'lactic-acid-topical', effect: 'activator', target: 'desquamation (AHA) + humectant', note: 'AHA + draws moisture; less irritating than glycolic; ammonium lactate (Lac-Hydrin) for xerosis' },
      { slug: 'mandelic-acid', effect: 'activator', target: 'desquamation (AHA, larger molecule)', note: 'larger AHA → shallower penetration → gentler exfoliation; preferred in melasma + sensitive skin' },
      { slug: 'salicylic-acid-topical', effect: 'activator', target: 'desquamation (BHA, sebaceous follicle penetrant)', note: 'BHA; lipophilic → penetrates sebum-filled follicles; acne first-line OTC' },
      { slug: 'hydroquinone', effect: 'inhibitor', target: 'tyrosinase (melanogenesis)', note: 'gold-standard skin lightener; ochronosis with prolonged use; OTC 2% restricted; Rx 4%+' },
      { slug: 'kojic-acid', effect: 'inhibitor', target: 'tyrosinase (copper chelation)', note: 'fungal metabolite; weaker than hydroquinone but better tolerated; OTC' },
      { slug: 'azelaic-acid', effect: 'inhibitor', target: 'tyrosinase + acne (broad)', note: 'rosacea + acne + melasma; topical 15% Rx + 10% OTC' },
      { slug: 'tranexamic-acid-topical', effect: 'inhibitor', target: 'plasmin/PAR-2 axis (melasma)', note: 'topical for melasma; reduces UV-induced melanocyte activation; cross-link: fibrinolysis for systemic TXA' },
      { slug: 'bakuchiol', effect: 'inhibitor', target: 'retinoid-like signaling (gentle alternative)', note: 'plant-derived; claimed retinol-like benefits without retinoid irritation; less photosensitizing' },
      { slug: 'niacinamide', effect: 'inhibitor', target: 'melanosome transfer + barrier repair', note: 'vitamin B3 derivative; OTC; reduces melanosome transfer from melanocyte to keratinocyte' },
      { slug: 'l-ascorbic-acid-topical', effect: 'inhibitor', target: 'tyrosinase + photoprotection', note: 'topical vitamin C 10-20%; oxidation-prone formulation challenges; pH < 3.5 required for absorption' },
    ],
    refs: [],
  },
];

// DERM-3: pk_unauthored:local-acting for compounds where systemic PK isn't
// clinically meaningful + pathway authoring isn't tractable (most topicals).
const LOCAL_ACTING_DERM = [
  ['hydrocortisone-topical', 'topical glucocorticoid; minimal systemic absorption at intact skin; pathway home in glucocorticoid_receptor_signaling for systemic forms'],
  ['clobetasol', 'super-potent topical glucocorticoid; minimal systemic with appropriate use'],
  ['fluocinonide', 'high-potency topical glucocorticoid'],
  ['fluocinolone', 'medium-high-potency topical glucocorticoid'],
  ['desoximetasone', 'high-potency topical glucocorticoid'],
  ['halobetasol', 'super-potent topical glucocorticoid'],
  ['tacrolimus-topical', 'topical calcineurin inhibitor for AD; systemic absorption minimal'],
  ['pimecrolimus', 'topical calcineurin inhibitor for AD; minimal systemic'],
  ['crisaborole', 'topical PDE4 inhibitor (Eucrisa) for AD; minimal systemic'],
  ['avobenzone', 'organic UVA sunscreen filter; topical only'],
  ['octinoxate', 'organic UVB sunscreen filter; reef-toxicity bans'],
  ['zinc-oxide', 'physical UV sunscreen + barrier; topical only'],
  ['clotrimazole', 'topical azole antifungal; tinea + candidiasis (covered in fungal pathway for oral troches/systemic) — topical form local-acting'],
  ['miconazole', 'topical/vaginal azole antifungal; local-acting'],
  ['mupirocin', 'topical antibacterial; pseudomonic acid A → bacterial isoleucyl-tRNA synthetase'],
  ['ciclopirox', 'topical hydroxypyridone antifungal for nails'],
  ['efinaconazole', 'topical azole nail solution'],
  ['butenafine', 'topical allylamine antifungal'],
  ['undecylenic-acid', 'topical fatty acid antifungal; OTC'],
  ['tolnaftate', 'topical thiocarbamate antifungal; OTC'],
  ['ketoconazole-shampoo', 'topical azole shampoo for seborrheic dermatitis'],
  ['selenium-sulfide', 'topical antifungal/antiseborrheic shampoo'],
  ['zinc-pyrithione', 'topical antifungal/antiseborrheic shampoo'],
  ['erythromycin-topical', 'topical antibacterial for acne'],
  ['clindamycin-topical', 'topical antibacterial for acne; usually with benzoyl peroxide'],
  ['metronidazole-topical', 'topical for rosacea; minimal systemic'],
  ['minoxidil', 'topical hair growth (vasodilator at scalp follicles); minimal systemic from topical (oral retains BP effects)'],
  ['finasteride-topical', 'topical hair-loss formulation; local-acting 5α-reductase inhibition'],
  ['ru-58841', 'investigational topical anti-androgen; research-only'],
  ['chlorhexidine', 'topical/oral antiseptic; biguanide; OTC mouthwash + skin prep'],
  ['sodium-fluoride', 'topical dental caries prevention'],
  ['hydroquinone', 'topical melanogenesis inhibitor; local-acting'],
  ['calcipotriene', 'topical vitamin D analog for psoriasis; local-acting'],
  ['permethrin', 'topical scabicide/pediculicide'],
  ['benzocaine', 'topical/oral local anesthetic; local-acting at application site'],
  ['pramoxine', 'topical surface anesthetic'],
  ['lidocaine-topical', 'topical patch for postherpetic neuralgia + numbing creams'],
  ['capsaicin-topical', 'topical 8% patch for postherpetic neuralgia; pathway home in trp_channel_sensory_transduction for the receptor side'],
] as const;

const NEW_PATHWAYS_REFS: Pathway[] = NEW_PATHWAYS;

function main(): void {
  const pData = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const pSlug = new Map(pData.map(p => [p.slug, p]));
  let pAdded = 0;
  for (const p of NEW_PATHWAYS_REFS) {
    if (pSlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    pData.push(p); pSlug.set(p.slug, p); pAdded++;
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(pData, null, 2) + '\n');

  // Reclassify topicals to pk_unauthored:local-acting
  const cData = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const cSlug = new Map(cData.map(c => [c.slug, c]));
  let reclassified = 0;
  for (const [slug, note] of LOCAL_ACTING_DERM) {
    const c = cSlug.get(slug);
    if (!c) { console.log(`  [warn] missing slug: ${slug}`); continue; }
    if (c.pk_unauthored) { console.log(`  [skip] ${slug} already pk_unauthored:${c.pk_unauthored.reason}`); continue; }
    c.pk_unauthored = { reason: 'local-acting', note };
    reclassified++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(cData, null, 2) + '\n');

  console.log(`\nDERM cluster: +${pAdded} pathways, +${reclassified} local-acting reclassifications. Pathway total: ${pData.length}.`);
}

main();
