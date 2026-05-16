# /bridge-design — Bridge & Structures Design Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Code | Subject | Edition |
|------|---------|---------|
| IRC:5 | Standard Specifications and Code of Practice for Road Bridges — General Features | 2015 |
| IRC:6 | Standard Specifications and Code of Practice for Road Bridges — Loads & Stresses | 2017 |
| IRC:24 | Standard Specifications and Code of Practice for Steel Road Bridges | 2010 |
| IRC:78 | Standard Specifications and Code of Practice for Road Bridges — Foundations & Substructure | 2014 |
| IRC:83 | Standard Specifications and Code of Practice — Bearings | 2018 |
| IRC:89 | Guidelines for Design and Construction of River Training and Control Works | 2022 |
| IRC:112 | Code of Practice for Concrete Road Bridges | 2020 |
| IS:1893 | Criteria for Earthquake Resistant Design | 2016 |
| IS:456 | Code of Practice for Plain and Reinforced Concrete | 2000 |
| MoRTH | Sections 1100–1700, 2500–2600 | 5th Rev. |

---

## EXTRACT

### For Each Bridge / Major Structure:

**General:**
- Structure type (RCC slab, PSC girder, steel, arch, cable-stayed)
- Total length (m), number of spans, each span length (m)
- Chainage
- Load standard adopted (IRC:6 — Class A, 70R, Special)
- Design life (years)

**Hydraulic Data:**
- Design discharge Q (m³/s) — return period adopted
- High Flood Level (HFL) (m)
- Lowest Bed Level (LBL) (m)
- Scour depth (m) — HFL scour level
- Linear waterway provided vs. required

**Clearances:**
- Vertical clearance above HFL (m)
- Afflux (m)

**Substructure & Foundation:**
- Foundation type (open, pile, well)
- Pile: diameter (mm), length (m), number per pier/abutment
- Well: external diameter (m), depth below scour level (m)
- Bearing capacity assumed vs. geotechnical recommendation

**Superstructure:**
- Concrete grade (M-xx)
- Prestress or RCC
- Deck slab thickness (mm)
- Wearing coat thickness (mm)
- Railing / crash barrier type

---

## IDENTIFY

### Load Standards (IRC:6:2017, Cl. 204)

| Bridge Class | Vehicle Load | Applicable For |
|-------------|-------------|---------------|
| Class 70R | 70-tonne tracked/wheeled | NH (4-lane and above) |
| Class A | 55-tonne train | All bridges |
| Special Vehicle | 204 te | Long span, exceptional |

NH 4-lane and expressway: Design for Class 70R + Class A in alternate lanes.

### Vertical Clearance (IRC:5:2015, Cl. 10)

| Waterway Type | Minimum Clearance Above HFL |
|--------------|---------------------------|
| Up to 30 m span | 1.5 m (non-tidal), 1.2 m (tidal) |
| 30–100 m span | 1.5 m min |
| > 100 m span | 1.5 m min (more for navigable) |
| Railways below | 7.01 m above rail level |

### Scour Depth (IRC:78:2014, Cl. 703 & IS:1893)

```
Scour Depth = 1.27 × (q² / f)^(1/3)    [Lacey's formula]
  q = discharge per unit width (m³/s/m)
  f = Lacey's silt factor
Minimum scour below HFL = 1.33 × normal scour depth for piers
```

### Seismic Design (IS:1893, IRC:6 — Zone per CLAUDE.md)

| Seismic Zone | Zone Factor Z |
|-------------|-------------|
| II | 0.10 |
| III | 0.16 |
| IV | 0.24 |
| V | 0.36 |

### Minimum Foundation Depth

- Pile: below scour level + 3.0 m for piles
- Well: below scour level + 2.0 m for wells
- Open: below LBL − scour depth − 0.6 m

---

## COMPARE

For each bridge, check:
1. Load standard vs. road class
2. Design discharge return period (≥ 50 yr for NH, 100 yr recommended)
3. HFL adopted vs. Hydrology chapter (cross-volume consistency)
4. Vertical clearance ≥ IRC:5 minimum
5. Scour depth calculation — Lacey's formula verification
6. Foundation depth below scour level
7. Concrete grade ≥ M-35 for PSC, ≥ M-30 for RCC (IRC:112:2020)
8. Seismic zone alignment with geotechnical chapter

---

## FLAG

```
FLAG BD-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Bridge: {name/chainage}
Item: {description}
Found: {value}
Required: {value} per {IRC code, Clause}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Load standard below IRC:6 requirement for road class | CRITICAL |
| Vertical clearance below IRC:5 minimum | CRITICAL |
| HFL in bridge design ≠ HFL in hydrology chapter | CRITICAL |
| Scour depth < Lacey's calculated value | CRITICAL |
| Foundation depth insufficient below scour | CRITICAL |
| Seismic zone different from geotechnical report | CRITICAL |
| Concrete grade below IRC:112 minimum | MAJOR |
| Design discharge < 50-year return period | MAJOR |
| Linear waterway inadequate | MAJOR |
| Afflux exceeds permissible | MAJOR |
| Missing wearing coat or crash barrier spec | MINOR |
| Bearings not conforming to IRC:83 | MINOR |

---

## REPORT

```markdown
## Bridge & Structures Design Review

**Codes Applied:** IRC:5, IRC:6, IRC:78, IRC:112, IS:1893
**Total Bridges Reviewed:** {n}

### Structure Inventory
| # | Name/Chainage | Type | Spans | Length (m) | Load Class |
|---|--------------|------|-------|------------|-----------|
{structure_table}

### Flags by Structure
{flags_by_bridge}

### Summary
| Check | Compliant | Flagged |
|-------|-----------|---------|
| Load standard | {c} | {f} |
| Hydraulic clearance | {c} | {f} |
| Scour & foundation | {c} | {f} |
| Structural design | {c} | {f} |
| Seismic design | {c} | {f} |
```

---

## MCP Connectors

- **irc-digital-library:** `lookup_irc_clause("IRC:78", "703")`, `lookup_irc_clause("IRC:6", "204")`
- **hec-ras:** `get_design_discharge(bridge_id)` — hydraulic model discharge
