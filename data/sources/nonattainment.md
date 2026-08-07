# EPA Green Book — Nonattainment Area Designations

## What it covers
Counties designated as "nonattainment" for one or more NAAQS (National Ambient Air Quality Standards) pollutants. A nonattainment designation means the county's air quality exceeds federal health standards.

**Pollutants tracked**: PM2.5, PM10, Ozone (O3), CO, SO2, NO2, Lead.
**Status types**: Nonattainment, Maintenance (formerly nonattainment, now meeting standards), Attainment/Unclassifiable.

**Bundled file**: `data/nonattainment.json` — county-level nonattainment status, pre-indexed by county FIPS.

## What it doesn't cover
- Sub-county air quality variation (one monitor determines county-wide status)
- Air toxics (Green Book covers criteria pollutants only; NATA covers toxics)
- Ozone transport from upwind counties (a county may be attainment but have elevated ozone from transport)

## Refresh cadence
EPA updates Green Book quarterly as designations change. The bundled `nonattainment.json` should be rebuilt quarterly.

**Source URL**: `https://www3.epa.gov/airquality/greenbook/data/GBdata_YYYY.xlsx`
**Rebuild script**: Not yet implemented. Manual rebuild needed quarterly.
**Last bundle build**: Check commit history of `data/nonattainment.json`.

## Known limitations
1. **County-level only**: Nonattainment is assigned at the county level based on the worst monitor in the county. An address in a clean part of a nonattainment county still receives the nonattainment penalty.
2. **Monitor placement**: Monitors are typically placed at high-exposure locations; a county may have localized pollution that doesn't trigger any monitor.
3. **Rebuild lag**: If the bundle isn't rebuilt quarterly, nonattainment changes (counties redesignated in/out of attainment) won't be reflected.

## Scoring integration
Layer: Air (25% weight). Sub-component: nonattainment status binary flag. Formula in `lib/scoring/air-scorer.ts`.
