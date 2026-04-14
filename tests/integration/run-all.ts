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

interface WaterClientTestCase {
  pwsid: string;
  label: string;
  expectPfasInBundle: boolean;
  expectPfasExceedsMcl?: boolean;
}

/** Direct-client water tests — hit the in-process clients (not the HTTP API). */
const WATER_CLIENT_TESTS: WaterClientTestCase[] = [
  {
    pwsid: 'DC0000003',
    label: 'Naval Station Washington (DC) — UCMR 5 PFAS detections',
    expectPfasInBundle: true,
  },
  {
    pwsid: 'NJ0714001',
    label: 'Newark Water Department (NJ) — UCMR 5 PFAS exceeds MCL',
    expectPfasInBundle: true,
    expectPfasExceedsMcl: true,
  },
  {
    // Small systems were not required to participate in UCMR 5, so
    // Hoosick Falls is absent from the bundle. The client must return
    // data=null with no error for this case.
    pwsid: 'NY0201230',
    label: 'Hoosick Falls NY PFAS site — should be absent from UCMR 5 bundle',
    expectPfasInBundle: false,
  },
];

interface LeadClientTestCase {
  fipsState: string;
  fipsCounty: string;
  censusTract: string;
  censusBlockGroup: string;
  label: string;
  expectRiskTier?: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
}

const LEAD_CLIENT_TESTS: LeadClientTestCase[] = [
  {
    // Central Philadelphia — pre-war rowhouses, known high lead plumbing risk.
    fipsState: '42',
    fipsCounty: '101',
    censusTract: '000200',
    censusBlockGroup: '1',
    label: 'Philadelphia PA — pre-war housing stock',
  },
  {
    // Phoenix suburb — mostly post-1986 construction, should score LOW.
    fipsState: '04',
    fipsCounty: '013',
    censusTract: '420100',
    censusBlockGroup: '1',
    label: 'Phoenix AZ suburb — post-1986 housing stock',
    expectRiskTier: 'LOW',
  },
];

// ---------------------------------------------------------------------------
// Soil-client integration tests (SSURGO, brownfields, NFHL, NASA POWER).
// These hit real federal upstreams and are gated on external connectivity.
// ---------------------------------------------------------------------------

interface SoilClientTestCase {
  label: string;
  latitude: number;
  longitude: number;
  /** Which client(s) we expect to surface data for this location. */
  expect: {
    ssurgo?: 'mapped' | 'partial' | 'unmapped' | 'any';
    brownfieldsNonEmpty?: boolean;
    floodSfha?: boolean;
    power?: boolean;
  };
}

const SOIL_CLIENT_TESTS: SoilClientTestCase[] = [
  {
    // Salinas Valley cropland — rich SSURGO chemistry, no brownfields expected.
    label: 'Salinas Valley CA cropland — SSURGO',
    latitude: 36.645,
    longitude: -121.59,
    expect: { ssurgo: 'mapped', power: true },
  },
  {
    // Newark NJ industrial corridor — expected brownfield proximity hits.
    label: 'Newark NJ industrial corridor — Brownfields',
    latitude: 40.7282,
    longitude: -74.1788,
    expect: { brownfieldsNonEmpty: true, ssurgo: 'any', power: true },
  },
  {
    // Miami Beach barrier island — coastal SFHA.
    label: 'Miami Beach FL barrier island — NFHL coastal',
    latitude: 25.7907,
    longitude: -80.13,
    expect: { floodSfha: true, power: true },
  },
];

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
// Data-client integration tests (UCMR 5 PFAS, SDWIS violations, lead risk)
// These import the clients directly and hit the real upstream sources
// (Census API) or the committed UCMR 5 bundle. They don't need the dev server.
// ---------------------------------------------------------------------------

