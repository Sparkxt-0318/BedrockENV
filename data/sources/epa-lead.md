# Census ACS B25034 — Lead Service Line Risk Proxy

## What it covers
Housing age distribution at the census block group level from the American Community Survey (ACS) Table B25034 (Year Structure Built). Bedrock uses pre-1950 housing stock as a high-risk indicator for lead service lines and lead paint, and pre-1986 stock for lead solder risk (the Safe Drinking Water Act banned lead solder in 1986).

Outputs a risk tier (HIGH / MEDIUM / LOW) and estimated lead-risk fraction based on the share of housing units built before 1950 and before 1986 in the block group.

## What it doesn't cover
- Actual lead service line inventory — no national database exists. Some cities publish LSL inventories; this source is a proxy where inventory data is unavailable.
- Lead paint (a distinct exposure pathway, but correlated with housing age)
- Post-1986 homes with imported fixtures containing lead
- Water systems that have replaced lead service lines in older areas

## Refresh cadence
ACS 5-year estimates are released annually (typically December) with a 2-year lag. Bedrock caches ACS responses for **90 days** per census tract.

## Known limitations
- Housing age is a block-group-level aggregate — a specific parcel could be a 2010 teardown-rebuild in a neighborhood of 1920s homes, or vice versa.
- The Census API field `B25034_011E` (1939 or earlier) and `B25034_010E` (1940–1949) are the two oldest cohorts. A high fraction of these reliably predicts LSL risk in cities that relied on lead infrastructure. In cities that replaced infrastructure (e.g., Chicago after 2021), the proxy overstates current risk.
- Some census tracts have suppressed data for small populations (returns -666666666 or similar). The client treats these as null/unavailable.
