# /quality-assurance — Quality Assurance Plan Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Codes

| Reference | Subject |
|-----------|---------|
| MoRTH Specifications, Section 900 | Quality Control — Road Works |
| MoRTH Specifications, Section 1700 | Quality Control — Bridge Works |
| IRC:SP:11 | Handbook of Quality Control for Construction of Roads and Runways | 2013 |
| IS:2386 | Methods of Test for Aggregates | Various parts |
| IS:73 | Paving Bitumen | 2013 |
| IS:516 | Methods of Tests for Strength of Concrete | 2018 |
| BIS Certification | Mandatory BIS marking for cement, steel | Latest |

---

## EXTRACT

**QC Plan:**
- QC plan document provided: yes/no
- Inspection and Test Plan (ITP) provided: yes/no
- Third-party quality inspection (TPQA) provision: yes/no

**Material Specifications:**
- Cement: type and grade specified
- Reinforcement steel: grade (Fe-415 / Fe-500 / Fe-500D)
- Structural steel: grade (IS:2062)
- Aggregate source and test requirements
- Bitumen grade specified per climate zone
- GSB and WMM gradation specified

**Test Frequencies (per MoRTH Section 900):**
- Subgrade compaction tests
- GSB density tests
- WMM, DBM, BC tests
- Concrete cube tests

**Lab Facilities:**
- Field laboratory requirement mentioned
- Lab equipment list provided
- Central lab requirement (for large projects)

---

## IDENTIFY

### MoRTH Section 900 — Minimum Test Frequencies

#### Earthwork & Subgrade (MoRTH Cl. 900.2)

| Test | Frequency |
|------|-----------|
| Proctor compaction (MDD, OMC) | 1 per 3000 m³ of embankment |
| In-situ density (core cutter / sand replacement) | 1 per 500 m² per layer |
| CBR (subgrade) | 1 per 1500 m of road per lane |

#### Granular Layers (MoRTH Cl. 900.3)

| Test | Frequency |
|------|-----------|
| GSB: gradation | 1 per 200 m³ |
| GSB: compaction (density) | 1 per 500 m² per layer |
| WMM: gradation | 1 per 100 m³ |
| WMM: compaction | 1 per 500 m² |

#### Bituminous Works (MoRTH Cl. 900.4)

| Test | Frequency |
|------|-----------|
| Bitumen penetration / viscosity | 1 per tanker lot |
| Marshall stability (mix design) | 1 per 100 MT |
| Core density (field density) | 1 per 500 m² per layer |
| Binder content extraction | 1 per 400 m² |
| Aggregate gradation | 1 per 100 m³ |

#### Concrete — Bridges (MoRTH Cl. 1700)

| Test | Frequency |
|------|-----------|
| Cube strength (28-day) | 1 set per 30 m³ or part thereof |
| Slump / workability | Every batch at site |
| Aggregate impact value, Flakiness | 1 per source per month |
| Water-cement ratio check | Every batch |

### Material Minimum Specifications

| Material | Minimum Grade / Requirement |
|---------|--------------------------|
| Cement | OPC 43 or OPC 53 (IS:269/8112) |
| Rebar | Fe-500D for seismic zone III/IV/V |
| Structural steel | IS:2062, E350 minimum for bridges |
| Bitumen (VG-40) | Penetration: 40–80 dmm, Softening point: 47°C min |
| Coarse aggregate (WMM) | LAV ≤ 40%, FI ≤ 30%, Water absorption ≤ 2% |

---

## COMPARE

1. QC plan completeness — all work items covered
2. ITP provided with accept/reject criteria
3. Test frequencies ≥ MoRTH Section 900 minimums
4. Material grades specified correctly for project conditions and seismic zone
5. TPQA arrangement described
6. Field lab equipment list matches work scope
7. BIS certification required for cement, steel, reinforcement

---

## FLAG

```
FLAG QA-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {test / material / procedure}
Found: {condition}
Required: {MoRTH clause / IS code}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| No QC plan provided | CRITICAL |
| Test frequency < 50% of MoRTH Section 900 minimum | MAJOR |
| Material grade below minimum (e.g., Fe-415 in seismic zone IV) | MAJOR |
| No TPQA provision for project cost > INR 100 Cr | MAJOR |
| Bitumen grade not matching climate zone | MAJOR |
| Concrete grade below IRC:112 minimum for bridges | MAJOR |
| No ITP document | MAJOR |
| Field lab not required / not mentioned for large project | MAJOR |
| BIS certification not specified for cement/steel | MINOR |
| Test frequency slightly below minimum (< 20% shortfall) | MINOR |
| No provision for pre-qualification of material sources | MINOR |

---

## REPORT

```markdown
## Quality Assurance Plan Review

**Codes Applied:** MoRTH Section 900/1700, IRC:SP:11
**QC Plan Provided:** {yes/no} | **ITP Provided:** {yes/no} | **TPQA:** {yes/no}

### Material Specification Compliance
| Material | Specified Grade | Required Grade | Status |
|---------|----------------|---------------|--------|
| Cement | {g} | OPC 43/53 | {s} |
| Rebar | {g} | Fe-500D (seismic) | {s} |
| Bitumen | {g} | {climate zone grade} | {s} |
| Bridge concrete | M-{g} | M-35 minimum | {s} |

### Test Frequency Compliance
| Work Item | Specified Freq | MoRTH Freq | Status |
|---------|--------------|-----------|--------|
| Subgrade (density) | {v}/m² | 1/500 m² | {s} |
| WMM (density) | {v}/m² | 1/500 m² | {s} |
| BC (core density) | {v}/m² | 1/500 m² | {s} |
| Concrete cubes | {v}/m³ | 1 set/30 m³ | {s} |

### Flags
{flag_list}
```

---

## MCP Connectors

- **morth-specs-db:** `get_morth_clause("900", "2")` — test frequency requirements
- **bis-standards:** `lookup_is_clause("IS:2062", "T-1")` — steel grade requirements
