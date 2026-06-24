# EPA Brownfields / FRS — Contaminated Site Proximity

## What it covers
- EPA Facility Registry Service (FRS) records for brownfield sites and cleaned-up contaminated properties
- Cleanup status: assessed, cleanup underway, ready for reuse, deleted (cleaned)
- Distance-weighted proximity scoring: sites closer to the address contribute more to the score
- Covers EPA-registered brownfields; does not require federal Superfund-level contamination

## What it doesn't cover
- State-only brownfield programs (many states have separate registries not mirrored in FRS)
- Brownfields that were cleaned up and removed from the registry (redevelopment sites)
- Unknown contamination — by definition, brownfields are known/suspected sites; undiscovered contamination is not in this dataset
- Underground storage tanks (USTs) — tracked separately in LUST program, not currently integrated

## Refresh cadence
- FRS is updated continuously as EPA processes facility submissions; Bedrock queries live
- API: EPA FRS REST API (`https://frs.epa.gov/api/`) with radius-based spatial search
- Some records have significant lag between real-world status changes and FRS updates

## Known limitations
- 503 errors are common on the FRS API under load — Bedrock falls back to 0 (unknown) when the API is unavailable, which understates risk; this is documented in the soil layer coverage flag
- FRS radius search is limited to EPA-registered facilities; many state brownfields (especially in TX, FL, IL) are not in FRS
- Cleanup "ready for reuse" status does not mean contamination is gone — it means it has been managed to a risk-based standard for the intended use
- Distance weighting uses straight-line distance; actual exposure pathways (groundwater flow, prevailing winds) may differ
- Scores based on brownfield count and proximity; does not weight by contamination type or severity
