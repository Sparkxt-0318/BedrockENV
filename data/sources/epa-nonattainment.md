# EPA Green Book — NAAQS Nonattainment Designations

## What it covers
- Counties designated as nonattainment for any National Ambient Air Quality Standard (NAAQS)
- Pollutants covered: PM2.5 (annual and 24-hour), PM10, ozone (8-hour), CO, SO2, NO2, Pb
- Nonattainment severity categories: Marginal, Moderate, Serious, Severe, Extreme (ozone only for most tiers)
- Multi-pollutant nonattainment: a county can be in nonattainment for multiple pollutants simultaneously
- Bundled as `/data/nonattainment.json` for O(1) county-level lookup

## What it doesn't cover
- Areas in attainment that are close to the standard (maintenance areas)
- Intrastate variation — a county is designated at the county level, even if one corner is clean
- Attainment status under the 2024 tightened PM2.5 NAAQS (9 µg/m³ annual) — new designations pending EPA action
- Indian country areas that may have separate tribal air programs

## Refresh cadence
- EPA publishes Green Book updates on a rolling basis as designations are issued, challenged, and revised
- Bedrock uses a local bundle (`/data/nonattainment.json`) — this must be manually rebuilt when designations change
- EPA source: `https://www.epa.gov/green-book`
- Recommended rebuild frequency: quarterly (or when a major NAAQS rule change takes effect)

## Known limitations
- County-level granularity — a city can straddle county lines, and one side may be nonattainment while the other is not
- Designation lag: EPA nonattainment designations can take 1–2 years after a monitoring violation is documented; the bundle may not reflect the most recent air quality problems
- Severity categories apply per pollutant; the multi-pollutant boost in Bedrock scoring (+5 per additional pollutant) is a heuristic approximation of true cumulative burden
- Local compliance area exceptions (some large urban nonattainment areas exclude certain counties) are not captured in the county-level bundle
- Tribal lands with separate air quality programs are not fully represented in the Green Book
