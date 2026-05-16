# /project-monitoring — Project Monitoring & Pre-Submission Checklist

> **DISCLAIMER:** Review draft for professional verification only.

## Purpose

Track DPR review progress, manage revision log, and generate a pre-submission checklist verifying that all critical clearances, design checks, and documentation requirements are met before the DPR is submitted to the approving authority.

---

## EXTRACT

**Project Status:**
- Current DPR revision number
- Previous review dates and reviewer names
- Outstanding flags from prior reviews
- Clearances obtained vs. pending

**Document Inventory:**
- Volumes submitted in this review
- Drawing sheets: total count, revision status
- Reports appended: EIA, SIA, Hydrology, Geotechnical

**Schedule:**
- Target submission date
- Authority's review timeline
- Construction commencement (planned)

---

## PRE-SUBMISSION CHECKLIST

### A — Design & Technical Completeness

```
[ ] Practice profile (CLAUDE.md) filled and reviewed
[ ] All 12 DPR volumes present (per dpr-master completeness check)
[ ] Geometric design reviewed — all CRITICAL and MAJOR flags resolved
[ ] Pavement design reviewed — CBR, msa, crust all verified
[ ] Bridge designs reviewed — all structures have GADs, load class confirmed
[ ] Hydrology reviewed — Q and HFL confirmed for all CDs
[ ] Traffic survey data ≥ 7 days; design year capacity LOS ≤ C
[ ] Geotechnical investigation — bore log spacing and depth adequate
[ ] Road safety audit — crash barriers, signs, markings scheduled
[ ] Drawing review — all cross-sections high-confidence, formation width confirmed
[ ] Survey alignment — RoW plan complete, utilities mapped
```

### B — Cross-Volume Consistency

```
[ ] CV-01: Design traffic (msa) — Traffic ↔ Pavement chapters match
[ ] CV-02: Design speed — Geometric ↔ Safety/signs match
[ ] CV-03: CBR values — Geotechnical ↔ Pavement match
[ ] CV-04: HFL / discharge — Hydrology ↔ Bridge GADs match
[ ] CV-05: Earthwork quantities — Cross-sections ↔ BOQ ≤ 5% variance
[ ] CV-06: RoW width — Geometric drawings ↔ Land acquisition plan match
[ ] CV-07: Total project cost — BOQ ↔ Executive Summary match
[ ] CV-08: CD structure count — Volume 4 ↔ CD schedule match
[ ] CV-09: Lane configuration — Geometric ↔ Traffic capacity match
[ ] CV-10: Seismic zone — Geotechnical ↔ Bridge design match
```

### C — Statutory Clearances

```
[ ] Environmental Clearance — Obtained / Applied (PARIVESH ID noted)
[ ] Forest Clearance Stage I — Obtained / Applied (if forest land involved)
[ ] Forest Clearance Stage II — Obtained / Applied (if forest land involved)
[ ] Wildlife Clearance (NBWL) — Obtained / Applied (if ESZ / corridor)
[ ] CRZ Clearance — Obtained / Applied (if coastal alignment)
[ ] Railway NOC — Obtained for level crossings / ROBs (if applicable)
[ ] State PCB NOC — Applied (if applicable)
```

### D — Land & Social

```
[ ] RoW plan complete with land records
[ ] SIA completed (if > 100 families displaced)
[ ] R&R plan with entitlement matrix provided
[ ] Resettlement sites identified
[ ] Public consultation records included
```

### E — Cost & Contract

```
[ ] BOQ covers all MoRTH sections (100–900, 1100–1700, 2500–2600)
[ ] Unit rates referenced to current State SoR or NHAI data book
[ ] Rate analysis for major items provided
[ ] Contingency: 3–5% of civil works
[ ] Price escalation provision for construction period
[ ] Quantities cross-checked against design output
```

### F — Quality Assurance

```
[ ] QC plan and ITP provided
[ ] Test frequencies meet MoRTH Section 900 minimums
[ ] Material grades specified correctly
[ ] TPQA provision included
```

---

## REVISION LOG

Generate and maintain a revision log table:

```markdown
### DPR Revision Log

| Rev | Date | Chapters Modified | Reviewer | Key Changes | Outstanding Flags |
|-----|------|-----------------|---------|------------|-----------------|
| R0 | {date} | All | {name} | Initial submission | {n} |
| R1 | {date} | {list} | {name} | {summary} | {n} |
| R2 | {date} | {list} | {name} | {summary} | {n} |
```

---

## FLAG TRACKING TABLE

Maintain a live flag tracker across all reviews:

```markdown
### Open Flags — Current Status

| Flag ID | Skill | Severity | Item | Status | Resolution | Date |
|---------|-------|---------|------|--------|-----------|------|
| GD-01 | geometric-design | MAJOR | Curve radius Ch. 45 | OPEN | — | — |
| PD-02 | pavement-design | CRITICAL | msa mismatch | RESOLVED | Revised to 150 msa | 2026-05-10 |
| BD-03 | bridge-design | CRITICAL | HFL mismatch Br-7 | OPEN | — | — |
```

---

## OUTPUT

```markdown
## Project Monitoring Report

**Project:** {project_name}
**Client:** {client}
**Current DPR Rev:** {rev}
**Review Date:** {date}

### Pre-Submission Checklist Summary
| Section | Items | Complete | Pending |
|---------|-------|---------|---------|
| A — Technical | 11 | {c} | {p} |
| B — Cross-volume | 10 | {c} | {p} |
| C — Statutory | 7 | {c} | {p} |
| D — Land & Social | 5 | {c} | {p} |
| E — Cost & Contract | 6 | {c} | {p} |
| F — Quality | 4 | {c} | {p} |
| **Total** | **43** | **{c}** | **{p}** |

**DPR Submission Ready:** {YES — all items complete | NO — {n} items pending}

### Open Critical / Major Flags
{open_flags_table}

### Revision History
{revision_log}
```

Save to `./reviews/project-monitoring-<date>.md`.

---

## MCP Connectors

- **parivesh:** `get_ec_status(application_id)` — auto-populate clearance status
- **primavera / ms-project:** `get_milestone_status(project_id)` — schedule tracking
- **google-drive / sharepoint:** `list_dpr_documents(folder_id)` — document inventory
