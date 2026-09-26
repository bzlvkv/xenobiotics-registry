/**
 * resettableMemo — proves the registry boot can RECOVER from a transient load
 * failure instead of freezing for the session.
 *
 * The bug this guards: a plain `promise ??= factory()` memo caches a rejected
 * promise forever, so one stale-chunk 404 after a deploy strands every
 * registry-gated surface on a skeleton. resettableMemo must (a) share a
 * successful promise across concurrent callers — running the factory once — and
 * (b) clear the slot on rejection so the NEXT call retries and can succeed.
 */

import { describe, it, expect, vi } from 'vitest';
import { resettableMemo } from '../src/memo';

describe('resettableMemo', () => {
  it('runs the factory once and shares the success across concurrent + later callers', async () => {
    const factory = vi.fn(async () => 'ok');
    const ensure = resettableMemo(factory);

    const [a, b] = await Promise.all([ensure(), ensure()]); // concurrent
    const c = await ensure(); // later
    expect([a, b, c]).toEqual(['ok', 'ok', 'ok']);
    expect(factory).toHaveBeenCalledTimes(1); // not re-run on a cached success
  });

  it('does NOT cache a rejection — the next call retries and can succeed', async () => {
    let attempt = 0;
    const factory = vi.fn(async () => {
      attempt++;
      if (attempt === 1) throw new Error('stale chunk 404');
      return 'recovered';
    });
    const ensure = resettableMemo(factory);

    await expect(ensure()).rejects.toThrow('stale chunk 404'); // first fails
    await expect(ensure()).resolves.toBe('recovered'); // retry succeeds
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('shares the SAME rejection among concurrent callers, then clears the slot', async () => {
    let attempt = 0;
    const factory = vi.fn(async () => {
      attempt++;
      if (attempt === 1) throw new Error('boom');
      return 'ok';
    });
    const ensure = resettableMemo(factory);

    // Two concurrent callers on the failing attempt both see the rejection but
    // only run the factory once (the in-flight promise is shared).
    const results = await Promise.allSettled([ensure(), ensure()]);
    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);

    // Slot cleared → a later call retries and resolves.
    await expect(ensure()).resolves.toBe('ok');
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
