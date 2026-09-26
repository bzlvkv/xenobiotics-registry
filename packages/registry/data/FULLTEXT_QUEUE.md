# Full-text follow-up queue — gaps whose citations are all behind a paywall

Generated 2026-09-08 by the full-text gap sweep.


## Why this file exists

`olanzapine`'s depot peak time was sitting in the **full text of the paper the record already
cited** — invisible to three prior passes because those passes read abstracts. So every record
with a missing `V_L`, `F`, `ka` or `fraction_unbound` was mapped to the citations it already
carries, and each citation checked for open-access full text.

**234 gap rows cite 503 distinct PMIDs. 122 of those (24%) are in PMC** and were fetched and
searched; three yielded a usable value. The rows below are the remainder: **every citation they
carry is closed access**, so nothing further can be extracted without a subscription.

**This is a reading list, not a defect list.** A row here is not known to be wrong — it is known
to be unresolvable from open sources. Anyone with institutional access can work it directly:
the PMIDs are listed, and the parameter to look for is named.

## How to work it

For each row, open the listed PMIDs and search the full text for the named parameter. Then:

- **A verbatim value** → author it, with the quote, following the existing authoring-script
  pattern in `scripts/authoring/`.
- **A value that does not cohere** with what the record already stores — the usual trap is a
  steady-state or central volume paired with a terminal half-life — → store the value the
  record's own stored clearance implies, and say so. `teriparatide` in this sweep is the worked
  example: its verbatim `V/F` of 7.8 L beside a verbatim `CL/F` of 62 L/h implies a **five-minute**
  half-life against the hour the record stores.
- **Nothing there** → record that, so the next pass does not re-chase it.


## Scope

- **126 gap rows** across **110 compounds**
- Missing: **V_L** ×96, **F** ×42, **fu** ×18, **ka** ×11
- **227 distinct closed-access PMIDs** to chase


## Rows

