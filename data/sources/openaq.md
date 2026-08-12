# OpenAQ — Open Air Quality Data

## What it covers
Real-time and recent PM2.5 (and other criteria pollutant) measurements from the nearest air quality monitoring station within 25 km of the query point. Uses OpenAQ v3 API. Returns measured concentrations, last updated timestamp, and sensor location. Compared against WHO PM2.5 annual guideline (15 µg/m³, 2021) and NAAQS (35 µg/m³, 24-hour). Used by the air scorer's ambient measurement sub-component.

## What it doesn't cover
- **Requires API key** — `OPENAQ_API_KEY` env var must be set. Without it, OpenAQ returns a clear error and the air scorer falls back to nonattainment-only coverage (~50%).
- **No PM10, O3, NO2 scoring** — Currently only PM2.5 is used in the air scorer despite OpenAQ providing multi-pollutant data.
- **No air toxics** — OpenAQ monitors criteria pollutants; HAPs like benzene, formaldehyde, and diesel particulate matter are not included.
- **No rural coverage** — Many rural US locations have no monitoring station within 25 km. In these areas, the ambient measurement sub-component returns null and the scorer uses nonattainment data only.

## Refresh cadence
OpenAQ v3 data is near real-time. Queries are live. No local bundle. `lastUpdated` timestamp is returned with each measurement.

## Known limitations
- **25 km radius**: The nearest station may be far from the query point (e.g. in a different city). Air quality can vary significantly within 25 km, especially near industrial sources.
- **Stale monitors**: Some OpenAQ stations report infrequently or have been offline for months. The `lastUpdated` field is surfaced to the user but not used to reject stale data in the scorer.
- **4-second timeout**: OpenAQ can be slow; timeout is set at 4 seconds. On timeout, air scoring degrades gracefully.
- **401 without key**: When `OPENAQ_API_KEY` is absent, the scorer returns a clear error immediately rather than attempting the (doomed) request.

## Source
OpenAQ v3 API: https://api.openaq.org/v3/  
Implementation: `lib/data-sources/openaq.ts`
