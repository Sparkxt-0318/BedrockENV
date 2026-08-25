# EPA TRI — Toxics Release Inventory

## What it covers
Annual self-reported releases of ~800 toxic chemicals from ~22,000 industrial facilities (SIC codes with ≥10 employees and using above threshold quantities). Reports total on-site releases (air, water, land, underground injection) and off-site transfers. Facility coordinates available via FRS (Facility Registry Service).

## What it doesn't cover
- Facilities below reporting thresholds (e.g., small manufacturers, agriculture)
- Releases from non-TRI-listed chemicals
- Historical contamination (soil plumes, legacy pollution pre-1987)
- Accidental spills (use NRC HMIRS for those)
- Non-industrial sources (transportation, residential)

## API
EPA ECHO (Enforcement and Compliance History Online): `https://echo.epa.gov/tools/web-services/facility-search`
Also available via EPA Envirofacts TRI API.

## Refresh cadence
Annual. Data for year Y is published in October of year Y+1 (18-month lag). Current dataset: TRI 2023 (published October 2024). Check: https://www.epa.gov/toxics-release-inventory-tri-program/tri-data-and-tools

## Known limitations
- Self-reported data with known underreporting; EPA audits catch some but not all errors
- Thresholds for reporting mean many small facilities are excluded
- Air releases modeled, not measured — RSEI cancer risk model provides better health impact estimates
- No concentration data (total mass only)

## Bedrock usage
Proximity layer "TRI air emitters" sub-score. Facilities within configurable radius of address weighted by release volume. See `lib/data-sources/epa-tri.ts`.
