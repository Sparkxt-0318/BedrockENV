# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Federal and state drinking water violations for community water systems (CWSs) and non-transient non-community water systems (NTNCWSs). Covers health-based violations (maximum contaminant level violations, treatment technique violations) and monitoring/reporting violations. Accessible via the EPA Envirofacts REST API.

## What it doesn't cover
- Private wells
- Transient non-community water systems (e.g., campgrounds, gas stations)
- Violations that have been resolved and aged out of the active database
- Pre-1993 violations (predating federal database standardization)
- Military base water systems, which operate under DoD standards, not EPA

## Refresh cadence
Continuous (updated as violations are filed and resolved). The BedrockENV client queries the API live for each assessment.

## Known limitations
- Historical violations (e.g., Flint 2015–2019 lead crisis) may have aged off the API's active violations endpoint even if the underlying infrastructure risk persists
- Small systems in rural areas have fewer monitoring requirements and may under-report
- A clean SDWIS record for an area served by a private well is meaningless — those wells are unmonitored

## How BedrockENV uses it
`lib/data-sources/epa-sdwis.ts` queries the Envirofacts SDWIS endpoint for health-based violations at the PWSID serving the input address. Violation count and severity feed into the water layer score sub-component.

## Source
EPA SDWIS: https://www.epa.gov/enviro/sdwis-overview
Envirofacts API: https://enviro.epa.gov/enviro/ef_metadata_html.ef_search_form
