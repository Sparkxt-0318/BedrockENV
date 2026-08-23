# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Edition)

## What it covers
PFAS (per- and polyfluoroalkyl substances) occurrence in public drinking-water systems across the United States. The UCMR 5 cycle required ~6,900 systems (serving >3,300 people) to monitor for 29 PFAS compounds between 2023 and 2025.

Analytes tracked: PFOA, PFOS, PFHxS, PFNA, HFPO-DA (GenX), PFBS, and 23 additional compounds.

MCLs used (EPA final rule, April 2024 — 89 FR 32532):
- PFOA: 4 ppt
- PFOS: 4 ppt
- PFHxS, PFNA, HFPO-DA: 10 ppt each

## What it doesn't cover
- Private wells (not regulated public water systems)
- Small community systems serving <3,300 people
- Contamination not covered in the 29-analyte panel
- Real-time measurements — this is a snapshot of a monitoring period

## How we use it
Pre-processed into `data/ucmr5-by-pwsid.json` (PWSID → max concentration per analyte, detection dates, `exceedsMcl` flag). Looked up at scoring time by resolving an address to its PWSID via SDWIS. No network call at assessment time — all data is bundled at build time.

## Refresh cadence
EPA publishes quarterly ZIP bundles at https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule. Rebuilt via `scripts/build-ucmr5-data.ts`. Last bundle: Q4 2025 (January 2026 release). Next expected: Q1 2026 (April 2026).

## Known limitations
- Area-level resolution (water system, not tap). Two neighbors on the same block can share a PWSID even if one uses a private well.
- UCMR 5 only covers ~30% of US community water systems by count (the large ones). Smaller systems are absent.
- MCLs are new (2024). Historical detections that predate the rule are in the data but context differs.
- Data collection ended in 2025; ongoing contamination events after that date are not reflected until the next UCMR cycle.
