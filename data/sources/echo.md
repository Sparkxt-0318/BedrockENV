# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities near a query point, including:
- Facilities regulated under CAA (Clean Air Act), CWA (Clean Water Act), RCRA
  (hazardous waste), SDWA (Safe Drinking Water Act)
- TRI (Toxic Release Inventory) reporters
- Significant Non-Compliance (SNC) status flags
- Compliance status per program (in violation / no violation / unknown)

Query radius: 3 miles (default). Returns up to 25 facilities sorted by distance.
Two-step API: `get_facilities` → QueryID → `get_qid` for facility rows.

## What it does NOT cover
- Facilities not registered in ECHO (pre-1980 legacy sites may be absent)
- Actual release quantities (only presence/compliance status)
- Facilities deregistered or closed before ECHO's coverage window
- Longitude is not returned in facility rows — all distances are relative to the
  radius filter, not haversine-computed

## Refresh cadence
Live EPA database — queried in real time at assessment time.
ECHO data lags enforcement actions by weeks to months. Compliance determinations
can take 2–5 years to progress through EPA review.

## Known limitations
- Property-level query (radius-based) but no coordinates on returned rows
- Max 25 results — dense industrial corridors may be truncated
- SNC status is a point-in-time snapshot; a facility currently in SNC may have
  been compliant for years and slipped recently
- TRI flag (`TRIFlag`) indicates a facility reported to TRI but doesn't give
  release quantities — use the TRI source for that
- API timeout risk (~5–10s response times common); partial results on timeout
  are silently truncated

## Layer assignment
Proximity layer — regulated facility count and compliance signal.
Also contributes to Air layer via TRI air emitters.
