# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Round)

## What it covers
- PFAS occurrence data for public water systems (PWS) across the US
- 29 PFAS analytes including PFOA, PFOS, PFHxS, PFNA, HFPO-DA (GenX), and 10 PFAS mixtures
- System-level detection data: analyte, result, detection limit, collection date
- Covers ~70,000 PWSs that serve ≥25 people; mandatory reporting 2023–2025

## What it doesn't cover
- Private wells (not subject to UCMR; approximately 15M households)
- Small systems serving <25 people
- PFAS not on the 29-analyte monitoring list (hundreds of other PFAS compounds)
- Distribution network variation — data is collected at entry points, not taps
- Historical contamination before the 2023 monitoring window

## Refresh cadence
- EPA publishes quarterly data releases (Q1–Q4 each monitoring year)
- Monitoring window: January 2023 – December 2025
- Bundle at `/data/ucmr5-by-pwsid.json` should be rebuilt quarterly from EPA's official UCMR 5 download
- EPA release URL: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

## Known limitations
- PWSID matching requires geocoding accuracy — addresses in rural areas may resolve to the wrong water system
- Some PWS have multiple PWSID entries across states; lookup may miss secondary PWS identifiers
- Detection below MRL (minimum reporting level) is reported as non-detect; actual sub-MRL levels may be nonzero
- MCL for PFOA/PFOS set at 4 ppt (April 2024); scoring uses this threshold but rule compliance deadline is April 2026
- GenX and PFAS mixtures have separate MCLs (10 ppt and hazard index); current scoring uses a single PFOA/PFOS threshold for simplicity
