# /environmental-social — Environmental & Social Review

> **DISCLAIMER:** Review draft for professional verification only.

## Applicable Regulations

| Regulation / Code | Subject |
|-------------------|---------|
| EIA Notification 2006 (amended) | Mandatory EIA for NH ≥ 100 km or 4-lane widening |
| Wildlife Protection Act, 1972 | Protected area clearances |
| Forest Conservation Act, 1980 | Forest land diversion |
| National Rehabilitation & Resettlement Policy, 2007 | R&R entitlements |
| Right to Fair Compensation Act (RFCTLARR), 2013 | Land acquisition |
| Coastal Regulation Zone Notification, 2019 | CRZ provisions |
| PARIVESH Portal | Environmental clearance submission |
| MoEFCC OM Dated 2022 | Compensatory Afforestation norms |

---

## EXTRACT

**Environmental Clearance Status:**
- EC status (Applied / Granted / Not required)
- PARIVESH application number
- EC conditions listed
- Environmental Management Plan (EMP) provided: yes/no
- Wildlife clearance (if applicable): yes/no, WL status

**Forest Land:**
- Forest area affected (ha)
- Forest type (Reserved Forest, Protected Forest, Deemed Forest)
- Forest Diversion Application status (Stage I / II / Pending)
- Compensatory Afforestation (CA) plan provided
- Net Present Value (NPV) calculation

**Biodiversity:**
- Eco-sensitive zones (ESZ) within 10 km: yes/no
- Wildlife corridors identified: yes/no
- Migratory route — identified and mitigation proposed
- Flora and fauna survey included

**Social / R&R:**
- Total land acquisition (ha)
- Number of affected families (PAFs)
- Structures affected
- Social Impact Assessment (SIA) done: yes/no
- R&R plan provided with entitlement matrix: yes/no
- Resettlement sites identified: yes/no

**Pollution Mitigation:**
- Air quality baseline study
- Noise baseline and mitigation (noise barriers, plantation)
- Dust suppression during construction
- Waste management plan

---

## IDENTIFY

### EIA Applicability (EIA Notification 2006, Schedule — Category A)

| Project Type | EC Required | Authority |
|-------------|------------|-----------|
| New NH > 100 km | Yes | MoEFCC (Central) |
| NH 4-laning ≥ 100 km | Yes | MoEFCC (Central) |
| NH 4-laning < 100 km | SEIAA | State |
| Expressway (new) | Yes | MoEFCC (Central) |

### Forest Clearance Checklist (Forest Conservation Act, 1980)

- Stage I approval: In-principle approval before land acquisition
- Stage II approval: Before construction begins
- CA land ratio: 1:2 (non-forest land) or 1:1 (equal degraded forest)
- NPV: As per MoEFCC circular (INR 4.38–10.43 lakh/ha based on forest type)

### R&R Entitlement Matrix (RFCTLARR, 2013)

| Category | Minimum Entitlement |
|----------|---------------------|
| Landowner | 2× market value (rural), 1× (urban) + solatium |
| Tenant / sharecropper | 25% of rehabilitation package |
| Non-title-holder (squatter) | One-time financial assistance |
| Affected structure | Replacement value + shifting allowance |
| Livelihood affected | INR 5,000/month × 12 months (2024 base) |

---

## COMPARE

1. EC required and status confirmed per project length/type
2. EMP provided with section-wise mitigation measures
3. Forest area measured and FC Act application filed before land acquisition
4. CA plan with identified land at minimum 1:2 ratio
5. SIA done for projects displacing > 100 families
6. R&R plan includes all entitlement categories
7. ESZ clearance from National Board for Wildlife (NBWL) if corridor affected
8. Noise assessment at sensitive receptors (schools, hospitals, villages)

---

## FLAG

```
FLAG ES-{nn}
Severity: CRITICAL | MAJOR | MINOR | OBSERVATION
Item: {description}
Found: {condition}
Required: {regulation / norm}
Recommendation: {action}
```

### Flag Triggers

| Condition | Severity |
|-----------|---------|
| EC not obtained / not applied for EC-mandatory project | CRITICAL |
| Forest land being used without FC Act approval | CRITICAL |
| Wildlife clearance not obtained for ESZ projects | CRITICAL |
| SIA not done for > 100 displaced families | CRITICAL |
| R&R plan missing entitlement matrix | MAJOR |
| CA plan does not meet 1:2 ratio | MAJOR |
| NPV calculation incorrect | MAJOR |
| EC conditions not addressed in EMP | MAJOR |
| Noise barrier not proposed at sensitive receptors | MAJOR |
| No waste management plan for construction phase | MINOR |
| Flora/fauna survey not included | MINOR |
| PARIVESH application number not quoted | MINOR |

---

## REPORT

```markdown
## Environmental & Social Review

**EIA Required:** {yes/no} | **EC Status:** {status}
**Forest Area:** {ha} ha | **FC Status:** {status}
**PAFs:** {n} families | **R&R Plan:** {yes/no}

### Clearance Status Matrix
| Clearance | Required | Status | Date | Conditions Addressed |
|----------|---------|--------|------|---------------------|
| Environmental Clearance | {y/n} | {s} | {d} | {c} |
| Forest Clearance (Stage I) | {y/n} | {s} | {d} | {c} |
| Forest Clearance (Stage II) | {y/n} | {s} | {d} | {c} |
| Wildlife Clearance | {y/n} | {s} | {d} | {c} |
| CRZ Clearance | {y/n} | {s} | {d} | {c} |

### R&R Summary
| Category | Count | Entitlement Provided | Status |
|---------|-------|---------------------|--------|
| Land owners | {n} | {e} | {s} |
| Non-title holders | {n} | {e} | {s} |
| Affected structures | {n} | {e} | {s} |

### Flags
{flag_list}
```

---

## MCP Connectors

- **parivesh:** `get_ec_status(application_id)`, `get_ec_conditions(ec_number)`
- **google-drive / sharepoint:** `get_document("EMP")`, `get_document("R&R Plan")`
