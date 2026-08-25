# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule 5

## What it covers
PFAS detections in public water systems (PWS) serving ≥3,300 people in the 5th monitoring cycle (2023–2025). Reports concentrations for 29 PFAS compounds plus lithium at the PWSID level. This is the most comprehensive PFAS surveillance dataset available for drinking water.

## What it doesn't cover
- Private wells (~13% of US households)
- Systems serving <3,300 people unless selected via statistical sampling
- Non-PFAS contaminants (use SDWIS for those)
- Future regulatory status (MCLs for PFOA/PFOS were finalized April 2024 at 4 ppt each)

## Bundled file
`data/ucmr5-by-pwsid.json` — keyed by PWSID, values are detection objects with compound, concentration (ppt), and detection flag.

## Refresh cadence
EPA publishes UCMR 5 data quarterly during the monitoring period (2023–2025). Final dataset expected late 2025. Check: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

## Known limitations
- Represents a point-in-time sample, not continuous monitoring
- Non-detects reported as <MRL (method reporting level), not zero
- Lab method variation can affect comparability across utilities
- Small systems (<3,300 population) are sampled probabilistically, not exhaustively

## Bedrock usage
Water layer PFAS sub-score. Matched to address via PWSID resolution through SDWIS (see `lib/data-sources/epa-ucmr5.ts`).
