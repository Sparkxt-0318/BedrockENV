# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Round)

## What it covers
PFAS (per- and polyfluoroalkyl substances) detections in public water systems (PWSs) serving ≥25 people. Covers 29 PFAS analytes including PFOA, PFOS, PFNA, PFHxS, PFBS, and HFPO-DA (GenX). Monitoring period: 2023–2025. Released March 2026.

## What it doesn't cover
- Private wells (approximately 43 million Americans)
- Very small water systems (<25 people)
- Non-PFAS contaminants (TCE, PCE, benzene, vinyl chloride, dioxins, lead)
- Systems that didn't sample during 2023–2025 window
- State-regulated contaminants not in the federal 29-analyte panel

## How Bedrock uses it
Bundled as `data/ucmr5-by-pwsid.json` keyed by PWSID. The water scorer reads PFAS detection values and presence flags. A detection above EPA MCL (4 ppt PFOA/PFOS individually, 10 ppt combined) contributes to the water layer score.

## Refresh cadence
One-time dataset; UCMR 6 will begin monitoring 2027–2029 (contaminants TBD). Check EPA UCMR page for supplemental releases or corrections.

## Known limitations
1. **Lag**: UCMR 5 data reflects 2023–2025 sampling — acute contamination events after this window are invisible.
2. **PFAS-only**: The most notorious contamination cases (Camp Lejeune TCE/PCE, East Palestine vinyl chloride, Midland dioxins) are entirely outside scope.
3. **Non-detects**: A non-detect does not mean absence — it means below the reporting limit (varies by analyte). We treat non-detect as score-neutral, not as "clean."
4. **PWSID matching**: ~9% of addresses cannot be matched to a PWSID (rural private wells, unincorporated areas). Coverage shown as "unmapped."

## Source
- EPA UCMR 5 results: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
- MCL rule: EPA PFAS National Primary Drinking Water Regulation (April 2024)
