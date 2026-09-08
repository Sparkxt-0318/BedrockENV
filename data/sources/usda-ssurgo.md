# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil physical and chemical properties at the query point: texture (sand/silt/clay %), pH, organic matter content, cation exchange capacity (CEC), saturated hydraulic conductivity (Ksat), drainage class, and hydrologic soil group. Queried via the USDA Soil Data Access (SDA) Tabular web service. Used in the Soil layer.

## What it does NOT cover
- Anthropogenic contamination (lead, PCBs, dioxins in soil)
- Soil data in areas with "Miscellaneous Area" designations (rock outcrops, water bodies, urban land without soil surveys)
- Subsurface contamination below the 25 cm surface horizon analyzed by Bedrock
- Soil contamination from illegal dumping or historical fill

## Resolution
Neighborhood-level — soil map unit (typically 1–100 acres). One map unit value applies to an entire neighborhood area, not a single parcel.

## Refresh cadence
SSURGO updates on an annual release cycle (typically June). The client queries live via the SDA REST endpoint; no local bundle. SDA queries use SQL syntax routed via POST to `SDMDataAccess.sc.egov.usda.gov`. Cache TTL: 90 days.

## Known limitations
1. Urban areas often have "Urban land" or "Made land" components with null chemistry values — these are legitimately unmapped from a soil-science perspective. The client skips them but cannot score what's under them.
2. **WKT coordinate order is (longitude, latitude) in SDA queries.** Swapping them silently returns zero rows. This is a documented gotcha maintained as a comment in the source code.
3. SSURGO data in rapidly developing urban areas may be decades old and not reflect fill, grading, or imported soil.
4. The SDA service is sometimes slow to respond (>10s) for point queries with many components; the client has retry logic but may time out under load.
5. No contamination layer — SSURGO measures natural soil characteristics, not industrial contamination. A site can have excellent SSURGO chemistry and still be heavily contaminated with legacy industrial pollutants.

## Authoritative source
https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo — SDA API: https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest
