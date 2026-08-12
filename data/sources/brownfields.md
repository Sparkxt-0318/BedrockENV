# EPA Brownfields

## What it covers
Contaminated or potentially contaminated properties (brownfields) within a configurable radius (default 2 miles) of the query point. Data is sourced from the EPA NEPAssist ArcGIS service (Layer 13 — Brownfields). Returns site name, address, registry ID, and computed distance/direction from the query point. Used by the soil scorer as a contamination pressure indicator.

## What it doesn't cover
- **No contamination type or severity** — Brownfields records indicate potential contamination but not what contaminants are present or at what levels.
- **No cleanup status** — A brownfield site in the database may be fully remediated, under active cleanup, or untouched.
- **No timeline** — The data does not indicate when contamination occurred.
- **Superfund NPL sites** — Active Superfund sites are tracked separately (see `superfund.md`); brownfields typically refers to less severely contaminated or non-NPL sites.

## Refresh cadence
EPA updates the Brownfields database periodically (no fixed schedule). The ArcGIS service is queried live. No local bundle.

## Known limitations
- **HTTP 503 outages are common** — The EPA NEPAssist ArcGIS service experiences intermittent 503 errors. When down, soil scores for all addresses drop severely (e.g. Newark NJ dropped from 44 to 29 during a 2026-04 outage). The scorer treats null brownfields data as `coverage: 'partial'` but cannot recover the score.
- **ArcGIS error envelopes** — The API returns HTTP 200 with `{error: {code, message}}` on invalid parameters; the code inspects the body, not just the status.
- **Spatial accuracy** — Brownfield site coordinates are address-geocoded, not surveyed. Radius matching can include/exclude sites by 50–200 meters.
- **Database completeness** — Not all brownfields are registered with EPA; state-managed sites may not appear. California, New Jersey, and New York have additional state brownfield databases not accessed here.

## Source
EPA NEPAssist ArcGIS REST service: https://geopub.epa.gov/arcgis/rest/services/NEPAssist/NEPAVELayersPublic_fgdb/MapServer/13/query  
Implementation: `lib/data-sources/epa-brownfields.ts`
