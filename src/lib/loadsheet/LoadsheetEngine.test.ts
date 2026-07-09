import { describe, expect, it } from 'vitest';
import { LoadsheetEngine, PAX_CLASS_WEIGHTS, getMainTankCapacity, getWaterWeight } from './LoadsheetEngine';
import { AIRCRAFT_REGISTRY } from './MockAHM';
import type { FlightPayload } from './types';

const b773 = AIRCRAFT_REGISTRY['B-HNQ'];
const b77w = AIRCRAFT_REGISTRY['B-KPA'];

const emptyPayload = (overrides: Partial<FlightPayload> = {}): FlightPayload => ({
  pax: {},
  cargo: { hold1: 0, hold2: 0, hold3: 0, hold4: 0, bulk: 0 },
  waterFraction: 1,
  fuel: { takeoff: 0, trip: 0, isStandard: false, tanks: { leftMain: 0, center: 0, rightMain: 0 } },
  ...overrides,
});

describe('PAX_CLASS_WEIGHTS', () => {
  it('has all three cabin classes', () => {
    expect(PAX_CLASS_WEIGHTS.J).toBe(85);
    expect(PAX_CLASS_WEIGHTS.W).toBe(83);
    expect(PAX_CLASS_WEIGHTS.Y).toBe(81);
  });
});

describe('getMainTankCapacity', () => {
  it('returns a different real per-aircraft cap for B773 vs B77W (not the old flat 29600)', () => {
    const b773Cap = getMainTankCapacity(b773);
    const b77wCap = getMainTankCapacity(b77w);
    expect(b773Cap).toBe(29674);
    expect(b77wCap).toBe(31500);
    expect(b773Cap).not.toBe(b77wCap);
  });
});

describe('getWaterWeight', () => {
  it('matches the AHM table for a known fraction', () => {
    expect(getWaterWeight(b773, 15)).toEqual({ fraction: 15, weight: 805, index: 53 });
  });

  it('falls back to zero for an unknown fraction', () => {
    expect(getWaterWeight(b773, 999)).toEqual({ weight: 0, index: 0 });
  });
});

describe('LoadsheetEngine.calculateWeights (W-class fix)', () => {
  it('no longer silently prices a W-class zone at the Y rate', () => {
    // B77W's zoneOB is primaryClass "W"
    const payload = emptyPayload({ pax: { zoneOB: 10 } });
    const engine = new LoadsheetEngine(b77w, payload);
    const weights = engine.calculateWeights();

    expect(weights.totalPaxWeight).toBe(10 * PAX_CLASS_WEIGHTS.W);
    expect(weights.totalPaxWeight).not.toBe(10 * PAX_CLASS_WEIGHTS.Y);
  });

  it('still prices J and Y zones correctly', () => {
    const payload = emptyPayload({ pax: { zoneOA: 5, zoneOC: 20 } }); // B77W: zoneOA=J, zoneOC=Y
    const engine = new LoadsheetEngine(b77w, payload);
    const weights = engine.calculateWeights();

    expect(weights.totalPaxWeight).toBe(5 * PAX_CLASS_WEIGHTS.J + 20 * PAX_CLASS_WEIGHTS.Y);
  });
});
