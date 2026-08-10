# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Violations of the Safe Drinking Water Act (SDWA) reported by public water systems (PWSs). Covers health-based violations (maximum contaminant level exceedances, treatment technique violations), monitoring and reporting violations, and public notification violations. Data updated continuously as states report to EPA.

## What it doesn't cover
- Private wells
- Violations that have been resolved and administratively closed (may age off the active query)
- Lead and copper violations prior to 2014 (the Flint crisis era data may be incomplete)
- State-only standards that exceed federal MCLs

## How Bedrock uses it
The `epa-sdwis.ts` data source queries the ECHO Drinking Water module for the water system serving the target address PWSID. Health-based violations count more heavily than monitoring violations. Recent violations (within 5 years) are weighted higher than older ones.

## Refresh cadence
Near-real-time — EPA updates SDWIS as states report violations, typically within 60 days of detection. Bedrock reads live from the ECHO API (no local bundle).

## Known limitations
1. **Historical violations age off**: Violations resolved before ~2015 may not appear. This causes systematic underscoring for cities with well-documented historical crises (Flint MI, Hoosick Falls NY).
2. **State reporting lag**: States have up to 60 days to report violations. Acute incidents appear in SDWIS weeks after occurrence.
3. **Monitoring violations**: SDWIS counts monitoring violations (failure to test) the same as MCL violations (actual contamination detected). Bedrock down-weights monitoring violations but they still inflate scores in some cases.
4. **PWSID required**: If we cannot match the address to a PWSID, SDWIS returns no data.

## Source
- EPA ECHO Drinking Water: https://echo.epa.gov/
- SDWIS documentation: https://www.epa.gov/enviro/sdwis-overview
