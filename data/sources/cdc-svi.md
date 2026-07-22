# CDC/ATSDR Social Vulnerability Index (SVI)

## What it covers
Census-tract-level social vulnerability scores for all US tracts, updated from the 2020 Census / ACS 5-year estimates. SVI ranks each tract on 16 social factors grouped into 4 themes:

1. **Socioeconomic status** — poverty, unemployment, housing cost burden, no high school diploma
2. **Household characteristics & disability** — age 65+, age 17 and under, disability, single-parent households
3. **Minority status & language** — minority status, English language proficiency
4. **Housing type & transportation** — multi-unit structures, mobile homes, crowding, no vehicle, group quarters

Each theme and the overall SVI are expressed as national percentile ranks (0–1). Higher = more socially vulnerable. Bedrock uses SVI as a secondary input to the EJ layer.

## What it doesn't cover
- **Individual household characteristics** — census tract averages; individual households within a tract vary widely.
- **Environmental indicators** — SVI is purely demographic/social. It measures who is vulnerable, not what they're exposed to. (EJScreen adds the environmental dimension.)
- **Block-group resolution** — SVI is tract-level only (~4,000 people average). Census block groups (~1,500 people) would be more precise.
- **Rural tracts with suppressed data** — small tracts may have ACS data suppressed with a -999 sentinel value.

## Refresh cadence
CDC publishes SVI every 2 years, tied to ACS 5-year release cycles. Current version uses 2020 ACS data (published 2022). Next update expected 2024/2025 using 2022 ACS data.

API: CDC SocioNeeds/SVI ArcGIS Feature Service (no API key required). Bedrock fetches live per assessment.

## Known limitations
1. **Requires census tract FIPS**: Only available when geocoding successfully returns a census tract ID. Addresses that fail to geocode to tract level fall back to county-level estimates.
2. **Data vintage**: The 2020 ACS-based SVI reflects pre-COVID social patterns; some vulnerability dimensions (housing cost burden, unemployment) may have shifted significantly.
3. **No Puerto Rico or territories** — SVI covers only 50 states + DC.
4. **Not designed for individual addresses** — CDC SVI is a screening tool for emergency management, not a property-level risk assessment input. Use with appropriate caveats.
