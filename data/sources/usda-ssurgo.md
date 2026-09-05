# USDA SSURGO — Soil Survey Geographic Database

## What it covers
USDA NRCS's primary national soil database, produced from ground-truth soil surveys over decades. Bedrock queries SSURGO for:
- **Organic matter content** (OM%): proxy for soil health and contamination buffering capacity
- **Soil drainage class**: very poorly drained soils have higher contamination mobilization risk
- **Soil pH**: acidic soils mobilize heavy metals more readily
- **Texture class**: sandy soils have faster contaminant migration to groundwater

These four SSURGO attributes form the Soil Vulnerability Score (SVS) foundation within the SCVI model.

## What it does NOT cover
- Urban areas where native soils are mapped as "urban land" — a significant data gap for cities
- Actual contamination measurements (SSURGO is a natural soil characterization, not a contamination survey)
- Filled land, brownfields, or anthropogenic soils
- Subsurface conditions below the typical 1–2 meter survey depth
- Soil conditions in parking lots, buildings, or impervious surfaces

## Refresh cadence
SSURGO surveys are updated on a rolling basis as NRCS completes county-level re-surveys, typically every 15–25 years per county. Bedrock queries the USDA Web Soil Survey SOAP API in real-time. No Bedrock-side bundle needed.

## Known limitations
- **Urban land gap**: Dense urban areas are classified as "urban land miscellaneous area" with no component-level data. This is the single largest gap in SSURGO-based scoring — all major US cities have reduced SSURGO data quality. Approximately 30% of US residents live in areas with limited SSURGO coverage.
- **Survey age**: Some rural county surveys are 20+ years old and do not reflect changes from land use conversion, erosion, or contamination.
- **API reliability**: The USDA Web Soil Survey SOAP API has intermittent availability issues. Bedrock falls back to a simplified "urban gap" score (default 50/100) when the API is unavailable.
- **Subsurface limitations**: SSURGO surveys typically characterize the top 1–2 meters. Deeper contamination plumes are not captured.