| compound | route | missing | citations to check |
|---|---|---|---|
| `agomelatine` | PO | V_L | PMID:28392509 |
| `alprazolam` | SL | V_L, F | PMID:1684924, PMID:2567646, PMID:26143953, PMID:3680603, PMID:6152055, PMID:8491063 |
| `amitriptyline` | PO | F | PMID:6825390, PMID:711927 |
| `aniracetam` | PO | V_L | PMID:19025058, PMID:22552003 |
| `ascorbic-acid` | IV | V_L | PMID:15068981 |
| `ascorbic-acid` | PO | V_L | PMID:15068981 |
| `baicalein` | PO | V_L | PMID:25219601 |
| `bempedoic-acid` | PO | V_L, F | PMID:36876740, PMID:37477389 |
| `biotin` | PO | V_L | PMID:10075337 |
| `boldenone` | IM | V_L, F, ka | PMID:17348894 |
| `boron` | PO | V_L, F | PMID:10050928, PMID:25063690, PMID:6537937, PMID:6595986, PMID:6732506, PMID:9062533 |
| `buprenorphine` | IV | V_L | PMID:15966752, PMID:26865472, PMID:9048270, PMID:9684393 |
| `buprenorphine` | SL | V_L | PMID:15966752, PMID:26865472, PMID:9048270, PMID:9684393 |
| `buprenorphine` | TD | V_L | PMID:15966752, PMID:26865472, PMID:9048270, PMID:9684393 |
| `butalbital` | PO | F | PMID:29124988 |
| `catechin` | PO | V_L | PMID:12798412 |
| `cbn` | - | fu | PMID:2960395, PMID:8819477 |
| `certolizumab-pegol` | SC | ka | PMID:25586216 |
| `cetrorelix` | SC | V_L | PMID:10709155, PMID:11180022, PMID:9806255 |
| `chlorthalidone` | PO | V_L | PMID:421727, PMID:649750, PMID:971715 |
| `chondroitin` | PO | V_L | PMID:12359162 |
| `citalopram` | - | fu | PMID:10674711, PMID:9681666 |
| `cjc-1295` | SC | V_L, F, ka | PMID:16352683 |
| `clenbuterol` | PO | V_L, F | PMID:4045696 |
| `clonidine` | - | fu | PMID:17767627, PMID:2565958, PMID:3293868, PMID:7128667, PMID:870272 |
| `cocaine` | INH | F | PMID:2565204, PMID:7357795 |
| `cocaine` | PO | F | PMID:2565204, PMID:7357795 |
| `d-ribose` | PO | V_L, F | PMID:24272966 |
| `daidzein` | PO | V_L | PMID:12672914 |
| `dantrolene` | PO | F | PMID:16301243, PMID:2929999, PMID:3057938, PMID:499321 |
| `dmt` | INH | V_L, F | PMID:8297216 |
| `doravirine` | PO | V_L | PMID:25470746, PMID:29723418, PMID:31388941 |
| `dpa` | PO | V_L, F, ka | PMID:27151222 |
| `dulaglutide` | SC | V_L, F | PMID:26507721, PMID:34787823 |
| `entecavir` | PO | V_L, F | PMID:17050790, PMID:21125816 |
| `epicatechin` | PO | V_L | PMID:22664313 |
| `esomeprazole` | IV | V_L | PMID:11214773, PMID:11286324 |
| `esomeprazole` | PO | V_L | PMID:11214773, PMID:11286324 |
| `exenatide` | - | fu | PMID:16484515, PMID:18793576, PMID:28085521, PMID:7851494 |
| `ezetimibe` | PO | V_L, F | PMID:11901097, PMID:15871634, PMID:23109219 |
| `fexofenadine` | - | fu | PMID:19660947, PMID:23422332 |
| `fludrocortisone` | - | fu | PMID:8282004 |
| `fluphenazine` | - | fu | PMID:12629531, PMID:17826096, PMID:2286711, PMID:6787637, PMID:8911886 |
| `gabapentin` | PO | V_L | PMID:20818832, PMID:8022536 |
| `ganirelix` | SC | V_L | PMID:10593371, PMID:1385467 |
| `genistein` | PO | V_L | PMID:12672914 |
| `gentamicin` | IM | V_L | PMID:3396458, PMID:712111, PMID:8361865 |
| `ghrp-2` | - | fu | PMID:9092793, PMID:9543135, PMID:9879640 |
| `ghrp-2` | SC | V_L, F | PMID:9092793, PMID:9543135, PMID:9879640 |
| `ghrp-6` | SC | V_L, F | PMID:23099431, PMID:9879640 |
| `gla` | PO | V_L | PMID:9707349 |
| `glucagon` | IV | V_L | PMID:773949 |
| `glycine` | - | fu | PMID:12450897, PMID:8212419 |
| `gonadorelin` | IV | V_L | PMID:320223 |
| `heroin` | IV | V_L | PMID:6709027 |
| `hexarelin` | SC | V_L | PMID:10611139, PMID:8126144 |
| `ibogaine` | PO | V_L, F | PMID:25279818, PMID:25651476 |
| `indomethacin` | PO | V_L, F | PMID:1100305, PMID:22913908, PMID:4090993 |
| `indomethacin` | PR | V_L | PMID:1100305, PMID:22913908, PMID:4090993 |
| `ipamorelin` | SC | V_L, F | PMID:10496658, PMID:9849822 |
| `ivabradine` | PO | V_L | PMID:16988208, PMID:26265098, PMID:26910057, PMID:9728900 |
| `lacosamide` | IV | V_L | PMID:22722651, PMID:23148731, PMID:25957198 |
| `lacosamide` | PO | V_L | PMID:22722651, PMID:23148731, PMID:25957198 |
| `lanreotide` | SC | ka | PMID:10579475, PMID:15099442, PMID:26416534 |
| `ledipasvir` | PO | V_L | PMID:24320933, PMID:27193156 |
| `lisinopril` | PO | V_L | PMID:2547465, PMID:2844083, PMID:3014110 |
| `lorazepam` | PO | V_L | PMID:1684924, PMID:6121043, PMID:6131586 |
| `lorazepam` | SL | V_L | PMID:1684924, PMID:6121043, PMID:6131586 |
| `lutein` | PO | V_L | PMID:7661123 |
| `methamphetamine` | PO | V_L, F | PMID:1362938 |
| `methocarbamol` | PO | V_L, F | PMID:19537524, PMID:2253675 |
| `methylene-blue` | IV | V_L | PMID:10952480 |
| `methylene-blue` | PO | V_L | PMID:10952480 |
| `methylfolate` | PO | V_L | PMID:22909145, PMID:24494987 |
| `mycophenolate` | IV | V_L | PMID:8728345 |
| `mycophenolate` | PO | V_L | PMID:8728345 |
| `nalbuphine` | - | fu | PMID:18467078, PMID:3429694, PMID:3691617 |
| `nandrolone` | IM | V_L, F, ka | PMID:15713722 |
| `naproxen` | - | fu | PMID:18397691, PMID:2724076, PMID:7439246, PMID:9113437 |
| `octreotide` | IM | V_L, F, ka | PMID:10806600, PMID:2876508, PMID:8287633 |
| `octreotide` | IV | V_L | PMID:10806600, PMID:2876508, PMID:8287633 |
| `octreotide` | SC | V_L, F | PMID:10806600, PMID:2876508, PMID:8287633 |
| `orphenadrine` | PO | V_L, F | PMID:7056281 |
| `oxcarbazepine` | PO | V_L | PMID:17516704, PMID:28528287 |
| `pantothenic-acid` | PO | V_L | PMID:9023484 |
| `pentazocine` | IM | F | PMID:3709032, PMID:923183 |
| `phenobarbital` | IM | V_L, F, ka | PMID:624773, PMID:659737, PMID:7068937 |
| `phenobarbital` | PO | ka | PMID:624773, PMID:659737, PMID:7068937 |
| `pramlintide` | SC | V_L, F | PMID:16278328 |
| `prednisolone` | - | fu | PMID:2285202, PMID:7915437 |
| `pregabalin` | PO | V_L | PMID:20147618, PMID:23205518 |
| `procyanidin-b2` | PO | V_L | PMID:12324293, PMID:17439235 |
| `psilocin` | - | fu | PMID:36049313, PMID:36507738 |
| `psilocin` | PO | V_L, F | PMID:36049313, PMID:36507738 |
| `pyrazinamide` | PO | V_L, F | PMID:12066959, PMID:16685561, PMID:2737233 |
| `rad-140` | PO | V_L, F | PMID:34565686 |
| `ramipril` | PO | V_L | PMID:14755115, PMID:2533075, PMID:7768254 |
| `ranolazine` | PO | V_L | PMID:16640453, PMID:23355361 |
| `rauwolscine` | - | fu | PMID:26391406, PMID:6142941, PMID:7996470, PMID:9459568 |
| `repaglinide` | PO | V_L | PMID:10199798, PMID:10501822, PMID:15961978, PMID:9877000 |
| `retatrutide` | SC | V_L, F | PMID:35985340, PMID:36354040, PMID:37366315 |
| `riluzole` | PO | V_L | PMID:9390108, PMID:9549636 |
| `saccharin` | PO | V_L | PMID:7303723 |
| `salicylic-acid-topical` | TD | V_L | PMID:10026401 |
| `salidroside` | PO | V_L | PMID:24043591, PMID:32603893 |
| `scopolamine` | - | fu | PMID:1346637 |
| `sermorelin` | SC | V_L, F | PMID:7962295 |
| `simvastatin` | PO | V_L | PMID:14691614, PMID:8343198 |
| `solifenacin` | PO | ka | PMID:12122494, PMID:15293866, PMID:15906588, PMID:17251687 |
| `spironolactone` | PO | V_L, F | PMID:1261153, PMID:26073023, PMID:2723123 |
| `sucralose` | PO | V_L | PMID:10882816 |
| `suvorexant` | - | fu | PMID:20565075, PMID:29705869 |
| `tasimelteon` | - | fu | PMID:19054552, PMID:25658956 |
| `tazarotene` | TD | V_L | PMID:10554045 |
| `theanine` | PO | F | PMID:18006208, PMID:23096008 |
| `theophylline` | IV | V_L | PMID:11554438, PMID:6370542 |
| `theophylline` | PO | V_L | PMID:11554438, PMID:6370542 |
| `thymosin-alpha-1` | SC | V_L, F | PMID:11381492 |
| `tocopheryl-acetate` | PO | V_L | PMID:15623833 |
| `trandolapril` | PO | V_L | PMID:7527100, PMID:8480624 |
| `trenbolone` | - | fu | PMID:12441365 |
| `tretinoin` | TD | V_L | PMID:9091507 |
| `triazolam` | PO | V_L | PMID:3950055, PMID:7593708, PMID:8830062, PMID:9536021 |
| `urolithin-a` | PO | F | PMID:32694802 |
| `zafirlukast` | PO | V_L, F | PMID:11888331 |
| `zonisamide` | PO | V_L, F, ka | PMID:15837316, PMID:16302888, PMID:27007995, PMID:6891599, PMID:9549648 |

