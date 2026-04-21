import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'cfci-national.json');
const DEFAULT_LIMIT = 100;

/**
 * GET /api/intelligence/cfci
 *
 * Returns the national CFCI (Compound Flood-Contamination Index) dataset.
 *
 * Query params:
 *   ?fips=12087  — return the single matching county record
 *   ?limit=25    — number of results (default 100)
 *   ?state=FL    — filter by two-letter state code
 *   ?quartile=4  — filter by CFCI quartile (1–4)
 *
 * Status codes:
 *   200  Data available
 *   404  FIPS provided but no matching county
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

  const raw = readFileSync(DATA_PATH, 'utf-8');
  let data: Record<string, unknown>[];

  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse CFCI data' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;

  const fipsFilter = searchParams.get('fips');
  if (fipsFilter) {
    const record = data.find((d) => d.fips === fipsFilter);
    if (!record) {
      return NextResponse.json(
        { error: 'County not found', fips: fipsFilter },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { data: record },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  }

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
        (d.state as string).toUpperCase() === stateFilter
    );
  }

  if (quartileFilter && quartileFilter >= 1 && quartileFilter <= 4) {
    data = data.filter((d) => d.cfciQuartile === quartileFilter);
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
