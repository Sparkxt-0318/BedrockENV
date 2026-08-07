# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Public water system (PWS) health-based violations, monitoring/reporting violations, and formal enforcement actions. Covers all regulated contaminants under the Safe Drinking Water Act (SDWA): nitrates, arsenic, lead/copper rule, disinfection byproducts, VOCs (TCE, PCE, benzene), radionuclides, microbials, and more (~90 contaminants).

Also provides PWS lookup by county/state FIPS to resolve PWSID for a given address.

**API endpoint**: EPA ECHO SDWIS REST API (`https://echo.epa.gov/rest/services/cwa/...`)

## What it doesn't cover
- Private wells (no federal data source covers private wells)
- PFAS in current monitoring (PFAS MCL violations only enforceable from ~2027; UCMR 5 tracks detections separately)
- Systems that have no violations on record (clean record ≠ no contamination; it may mean no monitoring)
- Historical violations that aged off the system (federal record typically covers 5 years)

## Refresh cadence
EPA SDWIS is updated continuously as violations are reported by states. Bedrock queries it live (not bundled). API availability is critical; degraded SDWIS API = degraded water layer coverage.

**Live API**: `lib/data-sources/epa-sdwis.ts`
**Timeout**: 10 seconds per request; falls back to coverage=`partial` if unavailable.

## Known limitations
1. **Violations aged off**: Systems that had historical violations (e.g., Camp Lejeune, Hoosick Falls) may show zero current violations if they are post-remediation or the violation period ended >5 years ago.
2. **State-reported**: Data quality varies by state's enforcement and reporting rigor.
3. **PWSID resolution**: Requires accurate geocoding + county FIPS to match address to water system. Rural addresses on well water return no SDWIS data.
4. **Military bases**: Installations often run their own water systems under DoD authority, not reported to SDWIS.

## Scoring integration
Layer: Water (25% weight). Sub-component: violation severity score. Formula in `lib/scoring/water-scorer.ts`.
