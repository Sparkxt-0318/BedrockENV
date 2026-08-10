# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Digitized soil survey data for the contiguous United States at county scale. Covers soil organic matter content, drainage class, hydrologic group, pH, texture class, and other physical/chemical properties. Published by USDA Natural Resources Conservation Service (NRCS).

## What it doesn't cover
- **Urban areas**: SSURGO frequently has "urban land" or "Udorthents" map units for developed areas, which have no chemical property data. This is the "urban blind spot" documented in the SCVI research brief — roughly 30–40% of urban census tracts fall into undifferentiated urban map units.
- Soil contamination directly: SSURGO measures natural soil properties, not anthropogenic contamination. A high SSURGO organic matter score does not mean the soil is uncontaminated.
- Real-time or recent land-use changes: SSURGO surveys are decades old in many areas.

## How Bedrock uses it
The soil scorer reads SSURGO for the target location via the USDA Soil Data Access API (SDA). Key metrics: organic matter (%), drainage class, hydrologic group. High organic matter + poor drainage = higher vulnerability to contamination persistence. These contribute to the SVS (Soil Vulnerability Score) component of the SCVI index.

## Refresh cadence
SSURGO updates are continuous but infrequent for any given county (resurveys happen every 10–20 years). Check NRCS soil survey status map for update dates. Bedrock reads live from the SDA API.

## Known limitations
1. **Urban data gap**: The most contamination-burdened areas (urban EJ communities) are often the least well-characterized by SSURGO. "Urban land" map units return null for most properties.
2. **Survey age**: Some areas were last surveyed in the 1970s–1980s. Land use changes (industrial→residential conversion, brownfield redevelopment) are not reflected.
3. **Surface-only**: SSURGO describes the upper soil horizons (typically 0–150cm). Deep groundwater contamination is not captured.
4. **API rate limits**: The SDA SOAP API is reliable but slow for batch queries. Individual address lookups work well.

## Source
- USDA SSURGO: https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo
- Soil Data Access API: https://sdmdataaccess.sc.egov.usda.gov/
