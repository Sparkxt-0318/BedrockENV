# EPA Green Book — National Ambient Air Quality Standards (NAAQS) Nonattainment Areas

## What it covers
EPA's Green Book identifies counties and metropolitan areas designated as nonattainment for one or more NAAQS pollutants:
- **PM2.5** (fine particulate matter, 24-hour and annual standards)
- **PM10** (coarse particulate matter)
- **Ozone** (8-hour standard)
- **NO2** (nitrogen dioxide, annual)
- **SO2** (sulfur dioxide, 1-hour)
- **Pb** (lead, rolling 3-month average)
- **CO** (carbon monoxide)

Bedrock bundles the Green Book as a static JSON dataset (`data/nonattainment.json`) keyed by county FIPS code. The air scorer checks whether the target address's county is in nonattainment, and for what pollutants, and at what classification level (Marginal/Moderate/Serious/Severe/Extreme for ozone; Moderate/Serious for PM2.5).

## What it does NOT cover
- Local/hyperlocal pollution hotspots within an attainment county (a county can attain NAAQS but still have industrial pollution near a specific address)
- Real-time air quality (AQI) — this is a regulatory designation based on multi-year monitoring averages
- Criteria air pollutants not listed above (benzene, formaldehyde, etc., which are hazardous air pollutants, not criteria)

## Refresh cadence
EPA updates the Green Book as designations change, typically annually. Bedrock's static bundle should be refreshed when EPA publishes new designation rule changes. Last bundle update: Q1 2026. Check EPA Green Book at: https://www.epa.gov/green-book

## Known limitations
- **County-level granularity**: Nonattainment is a county-level designation. A single facility in a rural corner of a large county does not necessarily mean the entire county's air is bad — but our scoring treats all addresses in the county equally.
- **Attainment lag**: Counties can remain in attainment status even after air quality improves if the redesignation process is slow. Conversely, newly polluted areas may not be designated nonattainment for 2–3 years after violations begin.
- **Static bundle freshness**: The Green Book requires manual refresh when EPA issues new designations. Set a quarterly calendar reminder to check for updates.
