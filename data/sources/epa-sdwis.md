# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Public water system (PWS) inventory and regulatory compliance records under the Safe Drinking Water Act. Covers all ~150,000 active PWSs in the US. Includes health-based violations (maximum contaminant level exceedances), monitoring & reporting violations, and treatment technique violations. Provides service area geography for PWSID-to-address mapping.

## What it doesn't cover
- Private wells (not regulated under SDWA)
- Historical violations that have been resolved and aged off (typically removed after 5 years)
- Water quality between the treatment plant and the tap (distribution system lead is tracked separately via LCR compliance, which we partially capture via ACS pre-1986 housing proxy)
- Small systems (community water systems serving <25 people)

## Refresh cadence
EPA updates SDWIS quarterly via ENVIROFACTS. Bedrock queries SDWIS at assessment time via the EPA Envirofacts REST API.

## Known limitations
- **Violation aging**: Resolved violations are removed from the public SDWIS dataset after ~5 years. This means Flint, MI's 2015–2019 lead crisis violations may no longer appear — understating known-contaminated cities.
- **Geocoding gaps**: ~8% of PWSs lack accurate latitude/longitude in SDWIS. These systems cannot be matched to a property address reliably.
- **Multi-system overlap**: Urban addresses may be served by multiple overlapping PWSs (e.g., a city system plus a county system). We use the closest PWSID match.
- **API timeouts**: EPA Envirofacts REST can be slow; timeouts degrade water layer coverage.

## Scoring use
Water layer sub-component. Health-based violations (MCL exceedances) weighted 3× monitoring violations. Violation count normalized against national 95th percentile. Recent violations (within 3 years) weighted 1.5× older violations.
