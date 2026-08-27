import { describe, expect, it } from 'vitest';
import { computeFuelDerived } from './fuelRecord';

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
