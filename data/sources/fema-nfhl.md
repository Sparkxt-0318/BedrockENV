# FEMA NFHL — National Flood Hazard Layer

**Bedrock adapter**: `lib/data-sources/fema-nfhl.ts`
**Scoring layer**: Soil (flood exposure sub-component)
**API**: FEMA Map Service Center REST API (`https://msc.fema.gov/arcgis/rest/services/`)

## What it covers
- FEMA flood zone designations for all mapped US land parcels
- Special Flood Hazard Areas (SFHA): Zone A, AE, AO, AH, V, VE (1% annual chance / "100-year flood")
- Moderate risk zones: Zone X500 (0.2% annual chance / "500-year flood")
- Minimal risk: Zone X
- Base Flood Elevation (BFE) where determined
- Floodway delineations

## What it does NOT cover
- **Unmapped areas**: ~13 million properties are in flood-prone areas but not yet mapped by FEMA. FEMA mapping is perpetually underfunded; many rural and suburban areas have outdated or missing FIRMs (Flood Insurance Rate Maps)
- **Future risk**: NFHL reflects historical flood frequency, not climate-adjusted future projections (see First Street Foundation for forward-looking flood risk)
- **Pluvial flooding** (surface water / urban stormwater): NFHL focuses on riverine and coastal flooding; stormwater flooding from intense precipitation is not mapped
- **Infrastructure failures**: Dam breaks, levee failures above NFHL assumption levels
- **Compound flood-contamination**: NFHL identifies flood exposure; Bedrock's CFCI layer combines NFHL flood exposure with SCVI contamination pressure (see `/intelligence/flood-contamination`)

## Refresh cadence
- FEMA updates flood maps on a rolling basis as communities complete LiDAR surveys and remapping
- National refresh is not synchronized; individual county/community FIRMs can be years old
- Check https://msc.fema.gov/portal/ for FIRM effective dates by county
- Bedrock makes live API calls; no static bundle

## Known limitations
- **FEMA mapping backlog**: An estimated 40% of flood-prone US land is either unmapped or mapped with outdated LiDAR. Addresses in these areas receive Zone X (minimal risk) by default, understating actual flood risk
- **API response latency**: NFHL REST endpoint is slow (~3-8s for complex polygon intersections). Bedrock uses a timeout of 10s; if exceeded, flood sub-score defaults to 0 (no flood exposure detected)
- **Coordinate precision**: FEMA FIRM boundaries are mapped at 1:24,000 scale. Properties near SFHA boundaries may be incorrectly zoned in/out of the flood hazard area
- **NFIP vs. actual risk**: NFHL was designed for the NFIP insurance program; it underestimates risk in communities that have rejected NFIP participation or that have built mitigation since the last FIRM
