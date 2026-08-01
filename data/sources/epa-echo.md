# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities under the Clean Air Act (CAA), Clean Water Act (CWA), and Resource Conservation and Recovery Act (RCRA). Includes air emitters (TRI reporters), industrial dischargers (NPDES permits), and hazardous waste handlers. Proximity data: facilities within a configurable radius of a queried point.

## What it doesn't cover
- Unregulated small businesses (dry cleaners, auto shops, etc.) below federal thresholds
- Legacy contamination from facilities that have closed and been removed from the registry
- Agricultural operations (most farming is exempt from ECHO reporting)
- Federal facilities (military bases, national labs) with separate reporting streams

## Refresh cadence
Quarterly for TRI data; continuous for compliance/enforcement records. The ECHO API is live.

## Known limitations
- ECHO radius queries can time out (503) under high API load — BedrockENV falls back to partial coverage when this occurs
- Significant Non-Compliance (SNC) flag reflects the most recent compliance quarter — a historically non-compliant facility may appear clean if it resolved violations recently
- TRI release quantities are self-reported by facilities; underreporting is documented in the literature

## How BedrockENV uses it
`lib/data-sources/epa-echo.ts` queries the ECHO Facilities search API for regulated facilities within a 5-mile radius of the input address. Facility count, SNC count, and TRI emitter count feed into both the proximity layer and air layer (TRI sub-component).

## Source
EPA ECHO: https://echo.epa.gov/
API documentation: https://echo.epa.gov/tools/web-services
