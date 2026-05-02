# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities (Clean Air Act, Clean Water Act, RCRA hazardous waste, SDWA, TRI) within a configurable radius (default 3 miles) of the query address. Returns facility name, compliance status, significant non-compliance (SNC) flag, and program flags (AIR, TRI, CAA HPV). Used to drive the **Proximity layer** facility count and the **Air layer** TRI emitter sub-score.

## What it doesn't cover
- Unregulated small emitters and agricultural operations
- Facilities that closed before ECHO records begin (~1997+)
- Underground storage tanks (USTs) — covered separately by state programs
- Facilities that self-reported but were never inspected
- Exact distance: the ECHO API does not return longitude in facility rows, so haversine distances cannot be computed. Bedrock reports facilities as "within radius" rather than precise distances.

## Refresh cadence
ECHO data is updated weekly from ICIS (Integrated Compliance Information System). Bedrock caches ECHO responses for **7 days**.

## Known limitations
- Significant Non-Compliance (SNC) flag persistence: a facility may be flagged SNC for a minor historical violation and remain so for years after resolution.
- The two-step ECHO API (get_facilities → QueryID → get_qid) has latency of 3–8s and occasionally returns mismatched QueryID responses.
- Facilities with `FacActiveFlag: 'N'` (inactive) are excluded by the client but ECHO's active-flag data is not always current.
- The 3-mile default radius is appropriate for urban/suburban areas but may miss industrial corridors in rural areas where facilities are spaced further apart.
- TRI flag (`TRIFlag: 'Y'`) indicates the facility reports to the Toxics Release Inventory, not that it is currently releasing toxics above a threshold.
