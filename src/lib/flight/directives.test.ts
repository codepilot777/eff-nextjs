import { describe, expect, it } from 'vitest';
import { applyFlightDirectives } from './directives';

describe('applyFlightDirectives', () => {
  it('merges flat data fields like the old spread behavior', () => {
    const current = { fuel_manual_mode: false, trainee_input_zfw: 0 };
    const merged = applyFlightDirectives(current, { data: { fuel_manual_mode: true } });
    expect(merged).toEqual({ fuel_manual_mode: true, trainee_input_zfw: 0 });
  });

  it('pdcRequestAppend adds a new pending request without dropping existing ones', () => {
    const current = { pdc_requests: [{ time: '0100Z', status: 'APPROVED', atis: 'A' }] };
    const merged = applyFlightDirectives(current, { pdcRequestAppend: { atis: 'b', facility: 'vhhh', gate: '12' } });
    expect(merged.pdc_requests).toEqual([
      { time: '0100Z', status: 'APPROVED', atis: 'A' },
      { time: expect.any(String), status: 'PENDING CLEARANCE', atis: 'B', facility: 'VHHH', gate: '12' },
    ]);
  });

  it('pdcApprove patches only the matching request by time, leaving others untouched', () => {
    const current = {
      pdc_requests: [
        { time: '0100Z', status: 'PENDING CLEARANCE', atis: 'A' },
        { time: '0200Z', status: 'PENDING CLEARANCE', atis: 'B' },
      ],
    };
    const merged = applyFlightDirectives(current, {
      pdcApprove: { time: '0100Z', clearance_payload: 'CLRD TO RJBB VIA DCT' },
    });
    expect(merged.pdc_requests).toEqual([
      { time: '0100Z', status: 'APPROVED', atis: 'A', clearance_payload: 'CLRD TO RJBB VIA DCT' },
      { time: '0200Z', status: 'PENDING CLEARANCE', atis: 'B' },
    ]);
  });

  it('pdcApprove against a fresh server read does not resurrect an already-approved earlier request', () => {
    // regression: the old client-built-array approach could overwrite concurrent instructor edits;
    // applying against `current` (the server's own fresh read) must not touch unrelated entries
    const current = {
      pdc_requests: [
        { time: '0100Z', status: 'APPROVED', atis: 'A', clearance_payload: 'OLD CLEARANCE' },
        { time: '0200Z', status: 'PENDING CLEARANCE', atis: 'B' },
      ],
    };
    const merged = applyFlightDirectives(current, {
      pdcApprove: { time: '0200Z', clearance_payload: 'NEW CLEARANCE' },
    });
    expect(merged.pdc_requests).toEqual([
      { time: '0100Z', status: 'APPROVED', atis: 'A', clearance_payload: 'OLD CLEARANCE' },
      { time: '0200Z', status: 'APPROVED', atis: 'B', clearance_payload: 'NEW CLEARANCE' },
    ]);
  });

  it('atisRequestAppend adds a new pending request with an incrementing id', () => {
    const current = { atis_requests: [{ id: 1, icao: 'VHHH', type: 'DEPARTURE', status: 'DELIVERED' }] };
    const merged = applyFlightDirectives(current, { atisRequestAppend: { icao: 'rjbb', type: 'ARRIVAL' } });
    expect(merged.atis_requests).toEqual([
      { id: 1, icao: 'VHHH', type: 'DEPARTURE', status: 'DELIVERED' },
      { id: 2, icao: 'RJBB', type: 'ARRIVAL', time: expect.any(String), status: 'PENDING RESPONSE' },
    ]);
  });

  it('atisDeliver patches only the matching request by time', () => {
    const current = {
      atis_requests: [{ time: '0100Z', icao: 'VHHH', type: 'DEPARTURE', status: 'PENDING RESPONSE' }],
    };
    const merged = applyFlightDirectives(current, {
      atisDeliver: { time: '0100Z', response: 'VHHH DEPARTURE ATIS INFO A' },
    });
    expect(merged.atis_requests).toEqual([
      { time: '0100Z', icao: 'VHHH', type: 'DEPARTURE', status: 'DELIVERED', response: 'VHHH DEPARTURE ATIS INFO A' },
    ]);
  });

  it('acarsCockpitAppend appends a COCKPIT message with a server-computed time', () => {
    const current = { acars_messages: [{ time: '0100Z', sender: 'DISPATCH', content: 'hello' }] };
    const merged = applyFlightDirectives(current, { acarsCockpitAppend: { content: 'wilco' } });
    expect(merged.acars_messages).toEqual([
      { time: '0100Z', sender: 'DISPATCH', content: 'hello' },
      { time: expect.stringMatching(/^\d{4}Z$/), sender: 'COCKPIT', content: 'wilco' },
    ]);
  });

  it('acarsDispatchAppend appends a DISPATCH message with a real computed time, not the literal string "NOW"', () => {
    const current = { acars_messages: [] };
    const merged = applyFlightDirectives(current, { acarsDispatchAppend: { content: 'roger' } });
    expect(merged.acars_messages).toEqual([
      { time: expect.stringMatching(/^\d{4}Z$/), sender: 'DISPATCH', content: 'roger' },
    ]);
    expect((merged.acars_messages as Array<{ time: string }>)[0].time).not.toBe('NOW');
  });
});
