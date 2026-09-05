# EPA Brownfields — Assessment, Cleanup, and Redevelopment Program

## What it covers
EPA's Brownfields database (via the FRS/ACRES system) tracks properties that are contaminated or perceived to be contaminated with hazardous substances, pollutants, or contaminants. Key data:
- Site location and address
- Assessment status (Phase I/II complete)
- Cleanup status (in progress, complete, unknown)
- Grant recipient information

Bedrock queries brownfields sites within a 5-mile radius of the target address via EPA's REST API. The soil scorer uses brownfields density as a contamination pressure indicator.

## What it does NOT cover
- Sites that have not entered the Brownfields program (many contaminated properties are never formally assessed)
- Privately funded cleanups not tracked by EPA
- State-only brownfield programs (many states run parallel programs with sites not in federal ACRES)
- Superfund NPL sites (tracked separately via FRS SEMS)

## Refresh cadence
EPA updates ACRES as grants are awarded and assessments/cleanups are reported. Bedrock queries the live EPA REST API. Updates are irregular — typically quarterly as grant cycles close.

## Known limitations
- **API reliability**: The EPA Brownfields REST API frequently returns HTTP 503 errors, particularly during business hours. When the API fails, the brownfields sub-score defaults to a conservative value, and the address is flagged with reduced coverage confidence. This is the single most common cause of artificially low soil scores in Bedrock.
- **Voluntary entry**: Only sites that have applied for EPA brownfields grants appear in ACRES. Self-funded cleanups or sites where owners haven't applied are invisible.
- **Completion lag**: Cleanup completion is self-reported by grantees. Some "complete" sites may still have residual contamination.
- **Known workaround**: For the highest-risk known brownfield sites, consider adding a static supplement bundle (similar to the nonattainment Green Book approach) to ensure coverage when the API is unreliable.
