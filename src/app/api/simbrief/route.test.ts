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
    // 🌟 techlogs 而家 key by flight_id——呢度用個假 flight_id 模擬「呢個 reg 之前
    // 一個 session 留低嘅 techlog」，simbrief route 應該揾到佢做 continuity 種子
    await db.execute({
      sql: 'REPLACE INTO techlogs (flight_id, reg, data) VALUES (?, ?, ?)',
      args: ['SEED-MISMATCH1', 'B-MISMATCH1', JSON.stringify({
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

    // 🌟 新 session 起咗自己獨立嘅 techlog row（唔再 REPLACE 咗個 seed row），
    // 揾返最新一條先係啱嘅 assertion 對象
    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ? ORDER BY rowid DESC LIMIT 1', args: ['B-MISMATCH1'] });
    const tl = JSON.parse(row.rows[0].data as string);

    expect(tl.flights.length).toBe(11); // 1 original + 10 chained bridging sectors
    expect(String(tl.flights[0].route).endsWith('➔ NRT')).toBe(true);
    expect(tl.tl_fluids).toBe(true);
    expect(tl.tl_checks).toBe(true);
    expect(tl.tl_defects).toBe(true);
    expect(tl.tl_release).toBe(true);
  });

  it('still inserts a 10-sector chain even when the new departure already matches the known current location', async () => {
    await db.execute({
      sql: 'REPLACE INTO techlogs (flight_id, reg, data) VALUES (?, ?, ?)',
      args: ['SEED-MATCHED1', 'B-MATCHED1', JSON.stringify({
        tl_prev_arr: 'NRT', tl_prev_dep: 'HKG', tl_prev_flt: 'CX564', tl_prev_fob: '10.5',
        tl_fluids: true, tl_checks: true, tl_defects: true, tl_release: true,
        tl_cmdr: 'CHAN T M',
        flights: [{ id: 'SEC-OLD', date: '01 JAN 2026', action: 'Normal Close', flt: 'CX564', route: 'HKG ➔ NRT' }],
      })],
    });

    // New flight also departs NRT — already continuous, no mismatch to bridge
    mockSimbriefFetch({ aircraft: { reg: 'B-MATCHED1', icao_code: 'B773' } });

    const res = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'CX582' }));
    expect(res.status).toBe(200);

    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ? ORDER BY rowid DESC LIMIT 1', args: ['B-MATCHED1'] });
    const tl = JSON.parse(row.rows[0].data as string);

    expect(tl.flights.length).toBe(11); // 1 original + 10 chained sectors, unconditionally
    expect(String(tl.flights[0].route).endsWith('➔ NRT')).toBe(true);
    expect(tl.tl_prepared).toBe(false);
    expect(tl.tl_accept).toBe(false);
    expect(tl.tl_flight_started).toBe(false);
    expect(tl.tl_flight_status).toBe('SCHEDULED');
  });

  it('does not throw / still returns 200 even if the aircraft reg is missing from the SimBrief payload (falls back to B-HNQ)', async () => {
    mockSimbriefFetch({ aircraft: {} });
    const res = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'CX777' }));
    expect(res.status).toBe(200);

    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ?', args: ['B-HNQ'] });
    expect(row.rows[0]).toBeDefined();
  });
});

// 🌟 regression: 舊 schema 用 flight_no 做 PRIMARY KEY，REPLACE INTO 令教官起
// 第二個同 flight number 嘅 session 會直接刪走第一個。而家改用 UUID 做 id，
// 兩個 session 應該各自獨立存在，唔會互相 overwrite
describe('/api/simbrief POST — duplicate flight number does not overwrite', () => {
  it('creates two independent sessions when the same flight number is used twice', async () => {
    mockSimbriefFetch({ aircraft: { reg: 'B-DUPTEST' } });
    const res1 = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'DUP1' }));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();

    mockSimbriefFetch({ aircraft: { reg: 'B-DUPTEST' } });
    const res2 = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'DUP1' }));
    expect(res2.status).toBe(200);
    const body2 = await res2.json();

    // 兩次都拎到唔同嘅 id，唔係同一個 row 俾人覆寫咗
    expect(body1.id).toBeDefined();
    expect(body2.id).toBeDefined();
    expect(body1.id).not.toBe(body2.id);

    const rows = await db.execute({ sql: 'SELECT id FROM flights WHERE flight_no = ?', args: ['DUP1'] });
    expect(rows.rows.length).toBe(2);
  });
});

// 🌟 regression: 舊 schema techlogs key by reg，兩個獨立 session 一齊用同一個機牌
// 起機，第二個嘅 continuity sync 會直接 REPLACE 咗第一個嘅 techlog（defects/accept
// 狀態全部俾人蓋走）。而家 techlogs key by flight_id，兩個 session 應該有各自獨立
// 嘅 techlog row，唔會互相影響
describe('/api/simbrief POST — two sessions sharing an aircraft reg no longer collide', () => {
  it('creates two independent techlog rows when two sessions use the same reg', async () => {
    mockSimbriefFetch({ aircraft: { reg: 'B-SHARED1' } });
    const res1 = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'CX100' }));
    const body1 = await res1.json();

    // Session A的 trainee 標記咗架機已 accept（模擬佢做緊嘢）
    const rowA = await db.execute({ sql: 'SELECT data FROM techlogs WHERE flight_id = ?', args: [body1.id] });
    const tlA = JSON.parse(rowA.rows[0].data as string);
    await db.execute({
      sql: 'UPDATE techlogs SET data = ? WHERE flight_id = ?',
      args: [JSON.stringify({ ...tlA, tl_accept: true }), body1.id],
    });

    // 教官起多一個用同一個機牌嘅獨立 session
    mockSimbriefFetch({ aircraft: { reg: 'B-SHARED1' } });
    const res2 = await POST(authedPostRequest({ username: 'EFFSIM', flightNo: 'CX200' }));
    const body2 = await res2.json();

    expect(body1.id).not.toBe(body2.id);

    // Session A 嘅 tl_accept=true 冇俾 Session B 嘅起機 continuity sync 蓋走
    const rowAAfter = await db.execute({ sql: 'SELECT data FROM techlogs WHERE flight_id = ?', args: [body1.id] });
    expect(JSON.parse(rowAAfter.rows[0].data as string).tl_accept).toBe(true);

    // Session B 有自己獨立、未 accept 嘅 row
    const rowB = await db.execute({ sql: 'SELECT data FROM techlogs WHERE flight_id = ?', args: [body2.id] });
    expect(JSON.parse(rowB.rows[0].data as string).tl_accept).toBe(false);
  });
});
