# EPA AQS — Air Quality System

## What it covers
Annual PM2.5 and ozone summaries from the nearest AQS monitor(s) to the query point.
Returns annual mean concentrations, maximum values, observation counts, and monitor
coordinates for EPA NAAQS comparison.

API: EPA AQS Data Mart (`/annualData/byLatLng`). Requires free registration:
- `EPA_AQS_EMAIL` — registered email
- `EPA_AQS_KEY` — API key from AQS Data Mart registration

## What it does NOT cover
- Real-time air quality (AQS annual summaries lag ~18 months)
- Rural areas with no nearby monitor — may return zero results
- Air toxics (HAPs, benzene, etc.) — AQS covers NAAQS criteria pollutants only
- Indoor air quality
- Monitors more than ~50 km from the query point are excluded

## Refresh cadence
AQS annual summaries for year N are published ~July/August of year N+1.
Queried live at assessment time. Falls back to prior year if current year has
no data yet. Rate limit: 5 requests/minute (no retry on 429).

## Known limitations
- **Requires API credentials** — without `EPA_AQS_EMAIL` + `EPA_AQS_KEY`, the
  air layer falls back to OpenAQ and nonattainment status only (~50% coverage)
- Monitor density is heavily skewed toward urban areas; rural and tribal areas
  often have no monitor within useful range
- Annual averages smooth over episodic pollution events (wildfire smoke, etc.)
- A single monitor may represent conditions for a large geographic area that
  varies significantly with wind direction and topography
- Rate limit of 5/min is easily hit in bulk assessment scenarios

## Layer assignment
Air layer — PM2.5 and ozone concentration signal.
