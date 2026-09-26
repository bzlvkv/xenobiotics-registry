/**
 * build-compound-chunks.mjs — split the canonical compounds.json into the
 * client CORE and a PROVENANCE sidecar, so the audit trail stops crowding the
 * check-bundle budgets.
 *
 * WHY THIS EXISTS. The 2026-09 PK audit wrote provenance into the data — why a
 * value changed, which arm of which study it came from, what was rejected —
 * and that grew `notes` from 28 KB to 611 KB. compounds.json went 1,742 →
 * 2,516 KB raw, and its lazy chunk went to ~705 KB gzipped against a 470 KB
 * largestChunk ceiling and a 2,500 KB totalJs ceiling. The build failed.
 *
 * bundle-budget.json had already pre-registered the answer for exactly this:
 * "NEXT lever if compounds.json grows: split it too" — and twice before, the
 * fix was a split rather than a bump. So:
 *
 *   core.json        every record MINUS the provenance prose. This is what the
 *                    app boots on and what every surface except the compound
 *                    page's disclosure reads.
 *   provenance.json  slug -> the audit trail, loaded ONLY when a reader expands
 *                    "Show provenance & audit trail" on one compound page.
 *
 * Splitting alone would not have been enough. bundle-budget.json also warns
 * that "splitting does not shrink the sum", and totalJs was the other failure —
 * so three fields that NO SURFACE RENDERS are dropped from the client entirely
 * rather than moved: `fu_note`, `effect_compartment.note` and
 * `dose_moiety_note`. They stay in compounds.json for data-lint and for anyone
 * reading the repo; they simply stop being shipped. Verified against the app
 * source before dropping — `fu_note` and `dose_moiety_note` appear in no
 * component, and effect_compartment's note is read only by the linter.
 *
 * INTERACTION and RECEPTOR_OCCUPANCY notes are KEPT in core: those ARE rendered
 * (InteractionsPanel, StackEditor, ExpandedPathwayDiagram, the observe page).
 *
 * compounds.json stays the single source of truth for all authoring / lint /
 * verify tooling; these files are a GENERATED, gitignored build artifact
 * regenerated on every build/dev by the vite plugin in apps/app/vite.config.ts,
 * so they cannot drift.
 *
 * Run standalone: node scripts/build-compound-chunks.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'packages', 'registry', 'data', 'compounds.json');
const OUT = join(__dirname, '..', 'packages', 'registry', 'data', 'compounds');

/**
 * Headings the authoring scripts use to open an audit paragraph. MUST stay in
 * sync with apps/app/src/lib/registry-notes.ts, which re-splits the sidecar
 * text into labelled blocks for display; that module's tests assert the split
 * loses no text, so a drift here shows up there.
 */
const AUDIT_HEADINGS = [
  'EFFECT COMPARTMENT',
  'DOSE MOIETY',
  'PK ANALYTE',
  'INTERACTIONS',
  'OCCUPANCY',
  'PROVENANCE',
  'ROUTE',
  'MASS',
  'DOSE',
  'PK',
];
const SPLIT_AT = new RegExp(`(?:^|\\s)(?=(?:${AUDIT_HEADINGS.join('|')})\\s*:)`);

export function buildCompoundChunks() {
  /** @type {Record<string, unknown>[]} */
  const compounds = JSON.parse(readFileSync(SRC, 'utf-8'));
  /** @type {Record<string, string>} */
  const provenance = {};
  const core = compounds.map((/** @type {any} */ c) => {
    const o = { ...c };
    // Provenance that no surface renders — dropped, not relocated.
    delete o.fu_note;
    delete o.dose_moiety_note;
    if (o.effect_compartment?.note != null) {
      o.effect_compartment = { ...o.effect_compartment };
      delete o.effect_compartment.note;
    }
    // The audit trail moves to the sidecar; the intro prose stays inline.
    if (typeof o.notes === 'string') {
      const m = SPLIT_AT.exec(o.notes);
      if (m) {
        const intro = o.notes.slice(0, m.index).trim();
        provenance[o.slug] = o.notes.slice(m.index).trim();
        if (intro) o.notes = intro;
        else delete o.notes;
      }
    }
    return o;
  });

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'core.json'), JSON.stringify(core));
  writeFileSync(join(OUT, 'provenance.json'), JSON.stringify(provenance));
  // A slug list, so a compound page knows whether to render the disclosure
  // WITHOUT pulling the 560 KB text. Tiny, and it cannot be a field on the
  // record itself: the registry's zod loader strips unknown keys, so a marker
  // added to core.json would silently vanish before any surface saw it.
  writeFileSync(join(OUT, 'provenance-index.json'), JSON.stringify(Object.keys(provenance).sort()));
  return {
    records: core.length,
    withProvenance: Object.keys(provenance).length,
    coreKB: Math.round(JSON.stringify(core).length / 1024),
    provenanceKB: Math.round(JSON.stringify(provenance).length / 1024),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = buildCompoundChunks();
  console.log(
    `[build-compound-chunks] ${r.records} records -> core ${r.coreKB} KB, provenance ${r.provenanceKB} KB across ${r.withProvenance} records`,
  );
}
