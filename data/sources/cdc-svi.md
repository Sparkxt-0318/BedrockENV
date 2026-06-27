# CDC/ATSDR Social Vulnerability Index (SVI)

## What it covers
Social vulnerability at the census tract level. Scores 16 social factors grouped
into 4 themes:
1. **Socioeconomic Status** — poverty, unemployment, income, no high school diploma
2. **Household Characteristics & Disability** — age 65+, age 17-, disability, single-parent
3. **Minority Status & Language** — minority population, English proficiency
4. **Housing Type & Transportation** — multi-unit housing, mobile homes, crowding, no vehicle

Each theme and the overall SVI are expressed as national percentile ranks (0–1).
Higher = more socially vulnerable. Accessed via CDC ArcGIS Feature Service.

## What it does NOT cover
- Environmental exposure (SVI is purely social/demographic)
- Block group or parcel scale (tract is typically 2,500–8,000 people)
- Real-time demographic changes (ACS-based, updated every 2 years)
- Tribal lands may have incomplete or suppressed tract data

## Refresh cadence
Updated every 2 years with the latest ACS 5-year estimates.
Current dataset: 2022 SVI (based on 2018–2022 ACS).
ArcGIS Feature Service is queried live at assessment time.

## Known limitations
- Requires census tract FIPS — addresses geocoded via Mapbox (without tract) cannot
  retrieve SVI
- Rural tracts with small populations may have suppressed values (reported as -999
  sentinel, treated as null)
- SVI is a demographic measure, not a contamination measure — high SVI means
  vulnerable population, not contaminated area
- 2-year update cadence means data can be up to 4 years stale mid-cycle
- ArcGIS service response times: 5–8s typical

## Layer assignment
EJ (Environmental Justice) layer — social vulnerability component.
