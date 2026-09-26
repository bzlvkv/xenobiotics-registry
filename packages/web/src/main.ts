/**
 * main.ts — boot, fetch, route. The client is a reader: no writes, no auth,
 * no backend, no state beyond the URL.
 */
import type { Compound, Pathway, ReceptorCatalog, Registry } from '@xeno/registry';

/**
 * The shape on disk: the five fields the schema fills in with `.default(…)` are
 * optional in the JSON and non-optional in the types, so the raw file is not a
 * `Compound` until those defaults are applied (see boot()).
 */
type PreDefault<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RawCompound = PreDefault<Compound, 'aliases' | 'refs' | 'half_life_hr'>;
type RawPathway = PreDefault<Pathway, 'refs'>;
type RawCatalog = PreDefault<ReceptorCatalog, 'nonGpcrTargets'>;
import { build, type Ctx } from './ctx';
import * as router from './router';
import type { Loc } from './router';
import { el, frag, setPathwayNames } from './ui';
import { compoundView } from './views/compound';
import { compoundsView } from './views/compounds';
import { healthView } from './views/health';
import { homeView } from './views/home';
import { pathwayView } from './views/pathway';
import { pathwaysView } from './views/pathways';
import { targetView } from './views/target';
import { targetsView } from './views/targets';
import './styles.css';

const NAV: [string, string][] = [
  ['', 'Home'],
  ['compounds', 'Compounds'],
  ['pathways', 'Pathways'],
  ['targets', 'Targets'],
  ['health', 'Health'],
];

function chrome(active: string): HTMLElement {
  return el(
    'header',
    { class: 'top' },
    el(
      'div',
      { class: 'top-in' },
      el('a', { class: 'brand', href: '#/' }, 'Xenobiotics Registry'),
      el(
        'nav',
        { class: 'top-nav' },
        NAV.map(([path, label]) =>
          el('a', { href: `#/${path}`, 'aria-current': path === active ? 'page' : null }, label),
        ),
      ),
    ),
  );
}

function notFound(loc: Loc): Node {
  return frag(
    el('h1', null, 'No such page'),
    el('p', { class: 'lede' }, `Nothing is routed at #/${loc.path.join('/')}.`),
    el('p', null, el('a', { href: '#/' }, 'Back to the registry')),
  );
}

function view(ctx: Ctx, loc: Loc): Node {
  const [head, rest] = [loc.path[0] ?? '', loc.path[1]];
  switch (head) {
    case '':
      return homeView(ctx);
    case 'compounds':
      return rest ? compoundView(ctx, rest) : compoundsView(ctx, loc);
    case 'pathways':
      return rest ? pathwayView(ctx, rest) : pathwaysView(ctx, loc);
    case 'targets':
      return rest ? targetView(ctx, rest) : targetsView(ctx, loc);
    case 'health':
      return healthView(ctx, loc);
    default:
      return notFound(loc);
  }
}

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function boot(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;
  const base = import.meta.env.BASE_URL;
  try {
    /*
     * The datasets are served as static files out of the repo's data/ dir (see
     * vite.config.ts) and cast to the package's types rather than re-validated
     * here: running zod on 3.8 MB in the browser would buy nothing, because
     * `pnpm validate` is the gate that proves these three files parse against
     * the schema. If they did not, they would not be committed.
     */
    const [rawCompounds, rawPathways, rawReceptors] = await Promise.all([
      json<RawCompound[]>(`${base}compounds.json`),
      json<RawPathway[]>(`${base}pathways.json`),
      json<RawCatalog>(`${base}receptors.json`),
    ]);
    /*
     * The one thing the cast owes the loaders: zod's five declared defaults.
     * `aliases`, `refs`, `half_life_hr` and `nonGpcrTargets` are `.default(…)`
     * in the schema and NON-optional in the types, so a loaded registry always
     * has them — and `coverage()` and the linter read them without a guard,
     * correctly. Skipping zod skips the defaults, so 113 compounds that simply
     * omit `half_life_hr` in the JSON arrive violating their own type. Applying
     * the defaults here is the price of not shipping the validator; the fields
     * are listed explicitly so a sixth default added upstream shows up as a
     * mismatch rather than as a crash in a view nobody opened yet.
     */
    const byName = (a: { name: string }, b: { name: string }): number =>
      a.name.localeCompare(b.name);
    const registry: Registry = {
      compounds: rawCompounds
        .map((c) => ({ aliases: [], refs: [], half_life_hr: {}, ...c }))
        .sort(byName),
      pathways: rawPathways.map((p) => ({ refs: [], ...p })).sort(byName),
      receptors: { nonGpcrTargets: [], ...rawReceptors },
    };
    const ctx = build(registry);
    setPathwayNames((slug) => ctx.byPathway.get(slug)?.name);
    router.start((loc) => {
      const body = el('main', null, view(ctx, loc));
      app.replaceChildren(chrome(loc.path[0] ?? ''), body);
      scrollTo({ top: 0 });
    });
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    app.replaceChildren(
      el(
        'p',
        { class: 'err' },
        'The registry did not load. ',
        el('code', null, msg),
        el('br'),
        el(
          'span',
          { class: 'muted' },
          'Expected compounds.json, pathways.json and receptors.json at ' + base,
        ),
      ),
    );
  }
}

void boot();
