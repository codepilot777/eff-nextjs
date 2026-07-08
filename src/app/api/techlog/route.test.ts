import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

let GET: typeof import('./route').GET;
let POST: typeof import('./route').POST;
let db: typeof import('@/lib/db').default;

beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'eff-test-'));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, 'test.db')}`;

  ({ default: db } = await import('@/lib/db'));
  ({ GET, POST } = await import('./route'));
});

function getRequest(reg: string) {
  return new Request(`http://localhost/api/techlog?reg=${encodeURIComponent(reg)}`);
}

function postRequest(body: unknown) {
  return new Request('http://localhost/api/techlog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
});
