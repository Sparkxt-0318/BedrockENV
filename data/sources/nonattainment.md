# EPA Green Book — NAAQS Nonattainment Areas

## What it covers
Counties designated nonattainment under the National Ambient Air Quality Standards (NAAQS) for six criteria pollutants: PM2.5, PM10, ozone (O3), carbon monoxide (CO), nitrogen dioxide (NO2), lead (Pb), and sulfur dioxide (SO2). Classifications range from Marginal to Extreme (for ozone) and Moderate to Serious (for PM2.5). Bundled as `data/nonattainment.json` keyed by county FIPS.

## What it doesn't cover
- Attainment areas (the absence of listing does not mean clean air — just that the county meets the standard)
- Air toxics (benzene, formaldehyde, 1,3-butadiene) — tracked by TRI and RSEI, not NAAQS
- Indoor air quality
- Sub-county variation (designation is county-level; actual pollution levels vary block by block)

## Refresh cadence
EPA updates the Green Book monthly as designations change. The bundled file reflects the April 2026 release. Rebuild command: `scripts/rebuild-nonattainment.ts` (reads from EPA Green Book CSV endpoint).

## Known limitations
- **Lag**: Nonattainment designation follows years of monitoring data — a county can be polluted before it's officially designated.
- **Redesignation timing**: A county redesignated to attainment after cleanup still had years of exposure to residents. We do not track historical designations.
- **County-level resolution**: A polluted industrial corridor may sit in a county that just barely meets the standard overall.
- **SO2/NO2 coverage**: Only 38 counties are currently designated nonattainment for SO2, and only 1 for NO2. These are significant pollution types but NAAQS designations are rare.

## Scoring use
Air layer sub-component. Nonattainment status adds score by severity (Extreme/Serious = 100, Moderate = 70, Marginal = 40, below standard = 0). Multiple co-pollutant designations in the same county are additive, capped at 100.
