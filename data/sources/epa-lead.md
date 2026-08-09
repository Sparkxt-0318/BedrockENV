# EPA Lead Risk Proxy — Census ACS Housing Age (B25034)

## What it covers
Lead plumbing risk assessment derived from U.S. Census ACS housing-age data at the census block-group level. Returns: percentage of housing units built pre-1950 (high lead service line probability), percentage built pre-1986 (lead solder era), and a risk tier: `HIGH` (>30% pre-1950), `ELEVATED` (>50% pre-1986), `MODERATE` (>25% pre-1986), or `LOW`.

ACS Table B25034 fields used: B25034_001E (total), B25034_007E through B25034_011E (1970s through 1939-or-earlier vintages).

## What it doesn't cover
- Actual service line material (requires LCRR inventory data from utilities — not publicly available at address level)
- Post-1950 buildings that were renovated with pre-1986 materials
- Buildings that have undergone lead abatement
- Block groups with zero housing units (returns error)

## How it works
Live U.S. Census Bureau ACS 5-Year Estimates API (2022 vintage):
`https://api.census.gov/data/2022/acs/acs5?get={fields}&for=block%20group:{bg}&in=state:{state}%20county:{county}%20tract:{tract}&key={CENSUS_API_KEY}`
`CENSUS_API_KEY` env var is optional. Default timeout: 15 s with retries.

## Refresh cadence
Live API calls on every request. ACS data updates annually. The module is hardcoded to the 2022 ACS 5-year vintage — will not auto-advance to newer vintages. Intended cache: 90 days (not yet implemented in this module).

## Known limitations
- Requires all four Census geography components (state, county, tract, block group) — addresses geocoded only to city/ZIP will fail with a descriptive error
- Hardcoded to 2022 ACS vintage; will become increasingly stale over time
- Housing age is a proxy for lead risk — does not account for pipe replacement programs, renovations, or actual service line surveys (LCRR inventory)
- ACS negative estimates (suppressed data) are coerced to 0 — could underestimate risk in high-suppression areas
- Block groups with zero total housing units return an error, not zero risk
