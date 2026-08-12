# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
Block-group-level environmental justice screening indicators combining environmental burden (air toxics, proximity to hazardous sites, water quality) with demographic factors (people of color percentage, low income, linguistic isolation, less than high school education, population under 5, population over 64). Used by the EJ layer (15% weight) of the composite scorer.

## What it doesn't cover
- **Not a raw data source** — EJScreen is an index derived from many of the same sources Bedrock accesses directly (TRI, RCRA, Superfund proximity). It is a synthesis tool, not a primary measurement.
- **Block-group resolution only** — Census block groups average 1,500 people; fine-grained within-neighborhood variation is not captured.
- **No water quality contamination directly** — EJScreen water proximity indicator is proximity to monitored water systems, not contamination levels.

## Refresh cadence
EPA releases updated EJScreen data annually, typically in the fall. The EJScreen API requires registration and an API key (`EJSCREEN_API_KEY`).

## Known limitations
- **Currently non-functional** — EJ layer returns 0 for all addresses because external API access (EJScreen API key) is not configured. This is the #1 scoring gap: all 9 canonical test addresses are missing 15% of their potential score.
- **Re-weighting when unavailable**: When EJ data is absent, the composite scorer re-weights the remaining 4 layers proportionally (water/air/proximity/soil now sum to 100%). This is the correct fallback but understates scores for urban/disadvantaged areas.
- **EJScreen is screening-level only** — EPA explicitly states EJScreen is for screening, not regulatory decision-making.

## Source
EPA EJScreen: https://www.epa.gov/ejscreen  
Implementation: `lib/data-sources/epa-ejscreen.ts`
