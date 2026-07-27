# EPA Brownfields — Assessment, Cleanup, and Redevelopment Programs

**Bedrock adapter**: `lib/data-sources/epa-brownfields.ts`
**Scoring layer**: Soil
**API**: `https://www.epa.gov/brownfields` (EPA GeoPlatform REST endpoint)

## What it covers
- Properties assessed or cleaned under EPA Brownfields grants
- Assessment status (Phase I/II environmental site assessments completed)
- Cleanup status and funding amounts
- Reuse type (residential, commercial, green space, mixed)
- ~22,000+ brownfield sites across the US

## What it does NOT cover
- Sites that have NOT received federal brownfield funding (the majority of contaminated commercial properties)
- RCRA corrective action sites (see ECHO for RCRA facilities)
- State-only brownfield programs (many states run parallel programs outside EPA's federal database)
- Superfund NPL sites (see FRS/SEMS)

## Refresh cadence
- EPA updates the Brownfields Assessment, Cleanup, and Redevelopment Map quarterly
- Bedrock makes live API calls per assessment; no static bundle
- **Known instability**: EPA Brownfields API has returned HTTP 503 errors across all Bedrock test runs since at least 2026-04-17. When 503 occurs, soil sub-score falls to SSURGO + FEMA + NASA POWER only (brownfields contribution = 0)

## Known limitations
- **503 instability is the primary risk**: Soil scores are systematically depressed when this API is unavailable. Port Arthur TX dropped from 58 to 44, Newark NJ from 56 to 29, South LA from 52 to 27 — all due to Brownfields 503
- **Federal-only**: Only EPA grant-funded assessments appear. A contaminated former gas station that was remediated without federal involvement is invisible
- **Coverage gap**: Brownfields database covers areas that received federal investment — these correlate with post-industrial urban areas. Rural contaminated properties are underrepresented
- **Proximity radius**: Bedrock queries by lat/lng radius (default 1 mile). Sites immediately adjacent but outside the radius are not counted
- **Recommended fix**: Cache Brownfields data per county on first successful fetch; fall back to cache on 503 rather than returning empty. (See PENDING_DECISIONS.md for prioritization context)
