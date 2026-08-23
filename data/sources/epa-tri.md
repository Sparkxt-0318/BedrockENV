# EPA TRI — Toxics Release Inventory

## What it covers
Annual self-reported chemical release data from industrial facilities. Facilities above certain thresholds (employee count + chemical use) must report releases to air, water, land, and underground injection. Covers ~600 chemicals.

Returns by county: facility count and estimated on-site release quantities (in lbs) for the most recent reporting year available.

## What it doesn't cover
- Facilities below reporting thresholds (smaller manufacturers, service industries)
- Agricultural pesticide releases (separate reporting regime)
- Accidental releases not meeting ongoing-release definitions
- Exact per-facility release totals at county level (API limitation — see Known Limitations)

## How we use it
EPA Envirofacts REST API (`https://data.epa.gov/efservice/TRI_REPORTING_FORM`) filtered by state abbreviation + county name. Used in the Air layer scoring as a proxy for industrial air emissions burden.

## Refresh cadence
Reporting year data is submitted by facilities in July for the prior calendar year. EPA publishes the dataset ~October each year. We query the API live with the current year minus one as the default reporting year.

## Known limitations
- **County-level only** — TRI_RELEASE_QTY (which has per-chemical totals) doesn't support COUNTY_NAME filtering. We use `one_time_release_qty` from TRI_REPORTING_FORM as a lower-bound proxy, not total annual release. Actual releases are higher.
- API is slow (3–5 second response times).
- County name matching can fail for non-standard county name spellings (e.g., "St. Louis" vs "Saint Louis"). The adapter normalizes common cases.
- Release data is self-reported — facility compliance is not guaranteed.
- No API key required. Rate limits are generous but response times are high.
