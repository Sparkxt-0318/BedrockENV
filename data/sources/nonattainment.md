# EPA Green Book — Air Quality Nonattainment Areas

## What it covers
Which US counties are designated nonattainment under the Clean Air Act for six criteria pollutants: PM2.5 (fine particulate), PM10, Ozone, CO, NO2, SO2, and Lead. Nonattainment means measured air quality in the county persistently exceeds the National Ambient Air Quality Standard (NAAQS). Classification levels (Marginal, Moderate, Serious, Severe, Extreme) indicate how far below the standard and how urgently the area must reduce emissions.

## What it doesn't cover
- Real-time or current air pollution levels (for that, see OpenAQ/AQS)
- Specific emission sources in the area
- Attainment areas — the Green Book only lists areas out of compliance
- Tribal air quality programs (many tribal lands are handled separately)
- Secondary pollutants or specific toxic air contaminants not regulated as criteria pollutants

## Source
EPA Green Book nonattainment data bundled at build time as `data/nonattainment.json`. Built from the EPA Green Book downloadable tables at `https://www.epa.gov/green-book`. Build script: `scripts/build-nonattainment.ts` (if it exists) or manual download.

## Refresh cadence
EPA designates/redesignates counties when monitored data meets or exceeds standards — typically quarterly. Bedrock bundles the nonattainment list statically and should rebuild it quarterly. Last known rebuild: 2026-04 (based on scoring history).

## Known limitations
- County-level — the entire county is treated as nonattainment even if the monitored site is on the far side of the county.
- Some counties have been in nonattainment for Ozone or PM2.5 for decades (Los Angeles basin, eastern US). A county can be nonattainment for multiple pollutants simultaneously (South Coast AQMD is Extreme for Ozone, Serious for PM2.5, and nonattainment for PM10 and Lead).
- Redesignation to attainment can happen without removing all pollution (EPA can accept "good enough" trends).
- Does not capture air toxics (benzene, formaldehyde) that are regulated under a different Clean Air Act program.
