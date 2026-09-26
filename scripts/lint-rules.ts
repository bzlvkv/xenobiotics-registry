/**
 * lint-rules.ts — the registry's semantic checks, as a pure function.
 *
 * These rules are the discipline v8 carried in a push-time CI job: the checks
 * that catch data which is valid JSON, passes the Zod loader, and is still
 * wrong — a retired slug shadowing a live compound, two records claiming one
 * molecule, a keo whose own note admits it was estimated, a rat half-life with
 * no `source_species`.
 *
 * They lived inside `data-lint.ts`, which read two JSON files off disk and
 * called `process.exit`. That made them unrunnable by anything but that one
 * script — including, fatally, the publish step. v12 makes Postgres the source
 * of truth, so the checks have to run against what is about to be published
 * rather than against a file, and `build-bundle` has to be able to refuse.
 *
 * So the rules are a function of their inputs and return their findings. The
 * CLI in `data-lint.ts` is now the reporting and the exit code, and nothing
 * else. Behaviour is unchanged — this is a move, not a rewrite.
 */
import { RECEPTOR_ALIASES, canonicalReceptor } from './receptor-aliases';
import { compoundSchema } from '../packages/registry/src/loader';
import { NUTRIENT_GROUPS } from './nutrient-groups';

/**
 * kₑₒ notes that admit, in the authoring session's own words, that the value is
 * reasoned rather than fitted ("Approximation; no published kₑₒ", "matches the
 * moderate Cp→CNS lag", …). A cited kₑₒ whose note matches is an estimate wearing
 * a citation. The estimates it reads were authored in v8's
 * scripts/authoring/2026-09-06-keo-estimates.ts, which is where that record
 * lives now — v12 deleted its unrunnable copy of those scripts.
 */
/**
 * Prose that names a non-human species as the SOURCE of a value. Animal-derived
 * PK is allowed here, but it must be declared in `source_species` so surfaces
 * can label it — an unlabelled rat half-life renders exactly like a human one.
 */
const ANIMAL_WORD =
  /\b(rat|rats|mouse|mice|murine|dog|dogs|canine|beagle|pig|pigs|porcine|sheep|ovine|rabbit|rabbits|monkey|monkeys|primate|equine|horse|bovine|cow|cattle)\b/i;
/**
 * Clauses that name a species only to say it is NOT the source — "replaces the
 * prior rat-EEG citation" is a human value describing what it superseded, and
 * flagging it would train authors to ignore the rule.
 */
/**
 * Prose that says, affirmatively, that this record's DOSES are a salt while its
 * PK describes the base or ion. Deliberately narrow: the catalog discusses
 * salts constantly (a salt named in a mechanism paragraph is not a claim about
 * the dose block), and a rule that fires on every mention would be ignored.
 */
const SALT_DOSE_PROSE =
  /\b(dose|doses|dosed|tablet|capsule)s?\b[^.]{0,80}\b(?:as|of|is|are)\s+(?:the\s+)?(carbonate|maleate|hydrochloride|HCl|sulfate|sulphate|mesylate|besylate|citrate|tartrate|fumarate|succinate|acetate|phosphate|salt)\b/i;

const SUPERSEDED =
  /\b(replaces|replaced|superseded|supersedes|prior|instead of|rather than|no longer|not a|rejected)\b/i;

/**
 * Clauses that NEGATE the thing being looked for — "no active metabolite",
 * "does not convert". A prose-sniffing rule that cannot tell an assertion from
 * its negation reports the records that state most clearly that the rule does
 * NOT apply to them. valsartan's note says outright "no active metabolite
 * (unlike losartan)" and was flagged for exactly that sentence.
 */
const NEGATED =
  /\b(?:no|not|never|lacks?)\s+(?:known\s+|major\s+|significant\s+|an?\s+)?(?:active\s+)?(?:metabolite|metabolites|conversion)\b/i;

/**
 * True when a sentence is a claim about THIS record's own stored values —
 * rather than a description of something REJECTED, SUPERSEDED or NEGATED.
 *
 * Three separate rules independently grew false positives for want of this
 * (2026-09-08): the species rule fired on notes recording what they replaced,
 * the prodrug rule fired on a note saying "no active metabolite", and the
 * keo-estimate rule fired on a note describing the estimate it had just been
 * corrected AWAY from. This catalog's prose is largely a RECORD OF DECISIONS,
 * so a rule that reads prose must separate a decision's subject from its
 * outcome or it will reliably flag the best-documented records.
 */
function assertsOfThisRecord(sentence: string): boolean {
  return !SUPERSEDED.test(sentence) && !NEGATED.test(sentence);
}

/**
 * True when `effect_compartment.note` credits a non-human species as the
 * value's own source.
 *
 * This used to require an animal word AND a study word (pharmacokinetic,
 * clearance, EEG, endpoint …) in the SAME sentence. That conjunction is right
 * for a compound's `notes`, which is long free prose discussing many studies —
 * a species word alone proves nothing there, which is why the PK-side rule
 * below still uses the much narrower ANIMAL_PK_CLAIM. An effect_compartment
 * note is NOT that: the whole field is one provenance statement about one
 * value, so naming a species IS the claim.
 *
 * Requiring a study word made the rule miss every compactly-written note.
 * fentanyl's entire note was "antinociception (rat tail-flick)" — a genuine,
 * verbatim RAT keo — and atenolol's and pregabalin's put the species and the
 * study word in DIFFERENT sentences, which a per-sentence conjunction cannot
 * see. All three read as human on every surface until 2026-09-08.
 *
 * SUPERSEDED is now the only guard, and is the clause that was doing the real
 * work anyway: a keo note routinely names the animal study it REPLACED —
 * morphine's says it "Replaces prior rat-EEG citation", remifentanil's records
 * that the value it replaced was "correctly labelled DOG". Widened, exactly
 * three of the 249 keo records fire and none of those two do.
 */
function keoNoteNamesAnimalSource(text: string): boolean {
  return text
    .split(/(?<=[.;])\s+/)
    .some((sentence) => ANIMAL_WORD.test(sentence) && !SUPERSEDED.test(sentence));
}

const KEO_NOTE_ADMITS_ESTIMATE =
  /approximation|approximated from|no published k|no measured (?:human )?k|no human keo|no [\\w-]+-specific k|no .*keo modeling published|textbook approximation|captures the (?:slow|moderate|multi-week|long-tail|Cp)|matches the (?:moderate|rapid|slow) Cp|modeled here as a small keo|small keo reflects the slow|matches the sleep-onset PD timing/i;

