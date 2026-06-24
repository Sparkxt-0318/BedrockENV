# EPA ECHO — Enforcement and Compliance History Online

## What it covers
- RCRA (hazardous waste) regulated facilities within a configurable radius of the address
- TRI (Toxic Release Inventory) air-emitting facilities used in air layer (sub-layer: TRI emitters count)
- CWA and CAA permit holders with compliance history
- Significant Non-Compliance (SNC) flags — facilities in formal enforcement action
- Returns facility counts and compliance status; not raw release quantities

## What it doesn't cover
- Facilities operating below TRI reporting thresholds (10,000 lbs use or 25,000 lbs manufacture)
- Permitted facilities with no violations (they appear in count but don't increase SNC score)
- Air emissions data (actual release quantities) — TRI release data is from ECHO but Bedrock uses counts, not lbs released
- Facilities that closed and were removed from the active database (historical industrial presence)

## Refresh cadence
- ECHO is updated on a rolling basis as EPA and state agencies enter enforcement actions
- Bedrock queries live at assessment time using ECHO's facility search API
- API: ECHO REST API (`https://echo.epa.gov/tools/web-services/facility-search`) with radius filter

## Known limitations
- Radius search (default: 3 miles for TRI, varies by layer) returns count only; scoring weights count linearly, not by severity of operations
- SNC status can lag enforcement — a facility may be in violation for months before SNC is formally entered
- Some regulated activities (dry cleaners, auto body shops, small metal finishers) fall below TRI thresholds but contribute meaningful local exposure
- ECHO does not cover oil and gas facilities regulated solely under state programs (common in PA, TX, OK, WY)
- Closed facilities remain in ECHO and may still appear in radius searches even after operations ceased
