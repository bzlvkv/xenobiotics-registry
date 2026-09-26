/**
 * 2026-05-24-molecule-name-humanization.ts
 *
 * One-off data fix: ~397 molecule names in derived pathways' step.from /
 * step.to are authored as kebab-case slugs (e.g. "fructose-6-phosphate",
 * "hpa-axis-dysregulation"). They render literally in the pathway diagram
 * nodes and the step list, which looks like raw identifiers. This rewrites
 * them to readable labels per the agreed style:
 *   • lowercase by default, uppercase only real acronyms / proper nouns,
 *   • keep chemical hyphens (digit-adjacent), comma-join locant lists,
 *   • Greek prefixes as unicode (α/β/γ/δ), "-coa" → "-CoA".
 *
 * Node ids are unaffected: `molId()` re-slugifies any label back to the
 * same id (molId("HPA axis dysregulation") === "hpa-axis-dysregulation"),
 * so the node↔step bridge and modulator matching keep working. No molecule
 * name appears in a modulator `target`, so only step.from / step.to change.
 *
 * Two phases, so a human reviews before anything lands:
 *   (default)  emit scripts/out/molecule-labels.tsv  (slug \t label) — edit
 *              this file to correct any label; it is the source of truth.
 *   --apply    read that TSV and rewrite packages/registry/data/pathways.json.
 *
 * Run:  npx tsx scripts/authoring/2026-05-24-molecule-name-humanization.ts
 *       npx tsx scripts/authoring/2026-05-24-molecule-name-humanization.ts --apply
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA = path.resolve('packages/registry/data/pathways.json');
const OUT = path.resolve('scripts/out/molecule-labels.tsv');

const isKebab = (s: string): boolean => /^[a-z0-9]+(-[a-z0-9]+)+$/.test(s.trim());

// Tokens that uppercase whole (unambiguous acronyms seen in the data).
const ACRONYMS = new Set([
  'hpa', 'ampa', 'nmda', 'gaba', 'pi3k', 'akt', 'pka', 'jak', 'stat', 'erk',
  'creb', 'cdk', 'tnf', 'tgf', 'hif', 'nrf2', 'keap1', 'nlrp3', 'hcv', 'hiv',
  'sars', 'cov', 'mac', 'mdp', 'sarm', 'ctla', 'rar', 'rxr', 'gh', 'lh', 'fsh',
  'crh', 'avp', 'pth', 'cgrp', 'msh', 'mc1r', 'mc4r', 'tmn', 'ccd',
  'dct', 'tal', 'nmj', 'coa', 'hmg', 'ldl', 'nad', 'gmp', 'udp', 'il', 'dna',
  'rna', 'igf', 'epo', 'bdnf', 'cns', 'ecm', 'gpcr', 'pdgf', 'vegf', 'egfr',
  'smad2', 'smad3', 'smad4', 'tgfbr1', 'tgfbr2', 'ulk1', 'vhl', 'rb', 'e2f',
  'ikk', 'ach', 'comt', 'cox', 'lox', 'adp', 'epsp', 'tlr', 'trp',
]);

// Tokens with deliberate mixed / non-trivial casing.
const MIXED: Record<string, string> = {
  camp: 'cAMP', cgmp: 'cGMP', mtor: 'mTOR', mtorc1: 'mTORC1', mtorc2: 'mTORC2',
  glcnac: 'GlcNAc', mrna: 'mRNA', nfkb: 'NF-κB', ikb: 'IκB', gsk3: 'GSK-3',
  gnrh: 'GnRH',
};

const GREEK: Record<string, string> = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ' };

const isNum = (t?: string): boolean => !!t && /^\d+$/.test(t);

/** Heuristic fallback — the explicit OVERRIDES below win when present. */
function humanize(slug: string): string {
  const toks = slug.split('-');
  let out = '';
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]!;
    const prev = toks[i - 1];
    const word = MIXED[t] ?? GREEK[t] ?? (t === 'coa' ? 'CoA' : ACRONYMS.has(t) ? t.toUpperCase() : t);
    if (i === 0) { out = word; continue; }
    // Keep a hyphen for chemical locants, Greek prefixes and -CoA; otherwise
    // separate with a space. Two consecutive numbers are a locant list (1,6).
    if (isNum(t) && isNum(prev)) out += ',' + word;
    else if (isNum(t) || isNum(prev) || t === 'coa' || GREEK[t] || GREEK[prev!]) out += '-' + word;
    else out += ' ' + word;
  }
  return out;
}