const SYSTEM_IDS = [
  'nervous',
  'cardiovascular',
  'respiratory',
  'endocrine',
  'digestive',
  'renal',
  'reproductive',
  'musculoskeletal',
  'integumentary',
  'immune-hematologic',
] as const;

interface Compound {
  slug: string;
  name: string;
  category?: string;
  systems?: string[];
  routes?: string[];
  doses?: Record<string, unknown>;
  /** Terminal half-life per route. `unknown` here until the app's tsconfig
   *  started type-checking this file — the Zod schema has always said
   *  `z.record(route, z.number().positive())`, and two rules were already
   *  casting their way past the imprecision to do arithmetic on it. */
  half_life_hr?: Record<string, number | undefined>;
  pk?: Record<
    string,
    | {
        source_pmid?: string;
        source_label?: string;
        source_species?: string;
        ka_hr?: number;
        ke_hr?: number;
        V_L?: number;
        F?: number;
        mm_vmax_per_hr?: number;
        mm_km_mg_per_l?: number;
        alpha_hr?: number;
        beta_hr?: number;
        k21_hr?: number;
        /** Zero-order input duration — an infusion or a depot. A route with one
         *  is not relying on the ka default, which `pk.defaulted-ka-slow` reads. */
        zo_dur_hr?: number;
      }
    | undefined
  >;
  effect_compartment?: {
    keo_per_h?: number;
    source_pmid?: string;
    approximated?: boolean;
    source_species?: string;
    note?: string;
  };
  aliases?: string[];
  retired_slugs?: string[];
  pk_unauthored?: { reason?: string; note?: string };
  receptor_occupancy?: Array<{
    receptor: string;
    pathway?: string;
    emax: number;
    ec50_mg_l: number;
    hill_n: number;
    source_pmid?: string;
    /** Where the affinity came from. An in-vitro Ki is a FREE-drug number and
     *  `pd.occupancy-needs-fu` compares it against the total plasma curve. */
    basis?: string;
  }>;
  interactions?: Array<{
    slug: string;
    name?: string;
    level?: string;
    note?: string;
    kinetics?: {
      ki_uM?: number;
      ki_basis?: string;
      auc_ratio?: number;
      assumed_perp_uM?: number;
      induction_factor?: number;
      plasma_binding_displacement?: number;
    };
    source_pmid?: string;
  }>;
  mw_g_mol?: number;
  dose_moiety_fraction?: number;
  /** Plasma free fraction. Read by `pd.occupancy-needs-fu`. */
  fraction_unbound?: number;
  /** Which moiety the pk block describes, when it is not the parent. Read by
   *  the prodrug rule. */
  pk_analyte?: string;
  fu_note?: string;
  dose_moiety_note?: string;
  refs?: string[];
  /** Free-text prose; several rules read it for provenance the schema cannot hold. */
  notes?: string;
  mechanism?: string;
  nutrition?: { rdi: number; ul?: number; unit: string };
}

export interface Finding {
  level: 'error' | 'warning';
  slug: string;
  rule: string;
  message: string;
}

export type LintPathway = {
  slug: string;
  steps: Array<{
    from: string;
    to: string;
    from_slug?: string;
    to_slug?: string;
    via?: string;
    via_slug?: string;
    note?: string;
  }>;
  modulators?: Array<{ slug: string; step?: number; target?: string; note?: string }>;
};

export interface LintInput {
  compounds: Compound[];
  pathways: LintPathway[];
}

/**
 * Run every rule. Errors must not ship; warnings are for a curator to look at.
 * Order is stable, so two runs over the same catalog diff cleanly.
 */
