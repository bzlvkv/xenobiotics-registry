# pi3k_layers — Reactome three-layer import (R-HSA-1257604)

cascade: 31 nodes / 29 edges (from 24 reactions)
regulators: 64 (from 64 regulation reactions + regulatedBy)
citations: 58/58 PMIDs verified

## Cascade (the clean overview)

- RAC1:GTP,RAC2:GTP,RHOG:GTP → RAC1:GTP,RAC2:GTP,RHOG:GTP:PI3K alpha  ·  —  ·  PMID 8645157
- Activator:PI3K → PI(3,4,5)P3  ·  —  ·  PMID 19805105
- PI(4,5)P2 → PI(3,4,5)P3  ·  —  ·  PMID 19805105
- PI(3,4,5)P3 → AKT:PIP3  ·  —  ·  PMID 12167717
- PI(3,4,5)P3 → PDPK1:PIP3  ·  —  ·  PMID 9895304
- mTORC2:PIP3 → p-S-AKT:PIP3  ·  —  ·  PMID 15718470
- AKT:PIP3 → p-S-AKT:PIP3  ·  —  ·  PMID 15718470
- mTORC2:PIP3 → SGK1  ·  —  ·  PMID 18925875
- PDPK1:PIP3 → p-S-AKT:PDPK1:PIP3  ·  —  ·  PMID 12167717
- N:M:PDPK1 → PDPK1:PIP3  ·  —  ·  PMID 9736715
- p-S-AKT:PDPK1:PIP3 → PDPK1:PIP3  ·  —  ·  PMID 9736715
- PDPK1:PIP3 → SGK1  ·  —  ·  PMID 10191262
- p-T,p-S-AKT → BAD  ·  —  ·  PMID 9381178
- p-T,p-S-AKT → p-S9/21-GSK3  ·  —  ·  —
- GSK3 → p-S9/21-GSK3  ·  —  ·  —
- p-T,p-S-AKT → CASP9  ·  —  ·  PMID 9812896
- p-T,p-S-AKT → MDM2  ·  —  ·  PMID 11715018
- p-T,p-S-AKT → CHUK  ·  —  ·  PMID 10485710
- p-T,p-S-AKT → p-T-CDKN1A/B  ·  —  ·  PMID 12244303
- CDKN1A,CDKN1B → p-T-CDKN1A/B  ·  —  ·  PMID 12244303
- p-T,p-S-AKT → TSC2  ·  —  ·  PMID 12172553
- p-T,p-S-AKT → AKT1S1  ·  —  ·  PMID 12524439
- p-T,p-S-AKT → MKRN1  ·  —  ·  PMID 26183061
- p-T,p-S-AKT → CREB1  ·  —  ·  PMID 9829964
- p-T,p-S-AKT → p-T24,S256,S319-FOXO1,p-T32,S253,S315-FOXO3,p-T32,S197,S262-FOXO4,(p-T26,S184-FOXO6)  ·  —  ·  PMID 10358075
- FOXO1,FOXO3,FOXO4,(FOXO6) → p-T24,S256,S319-FOXO1,p-T32,S253,S315-FOXO3,p-T32,S197,S262-FOXO4,(p-T26,S184-FOXO6)  ·  —  ·  PMID 10358075
- p-T,p-S-AKT → RPS6KB2  ·  —  ·  PMID 10490848
- p-T,p-S-AKT → NR4A1  ·  —  ·  PMID 11274386
- PDPK1 → PDPK1:PIP2  ·  —  ·  PMID 9895304

## Regulators (the captured payload)

