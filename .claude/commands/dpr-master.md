# /dpr-master — Full DPR Orchestration

> **DISCLAIMER:** All outputs are review drafts for professional verification only. Licensed Professional Engineers make all design decisions.

## Purpose

Orchestrates a complete Detailed Project Report (DPR) review by delegating to all active specialist skills, running cross-volume consistency checks, and producing a consolidated compliance memo.

---

## Workflow

### Step 1 — Practice Profile Check

Read `CLAUDE.md`. If any required field is blank, run the cold-start interview:

```
ASK in sequence:
1. Project name and client? (e.g., "4-Laning of NH-48 Km 120–180 for NHAI")
2. Road type and configuration? (NH/SH, 2-lane/4-lane/6-lane/Expressway)
3. Terrain? (Plain / Rolling / Mountainous / Steep)
4. Design speed in kmph?
5. States covered?
6. Project length in km?
7. IRC edition year to apply? (default: 2024)
8. MoRTH edition? (default: 5th Revision)
9. NHAI circular cutoff date? (YYYY-MM-DD)
10. Strictness level? (strict / standard / advisory)
11. Minimum flag severity to report? (critical / major / minor / observation)
```

Write confirmed values back to `CLAUDE.md` before proceeding.

---

### Step 2 — DPR Completeness Check

Verify the uploaded DPR contains the following volumes. Flag any missing volume as **CRITICAL**:

| Volume | Expected Content |
|--------|-----------------|
| Executive Summary | Project overview, key parameters |
| Volume 1 — Traffic | Traffic surveys, growth rates, PCU counts |
| Volume 2 — Geometric Design | Alignment, cross-sections, curves, gradients |
| Volume 3 — Pavement Design | Traffic loading, CBR, crust composition |
| Volume 4 — Bridges & Structures | GADs, hydraulic data, structural design |
| Volume 5 — Hydrology & Drainage | Flood estimation, CD schedule, HFL |
| Volume 6 — Geotechnical | Bore logs, soil classification, slopes |
| Volume 7 — Survey | RoW, topographic survey, benchmarks |
| Volume 8 — Safety | Safety audit, sign schedule, markings |
| Volume 9 — Environment & Social | EIA, R&R, forest/wildlife clearance |
| Volume 10 — Cost Estimate | BOQ, rate analysis, contingency |
| Volume 11 — Drawings | Alignment plans, cross-sections, structures |
| Volume 12 — QC Plan | Material specs, test frequency, acceptance |

---

### Step 3 — Specialist Skill Delegation

Run each active skill in order. Collect all flags.

```
Active skills (per CLAUDE.md):
→ /geometric-design     (if geometric-design: true)
→ /pavement-design      (if pavement-design: true)
→ /bridge-design        (if bridge-design: true)
→ /hydrology-drainage   (if hydrology-drainage: true)
→ /traffic-engineering  (if traffic-engineering: true)
→ /road-safety          (if road-safety: true)
→ /geotechnical         (if geotechnical: true)
→ /environmental-social (if environmental-social: true)
→ /cost-estimation      (if cost-estimation: true)
→ /quality-assurance    (if quality-assurance: true)
→ /drawing-reviewer     (if drawing-reviewer: true)
→ /survey-alignment     (if survey-alignment: true)
→ /project-monitoring   (if project-monitoring: true)
```

---

### Step 4 — Cross-Volume Consistency Checks

Run these consistency checks across collected data from all volumes:

| Check ID | Parameter | Source A | Source B | Rule |
|----------|-----------|----------|----------|------|
| CV-01 | Design traffic (msa) | Traffic chapter | Pavement design | Must match exactly |
| CV-02 | Design speed (kmph) | Geometric design | Safety/sign schedule | Must be consistent |
| CV-03 | CBR value (%) | Geotechnical report | Pavement design | Same subgrade CBR |
| CV-04 | HFL / design discharge | Hydrology chapter | Bridge GAD | Must match |
| CV-05 | Earthwork quantities | Cross-sections | Earthwork schedule | ≤5% variance |
| CV-06 | RoW width | Geometric design | Land acquisition plan | Must match |
| CV-07 | Total project cost | BOQ | Executive summary | Must match |
| CV-08 | Number of bridges | Volume 4 | Volume 5 CD schedule | Count must agree |
| CV-09 | Lane configuration | Geometric design | Traffic capacity | Consistent |
| CV-10 | Seismic zone | Geotechnical | Bridge structural design | Same zone |

Flag any discrepancy ≥ threshold as **MAJOR** or **CRITICAL** depending on impact.

---

### Step 5 — Consolidated Report

Output a structured review memo in `./reviews/DPR-REVIEW-<project>-<date>.md`:

```markdown
# DPR COMPLIANCE REVIEW MEMO
**Project:** {project_name}
**Client:** {client}
**Reviewed by:** IAHE DPR Reviewer v1.0
**Review Date:** {review_date}
**DPR Ref:** {dpr_ref}

> ⚠️ REVIEW DRAFT — For professional verification only. Not a substitute for
> licensed engineering judgment. All flags require engineer review before action.

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total checks performed | {n} |
| Compliant | {compliant} |
| Non-compliant flags | {non_compliant} |
| Observations | {observations} |
| Cross-volume inconsistencies | {cv_flags} |

### Flags by Severity
| Severity | Count |
|----------|-------|
| CRITICAL | {critical} |
| MAJOR | {major} |
| MINOR | {minor} |
| OBSERVATION | {obs} |

### Flags by Section
{section_breakdown_table}

---

## Flags by Skill

{all_skill_flags}

---

## Cross-Volume Consistency Report

{consistency_flags}

---

## Pre-Submission Checklist

- [ ] All CRITICAL flags resolved or addressed with PE sign-off
- [ ] All MAJOR flags reviewed and responded to
- [ ] Cross-volume inconsistencies reconciled
- [ ] Drawing revisions updated to match text
- [ ] BOQ quantities re-verified after design changes
- [ ] IRC code editions confirmed with project approval authority
- [ ] NHAI circulars applied up to cutoff date: {nhai_circular_cutoff}

---

## Sources

{connector_status_table}

---

*Generated: {timestamp} | IAHE DPR Reviewer v1.0 | Apache License 2.0*
```

---

## MCP Connectors Used

- `irc-digital-library` — code clause verification
- `morth-specs-db` — specification cross-check
- `nhai-circulars` — circular applicability
- `google-drive` / `sharepoint` — document access

## Fallback

If connectors are unavailable, complete review using training knowledge. Tag all unverified citations as `[VERIFY — connector offline]`.
