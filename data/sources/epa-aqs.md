# EPA AQS — Air Quality System

## What it covers
Historical annual PM2.5 and ozone summary statistics from EPA's regulatory monitoring network. Bedrock queries the AQS Data Mart API (`annualData/byLatLng`) for monitors within ~50 km of the query address, returning arithmetic mean, first maximum value, observation count, and site name for the most recent completed year.

**Requires API credentials**: `EPA_AQS_EMAIL` and `EPA_AQS_KEY` (free EPA registration). Without credentials, this source skips gracefully.

## What it doesn't cover
- Real-time or recent readings (AQS annual summaries lag 3–6 months)
- Non-criteria pollutants (PFAS, metals, VOCs are in AQS but not queried here)
- Areas without regulatory monitors — AQS is the densest urban network but has significant rural gaps

## Refresh cadence
EPA AQS annual summaries are published roughly 3–6 months after the calendar year ends. Data for 2025 would be available mid-2026. The client queries for the current year and falls back to the prior year if the current year has no data. Bedrock caches AQS responses for **24 hours**.

## Known limitations
- Rate limited to 5 requests/minute per API key. Multiple concurrent assessments can hit this limit; the client does not retry 429s.
- The closest monitor may be in a different airshed (across a ridge, on the other side of an urban highway) from the query address.
- Annual averages smooth out pollution peaks that matter for health. A site with annual PM2.5 of 8 µg/m³ could still have high-pollution days well above the 24-hour standard.
- AQS coverage is thinnest in exactly the places most exposed to industrial pollution (rural areas with fewer monitoring requirements).
