# EPA ECHO — Enforcement and Compliance History Online

**What it covers**: EPA-regulated facilities under the Clean Air Act (CAA), Clean Water Act (CWA), and Resource Conservation and Recovery Act (RCRA). Includes facility locations, regulatory program identifiers, compliance status, and enforcement actions. Overlaps with TRI (Toxics Release Inventory) for air emitter classification.

**What it doesn't cover**: State-only regulated facilities, unregistered sites, facilities that closed before ECHO record creation. Agricultural operations are largely excluded. Voluntary cleanup sites not under EPA orders.

**Used for**: Proximity layer — counts ECHO-regulated facilities within a radius of the target address, flags significant non-compliance (SNC) facilities, and identifies TRI emitters. Also used for the SCVI CPI (Contamination Pressure Index) sub-score.

**Refresh cadence**: ECHO data is updated quarterly by EPA. The scoring engine queries the ECHO REST API live at assessment time (no bundled snapshot). Coverage for recent facility status changes is generally within 90 days.

**Known limitations**:
- SNC (Significant Non-Compliance) status reflects regulatory findings, not actual pollution levels. A facility with zero emissions can technically be in SNC for paperwork violations.
- Radius-based proximity scoring (number of facilities within X miles) does not account for wind direction, watershed topology, or plume dispersion.
- ECHO API can be slow or return timeouts for large radius queries, causing degraded scores. The scoring engine falls back to partial data rather than failing completely.
- Facilities that have closed and been delisted may still appear in historical queries.
- TRI emitter classification from ECHO does not reflect actual emission quantities — only that the facility files TRI reports.

**Source**: EPA ECHO REST API — https://echo.epa.gov/tools/web-services
