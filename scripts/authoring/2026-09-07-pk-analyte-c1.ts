/**
 * 2026-09-07-pk-analyte-c1.ts
 *
 * Batch C1: declares `pk_analyte` on the records that convert to an active
 * species, replacing a prose-sniffing lint rule with a checkable field claim.
 *
 * For a compound that converts, "the half-life" is not a well-formed quantity
 * until the analyte is named. The audit passes kept finding records where the
 * candidates differ by an order of magnitude — sofosbuvir stored the half-life
 * of an INACTIVE metabolite carrying >90% of systemic exposure while its active
 * species never enters plasma; risperidone stored the parent's bioavailability
 * beside the active moiety's half-life, which is neither of the two rows its own
 * abstract offers.
 *
 * ── THIS PASS IS MOSTLY BOOKKEEPING, AND DELIBERATELY SO ───────────────
 * Almost every value here was already established by an earlier batch and
 * written into the record's own notes — "PK models PREDNISOLONE, the active
 * species", "WRONG ANALYTE, CONFIRMED BY MASS ... every measured value describes
 * MYCOPHENOLIC ACID at 320.34". What was missing was a FIELD saying so, which is
 * why the previous rule had to sniff prose and got it wrong in both directions:
 * it passed records that merely used the word "analyte" and failed ones that
 * said the same thing in other words.
 *
 * Five entries are the rule MIS-FIRING on compounds that are not prodrugs at
 * all — captopril's own mechanism text says "active drug, no prodrug" — and
 * declaring `parent` on those is the fix.
 *
 * Nine harder records are held back for verification rather than inferred here:
 * enalapril, fosinopril, oseltamivir, tenofovir-disoproxil, sacubitril,
 * lisdexamfetamine, tazarotene, molnupiravir and lovastatin. Each shows the same
 * tell — a parent-ester molecular weight beside an active-diacid half-life — and
 * that is a CHIMERA worth confirming against the literature rather than asserting
 * from arithmetic.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

type Analyte = 'parent' | 'active-metabolite' | 'active-moiety' | 'total-drug-related';
interface Compound { slug: string; pk_analyte?: Analyte; pk_analyte_name?: string; mw_g_mol?: number; [k: string]: unknown }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };

const ANALYTE: { slug: string; a: Analyte; name?: string; why: string }[] = [
  // ── Already established by an earlier batch and stated in the record's notes ──
  { slug: 'mycophenolate', a: 'active-metabolite', name: 'mycophenolic acid',
    why: 'its own note: "WRONG ANALYTE, CONFIRMED BY MASS. The stored molecular weight of 433.5 is mycophenolate MOFETIL, the prodrug ester, while every measured value describes MYCOPHENOLIC ACID at 320.34"' },
  { slug: 'nabumetone', a: 'active-metabolite', name: '6-methoxy-2-naphthylacetic acid (6-MNA)',
    why: 'its own note: "PK models 6-MNA, the circulating active metabolite (nabumetone is a prodrug)" — the parent is undetectable in plasma' },
  { slug: 'prednisone', a: 'active-metabolite', name: 'prednisolone',
    why: 'its own note: "PK models PREDNISOLONE, the active species (prednisone is a prodrug)"' },
  { slug: 'simvastatin', a: 'active-metabolite', name: 'simvastatin acid',
    why: 'its own note: "PK models SIMVASTATIN ACID, the active species — the parent is an inactive lactone prodrug, and its own citation says so"' },
  { slug: 'valacyclovir', a: 'active-metabolite', name: 'acyclovir',
    why: 'its own note calls the record a "WRONG-ANALYTE HYBRID": the stored bioavailability is "the yield of ACYCLOVIR per mole of valaciclovir swallowed, not valaciclovir absorption"' },
  { slug: 'valganciclovir', a: 'active-metabolite', name: 'ganciclovir',
    why: 'its own note: the stored bioavailability "measures ganciclovir appearing in plasma after oral valganciclovir, not the prodrug itself", and the two molecular weights differ by 1.39x' },
  { slug: 'famciclovir', a: 'active-metabolite', name: 'penciclovir',
    why: 'an earlier batch found its stored values describe penciclovir, the species famciclovir converts to; penciclovir is still not a slug in this registry' },
  { slug: 'sulindac', a: 'active-metabolite', name: 'sulindac sulfide',
    why: 'its own note: "THE CLEANEST CHIMERA IN THE AUDIT — ONE NUMBER, ONE SENTENCE, ENTERED TWICE. The cited abstract contains exactly one half-life and it is explicitly the METABOLITE"' },
  { slug: 'spironolactone', a: 'parent',
    why: 'its own note: "PK models the PARENT, which is a prodrug, and that is the record limitation rather than a citation defect" — declared so the limitation is legible in a field, not only in prose. The parent carries roughly 3% of active exposure' },

  // ── The rule mis-firing: these do not convert to an active species at all ──
  { slug: 'captopril', a: 'parent',
    why: 'NOT A PRODRUG — its own mechanism text says so outright: "active drug, no prodrug". The rule fired on surrounding conversion prose' },
  { slug: 'ticagrelor', a: 'parent',
    why: 'NOT A PRODRUG — its mechanism says "direct-acting (not a prodrug) so onset within ~30 min independent of CYP2C19 phenotype". It does have an active metabolite, but parent and metabolite bind P2Y12 identically and are both above 99.8% bound' },
  { slug: 'ampicillin', a: 'parent',
    why: 'ampicillin itself is the active antibiotic; the prodrugs in this family are pivampicillin and bacampicillin, which are separate molecules. mw 349.41 is ampicillin' },
  { slug: 'clindamycin', a: 'parent',
    why: 'clindamycin is the active lincosamide; its palmitate and phosphate esters are the prodrug formulations and are different molecules' },
  { slug: 'erythromycin', a: 'parent',
    why: 'erythromycin base is active; the estolate, stearate and ethylsuccinate are prodrug salts and esters, not this molecule' },

  // ── The record names the ACTIVE species, and its mass confirms it ──
  { slug: 'candesartan', a: 'parent',
    why: 'this record names the active acid (mw 440.45), not the cilexetil ester (610.66) that is dosed. Its own citation establishes that "Candesartan cilexetil is the prodrug of candesartan ... Absorbed candesartan cilexetil is completely metabolised to candesartan"' },
  { slug: 'olmesartan', a: 'parent',
    why: 'this record names the active acid (mw 446.5), not the medoxomil ester (558.6) that is dosed; the label binding figure used for its fraction_unbound is likewise for the acid' },
  { slug: 'dabigatran', a: 'parent',
    why: 'this record names the active species (mw 471.51), not dabigatran ETEXILATE (627.73) which is dosed. A previous batch logged the resulting dose-basis error explicitly: a 150 mg dose of the etexilate converts to moles 1.331x too high against this mass' },
  { slug: 'ganciclovir', a: 'parent',
    why: 'ganciclovir is the circulating active species; valganciclovir is the separate prodrug record. mw 255.23 and the 3.6 h half-life are both ganciclovir' },
  { slug: 'cefuroxime', a: 'parent',
    why: 'this record names cefuroxime (mw 424.39), not the axetil ester (510.5) used for the oral route' },
  { slug: 'isoniazid', a: 'parent',
    why: 'activation is INTRACELLULAR AND BACTERIAL — mycobacterial KatG forms the nicotinoyl-NAD adduct inside the organism — so no human plasma species other than isoniazid itself exists to model' },
  { slug: 'pyrazinamide', a: 'parent',
    why: 'same shape as isoniazid: activated by mycobacterial pyrazinamidase inside the organism, so the plasma analyte is necessarily the parent. Its 9.6 h is the value its own citation prints' },
  { slug: 'levodopa', a: 'parent',
    why: 'decarboxylation to dopamine happens in tissue, and dopamine does not cross the blood-brain barrier — the plasma species is levodopa (mw 197.19). Peripheral conversion is what carbidopa is co-dosed to block' },
  { slug: 'azathioprine', a: 'parent',
    why: 'mw 277.26 and the 0.83 h half-life are azathioprine own; 6-mercaptopurine is a separate species and the acting thioguanine nucleotides are intracellular' },
  { slug: 'psilocin', a: 'parent',
    why: 'this record IS the active metabolite of the separate psilocybin entry, and its stored 1.8 h is psilocin own measured half-life — so relative to this record the analyte is the parent' },

  // ── Parent, with mass and half-life agreeing ──
  { slug: 'codeine', a: 'parent',
    why: 'mw 299.36 and the 3 h half-life are codeine own; morphine is formed at roughly a tenth of the dose and is a separate record' },
  { slug: 'hydrocodone', a: 'parent',
    why: 'AND OUR OWN MECHANISM PROSE WAS WRONG ABOUT THIS. It called hydrocodone a prodrug; a controlled crossover found "EMs and PMs were equally responsive to oral hydrocodone, and quinidine had no consistent effect on their responses", concluding "only a small role of hydromorphone". The parent is an active mu agonist in its own right' },
  { slug: 'heroin', a: 'parent',
    why: 'its 0.05 h intravenous half-life is diacetylmorphine own — famously minutes — while its own note already defers the pharmacology: "mu-opioid occupancy belongs to morphine/6-MAM"' },
  { slug: 'nitroglycerin', a: 'parent',
    why: 'the 0.04 h half-life is nitroglycerin own; activation releases nitric oxide INTRACELLULARLY via mitochondrial ALDH-2, so there is no circulating active metabolite to model' },
  { slug: 'remdesivir', a: 'parent',
    why: 'the 1 h intravenous half-life is remdesivir own; its metabolite GS-441524 is far longer-lived and the acting triphosphate is intracellular. Flagged as a partial view rather than a wrong one' },
  { slug: 'temsirolimus', a: 'parent',
    why: 'the 17.3 h half-life is temsirolimus own; sirolimus, which it converts to, is several times longer-lived, so the stored value is not the metabolite' },
  { slug: 'cyclophosphamide', a: 'parent',
    why: 'mw 261.09 and the 6.4 h half-life are cyclophosphamide own; phosphoramide mustard is formed and acts intracellularly' },
  { slug: 'bempedoic-acid', a: 'parent',
    why: 'mw 344.49 is bempedoic acid, and activation by ACSVL1 to the CoA thioester happens INSIDE THE LIVER — which is the drug design point, since the enzyme is absent from skeletal muscle' },
  { slug: 'benfotiamine', a: 'parent',
    why: 'mw 466.46 is benfotiamine. Flagged as a limitation rather than a defect: the therapeutic species is thiamine, and a separate thiamine record exists' },
  { slug: 'sulfasalazine', a: 'parent',
    why: 'mw 398.39 is sulfasalazine. Cleavage to 5-ASA and sulfapyridine is performed by COLONIC BACTERIA, which is the drug delivery mechanism — the plasma parent curve is the right thing for the systemic record' },
  { slug: 'quinapril', a: 'parent',
    why: 'its own citation, quoted in the record note, is explicit about the analyte: "The half-life of quinapril (1.2 h)" and "the volume of distribution (Vd/F) of quinapril"' },
  { slug: 'ramipril', a: 'parent',
    why: 'an earlier batch found the stored 14 h was the DIACID and corrected it to the parent ester value; its own note records the mass check, "The stored molecular weight of 416.51 is the ETHYL ESTER; the active diacid ramiprilat is 388.46"' },
  { slug: 'trandolapril', a: 'parent',
    why: 'an earlier batch found "A THIRTY-THREE-FOLD ERROR WITH THE CORRECT NUMBER SITTING IN THE RECORD OWN CITATION" — the stored 24 h was the active diacid accumulation half-life, and it was corrected to the parent value the cited paper prints' },
];

for (const e of ANALYTE) {
  const c = need(e.slug);
  if (c.pk_analyte != null) { log.push(`${e.slug} — already declared, skipped`); continue; }
  c.pk_analyte = e.a;
  if (e.name) c.pk_analyte_name = e.name;
  log.push(`${e.slug} — ${e.a}${e.name ? ` (${e.name})` : ''}: ${e.why}`);
}

console.log(` ${ANALYTE.length} records declared:\n`);
for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
