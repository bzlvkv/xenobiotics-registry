/**
 * LINT_RULES must list exactly the rule ids lint.ts emits, at the level it emits
 * them. The table is what `pnpm validate --rule` checks an id against and what the
 * client glosses a finding with, so a rule missing from it would be refused by the
 * gate and shown without explanation, and a stale entry would accept a dead id.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LINT_RULES, STANDING_CAVEAT_RULES } from '../src/index';

const source = readFileSync(new URL('../src/lint.ts', import.meta.url), 'utf8');
const emitted = new Map<string, Set<string>>();
for (const m of source.matchAll(
  /\b(err|warn)\(\s*[^,()]+(?:\([^)]*\))?[^,()]*,\s*'([a-z0-9-]+(?:\.[a-z0-9-]+)+)'/g,
)) {
  const level = m[1] === 'err' ? 'error' : 'warning';
  const set = emitted.get(m[2]!) ?? new Set<string>();
  set.add(level);
  emitted.set(m[2]!, set);
}

describe('LINT_RULES', () => {
  it('lists every rule lint.ts emits, and nothing else', () => {
    expect(Object.keys(LINT_RULES).sort()).toEqual([...emitted.keys()].sort());
  });

  it('records the level each rule is emitted at', () => {
    for (const [id, levels] of emitted) {
      expect([...levels], id).toEqual([LINT_RULES[id]!.level]);
    }
  });

  it('marks only warnings as standing caveats', () => {
    expect(STANDING_CAVEAT_RULES.size).toBe(4);
    for (const id of STANDING_CAVEAT_RULES) expect(LINT_RULES[id]!.level).toBe('warning');
  });
});
