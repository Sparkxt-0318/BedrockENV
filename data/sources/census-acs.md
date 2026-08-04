# Census Bureau ACS — American Community Survey

## What it covers
5-year estimates of demographic and housing characteristics at census block group, tract, county, and state levels. Bedrock uses:
- **B25034** (Year Structure Built) — percentage of housing units built before 1986 (lead paint risk proxy) and before 1960
- **Tract and block group FIPS codes** — for EJScreen integration and spatial joins
- **Demographics** — median household income, poverty rate, race/ethnicity (used in SCVI/CFCI/redlining intelligence briefs)
- **B19013** — median household income for intelligence brief analysis

## What it doesn't cover
- Military bases and institutional group quarters (low/no civilian housing data)
- Property-level variation within a block group
- Real-time population changes (5-year estimates lag current conditions)

## How Bedrock uses it
Housing vintage (B25034) is the lead risk proxy for water layer scoring: areas with high percentages of pre-1986 housing have more legacy lead plumbing infrastructure. FIPS codes from geocoded coordinates feed spatial lookups in the EJ and intelligence layers.

## Refresh cadence
ACS 5-year estimates are released annually (typically December) with a 2-year lag (e.g., 2022 estimates released in December 2023 cover 2018–2022). Bedrock uses the latest available 5-year estimates.

## Known limitations
- Military bases (Camp Lejeune, Fort Bragg) have no civilian housing data — the lead risk proxy returns null for these areas
- Block group estimates have wide margins of error for small populations
- Housing vintage is a proxy for lead plumbing risk, not a direct measurement; actual lead service line presence requires utility records
- 5-year rolling average smooths out rapid neighborhood change
