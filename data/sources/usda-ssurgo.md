# USDA SSURGO — Soil Survey Geographic Database

**What it covers**: Soil physical and chemical properties at the map unit level (~1:12,000 to 1:63,360 scale) for the continental United States. Properties include organic matter content, drainage class, hydrologic group, texture, pH, cation exchange capacity, and depth to bedrock. Used by Bedrock for the Soil Vulnerability Score (SVS) sub-component of SCVI.

**What it doesn't cover**: Urban areas where soil has been disturbed, covered, or replaced by impervious surfaces. The USDA explicitly marks these as "Urban land" or "Made land" with no soil characterization — this is the "urban blind spot" identified in our SCVI research. Industrial fill material, brownfield substrates, and capped landfill cover are not characterized. Sub-surface contamination plumes are not in SSURGO.

**Used for**: Soil layer — intrinsic soil vulnerability sub-score (drainage class, organic matter, texture for contaminant mobility). Also used in SCVI national map SVS calculation.

**Refresh cadence**: SSURGO is updated on a rolling survey schedule. Major updates are infrequent (years between surveys for a given county). The scoring engine queries the USDA Web Soil Survey REST API live. Check NRCS publication dates at https://websoilsurvey.nrcs.usda.gov/ when doing quarterly data freshness audits.

**Known limitations**:
- Urban land data gap: approximately 25% of urban census tracts have no SSURGO soil characterization because development predates survey or soil was removed. This causes a systematic underestimate of soil vulnerability in dense urban areas.
- SSURGO reflects natural soil properties, not contamination. A soil with excellent drainage (good for crops) scores as "high vulnerability" in our model because it allows contaminants to leach to groundwater faster — this is intentional but counterintuitive.
- Map unit scale means a single residential lot may be assigned properties from a soil polygon that covers hundreds of acres.
- Puerto Rico and US territories have limited SSURGO coverage.

**Source**: USDA Natural Resources Conservation Service Web Soil Survey — https://websoilsurvey.nrcs.usda.gov/
USDA SSURGO REST API — https://SDMDataAccess.nrcs.usda.gov/Tabular/post.rest
