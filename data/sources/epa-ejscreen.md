# EPA EJScreen — Environmental Justice Screening Tool

## What it covers
National percentile ranks (0–100) for environmental and demographic indicators at the census block group level. Key indicators:
- Overall EJ index and supplemental EJ index
- PM2.5, Ozone, Diesel PM (air quality indicators)
- Traffic proximity, Lead paint, Superfund proximity (environmental burden indicators)
- Wastewater discharge, RMP facility proximity (additional hazard indicators)
- Demographic index (low income + people of color percentile)

## What it doesn't cover
- Individual facility-level data (use ECHO for that)
- Real-time pollution measurements (EJScreen is a multi-year composite)
- Drinking water contamination (separate from the environmental burden indicators)

## How we use it
Live API query to `https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx` with lat/lng coordinates. Returns national percentile ranks for all indicators. Used in the EJ layer scoring (15% weight in the composite score) to capture environmental justice dimensions not covered by the other four layers.

**Status: Currently non-functional in production** — the EJScreen API works but requires a network path that isn't consistently available in the current deployment. EJ scores return 0 for all addresses until this is resolved. See ROADMAP.md.

## Refresh cadence
EJScreen data is updated annually (typically released in fall each year). Version is embedded in API responses. No local bundle — live API at assessment time.

## Known limitations
- Block-group resolution: a single block group can span diverse land uses.
- API response times are 5–10 seconds (slow, potential timeout source).
- No API key required — but rate limits apply; heavy batch use can be throttled.
- Rural or unmapped areas may return null/empty indicators (no monitoring).
- Percentile ranks are relative to national distribution — a 50th percentile reading means average burden, not necessarily safe.
- Data currently unavailable without external API access in production (see ROADMAP.md).
