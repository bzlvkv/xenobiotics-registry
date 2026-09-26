/**
 * Shared record shapes for the one-off audit scripts in this folder
 * (audit_pk_sources, audit_all_pk_pmids, audit_full_registry).
 *
 * These scripts are read-only analyses kept beside the data they inspect so a
 * later reader can re-run the pass that produced a finding. They used `any`
 * throughout, which made `pnpm lint` fail repo-wide — a red gate on the very
 * package whose gates are supposed to protect the data. Narrow structural
 * types fix that without changing what any script reports.
 *
 * Deliberately structural and partial rather than importing the real Compound:
 * an audit script's whole job is to look at data that may be malformed, so it
 * must not assume the shape the loader would have enforced.
 */

export interface AuditRoutePk {
  F?: number;
  ka_hr?: number;
  ke_hr?: number;
  V_L?: number;
  source_pmid?: string;
  source_label?: string;
}

export interface AuditEffectCompartment {
  keo_per_h?: number;
  source_pmid?: string;
  approximated?: boolean;
  note?: string;
}

export interface AuditReceptorSite {
  receptor: string;
  emax?: number;
  ec50_mg_l?: number;
  hill_n?: number;
  source_pmid?: string;
  note?: string;
}

export interface AuditCompound {
  slug: string;
  name: string;
  category: string;
  mechanism?: string;
  notes?: string;
  routes?: string[];
  half_life_hr?: Record<string, number | undefined>;
  pk?: Record<string, AuditRoutePk | undefined>;
  effect_compartment?: AuditEffectCompartment;
  receptor_occupancy?: AuditReceptorSite[];
}

/** Entries of a compound's `pk` map, typed. */
export function pkEntries(c: AuditCompound): [string, AuditRoutePk | undefined][] {
  return Object.entries(c.pk ?? {});
}
