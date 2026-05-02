# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Edition)

## What it covers
PFAS occurrence in public drinking-water systems serving ≥3,300 people (~70% of the US population). Reports detection of PFOA, PFOS, PFHxS, PFNA, HFPO-DA (GenX), and four PFAS mixtures in finished drinking water, alongside the final MCLs (4 ppt for PFOA/PFOS, 10 ppt for others, effective April 2024).

Bedrock uses a preprocessed PWSID-keyed bundle (`data/ucmr5-by-pwsid.json`) built from EPA's full UCMR5_All.txt (~300 MB, ~1.9 M rows). The bundle stores max concentrations, first/last detection dates, and a precomputed `exceedsMcl` flag per analyte.

## What it doesn't cover
- Systems serving <3,300 people (~30% of US, mostly rural)
- Private wells (zero coverage)
- Bottled water
- Tribal water systems (some participate, not all)
- Post-distribution point contamination (pipes, building plumbing)
- Non-PFAS contaminants

## Refresh cadence
EPA publishes UCMR 5 results quarterly (monitoring window 2023–2025). The current bundle reflects the **January 2026 release**. Next expected release: Q2 2026. Rebuild script: `scripts/build-ucmr5-data.ts`.

The code warns after one full release cycle without an update (see `epa-ucmr5.ts` staleness check).

## Known limitations
- Coverage is at the **water system level**, not the tap. A detected exceedance means somewhere in the distribution system, not necessarily at the query address.
- UCMR 5 only required monitoring for a single 12-month window. A one-time non-detect does not guarantee clean water going forward.
- PWS boundary resolution via SDWIS lookup (county + state → PWSID) can misassign addresses near county borders or where multiple systems overlap.
- The bundle does not cover the UCMR 3/4 rounds (different analytes, older data). Historical PFAS contamination going back to the 1980s is captured by WQP ambient monitoring, not here.
