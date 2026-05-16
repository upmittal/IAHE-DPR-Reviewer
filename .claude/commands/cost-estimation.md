# /cost-estimation — Cost Estimation & BOQ Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Reference | Subject |
|-----------|---------|
| MoRTH Specifications | Section-wise specification items |
| NHAI Standard Data Book | Unit rates for NH works |
| State SoR (Schedule of Rates) | State PWD rates for the project state |
| IRC:SP:84 / SP:73 | Specification for quantities |
| CVC/MoF Guidelines | Contingency and price escalation norms |
| DPR Preparation Guidelines (MoRTH) | BOQ format and item structure |

---

## EXTRACT

**BOQ Structure:**
- Total project cost (INR crore)
- Breakup by major heads: Civil, P-way, Bridge/Structure, Electrical, Misc.
- Item-wise quantities and rates
- Lumpsum items (identify and flag if excessive)
- Contingency percentage applied
- Price escalation provision

**Rate Analysis:**
- Rate analysis provided: yes/no
- Source of basic rates (State SoR, market rate, NHAI data book)
- Year of SoR / rates adopted
- Major material rates: Bitumen (INR/MT), Cement (INR/bag), Steel (INR/MT), Aggregate (INR/m³)

**Quantity Cross-Checks:**
- Earthwork: extracted from cross-sections vs. BOQ
- Pavement: area × thickness vs. BOQ quantity
- Bridge deck: total deck area (length × width) vs. BOQ
- Culverts: count and size vs. CD schedule

---

## IDENTIFY

### BOQ Item Completeness Checklist (MoRTH Sections)

| MoRTH Section | Description | Expected in BOQ |
|--------------|-------------|----------------|
| 100 | Site clearance | Yes |
| 200 | Earthwork | Yes |
| 300 | Sub-base courses (GSB, WMM) | Yes |
| 400 | Bituminous works | Yes |
| 500 | Cement concrete pavement | If rigid |
| 600 | Shoulders, medians, guardrails | Yes |
| 700 | Bridges — superstructure | Yes (if bridges exist) |
| 800 | Road furniture (signs, markings, crash barriers) | Yes |
| 900 | QA & Testing | Yes |
| 1100–1700 | Bridge substructure components | Yes (if bridges exist) |
| 2500 | Drainage works | Yes |
| 2600 | Expansion joints, bearings | Yes (if bridges exist) |

### Rate Reasonableness Checks

| Item | Typical Range (2024 base) | Flag if |
|------|--------------------------|---------|
| Bituminous Concrete (BC) | INR 1,800–2,500 / m³ | < 1,500 or > 3,500 |
| Dense Bituminous Macadam | INR 1,500–2,200 / m³ | < 1,200 or > 3,000 |
| Wet Mix Macadam | INR 800–1,200 / m³ | < 600 or > 1,800 |
| Granular Sub-Base | INR 600–900 / m³ | < 400 or > 1,500 |
| Earthwork in embankment | INR 200–500 / m³ | < 150 or > 800 |
| RCC M-40 (bridges) | INR 7,000–10,000 / m³ | < 5,500 or > 14,000 |
| Structural steel | INR 90,000–130,000 / MT | < 70,000 or > 180,000 |
| Prestressed girders | INR 25,000–45,000 / m RMT | — |

> Always verify against project state's current SoR using `morth-specs-db` or `excel-sheets` connector.

### Contingency & Escalation

| Item | Permissible Range |
|------|-----------------|
| Physical contingency | 3–5% of civil cost |
| Price escalation | 3–7% per annum, applied for expected construction period |
| IDC (for BOT/HAM) | Per financial model |

### Quantity Verification Formulae

**Earthwork:**
```
Volume from cross-sections = Σ [(A₁ + A₂)/2 × L]   (prismoidal)
Compare against: BOQ quantity for earthwork items
Acceptable tolerance: ≤ 5%
```

**Pavement Area:**
```
Area = (Carriageway + Paved Shoulder) × Length per section
Layer volume = Area × Thickness (per design crust)
Compare against: WMM, GSB, DBM, BC quantities in BOQ
```

---

## COMPARE

1. BOQ completeness: all MoRTH sections present
2. Quantity cross-check: earthwork, pavement, bridge vs. geometric/structural data
3. Rate comparison: major items vs. state SoR / NHAI data book
4. Rate year: if SoR > 2 years old, escalation factor applied?
5. Contingency: within 3–5%
6. Total cost vs. Executive Summary stated cost
7. Bridge costs consistent with structural design (number of spans, deck area)

---

## FLAG

```
FLAG CE-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {BOQ item / section}
Found: {value / condition}
Required: {standard / norm}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| Earthwork quantity variance > 10% from cross-section calculation | CRITICAL |
| Total project cost in BOQ ≠ Executive Summary | CRITICAL |
| Missing MoRTH Sections (furniture, QA, drainage) | MAJOR |
| Unit rates < 70% of SoR/NHAI data book | MAJOR |
| SoR more than 2 years old without escalation | MAJOR |
| Contingency > 10% without justification | MAJOR |
| Pavement quantities inconsistent with crust design | MAJOR |
| Bridge cost inconsistent with structure inventory | MAJOR |
| Excessive lumpsum items (> 15% of total) | MAJOR |
| Rate analysis not provided for major items | MINOR |
| No price escalation provision for projects > 3 years | MINOR |

---

## REPORT

```markdown
## Cost Estimation & BOQ Review

**Total Project Cost:** INR {cost} Crore
**Rate Base Year:** {year} | **State SoR:** {state}

### BOQ Completeness
| MoRTH Section | Present | Items | Status |
|--------------|---------|-------|--------|
{completeness_table}

### Quantity Cross-Checks
| Component | Cross-Section / Design Qty | BOQ Qty | Variance (%) | Status |
|-----------|--------------------------|---------|--------------|--------|
| Earthwork | {v} m³ | {v} m³ | {v}% | {s} |
| GSB | {v} m³ | {v} m³ | {v}% | {s} |
| WMM | {v} m³ | {v} m³ | {v}% | {s} |
| DBM | {v} m³ | {v} m³ | {v}% | {s} |
| BC | {v} m³ | {v} m³ | {v}% | {s} |

### Rate Reasonableness
| Item | DPR Rate | SoR Rate | Status |
|------|----------|---------|--------|
{rate_table}

### Flags
{flag_list}
```

---

## MCP Connectors

- **morth-specs-db:** `get_sor_rates(state, item_code, year)` — state SoR rates
- **excel-sheets:** `parse_boq(file_path)` — extract BOQ quantities and rates
