# NASA POWER — Prediction of Worldwide Energy Resources

## What it covers
NASA POWER provides gridded meteorological and solar data derived from satellite observations and atmospheric models. Bedrock uses it to obtain climate variables relevant to soil erosion and environmental exposure: precipitation, temperature, humidity, and radiation indices. These feed into the climate erosivity component of the soil vulnerability score (SVS in the SCVI model).

## What it doesn't cover
- Air quality (use OpenAQ/AQS for that)
- Real-time weather data
- Hydrological modeling outputs

## How Bedrock uses it
Queried live by lat/lon in `lib/data-sources/nasa-smap.ts`. Returns annual/monthly climate parameters used in calculating rainfall erosivity as part of the soil layer.

## Refresh cadence
NASA POWER data is updated daily with recent climatology. The gridded product has ~0.5° spatial resolution. No local bundle.

## Known limitations
- Low spatial resolution (0.5°) — may not capture micro-climate variation in complex terrain
- Statistical model output, not direct measurement
- Most valuable for rural addresses where precipitation-driven erosion is relevant; less informative for urban impervious surfaces

## Source
NASA POWER: https://power.larc.nasa.gov/
