# EPA Brownfields

## What it covers
Contaminated or formerly contaminated land parcels ("brownfields") near the query point.
Uses the EPA NEPAssist ArcGIS REST service (layer 13 — Brownfields).
Returns: site name, address, registry ID, cleanup status, and coordinates for
haversine distance calculation.

Query radius: 2 miles (default), max 50 results.

## What it does NOT cover
- Remediated sites that were delisted from the brownfields program
- State-managed brownfields programs (only EPA-tracked sites)
- Unknown contamination (sites that haven't been assessed yet)
- Voluntary cleanup programs in states that don't report to EPA
- The actual contaminants at each site (only presence/cleanup status)

## Refresh cadence
Queried live via ArcGIS REST at assessment time (no bundle).
EPA brownfields data is updated as assessments and cleanup actions are completed.
Cache: 30 days.

## Known limitations
- **Highly prone to API outages** — the EPA NEPAssist ArcGIS service has a history
  of HTTP 503 errors (confirmed 2026-04: 503 across all assessment runs, crushing
  soil scores to near-zero). All known brownfield score collapses trace to this
- Switchwed from Envirofacts FRS endpoint (2026-04) because FRS `FRS_PROGRAM_FACILITY`
  no longer carries lat/lon columns, returning spatially incorrect results
- ArcGIS error envelopes (`{error:{code,message}}`) return HTTP 200 — must inspect body
- Cleanup status values are inconsistent string labels; normalization is approximate
- No information about type or severity of contamination — a site labeled "cleanup
  complete" may still have residual contamination

## Layer assignment
Soil layer — brownfield proximity component.
Also visualized on the Contamination Map in showcase reports.
