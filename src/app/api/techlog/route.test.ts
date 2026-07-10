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

function getRequest(reg: string) {
  return new Request(`http://localhost/api/techlog?reg=${encodeURIComponent(reg)}`);
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
  it('GET returns a sensible default tech log for an unknown registration', async () => {
    const res = await GET(getRequest('B-NEW1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tl_prepared).toBe(false);
    expect(Array.isArray(body.tl_entries)).toBe(true);
  });

  it('GET returns 400 when reg is missing', async () => {
    const res = await GET(new Request('http://localhost/api/techlog'));
    expect(res.status).toBe(400);
  });

  it('POST merges a partial patch against the latest row instead of overwriting it', async () => {
    await POST(postRequest({ reg: 'B-MERGE', data: { tl_prepared: true, tl_cmdr: 'CHAN T M' } }));
    const afterFirst = await (await GET(getRequest('B-MERGE'))).json();
    expect(afterFirst.tl_prepared).toBe(true);
    expect(afterFirst.tl_cmdr).toBe('CHAN T M');

    // second write only touches one field — the first write's field must survive
    await POST(postRequest({ reg: 'B-MERGE', data: { tl_cmdr: 'WONG K K' } }));
    const afterSecond = await (await GET(getRequest('B-MERGE'))).json();
    expect(afterSecond.tl_prepared).toBe(true);
    expect(afterSecond.tl_cmdr).toBe('WONG K K');
  });

  it('POST returns 400 for a missing reg or non-object data', async () => {
    const res1 = await POST(postRequest({ reg: '', data: {} }));
    expect(res1.status).toBe(400);

    const res2 = await POST(postRequest({ reg: 'B-BAD', data: 'nope' }));
    expect(res2.status).toBe(400);
  });

  it('POST rejects defects/tl_entries/flights smuggled through data (400, no write happens)', async () => {
    const res = await POST(postRequest({ reg: 'B-BYPASS', data: { defects: [{ id: 'X' }] } }));
    expect(res.status).toBe(400);

    const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ?', args: ['B-BYPASS'] });
    expect(row.rows[0]).toBeUndefined();
  });

  describe('instructor-only directives require a session cookie', () => {
    it('401s an unauthenticated release/checks/fluids/CRS write, and the DB is left untouched', async () => {
      const res = await POST(postRequest({ reg: 'B-RBAC1', data: { tl_release: true } }));
      expect(res.status).toBe(401);

      const row = await db.execute({ sql: 'SELECT data FROM techlogs WHERE reg = ?', args: ['B-RBAC1'] });
      expect(row.rows[0]).toBeUndefined();
    });

    it('401s an unauthenticated signOffDefects directive', async () => {
      const res = await POST(postRequest({ reg: 'B-RBAC2', signOffDefects: true }));
      expect(res.status).toBe(401);
    });

    it('401s an unauthenticated defectUpdate that clears or defers a defect', async () => {
      const res = await POST(postRequest({
        reg: 'B-RBAC3',
        defectUpdate: { id: 'A1', changes: { status: 'CLEARED' } },
      }));
      expect(res.status).toBe(401);
    });

    it('200s the same writes with a valid instructor session cookie', async () => {
      const { token } = createSessionToken();
      const cookie = `${SESSION_COOKIE_NAME}=${token}`;

      const res1 = await POST(postRequest({ reg: 'B-RBAC4', data: { tl_release: true } }, cookie));
      expect(res1.status).toBe(200);

      const res2 = await POST(postRequest({ reg: 'B-RBAC4', signOffDefects: true }, cookie));
      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      expect(body2.data.tl_defects).toBe(true);
    });

    it('does not gate the flight-crew finalizeSector-style reset (writes tl_defects/tl_release/crs_id without instructor auth)', async () => {
      const res = await POST(postRequest({
        reg: 'B-CREW1',
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
      await POST(postRequest({ reg: 'B-RACE1', defectAppend: { id: 'A1', status: 'OPEN' } }));
      await POST(postRequest({ reg: 'B-RACE1', defectAppend: { id: 'A2', status: 'OPEN' } }));

      const { token } = createSessionToken();
      const cookie = `${SESSION_COOKIE_NAME}=${token}`;

      // neither request carries the other's change — each only knows the id/changes it cares about
      await POST(postRequest({ reg: 'B-RACE1', defectUpdate: { id: 'A1', changes: { status: 'CLEARED' } } }, cookie));
      await POST(postRequest({ reg: 'B-RACE1', defectUpdate: { id: 'A2', changes: { status: 'CLEARED' } } }, cookie));

      const final = await (await GET(getRequest('B-RACE1'))).json();
      const byId = Object.fromEntries(final.defects.map((d: { id: string; status: string }) => [d.id, d.status]));
      expect(byId).toEqual({ A1: 'CLEARED', A2: 'CLEARED' });
    });

    it('tlEntryAppend from independent actors never drops an entry', async () => {
      await POST(postRequest({ reg: 'B-RACE2', data: { tl_prepared: true } }));

      await POST(postRequest({ reg: 'B-RACE2', tlEntryAppend: { id: 'ENT-1' } }));
      await POST(postRequest({ reg: 'B-RACE2', tlEntryAppend: { id: 'ENT-2' } }));
      await POST(postRequest({ reg: 'B-RACE2', tlEntryAppend: { id: 'ENT-3' } }));

      const final = await (await GET(getRequest('B-RACE2'))).json();
      const ids = final.tl_entries.map((e: { id: string }) => e.id).sort();
      expect(ids).toEqual(['ENT-1', 'ENT-2', 'ENT-3']);
    });
  });
});
