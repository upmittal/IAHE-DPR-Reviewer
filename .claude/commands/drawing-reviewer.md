# /drawing-reviewer — Engineering Drawing Review

> **DISCLAIMER:** Review draft for professional verification only. Dimensional extraction is automated; all flagged dimensions require engineer verification.

## Applicable Codes

| Drawing Type | Primary Code |
|-------------|-------------|
| Typical cross-section | IRC:SP:73, IRC:SP:84, IRC:SP:87, IRC:SP:99 |
| L-section (plan & profile) | IRC:38, IRC:52, IRC:SP:23 |
| Bridge GAD | IRC:5, IRC:6, IRC:78, IRC:112 |
| Culvert drawing | IRC:SP:13 |
| Junction layout | IRC:SP:41 |
| Sign layout | IRC:67 |

---

## EXTRACT

### Input Requirements

- **Format:** PDF (preferred) or image (≥ 150 DPI)
- **Scale bar or stated scale:** Required for dimensional extraction
- If scale bar is missing or unreadable: flag as LOW confidence and request manual check

### Drawing Types & Extraction Targets

**Typical Cross-Section:**
| Element | Extract |
|---------|---------|
| Total formation width | Dimension chain (m) |
| Carriageway width (each) | Per lane/group (m) |
| Paved shoulder width | Left + right (m) |
| Earthen shoulder width | Left + right (m) |
| Median width | (m, divided only) |
| Cut/fill slope ratio | H:V from labelling |
| Drain dimensions | Width × depth (m) |
| Camber / cross-fall | % from label |
| Service road width | If provided (m) |

**L-Section (Plan & Profile):**
| Element | Extract |
|---------|---------|
| Gradient (%) | From label on grade lines |
| K-value (vertical curves) | From curve data table |
| Minimum radius (horizontal) | From curve data table |
| Chainage range | From title block |

**Bridge GAD:**
| Element | Extract |
|---------|---------|
| Total bridge length | Dimension (m) |
| Span arrangement | Number × length (m) |
| Deck width | (m) |
| HFL level | From water level label (m) |
| Soffit level at HFL | (m) |
| Vertical clearance | HFL to soffit (m) |
| Scour level | From bore data on drawing |
| Foundation depth below scour | (m) |

---

## CONFIDENCE SCORING

Assign confidence score per extracted dimension:

| Score | Threshold | Meaning |
|-------|-----------|---------|
| HIGH | ≥ 0.90 | Clearly readable dimension; used directly for compliance check |
| MEDIUM | 0.70–0.89 | Readable with minor ambiguity; flag with warning |
| LOW | < 0.70 | Ambiguous / unclear; DO NOT use for compliance; flag for manual check |

Factors reducing confidence:
- Blurry scan or low DPI
- Dimension overwritten by other text
- Scale bar not legible
- Dimension annotation not aligned to feature

---

## IDENTIFY & COMPARE

### Typical Cross-Section — Compliance Checks

**Formation Width (IRC:SP:84 / SP:73 / SP:99)**

| Configuration | Formation Width (m) | Carriageway (m) |
|--------------|---------------------|-----------------|
| 2-lane NH | 12.0 | 7.0 |
| 4-lane divided NH | 26.5 | 2 × 7.0 |
| 4-lane (full median) | 45.0 (60 m RoW) | 2 × 7.0 |
| 6-lane divided | 35.0 | 3 × 3.5 each dir |
| Expressway (8-lane) | 45.0 | 4 × 3.75 each dir |

**Shoulder (IRC:SP:84, Table 2)**

| Road Type | Paved Shoulder (m) | Earthen Shoulder (m) |
|-----------|-------------------|---------------------|
| 4-lane NH (outer) | 1.5 | 1.0 |
| 4-lane NH (inner/median) | 1.0 | — |
| Expressway | 3.0 | 0.5 |

**Side Slopes (MoRTH Cl. 301 / IRC:SP:19)**

| Embankment Height | Slope Ratio (H:V) |
|------------------|------------------|
| 0–3 m | 2:1 |
| 3–6 m | 2:1 (upper), 2:1 (lower) with berm |
| > 6 m | Designed per geotechnical |

**Drain Dimensions (IRC:SP:42)**

| Drain Type | Minimum Size (W × D) |
|-----------|---------------------|
| Side drain (rural) | 0.45 m × 0.45 m |
| Median drain | 0.30 m × 0.30 m |

### Bridge GAD Checks

- Vertical clearance ≥ IRC:5 minimum (1.5 m above HFL)
- Deck width = carriageway + shoulders + footpath (if applicable)
- Foundation depth below scour ≥ IRC:78 requirement

---

## FLAG

```
FLAG DR-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Drawing: {drawing title / sheet no.}
Element: {dimension extracted}
Confidence: HIGH | MEDIUM | LOW
Found: {extracted value} m
Required: {standard value} m per {IRC code}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Formation width below standard for configuration | CRITICAL |
| Carriageway width below IRC standard | CRITICAL |
| Bridge vertical clearance below IRC:5 minimum | CRITICAL |
| Paved shoulder width below minimum | MAJOR |
| Side slope steeper than MoRTH standard without note | MAJOR |
| Median width below 5 m for divided road | MAJOR |
| Scale bar missing — all dimensions LOW confidence | MAJOR |
| Dimension < 0.9 confidence used for critical element | MAJOR |
| Missing drain in cross-section | MINOR |
| Cross-fall not labelled | MINOR |

---

## REPORT

```markdown
## Drawing Review

**Drawing Type:** {type}
**Sheets Reviewed:** {n}
**HIGH Confidence:** {n} sheets | **MEDIUM:** {n} | **LOW:** {n}

### Dimension Extraction Summary
| Sheet | Drawing Title | Scale | Confidence | Key Dimensions | Status |
|-------|-------------|-------|-----------|----------------|--------|
{sheet_table}

### Cross-Section Compliance
| Element | Extracted | Standard | Confidence | Status |
|---------|----------|----------|-----------|--------|
| Formation width | {v} m | {r} m | {c} | {s} |
| Carriageway (each) | {v} m | {r} m | {c} | {s} |
| Paved shoulder | {v} m | {r} m | {c} | {s} |
| Earthen shoulder | {v} m | {r} m | {c} | {s} |
| Median width | {v} m | {r} m | {c} | {s} |

### Flags
{flag_list}

> ⚠️ LOW confidence extractions are excluded from compliance checks.
> Manual verification required for all MEDIUM and LOW confidence dimensions.
```

---

## MCP Connectors

- **autodesk-docs:** `get_drawing_pdf(sheet_id)` — fetch drawing from Autodesk Docs
- **google-drive:** `download_file(file_id)` — fetch drawing PDF from Drive
- **irc-digital-library:** `get_cross_section_template("4-lane-NH")` — standard template overlay
