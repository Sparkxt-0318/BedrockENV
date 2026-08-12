# FEMA NFHL — National Flood Hazard Layer

## What it covers
Flood hazard zone classification at the property level (parcel scale). Queries the FEMA ArcGIS REST service for all flood-hazard polygons intersecting the query point. Returns the headline zone (most hazardous), full list of intersecting zones, base flood elevation (BFE) where available, and a risk tier. Zone types: VE/V (coastal high-velocity, highest risk), AE/A (1% annual chance, SFHA), AH/AO (shallow flooding), X (minimal flood hazard). Used by the soil scorer as a flood exposure component.

## What it doesn't cover
- **No storm surge modeling** — VE zones use updated coastal mapping, but storm surge projections (sea-level rise scenarios) are not included.
- **No pluvial flooding** — Stormwater/urban flooding from heavy rain is not captured by NFHL (it maps riverine and coastal only).
- **No 0.2% annual chance flood** — The "500-year flood" is noted as Zone X shaded on FIRMs but not distinguished from Zone X in our query.
- **No future projections** — NFHL reflects current FIRM designation, not climate-adjusted risk (see First Street for forward projections).

## Refresh cadence
FEMA updates FIRMs on a county-by-county basis as communities complete flood studies. The ArcGIS service is queried live. No local bundle. Effective data currency varies by county — some FIRMs are 20+ years old.

## Known limitations
- **Unmapped coverage** — When `features: []` is returned, this could mean Zone X (genuinely minimal risk) OR that the county has never been FIRM-mapped. The scorer conservatively reports `coverage: 'unmapped'` and the soil scorer applies a partial coverage factor. There is no API to distinguish these cases.
- **ArcGIS error envelopes** — HTTP 200 with `{error: {code, message}}` on bad params; the code checks the body. URL path is `/arcgis/rest/` (not `/gis/nfhl/rest/` which returns a WebSEAL 404).
- **Outdated FIRMs** — Many rural counties have not been re-studied since the 1970s–1980s; zones may not reflect current hydrology.
- **No BFE in all zones** — Zone A (unnumbered) lacks BFE; Zone AE includes BFE. BFE is null for many parcels.

## Source
FEMA NFHL ArcGIS: https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query  
Implementation: `lib/data-sources/fema-nfhl.ts`