// Explicit labels for names the heuristic can't get right (ambiguous tokens,
// chemistry, fusions like A/B). Reviewer: edit the emitted TSV, not this map.
const OVERRIDES: Record<string, string> = {
  '2-ag': '2-AG',
  '5-htp': '5-HTP',
  '5ht-receptor-activation': '5-HT receptor activation',
  '7alpha-hydroxycholesterol': '7α-hydroxycholesterol',
  '4-prime-phosphopantothenate': "4'-phosphopantothenate",
  'nad-plus': 'NAD⁺',
  'cyclic-gmp': 'cyclic GMP',
  'reduced-camp': 'reduced cAMP',
  'h-k-atpase-activation': 'H⁺/K⁺-ATPase activation',
  'na-channel-opening': 'Na⁺ channel opening',
  'na-channel-inactivation': 'Na⁺ channel inactivation',
  'k-channel-opening-ca-closing': 'K⁺ channel opening / Ca²⁺ closing',
  'nmda-ca-influx': 'NMDA Ca²⁺ influx',
  'l-type-calcium-influx': 'L-type calcium influx',
  'l-arginine': 'L-arginine', 'l-carnitine': 'L-carnitine', 'l-histidine': 'L-histidine', 'l-tyrosine': 'L-tyrosine',
  'd-ala-d-ala-terminus': 'D-Ala-D-Ala terminus',
  's-adenosylmethionine': 'S-adenosylmethionine', 's-adenosylhomocysteine': 'S-adenosylhomocysteine',
  'n-acetyl-conjugate': 'N-acetyl conjugate', 'n-formylkynurenine': 'N-formylkynurenine', 'n-methylhistamine': 'N-methylhistamine',
  'nicotine-n-oxide': 'nicotine N-oxide', 'trimethylamine-n-oxide': 'trimethylamine N-oxide',
  'trans-3-hydroxycotinine': 'trans-3-hydroxycotinine',
  'pd-1-pd-l1-binding': 'PD-1/PD-L1 binding',
  'ctla-4-b7-binding': 'CTLA-4/B7 binding',
  'gpiib-iiia-binding': 'GPIIb/IIIa binding',
  'factor-viia': 'factor VIIa', 'factor-xa': 'factor Xa', 'factor-xii': 'factor XII',
  'c3-convertase': 'C3 convertase', 'c5-convertase': 'C5 convertase', 'c3a-c3b': 'C3a / C3b', 'mac-c5b-9': 'MAC C5b-9',
  'protoporphyrin-ix': 'protoporphyrin IX', 'coproporphyrinogen-iii': 'coproporphyrinogen III',
  'angiotensin-i': 'angiotensin I', 'angiotensin-ii': 'angiotensin II',
  'phase-0-depolarization': 'phase 0 depolarization', 'phase-1-early-repolarization': 'phase 1 early repolarization',
  'phase-2-plateau': 'phase 2 plateau', 'phase-3-repolarization': 'phase 3 repolarization', 'phase-4-resting': 'phase 4 resting',
  'cyclin-d-cdk4-6': 'cyclin D–CDK4/6',
  'rar-rxr-binding': 'RAR/RXR binding', 'rar-rxr-heterodimer-activation': 'RAR/RXR heterodimer activation',
  'smad2-3-4-complex-nuclear': 'nuclear SMAD2/3/4 complex', 'smad2-smad3-phosphorylation': 'SMAD2/SMAD3 phosphorylation',
  'stat-dimer-nuclear': 'nuclear STAT dimer', 'stat-phosphorylation': 'STAT phosphorylation',
  'rb-phosphorylation': 'Rb phosphorylation', 'e2f-release': 'E2F release',
  'sars-cov-2-polyprotein': 'SARS-CoV-2 polyprotein', 'sars-cov-2-functional-proteins': 'SARS-CoV-2 functional proteins',
  'hcv-rna': 'HCV RNA', 'hcv-rna-replication': 'HCV RNA replication', 'hcv-polyprotein': 'HCV polyprotein', 'hcv-nonstructural-proteins': 'HCV nonstructural proteins',
  'hiv-rna': 'HIV RNA', 'hiv-dna': 'HIV DNA', 'hiv-polyprotein': 'HIV polyprotein',
  'gaba-a-receptor-activation': 'GABA-A receptor activation', 'gaba-b-receptor-activation': 'GABA-B receptor activation',
  'tnf-alpha': 'TNF-α', 'tgf-beta-ligand': 'TGF-β ligand',
  'hif-alpha-hydroxylated': 'hydroxylated HIF-α', 'hif-alpha-protein': 'HIF-α protein', 'hif-alpha-stabilized': 'stabilized HIF-α',
  'alpha-msh': 'α-MSH',
  'gamma-glutamylcysteine': 'γ-glutamylcysteine',
  'cgmp-elevation': 'cGMP elevation', 'cgmp-rise': 'cGMP rise',
  'il-1beta-secretion': 'IL-1β secretion',
  'nlrp3-pro-il1b-upregulated': 'NLRP3 / pro-IL-1β upregulated',
  'udp-glcnac': 'UDP-GlcNAc', 'udp-glucose': 'UDP-glucose',
  'hmg-coa': 'HMG-CoA',
  'coenzyme-q10': 'coenzyme Q10',
  'pyridoxal-5-phosphate': "pyridoxal 5'-phosphate",
  'phosphatidylinositol-4-5-bisphosphate': 'phosphatidylinositol 4,5-bisphosphate',
  'h1-mediated-allergic-symptoms': 'H1-mediated allergic symptoms',
  'detrusor-b3-activation': 'detrusor β3 activation', 'detrusor-m3-activation': 'detrusor M3 activation',
  'urethral-a1a-activation': 'urethral α1A activation',
  'gs-coupled-receptor-activation': 'Gs-coupled receptor activation', 'gi-go-activation': 'Gi/Go activation',
  'gi-meal-signals': 'GI meal signals', 'gi-motility-or-secretion': 'GI motility / secretion', 'gi-peptide-release': 'GI peptide release',
  '25-hydroxycholecalciferol': '25-hydroxycholecalciferol',
  '5-10-methylene-tetrahydrofolate': '5,10-methylene-tetrahydrofolate',
  'epo-vegf-glycolytic-transcription': 'EPO / VEGF / glycolytic transcription',
  'tgfbr1-tgfbr2-activation': 'TGFBR1/TGFBR2 activation',
  'gr-activation-translocation': 'GR activation / translocation',
  'ikb-degradation': 'IκB degradation', 'ikk-activation': 'IKK activation', 'nfkb-nuclear': 'nuclear NF-κB',
  'polyubiquitinated-k48': 'K48-polyubiquitinated',
  'pi3k-activation': 'PI3K activation', 'akt-activation': 'AKT activation', 'jak-activation': 'JAK activation',
  'pka-activation': 'PKA activation', 'mtorc1-activation': 'mTORC1 activation', 'ulk1-activation': 'ULK1 activation',
  'creb-phosphorylation': 'CREB phosphorylation', 'keap1-cysteine-modification': 'KEAP1 cysteine modification',
  'nrf2-stabilization': 'NRF2 stabilization', 'vhl-degradation': 'VHL degradation',
  'thrombin-par1': 'thrombin–PAR1', 'presynaptic-cb1': 'presynaptic CB1',
  'mc1r-melanogenesis': 'MC1R melanogenesis', 'mc4r-appetite-suppression': 'MC4R appetite suppression',
  'beta-alanine': 'β-alanine', 'beta-carotene': 'β-carotene', 'beta-hydroxybutyrate': 'β-hydroxybutyrate',
  'alpha-aminoadipate': 'α-aminoadipate', 'alpha-ketoglutarate': 'α-ketoglutarate',
  'alpha-keto-3-methylvalerate': 'α-keto-3-methylvalerate', 'alpha-ketoisocaproate': 'α-ketoisocaproate',
  'alpha-ketoisovalerate': 'α-ketoisovalerate', 'alpha-linolenic-acid': 'α-linolenic acid', 'alpha-tocopherol': 'α-tocopherol',
  'alpha-beta-receptor-activation': 'α/β receptor activation',
  'igf-1': 'IGF-1', 'hepatic-igf-1': 'hepatic IGF-1', 'endothelin-1': 'endothelin-1', 'resolvin-d1': 'resolvin D1', 'resolvin-e1': 'resolvin E1',
  'leukotriene-a4': 'leukotriene A4', 'leukotriene-b4': 'leukotriene B4',
  'prostaglandin-e2': 'prostaglandin E2', 'prostaglandin-h2': 'prostaglandin H2', 'thromboxane-a2': 'thromboxane A2', 'txa2-release': 'TXA2 release',
  // heuristic-miss corrections
  'bax-bak-activation': 'BAX/BAK activation',
  'caspase-1-activation': 'caspase-1 activation',
  'fungal-beta-glucan': 'fungal β-glucan',
  'glyceraldehyde-dhap': 'glyceraldehyde / DHAP',
  'glycine-acetylcoa': 'glycine + acetyl-CoA',
  'gastric-hcl-secretion': 'gastric HCl secretion',
  'inactive-24-hydroxy': 'inactive 24-hydroxy',
  'lh-fsh-release': 'LH/FSH release',
  'pt-reabsorption': 'PT reabsorption',
  's-phase-entry': 'S-phase entry',
  't-cell-exhaustion': 'T-cell exhaustion',
  't-cell-priming-suppression': 'T-cell priming suppression',
  'tissue-selective-ar-activation': 'tissue-selective AR activation',
  'vitamin-k-epoxide': 'vitamin K epoxide',
  'vitamin-k-hydroquinone': 'vitamin K hydroquinone',
  'viral-rna-dna-chain-termination': 'viral RNA/DNA chain termination',
  '5-methyl-tetrahydrofolate': '5-methyltetrahydrofolate',
};

