# EPA TRI — Toxic Release Inventory

## What it covers
Annual toxic chemical release reports for facilities in a county.
Queries `TRI_REPORTING_FORM` via the Envirofacts REST API, filtered by state
abbreviation and county name for the most recent reporting year (2022).
Returns: facility count, top chemicals by release quantity, and a total
on-site release estimate (pounds/year).

## What it does NOT cover
- Facilities below TRI reporting thresholds (generally 25,000 lbs/yr manufactured
  or 10,000 lbs/yr otherwise used, for most chemicals)
- Releases to surface water, groundwater, or off-site transfers (only captures
  `one_time_release_qty` as a proxy — see limitation below)
- Air toxics risk (RSEI cancer risk score would improve this — see ROADMAP)
- Real-time or incident releases (TRI is annual self-reporting)
- Reporting year 2023+ (data typically available 18 months after year-end)

## Refresh cadence
Envirofacts REST API — queries the live database at assessment time.
TRI data for year N becomes available ~July of year N+1.
Currently pinned to reporting year 2022. Update `REPORTING_YEAR` constant
annually in `lib/data-sources/epa-tri.ts`.

## Known limitations
- **County-level resolution only** — cannot do radius queries; the entire county
  gets the same facility count
- `one_time_release_qty` (from `TRI_REPORTING_FORM`) is a lower-bound proxy for
  annual on-site releases. The actual annual total lives in `TRI_RELEASE_QTY`
  which does not support county filtering via Envirofacts (Cartesian product issue)
- Envirofacts TRI responses are slow (3–5s) and can return HTTP 500 on malformed
  county names
- Self-reported data — facilities may under-report; small releases below threshold
  are not captured

## Layer assignment
Proximity layer (facility count signal) and Air layer (TRI air emitters via ECHO).
