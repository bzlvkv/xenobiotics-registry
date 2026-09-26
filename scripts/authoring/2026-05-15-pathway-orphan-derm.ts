/**
 * 2026-05-15-pathway-orphan-derm.ts — close two coverage gaps.
 *
 * Part A — orphan substrate/metabolite patches: add ~30 endogenous
 * substrates + metabolites + neurotransmitters as `substrate` or
 * `cofactor` modulators on the existing pathways they belong to.
 *
 * Part B — 4 new dermatology pathways covering the ~30 topical-only
 * compounds the registry has that previously had no pathway home.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
type Modulator = { slug: string; effect: Effect; target?: string; note?: string };
type Pathway = {
  slug: string;
  name: string;
  category: 'biosynthesis' | 'catabolism' | 'signaling' | 'transport' | 'endocrine_axis' | 'drug_metabolism';
  systems: string[];
  description: string;
  steps: Array<{ from: string; to: string; via: string }>;
  modulators: Modulator[];
  refs: string[];
};

const ORPHAN_PATCHES: Array<{ pathway: string; modulator: Modulator }> = [
  { pathway: 'bcaa_metabolism', modulator: { slug: 'isoleucine', effect: 'substrate', target: 'BCAT/BCKDC shared catabolic pathway' } },
  { pathway: 'bcaa_metabolism', modulator: { slug: 'valine', effect: 'substrate', target: 'BCAT/BCKDC shared catabolic pathway' } },
  { pathway: 'glycine_serine_threonine_metabolism', modulator: { slug: 'glycine', effect: 'substrate', target: 'inter-convertible AA + GSH precursor + NMDA co-agonist' } },
  { pathway: 'glycine_serine_threonine_metabolism', modulator: { slug: 'serine', effect: 'substrate', target: 'one-carbon donor + phospholipid precursor' } },
  { pathway: 'glycine_serine_threonine_metabolism', modulator: { slug: 'threonine', effect: 'substrate', target: 'essential AA; Thr → Gly via threonine aldolase' } },
  { pathway: 'lysine_metabolism', modulator: { slug: 'lysine', effect: 'substrate', target: 'essential AA; carnitine synthesis precursor' } },
  { pathway: 'phenylalanine_metabolism', modulator: { slug: 'phenylalanine', effect: 'substrate', target: 'PAH substrate → tyrosine; PKU substrate' } },
  { pathway: 'tyrosine_metabolism', modulator: { slug: 'tyrosine', effect: 'substrate', target: 'Tyr → DOPA → catecholamines' } },
  { pathway: 'tyrosine_metabolism', modulator: { slug: 'l-tyrosine', effect: 'substrate', target: 'L-isomer (supplement form)' } },
  { pathway: 'catecholamine_synthesis', modulator: { slug: 'dopamine', effect: 'substrate', target: 'product of DOPA decarboxylation; precursor to NE/E' } },
  { pathway: 'serotonin_melatonin_axis', modulator: { slug: 'serotonin', effect: 'substrate', target: '5-HT — 5-HTP decarboxylation product; melatonin precursor' } },
  { pathway: 'acetylcholine_axis', modulator: { slug: 'acetylcholine', effect: 'substrate', target: 'endogenous ligand; ChAT product, AChE substrate' } },
  { pathway: 'glutamate_glutamine_cycle', modulator: { slug: 'glutamate', effect: 'substrate', target: 'dominant excitatory neurotransmitter' } },
  { pathway: 'glutathione_metabolism', modulator: { slug: 'cysteine', effect: 'substrate', target: 'rate-limiting GSH substrate' } },
  { pathway: 'taurine_synthesis', modulator: { slug: 'taurine', effect: 'substrate', target: 'sulfur AA; bile-acid conjugation + osmoregulation' } },
  { pathway: 'taurine_synthesis', modulator: { slug: 'hypotaurine', effect: 'substrate', target: 'taurine precursor via hypotaurine dehydrogenase' } },
  { pathway: 'urea_cycle', modulator: { slug: 'citrulline', effect: 'substrate', target: 'urea-cycle intermediate; NO precursor' } },
  { pathway: 'glycolysis', modulator: { slug: 'pyruvate', effect: 'substrate', target: 'glycolytic end-product; PDH substrate' } },
  { pathway: 'pyruvate_metabolism', modulator: { slug: 'pyruvate', effect: 'substrate', target: 'central metabolic hub: PDH/PC/LDH/ALT branches' } },
  { pathway: 'purine_de_novo_synthesis', modulator: { slug: 'amp', effect: 'substrate', target: 'purine nucleotide' } },
  { pathway: 'pyrimidine_metabolism', modulator: { slug: 'ump', effect: 'substrate', target: 'pyrimidine nucleotide; UMP→UDP→UTP+CTP' } },
  { pathway: 'oxidative_phosphorylation', modulator: { slug: 'nadh', effect: 'substrate', target: 'electron donor to complex I' } },
  { pathway: 'pentose_phosphate_pathway', modulator: { slug: 'ribose-5-phosphate', effect: 'substrate', target: 'non-oxidative branch product; nucleotide precursor' } },
  { pathway: 'ketone_body_synthesis', modulator: { slug: 'acetoacetate', effect: 'substrate', target: 'primary ketone body from HMG-CoA cleavage' } },
  { pathway: 'ketone_body_synthesis', modulator: { slug: 'acetone', effect: 'substrate', target: 'spontaneous acetoacetate decarboxylation product' } },
  { pathway: 'inositol_phosphate_signaling', modulator: { slug: 'inositol', effect: 'substrate', target: 'IP3 + phosphatidylinositol precursor' } },
  { pathway: 'vitamin_b12_metabolism', modulator: { slug: 'adenosylcobalamin', effect: 'cofactor', target: 'mitochondrial methylmalonyl-CoA mutase cofactor' } },
  { pathway: 'vitamin_b12_metabolism', modulator: { slug: 'methylcobalamin', effect: 'cofactor', target: 'cytoplasmic methionine synthase cofactor' } },
  { pathway: 'thiamine_metabolism', modulator: { slug: 'thiamine', effect: 'substrate', target: 'B1 vitamin; TPP cofactor' } },
  { pathway: 'biotin_metabolism', modulator: { slug: 'biotin', effect: 'substrate', target: 'B7 vitamin; carboxylase prosthetic group' } },
  { pathway: 'retinol_vitamin_a_metabolism', modulator: { slug: 'beta-carotene', effect: 'substrate', target: 'pro-vitamin A; BCO1 cleavage → retinal' } },
  { pathway: 'steroid_hormone_biosynthesis', modulator: { slug: 'pregnenolone', effect: 'substrate', target: 'CYP11A1 product; root steroid precursor' } },
  { pathway: 'arachidonic_acid_cascade', modulator: { slug: 'arachidonic-acid', effect: 'substrate', target: '20:4ω6 PUFA released by PLA2; COX/LOX/CYP substrate' } },
  { pathway: 'insulin_glucose_homeostasis', modulator: { slug: 'glp-1', effect: 'activator', target: 'endogenous incretin hormone; GLP-1R agonist' } },
];

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'topical_steroid_skin_inflammation',
    name: 'Topical anti-inflammatory skin Rx (steroid / calcineurin / PDE4)',
    category: 'signaling',
    systems: ['integumentary', 'immune-hematologic'],
    description: `Topical anti-inflammatory pharmacology for atopic + inflammatory skin diseases (atopic dermatitis, psoriasis, contact dermatitis, lichen, vitiligo). Three primary mechanistic classes: (1) Topical corticosteroids (TCS) — GR agonists with potency stratified by class (super-potent class I clobetasol → class VII low-potency hydrocortisone-topical). GR → transrepression of NF-κB target cytokines + induction of anti-inflammatory genes (lipocortin-1, IκBα). Side effects: skin atrophy, striae, telangiectasia, HPA suppression with prolonged + high-potency use; tachyphylaxis. (2) Topical calcineurin inhibitors (TCI) — tacrolimus-topical 0.03/0.1%, pimecrolimus 1%. FKBP12-calcineurin complex blocks NFAT → ↓IL-2 + ↓IL-4 + ↓IL-13. Steroid-sparing alternative, especially in atopic dermatitis on face/folds. Original FDA boxed warning for theoretical malignancy risk has eased. (3) PDE4 inhibitors — crisaborole 2% — cAMP elevation → ↓pro-inflammatory cytokines. Steroid-sparing, mild atopic dermatitis. (4) Topical JAK inhibitors — ruxolitinib-topical (Opzelura, atopic dermatitis + vitiligo) — JAK1/2 inhibition → ↓IFN + IL-4 + IL-13 signaling. Strategy: highest-potency steroid burst → step-down → maintenance with steroid-sparing TCI / PDE4 / JAKi to avoid TCS adverse effects. Cross-links: [[glucocorticoid_receptor_signaling]] (TCS mechanism), [[calcineurin_nfat_t_cell_activation]] (TCI mechanism), [[jak_stat_signaling]] (JAKi), [[asthma_th2_eosinophil_inflammation]] (atopic march).`,
    steps: [
      { from: 'skin barrier dysfunction (filaggrin LOF, scratch-itch cycle)', to: 'epidermal cytokine release + Th2 polarization', via: 'atopic dermatitis pathogenesis substrate' },
      { from: 'topical corticosteroid + GR', to: 'GR-cytoplasmic → nuclear translocation', via: 'transrepression of NF-κB targets + transactivation of anti-inflammatory genes' },
      { from: 'topical calcineurin inhibitor + FKBP12', to: 'calcineurin block → ↓NFAT', via: '↓IL-2 + ↓IL-4 + ↓IL-13 in skin T cells' },
      { from: 'crisaborole + PDE4', to: '↑intracellular cAMP', via: '↓TNF / IL-2 / IFN-γ in keratinocytes + T cells' },
      { from: 'topical JAK inhibitor', to: 'JAK1/2 block → ↓STAT cytokine signaling', via: '↓IFN + IL-4 + IL-13 keratinocyte response' },
      { from: 'sustained high-potency TCS', to: 'skin atrophy + HPA axis suppression', via: 'tachyphylaxis + adverse effects motivate steroid-sparing' },
    ],
    modulators: [
      { slug: 'clobetasol',             effect: 'inhibitor', target: 'GR — super-potent class I TCS (psoriasis short-burst + lichen)' },
      { slug: 'hydrocortisone-topical', effect: 'inhibitor', target: 'GR — low-potency class VII TCS (mild eczema, face/folds)' },
      { slug: 'triamcinolone',          effect: 'inhibitor', target: 'GR — mid-potency TCS' },
      { slug: 'betamethasone',          effect: 'inhibitor', target: 'GR — high-potency TCS' },
      { slug: 'tacrolimus-topical',     effect: 'inhibitor', target: 'calcineurin (via FKBP12) — TCI, steroid-sparing' },
      { slug: 'pimecrolimus',           effect: 'inhibitor', target: 'calcineurin — TCI, weaker than tacrolimus-topical' },
      { slug: 'crisaborole',            effect: 'inhibitor', target: 'PDE4 — non-steroidal anti-inflammatory' },
      { slug: 'calcipotriene',          effect: 'activator', target: 'VDR — topical psoriasis (anti-proliferative)' },
      { slug: 'tazarotene',             effect: 'activator', target: 'RAR — topical psoriasis + acne' },
      { slug: 'adapalene',              effect: 'activator', target: 'RAR-β/γ — topical acne (less irritating than tretinoin)' },
      { slug: 'tretinoin',              effect: 'activator', target: 'RAR — topical acne + photoaging' },
    ],
    refs: [],
  },
  {
    slug: 'skin_antimicrobial_antiparasitic',
    name: 'Skin antimicrobial + antiparasitic topicals',
    category: 'signaling',
    systems: ['integumentary'],
    description: `Topical antimicrobial pharmacology for skin + soft tissue infection + ectoparasitic infestation. Subcategories by target: (1) Antibacterial — mupirocin (pseudomonic acid; isoleucyl-tRNA synthetase inhibitor — protein synthesis block; MRSA decolonization mainstay; FDA-approved for impetigo + folliculitis); clindamycin-topical (acne, hidradenitis suppurativa — 50S ribosomal subunit); metronidazole-topical (rosacea — anti-anaerobic + anti-inflammatory mechanism); chlorhexidine (broad-spectrum antiseptic — disrupts bacterial membrane; surgical skin prep + chronic decolonization). (2) Antifungal — clotrimazole + ketoconazole (CYP51 azoles for dermatophytes + Candida + Malassezia); terbinafine (squalene epoxidase — ergosterol synthesis block; onychomycosis gold standard); ciclopirox; griseofulvin. (3) Antiparasitic — permethrin (pyrethroid sodium-channel modulator; scabies + lice 1st-line); ivermectin (oral or topical 1% — scabies, demodicosis, rosacea); spinosad; lindane (historical, neurotoxic — restricted). (4) Anti-acne — benzoyl peroxide (ROS-mediated kill of C. acnes); azelaic acid; topical retinoids. Resistance landscape: mupirocin-resistant MRSA + chlorhexidine-tolerance emerging; rotating agents for chronic decolonization. Cross-links: [[bacterial_translation_inhibition]] (mupirocin/clindamycin), [[fungal_ergosterol_biosynthesis]] (terbinafine/azoles), [[voltage_gated_sodium_channels]] (permethrin), [[helminth_protozoa_targets]] (ivermectin).`,
    steps: [
      { from: 'skin / hair / nail bacterial / fungal / parasitic infection', to: 'topical antimicrobial selection by organism + site', via: 'site + organism + resistance pattern guide choice' },
      { from: 'mupirocin + isoleucyl-tRNA synthetase', to: 'bacterial protein synthesis block', via: 'staphylococci + streptococci; MRSA decolonization' },
      { from: 'clindamycin-topical + 50S ribosomal subunit', to: 'bacterial protein synthesis block', via: 'C. acnes + anaerobes; acne mainstay' },
      { from: 'azole + CYP51 (lanosterol 14α-demethylase)', to: 'ergosterol biosynthesis block', via: 'fungal membrane defect; dermatophytes + Candida + Malassezia' },
      { from: 'terbinafine + squalene epoxidase', to: 'squalene accumulation + ergosterol depletion', via: 'fungicidal; onychomycosis 1st-line' },
      { from: 'permethrin + voltage-gated Na channel (insect)', to: 'persistent depolarization → paralysis', via: 'scabies + lice; selective for arthropod over mammalian Na channels' },
      { from: 'ivermectin + glutamate-gated Cl channel (parasite)', to: 'parasite paralysis', via: 'topical for rosacea + scabies; oral systemic use as well' },
    ],
    modulators: [
      { slug: 'mupirocin',             effect: 'inhibitor', target: 'bacterial Ile-tRNA synthetase — MRSA decolonization, impetigo' },
      { slug: 'clindamycin-topical',   effect: 'inhibitor', target: 'bacterial 50S — acne + HS' },
      { slug: 'metronidazole-topical', effect: 'inhibitor', target: 'anaerobic DNA + anti-inflammatory — rosacea' },
      { slug: 'chlorhexidine',         effect: 'inhibitor', target: 'bacterial membrane (broad-spectrum antiseptic)' },
      { slug: 'clotrimazole',          effect: 'inhibitor', target: 'CYP51 azole (dermatophytes + Candida)' },
      { slug: 'ketoconazole',          effect: 'inhibitor', target: 'CYP51 azole (also seborrheic dermatitis topical)' },
      { slug: 'terbinafine',           effect: 'inhibitor', target: 'squalene epoxidase (onychomycosis 1st-line)' },
      { slug: 'permethrin',            effect: 'activator', target: 'arthropod Na channel — scabies / lice' },
      { slug: 'ivermectin',            effect: 'activator', target: 'parasite glutamate-gated Cl channel — scabies + rosacea + demodicosis' },
    ],
    refs: [],
  },
  {
    slug: 'sunscreen_uv_photoprotection',
    name: 'Sunscreen + UV photoprotection',
    category: 'signaling',
    systems: ['integumentary'],
    description: `Sunscreens protect skin from UV-A (320–400 nm — photoaging, oxidative damage, melanoma) + UV-B (290–320 nm — sunburn, NMSC, vitamin D synthesis). Two classes by mechanism: (1) Organic ("chemical") filters absorb UV → re-emit as heat. UV-B absorbers (octinoxate / octisalate / homosalate / oxybenzone); UV-A absorbers (avobenzone — broadband UV-A but photolabile; needs photostabilizer like octocrylene). Photo-stability — avobenzone alone degrades in sunlight within ~30 min; modern formulations co-pair stabilizers. Endocrine-disruption concerns: oxybenzone + octinoxate banned in some jurisdictions (Hawaii, Key West) due to coral-bleaching + endocrine disruption signals — limited human data. (2) Inorganic ("mineral") filters reflect + scatter UV: zinc oxide (broad UV-A + UV-B), titanium dioxide (mostly UV-B + UV-A2). Nano vs non-nano debate — nano improves cosmetic feel but inhalation hazard (aerosol formulations). SPF = UV-B protection ratio (SPF 30 blocks ~97%, SPF 50 ~98%); PA (Asian rating) + UVA-PF (Boots star) for UV-A. EU + AU regulators require both UV-A + UV-B labelling; US FDA still considers UV-A optional. Cross-links: [[epidermal_keratinization_melanogenesis]] (melanogenesis as endogenous photoprotection), [[ferroptosis_gpx4_lipid_peroxidation]] (UV-driven membrane lipid peroxidation), [[vitamin_d_metabolism]] (sunscreen vs. vitamin D synthesis trade-off).`,
    steps: [
      { from: 'solar UV-B (290–320 nm)', to: 'epidermal DNA damage (CPD + 6-4PP photoproducts)', via: 'sunburn + non-melanoma skin cancer; vitamin D photolysis' },
      { from: 'solar UV-A (320–400 nm)', to: 'dermal oxidative damage + photoaging + melanoma risk', via: 'penetrates deeper than UV-B; ROS-mediated injury' },
      { from: 'organic UV filter + UV photon', to: 'absorption → vibrational relaxation → heat', via: 'chromophore absorbs at filter-specific wavelength; re-emission as heat' },
      { from: 'inorganic UV filter (ZnO / TiO₂)', to: 'reflection + scattering of UV', via: 'mineral particles physically block; broadband by combining' },
      { from: 'avobenzone + UV-A photon', to: 'photo-isomerization + degradation', via: 'requires octocrylene / Tinosorb stabilizer to maintain efficacy' },
      { from: 'photo-protected skin', to: 'reduced CPD + reduced melanoma + photoaging risk', via: 'cumulative dose-response; SPF + reapplication interval drive real-world protection' },
    ],
    modulators: [
      { slug: 'avobenzone',  effect: 'inhibitor', target: 'UV-A absorber (310–400 nm peak ~360 nm; photolabile — needs co-stabilizer)' },
      { slug: 'octinoxate',  effect: 'inhibitor', target: 'UV-B absorber (270–328 nm peak ~310 nm); environmental + endocrine concerns' },
      { slug: 'zinc-oxide',  effect: 'inhibitor', target: 'broad UV-A + UV-B reflector (mineral; pregnancy-safe + reef-safe)' },
    ],
    refs: [],
  },
  {
    slug: 'androgenetic_alopecia_minoxidil',
    name: 'Androgenetic alopecia — minoxidil + 5α-reductase Rx',
    category: 'signaling',
    systems: ['integumentary', 'endocrine'],
    description: `Androgenetic alopecia (AGA, male + female pattern hair loss) is the most common hair-loss disorder, driven by androgen-mediated follicular miniaturization in genetically susceptible scalp follicles. Pathogenesis: scalp follicles express androgen receptors + type-2 5α-reductase (SRD5A2) → testosterone → 5α-dihydrotestosterone (DHT). DHT binds AR → IGF-1 / dickkopf / TGF-β follicular signaling → progressive anagen-phase shortening + miniaturization (terminal → vellus). Hereditary: AR locus variants (X-linked) + autosomal gene polymorphisms. Therapeutics: (1) Minoxidil (topical 2/5% + oral low-dose 0.625–5 mg) — ATP-sensitive K⁺ channel opener (KATP); vasodilation + direct follicular keratinocyte stimulation; converts vellus to terminal hairs; reversible on discontinuation. Original use: HTN (oral 10–40 mg/d); hypertrichosis side effect → repurposed topical 1988. Low-dose oral revival (LDOM) since 2020 — comparable efficacy with better adherence. (2) Finasteride (oral 1 mg) — SRD5A2 inhibitor → ↓DHT 60–70% scalp + serum; well-established efficacy + safety; sexual side-effect signal + post-finasteride syndrome controversy. Topical finasteride alternative (lower systemic exposure). (3) Dutasteride (oral 0.5 mg) — pan-5αR (SRD5A1+2) inhibitor → ↓DHT >90%; more efficacious than finasteride but off-label for AGA in US. (4) Anti-androgens — spironolactone (off-label oral; female AGA — competitive AR antagonist + ↓adrenal androgen synthesis); cyproterone (EU). Cross-links: [[aromatase_androgen_receptor_axis]] (AR signaling upstream), [[steroid_hormone_biosynthesis]] (DHT synthesis).`,
    steps: [
      { from: 'genetic predisposition + scalp follicle AR expression', to: 'susceptibility substrate', via: 'X-linked AR + autosomal polymorphisms; F:M differ in pattern + onset' },
      { from: 'testosterone + scalp 5α-reductase type 2', to: '5α-dihydrotestosterone (DHT)', via: 'SRD5A2 is the rate-limiting step; finasteride blocks here' },
      { from: 'DHT + follicular AR', to: 'IGF-1 / DKK1 / TGF-β follicular gene programme', via: 'anagen shortening + progressive miniaturization (terminal → vellus)' },
      { from: 'follicular miniaturization', to: 'visible thinning + recession', via: 'follicles persist but produce shorter, finer hairs over years' },
      { from: 'minoxidil + scalp KATP channels', to: 'vasodilation + keratinocyte stimulation', via: 'vellus → terminal conversion; reversible on discontinuation' },
      { from: '5α-reductase inhibition (finasteride / dutasteride)', to: '↓scalp + serum DHT', via: 'finasteride 60-70%; dutasteride >90% (pan-5αR)' },
      { from: 'androgen receptor antagonist (spironolactone)', to: '↓AR signaling in scalp follicle', via: 'female AGA off-label; competitive antagonism + ↓adrenal androgen synthesis' },
    ],
    modulators: [
      { slug: 'minoxidil',           effect: 'activator', target: 'KATP channel opener — topical 2/5% + low-dose oral 0.625–5 mg revival' },
      { slug: 'finasteride',         effect: 'inhibitor', target: 'SRD5A2 — oral 1 mg AGA mainstay; ↓DHT 60–70%' },
      { slug: 'finasteride-topical', effect: 'inhibitor', target: 'SRD5A2 — topical alternative; lower systemic exposure' },
      { slug: 'dutasteride',         effect: 'inhibitor', target: 'SRD5A1 + SRD5A2 — pan-5αR; >90% DHT block; off-label for AGA in US' },
      { slug: 'spironolactone',      effect: 'inhibitor', target: 'AR + adrenal androgen synthesis — oral for female AGA' },
    ],
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map((p) => [p.slug, p]));

  let patched = 0;
  let skipped = 0;
  let missing = 0;
  for (const a of ORPHAN_PATCHES) {
    const p = bySlug.get(a.pathway);
    if (!p) {
      console.warn(`  [warn] missing pathway: ${a.pathway}`);
      missing++;
      continue;
    }
    p.modulators = p.modulators ?? [];
    if (p.modulators.some((m) => m.slug === a.modulator.slug)) {
      skipped++;
      continue;
    }
    p.modulators.push(a.modulator);
    patched++;
  }
  console.log(`Part A — orphan patches: added ${patched}, skipped ${skipped}, missing ${missing}`);

  const existing = new Set(data.map((p) => p.slug));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (existing.has(p.slug)) {
      console.log(`SKIP (already exists): ${p.slug}`);
      continue;
    }
    data.push(p);
    added++;
    console.log(`ADD: ${p.slug} (${p.modulators.length} mods)`);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nTotal pathways: ${data.length} (Part A: +${patched} mods; Part B: +${added} pathways)`);
}

main();
