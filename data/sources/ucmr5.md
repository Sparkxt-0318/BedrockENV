# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Round)

## What it covers
PFAS (per- and polyfluoroalkyl substances) detections in public drinking-water systems (PWSs) serving ≥25 people. Covers 29 PFAS analytes including PFOA, PFOS, PFNA, PFHxS, PFBS, and HFPO-DA (GenX). Data includes max concentrations per analyte (in ppt), detection dates, and exceedance flags against EPA April 2024 MCLs (PFOA/PFOS: 4 ppt; PFHxS/PFNA/HFPO-DA: 10 ppt). Approximately 66,000 PWSs sampled.

## What it doesn't cover
- **No VOCs** — TCE, PCE, benzene, vinyl chloride are outside UCMR 5 scope.
- **No heavy metals** — lead, arsenic, nitrate are not UCMR 5 analytes (covered by SDWIS).
- **No private wells** — only regulated public water systems with ≥25 customers.
- **No surface water monitoring** — covers tap water, not ambient rivers/lakes (see WQP).
- **Sampling window**: systems were required to sample between 2023–2025. Post-remediation sites may show reduced or zero PFAS even if historically contaminated.
- **No real-time updates** — data is locked at the quarterly bundle rebuild date.

## Refresh cadence
EPA publishes UCMR 5 results quarterly. The repo bundle (`data/ucmr5-by-pwsid.json`) must be rebuilt from the latest EPA ZIP release via `scripts/build-ucmr5-data.ts`. Last rebuild: January 2026. Next expected release: April 2026.

## Known limitations
- PWSID resolution depends on SDWIS `lookupWaterSystem` — if the geocoder can't match a county to a PWSID, UCMR 5 data is unavailable.
- Abandoned towns or areas served by private wells receive no score from this source.
- The bundle only captures the most recent sampling cycle. Older detection history (UCMR 3/4) is not included.
- A "not detected" result does not prove absence — detection limits vary by lab and analyte.

## Source
EPA UCMR 5 Occurrence Data: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule  
Build script: `scripts/build-ucmr5-data.ts`  
Bundle path: `data/ucmr5-by-pwsid.json`
