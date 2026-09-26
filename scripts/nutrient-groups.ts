/**
 * Nutrient grouping for the Daily-intake card — pure, registry-free, so the
 * roll-up math is unit-testable without the SvelteKit/store graph.
 *
 * Some "nutrients" are really several interconvertible FORMS (vitamers) that
 * share ONE FDA Daily Value: Vitamin B12 (cyano-/methyl-/hydroxocobalamin),
 * folate (folic acid / food folate / 5-MTHF), Vitamin D (D2/D3), Vitamin K
 * (K1/K2). The meaningful axis is the COMBINED intake vs that shared DV, not
 * each form alone — 1.2 mcg cyanocobalamin + 1.2 mcg methylcobalamin is 100%
 * of B12, which a per-form view misreads as two unmet 50% rows. This module
 * defines which forms group and rolls a set of member rows into one group row;
 * `stores-core` builds the per-window views on top, nesting the members so each
 * keeps showing its own value.
 */

/** Per-row data for the Daily-intake card — one entry per nutrient/electrolyte
 *  that has `nutrition` authored. `amount` is summed in the nutrition unit;
 *  cross-unit intakes (mg↔mcg↔g) convert, IU intakes only count when the
 *  authored unit is also IU. */
export interface DailyNutrient {
  slug: string;
  name: string;
  amount: number;
  rdi: number;
  ul?: number;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  pctOfRdi: number;
  overUl: boolean;
  /**
   * Group roll-up rows only: the member leaf rows whose amounts sum into this
   * row's `amount` (≥2 present members — e.g. cyanocobalamin + methylcobalamin
   * under Vitamin B12). Each member is itself a full `DailyNutrient` (its own
   * %DV and over-UL flag), so the card nests them beneath the group and they
   * keep showing their individual values. Absent on ordinary single-compound
   * rows. When present, `slug` is the synthetic group id (`group:…`), not a
   * compound slug — the card renders the group name as plain text, not a link.
   */
  members?: DailyNutrient[];
}

/**
 * Curated nutrient groups — vitamers / interconvertible forms that share ONE
 * FDA Daily Value. Membership is by slug; only members resolving to a
 * `nutrition`-bearing bundled compound count, and a group needs ≥2 present
 * members to form — with one it collapses to that member's ordinary row (same
 * DV, no empty header).
 */
export interface NutrientGroupDef {
  /** Synthetic row id — `group:`-prefixed so it never collides with a slug. */
  id: string;
  /** Display label for the roll-up row. */
  name: string;
  /** Member compound slugs (resolved against the bundled registry). */
  members: string[];
}

export const NUTRIENT_GROUPS: readonly NutrientGroupDef[] = [
  {
    id: 'group:vitamin-b12',
    name: 'Vitamin B12',
    members: ['methylcobalamin', 'cyanocobalamin'],
  },
  {
    id: 'group:folate',
    name: 'Folate (B9)',
    members: ['methylfolate', 'folate', 'folic-acid'],
  },
  {
    id: 'group:vitamin-d',
    name: 'Vitamin D',
    members: ['cholecalciferol', 'ergocalciferol'],
  },
  {
    id: 'group:vitamin-k',
    name: 'Vitamin K',
    members: ['phylloquinone', 'vitamin-k2-mk7'],
  },
];

/**
 * Roll member leaf rows into one group row. `amount` = Σ member amount; `rdi` =
 * the members' shared Daily Value. `ul` is set ONLY when every member carries
 * the same UL: folate's UL is specific to synthetic folic acid, not food folate
 * or 5-MTHF, so the *total* gets no UL flag while the folic-acid member still
 * flags its own crossing in its nested row. Returns null when the members can't
 * form one comparable row — <2 members, or a mismatched unit OR Daily Value
 * (the group premise is one shared DV; rather than silently masking authoring
 * drift behind a `max`, we refuse to group so the forms fall back to standalone
 * rows and the drift is visible). The caller handles null by leaving them
 * standalone.
 */
export function rollUpGroup(
  id: string,
  name: string,
  members: DailyNutrient[],
): DailyNutrient | null {
  const first = members[0];
  if (members.length < 2 || !first) return null;
  const unit = first.unit;
  const rdi = first.rdi;
  // The grouped forms must agree on the unit AND the Daily Value — they're one
  // nutrient with one DV. A mismatch means the registry drifted; don't group.
  if (members.some((m) => m.unit !== unit || m.rdi !== rdi)) return null;
  const amount = members.reduce((sum, m) => sum + m.amount, 0);
  // A group UL only when every member agrees on the same defined value.
  const ul = members.every((m) => m.ul != null && m.ul === first.ul) ? first.ul : undefined;
  return {
    slug: id,
    name,
    amount,
    rdi,
    ul,
    unit,
    pctOfRdi: rdi > 0 ? amount / rdi : 0,
    overUl: ul != null && amount > ul,
    members,
  };
}
