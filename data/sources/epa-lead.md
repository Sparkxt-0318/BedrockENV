# Lead Risk — Census Housing Age Proxy (ACS B25034)

## What it covers
Estimated probability of lead plumbing (service lines and solder) in a census block group, derived from American Community Survey Table B25034 (Year Structure Built):
- Pre-1950 housing: high probability of lead service lines (LSL)
- Pre-1986 housing: lead solder was commonly used in interior plumbing
- Post-1986: Safe Drinking Water Act amendments banned lead solder

Returns: fraction of housing units built before 1950, before 1986, and total housing units for the block group.

## What it doesn't cover
- Actual lead water testing results (use SDWIS for violations; no comprehensive testing database exists)
- Lead paint (separate from lead plumbing — though correlated with housing age)
- Commercial/industrial properties (ACS housing units only)
- Recent service line replacement programs that may have removed LSLs

## How we use it
Census ACS API (`https://api.census.gov/data/2022/acs/acs5`) queried by census tract + block group FIPS for the B25034 table. Used in the Water layer as a lead-risk sub-score — a neighborhood with 60%+ pre-1950 housing receives a significant lead-plumbing risk flag.

This is a proxy, not a direct measurement. It identifies where lead plumbing is likely based on age, not where it has been tested and confirmed.

## Refresh cadence
ACS 5-year estimates are updated annually (current version: 2018–2022 estimates). The Census API endpoint used here is pinned to the `2022` vintage; update the year in the source code when new estimates are released.

## Known limitations
- **Proxy only** — housing age correlates with lead risk but is not a direct test.
- Block-group resolution: high pre-1950 housing percentage at the block-group level doesn't mean every unit has lead plumbing.
- Service line replacement programs are not reflected — a neighborhood with 70% pre-1950 housing may have had LSLs replaced.
- The ACS estimate itself has a margin of error, especially for small block groups.
- Requires Census API availability at assessment time — no local bundle.
