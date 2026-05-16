# /road-safety — Road Safety Audit (Desk Stage)

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:35 | Code of Practice for Road Markings | 2015 |
| IRC:67 | Code of Practice for Road Signs | 2012 |
| IRC:119 | Guidelines for Traffic Safety Barriers | 2015 |
| IRC:SP:55 | Guidelines for Safety in Road Construction Zones | 2014 |
| IRC:SP:88 | Manual for Road Safety Audit | 2010 |
| IRC:SP:99 | Expressway specifications (safety chapter) | 2016 |
| MoRTH | Section 800 — Road Furniture | 5th Rev. |

---

## EXTRACT

**Signs:**
- Sign schedule provided: yes/no
- Types of signs listed (Mandatory, Warning, Informatory)
- Sign dimensions and reflectivity class
- Chainage-wise placement plan

**Markings:**
- Carriageway marking plan: yes/no
- Centre line type (single/double solid/broken)
- Edge line width (mm)
- Rumble strips: provided at hazard locations
- Zebra crossings at intersections

**Safety Barriers:**
- Crash barrier type (W-beam, thrie-beam, concrete median barrier)
- Locations specified (medians, bridges, curves, embankments)
- Working Width class (W1–W7) per IRC:119
- Parapet type on bridges

**Intersection Design:**
- Intersection type (grade-separated, at-grade, roundabout)
- Sight triangles cleared
- Deceleration/acceleration lanes

**Pedestrian / Vulnerable Road Users:**
- Footpaths or service roads on both sides (urban sections)
- Cattle crossings or underpasses at identified locations
- School zone provisions

---

## IDENTIFY

### Sign Placement (IRC:67:2012)

| Sign Type | Advance Warning Distance |
|-----------|------------------------|
| Speed restriction | 100 m before |
| Junction ahead | 300 m on NH |
| Level crossing | 400 m, 200 m, 60 m (triple signs) |
| Village / school | 120 m before |
| Curve / bridge | 90–150 m before |

### Retroreflective Class (IRC:67, Cl. 5)

| Location | Minimum Class |
|----------|--------------|
| NH (open road) | Type VII (Hi-intensity) |
| Urban / construction zone | Type IV (Engineer Grade) |
| Variable message signs | —  |

### Crash Barrier Working Width (IRC:119:2015, Table 1)

| W Class | Working Width (m) | Barrier Type |
|---------|-----------------|-------------|
| W1 | ≤ 0.6 | Rigid concrete (rigid) |
| W2 | ≤ 0.8 | Rigid concrete |
| W3 | ≤ 1.0 | W-beam (semi-rigid) |
| W4 | ≤ 1.3 | W-beam heavy |
| W5 | ≤ 1.7 | Thrie-beam |
| W6 | ≤ 2.1 | Cable barrier |
| W7 | ≤ 2.5 | Cable barrier |

Embankment height > 3 m: mandatory crash barrier on shoulders.
Median < 5 m: concrete median barrier required.

### Carriageway Markings (IRC:35:2015)

| Element | Width (mm) | Colour |
|---------|-----------|--------|
| Centre line (2-lane) | 100 | Yellow |
| Lane line (4-lane+) | 100 | White |
| Edge line | 150 | White |
| Stop line | 300–600 | White |
| Rumble strip | 100 | Yellow |

---

## COMPARE

1. Sign schedule: check all mandatory warning signs for identified hazard locations
2. Retroreflectivity class: minimum Type VII for NH open roads
3. Crash barriers: provided at embankment > 3 m, all medians, all bridge approaches
4. Centre line type: double solid on no-overtaking zones, curves, bridges
5. Deceleration lanes: required at all major intersections on divided roads
6. Sight triangles: cleared at all priority intersections

---

## FLAG

```
FLAG RS-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {description}
Location: {chainage / feature}
Found: {condition}
Required: {IRC code, Clause}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| No crash barrier on embankment > 3 m | CRITICAL |
| Missing bridge parapet / crash barrier at approaches | CRITICAL |
| Level crossing warning signs missing | CRITICAL |
| No deceleration lane at major intersection | MAJOR |
| Retroreflectivity class below Type VII on NH | MAJOR |
| Edge lines missing from sign/marking schedule | MAJOR |
| No rumble strips before toll plazas / intersections | MAJOR |
| Median barrier class not matching median width | MAJOR |
| School zone provisions absent | MAJOR |
| No hazard mapping for blackspot locations | MAJOR |
| Pedestrian underpass not provided at village crossing | MINOR |
| Sign advance placement distance less than IRC:67 | MINOR |

---

## REPORT

```markdown
## Road Safety Audit — Desk Stage

**Codes Applied:** IRC:35, IRC:67, IRC:119, IRC:SP:88
**Road Class:** {configuration} | **Design Speed:** {kmph} kmph

### Safety Feature Checklist
| Feature | Provided in DPR | IRC Required | Status |
|---------|----------------|-------------|--------|
| Sign schedule | {y/n} | Required | {s} |
| Marking plan | {y/n} | Required | {s} |
| Crash barrier schedule | {y/n} | Required | {s} |
| Pedestrian provisions | {y/n} | Required | {s} |
| Intersection design | {y/n} | Required | {s} |

### Flags
{flag_list}

### Recommendations
{recommendations}
```

---

## MCP Connectors

- **irc-digital-library:** `lookup_irc_clause("IRC:119", "T-1")`, `lookup_irc_clause("IRC:67", "5")`
