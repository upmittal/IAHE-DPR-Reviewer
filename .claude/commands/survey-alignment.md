# /survey-alignment — Survey & Alignment Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:SP:19 | Manual for Survey, Investigation and Preparation of Road Projects | 2001 |
| IRC:SP:84 | RoW requirements for 4-lane highways | 2014 |
| Survey of India | Topographic survey standards | Latest |
| MoRTH DPR Guidelines | Survey data requirements | Latest |

---

## EXTRACT

**Topographic Survey:**
- Survey method used (Total Station, GPS/GNSS, Drone/LiDAR)
- Survey corridor width (m)
- Contour interval (m)
- Survey datum — MSL or local BM
- Number of benchmarks established
- TBM description and RL

**Control Network:**
- Horizontal control: GCP density (points/km)
- Vertical control: levelling loop closure error
- Coordinate system: WGS-84 / SOI grid / State

**Alignment:**
- Alignment finalisation method (strip survey, alternative alignment study)
- Number of alternatives considered
- Selection criteria documented
- Total chainage
- Bypass lengths (if any)

**Right-of-Way (RoW):**
- RoW width specified
- RoW plan prepared: yes/no
- Land parcel details — state, district, village, khasra numbers
- Existing utility services mapped within RoW

**Utility Shifting:**
- Utility type and agency identified
- Shifting plan included: yes/no
- Cost estimate for utility shifting: included in BOQ

**Restricted Areas:**
- Monuments / heritage structures within RoW or buffer
- Religious structures
- Water bodies / tanks

---

## IDENTIFY

### Survey Corridor Width (IRC:SP:19, Cl. 4.2)

| Road Type | Minimum Survey Corridor |
|-----------|------------------------|
| 2-lane NH | RoW + 30 m each side |
| 4-lane NH | RoW + 50 m each side |
| Expressway | RoW + 100 m each side |

### RoW Width Requirements (IRC:SP:84 / IRC:SP:99)

| Road Type | Standard RoW (m) |
|-----------|-----------------|
| 2-lane NH (plain) | 30 m |
| 4-lane divided NH (plain) | 60 m |
| 4-lane divided NH (rolling/mountain) | 45 m |
| 6-lane divided | 90 m |
| Expressway (8-lane) | 90 m |

### Vertical Control Accuracy (Survey of India)

- Levelling loop closure: ≤ 12√K mm (K = circuit length in km) for tertiary levelling
- For NH: ≤ 6√K mm (secondary levelling)

### GCP Density (for LiDAR/drone survey)

- Minimum 1 GCP per km² of survey area (NRSC/SOI guidelines)
- Check-points (independent): ≥ 20% of GCP count

### Utility Mapping Completeness

Required utilities to map:
- Power lines (LT/HT/EHT), substations
- Telecom OFC and overhead cables
- Water supply mains
- Sewer / drainage lines
- Gas pipelines
- Railway crossings (Level/ROB/RUB)

---

## COMPARE

1. Survey corridor width ≥ minimum per IRC:SP:19 for road type
2. RoW width on drawings = standard RoW for road class and terrain
3. Levelling closure error within tolerance
4. All utility types mapped (absence of any category is a flag)
5. Utility shifting plan included with cost
6. Restricted areas (monuments, religious) identified with buffer requirements
7. Alignment alternatives documented and selection justified
8. Land records (khasra / village boundary) overlaid on alignment plan

---

## FLAG

```
FLAG SA-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {description}
Found: {condition}
Required: {IRC:SP:19 / standard}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| RoW width shown on drawing < IRC standard | CRITICAL |
| Survey corridor narrower than IRC:SP:19 minimum | MAJOR |
| No levelling / closure error reported | MAJOR |
| Closure error exceeds 12√K mm | MAJOR |
| No RoW plan prepared | MAJOR |
| Utility mapping incomplete (major categories missing) | MAJOR |
| No utility shifting plan or cost | MAJOR |
| Heritage / religious structure in RoW not flagged | CRITICAL |
| Alternative alignments not documented | MINOR |
| Survey datum not stated | MINOR |
| Benchmarks < 1 per 2 km | MINOR |

---

## REPORT

```markdown
## Survey & Alignment Review

**Codes Applied:** IRC:SP:19:2001
**Survey Method:** {method} | **Corridor Width:** {w} m
**RoW Width:** {row} m | **Total Chainage:** {km} km

### Survey Quality Checks
| Check | Value | Requirement | Status |
|-------|-------|-------------|--------|
| Corridor width | {v} m | ≥ {r} m | {s} |
| Levelling closure | {v} mm | ≤ {r} mm | {s} |
| GCP density | {v}/km² | ≥ 1/km² | {s} |
| Benchmark spacing | {v} km | ≤ 2 km | {s} |

### Utility Mapping Completeness
| Utility | Mapped | Shifting Plan | Cost in BOQ |
|---------|--------|--------------|------------|
| Power lines | {y/n} | {y/n} | {y/n} |
| Telecom / OFC | {y/n} | {y/n} | {y/n} |
| Water supply | {y/n} | {y/n} | {y/n} |
| Sewer / drainage | {y/n} | {y/n} | {y/n} |
| Gas pipeline | {y/n} | {y/n} | {y/n} |

### Flags
{flag_list}
```

---

## MCP Connectors

- **irc-digital-library:** `lookup_irc_clause("IRC:SP:19", "4.2")` — survey corridor requirements
- **google-drive / sharepoint:** `get_document("RoW Plan")`, `get_document("Utility Survey"`
