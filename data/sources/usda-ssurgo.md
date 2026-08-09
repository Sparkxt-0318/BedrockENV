# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil survey data via the USDA Soil Data Access (SDA) Tabular web service. Soil properties (texture, pH, organic matter, CEC, saturated hydraulic conductivity, drainage class) for the soil map unit at a given lat/lng point. Aggregates across map unit components and surface horizons (0–25 cm band, the residential-exposure-relevant zone).

## What it doesn't cover
- Actual contamination (SSURGO measures natural soil properties, not pollutant concentrations)
- Urban fill or made-land (mapped as miscellaneous areas with no chemistry; filtered out)
- Sub-surface conditions below 25 cm for residential exposure assessment
- Point-level variation within a map unit (typically 1–100 acres)

## How it works
Live SQL-like query to the USDA SDA Tabular web service:
`https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest`
Uses `SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(lon lat)')` to resolve the map unit. **WKT order is (lon, lat) — swapping them silently returns zero rows.**
Default timeout: 25 s with retries.

Implementation note: The fetching logic lives in `lib/data-sources/usda-ssurgo.ts`; the SDA query, row type, and response parser live in `usda-ssurgo-types.ts`; and the aggregation/classification logic lives in `usda-ssurgo-aggregator.ts`.

## Refresh cadence
Live API calls on every request. SSURGO is updated annually by USDA NRCS. Intended cache: 90 days (not yet implemented in the module).

## Known limitations
- Map unit resolution is typically 1–100 acres — a single-family lot may straddle multiple map units; only the unit at the centroid point is queried
- Urban-land, rock outcrop, water, and miscellaneous area components carry no chemistry and are silently filtered
- `coverage: 'partial'` indicates the intersection was found but no component had usable chemistry (common in dense urban areas)
- `coverage: 'unmapped'` indicates the location is not in the SSURGO survey (some tribal lands, territories)
- SDA can be slow (15–25 s) and occasionally unavailable during USDA maintenance windows
- Reflects pedogenic (natural) soil properties — does not capture industrial contamination layered on top
