import { LINT_RULES, type Finding } from '@xeno/registry';
import { entityLink, type Ctx } from '../ctx';
import type { Loc } from '../router';
import { replaceQuery } from '../router';
import { card, chip, el, frag, search, select, table, type Row } from '../ui';

export function findingsTable(
  ctx: Ctx,
  findings: readonly Finding[],
  withEntity = true,
): HTMLElement {
  const cols = withEntity
    ? [{ label: 'level' }, { label: 'record' }, { label: 'rule' }, { label: 'message' }]
    : [{ label: 'level' }, { label: 'rule' }, { label: 'message' }];
  const rows: Row[] = findings.map((f) => {
    const level = chip(f.level, f.level === 'error' ? 'error' : 'warn');
    const rule = el('span', { class: 'rule' }, f.rule);
    return withEntity
      ? [level, entityLink(ctx, f.entity), rule, f.message]
      : [level, rule, f.message];
  });
  return table(cols, rows);
}

export function healthView(ctx: Ctx, loc: Loc): Node {
  const state = { q: loc.query.get('q') ?? '', level: loc.query.get('level') ?? '' };
  const errors = ctx.findings.filter((f) => f.level === 'error');
  const body = el('div');

  const apply = (): void => {
    const q = state.q.trim().toLowerCase();
    const shown = ctx.findings.filter(
      (f) =>
        (!state.level || f.level === state.level) &&
        (!q || `${f.entity} ${f.rule} ${f.message}`.toLowerCase().includes(q)),
    );
    const byRule = new Map<string, Finding[]>();
    for (const f of shown) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);
    const groups = [...byRule.entries()].sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
    );
    body.replaceChildren(
      shown.length === 0
        ? el(
            'p',
            { class: 'pad' },
            ctx.findings.length === 0 ? 'No findings.' : 'No finding matches that filter.',
          )
        : frag(
            ...groups.map(([rule, list]) => {
              const worst = list.some((f) => f.level === 'error') ? 'error' : 'warning';
              return card(
                rule,
                frag(
                  chip(worst, worst === 'error' ? 'error' : 'warn'),
                  LINT_RULES[rule]?.standing ? frag(' ', chip('standing caveat', 'est')) : null,
                  ` ${list.length} finding${list.length === 1 ? '' : 's'}`,
                ),
                findingsTable(ctx, list),
              );
            }),
          ),
    );
  };

  const push = (): void => {
    replaceQuery('health', state);
    apply();
  };

  apply();
  return frag(
    el('h1', null, 'Registry health'),
    el(
      'div',
      { class: 'stats' },
      el(
        'div',
        { class: `stat ${errors.length ? 'bad' : 'good'}` },
        el('b', null, errors.length),
        el('span', null, 'errors'),
      ),
      el(
        'div',
        { class: 'stat' },
        el('b', null, ctx.findings.length - errors.length),
        el('span', null, 'warnings'),
      ),
      el(
        'div',
        { class: 'stat' },
        el('b', null, new Set(ctx.findings.map((f) => f.rule)).size),
        el('span', null, 'rules firing'),
      ),
      el(
        'div',
        { class: 'stat' },
        el('b', null, new Set(ctx.findings.map((f) => f.entity)).size),
        // Not "records": `receptor.unknown-target` is filed against `(catalog)`,
        // which is the whole receptor list rather than any one record.
        el('span', null, 'entities affected'),
      ),
    ),
    el(
      'div',
      { class: 'controls' },
      search(state.q, 'Search findings…', (v) => {
        state.q = v;
        push();
      }),
      select(
        'level',
        state.level,
        [
          ['', 'errors and warnings'],
          ['error', 'errors only'],
          ['warning', 'warnings only'],
        ],
        (v) => {
          state.level = v;
          push();
        },
      ),
    ),
    body,
  );
}
