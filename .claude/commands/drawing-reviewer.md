# /drawing-reviewer — Engineering Drawing Review

> **DISCLAIMER:** Review draft for professional verification only. Dimensional extraction is automated; all flagged dimensions require engineer verification.

---

## Output Rules (read before processing any image)

1. **Structured output only.** All output is tables + named section headers. No prose paragraphs, no storytelling, no explanatory summaries outside tables.
2. **EXTRACTED vs INFERRED.** Every field carries a `Source` tag:
   - `EXTRACTED` — value directly visible as a labelled dimension or annotation in the drawing
   - `INFERRED` — value derived by calculation (e.g. summing a dimension chain), scaling, or contextual reasoning
3. **Reason column.** Populate the `Reason` column **only** when `Source = INFERRED` or `Extracted Value = BLANK`. Explain the basis of inference or why the field is absent.
4. **Leave blank rather than guess.** If a value is ambiguous, missing, or unclear → leave `Extracted Value` BLANK. Do not assume.
5. **INSUFFICIENT DATA TO DETERMINE.** When a field cannot be populated even at LOW confidence → write this phrase explicitly; do not silently leave it blank.
6. **Human-in-the-loop checkpoint.** After processing each image or sheet, output a CHECKPOINT block and wait for confirmation before proceeding to the next sheet.
7. **No hallucination.** Never assume missing dimensions. Never fabricate IRC clause numbers. If not found in the drawing or provided documents → BLANK.

---

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

## PRE-ANALYSIS (run before extraction on every image)

Before extracting any value, answer these four questions internally:

1. **Drawing type** — What type of drawing is this? (Typical cross-section / L-section / Bridge GAD / Culvert / Junction / Other)
2. **Applicable IRC sections** — Which IRC codes apply based on the drawing type and any visible road classification annotation?
3. **Visible vs missing** — List elements that are clearly visible, elements that are present but ambiguous, and elements not shown at all.
4. **Inference needed?** — For each element to be extracted, determine whether the value is directly labelled (`EXTRACTED`) or must be derived (`INFERRED`). Default is BLANK unless directly labelled or reliably calculable.

Output the pre-analysis as a compact table before the extraction tables.

```
### Pre-Analysis
| Question | Answer |
|----------|--------|
| Drawing type | {type} |
| Applicable IRC codes | {list} |
| Scale bar present | Yes / No / Partially readable |
| Elements clearly visible | {list} |
| Elements ambiguous | {list} |
| Elements not shown | {list} |
| Inference required for | {list or "None"} |
```

---

## INPUT REQUIREMENTS

- **Format:** PDF (preferred) or image (≥ 150 DPI)
- **Scale bar or stated scale:** Required for dimensional extraction
- If scale bar is missing or unreadable: all dimensions → LOW confidence; flag MAJOR

---

## CONFIDENCE SCORING

Assign confidence per extracted dimension. Confidence applies to legibility; Source tag (EXTRACTED / INFERRED) is separate.

| Score | Threshold | Meaning |
|-------|-----------|---------|
| HIGH | ≥ 0.90 | Clearly readable; used directly for compliance check |
| MEDIUM | 0.70–0.89 | Readable with minor ambiguity; include with warning |
| LOW | < 0.70 | Ambiguous or unclear; **DO NOT use for compliance**; flag for manual check |

Factors reducing confidence:
- Blurry scan or low DPI
- Dimension text overwritten or overlapping
- Scale bar not legible
- Annotation not aligned to the feature it labels
- Conflicting values on the same drawing

---

## EXTRACT

### Typical Cross-Section — Elements to Extract

| Element | How to Extract |
|---------|---------------|
| Total formation width | Outer dimension chain (m) |
| Carriageway width (each direction) | Per lane/group label (m) |
| Paved shoulder — outer | Left + right labels (m) |
| Paved shoulder — inner (median side) | Label near median (m) |
| Earthen shoulder — outer | Label (m) |
| Median width | Gap between inner kerbs/barriers (m) |
| Median type | Raised / Flush / Depressed — from annotation |
| Crash barrier / median barrier | Type annotation (W-beam / concrete / thrie-beam) |
| Cut / fill slope ratio | H:V from labelling |
| Side drain — width × depth | Dimension labels (m × m) |
| Median drain | Dimension labels (m × m) |
| Camber / cross-fall | % from label |
| ROW / land width | Outer boundary label (m) |
| Service road width | Label if provided (m) |
| Embankment height | Label or derived from RL difference (m) |

### L-Section (Plan & Profile) — Elements to Extract

| Element | How to Extract |
|---------|---------------|
| Gradient (%) | Grade line label |
| K-value for vertical curves | Curve data table |
| Minimum horizontal radius | Curve data table |
| Chainage range | Title block |

### Bridge GAD — Elements to Extract

| Element | How to Extract |
|---------|---------------|
| Total bridge length | Dimension (m) |
| Span arrangement | Count × length (m) |
| Deck width | Label (m) |
| HFL level | Water level annotation (m) |
| Soffit level at HFL | Label (m) |
| Vertical clearance | HFL to soffit, labelled or INFERRED from RL difference |
| Scour level | Bore data annotation (m) |
| Foundation depth below scour | Label or INFERRED from RL diff (m) |

