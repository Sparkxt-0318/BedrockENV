# CDC/ATSDR Social Vulnerability Index (SVI)

## What it covers
Social vulnerability rankings for all US census tracts across 16 social factors grouped into 4 themes:
1. **Socioeconomic Status** — poverty rate, unemployment, income, no high-school diploma
2. **Household Characteristics & Disability** — age 65+, age 17-, disability, single-parent households, English language proficiency
3. **Minority Status & Language** — racial/ethnic minority status
4. **Housing Type & Transportation** — multi-unit housing, mobile homes, crowding, no vehicle, group quarters

Each theme and the overall SVI are expressed as national percentile ranks (0–1). Higher = more socially vulnerable.

## What it doesn't cover
- Environmental hazards directly (SVI is a social indicator, not an environmental one)
- Sub-tract variation (all households in a tract share the same SVI)
- Dynamic social changes between census update cycles

## How we use it
Queried via the CDC SocioNeeds/SVI ArcGIS Feature Service by census tract FIPS code. Used in the EJ layer to capture social vulnerability dimensions (who is most harmed by environmental exposure, not just where exposure occurs). The overall SVI and minority/socioeconomic themes are most relevant to environmental justice scoring.

## Refresh cadence
Updated every 2 years using 5-year ACS estimates. Current version uses 2022 data (released 2024). Next expected: 2026 (using 2024 ACS).

## Known limitations
- Tract-level resolution only; block-group or parcel-level variation is invisible.
- Rural tracts with suppressed data use a -999 sentinel that must be filtered out.
- ArcGIS service response times are 5–8 seconds.
- Data can be 1–2 years behind census changes due to the 2-year release cycle.
- SVI measures social vulnerability to disasters broadly — it is a proxy for EJ dimensions, not a direct environmental burden measure.
