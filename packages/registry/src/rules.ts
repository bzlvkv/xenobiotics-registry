/**
 * rules.ts — every lint rule id, its level, and one line on what it means.
 *
 * One table so the three places that talk about rules cannot drift: the client's
 * health view glosses each finding with `summary`, `pnpm validate --rule` refuses
 * an id that is not here (an unknown id used to print "no findings" and read as a
 * clean result), and `pnpm report` separates standing caveats from work.
 * `test/rules.test.ts` checks this table against the ids `lint.ts` actually emits.
 *
 * STANDING CAVEATS. Four warnings describe a state that was already audited, not
 * work to do. Every record `pk.defaulted-volume` names had its volume removed BY an
 * audit because no source stated it, and the only way to "close" such a warning is
 * to invent the number the audit removed. They stay visible because a reader of
 * the record should know its concentration scale rests on a default; they are not
 * a backlog.
 */

export interface RuleInfo {
  level: 'error' | 'warning';
  summary: string;
  /** Audited and deliberate: report it, never "fix" it by adding a number. */
  standing?: true;
}

export const LINT_RULES: Readonly<Record<string, RuleInfo>> = {
  'compound.identity-collision': {
    level: 'warning',
    summary: 'Two records are the same molecule under different slugs.',
  },
  'compound.pk-and-unauthored': {
    level: 'error',
    summary: 'The record carries authored PK and also says PK was not authored.',
  },
  'compound.retired-alias-clash': {
    level: 'warning',
    summary:
      'A retired slug forwards to one record while another lists that name as an alias, so a slug lookup and a name search disagree.',
  },
  'compound.retired-collision': {
    level: 'error',
    summary: 'A retired slug shadows a live record, or two records retire the same one.',
  },
  'compound.retired-self': {
    level: 'error',
    summary: "A record's retired_slugs contains its own slug, so it forwards to itself.",
  },
  'compound.unvisited': {
    level: 'error',
    summary: 'Neither authored PK nor a pk_unauthored reason: nobody has looked at this record.',
  },
  'dose.moiety-note': {
    level: 'warning',
    summary: 'dose_moiety_fraction is set with no note recording the salt and the arithmetic.',
  },
  'dose.salt-moiety-unset': {
    level: 'warning',
    summary: 'The doses are a salt while the PK describes the free base, uncorrected.',
  },
  'effect.approx-conflict': {
    level: 'error',
    summary:
      'The keo is flagged as an estimate and cites a source — one of the two claims is untrue.',
  },
  'effect.approx-in-note': {
    level: 'warning',
    summary: 'The note admits the keo is an estimate while the record cites it as fitted.',
  },
  'effect.approx-note': {
    level: 'warning',
    summary: 'approximated is set with no note recording the reasoning.',
  },
  'effect.pmid': {
    level: 'warning',
    summary: 'A keo is authored with neither a source nor the approximated flag.',
  },
  'effect.species-in-note': {
    level: 'warning',
    summary: 'The note names an animal source but source_species is unset.',
  },
  'interactions.induction-positive': {
    level: 'error',
    summary: 'induction_factor must be greater than zero.',
  },
  'interactions.inert-kinetics': {
    level: 'warning',
    summary: 'The victim has no solvable PK, so the authored magnitude modulates nothing.',
  },
  'interactions.ki-basis-unstated': {
    level: 'warning',
    summary: 'Calibration inputs are stored but ki_basis does not say what they mean.',
  },
  'interactions.ki-calibration-incomplete': {
    level: 'error',
    summary: 'A declared ki_basis is missing the inputs it is calibrated from.',
  },
  'interactions.ki-calibration-mismatch': {
    level: 'error',
    summary: 'The stored Ki does not reproduce the declared fold-change.',
  },
  'interactions.ki-needs-mw': {
    level: 'error',
    summary: 'A Ki in µM cannot be converted without the perpetrator MW.',
  },
  'interactions.kinetics-pmid': {
    level: 'error',
    summary: 'An interaction carries kinetics with no source.',
  },
  'interactions.target-exists': {
    level: 'error',
    summary: 'A kinetic edge points at a slug no record has.',
  },
  'pathway.diagram-coord': {
    level: 'error',
    summary: 'A diagram node carries a coordinate outside the canvas.',
  },
  'pathway.diagram-node-dup': {
    level: 'error',
    summary: 'Two diagram nodes share an id.',
  },
  'pathway.diagram-ref': {
    level: 'error',
    summary: 'A diagram edge names a node the diagram does not define.',
  },
  'pathway.modulator-len': {
    level: 'error',
    summary: 'A modulator field is longer than the schema allows.',
  },
  'pathway.modulator-slug': {
    level: 'error',
    summary: 'A modulator points at a compound slug no record has.',
  },
  'pathway.modulator-step': {
    level: 'error',
    summary: "A modulator's step index is out of range.",
  },
  'pathway.slug-unique': {
    level: 'error',
    summary: 'Two pathways claim one slug.',
  },
  'pathway.step-from-slug': {
    level: 'error',
    summary: "A step's from_slug names a compound no record has.",
  },
  'pathway.step-len': {
    level: 'error',
    summary: 'A step field is longer than the schema allows.',
  },
  'pathway.step-to-slug': {
    level: 'error',
    summary: "A step's to_slug names a compound no record has.",
  },
  'pathway.via-slug': {
    level: 'error',
    summary: "A step's via_slug names a compound no record has.",
  },
  'pd.needs-solvable-pk': {
    level: 'warning',
    summary: 'PD is authored but no route yields elimination, so Ce(t) is never computed.',
    standing: true,
  },
  'pd.occupancy-needs-fu': {
    level: 'warning',
    summary:
      'An in-vitro Ki is compared against the total plasma curve for want of fraction_unbound, biasing occupancy high.',
  },
  'pk.defaulted-ka-slow': {
    level: 'warning',
    summary:
      'A slowly absorbed route with no ka takes the fast default, putting the peak hours too early.',
    standing: true,
  },
  'pk.defaulted-params': {
    level: 'warning',
    summary: 'F or ka fall back to consumer defaults on an extravascular row.',
    standing: true,
  },
  'pk.defaulted-volume': {
    level: 'warning',
    summary:
      'A PK row with no V_L takes the default volume, which sets the whole concentration scale.',
    standing: true,
  },
  'pk.elimination': {
    level: 'error',
    summary: 'Nothing in the route can derive an elimination rate.',
  },
  'pk.f-range': {
    level: 'error',
    summary: 'Bioavailability outside 0-1.',
  },
  'pk.iv-f': {
    level: 'error',
    summary: 'An intravenous route stores F other than 1.',
  },
  'pk.pmid': {
    level: 'warning',
    summary: 'A PK block has parameters but neither source_pmid nor source_label.',
  },
  'pk.prodrug-analyte-unstated': {
    level: 'warning',
    summary:
      'The record converts to an active species without saying whether the PK describes parent, metabolite or moiety.',
  },
  'pk.route-listed': {
    level: 'error',
    summary: 'pk carries a route that routes[] does not list.',
  },
  'pk.salt-disposition-drift': {
    level: 'error',
    summary: "A route's salt/base disposition contradicts what the record declares.",
  },
  'pk.shared-source-conflict': {
    level: 'error',
    summary: 'Two records for one molecule cite sources that disagree.',
  },
  'pk.species-in-note': {
    level: 'warning',
    summary: 'The prose names an animal PK source but source_species is unset.',
  },
  'pk.template-ka': {
    level: 'warning',
    summary: 'One ka value is shared by unrelated compounds under different citations.',
  },
  'pk.template-quartet': {
    level: 'warning',
    summary:
      'Unrelated compounds store an identical ka/V/F set under different citations — a repeated default, not independent measurements.',
  },
  'pk.unsolvable-default-route': {
    level: 'warning',
    summary:
      'routes[0] yields no elimination rate, so the commonest path through the record renders no curve.',
  },
  'pk.unsolvable-route': {
    level: 'warning',
    summary: 'A declared route yields no elimination rate, so a dose against it renders nothing.',
  },
  'receptor.alias': {
    level: 'error',
    summary: 'A non-canonical occupancy key, whose rows never combine with the canonical ones.',
  },
  'receptor.derived-value': {
    level: 'warning',
    summary:
      'An occupancy constant is the midpoint or mean of a range of published values, so no paper states it.',
  },
  'receptor.duplicate': {
    level: 'warning',
    summary: 'One record has two occupancy rows that resolve to the same target.',
  },
  'receptor.ec50-positive': {
    level: 'error',
    summary: 'EC50 must be greater than zero.',
  },
  'receptor.emax-range': {
    level: 'error',
    summary: 'Emax outside (0, 1].',
  },
  'receptor.gene-key': {
    level: 'error',
    summary:
      'An occupancy row uses the catalog gene key instead of the occupancy shorthand it resolves from.',
  },
  'receptor.hill-positive': {
    level: 'error',
    summary: 'The Hill coefficient must be greater than zero.',
  },
  'receptor.needs-keo': {
    level: 'error',
    summary:
      'Occupancy rows exist with no effect compartment, so occupancy never gets a time course.',
  },
  'receptor.pmid': {
    level: 'error',
    summary: 'An occupancy row cites neither a PMID nor a regulatory label.',
  },
  'receptor.secondary-source': {
    level: 'warning',
    summary:
      'An occupancy constant comes from the IUPHAR/GtoPdb ligand page while the citation names a paper nobody fetched.',
  },
  'receptor.unknown-target': {
    level: 'warning',
    summary:
      'Occupancy keys with no catalog entry render as bare keys, with no gene or GtoPdb anchor.',
  },
  'slug.unique': {
    level: 'error',
    summary: 'Two records claim one slug.',
  },
  'systems.tagged': {
    level: 'error',
    summary: 'No body system tagged, so the record surfaces only under the untagged filter.',
  },
  'systems.unique': {
    level: 'error',
    summary: 'A body system is listed twice on one record.',
  },
  'systems.valid': {
    level: 'error',
    summary: 'A system tag that is not one of the ten.',
  },
};

/** The rule ids whose warnings are standing caveats rather than a backlog. */
export const STANDING_CAVEAT_RULES: ReadonlySet<string> = new Set(
  Object.entries(LINT_RULES)
    .filter(([, r]) => r.standing)
    .map(([id]) => id),
);
