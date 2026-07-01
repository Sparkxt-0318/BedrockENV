# EPA ECHO — Enforcement and Compliance History Online

**Live API module:** `lib/data-sources/epa-echo.ts`, `lib/data-sources/epa-tri.ts`
**Used in:** Proximity layer, CPI sub-score of SCVI

## What it covers
- All EPA-regulated facilities within a configurable radius of the target address
- Clean Air Act (CAA), Clean Water Act (CWA), and RCRA-regulated facilities
- Significant Non-Compliance (SNC) status — facilities with serious or unresolved violations
- TRI (Toxics Release Inventory) reporters: facility-level air, water, and land releases by chemical
- Facility coordinates, permit type, compliance status, and inspection history
- Queried via ECHO's facility search API: https://echo.epa.gov/tools/web-services/facility-search

## What it doesn't cover
- Facilities below TRI reporting thresholds (generally 10,000–25,000 lbs manufactured/processed)
- Agricultural operations (generally exempt from ECHO/TRI)
- Smaller facilities regulated only at state level, not federally
- Facilities that closed before the ECHO reporting period — historical contamination from closed sites is not reflected unless a Superfund record exists
- Air toxics not on the TRI chemical list

## Refresh cadence
- **Live API** — queried in real time per assessment; data reflects current ECHO database
- ECHO is updated by EPA daily for compliance status; TRI data is updated annually (prior-year data released each October)
- Monthly: check ECHO API changelog for endpoint deprecations or schema changes
- Source: https://echo.epa.gov/

## Known limitations
- TRI data lags by ~1.5 years — 2024 calendar year releases are reported in October 2025
- SNC flags can persist after a facility comes into compliance during the review cycle
- Facility coordinates are self-reported and may be off by hundreds of meters in some cases
- ECHO radius search returns up to 100 facilities — very industrial areas may be truncated at this cap
- State-only regulated facilities are not in ECHO — coverage varies significantly by state
