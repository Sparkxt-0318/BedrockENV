# EPA TRI — Toxics Release Inventory

## What it covers
County-level toxic release data: total on-site release quantity in pounds, unique facility count, and top-5 chemicals by reported release weight. Covers the 2022 reporting year (2021 fallback).

## What it doesn't cover
- Current-year data (TRI is annual; the module hardcodes 2022)
- Actual total annual releases — the `one_time_release_qty` field used is explicitly a lower-bound proxy (the real annual total is in `TRI_RELEASE_QTY`, which the Envirofacts API cannot filter by county)
- Sub-county facility locations (only county totals available via this API)
- Transfer-to-off-site quantities (only on-site releases)

## How it works
Live EPA Envirofacts REST API calls:
`https://data.epa.gov/efservice/TRI_REPORTING_FORM/STATE_ABBR/{state}/COUNTY_NAME/{county}/REPORTING_YEAR/2022/rows/0:499/JSON/`
Fallback to 2021 if the 2022 request fails. County name normalized to uppercase with "COUNTY" suffix stripped. Timeout: 25 s, retries: 2 (primary); 1 (fallback).

## Refresh cadence
Live API calls on every request. TRI data is annual; the module queries the 2022 reporting year by default and will not advance to newer years without a code change.

## Known limitations
- `one_time_release_qty` is a lower-bound proxy — not comparable to actual annual total release
- Capped at 499 rows; heavily industrialized counties may be truncated
- Data hardcoded to 2022/2021 — does not automatically query the most recent year
- Envirofacts multi-table JOINs produce Cartesian products; a proper aggregate query is not feasible via this API
- Response latency typically 3–5 s