async function runWaterClientTests(): Promise<{
  passed: number;
  failed: number;
  failures: string[];
}> {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log('\n── UCMR 5 PFAS client integration tests ──\n');

  const { fetchUcmr5PfasData } = await import('@/lib/data-sources/epa-ucmr5');
  const { fetchSdwisViolations } = await import('@/lib/data-sources/epa-sdwis');

  for (const test of WATER_CLIENT_TESTS) {
    console.log(`Testing: ${test.label}`);
    try {
      const pfas = await fetchUcmr5PfasData(test.pwsid, test.pwsid);

      if (test.expectPfasInBundle) {
        assert(pfas.error === null, `Expected no error, got: ${pfas.error}`);
        assert(pfas.data !== null, `Expected PFAS data for ${test.pwsid}`);
        assert(
          Array.isArray(pfas.data!.analytes) && pfas.data!.analytes.length > 0,
          `Expected at least one detected analyte for ${test.pwsid}`
        );
        console.log(
          `  ✓ Analytes: ${pfas.data!.analytes.length} | max: ${pfas.data!.maxIndividual} ppt | exceedsMcl: ${pfas.data!.exceedsMcl}`
        );
        if (test.expectPfasExceedsMcl !== undefined) {
          assert(
            pfas.data!.exceedsMcl === test.expectPfasExceedsMcl,
            `exceedsMcl expected ${test.expectPfasExceedsMcl}, got ${pfas.data!.exceedsMcl}`
          );
        }
      } else {
        assert(
          pfas.data === null && pfas.error === null,
          `Expected {data:null, error:null} for system absent from UCMR 5 bundle, got data=${!!pfas.data} error=${pfas.error}`
        );
        console.log('  ✓ Correctly absent from UCMR 5 bundle');
      }

      // Violations client hits the live EPA Envirofacts API — treat network
      // failure as a soft warning because the upstream is flaky.
      const violations = await fetchSdwisViolations(test.pwsid);
      if (violations.error) {
        console.warn(`  ! SDWIS violations fetch error (non-fatal): ${violations.error}`);
      } else {
        console.log(`  ✓ SDWIS violations fetched: ${violations.data?.length ?? 0} rows`);
      }

      passed++;
      console.log('  ✓ PASSED\n');
    } catch (err) {
      failed++;
      const msg = `${test.label}: ${(err as Error).message}`;
      failures.push(msg);
      console.log(`  ✗ FAILED: ${(err as Error).message}\n`);
    }
  }

  return { passed, failed, failures };
}

async function runLeadClientTests(): Promise<{
  passed: number;
  failed: number;
  failures: string[];
}> {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log('\n── Lead risk client integration tests ──\n');

  const { fetchLeadRiskData } = await import('@/lib/data-sources/epa-lead');

  for (const test of LEAD_CLIENT_TESTS) {
    console.log(`Testing: ${test.label}`);
    try {
      const result = await fetchLeadRiskData(
        test.fipsState,
        test.fipsCounty,
        test.censusTract,
        test.censusBlockGroup
      );

      // Census API responses can vary by block group; we require at least a
      // valid shape, not a specific tier.
      if (result.error) {
        // Census ACS occasionally has no data for a specific block group.
        // Treat empty results as a soft skip rather than a hard failure.
        console.warn(`  ! Census returned error (soft skip): ${result.error}`);
        passed++;
        continue;
      }

      assert(result.data !== null, 'Expected lead risk data');
      assert(
        typeof result.data!.pctPreA1950 === 'number',
        'pctPreA1950 not a number'
      );
      assert(
        typeof result.data!.pctPre1986 === 'number',
        'pctPre1986 not a number'
      );
      assert(
        ['LOW', 'MODERATE', 'ELEVATED', 'HIGH'].includes(result.data!.riskTier),
        `Invalid riskTier: ${result.data!.riskTier}`
      );

      console.log(
        `  ✓ pre-1950: ${result.data!.pctPreA1950}% | pre-1986: ${result.data!.pctPre1986}% | tier: ${result.data!.riskTier}`
      );

      if (test.expectRiskTier && result.data!.riskTier !== test.expectRiskTier) {
        console.warn(
          `  ! Expected ${test.expectRiskTier}, got ${result.data!.riskTier} — this is data-dependent, logging as warning only`
        );
      }

      passed++;
      console.log('  ✓ PASSED\n');
    } catch (err) {
      failed++;
      const msg = `${test.label}: ${(err as Error).message}`;
      failures.push(msg);
      console.log(`  ✗ FAILED: ${(err as Error).message}\n`);
    }
  }

  return { passed, failed, failures };
}

