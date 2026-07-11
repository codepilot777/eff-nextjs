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

describe('LoadsheetEngine.checkLimits (custom limit override)', () => {
  it('checks against the AHM system limits when no override is given (unchanged default behavior)', () => {
    const lightPayload = emptyPayload({ pax: { zoneOA: 5 } });
    const lightEngine = new LoadsheetEngine(b773, lightPayload);
    expect(lightEngine.checkLimits().errors.isZFWExceeded).toBe(false);

    // Fabricate a payload whose ZFW is deliberately above B-HNQ's real MZFW (224528kg)
    // by loading every cabin zone to capacity plus every cargo hold to its max weight
    const heavyPayload = emptyPayload({
      pax: { zoneOA: 42, zoneOB: 60, zoneOC: 150, zoneOD: 186 },
      cargo: { hold1: 15105, hold2: 25400, hold3: 20140, hold4: 11611, bulk: 4082 },
    });
    const heavyEngine = new LoadsheetEngine(b773, heavyPayload);
    const heavyZfw = heavyEngine.calculateWeights().ZFW;
    expect(heavyZfw).toBeGreaterThan(b773.limits.MZFW);
    expect(heavyEngine.checkLimits().errors.isZFWExceeded).toBe(true);
  });

  it('checks against the override limits instead of the AHM system limits when given', () => {
    const payload = emptyPayload({ pax: { zoneOA: 5 } }); // light payload, well under any real limit
    const engine = new LoadsheetEngine(b773, payload);
    const zfw = engine.calculateWeights().ZFW;

    // A tight custom MZFW below the actual ZFW should now trip the exceeded flag,
    // even though the AHM system MZFW (224528kg) would not
    const tight = engine.checkLimits({ MZFW: zfw - 1 });
    expect(tight.errors.isZFWExceeded).toBe(true);
    expect(tight.isValid).toBe(false);

    const loose = engine.checkLimits({ MZFW: zfw + 1 });
    expect(loose.errors.isZFWExceeded).toBe(false);
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
