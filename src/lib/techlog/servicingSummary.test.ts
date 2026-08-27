import { describe, expect, it } from 'vitest';
import { generateServicingQuantities } from './servicingSummary';

function isIntInRange(n: number, min: number, max: number) {
  return Number.isInteger(n) && n >= min && n <= max;
}

describe('generateServicingQuantities', () => {
  it('always returns integers within their documented ranges, seeded or not', () => {
    for (const seed of [undefined, 'SEC-1001', 'SEC-9999']) {
      for (let i = 0; i < 20; i++) {
        const q = generateServicingQuantities(seed);
        expect(isIntInRange(q.engineOil, 1, 3)).toBe(true);
        expect(isIntInRange(q.hydFluid, 1, 2)).toBe(true);
        expect(isIntInRange(q.idgOil, 0, 2)).toBe(true);
        expect(isIntInRange(q.apuOil, 0, 2)).toBe(true);
        expect(isIntInRange(q.potableWater, 85, 100)).toBe(true);
      }
    }
  });

  it('the same seed always produces the same quantities (stable when re-selecting a history sector)', () => {
    const a = generateServicingQuantities('SEC-1010');
    const b = generateServicingQuantities('SEC-1010');
    expect(a).toEqual(b);
  });

  it('different seeds usually produce different quantities', () => {
    const results = new Set(
      Array.from({ length: 10 }, (_, i) => JSON.stringify(generateServicingQuantities(`SEC-${i}`)))
    );
    expect(results.size).toBeGreaterThan(1);
  });
});
