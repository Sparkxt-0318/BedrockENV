# CDC SVI — Social Vulnerability Index

## What it covers
Social vulnerability indicators at the census tract level across four themes: (1) Socioeconomic Status (poverty, unemployment, housing cost burden, no HS diploma), (2) Household Characteristics (age 65+, disability, single-parent households, English proficiency), (3) Racial & Ethnic Minority Status (minority population %), and (4) Housing Type & Transportation (multi-unit structures, mobile homes, crowding, no vehicle, group quarters). Each theme and an overall percentile are provided on a 0–1 scale. Used in the EJ layer as a demographic vulnerability multiplier.

## What it does NOT cover
- Environmental burden directly (that's EJScreen)
- Individual household vulnerability
- Geographic areas smaller than a census tract

## Resolution
Tract-level.

## Refresh cadence
CDC updates SVI every 2 years (aligned with ACS 5-year release cycles). Current version: 2022. The next release is expected 2024–2025.

## Known limitations
1. Like EJScreen, requires external API access that may not be configured in all environments.
2. Tract-level data means a single address's vulnerability score reflects its neighborhood average, not its specific household circumstances.
3. SVI does not capture all dimensions of social vulnerability (e.g., informal housing, undocumented populations, recent disaster displacement).

## Authoritative source
https://www.atsdr.cdc.gov/placeandhealth/svi — API: https://svi.cdc.gov/Documents/Data/2022/csv/
