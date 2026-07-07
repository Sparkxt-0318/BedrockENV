# EPA ECHO — Enforcement and Compliance History Online

## What it covers
EPA's integrated compliance and enforcement database covering facilities regulated under the Clean Air Act (CAA), Clean Water Act (CWA), Clean Water Act stormwater, Resource Conservation and Recovery Act (RCRA), and Safe Drinking Water Act (SDWA). For each regulated facility, ECHO provides: location coordinates, regulatory programs, compliance history, inspection records, enforcement actions, and penalty amounts.

Bedrock specifically uses ECHO to identify:
- **Regulated facilities** within a radius (air/water/waste permits)
- **Significant Non-Compliance (SNC)** status — facilities in serious violation
- **TRI (Toxic Release Inventory) emitters** — facilities releasing toxic chemicals to air/water/land
- **ECHO-Mapper data** for the Mapbox contamination layer in reports

## What it doesn't cover
- Facilities that are not required to have EPA permits (small operations below thresholds)
- State-only regulated facilities (many states have additional programs not in ECHO)
- All TRI data — ECHO's TRI coverage may lag the TRI annual release

## How Bedrock uses it
Live radius query in `lib/data-sources/epa-echo.ts`. Returns facility count, SNC count, TRI emitter count, and nearest facility details. Used in both the proximity layer and the soil layer (contamination pressure). Also queried separately by `epa-tri.ts` for TRI-specific data.

## Refresh cadence
Live API — ECHO is updated as facilities report and EPA processes submissions. Annual TRI submissions appear in ECHO approximately 18 months after the reporting year.

## Known limitations
- API response time varies; Bedrock applies a 2× timeout (8s) for ECHO queries
- Some facilities have missing or incorrect coordinates
- SNC status is a lagging indicator — a facility may be out of compliance before ECHO reflects it
- Not all releases are reported (small-quantity exemptions, emergency releases)

## Source
EPA ECHO: https://echo.epa.gov/
EPA TRI: https://www.epa.gov/toxics-release-inventory-tri-program
