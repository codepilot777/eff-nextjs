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
    sql: 'REPLACE INTO flights (flight_no, data) VALUES (?, ?)',
    args: [id, JSON.stringify(data)],
  });
}

function makeRequest(id: string, cookie?: string) {
  return new Request(`http://localhost/api/flight?id=${encodeURIComponent(id)}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe('GET /api/flight', () => {
  it('returns a published flight to an unauthenticated caller', async () => {
    await seedFlight('PUB1', { flight_no: 'PUB1', is_published: true });
    const res = await GET(makeRequest('PUB1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.flight_no).toBe('PUB1');
  });

  it('hides an unpublished draft flight from an unauthenticated caller (404, not revealing it exists)', async () => {
    await seedFlight('DRAFT1', { flight_no: 'DRAFT1', is_published: false });
    const res = await GET(makeRequest('DRAFT1'));
    expect(res.status).toBe(404);
  });

  it('lets an authenticated instructor read an unpublished draft flight', async () => {
    await seedFlight('DRAFT2', { flight_no: 'DRAFT2', is_published: false });
    const { token } = createSessionToken();
    const res = await GET(makeRequest('DRAFT2', `${SESSION_COOKIE_NAME}=${token}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.flight_no).toBe('DRAFT2');
  });

  it('returns 404 for an unknown flight id', async () => {
    const res = await GET(makeRequest('DOES-NOT-EXIST'));
    expect(res.status).toBe(404);
  });
});
