# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Round)

## What it covers
PFAS (per- and polyfluoroalkyl substances) detections in public water systems serving ≥3,300 people. Covers 29 PFAS compounds including PFOA, PFOS, PFBS, PFHxS, PFNA, HFPO-DA (GenX), and the PFAS mixture sum (PFAS6). Each public water system (PWSID) receives paired measurements: detection level (ppt) and whether it exceeded the EPA health advisory of 10 ppt.

## What it doesn't cover
- Private wells and small water systems (<3,300 customers)
- Other contaminants (TCE, PCE, lead, nitrates, arsenic) — those are in SDWIS
- Groundwater not connected to a public system
- Bottled water
- Non-PFAS emerging contaminants (e.g., 1,4-dioxane, hexavalent chromium)

## How Bedrock uses it
Bundled as `data/ucmr5-by-pwsid.json` (keyed by PWSID). Looked up by PWSID after geocoding resolves the address to a water system. PFAS detection contributes to the water layer score via `fetchUcmr5PfasData` in `lib/data-sources/epa-ucmr5.ts`.

## Refresh cadence
UCMR 5 sampling ran 2023–2025. EPA released results in batches; final dataset published March 2026. Next round (UCMR 6) expected ~2027–2028. This bundle should be rebuilt annually or when EPA releases new batches.

## Known limitations
- Coverage: only ~6,000 large and medium water systems (of ~50,000 total community systems)
- Small systems and private wells are a major gap — rural addresses often have no UCMR 5 data
- Detections reflect sampling moments, not continuous monitoring
- PFAS6 sum may undercount total PFAS burden if other compounds are present

## Source
EPA UCMR 5: https://www.epa.gov/dwucmr/fifth-unregulated-contaminant-monitoring-rule
