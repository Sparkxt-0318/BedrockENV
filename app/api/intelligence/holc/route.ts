import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const CROSSWALK_PATH = path.join(process.cwd(), 'data', 'holc-crosswalk.json');

interface HolcRecord {
  area_id: number;
  grade: string;
  city: string;
  state: string;
  GEOID: string;
  pct_tract: number;
  calc_area: number;
}

let cache: HolcRecord[] | null = null;
let tractIndex: Map<string, HolcRecord[]> | null = null;

function load() {
  if (cache) return;
  if (!existsSync(CROSSWALK_PATH)) return;
  cache = JSON.parse(readFileSync(CROSSWALK_PATH, 'utf-8'));
  tractIndex = new Map();
  for (const r of cache!) {
    let arr = tractIndex.get(r.GEOID);
    if (!arr) {
      arr = [];
      tractIndex.set(r.GEOID, arr);
    }
    arr.push(r);
  }
}

/**
 * GET /api/intelligence/holc?tract=01073010801
 *
 * Returns HOLC grade(s) for a given census tract GEOID.
 * If the tract overlaps multiple HOLC areas, returns the one
 * with the largest intersection area (calc_area).
 */
export async function GET(request: NextRequest) {
  load();

  if (!cache || !tractIndex) {
    return NextResponse.json(
      { error: 'HOLC data not available', status: 'processing' },
      { status: 503, headers: { 'Cache-Control': 'public, max-age=3600' } }
    );
  }

  const tract = request.nextUrl.searchParams.get('tract');
  if (!tract) {
    return NextResponse.json(
      { error: 'Missing required parameter: tract (11-digit census tract GEOID)' },
      { status: 400 }
    );
  }

  const matches = tractIndex.get(tract);
  if (!matches || matches.length === 0) {
    return NextResponse.json(
      { data: null, tract },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    );
  }

  const best = matches.reduce((a, b) => (a.calc_area > b.calc_area ? a : b));

  return NextResponse.json(
    {
      data: {
        grade: best.grade,
        city: best.city,
        state: best.state,
        areaId: best.area_id,
        pctTract: best.pct_tract,
      },
      allMatches: matches.map((m) => ({
        grade: m.grade,
        city: m.city,
        areaId: m.area_id,
        pctTract: m.pct_tract,
      })),
      tract,
    },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
