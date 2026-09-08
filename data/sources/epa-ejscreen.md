# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
Environmental justice indicators at the census block group level. Combines environmental burden indicators (air toxics cancer risk, PM2.5, ozone, diesel PM, drinking water non-compliance, lead paint, proximity to RMP/NPL/Superfund/TSDF/wastewater dischargers) with demographic vulnerability factors (low income, minority, less than HS diploma, linguistic isolation, low life expectancy, low median income). Used in the EJ layer.

## What it does NOT cover
- Individual property-level environmental conditions
- Real-time or recent data (EJScreen is based on compiled multi-year averages)
- Environmental conditions in areas with very small populations (data may be suppressed)

## Resolution
Block group level — typically 600–3,000 people per block group in urban areas.

## Refresh cadence
EPA releases updated EJScreen data annually (typically mid-year). Requires external API access or data download.

## Known limitations
1. **Currently non-functional in Bedrock** — EJScreen integration requires an API key or data access agreement that has not been configured. The EJ layer returns 0 for all addresses until this is resolved. This is the largest single gap in scoring accuracy, affecting all urban and disadvantaged-area addresses.
2. EJScreen national percentiles can be misleading for addressing hyperlocal conditions; a block group ranked 70th nationally may be very different from one ranked 70th in a densely populated state.
3. EJScreen data is compiled from multiple sources with different vintage years, creating internal temporal inconsistencies.
4. Block group boundaries do not align with environmental hazard boundaries (e.g., a plume may cut across multiple block groups).

## Authoritative source
https://www.epa.gov/ejscreen — API: https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx
