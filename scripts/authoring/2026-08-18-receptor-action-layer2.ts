/**
 * 2026-08-18-receptor-action-layer2.ts
 *
 * PD1b Layer 2 — author `action` on the 81 PHENOTYPIC receptor_occupancy sites
 * that Layer 1 (2026-07-11-receptor-action-backfill.ts) deliberately deferred.
 *
 * Layer 1 could re-type mechanically because the `pathway` word literally named
 * the mode ("agonist", "beta1_blockade", …). These 81 name an EFFECT instead
 * ("analgesia", "sedation", "antiinflammatory"), so the mode has to come from
 * the site's own evidence. Every assignment below is therefore tagged with the
 * tier of evidence backing it:
 *
 *   note     — the site's own authored `note` states the mode in words
 *              ("Agonist.", "GABA-A PAM", "reversibly inhibited human thrombin").
 *   assay    — the note's assay is itself DIRECTIONAL, so the mode is the
 *              readout, not an inference: an IC50 in an enzyme-activity or
 *              ion-current assay is inhibition; a cAMP / [35S]GTPγS / channel-
 *              potentiation EC50 is activation.
 *   textbook — neither of the above (the source is equilibrium BINDING, which
 *              measures affinity and cannot distinguish agonist from
 *              antagonist), but the mode is uncontested pharmacology. Each such
 *              row carries a one-line justification in `why` below.
 *
 * The `textbook` tier follows the precedent set by the MBI perpetrator tag
 * (2026-07-11-mbi-perpetrator-tag.ts): `action`, like `mbi`, is a QUALITATIVE
 * mechanism marker on an already-cited site. It invents no number and no PMID —
 * the site's existing `source_pmid` still anchors the affinity that `action`
 * annotates, so registry:verify is unaffected. Sites whose mode is genuinely
 * contested are left unauthored rather than guessed; direction.ts keeps falling
 * back to the pathway heuristic for those (unchanged behavior).
 *
 * UNLIKE Layer 1 this pass deliberately CHANGES displayed direction: a site
 * tagged "wakefulness" reads 'modulates' today and 'blocks' once caffeine's
 * adenosine antagonism is typed. That correction is the point of PD1b — the
 * pathway heuristic cannot classify a phenotypic tag, so it honestly abstains.
 *
 * Idempotent: only fills sites whose `action` is absent, so a re-run is a no-op
 * and never clobbers a later human edit. Dry-run by default; pass --write.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const CSV_PATH = join(__dirname, '..', 'out', 'receptor-action-layer2.csv');

type Action =
  | 'agonist' | 'partial_agonist' | 'inverse_agonist' | 'antagonist'
  | 'inhibitor' | 'blocker' | 'neutralizer' | 'pam' | 'nam'
  | 'substrate' | 'modulator' | 'unknown';

type Tier = 'note' | 'assay' | 'textbook';

interface Site {
  receptor: string; pathway?: string; emax: number; ec50_mg_l: number;
  hill_n: number; action?: Action; source_pmid?: string; note?: string;
}
interface Compound { slug: string; receptor_occupancy?: Site[]; [k: string]: unknown; }

interface Assignment { action: Action; tier: Tier; why: string }

/** Keyed `${slug}::${receptor}` — exactly the 81 Layer-2 rows. */
const LAYER2: Record<string, Assignment> = {
  // ── COX: IC50 in a cyclooxygenase ACTIVITY assay (whole-blood / monocyte).
  // The readout is enzyme inhibition, so the mode is measured, not inferred.
  'acetaminophen::cox_2': { action: 'inhibitor', tier: 'assay', why: 'COX-2 IC50, human whole-blood activity assay' },
  'celecoxib::cox_2': { action: 'inhibitor', tier: 'assay', why: 'human COX-2 IC50 in the celecoxib discovery paper' },
  'diclofenac::cox_1': { action: 'inhibitor', tier: 'note', why: 'note: "Reversible competitive"' },
  'diclofenac::cox_2': { action: 'inhibitor', tier: 'note', why: 'note: "Reversible"' },
  'etoricoxib::cox_1': { action: 'inhibitor', tier: 'assay', why: 'COX-1 IC50, serum TXB2 generation' },
  'etoricoxib::cox_2': { action: 'inhibitor', tier: 'note', why: 'note: "COX-2-selective reversible"' },
  'ibuprofen::cox_1': { action: 'inhibitor', tier: 'assay', why: 'COX-1 IC50, human monocyte assay' },
  'ibuprofen::cox_2': { action: 'inhibitor', tier: 'assay', why: 'COX-2 IC50, LPS-stimulated assay' },
  'ketoprofen::cox_1': { action: 'inhibitor', tier: 'assay', why: 'COX-1 IC50, human whole-blood assay' },
  'ketoprofen::cox_2': { action: 'inhibitor', tier: 'assay', why: 'COX-2 IC50, human whole-blood assay' },
  'meloxicam::cox_1': { action: 'inhibitor', tier: 'note', why: 'note: "COX-2-preferential; reversible"' },
  'meloxicam::cox_2': { action: 'inhibitor', tier: 'note', why: 'note: "Reversible"' },
  'nabumetone::cox_1': { action: 'inhibitor', tier: 'assay', why: 'COX-1 IC50 of the active 6-MNA, whole-blood assay' },
  'nabumetone::cox_2': { action: 'inhibitor', tier: 'assay', why: 'COX-2 IC50 of the active 6-MNA, whole-blood assay' },
  'naproxen::cox_1': { action: 'inhibitor', tier: 'note', why: 'note: "reversible competitive"' },
  'naproxen::cox_2': { action: 'inhibitor', tier: 'note', why: 'note: "reversible"' },
  'piroxicam::cox_1': { action: 'inhibitor', tier: 'assay', why: 'COX-1 IC50, human whole-blood assay' },
  'piroxicam::cox_2': { action: 'inhibitor', tier: 'assay', why: 'COX-2 IC50, human whole-blood assay' },
  'sulindac::cox_2': { action: 'inhibitor', tier: 'assay', why: 'COX-2 IC50 of sulindac sulfide, whole-blood assay' },

  // ── Other enzyme inhibition — activity assays, same logic as COX.
  'dabigatran::thrombin': { action: 'inhibitor', tier: 'note', why: 'note: "selectively and reversibly inhibited human thrombin"' },
  'digoxin::na_k_atpase': { action: 'inhibitor', tier: 'assay', why: 'IC50 in an NADH-coupled Na/K-ATPase activity assay' },

  // ── Ion-channel current block — IC50 / affinity measured on the current
  // itself under voltage clamp, so blockade is the readout.
  'amiodarone::herg': { action: 'blocker', tier: 'assay', why: 'IC50 on cloned hERG tail current, patch clamp' },
  'lamotrigine::nav': { action: 'blocker', tier: 'assay', why: 'inactivated-state Nav affinity, whole-cell voltage clamp' },
  'ropivacaine::nav': { action: 'blocker', tier: 'assay', why: 'IC50 on Na current, dorsal-horn neurons' },
  'ketamine::nmda': { action: 'blocker', tier: 'note', why: 'note: "[3H]MK-801 displacement at PCP/open-channel site"' },

  // ── GABA-A allosteric potentiation — the EC50 is for POTENTIATION of the
  // GABA response, which is positive allosteric modulation by definition.
  'etomidate::gaba_a': { action: 'pam', tier: 'note', why: 'note: "GABA-A PAM"' },
  'propofol::gaba_a': { action: 'pam', tier: 'note', why: 'note: "Allosteric EC50, not competitive Ki"; GABA potentiation' },
  'isoflurane::gaba_a': { action: 'pam', tier: 'assay', why: 'EC50 for potentiation of the GABA response, HEK a1b2g2L' },
  'sevoflurane::gaba_a': { action: 'pam', tier: 'assay', why: 'EC50 for hippocampal GABA-A potentiation' },
  'thiopental::gaba_a': { action: 'pam', tier: 'assay', why: 'EC50 for GABA potentiation, Xenopus a1b2g2' },

  // ── Functional ACTIVATION assays (cAMP accumulation, G-protein activation,
  // channel current activation) — an EC50 here can only come from an agonist.
  'retatrutide::glp_1r': { action: 'agonist', tier: 'assay', why: 'human GLP-1R cAMP EC50' },
  'retatrutide::gipr': { action: 'agonist', tier: 'assay', why: 'human GIPR cAMP EC50' },
  'retatrutide::gcgr': { action: 'agonist', tier: 'assay', why: 'human GCGR cAMP EC50' },
  'sodium-oxybate::gaba_b': { action: 'agonist', tier: 'assay', why: 'functional EC50, GABA-B/Kir3 current activation' },
  'remifentanil::mu_opioid': { action: 'agonist', tier: 'assay', why: 'functional EC50, guinea-pig ileum; "acted through the mu class"' },
  'tianeptine::mu_opioid': { action: 'agonist', tier: 'note', why: 'note: "an efficacious MOR agonist", G-protein activation EC50' },
  'tianeptine::delta_opioid': { action: 'agonist', tier: 'note', why: 'note: "full delta-opioid receptor (DOR) agonist"' },

  // ── Mode stated outright in the site note.
  'clonazepam::gaba_a_bzd': { action: 'agonist', tier: 'note', why: 'note: "Agonist."' },
  'eszopiclone::gaba_a_bzd': { action: 'agonist', tier: 'note', why: 'note: "Cyclopyrrolone agonist (S-zopiclone)"' },
  'zopiclone::gaba_a_bzd': { action: 'agonist', tier: 'note', why: 'note: "Cyclopyrrolone agonist (racemate)"' },
  'hydrocodone::mu_opioid': { action: 'agonist', tier: 'note', why: 'note: "Clinically a full mu agonist"' },
  's23::androgen_receptor': { action: 'agonist', tier: 'note', why: 'note: "identified as a full agonist in vitro"' },
  'lsd::5-HT2A': { action: 'agonist', tier: 'note', why: 'note: "full agonist per GtoPdb"' },
  'tiotropium::muscarinic': { action: 'antagonist', tier: 'note', why: 'note: "functional antagonist affinity pA2 = 10.4" (Schild)' },
  'scopolamine::muscarinic': { action: 'antagonist', tier: 'note', why: 'cited source is "Antagonism by antimuscarinic ... compounds"' },
  'pregabalin::cav_alpha2delta': { action: 'modulator', tier: 'note', why: 'note: "a2d ligand binding" — not a pore block; modulates trafficking/release' },

  // ── textbook: the cited source is equilibrium BINDING (Ki/Kd), which fixes
  // affinity but not direction. Mode below is uncontested pharmacology and is
  // recorded as a mechanism marker only — no number or PMID is invented.
  'caffeine::adenosine_A1': { action: 'antagonist', tier: 'textbook', why: 'caffeine is the canonical adenosine-receptor antagonist' },
  'caffeine::adenosine_A2A': { action: 'antagonist', tier: 'textbook', why: 'caffeine is the canonical adenosine-receptor antagonist' },
  'morphine::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'prototypical full mu-opioid agonist' },
  'fentanyl::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'full mu-opioid agonist' },
  'alfentanil::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'full mu-opioid agonist (fentanyl congener)' },
  'sufentanil::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'full mu-opioid agonist (fentanyl congener)' },
  'hydromorphone::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'full mu-opioid agonist' },
  'methadone::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'full mu-opioid agonist' },
  'oxycodone::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'full mu-opioid agonist' },
  'tramadol::mu_opioid': { action: 'agonist', tier: 'textbook', why: 'weak mu-opioid agonist (plus monoamine reuptake block elsewhere)' },
  'buprenorphine::mu_opioid': { action: 'partial_agonist', tier: 'textbook', why: 'defining example of a mu partial agonist' },
  '7-hydroxymitragynine::mu_opioid': { action: 'partial_agonist', tier: 'textbook', why: 'partial MOR agonist per the cited Obeng 2021 characterization' },
  'alprazolam::gaba_a_bzd': { action: 'agonist', tier: 'textbook', why: 'benzodiazepine-site agonist' },
  'diazepam::gaba_a_bzd': { action: 'agonist', tier: 'textbook', why: 'benzodiazepine-site agonist' },
  'lorazepam::gaba_a_bzd': { action: 'agonist', tier: 'textbook', why: 'benzodiazepine-site agonist' },
  'midazolam::gaba_a_bzd': { action: 'agonist', tier: 'textbook', why: 'benzodiazepine-site agonist' },
  'triazolam::gaba_a_bzd': { action: 'agonist', tier: 'textbook', why: 'benzodiazepine-site agonist' },
  'zolpidem::gaba_a_bzd': { action: 'agonist', tier: 'textbook', why: 'a1-preferring benzodiazepine-site agonist (Z-drug)' },
  'zaleplon::gaba_a_bzd': { action: 'agonist', tier: 'textbook', why: 'a1-preferring benzodiazepine-site agonist (Z-drug)' },
  'atropine::muscarinic': { action: 'antagonist', tier: 'textbook', why: 'prototypical muscarinic antagonist' },
  'oxybutynin::muscarinic': { action: 'antagonist', tier: 'textbook', why: 'antimuscarinic; the cited source calls it a reference antagonist' },
  'tolterodine::muscarinic': { action: 'antagonist', tier: 'textbook', why: 'antimuscarinic bladder agent' },
  'clonidine::alpha_2a': { action: 'agonist', tier: 'textbook', why: 'prototypical a2-adrenergic agonist' },
  'dexmedetomidine::alpha_2a': { action: 'agonist', tier: 'textbook', why: 'selective a2-adrenergic agonist' },
  'terazosin::alpha_1': { action: 'antagonist', tier: 'textbook', why: 'a1-adrenergic antagonist (alpha-blocker)' },
  'melatonin::mt1': { action: 'agonist', tier: 'textbook', why: 'endogenous agonist of its own receptor' },
  'melatonin::mt2': { action: 'agonist', tier: 'textbook', why: 'endogenous agonist of its own receptor' },
  'tasimelteon::mt1': { action: 'agonist', tier: 'textbook', why: 'melatonin-receptor agonist (its approved drug class)' },
  'tasimelteon::mt2': { action: 'agonist', tier: 'textbook', why: 'melatonin-receptor agonist (its approved drug class)' },
  'glycine::glycine_receptor_alpha1': { action: 'agonist', tier: 'textbook', why: 'endogenous agonist of its own receptor' },
  'taurine::glycine_receptor': { action: 'agonist', tier: 'textbook', why: 'glycine-receptor agonist' },
  'citalopram::SERT': { action: 'inhibitor', tier: 'textbook', why: 'SSRI = selective serotonin REUPTAKE INHIBITOR (named in the note)' },
  'modafinil::dat': { action: 'inhibitor', tier: 'textbook', why: 'atypical dopamine reuptake inhibitor at DAT' },
  'psilocin::5-HT2A': { action: 'agonist', tier: 'textbook', why: '5-HT2A agonist (the psychedelic mechanism)' },
  'trenbolone::androgen_receptor': { action: 'agonist', tier: 'textbook', why: 'anabolic steroid — androgen-receptor agonist' },
};

