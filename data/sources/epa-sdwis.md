# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Federal violations by public water systems (PWS): Maximum Contaminant Level (MCL)
violations, treatment technique violations, monitoring/reporting violations, and public
notification failures. Also contains water system inventory (PWSID, service area,
population served, source type, phone number).

## What it doesn't cover
- Private wells
- State-only violations not reported to EPA
- Historical violations that have been formally resolved and removed from the active
  violation list (violations "age off" after being addressed)
- Informal enforcement actions

## Refresh cadence
Near real-time via EPA Envirofacts REST API (`https://data.epa.gov/efservice/`).
No local bundle required. Each assessment queries live. Cache: 7 days per PWSID.

## Known limitations
- Violations from the Flint water crisis (2015–2019) may have aged off the current
  system view — the database reflects current violation status, not history
- Military bases and tribal systems may have different reporting obligations
- PWSID resolution (matching an address to its water system) can fail in rural areas
  or where Census block → PWSID mapping is ambiguous

## Bedrock usage
Water layer sub-component. PWSID resolved by Census block via SDWIS inventory.
Resolution: AREA-LEVEL (water system). Cache: 7-day TTL via Supabase.
