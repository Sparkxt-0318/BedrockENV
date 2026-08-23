# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Regulatory compliance records for all ~153,000 regulated public water systems (PWS) in the United States. Tracks:
- Health-based Maximum Contaminant Level (MCL) violations
- Treatment technique violations
- Monitoring and reporting violations
- System name, service population, ownership type

## What it doesn't cover
- Private wells (exempt from SDWIS)
- Unregulated contaminants not yet assigned an MCL (e.g. most PFAS before 2024)
- Violations that were resolved without formal SDWIS entry
- Groundwater contamination not tied to a PWS

## How we use it
Two queries per assessment:
1. `lookupWaterSystem` — resolves (state FIPS, county FIPS) → PWSID for the address
2. `fetchSdwisViolations` — pulls violation history for the identified PWSID

Both query the EPA Envirofacts REST API (`https://data.epa.gov/efservice/`). Field names are case-insensitive; our adapter normalizes them.

## Refresh cadence
Live API — data is current as of EPA's most recent upload (typically weekly). No local bundle; all queries hit the live endpoint at assessment time.

## Known limitations
- Area-level resolution: PWSID maps to the whole water system, not a specific address.
- Rural unincorporated addresses may not resolve to a PWSID if they use private wells or a very small system not in SDWIS.
- A violation resolved in the same reporting year may still appear as "active" due to EPA data lag.
- Monitoring/reporting violations (not health-based) are counted separately; callers should distinguish violation categories.
