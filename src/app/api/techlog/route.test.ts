import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

let GET: typeof import('./route').GET;
let POST: typeof import('./route').POST;
let db: typeof import('@/lib/db').default;
let SESSION_COOKIE_NAME: string;
let createSessionToken: typeof import('@/lib/auth').createSessionToken;

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'eff-test-'));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  process.env.INSTRUCTOR_PASSWORD = 'test-password';

  ({ default: db } = await import('@/lib/db'));
  ({ GET, POST } = await import('./route'));
  ({ SESSION_COOKIE_NAME, createSessionToken } = await import('@/lib/auth'));
});

function getRequest(id: string) {
  return new Request(`http://localhost/api/techlog?id=${encodeURIComponent(id)}`);
}

function postRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/techlog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('/api/techlog', () => {
  it('GET returns a sensible default tech log for an unknown flight id', async () => {
    const res = await GET(getRequest('FLIGHT-NEW1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tl_prepared).toBe(false);
    expect(Array.isArray(body.tl_entries)).toBe(true);
  });

  it('GET returns 400 when id is missing', async () => {
    const res = await GET(new Request('http://localhost/api/techlog'));
    expect(res.status).toBe(400);
  });

  it('POST merges a partial patch against the latest row instead of overwriting it', async () => {
    await POST(postRequest({ id: 'FLIGHT-MERGE', data: { tl_prepared: true, tl_cmdr: 'CHAN T M' } }));
    const afterFirst = await (await GET(getRequest('FLIGHT-MERGE'))).json();
    expect(afterFirst.tl_prepared).toBe(true);
    expect(afterFirst.tl_cmdr).toBe('CHAN T M');

    // second write only touches one field — the first write's field must survive
    await POST(postRequest({ id: 'FLIGHT-MERGE', data: { tl_cmdr: 'WONG K K' } }));
    const afterSecond = await (await GET(getRequest('FLIGHT-MERGE'))).json();
    expect(afterSecond.tl_prepared).toBe(true);
    expect(afterSecond.tl_cmdr).toBe('WONG K K');
  });

  it('POST returns 400 for a missing id or non-object data', async () => {
    const res1 = await POST(postRequest({ id: '', data: {} }));
    expect(res1.status).toBe(400);

    const res2 = await POST(postRequest({ id: 'FLIGHT-BAD', data: 'nope' }));
    expect(res2.status).toBe(400);
  });

  it('POST rejects defects/tl_entries/flights smuggled through data (400, no write happens)', async () => {
    const res = await POST(postRequest({ id: 'FLIGHT-BYPASS', data: { defects: [{ id: 'X' }] } }));
    expect(res.status).toBe(400);

    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE flight_id = ?', args: ['FLIGHT-BYPASS'] });
    expect(row.rows[0]).toBeUndefined();
  });

  // 🌟 regression: 舊 schema techlogs key by reg，同一機牌嘅唔同 session 會共用/
  // 互相蓋走 techlog row。而家 key by flight_id，兩個唔同 flight id 就算 reg 一樣
  // 都有各自獨立嘅 row
  it('two different flight ids never share a techlog row even with the same underlying aircraft reg', async () => {
    await POST(postRequest({ id: 'FLIGHT-ISO-A', data: { tl_cmdr: 'PILOT A' } }));
    await POST(postRequest({ id: 'FLIGHT-ISO-B', data: { tl_cmdr: 'PILOT B' } }));

    const a = await (await GET(getRequest('FLIGHT-ISO-A'))).json();
    const b = await (await GET(getRequest('FLIGHT-ISO-B'))).json();
    expect(a.tl_cmdr).toBe('PILOT A');
    expect(b.tl_cmdr).toBe('PILOT B');
  });

  describe('instructor-only directives require a session cookie', () => {
    it('401s an unauthenticated release/checks/fluids/CRS write, and the DB is left untouched', async () => {
      const res = await POST(postRequest({ id: 'FLIGHT-RBAC1', data: { tl_release: true } }));
      expect(res.status).toBe(401);

      const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE flight_id = ?', args: ['FLIGHT-RBAC1'] });
      expect(row.rows[0]).toBeUndefined();
    });

    it('401s an unauthenticated signOffDefects directive', async () => {
      const res = await POST(postRequest({ id: 'FLIGHT-RBAC2', signOffDefects: true }));
      expect(res.status).toBe(401);
    });

    it('401s an unauthenticated defectUpdate that clears or defers a defect', async () => {
      const res = await POST(postRequest({
        id: 'FLIGHT-RBAC3',
        defectUpdate: { id: 'A1', changes: { status: 'CLEARED' } },
      }));
      expect(res.status).toBe(401);
    });

    it('200s the same writes with a valid instructor session cookie', async () => {
      const { token } = createSessionToken();
      const cookie = `${SESSION_COOKIE_NAME}=${token}`;

      const res1 = await POST(postRequest({ id: 'FLIGHT-RBAC4', data: { tl_release: true } }, cookie));
      expect(res1.status).toBe(200);

      const res2 = await POST(postRequest({ id: 'FLIGHT-RBAC4', signOffDefects: true }, cookie));
      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      expect(body2.data.tl_defects).toBe(true);
    });

    it('does not gate the flight-crew finalizeSector-style reset (writes tl_defects/tl_release/crs_id without instructor auth)', async () => {
      const res = await POST(postRequest({
        id: 'FLIGHT-CREW1',
        flightsPrepend: { id: 'SEC-1' },
        tlEntriesReset: true,
        data: { tl_defects: true, tl_release: false, tl_checks: false, tl_fluids: false, crs_id: '' },
      }));
      expect(res.status).toBe(200);
    });
  });

  describe('array writes from independent actors never clobber each other (the race this directive contract fixes)', () => {
    // 🌟 The real-world race isn't microsecond-level thread contention — it's two
    // browser sessions each holding a full array snapshot from their last ~3s poll,
    // then PATCHing minutes apart. A whole-array-replacement client would clobber
    // here regardless of exact timing; the directive contract can't, because each
    // POST re-reads the current row inside its own transaction before merging.
    // (True parallel writes against the local file-based sqlite test driver hit
    // SQLITE_BUSY with no retry/busy-timeout configured, which is a test-driver
    // limitation, not something this contract is responsible for masking.)
    it('two independently-built defectUpdate patches for different defects both survive', async () => {
      await POST(postRequest({ id: 'FLIGHT-RACE1', defectAppend: { id: 'A1', status: 'OPEN' } }));
      await POST(postRequest({ id: 'FLIGHT-RACE1', defectAppend: { id: 'A2', status: 'OPEN' } }));

      const { token } = createSessionToken();
      const cookie = `${SESSION_COOKIE_NAME}=${token}`;

      // neither request carries the other's change — each only knows the id/changes it cares about
      await POST(postRequest({ id: 'FLIGHT-RACE1', defectUpdate: { id: 'A1', changes: { status: 'CLEARED' } } }, cookie));
      await POST(postRequest({ id: 'FLIGHT-RACE1', defectUpdate: { id: 'A2', changes: { status: 'CLEARED' } } }, cookie));

      const final = await (await GET(getRequest('FLIGHT-RACE1'))).json();
      const byId = Object.fromEntries(final.defects.map((d: { id: string; status: string }) => [d.id, d.status]));
      expect(byId).toEqual({ A1: 'CLEARED', A2: 'CLEARED' });
    });

    it('tlEntryAppend from independent actors never drops an entry', async () => {
      await POST(postRequest({ id: 'FLIGHT-RACE2', data: { tl_prepared: true } }));

      await POST(postRequest({ id: 'FLIGHT-RACE2', tlEntryAppend: { id: 'ENT-1' } }));
      await POST(postRequest({ id: 'FLIGHT-RACE2', tlEntryAppend: { id: 'ENT-2' } }));
      await POST(postRequest({ id: 'FLIGHT-RACE2', tlEntryAppend: { id: 'ENT-3' } }));

      const final = await (await GET(getRequest('FLIGHT-RACE2'))).json();
      const ids = final.tl_entries.map((e: { id: string }) => e.id).sort();
      expect(ids).toEqual(['ENT-1', 'ENT-2', 'ENT-3']);
    });
  });
});