function label(slug: string): string {
  return OVERRIDES[slug] ?? humanize(slug);
}

function collectKebab(pathways: any[]): string[] {
  const set = new Set<string>();
  for (const p of pathways) {
    if (p.diagram) continue;
    for (const s of p.steps ?? []) for (const m of [s.from, s.to]) if (m && isKebab(m)) set.add(m.trim());
  }
  return [...set].sort();
}

function main() {
  const apply = process.argv.includes('--apply');
  const pathways = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const list: any[] = Array.isArray(pathways) ? pathways : (pathways.pathways ?? []);

  if (!apply) {
    const names = collectKebab(list);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, names.map(n => `${n}\t${label(n)}`).join('\n') + '\n');
    const ov = names.filter(n => OVERRIDES[n] != null).length;
    console.log(`Wrote ${names.length} proposed labels → ${path.relative(process.cwd(), OUT)}`);
    console.log(`  ${ov} from explicit overrides, ${names.length - ov} from the heuristic.`);
    console.log('Review / edit that TSV, then re-run with --apply.');
    return;
  }

  // Apply from the (possibly hand-edited) TSV — it is the source of truth.
  const map = new Map<string, string>();
  for (const line of fs.readFileSync(OUT, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const [slug, ...rest] = line.split('\t');
    const lbl = rest.join('\t').trim();
    if (slug && lbl) map.set(slug.trim(), lbl);
  }
  let changed = 0;
  for (const p of list) {
    if (p.diagram) continue;
    for (const s of p.steps ?? []) {
      for (const k of ['from', 'to'] as const) {
        const v = s[k]?.trim();
        if (v && map.has(v)) { s[k] = map.get(v)!; changed++; }
      }
    }
  }
  fs.writeFileSync(DATA, JSON.stringify(pathways, null, 2) + '\n');
  console.log(`Applied ${map.size} label rewrites · ${changed} step endpoints updated in pathways.json`);
}

main();