---

## Also queued: five `metabolites[]` chains

`metabolites[]` is used by **zero records of 1,217**, though the schema supports parent →
metabolite chains and `packages/solver/src/metabolite.ts` implements the whole thing
(`metaboliteCurve`, `metaboliteFormationRate`, `metaboliteCoupling`). **48 records' prose says
an active metabolite matters.**

**Blocked on one number per pair: the molar formation fraction.** Searched 2026-09-08 across
abstracts and PMC full text for codeine, risperidone, amitriptyline and imipramine — **no
numeric formation fraction found in any open source.** It is a derived quantity that
population-PK papers report in tables, not prose.

These are the five pairs where the parent has its own activity **and** the metabolite is a
separately catalogued, solvable record:

| parent | metabolite | note |
|---|---|---|
| `codeine` | `morphine` | the analgesia is largely the metabolite's; fraction is CYP2D6-dependent |
| `risperidone` | `paliperidone` | the clinical convention is the **"active moiety"** — parent + 9-OH summed |
| `imipramine` | `desipramine` | N-demethylation; both separately active |
| `amitriptyline` | `nortriptyline` | as above |
| `mitragynine` | `7-hydroxymitragynine` | metabolite is far more potent at MOR |

### Do NOT author a chain for these

For a prodrug whose `pk_analyte` is **already the metabolite**, the record's curve *is* the
metabolite's, and adding a chain would produce it **twice**:

`valacyclovir` → acyclovir · `valganciclovir` → ganciclovir · `lisdexamfetamine` →
dextroamphetamine · `prednisone` → prednisolone

Check `pk_analyte` before authoring any chain. If it names the metabolite, the pair is already
handled and must be left alone.