---

## EXTRACTION TABLE FORMAT

Use this column set for all extraction tables:

| Field | Extracted Value | Source | Confidence | Compliance Status | Reference | Reason |
|-------|----------------|--------|-----------|------------------|-----------|--------|

- **Source:** `EXTRACTED` or `INFERRED`
- **Confidence:** HIGH / MEDIUM / LOW
- **Compliance Status:** Compliant / Non-compliant / Missing / Ambiguous
- **Reference:** Drawing element label OR IRC / MoRTH clause
- **Reason:** Populate ONLY if `Source = INFERRED` or `Extracted Value = BLANK` or `= INSUFFICIENT DATA TO DETERMINE`

---

## IDENTIFY & COMPARE

### Section 1 — Carriageway

**Standard widths (IRC:SP:73 / SP:84 / SP:87 / SP:99):**

| Configuration | Carriageway (m) | Lane width (m) |
|--------------|-----------------|---------------|
| 2-lane NH | 7.0 | 3.5 |
| 4-lane divided NH | 2 × 7.0 | 3.5 |
| 6-lane divided NH | 2 × 10.5 | 3.5 |
| Expressway (8-lane) | 2 × 15.0 | 3.75 |

### Section 2 — Shoulder Width

**Standard (IRC:SP:84, Table 2 / MoRTH NH Shoulder Circular):**

| Road Type | Paved Shoulder — Outer (m) | Earthen Shoulder — Outer (m) | Paved Shoulder — Inner / Median side (m) |
|-----------|--------------------------|-----------------------------|-----------------------------------------|
| 4-lane NH | 1.5 | 1.0 | 1.0 |
| 6-lane NH | 3.0 | 1.5 | 1.0 |
| Expressway | 3.0 | 0.5 | — |
| 2-lane NH | 1.5 (each) | 1.0 (each) | — |

### Section 3 — Median Requirements

**Standard (IRC:SP:84 / IRC:119):**

| Road Type | Median Width — Minimum (m) | Median Barrier Required When |
|-----------|---------------------------|------------------------------|
| 4-lane NH | 5.0 | Median < 5 m → concrete median barrier |
| 6-lane NH | 12.0 | Always — concrete or thrie-beam |
| Expressway | 12.0 | Always — concrete median barrier |

- Median drain minimum: 0.30 m × 0.30 m (IRC:SP:42)
- Raised median kerb: minimum 150 mm height

### Section 4 — ROW / Land Width

**Standard (IRC:SP:84):**

| Configuration | ROW — Plain (m) | ROW — Rolling / Mountain (m) |
|--------------|----------------|------------------------------|
| 2-lane NH | 30 | 24 |
| 4-lane NH | 60 | 45 |
| 6-lane NH | 90 | 60 |
| Expressway | 90 | — |

- Check: Formation width fits within ROW with adequate offset
- Check: ROW boundary clearly marked on drawing

### Section 5 — Drainage

**Standard (IRC:SP:42 / MoRTH Cl. 309):**

| Drain Type | Minimum Size (W × D) | Minimum Gradient |
|-----------|---------------------|-----------------|
| Side drain — rural | 0.45 m × 0.45 m | 0.5% |
| Median drain | 0.30 m × 0.30 m | 0.3% |
| Catch water drain — hill | 0.60 m depth min | 2–5% |

- Drain must be present on both sides
- Drain type (open trapezoidal / RCC lined / kerb-and-gutter) must be annotated

### Section 6 — Formation Width

**Standard (IRC:SP:73 / SP:84 / SP:87 / SP:99):**

| Configuration | Formation Width (m) |
|--------------|---------------------|
| 2-lane NH | 12.0 |
| 4-lane divided NH | 26.5 |
| 6-lane divided NH | 35.0 |
| Expressway (8-lane) | 45.0 |

### Section 7 — Side Slopes & Embankment

**Standard (MoRTH Cl. 301 / IRC:SP:19):**

| Embankment Height | Fill Slope (H:V) | Cut Slope — Soil (H:V) |
|------------------|-----------------|----------------------|
| 0–3 m | 2:1 | 1:1 |
| 3–6 m | 2:1 + berm | 1.5:1 |
| > 6 m | Per geotechnical design | Per geotechnical design |

### Bridge GAD Checks

- Vertical clearance ≥ 1.5 m above HFL (IRC:5:2015, Cl. 10)
- Deck width = carriageway + shoulders + footpath (if applicable)
- Foundation depth below scour ≥ IRC:78 minimums

---

## FLAG

