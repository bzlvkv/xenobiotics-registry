/**
 * lint.ts — the registry's semantic checks, as a pure function.
 *
 * These rules are the point of the project: the checks that catch data which is
 * valid JSON, passes the loader, and is still wrong — a retired slug shadowing a
 * live compound, two records claiming one molecule, a keo whose own note admits
 * it was estimated, a rat half-life with no `source_species`, a clinical
 * fold-change wearing the field name of a measured affinity.
 *
 * Every rule here exists because a defect got through. The comments record WHICH
 * defect, and several record a correction to the rule itself — a rule that
 * over-claims is worse than no rule, because an author learns to discount it.
 * Read the comment before changing the code.
 *
 * NO ZOD, AND NOTHING THAT PULLS IT IN. Structural validation is the loader's
 * job and runs first; this file is the semantic layer and must stay small enough
 * to ship to a browser, so a curator sees the same findings a gate does. The old
 * `compound.schema` rule re-parsed every record through the zod schema from here,
 * which is what made that impossible.
 *
 * Errors must not ship. Warnings are for a curator to look at, and several are
 * STANDING CAVEATS rather than task lists — where that is true, the rule's
 * comment says so explicitly.
 */

import { PK_DEFAULTS } from './exposure';
import { impliedOccupancies } from './occupancy';
import { SYSTEM_IDS } from './types';
import type { Compound, Registry, RoutePk } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Receptor key canonicalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical receptor-key map for `receptor_occupancy[].receptor`.
 *
 * The key is free text, so the same receptor accreted multiple spellings as
 * authoring sessions added rows. Anything that groups occupancy by EXACT key —
 * a composite occupancy curve, a per-target page, this file's duplicate check —
 * renders `mu_opioid` and `MOR` as two separate receptors that never combine.
 * This map collapses each known alias onto one key.
 *
 * Two kinds of entries:
 *   - spelling / case dups of the SAME receptor (sert→SERT, β1-AR→beta_1)
 *   - semantic merges where a generic key was used for a specific receptor
 *     (nicotinic_ach→nachr_muscle: the only nicotinic_ach rows are the
 *     neuromuscular blockers, which act at the MUSCLE-type nAChR — leaving
 *     `nicotinic_ach` free for future neuronal-nAChR authoring)
 *
 * Distinct receptors that merely look similar are deliberately NOT here:
 *   gaba_a (anesthetic site) vs gaba_a_bzd (benzodiazepine site);
 *   nav (neuronal VGSC) vs nav1_5 (cardiac isoform);
 *   glycine_receptor vs glycine_receptor_alpha1.
 */
export const RECEPTOR_ALIASES: Readonly<Record<string, string>> = {
  MOR: 'mu_opioid',
  KOR: 'kappa_opioid',
  sert: 'SERT',
  'β1-AR': 'beta_1',
  beta1_adrenergic: 'beta_1',
  nicotinic_ach: 'nachr_muscle',
};

/**
 * A note that ANNOUNCES a quotation: "verbatim:", "abstract states:".
 *
 * The colon is the whole of it. "0.83 and 0.96 h are both verbatim and stand" is
 * an assertion ABOUT values and offers no sentence; "Shahid 2009 verbatim: …"
 * promises one. 172 notes use the word, and only the announcing form can be held
 * to producing a quotation.
 */
const ANNOUNCES_QUOTE = /\b(?:verbatim|abstract (?:states|reads))\s*:/gi;

/** Any opening quotation mark, straight or curly, single or double. */
const OPENS_QUOTE = /["\u201c']/;

/**
 * Every announced quotation in a note that is not followed by one.
 *
 * SEGMENTED BY ANNOUNCEMENT, NOT BY CLAUSE, and that is not a detail. A good note
 * announces twice — once for the stored value and once for what it replaced — and
 * a quotation may contain a full stop, so any clause-based split cuts a true
 * quotation in half and reports the half without the marks. That mistake was made
 * while writing this rule: it reported 109 notes, of which about a hundred were
 * quoting perfectly well across a sentence boundary. Each announcement therefore
 * owns the text up to the next one, or to the end.
 */
function unquotedAnnouncements(note: string): string[] {
  const at = [...note.matchAll(ANNOUNCES_QUOTE)].map((m) => m.index! + m[0].length);
  const out: string[] = [];
  for (let i = 0; i < at.length; i++) {
    const seg = note.slice(at[i]!, i + 1 < at.length ? at[i + 1]! : note.length);
    if (!OPENS_QUOTE.test(seg)) out.push(seg.trim());
  }
  return out;
}

/** The note-ish fields a record may carry, in the order a reader meets them. */
const NOTE_FIELDS = ['note', 'notes', 'fu_note', 'dose_moiety_note'] as const;

/** Walk a record for announced-but-missing quotations, reporting each field path. */
function announcedQuoteGaps(node: unknown, path: string, out: string[]): void {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => announcedQuoteGaps(v, `${path}[${i}]`, out));
    return;
  }
  const rec = node as Record<string, unknown>;
  for (const key of NOTE_FIELDS) {
    const text = rec[key];
    if (typeof text !== 'string') continue;
    if (unquotedAnnouncements(text).length > 0) out.push(path ? `${path}.${key}` : key);
  }
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v === 'object' && v !== null) announcedQuoteGaps(v, path ? `${path}.${k}` : k, out);
  }
}

/** Map a possibly-aliased receptor key to its canonical form. */
export function canonicalReceptor(key: string): string {
  return RECEPTOR_ALIASES[key] ?? key;
}

/**
 * Canonical occupancy key -> the `receptors.json` key of the GPCR it names.
 *
 * The two vocabularies never met. Occupancy rows use pharmacological shorthand
 * ("5-HT2A", "mu_opioid"), while the fetched GPCR half of the catalog is keyed by
 * HGNC gene symbol ("HTR2A", "OPRM1"). With nothing bridging them, 43 GPCRs that
 * ARE catalogued looked uncatalogued, and their target pages listed no compounds.
 * The app this registry came from carried the same bridge in its own source, so
 * the registry never had it.
 *
 * Every entry was checked against the catalog's own `name` for that gene: HTR2A
 * is "5-HT2A receptor", OPRM1 is "μ receptor", HCRTR1 is "OX1 receptor". Two
 * mappings name one subunit of a complex, and are still the right anchor: the
 * GABA-B agonist site sits on GABBR1, and erenumab's CGRP receptor is CALCRL with
 * RAMP1, where CALCRL is the catalogued GPCR.
 *
 * Deliberately NOT mapped: `alpha_1` and `muscarinic`. Those rows describe a
 * subtype-nonselective class, and pinning them to one subtype would state a
 * selectivity no cited value measured.
 *
 * THAT RULE IS WHAT ADDED `m1` AND `m3`, not an exception to it. Of the thirteen
 * rows on those two class keys, nine name the subtype their assay measured in
 * their own note — five human alpha1A figures from cloned-subtype binding, three
 * human M3, and atropine's cortical M1 — and those nine are pinned. The four that
 * remain are the ones the rule is about: `doxazosin` and `prazosin` were measured
 * in NATIVE human prostate, `tolterodine` in native human bladder, and
 * `risperidone`'s note records a table figure without saying which subtype it came
 * from. A native tissue expresses a mixture, so its Ki belongs to no single
 * subtype, and the class key is the honest anchor for it.
 *
 * This is a lookup, not an alias: `receptor.alias` still requires the canonical
 * occupancy key on the row, and nothing here rewrites data.
 */
export const OCCUPANCY_TARGET_KEYS: Readonly<Record<string, string>> = {
  '5-HT1A': 'HTR1A',
  '5-HT1B': 'HTR1B',
  '5-HT1D': 'HTR1D',
  '5-HT1F': 'HTR1F',
  '5-HT2A': 'HTR2A',
  '5-HT2B': 'HTR2B',
  '5-HT2C': 'HTR2C',
  '5-HT4': 'HTR4',
  '5-HT7': 'HTR7',
  H1: 'HRH1',
  H2: 'HRH2',
  H3: 'HRH3',
  adenosine_A1: 'ADORA1',
  adenosine_A2A: 'ADORA2A',
  alpha_1a: 'ADRA1A',
  alpha_2a: 'ADRA2A',
  alpha_2b: 'ADRA2B',
  alpha_2c: 'ADRA2C',
  at1: 'AGTR1',
  beta_1: 'ADRB1',
  beta_2: 'ADRB2',
  cb1: 'CNR1',
  cb2: 'CNR2',
  cgrp_receptor: 'CALCRL',
  cyslt1: 'CYSLTR1',
  delta_opioid: 'OPRD1',
  dopamine_d2: 'DRD2',
  dopamine_d3: 'DRD3',
  ep3: 'PTGER3',
  eta: 'EDNRA',
  gaba_b: 'GABBR1',
  gcgr: 'GCGR',
  ghsr: 'GHSR',
  gipr: 'GIPR',
  glp_1r: 'GLP1R',
  kappa_opioid: 'OPRK1',
  m1: 'CHRM1',
  m3: 'CHRM3',
  mt1: 'MTNR1A',
  mt2: 'MTNR1B',
  mu_opioid: 'OPRM1',
  orexin_1: 'HCRTR1',
  orexin_2: 'HCRTR2',
  p2y12: 'P2RY12',
  v2: 'AVPR2',
};

/**
 * The catalog key a receptor key refers to: spelling aliases first, then the
 * shorthand-to-gene bridge. Use this, not `canonicalReceptor`, whenever the
 * question is "which target is this"; a catalog key maps to itself.
 */
export function targetKeyFor(key: string): string {
  const canon = canonicalReceptor(key);
  return OCCUPANCY_TARGET_KEYS[canon] ?? canon;
}

/** Catalog gene key -> the occupancy shorthand rows must use for it. */
const SHORTHAND_FOR_GENE_KEY: ReadonlyMap<string, string> = new Map(
  Object.entries(OCCUPANCY_TARGET_KEYS).map(([shorthand, gene]) => [gene, shorthand]),
);

// ─────────────────────────────────────────────────────────────────────────────
// What an ABSENT field makes a consumer assume
// ─────────────────────────────────────────────────────────────────────────────

/**
 * THE DEFAULTS A MISSING PK FIELD IMPLIES, from `exposure.ts`.
 *
 * They are the substitutions a consumer makes for an absent field, and several
 * rules below measure exactly what omitting a field COSTS: `pk.defaulted-volume`
 * can only say "the concentration scale is set by a default" because the default
 * is written down, and `pk.defaulted-ka-slow` can only compute the peak a missing
 * ka implies because 1.0/h is written down. They live in one module so the
 * warnings and the implied-exposure check on a compound page cannot disagree.
 */
const DEFAULT_F = PK_DEFAULTS.F;
const DEFAULT_KA_PER_HR = PK_DEFAULTS.kaPerHr;

/**
 * How many unrelated compounds must share one approximated keo before it is
 * reported. Five, matching `pk.template-ka`: past coincidence, and low enough that
 * a group worth a real fit surfaces while it is still small.
 */
const TEMPLATE_KEO_MIN_IDENTITIES = 5;

/**
 * The band a peak occupancy must land in for a record's PD numbers to be jointly
 * usable. Outside it the Hill curve is a flat line: either nothing binds at any
 * reachable concentration, or everything is saturated from the first dose.
 */
/** Distinct compounds that must share one V_L before it is reported. Five, matching
 *  `pk.template-ka` and `pd.template-keo`, which found the same shape in other fields. */
const TEMPLATE_VOLUME_MIN_IDENTITIES = 5;

const OCCUPANCY_FLOOR = 0.01;
const OCCUPANCY_CEILING = 0.99;
const DEFAULT_V_L_PER_KG = PK_DEFAULTS.vLPerKg;
const DEFAULT_V_L_PER_KG_PROTEIN = PK_DEFAULTS.vLPerKgProtein;
const REFERENCE_WEIGHT_KG = PK_DEFAULTS.referenceWeightKg;
const PROTEIN_MW_THRESHOLD = PK_DEFAULTS.proteinMwThreshold;

/** A per-kg volume at the reference weight, printed for a reader. Computed rather
 *  than written twice, so the two cannot drift apart in a message. */
