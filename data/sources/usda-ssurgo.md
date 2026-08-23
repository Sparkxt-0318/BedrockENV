# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil properties at the map-unit level for the contiguous United States, Hawaii, and Puerto Rico. Properties relevant to contamination exposure:
- Texture (% sand, silt, clay) — affects contaminant mobility and bioavailability
- pH — affects metal solubility and organic compound persistence
- Organic matter — sorption capacity for organic contaminants
- Cation exchange capacity (CEC) — metal retention indicator
- Saturated hydraulic conductivity (Ksat) — leaching potential
- Drainage class — wet soils mobilize different contaminants than dry

## What it doesn't cover
- Actual contamination measurements (SSURGO is background soil properties)
- Urban-land areas (classified as "Miscellaneous area" — no chemistry)
- Rock outcrops, water bodies, and other non-soil units
- Subsurface contamination below the sampled horizon depth

## How we use it
USDA Soil Data Access (SDA) Tabular web service queried via SQL-like interface. Spatial resolution is at the map unit level (~1:24,000 scale). We query a 0–25 cm surface band (most relevant for residential exposure) and aggregate across soil components weighted by their percent composition in the map unit.

**Critical API note:** WKT coordinate order is (lon, lat) — swapping them silently returns zero rows (no error). The query joins `mapunit → component → chorizon` using `SDA_Get_Mukey_from_intersection_with_WktWgs84()`.

## Refresh cadence
SSURGO is updated on a rolling county-by-county basis as surveys are completed or revised. Major releases are published periodically through the Web Soil Survey. The SDA API reflects the current production version.

## Known limitations
- Urban-land and "Miscellaneous area" components have no chemistry — common in dense cities. Treated as `coverage: 'partial'`.
- Some rural areas in the western US are not yet surveyed (`coverage: 'unmapped'`).
- Map-unit scale (~1:24,000) is coarser than a single parcel — adjacent lots may share a soil unit.
- SSURGO reflects natural soil properties, not anthropogenic contamination (use brownfields/Superfund for that).
- SDA does not provide a JSON REST endpoint — queries use an SQL-like syntax with XML or text/plain responses.