```
FLAG DR-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Drawing: {drawing title / sheet number}
Section: {Carriageway | Shoulder | Median | ROW | Drainage | Formation | Side Slope | Bridge}
Element: {dimension or feature}
Source: EXTRACTED | INFERRED
Confidence: HIGH | MEDIUM | LOW
Found: {value or "INSUFFICIENT DATA TO DETERMINE"}
Required: {IRC/MoRTH value and clause}
Recommendation: {corrective action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Formation width below standard for road class | CRITICAL |
| Carriageway width below IRC standard | CRITICAL |
| Bridge vertical clearance below 1.5 m above HFL | CRITICAL |
| ROW boundary not shown on drawing | CRITICAL |
| Paved shoulder width below minimum | MAJOR |
| Median width below 5 m for 4-lane divided without barrier | MAJOR |
| Median barrier absent where required | MAJOR |
| Side slope steeper than MoRTH standard without geotechnical note | MAJOR |
| Scale bar missing — all dimensions LOW confidence | MAJOR |
| Any critical element at LOW confidence used in compliance decision | MAJOR |
| Side drain missing on one or both sides | MAJOR |
| Drain dimensions below IRC:SP:42 minimum | MAJOR |
| Cross-fall / camber not labelled | MINOR |
| Drain gradient not stated | MINOR |
| Embankment height not annotated | MINOR |
| Median drain not shown for divided road | MINOR |

---

## REPORT FORMAT

> Output is strictly tabular with section headers. No prose paragraphs.

```markdown
## Drawing Review — [Drawing Title / Sheet No.]

**Drawing Type:** {type}
**Scale:** {stated scale or "Not stated"}
**Confidence Summary:** HIGH: {n} fields | MEDIUM: {n} | LOW: {n} | BLANK: {n}

---

### Pre-Analysis
{pre-analysis table}

---

### Section 1 — Carriageway
| Field | Extracted Value | Source | Confidence | Compliance Status | Reference | Reason |
|-------|----------------|--------|-----------|------------------|-----------|--------|
| Carriageway width (each dir.) | | | | | | |
| Lane width | | | | | | |

### Section 2 — Shoulder Width
| Field | Extracted Value | Source | Confidence | Compliance Status | Reference | Reason |
|-------|----------------|--------|-----------|------------------|-----------|--------|
| Paved shoulder — outer (L) | | | | | | |
| Paved shoulder — outer (R) | | | | | | |
| Paved shoulder — inner (median) | | | | | | |
| Earthen shoulder — outer (L) | | | | | | |
| Earthen shoulder — outer (R) | | | | | | |

### Section 3 — Median Requirements
| Field | Extracted Value | Source | Confidence | Compliance Status | Reference | Reason |
|-------|----------------|--------|-----------|------------------|-----------|--------|
| Median width | | | | | | |
| Median type | | | | | | |
| Median barrier type | | | | | | |
| Median drain size | | | | | | |

### Section 4 — ROW / Land Width
| Field | Extracted Value | Source | Confidence | Compliance Status | Reference | Reason |
|-------|----------------|--------|-----------|------------------|-----------|--------|
| ROW / land width shown | | | | | | |
| Formation width fits within ROW | | | | | | |
| ROW boundary marked | | | | | | |

### Section 5 — Drainage
| Field | Extracted Value | Source | Confidence | Compliance Status | Reference | Reason |
|-------|----------------|--------|-----------|------------------|-----------|--------|
| Side drain — left (W × D) | | | | | | |
| Side drain — right (W × D) | | | | | | |
| Drain type | | | | | | |
| Drain gradient | | | | | | |

### Section 6 — Formation Width & Side Slopes
| Field | Extracted Value | Source | Confidence | Compliance Status | Reference | Reason |
|-------|----------------|--------|-----------|------------------|-----------|--------|
| Total formation width | | | | | | |
| Fill slope (H:V) | | | | | | |
| Cut slope (H:V) | | | | | | |
| Embankment height | | | | | | |

---

### Deviations & Non-Compliance Summary

**CRITICAL**
- {list}

**MAJOR**
- {list}

**MINOR / OBSERVATION**
- {list}

---

### Flags
{flag_list}

---

> ⚠️ LOW confidence extractions are excluded from compliance decisions.
> INFERRED values must be independently verified by the reviewing engineer.
> Fields marked INSUFFICIENT DATA TO DETERMINE require manual measurement from original drawings.
```

---

## HUMAN-IN-THE-LOOP CHECKPOINT

After completing the report for each image or sheet, output this block **before processing any further sheets**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKPOINT — Sheet {n} of {total}: {drawing title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Flags raised   : CRITICAL {n} | MAJOR {n} | MINOR {n}
BLANK fields   : {n}  (see Reason column)
INFERRED fields: {n}  (require engineer verification)
INSUFFICIENT DATA TO DETERMINE: {n} fields

Please review the draft above and:
  [A] Confirm — proceed to next sheet
  [B] Correct — provide amended values before proceeding
  [C] Stop — do not process remaining sheets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do not process the next sheet until the reviewer responds.

---

## MCP Connectors

- **autodesk-docs:** `get_drawing_pdf(sheet_id)` — fetch drawing from Autodesk Docs
- **google-drive:** `download_file(file_id)` — fetch drawing PDF from Drive
- **irc-digital-library:** `get_cross_section_template("4-lane-NH")` — standard template overlay
