# EPA Brownfields — Brownfields Program Site Database

## What it covers
Former industrial or commercial sites with known or perceived contamination that are candidates for cleanup and redevelopment. Includes sites assessed, cleaned, or redeveloped under EPA's Brownfields Program.

**Query**: Radius search by lat/lng returning brownfield sites with status and distance.

## What it doesn't cover
- Active industrial facilities (those are ECHO-regulated)
- State-only brownfield programs (EPA Brownfields is a subset; many state programs have their own databases)
- Sites where contamination was remediated and delist occurred
- Private party cleanups not enrolled in EPA Brownfields Program

## Refresh cadence
Updated quarterly by EPA. Bedrock queries live.

**API endpoint**: `https://enviro.epa.gov/enviro/efservice/...`
**Live API**: `lib/data-sources/epa-brownfields.ts`

## Known limitations
1. **CRITICAL: Persistent HTTP 503 errors**: EPA Brownfields API has been returning HTTP 503 (Service Unavailable) consistently across audit runs (2026-04-17). This causes soil layer to score ~3 instead of expected 20-60+ at contaminated addresses. See IMPROVEMENT_LOG.md "Cycle 2" for documented impact: Port Arthur TX (-14 pts), Newark NJ (-27 pts), South LA (-25 pts), Flint MI (-6 pts), Salinas CA (-8 pts).
2. **API reliability**: Even when not returning 503, the Brownfields API is among the least reliable of our 15 data sources. Consider building a static bundle.
3. **Program scope**: Only ~21,000 sites enrolled in EPA Brownfields program. Many contaminated former industrial sites exist outside this program.

## Recommended fix
Build a static Brownfields bundle (CSV from EPA Brownfields database download) to eliminate API dependency. This is the single highest-impact reliability fix for the soil layer.

## Scoring integration
Layer: Soil (15% weight). Sub-component: brownfield proximity score. Formula in `lib/scoring/soil-scorer.ts`.
