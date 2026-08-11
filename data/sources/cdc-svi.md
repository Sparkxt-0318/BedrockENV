# CDC Social Vulnerability Index (SVI)

## What it covers
Census-tract-level index of social vulnerability to disasters and environmental stressors. 15 social factors across 4 themes: Socioeconomic Status, Household Characteristics, Racial & Ethnic Minority Status, Housing Type & Transportation. Used as the `socialVulnerability` sub-component (weight 0.35) of the EJ layer.

Overall SVI percentile (0–1) converted to 0–100 for scoring. Higher = more vulnerable.

## What it doesn't cover
- Environmental contamination directly — SVI measures population vulnerability, not pollution exposure
- Rural areas with small census tracts may have suppressed data
- Block-group or property-level precision — census tract level only (~4,000 people average)

## Refresh cadence
CDC releases SVI every 2 years (on even years, based on the ACS 5-year survey). Current release: SVI 2022.

Check: https://www.atsdr.cdc.gov/place-health/php/svi/index.html

API: `https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/CDC_Social_Vulnerability_Index_2022/FeatureServer`

## Known limitations
- **Currently non-functional** — the CDC SVI ArcGIS REST API requires registration or returns 403/empty for automated queries. The scorer (`lib/scoring/ej-scorer.ts`) handles null SVI gracefully (redistributes its 0.35 weight to the other EJ sub-components), but this permanently reduces EJ layer coverage.
- Social vulnerability is a proxy for environmental justice burden, not a direct measurement of contamination exposure — its inclusion is methodologically appropriate but should be disclosed to users