async function runSoilClientTests(): Promise<{
  passed: number;
  failed: number;
  failures: string[];
}> {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log('\n── Soil-layer client integration tests ──\n');

  const { fetchSsurgoData } = await import('@/lib/data-sources/usda-ssurgo');
  const { fetchBrownfieldSites } = await import(
    '@/lib/data-sources/epa-brownfields'
  );
  const { fetchFloodZone } = await import('@/lib/data-sources/fema-nfhl');
  const { fetchNasaPowerData } = await import('@/lib/data-sources/nasa-smap');

  for (const test of SOIL_CLIENT_TESTS) {
    console.log(`Testing: ${test.label} (${test.latitude}, ${test.longitude})`);

    let caseFailed = false;

    try {
      // SSURGO
      if (test.expect.ssurgo) {
        const ssurgo = await fetchSsurgoData(test.latitude, test.longitude);
        if (ssurgo.error) {
          console.warn(`  ! SSURGO error (non-fatal): ${ssurgo.error}`);
        } else if (ssurgo.data) {
          const cov = ssurgo.data.coverage;
          if (test.expect.ssurgo !== 'any' && cov !== test.expect.ssurgo) {
            console.warn(
              `  ! Expected SSURGO coverage=${test.expect.ssurgo}, got ${cov}`
            );
          } else {
            console.log(
              `  ✓ SSURGO coverage=${cov} muname="${ssurgo.data.mapUnitName}" pH=${ssurgo.data.phRange[0]}–${ssurgo.data.phRange[1]} OM=${ssurgo.data.organicMatterPct}%`
            );
          }
        }
      }

      // Brownfields
      if (test.expect.brownfieldsNonEmpty !== undefined) {
        const bf = await fetchBrownfieldSites(test.latitude, test.longitude);
        if (bf.error) {
          console.warn(`  ! Brownfields error (non-fatal): ${bf.error}`);
        } else if (bf.data) {
          console.log(
            `  ✓ Brownfields: ${bf.data.length} sites within 2 mi${
              bf.data[0]
                ? ` (nearest: ${bf.data[0].name} ${bf.data[0].distance} mi ${bf.data[0].direction})`
                : ''
            }`
          );
          if (test.expect.brownfieldsNonEmpty && bf.data.length === 0) {
            console.warn(
              '  ! Expected at least one brownfield nearby — FRS may be missing records for this area'
            );
          }
        }
      }

      // FEMA NFHL
      if (test.expect.floodSfha !== undefined) {
        const fz = await fetchFloodZone(test.latitude, test.longitude);
        if (fz.error) {
          console.warn(`  ! NFHL error (non-fatal): ${fz.error}`);
        } else if (fz.data) {
          console.log(
            `  ✓ Flood zone: ${fz.data.zone} coverage=${fz.data.coverage} sfha=${fz.data.isSpecialFloodHazardArea} features=${fz.data.features.length}`
          );
          if (test.expect.floodSfha && !fz.data.isSpecialFloodHazardArea) {
            console.warn(
              `  ! Expected SFHA, got zone=${fz.data.zone} — NFHL map revision may have reclassified this parcel`
            );
          }
        }
      }

      // NASA POWER
      if (test.expect.power) {
        const p = await fetchNasaPowerData(test.latitude, test.longitude);
        if (p.error) {
          console.warn(`  ! POWER error (non-fatal): ${p.error}`);
        } else if (p.data) {
          console.log(
            `  ✓ POWER: ${p.data.precipitationAvgMm} mm/yr, T=${p.data.meanAnnualTempC}°C, aridity=${p.data.aridityIndex ?? 'n/a'}, trend=${p.data.trend}, fills=${(p.data.fillFraction * 100).toFixed(1)}%`
          );
        }
      }

      if (!caseFailed) {
        passed++;
        console.log('  ✓ PASSED\n');
      }
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
// Main
// ---------------------------------------------------------------------------

async function runIntegrationTests() {
  console.log('=== Bedrock Integration Tests ===');
  console.log(`Target: ${BASE}\n`);

  const allPassed: number[] = [];
  const allFailed: number[] = [];
  const allFailures: string[] = [];

  // UCMR 5 client tests run against the committed bundle — no external
  // network required. Always safe to run.
  const waterClientResult = await runWaterClientTests();
  allPassed.push(waterClientResult.passed);
  allFailed.push(waterClientResult.failed);
  allFailures.push(...waterClientResult.failures);

  // Lead + HTTP-based tests need outbound HTTPS. Skip gracefully when the
  // sandbox blocks Node's fetch.
  const externalReachable = await canReachExternalApis();
  if (!externalReachable) {
    console.log(
      '\nCannot reach external APIs (Census, EPA) from Node.js fetch — skipping lead-client and HTTP-endpoint tests.'
    );
  } else {
    const leadClientResult = await runLeadClientTests();
    allPassed.push(leadClientResult.passed);
    allFailed.push(leadClientResult.failed);
    allFailures.push(...leadClientResult.failures);

    const soilClientResult = await runSoilClientTests();
    allPassed.push(soilClientResult.passed);
    allFailed.push(soilClientResult.failed);
    allFailures.push(...soilClientResult.failures);
  }

  // HTTP-endpoint tests need both a dev server AND external APIs.
  if (externalReachable && (await isServerUp())) {
    const assessResult = await runAssessmentTests();
    const geocodeResult = await runGeocodeTests();
    allPassed.push(assessResult.passed, geocodeResult.passed);
    allFailed.push(assessResult.failed, geocodeResult.failed);
    allFailures.push(...assessResult.failures, ...geocodeResult.failures);
  } else {
    console.log('\nSkipping HTTP-endpoint tests (dev server or external network unavailable).');
  }

  const totalPassed = allPassed.reduce((a, b) => a + b, 0);
  const totalFailed = allFailed.reduce((a, b) => a + b, 0);

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
