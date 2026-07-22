# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Edition)

## What it covers
PFAS occurrence in public drinking-water systems (community water systems and non-transient non-community systems serving >3,300 people). UCMR 5 required monitoring for 29 PFAS compounds and lithium from 2021–2023. Results include maximum concentration detected per analyte per system, detection dates, and system metadata (name, state, size category).

Bedrock bundles this as `data/ucmr5-by-pwsid.json` — a compact PWSID → analyte lookup built by `scripts/build-ucmr5-data.ts`. Each entry stores max concentration, first/last detection date, and a precomputed `exceedsMcl` flag against EPA's 2024 final PFAS MCLs (PFOA/PFOS: 4 ppt, PFHxS/PFNA/HFPO-DA: 10 ppt).

## What it doesn't cover
- **Systems serving <3,300 people** — small systems and private wells are not monitored.
- **Non-PFAS contaminants** — TCE, PCE, benzene, lead, nitrates, etc. are not in UCMR 5.
- **Individual taps** — data is at the water-system level, not point-of-use.
- **Groundwater not connected to a PWS** — agricultural wells, private wells.
- **Systems that detected nothing** — absence of detection doesn't mean absence of contamination; it means the system was monitored and the analyte was below the reporting level.
- **Post-2023 detections** — UCMR 5 monitoring window closed; new contamination won't appear here.

## Refresh cadence
EPA publishes quarterly data bundles as ZIP files. The Bedrock bundle was last rebuilt from the **January 2026** quarterly release. Rebuild quarterly by running `pnpm tsx scripts/build-ucmr5-data.ts` against the latest ZIP from:  
https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

UCMR 6 monitoring (2027–2031) will cover different analytes — watch for rulemaking.

## Known limitations
1. **System-level resolution only.** A PFAS detection in a water system doesn't mean the specific address receives contaminated water (distribution system mixing, treatment may vary).
2. **No spatial coordinates** — PWSID is resolved via SDWIS (county-to-PWSID lookup), not geocoding. Systems that serve multiple counties may be misattributed.
3. **Reporting level ≠ safe level.** Non-detects are below the method reporting level (MRL), which varies by analyte (0.5–2.0 ppt). Some PFAS may be present below MRL.
4. **UCMR 5 doesn't cover all PFAS.** Only 29 of the ~12,000 known PFAS compounds were monitored.
