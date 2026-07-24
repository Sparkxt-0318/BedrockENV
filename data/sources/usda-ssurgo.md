# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil properties at the map unit level for the continental US, Hawaii, and Puerto Rico.
Properties: texture (sand/silt/clay %), pH, organic matter %, cation exchange capacity (CEC),
saturated hydraulic conductivity (Ksat), drainage class, hydrologic soil group.
Spatial resolution: map unit polygons, typically 1–100 acres each.

## What it doesn't cover
- Soil contamination (SSURGO measures natural soil properties, not pollution)
- Areas not yet surveyed (Urban Land, Water, and Rock Outcrop map units have no chemistry)
- Subsurface contamination plumes
- Post-survey land disturbance (grading, fill, remediation)

## How Bedrock uses it
Runtime API calls to USDA Soil Data Access (SDA) Tabular Service.
SDA accepts an SQL-like query using WKT geometry to intersect the query point with
map unit polygons.

Aggregation: Horizons intersecting the 0–25 cm surface band are averaged (by thickness),
then weighted across soil components by their composition percentage (`comppct_r`).

Client at `lib/data-sources/usda-ssurgo.ts`. Parsing and aggregation helpers at
`lib/data-sources/usda-ssurgo-aggregate.ts`.

Scoring: organic matter, drainage class, clay content, and CEC → soil vulnerability
sub-component. Low organic matter + poor drainage + high clay = higher vulnerability.

## Refresh cadence
SSURGO updates annually (typically released Oct–Nov).
No local bundle; every assessment queries the live SDA API.

## Known limitations
1. **Urban data gap**: Dense urban areas often map to "Urban land" components with
   null chemistry fields. Coverage degrades to 'partial' for these locations.
2. **WKT coordinate order**: SDA requires (longitude, latitude) in WKT — the reverse
   of the common (lat, lng) convention. Swapping them silently returns zero rows.
3. **No contamination data**: SSURGO cannot detect brownfields, lead paint fallout,
   or industrial soil contamination. The soil layer uses EPA Brownfields for that.
4. **Resolution mismatch**: A 1-acre parcel may fall in a 100-acre map unit whose
   properties reflect the dominant soil type, not a contaminated corner.
5. **Timeout risk**: SDA can be slow (~5-15s) under load. The client has a 25s timeout
   with one retry.

## Source
- URL: https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest
- SSURGO docs: https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo
- Format: SQL-over-HTTP, returns JSON+COLUMNNAME
