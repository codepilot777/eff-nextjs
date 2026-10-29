import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

let GET: typeof import('./route').GET;
let PUT: typeof import('./route').PUT;
let SESSION_COOKIE_NAME: string;
let createSessionToken: typeof import('@/lib/auth').createSessionToken;

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'eff-test-'));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
  process.env.INSTRUCTOR_PASSWORD = 'test-password';

  ({ GET, PUT } = await import('./route'));
  ({ SESSION_COOKIE_NAME, createSessionToken } = await import('@/lib/auth'));
});

function ctx(icao: string) {
  return { params: Promise.resolve({ icao }) };
}

function putRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/procedures/VHHH', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

const samplePayload = {
  airport: 'VHHH',
  fixes: [{ name: 'ABBEY', latDeg: 22.269722, lonDeg: 114.923867 }],
  stars: [{ name: 'ABBEY4A', legs: [{ fix: 'ABBEY' }] }],
  sids: [],
  holds: [],
};

describe('GET /api/procedures/[icao]', () => {
  it('auto-seeds the bundled VHHH procedure set on first access', async () => {
    const res = await GET(new Request('http://localhost/api/procedures/VHHH'), ctx('VHHH'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.airport).toBe('VHHH');
    expect(body.data.fixes.length).toBeGreaterThan(0);
  });

  it('returns null data for an airport with no procedures on file', async () => {
    const res = await GET(new Request('http://localhost/api/procedures/ZZZZ'), ctx('ZZZZ'));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toBeNull();
  });
});

describe('PUT /api/procedures/[icao]', () => {
  it('rejects writes without instructor auth', async () => {
    const res = await PUT(putRequest(samplePayload), ctx('RJBB'));
    expect(res.status).toBe(401);
  });

  it('rejects a payload that is not shaped like a procedure set', async () => {
    const { token } = createSessionToken();
    const res = await PUT(putRequest({ foo: 'bar' }, `${SESSION_COOKIE_NAME}=${token}`), ctx('RJBB'));
    expect(res.status).toBe(400);
  });

  it('upserts procedures for an instructor-authed request and GET reflects it', async () => {
    const { token } = createSessionToken();
    const putRes = await PUT(putRequest(samplePayload, `${SESSION_COOKIE_NAME}=${token}`), ctx('RJBB'));
    expect(putRes.status).toBe(200);

    const getRes = await GET(new Request('http://localhost/api/procedures/RJBB'), ctx('RJBB'));
    const body = await getRes.json();
    expect(body.data.fixes).toEqual(samplePayload.fixes);
  });
});
