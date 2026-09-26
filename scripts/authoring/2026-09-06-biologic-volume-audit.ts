/**
 * 2026-09-06-biologic-volume-audit.ts
 *
 * Audits the six records the peptide pass left open: the five monoclonal-
 * antibody rows carrying `V_L: 7` and enoxaparin. Three agents read every cited
 * abstract, plus the approval documents where no PubMed primary exists.
 *
 * ── What the audit settled about the two suspected defaults ───────────────
 * The 648 h HALF-LIFE SURVIVED. Atezolizumab and galcanezumab both state 27
 * days verbatim, in the cited paper and in the approval document. Three records
 * agreeing to the hour looked like a template and was one, but it landed on the
 * published number. Secukinumab's 648 h is different — see below.
 *
 * The 7 L VOLUME FAILED, in four different ways, which is the useful part:
 *   • atezolizumab   6.91 L, a true STEADY-STATE volume (IV drug)
 *   • galcanezumab   7.33 L, an APPARENT V/F (subcutaneous, no IV arm exists)
 *   • guselkumab     13.5 L in the cited paper, also apparent — nearly double
 *   • etanercept     the cited review states no volume at all
 *   • secukinumab    the cited paper states no volume at all
 *   • enoxaparin     7.0 L verbatim, but an anti-Xa ACTIVITY volume
 * One default cannot be correct for six records when the underlying quantities
 * are a steady-state volume, an apparent volume, a central volume and an
 * activity-basis volume. Where it landed close, it landed close by accident.
 *
 * ── A defect class worth naming: real-PMID, zero-content ──────────────────
 * Secukinumab's citation is a genuine, correctly attributed paper about
 * secukinumab — and its abstract contains no numeric pharmacokinetics at all.
 * Three values hung off it. A PMID-existence check passes this; only reading
 * the abstract catches it. `registry:verify` resolves identifiers, so this
 * class is invisible to the gate by construction.
 *
 * ── Where a label is the only source ──────────────────────────────────────
 * No PubMed abstract states a numeric secukinumab half-life: field-restricted
 * sweeps of the whole database return four records, none with a number. The
 * 648 h traces to the European summary of product characteristics, "27 days".
 * That is legitimate provenance under this registry's rules, and is recorded as
 * such rather than left pointing at a paper that never said it.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound {
  slug: string;
  mw_g_mol?: number;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  effect_compartment?: unknown;
  refs?: string[];
  notes?: string;
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t)) c.notes = c.notes ? `${c.notes} ${t}` : t; };

interface Fix { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; mw?: number; refs?: string[]; note: string; summary: string }

const FIXES: Fix[] = [
  { slug: 'atezolizumab', guard: (c) => c.pk?.IV?.V_L === 7,
    pk: { IV: { V_L: 6.91, F: 1, source_pmid: 'PMID:27981577' } }, hl: { IV: 648 }, mw: 145000,
    refs: ['PMID:31753029', 'PMID:33904970'],
    note: 'PK: Stroh 2017 (PMID:27981577), population analysis in 906 patients with metastatic urothelial carcinoma, verbatim "the clearance, volume of distribution, and terminal half-life estimates from population pharmacokinetic (PopPK) analysis of 0.200 L/day, 6.91 L, and 27 days". The 27-day half-life stands as stored; the volume was 7 L, a registry-wide default, and is corrected to the paper\'s own figure. That 6.91 L is a STEADY-STATE volume — the central volume is roughly half it at 3.01 L (PMID:31753029) — so a one-compartment curve pairing Vss with a terminal half-life is a known approximation. mw corrected from the generic 148000 to 145000: the approval document states "a calculated molecular mass of 145 kDa", lighter than a typical IgG1 because this antibody is non-glycosylated. CAVEATS: clearance falls up to 22% over treatment (PMID:33904970), so a fixed half-life averages over time; disposition is nonlinear in CYNOMOLGUS MONKEY and MOUSE (PMID:26918260) but linear in humans at clinical doses.',
    summary: 'atezolizumab — V 7->6.91 L (Vss); mw 148k->145k; half-life confirmed verbatim' },

  { slug: 'galcanezumab', guard: (c) => c.pk?.SC?.V_L === 7,
    pk: { SC: { V_L: 7.33, F: 1, source_pmid: 'PMID:31482569' } }, hl: { SC: 648 }, mw: 147000,
    refs: ['PMID:33740315'],
    note: 'PK: Kielbasa 2020 (PMID:31482569), population analysis pooling seven studies of healthy individuals and migraine patients, verbatim "the apparent volume of distribution was 7.33 L (34% IIV)" and "half-life was 27 days", from a one-compartment model with linear elimination. The half-life stands as stored. F is pinned to 1 BECAUSE that volume is APPARENT (V/F) and already contains bioavailability. The stored F of 0.59 is deleted outright: it appears nowhere — not in the cited paper, not in the approval document, not in the literature — and every published galcanezumab parameter is apparent precisely because no study has ever included an IV arm, which is also why an absolute F cannot exist for it. Pairing that invented number with an apparent volume understated exposure by roughly 40%. mw corrected from the generic 148000 to 147000; note this is an IgG4, so a generic IgG1 mass was wrong on isotype as well as on number. An independent first-in-human estimate puts V/F at 11.2 L (PMID:33740315); not averaged.',
    summary: 'galcanezumab — V 7->7.33 L apparent, F pinned; unsourced F 0.59 deleted; mw->147k' },

  { slug: 'etanercept', guard: (c) => c.pk?.SC?.V_L === 7,
    pk: { SC: { V_L: 5.97, F: 0.626, source_pmid: 'PMID:15496641' } }, hl: { SC: 68 },
    refs: ['PMID:15496641', 'PMID:10676822'],
    note: 'NOT an IgG monoclonal antibody — a dimeric p75 TNF-receptor Fc FUSION protein, and its kinetics differ from the antibody class accordingly: a half-life of about three days against two to four weeks for true antibodies, so no class default should ever be applied to it. mw 150000 is correct and label-supported ("934 amino acids ... apparent molecular weight of approximately 150 kilodaltons") and is deliberately left alone rather than harmonised to the generic 148000. PK: Zhou 2004 (PMID:15496641), a two-compartment population fit over 53 healthy subjects and 212 patients whose pooled data INCLUDE IV dosing, verbatim "volume of distribution in the central compartment (V(c): 5.97 +/- 0.45 L)" and "absolute bioavailability for subcutaneous administration (F: 0.626 +/- 0.056)" — taken together so volume and bioavailability come from one coherent fit. Half-life 68 h from Korth-Bradley 2000 (PMID:10676822), 26 healthy volunteers, 25 mg SC, verbatim "the half-life was 68 +/- 19 hours"; that is a one-compartment subcutaneous fit and so is partly absorption-limited. The stored 70 h was the floor of the cited review\'s "70 to 100 hours" range stored as a point, and the stored V of 7 L appears nowhere in that review, which states no volume at all. NOTE the 5.97 L is a CENTRAL volume, so a one-compartment curve built on it understates exposure duration.',
    summary: 'etanercept — V 7 L (uncited) -> 5.97 L central + F 0.626, one coherent fit; half-life 70->68 h' },

  { slug: 'guselkumab', guard: (c) => c.pk?.SC?.V_L === 7,
    pk: { SC: { V_L: 3.6, F: 0.492, source_pmid: 'PMID:35470450' }, IV: { V_L: 3.6, F: 1, source_pmid: 'PMID:35470450' } },
    hl: { SC: 350.4, IV: 350.4 }, mw: 147000,
    refs: ['PMID:35470450', 'PMID:27515978'],
    note: 'PK: Tran 2022 (PMID:35470450), a two-compartment population fit over 23,097 samples from 2623 healthy subjects and patients across nine phase 1-3 trials, verbatim "Clearance (CL), central and peripheral volume of distribution, intercompartmental flow, absorption rate constant and absolute bioavailability estimates were 0.255 L/d, 3.60 L, 1.78 L, 0.369 L/d, 0.313 d-1 and 49.2%, respectively, for a subject weighing 70 kg" and "Terminal half-life was estimated to be approximately 14.6 days" (350.4 h). Every value now comes from that one fit. The previous citation (PMID:29341192) states 18.1 days rather than the stored 17 days, gives an APPARENT volume of 13.5 L rather than 7 L, and — decisively — is a pool of three SUBCUTANEOUS-ONLY psoriasis trials, so the entire IV row had been sourced to a paper containing no IV data. The stored F of 0.49 was the right number attached to a model in which bioavailability is not even estimable. mw corrected from the generic 148000 to 147000 per the approval document. The absolute bioavailability is anchored by the first-in-human study\'s IV arm (PMID:27515978, 0.03-10 mg/kg IV in 47 healthy subjects). NOTE 3.60 L is a CENTRAL volume.',
    summary: 'guselkumab — whole record onto one 2-compartment fit; IV row no longer cites an SC-only study' },

  { slug: 'secukinumab', guard: (c) => c.pk?.SC?.V_L === 7,
    pk: { SC: { V_L: 3.61, F: 0.73, source_pmid: 'PMID:28273356' } }, hl: { SC: 648 }, mw: 151000,
    refs: ['PMID:28273356'],
    note: 'PK: volume and bioavailability from Bruin 2017 (PMID:28273356), a two-compartment population fit in moderate-to-severe plaque psoriasis, verbatim "central compartment volume, 3.61 L with IIV of 30% CV" and "The bioavailability of secukinumab after subcutaneous dosing was approximately 73%". The previous citation (PMID:25648267) is a genuine, correctly attributed paper about secukinumab whose abstract contains NO numeric pharmacokinetics whatsoever, yet carried all three stored values — a real-identifier, zero-content miscitation that a PMID-resolution gate cannot catch. HALF-LIFE PROVENANCE: the 648 h is retained but is LABEL-DERIVED, from the European summary of product characteristics, "The mean elimination half-life, as estimated from population pharmacokinetic analysis, was 27 days in plaque psoriasis patients"; no PubMed abstract states a numeric secukinumab half-life at all, which field-restricted sweeps of the whole database confirm. mw corrected from the generic 148000 to 151000 per the approval document. The stored 7 L is near the label\'s terminal-phase volume of 7.10-8.60 L, but that is a Vz rather than the central volume a model pairing a separate F needs, and it sits below even the stated floor. NOTE 3.61 L is a CENTRAL volume.',
    summary: 'secukinumab — V/F re-sourced to a real PK fit; half-life kept but marked label-derived; mw->151k' },
];

for (const f of FIXES) {
  const c = need(f.slug);
  if (!f.guard(c)) { log.push(`${f.slug} — already re-sourced, skipped`); continue; }
  c.pk = f.pk;
  c.half_life_hr = f.hl;
  if (f.mw) c.mw_g_mol = f.mw;
  if (f.refs) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary);
}

// ── enoxaparin: the record whose 7 L is real and whose curve still is not ──
{
  const c = need('enoxaparin');
  if (!c.pk_unauthored) {
    const n = 'A polydisperse mixture of polysaccharide chains, measured as anti-factor-Xa ACTIVITY rather than concentration, so a mass-based curve models a quantity that was never measured. Its own two activity markers decay at different rates from one injection — anti-Xa about 4 h against anti-IIa about 2 h (PMID:2851016), and 275 against 40 min after IV (PMID:1963020). Clearance also falls 27-44% with renal impairment (PMID:15961985). The stored 7 L was verbatim but is an activity-basis apparent volume.';
    if (n.length > 500) throw new Error(`enoxaparin note ${n.length} > 500`);
    delete c.pk;
    c.half_life_hr = {};
    c.pk_unauthored = { reason: 'mixture', note: n };
    addRefs(c, 'PMID:1963020', 'PMID:15961985', 'PMID:12968985');
    note(c, 'mw_g_mol is deliberately LEFT EMPTY. The mean molecular weight is about 4500 Da (PMID:28635885), a real and often-quoted figure, but a third of the mass lies outside 2000-8000 Da and the chains clear at different rates, so filling the field would license mole-based arithmetic that has no physical meaning for a chain distribution. Note also that enoxaparin is dosed both in milligrams and in anti-Xa international units at roughly 100 IU per mg, a conversion this record never carried. If it is ever modelled again it should be as an anti-Xa activity record with explicit units, an explicit population and a renal-function caveat — the best-identified human estimate being 5.24 L and 5.0 h from data that included an IV bolus (PMID:12968985).');
    log.push('enoxaparin — pk stripped, marked mixture (anti-Xa activity basis, not concentration)');
  } else log.push('enoxaparin — already pk_unauthored, skipped');
}

// ── float hygiene: 0.08 L/kg x 70 came out of binary floating point ────────
let floats = 0;
for (const c of data) {
  for (const pk of Object.values(c.pk ?? {})) {
    if (!pk) continue;
    const v = pk.V_L as number | undefined;
    if (typeof v === 'number' && String(v).length > 8) { pk.V_L = Number(v.toFixed(4)); floats++; }
  }
}
if (floats) log.push(`rounded ${floats} floating-point volume artefacts (e.g. 5.6000000000000005 -> 5.6)`);

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
