# EPA Lead — Lead Service Line / Lead Exposure Data

## What it covers
Lead exposure risk indicators aggregated from: (1) EPA's lead service line replacement program data (where available), (2) Census ACS housing age as a proxy for lead paint risk (pre-1978 housing at highest risk, pre-1986 housing at elevated risk), and (3) EPA's Envirofacts lead data from SDWIS (lead exceedances in water systems).

In Bedrock's water scorer, "lead risk" is computed from the Census ACS B25034 table (housing year structure built) as a proxy for lead paint and lead pipe probability.

## What it doesn't cover
- Individual property lead testing results — there is no federal database of residential lead tests
- Lead service lines at the parcel level — the EPA lead service line inventory is still being compiled under the Lead and Copper Rule Revisions
- Airborne lead from smelters, firing ranges, or industrial sources (tracked via TRI and nonattainment)
- Soil lead from legacy gasoline or paint (would require site-specific testing)

## Source
- Census ACS B25034 via Census Bureau Data API (see `census-acs.md`)
- SDWIS lead violations via EPA Envirofacts (see `epa-sdwis.md`)
- EPA lead data: `lib/data-sources/epa-lead.ts`

## Refresh cadence
Census ACS housing data updates annually. SDWIS violations update in near-real-time as EPA processes them.

## Known limitations
- The Census housing-age proxy is imprecise. Pre-1986 housing may have been fully abated; newer housing may have imported fixtures with lead. It's a population-level screening proxy.
- Lead service lines are a major source of drinking water lead (as seen in Flint), but the EPA lead service line inventory (per LCRR) is incomplete as of 2026 and not yet available as an API.
- Bedrock's lead score currently relies heavily on housing age because more precise data sources are not nationally available via API.
