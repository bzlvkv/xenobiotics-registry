# Network — the hosts an authoring session needs

The gates run offline except `pnpm verify` and `pnpm receptors:fetch`. Everything else on
this list exists because [WORKFLOW.md](./WORKFLOW.md) says to fetch, not recall: an agent that
cannot reach NCBI cannot author a single number under [HYGIENE.md](./HYGIENE.md) R1, and must not
try. Check reachability before a batch, and stop if Tier 1 is closed:

```sh
curl -s -m 20 "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=6138080&retmode=json" | head -c 200
```

Rate-limit keys, where a host offers one, go in a local `.env` (gitignored).

The plain list, one host per line for pasting into an allowlist, is at the end of this file.

**A host being on this list means an authoring pass wants it, not that it works.** Four entries were
tested on 2026-09-27 and behave differently from what the table implies; the findings are in
`data/GAPS.md` and the short version is here, because the cost of rediscovering them is hours.

| Host | Verified 2026-09-27 |
| --- | --- |
| `api.elsevier.com` | Reachable, and the key is **not entitled**: 403 `AUTHENTICATION_ERROR` on every view of every article including `META`, on the `entitlement` endpoint, and on an **open-access control**. Bound to an institutional IP or an InstToken, so **no allowlist entry fixes it**. Not a full-text route from here. |
| `www.guidetopharmacology.org` | The **CSV works** (`/DATA/targets_and_families.csv`, 1.9 MB, GtoPdb 2026.3) and is what `pnpm receptors:fetch` uses. The **Web Services** (`/services/…`) now return **401 without an API key**. Use the CSV. |
| `www.ncbi.nlm.nih.gov/research/bionlp/…` (BioC) | **Verified 2026-09-28.** The BioC full-text API (`/RESTful/pmcoa.cgi/BioC_json/PMC{id}/unicode`) returns body **and tables** as plain-text passages, **no reCAPTCHA and no key**, at a 1 s pace. This is what `pnpm fetch:fulltext` uses. Host is already Tier 1 (`www.ncbi.nlm.nih.gov`). Only the OA subset resolves; a non-OA id returns an HTML page the script reports as such. |
| `pmc.ncbi.nlm.nih.gov` | Fine one at a time; **reCAPTCHA on a sweep** — 29 of 42 articles blocked at a 0.4 s interval. For bulk full text use Europe PMC's `…/rest/PMC{id}/fullTextXML`, which has no such gate and returned 31 of the same 42 cleanly. |
| `api.unpaywall.org`, `api.openalex.org`, `api.core.ac.uk` | **Outside this environment's egress policy** (`connect_rejected`). Listed below as wanted; not currently reachable. |

## Tier 1 — called by the repository's own scripts, or named in WORKFLOW.md

| Host | Used for |
| --- | --- |
| `eutils.ncbi.nlm.nih.gov` | `esearch`, `efetch`, `esummary`, `elink`. `pnpm verify` and every literature pass. |
| `pubmed.ncbi.nlm.nih.gov` | The human-readable PMID links `pubmedUrl()` produces. |
| `pmc.ncbi.nlm.nih.gov` | PMC full text. WORKFLOW §3: 122 of 503 closed-looking citations were in PMC. |
| `www.ncbi.nlm.nih.gov` | Redirects, MeSH, Gene, and older PMC paths. |
| `pubchem.ncbi.nlm.nih.gov` | `mw_g_mol`, re-queried during the batch. |
| `dailymed.nlm.nih.gov` | SPL labels for `source_label` provenance. |
| `www.guidetopharmacology.org` | `pnpm receptors:fetch`; `gtp_id` lookups for new `nonGpcrTargets`. **Use the CSV, not the Web Services** — see the table above. |
| `registry.npmjs.org` | `pnpm install`. |

## Tier 2 — finding open-access full text

Where a GAPS row says "full text not retrieved". The value must still be read in the paper the
`source_pmid` names, and the note must say "full text" (WORKFLOW §3).

| Host | Used for |
| --- | --- |
| `www.ebi.ac.uk`, `europepmc.org` | Europe PMC REST: full-text XML when NCBI's `efetch` returns front matter only; also ChEMBL and ChEBI. |
| `ftp.ncbi.nlm.nih.gov` | PMC open-access bulk packages. |
| `doi.org`, `dx.doi.org` | Resolving DOIs recorded in older GAPS rows. |
| `api.crossref.org` | DOI metadata and licence; whether a paper has gone open access since the row was written. |
| `api.unpaywall.org`, `api.openalex.org` | Open-access location for a DOI. **Not reachable here — see the table above.** |
| `api.semanticscholar.org` | Citation graph and full-text links. |
| `api.core.ac.uk`, `core.ac.uk` | Open-access aggregator. **Not reachable here — see the table above.** |
| `scholar.archive.org`, `web.archive.org`, `archive.org` | Archived copies; a label revised in place can be read at its cited effective date. |

