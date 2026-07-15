# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated industrial facilities within a search radius of a query point. Data includes facility name, location, regulated programs (Clean Air Act, Clean Water Act, RCRA hazardous waste, TRI toxic releases), compliance status (significant non-compliance [SNC] = active violation), and enforcement actions. Bedrock uses a two-step flow: (1) `get_facilities` → QueryID, (2) `get_qid` → paginated rows. Filters on up to 25 nearest facilities within 3 miles.

## What it doesn't cover
- Facilities that have closed and been removed from the ECHO database
- Small facilities below EPA reporting thresholds (e.g. TRI threshold is 10,000 lb/year for most chemicals)
- Agricultural operations (not regulated under ECHO programs)
- Underground storage tanks (LUST — tracked separately by state programs)

## Source
EPA ECHO REST API: `https://echodata.epa.gov/echo/echo_rest_services`. Bedrock uses the `get_facilities` and `get_qid` endpoints.

## Refresh cadence
Live API. ECHO data is updated quarterly as facilities submit reports and EPA enters inspection/enforcement data. Bedrock caches for 7 days.

## Known limitations
- ECHO does not return longitude in facility rows — Bedrock cannot compute precise distance from query point. Distance is reported as approximate (within the 3-mile radius filter).
- API is prone to timeouts under load. Bedrock applies a 10-second timeout and treats errors as `{ facilities: [], error }`.
- SNC status reflects a point-in-time compliance snapshot; a facility may have resolved a violation before the status was updated.
- The 25-facility limit may miss the 26th-closest significant violator.
