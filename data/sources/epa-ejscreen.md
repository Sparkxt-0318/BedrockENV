# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
Census block group-level environmental justice indices combining environmental burden indicators (air toxics cancer risk, diesel PM, lead paint, superfund proximity, wastewater dischargers, traffic proximity, RMP facility proximity) with demographic indicators (low income, minority, limited English proficiency, less than high school education, under 5, over 64, low life expectancy, low linguistic isolation). Produces a combined EJ Index percentile relative to national and state populations.

## What it doesn't cover
- Rural areas with no census block group data
- Property-level variation within a block group
- Temporal trends (single snapshot, updated annually)
- Individual contaminant concentrations (screening tool only)

## How Bedrock uses it
Queried via EPA EJScreen REST API by census block group FIPS. Returns percentile scores for environmental and demographic indices. Used in the EJ layer. **Currently non-functional without API credentials** — all addresses return EJ score = 0 until EJScreen API access is configured.

## Refresh cadence
EPA publishes updated EJScreen data annually, typically in the fall. The underlying Census ACS data it uses updates annually (5-year estimates).

## Known limitations
**Layer currently unavailable**: EJ layer returns 0 for all addresses. This causes South LA (90002), Port Arthur TX, Flint MI, and other high-EJ-burden areas to be underscored by 15–25 points relative to their true burden. Implementing the EJ layer is the highest-priority scoring improvement.

EJScreen uses relative percentiles (compared to national or state populations), not absolute thresholds — a location with moderate environmental burden but high demographic vulnerability can score as high as an area with extreme environmental burden but low demographic vulnerability.