## Tier 3 — regulatory labels and assessment reports

FDA clinical-pharmacology reviews and EMA EPARs print volumes, bioavailability and fraction
unbound that abstracts omit. A label value carries the product, set id and effective date in its
`source_label` string (WORKFLOW §3).

| Host | Used for |
| --- | --- |
| `api.fda.gov`, `download.open.fda.gov` | openFDA label JSON and bulk downloads. |
| `www.accessdata.fda.gov`, `www.fda.gov` | Drugs@FDA labels and review PDFs; the FDA DDI substrate/inhibitor tables. |
| `www.ema.europa.eu` | EPARs and SmPCs. |
| `www.medicines.org.uk`, `products.mhra.gov.uk` | UK SmPCs. |
| `www.tga.gov.au` | Australian product information. |
| `health-products.canada.ca`, `pdf.hres.ca` | Health Canada product monographs. |
| `www.pmda.go.jp`, `www.swissmedicinfo.ch` | Japanese and Swiss labels. |
| `clinicaltrials.gov`, `www.clinicaltrialsregister.eu` | Locating the PK sub-study whose PMID is then fetched. Never a citable source. |

## Tier 4 — identity, structure, nomenclature

For HYGIENE Part 1 gates 1 and 3 (is it already here; is it one molecule), R10 (salt versus
base) and R12 (one molecule, one record).

| Host | Used for |
| --- | --- |
| `cactus.nci.nih.gov`, `opsin.ch.cam.ac.uk` | Name to structure, InChI, SMILES. |
| `rxnav.nlm.nih.gov` | RxNorm: salt and base identities, brand to ingredient. |
| `rest.uniprot.org`, `www.uniprot.org` | Protein and peptide sequences and names. |
| `rest.genenames.org`, `www.genenames.org` | HGNC gene symbols for `nonGpcrTargets[].gene`. |
| `hmdb.ca`, `www.hmdb.ca` | Metabolite identities and masses. |
| `comptox.epa.gov` | Physicochemical properties. |
| `meshb.nlm.nih.gov`, `id.nlm.nih.gov` | MeSH headings for search terms. |
| `www.wikidata.org`, `query.wikidata.org`, `en.wikipedia.org` | Identifier crosswalks. Never a citable source. |
| `www.whocc.no` | ATC classification. |

## Tier 5 — affinity, PK and interaction indexes

None of these is citable: R2 requires the abstract or label to state the value. Each one indexes
*which primary paper* states a Ki, a fraction unbound or an AUC ratio, which is the expensive
half of a search.

| Host | Used for |
| --- | --- |
| `www.bindingdb.org`, `pdsp.unc.edu` | Ki with the source reference. |
| `pk-db.com` | Curated PK parameters with source references. |
| `www.pharmgkb.org`, `api.pharmgkb.org` | CYP pathways and clinical annotations. |
| `drug-interactions.medicine.iu.edu` | The Flockhart CYP table. |
| `go.drugbank.com`, `www.drugbank.com` | DDI and target tables (academic licence). |
| `www.guidetoimmunopharmacology.org`, `www.iuphar-db.org` | GtoPdb companions and legacy redirects. |

## Tier 6 — pathway cross-references

For `recon3d_metabolite_id` and the pathways with no Recon3D subsystem.

| Host | Used for |
| --- | --- |
| `www.vmh.life`, `bigg.ucsd.edu` | Recon3D metabolites and subsystems. |
| `rest.kegg.jp`, `www.kegg.jp`, `www.genome.jp` | KEGG pathways and compounds. |
| `reactome.org` | Reactome pathways. |

## Tier 7 — supplements, peptides, nutrition

| Host | Used for |
| --- | --- |
| `api.ods.od.nih.gov`, `dsld.od.nih.gov`, `ods.od.nih.gov` | Dietary Supplement Label Database and ODS fact sheets. |
| `api.nal.usda.gov`, `fdc.nal.usda.gov` | FoodData Central, for the `nutrition` layer. |
| `www.efsa.europa.eu`, `efsa.onlinelibrary.wiley.com` | EFSA scientific opinions. |

## Tier 8 — publishers

For reading an open-access article at its publisher when Tier 2 has no copy. The pharmacology
journals come first. Several of these reject non-browser clients; Europe PMC usually has the same
text.

