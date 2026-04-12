/**
 * Integration test runner — tests the full data pipeline end-to-end against
 * a running dev server. Uses REAL API calls to federal data sources.
 *
 * Run with: pnpm test:integration
 *
 * Requires:
 *  - Dev server running: pnpm dev
 *  - Outbound HTTPS from Node.js to Census, EPA, etc.
 *
 * If either prerequisite is unmet the runner exits 0 (skip, not fail),
 * so `pnpm qa` succeeds in restricted environments.
 */
export {};

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Availability guards
// ---------------------------------------------------------------------------

async function isServerUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(5_000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

/** Check that Node.js fetch can reach an external HTTPS endpoint. */
async function canReachExternalApis(): Promise<boolean> {
  try {
    const res = await fetch(
      'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=test&benchmark=Public_AR_Current&vintage=Current_Current&format=json',
      { signal: AbortSignal.timeout(10_000) }
    );
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

interface GeocodeTestCase {
  address: string;
  label: string;
  expectPwsid?: boolean;
  expectFipsState?: string;
  expectNull?: boolean;
}

const GEOCODE_TEST_CASES: GeocodeTestCase[] = [
  {
    address: '1600 Pennsylvania Ave NW, Washington, DC 20500',
    label: 'White House — DC Water should resolve',
    expectPwsid: true,
    expectFipsState: '11',
  },
  {
    address: '101 Main St, Valentine, NE 69201',
    label: 'Rural Nebraska — small water system',
    expectPwsid: true,
    expectFipsState: '31',
  },
  {
    address: '123 Water St, Hoosick Falls, NY 12090',
    label: 'Small water system (Hoosick Falls PFAS site)',
    expectPwsid: true,
    expectFipsState: '36',
  },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------------------
// Exposure-assessment tests
// ---------------------------------------------------------------------------

async function runAssessmentTests(): Promise<{ passed: number; failed: number; failures: string[] }> {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const test of TEST_ADDRESSES) {
    console.log(`Testing: ${test.label} (${test.address})`);

    try {
      const encoded = encodeURIComponent(test.address);
      const assessRes = await fetch(
        `${BASE}/api/exposure-assessment?address=${encoded}`
      );

      if (!assessRes.ok) {
        const body = await assessRes.text();
        throw new Error(
          `Assessment failed: HTTP ${assessRes.status} — ${body.slice(0, 200)}`
        );
      }

      const assessment = await assessRes.json();
      const composite = assessment.compositeScore;

      assert(composite, 'Missing compositeScore');
      assert(typeof composite.score === 'number', `Composite score not a number: ${composite.score}`);
      assert(composite.score >= 0 && composite.score <= 100, `Score out of range: ${composite.score}`);
      assert(composite.confidence, 'Missing confidence');
      assert(Array.isArray(composite.layersIncluded), 'Missing layersIncluded');

      console.log(`  ✓ Composite: ${composite.score}/100 (${composite.confidence})`);
      console.log(`  ✓ Layers: ${composite.layersIncluded.join(', ') || 'none'}`);

      if (test.expectHighWater && composite.layerScores?.water) {
        const ws = composite.layerScores.water.score;
        if (ws <= 40) console.warn(`  ! Expected high water score, got ${ws}`);
        else console.log(`  ✓ High water score: ${ws}`);
      }
      if (test.expectFloodZone && assessment.soilData?.floodZone) {
        console.log(`  ✓ Flood zone: ${assessment.soilData.floodZone.zone}`);
      }
      if (test.expectSoilData && assessment.soilData?.ssurgo) {
        console.log(`  ✓ SSURGO map unit: ${assessment.soilData.ssurgo.mapUnitName}`);
      }

      if (Array.isArray(assessment.recommendations)) {
        for (const rec of assessment.recommendations) {
          assert(rec.sourceCitation, `Recommendation ${rec.templateId} missing source citation`);
          assert(rec.disclaimer, `Recommendation ${rec.templateId} missing disclaimer`);
          const forbidden = ['safe to drink', 'unsafe', 'dangerous'];
          for (const phrase of forbidden) {
            assert(
              !rec.finding.toLowerCase().includes(phrase),
              `Recommendation ${rec.templateId} uses forbidden phrase "${phrase}"`
            );
          }
        }
        console.log(`  ✓ ${assessment.recommendations.length} recommendations passed safety check`);
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

  return { passed, failed, failures };
}

// ---------------------------------------------------------------------------
// Geocode endpoint tests
// ---------------------------------------------------------------------------

async function runGeocodeTests(): Promise<{ passed: number; failed: number; failures: string[] }> {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log('\n── Geocode endpoint integration tests ──\n');

  for (const test of GEOCODE_TEST_CASES) {
    console.log(`Testing: ${test.label} (${test.address})`);

    try {
      const res = await fetch(`${BASE}/api/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: test.address }),
      });

      if (test.expectNull) {
        assert(res.status === 404, `Expected 404, got ${res.status}`);
        console.log(`  ✓ Correctly returned 404`);
        passed++;
        console.log(`  ✓ PASSED\n`);
        continue;
      }

      assert(res.ok, `HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data;

      assert(data, 'Missing data field in response');
      assert(typeof data.latitude === 'number', 'Missing latitude');
      assert(typeof data.longitude === 'number', 'Missing longitude');
      assert(data.source === 'census' || data.source === 'mapbox', `Invalid source: ${data.source}`);

      console.log(`  ✓ Coordinates: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
      console.log(`  ✓ Source: ${data.source}`);

      if (test.expectFipsState) {
        assert(
          data.fipsState === test.expectFipsState,
          `Expected fipsState ${test.expectFipsState}, got ${data.fipsState}`
        );
        console.log(`  ✓ FIPS state: ${data.fipsState}`);
      }

      if (test.expectPwsid) {
        if (data.waterSystemId) {
          console.log(`  ✓ PWSID: ${data.waterSystemId} (${data.waterSystemName})`);
        } else {
          console.warn('  ! PWSID not found (EPA SDWIS may not have data for this area)');
        }
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

  // Error cases
  const errorCases = [
    { body: { address: '' }, expectedStatus: 400, label: 'Empty address → 400' },
    { body: { address: 'zznotreal99999xyz' }, expectedStatus: 404, label: 'Nonsense address → 404' },
    { body: {}, expectedStatus: 400, label: 'Missing address field → 400' },
  ];

  for (const ec of errorCases) {
    console.log(`Testing: ${ec.label}`);
    try {
      const res = await fetch(`${BASE}/api/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ec.body),
      });
      assert(
        res.status === ec.expectedStatus,
        `Expected ${ec.expectedStatus}, got ${res.status}`
      );
      console.log(`  ✓ ${ec.label} — ${res.status}`);
      passed++;
    } catch (err) {
      failed++;
      const msg = `${ec.label}: ${(err as Error).message}`;
      failures.push(msg);
      console.log(`  ✗ FAILED: ${(err as Error).message}`);
    }
  }

  return { passed, failed, failures };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function runIntegrationTests() {
  console.log('=== Bedrock Integration Tests ===');
  console.log(`Target: ${BASE}\n`);

  // Bail out gracefully when dev server is not running
  if (!(await isServerUp())) {
    console.log('Dev server not reachable at', BASE);
    console.log('Skipping integration tests (start with: pnpm dev).');
    process.exit(0);
  }

  // Bail out if Node.js can't reach external APIs (sandboxed environments)
  if (!(await canReachExternalApis())) {
    console.log('Cannot reach external APIs (Census, EPA) from Node.js fetch.');
    console.log('Skipping integration tests — external HTTPS may be blocked.');
    process.exit(0);
  }

  const assessResult = await runAssessmentTests();
  const geocodeResult = await runGeocodeTests();

  const totalPassed = assessResult.passed + geocodeResult.passed;
  const totalFailed = assessResult.failed + geocodeResult.failed;
  const allFailures = [...assessResult.failures, ...geocodeResult.failures];

  console.log('\n=== Results ===');
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);

  if (allFailures.length > 0) {
    console.log('\nFailures:');
    allFailures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }

  console.log('\nAll integration tests passed.');
}

runIntegrationTests().catch((err) => {
  console.error('Integration test runner failed:', err);
  process.exit(1);
});
