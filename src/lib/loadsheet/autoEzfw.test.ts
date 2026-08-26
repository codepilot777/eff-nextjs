import { describe, expect, it } from 'vitest';
import { computeEzfwTimeZ, distributePaxAcrossZones, distributeCargoAcrossHolds, buildAutoEzfwSnapshot } from './autoEzfw';
import { AIRCRAFT_REGISTRY } from './MockAHM';

const bhnq = AIRCRAFT_REGISTRY['B-HNQ']; // zoneOA:42(J) zoneOB:60(Y) zoneOC:150(Y) zoneOD:186(Y) = 438 total
const bkpa = AIRCRAFT_REGISTRY['B-KPA']; // 5 pax zones

describe('computeEzfwTimeZ', () => {
  it('subtracts exactly 120 minutes from STD', () => {
    // 2026-01-15 08:00:00Z -> 06:00:00Z
    const stdUnix = Date.UTC(2026, 0, 15, 8, 0, 0) / 1000;
    expect(computeEzfwTimeZ(stdUnix)).toBe('0600Z');
  });

  it('wraps correctly across midnight', () => {
    // 2026-01-15 01:00:00Z -> 2026-01-14 23:00:00Z
    const stdUnix = Date.UTC(2026, 0, 15, 1, 0, 0) / 1000;
    expect(computeEzfwTimeZ(stdUnix)).toBe('2300Z');
  });

  it('returns a fallback for a missing/zero STD', () => {
    expect(computeEzfwTimeZ(0)).toBe('0000Z');
  });
});

describe('distributePaxAcrossZones', () => {
  it('splits proportionally by zone capacity and the total matches exactly', () => {
    const result = distributePaxAcrossZones(bhnq, 438); // full load, matches total capacity exactly
    const zoneKeys = Object.keys(bhnq.stations.pax);
    const sum = zoneKeys.reduce((s, k) => s + result[k], 0);
    expect(sum).toBe(438);
    // 42/60/150/186 capacity ratio at 100% load factor -> exactly matches capacity
    expect(result[zoneKeys[0]]).toBe(42);
    expect(result[zoneKeys[1]]).toBe(60);
    expect(result[zoneKeys[2]]).toBe(150);
    expect(result[zoneKeys[3]]).toBe(186);
  });

  it('the total always matches the (clamped) requested pax count, even with rounding', () => {
    const result = distributePaxAcrossZones(bhnq, 219); // 50% load factor, forces rounding
    const sum = Object.values(result).reduce((s, v) => s + v, 0);
    expect(sum).toBe(219);
  });

  it('clamps to total capacity instead of overbooking a zone', () => {
    const result = distributePaxAcrossZones(bhnq, 9999);
    const sum = Object.values(result).reduce((s, v) => s + v, 0);
    expect(sum).toBe(438); // never exceeds total AHM capacity
  });

  it('handles zero pax without throwing', () => {
    const result = distributePaxAcrossZones(bhnq, 0);
    expect(Object.values(result).every((v) => v === 0)).toBe(true);
  });

  it('works for an aircraft with a 5th pax zone', () => {
    const zoneKeys = Object.keys(bkpa.stations.pax);
    expect(zoneKeys.length).toBe(5);
    const result = distributePaxAcrossZones(bkpa, 200);
    const sum = zoneKeys.reduce((s, k) => s + result[k], 0);
    expect(sum).toBe(200);
  });
});

describe('distributeCargoAcrossHolds', () => {
  it('splits proportionally by hold capacity and the total matches exactly', () => {
    const result = distributeCargoAcrossHolds(bhnq, 14877); // matches the real SimBrief sample used to design this feature
    const sum = result.h1 + result.h2 + result.h3 + result.h4 + result.bulk;
    expect(sum).toBe(14877);
  });

  it('clamps to total hold capacity instead of overloading', () => {
    const result = distributeCargoAcrossHolds(bhnq, 999999);
    const sum = result.h1 + result.h2 + result.h3 + result.h4 + result.bulk;
    const totalCapacity = bhnq.stations.cargo.hold1.maxWeight + bhnq.stations.cargo.hold2.maxWeight
      + bhnq.stations.cargo.hold3.maxWeight + bhnq.stations.cargo.hold4.maxWeight + bhnq.stations.cargo.bulk.maxWeight;
    expect(sum).toBe(totalCapacity);
  });

  it('handles zero cargo without throwing', () => {
    const result = distributeCargoAcrossHolds(bhnq, 0);
    expect(result).toEqual({ h1: 0, h2: 0, h3: 0, h4: 0, bulk: 0 });
  });

  it('regression: returns short h1-h4 snapshot keys, not the AHM\'s long hold1-hold4 keys, so buildEnginePayload\'s snapshot.cargo?.h1 lookup actually finds the values', () => {
    // 曾經喺度撞過：以前呢個 function 直接攞 AHM 個 "hold1"/"hold2".../"bulk" key
    // 做返個 snapshot 嘅 key，但 buildEnginePayload 讀緊嘅係 snapshot.cargo?.h1——
    // 撈亂咗令 LoadsheetEngine 計 totalCargoWeight 淨係得返 bulk 嗰份，其餘 4 個
    // hold 靜靜雞跌晒去 0
    const result = distributeCargoAcrossHolds(bhnq, 14877);
    expect(Object.keys(result).sort()).toEqual(['bulk', 'h1', 'h2', 'h3', 'h4']);
    expect(result.h1).toBeGreaterThan(0);
    expect(result.h2).toBeGreaterThan(0);
    expect(result.h3).toBeGreaterThan(0);
    expect(result.h4).toBeGreaterThan(0);
  });
});

describe('buildAutoEzfwSnapshot', () => {
  it('builds a snapshot whose pax/cargo/fuel each sum to the requested totals', () => {
    // mirrors the real SimBrief sample this feature was designed against:
    // pax_count_actual=438, cargo=14877, fuel.plan_ramp=49322
    const snapshot = buildAutoEzfwSnapshot(bhnq, 438, 14877, 49322);
    const paxSum = Object.values(snapshot.pax).reduce((s, v) => s + v, 0);
    const cargoSum = snapshot.cargo.h1 + snapshot.cargo.h2 + snapshot.cargo.h3 + snapshot.cargo.h4 + snapshot.cargo.bulk;
    const fuelSum = snapshot.fuel.left + snapshot.fuel.center + snapshot.fuel.right;
    expect(paxSum).toBe(438);
    expect(cargoSum).toBe(14877);
    expect(fuelSum).toBe(49322);
  });
});
