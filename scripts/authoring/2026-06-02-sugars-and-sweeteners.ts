/**
 * 2026-06-02-sugars-and-sweeteners.ts
 *
 * Adds 28 dietary sugars + sugar substitutes under two NEW compound
 * categories: 'sugar' (9 entries) and 'sweetener' (19). Requires the
 * matching enum additions already made to packages/core/src/types.ts and
 * packages/registry/src/loader.ts (plus the library filter dropdown and the
 * registry-graph CATEGORY_COLOR map).
 *
 * Authoring level: prose-stub (mechanism + MW + doses + systems + aliases).
 * No source_pmid / PK numbers are authored — per the no-fabricated-citations
 * rule these ship with refs:[] (the 7-hydroxymitragynine precedent). MW is a
 * chemistry fact (no PMID needed).
 *
 * Disaccharides (sucrose, lactose, maltose, trehalose) and the carb mixtures
 * (HFCS, maltodextrin) carry composition[] so a parent dose expands into its
 * constituent monosaccharides at solve time (the parent itself isn't absorbed
 * intact, so it carries pk_unauthored:{reason:'mixture'} and no curve).
 * Non-absorbed / non-metabolised sweeteners carry pk_unauthored:'local-acting'.
 *
 * Provenance: drafted in the registry house style and adversarially
 * fact-checked (MW recomputed from formula, E-number, metabolism, and safety
 * claims — PKU/aspartame, dog-toxicity/xylitol, US-1969 cyclamate ban,
 * galactosemia/lactitol, IARC-2B/aspartame) via a parallel-agent workflow.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Entry = { slug: string } & Record<string, unknown>;

const ENTRIES: Entry[] = [
  {
    "slug": "glucose",
    "name": "Glucose",
    "aliases": [
      "Dextrose",
      "D-Glucose",
      "Blood sugar",
      "Grape sugar",
      "Glucose monohydrate",
      "Corn sugar"
    ],
    "category": "sugar",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "Aldohexose monosaccharide and the body's primary circulating energy substrate. Absorbed across the intestinal brush border chiefly by sodium-coupled SGLT1 and facilitatively by GLUT2; cellular uptake elsewhere uses GLUT1–4, with GLUT4 trafficking driven by [[insulin]] signaling. Phosphorylated by hexokinase/glucokinase to glucose-6-phosphate, then committed to glycolysis (pyruvate → acetyl-CoA), the pentose-phosphate pathway, or glycogen synthesis; gluconeogenesis and glycogenolysis restore it during fasting. Rising plasma glucose is the principal stimulus for pancreatic β-cell insulin release. The D-enantiomer (dextrose) is the metabolically active form. As a sweetener it is roughly 0.7–0.75× as sweet as sucrose. Clinically used as oral or IV dextrose for hypoglycemia and caloric support.",
    "routes": [
      "PO",
      "IV"
    ],
    "doses": {
      "PO": {
        "min": 4,
        "max": 50,
        "typical": 15,
        "unit": "g"
      },
      "IV": {
        "min": 5,
        "max": 50,
        "typical": 25,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 180.16,
    "recon3d_metabolite_id": "glc__D",
    "notes": "No E-number (glucose/dextrose is a nutritive food sugar, not an additive); about 0.7–0.75x as sweet as sucrose. Generally recognized as safe with no numerical ADI as a food. Note \"Glucose monohydrate\" is the hydrated crystalline form (MW ~198.17) — the listed MW is for the anhydrous molecule."
  },
  {
    "slug": "fructose",
    "name": "Fructose",
    "aliases": [
      "Fruit sugar",
      "Levulose",
      "D-Fructose",
      "D-Fructofuranose",
      "β-D-Fructose"
    ],
    "category": "sugar",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "Ketohexose monosaccharide (C6H12O6, isomeric with [[glucose]]); the sweetest common dietary sugar. Absorbed across the apical enterocyte by the facilitative transporter GLUT5 (SLC2A5) and exported basolaterally via GLUT2 — both insulin-independent. Apical GLUT5 capacity is the rate-limiting step, so excess fructose load (especially without co-ingested glucose) overwhelms it and drives fructose malabsorption with osmotic diarrhea and colonic fermentation. Cleared predominantly by first-pass hepatic metabolism: ketohexokinase (KHK/fructokinase) phosphorylates it to fructose-1-phosphate, which aldolase B splits to triose phosphates, bypassing the PFK-1 rate-limiting step of glycolysis. This unregulated entry favors de novo lipogenesis, uric-acid generation (ATP/phosphate depletion → AMP catabolism), and minimal direct insulin secretion. As the [[sucrose]] hydrolysis product (with glucose) and a polyol-pathway/[[sorbitol]] endpoint.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 2,
        "max": 50,
        "typical": 15,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 180.16,
    "recon3d_metabolite_id": "fru",
    "notes": "No E-number (a food/sweetener, not an additive); GRAS in the US, JECFA ADI \"not specified.\" About 1.2-1.8x as sweet as sucrose (sweetness falls with warming as the furanose form predominates). Key flags: hereditary fructose intolerance (aldolase B deficiency) is dangerous; high intakes promote fructose malabsorption, hepatic de novo lipogenesis, and hyperuricemia."
  },
  {
    "slug": "galactose",
    "name": "Galactose",
    "aliases": [
      "D-Galactose",
      "Brain sugar",
      "Cerebrose"
    ],
    "category": "sugar",
    "systems": [
      "digestive",
      "endocrine",
      "nervous"
    ],
    "mechanism": "Aldohexose monosaccharide (C₆H₁₂O₆), a C-4 epimer of glucose and the constituent of lactose, raffinose and myelin galactolipids. Absorbed across the enterocyte apical membrane by Na⁺-coupled SGLT1 (shared with glucose) and exported basolaterally via GLUT2. Hepatic clearance proceeds through the Leloir pathway: galactokinase (GALK1) phosphorylates it to galactose-1-phosphate, which galactose-1-phosphate uridylyltransferase (GALT) converts with UDP-glucose to UDP-galactose (interconverted by UDP-galactose-4-epimerase, GALE) and glucose-1-phosphate, feeding glycogenesis and glycolysis. It is essentially non-insulinotropic acutely versus [[insulin]]-driving glucose. Loss-of-function GALT defines classic galactosemia; accumulated galactitol via aldose reductase drives cataract.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 2,
        "max": 40,
        "typical": 10,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 180.16,
    "recon3d_metabolite_id": "gal",
    "notes": "No dedicated additive E-number (an endogenous nutritive sugar, not an authorized tabletop sweetener); roughly 0.3–0.65× as sweet as sucrose. No numeric ADI — treated as a normal dietary carbohydrate; key flag is classic galactosemia (GALT deficiency), where dietary galactose/lactose is toxic and must be avoided."
  },
  {
    "slug": "sucrose",
    "name": "Sucrose",
    "aliases": [
      "Table sugar",
      "Saccharose",
      "Cane sugar",
      "Beet sugar",
      "Sugar",
      "Sucrose",
      "beta-D-fructofuranosyl alpha-D-glucopyranoside"
    ],
    "category": "sugar",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "Sucrose is a non-reducing disaccharide of α-D-glucose and β-D-fructose joined by a 1,2-glycosidic bond. It is not absorbed intact: brush-border sucrase-isomaltase hydrolyses it in the proximal small intestine to free [[glucose]] and [[fructose]]. Glucose (and galactose) is taken up apically by the Na+-coupled cotransporter SGLT1; fructose enters via the facilitative transporter GLUT5; both exit the enterocyte basolaterally through GLUT2. Absorbed glucose raises blood sugar and stimulates pancreatic [[insulin]] secretion, whereas fructose is cleared largely first-pass by hepatic fructokinase (ketohexokinase) and is poorly insulinotropic. Systemic disposition is therefore that of the two monosaccharides, not the parent. Sucrose is the reference standard of relative sweetness (defined as 1.0) and is fully fermentable by oral bacteria, making it cariogenic.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 4,
        "max": 50,
        "typical": 10,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 342.3,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Disaccharide hydrolysed to glucose + fructose by brush-border sucrase-isomaltase before absorption; systemic PK is that of the monosaccharides."
    },
    "composition": {
      "constituents": [
        {
          "slug": "glucose",
          "mg_per_g_extract": 526,
          "note": "Released with fructose by intestinal sucrase before absorption."
        },
        {
          "slug": "fructose",
          "mg_per_g_extract": 526,
          "note": "Released with glucose by intestinal sucrase before absorption."
        }
      ]
    },
    "recon3d_metabolite_id": "sucr",
    "notes": "Common table sugar; the benchmark for relative sweetness (= 1.0). Generally Recognized As Safe (GRAS) in the US and permitted in the EU as a food with no numerical ADI (\"not specified\"); not assigned an E-number. Caloric (~4 kcal/g); chief safety concerns are dental caries and the metabolic load of added sugars rather than acute toxicity."
  },
  {
    "slug": "lactose",
    "name": "Lactose",
    "aliases": [
      "Milk sugar",
      "Lactose monohydrate",
      "Lactobiose",
      "β-D-galactopyranosyl-(1→4)-D-glucose",
      "4-O-β-D-galactopyranosyl-D-glucose"
    ],
    "category": "sugar",
    "systems": [
      "digestive"
    ],
    "mechanism": "Reducing disaccharide of galactose β-(1→4)-linked to glucose; the principal carbohydrate of mammalian milk. Not absorbed intact — brush-border lactase-phlorizin hydrolase (LCT) on small-intestinal enterocytes cleaves it to free [[glucose]] and [[galactose]], which are taken up by SGLT1 (Na⁺-coupled) and GLUT2. Glucose feeds glycolysis and elicits a glucose-driven [[insulin]] response; galactose is routed through the Leloir pathway (galactokinase → GALT → epimerase) to UDP-glucose/glycogen in the liver. Constitutional or acquired lactase deficiency leaves unhydrolyzed lactose in the colon, where bacterial fermentation to short-chain fatty acids, H₂, CH₄ and CO₂ plus its osmotic load produces the bloating and osmotic diarrhea of lactose intolerance. About one-fifth as sweet as sucrose; widely used as a pharmaceutical tablet/capsule diluent and dry-powder-inhaler carrier.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 40,
        "typical": 12,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 342.3,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Disaccharide cleaved by brush-border lactase to glucose + galactose; deficiency of lactase is the basis of lactose intolerance."
    },
    "composition": {
      "constituents": [
        {
          "slug": "glucose",
          "mg_per_g_extract": 526,
          "note": "Released with galactose by lactase."
        },
        {
          "slug": "galactose",
          "mg_per_g_extract": 526,
          "note": "Released with glucose by lactase."
        }
      ]
    },
    "recon3d_metabolite_id": "lcts",
    "notes": "No E-number (a food ingredient, not an additive); roughly 0.2× as sweet as sucrose. GRAS with no numerical ADI. Key flag: poorly tolerated in lactase-deficient (lactose-intolerant) individuals and contraindicated in classic galactosemia; a near-ubiquitous tablet/capsule excipient, so trace exposure is common even off-diet."
  },
  {
    "slug": "maltose",
    "name": "Maltose",
    "aliases": [
      "Malt sugar",
      "Maltobiose",
      "D-Maltose",
      "α-Maltose",
      "4-O-α-D-glucopyranosyl-D-glucose"
    ],
    "category": "sugar",
    "systems": [
      "digestive"
    ],
    "mechanism": "A reducing disaccharide of two α-D-glucose units joined by an α-1,4-glycosidic bond, released from starch and glycogen by salivary and pancreatic α-amylase. Maltose is not absorbed intact: brush-border maltase-glucoamylase and sucrase-isomaltase hydrolyse it to two molecules of [[glucose]], which enter enterocytes via SGLT1 and exit basolaterally through GLUT2, raising portal glucose and provoking an [[insulin]] response comparable to free glucose (high glycemic index). It thus behaves metabolically as a glucose pro-source rather than a distinct sugar, feeding glycolysis, glycogenesis and the pentose-phosphate pathway. Roughly a third as sweet as sucrose, it is a nutritive caloric carbohydrate (~4 kcal/g) common in malt, beer wort and starch syrups; with no specialized intestinal transporter, malabsorption is rare relative to lactose or fructose.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 40,
        "typical": 10,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 342.3,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Disaccharide cleaved by maltase to two glucose units before absorption."
    },
    "composition": {
      "constituents": [
        {
          "slug": "glucose",
          "mg_per_g_extract": 1052,
          "note": "Two glucose units released per maltose by maltase."
        }
      ]
    },
    "recon3d_metabolite_id": "malt",
    "notes": "No sweetener E-number (a nutritive sugar, not an additive); roughly 30-50% as sweet as sucrose. GRAS with no numerical ADI, treated as an ordinary caloric carbohydrate. High glycemic index, so it raises blood glucose much like glucose itself — relevant for diabetic glycemic control."
  },
  {
    "slug": "trehalose",
    "name": "Trehalose",
    "aliases": [
      "Mycose",
      "alpha,alpha-Trehalose",
      "alpha,alpha-D-Trehalose",
      "alpha-D-Glucopyranosyl alpha-D-glucopyranoside",
      "D-(+)-Trehalose"
    ],
    "category": "sugar",
    "systems": [
      "digestive"
    ],
    "mechanism": "A non-reducing disaccharide of two glucose units joined by an α,α-1,1-glycosidic bond, where both anomeric carbons are mutually engaged so the ring stays closed and resists Maillard browning. In the gut it is hydrolysed by brush-border trehalase to two molecules of [[glucose]], which are then absorbed by SGLT1 and GLUT2 and enter normal glycaemic and insulin handling identically to other dietary glucose; the parent sugar itself is not absorbed intact in meaningful amounts. Trehalase is the rate-limiting and frequently low-abundance step, so unhydrolysed trehalose reaching the colon is fermented by microbiota, producing gas, short-chain fatty acids and an osmotic load. Its high glass-transition temperature and water-replacement hydrogen bonding underlie its industrial role as a cryo- and desiccation-protectant for proteins and foods.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 50,
        "typical": 10,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 342.3,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Disaccharide cleaved by intestinal trehalase to two glucose units."
    },
    "composition": {
      "constituents": [
        {
          "slug": "glucose",
          "mg_per_g_extract": 1052,
          "note": "Two glucose units released per trehalose by trehalase."
        }
      ]
    },
    "recon3d_metabolite_id": "tre",
    "notes": "Non-reducing glucose-glucose disaccharide; ~45% as sweet as sucrose. JECFA ADI \"not specified\"; US GRAS and an authorised EU novel food (no assigned E-number). Generally well tolerated, but low intestinal trehalase activity causes osmotic/fermentative GI symptoms; the trehalase deficiency that is otherwise rare in humans is comparatively common in Greenlandic Inuit, where the enzyme is expressed in only ~10-15% of the population (i.e. the great majority are trehalase-deficient). Glycaemic load after hydrolysis is glucose-equivalent."
  },
  {
    "slug": "high-fructose-corn-syrup",
    "name": "High-Fructose Corn Syrup",
    "aliases": [
      "HFCS",
      "HFCS-55",
      "HFCS-42",
      "Glucose-fructose syrup",
      "Isoglucose",
      "Fructose-glucose syrup",
      "Maize syrup"
    ],
    "category": "sugar",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "Enzymatically isomerized cornstarch hydrolysate: a free-monosaccharide syrup, not a glycoside, so it requires no luminal hydrolysis. HFCS-55 (beverage grade) is ~55% [[fructose]] / 42% [[glucose]] of dry solids, near-identical to sucrose's 50/50 split but with the monosaccharides unbound. Glucose is taken up via SGLT1/GLUT2 and raises blood glucose + [[insulin]]; fructose enters enterocytes/hepatocytes via GLUT5 and is trapped by ketohexokinase (fructokinase) as fructose-1-phosphate, bypassing PFK-1's rate-limiting step -> unregulated trioses feeding de novo lipogenesis, plus ATP depletion driving urate generation (hyperuricemia). Net sweetness ~ sucrose (~1.0x). GRAS in the US; no separate EU E-number (regulated as a sugar/food ingredient; HFCS-55, being fructose-predominant, is labeled 'fructose-glucose syrup' in the EU, whereas glucose-predominant grades like HFCS-42 are labeled 'glucose-fructose syrup').",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 4,
        "max": 50,
        "typical": 15,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Industrial syrup of free glucose + fructose (HFCS-55 ~ beverage grade); absorbed as the monosaccharides."
    },
    "composition": {
      "constituents": [
        {
          "slug": "fructose",
          "mg_per_g_extract": 550,
          "note": "HFCS-55 (beverage grade): ~55% fructose of dry solids."
        },
        {
          "slug": "glucose",
          "mg_per_g_extract": 420,
          "note": "~42% glucose; remainder higher saccharides."
        }
      ]
    },
    "notes": "No assigned EU E-number (regulated as a sugar/food ingredient, not a food additive; \"isoglucose\" in EU quota law). EU naming under Directive 2001/111/EC reflects the predominant monosaccharide: fructose >50% dry matter -> \"fructose-glucose syrup\" (so HFCS-55 is \"fructose-glucose syrup\"), while glucose-predominant grades (e.g. HFCS-42) are \"glucose-fructose syrup\". Sweetness roughly equal to sucrose (~1.0x, HFCS-55). No numeric ADI - added sugars carry an \"acceptable daily intake not specified\" status and are GRAS in the US; WHO advises limiting free sugars to <10% of energy. High fructose load is the key concern (hepatic de novo lipogenesis, hypertriglyceridemia, uric-acid elevation with chronic excess)."
  },
  {
    "slug": "maltodextrin",
    "name": "Maltodextrin",
    "aliases": [
      "Glucose polymer",
      "Dried glucose syrup",
      "Maltodextrin",
      "Glucose syrup solids",
      "Hydrolyzed starch",
      "Corn syrup solids"
    ],
    "category": "sugar",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "A polydisperse alpha-1,4-linked D-glucose polymer (with occasional alpha-1,6 branches) of low dextrose equivalent (DE 3-20), produced by partial acid or enzymatic hydrolysis of starch (commonly corn, wheat, tapioca, or potato). It is not intact starch and not a free sugar, but luminal alpha-amylase and brush-border maltase-glucoamylase cleave it rapidly and near-completely to free glucose, which is absorbed via SGLT1 and GLUT2. Consequently it behaves metabolically like glucose: a brisk glycemic and [[insulin]] response and a glycemic index often equal to or exceeding sucrose despite its polysaccharide structure. Functionally it serves as a bland, readily digestible carbohydrate bulking agent, carrier, and rapid energy source rather than a sweetener; longer-chain, lower-DE grades contribute body and viscosity with minimal sweetness.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 5,
        "max": 60,
        "typical": 25,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "pk_unauthored": {
      "reason": "mixture",
      "note": "alpha-1,4 glucose polymer (DE 3-20); rapidly digested by amylase/maltase to glucose — high glycemic index despite being technically a polysaccharide."
    },
    "composition": {
      "constituents": [
        {
          "slug": "glucose",
          "mg_per_g_extract": 950,
          "note": "Glucose polymer digested near-completely to glucose."
        }
      ]
    },
    "notes": "No EU E-number (regulated as a food ingredient, not an additive; quantum satis, no numeric ADI). Essentially non-sweet to faintly sweet (roughly 0-0.2x sucrose, rising with higher DE). Key flag: high glycemic index (frequently >=sucrose, ~85-130) despite being a polysaccharide; rapidly raises blood glucose. Usually gluten-safe even from wheat (hydrolysis removes protein) but not for those avoiding all glucose/high-GI loads."
  },
  {
    "slug": "aspartame",
    "name": "Aspartame",
    "aliases": [
      "E951",
      "NutraSweet",
      "Equal",
      "Canderel",
      "APM",
      "Aspartyl-phenylalanine methyl ester",
      "L-aspartyl-L-phenylalanine methyl ester",
      "N-L-alpha-aspartyl-L-phenylalanine 1-methyl ester"
    ],
    "category": "sweetener",
    "systems": [
      "digestive",
      "nervous"
    ],
    "mechanism": "A dipeptide methyl ester (L-aspartyl-L-phenylalanine methyl ester) ~180-200x sweeter than sucrose, binding the sweet-taste T1R2/T1R3 GPCR heterodimer without activating sour/bitter receptors. It is not absorbed intact: gut-lumen and enterocyte esterases/peptidases (chymotrypsin, carboxylesterases, aminopeptidases) hydrolyse it presystemically to [[aspartate]], [[phenylalanine]], and methanol in roughly 40:50:10 mass ratio. These enter normal metabolism — aspartate transaminated to oxaloacetate (TCA cycle), phenylalanine into the body amino-acid pool, methanol oxidised via alcohol/aldehyde dehydrogenase to formaldehyde then formate. Being non-glycaemic it does not raise [[glucose]] or [[insulin]]. Heat-labile, so it is unsuitable for prolonged baking. Approved as a table-top and food-additive sweetener.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 10,
        "max": 200,
        "typical": 40,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 294.3,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Hydrolysed in the gut lumen/enterocytes to aspartate, phenylalanine and methanol; no intact aspartame reaches the circulation."
    },
    "notes": "E951; ~180-200x sweeter than sucrose. JECFA/EFSA ADI 40 mg/kg/day (FDA 50 mg/kg/day). Contains phenylalanine, so contraindicated in phenylketonuria (PKU) — mandatory label warning. IARC classified it as possibly carcinogenic (Group 2B) in 2023 while EFSA/JECFA reaffirmed it safe within the ADI."
  },
  {
    "slug": "sucralose",
    "name": "Sucralose",
    "aliases": [
      "E955",
      "Splenda",
      "Trichlorogalactosucrose",
      "TGS",
      "1',4,6'-Trichloro-1',4,6'-trideoxygalactosucrose",
      "4,1',6'-Trichlorogalactosucrose"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "A chlorinated disaccharide (4,1',6'-trichloro-4,1',6'-trideoxygalactosucrose) in which three hydroxyls of sucrose are replaced by chlorine, blocking enzymatic hydrolysis by intestinal sucrase-isomaltase and salivary/pancreatic amylase. It binds the sweet-taste receptor (TAS1R2/TAS1R3 heterodimer) on lingual and enteroendocrine cells with ~600x the potency of sucrose, evoking sweetness without providing metabolizable carbohydrate or a meaningful glycemic/insulinemic response. The chlorination renders it metabolically inert: roughly 85% passes unabsorbed and is excreted in faeces, while the ~15% absorbed (partly via passive diffusion) is not catabolized and is cleared unchanged in urine, with a minor fraction (~2% of dose) as glucuronide conjugates. It is heat-stable, non-cariogenic, and contributes negligible calories.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 60,
        "typical": 12,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 397.63,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "~85% unabsorbed and excreted in faeces; the ~15% absorbed is not metabolised and is cleared unchanged in urine."
    },
    "notes": "E955; intensely sweet (~600x sucrose), non-nutritive and non-glycemic. FDA-approved general-purpose sweetener with ADI 5 mg/kg/day (EFSA 15 mg/kg/day, JECFA 15 mg/kg/day); generally well tolerated, though high intakes can cause GI/laxative effects and its safety/microbiome and thermal-degradation profiles remain debated."
  },
  {
    "slug": "saccharin",
    "name": "Saccharin",
    "aliases": [
      "E954",
      "Sweet'N Low",
      "Benzosulfimide",
      "o-Sulfobenzoic acid imide",
      "Sodium saccharin",
      "1,2-Benzisothiazol-3(2H)-one 1,1-dioxide",
      "Saccharine",
      "Benzoic sulfimide"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "Saccharin (C7H5NO3S, free acid) is a high-intensity non-nutritive sweetener roughly 300-400x sweeter than sucrose, with a characteristic bitter-metallic aftertaste at higher concentrations. It activates the sweet taste receptor, the T1R2/T1R3 heterodimer expressed on lingual taste cells, with the anionic sulfonyl-imide head group driving receptor binding; at high concentrations it also weakly antagonises the receptor, contributing to off-taste. It is essentially non-caloric and does not raise blood [[glucose]] or stimulate appreciable [[insulin]] release. In the body it is biologically inert: absorbed from the gut, not metabolised, not glucuronidated, and excreted unchanged via renal tubular secretion. Marketed as sodium or calcium salts for solubility. Approved as food additive E954; the rodent bladder-tumour signal was shown to be a male-rat-specific mechanism not relevant to humans, and it was delisted as a carcinogen.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 100,
        "typical": 30,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 183.18,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Absorbed but not metabolised; excreted unchanged by the kidney."
    },
    "notes": "E954; non-nutritive sweetener ~300-400x sweeter than sucrose; JECFA ADI 0-5 mg/kg bw/day (as saccharin). Once flagged for rat bladder tumours but removed from US carcinogen lists in 2000 (mechanism not human-relevant); GRAS/approved in US, EU, and globally."
  },
  {
    "slug": "acesulfame-potassium",
    "name": "Acesulfame Potassium",
    "aliases": [
      "Ace-K",
      "Acesulfame K",
      "E950",
      "Sunett",
      "Sweet One",
      "Potassium acesulfame",
      "ACK",
      "Acesulphame potassium"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "Acesulfame potassium is the potassium salt of 6-methyl-1,2,3-oxathiazin-4(3H)-one 2,2-dioxide, an oxathiazinone-dioxide non-nutritive sweetener roughly 200x as sweet as sucrose. The acesulfame anion activates the heterodimeric sweet-taste receptor (TAS1R2/TAS1R3) on lingual type II taste cells, triggering gustducin-coupled PLCβ2 signalling and gut enteroendocrine sweet-sensing; it carries a slightly bitter off-taste at high concentration, often masked by blending with [[sucralose]] or [[aspartame]]. Unlike caloric sugars such as [[glucose]] and [[fructose]], it provides no metabolizable energy and does not raise blood glucose or stimulate insulin meaningfully. It is rapidly and essentially completely absorbed in the gut but is not metabolized — no CYP, conjugation, or hydrolytic transformation occurs — and is excreted unchanged in urine. Heat- and pH-stable, it is widely used in baked and beverage applications.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 100,
        "typical": 25,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 201.24,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Rapidly and completely absorbed but not metabolised; excreted unchanged in urine."
    },
    "notes": "E950; about 200x sweeter than sucrose; JECFA/EFSA ADI 15 mg/kg bw/day (FDA ADI 15 mg/kg/day, GRAS/approved as general-purpose sweetener). Non-caloric and not metabolized — excreted unchanged. Contributes a small amount of dietary potassium; bitter aftertaste at high levels is typically masked by blending with other sweeteners."
  },
  {
    "slug": "neotame",
    "name": "Neotame",
    "aliases": [
      "E961",
      "Newtame",
      "N-(3,3-dimethylbutyl)-aspartame",
      "N-[N-(3,3-dimethylbutyl)-L-alpha-aspartyl]-L-phenylalanine 1-methyl ester",
      "NTM"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "High-intensity dipeptide-derivative sweetener: N-(3,3-dimethylbutyl)-L-α-aspartyl-L-[[phenylalanine]] 1-methyl ester — structurally aspartame bearing a neohexyl (3,3-dimethylbutyl) group on the aspartyl α-amine. It activates the sweet T1R2/T1R3 GPCR heterodimer with far higher potency than sucrose. Acting locally in the gut lumen, intestinal and hepatic esterases rapidly de-esterify it to de-esterified neotame (the major metabolite) plus trace methanol; it is otherwise minimally absorbed and largely cleared via bile/feces. The bulky N-alkyl group sterically blocks peptidase cleavage of the aspartyl–phenylalanyl bond, so essentially no free phenylalanine is liberated — distinguishing it from aspartame and making it safe in phenylketonuria. It is non-nutritive and not glycemic.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 0.1,
        "max": 20,
        "typical": 4,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 378.46,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Rapidly de-esterified by esterases to de-esterified neotame and methanol; minimally absorbed. The N-alkyl group blocks peptidase cleavage so, unlike aspartame, it does not release free phenylalanine."
    },
    "notes": "E961; roughly 7,000–13,000× sweeter than sucrose (about 30–60× aspartame). FDA-approved (2002) general-purpose sweetener; JECFA ADI 0–2 mg/kg/day. Unlike aspartame it carries no PKU phenylalanine warning, as it does not release free phenylalanine."
  },
  {
    "slug": "advantame",
    "name": "Advantame",
    "aliases": [
      "E969",
      "ANS9801",
      "advantame acid precursor",
      "N-[N-[3-(3-hydroxy-4-methoxyphenyl)propyl]-L-alpha-aspartyl]-L-phenylalanine 1-methyl ester"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "Advantame is a high-intensity, non-nutritive sweetener formed by reductive alkylation of [[aspartame]] with an isovanillin-derived (3-hydroxy-4-methoxyphenyl)propyl group, yielding a methyl-ester dipeptide derivative roughly 20,000 times sweeter than sucrose and ~110 times sweeter than aspartame. Sweetness arises from agonism at the heterodimeric T1R2/T1R3 sweet-taste GPCR on lingual taste cells, transduced via gustducin/PLCβ2 and TRPM5. Because it is effective at microgram-to-milligram levels, it is functionally non-caloric and does not raise [[glucose]] or [[insulin]]. It is poorly absorbed; the carboxymethyl ester is hydrolysed by intestinal esterases to advantame acid (de-esterified advantame), the principal faecal metabolite, with trace liberation of methanol and phenylalanine that is negligible at use levels.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 0.05,
        "max": 10,
        "typical": 1,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 458.51,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Poorly absorbed (~6%); hydrolysed to advantame acid and excreted; any phenylalanine release is negligible."
    },
    "notes": "E969; ~20,000x sweeter than sucrose (~110x aspartame). EU/FDA-approved non-nutritive sweetener; EFSA ADI 5 mg/kg bw/day. Despite containing a phenylalanine moiety, it is exempt from PKU \"phenylketonurics\" labeling because amounts used are negligibly small."
  },
  {
    "slug": "sodium-cyclamate",
    "name": "Sodium Cyclamate",
    "aliases": [
      "E952",
      "Cyclamate",
      "Sodium cyclohexylsulfamate",
      "Sodium N-cyclohexylsulfamate",
      "Cyclohexylsulfamic acid sodium salt",
      "Sucaryl",
      "Assugrin",
      "Cyclamic acid"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "The sodium salt of cyclamic acid (N-cyclohexylsulfamate), a first-generation high-intensity sweetener roughly 30-50x sweeter than sucrose — the least potent of the synthetic sweeteners — with a clean sweet taste lacking the metallic note of saccharin, with which it is classically blended for synergy. Sweetness arises from agonism at the sweet-taste receptor heterodimer T1R2/T1R3 on lingual taste cells, triggering gustducin-coupled signaling; it carries no metabolizable calories. Most of an ingested dose passes unabsorbed to the colon and is excreted in feces and urine unchanged. In a minority of people, colonic flora (enterococci, certain enterobacteria/clostridia) express cyclamate sulfamatase, hydrolyzing it to cyclohexylamine — a sympathomimetic amine and the focus of historical bladder-tumor and reproductive-toxicity concern. Unlike [[aspartame]], it is heat-stable and suitable for baking.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 5,
        "max": 400,
        "typical": 100,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 201.22,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Largely unabsorbed; some individuals’ gut bacteria convert it to cyclohexylamine, the basis of historical safety concern."
    },
    "notes": "E952; ~30-50x sweeter than sucrose, non-nutritive and heat-stable. JECFA ADI 0-11 mg/kg bw (as cyclamic acid); EU SCF 0-7 mg/kg bw. Approved in the EU and ~100 countries but banned for food use in the United States since 1969 after rat bladder-tumor findings in a cyclamate-saccharin mix; the metabolite cyclohexylamine drives the residual safety concern, so exposure depends on individual gut-flora conversion."
  },
  {
    "slug": "steviol-glycosides",
    "name": "Steviol Glycosides",
    "aliases": [
      "Stevia",
      "Stevioside",
      "Rebaudioside A",
      "Reb A",
      "E960",
      "Steviol glycoside",
      "Stevia extract",
      "Rebaudioside M",
      "Steviol equivalents"
    ],
    "category": "sweetener",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "High-potency natural-source sweeteners isolated from Stevia rebaudiana leaf, comprising ent-kaurene diterpene glycosides (stevioside, rebaudiosides A-M, dulcosides) sharing the steviol aglycone backbone. They are roughly 200-300x sweeter than sucrose and activate the sweet T1R2/T1R3 receptor; rebaudiosides are perceived as cleaner-tasting than stevioside, which carries more bitter/licorice off-notes. The intact glycosides resist human gastric and small-intestinal hydrolysis and pass essentially unabsorbed to the colon, where gut microbiota cleave the glucose moieties to liberate steviol. Steviol is absorbed, conjugated in the liver to steviol glucuronide via UDP-glucuronosyltransferases, and excreted (predominantly renally in humans, biliary in rats). They are non-caloric and non-glycemic, raising neither blood [[glucose]] nor [[insulin]], and are non-cariogenic.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 100,
        "typical": 20,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 804.87,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Mixture of diterpene glycosides (stevioside, rebaudioside A-M). Not absorbed intact; colonic bacteria hydrolyse them to the aglycone steviol, which is absorbed, glucuronidated and excreted."
    },
    "notes": "E-number E960 (steviol glycosides; subtypes E960a-d, with enzymatically produced E960c). Approximately 200-300x sweeter than sucrose, non-caloric and non-glycemic. JECFA/EFSA acceptable daily intake is 4 mg/kg body weight/day expressed as steviol equivalents; broadly approved (EU, US GRAS, FAO/WHO) with a strong safety record and no notable consumer safety flags at intake levels."
  },
  {
    "slug": "erythritol",
    "name": "Erythritol",
    "aliases": [
      "E968",
      "meso-Erythritol",
      "(2R,3S)-Butane-1,2,3,4-tetraol",
      "Butane-1,2,3,4-tetraol",
      "1,2,3,4-Butanetetrol",
      "Erythrite",
      "Tetrahydroxybutane"
    ],
    "category": "sweetener",
    "systems": [
      "digestive",
      "cardiovascular"
    ],
    "mechanism": "Four-carbon sugar alcohol (the meso reduction product of erythrose) produced industrially by yeast fermentation of glucose. Roughly 60–70% as sweet as sucrose with a near-zero glycemic and insulinemic response: it is not a substrate for intestinal disaccharidases, hexokinase, or the glycolytic enzymes, so unlike [[glucose]] or [[sorbitol]] it yields essentially no metabolizable energy. Its small molecule is uniquely well absorbed in the small intestine (~90%), then excreted unchanged in urine; the small colonic fraction is only partly fermented, so it causes markedly less osmotic diarrhoea and gas than higher-MW polyols. Endogenous trace amounts also arise from the pentose-phosphate pathway. Acts as a bulk sweetener and humectant; mild oral non-cariogenic effect since oral bacteria cannot ferment it.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 2,
        "max": 50,
        "typical": 10,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 122.12,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "~90% absorbed in the small intestine but not metabolised; excreted unchanged in urine. High absorption (unique among polyols) means little reaches the colon, so it causes far less osmotic diarrhoea than other sugar alcohols."
    },
    "notes": "EU food additive E968; ~60–70% the sweetness of sucrose at ~0 kcal/g. JECFA assigned an \"ADI not specified\" (no numerical limit) and it is FDA GRAS. Best gut tolerance of the polyols due to high small-bowel absorption, though large boluses can still be osmotically laxative; recent observational data link high circulating erythritol to cardiovascular/thrombotic risk, an association still under investigation. Unlike xylitol it poses no acute canine hypoglycemia hazard."
  },
  {
    "slug": "xylitol",
    "name": "Xylitol",
    "aliases": [
      "E967",
      "Birch sugar",
      "Xylit",
      "Sugar alcohol",
      "Polyol",
      "Pentitol",
      "meso-Xylitol",
      "Xylo-pentane-1,2,3,4,5-pentol"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "A five-carbon sugar alcohol (pentitol, C5H12O5) used as a bulk sweetener at roughly the sweetness of sucrose but with about 40% fewer calories. It is absorbed slowly and incompletely from the small intestine by passive diffusion (no active transporter), so a large fraction reaches the colon, where bacterial fermentation produces short-chain fatty acids and gas and exerts an osmotic, laxative effect at high intake. The absorbed portion is metabolised mainly in the liver via the glucuronate–xylulose (uronic-acid) pathway: NAD-linked xylitol dehydrogenase oxidises it to D-xylulose, which is phosphorylated by xylulokinase to xylulose-5-phosphate and enters the pentose-phosphate pathway. Because hepatic uptake and metabolism are largely insulin-independent, the glycaemic and [[insulin]] response is minimal. It is also non-fermentable by oral Streptococcus mutans, underpinning its anti-cariogenic use.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 50,
        "typical": 7,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 152.15,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Slowly and incompletely absorbed; partly metabolised hepatically via the glucuronate-xylulose pathway, partly fermented in the colon (osmotic/laxative at high intake)."
    },
    "recon3d_metabolite_id": "xylt",
    "notes": "E967; about as sweet as sucrose (~1.0×) with ~2.4 kcal/g; EFSA/JECFA assign no numerical ADI (\"not specified\"), and it is GRAS/permitted in the EU and US. Key flags: osmotic diarrhoea above roughly 30–50 g/day (GI tolerance threshold), and it is acutely toxic to dogs (hypoglycaemia and hepatic failure), so xylitol-containing products must be kept away from pets."
  },
  {
    "slug": "sorbitol",
    "name": "Sorbitol",
    "aliases": [
      "E420",
      "D-Glucitol",
      "D-Sorbitol",
      "Glucitol",
      "(2S,3R,4R,5R)-Hexane-1,2,3,4,5,6-hexol",
      "INS 420"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "Six-carbon sugar alcohol (hexitol), the reduced form of glucose/fructose. Slowly and incompletely absorbed in the small intestine by passive diffusion; the absorbed fraction is oxidised by hepatic sorbitol dehydrogenase to [[fructose]], which then enters glycolysis — the second limb of the polyol (aldose-reductase/SDH) pathway that also operates intracellularly under hyperglycaemia. Because absorption is slow and partial, it carries roughly half the caloric value of sucrose and a low glycaemic response largely independent of [[insulin]] for its first metabolic steps. The unabsorbed remainder is osmotically active in the colon, drawing water and undergoing bacterial fermentation, which underlies its use as an osmotic laxative and its dose-dependent flatulence/diarrhoea (a FODMAP polyol). About 60% as sweet as sucrose.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 50,
        "typical": 7,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 182.17,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Slowly absorbed; metabolised to fructose by sorbitol dehydrogenase (the polyol pathway). The unabsorbed fraction is osmotic — a recognised laxative."
    },
    "recon3d_metabolite_id": "sbt__D",
    "notes": "E420 (INS 420); about 60% as sweet as sucrose, ~2.6 kcal/g. JECFA/EU ADI \"not specified\" and GRAS/permitted as a sweetener, humectant and bulk laxative. Laxative/osmotic GI effects are dose-dependent (loose stools and gas typically above ~20-50 g/day); EU requires an \"excessive consumption may produce laxative effects\" label."
  },
  {
    "slug": "mannitol",
    "name": "Mannitol",
    "aliases": [
      "E421",
      "D-Mannitol",
      "Mannite",
      "Osmitrol",
      "Manna sugar",
      "Cordycepic acid"
    ],
    "category": "sweetener",
    "systems": [
      "digestive",
      "renal",
      "nervous"
    ],
    "mechanism": "Six-carbon sugar alcohol (hexitol), the reduced form of mannose, non-glycemic and non-cariogenic. Orally it is poorly absorbed — lacking an active intestinal transporter, it crosses the mucosa slowly by passive diffusion, so the bulk reaches the colon where it draws water osmotically (laxative) and is fermented by gut flora to short-chain fatty acids and gas, yielding only ~1.6 kcal/g; the absorbed fraction is largely excreted unchanged in urine, not metabolised by hexokinase. Given intravenously it is a distinct clinical agent: confined to extracellular fluid, freely filtered at the glomerulus and essentially non-reabsorbed, it acts as an osmotic diuretic and raises plasma osmolality to pull water from brain and ocular tissue, lowering intracranial and intraocular pressure before renal clearance largely intact.",
    "routes": [
      "PO",
      "IV"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 30,
        "typical": 5,
        "unit": "g"
      },
      "IV": {
        "min": 12,
        "max": 100,
        "typical": 50,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 182.17,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Oral mannitol is poorly absorbed and osmotic/laxative. Intravenous mannitol is a distinct clinical agent — a freely-filtered, non-reabsorbed osmotic diuretic for raised intracranial pressure, cerebral oedema and acute glaucoma; it distributes in extracellular fluid and is excreted largely unchanged renally (IV one-compartment PK left for a future verified-source PK wave)."
    },
    "recon3d_metabolite_id": "mnl",
    "notes": "E421 sugar-alcohol bulk sweetener, ~50-60% as sweet as sucrose at ~1.6 kcal/g; JECFA ADI \"not specified\" and EU-permitted quantum satis, but foods exceeding ~10% polyol must carry a \"excessive consumption may produce laxative effects\" warning. The IV form (Osmitrol) is a prescription osmotic diuretic, a distinct use from the food additive."
  },
  {
    "slug": "maltitol",
    "name": "Maltitol",
    "aliases": [
      "E965",
      "Maltit",
      "Maltite",
      "D-Maltitol",
      "4-O-alpha-D-glucopyranosyl-D-glucitol",
      "4-O-alpha-glucopyranosyl-D-sorbitol"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "Disaccharide polyol — D-glucose linked α-1,4 to D-sorbitol ([[glucose]] + [[sorbitol]] core) — used as a bulk sugar substitute at ~75-90% the sweetness of sucrose with roughly half the calories. Resists salivary/pancreatic amylase but is slowly cleaved by intestinal brush-border maltase-type α-glucosidases and disaccharidases, releasing glucose (insulin-raising) plus sorbitol; net absorption is incomplete, so it carries the highest glycemic index of the common polyols. The unabsorbed fraction reaches the colon, where it draws water osmotically and is fermented by gut microbiota to short-chain fatty acids and gas, producing the characteristic bloating and laxative effect above tolerance. Approved as food additive E965 (maltitol E965i, maltitol syrup E965ii); non-cariogenic since oral streptococci cannot ferment it to acid.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 40,
        "typical": 8,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 344.31,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Partially hydrolysed/absorbed; the remainder is fermented in the colon, giving a notable osmotic/laxative effect. Higher glycemic index than other polyols."
    },
    "notes": "Bulk sweetener E965; ~75-90% as sweet as sucrose at ~2.1 kcal/g. JECFA/EFSA assign \"ADI not specified\" (regarded as safe); chief flag is dose-dependent osmotic/laxative GI effects (gas, bloating, diarrhea) and the highest glycemic/insulinemic response among the sugar alcohols, so it is not glucose-neutral for diabetics."
  },
  {
    "slug": "isomalt",
    "name": "Isomalt",
    "aliases": [
      "E953",
      "INS 953",
      "Isomaltitol",
      "Palatinit",
      "Hydrogenated isomaltulose",
      "Hydrogenated palatinose"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "Isomalt is a sugar alcohol (polyol) produced from sucrose in two steps: enzymatic isomerisation of the 1,2-glucose-fructose linkage to the 1,6-linked isomaltulose (palatinose), then catalytic hydrogenation, yielding a near-equimolar mixture of two disaccharide alcohols — 6-O-alpha-D-glucopyranosyl-D-sorbitol (GPS) and 1-O-alpha-D-glucopyranosyl-D-mannitol (GPM). The alpha-1,6 glucosidic bond resists salivary and pancreatic alpha-amylase and intestinal sucrase-isomaltase, so digestion and small-intestinal absorption are minimal. Most reaches the colon, where it is osmotically active and fermented by gut microbiota to short-chain fatty acids and gas. Caloric yield (~2 kcal/g) and glycaemic/[[insulin]] response are low. Sweetness is roughly 0.45-0.6x that of sucrose, with a sugar-like bulk and mouthfeel that suit hard candies and lozenges; it is non-cariogenic, as oral bacteria poorly ferment it to acid.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 40,
        "typical": 8,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 344.31,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Equimolar mixture of two disaccharide alcohols (gluco-mannitol GPM and gluco-sorbitol GPS), made from sucrose. Poorly digested/absorbed; partly colonically fermented (osmotic)."
    },
    "notes": "E953 (INS 953); about half the sweetness of sucrose (~0.45-0.6x), ~2 kcal/g, low glycaemic and non-cariogenic. JECFA assigns an ADI \"not specified\"; generally recognised as safe. Like other polyols, excessive intake is osmotic-laxative and can cause bloating and flatulence; EU labelling warns \"excessive consumption may produce laxative effects.\""
  },
  {
    "slug": "lactitol",
    "name": "Lactitol",
    "aliases": [
      "E966",
      "Lactit",
      "Lactositol",
      "Lactobiosit",
      "Lactitol monohydrate",
      "4-O-beta-D-galactopyranosyl-D-glucitol",
      "4-O-beta-D-galactopyranosyl-D-sorbitol"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "A disaccharide polyol (galactose β-1,4-linked to glucitol) used as a reduced-calorie bulk sweetener, roughly 0.3–0.4x as sweet as sucrose. Resistant to salivary and small-intestinal disaccharidases and essentially unabsorbed, so it delivers negligible glycemic/insulinemic load and only ~2 kcal/g. The unabsorbed sugar alcohol reaches the colon, where it is osmotically active and fermented by resident microbiota to short-chain fatty acids, CO2 and H2 — the basis of its laxative use. As a pharmaceutical it mirrors [[lactulose]]: colonic acidification lowers luminal pH, trapping ammonia as non-diffusible NH4+ for fecal excretion, lowering blood ammonia in hepatic encephalopathy. Excess intake draws water into the lumen, producing the dose-dependent osmotic diarrhea and flatulence characteristic of polyols.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 40,
        "typical": 8,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 344.31,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Not hydrolysed by intestinal enzymes and essentially unabsorbed; fermented by colonic bacteria. This is also its drug action — an osmotic laxative / ammonia-lowering agent for chronic constipation and hepatic encephalopathy (like lactulose)."
    },
    "notes": "E966; a bulk sweetener about 0.4x as sweet as sucrose (~2 kcal/g). JECFA/EU assign no numerical ADI (\"not specified\"); GRAS-status / approved in the US, EU and elsewhere (the lactitol drug Pizensy was FDA-approved in 2020 for chronic idiopathic constipation). Like other polyols it is laxative in excess, so EU labels carry \"excessive consumption may produce laxative effects.\" Tooth-friendly (non-cariogenic) and low-glycemic. It is a galactose-containing disaccharide alcohol (~47% galactopyranosyl by mass): contraindicated in galactosemia / patients requiring a low-galactose diet — the FDA Pizensy label and food-additive assessments flag this, paralleling lactulose, so its galactose content is NOT considered safe in classic galactosemia."
  },
  {
    "slug": "allulose",
    "name": "Allulose",
    "aliases": [
      "D-Allulose",
      "D-Psicose",
      "Psicose",
      "D-ribo-2-hexulose",
      "Pseudofructose"
    ],
    "category": "sweetener",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "A rare monosaccharide and the C-3 epimer of D-fructose (a ketohexose, C6H12O6), allulose delivers roughly 70% of sucrose's sweetness with negligible caloric value. It is taken up across the small-intestinal mucosa, partly via the fructose transporter GLUT5 and passive diffusion (~70% absorbed), but is essentially not phosphorylated or fed into glycolysis; the bulk is filtered at the glomerulus and excreted unchanged in urine, with the unabsorbed remainder passing to the colon. Because it bypasses fructolysis and hexokinase-dependent pathways, it elicits virtually no glycemic or insulinemic response and does not promote dental caries. FDA designations are GRAS, and US labeling excludes it from Total and Added Sugars using a 0.4 kcal/g factor; high single doses can produce osmotic, fermentative GI effects.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 40,
        "typical": 5,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 180.16,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "A C-3 epimer of fructose (ketohexose). ~70% absorbed in the small intestine but essentially not metabolised — excreted unchanged in urine, contributing almost no energy."
    },
    "notes": "No EU E-number (not an authorized EU additive; novel-food status). About 70% as sweet as sucrose at ~0.4 kcal/g. FDA GRAS and excluded from Total/Added Sugars on US Nutrition Facts; no formal numeric ADI. Generally well tolerated, but large single doses (roughly above 0.4 g/kg) can cause osmotic bloating, gas, and diarrhea."
  },
  {
    "slug": "mogrosides",
    "name": "Mogrosides",
    "aliases": [
      "Monk fruit extract",
      "Luo han guo",
      "Mogroside V",
      "Siraitia grosvenorii extract",
      "Monkfruit",
      "Luo han guo extract",
      "Buddha fruit"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "Cucurbitane-type triterpene glycosides from the fruit of Siraitia grosvenorii (monk fruit / luo han guo), with mogroside V the dominant and sweetest species (~250x sucrose). Sweetness is mediated by agonism at the heterodimeric sweet-taste receptor T1R2/T1R3 on lingual taste cells. The intact glycosides are large, highly glycosylated molecules poorly absorbed in the small intestine; they pass to the colon where gut microbiota progressively strip the glucose units to less-glycosylated mogrosides and ultimately the aglycone mogrol, which is absorbed, undergoes oxidative/enterohepatic metabolism, and is excreted largely in faeces and bile. They contribute negligible calories and do not raise blood [[glucose]] or [[insulin]]; the cucurbitane core also carries antioxidant activity. Heat- and pH-stable, suitable for cooking and beverages.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 100,
        "typical": 15,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 1287.43,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Cucurbitane triterpene glycosides (mogroside V dominant). Poorly absorbed intact; colonic microbiota strip the glucose units to mogrol, which is absorbed and excreted."
    },
    "notes": "Monk fruit (luo han guo) extract; mogroside V is ~250x sweeter than sucrose, non-caloric and non-glycemic. US GRAS; no numeric JECFA ADI and no assigned EU E-number (not yet an EU-authorised sweetener as of 2024). Strong safety record; frequently blended with erythritol as a bulk carrier."
  },
  {
    "slug": "thaumatin",
    "name": "Thaumatin",
    "aliases": [
      "E957",
      "Talin",
      "Katemfe",
      "Thaumatin I",
      "Thaumatin II"
    ],
    "category": "sweetener",
    "systems": [
      "digestive"
    ],
    "mechanism": "An intensely sweet plant protein — a single ~207-residue, ~22 kDa polypeptide stabilised by eight disulfide bonds — from the arils of the West African katemfe fruit, Thaumatococcus daniellii. It is roughly 2,000-3,000x sweeter than sucrose by weight, binding the sweet T1R2/T1R3 receptor with a slow-onset, lingering sweetness and a mild licorice note; below sweetness threshold it acts as a flavour enhancer/modifier. As a protein it is digested in the gastrointestinal tract by gastric and pancreatic proteases to its constituent amino acids and absorbed as ordinary dietary peptide/amino-acid nitrogen, so there is no intact systemic exposure and it adds negligible calories at use levels. It is heat-stable in acidic foods but loses sweetness once its disulfide-bonded fold is denatured.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 0.5,
        "max": 50,
        "typical": 5,
        "unit": "mg"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 22209,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "A ~207-residue sweet-tasting protein from Thaumatococcus daniellii; digested as dietary protein, so there is no intact systemic exposure."
    },
    "notes": "E957; a sweet protein ~2,000-3,000x sweeter than sucrose, also used as a flavour enhancer/modifier. EU-approved (E957) and US GRAS; JECFA assigned an \"ADI not specified\". Digested as a normal dietary protein with no notable safety concerns at use levels."
  },
  {
    "slug": "tagatose",
    "name": "Tagatose",
    "aliases": [
      "D-Tagatose",
      "Rare sugar",
      "D-(-)-Tagatose"
    ],
    "category": "sweetener",
    "systems": [
      "digestive",
      "endocrine"
    ],
    "mechanism": "A ketohexose monosaccharide, the C-4 epimer of [[fructose]] (and keto isomer of [[galactose]]), produced commercially by isomerising galactose obtained from lactose/whey. It is ~90% as sweet as sucrose but low-calorie (~1.5 kcal/g): only a minor fraction is absorbed in the small intestine (partly via GLUT5, like fructose) and metabolised hepatically by ketohexokinase to tagatose-1-phosphate and onward through fructose-like pathways, while the majority passes to the colon and is fermented by microbiota to short-chain fatty acids (a prebiotic effect) with gas and an osmotic/laxative potential at high intake. Hepatic handling is largely [[insulin]]-independent, giving a low glycaemic response, and it has been studied for blunting post-prandial [[glucose]] excursions. Non-cariogenic.",
    "routes": [
      "PO"
    ],
    "doses": {
      "PO": {
        "min": 1,
        "max": 40,
        "typical": 5,
        "unit": "g"
      }
    },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 180.16,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "A C-4 epimer of fructose (ketohexose). Partly absorbed and hepatically metabolised, partly fermented in the colon; low glycemic and low caloric."
    },
    "notes": "A \"rare sugar\" bulk sweetener ~90% as sweet as sucrose at ~1.5 kcal/g; FDA GRAS and an EU authorised novel food (no E-number; not a high-intensity additive). Low glycaemic and prebiotic, but large doses are osmotically laxative/flatulent."
  },
  {
    "slug": "neohesperidin-dihydrochalcone",
    "name": "Neohesperidin Dihydrochalcone",
    "aliases": ["E959", "NHDC", "Neohesperidin DC", "Neohesperidin dihydrochalcone"],
    "category": "sweetener",
    "systems": ["digestive"],
    "mechanism": "A semi-synthetic dihydrochalcone glycoside made by alkaline hydrogenation of neohesperidin from bitter (Seville) orange. It is roughly 1,000-1,800x sweeter than sucrose with a slow onset and a lingering cooling, menthol/licorice-like aftertaste, acting as an agonist of the sweet T1R2/T1R3 receptor; at sub-sweetness levels it also masks bitterness and enhances flavour/mouthfeel. As a polar rhamnoglucoside it is poorly absorbed in the small intestine and passes to the colon, where gut microbiota hydrolyse the sugar moieties and ring-open the aglycone to small phenolics (e.g. hesperetin dihydrochalcone, 3-(4-hydroxyphenyl)propionic acid) that are absorbed and excreted; it contributes negligible calories and is non-glycaemic.",
    "routes": ["PO"],
    "doses": { "PO": { "min": 1, "max": 50, "typical": 10, "unit": "mg" } },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 612.58,
    "pk_unauthored": {
      "reason": "local-acting",
      "note": "Poorly absorbed polar glycoside; hydrolysed and ring-opened by colonic microbiota to absorbable phenolic metabolites."
    },
    "notes": "E959; an EU/US-authorised intense sweetener and flavour/bitterness modifier ~1,000-1,800x sweeter than sucrose. EFSA ADI 5 mg/kg bw/day. Citrus-derived (bitter-orange neohesperidin); its cooling licorice aftertaste limits standalone use, so it is usually blended."
  },
  {
    "slug": "aspartame-acesulfame-salt",
    "name": "Aspartame-Acesulfame Salt",
    "aliases": ["E962", "Twinsweet", "Aspartame-acesulfame salt", "Aspartame-acesulfame"],
    "category": "sweetener",
    "systems": ["digestive", "nervous"],
    "mechanism": "A crystalline 1:1 molar salt that co-precipitates [[aspartame]] with the [[acesulfame-potassium]] anion (about 64% aspartame, 36% acesulfame by weight). In solution it simply dissociates into its two parent sweeteners, which act independently on the sweet T1R2/T1R3 receptor with well-known sweetness synergy and an improved sweetness profile/stability versus either alone (net ~350x sucrose). Disposition is that of the two ions: the aspartame moiety is hydrolysed presystemically to aspartate, phenylalanine and methanol, while acesulfame is absorbed and excreted unchanged. Because it is an aspartame source it carries the phenylketonuria (PKU) phenylalanine caution. Non-nutritive and non-glycaemic.",
    "routes": ["PO"],
    "doses": { "PO": { "min": 5, "max": 100, "typical": 25, "unit": "mg" } },
    "half_life_hr": {},
    "refs": [],
    "mw_g_mol": 457.46,
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Dissociates in solution to aspartame + acesulfame, which are then handled independently (aspartame hydrolysed to Phe/Asp/methanol; acesulfame excreted unchanged)."
    },
    "notes": "E962; a co-crystallised salt of aspartame + acesulfame-K (~350x sucrose) used for sweetness synergy and stability. The EFSA ADIs of the two parent sweeteners apply to their respective moieties. Contains phenylalanine - same PKU caution as aspartame."
  },
  {
    "slug": "polyglycitol-syrup",
    "name": "Polyglycitol Syrup",
    "aliases": ["E964", "Hydrogenated starch hydrolysate", "HSH", "Maltitol syrup", "Polyglycitol", "Hydrogenated glucose syrup"],
    "category": "sweetener",
    "systems": ["digestive"],
    "mechanism": "A bulk polyol sweetener made by hydrogenating glucose/starch hydrolysate, yielding a mixture of [[sorbitol]], [[maltitol]] and longer hydrogenated malto-oligosaccharides (the exact profile, and thus sweetness, depends on the parent syrup's dextrose equivalent). It is partially and slowly absorbed; the unabsorbed higher-MW fraction is fermented in the colon, giving an osmotic/laxative effect at high intake like other polyols. It is roughly 25-50% as sweet as sucrose with a reduced glycaemic and insulinaemic response and reduced calories, and is non-cariogenic. Used as a humectant, bulking agent and crystallisation inhibitor in sugar-free confectionery.",
    "routes": ["PO"],
    "doses": { "PO": { "min": 1, "max": 40, "typical": 10, "unit": "g" } },
    "half_life_hr": {},
    "refs": [],
    "pk_unauthored": {
      "reason": "mixture",
      "note": "Polydisperse mixture of sorbitol, maltitol and hydrogenated oligosaccharides; partially absorbed, the remainder colonically fermented (osmotic)."
    },
    "notes": "E964; a bulk polyol mixture (hydrogenated starch hydrolysate / maltitol syrup) ~25-50% as sweet as sucrose. EU-authorised sweetener with no numerical ADI (\"not specified\"); osmotically laxative in quantity, like other polyols."
  }
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Entry[];
  const have = new Set(data.map((c) => c.slug));
  let added = 0;
  for (const e of ENTRIES) {
    if (have.has(e.slug)) { console.log(`skip existing: ${e.slug}`); continue; }
    data.push(e);
    have.add(e.slug);
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ${added} sugar/sweetener entries. Compound count now ${data.length}.`);
}

main();
