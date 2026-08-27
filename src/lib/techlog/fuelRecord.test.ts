import { describe, expect, it } from 'vitest';
import { computeFuelDerived, deriveHistoricalFuelRecord } from './fuelRecord';

describe('computeFuelDerived', () => {
  it('computes expected uplift as the gap between total departure fuel and FOB before uplift', () => {
    const { expectedUplift } = computeFuelDerived(25.0, 33.0, 8.0);
    expect(expectedUplift).toBeCloseTo(8.0);
  });

  it('never returns a negative expected uplift (FOB already exceeds the requested departure fuel)', () => {
    const { expectedUplift } = computeFuelDerived(30.0, 25.0, 0);
    expect(expectedUplift).toBe(0);
  });

  it('computes discrepancy as actual minus expected, positive when over-fuelled', () => {
    const { discrepancy } = computeFuelDerived(25.0, 33.0, 9.0);
    expect(discrepancy).toBeCloseTo(1.0);
  });

  it('computes discrepancy as negative when under-fuelled', () => {
    const { discrepancy } = computeFuelDerived(25.0, 33.0, 7.0);
    expect(discrepancy).toBeCloseTo(-1.0);
  });

  it('discrepancy is zero when actual uplift exactly matches expected uplift', () => {
    const { discrepancy } = computeFuelDerived(25.0, 33.0, 8.0);
    expect(discrepancy).toBe(0);
  });
});

describe('deriveHistoricalFuelRecord', () => {
  it('derives total departure fuel as the prior sector\'s arrival fuel plus this sector\'s uplift', () => {
    const r = deriveHistoricalFuelRecord('20.0', '5.0');
    expect(r.fobBefore).toBe(5.0);
    expect(r.actualUplift).toBe(20.0);
    expect(r.totalDeparture).toBe(25.0);
  });

  it('assumes zero discrepancy and expected uplift equal to actual (no historical record of a planned figure)', () => {
    const r = deriveHistoricalFuelRecord('20.0', '5.0');
    expect(r.expectedUplift).toBe(20.0);
    expect(r.discrepancy).toBe(0);
  });

  it('falls back to a sensible default FOB when there is no prior sector', () => {
    const r = deriveHistoricalFuelRecord('12.0', undefined);
    expect(r.fobBefore).toBe(10.5);
    expect(r.totalDeparture).toBe(22.5);
  });
});
