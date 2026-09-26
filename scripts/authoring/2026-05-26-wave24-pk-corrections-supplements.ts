/**
 * 2026-05-26-wave24-pk-corrections-supplements.ts — PK half-life corrections +
 * supplement/metabolite citations (wave 24). Closes the non-PDF remainder of
 * the unsourced-PK gap.
 *
 * Two VALUE CORRECTIONS (stored value was wrong; primary source verified):
 *  - alpha-lipoic acid (ala): PO 30 h → 0.5 h. Real plasma t½ is ~0.5 h
 *    (Breithaupt-Grögler 1999, PMID:10072479: "The decline ... was steep
 *    (t1/2, 0.5 h)"). The stored 30 h was ~60× too high.
 *  - tranexamic-acid: PO 11 h → 2 h. Established plasma t½ ~2 h
 *    (Pilbrant 1981, PMID:7308275: "apparent elimination half-life of
 *    approximately two hours"). The stored 11 h was a tertiary-label artifact.
 *
 * Two CITATIONS (value already correct, ref was missing):
 *  - paraxanthine: PMID:3756065 (Lelo 1986 — PX t½ 3.1 h)
 *  - testosterone-undecanoate: PMID:9876028 (Zhang 1998 — IM depot terminal
 *    t½ 18.3–23.7 d; registry 720 h/30 d within 2× of the castor-oil range)
 *
 * HELD (no verifiable primary abstract / value): allopurinol (Breithaupt 1982
 *  is IV-only; oral parent ~1–2 h is standard so 2 h kept, uncited), l-glutamine
 *  (Sadaf 2024 t½ is full-text-only, not abstract-confirmable here), l-citrulline
 *  (only a neonate value exists), insulin-glargine & setmelanotide (label-only),
 *  semax / n-acetyl-semax / n-acetyl-selank (no primary human PK).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound { slug: string; half_life_hr?: Record<string, number>; refs?: string[]; [k: string]: unknown; }

interface Action { slug: string; setHl?: { route: string; from: number; to: number }; ref: string; }

const ACTIONS: Action[] = [
  { slug: 'ala', setHl: { route: 'PO', from: 30, to: 0.5 }, ref: 'PMID:10072479' },
  { slug: 'tranexamic-acid', setHl: { route: 'PO', from: 11, to: 2 }, ref: 'PMID:7308275' },
  { slug: 'paraxanthine', ref: 'PMID:3756065' },
  { slug: 'testosterone-undecanoate', ref: 'PMID:9876028' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let corrected = 0, cited = 0;
  for (const a of ACTIONS) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    if (a.setHl) {
      c.half_life_hr = c.half_life_hr ?? {};
      const cur = c.half_life_hr[a.setHl.route];
      if (cur !== a.setHl.from) console.log(`  [warn] ${a.slug} ${a.setHl.route} expected ${a.setHl.from}, found ${cur}`);
      c.half_life_hr[a.setHl.route] = a.setHl.to;
      console.log(`  [fix ] ${a.slug.padEnd(24)} half_life_hr.${a.setHl.route} ${a.setHl.from} → ${a.setHl.to} h`);
      corrected++;
    }
    c.refs = c.refs ?? [];
    if (!c.refs.includes(a.ref)) { c.refs.push(a.ref); console.log(`  [add ] ${a.slug.padEnd(24)} refs += ${a.ref}`); cited++; }
    else console.log(`  [skip] ${a.slug.padEnd(24)} already has ${a.ref}`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 24: ${corrected} value corrections, +${cited} citations.`);
}

main();
