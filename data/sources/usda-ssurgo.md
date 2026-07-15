# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Point-level soil properties for the soil map unit at a query location. Includes texture (sand/silt/clay percentages), pH, organic matter, cation exchange capacity (CEC), saturated hydraulic conductivity (Ksat), and drainage class. Bedrock averages horizon-level data over the 0–25 cm surface band (the residential exposure-relevant zone) weighted by component percentage.

## What it doesn't cover
- Contamination — SSURGO measures natural soil properties, not anthropogenic contamination. A high-organic-matter soil is not contaminated; it's just a certain soil type.
- Urban lands and water bodies — many urban map units lack chemistry (compkind = 'Miscellaneous area'). Bedrock skips these components.
- Recent soil disturbance (construction fill, remediation backfill) — SSURGO reflects the natural soil profile, not what's actually in the ground after disturbance.
- Volatile organic compounds, heavy metals, or other contaminants in soil

## Source
USDA Soil Data Access (SDA) Tabular REST service: `https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest`. SQL-like query resolving point coordinates to mukey via `SDA_Get_Mukey_from_intersection_with_WktWgs84`. **WKT order is (lon, lat) — not (lat, lon).**

## Refresh cadence
SSURGO updates annually via USDA NRCS field surveys. Changes are incremental. Bedrock caches for 90 days.

## Known limitations
- Map unit resolution is 1–100 acres (neighborhood-level). A parcel may sit at the boundary of two very different soil types and receive the properties of the wrong one.
- Urban areas often have impervious surfaces recorded in SSURGO as "Urban land" with null chemistry, returning `coverage: 'partial'` and contributing 0.5× to the soil coverage factor.
- SSURGO does not cover military reservations or tribal trust lands in many areas.
- SSURGO data is used in Bedrock's soil scorer as a proxy for contamination vulnerability (drainage, texture, pH affect contaminant mobility) rather than as a direct contamination measurement.
