# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
National percentile ranks (0–100) for 11 environmental indicators and 6
demographic indicators at the census block group level. Key indicators:
- PM2.5, ozone, diesel PM, traffic proximity
- Lead paint, Superfund proximity, RMP facility proximity
- Hazardous waste proximity, wastewater discharge
- Demographic index, minority %, low-income %, linguistic isolation %

API: EPA EJScreen REST broker (no API key required).

## What it does NOT cover
- Property-level measurements (block group is typically 600–3,000 people)
- Temporal trends (snapshot from most recent ACS vintage)
- PFAS or emerging contaminants (not yet integrated into EJScreen indicators)
- Tribal lands and territories may have incomplete block group coverage

## Refresh cadence
EJScreen is updated annually (tied to ACS 5-year estimates). The REST API
serves the current release. No bundle needed — live API query.
Check EPA EJScreen release notes for vintage year of the current dataset.

## Known limitations
- **Currently returning 0 for all addresses** (EJ layer marked In-Progress in ROADMAP)
  — integration requires CDC SVI + EJScreen combined, pending API stability fixes
- API response times are slow (5–10s typical), occasionally timing out
- Percentile ranks are relative — a 50th percentile area may still have elevated
  absolute contamination in a generally polluted region
- Block group boundaries don't align with neighborhood mental models; a single
  address may be at the edge of a block group with very different characteristics
  than its neighbors
- Suppressed values for small block groups appear as null

## Layer assignment
Environmental Justice (EJ) layer — primary signal.
