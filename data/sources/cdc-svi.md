# CDC SVI — Social Vulnerability Index

## What it covers
- Composite index of social vulnerability at the census-tract level (national percentile 0–1, scaled to 0–100 in scoring)
- Four themes: (1) Socioeconomic status, (2) Household characteristics, (3) Racial/ethnic minority status, (4) Housing type/transportation
- 16 individual indicators from ACS 5-year estimates: poverty rate, unemployment, housing cost burden, mobile homes, crowding, no vehicle, disability, single-parent households, etc.
- Identifies communities with reduced capacity to prepare for, respond to, and recover from hazards

## What it doesn't cover
- Environmental contamination directly — SVI is a social vulnerability measure, not an exposure measure
- Temporal dynamics — a single snapshot; does not track change over time at the tract level
- Sub-tract variation — all households in a tract get the same SVI

## Refresh cadence
- CDC/ATSDR releases SVI every 2 years based on ACS 5-year estimates (e.g., 2022 SVI uses 2018–2022 ACS)
- Current version: SVI 2022 (released 2024)
- Access: CDC SVI data portal or API (`https://www.atsdr.cdc.gov/placeandhealth/svi/index.html`)
- Bedrock queries via API at assessment time

## Known limitations
- **Currently non-functional in Bedrock** — requires CDC API credentials not configured; returns 0* along with EJScreen. When both are unavailable, the full EJ layer (15% of composite) contributes 0.
- Census tract geography can be larger than a neighborhood — tracts range from 1,200 to 8,000 residents; a single tract may include multiple distinct communities
- SVI is a relative measure (percentile rank) — a tract at the 50th percentile is not "safe," it is average
- The four-theme structure treats all themes equally in the composite; for environmental justice purposes, Theme 3 (minority status) and Theme 1 (socioeconomic) may deserve higher weight
- SVI is designed for emergency management, not chronic exposure assessment — its use as an EJ proxy is an approximation
