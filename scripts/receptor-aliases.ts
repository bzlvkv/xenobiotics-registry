/**
 * receptor-aliases.ts — canonical receptor-key map for receptor_occupancy.
 *
 * `receptor_occupancy[].receptor` is a free-text key, so the same receptor
 * accreted multiple spellings as authoring sessions added rows. The union
 * math in @xeno/solver (compositeOccupancyCurve) groups by EXACT key, so
 * `mu_opioid` and `MOR` render as two separate donuts for one receptor and
 * never combine. This map collapses each known alias to one canonical key.
 *
 * Shared by scripts/normalize-receptor-keys.ts (applies the map) and
 * scripts/data-lint.ts (errors on any alias key, warns on intra-compound
 * duplicates) so the two can't drift.
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

/** Map a possibly-aliased receptor key to its canonical form. */
export function canonicalReceptor(key: string): string {
  return RECEPTOR_ALIASES[key] ?? key;
}
