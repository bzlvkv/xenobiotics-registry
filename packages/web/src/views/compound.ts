import {
  SYSTEM_META,
  citationsIn,
  impliedExposure,
  interactionsOf,
  type Compound,
  type ExposureInput,
  type InteractionKinetics,
  type Route,
  type RoutePk,
} from '@xeno/registry';
import { compoundLink, findingsFor, pathwayLink, targetLink, type Ctx } from '../ctx';
import {
  card,
  chip,
  collapsible,
  dash,
  el,
  fmt,
  frag,
  inline,
  kv,
  link,
  num,
  pmidLinks,
  prose,
  refList,
  statement,
  table,
  type Child,
  type Row,
} from '../ui';
import { findingsTable } from './health';

const ROUTES: Route[] = ['PO', 'SL', 'IM', 'IV', 'SC', 'IN', 'TD', 'INH', 'PR'];

const PK_PARAMS: { key: keyof RoutePk; label: string }[] = [
  { key: 'F', label: 'F' },
  { key: 'V_L', label: 'V (L)' },
  { key: 'ka_hr', label: 'ka /h' },
  { key: 'lag_hr', label: 'lag h' },
  { key: 'alpha_hr', label: 'α /h' },
  { key: 'beta_hr', label: 'β /h' },
  { key: 'k21_hr', label: 'k21 /h' },
  { key: 'zo_dur_hr', label: 'zero-order h' },
  { key: 'mm_vmax_per_hr', label: 'Vmax /h' },
  { key: 'mm_km_mg_per_l', label: 'Km mg/L' },
  { key: 'mm_linear_ke_hr', label: 'linear ke /h' },
];

function sourceCell(pmid?: string, label?: string): Child {
  if (pmid) return pmidLinks(pmid);
  if (label) return el('span', { class: 'sub' }, label);
  return dash();
}

function identity(c: Compound): HTMLElement {
  const rows: [string, Child][] = [
    ['slug', el('code', null, c.slug)],
    ['category', c.category],
    [
      'body systems',
      (c.systems ?? []).length
        ? el(
            'span',
            { class: 'chips' },
            (c.systems ?? []).map((s) => chip(SYSTEM_META[s]?.label ?? s)),
          )
        : dash(),
    ],
    ['aliases', (c.aliases ?? []).length ? (c.aliases ?? []).join(', ') : dash()],
    [
      'retired slugs',
      (c.retired_slugs ?? []).length
        ? el(
            'span',
            { class: 'chips' },
            (c.retired_slugs ?? []).map((s) => chip(s)),
          )
        : dash(),
    ],
    ['MW g/mol', num(c.mw_g_mol)],
  ];
  if (c.recon3d_metabolite_id)
    rows.push(['Recon3D metabolite', el('code', null, c.recon3d_metabolite_id)]);
  if (c.pk_analyte)
    rows.push([
      'PK analyte',
      frag(c.pk_analyte, c.pk_analyte_name ? ` — ${c.pk_analyte_name}` : null),
    ]);
  if (c.fraction_unbound !== undefined)
    rows.push([
      'fraction unbound',
      frag(
        num(c.fraction_unbound),
        c.fu_note ? el('div', { class: 'sub' }, inline(c.fu_note)) : null,
      ),
    ]);
  if (c.dose_moiety_fraction !== undefined)
    rows.push([
      'dose moiety fraction',
      frag(
        num(c.dose_moiety_fraction),
        c.dose_moiety_note ? el('div', { class: 'sub' }, inline(c.dose_moiety_note)) : null,
      ),
    ]);
  return kv(rows);
}

function doseTable(c: Compound): HTMLElement {
  const routes = ROUTES.filter((r) => c.doses?.[r] ?? (c.routes ?? []).includes(r));
  if (!routes.length) return el('p', { class: 'pad muted' }, 'No routes recorded.');
  return table(
    [
      { label: 'route' },
      { label: 'min', align: 'r' },
      { label: 'typical', align: 'r' },
      { label: 'max', align: 'r' },
      { label: 'unit' },
    ],
    routes.map((r) => {
      const d = c.doses?.[r];
      return [el('b', null, r), num(d?.min), num(d?.typical), num(d?.max), d?.unit ?? dash()];
    }),
  );
}

