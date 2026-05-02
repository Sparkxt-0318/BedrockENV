# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
National percentile ranks (0–100) for multiple environmental and demographic indicators at the census block group level, including: EJ Index (overall), PM2.5, ozone, diesel PM, traffic proximity, lead paint, Superfund proximity, RMP facility proximity, underground storage tanks, wastewater discharge, and demographic burden indicators (low income, minority, linguistic isolation, less than high school education, under 5, over 64).

Bedrock uses the overall EJ Index percentile and demographic indicators in the **EJ layer** scoring.

**Current status**: EJScreen is non-functional without external API access to the EJScreen REST broker endpoint. EJ layer scores return 0 for all addresses in the current environment. This is the largest single coverage gap in the scoring pipeline.

## What it doesn't cover
- Individual address-level data (block-group aggregation)
- Forward-looking projections
- Private well contamination, agricultural runoff, or other unregulated sources

## Refresh cadence
EPA updates EJScreen annually, typically in Q3/Q4. The REST API reflects the current release. No local bundle — queries hit the live API. Bedrock caches responses for **30 days** per block group.

## Known limitations
- **Critical gap**: EJScreen API access requires a functional external network connection to `ejscreen.epa.gov`. In the current deployment environment, this is unavailable, causing the EJ layer to return 0 for all addresses. This affects the composite score by up to 15 points (EJ weight = 0.15).
- EJScreen percentiles are nationally normalized, not locally normalized. A census block group in an environmental justice community may score moderate nationally but extreme locally.
- Block group boundaries don't respect neighborhood boundaries, watershed divides, or other ecologically relevant units.
- EJScreen's environmental indicators partially overlap with other Bedrock sources (Superfund, facilities, air) — there is intentional redundancy in the scoring model.
