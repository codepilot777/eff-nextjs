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

async function seedFlight(id: string, data: object) {
  await ensureSchema();
  await db.execute({
    sql: 'REPLACE INTO flights (flight_no, data) VALUES (?, ?)',
    args: [id, JSON.stringify(data)],
  });
}

function makeRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/flight/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/flight/update', () => {
  it('merges a partial patch against the latest row instead of overwriting it', async () => {
    await seedFlight('TEST1', { flight_no: 'TEST1', a: 1, b: 2 });
    const res = await POST(makeRequest({ id: 'TEST1', data: { a: 99 } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({ flight_no: 'TEST1', a: 99, b: 2 });
  });

  it('returns 404 for an unknown flight id', async () => {
    const res = await POST(makeRequest({ id: 'DOES-NOT-EXIST', data: { a: 1 } }));
    expect(res.status).toBe(404);
  });

  it('returns 400 on an invalid body', async () => {
    const res = await POST(makeRequest({ id: '', data: {} }));
    expect(res.status).toBe(400);

    const res2 = await POST(makeRequest({ id: 'TEST1', data: 'not-an-object' }));
    expect(res2.status).toBe(400);
  });

  it('rejects unauthenticated writes to instructor-only fields (is_published/activated_version)', async () => {
    await seedFlight('TEST2', { flight_no: 'TEST2', is_published: false });
    const res = await POST(makeRequest({ id: 'TEST2', data: { is_published: true } }));
    expect(res.status).toBe(401);

    // the field must remain unchanged
    const row = await db.execute({ sql: 'SELECT data FROM flights WHERE flight_no = ?', args: ['TEST2'] });
    expect(JSON.parse(row.rows[0].data as string).is_published).toBe(false);
  });

  it('allows instructor-only field writes with a valid session cookie', async () => {
    await seedFlight('TEST3', { flight_no: 'TEST3', is_published: false });
    const { token } = createSessionToken();
    const res = await POST(makeRequest({ id: 'TEST3', data: { is_published: true } }, `${SESSION_COOKIE_NAME}=${token}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.is_published).toBe(true);
  });

  it('still allows unauthenticated writes to ordinary trainee fields', async () => {
    await seedFlight('TEST4', { flight_no: 'TEST4', trainee_input_zfw: 0 });
    const res = await POST(makeRequest({ id: 'TEST4', data: { trainee_input_zfw: 182 } }));
    expect(res.status).toBe(200);
  });

  it('rejects pdc_requests/atis_requests/acars_messages smuggled inside data (the array-replacement bypass)', async () => {
    await seedFlight('TEST-SMUGGLE', { flight_no: 'TEST-SMUGGLE', pdc_requests: [] });
    const res = await POST(makeRequest({ id: 'TEST-SMUGGLE', data: { pdc_requests: [{ status: 'APPROVED' }] } }));
    expect(res.status).toBe(400);
  });

  it('lets an unauthenticated trainee append a PDC/ATIS request and an ACARS cockpit message', async () => {
    await seedFlight('TEST-COMMS1', { flight_no: 'TEST-COMMS1', pdc_requests: [], atis_requests: [], acars_messages: [] });

    const pdcRes = await POST(makeRequest({ id: 'TEST-COMMS1', pdcRequestAppend: { atis: 'A', facility: 'VHHH', gate: '12' } }));
    expect(pdcRes.status).toBe(200);
    expect((await pdcRes.json()).data.pdc_requests).toHaveLength(1);

    const atisRes = await POST(makeRequest({ id: 'TEST-COMMS1', atisRequestAppend: { icao: 'VHHH', type: 'DEPARTURE' } }));
    expect(atisRes.status).toBe(200);
    expect((await atisRes.json()).data.atis_requests).toHaveLength(1);

    const acarsRes = await POST(makeRequest({ id: 'TEST-COMMS1', acarsCockpitAppend: { content: 'requesting pushback' } }));
    expect(acarsRes.status).toBe(200);
    const acarsBody = await acarsRes.json();
    expect(acarsBody.data.acars_messages).toEqual([
      { time: expect.any(String), sender: 'COCKPIT', content: 'requesting pushback' },
    ]);
  });

  it('rejects an unauthenticated instructor-only pdcApprove/atisDeliver/acarsDispatchAppend directive', async () => {
    await seedFlight('TEST-COMMS2', {
      flight_no: 'TEST-COMMS2',
      pdc_requests: [{ time: '0100Z', status: 'PENDING CLEARANCE', atis: 'A' }],
      atis_requests: [{ time: '0100Z', icao: 'VHHH', type: 'DEPARTURE', status: 'PENDING RESPONSE' }],
      acars_messages: [],
    });

    const pdcRes = await POST(makeRequest({ id: 'TEST-COMMS2', pdcApprove: { time: '0100Z', clearance_payload: 'SELF CLEARED' } }));
    expect(pdcRes.status).toBe(401);

    const atisRes = await POST(makeRequest({ id: 'TEST-COMMS2', atisDeliver: { time: '0100Z', response: 'FAKE ATIS' } }));
    expect(atisRes.status).toBe(401);

    const acarsRes = await POST(makeRequest({ id: 'TEST-COMMS2', acarsDispatchAppend: { content: 'fake dispatch reply' } }));
    expect(acarsRes.status).toBe(401);

    // none of the protected data actually changed
    const row = await db.execute({ sql: 'SELECT data FROM flights WHERE flight_no = ?', args: ['TEST-COMMS2'] });
    const data = JSON.parse(row.rows[0].data as string);
    expect(data.pdc_requests[0].status).toBe('PENDING CLEARANCE');
    expect(data.atis_requests[0].status).toBe('PENDING RESPONSE');
    expect(data.acars_messages).toEqual([]);
  });

  it('allows an authenticated instructor to approve a PDC, deliver an ATIS, and send a DISPATCH ACARS message', async () => {
    await seedFlight('TEST-COMMS3', {
      flight_no: 'TEST-COMMS3',
      pdc_requests: [{ time: '0100Z', status: 'PENDING CLEARANCE', atis: 'A' }],
      atis_requests: [{ time: '0100Z', icao: 'VHHH', type: 'DEPARTURE', status: 'PENDING RESPONSE' }],
      acars_messages: [],
    });
    const { token } = createSessionToken();
    const cookie = `${SESSION_COOKIE_NAME}=${token}`;

    const pdcRes = await POST(makeRequest({ id: 'TEST-COMMS3', pdcApprove: { time: '0100Z', clearance_payload: 'CLRD TO RJBB VIA DCT' } }, cookie));
    expect(pdcRes.status).toBe(200);
    expect((await pdcRes.json()).data.pdc_requests[0]).toMatchObject({ status: 'APPROVED', clearance_payload: 'CLRD TO RJBB VIA DCT' });

    const atisRes = await POST(makeRequest({ id: 'TEST-COMMS3', atisDeliver: { time: '0100Z', response: 'VHHH DEP ATIS INFO A' } }, cookie));
    expect(atisRes.status).toBe(200);
    expect((await atisRes.json()).data.atis_requests[0]).toMatchObject({ status: 'DELIVERED', response: 'VHHH DEP ATIS INFO A' });

    const acarsRes = await POST(makeRequest({ id: 'TEST-COMMS3', acarsDispatchAppend: { content: 'roger, cleared to push' } }, cookie));
    expect(acarsRes.status).toBe(200);
    const acarsBody = await acarsRes.json();
    expect(acarsBody.data.acars_messages).toEqual([
      { time: expect.any(String), sender: 'DISPATCH', content: 'roger, cleared to push' },
    ]);
  });
});