`link.springer.com`, `bpspubs.onlinelibrary.wiley.com`, `ascpt.onlinelibrary.wiley.com`,
`accp1.onlinelibrary.wiley.com`, `onlinelibrary.wiley.com`, `jpet.aspetjournals.org`,
`dmd.aspetjournals.org`, `molpharm.aspetjournals.org`, `pharmrev.aspetjournals.org`,
`pubs.acs.org`, `www.sciencedirect.com`, `academic.oup.com`, `www.nature.com`, `www.cell.com`,
`www.nejm.org`, `www.thelancet.com`, `jamanetwork.com`, `www.bmj.com`, `www.ahajournals.org`,
`diabetesjournals.org`, `journals.lww.com`, `journals.sagepub.com`, `www.tandfonline.com`,
`karger.com`, `www.thieme-connect.com`, `journals.plos.org`, `www.mdpi.com`,
`www.frontiersin.org`, `bmcpharmacoltoxicol.biomedcentral.com`, `biomedcentral.com`,
`elifesciences.org`, `www.jci.org`, `www.pnas.org`, `www.science.org`,
`journals.physiology.org`, `www.jstage.jst.go.jp`, `www.dovepress.com`, `www.biorxiv.org`,
`www.medrxiv.org`, `api.biorxiv.org`.

A preprint has no PMID and cannot be cited here; the biorxiv hosts are for finding the published
version.

## Tier 9 — infrastructure

`github.com`, `api.github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`,
`nodejs.org`.

The browsing client loads nothing external: no CDN, no fonts. `pnpm dev` needs no host at all.

## The plain list

```
eutils.ncbi.nlm.nih.gov
pubmed.ncbi.nlm.nih.gov
pmc.ncbi.nlm.nih.gov
www.ncbi.nlm.nih.gov
pubchem.ncbi.nlm.nih.gov
dailymed.nlm.nih.gov
www.guidetopharmacology.org
registry.npmjs.org
www.ebi.ac.uk
europepmc.org
ftp.ncbi.nlm.nih.gov
doi.org
dx.doi.org
api.crossref.org
api.unpaywall.org
api.openalex.org
api.semanticscholar.org
api.core.ac.uk
core.ac.uk
scholar.archive.org
web.archive.org
archive.org
api.fda.gov
download.open.fda.gov
www.accessdata.fda.gov
www.fda.gov
www.ema.europa.eu
www.medicines.org.uk
products.mhra.gov.uk
www.tga.gov.au
health-products.canada.ca
pdf.hres.ca
www.pmda.go.jp
www.swissmedicinfo.ch
clinicaltrials.gov
www.clinicaltrialsregister.eu
cactus.nci.nih.gov
opsin.ch.cam.ac.uk
rxnav.nlm.nih.gov
rest.uniprot.org
www.uniprot.org
rest.genenames.org
www.genenames.org
hmdb.ca
www.hmdb.ca
comptox.epa.gov
meshb.nlm.nih.gov
id.nlm.nih.gov
www.wikidata.org
query.wikidata.org
en.wikipedia.org
www.whocc.no
www.bindingdb.org
pdsp.unc.edu
pk-db.com
www.pharmgkb.org
api.pharmgkb.org
drug-interactions.medicine.iu.edu
go.drugbank.com
www.drugbank.com
www.guidetoimmunopharmacology.org
www.iuphar-db.org
www.vmh.life
bigg.ucsd.edu
rest.kegg.jp
www.kegg.jp
www.genome.jp
reactome.org
api.ods.od.nih.gov
dsld.od.nih.gov
ods.od.nih.gov
api.nal.usda.gov
fdc.nal.usda.gov
www.efsa.europa.eu
efsa.onlinelibrary.wiley.com
link.springer.com
bpspubs.onlinelibrary.wiley.com
ascpt.onlinelibrary.wiley.com
accp1.onlinelibrary.wiley.com
onlinelibrary.wiley.com
jpet.aspetjournals.org
dmd.aspetjournals.org
molpharm.aspetjournals.org
pharmrev.aspetjournals.org
pubs.acs.org
www.sciencedirect.com
academic.oup.com
www.nature.com
www.cell.com
www.nejm.org
www.thelancet.com
jamanetwork.com
www.bmj.com
www.ahajournals.org
diabetesjournals.org
journals.lww.com
journals.sagepub.com
www.tandfonline.com
karger.com
www.thieme-connect.com
journals.plos.org
www.mdpi.com
www.frontiersin.org
bmcpharmacoltoxicol.biomedcentral.com
biomedcentral.com
elifesciences.org
www.jci.org
www.pnas.org
www.science.org
journals.physiology.org
www.jstage.jst.go.jp
www.dovepress.com
www.biorxiv.org
www.medrxiv.org
api.biorxiv.org
github.com
api.github.com
raw.githubusercontent.com
objects.githubusercontent.com
nodejs.org
```
