# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
EPA's EJScreen provides block-group-level environmental justice indices for the entire US. It combines environmental indicators (air toxics cancer risk, PM2.5, ozone, diesel PM, traffic proximity, lead paint indicators, RMP proximity, Superfund proximity, wastewater discharges, underground storage tanks) with demographic indicators (percent minority, percent low income, linguistic isolation, percent under 5, percent over 64) into composite EJ Index percentiles. These percentiles rank each block group nationally.

## What it doesn't cover
- Rural block groups with sparse population (EJScreen still covers them but percentiles may be uninformative)
- Individual-level data (block-group aggregate only)
- Tribal lands (separate data)

## How Bedrock uses it
Queried live by lat/lon in `lib/data-sources/epa-ejscreen.ts`. Returns the EJ Index percentile and demographic indicators for the block group containing the address. Used in the EJ layer scorer.

**Current status**: EJScreen API access is not configured in the current deployment. The EJ layer returns 0 for all addresses. See ROADMAP.md "In Progress."

## Refresh cadence
EJScreen is updated annually (typically Q4). Version 2.3 reflects 2021 ACS data. Check for updates at the source URL.

## Known limitations
- Block-group level granularity (not property-specific)
- API access may require registration or key
- High percentile rankings in EJScreen reflect relative national burden, not absolute health risk thresholds
- Environmental indicators in EJScreen use modeled estimates (e.g., air toxics are from RSEI), not direct measurements

## Source
EPA EJScreen: https://www.epa.gov/ejscreen
EJScreen API: https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx
