# Census ACS B25034 — Lead Risk Proxy (Housing Age)

## What it covers
Census American Community Survey (ACS) Table B25034 (Year Structure Built) at the census block group level. Used as a proxy for lead service line and lead solder risk based on housing age cohorts.

**Risk mapping**:
- Pre-1939 / 1940-1949: High probability of lead service lines and lead paint
- 1950-1979: Lead solder commonly used in plumbing
- Post-1986: SDWA amendments banned lead solder; risk drops sharply

**Data points**: Total housing units, count by decade of construction. Bedrock computes percent pre-1950 (high lead risk) and percent pre-1986 (moderate lead risk) from these counts.

## What it doesn't cover
- Actual lead service line presence (no federal dataset maps individual service lines)
- Post-remediation pipe replacement (a neighborhood may have replaced all lead pipes despite old housing)
- Lead paint (tracked separately; not currently a scored sub-component)
- New construction that replaced old housing stock at the same address

## Refresh cadence
ACS 5-year estimates are released annually (current: 2018-2022 ACS, released December 2023).

**API endpoint**: Census Bureau ACS API (`https://api.census.gov/data/2022/acs/acs5`)
**API key env var**: `CENSUS_API_KEY`
**Live API**: `lib/data-sources/epa-lead.ts`

## Known limitations
1. **Proxy, not measurement**: Housing age predicts *probability* of lead plumbing, not confirmed presence. A 1940s building whose owner replaced all pipes in 2010 would still show high lead risk.
2. **Block group aggregation**: All addresses in the same census block group receive identical housing-age data.
3. **Military bases**: No ACS data for on-base military housing — lead risk returns null for these addresses.
4. **Census API key required**: Without `CENSUS_API_KEY`, this sub-component is unavailable.

## Scoring integration
Layer: Water (25% weight). Sub-component: lead service line risk proxy. Formula in `lib/scoring/water-scorer.ts`.
