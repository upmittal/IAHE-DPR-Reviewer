# /geometric-design — Geometric Design Review

> **DISCLAIMER:** Review draft for professional verification only. Claude flags potential non-compliance; the licensed PE makes all design decisions.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:38 | Criteria for Design of Horizontal Curves | 1988 |
| IRC:52 | Recommendations about Sight Distance | 2001 |
| IRC:SP:23 | Vertical Curves | 1993 |
| IRC:SP:73 | Manual of Specifications & Standards for 2-Lane National Highways | 2015 |
| IRC:SP:84 | Manual of Specifications & Standards for 4-Lane National Highways | 2014 |
| IRC:SP:87 | Manual of Specifications & Standards for 6-Lane National Highways | 2013 |
| IRC:SP:99 | Manual of Specifications & Standards for Expressways | 2016 |

---

## EXTRACT

Parse the following from the Geometric Design volume:

**Horizontal Alignment:**
- Design speed adopted (kmph)
- Minimum horizontal curve radius provided (m)
- Superelevation values (%)
- Transition curve lengths (m) — clothoid / cubic parabola
- Number of curves with radius < minimum

**Vertical Alignment:**
- Maximum gradient adopted (%)
- Minimum K-value for crest vertical curves
- Minimum K-value for sag vertical curves
- Gradient at bridge approaches

**Cross-Section Elements:**
- Carriageway width (m)
- Shoulder width — paved + earthen (m)
- Median width (m, divided roads only)
- Formation width (m)
- Side slope in cutting (H:V)
- Side slope in embankment (H:V)
- Cross-fall / camber (%)
- Drain dimensions and type

**Sight Distances:**
- Stopping Sight Distance (SSD) provided (m)
- Intermediate Sight Distance (ISD) or Overtaking Sight Distance (OSD) (m)
- Headlight Sight Distance at sag curves (m)

---

## IDENTIFY

Based on CLAUDE.md profile, determine applicable code and design parameters:

### Minimum Horizontal Curve Radius (IRC:38)

| Design Speed (kmph) | Plain/Rolling (m) | Mountainous (m) | Steep (m) |
|--------------------|------------------|-----------------|-----------|
| 120 | 360 | — | — |
| 100 | 250 | — | — |
| 80 | 155 | 90 | 60 |
| 60 | 90 | 50 | 30 |
| 50 | 60 | 30 | 20 |

### Maximum Superelevation
- NH/SH: 7% (plain/rolling), 10% (mountainous/steep)
- Mix of gravel and snow: 7%

### Maximum Gradient (IRC:SP:84 / SP:73 / SP:99)

| Terrain | 4-Lane NH | 2-Lane NH | Expressway |
|---------|-----------|-----------|------------|
| Plain | 3.3% | 3.3% | 3% |
| Rolling | 5% | 5% | 4% |
| Mountainous | 6% | 6% | — |
| Steep | 7% | 7% | — |

### Carriageway Width

| Configuration | Carriageway (m) | Paved Shoulder (m) | Earthen Shoulder (m) | Median (m) |
|--------------|-----------------|-------------------|---------------------|------------|
| 2-lane (NH) | 7.0 | 1.5 (each) | 1.0 (each) | — |
| 4-lane (NH) | 2 × 7.0 | 1.5 (outer) | 1.0 (outer) | 5.0 min |
| 6-lane (NH) | 3 × 3.5 each dir | 3.0 (outer) | 1.5 (outer) | 12.0 min |
| Expressway | 2 × 7.5 min | 3.0 (outer) | — | 12.0 min |

### Stopping Sight Distance (IRC:52)

| Design Speed (kmph) | SSD (m) |
|--------------------|---------|
| 120 | 180 |
| 100 | 127 |
| 80 | 90 |
| 60 | 60 |
| 50 | 45 |

---

## COMPARE

For each extracted value, compare against the code-required value. Document:
- **Found:** value from DPR
- **Required:** value from IRC
- **Status:** COMPLIANT / NON-COMPLIANT / VERIFY

---

## FLAG

Generate flags using this format:

```
FLAG GD-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {description}
Location: {chainage / sheet number}
Found: {value from DPR}
Required: {IRC value} per {IRC:XX, Clause/Table X.X}
Recommendation: {corrective action}
Connector: {irc-digital-library | training-knowledge [VERIFY]}
```

### Common Flag Triggers

| Condition | Severity |
|-----------|---------|
| Design speed not matching road classification | CRITICAL |
| Curve radius < absolute minimum for design speed | CRITICAL |
| Formation width non-standard | MAJOR |
| Superelevation exceeds maximum | MAJOR |
| Gradient exceeds maximum for terrain | MAJOR |
| SSD not achieved at crest curve | CRITICAL |
| Transition curve length insufficient | MAJOR |
| Shoulder width below standard | MAJOR |
| Median width below standard | MINOR |
| Cross-fall outside IRC range | MINOR |

---

## REPORT

Output review memo section:

```markdown
## Geometric Design Review

**Codes Applied:** IRC:38, IRC:52, IRC:SP:{applicable}, {others}
**Design Speed:** {kmph} kmph | **Terrain:** {terrain} | **Configuration:** {configuration}

### Summary
| Check Category | Checks | Compliant | Flags |
|---------------|--------|-----------|-------|
| Horizontal alignment | {n} | {c} | {f} |
| Vertical alignment | {n} | {c} | {f} |
| Cross-section | {n} | {c} | {f} |
| Sight distance | {n} | {c} | {f} |

### Flags
{flag_list}

### Notes
{additional_observations}
```

Save to `./reviews/geometric-design-<date>.md`.

---

## MCP Connectors

- **irc-digital-library:** `lookup_irc_clause("IRC:38", "3.1")`, `get_irc_parametric_table("IRC:SP:84", "T-2")`
- **Fallback:** Use table values embedded above; tag as `[VERIFY]`
