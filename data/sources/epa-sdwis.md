# EPA SDWIS — Safe Drinking Water Information System

**Live API module:** `lib/data-sources/epa-sdwis.ts`
**Used in:** Water layer

## What it covers
- Drinking water violations for all US community water systems (CWSs) and non-transient non-community water systems
- Health-Based Violations (HBVs): Maximum Contaminant Level (MCL) exceedances, Treatment Technique violations
- Monitoring and Reporting (M/R) violations: missed testing, late reports
- Contaminants regulated under the Safe Drinking Water Act: nitrates, arsenic, lead, coliform, trihalomethanes, HAAs, and ~90 others
- Public Water System identifiers (PWSID) — matched from Census PWSID geocoding or SDWIS address lookup
- Violation history: active violations, violations in the past 3 years

## What it doesn't cover
- Private wells (~13% of US households) — not regulated by SDWIS
- PFOA/PFOS and most PFAS — only added as regulated contaminants under April 2024 final rule; violation records are sparse
- State-only violations where states have stricter standards than federal MCLs
- Contaminants below regulatory detection limits but above health advisory levels
- Lead in service lines — SDWIS tracks violations but not individual service-line material inventories
- Small systems (<25 connections) that serve fewer than 25 people year-round

## Refresh cadence
- **Live API** — queried in real time per assessment
- SDWIS is updated by EPA and state primacy agencies on a rolling basis; violations typically appear within 90 days of occurrence
- Monthly: verify SDWIS API endpoint health and authentication requirements
- Source: https://echo.epa.gov/tools/web-services/loading-facility-data#SDWIS

## Known limitations
- PWSID matching fails for ~10% of addresses where Census geocoding returns no PWSID (rural areas served by smaller systems)
- M/R violations are counted equally with HBVs in the raw count — weighting in the water scorer attempts to correct this
- States vary in timeliness of reporting violations to federal SDWIS — some state-administered systems may lag 6–18 months
- Self-supplied industrial customers and irrigation districts are not covered
- PFOA/PFOS MCL enforcement began June 2024 — few violation records exist yet for these newly regulated contaminants
