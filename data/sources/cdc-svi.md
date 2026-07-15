# CDC SVI — Social Vulnerability Index

## What it covers
Census-tract-level social vulnerability index based on 16 US Census variables grouped into four themes: Socioeconomic Status (poverty, unemployment, income, education), Household Characteristics (age, disability, single-parent families), Racial and Ethnic Minority Status, and Housing Type & Transportation (multi-unit housing, mobile homes, crowding, no vehicle). Scores range 0–1 (higher = more vulnerable).

## What it doesn't cover
- Environmental exposure (that's the EJScreen domain)
- Block-level variation within a census tract
- Dynamic factors like short-term unemployment spikes or emergency conditions

## Source
CDC ATSDR SVI API or direct data download at `https://www.atsdr.cdc.gov/placeandhealth/svi/data_documentation_download.html`. Bedrock queries via the `lib/data-sources/cdc-svi.ts` client.

## Refresh cadence
CDC releases SVI every 2 years aligned with ACS 5-year estimates. Current version: 2022 SVI (released 2023). Next release expected 2025 based on 2022–2024 ACS.

## Known limitations
- **Currently not active in Bedrock's EJ layer**. The EJ layer is in development; CDC SVI is defined but not yet integrated into live scoring.
- SVI is a relative index — a high SVI area is more vulnerable than average, but the index doesn't directly measure environmental risk.
- Census tract averaging masks within-tract heterogeneity.
- Military base census tracts often have unusual demographics (young, predominantly male, higher income) that make SVI scores low even when environmental risk from on-base contamination is high (Camp Lejeune, etc.).
