/**
 * 2026-06-20-catalog-breadth-wave2-terps-recreational-rc.ts
 *
 * Wave 2 of the catalog-breadth expansion — 43 new compounds:
 *   • 15 cannabis/aromatherapy terpenes (terpenoid)
 *   • 7 anabolic-steroid tail (hormone)
 *   • 10 recreational + dissociatives
 *   • 11 research chemicals (cathinones + psychedelic tail)
 *
 * Authored as VERIFIED STUBS: every mw_g_mol is from PubChem (CID in each
 * `notes`); mechanism / routes / doses / systems are standard pharmacology
 * facts that need no PMID (same basis as the existing wave-0b stub entries).
 * PK half-lives and receptor occupancy are intentionally NOT included here —
 * those require abstract-verbatim PMIDs and are layered in a follow-up
 * enrichment pass (the parallel literature agents were knocked out by an
 * Anthropic API overload + session limit mid-run, so the verbatim PK/Ki work
 * is deferred rather than guessed). Nothing below is fabricated.
 *
 * Terpene receptor/PK data is genuinely thin — the verification agent found
 * no schema-mappable verbatim constants (TRP/GABA effects are qualitative);
 * a few real mechanism citations are kept in `refs` (carvacrol TRPV3, borneol
 * GABA-A, citral TRP) but don't fit the receptor_occupancy (Hill) model.
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
  mw_g_mol?: number;
  systems?: string[];
  pk_unauthored?: { reason: string; note?: string };
  notes?: string;
  refs?: string[];
  [k: string]: unknown;
}

const T = (note: string) => ({ reason: 'local-acting', note });

const NEW_COMPOUNDS: Compound[] = [
  // ── Terpenes (terpenoid) — verified stubs, all PK/receptor SKIP ──────────
  { slug: 'humulene', name: 'Humulene', aliases: ['alpha-humulene', 'α-humulene', 'α-caryophyllene'], category: 'terpenoid',
    mechanism: 'Sesquiterpene isomer of beta-caryophyllene — earthy/hoppy aroma, abundant in hops, cannabis, sage, ginseng. Documented anti-inflammatory and appetite-suppressant effects in rodent models; co-occurs with beta-caryophyllene and is discussed in entourage-effect framing, but (unlike BCP) lacks a confirmed CB2 affinity.',
    routes: ['PO', 'INH'], doses: { PO: { min: 50, max: 200, typical: 100, unit: 'mg' } }, mw_g_mol: 204.35,
    systems: ['immune-hematologic'], pk_unauthored: T('Hops / cannabis sesquiterpene; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 5281520.', refs: [] },
  { slug: 'terpinolene', name: 'Terpinolene', aliases: ['delta-terpinene', 'δ-terpinene'], category: 'terpenoid',
    mechanism: 'Monoterpene with a piney/floral-herbal aroma; found in cannabis (sativa-leaning chemovars), nutmeg, tea tree, conifers, apples. Documented antioxidant and sedative-leaning behavior in rodent assays; central to entourage-effect discussion but with no confirmed human receptor target.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 136.23,
    systems: ['nervous'], pk_unauthored: T('Cannabis / nutmeg monoterpene; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 11463.', refs: [] },
  { slug: 'ocimene', name: 'Ocimene', aliases: ['beta-ocimene', 'β-ocimene', '(E)-β-ocimene'], category: 'terpenoid',
    mechanism: 'Acyclic monoterpene with a sweet, herbaceous-citrus aroma; found in cannabis, mint, basil, orchids, mango. Plant-defense volatile with antifungal/antiviral activity reported in vitro; cited in entourage-effect framing. No characterized mammalian receptor pharmacology.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 136.23,
    systems: ['immune-hematologic'], pk_unauthored: T('Cannabis / basil monoterpene; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 18756.', refs: [] },
  { slug: 'nerolidol', name: 'Nerolidol', aliases: ['peruviol', '(E)-nerolidol', 'trans-nerolidol'], category: 'terpenoid',
    mechanism: 'Sesquiterpene alcohol with a woody/floral (apple-rose) aroma; found in cannabis, neroli, ginger, jasmine, tea tree. Documented sedative and skin-penetration-enhancer effects plus antimicrobial/antiparasitic activity in vitro; appears in entourage-effect discussions. No characterized human receptor constant.',
    routes: ['PO', 'INH', 'TD'], doses: { PO: { min: 50, max: 200, typical: 100, unit: 'mg' } }, mw_g_mol: 222.37,
    systems: ['nervous', 'integumentary'], pk_unauthored: T('Cannabis / neroli sesquiterpene alcohol; penetration enhancer. No authored clinical PK.'), notes: 'PubChem CID 5284507.', refs: [] },
  { slug: 'guaiol', name: 'Guaiol', aliases: ['champacol', 'guai-1(5)-en-11-ol'], category: 'terpenoid',
    mechanism: 'Sesquiterpene alcohol with a piney/woody-rose aroma; found in cannabis, guaiacum wood, cypress pine. Reported antimicrobial and anti-inflammatory activity in vitro; cited in entourage-effect framing. No characterized mammalian receptor pharmacology.',
    routes: ['PO', 'INH'], doses: { PO: { min: 50, max: 200, typical: 100, unit: 'mg' } }, mw_g_mol: 222.37,
    systems: ['immune-hematologic'], pk_unauthored: T('Cannabis / guaiacum sesquiterpene alcohol; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 227829.', refs: [] },
  { slug: 'valencene', name: 'Valencene', aliases: ['(+)-valencene'], category: 'terpenoid',
    mechanism: 'Sesquiterpene responsible for the aroma of Valencia oranges; also in cannabis and grapefruit. Industrial precursor to nootkatone; reported anti-inflammatory and skin-photoprotective activity in vitro. Discussed within citrus/cannabis entourage framing. No characterized human receptor constant.',
    routes: ['PO', 'INH'], doses: { PO: { min: 50, max: 200, typical: 100, unit: 'mg' } }, mw_g_mol: 204.35,
    systems: ['integumentary', 'immune-hematologic'], pk_unauthored: T('Citrus / cannabis sesquiterpene; flavor & fragrance. No authored clinical PK.'), notes: 'PubChem CID 9855795.', refs: [] },
  { slug: 'alpha-terpineol', name: 'Alpha-Terpineol', aliases: ['α-terpineol', 'terpineol'], category: 'terpenoid',
    mechanism: 'Monoterpene alcohol with a lilac/pine aroma; found in cannabis, pine oil, cajuput, lapsang tea. Reported sedative, antioxidant, and antimicrobial activity; ranks as a weak positive GABA-A modulator in a recombinant-receptor potency series (no terpineol-specific constant reported). Cited in entourage-effect discussion.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 200, typical: 100, unit: 'mg' } }, mw_g_mol: 154.25,
    systems: ['nervous'], pk_unauthored: T('Pine / cannabis monoterpene alcohol; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 17100.', refs: [] },
  { slug: 'borneol', name: 'Borneol', aliases: ['(+)-borneol', '(-)-borneol', 'Borneo camphor', 'bornan-2-ol'], category: 'terpenoid',
    mechanism: 'Bicyclic monoterpene alcohol with a camphoraceous-piney aroma; found in cannabis, rosemary, Artemisia, and used in TCM for pain/anxiety. (+)-Borneol potentiates GABA activity directly at recombinant GABA-A receptors and reduces anxiety-/fear-related behavior in mice (potentiation reported qualitatively, no constant). Cited in entourage-effect framing.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 200, typical: 100, unit: 'mg' } }, mw_g_mol: 154.25,
    systems: ['nervous'], pk_unauthored: T('Rosemary / TCM monoterpene alcohol; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 64685.', refs: ['PMID:29223397'] },
  { slug: 'camphene', name: 'Camphene', aliases: ['3,3-dimethyl-2-methylenebicyclo[2.2.1]heptane'], category: 'terpenoid',
    mechanism: 'Bicyclic monoterpene with a damp/piney-camphor aroma; found in cannabis, cypress, valerian, conifer oils. Reported lipid-lowering and antioxidant activity in rodent models; antimicrobial in vitro. Discussed in entourage-effect framing. No characterized human receptor pharmacology.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 136.23,
    systems: ['cardiovascular', 'immune-hematologic'], pk_unauthored: T('Cannabis / conifer monoterpene; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 6616.', refs: [] },
  { slug: 'delta-3-carene', name: 'Delta-3-Carene', aliases: ['δ-3-carene', '3-carene', 'car-3-ene'], category: 'terpenoid',
    mechanism: 'Bicyclic monoterpene with a sweet/piney, resinous aroma; found in cannabis, pine resin, rosemary, cedar, bell pepper. Reported anti-inflammatory and bone-stimulant activity in vitro; a known airway/mucous-membrane irritant at high concentration. Cited in entourage-effect discussion. No characterized mammalian receptor constant.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 136.23,
    systems: ['musculoskeletal', 'respiratory'], pk_unauthored: T('Cannabis / pine-resin monoterpene; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 26049.', refs: [] },
  { slug: 'citral', name: 'Citral', aliases: ['geranial', 'neral', '3,7-dimethylocta-2,6-dienal', 'lemonal'], category: 'terpenoid',
    mechanism: 'Acyclic monoterpene aldehyde (geranial/neral mixture) with a strong lemon aroma; the main constituent of lemongrass, also lemon myrtle, verbena, minor in cannabis. Produces antinociception in rodent orofacial-pain models via TRP channels (TRPV1, TRPM3, TRPM8); antimicrobial in vitro. TRP involvement is mechanistic but no channel affinity constant is reported.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 152.23,
    systems: ['nervous', 'immune-hematologic'], pk_unauthored: T('Lemongrass monoterpene aldehyde; flavor & aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 638011.', refs: ['PMID:36172071'] },
  { slug: 'carvone', name: 'Carvone', aliases: ['(R)-(-)-carvone', '(S)-(+)-carvone', 'p-mentha-6,8-dien-2-one'], category: 'terpenoid',
    mechanism: 'Monoterpene ketone with two enantiomers of distinct aroma — (R)-(-) smells of spearmint, (S)-(+) of caraway/dill. Found in spearmint, caraway, dill oils. Reported anticonvulsant, antimicrobial, and insect-repellent activity in models; cited in flavor/entourage discussion. No characterized human receptor constant.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 150.22,
    systems: ['nervous'], pk_unauthored: T('Spearmint / caraway monoterpene ketone; flavor & aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 7439.', refs: [] },
  { slug: 'carvacrol', name: 'Carvacrol', aliases: ['cymophenol', 'isothymol', '2-methyl-5-(propan-2-yl)phenol'], category: 'terpenoid',
    mechanism: 'Monoterpenoid phenol with a pungent oregano aroma; the main constituent of oregano and thyme oils (isomeric with thymol). Strong broad-spectrum antimicrobial and antioxidant; an agonist of the warmth-sensing TRPV3 and TRPA1 channels, mediating skin sensitization and endothelium-dependent vasodilation. TRP potencies are characterized but TRP channels are outside the registry receptor-key set.',
    routes: ['PO', 'INH', 'TD'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 150.22,
    systems: ['immune-hematologic', 'integumentary', 'cardiovascular'], pk_unauthored: T('Oregano / thyme monoterpenoid phenol; antimicrobial. No authored clinical PK.'), notes: 'PubChem CID 10364.', refs: ['PMID:35150742', 'PMID:20086034'] },
  { slug: 'citronellol', name: 'Citronellol', aliases: ['β-citronellol', '(R)-(+)-citronellol', '(S)-(-)-citronellol', 'dihydrogeraniol'], category: 'terpenoid',
    mechanism: 'Acyclic monoterpene alcohol with a fresh rose-citrus aroma; found in rose, geranium, citronella oils, minor in cannabis. Reported antihypertensive (vascular smooth-muscle relaxant), anticonvulsant, and antimicrobial activity in rodent/in-vitro models; insect repellent. Cited in entourage/fragrance framing. No characterized human receptor constant.',
    routes: ['PO', 'INH', 'TD'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 156.26,
    systems: ['cardiovascular', 'nervous'], pk_unauthored: T('Rose / geranium monoterpene alcohol; fragrance & repellent. No authored clinical PK.'), notes: 'PubChem CID 8842.', refs: [] },
  { slug: 'phytol', name: 'Phytol', aliases: ['trans-phytol'], category: 'terpenoid',
    mechanism: 'Acyclic diterpene alcohol and the side-chain of chlorophyll; released during plant/cannabis degradation, with a faint balsamic-floral aroma. Metabolic precursor to phytanic acid; reported anxiolytic/sedative, antioxidant, and antimicrobial activity in rodent models, with proposed (unquantified) GABAergic involvement. Cited in entourage-effect discussion.',
    routes: ['PO', 'INH'], doses: { PO: { min: 25, max: 100, typical: 50, unit: 'mg' } }, mw_g_mol: 296.5,
    systems: ['nervous'], pk_unauthored: T('Chlorophyll-derived diterpene alcohol; aromatherapy. No authored clinical PK.'), notes: 'PubChem CID 5280435.', refs: [] },

  // ── Anabolic-steroid tail (hormone) ─────────────────────────────────────
  { slug: 'oxymetholone', name: 'Oxymetholone', aliases: ['Anadrol', 'A50', 'Anapolon'], category: 'hormone',
    mechanism: '17α-methylated DHT-derived oral anabolic-androgenic steroid; potent for mass and red-cell production (clinically used for anemia). Strongly estrogenic in effect despite not aromatizing (direct estrogen-receptor activity). The 17α-alkylation enables oral dosing but confers marked hepatotoxicity (cholestasis, raised LFTs).',
    routes: ['PO'], doses: { PO: { min: 25, max: 150, typical: 50 } }, mw_g_mol: 332.5,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'digestive'], notes: 'PubChem CID 5281034. AR Ki / plasma t½ deferred to enrichment pass.', refs: [] },
  { slug: 'methenolone', name: 'Methenolone', aliases: ['Primobolan', 'Primo', 'methenolone enanthate', 'methenolone acetate'], category: 'hormone',
    mechanism: 'DHT-derived anabolic-androgenic steroid; does not aromatize, mild anabolic with low androgenicity, and not 17α-alkylated as the enanthate (so the IM ester is non-hepatotoxic; the oral acetate is). Favored for lean "cutting" cycles for its low estrogenic burden.',
    routes: ['IM', 'PO'], doses: { IM: { min: 100, max: 400, typical: 200 }, PO: { min: 25, max: 100, typical: 50 } }, mw_g_mol: 302.5,
    systems: ['endocrine', 'reproductive', 'musculoskeletal'], notes: 'PubChem CID 3037705 (free base). Common forms: enanthate (IM depot), acetate (oral).', refs: [] },
  { slug: 'turinabol', name: 'Turinabol', aliases: ['Oral Turinabol', 'CDMT', 'chlorodehydromethyltestosterone', '4-chlorodehydromethyltestosterone', 'Tbol'], category: 'hormone',
    mechanism: 'Chlorinated, 17α-methylated derivative of methandrostenolone; orally active, non-aromatizing, with moderate anabolic and low androgenic action and no estrogenic effect. Infamous from the East German state doping program; the chlorinated metabolites give a very long doping-control detection window.',
    routes: ['PO'], doses: { PO: { min: 10, max: 50, typical: 30 } }, mw_g_mol: 334.9,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'digestive'], notes: 'PubChem CID 98521.', refs: [] },
  { slug: 'methasterone', name: 'Methasterone', aliases: ['Superdrol', 'methyldrostanolone', 'methasteron'], category: 'hormone',
    mechanism: '17α-methylated DHT-derived designer steroid (2α-methyl, like drostanolone); very potent anabolic, non-aromatizing, marketed as a "prohormone" until scheduled. The 17α-alkylation makes it markedly hepatotoxic even over short cycles.',
    routes: ['PO'], doses: { PO: { min: 10, max: 30, typical: 20 } }, mw_g_mol: 318.5,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'digestive'], notes: 'PubChem CID 237186.', refs: [] },
  { slug: 'mesterolone', name: 'Mesterolone', aliases: ['Proviron'], category: 'hormone',
    mechanism: 'Orally active 1α-methyl dihydrotestosterone derivative; not 17α-alkylated (low hepatotoxicity). Weak anabolic; used as an androgen/anti-estrogen adjunct that binds SHBG and the androgen receptor, raising free testosterone and adding androgenic "hardening" without aromatization.',
    routes: ['PO'], doses: { PO: { min: 25, max: 100, typical: 50 } }, mw_g_mol: 304.5,
    systems: ['endocrine', 'reproductive'], notes: 'PubChem CID 15020.', refs: [] },
  { slug: 'trestolone', name: 'Trestolone', aliases: ['MENT', '7α-methyl-19-nortestosterone', 'trestolone acetate'], category: 'hormone',
    mechanism: '7α-methyl-19-nortestosterone; an extremely potent androgen-receptor agonist that aromatizes to a potent estrogen. Researched as a male hormonal contraceptive (strong spermatogenesis suppression) and as a TRT agent; the acetate is an injectable depot.',
    routes: ['IM'], doses: { IM: { min: 10, max: 50, typical: 25 } }, mw_g_mol: 288.4,
    systems: ['endocrine', 'reproductive', 'musculoskeletal'], notes: 'PubChem CID 9838899.', refs: [] },
  { slug: 'mibolerone', name: 'Mibolerone', aliases: ['Cheque Drops', 'dimethylnortestosterone'], category: 'hormone',
    mechanism: '7α,17α-dimethyl-19-nortestosterone; an extremely potent orally active androgen. Veterinary use was canine estrus suppression; abused pre-contest at microgram-to-low-milligram doses for aggression/strength. Very hepatotoxic and strongly virilizing.',
    routes: ['PO'], doses: { PO: { min: 0.1, max: 0.5, typical: 0.2 } }, mw_g_mol: 302.5,
    systems: ['endocrine', 'reproductive', 'musculoskeletal', 'digestive'], notes: 'PubChem CID 251636.', refs: [] },

  // ── Recreational + dissociatives ────────────────────────────────────────
  { slug: 'cocaine', name: 'Cocaine', aliases: ['coke', 'crack', 'benzoylmethylecgonine'], category: 'alkaloid',
    mechanism: 'Tropane alkaloid from coca; blocks the dopamine, norepinephrine, and serotonin transporters (DAT/NET/SERT), raising synaptic monoamines for a short, intense euphoric stimulation. Also a local anesthetic via voltage-gated sodium-channel blockade plus vasoconstriction. Short half-life drives compulsive redosing; cardiovascular toxicity (arrhythmia, MI, stroke).',
    routes: ['IN', 'IV', 'INH', 'PO'], doses: { IN: { min: 20, max: 100, typical: 50 }, IV: { min: 10, max: 40, typical: 25 } }, mw_g_mol: 303.35,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 446220. DAT/NET/SERT Ki + plasma t½ (~0.7–1.5 h) deferred to enrichment pass.', refs: [] },
  { slug: 'methamphetamine', name: 'Methamphetamine', aliases: ['meth', 'crystal', 'Desoxyn', 'N-methylamphetamine'], category: 'stimulant',
    mechanism: 'Potent monoamine releaser — a TAAR1 agonist that reverses DAT/NET and VMAT2 to dump dopamine and norepinephrine into the synapse, producing prolonged CNS stimulation, euphoria, and wakefulness. More lipophilic and longer-acting than amphetamine; dopaminergic neurotoxicity and cardiovascular strain at high/chronic doses. Prescribed (Desoxyn) rarely for ADHD/obesity.',
    routes: ['PO', 'IN', 'INH', 'IV'], doses: { PO: { min: 5, max: 60, typical: 30 } }, mw_g_mol: 149.23,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 10836. Releaser (substrate) — transporter occupancy + plasma t½ (~10–12 h) deferred to enrichment pass.', refs: [] },
  { slug: 'heroin', name: 'Heroin', aliases: ['diamorphine', 'diacetylmorphine', 'smack'], category: 'alkaloid',
    mechanism: 'Diacetylmorphine — a lipophilic morphine prodrug that crosses the blood-brain barrier rapidly, then is deacetylated to 6-monoacetylmorphine and morphine, the active µ-opioid agonists. The fast onset accounts for the intense "rush"; effects (analgesia, euphoria, respiratory depression) are morphine-mediated.',
    routes: ['IV', 'IN', 'INH', 'IM'], doses: { IV: { min: 5, max: 30, typical: 10 }, IN: { min: 10, max: 50, typical: 30 } }, mw_g_mol: 369.4,
    systems: ['nervous', 'respiratory'], notes: 'PubChem CID 5462328. Prodrug — µ-opioid occupancy belongs to morphine/6-MAM (see morphine). Plasma t½ deferred.', refs: [] },
  { slug: 'ghb', name: 'GHB', aliases: ['gamma-hydroxybutyrate', 'sodium oxybate', 'Xyrem', 'G'], category: 'pharmacological',
    mechanism: 'γ-hydroxybutyrate, an endogenous GABA metabolite; an agonist at GABA-B and at specific high-affinity GHB receptors, producing CNS depression, euphoria, and (marketed) anabolic/sleep effects. Very narrow margin between recreational sedation and coma/respiratory depression. Medical form is sodium oxybate (Xyrem) for narcolepsy/cataplexy.',
    routes: ['PO'], doses: { PO: { min: 1, max: 3.5, typical: 2.25, unit: 'g' } }, mw_g_mol: 104.10,
    systems: ['nervous'], notes: 'PubChem CID 10413. GABA-B occupancy + plasma t½ (~0.5–1 h) deferred to enrichment pass.', refs: [] },
  { slug: 'gbl', name: 'GBL', aliases: ['gamma-butyrolactone', 'GBL'], category: 'pharmacological',
    mechanism: 'γ-butyrolactone, an industrial solvent and a prodrug rapidly hydrolyzed by serum lactonase to GHB — giving faster onset and higher effective potency than equivalent GHB. Same GABA-B-mediated CNS depression and the same narrow, dangerous dose-response.',
    routes: ['PO'], doses: { PO: { min: 0.7, max: 2.5, typical: 1.5, unit: 'g' } }, mw_g_mol: 86.09,
    systems: ['nervous', 'digestive'], pk_unauthored: { reason: 'research-only', note: 'Prodrug — converted to GHB in vivo; PK belongs to GHB.' }, notes: 'PubChem CID 7302.', refs: [] },
  { slug: 'pcp', name: 'PCP', aliases: ['phencyclidine', 'angel dust'], category: 'pharmacological',
    mechanism: 'Arylcyclohexylamine dissociative; an NMDA-receptor open-channel blocker (also inhibits DAT and binds sigma) producing anesthesia, hallucination, analgesia, and characteristic agitation/dissociation. Long, unpredictable action with agitation and occasional violence at high doses.',
    routes: ['PO', 'INH', 'IV', 'IN'], doses: { PO: { min: 5, max: 10, typical: 7 } }, mw_g_mol: 243.4,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 6468. NMDA occupancy + t½ deferred to enrichment pass.', refs: [] },
  { slug: 'methoxetamine', name: 'Methoxetamine', aliases: ['MXE', '3-MeO-2-Oxo-PCE'], category: 'pharmacological',
    mechanism: 'Ketamine analog (arylcyclohexylamine) dissociative; an NMDA-receptor antagonist with additional serotonin-transporter activity, giving a longer and more potent dissociative experience than ketamine. Associated with ketamine-like bladder/renal toxicity and a higher overdose risk from its long duration.',
    routes: ['PO', 'IN', 'IM', 'SL'], doses: { PO: { min: 20, max: 90, typical: 50 }, IN: { min: 10, max: 50, typical: 30 } }, mw_g_mol: 247.33,
    systems: ['nervous', 'renal'], notes: 'PubChem CID 52911279. NMDA occupancy + t½ deferred to enrichment pass.', refs: [] },
  { slug: 'nitrous-oxide', name: 'Nitrous Oxide', aliases: ['N2O', 'laughing gas', 'whippets', 'nitrous'], category: 'pharmacological',
    mechanism: 'Inhaled anesthetic gas; an NMDA-receptor antagonist with additional opioid and GABA-A modulation, producing brief euphoria, analgesia, and dissociation ("whippets"). Chronic use inactivates vitamin B12 (oxidizes its cobalt core), causing functional B12 deficiency and subacute combined degeneration / neuropathy.',
    routes: ['INH'], doses: { INH: { min: 8, max: 32, typical: 8, unit: 'g' } }, mw_g_mol: 44.013,
    systems: ['nervous', 'immune-hematologic'], pk_unauthored: { reason: 'local-acting', note: 'Inhaled gas; rapid uptake/washout. No abstract-authored plasma PK.' }, notes: 'PubChem CID 948. Dose ≈ standard 8 g charger.', refs: [] },
  { slug: 'amyl-nitrite', name: 'Amyl Nitrite', aliases: ['poppers', 'isoamyl nitrite'], category: 'pharmacological',
    mechanism: 'Inhaled alkyl nitrite ("poppers"); a nitric-oxide donor that relaxes vascular and other smooth muscle, producing a brief head-rush, hypotension, and flushing. Historically used for angina; recreationally for the rush and as a muscle relaxant. Contraindicated with PDE5 inhibitors (severe hypotension) and a methemoglobinemia risk.',
    routes: ['INH'], doses: { INH: { min: 100, max: 300, typical: 200 } }, mw_g_mol: 117.15,
    systems: ['cardiovascular', 'nervous'], pk_unauthored: { reason: 'local-acting', note: 'Volatile NO-donor; acts within seconds, no receptor occupancy. No authored PK.' }, notes: 'PubChem CID 8053 (isoamyl nitrite).', refs: [] },
  { slug: 'salvinorin-a', name: 'Salvinorin A', aliases: ['salvinorin A', 'salvia', 'Salvia divinorum'], category: 'terpenoid',
    mechanism: 'Neoclerodane diterpene from Salvia divinorum and the most potent naturally-occurring hallucinogen. A highly selective, potent κ-opioid receptor agonist (non-nitrogenous, unlike classical opioids), producing a short, intense, often disorienting dissociative experience. Smoked effects last minutes.',
    routes: ['INH', 'SL'], doses: { INH: { min: 0.2, max: 1, typical: 0.5 }, SL: { min: 0.5, max: 3, typical: 1 } }, mw_g_mol: 432.5,
    systems: ['nervous'], notes: 'PubChem CID 128563. κ-opioid Ki (Roth 2002 reports ~1–4 nM) deferred to enrichment pass.', refs: [] },

  // ── Research chemicals — cathinones (stimulant) ─────────────────────────
  { slug: 'mephedrone', name: 'Mephedrone', aliases: ['4-MMC', 'meow meow', '4-methylmethcathinone'], category: 'stimulant',
    mechanism: 'Synthetic cathinone; a monoamine substrate-releaser at DAT/NET/SERT (a blend of amphetamine-like and MDMA-like action), giving empathogenic stimulation. Short-lived effects drive compulsive redosing; cardiovascular and hyperthermia risks.',
    routes: ['PO', 'IN'], doses: { PO: { min: 100, max: 250, typical: 150 }, IN: { min: 50, max: 150, typical: 100 } }, mw_g_mol: 177.24,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 45266826 (free base). Releaser — transporter occupancy + t½ deferred.', refs: [] },
  { slug: 'methylone', name: 'Methylone', aliases: ['bk-MDMA', 'M1', 'beta-keto-MDMA'], category: 'stimulant',
    mechanism: 'β-keto analog of MDMA; a monoamine substrate-releaser with a relatively balanced/serotonergic profile, producing a shorter, milder empathogen-stimulant effect than MDMA. Cardiovascular and hyperthermia risks as with other cathinones.',
    routes: ['PO', 'IN'], doses: { PO: { min: 100, max: 250, typical: 150 } }, mw_g_mol: 207.23,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 45789647 (free base). Releaser — occupancy + t½ deferred.', refs: [] },
  { slug: 'mdpv', name: 'MDPV', aliases: ['3,4-methylenedioxypyrovalerone', 'bath salts'], category: 'stimulant',
    mechanism: 'Pyrovalerone cathinone; a potent and selective DAT/NET reuptake blocker (no monoamine release, no serotonin component) — roughly an order of magnitude more potent at DAT than cocaine. Produces intense, long stimulation with strong compulsion, agitation, and "excited delirium" ("bath salts").',
    routes: ['PO', 'IN'], doses: { PO: { min: 5, max: 20, typical: 10 }, IN: { min: 3, max: 15, typical: 8 } }, mw_g_mol: 275.34,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 20111961 (free base). DAT/NET Ki deferred to enrichment pass.', refs: [] },
  { slug: 'alpha-pvp', name: 'Alpha-PVP', aliases: ['alpha-PVP', 'flakka', 'A-PVP', 'alpha-pyrrolidinopentiophenone'], category: 'stimulant',
    mechanism: 'Pyrrolidine cathinone and MDPV analog; a potent DAT/NET reuptake blocker ("flakka"). Produces intense stimulation, insomnia, and severe agitation / excited-delirium presentations with hyperthermia and cardiovascular collapse at high doses.',
    routes: ['PO', 'IN', 'INH'], doses: { PO: { min: 5, max: 20, typical: 10 } }, mw_g_mol: 231.33,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 11148955 (free base). DAT/NET Ki deferred to enrichment pass.', refs: [] },

  // ── Research chemicals — psychedelic tail (alkaloid) ────────────────────
  { slug: '2c-e', name: '2C-E', aliases: ['2C-E', '4-ethyl-2,5-dimethoxyphenethylamine'], category: 'alkaloid',
    mechanism: '2C-x family psychedelic phenethylamine; a 5-HT2A receptor agonist producing intense visual and cognitive effects, longer and more potent than 2C-B. Schedule I; nausea and anxiety are common at threshold-to-strong doses.',
    routes: ['PO'], doses: { PO: { min: 10, max: 25, typical: 16 } }, mw_g_mol: 209.28,
    systems: ['nervous'], notes: 'PubChem CID 24729233. 5-HT2A Ki deferred to enrichment pass.', refs: [] },
  { slug: '2c-i', name: '2C-I', aliases: ['2C-I', '4-iodo-2,5-dimethoxyphenethylamine'], category: 'alkaloid',
    mechanism: '2C-x family psychedelic phenethylamine (iodine at the 4-position); a 5-HT2A agonist with marked visual/sensory effects. Schedule I; sometimes confused with the far more dangerous NBOMe (25I-NBOMe) derivative.',
    routes: ['PO'], doses: { PO: { min: 10, max: 25, typical: 18 } }, mw_g_mol: 307.13,
    systems: ['nervous'], notes: 'PubChem CID 10267191 (free base, C10H14INO2). 5-HT2A Ki deferred.', refs: [] },
  { slug: 'dom', name: 'DOM', aliases: ['DOM', 'STP', '2,5-dimethoxy-4-methylamphetamine'], category: 'alkaloid',
    mechanism: 'Amphetamine-class psychedelic ("STP"); a potent, very long-acting 5-HT2A receptor agonist (effects can last 12+ hours). The narrow margin between active and overwhelming doses caused notable mass-overdose incidents in the 1960s.',
    routes: ['PO'], doses: { PO: { min: 3, max: 10, typical: 5 } }, mw_g_mol: 209.28,
    systems: ['nervous'], notes: 'PubChem CID 85875. 5-HT2A Ki deferred to enrichment pass.', refs: [] },
  { slug: '4-aco-dmt', name: '4-AcO-DMT', aliases: ['psilacetin', '4-acetoxy-DMT', 'O-acetylpsilocin'], category: 'alkaloid',
    mechanism: 'O-acetylpsilocin, a synthetic tryptamine prodrug deacetylated in vivo to psilocin — so its effects are essentially psilocybin-like (5-HT2A agonism via psilocin). Popular as a research-chemical psilocybin substitute.',
    routes: ['PO'], doses: { PO: { min: 10, max: 30, typical: 20 } }, mw_g_mol: 246.30,
    systems: ['nervous'], pk_unauthored: { reason: 'research-only', note: 'Prodrug — active species is psilocin (see psilocin). PK/occupancy belong to psilocin.' }, notes: 'PubChem CID 15429212.', refs: [] },
  { slug: 'harmine', name: 'Harmine', aliases: ['telepathine', 'banisterine'], category: 'alkaloid',
    mechanism: 'β-carboline alkaloid from Banisteriopsis caapi and Peganum harmala; a reversible inhibitor of monoamine oxidase A (RIMA). In ayahuasca it inhibits gut/hepatic MAO-A so that orally-ingested DMT survives to reach the brain. Mildly psychoactive itself; also a DYRK1A kinase inhibitor under research interest.',
    routes: ['PO'], doses: { PO: { min: 30, max: 300, typical: 150 } }, mw_g_mol: 212.25,
    systems: ['nervous', 'digestive'], notes: 'PubChem CID 5280953. MAO-A inhibition is enzyme kinetics (not a receptor-occupancy key); verbatim MAO-A Ki deferred to notes in enrichment pass.', refs: [] },
  { slug: 'harmaline', name: 'Harmaline', aliases: ['harmidine'], category: 'alkaloid',
    mechanism: 'Dihydro derivative of harmine; a β-carboline and reversible MAO-A inhibitor, more sedating and "visionary" than harmine. The other principal harmala alkaloid enabling oral DMT activity in ayahuasca; also a tremorigenic agent in pharmacology research.',
    routes: ['PO'], doses: { PO: { min: 30, max: 300, typical: 150 } }, mw_g_mol: 214.26,
    systems: ['nervous', 'digestive'], notes: 'PubChem CID 3564. MAO-A inhibition is enzyme kinetics (not a receptor-occupancy key).', refs: [] },
  { slug: 'bufotenin', name: 'Bufotenin', aliases: ['bufotenine', '5-HO-DMT', '5-hydroxy-DMT', 'mappine'], category: 'alkaloid',
    mechanism: '5-hydroxy-DMT, a tryptamine found in Bufo toad venom and Anadenanthera seeds; a 5-HT2A / 5-HT1A agonist. Central psychoactivity is debated (poor blood-brain-barrier penetration as the free base), while peripheral cardiovascular and autonomic effects are prominent.',
    routes: ['INH', 'IV', 'IN'], doses: { INH: { min: 2, max: 20, typical: 10 } }, mw_g_mol: 204.27,
    systems: ['nervous', 'cardiovascular'], notes: 'PubChem CID 10257. 5-HT2A Ki deferred to enrichment pass.', refs: [] },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, skipped = 0;
  const byCat: Record<string, number> = {};
  for (const c of NEW_COMPOUNDS) {
    if (bySlug.has(c.slug)) { console.log(`  [skip] ${c.slug} already in registry`); skipped++; continue; }
    data.push(c); bySlug.set(c.slug, c); added++;
    byCat[c.category!] = (byCat[c.category!] ?? 0) + 1;
    console.log(`  [add ] ${c.slug.padEnd(20)} ${String(c.category).padEnd(12)} mw=${c.mw_g_mol}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2 breadth: +${added} compounds (${skipped} already present). By category: ${JSON.stringify(byCat)}. Now ${data.length} compounds.`);
}

main();
