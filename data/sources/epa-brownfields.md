# EPA Brownfields — Brownfield Sites Database

## What it covers
Brownfield sites — properties where expansion or redevelopment is complicated by the presence or potential presence of hazardous substance, pollutant, or contaminant. Includes site location, assessment status, and cleanup progress. Sourced from EPA's Brownfields Assessment, Cleanup, and Redevelopment data.

## What it doesn't cover
- Sites not enrolled in the EPA Brownfields program (state-only brownfields)
- Active Superfund NPL sites (those are in FRS/SEMS)
- Private cleanup agreements not registered with EPA
- Industrial properties with no formal brownfields designation

## How Bedrock uses it
Queried via EPA Brownfields REST API with radius search (2 miles) around the assessment coordinates. Returns brownfield sites with name, distance, and status. Used in the soil layer sub-scorer.

## Refresh cadence
Live API. Updated as sites complete assessment or cleanup phases.

## Known limitations
**Frequent API outages**: EPA Brownfields API has returned HTTP 503 errors across multiple scoring cycles (documented in IMPROVEMENT_LOG.md). When the API is unavailable, the brownfields sub-component scores as 0 (near-miss) which can undercount soil layer risk by 10–30 points for industrial areas. This is a known issue causing Port Arthur TX, Newark NJ, South LA (90002), and other urban industrial sites to score below their expected range during API outage periods.

Only covers federally designated brownfields; many contaminated industrial sites that have not been through EPA's brownfields process are invisible to this source.
