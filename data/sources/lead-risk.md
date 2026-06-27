# Lead Service Line Risk Proxy (Census ACS B25034)

## What it covers
Estimates the probability of lead plumbing infrastructure using Census housing age
data (ACS Table B25034 — Year Structure Built) at the census block group level.
Key thresholds:
- Pre-1950: high probability of lead service lines
- Pre-1986: lead solder commonly used in plumbing (SDWA amendments banned it in 1986)

Returns: percent pre-1950 housing, percent pre-1986 housing, risk tier
(HIGH / ELEVATED / MODERATE / LOW), total housing unit count.

API: Census Bureau ACS API (no key required for public access).

## What it does NOT cover
- Actual lead service line presence (requires utility-level LSL inventories)
- Water system lead treatment programs (orthophosphate, etc.) that reduce risk
- Private well lead exposure (pipes, not well water, are the primary source)
- Post-1986 plumbing that may still have non-lead-free fixtures
- Lead paint (separate issue from plumbing; EJScreen covers this)

## Refresh cadence
ACS 5-year estimates are updated annually (current: 2018–2022 ACS).
Queried live at assessment time (no bundle). Cache: 90 days.

## Known limitations
- **Requires census tract + block group** — addresses geocoded via Mapbox (without
  Census tract resolution) receive no lead risk data
- Housing age is a proxy, not a direct measurement — newer structures in historic
  neighborhoods may connect to old main lines
- Military bases (e.g., Camp Lejeune) have no ACS housing data → no lead proxy
- Block group resolution (600–3,000 people) averages over significant within-group
  variation in housing age
- Does not account for utility LSL replacement programs or pipe materials

## Layer assignment
Water layer — lead risk infrastructure proxy component.
