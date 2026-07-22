# University of Richmond HOLC Maps — Mapping Inequality

## What it covers
Digitized 1930s Home Owners' Loan Corporation (HOLC) redlining maps covering 239 US cities, along with census-tract crosswalk data that maps each HOLC-graded neighborhood to modern census tracts. Bedrock uses this dataset in:

1. **EJ layer of individual reports**: The HOLC grade for the census tract containing a query address is surfaced as environmental justice context (Grade A="Best", B="Still Desirable", C="Declining", D="Hazardous").
2. **Redlining Intelligence Brief** (`/intelligence/redlining`): National analysis linking HOLC grades to present-day demographics and contamination scores.

Source dataset: University of Richmond Digital Scholarship Lab, *Mapping Inequality: Redlining in New Deal America* (https://dsl.richmond.edu/panorama/redlining/).

The crosswalk file (`data/holc-crosswalk.json`) maps HOLC neighborhood IDs to 2010 census tract FIPS codes with intersection fractions.

## What it doesn't cover
- **Rural areas**: HOLC mapping was done for cities. Rural census tracts and small towns were not mapped.
- **~300 of 900+ cities surveyed**: Only cities where HOLC maps have been digitized by the University of Richmond are in the dataset. Many Midwest and Southern cities lack digitized maps.
- **Post-1940 development**: HOLC grading ended in the early 1940s. Areas developed after that (most suburbs, Sun Belt cities) have no HOLC coverage.
- **Non-residential areas**: Industrial zones, parks, and commercial districts within mapped cities often have no HOLC grade.
- **Current conditions**: HOLC grades reflect 1930s assessments. While their legacy is documented, individual neighborhoods have changed.

## Refresh cadence
The Mapping Inequality dataset is a research archive updated periodically as new cities are digitized. Bedrock's crosswalk file was built in 2026 from the University of Richmond release available at that time. Check for updated releases annually at https://dsl.richmond.edu/panorama/redlining/.

## Known limitations
1. **65% census tract coverage**: Of 73,000+ US census tracts, only ~9,036 (≈12%) overlap with digitized HOLC areas. Most addresses will return no HOLC grade.
2. **Grade ambiguity at tract boundaries**: A census tract may overlap multiple HOLC grades. The crosswalk provides intersection fractions; Bedrock uses the dominant grade (highest fraction).
3. **Historical interpretation**: Using HOLC grades as a present-day EJ indicator requires careful framing — grades describe a historical pattern, not a current assessment of risk. Areas graded D in 1938 may have gentrified; areas graded A may have since industrialized.
4. **Appraisal-era bias embedded in grades**: HOLC grades explicitly incorporated racial composition as a grading factor. Grades reflect the racist assumptions of their era; interpreting them as environmental risk proxies requires acknowledging this history.
