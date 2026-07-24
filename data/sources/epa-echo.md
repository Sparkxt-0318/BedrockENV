# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities under major environmental statutes: Clean Air Act (CAA), Clean
Water Act (CWA), Resource Conservation and Recovery Act (RCRA), Safe Drinking Water
Act (SDWA), Toxic Release Inventory (TRI).

Data includes: facility location, regulatory programs, compliance status, significant
non-compliance (SNC) flag, and violation/enforcement history.

## What it doesn't cover
- Facilities regulated solely at the state level without federal program overlap
- Facilities that have closed and been removed from the registry
- Underground Storage Tanks (UST) — tracked separately in LUST database
- Agricultural operations below reporting thresholds

## How Bedrock uses it
Runtime radius search: returns regulated facilities within a configurable radius of
the query point (default: 5 miles for soil layer, 10 miles for proximity layer).

Used in two layers:
- **Soil layer** (`echoFacilities`): ECHO data including TRI flag; industrial land use proxy
- **Proximity layer** (`echoFacilities`): same data reused; SNC count drives proximity score
- **Air layer** (`triEmitters`): TRI-flagged facilities count as air emission proxy

Client at `lib/data-sources/epa-echo.ts`.

Scoring: total facility count + SNC count + TRI count → proximity and soil sub-scores.

## Refresh cadence
Live API — ECHO data is updated quarterly (ICIS/FRS backend).
No local bundle.

## Known limitations
1. **API timeouts**: ECHO GIS radius search can time out under load, returning empty
   results and degrading soil/proximity coverage to 'partial'.
2. **Closed facilities**: ECHO may retain records for facilities that have closed, slightly
   inflating industrial density counts.
3. **Threshold gap**: Small facilities below TRI reporting thresholds (25,000 lbs/year
   for manufacturing) are not in ECHO.
4. **SNC classification lag**: Significant non-compliance status can take 3-12 months
   to reflect in ECHO after a violation is documented.

## Source
- URL: https://echo.epa.gov/tools/web-services
- Radius search: `https://echodata.epa.gov/echo/dfr_rest_services.get_facilities`
- Format: REST/JSON
