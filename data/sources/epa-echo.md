# EPA ECHO — Enforcement and Compliance History Online

## What it covers
EPA's ECHO database tracks regulated facilities under the Clean Air Act, Clean Water Act, Resource Conservation and Recovery Act (RCRA), and Safe Drinking Water Act. For Bedrock's proximity layer:
- Facility location (lat/lng) and name
- Regulatory program (CAA, CWA, RCRA, SDWA)
- Significant Non-Compliance (SNC) status
- Toxics Release Inventory (TRI) reporters — facilities releasing ≥threshold amounts of listed chemicals to air, water, or land

Bedrock queries ECHO for facilities within 5 miles of a geocoded address. The proximity scorer counts facility density, SNC designations, and TRI reporter presence.

## What it does NOT cover
- Pre-industrial legacy contamination (closed facilities not in ECHO)
- Small/exempt facilities below reporting thresholds
- Contamination that has already been remediated and is no longer tracked
- State-only regulated facilities not reporting to federal ECHO

## Refresh cadence
EPA updates ECHO quarterly. Bedrock queries the live ECHO REST API. SNC status and TRI reports have a 1–2 year reporting lag (companies file annual TRI reports, EPA processes and publishes ~18 months later).

## Known limitations
- **TRI reporting lag**: TRI data for year N is published approximately 18 months later. Current TRI data in ECHO typically reflects emissions from 2 calendar years ago.
- **Threshold-based reporting**: TRI only captures facilities releasing above threshold quantities. Smaller chronic releases below reporting thresholds are invisible.
- **API timeouts**: ECHO's REST API has intermittent performance issues, particularly for high-traffic industrial corridors (Newark NJ, Houston TX). Timeouts are logged and trigger partial-coverage flags.
- **Remediated sites**: Closed facilities remain in ECHO but may reflect historical, not current, operations.