function litresAtReference(perKg: number): string {
  return String(Number((perKg * REFERENCE_WEIGHT_KG).toFixed(2)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Prose sniffing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prose that names a non-human species as the SOURCE of a value. Animal-derived
 * PK is allowed here, but it must be declared in `source_species` so surfaces can
 * label it — an unlabelled rat half-life renders exactly like a human one.
 */
const ANIMAL_WORD =
  /\b(rat|rats|mouse|mice|murine|dog|dogs|canine|beagle|pig|pigs|porcine|sheep|ovine|rabbit|rabbits|monkey|monkeys|primate|equine|horse|bovine|cow|cattle)\b/i;

/**
 * Prose that says, affirmatively, that this record's DOSES are a salt while its
 * PK describes the base or ion. Deliberately narrow: the catalog discusses salts
 * constantly (a salt named in a mechanism paragraph is not a claim about the dose
 * block), and a rule that fired on every mention would be ignored.
 */
const SALT_DOSE_PROSE =
  /\b(dose|doses|dosed|tablet|capsule)s?\b[^.]{0,80}\b(?:as|of|is|are)\s+(?:the\s+)?(carbonate|maleate|hydrochloride|HCl|sulfate|sulphate|mesylate|besylate|citrate|tartrate|fumarate|succinate|acetate|phosphate|salt)\b/i;

/**
 * Clauses that name a species, or a value, only to say it is NOT the source —
 * "replaces the prior rat-EEG citation" is a human value describing what it
 * superseded, and flagging it would train authors to ignore the rule.
 */
const SUPERSEDED =
  /\b(replaces|replaced|superseded|supersedes|prior|instead of|rather than|no longer|not a|rejected)\b/i;

/**
 * Clauses that NEGATE the thing being looked for — "no active metabolite", "does
 * not convert". A prose-sniffing rule that cannot tell an assertion from its
 * negation reports the records that state most clearly that the rule does NOT
 * apply to them. valsartan's note says outright "no active metabolite (unlike
 * losartan)" and was flagged for exactly that sentence.
 */
const NEGATED =
  /\b(?:no|not|never|lacks?)\s+(?:known\s+|major\s+|significant\s+|an?\s+)?(?:active\s+)?(?:metabolite|metabolites|conversion)\b/i;

/**
 * True when a sentence is a claim about THIS record's own stored values — rather
 * than a description of something REJECTED, SUPERSEDED or NEGATED.
 *
 * Three separate rules independently grew false positives for want of this
 * (2026-09-08): the species rule fired on notes recording what they replaced, the
 * prodrug rule fired on a note saying "no active metabolite", and the keo-estimate
 * rule fired on a note describing the estimate it had just been corrected AWAY
 * from. This catalog's prose is largely a RECORD OF DECISIONS, so a rule that
 * reads prose must separate a decision's subject from its outcome or it will
 * reliably flag the best-documented records.
 */
function assertsOfThisRecord(sentence: string): boolean {
  return !SUPERSEDED.test(sentence) && !NEGATED.test(sentence);
}

/**
 * Clauses describing a value this record USED TO store. `SUPERSEDED` catches the
 * "replaces / prior / rejected" phrasings; these are the ones it misses, and they
 * matter more here than anywhere else in this file, because a re-authored
 * occupancy note's whole job is to name the bad number it drove out. carvedilol's
 * β1 note says "The previous value was 4.5 nM, the MIDPOINT of a stated
 * 'approximately 4-5 nM'"; metoclopramide's 5-HT3 note says "The previous value
 * was a MIDPOINT of a pKi span taken across two papers"; methylphenidate's DAT
 * note says "Citation corrected from the IUPHAR/GtoPdb cross-paper geometric-mean
 * ... to this genuine human subject-primary". All three are FIXES. Reading them
 * as confessions would flag the three rows that did the work.
 */
const CORRECTED_AWAY_FROM = /\b(?:previous\w*|corrected from|used to|formerly|earlier value)\b/i;

/**
 * A `source_label` that actually claims to BE a label. The field is also used as
 * free prose recording a secondary source — trandolapril's names a review and a
 * PMID, propylthiouracil's says "review-derived" — and a review does not get
 * revised in place, so pinning a revision is meaningless for it. Only a string
 * claiming a label is asked to say which revision.
 */
const CLAIMS_A_LABEL = /\b(?:label|prescribing information|SmPC|DailyMed|package insert)\b/i;

/** A DailyMed SPL set id: the only stable handle on one revision of a US label. */
const HAS_SET_ID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

/** An ISO date, which is what pins an EMA SmPC or any label with no set id. */
const HAS_ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/;

/**
 * An occupancy note admitting the stored constant was COMPUTED ACROSS a span of
 * published values rather than read off one of them: "pKi range 5.8–6.9 across 5
 * refs → midpoint 6.35", "pKi 8.8–9.5 range → geometric-mean Ki 0.69 nM".
 *
 * HYGIENE R3 forbids exactly this ("no range midpoint, no cross-paper average"),
 * and these rows break R2 as well: the `source_pmid` is one "representative
 * primary" out of the span, whose abstract cannot state a number computed from
 * four other papers. `pnpm verify` passes every one of them, because the PMID is
 * real — this is the defect class that gate is documented as unable to see.
 *
 * NOT a blanket ban on arithmetic. A declared derivation is legal and common
 * here: every one of these notes ends with "ec50 = <Ki> nM × <MW> / 1e6", which
 * is a unit conversion of ONE number and is not what this matches. What it
 * matches is the step BEFORE that, where the Ki itself was manufactured.
 *
 * `average` is deliberately absent from this pattern. quinidine's Nav1.5 note
 * quotes its abstract verbatim — "suppressed INa with an average IC50 of ... 1.4
 * +/- 0.3 microM" — where the averaging is the PAPER's, over its own cells, and
 * the number is exactly the verbatim value the rules ask for.
 */
const OCCUPANCY_DERIVED_FROM_RANGE =
  /\b(?:mid-?point|geometric[-\s]mean|arithmetic mean|mean of the (?:range|values)|cross-paper (?:mean|average))\b/i;

/**
 * A note clause crediting a CURATION DATABASE — IUPHAR/GtoPdb — for the number
 * itself: "GtoPdb-curated human H1 binding: pKi 9.8 ... ref PMID:8935801", "Per
 * IUPHAR/GtoPdb (human SERT, pKi 9.7 → Ki 0.20 nM); primary Tatsumi 1997".
 *
 * The value came from the database's ligand page; the `source_pmid` is whatever
 * paper the database attributes it to, and the note itself says so. Nobody in the
 * authoring chain opened that paper. This is the secondary-citation shape the
 * 2026-06-28 audit found 84 times — a real, correctly-attributed, on-topic PMID
 * hung on a number its abstract does not state — and it is the reason
 * authoring/README.md rule 2 says a resolving PMID is not a warrant.
 *
 * Two guards, both from false positives on real rows:
 *   - AFFINITY_TOKEN must be in the SAME clause. GtoPdb is also cited for
 *     qualitative facts, and crediting it for a MODE OF ACTION is fine: lsd's
 *     5-HT2A note opens "In-model primary target 5-HT2A (full agonist per
 *     GtoPdb)" and then sources its Kd to the crystal-structure paper where LSD
 *     is the subject. That row is exemplary and must not fire.
 *   - OCCUPANCY_CORROBORATION excludes the opposite arrangement, where a
 *     fetched primary supplies the number and the database is named only as a
 *     cross-check: suvorexant's orexin rows read "Corroborated by GtoPdb's OX1
 *     pKi range 8.7-9.3". That is a re-authored row citing its own evidence.
 */
const OCCUPANCY_CURATED_SOURCE =
  /\bGtoPdb[-\s]curated\b|\bper\s+(?:IUPHAR\/)?(?:GtoPdb|IUPHAR)\b|\bGtoPdb\s+(?:lists|gives|reports|curates)\b/i;

/** An affinity or potency constant named in prose. */
const AFFINITY_TOKEN = /\b(?:p?K[idB]\b|pIC50|IC50|pEC50|EC50)/i;

/** The database is being cited AGAINST the value, as agreement, not as its source. */
const OCCUPANCY_CORROBORATION =
  /\b(?:corroborat\w+|consistent with|matches|cross-?check\w*|attributes?|agrees?)\b/i;

/**
 * True when some clause of an occupancy note makes `claim` ABOUT THIS ROW's own
 * stored value — not about the value it replaced, and not as a negation.
 *
 * Clause-scoped for the reason given on `assertsOfThisRecord`: this catalog's
 * prose is a record of decisions, and a whole-note regex reports the records that
 * documented their fix most carefully.
 */
function occupancyNoteAsserts(
  note: string,
  claim: RegExp,
  opts: { require?: RegExp; reject?: RegExp } = {},
): boolean {
  // Quotations come out BEFORE the split, not after. An author's elision puts a
  // full stop inside the quote — sildenafil's reads "sildenafil ... inhibiting
  // PDE5 from HCC with a geometric mean IC50 of 3.5 nM" — so splitting first
  // cuts the quotation in half and leaves its second fragment looking like
  // unquoted prose, which is precisely the fragment holding the arithmetic word.
  return splitClauses(note.replace(QUOTED_SPAN, ' ')).some(
    (clause) =>
      claim.test(clause) &&
      describesStoredValue(clause) &&
      (!opts.require || opts.require.test(clause)) &&
      (!opts.reject || !opts.reject.test(clause)),
  );
}

/**
 * A quoted span inside a note: the SOURCE's words, not the author's.
 *
 * The distinction decides whether an arithmetic word is a confession or a
 * quotation. sildenafil's PDE5 note quotes its abstract verbatim — "inhibiting
 * PDE5 from HCC with a geometric mean IC50 of 3.5 nM" — where the averaging is
 * the paper's own, over its own replicates, and 3.5 nM is exactly the single
 * verbatim value the rules ask for. Reading that as a cross-paper mean flagged
 * the one row in the whole set that was already correct, which is HYGIENE R16
 * happening in real time. Matching only outside the quotation marks fixes it
 * without weakening the rule, because an author confessing a midpoint writes it
 * in their own prose.
 */
export const QUOTED_SPAN = /"[^"]*"|\u201c[^\u201d]*\u201d/g;

/**
 * Split a note the way every prose rule in this file reads one: into clauses at
 * sentence and semicolon boundaries. Exported because `quotes.ts` must split
 * identically — a quote attributed to a superseded value sits in its own clause,
 * and a different split would attribute it to the stored one.
 */
export function splitClauses(note: string): string[] {
  return note.split(CLAUSE_BREAK);
}

/**
 * A clause boundary: a full stop or semicolon, then optionally the CLOSING
 * QUOTATION MARK of a quotation that ended on it, then whitespace.
 *
 * The closing mark is the whole subtlety. A note that quotes a full sentence
 * writes `… transcortin and albumin." Two further papers agree (PMID:3834071,
 * PMID:3593903).` — the `.` is inside the quotation, so the character after it
 * is `"` rather than a space, and a boundary that demands whitespace
 * IMMEDIATELY after the terminator does not fire. The two sentences become one
 * clause, and `quotes.ts` then sees two PMIDs where the author wrote one and
 * refuses to attribute the quote at all. prednisolone's fu_note lost its check
 * exactly that way. Allowing the mark costs nothing: a clause can only get
 * shorter, and a shorter clause is what every rule in this file wants.
 */
const CLAUSE_BREAK = /(?<=[.;])["\u201d]?\s+/;

/**
 * True when a clause is talking about the value this record STORES, rather than
 * one it replaced, rejected or negated.
 *
 * The union of the two guards every prose rule here needs, in one place and
 * under one name, so a reader of `quotes.ts` gets the same answer as a reader of
 * this file. Both halves are load-bearing and both were written after a rule
 * flagged a record for documenting its own fix.
 */
export function describesStoredValue(clause: string): boolean {
  return assertsOfThisRecord(clause) && !CORRECTED_AWAY_FROM.test(clause);
}

/**
 * True when `effect_compartment.note` credits a non-human species as the value's
 * own source.
 *
 * This used to require an animal word AND a study word (pharmacokinetic,
 * clearance, EEG, endpoint …) in the SAME sentence. That conjunction is right for
 * a compound's `notes`, which is long free prose discussing many studies — a
 * species word alone proves nothing there, which is why the PK-side rule below
 * still uses the much narrower ANIMAL_PK_CLAIM. An effect_compartment note is NOT
 * that: the whole field is one provenance statement about one value, so naming a
 * species IS the claim.
 *
 * Requiring a study word made the rule miss every compactly-written note.
 * fentanyl's entire note was "antinociception (rat tail-flick)" — a genuine,
 * verbatim RAT keo — and atenolol's and pregabalin's put the species and the study
 * word in DIFFERENT sentences, which a per-sentence conjunction cannot see. All
 * three read as human on every surface until 2026-09-08.
 *
 * SUPERSEDED is now the only guard, and is the clause that was doing the real work
 * anyway: a keo note routinely names the animal study it REPLACED — morphine's says
 * it "Replaces prior rat-EEG citation", remifentanil's records that the value it
 * replaced was "correctly labelled DOG". Widened, exactly three of the 249 keo
 * records fire and none of those two do.
 */
function keoNoteNamesAnimalSource(text: string): boolean {
  return text
    .split(/(?<=[.;])\s+/)
    .some((sentence) => ANIMAL_WORD.test(sentence) && !SUPERSEDED.test(sentence));
}

/**
 * kₑₒ notes that admit, in the authoring session's own words, that the value is
 * reasoned rather than fitted ("Approximation; no published kₑₒ", "matches the
 * moderate Cp→CNS lag", …). A cited kₑₒ whose note matches is an estimate wearing
 * a citation.
 */
const KEO_NOTE_ADMITS_ESTIMATE =
  /approximation|approximated from|no published k|no measured (?:human )?k|no human keo|no [\\w-]+-specific k|no .*keo modeling published|textbook approximation|captures the (?:slow|moderate|multi-week|long-tail|Cp)|matches the (?:moderate|rapid|slow) Cp|modeled here as a small keo|small keo reflects the slow|matches the sleep-onset PD timing/i;

// ─────────────────────────────────────────────────────────────────────────────
// Findings
// ─────────────────────────────────────────────────────────────────────────────

export type Finding = {
  level: 'error' | 'warning';
  /** The compound slug, the pathway slug, or the literal `(catalog)` for a
   *  finding about the catalog as a whole. It is `entity` rather than `slug`
   *  because pathway findings key on a pathway slug and catalog-level ones key on
   *  nothing — a field called `slug` invited consumers to look it up in the
   *  compound index and get undefined. */
  entity: string;
  rule: string;
  message: string;
};

/** Route keys arrive as `string` (from `Object.entries` on the pk record, or from
 *  `routes[]`), and indexing a `Partial<Record<Route, …>>` with a string is a type
 *  error even though every key IS a Route at runtime — the schema's enum-keyed
 *  record rejects anything else. These two accessors hold that cast in one place
 *  instead of scattering it through the rules. */
function pkOf(c: Compound, route: string): RoutePk | undefined {
  return (c.pk as Record<string, RoutePk | undefined> | undefined)?.[route];
}

function halfLifeOf(c: Compound, route: string): number | undefined {
  return (c.half_life_hr as Record<string, number | undefined>)[route];
}

/** Every pk route actually authored, as [route, params] pairs. */
function pkRoutes(c: Compound): Array<[string, RoutePk]> {
  const out: Array<[string, RoutePk]> = [];
  for (const [route, pk] of Object.entries((c.pk ?? {}) as Record<string, RoutePk | undefined>)) {
    if (pk) out.push([route, pk]);
  }
  return out;
}

/**
 * The four elimination paths a decay can be derived from: an authored half-life,
 * an explicit ke, saturable MM params, or the two-compartment triple.
 *
 * This variant requires the `pk[route]` BLOCK to exist. A route listed in
 * `routes[]` with a half-life but no pk block at all is not a partly-authored
 * route, it is an unauthored one — it has no volume and no bioavailability
 * either — and `pk.unsolvable-route` is asking what the dosing UI offers against
 * what the pk block can actually support.
 *
 * Deliberately stricter than `routeYieldsElimination` below, which counts a bare
 * half-life as enough. The two questions are different and used to be answered by
 * two nearly-identical inline copies of this code, so the divergence was
 * invisible; naming both is what makes it deliberate rather than accidental.
 */
function pkRouteSolvable(c: Compound, route: string): boolean {
  const pk = pkOf(c, route);
  if (!pk) return false;
  if (halfLifeOf(c, route) != null || pk.ke_hr != null) return true;
  if (pk.mm_vmax_per_hr != null && pk.mm_km_mg_per_l != null) return true;
  return pk.alpha_hr != null && pk.beta_hr != null && pk.k21_hr != null;
}

/**
 * The same four paths, but a `half_life_hr[route]` with no pk block counts: ke
 * follows from the half-life alone, and volume and bioavailability fall back to
 * defaults. This is the right question for the PD rules — they ask whether a
 * concentration-time curve exists AT ALL, and one built on defaults still
 * produces a Ce(t) for a Hill curve to run against.
 */
function routeYieldsElimination(c: Compound, route: string): boolean {
  if (halfLifeOf(c, route) != null) return true;
  return pkRouteSolvable(c, route);
}

/** True when ANY declared route yields an elimination rate. */
function anyRouteSolvable(c: Compound): boolean {
  return (c.routes ?? []).some((route) => routeYieldsElimination(c, route));
}

/**
 * Run every rule. Order is stable, so two runs over the same catalog diff
 * cleanly.
 *
 * Takes the WHOLE registry, including the target catalog, which the previous
 * version never saw — it was handed `{ compounds, pathways }` only, so
 * `receptor.unknown-target` was impossible to write.
 */
export function lintRegistry(registry: Registry): Finding[] {
  const findings: Finding[] = [];
  function err(entity: string, rule: string, message: string): void {
    findings.push({ level: 'error', entity, rule, message });
  }
  function warn(entity: string, rule: string, message: string): void {
    findings.push({ level: 'warning', entity, rule, message });
  }

  const data = registry.compounds;
  const pathwayData = registry.pathways;

  const bySlug = new Map(data.map((c) => [c.slug, c]));

  // ── Slug uniqueness ──────────────────────────────────────────────────
  // The loader already throws on duplicate slugs, but failing in a gate is
  // cheaper than failing at load, and this function is also run against records
  // that have not been through the loader yet.
  const seen = new Set<string>();
  for (const c of data) {
    if (seen.has(c.slug)) err(c.slug, 'slug.unique', 'duplicate slug');
    seen.add(c.slug);
  }

  // ── Loader-schema parity ─────────────────────────────────────────────
  // There used to be a `compound.schema` rule here that re-parsed every record
  // through the authoritative zod schema, because data-lint's structural checks
  // were written against a hand-rolled interface and so missed the schema's own
  // constraints (note max-lengths, F∈[0,1], enum members, the source_pmid regex):
  // an over-length provenance note once passed the gate and then threw at load.
  //
  // It is gone for two reasons. The validate gate now runs the loader FIRST, so
  // nothing reaches these rules without having been through the schema; and the
  // rules type against the real `Compound`, so the interface drift that motivated
  // the check cannot happen. Keeping it would also have pinned zod into every
  // consumer of this file, including the browser.

  // ── Retired-slug integrity ───────────────────────────────────────────
  // `retired_slugs` is the forwarding table that keeps a reference under a
  // merged-away slug resolving to the record that absorbed it. It is only
  // trustworthy if every retired name resolves to exactly one live compound, so
  // three ways of breaking that are errors:
  //   1. a retired slug that is ALSO a live slug — the tombstone would shadow a
  //      real compound, or be shadowed by it, depending on map insertion order,
  //      which is the kind of bug that shows up as one compound mysteriously
  //      wearing another's data;
  //   2. two compounds claiming the same retired slug — a lookup resolves to
  //      whichever happens to be indexed last;
  //   3. a compound retiring its own slug, which would make it unreachable.
  const retiredOwner = new Map<string, string>();
  for (const c of data) {
    for (const retired of c.retired_slugs ?? []) {
      if (retired === c.slug) {
        err(
          c.slug,
          'compound.retired-self',
          `retired_slugs contains its own slug — the compound would forward to itself`,
        );
      }
      if (bySlug.has(retired)) {
        err(
          c.slug,
          'compound.retired-collision',
          `retired slug "${retired}" is also a LIVE compound — a retirement must not shadow a real record`,
        );
      }
      const prior = retiredOwner.get(retired);
      if (prior) {
        err(
          c.slug,
          'compound.retired-collision',
          `retired slug "${retired}" is already claimed by "${prior}" — a reference naming it would resolve unpredictably`,
        );
      }
      retiredOwner.set(retired, c.slug);
    }
  }

  // A retired slug that is another record's ALIAS is the same failure one step
  // removed: `compoundIndex` forwards the slug to the record that retired it,
  // while a name search matches the record that lists it as an alias, so the two
  // lookup paths silently disagree about which compound the name means. Not an
  // error, because the fix is an authoring decision about which record owns the
  // name rather than a mechanical repair.
  {
    const aliasOwner = new Map<string, string>();
    for (const c of data) {
      for (const a of c.aliases ?? []) {
        aliasOwner.set(a.toLowerCase().replace(/[^a-z0-9]+/g, '-'), c.slug);
      }
    }
    for (const [retired, owner] of retiredOwner) {
      const other = aliasOwner.get(retired);
      if (other && other !== owner) {
        warn(
          owner,
          'compound.retired-alias-clash',
          `retired slug "${retired}" forwards here, but "${other}" lists that name as an alias — a slug lookup and a name search disagree about which record it means. Decide which owns the name`,
        );
      }
    }
  }

  // ── One molecule, one compound ───────────────────────────────────────
  // Slug uniqueness is not identity uniqueness. Two records can carry distinct
  // slugs while claiming the SAME molecule — because one is the other's alias
  // ("ethanol" vs "alcohol"), an international name ("albuterol" vs
  // "salbutamol"), a stereochemical prefix ("tyrosine" vs "l-tyrosine"), or a
  // spelling variant ("epitalon" vs "epithalon"). Nothing downstream can merge
  // them: search returns both, and each side gets independently authored, so the
  // registry ends up publishing two different half-lives for one molecule —
  // occasionally citing the SAME PMID for both, which means at least one set of
  // numbers is not in the paper it points at.
  //
  // The check: a compound's canonical identity (its slug or its name) must not
  // appear in ANOTHER compound's name or aliases. Comparison is on a normalized
  // key (lowercase, punctuation stripped) so "L-Tyrosine" and "l-tyrosine"
  // collide. Shared CLASS labels are deliberately not flagged — "BCAA" listed as
  // an alias of leucine, isoleucine and valine is a category, not an identity
  // claim, and it trips no canonical name or slug.
  //
  // Warning, not error: several pairs are legitimately distinct (a salt or ester
  // form with its own absorption, e.g. zinc vs zinc-picolinate) and resolving a
  // true duplicate means MERGING user-facing slugs, which is a data migration,
  // not a lint fix.
  //
  // Normalization detail that matters: Greek letters are TRANSLITERATED, not
  // stripped. They are frequently the only thing distinguishing two real
  // molecules — alpha- / beta- / gamma- / delta-tocopherol are four different
  // vitamers, and 17-alpha- vs 17-beta-estradiol are different hormones — so
  // deleting the glyph would report those distinct compounds as duplicates of
  // each other. Digits and colons survive for the same reason: the fatty acid
  // C6:0 is not the fullerene C60.
  const GREEK: Record<string, string> = {
    α: 'alpha',
    β: 'beta',
    γ: 'gamma',
    δ: 'delta',
    ε: 'epsilon',
    ω: 'omega',
    κ: 'kappa',
    μ: 'mu',
    σ: 'sigma',
    τ: 'tau',
  };
  const identityKey = (s: string) =>
    s
      .toLowerCase()
      .replace(/[αβγδεωκμστ]/g, (ch) => GREEK[ch] ?? ch)
      .replace(/[\s\-_.,()[\]'’"/]+/g, '');
  // An alias is often qualified rather than renamed: cortisol lists
  // "Hydrocortisone (when exogenous)", which is a claim on hydrocortisone's
  // identity with a scope note attached. Comparing the full string misses it, so
  // claims are ALSO tested with a trailing parenthetical removed. Only trailing —
  // a leading one can be part of the name itself ("(+)-Catechin").
  const identityKeyBase = (s: string) => identityKey(s.replace(/\s*\([^)]*\)\s*$/, ''));
  const canonicalOwner = new Map<string, string>();
  for (const c of data) {
    canonicalOwner.set(identityKey(c.slug), c.slug);
    canonicalOwner.set(identityKey(c.name), c.slug);
  }
  /**
   * Routes of two colliding compounds that cite the SAME source but store
   * different numbers. If the pair really is one molecule, at most one of them can
   * be what the paper says — so this is a provable citation defect, not a
   * judgement call about whether to merge. Compares the four parameters a reader
   * would check against an abstract.
   */
  const sharedSourceConflicts = (a: Compound, b: Compound): string[] => {
    const out: string[] = [];
    for (const [route, pkA] of pkRoutes(a)) {
      const pkB = pkOf(b, route);
      if (!pkB || !pkA.source_pmid || pkA.source_pmid !== pkB.source_pmid) continue;
      const fields: [string, number | undefined, number | undefined][] = [
        ['ka_hr', pkA.ka_hr, pkB.ka_hr],
        ['V_L', pkA.V_L, pkB.V_L],
        ['F', pkA.F, pkB.F],
        ['half_life_hr', halfLifeOf(a, route), halfLifeOf(b, route)],
      ];
      const differing = fields
        .filter(([, x, y]) => x != null && y != null && x !== y)
        .map(([f, x, y]) => `${f} ${x} vs ${y}`);
      if (differing.length > 0) {
        out.push(`${route} both cite ${pkA.source_pmid} but store ${differing.join(', ')}`);
      }
    }
    return out;
  };

  const collisionsReported = new Set<string>();
  for (const c of data) {
    for (const claimed of [c.name, ...(c.aliases ?? [])]) {
      const owner =
        canonicalOwner.get(identityKey(claimed)) ?? canonicalOwner.get(identityKeyBase(claimed));
      if (!owner || owner === c.slug) continue;
      // Report each unordered pair once, on the alphabetically-first slug.
      const pairKey = [c.slug, owner].sort().join('|');
      if (collisionsReported.has(pairKey)) continue;
      collisionsReported.add(pairKey);
      const other = bySlug.get(owner);
      const bothAuthored =
        c.pk && other?.pk
          ? ' — BOTH carry authored pk, so the registry publishes two different curves for one molecule'
          : '';
      warn(
        c.slug,
        'compound.identity-collision',
        `claims "${claimed}", which is the canonical identity of "${owner}"${bothAuthored}`,
      );
      // The provable half of the problem gets its own finding.
      if (other) {
        for (const conflict of sharedSourceConflicts(c, other)) {
          err(
            c.slug,
            'pk.shared-source-conflict',
            `"${c.slug}" and "${owner}" are the same molecule and ${conflict} — one of them misstates its source`,
          );
        }
      }
    }
  }

  // ── A counter-ion cannot change distribution volume or half-life ─────
  // Mineral supplements are sold as salts, and the registry carries a record per
  // salt. But once Mg²⁺ or Zn²⁺ crosses the gut wall it is the same ion whatever
  // it arrived with, so only the ABSORPTION side may legitimately differ between
  // salts: F and ka. A salt claiming its own volume of distribution or its own
  // elimination half-life is making a claim about the ion's disposition that its
  // counter-ion cannot support — the magnesium family carried V 1050 L against
  // V 14 L, and zinc 6 h against 50 h, for one ion each. That is a category error
  // rather than a disagreement between two measurements, so it is worth its own
  // rule.
  //
  // Deliberately scoped to the mineral ions below. The same slug shape covers
  // covalent ESTERS elsewhere (testosterone / testosterone-cypionate), which are
  // genuinely different molecules with their own depot kinetics, and this
  // reasoning must not reach them.
  {
    const MINERAL_IONS = new Set([
      'magnesium',
      'zinc',
      'calcium',
      'potassium',
      'sodium',
      'iron',
      'lithium',
      'selenium',
      'copper',
      'chromium',
      'manganese',
      'boron',
    ]);
    for (const c of data) {
      const parentSlug = [...MINERAL_IONS].find((ion) => c.slug.startsWith(`${ion}-`));
      if (!parentSlug) continue;
      const parent = bySlug.get(parentSlug);
      if (!parent) continue;
      for (const [route, pk] of pkRoutes(c)) {
        const parentPk = pkOf(parent, route);
        if (!parentPk) continue;
        const clashes: string[] = [];
        if (pk.V_L != null && parentPk.V_L != null && pk.V_L !== parentPk.V_L) {
          clashes.push(`V ${pk.V_L} L vs ${parentSlug}'s ${parentPk.V_L} L`);
        }
        const tSalt = halfLifeOf(c, route);
        const tParent = halfLifeOf(parent, route);
        if (tSalt != null && tParent != null && tSalt !== tParent) {
          clashes.push(`half-life ${tSalt} h vs ${parentSlug}'s ${tParent} h`);
        }
        if (clashes.length > 0) {
          err(
            c.slug,
            'pk.salt-disposition-drift',
            `${route} declares ${clashes.join(' and ')} — a counter-ion changes absorption (F, ka), never the ion's distribution volume or elimination half-life`,
          );
        }
      }
    }
  }

  // ── Template-filled PK quartets ──────────────────────────────────────
  // A 2026-09-06 verification pass found the registry's recurring failure shape:
  // where a source genuinely carried a number the authoring session derived it
  // correctly, and where it did not, a plausible {ka, V, F} trio appeared anyway.
  // Those invented trios repeat verbatim across unrelated compounds, because the
  // same default was reached for more than once — that repetition is the only
  // offline signal that separates them from authored values, and it is what this
  // rule keys on.
  //
  // IV routes are exempt: F is 1 by definition there and ka is absent, so a
  // shared (V, F) pair is arithmetic, not a template. Same-molecule relatives (a
  // salt beside its parent) are exempt too — one ion legitimately shares one
  // parameter set, and `compound.identity-collision` already covers that pair.
  // What remains is unrelated molecules storing byte-identical absorption, volume
  // and bioavailability under three different citations.
  {
    const tuples = new Map<string, { slug: string; route: string; pmid: string }[]>();
    for (const c of data) {
      for (const [route, pk] of pkRoutes(c)) {
        if (route === 'IV') continue;
        if (pk.ka_hr == null || pk.V_L == null || pk.F == null) continue;
        const key = `${pk.ka_hr}|${pk.V_L}|${pk.F}`;
        const list = tuples.get(key) ?? [];
        list.push({ slug: c.slug, route, pmid: pk.source_pmid ?? pk.source_label ?? 'no source' });
        tuples.set(key, list);
      }
    }
    for (const [key, rows] of tuples) {
      if (rows.length < 2) continue;
      // Collapse same-molecule relatives: if every row resolves to one identity
      // (or one citation), this is a salt family, not a template.
      const identities = new Set(
        rows.map((r) => {
          const c = bySlug.get(r.slug);
          return canonicalOwner.get(identityKey(c?.name ?? r.slug)) ?? r.slug;
        }),
      );
      const citations = new Set(rows.map((r) => r.pmid));
      if (identities.size < 2 || citations.size < 2) continue;
      const [ka, v, f] = key.split('|');
      warn(
        '(catalog)',
        'pk.template-quartet',
        `${rows.length} unrelated compounds store an identical ka ${ka} /h, V ${v} L, F ${f} under ${citations.size} different citations — a repeated default, not ${rows.length} independent measurements: ${rows.map((r) => `${r.slug}.${r.route} [${r.pmid}]`).join(', ')}`,
      );
    }
  }

  // ── A declared route nothing can solve ──────────────────────────────
  // `routes[]` drives a dosing UI — it is iterated to offer the choices, and
  // `routes[0]` is the default — while a plasma curve needs a route that yields an
  // elimination rate. A route in the first list but not the second is one a person
  // can select and get nothing back from.
  //
  // The severity is graded, and the grading is the point: 93 such routes exist,
  // but only a handful are `routes[0]`, so the rest need a user to actively pick a
  // non-default route before the gap shows. Records that are wholly
  // `pk_unauthored` are exempt — those declare the absence deliberately.
  //
  // Some of these are CORRECT and should stay: mannitol's oral route is
  // parameterless because oral mannitol acts osmotically in the gut lumen and has
  // no meaningful plasma curve. For those the fix is the route ORDER, not the
  // pharmacology.
  {
    const dangling: string[] = [];
    const defaults: string[] = [];
    for (const c of data) {
      if (c.pk_unauthored) continue;
      const rs = c.routes ?? [];
      if (!rs.length) continue;
      for (const r of rs) if (!pkRouteSolvable(c, r)) dangling.push(`${c.slug}.${r}`);
      if (rs[0] && !pkRouteSolvable(c, rs[0])) {
        defaults.push(`${c.slug}.${rs[0]}`);
        warn(
          c.slug,
          'pk.unsolvable-default-route',
          `routes[0] is ${rs[0]}, which yields no elimination rate — the dosing UI DEFAULTS to it, so the commonest path through this record selects a dose and renders no curve. Either author that route or order routes[] so a solvable one comes first`,
        );
      }
    }
    if (dangling.length) {
      warn(
        '(catalog)',
        'pk.unsolvable-route',
        `${dangling.length} declared routes yield no elimination rate, so a dose against them renders nothing; ${defaults.length} of those are routes[0] and therefore the default selection: ${dangling.join(', ')}`,
      );
    }
  }

  // ── A kinetics edge whose victim has no solvable PK ─────────────────
  // The edge modulates the victim's elimination, so with no elimination rate there
  // is nothing to modulate: the authored ki_uM or induction_factor is inert. NOT a
  // reason to delete it — the magnitude is real and becomes live the moment the
  // victim gains PK, and several of these are clinically important (the enzyme
  // inducers against hormonal contraceptives). Flagged so the inertness is known
  // rather than assumed to be working.
  {
    const inert: string[] = [];
    for (const c of data) {
      for (const e of c.interactions ?? []) {
        if (!e.kinetics) continue;
        const v = bySlug.get(e.slug);
        if (!v) continue;
        if (!pkRoutes(v).some(([r]) => pkRouteSolvable(v, r))) inert.push(`${c.slug}→${e.slug}`);
      }
    }
    if (inert.length) {
      warn(
        '(catalog)',
        'interactions.inert-kinetics',
        `${inert.length} kinetics edges name a victim with no solvable PK, so the authored magnitude modulates nothing and renders as no effect: ${inert.join(', ')}. Kept deliberately — each becomes live if the victim gains PK`,
      );
    }
  }

  // ── A missing ka on a SLOWLY-eliminated extravascular route ─────────
  // A missing ka is substituted with 1.0/h, an absorption half-life of ~40 min.
  // For a subcutaneous antibody or a depot injection that is wrong by design, not
  // by a margin — and the error is invisible, because Tmax under a fixed ka grows
  // only LOGARITHMICALLY as elimination slows. A 31-day antibody and a 2-day small
  // molecule both land in a 4-7 h window, so the whole class renders as though it
  // peaked the same afternoon.
  //
  // Found 2026-09-08 from a user report that retatrutide peaked at 5 h instead of
  // days. Eleven rows have since been authored from a verbatim Tmax; the rest are
  // counted here rather than filled, because inventing a plausible absorption rate
  // across the class is what caused that regression.
  //
  // Scoped to t½ >= 48 h: below that the default is often defensible, and
  // brexpiprazole is a worked example — its verbatim Tmax of 4-5 h CONTAINS the
  // 4.9 h the default renders.
  //
  // FOUR ROWS ARE ACQUITTED RATHER THAN OPEN. Their published Tmax range CONTAINS
  // what the 1.0/h default renders, so the default is correct and storing a number
  // would assert a measurement where a coincidence is the honest description. They
  // are listed explicitly, with the verbatim range, rather than left to fire
  // forever: a warning that cannot be resolved by doing the right thing is one
  // authors learn to ignore — the same lesson that produced `fu_note`-without-a-
  // value.
  const KA_DEFAULT_ACQUITTED: Record<string, string> = {
    'brexpiprazole.PO': 'label/citation "tmax ... 4-5" h contains the 4.9 h the default renders',
    'solifenacin.PO': 'VESICARE label "reached within 3 to 8 hours" contains 4.6 h',
    'zonisamide.PO': 'ZONEGRAN label "occur within 2-6 hours" contains 4.6 h',
    'cariprazine.PO': 'PMC13269304 "approximately 3 to 6 h post-dose" contains 4.7 h',
  };
  {
    const slow: string[] = [];
    for (const c of data) {
      for (const [route, pk] of pkRoutes(c)) {
        if (route === 'IV' || pk.ka_hr != null || pk.zo_dur_hr != null) continue;
        if (KA_DEFAULT_ACQUITTED[`${c.slug}.${route}`]) continue;
        const t = halfLifeOf(c, route);
        if (t == null || t < 48) continue;
        const ke = Math.LN2 / t;
        const tmax = Math.log(DEFAULT_KA_PER_HR / ke) / (DEFAULT_KA_PER_HR - ke);
        warn(
          c.slug,
          'pk.defaulted-ka-slow',
          `pk.${route} has no ka and a ${(t / 24).toFixed(1)}-day half-life — the ${DEFAULT_KA_PER_HR}/h default puts the peak at ${tmax.toFixed(1)} h, which for a slowly-absorbed route is wrong in kind rather than by a margin. Authoring it needs a verbatim Tmax; ka then follows from ln(ka/ke)/(ka−ke) = Tmax`,
        );
        slow.push(`${c.slug}.${route}`);
      }
    }
    if (slow.length) {
      warn(
        '(catalog)',
        'pk.defaulted-ka-slow',
        `${slow.length} extravascular rows carry no ka at a half-life of 48 h or more, so every one renders its peak inside a 4-7 h window regardless of how slowly it is really absorbed: ${slow.join(', ')}. A further ${Object.keys(KA_DEFAULT_ACQUITTED).length} rows are ACQUITTED and deliberately not counted — their published Tmax range contains what the default renders`,
      );
    }
  }

  // ── A ka shared by many unrelated compounds ─────────────────────────
  // The quartet rule above needs ka, V and F to match together, which is a strong
  // signal and therefore a narrow one: it now fires nowhere. But the ABSORPTION
  // RATE alone is the most template-prone field in the catalog — 12 values account
  // for 125 of the 276 authored rates — because a plausible ka is easy to invent
  // and almost nothing downstream contradicts it.
  //
  // Scoped to values shared by >= 5 unrelated identities under >= 5 different
  // citations, which is well past coincidence: real absorption rates are fitted to
  // a Tmax and land on untidy numbers. Excludes 1.0, which IS the default and was
  // swept separately (storing it asserts nothing that omitting it does not).
  {
    const byKa = new Map<number, { slug: string; route: string; pmid: string }[]>();
    for (const c of data) {
      for (const [route, pk] of pkRoutes(c)) {
        if (route === 'IV' || !pk.ka_hr || pk.ka_hr === DEFAULT_KA_PER_HR) continue;
        const list = byKa.get(pk.ka_hr) ?? [];
        list.push({ slug: c.slug, route, pmid: pk.source_pmid ?? pk.source_label ?? 'no source' });
        byKa.set(pk.ka_hr, list);
      }
    }
    for (const [ka, rows] of [...byKa].sort((a, b) => b[1].length - a[1].length)) {
      const identities = new Set(
        rows.map((r) => {
          const c = bySlug.get(r.slug);
          return canonicalOwner.get(identityKey(c?.name ?? r.slug)) ?? r.slug;
        }),
      );
      const citations = new Set(rows.map((r) => r.pmid));
      if (identities.size < 5 || citations.size < 5) continue;
      warn(
        '(catalog)',
        'pk.template-ka',
        `ka ${ka} /h is shared by ${identities.size} unrelated compounds under ${citations.size} different citations — a plausible number reached for repeatedly, not ${rows.length} independent measurements: ${rows.map((r) => `${r.slug}.${r.route}`).join(', ')}`,
      );
    }
  }

  // ── A volume shared by many unrelated compounds ─────────────────────
  // THE THIRD INSTANCE OF ONE SHAPE, and the most consequential field it has
  // appeared in. `pk.template-ka` found it in absorption rates and
  // `pd.template-keo` in effect-compartment constants; this finds it in V_L, where
  // `pk.defaulted-volume` already says what is at stake — a volume "sets the whole
  // concentration scale".
  //
  // AND `pk.defaulted-volume` CANNOT SEE THIS ONE, which is why the rule is
  // separate rather than an extension. That rule counts volumes that are ABSENT. A
  // templated volume is PRESENT and carries a source_pmid, so it reads as authored.
  //
  // What gives it away is the per-kilogram equivalent. The shared values divide by
  // the 70 kg reference into textbook priors — 0.4 L/kg is roughly total body
  // water, 0.2 L/kg extracellular fluid, 0.11 L/kg the plasma-plus-interstitial
  // figure a monoclonal is assumed to occupy — and 15 unrelated compounds cannot
  // each have measured exactly 28 L. Spot-checking six of the cited abstracts on
  // 2026-09-27 found no volume language of any kind in any of them.
  //
  // COUNTED BY DISTINCT COMPOUND, not by route row, because one measured volume
  // legitimately repeats across a compound's own routes: fentanyl carries the same
  // 280 L on four routes and morphine on five, which is correct practice and would
  // otherwise dominate the count.
  {
    const byV = new Map<number, Set<string>>();
    for (const c of data) {
      const vals = new Set<number>();
      for (const [, pk] of pkRoutes(c)) if (pk.V_L != null) vals.add(pk.V_L);
      for (const v of vals) {
        const owner = canonicalOwner.get(identityKey(c.name)) ?? c.slug;
        byV.set(v, (byV.get(v) ?? new Set()).add(owner));
      }
    }
    for (const [v, owners] of [...byV].sort((a, b) => b[1].size - a[1].size)) {
      if (owners.size < TEMPLATE_VOLUME_MIN_IDENTITIES) continue;
      const perKg = v / PK_DEFAULTS.referenceWeightKg;
      warn(
        '(catalog)',
        'pk.template-volume',
        `V_L ${v} L is stored by ${owners.size} unrelated compounds, which is ${perKg.toFixed(3)} L/kg at the ${PK_DEFAULTS.referenceWeightKg} kg reference — a per-kilogram prior reached for repeatedly, not ${owners.size} independent measurements, and each one sets its record's whole concentration scale: ${[...owners].sort().join(', ')}`,
      );
    }
  }

  // ── An approximated keo shared by many unrelated compounds ──────────
  // THE SAME CONCENTRATION SHAPE AS `pk.template-ka`, AND A DIFFERENT DEFECT.
  // Every row this counts is HONEST on its own terms: `approximated: true` is set,
  // a note says "Approximation; no published kₑₒ", and nothing wears a citation it
  // did not earn. So this does not ask for deletions the way the ka rule did.
  //
  // What it makes visible is the CONCENTRATION, which no per-compound surface can
  // show. A reader on one compound page sees "estimated, not fitted" and cannot
  // see that 45 other compounds carry the identical number, so an author reaching
  // for a plausible keo cannot tell whether they are adding a reasoned estimate or
  // the catalog's modal guess. 170 of 196 approximated keos sit on ten values.
  //
  // And it matters more than the ka debt does, because of what consumes it: 239 of
  // the 303 authored occupancy rows — 79% — run their Hill curve against a Ce(t)
  // built from one of these estimates.
  //
  // SCOPED TO `approximated: true` ON EVIDENCE, not for convenience. The 53 fitted
  // keos were checked: all 53 carry a source_pmid, and only four values are shared
  // by two compounds each. Three of those four are coincidences at three
  // significant figures from different papers, and the fourth is isoflurane and
  // sevoflurane sharing PMID:10443602 — one study measuring both volatile
  // anaesthetics, which is the right answer rather than a template. A shared
  // FITTED value would be a worse finding than anything here; there is not one.
  {
    const byKeo = new Map<number, string[]>();
    for (const c of data) {
      const ec = c.effect_compartment;
      if (!ec?.approximated || !ec.keo_per_h) continue;
      byKeo.set(ec.keo_per_h, (byKeo.get(ec.keo_per_h) ?? []).concat(c.slug));
    }
    for (const [keo, slugs] of [...byKeo].sort((a, b) => b[1].length - a[1].length)) {
      const identities = new Set(
        slugs.map((slug) => {
          const c = bySlug.get(slug);
          return canonicalOwner.get(identityKey(c?.name ?? slug)) ?? slug;
        }),
      );
      if (identities.size < TEMPLATE_KEO_MIN_IDENTITIES) continue;
      warn(
        '(catalog)',
        'pd.template-keo',
        `keo ${keo} /h is the declared approximation on ${identities.size} unrelated compounds — each honestly flagged, but a reader on any one of them cannot see the other ${identities.size - 1}, and occupancy on all of them runs against a Ce(t) built from this one guess: ${slugs.join(', ')}`,
      );
    }
  }

  // ── A dose-response with no response in it ──────────────────────────
  // THE FIRST RULE HERE THAT RESOLVES THE WHOLE RECORD RATHER THAN READING FIELDS.
  // `occupancy.ts` turns a record's dose, volume, bioavailability, half-life, ka,
  // keo, unbound fraction and affinity into one number — peak occupancy at the
  // typical dose — and a number outside 1-99% means those values cannot jointly
  // produce a dose-response curve. It is the PD analogue of the teriparatide
  // defect: every input correctly cited, and jointly impossible.
  //
  // BOTH READINGS ARE REAL, WHICH IS WHY THIS IS A WARNING AND STANDING. Some
  // extremes are the honest answer: `cbd` shows 0.004% at CB1 because its CB1 Ki
  // really is micromolar and it does not act by direct CB1 agonism, and a
  // neutralising antibody in molar excess over its cytokine really does sit near
  // 100%. Others are defects the rule exists to surface — the sweep that added it
  // found five records storing a PER-KILOGRAM or PER-HOUR dose as an absolute
  // single dose, which is a 70-fold error that nothing reading one field at a time
  // could see.
  //
  // The message names which inputs were DEFAULTED, because an extreme that rests
  // on an unmeasured number is attributable to that number, while one on fully
  // stored inputs is either pharmacology or a real defect.
  {
    const flat: string[] = [];
    for (const c of data) {
      for (const o of impliedOccupancies(c)) {
        if (!o.ok) continue;
        if (o.peakOccupancy >= OCCUPANCY_FLOOR && o.peakOccupancy <= OCCUPANCY_CEILING) continue;
        const defaulted = o.fu.from === 'default' ? ' (fu defaulted to 1)' : '';
        flat.push(`${c.slug}.${o.receptor} ${(o.peakOccupancy * 100).toPrecision(3)}%${defaulted}`);
      }
    }
    if (flat.length) {
      warn(
        '(catalog)',
        'pd.occupancy-flat',
        `${flat.length} occupancy rows imply a peak below ${OCCUPANCY_FLOOR * 100}% or above ${OCCUPANCY_CEILING * 100}% at the record's typical dose, so the stored dose, exposure, keo, unbound fraction and affinity cannot jointly produce a dose-response. Some are the honest answer and some are defects — this sweep found five records storing a per-kilogram or per-hour dose as an absolute one: ${flat.join(', ')}`,
      );
    }
  }

  // ── The silent-default debt, in aggregate ───────────────────────────
  // A missing V_L is filled with 0.5 L/kg, a missing F with 0.9 and a missing ka
  // with 1.0. None of that is visible in the data, so a route row carrying a
  // source_pmid can claim provenance for numbers its paper never stated. The
  // per-compound rule below fires only where an occupancy curve consumes the
  // concentration; these totals carry the rest of the debt.
  {
    let noV = 0,
      noF = 0,
      noKa = 0,
      sourcedNoV = 0,
      proteinNoV = 0,
      rows = 0;
    const compoundsNoV = new Set<string>();
    for (const c of data) {
      for (const [route, pk] of pkRoutes(c)) {
        rows++;
        if (pk.V_L == null) {
          noV++;
          compoundsNoV.add(c.slug);
          if (pk.source_pmid || pk.source_label) sourcedNoV++;
          if (c.mw_g_mol != null && c.mw_g_mol >= PROTEIN_MW_THRESHOLD) proteinNoV++;
        }
        if (route !== 'IV' && pk.F == null) noF++;
        if (route !== 'IV' && pk.ka_hr == null) noKa++;
      }
    }
    if (noV > 0) {
      warn(
        '(catalog)',
        'pk.defaulted-volume',
        `${noV} of ${rows} pk route rows carry no V_L across ${compoundsNoV.size} compounds — each renders at a DEFAULT volume, which sets the whole concentration scale: ${DEFAULT_V_L_PER_KG_PROTEIN} L/kg (${litresAtReference(DEFAULT_V_L_PER_KG_PROTEIN)} L) for the ${proteinNoV} rows at MW >= 10 kDa, ${DEFAULT_V_L_PER_KG} L/kg (${litresAtReference(DEFAULT_V_L_PER_KG)} L) for the rest; ${sourcedNoV} of those rows carry a source_pmid or source_label, claiming provenance for a number their citation never stated`,
      );
    }
    if (noF > 0 || noKa > 0) {
      warn(
        '(catalog)',
        'pk.defaulted-params',
        `${noF} extravascular rows default F to ${DEFAULT_F} and ${noKa} default ka to ${DEFAULT_KA_PER_HR} — the ka default is why "ka 1" appears across dozens of unrelated compounds`,
      );
    }
  }

  // ── Nutrient-group member referential integrity: REMOVED ─────────────
  // Four rules (`nutrient-group.member-exists`, `.member-nutrition`,
  // `.min-members`, `.shared-dv`) checked a NUTRIENT_GROUPS table that rolled
  // vitamer FORMS sharing one Daily Value (B12 / folate / D / K) into a single
  // group row. That table described an application's daily-intake card, not the
  // registry, and it is deleted — so there is nothing left to iterate and the
  // rules cannot be evaluated at all.
  //
  // What they were protecting is worth restating in case the grouping ever comes
  // back as registry data: a typo or a slug rename would silently drop a form from
  // its group (falling back to an un-summed standalone row) with no failing test,
  // and members whose RDI or unit had drifted apart would ungroup the whole set,
  // because a consumer refuses to sum across two different Daily Values.

  for (const c of data) {
    // ── Every compound is visited: authored PK or a stated reason ─────
    // "Finished" in this registry means no unvisited cells, and a compound with
    // neither `pk` nor `pk_unauthored` is exactly an unvisited one: nobody has
    // looked, and every consumer renders it as if the absence were a decision.
    // Having BOTH is the opposite contradiction, a record that claims PK was not
    // authored while carrying authored PK. Both used to be caught only by a test
    // over the real data, so an agent that ran `pnpm validate` alone shipped them.
    const hasPk = Object.keys(c.pk ?? {}).length > 0;
    if (!hasPk && !c.pk_unauthored) {
      err(
        c.slug,
        'compound.unvisited',
        'no authored pk[route] and no pk_unauthored reason — author PK or declare why it is absent',
      );
    }
    if (hasPk && c.pk_unauthored) {
      err(
        c.slug,
        'compound.pk-and-unauthored',
        `carries authored pk (${Object.keys(c.pk ?? {}).join(', ')}) AND pk_unauthored "${c.pk_unauthored.reason}" — keep one`,
      );
    }

    // ── pk routes must be in routes[] ────────────────────────────────
    // A pk[X] entry for a route the compound does not list is dead data — nothing
    // looks up pk by a route absent from `routes[]`, and the dosing UI does not
    // offer it either.
    if (c.pk && c.routes) {
      for (const route of Object.keys(c.pk)) {
        if (!(c.routes as readonly string[]).includes(route)) {
          err(
            c.slug,
            'pk.route-listed',
            `pk has route ${route} not in routes[${c.routes.join(',')}]`,
          );
        }
      }
    }

    // ── pk completeness for each authored route ──────────────────────
    // Missing fields are filled with category defaults, but a partial pk[route]
    // entry that has a source_pmid claims provenance for numbers it does not
    // actually carry — misleading.
    for (const [route, pk] of pkRoutes(c)) {
      const hasMm = pk.mm_vmax_per_hr != null && pk.mm_km_mg_per_l != null;
      const hasLinearKe = pk.ke_hr != null || halfLifeOf(c, route) != null;
      if (!hasMm && !hasLinearKe) {
        err(
          c.slug,
          'pk.elimination',
          `pk.${route} has no ke_hr, half_life_hr[${route}], or MM params — nothing can derive elimination`,
        );
      }
      if (pk.F != null && (pk.F < 0 || pk.F > 1)) {
        err(c.slug, 'pk.f-range', `pk.${route}.F = ${pk.F} outside [0, 1]`);
      }
      // Intravenous bioavailability is 1 by definition. A stored IV F below that is
      // either a typo or an extravascular value filed under the wrong route, and
      // exposure arithmetic would have to choose between ignoring it and scaling an
      // IV dose by it; both are wrong, so it is refused.
      if (route === 'IV' && pk.F != null && pk.F !== 1) {
        err(c.slug, 'pk.iv-f', `pk.IV.F = ${pk.F} — intravenous F is 1 by definition`);
      }
      // A missing V_L is not a gap anything reports — 0.5 L/kg (35 L at the 70 kg
      // reference) is silently substituted, and that sets the ENTIRE concentration
      // scale of the record. linagliptin rendered 10.4× high on AUC that way. It
      // only becomes visible when something consumes the concentration, so the
      // per-compound warning is scoped to records with occupancy rows; the
      // catalog-level total above carries the rest.
      //
      // THIS IS A STANDING CAVEAT, NOT A TASK LIST (established 2026-09-08). Every
      // record it currently names has ALREADY been audited, and the volume is
      // absent precisely BECAUSE that audit removed an unsourceable one: sotalol's
      // was "the EXACT MIDPOINT of a review" range, sulindac's was "unsourced and
      // no intravenous study exists", pregabalin's and melatonin's were the default
      // wearing a citation, and triazolam's 77 L was the study subjects' "mean body
      // weight of 77 kg". The count rising is the audit working. Do not read it as
      // a backlog and do not close it by inventing a number.
      //
      // The message states a DIRECTION where the catalog supports one, but the
      // direction is NOT uniform and this rule used to claim it was. Three regimes,
      // measured from the catalog's own authored volumes:
      //
      //   · small molecules (< 10 kDa MW, or no MW authored) — 73% of 609 authored
      //     rows exceed 35 L, median 87 L. Defaulting understates volume,
      //     overstates Cp, biases occupancy HIGH.
      //   · proteins (>= 10 kDa) — ALL 18 authored volumes fall BELOW 35 L
      //     (3.1-9.25 L). These default to 0.08 L/kg instead, so the old warning
      //     both misstated the number and pointed the wrong way.
      //   · mid-size peptides (3-10 kDa) — 6 authored volumes span 7.7-200 L with
      //     35 L inside the spread. The direction is genuinely UNKNOWN and claiming
      //     one would be false precision.
      //
      // Hence the per-regime message below. Saying "biased HIGH" to a
      // retatrutide-shaped record was worse than saying nothing: it pointed a
      // curator at the wrong correction.
      if (pk.V_L == null && (c.receptor_occupancy ?? []).length > 0) {
        const mw = c.mw_g_mol;
        const isProtein = mw != null && mw >= PROTEIN_MW_THRESHOLD;
        const isMidPeptide = mw != null && mw >= 3_000 && mw < PROTEIN_MW_THRESHOLD;
        const applied = isProtein
          ? `${DEFAULT_V_L_PER_KG_PROTEIN} L/kg (${litresAtReference(DEFAULT_V_L_PER_KG_PROTEIN)} L)`
          : `${DEFAULT_V_L_PER_KG} L/kg (${litresAtReference(DEFAULT_V_L_PER_KG)} L)`;
        const direction = isProtein
          ? `every one of this catalog's 18 authored volumes at MW >= 10 kDa falls in 3.1-9.25 L, so the class default is close and the residual error is small but unsigned`
          : isMidPeptide
            ? `at ${Math.round(mw)} Da this sits in the 3-10 kDa band, where the catalog's 6 authored volumes span 7.7-200 L and 35 L falls INSIDE that spread — the direction of the error is unknown, and a class default measurably does not help (leave-one-out: 3.67x vs 3.17x). Needs a real volume, not a better guess`
            : `73% of this catalog's authored volumes exceed that (median 87 L), so occupancy on this record is most likely biased HIGH by roughly the ratio of the true volume to ${litresAtReference(DEFAULT_V_L_PER_KG)} L`;
        warn(
          c.slug,
          'pk.defaulted-volume',
          `pk.${route} has no V_L — ${applied} is silently used, which sets the whole concentration scale. ${direction}`,
        );
      }
    }

    // ── Kinetic interaction edges require provenance + perpetrator MW ─
    // The Ki is in µM in literature; a plasma curve is in mg/L. Without mw_g_mol on
    // the perpetrator the µM → mg/L conversion cannot run and the kinetic block is
    // inert.
    for (let i = 0; i < (c.interactions?.length ?? 0); i++) {
      const edge = c.interactions![i]!;
      if (!edge.kinetics) continue;

      if (!edge.source_pmid) {
        err(
          c.slug,
          'interactions.kinetics-pmid',
          `interactions[${i}] (→${edge.slug}) has kinetics but no source_pmid`,
        );
      }
      // ── A calibrated Ki must carry the arithmetic that produced it ──
      // ki_uM = assumed_perp_uM / (auc_ratio − 1). Storing all three makes the
      // calibration reconstructible and this check possible; without them a
      // clinical fold-change inverted through an assumed exposure is
      // indistinguishable from a measured affinity, which is how 120 entries came
      // to sit in a field documented as "a published Ki".
      const k = edge.kinetics;
      if (k.ki_basis === 'calibrated_from_auc') {
        if (k.auc_ratio == null || k.assumed_perp_uM == null) {
          err(
            c.slug,
            'interactions.ki-calibration-incomplete',
            `interactions[${i}] (→${edge.slug}) declares ki_basis 'calibrated_from_auc' but omits auc_ratio and/or assumed_perp_uM — the calibration is then unreconstructible`,
          );
        } else if (k.ki_uM != null) {
          const implied = k.assumed_perp_uM / (k.auc_ratio - 1);
          if (Math.abs(implied - k.ki_uM) / k.ki_uM > 0.02) {
            err(
              c.slug,
              'interactions.ki-calibration-mismatch',
              `interactions[${i}] (→${edge.slug}) ki_uM ${k.ki_uM} but assumed_perp_uM/(auc_ratio−1) = ${implied.toFixed(4)} — the stored constant does not reproduce the declared fold-change`,
            );
          }
        }
      } else if (k.auc_ratio != null || k.assumed_perp_uM != null) {
        warn(
          c.slug,
          'interactions.ki-basis-unstated',
          `interactions[${i}] (→${edge.slug}) carries calibration inputs but ki_basis is not 'calibrated_from_auc'`,
        );
      }
      if (edge.kinetics.ki_uM != null && !c.mw_g_mol) {
        err(
          c.slug,
          'interactions.ki-needs-mw',
          `interactions[${i}] (→${edge.slug}) has ki_uM but perpetrator lacks mw_g_mol — µM→mg/L conversion will skip`,
        );
      }
      if (edge.kinetics.induction_factor != null && edge.kinetics.induction_factor <= 0) {
        err(
          c.slug,
          'interactions.induction-positive',
          `interactions[${i}] induction_factor must be > 0`,
        );
      }
      // Counterparty must exist in the registry. Off-registry edges are allowed for
      // informational notes (caffeine ↔ "adenosine" pre-cataloging) but a kinetic
      // block on an off-registry edge cannot possibly modulate any victim curve.
      if (!bySlug.has(edge.slug)) {
        err(
          c.slug,
          'interactions.target-exists',
          `interactions[${i}] kinetic edge points to unknown slug "${edge.slug}"`,
        );
      }
    }

    // ── receptor_occupancy needs effect_compartment ──────────────────
    // The Hill curve runs against Ce(t), not Cp(t). Without a keo there is no Ce,
    // so the TIME COURSE cannot be computed.
    //
    // SCOPED TO RECORDS THAT COULD HAVE ONE, and the narrowing was earned. This
    // fired as a flat error and its justification — "the occupancy curve is
    // identically zero, useless and confusing" — is about a curve, while the
    // affinity table is rendered from the rows alone and never touches
    // `effect_compartment` at all. Its own sibling three rules down says so
    // outright: `pd.needs-solvable-pk` calls the same shape a WARNING and adds
    // "affinity and dose-response still render". Both could not be right.
    //
    // So the split follows what a keo could actually buy. With a solvable route
    // the curve is computable and simply is not computed — an authoring gap, and
    // still an error. With NO solvable route there is no Cp AT ALL to equilibrate
    // against, so a keo is not merely unhelpful but meaningless: it is the rate
    // of approach to a concentration this record does not have. Erroring there
    // demanded a number that could describe nothing. That case is not silent —
    // `pd.needs-solvable-pk` already warns on it, and says exactly that.
    //
    // AN EARLIER VERSION OF THIS COMMENT ARGUED FROM A FALSE PREMISE, that
    // `source_pmid` is required on an effect compartment so a keo could not be
    // supplied without inventing a citation. It is OPTIONAL — 196 records carry
    // an `approximated: true` keo with a note and no PMID. The narrowing does not
    // rest on that and never needed to: it rests on the renderer, which reads the
    // occupancy rows and never reads `effect_compartment`.
    //
    // halofuginone is the case that exposed this. Its EPRS Ki is verbatim from
    // full text; its one human PK study publishes no parameter, so there is no
    // curve for a keo to belong to.
    if (c.receptor_occupancy && c.receptor_occupancy.length > 0) {
      if (!c.effect_compartment?.keo_per_h && anyRouteSolvable(c)) {
        err(
          c.slug,
          'receptor.needs-keo',
          `${c.receptor_occupancy.length} receptor_occupancy entr${c.receptor_occupancy.length === 1 ? 'y' : 'ies'} and a solvable route, but no effect_compartment.keo_per_h — Ce(t) is computable and is not computed`,
        );
      }
      // Receptor keys must be canonical: anything that unions per-compound curves
      // groups by EXACT key, so an alias (MOR vs mu_opioid) silently fragments one
      // receptor into two. A compound carrying two entries that resolve to the same
      // target is a duplicate-authoring smell that union math cannot resolve.
      const recSeen = new Map<string, number>();
      for (let i = 0; i < c.receptor_occupancy.length; i++) {
        const site = c.receptor_occupancy[i]!;
        if (RECEPTOR_ALIASES[site.receptor]) {
          err(
            c.slug,
            'receptor.alias',
            `receptor_occupancy[${i}] uses non-canonical key "${site.receptor}" — use "${RECEPTOR_ALIASES[site.receptor]}"`,
          );
        }
        // One vocabulary on the rows: the occupancy shorthand, never the gene key
        // it resolves to. Mixing them would let a compound carry "5-HT2A" and
        // "HTR2A" as if they were two receptors.
        const shorthand = SHORTHAND_FOR_GENE_KEY.get(site.receptor);
        if (shorthand) {
          err(
            c.slug,
            'receptor.gene-key',
            `receptor_occupancy[${i}] uses the catalog gene key "${site.receptor}" — rows use the occupancy key "${shorthand}", which resolves to it`,
          );
        }
        const target = targetKeyFor(site.receptor);
        recSeen.set(target, (recSeen.get(target) ?? 0) + 1);
        // A regulatory label is primary provenance, as it is on a pk route: for
        // several agents it is the only public document stating an affinity, and
        // refusing it deletes real pharmacology or pushes the row back onto a
        // curation-database midpoint. What we still refuse is a row with
        // NEITHER, because then the number cannot be re-derived from anything.
        if (!site.source_pmid && !site.source_label) {
          err(
            c.slug,
            'receptor.pmid',
            `receptor_occupancy[${i}] (${site.receptor}) has no source_pmid and no source_label`,
          );
        }
        // ── The number has to come from a paper someone read ──────────
        // Two shapes of unsourced affinity, both of which pass `receptor.pmid`
        // above and `pnpm verify` afterwards, because in both the PMID is real.
        // They are ordered, not independent: a midpoint of a GtoPdb range is
        // both, and the derived message is the more specific of the two.
        const occNote = site.note ?? '';
        if (occupancyNoteAsserts(occNote, OCCUPANCY_DERIVED_FROM_RANGE)) {
          warn(
            c.slug,
            'receptor.derived-value',
            `receptor_occupancy[${i}] (${site.receptor}) note says the stored constant is a midpoint or mean of a RANGE of published values — no paper states it, and the cited abstract cannot (HYGIENE R3). Re-source to one fetched measurement, or write the derivation's inputs and arithmetic onto the record`,
          );
        } else if (
          occupancyNoteAsserts(occNote, OCCUPANCY_CURATED_SOURCE, {
            require: AFFINITY_TOKEN,
            reject: OCCUPANCY_CORROBORATION,
          })
        ) {
          warn(
            c.slug,
            'receptor.secondary-source',
            `receptor_occupancy[${i}] (${site.receptor}) takes its constant from IUPHAR/GtoPdb while source_pmid cites the paper that database attributes it to — a citation nobody in the chain fetched (README rule 2). Read that paper and store what it states, or say on the record that the database is the source`,
          );
        }
        if (site.emax <= 0 || site.emax > 1) {
          err(
            c.slug,
            'receptor.emax-range',
            `receptor_occupancy[${i}].emax = ${site.emax} outside (0, 1]`,
          );
        }
        if (site.ec50_mg_l <= 0) {
          err(c.slug, 'receptor.ec50-positive', `receptor_occupancy[${i}].ec50_mg_l must be > 0`);
        }
        if (site.hill_n <= 0) {
          err(c.slug, 'receptor.hill-positive', `receptor_occupancy[${i}].hill_n must be > 0`);
        }
      }
      for (const [rec, n] of recSeen) {
        if (n > 1) {
          warn(
            c.slug,
            'receptor.duplicate',
            `${n} receptor_occupancy entries resolve to the same target "${rec}" — composite occupancy can't distinguish them; consolidate or re-author`,
          );
        }
      }
    }

    // ── effect_compartment provenance ────────────────────────────────
    // A keo is either fitted from a published PK/PD model (source_pmid) or an
    // openly-declared estimate (approximated + note explaining the reasoning). The
    // one state we reject is a bare number: for whole mechanism classes no
    // effect-compartment model has ever been published, and a value that is
    // silently an estimate is indistinguishable from one whose citation was simply
    // lost.
    const ec = c.effect_compartment;
    if (ec?.keo_per_h) {
      if (!ec.source_pmid && !ec.approximated) {
        warn(
          c.slug,
          'effect.pmid',
          'effect_compartment.keo_per_h authored but no source_pmid and not marked approximated',
        );
      }
      if (ec.approximated && ec.source_pmid) {
        err(
          c.slug,
          'effect.approx-conflict',
          'effect_compartment is marked approximated AND cites a source_pmid — a fitted value is not an estimate; drop whichever claim is untrue',
        );
      }
      if (ec.approximated && !ec.note) {
        warn(
          c.slug,
          'effect.approx-note',
          'effect_compartment.approximated is set but no note records the reasoning (clinical onset, or the class analogue the value mirrors)',
        );
      }
      // A cited kₑₒ whose own note admits it is an estimate is a fit that never
      // happened: the PMID anchors the pharmacology, not the number, and a surface
      // renders it as a fitted measurement. Flag it so the authoring session sets
      // `approximated` (and moves the PMID to refs[]) instead of leaving the
      // admission in prose where no surface can see it.
      // Sentence-scoped through `assertsOfThisRecord`: a corrected keo note
      // routinely describes the estimate it REPLACED ("Replaces 6.93/h, computed
      // from a narrative review"), and reading that as an admission about the
      // stored value inverts the rule's meaning.
      const admitsEstimate = (ec.note ?? '')
        .split(/(?<=[.;])\s+/)
        .some((line) => KEO_NOTE_ADMITS_ESTIMATE.test(line) && assertsOfThisRecord(line));
      if (ec.source_pmid && !ec.approximated && ec.note && admitsEstimate) {
        warn(
          c.slug,
          'effect.approx-in-note',
          `effect_compartment cites ${ec.source_pmid} but its note admits the kₑₒ is an estimate — set approximated:true and cite the paper in refs[] instead`,
        );
      }
      // An animal-fitted keo is legitimate — GHB's comes from a rat EEG model,
      // oxycodone's from sheep brain:blood equilibration — but the species has to
      // be in the data, not only in the prose, or the compound reads as a human
      // measurement.
      // Scoped to FITTED values. An `approximated` note is prose explaining why no
      // measurement was adopted, and it routinely names the animal studies it
      // REJECTED — metoprolol's says a rat paper's quoted figure "appears nowhere
      // in its abstract", tofacitinib's that its cited rat study "stat[es] no
      // equilibration value at all". Those notes name a species precisely because
      // the value is NOT sourced to it, so firing on them inverted the rule's
      // meaning.
      if (!ec.approximated && !ec.source_species && ec.note && keoNoteNamesAnimalSource(ec.note)) {
        warn(
          c.slug,
          'effect.species-in-note',
          `effect_compartment.note names a non-human species as the source but effect_compartment.source_species is unset — declare it so the value can be labelled`,
        );
      }
    }

    // ── PD authored against a record nothing can solve ────────────────
    // Hill occupancy runs on Ce(t), and Ce is integrated from Cp(t). If NO route
    // yields an elimination rate, Cp is never computed, so Ce is identically zero.
    //
    // MESSAGE CORRECTED 2026-09-08 by checking the consumers instead of assuming
    // them. It used to say every occupancy curve "render[s] identically zero", and
    // that is not what happens — every call site guards. A compound page renders a
    // static affinity table; a receptor page sweeps a SYNTHETIC Ce range for its
    // dose-response curve and never touches this compound's PK; and the
    // intake-driven paths skip a compound with no Cp. The real cost is narrower and
    // worth stating exactly: the TIME-COURSE half of this data can never be used. A
    // warning that overstates its symptom is one authors learn to discount.
    //
    // AND ALL TWELVE CURRENT CASES ARE CORRECT DELIBERATE STRIPS, verified
    // 2026-09-08. An older backlog entry called four of them "re-authorable"
    // (alogliptin, nilotinib, enzalutamide, tolterodine); that entry PREDATES their
    // audit and is wrong. Each now carries a decisive pk_unauthored reason:
    // alogliptin's F was a two-step digit collision from a urinary recovery,
    // nilotinib has no IV form and food moves exposure 50-182%, enzalutamide has
    // TWO CO-EQUAL ANALYTES (parent 368 vs parent+M2 828 µg·h/mL), and tolterodine's
    // bioavailability "ranged from 10 to 70%" because that range IS the CYP2D6
    // split. No scalar represents any of them. Like pk.defaulted-volume, this is a
    // standing state rather than a task list — the occupancy rows are real
    // pharmacology and stay.
    if (c.effect_compartment || (c.receptor_occupancy?.length ?? 0) > 0) {
      if (!anyRouteSolvable(c)) {
        const what = c.receptor_occupancy?.length
          ? `${c.receptor_occupancy.length} receptor_occupancy row(s)${c.effect_compartment ? ' + keo' : ''}`
          : 'effect_compartment.keo_per_h';
        warn(
          c.slug,
          'pd.needs-solvable-pk',
          `${what} authored but no route yields an elimination rate — affinity and dose-response still render, but Ce(t) is never computed, so this record contributes nothing to any time-course occupancy surface`,
        );
      }
    }

    // ── An in-vitro Ki needs a fraction unbound to be comparable ──────
    // ec50_mg_l is, on almost every authored row, a binding affinity measured
    // against FREE drug — while a plasma curve is TOTAL. Without `fraction_unbound`
    // the two are compared directly, overstating occupancy by roughly 1/fu, which
    // for a 90-99%-bound molecule is one to two orders of magnitude. A row whose
    // basis is an in-vivo plasma EC50 is already referenced to total plasma and
    // needs no correction.
    // Monoclonals and Fc-fusion proteins are exempt: an IgG is not albumin- or
    // AAG-bound, so "fraction unbound in plasma" is not a property it has, and its
    // total plasma concentration IS the concentration available to bind target. All
    // 13 biologics carrying occupancy rows are IgG mAbs or an Fc-fusion;
    // small-molecule protein binding does not describe them.
    // Also skipped where no route yields an elimination rate: those records already
    // carry pd.needs-solvable-pk, their time-course occupancy is absent regardless,
    // and an fu cannot change a curve that is never computed. Warning twice about
    // one unusable row is noise, not a finding.
    if (c.category !== 'biologic' && anyRouteSolvable(c)) {
      const needsFu = (c.receptor_occupancy ?? []).filter(
        (r) => (r.basis ?? 'in_vitro_ki') === 'in_vitro_ki',
      );
      // An fu_note with no value means the question was examined and the answer was
      // "deliberately not authored" — a decision, not a gap. Before this state
      // existed, such reasoning lived in prose the rule could not read, so it
      // re-reported settled questions (eplerenone's binding is
      // concentration-dependent across the therapeutic range, which is a reason NOT
      // to author a scalar).
      if (needsFu.length > 0 && c.fraction_unbound == null && !c.fu_note) {
        warn(
          c.slug,
          'pd.occupancy-needs-fu',
          `${needsFu.length} in-vitro-Ki occupancy row(s) but no fraction_unbound — a free-drug affinity is being compared against the TOTAL plasma curve, biasing occupancy high by ~1/fu`,
        );
      }
    }

    // ── A prodrug's curve must say which molecule it models ──────────
    // Where a compound converts to an active species, "the half-life" is ambiguous:
    // the parent and the active metabolite routinely differ by an order of
    // magnitude, and both are legitimate things to model. Carisoprodol stored its
    // METABOLITE's 8 h against a parent 2 h until 2026-09-06, and prednisone's
    // whole block turned out to describe prednisolone. Neither was detectable
    // without reading the prose, because a number alone carries no analyte. Stating
    // it in a FIELD is what makes the record checkable.
    //
    // Records that ARE the active metabolite of something else (desipramine,
    // fexofenadine) are exempt — there is no parent curve at issue for them.
    {
      const prose = `${c.mechanism ?? ''} ${c.notes ?? ''}`;
      const converts =
        /\bprodrug\b|is (?:rapidly |extensively )?(?:metabolised|metabolized|hydrolys(?:ed|ized)|converted|de-?esterified) (?:in [^.]{0,30} )?to\b/i;
      const isTheMetabolite = /\b(?:is|are) (?:the |an |a )?(?:active |major )?metabolite of\b/i;
      // The claim now lives in a FIELD rather than in prose. Sniffing notes for a
      // declaration was unenforceable in both directions: it passed records that
      // merely used the word "analyte" and failed ones that said the same thing in
      // other words.
      // Sentence-scoped through `assertsOfThisRecord`. Whole-prose matching read
      // three records exactly backwards: valsartan's note says "no active
      // metabolite (unlike losartan)", aripiprazole's describes a REJECTED citation
      // that was for the lauroxil PRODRUG, and hydroxychloroquine's "converted to
      // base ... rather than" is a SALT conversion, not a metabolic one.
      const convertsHere = prose
        .split(/(?<=[.;])\s+/)
        .some((line) => converts.test(line) && assertsOfThisRecord(line));
      if (
        c.pk &&
        Object.keys(c.pk).length > 0 &&
        convertsHere &&
        !(isTheMetabolite.test(prose) && !/\bprodrug\b/i.test(prose)) &&
        c.pk_analyte == null
      ) {
        warn(
          c.slug,
          'pk.prodrug-analyte-unstated',
          'converts to an active species but pk_analyte is unset — say whether the stored PK describes the parent, the active metabolite or the active moiety; the three routinely differ by an order of magnitude',
        );
      }
    }

    // ── A dose-moiety fraction must carry its arithmetic ─────────────
    // `dose_moiety_fraction` silently rescales every dose on the record, and it is
    // a bare stoichiometric constant — 0.188 says nothing about which salt it came
    // from or which analyte it leaves. Without the note there is no way to review
    // it, and a wrong one is invisible: the curve simply moves. Mirrors
    // effect.approx-note.
    if (c.dose_moiety_fraction != null && !c.dose_moiety_note) {
      warn(
        c.slug,
        'dose.moiety-note',
        `dose_moiety_fraction ${c.dose_moiety_fraction} is set but no dose_moiety_note records the salt, the analyte and the arithmetic — a bare stoichiometric constant is unreviewable`,
      );
    }
    // The inverse: a record whose prose says the dose is a salt while pk[] describes
    // the base, with no fraction set, is silently overstating every concentration by
    // the counter-ion's share.
    if (
      c.dose_moiety_fraction == null &&
      SALT_DOSE_PROSE.test(`${c.mechanism ?? ''} ${c.notes ?? ''}`)
    ) {
      warn(
        c.slug,
        'dose.salt-moiety-unset',
        'prose says the dose is a salt while pk[] describes the free base or ion, but dose_moiety_fraction is unset — a salt mass would be divided by a free-base volume',
      );
    }

    // ── Animal-derived route params must declare their species ───────
    // Same principle as the keo rule above, on the PK side. The registry permits
    // animal PK where no human study exists, but an undeclared rat or dog value is
    // indistinguishable from a human one on every surface.
    // Narrower than the keo rule on purpose. A compound's `notes` is long free text
    // that routinely discusses animal studies it REJECTED ("the only subcutaneous
    // data are RAT ... not imported"), so the sentence-level test used for the keo
    // note produces false positives here. Only an affirmative claim that THIS
    // record's PK is animal counts.
    const ANIMAL_PK_CLAIM =
      /\b(?:PK|pharmacokinetics|half-life|values?|parameters?)\s+(?:is|are|was|were)\s+(?:the\s+)?(rat|mouse|murine|dog|canine|pig|porcine|sheep|ovine|rabbit|monkey|equine|horse|bovine)\b/i;
    for (const [route, pk] of pkRoutes(c)) {
      if (pk.source_species) continue;
      if (c.notes && ANIMAL_PK_CLAIM.test(c.notes)) {
        warn(
          c.slug,
          'pk.species-in-note',
          `notes name a non-human species as a PK source but pk.${route}.source_species is unset — declare it so the curve can be labelled`,
        );
        break;
      }
    }

    // ── PK source_pmid expected when literature exists ───────────────
    // Compounds with no pk entries are exempt; a pk entry that lacks provenance
    // gets a warning so the gap is visible.
    for (const [route, pk] of pkRoutes(c)) {
      // A regulatory label is a legitimate primary source (see RoutePk.source_label)
      // — for many modern agents it is the only public document stating Cmax /
      // t-half / F together. What we refuse to allow is a route with NEITHER,
      // because then a reader has no way to re-derive the numbers.
      if (!pk.source_pmid && !pk.source_label) {
        warn(c.slug, 'pk.pmid', `pk.${route} has params but no source_pmid or source_label`);
      }
      /*
       * A LABEL IS REVISED IN PLACE, so "FDA label: Prezista" points at whatever
       * it says today, not at the sentence the value came from. WORKFLOW asks a
       * `source_label` to name the product, the SET ID and the effective date
       * for exactly that reason, and `pnpm verify` cannot help: it resolves
       * PMIDs, and a label has none.
       *
       * So this is the only re-findability check a label citation gets, and it
       * is offline. A DailyMed set id is a UUID; an EMA SmPC has no set id, so
       * an ISO date is accepted instead as the thing that pins which revision
       * was read. Warning, not error: 25 of the 28 label rows predate the rule
       * and each names a real product, which is most of the way there.
       */
      if (
        pk.source_label &&
        CLAIMS_A_LABEL.test(pk.source_label) &&
        !HAS_SET_ID.test(pk.source_label) &&
        !HAS_ISO_DATE.test(pk.source_label)
      ) {
        warn(
          c.slug,
          'pk.label-revision',
          `pk.${route} cites a label but names neither a set id nor an effective date, and a label is revised in place — the sentence the value came from cannot be found again`,
        );
      }
      // A ROUTE CITING BOTH IS NOT A DEFECT, and this rule used to say it was. A
      // route row is a BUNDLE of three or four values, and they can legitimately
      // come from different documents: agomelatine, ivabradine, nebivolol,
      // propylthiouracil and trandolapril each cite a primary for most of the row
      // while the label supplies one value — always the one no abstract states,
      // always named explicitly in the label text ("F ~40% is a secondary/label
      // figure", "V 30 L is review-derived"). That is richer provenance than either
      // source alone, and the audit passes created it on purpose. The rule fired on
      // all five and on nothing else. Per-field provenance would let this be checked
      // properly; until then, saying which value came from where in `note` is the
      // contract.
    }

    // ── a quotation announced and not given ───────────────────────────
    // `verify:quotes` is OPT-IN BY KEYWORD: it checks a quoted span, so a note that
    // says "verbatim:" and then paraphrases is invisible to it and passes a gate it
    // never entered. That is not hypothetical — three separate rows this month
    // claimed a verbatim value with no quotation, and reading the sources showed one
    // of them (`tolterodine`) had two candidate figures in the cited sentence, of
    // which the stored one was right and the neighbouring one was a DIFFERENT
    // SPECIES. The paraphrase hid a choice that mattered.
    //
    // A table cell is the honest exception and is NOT a defect: a figure read from
    // Table 1 is not a sentence and cannot be quoted as one. The fix for those rows
    // is to say "full text", which `verify:quotes` already exempts by design, rather
    // than to invent a sentence around a number.
    {
      const gaps: string[] = [];
      announcedQuoteGaps(c, '', gaps);
      for (const origin of gaps) {
        warn(
          c.slug,
          'note.announced-quote-missing',
          `${origin} announces a quotation ("verbatim:") and gives none, so verify:quotes cannot check it — quote the sentence, or say "full text" if the value came from a table`,
        );
      }
    }

    // ── systems[] tagging ─────────────────────────────────────────────
    // An untagged compound falls into the "untagged" bucket and does not appear on
    // per-system surfaces. This was a warning while a bulk-tagging pass was in
    // flight, on the promise that it would flip to an error once tagging was
    // complete. Coverage reached every compound on 2026-09-06, so it is now an
    // error: the backlog is closed and the only remaining source of an untagged
    // compound is drift on a newly-authored one, which is exactly what a gate is
    // for.
    if (!c.systems || c.systems.length === 0) {
      err(
        c.slug,
        'systems.tagged',
        'no systems[] tagged — would appear only under the Untagged filter',
      );
    } else {
      for (const s of c.systems) {
        if (!(SYSTEM_IDS as readonly string[]).includes(s)) {
          err(
            c.slug,
            'systems.valid',
            `unknown system "${s}" — must be one of ${SYSTEM_IDS.join(', ')}`,
          );
        }
      }
      const seenSys = new Set<string>();
      for (const s of c.systems) {
        if (seenSys.has(s)) err(c.slug, 'systems.unique', `duplicate system tag "${s}"`);
        seenSys.add(s);
      }
    }
  }

  // ── An occupancy key the target catalog does not describe ────────────
  // NEW RULE, and one that was impossible before: the linter was handed
  // `{ compounds, pathways }` and never saw receptors.json, so nothing could check
  // that an authored `receptor_occupancy[].receptor` corresponds to a real target.
  //
  // What an unresolved key costs: the key is all a reader gets. Gene, family,
  // full name and the GtoPdb provenance anchor all come from the catalog, so an
  // uncatalogued key renders as a bare string, cannot be grouped by family, and
  // cannot be linked back to the nomenclature it was named after.
  //
  // WHY IT IS A WARNING AND WHY IT IS REPORTED ONCE FOR THE CATALOG rather than
  // per compound: a miss is a property of the KEY, not of the record. The fix is
  // one catalog entry or one OCCUPANCY_TARGET_KEYS line per key, not an edit to
  // each compound using it, and a per-compound warning would report the same
  // missing entry dozens of times. Keys resolve through `targetKeyFor`, so the
  // GPCR shorthand ("5-HT2A") finds its gene-keyed entry ("HTR2A"); what remains
  // are keys with no single target, like the class-level `alpha_1`.
  {
    const catalogued = new Set<string>([
      ...registry.receptors.receptors.map((r) => r.key),
      ...registry.receptors.nonGpcrTargets.map((t) => t.key),
    ]);
    const unknown = new Map<string, { rows: number; example: string }>();
    for (const c of data) {
      for (const site of c.receptor_occupancy ?? []) {
        const key = targetKeyFor(site.receptor);
        if (catalogued.has(key)) continue;
        const prior = unknown.get(key);
        if (prior) prior.rows++;
        else unknown.set(key, { rows: 1, example: c.slug });
      }
    }
    if (unknown.size > 0) {
      const listed = [...unknown]
        .sort((a, b) => b[1].rows - a[1].rows || a[0].localeCompare(b[0]))
        .map(([key, v]) => `${key} (${v.rows} row${v.rows === 1 ? '' : 's'}, e.g. ${v.example})`)
        .join(', ');
      warn(
        '(catalog)',
        'receptor.unknown-target',
        `${unknown.size} occupancy keys are not catalogued in receptors.json, so each renders as a bare key with no gene, family or GtoPdb anchor: ${listed}`,
      );
    }
  }

  // ── Pathways ─────────────────────────────────────────────────────────
  // Cross-reference pathways against compounds. Pathways are sparse (a few
  // hundred) so the inner loops are cheap. Pathway SHAPE is not re-validated here
  // — the loader's schema runs first and would have thrown. Linting is restricted
  // to the cross-record invariants the loader cannot see:
  //  1. Slug uniqueness across pathways
  //  2. Step from_slug/to_slug references must resolve (error if
  //     present-but-missing, because explicitly claimed). The free-text from/to
  //     labels are NOT checked — most pathway endpoints are processes and states,
  //     not molecules.
  //  3. via_slug references must resolve (error if present-but-missing, because
  //     explicitly claimed)
  //  4. modulator.slug must resolve (error — a modulator is by definition a
  //     registered compound)

  const pathwaySeen = new Set<string>();
  for (const p of pathwayData) {
    if (pathwaySeen.has(p.slug)) {
      err(p.slug, 'pathway.slug-unique', 'duplicate pathway slug');
    }
    pathwaySeen.add(p.slug);

    for (let i = 0; i < (p.steps ?? []).length; i++) {
      const step = p.steps[i]!;
      // from/to are FREE TEXT and most endpoints are processes, not molecules
      // ("cortical pyramidal glutamate release", "5-HT2A -> Gq -> PLC"). We used to
      // warn whenever one didn't resolve, which fired 1,613 times and was
      // unactionable by construction. The checkable claim now lives in
      // from_slug/to_slug, which are errors when present-but-missing — the same
      // contract via_slug has always had.
      if (step.from_slug && !bySlug.has(step.from_slug)) {
        err(
          p.slug,
          'pathway.step-from-slug',
          `step[${i}].from_slug "${step.from_slug}" claimed but not in registry`,
        );
      }
      if (step.to_slug && !bySlug.has(step.to_slug)) {
        err(
          p.slug,
          'pathway.step-to-slug',
          `step[${i}].to_slug "${step.to_slug}" claimed but not in registry`,
        );
      }
      if (step.via_slug && !bySlug.has(step.via_slug)) {
        err(
          p.slug,
          'pathway.via-slug',
          `step[${i}].via_slug "${step.via_slug}" claimed but not in registry`,
        );
      }
      // String-length limits enforced by the loader's schema (pathwayStep): from/to
      // ≤80, via ≤120, note ≤500. These are HARD — exceeding them makes
      // loadPathways throw, so they must be errors here, not warnings. A gate that
      // names the offending field is worth more than a parse error at load.
      if (step.from.length > 80)
        err(p.slug, 'pathway.step-len', `step[${i}].from ${step.from.length} > 80 chars`);
      if (step.to.length > 80)
        err(p.slug, 'pathway.step-len', `step[${i}].to ${step.to.length} > 80 chars`);
      if (step.via && step.via.length > 120)
        err(p.slug, 'pathway.step-len', `step[${i}].via ${step.via.length} > 120 chars`);
      if (step.note && step.note.length > 500)
        err(p.slug, 'pathway.step-len', `step[${i}].note ${step.note.length} > 500 chars`);
    }
    for (let i = 0; i < (p.modulators ?? []).length; i++) {
      const m = p.modulators![i]!;
      if (!bySlug.has(m.slug)) {
        err(p.slug, 'pathway.modulator-slug', `modulators[${i}].slug "${m.slug}" not in registry`);
      }
      if (
        m.step !== undefined &&
        (!Number.isInteger(m.step) || m.step < 0 || m.step >= (p.steps ?? []).length)
      ) {
        err(
          p.slug,
          'pathway.modulator-step',
          `modulators[${i}].step ${m.step} out of range (0..${(p.steps ?? []).length - 1})`,
        );
      }
      // Loader limits: modulator target ≤120, note ≤500.
      if (m.target && m.target.length > 120)
        err(
          p.slug,
          'pathway.modulator-len',
          `modulators[${i}].target ${m.target.length} > 120 chars`,
        );
      if (m.note && m.note.length > 500)
        err(p.slug, 'pathway.modulator-len', `modulators[${i}].note ${m.note.length} > 500 chars`);
    }

    // ── Diagram overlay (optional authored DAG) ──────────────────────────
    // Shape is validated by the loader; here we cross-check that every node-id
    // reference resolves and coords sit on the design canvas. Pathways without a
    // `diagram` (almost all) skip this entirely.
    const diagram = p.diagram;
    if (diagram) {
      const nodeIds = new Set<string>();
      for (let i = 0; i < diagram.nodes.length; i++) {
        const n = diagram.nodes[i]!;
        if (nodeIds.has(n.id)) {
          err(p.slug, 'pathway.diagram-node-dup', `diagram.nodes[${i}].id "${n.id}" duplicated`);
        }
        nodeIds.add(n.id);
        // Coords (when present) live on a 1500 × 1060 design canvas; allow a
        // generous margin for side chips / feedback labels.
        if (n.x !== undefined && (n.x < -200 || n.x > 1700)) {
          err(p.slug, 'pathway.diagram-coord', `diagram node "${n.id}" x=${n.x} off-canvas`);
        }
        if (n.y !== undefined && (n.y < -200 || n.y > 1260)) {
          err(p.slug, 'pathway.diagram-coord', `diagram node "${n.id}" y=${n.y} off-canvas`);
        }
      }
      const ref = (where: string, id: string) => {
        if (!nodeIds.has(id)) {
          err(p.slug, 'pathway.diagram-ref', `${where} references unknown node "${id}"`);
        }
      };
      diagram.edges.forEach((e, i) => {
        ref(`diagram.edges[${i}].from`, e.from);
        ref(`diagram.edges[${i}].to`, e.to);
      });
      (diagram.chips ?? []).forEach((c, i) => ref(`diagram.chips[${i}].target`, c.target));
      if (diagram.feedback) {
        ref('diagram.feedback.from', diagram.feedback.from);
        ref('diagram.feedback.to', diagram.feedback.to);
      }
    }
  }

  return findings;
}
