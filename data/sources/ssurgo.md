# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Soil physical and chemical properties at the map unit (typically 1–100 acres) containing the query point. Properties queried for the 0–25 cm surface horizon (residential exposure–relevant root zone): sand/silt/clay percentages, pH, organic matter (%), cation exchange capacity (CEC), saturated hydraulic conductivity (Ksat), dominant drainage class, and hydrologic soil group. Used by the soil scorer to assess contamination susceptibility (low organic matter + sandy texture → higher leaching risk).

## What it doesn't cover
- **No chemical contamination** — SSURGO measures soil physics, not lead, arsenic, dioxins, or any anthropogenic contaminants.
- **Urban data gap** — Highly urbanized areas (classification: "Urban land") have no chemistry data. Components with `compkind = 'Miscellaneous area'` are excluded from aggregation.
- **No depth > 25 cm** — The query targets the surface horizon only. Deep contamination is not captured.
- **No real-time conditions** — SSURGO reflects baseline surveyed conditions, not post-spill or post-construction soil changes.

## Refresh cadence
SSURGO is updated annually by USDA-NRCS as new county surveys are completed. The Soil Data Access (SDA) tabular web service used here is queried live on each assessment (no local bundle). Effective data currency varies by county — some surveys are decades old.

## Known limitations
- **WKT lon/lat order**: SDA requires `POINT(lon lat)` — swapped coordinates silently return zero rows. This is guarded in the code but is the #1 silent failure mode.
- **Urban coverage gap**: Map units classified as "Urban land" dominate in dense cities, returning `coverage: 'partial'` with no chemistry. Cities like Newark NJ receive partial soil data.
- **Zero-row responses**: Areas not yet surveyed return `coverage: 'unmapped'`. About 5–10% of rural land lacks digitized surveys.
- **Aggregation assumptions**: Horizon weighting by intersected thickness in 0–25 cm is a simplification — real soil variability within a map unit can be high.

## Source
USDA Soil Data Access (SDA): https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest  
Implementation: `lib/data-sources/usda-ssurgo.ts`
