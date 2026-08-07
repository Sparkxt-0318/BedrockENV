# NASA POWER — Prediction Of Worldwide Energy Resources (Climate Data)

## What it covers
NASA POWER API provides meteorological and solar data at 0.5-degree grid resolution. Bedrock uses it for:

- **Precipitation**: Annual precipitation (mm/year) for erosivity calculation
- **Temperature**: Annual mean temperature (°C)
- **Wind speed**: For erosion potential

These inputs feed the climate sub-component of the soil vulnerability score (SSURGO erosivity / climate stress).

Note: The file is named `nasa-smap.ts` but queries the NASA POWER API (not the SMAP soil moisture mission). The `SMAP` name in the filename is a legacy misnomer.

## What it doesn't cover
- Real-time weather
- Climate projections / future scenarios
- Soil moisture directly (despite the filename; SMAP mission data is not used)

## Refresh cadence
NASA POWER data is climatological averages (30-year normals or recent annual values). Bedrock requests the most recent available year.

**API endpoint**: `https://power.larc.nasa.gov/api/temporal/climatology/point`
**Live API**: `lib/data-sources/nasa-smap.ts`
**No API key required**.

## Known limitations
1. **0.5-degree resolution**: ~55km grid cells. All addresses within the same 55km × 55km grid cell receive identical climate data.
2. **Filename misnomer**: The file is named `nasa-smap.ts` but uses NASA POWER. If true SMAP soil moisture data is ever integrated, this will need renaming.
3. **Not a contamination signal**: Climate data (precipitation, temperature) is a proxy for *vulnerability* (erodibility, contaminant mobility) not contamination itself.

## Scoring integration
Layer: Soil (15% weight). Sub-component: climate erosivity within the SSURGO soil vulnerability score. Formula in `lib/scoring/soil-scorer.ts`.
