import { describe, expect, it } from 'vitest';
import { DG_ITEM_POOL, generateRandomNotoc } from './dgRegistry';

describe('generateRandomNotoc', () => {
  it('always produces items whose fields come from the known DG pool', () => {
    for (let i = 0; i < 200; i++) {
      const notoc = generateRandomNotoc();
      for (const item of notoc.items) {
        const match = DG_ITEM_POOL.find((p) => p.un_number === item.un_number);
        expect(match).toBeDefined();
        expect(item.proper_shipping_name).toBe(match!.proper_shipping_name);
        expect(item.class_division).toBe(match!.class_division);
        expect(item.packing_group).toBe(match!.packing_group);
      }
    }
  });

  it('hasDg is true if and only if there is at least one item', () => {
    for (let i = 0; i < 200; i++) {
      const notoc = generateRandomNotoc();
      expect(notoc.hasDg).toBe(notoc.items.length > 0);
    }
  });

  it('never picks more than 2 items', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateRandomNotoc().items.length).toBeLessThanOrEqual(2);
    }
  });

  it('assigns every item a valid hold position', () => {
    const validPositions = ["H1", "H2", "H3", "H4", "BULK"];
    for (let i = 0; i < 200; i++) {
      const notoc = generateRandomNotoc();
      for (const item of notoc.items) {
        expect(validPositions).toContain(item.position);
      }
    }
  });

  it('a NIL (no dangerous goods) outcome is reachable, not just an edge case', () => {
    const results = Array.from({ length: 200 }, () => generateRandomNotoc());
    const nilCount = results.filter((r) => !r.hasDg).length;
    // 0 件先係最常見結果——理應係大多數 run 都出現 NIL
    expect(nilCount).toBeGreaterThan(50);
  });

  it('stamps a valid ISO timestamp', () => {
    const notoc = generateRandomNotoc();
    expect(() => new Date(notoc.generated_at).toISOString()).not.toThrow();
  });
});
