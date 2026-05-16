# /traffic-engineering — Traffic Engineering Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:9 | Traffic Census on Non-Urban Roads | 1972 |
| IRC:64 | Recommended Practice for Estimation of Urban and Rural Road Traffic | 2016 |
| IRC:106 | Guidelines for Capacity of Roads in Rural Areas | 1990 |
| IRC:108 | Guidelines for Traffic Prediction on Rural Highways | 2015 |
| IRC:SP:41 | Guidelines for the Design of At-Grade Intersections in Rural and Urban Areas | 1994 |
| MoRTH | Traffic surveys — Annexure of DPR Guidelines | Latest |

---

## EXTRACT

**Traffic Survey:**
- Survey agency and dates
- Survey locations (count stations, OD stations)
- Survey duration (7-day, peak day, seasonal)
- Vehicle classification scheme used
- PCU factors adopted

**Volume Data:**
- AADT (Annual Average Daily Traffic) per vehicle class
- Base year total AADT
- Commercial Vehicle traffic (CVPD) in base year
- Peak hour volume and peak hour factor (PHF)
- Directional split

**Growth Rates:**
- Growth rate (%) per vehicle category
- Method of projection (trend, compound, regression)
- Horizon year traffic (design year AADT)

**Capacity Analysis:**
- Level of Service (LOS) at base year
- LOS at design year (before project)
- LOS after project (with proposed configuration)
- PCU/hour for design year at critical section

**OD/Desire Line Analysis (if toll project):**
- OD matrix base year
- Traffic diversion assumptions
- Willingness-to-pay survey methodology

---

## IDENTIFY

### PCU Equivalents (IRC:106, Table 1)

| Vehicle Type | PCU (Plain) | PCU (Rolling) | PCU (Mountain) |
|-------------|------------|--------------|----------------|
| Two-wheelers | 0.5 | 0.5 | 0.5 |
| Auto-rickshaw | 0.75 | 0.75 | 0.75 |
| Car / Jeep / Van | 1.0 | 1.0 | 1.0 |
| Light Commercial Vehicle | 1.5 | 1.5 | 2.0 |
| Truck / Bus (2-axle) | 2.5 | 3.5 | 5.0 |
| Multi-axle trucks | 3.0 | 4.5 | 6.0 |
| Agricultural tractor | 4.0 | 5.0 | 6.0 |

### Design Service Volume / Capacity (IRC:106)

| Configuration | LOS A (PCU/hr/lane) | LOS B | LOS C | LOS D | LOS E (Cap) |
|--------------|---------------------|-------|-------|-------|-------------|
| 2-lane undivided | — | — | — | — | 1500 |
| 4-lane divided | 1200 | 1600 | 2000 | 2300 | 2800 |
| 6-lane divided | 1800 | 2400 | 3000 | 3400 | 4200 |

Design to LOS C or better for NHs.

### Traffic Growth Rates (IRC:108)

- Minimum growth rate for projection: 5% per annum (unless justified by historical data)
- Compound growth formula: `AADT_n = AADT_base × (1 + r)^n`
- Separate rates for commercial vehicles (typically 6–8%) and passenger vehicles (4–7%)

### Design Life / Horizon Year

| Purpose | Horizon Year |
|---------|-------------|
| Pavement design | 15 or 20 years |
| Capacity / configuration | 20 years |
| Toll revenue (BOT/HAM) | 30 years |

---

## COMPARE

1. **Survey methodology:** ≥ 7 consecutive days, classified count per IRC:9
2. **PCU factors:** Match IRC:106 Table 1 for terrain
3. **Growth rate:** ≥ 5% for commercial vehicles or justified deviation
4. **Design year traffic:** Compound growth correctly applied
5. **Capacity check:** LOS ≤ C at design horizon for proposed lanes
6. **msa consistency:** cvpd → msa computation matches Pavement chapter (CV-01)
7. **Peak hour factor:** Documented and reasonable (0.08–0.12 for rural NH)

---

## FLAG

```
FLAG TE-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {description}
Found: {value}
Required: {value} per {IRC code, Clause}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Design traffic (msa) inconsistent between traffic and pavement chapters | CRITICAL |
| LOS at design year > LOS D without mitigation | CRITICAL |
| Survey < 7 days without justification | MAJOR |
| Growth rate < 5% for commercial vehicles without justification | MAJOR |
| PCU factors not matching IRC:106 for stated terrain | MAJOR |
| No seasonal correction factor applied | MAJOR |
| Configuration inadequate for projected traffic | CRITICAL |
| Missing OD study for toll/BOT project | MAJOR |
| Compound growth formula incorrectly applied | MAJOR |
| Horizon year traffic not computed | MAJOR |

---

## REPORT

```markdown
## Traffic Engineering Review

**Codes Applied:** IRC:9, IRC:64, IRC:106, IRC:108
**Base Year:** {year} | **Design Year:** {year} | **Growth Rate (CV):** {r}%

### Traffic Volume Summary
| Station | AADT (Base) | CVPD (Base) | AADT (Design) | LOS (Design) |
|---------|------------|------------|--------------|-------------|
{traffic_table}

### msa Cross-Check
| Input | Traffic Chapter | Pavement Chapter | Status |
|-------|----------------|-----------------|--------|
| Design CVPD | {v} | {v} | {s} |
| VDF | {v} | {v} | {s} |
| Growth rate | {v}% | {v}% | {s} |
| Design traffic (msa) | {v} | {v} | {s} |

### Flags
{flag_list}
```

---

## MCP Connectors

- **irc-digital-library:** `lookup_irc_clause("IRC:106", "T-1")` — PCU equivalents, capacity tables
- **excel-sheets:** `parse_traffic_count_sheets(file)` — raw traffic count data extraction
