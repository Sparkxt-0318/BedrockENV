# US Census ACS — American Community Survey (Table B25034)

## What it covers
Housing unit age data at the census tract level, specifically table B25034 ("Year Structure Built"). Used as a proxy for lead paint risk — pre-1978 (and especially pre-1950) housing stock has substantially higher probability of lead-based paint exposure. Provides the fraction of housing units built before 1980 and before 1950 as a lead-risk proxy in the Water layer.

## What it does NOT cover
- Actual lead paint testing results (no federal database covers this at the property level)
- Lead in soil or drinking water directly (that's SDWIS/UCMR 5/WQP)
- Post-remediation lead abatement status
- Non-residential properties

## Resolution
Tract-level — all addresses in a census tract receive the same ACS-derived lead proxy score.

## Refresh cadence
ACS 5-year estimates are released annually (December). Bedrock uses the 2022 5-year estimates (covering 2018–2022). The Census API query is made live per assessment.

## Known limitations
1. Housing age is a population-level proxy, not a property-specific measurement. A 1920s building may have had full lead abatement; a 1970s building may have deteriorating lead paint.
2. Military bases and large institutional campuses (universities, hospitals) often have no ACS housing data; the scorer returns null for these areas.
3. Rapidly changing neighborhoods (new construction) may lag ACS estimates by 2–5 years.
4. The proxy only covers drinking water lead risk from household plumbing and paint. It does not capture industrial lead contamination of soil or air.

## Authoritative source
https://www.census.gov/programs-surveys/acs — API: https://api.census.gov/data/2022/acs/acs5
