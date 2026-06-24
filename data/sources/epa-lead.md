# Census ACS B25034 — Housing Age as Lead Risk Proxy

## What it covers
- American Community Survey table B25034: housing units by year structure was built
- Used to estimate lead paint and lead pipe exposure risk
- Two key thresholds extracted: % of housing units built before 1986 (post-CPSC ban) and before 1950 (highest risk, widespread lead paint)
- Block-group level granularity (highest available resolution for housing stock data)

## What it doesn't cover
- Actual lead contamination — this is a structural proxy, not a measurement
- Service line material (lead pipes vs. copper) — the Lead and Copper Rule Revisions (2021) require utilities to inventory service lines, but that inventory is not yet in a queryable federal dataset
- Renovation and remediation history — pre-1986 housing that has been fully remediated is still counted
- Rental vs. owner-occupied distinction — renters in old buildings have higher exposure risk but the same raw score

## Refresh cadence
- ACS 5-year estimates released annually (October); current data: 2019–2023 5-year estimates
- Census API endpoint: `https://api.census.gov/data/{year}/acs/acs5`
- Bedrock queries live at assessment time

## Known limitations
- Proxy nature: high pre-1986 housing does not guarantee lead exposure; low pre-1986 housing does not guarantee safety
- Census geography may straddle multiple neighborhoods — block group boundaries don't align perfectly with address context
- ACS estimates carry margin of error; small block groups have higher uncertainty
- Lead exposure pathways beyond plumbing (soil lead, peeling paint) are not captured by this data
- Does not capture utility-wide lead service line replacement programs that may have reduced risk in some areas
