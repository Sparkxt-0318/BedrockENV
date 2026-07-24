# EPA Superfund — FRS SEMS (National Priorities List)

## What it covers
Active and formerly active Superfund NPL (National Priorities List) sites as registered
in EPA's Facility Registry Service (FRS), SEMS program filter.
~1,300 currently active NPL sites in the US.

## What it doesn't cover
- Sites under state cleanup programs that are not on the federal NPL
- Proposed NPL sites not yet finalized
- RCRA Corrective Action sites (hazardous waste — separate program)
- State-managed cleanups without federal Superfund designation
- Military base contamination managed under DERP (Defense Environmental Restoration Program)

## How Bedrock uses it
Runtime radius search via FRS REST API, filtering for SEMS program sites within
a configurable radius of the query point.
Client at `lib/data-sources/epa-superfund.ts`.

Scoring: NPL site count and proximity → proximity sub-score.

## Refresh cadence
Live API — FRS data updated continuously as sites are listed, delisted, or remediated.
No local bundle (a static bundle of ~1,300 sites is a known roadmap item).

## Known limitations
1. **Coverage gaps**: Some NPL sites are not discoverable via FRS radius search.
   Known examples: Tar Creek (Picher, OK), Camp Lejeune (NC). Root cause is likely
   how the site boundary is registered vs. a single facility record.
2. **Large-area sites**: Sites covering tens of square miles (mining districts, military
   bases) may be registered at a single centroid point. A query 4 miles away could miss
   the site entirely.
3. **API timeout risk**: FRS radius search occasionally times out, returning empty
   results and degrading proximity coverage.
4. **Static bundle planned**: `docs/ROADMAP.md` tracks a planned static bundle of
   ~1,300 NPL sites with coordinates to supplement the live API. Until shipped,
   some high-profile Superfund sites are systematically missed.

## Source
- URL: https://www.epa.gov/frs/facility-registry-service
- FRS REST: `https://ofmpub.epa.gov/enviro/frs_rest_services.get_facilities`
- Format: REST/JSON