function pkTable(c: Compound): HTMLElement {
  const routes = ROUTES.filter((r) => c.pk?.[r] || c.half_life_hr?.[r] !== undefined);
  if (!routes.length)
    return el('p', { class: 'pad muted' }, 'No per-route pharmacokinetics stored.');
  const params = PK_PARAMS.filter((p) => routes.some((r) => c.pk?.[r]?.[p.key] !== undefined));
  const cols = [
    { label: 'route' },
    { label: 't½ h', align: 'r' as const },
    ...params.map((p) => ({ label: p.label, align: 'r' as const })),
    { label: 'source' },
    { label: 'species' },
  ];
  const rows: Row[] = [];
  for (const r of routes) {
    const b = c.pk?.[r];
    rows.push([
      el('b', null, r),
      num(c.half_life_hr?.[r]),
      ...params.map((p) => {
        const v = b?.[p.key];
        return typeof v === 'number' ? fmt(v) : dash();
      }),
      sourceCell(b?.source_pmid, b?.source_label),
      b?.source_species ? chip(b.source_species, 'est') : dash(),
    ]);
    if (b?.note) rows.push({ full: frag(el('b', null, `${r} — `), inline(b.note)) });
  }
  return table(cols, rows);
}

/** A number with where it came from. A default is the case worth seeing: the
 *  record does not store it, and every consumer assumes it anyway. */
function sourced(v: ExposureInput): Child {
  if (v.from === 'default') return frag(fmt(v.value), ' ', chip('default', 'warn'));
  if (v.from === 'derived')
    return frag(fmt(v.value), ' ', el('span', { class: 'muted' }, 'derived'));
  return fmt(v.value);
}

/**
 * What the stored numbers imply at the typical dose. This is the "check what the
 * record does" step from authoring/HYGIENE.md: values that are each correctly
 * cited can still be jointly impossible, and only the resolved peak, exposure and
 * clearance show it.
 */
function implied(c: Compound): HTMLElement | null {
  const routes = ROUTES.filter((r) => c.pk?.[r] || c.half_life_hr?.[r] !== undefined);
  if (!routes.length) return null;
  const cols = [
    { label: 'route' },
    { label: 'dose mg', align: 'r' as const },
    { label: 'F', align: 'r' as const },
    { label: 'V (L)', align: 'r' as const },
    { label: 'ka /h', align: 'r' as const },
    { label: 't½ h', align: 'r' as const, hide: true },
    { label: 'Tmax h', align: 'r' as const },
    { label: 'Cmax mg/L', align: 'r' as const },
    { label: 'AUC mg·h/L', align: 'r' as const, hide: true },
    { label: 'CL L/h', align: 'r' as const },
  ];
  const rows: Row[] = [];
  for (const r of routes) {
    const x = impliedExposure(c, r);
    if (!x.ok) {
      rows.push({
        full: frag(
          el('b', null, `${r}: `),
          el('span', { class: 'muted' }, `not resolvable, ${x.reason}.`),
        ),
      });
      continue;
    }
    rows.push([
      el('b', null, r),
      fmt(x.doseMg),
      sourced(x.F),
      sourced(x.V),
      x.ka ? sourced(x.ka) : dash(),
      fmt(x.halfLifeHr.value),
      fmt(x.tmaxHr),
      fmt(x.cmaxMgPerL),
      fmt(x.aucMgHrPerL),
      fmt(x.clearanceLPerHr),
    ]);
    if (x.caveats.length)
      rows.push({ full: frag(el('b', null, `${r}: `), x.caveats.join('; ') + '.') });
  }
  return card(
    'What the stored values imply',
    null,
    el(
      'p',
      { class: 'pad sub' },
      'One-compartment arithmetic at the typical dose. An input marked default is not stored on this record, ' +
        'yet every consumer assumes it. Hold Cmax, AUC and CL against the cited paper: values that are each ' +
        'correctly cited can still be jointly impossible.',
    ),
    table(cols, rows),
  );
}

function unauthored(c: Compound): HTMLElement | null {
  const u = c.pk_unauthored;
  if (!u) return null;
  return card(
    'PK deliberately not authored',
    null,
    statement(
      chip(u.reason, 'est'),
      u.note ? inline(u.note) : el('span', { class: 'muted' }, 'No note.'),
    ),
    el(
      'p',
      { class: 'pad sub' },
      'A stated reason, not a missing value: deleting an unsupported number would leave this record asserting ' +
        'a consumer default invisibly, so the absence is declared instead.',
    ),
  );
}

