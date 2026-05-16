# /pavement-design — Pavement Design Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:37 | Guidelines for the Design of Flexible Pavements | 2018 |
| IRC:58 | Guidelines for the Design of Plain Jointed Rigid Pavement for Highways | 2015 |
| IRC:SP:72 | Guidelines for Design of Flexible Pavements for Low Volume Rural Roads | 2015 |
| IRC:SP:81 | Tentative Guidelines for Strengthening of Flexible Road Pavements Using Falling Weight Deflectometer | 2008 |
| IRC:SP:115 | Guidelines for Design and Construction of Geosynthetic Reinforced Embankments | 2014 |
| MoRTH | Specifications for Road and Bridge Works — Sections 300–600 | 5th Rev. |

---

## EXTRACT

Parse the following from the Pavement Design volume:

**Traffic Data:**
- Base year traffic (PCU/day, cvpd)
- Design life (years) — typically 15 or 20 years
- Traffic growth rate (%) used
- Design traffic (msa) — million standard axles
- VDF (Vehicle Damage Factor) adopted
- Lane distribution factor

**Subgrade:**
- Subgrade CBR (%) — individual and adopted design value
- Whether CBR is laboratory soaked or field
- Subgrade compaction specification

**Flexible Pavement (IRC:37):**
- Granular sub-base (GSB) thickness (mm)
- Wet Mix Macadam (WMM) base thickness (mm)
- Dense Bituminous Macadam (DBM) thickness (mm)
- Bituminous Concrete (BC) wearing course thickness (mm)
- CRMB/PMB grade adopted
- Total crust thickness (mm)
- Design approach: Mechanistic-Empirical or Catalogue

**Rigid Pavement (IRC:58), if applicable:**
- Slab thickness (mm)
- Concrete grade (M-xx)
- Tied concrete shoulder: yes/no
- Dowel bar diameter and spacing
- Tie bar specification
- Sub-base type (DLC/GSB) and thickness (mm)

---

## IDENTIFY

### Design Traffic Calculation (IRC:37, Cl. 4)

```
N = 365 × A × [(1+r)^n - 1] / r × D × F
Where:
  A = base year commercial vehicles per day (cvpd)
  r = annual traffic growth rate
  n = design life (years)
  D = lane distribution factor
  F = vehicle damage factor (VDF)
```

### VDF Values (IRC:37, Table 4.1)

| Road Type | Typical VDF Range |
|-----------|------------------|
| NH (4-lane) | 2.5 – 4.5 |
| NH (2-lane) | 3.5 – 5.0 |
| State Highway | 2.0 – 4.0 |

### Lane Distribution Factor (IRC:37, Table 4.2)

| No. of Lanes (one direction) | Factor |
|------------------------------|--------|
| 1 | 1.0 |
| 2 | 0.75 |
| 3 | 0.60 |

### Minimum Pavement Crust Thickness (IRC:37:2018 Catalogue)

| CBR (%) | msa=10 | msa=20 | msa=30 | msa=50 | msa=100 | msa=150 |
|---------|--------|--------|--------|--------|---------|---------|
| 2 | GSB:230, WMM:250, DBM:75, BC:40 | GSB:230, WMM:250, DBM:100, BC:40 | Refer IRC:37 Table | ... | ... | ... |
| 5 | GSB:200, WMM:250, DBM:50, BC:40 | GSB:200, WMM:250, DBM:75, BC:40 | ... | ... | ... | ... |
| 8 | GSB:150, WMM:200, DBM:50, BC:40 | GSB:150, WMM:250, DBM:50, BC:40 | ... | ... | ... | ... |

> Note: Always use connector `irc-digital-library` to fetch exact catalogue values for the specific CBR and msa.

### Bitumen Grade (MoRTH / IRC:SP:53)

| Annual Mean Temperature | Recommended Grade |
|------------------------|------------------|
| < 30°C | VG-30 / CRMB-55 |
| 30–40°C | VG-40 / CRMB-60 / PMB 40 |
| > 40°C | PMB 45 or higher |

---

## COMPARE

Check each DPR value against IRC:37 (flexible) or IRC:58 (rigid):

1. **Traffic computation:** Re-verify N formula with given inputs
2. **CBR:** Confirm adopted CBR is lowest quartile of reported values (IRC:37, Cl. 5.3)
3. **Layer thicknesses:** Compare against IRC:37 catalogue for the (CBR, msa) pair
4. **Bitumen grade:** Check suitability for project climate zone
5. **BC thickness:** Minimum 40 mm for design traffic ≥ 10 msa
6. **WMM:** Minimum 250 mm for NH
7. **GSB:** Meets drainage and filter criteria (MoRTH Cl. 401)

For rigid pavement (IRC:58):
- Slab thickness vs. IRC:58 catalogue (concrete grade, traffic, k-value)
- Dowel bar: min 32 mm dia at 300 mm c/c for heavy traffic
- Concrete M-40 minimum for NH

---

## FLAG

```
FLAG PD-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {description}
Found: {value}
Required: {value} per {IRC:37/58, Clause/Table}
Recommendation: {action}
Connector: {source}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Design traffic (msa) inconsistent with traffic chapter | CRITICAL |
| CBR not taken as lowest quartile | MAJOR |
| Layer thickness below IRC:37 catalogue | CRITICAL |
| Wrong bitumen grade for climate zone | MAJOR |
| VDF not justified or not referenced to IRC:37 Table 4.1 | MAJOR |
| Design life < 15 years without justification | MAJOR |
| BC < 40 mm for msa ≥ 10 | MAJOR |
| Missing GSB drainage layer | MAJOR |
| Rigid pavement: slab thickness not matching IRC:58 table | CRITICAL |
| Growth rate not supported by traffic data | MINOR |

---

## REPORT

```markdown
## Pavement Design Review

**Codes Applied:** IRC:37:2018, IRC:58:2015, MoRTH 5th Rev.
**Design Traffic:** {msa} msa | **Design Life:** {years} years
**Subgrade CBR:** {cbr}% | **Pavement Type:** Flexible / Rigid

### Traffic Computation Check
| Parameter | DPR Value | Verified Value | Status |
|-----------|-----------|---------------|--------|
| Base year cvpd | {v} | {v} | {s} |
| Growth rate | {v}% | {v}% | {s} |
| Design life | {v} yrs | {v} yrs | {s} |
| VDF | {v} | {v} | {s} |
| Lane factor | {v} | {v} | {s} |
| Design traffic (msa) | {v} | {v} | {s} |

### Crust Composition Check
| Layer | DPR (mm) | Required (mm) | Status |
|-------|----------|---------------|--------|
| GSB | {t} | {r} | {s} |
| WMM | {t} | {r} | {s} |
| DBM | {t} | {r} | {s} |
| BC | {t} | {r} | {s} |
| **Total** | **{t}** | **{r}** | **{s}** |

### Flags
{flag_list}
```

---

## MCP Connectors

- **irc-digital-library:** `get_irc_parametric_table("IRC:37", "T-2")` — crust catalogue
- **imd-rainfall:** `get_climate_zone(lat, lon)` — for bitumen grade selection
