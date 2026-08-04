# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Round)

## What it covers
PFAS occurrence data for public drinking-water systems serving ≥25 people across the United States. Covers 29 PFAS analytes including PFOA, PFOS, PFHxS, PFNA, and HFPO-DA (GenX). Reports detection frequencies and concentrations (ppt/ng/L) at the water-system (PWSID) level. Cross-referenced against EPA's final PFAS MCLs (April 2024, 89 FR 32532): PFOA 4 ppt, PFOS 4 ppt, PFHxS 10 ppt, PFNA 10 ppt, HFPO-DA 10 ppt.

## What it doesn't cover
- Tap-level variation within a distribution system
- Private wells (no PWSID)
- Non-PFAS contaminants (VOCs, nitrates, arsenic, lead — those come from SDWIS)
- Systems serving fewer than 25 people
- Historical contamination that predates UCMR 5 testing window (2023–2025)

## How Bedrock uses it
Preprocessed from the quarterly ZIP bundle (UCMR5_All.txt, ~300 MB) into a compact PWSID → analytes lookup at `data/ucmr5-by-pwsid.json`. Bundle contains max concentration per analyte, first/last detection date, and precomputed `exceedsMcl` flag. Lookup is O(1) per assessment; no external API call at runtime. Address must resolve to a PWSID via SDWIS geocoding.

## Refresh cadence
EPA publishes quarterly ZIP bundles at https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule. Latest bundle: January 2026 quarterly release. Rebuild via `pnpm run build:ucmr5` (script: `scripts/build-ucmr5-data.ts`).

## Known limitations
- Water-system resolution only (area-level) — cannot distinguish contamination at one end of a large distribution system from another
- UCMR testing window 2023–2025; some systems tested early and have older data
- ~9,000 systems tested; small systems <10,000 population may not be in the bundle if they completed testing before the latest quarterly cutoff
- PFAS MCL exceedance flags use April 2024 final MCL values — update if EPA revises
