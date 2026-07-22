# Census ACS B25034 — Housing Age as Lead Risk Proxy

## What it covers
American Community Survey Table B25034 (Year Structure Built) at the census block group level. Bedrock uses the pre-1950 and pre-1986 housing stock percentages as a proxy for lead plumbing risk:

- **Pre-1950 housing**: Very high probability of lead service lines from the street to the building.
- **Pre-1986 housing**: Lead solder was commonly used in plumbing until banned by the Safe Drinking Water Act amendments of 1986. High probability of lead solder in interior plumbing.

This proxy is used in the water scoring layer as a `LeadRiskData` sub-component when actual water lead testing data is unavailable.

## What it doesn't cover
- **Actual lead in water**: Housing age predicts the *presence* of lead materials, not actual water lead concentrations. Corrosion inhibitor treatment (e.g., orthophosphate) can dramatically reduce leaching even in old pipes.
- **Lead paint** — housing age also predicts lead paint risk but that's a different exposure pathway (ingestion/dust inhalation, not water).
- **Recent pipe replacements**: Many utilities and homeowners have replaced lead service lines and solder since the Lead and Copper Rule revisions. The housing age proxy doesn't reflect replacements.
- **Commercial and industrial buildings**: ACS Table B25034 covers occupied housing units; commercial/industrial properties aren't included.
- **Military housing**: Military base housing doesn't appear in ACS block groups.

## Refresh cadence
Census ACS 5-year estimates are updated annually (with a ~2-year lag). The current data uses ACS 2022 5-year estimates (2018-2022). Bedrock queries the Census Bureau API live per assessment.

No API key required for the Census API, though rate limits apply.

## Known limitations
1. **Rough proxy**: Housing age is a distal predictor of lead exposure. A 1920s house with an updated water service line and no lead solder may have zero lead risk; a 1980s house with original plumbing and acidic water may have significant risk.
2. **Block group variation**: Block groups average 1,500 people. An address in a block group with 40% pre-1950 housing may itself be a 2020 condo.
3. **No pipe inventory data**: EPA's Lead and Copper Rule Revisions (2021) require utilities to submit service line inventories, but public disclosure of granular data is still in early stages. This will eventually replace the housing age proxy.
4. **ACS data suppression**: Small block groups may have suppressed housing age estimates (margins of error too large). In these cases, county-level estimates are used as fallback.