function effectCompartment(c: Compound): HTMLElement | null {
  const ec = c.effect_compartment;
  if (!ec) return null;
  const halfEq = ec.keo_per_h ? Math.LN2 / ec.keo_per_h : undefined;
  return card(
    'Effect compartment',
    ec.approximated ? chip('estimated, not fitted', 'warn') : chip('fitted to data', 'accent'),
    kv([
      ['keo /h', num(ec.keo_per_h)],
      [
        't½ equilibration',
        halfEq === undefined
          ? dash()
          : el('span', null, `${fmt(Math.round(halfEq * 600) / 10)} min (derived from keo)`),
      ],
      [
        'basis',
        ec.approximated
          ? 'Reasoned from time-to-peak-effect or an analogue — not a published keo.'
          : 'Fitted keo from the cited study.',
      ],
      ['species', ec.source_species ? chip(ec.source_species, 'est') : dash()],
      ['source', sourceCell(ec.source_pmid)],
    ]),
    ec.note ? el('div', { class: 'pad note' }, inline(ec.note)) : null,
  );
}

function occupancy(ctx: Ctx, c: Compound): HTMLElement | null {
  const rows = c.receptor_occupancy ?? [];
  if (!rows.length) return null;
  const cols = [
    { label: 'target' },
    { label: 'action' },
    { label: 'Emax', align: 'r' as const },
    { label: 'EC50 mg/L', align: 'r' as const },
    { label: 'Hill', align: 'r' as const },
    { label: 'basis' },
    { label: 'pathway' },
    { label: 'source' },
  ];
  const out: Row[] = [];
  rows.forEach((r, i) => {
    out.push([
      targetLink(ctx, r.receptor),
      r.action ? chip(r.action) : dash(),
      num(r.emax),
      num(r.ec50_mg_l),
      num(r.hill_n),
      r.basis ? el('code', null, r.basis) : dash(),
      r.pathway ? pathwayLink(ctx, r.pathway) : dash(),
      sourceCell(r.source_pmid),
    ]);
    if (r.note) out.push({ full: frag(el('b', null, `${i + 1}. `), inline(r.note)) });
  });
  return card(
    'Receptor occupancy',
    `${rows.length} row${rows.length === 1 ? '' : 's'}`,
    table(cols, out),
  );
}

function kinetics(k: InteractionKinetics | undefined): Child {
  if (!k) return dash();
  const bits: string[] = [];
  if (k.ki_uM !== undefined)
    bits.push(`Ki ${fmt(k.ki_uM)} µM${k.ki_basis ? ` (${k.ki_basis})` : ''}`);
  if (k.auc_ratio !== undefined) bits.push(`AUC ×${fmt(k.auc_ratio)}`);
  if (k.induction_factor !== undefined) bits.push(`induction ×${fmt(k.induction_factor)}`);
  if (k.assumed_perp_uM !== undefined) bits.push(`perpetrator ${fmt(k.assumed_perp_uM)} µM`);
  if (k.mbi) bits.push('mechanism-based inhibition');
  if (k.plasma_binding_displacement) bits.push('plasma binding displacement');
  return bits.length ? el('span', { class: 'sub' }, bits.join(' · ')) : dash();
}

function interactions(ctx: Ctx, c: Compound): HTMLElement | null {
  const edges = interactionsOf(ctx.compounds, c.slug);
  if (!edges.length) return null;
  const cols = [
    { label: '' },
    { label: 'counterparty' },
    { label: 'level' },
    { label: 'timing' },
    { label: 'kinetics' },
    { label: 'source' },
  ];
  const rows: Row[] = [];
  edges.forEach((e, i) => {
    rows.push([
      e.direction === 'out'
        ? chip('declared here', 'accent')
        : el('span', { title: 'declared on the other record' }, chip('inbound')),
      e.other ? compoundLink(ctx, e.other.slug) : compoundLink(ctx, e.ref.slug, e.ref.name),
      e.ref.level ? chip(e.ref.level) : dash(),
      e.ref.timing ?? dash(),
      kinetics(e.ref.kinetics),
      sourceCell(e.ref.source_pmid),
    ]);
    if (e.ref.note) rows.push({ full: frag(el('b', null, `${i + 1}. `), inline(e.ref.note)) });
  });
  return card(
    'Interactions',
    `${edges.length} edge${edges.length === 1 ? '' : 's'}, both directions`,
    table(cols, rows),
  );
}

