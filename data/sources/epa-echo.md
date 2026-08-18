# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated industrial and commercial facilities within a search radius:
- Air: Clean Air Act (Title V, SIP, synthetic minor)
- Water: Clean Water Act (NPDES permits, RCRA hazardous waste)
- Drinking water: SDWIS (also captured separately)
- Significant Non-Compliance (SNC) flag — facilities in violation for 2+ quarters

Also provides Toxics Release Inventory (TRI) emitter counts and air/water release
quantities sourced from the annual TRI reporting cycle.

## What it doesn't cover
- Facilities that have been deregistered or closed (unless still in compliance history)
- Small generators below TRI reporting thresholds
- Agricultural operations (exempt from most Clean Water Act NPDES requirements)
- Unpermitted releases

## Refresh cadence
Live API: `https://echodata.epa.gov/echo/echo_rest_services`
Data is updated quarterly by EPA. The API reflects the latest available data.
No local bundle — every assessment queries live.

## Known limitations
- API returns facility counts within radius but does not include facility longitude,
  preventing precise distance calculation. All facilities are reported as "within radius."
- API occasionally returns HTTP 503 (overload) causing soil scores to drop to near-zero.
  This is transient and does not reflect actual contamination. Scores will recover.
- 5-mile radius may miss facilities on the edge of larger industrial zones

## Bedrock usage
Proximity layer primary source. Also contributes TRI emitter count to air and soil
sub-components. Resolution: PROPERTY-LEVEL (within specified radius).
Cache: 24-hour TTL.
