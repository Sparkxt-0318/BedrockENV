/**
 * Quick smoke test — verifies the app starts and key pages render.
 * Run with: pnpm test:smoke
 * Requires dev server running on localhost:3000 (or NEXT_PUBLIC_APP_URL).
 */
export {};

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface RouteCheck {
  path: string;
  expect: number;
  label: string;
}

const ROUTES_TO_CHECK: RouteCheck[] = [
  { path: '/', expect: 200, label: 'Landing page' },
  { path: '/methodology', expect: 200, label: 'Methodology page' },
  { path: '/about', expect: 200, label: 'About page' },
  { path: '/auth/login', expect: 200, label: 'Login page' },
];

interface ApiCheck {
  path: string;
  method: string;
  body?: unknown;
  expect: number;
  label: string;
  validateBody?: (body: unknown) => void;
}

const API_CHECKS: ApiCheck[] = [
  {
    path: '/api/exposure-assessment?address=' +
      encodeURIComponent('1600 Pennsylvania Ave NW, Washington, DC 20500'),
    method: 'GET',
    expect: 200,
    label: 'Exposure assessment API with valid address',
    validateBody: (body) => {
      const b = body as { data?: { compositeScore?: { score?: number } } };
      if (typeof b.data?.compositeScore?.score !== 'number') {
        throw new Error('Missing composite score');
      }
    },
  },
  {
    path: '/api/exposure-assessment?address=',
    method: 'GET',
    expect: 400,
    label: 'Exposure assessment API with empty address (should 400)',
  },

  // ── Geocode endpoint ──────────────────────────────────────────────────────
  {
    path: '/api/geocode',
    method: 'POST',
    body: { address: '1600 Pennsylvania Ave NW, Washington, DC 20500' },
    expect: 200,
    label: 'Geocode API with valid White House address',
    validateBody: (body) => {
      const b = body as { data?: { latitude?: number; longitude?: number; source?: string } };
      if (typeof b.data?.latitude !== 'number') throw new Error('Missing latitude');
      if (typeof b.data?.longitude !== 'number') throw new Error('Missing longitude');
      if (!b.data?.source) throw new Error('Missing source field');
    },
  },
  {
    path: '/api/geocode',
    method: 'POST',
    body: { address: 'zzzznotarealaddressxyz 00000' },
    expect: 404,
    label: 'Geocode API with nonsense address (should 404)',
  },
  {
    path: '/api/geocode',
    method: 'POST',
    body: { address: '' },
    expect: 400,
    label: 'Geocode API with empty address (should 400)',
  },
  {
    path: '/api/geocode',
    method: 'POST',
    body: {},
    expect: 400,
    label: 'Geocode API with missing address field (should 400)',
  },
];

async function runSmokeTests() {
  console.log('=== Bedrock Smoke Tests ===');
  console.log(`Target: ${BASE}\n`);
  let passed = 0;
  let failed = 0;

  for (const route of ROUTES_TO_CHECK) {
    try {
      const res = await fetch(`${BASE}${route.path}`);
      if (res.status !== route.expect) {
        throw new Error(`Expected ${route.expect}, got ${res.status}`);
      }
      if (route.expect === 200) {
        const html = await res.text();
        if (
          html.includes('Application error') ||
          html.includes('Internal Server Error')
        ) {
          throw new Error('Page rendered with error state');
        }
      }
      console.log(`  ✓ ${route.label} — ${res.status}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${route.label} — ${(err as Error).message}`);
      failed++;
    }
  }

  for (const check of API_CHECKS) {
    try {
      const fetchOpts: RequestInit = { method: check.method };
      if (check.body !== undefined) {
        fetchOpts.headers = { 'Content-Type': 'application/json' };
        fetchOpts.body = JSON.stringify(check.body);
      }
      const res = await fetch(`${BASE}${check.path}`, fetchOpts);
      if (res.status !== check.expect) {
        throw new Error(`Expected ${check.expect}, got ${res.status}`);
      }
      if (check.validateBody) {
        const body = await res.json();
        check.validateBody(body);
      }
      console.log(`  ✓ ${check.label} — ${res.status}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${check.label} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

runSmokeTests().catch((err) => {
  console.error('Smoke test runner failed:', err);
  process.exit(1);
});
