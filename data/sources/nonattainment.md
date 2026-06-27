# EPA Green Book — Nonattainment Area Designations

## What it covers
County-level designations for NAAQS (National Ambient Air Quality Standards) nonattainment
under the Clean Air Act. Covers pollutants: PM2.5, PM10, ozone (8-hour), SO2, NO2, CO, Pb.
Bundled as `data/nonattainment.json` — a compact county FIPS → {pollutants, classification}
lookup built from EPA's Green Book.

Build script: `scripts/build-nonattainment-data.ts`
Source: EPA Green Book https://www.epa.gov/green-book

## What it does NOT cover
- Attainment areas (clean counties — not in the bundle by design)
- Air quality within attainment areas (may still have elevated concentrations)
- State implementation plan (SIP) status or compliance timelines
- Historical nonattainment that has since been redesignated

## Refresh cadence
EPA updates the Green Book as designations change (typically 1–4 times/year).
**Check EPA Green Book quarterly** for new designations or redesignations.
Rebuild with `scripts/build-nonattainment-data.ts` when updated.
Check `data/nonattainment.json` → `generatedAt` field for bundle age.

## Known limitations
- County-level granularity — a large county may have clean air in most areas but
  one nonattainment zone near an industrial corridor
- A county in attainment still has no data in the bundle (returns clean/attainment)
  even if actual concentrations are near the NAAQS threshold
- Bundle staleness: if nonattainment bundle is not rebuilt after EPA updates,
  newly designated counties score as attainment
- Redesignated-attainment counties (formerly nonattainment) may still have
  legacy air quality issues not captured

## Layer assignment
Air layer — nonattainment status binary signal.
