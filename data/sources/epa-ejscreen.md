# EPA EJScreen — Environmental Justice Screening and Mapping Tool

## What it covers
Census block group-level environmental and demographic indicators:
- Environmental indicators: PM2.5, ozone, diesel PM, air toxics cancer risk, traffic,
  lead paint, RMP proximity, Superfund proximity, hazardous waste proximity,
  wastewater discharge, drinking water non-compliance
- Demographic indicators: percent low-income, percent people of color, unemployment,
  less than high school education, linguistic isolation, low life expectancy, low median
  household income
- EJ Index = Environmental indicator × Demographic Index (percentile within state and national)

## What it doesn't cover
- Individual parcel-level data (block group level, typically 600–3,000 people)
- PFAS specifically (EJScreen uses its own air and water metrics, not UCMR 5)
- Rural tribal lands (limited coverage in some regions)

## Refresh cadence
EPA updates EJScreen approximately annually. Latest version: EJScreen 2.3 (2024).
Requires external API access or data download.

## Current status in Bedrock
**NOT FUNCTIONAL** — EJ layer returns 0 for all addresses. External API access or data
download required. This is the single biggest scoring gap:
- South LA (90002): expected 65+, scoring 27 without EJ
- Port Arthur TX: expected 65+, scoring 58 without EJ
- Flint MI: expected 55+, scoring 31 without EJ

Tracked in ROADMAP.md as "In Progress: EJ layer".

## Known limitations
- EJScreen is a screening tool, not a regulatory determination
- Block group granularity means urban neighborhoods average together low-income and
  wealthier adjacent blocks

## Bedrock usage (planned)
EJ layer (15% of composite). When functional: EJScreen percentile → EJ sub-score.
Resolution: BLOCK-GROUP-LEVEL. Cache: 30-day TTL.
