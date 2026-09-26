/**
 * router.ts — hash routing, ~50 lines. Every view is a URL, back/forward work,
 * and a reload lands on the same record with the same filters applied.
 */
export interface Loc {
  /** Path segments, decoded: `#/compounds/vitamin-c` -> ['compounds','vitamin-c'] */
  path: string[];
  query: URLSearchParams;
}

export function parse(hash: string): Loc {
  const raw = hash.replace(/^#\/?/, '');
  const qi = raw.indexOf('?');
  const pathPart = qi === -1 ? raw : raw.slice(0, qi);
  const query = new URLSearchParams(qi === -1 ? '' : raw.slice(qi + 1));
  const path = pathPart
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  return { path, query };
}

export function href(path: string, query?: Record<string, string>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v) qs.set(k, v);
  const q = qs.toString();
  return `#/${path}${q ? `?${q}` : ''}`;
}

export function current(): Loc {
  return parse(location.hash);
}

/**
 * Filter changes rewrite the URL without a history entry and without a
 * re-render, so typing in a search box keeps focus and does not bury the back
 * button under one entry per keystroke. Deep-linking still works: the view reads
 * its state out of the query on every real navigation.
 */
export function replaceQuery(path: string, query: Record<string, string>): void {
  history.replaceState(null, '', href(path, query));
}

export function start(render: (loc: Loc) => void): void {
  const go = (): void => {
    render(current());
  };
  addEventListener('hashchange', go);
  if (!location.hash) history.replaceState(null, '', '#/');
  go();
}
