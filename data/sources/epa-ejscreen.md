# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
National percentile ranks (0–100) for multiple environmental and demographic indicators at the census block group level. EJScreen combines environmental indicators (air toxics, particulate matter, ozone, diesel PM, lead paint, traffic proximity, waste sites, wastewater discharge, underground storage tanks) with demographic indicators (percent low-income, percent minority, percent linguistically isolated, percent with less than high school education, percent under age 5, percent over age 64) to produce Environmental Justice Index scores.

Bedrock uses EJScreen in the EJ layer as a composite percentile rank for environmental burden.

## What it doesn't cover
- **PFAS contamination** — EJScreen is based on modeled air and waste data, not monitoring data.
- **Superfund proximity** — EJScreen has an NPE (National Priorities List proximity) indicator but it's modeled from facility locations.
- **Individual addresses** — Resolution is census block group (~1,000–5,000 people).
- **Current year** — EJScreen is updated annually; the current version may lag by 12–18 months.

## Refresh cadence
EPA updates EJScreen annually (typically in the fall). The REST API serves the current release:  
https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx

No API key required, but the service can be slow (5-10 second response times). Bedrock fetches live per assessment.

## Known limitations
1. **Currently non-functional in Bedrock**: EJ scores return 0 for all addresses due to an unresolved API integration issue. This is the most significant scoring gap — urban/disadvantaged areas are understated by 15-25 points. (See ROADMAP.md "In Progress".)
2. **API reliability**: The EJScreen REST API has documented uptime issues and slow response times. A static nationwide bundle (by census block group FIPS) would be more reliable.
3. **Percentile ≠ absolute burden**: A block group can rank at the 95th percentile for environmental burden while having lower absolute pollution than some 80th-percentile block groups in other regions, because ranks are relative to the national distribution.
4. **Not designed for individual reports**: EJScreen was designed for community-level screening, not address-level assessments. EPA explicitly cautions against using it as a definitive risk assessment tool.
