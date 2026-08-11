# EPA EJScreen — Environmental Justice Screening and Mapping Tool

## What it covers
Block-group-level environmental justice indices combining environmental burden indicators with demographic factors. Used in the EJ layer (`ejScreenIndex`, `demographicBurden` sub-components). Covers all US block groups.

Key indicators used:
- EJ Index (environmental burden × demographic index) — overall percentile
- Demographic Index — low-income + people-of-color percentile
- Individual pollution burden indicators (PM2.5, ozone, diesel, cancer risk, RSEI, traffic, lead paint, Superfund proximity, RMP proximity, wastewater discharge, drinking water non-compliance, underground storage tanks)

## What it doesn't cover
- Individual address precision — data is at census block group level (~600–3,000 people)
- Rural areas tend to have incomplete pollution-burden data (monitoring gaps inflate apparent EJ index for urban areas)
- Tribal areas may have incomplete coverage

## Refresh cadence
EPA releases EJScreen annually (typically Q2). Current version: EJScreen 2.3 (based on 2017–2021 ACS 5-year data and 2021 environmental data).

Check: https://www.epa.gov/ejscreen/download-ejscreen-data

API endpoint used: `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx`

## Known limitations
- **EJ layer is currently scoring 0 for most addresses** — the API client exists (`lib/data-sources/epa-ejscreen.ts`) but may be returning null due to API access/key issues. This means EJ scores are excluded from composites and weight is redistributed to other layers.
- Percentile-based scoring means a "50th percentile" score looks neutral even if the underlying absolute burden is high — scores are relative to national distribution, not absolute health standards
- Block group centroids are used for API queries; edge cases near block group boundaries may return adjacent block group data
