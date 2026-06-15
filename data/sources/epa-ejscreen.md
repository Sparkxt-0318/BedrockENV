# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
National percentile ranks (0–100) for environmental and demographic indicators at the census block group level. Used for the EJ (Environmental Justice) layer of the composite score.

**Runtime module:** `lib/data-sources/epa-ejscreen.ts`  
**API:** EPA EJScreen REST Broker  
`https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx`

## Environmental indicators (national percentile ranks)
- PM2.5 air concentration
- Ozone concentration
- Diesel particulate matter (air)
- Air toxics cancer risk (RSEI-based)
- Respiratory hazard index
- Traffic proximity
- Lead paint indicator (pre-1960 housing)
- Superfund proximity
- RMP (Risk Management Program) facility proximity
- Hazardous waste proximity
- Underground storage tanks (UST) proximity
- Wastewater discharge indicator

## Demographic indicators
- Percent low-income
- Percent people of color
- Percent with less than high school education
- Percent linguistic isolation
- Percent under 5 years old
- Percent over 64 years old

## What it doesn't cover
- PFAS contamination specifically (though lead paint and Superfund proximity are included)
- Property-level data — EJScreen is block-group level (~1,000–2,000 people per block group)
- Historical EJ burden (only current conditions)
- Rural areas with sparse monitoring (percentile ranks are national; a rural county at the 50th percentile may still have poor air quality relative to what residents experience)

## Refresh cadence
EPA releases a new EJScreen version annually (typically spring). The API returns the current version's data. No local bundle needed — live API.

**Current version:** EJScreen 2.3 (2024 release using 2022 ACS demographic data)

## Known limitations
- **Currently non-functional in scoring engine**: EJScreen API requires either a registered API key or has rate-limiting behavior that causes timeouts at scale. EJ scores return 0 for all addresses as of current deployment. This is the highest-priority API integration to complete.
- **API reliability**: Response times of 5–10 seconds are common. The runtime client uses a generous timeout but the EJ layer frequently comes back as null.
- **Percentile basis**: National percentile rank means a block group at the 95th percentile nationally is in the top 5% worst areas in the US — which is useful for context but can understate severity in already-burdened regions.
- **Block group boundary effects**: A property near a block group boundary may get very different scores depending on which side it falls on. The EJScreen API snaps to the block group that contains the lat/lng point.
- **Version mismatch**: ACS demographic data in EJScreen lags 2 years behind current census estimates.

## Scoring integration
EJScreen feeds the EJ sub-score (15% weight in the composite). The `ejIndex` (overall EJ index percentile) and `peopleOfColor` + `lowIncome` percentiles are used. EJ scores above the 80th national percentile trigger an environmental justice flag in the recommendations engine.
