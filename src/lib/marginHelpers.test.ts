import { describe, expect, it } from 'vitest';
import { getMargin, getMarginColor, getMarginStr, getZfwValue } from './marginHelpers';
import { calculateFuelEngine } from './fuelCalculator';

const baseFlight = {
  weight_zfw_ofp: 180.0,
  fuel_taxi_ofp: 1.0,
  fuel_trip_ofp: 20.0,
  fuel_cont_ofp: 1.0,
  fuel_reserve_ofp: 3.0,
  fuel_altn_ofp: 2.0,
  altn_icao: 'RJOO',
};

describe('marginHelpers', () => {
  it('flags over-limit as red/bold, under-limit as neutral', () => {
    expect(getMarginColor(0.5)).toContain('FF1744');
    expect(getMarginColor(-0.5)).toContain('8fa0a6');
  });

  it('getMargin subtracts the limit (converted from kg to tons) from the value', () => {
    expect(getMargin(200, 263000)).toBeCloseTo(200 - 263);
  });

  it('getMarginStr prefixes a plus sign only when over limit', () => {
    expect(getMarginStr(1.2)).toBe('+1.2');
    expect(getMarginStr(-1.2)).toBe('-1.2');
  });

  it('getZfwValue returns 0 (not a fabricated fallback like the old 205) when calc is missing', () => {
    expect(getZfwValue(null)).toBe(0);
    expect(getZfwValue(undefined)).toBe(0);
  });

  it('getZfwValue mirrors calculateFuelEngine\'s own ZFW selection logic', () => {
    const calc = calculateFuelEngine(baseFlight);
    expect(getZfwValue(calc)).toBeCloseTo(calc.showRevVal ? calc.actualZfw : calc.ofpZfw);
  });
});
