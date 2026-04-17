import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'scvi-national.json');
const DEFAULT_LIMIT = 100;

/**
 * GET /api/intelligence/scvi
 *
 * Returns the national SCVI (Soil Contamination Vulnerability Index) dataset.
 *
 * Query params:
 *   ?limit=25   — number of results (default 100)
 *   ?state=NJ   — filter by two-letter state code
 *   ?quartile=4 — filter by vulnerability quartile (1–4)
 *
 * Status codes:
 *   200  Data available
 *   503  Data still processing (file not yet generated)
 */
export async function GET(request: NextRequest) {
  if (!existsSync(DATA_PATH)) {
    return NextResponse.json(
      { error: 'Data processing in progress', status: 'processing' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  }

  // Read and parse the dataset
  const raw = readFileSync(DATA_PATH, 'utf-8');
  let data: Record<string, unknown>[];

  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse SCVI data' },
      { status: 500 }
    );
  }

  // ── Query param filtering ───────────────────────────────────────────────
  const searchParams = request.nextUrl.searchParams;

  const stateFilter = searchParams.get('state')?.toUpperCase() ?? null;
  const quartileFilter = searchParams.get('quartile')
    ? Number(searchParams.get('quartile'))
    : null;
  const limit = Math.max(
    1,
    Number(searchParams.get('limit')) || DEFAULT_LIMIT
  );

  if (stateFilter) {
    data = data.filter(
      (d) =>
        typeof d.state === 'string' &&
        d.state.toUpperCase() === stateFilter
    );
  }

  if (quartileFilter && quartileFilter >= 1 && quartileFilter <= 4) {
    data = data.filter((d) => d.quartile === quartileFilter);
  }

  data = data.slice(0, limit);

  return NextResponse.json(
    { data, count: data.length },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
