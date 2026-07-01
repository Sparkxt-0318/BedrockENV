# FEMA — Flood Exposure Data (NFIP + NFHL)

**Bundled file:** `data/flood-by-county.json`
**Live API module:** `lib/data-sources/fema-nfhl.ts`

## What it covers

### Bundled county-level data (flood-by-county.json)
- FEMA NFIP Residential Penetration Rates by county — fraction of residential structures within Special Flood Hazard Areas (SFHA, i.e., 100-year floodplain)
- Used to compute Flood Exposure Rate (FER) for the CFCI national index
- Sourced from FEMA's NFIP policy-in-force data and Census residential structure counts

### Live NFHL per-property API (fema-nfhl.ts)
- Property-specific flood zone designation (Zone AE, AO, X, etc.)
- Distance to nearest mapped flood zone boundary
- Whether the property is in a Special Flood Hazard Area

## What it doesn't cover
- Unincorporated areas and communities that have not adopted NFIP — approximately 5% of US land area
- Stormwater and urban flooding (not classified as SFHA)
- Nuisance flooding below 100-year threshold
- Post-flood-map-revision designations not yet reflected in NFIP enrollment
- Compound flooding (storm surge + riverine) may be underestimated by 1D modeling in older FIRM maps

## Refresh cadence
- **Bundled data: quarterly check** — FEMA releases updated NFIP statistics periodically
- Source: https://www.fema.gov/flood-insurance/work-with-nfip/nfip-data-summaries
- **NFHL live API**: FIRM maps are revised on a rolling basis; check FEMA Map Service Center for major map amendments (LOMAs, FIRMs)
- Flood map modernization is ongoing — some counties use maps from the 1970s–1990s that do not reflect current flood risk

## Known limitations
- FEMA flood maps reflect historical flood frequency, not climate-adjusted future risk — First Street Foundation estimates true 1% annual chance is significantly higher in many areas
- SFHA designation drives mandatory purchase requirement but many at-risk properties are outside the SFHA boundary
- FER uses residential structure counts from Census, which may lag new construction
- Lahaina, Paradise CA, and similar disaster areas may have NFHL data gaps immediately post-disaster
