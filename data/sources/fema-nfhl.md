# FEMA NFHL — National Flood Hazard Layer

## What it covers
FEMA's authoritative flood zone maps used for National Flood Insurance Program
(NFIP) rating. Classifies land into flood zones:
- **Zone A / AE**: Special Flood Hazard Area (SFHA) — 1% annual chance flood
- **Zone AO**: Shallow flooding with defined depth
- **Zone VE / V**: Coastal high-hazard areas with wave action
- **Zone X (500-year)**: Moderate flood hazard (0.2% annual chance)
- **Zone X (shaded)**: Minimal flood hazard outside SFHA

Bedrock uses NFHL for two purposes:
1. **Individual reports** (soil layer): Zone classification for the specific parcel
2. **CFCI national dataset**: County-level NFIP residential penetration rates
   (fraction of residential structures within SFHA) as the flood exposure component

## What it doesn't cover
- Unmapped areas: ~30% of the US land area has outdated or no FEMA flood maps.
  Unmapped areas return Zone X by default, which may understate actual risk.
- Stormwater and urban flooding not driven by riverine or coastal sources
- Future flood risk under climate change (NFHL shows current regulatory maps)
- Compound flooding from simultaneous rain and coastal surge (the CFCI attempts
  to capture this via the contamination co-exposure angle)

## Refresh cadence
FEMA updates flood maps on a rolling county-by-county basis through the
Risk MAP program. Some maps haven't been updated in 20+ years. The NFHL
WFS API always returns the current effective map for a location.

## Known limitations
- **Effective vs. preliminary maps**: During map revision, a county may have
  preliminary maps that show higher risk than the effective (legally binding)
  maps. NFHL returns only effective maps. Communities may have appealed preliminary
  maps, keeping lower-risk designations even when physical conditions changed.
- **NFIP penetration as proxy**: County-level FER (flood exposure rate) from NFIP
  data underrepresents areas outside NFIP-participating communities and properties
  in Zone X that still flood.
- **Climate change lag**: NFHL flood zones were designed for historical return
  periods. First Street Foundation research shows actual 1% annual-chance flood
  zones are significantly larger than FEMA-mapped zones in many areas.
- **API rate limits**: The FEMA flood map service API (`msc.fema.gov`) has
  undocumented rate limits. The scorer uses exponential backoff on failures.
