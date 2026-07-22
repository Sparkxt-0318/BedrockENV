# EPA Brownfields

## What it covers
Contaminated or formerly contaminated land sites that have been assessed or remediated under EPA's Brownfields program. Bedrock queries the EPA NEPAssist ArcGIS REST service (layer 13: "Brownfields") for sites within a radius of a query point, returning site name, status, and coordinates.

Brownfields data complements Superfund NPL by capturing sites that are contaminated but not severe enough to warrant NPL listing, or sites in the process of remediation and redevelopment. Includes former industrial sites, gas stations, dry cleaners, and manufacturing facilities.

## What it doesn't cover
- **All contaminated sites** — many contaminated properties haven't entered the Brownfields program (no EPA assessment, no grant funding). Absence from this database ≠ clean.
- **Active industrial facilities** — Brownfields focuses on abandoned/underutilized land; active facilities are tracked by ECHO/TRI.
- **Private remediation sites** — voluntary cleanups without federal or state Brownfields funding aren't here.
- **Contaminant-specific data** — Brownfields records site existence and status; they don't include contaminant concentrations.

## Refresh cadence
The NEPAssist ArcGIS service is updated periodically by EPA (no fixed schedule). Bedrock queries live per assessment; no static bundle.

## Known limitations
1. **Chronic API outages**: The EPA Brownfields API (NEPAssist ArcGIS) returns HTTP 503 intermittently. During outages, soil scores drop sharply (soil component returns 0 for proximity-to-brownfields). This is the primary driver of depressed scores in Port Arthur TX, Newark NJ, South LA (90002), and other industrial areas. A static bundle of brownfield coordinates would eliminate this fragility.
2. **Envirofacts alternative is broken**: The Envirofacts FRS_PROGRAM_FACILITY table was tried as an alternative but no longer carries usable lat/lon fields (schema was trimmed). ArcGIS is the only viable current option.
3. **Status lag**: Some Brownfields sites have been remediated and redeveloped but may still appear in the database if status hasn't been updated.
4. **Urban coverage bias**: Brownfields grants are more commonly sought in urban areas with redevelopment pressure. Rural contaminated sites may be underrepresented.
