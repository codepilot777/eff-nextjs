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

describe('LoadsheetEngine.calculateCG (pax index fix — per-passenger, not per-100kg)', () => {
  // 🌟 真實 Cathay B777-300 Weight & Balance Folder 嘅 Index Table 入面，客艙座位嘅
  // indexFactor 係「每位乘客」直接嘅指數（同機艙位置有關，同嗰位客實際幾重完全無關），
  // 淨係 cargo/galley 嘅 Deadload 先係「per 100kg or part thereof」。之前個 code 錯咗，
  // 將 pax 都當 cargo 咁樣做 (weight/100)*factor 折算
  it('applies the pax zone indexFactor as count × factor, not (weight/100) × factor', () => {
    const payload = emptyPayload({ pax: { zoneOD: 100 }, waterFraction: 0 });
    const engine = new LoadsheetEngine(b773, payload);
    const cg = engine.calculateCG();

    // B-HNQ: BI=745, crewPantry.index=-4.91, water(fraction 0)=0, zoneOD indexFactor=4
    const expectedLIZFW = 745 + (-4.91) + 0 + (100 * 4);
    expect(cg.LIZFW).toBeCloseTo(expectedLIZFW);

    // The old buggy formula would have given (100*81/100)*4 = 324 instead of 100*4 = 400
    const buggyLIZFW = 745 + (-4.91) + 0 + ((100 * 81 / 100) * 4);
    expect(cg.LIZFW).not.toBeCloseTo(buggyLIZFW);
    expect(cg.LIZFW).toBeGreaterThan(buggyLIZFW); // real per-pax index is always the larger figure (class weights are all < 100kg)
  });

  it('matches a hand-computed full-load LIZFW against the real Cathay Index Table figures', () => {
    // Full 77P load: OA=42(J), OB=60(Y), OC=150(Y), OD=186(Y); cargo maxed out; waterFraction=1
    const payload = emptyPayload({
      pax: { zoneOA: 42, zoneOB: 60, zoneOC: 150, zoneOD: 186 },
      cargo: { hold1: 15105, hold2: 25400, hold3: 20140, hold4: 11611, bulk: 4082 },
      waterFraction: 1,
    });
    const engine = new LoadsheetEngine(b773, payload);
    const cg = engine.calculateCG();

    // pax (count × factor): 42*-5 + 60*-2 + 150*1 + 186*4 = 564
    // cargo (weight/100 × factor, unchanged): -906.3 -762 +604.2 +580.55 +244.92 = -238.63
    // BI 745, crewPantry.index -4.91, water(fraction 1) index 4
    const expectedLIZFW = 745 + (-4.91) + 4 + 564 + (-238.63);
    expect(cg.LIZFW).toBeCloseTo(expectedLIZFW, 1);
  });

  it('cargo index is unaffected by the fix (still (weight/100) × factor)', () => {
    const payload = emptyPayload({ cargo: { hold1: 15105, hold2: 0, hold3: 0, hold4: 0, bulk: 0 }, waterFraction: 0 });
    const engine = new LoadsheetEngine(b773, payload);
    const cg = engine.calculateCG();

    const expectedLIZFW = 745 + (-4.91) + 0 + 0 + ((15105 / 100) * -6);
    expect(cg.LIZFW).toBeCloseTo(expectedLIZFW);
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
