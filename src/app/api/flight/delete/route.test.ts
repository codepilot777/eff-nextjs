import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

let POST: typeof import('./route').POST;
let db: typeof import('@/lib/db').default;
let ensureSchema: typeof import('@/lib/db').ensureSchema;
let SESSION_COOKIE_NAME: string;
let createSessionToken: typeof import('@/lib/auth').createSessionToken;

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'eff-test-'));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  process.env.INSTRUCTOR_PASSWORD = 'test-password';

  ({ default: db, ensureSchema } = await import('@/lib/db'));
  ({ POST } = await import('./route'));
  ({ SESSION_COOKIE_NAME, createSessionToken } = await import('@/lib/auth'));
});

async function seedFlight(id: string) {
  await ensureSchema();
  await db.execute({
    sql: 'REPLACE INTO flights (id, flight_no, data) VALUES (?, ?, ?)',
    args: [id, id, JSON.stringify({ flight_no: id })],
  });
}

function makeRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/flight/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/flight/delete', () => {
  it('rejects unauthenticated requests, leaving the flight intact', async () => {
    await seedFlight('DEL1');
    const res = await POST(makeRequest({ id: 'DEL1' }));
    expect(res.status).toBe(401);

    const row = await db.execute({ sql: 'SELECT id FROM flights WHERE id = ?', args: ['DEL1'] });
    expect(row.rows.length).toBe(1);
  });

  it('deletes the flight for an authenticated instructor', async () => {
    await seedFlight('DEL2');
    const { token } = createSessionToken();
    const res = await POST(makeRequest({ id: 'DEL2' }, `${SESSION_COOKIE_NAME}=${token}`));
    expect(res.status).toBe(200);

    const row = await db.execute({ sql: 'SELECT id FROM flights WHERE id = ?', args: ['DEL2'] });
    expect(row.rows.length).toBe(0);
  });

  it('returns 404 for an unknown flight even when authenticated', async () => {
    const { token } = createSessionToken();
    const res = await POST(makeRequest({ id: 'NEVER-EXISTED' }, `${SESSION_COOKIE_NAME}=${token}`));
    expect(res.status).toBe(404);
  });
});
