# /hydrology-drainage — Hydrology & Drainage Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:SP:13 | Guidelines for the Design of Small Bridges and Culverts | 2020 |
| IRC:SP:42 | Guidelines on Road Drainage | 1994 |
| IS:5477 | Methods for Fixing the Capacities of Reservoirs | 1969 |
| CWC | Design Flood Estimation — Flood Estimation Reports | Regional |
| IMD | Hydro-Meteorological Atlas / Rainfall Data | Latest |
| MoRTH | Sections 309, 2500, 2600 | 5th Rev. |

---

## EXTRACT

**Catchment & Hydrology:**
- Catchment area for each cross-drainage (CD) structure (km²)
- Method of flood estimation used (Rational, Dick-Peschke, Ryve's, CWC Regional Curves)
- Design return period (years)
- Rainfall intensity I (mm/hr) or point rainfall (mm)
- Runoff coefficient C adopted
- Time of concentration Tc (minutes)
- Peak design discharge Q (m³/s) per structure
- HFL at each structure location (m)

**Cross-Drainage Schedule:**
- Total number of CDs (culverts + minor bridges + major bridges)
- Type and size of each culvert (pipe, box, slab — dimensions)
- Span and depth of each minor bridge
- Hydraulic adequacy of each structure

**Surface Drainage:**
- Longitudinal drain — type, dimensions, gradient (%)
- Catch water drains in hill sections
- Median drain (for divided roads)
- Sub-surface drainage / filter layer

---

## IDENTIFY

### Design Discharge Methods (IRC:SP:13)

**Rational Formula (Catchment A < 50 km²):**
```
Q = (1/3.6) × C × I × A
  Q = peak discharge (m³/s)
  C = runoff coefficient (0.3–0.95)
  I = rainfall intensity for duration Tc (mm/hr)
  A = catchment area (km²)
```

**Dick-Peschke Formula:**
```
Q = (1/3.6) × C × R^0.67 × A^0.385 × A    [simplified Ryve]
```

**CWC Regional Curves:** For catchment area > 50 km² — mandatory.

### Return Periods (IRC:SP:13, Cl. 4.1)

| Structure Type | Recommended Return Period |
|---------------|--------------------------|
| Culvert (pipe/box) | 25 years |
| Minor bridge (span 6–30 m) | 50 years |
| Major bridge (span > 30 m) | 100 years |
| CD on high embankment | 50–100 years |

### Runoff Coefficients (IRC:SP:13, Table 3)

| Land Cover | C Value |
|-----------|---------|
| Steep rocky terrain | 0.80–0.90 |
| Flat agricultural | 0.35–0.50 |
| Forest / densely wooded | 0.30–0.45 |
| Mixed / semi-arid | 0.50–0.70 |
| Urban / paved | 0.70–0.90 |

### Hydraulic Design of Culverts (IRC:SP:13)

- Velocity of flow: max 3.0 m/s (box), max 4.5 m/s (pipe — concrete)
- Minimum pipe culvert diameter: 900 mm for highways
- Box culvert: minimum opening 1.0 m × 1.0 m
- Vent area ≥ required cross-section for design Q

### Surface Drain Sizing (IRC:SP:42)

| Drain Type | Minimum Grade | Minimum Depth |
|-----------|--------------|--------------|
| Side drain (rural section) | 0.5% | 450 mm |
| Median drain (divided) | 0.3% | 300 mm |
| Catch water drain (hill) | 2–5% | 600 mm |

---

## COMPARE

For each CD structure:
1. Verify Q calculation: re-compute using stated method, catchment, rainfall
2. Check return period ≥ IRC:SP:13 recommendation for structure type
3. Verify vent area ≥ hydraulically required area
4. Confirm HFL at structure matches Hydrology chapter (cross-volume CV-04)
5. Check flow velocity within permissible range
6. Confirm foundation below scour level

For surface drains:
1. Drain grade ≥ minimum
2. Drain capacity ≥ design storm runoff

---

## FLAG

```
FLAG HD-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Structure: {name / chainage}
Item: {description}
Found: {value}
Required: {value} per {IRC:SP:13, Clause X}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Insufficient return period for structure type | CRITICAL |
| Design discharge < calculated Q | CRITICAL |
| HFL in hydrology ≠ HFL in bridge chapter | CRITICAL |
| Culvert vent area inadequate for Q | CRITICAL |
| Flow velocity > permissible | MAJOR |
| Incorrect runoff coefficient for land use | MAJOR |
| Missing catch water drain in hill section | MAJOR |
| CD schedule count < expected for corridor length | MAJOR |
| Drain gradient < minimum | MINOR |
| Culvert diameter < 900 mm minimum | MINOR |
| Afflux not calculated or excessive | MAJOR |

---

## REPORT

```markdown
## Hydrology & Drainage Review

**Codes Applied:** IRC:SP:13:2020, IRC:SP:42, CWC Regional Curves
**Total CD Structures:** {n} | **Catchment Range:** {min}–{max} km²

### Flood Estimation Method Summary
| Method Used | Applicable Range | Used For |
|------------|-----------------|---------|
{method_table}

### CD Schedule Review
| # | Chainage | Type | Size | Q_design (m³/s) | Q_check (m³/s) | Status |
|---|---------|------|------|-----------------|---------------|--------|
{cd_schedule}

### Surface Drainage Compliance
{drain_summary}

### Flags
{flag_list}
```

---

## MCP Connectors

- **imd-rainfall:** `get_rainfall_data(lat, lon, return_period)` — station rainfall data
- **irc-digital-library:** `lookup_irc_clause("IRC:SP:13", "4.1")` — return period requirements
- **hec-ras:** `get_hfl_results(structure_id)` — hydraulic model outputs
