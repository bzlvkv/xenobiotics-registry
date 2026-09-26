/**
 * dose.ts — the one conversion from a logged dose to the mass the solver models.
 *
 * `doseToMg` in @xeno/core answers "how many milligrams did the person take".
 * That is NOT the quantity the PK model consumes when the product is a salt and
 * `pk[]` describes the free base or the ion: the solver divides dose by volume,
 * so a salt mass against a free-base volume overstates every concentration by
 * the counter-ion's share of the formula mass.
 *
 * lithium is the case that forced this out into the open — 900 mg of lithium
 * carbonate is 169 mg of lithium, a 5.32× overstatement that put a standard
 * dose above the toxicity threshold on a drug people titrate by serum level.
 *
 * EVERY dose→mass conversion in this package goes through `analyteDoseMg`, and
 * `dose-moiety.test.ts` fails the build if a call site bypasses it. That guard
 * is the point: the failure mode of this field is not a wrong number, it is a
 * site that silently forgets to apply it.
 */
import { doseToMg, type DoseUnit } from '@xeno/core';

/** Just the moiety fraction, defaulted. Absent params ⇒ 1.0 (no correction). */
export function moietyFraction(pk?: { dose_moiety_fraction?: number } | null): number {
  const f = pk?.dose_moiety_fraction;
  return f != null && f > 0 && f <= 1 ? f : 1;
}

/**
 * Mass (mg) of the species `pk[]` describes, from a dose logged in its own
 * declared unit.
 *
 * `pk` is optional so that positivity and timing guards — which only ask
 * "is this a real dose" or "when was it" — can use the same function without
 * plumbing params they do not otherwise need. A positive fraction cannot
 * change the sign, so those call sites are unaffected either way; they go
 * through here so the no-bypass rule stays absolute and greppable.
 */
export function analyteDoseMg(
  dose: number,
  unit: DoseUnit,
  pk?: { dose_moiety_fraction?: number } | null,
): number {
  return doseToMg(dose, unit) * moietyFraction(pk);
}
