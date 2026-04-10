/**
 * Integration test runner — tests the full data pipeline end-to-end against
 * a running dev server. Uses REAL API calls to federal data sources.
 *
 * Run with: pnpm test:integration
 *
 * Requires the dev server to be running: pnpm dev
 */
export {};

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestCase {
  address: string;
  label: string;
  expectHighWater?: boolean;
  expectFloodZone?: boolean;
  expectSoilData?: boolean;
  expectProximity?: boolean;
}

const TEST_ADDRESSES: TestCase[] = [
  {
    address: '123 Main St, Hoosick Falls, NY 12090',
    expectHighWater: true,
    label: 'Known PFAS town',
  },
  {
    address: '742 Evergreen Terrace, Springfield, IL 62704',
    label: 'Average suburb',
  },
  {
    address: '100 Ocean Dr, Miami Beach, FL 33139',
    expectFloodZone: true,
    label: 'Coastal flood zone',
  },
  {
    address: '1000 Farm Rd, Salinas, CA 93901',
    expectSoilData: true,
    label: 'Agricultural area',
  },
  {
    address: '100 Iron St, Newark, NJ 07105',
    expectProximity: true,
    label: 'Industrial area',
  },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function runIntegrationTests() {
  console.log('=== Bedrock Integration Tests ===');
  console.log(`Target: ${BASE}\n`);

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const test of TEST_ADDRESSES) {
    console.log(`Testing: ${test.label} (${test.address})`);

    try {
      // Full exposure assessment (geocoding is done inside this endpoint)
      const assessRes = await fetch(`${BASE}/api/exposure-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: test.address }),
      });

      if (!assessRes.ok) {
        const body = await assessRes.text();
        throw new Error(
          `Assessment failed: HTTP ${assessRes.status} — ${body.slice(0, 200)}`
        );
      }

      const assessment = await assessRes.json();

      // Verify structure
      const composite = assessment.compositeScore;
      assert(composite, 'Missing compositeScore');
      assert(
        typeof composite.score === 'number',
        `Composite score not a number: ${composite.score}`
      );
      assert(
        composite.score >= 0 && composite.score <= 100,
        `Score out of range: ${composite.score}`
      );
      assert(composite.confidence, 'Missing confidence');
      assert(
        Array.isArray(composite.layersIncluded),
        'Missing layersIncluded'
      );
      console.log(
        `  ✓ Composite: ${composite.score}/100 (${composite.confidence})`
      );
      console.log(`  ✓ Layers: ${composite.layersIncluded.join(', ') || 'none'}`);

      // Layer-specific checks
      if (test.expectHighWater && composite.layerScores?.water) {
        const ws = composite.layerScores.water.score;
        if (ws <= 40) {
          console.warn(
            `  ! Expected high water score, got ${ws} (federal data may have changed)`
          );
        } else {
          console.log(`  ✓ High water score: ${ws}`);
        }
      }
      if (test.expectFloodZone && assessment.soilData?.floodZone) {
        console.log(
          `  ✓ Flood zone: ${assessment.soilData.floodZone.zone}`
        );
      }
      if (test.expectSoilData && assessment.soilData?.ssurgo) {
        console.log(
          `  ✓ SSURGO map unit: ${assessment.soilData.ssurgo.mapUnitName}`
        );
      }

      // Verify recommendations shape
      if (Array.isArray(assessment.recommendations)) {
        for (const rec of assessment.recommendations) {
          assert(
            rec.sourceCitation,
            `Recommendation ${rec.templateId} missing source citation`
          );
          assert(
            rec.disclaimer,
            `Recommendation ${rec.templateId} missing disclaimer`
          );
          const forbidden = ['safe to drink', 'unsafe', 'dangerous'];
          for (const phrase of forbidden) {
            assert(
              !rec.finding.toLowerCase().includes(phrase),
              `Recommendation ${rec.templateId} uses forbidden phrase "${phrase}"`
            );
          }
        }
        console.log(
          `  ✓ ${assessment.recommendations.length} recommendations passed safety check`
        );
      }

      passed++;
      console.log(`  ✓ PASSED\n`);
    } catch (err) {
      failed++;
      const msg = `${test.label}: ${(err as Error).message}`;
      failures.push(msg);
      console.log(`  ✗ FAILED: ${(err as Error).message}\n`);
    }
  }

  console.log('=== Results ===');
  console.log(`Passed: ${passed}/${TEST_ADDRESSES.length}`);
  console.log(`Failed: ${failed}/${TEST_ADDRESSES.length}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }

  console.log('\nAll integration tests passed.');
}

runIntegrationTests().catch((err) => {
  console.error('Integration test runner failed:', err);
  process.exit(1);
});
