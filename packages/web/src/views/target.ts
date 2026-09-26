import { targetKeyFor, compoundsForTarget, type Compound, type ReceptorSite } from '@xeno/registry';
import { gtopdbUrl, pathwayLink, targetName, type Ctx } from '../ctx';
import {
  card,
  chip,
  dash,
  decodeEntities,
  el,
  ext,
  frag,
  inline,
  kv,
  link,
  num,
  pmidLinks,
  table,
  type Row,
} from '../ui';

function rowsAt(c: Compound, canon: string): ReceptorSite[] {
  return (c.receptor_occupancy ?? []).filter((r) => targetKeyFor(r.receptor) === canon);
}

export function targetView(ctx: Ctx, keyIn: string): Node {
  const canon = targetKeyFor(keyIn);
  const t = ctx.byTarget.get(canon);
  const bound = compoundsForTarget(ctx.compounds, canon);
  const url = gtopdbUrl(t?.gtp_id);

  const cols = [
    { label: 'compound' },
    { label: 'action' },
    { label: 'Emax', align: 'r' as const },
    { label: 'EC50 mg/L', align: 'r' as const },
    { label: 'Hill', align: 'r' as const },
    { label: 'basis' },
    { label: 'pathway' },
    { label: 'source' },
  ];
  const rows: Row[] = [];
  for (const c of bound) {
    for (const r of rowsAt(c, canon)) {
      rows.push([
        link(`#/compounds/${c.slug}`, c.name),
        r.action ? chip(r.action) : dash(),
        num(r.emax),
        num(r.ec50_mg_l),
        num(r.hill_n),
        r.basis ? el('code', null, r.basis) : dash(),
        r.pathway ? pathwayLink(ctx, r.pathway) : dash(),
        r.source_pmid ? pmidLinks(r.source_pmid) : dash(),
      ]);
      if (r.note) rows.push({ full: frag(el('b', null, `${c.name} — `), inline(r.note)) });
    }
  }

  return frag(
    el('div', { class: 'crumb' }, link('#/targets', 'Targets'), ' / ', el('code', null, canon)),
    el('h1', null, t ? targetName(t) : canon),
    canon !== keyIn
      ? el(
          'p',
          { class: 'pad note' },
          frag(
            'Occupancy rows write ',
            el('code', null, keyIn),
            '; it resolves to the catalog entry ',
            el('code', null, canon),
            '.',
          ),
        )
      : null,
    t
      ? card(
          'Catalog',
          t.kind === 'gpcr' ? chip('GPCR', 'accent') : chip(t.class ?? 'non-GPCR'),
          kv([
            ['key', el('code', null, t.key)],
            ['name', targetName(t)],
            ['full name', t.full_name ? decodeEntities(t.full_name) : dash()],
            ['gene', t.gene ? el('code', null, t.gene) : dash()],
            ['family', t.family ?? dash()],
            ['class', t.class ?? (t.kind === 'gpcr' ? 'GPCR' : dash())],
            ['Guide to PHARMACOLOGY', url ? ext(url, `objectId ${t.gtp_id}`) : dash()],
          ]),
        )
      : card(
          'Not in the catalog',
          null,
          el(
            'p',
            { class: 'pad' },
            frag(
              'No catalogued target has the key ',
              el('code', null, canon),
              '. The occupancy rows below are authored against it, so the key needs either a catalog entry or an alias ',
              'to the entry it means.',
            ),
          ),
        ),
    card(
      'Compounds with authored occupancy here',
      `${bound.length} compound${bound.length === 1 ? '' : 's'}`,
      rows.length
        ? table(cols, rows)
        : el(
            'p',
            { class: 'pad muted' },
            'No compound in the registry has an authored occupancy row at this target.',
          ),
    ),
  );
}
