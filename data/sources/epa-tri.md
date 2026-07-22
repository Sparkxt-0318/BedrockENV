# EPA TRI — Toxics Release Inventory

## What it covers
Annual self-reported release estimates from industrial and federal facilities that manufacture, process, or otherwise use toxic chemicals above threshold quantities. ~22,000 facilities report annually. Data includes: facility name, location, chemical name, and estimated on-site release quantities (air, water, land) in pounds.

Bedrock queries TRI via the EPA Envirofacts REST API, filtering by state + county, to get facility counts and a proxy for total release volume for the air scorer. TRI reporter flag is also surfaced in ECHO proximity data.

## What it doesn't cover
- **Facilities below reporting thresholds**: Many small facilities are exempt (e.g., <10 employees, or use below 10,000 lbs/year threshold for most chemicals).
- **All toxic chemicals**: TRI covers ~800 listed chemicals. PFAS are newly added (starting with 2020 reporting year for some compounds) but most PFAS are not yet listed. Dioxins, some pesticides, and many emerging contaminants are absent.
- **Actual ambient concentrations**: TRI is self-reported release estimates, not measured environmental concentrations. Releases disperse at rates dependent on weather, geography, and chemistry.
- **Non-permitted releases (spills, accidents)**: Only routine and scheduled releases; accidental spills are reported separately under EPCRA §304 (LEPC notifications), not in TRI.

## Refresh cadence
EPA publishes each year's TRI data approximately 12-18 months after the reporting year end (e.g., 2023 data published late 2024). Bedrock queries Envirofacts live per assessment, filtered to the most recent available reporting year.

No API key required, but responses are slow (3-5 seconds).

## Known limitations
1. **Self-reporting accuracy**: TRI relies on facility self-reporting. Misreporting, estimation errors, and methodological inconsistencies are common. EPA does not independently verify all submissions.
2. **County-level filter only**: Envirofacts TRI does not reliably support lat/lng radius queries for release quantities (the join between TRI_REPORTING_FORM and TRI_RELEASE_QTY produces Cartesian products). Bedrock uses county-level counts as a proxy.
3. **Release quantity as proxy**: `one_time_release_qty` from TRI_REPORTING_FORM is used as a lower-bound proxy for on-site releases because the standard release quantity join fails. Actual total releases may be substantially higher.
4. **Delayed PFAS coverage**: Even though EPA began requiring PFAS reporting under TRI starting with 2020 data, only facilities using above-threshold quantities report. Most distributed PFAS contamination (consumer products, water systems) is not captured.
