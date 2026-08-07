# EPA ECHO — Enforcement and Compliance History Online

## What it covers
Regulated facilities (air, water, hazardous waste) within a configurable radius. Includes NPDES (water discharge) permits, CAA (air) permits, RCRA (hazardous waste) handlers, and Significant Non-Compliers (SNC) — facilities with active enforcement actions.

**Key signals extracted**:
- Total regulated facilities count within 5km
- TRI (Toxics Release Inventory) reporters in radius
- Significant Non-Compliers (SNC) — facilities under active enforcement
- Facility types (SIC codes for industrial classification)

**API endpoint**: EPA ECHO Facility Search REST API

## What it doesn't cover
- Off-permit discharges and spills (unless resulting in formal enforcement action)
- Facilities below regulatory thresholds (small emitters not required to report)
- Decommissioned/closed facilities (historical impact without current listing)
- Dioxin contamination if from historical, state-managed sites (not ECHO-listed)

## Refresh cadence
ECHO is updated quarterly. Bedrock queries live.

**Live API**: `lib/data-sources/epa-echo.ts`
**Timeout**: 10 seconds; API experiences intermittent timeouts.

## Known limitations
1. **Timeout rate**: ECHO API is slow and times out under load, especially during peak hours. Timeouts drop proximity score, understating industrial risk.
2. **Radius sensitivity**: 5km default radius may miss facilities in sprawling industrial corridors. 10km would capture more but increase false positives for dense urban areas.
3. **SNC lag**: Significant Non-Complier status is updated quarterly; new violations may not appear for weeks.

## Scoring integration
Layer: Proximity (20% weight). Sub-component: regulated facility density and SNC count. Formula in `lib/scoring/proximity-scorer.ts`.
