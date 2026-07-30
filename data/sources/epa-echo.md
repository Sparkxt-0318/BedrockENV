# EPA ECHO — Enforcement and Compliance History Online

## What it covers
ECHO consolidates compliance and enforcement data for facilities regulated
under major environmental statutes:
- Clean Air Act (CAA) — air permits, violations, inspections
- Clean Water Act (CWA) — NPDES discharge permits, effluent violations
- Resource Conservation and Recovery Act (RCRA) — hazardous waste handlers
- Safe Drinking Water Act (SDWA) — public water systems
- Toxic Release Inventory (TRI) — self-reported toxic releases

Bedrock uses ECHO for two purposes: (1) radius search for regulated facilities
near an address (proximity layer), and (2) TRI air-emission sub-scores (air layer).

## What it doesn't cover
- State-only permits not entered into federal systems
- Underground injection wells (UIC) not yet integrated
- Facilities that closed before ECHO's historical window
- Spills and incidents not associated with a permitted facility

## Refresh cadence
ECHO data is updated weekly from EPA's underlying systems (ICIS-Air, ICIS-NPDES,
RCRAInfo, SDWIS, TRI). Bedrock queries live API per assessment; no local bundle.

## Known limitations
- **Significant Non-Compliance (SNC) flag**: ECHO's SNC designation is EPA's
  algorithm, not a neutral measure — it reflects recent violations but may lag
  for facilities that have corrected issues without formal closure.
- **Radius search accuracy**: The FRS facility coordinates in ECHO have variable
  precision. Some rural facilities may be geocoded to the county centroid.
- **TRI is self-reported**: Facilities determine what to report. Under-reporting
  is a known issue, especially for smaller facilities below reporting thresholds.
- **Air layer dependency**: Without the ECHO TRI query, the air layer loses the
  industrial emitters sub-component. The nonattainment sub-component still works
  from the bundled Green Book data.
