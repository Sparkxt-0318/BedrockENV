# EPA EJScreen — Environmental Justice Screening and Mapping Tool

**Bedrock adapter**: `lib/data-sources/epa-ejscreen.ts`
**Scoring layer**: EJ (Environmental Justice)
**API**: `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx`
**Status**: UNAVAILABLE — returns 0 for all addresses (API key or registration required)

## What it covers
- 13 environmental indicators: PM2.5, ozone, NATA diesel particulate, toxics cancer risk, lead paint, traffic proximity, hazardous waste proximity, underground storage tanks, wastewater discharge, superfund proximity
- 6 demographic indicators: % low income, % people of color, % less than HS education, % linguistically isolated, % under 5, % over 64
- EJ Index: product of environmental burden and demographic vulnerability
- Percentile rankings at national, state, and regional levels
- Census block group level resolution (~220,000 block groups nationally)

## What it does NOT cover
- Tribal lands — EJScreen coverage is incomplete for federally recognized tribal areas
- Real-time air/water quality — EJScreen uses multi-year averages, not current monitoring
- PFAS specifically — PFAS is not a separate EJScreen indicator
- Hyper-local pollution (within a block group; all addresses in a block group share the same score)

## Refresh cadence
- EPA updates EJScreen annually, typically in Q2 (May/June)
- Current version: EJScreen 2.3 (2024 data vintage), using 2018-2022 ACS demographics
- Check https://www.epa.gov/ejscreen/download-ejscreen-data for updates
- Once API access is configured, Bedrock should cache EJScreen data by census block group FIPS to minimize API calls

## Known limitations
- **Currently returns 0 for all addresses**: EJScreen API requires registration/API key. Until credentials are provisioned, the EJ layer (15% of composite score) contributes 0 points to every assessment. This is the single largest gap in current scoring accuracy
- **Block group resolution**: EJScreen scores all addresses within a census block group identically. Two houses 50 feet apart may have meaningfully different local pollution profiles
- **Demographic data lag**: Demographics are from ACS 2018-2022; neighborhoods undergoing gentrification or demographic shift may be misclassified
- **Action required**: Register for EJScreen API access at https://www.epa.gov/ejscreen/learn-use-ejscreen-api. Add as EJSCREEN_API_KEY env var. See PENDING_DECISIONS.md PD-001 for prioritization

## Interaction with CDC SVI
Bedrock also has a CDC SVI adapter (`lib/data-sources/cdc-svi.ts`) for the Social Vulnerability Index. CDC SVI and EJScreen are complementary: EJScreen measures environmental burden + demographics; CDC SVI measures social vulnerability (socioeconomic status, household composition, minority status, housing/transportation). Both feed the EJ scoring layer when available.
