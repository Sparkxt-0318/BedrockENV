# EPA Green Book — Nonattainment Area Designations

## What it covers
Counties designated as "nonattainment" under the Clean Air Act for one or more National Ambient Air Quality Standards (NAAQS) pollutants. A county is designated nonattainment when it exceeds EPA's health-based air quality standards. Bedrock bundles this as a static JSON lookup (`data/nonattainment.json`) keyed by 5-digit county FIPS code.

Pollutants tracked:
- **PM2.5** (fine particulate matter) — the most health-relevant; links to respiratory and cardiovascular disease
- **PM10** (coarse particulate)
- **Ozone (O3)** — ground-level ozone from NOx + VOC reactions
- **CO** (carbon monoxide)
- **NO2** (nitrogen dioxide)
- **SO2** (sulfur dioxide)
- **Lead** (from industrial sources)

Classification levels (for PM2.5/ozone): Marginal, Moderate, Serious, Severe, Extreme (Los Angeles basin is the only "Extreme" ozone area).

## What it doesn't cover
- **Attainment counties** — not in the bundle (no designation = no entry; Bedrock treats as attainment).
- **Air toxics (HAPs)** — hazardous air pollutants (benzene, formaldehyde, etc.) are regulated separately under CAA Section 112, not through NAAQS/nonattainment. Use TRI for air toxics proximity.
- **Indoor air quality** — NAAQS covers outdoor (ambient) air only.
- **Temporal variation** — a county can be nonattainment for ozone in summer and near-attainment in winter; the designation is a year-round label.

## Refresh cadence
EPA updates nonattainment designations as new standard revisions take effect or as areas demonstrate attainment. The current bundle reflects EPA Green Book as of late 2025. Rebuild the bundle quarterly using `scripts/build-nonattainment-data.ts`.

## Known limitations
1. **County-level resolution**: A county can be 50 miles wide. A rural address in a corner of an "Extreme" ozone county faces very different exposure than an urban address near the emission sources driving the designation.
2. **Designation lag**: After an area exceeds NAAQS, formal nonattainment designation can take 2-3 years due to rulemaking requirements. Rapidly worsening areas may not be designated yet.
3. **Withdrawal from monitoring**: Some counties have been reclassified to attainment based on monitor data that may not be representative of all sub-areas.
4. **No PM2.5 for some rural counties**: Counties with no EPA-certified monitors cannot be designated nonattainment even if modeled PM2.5 is elevated.
