# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Violation history for every regulated public water system (PWS) in the US — health-based violations (Maximum Contaminant Level exceedances, treatment technique failures), monitoring & reporting violations, and public notification requirements. Used in two ways:

1. **PWSID resolution** — given a county FIPS, looks up the primary PWS serving that area via the Envirofacts `WATER_SYSTEM` table.
2. **Violation history** — fetches the last 5 years of violations for a known PWSID from `VIOLATION_ENF_ASSOC`.

## What it doesn't cover
- Private wells (~15 million US households)
- Systems serving <25 people (exempt from many rules)
- Water quality at the tap (lead leaching from building pipes is not a PWS violation)
- Real-time conditions — violations are typically filed months after the monitoring period

## Refresh cadence
SDWIS is updated continuously by state primacy agencies. The Envirofacts REST API reflects updates within 24–48 hours. Bedrock caches responses for **30 days** per PWSID.

## Known limitations
- Monitoring & Reporting (M&R) violations (the most common type) indicate a procedural failure, not necessarily actual contamination. The scorer weights M&R violations less than health-based violations, but they still inflate counts in some systems.
- County-level PWSID resolution picks the dominant (largest-population) system. An address served by a smaller secondary system will be misattributed.
- The Envirofacts API has variable response times (2–10s) and occasionally returns inconsistent results for the same PWSID. The fetch includes retry logic.
- Some violations are voided or rescinded after filing. SDWIS may retain them; the scorer does not filter rescinded violations.
