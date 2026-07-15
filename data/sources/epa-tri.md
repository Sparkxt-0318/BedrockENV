# EPA TRI — Toxics Release Inventory

## What it covers
Annual self-reported releases of ~800 listed toxic chemicals from manufacturing and other industrial facilities. Includes pounds released to air, water, land, and underground injection, plus off-site transfers. Bedrock uses TRI via the ECHO API — TRI-reporting facilities appear with a `TRI` program flag in ECHO results.

## What it doesn't cover
- Facilities below reporting thresholds (10,000 lb/year for most chemicals; 100 lb/year for persistent bioaccumulatives like dioxins)
- Agricultural chemical applications (fertilizers, pesticides)
- Chemical releases from accidental spills or emergencies (those are reported separately via EPCRA Section 304)
- Hazardous waste transport

## Source
TRI data accessed via EPA ECHO facility search. Full TRI database also available at EPA Envirofacts: `https://data.epa.gov/efservice/TRI_FACILITY/`.

## Refresh cadence
Annual. TRI reports for year N are due in July of year N+1 and appear in ECHO within 30–60 days. Most current release as of July 2026: TRI 2024 (reporting year 2023).

## Known limitations
- Self-reported data — accuracy depends on facility compliance with reporting requirements.
- TRI identifies facilities, not exposure levels. A high TRI release volume near a property does not automatically translate to human exposure (depends on dispersion, prevailing winds, distance).
- The reporting threshold means many small emitters are invisible. A facility releasing 9,000 lb/year of a TRI chemical does not appear.
- ECHO does not return precise longitude for facility rows, so Bedrock cannot compute exact distance from TRI facilities; proximity is bounded by the radius filter.
