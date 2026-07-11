import { describe, expect, it } from 'vitest';
import { buildOfpSnapshot, getOfpHistory, diffOfpSnapshots } from './ofpHistory';

describe('buildOfpSnapshot', () => {
  it('picks only the known snapshot fields, dropping unrelated ones', () => {
    const snapshot = buildOfpSnapshot({ route_id: 'DCT', std_z: '0100Z', pax_f: 4, dow: 161968 });
    expect(snapshot).toEqual({
      route_id: 'DCT', std_z: '0100Z', sta_z: undefined, cruise_alt: undefined,
      fuel_trip_ofp: undefined, weight_zfw_ofp: undefined, weight_tow_ofp: undefined,
      ofp_telex_text: undefined, raw_simbrief: undefined, navlog: undefined, alternates: undefined,
    });
  });
});

describe('getOfpHistory', () => {
  it('returns the real history when present', () => {
    const history = [{ version: 1, dispatched_at: '', snapshot: { route_id: 'DCT' } }];
    expect(getOfpHistory({ ofp_history: history })).toBe(history);
  });

  it('synthesizes a single V1 entry from top-level fields for a legacy flight with no history', () => {
    const flight = { ofp_version: 1, route_id: 'DCT', std_z: '0100Z' };
    const history = getOfpHistory(flight);
    expect(history).toEqual([{ version: 1, dispatched_at: '', snapshot: expect.objectContaining({ route_id: 'DCT', std_z: '0100Z' }) }]);
  });

  it('returns an empty array for a null/undefined flight', () => {
    expect(getOfpHistory(null)).toEqual([]);
    expect(getOfpHistory(undefined)).toEqual([]);
  });
});

describe('diffOfpSnapshots', () => {
  it('flags only the fields that actually differ', () => {
    const oldSnap = { route_id: 'DCT', std_z: '0100Z', fuel_trip_ofp: 10, alternates: [{ icao: 'RJBB' }] };
    const newSnap = { route_id: 'DCT', std_z: '0200Z', fuel_trip_ofp: 12, alternates: [{ icao: 'RJBB' }] };
    const rows = diffOfpSnapshots(oldSnap, newSnap);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(byLabel['Route'].changed).toBe(false);
    expect(byLabel['STD'].changed).toBe(true);
    expect(byLabel['STD']).toMatchObject({ oldVal: '0100Z', newVal: '0200Z' });
    expect(byLabel['Trip Fuel'].changed).toBe(true);
    expect(byLabel['Trip Fuel']).toMatchObject({ oldVal: '10.0T', newVal: '12.0T' });
    expect(byLabel['Alternates'].changed).toBe(false);
  });

  it('formats missing alternates/navlog honestly instead of crashing', () => {
    const rows = diffOfpSnapshots({}, {});
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(byLabel['Alternates'].oldVal).toBe('NIL');
    expect(byLabel['Navlog'].oldVal).toBe('0 waypoints');
  });
});
