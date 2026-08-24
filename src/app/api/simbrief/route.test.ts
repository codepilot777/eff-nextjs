import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

let POST: typeof import('./route').POST;
let db: typeof import('@/lib/db').default;
let createSessionToken: typeof import('@/lib/auth').createSessionToken;
let SESSION_COOKIE_NAME: string;

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'eff-test-'));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  process.env.INSTRUCTOR_PASSWORD = 'test-password';

  ({ default: db } = await import('@/lib/db'));
  ({ POST } = await import('./route'));
  ({ createSessionToken, SESSION_COOKIE_NAME } = await import('@/lib/auth'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function authedPostRequest(body: unknown) {
  const { token } = createSessionToken();
  return new Request('http://localhost/api/simbrief', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
    },
    body: JSON.stringify(body),
  });
}

// 🌟 起真正個 POST() handler（唔係淨係 unit test syncTechlogForNewFlight 呢個 pure
// function），連 fetch(simbrief.com) 都 mock 埋，先可以確認成條 route（包括 ensureSchema/
// db.execute 嗰啲真正嘅 DB 互動）真係會寫低 techlog continuity，而唔係淨係喺我自己嘅
// 手動腳本度先行得通
function mockSimbriefFetch(overrides: Record<string, unknown> = {}) {
  const payload = {
    fetch: { status: 'Success' },
    general: { icao_airline: 'CX', flight_number: '888', route: 'DCT', initial_altitude: '35000' },
    aircraft: { reg: 'B-TESTREG', icao_code: 'B773' },
    origin: { icao_code: 'RJAA', iata_code: 'NRT' },
    destination: { icao_code: 'VHHH', iata_code: 'HKG' },
    fuel: { taxi: '500', enroute_burn: '18000', contingency: '1000', alternate_burn: '3000', reserve: '2500', plan_ramp: '25000', plan_takeoff: '24500' },
    weights: { est_zfw: '200000', est_tow: '224500', est_ldw: '206500', oew: '161968' },
    times: { est_out: '1700000000', est_in: '1700010000', est_time_enroute: '10000' },
    navlog: { fix: [] },
    alternate: null,
    ...overrides,
  };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: async () => payload,
  }));
}

describe('/api/simbrief POST — techlog continuity side effect', () => {
  it('writes a techlog row for a brand-new aircraft reg with the engineer release checklist forced true', async () => {
    mockSimbriefFetch({ aircraft: { reg: 'B-FRESH1', icao_code: 'B773' } });

    const res = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'CX888' }));
    expect(res.status).toBe(200);

    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ?', args: ['B-FRESH1'] });
    expect(row.rows[0]).toBeDefined();
    const tl = JSON.parse(row.rows[0].data as string);

    expect(tl.tl_prep_flt).toBe('CX888');
    expect(tl.tl_prep_dep).toBe('NRT');
    expect(tl.tl_prep_arr).toBe('HKG');
    expect(tl.tl_fluids).toBe(true);
    expect(tl.tl_checks).toBe(true);
    expect(tl.tl_defects).toBe(true);
    expect(tl.tl_release).toBe(true);
  });

  it('auto-inserts a 10-sector bridging chain when an existing techlog for the reg has a continuity mismatch', async () => {
    // Pre-seed a techlog for this reg whose last known position is HKG,
    // with the release checklist left in a "not released" leftover state.
    await db.execute({
      sql: 'REPLACE INTO techlogs (reg, data) VALUES (?, ?)',
      args: ['B-MISMATCH1', JSON.stringify({
        tl_prev_arr: 'HKG', tl_prev_dep: 'SIN', tl_prev_flt: 'CX691', tl_prev_fob: '10.5',
        tl_fluids: false, tl_checks: false, tl_defects: false, tl_release: false,
        tl_cmdr: 'CHAN T M',
        flights: [{ id: 'SEC-OLD', date: '01 JAN 2026', action: 'Normal Close', flt: 'CX691', route: 'SIN ➔ HKG' }],
      })],
    });

    // New flight departs NRT, not HKG — a genuine mismatch against the techlog's last known position
    mockSimbriefFetch({ aircraft: { reg: 'B-MISMATCH1', icao_code: 'B773' } });

    const res = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'CX999' }));
    expect(res.status).toBe(200);

    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ?', args: ['B-MISMATCH1'] });
    const tl = JSON.parse(row.rows[0].data as string);

    expect(tl.flights.length).toBe(11); // 1 original + 10 chained bridging sectors
    expect(String(tl.flights[0].route).endsWith('➔ NRT')).toBe(true);
    expect(tl.tl_fluids).toBe(true);
    expect(tl.tl_checks).toBe(true);
    expect(tl.tl_defects).toBe(true);
    expect(tl.tl_release).toBe(true);
  });

  it('does not throw / still returns 200 even if the aircraft reg is missing from the SimBrief payload (falls back to B-HNQ)', async () => {
    mockSimbriefFetch({ aircraft: {} });
    const res = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'CX777' }));
    expect(res.status).toBe(200);

    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ?', args: ['B-HNQ'] });
    expect(row.rows[0]).toBeDefined();
  });
});
