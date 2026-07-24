# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule (5th Cycle)

## What it covers
PFAS occurrence data for ~6,000 public water systems (PWS) that serve >3,300 people.
Covers 29 PFAS analytes including PFOA, PFOS, PFBS, GenX, and mixtures.
Testing period: 2023–2025 (phased by system size).

## What it doesn't cover
- Private wells (~43 million people in the US rely on them)
- Small water systems (<3,300 people)
- VOCs (TCE, PCE, benzene, vinyl chloride) — covered by earlier UCMR cycles
- Historical contamination prior to 2023 sampling window
- Military base water systems (NAVFAC, not in civilian SDWIS)

## How Bedrock uses it
Bundled at `data/ucmr5-by-pwsid.json`. Runtime client at `lib/data-sources/epa-ucmr5.ts`.
Lookup is by PWSID (public water system ID), resolved via SDWIS geocoding from the
queried address.

Scoring: PFAS total ppt → water sub-score component. MCL exceedance (≥4 ppt PFOA/PFOS)
triggers HIGH risk classification.

## Refresh cadence
EPA releases UCMR 5 data quarterly (~90 days). Final dataset expected 2026.
The runtime client logs a warning when the committed bundle is >100 days old.
To refresh: see `data/README.md` → UCMR 5 section.

## Known limitations
1. **PWSID resolution failures**: ~5% of addresses cannot be matched to a PWSID
   (rural areas, unserved parcels, military bases). Score falls back to partial coverage.
2. **Aggregation**: UCMR 5 samples multiple collection points per system.
   The bundle uses the maximum detection across all samples — conservative but appropriate
   for exposure risk assessment.
3. **Detection limits vary by lab**: Sub-ppb measurements below method detection limits
   (MDL) are reported as "ND" and excluded.

## Source
- URL: https://www.epa.gov/dwucmr/occurrence-data-unregulated-contaminant-monitoring-rule
- Last confirmed available: April 2026
- Format: ZIP containing pipe-delimited TXT (~300 MB, ~1.9 M rows)