const csvCell = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

function main(): void {
  const write = process.argv.includes('--write');
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  let filled = 0, already = 0, stillDeferred = 0;
  const byAction: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  const seen = new Set<string>();
  const csv: string[] = ['slug,receptor,pathway,assigned_action,tier,evidence,source_pmid,applied'];
  const deferredRows: string[] = [];

  for (const c of data) {
    const ro = c.receptor_occupancy;
    if (!Array.isArray(ro)) continue;
    for (const s of ro) {
      const key = `${c.slug}::${s.receptor}`;
      const a = LAYER2[key];
      if (!a) continue;
      seen.add(key);

      // Every table row lands in the CSV whether or not THIS run filled it —
      // the file is the standing audit trail for the pass, so an idempotent
      // re-run must reproduce it rather than truncate it to a bare header.
      const pre = s.action != null;
      if (pre) {
        already++;
      } else {
        if (write) s.action = a.action;
        filled++;
        byAction[a.action] = (byAction[a.action] || 0) + 1;
        byTier[a.tier] = (byTier[a.tier] || 0) + 1;
      }
      csv.push([
        c.slug, s.receptor, s.pathway ?? '', a.action, a.tier, a.why, s.source_pmid ?? '',
        pre ? 'preexisting' : (write ? 'written' : 'dry-run'),
      ].map(csvCell).join(','));
    }
  }

  // Any site still without an action after this pass stays on the pathway
  // heuristic — surfaced so the remaining tail is never silently invisible.
  for (const c of data) {
    for (const s of c.receptor_occupancy ?? []) {
      if (s.action == null && !LAYER2[`${c.slug}::${s.receptor}`]) {
        stillDeferred++;
        deferredRows.push(`${c.slug} @ ${s.receptor} [${s.pathway ?? ''}]`);
      }
    }
  }

  const unmatched = Object.keys(LAYER2).filter(k => !seen.has(k));

  writeFileSync(CSV_PATH, csv.join('\n') + '\n');
  console.log(`Layer 2 table entries:   ${Object.keys(LAYER2).length}`);
  console.log(`  filled (action authored): ${filled}`);
  console.log(`  already had action:       ${already}`);
  console.log('  actions:', JSON.stringify(byAction));
  console.log('  evidence tiers:', JSON.stringify(byTier));
  console.log(`sites still unauthored (pathway heuristic): ${stillDeferred}`);
  for (const d of deferredRows) console.log(`    - ${d}`);
  if (unmatched.length > 0) {
    console.error(`\nERROR: ${unmatched.length} table entries matched no site (stale key?):`);
    for (const k of unmatched) console.error(`    - ${k}`);
    process.exitCode = 1;
    return;
  }
  console.log(`review CSV → ${CSV_PATH}`);

  if (!write) {
    console.log('\nDRY-RUN — pass --write to apply `action` to compounds.json.');
    return;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWROTE ${filled} action values to compounds.json.`);
}

main();
