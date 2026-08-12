# CDC SVI — Social Vulnerability Index

## What it covers
Census-tract-level social vulnerability scores from the CDC/ATSDR Social Vulnerability Index. Four themes: Socioeconomic Status (poverty, unemployment, income, education), Household Characteristics (age, disability, single-parent households), Racial and Ethnic Minority Status, and Housing Type and Transportation. Each tract receives an overall percentile rank (0–1) and per-theme rankings. Used as an input to the EJ layer.

## What it doesn't cover
- **Not an environmental measurement** — SVI measures social vulnerability to disasters and environmental hazards, not pollution levels.
- **No neighborhood-level resolution** — Census tracts average 4,000 people. Within-tract variation (e.g. a public housing project adjacent to a low-density suburb) is not captured.
- **No real-time updates** — SVI is updated after each decennial census and ACS 5-year release, not in response to economic shifts.

## Refresh cadence
CDC releases updated SVI data approximately every 2–4 years, aligned with ACS 5-year releases. Current version in use: 2022 SVI (based on 2018–2022 ACS). Next expected update: 2024 SVI (2020–2024 ACS), expected late 2026.

## Known limitations
- **Also non-functional without API access** — Like EJScreen, CDC SVI API access requires configuration. Currently the EJ layer returns 0 for all addresses.
- **CT planning regions gap**: Connecticut reorganized from counties to planning regions in 2022. 9 CT planning regions are unmatched in Census crosswalks based on legacy county FIPS codes.
- **ACS sampling error**: SVI is derived from ACS 5-year estimates, which carry margins of error, especially for small census tracts (<1,000 population).

## Source
CDC/ATSDR SVI: https://www.atsdr.cdc.gov/placeandhealth/svi/index.html  
Implementation: `lib/data-sources/cdc-svi.ts`
