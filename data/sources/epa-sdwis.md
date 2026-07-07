# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Health-based violations, monitoring-and-reporting violations, and enforcement actions for public water systems (PWS) regulated under the Safe Drinking Water Act. Violations include Maximum Contaminant Level (MCL) exceedances for hundreds of regulated contaminants: nitrates, arsenic, lead, coliform, disinfection byproducts, and more. Each violation record includes: PWSID, violation type, analyte, begin/end date, and resolution status.

## What it doesn't cover
- Private wells (no PWSID)
- Contaminants not yet regulated under SDWA (e.g., PFAS prior to 2024 MCLs — use UCMR 5 instead)
- Violations that have been fully resolved and aged off the enforcement tracking system
- Water quality at the point of use vs. the treatment plant

## How Bedrock uses it
Called live via the EPA Envirofacts REST API, filtered to active violations for the resolved PWSID. Violation counts and severity contribute to the water layer score via `fetchSdwisViolations` in `lib/data-sources/epa-sdwis.ts`.

## Refresh cadence
Live API — data is updated by EPA as violations are entered and resolved. No local bundle.

## Known limitations
- Historical violations (e.g., Flint's 2015–2019 lead crisis) may no longer appear if resolved or aged off
- Some systems self-report violations inconsistently
- The API has occasional outages; Bedrock applies a 4s timeout with graceful degradation

## Source
EPA SDWIS: https://www.epa.gov/sdwis/sdwis-federal-reporting-services
EPA Envirofacts SDWIS API: https://data.epa.gov/efservice/
