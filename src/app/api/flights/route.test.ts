import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

let GET: typeof import('./route').GET;
let db: typeof import('@/lib/db').default;
let ensureSchema: typeof import('@/lib/db').ensureSchema;
let SESSION_COOKIE_NAME: string;
let createSessionToken: typeof import('@/lib/auth').createSessionToken;

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'eff-test-'));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  process.env.INSTRUCTOR_PASSWORD = 'test-password';

  ({ default: db, ensureSchema } = await import('@/lib/db'));
  ({ GET } = await import('./route'));
  ({ SESSION_COOKIE_NAME, createSessionToken } = await import('@/lib/auth'));
});

async function seedFlight(id: string, data: object) {
  await ensureSchema();
  await db.execute({
    sql: 'REPLACE INTO flights (id, flight_no, data) VALUES (?, ?, ?)',
    args: [id, id, JSON.stringify(data)],
  });
}

function makeRequest(cookie?: string) {
  return new Request('http://localhost/api/flights', {
    headers: cookie ? { cookie } : {},
  });
}

describe('GET /api/flights', () => {
  it('filters out unpublished drafts for an unauthenticated caller, even without a ?role= query param', async () => {
    // regression: the old code only filtered when the client explicitly sent ?role=Trainee,
    // but neither real caller (flight-select page, instructor hub) ever sent that param,
    // so the filter never actually engaged for anyone
    await seedFlight('LISTPUB1', { flight_no: 'LISTPUB1', is_published: true });
    await seedFlight('LISTDRAFT1', { flight_no: 'LISTDRAFT1', is_published: false });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const flights = await res.json();
    const ids = flights.map((f: { flight_no: string }) => f.flight_no);
    expect(ids).toContain('LISTPUB1');
    expect(ids).not.toContain('LISTDRAFT1');
  });

  it('shows an authenticated instructor both published and draft flights', async () => {
    await seedFlight('LISTPUB2', { flight_no: 'LISTPUB2', is_published: true });
    await seedFlight('LISTDRAFT2', { flight_no: 'LISTDRAFT2', is_published: false });

    const { token } = createSessionToken();
    const res = await GET(makeRequest(`${SESSION_COOKIE_NAME}=${token}`));
    expect(res.status).toBe(200);
    const flights = await res.json();
    const ids = flights.map((f: { flight_no: string }) => f.flight_no);
    expect(ids).toContain('LISTPUB2');
    expect(ids).toContain('LISTDRAFT2');
  });

  // 🌟 regression: ofp_history 而家係獨立欄（睇 db.ts 嘅 comment）——flight-select
  // 個 Compare 面板靠呢個 list route 攞歷史版本，所以呢度一定要砌返落去。反之
  // raw_simbrief 冇任何一個讀呢個 list 嘅組件用得著，特登唔攞（keep the list payload lean）
  it('reattaches ofp_history from its own column, but leaves raw_simbrief out of the list payload', async () => {
    await ensureSchema();
    await db.execute({
      sql: 'REPLACE INTO flights (id, flight_no, data, raw_simbrief, ofp_history) VALUES (?, ?, ?, ?, ?)',
      args: [
        'LISTHIST1',
        'LISTHIST1',
        JSON.stringify({ flight_no: 'LISTHIST1', is_published: true }),
        JSON.stringify({ general: { icao_airline: 'CX' } }),
        JSON.stringify([{ version: 1, dispatched_at: '2026-01-01T00:00:00Z', snapshot: {} }]),
      ],
    });

    const res = await GET(makeRequest());
    const flights = await res.json();
    const flight = flights.find((f: { flight_no: string }) => f.flight_no === 'LISTHIST1');
    expect(flight.ofp_history).toHaveLength(1);
    expect(flight.raw_simbrief).toBeUndefined();
  });
});