- **PI(3,4,5)P3** inhibits — PTEN dephosphorylates PIP3  (PMID 12808147)  _[Negative regulation of the PI3K/AKT network]_
- **THEM4/TRIB3** inhibits — THEM4 (CTMP) and/or TRIB3 inhibit AKT phosphorylation  (PMID 11598301)  _[Negative regulation of the PI3K/AKT network]_
- **p-T,p-S-AKT** inhibits — PHLPP dephosphorylates S473 in AKT  (PMID 15808505)  _[Negative regulation of the PI3K/AKT network]_
- **PI4P** inhibits — PI4P is phosphorylated to PI(4,5)P2 by PIP5K1A-C at the plasma membrane  (PMID 9211928)  _[Negative regulation of the PI3K/AKT network]_
- **PI5P** inhibits — PI5P is phosphorylated to PI(4,5)P2 by PIP4K2 dimers at the plasma membrane  (PMID 18753295)  _[Negative regulation of the PI3K/AKT network]_
- **AKT1** inhibits — AKT1 dephosphorylation by PP2A-B56-beta,gamma  (PMID 17200115)  _[Negative regulation of the PI3K/AKT network]_
- **PP2A** inhibits — Inhibition of PP2A activity by phosphorylation of the catalytic subunit at tyrosine Y307  (PMID 1325671)  _[Negative regulation of the PI3K/AKT network]_
- **IER3** inhibits — IER3 recruits MAPKs to PP2A-B56-beta,gamma  (PMID 16456541)  _[Negative regulation of the PI3K/AKT network]_
- **PP2A-B56-beta,gamma:IER3:p-T,Y-MAPK dimers** inhibits — MAPKs phosphorylate PP2A  (PMID 16456541)  _[Negative regulation of the PI3K/AKT network]_
- **TP53 Tetramer** regulates — TP53 binds the PTEN promoter  (PMID 11545734)  _[PTEN Regulation]_
- **EGR1** regulates — EGR1 binds the PTEN gene promoter  (PMID 11781575)  _[PTEN Regulation]_
- **PPARG:Fatty Acid Ligand** regulates — Activated PPARG binds PTEN gene promoter  (PMID 11378386)  _[PTEN Regulation]_
- **NR2E1:(CoREST complex,ATN1,HDAC3,HDAC5,HDAC7)** regulates — NR2E1 associated with transcription repressors binds PTEN promoter  (PMID 16702404)  _[PTEN Regulation]_
- **SALL4** regulates — SALL4 binds the PTEN gene promoter  (PMID 18487508)  _[PTEN Regulation]_
- **SALL4:PTEN gene** regulates — SALL4 recruits NuRD to PTEN gene  (PMID 19440552)  _[PTEN Regulation]_
- **MECOM** regulates — MECOM (EVI1) binds the PTEN gene promoter  (PMID 21289308)  _[PTEN Regulation]_
- **PRC1.4,PRC2 (EZH2) core** regulates — MECOM (EVI1) recruits polycomb repressor complexes (PRCs) to the PTEN gene promoter  (PMID 21289308)  _[PTEN Regulation]_
- **SNAI1,SNAI2** regulates — SNAI1,SNAI2 bind the PTEN gene promoter  (PMID 18172008)  _[PTEN Regulation]_
- **JUN** regulates — JUN binds the PTEN gene promoter  (PMID 16676006)  _[PTEN Regulation]_
- **ATF2** regulates — p-T69,T71-ATF2 binds PTEN gene promoter  (PMID 16418168)  _[PTEN Regulation]_
- **MAF1** regulates — mTORC1 phosphorylates MAF1  (PMID 20233713)  _[PTEN Regulation]_
- **MAF1** regulates — MAF1 translocates to the nucleus  (PMID 20233713)  _[PTEN Regulation]_
- **MAF1** regulates — MAF1 binds the PTEN gene promoter  (PMID 26910647)  _[PTEN Regulation]_
- **PTEN** regulates — PTEN gene transcription is stimulated by TP53, EGR1, PPARG, ATF2, MAF1, and inhibited by NR2E1, SALL4, MECOM, SNAI1, SNAI2, JUN  (PMID 11545734)  _[PTEN Regulation]_
- **miR-17 RISC** regulates — miR-17 microRNA binds PTEN mRNA  (PMID 18327259)  _[PTEN Regulation]_
- **PTEN** regulates — miR-19a microRNA binds PTEN mRNA  (PMID 18327259)  _[PTEN Regulation]_
- **PTEN** regulates — miR-19b microRNA binds PTEN mRNA  (PMID 20577206)  _[PTEN Regulation]_
- **PTEN** regulates — miR-20 microRNAs bind PTEN mRNA  (PMID 20577206)  _[PTEN Regulation]_
- **miR-21 Nonendonucleolytic RISC** regulates — miR-21 nonendonucleolytic RISC binds PTEN mRNA  (PMID 17681183)  _[PTEN Regulation]_
- **miR-22 RISC** regulates — miR-22 microRNA binds PTEN mRNA  (PMID 20388916)  _[PTEN Regulation]_
- **miR-25 RISC** regulates — miR-25 microRNA binds PTEN mRNA  (PMID 20388916)  _[PTEN Regulation]_
- **PTEN** regulates — miR-26A microRNAs bind PTEN mRNA  (PMID 19487573)  _[PTEN Regulation]_
- **miR-93 RISC** regulates — miR-93 microRNA binds PTEN mRNA  (PMID 20388916)  _[PTEN Regulation]_
- **miR-106 RISC** regulates — miR-106 microRNAs bind PTEN mRNA  (PMID 20388916)  _[PTEN Regulation]_
- **miR-205 RISC** regulates — miR-205 microRNA binds PTEN mRNA  (PMID 23856247)  _[PTEN Regulation]_
- **miR-214 Nonendonucleolytic RISC** regulates — miR-214 microRNA binds PTEN mRNA  (PMID 18199536)  _[PTEN Regulation]_
- **PTEN** regulates — PTEN mRNA translation is negatively regulated by microRNAs  (PMID 19487573)  _[PTEN Regulation]_
- **PTENP1** regulates — PTENP1 mRNA binds miR-19b RISC  (PMID 20577206)  _[PTEN Regulation]_
- **PTENP1** regulates — PTENP1 mRNA binds miR-20 RISC  (PMID 20577206)  _[PTEN Regulation]_
- **VAPA** regulates — miR-17 microRNA binds VAPA mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **miR-17 RISC** regulates — miR-17 microRNA binds CNOT6L mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **VAPA** regulates — miR-19a microRNA binds VAPA mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **CNOT6L** regulates — miR-19a microRNA binds CNOT6L mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **miR-19b RISC** regulates — miR-19b microRNA binds CNOT6L mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **miR-20 RISC** regulates — miR-20 microRNAs bind VAPA mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **miR-20 RISC** regulates — miR-20 microRNAs bind CNOT6L mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **miR-106 RISC** regulates — miR-106 microRNAs bind VAPA mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **miR-106 RISC** regulates — miR-106a,(miR106b) microRNA binds CNOT6L mRNA  (PMID 22000013)  _[PTEN Regulation]_
- **PTEN** regulates — PTEN undergoes monoubiquitination  (PMID 17218261)  _[PTEN Regulation]_
- **PTEN** regulates — Monoubiquitinated PTEN translocates to the nucleus  (PMID 17218261)  _[PTEN Regulation]_
- **PTEN** regulates — USP7 deubiquitinates monoubiquitinated PTEN  (PMID 18716620)  _[PTEN Regulation]_
- **PTEN** regulates — Deubiquitinated PTEN translocates to the cytosol  (PMID 18716620)  _[PTEN Regulation]_
- **PTEN** regulates — NEDD4, WWP2, CHIP and XIAP polyubiquitinate PTEN  (PMID 17218260)  _[PTEN Regulation]_
- **PTEN** regulates — MKRN1 polyubiquitinates PTEN  (PMID 26183061)  _[PTEN Regulation]_
- **PTEN** regulates — TNKS and TNKS2 PARylate PTEN  (PMID 25547115)  _[PTEN Regulation]_
- **PTEN** regulates — RNF146 polyubiquitinates PARylated PTEN  (PMID 25547115)  _[PTEN Regulation]_
- **PolyUb-PTEN, K48polyUb-K289-PTEN, PolyUb-K324,K344,K349-RibC-E40,E150,D326-PTEN** regulates — Proteasome degrades polyubiquitinated PTEN  (PMID 17218260)  _[PTEN Regulation]_
- **PolyUb-PTEN,K48polyUb-K289-PTEN** regulates — USP13 and OTUD3 deubiquitinate PTEN  (PMID 24270891)  _[PTEN Regulation]_
- **FRK** regulates — PTEN binds FRK  (PMID 19345329)  _[PTEN Regulation]_
- **PTEN:p-Y387-FRK** regulates — FRK phosphorylates PTEN  (PMID 19345329)  _[PTEN Regulation]_
