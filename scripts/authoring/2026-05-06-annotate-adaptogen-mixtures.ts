/**
 * 2026-05-06-annotate-adaptogen-mixtures.ts
 *
 * Marks multi-component adaptogen / botanical extracts with
 * pk_unauthored: 'mixture'. These compounds have no single plasma
 * species to fit PK to — each carries 5-30+ bioactive markers
 * (withanolides, ginsenosides, lignans, procyanidins, flavonoids,
 * triterpenes, etc.) with different absorption + clearance kinetics.
 *
 * Authoring a single ka/V/F set would be misleading; the right
 * surfacing is "this is a mixture, no single-species PK applies".
 *
 * Single-component markers within these botanicals (e.g. ginsenoside-
 * rg1, salidroside, withaferin-A) can still get PK if the user adds
 * them as separate catalog entries with their own data — that's the
 * v0.7+ "tracked active marker" workflow.
 *
 * The 3 single-component adaptogens that DO have potentially
 * authorable PK (ginsenoside-rg1, ginsenoside-rg3, rosavin) are
 * intentionally NOT marked — they're individual molecules and could
 * be authored from PMID-anchored PK in a future Wave-1b session.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk_unauthored?: { reason: string; note?: string };
  [k: string]: unknown;
}

type Annotation = { slug: string; note: string };

const ANNOTATIONS: Annotation[] = [
  // ── Withanolide-bearing extracts (Withania somnifera) ────────────
  { slug: 'ashwagandha-ksm66',   note: 'Standardized ashwagandha root extract (KSM-66 brand). Multi-component withanolide mixture; no single plasma species fits a one-compartment PK model. The clinical effect tracks total withanolide exposure rather than a single marker.' },
  { slug: 'ashwagandha-sensoril', note: 'Standardized ashwagandha root + leaf extract (Sensoril brand, higher withaferin-A content). Multi-component mixture; PK varies per individual withanolide.' },
  { slug: 'ashwagandha-shoden',  note: 'Standardized ashwagandha extract (Shoden brand, high glycowithanolides). Multi-component mixture; no single plasma species applies.' },

  // ── Ginsenoside-bearing extracts ──────────────────────────────────
  { slug: 'panax-ginseng',       note: 'Asian/Korean ginseng extract — 30+ ginsenosides (Rb1, Rb2, Rc, Rd, Re, Rf, Rg1, Rg3, etc.) with distinct ka, F, and t½. PK studies report individual ginsenosides; the extract as a whole has no single-species PK.' },
  { slug: 'eleuthero',           note: 'Siberian eleuthero (Eleutherococcus senticosus) — eleutherosides A–G mixture. Each glycoside has different absorption and clearance; whole-extract PK not single-species fittable.' },

  // ── Other classic adaptogen extracts ──────────────────────────────
  { slug: 'astragalus',          note: 'Astragalus membranaceus root extract — astragalosides + flavonoids + polysaccharides. Multi-component; clinical PK studies report individual astragalosides (Astragaloside IV most commonly), not the whole extract.' },
  { slug: 'bacopa',              note: 'Bacopa monnieri extract — bacosides A and B (saponin mixture) + bacopasides. Each bacoside has separate kinetics; whole-extract PK not unitary.' },
  { slug: 'cordyceps',           note: 'Cordyceps sinensis / militaris fungal extract — cordycepin + adenosine + polysaccharides. Multi-component; cordycepin has individual PK published but the mushroom extract as supplied is a mixture.' },
  { slug: 'gotu-kola',           note: 'Centella asiatica extract — asiaticoside + madecassoside + asiatic acid + madecassic acid (triterpene mixture). Multi-component; component-specific PK varies.' },
  { slug: 'holy-basil',          note: 'Ocimum sanctum (tulsi) extract — eugenol + ursolic acid + rosmarinic acid + flavonoids. Multi-component; no single plasma species PK applies.' },
  { slug: 'maca',                note: 'Lepidium meyenii (maca) root powder — macamides + macaenes + glucosinolates + saponins. Multi-component food-form supplement; no clinical single-species PK.' },
  { slug: 'reishi',              note: 'Ganoderma lucidum extract — triterpenes (ganoderic acids) + β-glucans + sterols. Multi-component fungal extract; no single plasma species.' },
  { slug: 'schisandra',          note: 'Schisandra chinensis fruit extract — schisandrins (A, B, C) + gomisins + lignan mixture. Component-specific PK; whole-extract not unitary.' },
  { slug: 'tongkat-ali',         note: 'Eurycoma longifolia (tongkat ali) root extract — quassinoids + alkaloids + eurycomanones. Multi-component; eurycomanone-specific PK exists but extract as a whole is a mixture.' },
  { slug: 'ginkgo-biloba',       note: 'Ginkgo biloba extract (e.g. EGb 761) — flavone glycosides + terpene lactones (ginkgolides A/B/C, bilobalide). Standardized to 24%/6% but each component has distinct PK.' },
  { slug: 'valerian',            note: 'Valeriana officinalis root extract — valerenic acid + valepotriates + sesquiterpenes + GABA. Multi-component; clinical PK reports individual valerenic acid only.' },
  { slug: 'lemon-balm',          note: 'Melissa officinalis leaf extract — rosmarinic acid + flavonoids + monoterpene glycosides. Multi-component herbal preparation.' },
  { slug: 'chamomile',           note: 'Matricaria chamomilla extract — apigenin + bisabolol + chamazulene + flavonoids. Multi-component; apigenin alone has PK literature, the extract does not.' },
  { slug: 'saffron',             note: 'Crocus sativus stigma — crocin + crocetin + safranal + picrocrocin. Multi-component; component-specific PK studies exist but extract as a whole is a mixture.' },
  { slug: 'passionflower',       note: 'Passiflora incarnata extract — flavonoids (apigenin, vitexin, isovitexin, schaftoside) + harman alkaloids. Multi-component; no single-species PK applies.' },

  // ── Mushroom polysaccharide extracts ──────────────────────────────
  { slug: 'maitake',             note: 'Grifola frondosa polysaccharide extract — β-glucan complex + ergosterol. β-glucans are large polysaccharides without classical small-molecule PK.' },
  { slug: 'chaga',               note: 'Inonotus obliquus extract — betulinic acid + melanin complex + polysaccharides. Multi-component fungal extract; no plasma PK in the classical sense.' },
  { slug: 'shiitake',            note: 'Lentinula edodes / lentinan polysaccharide. Large-MW β-glucan; no classical small-molecule PK applies.' },
  { slug: 'turkey-tail',         note: 'Trametes versicolor / PSK / PSP polysaccharide-protein complex. Large-MW immunomodulator; no classical PK.' },

  // ── Algae / cyanobacteria ─────────────────────────────────────────
  { slug: 'spirulina',           note: 'Spirulina (Arthrospira) — protein + phycocyanin + chlorophyll + carotenoids + GLA. Whole-food supplement; no single-species PK applies. Phycocyanin alone has individual PK literature.' },
  { slug: 'chlorella',           note: 'Chlorella vulgaris — protein + chlorophyll + nucleic acids + carotenoids + Chlorella Growth Factor. Whole-cell supplement; no single-species PK.' },

  // ── Botanical food extracts ──────────────────────────────────────
  { slug: 'beetroot-extract',    note: 'Beta vulgaris extract — betalains + nitrates + betaine. The clinical effect (NO-mediated vasodilation) tracks plasma nitrite, but the extract is a mixture; nitrate-specific PK exists.' },
  { slug: 'red-yeast-rice',      note: 'Monascus purpureus fermentation product — monacolin K (lovastatin equivalent) + 13 other monacolins + pigments. Statin-like activity; PK is variable per fermentation lot.' },
  { slug: 'echinacea',           note: 'Echinacea purpurea / angustifolia / pallida extracts — alkamides + chicoric acid + polysaccharides + glycoproteins. Multi-component; some alkamides have individual PK.' },
  { slug: 'elderberry',          note: 'Sambucus nigra fruit/flower extract — anthocyanins + flavonoids + lectins. Multi-component; anthocyanin-specific PK exists but whole-extract is a mixture.' },
  { slug: 'oregano-oil',         note: 'Origanum vulgare essential oil — carvacrol + thymol + γ-terpinene + p-cymene. Multi-component oil; component-specific PK varies.' },
  { slug: 'ginger',              note: 'Zingiber officinale extract — gingerols (6/8/10-gingerol) + shogaols + zingerone + paradols. Multi-component; component-specific PK exists.' },
  { slug: 'aged-garlic',         note: 'Aged garlic extract (AGE) — S-allyl cysteine + S-allyl mercaptocysteine + organosulfur mixture. Multi-component; SAC alone has individual PK.' },
  { slug: 'pycnogenol',          note: 'Pinus pinaster bark extract — procyanidins + catechins + phenolic acids. Multi-component flavonoid mixture; oligomeric procyanidins have variable absorption.' },
  { slug: 'fenugreek',           note: 'Trigonella foenum-graecum seed extract — 4-hydroxyisoleucine + saponins + galactomannan + trigonelline. Multi-component.' },
  { slug: 'tribulus',            note: 'Tribulus terrestris extract — protodioscin + steroidal saponins + flavonoids. Multi-component; protodioscin alone has limited PK literature.' },
  { slug: 'nigella-sativa',      note: 'Black seed (Nigella sativa) oil/extract — thymoquinone + dithymoquinone + nigellone + fixed oils. Multi-component; thymoquinone has individual PK.' },
  { slug: 'sea-buckthorn-oil',   note: 'Hippophae rhamnoides oil — omega-7 (palmitoleic) + omega-3 + carotenoids + tocopherols. Multi-component fatty acid + antioxidant mixture.' },
  { slug: 'royal-jelly',         note: 'Apis mellifera royal jelly — proteins (royalactin) + 10-HDA fatty acid + sugars + sterols. Multi-component bee secretion.' },
  { slug: 'propolis',            note: 'Bee propolis — flavonoids (chrysin, pinocembrin, galangin) + caffeic acid esters + terpenes. Composition varies by hive geography; multi-component mixture.' },
  { slug: 'yerba-mate',          note: 'Ilex paraguariensis extract — caffeine + theobromine + chlorogenic acids + saponins. Caffeine is the dominant bioactive (already in catalog with PK); the extract as a whole is a mixture.' },
  { slug: 'nettle',              note: 'Urtica dioica root/leaf extract — phytosterols + lectins + lignans + flavonoids. Multi-component.' },
  { slug: 'dandelion',           note: 'Taraxacum officinale root/leaf — sesquiterpene lactones + inulin + flavonoids + potassium. Multi-component diuretic herb.' },
  { slug: 'raspberry-leaf',      note: 'Rubus idaeus leaf — fragarine + tannins + flavonoids. Traditional uterine-tonic herb; multi-component.' },
  { slug: 'milk-thistle',        note: 'Silybum marianum extract — silymarin (itself a 6-flavonolignan complex: silybin A/B, isosilybin A/B, silychristin, silydianin). Often standardized to 80% silymarin but each flavonolignan has distinct kinetics.' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;
  for (const a of ANNOTATIONS) {
    const c = bySlug.get(a.slug);
    if (!c) { console.warn(`  [warn] missing: ${a.slug}`); missing++; continue; }
    if (c.pk_unauthored) { alreadyHas++; continue; }
    c.pk_unauthored = { reason: 'mixture', note: a.note };
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`adaptogen-mixture annotation: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
