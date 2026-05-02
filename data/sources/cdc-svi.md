# CDC/ATSDR Social Vulnerability Index (SVI)

## What it covers
Social vulnerability rankings for every US census tract on 16 social factors grouped into 4 themes:
1. **Socioeconomic Status** — poverty, unemployment, housing cost burden, no high school diploma
2. **Household Characteristics & Disability** — age, disability, single-parent households, English proficiency
3. **Minority Status & Language** — racial/ethnic minority, English isolation
4. **Housing Type & Transportation** — multi-unit structures, mobile homes, crowding, no vehicle, group quarters

Each theme and the overall SVI are expressed as national percentile ranks (0–1, higher = more vulnerable). Used in the **EJ layer** at a 0.35 weight alongside EJScreen.

**Current status**: CDC SVI ArcGIS service requires external network access. In environments where the ArcGIS endpoint is unavailable, SVI returns 0. This compounds the EJ layer gap caused by EJScreen unavailability.

## What it doesn't cover
- Environmental exposures (SVI is purely social, not environmental)
- Block-group-level granularity (tract level only)
- Sub-annual changes — SVI is updated on a 2-year cycle

## Refresh cadence
SVI is released every 2 years using the most recent ACS 5-year estimates. The current release uses 2022 ACS data (released ~2024). Bedrock caches SVI responses for **90 days** per census tract.

## Known limitations
- Data updated every 2 years — can be 1–2 years stale at any given time.
- Rural tracts with small populations may have suppressed ACS data (sentinel value -999 in the SVI database). The client treats -999 as null/unavailable.
- SVI measures social vulnerability to disasters; it is a reasonable proxy for environmental justice exposure but was not designed specifically for that purpose.
- Census tract boundaries are larger and coarser than block groups; a tract can span both wealthy and low-income neighborhoods.
