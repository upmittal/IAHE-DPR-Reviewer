# /geotechnical — Geotechnical Investigation Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:SP:19 | Manual for Survey, Investigation and Preparation of Road Projects | 2001 |
| IS:1498 | Classification and Identification of Soils for General Engineering Purposes | 1970 |
| IS:2720 | Methods of Test for Soils (series) | Various |
| IS:1888 | Method of Load Test on Soils | 1982 |
| IS:1893 | Criteria for Earthquake Resistant Design | 2016 |
| IS:15284 | Design and Construction for Ground Improvement | 2003 |
| MoRTH | Section 300 — Earthwork | 5th Rev. |

---

## EXTRACT

**Bore Log Programme:**
- Number of boreholes / trial pits
- Spacing of investigation (m)
- Depth of boreholes / trial pits (m)
- Location plan provided: yes/no

**Soil Classification:**
- Soil classification system used (IS:1498 / USCS / AASHTO)
- Soil groups encountered
- Natural moisture content (%)
- Liquid Limit (LL), Plastic Limit (PL), Plasticity Index (PI)

**Subgrade Strength:**
- CBR values (soaked, 4-day) per location
- Design CBR adopted (%)
- MDD (Maximum Dry Density) kg/m³
- OMC (Optimum Moisture Content) %
- FRL vs. existing ground level

**Cut Slopes:**
- Cutting material type (soil/rock)
- Slope ratio adopted (H:V)
- Slope protection measures (coir mat, vegetation, gabion, etc.)

**Embankment:**
- Fill material source and classification
- Compaction specification (% of MDD, layers)
- Ground improvement for weak sub-grades: yes/no
- Surcharge / preloading: yes/no

**Seismic:**
- Site classification (IS:1893, Part 1 — Class A/B/C/D)
- SPT N-values reported
- Liquefaction potential assessment

---

## IDENTIFY

### Bore Log Spacing (IRC:SP:19, Cl. 4.5)

| Terrain | Maximum Spacing |
|---------|----------------|
| Plain / Rolling | 500 m |
| Mountainous / Steep | 300 m |
| Bridge sites | 1 bore per pier/abutment |
| Cut slopes > 6 m | Additional at each cut location |

### Minimum Bore Depth

| Purpose | Minimum Depth |
|---------|--------------|
| Subgrade investigation | 3.0 m below subgrade level |
| Bridge foundation (pile) | Pile tip + 3D below or 5 m, whichever greater |
| Bridge foundation (well) | Well tip depth + 2.0 m |
| Cut slope | 1.5× cut height below formation |

### CBR Design Value (IRC:37, Cl. 5.3)

- Use lowest quartile CBR from all test results
- CBR soaked (4-day soaking) — mandatory for subgrade
- If CBR < 5%, consider subgrade improvement

### Cut Slope Stability (IS:1893 / IRC:SP:19)

| Material | Maximum Slope Ratio (H:V) |
|---------|--------------------------|
| Hard rock | 0.25:1 |
| Soft rock | 0.5:1 |
| Stiff clay / c-φ soil | 1:1 |
| Loose soil | 1.5:1 to 2:1 |
| Saturated / weak | Design by stability analysis |

For slopes > 10 m height: factor of safety (FoS) ≥ 1.5 required (static), ≥ 1.1 (seismic).

### Embankment Compaction (MoRTH Cl. 305)

| Layer | Compaction | Layer Thickness |
|-------|-----------|----------------|
| Body of embankment | 95% of MDD | ≤ 300 mm |
| Top 500 mm (subgrade) | 97% of MDD | ≤ 200 mm |
| Fill in structures | 97% of MDD | ≤ 150 mm |

### Liquefaction Assessment (IS:1893 Part 1)

Required when: SPT N < 30 and saturated sandy deposits below water table at bridge or elevated structures.

---

## COMPARE

1. Bore log spacing ≤ maximum per IRC:SP:19 for terrain type
2. Bore depth sufficient for foundation depth and cut slope height
3. CBR adopted = lowest quartile of soaked tests
4. Cut slope ratios within standard values or supported by stability analysis
5. Compaction spec matches MoRTH Cl. 305
6. Seismic zone matches project profile in CLAUDE.md and Bridge chapter
7. Liquefaction assessment done where required

---

## FLAG

```
FLAG GT-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {description}
Location: {chainage / bore log ID}
Found: {value}
Required: {value} per {IS/IRC code, Clause}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Bore log spacing > IRC:SP:19 maximum | MAJOR |
| Bore depth insufficient for foundation | CRITICAL |
| CBR not soaked 4-day | CRITICAL |
| Design CBR not lowest quartile | CRITICAL |
| Cut slope ratio steeper than material allows without FoS analysis | CRITICAL |
| FoS < 1.5 for static slope stability | CRITICAL |
| Seismic zone inconsistent with IS:1893 zone map | CRITICAL |
| No liquefaction assessment for susceptible sites | MAJOR |
| Compaction spec below MoRTH Cl. 305 | MAJOR |
| Missing bore logs at bridge piers | MAJOR |
| No ground improvement plan for CBR < 5% | MAJOR |
| Moisture content not reported | MINOR |

---

## REPORT

```markdown
## Geotechnical Investigation Review

**Codes Applied:** IRC:SP:19, IS:1498, IS:2720, IS:1893, MoRTH Section 300
**Investigation:** {n} boreholes / {m} trial pits | **Max. Spacing:** {spacing} m
**Seismic Zone:** {zone} | **Design CBR:** {cbr}%

### Investigation Adequacy
| Check | DPR Value | Requirement | Status |
|-------|-----------|-------------|--------|
| Bore spacing | {v} m | ≤ {r} m | {s} |
| Bore depth (subgrade) | {v} m | ≥ 3.0 m below FRL | {s} |
| CBR — soaked 4-day | {y/n} | Mandatory | {s} |
| Design CBR (lowest quartile) | {v}% | {r}% | {s} |

### Slope Stability Summary
| Chainage | Type | Height (m) | Slope (H:V) | FoS | Status |
|---------|------|-----------|------------|-----|--------|
{slope_table}

### Flags
{flag_list}
```

---

## MCP Connectors

- **irc-digital-library:** `lookup_irc_clause("IRC:SP:19", "4.5")` — bore log spacing
- **bis-standards:** `lookup_is_clause("IS:1893", "6.3")` — seismic site classification
