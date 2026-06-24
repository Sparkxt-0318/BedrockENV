# NASA POWER — Prediction Of Worldwide Energy Resources (Climate Data)

## What it covers
- Monthly and annual climatology data: precipitation (mm/month), temperature (°C), humidity
- Used in Bedrock to compute the De Martonne Aridity Index: `AI = P / (T + 10)` where P is annual precipitation and T is mean annual temperature
- Aridity index informs soil layer climate stress sub-score
- Global coverage at 0.5° × 0.5° spatial resolution (~55km grid)
- Historical baseline: 1981–2010 climatological means (30-year normals)

## What it doesn't cover
- Real-time or recent climate data (uses 30-year baseline, not current year)
- High-resolution local climate variation — 0.5° grid misses urban heat islands, valley effects
- Precipitation extremes and drought indices beyond the De Martonne formula
- Soil moisture directly — aridity is used as a proxy for soil desiccation stress

## Refresh cadence
- NASA POWER climatology dataset is updated roughly every 5 years as new 30-year normals are computed
- Current Bedrock integration uses static normals; no live API call per assessment
- API: NASA POWER REST API (`https://power.larc.nasa.gov/api/temporal/climatology/point`)

## Known limitations
- 0.5° resolution (≈55km) is too coarse to distinguish microclimates within a metropolitan area
- De Martonne aridity is a simplified index; it does not capture seasonal distribution of precipitation or inter-annual variability
- Climate stress sub-score carries only 0.10 weight within the soil layer — it is a directional signal, not a primary driver
- Does not incorporate projected future climate (CMIP6 or IPCC scenarios); aridity risk in 2050 is not captured
- Precipitation trend flag (whether precipitation is declining) requires multi-year trend data not currently implemented; the +10 boost for declining trend is currently inactive
