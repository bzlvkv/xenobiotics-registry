/**
 * 2026-06-02-sugars-pk-wave.ts
 *
 * PK depth for the sugars/sweeteners expansion — authors literature PK for the
 * three entries with a RESOLVABLE primary-human-PK PMID whose ABSTRACT states
 * the values (every number below was re-fetched from PubMed via efetch and the
 * abstract text confirmed before authoring):
 *
 *   mannitol  IV  — Cloyd 1986, PMID:3080582 (J Pharmacol Exp Ther; n=4 humans):
 *                   elim t½ 71.15 min → 1.186 h; Vd 0.47 L/kg → 32.9 L (70 kg);
 *                   F=1 (IV). 1-comp approximation of the reported 2-comp fit
 *                   (distribution t½ ~2 min, negligible at this timescale).
 *   saccharin PO  — Sweatman 1981, PMID:7303723 (Xenobiotica): oral fraction
 *                   absorbed ~0.85; terminal t½ 70 min → 1.17 h (from the IV
 *                   phase). ka/Vd NOT abstract-stated (oral curves "complex and
 *                   variable") → left to solver defaults.
 *   sucralose PO  — Roberts 2000, PMID:10882816 (Food Chem Toxicol; n=8): ~14.5%
 *                   of an oral dose absorbed (F≈0.145), effective plasma
 *                   t½ 13 h. ka not abstract-derivable cleanly → default.
 *
 * Deliberately NOT authored (documented in AUTHORING_GAPS.md): acesulfame-K
 * (canonical t½ only in an unpublished JECFA report, no PMID), erythritol
 * (Bordier 2022 PMID:36077269 — values full-text-Table-1 only + saturable
 * absorption breaks the 1-comp model), allulose (Iida 2010 PMID:19765780 —
 * only urinary-recovery %, no t½/Vd).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  routes?: string[];
  pk?: Record<string, Record<string, unknown>>;
  half_life_hr?: Record<string, number>;
  refs?: string[];
  notes?: string;
  pk_unauthored?: unknown;
  [k: string]: unknown;
}

interface Patch {
  half_life_hr: Record<string, number>;
  pk: Record<string, Record<string, unknown>>;
  refs: string[];
  notesAppend: string;
}

const PATCHES: Record<string, Patch> = {
  mannitol: {
    half_life_hr: { IV: 1.186 },
    pk: { IV: { F: 1, V_L: 32.9, source_pmid: 'PMID:3080582' } },
    refs: ['PMID:3080582'],
    notesAppend:
      ' IV PK (Cloyd 1986, n=4 humans): apparent Vd ~0.47 L/kg (≈32.9 L/70 kg, high inter-subject variance) and terminal t½ ~71 min (1.19 h) — a 1-compartment approximation of the reported 2-compartment fit (the ~2 min distribution phase is negligible here).',
  },
  saccharin: {
    half_life_hr: { PO: 1.17 },
    pk: { PO: { F: 0.85, source_pmid: 'PMID:7303723' } },
    refs: ['PMID:7303723'],
    notesAppend:
      ' PK (Sweatman 1981): oral fraction absorbed ~0.85; elimination t½ ~70 min (1.17 h, from the IV phase). Oral plasma curves are complex/variable, so ka and Vd are left to solver defaults.',
  },
  sucralose: {
    half_life_hr: { PO: 13 },
    pk: { PO: { F: 0.145, source_pmid: 'PMID:10882816' } },
    refs: ['PMID:10882816'],
    notesAppend:
      ' PK (Roberts 2000, n=8): only ~14.5% of an oral dose is absorbed (F≈0.145, recovered unchanged in urine) with an effective plasma t½ ~13 h (Tmax ~2 h); the remainder is excreted unchanged in faeces.',
  },
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map((c) => [c.slug, c]));
  let patched = 0;

  for (const [slug, p] of Object.entries(PATCHES)) {
    const c = bySlug.get(slug);
    if (!c) { console.log(`MISSING: ${slug} — skipped`); continue; }
    if (c.pk && Object.keys(c.pk).length) { console.log(`already has pk: ${slug} — skipped`); continue; }

    // pk routes must already be declared in routes[]
    for (const r of Object.keys(p.pk)) {
      if (!c.routes?.includes(r)) { console.log(`WARN ${slug}: route ${r} not in routes[] — skipped`); continue; }
    }

    c.half_life_hr = { ...(c.half_life_hr ?? {}), ...p.half_life_hr };
    c.pk = { ...(c.pk ?? {}), ...p.pk };
    const refs = new Set([...(c.refs ?? []), ...p.refs]);
    c.refs = [...refs];
    // Authoring real PK supersedes the "deliberately unauthored" flag.
    delete c.pk_unauthored;
    if (c.notes && !c.notes.includes(p.notesAppend.trim().slice(0, 24))) c.notes = c.notes + p.notesAppend;
    else if (!c.notes) c.notes = p.notesAppend.trim();
    patched++;
    console.log(`patched ${slug}: pk[${Object.keys(p.pk).join(',')}] + half_life + refs, removed pk_unauthored`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nPatched ${patched} compounds with verified PK.`);
}

main();
