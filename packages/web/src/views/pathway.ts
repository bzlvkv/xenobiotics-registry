import { SYSTEM_META, compoundsForPathway, type Pathway } from '@xeno/registry';
import { compoundLink, findingsFor, type Ctx } from '../ctx';
import {
  card,
  chip,
  chipLink,
  dash,
  el,
  frag,
  inline,
  kv,
  link,
  pmidLinks,
  prose,
  refList,
  table,
  type Child,
  type Row,
} from '../ui';
import { findingsTable } from './health';

/** A step's from/to/via may carry a slug; link it when the catalog has it. */
function party(ctx: Ctx, label: string | undefined, slug: string | undefined): Child {
  if (!label && !slug) return dash();
  if (slug && ctx.byCompound.has(slug)) return frag(compoundLink(ctx, slug, label ?? slug));
  return frag(label ?? el('code', null, slug ?? ''));
}

function steps(ctx: Ctx, p: Pathway): HTMLElement {
  const list = p.steps ?? [];
  if (!list.length) return el('p', { class: 'pad muted' }, 'No steps authored.');
  const cols = [
    { label: '#', align: 'r' as const },
    { label: 'from' },
    { label: 'to' },
    { label: 'via' },
    { label: 'Recon3D reactions' },
    { label: 'source' },
  ];
  const rows: Row[] = [];
  list.forEach((s, i) => {
    rows.push([
      i + 1,
      party(ctx, s.from, s.from_slug),
      party(ctx, s.to, s.to_slug),
      party(ctx, s.via, s.via_slug),
      (s.recon3d_reaction_ids ?? []).length
        ? el(
            'span',
            { class: 'chips' },
            (s.recon3d_reaction_ids ?? []).map((r) => chip(r)),
          )
        : dash(),
      s.source_pmid ? pmidLinks(s.source_pmid) : dash(),
    ]);
    if (s.note) rows.push({ full: frag(el('b', null, `${i + 1}. `), inline(s.note)) });
  });
  return table(cols, rows);
}

function modulators(ctx: Ctx, p: Pathway): HTMLElement {
  const list = p.modulators ?? [];
  if (!list.length) return el('p', { class: 'pad muted' }, 'No modulators authored.');
  const cols = [
    { label: 'compound' },
    { label: 'effect' },
    { label: 'target' },
    { label: 'step' },
    { label: 'source' },
  ];
  const rows: Row[] = [];
  list.forEach((m, i) => {
    rows.push([
      compoundLink(ctx, m.slug),
      m.effect ? chip(m.effect) : dash(),
      m.target ?? dash(),
      m.step ?? dash(),
      m.source_pmid ? pmidLinks(m.source_pmid) : dash(),
    ]);
    if (m.note) rows.push({ full: frag(el('b', null, `${i + 1}. `), inline(m.note)) });
  });
  return table(cols, rows);
}

/**
 * A stored diagram is a node/edge list, and this client renders it as one. A
 * graph layout would be a second, unverifiable representation of data whose
 * whole value is that each edge carries a PMID — so the edges get a table with
 * their citations instead.
 */
function diagram(p: Pathway): HTMLElement | null {
  const d = p.diagram;
  if (!d) return null;
  const nodes = d.nodes ?? [];
  const edges = d.edges ?? [];
  return card(
    'Diagram',
    `${nodes.length} nodes, ${edges.length} edges`,
    table(
      [{ label: 'node' }, { label: 'label' }, { label: 'kind' }],
      nodes.map((n) => [el('code', null, n.id), n.label, n.kind ? chip(n.kind) : dash()]),
    ),
    table(
      [
        { label: 'from' },
        { label: 'to' },
        { label: 'label' },
        { label: 'location' },
        { label: 'role' },
        { label: 'source' },
      ],
      edges.map((e) => [
        el('code', null, e.from),
        el('code', null, e.to),
        e.label ?? dash(),
        e.location ?? dash(),
        e.role ? chip(e.role) : dash(),
        e.pmid ? pmidLinks(e.pmid) : dash(),
      ]),
    ),
  );
}

export function pathwayView(ctx: Ctx, slug: string): Node {
  const p = ctx.byPathway.get(slug);
  if (!p) {
    return frag(
      el('h1', null, 'No such pathway'),
      el(
        'p',
        { class: 'lede' },
        frag('Nothing in the registry has the slug ', el('code', null, slug), '.'),
      ),
      el('p', null, link('#/pathways', 'Back to the catalog')),
    );
  }
  const findings = findingsFor(ctx, p.slug);
  const touching = compoundsForPathway(ctx.compounds, p);

  return frag(
    el('div', { class: 'crumb' }, link('#/pathways', 'Pathways'), ' / ', el('code', null, p.slug)),
    el('h1', null, p.name),
    p.subtitle ? el('p', { class: 'lede' }, p.subtitle) : null,
    findings.length
      ? card('Lint findings for this record', findings.length, findingsTable(ctx, findings, false))
      : null,
    card('Description', null, prose(p.description)),
    card(
      'Classification',
      null,
      kv([
        ['category', p.category.replace(/_/g, ' ')],
        [
          'domains',
          (p.domains ?? []).length
            ? el(
                'span',
                { class: 'chips' },
                (p.domains ?? []).map((d) => chip(d.replace(/_/g, ' '))),
              )
            : dash(),
        ],
        [
          'body systems',
          (p.systems ?? []).length
            ? el(
                'span',
                { class: 'chips' },
                (p.systems ?? []).map((s) => chip(SYSTEM_META[s]?.label ?? s)),
              )
            : dash(),
        ],
        ['sensation', p.sensation ?? dash()],
        ['Recon3D subsystem', p.recon3d_subsystem ?? dash()],
      ]),
    ),
    card('Steps', `${(p.steps ?? []).length}`, steps(ctx, p)),
    card('Modulators', `${(p.modulators ?? []).length}`, modulators(ctx, p)),
    card(
      'Compounds routed here',
      `${touching.length}`,
      touching.length
        ? el(
            'div',
            { class: 'pad chips' },
            touching.map((c) => chipLink(`#/compounds/${c.slug}`, c.name)),
          )
        : el('p', { class: 'pad muted' }, 'None.'),
    ),
    diagram(p),
    card('References', `${(p.refs ?? []).length}`, el('div', { class: 'pad' }, refList(p.refs))),
  );
}
