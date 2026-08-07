# EPA UCMR 5 — Unregulated Contaminant Monitoring Rule, 5th Edition

## What it covers
PFAS (per- and polyfluoroalkyl substances) detections in public water systems serving >3,300 people. Covers 29 PFAS compounds including PFOA, PFOS, PFHxS, PFNA, HFPO-DA (GenX), and mixtures. Data is bundled per PWSID (Public Water System ID) for O(1) lookup.

**Compounds measured**: 29 PFAS including PFOA, PFOS, PFHxS, PFNA, PFBS, PFHpA, PFHxA, PFDA, PFUnA, HFPO-DA (GenX), 9Cl-PF3ONS, 11Cl-PF3OUdS, PFMPA, PFMBA, NEtFOSAA, NMeFOSAA, PFECA-G, ADONA, 4:2 FTS, 6:2 FTS, 8:2 FTS.

**Geographic coverage**: ~6,600 PWSs nationwide; systems <3,300 population not required to test (significant rural gap).

## What it doesn't cover
- Private wells (not covered by any federal monitoring)
- VOCs (TCE, PCE, benzene, vinyl chloride) — these are SDWIS MCL-regulated
- Legacy contaminants like lead, arsenic, nitrates (covered by SDWIS routine monitoring)
- Small systems (<3,300 population) — represent a significant rural/small-town gap
- Tribal water systems with sovereignty exemptions
- Historical contamination prior to monitoring period (2023-2025)

## Refresh cadence
One-time collection: data collected 2023–2025, results published by EPA. No routine update cycle. EPA will publish final UCMR 5 results and may issue a 6th round covering additional contaminants.

**Bundled file**: `data/ucmr5-by-pwsid.json` (1.4 MB, keyed by PWSID string)
**Last bundle build**: Check `scripts/build-ucmr5-data.ts` for source URL and build date.
**Rebuild trigger**: When EPA publishes updated UCMR 5 results or UCMR 6 is released.

## Known limitations
1. **Detection ≠ violation**: UCMR 5 data predates EPA's final PFAS MCLs (announced April 2024; enforcement begins ~2027). A detected level is a measurement, not necessarily a violation yet.
2. **PFOA/PFOS MCL is 4 ppt**: Our scoring uses presence/magnitude of detection relative to EPA's final MCL thresholds.
3. **Gap for small systems**: Rural addresses served by systems <3,300 population will show no UCMR 5 data; coverage honesty returns `unmapped` for these.
4. **PWSID lookup depends on geocoding**: Address → census tract → county FIPS → PWSID via SDWIS. Any geocoding failure propagates to water layer.

## Scoring integration
Layer: Water (25% weight). Sub-component: PFAS detection score. Formula in `lib/scoring/water-scorer.ts`.
