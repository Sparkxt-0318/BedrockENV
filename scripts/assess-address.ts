import { fetchFullAssessment } from '../lib/data-sources/index';

const address = process.argv[2];
if (!address) {
  console.error('Usage: npx tsx scripts/assess-address.ts "address"');
  process.exit(1);
}

async function main() {
  const { assessment, errors } = await fetchFullAssessment(address);
  if (!assessment) {
    console.error('Assessment failed:', errors);
    process.exit(1);
  }
  const cs = assessment.compositeScore;
  const layers = cs.layerScores as Record<string, { score: number; available: boolean }>;
  console.log(JSON.stringify({
    address,
    composite: cs.score,
    water: layers.water?.score ?? '-',
    soil: layers.soil?.score ?? '-',
    air: layers.air?.score ?? '-',
    proximity: layers.proximity?.score ?? '-',
    ej: layers.ej?.score ?? '-',
    coverage: Math.round(cs.coverage * 100) + '%',
    confidence: cs.confidence,
    layersIncluded: cs.layersIncluded,
    errors,
  }, null, 2));
}

main().catch(console.error);
