# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Detailed soil survey data at 1:24,000 scale (parcel-level resolution in most areas). Provides soil series, drainage class, organic matter content, pH, texture, hydrologic group, and other physical/chemical properties. Used as the foundational soil characterization layer for Bedrock's soil vulnerability sub-score.

## What it doesn't cover
- Urban impervious surfaces (soils under buildings/pavement are mapped but properties may be imprecise)
- Contaminated soils (SSURGO describes natural soil properties, not anthropogenic contamination)
- Post-disturbance soils (development, grading, fill material changes soil properties but SSURGO may not reflect this)
- Subsurface contamination at depth

## Refresh cadence
USDA NRCS updates SSURGO continuously via the Web Soil Survey. Major updates occur when new soil surveys are conducted or existing surveys are revised. Bedrock queries the SSURGO SDA (Soil Data Access) REST API at assessment time.

## Known limitations
- **Urban data gap**: ~15% of urban areas have outdated or incomplete SSURGO coverage because soil surveys prioritized agricultural land. This is a documented gap in the SCVI methodology.
- **API reliability**: SSURGO SDA REST API experiences frequent timeouts (~20% of requests). This is the primary cause of low soil layer coverage in urban areas.
- **Scale vs. resolution tradeoff**: While mapped at 1:24,000, the database reflects polygon-level characteristics, not point measurements. A single map unit may cover several acres.
- **Temporal lag**: Soil surveys can be 20–30 years old in stable rural areas. Land use changes (especially urban expansion) may not be reflected.

## Scoring use
Soil layer sub-component (vulnerability). Poorly drained soils, low organic matter, sandy texture, and Hydrologic Group D soils all increase vulnerability score. Represents the "receptivity" dimension of the soil vulnerability model — how readily contaminants would move through the soil profile.
