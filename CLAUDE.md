# IAHE DPR Reviewer — Practice Profile

> **DISCLAIMER:** All review outputs are drafts for professional verification only.
> Claude flags potential non-compliance; licensed Professional Engineers make all design decisions.

---

## Cold-Start Interview

Run `/dpr-master` to begin a guided practice profile interview, or fill this file manually.

---

## Project Identity

```yaml
project_name: ""                     # e.g., "4-Laning of NH-48 Km 120–180"
client: ""                           # e.g., "NHAI", "MoRTH", "PWD Karnataka"
corridor: ""                         # e.g., "Delhi–Mumbai Expressway Package 7"
states: []                           # e.g., ["Rajasthan", "Gujarat"]
length_km: 0                         # Total project length in km
dpr_ref: ""                          # DPR reference / revision number
consultant: ""                       # DPR preparation consultant name
review_date: ""                      # ISO date: YYYY-MM-DD
```

---

## Road Classification

```yaml
road_type: ""          # NH | SH | MDR | ODR | Village Road
configuration: ""      # 2-lane | 4-lane divided | 6-lane divided | Expressway
terrain: ""            # Plain | Rolling | Mountainous | Steep
execution_mode: ""     # EPC | HAM | BOT | Item Rate
access_control: ""     # Full | Partial | None
```

---

## Design Standards

```yaml
design_speed_kmph: 0          # e.g., 100 for 4-lane NH plain terrain
irc_edition_year: 2024        # IRC code edition year to apply
morth_edition: "5th Rev."     # MoRTH Specifications edition
nhai_circular_cutoff: ""      # Include NHAI circulars up to this date (YYYY-MM-DD)
is_edition_year: 2024         # IS/BIS edition year

# Applicable code overrides (leave blank to use defaults)
irc_38_edition: ""            # Horizontal Curves
irc_52_edition: ""            # Sight Distance
irc_37_edition: ""            # Flexible Pavement
irc_58_edition: ""            # Rigid Pavement
irc_sp84_edition: ""          # 4-Lane Highway Specifications
```

---

## Survey & Geotechnical Data

```yaml
survey_agency: ""             # Surveying agency name
survey_datum: "MSL"           # Datum: MSL | Local Benchmark
bore_log_spacing_m: 0         # e.g., 500
subgrade_cbr_min: 0           # Minimum CBR value reported
seismic_zone: ""              # II | III | IV | V
```

---

## Review Preferences

```yaml
strictness_level: "standard"  # strict | standard | advisory
output_format: "markdown"     # markdown | docx | xlsx
drawing_review_mode: "auto"   # auto | manual | skip
flag_min_severity: "minor"    # critical | major | minor | observation
cross_volume_check: true      # Run consistency checks across DPR volumes
connector_mode: "live"        # live | fallback | offline
```

---

## Active Skills

Skills activated for this project (edit to enable/disable):

```yaml
skills:
  dpr-master: true
  geometric-design: true
  pavement-design: true
  bridge-design: true
  hydrology-drainage: true
  traffic-engineering: true
  road-safety: true
  geotechnical: true
  environmental-social: true
  cost-estimation: true
  quality-assurance: true
  drawing-reviewer: true
  survey-alignment: true
  project-monitoring: true
```

---

## Quick-Start Commands

| Command | Purpose |
|---------|---------|
| `/dpr-master` | Full DPR orchestration — delegates to all active skills |
| `/geometric-design` | Review alignment, curves, cross-sections |
| `/pavement-design` | Review flexible/rigid pavement design |
| `/bridge-design` | Review bridge GADs and structural design |
| `/hydrology-drainage` | Review flood estimation and CD works |
| `/traffic-engineering` | Review traffic surveys and capacity analysis |
| `/road-safety` | Desk-stage safety audit |
| `/geotechnical` | Review bore logs, soil, and slope stability |
| `/environmental-social` | Review EIA and R&R compliance |
| `/cost-estimation` | Review BOQ and rate analysis |
| `/quality-assurance` | Review QC plan and material specs |
| `/drawing-reviewer` | Extract and validate drawing dimensions |
| `/survey-alignment` | Review RoW, utility shifting, topographic surveys |
| `/project-monitoring` | Track milestones and pre-submission checklist |

---

## MCP Connector Status

```yaml
connectors:
  irc_digital_library: "configure"    # Set IRC_API_KEY in .env
  morth_specs_db: "configure"         # Set MORTH_API_KEY in .env
  bis_standards: "configure"          # Set BIS_API_KEY in .env
  nhai_circulars: "configure"         # Set NHAI_API_KEY in .env
  google_drive: "configure"           # Set GOOGLE_OAUTH credentials
  sharepoint: "configure"             # Set SHAREPOINT credentials
  autodesk_docs: "configure"          # Set AUTODESK_CLIENT credentials
  imd_rainfall: "configure"           # Set IMD_API_KEY in .env
  parivesh: "configure"               # Set PARIVESH credentials
```

See `.mcp.json` for connector configuration and `mcp/` for server code.

---

## Output Files

Reviews are saved to:

```yaml
output_dir: "./reviews/"              # Default output directory
memo_prefix: "DPR-REVIEW"            # Prefix for memo filenames
archive_reviews: true                 # Keep all review versions
```

---

*Profile last updated: (auto-filled on save)*
*IAHE DPR Reviewer v1.0 | Apache License 2.0*
