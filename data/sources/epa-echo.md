# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities under Clean Air Act, Clean Water Act, RCRA (hazardous waste), and Safe Drinking Water Act. Includes TRI (Toxics Release Inventory) reporters. Provides facility location, SIC/NAICS codes, compliance status (Significant Non-Compliance = SNC), and inspection history.

## What it doesn't cover
- Unregulated or unpermitted releases
- State-only regulated facilities in some states
- Historic sites that have been delisted
- Diffuse/non-point sources (agriculture runoff, stormwater)

## Refresh cadence
EPA updates ECHO quarterly. Bedrock queries the ECHO Effluent Charts REST API at assessment time using a 5-mile radius search around the target coordinates.

## Known limitations
- **API timeouts**: ECHO radius search times out ~15% of requests under load (503/504). When this occurs, proximity layer degrades to partial coverage.
- **Radius search accuracy**: Facilities near the search boundary may be included or excluded depending on EPA's internal geocoding vs. our coordinate.
- **SNC definition changes**: EPA periodically revises what constitutes Significant Non-Compliance, which can shift facility counts without an actual change in compliance.
- **TRI threshold**: TRI reporting only required above chemical-specific thresholds (typically 10,000 lbs manufactured/processed or 25,000 lbs used). Smaller releases are invisible.

## Scoring use
Proximity layer. SNC facilities weighted 2× non-SNC. TRI facilities weighted 1.5×. Raw facility count within 5 miles normalized against 99th-percentile density (urban industrial corridor baseline).
