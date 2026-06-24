# EPA AQS — Air Quality System (Annual Summaries)

## What it covers
- Annual PM2.5 design values (98th percentile 24-hour and annual mean) from federal reference monitors
- Annual ozone design values (4th-highest daily max 8-hour average)
- Used in Bedrock as fallback when OpenAQ real-time data is unavailable
- Monitor network: ~1,000 PM2.5 monitors and ~1,500 ozone monitors nationwide

## What it doesn't cover
- Real-time or daily data (annual summaries only in this integration)
- Air toxics (HAPs, VOCs, benzene) — tracked by NATA but not integrated into Bedrock
- Indoor air quality
- Wood smoke, prescribed burns, wildfire smoke (captured in PM2.5 data but not separated out)

## Refresh cadence
- EPA publishes annual design values each spring for the prior calendar year (e.g., 2024 values available ~May 2025)
- Current Bedrock integration queries the AQS API for the most recent annual value within 50km of the address
- API: EPA AQS REST API (`https://aqs.epa.gov/data/api/`) — requires API key registration (free)

## Known limitations
- **Requires EPA API key** — same gap as OpenAQ; must be configured in environment variables
- Annual summaries mask seasonal and episodic peaks — a wildfire smoke event raises PM2.5 for weeks but may not push annual mean above NAAQS
- Monitor siting criteria (not near roads, not in industrial zones) means monitors systematically understate exposure in those microenvironments
- Rural areas have sparse AQS coverage; many counties have no monitor within 50km
- 2024 EPA PM2.5 NAAQS tightened from 12 µg/m³ to 9 µg/m³ annual — scoring thresholds updated to reflect new standard
