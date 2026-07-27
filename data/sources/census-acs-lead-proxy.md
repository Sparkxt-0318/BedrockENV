# Census ACS B25034 — Housing Age as Lead Paint Risk Proxy

**Bedrock adapter**: part of water scorer (`lib/scoring/water-scorer.ts`)
**Scoring layer**: Water (lead sub-component)
**API**: US Census Bureau Data API (`https://api.census.gov/data/`)
**Series**: ACS 5-Year Estimates, Table B25034 (Year Structure Built)

## What it covers
- Census tract-level distribution of housing units by decade built
- Key thresholds for lead paint risk:
  - Built before 1940: highest risk (lead paint universal, lead plumbing common)
  - 1940–1959: high risk (lead paint still common)
  - 1960–1977: moderate risk (lead paint phased out; lead solder in plumbing until 1986)
  - Post-1986: minimal lead risk (federal ban on lead plumbing solder effective)
- Bedrock uses pre-1940 and pre-1960 housing share as a proxy for lead pipe/paint prevalence

## What it does NOT cover
- Actual blood lead levels — ACS captures housing age, not contamination measurements
- Lead service lines — the EPA LCRR (Lead and Copper Rule Revisions) mandates service line inventories, but these are not yet aggregated nationally (see EPA's ongoing LCRR rollout)
- Individual property renovations that may have removed lead hazards
- Schools and daycares (use EPA Lead in Schools program data)
- Military housing (Census does not capture most on-base housing)

## Refresh cadence
- ACS 5-year estimates released annually (December); 5-year rolling average
- Bedrock queries Census API live per assessment; no static bundle needed
- Housing stock changes slowly; ACS vintage lag (2019-2023 vs. actual 2024 conditions) is minor for this use case
- Check https://www.census.gov/programs-surveys/acs/news/updates.html for annual release dates

## Known limitations
- **Proxy limitation**: Pre-1940 housing share is a population-level risk indicator, not a property-level test. An individual pre-1940 home may have been fully remediated; a new construction building may still have lead from contaminated water supply pipes upstream
- **Military base gap**: Census ACS does not include most on-base military housing. For addresses on military installations, Census data returns null, driving the Census sub-score to 0. This is a documented gap (Camp Lejeune scores 0 on Census lead proxy despite being a major lead/TCE contamination site)
- **Tract-level resolution**: Census B25034 is at tract level (~4,000 residents). Significant within-tract variation exists in older cities where pre-war and post-war housing coexist block by block
- **Renovation gap**: No federal database tracks lead abatement at the property level. A pre-1940 home that received HUD-funded lead abatement in 2010 looks identical to an unabated pre-1940 home in this data
