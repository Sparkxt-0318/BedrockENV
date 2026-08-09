# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities within a 3-mile radius — name, registry ID, latitude, program affiliations (CWA, RCRA, CAA, SDWIS, AIR, TRI), compliance status, and Significant Non-Compliance (SNC) flag. Aggregate counts: total facilities in radius, total SNC facilities, and per-facility list (up to 25 facilities).

## What it doesn't cover
- Inactive/closed facilities (`FacActiveFlag = N` excluded)
- More than 25 facilities per query (dense industrial areas are truncated)
- Longitude of individual facilities — the paginated detail endpoint does not return longitude; all facilities report `longitude: 0` and `distance: 0`
- Off-site releases or downstream impacts

## How it works
Two-step live API calls to `https://echodata.epa.gov/echo/echo_rest_services`:
1. `get_facilities` — returns a QueryID and aggregate counts
2. `get_qid` — returns facility detail rows (page 1, 25 records)
Default timeout: 4 s.

## Refresh cadence
Live API calls on every request. ECHO data is updated as EPA receives compliance reports; frequency varies by program.

## Known limitations
- 4 s timeout is aggressive; ECHO API can be slow, especially for dense areas
- If step 2 fails, step 1 summary data is still returned but with an empty facility list
- 25-facility cap per query; areas with dense industrial activity will be truncated
- Longitude is unavailable for individual facilities (API limitation)