function composition(ctx: Ctx, c: Compound): HTMLElement | null {
  const comp = c.composition;
  if (!comp) return null;
  const rows = comp.constituents ?? [];
  return card(
    'Composition',
    `${rows.length} constituent${rows.length === 1 ? '' : 's'}`,
    comp.standardization ? el('div', { class: 'pad sub' }, inline(comp.standardization)) : null,
    rows.length
      ? table(
          [
            { label: 'constituent' },
            { label: 'mg per g extract', align: 'r' },
            // A constituent may carry its own assay PMID; without this column the
            // only place it surfaced was the deduped Citations roll-up below.
            { label: 'source' },
            { label: 'note' },
          ],
          rows.map((r) => [
            compoundLink(ctx, r.slug),
            num(r.mg_per_g_extract),
            sourceCell(r.source_pmid),
            r.note ? el('span', { class: 'sub' }, inline(r.note)) : dash(),
          ]),
        )
      : el('p', { class: 'pad muted' }, 'No constituents broken out.'),
  );
}

function nutrition(c: Compound): HTMLElement | null {
  const n = c.nutrition;
  if (!n) return null;
  return card(
    'Nutrition',
    null,
    kv([
      ['RDI', n.rdi === undefined ? dash() : `${fmt(n.rdi)} ${n.unit ?? ''}`.trim()],
      ['upper limit', n.ul === undefined ? dash() : `${fmt(n.ul)} ${n.unit ?? ''}`.trim()],
      ['unit', n.unit ?? dash()],
      ['source', sourceCell(n.source_pmid)],
    ]),
    n.note ? el('div', { class: 'pad note' }, inline(n.note)) : null,
  );
}

/** Every PMID anywhere in this record, deduped, with where it came from. */
function citations(c: Compound): HTMLElement {
  const byPmid = new Map<string, Set<string>>();
  for (const cite of citationsIn(c, c.slug)) {
    const id = String(cite.pmid).replace(/^PMID:?\s*/i, '');
    const set = byPmid.get(id) ?? new Set<string>();
    set.add(cite.origin);
    byPmid.set(id, set);
  }
  if (!byPmid.size)
    return card('Citations', 'none', el('p', { class: 'pad muted' }, 'This record cites nothing.'));
  return card(
    'Citations',
    `${byPmid.size} unique PMID${byPmid.size === 1 ? '' : 's'}`,
    table(
      [{ label: 'PMID' }, { label: 'cited by' }],
      [...byPmid.entries()].map(([id, origins]) => [
        pmidLinks(id),
        el('span', { class: 'sub' }, [...origins].join(', ')),
      ]),
    ),
  );
}

export function compoundView(ctx: Ctx, slug: string): Node {
  const c = ctx.byCompound.get(slug);
  if (!c) {
    return frag(
      el('h1', null, 'No such compound'),
      el(
        'p',
        { class: 'lede' },
        frag('Nothing in the registry has the slug ', el('code', null, slug), '.'),
      ),
      el('p', null, link('#/compounds', 'Back to the catalog')),
    );
  }
  const redirected = c.slug !== slug;
  const findings = findingsFor(ctx, c.slug);

  return frag(
    el(
      'div',
      { class: 'crumb' },
      link('#/compounds', 'Compounds'),
      ' / ',
      el('code', null, c.slug),
    ),
    el('h1', null, c.name),
    el(
      'p',
      { class: 'lede' },
      (c.aliases ?? []).length ? `Also: ${(c.aliases ?? []).join(', ')}.` : null,
      ' ',
      el(
        'span',
        { class: 'chips' },
        chip(c.category, 'accent'),
        (c.systems ?? []).map((s) => chip(SYSTEM_META[s]?.short ?? s)),
      ),
    ),
    redirected
      ? el(
          'p',
          { class: 'pad note' },
          frag(
            el('code', null, slug),
            ' is a retired slug. This record absorbed it — the live slug is ',
            el('code', null, c.slug),
            '.',
          ),
        )
      : null,
    findings.length
      ? card('Lint findings for this record', findings.length, findingsTable(ctx, findings, false))
      : null,
    card('Identity', null, identity(c)),
    c.mechanism ? card('Mechanism', null, prose(c.mechanism)) : null,
    card('Routes and doses', null, doseTable(c)),
    card('Pharmacokinetics by route', null, pkTable(c)),
    implied(c),
    unauthored(c),
    effectCompartment(c),
    occupancy(ctx, c),
    interactions(ctx, c),
    composition(ctx, c),
    nutrition(c),
    card('References', `${(c.refs ?? []).length}`, el('div', { class: 'pad' }, refList(c.refs))),
    citations(c),
    c.notes
      ? el(
          'section',
          { class: 'card' },
          collapsible(
            `Provenance notes (${c.notes.length.toLocaleString('en-US')} characters) — the audit trail`,
            prose(c.notes),
          ),
        )
      : null,
    findings.length === 0
      ? el('p', { class: 'sub' }, 'The linter reports nothing against this record.')
      : null,
  );
}
