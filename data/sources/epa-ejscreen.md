# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
EJScreen combines environmental and demographic data to identify communities
that may be overburdened by pollution and face higher vulnerability. Key indicators:
- **Environmental indicators**: PM2.5, ozone, diesel PM, air toxics cancer risk,
  traffic proximity, lead paint, Superfund proximity, RMP proximity, hazardous
  waste proximity, underground storage tanks, wastewater discharge
- **Demographic indicators**: Low income, minority population, less than high
  school education, linguistic isolation, individuals under 5, over 64
- **Supplemental**: Unemployment, housing burden, population served by PWS below
  poverty level

EJScreen assigns percentile ranks at state and national levels.

## What it doesn't cover
- Individual parcel-level assessment (block group resolution only)
- PFAS-specific contamination (uses broader air toxics cancer risk)
- Historical contamination no longer reflected in current monitoring data
- Groundwater contamination not captured in surface-level indicators

## How Bedrock uses it
`lib/data-sources/epa-ejscreen.ts` queries the EJScreen REST API
(`https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx`) using Census block
group coordinates resolved from the address. Returns the supplemental index
(EJI) as the primary EJ score sub-component.

**Status**: EJ layer returns 0 for all addresses without an EJScreen API key.
Register at https://www.epa.gov/ejscreen/access-ejscreen-application.

## Refresh cadence
EPA releases updated EJScreen data annually, typically in late fall. The 2024
release (EJScreen 2.3) incorporated updated ACS 5-year estimates and 2022 TRI data.

## Known limitations
- **API key required**: EJScreen's programmatic API requires registration.
  Without a key, all EJ scores fall back to 0, significantly undercounting
  cumulative burden in disadvantaged communities.
- **Block group resolution**: EJScreen data is at the Census block group level
  (~1,500 people). A single block group may contain both industrial and residential
  land uses, creating averaging artifacts.
- **No PFAS indicator**: Despite PFAS being one of the most significant current
  EJ issues, EJScreen does not include PFAS exposure as a standalone indicator.
  UCMR 5 detections are not yet integrated into EJScreen.
- **Percentile meaning**: National percentile 80 means 80% of US block groups
  score lower. It does not indicate a regulatory threshold or health risk level.
