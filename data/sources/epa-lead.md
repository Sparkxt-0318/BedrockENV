# EPA Lead — Lead Paint and Soil Lead Data

## What it covers
EPA's lead-related data sources used in the Water and Soil layers. Primarily the Census ACS B25034 housing vintage proxy (pre-1978/pre-1950 housing stock) as a lead paint risk indicator. May also incorporate EPA's LCRR (Lead and Copper Rule Revisions) compliance data when available via SDWIS.

## What it does NOT cover
- Actual soil lead measurements at the property level (no nationwide property-level database exists)
- Blood lead level data (CDC tracks this, not EPA, and it's not freely available at the address level)
- Lead from industrial sources not proxied by housing age (e.g., shooting ranges, battery recyclers, smelters)
- Post-remediation lead abatement status

## Resolution
Tract-level (via Census ACS) or system-level (via SDWIS LCRR data).

## Refresh cadence
ACS data updated annually; SDWIS data updated continuously. Census vintage data changes slowly.

## Known limitations
1. Housing age is a probabilistic proxy — many old homes have been remediated; some newer homes have lead from other sources.
2. The 1978 cutoff (when lead paint was federally banned for residential use) is the regulatory threshold, but high-lead paint was often found in homes built through the early 1960s.
3. LCRR lead action level data in SDWIS may lag actual sampling results by months.

## Authoritative source
https://www.epa.gov/lead — SDWIS LCRR: https://www.epa.gov/dwreginfo/lead-and-copper-rule
