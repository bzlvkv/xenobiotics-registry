# Verification prompt template

Reusable prompt for spawning a literature-verification agent. Adapt the `<ENTITY>` and `<TARGET LIST>` sections per session.

```
I'm authoring <ENTITY> data for a pharmacology registry. STRICT RULE: never fabricate citations.

Every PMID I cite must be VERIFIED via the NCBI E-utilities API (esummary + efetch), and any numeric value must come from the abstract VERBATIM. If the abstract paraphrases ("Ki values were in the µM range"), that's not enough — I need a specific number for a specific compound.

For each entry below, find ONE primary-source PMID with a verbatim value. For each, run:

  curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=NNNN&rettype=abstract&retmode=text"

to fetch the abstract, then extract:
- exact value with units
- exact quote from the abstract showing it
- the PMID (verified to resolve to the named paper, not an unrelated record)

<TARGET LIST>
1. compound-or-pair → field-needed → notes
2. ...
</TARGET LIST>

For each entry, return a structured row:
- PMID (verified)
- value with units
- verbatim quote
- one-line summary of the paper

If for any entry no primary-source value exists in a verifiable PubMed abstract, say so plainly and SKIP it — I'll add it to AUTHORING_GAPS.md, not guess.

Don't paraphrase. Don't average across multiple papers without explicitly noting the math. Quality over quantity.

Return as a structured list. Take as long as you need to verify; quality matters more than speed.
```

## Why this prompt shape works

- **"Never fabricate citations"** is stated first because that's the guardrail. Agents trained on biomedical literature will happily produce plausible PMIDs from training; the API verification step is what blocks that.
- **The exact `curl` command** removes ambiguity. Agents have varying tendencies to paraphrase or invent URLs; supplying the canonical form keeps the loop deterministic.
- **"Verbatim" + "exact quote"** forces the agent to surface the source text, which lets the human reviewer confirm the value wasn't paraphrased into existence.
- **Explicit "skip" path** means an unverified entry gets reported as a skip, not silently dropped or fabricated. The AUTHORING_GAPS.md trail is downstream of these explicit skips.

## Variations by entity type

### CYP inhibition kinetics
- Ask for Ki value in µM
- Note whether HLM or expressed enzyme; species (human / rat)
- Flag time-dependent inactivation (TDI / mechanism-based) separately — solver currently approximates as competitive Ki

### CYP induction kinetics
- Ask for AUC fold-change at steady-state co-administration
- Translate AUC reduction → induction_factor (multiplier on victim ke). E.g. AUC ↓50% → ke × 2.0
- Flag if only enzyme protein induction is reported (smaller number than AUC effect)

### Receptor occupancy
- Ask for EC50 (preferred) or Ki, with µM units
- Convert to mg/L using compound MW
- Note the receptor subtype + species + tissue
- Default Hill_n = 1 if not reported (with explicit caveat)

### PK source_pmid
- Ask for human-volunteer PK paper, single-dose preferred
- Verify abstract carries Cmax, Tmax, AUC, t½ values explicitly
- Note formulation (IR vs MR, salt vs free base) so the citation matches the registry's pk[route] params
