# EPA Green Book — Nonattainment Area Designations

## What it covers
Counties and partial counties designated as nonattainment for National Ambient Air Quality Standards (NAAQS) for six criteria pollutants: PM2.5, PM10, Ozone (8-hr), CO, NO2, SO2, and Lead. Bundled as `data/nonattainment.json`.

## What it doesn't cover
- Air toxics (HAPs/HAPS — not covered by NAAQS)
- Attainment designations (only nonattainment and maintenance areas)
- Point-source stack emissions (covered separately by TRI/ECHO)
- Rural areas with no monitoring stations may be incorrectly "attaining" due to data gaps

## Refresh cadence
EPA Green Book updated continuously as designations change. Bundled file should be refreshed quarterly from:
https://www.epa.gov/green-book

## Source
- EPA Green Book: https://www.epa.gov/green-book
- Bundled as: `data/nonattainment.json` (keyed by county FIPS)

## Known limitations
- Nonattainment boundaries follow county lines, not actual airshed boundaries — a clean county adjacent to a nonattainment county may have similar air quality
- Maintenance areas (previously nonattainment) are not flagged as risks, even though ongoing monitoring may still show elevated levels
- Tribal lands have separate air quality programs and may not appear in Green Book
