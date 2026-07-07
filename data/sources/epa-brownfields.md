# EPA Brownfields

## What it covers
EPA's Brownfields Program tracks contaminated properties where redevelopment is complicated by actual or suspected contamination. The database includes: assessment sites (where contamination is being evaluated), cleanup sites (where remediation is underway), and revolving loan fund sites. Properties include former gas stations, dry cleaners, industrial sites, and manufacturing facilities. Each record includes coordinates, site name, status, and contaminant types where known.

## What it doesn't cover
- Superfund (NPL) sites — those are in FRS/SEMS
- RCRA hazardous waste sites
- Brownfields not yet enrolled in the EPA program (many contaminated properties are not in this database)
- Properties where contamination has been fully remediated and delisted

## How Bedrock uses it
Live radius query against the EPA Brownfields API in `lib/data-sources/epa-brownfields.ts`. Site count and proximity contribute to the soil layer score.

## Refresh cadence
Live API — updated as EPA processes new Brownfields applications and completions.

## Known limitations
- **Frequent HTTP 503 errors**: The EPA Brownfields API is one of the least reliable sources in the pipeline. During outages, Bedrock falls back to graceful degradation (partial coverage), but soil scores may be artificially deflated. Multiple cycles of address assessment have observed 503s across all tested addresses simultaneously.
- Only a fraction of contaminated properties are in the Brownfields program
- Coverage is biased toward larger cities with active EPA Brownfields grants

## Source
EPA Brownfields: https://www.epa.gov/brownfields
EPA Brownfields Assessment, Cleanup, and Reuse Data: https://www.epa.gov/brownfields/brownfields-data-and-information
