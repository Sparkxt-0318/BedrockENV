# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule, 5th Edition

## What it covers
PFAS (per- and polyfluoroalkyl substances) occurrence in public drinking-water systems.
Covers 29 PFAS analytes measured at ~10,000 public water systems (PWSs) serving ≥3,300
people. Includes maximum concentrations per analyte (ppt), detection dates, and a
precomputed `exceedsMcl` flag against EPA's April 2024 final MCLs (PFOA/PFOS: 4 ppt;
PFHxS/PFNA/HFPO-DA: 10 ppt).

Data is bundled at build time as `data/ucmr5-by-pwsid.json` (PWSID → analytes lookup).

## What it does NOT cover
- Private wells (UCMR only covers community and non-transient non-community PWSs)
- Very small systems (<3,300 people) — these were exempt from UCMR 5
- Non-PFAS contaminants (VOCs, nitrates, arsenic, radionuclides, etc.)
- Post-2026 detections (bundle must be manually rebuilt)
- Surface water not tied to a PWSID

## Refresh cadence
EPA publishes quarterly ZIP bundles. Current bundle: **January 2026 release**.
Rebuild script: `scripts/build-ucmr5-data.ts`. Rebuild quarterly when EPA releases
updated occurrence data at:
https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule

Check `data/ucmr5-by-pwsid.json` → `.epaReleaseDate` field to determine staleness.
Warning threshold: one full quarter after last release.

## Known limitations
- Area-level resolution (water system, not tap-level). A 100,000-connection system
  is treated as a single data point.
- Detection lag: EPA sampling was 2023–2025; post-cleanup improvements won't appear
  until the next round of mandatory monitoring.
- PWSID resolution depends on SDWIS lookup — addresses not matched to a PWSID get
  no UCMR data.
- PFAS detected below MCL are still flagged as detections and affect scoring.

## Layer assignment
Water layer — primary PFAS signal.
