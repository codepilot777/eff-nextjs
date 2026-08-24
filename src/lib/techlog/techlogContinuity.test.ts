import { describe, expect, it } from 'vitest';
import { DEFAULT_TECHLOG, syncTechlogForNewFlight } from './techlogContinuity';

describe('syncTechlogForNewFlight', () => {
  it('always syncs tl_prep_flt/dep/arr to the new flight, regardless of continuity', () => {
    const result = syncTechlogForNewFlight(null, { flightNo: 'CX888', depIata: 'HKG', arrIata: 'SIN' });
    expect(result.tl_prep_flt).toBe('CX888');
    expect(result.tl_prep_dep).toBe('HKG');
    expect(result.tl_prep_arr).toBe('SIN');
  });

  it('no bridging sector is inserted when the new departure matches the known current location', () => {
    // DEFAULT_TECHLOG.tl_prev_arr === 'HKG', 起機由 HKG 出發，本身已經夾得返
    const before = (DEFAULT_TECHLOG.flights as unknown[]).length;
    const result = syncTechlogForNewFlight(null, { flightNo: 'CX500', depIata: 'HKG', arrIata: 'NRT' });
    expect((result.flights as unknown[]).length).toBe(before);
    expect(result.tl_prev_arr).toBe('HKG');
  });

  it('auto-inserts a bridging positioning sector when the new departure does not match the known current location', () => {
    // 模擬「外地飛返香港」：existing techlog 話架機仲留喺 HKG，但新 flight plan 由 NRT 出發
    const existing = { ...DEFAULT_TECHLOG, tl_prev_arr: 'HKG' };
    const before = (existing.flights as unknown[]).length;
    const result = syncTechlogForNewFlight(existing, { flightNo: 'CX501', depIata: 'NRT', arrIata: 'HKG' });

    const flights = result.flights as Array<Record<string, unknown>>;
    expect(flights.length).toBe(before + 1);
    expect(flights[0].route).toBe('HKG ➔ NRT');
    expect(result.tl_prev_arr).toBe('NRT');
    expect(result.tl_prev_dep).toBe('HKG');
    expect(result.tl_prep_dep).toBe('NRT');
  });

  it('the bridging sector is internally consistent (route matches from/to, times in order)', () => {
    const existing = { ...DEFAULT_TECHLOG, tl_prev_arr: 'BKK' };
    const result = syncTechlogForNewFlight(existing, { flightNo: 'CX123', depIata: 'KIX', arrIata: 'HKG' });
    const bridge = (result.flights as Array<Record<string, unknown>>)[0];

    expect(bridge.route).toBe('BKK ➔ KIX');
    const toMin = (s: string) => parseInt(String(s).slice(0, 2), 10) * 60 + parseInt(String(s).slice(2, 4), 10);
    expect(toMin(bridge.takeOff as string)).toBeGreaterThan(toMin(bridge.blocksOff as string));
    expect(toMin(bridge.blocksOn as string)).toBeGreaterThan(toMin(bridge.landing as string));
    expect(bridge.def).toEqual([]);
  });

  it('repeated syncs for an already-continuous location never keep inserting bridging sectors', () => {
    let techlog: Record<string, unknown> | null = null;
    for (let i = 0; i < 5; i++) {
      techlog = syncTechlogForNewFlight(techlog, { flightNo: `CX${i}`, depIata: 'HKG', arrIata: 'NRT' });
      techlog = { ...techlog, tl_prev_arr: 'HKG' }; // 模擬呢程完咗返返 HKG
    }
    const finalFlights = (techlog!.flights as unknown[]).length;
    expect(finalFlights).toBe((DEFAULT_TECHLOG.flights as unknown[]).length);
  });

  it('defaults a missing depIata/arrIata to HKG/N-A instead of throwing', () => {
    expect(() => syncTechlogForNewFlight(null, { flightNo: 'CX1', depIata: '', arrIata: '' })).not.toThrow();
    const result = syncTechlogForNewFlight(null, { flightNo: 'CX1', depIata: '', arrIata: '' });
    expect(result.tl_prep_dep).toBe('HKG');
  });
});
