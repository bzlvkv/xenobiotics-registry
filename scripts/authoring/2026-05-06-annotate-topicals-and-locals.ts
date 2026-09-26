/**
 * 2026-05-06-annotate-topicals-and-locals.ts
 *
 * Bulk-annotates compounds where systemic plasma PK is irrelevant
 * by formulation/route, with appropriate pk_unauthored reasons.
 *
 * Three groups annotated:
 *
 * 1. Pure topicals (52) — entire `topical` category. These are
 *    creams / gels / sprays / shampoos with negligible systemic
 *    absorption from approved indications.
 *
 * 2. Ophthalmic + inhaled pharmaceuticals (~25 in pharmacological
 *    category). Eye drops act on the iris/retina; inhaled
 *    bronchodilators / corticosteroids deposit in the airways.
 *    Systemic exposure exists but the clinically relevant
 *    compartment is local.
 *
 * 3. Endogenous neurotransmitters (5) — used as physiology probes
 *    in research, not as clinical drugs with established PK profiles.
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
  category?: string;
  [k: string]: unknown;
}

type Annotation = { slug: string; reason: 'local-acting' | 'research-only' | 'mixture'; note: string };

const ANNOTATIONS: Annotation[] = [
  // ── 1. Topicals (52 in `topical` category) ───────────────────────
  { slug: 'adapalene',              reason: 'local-acting', note: 'Topical retinoid (Differin) for acne. Negligible systemic absorption from cream/gel formulations; <1% F per FDA label.' },
  { slug: 'avobenzone',             reason: 'local-acting', note: 'Topical UVA sunscreen filter. Designed to absorb UVA at the skin surface; minimal transdermal absorption.' },
  { slug: 'azelaic-acid',           reason: 'local-acting', note: 'Topical dicarboxylic acid (Finacea / Azelex) for rosacea / acne. <4% systemic absorption from gel/cream.' },
  { slug: 'bakuchiol',              reason: 'local-acting', note: 'Plant-derived retinol functional analog used topically for photoaging. Cosmetic concentration; no systemic plasma PK.' },
  { slug: 'benzocaine',             reason: 'local-acting', note: 'Ester local anesthetic (Anbesol / Orajel). Topical mucosal use; metabolized rapidly to PABA, no systemic PK relevance.' },
  { slug: 'butenafine',             reason: 'local-acting', note: 'Topical benzylamine antifungal (Mentax). Stays in stratum corneum; no clinical systemic PK.' },
  { slug: 'calcipotriene',          reason: 'local-acting', note: 'Vitamin D3 analog (Dovonex) for psoriasis. ~6% systemic absorption from ointment, but PK is dominated by local epidermal effect.' },
  { slug: 'capsaicin-topical',      reason: 'local-acting', note: 'TRPV1 agonist patch / cream (Qutenza). Acts on dermal C-fibers; no clinically relevant systemic exposure.' },
  { slug: 'chlorhexidine',          reason: 'local-acting', note: 'Bisbiguanide antiseptic (Hibiclens / Peridex). Topical / oral rinse; binds skin & mucosa, essentially no GI absorption.' },
  { slug: 'ciclopirox',             reason: 'local-acting', note: 'Hydroxypyridone topical antifungal (Loprox). Cream / nail lacquer; <1.3% systemic absorption.' },
  { slug: 'clindamycin-topical',    reason: 'local-acting', note: 'Topical lincosamide (Cleocin T) for acne. ~4-5% systemic absorption from solution; clinically focused on follicular C. acnes.' },
  { slug: 'clobetasol',             reason: 'local-acting', note: 'Class I (super-potent) topical corticosteroid (Temovate). HPA-axis suppression possible at extensive dosing, but PK is dermal.' },
  { slug: 'clotrimazole',           reason: 'local-acting', note: 'Topical imidazole antifungal. Cream / lotion / lozenge; negligible systemic absorption from skin / mouth.' },
  { slug: 'crisaborole',            reason: 'local-acting', note: 'Topical PDE4 inhibitor (Eucrisa) for atopic dermatitis. Limited systemic exposure from 2% ointment.' },
  { slug: 'desoximetasone',         reason: 'local-acting', note: 'Class III topical corticosteroid (Topicort). Dermal use; systemic absorption minimal at standard cream/gel doses.' },
  { slug: 'efinaconazole',          reason: 'local-acting', note: 'Topical triazole nail solution (Jublia) for onychomycosis. Negligible systemic exposure.' },
  { slug: 'erythromycin-topical',   reason: 'local-acting', note: 'Topical macrolide (A/T/S, Erygel) for acne. Stays at skin surface; no clinically relevant plasma PK.' },
  { slug: 'finasteride-topical',    reason: 'local-acting', note: 'Topical 5α-reductase inhibitor (compounded / Twin Tower). Designed to reduce systemic exposure vs oral; PK studies report DHT effect locally.' },
  { slug: 'fluocinolone',           reason: 'local-acting', note: 'Class V topical corticosteroid (Synalar). Dermal use; negligible systemic PK at standard cream doses.' },
  { slug: 'fluocinonide',           reason: 'local-acting', note: 'Class II topical corticosteroid (Lidex). Dermal use; minimal systemic absorption.' },
  { slug: 'glycolic-acid',          reason: 'local-acting', note: 'Alpha-hydroxy acid for chemical peels / cosmetics. Acts on stratum corneum; no systemic PK at cosmetic concentrations.' },
  { slug: 'ha-hmw',                 reason: 'local-acting', note: 'High molecular weight hyaluronic acid (>1000 kDa). Topical / IA use; not absorbed transdermally; intra-articular HA has localized residence.' },
  { slug: 'ha-lmw',                 reason: 'local-acting', note: 'Low molecular weight HA (<500 kDa). Topical cosmetic use; no clinical systemic PK profile at supplied concentrations.' },
  { slug: 'ha-mmw',                 reason: 'local-acting', note: 'Medium molecular weight HA. Topical cosmetic / IA injectable; PK not in classical plasma-fitting sense.' },
  { slug: 'halobetasol',            reason: 'local-acting', note: 'Class I super-potent topical corticosteroid (Ultravate). Dermal use; HPA-axis suppression possible but PK is local.' },
  { slug: 'hydrocortisone-topical', reason: 'local-acting', note: 'Class VII topical corticosteroid (OTC 1%, Cortizone). Dermal use; minimal systemic absorption at standard doses.' },
  { slug: 'hydroquinone',           reason: 'local-acting', note: 'Topical depigmenting agent (4% Tri-Luma component). Acts on melanocytes; minimal systemic absorption.' },
  { slug: 'ketoconazole-shampoo',   reason: 'local-acting', note: 'Topical antifungal shampoo / cream (Nizoral). 2% formulation; negligible systemic absorption (vs oral ketoconazole which has PK authored separately).' },
  { slug: 'kojic-acid',             reason: 'local-acting', note: 'Tyrosinase inhibitor used topically for hyperpigmentation. Cosmetic concentrations; no clinical systemic PK.' },
  { slug: 'l-ascorbic-acid-topical', reason: 'local-acting', note: 'Topical vitamin C for skin antioxidant / collagen synthesis. Permeates stratum corneum; no relevant systemic PK at cosmetic doses.' },
  { slug: 'lactic-acid-topical',    reason: 'local-acting', note: 'Alpha-hydroxy acid for skin keratolysis. Topical cosmetic concentrations; no systemic PK.' },
  { slug: 'lidocaine-topical',      reason: 'local-acting', note: 'Topical amide local anesthetic (Lidoderm patch, viscous, EMLA component). Acts on cutaneous nociceptors; systemic absorption is the safety endpoint, not the therapeutic one.' },
  { slug: 'mandelic-acid',          reason: 'local-acting', note: 'Alpha-hydroxy acid for chemical peels / acne. Topical cosmetic; no systemic PK at applied concentrations.' },
  { slug: 'metronidazole-topical',  reason: 'local-acting', note: 'Topical nitroimidazole (MetroGel / MetroLotion) for rosacea. Minimal systemic absorption vs oral metronidazole (which has PK authored).' },
  { slug: 'miconazole',             reason: 'local-acting', note: 'Topical / oral mucosal imidazole antifungal (Monistat / Oravig). Vaginal / skin / buccal use; systemic absorption is incidental.' },
  { slug: 'minoxidil',              reason: 'local-acting', note: 'Topical hair-loss treatment (Rogaine 2%/5%). Designed for scalp absorption; ~1.4% systemic transdermal F vs ~95% oral (which is a different indication, hypertension).' },
  { slug: 'mupirocin',              reason: 'local-acting', note: 'Topical pseudomonic acid antibacterial (Bactroban). Ointment for impetigo / nasal MRSA decolonization; <1.2% systemic absorption.' },
  { slug: 'niacinamide',            reason: 'local-acting', note: 'Topical vitamin B3 amide (cosmetic). Acts at skin surface for barrier / pigmentation; oral niacinamide has separate systemic PK.' },
  { slug: 'octinoxate',             reason: 'local-acting', note: 'Topical UVB sunscreen filter. Surface-acting; recently flagged for systemic detection but not authored as a drug PK.' },
  { slug: 'oxymetazoline',          reason: 'local-acting', note: 'Topical α-agonist nasal decongestant / dermal vasoconstrictor (Afrin / Rhofade). Local mucosal / cutaneous; some systemic absorption with prolonged use.' },
  { slug: 'permethrin',             reason: 'local-acting', note: 'Topical pyrethroid scabicide / pediculicide (Elimite, Nix). Acts on parasites at skin surface; <2% systemic absorption.' },
  { slug: 'pimecrolimus',           reason: 'local-acting', note: 'Topical calcineurin inhibitor (Elidel) for atopic dermatitis. Designed for low systemic exposure vs oral / IV calcineurin inhibitors.' },
  { slug: 'pramoxine',              reason: 'local-acting', note: 'Topical aminoamide local anesthetic (Caladryl / Tronothane). OTC for itch / minor pain; minimal systemic absorption.' },
  { slug: 'selenium-sulfide',       reason: 'local-acting', note: 'Topical anti-Malassezia agent (Selsun / Head & Shoulders 1%). Shampoo / lotion; negligible systemic absorption.' },
  { slug: 'sodium-fluoride',        reason: 'local-acting', note: 'Topical / dental / drinking-water fluoride. Caries prevention is local enamel-acting; systemic exposure exists but is not the therapeutic target.' },
  { slug: 'tacrolimus-topical',     reason: 'local-acting', note: 'Topical calcineurin inhibitor (Protopic). Designed for low systemic absorption vs oral tacrolimus (which has PK authored separately).' },
  { slug: 'tolnaftate',             reason: 'local-acting', note: 'Topical thiocarbamate antifungal (Tinactin). OTC; negligible systemic absorption.' },
  { slug: 'tranexamic-acid-topical', reason: 'local-acting', note: 'Topical antifibrinolytic for melasma. Cosmetic dermatology use; oral tranexamic acid (different indication) has separate PK.' },
  { slug: 'trifarotene',            reason: 'local-acting', note: 'Topical fourth-generation retinoid (Aklief) for acne. Designed for low systemic exposure; trace plasma levels at maximum-use studies.' },
  { slug: 'undecylenic-acid',       reason: 'local-acting', note: 'Topical fatty acid antifungal (Desenex). OTC; negligible systemic absorption.' },
  { slug: 'zinc-oxide',             reason: 'local-acting', note: 'Topical mineral sunscreen / barrier cream. Surface-reflecting; minimal transdermal Zn absorption.' },
  { slug: 'zinc-pyrithione',        reason: 'local-acting', note: 'Topical zinc complex antimicrobial / antidandruff (Head & Shoulders, Vanicream Z-Bar). Minimal systemic absorption.' },

  // ── 2. Ophthalmic + Inhaled pharmaceuticals (~22) ────────────────
  // Eye drops
  { slug: 'dorzolamide',            reason: 'local-acting', note: 'Topical ophthalmic CAI (Trusopt). Acts on ciliary body; trace systemic absorption causing systemic CA inhibition.' },
  { slug: 'latanoprost',            reason: 'local-acting', note: 'PGF2α analog ophthalmic (Xalatan). Acts on uveoscleral outflow; systemic exposure negligible after eye drop.' },
  { slug: 'timolol-eye',            reason: 'local-acting', note: 'Topical ophthalmic β-blocker (Timoptic). Acts on aqueous humor production; systemic absorption is dose-related safety concern, not therapeutic.' },
  { slug: 'brimonidine',            reason: 'local-acting', note: 'α2-agonist eye drop (Alphagan-P) and topical for rosacea (Mirvaso). Acts at site of application; systemic absorption is dose-limiting, not therapeutic.' },
  { slug: 'olopatadine',            reason: 'local-acting', note: 'H1-antagonist + mast cell stabilizer ophthalmic (Patanol/Pataday) and intranasal (Patanase). Topical mucosal action; minimal systemic.' },
  { slug: 'ru-58841',               reason: 'local-acting', note: 'Topical anti-androgen (research/grey-market, hair loss). Designed for scalp-localized DHT receptor antagonism without systemic anti-androgenic effect.' },

  // Inhaled bronchodilators / corticosteroids
  { slug: 'salbutamol',             reason: 'local-acting', note: 'Inhaled SABA (Ventolin / ProAir / albuterol). MDI/nebulizer effect is bronchodilation at airway β2; systemic absorption causes tremor / tachycardia (not therapeutic).' },
  { slug: 'salmeterol',             reason: 'local-acting', note: 'Inhaled LABA (Serevent / Advair component). Bronchodilation at airway β2; systemic plasma levels are at the limit of quantitation.' },
  { slug: 'formoterol',             reason: 'local-acting', note: 'Inhaled LABA (Foradil / Symbicort component). Same compartment logic as salmeterol.' },
  { slug: 'indacaterol',            reason: 'local-acting', note: 'Inhaled ultra-LABA (Arcapta / Utibron component). Once-daily airway β2; minimal systemic.' },
  { slug: 'vilanterol',             reason: 'local-acting', note: 'Inhaled ultra-LABA (Breo / Anoro / Trelegy component). Once-daily airway β2.' },
  { slug: 'umeclidinium',           reason: 'local-acting', note: 'Inhaled LAMA (Incruse / Anoro / Trelegy). Once-daily airway M3; minimal systemic.' },
  { slug: 'tiotropium',             reason: 'local-acting', note: 'Inhaled LAMA (Spiriva HandiHaler / Respimat). Once-daily airway M3; trace systemic.' },
  { slug: 'ipratropium',            reason: 'local-acting', note: 'Inhaled SAMA (Atrovent / Combivent component). Quaternary amine, near-zero systemic absorption.' },
  { slug: 'ciclesonide',            reason: 'local-acting', note: 'Inhaled corticosteroid prodrug (Alvesco / Omnaris). Activated locally in lung by esterases; F<1% systemic.' },
  { slug: 'fluticasone',            reason: 'local-acting', note: 'Inhaled / intranasal corticosteroid (Flonase / Flovent / Advair). Topical mucosal action; oral F essentially zero from oropharyngeal swallowed fraction.' },
  { slug: 'fluticasone-furoate',    reason: 'local-acting', note: 'Inhaled / intranasal furoate ester (Veramyst / Breo / Trelegy / Arnuity). Same logic — local airway / mucosal action.' },
  { slug: 'mometasone',             reason: 'local-acting', note: 'Inhaled / intranasal corticosteroid (Asmanex / Nasonex). Topical mucosal action; minimal systemic.' },
  { slug: 'triamcinolone',          reason: 'local-acting', note: 'Inhaled / intranasal / IM / topical corticosteroid (Kenalog / Nasacort). Most uses are local — IM injection has separate PK depot kinetics.' },
  { slug: 'cromolyn',               reason: 'local-acting', note: 'Mast cell stabilizer; inhaled / intranasal / ophthalmic / oral GI use. Designed for local mucosal action; F<1% systemic.' },
  { slug: 'ketotifen',              reason: 'local-acting', note: 'Topical ophthalmic / oral H1 + mast cell stabilizer (Zaditor / Zaditen). Eye drop is local; oral use exists in some markets but PK is highly variable.' },

  // ── 3. Endogenous neurotransmitters (5) ──────────────────────────
  { slug: 'acetylcholine',          reason: 'research-only', note: 'Endogenous parasympathetic neurotransmitter. Used clinically only as ophthalmic miotic (Miochol-E) and in research IV physiology. Plasma t½ measured in seconds — no systemic PK profile in the therapeutic-dosing sense.' },
  { slug: 'dopamine',               reason: 'research-only', note: 'Endogenous catecholamine; clinical use is IV continuous infusion for shock/HF. Plasma t½ ~2 minutes, dose titrated to MAP/HR target rather than authored PK. Not a single-dose drug.' },
  { slug: 'gaba',                   reason: 'research-only', note: 'Endogenous inhibitory neurotransmitter. Oral GABA does not cross BBB meaningfully; supplemented form has no central PK relevance.' },
  { slug: 'norepinephrine',         reason: 'research-only', note: 'Endogenous sympathetic neurotransmitter. Clinical use is IV continuous infusion for septic shock; titrated to MAP, no authored PK profile.' },
  { slug: 'serotonin',              reason: 'research-only', note: 'Endogenous monoamine; not used as a clinical drug. Research / probe administration only. Plasma t½ measured in seconds; no therapeutic PK profile.' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;
  for (const a of ANNOTATIONS) {
    const c = bySlug.get(a.slug);
    if (!c) { console.warn(`  [warn] missing: ${a.slug}`); missing++; continue; }
    if (c.pk_unauthored) { alreadyHas++; continue; }
    c.pk_unauthored = { reason: a.reason, note: a.note };
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`topical+local annotation: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
