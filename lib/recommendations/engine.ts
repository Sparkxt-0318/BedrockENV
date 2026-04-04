import { ExposureAssessment } from '@/types/exposure';
import { computeViolationStats } from '@/lib/data-sources/epa-sdwis';
import { RecommendationTemplate, TriggeredRecommendation, RecommendationContext } from './types';
import { waterPfasTemplates } from './templates/water-pfas';
import { waterLeadTemplates } from './templates/water-lead';
import { waterViolationTemplates } from './templates/water-violations';
import { soilContaminationTemplates } from './templates/soil-contamination';
import { soilHealthTemplates } from './templates/soil-health';
import { generalTemplates } from './templates/general';

/**
 * Recommendation Decision Tree Engine
 *
 * Evaluates all registered templates against the assessment data.
 * Templates are deterministic — given the same inputs, always produces the same outputs.
 *
 * The AI NEVER generates recommendations. All recommendations come from these templates.
 */

const ALL_TEMPLATES: RecommendationTemplate[] = [
  ...waterPfasTemplates,
  ...waterLeadTemplates,
  ...waterViolationTemplates,
  ...soilContaminationTemplates,
  ...soilHealthTemplates,
  ...generalTemplates,
];

export function evaluateRecommendations(
  assessment: ExposureAssessment
): TriggeredRecommendation[] {
  const context = buildContext(assessment);
  const triggered: TriggeredRecommendation[] = [];
  const triggeredIds = new Set<string>();

  // Sort templates by risk tier (HIGH first) then by specificity
  const sortedTemplates = [...ALL_TEMPLATES].sort((a, b) => {
    const tierOrder = { HIGH: 0, ELEVATED: 1, MODERATE: 2, LOW: 3 };
    return tierOrder[a.riskTier] - tierOrder[b.riskTier];
  });

  for (const template of sortedTemplates) {
    // Skip if a higher-priority template for the same field already triggered
    // (e.g., PFAS-HIGH-001 prevents PFAS-MOD-001 from also triggering)
    const fieldKey = `${template.layer}:${template.triggerField}`;
    if (triggeredIds.has(fieldKey)) continue;

    if (evaluateCondition(context, template)) {
      const hydrated = hydrateTemplate(template, context);
      triggered.push(hydrated);
      triggeredIds.add(fieldKey);
    }
  }

  return triggered;
}

function buildContext(assessment: ExposureAssessment): RecommendationContext {
  const ctx: RecommendationContext = {};

  // Water context
  if (assessment.waterData) {
    const wd = assessment.waterData;
    ctx.water_system_name = wd.systemName;
    ctx.water_system_id = wd.systemId;

    if (wd.pfas) {
      ctx.pfas_max_individual = wd.pfas.maxIndividual;
      ctx.pfas_any_detection = wd.pfas.analytes.length > 0;
      ctx.pfas_total = wd.pfas.totalPfas;
      if (wd.pfas.analytes.length > 0) {
        ctx.pfas_analyte = wd.pfas.analytes[0].name;
        ctx.pfas_value = wd.pfas.analytes[0].concentration;
      }
      ctx.pfas_summary = wd.pfas.analytes
        .slice(0, 3)
        .map((a) => `${a.name}: ${a.concentration} ppt`)
        .join(', ');
    }

    if (wd.leadRisk) {
      ctx.pct_housing_pre_1950 = wd.leadRisk.pctPreA1950;
      ctx.pct_housing_pre_1986 = wd.leadRisk.pctPre1986;
      ctx.pct_pre1950 = String(wd.leadRisk.pctPreA1950);
    }

    if (wd.violations.length > 0) {
      const stats = computeViolationStats(wd.violations);
      ctx.health_violations_5yr = stats.healthBased5yr;
      ctx.violation_count = stats.last5Years;
      ctx.violation_contaminants = stats.violationContaminants.join(', ') || 'various contaminants';
    }
  }

  // Soil context
  if (assessment.soilData) {
    const sd = assessment.soilData;

    if (sd.brownfields.length > 0) {
      const nearest = sd.brownfields[0];
      ctx.nearest_brownfield_miles = nearest.distance;
      ctx.brownfield_site_name = nearest.name;
      ctx.brownfield_contaminant_types = nearest.contaminantTypes.join(', ');
      ctx.brownfield_cleanup_status = nearest.cleanupStatus;
      ctx.brownfield_site_id = nearest.siteId;
      ctx.distance = nearest.distance.toFixed(1);
      ctx.site_name = nearest.name;
      ctx.contaminant_types = nearest.contaminantTypes.join(', ');
      ctx.cleanup_status = nearest.cleanupStatus;
      ctx.site_id = nearest.siteId;
    }

    if (sd.ssurgo) {
      ctx.soil_organic_matter_pct = sd.ssurgo.organicMatterPct;
      ctx.om_pct = String(sd.ssurgo.organicMatterPct);
      ctx.soil_texture = sd.ssurgo.dominantTexture;
      ctx.drainage_class = sd.ssurgo.drainageClass;
      ctx.soil_mukey = sd.ssurgo.mapUnitKey;
    }

    if (sd.floodZone && sd.brownfields.length > 0) {
      ctx.flood_zone = sd.floodZone.zone;
      if (sd.floodZone.isSpecialFloodHazardArea && sd.brownfields[0].distance < 2) {
        ctx.flood_contamination_risk = 'HIGH';
        ctx.contamination_source = sd.brownfields[0].name;
        ctx.flood_contamination_source = sd.brownfields[0].name;
        ctx.flood_contamination_distance = sd.brownfields[0].distance;
        ctx.flood_source_type = 'Brownfields';
      }
    }
  }

  return ctx;
}

function evaluateCondition(
  context: RecommendationContext,
  template: RecommendationTemplate
): boolean {
  const value = (context as Record<string, unknown>)[template.triggerField];
  if (value === undefined || value === null) return false;

  const { triggerOperator, triggerValue } = template;

  switch (triggerOperator) {
    case '>':
      return Number(value) > Number(triggerValue);
    case '<':
      return Number(value) < Number(triggerValue);
    case '>=':
      return Number(value) >= Number(triggerValue);
    case '<=':
      return Number(value) <= Number(triggerValue);
    case '==':
      // Handle boolean and string comparison
      if (typeof triggerValue === 'boolean') return Boolean(value) === triggerValue;
      return String(value) === String(triggerValue);
    default:
      return false;
  }
}

function hydrateTemplate(
  template: RecommendationTemplate,
  context: RecommendationContext
): TriggeredRecommendation {
  return {
    templateId: template.id,
    layer: template.layer,
    riskTier: template.riskTier,
    finding: interpolate(template.finding, context),
    recommendation: interpolate(template.recommendation, context),
    sourceCitation: interpolate(template.sourceCitation, context),
    disclaimer: interpolate(template.disclaimer, context),
  };
}

function interpolate(template: string, context: RecommendationContext): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = (context as Record<string, unknown>)[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}
