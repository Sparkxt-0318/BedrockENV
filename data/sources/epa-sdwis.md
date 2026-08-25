# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Federal database of all ~150,000 public water systems (PWS) in the US. Contains PWSID, system name, service area, population served, system type (community, transient, non-transient), violation history (health-based and monitoring/reporting), enforcement actions, and facility details.

## What it doesn't cover
- Private wells
- Unregulated contaminants (use UCMR 5 for PFAS)
- Real-time water quality readings (episodic reporting only)
- Point-of-use treatment effectiveness

## API
EPA Envirofacts REST API: `https://data.epa.gov/efservice/`
Endpoints used: `SDWA_PUB_WATER_SYSTEMS`, `SDWA_VIOLATIONS_ENFORCEMENT`, `SDWA_FACILITIES`

## Refresh cadence
Continuous (violations reported as received). Bedrock queries live at assessment time — no bundled snapshot. Recommend local PWSID boundary cache to reduce API calls.

## Known limitations
- Violation data quality varies by state primacy agency; some states lag reporting by 3–12 months
- Small system violations often go unreported due to limited state inspection capacity
- "Health-based violations" (the metric Bedrock uses) excludes monitoring/reporting violations, which are a leading indicator of systemic compliance failure
- No spatial geometry — system service areas must be inferred from PWSID centroid or Census place

## Bedrock usage
Water layer violation sub-score and PWSID resolution for address geocoding. See `lib/data-sources/epa-sdwis.ts`.
