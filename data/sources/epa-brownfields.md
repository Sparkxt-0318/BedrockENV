# EPA Brownfields — Brownfields Properties Database

## What it covers
Former industrial or commercial properties where redevelopment may be complicated by
real or perceived environmental contamination. Includes site ID, location, contaminant
types, cleanup status, and EPA grant program participation.

## What it doesn't cover
- Active Superfund NPL sites (tracked separately in FRS/SEMS)
- Properties not enrolled in a brownfields grant program
- State voluntary cleanup program (VCP) sites not federally tracked
- Sites that have completed cleanup and been removed from the registry

## How Bedrock uses it
Runtime radius search returning brownfield sites within ~3 miles of the query point.
Client at `lib/data-sources/epa-brownfields.ts`.

Scoring: brownfield count and proximity → soil sub-score component.

## Refresh cadence
Live API — EPA Brownfields database updated as projects are entered and closed.
No local bundle.

## Known limitations
1. **API instability**: The EPA Brownfields REST API (`https://www.epa.gov/sites/ejscreen/`)
   returns HTTP 503 frequently (documented in improvement logs). When it does, soil coverage
   drops to 'partial' and the brownfields sub-score falls to near-zero.
2. **Under-enrollment**: Many contaminated industrial sites are not enrolled in EPA
   brownfield programs, especially in states with strong VCP programs (CA, TX, IL).
3. **Cleanup completion lag**: Sites that complete cleanup may remain in the database
   for years before being delisted.
4. **No contamination severity**: The database indicates contaminant *types* (metals,
   VOCs, petroleum) but not concentration or health risk level.

## Source
- URL: https://www.epa.gov/brownfields/brownfields-assessment-cleanup-and-redevelopment-exchange-system-acres
- Format: REST/JSON
- **Note**: This API has a documented history of 503 errors. When unavailable, the
  soil scorer falls back to ECHO data and flags coverage as 'partial'.
