# USDA SSURGO — Soil Survey Geographic Database

## What it covers
Physical and chemical soil properties at the query point: texture (clay/sand/silt %), organic matter, pH, cation exchange capacity (CEC), hydraulic conductivity (Ksat), drainage class, and flood/ponding frequency. Used to assess soil contamination vulnerability and agricultural impact.

**Runtime module:** `lib/data-sources/usda-ssurgo.ts`  
**API:** USDA Soil Data Access (SDA) Tabular Web Service  
`https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest`

## Coverage area
- Contiguous US: surveyed
- Alaska: partially surveyed (major river valleys, some peninsulas)
- Hawaii: surveyed
- US territories (Puerto Rico, Guam, etc.): not in SSURGO

## What it doesn't cover
- Anthropogenic contamination — SSURGO measures natural soil chemistry, not chemical contamination from industrial or military activity
- Urban fill — developed urban areas often return `compkind = 'Miscellaneous area'` (paved surfaces, urban land), which carry no chemistry in SSURGO
- Bedrock — SSURGO covers the top 1.5–2m; rock outcrops return null chemistry
- Subsurface contamination plumes that don't alter the surface horizon chemistry

## Refresh cadence
The SDA API returns current SSURGO data. SSURGO is updated as individual soil surveys are completed or revised (county-by-county updates, typically 5–10 year cycles). No local bundle needed — live API.

## Known limitations
- **Urban data gap**: Large portions of dense urban areas (Chicago downtown, Manhattan, etc.) are mapped as `Urban land` or `Miscellaneous area` with null chemistry. The runtime client skips these components and may return `coverage: 'partial'` for predominantly urban addresses.
- **API query syntax**: The SDA endpoint requires SQL-like query syntax over HTTP POST. WKT point order is (longitude, latitude) — swapping them silently returns zero rows. This is a known gotcha documented in the runtime module.
- **Surface horizon only**: The scorer uses the 0–25 cm depth band (surface residential exposure). Deeper contamination from historical sources may not be reflected.
- **Component aggregation**: A soil map unit can contain multiple components (soil series). The runtime module weights chemistry across components by `comppct_r` and across horizons by depth intersection.
- **pH range**: Soil pH strongly affects contaminant mobility. Acidic soils (pH < 5.5) mobilize lead and heavy metals. The soil scorer applies a pH-based mobility factor to the contamination vulnerability score.

## Scoring integration
SSURGO data feeds the soil sub-score via the SCVI (Soil Contamination Vulnerability Index) component. Low organic matter + acidic pH + sandy texture = higher contamination vulnerability. Urban land (null chemistry) returns a conservative medium score.
