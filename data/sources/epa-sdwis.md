# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Violation history for all US public water systems (PWS). Includes health-based violations (maximum contaminant level [MCL] exceedances, treatment technique violations), monitoring violations (failure to test), and reporting violations. Bedrock queries: (1) PWSID lookup by county FIPS code, (2) violation history for the resolved PWSID.

## What it doesn't cover
- Private wells
- Historical violations that have been fully resolved and removed from the active database — very old violations (pre-2010) may have aged off
- The specific contaminant concentration at violation time (SDWIS records the violation type, not the measured level)
- Systems that haven't filed a violation report (poor reporting compliance is itself a risk indicator but not tracked in SDWIS)

## Source
EPA Envirofacts REST API: `https://data.epa.gov/efservice/`. Bedrock queries `WATER_SYSTEM` for PWSID by state/county, then `VIOLATION` for violation history. Field names are lowercase in API responses.

## Refresh cadence
Live API — data is updated as EPA processes new reports, typically within 30–90 days of a reporting period. Bedrock caches responses for 30 days.

## Known limitations
- The Envirofacts API is rate-limited and occasionally returns HTTP 503.
- PWSID resolution is county-level, not exact-address-level — rural addresses at county boundaries may resolve to the wrong system.
- Violation counts reflect regulatory compliance failures, not actual contamination levels. A system with zero violations may still have undetected contamination.
- Military base water systems (e.g. Camp Lejeune) may have very few SDWIS records because they operate under different reporting authorities.
