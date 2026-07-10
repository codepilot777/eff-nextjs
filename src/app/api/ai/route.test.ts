import { beforeAll, describe, expect, it } from 'vitest';

let POST: typeof import('./route').POST;
let SESSION_COOKIE_NAME: string;
let createSessionToken: typeof import('@/lib/auth').createSessionToken;

beforeAll(async () => {
  process.env.INSTRUCTOR_PASSWORD = 'test-password';
  ({ POST } = await import('./route'));
  ({ SESSION_COOKIE_NAME, createSessionToken } = await import('@/lib/auth'));
});

function makeRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/ai', () => {
  it('rejects an unauthenticated request before it ever reaches the Gemini API (real-money abuse vector)', async () => {
    const res = await POST(makeRequest({ promptType: 'WX', plainText: 'clear skies' }));
    expect(res.status).toBe(401);
  });

  it('rejects a request with a forged/invalid session cookie', async () => {
    const res = await POST(makeRequest({ promptType: 'WX', plainText: 'clear skies' }, `${SESSION_COOKIE_NAME}=garbage`));
    expect(res.status).toBe(401);
  });

  it('proceeds past the auth check for an authenticated instructor session (fails later on missing GEMINI_API_KEY in this test env, not on auth)', async () => {
    delete process.env.GEMINI_API_KEY;
    const { token } = createSessionToken();
    const res = await POST(makeRequest({ promptType: 'WX', plainText: 'clear skies' }, `${SESSION_COOKIE_NAME}=${token}`));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/GEMINI_API_KEY/);
  });

  it('still validates the request body (missing plainText) for an authenticated session', async () => {
    const { token } = createSessionToken();
    const res = await POST(makeRequest({ promptType: 'WX' }, `${SESSION_COOKIE_NAME}=${token}`));
    expect(res.status).toBe(400);
  });
});
