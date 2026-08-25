# EPA EJScreen — Environmental Justice Screening and Mapping Tool

## What it covers
Census block-group level environmental and demographic indicators for the entire US. Provides 13 environmental indicators (PM2.5, ozone, traffic proximity, lead paint, Superfund proximity, RMP proximity, wastewater discharge, underground storage tanks, hazardous waste proximity, demographic index) and 6 supplemental demographic indicators (low income, minority, linguistic isolation, less than HS education, under 5, over 64).

## What it doesn't cover
- Individual parcel-level data (block-group aggregation)
- Real-time conditions (annual update cycle)
- PFAS / drinking water contamination (covered by SDWIS/UCMR 5 separately)

## API
EJScreen API: `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx`
Parameters: lat/lon or FIPS code, return: all indicators as JSON.

## Refresh cadence
Annual (typically updated each fall). Current: EJScreen 2023. Check: https://www.epa.gov/ejscreen/download-ejscreen-data

## Known limitations
- Block-group aggregation (~1,500 residents average) can miss highly localized hotspots
- Environmental indicators are proximity-based, not measured exposure
- Demographic Index (DI) methodology updated in 2021 — scores not comparable to pre-2021
- API availability has been inconsistent (EPA server load; Bedrock currently returns EJ score of 0 for all addresses when API is down)

## Current status in Bedrock
**Partially functional** — EJ layer returns 0 for all addresses because EJScreen API requires registration and is rate-limited. The EJ layer weight (15%) is absorbed by proportional re-weighting when unavailable. See `lib/data-sources/epa-ejscreen.ts` and `docs/ROADMAP.md` (In Progress).

## Bedrock usage
Environmental Justice layer. See `lib/data-sources/epa-ejscreen.ts`.
