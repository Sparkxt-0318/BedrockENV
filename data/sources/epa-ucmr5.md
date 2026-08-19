# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (Round 5)

## What it covers
PFAS (per- and polyfluoroalkyl substances) occurrence in public drinking-water systems serving ≥25 people. Contains maximum concentrations per analyte in ppt (ng/L), detection dates, and whether each system exceeded EPA's April 2024 final MCLs (89 FR 32532).

**Analytes tracked**: PFOA, PFOS, PFHxS, PFNA, HFPO-DA (GenX), PFBS, PFHpA, PFDA, PFUnA, and PFBA.

**MCLs (April 2024)**:
- PFOA: 4 ppt
- PFOS: 4 ppt
- PFHxS, PFNA, HFPO-DA: 10 ppt each

## What it does NOT cover
- VOCs (TCE, PCE, benzene, vinyl chloride) — covered by earlier UCMR rounds or state programs
- Nitrates, arsenic, lead — covered by standard SDWIS monitoring
- Private wells — only community water systems ≥25 people are monitored
- Military installations with their own treatment systems
- Systems serving fewer than 25 people (rely on state data)

## Refresh cadence
EPA publishes quarterly ZIP bundles at `https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule`. The local bundle at `data/ucmr5-by-pwsid.json` was last rebuilt from the **January 2026** quarterly release. Rebuild quarterly by running `pnpm ts-node scripts/build-ucmr5-data.ts` after downloading the latest `UCMR5_All.txt`.

## How we use it
The bundle is a PWSID → analyte lookup, resolved by matching a geocoded address to the serving water system via SDWIS PWSID lookup. We report max concentrations per analyte and flag MCL exceedances. The water scorer uses PFAS presence and MCL exceedance as sub-components.

## Known limitations
- **Area-level resolution**: Scores reflect the serving water system, not tap-level measurements. Individual taps may differ (treatment, pipe materials).
- **Point-in-time**: Detections reflect monitoring during UCMR 5 sampling windows (2023–2025). Contamination may have changed.
- **PWSID matching gap**: Rural addresses outside served PWSID boundaries return no match. We fall back to county-level SDWIS data in this case.
- **Historical contamination**: Sites remediated before 2023 may not show PFAS detections even if soil/groundwater contamination persists.