export function lintRegistry({ compounds, pathways }: LintInput): Finding[] {
  const findings: Finding[] = [];
  function err(slug: string, rule: string, message: string): void {
    findings.push({ level: 'error', slug, rule, message });
  }
  function warn(slug: string, rule: string, message: string): void {
    findings.push({ level: 'warning', slug, rule, message });
  }

  const data = compounds;
  const pathwayData = pathways;

  const bySlug = new Map(data.map((c) => [c.slug, c]));

  // ── Slug uniqueness ──────────────────────────────────────────────────
  // The bundled loader already throws on duplicate slugs at boot, but
  // failing in CI is cheaper than failing at app start.
  const seen = new Set<string>();
  for (const c of data) {
    if (seen.has(c.slug)) err(c.slug, 'slug.unique', 'duplicate slug');
    seen.add(c.slug);
  }

  // ── Loader-schema parity ─────────────────────────────────────────────
  // data-lint's structural checks below use a hand-written interface, so
  // Zod constraints in the real loader (note max-lengths, F∈[0,1], enum
  // members, regex on source_pmid) were NOT enforced here — over-length
  // provenance notes once passed CI then threw at app boot
  // (loader.ts compoundSchema). Run the authoritative schema so anything
  // the runtime rejects fails the gate first.
  for (const c of data) {
    const parsed = compoundSchema.safeParse(c);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        err(c.slug, 'compound.schema', `${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
    }
  }

  // ── Retired-slug integrity ───────────────────────────────────────────
  // `retired_slugs` is the forwarding table that keeps intakes logged under a
  // merged-away slug resolving to the record that absorbed it. It is only
  // trustworthy if every retired name resolves to exactly one live compound,
  // so three ways of breaking that are errors:
  //   1. a retired slug that is ALSO a live slug — the tombstone would shadow
  //      a real compound, or be shadowed by it, depending on map insertion
  //      order, which is the kind of bug that shows up as one compound
  //      mysteriously wearing another's data;
  //   2. two compounds claiming the same retired slug — the intake resolves to
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
          `retired slug "${retired}" is already claimed by "${prior}" — an intake naming it would resolve unpredictably`,
        );
      }
      retiredOwner.set(retired, c.slug);
    }
  }

  // ── One molecule, one compound ───────────────────────────────────────
  // Slug uniqueness is not identity uniqueness. Two records can carry distinct
  // slugs while claiming the SAME molecule — because one is the other's alias
  // ("ethanol" vs "alcohol"), an international name ("albuterol" vs
  // "salbutamol"), a stereochemical prefix ("tyrosine" vs "l-tyrosine"), or a
  // spelling variant ("epitalon" vs "epithalon"). Nothing downstream can merge
  // them: search returns both, Today curves them separately, and two intakes of
  // one substance never sum. Worse, each side gets independently authored, so
  // the registry ends up publishing two different half-lives for one molecule —
  // occasionally citing the SAME PMID for both, which means at least one set of
  // numbers is not in the paper it points at.
  //
  // The check: a compound's canonical identity (its slug or its name) must not
  // appear in ANOTHER compound's name or aliases. Comparison is on a normalized
  // key (lowercase, punctuation stripped) so "L-Tyrosine" and "l-tyrosine"
  // collide. Shared CLASS labels are deliberately not flagged — "BCAA" listed
  // as an alias of leucine, isoleucine and valine is a category, not an
  // identity claim, and it trips no canonical name or slug.
  //
  // Warning, not error: several pairs are legitimately distinct (a salt or
  // ester form with its own absorption, e.g. zinc vs zinc-picolinate) and
  // resolving a true duplicate means MERGING user-facing slugs, which is a
  // data migration, not a lint fix. See DATA_QUALITY_BACKLOG.md.
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
  // identity with a scope note attached. Comparing the full string misses it,
  // so claims are ALSO tested with a trailing parenthetical removed. Only
  // trailing — a leading one can be part of the name itself ("(+)-Catechin").
  const identityKeyBase = (s: string) => identityKey(s.replace(/\s*\([^)]*\)\s*$/, ''));
  const canonicalOwner = new Map<string, string>();
  for (const c of data) {
    canonicalOwner.set(identityKey(c.slug), c.slug);
    canonicalOwner.set(identityKey(c.name), c.slug);
  }
  /**
   * Routes of two colliding compounds that cite the SAME source but store
   * different numbers. If the pair really is one molecule, at most one of them
   * can be what the paper says — so this is a provable citation defect, not a
   * judgement call about whether to merge. Compares the four parameters a
   * reader would check against an abstract.
   */
  const sharedSourceConflicts = (a: Compound, b: Compound): string[] => {
    const out: string[] = [];
    for (const [route, pkA] of Object.entries(a.pk ?? {})) {
      const pkB = b.pk?.[route];
      if (!pkA || !pkB || !pkA.source_pmid || pkA.source_pmid !== pkB.source_pmid) continue;
      const fields: [string, number | undefined, number | undefined][] = [
        ['ka_hr', pkA.ka_hr, pkB.ka_hr],
        ['V_L', pkA.V_L, pkB.V_L],
        ['F', pkA.F, pkB.F],
        ['half_life_hr', a.half_life_hr?.[route], b.half_life_hr?.[route]],
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
  // Mineral supplements are sold as salts, and the registry carries a record
  // per salt. But once Mg²⁺ or Zn²⁺ crosses the gut wall it is the same ion
  // whatever it arrived with, so only the ABSORPTION side may legitimately
  // differ between salts: F and ka. A salt claiming its own volume of
  // distribution or its own elimination half-life is making a claim about the
  // ion's disposition that its counter-ion cannot support — the magnesium
  // family carried V 1050 L against V 14 L, and zinc 6 h against 50 h, for one
  // ion each. That is a category error rather than a disagreement between two
  // measurements, so it is worth its own rule.
  //
  // Deliberately scoped to the mineral ions below. The same slug shape covers
  // covalent ESTERS elsewhere (testosterone / testosterone-cypionate), which
  // are genuinely different molecules with their own depot kinetics, and this
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
      for (const [route, pk] of Object.entries(c.pk ?? {})) {
        const parentPk = parent.pk?.[route];
        if (!pk || !parentPk) continue;
        const clashes: string[] = [];
        if (pk.V_L != null && parentPk.V_L != null && pk.V_L !== parentPk.V_L) {
          clashes.push(`V ${pk.V_L} L vs ${parentSlug}'s ${parentPk.V_L} L`);
        }
        const tSalt = c.half_life_hr?.[route];
        const tParent = parent.half_life_hr?.[route];
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
  // A 2026-09-06 verification pass found the registry's recurring failure
  // shape: where a source genuinely carried a number the authoring session
  // derived it correctly, and where it did not, a plausible {ka, V, F} trio
  // appeared anyway. Those invented trios repeat verbatim across unrelated
  // compounds, because the same default was reached for more than once — that
  // repetition is the only offline signal that separates them from authored
  // values, and it is what this rule keys on.
  //
  // IV routes are exempt: F is 1 by definition there and ka is absent, so a
  // shared (V, F) pair is arithmetic, not a template. Same-molecule relatives
  // (a salt beside its parent) are exempt too — one ion legitimately shares one
  // parameter set, and `compound.identity-collision` already covers that pair.
  // What remains is unrelated molecules storing byte-identical absorption,
  // volume and bioavailability under three different citations.
  {
    const tuples = new Map<string, { slug: string; route: string; pmid: string }[]>();
    for (const c of data) {
      for (const [route, pk] of Object.entries(c.pk ?? {})) {
        if (route === 'IV' || !pk) continue;
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

  // ── A declared route the solver cannot solve ────────────────────────
  // `routes[]` drives the dosing UI — CompoundCompose iterates it to offer the
  // choices and defaults to `routes[0]` — while the plasma curve needs a route
  // that yields an elimination rate. A route in the first list but not the
  // second is one a person can log a dose against and get nothing back.
  //
  // The severity is graded, and the grading is the point: 93 such routes exist,
  // but only a handful are `routes[0]`, so the rest need a user to actively
  // pick a non-default route before the gap shows. Records that are wholly
  // `pk_unauthored` are exempt — those declare the absence deliberately.
  //
  // Some of these are CORRECT and should stay: mannitol's oral route is
  // parameterless because oral mannitol acts osmotically in the gut lumen and
  // has no meaningful plasma curve. For those the fix is the route ORDER, not
  // the pharmacology.
  {
    const solvable = (c: (typeof data)[number], route: string) => {
      const pk = c.pk?.[route];
      if (!pk) return false;
      if (c.half_life_hr?.[route] != null || pk.ke_hr != null) return true;
      if (pk.mm_vmax_per_hr != null && pk.mm_km_mg_per_l != null) return true;
      return pk.alpha_hr != null && pk.beta_hr != null && pk.k21_hr != null;
    };
    const dangling: string[] = [];
    const defaults: string[] = [];
    for (const c of data) {
      if (c.pk_unauthored) continue;
      const rs = c.routes ?? [];
      if (!rs.length) continue;
      for (const r of rs) if (!solvable(c, r)) dangling.push(`${c.slug}.${r}`);
      if (rs[0] && !solvable(c, rs[0])) {
        defaults.push(`${c.slug}.${rs[0]}`);
        warn(
          c.slug,
          'pk.unsolvable-default-route',
          `routes[0] is ${rs[0]}, which yields no elimination rate — the dosing UI DEFAULTS to it, so the commonest path through this record logs a dose and renders no curve. Either author that route or order routes[] so a solvable one comes first`,
        );
      }
    }
    if (dangling.length) {
      warn(
        '(catalog)',
        'pk.unsolvable-route',
        `${dangling.length} declared routes yield no elimination rate, so a dose logged against them renders nothing; ${defaults.length} of those are routes[0] and therefore the default selection: ${dangling.join(', ')}`,
      );
    }
  }

  // ── A kinetics edge whose victim has no solvable PK ─────────────────
  // The edge modulates the victim's ke, so with no ke there is nothing to
  // modulate: the authored ki_uM or induction_factor is inert. NOT a reason to
  // delete it — the magnitude is real and becomes live the moment the victim
  // gains PK, and several of these are clinically important (the enzyme
  // inducers against hormonal contraceptives). Flagged so the inertness is
  // known rather than assumed to be working.
  {
    const inert: string[] = [];
    for (const c of data) {
      for (const e of c.interactions ?? []) {
        if (!e.kinetics) continue;
        const v = bySlug.get(e.slug);
        if (!v) continue;
        const solv = Object.entries(v.pk ?? {}).some(
          ([r, p]) =>
            p &&
            (v.half_life_hr?.[r] != null ||
              p.ke_hr != null ||
              (p.mm_vmax_per_hr != null && p.mm_km_mg_per_l != null) ||
              (p.alpha_hr != null && p.beta_hr != null && p.k21_hr != null)),
        );
        if (!solv) inert.push(`${c.slug}→${e.slug}`);
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
  // resolvePk substitutes ka = 1.0/h, an absorption half-life of ~40 min. For
  // a subcutaneous antibody or a depot injection that is wrong by design, not
  // by a margin — and the error is invisible, because Tmax under a fixed ka
  // grows only LOGARITHMICALLY as ke falls. A 31-day antibody and a 2-day
  // small molecule both land in a 4-7 h window, so the whole class renders as
  // though it peaked the same afternoon.
  //
  // Found 2026-09-08 from a user report that retatrutide peaked at 5 h instead
  // of days. Eleven rows have since been authored from a verbatim Tmax; the
  // rest are counted here rather than filled, because inventing a plausible
  // absorption rate across the class is what caused that regression.
  //
  // Scoped to t½ >= 48 h: below that the default is often defensible, and
  // brexpiprazole is a worked example — its verbatim Tmax of 4-5 h CONTAINS
  // the 4.9 h the default renders.
  //
  // FOUR ROWS ARE ACQUITTED RATHER THAN OPEN. Their published Tmax range
  // CONTAINS what the 1.0/h default renders, so the default is correct and
  // storing a number would assert a measurement where a coincidence is the
  // honest description. They are listed explicitly, with the verbatim range,
  // rather than left to fire forever: a warning that cannot be resolved by
  // doing the right thing is one authors learn to ignore — the same lesson
  // that produced `fu_note`-without-a-value earlier today.
  const KA_DEFAULT_ACQUITTED: Record<string, string> = {
    'brexpiprazole.PO': 'label/citation "tmax ... 4-5" h contains the 4.9 h the default renders',
    'solifenacin.PO': 'VESICARE label "reached within 3 to 8 hours" contains 4.6 h',
    'zonisamide.PO': 'ZONEGRAN label "occur within 2-6 hours" contains 4.6 h',
    'cariprazine.PO': 'PMC13269304 "approximately 3 to 6 h post-dose" contains 4.7 h',
  };
  {
    const slow: string[] = [];
    for (const c of data) {
      for (const [route, pk] of Object.entries(c.pk ?? {})) {
        if (route === 'IV' || !pk || pk.ka_hr != null || pk.zo_dur_hr != null) continue;
        if (KA_DEFAULT_ACQUITTED[`${c.slug}.${route}`]) continue;
        const t = c.half_life_hr?.[route];
        if (t == null || t < 48) continue;
        const ke = Math.LN2 / t;
        const tmax = Math.log(1 / ke) / (1 - ke);
        warn(
          c.slug,
          'pk.defaulted-ka-slow',
          `pk.${route} has no ka and a ${(t / 24).toFixed(1)}-day half-life — the solver's 1.0/h default puts the peak at ${tmax.toFixed(1)} h, which for a slowly-absorbed route is wrong in kind rather than by a margin. Authoring it needs a verbatim Tmax; ka then follows from ln(ka/ke)/(ka−ke) = Tmax`,
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
  // The quartet rule above needs ka, V and F to match together, which is a
  // strong signal and therefore a narrow one: it now fires nowhere. But the
  // ABSORPTION RATE alone is the most template-prone field in the catalog —
  // 12 values account for 152 of the 276 authored rates — because a plausible
  // ka is easy to invent and almost nothing downstream contradicts it.
  //
  // Scoped to values shared by >= 5 unrelated identities under >= 5 different
  // citations, which is well past coincidence: real absorption rates are
  // fitted to a Tmax and land on untidy numbers. Excludes 1.0, which IS the
  // solver default and was swept separately (storing it asserts nothing that
  // omitting it does not).
  {
    const byKa = new Map<number, { slug: string; route: string; pmid: string }[]>();
    for (const c of data) {
      for (const [route, pk] of Object.entries(c.pk ?? {})) {
        if (route === 'IV' || !pk?.ka_hr || pk.ka_hr === 1) continue;
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

  // ── The silent-default debt, in aggregate ───────────────────────────
  // resolvePk fills a missing V_L with 0.5 L/kg, a missing F with 0.9 and a
  // missing ka with 1.0. None of that is visible in the data, so a route row
  // carrying a source_pmid can claim provenance for numbers its paper never
  // stated. The per-compound rule above fires only where an occupancy curve
  // consumes the concentration; these totals carry the rest of the debt.
  {
    let noV = 0,
      noF = 0,
      noKa = 0,
      sourcedNoV = 0,
      proteinNoV = 0,
      rows = 0;
    const compoundsNoV = new Set<string>();
    for (const c of data) {
      for (const [route, pk] of Object.entries(c.pk ?? {})) {
        if (!pk) continue;
        rows++;
        if (pk.V_L == null) {
          noV++;
          compoundsNoV.add(c.slug);
          if (pk.source_pmid || pk.source_label) sourcedNoV++;
          if (c.mw_g_mol != null && c.mw_g_mol >= 10_000) proteinNoV++;
        }
        if (route !== 'IV' && pk.F == null) noF++;
        if (route !== 'IV' && pk.ka_hr == null) noKa++;
      }
    }
    if (noV > 0) {
      warn(
        '(catalog)',
        'pk.defaulted-volume',
        `${noV} of ${rows} pk route rows carry no V_L across ${compoundsNoV.size} compounds — each renders at a DEFAULT volume, which sets the whole concentration scale: 0.08 L/kg (5.6 L) for the ${proteinNoV} rows at MW >= 10 kDa, 0.5 L/kg (35 L) for the rest; ${sourcedNoV} of those rows carry a source_pmid or source_label, claiming provenance for a number their citation never stated`,
      );
    }
    if (noF > 0 || noKa > 0) {
      warn(
        '(catalog)',
        'pk.defaulted-params',
        `${noF} extravascular rows default F to 0.9 and ${noKa} default ka to 1.0 — the ka default is why "ka 1" appears across dozens of unrelated compounds`,
      );
    }
  }

  // ── Nutrient-group member referential integrity ──────────────────────
  // The Daily-intake card rolls vitamer FORMS that share one Daily Value
  // (B12 / folate / D / K) into a group row, keyed by slug and resolved at
  // runtime. A typo or a slug rename in compounds.json would silently drop a
  // form from its group (it falls back to a standalone, un-summed row) with no
  // failing test — so assert membership here. Also assert the present members
  // truly share one DV + unit: rollUpGroup REFUSES to group a mismatch, so
  // drift would silently ungroup the whole set at runtime.
  for (const g of NUTRIENT_GROUPS) {
    const present: { slug: string; rdi: number; unit: string }[] = [];
    for (const slug of g.members) {
      const c = bySlug.get(slug);
      if (!c) {
        err(slug, 'nutrient-group.member-exists', `${g.id} member '${slug}' is not a compound`);
      } else if (!c.nutrition) {
        err(
          slug,
          'nutrient-group.member-nutrition',
          `${g.id} member '${slug}' has no nutrition block — it won't roll into the group`,
        );
      } else {
        present.push({ slug, rdi: c.nutrition.rdi, unit: c.nutrition.unit });
      }
    }
    const first = present[0];
    if (!first || present.length < 2) {
      warn(
        g.id,
        'nutrient-group.min-members',
        `${g.id} resolves to ${present.length} present member(s); needs ≥2 to render as a group`,
      );
      continue;
    }
    for (const m of present) {
      if (m.rdi !== first.rdi || m.unit !== first.unit) {
        err(
          m.slug,
          'nutrient-group.shared-dv',
          `${g.id} member '${m.slug}' has DV ${m.rdi} ${m.unit} ≠ group ${first.rdi} ${first.unit} — rollUpGroup will refuse to group these`,
        );
      }
    }
  }

  for (const c of data) {
    // ── pk routes must be in routes[] ────────────────────────────────
    // A pk[X] entry for a route the compound doesn't list is dead data
    // — surfaces never look up pk by a route that isn't in `routes[]`,
    // and the compound's dosing UI doesn't expose it either.
    if (c.pk && c.routes) {
      for (const route of Object.keys(c.pk)) {
        if (!c.routes.includes(route)) {
          err(
            c.slug,
            'pk.route-listed',
            `pk has route ${route} not in routes[${c.routes.join(',')}]`,
          );
        }
      }
    }

    // ── pk completeness for each authored route ──────────────────────
    // resolvePk fills missing fields with category defaults but a
    // partial pk[route] entry that has a source_pmid claims provenance
    // for numbers it doesn't actually carry — misleading.
    if (c.pk) {
      for (const [route, pk] of Object.entries(c.pk)) {
        if (!pk) continue;
        const hasMm = pk.mm_vmax_per_hr != null && pk.mm_km_mg_per_l != null;
        const hasLinearKe = pk.ke_hr != null || (c.half_life_hr && c.half_life_hr[route] != null);
        if (!hasMm && !hasLinearKe) {
          err(
            c.slug,
            'pk.elimination',
            `pk.${route} has no ke_hr, half_life_hr[${route}], or MM params — solver can't derive elimination`,
          );
        }
        if (pk.F != null && (pk.F < 0 || pk.F > 1)) {
          err(c.slug, 'pk.f-range', `pk.${route}.F = ${pk.F} outside [0, 1]`);
        }
        // A missing V_L is not a gap the solver reports — resolvePk silently
        // substitutes 0.5 L/kg (35 L at the 70 kg reference), which sets the
        // ENTIRE concentration scale of the record. linagliptin rendered 10.4x
        // high on AUC that way. It only becomes visible when something consumes
        // the concentration, so the per-compound warning is scoped to records
        // with occupancy rows; the catalog-level total below carries the rest.
        //
        // THIS IS A STANDING CAVEAT, NOT A TASK LIST (established 2026-09-08).
        // Every record it currently names has ALREADY been audited, and the
        // volume is absent precisely BECAUSE that audit removed an unsourceable
        // one: sotalol's was "the EXACT MIDPOINT of a review" range, sulindac's
        // was "unsourced and no intravenous study exists", pregabalin's and
        // melatonin's were the solver default wearing a citation, and
        // triazolam's 77 L was the study subjects' "mean body weight of 77 kg".
        // The count rising is the audit working. Do not read it as a backlog and
        // do not close it by inventing a number.
        //
        // The message states a DIRECTION where the catalog supports one, but the
        // direction is NOT uniform and this rule used to claim it was. Three
        // regimes, measured from the catalog's own authored volumes:
        //
        //   · small molecules (< 10 kDa MW, or no MW authored) — 73% of 609
        //     authored rows exceed 35 L, median 87 L. Defaulting understates
        //     volume, overstates Cp, biases occupancy HIGH.
        //   · proteins (>= 10 kDa) — ALL 18 authored volumes fall BELOW 35 L
        //     (3.1-9.25 L). These now default to 0.08 L/kg instead, so the
        //     old warning both misstated the number and pointed the wrong way.
        //   · mid-size peptides (3-10 kDa) — 6 authored volumes span 7.7-200 L
        //     with 35 L inside the spread. The direction is genuinely UNKNOWN
        //     and claiming one would be false precision.
        //
        // Hence the per-regime message below. Saying "biased HIGH" to a
        // retatrutide-shaped record was worse than saying nothing: it pointed
        // a curator at the wrong correction.
        if (pk.V_L == null && (c.receptor_occupancy ?? []).length > 0) {
          const mw = c.mw_g_mol;
          const isProtein = mw != null && mw >= 10_000;
          const isMidPeptide = mw != null && mw >= 3_000 && mw < 10_000;
          const applied = isProtein ? '0.08 L/kg (5.6 L)' : '0.5 L/kg (35 L)';
          const direction = isProtein
            ? `every one of this catalog's 18 authored volumes at MW >= 10 kDa falls in 3.1-9.25 L, so the class default is close and the residual error is small but unsigned`
            : isMidPeptide
              ? `at ${Math.round(mw)} Da this sits in the 3-10 kDa band, where the catalog's 6 authored volumes span 7.7-200 L and 35 L falls INSIDE that spread — the direction of the error is unknown, and a class default measurably does not help (leave-one-out: 3.67x vs 3.17x). Needs a real volume, not a better guess`
              : `73% of this catalog's authored volumes exceed that (median 87 L), so occupancy on this record is most likely biased HIGH by roughly the ratio of the true volume to 35 L`;
          warn(
            c.slug,
            'pk.defaulted-volume',
            `pk.${route} has no V_L — the solver silently uses ${applied}, which sets the whole concentration scale. ${direction}`,
          );
        }
      }
    }

    // ── Kinetic interaction edges require provenance + perpetrator MW ─
    // The Ki is in µM in literature; the solver works in mg/L. Without
    // mw_g_mol on the perpetrator the µM → mg/L conversion silently
    // skips and the kinetic block becomes inert.
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
      // indistinguishable from a measured affinity, which is how 120 entries
      // came to sit in a field documented as "a published Ki".
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
      // Counterparty must exist in the registry. Off-registry edges
      // are allowed for informational notes (caffeine ↔ "adenosine"
      // pre-cataloging) but a kinetic block on an off-registry edge
      // can't possibly modulate any victim curve.
      if (!bySlug.has(edge.slug)) {
        err(
          c.slug,
          'interactions.target-exists',
          `interactions[${i}] kinetic edge points to unknown slug "${edge.slug}"`,
        );
      }
    }

    // ── receptor_occupancy needs effect_compartment ──────────────────
    // The Hill curve runs against Ce(t), not Cp(t). Without a keo
    // the solver produces no Ce, which means the occupancy curve is
    // identically zero — useless and confusing.
    if (c.receptor_occupancy && c.receptor_occupancy.length > 0) {
      if (!c.effect_compartment?.keo_per_h) {
        err(
          c.slug,
          'receptor.needs-keo',
          `${c.receptor_occupancy.length} receptor_occupancy entr${c.receptor_occupancy.length === 1 ? 'y' : 'ies'} but no effect_compartment.keo_per_h — Ce(t) won't be computed`,
        );
      }
      // Receptor keys must be canonical: the solver's compositeOccupancyCurve
      // unions per-compound curves by EXACT key, so an alias (MOR vs
      // mu_opioid) silently fragments one receptor into two. The shared
      // RECEPTOR_ALIASES map is enforced here; scripts/normalize-receptor-keys.ts
      // applies it. A compound carrying two entries for the same canonical
      // receptor is a duplicate-authoring smell the union math can't resolve.
      const recSeen = new Map<string, number>();
      for (let i = 0; i < c.receptor_occupancy.length; i++) {
        const site = c.receptor_occupancy[i]!;
        if (RECEPTOR_ALIASES[site.receptor]) {
          err(
            c.slug,
            'receptor.alias',
            `receptor_occupancy[${i}] uses non-canonical key "${site.receptor}" — use "${RECEPTOR_ALIASES[site.receptor]}" (run scripts/normalize-receptor-keys.ts)`,
          );
        }
        const canon = canonicalReceptor(site.receptor);
        recSeen.set(canon, (recSeen.get(canon) ?? 0) + 1);
        if (!site.source_pmid) {
          err(
            c.slug,
            'receptor.pmid',
            `receptor_occupancy[${i}] (${site.receptor}) lacks source_pmid`,
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
            `${n} receptor_occupancy entries share receptor "${rec}" — composite occupancy can't distinguish them; consolidate or re-author`,
          );
        }
      }
    }

    // ── effect_compartment provenance ────────────────────────────────
    // A keo is either fitted from a published PK/PD model (source_pmid) or an
    // openly-declared estimate (approximated + note explaining the reasoning).
    // The one state we reject is a bare number: for whole mechanism classes no
    // effect-compartment model has ever been published, and a value that is
    // silently an estimate is indistinguishable from one whose citation was
    // simply lost.
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
      // happened: the PMID anchors the pharmacology, not the number, and the
      // compound page would render it as a fitted measurement. Flag it so the
      // authoring session sets `approximated` (and moves the PMID to refs[])
      // instead of leaving the admission in prose where no surface can see it.
      // Sentence-scoped through `assertsOfThisRecord`: a corrected keo note
      // routinely describes the estimate it REPLACED ("Replaces 6.93/h,
      // computed from a narrative review"), and reading that as an admission
      // about the stored value inverts the rule's meaning.
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
      // oxycodone's from sheep brain:blood equilibration — but the species has
      // to be in the data, not only in the prose, or the compound page shows it
      // as a human measurement.
      // Scoped to FITTED values. An `approximated` note is prose explaining
      // why no measurement was adopted, and it routinely names the animal
      // studies it REJECTED — metoprolol's says a rat paper's quoted figure
      // "appears nowhere in its abstract", tofacitinib's that its cited rat
      // study "stat[es] no equilibration value at all". Those notes name a
      // species precisely because the value is NOT sourced to it, so firing on
      // them inverted the rule's meaning.
      if (!ec.approximated && !ec.source_species && ec.note && keoNoteNamesAnimalSource(ec.note)) {
        warn(
          c.slug,
          'effect.species-in-note',
          `effect_compartment.note names a non-human species as the source but effect_compartment.source_species is unset — declare it so the value can be labelled`,
        );
      }
    }

    // ── PD authored against a route the solver cannot solve ───────────
    // Hill occupancy runs on Ce(t), and Ce is integrated from Cp(t). If NO
    // route yields an elimination rate, Cp is never computed, so Ce is
    // identically zero and every occupancy curve for this compound renders as
    // a flat line at 0%. That is worse than absent data: the surface shows a
    // populated Pharmacodynamics section that silently means nothing. The four
    // accepted elimination paths mirror resolvePk / pkParamsForRoute.
    if (c.effect_compartment || (c.receptor_occupancy?.length ?? 0) > 0) {
      const solvable = (c.routes ?? []).some((route) => {
        const pk = c.pk?.[route];
        if (c.half_life_hr?.[route] != null) return true;
        if (!pk) return false;
        if (pk.ke_hr != null) return true;
        if (pk.mm_vmax_per_hr != null && pk.mm_km_mg_per_l != null) return true;
        return pk.alpha_hr != null && pk.beta_hr != null && pk.k21_hr != null;
      });
      if (!solvable) {
        const what = c.receptor_occupancy?.length
          ? `${c.receptor_occupancy.length} receptor_occupancy row(s)${c.effect_compartment ? ' + keo' : ''}`
          : 'effect_compartment.keo_per_h';
        // AND ALL TWELVE ARE CORRECT DELIBERATE STRIPS, verified 2026-09-08.
        // An older backlog entry called four of them "re-authorable"
        // (alogliptin, nilotinib, enzalutamide, tolterodine); that entry PREDATES
        // their audit and is wrong. Each now carries a decisive pk_unauthored
        // reason: alogliptin's F was a two-step digit collision from a urinary
        // recovery, nilotinib has no IV form and food moves exposure 50-182%,
        // enzalutamide has TWO CO-EQUAL ANALYTES (parent 368 vs parent+M2 828
        // ug h/mL), and tolterodine's bioavailability "ranged from 10 to 70%"
        // because that range IS the CYP2D6 split. No scalar represents any of
        // them. Like pk.defaulted-volume, this is a standing state rather than a
        // task list — the occupancy rows are real pharmacology and stay.
        // MESSAGE CORRECTED 2026-09-08 by checking the consumers instead of
        // assuming them. It used to say every occupancy curve "render[s]
        // identically zero", and that is not what happens — all four call
        // sites guard. The compound page renders a static affinity table; the
        // receptor page sweeps a SYNTHETIC Ce range for its dose-response
        // curve and never touches this compound's PK; and both intake-driven
        // paths skip a compound with no Cp (`routes/library/receptors/[key]`
        // does `if (!ceCurve) continue`, `lib/today/predictors.ts` does
        // `if (!cp) return null`). The real cost is narrower and worth stating
        // exactly: the TIME-COURSE half of this data can never be used. A
        // warning that overstates its symptom is one authors learn to discount.
        warn(
          c.slug,
          'pd.needs-solvable-pk',
          `${what} authored but no route yields an elimination rate — affinity and dose-response still render, but Ce(t) is never computed, so this record contributes nothing to any intake-driven occupancy surface`,
        );
      }
    }

    // ── An in-vitro Ki needs a fraction unbound to be comparable ──────
    // ec50_mg_l is, on almost every authored row, a binding affinity measured
    // against FREE drug — while the solver's curve is TOTAL plasma. Without
    // `fraction_unbound` the two are compared directly, overstating occupancy
    // by roughly 1/fu, which for a 90-99%-bound molecule is one to two orders
    // of magnitude. A row whose basis is an in-vivo plasma EC50 is already
    // referenced to total plasma and needs no correction. See backlog §12.
    // Monoclonals and Fc-fusion proteins are exempt: an IgG is not albumin- or
    // AAG-bound, so "fraction unbound in plasma" is not a property it has, and
    // its total plasma concentration IS the concentration available to bind
    // target. All 13 biologics carrying occupancy rows are IgG mAbs or an
    // Fc-fusion; small-molecule protein binding does not describe them.
    // Also skipped where no route yields an elimination rate: those records
    // already carry pd.needs-solvable-pk, their time-course occupancy is absent
    // regardless, and an fu cannot change a curve that is never computed.
    // Warning twice about one unusable row is noise, not a finding.
    const fuSolvable = (c.routes ?? []).some((route) => {
      const pk = c.pk?.[route];
      if (c.half_life_hr?.[route] != null) return true;
      if (!pk) return false;
      if (pk.ke_hr != null) return true;
      if (pk.mm_vmax_per_hr != null && pk.mm_km_mg_per_l != null) return true;
      return pk.alpha_hr != null && pk.beta_hr != null && pk.k21_hr != null;
    });
    if (c.category !== 'biologic' && fuSolvable) {
      const needsFu = (c.receptor_occupancy ?? []).filter(
        (r) => (r.basis ?? 'in_vitro_ki') === 'in_vitro_ki',
      );
      // An fu_note with no value means the question was examined and the answer
      // was "deliberately not authored" — a decision, not a gap. Before this
      // state existed, such reasoning lived in prose the rule could not read,
      // so it re-reported settled questions (eplerenone's binding is
      // concentration-dependent across the therapeutic range, which is a reason
      // NOT to author a scalar).
      if (needsFu.length > 0 && c.fraction_unbound == null && !c.fu_note) {
        warn(
          c.slug,
          'pd.occupancy-needs-fu',
          `${needsFu.length} in-vitro-Ki occupancy row(s) but no fraction_unbound — a free-drug affinity is being compared against the TOTAL plasma curve, biasing occupancy high by ~1/fu`,
        );
      }
    }

    // ── A prodrug's curve must say which molecule it models ──────────
    // Where a compound converts to an active species, "the half-life" is
    // ambiguous: the parent and the active metabolite routinely differ by an
    // order of magnitude, and both are legitimate things to model. Carisoprodol
    // stored its METABOLITE's 8 h against a parent 2 h until 2026-09-06, and
    // prednisone's whole block turned out to describe prednisolone. Neither was
    // detectable without reading the prose, because a number alone carries no
    // analyte. Stating it in `notes` is what makes the record checkable.
    //
    // Records that ARE the active metabolite of something else (desipramine,
    // fexofenadine) are exempt — there is no parent curve at issue for them.
    {
      const prose = `${c.mechanism ?? ''} ${c.notes ?? ''}`;
      const converts =
        /\bprodrug\b|is (?:rapidly |extensively )?(?:metabolised|metabolized|hydrolys(?:ed|ized)|converted|de-?esterified) (?:in [^.]{0,30} )?to\b/i;
      const isTheMetabolite = /\b(?:is|are) (?:the |an |a )?(?:active |major )?metabolite of\b/i;
      // The claim now lives in a FIELD rather than in prose. Sniffing notes for
      // a declaration was unenforceable in both directions: it passed records
      // that merely used the word "analyte" and failed ones that said the same
      // thing in other words.
      // Sentence-scoped through `assertsOfThisRecord`. Whole-prose matching
      // read three records exactly backwards: valsartan's note says "no active
      // metabolite (unlike losartan)", aripiprazole's describes a REJECTED
      // citation that was for the lauroxil PRODRUG, and hydroxychloroquine's
      // "converted to base ... rather than" is a SALT conversion, not a
      // metabolic one.
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
    // `dose_moiety_fraction` silently rescales every dose on the record, and
    // it is a bare stoichiometric constant — 0.188 says nothing about which
    // salt it came from or which analyte it leaves. Without the note there is
    // no way to review it, and a wrong one is invisible: the curve simply
    // moves. Mirrors effect.approx-note.
    if (c.dose_moiety_fraction != null && !c.dose_moiety_note) {
      warn(
        c.slug,
        'dose.moiety-note',
        `dose_moiety_fraction ${c.dose_moiety_fraction} is set but no dose_moiety_note records the salt, the analyte and the arithmetic — a bare stoichiometric constant is unreviewable`,
      );
    }
    // The inverse: a record whose prose says the dose is a salt while pk[]
    // describes the base, with no fraction set, is silently overstating every
    // concentration by the counter-ion's share.
    if (
      c.dose_moiety_fraction == null &&
      SALT_DOSE_PROSE.test(`${c.mechanism ?? ''} ${c.notes ?? ''}`)
    ) {
      warn(
        c.slug,
        'dose.salt-moiety-unset',
        'prose says the dose is a salt while pk[] describes the free base or ion, but dose_moiety_fraction is unset — the solver divides a salt mass by a free-base volume',
      );
    }

    // ── Animal-derived route params must declare their species ───────
    // Same principle as the keo rule above, on the PK side. The registry
    // permits animal PK where no human study exists, but an undeclared rat or
    // dog value is indistinguishable from a human one on every surface.
    // Narrower than the keo rule on purpose. A compound's `notes` is long free
    // text that routinely discusses animal studies it REJECTED ("the only
    // subcutaneous data are RAT ... not imported"), so the sentence-level test
    // used for the keo note produces false positives here. Only an affirmative
    // claim that THIS record's PK is animal counts.
    const ANIMAL_PK_CLAIM =
      /\b(?:PK|pharmacokinetics|half-life|values?|parameters?)\s+(?:is|are|was|were)\s+(?:the\s+)?(rat|mouse|murine|dog|canine|pig|porcine|sheep|ovine|rabbit|monkey|equine|horse|bovine)\b/i;
    for (const [route, pk] of Object.entries(c.pk ?? {})) {
      if (!pk || pk.source_species) continue;
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
    // Compounds with no pk entries are exempt; compounds with pk entries
    // that lack source_pmid get a warning so the gap is visible.
    if (c.pk) {
      for (const [route, pk] of Object.entries(c.pk)) {
        if (!pk) continue;
        // A regulatory label is a legitimate primary source (see
        // RoutePk.source_label) — for many modern agents it is the only
        // public document stating Cmax / t-half / F together. What we refuse
        // to allow is a route with NEITHER, because then a reader has no way
        // to re-derive the numbers.
        if (!pk.source_pmid && !pk.source_label) {
          warn(c.slug, 'pk.pmid', `pk.${route} has params but no source_pmid or source_label`);
        }
        // NOT A DEFECT, and this rule used to say it was. A route row is a
        // BUNDLE of three or four values, and they can legitimately come from
        // different documents: agomelatine, ivabradine, nebivolol,
        // propylthiouracil and trandolapril each cite a primary for most of
        // the row while the label supplies one value — always the one no
        // abstract states, always named explicitly in the label text ("F ~40%
        // is a secondary/label figure", "V 30 L is review-derived"). That is
        // richer provenance than either source alone, and the audit passes
        // created it on purpose. The rule fired on all five and on nothing
        // else. Per-field provenance would let this be checked properly; until
        // then, saying which value came from where in prose is the contract.
      }
    }

    // ── systems[] tagging ─────────────────────────────────────────────
    // Compounds with no body-system tags fall into the "untagged" bucket
    // on /library and don't appear on per-system surfaces. This was a
    // warning while the bulk-tagging pass was in flight, on the promise
    // that it would flip to an error once tagging was complete. Coverage
    // reached 1231/1231 on 2026-09-06, so it is now an error: the backlog
    // is closed and the only remaining source of an untagged compound is
    // drift on a newly-authored one, which is exactly what a PR gate is for.
    if (!c.systems || c.systems.length === 0) {
      err(
        c.slug,
        'systems.tagged',
        'no systems[] tagged — would appear in /library only under the Untagged filter',
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

  // ── Pathways (v1.2 Wave 5a) ──────────────────────────────────────────
  // Cross-reference pathways.json against compounds.json. Pathways are
  // sparse (a few dozen) so the inner loops are cheap. We don't re-validate
  // pathway schema here — the registry loader's pathwaySchema runs at
  // boot and would have thrown by now. Linting is restricted to the
  // cross-package invariants the loader can't see:
  //  1. Slug uniqueness across pathways
  //  2. Step from_slug/to_slug references must resolve (error if
  //     present-but-missing, because explicitly claimed). The free-text
  //     from/to labels are NOT checked — most pathway endpoints are
  //     processes and states, not molecules.
  //  3. via_slug references must resolve (error if present-but-missing,
  //     because explicitly claimed)
  //  4. modulator.slug must resolve (error — modulators are by definition
  //     registered compounds)

  const pathwaySeen = new Set<string>();
  for (const p of pathwayData) {
    if (pathwaySeen.has(p.slug)) {
      err(p.slug, 'pathway.slug-unique', 'duplicate pathway slug');
    }
    pathwaySeen.add(p.slug);

    for (let i = 0; i < (p.steps ?? []).length; i++) {
      const step = p.steps[i]!;
      // from/to are FREE TEXT and most endpoints are processes, not molecules
      // ("cortical pyramidal glutamate release", "5-HT2A -> Gq -> PLC"). We
      // used to warn whenever one didn't resolve, which fired 1,613 times and
      // was unactionable by construction. The checkable claim now lives in
      // from_slug/to_slug, which are errors when present-but-missing — the
      // same contract via_slug has always had.
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
      // String-length limits enforced by the runtime Zod loader (loader.ts
      // pathwayStep): from/to ≤80, via ≤120, note ≤500. These are HARD —
      // exceeding them makes loadPathways throw and the pathway page crash,
      // so they must be errors here, not warnings.
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
      // Loader limits: modulator target ≤120, note ≤500 (loader.ts pathwayModulator).
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
    // Shape is validated by the loader's pathwaySchema; here we cross-check
    // that every node-id reference resolves and coords sit on the design
    // canvas. Pathways without a `diagram` (almost all) skip this entirely.
    const diagram = (
      p as {
        diagram?: {
          nodes: Array<{ id: string; x?: number; y?: number }>;
          edges: Array<{ from: string; to: string }>;
          chips?: Array<{ id: string; target: string }>;
          feedback?: { from: string; to: string };
        };
      }
    ).diagram;
    if (diagram) {
      const nodeIds = new Set<string>();
      for (let i = 0; i < diagram.nodes.length; i++) {
        const n = diagram.nodes[i]!;
        if (nodeIds.has(n.id)) {
          err(p.slug, 'pathway.diagram-node-dup', `diagram.nodes[${i}].id "${n.id}" duplicated`);
        }
        nodeIds.add(n.id);
        // Coords (when present) live on a 1500 × 1060 design canvas; allow
        // a generous margin for side chips / feedback labels.
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
