/**
 * 2026-05-24-signaling-batch-K.ts
 *
 * step.note grind, batch K — 6 pathways (dermatology + estrogen/bile-acid
 * metabolism), notes-only. Refs title-checked via esummary 2026-05-24:
 *   androgenetic_alopecia_minoxidil      PMID:12196747 (minoxidil RCT), 18573712
 *   skin_antimicrobial_antiparasitic     PMID:10711939 (Lancet, scabies/pediculosis)
 *   bile_acid_microbiome_crosstalk       PMID:29018272 (NRGH), 35105664 (Gut)
 *   sunscreen_uv_photoprotection         PMID:23320122 (Sunscreening agents review)
 *   topical_steroid_skin_inflammation    PMID:24813302 (AD guidelines), 31264114
 *   estrogen_phase2_clearance_phytochemical  PMID:17515958 (estrogen/DIM)
 * (skin drug-target mechanisms are bedrock pharmacology grounded by textbook
 *  plus the antiparasitic ref; no new PMIDs.)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-K.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'androgenetic_alopecia_minoxidil',
    notes: {
      'genetic predisposition + scalp follicle AR expression susceptibility substrate':
        'Androgenetic alopecia needs a genetic substrate: inherited variation (notably at the X-linked AR locus) ' +
        'sets how strongly scalp follicles express the androgen receptor and respond to androgens. This is why AGA ' +
        'is highly heritable and why occipital “donor” follicles resist miniaturization — they are intrinsically ' +
        'less androgen-sensitive.',
      'testosterone + scalp 5α-reductase type 2 5α-dihydrotestosterone (DHT)':
        'In susceptible scalp follicles, type 2 5α-reductase converts testosterone to the far more potent androgen ' +
        'dihydrotestosterone (DHT). DHT, not testosterone, is the principal driver of AGA — which is why ' +
        '5α-reductase inhibitors (rather than testosterone-lowering) are the rational hormonal therapy.',
      'DHT + follicular AR IGF-1 / DKK1 / TGF-β follicular gene programme':
        'DHT bound to the follicular androgen receptor reprograms dermal-papilla gene expression — inducing ' +
        'inhibitory factors (TGF-β, DKK1) and dysregulating IGF-1 — that shorten the anagen (growth) phase. This ' +
        'androgen-driven program is the molecular cause of progressive follicular shrinkage.',
      'follicular miniaturization visible thinning + recession':
        'Successive cycles under this program miniaturize follicles — terminal hairs become progressively finer, ' +
        'shorter vellus-like hairs — producing visible thinning and recession in the characteristic pattern. ' +
        'Miniaturization is gradual and initially reversible, which is why early treatment preserves more hair.',
      'minoxidil + scalp KATP channels vasodilation + keratinocyte stimulation':
        'Minoxidil (a prodrug activated by sulfotransferase to minoxidil sulfate) opens follicular KATP channels, ' +
        'causing vasodilation and direct stimulation of dermal-papilla/keratinocytes to prolong anagen. Its ' +
        'dependence on scalp sulfotransferase activity explains why response varies between individuals.',
      '5α-reductase inhibition (finasteride / dutasteride) ↓scalp + serum DHT':
        'Finasteride (type 2-selective) and dutasteride (dual) inhibit 5α-reductase, lowering scalp and serum DHT ' +
        'to halt and partly reverse miniaturization. They treat the upstream cause; benefits regress on stopping, ' +
        'and the sexual side-effect concern reflects systemic DHT reduction.',
      'androgen receptor antagonist (spironolactone) ↓AR signaling in scalp follicle':
        'Spironolactone (and topical antiandrogens) block the androgen receptor directly, reducing DHT signaling ' +
        'in the follicle — used chiefly in women, since it is anti-androgenic/feminizing and unsuitable as ' +
        'systemic therapy in men. It attacks the same AR node from the receptor rather than the synthesis side.',
    },
  },
  {
    slug: 'skin_antimicrobial_antiparasitic',
    notes: {
      'skin / hair / nail bacterial / fungal / parasitic infection topical antimicrobial selection by organism + site':
        'Topical anti-infective choice is driven by organism and site: superficial bacterial, fungal, and ' +
        'parasitic infections each have preferred agents, and penetration differs by tissue (nail and hair are ' +
        'hard to reach). Matching drug class to pathogen and location is the core clinical logic this pathway maps.',
      'mupirocin + isoleucyl-tRNA synthetase bacterial protein synthesis block':
        'Mupirocin inhibits bacterial isoleucyl-tRNA synthetase, blocking incorporation of isoleucine and halting ' +
        'protein synthesis. Its unique target (not shared with systemic antibiotics) and poor systemic absorption ' +
        'make it ideal topically against staphylococci/streptococci, including nasal MRSA decolonization.',
      'clindamycin-topical + 50S ribosomal subunit bacterial protein synthesis block':
        'Topical clindamycin binds the 50S ribosomal subunit to block bacterial protein synthesis — used in acne ' +
        'for activity against Cutibacterium acnes plus an anti-inflammatory effect. It is combined with benzoyl ' +
        'peroxide to curb the resistance that monotherapy readily selects.',
      'azole + CYP51 (lanosterol 14α-demethylase) ergosterol biosynthesis block':
        'Azole antifungals inhibit CYP51 (lanosterol 14α-demethylase), blocking conversion of lanosterol to ' +
        'ergosterol — the fungal-specific membrane sterol. Depleting ergosterol (and accumulating toxic ' +
        'precursors) disrupts the membrane; targeting a fungal sterol pathway is what gives selectivity over ' +
        'human cells.',
      'terbinafine + squalene epoxidase squalene accumulation + ergosterol depletion':
        'Terbinafine inhibits squalene epoxidase, acting earlier in the same ergosterol pathway — both starving ' +
        'the cell of ergosterol and causing toxic squalene accumulation, making it fungicidal. Its keratin ' +
        'affinity and persistence make it first-line for dermatophyte nail and hair infections.',
      'permethrin + voltage-gated Na channel (insect) persistent depolarization → paralysis':
        'Permethrin (a pyrethroid) binds insect voltage-gated sodium channels, holding them open to cause ' +
        'persistent depolarization and paralysis of lice and scabies mites. Selective toxicity comes from ' +
        'insects’ channel sensitivity and humans’ rapid metabolism, giving a wide safety margin.',
      'ivermectin + glutamate-gated Cl channel (parasite) parasite paralysis':
        'Ivermectin activates invertebrate glutamate-gated chloride channels, hyperpolarizing and paralyzing ' +
        'parasites (mites, lice, helminths). These channels are absent in mammals, and the drug is normally ' +
        'excluded from the CNS by P-glycoprotein — the basis of its selective antiparasitic action.',
    },
  },
  {
    slug: 'bile_acid_microbiome_crosstalk',
    notes: {
      'liver hepatocyte primary bile acids (cholic + chenodeoxycholic — Tau/Gly conjugated)':
        'Hepatocytes synthesize the primary bile acids (cholic and chenodeoxycholic acid) from cholesterol and ' +
        'conjugate them to taurine or glycine for solubility before secreting them into bile. This host-made, ' +
        'conjugated pool is the starting material the microbiome then transforms — the first half of a host-microbe ' +
        'metabolic dialogue.',
      'small intestine + bacterial BSH deconjugation → free primary bile acids':
        'In the intestine, bacterial bile-salt hydrolases (BSH) deconjugate bile acids, removing taurine/glycine ' +
        'to yield free primary bile acids. BSH is widespread among gut bacteria (a probiotic-relevant activity); ' +
        'deconjugation is the gateway reaction that enables all further microbial bile-acid modification.',
      'free primary BA + Clostridium XIVa secondary BA (DCA from CA, LCA from CDCA)':
        'Specific gut bacteria (Clostridium cluster XIVa) 7α-dehydroxylate free primary bile acids into secondary ' +
        'bile acids — deoxycholic acid (from cholic) and lithocholic acid (from chenodeoxycholic). Only a few taxa ' +
        'do this, so the secondary-bile-acid pool is a sensitive readout of microbiome composition.',
      'secondary BA (DCA, LCA) TGR5 + FXR activation profile shift':
        'Secondary bile acids have a different receptor-activation profile: DCA and LCA are strong TGR5 agonists ' +
        'and modulate FXR differently than the primary acids. So microbial transformation does not just degrade ' +
        'bile acids — it retunes the signal the host’s FXR/TGR5 receptors receive, shaping metabolism and immunity.',
      'ileal BA + FXR FGF15 / FGF19 release':
        'In the ileum, bile acids activate enterocyte FXR to release the hormone FGF15 (mouse)/FGF19 (human), ' +
        'which feeds back to the liver to repress bile-acid synthesis. Because microbial deconjugation changes ' +
        'which bile acids reach the ileum, the microbiome indirectly tunes this feedback loop.',
      'antibiotic-disrupted microbiota loss of 2° BA → C. difficile germination':
        'Antibiotics that deplete the 7α-dehydroxylating bacteria collapse the secondary-bile-acid pool — and ' +
        'secondary bile acids normally suppress Clostridioides difficile spore germination and outgrowth. Their ' +
        'loss is a key reason antibiotics predispose to C. difficile infection, reversible by microbiota transplant.',
    },
  },
  {
    slug: 'sunscreen_uv_photoprotection',
    notes: {
      'solar UV-B (290–320 nm) epidermal DNA damage (CPD + 6-4PP photoproducts)':
        'UV-B (290-320 nm) is absorbed directly by DNA, generating cyclobutane pyrimidine dimers (CPDs) and 6-4 ' +
        'photoproducts — the mutagenic lesions behind most UV-induced skin cancers. Because UV-B causes direct DNA ' +
        'damage and sunburn, it was historically the main sunscreen target (the basis of the SPF rating).',
      'solar UV-A (320–400 nm) dermal oxidative damage + photoaging + melanoma risk':
        'UV-A (320-400 nm) penetrates deeper into the dermis and acts largely through reactive oxygen species, ' +
        'driving photoaging (collagen breakdown, wrinkling) and contributing to melanoma. Recognizing UV-A’s role ' +
        'drove the shift to “broad-spectrum” sunscreens, since SPF alone mainly reflects UV-B protection.',
      'organic UV filter + UV photon absorption → vibrational relaxation → heat':
        'Organic (chemical) UV filters work by absorption: their conjugated structures absorb UV photons, reach an ' +
        'excited state, and relax by releasing the energy as harmless heat. Each filter covers a specific band, so ' +
        'broad coverage needs several combined — and that absorbed energy is also what can cause photodegradation.',
      'inorganic UV filter (ZnO / TiO₂) reflection + scattering of UV':
        'Inorganic (mineral) filters — zinc oxide and titanium dioxide — act mainly by reflecting and scattering ' +
        'UV (with some absorption), giving broad-spectrum, photostable, low-irritation protection. This physical ' +
        'mechanism is why mineral sunscreens are preferred for sensitive/pediatric skin, at the cost of whitening.',
      'avobenzone + UV-A photon photo-isomerization + degradation':
        'Avobenzone is the main organic UV-A filter but is photo-unstable: UV-A excitation makes it isomerize and ' +
        'degrade, losing protection over time. This is why it must be paired with photostabilizers (e.g. ' +
        'octocrylene) — a key formulation consideration for durable UV-A coverage.',
      'photo-protected skin reduced CPD + reduced melanoma + photoaging risk':
        'Effective photoprotection reduces CPD formation and downstream oxidative damage, lowering the risk of ' +
        'skin cancer (including melanoma) and photoaging. Randomized data confirm regular sunscreen use reduces ' +
        'melanoma and squamous-cell carcinoma — the clinical payoff of blocking the upstream DNA/ROS damage.',
    },
  },
  {
    slug: 'topical_steroid_skin_inflammation',
    notes: {
      'skin barrier dysfunction (filaggrin LOF, scratch-itch cycle) epidermal cytokine release + Th2 polarization':
        'Inflammatory skin disease like atopic dermatitis starts with barrier dysfunction (often filaggrin ' +
        'loss-of-function) that admits allergens/irritants and, with the itch-scratch cycle, triggers keratinocyte ' +
        'alarmins and a Th2-skewed response. Treating barrier and inflammation together is the basis of modern AD ' +
        'management.',
      'topical corticosteroid + GR GR-cytoplasmic → nuclear translocation':
        'Topical corticosteroids bind the cytoplasmic glucocorticoid receptor, which sheds chaperones and enters ' +
        'the nucleus to induce anti-inflammatory genes and (by tethering) repress NF-κB/AP-1-driven inflammatory ' +
        'genes. This broad transcriptional action is why TCS remain first-line, ranked by potency for site and ' +
        'severity.',
      'topical calcineurin inhibitor + FKBP12 calcineurin block → ↓NFAT':
        'Topical calcineurin inhibitors (tacrolimus, pimecrolimus) bind FKBP12; the complex inhibits calcineurin, ' +
        'blocking NFAT dephosphorylation and thus T-cell cytokine transcription. As steroid-sparing agents they ' +
        'avoid skin atrophy — useful on the face and skin folds where TCS side effects are worst.',
      'crisaborole + PDE4 ↑intracellular cAMP':
        'Crisaborole inhibits phosphodiesterase-4 (PDE4), raising intracellular cAMP in immune cells and thereby ' +
        'suppressing pro-inflammatory cytokine production. This non-steroidal mechanism gives a mild ' +
        'anti-inflammatory effect suitable for maintenance in mild-to-moderate atopic dermatitis.',
      'topical JAK inhibitor JAK1/2 block → ↓STAT cytokine signaling':
        'Topical JAK inhibitors (e.g. ruxolitinib) block JAK1/2, cutting STAT-dependent signaling of the type-2 ' +
        'and itch cytokines (IL-4/IL-13, IL-31). They rapidly relieve itch and inflammation — a newer targeted ' +
        'topical option, carrying the class boxed-warning considerations of JAK inhibition.',
      'sustained high-potency TCS skin atrophy + HPA axis suppression':
        'Prolonged high-potency topical steroids cause local skin atrophy, striae, and telangiectasia, and — ' +
        'especially over large or occluded areas — enough systemic absorption to suppress the HPA axis. These ' +
        'dose- and potency-dependent harms are why TCS are matched to site/severity and used with breaks or ' +
        'steroid-sparing agents.',
    },
  },
  {
    slug: 'estrogen_phase2_clearance_phytochemical',
    notes: {
      'estradiol (17β-E2) 2-OH-estradiol':
        'Estradiol is cleared after phase-I hydroxylation; CYP1A1/1A2 favor 2-hydroxylation to 2-OH-estradiol. ' +
        'This 2-hydroxy catechol estrogen is the “benign” branch — readily methylated and excreted — and shifting ' +
        'metabolism toward it is the proposed chemopreventive action of cruciferous phytochemicals (I3C/DIM).',
      'estradiol (17β-E2) 4-OH-estradiol':
        'CYP1B1 instead 4-hydroxylates estradiol to 4-OH-estradiol, the genotoxic branch: 4-OH catechol estrogens ' +
        'can be oxidized to reactive quinones that form depurinating DNA adducts. A higher 4-OH:2-OH ratio is ' +
        'linked to estrogen-driven carcinogenesis — the balance many phytochemical interventions aim to shift.',
      '2-OH-estradiol 2-methoxyestradiol (2-MeO-E2)':
        'Catechol-O-methyltransferase (COMT) methylates 2-OH-estradiol to 2-methoxyestradiol, detoxifying the ' +
        'catechol and yielding a metabolite with its own anti-proliferative/anti-angiogenic activity. Efficient ' +
        'methylation guards against catechol-estrogen genotoxicity — so COMT activity and methyl-donor status ' +
        'influence estrogen safety.',
      'hydroxyestrogens estrogen-glucuronides':
        'Phase-II glucuronidation (UGTs) conjugates hydroxyestrogens to water-soluble glucuronides for excretion ' +
        'in bile and urine. This is a major elimination route for estrogens and their catechol metabolites — and ' +
        'its activity (genetically and dietarily modulated) helps set the systemic estrogen load.',
      'estradiol estradiol-3-sulfate':
        'Estradiol is also sulfated (by SULTs) to estradiol-3-sulfate, an inactive, water-soluble reservoir. ' +
        'Sulfation/desulfation (via steroid sulfatase) provides a dynamic, reversible estrogen storage pool — a ' +
        'balance that is itself a target in hormone-dependent cancer (sulfatase inhibitors).',
      'biliary estrogen-glucuronide reabsorbed free estradiol':
        'Estrogen glucuronides excreted in bile can be deconjugated by gut bacterial β-glucuronidase, releasing ' +
        'free estradiol that is reabsorbed (enterohepatic recirculation). This “estrobolome” activity means the ' +
        'gut microbiome influences systemic estrogen levels — relevant to estrogen-dependent conditions.',
    },
  },
];

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let totalAdded = 0;
for (const { slug, notes } of BATCH) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  let added = 0;
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = notes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(notes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
  console.log(`${slug}: added ${added} step notes`);
  totalAdded += added;
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`batch K total: ${totalAdded} notes`);
