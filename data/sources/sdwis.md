# EPA SDWIS — Safe Drinking Water Information System

## What it covers
Violation history for public water systems (PWSs). Two capabilities:
1. **System lookup** — resolves a (state FIPS, county FIPS) pair to the serving PWSID
2. **Violation fetch** — pulls violation records for a known PWSID including contaminant
   type, violation category (health-based vs. reporting), and return-to-compliance dates

Accessed via the Envirofacts REST API (no API key required).

## What it does NOT cover
- Private wells
- Historical violations that aged off the database (federal retention is typically 5 years)
- Water systems in US territories (Puerto Rico, Guam) may have incomplete records
- Real-time contamination events (database lags by weeks to months)
- Very small systems that self-report infrequently

## Refresh cadence
SDWIS is a live EPA database updated as violations are reported and resolved.
Our queries hit the live API at assessment time — no bundle needed.
Data staleness is inherent to reporting lag (utilities have 30–120 days to report).

## Known limitations
- Area-level resolution (water system, not address-level)
- A single county may be served by multiple PWSs; our lookup returns only the
  primary active community water system
- Historical contamination events (Camp Lejeune, TCE/PCE pre-1987) aged out of SDWIS
  current violation records — legacy contamination is invisible
- Violation counts do not weight by severity; a reporting failure equals a health-based
  violation in the raw count
- Envirofacts field names may be either uppercase or lowercase — `field()` helper
  handles both casings

## Layer assignment
Water layer — violation count and recency signal.
