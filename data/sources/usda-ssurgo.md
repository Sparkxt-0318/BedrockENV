# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Detailed soil property data for the continental US, compiled from the USDA Natural Resources Conservation Service's systematic soil surveys. Bedrock queries the Soil Data Access (SDA) Tabular web service to retrieve soil properties at a given lat/lng point, including:

- **Texture**: sand, silt, and clay percentages
- **pH**: soil acidity/alkalinity (affects contaminant mobility and bioavailability)
- **Organic matter (OM)**: carbon content (affects contaminant binding capacity)
- **Cation Exchange Capacity (CEC)**: indicator of nutrient and contaminant retention
- **Hydraulic conductivity (Ksat)**: how quickly water moves through soil (determines leaching potential)
- **Drainage class**: well-drained vs. poorly-drained (affects groundwater contamination risk)
- **Hydrologic group**: runoff potential

These properties feed the soil scoring layer to assess physical vulnerability to contamination uptake and leaching.

Aggregation: horizons in the 0-25 cm band (surface, residential-relevant) are averaged by thickness; components are aggregated by percent composition.

## What it doesn't cover
- **Actual soil contamination**: SSURGO measures natural soil properties, not the presence of industrial chemicals. A soil with high clay content in an uncontaminated rural county scores the same as clay near a smelter.
- **Urban fill and disturbed soils**: Many urban areas are built on fill, graded soils, or demolished industrial sites. SSURGO maps the natural soil parent material, not what's actually at the surface in cities.
- **Deep subsurface**: SSURGO covers the top ~2 meters (roughly). Deep aquifer contamination isn't captured.
- **Temporal changes**: Soil properties change slowly but contamination changes soil pH and organic matter over time; SSURGO doesn't track contamination-driven changes.

## Refresh cadence
SSURGO is updated as NRCS completes updated soil surveys (roughly 5-10 year cycles by county). The Soil Data Access web service serves the current release. Bedrock queries live per assessment (no static bundle).

**Note**: WKT order is (longitude, latitude) — swapping lat/lon in the SDA query silently returns zero rows.

## Known limitations
1. **Urban coverage gap ("urban land" entries)**: In heavily developed areas, SSURGO map units are classified as "Urban land" or "Miscellaneous area" with no chemistry data. Bedrock skips these components, returning partial coverage. This affects nearly every major city. ~15% of US land area lacks SSURGO chemistry due to this gap.
2. **Neighborhood-level resolution only**: SSURGO map units are typically 1-100 acres. A specific backyard may have very different soil than the map unit centroid suggests.
3. **Database format**: SDA does not provide a JSON REST endpoint — it accepts SQL-like queries over HTTP POST and returns pipe-delimited or JSON rows. Complex query parsing is required.
4. **Slow API**: The SDA Tabular service can take 5-10 seconds to respond. Bedrock caches SSURGO results for 90 days.
