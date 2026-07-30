# USDA SSURGO — Soil Survey Geographic Database

## What it covers
SSURGO is USDA's authoritative soil survey database, covering ~95% of the
US land area. For each map unit (polygon), it records:
- Organic matter content (% by weight)
- Soil drainage class (well-drained, poorly drained, etc.)
- Texture (sandy, loam, clay, etc.)
- pH range
- Hydrologic group (A/B/C/D — runoff potential)

Bedrock uses SSURGO to calculate the Soil Vulnerability Score (SVS) component
of SCVI, and for the soil layer's contamination-mobility sub-score in individual
property reports.

## What it doesn't cover
- Urban areas: SSURGO classifies urban land as "urban land" or "udorthents" —
  actual soil properties beneath pavement are unknown. This is the "urban blind
  spot" described in the SCVI methodology.
- Contamination itself: SSURGO describes natural soil properties, not whether
  contaminants are present. Contamination data comes from EPA sources (ECHO, TRI,
  brownfields, Superfund).
- Subsurface geology below the survey depth (~2m for most surveys)

## How Bedrock uses it
`lib/data-sources/usda-ssurgo.ts` queries the USDA Web Soil Survey API
(`https://sdmdataaccess.sc.egov.usda.gov/`) for the map unit at a given
lat/lon. Returns organic matter, drainage class, texture, and hydrologic group.

## Refresh cadence
SSURGO is updated on a rolling basis as new surveys are completed or revised.
Major national refreshes occur approximately every 3–5 years. Check
https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo for release notes.

## Known limitations
- **Urban gap**: The single largest coverage limitation. In cities, SSURGO
  returns generic "urban land" designations with no useful soil data. The SVS
  scorer assigns a fixed "urban data gap" penalty and falls back to county-level
  estimates.
- **Survey age variation**: Some surveys date to the 1970s and may not reflect
  current conditions after development or land use change.
- **API reliability**: USDA's SSURGO web service has occasional outages and
  timeouts. The scorer gracefully degrades to null when the API is unavailable.
- **Resolution**: Map units cover dozens of acres; a specific parcel may sit at
  the boundary of two soil types.
